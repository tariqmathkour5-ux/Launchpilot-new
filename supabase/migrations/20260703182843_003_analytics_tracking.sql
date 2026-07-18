-- Search Analytics Tracking
CREATE TABLE search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  category TEXT,
  results_count INTEGER DEFAULT 0,
  clicked_tool_id TEXT,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  device TEXT DEFAULT 'desktop',
  source TEXT DEFAULT 'organic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue Tracking
CREATE TABLE revenue_transaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('affiliate', 'advertising', 'subscription', 'sponsored_listing')),
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')),
  tool_id TEXT REFERENCES "Tool"(id) ON DELETE SET NULL,
  company_id TEXT REFERENCES "Company"(id) ON DELETE SET NULL,
  affiliate_partner_id TEXT,
  advertisement_id TEXT REFERENCES "Advertisement"(id) ON DELETE SET NULL,
  description TEXT,
  metadata JSONB,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Newsletter Campaign Tracking
CREATE TABLE newsletter_campaign (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  recipient_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  unsubscribe_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'scheduled', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tool View Tracking (for detailed tool analytics)
CREATE TABLE tool_view (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id TEXT NOT NULL REFERENCES "Tool"(id) ON DELETE CASCADE,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  device TEXT DEFAULT 'desktop',
  referrer TEXT,
  duration_seconds INTEGER,
  scrolled_percent INTEGER DEFAULT 0,
  clicked_affiliate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_search_analytics_query ON search_analytics(query);
CREATE INDEX idx_search_analytics_created_at ON search_analytics(created_at);
CREATE INDEX idx_search_analytics_results_count ON search_analytics(results_count);
CREATE INDEX idx_revenue_transaction_type ON revenue_transaction(type);
CREATE INDEX idx_revenue_transaction_status ON revenue_transaction(status);
CREATE INDEX idx_revenue_transaction_date ON revenue_transaction(transaction_date);
CREATE INDEX idx_tool_view_tool_id ON tool_view(tool_id);
CREATE INDEX idx_tool_view_created_at ON tool_view(created_at);
CREATE INDEX idx_newsletter_campaign_sent_at ON newsletter_campaign(sent_at);

-- Enable RLS
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaign ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_view ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin/editor role
CREATE OR REPLACE FUNCTION is_admin_or_editor() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role IN ('ADMIN'::"Role", 'EDITOR'::"Role")
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check admin role only
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role"
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for search_analytics
CREATE POLICY "select_search_analytics" ON search_analytics FOR SELECT
  TO authenticated USING (is_admin_or_editor());
CREATE POLICY "insert_search_analytics" ON search_analytics FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- RLS Policies for revenue_transaction
CREATE POLICY "select_revenue_transaction" ON revenue_transaction FOR SELECT
  TO authenticated USING (is_admin());
CREATE POLICY "all_revenue_transaction_admin" ON revenue_transaction FOR ALL
  TO authenticated USING (is_admin());

-- RLS Policies for newsletter_campaign
CREATE POLICY "select_newsletter_campaign" ON newsletter_campaign FOR SELECT
  TO authenticated USING (is_admin_or_editor());
CREATE POLICY "all_newsletter_campaign_admin" ON newsletter_campaign FOR ALL
  TO authenticated USING (is_admin_or_editor());

-- RLS Policies for tool_view
CREATE POLICY "select_tool_view" ON tool_view FOR SELECT
  TO authenticated USING (is_admin_or_editor());
CREATE POLICY "insert_tool_view" ON tool_view FOR INSERT
  TO anon, authenticated WITH CHECK (true);