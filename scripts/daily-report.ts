#!/usr/bin/env ts-node

/**
 * Growth Automation - Daily Performance Report Generator
 * Generates daily summary reports for admin monitoring
 */

import { prisma } from '../src/lib/prisma';
import { join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

const REPORTS_DIR = join(process.cwd(), 'reports');

interface DailyReport {
  date: string;
  generatedAt: string;
  metrics: {
    // User Activity
    activeUsers: number;
    newUsers: number;
    totalUsers: number;
    
    // Reviews
    reviewsSubmitted: number;
    averageRating: number;
    
    // Revenue
    totalRevenue: number;
    totalConversions: number;
    totalAffiliateClicks: number;
    
    // Tools
    toolsViewed: number;
    topTools: Array<{ slug: string; views: number }>;
    
    // System
    dbBackups: number;
  };
}

/**
 * Generate daily performance report
 */
async function generateDailyReport(): Promise<void> {
  try {
    // Create reports directory if needed
    if (!existsSync(REPORTS_DIR)) {
      mkdirSync(REPORTS_DIR, { recursive: true });
      console.log(`[GrowthAutomation] Created reports directory: ${REPORTS_DIR}`);
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

    // Get metrics
    const [
      // User metrics
      totalUsers,
      newUsers,
      
      // Review metrics
      reviewsSubmitted,
      reviewsForAvg,
      
      // Revenue metrics
      totalRevenue,
      totalConversions,
      totalAffiliateClicks,
      
      // Tool view metrics
      toolsViewed,
      topTools,
      
      // Activity logs for backups
      dbBackups,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // New users (last 24 hours)
      prisma.user.count({
        where: {
          createdAt: { gte: startOfYesterday },
        },
      }),
      
      // Reviews submitted
      prisma.userReview.count({
        where: {
          createdAt: { gte: startOfYesterday },
        },
      }),
      
      // Reviews for average calculation
      prisma.userReview.findMany({
        where: {
          createdAt: { gte: startOfYesterday },
        },
        select: { rating: true },
      }),
      
      // Total revenue
      prisma.$queryRaw<Array<{ total: number }>>`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM RevenueTransaction 
        WHERE transactionDate >= ${startOfYesterday}
      `.catch(() => [{ total: 0 }]),
      
      // Total conversions
      prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) as count FROM ToolView 
        WHERE clickedAffiliate = true AND createdAt >= ${startOfYesterday}
      `.catch(() => [{ count: 0 }]),
      
      // Total affiliate clicks
      prisma.affiliateClick.count({
        where: { clickedAt: { gte: startOfYesterday } },
      }).catch(() => 0),
      
      // Tool views
      prisma.toolView.count({
        where: { createdAt: { gte: startOfYesterday } },
      }).catch(() => 0),
      
      // Top tools by views
      prisma.$queryRaw<Array<{ slug: string; views: number }>>`
        SELECT t.slug, COUNT(tv.id) as views
        FROM Tool t
        LEFT JOIN ToolView tv ON tv.toolId = t.id AND tv.createdAt >= ${startOfYesterday}
        GROUP BY t.id, t.slug
        ORDER BY views DESC
        LIMIT 5
      `.catch(() => []),
      
      // DB backups
      prisma.activityLog.count({
        where: {
          action: 'DB_BACKUP',
          createdAt: { gte: startOfYesterday },
        },
      }).catch(() => 0),
    ]);

    // Calculate average rating
    const averageRating = reviewsForAvg.length > 0
      ? reviewsForAvg.reduce((sum, r) => sum + r.rating, 0) / reviewsForAvg.length
      : 0;

    const report: DailyReport = {
      date: yesterday.toISOString().split('T')[0],
      generatedAt: today.toISOString(),
      metrics: {
        activeUsers: Math.floor(totalUsers * 0.1), // Approximation
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

    // Generate text report
    const textReport = generateTextReport(report);
    const reportFilename = `daily-report-${report.date}.txt`;
    const reportPath = join(REPORTS_DIR, reportFilename);

    writeFileSync(reportPath, textReport, 'utf-8');
    console.log(`[GrowthAutomation] ✅ Daily report generated: ${reportPath}`);
    
    // Also log to console
    console.log('\n' + textReport);

  } catch (error) {
    console.error('[GrowthAutomation] ❌ Failed to generate daily report:', error);
  } finally {
    await prisma.$disconnect();
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

// Run the report generator
generateDailyReport();