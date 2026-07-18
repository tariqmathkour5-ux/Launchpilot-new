import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [total, published, draft, review, recentPosts, publishedLast7Days] = await Promise.all([
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
    prisma.blogPost.count({ where: { status: "DRAFT" } }),
    prisma.blogPost.count({ where: { status: "REVIEW" } }),
    prisma.blogPost.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, slug: true, status: true, updatedAt: true },
    }),
    prisma.blogPost.count({ where: { status: "PUBLISHED", publishedAt: { gte: sevenDaysAgo } } }),
  ]);

  return NextResponse.json({
    metrics: { total, published, draft, review },
    recentPosts,
    publishingActivity: { last7Days: publishedLast7Days },
  });
}
