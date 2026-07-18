# LaunchPilot — Project Debug Report

**Date:** 2026-07-09
**Scope:** One-time full-project stabilization pass (not a redesign, no new features)
**Environment constraint that shaped this entire pass:** No `node_modules`, no npm registry access (`npm install` fails with `403 Forbidden` — confirmed by attempting it at the start of this task, same result as every prior attempt this session). This means `npm install`, `npx prisma generate`, `npx tsc --noEmit`, `next lint`, and `next build` could **not** be run. Every finding below comes from static analysis: full-project syntax checking via Node 22's native TypeScript stripping (for `.ts` files, which actually run), structural balance checks (for `.tsx` files, since JSX isn't supported by that mechanism), and cross-referencing source against itself (import resolution, export matching, schema-vs-migration consistency). Where something could not be verified, that is stated explicitly rather than implied.

---

## Step 1-4: Errors Found and Fixed

### 1. `src/middleware.ts` — CRITICAL, confirmed, fixed
**The most severe issue found.** `PUBLIC_PATHS` only listed `/`, `/tools`, `/categories`, `/search`, `/api`. Any path not matching a public prefix, not an auth path, and not already logged in gets redirected to `/auth/signin`. This meant the following real, existing, page-containing public routes were all silently gated behind login:

`/blog` (and every sub-page: posts, authors, RSS), `/companies`, `/compare`, `/collections`, `/tags`, `/use-cases`, `/pricing`, `/privacy`, `/terms`, `/affiliate-disclosure`.

An anonymous visitor hitting any of these would be bounced to sign-in instead of seeing the page. This is not a blog-specific bug — it affects nearly the entire public-facing marketing/content site.

**Fix:** added all nine missing prefixes to `PUBLIC_PATHS`. Verified the fix doesn't accidentally expose anything that should stay protected:
- `/companies` (public directory) vs `/company` (the authenticated company portal, `src/app/company/layout.tsx`) — confirmed `"/company/dashboard".startsWith("/companies")` is `false`; no overlap.
- `/admin/blog` still correctly matches the separate `ADMIN_PATHS` check (`/admin`), unaffected.
- `/dashboard` (the user's personal area) was deliberately **not** added — it's supposed to require login, and still does.

### 2. `prisma/schema.prisma` — `Permission` model missing `@@map`, confirmed, fixed
The `Permission` model had no `@@map`, so Prisma would look for a table literally named `"Permission"`. The actual table, created in `002_enterprise_admin_schema.sql`, is named `"permissions"` (lowercase). Every column name already matched (camelCase, no per-field `@map` needed) — confirmed by reading the migration directly. **Fix:** added `@@map("permissions")`. This is the same bug *class* as `ToolView` and the pre-Task-40 `NewsletterCampaign` (documented earlier this session) — a systemic pattern in the Milestone 2/4 analytics-era tables of the model not matching its real table. This occurrence was fixed because it's a simple, safe, one-line, high-confidence correction; `ToolView` (Task 29) remains flagged-but-unfixed since nothing in the current codebase calls it, so fixing it isn't needed to make the app run, and touching an unused table's mapping carries a small chance of being wrong about intent with no way to verify against a live database here.

### 3. `prisma/schema.prisma` — `directUrl` never wired up, confirmed, fixed
`.env` already defines both `DATABASE_URL` (pooled, port 6543, `pgbouncer=true`) and `DIRECT_URL` (direct, port 5432) — the standard Supabase/pgbouncer pattern where migrations need to bypass the pooler. The `datasource` block only used `url = env("DATABASE_URL")`; `directUrl` was never referenced. Running migrations through a transaction-mode pgbouncer connection is a well-known source of failures for DDL statements. **Fix:** added `directUrl = env("DIRECT_URL")`.

### 4. `.gitignore` — missing `.next` and `*.tsbuildinfo`, confirmed, fixed
An earlier log entry (Architecture Stabilization milestone) claimed `.next/` had already been added to `.gitignore`. It hadn't — confirmed by reading the actual current file. A `tsconfig.tsbuildinfo` build artifact is also currently sitting in the repo root, unignored. **Fix:** added both.

### 5. `package.json` — `seed` script points at a non-existent file, confirmed, **not fixed**
`"seed": "ts-node ... scripts/seed.ts"` — there is no `scripts/` directory anywhere in this project. Running `npm run seed` would fail immediately. **Not fixed**, deliberately: this script is not invoked by `dev`, `build`, or `start`, so it doesn't block running or building the app, and writing seed data logic from nothing would mean guessing what the project owner actually wants seeded — that's closer to "adding a feature" than "fixing an error," and outside this task's explicit "do not add new features" boundary. Flagged here instead.

### Database relation / schema integrity — full sweep, zero issues found
Wrote and ran a script that parses every model in `schema.prisma` (38 models, 17 enums) and checks:
- Every relation field has a matching back-relation field on the target model — **0 issues** (all 38 models)
- No ambiguous multi-relations between the same two models without explicit `@relation` naming — **0 issues**
- Every field's type resolves to a known scalar, model, or enum (catches typo'd type names) — **0 issues**
- No duplicate field names within any single model — **0 issues**
- No duplicate `@map` column targets within any single model — **0 issues**
- Every model has a matching `CREATE TABLE` somewhere in `supabase/migrations/*.sql` (after the `Permission` fix above) — **0 remaining gaps** (was 1, now fixed)

---

## Step 5: Application Build Validation — what could and could not be run

| Check | Status | Notes |
|---|---|---|
| `npm install` | **Blocked** | `403 Forbidden` from the npm registry — confirmed by direct attempt at the start of this task |
| `npx prisma validate` | **Not run** | Requires the Prisma CLI, which requires `node_modules` |
| `npx tsc --noEmit` | **Not run** | Same reason |
| `next lint` | **Not run** | Same reason |
| `next build` | **Not run** | Same reason |
| **Substitute static checks actually performed** | | |
| Real syntax check on every `.ts` file (Node 22 native TS stripping) | **139 / 139 passed, 0 real syntax errors** | Only "module not found" errors seen for `zod`/`@prisma/client`/`@/` alias — none were `SyntaxError` |
| Brace/paren/bracket balance on every `.tsx` file | **96 / 96 passed** | JSX isn't supported by the native TS stripper, so this is the closest available check |
| Every `@/...` import resolves to a real file | **408 / 408 resolved** | |
| Every named import from an `@/...` path matches a real export (including destructuring exports like `export const { handlers, auth } = NextAuth(...)`) | **421 / 421 resolved** | |
| Every relative import in `src/` resolves | **1 / 1 resolved** | Nearly everything uses the `@/` alias |
| Route/page file naming (`route.ts`, `page.tsx`) | **Clean** | No misnamed files found |
| Conflicting dynamic route segments | **Clean** | None found |
| `package-lock.json` validity | **Valid**, `lockfileVersion: 3` | |
| Automated test suite (`tests/`) | **28 / 28 passing** | Actually executed |

**Bottom line:** every check that could actually be executed in this environment passed. `prisma generate`/`tsc`/`next build` were not run and cannot be claimed as passing — run them in an environment with npm registry access before considering this truly build-verified.

---

## Step 6: Preview Preparation

**Command to start the project** (once dependencies are installed):
```bash
npm install
npx prisma generate
npm run dev
```

**Preview URL:** `http://localhost:3000`

**Required environment variables:** `.env` already has real-looking values for all of: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `REVALIDATE_SECRET`. Optional/missing: `SUPABASE_SERVICE_ROLE_KEY` (falls back to the anon key if absent), `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (Google sign-in conditionally omitted if absent) — both degrade gracefully rather than crash. See `.env.example` for the full documented list.

**Could not verify directly in this sandbox** (no `node_modules`): dev server actually starting, pages loading in a browser, auth flow end-to-end, admin dashboards opening, whether `prisma generate` succeeds against the real schema.

**What is now true that wasn't before this pass:** the public marketing/content site will actually be reachable by anonymous visitors once the server runs, instead of bouncing everyone to sign-in.

### Remaining warnings
- `npm run seed` will fail (missing file, pre-existing, not fixed)
- `ToolView` and select earlier-documented issues intentionally left alone since nothing depends on the broken behavior
- Rate limiting (blog) is in-memory/per-process only
- No email-sending capability anywhere in this codebase
- No localization/i18n system exists

---

## Files Modified

| File | Change |
|---|---|
| `src/middleware.ts` | Added 9 missing public route prefixes to `PUBLIC_PATHS` |
| `prisma/schema.prisma` | Added `@@map("permissions")` to `Permission`; added `directUrl` to the datasource block |
| `.gitignore` | Added `.next` and `*.tsbuildinfo` |

No files deleted. No models, migrations, or existing data removed. No new features added. No architecture redesigned.

## Database Changes
None requiring a new migration — both schema fixes correct how Prisma *describes* existing database objects; neither changes what's actually in the database.

## APIs Added
None (out of scope for this task).

## Components Added
None (out of scope for this task).

## Validation Status
All statically-verifiable checks pass: 0 real errors across 139 `.ts` and 96 `.tsx` files, 829 total import/export cross-references, and a full schema relation/type/duplicate sweep across 38 models. Full build validation was not possible in this sandbox.

## Build Status
**Not build-tested** (no npm registry access). Statically clean by every check available without the real toolchain.

## Preview Status
**Not run-tested** (same reason). The change most likely to have blocked a successful preview — middleware gating nearly the entire public site behind login — has been fixed.

## Remaining Issues
1. `npm run seed` references a missing file — not fixed, not blocking normal operation
2. Full build/type-check/lint have never been run against this code — must be done in a real environment before deployment
3. Known scope boundaries from earlier tasks (rate limiting, email, localization) — not new findings, listed above for completeness
