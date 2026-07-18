import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCompanySession, hasPermission, sendCompanyNotification, ROLE_LABELS } from '@/lib/company/auth';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const members = await prisma.$queryRaw<Array<{
    id: string; user_id: string; role: string; status: string;
    invited_at: Date; accepted_at: Date | null;
    name: string | null; email: string | null; image: string | null;
  }>>`
    SELECT cm.id, cm.user_id, cm.role, cm.status, cm.invited_at, cm.accepted_at,
           u.name, u.email, u.image
    FROM company_members cm
    LEFT JOIN "User" u ON u.id = cm.user_id
    WHERE cm.company_id = ${cs.companyId}
    ORDER BY cm.invited_at DESC
  `;

  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(cs.role, 'team')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { email, role } = await req.json();
  if (!email || !role) return NextResponse.json({ error: 'email and role are required' }, { status: 400 });

  const users = await prisma.$queryRaw<Array<{ id: string; name: string | null }>>`
    SELECT id, name FROM "User" WHERE email = ${email}
  `;
  if (!users[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const userId = users[0].id;

  await prisma.$executeRaw`
    INSERT INTO company_members (company_id, user_id, role, invited_by, status)
    VALUES (${cs.companyId}, ${userId}, ${role}, ${cs.userId}, 'pending')
    ON CONFLICT (company_id, user_id) DO UPDATE SET role = ${role}, status = 'pending', invited_at = now()
  `;

  await sendCompanyNotification(
    userId,
    'COMPANY',
    'Team Invitation',
    `You have been invited to join a company as ${ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}.`
  );

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { memberId, action, role } = await req.json();

  if (action === 'accept') {
    await prisma.$executeRaw`
      UPDATE company_members SET status = 'active', accepted_at = now()
      WHERE id = ${memberId}::uuid AND user_id = ${cs.userId}
    `;
  } else if (action === 'revoke' && hasPermission(cs.role, 'team')) {
    await prisma.$executeRaw`
      UPDATE company_members SET status = 'revoked' WHERE id = ${memberId}::uuid AND company_id = ${cs.companyId}
    `;
  } else if (action === 'change_role' && hasPermission(cs.role, 'team')) {
    await prisma.$executeRaw`
      UPDATE company_members SET role = ${role} WHERE id = ${memberId}::uuid AND company_id = ${cs.companyId}
    `;
  } else {
    return NextResponse.json({ error: 'Invalid action or insufficient permissions' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
