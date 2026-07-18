// =====================================================
// TOOL COMPARISON UTILITIES
// Provides comparison data between two tools
// =====================================================

import { Tool } from '@/types';

export interface ComparisonField {
  label: string;
  valueA: string | string[] | boolean | null;
  valueB: string | string[] | boolean | null;
  different: boolean;
}

export interface ToolComparison {
  toolA: Tool;
  toolB: Tool;
  fields: {
    overview: ComparisonField[];
    features: ComparisonField[];
    platforms: ComparisonField[];
    pricing: ComparisonField[];
  };
}

/**
 * Compares two tools and returns structured comparison data
 */
export function compareTools(toolA: Tool, toolB: Tool): ToolComparison {
  const overviewFields: ComparisonField[] = [
    {
      label: 'Description',
      valueA: toolA.description,
      valueB: toolB.description,
      different: toolA.description !== toolB.description,
    },
    {
      label: 'Category',
      valueA: toolA.category,
      valueB: toolB.category,
      different: toolA.category !== toolB.category,
    },
    {
      label: 'Rating',
      valueA: toolA.rating ? `${toolA.rating}/5` : 'Not rated',
      valueB: toolB.rating ? `${toolB.rating}/5` : 'Not rated',
      different: toolA.rating !== toolB.rating,
    },
    {
      label: 'Has API',
      valueA: toolA.has_api ? 'Yes' : 'No',
      valueB: toolB.has_api ? 'Yes' : 'No',
      different: toolA.has_api !== toolB.has_api,
    },
  ];

  const featuresFields: ComparisonField[] = toolA.features.map((feature, index) => ({
    label: `Feature ${index + 1}`,
    valueA: feature,
    valueB: toolB.features[index] || '',
    different: toolA.features[index] !== toolB.features[index],
  }));

  // Add any extra features from toolB
  toolB.features.slice(toolA.features.length).forEach((feature, index) => {
    featuresFields.push({
      label: `Feature ${toolA.features.length + index + 1}`,
      valueA: '',
      valueB: feature,
      different: true,
    });
  });

  const platformsField: ComparisonField = {
    label: 'Platforms',
    valueA: toolA.platforms.sort(),
    valueB: toolB.platforms.sort(),
    different: JSON.stringify(toolA.platforms.sort()) !== JSON.stringify(toolB.platforms.sort()),
  };

  const pricingFields: ComparisonField[] = [
    {
      label: 'Pricing Model',
      valueA: toolA.pricing,
      valueB: toolB.pricing,
      different: toolA.pricing !== toolB.pricing,
    },
    {
      label: 'Free Tier',
      valueA: toolA.has_free_tier ? 'Yes' : 'No',
      valueB: toolB.has_free_tier ? 'Yes' : 'No',
      different: toolA.has_free_tier !== toolB.has_free_tier,
    },
  ];

  return {
    toolA,
    toolB,
    fields: {
      overview: overviewFields,
      features: featuresFields,
      platforms: [platformsField],
      pricing: pricingFields,
    },
  };
}

/**
 * Gets a simple list of tools for the comparison selector
 */
export function getToolsForComparison(allTools: Tool[]): Array<{ id: string; name: string; slug: string }> {
  return allTools.map(tool => ({
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
  }));
}