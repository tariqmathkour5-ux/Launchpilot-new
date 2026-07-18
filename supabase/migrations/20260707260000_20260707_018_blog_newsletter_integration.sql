-- Blog Newsletter Integration
-- Adds post_id to the existing newsletter_campaign table, linking a
-- campaign to the blog post it's about (nullable — most campaigns aren't
-- post-related). Reuses the existing NewsletterCampaign/NewsletterSubscriber
-- tables; no new campaign/delivery table is created.
--
-- Note on prisma/schema.prisma: NewsletterCampaign's Prisma model was also
-- corrected in this task (per-field @map added for every snake_case
-- column it was missing one for, and `status` changed from a Prisma enum
-- referencing a Postgres enum type that was never created to a plain
-- String matching the table's real TEXT + lowercase CHECK constraint).
-- That correction doesn't require a migration itself — the underlying
-- columns and their types are unchanged, only Prisma's (previously
-- inaccurate) description of them is.

ALTER TABLE newsletter_campaign ADD COLUMN post_id TEXT REFERENCES "BlogPost"(id) ON DELETE SET NULL;

CREATE INDEX idx_newsletter_campaign_post_id ON newsletter_campaign(post_id);
