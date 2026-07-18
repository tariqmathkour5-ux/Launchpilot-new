import { prisma } from '@/lib/prisma';

interface RecommendedTool {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  pricing: string;
  rating: number | null;
  categoryId: string;
  reason: string;
}

export async function getRecommendationsForUser(userId: string, limit = 12): Promise<RecommendedTool[]> {
  const interests = await prisma.$queryRaw<
    Array<{ tool_id: string | null; category_id: string | null; interest_type: string; weight: number }>
  >`
    SELECT tool_id, category_id, interest_type, weight
    FROM user_interests
    WHERE user_id = ${userId}
    ORDER BY weight DESC, created_at DESC
    LIMIT 50
  `;

  if (interests.length === 0) return getTrendingTools(limit);

  const viewedToolIds = interests
    .filter(i => i.tool_id && i.interest_type === 'viewed')
    .map(i => i.tool_id!);

  const favoriteCategories = [...new Set(
    interests.filter(i => i.category_id).map(i => i.category_id!)
  )];

  if (favoriteCategories.length === 0 && viewedToolIds.length === 0) {
    return getTrendingTools(limit);
  }

  const excludeIds = viewedToolIds.slice(0, 20);
  const excludePlaceholder = excludeIds.length > 0 ? excludeIds : ['__none__'];

  const tools = await prisma.$queryRaw<RecommendedTool[]>`
    SELECT t.id, t.slug, t.name, t.title, t.description, t.pricing, t.rating, t."categoryId"
    FROM "Tool" t
    WHERE t.published = true
      AND t.id != ALL(${excludePlaceholder})
      AND (
        t."categoryId" = ANY(${favoriteCategories.length > 0 ? favoriteCategories : ['__none__']})
        OR t.rating >= 4.0
      )
    ORDER BY
      CASE WHEN t."categoryId" = ANY(${favoriteCategories.length > 0 ? favoriteCategories : ['__none__']}) THEN 0 ELSE 1 END,
      t.rating DESC NULLS LAST,
      t."createdAt" DESC
    LIMIT ${limit}
  `;

  return tools.map(t => ({
    ...t,
    reason: favoriteCategories.includes(t.categoryId)
      ? 'Based on your interests'
      : 'Highly rated',
  }));
}

export async function getSimilarTools(toolId: string, limit = 6): Promise<RecommendedTool[]> {
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    select: { categoryId: true, pricing: true, id: true },
  });
  if (!tool) return [];

  const similar = await prisma.$queryRaw<RecommendedTool[]>`
    SELECT t.id, t.slug, t.name, t.title, t.description, t.pricing, t.rating, t."categoryId"
    FROM "Tool" t
    WHERE t.published = true
      AND t.id != ${toolId}
      AND t."categoryId" = ${tool.categoryId}
    ORDER BY
      CASE WHEN t.pricing = ${tool.pricing} THEN 0 ELSE 1 END,
      t.rating DESC NULLS LAST
    LIMIT ${limit}
  `;

  return similar.map(t => ({ ...t, reason: 'Similar tool' }));
}

export async function getBetterRatedAlternatives(toolId: string, limit = 4): Promise<RecommendedTool[]> {
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    select: { categoryId: true, rating: true },
  });
  if (!tool) return [];

  const minRating = (tool.rating ?? 0) + 0.1;

  return prisma.$queryRaw<RecommendedTool[]>`
    SELECT t.id, t.slug, t.name, t.title, t.description, t.pricing, t.rating, t."categoryId"
    FROM "Tool" t
    WHERE t.published = true
      AND t.id != ${toolId}
      AND t."categoryId" = ${tool.categoryId}
      AND t.rating > ${minRating}
    ORDER BY t.rating DESC
    LIMIT ${limit}
  `;
}

export async function getLowerCostAlternatives(toolId: string, limit = 4): Promise<RecommendedTool[]> {
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    select: { categoryId: true, pricing: true, hasFreeTier: true },
  });
  if (!tool || tool.pricing === 'free') return [];

  return prisma.$queryRaw<RecommendedTool[]>`
    SELECT t.id, t.slug, t.name, t.title, t.description, t.pricing, t.rating, t."categoryId"
    FROM "Tool" t
    WHERE t.published = true
      AND t.id != ${toolId}
      AND t."categoryId" = ${tool.categoryId}
      AND (t.pricing = 'free' OR t."hasFreeTier" = true)
    ORDER BY t.rating DESC NULLS LAST
    LIMIT ${limit}
  `;
}

export async function getNewInFavoriteCategories(userId: string, limit = 8): Promise<RecommendedTool[]> {
  const categories = await prisma.$queryRaw<Array<{ category_id: string }>>`
    SELECT DISTINCT category_id
    FROM user_interests
    WHERE user_id = ${userId} AND category_id IS NOT NULL
    ORDER BY category_id
    LIMIT 5
  `;

  if (categories.length === 0) return [];

  const catIds = categories.map(c => c.category_id);

  return prisma.$queryRaw<RecommendedTool[]>`
    SELECT t.id, t.slug, t.name, t.title, t.description, t.pricing, t.rating, t."categoryId"
    FROM "Tool" t
    WHERE t.published = true
      AND t."categoryId" = ANY(${catIds})
    ORDER BY t."createdAt" DESC
    LIMIT ${limit}
  `;
}

export async function getTrendingTools(limit = 8): Promise<RecommendedTool[]> {
  const tools = await prisma.$queryRaw<RecommendedTool[]>`
    SELECT t.id, t.slug, t.name, t.title, t.description, t.pricing, t.rating, t."categoryId"
    FROM "Tool" t
    LEFT JOIN tool_view tv ON tv.tool_id = t.id AND tv.created_at > now() - interval '7 days'
    WHERE t.published = true
    GROUP BY t.id
    ORDER BY COUNT(tv.id) DESC, t.rating DESC NULLS LAST
    LIMIT ${limit}
  `;

  return tools.map(t => ({ ...t, reason: 'Trending' }));
}

export async function getRecentlyViewedTools(userId: string, limit = 8) {
  return prisma.$queryRaw<Array<{
    item_id: string; viewed_at: Date; slug: string; name: string; title: string;
    description: string; pricing: string; rating: number | null;
  }>>`
    SELECT rv.item_id, rv.viewed_at, t.slug, t.name, t.title, t.description, t.pricing, t.rating
    FROM recently_viewed rv
    JOIN "Tool" t ON t.id = rv.item_id
    WHERE rv.user_id = ${userId}
      AND rv.item_type = 'tool'
    ORDER BY rv.viewed_at DESC
    LIMIT ${limit}
  `;
}
