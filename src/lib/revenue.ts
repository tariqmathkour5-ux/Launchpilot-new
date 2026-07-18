import { prisma } from '@/lib/prisma';

// =====================================================
// REVENUE DASHBOARD & FINANCIAL REPORTING
// All financial values stored in cents (integer) for precision
// =====================================================

export interface RevenueSummary {
  totalRevenue: number; // In cents
  mrr: number; // Monthly Recurring Revenue in cents
  arr: number; // Annual Run Rate in cents
  totalTransactions: number;
  pendingTransactions: number;
  revenueByType: Record<string, number>;
  revenueByMonth: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    description: string | null;
    transactionDate: Date;
  }>;
}

export interface RevenueBreakdown {
  affiliateRevenue: number;
  subscriptionRevenue: number;
  adRevenue: number;
  featuredListingRevenue: number;
  totalRevenue: number;
  affiliateShare: number;
  subscriptionShare: number;
  adShare: number;
  featuredShare: number;
}

export interface PayoutSummary {
  totalPendingPayouts: number;
  totalPaidPayouts: number;
  pendingPayouts: Array<{
    partnerId: string;
    partnerName: string;
    partnerEmail: string;
    amount: number;
    transactions: number;
  }>;
}

// =====================================================
// REVENUE SUMMARY
// =====================================================

/**
 * Get comprehensive revenue summary
 */
export async function getRevenueSummary(days: number = 30): Promise<RevenueSummary> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all completed transactions in period
    const transactions = await prisma.revenueTransaction.findMany({
      where: {
        status: 'COMPLETED',
        transactionDate: { gte: startDate },
      },
      orderBy: { transactionDate: 'desc' },
    });

    // Get pending transactions
    const pendingCount = await prisma.revenueTransaction.count({
      where: {
        status: 'PENDING',
        transactionDate: { gte: startDate },
      },
    });

    // Calculate totals
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

    // Revenue by type
    const revenueByType: Record<string, number> = {};
    for (const t of transactions) {
      revenueByType[t.type] = (revenueByType[t.type] || 0) + t.amount;
    }

    // Revenue by month
    const monthlyMap = new Map<string, { amount: number; count: number }>();
    for (const t of transactions) {
      const key = t.transactionDate.toISOString().substring(0, 7); // YYYY-MM
      const existing = monthlyMap.get(key) || { amount: 0, count: 0 };
      existing.amount += t.amount;
      existing.count++;
      monthlyMap.set(key, existing);
    }

    const revenueByMonth = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate MRR (Monthly Recurring Revenue)
    // Sum of all subscription revenue in the last 30 days
    const subscriptionRevenue = transactions
      .filter(t => t.type === 'SUBSCRIPTION')
      .reduce((sum, t) => sum + t.amount, 0);
    const mrr = subscriptionRevenue;
    const arr = mrr * 12;

    return {
      totalRevenue,
      mrr,
      arr,
      totalTransactions: transactions.length,
      pendingTransactions: pendingCount,
      revenueByType,
      revenueByMonth,
      recentTransactions: transactions.slice(0, 20).map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        description: t.description,
        transactionDate: t.transactionDate,
      })),
    };
  } catch (error) {
    console.error('Error getting revenue summary:', error);
    return {
      totalRevenue: 0,
      mrr: 0,
      arr: 0,
      totalTransactions: 0,
      pendingTransactions: 0,
      revenueByType: {},
      revenueByMonth: [],
      recentTransactions: [],
    };
  }
}

/**
 * Get revenue breakdown by source
 */
export async function getRevenueBreakdown(days: number = 30): Promise<RevenueBreakdown> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await prisma.revenueTransaction.findMany({
      where: {
        status: 'COMPLETED',
        transactionDate: { gte: startDate },
      },
    });

    const affiliateRevenue = transactions
      .filter(t => t.type === 'AFFILIATE_EARNING')
      .reduce((sum, t) => sum + t.amount, 0);

    const subscriptionRevenue = transactions
      .filter(t => t.type === 'SUBSCRIPTION')
      .reduce((sum, t) => sum + t.amount, 0);

    const adRevenue = transactions
      .filter(t => t.type === 'AD_REVENUE')
      .reduce((sum, t) => sum + t.amount, 0);

    const featuredListingRevenue = transactions
      .filter(t => t.type === 'FEATURED_LISTING')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalRevenue = affiliateRevenue + subscriptionRevenue + adRevenue + featuredListingRevenue;

    return {
      affiliateRevenue,
      subscriptionRevenue,
      adRevenue,
      featuredListingRevenue,
      totalRevenue,
      affiliateShare: totalRevenue > 0 ? (affiliateRevenue / totalRevenue) * 100 : 0,
      subscriptionShare: totalRevenue > 0 ? (subscriptionRevenue / totalRevenue) * 100 : 0,
      adShare: totalRevenue > 0 ? (adRevenue / totalRevenue) * 100 : 0,
      featuredShare: totalRevenue > 0 ? (featuredListingRevenue / totalRevenue) * 100 : 0,
    };
  } catch (error) {
    console.error('Error getting revenue breakdown:', error);
    return {
      affiliateRevenue: 0,
      subscriptionRevenue: 0,
      adRevenue: 0,
      featuredListingRevenue: 0,
      totalRevenue: 0,
      affiliateShare: 0,
      subscriptionShare: 0,
      adShare: 0,
      featuredShare: 0,
    };
  }
}

/**
 * Get revenue chart data (daily for last N days)
 */
export async function getRevenueChartData(days: number = 30): Promise<Array<{
  date: string;
  affiliate: number;
  subscription: number;
  ad: number;
  featured: number;
  total: number;
}>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await prisma.revenueTransaction.findMany({
      where: {
        status: 'COMPLETED',
        transactionDate: { gte: startDate },
      },
    });

    // Build daily map
    const dailyMap = new Map<string, {
      affiliate: number;
      subscription: number;
      ad: number;
      featured: number;
    }>();

    // Initialize all days
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().split('T')[0];
      dailyMap.set(key, { affiliate: 0, subscription: 0, ad: 0, featured: 0 });
    }

    // Fill in data
    for (const t of transactions) {
      const key = t.transactionDate.toISOString().split('T')[0];
      const existing = dailyMap.get(key);
      if (existing) {
        if (t.type === 'AFFILIATE_EARNING') existing.affiliate += t.amount;
        else if (t.type === 'SUBSCRIPTION') existing.subscription += t.amount;
        else if (t.type === 'AD_REVENUE') existing.ad += t.amount;
        else if (t.type === 'FEATURED_LISTING') existing.featured += t.amount;
      }
    }

    return Array.from(dailyMap.entries()).map(([date, amounts]) => ({
      date,
      ...amounts,
      total: amounts.affiliate + amounts.subscription + amounts.ad + amounts.featured,
    }));
  } catch (error) {
    console.error('Error getting revenue chart data:', error);
    return [];
  }
}

// =====================================================
// PAYOUT MANAGEMENT
// =====================================================

/**
 * Calculate pending payouts for affiliate partners
 */
export async function getPendingPayouts(): Promise<PayoutSummary> {
  try {
    // Get all active partners with earnings
    const partners = await prisma.affiliatePartner.findMany({
      where: {
        status: 'ACTIVE',
        earnings: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        email: true,
        earnings: true,
      },
    });

    // Get already paid amounts
    const paidTransactions = await prisma.revenueTransaction.findMany({
      where: {
        type: 'AFFILIATE_EARNING',
        status: 'COMPLETED',
        description: { contains: 'payout' },
      },
      select: {
        affiliatePartnerId: true,
        amount: true,
      },
    });

    const paidMap = new Map<string, number>();
    for (const t of paidTransactions) {
      if (t.affiliatePartnerId) {
        paidMap.set(t.affiliatePartnerId, (paidMap.get(t.affiliatePartnerId) || 0) + t.amount);
      }
    }

    const pendingPayouts = partners
      .map(p => {
        const paid = paidMap.get(p.id) || 0;
        const pending = p.earnings - paid;
        return {
          partnerId: p.id,
          partnerName: p.name,
          partnerEmail: p.email,
          amount: pending > 0 ? pending : 0,
          transactions: 1,
        };
      })
      .filter(p => p.amount > 0);

    const totalPendingPayouts = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
    const totalPaidPayouts = Array.from(paidMap.values()).reduce((sum, v) => sum + v, 0);

    return {
      totalPendingPayouts,
      totalPaidPayouts,
      pendingPayouts,
    };
  } catch (error) {
    console.error('Error getting pending payouts:', error);
    return {
      totalPendingPayouts: 0,
      totalPaidPayouts: 0,
      pendingPayouts: [],
    };
  }
}

/**
 * Process a payout to an affiliate partner
 */
export async function processPayout(
  partnerId: string,
  amount: number,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const partner = await prisma.affiliatePartner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      return { success: false, error: 'Partner not found' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Invalid payout amount' };
    }

    if (amount > partner.earnings) {
      return { success: false, error: 'Insufficient earnings for payout' };
    }

    // Create payout transaction
    await prisma.revenueTransaction.create({
      data: {
        type: 'AFFILIATE_EARNING',
        amount: -amount, // Negative for payout
        currency: 'USD',
        status: 'COMPLETED',
        affiliatePartnerId: partnerId,
        description: description || `Payout to ${partner.name}`,
        transactionDate: new Date(),
        confirmedAt: new Date(),
      },
    });

    // Record billing transaction
    await prisma.billingTransaction.create({
      data: {
        userId: 'system',
        type: 'payout',
        amount: amount,
        currency: 'USD',
        status: 'completed',
        description: `Payout to affiliate: ${partner.name}`,
        referenceId: partnerId,
        referenceType: 'affiliate_payout',
        processedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error processing payout:', error);
    return { success: false, error: 'Failed to process payout' };
  }
}

// =====================================================
// FINANCIAL METRICS
// =====================================================

export interface FinancialMetrics {
  mrr: number;
  arr: number;
  churnRate: number;
  ltv: number;
  cac: number;
  grossMargin: number;
  averageRevenuePerUser: number;
  paybackPeriod: number;
}

/**
 * Calculate key financial metrics
 */
export async function getFinancialMetrics(): Promise<FinancialMetrics> {
  try {
    // Get active subscriptions
    const activeSubscriptions = await prisma.userSubscription.findMany({
      where: {
        status: { in: ['active', 'trialing'] },
      },
      include: {
        plan: { select: { monthlyPrice: true, yearlyPrice: true } },
      },
    });

    // Calculate MRR
    const mrr = activeSubscriptions.reduce((sum, sub) => {
      if (sub.billingCycle === 'yearly') {
        return sum + Math.round(sub.plan.yearlyPrice / 12);
      }
      return sum + sub.plan.monthlyPrice;
    }, 0);

    const arr = mrr * 12;

    // Calculate churn rate (cancelled in last 30 days / active at start)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const cancelledCount = await prisma.subscriptionEvent.count({
      where: {
        eventType: 'canceled',
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const activeAtStart = activeSubscriptions.length + cancelledCount;
    const churnRate = activeAtStart > 0 ? (cancelledCount / activeAtStart) * 100 : 0;

    // Average Revenue Per User
    const totalUsers = await prisma.user.count();
    const arpu = totalUsers > 0 ? mrr / totalUsers : 0;

    // LTV (simplified: ARPU / churn rate)
    const ltv = churnRate > 0 ? Math.round((arpu / (churnRate / 100)) * 12) : mrr * 24;

    return {
      mrr,
      arr,
      churnRate: Math.round(churnRate * 100) / 100,
      ltv,
      cac: 0, // Would need marketing spend data
      grossMargin: 80, // Estimated 80% gross margin
      averageRevenuePerUser: arpu,
      paybackPeriod: 0, // Would need CAC data
    };
  } catch (error) {
    console.error('Error getting financial metrics:', error);
    return {
      mrr: 0,
      arr: 0,
      churnRate: 0,
      ltv: 0,
      cac: 0,
      grossMargin: 0,
      averageRevenuePerUser: 0,
      paybackPeriod: 0,
    };
  }
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Format cents to display string
 */
export function formatCents(cents: number): string {
  const abs = Math.abs(cents);
  const formatted = (abs / 100).toFixed(2);
  return cents < 0 ? `-$${formatted}` : `$${formatted}`;
}

/**
 * Format cents to display string with compact notation
 */
export function formatCentsCompact(cents: number): string {
  const abs = Math.abs(cents);
  const dollars = abs / 100;
  
  if (dollars >= 1000000) {
    return `${(dollars / 1000000).toFixed(1)}M`;
  }
  if (dollars >= 1000) {
    return `${(dollars / 1000).toFixed(1)}K`;
  }
  return `$${dollars.toFixed(0)}`;
}