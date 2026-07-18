import { Metadata } from 'next';
import Link from 'next/link';
import { Search as SearchIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogPostCard from '@/components/BlogPostCard';
import { buildBlogListingMetadata } from '@/lib/seo/blog';
import { breadcrumbJsonLd, organizationJsonLd, toJsonLdScript } from '@/lib/seo/json-ld';
import { getPublished, searchPublished } from '@/lib/blog-posts';

export const revalidate = 3600; // Revalidate every hour

const PAGE_SIZE = 9;

interface BlogPageProps {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const { q, category } = await searchParams;
  return buildBlogListingMetadata({ category, query: q });
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { q, category, page } = await searchParams;
  const query = (q ?? '').trim();
  const requestedPage = parseInt(page ?? '1', 10) || 1;

  // getPublished() only returns posts where published = true, so drafts and
  // scheduled-but-not-yet-live posts (published: false either way) never reach this page.
  // Also used to build the category pill list/counts below, regardless of
  // whether a search is active.
  const posts = await getPublished();

  // Category list + counts derived only from published posts, so a category's
  // post count here can never hint at how many drafts exist behind the scenes.
  const categoryMap = new Map<string, { id: string; name: string; slug: string; count: number }>();
  for (const post of posts) {
    if (post.category) {
      const existing = categoryMap.get(post.category.id);
      if (existing) {
        existing.count += 1;
      } else {
        categoryMap.set(post.category.id, {
          id: post.category.id,
          name: post.category.name,
          slug: post.category.slug,
          count: 1,
        });
      }
    }
  }
  const categories = Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  let displayedPosts: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    description: string | null;
    coverImage: string | null;
    thumbnailImage: string | null;
    imageAlt: string | null;
    publishedAt: Date | null;
    category: { name: string; slug: string } | null;
  }>;
  let totalMatches: number;
  let currentPage: number;
  let totalPages: number;

  if (query) {
    // Search path: filtering (title/content/category/tags) and pagination
    // both happen in the database — see searchPublished() in
    // src/lib/blog-posts.ts. published = true is enforced in that query's
    // WHERE clause, not filtered afterward.
    const offset = (Math.max(1, requestedPage) - 1) * PAGE_SIZE;
    const result = await searchPublished(query, {
      limit: PAGE_SIZE,
      offset,
      categorySlug: category || null,
    });
    totalMatches = result.total;
    totalPages = Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));
    currentPage = Math.min(Math.max(1, requestedPage), totalPages);
    displayedPosts = result.posts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      description: post.description,
      coverImage: post.coverImage,
      thumbnailImage: post.thumbnailImage,
      imageAlt: post.imageAlt,
      publishedAt: post.publishedAt,
      category: post.categoryName && post.categorySlug ? { name: post.categoryName, slug: post.categorySlug } : null,
    }));
  } else {
    // Browsing path (no search query): unchanged from before — filter the
    // already-fetched published posts by category in memory and paginate
    // in memory. Not rewritten in this task since it isn't "search".
    const filtered = posts.filter((post) => !category || post.category?.slug === category);
    totalMatches = filtered.length;
    totalPages = Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));
    currentPage = Math.min(Math.max(1, requestedPage), totalPages);
    displayedPosts = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }

  const buildUrl = (overrides: { page?: number; category?: string | null }) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);

    const nextCategory = overrides.category !== undefined ? overrides.category : category;
    if (nextCategory) params.set('category', nextCategory);

    const nextPage = overrides.page ?? 1;
    if (nextPage > 1) params.set('page', String(nextPage));

    const qs = params.toString();
    return `/blog${qs ? `?${qs}` : ''}`;
  };

  const activeCategoryName = category ? categories.find((c) => c.slug === category)?.name ?? category : null;

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLdScript(
            breadcrumbJsonLd([
              { name: 'Home', href: '/' },
              { name: 'Blog', href: '/blog' },
            ])
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(organizationJsonLd()) }}
      />

      <main className="py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900">Blog</h1>
            <p className="text-secondary-500 mt-2">
              {totalMatches} {totalMatches === 1 ? 'post' : 'posts'}
              {activeCategoryName ? ` in "${activeCategoryName}"` : ''}
              {q ? ` matching "${q}"` : ''}
            </p>
          </div>

          <form action="/blog" method="get" className="mb-6 max-w-md">
            {category && <input type="hidden" name="category" value={category} />}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                type="search"
                name="q"
                defaultValue={q ?? ''}
                placeholder="Search posts..."
                className="input pl-10"
              />
            </div>
          </form>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <Link
                href={buildUrl({ category: null, page: 1 })}
                className={!category ? 'badge badge-primary' : 'badge badge-secondary'}
              >
                All
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={buildUrl({ category: cat.slug, page: 1 })}
                  className={category === cat.slug ? 'badge badge-primary' : 'badge badge-secondary'}
                >
                  {cat.name} ({cat.count})
                </Link>
              ))}
            </div>
          )}

          {displayedPosts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-secondary-500">No posts found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedPosts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              {currentPage > 1 ? (
                <Link
                  href={buildUrl({ page: currentPage - 1 })}
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
                  href={buildUrl({ page: currentPage + 1 })}
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
