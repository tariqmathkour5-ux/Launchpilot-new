import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const toolSchema = z.object({
  slug: z.string(),
  name: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  content: z.string(),
  categoryId: z.string(),
  pricing: z.string().default("unknown"),
  hasFreeTier: z.boolean().default(false),
  hasApi: z.boolean().default(false),
  platforms: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  useCases: z.array(z.string()).default([]),
  integrations: z.array(z.string()).default([]),
  websiteUrl: z.string().optional(),
  rating: z.number().optional(),
  published: z.boolean().default(true),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const published = searchParams.get("published");

  const where: Record<string, unknown> = {};
  if (category) where.categoryId = category;
  if (published !== null) where.published = published === "true";

  const tools = await prisma.tool.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tools });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = toolSchema.parse(body);

    const tool = await prisma.tool.create({
      data: {
        slug: data.slug,
        name: data.name,
        title: data.title,
        description: data.description,
        content: data.content,
        categoryId: data.categoryId,
        pricing: data.pricing,
        hasFreeTier: data.hasFreeTier,
        hasApi: data.hasApi,
        platforms: JSON.stringify(data.platforms),
        features: JSON.stringify(data.features),
        pros: JSON.stringify(data.pros),
        cons: JSON.stringify(data.cons),
        useCases: JSON.stringify(data.useCases),
        integrations: JSON.stringify(data.integrations),
        websiteUrl: data.websiteUrl,
        rating: data.rating,
        published: data.published,
        authorId: session.user.id,
      },
    });

    return NextResponse.json({ tool }, { status: 201 });
  } catch (error) {
    console.error("Error creating tool:", error);
    return NextResponse.json({ error: "Failed to create tool" }, { status: 500 });
  }
}
