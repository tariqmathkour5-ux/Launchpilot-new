-- Blog Notification Integration
-- Adds "BLOG" to the existing NotificationType enum (originally created in
-- 002_enterprise_admin_schema.sql: SYSTEM, REVIEW, TOOL, COMPANY, USER,
-- PAYMENT, ALERT). No new table, no new enum, no parallel notification
-- system — blog events reuse the existing Notification model exactly like
-- every other notification type already does.

ALTER TYPE "NotificationType" ADD VALUE 'BLOG';
