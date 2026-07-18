/*
  Warnings:

  - You are about to alter the column `budget` on the `Advertisement` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `spent` on the `Advertisement` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `maxDiscount` on the `Coupon` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `minPurchase` on the `Coupon` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `amount` on the `RevenueTransaction` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.

*/
-- AlterTable
ALTER TABLE "SubscriptionCoupon" ADD COLUMN "minAmount" INTEGER;

-- CreateTable
CREATE TABLE "BillingTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "metadata" TEXT,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AffiliateLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "term" TEXT,
    "content" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "earnings" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AffiliateLink_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "AffiliatePartner" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AffiliateLink_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeaturedListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toolId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'featured',
    "label" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeaturedListing_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdImpression" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advertisementId" TEXT NOT NULL,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "device" TEXT,
    "cost" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdImpression_advertisementId_fkey" FOREIGN KEY ("advertisementId") REFERENCES "Advertisement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdClick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advertisementId" TEXT NOT NULL,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "device" TEXT,
    "cost" INTEGER,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "conversionValue" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdClick_advertisementId_fkey" FOREIGN KEY ("advertisementId") REFERENCES "Advertisement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budget" INTEGER NOT NULL,
    "spent" INTEGER NOT NULL DEFAULT 0,
    "dailyBudget" INTEGER,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "targetClicks" INTEGER,
    "targetImpressions" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdCampaign_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "input" TEXT,
    "output" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "nextRunAt" DATETIME,
    "lastRunAt" DATETIME,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AgentProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AgentState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lockedBy" TEXT,
    "lockedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
    "budget" INTEGER,
    "spent" INTEGER NOT NULL DEFAULT 0,
    "dailyBudget" INTEGER,
    "targetUrl" TEXT,
    "targetAudience" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Advertisement" ("budget", "clicks", "createdAt", "description", "endDate", "id", "imageUrl", "impressions", "linkUrl", "position", "spent", "startDate", "status", "title", "type", "updatedAt") SELECT "budget", "clicks", "createdAt", "description", "endDate", "id", "imageUrl", "impressions", "linkUrl", "position", "spent", "startDate", "status", "title", "type", "updatedAt" FROM "Advertisement";
DROP TABLE "Advertisement";
ALTER TABLE "new_Advertisement" RENAME TO "Advertisement";
CREATE INDEX "Advertisement_position_idx" ON "Advertisement"("position");
CREATE INDEX "Advertisement_status_idx" ON "Advertisement"("status");
CREATE INDEX "Advertisement_startDate_endDate_idx" ON "Advertisement"("startDate", "endDate");
CREATE TABLE "new_AffiliateClick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toolId" TEXT NOT NULL,
    "partnerId" TEXT,
    "linkId" TEXT,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "term" TEXT,
    "content" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "device" TEXT,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "conversionValue" INTEGER,
    "clickedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AffiliateClick_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AffiliateClick_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "AffiliatePartner" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AffiliateClick" ("campaign", "clickedAt", "id", "ipAddress", "medium", "partnerId", "referrer", "source", "toolId", "userAgent") SELECT "campaign", "clickedAt", "id", "ipAddress", "medium", "partnerId", "referrer", "source", "toolId", "userAgent" FROM "AffiliateClick";
DROP TABLE "AffiliateClick";
ALTER TABLE "new_AffiliateClick" RENAME TO "AffiliateClick";
CREATE INDEX "AffiliateClick_toolId_idx" ON "AffiliateClick"("toolId");
CREATE INDEX "AffiliateClick_partnerId_idx" ON "AffiliateClick"("partnerId");
CREATE INDEX "AffiliateClick_linkId_idx" ON "AffiliateClick"("linkId");
CREATE INDEX "AffiliateClick_clickedAt_idx" ON "AffiliateClick"("clickedAt");
CREATE INDEX "AffiliateClick_converted_idx" ON "AffiliateClick"("converted");
CREATE TABLE "new_AffiliatePartner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "apiToken" TEXT,
    "commission" REAL NOT NULL DEFAULT 10.0,
    "commissionType" TEXT NOT NULL DEFAULT 'percentage',
    "fixedCommission" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "earnings" REAL NOT NULL DEFAULT 0,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_AffiliatePartner" ("apiToken", "clicks", "code", "commission", "conversions", "createdAt", "earnings", "email", "id", "lastLoginAt", "name", "status", "updatedAt") SELECT "apiToken", "clicks", "code", "commission", "conversions", "createdAt", "earnings", "email", "id", "lastLoginAt", "name", "status", "updatedAt" FROM "AffiliatePartner";
DROP TABLE "AffiliatePartner";
ALTER TABLE "new_AffiliatePartner" RENAME TO "AffiliatePartner";
CREATE UNIQUE INDEX "AffiliatePartner_email_key" ON "AffiliatePartner"("email");
CREATE UNIQUE INDEX "AffiliatePartner_code_key" ON "AffiliatePartner"("code");
CREATE UNIQUE INDEX "AffiliatePartner_apiToken_key" ON "AffiliatePartner"("apiToken");
CREATE INDEX "AffiliatePartner_code_idx" ON "AffiliatePartner"("code");
CREATE INDEX "AffiliatePartner_apiToken_idx" ON "AffiliatePartner"("apiToken");
CREATE INDEX "AffiliatePartner_status_idx" ON "AffiliatePartner"("status");
CREATE TABLE "new_Coupon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount" REAL NOT NULL,
    "discountType" TEXT NOT NULL,
    "minPurchase" INTEGER,
    "maxDiscount" INTEGER,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "toolId" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Coupon" ("code", "createdAt", "description", "discount", "discountType", "endDate", "id", "maxDiscount", "minPurchase", "startDate", "status", "toolId", "updatedAt", "usageLimit", "usedCount") SELECT "code", "createdAt", "description", "discount", "discountType", "endDate", "id", "maxDiscount", "minPurchase", "startDate", "status", "toolId", "updatedAt", "usageLimit", "usedCount" FROM "Coupon";
DROP TABLE "Coupon";
ALTER TABLE "new_Coupon" RENAME TO "Coupon";
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");
CREATE INDEX "Coupon_status_idx" ON "Coupon"("status");
CREATE TABLE "new_RevenueTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fee" INTEGER,
    "netAmount" INTEGER,
    "toolId" TEXT,
    "companyId" TEXT,
    "affiliatePartnerId" TEXT,
    "advertisementId" TEXT,
    "subscriptionId" TEXT,
    "invoiceId" TEXT,
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
CREATE INDEX "RevenueTransaction_toolId_idx" ON "RevenueTransaction"("toolId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "BillingTransaction_userId_idx" ON "BillingTransaction"("userId");

-- CreateIndex
CREATE INDEX "BillingTransaction_type_idx" ON "BillingTransaction"("type");

-- CreateIndex
CREATE INDEX "BillingTransaction_status_idx" ON "BillingTransaction"("status");

-- CreateIndex
CREATE INDEX "BillingTransaction_createdAt_idx" ON "BillingTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateLink_slug_key" ON "AffiliateLink"("slug");

-- CreateIndex
CREATE INDEX "AffiliateLink_partnerId_idx" ON "AffiliateLink"("partnerId");

-- CreateIndex
CREATE INDEX "AffiliateLink_toolId_idx" ON "AffiliateLink"("toolId");

-- CreateIndex
CREATE INDEX "AffiliateLink_slug_idx" ON "AffiliateLink"("slug");

-- CreateIndex
CREATE INDEX "AffiliateLink_isActive_idx" ON "AffiliateLink"("isActive");

-- CreateIndex
CREATE INDEX "FeaturedListing_toolId_idx" ON "FeaturedListing"("toolId");

-- CreateIndex
CREATE INDEX "FeaturedListing_type_idx" ON "FeaturedListing"("type");

-- CreateIndex
CREATE INDEX "FeaturedListing_status_idx" ON "FeaturedListing"("status");

-- CreateIndex
CREATE INDEX "FeaturedListing_startDate_endDate_idx" ON "FeaturedListing"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "FeaturedListing_sortOrder_idx" ON "FeaturedListing"("sortOrder");

-- CreateIndex
CREATE INDEX "AdImpression_advertisementId_idx" ON "AdImpression"("advertisementId");

-- CreateIndex
CREATE INDEX "AdImpression_createdAt_idx" ON "AdImpression"("createdAt");

-- CreateIndex
CREATE INDEX "AdClick_advertisementId_idx" ON "AdClick"("advertisementId");

-- CreateIndex
CREATE INDEX "AdClick_createdAt_idx" ON "AdClick"("createdAt");

-- CreateIndex
CREATE INDEX "AdCampaign_toolId_idx" ON "AdCampaign"("toolId");

-- CreateIndex
CREATE INDEX "AdCampaign_status_idx" ON "AdCampaign"("status");

-- CreateIndex
CREATE INDEX "AgentTask_agentId_status_idx" ON "AgentTask"("agentId", "status");

-- CreateIndex
CREATE INDEX "AgentTask_nextRunAt_idx" ON "AgentTask"("nextRunAt");

-- CreateIndex
CREATE INDEX "AgentTask_name_idx" ON "AgentTask"("name");

-- CreateIndex
CREATE INDEX "AgentProposal_status_priority_idx" ON "AgentProposal"("status", "priority");

-- CreateIndex
CREATE INDEX "AgentProposal_agentId_idx" ON "AgentProposal"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentState_key_key" ON "AgentState"("key");
