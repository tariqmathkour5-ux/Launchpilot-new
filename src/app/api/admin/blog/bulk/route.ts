import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import {
  bulkPublish,
  bulkArchive,
  bulkDelete,
  bulkUpdateCategory,
} from "@/lib/blog-bulk-actions";
import { canDeleteBlogPosts, canEditBlogPosts } from "@/lib/blog-permissions";

const bulkRequestSchema = z.object({
  action: z.enum(["publish", "archive", "delete", "updateCategory"]),
  ids: z.array(z.string().min(1)).min(1).max(100),
  categoryId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, ids, categoryId } = bulkRequestSchema.parse(body);
    const role = session.user.role as "ADMIN" | "EDITOR";

    switch (action) {
      case "publish": {
        // Permission enforced inside bulkPublish via assertCanSetStatus
        // (same rule as the single-post publish path, Task 31).
        const result = await bulkPublish(ids, role);
        return NextResponse.json(result);
      }
      case "archive": {
        const result = await bulkArchive(ids, role);
        return NextResponse.json(result);
      }
      case "delete": {
        // bulkDelete has no internal permission check (matching how
        // deletePost() doesn't either) — checked here, same as the
        // single-post DELETE route.
        if (!(await canDeleteBlogPosts())) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const result = await bulkDelete(ids);
        return NextResponse.json(result);
      }
      case "updateCategory": {
        if (!categoryId) {
          return NextResponse.json({ error: "categoryId is required for updateCategory" }, { status: 400 });
        }
        if (!(await canEditBlogPosts())) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const result = await bulkUpdateCategory(ids, categoryId);
        return NextResponse.json(result);
      }
    }

    // Unreachable given the Zod enum above, but keeps every code path
    // returning a response rather than relying on that being obvious to
    // the type checker.
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Only an admin can set")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (
      error instanceof Error &&
      (error.message === "Target category not found" ||
        error.message.includes("limited to") ||
        error.message === "Select at least one post")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error performing bulk blog action:", error);
    return NextResponse.json({ error: "Bulk action failed" }, { status: 500 });
  }
}
