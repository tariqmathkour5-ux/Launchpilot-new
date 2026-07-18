import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCompanySession, hasPermission } from '@/lib/company/auth';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(cs.role, 'leads')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const status = req.nextUrl.searchParams.get('status');

  const leads = await prisma.$queryRaw<Array<{
    id: string; name: string; email: string | null; phone: string | null;
    company_name: string | null; source: string; status: string;
    notes: string | null; tool_id: string | null; created_at: Date; updated_at: Date;
  }>>`
    SELECT id, name, email, phone, company_name, source, status, notes, tool_id, created_at, updated_at
    FROM company_leads
    WHERE company_id = ${cs.companyId}
    ${status ? prisma.$queryRaw`AND status = ${status}` : prisma.$queryRaw``}
    ORDER BY created_at DESC
  `;

  const counts = await prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
    SELECT status, COUNT(*) as count FROM company_leads
    WHERE company_id = ${cs.companyId} GROUP BY status
  `;

  return NextResponse.json({ leads, counts: counts.map(c => ({ ...c, count: Number(c.count) })) });
}

export async function POST(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(cs.role, 'leads')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { name, email, phone, company_name, source, notes, tool_id } = await req.json();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  await prisma.$executeRaw`
    INSERT INTO company_leads (company_id, name, email, phone, company_name, source, notes, tool_id)
    VALUES (${cs.companyId}, ${name}, ${email || null}, ${phone || null},
            ${company_name || null}, ${source || 'direct'}, ${notes || null}, ${tool_id || null})
  `;

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(cs.role, 'leads')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { leadId, status, notes } = await req.json();
  if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 });

  await prisma.$executeRaw`
    UPDATE company_leads SET
      status = COALESCE(${status}, status),
      notes = COALESCE(${notes}, notes),
      updated_at = now()
    WHERE id = ${leadId}::uuid AND company_id = ${cs.companyId}
  `;

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(cs.role, 'delete')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const leadId = req.nextUrl.searchParams.get('leadId');
  if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 });

  await prisma.$executeRaw`DELETE FROM company_leads WHERE id = ${leadId}::uuid AND company_id = ${cs.companyId}`;

  return NextResponse.json({ success: true });
}
