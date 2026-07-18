import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import {
  createCommentSchema,
  createComment,
  getCommentsByPost,
} from "@/lib/blog-comments";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  // Public visitors only ever see APPROVED comments. Signed-in
  // ADMIN/EDITOR users (moderators) see every status, same access level
  // the rest of the blog admin already grants them.
  const session = await auth();
  const includeAllStatuses = session?.user?.role === "ADMIN" || session?.user?.role === "EDITOR";

  const comments = await getCommentsByPost(postId, { includeAllStatuses });

  return NextResponse.json({ comments });
}

export async function POST(request: Request) {
  const session = await auth();

  // 5 submissions per 10 minutes per IP. This is separate from and
  // complementary to the honeypot/link-count spam heuristics already in
  // createComment() (Task 27) — those judge a single submission's
  // content, this limits submission *volume* regardless of content,
  // which content-based heuristics can't catch on their own.
  const rateLimitKey = `comment:${getClientIp(request)}`;
  const rateLimit = checkRateLimit(rateLimitKey, 5, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many comments submitted. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const data = createCommentSchema.parse(body);

    // Zod alone can't know whether a session exists, so the "name is
    // required for guest comments" rule lives here rather than in the
    // schema: logged-in users get their name from the session, guests
    // must supply one themselves.
    if (!session?.user?.id && !data.authorName) {
      return NextResponse.json({ error: "Name is required to comment" }, { status: 400 });
    }

    const result = await createComment(
      data,
      session?.user?.id
        ? { userId: session.user.id, name: session.user.name, email: session.user.email }
        : undefined
    );

    if (result.wasDuplicate) {
      // Not an error — the identical comment already exists, so return it
      // as-is rather than creating a second copy or rejecting the request.
      return NextResponse.json({ comment: result.comment, duplicate: true });
    }

    return NextResponse.json(
      { comment: result.comment, autoRejected: result.wasAutoRejected },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Error creating blog comment:", error);
    return NextResponse.json({ error: "Failed to submit comment" }, { status: 500 });
  }
}
