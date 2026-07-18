import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.$queryRaw<Array<{ role: string }>>`
    SELECT role FROM "User" WHERE id = ${userId}
  `;
  return user.length > 0 && user[0].role === 'ADMIN';
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get('tab') || 'subscribers';

  if (tab === 'plans') {
    const plans = await prisma.$queryRaw<any[]>`
      SELECT sp.*,
        (SELECT COUNT(*) FROM user_subscriptions us WHERE us.plan_id = sp.id AND us.status IN ('active', 'trialing')) as active_subscribers
      FROM subscription_plans sp ORDER BY sp.sort_order
    `;
    return NextResponse.json(plans.map(p => ({ ...p, active_subscribers: Number(p.active_subscribers) })));
  }

  if (tab === 'subscribers') {
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;
    const status = searchParams.get('status');

    let subscribers;
    if (status) {
      subscribers = await prisma.$queryRaw<any[]>`
        SELECT us.*, u.name as user_name, u.email as user_email, sp.name as plan_name, sp.slug as plan_slug
        FROM user_subscriptions us
        JOIN "User" u ON u.id = us.user_id
        JOIN subscription_plans sp ON sp.id = us.plan_id
        WHERE us.status = ${status}
        ORDER BY us.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      subscribers = await prisma.$queryRaw<any[]>`
        SELECT us.*, u.name as user_name, u.email as user_email, sp.name as plan_name, sp.slug as plan_slug
        FROM user_subscriptions us
        JOIN "User" u ON u.id = us.user_id
        JOIN subscription_plans sp ON sp.id = us.plan_id
        ORDER BY us.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const total = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM user_subscriptions
      ${status ? prisma.$queryRaw`WHERE status = ${status}` : prisma.$queryRaw``}
    `;

    return NextResponse.json({ subscribers, total: Number(total[0]?.count || 0), page, limit });
  }

  if (tab === 'coupons') {
    const coupons = await prisma.$queryRaw<any[]>`
      SELECT sc.*, u.name as created_by_name
      FROM subscription_coupons sc
      LEFT JOIN "User" u ON u.id = sc.created_by
      ORDER BY sc.created_at DESC
    `;
    return NextResponse.json(coupons);
  }

  if (tab === 'invoices') {
    const invoices = await prisma.$queryRaw<any[]>`
      SELECT i.*, u.name as user_name, u.email as user_email
      FROM invoices i
      LEFT JOIN "User" u ON u.id = i.user_id
      ORDER BY i.created_at DESC
      LIMIT 50
    `;
    return NextResponse.json(invoices);
  }

  if (tab === 'events') {
    const events = await prisma.$queryRaw<any[]>`
      SELECT se.*, u.name as user_name,
        fp.name as from_plan_name, tp.name as to_plan_name
      FROM subscription_events se
      LEFT JOIN "User" u ON u.id = se.user_id
      LEFT JOIN subscription_plans fp ON fp.id = se.from_plan_id
      LEFT JOIN subscription_plans tp ON tp.id = se.to_plan_id
      ORDER BY se.created_at DESC
      LIMIT 100
    `;
    return NextResponse.json(events);
  }

  return NextResponse.json({ error: 'Invalid tab' }, { status: 400 });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { action } = body;

  if (action === 'create_plan') {
    const { name, slug, description, monthly_price, yearly_price, trial_days, features, limits, sort_order } = body;
    await prisma.$executeRaw`
      INSERT INTO subscription_plans (name, slug, description, monthly_price, yearly_price, trial_days, features, limits, sort_order)
      VALUES (${name}, ${slug}, ${description || null}, ${monthly_price || 0}, ${yearly_price || 0}, ${trial_days || 0}, ${JSON.stringify(features || [])}::jsonb, ${JSON.stringify(limits || {})}::jsonb, ${sort_order || 0})
    `;
    return NextResponse.json({ success: true });
  }

  if (action === 'update_plan') {
    const { id, name, description, monthly_price, yearly_price, trial_days, features, limits, is_active } = body;
    await prisma.$executeRaw`
      UPDATE subscription_plans SET
        name = COALESCE(${name || null}, name),
        description = COALESCE(${description ?? null}, description),
        monthly_price = COALESCE(${monthly_price ?? null}::numeric, monthly_price),
        yearly_price = COALESCE(${yearly_price ?? null}::numeric, yearly_price),
        trial_days = COALESCE(${trial_days ?? null}::integer, trial_days),
        features = COALESCE(${features ? JSON.stringify(features) : null}::jsonb, features),
        limits = COALESCE(${limits ? JSON.stringify(limits) : null}::jsonb, limits),
        is_active = COALESCE(${is_active ?? null}::boolean, is_active),
        updated_at = now()
      WHERE id = ${id}::uuid
    `;
    return NextResponse.json({ success: true });
  }

  if (action === 'create_coupon') {
    const { code, name, discount_type, discount_value, currency, max_redemptions, valid_from, valid_until, applicable_plans } = body;
    await prisma.$executeRaw`
      INSERT INTO subscription_coupons (code, name, discount_type, discount_value, currency, max_redemptions, valid_from, valid_until, applicable_plans, created_by)
      VALUES (${code.toUpperCase()}, ${name}, ${discount_type}, ${discount_value}, ${currency || 'USD'}, ${max_redemptions || null}, ${valid_from ? new Date(valid_from) : new Date()}, ${valid_until ? new Date(valid_until) : null}, ${JSON.stringify(applicable_plans || [])}::jsonb, ${session.user.id})
    `;
    return NextResponse.json({ success: true });
  }

  if (action === 'update_coupon') {
    const { id, is_active, name, max_redemptions } = body;
    await prisma.$executeRaw`
      UPDATE subscription_coupons SET
        is_active = COALESCE(${is_active ?? null}::boolean, is_active),
        name = COALESCE(${name || null}, name),
        max_redemptions = COALESCE(${max_redemptions ?? null}::integer, max_redemptions)
      WHERE id = ${id}::uuid
    `;
    return NextResponse.json({ success: true });
  }

  if (action === 'refund_invoice') {
    const { invoice_id } = body;
    await prisma.$executeRaw`
      UPDATE invoices SET status = 'refunded', updated_at = now() WHERE id = ${invoice_id}::uuid
    `;
    return NextResponse.json({ success: true });
  }

  if (action === 'cancel_subscription') {
    const { subscription_id, user_id } = body;
    await prisma.$executeRaw`
      UPDATE user_subscriptions SET status = 'canceled', canceled_at = now(), updated_at = now()
      WHERE id = ${subscription_id}::uuid
    `;
    await prisma.$executeRaw`
      INSERT INTO subscription_events (subscription_id, user_id, event_type, metadata)
      VALUES (${subscription_id}::uuid, ${user_id}, 'canceled', '{"by": "admin"}'::jsonb)
    `;
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
