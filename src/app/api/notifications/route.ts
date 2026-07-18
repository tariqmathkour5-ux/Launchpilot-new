import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const notifications = await prisma.$queryRaw<Array<{
    id: string; type: string; title: string; message: string;
    data: unknown; read: boolean; readAt: Date | null; createdAt: Date;
  }>>`
    SELECT id, type, title, message, data, read, "readAt", "createdAt"
    FROM "Notification"
    WHERE "userId" = ${session.user.id}
    ORDER BY "createdAt" DESC
    LIMIT 100
  `;

  return NextResponse.json({ notifications });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { notificationId, markAll } = await req.json();

  if (markAll) {
    await prisma.$executeRaw`
      UPDATE "Notification" SET read = true, "readAt" = now()
      WHERE "userId" = ${session.user.id} AND read = false
    `;
  } else if (notificationId) {
    await prisma.$executeRaw`
      UPDATE "Notification" SET read = true, "readAt" = now()
      WHERE id = ${notificationId} AND "userId" = ${session.user.id}
    `;
  }

  return NextResponse.json({ success: true });
}
