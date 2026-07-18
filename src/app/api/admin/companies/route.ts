import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      website: true,
      industry: true,
      status: true,
      verified: true,
      createdAt: true,
    },
  });

  return NextResponse.json(companies);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, slug, website, description, industry, size, founded, headquarters, email, phone } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
  }

  const existing = await prisma.company.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "A company with this slug already exists" }, { status: 400 });
  }

  const company = await prisma.company.create({
    data: {
      name,
      slug,
      website,
      description,
      industry,
      size,
      founded,
      headquarters,
      email,
      phone,
    },
  });

  return NextResponse.json(company);
}
