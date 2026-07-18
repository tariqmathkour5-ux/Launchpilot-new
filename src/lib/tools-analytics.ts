// =====================================================
// TOOLS ANALYTICS
// Aggregates statistics for tools dashboard
// =====================================================

import { searchToolsKb } from '@/lib/tools-kb';

export interface AnalyticsData {
  totalTools: number;
  topCompanies: Array<{
    id: string;
    slug: string;
    name: string;
    toolCount: number;
  }>;
  topCategories: Array<{
    id: string;
    slug: string;
    name: string;
    toolCount: number;
  }>;
  pricingBreakdown: {
    free: number;
    freemium: number;
    paid: number;
    unknown: number;
  };
}

/**
 * Get total tool count from knowledge base
 */
export function getTotalTools(): number {
  const result = searchToolsKb({});
  return result.total;
}

/**
 * Get top companies by tool count
 */
export function getTopCompanies(limit: number = 10): AnalyticsData['topCompanies'] {
  // Load companies data
  const companiesPath = require('path').join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase', 'companies.json');
  const fs = require('fs');
  
  let companies: Array<{ slug: string; name: string; tools: string[] }> = [];
  try {
    if (fs.existsSync(companiesPath)) {
      companies = JSON.parse(fs.readFileSync(companiesPath, 'utf-8'));
    }
  } catch (error) {
    console.error('Failed to load companies:', error);
  }
  
  // Sort by tool count (descending) and limit
  return companies
    .map(c => ({
      id: c.slug,
      slug: c.slug,
      name: c.name,
      toolCount: c.tools.length,
    }))
    .sort((a, b) => b.toolCount - a.toolCount)
    .slice(0, limit);
}

/**
 * Get top categories by tool count
 */
export function getTopCategories(limit: number = 8): AnalyticsData['topCategories'] {
  // Load categories data
  const categoriesPath = require('path').join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase', 'categories.json');
  const fs = require('fs');
  
  let categories: Array<{ slug: string; name: string }> = [];
  try {
    if (fs.existsSync(categoriesPath)) {
      categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
    }
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
  
  // Count tools per category
  const allTools = searchToolsKb({}).tools;
  const categoryCounts = allTools.reduce((acc, tool) => {
    const category = tool.category;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Map to category with counts
  return categories
    .map(c => ({
      id: c.slug,
      slug: c.slug,
      name: c.name,
      toolCount: categoryCounts[c.name] || 0,
    }))
    .sort((a, b) => b.toolCount - a.toolCount)
    .slice(0, limit);
}

/**
 * Get pricing breakdown (free vs. paid tools)
 */
export function getPricingBreakdown(): AnalyticsData['pricingBreakdown'] {
  const allTools = searchToolsKb({}).tools;
  
  return allTools.reduce((acc, tool) => {
    const pricing = tool.pricing?.toLowerCase() || 'unknown';
    if (pricing === 'free') {
      acc.free++;
    } else if (pricing === 'freemium') {
      acc.freemium++;
    } else if (pricing === 'paid') {
      acc.paid++;
    } else {
      acc.unknown++;
    }
    return acc;
  }, {
    free: 0,
    freemium: 0,
    paid: 0,
    unknown: 0,
  });
}

/**
 * Get all analytics data in one call
 */
export function getToolsAnalytics(): AnalyticsData {
  return {
    totalTools: getTotalTools(),
    topCompanies: getTopCompanies(),
    topCategories: getTopCategories(),
    pricingBreakdown: getPricingBreakdown(),
  };
}