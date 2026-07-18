-- Create enum for roles
CREATE TYPE "Role" AS ENUM ('USER', 'EDITOR', 'ADMIN');

-- Users table
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT,
  "email" TEXT UNIQUE,
  "emailVerified" TIMESTAMP,
  "image" TEXT,
  "password" TEXT,
  "role" "Role" DEFAULT 'USER',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Accounts table (for OAuth)
CREATE TABLE "Account" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  UNIQUE("provider", "providerAccountId")
);

-- Sessions table
CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "expires" TIMESTAMP NOT NULL
);

-- Verification tokens
CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT UNIQUE NOT NULL,
  "expires" TIMESTAMP NOT NULL,
  UNIQUE("identifier", "token")
);

-- Categories
CREATE TABLE "Category" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Tools
CREATE TABLE "Tool" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL REFERENCES "Category"("id"),
  "pricing" TEXT DEFAULT 'unknown',
  "hasFreeTier" BOOLEAN DEFAULT false,
  "hasApi" BOOLEAN DEFAULT false,
  "platforms" TEXT[] DEFAULT '{}',
  "features" TEXT[] DEFAULT '{}',
  "pros" TEXT[] DEFAULT '{}',
  "cons" TEXT[] DEFAULT '{}',
  "useCases" TEXT[] DEFAULT '{}',
  "integrations" TEXT[] DEFAULT '{}',
  "websiteUrl" TEXT,
  "rating" DOUBLE PRECISION,
  "published" BOOLEAN DEFAULT true,
  "authorId" TEXT REFERENCES "User"("id"),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "Tool_categoryId_idx" ON "Tool"("categoryId");
CREATE INDEX "Tool_published_idx" ON "Tool"("published");

-- Reviews
CREATE TABLE "Review" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "toolId" TEXT UNIQUE NOT NULL REFERENCES "Tool"("id") ON DELETE CASCADE,
  "rating" DOUBLE PRECISION NOT NULL,
  "content" TEXT NOT NULL,
  "summary" TEXT,
  "authorId" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Alternatives
CREATE TABLE "Alternative" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "toolId" TEXT UNIQUE NOT NULL REFERENCES "Tool"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- FAQs
CREATE TABLE "Faq" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "toolId" TEXT NOT NULL REFERENCES "Tool"("id") ON DELETE CASCADE,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "Faq_toolId_idx" ON "Faq"("toolId");

-- Blog posts
CREATE TABLE "BlogPost" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" TEXT UNIQUE NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "content" TEXT NOT NULL,
  "excerpt" TEXT,
  "coverImage" TEXT,
  "featured" BOOLEAN DEFAULT false,
  "published" BOOLEAN DEFAULT false,
  "publishedAt" TIMESTAMP,
  "authorId" TEXT REFERENCES "User"("id"),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "tags" TEXT[] DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tool" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Alternative" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Faq" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;

-- Public read for categories and published tools
CREATE POLICY "read_categories" ON "Category" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read_published_tools" ON "Tool" FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "read_reviews" ON "Review" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read_alternatives" ON "Alternative" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read_faqs" ON "Faq" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "read_published_posts" ON "BlogPost" FOR SELECT TO anon, authenticated USING (published = true);

-- Authenticated write policies (will be restricted by role in app)
CREATE POLICY "write_tools" ON "Tool" FOR ALL TO authenticated USING (true);
CREATE POLICY "write_categories" ON "Category" FOR ALL TO authenticated USING (true);
CREATE POLICY "write_reviews" ON "Review" FOR ALL TO authenticated USING (true);
CREATE POLICY "write_alternatives" ON "Alternative" FOR ALL TO authenticated USING (true);
CREATE POLICY "write_faqs" ON "Faq" FOR ALL TO authenticated USING (true);
CREATE POLICY "write_posts" ON "BlogPost" FOR ALL TO authenticated USING (true);

-- User policies
CREATE POLICY "user_read_own" ON "User" FOR SELECT TO authenticated USING (auth.uid()::text = id);
CREATE POLICY "user_update_own" ON "User" FOR UPDATE TO authenticated USING (auth.uid()::text = id);

-- Account and session policies
CREATE POLICY "account_read_own" ON "Account" FOR SELECT TO authenticated USING (auth.uid()::text = "userId");
CREATE POLICY "session_read_own" ON "Session" FOR SELECT TO authenticated USING (auth.uid()::text = "userId");