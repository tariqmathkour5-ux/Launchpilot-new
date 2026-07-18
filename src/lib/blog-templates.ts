import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  titleTemplate: z.string().optional(),
  contentTemplate: z.string().min(1),
  categoryId: z.string().optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  titleTemplate: z.string().optional().nullable(),
  contentTemplate: z.string().min(1).optional(),
  categoryId: z.string().optional().nullable(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

export async function listTemplates() {
  return prisma.blogPostTemplate.findMany({
    include: { category: true },
    orderBy: { name: 'asc' },
  });
}

export async function getTemplateById(id: string) {
  return prisma.blogPostTemplate.findUnique({
    where: { id },
    include: { category: true },
  });
}

export async function createTemplate(data: CreateTemplateInput, createdById?: string) {
  return prisma.blogPostTemplate.create({ data: { ...data, createdById } });
}

export async function updateTemplate(id: string, data: UpdateTemplateInput) {
  const existing = await prisma.blogPostTemplate.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Template not found');
  }
  return prisma.blogPostTemplate.update({ where: { id }, data });
}

export async function deleteTemplate(id: string) {
  const existing = await prisma.blogPostTemplate.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Template not found');
  }
  await prisma.blogPostTemplate.delete({ where: { id } });
}

/**
 * Duplicate a template — a plain copy with " (Copy)" appended to the
 * name. Does not affect the original template or any post — a template
 * is only ever read from when creating a post, never linked back to.
 */
export async function duplicateTemplate(id: string, createdById?: string) {
  const existing = await prisma.blogPostTemplate.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Template not found');
  }

  return prisma.blogPostTemplate.create({
    data: {
      name: `${existing.name} (Copy)`,
      description: existing.description,
      titleTemplate: existing.titleTemplate,
      contentTemplate: existing.contentTemplate,
      categoryId: existing.categoryId,
      createdById,
    },
  });
}
