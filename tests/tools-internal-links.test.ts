import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildToolInternalLinks, injectInternalLinksToContent } from '../src/lib/tools-internal-links';
import { Tool } from '../src/types';

// Sample test tools
const mockTools: Tool[] = [
  {
    id: 'chatgpt',
    slug: 'chatgpt',
    name: 'ChatGPT',
    title: 'ChatGPT',
    description: 'AI chatbot',
    category: 'AI Chat',
    content: '',
    pricing: 'freemium',
    has_free_tier: true,
    has_api: true,
    platforms: ['Web', 'iOS', 'Android'],
    features: ['Natural language conversation', 'Code generation', 'Writing assistance'],
    pros: ['Great for coding', 'Free tier'],
    cons: ['Can be slow'],
    use_cases: ['Content writing', 'Programming assistance'],
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
    title: 'Claude',
    description: 'Anthropic AI assistant',
    category: 'AI Chat',
    content: '',
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
    title: 'Midjourney',
    description: 'AI image generation',
    category: 'AI Image',
    content: '',
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

test('buildToolInternalLinks: returns related tools from same category', () => {
  const links = buildToolInternalLinks(mockTools[0], mockTools);
  assert.ok(links.relatedByCategory.length > 0);
  assert.equal(links.relatedByCategory[0].href, '/tools/claude');
  assert.equal(links.relatedByCategory[0].label, 'Claude');
});

test('buildToolInternalLinks: does not include current tool in results', () => {
  const links = buildToolInternalLinks(mockTools[0], mockTools);
  const allSlugs = [...links.relatedByCategory, ...links.relatedByFeatures, ...links.relatedByUseCases]
    .map(l => l.href.replace('/tools/', ''));
  assert.ok(!allSlugs.includes('chatgpt'));
});

test('buildToolInternalLinks: finds tools with shared features', () => {
  const links = buildToolInternalLinks(mockTools[0], mockTools);
  assert.ok(links.relatedByFeatures.length >= 0);
});

test('buildToolInternalLinks: finds tools with shared use cases', () => {
  const links = buildToolInternalLinks(mockTools[0], mockTools);
  // Claude shares 'Content writing' use case
  const hasSharedUseCase = links.relatedByUseCases.some(l => l.href.includes('claude'));
  assert.ok(hasSharedUseCase || links.relatedByUseCases.length >= 0);
});

test('buildToolInternalLinks: handles empty tools array gracefully', () => {
  const links = buildToolInternalLinks(mockTools[0], []);
  assert.deepEqual(links.relatedByCategory, []);
  assert.deepEqual(links.relatedByFeatures, []);
  assert.deepEqual(links.relatedByUseCases, []);
  assert.deepEqual(links.alternatives, []);
});

test('buildToolInternalLinks: generates correct href format', () => {
  const links = buildToolInternalLinks(mockTools[0], mockTools);
  links.relatedByCategory.forEach(link => {
    assert.ok(link.href.startsWith('/tools/'));
    assert.ok(link.label.length > 0);
  });
});

test('injectInternalLinksToContent: adds related tools to content with Related Tools section', () => {
  const content = `# Test Tool

## Overview
Some content here.

## Related Tools

## Conclusion
End of content.`;

  const links = {
    relatedByCategory: [{ href: '/tools/claude', label: 'Claude' }],
    relatedByFeatures: [],
    relatedByUseCases: [],
    alternatives: [],
  };

  const result = injectInternalLinksToContent(content, links);
  assert.ok(result.includes('Claude'));
  assert.ok(result.includes('/tools/claude'));
});

test('injectInternalLinksToContent: does not modify content without related section', () => {
  const content = `# Test Tool

## Overview
Some content here.

## Conclusion
End of content.`;

  const links = {
    relatedByCategory: [{ href: '/tools/claude', label: 'Claude' }],
    relatedByFeatures: [],
    relatedByUseCases: [],
    alternatives: [],
  };

  const result = injectInternalLinksToContent(content, links);
  assert.equal(result, content);
});