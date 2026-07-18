import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = await prisma.$queryRaw<Array<{
    personalization_enabled: boolean;
    track_views: boolean;
    track_searches: boolean;
    track_clicks: boolean;
    share_collections: boolean;
  }>>`
    SELECT personalization_enabled, track_views, track_searches, track_clicks, share_collections
    FROM user_privacy_settings WHERE user_id = ${session.user.id}
  `;

  if (settings.length === 0) {
    return NextResponse.json({
      personalization_enabled: true,
      track_views: true,
      track_searches: true,
      track_clicks: true,
      share_collections: true,
    });
  }

  return NextResponse.json(settings[0]);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    personalization_enabled,
    track_views,
    track_searches,
    track_clicks,
    share_collections,
  } = body;

  await prisma.$executeRaw`
    INSERT INTO user_privacy_settings (user_id, personalization_enabled, track_views, track_searches, track_clicks, share_collections)
    VALUES (
      ${session.user.id},
      ${personalization_enabled ?? true},
      ${track_views ?? true},
      ${track_searches ?? true},
      ${track_clicks ?? true},
      ${share_collections ?? true}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      personalization_enabled = ${personalization_enabled ?? true},
      track_views = ${track_views ?? true},
      track_searches = ${track_searches ?? true},
      track_clicks = ${track_clicks ?? true},
      share_collections = ${share_collections ?? true},
      updated_at = now()
  `;

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target');

  switch (target) {
    case 'interests':
      await prisma.$executeRaw`DELETE FROM user_interests WHERE user_id = ${session.user.id}`;
      break;
    case 'history':
      await prisma.$executeRaw`DELETE FROM recently_viewed WHERE user_id = ${session.user.id}`;
      break;
    case 'favorites':
      await prisma.$executeRaw`DELETE FROM user_favorites WHERE user_id = ${session.user.id}`;
      await prisma.$executeRaw`DELETE FROM favorite_folders WHERE user_id = ${session.user.id}`;
      break;
    case 'collections':
      await prisma.$executeRaw`DELETE FROM user_collections WHERE user_id = ${session.user.id}`;
      break;
    case 'all':
      await prisma.$executeRaw`DELETE FROM user_interests WHERE user_id = ${session.user.id}`;
      await prisma.$executeRaw`DELETE FROM recently_viewed WHERE user_id = ${session.user.id}`;
      await prisma.$executeRaw`DELETE FROM user_favorites WHERE user_id = ${session.user.id}`;
      await prisma.$executeRaw`DELETE FROM favorite_folders WHERE user_id = ${session.user.id}`;
      await prisma.$executeRaw`DELETE FROM user_collections WHERE user_id = ${session.user.id}`;
      await prisma.$executeRaw`DELETE FROM recommendation_events WHERE user_id = ${session.user.id}`;
      await prisma.$executeRaw`DELETE FROM user_privacy_settings WHERE user_id = ${session.user.id}`;
      break;
    default:
      return NextResponse.json({ error: 'Invalid target. Use: interests, history, favorites, collections, all' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
