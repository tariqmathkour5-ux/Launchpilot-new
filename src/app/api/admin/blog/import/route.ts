import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { importBlogPosts, type ImportSource } from "@/lib/blog-import";
import { canCreateBlogPosts } from "@/lib/blog-permissions";

const importRequestSchema = z.object({
  items: z
    .array(
      z.object({
        label: z.string().min(1),
        type: z.enum(["markdown", "structured"]),
        content: z.union([z.string(), z.record(z.string(), z.unknown())]),
      })
    )
    .min(1, "At least one item is required")
    .max(100, "Import batches are limited to 100 items at a time"),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Importing is a form of creating posts, so it uses the same permission
  // as POST /api/admin/blog rather than a separate "import" permission.
  if (!(await canCreateBlogPosts())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { items } = importRequestSchema.parse(body);

    const report = await importBlogPosts(items as ImportSource[], session.user.id);

    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Error importing blog posts:", error);
    return NextResponse.json({ error: "Failed to import blog posts" }, { status: 500 });
  }
}
