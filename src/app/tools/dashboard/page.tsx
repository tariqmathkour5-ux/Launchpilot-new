import Link from 'next/link';
import { BarChart3, Tag, Package, DollarSign } from 'lucide-react';
import { getToolsAnalytics } from '@/lib/tools-analytics';

export const metadata = {
  title: 'Tools Dashboard - LaunchPilot',
  description: 'Analytics and statistics for AI tools in the LaunchPilot knowledge base.',
};

export default async function ToolsDashboardPage() {
  const analytics = getToolsAnalytics();

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-secondary-900">Tools Dashboard</h1>
          </div>
          <p className="text-secondary-600">
            Statistics and analytics for AI tools in our knowledge base.
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Tools */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-medium text-secondary-500">Total Tools</span>
            </div>
            <p className="text-2xl font-bold text-secondary-900">
              {analytics.totalTools.toLocaleString()}
            </p>
            <p className="text-xs text-secondary-400 mt-1">AI tools in database</p>
          </div>

          {/* Free Tools */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Tag className="h-5 w-5 text-success-600" />
              <span className="text-sm font-medium text-secondary-500">Free Tools</span>
            </div>
            <p className="text-2xl font-bold text-secondary-900">
              {analytics.pricingBreakdown.free.toLocaleString()}
            </p>
            <p className="text-xs text-success-600 mt-1">
              {analytics.pricingBreakdown.free > 0
                ? Math.round((analytics.pricingBreakdown.free / analytics.totalTools) * 100)
                : 0}% of total
            </p>
          </div>

          {/* Freemium Tools */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5 text-accent-600" />
              <span className="text-sm font-medium text-secondary-500">Freemium Tools</span>
            </div>
            <p className="text-2xl font-bold text-secondary-900">
              {analytics.pricingBreakdown.freemium.toLocaleString()}
            </p>
            <p className="text-xs text-accent-600 mt-1">
              {analytics.pricingBreakdown.freemium > 0
                ? Math.round((analytics.pricingBreakdown.freemium / analytics.totalTools) * 100)
                : 0}% of total
            </p>
          </div>

          {/* Paid Tools */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Tag className="h-5 w-5 text-warning-600" />
              <span className="text-sm font-medium text-secondary-500">Paid Tools</span>
            </div>
            <p className="text-2xl font-bold text-secondary-900">
              {analytics.pricingBreakdown.paid.toLocaleString()}
            </p>
            <p className="text-xs text-warning-600 mt-1">
              {analytics.pricingBreakdown.paid > 0
                ? Math.round((analytics.pricingBreakdown.paid / analytics.totalTools) * 100)
                : 0}% of total
            </p>
          </div>
        </div>

        {/* Top Categories */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold text-secondary-900 mb-4">Top Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.topCategories.map(category => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="block p-4 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-secondary-900">{category.name}</span>
                  <span className="text-xs bg-secondary-100 px-2 py-1 rounded">
                    {category.toolCount} tools
                  </span>
                </div>
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{
                      width: `${analytics.totalTools > 0 ? (category.toolCount / analytics.totalTools) * 100 : 0}%`,
                    }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Companies */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold text-secondary-900 mb-4">Top Companies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.topCompanies.slice(0, 9).map(company => (
              <Link
                key={company.id}
                href={`/companies/${company.slug}`}
                className="block p-4 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-secondary-900">{company.name}</span>
                  <span className="text-xs bg-secondary-100 px-2 py-1 rounded">
                    {company.toolCount} tools
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Pricing Breakdown Visualization */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold text-secondary-900 mb-4">Pricing Breakdown</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-secondary-700">Free</span>
                <span className="text-sm text-secondary-500">
                  {analytics.pricingBreakdown.free} tools
                </span>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-3">
                <div
                  className="bg-success-500 h-3 rounded-full"
                  style={{
                    width: `${analytics.totalTools > 0 ? (analytics.pricingBreakdown.free / analytics.totalTools) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-secondary-700">Freemium</span>
                <span className="text-sm text-secondary-500">
                  {analytics.pricingBreakdown.freemium} tools
                </span>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-3">
                <div
                  className="bg-accent-500 h-3 rounded-full"
                  style={{
                    width: `${analytics.totalTools > 0 ? (analytics.pricingBreakdown.freemium / analytics.totalTools) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-secondary-700">Paid</span>
                <span className="text-sm text-secondary-500">
                  {analytics.pricingBreakdown.paid} tools
                </span>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-3">
                <div
                  className="bg-warning-500 h-3 rounded-full"
                  style={{
                    width: `${analytics.totalTools > 0 ? (analytics.pricingBreakdown.paid / analytics.totalTools) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link href="/tools" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700">
            ← Back to Tools
          </Link>
        </div>
      </div>
    </div>
  );
}