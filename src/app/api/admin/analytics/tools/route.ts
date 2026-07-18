import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const categoryId = searchParams.get("categoryId");
  const toolId = searchParams.get("toolId");

  if (toolId) {
    const [views, clicks, reviews, revenue, viewsOverTime, referrers, countries, devices] = await Promise.all([
      prisma.toolView.count({ where: { toolId, createdAt: { gte: startDate } } }),
      prisma.affiliateClick.count({ where: { toolId, clickedAt: { gte: startDate } } }),
      prisma.userReview.findMany({
        where: { toolId },
        select: { rating: true },
      }),
      prisma.revenueTransaction.aggregate({
        where: { toolId, status: { in: ["CONFIRMED", "PAID"] }, transactionDate: { gte: startDate } },
        _sum: { amount: true },
      }),
      prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM tool_view
        WHERE tool_id = ${toolId}
        AND created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `,
      prisma.$queryRaw`
        SELECT referrer, COUNT(*) as count
        FROM tool_view
        WHERE tool_id = ${toolId}
        AND created_at >= ${startDate}
        GROUP BY referrer
        ORDER BY count DESC
        LIMIT 10
      `,
      prisma.$queryRaw`
        SELECT COALESCE(country, 'Unknown') as country, COUNT(*) as count
        FROM tool_view
        WHERE tool_id = ${toolId}
        AND created_at >= ${startDate}
        GROUP BY country
        ORDER BY count DESC
        LIMIT 10
      `,
      prisma.$queryRaw`
        SELECT device, COUNT(*) as count
        FROM tool_view
        WHERE tool_id = ${toolId}
        AND created_at >= ${startDate}
        GROUP BY device
        ORDER BY count DESC
      `,
    ]);

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;
    const ctr = views > 0 ? ((clicks / views) * 100).toFixed(2) : "0";
    const totalRevenue = Number(revenue._sum.amount || 0);

    const formatResult = (data: unknown): Array<{ [key: string]: number | string }> => {
      const arr = data as Array<Record<string, unknown>>;
      return arr.map((row) => {
        const result: Record<string, number | string> = {};
        Object.entries(row).forEach(([key, value]) => {
          if (value instanceof BigInt) {
            result[key] = Number(value);
          } else if (typeof value === "string") {
            result[key] = value;
          } else {
            result[key] = Number(value || 0);
          }
        });
        return result;
      });
    };

    return NextResponse.json({
      views,
      clicks,
      ctr: parseFloat(ctr),
      reviewsCount: reviews.length,
      avgRating,
      estimatedRevenue: totalRevenue,
      viewsOverTime: formatResult(viewsOverTime),
      referrers: formatResult(referrers),
      countries: formatResult(countries),
      devices: formatResult(devices),
    });
  }

  // Build base query without category filter first
  const topTools = await prisma.$queryRaw`
    SELECT
      t.id, t.name, t.slug,
      COALESCE(v.views, 0) as views,
      COALESCE(c.clicks, 0) as clicks,
      COALESCE(r.rating, 0) as avg_rating,
      COALESCE(r.count, 0) as review_count,
      COALESCE(rv.revenue, 0) as estimated_revenue
    FROM "Tool" t
    LEFT JOIN (
      SELECT tool_id, COUNT(*) as views
      FROM tool_view
      WHERE created_at >= ${startDate}
      GROUP BY tool_id
    ) v ON t.id = v.tool_id
    LEFT JOIN (
      SELECT tool_id, COUNT(*) as clicks
      FROM "AffiliateClick"
      WHERE clicked_at >= ${startDate}
      GROUP BY tool_id
    ) c ON t.id = c.tool_id
    LEFT JOIN (
      SELECT tool_id, AVG(rating) as rating, COUNT(*) as count
      FROM "UserReview"
      GROUP BY tool_id
    ) r ON t.id = r.tool_id
    LEFT JOIN (
      SELECT tool_id, SUM(amount) as revenue
      FROM revenue_transaction
      WHERE status IN ('CONFIRMED', 'PAID')
      AND transaction_date >= ${startDate}
      GROUP BY tool_id
    ) rv ON t.id = rv.tool_id
    ORDER BY views DESC
    LIMIT 50
  `;

  const formatToolResult = (data: unknown): Array<{
    id: string;
    name: string;
    slug: string;
    views: number;
    clicks: number;
    ctr: number;
    avgRating: number;
    reviewCount: number;
    estimatedRevenue: number;
  }> => {
    let arr = data as Array<Record<string, unknown>>;

    // Filter by category if provided
    if (categoryId) {
      // Note: This is a simplified approach - in production we'd include category in the query
      // For now, we return all and filter on the client or add a separate query
    }

    return arr.map((row) => ({
      id: String(row.id || ""),
      name: String(row.name || ""),
      slug: String(row.slug || ""),
      views: Number(row.views || 0),
      clicks: Number(row.clicks || 0),
      ctr: Number(row.views || 0) > 0
        ? parseFloat(((Number(row.clicks || 0) / Number(row.views || 0)) * 100).toFixed(2))
        : 0,
      avgRating: Number(row.avg_rating || 0),
      reviewCount: Number(row.review_count || 0),
      estimatedRevenue: Number(row.estimated_revenue || 0),
    }));
  };

  return NextResponse.json({
    tools: formatToolResult(topTools),
  });
}
