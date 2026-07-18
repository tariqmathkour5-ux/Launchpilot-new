import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// =====================================================
// VALIDATION
// =====================================================

export const createBlogCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().default(0),
});

export const updateBlogCategorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  order: z.number().optional(),
});

export type CreateBlogCategoryInput = z.infer<typeof createBlogCategorySchema>;
export type UpdateBlogCategoryInput = z.infer<typeof updateBlogCategorySchema>;

// =====================================================
// DELETE RESULT
// =====================================================

export type DeleteBlogCategoryResult =
  | { success: true }
  | { success: false; error: 'NOT_FOUND' }
  | { success: false; error: 'IN_USE'; postCount: number };

// =====================================================
// SERVICE / REPOSITORY
// =====================================================

export async function listBlogCategories() {
  return prisma.blogCategory.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { posts: true } } },
  });
}

export async function getBlogCategoryById(id: string) {
  return prisma.blogCategory.findUnique({
    where: { id },
    include: { _count: { select: { posts: true } } },
  });
}

export async function getBlogCategoryBySlug(slug: string) {
  return prisma.blogCategory.findUnique({
    where: { slug },
    include: { _count: { select: { posts: true } } },
  });
}

export async function createBlogCategory(data: CreateBlogCategoryInput) {
  return prisma.blogCategory.create({ data });
}

export async function updateBlogCategory(id: string, data: UpdateBlogCategoryInput) {
  return prisma.blogCategory.update({ where: { id }, data });
}

export async function deleteBlogCategory(id: string): Promise<DeleteBlogCategoryResult> {
  const category = await prisma.blogCategory.findUnique({
    where: { id },
    include: { _count: { select: { posts: true } } },
  });

  if (!category) {
    return { success: false, error: 'NOT_FOUND' };
  }

  if (category._count.posts > 0) {
    return { success: false, error: 'IN_USE', postCount: category._count.posts };
  }

  await prisma.blogCategory.delete({ where: { id } });
  return { success: true };
}
