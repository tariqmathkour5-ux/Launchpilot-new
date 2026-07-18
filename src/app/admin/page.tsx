"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wrench,
  FolderTree,
  Users,
  Building2,
  MessageSquare,
  MousePointerClick,
  Mail,
  Star,
  Activity,
  TrendingUp,
  Clock,
  FileText,
} from "lucide-react";
import StatsCard from "@/components/admin/StatsCard";

interface DashboardStats {
  tools: number;
  categories: number;
  companies: number;
  users: number;
  reviews: number;
  affiliateClicks: number;
  newsletterSubscribers: number;
  featured: number;
  recentTools: Array<{
    id: string;
    name: string;
    slug: string;
    rating: number | null;
    createdAt: string;
  }>;
  recentReviews: Array<{
    id: string;
    rating: number;
    title: string | null;
    created_at: string;
    user_name: string | null;
  }>;
  recentCompanies: Array<{
    id: string;
    name: string;
    slug: string;
    verified: boolean;
    createdAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    resource: string;
    createdAt: string;
    user: { name: string | null } | null;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Task 51: blog overview is deliberately its own state + fetch, entirely
  // separate from `stats`/`fetchStats` above — additive to this shared
  // dashboard page, not touching the existing modules' data flow at all.
  interface BlogOverview {
    metrics: { total: number; published: number; draft: number; review: number };
    recentPosts: Array<{ id: string; title: string; slug: string; status: string; updatedAt: string }>;
    publishingActivity: { last7Days: number };
  }
  const [blogOverview, setBlogOverview] = useState<BlogOverview | null>(null);

  useEffect(() => {
    fetchStats();
    fetch("/api/admin/blog/overview")
      .then((res) => (res.ok ? res.json() : null))
      .then(setBlogOverview)
      .catch((error) => console.error("Failed to fetch blog overview:", error));
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats/overview");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-500 mt-1">Overview of your LaunchPilot ecosystem</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total AI Tools"
          value={stats?.tools || 0}
          icon={Wrench}
          color="primary"
        />
        <StatsCard
          title="Categories"
          value={stats?.categories || 0}
          icon={FolderTree}
          color="accent"
        />
        <StatsCard
          title="Companies"
          value={stats?.companies || 0}
          icon={Building2}
          color="secondary"
        />
        <StatsCard
          title="Total Users"
          value={stats?.users || 0}
          icon={Users}
          color="primary"
        />
        <StatsCard
          title="User Reviews"
          value={stats?.reviews || 0}
          icon={MessageSquare}
          color="accent"
        />
        <StatsCard
          title="Affiliate Clicks"
          value={stats?.affiliateClicks || 0}
          icon={MousePointerClick}
          color="warning"
        />
        <StatsCard
          title="Newsletter"
          value={stats?.newsletterSubscribers || 0}
          icon={Mail}
          color="success"
        />
        <StatsCard
          title="Featured Tools"
          value={stats?.featured || 0}
          icon={Star}
          color="warning"
        />
      </div>

      {/* Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <Link
              href="/admin/tools/new"
              className="block p-4 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <p className="font-medium text-secondary-900">Add New Tool</p>
              <p className="text-sm text-secondary-500">Create a new AI tool listing</p>
            </Link>
            <Link
              href="/admin/companies/new"
              className="block p-4 rounded-lg border border-secondary-200 hover:border-accent-300 hover:bg-accent-50 transition-colors"
            >
              <p className="font-medium text-secondary-900">Add New Company</p>
              <p className="text-sm text-secondary-500">Register a new tool vendor</p>
            </Link>
            <Link
              href="/admin/categories/new"
              className="block p-4 rounded-lg border border-secondary-200 hover:border-accent-300 hover:bg-accent-50 transition-colors"
            >
              <p className="font-medium text-secondary-900">Add New Category</p>
              <p className="text-sm text-secondary-500">Create a new category</p>
            </Link>
            <Link
              href="/admin/blog/new"
              className="block p-4 rounded-lg border border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50 transition-colors"
            >
              <p className="font-medium text-secondary-900">Write Blog Post</p>
              <p className="text-sm text-secondary-500">Publish a new article</p>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {stats?.recentActivity?.length ? (
              stats.recentActivity.slice(0, 6).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-secondary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-secondary-900">
                      <span className="font-medium">{activity.user?.name || "System"}</span>{" "}
                      {activity.action} {activity.resource}
                    </p>
                    <p className="text-xs text-secondary-500">{formatDate(activity.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-secondary-500 text-sm">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tools */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Latest AI Tools</h2>
            <Link href="/admin/tools" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {stats?.recentTools?.length ? (
              stats.recentTools.map((tool) => (
                <div key={tool.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-secondary-900">{tool.name}</p>
                    <p className="text-xs text-secondary-500">{formatDate(tool.createdAt)}</p>
                  </div>
                  {tool.rating && (
                    <div className="flex items-center gap-1 text-warning-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm">{tool.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-secondary-500 text-sm">No tools yet</p>
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Latest Reviews</h2>
            <Link href="/admin/reviews" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {stats?.recentReviews?.length ? (
              stats.recentReviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-secondary-900 line-clamp-1">
                      {review.title || "Review"}
                    </p>
                    <p className="text-xs text-secondary-500">
                      by {review.user_name || "Anonymous"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-warning-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm">{review.rating.toFixed(1)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-secondary-500 text-sm">No reviews yet</p>
            )}
          </div>
        </div>

        {/* Recent Companies */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Latest Companies</h2>
            <Link href="/admin/companies" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {stats?.recentCompanies?.length ? (
              stats.recentCompanies.map((company) => (
                <div key={company.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-secondary-900">{company.name}</p>
                    <p className="text-xs text-secondary-500">{formatDate(company.createdAt)}</p>
                  </div>
                  {company.verified && (
                    <span className="text-xs bg-success-100 text-success-700 px-2 py-1 rounded-full">
                      Verified
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-secondary-500 text-sm">No companies yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Blog Overview (Task 51) — additive section, reuses StatsCard like every section above */}
      {blogOverview && (
        <div>
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Blog</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatsCard title="Total Posts" value={blogOverview.metrics.total} icon={FileText} color="primary" />
            <StatsCard title="Published" value={blogOverview.metrics.published} icon={TrendingUp} color="success" />
            <StatsCard title="In Review" value={blogOverview.metrics.review} icon={Clock} color="warning" />
            <StatsCard title="Published (7d)" value={blogOverview.publishingActivity.last7Days} icon={Activity} color="accent" />
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Posts</h3>
              <Link href="/admin/blog" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {blogOverview.recentPosts.length ? (
                blogOverview.recentPosts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-secondary-900 line-clamp-1">{post.title}</p>
                      <p className="text-xs text-secondary-500">{formatDate(post.updatedAt)}</p>
                    </div>
                    <span className="text-xs bg-secondary-100 text-secondary-700 px-2 py-1 rounded-full">
                      {post.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-secondary-500 text-sm">No blog posts yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
