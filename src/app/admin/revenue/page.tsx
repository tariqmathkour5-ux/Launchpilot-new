'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, BarChart3, PieChart, ArrowUpRight,
  Loader2, RefreshCw, Wallet, CreditCard, MousePointerClick,
  Star, Users, ArrowDownRight
} from 'lucide-react';

type Tab = 'overview' | 'breakdown' | 'payouts' | 'metrics';

export default function RevenueDashboardPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [payouts, setPayouts] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => { loadData(); }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const [s, b] = await Promise.all([
          fetch('/api/admin/revenue?view=summary').then(r => r.ok ? r.json() : null),
          fetch('/api/admin/revenue?view=breakdown').then(r => r.ok ? r.json() : null),
        ]);
        setSummary(s);
        setBreakdown(b);
      } else if (tab === 'payouts') {
        const p = await fetch('/api/admin/revenue?view=payouts').then(r => r.ok ? r.json() : null);
        setPayouts(p);
      } else if (tab === 'metrics') {
        const m = await fetch('/api/admin/revenue?view=metrics').then(r => r.ok ? r.json() : null);
        setMetrics(m);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Revenue Overview', icon: BarChart3 },
    { key: 'breakdown', label: 'Revenue Breakdown', icon: PieChart },
    { key: 'payouts', label: 'Affiliate Payouts', icon: Wallet },
    { key: 'metrics', label: 'Financial Metrics', icon: TrendingUp },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Revenue Dashboard</h1>
            <p className="text-sm text-secondary-500">Financial overview, payouts, and key metrics</p>
          </div>
        </div>
        <button onClick={loadData} className="btn btn-secondary text-sm flex items-center gap-1">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
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
          {tab === 'overview' && summary && <OverviewTab summary={summary} breakdown={breakdown} />}
          {tab === 'breakdown' && breakdown && <BreakdownTab data={breakdown} />}
          {tab === 'payouts' && <PayoutsTab data={payouts} />}
          {tab === 'metrics' && metrics && <MetricsTab data={metrics} />}
        </>
      )}
    </div>
  );
}

function OverviewTab({ summary, breakdown }: { summary: any; breakdown: any }) {
  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={DollarSign}
          label="Total Revenue (30d)"
          value={`$${(summary.totalRevenue / 100).toFixed(2)}`}
          sub={`${summary.totalTransactions} transactions`}
          color="text-green-600 bg-green-50"
        />
        <MetricCard
          icon={TrendingUp}
          label="Monthly Recurring Revenue"
          value={`$${(summary.mrr / 100).toFixed(0)}`}
          sub={`ARR: $${(summary.arr / 100).toFixed(0)}`}
          color="text-blue-600 bg-blue-50"
        />
        <MetricCard
          icon={CreditCard}
          label="Subscription Revenue"
          value={`$${((breakdown?.subscriptionRevenue || 0) / 100).toFixed(2)}`}
          sub={`${breakdown?.subscriptionShare?.toFixed(1) || 0}% of total`}
          color="text-primary-600 bg-primary-50"
        />
        <MetricCard
          icon={MousePointerClick}
          label="Affiliate Revenue"
          value={`$${((breakdown?.affiliateRevenue || 0) / 100).toFixed(2)}`}
          sub={`${breakdown?.affiliateShare?.toFixed(1) || 0}% of total`}
          color="text-purple-600 bg-purple-50"
        />
      </div>

      {/* Revenue by Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-secondary-200">
          <div className="p-5 border-b border-secondary-100">
            <h3 className="text-sm font-semibold text-secondary-900">Revenue by Source</h3>
          </div>
          <div className="divide-y divide-secondary-50">
            {Object.entries(summary.revenueByType || {}).map(([type, amount]: [string, any]) => (
              <div key={type} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm font-medium text-secondary-900 capitalize">
                  {type.replace(/_/g, ' ').toLowerCase()}
                </span>
                <span className="text-sm font-semibold text-secondary-900">
                  ${(amount / 100).toFixed(2)}
                </span>
              </div>
            ))}
            {(!summary.revenueByType || Object.keys(summary.revenueByType).length === 0) && (
              <p className="px-5 py-6 text-center text-sm text-secondary-400">No revenue data yet</p>
            )}
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-xl border border-secondary-200">
          <div className="p-5 border-b border-secondary-100">
            <h3 className="text-sm font-semibold text-secondary-900">Monthly Revenue</h3>
          </div>
          <div className="p-5">
            {summary.revenueByMonth && summary.revenueByMonth.length > 0 ? (
              <div className="space-y-3">
                {summary.revenueByMonth.map((m: any) => (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className="text-xs text-secondary-500 w-16">{m.month}</span>
                    <div className="flex-1 bg-secondary-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-primary-500 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            (m.amount / Math.max(...summary.revenueByMonth.map((x: any) => x.amount))) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-secondary-700 w-20 text-right">
                      ${(m.amount / 100).toFixed(0)}
                    </span>
                    <span className="text-xs text-secondary-400 w-8 text-right">{m.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-secondary-400 py-6">No monthly data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-secondary-200">
        <div className="p-5 border-b border-secondary-100">
          <h3 className="text-sm font-semibold text-secondary-900">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-secondary-50 max-h-80 overflow-y-auto">
          {summary.recentTransactions && summary.recentTransactions.length > 0 ? (
            summary.recentTransactions.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    t.type === 'SUBSCRIPTION' ? 'bg-blue-50 text-blue-700' :
                    t.type === 'AFFILIATE_EARNING' ? 'bg-purple-50 text-purple-700' :
                    t.type === 'AD_REVENUE' ? 'bg-green-50 text-green-700' :
                    t.type === 'FEATURED_LISTING' ? 'bg-orange-50 text-orange-700' :
                    'bg-secondary-100 text-secondary-600'
                  }`}>
                    {t.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-secondary-700 truncate max-w-xs">
                    {t.description || 'Transaction'}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-semibold ${
                    t.amount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {t.amount >= 0 ? '+' : ''}${(t.amount / 100).toFixed(2)}
                  </span>
                  <p className="text-xs text-secondary-400">
                    {new Date(t.transactionDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="px-5 py-6 text-center text-sm text-secondary-400">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

function BreakdownTab({ data }: { data: any }) {
  const items = [
    { label: 'Affiliate Revenue', value: data.affiliateRevenue, share: data.affiliateShare, color: 'bg-purple-500' },
    { label: 'Subscription Revenue', value: data.subscriptionRevenue, share: data.subscriptionShare, color: 'bg-blue-500' },
    { label: 'Ad Revenue', value: data.adRevenue, share: data.adShare, color: 'bg-green-500' },
    { label: 'Featured Listings', value: data.featuredListingRevenue, share: data.featuredShare, color: 'bg-orange-500' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <h3 className="text-sm font-semibold text-secondary-900 mb-4">Revenue Distribution</h3>
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.label}>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-secondary-700">{item.label}</span>
                <span className="text-sm font-medium text-secondary-900">
                  ${(item.value / 100).toFixed(2)} ({item.share.toFixed(1)}%)
                </span>
              </div>
              <div className="bg-secondary-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`${item.color} h-full rounded-full transition-all`}
                  style={{ width: `${Math.min(item.share, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <h3 className="text-sm font-semibold text-secondary-900 mb-4">Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-secondary-100">
            <span className="text-sm text-secondary-600">Total Revenue (30d)</span>
            <span className="text-lg font-bold text-secondary-900">${(data.totalRevenue / 100).toFixed(2)}</span>
          </div>
          {items.map(item => (
            <div key={item.label} className="flex justify-between py-1">
              <span className="text-sm text-secondary-600">{item.label}</span>
              <span className="text-sm font-medium text-secondary-900">${(item.value / 100).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PayoutsTab({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <MetricCard
          icon={Wallet}
          label="Pending Payouts"
          value={`$${(data.totalPendingPayouts / 100).toFixed(2)}`}
          sub={`${data.pendingPayouts?.length || 0} partners awaiting payment`}
          color="text-orange-600 bg-orange-50"
        />
        <MetricCard
          icon={DollarSign}
          label="Total Paid Out"
          value={`$${(data.totalPaidPayouts / 100).toFixed(2)}`}
          color="text-green-600 bg-green-50"
        />
      </div>

      <div className="bg-white rounded-xl border border-secondary-200">
        <div className="p-5 border-b border-secondary-100">
          <h3 className="text-sm font-semibold text-secondary-900">Pending Affiliate Payouts</h3>
        </div>
        {data.pendingPayouts && data.pendingPayouts.length > 0 ? (
          <div className="divide-y divide-secondary-50">
            {data.pendingPayouts.map((p: any) => (
              <div key={p.partnerId} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-secondary-900">{p.partnerName}</p>
                  <p className="text-xs text-secondary-400">{p.partnerEmail}</p>
                </div>
                <span className="text-sm font-semibold text-secondary-900">
                  ${(p.amount / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-secondary-400">No pending payouts</p>
        )}
      </div>
    </div>
  );
}

function MetricsTab({ data }: { data: any }) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={TrendingUp} label="MRR" value={`$${(data.mrr / 100).toFixed(0)}`} sub={`ARR: $${(data.arr / 100).toFixed(0)}`} color="text-blue-600 bg-blue-50" />
        <MetricCard icon={Users} label="Avg Revenue/User" value={`$${(data.averageRevenuePerUser / 100).toFixed(2)}`} sub="Monthly" color="text-primary-600 bg-primary-50" />
        <MetricCard icon={ArrowDownRight} label="Churn Rate" value={`${data.churnRate}%`} sub="Monthly" color="text-red-600 bg-red-50" />
        <MetricCard icon={Star} label="LTV" value={`$${(data.ltv / 100).toFixed(0)}`} sub="Customer Lifetime Value" color="text-green-600 bg-green-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="text-sm font-semibold text-secondary-900 mb-4">Key Metrics</h3>
          <div className="space-y-4">
            <MetricRow label="Gross Margin" value={`${data.grossMargin}%`} />
            <MetricRow label="CAC" value={data.cac > 0 ? `$${data.cac}` : 'N/A'} />
            <MetricRow label="Payback Period" value={data.paybackPeriod > 0 ? `${data.paybackPeriod} months` : 'N/A'} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="text-sm font-semibold text-secondary-900 mb-4">Health Indicators</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${data.churnRate < 5 ? 'bg-green-500' : data.churnRate < 10 ? 'bg-yellow-500' : 'bg-red-500'}`} />
              <span className="text-sm text-secondary-700">Churn Rate: {data.churnRate < 5 ? 'Healthy' : data.churnRate < 10 ? 'Warning' : 'Critical'}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${data.mrr > 0 ? 'bg-green-500' : 'bg-secondary-300'}`} />
              <span className="text-sm text-secondary-700">Revenue Generation: {data.mrr > 0 ? 'Active' : 'No revenue yet'}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${data.ltv > 0 ? 'bg-green-500' : 'bg-secondary-300'}`} />
              <span className="text-sm text-secondary-700">LTV Tracking: {data.ltv > 0 ? 'Active' : 'Insufficient data'}</span>
            </div>
          </div>
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

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-secondary-50">
      <span className="text-sm text-secondary-600">{label}</span>
      <span className="text-sm font-medium text-secondary-900">{value}</span>
    </div>
  );
}