# Vercel Environment Variables for LaunchPilot

This document lists all environment variables required for deploying LaunchPilot to Vercel.

## Required Environment Variables

| Variable | Required | Description | Source File | Example Value |
|----------|----------|-------------|-----------|---------------|
| `DATABASE_URL` | Required | Database connection string for Prisma | prisma/schema.prisma | `postgresql://user:pass@host:5432/db?schema=public` |
| `DIRECT_URL` | Required | Direct database connection (for migrations) | Database configuration | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Required | Secret key for NextAuth.js session encryption | src/lib/auth.ts, middleware.ts | `YOUR_NEXTAUTH_SECRET` |
| `NEXTAUTH_URL` | Required | Full URL of your deployed application | Authentication config | `https://launchpilot.ai` |
| `RESEND_API_KEY` | Required | Resend API key for email sending | src/lib/email.ts | `YOUR_RESEND_API_KEY` |
| `RESEND_FROM_EMAIL` | Required | From email address for emails | src/lib/email.ts | `LaunchPilot <noreply@launchpilot.ai>` |
| `NEXT_PUBLIC_SITE_URL` | Required | Site URL for redirects and SEO | Multiple files | `https://launchpilot.ai` |
| `NEXT_PUBLIC_SITE_NAME` | Required | Site name for display | Metadata configuration | `LaunchPilot` |
| `STRIPE_SECRET_KEY` | Required (for payments) | Stripe secret key for API calls | src/lib/stripe.ts | `YOUR_STRIPE_SECRET_KEY` |
| `STRIPE_WEBHOOK_SECRET` | Required (for payments) | Stripe webhook endpoint secret | src/app/api/subscriptions/webhook/route.ts | `YOUR_STRIPE_WEBHOOK_SECRET` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Required (for payments) | Stripe publishable key for frontend | src/hooks/use-subscription.ts | `YOUR_STRIPE_PUBLISHABLE_KEY` |

## Optional Environment Variables

| Variable | Required | Description | Source File | Example Value |
|----------|----------|-------------|-----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL | src/lib/supabase.ts | `YOUR_SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anonymous public key | src/lib/supabase.ts | `YOUR_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Supabase service role key | src/lib/supabase.ts | `YOUR_SUPABASE_SERVICE_ROLE_KEY` |
| `GITHUB_CLIENT_ID` | Optional | GitHub OAuth App Client ID | src/lib/auth.ts | `YOUR_GITHUB_CLIENT_ID` |
| `GITHUB_CLIENT_SECRET` | Optional | GitHub OAuth App Client Secret | src/lib/auth.ts | `YOUR_GITHUB_CLIENT_SECRET` |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth Client ID | src/lib/auth.ts | `YOUR_GOOGLE_CLIENT_ID` |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth Client Secret | src/lib/auth.ts | `YOUR_GOOGLE_CLIENT_SECRET` |
| `NEXT_PUBLIC_GOOGLE_ENABLED` | Optional | Enable Google OAuth | src/app/auth/signin/page.tsx | `true` |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Sentry DSN for error tracking | sentry.client.config.ts | `YOUR_SENTRY_DSN` |
| `SENTRY_AUTH_TOKEN` | Optional | Sentry auth token for source maps | Sentry configuration | `YOUR_SENTRY_AUTH_TOKEN` |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` | Optional | Vercel Analytics ID | Vercel configuration | (auto-configured) |
| `OPENAI_API_KEY` | Optional | OpenAI API key for AI features | src/lib/ai/multi-provider-service.ts | `YOUR_OPENAI_API_KEY` |
| `GEMINI_API_KEY` | Optional | Google Gemini API key | src/lib/ai/multi-provider-service.ts | `YOUR_GEMINI_API_KEY` |
| `GROQ_API_KEY` | Optional | Groq API key | src/lib/ai/multi-provider-service.ts | `YOUR_GROQ_API_KEY` |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram Bot API token | src/lib/agents/telegram-gateway.ts | `YOUR_TELEGRAM_BOT_TOKEN` |
| `TELEGRAM_ADMIN_CHAT_ID` | Optional | Telegram admin chat ID | src/lib/agents/telegram-gateway.ts | `YOUR_TELEGRAM_ADMIN_CHAT_ID` |
| `AGENT_SYSTEM_SECRET` | Optional | Secret for agent system API auth | src/lib/agents/index.ts | `YOUR_AGENT_SYSTEM_SECRET` |
| `GROWTH_WEBHOOK_URL` | Optional | Growth automation webhook URL | src/lib/growth-automation.ts | `YOUR_GROWTH_WEBHOOK_URL` |
| `ENABLE_GROWTH_WEBHOOKS` | Optional | Enable growth webhooks (set to 'true') | src/lib/growth-automation.ts | `true` |
| `GROWTH_WEBHOOK_SECRET` | Optional | Growth webhook secret | src/lib/growth-automation.ts | `YOUR_GROWTH_WEBHOOK_SECRET` |
| `PAYTABS_SERVER_KEY` | Optional | PayTabs payment gateway key | src/lib/payment/paytabs.ts | `YOUR_PAYTABS_SERVER_KEY` |
| `PAYTABS_PROFILE_ID` | Optional | PayTabs profile ID | src/lib/payment/paytabs.ts | `YOUR_PAYTABS_PROFILE_ID` |
| `REVALIDATE_SECRET` | Optional | Secret for on-demand ISR (revalidation) | src/app/api/revalidate/route.ts | `YOUR_REVALIDATE_SECRET` |

## Notes

1. **Required for basic functionality**: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME`
2. **Required for payments**: All `STRIPE_*` variables
3. **Optional for enhanced features**: Supabase, OAuth providers, AI services, Telegram, Sentry, PayTabs
4. Vercel Analytics (`NEXT_PUBLIC_VERCEL_ANALYTICS_ID`) is automatically configured when deployed on Vercel - no manual setup needed
5. For local development, `DATABASE_URL` can use SQLite: `file:./dev.db`