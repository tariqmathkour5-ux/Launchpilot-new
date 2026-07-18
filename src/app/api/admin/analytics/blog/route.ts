import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getPopularPosts,
  getViewsOverTime,
  getPopularCategories,
  getEngagementSummary,
} from "@/lib/blog-analytics";

function serializeBigInts<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, val) => (typeof val === "bigint" ? Number(val) : val)));
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");

  // All four aggregations run in parallel rather than sequentially — each
  // is already a single indexed query on its own (see blog-analytics.ts),
  // so the only further optimization available at this layer is not
  // waiting on them one at a time.
  const [popularPosts, viewsOverTime, popularCategories, engagement] = await Promise.all([
    getPopularPosts({ days, limit: 10 }),
    getViewsOverTime(days),
    getPopularCategories({ days, limit: 10 }),
    getEngagementSummary(days),
  ]);

  return NextResponse.json(
    serializeBigInts({
      popularPosts,
      viewsOverTime,
      popularCategories,
      engagement,
    })
  );
}
