import { NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscription = await stripe!.subscriptions.retrieve(
          session.subscription as string
        ) as any;
        
        const userId = session.metadata?.userId;
        const planSlug = session.metadata?.planSlug;
        const billingCycle = session.metadata?.billingCycle;

        if (userId && planSlug && billingCycle) {
          const plan = await prisma.subscriptionPlan.findUnique({
            where: { slug: planSlug },
          });

          if (plan) {
            // Check if subscription already exists
            let existing = await prisma.userSubscription.findFirst({
              where: { userId },
              orderBy: { createdAt: 'desc' },
            });

            if (existing) {
              // Update existing
              await prisma.userSubscription.update({
                where: { id: existing.id },
                data: {
                  status: 'active',
                  stripeCustomerId: session.customer as string,
                  stripeSubscriptionId: subscription.id,
                  stripePriceId: subscription.items?.data?.[0]?.price?.id || '',
                  paymentProvider: 'stripe',
                },
              });

              await prisma.subscriptionEvent.create({
                data: {
                  subscriptionId: existing.id,
                  userId,
                  eventType: 'stripe_activated',
                  metadata: JSON.stringify({ subscriptionId: subscription.id }),
                },
              });
            } else {
              // Create new
              const newSub = await prisma.userSubscription.create({
                data: {
                  userId,
                  planId: plan.id,
                  status: 'active',
                  billingCycle,
                  paymentProvider: 'stripe',
                  stripeCustomerId: session.customer as string,
                  stripeSubscriptionId: subscription.id,
                  stripePriceId: subscription.items?.data?.[0]?.price?.id || '',
                  currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : new Date(),
                },
              });

              await prisma.subscriptionEvent.create({
                data: {
                  subscriptionId: newSub.id,
                  userId,
                  eventType: 'created',
                  toPlanId: plan.id,
                },
              });
            }
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string };
        if (invoice.subscription) {
          const subscription = await prisma.userSubscription.findFirst({
            where: { stripeSubscriptionId: invoice.subscription as string },
          });

          if (subscription) {
            await prisma.invoice.create({
              data: {
                userId: subscription.userId,
                subscriptionId: subscription.id,
                invoiceNumber: invoice.number || invoice.id,
                amount: invoice.amount_paid,
                currency: invoice.currency,
                status: 'paid',
                paidAt: new Date(),
                lineItems: JSON.stringify(invoice.lines?.data || []),
              },
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const dbSub = await prisma.userSubscription.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (dbSub) {
          await prisma.userSubscription.update({
            where: { id: dbSub.id },
            data: {
              status: subscription.status as string,
              currentPeriodEnd: new Date(),
            },
          });

          await prisma.subscriptionEvent.create({
            data: {
              subscriptionId: dbSub.id,
              userId: dbSub.userId,
              eventType: 'stripe_webhook',
              metadata: JSON.stringify({ 
                status: subscription.status,
                stripeSubscriptionId: subscription.id,
              }),
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const dbSub = await prisma.userSubscription.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (dbSub) {
          await prisma.userSubscription.update({
            where: { id: dbSub.id },
            data: {
              status: 'canceled',
            },
          });

          await prisma.subscriptionEvent.create({
            data: {
              subscriptionId: dbSub.id,
              userId: dbSub.userId,
              eventType: 'canceled',
              metadata: JSON.stringify({ 
                reason: subscription.cancellation_details?.reason,
                stripeSubscriptionId: subscription.id,
              }),
            },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}