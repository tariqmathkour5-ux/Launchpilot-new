# Vercel Environment Variables Checklist

This document lists all environment variables found in the local `.env` file, their status, and where they are used in the codebase.

## Current `.env` Variables

| Variable Name | Required | Where It's Used | Add to Vercel | Current Value (Masked) |
|---------------|----------|-----------------|---------------|----------------------|
| **NEXT_PUBLIC_SITE_URL** | ✅ Yes | Multiple files: src/app/layout.tsx, src/app/sitemap.ts, src/app/robots.ts, src/app/manifest.ts, src/lib/seo/metadata.ts, src/lib/seo/json-ld.ts, src/lib/weekly-digest.ts, src/lib/tools-seo-pages.ts, src/app/blog/rss.xml/route.ts, src/app/api/auth/forgot-password/route.ts, src/app/api/subscriptions/checkout/route.ts | ✅ Yes | `http://localhost:3000` |
| **NEXT_PUBLIC_SITE_NAME** | ✅ Yes | Multiple files: src/lib/weekly-digest.ts | ✅ Yes | `LaunchPilot` |
| **NEXT_PUBLIC_SUPABASE_URL** | ❌ No | src/lib/supabase.ts | ✅ Yes (Optional) | `https://mhlbxhakqappfimymdqp.supabase.co` |
| **NEXT_PUBLIC_SUPABASE_ANON_KEY** | ❌ No | src/lib/supabase.ts | ✅ Yes (Optional) | `********` |
| **DATABASE_URL** | ✅ Yes | prisma/schema.prisma, prisma/schema.dev.prisma | ✅ Yes | `file:./prisma/dev.db` |
| **DIRECT_URL** | ✅ Yes | prisma/schema.prisma | ✅ Yes | `file:./prisma/dev.db` |
| **NEXTAUTH_URL** | ✅ Yes | Authentication (src/lib/auth.ts, middleware.ts) | ✅ Yes | `http://localhost:3000` |
| **NEXTAUTH_SECRET** | ✅ Yes | src/lib/auth.ts, middleware.ts | ✅ Yes | `********` |
| **REVALIDATE_SECRET** | ❌ No | src/app/api/revalidate/route.ts | ✅ Yes (Optional) | `********` |
| **RESEND_API_KEY** | ✅ Yes | src/lib/email.ts | ✅ Yes | *(not set)* |
| **RESEND_FROM_EMAIL** | ✅ Yes | src/lib/email.ts | ✅ Yes | *(not set)* |
| **STRIPE_SECRET_KEY** | ❌ No | src/lib/stripe.ts | ✅ Yes (Optional - for payments) | *(not set)* |
| **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** | ❌ No | src/lib/stripe.ts, src/hooks/use-subscription.ts | ✅ Yes (Optional - for payments) | *(not set)* |
| **STRIPE_WEBHOOK_SECRET** | ❌ No | src/app/api/subscriptions/webhook/route.ts | ✅ Yes (Optional - for payments) | *(not set)* |
| **GOOGLE_CLIENT_ID** | ❌ No | src/lib/auth.ts | ✅ Yes (Optional - for Google OAuth) | *(not set)* |
| **GOOGLE_CLIENT_SECRET** | ❌ No | src/lib/auth.ts | ✅ Yes (Optional - for Google OAuth) | *(not set)* |
| **TELEGRAM_BOT_TOKEN** | ❌ No | src/lib/agents/telegram-gateway.ts, src/app/api/agents/telegram/route.ts, scripts/agents-test-connection.ts, scripts/get-telegram-chatid.ts, scripts/telegram-polling.ts | ✅ Yes (Optional) | `********` |
| **TELEGRAM_ADMIN_CHAT_ID** | ❌ No | src/lib/agents/telegram-gateway.ts, scripts/agents-test-connection.ts | ✅ Yes (Optional) | `6158300168` |
| **AGENT_SYSTEM_SECRET** | ❌ No | src/lib/agents/index.ts | ✅ Yes (Optional) | `******` |
| **PAYTABS_SERVER_KEY** | ❌ No | src/lib/payment/paytabs.ts | ✅ Yes (Optional) | *(empty)* |
| **PAYTABS_PROFILE_ID** | ❌ No | src/lib/payment/paytabs.ts | ✅ Yes (Optional) | *(empty)* |
| **OPENAI_API_KEY** | ❌ No | src/lib/ai/multi-provider-service.ts, scripts/daily-report.ts | ✅ Yes (Optional) | *(not set)* |
| **GEMINI_API_KEY** | ❌ No | src/lib/ai/multi-provider-service.ts | ✅ Yes (Optional) | *(not set)* |
| **GROQ_API_KEY** | ❌ No | src/lib/ai/multi-provider-service.ts | ✅ Yes (Optional) | *(not set)* |
| **GITHUB_CLIENT_ID** | ❌ No | src/lib/auth.ts | ✅ Yes (Optional - for GitHub OAuth) | *(not set)* |
| **GITHUB_CLIENT_SECRET** | ❌ No | src/lib/auth.ts | ✅ Yes (Optional - for GitHub OAuth) | *(not set)* |
| **NEXT_PUBLIC_GOOGLE_ENABLED** | ❌ No | src/app/auth/signin/page.tsx | ✅ Yes (Optional - enables Google OAuth) | *(not set)* |
| **SUPABASE_SERVICE_ROLE_KEY** | ❌ No | src/lib/supabase.ts | ✅ Yes (Optional) | *(not set)* |
| **NEXT_PUBLIC_SENTRY_DSN** | ❌ No | sentry.client.config.ts | ✅ Yes (Optional) | *(not set)* |
| **SENTRY_AUTH_TOKEN** | ❌ No | Sentry configuration | ✅ Yes (Optional) | *(not set)* |
| **GROWTH_WEBHOOK_URL** | ❌ No | src/lib/growth-automation.ts | ✅ Yes (Optional) | *(not set)* |
| **ENABLE_GROWTH_WEBHOOKS** | ❌ No | src/lib/growth-automation.ts | ✅ Yes (Optional) | *(not set)* |
| **GROWTH_WEBHOOK_SECRET** | ❌ No | src/lib/growth-automation.ts | ✅ Yes (Optional) | *(not set)* |

---

## Summary

### Required Variables (Must be added to Vercel)
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL database connection string |
| `DIRECT_URL` | Direct database connection for migrations |
| `NEXTAUTH_SECRET` | NextAuth.js session encryption secret |
| `NEXTAUTH_URL` | Full deployed application URL |
| `RESEND_API_KEY` | Email sending API key |
| `RESEND_FROM_EMAIL` | From email address for emails |
| `NEXT_PUBLIC_SITE_URL` | Site URL for SEO and redirects |
| `NEXT_PUBLIC_SITE_NAME` | Site name for display |

### Optional Variables (Add only if using the feature)
| Variable | Purpose |
|----------|---------|
| Stripe variables | For payment processing |
| Supabase variables | For Supabase integration |
| OAuth variables | For GitHub/Google sign-in |
| Telegram variables | For admin notifications |
| AI variables | For AI-powered features |
| Growth/PayTabs variables | For automation and alternative payments |
| Sentry variables | For error tracking |

---

## Notes

- 🔒 **Secret values are masked with `**`** in this document
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- For production, replace development values with production values
- Database URL should use PostgreSQL in production (not SQLite)