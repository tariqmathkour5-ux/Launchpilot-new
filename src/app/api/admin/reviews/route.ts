import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviews = await prisma.$queryRaw`
    SELECT
      ur.id, ur.rating, ur.title, ur.content, ur.verified, ur.helpful, ur.created_at as "createdAt",
      t.name as tool_name,
      u.name as user_name
    FROM "UserReview" ur
    LEFT JOIN "Tool" t ON t.id = ur."toolId"
    LEFT JOIN "User" u ON u.id = ur."userId"
    ORDER BY ur.created_at DESC
    LIMIT 100
  `;

  const formattedReviews = (reviews as Array<{
    id: string;
    rating: number;
    title: string | null;
    content: string;
    verified: boolean;
    helpful: number;
    createdAt: Date;
    tool_name: string | null;
    user_name: string | null;
  }>).map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    content: r.content,
    verified: r.verified,
    helpful: r.helpful,
    createdAt: r.createdAt,
    tool: r.tool_name ? { name: r.tool_name } : null,
    user: r.user_name ? { name: r.user_name } : null,
  }));

  return NextResponse.json(formattedReviews);
}
