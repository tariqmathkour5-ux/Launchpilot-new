// =====================================================
// RELATED TOOLS RECOMMENDATION ENGINE
// Enhanced recommendation system with multi-factor scoring
// =====================================================

import { Tool } from '@/types';

export interface RelatedToolResult {
  tool: Tool;
  score: number;
  matchReasons: string[];
}

interface RelatedToolsOptions {
  limit?: number;
  minScore?: number;
  includeSameCategory?: boolean;
  includeSameFeatures?: boolean;
  includeSameUseCases?: boolean;
  includeSamePlatforms?: boolean;
  includeSamePricing?: boolean;
}

const DEFAULT_OPTIONS: Required<RelatedToolsOptions> = {
  limit: 6,
  minScore: 10,
  includeSameCategory: true,
  includeSameFeatures: true,
  includeSameUseCases: true,
  includeSamePlatforms: true,
  includeSamePricing: true,
};

/**
 * Calculate Jaccard similarity between two sets
 */
function jaccardSimilarity<T>(setA: Set<T>, setB: Set<T>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

/**
 * Calculate TF-IDF-like feature importance score
 * Rare features get higher weight
 */
function calculateFeatureWeight(feature: string, allTools: Tool[]): number {
  const toolsWithFeature = allTools.filter(t =>
    t.features?.some(f => f.toLowerCase() === feature.toLowerCase())
  ).length;
  return Math.log((allTools.length + 1) / (toolsWithFeature + 1)) + 1;
}

/**
 * Get enhanced related tool recommendations
 */
export function getRelatedTools(
  sourceTool: Tool,
  allTools: Tool[],
  options: RelatedToolsOptions = {}
): RelatedToolResult[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Pre-compute feature weights for rare feature bonus
  const featureWeights = new Map<string, number>();
  if (opts.includeSameFeatures && sourceTool.features) {
    sourceTool.features.forEach(f => {
      featureWeights.set(f.toLowerCase(), calculateFeatureWeight(f, allTools));
    });
  }

  const results: RelatedToolResult[] = [];

  allTools.forEach(targetTool => {
    if (targetTool.slug === sourceTool.slug) return;

    let score = 0;
    const matchReasons: string[] = [];

    // 1. Category match (highest weight)
    if (opts.includeSameCategory) {
      if (sourceTool.category.toLowerCase() === targetTool.category.toLowerCase()) {
        score += 35;
        matchReasons.push(`Same category: ${sourceTool.category}`);
      }
    }

    // 2. Feature overlap with TF-IDF weighting
    if (opts.includeSameFeatures && sourceTool.features && targetTool.features) {
      const sourceFeatures = new Set(sourceTool.features.map(f => f.toLowerCase()));
      const targetFeatures = new Set(targetTool.features.map(f => f.toLowerCase()));
      
      const sharedFeatures = [...sourceFeatures].filter(f => targetFeatures.has(f));
      if (sharedFeatures.length > 0) {
        // Weight by rarity of shared features
        let featureScore = 0;
        sharedFeatures.forEach(f => {
          featureScore += featureWeights.get(f) || 1;
        });
        // Normalize by max possible score
        const maxPossible = sourceFeatures.size > 0
          ? [...sourceFeatures].reduce((sum, f) => sum + (featureWeights.get(f) || 1), 0)
          : 1;
        score += (featureScore / maxPossible) * 25;
        matchReasons.push(`${sharedFeatures.length} shared feature${sharedFeatures.length > 1 ? 's' : ''}`);
      }
    }

    // 3. Use case overlap
    if (opts.includeSameUseCases && sourceTool.use_cases && targetTool.use_cases) {
      const sourceUseCases = new Set(sourceTool.use_cases.map(u => u.toLowerCase()));
      const targetUseCases = new Set(targetTool.use_cases.map(u => u.toLowerCase()));
      const similarity = jaccardSimilarity(sourceUseCases, targetUseCases);
      if (similarity > 0) {
        score += similarity * 20;
        const sharedCount = [...sourceUseCases].filter(u => targetUseCases.has(u)).length;
        matchReasons.push(`${sharedCount} shared use case${sharedCount > 1 ? 's' : ''}`);
      }
    }

    // 4. Platform overlap
    if (opts.includeSamePlatforms && sourceTool.platforms && targetTool.platforms) {
      const sourcePlatforms = new Set(sourceTool.platforms.map(p => p.toLowerCase()));
      const targetPlatforms = new Set(targetTool.platforms.map(p => p.toLowerCase()));
      const similarity = jaccardSimilarity(sourcePlatforms, targetPlatforms);
      if (similarity > 0) {
        score += similarity * 10;
      }
    }

    // 5. Pricing similarity
    if (opts.includeSamePricing) {
      if (sourceTool.pricing.toLowerCase() === targetTool.pricing.toLowerCase()) {
        score += 10;
        matchReasons.push(`Same pricing model: ${sourceTool.pricing}`);
      }
    }

    // 6. Description keyword overlap bonus
    const sourceWords = new Set(sourceTool.description.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    const targetWords = new Set(targetTool.description.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    const wordSimilarity = jaccardSimilarity(sourceWords, targetWords);
    score += wordSimilarity * 5;

    if (score >= opts.minScore) {
      results.push({ tool: targetTool, score: Math.round(score * 100) / 100, matchReasons });
    }
  });

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  return results.slice(0, opts.limit);
}

/**
 * Get category-based recommendations with diversity
 */
export function getCategoryRecommendations(
  category: string,
  allTools: Tool[],
  excludeSlug?: string,
  limit: number = 6
): Tool[] {
  return allTools
    .filter(tool => {
      if (excludeSlug && tool.slug === excludeSlug) return false;
      return tool.category.toLowerCase() === category.toLowerCase();
    })
    .slice(0, limit);
}

/**
 * Get diverse recommendations across multiple categories
 */
export function getDiverseRecommendations(
  sourceTool: Tool,
  allTools: Tool[],
  limit: number = 6
): RelatedToolResult[] {
  const related = getRelatedTools(sourceTool, allTools, { limit: limit * 2 });
  
  // Ensure diversity: at most 3 from same category
  const diverse: RelatedToolResult[] = [];
  const categoryCount = new Map<string, number>();
  
  for (const result of related) {
    const cat = result.tool.category.toLowerCase();
    const count = categoryCount.get(cat) || 0;
    
    if (count < 3) {
      diverse.push(result);
      categoryCount.set(cat, count + 1);
    }
    
    if (diverse.length >= limit) break;
  }
  
  return diverse;
}

/**
 * Get "People also viewed" recommendations
 * Based on similar browsing patterns (category + feature overlap)
 */
export function getPeopleAlsoViewed(
  tool: Tool,
  allTools: Tool[],
  limit: number = 4
): Tool[] {
  return getRelatedTools(tool, allTools, {
    limit,
    minScore: 15,
    includeSamePricing: false,
    includeSamePlatforms: false,
  }).map(r => r.tool);
}