import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { join } from 'path';
import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'fs';

interface DailyReport {
  date: string;
  generatedAt: string;
  metrics: {
    activeUsers: number;
    newUsers: number;
    totalUsers: number;
    reviewsSubmitted: number;
    averageRating: number;
    totalRevenue: number;
    totalConversions: number;
    totalAffiliateClicks: number;
    toolsViewed: number;
    topTools: Array<{ slug: string; views: number }>;
    dbBackups: number;
  };
}

/**
 * GET /api/admin/growth-report
 * Admin-only endpoint to generate and retrieve daily performance reports
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: { select: { slug: true } } },
    });

    if (!user?.role?.slug || !['ADMIN', 'OWNER'].includes(user.role.slug)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));

    // Get metrics
    const [
      totalUsers,
      newUsers,
      reviewsSubmitted,
      reviewsForAvg,
      totalRevenue,
      totalConversions,
      totalAffiliateClicks,
      toolsViewed,
      topTools,
      dbBackups,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: startOfYesterday } },
      }),
      prisma.userReview.count({
        where: { createdAt: { gte: startOfYesterday } },
      }),
      prisma.userReview.findMany({
        where: { createdAt: { gte: startOfYesterday } },
        select: { rating: true },
      }),
      prisma.$queryRaw<Array<{ total: number }>>`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM RevenueTransaction 
        WHERE transactionDate >= ${startOfYesterday}
      `.catch(() => [{ total: 0 }]),
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) as count FROM ToolView 
        WHERE clickedAffiliate = true AND createdAt >= ${startOfYesterday}
      `.catch(() => [{ count: 0 }]),
      prisma.affiliateClick.count({
        where: { clickedAt: { gte: startOfYesterday } },
      }).catch(() => 0),
      prisma.toolView.count({
        where: { createdAt: { gte: startOfYesterday } },
      }).catch(() => 0),
      prisma.$queryRaw<Array<{ slug: string; views: number }>>`
        SELECT t.slug, COUNT(tv.id) as views
        FROM Tool t
        LEFT JOIN ToolView tv ON tv.toolId = t.id AND tv.createdAt >= ${startOfYesterday}
        GROUP BY t.id, t.slug
        ORDER BY views DESC
        LIMIT 5
      `.catch(() => []),
      prisma.activityLog.count({
        where: {
          action: 'DB_BACKUP',
          createdAt: { gte: startOfYesterday },
        },
      }).catch(() => 0),
    ]);

    const averageRating = reviewsForAvg.length > 0
      ? reviewsForAvg.reduce((sum, r) => sum + r.rating, 0) / reviewsForAvg.length
      : 0;

    const report: DailyReport = {
      date: yesterday.toISOString().split('T')[0],
      generatedAt: today.toISOString(),
      metrics: {
        activeUsers: Math.floor(totalUsers * 0.1),
        newUsers,
        totalUsers,
        reviewsSubmitted,
        averageRating,
        totalRevenue: Number(totalRevenue[0]?.total || 0),
        totalConversions: Number(totalConversions[0]?.count || 0),
        totalAffiliateClicks,
        toolsViewed,
        topTools,
        dbBackups,
      },
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('[GrowthAutomation] Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/growth-report
 * Generate and save daily report to file
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: { select: { slug: true } } },
    });

    if (!user?.role?.slug || !['ADMIN', 'OWNER'].includes(user.role.slug)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const REPORTS_DIR = join(process.cwd(), 'reports');

    // Create reports directory if needed
    if (!existsSync(REPORTS_DIR)) {
      mkdirSync(REPORTS_DIR, { recursive: true });
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));

    // Get metrics (same as GET)
    const [
      totalUsers,
      newUsers,
      reviewsSubmitted,
      reviewsForAvg,
      totalRevenue,
      totalConversions,
      totalAffiliateClicks,
      toolsViewed,
      topTools,
      dbBackups,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfYesterday } } }),
      prisma.userReview.count({ where: { createdAt: { gte: startOfYesterday } } }),
      prisma.userReview.findMany({ where: { createdAt: { gte: startOfYesterday } }, select: { rating: true } }),
      prisma.$queryRaw<Array<{ total: number }>>`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM RevenueTransaction 
        WHERE transactionDate >= ${startOfYesterday}
      `.catch(() => [{ total: 0 }]),
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) as count FROM ToolView 
        WHERE clickedAffiliate = true AND createdAt >= ${startOfYesterday}
      `.catch(() => [{ count: 0 }]),
      prisma.affiliateClick.count({ where: { clickedAt: { gte: startOfYesterday } } }).catch(() => 0),
      prisma.toolView.count({ where: { createdAt: { gte: startOfYesterday } } }).catch(() => 0),
      prisma.$queryRaw<Array<{ slug: string; views: number }>>`
        SELECT t.slug, COUNT(tv.id) as views
        FROM Tool t
        LEFT JOIN ToolView tv ON tv.toolId = t.id AND tv.createdAt >= ${startOfYesterday}
        GROUP BY t.id, t.slug
        ORDER BY views DESC
        LIMIT 5
      `.catch(() => []),
      prisma.activityLog.count({
        where: { action: 'DB_BACKUP', createdAt: { gte: startOfYesterday } },
      }).catch(() => 0),
    ]);

    const averageRating = reviewsForAvg.length > 0
      ? reviewsForAvg.reduce((sum, r) => sum + r.rating, 0) / reviewsForAvg.length
      : 0;

    const report: DailyReport = {
      date: yesterday.toISOString().split('T')[0],
      generatedAt: today.toISOString(),
      metrics: {
        activeUsers: Math.floor(totalUsers * 0.1),
        newUsers,
        totalUsers,
        reviewsSubmitted,
        averageRating,
        totalRevenue: Number(totalRevenue[0]?.total || 0),
        totalConversions: Number(totalConversions[0]?.count || 0),
        totalAffiliateClicks,
        toolsViewed,
        topTools,
        dbBackups,
      },
    };

    // Generate and save text report
    const textReport = generateTextReport(report);
    const reportFilename = `daily-report-${report.date}.txt`;
    const reportPath = join(REPORTS_DIR, reportFilename);

    writeFileSync(reportPath, textReport, 'utf-8');

    // Log the report generation
    await prisma.activityLog.create({
      data: {
        action: 'REPORT_GENERATED',
        resource: 'growth-report',
        userId: session.user.id,
        details: JSON.stringify({ reportPath, date: report.date }),
      },
    });

    return NextResponse.json({
      success: true,
      report,
      reportPath,
      message: 'Report generated successfully',
    });
  } catch (error) {
    console.error('[GrowthAutomation] Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

/**
 * Generate human-readable text report
 */
function generateTextReport(report: DailyReport): string {
  const lines: string[] = [
    '='.repeat(60),
    'GROWTH AUTOMATION - DAILY PERFORMANCE REPORT',
    '='.repeat(60),
    '',
    `Date: ${report.date}`,
    `Generated At: ${report.generatedAt}`,
    '',
    '-'.repeat(60),
    'USER ACTIVITY',
    '-'.repeat(60),
    `Total Users: ${report.metrics.totalUsers.toLocaleString()}`,
    `New Users (24h): ${report.metrics.newUsers.toLocaleString()}`,
    `Active Users (Est): ${report.metrics.activeUsers.toLocaleString()}`,
    '',
    '-'.repeat(60),
    'REVIEWS & ENGAGEMENT',
    '-'.repeat(60),
    `Reviews Submitted: ${report.metrics.reviewsSubmitted.toLocaleString()}`,
    `Average Rating: ${report.metrics.averageRating.toFixed(1)} / 5`,
    `Tool Views: ${report.metrics.toolsViewed.toLocaleString()}`,
    '',
    '-'.repeat(60),
    'REVENUE & AFFILIATES',
    '-'.repeat(60),
    `Total Revenue: $${report.metrics.totalRevenue.toFixed(2)}`,
    `Conversions: ${report.metrics.totalConversions.toLocaleString()}`,
    `Affiliate Clicks: ${report.metrics.totalAffiliateClicks.toLocaleString()}`,
    '',
    '-'.repeat(60),
    'TOP TOOLS (Views)',
    '-'.repeat(60),
    ...report.metrics.topTools.map((t, i) => 
      `${i + 1}. /tools/${t.slug} - ${t.views.toLocaleString()} views`
    ),
    '',
    '-'.repeat(60),
    'SYSTEM',
    '-'.repeat(60),
    `Database Backups: ${report.metrics.dbBackups.toLocaleString()}`,
    '',
    '='.repeat(60),
    'END OF REPORT',
    '='.repeat(60),
  ];

  return lines.join('\n');
}

/**
 * Get report files list (internal utility)
 */
async function listReportFiles(): Promise<string[]> {
  try {
    const REPORTS_DIR = join(process.cwd(), 'reports');
    
    if (!existsSync(REPORTS_DIR)) {
      return [];
    }

    return readdirSync(REPORTS_DIR)
      .filter(f => f.startsWith('daily-report-') && f.endsWith('.txt'))
      .sort()
      .reverse();
  } catch (error) {
    console.error('[GrowthAutomation] Failed to list report files:', error);
    return [];
  }
}
