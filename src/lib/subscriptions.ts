import { prisma } from '@/lib/prisma';
import type { PlanLimits, SubscriptionPlan, UserSubscription } from '@/types/subscriptions';

const FREE_PLAN_LIMITS: PlanLimits = {
  favorites: 5,
  collections: 1,
  collection_items: 10,
  comparisons: 3,
  api_requests: 0,
};

export async function getAllPlans(): Promise<SubscriptionPlan[]> {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  
  return plans.map(plan => ({
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    monthly_price: plan.monthlyPrice,
    yearly_price: plan.yearlyPrice,
    trial_days: plan.trialDays,
    features: plan.features as unknown as string[],
    limits: plan.limits as unknown as PlanLimits,
    sort_order: plan.sortOrder,
    is_active: plan.isActive,
  }));
}

export async function getPlanBySlug(slug: string): Promise<SubscriptionPlan | null> {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { slug },
  });

  if (!plan) return null;

  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    monthly_price: plan.monthlyPrice,
    yearly_price: plan.yearlyPrice,
    trial_days: plan.trialDays,
    features: plan.features as unknown as string[],
    limits: plan.limits as unknown as PlanLimits,
    sort_order: plan.sortOrder,
    is_active: plan.isActive,
  };
}

export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const sub = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: { in: ['active', 'trialing'] },
    },
    include: {
      plan: {
        select: { name: true, slug: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!sub) return null;

  return {
    id: sub.id,
    user_id: sub.userId,
    plan_id: sub.planId,
    status: sub.status,
    billing_cycle: sub.billingCycle,
    current_period_start: sub.currentPeriodStart,
    current_period_end: sub.currentPeriodEnd,
    trial_start: sub.trialStart,
    trial_end: sub.trialEnd,
    canceled_at: sub.canceledAt,
    cancel_at_period_end: sub.cancelAtPeriodEnd,
    payment_provider: sub.paymentProvider,
    plan_name: sub.plan.name,
    plan_slug: sub.plan.slug,
  };
}

export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  const sub = await getUserSubscription(userId);
  if (!sub) return FREE_PLAN_LIMITS;

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: sub.plan_id },
    select: { limits: true },
  });

  return (plan?.limits as unknown as PlanLimits) || FREE_PLAN_LIMITS;
}

export async function getUserPlanSlug(userId: string): Promise<string> {
  const sub = await getUserSubscription(userId);
  return sub?.plan_slug || 'free';
}

export async function checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
  const planSlug = await getUserPlanSlug(userId);

  const featureRequirements: Record<string, string[]> = {
    'unlimited_favorites': ['pro', 'business', 'enterprise'],
    'unlimited_collections': ['pro', 'business', 'enterprise'],
    'advanced_search': ['pro', 'business', 'enterprise'],
    'personalized_recommendations': ['pro', 'business', 'enterprise'],
    'export_comparisons': ['pro', 'business', 'enterprise'],
    'company_dashboard': ['business', 'enterprise'],
    'advanced_analytics': ['business', 'enterprise'],
    'team_members': ['business', 'enterprise'],
    'published_tools': ['business', 'enterprise'],
    'ad_campaigns': ['business', 'enterprise'],
    'api_access': ['business', 'enterprise'],
    'unlimited_api': ['enterprise'],
    'custom_integrations': ['enterprise'],
    'white_label': ['enterprise'],
    'dedicated_support': ['enterprise'],
  };

  const required = featureRequirements[feature];
  if (!required) return true;
  return required.includes(planSlug);
}

export async function checkUsageLimit(userId: string, metric: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = await getUserPlanLimits(userId);
  const limitValue = (limits as any)[metric] ?? 0;

  if (limitValue === -1) return { allowed: true, current: 0, limit: -1 };

  const usage = await prisma.usageTracking.aggregate({
    where: {
      userId,
      metric,
      periodStart: { lte: new Date() },
      periodEnd: { gt: new Date() },
    },
    _sum: { count: true },
  });

  const current = usage._sum.count || 0;
  return { allowed: current < limitValue, current, limit: limitValue };
}

export async function incrementUsage(userId: string, metric: string, amount: number = 1): Promise<void> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  await prisma.usageTracking.upsert({
    where: {
      userId_metric_periodStart: {
        userId,
        metric,
        periodStart,
      },
    },
    update: {
      count: { increment: amount },
    },
    create: {
      userId,
      metric,
      count: amount,
      periodStart,
      periodEnd,
    },
  });
}

export async function createSubscription(
  userId: string,
  planSlug: string,
  billingCycle: 'monthly' | 'yearly',
  couponCode?: string
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  const plan = await getPlanBySlug(planSlug);
  if (!plan) return { success: false, error: 'Plan not found' };
  if (planSlug === 'free') return { success: false, error: 'Cannot subscribe to free plan' };

  const existing = await getUserSubscription(userId);
  if (existing && existing.plan_slug !== 'free') {
    return { success: false, error: 'Already has active subscription' };
  }

  const periodEnd = billingCycle === 'monthly'
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const hasTrial = plan.trial_days > 0;
  const trialEnd = hasTrial ? new Date(Date.now() + plan.trial_days * 24 * 60 * 60 * 1000) : null;

  // Validate coupon if provided
  let couponId: string | null = null;
  if (couponCode) {
    const coupon = await prisma.subscriptionCoupon.findUnique({
      where: { code: couponCode.toUpperCase() },
    });

    if (
      coupon &&
      coupon.isActive &&
      coupon.validFrom <= new Date() &&
      (!coupon.validUntil || coupon.validUntil > new Date()) &&
      (!coupon.maxRedemptions || coupon.currentRedemptions < coupon.maxRedemptions)
    ) {
      couponId = coupon.id;
    }
  }

  // Create the subscription
  const sub = await prisma.userSubscription.create({
    data: {
      userId,
      planId: plan.id,
      status: hasTrial ? 'trialing' : 'active',
      billingCycle,
      currentPeriodEnd: periodEnd,
      trialStart: hasTrial ? new Date() : null,
      trialEnd,
      couponId,
    },
  });

  // Log the event
  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: sub.id,
      userId,
      eventType: hasTrial ? 'trial_started' : 'created',
      toPlanId: plan.id,
    },
  });

  // Increment coupon usage
  if (couponId) {
    await prisma.subscriptionCoupon.update({
      where: { id: couponId },
      data: { currentRedemptions: { increment: 1 } },
    });
  }

  return { success: true, subscriptionId: sub.id };
}

export async function cancelSubscription(userId: string, immediate: boolean = false): Promise<{ success: boolean; error?: string }> {
  const sub = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: { in: ['active', 'trialing'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!sub) return { success: false, error: 'No active subscription' };

  const updates: any = {
    canceledAt: new Date(),
    cancelAtPeriodEnd: !immediate,
  };

  if (immediate) {
    updates.status = 'canceled';
  }

  await prisma.userSubscription.update({
    where: { id: sub.id },
    data: updates,
  });

  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: sub.id,
      userId,
      eventType: 'canceled',
      fromPlanId: sub.planId,
      metadata: JSON.stringify({ immediate }),
    },
  });

  return { success: true };
}

export async function changeSubscription(
  userId: string,
  newPlanSlug: string,
  billingCycle?: 'monthly' | 'yearly'
): Promise<{ success: boolean; error?: string }> {
  const sub = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: { in: ['active', 'trialing'] },
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!sub) return { success: false, error: 'No active subscription' };

  const newPlan = await prisma.subscriptionPlan.findUnique({
    where: { slug: newPlanSlug },
  });

  if (!newPlan) return { success: false, error: 'Plan not found' };

  const isUpgrade = newPlan.sortOrder > sub.plan.sortOrder;
  const cycle = billingCycle || sub.billingCycle;
  const periodEnd = cycle === 'monthly'
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  await prisma.userSubscription.update({
    where: { id: sub.id },
    data: {
      planId: newPlan.id,
      billingCycle: cycle,
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
  });

  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: sub.id,
      userId,
      eventType: isUpgrade ? 'upgraded' : 'downgraded',
      fromPlanId: sub.planId,
      toPlanId: newPlan.id,
    },
  });

  return { success: true };
}

export function formatPrice(cents: number, cycle?: string): string {
  const amount = (cents / 100).toFixed(2);
  if (cycle === 'yearly') return `$${amount}/year`;
  if (cycle === 'monthly') return `$${amount}/mo`;
  return `$${amount}`;
}

// =====================================================
// STRIPE INTEGRATION FUNCTIONS
// =====================================================

export async function createStripeSubscription(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  stripePriceId: string,
  planSlug: string,
  billingCycle: 'monthly' | 'yearly'
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { slug: planSlug },
  });

  if (!plan) return { success: false, error: 'Plan not found' };

  // Check for existing subscription
  const existing = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: { in: ['active', 'trialing'] },
    },
  });

  if (existing) {
    // Update existing subscription with Stripe details
    await prisma.userSubscription.update({
      where: { id: existing.id },
      data: {
        paymentProvider: 'stripe',
        stripeCustomerId,
        stripeSubscriptionId,
        stripePriceId,
        status: 'active',
      },
    });

    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId: existing.id,
        userId,
        eventType: 'stripe_linked',
        metadata: JSON.stringify({ stripeSubscriptionId }),
      },
    });

    return { success: true, subscriptionId: existing.id };
  }

  // Create new subscription
  const sub = await prisma.userSubscription.create({
    data: {
      userId,
      planId: plan.id,
      status: 'active',
      billingCycle,
      paymentProvider: 'stripe',
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: sub.id,
      userId,
      eventType: 'created',
      toPlanId: plan.id,
    },
  });

  return { success: true, subscriptionId: sub.id };
}

export async function handleStripeWebhook(
  stripeSubscriptionId: string,
  status: string,
  currentPeriodEnd?: Date
): Promise<void> {
  const subscription = await prisma.userSubscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (!subscription) return;

  await prisma.userSubscription.update({
    where: { id: subscription.id },
    data: {
      status,
      currentPeriodEnd,
    },
  });

  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      eventType: 'stripe_webhook',
      metadata: JSON.stringify({ status, stripeSubscriptionId }),
    },
  });
}