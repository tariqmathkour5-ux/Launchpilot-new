import { z } from 'zod';

// =====================================================
// BLOG POST VALIDATION
// Zod schemas for validating Blog Post input.
// Field naming for SEO fields mirrors the existing
// SEOMetadata model (title/description/keywords/ogImage/canonical),
// prefixed with "seo" to avoid colliding with the post's own
// title/description fields.
// =====================================================

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Kept in sync with prisma/schema.prisma's BlogPostStatus enum, added in
// Task 31 (this module predates that column — Task 7 — and was written
// before REVIEW existed as a concept; updated here now that the real
// schema exists and disagreeing with it would be a real inconsistency,
// not just an unwired-forward-looking gap anymore).
export const blogPostStatusSchema = z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']);
export type BlogPostStatus = z.infer<typeof blogPostStatusSchema>;

export const blogPostSlugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(200)
  .regex(SLUG_PATTERN, 'Slug must contain only lowercase letters, numbers, and hyphens');

export const blogPostSeoSchema = z.object({
  seoTitle: z.string().max(70, 'SEO title should be 70 characters or fewer').optional(),
  seoDescription: z.string().max(160, 'SEO description should be 160 characters or fewer').optional(),
  seoKeywords: z.array(z.string()).default([]),
  seoOgImage: z.string().url('SEO OG image must be a valid URL').optional().or(z.literal('')),
  seoCanonical: z.string().url('Canonical URL must be a valid URL').optional().or(z.literal('')),
});

export const createBlogPostValidationSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or fewer'),
    slug: blogPostSlugSchema,
    excerpt: z.string().max(300, 'Excerpt must be 300 characters or fewer').optional(),
    content: z.string().min(1, 'Content is required'),
    categoryId: z.string().min(1, 'Category is required'),
    status: blogPostStatusSchema.default('DRAFT'),
  })
  .merge(blogPostSeoSchema);

export const updateBlogPostValidationSchema = createBlogPostValidationSchema.partial();

export type CreateBlogPostValidated = z.infer<typeof createBlogPostValidationSchema>;
export type UpdateBlogPostValidated = z.infer<typeof updateBlogPostValidationSchema>;
