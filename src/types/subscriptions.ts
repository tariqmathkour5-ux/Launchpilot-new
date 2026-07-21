export interface PlanLimits {
  favorites: number;
  collections: number;
  collection_items: number;
  comparisons: number;
  api_requests: number;
  team_members?: number;
  published_tools?: number;
  ad_campaigns?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthly_price: number;
  yearly_price: number;
  trial_days: number;
  features: string[];
  limits: PlanLimits;
  sort_order: number;
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  current_period_start: Date;
  current_period_end: Date;
  trial_start: Date | null;
  trial_end: Date | null;
  canceled_at: Date | null;
  cancel_at_period_end: boolean;
  payment_provider: string | null;
  plan_name?: string;
  plan_slug?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  subscription_id: string | null;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  line_items: InvoiceLineItem[];
  due_date: Date | null;
  paid_at: Date | null;
  created_at: Date;
}

export interface Coupon {
  id: string;
  code: string;
  name: string | null;
  discount_type: string;
  discount_value: number;
  currency: string;
  applicable_plans: string[];
  valid_until: Date | null;
}