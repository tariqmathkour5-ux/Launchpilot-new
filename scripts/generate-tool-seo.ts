// Script to generate internal links report for tools directory
import { getAllTools } from '../src/lib/tools';
import { buildToolInternalLinks } from '../src/lib/tools-internal-links';
import { Tool } from '../src/types';

// Run SEO audit and generate internal links report
function main() {
  const tools = getAllTools();
  console.log(`Found ${tools.length} tools in directory`);

  // Analyze and generate internal link suggestions
  const linkStats = tools.map((tool: Tool) => {
    const allToolsForDeps = tools.filter((t: Tool) => t.slug !== tool.slug);
    const links = buildToolInternalLinks(tool, allToolsForDeps);
    return {
      tool: tool.name,
      slug: tool.slug,
      category: tool.category,
      relatedByCategory: links.relatedByCategory.length,
      relatedByFeatures: links.relatedByFeatures.length,
      relatedByUseCases: links.relatedByUseCases.length,
    };
  });

  // Print summary
  console.log('\n=== Tool Internal Links Summary ===\n');
  linkStats.forEach((stat: { tool: string; slug: string; category: string; relatedByCategory: number; relatedByFeatures: number; relatedByUseCases: number }) => {
    console.log(`${stat.tool} (${stat.slug}):`);
    console.log(`  - Category matches: ${stat.relatedByCategory}`);
    console.log(`  - Feature matches: ${stat.relatedByFeatures}`);
    console.log(`  - Use case matches: ${stat.relatedByUseCases}`);
    console.log('');
  });

  // Identify tools with no related tools
  const isolatedTools = linkStats.filter((s: { relatedByCategory: number; relatedByFeatures: number; relatedByUseCases: number }) => s.relatedByCategory + s.relatedByFeatures + s.relatedByUseCases === 0);
  if (isolatedTools.length > 0) {
    console.log('\n=== Isolated Tools (No Related Links) ===\n');
    isolatedTools.forEach((t: { tool: string; category: string }) => console.log(`- ${t.tool} (${t.category})`));
  }

  console.log('\n✅ SEO Enhancement analysis complete!');
}

main();
