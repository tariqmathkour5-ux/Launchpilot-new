import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  const { tool_id, note } = await request.json();

  if (!tool_id) return NextResponse.json({ error: 'tool_id required' }, { status: 400 });

  const collection = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM user_collections WHERE slug = ${slug} AND user_id = ${session.user.id}
  `;

  if (collection.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const maxOrder = await prisma.$queryRaw<Array<{ max_order: number | null }>>`
    SELECT MAX(sort_order) as max_order FROM collection_items WHERE collection_id = ${collection[0].id}::uuid
  `;

  const nextOrder = (maxOrder[0]?.max_order ?? -1) + 1;

  try {
    await prisma.$executeRaw`
      INSERT INTO collection_items (collection_id, tool_id, note, sort_order)
      VALUES (${collection[0].id}::uuid, ${tool_id}, ${note || null}, ${nextOrder})
      ON CONFLICT (collection_id, tool_id) DO UPDATE SET note = EXCLUDED.note
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Collection item POST error:', error);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const toolId = searchParams.get('tool_id');

  if (!toolId) return NextResponse.json({ error: 'tool_id required' }, { status: 400 });

  const collection = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM user_collections WHERE slug = ${slug} AND user_id = ${session.user.id}
  `;

  if (collection.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.$executeRaw`
    DELETE FROM collection_items WHERE collection_id = ${collection[0].id}::uuid AND tool_id = ${toolId}
  `;

  return NextResponse.json({ success: true });
}
