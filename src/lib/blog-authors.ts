import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// =====================================================
// BLOG AUTHOR SYSTEM
// Deliberately does NOT introduce a separate "author" entity.
// A blog author is just a User (reusing the existing user model and
// authentication, per this task's own instructions) who has written at
// least one post. Name and avatar already exist on User (name, image);
// this only adds `bio`. The authorship relationship itself
// (BlogPost.authorId -> User.blogPosts) has existed since the initial
// schema — nothing new needed there.
// =====================================================

export const updateAuthorProfileSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().max(500, 'Bio must be 500 characters or fewer').optional().nullable(),
  image: z.string().optional().nullable(),
});

export type UpdateAuthorProfileInput = z.infer<typeof updateAuthorProfileSchema>;

const AUTHOR_SELECT = {
  id: true,
  name: true,
  bio: true,
  image: true,
} as const;

/** Users who have authored at least one blog post, with their post count. */
export async function listAuthors() {
  return prisma.user.findMany({
    where: { blogPosts: { some: {} } },
    select: {
      ...AUTHOR_SELECT,
      _count: { select: { blogPosts: true } },
    },
    orderBy: { name: 'asc' },
  });
}

/** A single author's profile (name, bio, avatar) plus their post count. */
export async function getAuthorProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...AUTHOR_SELECT,
      _count: { select: { blogPosts: true } },
    },
  });
}

/**
 * Update an author's profile fields only (name, bio, avatar) — deliberately
 * narrow. This never touches role, password, email, or anything
 * authentication-related; those stay owned by the existing user
 * management (`/api/admin/users`), not this blog-scoped repository.
 */
export async function updateAuthorProfile(userId: string, data: UpdateAuthorProfileInput) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: AUTHOR_SELECT,
  });
}

/** Published posts by a given author, most recent first. */
export async function getPublishedPostsByAuthor(authorId: string) {
  return prisma.blogPost.findMany({
    where: { authorId, published: true },
    include: { category: true },
    orderBy: { publishedAt: 'desc' },
  });
}
