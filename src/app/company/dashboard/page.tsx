'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wrench, MessageSquare, Megaphone, Users, TrendingUp, Star,
  CheckCircle2, Clock, AlertCircle, ArrowRight, Loader2,
  BarChart3, Shield, UserCheck, DollarSign
} from 'lucide-react';

interface DashboardData {
  company: { id: string; name: string; slug: string; verified: boolean; status: string; logo: string | null };
  stats: {
    totalTools: number; publishedTools: number; pendingTools: number; featuredTools: number;
    totalReviews: number; avgRating: number | null; activeCampaigns: number; totalCampaigns: number;
    teamMembers: number; totalLeads: number; convertedLeads: number; verificationStatus: string;
  };
  tools: Array<{ id: string; name: string; slug: string; published: boolean; rating: number | null }>;
  reviewStats: Array<{ tool_id: string; count: number; avg_rating: number }>;
  leadStats: Array<{ status: string; count: number }>;
}

function StatCard({ icon: Icon, label, value, sub, color, href }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color: string; href?: string;
}) {
  const content = (
    <div className={`bg-white rounded-xl border border-secondary-200 p-5 hover:shadow-sm transition-all ${href ? 'hover:border-primary-300 cursor-pointer group' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-secondary-500">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-secondary-900">{value}</p>
      {sub && <p className="text-xs text-secondary-400 mt-1">{sub}</p>}
      {href && (
        <p className="text-xs text-primary-600 mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          View all <ArrowRight className="h-3 w-3" />
        </p>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : <>{content}</>;
}

export default function CompanyDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [analyticsRes, profileRes] = await Promise.all([
          fetch('/api/company/analytics'),
          fetch('/api/company/profile'),
        ]);
        if (analyticsRes.ok && profileRes.ok) {
          const [analytics, profile] = await Promise.all([analyticsRes.json(), profileRes.json()]);
          setData({ ...analytics, company: profile.company });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-secondary-300 mb-4" />
        <p className="text-secondary-500">Unable to load dashboard.</p>
      </div>
    );
  }

  const { company, stats, tools } = data;

  const verificationBadge = {
    'not_submitted': { label: 'Not Submitted', color: 'bg-secondary-100 text-secondary-600', icon: AlertCircle },
    'pending': { label: 'Pending Review', color: 'bg-amber-100 text-amber-700', icon: Clock },
    'under_review': { label: 'Under Review', color: 'bg-blue-100 text-blue-700', icon: Clock },
    'verified': { label: 'Verified', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-600', icon: AlertCircle },
  }[stats.verificationStatus] || { label: 'Unknown', color: 'bg-secondary-100 text-secondary-600', icon: AlertCircle };

  const VerIcon = verificationBadge.icon;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Company Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary-100 border border-secondary-200 flex-shrink-0 overflow-hidden">
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-secondary-400">{company.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-secondary-900">{company.name}</h1>
              {company.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${verificationBadge.color}`}>
                <VerIcon className="h-3 w-3" />
                {verificationBadge.label}
              </span>
              <Link href={`/companies/${company.slug}`} className="text-xs text-primary-600 hover:underline">
                View public page →
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/company/profile"
            className="px-4 py-2 text-sm border border-secondary-200 rounded-lg text-secondary-600 hover:bg-secondary-50 transition-colors"
          >
            Edit Profile
          </Link>
          <Link
            href="/company/campaigns"
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            + New Campaign
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Wrench} label="Published Tools" value={stats.publishedTools}
          sub={`${stats.pendingTools} pending`} color="text-primary-600 bg-primary-50" href="/admin/tools" />
        <StatCard icon={MessageSquare} label="Total Reviews" value={stats.totalReviews}
          sub={stats.avgRating ? `${stats.avgRating.toFixed(1)} avg rating` : 'No ratings yet'}
          color="text-amber-600 bg-amber-50" href="/company/reviews" />
        <StatCard icon={Megaphone} label="Active Campaigns" value={stats.activeCampaigns}
          sub={`${stats.totalCampaigns} total`} color="text-green-600 bg-green-50" href="/company/campaigns" />
        <StatCard icon={UserCheck} label="Total Leads" value={stats.totalLeads}
          sub={`${stats.convertedLeads} converted`} color="text-blue-600 bg-blue-50" href="/company/leads" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Team Members" value={stats.teamMembers}
          color="text-secondary-600 bg-secondary-100" href="/company/team" />
        <StatCard icon={Star} label="Avg Rating" value={stats.avgRating ? stats.avgRating.toFixed(1) + '/5' : '—'}
          color="text-orange-600 bg-orange-50" />
        <StatCard icon={Shield} label="Verification" value={verificationBadge.label}
          color="text-secondary-600 bg-secondary-100" href="/company/verification" />
        <StatCard icon={Wrench} label="Featured Tools" value={stats.featuredTools}
          color="text-accent-600 bg-accent-50" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tools */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-secondary-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-secondary-900">Your Tools</h2>
            <Link href="/admin/tools" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              Manage all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {tools.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-8 w-8 text-secondary-300 mx-auto mb-2" />
              <p className="text-sm text-secondary-400">No tools yet.</p>
              <Link href="/admin/tools/new" className="mt-2 inline-flex text-sm text-primary-600 hover:underline">
                Add your first tool
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-secondary-100">
              {tools.slice(0, 6).map(tool => (
                <div key={tool.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${tool.published ? 'bg-green-500' : 'bg-amber-400'}`} />
                    <div>
                      <Link href={`/tools/${tool.slug}`} className="text-sm font-medium text-secondary-900 hover:text-primary-600 transition-colors">
                        {tool.name}
                      </Link>
                      <p className="text-xs text-secondary-400">{tool.published ? 'Published' : 'Draft'}</p>
                    </div>
                  </div>
                  {tool.rating && (
                    <div className="flex items-center gap-1 text-xs text-secondary-500">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {tool.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions + Lead Pipeline */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-secondary-200 p-5">
            <h2 className="font-semibold text-secondary-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Add Tool', href: '/admin/tools/new', icon: Wrench, color: 'text-primary-600' },
                { label: 'Create Campaign', href: '/company/campaigns', icon: Megaphone, color: 'text-green-600' },
                { label: 'Invite Team Member', href: '/company/team', icon: Users, color: 'text-blue-600' },
                { label: 'View Analytics', href: '/company/analytics', icon: BarChart3, color: 'text-amber-600' },
                { label: 'Submit Verification', href: '/company/verification', icon: Shield, color: 'text-secondary-600' },
              ].map(a => (
                <Link key={a.href} href={a.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary-50 transition-colors group">
                  <a.icon className={`h-4 w-4 ${a.color}`} />
                  <span className="text-sm text-secondary-700 group-hover:text-secondary-900">{a.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-secondary-300 ml-auto group-hover:text-secondary-500" />
                </Link>
              ))}
            </div>
          </div>

          {/* Lead Pipeline */}
          {data.leadStats.length > 0 && (
            <div className="bg-white rounded-xl border border-secondary-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-secondary-900">Lead Pipeline</h2>
                <Link href="/company/leads" className="text-xs text-primary-600 hover:underline">View all</Link>
              </div>
              <div className="space-y-2">
                {data.leadStats.map(ls => (
                  <div key={ls.status} className="flex items-center justify-between text-sm">
                    <span className="text-secondary-600 capitalize">{ls.status}</span>
                    <span className="font-medium text-secondary-900">{ls.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
