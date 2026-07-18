-- Blog Revision History
-- New table: BlogPostRevision. Full-snapshot revisions of a post's
-- editable content fields (title/slug/content/excerpt/description/
-- categoryId) — not a diff/patch system, and not a copy of lifecycle
-- state (published/status/publishedAt/tags aren't part of a revision).

CREATE TABLE "BlogPostRevision" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "postId" TEXT NOT NULL REFERENCES "BlogPost"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "excerpt" TEXT,
  "description" TEXT,
  "categoryId" TEXT,
  "authorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "BlogPostRevision_postId_idx" ON "BlogPostRevision"("postId");
CREATE INDEX "BlogPostRevision_createdAt_idx" ON "BlogPostRevision"("createdAt");

-- Enable RLS
ALTER TABLE "BlogPostRevision" ENABLE ROW LEVEL SECURITY;

-- Revision history is an editorial/admin concern, not public content —
-- unlike BlogCategory/BlogTag, there is no anon read policy here at all.
-- App-level routes are still expected to further restrict this to
-- ADMIN/EDITOR, matching how every other admin write policy in this
-- schema (e.g. write_blog_categories) is broad at the RLS level and
-- narrowed by the application, not by RLS role granularity.
CREATE POLICY "read_blog_post_revisions" ON "BlogPostRevision" FOR SELECT TO authenticated USING (true);
CREATE POLICY "write_blog_post_revisions" ON "BlogPostRevision" FOR ALL TO authenticated USING (true);
