import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const tool = await prisma.tool.findUnique({
    where: { id },
    include: {
      category: true,
      review: true,
      alternative: true,
      faqs: true,
    },
  });

  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  return NextResponse.json({ tool });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const tool = await prisma.tool.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ tool });
  } catch (error) {
    console.error("Error updating tool:", error);
    return NextResponse.json({ error: "Failed to update tool" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.tool.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
