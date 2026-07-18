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
    totalSubscribers,
    activeSubscribers,
    unsubscribedSubscribers,
    growthByMonth,
    campaigns,
    topSources,
    growthTrend,
  ] = await Promise.all([
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
    prisma.newsletterSubscriber.count({ where: { status: "UNSUBSCRIBED", unsubscribedAt: { gte: startDate } } }),
    prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', "subscribedAt") as month,
        COUNT(*) as new_subscribers
      FROM "NewsletterSubscriber"
      WHERE "subscribedAt" >= ${new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)}
      GROUP BY DATE_TRUNC('month', "subscribedAt")
      ORDER BY month DESC
      LIMIT 12
    `,
    prisma.newsletterCampaign.findMany({
      where: { status: "SENT", sentAt: { gte: startDate } },
      orderBy: { sentAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        subject: true,
        sentAt: true,
        recipientCount: true,
        openCount: true,
        clickCount: true,
        unsubscribeCount: true,
        bounceCount: true,
      },
    }),
    prisma.$queryRaw`
      SELECT COALESCE(source, 'direct') as source, COUNT(*) as count
      FROM "NewsletterSubscriber"
      WHERE status = 'ACTIVE'
      GROUP BY source
      ORDER BY count DESC
      LIMIT 10
    `,
    prisma.$queryRaw`
      SELECT DATE("subscribedAt") as date, COUNT(*) as count
      FROM "NewsletterSubscriber"
      WHERE "subscribedAt" >= ${startDate}
      GROUP BY DATE("subscribedAt")
      ORDER BY date DESC
      LIMIT 30
    `,
  ]);

  const campaignStats = campaigns.map((c) => ({
    ...c,
    openRate: c.recipientCount > 0 ? ((c.openCount / c.recipientCount) * 100).toFixed(2) : "0",
    clickRate: c.recipientCount > 0 ? ((c.clickCount / c.recipientCount) * 100).toFixed(2) : "0",
  }));

  const avgOpenRate = campaigns.length > 0
    ? campaigns.reduce((sum, c) => {
        const rate = c.recipientCount > 0 ? (c.openCount / c.recipientCount) * 100 : 0;
        return sum + rate;
      }, 0) / campaigns.length
    : 0;

  const avgClickRate = campaigns.length > 0
    ? campaigns.reduce((sum, c) => {
        const rate = c.recipientCount > 0 ? (c.clickCount / c.recipientCount) * 100 : 0;
        return sum + rate;
      }, 0) / campaigns.length
    : 0;

  const formatResult = (data: unknown): Array<{ [key: string]: number | string }> => {
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
    totalSubscribers,
    activeSubscribers,
    unsubscribedSubscribers,
    growth: activeSubscribers - unsubscribedSubscribers,
    growthRate: totalSubscribers > 0 ? ((activeSubscribers - unsubscribedSubscribers) / totalSubscribers * 100).toFixed(2) : "0",
    openRate: parseFloat(avgOpenRate.toFixed(2)),
    clickRate: parseFloat(avgClickRate.toFixed(2)),
    campaigns: campaignStats,
    growthByMonth: formatResult(growthByMonth),
    topSources: formatResult(topSources),
    growthTrend: formatResult(growthTrend),
  });
}
