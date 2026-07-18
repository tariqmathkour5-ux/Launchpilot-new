import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Tool, ToolAlternative, ToolReview } from '@/types';

// Use the knowledge base JSON as the primary source
const KB_PATH = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase', 'tools_master.json');
const AGENT_CATEGORIES = ['ai-agents'];
const AGENT_KEYWORDS = ['agent', 'autonomous agent', 'ai agent', 'agentic'];

let kbToolsCache: Tool[] | null = null;

/**
 * Load tools from knowledge base (AI Tools only, excluding agents)
 */
function loadKbTools(): Tool[] {
  if (kbToolsCache) return kbToolsCache;
  
  try {
    if (fs.existsSync(KB_PATH)) {
      const content = fs.readFileSync(KB_PATH, 'utf-8');
      const kbTools = JSON.parse(content) as Tool[];
      
      // Filter out agent tools
      kbToolsCache = kbTools.filter(tool => {
        if (AGENT_CATEGORIES.includes(tool.category.toLowerCase())) {
          return false;
        }
        const combined = (tool.name + ' ' + tool.description).toLowerCase();
        for (const keyword of AGENT_KEYWORDS) {
          if (combined.includes(keyword)) {
            return false;
          }
        }
        return true;
      });
      
      return kbToolsCache;
    }
  } catch (error) {
    console.error('Failed to load knowledge base tools:', error);
  }
  
  return [];
}

/**
 * Clear the cache (useful for testing or when data changes)
 */
export function clearCache(): void {
  kbToolsCache = null;
}

// Legacy markdown parsing functions (kept for backward compatibility)
const DATA_DIR = path.join(process.cwd(), 'src/data');

function extractArrayFromMarkdown(content: string, section: string): string[] {
  const regex = new RegExp(`###\\s*\\d+\\.\\s*([^\\n]+)`, 'g');
  const sectionStart = content.indexOf(`## ${section}`);
  if (sectionStart === -1) return [];
  
  const nextSection = content.indexOf('\n## ', sectionStart + 1);
  const sectionContent = nextSection === -1
    ? content.slice(sectionStart)
    : content.slice(sectionStart, nextSection);
  
  const items: string[] = [];
  let match;
  while ((match = regex.exec(sectionContent)) !== null) {
    items.push(match[1].trim());
  }
  return items;
}

function extractListItems(content: string, section: string): string[] {
  const sectionStart = content.indexOf(`## ${section}`);
  if (sectionStart === -1) return [];
  
  const nextSection = content.indexOf('\n## ', sectionStart + 1);
  const sectionContent = nextSection === -1
    ? content.slice(sectionStart)
    : content.slice(sectionStart, nextSection);
  
  const regex = /^[-*]\s*\*\*(.+?)\*\*/gm;
  const items: string[] = [];
  let match;
  while ((match = regex.exec(sectionContent)) !== null) {
    items.push(match[1].trim());
  }
  return items;
}

function extractDashList(content: string, section: string): string[] {
  const sectionStart = content.indexOf(`## ${section}`);
  if (sectionStart === -1) return [];
  
  const nextSection = content.indexOf('\n## ', sectionStart + 1);
  const sectionContent = nextSection === -1
    ? content.slice(sectionStart)
    : content.slice(sectionStart, nextSection);
  
  const regex = /^[-*]\s*(.+)$/gm;
  const items: string[] = [];
  let match;
  while ((match = regex.exec(sectionContent)) !== null) {
    items.push(match[1].trim());
  }
  return items;
}

function extractWebsiteUrl(content: string): string {
  const match = content.match(/\[https?:\/\/([^\]]+)\]/);
  return match ? `https://${match[1]}` : '';
}

function extractPricing(frontMatter: Record<string, unknown>, content: string): string {
  const pricingMatch = content.match(/\*\*Pricing\*\*:\s*(\w+)/);
  if (pricingMatch) return pricingMatch[1];
  const contentMatch = content.match(/pricing.*?(\bfree\b|\bfreemium\b|\bpaid\b)/i);
  return contentMatch ? contentMatch[1] : 'unknown';
}

/**
 * Parse tool page with fallback to knowledge base
 * Checks markdown first, then falls back to JSON knowledge base
 */
export function parseToolPage(slug: string): Tool | null {
  // First, check markdown file (for rich content)
  const filePath = path.join(DATA_DIR, 'tool_pages', `${slug}.md`);
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);
    
    const features = extractArrayFromMarkdown(content, 'Key Features');
    const pros = extractListItems(content, 'Pros');
    const cons = extractListItems(content, 'Cons');
    const useCases = extractArrayFromMarkdown(content, 'Use Cases');
    const integrations = extractDashList(content, 'Integrations');
    const platforms = extractDashList(content, 'Supported Platforms');
    
    return {
      id: slug,
      slug: slug,
      name: data.title?.split(' - ')[0] || slug,
      title: data.title || '',
      description: data.description || '',
      category: data.category || 'AI Tools',
      content: content,
      pricing: extractPricing(data, content),
      has_free_tier: content.toLowerCase().includes('free tier') || content.includes('freemium'),
      has_api: content.includes('API'),
      platforms,
      features,
      pros,
      cons,
      use_cases: useCases,
      integrations,
      website_url: extractWebsiteUrl(content),
      rating: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  
  // Fallback to knowledge base
  const kbTools = loadKbTools();
  const kbTool = kbTools.find(t => t.slug === slug);
  
  if (kbTool) {
    return kbTool;
  }
  
  return null;
}

/**
 * Get all tool slugs from knowledge base (primary) and markdown (fallback)
 */
export function getAllToolSlugs(): string[] {
  const kbTools = loadKbTools();
  
  // Get slugs from knowledge base
  const kbSlugs = kbTools.map(t => t.slug);
  
  // Also get slugs from markdown files (for backward compatibility)
  const mdDir = path.join(DATA_DIR, 'tool_pages');
  const mdSlugs: string[] = [];
  if (fs.existsSync(mdDir)) {
    mdSlugs.push(...fs.readdirSync(mdDir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', '')));
  }
  
  // Merge and deduplicate
  return Array.from(new Set([...kbSlugs, ...mdSlugs]));
}

/**
 * Get all tools - uses knowledge base as primary source
 */
export function getAllTools(): Tool[] {
  const kbTools = loadKbTools();
  
  // Also get tools from markdown files (for backward compatibility)
  const mdDir = path.join(DATA_DIR, 'tool_pages');
  const mdTools: Tool[] = [];
  
  if (fs.existsSync(mdDir)) {
    const mdSlugs = fs.readdirSync(mdDir)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
    
    mdSlugs.forEach(slug => {
      const tool = parseToolPage(slug);
      if (tool && !kbTools.some(t => t.slug === slug)) {
        mdTools.push(tool);
      }
    });
  }
  
  return [...kbTools, ...mdTools];
}

/**
 * Get tools by category (excludes agent tools)
 */
export function getToolsByCategory(category: string): Tool[] {
  const tools = getAllTools();
  const categorySlug = category.toLowerCase().replace(/-/g, ' ');
  return tools.filter(t => t.category.toLowerCase() === categorySlug);
}

/**
 * Search tools (excludes agent tools by default)
 */
export function searchTools(query: string): Tool[] {
  const tools = getAllTools();
  const lowerQuery = query.toLowerCase();
  
  return tools.filter(tool =>
    tool.name.toLowerCase().includes(lowerQuery) ||
    tool.description.toLowerCase().includes(lowerQuery) ||
    tool.category.toLowerCase().includes(lowerQuery) ||
    tool.features?.some(f => f.toLowerCase().includes(lowerQuery)) ||
    tool.use_cases?.some(u => u.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Parse alternative from markdown file
 */
export function parseAlternative(slug: string): ToolAlternative | null {
  const filePath = path.join(DATA_DIR, 'alternatives', `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { content } = matter(fileContent);
  
  return {
    id: `${slug}-alternatives`,
    tool_slug: slug,
    content,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Parse review from markdown file
 */
export function parseReview(slug: string): ToolReview | null {
  const filePath = path.join(DATA_DIR, 'reviews', `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);
  
  return {
    id: `${slug}-review`,
    tool_slug: slug,
    rating: typeof data.rating === 'number' ? data.rating : 0,
    content,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}