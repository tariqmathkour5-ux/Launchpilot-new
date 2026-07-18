import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildJsonExport, buildMarkdownExport } from "@/lib/blog-export";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "markdown" ? "markdown" : "json";

  try {
    if (format === "markdown") {
      // Multiple files (one per post) — returned as a JSON envelope of
      // { filename, content } pairs rather than a .zip archive, since no
      // archive library is a dependency anywhere in this codebase and
      // adding one is outside this task's scope. Each `content` string is
      // itself a complete markdown file (frontmatter + body).
      const files = await buildMarkdownExport();
      return NextResponse.json({ format: "markdown", files });
    }

    const payload = await buildJsonExport();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error exporting blog content:", error);
    return NextResponse.json({ error: "Failed to export blog content" }, { status: 500 });
  }
}
