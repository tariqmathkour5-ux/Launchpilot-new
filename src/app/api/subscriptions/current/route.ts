import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getUserSubscription,
  getUserPlanLimits,
  createSubscription,
  cancelSubscription,
  changeSubscription,
} from '@/lib/subscriptions';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const subscription = await getUserSubscription(session.user.id);
  const limits = await getUserPlanLimits(session.user.id);

  const usage = await prisma.$queryRaw<Array<{ metric: string; count: number }>>`
    SELECT metric, count FROM usage_tracking
    WHERE user_id = ${session.user.id}
      AND period_start <= now() AND period_end > now()
  `;

  return NextResponse.json({
    subscription,
    plan: subscription ? { name: subscription.plan_name, slug: subscription.plan_slug } : { name: 'Free', slug: 'free' },
    limits,
    usage: Object.fromEntries(usage.map(u => [u.metric, u.count])),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan, billing_cycle, coupon_code } = await request.json();

  if (!plan || !billing_cycle) {
    return NextResponse.json({ error: 'plan and billing_cycle required' }, { status: 400 });
  }

  const result = await createSubscription(session.user.id, plan, billing_cycle, coupon_code);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, subscriptionId: result.subscriptionId });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, plan, billing_cycle, immediate } = await request.json();

  if (action === 'cancel') {
    const result = await cancelSubscription(session.user.id, immediate);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  if (action === 'change') {
    if (!plan) return NextResponse.json({ error: 'plan required for change' }, { status: 400 });
    const result = await changeSubscription(session.user.id, plan, billing_cycle);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
