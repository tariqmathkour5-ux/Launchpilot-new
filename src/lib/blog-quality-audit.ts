import { prisma } from '@/lib/prisma';
import { countWords } from '@/lib/reading-time';

// =====================================================
// BLOG QUALITY AUDIT SYSTEM
// Every check here is read-only — nothing in this file ever calls
// .update()/.create()/.delete(). Reuses existing data access (raw
// prisma.blogPost queries, same models every other blog module already
// uses) and the existing word-counting logic from Task 42 rather than a
// second implementation of "how long is this post".
// =====================================================

const MIN_WORD_COUNT = 300;

export interface AuditIssue {
  postId: string;
  slug: string;
  title: string;
  issue: string;
}

export interface AuditReport {
  generatedAt: string;
  missingSeoFields: AuditIssue[];
  missingImages: AuditIssue[];
  shortContent: AuditIssue[];
  brokenInternalLinks: AuditIssue[];
  duplicateSlugs: AuditIssue[];
}

/**
 * Runs every audit check and returns a single report. Only inspects
 * published posts — an unfinished draft missing an SEO title isn't a
 * "quality problem" worth surfacing, it's just not done yet.
 */
export async function runQualityAudit(): Promise<AuditReport> {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
      coverImage: true,
      seoTitle: true,
      seoDescription: true,
    },
  });

  const allSlugs = new Set(posts.map((p) => p.slug));

  const missingSeoFields: AuditIssue[] = [];
  const missingImages: AuditIssue[] = [];
  const shortContent: AuditIssue[] = [];
  const brokenInternalLinks: AuditIssue[] = [];

  for (const post of posts) {
    if (!post.seoTitle && !post.seoDescription) {
      missingSeoFields.push({
        postId: post.id,
        slug: post.slug,
        title: post.title,
        issue: 'No SEO title or description set (falls back to auto-generated values)',
      });
    }

    if (!post.coverImage) {
      missingImages.push({ postId: post.id, slug: post.slug, title: post.title, issue: 'No featured image set' });
    }

    const wordCount = countWords(post.content);
    if (wordCount < MIN_WORD_COUNT) {
      shortContent.push({
        postId: post.id,
        slug: post.slug,
        title: post.title,
        issue: `Only ${wordCount} words (below the ${MIN_WORD_COUNT}-word guideline)`,
      });
    }

    // Broken internal links: scan for /blog/<slug> references in the
    // post's own content and check each referenced slug actually exists.
    // A real, DB-verifiable check (not a live HTTP crawl of every link,
    // which is a different, much larger scope).
    const linkMatches = post.content.matchAll(/\/blog\/([a-z0-9-]+)/g);
    for (const match of linkMatches) {
      const referencedSlug = match[1];
      if (referencedSlug && !allSlugs.has(referencedSlug)) {
        brokenInternalLinks.push({
          postId: post.id,
          slug: post.slug,
          title: post.title,
          issue: `Links to "/blog/${referencedSlug}", which doesn't match any published post`,
        });
      }
    }
  }

  // Duplicate slugs: BlogPost.slug has a unique DB constraint, so this
  // can only ever be empty in practice — included anyway because it was
  // explicitly requested, and because it's a genuinely free check
  // (grouping already-fetched data, no extra query).
  const slugCounts = new Map<string, typeof posts>();
  for (const post of posts) {
    const list = slugCounts.get(post.slug) ?? [];
    list.push(post);
    slugCounts.set(post.slug, list);
  }
  const duplicateSlugs: AuditIssue[] = [];
  for (const [slug, group] of slugCounts) {
    if (group.length > 1) {
      for (const post of group) {
        duplicateSlugs.push({ postId: post.id, slug, title: post.title, issue: `Slug "${slug}" is shared by ${group.length} posts` });
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    missingSeoFields,
    missingImages,
    shortContent,
    brokenInternalLinks,
    duplicateSlugs,
  };
}
