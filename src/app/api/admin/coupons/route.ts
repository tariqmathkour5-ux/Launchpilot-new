import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(coupons);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { code, description, discount, discountType, minPurchase, maxDiscount, usageLimit, startDate, endDate, toolId } = body;

  if (!code || !discount || !discountType || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: "Code already exists" }, { status: 400 });
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      description,
      discount: parseFloat(discount),
      discountType,
      minPurchase: minPurchase ? parseFloat(minPurchase) : null,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      toolId,
    },
  });

  return NextResponse.json(coupon);
}
