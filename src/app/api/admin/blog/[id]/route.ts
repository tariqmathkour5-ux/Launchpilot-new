import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { getById } from "@/lib/blog-posts";
import { updatePost, deletePost } from "@/lib/blog-post-service";
import { setPostTags } from "@/lib/blog-tags";
import { canEditBlogPosts, canDeleteBlogPosts } from "@/lib/blog-permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const post = await getById(id);

  if (!post) {
    return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
  }

  return NextResponse.json({ post });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await canEditBlogPosts())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const post = await updatePost(id, body, session.user.role as "ADMIN" | "EDITOR", session.user.id);

    // Same reasoning as the create route: tagIds isn't part of
    // updateBlogPostSchema, it's a second write against the relationship,
    // and it's returned as `blogTags` to avoid shadowing the legacy
    // `post.tags` scalar field.
    const blogTags = Array.isArray(body?.tagIds) ? await setPostTags(id, body.tagIds) : undefined;

    return NextResponse.json({ post: blogTags !== undefined ? { ...post, blogTags } : post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Blog post not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message.startsWith("Only an admin can set")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error updating blog post:", error);
    return NextResponse.json({ error: "Failed to update blog post" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await canDeleteBlogPosts())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await deletePost(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Blog post not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error deleting blog post:", error);
    return NextResponse.json({ error: "Failed to delete blog post" }, { status: 500 });
  }
}
