import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY is not set. Stripe functionality will be disabled.');
}

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-10-16' as Stripe.ApiVersion,
}) : null;

export function isStripeConfigured(): boolean {
  return !!stripeSecretKey && !!stripePublishableKey;
}

export function getStripePublishableKey(): string {
  return stripePublishableKey || '';
}