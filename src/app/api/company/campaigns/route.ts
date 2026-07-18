import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCompanySession, hasPermission, sendCompanyNotification } from '@/lib/company/auth';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(cs.role, 'campaigns')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Fetch ads linked to this company via description tag
  const campaigns = await prisma.$queryRaw<Array<{
    id: string; title: string; description: string | null; type: string;
    position: string; status: string; clicks: number; impressions: number;
    budget: number | null; spent: number; "startDate": Date; "endDate": Date; "createdAt": Date;
  }>>`
    SELECT id, title, description, type, position, status, clicks, impressions,
           budget, spent, "startDate", "endDate", "createdAt"
    FROM "Advertisement"
    WHERE description LIKE ${'%company:' + cs.companyId + '%'}
    ORDER BY "createdAt" DESC
  `;

  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(cs.role, 'campaigns')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { title, type, position, linkUrl, imageUrl, budget, startDate, endDate, toolId } = await req.json();
  if (!title || !type || !position || !linkUrl || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const description = `[company:${cs.companyId}]${toolId ? `[tool:${toolId}]` : ''} ${title}`;

  await prisma.$executeRaw`
    INSERT INTO "Advertisement" (id, title, description, type, position, "linkUrl", "imageUrl", budget,
                                 status, "startDate", "endDate", clicks, impressions, spent, "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid()::text,
      ${title},
      ${description},
      ${type}::"AdType",
      ${position}::"AdPosition",
      ${linkUrl},
      ${imageUrl || null},
      ${budget ? parseFloat(budget) : null},
      'DRAFT'::"AdStatus",
      ${new Date(startDate)},
      ${new Date(endDate)},
      0, 0, 0, now(), now()
    )
  `;

  await sendCompanyNotification(
    cs.userId,
    'COMPANY',
    'Campaign Created',
    `Your campaign "${title}" has been created and is pending review.`
  );

  return NextResponse.json({ success: true });
}
