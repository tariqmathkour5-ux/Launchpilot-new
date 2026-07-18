/**
 * Deals utilities for tool cards
 */

import { getToolsWithDeals, getDealByTool } from '@/data/deals';

// Cache the tools with deals to avoid repeated computation
let cachedToolsWithDeals: string[] | null = null;
let cacheTimestamp: number = 0;

export function hasActiveDeal(toolSlug: string): boolean {
  // Use cache if available and less than 1 hour old
  const now = Date.now();
  if (cachedToolsWithDeals && now - cacheTimestamp < 3600000) {
    return cachedToolsWithDeals.includes(toolSlug);
  }
  
  const toolsWithDeals = getToolsWithDeals();
  cachedToolsWithDeals = toolsWithDeals;
  cacheTimestamp = now;
  return toolsWithDeals.includes(toolSlug);
}

export function getDealForTool(toolSlug: string) {
  return getDealByTool(toolSlug);
}

// Get badge variant for deal type
export function getDealBadgeVariant(toolSlug: string): 'promo' | 'price-drop' | null {
  const deal = getDealByTool(toolSlug);
  if (!deal) return null;
  return deal.type === 'promo_code' ? 'promo' : 'price-drop';
}