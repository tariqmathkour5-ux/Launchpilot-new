import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// =====================================================
// VALIDATION
// =====================================================

// Reused for every blog media URL field (coverImage, thumbnailImage).
// Allows empty string (form-friendly "not set") alongside a real URL —
// same pattern already used for seoOgImage/seoCanonical in
// blog-post-validation.ts (Task 7). coverImage previously had NO format
// validation at all (just z.string()); this closes that gap too.
const mediaUrlSchema = z.string().url('Must be a valid URL').optional().or(z.literal(''));

// The 4-state content workflow this task adds. Kept alongside `published`/
// `publishedAt` (not replacing them) — see create()/update() below for how
// the two stay in sync.
export const blogPostStatusValues = ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;
const blogPostStatusSchema = z.enum(blogPostStatusValues);

export const createBlogPostSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  coverImage: mediaUrlSchema,
  thumbnailImage: mediaUrlSchema,
  imageAlt: z.string().max(200, 'Alt text must be 200 characters or fewer').optional(),
  categoryId: z.string().min(1, 'Category is required'),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  publishedAt: z.coerce.date().optional().nullable(),
  status: blogPostStatusSchema.optional(),
  tags: z.array(z.string()).default([]),
  seoTitle: z.string().max(70, 'SEO title should be 70 characters or fewer').optional(),
  seoDescription: z.string().max(160, 'SEO description should be 160 characters or fewer').optional(),
  seoCanonicalUrl: mediaUrlSchema,
  seoOgImage: mediaUrlSchema,
  seoNoIndex: z.boolean().default(false),
});

export const updateBlogPostSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  content: z.string().min(1).optional(),
  excerpt: z.string().optional().nullable(),
  coverImage: mediaUrlSchema.nullable(),
  thumbnailImage: mediaUrlSchema.nullable(),
  imageAlt: z.string().max(200, 'Alt text must be 200 characters or fewer').optional().nullable(),
  categoryId: z.string().min(1, 'Category is required').optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  status: blogPostStatusSchema.optional(),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().max(70, 'SEO title should be 70 characters or fewer').optional().nullable(),
  seoDescription: z.string().max(160, 'SEO description should be 160 characters or fewer').optional().nullable(),
  seoCanonicalUrl: mediaUrlSchema.nullable(),
  seoOgImage: mediaUrlSchema.nullable(),
  seoNoIndex: z.boolean().optional(),
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;

// =====================================================
// REPOSITORY
// =====================================================

/** Get all blog posts, most recent first. */
export async function getAll() {
  try {
    return await prisma.blogPost.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    throw new Error('Failed to fetch blog posts');
  }
}

/** Get only published blog posts, most recently published first. */
export async function getPublished() {
  try {
    return await prisma.blogPost.findMany({
      where: { published: true },
      include: {
        category: true,
        author: { select: { name: true, email: true } },
      },
      orderBy: { publishedAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching published blog posts:', error);
    throw new Error('Failed to fetch published blog posts');
  }
}

/** Get a single blog post by its slug. */
export async function getBySlug(slug: string) {
  try {
    return await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        category: true,
        blogPostTags: { include: { tag: true } },
        author: { select: { id: true, name: true } },
      },
    });
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    throw new Error('Failed to fetch blog post');
  }
}

export interface BlogSearchResult {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  description: string | null;
  coverImage: string | null;
  thumbnailImage: string | null;
  imageAlt: string | null;
  publishedAt: Date | null;
  categoryName: string | null;
  categorySlug: string | null;
}

/**
 * Find posts genuinely related to the given post: same category and/or
 * overlapping tags — the only two real relationship signals that exist in
 * this schema. Never pads the result with unrelated "recent posts" just to
 * hit a target count — if a post has no category and no tags in common with
 * anything else, this correctly returns an empty array rather than
 * fabricating a relationship that doesn't exist.
 *
 * Single query: the WHERE clause itself only matches rows that share the
 * category or have at least one overlapping tag (`tags && $tags`, the
 * Postgres array-overlap operator), so this never scans/loads the full
 * published-posts table the way computing "related" from `getPublished()`
 * in application code would. Ranked so same-category matches outrank
 * tag-only matches, and within each tier, more shared tags rank higher.
 */
export async function getRelatedPosts(
  post: { id: string; categoryId: string | null; tags: string[] },
  limit = 3
): Promise<BlogSearchResult[]> {
  try {
    return await prisma.$queryRaw<BlogSearchResult[]>`
      SELECT p.id, p.slug, p.title, p.excerpt, p.description, p."coverImage",
             p."thumbnailImage", p."imageAlt",
             p."publishedAt", c.name as "categoryName", c.slug as "categorySlug",
             (CASE WHEN p."categoryId" = ${post.categoryId} AND ${post.categoryId} IS NOT NULL THEN 1 ELSE 0 END)
               as category_match,
             cardinality(ARRAY(SELECT unnest(p.tags) INTERSECT SELECT unnest(${post.tags}::text[]))) as tag_overlap
      FROM "BlogPost" p
      LEFT JOIN "BlogCategory" c ON c.id = p."categoryId"
      WHERE p.published = true
        AND p.id != ${post.id}
        AND (
          (p."categoryId" = ${post.categoryId} AND ${post.categoryId} IS NOT NULL)
          OR p.tags && ${post.tags}::text[]
        )
      ORDER BY category_match DESC, tag_overlap DESC, p."publishedAt" DESC
      LIMIT ${limit}
    `;
  } catch (error) {
    console.error('Error fetching related blog posts:', error);
    throw new Error('Failed to fetch related blog posts');
  }
}

export interface BlogSearchOptions {
  limit?: number;
  offset?: number;
  categorySlug?: string | null;
}

/**
 * Search published blog posts by title, content, category name, or tags —
 * filtering and pagination both happen in the database (a single query for
 * results, one for the total count, run in parallel), not by fetching every
 * published post and filtering/slicing in JS. `published = true` is part of
 * the WHERE clause itself, not a post-filter, so unpublished content can
 * never appear in a result regardless of how the query is called.
 *
 * Uses `$queryRaw` (the same escape hatch already used in `sitemap.ts` and
 * `collections/page.tsx`) rather than the typed Prisma query API, because
 * Prisma's array filters (`has`/`hasSome`) only support exact-element
 * matches on `tags`, not substring matches — this needs `unnest(tags)` to
 * search tags the same way title/content/category are searched.
 */
export async function searchPublished(query: string, options: BlogSearchOptions = {}) {
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;
  const term = `%${query}%`;

  try {
    const [rows, countRows] = options.categorySlug
      ? await Promise.all([
          prisma.$queryRaw<BlogSearchResult[]>`
            SELECT p.id, p.slug, p.title, p.excerpt, p.description, p."coverImage",
                   p."thumbnailImage", p."imageAlt",
                   p."publishedAt", c.name as "categoryName", c.slug as "categorySlug"
            FROM "BlogPost" p
            LEFT JOIN "BlogCategory" c ON c.id = p."categoryId"
            WHERE p.published = true
              AND c.slug = ${options.categorySlug}
              AND (
                p.title ILIKE ${term}
                OR p.content ILIKE ${term}
                OR c.name ILIKE ${term}
                OR EXISTS (SELECT 1 FROM unnest(p.tags) t WHERE t ILIKE ${term})
              )
            ORDER BY p."publishedAt" DESC
            LIMIT ${limit} OFFSET ${offset}
          `,
          prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*)::bigint as count
            FROM "BlogPost" p
            LEFT JOIN "BlogCategory" c ON c.id = p."categoryId"
            WHERE p.published = true
              AND c.slug = ${options.categorySlug}
              AND (
                p.title ILIKE ${term}
                OR p.content ILIKE ${term}
                OR c.name ILIKE ${term}
                OR EXISTS (SELECT 1 FROM unnest(p.tags) t WHERE t ILIKE ${term})
              )
          `,
        ])
      : await Promise.all([
          prisma.$queryRaw<BlogSearchResult[]>`
            SELECT p.id, p.slug, p.title, p.excerpt, p.description, p."coverImage",
                   p."thumbnailImage", p."imageAlt",
                   p."publishedAt", c.name as "categoryName", c.slug as "categorySlug"
            FROM "BlogPost" p
            LEFT JOIN "BlogCategory" c ON c.id = p."categoryId"
            WHERE p.published = true
              AND (
                p.title ILIKE ${term}
                OR p.content ILIKE ${term}
                OR c.name ILIKE ${term}
                OR EXISTS (SELECT 1 FROM unnest(p.tags) t WHERE t ILIKE ${term})
              )
            ORDER BY p."publishedAt" DESC
            LIMIT ${limit} OFFSET ${offset}
          `,
          prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*)::bigint as count
            FROM "BlogPost" p
            LEFT JOIN "BlogCategory" c ON c.id = p."categoryId"
            WHERE p.published = true
              AND (
                p.title ILIKE ${term}
                OR p.content ILIKE ${term}
                OR c.name ILIKE ${term}
                OR EXISTS (SELECT 1 FROM unnest(p.tags) t WHERE t ILIKE ${term})
              )
          `,
        ]);

    return { posts: rows, total: Number(countRows[0]?.count ?? 0) };
  } catch (error) {
    console.error('Error searching blog posts:', error);
    throw new Error('Failed to search blog posts');
  }
}

/** Get a single blog post by its id. */
export async function getById(id: string) {
  try {
    return await prisma.blogPost.findUnique({
      where: { id },
      include: {
        category: true,
        blogPostTags: { include: { tag: true } },
      },
    });
  } catch (error) {
    console.error('Error fetching blog post by id:', error);
    throw new Error('Failed to fetch blog post');
  }
}

/** Create a new blog post. */
export async function create(data: CreateBlogPostInput, authorId?: string) {
  const { published, publishedAt, status, tags, ...rest } = data;

  // `status`, when explicitly provided, is authoritative for `published` —
  // a single source of truth rather than two fields that could disagree.
  // Existing callers that never pass `status` (every caller before this
  // task) get byte-identical behavior to before: resolvedPublished falls
  // straight through to the original `published` value.
  const resolvedPublished = status !== undefined ? status === 'PUBLISHED' : published;
  const resolvedStatus = status ?? (published ? 'PUBLISHED' : 'DRAFT');
  const resolvedPublishedAt = publishedAt !== undefined ? publishedAt : resolvedPublished ? new Date() : null;

  try {
    return await prisma.blogPost.create({
      data: {
        ...rest,
        published: resolvedPublished,
        publishedAt: resolvedPublishedAt,
        status: resolvedStatus,
        authorId,
        tags: JSON.stringify(tags),
      },
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    throw new Error('Failed to create blog post');
  }
}

/** Update an existing blog post. */
export async function update(id: string, data: UpdateBlogPostInput) {
  let existing;
  try {
    existing = await prisma.blogPost.findUnique({ where: { id } });
  } catch (error) {
    console.error('Error looking up blog post for update:', error);
    throw new Error('Failed to update blog post');
  }

  if (!existing) {
    throw new Error('Blog post not found');
  }

  // If `status` is provided but `published` isn't, `status` drives whether
  // the post is published — same "explicit input is authoritative, but
  // untouched inputs preserve old behavior exactly" precedent as the
  // publishedAt-override logic below (added in Task 9).
  const effectivePublished =
    data.published !== undefined
      ? data.published
      : data.status !== undefined
        ? data.status === 'PUBLISHED'
        : undefined;

  const publishedAt =
    data.publishedAt !== undefined
      ? data.publishedAt
      : effectivePublished === undefined
        ? undefined
        : effectivePublished && !existing.published
          ? new Date()
          : effectivePublished
            ? existing.publishedAt
            : null;

  try {
    const { tags, ...rest } = data;
    return await prisma.blogPost.update({
      where: { id },
      data: {
        ...rest,
        ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
        ...(effectivePublished !== undefined ? { published: effectivePublished } : {}),
        ...(publishedAt !== undefined ? { publishedAt } : {}),
      },
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    throw new Error('Failed to update blog post');
  }
}

/** Delete a blog post. */
export async function deleteBlogPost(id: string) {
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Blog post not found');
  }

  try {
    await prisma.blogPost.delete({ where: { id } });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    throw new Error('Failed to delete blog post');
  }
}

/**
 * Posts for the editorial calendar within a date range (Task 53) — a
 * single query, selecting only the fields the calendar renders (not full
 * post bodies). Matches by publishedAt when set (anything published or
 * scheduled), falling back to createdAt for pure drafts that have no
 * publish date yet.
 */
export async function getPostsForCalendar(startDate: Date, endDate: Date) {
  return prisma.blogPost.findMany({
    where: {
      OR: [
        { publishedAt: { gte: startDate, lte: endDate } },
        { AND: [{ publishedAt: null }, { createdAt: { gte: startDate, lte: endDate } }] },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      author: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

// =====================================================
// BACKWARD-COMPATIBLE ALIASES
// (kept so the existing /api/admin/blog routes, built in
// Task 4, keep working without being touched in this task)
// =====================================================

export const listBlogPosts = getAll;
export const getBlogPostById = getById;
export const createBlogPost = create;
export const updateBlogPost = update;
