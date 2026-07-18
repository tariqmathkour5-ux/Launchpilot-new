# Weekly Tool Digest - Email Notification System

This feature sends automated weekly email summaries of new AI tools to registered users, helping them discover fresh content and return to the platform.

## Features

- 📧 **Automated Email Delivery** - Send weekly digests via Resend email service
- 🎯 **Smart Segmentation** - Only sends to users who have opted in and have valid email addresses
- 📊 **Rich Email Templates** - Responsive HTML emails with tool previews and categories
- 🔒 **Privacy Respect** - Users can opt out via settings
- 📈 **Analytics** - Tracks delivery status and prevents duplicate sends

## Setup

### 1. Install Dependencies

```bash
npm install resend
```

### 2. Configure Environment Variables

Add these to your `.env` file:

```env
# Resend Email (Required for sending emails)
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXX
RESEND_FROM_EMAIL=LaunchPilot <noreply@yourdomain.com>

# Site Configuration (Optional, already configured)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=LaunchPilot
```

### 3. Database Migration

Run the Prisma migration to add the new fields:

```bash
npx prisma migrate dev --name add_weekly_digest_settings
```

Or push directly to the database (development):

```bash
npx prisma db push
```

## Usage

### Via API Endpoint

**Preview the digest:**
```bash
GET /api/notifications/weekly-digest
```

Returns a preview of the tools that would be included in the digest.

**Send the digest:**
```bash
POST /api/notifications/weekly-digest
```

Sends the weekly digest to all eligible recipients.

### Via CLI Script

```bash
npm run digest:send
```

### Via Cron Job

Set up a weekly cron job (e.g., every Monday at 9 AM):

```bash
# Using cron
0 9 * * 1 npx ts-node --compiler-options {"module":"CommonJS"} scripts/weekly-digest.ts

# Using a scheduler like node-cron in your app
# See next section for integration example
```

## User Settings

Users can control their email preferences through the settings API:

### Get Settings
```
GET /api/user/settings
```

### Update Settings
```
PATCH /api/user/settings
{
  "weeklyToolDigest": true,
  "emailNotifications": true,
  "marketingEmails": false
}
```

### Settings Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `weeklyToolDigest` | boolean | `true` | Receive weekly tool digest emails |
| `emailNotifications` | boolean | `true` | Receive any email notifications |
| `marketingEmails` | boolean | `false` | Receive marketing/promotional emails |

## How It Works

1. **Eligibility Check** - The system identifies users who:
   - Have an email address
   - Have `emailNotifications` enabled
   - Have `weeklyToolDigest` enabled
   - Have `ACTIVE` status

2. **Tool Discovery** - Fetches tools published in the last 7 days

3. **Email Generation** - Creates both HTML and plain text versions of the digest

4. **Batch Sending** - Sends emails in batches of 50 to respect rate limits

5. **Tracking** - Records the last digest sent timestamp to prevent spam

## Files Created/Modified

- `src/lib/email.ts` - Resend email service integration
- `src/lib/weekly-digest.ts` - Core digest logic
- `src/app/api/notifications/weekly-digest/route.ts` - API endpoint
- `scripts/weekly-digest.ts` - CLI script
- `prisma/schema.prisma` - Added `weeklyToolDigest` and `lastDigestSentAt` to UserSettings
- `.env.example` - Added Resend configuration

## Integration with Newsletter Campaigns

The digest can also be queued as a newsletter campaign for admin review before sending:

```typescript
import { queueWeeklyDigestCampaign } from '@/lib/weekly-digest';

const campaign = await queueWeeklyDigestCampaign();
console.log('Campaign ID:', campaign?.id);
console.log('Tools included:', campaign?.toolCount);
```

## Customization

### Email Template

Modify `generateDigestEmailHTML()` and `generateDigestEmailText()` in `src/lib/weekly-digest.ts` to customize the email appearance.

### Digest Frequency

Change the `oneWeekAgo` calculation in `getNewToolsLastWeek()` to adjust the time window (e.g., 3 days, 2 weeks).

### From Address

Set `RESEND_FROM_EMAIL` in your environment to customize the sender address. In development, this defaults to `LaunchPilot <onboarding@resend.dev>`.

## Testing

In development without Resend configured, the system logs what would be sent:

```
[DEV] Resend not configured. Would send digest to eligible recipients.
[DEV] Eligible recipients count: 5
[DEV] New tools count: 3
```

## Troubleshooting

### Emails not sending
- Verify `RESEND_API_KEY` is set correctly
- Check that users have opted in via settings
- Ensure tools have `published: true` status

### TypeScript errors about userSettings
- Run `npx prisma generate` to regenerate the Prisma client
- The schema changes need to be reflected in the generated types