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

  const [
    topSearches,
    topCategories,
    noResultSearches,
    trendingSearches,
    searchesByDay,
    searchesByDevice,
    clickThroughRate,
  ] = await Promise.all([
    prisma.$queryRaw`
      SELECT query, COUNT(*) as count
      FROM search_analytics
      WHERE created_at >= ${startDate}
      GROUP BY query
      ORDER BY count DESC
      LIMIT 20
    `,
    prisma.$queryRaw`
      SELECT COALESCE(category, 'Uncategorized') as category, COUNT(*) as count
      FROM search_analytics
      WHERE created_at >= ${startDate}
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `,
    prisma.$queryRaw`
      SELECT query, COUNT(*) as count
      FROM search_analytics
      WHERE created_at >= ${startDate}
      AND results_count = 0
      GROUP BY query
      ORDER BY count DESC
      LIMIT 20
    `,
    prisma.$queryRaw`
      SELECT query, COUNT(*) as count
      FROM search_analytics
      WHERE created_at >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
      GROUP BY query
      HAVING COUNT(*) > 2
      ORDER BY count DESC
      LIMIT 10
    `,
    prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM search_analytics
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `,
    prisma.$queryRaw`
      SELECT device, COUNT(*) as count
      FROM search_analytics
      WHERE created_at >= ${startDate}
      GROUP BY device
      ORDER BY count DESC
    `,
    prisma.$queryRaw`
      SELECT
        COUNT(*) as total_searches,
        COUNT(clicked_tool_id) as clicks
      FROM search_analytics
      WHERE created_at >= ${startDate}
    `,
  ]);

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

  const ctrData = clickThroughRate as [{ total_searches: bigint; clicks: bigint }];
  const totalSearches = Number(ctrData[0]?.total_searches || 0);
  const clicks = Number(ctrData[0]?.clicks || 0);
  const ctr = totalSearches > 0 ? ((clicks / totalSearches) * 100).toFixed(2) : "0";

  return NextResponse.json({
    topSearches: formatResult(topSearches),
    topCategories: formatResult(topCategories),
    noResultSearches: formatResult(noResultSearches),
    trendingSearches: formatResult(trendingSearches),
    searchesByDay: formatResult(searchesByDay),
    searchesByDevice: formatResult(searchesByDevice),
    clickThroughRate: parseFloat(ctr),
    totalSearches,
    clicks,
  });
}
