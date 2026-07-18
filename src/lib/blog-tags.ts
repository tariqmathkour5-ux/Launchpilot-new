import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// =====================================================
// VALIDATION
// =====================================================

export const createBlogTagSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
});

export const updateBlogTagSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
});

export type CreateBlogTagInput = z.infer<typeof createBlogTagSchema>;
export type UpdateBlogTagInput = z.infer<typeof updateBlogTagSchema>;

// =====================================================
// DELETE RESULT
// =====================================================

export type DeleteBlogTagResult =
  | { success: true }
  | { success: false; error: 'NOT_FOUND' }
  | { success: false; error: 'IN_USE'; postCount: number };

// =====================================================
// REPOSITORY — BlogTag
// =====================================================

export async function listBlogTags() {
  return prisma.blogTag.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { blogPostTags: true } } },
  });
}

export async function getBlogTagById(id: string) {
  return prisma.blogTag.findUnique({
    where: { id },
    include: { _count: { select: { blogPostTags: true } } },
  });
}

export async function getBlogTagBySlug(slug: string) {
  return prisma.blogTag.findUnique({
    where: { slug },
    include: { _count: { select: { blogPostTags: true } } },
  });
}

export async function createBlogTag(data: CreateBlogTagInput) {
  return prisma.blogTag.create({ data });
}

export async function updateBlogTag(id: string, data: UpdateBlogTagInput) {
  return prisma.blogTag.update({ where: { id }, data });
}

export async function deleteBlogTag(id: string): Promise<DeleteBlogTagResult> {
  const tag = await prisma.blogTag.findUnique({
    where: { id },
    include: { _count: { select: { blogPostTags: true } } },
  });

  if (!tag) {
    return { success: false, error: 'NOT_FOUND' };
  }

  if (tag._count.blogPostTags > 0) {
    return { success: false, error: 'IN_USE', postCount: tag._count.blogPostTags };
  }

  await prisma.blogTag.delete({ where: { id } });
  return { success: true };
}

// =====================================================
// REPOSITORY — BlogPostTag (the post <-> tag relationship)
// =====================================================

/** All tags attached to a given post. */
export async function getTagsForPost(postId: string) {
  const links = await prisma.blogPostTag.findMany({
    where: { postId },
    include: { tag: true },
    orderBy: { tag: { name: 'asc' } },
  });
  return links.map((link) => link.tag);
}

/** All posts a given tag is attached to (published or not — callers filter as needed). */
export async function getPostsForTag(tagId: string) {
  const links = await prisma.blogPostTag.findMany({
    where: { tagId },
    include: { post: true },
    orderBy: { post: { createdAt: 'desc' } },
  });
  return links.map((link) => link.post);
}

/** Attach a single tag to a post. No-op if the link already exists. */
export async function attachTagToPost(postId: string, tagId: string) {
  return prisma.blogPostTag.upsert({
    where: { postId_tagId: { postId, tagId } },
    create: { postId, tagId },
    update: {},
  });
}

/** Detach a single tag from a post. No-op if the link doesn't exist. */
export async function detachTagFromPost(postId: string, tagId: string) {
  await prisma.blogPostTag.deleteMany({ where: { postId, tagId } });
}

/**
 * Replace all of a post's tag links with exactly the given set of tag IDs
 * (adds missing links, removes links no longer wanted) in one transaction.
 */
export async function setPostTags(postId: string, tagIds: string[]) {
  const uniqueTagIds = Array.from(new Set(tagIds));

  await prisma.$transaction([
    prisma.blogPostTag.deleteMany({
      where: { postId, tagId: { notIn: uniqueTagIds } },
    }),
    ...uniqueTagIds.map((tagId) =>
      prisma.blogPostTag.upsert({
        where: { postId_tagId: { postId, tagId } },
        create: { postId, tagId },
        update: {},
      })
    ),
  ]);

  return getTagsForPost(postId);
}
