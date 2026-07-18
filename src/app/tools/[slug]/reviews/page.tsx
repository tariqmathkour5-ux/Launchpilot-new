import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star, MessageSquare } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { parseToolPage, parseReview, getAllToolSlugs, getAllTools } from '@/lib/tools';
import { renderMarkdownContent } from '@/lib/markdown';
import { prisma } from '@/lib/prisma';
import { buildMetadata } from '@/lib/seo/metadata';

interface ReviewPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  const slugs = getAllToolSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ReviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = parseToolPage(slug);
  if (!tool) return { title: 'Review Not Found' };

  return buildMetadata({
    title: `${tool.name} Review - Hands-On Analysis`,
    description: `Comprehensive ${tool.name} review with hands-on testing, pros and cons, pricing analysis, and comparison with alternatives.`,
    path: `/tools/${slug}/reviews`,
  });
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'text-warning-500 fill-warning-500' : 'text-secondary-200'}`}
        />
      ))}
    </div>
  );
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { slug } = await params;
  const tool = parseToolPage(slug);
  const review = parseReview(slug);

  if (!tool || !review) {
    notFound();
  }

  // SSR: Fetch user reviews dynamically
  const dbTool = await prisma.tool.findFirst({
    where: { slug },
    select: { id: true },
  }).catch(() => null);

  const userReviews = dbTool
    ? await prisma.userReview.findMany({
        where: { toolId: dbTool.id },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, image: true } } },
      }).catch(() => [])
    : [];

  const allTools = getAllTools();
  const relatedTools = allTools
    .filter((t) => t.category === tool.category && t.slug !== slug)
    .slice(0, 6);

  // Calculate aggregate user rating
  const userAvgRating = userReviews.length > 0
    ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length
    : null;

  return (
    <>
      <Header />

      <main className="py-8 lg:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-6">
            <Link
              href={`/tools/${slug}`}
              className="inline-flex items-center text-sm text-secondary-500 hover:text-primary-600"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to {tool.name}
            </Link>
          </nav>

          <article className="card p-6 lg:p-8">
            <header className="mb-8 pb-6 border-b border-secondary-200">
              <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
                {tool.name} Review
              </h1>
              <div className="flex items-center gap-4 text-sm text-secondary-500">
                <span>Last updated: {new Date().toLocaleDateString()}</span>
                {review.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-warning-500 fill-warning-500" />
                    <span className="font-medium text-secondary-900">{review.rating.toFixed(1)}</span>
                    <span>/5</span>
                  </div>
                )}
              </div>
            </header>

            <div className="prose prose-secondary max-w-none">
              {renderMarkdownContent(review.content)}
            </div>
          </article>

          {/* User Reviews Section */}
          {userReviews.length > 0 && (
            <section className="mt-12">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="h-5 w-5 text-primary-600" />
                <h2 className="text-xl font-bold text-secondary-900">
                  User Reviews ({userReviews.length})
                </h2>
                {userAvgRating && (
                  <span className="text-sm text-secondary-500">
                    Avg: {Number(userAvgRating.toFixed(1))} / 5
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {userReviews.map((userReview) => (
                  <div
                    key={userReview.id}
                    className="card p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-secondary-900">
                          {userReview.user?.name || 'Anonymous User'}
                        </span>
                        <RatingStars rating={userReview.rating} />
                        <span className="text-xs text-secondary-500">
                          {userReview.rating.toFixed(1)}
                        </span>
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
            </section>
          )}

          <div className="mt-8 flex gap-4">
            <Link href={`/tools/${slug}/alternatives`} className="btn btn-secondary">
              View Alternatives
            </Link>
            <Link href={`/tools/${slug}`} className="btn btn-primary">
              Back to Tool
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}