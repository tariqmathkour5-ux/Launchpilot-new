-- Blog Content Status Management
-- Adds a proper 4-state status column (DRAFT / REVIEW / PUBLISHED / ARCHIVED)
-- to BlogPost. This is additive alongside the existing "published" boolean
-- and "publishedAt" timestamp (Task 1 / Task 9's scheduling workflow) —
-- neither is removed or renamed, so every existing query, page, and API
-- route that reads "published"/"publishedAt" keeps working unchanged.
--
-- Note: an earlier draft of this exact enum/column was proposed and then
-- reverted during Milestone 5 Task 5, before this task explicitly asked
-- for a 4-state model — that revert is unrelated to this migration; this
-- is a fresh, deliberate addition, not a re-application of old, abandoned work.

CREATE TYPE "BlogPostStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

ALTER TABLE "BlogPost" ADD COLUMN "status" "BlogPostStatus" NOT NULL DEFAULT 'DRAFT';

-- Backfill: any post that is already published (published = true) should
-- start out with status = PUBLISHED, not the column default of DRAFT —
-- otherwise every existing published post would look like a draft the
-- moment this migration runs.
UPDATE "BlogPost" SET "status" = 'PUBLISHED' WHERE "published" = true;

CREATE INDEX "BlogPost_status_idx" ON "BlogPost"("status");
