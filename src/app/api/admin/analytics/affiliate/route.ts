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
    topPrograms,
    highestCommissionTools,
    highestCTRTools,
    revenueByType,
    clicksOverTime,
    clicksBySource,
    clicksByCountry,
    partnerStats,
  ] = await Promise.all([
    prisma.$queryRaw`
      SELECT
        t.id, t.name, t.slug,
        COUNT(ac.id) as clicks,
        COALESCE(SUM(rv.amount), 0) as revenue
      FROM "Tool" t
      LEFT JOIN "AffiliateClick" ac ON t.id = ac."toolId"
      LEFT JOIN revenue_transaction rv ON t.id = rv."tool_id" AND rv.type = 'affiliate'
      WHERE ac.clicked_at >= ${startDate} OR rv.transaction_date >= ${startDate}
      GROUP BY t.id, t.name, t.slug
      HAVING COUNT(ac.id) > 0 OR COALESCE(SUM(rv.amount), 0) > 0
      ORDER BY revenue DESC
      LIMIT 20
    `,
    prisma.$queryRaw`
      SELECT
        t.id, t.name, t.slug,
        COALESCE(SUM(rt.amount), 0) as commission
      FROM "Tool" t
      JOIN revenue_transaction rt ON t.id = rt."tool_id"
      WHERE rt.type = 'affiliate'
      AND rt.status IN ('CONFIRMED', 'PAID')
      AND rt.transaction_date >= ${startDate}
      GROUP BY t.id, t.name, t.slug
      ORDER BY commission DESC
      LIMIT 10
    `,
    prisma.$queryRaw`
      SELECT
        t.id, t.name, t.slug,
        COUNT(ac.id) as clicks,
        (SELECT COUNT(*) FROM tool_view WHERE tool_id = t.id) as views
      FROM "Tool" t
      JOIN "AffiliateClick" ac ON t.id = ac."toolId"
      WHERE ac.clicked_at >= ${startDate}
      GROUP BY t.id, t.name, t.slug
      HAVING COUNT(ac.id) > 0
      ORDER BY clicks DESC
      LIMIT 10
    `,
    prisma.$queryRaw`
      SELECT
        type,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount
      FROM revenue_transaction
      WHERE status IN ('CONFIRMED', 'PAID')
      AND transaction_date >= ${startDate}
      GROUP BY type
      ORDER BY total_amount DESC
    `,
    prisma.$queryRaw`
      SELECT DATE(clicked_at) as date, COUNT(*) as count
      FROM "AffiliateClick"
      WHERE clicked_at >= ${startDate}
      GROUP BY DATE(clicked_at)
      ORDER BY date DESC
      LIMIT 30
    `,
    prisma.$queryRaw`
      SELECT COALESCE(source, 'direct') as source, COUNT(*) as count
      FROM "AffiliateClick"
      WHERE clicked_at >= ${startDate}
      GROUP BY source
      ORDER BY count DESC
      LIMIT 10
    `,
    prisma.$queryRaw`
      SELECT COALESCE(country, 'Unknown') as country, COUNT(*) as count
      FROM "AffiliateClick" ac
      LEFT JOIN "WebsiteVisit" wv ON ac."sessionId" = wv."sessionId"
      WHERE ac.clicked_at >= ${startDate}
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `,
    prisma.affiliatePartner.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        code: true,
        clicks: true,
        conversions: true,
        earnings: true,
        commission: true,
      },
      orderBy: { earnings: "desc" },
      take: 20,
    }),
  ]);

  const [estimatedRevenue, confirmedRevenue] = await Promise.all([
    prisma.revenueTransaction.aggregate({
      where: { type: "AFFILIATE", transactionDate: { gte: startDate } },
      _sum: { amount: true },
    }),
    prisma.revenueTransaction.aggregate({
      where: { type: "AFFILIATE", status: { in: ["CONFIRMED", "PAID"] }, transactionDate: { gte: startDate } },
      _sum: { amount: true },
    }),
  ]);

  const formatResult = (data: unknown): Array<Record<string, number | string>> => {
    const arr = data as Array<Record<string, unknown>>;
    return arr.map((row) => {
      const result: Record<string, number | string> = {};
      Object.entries(row).forEach(([key, value]) => {
        if (value instanceof BigInt) {
          result[key] = Number(value);
        } else if (typeof value === "string") {
          result[key] = value;
        } else if (typeof value === "number") {
          result[key] = value;
        } else {
          result[key] = Number(value || 0);
        }
      });
      return result;
    });
  };

  const formattedTopPrograms = formatResult(topPrograms);
  const formattedHighestCTR = formatResult(highestCTRTools).map((t) => ({
    ...t,
    ctr: Number(t.views || 0) > 0 ? parseFloat(((Number(t.clicks || 0) / Number(t.views || 0)) * 100).toFixed(2)) : 0,
  }));

  return NextResponse.json({
    topPrograms: formattedTopPrograms,
    highestCommissionTools: formatResult(highestCommissionTools),
    highestCTRTools: formattedHighestCTR,
    revenueByType: formatResult(revenueByType),
    clicksOverTime: formatResult(clicksOverTime),
    clicksBySource: formatResult(clicksBySource),
    clicksByCountry: formatResult(clicksByCountry),
    partnerStats,
    estimatedRevenue: Number(estimatedRevenue._sum.amount || 0),
    confirmedRevenue: Number(confirmedRevenue._sum.amount || 0),
  });
}
