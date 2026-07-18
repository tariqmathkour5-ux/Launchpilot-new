"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  DollarSign,
  MousePointerClick,
  TrendingUp,
  BarChart3,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

// Merchant Analytics Types
interface MerchantAnalyticsData {
  partner: {
    id: string;
    name: string;
    email: string;
    commission: number;
    status: string;
  };
  totals: {
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    conversionRate: number;
  };
  dailyStats: Array<{
    date: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
  topTools: Array<{
    toolId: string;
    toolName: string;
    toolSlug: string;
    clicks: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
  }>;
}

// Token input form component
function TokenInputForm({ onSubmit }: { onSubmit: (token: string) => void }) {
  const [inputToken, setInputToken] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(inputToken.trim());
  };

  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-6">
            <div className="h-12 w-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900">Merchant Analytics Portal</h1>
            <p className="text-secondary-500 mt-2">Enter your unique access token to view your analytics</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-secondary-700 mb-2">
                Access Token
              </label>
              <input
                id="token"
                type="password"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="Enter your merchant API token"
                className="input w-full"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full">
              Access Analytics
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-secondary-200">
            <p className="text-xs text-secondary-500 text-center">
              Each partner has a unique token. Contact support if you need access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Analytics dashboard component
function AnalyticsDashboard({ data }: { data: MerchantAnalyticsData }) {
  const [refreshing, setRefreshing] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleRefresh = async () => {
    setRefreshing(true);
    // The page will auto-refresh via the useEffect
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  // Format date for display
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Calculate growth percentage
  const calculateGrowth = () => {
    if (data.dailyStats.length < 14) return 0;

    const last7Days = data.dailyStats.slice(0, 7).reduce((sum, d) => sum + d.revenue, 0);
    const prev7Days = data.dailyStats.slice(7, 14).reduce((sum, d) => sum + d.revenue, 0);

    if (prev7Days === 0) return last7Days > 0 ? 100 : 0;
    return ((last7Days - prev7Days) / prev7Days) * 100;
  };

  const growth = calculateGrowth();
  const isPositiveGrowth = growth >= 0;

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">Merchant Analytics</h1>
              <p className="text-secondary-500 mt-1">
                Welcome, {data.partner.name} • Real-time performance metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-secondary-500">Commission: {data.partner.commission}%</span>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="btn btn-secondary btn-sm"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5 text-success-600" />
              <span className="text-sm font-medium text-secondary-500">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-secondary-900">
              ${data.totals.totalRevenue.toFixed(2)}
            </p>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <MousePointerClick className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-medium text-secondary-500">Total Clicks</span>
            </div>
            <p className="text-2xl font-bold text-secondary-900">
              {data.totals.totalClicks.toLocaleString()}
            </p>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-accent-600" />
              <span className="text-sm font-medium text-secondary-500">Conversions</span>
            </div>
            <p className="text-2xl font-bold text-secondary-900">
              {data.totals.totalConversions.toLocaleString()}
            </p>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-5 w-5 text-secondary-600" />
              <span className="text-sm font-medium text-secondary-500">Conversion Rate</span>
            </div>
            <p className="text-2xl font-bold text-secondary-900">
              {data.totals.conversionRate.toFixed(1)}%
            </p>
            {data.dailyStats.length >= 14 && (
              <p className={`text-xs mt-1 ${isPositiveGrowth ? "text-success-600" : "text-error-600"}`}>
                {isPositiveGrowth ? "+" : ""}{Math.round(growth)}% from last week
              </p>
            )}
          </div>
        </div>

        {/* Top Performing Tools */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-secondary-900">Your Top Performing Tools</h2>
              <p className="text-sm text-secondary-500">Performance breakdown by tool</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-secondary-500">Tool</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-secondary-500">Clicks</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-secondary-500">Conversions</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-secondary-500">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-secondary-500">Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.topTools.length > 0 ? (
                  data.topTools.map((tool) => (
                    <tr key={tool.toolId} className="border-b border-secondary-100 hover:bg-secondary-50">
                      <td className="py-3 px-4">
                        <Link
                          href={`/tools/${tool.toolSlug}`}
                          className="font-medium text-secondary-900 hover:text-primary-600 flex items-center gap-2"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {tool.toolName}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right text-secondary-600">
                        {tool.clicks.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-secondary-600">
                        {tool.conversions.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-success-600">
                        ${tool.revenue.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`text-sm font-medium ${
                          tool.conversionRate >= 2 ? "text-success-600" : 
                          tool.conversionRate >= 1 ? "text-warning-600" : 
                          "text-secondary-600"
                        }`}>
                          {tool.conversionRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-secondary-500">
                      No tools with activity yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="card p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <h2 className="text-xl font-bold text-secondary-900">Revenue Trend (30 Days)</h2>
          </div>

          <div className="h-64">
            {data.dailyStats.length > 0 ? (
              <div className="space-y-4">
                {/* Simple bar chart */}
                <div className="flex items-end justify-between h-48 gap-1 overflow-x-auto">
                  {data.dailyStats.map((day, index) => {
                    const maxRevenue = Math.max(...data.dailyStats.map(d => d.revenue));
                    const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;

                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center flex-1 min-w-8"
                        title={`${formatDate(day.date)}: $${day.revenue.toFixed(2)}`}
                      >
                        <div
                          className={`w-full rounded-t ${height > 0 ? "bg-primary-500" : "bg-secondary-200"}`}
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                        <span className="text-xs text-secondary-400 mt-1 transform rotate-45 origin-top whitespace-nowrap">
                          {formatDate(day.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-xs text-secondary-500">
                  <span>30 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-secondary-500">No revenue data for the last 30 days</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <h3 className="text-sm font-medium text-secondary-500 mb-2">Account Status</h3>
            <p className="text-2xl font-bold text-secondary-900 capitalize">{data.partner.status}</p>
            <p className="text-sm text-secondary-400">Your account is {data.partner.status.toLowerCase()}</p>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-medium text-secondary-500 mb-2">Total Revenue (30d)</h3>
            <p className="text-2xl font-bold text-secondary-900">
              ${data.dailyStats.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)}
            </p>
            <p className="text-sm text-secondary-400">
              From {data.dailyStats.reduce((sum, d) => sum + d.clicks, 0)} clicks
            </p>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-medium text-secondary-500 mb-2">Best Performing Tool</h3>
            {data.topTools[0] ? (
              <>
                <p className="text-2xl font-bold text-secondary-900">{data.topTools[0].toolName}</p>
                <p className="text-sm text-success-600">${data.topTools[0].revenue.toFixed(2)} revenue</p>
              </>
            ) : (
              <p className="text-secondary-400">No data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component with token validation
export default function MerchantAnalyticsPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MerchantAnalyticsData | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

  // Fetch analytics data
  fetch(`/api/admin/merchant-analytics?token=${encodeURIComponent(token)}`)
    .then((res) => {
        if (!res.ok) {
          throw new Error("Invalid token");
        }
        return res.json();
      })
      .then((jsonData) => {
        setData(jsonData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("Invalid or expired token. Please check your access token.");
        setLoading(false);
      });
  }, [token]);

  // Show token input form if no token
  if (!token) {
    return (
      <TokenInputForm
        onSubmit={(newToken) => {
          const url = new URL(window.location.href);
          url.searchParams.set("token", newToken);
          window.history.replaceState({}, "", url.toString());
          window.location.reload();
        }}
      />
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-secondary-600">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-error-600" />
              <h2 className="text-lg font-semibold text-secondary-900">Access Denied</h2>
            </div>
            <p className="text-secondary-600 mb-6">{error}</p>
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete("token");
                window.history.replaceState({}, "", url.toString());
                window.location.reload();
              }}
              className="btn btn-primary w-full"
            >
              Try Different Token
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show analytics dashboard
  if (data) {
    return <AnalyticsDashboard data={data} />;
  }

  return null;
}