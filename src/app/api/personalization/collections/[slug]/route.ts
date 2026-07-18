import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const collection = await prisma.$queryRaw<Array<{
    id: string; user_id: string; name: string; description: string | null;
    slug: string; is_public: boolean; created_at: Date;
  }>>`
    SELECT id, user_id, name, description, slug, is_public, created_at
    FROM user_collections WHERE slug = ${slug}
  `;

  if (collection.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const col = collection[0];
  const session = await auth();
  const isOwner = session?.user?.id === col.user_id;

  if (!col.is_public && !isOwner) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const items = await prisma.$queryRaw<Array<{
    id: string; tool_id: string; note: string | null; sort_order: number;
    slug: string; name: string; title: string; description: string; pricing: string; rating: number | null;
  }>>`
    SELECT ci.id, ci.tool_id, ci.note, ci.sort_order,
      t.slug, t.name, t.title, t.description, t.pricing, t.rating
    FROM collection_items ci
    JOIN "Tool" t ON t.id = ci.tool_id
    WHERE ci.collection_id = ${col.id}::uuid
    ORDER BY ci.sort_order, ci.added_at
  `;

  return NextResponse.json({ ...col, items, isOwner });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  const { name, description, is_public } = await request.json();

  await prisma.$executeRaw`
    UPDATE user_collections
    SET name = COALESCE(${name || null}, name),
        description = COALESCE(${description ?? null}, description),
        is_public = COALESCE(${is_public ?? null}::boolean, is_public),
        updated_at = now()
    WHERE slug = ${slug} AND user_id = ${session.user.id}
  `;

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;

  await prisma.$executeRaw`
    DELETE FROM user_collections WHERE slug = ${slug} AND user_id = ${session.user.id}
  `;

  return NextResponse.json({ success: true });
}
