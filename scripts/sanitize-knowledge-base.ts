import fs from 'fs';
import path from 'path';

// Affiliate & Tracking Sanitizer Configuration
const AFFILIATE_PARAMS = [
  'affiliate', 'aff', 'aff_id', 'affid', 'ref', 'referral', 'refer', 'partner',
  'partner_id', 'invite', 'inviteCode', 'coupon', 'promo', 'promo_code',
  'discount', 'discount_code', 'campaign', 'tracking', 'tracking_id', 'tracking_code',
  'clickid', 'subid', 'tag', 'share', 'utm_source', 'utm_medium', 'utm_campaign',
  'utm_content', 'utm_term', 'fbclid', 'gclid', 'msclkid'
];

// Sanitize URL - removes all tracking/affiliate parameters
function sanitizeUrl(url: string): string {
  if (!url || url.trim() === '') return '';

  try {
    const urlObj = new URL(url);

    // Remove all tracking parameters
    AFFILIATE_PARAMS.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    // Remove any remaining utm_ params
    for (const key of [...urlObj.searchParams.keys()]) {
      if (key.startsWith('utm_')) {
        urlObj.searchParams.delete(key);
      }
    }

    // Check if it's an affiliate link (insidr.ai/aff/)
    if (urlObj.hostname.includes('insidr.ai') && urlObj.pathname.startsWith('/aff/')) {
      // Return empty - third-party affiliate links should not be preserved
      return '';
    }

    return urlObj.toString();
  } catch {
    return '';
  }
}

// Pricing normalization
function normalizePricing(pricing: string): string {
  if (!pricing) return 'unknown';
  const p = pricing.toLowerCase().trim();
  if (p.includes('free') || p.includes('0')) return 'free';
  if (p.includes('from $') || p.includes('$') || p.includes('mo') || p.includes('week')) return 'paid';
  return 'unknown';
}

// Categorize tool based on name/description
function categorizeTool(name: string, description: string): string {
  const combined = (name + ' ' + description).toLowerCase();

  if (combined.includes('chat') || combined.includes('assistant') || combined.includes('bot') ||
      combined.includes('ai agent') || combined.includes('conversation')) {
    return 'ai-chat';
  }
  if (combined.includes('code') || combined.includes('coding') || combined.includes('developer') ||
      combined.includes('programming') || combined.includes('copilot')) {
    return 'ai-code';
  }
  if (combined.includes('image') || combined.includes('photo') || combined.includes('art') ||
      combined.includes('visual') || combined.includes('design') || combined.includes('generator')) {
    return 'ai-image';
  }
  if (combined.includes('write') || combined.includes('content') || combined.includes('copy') ||
      combined.includes('text') || combined.includes('blog') || combined.includes('seo') || combined.includes('paraphrase')) {
    return 'ai-writing';
  }
  if (combined.includes('audio') || combined.includes('voice') || combined.includes('speech') ||
      combined.includes('music') || combined.includes('sound') || combined.includes('podcast') || combined.includes('transcription')) {
    return 'ai-audio';
  }
  if (combined.includes('video') || combined.includes('clip') || combined.includes('editing')) {
    return 'ai-video';
  }
  if (combined.includes('productiv') || combined.includes('task') || combined.includes('schedule') ||
      combined.includes('automation') || combined.includes('workflow') || combined.includes('product')) {
    return 'ai-productivity';
  }
  if (combined.includes('marketing') || combined.includes('sales') || combined.includes('email') ||
      combined.includes('social media') || combined.includes('ads') || combined.includes('campaign')) {
    return 'ai-marketing';
  }

  return 'ai-chat'; // Default
}

// Generate slug from name
function generateSlug(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Generate official URL based on tool name
function getOfficialUrl(name: string, sanitizedUrl: string): string {
  if (sanitizedUrl) return sanitizedUrl;

  const knownUrls: Record<string, string> = {
    'chatgpt': 'https://chat.openai.com',
    'claude': 'https://claude.ai',
    'midjourney': 'https://www.midjourney.com',
    'github copilot': 'https://github.com/features/copilot',
    'jasper': 'https://www.jasper.ai',
  };

  const lowerName = name.toLowerCase();
  for (const [key, url] of Object.entries(knownUrls)) {
    if (lowerName.includes(key)) return url;
  }

  return '';
}

function main() {
  const knowledgeBasePath = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase');

  console.log('🚀 Phase 2: Sanitization Setup - Starting Affiliate & Tracking Sanitizer...\n');

  // Read existing data
  const toolsMaster = JSON.parse(fs.readFileSync(path.join(knowledgeBasePath, 'tools_master.json'), 'utf8'));
  const categories = JSON.parse(fs.readFileSync(path.join(knowledgeBasePath, 'categories.json'), 'utf8'));

  console.log(`Found ${toolsMaster.length} tools to process\n`);

  // Track statistics
  let sanitizedCount = 0;
  let duplicateRemoved = 0;
  let fieldsAdded = 0;

  // Remove duplicates (keep first occurrence)
  const seenSlugs = new Set<string>();
  const uniqueTools: any[] = [];
  const duplicatesToRemove: string[] = [];

  toolsMaster.forEach((tool: any) => {
    if (seenSlugs.has(tool.slug)) {
      duplicatesToRemove.push(tool.id);
      duplicateRemoved++;
    } else {
      seenSlugs.add(tool.slug);
      uniqueTools.push(tool);
    }
  });

  console.log(`Phase 2.1: Removed ${duplicateRemoved} duplicate tools`);
  console.log(`Phase 2.2: Processing ${uniqueTools.length} unique tools for sanitization...\n`);

  // Process each tool
  const sanitizedTools = uniqueTools.map((tool: any) => {
    const originalUrl = tool.website_url || '';
    const sanitizedUrl = sanitizeUrl(originalUrl);

    // Check if sanitization was needed
    const neededSanitization = originalUrl !== sanitizedUrl;
    if (neededSanitization) {
      sanitizedCount++;
    }

    // Ensure affiliate fields exist (empty for future use)
    const hasAffiliateFields = tool.launchpilot_affiliate_url !== undefined && tool.launchpilot_affiliate_params !== undefined;

    // Build sanitized/updated tool
    const processedTool = {
      ...tool,
      website_url: getOfficialUrl(tool.name, sanitizedUrl),
      launchpilot_affiliate_url: tool.launchpilot_affiliate_url !== undefined ? tool.launchpilot_affiliate_url : '',
      launchpilot_affiliate_params: tool.launchpilot_affiliate_params !== undefined ? tool.launchpilot_affiliate_params : '',
    };

    if (!hasAffiliateFields) {
      fieldsAdded++;
    }

    return processedTool;
  });

  console.log(`Phase 2.3: Sanitization Results:`);
  console.log(`  - URLs sanitized: ${sanitizedCount}`);
  console.log(`  - Affiliate fields added: ${fieldsAdded}`);
  console.log(`  - Total processing time: completed\n`);

  // Write updated tools_master.json
  fs.writeFileSync(
    path.join(knowledgeBasePath, 'tools_master.json'),
    JSON.stringify(sanitizedTools, null, 2)
  );

  // Regenerate CSV with sanitized data
  const csvLines = ['id,name,title,description,category,pricing,has_free_tier,has_api,website_url,features,pros,cons'];
  sanitizedTools.forEach((t: any) => {
    csvLines.push([
      t.id,
      t.name,
      `"${t.title || t.name}"`,
      `"${t.description || ''}"`,
      t.category,
      t.pricing || 'unknown',
      t.has_free_tier || false,
      t.has_api || false,
      t.website_url || '',
      (t.features || []).join('|'),
      (t.pros || []).join('|'),
      (t.cons || []).join('|')
    ].join(','));
  });

  fs.writeFileSync(
    path.join(knowledgeBasePath, 'tools_master.csv'),
    csvLines.join('\n')
  );

  // Regenerate SEO for all tools
  const seoForAllTools = sanitizedTools.map((t: any) => ({
    tool_slug: t.slug,
    seo_title: `${t.name} — AI Tool | LaunchPilot`,
    seo_description: (t.description || '').substring(0, 160),
    seo_keywords: [t.category, t.name.toLowerCase()],
    canonical_url: `https://launchpilot.com/tools/${t.slug}`,
    og_image: `https://launchpilot.com/og/${t.slug}.png`,
    no_index: false,
    structured_data: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': t.name,
      'applicationCategory': t.category,
      'operatingSystem': 'Web',
      'offers': {
        '@type': 'Offer',
        'price': t.has_free_tier ? '0' : '0',
        'priceCurrency': 'USD'
      }
    }
  }));

  fs.writeFileSync(
    path.join(knowledgeBasePath, 'seo.json'),
    JSON.stringify(seoForAllTools, null, 2)
  );

  console.log('✅ Phase 2 & 3 Complete: Sanitization and integration finished!');
  console.log(`\nFinal Statistics:`);
  console.log(`  - Total tools in Knowledge Base: ${sanitizedTools.length}`);
  console.log(`  - Duplicates removed: ${duplicateRemoved}`);
  console.log(`  - URLs sanitized: ${sanitizedCount}`);
  console.log(`  - Affiliate fields ensured: ${fieldsAdded}`);
  console.log(`  - Categories: ${categories.length}`);
}

main();