// =====================================================
// DYNAMIC SITEMAP GENERATOR (Next.js App Router)
// Auto-generates sitemap.xml for all canonical pages:
// tools, blog posts, categories, companies, deals, etc.
// Every URL uses the canonical BASE_URL from env.
// =====================================================

import { MetadataRoute } from 'next';
import { getAllToolSlugs, getAllTools } from '@/lib/tools';
import { prisma } from '@/lib/prisma';
import { CATEGORIES } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://launchpilot.app';

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // --- Static pages ---
  const staticPages = [
    { url: `${BASE_URL}/`, priority: 1.0, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/tools`, priority: 0.9, changeFrequency: 'daily' as const },
    { url: `${BASE_URL}/blog`, priority: 0.8, changeFrequency: 'daily' as const },
    { url: `${BASE_URL}/categories`, priority: 0.7, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/deals`, priority: 0.6, changeFrequency: 'daily' as const },
    { url: `${BASE_URL}/compare`, priority: 0.5, changeFrequency: 'weekly' as const },
    { url: `${BASE_URL}/pricing`, priority: 0.4, changeFrequency: 'monthly' as const },
    { url: `${BASE_URL}/favorites`, priority: 0.3, changeFrequency: 'monthly' as const },
  ];
  entries.push(...staticPages);

  // --- Tool pages (from knowledge base) ---
  const toolSlugs = getAllToolSlugs();
  for (const slug of toolSlugs) {
    entries.push({
      url: `${BASE_URL}/tools/${slug}`,
      priority: 0.8,
      changeFrequency: 'weekly' as const,
    });
  }

  // --- Category pages ---
  for (const cat of CATEGORIES) {
    entries.push({
      url: `${BASE_URL}/categories/${cat.slug}`,
      priority: 0.6,
      changeFrequency: 'weekly' as const,
    });
    // Category-specific tool listing
    entries.push({
      url: `${BASE_URL}/tools?category=${cat.slug}`,
      priority: 0.5,
      changeFrequency: 'weekly' as const,
    });
  }

  // --- Blog posts (from Prisma) ---
  try {
    const blogPosts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: 'desc' },
    });

    for (const post of blogPosts) {
      entries.push({
        url: `${BASE_URL}/blog/${post.slug}`,
        priority: 0.7,
        changeFrequency: 'monthly' as const,
        lastModified: post.updatedAt,
      });
    }

    // Blog category listing pages
    const blogCategories = await prisma.blogCategory.findMany({
      select: { slug: true },
    });
    for (const cat of blogCategories) {
      entries.push({
        url: `${BASE_URL}/blog?category=${cat.slug}`,
        priority: 0.4,
        changeFrequency: 'weekly' as const,
      });
    }
  } catch {
    // Gracefully degrade if DB unavailable — sitemap still includes static + tool pages
    console.warn('Failed to fetch blog data for sitemap — skipping blog entries');
  }

  // --- Company pages (from knowledge base) ---
  const allTools = getAllTools();
  const companySlugs = new Set<string>();
  for (const tool of allTools) {
    if (tool.website_url) {
      try {
        const hostname = new URL(tool.website_url).hostname.replace(/^www\./, '');
        const slug = hostname.replace(/\./g, '-');
        companySlugs.add(slug);
      } catch {
        // skip invalid URLs
      }
    }
  }
  for (const slug of companySlugs) {
    entries.push({
      url: `${BASE_URL}/companies/${slug}`,
      priority: 0.5,
      changeFrequency: 'monthly' as const,
    });
  }

  return entries;
}