import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAdvertisement, updateAdStatus, getAdAnalytics } from '@/lib/ads';

// GET /api/admin/ads - List all advertisements
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const view = searchParams.get('view') || 'all';
    const days = parseInt(searchParams.get('days') || '30');

    if (view === 'analytics') {
      const analytics = await getAdAnalytics(days);
      return NextResponse.json(analytics);
    }

    const where: any = {};
    if (view === 'active') where.status = 'ACTIVE';
    if (view === 'drafts') where.status = 'DRAFT';
    if (view === 'paused') where.status = 'PAUSED';
    if (view === 'expired') where.status = 'EXPIRED';

    const ads = await prisma.advertisement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const formatted = ads.map(ad => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl,
      position: ad.position,
      type: ad.type,
      startDate: ad.startDate.toISOString(),
      endDate: ad.endDate.toISOString(),
      clicks: ad.clicks,
      impressions: ad.impressions,
      budget: ad.budget,
      spent: ad.spent,
      dailyBudget: ad.dailyBudget,
      targetUrl: ad.targetUrl,
      targetAudience: ad.targetAudience,
      status: ad.status,
      ctr: ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00',
      remainingBudget: ad.budget ? ad.budget - ad.spent : null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching ads:', error);
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 });
  }
}

// POST /api/admin/ads - Create or update advertisement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'create') {
      const result = await createAdvertisement({
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        position: data.position,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        budget: data.budget ? parseInt(data.budget) : undefined,
        dailyBudget: data.dailyBudget ? parseInt(data.dailyBudget) : undefined,
        targetUrl: data.targetUrl,
        targetAudience: data.targetAudience,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json(result.ad, { status: 201 });
    }

    if (action === 'update_status') {
      const result = await updateAdStatus(data.id, data.status);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'update') {
      const updateData: any = {};
      if (data.title) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.linkUrl) updateData.linkUrl = data.linkUrl;
      if (data.position) updateData.position = data.position;
      if (data.type) updateData.type = data.type;
      if (data.startDate) updateData.startDate = new Date(data.startDate);
      if (data.endDate) updateData.endDate = new Date(data.endDate);
      if (data.budget !== undefined) updateData.budget = parseInt(data.budget);
      if (data.dailyBudget !== undefined) updateData.dailyBudget = parseInt(data.dailyBudget);
      if (data.targetUrl !== undefined) updateData.targetUrl = data.targetUrl;
      if (data.targetAudience !== undefined) updateData.targetAudience = data.targetAudience;

      const ad = await prisma.advertisement.update({
        where: { id: data.id },
        data: updateData,
      });

      return NextResponse.json(ad);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing ad request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}