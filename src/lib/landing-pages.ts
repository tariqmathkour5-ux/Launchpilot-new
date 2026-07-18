import type { Tool } from '@/types';

export interface LandingPageConfig {
  categories?: string[];
  tags?: string[];
  pricing?: string[];
  has_api?: boolean;
  has_free_tier?: boolean;
  sort?: 'rating' | 'name' | 'newest';
  limit?: number;
}

export const USE_CASES = [
  { slug: 'content-creation', name: 'Content Creation', description: 'AI tools for writing, blogging, and creative content generation', keywords: ['content', 'writing', 'blog', 'copywriting', 'text', 'article'] },
  { slug: 'image-generation', name: 'Image Generation', description: 'Create stunning images, illustrations, and artwork with AI', keywords: ['image', 'photo', 'art', 'design', 'visual', 'illustration'] },
  { slug: 'code-development', name: 'Code Development', description: 'AI coding assistants, code generators, and development tools', keywords: ['code', 'coding', 'developer', 'programming', 'software', 'engineering'] },
  { slug: 'customer-support', name: 'Customer Support', description: 'AI chatbots and tools for automating customer service', keywords: ['customer', 'support', 'chatbot', 'service', 'helpdesk', 'chat'] },
  { slug: 'data-analysis', name: 'Data Analysis', description: 'AI-powered data analytics, reporting, and business intelligence', keywords: ['data', 'analytics', 'analysis', 'reporting', 'insight', 'business intelligence'] },
  { slug: 'marketing-automation', name: 'Marketing Automation', description: 'Automate marketing campaigns, emails, and ad management with AI', keywords: ['marketing', 'ads', 'campaign', 'email', 'automation', 'seo'] },
  { slug: 'video-creation', name: 'Video Creation', description: 'AI tools for video editing, generation, and production', keywords: ['video', 'editing', 'production', 'animation', 'reels', 'youtube'] },
  { slug: 'productivity', name: 'Productivity', description: 'Boost your workflow and automate repetitive tasks with AI', keywords: ['productivity', 'workflow', 'task', 'automation', 'efficiency', 'management'] },
  { slug: 'research', name: 'Research & Summarization', description: 'AI tools for research, document summarization, and knowledge management', keywords: ['research', 'summary', 'summarize', 'notes', 'document', 'knowledge'] },
  { slug: 'translation', name: 'Translation & Language', description: 'AI translation, localization, and multilingual content tools', keywords: ['translation', 'language', 'multilingual', 'localize', 'transcribe', 'subtitle'] },
];

export function filterToolsForLandingPage(tools: Tool[], config: LandingPageConfig): Tool[] {
  let filtered = [...tools];

  if (config.categories?.length) {
    filtered = filtered.filter(t => config.categories!.includes(t.category));
  }
  if (config.tags?.length) {
    filtered = filtered.filter(t =>
      config.tags!.some(tag => t.features?.some(f => f.toLowerCase().includes(tag.toLowerCase())))
    );
  }
  if (config.pricing?.length) {
    filtered = filtered.filter(t => config.pricing!.includes(t.pricing));
  }
  if (config.has_api) {
    filtered = filtered.filter(t => t.has_api);
  }
  if (config.has_free_tier) {
    filtered = filtered.filter(t => t.has_free_tier);
  }

  filtered = sortTools(filtered, config.sort);

  if (config.limit) {
    filtered = filtered.slice(0, config.limit);
  }

  return filtered;
}

export function sortTools(tools: Tool[], sort?: 'rating' | 'name' | 'newest'): Tool[] {
  switch (sort) {
    case 'rating':
      return [...tools].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case 'name':
      return [...tools].sort((a, b) => a.name.localeCompare(b.name));
    case 'newest':
      return [...tools].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    default:
      return [...tools].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }
}

export function getRelatedTools(tools: Tool[], current: Tool, limit = 6): Tool[] {
  return tools
    .filter(t => t.slug !== current.slug && t.category === current.category)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit);
}

export function getToolsForComparison(tools: Tool[], tool: Tool, limit = 4): Tool[] {
  return getRelatedTools(tools, tool, limit);
}

const PRICING_LABELS: Record<string, string> = {
  free: 'Free',
  freemium: 'Freemium',
  paid: 'Paid',
  subscription: 'Subscription',
  one_time: 'One-time',
  enterprise: 'Enterprise',
  contact: 'Contact Sales',
  open_source: 'Open Source',
};

const PRICING_COLORS: Record<string, string> = {
  free: 'bg-green-100 text-green-700',
  freemium: 'bg-blue-100 text-blue-700',
  paid: 'bg-amber-100 text-amber-700',
  subscription: 'bg-primary-100 text-primary-700',
  one_time: 'bg-secondary-100 text-secondary-600',
  enterprise: 'bg-secondary-900 text-white',
  contact: 'bg-secondary-100 text-secondary-600',
  open_source: 'bg-emerald-100 text-emerald-700',
};

export function getPricingLabel(pricing: string): string {
  return PRICING_LABELS[pricing?.toLowerCase()] || pricing || 'Unknown';
}

export function getPricingColor(pricing: string): string {
  return PRICING_COLORS[pricing?.toLowerCase()] || 'bg-secondary-100 text-secondary-600';
}
