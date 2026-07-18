import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAffiliatePartner, getGlobalAffiliateAnalytics, getAffiliateStats, generatePartnerToken } from '@/lib/affiliate';

// GET /api/admin/affiliates - List all affiliate partners
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const view = searchParams.get('view') || 'partners';
    const days = parseInt(searchParams.get('days') || '30');

    if (view === 'analytics') {
      const analytics = await getGlobalAffiliateAnalytics(days);
      return NextResponse.json(analytics);
    }

    const partners = await prisma.affiliatePartner.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            affiliateClicks: true,
            revenueTransactions: true,
            affiliateLinks: true,
          },
        },
      },
    });

    const formatted = partners.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      code: p.code,
      apiToken: p.apiToken,
      commission: p.commission,
      commissionType: p.commissionType,
      fixedCommission: p.fixedCommission,
      status: p.status,
      clicks: p.clicks,
      conversions: p.conversions,
      earnings: p.earnings,
      linksCount: p._count.affiliateLinks,
      lastLoginAt: p.lastLoginAt,
      createdAt: p.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching affiliates:', error);
    return NextResponse.json({ error: 'Failed to fetch affiliates' }, { status: 500 });
  }
}

// POST /api/admin/affiliates - Create new affiliate partner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, commission, commissionType, fixedCommission } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const result = await createAffiliatePartner({
      name,
      email,
      commission: commission ? parseFloat(commission) : undefined,
      commissionType: commissionType || 'percentage',
      fixedCommission: fixedCommission ? parseInt(fixedCommission) : undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.partner, { status: 201 });
  } catch (error) {
    console.error('Error creating affiliate:', error);
    return NextResponse.json({ error: 'Failed to create affiliate' }, { status: 500 });
  }
}

// PUT /api/admin/affiliates - Update affiliate partner
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.commission !== undefined) updateData.commission = parseFloat(updates.commission);
    if (updates.commissionType) updateData.commissionType = updates.commissionType;
    if (updates.fixedCommission !== undefined) updateData.fixedCommission = parseInt(updates.fixedCommission);
    if (updates.status) updateData.status = updates.status;

    // Regenerate API token if requested
    if (updates.regenerateToken) {
      updateData.apiToken = generatePartnerToken();
    }

    const partner = await prisma.affiliatePartner.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(partner);
  } catch (error) {
    console.error('Error updating affiliate:', error);
    return NextResponse.json({ error: 'Failed to update affiliate' }, { status: 500 });
  }
}