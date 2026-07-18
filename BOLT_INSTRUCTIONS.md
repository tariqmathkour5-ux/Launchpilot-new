# Bolt Development Instructions for LaunchPilot

## Project Context

LaunchPilot is an AI Tools Directory & Review Platform. Follow these rules for all future development.

## File Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard (protected)
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── categories/        # Category listing and detail
│   ├── tools/             # Tool listing and detail
│   └── page.tsx           # Homepage
├── components/
│   ├── admin/             # Admin-specific components
│   └── *.tsx              # Shared components
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Prisma client singleton
│   ├── supabase.ts        # Supabase client
│   ├── tools.ts           # Markdown content parsing
│   ├── markdown.ts        # Shared markdown renderer
│   └── permissions.ts     # RBAC permission helpers
├── types/                 # TypeScript definitions
└── data/                  # Markdown content files
    ├── tool_pages/        # 105 tool descriptions
    ├── reviews/           # 105 tool reviews
    └── alternatives/      # 105 alternative comparisons
```

## Development Rules

### Authentication

- Use `src/lib/auth.ts` for server-side auth (`auth()` function)
- Use `useSession` from `next-auth/react` for client-side auth
- Session includes: `id`, `name`, `email`, `image`, `role`
- Admin routes require `ADMIN` or `EDITOR` role
- Super admin actions require `ADMIN` role only

### API Routes

1. Always import auth from `@/lib/auth`
2. Check session before processing:
   ```typescript
   const session = await auth();
   if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }
   ```
3. Use Zod for request validation
4. Return standardized responses:
   - Success: `{ data }` or `{ success: true }`
   - Error: `{ error: "Message" }` with appropriate status code

### Database

- Always use Prisma client from `@/lib/prisma`
- Use Supabase MCP tools for migrations (`apply_migration`)
- Use `execute_sql` for raw queries when needed
- All tables have RLS enabled — use service role for admin operations

### Roles & Permissions

Default roles (see `user_roles` table):
1. Super Admin (level 100) — Full access
2. Admin (level 80) — Administrative access
3. Moderator (level 60) — Content moderation
4. Editor (level 40) — Content editing
5. Support (level 30) — Customer support
6. Company (level 20) — Company dashboard
7. Creator (level 15) — Content creation
8. Premium User (level 10) — Premium features
9. Standard User (level 5) — Basic access

Use `src/lib/permissions.ts` for permission checks:
```typescript
import { hasPermission, requireAdmin } from "@/lib/permissions";
```

### Styling

- Use Tailwind CSS classes exclusively
- Follow existing color system:
  - `primary-*` — Blue tones
  - `secondary-*` — Slate/gray tones
  - `accent-*` — Green tones
  - `success-*` — Green feedback
  - `warning-*` — Amber alerts
  - `error-*` — Red errors
- Use utility classes: `.btn`, `.card`, `.input`
- NO purple/violet tones unless explicitly requested

### Component Patterns

1. Client components: `'use client'` directive
2. Server components: No directive (default)
3. Use existing components before creating new ones:
   - `StatsCard` — Dashboard statistics
   - `DataTable` — Tables with search/pagination
   - `ToolCard` — Tool preview cards
   - `CategoryCard` — Category cards

### Content Parsing

Tools, reviews, and alternatives are parsed from markdown files:
```typescript
import { parseToolPage, getAllTools, searchTools } from '@/lib/tools';
```

## Adding New Features

1. **New API Route:**
   - Create in `src/app/api/`
   - Add auth check
   - Add Zod validation
   - Return standardized response

2. **New Admin Page:**
   - Create in `src/app/admin/`
   - Use existing layout (auto-protected)
   - Use DataTable for listings
   - Implement CRUD via API routes

3. **New Database Table:**
   - Create migration using Supabase MCP: `apply_migration`
   - Update `prisma/schema.prisma`
   - Enable RLS with appropriate policies
   - Run `npx prisma generate`

4. **New Content Type:**
   - Add markdown files to `src/data/`
   - Update `src/lib/tools.ts` with parser
   - Create detail page in `src/app/tools/[slug]/`

## Validation Checklist

Before completing any task:
- [ ] TypeScript: `npx tsc --noEmit` passes
- [ ] Prisma: `npx prisma validate` passes
- [ ] Build: `npm run build` succeeds
- [ ] No console.log statements in production code
- [ ] Auth checks on protected routes
- [ ] Zod validation on API inputs

## Common Commands

```bash
# Development
npm run dev

# Build
npm run build

# TypeScript check
npx tsc --noEmit

# Prisma validation
npx prisma validate
npx prisma generate

# Database migration (via MCP)
apply_migration tool
```
