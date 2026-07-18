
-- SEO Landing Pages Platform
-- Tables: seo_landing_pages, seo_tags, seo_index_settings, seo_page_views

CREATE TABLE IF NOT EXISTS seo_landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  heading TEXT,
  subheading TEXT,
  page_type TEXT NOT NULL DEFAULT 'collection' CHECK (page_type IN ('collection', 'use_case', 'comparison', 'featured')),
  filter_config JSONB NOT NULL DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  schema_type TEXT DEFAULT 'ItemList',
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_auto_generated BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  tool_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seo_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  filter_key TEXT NOT NULL,
  filter_value TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  tool_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seo_index_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_pattern TEXT NOT NULL,
  should_index BOOLEAN NOT NULL DEFAULT true,
  priority DECIMAL(2,1) NOT NULL DEFAULT 0.5 CHECK (priority >= 0 AND priority <= 1),
  change_freq TEXT NOT NULL DEFAULT 'weekly' CHECK (change_freq IN ('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seo_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,
  page_slug TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seo_landing_pages_slug ON seo_landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_seo_landing_pages_type ON seo_landing_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_seo_landing_pages_published ON seo_landing_pages(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_seo_tags_slug ON seo_tags(slug);
CREATE INDEX IF NOT EXISTS idx_seo_page_views_page ON seo_page_views(page_type, page_slug);
CREATE INDEX IF NOT EXISTS idx_seo_page_views_viewed_at ON seo_page_views(viewed_at);

-- RLS
ALTER TABLE seo_landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_index_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_page_views ENABLE ROW LEVEL SECURITY;

-- seo_landing_pages: public read, admin write
CREATE POLICY "select_seo_landing_pages" ON seo_landing_pages FOR SELECT
  TO anon, authenticated USING (is_published = true);

CREATE POLICY "admin_insert_seo_landing_pages" ON seo_landing_pages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "admin_update_seo_landing_pages" ON seo_landing_pages FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "admin_delete_seo_landing_pages" ON seo_landing_pages FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

-- seo_tags: public read, admin write
CREATE POLICY "select_seo_tags" ON seo_tags FOR SELECT
  TO anon, authenticated USING (is_published = true);

CREATE POLICY "admin_insert_seo_tags" ON seo_tags FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "admin_update_seo_tags" ON seo_tags FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "admin_delete_seo_tags" ON seo_tags FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

-- seo_index_settings: admin only
CREATE POLICY "admin_select_seo_index" ON seo_index_settings FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "admin_insert_seo_index" ON seo_index_settings FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "admin_update_seo_index" ON seo_index_settings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

CREATE POLICY "admin_delete_seo_index" ON seo_index_settings FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

-- seo_page_views: insert for all, select for admin
CREATE POLICY "insert_seo_page_views" ON seo_page_views FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_select_seo_page_views" ON seo_page_views FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

-- Seed: seo_landing_pages
INSERT INTO seo_landing_pages (slug, title, description, heading, subheading, page_type, filter_config, meta_title, meta_description, is_published, sort_order) VALUES
('best-ai-tools-for-students', 'Best AI Tools for Students', 'Top AI tools to help students with studying, writing, and research', 'Best AI Tools for Students in 2025', 'Discover AI-powered tools designed to supercharge your academic performance', 'collection', '{"tags": ["education", "writing", "research"], "pricing": ["free", "freemium"], "sort": "rating"}', 'Best AI Tools for Students 2025 | LaunchPilot', 'Explore the top AI tools for students including writing assistants, study helpers, and research tools. Free and affordable options available.', true, 10),
('best-ai-tools-for-developers', 'Best AI Tools for Developers', 'Top AI coding assistants, code generation, and developer productivity tools', 'Best AI Tools for Developers in 2025', 'From code completion to automated testing, find the AI tools that will level up your development workflow', 'collection', '{"categories": ["ai-coding"], "sort": "rating"}', 'Best AI Tools for Developers 2025 | LaunchPilot', 'Discover the best AI coding tools for developers including GitHub Copilot alternatives, code generators, and debugging assistants.', true, 20),
('best-ai-tools-for-marketing', 'Best AI Tools for Marketing', 'AI-powered marketing tools for content creation, SEO, and campaign management', 'Best AI Marketing Tools in 2025', 'Transform your marketing strategy with these cutting-edge AI tools for content, SEO, and analytics', 'collection', '{"tags": ["marketing", "content", "seo"], "sort": "rating"}', 'Best AI Marketing Tools 2025 | LaunchPilot', 'Find the best AI tools for marketing teams: content generators, SEO optimizers, ad copy writers, and campaign analyzers.', true, 30),
('free-ai-tools', 'Free AI Tools', 'The best completely free AI tools with no credit card required', 'Best Free AI Tools in 2025', 'Access powerful AI capabilities without spending a dime — fully free tools, no strings attached', 'collection', '{"pricing": ["free"], "sort": "rating"}', 'Best Free AI Tools 2025 — No Credit Card Required | LaunchPilot', 'Comprehensive list of completely free AI tools for writing, image generation, coding, and more. No credit card required.', true, 40),
('ai-tools-for-small-business', 'AI Tools for Small Business', 'Affordable AI solutions to help small businesses compete and grow', 'AI Tools for Small Business Growth', 'Level the playing field with AI tools that automate tasks, create content, and drive growth for your small business', 'collection', '{"tags": ["business", "productivity"], "pricing": ["free", "freemium", "paid"], "sort": "rating"}', 'Best AI Tools for Small Business 2025 | LaunchPilot', 'Discover affordable AI tools that help small businesses automate marketing, customer service, content creation, and operations.', true, 50),
('ai-writing-tools', 'Best AI Writing Tools', 'Top AI writing assistants for content creation, copywriting, and editing', 'Best AI Writing Tools in 2025', 'Write better, faster content with AI-powered writing assistants and copywriting tools', 'collection', '{"categories": ["ai-writing"], "sort": "rating"}', 'Best AI Writing Tools & Assistants 2025 | LaunchPilot', 'Compare the top AI writing tools including ChatGPT, Jasper, Copy.ai, and more. Find the perfect writing assistant for your needs.', true, 60),
('ai-image-generators', 'Best AI Image Generators', 'Top AI image generation tools for creating stunning visuals', 'Best AI Image Generators in 2025', 'Create professional images, art, and graphics with the power of AI image generation', 'collection', '{"categories": ["ai-image"], "sort": "rating"}', 'Best AI Image Generators 2025 | LaunchPilot', 'Discover the top AI image generation tools including Midjourney, DALL-E, Stable Diffusion, and more. Compare features and pricing.', true, 70),
('ai-productivity-tools', 'AI Productivity Tools', 'AI tools to automate tasks, manage time, and boost workplace productivity', 'Best AI Productivity Tools in 2025', 'Work smarter, not harder with AI-powered productivity tools for task management, automation, and focus', 'collection', '{"tags": ["productivity", "automation"], "sort": "rating"}', 'Best AI Productivity Tools 2025 | LaunchPilot', 'Find the best AI productivity tools to automate repetitive tasks, manage projects, and optimize your workflow.', true, 80),
('ai-tools-for-content-creators', 'AI Tools for Content Creators', 'Essential AI tools for YouTubers, podcasters, streamers, and social media creators', 'Best AI Tools for Content Creators', 'Grow your audience and create better content faster with these AI-powered creator tools', 'collection', '{"tags": ["content", "video", "audio", "social-media"], "sort": "rating"}', 'Best AI Tools for Content Creators 2025 | LaunchPilot', 'Discover AI tools for content creators: video editors, thumbnail generators, script writers, and social media automation tools.', true, 90),
('enterprise-ai-tools', 'Enterprise AI Tools', 'Scalable AI solutions for enterprise teams and large organizations', 'Best Enterprise AI Tools in 2025', 'Deploy AI at scale with enterprise-grade tools built for security, compliance, and team collaboration', 'collection', '{"pricing": ["paid", "enterprise"], "tags": ["enterprise", "team"], "sort": "rating"}', 'Best Enterprise AI Tools 2025 | LaunchPilot', 'Compare enterprise AI solutions for large organizations. Find tools with SSO, compliance features, API access, and dedicated support.', true, 100)
ON CONFLICT (slug) DO NOTHING;

-- Seed: seo_tags
INSERT INTO seo_tags (slug, name, description, filter_key, filter_value, is_published) VALUES
('free-plan', 'Free Plan Available', 'AI tools with a free tier or free plan', 'pricing', 'free', true),
('api-available', 'API Available', 'AI tools that offer a developer API', 'has_api', 'true', true),
('mobile-app', 'Mobile App', 'AI tools with a dedicated mobile app', 'has_mobile', 'true', true),
('browser-extension', 'Browser Extension', 'AI tools available as browser extensions', 'has_extension', 'true', true),
('no-signup', 'No Signup Required', 'AI tools you can use without creating an account', 'requires_signup', 'false', true),
('open-source', 'Open Source', 'Open source AI tools and models', 'is_open_source', 'true', true),
('offline', 'Works Offline', 'AI tools that can run locally without internet', 'works_offline', 'true', true),
('team-collaboration', 'Team Collaboration', 'AI tools built for teams and collaboration', 'supports_teams', 'true', true),
('gdpr-compliant', 'GDPR Compliant', 'AI tools that are compliant with GDPR regulations', 'is_gdpr_compliant', 'true', true),
('new-this-month', 'New This Month', 'Recently launched AI tools', 'recency', 'month', true)
ON CONFLICT (slug) DO NOTHING;

-- Seed: seo_index_settings
INSERT INTO seo_index_settings (url_pattern, should_index, priority, change_freq, notes) VALUES
('/tools/*', true, 0.8, 'weekly', 'Individual tool pages'),
('/categories/*', true, 0.7, 'weekly', 'Category listing pages'),
('/collections/*', true, 0.8, 'weekly', 'SEO landing page collections'),
('/companies/*', true, 0.7, 'monthly', 'Company profile pages'),
('/tags/*', true, 0.6, 'weekly', 'Tag filter pages'),
('/use-cases/*', true, 0.7, 'monthly', 'Use case landing pages'),
('/compare/*', true, 0.8, 'weekly', 'Tool comparison pages'),
('/blog/*', true, 0.9, 'daily', 'Blog posts and articles')
ON CONFLICT DO NOTHING;
