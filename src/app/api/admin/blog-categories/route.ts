import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import {
  createBlogCategorySchema,
  createBlogCategory,
  listBlogCategories,
} from "@/lib/blog-categories";
import { canManageBlogCategories } from "@/lib/blog-permissions";

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await listBlogCategories();

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await canManageBlogCategories())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = createBlogCategorySchema.parse(body);

    const category = await createBlogCategory(data);

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Error creating blog category:", error);
    return NextResponse.json({ error: "Failed to create blog category" }, { status: 500 });
  }
}
