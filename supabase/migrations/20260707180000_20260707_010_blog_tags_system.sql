-- Blog Tags System
-- New tables: BlogTag, BlogPostTag (many-to-many join between BlogPost and BlogTag)
-- Coexists with BlogPost.tags (String[], added in the initial schema and used by
-- the blog search / related-posts features) — that column is left untouched here.

-- Blog tags
CREATE TABLE "BlogTag" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "BlogTag_slug_idx" ON "BlogTag"("slug");

-- Join table linking BlogPost <-> BlogTag (many-to-many)
CREATE TABLE "BlogPostTag" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "postId" TEXT NOT NULL REFERENCES "BlogPost"("id") ON DELETE CASCADE,
  "tagId" TEXT NOT NULL REFERENCES "BlogTag"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE ("postId", "tagId")
);

CREATE INDEX "BlogPostTag_postId_idx" ON "BlogPostTag"("postId");
CREATE INDEX "BlogPostTag_tagId_idx" ON "BlogPostTag"("tagId");

-- Enable RLS
ALTER TABLE "BlogTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogPostTag" ENABLE ROW LEVEL SECURITY;

-- Public read for blog tags and their post links
CREATE POLICY "read_blog_tags" ON "BlogTag" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read_blog_post_tags" ON "BlogPostTag" FOR SELECT TO anon, authenticated USING (true);

-- Authenticated write policy (will be restricted by role in app)
CREATE POLICY "write_blog_tags" ON "BlogTag" FOR ALL TO authenticated USING (true);
CREATE POLICY "write_blog_post_tags" ON "BlogPostTag" FOR ALL TO authenticated USING (true);
