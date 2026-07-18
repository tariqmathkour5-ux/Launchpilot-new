-- Blog Category Foundation
-- New table: BlogCategory
-- Alters: BlogPost (adds categoryId reference)

-- Blog categories
CREATE TABLE "BlogCategory" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "BlogCategory_slug_idx" ON "BlogCategory"("slug");

-- Link BlogPost to BlogCategory (nullable: existing posts are uncategorized until backfilled)
ALTER TABLE "BlogPost" ADD COLUMN "categoryId" TEXT REFERENCES "BlogCategory"("id");

CREATE INDEX "BlogPost_categoryId_idx" ON "BlogPost"("categoryId");

-- Enable RLS
ALTER TABLE "BlogCategory" ENABLE ROW LEVEL SECURITY;

-- Public read for blog categories
CREATE POLICY "read_blog_categories" ON "BlogCategory" FOR SELECT TO anon, authenticated USING (true);

-- Authenticated write policy (will be restricted by role in app)
CREATE POLICY "write_blog_categories" ON "BlogCategory" FOR ALL TO authenticated USING (true);
