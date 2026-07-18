// =====================================================
// TOOL INTERNAL LINKING SYSTEM
// Generates internal links between related tools based on
// shared categories, features, and use cases.
// Every link points at a route that actually exists.
// =====================================================

import { Tool } from '@/types';

export interface InternalLink {
  href: string;
  label: string;
}

export interface ToolInternalLinksResult {
  relatedByCategory: InternalLink[];
  relatedByFeatures: InternalLink[];
  relatedByUseCases: InternalLink[];
  alternatives: InternalLink[];
}

/**
 * Calculate similarity score between two tools based on shared attributes.
 * Uses weighted scoring: category (30), features (40), use cases (30).
 */
function calculateSimilarity(toolA: Tool, toolB: Tool): number {
  let score = 0;

  // Category match (highest weight - 30 points)
  if (toolA.category.toLowerCase() === toolB.category.toLowerCase()) {
    score += 30;
  }

  // Shared features (40 points max, scaled by overlap)
  const featuresA = new Set(toolA.features.map(f => f.toLowerCase()));
  const featuresB = new Set(toolB.features.map(f => f.toLowerCase()));
  const sharedFeatures = [...featuresA].filter(f => featuresB.has(f)).length;
  const maxFeatures = Math.max(featuresA.size, featuresB.size, 1);
  score += (sharedFeatures / maxFeatures) * 40;

  // Shared use cases (30 points max, scaled by overlap)
  const useCasesA = new Set(toolA.use_cases.map(u => u.toLowerCase()));
  const useCasesB = new Set(toolB.use_cases.map(u => u.toLowerCase()));
  const sharedUseCases = [...useCasesA].filter(u => useCasesB.has(u)).length;
  const maxUseCases = Math.max(useCasesA.size, useCasesB.size, 1);
  score += (sharedUseCases / maxUseCases) * 30;

  return score;
}

/**
 * Build internal links for a tool page.
 * - Related by category: other tools in same category
 * - Related by features: tools sharing common features
 * - Related by use cases: tools with overlapping use cases
 * - Alternatives: tools from alternatives data (if available)
 */
export function buildToolInternalLinks(
  currentTool: Tool,
  allTools: Tool[],
  alternatives?: Tool[] // Tools extracted from alternatives page
): ToolInternalLinksResult {
  // Get related tools by category (excluding current tool)
  const relatedByCategory: InternalLink[] = allTools
    .filter(tool => 
      tool.slug !== currentTool.slug && 
      tool.category.toLowerCase() === currentTool.category.toLowerCase()
    )
    .slice(0, 4)
    .map(tool => ({
      href: `/tools/${tool.slug}`,
      label: tool.name,
    }));

  // Get related tools by features (excluding current and already listed)
  const toolsByFeatures = allTools
    .filter(tool => tool.slug !== currentTool.slug)
    .sort((a, b) => calculateSimilarity(b, currentTool) - calculateSimilarity(a, currentTool))
    .filter(tool => calculateSimilarity(tool, currentTool) > 30)
    .slice(0, 4);

  const relatedByFeatures: InternalLink[] = toolsByFeatures.map(tool => ({
    href: `/tools/${tool.slug}`,
    label: tool.name,
  }));

  // Get related tools by use cases (excluding current and already listed)
  const alreadyListed = new Set([
    currentTool.slug,
    ...relatedByCategory.map(l => l.href.replace('/tools/', '')),
    ...relatedByFeatures.map(l => l.href.replace('/tools/', '')),
  ]);

  const relatedByUseCases: InternalLink[] = allTools
    .filter(tool => !alreadyListed.has(tool.slug))
    .filter(tool => {
      const useCasesA = new Set(currentTool.use_cases.map(u => u.toLowerCase()));
      const useCasesB = new Set(tool.use_cases.map(u => u.toLowerCase()));
      return [...useCasesA].some(u => useCasesB.has(u));
    })
    .slice(0, 3)
    .map(tool => ({
      href: `/tools/${tool.slug}`,
      label: tool.name,
    }));

  // Map alternatives if provided
  const alternativesLinks: InternalLink[] = (alternatives || [])
    .slice(0, 3)
    .map(tool => ({
      href: `/tools/${tool.slug}`,
      label: tool.name,
    }));

  return {
    relatedByCategory,
    relatedByFeatures,
    relatedByUseCases,
    alternatives: alternativesLinks,
  };
}

/**
 * Inject internal links into tool content body.
 * Finds section headers and inserts related tool links after them.
 */
export function injectInternalLinksToContent(
  content: string,
  links: ToolInternalLinksResult
): string {
  let modifiedContent = content;

  // Inject related tools after "## Related Tools" section if it exists
  const relatedSection = '## Related Tools';
  if (modifiedContent.includes(relatedSection)) {
    const allRelatedLinks = [
      ...links.relatedByCategory,
      ...links.relatedByFeatures,
    ].slice(0, 6);

    if (allRelatedLinks.length > 0) {
      const linksText = allRelatedLinks
        .map(link => `- [**${link.label}**](/tools/${link.href.replace('/tools/', '')}) - Related tool in the same category`)
        .join('\n');

      const insertPoint = modifiedContent.indexOf(relatedSection);
      const sectionEnd = modifiedContent.indexOf('\n## ', insertPoint + 1);
      
      if (sectionEnd === -1) {
        // Section is at the end, append after the header
        modifiedContent = modifiedContent.replace(
          relatedSection,
          `${relatedSection}\n\n${linksText}`
        );
      } else {
        // Insert before the next section
        modifiedContent = modifiedContent.slice(0, sectionEnd) + 
          `\n${linksText}\n` + 
          modifiedContent.slice(sectionEnd);
      }
    }
  }

  // Inject alternatives after "## Alternatives" or before Related Tools
  const altSection = '## Alternatives';
  if (links.alternatives.length > 0) {
    const altLinksText = links.alternatives
      .map(link => `- [**${link.label}**](/tools/${link.href.replace('/tools/', '')}) - Alternative option to consider`)
      .join('\n');

    if (modifiedContent.includes(altSection)) {
      const insertPoint = modifiedContent.indexOf(altSection);
      const sectionEnd = modifiedContent.indexOf('\n## ', insertPoint + 1);
      
      if (sectionEnd === -1) {
        modifiedContent = modifiedContent.replace(
          altSection,
          `${altSection}\n\n${altLinksText}`
        );
      } else {
        modifiedContent = modifiedContent.slice(0, sectionEnd) + 
          `\n${altLinksText}\n` + 
          modifiedContent.slice(insertPoint, sectionEnd) +
          modifiedContent.slice(sectionEnd);
      }
    }
  }

  // Inject use-case related tools after "## Related Categories" or at end
  if (links.relatedByUseCases.length > 0) {
    const useCaseLinksText = links.relatedByUseCases
      .map(link => `- [**${link.label}**](/tools/${link.href.replace('/tools/', '')}) - Useful for similar use cases`)
      .join('\n');

    // Check for use cases section to add contextual links
    const relatedCategoriesSection = '## Related Categories';
    
    if (modifiedContent.includes(relatedCategoriesSection)) {
      const rcInsertPoint = modifiedContent.indexOf(relatedCategoriesSection);
      modifiedContent = modifiedContent.slice(0, rcInsertPoint) + 
        `## Related Tools by Use Case\n\n${useCaseLinksText}\n\n\n` + 
        modifiedContent.slice(rcInsertPoint);
    }
  }

  return modifiedContent;
}