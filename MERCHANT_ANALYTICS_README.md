# Merchant Analytics Portal

## Overview

The Merchant Analytics Portal provides affiliate partners with secure, token-based access to their performance metrics without requiring a user account. Each partner receives a unique API token that grants them access to view their analytics data.

## Features

- **Token-based Authentication**: Secure access without needing to create an account
- **Partner-Isolated Data**: Each partner can only see their own analytics
- **Real-time Metrics**: Total clicks, conversions, and revenue data
- **30-Day Revenue Trend**: Visual chart showing daily revenue performance
- **Top Performing Tools**: See which tools generate the most revenue

## Setup

### 1. Generate API Tokens for Partners

Run the token generation script:

```bash
npm run generate:merchant-tokens
```

This will:
- Find all existing AffiliatePartners
- Generate a secure 64-character hex token for partners without one
- Display the token and API URL for each partner

### 2. Add New Partners

To add a new partner:

```bash
npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" scripts/generate-merchant-tokens.ts add "Partner Name" "partner@example.com" 15.0
```

Arguments:
- `name`: Partner's business name
- `email`: Partner's contact email
- `commission` (optional): Commission percentage (default: 10.0)

## Usage

### Accessing the Portal

Partners access their analytics at:

```
/admin/merchant-analytics?token=YOUR_API_TOKEN
```

### API Endpoints

#### GET - Retrieve Analytics Data

```
GET /admin/merchant-analytics?token=YOUR_API_TOKEN
```

Returns:
```json
{
  "partner": {
    "id": "partner_id",
    "name": "Partner Name",
    "email": "partner@example.com",
    "commission": 15.0,
    "status": "ACTIVE"
  },
  "totals": {
    "totalClicks": 1250,
    "totalConversions": 45,
    "totalRevenue": 1250.50,
    "conversionRate": 3.6
  },
  "dailyStats": [
    {
      "date": "2025-01-12",
      "clicks": 42,
      "conversions": 2,
      "revenue": 42.50
    }
  ],
  "topTools": [
    {
      "toolId": "tool_id",
      "toolName": "Tool Name",
      "toolSlug": "tool-slug",
      "clicks": 100,
      "conversions": 10,
      "revenue": 100.00,
      "conversionRate": 10.0
    }
  ]
}
```

#### POST - Refresh Analytics Data

```
POST /admin/merchant-analytics
Content-Type: application/json

{
  "token": "YOUR_API_TOKEN"
}
```

## Security Considerations

1. **Token Format**: 64-character hex strings (32 bytes of randomness)
2. **Token Length Validation**: Minimum 32 characters required
3. **Partner Status**: Only ACTIVE partners can access analytics
4. **Last Login Tracking**: Automatically updates when token is used
5. **No Session Required**: Token-based auth doesn't rely on cookies

## Database Schema Changes

The following fields were added to `AffiliatePartner`:

```prisma
model AffiliatePartner {
  // ... existing fields
  apiToken        String   @unique  // Secure API token
  lastLoginAt     DateTime?  // Last access timestamp
  affiliateClicks    AffiliateClick[]  // Relation back
  revenueTransactions RevenueTransaction[]  // Relation back
}
```

## Analytics Components

The portal displays:

1. **Total Revenue**: Sum of completed affiliate earnings
2. **Total Clicks**: All affiliate clicks tracked for the partner
3. **Conversions**: Number of successful transactions
4. **Conversion Rate**: Percentage of clicks that converted
5. **30-Day Chart**: Visual representation of revenue trends
6. **Top Tools Table**: Ranked by revenue generated

## Integration with Affiliate System

- Clicks are tracked when `?ref=PARTNER_CODE` is present in tool links
- Revenue transactions must have `type: "AFFILIATE_EARNING"` and `status: "COMPLETED"` for revenue counting
- Commission rates are stored per-partner and displayed in the portal