import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    affiliateRevenue,
    advertisingRevenue,
    subscriptionRevenue,
    sponsoredListingRevenue,
    totalRevenue,
    monthlyRevenue,
    revenueByDay,
    revenueByMonth,
    revenueByType,
    topTools,
    pendingPayouts,
    recentTransactions,
  ] = await Promise.all([
    prisma.revenueTransaction.aggregate({
      where: { type: "AFFILIATE", status: { in: ["CONFIRMED", "PAID"] }, transactionDate: { gte: startDate } },
      _sum: { amount: true },
    }),
    prisma.revenueTransaction.aggregate({
      where: { type: "ADVERTISING", status: { in: ["CONFIRMED", "PAID"] }, transactionDate: { gte: startDate } },
      _sum: { amount: true },
    }),
    prisma.revenueTransaction.aggregate({
      where: { type: "SUBSCRIPTION", status: { in: ["CONFIRMED", "PAID"] }, transactionDate: { gte: startDate } },
      _sum: { amount: true },
    }),
    prisma.revenueTransaction.aggregate({
      where: { type: "SPONSORED_LISTING", status: { in: ["CONFIRMED", "PAID"] }, transactionDate: { gte: startDate } },
      _sum: { amount: true },
    }),
    prisma.revenueTransaction.aggregate({
      where: { status: { in: ["CONFIRMED", "PAID"] }, transactionDate: { gte: startDate } },
      _sum: { amount: true },
    }),
    prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', transaction_date) as month,
        SUM(amount) as total
      FROM revenue_transaction
      WHERE status IN ('CONFIRMED', 'PAID')
      AND transaction_date >= ${new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)}
      GROUP BY DATE_TRUNC('month', transaction_date)
      ORDER BY month DESC
      LIMIT 12
    `,
    prisma.$queryRaw`
      SELECT DATE(transaction_date) as date, type, SUM(amount) as amount
      FROM revenue_transaction
      WHERE status IN ('CONFIRMED', 'PAID')
      AND transaction_date >= ${startDate}
      GROUP BY DATE(transaction_date), type
      ORDER BY date DESC
      LIMIT 30
    `,
    prisma.$queryRaw`
      SELECT
        TO_CHAR(transaction_date, 'YYYY-MM') as month,
        type,
        SUM(amount) as amount
      FROM revenue_transaction
      WHERE status IN ('CONFIRMED', 'PAID')
      GROUP BY TO_CHAR(transaction_date, 'YYYY-MM'), type
      ORDER BY month DESC
      LIMIT 24
    `,
    prisma.$queryRaw`
      SELECT type, SUM(amount) as total, COUNT(*) as count
      FROM revenue_transaction
      WHERE status IN ('CONFIRMED', 'PAID')
      GROUP BY type
      ORDER BY total DESC
    `,
    prisma.$queryRaw`
      SELECT
        t.id, t.name, t.slug,
        SUM(rt.amount) as revenue
      FROM "Tool" t
      JOIN revenue_transaction rt ON t.id = rt."tool_id"
      WHERE rt.status IN ('CONFIRMED', 'PAID')
      AND rt.transaction_date >= ${startDate}
      GROUP BY t.id, t.name, t.slug
      ORDER BY revenue DESC
      LIMIT 10
    `,
    prisma.revenueTransaction.aggregate({
      where: { status: "PENDING", transactionDate: { gte: startDate } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.revenueTransaction.findMany({
      where: { transactionDate: { gte: startDate } },
      orderBy: { transactionDate: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        description: true,
        transactionDate: true,
        tool: { select: { name: true, slug: true } },
        company: { select: { name: true, slug: true } },
      },
    }),
  ]);

  const formatResult = (data: unknown): Array<Record<string, number | string>> => {
    const arr = data as Array<Record<string, unknown>>;
    return arr.map((row) => {
      const result: Record<string, number | string> = {};
      Object.entries(row).forEach(([key, value]) => {
        if (value instanceof BigInt) {
          result[key] = Number(value);
        } else if (value instanceof Date) {
          result[key] = value.toISOString();
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
    affiliateRevenue: Number(affiliateRevenue._sum.amount || 0),
    advertisingRevenue: Number(advertisingRevenue._sum.amount || 0),
    subscriptionRevenue: Number(subscriptionRevenue._sum.amount || 0),
    sponsoredListingRevenue: Number(sponsoredListingRevenue._sum.amount || 0),
    totalRevenue: Number(totalRevenue._sum.amount || 0),
    monthlyRevenue: formatResult(monthlyRevenue),
    revenueByDay: formatResult(revenueByDay),
    revenueByMonth: formatResult(revenueByMonth),
    revenueByType: formatResult(revenueByType),
    topTools: formatResult(topTools),
    pendingPayouts: {
      amount: Number(pendingPayouts._sum.amount || 0),
      count: pendingPayouts._count,
    },
    recentTransactions,
  });
}
