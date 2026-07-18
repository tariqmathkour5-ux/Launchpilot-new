# Stripe Integration Setup Guide

This guide explains how to set up and configure Stripe for subscription payments in LaunchPilot.

## Environment Variables

Add the following to your `.env` file:

```bash
# Stripe (for payments)
STRIPE_SECRET_KEY=<your-stripe-secret-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
```

## Setting Up Stripe

1. **Create a Stripe Account**: Go to [stripe.com](https://stripe.com) and create an account.

2. **Get API Keys**:
   - In test mode, go to Developers → API keys
   - Copy the Publishable key and Secret key

3. **Set Up Webhook**:
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/subscriptions/webhook`
   - Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the webhook signing secret

## Subscription Plans

The system includes three subscription tiers:

### Free Plan
- **Price**: $0/month
- **Features**:
  - Browse 15,000+ AI tools
  - 5 favorites
  - 1 collection (up to 10 items)
  - 3 comparisons
  - Basic search

### Pro Plan
- **Price**: $9.99/month ($99.99/year)
- **Trial**: 14 days
- **Features**:
  - Everything in Free
  - Unlimited favorites
  - Unlimited collections
  - Unlimited comparisons
  - Advanced search & filters
  - Personalized recommendations
  - Export comparisons (CSV/PDF)
  - 1,000 API requests/month

### Enterprise Plan
- **Price**: $29.99/month ($299.99/year)
- **Features**:
  - Everything in Pro
  - Company dashboard
  - Advanced analytics
  - Unlimited team members
  - Publish your AI tools
  - Custom integrations
  - White-label options
  - Dedicated support manager
  - SLA guarantee
  - Unlimited API requests

## API Endpoints

### `/api/subscriptions/checkout` (POST)
Creates a Stripe Checkout session for subscription purchase.

```json
{
  "plan": "pro",
  "billing_cycle": "monthly" // or "yearly"
}
```

Response:
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "..."
}
```

### `/api/subscriptions/current` (GET)
Returns the current user's subscription status.

Response:
```json
{
  "subscription": { ... },
  "plan": { "name": "Pro", "slug": "pro" },
  "limits": { ... },
  "usage": { ... }
}
```

### `/api/subscriptions/webhook` (POST)
Handles Stripe webhook events for subscription lifecycle.

## Protecting Premium Features

### Server-side Protection

Use the `subscription-guard.ts` utility in your server components:

```typescript
import { hasActiveSubscription, canAccessFeature } from '@/lib/subscription-guard';

// In your component or API route
const hasAccess = await hasActiveSubscription();
if (!hasAccess) {
  // Redirect or show upgrade prompt
}

// Check specific feature
const canUseAdvancedSearch = await canAccessFeature('advanced_search');
```

### Client-side Protection

Use the `useSubscription` hook in your client components:

```typescript
import { useSubscription } from '@/hooks/use-subscription';

function PremiumComponent() {
  const { planSlug, hasFeatureAccess, loading } = useSubscription({
    requiredFeature: 'advanced_search'
  });

  if (loading) return <Loading />;
  if (!hasFeatureAccess) return <UpgradePrompt />;

  return <PremiumContent />;
}
```

## Database Schema

The `UserSubscription` model includes Stripe-related fields:

```prisma
model UserSubscription {
  stripeCustomerId      String?
  stripeSubscriptionId  String?
  stripePriceId         String?
  paymentProvider       String?  // "stripe" or null
}
```

## Testing Stripe Integration

1. Use Stripe test cards:
   - Successful payment: `4242 4242 4242 4242`
   - Failed payment: `4000 0000 0000 0002`

2. For local testing, use the Stripe CLI to test webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/subscriptions/webhook

   ```

## Webhook Events Handled

- `checkout.session.completed`: Creates/updates subscription record
- `invoice.payment_succeeded`: Creates invoice record
- `customer.subscription.updated`: Updates subscription status
- `customer.subscription.deleted`: Marks subscription as canceled