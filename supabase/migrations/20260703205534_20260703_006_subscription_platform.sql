/*
# Enterprise Premium Membership & Subscription Platform

## Overview
Complete subscription management system with plans, billing, feature gating,
usage limits, coupons, invoices, and revenue analytics.

## New Tables
1. subscription_plans - Plan definitions with pricing, features, limits
2. user_subscriptions - User subscription records
3. company_subscriptions - Company subscription records
4. subscription_coupons - Discount coupons
5. coupon_redemptions - Coupon usage tracking
6. invoices - Billing invoice records
7. usage_tracking - Feature usage metering
8. subscription_events - Audit trail

## Security
- RLS on all tables with owner-scoped + admin access policies
- Plans and active coupons publicly readable
*/

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  monthly_price numeric NOT NULL DEFAULT 0,
  yearly_price numeric NOT NULL DEFAULT 0,
  trial_days integer NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  trial_start timestamptz,
  trial_end timestamptz,
  canceled_at timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  payment_provider text CHECK (payment_provider IN ('stripe', 'paypal', 'paddle', 'lemon_squeezy')),
  external_subscription_id text,
  coupon_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Company Subscriptions
CREATE TABLE IF NOT EXISTS company_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES "Company"(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  trial_start timestamptz,
  trial_end timestamptz,
  canceled_at timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  payment_provider text CHECK (payment_provider IN ('stripe', 'paypal', 'paddle', 'lemon_squeezy')),
  external_subscription_id text,
  coupon_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Subscription Coupons
CREATE TABLE IF NOT EXISTS subscription_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  currency text DEFAULT 'USD',
  max_redemptions integer,
  current_redemptions integer NOT NULL DEFAULT 0,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  applicable_plans jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by text REFERENCES "User"(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Coupon Redemptions
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES subscription_coupons(id),
  user_id text NOT NULL REFERENCES "User"(id),
  subscription_id uuid REFERENCES user_subscriptions(id),
  discount_applied numeric NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  user_id text REFERENCES "User"(id),
  company_id text REFERENCES "Company"(id),
  subscription_id uuid,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'paid', 'failed', 'refunded')),
  payment_provider text,
  external_payment_id text,
  billing_details jsonb DEFAULT '{}'::jsonb,
  line_items jsonb DEFAULT '[]'::jsonb,
  paid_at timestamptz,
  due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Usage Tracking
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text REFERENCES "User"(id),
  company_id text REFERENCES "Company"(id),
  metric text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  period_start timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  period_end timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, metric, period_start)
);

-- Subscription Events
CREATE TABLE IF NOT EXISTS subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid,
  user_id text REFERENCES "User"(id),
  company_id text REFERENCES "Company"(id),
  event_type text NOT NULL CHECK (event_type IN ('created', 'renewed', 'upgraded', 'downgraded', 'canceled', 'expired', 'payment_failed', 'refunded', 'trial_started', 'trial_ended')),
  from_plan_id uuid REFERENCES subscription_plans(id),
  to_plan_id uuid REFERENCES subscription_plans(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_company_id ON company_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_status ON company_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_metric ON usage_tracking(user_id, metric);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_coupons_code ON subscription_coupons(code);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Plans: public read active, admin write
DROP POLICY IF EXISTS "anyone_can_read_plans" ON subscription_plans;
CREATE POLICY "anyone_can_read_plans" ON subscription_plans FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_insert_plans" ON subscription_plans;
CREATE POLICY "admin_insert_plans" ON subscription_plans FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "admin_update_plans" ON subscription_plans;
CREATE POLICY "admin_update_plans" ON subscription_plans FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "admin_delete_plans" ON subscription_plans;
CREATE POLICY "admin_delete_plans" ON subscription_plans FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

-- User subscriptions: owner + admin
DROP POLICY IF EXISTS "users_read_own_subscriptions" ON user_subscriptions;
CREATE POLICY "users_read_own_subscriptions" ON user_subscriptions FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "user_insert_subscriptions" ON user_subscriptions;
CREATE POLICY "user_insert_subscriptions" ON user_subscriptions FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "user_update_subscriptions" ON user_subscriptions;
CREATE POLICY "user_update_subscriptions" ON user_subscriptions FOR UPDATE
  TO authenticated USING (
    user_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  ) WITH CHECK (
    user_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "admin_delete_subscriptions" ON user_subscriptions;
CREATE POLICY "admin_delete_subscriptions" ON user_subscriptions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

-- Company subscriptions: company owner + admin
DROP POLICY IF EXISTS "company_read_subscriptions" ON company_subscriptions;
CREATE POLICY "company_read_subscriptions" ON company_subscriptions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "Company" WHERE id = company_id AND "ownerId" = auth.uid()::text) OR
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "company_insert_subscriptions" ON company_subscriptions;
CREATE POLICY "company_insert_subscriptions" ON company_subscriptions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM "Company" WHERE id = company_id AND "ownerId" = auth.uid()::text) OR
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "company_update_subscriptions" ON company_subscriptions;
CREATE POLICY "company_update_subscriptions" ON company_subscriptions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "Company" WHERE id = company_id AND "ownerId" = auth.uid()::text) OR
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "Company" WHERE id = company_id AND "ownerId" = auth.uid()::text) OR
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "company_delete_subscriptions" ON company_subscriptions;
CREATE POLICY "company_delete_subscriptions" ON company_subscriptions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

-- Coupons: public read active, admin write
DROP POLICY IF EXISTS "anyone_read_active_coupons" ON subscription_coupons;
CREATE POLICY "anyone_read_active_coupons" ON subscription_coupons FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_insert_coupons" ON subscription_coupons;
CREATE POLICY "admin_insert_coupons" ON subscription_coupons FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "admin_update_coupons" ON subscription_coupons;
CREATE POLICY "admin_update_coupons" ON subscription_coupons FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "admin_delete_coupons" ON subscription_coupons;
CREATE POLICY "admin_delete_coupons" ON subscription_coupons FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

-- Coupon redemptions
DROP POLICY IF EXISTS "users_read_own_redemptions" ON coupon_redemptions;
CREATE POLICY "users_read_own_redemptions" ON coupon_redemptions FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "users_insert_redemptions" ON coupon_redemptions;
CREATE POLICY "users_insert_redemptions" ON coupon_redemptions FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "admin_update_redemptions" ON coupon_redemptions;
CREATE POLICY "admin_update_redemptions" ON coupon_redemptions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "admin_delete_redemptions" ON coupon_redemptions;
CREATE POLICY "admin_delete_redemptions" ON coupon_redemptions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

-- Invoices: owner + company owner + admin
DROP POLICY IF EXISTS "users_read_own_invoices" ON invoices;
CREATE POLICY "users_read_own_invoices" ON invoices FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM "Company" WHERE id = company_id AND "ownerId" = auth.uid()::text) OR
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "system_insert_invoices" ON invoices;
CREATE POLICY "system_insert_invoices" ON invoices FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "admin_update_invoices" ON invoices;
CREATE POLICY "admin_update_invoices" ON invoices FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "admin_delete_invoices" ON invoices;
CREATE POLICY "admin_delete_invoices" ON invoices FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

-- Usage tracking
DROP POLICY IF EXISTS "users_read_own_usage" ON usage_tracking;
CREATE POLICY "users_read_own_usage" ON usage_tracking FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM "Company" WHERE id = company_id AND "ownerId" = auth.uid()::text) OR
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "system_insert_usage" ON usage_tracking;
CREATE POLICY "system_insert_usage" ON usage_tracking FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "system_update_usage" ON usage_tracking;
CREATE POLICY "system_update_usage" ON usage_tracking FOR UPDATE
  TO authenticated USING (
    user_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  ) WITH CHECK (
    user_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "admin_delete_usage" ON usage_tracking;
CREATE POLICY "admin_delete_usage" ON usage_tracking FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

-- Subscription events
DROP POLICY IF EXISTS "users_read_own_events" ON subscription_events;
CREATE POLICY "users_read_own_events" ON subscription_events FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "system_insert_events" ON subscription_events;
CREATE POLICY "system_insert_events" ON subscription_events FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "admin_update_events" ON subscription_events;
CREATE POLICY "admin_update_events" ON subscription_events FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

DROP POLICY IF EXISTS "admin_delete_events" ON subscription_events;
CREATE POLICY "admin_delete_events" ON subscription_events FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN'::"Role")
  );

-- Seed default plans
INSERT INTO subscription_plans (name, slug, description, monthly_price, yearly_price, trial_days, features, limits, sort_order)
VALUES
  ('Free', 'free', 'Basic access to AI tool directory', 0, 0, 0,
   '["Browse all tools", "Basic search", "5 favorites", "1 collection", "Community reviews"]'::jsonb,
   '{"favorites": 5, "collections": 1, "collection_items": 10, "comparisons": 3, "api_requests": 0}'::jsonb,
   0),
  ('Pro', 'pro', 'Enhanced features for power users', 990, 9900, 14,
   '["Everything in Free", "Unlimited favorites", "Unlimited collections", "Advanced search filters", "Personalized recommendations", "Export comparisons", "Priority support"]'::jsonb,
   '{"favorites": -1, "collections": -1, "collection_items": 100, "comparisons": -1, "api_requests": 1000}'::jsonb,
   1),
  ('Business', 'business', 'For teams and companies', 2990, 29900, 14,
   '["Everything in Pro", "Company dashboard", "Advanced analytics", "Team members (5)", "Published tools (10)", "Advertising campaigns (3)", "API access", "Custom branding"]'::jsonb,
   '{"favorites": -1, "collections": -1, "collection_items": -1, "comparisons": -1, "api_requests": 10000, "team_members": 5, "published_tools": 10, "ad_campaigns": 3}'::jsonb,
   2),
  ('Enterprise', 'enterprise', 'Custom solutions for large organizations', 9990, 99900, 30,
   '["Everything in Business", "Unlimited team members", "Unlimited published tools", "Unlimited advertising", "Unlimited API access", "Dedicated support", "Custom integrations", "SLA guarantee", "White-label options"]'::jsonb,
   '{"favorites": -1, "collections": -1, "collection_items": -1, "comparisons": -1, "api_requests": -1, "team_members": -1, "published_tools": -1, "ad_campaigns": -1}'::jsonb,
   3)
ON CONFLICT (slug) DO NOTHING;
