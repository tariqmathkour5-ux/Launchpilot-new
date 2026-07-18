// =====================================================
// FULL DATA INTEGRATOR - Integrates CSV and Markdown sources
// Supports large datasets (28,000+ tools) with proper deduplication
// =====================================================

import fs from 'fs';
import path from 'path';

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

// Generate slug from name
function generateSlug(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

// Categorize tool based on name and description
function categorizeTool(name: string, description: string, categoryRaw: string): string {
  if (categoryRaw) {
    const lower = categoryRaw.toLowerCase().trim();
    if (lower.includes('chat')) return 'ai-chat';
    if (lower.includes('image')) return 'ai-image';
    if (lower.includes('code')) return 'ai-code';
    if (lower.includes('writing')) return 'ai-writing';
    if (lower.includes('audio')) return 'ai-audio';
    if (lower.includes('video')) return 'ai-video';
    if (lower.includes('productiv') || lower.includes('automation')) return 'ai-productivity';
    if (lower.includes('marketing')) return 'ai-marketing';
    if (lower.includes('research')) return 'ai-research';
    if (lower.includes('data')) return 'ai-data';
    if (lower.includes('agent')) return 'ai-agents';
    return lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  const combined = (name + ' ' + description).toLowerCase();
  if (combined.includes('agent')) return 'ai-agents';
  if (combined.includes('chat')) return 'ai-chat';
  if (combined.includes('image')) return 'ai-image';
  if (combined.includes('code')) return 'ai-code';
  if (combined.includes('write')) return 'ai-writing';
  if (combined.includes('audio')) return 'ai-audio';
  if (combined.includes('video')) return 'ai-video';
  return 'ai-chat';
}

// Extract tools from markdown files
function extractToolsFromMarkdown(content: string, sourceFile: string): Tool[] {
  const tools: Tool[] = [];
  // Match markdown links: [Tool Name](url) - description
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    const name = match[1].trim();
    const url = match[2].trim();
    
    // Skip if it looks like a header or non-tool link
    if (name.length < 2 || name.includes('http') || name.includes('www') || 
        name.match(/^[A-Z]+$/) || name.match(/^\d+$/)) {
      continue;
    }
    
    const slug = generateSlug(name);
    
    // Extract description from surrounding context (simple heuristic)
    tools.push({
      id: slug,
      slug: slug,
      name: name,
      title: name,
      description: '',
      category: categorizeTool(name, '', ''),
      content: '',
      pricing: 'unknown',
      has_free_tier: false,
      has_api: false,
      platforms: ['Web'],
      features: [],
      pros: [],
      cons: [],
      use_cases: [],
      integrations: [],
      website_url: url.startsWith('http') ? url : '',
      rating: null,
      published: true,
      featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source_file: sourceFile,
    });
  }
  
  return tools;
}

function main() {
  const knowledgeBasePath = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase');
  
  // Load existing tools
  let existingTools: Tool[] = [];
  if (fs.existsSync(path.join(knowledgeBasePath, 'tools_master.json'))) {
    existingTools = JSON.parse(fs.readFileSync(path.join(knowledgeBasePath, 'tools_master.json'), 'utf-8'));
  }
  
  console.log('Existing tools:', existingTools.length);
  
  const existingSlugs = new Set(existingTools.map(t => t.slug));
  const allNewTools: Tool[] = [];
  
  // Process markdown files
  const mdSources = [
    'project/data/extracted/awesome-ai-tools-main/awesome-ai-tools-main',
    'project/data/extracted/ai-directories-main/ai-directories-main'
  ];
  
  for (const sourceDir of mdSources) {
    const fullPath = path.join(process.cwd(), sourceDir);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.md') && f !== 'CONTRIBUTING.md');
      
      for (const file of files) {
        const content = fs.readFileSync(path.join(fullPath, file), 'utf8');
        const tools = extractToolsFromMarkdown(content, sourceDir + '/' + file);
        
        let added = 0;
        for (const tool of tools) {
          if (!existingSlugs.has(tool.slug)) {
            allNewTools.push(tool);
            existingSlugs.add(tool.slug);
            added++;
          }
        }
        console.log('Processed', file + ': ' + added + ' new tools');
      }
    }
  }
  
  // Merge all tools
  const mergedTools = [...existingTools, ...allNewTools];
  
  console.log('\n=== Final Summary ===');
  console.log('Total tools:', mergedTools.length);
  console.log('New tools added:', allNewTools.length);
  
  // Write final tools_master.json
  fs.writeFileSync(
    path.join(knowledgeBasePath, 'tools_master.json'),
    JSON.stringify(mergedTools, null, 2)
  );
  
  console.log('\n✅ Integration completed!');
}

main();