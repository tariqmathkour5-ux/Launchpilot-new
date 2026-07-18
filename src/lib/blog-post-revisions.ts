import { prisma } from '@/lib/prisma';
import { update as updateBlogPost, type UpdateBlogPostInput } from '@/lib/blog-posts';

// =====================================================
// BLOG REVISION HISTORY
// =====================================================

export interface RevisionSnapshot {
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  description: string | null;
  categoryId: string | null;
}

/** Save a full-content snapshot of a post as a new revision. */
export async function createRevision(snapshot: RevisionSnapshot & { postId: string }, authorId?: string) {
  const { postId, ...content } = snapshot;

  return prisma.blogPostRevision.create({
    data: {
      postId,
      ...content,
      authorId,
    },
  });
}

/** Revisions for a post, most recent first, with the author's name/id. */
export async function listRevisions(postId: string) {
  return prisma.blogPostRevision.findMany({
    where: { postId },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getRevision(id: string) {
  return prisma.blogPostRevision.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true } } },
  });
}

/**
 * Restore a post to a previous revision's content.
 *
 * Self-contained: first snapshots the post's *current* content as its own
 * new revision (so the restore itself is always undoable), then applies
 * the target revision's content via the same update() every other content
 * edit uses (src/lib/blog-posts.ts). This is deliberately independent of
 * the auto-revision hook in blog-post-service.ts#updatePost (which covers
 * the normal "edit and save" flow from the live API route) — restore goes
 * through the repository directly, so it snapshots explicitly rather than
 * relying on a hook it doesn't go through.
 *
 * Does not touch published/status/tags — a restore only ever changes
 * content, exactly like every other update.
 */
export async function restoreRevision(revisionId: string, actorId?: string) {
  const revision = await prisma.blogPostRevision.findUnique({ where: { id: revisionId } });
  if (!revision) {
    throw new Error('Revision not found');
  }

  const currentPost = await prisma.blogPost.findUnique({ where: { id: revision.postId } });
  if (!currentPost) {
    throw new Error('Blog post not found');
  }

  await createRevision(
    {
      postId: currentPost.id,
      title: currentPost.title,
      slug: currentPost.slug,
      content: currentPost.content,
      excerpt: currentPost.excerpt,
      description: currentPost.description,
      categoryId: currentPost.categoryId,
    },
    actorId
  );

  const data: UpdateBlogPostInput = {
    title: revision.title,
    slug: revision.slug,
    content: revision.content,
    excerpt: revision.excerpt ?? undefined,
    description: revision.description ?? undefined,
    categoryId: revision.categoryId ?? undefined,
  };

  return updateBlogPost(revision.postId, data);
}
