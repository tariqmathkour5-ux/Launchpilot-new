import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const collections = await prisma.$queryRaw<Array<{
    id: string; name: string; description: string | null; slug: string;
    is_public: boolean; created_at: Date; item_count: bigint;
  }>>`
    SELECT uc.id, uc.name, uc.description, uc.slug, uc.is_public, uc.created_at,
      (SELECT COUNT(*) FROM collection_items ci WHERE ci.collection_id = uc.id) as item_count
    FROM user_collections uc
    WHERE uc.user_id = ${session.user.id}
    ORDER BY uc.updated_at DESC
  `;

  return NextResponse.json(collections.map(c => ({ ...c, item_count: Number(c.item_count) })));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description, is_public } = await request.json();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

  try {
    await prisma.$executeRaw`
      INSERT INTO user_collections (user_id, name, description, slug, is_public)
      VALUES (${session.user.id}, ${name}, ${description || null}, ${slug}, ${is_public ?? false})
    `;
    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error('Collection POST error:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
