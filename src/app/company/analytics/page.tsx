'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Eye, MousePointerClick, Star, Megaphone, UserCheck, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';

interface AnalyticsData {
  stats: {
    totalTools: number; publishedTools: number; pendingTools: number; featuredTools: number;
    totalReviews: number; avgRating: number | null; activeCampaigns: number; totalCampaigns: number;
    teamMembers: number; totalLeads: number; convertedLeads: number; verificationStatus: string;
  };
  tools: Array<{ id: string; name: string; slug: string; published: boolean; rating: number | null }>;
  reviewStats: Array<{ tool_id: string; count: number; avg_rating: number }>;
  leadStats: Array<{ status: string; count: number }>;
  campaignStats: Array<{ id: string; title: string; clicks: number; impressions: number; status: string }>;
}

function KpiCard({ icon: Icon, label, value, sub, trend, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  trend?: { value: number; label: string }; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-secondary-500">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-secondary-900">{value}</p>
      {sub && <p className="text-xs text-secondary-400 mt-1">{sub}</p>}
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trend.value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend.value >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-secondary-600 w-32 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-secondary-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium text-secondary-700 w-12 text-right">{value}</span>
    </div>
  );
}

const LEAD_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500', contacted: 'bg-amber-500', qualified: 'bg-green-500',
  converted: 'bg-primary-500', lost: 'bg-secondary-300',
};

export default function CompanyAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [analyticsRes, campaignsRes] = await Promise.all([
          fetch('/api/company/analytics'),
          fetch('/api/company/campaigns'),
        ]);
        if (analyticsRes.ok) {
          const analytics = await analyticsRes.json();
          const campaigns = campaignsRes.ok ? (await campaignsRes.json()).campaigns ?? [] : [];
          setData({ ...analytics, campaignStats: campaigns });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary-500" /></div>;
  }

  if (!data) {
    return <div className="flex justify-center py-20 text-secondary-400">Unable to load analytics.</div>;
  }

  const { stats, tools, reviewStats, leadStats, campaignStats = [] } = data;

  const totalLeadsByStatus = leadStats.reduce((s, l) => s + l.count, 0);
  const conversionRate = stats.totalLeads > 0 ? ((stats.convertedLeads / stats.totalLeads) * 100).toFixed(1) : '0';

  const totalCampaignClicks = campaignStats.reduce((s, c) => s + c.clicks, 0);
  const totalCampaignImpressions = campaignStats.reduce((s, c) => s + c.impressions, 0);
  const overallCtr = totalCampaignImpressions > 0 ? ((totalCampaignClicks / totalCampaignImpressions) * 100).toFixed(2) : '0';

  const maxReviews = Math.max(...reviewStats.map(r => r.count), 1);
  const maxClicks = Math.max(...campaignStats.map(c => c.clicks), 1);

  const toolReviewMap = Object.fromEntries(reviewStats.map(r => [r.tool_id, r]));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Analytics Overview</h1>
        <p className="text-sm text-secondary-500 mt-0.5">Performance metrics across all your tools and campaigns</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={BarChart3} label="Published Tools" value={stats.publishedTools}
          sub={`${stats.pendingTools} pending approval`} color="text-primary-600 bg-primary-50" />
        <KpiCard icon={Star} label="Avg Rating" value={stats.avgRating ? `${stats.avgRating.toFixed(1)}/5` : '—'}
          sub={`${stats.totalReviews} total reviews`} color="text-amber-600 bg-amber-50" />
        <KpiCard icon={Megaphone} label="Active Campaigns" value={stats.activeCampaigns}
          sub={`${stats.totalCampaigns} total`} color="text-green-600 bg-green-50" />
        <KpiCard icon={UserCheck} label="Conversion Rate" value={`${conversionRate}%`}
          sub={`${stats.convertedLeads} of ${stats.totalLeads} leads`} color="text-blue-600 bg-blue-50" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={Eye} label="Campaign Impressions" value={totalCampaignImpressions.toLocaleString()}
          color="text-secondary-600 bg-secondary-100" />
        <KpiCard icon={MousePointerClick} label="Campaign Clicks" value={totalCampaignClicks.toLocaleString()}
          color="text-primary-600 bg-primary-50" />
        <KpiCard icon={TrendingUp} label="Overall CTR" value={`${overallCtr}%`}
          sub="click-through rate" color="text-green-600 bg-green-50" />
        <KpiCard icon={BarChart3} label="Team Members" value={stats.teamMembers}
          color="text-secondary-600 bg-secondary-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Tool Performance */}
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <h2 className="font-semibold text-secondary-900 mb-5">Tool Performance</h2>
          {tools.length === 0 ? (
            <p className="text-sm text-secondary-400 text-center py-6">No tools yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-secondary-500 border-b border-secondary-100">
                    <th className="pb-2 font-medium">Tool</th>
                    <th className="pb-2 font-medium text-right">Reviews</th>
                    <th className="pb-2 font-medium text-right">Avg Rating</th>
                    <th className="pb-2 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-50">
                  {tools.slice(0, 8).map(tool => {
                    const rs = toolReviewMap[tool.id];
                    return (
                      <tr key={tool.id} className="hover:bg-secondary-50 transition-colors">
                        <td className="py-2.5 font-medium text-secondary-800">{tool.name}</td>
                        <td className="py-2.5 text-right text-secondary-600">{rs?.count ?? 0}</td>
                        <td className="py-2.5 text-right">
                          {rs?.avg_rating ? (
                            <span className="inline-flex items-center gap-0.5 text-amber-600">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {Number(rs.avg_rating).toFixed(1)}
                            </span>
                          ) : <span className="text-secondary-300">—</span>}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${tool.published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {tool.published ? 'Live' : 'Draft'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Review Distribution */}
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <h2 className="font-semibold text-secondary-900 mb-5">Reviews by Tool</h2>
          {reviewStats.length === 0 ? (
            <p className="text-sm text-secondary-400 text-center py-6">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviewStats.slice(0, 8).map(rs => {
                const tool = tools.find(t => t.id === rs.tool_id);
                return (
                  <BarRow
                    key={rs.tool_id}
                    label={tool?.name || 'Unknown'}
                    value={rs.count}
                    max={maxReviews}
                    color="bg-amber-400"
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Pipeline */}
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <h2 className="font-semibold text-secondary-900 mb-5">Lead Pipeline</h2>
          {leadStats.length === 0 ? (
            <p className="text-sm text-secondary-400 text-center py-6">No leads yet.</p>
          ) : (
            <>
              <div className="flex gap-1 h-4 rounded-full overflow-hidden mb-4">
                {leadStats.map(ls => (
                  <div
                    key={ls.status}
                    className={`${LEAD_STATUS_COLORS[ls.status] || 'bg-secondary-300'} transition-all`}
                    style={{ width: `${(ls.count / totalLeadsByStatus) * 100}%` }}
                    title={`${ls.status}: ${ls.count}`}
                  />
                ))}
              </div>
              <div className="space-y-2.5">
                {leadStats.map(ls => (
                  <div key={ls.status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${LEAD_STATUS_COLORS[ls.status] || 'bg-secondary-300'}`} />
                      <span className="text-secondary-600 capitalize">{ls.status}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-secondary-400">{totalLeadsByStatus > 0 ? Math.round((ls.count / totalLeadsByStatus) * 100) : 0}%</span>
                      <span className="font-semibold text-secondary-900 w-8 text-right">{ls.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Campaign Performance */}
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <h2 className="font-semibold text-secondary-900 mb-5">Campaign Performance</h2>
          {campaignStats.length === 0 ? (
            <p className="text-sm text-secondary-400 text-center py-6">No campaigns yet.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 p-3 bg-secondary-50 rounded-lg text-center mb-2">
                <div>
                  <p className="text-lg font-bold text-secondary-900">{totalCampaignImpressions.toLocaleString()}</p>
                  <p className="text-xs text-secondary-500">Impressions</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-secondary-900">{totalCampaignClicks.toLocaleString()}</p>
                  <p className="text-xs text-secondary-500">Clicks</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-primary-600">{overallCtr}%</p>
                  <p className="text-xs text-secondary-500">CTR</p>
                </div>
              </div>
              <div className="space-y-3">
                {campaignStats.slice(0, 5).map(c => (
                  <BarRow key={c.id} label={c.title} value={c.clicks} max={maxClicks} color="bg-primary-400" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
