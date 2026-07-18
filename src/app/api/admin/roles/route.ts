import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roles = await prisma.userRole.findMany({
    orderBy: { level: "desc" },
    include: {
      _count: { select: { users: true } },
    },
  });

  return NextResponse.json(roles);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, slug, description, level } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
  }

  const existing = await prisma.userRole.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "A role with this slug already exists" }, { status: 400 });
  }

  const role = await prisma.userRole.create({
    data: {
      name,
      slug,
      description,
      level: level || 0,
    },
  });

  return NextResponse.json(role);
}
