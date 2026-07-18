import matter from 'gray-matter';
import { z } from 'zod';
import { getPublished } from '@/lib/blog-posts';
import { listBlogCategories } from '@/lib/blog-categories';
import { listBlogTags } from '@/lib/blog-tags';

// =====================================================
// BLOG CONTENT EXPORT SYSTEM
// Built entirely on the existing repositories — getPublished()
// (src/lib/blog-posts.ts), listBlogCategories() (blog-categories.ts),
// listBlogTags() (blog-tags.ts). No new queries against models these
// don't already expose, and no separate "export" data-access layer.
//
// The exported post shape intentionally matches the field vocabulary
// Task 35's import system reads (title/slug/description/excerpt/content/
// category/tags/coverImage) — export and import are meant to round-trip.
// =====================================================

const exportedPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable(),
  excerpt: z.string().nullable(),
  content: z.string(),
  category: z.string().nullable(), // category slug, not internal id — portable across environments
  tags: z.array(z.string()),
  coverImage: z.string().nullable(),
  publishedAt: z.string().nullable(), // ISO string
});
export type ExportedPost = z.infer<typeof exportedPostSchema>;

const exportedCategorySchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  publishedPostCount: z.number(),
});
export type ExportedCategory = z.infer<typeof exportedCategorySchema>;

const exportedTagSchema = z.object({
  name: z.string(),
  slug: z.string(),
});
export type ExportedTag = z.infer<typeof exportedTagSchema>;

const exportPayloadSchema = z.object({
  metadata: z.object({
    exportedAt: z.string(),
    totalPosts: z.number(),
    totalCategories: z.number(),
    totalTags: z.number(),
  }),
  categories: z.array(exportedCategorySchema),
  tags: z.array(exportedTagSchema),
  posts: z.array(exportedPostSchema),
});
export type ExportPayload = z.infer<typeof exportPayloadSchema>;

/**
 * Assemble the export payload. Only ever published content:
 * getPublished() filters `published: true` at the query level, so there
 * is no code path in this module capable of including a draft. Category/
 * tag post-counts are computed from that same published-only set, not
 * reused from the admin list functions' raw counts (which include
 * drafts) — an export must not leak draft counts either.
 */
async function assembleExportPayload(): Promise<ExportPayload> {
  const [posts, categories, tags] = await Promise.all([
    getPublished(),
    listBlogCategories(),
    listBlogTags(),
  ]);

  const publishedCountByCategory = new Map<string, number>();
  for (const post of posts) {
    if (post.categoryId) {
      publishedCountByCategory.set(post.categoryId, (publishedCountByCategory.get(post.categoryId) ?? 0) + 1);
    }
  }

  const exportedCategories: ExportedCategory[] = categories.map((category) => ({
    name: category.name,
    slug: category.slug,
    description: category.description,
    publishedPostCount: publishedCountByCategory.get(category.id) ?? 0,
  }));

  // Tag catalog only (name/slug) — deliberately no post-count here. Doing
  // that correctly would need a published-post-aware join against the
  // BlogPostTag relation, which none of the existing data access layers
  // expose yet; rather than add a new query for this one field, or risk
  // getting a draft-inclusive count wrong, tags are exported without one.
  const exportedTags: ExportedTag[] = tags.map((tag) => ({
    name: tag.name,
    slug: tag.slug,
  }));

  const exportedPosts: ExportedPost[] = posts.map((post) => {
    let parsedTags: string[] = [];
    try {
      parsedTags = post.tags ? JSON.parse(post.tags) : [];
    } catch {
      parsedTags = [];
    }
    return {
      title: post.title,
      slug: post.slug,
      description: post.description,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category?.slug ?? null,
      tags: parsedTags, // Parse JSON string to array for export
      coverImage: post.coverImage,
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    };
  });

  return {
    metadata: {
      exportedAt: new Date().toISOString(),
      totalPosts: exportedPosts.length,
      totalCategories: exportedCategories.length,
      totalTags: exportedTags.length,
    },
    categories: exportedCategories,
    tags: exportedTags,
    posts: exportedPosts,
  };
}

/**
 * Build and validate the export payload. The shape is fully controlled by
 * this module, so a validation failure here would indicate a real
 * internal bug — but it's checked anyway rather than trusted blindly,
 * since "validate exported data" was an explicit requirement, not just
 * "produce data that's probably fine".
 */
export async function buildJsonExport(): Promise<ExportPayload> {
  const payload = await assembleExportPayload();
  const result = exportPayloadSchema.safeParse(payload);

  if (!result.success) {
    console.error('Export payload failed validation:', result.error.issues);
    throw new Error('Export data failed validation');
  }

  return result.data;
}

export interface MarkdownExportFile {
  filename: string;
  content: string;
}

/**
 * One markdown file per post (YAML frontmatter + body), via gray-matter's
 * stringify() — the same library already used for parsing markdown
 * content in this codebase (src/lib/tools.ts, and Task 35's import), just
 * used in the opposite direction. Frontmatter field names match exactly
 * what Task 35's importer reads, so an exported bundle can be re-imported
 * without transformation ("preserve content structure").
 */
export async function buildMarkdownExport(): Promise<MarkdownExportFile[]> {
  const payload = await buildJsonExport();

  return payload.posts.map((post) => ({
    filename: `${post.slug}.md`,
    content: matter.stringify(post.content, {
      title: post.title,
      slug: post.slug,
      description: post.description ?? undefined,
      excerpt: post.excerpt ?? undefined,
      category: post.category ?? undefined,
      tags: post.tags,
      coverImage: post.coverImage ?? undefined,
      publishedAt: post.publishedAt ?? undefined,
    }),
  }));
}
