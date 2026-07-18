import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

// =====================================================
// ADVERTISEMENT MANAGEMENT SYSTEM
// All financial values stored in cents (integer) for precision
// =====================================================

export interface AdData {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string;
  position: string;
  type: string;
  startDate: Date;
  endDate: Date;
  clicks: number;
  impressions: number;
  budget: number | null; // In cents
  spent: number; // In cents
  dailyBudget: number | null; // In cents
  targetUrl: string | null;
  targetAudience: string | null;
  status: string;
  ctr: number; // Click-through rate
  remainingBudget: number | null;
}

export interface CreateAdInput {
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl: string;
  position: string;
  type: string;
  startDate: Date;
  endDate: Date;
  budget?: number; // In cents
  dailyBudget?: number; // In cents
  targetUrl?: string;
  targetAudience?: string;
}

export interface AdCampaignData {
  id: string;
  toolId: string;
  toolName: string;
  toolSlug: string;
  name: string;
  budget: number;
  spent: number;
  dailyBudget: number | null;
  startDate: Date;
  endDate: Date;
  targetClicks: number | null;
  targetImpressions: number | null;
  status: string;
  remainingBudget: number;
}

// =====================================================
// ADVERTISEMENT CRUD
// =====================================================

/**
 * Create a new advertisement
 */
export async function createAdvertisement(input: CreateAdInput): Promise<{ success: boolean; ad?: any; error?: string }> {
  try {
    // Validate dates
    if (input.startDate >= input.endDate) {
      return { success: false, error: 'End date must be after start date' };
    }

    const ad = await prisma.advertisement.create({
      data: {
        title: input.title,
        description: input.description || null,
        imageUrl: input.imageUrl || null,
        linkUrl: input.linkUrl,
        position: input.position,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        budget: input.budget || null,
        dailyBudget: input.dailyBudget || null,
        targetUrl: input.targetUrl || null,
        targetAudience: input.targetAudience || null,
        status: 'DRAFT',
      },
    });

    return { success: true, ad: formatAd(ad) };
  } catch (error) {
    console.error('Error creating advertisement:', error);
    return { success: false, error: 'Failed to create advertisement' };
  }
}

/**
 * Get all advertisements (admin)
 */
export async function getAllAds(includeDrafts: boolean = false): Promise<AdData[]> {
  try {
    const where: any = {};
    if (!includeDrafts) {
      where.status = { not: 'DRAFT' };
    }

    const ads = await prisma.advertisement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return ads.map(formatAd);
  } catch (error) {
    console.error('Error fetching ads:', error);
    return [];
  }
}

/**
 * Get active advertisements for a specific position
 */
export async function getActiveAds(position?: string): Promise<AdData[]> {
  try {
    const now = new Date();
    const where: any = {
      status: 'ACTIVE',
      startDate: { lte: now },
      endDate: { gte: now },
    };

    if (position) {
      where.position = position;
    }

    const ads = await prisma.advertisement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return ads.map(formatAd);
  } catch (error) {
    console.error('Error fetching active ads:', error);
    return [];
  }
}

/**
 * Update advertisement status
 */
export async function updateAdStatus(
  id: string,
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED'
): Promise<{ success: boolean; error?: string }> {
  try {
    const ad = await prisma.advertisement.findUnique({ where: { id } });
    if (!ad) {
      return { success: false, error: 'Advertisement not found' };
    }

    await prisma.advertisement.update({
      where: { id },
      data: { status },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating ad status:', error);
    return { success: false, error: 'Failed to update ad status' };
  }
}

/**
 * Auto-expire ads that have passed their end date or exceeded budget
 */
export async function expireAds(): Promise<number> {
  try {
    const now = new Date();
    
    // Expire by date
    const dateExpired = await prisma.advertisement.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });

    // Expire by budget
    const budgetExpired = await prisma.advertisement.updateMany({
      where: {
        status: 'ACTIVE',
        budget: { not: null },
        spent: { gte: prisma.advertisement.fields.budget },
      },
      data: { status: 'EXPIRED' },
    });

    return dateExpired.count + budgetExpired.count;
  } catch (error) {
    console.error('Error expiring ads:', error);
    return 0;
  }
}

// =====================================================
// IMPRESSION & CLICK TRACKING
// =====================================================

/**
 * Track an ad impression
 */
export async function trackAdImpression(
  advertisementId: string,
  data?: { sessionId?: string; ipAddress?: string; userAgent?: string; country?: string; device?: string }
): Promise<boolean> {
  try {
const ad = await prisma.advertisement.findUnique({
      where: { id: advertisementId },
      select: { id: true, title: true, status: true, dailyBudget: true, spent: true, budget: true },
    });

    if (!ad || ad.status !== 'ACTIVE') return false;

    // Check budget limits
    if (ad.budget && ad.spent >= ad.budget) return false;

    // Calculate impression cost (CPM model - $5 CPM default)
    const impressionCost = 0.5; // $0.005 per impression in cents = 0.5 cents

    // Check daily budget
    if (ad.dailyBudget) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todayImpressions = await prisma.adImpression.count({
        where: {
          advertisementId,
          createdAt: { gte: todayStart },
        },
      });

      if (todayImpressions * impressionCost >= ad.dailyBudget) return false;
    }

    await prisma.adImpression.create({
      data: {
        advertisementId,
        sessionId: data?.sessionId || null,
        ipAddress: data?.ipAddress || null,
        userAgent: data?.userAgent || null,
        country: data?.country || null,
        device: data?.device || null,
        cost: Math.round(impressionCost),
      },
    });

    // Update ad impression count and spent
    await prisma.advertisement.update({
      where: { id: advertisementId },
      data: {
        impressions: { increment: 1 },
        spent: { increment: Math.round(impressionCost) },
      },
    });

    return true;
  } catch (error) {
    console.error('Error tracking ad impression:', error);
    return false;
  }
}

/**
 * Track an ad click
 */
export async function trackAdClick(
  advertisementId: string,
  data?: { sessionId?: string; ipAddress?: string; userAgent?: string; country?: string; device?: string }
): Promise<boolean> {
  try {
    const ad = await prisma.advertisement.findUnique({
      where: { id: advertisementId },
      select: { id: true, title: true, status: true, budget: true, spent: true, dailyBudget: true },
    });

    if (!ad || ad.status !== 'ACTIVE') return false;

    // Check budget limits
    if (ad.budget && ad.spent >= ad.budget) return false;

    // Calculate click cost (CPC model - $0.50 default)
    const clickCost = 50; // 50 cents per click

    // Check daily budget
    if (ad.dailyBudget) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todayClicks = await prisma.adClick.count({
        where: {
          advertisementId,
          createdAt: { gte: todayStart },
        },
      });

      if ((todayClicks + 1) * clickCost > ad.dailyBudget) return false;
    }

    await prisma.adClick.create({
      data: {
        advertisementId,
        sessionId: data?.sessionId || null,
        ipAddress: data?.ipAddress || null,
        userAgent: data?.userAgent || null,
        country: data?.country || null,
        device: data?.device || null,
        cost: clickCost,
      },
    });

    // Update ad click count and spent
    await prisma.advertisement.update({
      where: { id: advertisementId },
      data: {
        clicks: { increment: 1 },
        spent: { increment: clickCost },
      },
    });

    // Record revenue transaction
    await prisma.revenueTransaction.create({
      data: {
        type: 'AD_REVENUE',
        amount: clickCost,
        currency: 'USD',
        status: 'COMPLETED',
        advertisementId,
        description: `Ad click: ${ad.title}`,
        transactionDate: new Date(),
        confirmedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error('Error tracking ad click:', error);
    return false;
  }
}

// =====================================================
// AD CAMPAIGNS (Tool-specific promotions)
// =====================================================

/**
 * Create an ad campaign for a tool
 */
export async function createAdCampaign(data: {
  toolId: string;
  name: string;
  budget: number;
  dailyBudget?: number;
  startDate: Date;
  endDate: Date;
  targetClicks?: number;
  targetImpressions?: number;
}): Promise<{ success: boolean; campaign?: any; error?: string }> {
  try {
    const tool = await prisma.tool.findUnique({
      where: { id: data.toolId },
      select: { id: true, name: true, slug: true },
    });

    if (!tool) {
      return { success: false, error: 'Tool not found' };
    }

    const campaign = await prisma.adCampaign.create({
      data: {
        toolId: data.toolId,
        name: data.name,
        budget: data.budget,
        dailyBudget: data.dailyBudget || null,
        startDate: data.startDate,
        endDate: data.endDate,
        targetClicks: data.targetClicks || null,
        targetImpressions: data.targetImpressions || null,
        status: 'DRAFT',
      },
    });

    return { success: true, campaign };
  } catch (error) {
    console.error('Error creating ad campaign:', error);
    return { success: false, error: 'Failed to create campaign' };
  }
}

/**
 * Get ad campaigns for a tool
 */
export async function getToolCampaigns(toolId: string): Promise<AdCampaignData[]> {
  try {
    const campaigns = await prisma.adCampaign.findMany({
      where: { toolId },
      include: {
        tool: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns.map(formatCampaign);
  } catch (error) {
    console.error('Error fetching tool campaigns:', error);
    return [];
  }
}

/**
 * Get all ad campaigns (admin)
 */
export async function getAllCampaigns(): Promise<AdCampaignData[]> {
  try {
    const campaigns = await prisma.adCampaign.findMany({
      include: {
        tool: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns.map(formatCampaign);
  } catch (error) {
    console.error('Error fetching all campaigns:', error);
    return [];
  }
}

// =====================================================
// ANALYTICS
// =====================================================

export interface AdAnalytics {
  totalAds: number;
  activeAds: number;
  totalImpressions: number;
  totalClicks: number;
  totalSpent: number;
  totalRevenue: number;
  averageCtr: number;
  averageCpc: number;
  adsByPosition: Record<string, number>;
  adsByStatus: Record<string, number>;
  topPerformingAds: AdData[];
}

/**
 * Get advertisement analytics
 */
export async function getAdAnalytics(days: number = 30): Promise<AdAnalytics> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [allAds, impressions, clicks, revenue] = await Promise.all([
      prisma.advertisement.findMany({
        orderBy: { clicks: 'desc' },
      }),
      prisma.adImpression.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.adClick.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.revenueTransaction.aggregate({
        where: {
          type: 'AD_REVENUE',
          status: 'COMPLETED',
          transactionDate: { gte: startDate },
        },
        _sum: { amount: true },
      }),
    ]);

    const activeAds = allAds.filter(a => a.status === 'ACTIVE');
    const totalSpent = allAds.reduce((sum, a) => sum + a.spent, 0);
    const totalClicks = allAds.reduce((sum, a) => sum + a.clicks, 0);
    const totalImpressions = allAds.reduce((sum, a) => sum + a.impressions, 0);

    // Ads by position
    const adsByPosition: Record<string, number> = {};
    for (const ad of allAds) {
      adsByPosition[ad.position] = (adsByPosition[ad.position] || 0) + 1;
    }

    // Ads by status
    const adsByStatus: Record<string, number> = {};
    for (const ad of allAds) {
      adsByStatus[ad.status] = (adsByStatus[ad.status] || 0) + 1;
    }

    const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const averageCpc = totalClicks > 0 ? totalSpent / totalClicks : 0;

    return {
      totalAds: allAds.length,
      activeAds: activeAds.length,
      totalImpressions,
      totalClicks,
      totalSpent,
      totalRevenue: revenue._sum.amount || 0,
      averageCtr,
      averageCpc,
      adsByPosition,
      adsByStatus,
      topPerformingAds: allAds.slice(0, 10).map(formatAd),
    };
  } catch (error) {
    console.error('Error getting ad analytics:', error);
    return {
      totalAds: 0,
      activeAds: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalSpent: 0,
      totalRevenue: 0,
      averageCtr: 0,
      averageCpc: 0,
      adsByPosition: {},
      adsByStatus: {},
      topPerformingAds: [],
    };
  }
}

// =====================================================
// HELPERS
// =====================================================

interface PrismaAd {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string;
  position: string;
  type: string;
  startDate: Date;
  endDate: Date;
  clicks: number;
  impressions: number;
  budget: number | null;
  spent: number;
  dailyBudget: number | null;
  targetUrl: string | null;
  targetAudience: string | null;
  status: string;
}

interface PrismaAdCampaign {
  id: string;
  toolId: string;
  name: string;
  budget: number;
  spent: number;
  dailyBudget: number | null;
  startDate: Date;
  endDate: Date;
  targetClicks: number | null;
  targetImpressions: number | null;
  status: string;
  tool: {
    name: string;
    slug: string;
  };
}

function formatAd(ad: PrismaAd): AdData {
  const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;
  const remainingBudget = ad.budget ? ad.budget - ad.spent : null;

  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    imageUrl: ad.imageUrl,
    linkUrl: ad.linkUrl,
    position: ad.position,
    type: ad.type,
    startDate: ad.startDate,
    endDate: ad.endDate,
    clicks: ad.clicks,
    impressions: ad.impressions,
    budget: ad.budget,
    spent: ad.spent,
    dailyBudget: ad.dailyBudget,
    targetUrl: ad.targetUrl,
    targetAudience: ad.targetAudience,
    status: ad.status,
    ctr,
    remainingBudget,
  };
}

function formatCampaign(campaign: PrismaAdCampaign): AdCampaignData {
  return {
    id: campaign.id,
    toolId: campaign.toolId,
    toolName: campaign.tool.name,
    toolSlug: campaign.tool.slug,
    name: campaign.name,
    budget: campaign.budget,
    spent: campaign.spent,
    dailyBudget: campaign.dailyBudget,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    targetClicks: campaign.targetClicks,
    targetImpressions: campaign.targetImpressions,
    status: campaign.status,
    remainingBudget: campaign.budget - campaign.spent,
  };
}
