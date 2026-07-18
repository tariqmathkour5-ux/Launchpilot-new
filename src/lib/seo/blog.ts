import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';

// =====================================================
// BLOG SEO METADATA
// Applies only to blog pages (/blog, /blog/[slug]).
// Builds on top of the existing buildMetadata() utility
// rather than duplicating canonical/OG/Twitter/robots
// logic — that utility remains the single source of truth
// for how metadata is shaped across the whole site.
// =====================================================

const SITE_NAME = 'LaunchPilot';
const SEO_TITLE_MAX = 70;
const SEO_DESCRIPTION_MAX = 160;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

interface BlogPostSeoInput {
  slug: string;
  title: string;
  excerpt?: string | null;
  description?: string | null;
  coverImage?: string | null;
  imageAlt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoCanonicalUrl?: string | null;
  seoOgImage?: string | null;
  seoNoIndex?: boolean;
}

/**
 * SEO title/description/canonical/OG/Twitter for a single blog post.
 * Task 48's admin-set overrides (seoTitle/seoDescription/seoCanonicalUrl/
 * seoOgImage/seoNoIndex) take priority when present; every field falls
 * back to the exact same auto-generated behavior as before when the
 * admin hasn't set an override — this doesn't change output for any post
 * that hasn't used the new SEO controls.
 */
export function buildBlogPostMetadata(post: BlogPostSeoInput): Metadata {
  const autoTitle = truncate(`${post.title} | ${SITE_NAME} Blog`, SEO_TITLE_MAX);
  const title = post.seoTitle ? truncate(post.seoTitle, SEO_TITLE_MAX) : autoTitle;

  const autoDescription = post.excerpt || post.description || `Read "${post.title}" on the ${SITE_NAME} blog.`;
  const description = post.seoDescription
    ? truncate(post.seoDescription, SEO_DESCRIPTION_MAX)
    : truncate(autoDescription, SEO_DESCRIPTION_MAX);

  // Use dynamic OG image if no custom SEO OG image is set
  const dynamicOgImage = !post.seoOgImage ? `/api/og/blog/${post.slug}` : undefined;
  
  return buildMetadata({
    title,
    description,
    path: `/blog/${post.slug}`,
    ogImage: post.seoOgImage || post.coverImage || dynamicOgImage,
    ogImageAlt: post.imageAlt || `${post.title} - LaunchPilot Blog`,
    noindex: post.seoNoIndex || false,
    canonicalUrl: post.seoCanonicalUrl || undefined,
  });
}

function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface BlogListingSeoFilters {
  category?: string | null;
  query?: string | null;
}

/**
 * SEO title/description/canonical for the blog listing page.
 * Aware of the active category/search filters so filtered views get a
 * distinct (but still bounded-length) title/description.
 *
 * `category` here is the slug from the URL, not a display name — this
 * function only has the slug available (no extra DB lookup just for a
 * title fragment), so it's humanized locally (`ai-news` -> `Ai News`).
 *
 * Indexing: free-text search (`query`) stays noindexed — it produces an
 * unbounded number of near-duplicate permutations with little standalone
 * SEO value. A category filter is different: it's a small, stable,
 * meaningful taxonomy, and Task 16 lists category URLs in the sitemap —
 * which only makes sense if they're indexable — so a category view gets
 * its own canonical URL (`/blog?category=slug`) instead of collapsing
 * onto the plain `/blog` canonical.
 */
export function buildBlogListingMetadata(filters: BlogListingSeoFilters = {}): Metadata {
  const titleParts = filters.category
    ? [humanizeSlug(filters.category), `${SITE_NAME} Blog`]
    : [`${SITE_NAME} Blog`];
  const title = truncate(titleParts.join(' — '), SEO_TITLE_MAX);

  const rawDescription = filters.query
    ? `Search results for "${filters.query}" on the ${SITE_NAME} blog.`
    : filters.category
      ? `${humanizeSlug(filters.category)} articles on the ${SITE_NAME} blog.`
      : `Guides, insights, and updates on AI tools from the ${SITE_NAME} team.`;
  const description = truncate(rawDescription, SEO_DESCRIPTION_MAX);

  const path = filters.category ? `/blog?category=${filters.category}` : '/blog';
  const noindex = Boolean(filters.query);

  return buildMetadata({
    title,
    description,
    path,
    noindex,
  });
}

interface BlogAuthorSeoInput {
  id: string;
  name: string | null;
  bio?: string | null;
  image?: string | null;
}

/** SEO title/description/canonical/OG for a public author page. */
export function buildAuthorMetadata(author: BlogAuthorSeoInput): Metadata {
  const displayName = author.name || 'LaunchPilot Author';
  const title = truncate(`${displayName} | ${SITE_NAME} Blog`, SEO_TITLE_MAX);
  const rawDescription = author.bio || `Posts written by ${displayName} on the ${SITE_NAME} blog.`;
  const description = truncate(rawDescription, SEO_DESCRIPTION_MAX);

  return buildMetadata({
    title,
    description,
    path: `/blog/authors/${author.id}`,
    ogImage: author.image || undefined,
  });
}
