"use client";

import { useEffect, useState } from "react";
import { Eye, Users, FileText, TrendingUp } from "lucide-react";
import StatsCard from "@/components/admin/StatsCard";
import { SimpleLineChart, SimpleBarChart, SimplePieChart } from "@/components/admin/Charts";

interface BlogAnalyticsData {
  popularPosts: Array<{ postId: string; slug: string; title: string; viewCount: number }>;
  viewsOverTime: Array<{ date: string; count: number }>;
  popularCategories: Array<{ categoryId: string; name: string; viewCount: number }>;
  engagement: {
    totalViews: number;
    uniqueVisitors: number;
    publishedPostCount: number;
    avgViewsPerPost: number;
  };
}

export default function AdminBlogAnalyticsPage() {
  const [data, setData] = useState<BlogAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics/blog?days=30")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-secondary-500">Failed to load analytics.</div>;
  }

  const mostViewedChartData = data.popularPosts.map((p) => ({
    name: p.title.length > 30 ? `${p.title.slice(0, 30)}…` : p.title,
    value: p.viewCount,
  }));

  const popularCategoriesChartData = data.popularCategories.map((c) => ({
    name: c.name,
    value: c.viewCount,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">Blog Analytics</h1>
        <p className="text-secondary-500 mt-1">Views, engagement, and popular content over the last 30 days</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Total Views" value={data.engagement.totalViews} icon={Eye} color="primary" />
        <StatsCard title="Unique Visitors" value={data.engagement.uniqueVisitors} icon={Users} color="accent" />
        <StatsCard title="Published Posts" value={data.engagement.publishedPostCount} icon={FileText} color="secondary" />
        <StatsCard title="Avg. Views / Post" value={data.engagement.avgViewsPerPost} icon={TrendingUp} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Views Over Time</h2>
          {data.viewsOverTime.length === 0 ? (
            <p className="text-secondary-500 text-sm py-12 text-center">No view data yet.</p>
          ) : (
            <SimpleLineChart data={data.viewsOverTime} dataKey="count" name="Views" />
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Popular Categories</h2>
          {popularCategoriesChartData.length === 0 ? (
            <p className="text-secondary-500 text-sm py-12 text-center">No category view data yet.</p>
          ) : (
            <SimplePieChart data={popularCategoriesChartData} />
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Most Viewed Posts</h2>
        {mostViewedChartData.length === 0 ? (
          <p className="text-secondary-500 text-sm py-12 text-center">No post view data yet.</p>
        ) : (
          <SimpleBarChart data={mostViewedChartData} dataKey="value" name="Views" horizontal height={Math.max(300, mostViewedChartData.length * 40)} />
        )}
      </div>
    </div>
  );
}
