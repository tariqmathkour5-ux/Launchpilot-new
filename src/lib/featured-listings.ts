import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

// =====================================================
// FEATURED / SPONSORED LISTING MANAGEMENT
// =====================================================

export interface FeaturedListingData {
  id: string;
  toolId: string;
  toolName: string;
  toolSlug: string;
  type: 'featured' | 'sponsored' | 'promoted';
  label: string | null;
  startDate: Date;
  endDate: Date;
  amount: number; // In cents
  status: 'active' | 'expired' | 'cancelled';
  sortOrder: number;
  position?: number;
}

export interface CreateFeaturedListingInput {
  toolId: string;
  type: 'featured' | 'sponsored' | 'promoted';
  label?: string;
  startDate: Date;
  endDate: Date;
  amount: number; // In cents
  sortOrder?: number;
}

interface PrismaFeaturedListing {
  id: string;
  toolId: string;
  type: string; // Prisma returns string for enum-like fields
  label: string | null;
  startDate: Date;
  endDate: Date;
  amount: number;
  status: string; // Prisma returns string for enum-like fields
  sortOrder: number;
  metadata?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a featured/sponsored listing for a tool
 */
export async function createFeaturedListing(input: CreateFeaturedListingInput): Promise<{ success: boolean; listing?: any; error?: string }> {
  try {
    // Validate tool exists
    const tool = await prisma.tool.findUnique({
      where: { id: input.toolId },
      select: { id: true, name: true, slug: true },
    });

    if (!tool) {
      return { success: false, error: 'Tool not found' };
    }

    // Validate dates
    if (input.startDate >= input.endDate) {
      return { success: false, error: 'End date must be after start date' };
    }

    if (input.startDate < new Date()) {
      return { success: false, error: 'Start date cannot be in the past' };
    }

    // Check for overlapping active listings for same tool
    const overlapping = await prisma.featuredListing.findFirst({
      where: {
        toolId: input.toolId,
        status: 'active',
        startDate: { lte: input.endDate },
        endDate: { gte: input.startDate },
      },
    });

    if (overlapping) {
      return { success: false, error: 'Tool already has an active listing in this period' };
    }

    // Get max sort order to place at end
    const maxSortOrder = await prisma.featuredListing.aggregate({
      where: { status: 'active' },
      _max: { sortOrder: true },
    });

    // Create the listing
    const listing = await prisma.featuredListing.create({
      data: {
        toolId: input.toolId,
        type: input.type,
        label: input.label || null,
        startDate: input.startDate,
        endDate: input.endDate,
        amount: input.amount,
        sortOrder: input.sortOrder ?? (maxSortOrder._max.sortOrder ?? 0) + 1,
        status: 'active',
      },
    });

    // Record revenue transaction for the listing
    if (input.amount > 0) {
      await prisma.revenueTransaction.create({
        data: {
          type: 'FEATURED_LISTING',
          amount: input.amount,
          currency: 'USD',
          status: 'COMPLETED',
          toolId: input.toolId,
          description: `Featured listing for ${tool.name} (${input.type})`,
          transactionDate: new Date(),
          confirmedAt: new Date(),
        },
      });

      // Record billing transaction
      await prisma.billingTransaction.create({
        data: {
          userId: 'system',
          type: 'credit',
          amount: input.amount,
          currency: 'USD',
          status: 'completed',
          description: `Featured listing payment for ${tool.name}`,
          referenceId: listing.id,
          referenceType: 'featured_listing',
          processedAt: new Date(),
        },
      });
    }

    return { success: true, listing: formatListing(listing, tool) };
  } catch (error) {
    console.error('Error creating featured listing:', error);
    return { success: false, error: 'Failed to create listing' };
  }
}

/**
 * Get active featured/sponsored listings
 */
export async function getActiveListings(type?: string): Promise<FeaturedListingData[]> {
  try {
    const where: any = {
      status: 'active',
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    };

    if (type) {
      where.type = type;
    }

    const listings = await prisma.featuredListing.findMany({
      where,
      include: {
        tool: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [
        { sortOrder: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return listings.map(l => formatListing(l, l.tool));
  } catch (error) {
    console.error('Error fetching active listings:', error);
    return [];
  }
}

/**
 * Get all listings for admin
 */
export async function getAllListings(includeExpired: boolean = false): Promise<any[]> {
  try {
    const where: any = {};
    if (!includeExpired) {
      where.status = { not: 'expired' };
    }

    const listings = await prisma.featuredListing.findMany({
      where,
      include: {
        tool: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return listings.map(l => ({
      ...formatListing(l, l.tool),
      metadata: l.metadata ? JSON.parse(l.metadata) : null,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));
  } catch (error) {
    console.error('Error fetching all listings:', error);
    return [];
  }
}

/**
 * Update a featured listing's status or sort order
 */
export async function updateListingStatus(
  id: string,
  updates: { status?: string; sortOrder?: number }
): Promise<{ success: boolean; error?: string }> {
  try {
    const listing = await prisma.featuredListing.findUnique({ where: { id } });
    if (!listing) {
      return { success: false, error: 'Listing not found' };
    }

    await prisma.featuredListing.update({
      where: { id },
      data: updates,
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating listing:', error);
    return { success: false, error: 'Failed to update listing' };
  }
}

/**
 * Auto-expire listings that have passed their end date
 */
export async function expireListings(): Promise<number> {
  try {
    const result = await prisma.featuredListing.updateMany({
      where: {
        status: 'active',
        endDate: { lt: new Date() },
      },
      data: { status: 'expired' },
    });

    return result.count;
  } catch (error) {
    console.error('Error expiring listings:', error);
    return 0;
  }
}

/**
 * Get featured tools for homepage display
 */
export async function getFeaturedTools(limit: number = 6): Promise<Array<{ tool: any; listing: FeaturedListingData }>> {
  try {
    const listings = await prisma.featuredListing.findMany({
      where: {
        status: 'active',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
        type: { in: ['featured', 'sponsored', 'promoted'] },
      },
      include: {
        tool: {
          include: {
            category: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: [
        { sortOrder: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return listings.map(l => ({
      tool: l.tool,
      listing: formatListing(l, l.tool),
    }));
  } catch (error) {
    console.error('Error fetching featured tools:', error);
    return [];
  }
}

/**
 * Get analytics on featured listings performance
 */
export async function getFeaturedListingAnalytics(days: number = 30): Promise<{
  totalActive: number;
  totalRevenue: number;
  revenueByType: Record<string, number>;
  upcomingExpirations: number;
  totalListingsCreated: number;
}> {
  try {
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [activeListings, revenue, createdInPeriod, expiringSoon] = await Promise.all([
      prisma.featuredListing.count({
        where: {
          status: 'active',
          startDate: { lte: now },
          endDate: { gte: now },
        },
      }),
      prisma.revenueTransaction.aggregate({
        where: {
          type: 'FEATURED_LISTING',
          status: 'COMPLETED',
          transactionDate: { gte: startDate },
        },
        _sum: { amount: true },
      }),
      prisma.featuredListing.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.featuredListing.count({
        where: {
          status: 'active',
          endDate: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Revenue by type
    const revenueByTypeRaw = await prisma.featuredListing.groupBy({
      by: ['type'],
      where: {
        status: 'active',
      },
      _sum: { amount: true },
    });

    const revenueByType: Record<string, number> = {};
    for (const r of revenueByTypeRaw) {
      revenueByType[r.type] = r._sum.amount || 0;
    }

    return {
      totalActive: activeListings,
      totalRevenue: revenue._sum.amount || 0,
      revenueByType,
      upcomingExpirations: expiringSoon,
      totalListingsCreated: createdInPeriod,
    };
  } catch (error) {
    console.error('Error getting featured listing analytics:', error);
    return {
      totalActive: 0,
      totalRevenue: 0,
      revenueByType: {},
      upcomingExpirations: 0,
      totalListingsCreated: 0,
    };
  }
}

// =====================================================
// HELPERS
// =====================================================

function formatListing(listing: PrismaFeaturedListing, tool: { name: string; slug: string }): FeaturedListingData {
  return {
    id: listing.id,
    toolId: listing.toolId,
    toolName: tool.name,
    toolSlug: tool.slug,
    type: listing.type as 'featured' | 'sponsored' | 'promoted',
    label: listing.label,
    startDate: listing.startDate,
    endDate: listing.endDate,
    amount: listing.amount,
    status: listing.status as 'active' | 'expired' | 'cancelled',
    sortOrder: listing.sortOrder,
  };
}
