# LaunchPilot REST API v1 — Reference

Base URL: `/api/v1`

All endpoints return JSON. Authenticated endpoints require Bearer token in `Authorization` header.

---

## Authentication

### Get Token

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "email": "...", "role": "ADMIN" }
}
```

### Refresh Token

```bash
POST /api/v1/auth/refresh
Authorization: Bearer <token>
```

---

## Tools

### List Tools

```bash
GET /api/v1/tools?page=1&limit=20&category=Marketing&sort=rating
```

Response:
```json
{
  "data": [...],
  "meta": { "total": 120, "page": 1, "limit": 20, "pages": 6 }
}
```

### Get Tool

```bash
GET /api/v1/tools/:id
```

### Create Tool (Admin)

```bash
POST /api/v1/tools
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Tool Name",
  "slug": "tool-name",
  "description": "...",
  "categoryId": "...",
  "pricing": "Freemium"
}
```

### Update Tool (Admin)

```bash
PATCH /api/v1/tools/:id
Authorization: Bearer <token>
```

### Delete Tool (Admin)

```bash
DELETE /api/v1/tools/:id
Authorization: Bearer <token>
```

---

## Categories

### List Categories

```bash
GET /api/v1/categories
```

### Get Category

```bash
GET /api/v1/categories/:id
```

---

## Analytics

### Executive Metrics

```bash
GET /api/v1/analytics/executive?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <token>
```

Response:
```json
{
  "totalVisitors": 12500,
  "registeredUsers": 3400,
  "publishedTools": 580,
  "monthlyRevenue": 42500,
  "conversionRate": 3.2
}
```

### Traffic

```bash
GET /api/v1/analytics/traffic?startDate=...&endDate=...
Authorization: Bearer <token>
```

### Search

```bash
GET /api/v1/analytics/search?startDate=...&endDate=...
Authorization: Bearer <token>
```

---

## Affiliate

### Clicks

```bash
GET /api/v1/affiliate/clicks?startDate=...&endDate=...
Authorization: Bearer <token>
```

### Partners

```bash
GET /api/v1/affiliate/partners
Authorization: Bearer <token>
```

### Generate Link

```bash
POST /api/v1/affiliate/links
Authorization: Bearer <token>
Content-Type: application/json

{
  "toolId": "...",
  "partnerId": "...",
  "source": "newsletter"
}
```

---

## Blog

### List Posts

```bash
GET /api/v1/blog?status=PUBLISHED&page=1&limit=10
```

### Get Post

```bash
GET /api/v1/blog/:slug
```

### Create Post (Admin)

```bash
POST /api/v1/blog
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Post Title",
  "slug": "post-title",
  "content": "...",
  "categoryId": "...",
  "published": true
}
```

---

## Companies

### List Companies

```bash
GET /api/v1/companies?page=1&limit=20
```

### Get Company

```bash
GET /api/v1/companies/:id
```

### Create Company (Admin)

```bash
POST /api/v1/companies
Authorization: Bearer <token>
```

---

## Users

### Get Current User

```bash
GET /api/v1/user/profile
Authorization: Bearer <token>
```

### Update Profile

```bash
PATCH /api/v1/user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Name",
  "bio": "Updated bio"
}
```

### List Users (Admin)

```bash
GET /api/v1/users?page=1&limit=50&role=USER
Authorization: Bearer <token>
```

---

## Reviews

### List Reviews for Tool

```bash
GET /api/v1/tools/:id/reviews
```

### Create Review

```bash
POST /api/v1/tools/:id/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "title": "Great tool",
  "content": "Very useful..."
}
```

---

## Subscriptions & Billing

### Get Subscription

```bash
GET /api/v1/subscriptions/current
Authorization: Bearer <token>
```

### Create Checkout Session

```bash
POST /api/v1/subscriptions/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "pro",
  "billingCycle": "monthly"
}
```

### Webhook (Stripe)

```bash
POST /api/v1/subscriptions/webhook
Stripe-Signature: t=123456,v1=abc123
```

---

## Search

```bash
GET /api/v1/search?q=AI+writing&category=Marketing&limit=10
```

Response:
```json
{
  "query": "AI writing",
  "results": [...],
  "facets": { "categories": [...], "pricing": [...] }
}
```

---

## Import/Export

### Import Tools (Admin)

```bash
POST /api/v1/import/tools
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

file: <CSV/JSON>
```

Response:
```json
{
  "jobId": "uuid",
  "status": "processing",
  "report": {
    "totalRows": 500,
    "validRows": 450,
    "rowsWithIssues": 50
  }
}
```

### Export Tools

```bash
GET /api/v1/export/tools?format=csv&category=Marketing
Authorization: Bearer <admin_token>
```

---

## Webhooks

### Configure Webhook

```bash
POST /api/v1/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://yoursite.com/webhook",
  "events": ["tool.created", "review.created"],
  "secret": "whsec_..."
}
```

### List Webhooks

```bash
GET /api/v1/webhooks
Authorization: Bearer <token>
```

### Delete Webhook

```bash
DELETE /api/v1/webhooks/:id
Authorization: Bearer <token>
```

---

## Error Responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Must be valid email" }
    ]
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Internal Server Error |

### Rate Limits

- **Public endpoints**: 100 req/min per IP
- **Authenticated**: 1000 req/min per user
- **Admin**: 5000 req/min per user

---

## Pagination

```
GET /api/v1/tools?page=2&limit=20
```

Response includes `meta`:
```json
{
  "meta": {
    "total": 120,
    "page": 2,
    "limit": 20,
    "pages": 6
  }
}
```

---

## Filtering

- `?field=value` — exact match
- `?field.gte=10` — greater than or equal
- `?field.lte=100` — less than or equal
- `?field.like=%pattern%` — SQL LIKE
- `?field.in=val1,val2` — in array

Example:
```
GET /api/v1/tools?category=Marketing&pricing.in=Free,Freemium&sort=-createdAt
```

---

## OpenAPI Specification

Full OpenAPI/Swagger spec available at `/api/openapi.json` when `NODE_ENV=development` or `ENABLE_API_DOCS=true`.

Interactive docs at `/api/docs` (Swagger UI) in development.

---

## SDKs & Client Libraries

- **TypeScript/JavaScript**: `@launchpilot/client-sdk` (coming soon)
- **Python**: `launchpilot-python` (coming soon)
- **cURL examples**: See `/api/examples` in repo

---

**LaunchPilot v1.0 — Production Ready**