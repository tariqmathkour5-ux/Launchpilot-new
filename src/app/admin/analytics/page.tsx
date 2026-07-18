"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  Eye,
  MousePointerClick,
  Users,
  Building2,
  DollarSign,
  Mail,
  Search,
  ShoppingBag,
  Globe,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import StatsCard from "@/components/admin/StatsCard";
import { SimpleLineChart, SimpleBarChart, SimplePieChart, StackedAreaChart, COLORS } from "@/components/admin/Charts";
import AnalyticsFilters from "@/components/admin/AnalyticsFilters";

type TabType = "executive" | "traffic" | "search" | "tools" | "affiliate" | "company" | "newsletter" | "revenue";

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "executive", label: "Executive", icon: BarChart3 },
  { id: "traffic", label: "Traffic", icon: Globe },
  { id: "search", label: "Search", icon: Search },
  { id: "tools", label: "Tools", icon: ShoppingBag },
  { id: "affiliate", label: "Affiliate", icon: DollarSign },
  { id: "company", label: "Company", icon: Building2 },
  { id: "newsletter", label: "Newsletter", icon: Mail },
  { id: "revenue", label: "Revenue", icon: TrendingUp },
];

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>(tabParam && TABS.some(t => t.id === tabParam) ? tabParam : "executive");
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

  const [executiveData, setExecutiveData] = useState<Record<string, unknown> | null>(null);
  const [trafficData, setTrafficData] = useState<Record<string, unknown> | null>(null);
  const [searchData, setSearchData] = useState<Record<string, unknown> | null>(null);
  const [toolsData, setToolsData] = useState<Record<string, unknown> | null>(null);
  const [affiliateData, setAffiliateData] = useState<Record<string, unknown> | null>(null);
  const [companyData, setCompanyData] = useState<Record<string, unknown> | null>(null);
  const [newsletterData, setNewsletterData] = useState<Record<string, unknown> | null>(null);
  const [revenueData, setRevenueData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (tabParam && TABS.some(t => t.id === tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    fetchActiveTabData();
  }, [activeTab, dateRange]);

  const fetchActiveTabData = async () => {
    const params = new URLSearchParams();
    if (dateRange.startDate) params.set("startDate", dateRange.startDate);
    if (dateRange.endDate) params.set("endDate", dateRange.endDate);

    setIsLoading(true);
    try {
      const endpoint = `/api/admin/analytics/${activeTab}`;
      const res = await fetch(`${endpoint}?${params}`);
      if (res.ok) {
        const data = await res.json();
        switch (activeTab) {
          case "executive":
            setExecutiveData(data);
            break;
          case "traffic":
            setTrafficData(data);
            break;
          case "search":
            setSearchData(data);
            break;
          case "tools":
            setToolsData(data);
            break;
          case "affiliate":
            setAffiliateData(data);
            break;
          case "company":
            setCompanyData(data);
            break;
          case "newsletter":
            setNewsletterData(data);
            break;
          case "revenue":
            setRevenueData(data);
            break;
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${activeTab} analytics:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filters: { startDate: string; endDate: string }) => {
    setDateRange({ startDate: filters.startDate, endDate: filters.endDate });
  };

  const handleExport = async (format: string) => {
    const params = new URLSearchParams();
    params.set("format", format);
    params.set("tab", activeTab);
    if (dateRange.startDate) params.set("startDate", dateRange.startDate);
    if (dateRange.endDate) params.set("endDate", dateRange.endDate);

    window.open(`/api/admin/analytics/export?${params}`, "_blank");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Enterprise Analytics</h1>
        <p className="text-secondary-500 mt-1">Comprehensive business intelligence and insights</p>
      </div>

      <AnalyticsFilters
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        showCategoryFilter={activeTab === "tools"}
        showCompanyFilter={activeTab === "company"}
        showCountryFilter={activeTab === "traffic"}
        showDeviceFilter={activeTab === "traffic" || activeTab === "search"}
      />

      <div className="border-b border-secondary-200">
        <nav className="flex space-x-4 overflow-x-auto" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          {activeTab === "executive" && executiveData && (
            <ExecutiveDashboard data={executiveData} formatCurrency={formatCurrency} formatNumber={formatNumber} />
          )}
          {activeTab === "traffic" && trafficData && (
            <TrafficAnalytics data={trafficData} formatNumber={formatNumber} />
          )}
          {activeTab === "search" && searchData && (
            <SearchAnalytics data={searchData} formatNumber={formatNumber} />
          )}
          {activeTab === "tools" && toolsData && (
            <ToolsAnalytics data={toolsData} formatCurrency={formatCurrency} formatNumber={formatNumber} />
          )}
          {activeTab === "affiliate" && affiliateData && (
            <AffiliateAnalytics data={affiliateData} formatCurrency={formatCurrency} formatNumber={formatNumber} />
          )}
          {activeTab === "company" && companyData && (
            <CompanyAnalytics data={companyData} formatNumber={formatNumber} />
          )}
          {activeTab === "newsletter" && newsletterData && (
            <NewsletterAnalytics data={newsletterData} formatNumber={formatNumber} />
          )}
          {activeTab === "revenue" && revenueData && (
            <RevenueDashboard data={revenueData} formatCurrency={formatCurrency} formatNumber={formatNumber} />
          )}
        </>
      )}
    </div>
  );
}

function ExecutiveDashboard({
  data,
  formatCurrency,
  formatNumber,
}: {
  data: Record<string, unknown>;
  formatCurrency: (v: number) => string;
  formatNumber: (v: number) => string;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Visitors" value={formatNumber(data.totalVisitors as number)} icon={Eye} color="primary" />
        <StatsCard title="Registered Users" value={formatNumber(data.registeredUsers as number)} icon={Users} color="accent" />
        <StatsCard title="Registered Companies" value={formatNumber(data.registeredCompanies as number)} icon={Building2} color="secondary" />
        <StatsCard title="Published AI Tools" value={formatNumber(data.publishedTools as number)} icon={ShoppingBag} color="primary" />
        <StatsCard title="Affiliate Clicks" value={formatNumber(data.affiliateClicks as number)} icon={MousePointerClick} color="accent" />
        <StatsCard title="Newsletter Subscribers" value={formatNumber(data.newsletterSubscribers as number)} icon={Mail} color="secondary" />
        <StatsCard title="Monthly Revenue" value={formatCurrency(data.monthlyRevenue as number)} icon={DollarSign} color="accent" />
        <StatsCard title="Conversion Rate" value={`${data.conversionRate}%`} icon={TrendingUp} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Revenue Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-secondary-600">Estimated Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.estimatedRevenue as number)}</p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-secondary-600">Tool Views</p>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(data.toolViews as number)}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Key Metrics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-secondary-600">Total Visitors</span>
              <span className="font-semibold">{formatNumber(data.totalVisitors as number)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary-600">Affiliate Clicks</span>
              <span className="font-semibold">{formatNumber(data.affiliateClicks as number)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary-600">Conversion Rate</span>
              <span className="font-semibold">{String(data.conversionRate)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary-600">Monthly Revenue</span>
              <span className="font-semibold">{formatCurrency(data.monthlyRevenue as number)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrafficAnalytics({ data, formatNumber }: { data: Record<string, unknown>; formatNumber: (v: number) => string }) {
  const dailyData = (data.dailyVisitors as Array<{ date: string; count: number }>) || [];
  const weeklyData = (data.weeklyVisitors as Array<{ week: string; count: number }>) || [];
  const countryData = (data.visitsByCountry as Array<{ country: string; count: number }>) || [];
  const deviceData = (data.visitsByDevice as Array<{ device: string; count: number }>) || [];
  const sourceData = (data.visitsBySource as Array<{ source: string; count: number }>) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard title="Returning Visitors" value={formatNumber(data.returningVisitors as number)} icon={Users} color="primary" />
        <StatsCard title="New Visitors" value={formatNumber(data.newVisitors as number)} icon={TrendingUp} color="accent" />
        <StatsCard title="Daily Avg" value={formatNumber(dailyData.length > 0 ? Math.round(dailyData.reduce((a, b) => a + b.count, 0) / dailyData.length) : 0)} icon={Calendar} color="secondary" />
        <StatsCard title="Countries" value={formatNumber(countryData.length)} icon={Globe} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Daily Visitors</h3>
          <SimpleLineChart data={dailyData} dataKey="count" name="Visitors" />
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Weekly Visitors</h3>
          <SimpleBarChart data={weeklyData.map(w => ({ name: w.week?.substring(0, 10) || '', value: w.count }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Visitors by Country</h3>
          <SimpleBarChart data={countryData.map(c => ({ name: c.country, value: c.count }))} horizontal />
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Visitors by Device</h3>
          <SimplePieChart data={deviceData.map(d => ({ name: d.device, value: d.count }))} />
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Traffic Sources</h3>
          <SimplePieChart data={sourceData.map(s => ({ name: s.source, value: s.count }))} />
        </div>
      </div>
    </div>
  );
}

function SearchAnalytics({ data, formatNumber }: { data: Record<string, unknown>; formatNumber: (v: number) => string }) {
  const topSearches = (data.topSearches as Array<{ query: string; count: number }>) || [];
  const noResults = (data.noResultSearches as Array<{ query: string; count: number }>) || [];
  const trending = (data.trendingSearches as Array<{ query: string; count: number }>) || [];
  const searchesByDay = (data.searchesByDay as Array<{ date: string; count: number }>) || [];
  const searchesByDevice = (data.searchesByDevice as Array<{ device: string; count: number }>) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard title="Total Searches" value={formatNumber(data.totalSearches as number)} icon={Search} color="primary" />
        <StatsCard title="Clicks" value={formatNumber(data.clicks as number)} icon={MousePointerClick} color="accent" />
        <StatsCard title="Click-Through Rate" value={`${data.clickThroughRate}%`} icon={TrendingUp} color="secondary" />
        <StatsCard title="No Results" value={formatNumber(noResults.length)} icon={Search} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Searches Over Time</h3>
          <SimpleLineChart data={searchesByDay} dataKey="count" name="Searches" color={COLORS.accent} />
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Searches by Device</h3>
          <SimplePieChart data={searchesByDevice.map(d => ({ name: d.device, value: d.count }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Top Searches</h3>
          <div className="space-y-3">
            {topSearches.slice(0, 10).map((s, i) => (
              <div key={s.query} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-secondary-500 w-6">{i + 1}</span>
                  <span className="font-medium text-secondary-900 truncate">{s.query}</span>
                </div>
                <span className="text-secondary-600">{formatNumber(s.count)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Trending (Last 7 Days)</h3>
          <div className="space-y-3">
            {trending.slice(0, 10).map((s, i) => (
              <div key={s.query} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-secondary-500 w-6">{i + 1}</span>
                  <span className="font-medium text-secondary-900 truncate">{s.query}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">No Results</h3>
          <div className="space-y-3">
            {noResults.slice(0, 10).map((s, i) => (
              <div key={s.query} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-secondary-500 w-6">{i + 1}</span>
                  <span className="font-medium text-secondary-900 truncate">{s.query}</span>
                </div>
                <span className="text-warning-600">{formatNumber(s.count)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolsAnalytics({
  data,
  formatCurrency,
  formatNumber,
}: {
  data: Record<string, unknown>;
  formatCurrency: (v: number) => string;
  formatNumber: (v: number) => string;
}) {
  const tools = (data.tools as Array<{
    id: string;
    name: string;
    slug: string;
    views: number;
    clicks: number;
    ctr: number;
    avgRating: number;
    reviewCount: number;
    estimatedRevenue: number;
  }>) || [];

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Tool</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Views</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Clicks</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">CTR</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Rating</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Reviews</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Revenue</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {tools.slice(0, 20).map((tool) => (
              <tr key={tool.id} className="hover:bg-secondary-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <a href={`/tools/${tool.slug}`} className="text-primary-600 hover:text-primary-700 font-medium">
                    {tool.name}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-secondary-600">{formatNumber(tool.views)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-secondary-600">{formatNumber(tool.clicks)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-secondary-600">{tool.ctr}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-secondary-600">
                  {tool.avgRating > 0 ? tool.avgRating.toFixed(1) : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-secondary-600">{formatNumber(tool.reviewCount)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-accent-600">
                  {formatCurrency(tool.estimatedRevenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Top Tools by Views</h3>
          <SimpleBarChart
            data={tools.slice(0, 10).map((t) => ({ name: t.name.substring(0, 15), value: t.views }))}
            horizontal
          />
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Top Tools by Revenue</h3>
          <SimpleBarChart
            data={tools
              .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)
              .slice(0, 10)
              .map((t) => ({ name: t.name.substring(0, 15), value: t.estimatedRevenue }))}
            horizontal
            color={COLORS.accent}
          />
        </div>
      </div>
    </div>
  );
}

function AffiliateAnalytics({
  data,
  formatCurrency,
  formatNumber,
}: {
  data: Record<string, unknown>;
  formatCurrency: (v: number) => string;
  formatNumber: (v: number) => string;
}) {
  const clickOverTime = (data.clicksOverTime as Array<{ date: string; count: number }>) || [];
  const bySource = (data.clicksBySource as Array<{ source: string; count: number }>) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard title="Estimated Revenue" value={formatCurrency(data.estimatedRevenue as number)} icon={DollarSign} color="primary" />
        <StatsCard title="Confirmed Revenue" value={formatCurrency(data.confirmedRevenue as number)} icon={DollarSign} color="accent" />
        <StatsCard title="Total Clicks" value={formatNumber(clickOverTime.reduce((a, b) => a + b.count, 0))} icon={MousePointerClick} color="secondary" />
        <StatsCard title="Active Partners" value={formatNumber((data.partnerStats as unknown[])?.length || 0)} icon={Users} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Clicks Over Time</h3>
          <SimpleLineChart data={clickOverTime} dataKey="count" name="Clicks" color={COLORS.accent} />
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Clicks by Source</h3>
          <SimplePieChart data={bySource.map((s) => ({ name: s.source, value: s.count }))} />
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Top Affiliate Programs</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Tool</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Clicks</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {((data.topPrograms as Array<{ name?: string; slug?: string; clicks: number; revenue: number }>) || []).slice(0, 10).map((p) => (
                <tr key={p.slug || p.name} className="hover:bg-secondary-50">
                  <td className="px-4 py-3 text-sm font-medium text-secondary-900">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-right text-secondary-600">{formatNumber(p.clicks)}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-accent-600">{formatCurrency(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CompanyAnalytics({ data, formatNumber }: { data: Record<string, unknown>; formatNumber: (v: number) => string }) {
  const companies = (data.companies as Array<{
    id: string;
    name: string;
    slug: string;
    tool_count: number;
    total_views: number;
    total_reviews: number;
    total_leads: number;
  }>) || [];

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Tools</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Views</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Reviews</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Leads</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-secondary-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-secondary-900">{company.name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-secondary-600">{formatNumber(company.tool_count)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-secondary-600">{formatNumber(company.total_views)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-secondary-600">{formatNumber(company.total_reviews)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-secondary-600">{formatNumber(company.total_leads)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Top Companies by Views</h3>
          <SimpleBarChart
            data={companies.slice(0, 10).map((c) => ({ name: c.name.substring(0, 15), value: c.total_views }))}
            horizontal
          />
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Top Companies by Leads</h3>
          <SimpleBarChart
            data={companies
              .sort((a, b) => b.total_leads - a.total_leads)
              .slice(0, 10)
              .map((c) => ({ name: c.name.substring(0, 15), value: c.total_leads }))}
            horizontal
            color={COLORS.accent}
          />
        </div>
      </div>
    </div>
  );
}

function NewsletterAnalytics({ data, formatNumber }: { data: Record<string, unknown>; formatNumber: (v: number) => string }) {
  const growthTrend = (data.growthTrend as Array<{ date: string; count: number }>) || [];
  const campaigns = (data.campaigns as Array<{
    id: string;
    name: string;
    subject: string;
    recipientCount: number;
    openCount: number;
    clickCount: number;
    openRate: string;
    clickRate: string;
  }>) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard title="Total Subscribers" value={formatNumber(data.totalSubscribers as number)} icon={Mail} color="primary" />
        <StatsCard title="Active" value={formatNumber(data.activeSubscribers as number)} icon={Users} color="accent" />
        <StatsCard title="Open Rate" value={`${data.openRate}%`} icon={Eye} color="secondary" />
        <StatsCard title="Click Rate" value={`${data.clickRate}%`} icon={MousePointerClick} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Subscriber Growth</h3>
          <SimpleLineChart data={growthTrend} dataKey="count" name="New Subscribers" color={COLORS.accent} />
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Growth Rate</h3>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <p className="text-5xl font-bold text-accent-600">{String(data.growthRate)}%</p>
              <p className="text-secondary-500 mt-2">Net Growth</p>
              <p className="text-sm text-secondary-400 mt-1">
                +{formatNumber(data.activeSubscribers as number)} / -{formatNumber(data.unsubscribedSubscribers as number)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Campaign Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Campaign</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Recipients</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Opens</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Open Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Clicks</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Click Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-secondary-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-secondary-900">{campaign.name}</p>
                    <p className="text-sm text-secondary-500">{campaign.subject}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-secondary-600">{formatNumber(campaign.recipientCount)}</td>
                  <td className="px-4 py-3 text-sm text-right text-secondary-600">{formatNumber(campaign.openCount)}</td>
                  <td className="px-4 py-3 text-sm text-right text-secondary-600">{campaign.openRate}%</td>
                  <td className="px-4 py-3 text-sm text-right text-secondary-600">{formatNumber(campaign.clickCount)}</td>
                  <td className="px-4 py-3 text-sm text-right text-secondary-600">{campaign.clickRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RevenueDashboard({
  data,
  formatCurrency,
  formatNumber,
}: {
  data: Record<string, unknown>;
  formatCurrency: (v: number) => string;
  formatNumber: (v: number) => string;
}) {
  const revenueByDay = (data.revenueByDay as Array<{ date: string; type: string; amount: number }>) || [];
  const monthlyRevenue = (data.monthlyRevenue as Array<{ month: string; total: number }>) || [];
  const revenueByType = (data.revenueByType as Array<{ type: string; total: number }>) || [];

  const aggregatedDaily: Array<{ date: string; [key: string]: number | string }> = revenueByDay.reduce((acc, item) => {
    const existing = acc.find((d) => d.date === item.date);
    if (existing) {
      existing[item.type.toLowerCase()] = item.amount;
    } else {
      acc.push({ date: item.date, [item.type.toLowerCase()]: item.amount });
    }
    return acc;
  }, [] as Array<{ date: string; [key: string]: number | string }>);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatsCard title="Total Revenue" value={formatCurrency(data.totalRevenue as number)} icon={DollarSign} color="primary" />
        <StatsCard title="Affiliate" value={formatCurrency(data.affiliateRevenue as number)} icon={ShoppingBag} color="accent" />
        <StatsCard title="Advertising" value={formatCurrency(data.advertisingRevenue as number)} icon={BarChart3} color="secondary" />
        <StatsCard title="Subscription" value={formatCurrency(data.subscriptionRevenue as number)} icon={TrendingUp} color="warning" />
        <StatsCard title="Sponsored" value={formatCurrency(data.sponsoredListingRevenue as number)} icon={Building2} color="error" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Revenue by Type</h3>
          <SimplePieChart
            data={revenueByType.map((r) => ({
              name: r.type.charAt(0) + r.type.slice(1).toLowerCase().replace("_", " "),
              value: Number(r.total || 0),
            }))}
          />
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Monthly Revenue</h3>
          <SimpleLineChart
            data={monthlyRevenue.map((m) => ({ date: m.month?.substring(0, 7) || "", count: m.total }))}
            dataKey="count"
            name="Revenue"
            color={COLORS.accent}
          />
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Daily Revenue Trends</h3>
        <StackedAreaChart
          data={aggregatedDaily}
          keys={["affiliate", "advertising", "subscription", "sponsored_listing"]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Pending Payouts</h3>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <p className="text-4xl font-bold text-warning-600">
                {formatCurrency((data.pendingPayouts as { amount: number })?.amount || 0)}
              </p>
              <p className="text-secondary-500 mt-2">
                {(data.pendingPayouts as { count: number })?.count || 0} pending transactions
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Top Revenue Tools</h3>
          <div className="space-y-3">
            {((data.topTools as Array<{ name: string; revenue: number }>) || []).slice(0, 10).map((t, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-secondary-500 w-6">{i + 1}</span>
                  <span className="font-medium text-secondary-900">{t.name}</span>
                </div>
                <span className="font-medium text-accent-600">{formatCurrency(t.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    }>
      <AnalyticsContent />
    </Suspense>
  );
}
