import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.$queryRaw<Array<{ role: string }>>`
    SELECT role FROM "User" WHERE id = ${session.user.id}
  `;
  if (user.length === 0 || user[0].role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // MRR calculation
  const mrr = await prisma.$queryRaw<Array<{ mrr: number }>>`
    SELECT COALESCE(SUM(
      CASE WHEN us.billing_cycle = 'monthly' THEN sp.monthly_price
           WHEN us.billing_cycle = 'yearly' THEN sp.yearly_price / 12
           ELSE 0 END
    ), 0)::float as mrr
    FROM user_subscriptions us
    JOIN subscription_plans sp ON sp.id = us.plan_id
    WHERE us.status IN ('active', 'trialing')
  `;

  // Active subscribers count
  const activeCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM user_subscriptions WHERE status IN ('active', 'trialing')
  `;

  // Trial count
  const trialCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM user_subscriptions WHERE status = 'trialing'
  `;

  // Trial conversion (trials that became active)
  const trialConverted = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(DISTINCT user_id) as count FROM subscription_events
    WHERE event_type = 'trial_ended'
      AND user_id IN (SELECT user_id FROM user_subscriptions WHERE status = 'active')
  `;

  const totalTrials = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM subscription_events WHERE event_type = 'trial_started'
  `;

  // Churn (canceled in last 30 days vs active at start)
  const recentCanceled = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM user_subscriptions
    WHERE status = 'canceled' AND canceled_at > now() - interval '30 days'
  `;

  // Revenue by plan
  const revenueByPlan = await prisma.$queryRaw<Array<{ plan_name: string; subscriber_count: bigint; revenue: number }>>`
    SELECT sp.name as plan_name,
      COUNT(*) as subscriber_count,
      SUM(CASE WHEN us.billing_cycle = 'monthly' THEN sp.monthly_price ELSE sp.yearly_price / 12 END)::float as revenue
    FROM user_subscriptions us
    JOIN subscription_plans sp ON sp.id = us.plan_id
    WHERE us.status IN ('active', 'trialing')
    GROUP BY sp.name, sp.sort_order
    ORDER BY sp.sort_order
  `;

  // Monthly revenue trend (last 6 months)
  const revenueTrend = await prisma.$queryRaw<Array<{ month: string; revenue: number; new_subscribers: bigint }>>`
    SELECT
      TO_CHAR(DATE_TRUNC('month', i.created_at), 'YYYY-MM') as month,
      COALESCE(SUM(i.amount), 0)::float as revenue,
      (SELECT COUNT(*) FROM user_subscriptions us2 WHERE DATE_TRUNC('month', us2.created_at) = DATE_TRUNC('month', i.created_at)) as new_subscribers
    FROM invoices i
    WHERE i.status = 'paid' AND i.created_at > now() - interval '6 months'
    GROUP BY DATE_TRUNC('month', i.created_at)
    ORDER BY month
  `;

  // Recent events
  const recentEvents = await prisma.$queryRaw<Array<{
    event_type: string; user_name: string; plan_name: string; created_at: Date;
  }>>`
    SELECT se.event_type, u.name as user_name, COALESCE(tp.name, fp.name) as plan_name, se.created_at
    FROM subscription_events se
    LEFT JOIN "User" u ON u.id = se.user_id
    LEFT JOIN subscription_plans tp ON tp.id = se.to_plan_id
    LEFT JOIN subscription_plans fp ON fp.id = se.from_plan_id
    ORDER BY se.created_at DESC
    LIMIT 20
  `;

  const mrrValue = mrr[0]?.mrr || 0;
  const activeSubscribers = Number(activeCount[0]?.count || 0);
  const trialing = Number(trialCount[0]?.count || 0);
  const totalTrialCount = Number(totalTrials[0]?.count || 0);
  const conversionRate = totalTrialCount > 0
    ? (Number(trialConverted[0]?.count || 0) / totalTrialCount * 100)
    : 0;
  const churnRate = activeSubscribers > 0
    ? (Number(recentCanceled[0]?.count || 0) / activeSubscribers * 100)
    : 0;
  const arpu = activeSubscribers > 0 ? mrrValue / activeSubscribers : 0;

  return NextResponse.json({
    mrr: mrrValue,
    arr: mrrValue * 12,
    activeSubscribers,
    trialing,
    conversionRate: parseFloat(conversionRate.toFixed(1)),
    churnRate: parseFloat(churnRate.toFixed(1)),
    arpu: parseFloat(arpu.toFixed(2)),
    revenueByPlan: revenueByPlan.map(r => ({ ...r, subscriber_count: Number(r.subscriber_count) })),
    revenueTrend: revenueTrend.map(r => ({ ...r, new_subscribers: Number(r.new_subscribers) })),
    recentEvents,
  });
}
