# Vercel Import List

This file contains the required environment variables ready for import into Vercel.
Values are taken directly from the local .env file (not masked).

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=LaunchPilot
NEXT_PUBLIC_SUPABASE_URL=https://mhlbxhakqappfimymdqp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1obGJ4aGFrcWFwcGZpbXltZHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MzQ4MjUsImV4cCI6MjA5ODMxMDgyNX0.SldZZ90jUadZ6PjsJ17_Ei-zUvlQa9bMOly5YtP9waM
DATABASE_URL="file:./prisma/dev.db"
DIRECT_URL="file:./prisma/dev.db"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-change-in-production
REVALIDATE_SECRET=development-revalidate-secret-change-in-production
TELEGRAM_BOT_TOKEN=8924898729:AAEzBLwUTWmOdJcXSjybrszCCcnS_6RoipU
TELEGRAM_ADMIN_CHAT_ID=6158300168
AGENT_SYSTEM_SECRET=your-secure-random-secret-here
```

---

## Verification Summary

### Total required variables: 8

1. `NEXT_PUBLIC_SITE_URL` - Has non-empty value ✅
2. `NEXT_PUBLIC_SITE_NAME` - Has non-empty value ✅
3. `DATABASE_URL` - Has non-empty value ✅
4. `DIRECT_URL` - Has non-empty value ✅
5. `NEXTAUTH_URL` - Has non-empty value ✅
6. `NEXTAUTH_SECRET` - Has non-empty value ✅
7. `RESEND_API_KEY` - ❌ Missing (empty in .env)
8. `RESEND_FROM_EMAIL` - ❌ Missing (empty in .env)

### Missing variables (empty or not set):
- RESEND_API_KEY
- RESEND_FROM_EMAIL

### Variables with empty values:
- PAYTABS_SERVER_KEY (empty)
- PAYTABS_PROFILE_ID (empty)
- OPENAI_API_KEY (empty)
- GROQ_API_KEY (not set)
- GEMINI_API_KEY (not set)
- GITHUB_CLIENT_ID (not set)
- GITHUB_CLIENT_SECRET (not set)
- GOOGLE_CLIENT_ID (not set)
- GOOGLE_CLIENT_SECRET (not set)

### Ready for Vercel: NO

> Reason: RESEND_API_KEY and RESEND_FROM_EMAIL are required but have empty values in .env. These must be configured before deployment.