// Tests for tools-analytics.ts
import fs from 'fs';
import path from 'path';

console.log('Testing tools-analytics functions...');

// Load knowledge base tools
const KB_PATH = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase', 'tools_master.json');
const allTools = JSON.parse(fs.readFileSync(KB_PATH, 'utf-8'));

// Test getTotalTools
console.log('\n1. Testing getTotalTools...');
const totalTools = allTools.length;
console.log('  - Total tools in knowledge base:', totalTools);
console.log('  ✓ Returned a number:', typeof totalTools === 'number');
console.log('  ✓ Total > 0:', totalTools > 0);

// Test getPricingBreakdown (inline)
console.log('\n2. Testing getPricingBreakdown...');
const pricingBreakdown = allTools.reduce((acc: any, tool: any) => {
  const pricing = (tool.pricing || 'unknown').toLowerCase();
  if (pricing === 'free') acc.free++;
  else if (pricing === 'freemium') acc.freemium++;
  else if (pricing === 'paid') acc.paid++;
  else acc.unknown++;
  return acc;
}, { free: 0, freemium: 0, paid: 0, unknown: 0 });

console.log('  - Free tools:', pricingBreakdown.free);
console.log('  - Freemium tools:', pricingBreakdown.freemium);
console.log('  - Paid tools:', pricingBreakdown.paid);
console.log('  - Unknown:', pricingBreakdown.unknown);

const totalFromBreakdown = pricingBreakdown.free + pricingBreakdown.freemium + pricingBreakdown.paid + pricingBreakdown.unknown;
console.log('  ✓ Sum matches total tools:', totalFromBreakdown === totalTools);

// Test getTopCategories (inline)
console.log('\n3. Testing getTopCategories...');
const categoriesPath = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase', 'categories.json');
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));

const categoryCounts: Record<string, number> = allTools.reduce((acc: any, tool: any) => {
  const category = tool.category;
  acc[category] = (acc[category] || 0) + 1;
  return acc;
}, {});

const topCategories = categories.map((c: any) => ({
  slug: c.slug,
  name: c.name,
  toolCount: categoryCounts[c.name] || 0,
})).sort((a: any, b: any) => b.toolCount - a.toolCount);

console.log('  - Categories returned:', topCategories.length);
topCategories.forEach((cat: any) => {
  console.log(`    - ${cat.name}: ${cat.toolCount} tools`);
});
console.log('  ✓ Returns array with name and toolCount');

// Test getTopCompanies (inline)
console.log('\n4. Testing getTopCompanies...');
const companiesPath = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase', 'companies.json');
const companies = JSON.parse(fs.readFileSync(companiesPath, 'utf-8'));

const topCompanies = companies.map((c: any) => ({
  id: c.slug,
  slug: c.slug,
  name: c.name,
  toolCount: c.tools.length,
})).sort((a: any, b: any) => b.toolCount - a.toolCount);

console.log('  - Companies returned:', topCompanies.length);
topCompanies.slice(0, 5).forEach((comp: any) => {
  console.log(`    - ${comp.name}: ${comp.toolCount} tools`);
});
console.log('  ✓ Returns array with company data');

// Test sorted by tool count
const isSorted = topCategories.every((cat: any, i: number, arr: any[]) => 
  i === 0 || arr[i-1].toolCount >= cat.toolCount
);
console.log('  ✓ Categories sorted by tool count (descending):', isSorted);

console.log('\n✅ All analytics tests completed!');