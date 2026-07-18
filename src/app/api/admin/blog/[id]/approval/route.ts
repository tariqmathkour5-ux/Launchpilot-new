import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { submitForReview, approveContent, rejectContent } from "@/lib/blog-post-service";
import { getApprovalHistory } from "@/lib/blog-approvals";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const approvalRequestSchema = z.object({
  action: z.enum(["submit", "approve", "reject"]),
  notes: z.string().max(2000).optional(),
});

export async function GET(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const history = await getApprovalHistory(id);
  return NextResponse.json({ history });
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, notes } = approvalRequestSchema.parse(body);
    const role = session.user.role as "ADMIN" | "EDITOR";

    if (action === "reject" && !notes) {
      return NextResponse.json({ error: "Notes are required when rejecting content" }, { status: 400 });
    }

    if (action === "submit") {
      const post = await submitForReview(id, role, session.user.id);
      return NextResponse.json({ post });
    }
    if (action === "approve") {
      const post = await approveContent(id, role, session.user.id, notes);
      return NextResponse.json({ post });
    }
    const post = await rejectContent(id, role, session.user.id, notes);
    return NextResponse.json({ post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Only an admin can set")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Blog post not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error processing blog approval action:", error);
    return NextResponse.json({ error: "Failed to process approval action" }, { status: 500 });
  }
}
