# Production Deployment Report

## Required Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-----------|---------|
| `DATABASE_URL` | Required | PostgreSQL connection string | `postgresql://postgres:password@host:5432/postgres?schema=public` |
| `DIRECT_URL` | Required | Direct database connection | `postgresql://postgres:password@host:5432/postgres` |
| `NEXTAUTH_SECRET` | Required | NextAuth secret key | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Required | Deployed app URL | `https://your-domain.com` |
| `RESEND_API_KEY` | Required | Resend email API key | `re_...` |
| `RESEND_FROM_EMAIL` | Required | Verified sender email | `LaunchPilot <noreply@your-domain.com>` |
| `NEXT_PUBLIC_SITE_URL` | Required | Site URL for SEO | `https://your-domain.com` |
| `NEXT_PUBLIC_SITE_NAME` | Required | Site name | `LaunchPilot` |
| `STRIPE_SECRET_KEY` | Required (payments) | Stripe secret key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Required (payments) | Webhook signing secret | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Required (payments) | Stripe publishable key | `pk_live_...` |

## Build Command

```
npm run build
```

This command automatically runs:
1. `prisma generate` - Generates Prisma client
2. `next build` - Builds Next.js application

## Install Command

```
npm install
```

This command automatically runs:
1. `prisma generate` - Via postinstall hook
2. Installs all dependencies

## Output Directory

```
.next
```

## Prisma Notes

- **Provider**: PostgreSQL (changed from SQLite)
- **Migrations**: Located in `prisma/migrations/` (needs to be generated with `prisma migrate dev`)
- **Schema**: `prisma/schema.prisma`
- **Generate**: `prisma generate` runs automatically on install and build

## Production Checklist

### Pre-Deployment
- [x] Prisma schema updated to PostgreSQL
- [x] package.json configured for automatic Prisma generation
- [x] `.env.example` updated with all required variables
- [x] `.gitignore` excludes sensitive files
- [ ] Set all environment variables in Vercel dashboard

### Deployment Steps
- [ ] Import Supabase migrations (if using Supabase)
- [ ] Configure Stripe webhook endpoint
- [ ] Verify email functionality
- [ ] Test authentication flows

### Post-Deployment
- [ ] Run `npx prisma migrate deploy` if migrations exist
- [ ] Verify `/sitemap.xml` generation
- [ ] Verify `/robots.txt` generation
- [ ] Test all API endpoints

## Known Issues

### Sentry Warnings (Non-Breaking)
1. `Could not find 'onRequestError' hook` - Outdated Sentry configuration
2. `don't have a global error handler` - Missing `global-error.js`
3. `DEPRECATION WARNING: automaticVercelMonitors` - Will be removed in future SDK

**Solution**: Suppress with `SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING=1`

### Migration Requirement
- Prisma migrations directory exists but needs to be generated for PostgreSQL
- Run locally: `npx prisma migrate dev --name init`
- For production: `npx prisma migrate deploy`

## Deployment Status

| Check | Status |
|-------|--------|
| Prisma Provider | PostgreSQL |
| Build Command | Auto Prisma generate + Next.js build |
| Install Command | Auto Prisma generate |
| Environment Variables | Documented |
| Documentation | Complete |

## Vercel Configuration

**Framework Preset**: Next.js  
**Build Command**: `npm run build`  
**Output Directory**: `.next`  
**Install Command**: `npm install`  
**Node.js Version**: 18.x or 20.x

## Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Changed from SQLite to PostgreSQL |
| `package.json` | Added `prisma generate` to build script |
| `.env.example` | Updated with all required variables |
| `VERCEL_ENVIRONMENT_VARIABLES.md` | Complete variable documentation |
| `DATABASE_AUDIT_REPORT.md` | Database audit findings |