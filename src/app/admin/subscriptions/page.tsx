'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard, Users, TrendingUp, Percent, DollarSign, BarChart3,
  Loader2, Plus, XCircle, CheckCircle2, Tag, RefreshCw, Receipt
} from 'lucide-react';

type Tab = 'overview' | 'plans' | 'subscribers' | 'coupons' | 'invoices' | 'events';

export default function AdminSubscriptionsPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);

  useEffect(() => { loadData(); }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const res = await fetch('/api/admin/subscriptions/revenue');
        if (res.ok) setRevenue(await res.json());
      } else {
        const res = await fetch(`/api/admin/subscriptions?tab=${tab}`);
        if (res.ok) setData(await res.json());
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: string, body: any) {
    await fetch('/api/admin/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    });
    loadData();
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Revenue', icon: BarChart3 },
    { key: 'plans', label: 'Plans', icon: CreditCard },
    { key: 'subscribers', label: 'Subscribers', icon: Users },
    { key: 'coupons', label: 'Coupons', icon: Tag },
    { key: 'invoices', label: 'Invoices', icon: Receipt },
    { key: 'events', label: 'Events', icon: RefreshCw },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Subscription Management</h1>
          <p className="text-sm text-secondary-500">Plans, subscribers, billing, and revenue</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-secondary-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-500 hover:text-secondary-700'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <>
          {tab === 'overview' && revenue && <RevenueOverview data={revenue} />}
          {tab === 'plans' && <PlansTab data={data} onAction={handleAction} />}
          {tab === 'subscribers' && <SubscribersTab data={data} onAction={handleAction} />}
          {tab === 'coupons' && <CouponsTab data={data} onAction={handleAction} />}
          {tab === 'invoices' && <InvoicesTab data={data} onAction={handleAction} />}
          {tab === 'events' && <EventsTab data={data} />}
        </>
      )}
    </div>
  );
}

function RevenueOverview({ data }: { data: any }) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={DollarSign} label="MRR" value={`$${(data.mrr / 100).toFixed(0)}`} color="text-green-600 bg-green-50" />
        <MetricCard icon={TrendingUp} label="ARR" value={`$${(data.arr / 100).toFixed(0)}`} color="text-blue-600 bg-blue-50" />
        <MetricCard icon={Users} label="Active Subscribers" value={data.activeSubscribers.toString()} sub={`${data.trialing} trialing`} color="text-primary-600 bg-primary-50" />
        <MetricCard icon={Percent} label="Churn Rate" value={`${data.churnRate}%`} sub={`ARPU: $${(data.arpu / 100).toFixed(2)}`} color="text-orange-600 bg-orange-50" />
      </div>

      {/* Revenue by plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-secondary-200">
          <div className="p-5 border-b border-secondary-100">
            <h3 className="text-sm font-semibold text-secondary-900">Revenue by Plan</h3>
          </div>
          <div className="divide-y divide-secondary-50">
            {data.revenueByPlan.map((r: any) => (
              <div key={r.plan_name} className="flex items-center justify-between px-5 py-3">
                <div>
                  <span className="text-sm font-medium text-secondary-900">{r.plan_name}</span>
                  <span className="text-xs text-secondary-400 ml-2">{r.subscriber_count} subscribers</span>
                </div>
                <span className="text-sm font-semibold text-secondary-900">${(r.revenue / 100).toFixed(0)}/mo</span>
              </div>
            ))}
            {data.revenueByPlan.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-secondary-400">No revenue data yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200">
          <div className="p-5 border-b border-secondary-100">
            <h3 className="text-sm font-semibold text-secondary-900">Conversion Metrics</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600">Trial Conversion Rate</span>
              <span className="text-sm font-semibold text-secondary-900">{data.conversionRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600">Monthly Churn Rate</span>
              <span className="text-sm font-semibold text-secondary-900">{data.churnRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-secondary-600">Avg Revenue Per User</span>
              <span className="text-sm font-semibold text-secondary-900">${(data.arpu / 100).toFixed(2)}/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent events */}
      <div className="bg-white rounded-xl border border-secondary-200">
        <div className="p-5 border-b border-secondary-100">
          <h3 className="text-sm font-semibold text-secondary-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-secondary-50 max-h-80 overflow-y-auto">
          {data.recentEvents.map((evt: any, i: number) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  evt.event_type === 'created' || evt.event_type === 'renewed' ? 'bg-green-50 text-green-700' :
                  evt.event_type === 'canceled' ? 'bg-red-50 text-red-700' :
                  evt.event_type === 'upgraded' ? 'bg-blue-50 text-blue-700' :
                  'bg-secondary-100 text-secondary-600'
                }`}>
                  {evt.event_type}
                </span>
                <span className="text-sm text-secondary-700">{evt.user_name || 'Unknown'}</span>
                {evt.plan_name && <span className="text-xs text-secondary-400">{evt.plan_name}</span>}
              </div>
              <span className="text-xs text-secondary-400">{new Date(evt.created_at).toLocaleDateString()}</span>
            </div>
          ))}
          {data.recentEvents.length === 0 && (
            <p className="px-5 py-6 text-center text-sm text-secondary-400">No events yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs text-secondary-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-secondary-900">{value}</p>
      {sub && <p className="text-xs text-secondary-400 mt-1">{sub}</p>}
    </div>
  );
}

function PlansTab({ data, onAction }: { data: any[]; onAction: (a: string, b: any) => void }) {
  if (!data) return null;
  return (
    <div className="bg-white rounded-xl border border-secondary-200">
      <div className="p-5 border-b border-secondary-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-secondary-900">Subscription Plans</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-secondary-100">
              <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Plan</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Monthly</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Yearly</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Trial</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Subscribers</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-50">
            {data.map((plan: any) => (
              <tr key={plan.id} className="hover:bg-secondary-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-secondary-900">{plan.name}</p>
                  <p className="text-xs text-secondary-400">{plan.slug}</p>
                </td>
                <td className="px-5 py-3 text-right text-secondary-700">${(plan.monthly_price / 100).toFixed(2)}</td>
                <td className="px-5 py-3 text-right text-secondary-700">${(plan.yearly_price / 100).toFixed(2)}</td>
                <td className="px-5 py-3 text-right text-secondary-700">{plan.trial_days}d</td>
                <td className="px-5 py-3 text-right font-medium text-secondary-900">{plan.active_subscribers}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${plan.is_active ? 'bg-green-50 text-green-700' : 'bg-secondary-100 text-secondary-500'}`}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubscribersTab({ data, onAction }: { data: any; onAction: (a: string, b: any) => void }) {
  const subscribers = data?.subscribers || [];
  return (
    <div className="bg-white rounded-xl border border-secondary-200">
      <div className="p-5 border-b border-secondary-100">
        <h3 className="text-sm font-semibold text-secondary-900">Active Subscribers ({data?.total || 0})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-secondary-100">
              <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase">User</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Plan</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Status</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Cycle</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Renews</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-50">
            {subscribers.map((sub: any) => (
              <tr key={sub.id} className="hover:bg-secondary-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-secondary-900">{sub.user_name}</p>
                  <p className="text-xs text-secondary-400">{sub.user_email}</p>
                </td>
                <td className="px-5 py-3 text-secondary-700">{sub.plan_name}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    sub.status === 'active' ? 'bg-green-50 text-green-700' :
                    sub.status === 'trialing' ? 'bg-blue-50 text-blue-700' :
                    sub.status === 'canceled' ? 'bg-red-50 text-red-700' :
                    'bg-secondary-100 text-secondary-600'
                  }`}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-secondary-700 capitalize">{sub.billing_cycle}</td>
                <td className="px-5 py-3 text-secondary-700 text-xs">{new Date(sub.current_period_end).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-center">
                  {sub.status === 'active' && (
                    <button
                      onClick={() => onAction('cancel_subscription', { subscription_id: sub.id, user_id: sub.user_id })}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subscribers.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-secondary-400">No subscribers yet</p>
        )}
      </div>
    </div>
  );
}

function CouponsTab({ data, onAction }: { data: any[]; onAction: (a: string, b: any) => void }) {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', discount_type: 'percentage', discount_value: 10, max_redemptions: 100 });

  async function createCoupon() {
    await onAction('create_coupon', form);
    setShowCreate(false);
    setForm({ code: '', name: '', discount_type: 'percentage', discount_value: 10, max_redemptions: 100 });
  }

  if (!data) return null;
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary text-sm flex items-center gap-1">
          <Plus className="h-4 w-4" /> New Coupon
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-secondary-200 p-5 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Code (e.g. SUMMER20)" className="px-3 py-2 border border-secondary-300 rounded-lg text-sm" />
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Internal name" className="px-3 py-2 border border-secondary-300 rounded-lg text-sm" />
            <select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })} className="px-3 py-2 border border-secondary-300 rounded-lg text-sm">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
            <input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: +e.target.value })} placeholder="Value" className="px-3 py-2 border border-secondary-300 rounded-lg text-sm" />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={createCoupon} className="btn btn-primary text-sm px-4 py-2">Create</button>
            <button onClick={() => setShowCreate(false)} className="text-sm text-secondary-500">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-secondary-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-secondary-100">
              <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Code</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Discount</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Redemptions</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Status</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-50">
            {data.map((coupon: any) => (
              <tr key={coupon.id} className="hover:bg-secondary-50">
                <td className="px-5 py-3 font-mono text-xs font-medium text-secondary-900">{coupon.code}</td>
                <td className="px-5 py-3 text-secondary-700">
                  {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
                </td>
                <td className="px-5 py-3 text-right text-secondary-700">
                  {coupon.current_redemptions}{coupon.max_redemptions ? ` / ${coupon.max_redemptions}` : ''}
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${coupon.is_active ? 'bg-green-50 text-green-700' : 'bg-secondary-100 text-secondary-500'}`}>
                    {coupon.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-5 py-3 text-center">
                  <button
                    onClick={() => onAction('update_coupon', { id: coupon.id, is_active: !coupon.is_active })}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {coupon.is_active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-secondary-400">No coupons created yet</p>
        )}
      </div>
    </div>
  );
}

function InvoicesTab({ data, onAction }: { data: any[]; onAction: (a: string, b: any) => void }) {
  if (!data) return null;
  return (
    <div className="bg-white rounded-xl border border-secondary-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-secondary-100">
            <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Invoice</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase">User</th>
            <th className="text-right px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Amount</th>
            <th className="text-center px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Status</th>
            <th className="text-center px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary-50">
          {data.map((inv: any) => (
            <tr key={inv.id} className="hover:bg-secondary-50">
              <td className="px-5 py-3">
                <p className="font-medium text-secondary-900">{inv.invoice_number}</p>
                <p className="text-xs text-secondary-400">{new Date(inv.created_at).toLocaleDateString()}</p>
              </td>
              <td className="px-5 py-3 text-secondary-700">{inv.user_name || '-'}</td>
              <td className="px-5 py-3 text-right font-medium text-secondary-900">${(inv.amount / 100).toFixed(2)}</td>
              <td className="px-5 py-3 text-center">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  inv.status === 'paid' ? 'bg-green-50 text-green-700' :
                  inv.status === 'refunded' ? 'bg-orange-50 text-orange-700' :
                  inv.status === 'failed' ? 'bg-red-50 text-red-700' :
                  'bg-secondary-100 text-secondary-600'
                }`}>
                  {inv.status}
                </span>
              </td>
              <td className="px-5 py-3 text-center">
                {inv.status === 'paid' && (
                  <button
                    onClick={() => onAction('refund_invoice', { invoice_id: inv.id })}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Refund
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <p className="px-5 py-8 text-center text-sm text-secondary-400">No invoices yet</p>
      )}
    </div>
  );
}

function EventsTab({ data }: { data: any[] }) {
  if (!data) return null;
  return (
    <div className="bg-white rounded-xl border border-secondary-200">
      <div className="divide-y divide-secondary-50 max-h-[600px] overflow-y-auto">
        {data.map((evt: any) => (
          <div key={evt.id} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                evt.event_type.includes('cancel') ? 'bg-red-50 text-red-700' :
                evt.event_type.includes('created') || evt.event_type.includes('renew') ? 'bg-green-50 text-green-700' :
                evt.event_type.includes('upgrade') ? 'bg-blue-50 text-blue-700' :
                'bg-secondary-100 text-secondary-600'
              }`}>
                {evt.event_type}
              </span>
              <span className="text-sm text-secondary-700">{evt.user_name || 'System'}</span>
              {evt.from_plan_name && evt.to_plan_name && (
                <span className="text-xs text-secondary-400">{evt.from_plan_name} → {evt.to_plan_name}</span>
              )}
            </div>
            <span className="text-xs text-secondary-400">{new Date(evt.created_at).toLocaleString()}</span>
          </div>
        ))}
        {data.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-secondary-400">No events yet</p>
        )}
      </div>
    </div>
  );
}
