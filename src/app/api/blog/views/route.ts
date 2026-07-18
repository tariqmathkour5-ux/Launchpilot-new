import { NextResponse } from "next/server";
import { recordView } from "@/lib/blog-analytics";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ipAddress = getClientIp(request);

  // 30 view-tracking calls per minute per IP — generous enough for
  // legitimate fast browsing, tight enough to blunt naive view-count
  // inflation attempts that rotate sessionId to dodge the per-session
  // dedup window already in recordView() (Task 29).
  const rateLimit = checkRateLimit(`view:${ipAddress}`, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ recorded: false }, { status: 200 });
  }

  try {
    const body = await request.json();
    const postId = typeof body?.postId === "string" ? body.postId : "";
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : undefined;

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    // user-agent/referrer come from the request itself, not the client
    // body — a caller could put anything in a JSON body, but can't forge
    // the headers this server actually received.
    const userAgent = request.headers.get("user-agent");
    const referrer = request.headers.get("referer");

    const result = await recordView({
      postId,
      sessionId,
      ipAddress,
      userAgent,
      referrer,
    });

    return NextResponse.json({ recorded: result.recorded });
  } catch (error) {
    console.error("Error recording blog post view:", error);
    // Analytics failures should never surface as a user-facing error —
    // this is fire-and-forget from the client, so just report it and move on.
    return NextResponse.json({ recorded: false }, { status: 200 });
  }
}
