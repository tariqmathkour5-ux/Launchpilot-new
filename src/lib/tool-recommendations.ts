// =====================================================
// TOOL RECOMMENDATION SYSTEM
// Suggests tools based on shared tags, categories, and features
// =====================================================

import { Tool } from '@/types';

export interface ToolRecommendation {
  tool: Tool;
  score: number;
  reason: string;
}

interface RecommendationOptions {
  limit?: number;
  minScore?: number;
  weightCategory?: number;
  weightFeatures?: number;
  weightUseCases?: number;
  weightPlatforms?: number;
}

/**
 * Calculate recommendation score between two tools
 */
function calculateRecommendationScore(
  sourceTool: Tool,
  targetTool: Tool,
  weights: Required<Pick<RecommendationOptions, 'weightCategory' | 'weightFeatures' | 'weightUseCases' | 'weightPlatforms'>>
): number {
  let score = 0;

  // Category match (highest weight)
  if (sourceTool.category.toLowerCase() === targetTool.category.toLowerCase()) {
    score += weights.weightCategory;
  }

  // Shared features
  const featuresA = new Set(sourceTool.features?.map(f => f.toLowerCase()) || []);
  const featuresB = new Set(targetTool.features?.map(f => f.toLowerCase()) || []);
  const sharedFeatures = [...featuresA].filter(f => featuresB.has(f)).length;
  const featureScore = (sharedFeatures / Math.max(featuresA.size, 1)) * weights.weightFeatures;
  score += featureScore;

  // Shared use cases
  const useCasesA = new Set(sourceTool.use_cases?.map(u => u.toLowerCase()) || []);
  const useCasesB = new Set(targetTool.use_cases?.map(u => u.toLowerCase()) || []);
  const sharedUseCases = [...useCasesA].filter(u => useCasesB.has(u)).length;
  const useCaseScore = (sharedUseCases / Math.max(useCasesA.size, 1)) * weights.weightUseCases;
  score += useCaseScore;

  // Similar platforms
  const platformsA = new Set(sourceTool.platforms?.map(p => p.toLowerCase()) || []);
  const platformsB = new Set(targetTool.platforms?.map(p => p.toLowerCase()) || []);
  const sharedPlatforms = [...platformsA].filter(p => platformsB.has(p)).length;
  const platformScore = (sharedPlatforms / Math.max(platformsA.size, 1)) * weights.weightPlatforms;
  score += platformScore;

  return Math.round(score * 100) / 100; // Round to 2 decimal places
}

/**
 * Get recommendation reason based on score breakdown
 */
function getRecommendationReason(
  sourceTool: Tool,
  recommendedTool: Tool
): string {
  const reasons: string[] = [];

  if (sourceTool.category.toLowerCase() === recommendedTool.category.toLowerCase()) {
    reasons.push(`Same category: ${sourceTool.category}`);
  }

  const featuresA = new Set(sourceTool.features?.map(f => f.toLowerCase()) || []);
  const featuresB = new Set(recommendedTool.features?.map(f => f.toLowerCase()) || []);
  const sharedFeatures = [...featuresA].filter(f => featuresB.has(f));
  if (sharedFeatures.length > 0) {
    reasons.push(`${sharedFeatures.length} shared feature${sharedFeatures.length > 1 ? 's' : ''}`);
  }

  const useCasesA = new Set(sourceTool.use_cases?.map(u => u.toLowerCase()) || []);
  const useCasesB = new Set(recommendedTool.use_cases?.map(u => u.toLowerCase()) || []);
  const sharedUseCases = [...useCasesA].filter(u => useCasesB.has(u));
  if (sharedUseCases.length > 0) {
    reasons.push(`${sharedUseCases.length} shared use case${sharedUseCases.length > 1 ? 's' : ''}`);
  }

  return reasons.length > 0 
    ? reasons.join(' • ') 
    : `Similar to ${sourceTool.name}`;
}

/**
 * Get tool recommendations based on shared attributes
 */
export function getToolRecommendations(
  sourceTool: Tool,
  allTools: Tool[],
  options: RecommendationOptions = {}
): ToolRecommendation[] {
  const {
    limit = 6,
    minScore = 5,
    weightCategory = 40,
    weightFeatures = 30,
    weightUseCases = 20,
    weightPlatforms = 10,
  } = options;

  const weights = {
    weightCategory,
    weightFeatures,
    weightUseCases,
    weightPlatforms,
  };

  return allTools
    .filter(tool => tool.slug !== sourceTool.slug)
    .map(tool => {
      const score = calculateRecommendationScore(sourceTool, tool, weights);
      const reason = getRecommendationReason(sourceTool, tool);
      return { tool, score, reason };
    })
    .filter(rec => rec.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get recommendations for multiple tools (for homepage/display)
 */
export function getTopRecommendations(
  tools: Tool[],
  allTools: Tool[],
  limit: number = 4
): Map<string, ToolRecommendation[]> {
  const recommendations = new Map<string, ToolRecommendation[]>();
  
  tools.forEach(tool => {
    const recs = getToolRecommendations(tool, allTools, { limit });
    if (recs.length > 0) {
      recommendations.set(tool.slug, recs);
    }
  });
  
  return recommendations;
}

/**
 * Get category-based recommendations
 */
export function getCategoryRecommendations(
  category: string,
  allTools: Tool[],
  limit: number = 8
): Tool[] {
  return allTools
    .filter(tool => 
      tool.category.toLowerCase() === category.toLowerCase()
    )
    .slice(0, limit);
}

/**
 * Get tools with similar features
 */
export function getSimilarFeatureTools(
  feature: string,
  allTools: Tool[],
  excludeSlug?: string,
  limit: number = 6
): Tool[] {
  return allTools
    .filter(tool => {
      if (excludeSlug && tool.slug === excludeSlug) return false;
      return tool.features?.some(f => f.toLowerCase().includes(feature.toLowerCase()));
    })
    .slice(0, limit);
}

/**
 * Get tools with similar use cases
 */
export function getSimilarUseCaseTools(
  useCase: string,
  allTools: Tool[],
  excludeSlug?: string,
  limit: number = 6
): Tool[] {
  return allTools
    .filter(tool => {
      if (excludeSlug && tool.slug === excludeSlug) return false;
      return tool.use_cases?.some(u => u.toLowerCase().includes(useCase.toLowerCase()));
    })
    .slice(0, limit);
}