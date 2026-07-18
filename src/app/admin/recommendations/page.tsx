'use client';

import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, MousePointer, Heart, XCircle, Loader2, BarChart3 } from 'lucide-react';

interface AnalyticsData {
  overview: { event_type: string; count: number }[];
  dailyMetrics: { date: string; shown: number; clicked: number; saved: number; dismissed: number }[];
  topRecommended: { tool_id: string; name: string; shown: number; clicked: number; ctr: number }[];
  sourceBreakdown: { source: string; count: number }[];
  rates: { clickRate: number; saveRate: number };
}

export default function RecommendationAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/personalization/analytics');
        if (!res.ok) {
          setError(res.status === 403 ? 'Forbidden' : 'Failed to load');
          return;
        }
        setData(await res.json());
      } catch {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const totalShown = data.overview.find(o => o.event_type === 'shown')?.count || 0;
  const totalClicked = data.overview.find(o => o.event_type === 'clicked')?.count || 0;
  const totalSaved = data.overview.find(o => o.event_type === 'saved')?.count || 0;
  const totalDismissed = data.overview.find(o => o.event_type === 'dismissed')?.count || 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Recommendation Analytics</h1>
          <p className="text-sm text-secondary-500">Last 30 days performance</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-secondary-500">Impressions</span>
          </div>
          <p className="text-2xl font-bold text-secondary-900">{totalShown.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <MousePointer className="h-5 w-5 text-green-500" />
            <span className="text-sm text-secondary-500">Click Rate</span>
          </div>
          <p className="text-2xl font-bold text-secondary-900">{data.rates.clickRate}%</p>
          <p className="text-xs text-secondary-400 mt-1">{totalClicked.toLocaleString()} clicks</p>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-5 w-5 text-red-500" />
            <span className="text-sm text-secondary-500">Save Rate</span>
          </div>
          <p className="text-2xl font-bold text-secondary-900">{data.rates.saveRate}%</p>
          <p className="text-xs text-secondary-400 mt-1">{totalSaved.toLocaleString()} saved</p>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-secondary-500">Dismissed</span>
          </div>
          <p className="text-2xl font-bold text-secondary-900">{totalDismissed.toLocaleString()}</p>
        </div>
      </div>

      {/* Daily metrics table */}
      <div className="bg-white rounded-xl border border-secondary-200 mb-8">
        <div className="p-5 border-b border-secondary-100">
          <h2 className="text-base font-semibold text-secondary-900 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary-500" />
            Daily Metrics
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-secondary-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Date</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Shown</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Clicked</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Saved</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-secondary-500 uppercase">Dismissed</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-secondary-500 uppercase">CTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-50">
              {data.dailyMetrics.slice(0, 14).map(day => (
                <tr key={day.date} className="hover:bg-secondary-50">
                  <td className="px-5 py-3 text-secondary-700">{new Date(day.date).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right text-secondary-600">{day.shown}</td>
                  <td className="px-5 py-3 text-right text-secondary-600">{day.clicked}</td>
                  <td className="px-5 py-3 text-right text-secondary-600">{day.saved}</td>
                  <td className="px-5 py-3 text-right text-secondary-600">{day.dismissed}</td>
                  <td className="px-5 py-3 text-right font-medium text-primary-600">
                    {day.shown > 0 ? (day.clicked / day.shown * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Recommended Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-secondary-200">
          <div className="p-5 border-b border-secondary-100">
            <h2 className="text-base font-semibold text-secondary-900">Top Recommended Tools</h2>
          </div>
          <div className="divide-y divide-secondary-50">
            {data.topRecommended.slice(0, 10).map((tool, i) => (
              <div key={tool.tool_id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-secondary-400 font-mono w-5">{i + 1}.</span>
                  <span className="text-sm text-secondary-700">{tool.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-secondary-400">{tool.clicked}/{tool.shown}</span>
                  <span className="text-xs font-medium text-primary-600">{tool.ctr.toFixed(1)}%</span>
                </div>
              </div>
            ))}
            {data.topRecommended.length === 0 && (
              <p className="px-5 py-8 text-center text-secondary-400 text-sm">No data yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200">
          <div className="p-5 border-b border-secondary-100">
            <h2 className="text-base font-semibold text-secondary-900">Source Breakdown</h2>
          </div>
          <div className="divide-y divide-secondary-50">
            {data.sourceBreakdown.map(source => (
              <div key={source.source} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-secondary-700 capitalize">{source.source}</span>
                <span className="text-sm font-medium text-secondary-900">{source.count.toLocaleString()}</span>
              </div>
            ))}
            {data.sourceBreakdown.length === 0 && (
              <p className="px-5 py-8 text-center text-secondary-400 text-sm">No data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
