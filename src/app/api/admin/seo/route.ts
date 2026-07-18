import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metadata = await prisma.sEOMetadata.findMany({
    orderBy: { path: "asc" },
  });

  return NextResponse.json(metadata);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { path, title, description, keywords, ogImage, canonical, noIndex } = body;

  const metadata = await prisma.sEOMetadata.create({
    data: {
      path,
      title,
      description,
      keywords: keywords || [],
      ogImage,
      canonical,
      noIndex: noIndex || false,
    },
  });

  return NextResponse.json(metadata);
}
