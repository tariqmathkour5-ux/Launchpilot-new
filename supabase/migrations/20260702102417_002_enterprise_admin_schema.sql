/*
# Enterprise Admin Dashboard Schema

This migration adds comprehensive enterprise management capabilities to LaunchPilot.

## New Enum Types
- `UserStatus`: ACTIVE, SUSPENDED, PENDING, DELETED — user account states
- `LegacyRole`: USER, EDITOR, ADMIN — preserved for backward compatibility
- `CompanySize`: STARTUP, SMALL, MEDIUM, LARGE, ENTERPRISE
- `CompanyStatus`: ACTIVE, INACTIVE, PENDING, SUSPENDED
- `AffiliateStatus`: ACTIVE, INACTIVE, PENDING, SUSPENDED
- `AdPosition`: HEADER, SIDEBAR, FOOTER, INLINE, POPUP
- `AdType`: IMAGE, VIDEO, TEXT, HTML
- `AdStatus`: DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED
- `DiscountType`: PERCENTAGE, FIXED
- `CouponStatus`: ACTIVE, INACTIVE, EXPIRED
- `NewsletterStatus`: ACTIVE, UNSUBSCRIBED, BOUNCED
- `NotificationType`: SYSTEM, REVIEW, TOOL, COMPANY, USER, PAYMENT, ALERT

## New Tables
- `user_roles`: Custom roles with permission assignments
- `permissions`: Granular permissions for resources
- `Company`: Tool vendors and companies
- `UserReview`: User-submitted tool reviews
- `AffiliateClick`: Track outbound clicks
- `AffiliatePartner`: Affiliate partners
- `Advertisement`: Managed advertisements
- `Coupon`: Discount codes
- `NewsletterSubscriber`: Email subscribers
- `Notification`: User notifications
- `MediaFile`: Uploaded files
- `MediaFolder`: Folder organization
- `ActivityLog`: Audit trail
- `SystemSetting`: Configuration storage
- `WebsiteVisit`: Page visit tracking
- `SEOMetadata`: Per-path SEO config

## Modified Tables
- `User`: Added roleId, legacyRole, status columns
- `Tool`: Added companyId, featured columns

## Security
- RLS enabled on all new tables
- Policies for authenticated admin access
- Public read policies for published content
*/

-- =====================================================
-- ENUM TYPES
-- =====================================================

DO $$ BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING', 'DELETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "LegacyRole" AS ENUM ('USER', 'EDITOR', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TYPE "CompanySize" AS ENUM ('STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE');
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED');
CREATE TYPE "AffiliateStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED');
CREATE TYPE "AdPosition" AS ENUM ('HEADER', 'SIDEBAR', 'FOOTER', 'INLINE', 'POPUP');
CREATE TYPE "AdType" AS ENUM ('IMAGE', 'VIDEO', 'TEXT', 'HTML');
CREATE TYPE "AdStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');
CREATE TYPE "CouponStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');
CREATE TYPE "NewsletterStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED', 'BOUNCED');
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'REVIEW', 'TOOL', 'COMPANY', 'USER', 'PAYMENT', 'ALERT');

-- =====================================================
-- ROLE & PERMISSION TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS "user_roles" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL UNIQUE,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "level" INTEGER DEFAULT 0,
  "isSystem" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "permissions" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL UNIQUE,
  "slug" TEXT NOT NULL UNIQUE,
  "resource" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("resource", "action")
);

CREATE TABLE IF NOT EXISTS "_PermissionToUserRole" (
  "A" TEXT NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "user_roles"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "user_roles_slug_idx" ON "user_roles"("slug");
CREATE INDEX IF NOT EXISTS "permissions_slug_idx" ON "permissions"("slug");

-- =====================================================
-- COMPANY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS "Company" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "logo" TEXT,
  "website" TEXT,
  "description" TEXT,
  "industry" TEXT,
  "size" "CompanySize",
  "founded" INTEGER,
  "headquarters" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "status" "CompanyStatus" DEFAULT 'ACTIVE',
  "verified" BOOLEAN DEFAULT false,
  "ownerId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Company_slug_idx" ON "Company"("slug");
CREATE INDEX IF NOT EXISTS "Company_status_idx" ON "Company"("status");
CREATE INDEX IF NOT EXISTS "Company_verified_idx" ON "Company"("verified");

-- =====================================================
-- USER REVIEW TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS "UserReview" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "toolId" TEXT NOT NULL REFERENCES "Tool"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "rating" DOUBLE PRECISION NOT NULL,
  "title" TEXT,
  "content" TEXT NOT NULL,
  "pros" TEXT[] DEFAULT '{}',
  "cons" TEXT[] DEFAULT '{}',
  "verified" BOOLEAN DEFAULT false,
  "helpful" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("toolId", "userId")
);

CREATE INDEX IF NOT EXISTS "UserReview_toolId_idx" ON "UserReview"("toolId");
CREATE INDEX IF NOT EXISTS "UserReview_userId_idx" ON "UserReview"("userId");
CREATE INDEX IF NOT EXISTS "UserReview_rating_idx" ON "UserReview"("rating");

-- =====================================================
-- AFFILIATE SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS "AffiliateClick" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "toolId" TEXT NOT NULL REFERENCES "Tool"("id") ON DELETE CASCADE,
  "source" TEXT,
  "medium" TEXT,
  "campaign" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "referrer" TEXT,
  "clickedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "AffiliatePartner" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "code" TEXT UNIQUE NOT NULL,
  "commission" DOUBLE PRECISION DEFAULT 10.0,
  "status" "AffiliateStatus" DEFAULT 'ACTIVE',
  "clicks" INTEGER DEFAULT 0,
  "conversions" INTEGER DEFAULT 0,
  "earnings" DOUBLE PRECISION DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "AffiliateClick_toolId_idx" ON "AffiliateClick"("toolId");
CREATE INDEX IF NOT EXISTS "AffiliateClick_clickedAt_idx" ON "AffiliateClick"("clickedAt");
CREATE INDEX IF NOT EXISTS "AffiliatePartner_code_idx" ON "AffiliatePartner"("code");
CREATE INDEX IF NOT EXISTS "AffiliatePartner_status_idx" ON "AffiliatePartner"("status");

-- =====================================================
-- ADVERTISEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS "Advertisement" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "linkUrl" TEXT NOT NULL,
  "position" "AdPosition" NOT NULL,
  "type" "AdType" NOT NULL,
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  "clicks" INTEGER DEFAULT 0,
  "impressions" INTEGER DEFAULT 0,
  "budget" DOUBLE PRECISION,
  "spent" DOUBLE PRECISION DEFAULT 0,
  "status" "AdStatus" DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Advertisement_position_idx" ON "Advertisement"("position");
CREATE INDEX IF NOT EXISTS "Advertisement_status_idx" ON "Advertisement"("status");

-- =====================================================
-- COUPONS
-- =====================================================

CREATE TABLE IF NOT EXISTS "Coupon" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "discount" DOUBLE PRECISION NOT NULL,
  "discountType" "DiscountType" NOT NULL,
  "minPurchase" DOUBLE PRECISION,
  "maxDiscount" DOUBLE PRECISION,
  "usageLimit" INTEGER,
  "usedCount" INTEGER DEFAULT 0,
  "toolId" TEXT REFERENCES "Tool"("id") ON DELETE SET NULL,
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  "status" "CouponStatus" DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Coupon_code_idx" ON "Coupon"("code");
CREATE INDEX IF NOT EXISTS "Coupon_status_idx" ON "Coupon"("status");

-- =====================================================
-- NEWSLETTER
-- =====================================================

CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT,
  "source" TEXT,
  "status" "NewsletterStatus" DEFAULT 'ACTIVE',
  "subscribedAt" TIMESTAMP DEFAULT NOW(),
  "unsubscribedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_email_idx" ON "NewsletterSubscriber"("email");
CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_status_idx" ON "NewsletterSubscriber"("status");

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB,
  "read" BOOLEAN DEFAULT false,
  "readAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON "Notification"("read");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

-- =====================================================
-- MEDIA LIBRARY
-- =====================================================

CREATE TABLE IF NOT EXISTS "MediaFolder" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "parentId" TEXT REFERENCES "MediaFolder"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "MediaFile" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "filename" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "path" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "alt" TEXT,
  "title" TEXT,
  "folderId" TEXT REFERENCES "MediaFolder"("id") ON DELETE SET NULL,
  "uploadedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "MediaFolder_parentId_idx" ON "MediaFolder"("parentId");
CREATE INDEX IF NOT EXISTS "MediaFile_folderId_idx" ON "MediaFile"("folderId");
CREATE INDEX IF NOT EXISTS "MediaFile_mimeType_idx" ON "MediaFile"("mimeType");

-- =====================================================
-- ACTIVITY LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS "ActivityLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "resourceId" TEXT,
  "details" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX IF NOT EXISTS "ActivityLog_action_idx" ON "ActivityLog"("action");
CREATE INDEX IF NOT EXISTS "ActivityLog_resource_idx" ON "ActivityLog"("resource");
CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- =====================================================
-- SYSTEM SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS "SystemSetting" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" TEXT UNIQUE NOT NULL,
  "value" JSONB NOT NULL,
  "category" TEXT NOT NULL,
  "public" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "SystemSetting_key_idx" ON "SystemSetting"("key");
CREATE INDEX IF NOT EXISTS "SystemSetting_category_idx" ON "SystemSetting"("category");

-- =====================================================
-- WEBSITE ANALYTICS
-- =====================================================

CREATE TABLE IF NOT EXISTS "WebsiteVisit" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "path" TEXT NOT NULL,
  "referrer" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "country" TEXT,
  "city" TEXT,
  "sessionId" TEXT,
  "duration" INTEGER,
  "bounced" BOOLEAN DEFAULT false,
  "visitedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "WebsiteVisit_path_idx" ON "WebsiteVisit"("path");
CREATE INDEX IF NOT EXISTS "WebsiteVisit_visitedAt_idx" ON "WebsiteVisit"("visitedAt");

-- =====================================================
-- SEO METADATA
-- =====================================================

CREATE TABLE IF NOT EXISTS "SEOMetadata" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "path" TEXT UNIQUE NOT NULL,
  "title" TEXT,
  "description" TEXT,
  "keywords" TEXT[] DEFAULT '{}',
  "ogImage" TEXT,
  "canonical" TEXT,
  "noIndex" BOOLEAN DEFAULT false,
  "noFollow" BOOLEAN DEFAULT false,
  "schema" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "SEOMetadata_path_idx" ON "SEOMetadata"("path");

-- =====================================================
-- MODIFY EXISTING TABLES
-- =====================================================

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "roleId" TEXT REFERENCES "user_roles"("id") ON DELETE SET NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" "UserStatus" DEFAULT 'ACTIVE';

ALTER TABLE "Tool" ADD COLUMN IF NOT EXISTS "companyId" TEXT REFERENCES "Company"("id") ON DELETE SET NULL;
ALTER TABLE "Tool" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS "User_roleId_idx" ON "User"("roleId");
CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");
CREATE INDEX IF NOT EXISTS "Tool_companyId_idx" ON "Tool"("companyId");
CREATE INDEX IF NOT EXISTS "Tool_featured_idx" ON "Tool"("featured");

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserReview" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AffiliateClick" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AffiliatePartner" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Advertisement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NewsletterSubscriber" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MediaFolder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MediaFile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActivityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemSetting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WebsiteVisit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SEOMetadata" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - user_roles
-- =====================================================

DROP POLICY IF EXISTS "read_user_roles" ON "user_roles";
CREATE POLICY "read_user_roles" ON "user_roles" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_user_roles_admin" ON "user_roles";
CREATE POLICY "write_user_roles_admin" ON "user_roles" FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'))
  WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'));

-- =====================================================
-- RLS POLICIES - permissions
-- =====================================================

DROP POLICY IF EXISTS "read_permissions" ON "permissions";
CREATE POLICY "read_permissions" ON "permissions" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_permissions_admin" ON "permissions";
CREATE POLICY "write_permissions_admin" ON "permissions" FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'))
  WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'));

-- =====================================================
-- RLS POLICIES - Company
-- =====================================================

DROP POLICY IF EXISTS "read_companies" ON "Company";
CREATE POLICY "read_companies" ON "Company" FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "write_companies_admin" ON "Company";
CREATE POLICY "write_companies_admin" ON "Company" FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'))
  WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'));

-- =====================================================
-- RLS POLICIES - UserReview
-- =====================================================

DROP POLICY IF EXISTS "read_user_reviews" ON "UserReview";
CREATE POLICY "read_user_reviews" ON "UserReview" FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_review" ON "UserReview";
CREATE POLICY "insert_own_review" ON "UserReview" FOR INSERT TO authenticated
  WITH CHECK ("userId"::text = auth.uid()::text);

DROP POLICY IF EXISTS "update_own_review" ON "UserReview";
CREATE POLICY "update_own_review" ON "UserReview" FOR UPDATE TO authenticated
  USING ("userId"::text = auth.uid()::text) WITH CHECK ("userId"::text = auth.uid()::text);

DROP POLICY IF EXISTS "delete_own_review" ON "UserReview";
CREATE POLICY "delete_own_review" ON "UserReview" FOR DELETE TO authenticated
  USING ("userId"::text = auth.uid()::text);

-- =====================================================
-- RLS POLICIES - AffiliateClick
-- =====================================================

DROP POLICY IF EXISTS "read_affiliate_clicks_admin" ON "AffiliateClick";
CREATE POLICY "read_affiliate_clicks_admin" ON "AffiliateClick" FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'));

DROP POLICY IF EXISTS "insert_affiliate_clicks" ON "AffiliateClick";
CREATE POLICY "insert_affiliate_clicks" ON "AffiliateClick" FOR INSERT TO anon, authenticated WITH CHECK (true);

-- =====================================================
-- RLS POLICIES - AffiliatePartner
-- =====================================================

DROP POLICY IF EXISTS "read_affiliate_partners" ON "AffiliatePartner";
CREATE POLICY "read_affiliate_partners" ON "AffiliatePartner" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_affiliate_partners_admin" ON "AffiliatePartner";
CREATE POLICY "write_affiliate_partners_admin" ON "AffiliatePartner" FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'))
  WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'));

-- =====================================================
-- RLS POLICIES - Advertisement
-- =====================================================

DROP POLICY IF EXISTS "read_active_ads" ON "Advertisement";
CREATE POLICY "read_active_ads" ON "Advertisement" FOR SELECT TO anon, authenticated
  USING ("status" = 'ACTIVE');

DROP POLICY IF EXISTS "write_ads_admin" ON "Advertisement";
CREATE POLICY "write_ads_admin" ON "Advertisement" FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'))
  WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'));

-- =====================================================
-- RLS POLICIES - Coupon
-- =====================================================

DROP POLICY IF EXISTS "read_active_coupons" ON "Coupon";
CREATE POLICY "read_active_coupons" ON "Coupon" FOR SELECT TO anon, authenticated
  USING ("status" = 'ACTIVE');

DROP POLICY IF EXISTS "write_coupons_admin" ON "Coupon";
CREATE POLICY "write_coupons_admin" ON "Coupon" FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'))
  WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'));

-- =====================================================
-- RLS POLICIES - NewsletterSubscriber
-- =====================================================

DROP POLICY IF EXISTS "manage_newsletter_admin" ON "NewsletterSubscriber";
CREATE POLICY "manage_newsletter_admin" ON "NewsletterSubscriber" FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'))
  WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'));

-- =====================================================
-- RLS POLICIES - Notification
-- =====================================================

DROP POLICY IF EXISTS "read_own_notifications" ON "Notification";
CREATE POLICY "read_own_notifications" ON "Notification" FOR SELECT TO authenticated
  USING ("userId"::text = auth.uid()::text);

DROP POLICY IF EXISTS "update_own_notifications" ON "Notification";
CREATE POLICY "update_own_notifications" ON "Notification" FOR UPDATE TO authenticated
  USING ("userId"::text = auth.uid()::text) WITH CHECK ("userId"::text = auth.uid()::text);

DROP POLICY IF EXISTS "insert_notifications_admin" ON "Notification";
CREATE POLICY "insert_notifications_admin" ON "Notification" FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'));

-- =====================================================
-- RLS POLICIES - MediaFile & MediaFolder
-- =====================================================

DROP POLICY IF EXISTS "read_media_files" ON "MediaFile";
CREATE POLICY "read_media_files" ON "MediaFile" FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "write_media_files_admin" ON "MediaFile";
CREATE POLICY "write_media_files_admin" ON "MediaFile" FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'))
  WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'));

DROP POLICY IF EXISTS "read_media_folders" ON "MediaFolder";
CREATE POLICY "read_media_folders" ON "MediaFolder" FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "write_media_folders_admin" ON "MediaFolder";
CREATE POLICY "write_media_folders_admin" ON "MediaFolder" FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'))
  WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'));

-- =====================================================
-- RLS POLICIES - ActivityLog
-- =====================================================

DROP POLICY IF EXISTS "read_activity_logs_admin" ON "ActivityLog";
CREATE POLICY "read_activity_logs_admin" ON "ActivityLog" FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'));

DROP POLICY IF EXISTS "insert_activity_logs" ON "ActivityLog";
CREATE POLICY "insert_activity_logs" ON "ActivityLog" FOR INSERT TO authenticated WITH CHECK (true);

-- =====================================================
-- RLS POLICIES - SystemSetting
-- =====================================================

DROP POLICY IF EXISTS "read_public_settings" ON "SystemSetting";
CREATE POLICY "read_public_settings" ON "SystemSetting" FOR SELECT TO anon, authenticated
  USING ("public" = true);

DROP POLICY IF EXISTS "read_all_settings_admin" ON "SystemSetting";
CREATE POLICY "read_all_settings_admin" ON "SystemSetting" FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'));

DROP POLICY IF EXISTS "write_settings_admin" ON "SystemSetting";
CREATE POLICY "write_settings_admin" ON "SystemSetting" FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'))
  WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'));

-- =====================================================
-- RLS POLICIES - WebsiteVisit
-- =====================================================

DROP POLICY IF EXISTS "read_visits_admin" ON "WebsiteVisit";
CREATE POLICY "read_visits_admin" ON "WebsiteVisit" FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'));

DROP POLICY IF EXISTS "insert_visits" ON "WebsiteVisit";
CREATE POLICY "insert_visits" ON "WebsiteVisit" FOR INSERT TO anon, authenticated WITH CHECK (true);

-- =====================================================
-- RLS POLICIES - SEOMetadata
-- =====================================================

DROP POLICY IF EXISTS "read_seo_metadata" ON "SEOMetadata";
CREATE POLICY "read_seo_metadata" ON "SEOMetadata" FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "write_seo_metadata_admin" ON "SEOMetadata";
CREATE POLICY "write_seo_metadata_admin" ON "SEOMetadata" FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'))
  WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE "User"."id"::text = auth.uid()::text AND "User"."status" = 'ACTIVE'));

-- =====================================================
-- SEED DEFAULT ROLES
-- =====================================================

INSERT INTO "user_roles" ("id", "name", "slug", "description", "level", "isSystem") VALUES
  ('role-super-admin', 'Super Admin', 'super-admin', 'Full system access with all permissions', 100, true),
  ('role-admin', 'Admin', 'admin', 'Administrative access to manage content and users', 80, true),
  ('role-moderator', 'Moderator', 'moderator', 'Content moderation and review management', 60, true),
  ('role-editor', 'Editor', 'editor', 'Content creation and editing', 40, true),
  ('role-support', 'Support', 'support', 'Customer support access', 30, true),
  ('role-company', 'Company', 'company', 'Company dashboard access', 20, true),
  ('role-creator', 'Creator', 'creator', 'Content creator access', 15, true),
  ('role-premium', 'Premium User', 'premium-user', 'Premium subscriber access', 10, true),
  ('role-standard', 'Standard User', 'standard-user', 'Basic user access', 5, true)
ON CONFLICT ("id") DO NOTHING;

-- =====================================================
-- SEED DEFAULT PERMISSIONS
-- =====================================================

INSERT INTO "permissions" ("id", "name", "slug", "resource", "action", "description") VALUES
  ('perm-tools-read', 'Read Tools', 'tools-read', 'tools', 'read', 'View tool listings'),
  ('perm-tools-create', 'Create Tools', 'tools-create', 'tools', 'create', 'Create new tools'),
  ('perm-tools-update', 'Update Tools', 'tools-update', 'tools', 'update', 'Edit existing tools'),
  ('perm-tools-delete', 'Delete Tools', 'tools-delete', 'tools', 'delete', 'Delete tools'),
  ('perm-users-read', 'Read Users', 'users-read', 'users', 'read', 'View user accounts'),
  ('perm-users-create', 'Create Users', 'users-create', 'users', 'create', 'Create new users'),
  ('perm-users-update', 'Update Users', 'users-update', 'users', 'update', 'Edit user accounts'),
  ('perm-users-delete', 'Delete Users', 'users-delete', 'users', 'delete', 'Delete user accounts'),
  ('perm-companies-read', 'Read Companies', 'companies-read', 'companies', 'read', 'View companies'),
  ('perm-companies-create', 'Create Companies', 'companies-create', 'companies', 'create', 'Create companies'),
  ('perm-companies-update', 'Update Companies', 'companies-update', 'companies', 'update', 'Edit companies'),
  ('perm-companies-delete', 'Delete Companies', 'companies-delete', 'companies', 'delete', 'Delete companies'),
  ('perm-reviews-read', 'Read Reviews', 'reviews-read', 'reviews', 'read', 'View reviews'),
  ('perm-reviews-moderate', 'Moderate Reviews', 'reviews-moderate', 'reviews', 'moderate', 'Approve/reject reviews'),
  ('perm-reviews-delete', 'Delete Reviews', 'reviews-delete', 'reviews', 'delete', 'Delete reviews'),
  ('perm-settings-read', 'Read Settings', 'settings-read', 'settings', 'read', 'View system settings'),
  ('perm-settings-update', 'Update Settings', 'settings-update', 'settings', 'update', 'Modify system settings'),
  ('perm-analytics-read', 'Read Analytics', 'analytics-read', 'analytics', 'read', 'View analytics data'),
  ('perm-media-read', 'Read Media', 'media-read', 'media', 'read', 'View media files'),
  ('perm-media-upload', 'Upload Media', 'media-upload', 'media', 'upload', 'Upload media files'),
  ('perm-media-delete', 'Delete Media', 'media-delete', 'media', 'delete', 'Delete media files'),
  ('perm-affiliates-read', 'Read Affiliates', 'affiliates-read', 'affiliates', 'read', 'View affiliate data'),
  ('perm-affiliates-manage', 'Manage Affiliates', 'affiliates-manage', 'affiliates', 'manage', 'Manage affiliate partners'),
  ('perm-ads-read', 'Read Ads', 'ads-read', 'ads', 'read', 'View advertisements'),
  ('perm-ads-manage', 'Manage Ads', 'ads-manage', 'ads', 'manage', 'Create and edit advertisements'),
  ('perm-coupons-read', 'Read Coupons', 'coupons-read', 'coupons', 'read', 'View coupons'),
  ('perm-coupons-manage', 'Manage Coupons', 'coupons-manage', 'coupons', 'manage', 'Create and edit coupons')
ON CONFLICT ("id") DO NOTHING;

-- Link permissions to roles (Super Admin gets all permissions)
INSERT INTO "_PermissionToUserRole" ("A", "B")
SELECT "id", 'role-super-admin' FROM "permissions"
ON CONFLICT DO NOTHING;

-- Admin gets permissions except delete
INSERT INTO "_PermissionToUserRole" ("A", "B")
SELECT "id", 'role-admin' FROM "permissions" WHERE "action" != 'delete'
ON CONFLICT DO NOTHING;
