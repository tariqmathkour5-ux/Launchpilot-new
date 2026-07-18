import { prisma } from '@/lib/prisma';

// =====================================================
// BLOG VIEW ANALYTICS
// Reuses the existing analytics approach (raw SQL aggregation, the same
// technique already used in src/app/api/admin/analytics/tools/route.ts)
// rather than introducing a different analytics pattern for blog content.
// =====================================================

export interface RecordViewInput {
  postId: string;
  sessionId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  country?: string | null;
  device?: string;
  referrer?: string | null;
}

const DEDUP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Record a post view — optimized to avoid one write per page load.
 * If the same session already has a view for this post within the last
 * 30 minutes (refreshes, back-and-forth navigation, multiple tabs), this
 * is a no-op rather than another INSERT. Without a sessionId (client
 * declined/blocked storage), every view is recorded, since there's no
 * reliable way to dedupe it — undercounting is worse than a few extra rows
 * in that fallback case.
 */
export async function recordView(input: RecordViewInput): Promise<{ recorded: boolean }> {
  if (input.sessionId) {
    const recent = await prisma.blogPostView.findFirst({
      where: {
        postId: input.postId,
        sessionId: input.sessionId,
        createdAt: { gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
      },
      select: { id: true },
    });

    if (recent) {
      return { recorded: false };
    }
  }

  await prisma.blogPostView.create({
    data: {
      postId: input.postId,
      sessionId: input.sessionId || undefined,
      ipAddress: input.ipAddress || undefined,
      userAgent: input.userAgent || undefined,
      country: input.country || undefined,
      device: input.device || 'desktop',
      referrer: input.referrer || undefined,
    },
  });

  return { recorded: true };
}

/** Total views and unique visitors (distinct sessions) for a single post. */
export async function getPostViewStats(postId: string, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalViews, uniqueVisitors] = await Promise.all([
    prisma.blogPostView.count({ where: { postId, createdAt: { gte: startDate } } }),
    prisma.blogPostView.findMany({
      where: { postId, createdAt: { gte: startDate }, sessionId: { not: null } },
      select: { sessionId: true },
      distinct: ['sessionId'],
    }),
  ]);

  return { totalViews, uniqueVisitors: uniqueVisitors.length };
}

export interface ViewsOverTimePoint {
  date: string;
  count: bigint;
}

/** Daily view counts over the window — same GROUP BY DATE(...) technique already used for tool views-over-time. */
export async function getViewsOverTime(days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return prisma.$queryRaw<ViewsOverTimePoint[]>`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM blog_post_view
    WHERE created_at >= ${startDate}
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;
}

export interface PopularCategory {
  categoryId: string;
  name: string;
  viewCount: bigint;
}

/** Published posts' views aggregated by category, most-viewed category first. */
export async function getPopularCategories(options: { limit?: number; days?: number } = {}) {
  const limit = options.limit ?? 10;
  const days = options.days ?? 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return prisma.$queryRaw<PopularCategory[]>`
    SELECT c.id as "categoryId", c.name, COUNT(v.id) as "viewCount"
    FROM blog_post_view v
    JOIN "BlogPost" p ON p.id = v.post_id
    JOIN "BlogCategory" c ON c.id = p."categoryId"
    WHERE p.published = true
      AND v.created_at >= ${startDate}
    GROUP BY c.id, c.name
    ORDER BY "viewCount" DESC
    LIMIT ${limit}
  `;
}

export interface EngagementSummary {
  totalViews: number;
  uniqueVisitors: number;
  publishedPostCount: number;
  avgViewsPerPost: number;
}

/**
 * Site-wide blog engagement KPIs for the window. Every count here is a
 * single aggregate query (COUNT / COUNT DISTINCT), not a fetch-everything-
 * then-count-in-JS — same "optimize queries" principle as the rest of this
 * file, and the caller (the analytics route) runs all of these in parallel
 * rather than one after another.
 */
export async function getEngagementSummary(days = 30): Promise<EngagementSummary> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalViews, uniqueSessions, publishedPostCount] = await Promise.all([
    prisma.blogPostView.count({ where: { createdAt: { gte: startDate } } }),
    prisma.blogPostView.findMany({
      where: { createdAt: { gte: startDate }, sessionId: { not: null } },
      select: { sessionId: true },
      distinct: ['sessionId'],
    }),
    prisma.blogPost.count({ where: { published: true } }),
  ]);

  return {
    totalViews,
    uniqueVisitors: uniqueSessions.length,
    publishedPostCount,
    avgViewsPerPost: publishedPostCount > 0 ? Math.round((totalViews / publishedPostCount) * 10) / 10 : 0,
  };
}

export interface PopularPost {
  postId: string;
  slug: string;
  title: string;
  viewCount: bigint;
}

/**
 * Most-viewed published posts in the given window — the "popular posts"
 * requirement. Raw SQL (COUNT + GROUP BY), the same aggregation style
 * already used for tool analytics, not a new query pattern.
 */
export async function getPopularPosts(options: { limit?: number; days?: number } = {}) {
  const limit = options.limit ?? 10;
  const days = options.days ?? 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return prisma.$queryRaw<PopularPost[]>`
    SELECT p.id as "postId", p.slug, p.title, COUNT(v.id) as "viewCount"
    FROM blog_post_view v
    JOIN "BlogPost" p ON p.id = v.post_id
    WHERE p.published = true
      AND v.created_at >= ${startDate}
    GROUP BY p.id, p.slug, p.title
    ORDER BY "viewCount" DESC
    LIMIT ${limit}
  `;
}
