import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { getPlanBySlug, getUserSubscription } from '@/lib/subscriptions';

export async function POST(request: Request) {
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
  }

  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { plan: planSlug, billing_cycle } = await request.json();

  if (!planSlug || !billing_cycle) {
    return NextResponse.json({ error: 'plan and billing_cycle required' }, { status: 400 });
  }

  const plan = await getPlanBySlug(planSlug);
  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  if (planSlug === 'free') {
    return NextResponse.json({ error: 'Cannot subscribe to free plan via Stripe' }, { status: 400 });
  }

  // Check if user already has an active subscription
  const existingSubscription = await getUserSubscription(session.user.id);
  if (existingSubscription && existingSubscription.plan_slug !== 'free') {
    return NextResponse.json({ error: 'Already has active subscription' }, { status: 400 });
  }

  // Create or retrieve Stripe customer
  const existingSub = existingSubscription as any;
  let stripeCustomerId = existingSub?.payment_provider === 'stripe' 
    ? existingSub?.stripeCustomerId 
    : null;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: {
        userId: session.user.id,
      },
    });
    stripeCustomerId = customer.id;
  }

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: billing_cycle === 'yearly' ? plan.yearly_price : plan.monthly_price,
          recurring: {
            interval: billing_cycle === 'yearly' ? 'year' : 'month',
          },
          product_data: {
            name: `${plan.name} Plan - ${billing_cycle === 'yearly' ? 'Annual' : 'Monthly'}`,
            description: plan.description || undefined,
            metadata: {
              planSlug: plan.slug,
            },
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/subscription?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
    metadata: {
      userId: session.user.id,
      planSlug: plan.slug,
      billingCycle: billing_cycle,
    },
    subscription_data: plan.trial_days > 0 ? {
      trial_period_days: plan.trial_days,
      metadata: {
        userId: session.user.id,
        planSlug: plan.slug,
      },
    } : undefined,
  });

  return NextResponse.json({ 
    success: true, 
    checkoutUrl: checkoutSession.url,
    sessionId: checkoutSession.id,
  });
}