import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { subscribedAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      source: true,
      status: true,
      subscribedAt: true,
    },
  });

  return NextResponse.json(subscribers);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { email, name, source } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already subscribed" }, { status: 400 });
  }

  const subscriber = await prisma.newsletterSubscriber.create({
    data: { email, name, source },
  });

  return NextResponse.json(subscriber);
}
