import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    toolsCount,
    categoriesCount,
    companiesCount,
    usersCount,
    reviewsCount,
    affiliateClicksCount,
    newsletterCount,
    featuredCount,
    recentTools,
    recentReviews,
    recentCompanies,
    recentActivity,
  ] = await Promise.all([
    prisma.tool.count(),
    prisma.category.count(),
    prisma.company.count(),
    prisma.user.count(),
    prisma.$queryRaw`SELECT COUNT(*) FROM "UserReview"`,
    prisma.$queryRaw`SELECT COUNT(*) FROM "AffiliateClick"`,
    prisma.$queryRaw`SELECT COUNT(*) FROM "NewsletterSubscriber" WHERE status = 'ACTIVE'`,
    prisma.tool.count({ where: { featured: true } }),
    prisma.tool.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true, rating: true, createdAt: true },
    }),
    prisma.$queryRaw`
      SELECT r.id, r.rating, r.title, r.created_at, u.name as user_name
      FROM "UserReview" r
      LEFT JOIN "User" u ON u.id = r."userId"
      ORDER BY r.created_at DESC
      LIMIT 5
    `,
    prisma.company.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true, verified: true, createdAt: true },
    }),
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        resource: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  const reviewsCountNum = Number((reviewsCount as [{ count: bigint }])[0]?.count || 0);
  const affiliateClicksCountNum = Number((affiliateClicksCount as [{ count: bigint }])[0]?.count || 0);
  const newsletterCountNum = Number((newsletterCount as [{ count: bigint }])[0]?.count || 0);

  return NextResponse.json({
    tools: toolsCount,
    categories: categoriesCount,
    companies: companiesCount,
    users: usersCount,
    reviews: reviewsCountNum,
    affiliateClicks: affiliateClicksCountNum,
    newsletterSubscribers: newsletterCountNum,
    featured: featuredCount,
    recentTools,
    recentReviews,
    recentCompanies,
    recentActivity,
  });
}
