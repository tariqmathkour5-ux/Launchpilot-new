import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [visits, uniqueVisitors, bounced, avgDurationResult, topPages, topReferrers] = await Promise.all([
    prisma.websiteVisit.count({ where: { visitedAt: { gte: thirtyDaysAgo } } }),
    prisma.$queryRaw`SELECT COUNT(DISTINCT "sessionId") as count FROM "WebsiteVisit" WHERE visited_at >= ${thirtyDaysAgo}`,
    prisma.websiteVisit.count({ where: { bounced: true, visitedAt: { gte: thirtyDaysAgo } } }),
    prisma.$queryRaw`SELECT AVG(duration) as avg FROM "WebsiteVisit" WHERE duration IS NOT NULL AND visited_at >= ${thirtyDaysAgo}`,
    prisma.$queryRaw`
    SELECT path, COUNT(*) as count
    FROM "WebsiteVisit"
    WHERE visited_at >= ${thirtyDaysAgo}
    GROUP BY path
    ORDER BY count DESC
    LIMIT 10
  `,
    prisma.$queryRaw`
    SELECT referrer, COUNT(*) as count
    FROM "WebsiteVisit"
    WHERE visited_at >= ${thirtyDaysAgo} AND referrer IS NOT NULL AND referrer != ''
    GROUP BY referrer
    ORDER BY count DESC
    LIMIT 10
  `,
  ]);

  const uniqueCount = Number((uniqueVisitors as [{ count: bigint }])[0]?.count || 0);
  const avgDuration = Math.round(Number((avgDurationResult as [{ avg: string | null }])[0]?.avg || 0));

  return NextResponse.json({
    visits,
    uniqueVisitors: uniqueCount,
    bounced,
    avgDuration,
    topPages: (topPages as Array<{ path: string; count: bigint }>).map((p) => ({
      path: p.path,
      count: Number(p.count),
    })),
    topReferrers: (topReferrers as Array<{ referrer: string; count: bigint }>).map((r) => ({
      referrer: r.referrer,
      count: Number(r.count),
    })),
  });
}
