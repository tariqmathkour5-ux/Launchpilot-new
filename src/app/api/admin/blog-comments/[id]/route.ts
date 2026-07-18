import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import {
  updateCommentStatusSchema,
  updateCommentStatus,
  deleteComment,
} from "@/lib/blog-comments";
import { canManageBlogComments } from "@/lib/blog-permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await canManageBlogComments())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = updateCommentStatusSchema.parse(body);

    const comment = await updateCommentStatus(id, status);

    return NextResponse.json({ comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Comment not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error updating comment status:", error);
    return NextResponse.json({ error: "Failed to update comment status" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await canManageBlogComments())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await deleteComment(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Comment not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
