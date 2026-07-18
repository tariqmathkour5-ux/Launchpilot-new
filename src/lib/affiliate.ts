import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';
import crypto from 'crypto';

// =====================================================
// AFFILIATE MANAGEMENT SYSTEM
// Link generation, tracking, conversion management
// All financial values stored in cents (integer) for precision
// =====================================================

export interface AffiliateLinkInput {
  partnerId: string;
  toolId: string;
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface AffiliateLinkData {
  id: string;
  slug: string;
  url: string;
  fullUrl: string;
  partnerId: string;
  toolId: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  isActive: boolean;
  clicks: number;
  conversions: number;
  earnings: number;
  createdAt: Date;
}

export interface AffiliateStats {
  partnerId: string;
  partnerName: string;
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number; // In cents
  conversionRate: number;
  averageCommission: number;
  topLinks: Array<{
    linkId: string;
    slug: string;
    toolName: string;
    toolSlug: string;
    clicks: number;
    conversions: number;
    earnings: number;
  }>;
  dailyStats: Array<{
    date: string;
    clicks: number;
    conversions: number;
    earnings: number;
  }>;
}

// =====================================================
// LINK GENERATION
// =====================================================

/**
 * Generate a unique short slug for affiliate links
 */
function generateLinkSlug(): string {
  return crypto.randomBytes(4).toString('hex');
}

/**
 * Build the full affiliate URL with UTM parameters
 */
function buildAffiliateUrl(baseUrl: string, input: AffiliateLinkInput): string {
  const url = new URL(baseUrl);
  
  if (input.source) url.searchParams.set('utm_source', input.source);
  if (input.medium) url.searchParams.set('utm_medium', input.medium);
  if (input.campaign) url.searchParams.set('utm_campaign', input.campaign);
  if (input.term) url.searchParams.set('utm_term', input.term);
  if (input.content) url.searchParams.set('utm_content', input.content);
  
  // Add affiliate ref
  url.searchParams.set('ref', input.partnerId);
  
  return url.toString();
}

/**
 * Create a new affiliate link for a partner and tool
 */
export async function createAffiliateLink(input: AffiliateLinkInput): Promise<AffiliateLinkData | null> {
  try {
    // Verify partner exists and is active
    const partner = await prisma.affiliatePartner.findUnique({
      where: { id: input.partnerId },
    });

    if (!partner || partner.status !== 'ACTIVE') {
      return null;
    }

    // Verify tool exists
    const tool = await prisma.tool.findUnique({
      where: { id: input.toolId },
      select: { id: true, websiteUrl: true, name: true },
    });

    if (!tool || !tool.websiteUrl) {
      return null;
    }

    // Check if link already exists for this partner+tool combination
    const existing = await prisma.affiliateLink.findFirst({
      where: {
        partnerId: input.partnerId,
        toolId: input.toolId,
        isActive: true,
      },
    });

    if (existing) {
      return formatAffiliateLink(existing);
    }

    // Generate unique slug
    const slug = generateLinkSlug();
    
    // Build the full URL
    const fullUrl = buildAffiliateUrl(tool.websiteUrl, input);

    // Create the link
    const link = await prisma.affiliateLink.create({
      data: {
        partnerId: input.partnerId,
        toolId: input.toolId,
        slug,
        url: fullUrl,
        source: input.source || null,
        medium: input.medium || null,
        campaign: input.campaign || null,
        term: input.term || null,
        content: input.content || null,
      },
    });

    return formatAffiliateLink(link);
  } catch (error) {
    console.error('Error creating affiliate link:', error);
    return null;
  }
}

/**
 * Get or create an affiliate link (reuses existing if available)
 */
export async function getOrCreateAffiliateLink(input: AffiliateLinkInput): Promise<AffiliateLinkData | null> {
  try {
    // Try to find existing active link
    const existing = await prisma.affiliateLink.findFirst({
      where: {
        partnerId: input.partnerId,
        toolId: input.toolId,
        isActive: true,
      },
    });

    if (existing) {
      return formatAffiliateLink(existing);
    }

    // Create new one
    return await createAffiliateLink(input);
  } catch (error) {
    console.error('Error getting/creating affiliate link:', error);
    return null;
  }
}

/**
 * Get affiliate link by slug (for redirect)
 */
export async function getAffiliateLinkBySlug(slug: string): Promise<AffiliateLinkData | null> {
  try {
    const link = await prisma.affiliateLink.findUnique({
      where: { slug },
      include: {
        partner: { select: { status: true } },
        tool: { select: { websiteUrl: true } },
      },
    });

    if (!link || !link.isActive || link.partner.status !== 'ACTIVE') {
      return null;
    }

    return formatAffiliateLink(link);
  } catch (error) {
    console.error('Error fetching affiliate link:', error);
    return null;
  }
}

/**
 * Get all affiliate links for a partner
 */
export async function getPartnerLinks(partnerId: string): Promise<AffiliateLinkData[]> {
  try {
    const links = await prisma.affiliateLink.findMany({
      where: { partnerId },
      include: {
        tool: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return links.map(formatAffiliateLink);
  } catch (error) {
    console.error('Error fetching partner links:', error);
    return [];
  }
}

// =====================================================
// CLICK TRACKING
// =====================================================

export interface TrackClickInput {
  linkId?: string;
  toolId: string;
  partnerId?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  country?: string;
  device?: string;
}

/**
 * Track an affiliate click
 */
export async function trackAffiliateClick(input: TrackClickInput): Promise<boolean> {
  try {
    await prisma.affiliateClick.create({
      data: {
        toolId: input.toolId,
        partnerId: input.partnerId || null,
        linkId: input.linkId || null,
        source: input.source || null,
        medium: input.medium || null,
        campaign: input.campaign || null,
        term: input.term || null,
        content: input.content || null,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        referrer: input.referrer || null,
        country: input.country || null,
        device: input.device || null,
      },
    });

    // Increment partner click count
    if (input.partnerId) {
      await prisma.affiliatePartner.update({
        where: { id: input.partnerId },
        data: { clicks: { increment: 1 } },
      });
    }

    // Increment link click count
    if (input.linkId) {
      await prisma.affiliateLink.update({
        where: { id: input.linkId },
        data: { clicks: { increment: 1 } },
      });
    }

    return true;
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
    return false;
  }
}

// =====================================================
// CONVERSION TRACKING
// =====================================================

export interface RecordConversionInput {
  clickId: string;
  amount: number; // In cents
  description?: string;
}

/**
 * Record a conversion from an affiliate click
 */
export async function recordAffiliateConversion(input: RecordConversionInput): Promise<boolean> {
  try {
    // Get the click
    const click = await prisma.affiliateClick.findUnique({
      where: { id: input.clickId },
      include: {
        partner: true,
        tool: { select: { id: true, name: true } },
      },
    });

    if (!click || click.converted) {
      return false;
    }

    // Calculate commission
    let commissionAmount = 0;
    if (click.partner) {
      if (click.partner.commissionType === 'fixed' && click.partner.fixedCommission) {
        commissionAmount = click.partner.fixedCommission;
      } else {
        // Percentage-based commission
        commissionAmount = Math.round(input.amount * (click.partner.commission / 100));
      }
    }

    // Mark click as converted
    await prisma.affiliateClick.update({
      where: { id: input.clickId },
      data: {
        converted: true,
        conversionValue: input.amount,
      },
    });

    // Create revenue transaction
    await prisma.revenueTransaction.create({
      data: {
        type: 'AFFILIATE_EARNING',
        amount: commissionAmount,
        currency: 'USD',
        status: 'COMPLETED',
        toolId: click.toolId,
        affiliatePartnerId: click.partnerId,
        description: input.description || `Affiliate conversion for ${click.tool?.name || 'tool'}`,
        transactionDate: new Date(),
        confirmedAt: new Date(),
      },
    });

    // Update partner stats
    if (click.partnerId) {
      await prisma.affiliatePartner.update({
        where: { id: click.partnerId },
        data: {
          conversions: { increment: 1 },
          earnings: { increment: commissionAmount },
        },
      });
    }

    // Update link stats
    if (click.linkId) {
      await prisma.affiliateLink.update({
        where: { id: click.linkId },
        data: {
          conversions: { increment: 1 },
          earnings: { increment: commissionAmount },
        },
      });
    }

    return true;
  } catch (error) {
    console.error('Error recording affiliate conversion:', error);
    return false;
  }
}

// =====================================================
// PARTNER MANAGEMENT
// =====================================================

/**
 * Generate a unique API token for a partner
 */
export function generatePartnerToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a unique partner code
 */
export async function generatePartnerCode(name: string): Promise<string> {
  const prefix = name.substring(0, 3).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  const code = `${prefix}${random}`;

  // Ensure uniqueness
  const existing = await prisma.affiliatePartner.findUnique({
    where: { code },
  });

  if (existing) {
    return generatePartnerCode(name);
  }

  return code;
}

/**
 * Create a new affiliate partner
 */
export async function createAffiliatePartner(data: {
  name: string;
  email: string;
  commission?: number;
  commissionType?: 'percentage' | 'fixed';
  fixedCommission?: number;
}): Promise<{ success: boolean; partner?: any; error?: string }> {
  try {
    // Check if email already exists
    const existing = await prisma.affiliatePartner.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return { success: false, error: 'A partner with this email already exists' };
    }

    const code = await generatePartnerCode(data.name);
    const apiToken = generatePartnerToken();

    const partner = await prisma.affiliatePartner.create({
      data: {
        name: data.name,
        email: data.email,
        code,
        apiToken,
        commission: data.commission ?? 10.0,
        commissionType: data.commissionType ?? 'percentage',
        fixedCommission: data.fixedCommission ?? null,
      },
    });

    return { success: true, partner };
  } catch (error) {
    console.error('Error creating affiliate partner:', error);
    return { success: false, error: 'Failed to create partner' };
  }
}

/**
 * Get partner by API token
 */
export async function getPartnerByToken(token: string): Promise<any | null> {
  try {
    if (!token || token.length < 32) return null;

    const partner = await prisma.affiliatePartner.findUnique({
      where: { apiToken: token },
      select: {
        id: true,
        name: true,
        email: true,
        code: true,
        commission: true,
        commissionType: true,
        fixedCommission: true,
        status: true,
        clicks: true,
        conversions: true,
        earnings: true,
      },
    });

    if (!partner) return null;

    // Update last login
    await prisma.affiliatePartner.update({
      where: { id: partner.id },
      data: { lastLoginAt: new Date() },
    });

    return partner;
  } catch (error) {
    console.error('Error getting partner by token:', error);
    return null;
  }
}

// =====================================================
// STATISTICS & REPORTING
// =====================================================

/**
 * Get affiliate statistics for a partner
 */
export async function getAffiliateStats(partnerId: string, days: number = 30): Promise<AffiliateStats | null> {
  try {
    const partner = await prisma.affiliatePartner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) return null;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get clicks in period
    const clicks = await prisma.affiliateClick.findMany({
      where: {
        partnerId,
        clickedAt: { gte: startDate },
      },
      orderBy: { clickedAt: 'desc' },
    });

    // Get conversions in period
    const conversions = await prisma.revenueTransaction.findMany({
      where: {
        affiliatePartnerId: partnerId,
        type: 'AFFILIATE_EARNING',
        status: 'COMPLETED',
        transactionDate: { gte: startDate },
      },
    });

    // Get top links
    const topLinks = await prisma.affiliateLink.findMany({
      where: {
        partnerId,
        isActive: true,
      },
      include: {
        tool: { select: { name: true, slug: true } },
      },
      orderBy: { clicks: 'desc' },
      take: 10,
    });

    // Build daily stats
    const dailyMap = new Map<string, { clicks: number; conversions: number; earnings: number }>();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().split('T')[0];
      dailyMap.set(key, { clicks: 0, conversions: 0, earnings: 0 });
    }

    for (const click of clicks) {
      const key = click.clickedAt.toISOString().split('T')[0];
      const existing = dailyMap.get(key);
      if (existing) {
        existing.clicks++;
      }
    }

    for (const conv of conversions) {
      const key = conv.transactionDate.toISOString().split('T')[0];
      const existing = dailyMap.get(key);
      if (existing) {
        existing.conversions++;
        existing.earnings += conv.amount;
      }
    }

    const totalClicks = clicks.length;
    const totalConversions = conversions.length;
    const totalEarnings = conversions.reduce((sum, c) => sum + c.amount, 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const averageCommission = totalConversions > 0 ? totalEarnings / totalConversions : 0;

    return {
      partnerId: partner.id,
      partnerName: partner.name,
      totalClicks,
      totalConversions,
      totalEarnings,
      conversionRate,
      averageCommission,
      topLinks: topLinks.map(link => ({
        linkId: link.id,
        slug: link.slug,
        toolName: link.tool.name,
        toolSlug: link.tool.slug,
        clicks: link.clicks,
        conversions: link.conversions,
        earnings: link.earnings,
      })),
      dailyStats: Array.from(dailyMap.entries()).map(([date, stats]) => ({
        date,
        ...stats,
      })),
    };
  } catch (error) {
    console.error('Error getting affiliate stats:', error);
    return null;
  }
}

/**
 * Get global affiliate analytics (admin)
 */
export async function getGlobalAffiliateAnalytics(days: number = 30): Promise<{
  totalPartners: number;
  activePartners: number;
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  topPartners: Array<{
    id: string;
    name: string;
    email: string;
    clicks: number;
    conversions: number;
    earnings: number;
  }>;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [partners, clicks, conversions] = await Promise.all([
      prisma.affiliatePartner.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          clicks: true,
          conversions: true,
          earnings: true,
        },
        orderBy: { earnings: 'desc' },
      }),
      prisma.affiliateClick.count({
        where: { clickedAt: { gte: startDate } },
      }),
      prisma.revenueTransaction.aggregate({
        where: {
          type: 'AFFILIATE_EARNING',
          status: 'COMPLETED',
          transactionDate: { gte: startDate },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalPartners: partners.length,
      activePartners: partners.filter(p => p.status === 'ACTIVE').length,
      totalClicks: clicks,
      totalConversions: partners.reduce((sum, p) => sum + p.conversions, 0),
      totalEarnings: conversions._sum.amount || 0,
      topPartners: partners.slice(0, 10).map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        clicks: p.clicks,
        conversions: p.conversions,
        earnings: p.earnings,
      })),
    };
  } catch (error) {
    console.error('Error getting global affiliate analytics:', error);
    return {
      totalPartners: 0,
      activePartners: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalEarnings: 0,
      topPartners: [],
    };
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

interface PrismaAffiliateLink {
  id: string;
  slug: string;
  url: string;
  partnerId: string;
  toolId: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  isActive: boolean;
  clicks: number;
  conversions: number;
  earnings: number;
  createdAt: Date;
}

function formatAffiliateLink(link: PrismaAffiliateLink): AffiliateLinkData {
  return {
    id: link.id,
    slug: link.slug,
    url: link.url,
    fullUrl: `/go/${link.slug}`,
    partnerId: link.partnerId,
    toolId: link.toolId,
    source: link.source,
    medium: link.medium,
    campaign: link.campaign,
    isActive: link.isActive,
    clicks: link.clicks,
    conversions: link.conversions,
    earnings: link.earnings,
    createdAt: link.createdAt,
  };
}

/**
 * Format cents to display string
 */
export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Calculate commission amount
 */
export function calculateCommission(
  amount: number, // In cents
  commissionRate: number,
  commissionType: 'percentage' | 'fixed',
  fixedCommission?: number
): number {
  if (commissionType === 'fixed' && fixedCommission) {
    return fixedCommission;
  }
  return Math.round(amount * (commissionRate / 100));
}