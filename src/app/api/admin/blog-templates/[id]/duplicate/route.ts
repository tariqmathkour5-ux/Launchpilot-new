import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { duplicateTemplate } from "@/lib/blog-templates";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const template = await duplicateTemplate(id, session.user.id);
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Template not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error duplicating blog template:", error);
    return NextResponse.json({ error: "Failed to duplicate template" }, { status: 500 });
  }
}
