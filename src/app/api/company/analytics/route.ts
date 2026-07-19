import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCompanySession, hasPermission, sendCompanyNotification } from '@/lib/company/auth';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId') || undefined;
  const cs = await getCompanySession(companyId);
  if (!cs) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(cs.role, 'analytics')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Get tools for this company from database
  const tools = await prisma.$queryRaw<Array<{
    id: string; name: string; slug: string; published: boolean; featured: boolean;
    rating: number | null; pricing: string; "createdAt": Date;
  }>>`SELECT id, name, slug, published, featured, rating, pricing, "createdAt"
      FROM "Tool" WHERE "companyId" = ${cs.companyId} ORDER BY "createdAt" DESC`;

  const toolIds = tools.map(t => t.id);

  // Stats
  const reviewStats = toolIds.length > 0
    ? await prisma.$queryRaw<Array<{ tool_id: string; count: bigint; avg_rating: number }>>`
        SELECT "toolId" as tool_id, COUNT(*) as count, AVG(rating)::float as avg_rating
        FROM "UserReview"
        WHERE "toolId" = ANY(${toolIds}::text[])
        GROUP BY "toolId"
      `
    : [];

  const campaignStats = await prisma.$queryRaw<Array<{ count: bigint; active: bigint }>>`
    SELECT COUNT(*) as count,
           SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active
    FROM "Advertisement"
    WHERE description LIKE ${'%company:' + cs.companyId + '%'}
  `;

  const memberCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM company_members WHERE company_id = ${cs.companyId} AND status = 'active'
  `;

  const leadStats = await prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
    SELECT status, COUNT(*) as count FROM company_leads WHERE company_id = ${cs.companyId} GROUP BY status
  `;

  const verification = await prisma.$queryRaw<Array<{ status: string }>>`
    SELECT status FROM company_verification WHERE company_id = ${cs.companyId} ORDER BY created_at DESC LIMIT 1
  `;

  return NextResponse.json({
    tools,
    stats: {
      totalTools: tools.length,
      publishedTools: tools.filter(t => t.published).length,
      pendingTools: tools.filter(t => !t.published).length,
      featuredTools: tools.filter(t => t.featured).length,
      totalReviews: reviewStats.reduce((s, r) => s + Number(r.count), 0),
      avgRating: reviewStats.length > 0
        ? reviewStats.reduce((s, r) => s + r.avg_rating, 0) / reviewStats.length
        : null,
      activeCampaigns: Number(campaignStats[0]?.active ?? 0),
      totalCampaigns: Number(campaignStats[0]?.count ?? 0),
      teamMembers: Number(memberCount[0]?.count ?? 0),
      totalLeads: leadStats.reduce((s, r) => s + Number(r.count), 0),
      convertedLeads: Number(leadStats.find(l => l.status === 'converted')?.count ?? 0),
      verificationStatus: verification[0]?.status || 'not_submitted',
    },
    reviewStats: reviewStats.map(r => ({ ...r, count: Number(r.count) })),
    leadStats: leadStats.map(l => ({ ...l, count: Number(l.count) })),
  });
}