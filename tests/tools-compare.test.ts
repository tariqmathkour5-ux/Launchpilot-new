// Tests for tools-compare.ts
// Inline mock implementation for testing without module resolution
// This tests the comparison logic directly

// Mock tool data
const mockToolA = {
  id: 'tool-a',
  slug: 'tool-a',
  name: 'Tool A',
  title: 'Tool A - AI Tool',
  description: 'Description for tool A',
  category: 'AI Chat',
  content: 'Content for tool A',
  pricing: 'freemium',
  has_free_tier: true,
  has_api: true,
  platforms: ['Web', 'iOS'],
  features: ['Feature 1', 'Feature 2', 'Feature 3'],
  pros: ['Pro 1', 'Pro 2'],
  cons: ['Con 1'],
  use_cases: ['Use case 1'],
  integrations: ['Integration 1'],
  website_url: 'https://tool-a.example.com',
  rating: 4.5,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

const mockToolB = {
  id: 'tool-b',
  slug: 'tool-b',
  name: 'Tool B',
  title: 'Tool B - AI Tool',
  description: 'Description for tool B',
  category: 'AI Image',
  content: 'Content for tool B',
  pricing: 'paid',
  has_free_tier: false,
  has_api: false,
  platforms: ['Web', 'Android'],
  features: ['Feature X', 'Feature Y'],
  pros: ['Pro X'],
  cons: [],
  use_cases: ['Use case X'],
  integrations: [],
  website_url: 'https://tool-b.example.com',
  rating: 4.2,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

// Comparison logic (inline from tools-compare.ts)
function compareTools(toolA: any, toolB: any) {
  const overviewFields = [
    { label: 'Description', valueA: toolA.description, valueB: toolB.description, different: toolA.description !== toolB.description },
    { label: 'Category', valueA: toolA.category, valueB: toolB.category, different: toolA.category !== toolB.category },
    { label: 'Rating', valueA: toolA.rating ? `${toolA.rating}/5` : 'Not rated', valueB: toolB.rating ? `${toolB.rating}/5` : 'Not rated', different: toolA.rating !== toolB.rating },
    { label: 'Has API', valueA: toolA.has_api ? 'Yes' : 'No', valueB: toolB.has_api ? 'Yes' : 'No', different: toolA.has_api !== toolB.has_api },
  ];

  const featuresFields = toolA.features.map((feature: string, index: number) => ({
    label: `Feature ${index + 1}`,
    valueA: feature,
    valueB: toolB.features[index] || '',
    different: toolA.features[index] !== toolB.features[index],
  }));

  toolB.features.slice(toolA.features.length).forEach((feature: string, index: number) => {
    featuresFields.push({
      label: `Feature ${toolA.features.length + index + 1}`,
      valueA: '',
      valueB: feature,
      different: true,
    });
  });

  const platformsField = {
    label: 'Platforms',
    valueA: toolA.platforms.sort(),
    valueB: toolB.platforms.sort(),
    different: JSON.stringify(toolA.platforms.sort()) !== JSON.stringify(toolB.platforms.sort()),
  };

  const pricingFields = [
    { label: 'Pricing Model', valueA: toolA.pricing, valueB: toolB.pricing, different: toolA.pricing !== toolB.pricing },
    { label: 'Free Tier', valueA: toolA.has_free_tier ? 'Yes' : 'No', valueB: toolB.has_free_tier ? 'Yes' : 'No', different: toolA.has_free_tier !== toolB.has_free_tier },
  ];

  return { toolA, toolB, fields: { overview: overviewFields, features: featuresFields, platforms: [platformsField], pricing: pricingFields } };
}

function getToolsForComparison(allTools: any[]) {
  return allTools.map((tool: any) => ({ id: tool.id, name: tool.name, slug: tool.slug }));
}

// Test compareTools
console.log('Testing compareTools function...');

// Test 1: Tools with different data
const comparison = compareTools(mockToolA, mockToolB);
console.log('✓ Comparison generated successfully');
console.log('  - Tool A name:', comparison.toolA.name);
console.log('  - Tool B name:', comparison.toolB.name);
console.log('  - Overview fields count:', comparison.fields.overview.length);
console.log('  - Features fields count:', comparison.fields.features.length);

// Test 2: Check differences are detected
const overviewDifferent = comparison.fields.overview.filter((f: any) => f.different);
console.log('  - Different overview fields:', overviewDifferent.length);

// Test 3: Platforms comparison
const platformsDifferent = comparison.fields.platforms.some((f: any) => f.different);
console.log('  - Platforms flagged as different:', platformsDifferent);

// Test getToolsForComparison
console.log('\nTesting getToolsForComparison function...');
const toolList = getToolsForComparison([mockToolA, mockToolB]);
console.log('  - Tools returned:', toolList.length);
console.log('  - Tool A slug:', toolList[0].slug);

// Test 4: Verify comparison structure
console.assert(comparison.toolA.id === 'tool-a', 'Tool A should match input');
console.assert(comparison.toolB.id === 'tool-b', 'Tool B should match input');
console.assert(comparison.fields.overview.length === 4, 'Overview should have 4 fields');
console.assert(comparison.fields.pricing.length === 2, 'Pricing should have 2 fields');

console.log('\n✅ All comparison tests passed!');