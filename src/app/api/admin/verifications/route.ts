import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendCompanyNotification } from '@/lib/company/auth';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.$queryRaw<Array<{ role: string }>>`
    SELECT "legacyRole" as role FROM "User" WHERE id = ${session.user.id}
  `;
  if (user[0]?.role !== 'ADMIN') return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const status = req.nextUrl.searchParams.get('status') || '';
  const verifications = status
    ? await prisma.$queryRaw<Array<{
        id: string; company_id: string; company_name: string; status: string;
        submitted_at: Date; reviewed_at: Date | null; rejection_reason: string | null;
        documents: unknown; notes: string | null; reviewer_name: string | null;
      }>>`
        SELECT cv.id, cv.company_id, c.name as company_name, cv.status,
               cv.submitted_at, cv.reviewed_at, cv.rejection_reason,
               cv.documents, cv.notes, u.name as reviewer_name
        FROM company_verification cv
        JOIN "Company" c ON c.id = cv.company_id
        LEFT JOIN "User" u ON u.id = cv.reviewer_id
        WHERE cv.status = ${status}
        ORDER BY cv.submitted_at DESC
      `
    : await prisma.$queryRaw<Array<{
        id: string; company_id: string; company_name: string; status: string;
        submitted_at: Date; reviewed_at: Date | null; rejection_reason: string | null;
        documents: unknown; notes: string | null; reviewer_name: string | null;
      }>>`
        SELECT cv.id, cv.company_id, c.name as company_name, cv.status,
               cv.submitted_at, cv.reviewed_at, cv.rejection_reason,
               cv.documents, cv.notes, u.name as reviewer_name
        FROM company_verification cv
        JOIN "Company" c ON c.id = cv.company_id
        LEFT JOIN "User" u ON u.id = cv.reviewer_id
        ORDER BY cv.submitted_at DESC
      `;

  return NextResponse.json({ verifications });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { verificationId, companyId, status, rejectionReason } = await req.json();

  await prisma.$executeRaw`
    UPDATE company_verification SET
      status = ${status},
      reviewed_at = now(),
      reviewer_id = ${session.user.id},
      rejection_reason = ${rejectionReason || null},
      updated_at = now()
    WHERE id = ${verificationId}::uuid
  `;

  if (status === 'verified') {
    await prisma.$executeRaw`UPDATE "Company" SET verified = true WHERE id = ${companyId}`;
  } else if (status === 'rejected') {
    await prisma.$executeRaw`UPDATE "Company" SET verified = false WHERE id = ${companyId}`;
  }

  const owner = await prisma.$queryRaw<Array<{ user_id: string }>>`
    SELECT user_id FROM company_members
    WHERE company_id = ${companyId} AND role = 'owner' AND status = 'active'
    LIMIT 1
  `;

  if (owner[0]) {
    await sendCompanyNotification(
      owner[0].user_id,
      'COMPANY',
      status === 'verified' ? 'Verification Approved' : status === 'rejected' ? 'Verification Rejected' : 'Verification Update',
      status === 'verified'
        ? 'Your company has been verified! A badge now appears on your public profile.'
        : status === 'rejected'
        ? `Your verification was rejected. Reason: ${rejectionReason || 'No reason provided'}`
        : `Your verification status was updated to: ${status}`
    );
  }

  return NextResponse.json({ success: true });
}
