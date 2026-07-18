import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import {
  createBlogTagSchema,
  createBlogTag,
  listBlogTags,
} from "@/lib/blog-tags";

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tags = await listBlogTags();

  return NextResponse.json({ tags });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createBlogTagSchema.parse(body);

    const tag = await createBlogTag(data);

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Error creating blog tag:", error);
    return NextResponse.json({ error: "Failed to create blog tag" }, { status: 500 });
  }
}
