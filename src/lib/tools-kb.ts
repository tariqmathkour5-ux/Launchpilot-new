// =====================================================
// TOOLS LIBRARY UTILITIES FOR KNOWLEDGE BASE
// Parses tools_master.json for filtering and search
// Supports large datasets (28,000+ tools) with optimization
// =====================================================

import fs from 'fs';
import path from 'path';
import { Tool } from '@/types';

const KB_PATH = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase', 'tools_master.json');

// Agent-related categories to exclude from main tool directory
const AGENT_CATEGORIES = ['ai-agents', 'ai agents', 'Ai Agents'];
const AGENT_KEYWORDS = ['agent', 'autonomous agent', 'ai agent', 'agentic'];

// Default tools for fallback (from src/data)
let kbToolsCache: Tool[] | null = null;
let filteredToolsCache: Tool[] | null = null;

/**
 * Load all tools from the knowledge base JSON file
 * Uses caching to avoid repeated file reads
 */
function loadKbTools(): Tool[] {
  if (kbToolsCache) return kbToolsCache;
  
  try {
    if (fs.existsSync(KB_PATH)) {
      const content = fs.readFileSync(KB_PATH, 'utf-8');
      const kbTools = JSON.parse(content) as Tool[];
      kbToolsCache = kbTools;
      return kbTools;
    }
  } catch (error) {
    console.error('Failed to load knowledge base tools:', error);
  }
  
  return [];
}

/**
 * Get AI Tools only (excluding Agent System tools)
 * Agent tools are kept separate and hidden from the main tool directory
 */
function getAiToolsOnly(): Tool[] {
  if (filteredToolsCache) return filteredToolsCache;
  
  const allTools = loadKbTools();
  
  // Filter out agent-related tools - they belong to the Agent System, not the main AI tools directory
  filteredToolsCache = allTools.filter(tool => {
    // Exclude by category
    if (AGENT_CATEGORIES.includes(tool.category.toLowerCase())) {
      return false;
    }
    
    // Exclude by name/description containing agent keywords
    const combined = (tool.name + ' ' + tool.description).toLowerCase();
    for (const keyword of AGENT_KEYWORDS) {
      if (combined.includes(keyword)) {
        return false;
      }
    }
    
    return true;
  });
  
  return filteredToolsCache;
}

/**
 * Clear the cache (useful for testing or when data changes)
 */
export function clearKbCache(): void {
  kbToolsCache = null;
  filteredToolsCache = null;
}

// Get all platforms available in the knowledge base
export function getAllPlatforms(): string[] {
  const tools = getAiToolsOnly();
  const platforms = new Set<string>();
  tools.forEach(tool => {
    tool.platforms?.forEach(p => platforms.add(p));
  });
  return Array.from(platforms).sort();
}

// Get all pricing options available in the knowledge base
export function getAllPricingOptions(): string[] {
  const tools = getAiToolsOnly();
  const pricing = new Set<string>();
  tools.forEach(tool => {
    if (tool.pricing) pricing.add(tool.pricing);
  });
  return Array.from(pricing).sort();
}

// Get all categories available in the knowledge base (excluding agent categories)
export function getAllCategories(): string[] {
  const tools = getAiToolsOnly();
  const categories = Array.from(new Set(tools.map(t => t.category))).sort();
  
  // Filter out agent-related categories
  return categories.filter(cat => !AGENT_CATEGORIES.includes(cat.toLowerCase()));
}

// Search tools with advanced filters
export interface ToolSearchFilters {
  query?: string;
  category?: string;
  pricing?: string;
  platform?: string;
  hasApi?: boolean;
  limit?: number;
  offset?: number;
  excludeAgents?: boolean; // New flag to exclude agent tools (default: true)
}

export interface ToolSearchResult {
  tools: Tool[];
  total: number;
  filters: {
    categories: string[];
    platforms: string[];
    pricingOptions: string[];
  };
}

export function searchToolsKb(filters: ToolSearchFilters): ToolSearchResult {
  // Use AI tools only by default (excluding agents)
  const excludeAgents = filters.excludeAgents !== false;
  let tools = excludeAgents ? getAiToolsOnly() : loadKbTools();
  
  // Apply filters
  if (filters.query) {
    const query = filters.query.toLowerCase();
    tools = tools.filter(tool =>
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.features?.some(f => f.toLowerCase().includes(query)) ||
      tool.use_cases?.some(u => u.toLowerCase().includes(query))
    );
  }
  
  if (filters.category) {
    tools = tools.filter(tool => 
      tool.category.toLowerCase() === filters.category?.toLowerCase()
    );
  }
  
  if (filters.pricing) {
    tools = tools.filter(tool => 
      tool.pricing.toLowerCase() === filters.pricing?.toLowerCase()
    );
  }
  
  if (filters.platform) {
    tools = tools.filter(tool => 
      tool.platforms?.some(p => p.toLowerCase() === filters.platform?.toLowerCase())
    );
  }
  
  if (filters.hasApi === true) {
    tools = tools.filter(tool => tool.has_api === true);
  }
  
  // Apply pagination
  const total = tools.length;
  const offset = filters.offset || 0;
  const limit = filters.limit || total;
  
  // For large datasets, use pagination to avoid memory issues
  tools = tools.slice(offset, offset + limit);
  
  // Get available filter options from the full dataset (before pagination)
  // Use the same exclusion rules for consistency
  const allTools = excludeAgents ? getAiToolsOnly() : loadKbTools();
  const categories = Array.from(new Set(allTools.map(t => t.category))).sort();
  const platforms = Array.from(new Set(allTools.flatMap(t => t.platforms || []))).sort();
  const pricingOptions = Array.from(new Set(allTools.map(t => t.pricing))).sort();
  
  return {
    tools,
    total,
    filters: {
      categories,
      platforms,
      pricingOptions,
    },
  };
}

// Get a tool by slug from knowledge base (excludes agent tools)
export function getToolBySlugKb(slug: string, includeAgents: boolean = false): Tool | undefined {
  const tools = includeAgents ? loadKbTools() : getAiToolsOnly();
  return tools.find(t => t.slug === slug);
}

// Get tools for comparison (excludes agent tools by default)
export function getToolsForComparison(includeAgents: boolean = false): Array<{ id: string; name: string; slug: string }> {
  const tools = includeAgents ? loadKbTools() : getAiToolsOnly();
  return tools.map(tool => ({
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
  }));
}

// Get total count of tools (for display purposes)
export function getToolsCount(): { total: number; aiTools: number; agentTools: number } {
  const allTools = loadKbTools();
  const aiTools = getAiToolsOnly();
  
  return {
    total: allTools.length,
    aiTools: aiTools.length,
    agentTools: allTools.length - aiTools.length,
  };
}