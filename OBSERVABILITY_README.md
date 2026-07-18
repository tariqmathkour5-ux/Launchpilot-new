# LaunchPilot Observability & Monitoring Suite

This document describes the comprehensive observability and monitoring implementation for LaunchPilot.

## Overview

The observability suite provides:
- **Performance Monitoring**: Track Core Web Vitals (LCP, CLS, FID, INP)
- **Error Tracking**: Catch and report runtime exceptions via Sentry
- **Analytics**: Custom event tracking via Vercel Analytics
- **Strategic Insights**: Monitor user behavior and revenue metrics

## Architecture

### 1. Vercel Analytics & Speed Insights

**Location**: `src/app/layout.tsx`

Vercel Analytics and Speed Insights are integrated at the root layout level for zero-impact page load performance.

```typescript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// In the layout component:
<Analytics />
<SpeedInsights />
```

**Features**:
- Automatic page view tracking
- Web Vitals monitoring (LCP, FID, CLS, INP)
- Real user monitoring (RUM)
- Zero client-side configuration needed when deployed on Vercel

### 2. Strategic Analytics Helper

**Location**: `src/lib/analytics.ts`

A centralized analytics utility that acts as a bridge to Vercel Analytics with PII protection.

**Available Functions**:
```typescript
// Track custom events
trackEvent(name: string, data: object)

// Track page views (for client-side navigation)
trackPageView(path: string, title?: string)

// Track specific business events
trackAffiliateClick(affiliateId: string, platform: string, toolSlug?: string)
trackToolCompare(toolSlugs: string[], comparisonType: 'feature' | 'pricing' | 'overview')
trackAddToFavorites(toolSlug: string, userId?: string)
trackAdImpression(adSlot: string, adType: string, placement: string)
```

**PII Protection**:
- Automatically sanitizes all event data
- Blocks sensitive fields: email, phone, password, token, secret, key, ssn, credit, card, address, name, ip
- Truncates long strings to prevent accidental PII leakage
- Validates event names against an allowlist

### 3. Error Tracking with Sentry

**Client Configuration**: `sentry.client.config.ts`
**Server Configuration**: `sentry.server.config.ts`

**Features**:
- Error and performance monitoring in production
- Session replay for debugging
- Custom error filtering (ignores common non-critical errors)
- Prisma integration for database query tracking
- Automatic Vercel deployment monitoring

**Environment Variables**:
```env
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"
```

### 4. Server-Side Instrumentation

**Location**: `instrumentation.ts`

Next.js instrumentation hook that runs once on server startup.

**Monitors**:
- Universal Import Engine execution time
- OG image route performance (`/api/og/*`)
- Server startup time
- Slow API responses (>500ms)

**Features**:
- Auto-tags performance logs with timestamps
- Filters non-critical errors
- Compatible with OpenTelemetry patterns

### 5. Performance Hooks

**Location**: `src/hooks/use-performance-metrics.ts`

Client-side hook for tracking Core Web Vitals on dynamic pages.

**Metrics Tracked**:
- **LCP** (Largest Contentful Paint): ≤2500ms (good)
- **CLS** (Cumulative Layout Shift): ≤0.1 (good)
- **FID** (First Input Delay): ≤100ms (good)
- **INP** (Interaction to Next Paint): ≤200ms (good)

**Usage**:
```typescript
import { usePerformanceMetrics } from '@/hooks/use-performance-metrics';

usePerformanceMetrics({
  pageType: 'tool_detail',
  toolSlug: 'chatgpt',
  enabled: true,
});
```

### 6. Tool Detail Page Tracking

**Component**: `src/components/ToolPerformanceTracker.tsx`

Lightweight component that tracks performance metrics for tool pages. Automatically included in all tool detail pages.

**Features**:
- Zero UI impact (returns null)
- Tracks LCP and CLS specifically for tool pages
- Sends metrics to Vercel Analytics via the trackEvent helper

### 7. OG Image Route Monitoring

**Location**: `src/app/api/og/tools/[slug]/route.tsx`

Performance monitoring for dynamic OG image generation.

**Tracks**:
- Image generation time
- Database query performance
- Error rates

**Threshold**: Alerts on generation times >1000ms in production

## Configuration

### Environment Variables

Add these to your `.env` file (see `.env.example`):

```env
# Sentry
NEXT_PUBLIC_SENTRY_DSN="https://your-sentry-dsn@sentry.io/your-project"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"

# Already configured automatically on Vercel:
# - Vercel Analytics
# - Speed Insights
```

### Next.js Configuration

**Location**: `next.config.js`

Sentry is integrated using `@sentry/nextjs` wrapper:

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: 'launchpilot',
  project: 'launchpilot-web',
  sourcemaps: {
    disable: process.env.NODE_ENV === 'development',
  },
});
```

## Usage Examples

### Tracking Affiliate Clicks

```typescript
import { trackAffiliateClick } from '@/lib/analytics';

<a
  href={tool.website_url}
  onClick={() => trackAffiliateClick('partner-123', 'direct', tool.slug)}
>
  Visit Website
</a>
```

### Tracking Tool Comparisons

```typescript
import { trackToolCompare } from '@/lib/analytics';

trackToolCompare(['chatgpt', 'claude', 'perplexity'], 'feature');
```

### Tracking Favorites

```typescript
import { trackAddToFavorites } from '@/lib/analytics';

trackAddToFavorites('chatgpt', user?.id);
```

### Tracking Ad Impressions

```typescript
import { trackAdImpression } from '@/lib/analytics';

trackAdImpression('ad-slot-1', 'banner', 'sidebar');
```

## Performance Impact

### Zero-Impact Design

1. **Lazy Loading**: Analytics scripts load asynchronously
2. **Production Only**: Sentry and instrumentation only active in production
3. **Client-Side**: Performance hooks use `PerformanceObserver` API (no layout shift)
4. **Debouncing**: Metrics collected once per page load
5. **Efficient**: Minimal DOM queries and memory usage

### Expected Overhead

- **Vercel Analytics**: ~5KB gzipped, loads asynchronously
- **Sentry**: ~15KB gzipped (production only), error sampling reduces impact
- **Performance Hook**: <1KB, uses native browser APIs

## Compliance & Privacy

### PII Protection

All analytics events are automatically sanitized:
- No email addresses
- No IP addresses
- No personal names
- No phone numbers
- No credit card information
- Truncated user IDs (first 8 characters only)

### GDPR Compliance

- No cookies used for analytics
- No cross-site tracking
- User data anonymized
- Opt-out via browser settings (Vercel Analytics respects DNT)

### Data Retention

- **Vercel Analytics**: 90 days
- **Sentry**: Configurable (default 90 days)
- **Custom Events**: Same as Vercel retention policy

## Monitoring Dashboards

### Vercel Dashboard

1. **Analytics**: Page views, unique visitors, top pages
2. **Speed Insights**: Core Web Vitals trends
3. **Logs**: Real-time server logs

### Sentry Dashboard

1. **Issues**: Error rates and trends
2. **Performance**: Transaction traces and spans
3. **Replays**: Session replays for debugging

## Troubleshooting

### Analytics Not Working

1. Ensure deployed on Vercel (or configure custom analytics endpoint)
2. Check browser console for errors
3. Verify `NODE_ENV !== 'development'` for Sentry

### Performance Metrics Not Tracking

1. Ensure hook is called in `'use client'` component
2. Check browser supports PerformanceObserver API
3. Verify web vitals config (LCP requires user interaction)

### Sentry Not Capturing Errors

1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. Ensure `NODE_ENV === 'production'`
3. Check Sentry dashboard for rate limiting

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Run development server (Sentry disabled)
npm run dev

# Build for production (Sentry enabled)
npm run build
npm start
```

### Testing Analytics

```bash
# Analytics events logged to console in development
npm run dev

# Check browser console for [Analytics] logs
```

## Cost Optimization

### Vercel Analytics
- Free on Hobby and Pro plans
- Unlimited events
- 90-day data retention

### Sentry
- Free tier: 5,000 events/month
- Consider sampling for high-traffic sites
- Use `beforeSend` to filter noise

### Performance Budgets

Monitor these metrics:
- LCP: < 2.5s
- CLS: < 0.1
- FID: < 100ms
- OG Image Generation: < 1s

## Future Enhancements

- [ ] Add OpenTelemetry SDK for distributed tracing
- [ ] Implement custom business dashboards
- [ ] Add A/B testing framework
- [ ] Integrate revenue tracking with Stripe
- [ ] Add uptime monitoring
- [ ] Implement feature flags with analytics

## Support

For issues or questions:
1. Check this documentation
2. Review Sentry and Vercel dashboards
3. Search GitHub issues
4. Contact the LaunchPilot team

---

**Last Updated**: 2026-07-16
**Version**: 1.0.0