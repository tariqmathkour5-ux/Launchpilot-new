import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import {
  updateBlogTagSchema,
  updateBlogTag,
  deleteBlogTag,
} from "@/lib/blog-tags";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateBlogTagSchema.parse(body);

    const tag = await updateBlogTag(id, data);

    return NextResponse.json({ tag });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Error updating blog tag:", error);
    return NextResponse.json({ error: "Failed to update blog tag" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const result = await deleteBlogTag(id);

    if (!result.success) {
      if (result.error === "NOT_FOUND") {
        return NextResponse.json({ error: "Blog tag not found" }, { status: 404 });
      }

      return NextResponse.json(
        {
          error: "Tag is in use and cannot be deleted",
          postCount: result.postCount,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog tag:", error);
    return NextResponse.json({ error: "Failed to delete blog tag" }, { status: 500 });
  }
}
