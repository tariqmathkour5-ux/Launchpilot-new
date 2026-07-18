import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listAllComments } from "@/lib/blog-comments";

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
type CommentStatus = (typeof VALID_STATUSES)[number];

export async function GET(request: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const status = VALID_STATUSES.includes(statusParam as CommentStatus)
    ? (statusParam as CommentStatus)
    : undefined;

  const comments = await listAllComments({ status });

  return NextResponse.json({ comments });
}
