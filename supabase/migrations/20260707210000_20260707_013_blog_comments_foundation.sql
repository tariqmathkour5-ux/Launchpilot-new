-- Blog Comments Database Foundation
-- New table: BlogComment. Foundation only — no moderation workflow
-- (approve/reject endpoints, notification hooks, spam filtering, etc.)
-- is implemented in this migration or anywhere else yet. The status
-- column exists and defaults to 'PENDING' so future moderation work has
-- something to build on, but nothing acts on it yet.

CREATE TYPE "BlogCommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "BlogComment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "postId" TEXT NOT NULL REFERENCES "BlogPost"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "authorName" TEXT,
  "authorEmail" TEXT,
  "content" TEXT NOT NULL,
  "status" "BlogCommentStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "BlogComment_postId_idx" ON "BlogComment"("postId");
CREATE INDEX "BlogComment_userId_idx" ON "BlogComment"("userId");
CREATE INDEX "BlogComment_status_idx" ON "BlogComment"("status");

-- Enable RLS
ALTER TABLE "BlogComment" ENABLE ROW LEVEL SECURITY;

-- No policies added yet — deliberately. Read/write access rules belong to
-- the moderation system this task explicitly excludes ("who can see a
-- PENDING comment", "can a guest submit one", "can a user edit their own"
-- are moderation/access decisions, not foundation-schema ones). RLS is
-- enabled with zero policies, which defaults to denying all access until
-- real policies are added — safer than guessing permissive ones now.
