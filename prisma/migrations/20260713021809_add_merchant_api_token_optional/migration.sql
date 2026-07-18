-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AffiliatePartner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "apiToken" TEXT,
    "commission" REAL NOT NULL DEFAULT 10.0,
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
