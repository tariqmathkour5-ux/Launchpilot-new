# Growth Automation System

A notification and reporting system that tracks user reviews, revenue events, and generates daily performance reports.

## Features

### 1. Notification System (`src/lib/growth-automation.ts`)

Sends log events to console (and optionally webhooks) when:
- **New user reviews** are submitted
- **Tools earn revenue** (affiliate clicks, subscriptions, etc.)

#### Configuration

Add these environment variables to `.env`:

```env
# Optional: Enable webhook notifications
GROWTH_WEBHOOK_URL=https://your-webhook-endpoint.com/growth
GROWTH_WEBHOOK_SECRET=your-webhook-secret
ENABLE_GROWTH_WEBHOOKS=true
```

#### Usage

```typescript
import { notifyReviewSubmitted, notifyRevenueEarned } from '@/lib/growth-automation';

// Notify on review submission
await notifyReviewSubmitted({
  toolId: 'tool-id',
  toolName: 'ChatGPT',
  toolSlug: 'chatgpt',
  userId: 'user-id',
  userName: 'John Doe',
  rating: 5,
  content: 'Great tool!',
});

// Notify on revenue earned
await notifyRevenueEarned({
  toolId: 'tool-id',
  toolName: 'ChatGPT',
  amount: 49.99,
  currency: 'USD',
  transactionType: 'SUBSCRIPTION',
});
```

### 2. Database Backup (`scripts/backup-db.ts`)

Automatically backs up `prisma/dev.db` to `backups/` directory on every build.

#### Configuration

The backup script is integrated into the build process automatically via `package.json`.

To run manually:
```bash
npm run backup:db
```

### 3. Daily Report Generator (`scripts/daily-report.ts`, `src/app/admin/growth-report/`)

Generates daily performance reports for admin monitoring.

#### Report Includes
- Total users and new signups (24h)
- Reviews submitted and average ratings
- Revenue from affiliate clicks and subscriptions
- Top performing tools by views
- Database backup count

#### Usage

Generate report via CLI:
```bash
npm run report:daily
```

Or access via admin dashboard:
```
/admin/growth-report
```

## Automated Tasks

### Build-time Database Backup

The build process now includes automatic database backup:
```bash
npm run build
# This will:
# 1. Build the Next.js application
# 2. Run backup-db.ts to backup the SQLite database
```

### Review Notifications

Integrated into the review submission flow at `/api/tools/[slug]/reviews`:
- Fires when a new review is created (not updated)
- Logs to console with priority based on rating
- Optionally sends to webhook

### Revenue Notifications

To integrate revenue notifications, add this to your revenue creation points:

```typescript
// When creating revenue transactions
await prisma.revenueTransaction.create({
  data: { ... },
});

// Notify Growth Automation
notifyRevenueEarned({
  toolId: transaction.toolId,
  toolName: tool.name,
  amount: transaction.amount,
  currency: transaction.currency,
  transactionType: transaction.type,
});
```

## File Structure

```
.
├── scripts/
│   ├── backup-db.ts          # Database backup script
│   └── daily-report.ts       # Standalone report generator
├── src/lib/
│   └── growth-automation.ts  # Notification library
├── src/app/api/admin/
│   └── growth-report/
│       └── route.ts          # API endpoint (admin-only)
├── src/app/admin/
│   └── growth-report/
│       └── page.tsx          # Admin dashboard page
├── backups/                  # DB backup directory (created automatically)
└── reports/                  # Generated reports (created automatically)
```

## Priority Levels

Notifications are assigned priority based on impact:

| Event Type | Priority Criteria |
|------------|------------------|
| Reviews | High (4-5 stars), Medium (3 stars), Low (1-2 stars) |
| Revenue | High ($100+), Medium ($50-99), Low (< $50) |

## Security

- All admin endpoints are protected by role-based access control
- Only users with `ADMIN` or `OWNER` roles can access reports
- Webhook requests can be secured with a secret header