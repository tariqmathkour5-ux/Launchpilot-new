import { track as vercelTrack } from '@vercel/analytics';

// Allowed event names for validation
const ALLOWED_EVENTS = [
  'affiliate_link_click',
  'tool_compare',
  'add_to_favorites',
  'ad_impression',
  'page_view',
  'custom',
];

// Allowed types for Vercel Analytics
type AllowedDataValue = string | number | boolean | null | undefined | string[];
type EventData = Record<string, AllowedDataValue>;

/**
 * Sanitize data to prevent PII leakage
 * Removes sensitive information that should not be sent to analytics
 */
function sanitizeData(data: EventData): EventData {
  const sanitized: EventData = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip sensitive field patterns
    if (/^(email|phone|password|token|secret|key|ssn|credit|card|address|name|ip)$/i.test(key)) {
      continue;
    }
    
    // Truncate long strings to prevent accidental PII
    if (typeof value === 'string' && value.length > 100) {
      sanitized[key] = value.substring(0, 100) + '...' as AllowedDataValue;
    } else if (value !== undefined) {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Track a custom analytics event
 * Acts as a bridge to the analytics provider (Vercel Analytics)
 * Ensures no PII is leaked and only allowed events are tracked
 */
export async function trackEvent(name: string, data: EventData = {}): Promise<void> {
  // Validate event name
  if (!ALLOWED_EVENTS.includes(name)) {
    console.warn(`[Analytics] Event "${name}" is not in the allowed list. Event not tracked.`);
    return;
  }

  try {
    // Sanitize data before sending
    const sanitizedData = sanitizeData(data);
    
    // Send to Vercel Analytics - use type assertion to work with Vercel's strict types
    vercelTrack(name, sanitizedData as unknown as Parameters<typeof vercelTrack>[1]);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Tracked: ${name}`, sanitizedData);
    }
  } catch (error) {
    console.error(`[Analytics] Failed to track event "${name}":`, error);
  }
}

/**
 * Track page view (useful for client-side navigation)
 */
export function trackPageView(path: string, title?: string): void {
  trackEvent('page_view', {
    path,
    title,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track affiliate link clicks
 */
export function trackAffiliateClick(affiliateId: string, platform: string, toolSlug?: string): void {
  trackEvent('affiliate_link_click', {
    affiliate_id: affiliateId,
    platform,
    tool_slug: toolSlug,
  });
}

/**
 * Track tool comparison events
 */
export function trackToolCompare(toolSlugs: string[], comparisonType: 'feature' | 'pricing' | 'overview'): void {
  trackEvent('tool_compare', {
    tools: toolSlugs.slice(0, 5), // Limit to 5 tools max
    comparison_type: comparisonType,
  });
}

/**
 * Track add to favorites
 */
export function trackAddToFavorites(toolSlug: string, userId?: string): void {
  trackEvent('add_to_favorites', {
    tool_slug: toolSlug,
    user_id: userId ? userId.substring(0, 8) : 'anonymous', // Only partial user ID
  });
}

/**
 * Track ad impressions
 */
export function trackAdImpression(adSlot: string, adType: string, placement: string): void {
  trackEvent('ad_impression', {
    ad_slot: adSlot,
    ad_type: adType,
    placement,
  });
}