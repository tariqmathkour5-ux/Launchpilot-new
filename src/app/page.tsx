import Link from 'next/link';
import { ArrowRight, Sparkles, Star, TrendingUp, Tag } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToolCard from '@/components/ToolCard';
import CategoryCard from '@/components/CategoryCard';
import PersonalizedHomepage from '@/components/PersonalizedHomepage';
import { searchToolsKb } from '@/lib/tools-kb';
import { CATEGORIES } from '@/types';
import { prisma } from '@/lib/prisma';
import { toJsonLdScript, organizationJsonLd, breadcrumbJsonLd } from '@/lib/seo/json-ld';

export const revalidate = 3600; // Revalidate every hour

// SSR: Fetch top rated tools based on user reviews
// Uses a raw query to avoid Prisma client type issues
async function getTopRatedToolsFromReviews(limit: number = 6) {
  try {
    // Use raw query to get tools with their average user ratings
    const results = await prisma.$queryRaw<Array<{
      id: string;
      slug: string;
      name: string;
      description: string;
      avgRating: number | null;
      reviewCount: number | null;
    }>>`
      SELECT 
        t.id, 
        t.slug, 
        t.name, 
        t.description,
        COALESCE(AVG(ur.rating), 0) as avgRating,
        COUNT(ur.id) as reviewCount
      FROM Tool t
      LEFT JOIN UserReview ur ON ur.toolId = t.id
      WHERE t.published = true
      GROUP BY t.id, t.slug, t.name, t.description
      HAVING COUNT(ur.id) > 0
      ORDER BY avgRating DESC
      LIMIT ${limit}
    `.catch(() => []);

    // Map to simple tool objects for ToolCard (using knowledge base data for full details)
    const kbTools = searchToolsKb({ limit: 10000 }).tools;
    const mappedTools = results
      .map((r) => {
        const fullTool = kbTools.find(t => t.slug === r.slug);
        if (!fullTool) return null;
        // Update the rating with user average if available
        return {
          ...fullTool,
          rating: r.avgRating ? Number(r.avgRating.toFixed(1)) : fullTool.rating,
        } as typeof fullTool;
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    return mappedTools;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  // Get tools from knowledge base (all available tools)
  const allToolsResult = searchToolsKb({ limit: 100000 });
  const allTools = allToolsResult.tools;
  const featuredTools = allTools.slice(0, 6);
  const totalToolCount = allTools.length;

  // SSR: Get top rated tools from user reviews
  const topRatedTools = await getTopRatedToolsFromReviews(6);

  // Get dynamic category counts from knowledge base
  const categoriesWithCount = CATEGORIES.map(cat => ({
    ...cat,
    tool_count: allTools.filter(t => 
      t.category.toLowerCase().replace(/\s+/g, '-') === cat.slug.toLowerCase()
    ).length,
  }));

  return (
    <>
      <Header />

      {/* Structured Data: Organization + BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(organizationJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLdScript(breadcrumbJsonLd([
            { name: 'Home', href: '/' },
          ])),
        }}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-accent-400/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 bg-primary-400/30 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>{totalToolCount.toLocaleString()}+ AI Tools Reviewed & Compared</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Discover the Best
              <br />
              <span className="text-accent-300">AI Tools</span> for Your Workflow
            </h1>

            <p className="text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto mb-8">
              Comprehensive reviews, detailed comparisons, and curated alternatives to help you find the perfect AI solution.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/tools" className="btn bg-white text-primary-700 hover:bg-primary-50 px-6 py-3 rounded-lg text-base font-semibold">
                Explore All Tools
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/categories" className="btn bg-white/10 text-white hover:bg-white/20 px-6 py-3 rounded-lg text-base font-medium border border-white/20">
                Browse Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Recommendations */}
      <PersonalizedHomepage />

      {/* Stats Section */}
      <section className="bg-white border-b border-secondary-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-secondary-900">{totalToolCount.toLocaleString()}+</p>
              <p className="text-sm text-secondary-500 mt-1">AI Tools Listed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-secondary-900">{CATEGORIES.length}</p>
              <p className="text-sm text-secondary-500 mt-1">Categories</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-secondary-900">{totalToolCount.toLocaleString()}</p>
              <p className="text-sm text-secondary-500 mt-1">Detailed Reviews</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-secondary-900">100%</p>
              <p className="text-sm text-secondary-500 mt-1">Free to Use</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tools */}
      <section className="py-16 lg:py-24 bg-secondary-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-secondary-900">Featured Tools</h2>
              <p className="text-secondary-500 mt-1">Hand-picked AI tools worth exploring</p>
            </div>
            <Link href="/tools" className="btn btn-secondary hidden sm:inline-flex">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link href="/tools" className="btn btn-secondary">
              View all tools
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-secondary-900">Browse by Category</h2>
            <p className="text-secondary-500 mt-2">Find AI tools organized by their primary use case</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoriesWithCount.slice(0, 9).map((category) => (
              <CategoryCard key={category.slug} category={category} toolCount={category.tool_count} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/categories" className="btn btn-secondary">
              View all categories
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Top Rated Tools (SSR from User Reviews) */}
      {topRatedTools.length > 0 && (
        <section className="py-16 lg:py-24 bg-secondary-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-500/10 text-warning-600">
                <Star className="h-5 w-5 fill-warning-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-secondary-900">Top Rated by Users</h2>
                <p className="text-secondary-500 text-sm">Highest rated based on community reviews</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {topRatedTools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link href="/tools" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View all tools →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Exclusive Deals Promotion */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-warning-50 to-warning-100/30 border-t border-warning-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-secondary-900">Exclusive Deals Available</h2>
              <p className="text-secondary-500 text-sm">Save up to 50% on popular AI tools</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-warning-200 p-6">
            <p className="text-secondary-600 mb-4">
              Get access to exclusive promo codes and price drops on ChatGPT, Midjourney, Claude, and other top AI tools.
            </p>
            <Link 
              href="/deals" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-warning-600 text-white rounded-lg font-medium hover:bg-warning-700 transition-colors"
            >
              View All Deals
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-secondary-900 to-secondary-800">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <TrendingUp className="h-12 w-12 text-primary-400 mx-auto mb-6" />
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Stay Updated with AI Tool Trends
          </h2>
          <p className="text-secondary-300 mb-8 max-w-xl mx-auto">
            Get weekly insights on new AI tools, in-depth reviews, and expert comparisons delivered to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-lg border border-secondary-600 bg-secondary-800 px-4 py-3 text-white placeholder-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <button type="submit" className="btn btn-primary px-6 py-3 rounded-lg">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
}