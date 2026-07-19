# Final Deployment Checklist

## Pre-Deployment ✅

### Repository
- [x] Git working tree clean
- [x] All source files committed
- [x] No secrets in repository
- [x] `.env.example` contains all variables
- [x] Documentation complete

### Configuration
- [x] `prisma/schema.prisma` uses PostgreSQL
- [x] `package.json` has correct build script
- [x] `next.config.js` configured for standalone output
- [x] `tsconfig.json` has strict mode
- [x] `.gitignore` excludes all sensitive files

## Required Environment Variables

### Essential (Must Set)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | Direct database connection |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your deployed URL |
| `RESEND_API_KEY` | From resend.com |
| `RESEND_FROM_EMAIL` | Verified sender address |
| `NEXT_PUBLIC_SITE_URL` | Your deployed URL |
| `NEXT_PUBLIC_SITE_NAME` | LaunchPilot |

### Payments
| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Configure after deployment |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

## Vercel Deployment Steps

1. **Import Project**
   - Import from GitHub: https://github.com/tariqmathkour5-ux/Launchpilot-new.git
   - Framework preset: Next.js

2. **Configure Environment Variables**
   - Add all required variables above

3. **Deploy**
   - Build command: `npm run build`
   - Output directory: `.next`

4. **Post-Deployment**
   - Run Supabase migrations or `npx prisma migrate deploy`
   - Configure Stripe webhook endpoint
   - Test authentication flow

## Database Migration

### Option A: Supabase SQL Migrations
1. Go to Supabase SQL editor
2. Run all migration files from `supabase/migrations/`

### Option B: Prisma Migrate
```bash
# Generate migrations locally first
npx prisma migrate dev --name init

# Then on Vercel
npx prisma migrate deploy
```

## Verification Steps

### After Deployment
- [ ] Homepage loads: `/`
- [ ] Authentication works: `/api/auth/signin`
- [ ] Sitemap generated: `/sitemap.xml`
- [ ] Robots file: `/robots.txt`
- [ ] API health: `/api/health` (if exists)

### Payment Testing
- [ ] Stripe checkout works
- [ ] Webhook receives events
- [ ] Subscription management

### Email Testing
- [ ] Password reset email sends
- [ ] From email address verified

## Rollback Plan
If deployment fails:
1. Revert to previous commit
2. Check environment variables
3. Verify database connectivity
4. Check build logs in Vercel

## Support Resources
- Documentation: `PRODUCTION_DEPLOYMENT_REPORT.md`
- Variables: `VERCEL_ENVIRONMENT_VARIABLES.md`
- Database: `DATABASE_AUDIT_REPORT.md`
- Certificate: `FINAL_PRODUCTION_CERTIFICATE.md`