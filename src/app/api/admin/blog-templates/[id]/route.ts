import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { updateTemplateSchema, updateTemplate, deleteTemplate } from "@/lib/blog-templates";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateTemplateSchema.parse(body);
    const template = await updateTemplate(id, data);
    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Template not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error updating blog template:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteTemplate(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Template not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error deleting blog template:", error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
