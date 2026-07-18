import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { getAll } from "@/lib/blog-posts";
import { createPost } from "@/lib/blog-post-service";
import { setPostTags } from "@/lib/blog-tags";
import { canCreateBlogPosts } from "@/lib/blog-permissions";

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await getAll();

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await canCreateBlogPosts())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const post = await createPost(body, session.user.id, session.user.role as "ADMIN" | "EDITOR");

    // tagIds is not part of createBlogPostSchema (it validates BlogPost's own
    // scalar fields only) — it's handled separately here because saving the
    // BlogPost <-> BlogTag relationship is a second write (setPostTags),
    // not a field on the post itself. Named `blogTags` in the response,
    // not `tags`, since `post.tags` is the pre-existing legacy String[]
    // scalar field (Task 1) — this must not silently shadow that.
    const blogTags = Array.isArray(body?.tagIds) ? await setPostTags(post.id, body.tagIds) : [];

    return NextResponse.json({ post: { ...post, blogTags } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Only an admin can set")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error creating blog post:", error);
    return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 });
  }
}
