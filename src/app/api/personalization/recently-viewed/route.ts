import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { item_type, item_id } = await request.json();
  if (!item_type || !item_id) {
    return NextResponse.json({ error: 'item_type and item_id required' }, { status: 400 });
  }

  const privacy = await prisma.$queryRaw<Array<{ track_views: boolean }>>`
    SELECT track_views FROM user_privacy_settings WHERE user_id = ${session.user.id}
  `;
  if (privacy.length > 0 && !privacy[0].track_views) {
    return NextResponse.json({ success: true });
  }

  await prisma.$executeRaw`
    INSERT INTO recently_viewed (user_id, item_type, item_id, viewed_at)
    VALUES (${session.user.id}, ${item_type}, ${item_id}, now())
    ON CONFLICT (user_id, item_type, item_id) DO UPDATE SET viewed_at = now()
  `;

  if (item_type === 'tool') {
    await prisma.$executeRaw`
      INSERT INTO user_interests (user_id, tool_id, category_id, interest_type, weight)
      VALUES (
        ${session.user.id},
        ${item_id},
        (SELECT "categoryId" FROM "Tool" WHERE id = ${item_id}),
        'viewed',
        1.0
      )
    `;
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = await prisma.$queryRaw<Array<{
    id: string; item_type: string; item_id: string; viewed_at: Date;
    name: string | null; slug: string | null; description: string | null;
  }>>`
    SELECT rv.id, rv.item_type, rv.item_id, rv.viewed_at,
      COALESCE(t.name, c.name, cat.name) as name,
      COALESCE(t.slug, c.slug, cat.slug) as slug,
      COALESCE(t.description, c.description, cat.description) as description
    FROM recently_viewed rv
    LEFT JOIN "Tool" t ON rv.item_type = 'tool' AND t.id = rv.item_id
    LEFT JOIN "Company" c ON rv.item_type = 'company' AND c.id = rv.item_id
    LEFT JOIN "Category" cat ON rv.item_type = 'category' AND cat.id = rv.item_id
    WHERE rv.user_id = ${session.user.id}
    ORDER BY rv.viewed_at DESC
    LIMIT 20
  `;

  return NextResponse.json(items);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const clearAll = searchParams.get('all');

  if (clearAll === 'true') {
    await prisma.$executeRaw`DELETE FROM recently_viewed WHERE user_id = ${session.user.id}`;
  } else {
    const id = searchParams.get('id');
    if (id) {
      await prisma.$executeRaw`DELETE FROM recently_viewed WHERE id = ${id}::uuid AND user_id = ${session.user.id}`;
    }
  }

  return NextResponse.json({ success: true });
}
