import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkUsageLimit, getUserPlanLimits } from '@/lib/subscriptions';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const metric = searchParams.get('metric');

  if (metric) {
    const result = await checkUsageLimit(session.user.id, metric);
    return NextResponse.json(result);
  }

  const limits = await getUserPlanLimits(session.user.id);
  return NextResponse.json(limits);
}
