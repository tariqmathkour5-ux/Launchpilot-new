# LaunchPilot Deployment Checklist

## Prerequisites for Vercel Deployment

Before deploying LaunchPilot to Vercel, ensure you have the following services and accounts configured:

### 1. Database Setup
- [ ] PostgreSQL database (e.g., Supabase, Neon, Railway)
- [ ] Database connection string ready
- [ ] Run migrations after deployment

### 2. Authentication
- [ ] NextAuth secret generated (use `openssl rand -base64 32`)
- [ ] OAuth providers configured (optional):
  - [ ] GitHub OAuth App (Client ID & Secret)
  - [ ] Google OAuth credentials (if using Google sign-in)

### 3. Email Service
- [ ] Resend account and API key
- [ ] From email address configured

### 4. Payment Processing (Required for Subscription Features)
- [ ] Stripe account
- [ ] Stripe Secret Key
- [ ] Stripe Publishable Key
- [ ] Stripe Webhook Secret (set up after deployment)

### 5. Monitoring & Analytics (Optional)
- [ ] Sentry project for error tracking
- [ ] Vercel Analytics (auto-configured)

## Vercel Environment Variables to Configure

Add the following variables in your Vercel project settings (Settings → Environment Variables):

### Required Variables (Must be set)

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Your PostgreSQL connection string | Production database |
| `DIRECT_URL` | Your PostgreSQL direct connection | For migrations |
| `NEXTAUTH_SECRET` | Generated secret | 32+ character random string |
| `NEXTAUTH_URL` | `https://your-domain.com` | Your deployed URL |
| `RESEND_API_KEY` | Your Resend API key | From resend.com |
| `RESEND_FROM_EMAIL` | `LaunchPilot <noreply@your-domain.com>` | Verified sender |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` | Your deployed URL |

### Payment Variables (Required for subscriptions)

| Variable | Value | Notes |
|----------|-------|-------|
| `STRIPE_SECRET_KEY` | Your Stripe secret key | From Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook endpoint | Set up after deploy |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key | From Stripe dashboard |

## Post-Deployment Steps

1. **Run Database Migrations**
   - In Vercel dashboard, go to your project → Deployments → ... (three dots) → "Run build command in terminal"
   - Run: `npx prisma migrate deploy`

2. **Set Up Stripe Webhook**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/subscriptions/webhook`
   - Select events:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the webhook signing secret and add to `STRIPE_WEBHOOK_SECRET`

3. **Verify Email Configuration**
   - Ensure `RESEND_FROM_EMAIL` is a verified sender in Resend
   - Test the forgot password flow

4. **Test Authentication**
   - Test sign-in/sign-up flows
   - Test OAuth providers (if configured)

5. **Configure Domain**
   - Set up custom domain in Vercel
   - Update `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` with your domain

## Optional Services

### Supabase (if using)
- [ ] Supabase project URL
- [ ] Supabase anonymous key
- [ ] Supabase service role key

### AI Features
- [ ] OpenAI API key
- [ ] Google Gemini API key
- [ ] Groq API key

### Telegram Notifications (if using)
- [ ] Telegram Bot token
- [ ] Telegram admin chat ID

### Growth Automation (if using)
- [ ] Growth webhook URL
- [ ] Enable growth webhooks
- [ ] Growth webhook secret

### Alternative Payment (PayTabs)
- [ ] PayTabs server key
- [ ] PayTabs profile ID

## Deployment Command

```bash
# Install dependencies
npm install

# Run locally for testing
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Health Check Endpoints

After deployment, verify these endpoints work:
- `/api/auth/signin` - Authentication page
- `/api/health` - Health check (if exists)
- `/sitemap.xml` - Sitemap generation
- `/robots.txt` - Robots file

## Troubleshooting

1. **Build errors**: Check that all required environment variables are set
2. **Database connection**: Ensure `DATABASE_URL` and `DIRECT_URL` are correct
3. **Emails not sending**: Verify Resend API key and sender domain
4. **Payments not working**: Check Stripe keys and webhook configuration
5. **Auth issues**: Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL`