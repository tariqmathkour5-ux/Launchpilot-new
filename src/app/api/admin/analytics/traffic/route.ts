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

  const [dailyVisitors, weeklyVisitors, monthlyVisitors, returningVisitors, newVisitors, visitsByDay, visitsByCountry, visitsByDevice, visitsBySource] = await Promise.all([
    prisma.$queryRaw`
      SELECT DATE(visited_at) as date, COUNT(*) as count
      FROM "WebsiteVisit"
      WHERE visited_at >= ${startDate}
      GROUP BY DATE(visited_at)
      ORDER BY date DESC
      LIMIT 30
    `,
    prisma.$queryRaw`
      SELECT DATE_TRUNC('week', visited_at) as week, COUNT(*) as count
      FROM "WebsiteVisit"
      WHERE visited_at >= ${startDate}
      GROUP BY DATE_TRUNC('week', visited_at)
      ORDER BY week DESC
      LIMIT 12
    `,
    prisma.$queryRaw`
      SELECT DATE_TRUNC('month', visited_at) as month, COUNT(*) as count
      FROM "WebsiteVisit"
      WHERE visited_at >= ${new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)}
      GROUP BY DATE_TRUNC('month', visited_at)
      ORDER BY month DESC
      LIMIT 12
    `,
    prisma.$queryRaw`
      SELECT COUNT(DISTINCT session_id) as count
      FROM "WebsiteVisit"
      WHERE visited_at >= ${startDate}
      AND session_id IN (
        SELECT session_id FROM "WebsiteVisit" GROUP BY session_id HAVING COUNT(*) > 1
      )
    `,
    prisma.$queryRaw`
      SELECT COUNT(DISTINCT session_id) as count
      FROM "WebsiteVisit"
      WHERE visited_at >= ${startDate}
      AND session_id NOT IN (
        SELECT session_id FROM "WebsiteVisit" GROUP BY session_id HAVING COUNT(*) > 1
      )
    `,
    prisma.$queryRaw`
      SELECT TO_CHAR(visited_at, 'Day') as day_of_week, COUNT(*) as count
      FROM "WebsiteVisit"
      WHERE visited_at >= ${startDate}
      GROUP BY TO_CHAR(visited_at, 'Day'), EXTRACT(DOW FROM visited_at)
      ORDER BY EXTRACT(DOW FROM visited_at)
    `,
    prisma.$queryRaw`
      SELECT COALESCE(country, 'Unknown') as country, COUNT(*) as count
      FROM "WebsiteVisit"
      WHERE visited_at >= ${startDate}
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `,
    prisma.$queryRaw`
      SELECT
        CASE
          WHEN user_agent LIKE '%Mobile%' OR user_agent LIKE '%Android%' THEN 'mobile'
          WHEN user_agent LIKE '%Tablet%' OR user_agent LIKE '%iPad%' THEN 'tablet'
          ELSE 'desktop'
        END as device, COUNT(*) as count
      FROM "WebsiteVisit"
      WHERE visited_at >= ${startDate}
      GROUP BY device
    `,
    prisma.$queryRaw`
      SELECT
        CASE
          WHEN referrer LIKE '%google%' THEN 'Google'
          WHEN referrer LIKE '%facebook%' OR referrer LIKE '%fb%' THEN 'Facebook'
          WHEN referrer LIKE '%twitter%' OR referrer LIKE '%t.co%' THEN 'Twitter'
          WHEN referrer LIKE '%linkedin%' THEN 'LinkedIn'
          WHEN referrer LIKE '%reddit%' THEN 'Reddit'
          WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
          ELSE 'Other'
        END as source, COUNT(*) as count
      FROM "WebsiteVisit"
      WHERE visited_at >= ${startDate}
      GROUP BY source
      ORDER BY count DESC
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

  return NextResponse.json({
    dailyVisitors: formatResult(dailyVisitors),
    weeklyVisitors: formatResult(weeklyVisitors),
    monthlyVisitors: formatResult(monthlyVisitors),
    returningVisitors: Number((returningVisitors as [{ count: bigint }])[0]?.count || 0),
    newVisitors: Number((newVisitors as [{ count: bigint }])[0]?.count || 0),
    visitsByDay: formatResult(visitsByDay),
    visitsByCountry: formatResult(visitsByCountry),
    visitsByDevice: formatResult(visitsByDevice),
    visitsBySource: formatResult(visitsBySource),
  });
}
