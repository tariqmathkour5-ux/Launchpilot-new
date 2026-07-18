// =====================================================
// BLOG INTERNAL LINKING SYSTEM
// A pure function, not a data-access layer: it takes data the caller has
// already fetched (a post with its category/tags/author included, plus
// an already-fetched related-posts list) and turns it into a list of
// internal links. Zero database queries of its own — "optimize queries"
// here means adding none, not just fewer than some baseline. The caller
// (the post detail page) already fetches everything this needs for its
// own rendering; this module reuses that data rather than re-fetching it.
//
// Every link is generated from a real foreign-key relationship already
// in the schema (categoryId -> BlogCategory, BlogPostTag -> BlogTag,
// authorId -> User, and Task 19's getRelatedPosts, itself built on real
// category/tag overlap) — never from scanning post content for keyword
// matches, which is exactly the kind of guessing that could link to the
// wrong thing ("do not generate fake links"). Every href also points at
// a route that actually exists in this app; see the tag-link note below
// for why tags don't get an invented dedicated route.
// =====================================================

export interface InternalLink {
  href: string;
  label: string;
}

interface LinkablePost {
  id: string;
  slug: string;
  title: string;
  category: { name: string; slug: string } | null;
  blogPostTags?: Array<{ tag: { id: string; name: string; slug: string } }>;
  author?: { id: string; name: string | null } | null;
}

interface RelatedPostLike {
  id: string;
  slug: string;
  title: string;
}

export interface InternalLinksResult {
  category: InternalLink | null;
  tags: InternalLink[];
  author: InternalLink | null;
  relatedPosts: InternalLink[];
}

export function buildInternalLinks(post: LinkablePost, relatedPosts: RelatedPostLike[] = []): InternalLinksResult {
  const category: InternalLink | null = post.category
    ? { href: `/blog?category=${post.category.slug}`, label: post.category.name }
    : null;

  // There is no dedicated tag-browsing route anywhere in this app (the
  // public blog only has category filtering, Task 12) — inventing one
  // here (e.g. `/blog/tags/[slug]`) would be exactly the "fake link"
  // this task says not to produce, since it would 404. Task 18's search
  // does search tags as a real, working query, so a tag link points
  // there instead — a real, functioning link, not a fabricated route.
  const tags: InternalLink[] = (post.blogPostTags ?? []).map(({ tag }) => ({
    href: `/blog?q=${encodeURIComponent(tag.name)}`,
    label: tag.name,
  }));

  const author: InternalLink | null =
    post.author && post.author.id
      ? { href: `/blog/authors/${post.author.id}`, label: post.author.name || 'View author' }
      : null;

  const relatedLinks: InternalLink[] = relatedPosts
    .filter((related) => related.id !== post.id)
    .map((related) => ({ href: `/blog/${related.slug}`, label: related.title }));

  return { category, tags, author, relatedPosts: relatedLinks };
}
