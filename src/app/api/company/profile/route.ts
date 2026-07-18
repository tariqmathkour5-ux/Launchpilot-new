import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCompanySession, hasPermission } from '@/lib/company/auth';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [company] = await prisma.$queryRaw<Array<{
    id: string; name: string; slug: string; logo: string | null; website: string | null;
    description: string | null; industry: string | null; size: string | null;
    founded: number | null; headquarters: string | null; email: string | null;
    phone: string | null; status: string; verified: boolean; "ownerId": string | null;
    "createdAt": Date; "updatedAt": Date;
  }>>`SELECT id, name, slug, logo, website, description, industry, size, founded, headquarters,
    email, phone, status, verified, "ownerId", "createdAt", "updatedAt"
    FROM "Company" WHERE id = ${cs.companyId}`;

  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  // Get social links from media table (stored as document type with alt_text as platform)
  const socialLinks = await prisma.$queryRaw<Array<{ alt_text: string; url: string }>>`
    SELECT alt_text, url FROM company_media
    WHERE company_id = ${cs.companyId} AND type = 'document' AND filename LIKE 'social_%'
  `;

  return NextResponse.json({ company, socialLinks });
}

export async function PATCH(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(cs.role, 'write')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { name, description, website, industry, size, founded, headquarters, email, phone, logo, coverImage } = body;

  await prisma.$executeRaw`
    UPDATE "Company" SET
      name = COALESCE(${name}, name),
      description = COALESCE(${description}, description),
      website = COALESCE(${website}, website),
      industry = COALESCE(${industry}, industry),
      size = COALESCE(${size}::"CompanySize", size),
      founded = COALESCE(${founded}::integer, founded),
      headquarters = COALESCE(${headquarters}, headquarters),
      email = COALESCE(${email}, email),
      phone = COALESCE(${phone}, phone),
      logo = COALESCE(${logo}, logo),
      "updatedAt" = now()
    WHERE id = ${cs.companyId}
  `;

  // Store cover image as a media entry
  if (coverImage) {
    await prisma.$executeRaw`
      INSERT INTO company_media (company_id, type, filename, original_name, url, uploaded_by)
      VALUES (${cs.companyId}, 'cover', 'cover_image', 'Cover Image', ${coverImage}, ${cs.userId})
      ON CONFLICT DO NOTHING
    `;
  }

  return NextResponse.json({ success: true });
}
