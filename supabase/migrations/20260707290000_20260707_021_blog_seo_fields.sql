-- Blog Admin SEO Management Tools (Task 48)
-- Adds real, persisted SEO fields to BlogPost. These were deliberately
-- kept out of the schema in Tasks 5, 7, and 25 because nothing needed
-- them yet. This task is the first one to actually ask for a real,
-- persisted admin control for them, so they're added now, not before.

ALTER TABLE "BlogPost" ADD COLUMN "seoTitle" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "seoDescription" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "seoCanonicalUrl" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "seoOgImage" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "seoNoIndex" BOOLEAN NOT NULL DEFAULT false;
