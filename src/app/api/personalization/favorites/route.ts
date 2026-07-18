import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  const [favorites, folders] = await Promise.all([
    prisma.$queryRaw<Array<{
      id: string; item_type: string; item_id: string; folder_id: string | null; created_at: Date;
      name: string | null; slug: string | null;
    }>>`
      SELECT uf.id, uf.item_type, uf.item_id, uf.folder_id, uf.created_at,
        COALESCE(t.name, c.name) as name,
        COALESCE(t.slug, c.slug) as slug
      FROM user_favorites uf
      LEFT JOIN "Tool" t ON uf.item_type = 'tool' AND t.id = uf.item_id
      LEFT JOIN "Company" c ON uf.item_type = 'company' AND c.id = uf.item_id
      WHERE uf.user_id = ${userId}
      ORDER BY uf.created_at DESC
    `,
    prisma.$queryRaw<Array<{ id: string; name: string; color: string | null }>>`
      SELECT id, name, color FROM favorite_folders WHERE user_id = ${userId} ORDER BY name
    `,
  ]);

  return NextResponse.json({ favorites, folders });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;
  const { item_type, item_id, folder_id } = await request.json();

  if (!item_type || !item_id) {
    return NextResponse.json({ error: 'item_type and item_id required' }, { status: 400 });
  }

  try {
    await prisma.$executeRaw`
      INSERT INTO user_favorites (user_id, item_type, item_id, folder_id)
      VALUES (${userId}, ${item_type}, ${item_id}, ${folder_id || null}::uuid)
      ON CONFLICT (user_id, item_type, item_id) DO UPDATE SET folder_id = EXCLUDED.folder_id
    `;

    await prisma.$executeRaw`
      INSERT INTO user_interests (user_id, tool_id, category_id, interest_type, weight)
      SELECT ${userId},
        CASE WHEN ${item_type} = 'tool' THEN ${item_id} ELSE NULL END,
        CASE WHEN ${item_type} = 'tool' THEN (SELECT "categoryId" FROM "Tool" WHERE id = ${item_id}) ELSE NULL END,
        'favorited', 2.0
      WHERE ${item_type} = 'tool'
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Favorite POST error:', error);
    return NextResponse.json({ error: 'Failed to save favorite' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const item_type = searchParams.get('item_type');
  const item_id = searchParams.get('item_id');

  if (id) {
    await prisma.$executeRaw`DELETE FROM user_favorites WHERE id = ${id}::uuid AND user_id = ${session.user.id}`;
  } else if (item_type && item_id) {
    await prisma.$executeRaw`DELETE FROM user_favorites WHERE user_id = ${session.user.id} AND item_type = ${item_type} AND item_id = ${item_id}`;
  } else {
    return NextResponse.json({ error: 'id or item_type+item_id required' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
