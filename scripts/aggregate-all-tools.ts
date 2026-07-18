// =====================================================
// MASTER DATA AGGREGATOR - Combines all CSV sources into tools_master.json
// Supports large datasets (28,000+ tools) with proper deduplication
// =====================================================

import fs from 'fs';
import path from 'path';

interface RawTool {
  [key: string]: string;
}

interface Tool {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  category: string;
  content: string;
  pricing: string;
  has_free_tier: boolean;
  has_api: boolean;
  platforms: string[];
  features: string[];
  pros: string[];
  cons: string[];
  use_cases: string[];
  integrations: string[];
  website_url: string;
  rating: null;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
  source_file?: string;
}

// Pricing normalization
function normalizePricing(pricing: string): string {
  if (!pricing) return 'unknown';
  const p = pricing.toLowerCase().trim();
  if (p.includes('free') || p.includes('0') || p.includes('open source') || p === 'yes' && pricing.includes('open')) return 'free';
  if (p.includes('freemium') || p.includes('trial')) return 'freemium';
  if (p.includes('pay-as-you-go') || p.includes('subscription') || p.includes('$') || p.includes('mo')) return 'paid';
  return 'unknown';
}

// Generate slug from name
function generateSlug(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100); // Limit slug length
}

// Categorize tool based on various attributes
function categorizeTool(name: string, description: string, intelligenceType: string, primaryDomain: string, categoryRaw: string): string {
  // If category is already provided, use it
  if (categoryRaw) {
    const lower = categoryRaw.toLowerCase().trim();
    // Map to standard categories
    if (lower.includes('chat') || lower.includes('conversational') || lower.includes('llm')) return 'ai-chat';
    if (lower.includes('image') || lower.includes('design') || lower.includes('visual') || lower.includes('art')) return 'ai-image';
    if (lower.includes('code') || lower.includes('developer') || lower.includes('programming')) return 'ai-code';
    if (lower.includes('writing') || lower.includes('content') || lower.includes('text')) return 'ai-writing';
    if (lower.includes('audio') || lower.includes('voice') || lower.includes('speech') || lower.includes('music')) return 'ai-audio';
    if (lower.includes('video') || lower.includes('animation')) return 'ai-video';
    if (lower.includes('productiv') || lower.includes('automation') || lower.includes('workflow') || lower.includes('agent')) return 'ai-productivity';
    if (lower.includes('marketing') || lower.includes('seo') || lower.includes('ads')) return 'ai-marketing';
    if (lower.includes('research') || lower.includes('search')) return 'ai-research';
    if (lower.includes('data')) return 'ai-data';
    return lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  const combined = (name + ' ' + description + ' ' + intelligenceType + ' ' + primaryDomain).toLowerCase();
  
  // Check for agent-related tools - categorize separately
  if (combined.includes('agent')) {
    return 'ai-agents';
  }
  
  if (combined.includes('chat') || combined.includes('assistant') || combined.includes('bot') || combined.includes('conversation')) {
    return 'ai-chat';
  }
  if (combined.includes('code') || combined.includes('coding') || combined.includes('developer') || combined.includes('programming')) {
    return 'ai-code';
  }
  if (combined.includes('image') || combined.includes('photo') || combined.includes('art') || combined.includes('design') || combined.includes('visual')) {
    return 'ai-image';
  }
  if (combined.includes('write') || combined.includes('content') || combined.includes('copy') || combined.includes('text') || combined.includes('seo') || combined.includes('blog') || combined.includes('article')) {
    return 'ai-writing';
  }
  if (combined.includes('audio') || combined.includes('voice') || combined.includes('speech') || combined.includes('music') || combined.includes('podcast') || combined.includes('transcription')) {
    return 'ai-audio';
  }
  if (combined.includes('video') || combined.includes('clip') || combined.includes('editing') || combined.includes('movie')) {
    return 'ai-video';
  }
  if (combined.includes('productiv') || combined.includes('task') || combined.includes('automation') || combined.includes('workflow')) {
    return 'ai-productivity';
  }
  if (combined.includes('marketing') || combined.includes('sales') || combined.includes('ads') || combined.includes('campaign') || combined.includes('social media')) {
    return 'ai-marketing';
  }
  if (combined.includes('research') || combined.includes('search') || combined.includes('academic')) {
    return 'ai-research';
  }
  if (combined.includes('data') || combined.includes('analytics') || combined.includes('business intelligence')) {
    return 'ai-data';
  }
  
  return 'ai-chat'; // Default
}

// Parse CSV content
function parseCsv(content: string): RawTool[] {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length === 0) return [];
  
  const headers = parseCsvLine(lines[0]);
  const tools: RawTool[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const tool: RawTool = {};
    headers.forEach((header, idx) => {
      tool[header] = values[idx] || '';
    });
    if (tool['AI_Name'] || tool['tool_name'] || tool['name'] || tool['Tool Name'] || tool['Names']) {
      tools.push(tool);
    }
  }
  
  return tools;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
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

// Convert raw tool to Tool format
function convertTool(raw: RawTool, sourceFile: string): Tool {
  // Handle different CSV header formats
  const name = raw['AI_Name'] || raw['tool_name'] || raw['Tool Name'] || raw['Tool name'] || raw['Names'] || 'Unknown';
  const description = raw['Key_Functionality'] || raw['description'] || raw['Short Description'] || raw['Descriptions'] || '';
  const intelligenceType = raw['Intelligence_Type'] || raw['Intelligence Type'] || raw['Intelligence Type '] || '';
  const primaryDomain = raw['Primary_Domain'] || raw['Primary Domain'] || '';
  const pricing = raw['Pricing_Model'] || raw['pricing'] || raw['Pricing'] || raw['Prices'] || raw['pricing_model'] || '';
  const apiAvailability = raw['API_Availability'] || raw['has_api'] || raw['api_available'] || raw['open_source'] || '';
  const website = raw['Website_URL'] || raw['website_url'] || raw['Website'] || raw['URL'] || raw['website'] || raw['Web_URLs'] || '';
  const categoryRaw = raw['category_canonical'] || raw['category'] || '';
  
  const slug = generateSlug(name);
  
  // Determine category
  const category = categorizeTool(name, description, intelligenceType, primaryDomain, categoryRaw);
  
  // Handle open_source field which might be 'yes'/'no' or 'true'/'false'
  let hasApiBool = false;
  let hasFreeTierBool = false;
  
  const apiValue = (apiAvailability || '').toLowerCase();
  if (apiValue === 'yes' || apiValue === 'true' || apiValue === '1') {
    hasApiBool = true;
  }
  
  const pricingValue = (pricing || '').toLowerCase();
  if (pricingValue === 'yes' || pricingValue === 'true' || pricingValue.includes('open source')) {
    hasFreeTierBool = true;
  }
  
  return {
    id: slug,
    slug: slug,
    name: name,
    title: name + ' — ' + (description.length > 100 ? description.substring(0, 100) + '...' : description),
    description: description,
    category: category,
    content: description,
    pricing: normalizePricing(pricing),
    has_free_tier: hasFreeTierBool || normalizePricing(pricing) === 'free' || pricingValue.includes('freemium') || pricingValue.includes('trial'),
    has_api: hasApiBool,
    platforms: ['Web'], // Default platform, can be enhanced later
    features: [],
    pros: [],
    cons: [],
    use_cases: [],
    integrations: [],
    website_url: website,
    rating: null,
    published: true,
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source_file: sourceFile,
  };
}

// Main aggregation function
function main() {
  const knowledgeBasePath = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase');
  const extractedPath = path.join(process.cwd(), 'project/data/extracted');
  
  // Load existing tools
  const existingToolsPath = path.join(knowledgeBasePath, 'tools_master.json');
  let existingTools: Tool[] = [];
  if (fs.existsSync(existingToolsPath)) {
    existingTools = JSON.parse(fs.readFileSync(existingToolsPath, 'utf-8'));
  }
  
  console.log('Existing tools:', existingTools.length);
  
  const existingSlugs = new Set(existingTools.map(t => t.slug));
  const allNewTools: Tool[] = [];
  const stats: { file: string; tools: number }[] = [];
  
  // Process all CSV files in extracted folder
  const csvFiles = [
    'archive_(8)/AI_Landscape_19k_Tools_2026.csv',
    'archive_(7)/AI_tools_dataset.csv',
    'archive_(9)/ai_tools.csv',
    'archive_(6)/Generative AI Tools - Platforms 2025.csv',
    'archive_(2)/Ai Tools Directory.csv',
    'archive/Ai Tools Directory.csv'
  ];
  
  csvFiles.forEach(relativePath => {
    const fullPath = path.join(extractedPath, relativePath);
    if (!fs.existsSync(fullPath)) {
      console.log('Skipping (not found):', relativePath);
      return;
    }
    
    const content = fs.readFileSync(fullPath, 'utf-8');
    const rawTools = parseCsv(content);
    
    let addedCount = 0;
    rawTools.forEach(raw => {
      const tool = convertTool(raw, relativePath);
      if (!existingSlugs.has(tool.slug)) {
        allNewTools.push(tool);
        existingSlugs.add(tool.slug);
        addedCount++;
      }
    });
    
    stats.push({ file: relativePath, tools: addedCount });
    console.log('Processed', relativePath + ':', addedCount, 'new tools');
  });
  
  // Merge all tools
  const mergedTools = [...existingTools, ...allNewTools];
  
  console.log('\n=== Aggregation Summary ===');
  console.log('Total tools after merge:', mergedTools.length);
  console.log('New tools added:', allNewTools.length);
  
  const categoryCounts: Record<string, number> = {};
  mergedTools.forEach(t => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });
  
  console.log('\nCategory breakdown:');
  Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log('  ' + cat + ': ' + count);
  });
  
  // Write merged tools_master.json
  fs.writeFileSync(
    path.join(knowledgeBasePath, 'tools_master.json'),
    JSON.stringify(mergedTools, null, 2)
  );
  
  // Generate updated CSV
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
  
  // Generate tags.json (extract unique categories)
  const tags = Object.keys(categoryCounts).map(cat => ({
    id: cat,
    slug: cat,
    name: cat.replace('ai-', '').replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    description: cat.replace('ai-', '').replace(/-/g, ' ') + ' tools'
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
  
  // Generate merge report
  const mergeReport = {
    timestamp: new Date().toISOString(),
    source: 'All CSV files in project/data/extracted',
    processed: {
      total: mergedTools.length,
      added: allNewTools.length,
      skipped: existingTools.length,
    },
    sources: stats,
    categoryCounts,
  };
  
  fs.writeFileSync(
    path.join(knowledgeBasePath, 'merge_report.json'),
    JSON.stringify(mergeReport, null, 2)
  );
  
  console.log('\n✅ Merge completed successfully!');
  console.log('Files updated: tools_master.json, tools_master.csv, tags.json, seo.json, merge_report.json');
}

main();