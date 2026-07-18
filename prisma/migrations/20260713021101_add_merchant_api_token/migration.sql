/*
  Warnings:

  - Added the required column `apiToken` to the `AffiliatePartner` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Advertisement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "linkUrl" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "budget" REAL,
    "spent" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Advertisement" ("budget", "clicks", "createdAt", "description", "endDate", "id", "imageUrl", "impressions", "linkUrl", "position", "spent", "startDate", "status", "title", "type", "updatedAt") SELECT "budget", "clicks", "createdAt", "description", "endDate", "id", "imageUrl", "impressions", "linkUrl", "position", "spent", "startDate", "status", "title", "type", "updatedAt" FROM "Advertisement";
DROP TABLE "Advertisement";
ALTER TABLE "new_Advertisement" RENAME TO "Advertisement";
CREATE INDEX "Advertisement_position_idx" ON "Advertisement"("position");
CREATE INDEX "Advertisement_status_idx" ON "Advertisement"("status");
CREATE TABLE "new_AffiliateClick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toolId" TEXT NOT NULL,
    "partnerId" TEXT,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "clickedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AffiliateClick_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AffiliateClick_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "AffiliatePartner" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AffiliateClick" ("campaign", "clickedAt", "id", "ipAddress", "medium", "referrer", "source", "toolId", "userAgent") SELECT "campaign", "clickedAt", "id", "ipAddress", "medium", "referrer", "source", "toolId", "userAgent" FROM "AffiliateClick";
DROP TABLE "AffiliateClick";
ALTER TABLE "new_AffiliateClick" RENAME TO "AffiliateClick";
CREATE INDEX "AffiliateClick_toolId_idx" ON "AffiliateClick"("toolId");
CREATE INDEX "AffiliateClick_partnerId_idx" ON "AffiliateClick"("partnerId");
CREATE INDEX "AffiliateClick_clickedAt_idx" ON "AffiliateClick"("clickedAt");
CREATE TABLE "new_AffiliatePartner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "commission" REAL NOT NULL DEFAULT 10.0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "earnings" REAL NOT NULL DEFAULT 0,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_AffiliatePartner" ("clicks", "code", "commission", "conversions", "createdAt", "earnings", "email", "id", "name", "status", "updatedAt") SELECT "clicks", "code", "commission", "conversions", "createdAt", "earnings", "email", "id", "name", "status", "updatedAt" FROM "AffiliatePartner";
DROP TABLE "AffiliatePartner";
ALTER TABLE "new_AffiliatePartner" RENAME TO "AffiliatePartner";
CREATE UNIQUE INDEX "AffiliatePartner_email_key" ON "AffiliatePartner"("email");
CREATE UNIQUE INDEX "AffiliatePartner_code_key" ON "AffiliatePartner"("code");
CREATE UNIQUE INDEX "AffiliatePartner_apiToken_key" ON "AffiliatePartner"("apiToken");
CREATE INDEX "AffiliatePartner_code_idx" ON "AffiliatePartner"("code");
CREATE INDEX "AffiliatePartner_apiToken_idx" ON "AffiliatePartner"("apiToken");
CREATE INDEX "AffiliatePartner_status_idx" ON "AffiliatePartner"("status");
CREATE TABLE "new_BlogCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_BlogCategory" ("createdAt", "description", "icon", "id", "name", "order", "slug", "updatedAt") SELECT "createdAt", "description", "icon", "id", "name", "order", "slug", "updatedAt" FROM "BlogCategory";
DROP TABLE "BlogCategory";
ALTER TABLE "new_BlogCategory" RENAME TO "BlogCategory";
CREATE UNIQUE INDEX "BlogCategory_name_key" ON "BlogCategory"("name");
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "BlogCategory"("slug");
CREATE INDEX "BlogCategory_slug_idx" ON "BlogCategory"("slug");
CREATE TABLE "new_BlogComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "userId" TEXT,
    "authorName" TEXT,
    "authorEmail" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlogComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BlogComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BlogComment" ("authorEmail", "authorName", "content", "createdAt", "id", "postId", "status", "updatedAt", "userId") SELECT "authorEmail", "authorName", "content", "createdAt", "id", "postId", "status", "updatedAt", "userId" FROM "BlogComment";
DROP TABLE "BlogComment";
ALTER TABLE "new_BlogComment" RENAME TO "BlogComment";
CREATE INDEX "BlogComment_postId_idx" ON "BlogComment"("postId");
CREATE INDEX "BlogComment_userId_idx" ON "BlogComment"("userId");
CREATE INDEX "BlogComment_status_idx" ON "BlogComment"("status");
CREATE INDEX "BlogComment_postId_status_idx" ON "BlogComment"("postId", "status");
CREATE TABLE "new_BlogPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "coverImage" TEXT,
    "thumbnailImage" TEXT,
    "imageAlt" TEXT,
    "categoryId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "authorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoCanonicalUrl" TEXT,
    "seoOgImage" TEXT,
    "seoNoIndex" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BlogPost" ("authorId", "categoryId", "content", "coverImage", "createdAt", "description", "excerpt", "featured", "id", "imageAlt", "published", "publishedAt", "seoCanonicalUrl", "seoDescription", "seoNoIndex", "seoOgImage", "seoTitle", "slug", "status", "tags", "thumbnailImage", "title", "updatedAt") SELECT "authorId", "categoryId", "content", "coverImage", "createdAt", "description", "excerpt", "featured", "id", "imageAlt", "published", "publishedAt", "seoCanonicalUrl", "seoDescription", "seoNoIndex", "seoOgImage", "seoTitle", "slug", "status", "tags", "thumbnailImage", "title", "updatedAt" FROM "BlogPost";
DROP TABLE "BlogPost";
ALTER TABLE "new_BlogPost" RENAME TO "BlogPost";
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX "BlogPost_published_idx" ON "BlogPost"("published");
CREATE INDEX "BlogPost_featured_idx" ON "BlogPost"("featured");
CREATE INDEX "BlogPost_categoryId_idx" ON "BlogPost"("categoryId");
CREATE INDEX "BlogPost_status_idx" ON "BlogPost"("status");
CREATE INDEX "BlogPost_published_publishedAt_idx" ON "BlogPost"("published", "publishedAt");
CREATE TABLE "new_BlogPostTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "titleTemplate" TEXT,
    "contentTemplate" TEXT NOT NULL,
    "categoryId" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlogPostTemplate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BlogPostTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BlogPostTemplate" ("categoryId", "contentTemplate", "createdAt", "createdById", "description", "id", "name", "titleTemplate", "updatedAt") SELECT "categoryId", "contentTemplate", "createdAt", "createdById", "description", "id", "name", "titleTemplate", "updatedAt" FROM "BlogPostTemplate";
DROP TABLE "BlogPostTemplate";
ALTER TABLE "new_BlogPostTemplate" RENAME TO "BlogPostTemplate";
CREATE INDEX "BlogPostTemplate_categoryId_idx" ON "BlogPostTemplate"("categoryId");
CREATE TABLE "new_BlogTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_BlogTag" ("createdAt", "id", "name", "slug", "updatedAt") SELECT "createdAt", "id", "name", "slug", "updatedAt" FROM "BlogTag";
DROP TABLE "BlogTag";
ALTER TABLE "new_BlogTag" RENAME TO "BlogTag";
CREATE UNIQUE INDEX "BlogTag_name_key" ON "BlogTag"("name");
CREATE UNIQUE INDEX "BlogTag_slug_key" ON "BlogTag"("slug");
CREATE INDEX "BlogTag_slug_idx" ON "BlogTag"("slug");
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Category" ("createdAt", "description", "icon", "id", "name", "order", "slug", "updatedAt") SELECT "createdAt", "description", "icon", "id", "name", "order", "slug", "updatedAt" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_slug_idx" ON "Category"("slug");
CREATE TABLE "new_Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "website" TEXT,
    "description" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "founded" INTEGER,
    "headquarters" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Company_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Company" ("createdAt", "description", "email", "founded", "headquarters", "id", "industry", "logo", "name", "ownerId", "phone", "size", "slug", "status", "updatedAt", "verified", "website") SELECT "createdAt", "description", "email", "founded", "headquarters", "id", "industry", "logo", "name", "ownerId", "phone", "size", "slug", "status", "updatedAt", "verified", "website" FROM "Company";
DROP TABLE "Company";
ALTER TABLE "new_Company" RENAME TO "Company";
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");
CREATE INDEX "Company_slug_idx" ON "Company"("slug");
CREATE INDEX "Company_status_idx" ON "Company"("status");
CREATE INDEX "Company_verified_idx" ON "Company"("verified");
CREATE TABLE "new_Faq" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toolId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Faq_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Faq" ("answer", "createdAt", "id", "order", "question", "toolId", "updatedAt") SELECT "answer", "createdAt", "id", "order", "question", "toolId", "updatedAt" FROM "Faq";
DROP TABLE "Faq";
ALTER TABLE "new_Faq" RENAME TO "Faq";
CREATE INDEX "Faq_toolId_idx" ON "Faq"("toolId");
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lineItems" TEXT,
    "dueDate" DATETIME,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("amount", "createdAt", "currency", "dueDate", "id", "invoiceNumber", "lineItems", "paidAt", "status", "subscriptionId", "updatedAt", "userId") SELECT "amount", "createdAt", "currency", "dueDate", "id", "invoiceNumber", "lineItems", "paidAt", "status", "subscriptionId", "updatedAt", "userId" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE INDEX "Invoice_userId_idx" ON "Invoice"("userId");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");
CREATE TABLE "new_MediaFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "title" TEXT,
    "folderId" TEXT,
    "uploadedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaFile_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "MediaFolder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MediaFile" ("alt", "createdAt", "filename", "folderId", "id", "mimeType", "originalName", "path", "size", "title", "updatedAt", "uploadedBy", "url") SELECT "alt", "createdAt", "filename", "folderId", "id", "mimeType", "originalName", "path", "size", "title", "updatedAt", "uploadedBy", "url" FROM "MediaFile";
DROP TABLE "MediaFile";
ALTER TABLE "new_MediaFile" RENAME TO "MediaFile";
CREATE INDEX "MediaFile_folderId_idx" ON "MediaFile"("folderId");
CREATE INDEX "MediaFile_mimeType_idx" ON "MediaFile"("mimeType");
CREATE TABLE "new_PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_PasswordResetToken" ("createdAt", "expiresAt", "id", "token", "updatedAt", "used", "userId") SELECT "createdAt", "expiresAt", "id", "token", "updatedAt", "used", "userId" FROM "PasswordResetToken";
DROP TABLE "PasswordResetToken";
ALTER TABLE "new_PasswordResetToken" RENAME TO "PasswordResetToken";
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE TABLE "new_Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Permission" ("action", "createdAt", "description", "id", "name", "resource", "slug", "updatedAt") SELECT "action", "createdAt", "description", "id", "name", "resource", "slug", "updatedAt" FROM "Permission";
DROP TABLE "Permission";
ALTER TABLE "new_Permission" RENAME TO "Permission";
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");
CREATE UNIQUE INDEX "Permission_slug_key" ON "Permission"("slug");
CREATE INDEX "Permission_slug_idx" ON "Permission"("slug");
CREATE UNIQUE INDEX "Permission_resource_action_key" ON "Permission"("resource", "action");
CREATE TABLE "new_RevenueTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "toolId" TEXT,
    "companyId" TEXT,
    "affiliatePartnerId" TEXT,
    "advertisementId" TEXT,
    "description" TEXT,
    "metadata" TEXT,
    "transactionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RevenueTransaction_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RevenueTransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RevenueTransaction_affiliatePartnerId_fkey" FOREIGN KEY ("affiliatePartnerId") REFERENCES "AffiliatePartner" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_RevenueTransaction" ("advertisementId", "affiliatePartnerId", "amount", "companyId", "confirmedAt", "createdAt", "currency", "description", "id", "metadata", "status", "toolId", "transactionDate", "type", "updatedAt") SELECT "advertisementId", "affiliatePartnerId", "amount", "companyId", "confirmedAt", "createdAt", "currency", "description", "id", "metadata", "status", "toolId", "transactionDate", "type", "updatedAt" FROM "RevenueTransaction";
DROP TABLE "RevenueTransaction";
ALTER TABLE "new_RevenueTransaction" RENAME TO "RevenueTransaction";
CREATE INDEX "RevenueTransaction_type_idx" ON "RevenueTransaction"("type");
CREATE INDEX "RevenueTransaction_status_idx" ON "RevenueTransaction"("status");
CREATE INDEX "RevenueTransaction_transactionDate_idx" ON "RevenueTransaction"("transactionDate");
CREATE INDEX "RevenueTransaction_affiliatePartnerId_idx" ON "RevenueTransaction"("affiliatePartnerId");
CREATE TABLE "new_Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toolId" TEXT NOT NULL,
    "rating" REAL NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "authorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("authorId", "content", "createdAt", "id", "rating", "summary", "toolId", "updatedAt") SELECT "authorId", "content", "createdAt", "id", "rating", "summary", "toolId", "updatedAt" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
CREATE UNIQUE INDEX "Review_toolId_key" ON "Review"("toolId");
CREATE INDEX "Review_rating_idx" ON "Review"("rating");
CREATE TABLE "new_SubscriptionCoupon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "discountType" TEXT NOT NULL,
    "discountValue" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "maxRedemptions" INTEGER,
    "currentRedemptions" INTEGER NOT NULL DEFAULT 0,
    "applicablePlans" TEXT NOT NULL DEFAULT '[]',
    "validFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_SubscriptionCoupon" ("applicablePlans", "code", "createdAt", "currency", "currentRedemptions", "description", "discountType", "discountValue", "id", "isActive", "maxRedemptions", "name", "updatedAt", "validFrom", "validUntil") SELECT "applicablePlans", "code", "createdAt", "currency", "currentRedemptions", "description", "discountType", "discountValue", "id", "isActive", "maxRedemptions", "name", "updatedAt", "validFrom", "validUntil" FROM "SubscriptionCoupon";
DROP TABLE "SubscriptionCoupon";
ALTER TABLE "new_SubscriptionCoupon" RENAME TO "SubscriptionCoupon";
CREATE UNIQUE INDEX "SubscriptionCoupon_code_key" ON "SubscriptionCoupon"("code");
CREATE INDEX "SubscriptionCoupon_code_idx" ON "SubscriptionCoupon"("code");
CREATE INDEX "SubscriptionCoupon_isActive_idx" ON "SubscriptionCoupon"("isActive");
CREATE TABLE "new_SubscriptionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" INTEGER NOT NULL,
    "yearlyPrice" INTEGER NOT NULL,
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "features" TEXT NOT NULL DEFAULT '[]',
    "limits" TEXT NOT NULL DEFAULT '{}',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_SubscriptionPlan" ("createdAt", "description", "features", "id", "isActive", "limits", "monthlyPrice", "name", "slug", "sortOrder", "trialDays", "updatedAt", "yearlyPrice") SELECT "createdAt", "description", "features", "id", "isActive", "limits", "monthlyPrice", "name", "slug", "sortOrder", "trialDays", "updatedAt", "yearlyPrice" FROM "SubscriptionPlan";
DROP TABLE "SubscriptionPlan";
ALTER TABLE "new_SubscriptionPlan" RENAME TO "SubscriptionPlan";
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");
CREATE INDEX "SubscriptionPlan_slug_idx" ON "SubscriptionPlan"("slug");
CREATE INDEX "SubscriptionPlan_isActive_idx" ON "SubscriptionPlan"("isActive");
CREATE INDEX "SubscriptionPlan_sortOrder_idx" ON "SubscriptionPlan"("sortOrder");
CREATE TABLE "new_Tool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "companyId" TEXT,
    "pricing" TEXT NOT NULL DEFAULT 'unknown',
    "hasFreeTier" BOOLEAN NOT NULL DEFAULT false,
    "hasApi" BOOLEAN NOT NULL DEFAULT false,
    "platforms" TEXT NOT NULL DEFAULT '[]',
    "features" TEXT NOT NULL DEFAULT '[]',
    "pros" TEXT NOT NULL DEFAULT '[]',
    "cons" TEXT NOT NULL DEFAULT '[]',
    "useCases" TEXT NOT NULL DEFAULT '[]',
    "integrations" TEXT NOT NULL DEFAULT '[]',
    "websiteUrl" TEXT,
    "rating" REAL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tool_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tool_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tool_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tool" ("authorId", "categoryId", "companyId", "cons", "content", "createdAt", "description", "featured", "features", "hasApi", "hasFreeTier", "id", "integrations", "name", "platforms", "pricing", "pros", "published", "rating", "slug", "title", "updatedAt", "useCases", "websiteUrl") SELECT "authorId", "categoryId", "companyId", "cons", "content", "createdAt", "description", "featured", "features", "hasApi", "hasFreeTier", "id", "integrations", "name", "platforms", "pricing", "pros", "published", "rating", "slug", "title", "updatedAt", "useCases", "websiteUrl" FROM "Tool";
DROP TABLE "Tool";
ALTER TABLE "new_Tool" RENAME TO "Tool";
CREATE UNIQUE INDEX "Tool_slug_key" ON "Tool"("slug");
CREATE INDEX "Tool_categoryId_idx" ON "Tool"("categoryId");
CREATE INDEX "Tool_published_idx" ON "Tool"("published");
CREATE INDEX "Tool_featured_idx" ON "Tool"("featured");
CREATE INDEX "Tool_companyId_idx" ON "Tool"("companyId");
CREATE TABLE "new_UsageTracking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageTracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UsageTracking" ("count", "createdAt", "id", "metric", "periodEnd", "periodStart", "updatedAt", "userId") SELECT "count", "createdAt", "id", "metric", "periodEnd", "periodStart", "updatedAt", "userId" FROM "UsageTracking";
DROP TABLE "UsageTracking";
ALTER TABLE "new_UsageTracking" RENAME TO "UsageTracking";
CREATE INDEX "UsageTracking_userId_idx" ON "UsageTracking"("userId");
CREATE INDEX "UsageTracking_metric_idx" ON "UsageTracking"("metric");
CREATE UNIQUE INDEX "UsageTracking_userId_metric_periodStart_key" ON "UsageTracking"("userId", "metric", "periodStart");
CREATE TABLE "new_UserRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_UserRole" ("createdAt", "description", "id", "isSystem", "level", "name", "slug", "updatedAt") SELECT "createdAt", "description", "id", "isSystem", "level", "name", "slug", "updatedAt" FROM "UserRole";
DROP TABLE "UserRole";
ALTER TABLE "new_UserRole" RENAME TO "UserRole";
CREATE UNIQUE INDEX "UserRole_name_key" ON "UserRole"("name");
CREATE UNIQUE INDEX "UserRole_slug_key" ON "UserRole"("slug");
CREATE INDEX "UserRole_slug_idx" ON "UserRole"("slug");
CREATE TABLE "new_UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "publicProfile" BOOLEAN NOT NULL DEFAULT false,
    "weeklyToolDigest" BOOLEAN NOT NULL DEFAULT true,
    "lastDigestSentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserSettings" ("createdAt", "emailNotifications", "id", "language", "lastDigestSentAt", "marketingEmails", "publicProfile", "timezone", "updatedAt", "userId", "weeklyToolDigest") SELECT "createdAt", "emailNotifications", "id", "language", "lastDigestSentAt", "marketingEmails", "publicProfile", "timezone", "updatedAt", "userId", "weeklyToolDigest" FROM "UserSettings";
DROP TABLE "UserSettings";
ALTER TABLE "new_UserSettings" RENAME TO "UserSettings";
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
CREATE INDEX "UserSettings_userId_idx" ON "UserSettings"("userId");
CREATE TABLE "new_UserSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "billingCycle" TEXT NOT NULL,
    "currentPeriodStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" DATETIME NOT NULL,
    "trialStart" DATETIME,
    "trialEnd" DATETIME,
    "canceledAt" DATETIME,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "paymentProvider" TEXT,
    "couponId" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserSubscription" ("billingCycle", "cancelAtPeriodEnd", "canceledAt", "couponId", "createdAt", "currentPeriodEnd", "currentPeriodStart", "id", "paymentProvider", "planId", "status", "stripeCustomerId", "stripePriceId", "stripeSubscriptionId", "trialEnd", "trialStart", "updatedAt", "userId") SELECT "billingCycle", "cancelAtPeriodEnd", "canceledAt", "couponId", "createdAt", "currentPeriodEnd", "currentPeriodStart", "id", "paymentProvider", "planId", "status", "stripeCustomerId", "stripePriceId", "stripeSubscriptionId", "trialEnd", "trialStart", "updatedAt", "userId" FROM "UserSubscription";
DROP TABLE "UserSubscription";
ALTER TABLE "new_UserSubscription" RENAME TO "UserSubscription";
CREATE INDEX "UserSubscription_userId_idx" ON "UserSubscription"("userId");
CREATE INDEX "UserSubscription_planId_idx" ON "UserSubscription"("planId");
CREATE INDEX "UserSubscription_status_idx" ON "UserSubscription"("status");
CREATE INDEX "UserSubscription_stripeSubscriptionId_idx" ON "UserSubscription"("stripeSubscriptionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
