import { auth } from '@/lib/auth';
import { getUserPlanSlug, getUserSubscription } from '@/lib/subscriptions';
import { redirect } from 'next/navigation';

// Premium features that require a paid subscription
const PREMIUM_FEATURES = [
  'unlimited_favorites',
  'unlimited_collections',
  'advanced_search',
  'personalized_recommendations',
  'export_comparisons',
  'company_dashboard',
  'advanced_analytics',
  'team_members',
  'published_tools',
  'ad_campaigns',
  'api_access',
  'unlimited_api',
  'custom_integrations',
  'white_label',
  'dedicated_support',
];

const PAID_PLAN_SLUGS = ['pro', 'business', 'enterprise'];

/**
 * Check if user has an active subscription (not free)
 */
export async function hasActiveSubscription(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const subscription = await getUserSubscription(session.user.id);
  if (!subscription) return false;

  return subscription.status === 'active' || subscription.status === 'trialing';
}

/**
 * Check if user has a paid plan (not free)
 */
export async function hasPaidPlan(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const planSlug = await getUserPlanSlug(session.user.id);
  return PAID_PLAN_SLUGS.includes(planSlug);
}

/**
 * Get user's plan slug
 */
export async function getPlanSlug(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) return 'free';

  return await getUserPlanSlug(session.user.id);
}

/**
 * Require active subscription or redirect to pricing
 */
export async function requireSubscription(): Promise<void> {
  const hasActive = await hasActiveSubscription();
  if (!hasActive) {
    redirect('/pricing?required=true');
  }
}

/**
 * Require paid plan or redirect to pricing
 */
export async function requirePaidPlan(): Promise<void> {
  const hasPaid = await hasPaidPlan();
  if (!hasPaid) {
    redirect('/pricing?upgrade=true');
  }
}

/**
 * Check if a specific feature is accessible
 */
export async function canAccessFeature(feature: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  // Import here to avoid circular dependency
  const { checkFeatureAccess } = await import('@/lib/subscriptions');
  return checkFeatureAccess(session.user.id, feature);
}