-- Blog Approval Workflow (Task 52) + Blog Content Templates (Task 54)

CREATE TYPE "BlogApprovalAction" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED');

CREATE TABLE "BlogPostApproval" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "postId" TEXT NOT NULL REFERENCES "BlogPost"("id") ON DELETE CASCADE,
  "action" "BlogApprovalAction" NOT NULL,
  "notes" TEXT,
  "actorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "BlogPostApproval_postId_idx" ON "BlogPostApproval"("postId");
CREATE INDEX "BlogPostApproval_createdAt_idx" ON "BlogPostApproval"("createdAt");

ALTER TABLE "BlogPostApproval" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_blog_post_approval" ON "BlogPostApproval" FOR SELECT TO authenticated USING (true);
CREATE POLICY "write_blog_post_approval" ON "BlogPostApproval" FOR ALL TO authenticated USING (true);

-- Blog Content Templates
CREATE TABLE "BlogPostTemplate" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "titleTemplate" TEXT,
  "contentTemplate" TEXT NOT NULL,
  "categoryId" TEXT REFERENCES "BlogCategory"("id") ON DELETE SET NULL,
  "createdById" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "BlogPostTemplate_categoryId_idx" ON "BlogPostTemplate"("categoryId");

ALTER TABLE "BlogPostTemplate" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_blog_post_template" ON "BlogPostTemplate" FOR SELECT TO authenticated USING (true);
CREATE POLICY "write_blog_post_template" ON "BlogPostTemplate" FOR ALL TO authenticated USING (true);
