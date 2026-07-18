import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCompanySession, hasPermission, sendCompanyNotification } from '@/lib/company/auth';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const verifications = await prisma.$queryRaw<Array<{
    id: string; status: string; submitted_at: Date; reviewed_at: Date | null;
    rejection_reason: string | null; documents: unknown[]; notes: string | null;
    reviewer_name: string | null;
  }>>`
    SELECT cv.id, cv.status, cv.submitted_at, cv.reviewed_at, cv.rejection_reason,
           cv.documents, cv.notes, u.name as reviewer_name
    FROM company_verification cv
    LEFT JOIN "User" u ON u.id = cv.reviewer_id
    WHERE cv.company_id = ${cs.companyId}
    ORDER BY cv.created_at DESC
  `;

  return NextResponse.json({ verifications });
}

export async function POST(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(cs.role, 'verification')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { documents, notes } = await req.json();

  // Check if there's already a pending/under_review request
  const existing = await prisma.$queryRaw<Array<{ status: string }>>`
    SELECT status FROM company_verification
    WHERE company_id = ${cs.companyId} AND status IN ('pending', 'under_review')
  `;

  if (existing[0]) {
    return NextResponse.json({ error: 'Verification request already in progress' }, { status: 400 });
  }

  await prisma.$executeRaw`
    INSERT INTO company_verification (company_id, status, documents, notes)
    VALUES (${cs.companyId}, 'pending', ${JSON.stringify(documents || [])}::jsonb, ${notes || null})
  `;

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  // Admin only — review verification request
  const cs = await getCompanySession();
  if (!cs?.isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { verificationId, status, rejectionReason, companyId } = await req.json();

  await prisma.$executeRaw`
    UPDATE company_verification SET
      status = ${status},
      reviewed_at = now(),
      reviewer_id = ${cs.userId},
      rejection_reason = ${rejectionReason || null},
      updated_at = now()
    WHERE id = ${verificationId}::uuid
  `;

  // Update company verified field
  if (status === 'verified') {
    await prisma.$executeRaw`UPDATE "Company" SET verified = true WHERE id = ${companyId}`;
  } else if (status === 'rejected') {
    await prisma.$executeRaw`UPDATE "Company" SET verified = false WHERE id = ${companyId}`;
  }

  // Notify company owner
  const owner = await prisma.$queryRaw<Array<{ user_id: string }>>`
    SELECT user_id FROM company_members WHERE company_id = ${companyId} AND role = 'owner' AND status = 'active' LIMIT 1
  `;

  if (owner[0]) {
    await sendCompanyNotification(
      owner[0].user_id,
      'COMPANY',
      `Verification ${status === 'verified' ? 'Approved' : 'Update'}`,
      status === 'verified'
        ? 'Your company has been verified! A verification badge will now appear on your profile.'
        : status === 'rejected'
        ? `Your verification request was rejected. Reason: ${rejectionReason || 'No reason provided'}`
        : `Your verification status has been updated to: ${status}`
    );
  }

  return NextResponse.json({ success: true });
}
