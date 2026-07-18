import { prisma } from '@/lib/prisma';
import { assertCanSetStatus, type EditorRole } from '@/lib/blog-post-service';

// =====================================================
// BLOG BULK MANAGEMENT ACTIONS
// Every action here uses updateMany/deleteMany — one or two queries
// total per call, never one query per selected post — and validates the
// full selection in a single query before doing anything. Permission
// checks reuse assertCanSetStatus (Task 31) for publish/archive rather
// than re-deriving the ADMIN/EDITOR rule a second time; delete and
// category-update follow the same "route checks permission, this module
// just does the work" split every single-post route in this codebase
// already uses (deletePost()/updatePost() also have no internal
// permission check of their own).
// =====================================================

export interface BulkActionResult {
  succeeded: string[];
  failed: Array<{ id: string; reason: string }>;
}

const MAX_BULK_SIZE = 100;

/**
 * Validate a selection: every id must be a non-empty string, the batch
 * must not exceed MAX_BULK_SIZE, and every id must actually correspond to
 * an existing post — checked with a single findMany(... in ...) query
 * regardless of how many ids were selected, not one existence check per id.
 */
async function validateSelection(ids: string[]): Promise<{ validIds: string[]; failed: BulkActionResult['failed'] }> {
  if (ids.length === 0) {
    throw new Error('Select at least one post');
  }
  if (ids.length > MAX_BULK_SIZE) {
    throw new Error(`Bulk actions are limited to ${MAX_BULK_SIZE} posts at a time`);
  }

  const uniqueIds = Array.from(new Set(ids.filter((id) => typeof id === 'string' && id.length > 0)));

  const existing = await prisma.blogPost.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, published: true },
  });
  const existingIds = new Set(existing.map((p) => p.id));

  const failed = uniqueIds
    .filter((id) => !existingIds.has(id))
    .map((id) => ({ id, reason: 'Post not found' }));

  return { validIds: Array.from(existingIds), failed };
}

/**
 * Publish every selected post. Preserves the same publishedAt logic as
 * publishPost() (Task 9/31) — a post being published for the first time
 * gets publishedAt set to now; an already-published post being
 * re-included in a bulk publish keeps its original publishedAt rather
 * than having it overwritten. Since a single updateMany can't set
 * different values per row, the selection is split into two groups and
 * run as (at most) two updateMany calls in one transaction — still O(1)
 * queries relative to selection size, not O(n).
 */
export async function bulkPublish(ids: string[], role: EditorRole): Promise<BulkActionResult> {
  assertCanSetStatus(role, 'PUBLISHED');

  const { validIds, failed } = await validateSelection(ids);
  if (validIds.length === 0) return { succeeded: [], failed };

  const posts = await prisma.blogPost.findMany({
    where: { id: { in: validIds } },
    select: { id: true, published: true },
  });

  const newlyPublished = posts.filter((p) => !p.published).map((p) => p.id);
  const alreadyPublished = posts.filter((p) => p.published).map((p) => p.id);

  await prisma.$transaction([
    ...(newlyPublished.length > 0
      ? [
          prisma.blogPost.updateMany({
            where: { id: { in: newlyPublished } },
            data: { published: true, status: 'PUBLISHED', publishedAt: new Date() },
          }),
        ]
      : []),
    ...(alreadyPublished.length > 0
      ? [
          prisma.blogPost.updateMany({
            where: { id: { in: alreadyPublished } },
            data: { published: true, status: 'PUBLISHED' },
          }),
        ]
      : []),
  ]);

  return { succeeded: validIds, failed };
}

/**
 * Archive every selected post — same rule as archivePost() (Task 31):
 * published becomes false, status becomes ARCHIVED, publishedAt is left
 * untouched so archived posts still record when they were originally
 * published. Every selected post gets identical values, so this is a
 * single updateMany regardless of selection size.
 */
export async function bulkArchive(ids: string[], role: EditorRole): Promise<BulkActionResult> {
  assertCanSetStatus(role, 'ARCHIVED');

  const { validIds, failed } = await validateSelection(ids);
  if (validIds.length === 0) return { succeeded: [], failed };

  await prisma.blogPost.updateMany({
    where: { id: { in: validIds } },
    data: { status: 'ARCHIVED', published: false },
  });

  return { succeeded: validIds, failed };
}

/**
 * Delete every selected post in a single deleteMany. No internal
 * permission check — the caller (the API route) is expected to have
 * already checked canDeleteBlogPosts(), same as the single-post DELETE
 * route does before calling deletePost().
 */
export async function bulkDelete(ids: string[]): Promise<BulkActionResult> {
  const { validIds, failed } = await validateSelection(ids);
  if (validIds.length === 0) return { succeeded: [], failed };

  await prisma.blogPost.deleteMany({ where: { id: { in: validIds } } });

  return { succeeded: validIds, failed };
}

/**
 * Move every selected post to a different category in a single
 * updateMany. Validates the target category exists before touching
 * anything — an invalid categoryId fails the whole call rather than
 * silently assigning posts to a nonexistent category. No internal
 * permission check, same reasoning as bulkDelete — the caller is
 * expected to have already checked canEditBlogPosts().
 */
export async function bulkUpdateCategory(ids: string[], categoryId: string): Promise<BulkActionResult> {
  const category = await prisma.blogCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) {
    throw new Error('Target category not found');
  }

  const { validIds, failed } = await validateSelection(ids);
  if (validIds.length === 0) return { succeeded: [], failed };

  await prisma.blogPost.updateMany({
    where: { id: { in: validIds } },
    data: { categoryId },
  });

  return { succeeded: validIds, failed };
}
