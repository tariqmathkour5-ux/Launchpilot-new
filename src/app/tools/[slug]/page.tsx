import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Star, ExternalLink, Check, X, Globe, Smartphone, MessageSquare } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ConversionModal from '@/components/ConversionModal';
import { ToolPerformanceTracker } from '@/components/ToolPerformanceTracker';
import { injectAffiliateIntoComparisonArticle } from '@/components/AffiliateButton';
import { parseToolPage, parseReview, parseAlternative, getAllToolSlugs, getAllTools } from '@/lib/tools';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { toJsonLdScript, enhancedToolJsonLd, breadcrumbJsonLd } from '@/lib/seo/json-ld';
import { buildMetadata } from '@/lib/seo/metadata';
import { buildToolInternalLinks, InternalLink } from '@/lib/tools-internal-links';
import { Tool } from '@/types';

// Lazy load non-critical components for better initial bundle size
const SimilarTools = dynamic(() => import('@/components/SimilarTools'), {
  loading: () => <div className="animate-pulse bg-secondary-100 h-64 rounded-lg" />,
  ssr: true,
});

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  const slugs = getAllToolSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Fetch user reviews for aggregate rating (SSR) - used in metadata and page
async function getUserReviewAggregate(slug: string) {
  try {
    // First find the tool in DB
    const dbTool = await prisma.tool.findFirst({
      where: { slug },
      select: { id: true },
    });

    if (!dbTool) return { avgRating: null, reviewCount: 0 };

    // Get average rating and count
    const reviews = await prisma.userReview.findMany({
      where: { toolId: dbTool.id },
      select: { rating: true },
    });

    if (reviews.length === 0) return { avgRating: null, reviewCount: 0 };

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    return { avgRating: Number(avgRating.toFixed(1)), reviewCount: reviews.length };
  } catch {
    return { avgRating: null, reviewCount: 0 };
  }
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = parseToolPage(slug);
  if (!tool) return { title: 'Tool Not Found' };

  // Get user rating for metadata
  const { avgRating: userAvgRating, reviewCount } = await getUserReviewAggregate(slug);
  const combinedRating = userAvgRating ?? tool.rating;

  return buildMetadata({
    title: `${tool.name} - Review, Pricing, and Alternatives`,
    description: tool.description,
    path: `/tools/${slug}`,
    category: tool.category,
    pricing: tool.pricing,
    rating: combinedRating,
    ogImage: `/api/og/tools/${slug}`,
    ogImageAlt: `${tool.name} - ${tool.category} Tool`,
  });
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 ${star <= rating ? 'text-warning-500 fill-warning-500' : 'text-secondary-200'}`}
        />
      ))}
    </div>
  );
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = parseToolPage(slug);
  const review = parseReview(slug);
  const alternative = parseAlternative(slug);

  if (!tool) {
    notFound();
  }

  const categorySlug = tool.category.toLowerCase().replace(/\s+/g, '-');

  // SSR: Fetch user reviews dynamically on each request
  const { avgRating: userAvgRating, reviewCount } = await getUserReviewAggregate(slug);

  // Fetch actual user reviews for display
  const dbTool = await prisma.tool.findFirst({
    where: { slug },
    select: { id: true },
  }).catch(() => null);

  const userReviews = dbTool
    ? await prisma.userReview.findMany({
        where: { toolId: dbTool.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, image: true } } },
      }).catch(() => [])
    : [];

  // Build breadcrumbs for JSON-LD
  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Tools', href: '/tools' },
    { name: tool.name, href: `/tools/${slug}` },
  ];

  // Calculate combined rating (editorial + user)
  const combinedRating = userAvgRating ?? review?.rating;

  // Build internal links for related tools
  const allTools = getAllTools();
  const internalLinks = buildToolInternalLinks(tool, allTools);

  // Convert InternalLink to Tool for SimilarTools component
  const similarTools: Tool[] = internalLinks.relatedByCategory
    .map(link => allTools.find(t => t.slug === link.href.replace('/tools/', '')))
    .filter((t): t is Tool => t !== undefined);

  return (
    <>
      <Header />

      {/* Enhanced JSON-LD with AggregateRating and Offers for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLdScript(enhancedToolJsonLd({
            name: tool.name,
            description: tool.description,
            slug: tool.slug,
            rating: combinedRating,
            reviewCount,
            pricing: tool.pricing,
            website_url: tool.website_url,
            has_free_tier: tool.has_free_tier,
          })),
        }}
      />
      {/* Related Tools JSON-LD ItemList */}
      {internalLinks.relatedByCategory.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: toJsonLdScript({
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              name: `Tools like ${tool.name}`,
              itemListElement: internalLinks.relatedByCategory.slice(0, 5).map((link, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://launchpilot.app'}${link.href}`,
                name: link.label,
              })),
            }),
          }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLdScript(breadcrumbJsonLd(breadcrumbs)),
        }}
      />

      <main className="py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <Link href="/tools" className="inline-flex items-center text-sm text-secondary-500 hover:text-primary-600">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Tools
            </Link>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header Card */}
              <div className="card p-6 lg:p-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <Link
                      href={`/categories/${categorySlug}`}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      {tool.category}
                    </Link>
                    <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900 mt-1">
                      {tool.name}
                    </h1>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {combinedRating && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-secondary-900">
                            {userAvgRating ?? review?.rating}
                          </span>
                          <span className="text-secondary-400">/5</span>
                        </div>
                        <RatingStars rating={combinedRating} />
                        {reviewCount > 0 && (
                          <span className="text-xs text-secondary-500">
                            {reviewCount} user review{reviewCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <p className="text-lg text-secondary-600 mb-6">{tool.description}</p>

                {tool.website_url && (
                  <a
                    href={tool.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    Visit Website
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                )}
              </div>

              {/* User Reviews Section (SSR) */}
              {userReviews.length > 0 && (
                <div className="card p-6 lg:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="h-5 w-5 text-primary-600" />
                    <h2 className="text-xl font-bold text-secondary-900">User Reviews</h2>
                  </div>
                  <div className="space-y-4">
                    {userReviews.map((userReview) => (
                      <div key={userReview.id} className="border-b border-secondary-200 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-secondary-900">
                              {userReview.user?.name || 'Anonymous User'}
                            </span>
                            <div className="flex items-center">
                              <RatingStars rating={userReview.rating} />
                              <span className="ml-1 text-sm text-secondary-500">
                                {userReview.rating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-secondary-400">
                            {new Date(userReview.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {userReview.title && (
                          <h3 className="font-semibold text-secondary-800 mb-1">
                            {userReview.title}
                          </h3>
                        )}
                        <p className="text-sm text-secondary-600">{userReview.content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/tools/${slug}/reviews`}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Read all reviews →
                    </Link>
                  </div>
                </div>
              )}

              {/* Key Features */}
              {tool.features.length > 0 && (
                <div className="card p-6 lg:p-8">
                  <h2 className="text-xl font-bold text-secondary-900 mb-4">Key Features</h2>
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {tool.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-accent-500 flex-shrink-0 mt-0.5" />
                        <span className="text-secondary-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Use Cases */}
              {tool.use_cases.length > 0 && (
                <div className="card p-6 lg:p-8">
                  <h2 className="text-xl font-bold text-secondary-900 mb-4">Use Cases</h2>
                  <ul className="space-y-3">
                    {tool.use_cases.map((useCase) => (
                      <li key={useCase} className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-600 text-xs font-semibold flex-shrink-0">
                          {useCase.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-secondary-700">{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pros & Cons */}
              <div className="grid sm:grid-cols-2 gap-6">
                {tool.pros.length > 0 && (
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-accent-700 mb-4">Pros</h3>
                    <ul className="space-y-2">
                      {tool.pros.map((pro) => (
                        <li key={pro} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-accent-500 flex-shrink-0 mt-1" />
                          <span className="text-secondary-700 text-sm">{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {tool.cons.length > 0 && (
                  <div className="card p-6">
                    <h3 className="text-lg font-bold text-error-600 mb-4">Cons</h3>
                    <ul className="space-y-2">
                      {tool.cons.map((con) => (
                        <li key={con} className="flex items-start gap-2">
                          <X className="h-4 w-4 text-error-500 flex-shrink-0 mt-1" />
                          <span className="text-secondary-700 text-sm">{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <div className="card p-6">
                <h3 className="font-semibold text-secondary-900 mb-4">Quick Info</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-secondary-500">Pricing</dt>
                    <dd className="font-medium text-secondary-900 capitalize">{tool.pricing}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary-500">Free Tier</dt>
                    <dd>
                      {tool.has_free_tier ? (
                        <span className="badge badge-success">Yes</span>
                      ) : (
                        <span className="badge badge-secondary">No</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary-500">API</dt>
                    <dd>
                      {tool.has_api ? (
                        <span className="badge badge-primary">Available</span>
                      ) : (
                        <span className="badge badge-secondary">No</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Platforms */}
              {tool.platforms.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-semibold text-secondary-900 mb-4">Platforms</h3>
                  <div className="flex flex-wrap gap-2">
                    {tool.platforms.map((platform) => (
                      <span key={platform} className="badge badge-secondary flex items-center gap-1">
                        {platform === 'Web' || platform === 'iOS' || platform === 'Android' ? (
                          <Smartphone className="h-3 w-3" />
                        ) : (
                          <Globe className="h-3 w-3" />
                        )}
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Integrations */}
              {tool.integrations.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-semibold text-secondary-900 mb-4">Integrations</h3>
                  <div className="flex flex-wrap gap-2">
                    {tool.integrations.map((int) => (
                      <span key={int} className="badge badge-secondary">
                        {int}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Tools by Category */}
              {internalLinks.relatedByCategory.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-semibold text-secondary-900 mb-4">Related Tools</h3>
                  <ul className="space-y-2">
                    {internalLinks.relatedByCategory.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Internal Links */}
              <div className="card p-6 space-y-3">
                <h3 className="font-semibold text-secondary-900 mb-4">Learn More</h3>
                <Link
                  href={`/tools/${slug}/reviews`}
                  className="block w-full btn btn-secondary justify-between"
                >
                  <span>Read Full Review</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Link>
                <Link
                  href={`/tools/${slug}/alternatives`}
                  className="block w-full btn btn-secondary justify-between"
                >
                  <span>See Alternatives</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Performance Tracking for Tool Detail Page */}
      <ToolPerformanceTracker toolSlug={tool.slug} />

      {/* Similar Tools Section */}
      <SimilarTools 
        similarTools={similarTools} 
        currentToolSlug={tool.slug} 
      />

      {/* Smart Conversion Modal - Exit Intent Popup */}
      <ConversionModal
        toolName={tool.name}
        toolSlug={tool.slug}
        discount="25% OFF"
      />

      <Footer />
    </>
  );
}
