import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPostsForCalendar } from "@/lib/blog-posts";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1)); // 1-12

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  const posts = await getPostsForCalendar(startDate, endDate);

  return NextResponse.json({ posts, year, month });
}
