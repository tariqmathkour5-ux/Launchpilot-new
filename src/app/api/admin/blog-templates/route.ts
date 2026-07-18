import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { createTemplateSchema, createTemplate, listTemplates } from "@/lib/blog-templates";

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await listTemplates();
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createTemplateSchema.parse(body);
    const template = await createTemplate(data, session.user.id);
    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Error creating blog template:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
