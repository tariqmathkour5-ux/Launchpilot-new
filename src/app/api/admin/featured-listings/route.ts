import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createFeaturedListing, getAllListings, updateListingStatus, getFeaturedListingAnalytics } from '@/lib/featured-listings';

// GET /api/admin/featured-listings
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const view = searchParams.get('view') || 'all';
    const days = parseInt(searchParams.get('days') || '30');

    if (view === 'analytics') {
      const analytics = await getFeaturedListingAnalytics(days);
      return NextResponse.json(analytics);
    }

    const listings = await getAllListings(view === 'all');
    return NextResponse.json(listings);
  } catch (error) {
    console.error('Error fetching featured listings:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

// POST /api/admin/featured-listings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'create') {
      const result = await createFeaturedListing({
        toolId: data.toolId,
        type: data.type,
        label: data.label,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        amount: data.amount ? parseInt(data.amount) : 0,
        sortOrder: data.sortOrder ? parseInt(data.sortOrder) : undefined,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json(result.listing, { status: 201 });
    }

    if (action === 'update_status') {
      const result = await updateListingStatus(data.id, { status: data.status });
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'update_sort') {
      const result = await updateListingStatus(data.id, { sortOrder: parseInt(data.sortOrder) });
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'expire_all') {
      const { expireListings } = await import('@/lib/featured-listings');
      const count = await expireListings();
      return NextResponse.json({ expired: count });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing featured listing request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}