import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAllTools } from '@/lib/tools';
import { filterToolsForLandingPage, LandingPageConfig, getPricingLabel, getPricingColor } from '@/lib/landing-pages';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbJsonLd, toolListJsonLd } from '@/lib/seo/json-ld';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Star, ExternalLink, ChevronRight, Sparkles, TrendingUp, Filter } from 'lucide-react';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

async function getPage(slug: string) {
  try {
    const rows = await prisma.$queryRaw<Array<{
      slug: string; title: string; heading: string | null; subheading: string | null;
      description: string | null; meta_title: string | null; meta_description: string | null;
      filter_config: LandingPageConfig; page_type: string; og_image: string | null;
    }>>`SELECT slug, title, heading, subheading, description, meta_title, meta_description,
      filter_config, page_type, og_image
      FROM seo_landing_pages WHERE slug = ${slug} AND is_published = true`;
    return rows[0] || null;
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const rows = await prisma.$queryRaw<Array<{ slug: string }>>`
      SELECT slug FROM seo_landing_pages WHERE is_published = true`;
    return rows.map(r => ({ slug: r.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return { title: 'Not Found' };
  return buildMetadata({
    title: page.meta_title || page.title,
    description: page.meta_description || page.description || '',
    path: `/collections/${slug}`,
    ogImage: page.og_image || undefined,
  });
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  const allTools = getAllTools();
  const tools = filterToolsForLandingPage(allTools, page.filter_config || {});

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Collections', href: '/collections' },
    { name: page.title, href: `/collections/${slug}` },
  ];

  const topTools = tools.slice(0, 3);
  const remainingTools = tools.slice(3);

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolListJsonLd(tools, page.heading || page.title, `/collections/${slug}`)) }}
      />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-950 via-primary-900 to-secondary-900 text-white py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 text-sm text-primary-300 mb-8" aria-label="Breadcrumb">
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

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-primary-800/50 rounded-full px-4 py-1.5 text-sm text-primary-200 mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Curated Collection
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                {page.heading || page.title}
              </h1>
              {page.subheading && (
                <p className="text-xl text-primary-200 leading-relaxed">{page.subheading}</p>
              )}
              <div className="flex items-center gap-6 mt-8 text-sm text-primary-300">
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {tools.length} tools curated
                </span>
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Updated regularly
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {tools.length === 0 ? (
            <div className="text-center py-20 text-secondary-500">No tools found for this collection.</div>
          ) : (
            <>
              {/* Top 3 featured */}
              {topTools.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-secondary-900 mb-2">Top Picks</h2>
                  <p className="text-secondary-500 mb-6">The highest-rated tools in this collection</p>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {topTools.map((tool, i) => (
                      <div key={tool.slug} className="relative bg-white rounded-2xl border border-secondary-200 p-6 shadow-sm hover:shadow-md transition-all hover:border-primary-300 group">
                        <div className="absolute -top-3 left-5">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            i === 0 ? 'bg-amber-400 text-amber-900' :
                            i === 1 ? 'bg-secondary-300 text-secondary-700' :
                            'bg-orange-200 text-orange-700'
                          }`}>
                            #{i + 1}
                          </span>
                        </div>
                        <div className="mt-2 mb-3">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/tools/${tool.slug}`} className="text-lg font-bold text-secondary-900 group-hover:text-primary-600 transition-colors leading-snug">
                              {tool.name}
                            </Link>
                            {tool.website_url && (
                              <a href={tool.website_url} target="_blank" rel="noopener noreferrer" className="text-secondary-400 hover:text-primary-600 flex-shrink-0">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                          {tool.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-sm font-medium text-secondary-700">{tool.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-secondary-500 leading-relaxed mb-4 line-clamp-3">{tool.description}</p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getPricingColor(tool.pricing)}`}>
                            {getPricingLabel(tool.pricing)}
                          </span>
                          <Link href={`/tools/${tool.slug}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                            Learn more →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remaining tools */}
              {remainingTools.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-secondary-900 mb-2">All Tools</h2>
                  <p className="text-secondary-500 mb-6">{remainingTools.length} more tools in this collection</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {remainingTools.map(tool => (
                      <Link key={tool.slug} href={`/tools/${tool.slug}`} className="flex items-center gap-4 bg-white rounded-xl border border-secondary-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors truncate">{tool.name}</span>
                          </div>
                          <p className="text-xs text-secondary-500 line-clamp-2">{tool.description}</p>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getPricingColor(tool.pricing)}`}>
                            {getPricingLabel(tool.pricing)}
                          </span>
                          {tool.rating && (
                            <span className="flex items-center gap-0.5 text-xs text-secondary-500">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {tool.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
