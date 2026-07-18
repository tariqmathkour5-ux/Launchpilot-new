import { NextResponse } from 'next/server';
import { getAllPlans } from '@/lib/subscriptions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const plans = await getAllPlans();
  return NextResponse.json(plans);
}
