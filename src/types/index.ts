export interface Tool {
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
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface ToolAlternative {
  id: string;
  tool_slug: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ToolReview {
  id: string;
  tool_slug: string;
  rating: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  name: string;
  slug: string;
  description: string;
  tool_count: number;
}

export interface SearchResult {
  tools: Tool[];
  total: number;
  page: number;
  limit: number;
}

export const CATEGORIES: Category[] = [
  { name: 'AI Chat', slug: 'ai-chat', description: 'AI-powered conversational assistants and chatbots', tool_count: 0 },
  { name: 'AI Image', slug: 'ai-image', description: 'AI image generation and manipulation tools', tool_count: 0 },
  { name: 'AI Productivity', slug: 'ai-productivity', description: 'AI tools for productivity and workflow automation', tool_count: 0 },
  { name: 'AI Coding', slug: 'ai-coding', description: 'AI-powered coding assistants and development tools', tool_count: 0 },
  { name: 'AI Writing', slug: 'ai-writing', description: 'AI writing, editing, and content creation tools', tool_count: 0 },
  { name: 'AI Audio', slug: 'ai-audio', description: 'AI audio generation, transcription, and music tools', tool_count: 0 },
  { name: 'AI Video', slug: 'ai-video', description: 'AI video creation and editing tools', tool_count: 0 },
  { name: 'AI Research', slug: 'ai-research', description: 'AI tools for research and academic work', tool_count: 0 },
  { name: 'AI Data', slug: 'ai-data', description: 'AI data analysis and business intelligence tools', tool_count: 0 },
  { name: 'AI Automation', slug: 'ai-automation', description: 'AI workflow automation and integration tools', tool_count: 0 },
  { name: 'AI Marketing', slug: 'ai-marketing', description: 'AI tools for marketing and SEO', tool_count: 0 },
  { name: 'AI Platform', slug: 'ai-platform', description: 'AI platforms and development frameworks', tool_count: 0 },
];
