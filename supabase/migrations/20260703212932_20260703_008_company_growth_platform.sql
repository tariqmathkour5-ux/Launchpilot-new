
-- Enterprise Company Growth Platform
-- New tables: company_members, company_leads, company_verification, company_review_replies, company_review_reports, company_media

CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'administrator', 'editor', 'marketing_manager', 'support_agent', 'analytics_viewer')),
  invited_by TEXT,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  UNIQUE (company_id, user_id)
);

CREATE TABLE IF NOT EXISTS company_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  source TEXT DEFAULT 'organic' CHECK (source IN ('organic', 'campaign', 'referral', 'direct', 'social', 'email', 'other')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  notes TEXT,
  tool_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'verified', 'rejected')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewer_id TEXT,
  rejection_reason TEXT,
  documents JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  review_id TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  author_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, review_id)
);

CREATE TABLE IF NOT EXISTS company_review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  review_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'fake', 'inappropriate', 'conflict_of_interest', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  reported_by TEXT NOT NULL,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('logo', 'cover', 'screenshot', 'video', 'document')),
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_leads_company ON company_leads(company_id);
CREATE INDEX IF NOT EXISTS idx_company_leads_status ON company_leads(status);
CREATE INDEX IF NOT EXISTS idx_company_verification_company ON company_verification(company_id);
CREATE INDEX IF NOT EXISTS idx_company_review_replies_company ON company_review_replies(company_id);
CREATE INDEX IF NOT EXISTS idx_company_review_reports_company ON company_review_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_company_media_company ON company_media(company_id);
CREATE INDEX IF NOT EXISTS idx_company_page_views_company ON company_page_views(company_id);
CREATE INDEX IF NOT EXISTS idx_company_page_views_viewed_at ON company_page_views(viewed_at);

-- RLS
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_page_views ENABLE ROW LEVEL SECURITY;

-- company_members: members can read their own company data; admins can read all
CREATE POLICY "select_company_members" ON company_members FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()::text
    OR company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()::text AND status = 'active')
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "insert_company_members" ON company_members FOR INSERT
  TO authenticated WITH CHECK (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()::text AND role IN ('owner', 'administrator') AND status = 'active')
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "update_company_members" ON company_members FOR UPDATE
  TO authenticated USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()::text AND role IN ('owner', 'administrator') AND status = 'active')
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "delete_company_members" ON company_members FOR DELETE
  TO authenticated USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()::text AND role IN ('owner', 'administrator') AND status = 'active')
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

-- company_leads: company members with appropriate roles
CREATE POLICY "select_company_leads" ON company_leads FOR SELECT
  TO authenticated USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()::text AND status = 'active')
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "insert_company_leads" ON company_leads FOR INSERT
  TO authenticated WITH CHECK (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()::text AND status = 'active')
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "update_company_leads" ON company_leads FOR UPDATE
  TO authenticated USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()::text AND status = 'active')
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "delete_company_leads" ON company_leads FOR DELETE
  TO authenticated USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()::text AND status = 'active')
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

-- company_verification: company owners and admins
CREATE POLICY "select_company_verification" ON company_verification FOR SELECT
  TO authenticated USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()::text AND status = 'active')
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "insert_company_verification" ON company_verification FOR INSERT
  TO authenticated WITH CHECK (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()::text AND role IN ('owner', 'administrator') AND status = 'active')
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "update_company_verification" ON company_verification FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "delete_company_verification" ON company_verification FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

-- company_review_replies: public read, company members write
CREATE POLICY "select_company_review_replies" ON company_review_replies FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "insert_company_review_replies" ON company_review_replies FOR INSERT
  TO authenticated WITH CHECK (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()::text AND status = 'active')
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "update_company_review_replies" ON company_review_replies FOR UPDATE
  TO authenticated USING (
    author_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "delete_company_review_replies" ON company_review_replies FOR DELETE
  TO authenticated USING (
    author_id = auth.uid()::text
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

-- company_review_reports
CREATE POLICY "select_company_review_reports" ON company_review_reports FOR SELECT
  TO authenticated USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()::text AND status = 'active')
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "insert_company_review_reports" ON company_review_reports FOR INSERT
  TO authenticated WITH CHECK (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()::text AND status = 'active')
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "update_company_review_reports" ON company_review_reports FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "delete_company_review_reports" ON company_review_reports FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

-- company_media: public read, company members write
CREATE POLICY "select_company_media" ON company_media FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "insert_company_media" ON company_media FOR INSERT
  TO authenticated WITH CHECK (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()::text AND status = 'active')
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "update_company_media" ON company_media FOR UPDATE
  TO authenticated USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()::text AND status = 'active')
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "delete_company_media" ON company_media FOR DELETE
  TO authenticated USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()::text AND status = 'active')
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

-- company_page_views: public insert, admin select
CREATE POLICY "insert_company_page_views" ON company_page_views FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "select_company_page_views" ON company_page_views FOR SELECT
  TO authenticated USING (
    company_id IN (SELECT company_id FROM company_members WHERE user_id = auth.uid()::text AND status = 'active')
    OR EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );
