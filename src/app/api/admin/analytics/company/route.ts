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
  const companyId = searchParams.get("companyId");

  if (companyId) {
    const [company, tools, views, reviews, leads] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true, slug: true, verified: true, status: true },
      }),
      prisma.tool.findMany({
        where: { companyId },
        select: { id: true, name: true, slug: true, rating: true },
      }),
      prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM tool_view tv
        JOIN "Tool" t ON tv.tool_id = t.id
        WHERE t."companyId" = ${companyId}
        AND tv.created_at >= ${startDate}
      `,
      prisma.$queryRaw`
        SELECT COUNT(*) as count, AVG(rating) as avg_rating
        FROM "UserReview" ur
        JOIN "Tool" t ON ur."toolId" = t.id
        WHERE t."companyId" = ${companyId}
      `,
      prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM "AffiliateClick" ac
        JOIN "Tool" t ON ac."toolId" = t.id
        WHERE t."companyId" = ${companyId}
        AND ac.clicked_at >= ${startDate}
      `,
    ]);

    const viewCount = Number((views as [{ count: bigint }])[0]?.count || 0);
    const reviewCount = Number((reviews as [{ count: bigint; avg_rating: string | null }])[0]?.count || 0);
    const avgRating = (reviews as [{ avg_rating: string | null }])[0]?.avg_rating
      ? parseFloat((reviews as [{ avg_rating: string }])[0].avg_rating)
      : null;
    const leadCount = Number((leads as [{ count: bigint }])[0]?.count || 0);

    // Get advertisements for this company via revenue transactions
    const adTransactions = await prisma.revenueTransaction.findMany({
      where: { companyId, type: "ADVERTISING" },
      select: { advertisementId: true },
    });

    const adIds = [...new Set(adTransactions.map(t => t.advertisementId).filter(Boolean))] as string[];

    const advertisements = adIds.length > 0
      ? await prisma.advertisement.findMany({
          where: { id: { in: adIds } },
          select: {
            id: true,
            title: true,
            clicks: true,
            impressions: true,
            budget: true,
            spent: true,
          },
        })
      : [];

    return NextResponse.json({
      company,
      tools,
      views: viewCount,
      reviews: reviewCount,
      avgRating,
      advertisements,
      leads: leadCount,
    });
  }

  const topCompanies = await prisma.$queryRaw`
    SELECT
      c.id, c.name, c.slug, c.verified, c.status,
      COUNT(DISTINCT t.id) as tool_count,
      COALESCE(SUM(tv.views), 0) as total_views,
      COALESCE(SUM(r.reviews), 0) as total_reviews,
      COALESCE(SUM(ac.clicks), 0) as total_leads
    FROM "Company" c
    LEFT JOIN "Tool" t ON c.id = t."companyId"
    LEFT JOIN (
      SELECT tool_id, COUNT(*) as views
      FROM tool_view
      WHERE created_at >= ${startDate}
      GROUP BY tool_id
    ) tv ON t.id = tv.tool_id
    LEFT JOIN (
      SELECT "toolId", COUNT(*) as reviews
      FROM "UserReview"
      GROUP BY "toolId"
    ) r ON t.id = r."toolId"
    LEFT JOIN (
      SELECT "toolId", COUNT(*) as clicks
      FROM "AffiliateClick"
      WHERE clicked_at >= ${startDate}
      GROUP BY "toolId"
    ) ac ON t.id = ac."toolId"
    GROUP BY c.id, c.name, c.slug, c.verified, c.status
    HAVING COUNT(DISTINCT t.id) > 0
    ORDER BY total_views DESC
    LIMIT 20
  `;

  const formatResult = (data: unknown): Array<Record<string, number | string>> => {
    const arr = data as Array<Record<string, unknown>>;
    return arr.map((row) => {
      const result: Record<string, number | string> = {};
      Object.entries(row).forEach(([key, value]) => {
        if (value instanceof BigInt) {
          result[key] = Number(value);
        } else if (typeof value === "string") {
          result[key] = value;
        } else if (typeof value === "boolean") {
          result[key] = String(value);
        } else {
          result[key] = Number(value || 0);
        }
      });
      return result;
    });
  };

  return NextResponse.json({
    companies: formatResult(topCompanies),
  });
}
