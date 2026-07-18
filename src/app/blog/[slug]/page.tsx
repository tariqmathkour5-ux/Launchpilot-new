import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, ArrowLeft, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogPostCard from '@/components/BlogPostCard';
import BlogViewTracker from '@/components/BlogViewTracker';
import BlogTableOfContents from '@/components/BlogTableOfContents';
import BlogReadingProgress from '@/components/BlogReadingProgress';
import { buildMetadata } from '@/lib/seo/metadata';
import { buildBlogPostMetadata } from '@/lib/seo/blog';
import { breadcrumbJsonLd, blogPostingJsonLd, organizationJsonLd, toJsonLdScript } from '@/lib/seo/json-ld';
import { renderMarkdownContent } from '@/lib/markdown';
import { calculateReadingTime } from '@/lib/reading-time';
import { generateTableOfContents } from '@/lib/table-of-contents';
import { getBySlug, getRelatedPosts } from '@/lib/blog-posts';
import { buildInternalLinks } from '@/lib/blog-internal-links';

export const revalidate = 3600; // Revalidate every hour

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBySlug(slug);

  if (!post || !post.published) {
    return buildMetadata({
      title: 'Post not found | LaunchPilot',
      path: `/blog/${slug}`,
      noindex: true,
    });
  }

  return buildBlogPostMetadata(post);
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBySlug(slug);

  // Never render a draft or scheduled post here, even if the slug is
  // guessed or linked directly — only a published post is servable.
  if (!post || !post.published) {
    notFound();
  }

  const relatedResults = await getRelatedPosts(
    { id: post.id, categoryId: post.categoryId, tags: post.tags ? JSON.parse(post.tags) : [] },
    3
  );
  const related = relatedResults.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    description: r.description,
    coverImage: r.coverImage,
    thumbnailImage: r.thumbnailImage,
    imageAlt: r.imageAlt,
    publishedAt: r.publishedAt,
    category: r.categoryName && r.categorySlug ? { name: r.categoryName, slug: r.categorySlug } : null,
  }));

  // Assembled entirely from data already fetched above (post.category,
  // post.blogPostTags, post.author, relatedResults) — no additional
  // queries. See src/lib/blog-internal-links.ts.
  const internalLinks = buildInternalLinks(post, relatedResults);
  const readingTime = calculateReadingTime(post.content);
  const tableOfContents = generateTableOfContents(post.content);

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog' },
    ...(post.category ? [{ name: post.category.name, href: `/blog?category=${post.category.slug}` }] : []),
    { name: post.title, href: `/blog/${post.slug}` },
  ];

  return (
    <>
      <Header />
      <BlogViewTracker postId={post.id} />
      <BlogReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(breadcrumbJsonLd(breadcrumbs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(blogPostingJsonLd(post)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(organizationJsonLd()) }}
      />

      <main className="py-8 lg:py-12">
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm text-secondary-500 hover:text-primary-600 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to blog
          </Link>

          <header>
            {post.category && (
              <Link href={`/blog?category=${post.category.slug}`} className="badge badge-primary inline-block mb-4">
                {post.category.name}
              </Link>
            )}

            <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900 leading-tight">
              {post.title}
            </h1>

            {post.publishedAt && (
              <div className="flex items-center gap-1.5 text-sm text-secondary-400 mt-4">
                <Calendar className="h-4 w-4" />
                <time dateTime={new Date(post.publishedAt).toISOString()}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                {internalLinks.author && (
                  <>
                    <span aria-hidden="true">·</span>
                    <Link href={internalLinks.author.href} className="hover:text-primary-600">
                      By {internalLinks.author.label}
                    </Link>
                  </>
                )}
                {readingTime > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {readingTime} min read
                    </span>
                  </>
                )}
              </div>
            )}
          </header>

          {post.coverImage && (
            <div className="mt-8 rounded-2xl overflow-hidden bg-secondary-100">
              <Image
                src={post.coverImage}
                alt={post.imageAlt || post.title}
                width={1200}
                height={630}
                priority
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          <div className="mt-8">
            <BlogTableOfContents headings={tableOfContents} />
          </div>

          <div className="prose prose-secondary max-w-none">
            {renderMarkdownContent(post.content)}
          </div>

          {internalLinks.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-secondary-100">
              {internalLinks.tags.map((tagLink) => (
                <Link key={tagLink.href} href={tagLink.href} className="badge badge-secondary hover:text-primary-600">
                  {tagLink.label}
                </Link>
              ))}
            </div>
          )}
        </article>

        {related.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-secondary-200">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">Related posts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((relatedPost) => (
                <BlogPostCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
