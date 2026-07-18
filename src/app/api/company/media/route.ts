import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCompanySession, hasPermission } from '@/lib/company/auth';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const type = req.nextUrl.searchParams.get('type');

  const media = await prisma.$queryRaw<Array<{
    id: string; type: string; filename: string; original_name: string;
    url: string; mime_type: string | null; size_bytes: number | null;
    alt_text: string | null; sort_order: number; created_at: Date;
  }>>`
    SELECT id, type, filename, original_name, url, mime_type, size_bytes, alt_text, sort_order, created_at
    FROM company_media
    WHERE company_id = ${cs.companyId}
    ${type ? prisma.$queryRaw`AND type = ${type}` : prisma.$queryRaw``}
    ORDER BY sort_order ASC, created_at DESC
  `;

  return NextResponse.json({ media });
}

export async function POST(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(cs.role, 'media')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { type, url, originalName, altText, mimeType, sizeBytes } = await req.json();
  if (!url || !originalName) return NextResponse.json({ error: 'url and originalName required' }, { status: 400 });

  const filename = `${type}_${Date.now()}`;

  await prisma.$executeRaw`
    INSERT INTO company_media (company_id, type, filename, original_name, url, mime_type, size_bytes, alt_text, uploaded_by)
    VALUES (${cs.companyId}, ${type || 'screenshot'}, ${filename}, ${originalName},
            ${url}, ${mimeType || null}, ${sizeBytes || null}, ${altText || null}, ${cs.userId})
  `;

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(cs.role, 'media')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const mediaId = req.nextUrl.searchParams.get('mediaId');
  if (!mediaId) return NextResponse.json({ error: 'mediaId required' }, { status: 400 });

  await prisma.$executeRaw`DELETE FROM company_media WHERE id = ${mediaId}::uuid AND company_id = ${cs.companyId}`;

  return NextResponse.json({ success: true });
}
