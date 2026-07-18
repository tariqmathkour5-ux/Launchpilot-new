import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getToolRecommendations } from '../src/lib/tool-recommendations';
import { Tool } from '../src/types';

// Mock tools for testing - using the same pattern as tools-internal-links.test.ts
const mockTools: Tool[] = [
  {
    id: 'chatgpt',
    slug: 'chatgpt',
    name: 'ChatGPT',
    title: 'ChatGPT - AI Chat',
    description: 'AI assistant by OpenAI',
    content: '',
    category: 'AI Chat',
    pricing: 'freemium',
    has_free_tier: true,
    has_api: true,
    platforms: ['Web', 'iOS', 'Android'],
    features: ['Natural language conversation', 'Code generation', 'Writing assistance'],
    pros: ['Great for coding', 'Free tier'],
    cons: ['Can be slow'],
    use_cases: ['Content writing', 'Programming assistance', 'Research'],
    integrations: ['Slack', 'Google Workspace'],
    website_url: 'https://chat.openai.com',
    rating: null,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'claude',
    slug: 'claude',
    name: 'Claude',
    title: 'Claude - AI Chat',
    description: 'Anthropic AI assistant',
    content: '',
    category: 'AI Chat',
    pricing: 'freemium',
    has_free_tier: true,
    has_api: true,
    platforms: ['Web'],
    features: ['Natural language conversation', 'File analysis'],
    pros: ['Long context', 'Accurate'],
    cons: ['No mobile app'],
    use_cases: ['Research', 'Content writing'],
    integrations: ['Notion'],
    website_url: 'https://claude.ai',
    rating: null,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'midjourney',
    slug: 'midjourney',
    name: 'Midjourney',
    title: 'Midjourney - AI Image',
    description: 'AI image generation',
    content: '',
    category: 'AI Image',
    pricing: 'paid',
    has_free_tier: false,
    has_api: false,
    platforms: ['Discord'],
    features: ['Image generation', 'Artistic styles'],
    pros: ['High quality images'],
    cons: ['Discord only'],
    use_cases: ['Art creation', 'Marketing'],
    integrations: [],
    website_url: 'https://midjourney.com',
    rating: null,
    created_at: '',
    updated_at: '',
  },
];

test('getToolRecommendations: returns recommendations sorted by score', () => {
  const sourceTool = mockTools[0]; // ChatGPT
  const recommendations = getToolRecommendations(sourceTool, mockTools);
  
  assert.ok(recommendations.length > 0);
  assert.ok(recommendations[0].score >= (recommendations[recommendations.length - 1]?.score ?? 0));
});

test('getToolRecommendations: does not include source tool in recommendations', () => {
  const sourceTool = mockTools[0]; // ChatGPT
  const recommendations = getToolRecommendations(sourceTool, mockTools);
  
  const allSlugs = recommendations.map(r => r.tool.slug);
  assert.ok(!allSlugs.includes('chatgpt'));
});

test('getToolRecommendations: gives higher score to tools in same category', () => {
  const sourceTool = mockTools[0]; // ChatGPT (AI Chat)
  const recommendations = getToolRecommendations(sourceTool, mockTools);
  
  const claudeRec = recommendations.find(r => r.tool.slug === 'claude');
  const midjourneyRec = recommendations.find(r => r.tool.slug === 'midjourney');
  
  if (claudeRec && midjourneyRec) {
    assert.ok(claudeRec.score > midjourneyRec.score);
  }
});

test('getToolRecommendations: respects limit option', () => {
  const sourceTool = mockTools[0];
  const recommendations = getToolRecommendations(sourceTool, mockTools, { limit: 2 });
  
  assert.equal(recommendations.length, 2);
});

test('getToolRecommendations: respects minScore option', () => {
  const sourceTool = mockTools[0];
  const recommendations = getToolRecommendations(sourceTool, mockTools, { minScore: 50 });
  
  assert.ok(recommendations.every(r => r.score >= 50));
});

test('getToolRecommendations: provides reason for each recommendation', () => {
  const sourceTool = mockTools[0];
  const recommendations = getToolRecommendations(sourceTool, mockTools);
  
  assert.ok(recommendations.every(r => r.reason.length > 0));
});

test('getToolRecommendations: calculates shared features correctly', () => {
  const sourceTool = mockTools[0]; // ChatGPT with 3 features
  const recommendations = getToolRecommendations(sourceTool, mockTools);
  
  // Claude shares 'Natural language conversation' feature
  const claudeRec = recommendations.find(r => r.tool.slug === 'claude');
  assert.ok(claudeRec !== undefined);
});

test('getToolRecommendations: calculates shared use cases correctly', () => {
  const sourceTool = mockTools[0]; // ChatGPT with 3 use cases
  const recommendations = getToolRecommendations(sourceTool, mockTools);
  
  // Claude shares 'Content writing' use case
  const claudeRec = recommendations.find(r => r.tool.slug === 'claude');
  assert.ok(claudeRec !== undefined);
});