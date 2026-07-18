import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToolGrid from '@/components/ToolGrid';
import Link from 'next/link';
import { getAllTools } from '@/lib/tools';
import { CATEGORIES } from '@/types';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbJsonLd, toolListJsonLd } from '@/lib/seo/json-ld';
import { getPricingLabel, getPricingColor } from '@/lib/landing-pages';
import { Star, TrendingUp, Sparkles, ChevronRight, ArrowRight, Tag } from 'lucide-react';
import type { Tool } from '@/types';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = CATEGORIES.find((c) => c.slug === slug);
  if (!cat) return { title: 'Category Not Found' };

  return buildMetadata({
    title: `Best ${cat.name} Tools in 2025`,
    description: `Discover the best ${cat.name} tools. Compare features, pricing, and ratings for ${cat.description.toLowerCase()}.`,
    path: `/categories/${slug}`,
  });
}

function FeaturedToolCard({ tool, rank }: { tool: Tool; rank: number }) {
  return (
    <div className="bg-white rounded-2xl border border-secondary-200 p-5 hover:border-primary-300 hover:shadow-md transition-all group relative">
      <div className="absolute -top-2.5 left-4">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          rank === 1 ? 'bg-amber-400 text-amber-900' :
          rank === 2 ? 'bg-secondary-300 text-secondary-700' :
          'bg-orange-200 text-orange-700'
        }`}>#{rank}</span>
      </div>
      <div className="mt-2">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link href={`/tools/${tool.slug}`} className="font-bold text-secondary-900 group-hover:text-primary-600 transition-colors">
            {tool.name}
          </Link>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${getPricingColor(tool.pricing)}`}>
            {getPricingLabel(tool.pricing)}
          </span>
        </div>
        {tool.rating && (
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(tool.rating!) ? 'fill-amber-400 text-amber-400' : 'text-secondary-200'}`} />
            ))}
            <span className="text-xs text-secondary-500 ml-1">{tool.rating.toFixed(1)}</span>
          </div>
        )}
        <p className="text-sm text-secondary-500 line-clamp-2 mb-3">{tool.description}</p>
        {tool.features.slice(0, 2).map((f, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-secondary-600 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-400 flex-shrink-0" />
            {f}
          </div>
        ))}
        <Link href={`/tools/${tool.slug}`} className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
          View details <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const cat = CATEGORIES.find((c) => c.slug === slug);
  if (!cat) notFound();

  const allTools = getAllTools();
  const categoryTools = allTools.filter(
    (t) => t.category.toLowerCase() === cat.name.toLowerCase()
  );

  const topRated = [...categoryTools]
    .filter(t => t.rating)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 3);

  const freeTools = categoryTools.filter(t => t.pricing === 'free' || t.has_free_tier);
  const paidTools = categoryTools.filter(t => t.pricing === 'paid');
  const withApi = categoryTools.filter(t => t.has_api);

  const relatedCategories = CATEGORIES.filter(c => c.slug !== slug).slice(0, 4);

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Categories', href: '/categories' },
    { name: cat.name, href: `/categories/${slug}` },
  ];

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolListJsonLd(categoryTools, `${cat.name} Tools`, `/categories/${slug}`)) }}
      />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-secondary-900 via-primary-900 to-secondary-800 text-white py-14 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1 text-sm text-secondary-400 mb-8" aria-label="Breadcrumb">
              {breadcrumbs.map((bc, i) => (
                <span key={bc.href} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3" />}
                  {i < breadcrumbs.length - 1 ? (
                    <Link href={bc.href} className="hover:text-white transition-colors">{bc.name}</Link>
                  ) : (
                    <span className="text-white font-medium">{bc.name}</span>
                  )}
                </span>
              ))}
            </nav>

            <h1 className="text-4xl lg:text-5xl font-bold mb-3">{cat.name}</h1>
            <p className="text-xl text-primary-200 max-w-2xl mb-6">{cat.description}</p>

            <div className="flex flex-wrap items-center gap-6 text-sm text-primary-300">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {categoryTools.length} tools
              </span>
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {freeTools.length} with free plan
              </span>
              {withApi.length > 0 && (
                <span className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {withApi.length} with API
                </span>
              )}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">

          {/* Top Rated */}
          {topRated.length > 0 && (
            <section className="mb-14">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Star className="h-4 w-4 fill-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-secondary-900">Top Rated</h2>
                  <p className="text-sm text-secondary-500">Highest rated {cat.name} tools</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {topRated.map((tool, i) => (
                  <FeaturedToolCard key={tool.slug} tool={tool} rank={i + 1} />
                ))}
              </div>
            </section>
          )}

          {/* Filter quick links */}
          <div className="flex flex-wrap gap-2 mb-8">
            {freeTools.length > 0 && (
              <Link href={`/tags/free-plan`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 transition-colors">
                Free Plan ({freeTools.length})
              </Link>
            )}
            {withApi.length > 0 && (
              <Link href={`/tags/api-available`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                API Available ({withApi.length})
              </Link>
            )}
            {paidTools.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-secondary-200 text-secondary-600 bg-secondary-50">
                Paid ({paidTools.length})
              </span>
            )}
          </div>

          {/* All tools */}
          <section className="mb-14">
            <h2 className="text-xl font-bold text-secondary-900 mb-6">
              All {cat.name} Tools
              <span className="ml-2 text-sm font-normal text-secondary-400">({categoryTools.length})</span>
            </h2>
            <ToolGrid tools={categoryTools} />
          </section>

          {/* Related categories */}
          <section className="pt-8 border-t border-secondary-200">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Related Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedCategories.map(rc => {
                const count = allTools.filter(t => t.category.toLowerCase() === rc.name.toLowerCase()).length;
                return (
                  <Link
                    key={rc.slug}
                    href={`/categories/${rc.slug}`}
                    className="bg-white rounded-xl border border-secondary-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all group"
                  >
                    <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors text-sm mb-1">{rc.name}</h3>
                    <p className="text-xs text-secondary-400">{count} tools</p>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}