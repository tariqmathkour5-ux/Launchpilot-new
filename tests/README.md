# Blog Test Suite

## How to run

No test framework (Jest/Vitest/Mocha) is a dependency anywhere in this
project — there was nothing "existing" to follow. Rather than add a new
one (which also couldn't be installed in the sandbox this was built in —
no `node_modules`, no npm registry access), these tests use Node's
**built-in** test runner, which requires zero new dependencies:

```bash
node --experimental-strip-types --test tests/*.test.ts
```

(`--experimental-strip-types` is Node 22.6+'s native TypeScript support —
no ts-node, no build step. Once this project has `typescript`/`@types/node`
installed normally, `node --test tests/` without the flag works the same
way on Node 22.7+, since the flag becomes default-on there.)

All tests were verified to actually pass by running the command above
against the real source files — not just written and assumed correct.

## What's covered

Every file here imports the **real, actual source** via a relative path
(`../src/lib/...ts`) — these are not reimplementations or mocks of the
logic, they exercise the exact code that ships.

- `reading-time.test.ts` — word counting, minute rounding (Task 42)
- `table-of-contents.test.ts` — heading extraction, id generation, duplicate-heading collision handling (Task 42)
- `blog-internal-links.test.ts` — link assembly, URL-encoding, self-exclusion, the "no fake links" guarantee (Task 41)
- `rate-limit.test.ts` — window/limit/reset/per-key-independence (Task 44)
- `json-ld.test.ts` — the JSON-LD script-injection fix, including a test that demonstrates the vulnerability was real before the fix (Task 44)

## What's NOT covered, and why

Anything that imports Prisma (`@/lib/prisma`) or uses the `@/` path alias
— which is most of the repository and service layer (`blog-posts.ts`,
`blog-post-service.ts`, `blog-comments.ts`, etc.) — cannot be executed in
this environment. Confirmed directly rather than assumed:

```
node --experimental-strip-types -e "import('./src/lib/blog-posts.ts')..."
# Cannot find package '@/lib' imported from .../src/lib/blog-posts.ts
```

Plain Node has no understanding of the `@/*` -> `src/*` path mapping
declared in `tsconfig.json` — that's resolved by Next.js's bundler at
build time, not by Node directly. Testing those files properly needs
either a real test framework with path-alias + Prisma-mocking support
(Vitest is the natural choice given this is already a Next.js project),
or a live database connection for integration-style tests. Neither exists
in this sandbox. The pure business-logic *decision functions* inside
those files (permission checks, spam heuristics, status-transition rules,
etc.) were still validated during development, via disposable Node
scripts run against copy-pasted logic and documented turn-by-turn in
`DEVELOPMENT_LOG.md` — but those aren't checked into this repo as
reusable tests the way the files above are, and it's worth being precise
about that difference: a documented one-time check is not the same
guarantee as a test that runs on every future change.

## Recommended next step

Once `npm install` is possible: add Vitest (pairs well with Next.js,
supports the `@/` alias and `tsconfig.json` out of the box) and a Prisma
test-database or mock client, then port the validated decision logic
already living in `blog-post-service.ts`, `blog-comments.ts`, and
`blog-bulk-actions.ts` into real, permanent test files the same way the
files in this directory do for the pure modules.
