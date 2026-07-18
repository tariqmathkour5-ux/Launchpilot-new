// =====================================================
// SEARCH SYNONYMS & AUTOCOMPLETE ENGINE
// Enhances search with synonyms and intelligent suggestions
// =====================================================

import { Tool } from '@/types';

// Synonym mappings for AI tool search terms
const SYNONYM_MAP: Record<string, string[]> = {
  // Chat & Conversation
  chat: ['conversation', 'messaging', 'dialogue', 'talk', 'chatbot', 'conversational'],
  chatbot: ['chat', 'conversation', 'dialogue', 'bot', 'assistant'],
  conversation: ['chat', 'messaging', 'dialogue', 'talk'],
  
  // Image
  image: ['picture', 'photo', 'visual', 'graphic', 'imagery', 'art'],
  photo: ['image', 'picture', 'photography'],
  art: ['image', 'creative', 'design', 'graphic', 'illustration'],
  
  // Video
  video: ['movie', 'film', 'animation', 'motion', 'video editing'],
  animation: ['motion', 'video', 'animated'],
  
  // Audio
  audio: ['sound', 'music', 'voice', 'speech', 'podcast'],
  music: ['audio', 'sound', 'beat', 'melody'],
  voice: ['speech', 'audio', 'vocal', 'narration'],
  speech: ['voice', 'audio', 'narration', 'spoken'],
  
  // Writing & Content
  writing: ['content', 'copywriting', 'authoring', 'text', 'composition'],
  content: ['writing', 'copy', 'article', 'blog', 'text'],
  copywriting: ['writing', 'content', 'copy', 'marketing'],
  blog: ['article', 'content', 'writing', 'post'],
  article: ['blog', 'content', 'writing', 'post'],
  
  // Code & Development
  coding: ['programming', 'development', 'software', 'engineering', 'code'],
  programming: ['coding', 'development', 'software', 'engineering'],
  developer: ['coder', 'programmer', 'engineering', 'software'],
  code: ['programming', 'coding', 'script', 'snippet'],
  api: ['integration', 'endpoint', 'rest', 'interface'],
  
  // Data & Analytics
  data: ['analytics', 'database', 'dataset', 'information', 'insights'],
  analytics: ['data', 'metrics', 'statistics', 'reporting', 'insights'],
  database: ['data', 'sql', 'nosql', 'storage'],
  
  // Marketing & SEO
  marketing: ['promotion', 'advertising', 'campaign', 'growth'],
  seo: ['search engine optimization', 'ranking', 'traffic', 'visibility'],
  email: ['mail', 'newsletter', 'campaign'],
  
  // Productivity
  productivity: ['efficiency', 'workflow', 'automation', 'organization'],
  automation: ['workflow', 'automation', 'integrations', 'zapier'],
  workflow: ['automation', 'process', 'pipeline'],
  
  // Design
  design: ['ui', 'ux', 'graphic', 'visual', 'creative', 'layout'],
  ui: ['user interface', 'design', 'interface', 'frontend'],
  ux: ['user experience', 'design', 'usability'],
  'ui/ux': ['design', 'interface', 'user experience'],
  
  // Research
  research: ['study', 'analysis', 'investigation', 'academic'],
  academic: ['research', 'scholar', 'paper', 'education'],
  education: ['learning', 'teaching', 'course', 'training'],
  
  // Business
  business: ['enterprise', 'commercial', 'corporate', 'b2b'],
  enterprise: ['business', 'corporate', 'organization'],
  startup: ['venture', 'entrepreneur', 'small business'],
  
  // Categories
  'ai chat': ['chatbot', 'conversation ai', 'chat assistant'],
  'ai image': ['image generation', 'image editing', 'photo ai'],
  'ai video': ['video generation', 'video editing', 'animation ai'],
  'ai audio': ['audio generation', 'music ai', 'speech synthesis'],
  'ai coding': ['code assistant', 'programming ai', 'dev tools'],
  'ai writing': ['content creation', 'writing assistant', 'copywriting'],
  'ai productivity': ['workflow', 'automation', 'efficiency tools'],
  'ai marketing': ['marketing automation', 'seo tools', 'advertising'],
  'ai data': ['data analytics', 'business intelligence', 'data science'],
  'ai research': ['research tools', 'academic ai', 'scientific'],
  'ai automation': ['workflow automation', 'integrations', 'rpa'],
  'ai platform': ['ai development', 'ml platform', 'model deployment'],
  
  // Pricing
  free: ['no cost', 'gratis', '0', 'zero cost', 'complimentary'],
  freemium: ['free tier', 'free plan', 'limited free', 'basic free'],
  paid: ['premium', 'subscription', 'pro', 'enterprise', 'pricing'],
  premium: ['paid', 'pro', 'enterprise', 'advanced'],
  
  // General
  tool: ['software', 'app', 'platform', 'service', 'solution'],
  software: ['tool', 'app', 'platform', 'application'],
  ai: ['artificial intelligence', 'machine learning', 'ml', 'deep learning'],
  'machine learning': ['ai', 'ml', 'deep learning', 'neural network'],
  generate: ['create', 'make', 'produce', 'build'],
  create: ['generate', 'make', 'build', 'design'],
  edit: ['modify', 'change', 'adjust', 'manipulate'],
  transform: ['convert', 'change', 'modify', 'turn into'],
  
  // Specific tasks
  transcription: ['speech to text', 'audio to text', 'transcribe'],
  'text to speech': ['tts', 'speech synthesis', 'voice synthesis'],
  summarization: ['summary', 'summarize', 'condense', 'abstract'],
  translation: ['translate', 'language', 'localization', 'multilingual'],
  detection: ['detect', 'classify', 'recognition', 'identification'],
  recognition: ['detection', 'identify', 'classify'],
};

/**
 * Get synonyms for a query term
 */
export function getSynonyms(term: string): string[] {
  const lower = term.toLowerCase().trim();
  const results = SYNONYM_MAP[lower] || [];
  
  // Also check partial matches (e.g., "chat" matches "ai chat")
  const partialMatches: string[] = [];
  for (const [key, values] of Object.entries(SYNONYM_MAP)) {
    if (key.includes(lower) && key !== lower) {
      partialMatches.push(key, ...values);
    }
  }
  
  return [...new Set([...results, ...partialMatches])];
}

/**
 * Expand a search query with synonyms
 */
export function expandQuery(query: string): string[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const expanded = new Set<string>();
  
  terms.forEach(term => {
    expanded.add(term);
    const synonyms = getSynonyms(term);
    synonyms.forEach(s => expanded.add(s));
  });
  
  return [...expanded];
}

/**
 * Score a tool against an expanded query
 */
function scoreToolAgainstQuery(tool: Tool, expandedTerms: string[]): number {
  let score = 0;
  const searchableFields = [
    tool.name.toLowerCase(),
    tool.description.toLowerCase(),
    tool.category.toLowerCase(),
    ...(tool.features || []).map(f => f.toLowerCase()),
    ...(tool.use_cases || []).map(u => u.toLowerCase()),
    ...(tool.platforms || []).map(p => p.toLowerCase()),
    ...(tool.pros || []).map(p => p.toLowerCase()),
    ...(tool.cons || []).map(c => c.toLowerCase()),
  ];
  
  expandedTerms.forEach(term => {
    searchableFields.forEach(field => {
      if (field.includes(term)) {
        // Name matches score highest
        if (field === tool.name.toLowerCase()) {
          score += 10;
        }
        // Description matches score medium
        else if (field === tool.description.toLowerCase()) {
          score += 5;
        }
        // Feature/use case matches score well
        else if (tool.features?.some(f => f.toLowerCase().includes(term))) {
          score += 3;
        }
        else if (tool.use_cases?.some(u => u.toLowerCase().includes(term))) {
          score += 3;
        }
        // Other field matches
        else {
          score += 1;
        }
      }
    });
  });
  
  return score;
}

/**
 * Enhanced search with synonym expansion and relevance scoring
 */
export function enhancedSearch(
  tools: Tool[],
  query: string,
  options?: { limit?: number; minScore?: number }
): Tool[] {
  const { limit = 60, minScore = 1 } = options || {};
  
  if (!query.trim()) return tools.slice(0, limit);
  
  const expandedTerms = expandQuery(query);
  
  return tools
    .map(tool => ({
      tool,
      score: scoreToolAgainstQuery(tool, expandedTerms),
    }))
    .filter(item => item.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.tool);
}

// =====================================================
// AUTOCOMPLETE ENGINE
// =====================================================

export interface AutocompleteSuggestion {
  text: string;
  type: 'tool' | 'category' | 'feature' | 'keyword';
  slug?: string;
}

// Common search keywords for autocomplete suggestions
const AUTOCOMPLETE_KEYWORDS: string[] = [
  'chat', 'chatbot', 'conversation',
  'image', 'image generation', 'image editing', 'photo',
  'video', 'video generation', 'video editing', 'animation',
  'audio', 'music', 'voice', 'speech', 'transcription',
  'writing', 'content', 'copywriting', 'blog', 'article',
  'coding', 'programming', 'developer', 'code',
  'marketing', 'seo', 'email', 'social media',
  'data', 'analytics', 'database', 'business intelligence',
  'design', 'ui', 'ux', 'graphic design',
  'research', 'academic', 'education',
  'productivity', 'automation', 'workflow',
  'free', 'freemium', 'paid', 'premium',
  'api', 'integration', 'platform',
  'text to speech', 'speech to text', 'translation',
  'summarization', 'detection', 'recognition',
];

/**
 * Get autocomplete suggestions based on partial input
 */
export function getAutocompleteSuggestions(
  tools: Tool[],
  partialQuery: string,
  maxSuggestions: number = 8
): AutocompleteSuggestion[] {
  const query = partialQuery.toLowerCase().trim();
  if (query.length < 2) return [];
  
  const suggestions: AutocompleteSuggestion[] = [];
  const addedTexts = new Set<string>();
  
  // 1. Match tool names
  tools.forEach(tool => {
    if (tool.name.toLowerCase().includes(query) && !addedTexts.has(tool.name)) {
      suggestions.push({ text: tool.name, type: 'tool', slug: tool.slug });
      addedTexts.add(tool.name);
    }
  });
  
  // 2. Match keywords
  AUTOCOMPLETE_KEYWORDS.forEach(keyword => {
    if (keyword.includes(query) && !addedTexts.has(keyword)) {
      suggestions.push({ text: keyword, type: 'keyword' });
      addedTexts.add(keyword);
    }
  });
  
  // 3. Match categories from tools
  const foundCategories = new Set<string>();
  tools.forEach(tool => {
    if (
      tool.category.toLowerCase().includes(query) &&
      !foundCategories.has(tool.category) &&
      !addedTexts.has(tool.category)
    ) {
      suggestions.push({ text: tool.category, type: 'category' });
      addedTexts.add(tool.category);
      foundCategories.add(tool.category);
    }
  });
  
  // 4. Match features
  tools.forEach(tool => {
    (tool.features || []).forEach(feature => {
      if (
        feature.toLowerCase().includes(query) &&
        !addedTexts.has(feature) &&
        suggestions.length < maxSuggestions * 2
      ) {
        suggestions.push({ text: feature, type: 'feature' });
        addedTexts.add(feature);
      }
    });
  });
  
  // Sort: tool names first, then by relevance (shorter matches = more relevant)
  suggestions.sort((a, b) => {
    const typeOrder = { tool: 0, keyword: 1, category: 2, feature: 3 };
    const typeDiff = typeOrder[a.type] - typeOrder[b.type];
    if (typeDiff !== 0) return typeDiff;
    return a.text.length - b.text.length;
  });
  
  return suggestions.slice(0, maxSuggestions);
}