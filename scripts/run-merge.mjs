import fs from 'fs';
import path from 'path';

// Affiliate & Tracking Sanitizer
const AFFILIATE_PARAMS = [
  'affiliate', 'aff', 'aff_id', 'affid', 'ref', 'referral', 'refer', 'partner', 
  'partner_id', 'invite', 'inviteCode', 'coupon', 'promo', 'promo_code', 
  'discount', 'discount_code', 'campaign', 'tracking', 'tracking_id', 'tracking_code',
  'clickid', 'subid', 'tag', 'share', 'utm_source', 'utm_medium', 'utm_campaign',
  'utm_content', 'utm_term', 'fbclid', 'gclid', 'msclkid'
];

function sanitizeUrl(url) {
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
function normalizePricing(pricing) {
  if (!pricing) return 'unknown';
  const p = pricing.toLowerCase().trim();
  if (p.includes('free') || p.includes('0')) return 'free';
  if (p.includes('from $') || p.includes('$') || p.includes('mo') || p.includes('week')) return 'paid';
  return 'unknown';
}

// Generate slug from name
function generateSlug(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Generate official URL based on tool name
function getOfficialUrl(name, sanitizedUrl) {
  if (sanitizedUrl) return sanitizedUrl;
  
  const knownUrls = {
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

// Categorize tool based on name/description - returns lowercase slug format
function categorizeTool(name, description) {
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

// Parse CSV line handling quoted fields
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Convert tool data to match existing format (capitalized category names)
function normalizeToolData(tool) {
  // Convert lowercase category to capitalized format to match existing data
  const capitalizedCategory = tool.category
    .split('-')
    .map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  
  return {
    ...tool,
    category: capitalizedCategory
  };
}

function main() {
  const knowledgeBasePath = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase');
  const sourceCsvPath = 'c:/Users/طارق/Downloads/Telegram Desktop/project/data/‏‏Ai_Tools_Directory_(1) - نسخة.csv';
  
  // Read existing data
  const existingTools = JSON.parse(fs.readFileSync(path.join(knowledgeBasePath, 'tools_master.json'), 'utf8'));
  
  // Read source CSV
  const csvContent = fs.readFileSync(sourceCsvPath, 'utf8');
  const lines = csvContent.split('\n').filter(l => l.trim());
  
  const existingSlugs = new Set(existingTools.map(t => t.slug));
  const newTools = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    
    const name = values[1] || '';
    const description = values[2] || '';
    const pricing = values[3] || '';
    const rawUrl = values[4] || '';
    
    const slug = generateSlug(name);
    
    // Skip if already exists
    if (existingSlugs.has(slug)) {
      continue;
    }
    
    // Sanitize URL - removes affiliate links entirely
    const sanitizedUrl = sanitizeUrl(rawUrl);
    const officialUrl = getOfficialUrl(name, sanitizedUrl);
    
    const tool = {
      id: slug,
      slug: slug,
      name: name,
      title: name + ' — ' + (description.length > 100 ? description.substring(0, 100) + '...' : description),
      description: description,
      category: categorizeTool(name, description),
      content: description,
      pricing: normalizePricing(pricing),
      has_free_tier: normalizePricing(pricing) === 'free' || pricing.toLowerCase().includes('trial') || pricing.toLowerCase().includes('free'),
      has_api: false,
      platforms: ['Web'],
      features: [],
      pros: [],
      cons: [],
      use_cases: [],
      integrations: [],
      website_url: officialUrl,
      // LaunchPilot affiliate fields - left empty for future use
      launchpilot_affiliate_url: '',
      launchpilot_affiliate_params: '',
      rating: null,
      published: true,
      featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    newTools.push(tool);
  }
  
  console.log('New tools to merge:', newTools.length);
  
  // Normalize new tools to match existing format
  const normalizedNewTools = newTools.map(normalizeToolData);
  
  // Merge tools
  const mergedTools = [...existingTools, ...normalizedNewTools];
  
  // Write updated tools_master.json
  fs.writeFileSync(
    path.join(knowledgeBasePath, 'tools_master.json'),
    JSON.stringify(mergedTools, null, 2)
  );
  
  // Write updated tools_master.csv
  const csvLines = ['id,name,title,description,category,pricing,has_free_tier,has_api,website_url,features,pros,cons'];
  mergedTools.forEach(t => {
    csvLines.push([
      t.id,
      t.name,
      `"${t.title}"`,
      `"${t.description}"`,
      t.category,
      t.pricing,
      t.has_free_tier,
      t.has_api,
      t.website_url,
      t.features.join('|'),
      t.pros.join('|'),
      t.cons.join('|')
    ].join(','));
  });
  
  fs.writeFileSync(
    path.join(knowledgeBasePath, 'tools_master.csv'),
    csvLines.join('\n')
  );
  
  // Generate tags.json (extract unique categories from tools - normalized format)
  const allCategories = [...new Set(mergedTools.map(t => t.category))];
  const tags = allCategories.map(cat => ({
    id: cat,
    slug: cat,
    name: cat,
    description: cat + ' tools'
  }));
  
  fs.writeFileSync(
    path.join(knowledgeBasePath, 'tags.json'),
    JSON.stringify(tags, null, 2)
  );
  
  // Generate updated seo.json for all tools
  const seoForAllTools = mergedTools.map(t => ({
    tool_slug: t.slug,
    seo_title: `${t.name} — AI Tool | LaunchPilot`,
    seo_description: t.description.substring(0, 160),
    seo_keywords: [t.category.toLowerCase().replace(/\s+/g, '-'), t.name.toLowerCase()],
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
  
  // Generate TOOLS_MASTER.xlsx (simple CSV-based approach - xlsx compatible)
  // Since we can't use xlsx library without npm, we'll create a proper tab-separated version
  const xlsxLines = ['id\tname\ttitle\tdescription\tcategory\tpricing\thas_free_tier\thas_api\twebsite_url'];
  mergedTools.forEach(t => {
    xlsxLines.push([
      t.id,
      t.name,
      t.title.replace(/\t/g, ' '),
      t.description.replace(/\t/g, ' '),
      t.category,
      t.pricing,
      t.has_free_tier,
      t.has_api,
      t.website_url
    ].join('\t'));
  });
  
  fs.writeFileSync(
    path.join(knowledgeBasePath, 'TOOLS_MASTER.xlsx'),
    xlsxLines.join('\n')
  );
  
  console.log('✅ Merge completed successfully!');
  console.log('Total tools:', mergedTools.length);
  console.log('New tools added:', newTools.length);
  console.log('Tags extracted:', tags.length);
}

main();