-- Blog View Analytics Tracking
-- New table: blog_post_view. Mirrors the shape and naming convention of
-- the existing tool_view analytics table (Milestone 4) rather than
-- inventing a new analytics pattern: snake_case table/columns, same
-- anon-can-insert / admin-can-read RLS split.

CREATE TABLE blog_post_view (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT NOT NULL REFERENCES "BlogPost"(id) ON DELETE CASCADE,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  device TEXT DEFAULT 'desktop',
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blog_post_view_post_id ON blog_post_view(post_id);
CREATE INDEX idx_blog_post_view_created_at ON blog_post_view(created_at);
CREATE INDEX idx_blog_post_view_session_id ON blog_post_view(session_id);

ALTER TABLE blog_post_view ENABLE ROW LEVEL SECURITY;

-- Same split as tool_view: anyone (including anonymous visitors) can
-- record a view, but only admins/editors can read the raw analytics data.
-- Reuses the existing is_admin_or_editor() helper function defined in the
-- 003_analytics_tracking migration rather than redefining an equivalent.
CREATE POLICY "select_blog_post_view" ON blog_post_view FOR SELECT
  TO authenticated USING (is_admin_or_editor());
CREATE POLICY "insert_blog_post_view" ON blog_post_view FOR INSERT
  TO anon, authenticated WITH CHECK (true);
