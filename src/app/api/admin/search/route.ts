import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  // Convert to lowercase for case-insensitive search in SQLite
  const qLower = q.toLowerCase();

  const [tools, users, companies, categories] = await Promise.all([
    prisma.tool.findMany({
      where: { OR: [{ name: { contains: qLower } }, { title: { contains: qLower } }] },
      take: 5,
      select: { id: true, name: true, description: true },
    }),
    prisma.user.findMany({
      where: { OR: [{ name: { contains: qLower } }, { email: { contains: qLower } }] },
      take: 5,
      select: { id: true, name: true, email: true },
    }),
    prisma.company.findMany({
      where: { name: { contains: qLower } },
      take: 5,
      select: { id: true, name: true, description: true },
    }),
    prisma.category.findMany({
      where: { OR: [{ name: { contains: qLower } }, { slug: { contains: qLower } }] },
      take: 5,
      select: { id: true, name: true, description: true },
    }),
  ]);

  const results = [
    ...tools.map((t) => ({ type: "tool", id: t.id, name: t.name, description: t.description, href: `/admin/tools/${t.id}` })),
    ...users.map((u) => ({ type: "user", id: u.id, name: u.name || u.email || "Unknown", description: u.email || undefined, href: `/admin/users/${u.id}` })),
    ...companies.map((c) => ({ type: "company", id: c.id, name: c.name, description: c.description || undefined, href: `/admin/companies/${c.id}` })),
    ...categories.map((c) => ({ type: "category", id: c.id, name: c.name, description: c.description || undefined, href: `/admin/categories/${c.id}` })),
  ];

  return NextResponse.json(results);
}
