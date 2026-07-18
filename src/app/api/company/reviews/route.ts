import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCompanySession, hasPermission, sendCompanyNotification } from '@/lib/company/auth';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(cs.role, 'reviews')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Get user reviews for all tools owned by this company
  const reviews = await prisma.$queryRaw<Array<{
    id: string; tool_id: string; tool_name: string; tool_slug: string;
    rating: number; title: string | null; content: string;
    user_name: string | null; helpful: number; verified: boolean;
    created_at: Date;
    reply_text: string | null; reply_id: string | null;
    report_status: string | null;
  }>>`
    SELECT ur.id, ur."toolId" as tool_id, t.name as tool_name, t.slug as tool_slug,
           ur.rating, ur.title, ur.content, u.name as user_name,
           ur.helpful, ur.verified, ur."createdAt" as created_at,
           crr.reply_text, crr.id as reply_id,
           crep.status as report_status
    FROM "UserReview" ur
    JOIN "Tool" t ON t.id = ur."toolId"
    JOIN "User" u ON u.id = ur."userId"
    LEFT JOIN company_review_replies crr ON crr.review_id = ur.id AND crr.company_id = ${cs.companyId}
    LEFT JOIN company_review_reports crep ON crep.review_id = ur.id AND crep.company_id = ${cs.companyId}
    WHERE t."companyId" = ${cs.companyId}
    ORDER BY ur."createdAt" DESC
    LIMIT 100
  `;

  return NextResponse.json({ reviews });
}

export async function POST(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(cs.role, 'reviews')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { action, reviewId, replyText, reason, details } = await req.json();

  if (action === 'reply') {
    if (!replyText) return NextResponse.json({ error: 'replyText required' }, { status: 400 });
    await prisma.$executeRaw`
      INSERT INTO company_review_replies (company_id, review_id, reply_text, author_id)
      VALUES (${cs.companyId}, ${reviewId}, ${replyText}, ${cs.userId})
      ON CONFLICT (company_id, review_id) DO UPDATE SET reply_text = ${replyText}, updated_at = now()
    `;
  } else if (action === 'report') {
    if (!reason) return NextResponse.json({ error: 'reason required' }, { status: 400 });
    await prisma.$executeRaw`
      INSERT INTO company_review_reports (company_id, review_id, reason, details, reported_by)
      VALUES (${cs.companyId}, ${reviewId}, ${reason}, ${details || null}, ${cs.userId})
      ON CONFLICT DO NOTHING
    `;
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
