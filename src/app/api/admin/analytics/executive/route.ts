import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate")
    ? new Date(searchParams.get("startDate")!)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = searchParams.get("endDate")
    ? new Date(searchParams.get("endDate")!)
    : new Date();

  const [
    totalVisitors,
    registeredUsers,
    registeredCompanies,
    publishedTools,
    affiliateClicks,
    newsletterSubscribers,
    totalRevenue,
    monthlyRevenueResult,
    toolViews,
    conversionData,
  ] = await Promise.all([
    prisma.websiteVisit.count({ where: { visitedAt: { gte: startDate, lte: endDate } } }),
    prisma.user.count(),
    prisma.company.count(),
    prisma.tool.count({ where: { published: true } }),
    prisma.affiliateClick.count({ where: { clickedAt: { gte: startDate, lte: endDate } } }),
    prisma.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
    prisma.revenueTransaction.aggregate({
      where: { status: { in: ["CONFIRMED", "PAID"] } },
      _sum: { amount: true },
    }),
    prisma.$queryRaw`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM revenue_transaction
      WHERE status IN ('CONFIRMED', 'PAID')
      AND transaction_date >= ${startDate}
      AND transaction_date <= ${endDate}
    `,
    prisma.toolView.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
    prisma.$queryRaw`
      SELECT
        COUNT(DISTINCT CASE WHEN clicked_affiliate THEN session_id END) as clicks,
        COUNT(DISTINCT session_id) as views
      FROM tool_view
      WHERE created_at >= ${startDate}
      AND created_at <= ${endDate}
    `,
  ]);

  const estimatedRevenue = Number(totalRevenue._sum.amount || 0);
  const monthlyRevenue = Number((monthlyRevenueResult as [{ total: string }])[0]?.total || 0);
  const clickSessions = Number((conversionData as [{ clicks: bigint; views: bigint }])[0]?.clicks || 0);
  const viewSessions = Number((conversionData as [{ clicks: bigint; views: bigint }])[0]?.views || 0);
  const conversionRate = viewSessions > 0 ? ((clickSessions / viewSessions) * 100).toFixed(2) : "0";

  return NextResponse.json({
    totalVisitors,
    registeredUsers,
    registeredCompanies,
    publishedTools,
    affiliateClicks,
    newsletterSubscribers,
    estimatedRevenue,
    monthlyRevenue,
    toolViews,
    conversionRate: parseFloat(conversionRate),
    activeSubscriptions: 0,
  });
}
