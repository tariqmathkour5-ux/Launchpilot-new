-- Blog Performance Optimization
-- Two compound indexes matching query patterns that already exist in the
-- codebase, not speculative ones:
--   - getPublished() (src/lib/blog-posts.ts) filters published=true AND
--     sorts by publishedAt DESC together — a compound index lets
--     Postgres satisfy both in one index scan instead of filtering on
--     the existing single-column published index, then sorting separately.
--   - getCommentsByPost() (src/lib/blog-comments.ts) filters postId AND
--     status together for the public (APPROVED-only) case.
-- No other indexes were added speculatively — every index here maps to
-- a query that already runs in production code.

CREATE INDEX "BlogPost_published_publishedAt_idx" ON "BlogPost"("published", "publishedAt");
CREATE INDEX "BlogComment_postId_status_idx" ON "BlogComment"("postId", "status");
