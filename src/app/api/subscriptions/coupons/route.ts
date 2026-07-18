import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 });

  const coupons = await prisma.$queryRaw<Array<{
    id: string; code: string; name: string; discount_type: string; discount_value: number;
    currency: string; max_redemptions: number | null; current_redemptions: number;
    valid_until: Date | null; applicable_plans: string[];
  }>>`
    SELECT id, code, name, discount_type, discount_value, currency,
           max_redemptions, current_redemptions, valid_until, applicable_plans
    FROM subscription_coupons
    WHERE code = ${code.toUpperCase()} AND is_active = true
      AND valid_from <= now()
      AND (valid_until IS NULL OR valid_until > now())
  `;

  if (coupons.length === 0) {
    return NextResponse.json({ valid: false, error: 'Invalid or expired coupon' });
  }

  const coupon = coupons[0];
  if (coupon.max_redemptions && coupon.current_redemptions >= coupon.max_redemptions) {
    return NextResponse.json({ valid: false, error: 'Coupon has reached maximum redemptions' });
  }

  return NextResponse.json({
    valid: true,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    name: coupon.name,
    applicable_plans: coupon.applicable_plans,
  });
}
