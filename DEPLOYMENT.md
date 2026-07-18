# Deployment Guide — LaunchPilot v1.0

Production deployment guide for LaunchPilot platform.

---

## Prerequisites

- Node.js >= 18.0
- PostgreSQL 14+ (production) / SQLite (development)
- Stripe account (for payments)
- Resend account (for email)
- Vercel account (recommended) OR Docker-capable server

---

## Environment Variables

Create `.env` in production with:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/launchpilot"

# NextAuth
NEXTAUTH_SECRET="$(openssl rand -base64 48)"
NEXTAUTH_URL="https://yourdomain.com"

# OAuth
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# AI Providers (at least one required)
OPENAI_API_KEY=""
GEMINI_API_KEY=""
GROQ_API_KEY=""

# Payments
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

# Email
RESEND_API_KEY=""

# Site
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""

# Optional
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
```

---

## Vercel Deployment (Recommended)

### 1. Prepare Repository

```bash
# Push to GitHub
git remote add origin https://github.com/your-org/launchpilot.git
git push -u origin main
```

### 2. Deploy on Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Deploy preview
vercel

# Deploy production
vercel --prod
```

### 3. Configure Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add all variables from `.env.example`.

### 4. Database Migration

```bash
# Run migrations (Vercel will run this automatically on deploy)
vercel env pull .env.local
npx prisma migrate deploy
```

---

## Docker Deployment

### Build Image

```bash
docker build -t launchpilot:v1.0 .
```

### Run Container

```bash
docker run -d \
  --name launchpilot \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/launchpilot \
  -e NEXTAUTH_SECRET=$(openssl rand -base64 48) \
  -e NEXTAUTH_URL=https://yourdomain.com \
  -e OPENAI_API_KEY=... \
  -e STRIPE_SECRET_KEY=... \
  launchpilot:v1.0
```

### Docker Compose

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: launchpilot
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: launchpilot
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    image: launchpilot:v1.0
    restart: always
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://launchpilot:secure_password@postgres:5432/launchpilot
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: https://yourdomain.com
    depends_on:
      - postgres

volumes:
  postgres_data:
```

```bash
docker compose up -d
```

---

## Database Setup

### Migrations

```bash
# Run all pending migrations
npx prisma migrate deploy

# Seed database (optional)
npm run seed
```

### Backups

```bash
# Manual backup
npm run backup:db

# Automated daily (cron)
0 2 * * * cd /path/to/launchpilot && npm run backup:db >> /var/log/launchpilot-backup.log 2>&1
```

---

## Security Checklist

- [ ] All environment variables set (no hardcoded secrets)
- [ ] `NEXTAUTH_SECRET` is 32+ random characters
- [ ] Database uses SSL/TLS in transit
- [ ] Redis cache (if used) has password protection
- [ ] Sentry DSN configured for error tracking
- [ ] Rate limiting enabled on API routes
- [ ] CORS restricted to allowed origins
- [ ] Admin RBAC tested with all roles
- [ ] Webhook secrets validated (Stripe, GitHub)
- [ ] Security headers configured in `next.config.js`:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: origin-when-cross-origin`

---

## Performance Optimization

### Next.js Config

```javascript
// next.config.js
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { hostname: 'yourdomain.com' },
      { hostname: '*.stripe.com' },
    ],
  },
  headers: async () => [
    { source: '/(.*)', headers: securityHeaders },
  ],
};
```

### CDN Setup

```bash
# Vercel Edge Network (automatic)
# OR custom CDN:
# - Cloudflare
# - Fastly
# - AWS CloudFront
```

### Caching Strategy

- **Static assets**: Cache 1 year with immutable hash
- **API responses**: Cache 5 minutes, stale-while-revalidate
- **Database queries**: 1-5 minutes depending on data freshness
- **AI responses**: Cache 1 hour (deterministic by prompt)

---

## Monitoring & Observability

### Sentry (Error Tracking)

Included in `sentry.client.config.ts` and `sentry.server.config.ts`.

```bash
# Self-hosted Sentry
SENTRY_DSN="..."
SENTRY_AUTH_TOKEN="..."
```

### Vercel Analytics

```bash
# Auto-enabled on Vercel
vercel env add NEXT_PUBLIC_VERCEL_ANALYTICS_ID
```

### Custom Metrics

- `src/hooks/use-performance-metrics.ts` — Web Vitals
- `src/components/ToolPerformanceTracker.tsx` — Component timings

---

## Maintenance

### Database

```bash
# Weekly backup
npm run backup:db

# Monthly optimization (PostgreSQL)
npx prisma migrate resolve --applied "migration_name"
npx prisma generate
```

### Logs

```bash
# Vercel: Dashboard → Logs
# Docker: docker logs launchpilot
# PM2: pm2 logs launchpilot
```

### Updates

```bash
git pull origin main
npm install
npx prisma migrate deploy
npm run build
pm2 restart launchpilot
```

---

## Rollback

### Vercel

```bash
vercel rollback
```

### Docker

```bash
docker stop launchpilot
docker run -d ... launchpilot:previous_tag
```

---

## Scaling

- **Horizontal**: Multiple app instances behind load balancer
- **Database**: Read replicas for analytics queries
- **Cache**: Redis cluster for shared session storage
- **Queue**: BullMQ/Redis for async job processing
- **CDN**: Cloudflare for static assets and edge functions

---

## Support

Contact: devops@launchpilot.ai

**LaunchPilot v1.0 — Production Ready**