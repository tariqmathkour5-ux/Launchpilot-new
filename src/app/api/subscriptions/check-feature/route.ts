import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkFeatureAccess } from '@/lib/subscriptions';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ hasAccess: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const feature = searchParams.get('feature');

  if (!feature) {
    return NextResponse.json({ hasAccess: false, error: 'Feature parameter required' }, { status: 400 });
  }

  const hasAccess = await checkFeatureAccess(session.user.id, feature);
  
  return NextResponse.json({ hasAccess });
}