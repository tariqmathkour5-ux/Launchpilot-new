import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, color } = await request.json();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  await prisma.$executeRaw`
    INSERT INTO favorite_folders (user_id, name, color)
    VALUES (${session.user.id}, ${name}, ${color || null})
  `;

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name, color } = await request.json();
  if (!id || !name) return NextResponse.json({ error: 'id and name required' }, { status: 400 });

  await prisma.$executeRaw`
    UPDATE favorite_folders SET name = ${name}, color = ${color || null}, updated_at = now()
    WHERE id = ${id}::uuid AND user_id = ${session.user.id}
  `;

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await prisma.$executeRaw`
    DELETE FROM favorite_folders WHERE id = ${id}::uuid AND user_id = ${session.user.id}
  `;

  return NextResponse.json({ success: true });
}
