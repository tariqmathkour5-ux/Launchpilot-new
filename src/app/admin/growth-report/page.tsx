'use client';

import { RefreshCw, BarChart3, Users, MessageSquare, DollarSign, MousePointerClick } from "lucide-react";
import { useEffect, useState } from "react";

interface DailyReport {
  activeUsers?: number;
  newUsers?: number;
  totalUsers?: number;
  reviewsSubmitted?: number;
  averageRating?: number;
  totalRevenue?: number;
  totalConversions?: number;
  totalAffiliateClicks?: number;
  toolsViewed?: number;
  topTools?: Array<{ slug: string; views: number }>;
  dbBackups?: number;
}

interface LatestReport {
  date: string;
  generatedAt: string;
  metrics: DailyReport;
}

export default function GrowthReportPage() {
  const [report, setReport] = useState<LatestReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/admin/growth-report');
        if (response.ok) {
          const data = await response.json();
          setReport(data);
        } else {
          setError('Failed to load report');
        }
      } catch (e) {
        setError('Error loading report');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-secondary-500">Loading report...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-secondary-500">No report data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-secondary-900">Growth Automation Report</h1>
        </div>
        <p className="text-secondary-500">Daily performance and user activity summary</p>
      </div>

      {/* Report Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-primary-600" />
            <h3 className="text-sm font-medium text-secondary-500">Total Users</h3>
          </div>
          <p className="text-2xl font-bold text-secondary-900">
            {report.metrics.totalUsers?.toLocaleString() || 0}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="h-5 w-5 text-accent-600" />
            <h3 className="text-sm font-medium text-secondary-500">Reviews (24h)</h3>
          </div>
          <p className="text-2xl font-bold text-secondary-900">
            {report.metrics.reviewsSubmitted?.toLocaleString() || 0}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-success-600" />
            <h3 className="text-sm font-medium text-secondary-500">Revenue (24h)</h3>
          </div>
          <p className="text-2xl font-bold text-success-600">
            ${(report.metrics.totalRevenue || 0).toFixed(2)}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <MousePointerClick className="h-5 w-5 text-warning-600" />
            <h3 className="text-sm font-medium text-secondary-500">Affiliate Clicks (24h)</h3>
          </div>
          <p className="text-2xl font-bold text-secondary-900">
            {report.metrics.totalAffiliateClicks?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Latest Report Content */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-secondary-900">Latest Report</h2>
            <p className="text-sm text-secondary-500">
              Generated: {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'N/A'}
            </p>
          </div>
          <button
            className="btn btn-secondary flex items-center gap-2"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="bg-secondary-50 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-secondary-800 whitespace-pre-wrap font-mono">
            {generateTextReport(report)}
          </pre>
        </div>
      </div>
    </div>
  );
}

function generateTextReport(report: LatestReport | null): string {
  if (!report) return "No report data available";
  
  const lines: string[] = [
    "============================================================",
    "GROWTH AUTOMATION - DAILY PERFORMANCE REPORT",
    "============================================================",
    "",
    `Date: ${report.date}`,
    `Generated At: ${report.generatedAt}`,
    "",
    "------------------------------------------------------------",
    "USER ACTIVITY",
    "------------------------------------------------------------",
    `Total Users: ${report.metrics.totalUsers?.toLocaleString() || 0}`,
    `New Users (24h): ${report.metrics.newUsers?.toLocaleString() || 0}`,
    `Active Users (Est): ${report.metrics.activeUsers?.toLocaleString() || 0}`,
    "",
    "------------------------------------------------------------",
    "REVIEWS & ENGAGEMENT",
    "------------------------------------------------------------",
    `Reviews Submitted: ${report.metrics.reviewsSubmitted?.toLocaleString() || 0}`,
    `Average Rating: ${(report.metrics.averageRating || 0).toFixed(1)} / 5`,
    `Tool Views: ${report.metrics.toolsViewed?.toLocaleString() || 0}`,
    "",
    "------------------------------------------------------------",
    "REVENUE & AFFILIATES",
    "------------------------------------------------------------",
    `Total Revenue: $${(report.metrics.totalRevenue || 0).toFixed(2)}`,
    `Conversions: ${report.metrics.totalConversions?.toLocaleString() || 0}`,
    `Affiliate Clicks: ${report.metrics.totalAffiliateClicks?.toLocaleString() || 0}`,
    "",
    "------------------------------------------------------------",
    "TOP TOOLS (Views)",
    "------------------------------------------------------------",
    ...(report.metrics.topTools || []).map((t, i) => 
      `${i + 1}. /tools/${t.slug} - ${t.views.toLocaleString()} views`
    ),
    "",
    "------------------------------------------------------------",
    "SYSTEM",
    "------------------------------------------------------------",
    `Database Backups: ${report.metrics.dbBackups?.toLocaleString() || 0}`,
    "",
    "============================================================",
    "END OF REPORT",
    "============================================================",
  ];

  return lines.join("\n");
}