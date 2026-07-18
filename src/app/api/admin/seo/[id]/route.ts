import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { title, description, keywords, ogImage, canonical, noIndex } = body;

  const metadata = await prisma.sEOMetadata.update({
    where: { id },
    data: {
      title,
      description,
      keywords,
      ogImage,
      canonical,
      noIndex,
    },
  });

  return NextResponse.json(metadata);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.sEOMetadata.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
