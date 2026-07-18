import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogPostCard from '@/components/BlogPostCard';
import { buildMetadata } from '@/lib/seo/metadata';
import { buildAuthorMetadata } from '@/lib/seo/blog';
import { breadcrumbJsonLd, organizationJsonLd, toJsonLdScript } from '@/lib/seo/json-ld';
import { getAuthorProfile, getPublishedPostsByAuthor } from '@/lib/blog-authors';

export const revalidate = 3600; // Revalidate every hour

const PAGE_SIZE = 9;

interface AuthorPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { id } = await params;
  const author = await getAuthorProfile(id);

  if (!author) {
    return buildMetadata({
      title: 'Author not found | LaunchPilot',
      path: `/blog/authors/${id}`,
      noindex: true,
    });
  }

  return buildAuthorMetadata(author);
}

export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
  const { id } = await params;
  const { page } = await searchParams;

  const author = await getAuthorProfile(id);
  if (!author) {
    notFound();
  }

  // Only this author's published posts — getPublishedPostsByAuthor()
  // filters published: true at the query level (same guarantee the rest
  // of the blog feature relies on), so drafts never reach this page, and
  // the post count shown below is never inflated by unpublished content.
  const posts = await getPublishedPostsByAuthor(id);

  const requestedPage = parseInt(page ?? '1', 10) || 1;
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const paginated = posts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const buildUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/blog/authors/${id}${qs ? `?${qs}` : ''}`;
  };

  const displayName = author.name || 'LaunchPilot Author';

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog' },
    { name: displayName, href: `/blog/authors/${id}` },
  ];

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(breadcrumbJsonLd(breadcrumbs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(organizationJsonLd()) }}
      />

      <main className="py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm text-secondary-500 hover:text-primary-600 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to blog
          </Link>

          <div className="flex items-center gap-4 mb-10">
            <div className="h-16 w-16 rounded-full bg-secondary-100 flex items-center justify-center overflow-hidden shrink-0">
              {author.image ? (
                <Image
                  src={author.image}
                  alt={displayName}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserIcon className="h-8 w-8 text-secondary-400" />
              )}
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-secondary-900">{displayName}</h1>
              {author.bio && <p className="text-secondary-500 mt-1 max-w-2xl">{author.bio}</p>}
              <p className="text-sm text-secondary-400 mt-1">
                {posts.length} published {posts.length === 1 ? 'post' : 'posts'}
              </p>
            </div>
          </div>

          {paginated.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-secondary-500">No published posts yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              {currentPage > 1 ? (
                <Link
                  href={buildUrl(currentPage - 1)}
                  className="p-2 rounded-lg border border-secondary-200 hover:bg-secondary-50"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              ) : (
                <span className="p-2 rounded-lg border border-secondary-200 opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                </span>
              )}

              <span className="text-sm text-secondary-600">
                Page {currentPage} of {totalPages}
              </span>

              {currentPage < totalPages ? (
                <Link
                  href={buildUrl(currentPage + 1)}
                  className="p-2 rounded-lg border border-secondary-200 hover:bg-secondary-50"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="p-2 rounded-lg border border-secondary-200 opacity-40">
                  <ChevronRight className="h-4 w-4" />
                </span>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
