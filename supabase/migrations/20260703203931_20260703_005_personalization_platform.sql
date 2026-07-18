/*
# Enterprise AI Personalization & Recommendation Platform

## Overview
Adds personalization infrastructure: user interest profiles, favorites with folders,
collections, recently viewed tracking, recommendation events, and privacy controls.

## New Tables
- user_interests: behavioral interest signals per user
- favorite_folders: organizes favorites into folders
- user_favorites: saved items (tools, comparisons, coupons, companies)
- user_collections: custom curated tool collections
- collection_items: tools within collections
- recently_viewed: last viewed items per user
- recommendation_events: tracks recommendation effectiveness
- user_privacy_settings: per-user personalization preferences

## Security
- RLS on all tables, owner-scoped
- Admin read access for analytics tables
- Uses auth.uid()::text to match User.id (text type)
*/

-- ============================================================
-- USER INTERESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_interests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  category_id text,
  tool_id     text,
  interest_type text NOT NULL CHECK (interest_type IN ('viewed', 'compared', 'reviewed', 'favorited', 'clicked_affiliate', 'searched')),
  weight      float NOT NULL DEFAULT 1.0,
  metadata    jsonb,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_interests_user ON user_interests (user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_type ON user_interests (interest_type);
CREATE INDEX IF NOT EXISTS idx_user_interests_tool ON user_interests (tool_id) WHERE tool_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_interests_category ON user_interests (category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_interests_created ON user_interests (created_at DESC);

DROP POLICY IF EXISTS "users_select_own_interests" ON user_interests;
CREATE POLICY "users_select_own_interests" ON user_interests FOR SELECT
  TO authenticated USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users_insert_own_interests" ON user_interests;
CREATE POLICY "users_insert_own_interests" ON user_interests FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users_delete_own_interests" ON user_interests;
CREATE POLICY "users_delete_own_interests" ON user_interests FOR DELETE
  TO authenticated USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "admin_select_all_interests" ON user_interests;
CREATE POLICY "admin_select_all_interests" ON user_interests FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role = 'ADMIN'::"Role")
  );

-- ============================================================
-- FAVORITE FOLDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS favorite_folders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE favorite_folders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_favorite_folders_user ON favorite_folders (user_id);

DROP POLICY IF EXISTS "users_select_own_folders" ON favorite_folders;
CREATE POLICY "users_select_own_folders" ON favorite_folders FOR SELECT
  TO authenticated USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users_insert_own_folders" ON favorite_folders;
CREATE POLICY "users_insert_own_folders" ON favorite_folders FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users_update_own_folders" ON favorite_folders;
CREATE POLICY "users_update_own_folders" ON favorite_folders FOR UPDATE
  TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users_delete_own_folders" ON favorite_folders;
CREATE POLICY "users_delete_own_folders" ON favorite_folders FOR DELETE
  TO authenticated USING (auth.uid()::text = user_id);

-- ============================================================
-- USER FAVORITES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  item_type   text NOT NULL CHECK (item_type IN ('tool', 'comparison', 'coupon', 'company')),
  item_id     text NOT NULL,
  folder_id   uuid REFERENCES favorite_folders(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_type ON user_favorites (item_type);
CREATE INDEX IF NOT EXISTS idx_user_favorites_folder ON user_favorites (folder_id) WHERE folder_id IS NOT NULL;

DROP POLICY IF EXISTS "users_select_own_favorites" ON user_favorites;
CREATE POLICY "users_select_own_favorites" ON user_favorites FOR SELECT
  TO authenticated USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users_insert_own_favorites" ON user_favorites;
CREATE POLICY "users_insert_own_favorites" ON user_favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users_update_own_favorites" ON user_favorites;
CREATE POLICY "users_update_own_favorites" ON user_favorites FOR UPDATE
  TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users_delete_own_favorites" ON user_favorites;
CREATE POLICY "users_delete_own_favorites" ON user_favorites FOR DELETE
  TO authenticated USING (auth.uid()::text = user_id);

-- ============================================================
-- USER COLLECTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_collections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  slug        text NOT NULL UNIQUE,
  is_public   boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_collections_user ON user_collections (user_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_slug ON user_collections (slug);
CREATE INDEX IF NOT EXISTS idx_user_collections_public ON user_collections (is_public) WHERE is_public = true;

DROP POLICY IF EXISTS "users_select_own_collections" ON user_collections;
CREATE POLICY "users_select_own_collections" ON user_collections FOR SELECT
  TO authenticated USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "public_select_shared_collections" ON user_collections;
CREATE POLICY "public_select_shared_collections" ON user_collections FOR SELECT
  TO anon, authenticated USING (is_public = true);

DROP POLICY IF EXISTS "users_insert_own_collections" ON user_collections;
CREATE POLICY "users_insert_own_collections" ON user_collections FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users_update_own_collections" ON user_collections;
CREATE POLICY "users_update_own_collections" ON user_collections FOR UPDATE
  TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users_delete_own_collections" ON user_collections;
CREATE POLICY "users_delete_own_collections" ON user_collections FOR DELETE
  TO authenticated USING (auth.uid()::text = user_id);

-- ============================================================
-- COLLECTION ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS collection_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES user_collections(id) ON DELETE CASCADE,
  tool_id       text NOT NULL REFERENCES "Tool"(id) ON DELETE CASCADE,
  note          text,
  sort_order    int NOT NULL DEFAULT 0,
  added_at      timestamptz DEFAULT now(),
  UNIQUE(collection_id, tool_id)
);

ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON collection_items (collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_tool ON collection_items (tool_id);

DROP POLICY IF EXISTS "users_select_own_collection_items" ON collection_items;
CREATE POLICY "users_select_own_collection_items" ON collection_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_collections WHERE user_collections.id = collection_items.collection_id AND user_collections.user_id = auth.uid()::text)
  );

DROP POLICY IF EXISTS "public_select_shared_collection_items" ON collection_items;
CREATE POLICY "public_select_shared_collection_items" ON collection_items FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM user_collections WHERE user_collections.id = collection_items.collection_id AND user_collections.is_public = true)
  );

DROP POLICY IF EXISTS "users_insert_own_collection_items" ON collection_items;
CREATE POLICY "users_insert_own_collection_items" ON collection_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_collections WHERE user_collections.id = collection_items.collection_id AND user_collections.user_id = auth.uid()::text)
  );

DROP POLICY IF EXISTS "users_update_own_collection_items" ON collection_items;
CREATE POLICY "users_update_own_collection_items" ON collection_items FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_collections WHERE user_collections.id = collection_items.collection_id AND user_collections.user_id = auth.uid()::text))
  WITH CHECK (EXISTS (SELECT 1 FROM user_collections WHERE user_collections.id = collection_items.collection_id AND user_collections.user_id = auth.uid()::text));

DROP POLICY IF EXISTS "users_delete_own_collection_items" ON collection_items;
CREATE POLICY "users_delete_own_collection_items" ON collection_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_collections WHERE user_collections.id = collection_items.collection_id AND user_collections.user_id = auth.uid()::text)
  );

-- ============================================================
-- RECENTLY VIEWED TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS recently_viewed (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  item_type   text NOT NULL CHECK (item_type IN ('tool', 'comparison', 'category', 'blog', 'company')),
  item_id     text NOT NULL,
  viewed_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON recently_viewed (user_id, viewed_at DESC);

DROP POLICY IF EXISTS "users_select_own_views" ON recently_viewed;
CREATE POLICY "users_select_own_views" ON recently_viewed FOR SELECT
  TO authenticated USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users_insert_own_views" ON recently_viewed;
CREATE POLICY "users_insert_own_views" ON recently_viewed FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users_delete_own_views" ON recently_viewed;
CREATE POLICY "users_delete_own_views" ON recently_viewed FOR DELETE
  TO authenticated USING (auth.uid()::text = user_id);

-- ============================================================
-- RECOMMENDATION EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS recommendation_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  tool_id             text NOT NULL REFERENCES "Tool"(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL CHECK (recommendation_type IN ('similar', 'alternative', 'category', 'trending', 'personalized')),
  action              text NOT NULL CHECK (action IN ('shown', 'clicked', 'dismissed')),
  source_page         text,
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE recommendation_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_rec_events_user ON recommendation_events (user_id);
CREATE INDEX IF NOT EXISTS idx_rec_events_tool ON recommendation_events (tool_id);
CREATE INDEX IF NOT EXISTS idx_rec_events_type ON recommendation_events (recommendation_type);
CREATE INDEX IF NOT EXISTS idx_rec_events_created ON recommendation_events (created_at DESC);

DROP POLICY IF EXISTS "users_select_own_rec_events" ON recommendation_events;
CREATE POLICY "users_select_own_rec_events" ON recommendation_events FOR SELECT
  TO authenticated USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users_insert_own_rec_events" ON recommendation_events;
CREATE POLICY "users_insert_own_rec_events" ON recommendation_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "admin_select_all_rec_events" ON recommendation_events;
CREATE POLICY "admin_select_all_rec_events" ON recommendation_events FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE "User".id = auth.uid()::text AND "User".role = 'ADMIN'::"Role")
  );

-- ============================================================
-- USER PRIVACY SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_privacy_settings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 text NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  personalization_enabled boolean NOT NULL DEFAULT true,
  track_views             boolean NOT NULL DEFAULT true,
  track_searches          boolean NOT NULL DEFAULT true,
  show_recommendations    boolean NOT NULL DEFAULT true,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_privacy" ON user_privacy_settings;
CREATE POLICY "users_select_own_privacy" ON user_privacy_settings FOR SELECT
  TO authenticated USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users_insert_own_privacy" ON user_privacy_settings;
CREATE POLICY "users_insert_own_privacy" ON user_privacy_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users_update_own_privacy" ON user_privacy_settings;
CREATE POLICY "users_update_own_privacy" ON user_privacy_settings FOR UPDATE
  TO authenticated USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
