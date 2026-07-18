import matter from 'gray-matter';
import { z } from 'zod';
import { getBySlug } from '@/lib/blog-posts';
import { createPost } from '@/lib/blog-post-service';
import { getBlogCategoryBySlug } from '@/lib/blog-categories';

// =====================================================
// BLOG IMPORT SYSTEM
// Reuses the existing markdown+frontmatter parsing approach already used
// for tool content (gray-matter, src/lib/tools.ts) instead of a new
// parser, and reuses the existing create-post validation/service
// (blog-post-service.ts#createPost, backed by createBlogPostSchema)
// instead of a separate import-only write path or a second set of
// validation rules.
// =====================================================

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export interface ImportSource {
  /** A label for error/report messages — filename, or e.g. "item 3". */
  label: string;
  /** 'markdown' = raw markdown text with YAML frontmatter (parsed via gray-matter). 'structured' = an already-parsed object (e.g. from JSON). */
  type: 'markdown' | 'structured';
  content: string | Record<string, unknown>;
}

export interface ImportedItem {
  label: string;
  slug: string;
  postId: string;
}

export interface SkippedItem {
  label: string;
  slug?: string;
  reason: string;
}

export interface FailedItem {
  label: string;
  error: string;
}

export interface ImportReport {
  imported: ImportedItem[];
  skipped: SkippedItem[];
  errors: FailedItem[];
}

interface NormalizedFields {
  title?: unknown;
  slug?: unknown;
  description?: unknown;
  excerpt?: unknown;
  content?: unknown;
  category?: unknown;
  categoryId?: unknown;
  tags?: unknown;
  coverImage?: unknown;
}

/** Markdown → { frontmatter fields, content body } via gray-matter; structured input is used as-is. */
function normalize(source: ImportSource): NormalizedFields {
  if (source.type === 'markdown') {
    const raw = typeof source.content === 'string' ? source.content : '';
    const { data, content } = matter(raw);
    return { ...data, content };
  }
  return (typeof source.content === 'object' && source.content !== null ? source.content : {}) as NormalizedFields;
}

/**
 * Import a batch of blog posts from markdown files (with YAML frontmatter)
 * or already-structured content objects.
 *
 * Never overwrites an existing post: any item whose slug already exists
 * is skipped outright, not merged or replaced, no matter how different
 * the imported content is — duplicate prevention here means "leave it
 * alone", not "update it".
 *
 * Every item is processed independently and never throws for the whole
 * batch — one invalid or duplicate item is recorded and processing
 * continues, so a report always reflects the true outcome of every item
 * rather than an all-or-nothing failure.
 *
 * Imported posts are always created as drafts (`published: false`) —
 * import should never make unreviewed content live on its own.
 */
export async function importBlogPosts(sources: ImportSource[], authorId?: string): Promise<ImportReport> {
  const report: ImportReport = { imported: [], skipped: [], errors: [] };

  for (const source of sources) {
    try {
      const fields = normalize(source);

      const title = typeof fields.title === 'string' ? fields.title.trim() : '';
      const rawSlug = typeof fields.slug === 'string' && fields.slug.trim() ? fields.slug : title;
      const slug = slugify(String(rawSlug || ''));

      if (!slug) {
        report.errors.push({ label: source.label, error: 'No title or slug found — nothing to import' });
        continue;
      }

      // Duplicate prevention / never overwrite.
      const existing = await getBySlug(slug);
      if (existing) {
        report.skipped.push({ label: source.label, slug, reason: `A post with slug "${slug}" already exists` });
        continue;
      }

      let categoryId: string | undefined;
      if (typeof fields.categoryId === 'string' && fields.categoryId) {
        categoryId = fields.categoryId;
      } else if (typeof fields.category === 'string' && fields.category) {
        const category = await getBlogCategoryBySlug(slugify(fields.category));
        categoryId = category?.id;
      }

      const tags = Array.isArray(fields.tags)
        ? fields.tags.filter((t): t is string => typeof t === 'string')
        : typeof fields.tags === 'string'
          ? fields.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [];

      // Validated by the same createBlogPostSchema every other post
      // creation path uses — an item missing a resolvable category, or
      // otherwise invalid, is reported as an error for that item, not
      // silently dropped or force-created with bad data.
      const post = await createPost(
        {
          title,
          slug,
          description: typeof fields.description === 'string' ? fields.description : undefined,
          excerpt: typeof fields.excerpt === 'string' ? fields.excerpt : undefined,
          content: typeof fields.content === 'string' ? fields.content : '',
          categoryId,
          coverImage: typeof fields.coverImage === 'string' ? fields.coverImage : undefined,
          tags,
          published: false,
        },
        authorId
      );

      report.imported.push({ label: source.label, slug, postId: post.id });
    } catch (error) {
      const message =
        error instanceof z.ZodError
          ? error.issues.map((issue) => issue.message).join('; ')
          : error instanceof Error
            ? error.message
            : 'Unknown error';
      report.errors.push({ label: source.label, error: message });
    }
  }

  return report;
}
