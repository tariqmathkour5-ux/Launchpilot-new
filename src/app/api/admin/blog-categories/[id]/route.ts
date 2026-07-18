import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import {
  updateBlogCategorySchema,
  updateBlogCategory,
  deleteBlogCategory,
} from "@/lib/blog-categories";
import { canManageBlogCategories } from "@/lib/blog-permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await canManageBlogCategories())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateBlogCategorySchema.parse(body);

    const category = await updateBlogCategory(id, data);

    return NextResponse.json({ category });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Error updating blog category:", error);
    return NextResponse.json({ error: "Failed to update blog category" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await canManageBlogCategories())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const result = await deleteBlogCategory(id);

    if (!result.success) {
      if (result.error === "NOT_FOUND") {
        return NextResponse.json({ error: "Blog category not found" }, { status: 404 });
      }

      return NextResponse.json(
        {
          error: "Category is in use and cannot be deleted",
          postCount: result.postCount,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog category:", error);
    return NextResponse.json({ error: "Failed to delete blog category" }, { status: 500 });
  }
}
