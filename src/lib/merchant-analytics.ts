import { prisma } from "@/lib/prisma";

// Merchant Analytics Types
export interface MerchantAnalyticsData {
  partner: {
    id: string;
    name: string;
    email: string;
    commission: number;
    status: string;
  };
  totals: {
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    conversionRate: number;
  };
  dailyStats: Array<{
    date: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
  topTools: Array<{
    toolId: string;
    toolName: string;
    toolSlug: string;
    clicks: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
  }>;
}

// Daily stat type for raw query
interface DailyStatRow {
  date: Date;
  clicks: bigint;
  conversions: bigint;
  revenue: number;
}

// Top tool type for raw query
interface TopToolRow {
  toolId: string;
  toolName: string;
  toolSlug: string;
  clicks: bigint;
  conversions: bigint;
  revenue: number;
}

// Verify merchant token and return partner if valid
export async function verifyMerchantToken(token: string): Promise<{ id: string; name: string; email: string; commission: number; status: string } | null> {
  if (!token) return null;

  try {
    // Validate token format first to prevent unnecessary DB queries
    if (typeof token !== "string" || token.length < 32) {
      return null;
    }

    const partner = await prisma.affiliatePartner.findUnique({
      where: { apiToken: token },
      select: {
        id: true,
        name: true,
        email: true,
        commission: true,
        status: true,
      },
    });

    if (!partner) return null;
    
    // Update last login time
    await prisma.affiliatePartner.update({
      where: { id: partner.id },
      data: { lastLoginAt: new Date() },
    });

    return partner;
  } catch (error) {
    console.error("Merchant token verification error:", error);
    return null;
  }
}

// Get analytics data for a specific merchant partner
export async function getMerchantAnalytics(partnerId: string): Promise<MerchantAnalyticsData | null> {
  try {
    // Get partner info
    const partner = await prisma.affiliatePartner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) return null;

    // Get total clicks for this partner
    const totalClicksCount = await prisma.affiliateClick.count({
      where: { partnerId },
    });

    // Get conversions (transactions) for this partner
    const totalConversionsCount = await prisma.revenueTransaction.count({
      where: {
        affiliatePartnerId: partnerId,
        type: "AFFILIATE_EARNING",
      },
    });

    // Get total revenue from successful transactions
    const revenueResult = await prisma.revenueTransaction.aggregate({
      where: {
        affiliatePartnerId: partnerId,
        type: "AFFILIATE_EARNING",
        status: "COMPLETED",
      },
      _sum: {
        amount: true,
      },
    });

    const totalRevenueValue = revenueResult._sum.amount || 0;
    const convRate = totalClicksCount > 0 ? (totalConversionsCount / totalClicksCount) * 100 : 0;

    // Get daily stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStatsRaw = await prisma.$queryRaw<DailyStatRow[]>`
      SELECT 
        DATE(ac.clickedAt) as date,
        COUNT(ac.id) as clicks,
        COUNT(rt.id) as conversions,
        COALESCE(SUM(rt.amount), 0) as revenue
      FROM AffiliateClick ac
      LEFT JOIN RevenueTransaction rt ON rt.affiliatePartnerId = ac.partnerId 
        AND rt.type = 'AFFILIATE_EARNING' 
        AND rt.status = 'COMPLETED'
        AND DATE(rt.transactionDate) = DATE(ac.clickedAt)
      WHERE ac.partnerId = ${partnerId}
        AND ac.clickedAt >= ${thirtyDaysAgo}
      GROUP BY DATE(ac.clickedAt)
      ORDER BY date DESC
    `;

    // Get top performing tools for this partner
    const topToolsRaw = await prisma.$queryRaw<TopToolRow[]>`
      SELECT 
        t.id as toolId,
        t.name as toolName,
        t.slug as toolSlug,
        COALESCE(COUNT(ac.id), 0) as clicks,
        COUNT(rt.id) as conversions,
        COALESCE(SUM(rt.amount), 0) as revenue
      FROM Tool t
      LEFT JOIN AffiliateClick ac ON ac.toolId = t.id AND ac.partnerId = ${partnerId}
      LEFT JOIN RevenueTransaction rt ON rt.toolId = t.id AND rt.affiliatePartnerId = ${partnerId} AND rt.type = 'AFFILIATE_EARNING'
      GROUP BY t.id, t.name, t.slug
      HAVING clicks > 0
      ORDER BY revenue DESC
      LIMIT 10
    `;

    // Format daily stats
    const dailyStats = dailyStatsRaw.map((stat) => ({
      date: stat.date.toISOString().split("T")[0],
      clicks: Number(stat.clicks),
      conversions: Number(stat.conversions),
      revenue: Number(stat.revenue),
    }));

    // Calculate conversion rates for each tool
    const topTools = topToolsRaw.map((tool) => ({
      toolId: tool.toolId,
      toolName: tool.toolName,
      toolSlug: tool.toolSlug,
      clicks: Number(tool.clicks),
      conversions: Number(tool.conversions),
      revenue: Number(tool.revenue),
      conversionRate: Number(tool.clicks) > 0 ? (Number(tool.conversions) / Number(tool.clicks)) * 100 : 0,
    }));

    return {
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        commission: partner.commission,
        status: partner.status,
      },
      totals: {
        totalClicks: totalClicksCount,
        totalConversions: totalConversionsCount,
        totalRevenue: Number(totalRevenueValue),
        conversionRate: convRate,
      },
      dailyStats,
      topTools,
    };
  } catch (error) {
    console.error("Merchant analytics fetch error:", error);
    return null;
  }
}

// Generate a unique API token for a merchant partner
export function generateMerchantToken(): string {
  // Use Node.js crypto for secure random token generation
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
}