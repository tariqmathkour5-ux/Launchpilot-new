/**
 * Data Aggregator Agent (AGT-DATA)
 * Collects, validates, and ingests new AI tools into the knowledge base
 */

import { AgentId, KnowledgeTool, ProposalPayload } from './types';
import { agentKB } from './agent-kb';
import { telegramGateway } from './telegram-gateway';
import { orchestrator, AGENT_CONFIGS } from './orchestrator';
// Use native crypto API instead of uuid package
const uuidv4 = (): string => crypto.randomUUID();

// Validation thresholds
const VALIDATION_THRESHOLD = 70; // Minimum score to propose
const DUPLICATE_THRESHOLD = 0.85; // Similarity threshold for duplicates

/**
 * Data Aggregator configuration
 */
export interface DataAggregatorConfig {
  sources: string[];
  validationThreshold: number;
  autoProposeThreshold: number;
}

const DEFAULT_CONFIG: DataAggregatorConfig = {
  sources: [
    // Future: Add RSS feeds and API endpoints
    'https://example-api.com/tools',
  ],
  validationThreshold: VALIDATION_THRESHOLD,
  autoProposeThreshold: VALIDATION_THRESHOLD,
};

/**
 * Tool validation result
 */
interface ValidationResult {
  valid: boolean;
  score: number;
  issues: string[];
}

/**
 * Data Aggregator Agent Class
 */
export class DataAggregatorAgent {
  private id: AgentId;
  private config: DataAggregatorConfig;
  private isRunning: boolean;

  constructor(config: Partial<DataAggregatorConfig> = {}) {
    this.id = 'AGT-DATA';
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isRunning = false;
  }

  /**
   * Run the agent task
   */
  async run(): Promise<void> {
    this.isRunning = true;
    console.log('[DataAggregator] Starting run cycle');

    try {
      // Get all existing tools for duplicate checking
      const existingTools = await agentKB.getAllTools();
      const existingSlugs = new Set(existingTools.map((t) => t.slug));

      // Discover new tools (placeholder for now - will connect to sources)
      const discoveredTools = await this.discoverNewTools();

      for (const tool of discoveredTools) {
        // Skip if slug exists
        if (existingSlugs.has(tool.slug)) {
          console.log(`[DataAggregator] Skipping duplicate: ${tool.slug}`);
          continue;
        }

        // Validate tool
        const validation = this.validateTool(tool);
        
        if (validation.score >= this.config.autoProposeThreshold) {
          // Create proposal
          const proposal: ProposalPayload = {
            id: uuidv4(),
            agentId: this.id,
            type: 'NEW_TOOL',
            title: `New Tool: ${tool.name}`,
            description: tool.description,
            impact: {
              category: this.getImpactCategory(tool),
              riskScore: this.calculateRiskScore(tool, validation),
              estimatedValue: 'Potential traffic increase',
            },
            data: tool as unknown as Record<string, unknown>,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          };

          // Send to Telegram
          await telegramGateway.sendProposal(proposal);
          console.log(`[DataAggregator] Proposed tool: ${tool.name}`);
        }
      }
    } catch (error) {
      console.error('[DataAggregator] Error during run:', error);
    } finally {
      this.isRunning = false;
      orchestrator.updateHeartbeat(this.id);
    }
  }

  /**
   * Discover new tools from sources
   */
  private async discoverNewTools(): Promise<KnowledgeTool[]> {
    // Placeholder implementation
    // In production, this would fetch from APIs, RSS feeds, etc.
    
    // For now, return empty array to demonstrate the infrastructure
    return [];
  }

  /**
   * Validate a tool against schema requirements
   */
  private validateTool(tool: KnowledgeTool): ValidationResult {
    const issues: string[] = [];
    let score = 100;

    // Check required fields
    if (!tool.slug || tool.slug.length < 3) {
      issues.push('Invalid slug');
      score -= 20;
    }

    if (!tool.name || tool.name.length < 2) {
      issues.push('Invalid name');
      score -= 20;
    }

    if (!tool.description || tool.description.length < 10) {
      issues.push('Description too short');
      score -= 15;
    }

    if (!tool.category) {
      issues.push('Missing category');
      score -= 20;
    }

    // Check for duplicates using slug similarity
    const existingTools = this.loadExistingTools();
    const similarity = this.calculateSlugSimilarity(tool.slug, existingTools);
    if (similarity > DUPLICATE_THRESHOLD) {
      issues.push('Potential duplicate detected');
      score -= 30;
    }

    return {
      valid: score >= VALIDATION_THRESHOLD,
      score,
      issues,
    };
  }

  /**
   * Calculate impact category
   */
  private getImpactCategory(tool: KnowledgeTool): 'HIGH' | 'MEDIUM' | 'LOW' {
    const popularCategories = ['ai', 'productivity', 'developer-tools'];
    const hasApi = tool.has_api || tool.platforms?.includes('api');
    
    if (hasApi && popularCategories.includes(tool.category.toLowerCase())) {
      return 'HIGH';
    }
    
    if (tool.platforms && tool.platforms.length > 2) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(tool: KnowledgeTool, validation: ValidationResult): number {
    let risk = 50; // Base risk
    
    // Lower risk for well-documented tools
    if (tool.description.length > 100) risk -= 10;
    if (tool.features && tool.features.length > 3) risk -= 10;
    if (tool.use_cases && tool.use_cases.length > 2) risk -= 10;
    
    // Higher risk for missing info
    if (validation.issues.length > 0) risk += 20;
    
    // Higher risk for unknown pricing
    if (tool.pricing === 'unknown' || !tool.pricing) risk += 15;
    
    return Math.max(0, Math.min(100, risk));
  }

  /**
   * Calculate slug similarity (fuzzy match)
   */
  private calculateSlugSimilarity(slug: string, tools: KnowledgeTool[]): number {
    let maxSimilarity = 0;
    
    for (const tool of tools) {
      const similarity = this.stringSimilarity(slug, tool.slug);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }
    
    return maxSimilarity;
  }

  /**
   * Simple string similarity (can be improved with fuzzy matching)
   */
  private stringSimilarity(a: string, b: string): number {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const track = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );
    
    for (let i = 0; i <= str1.length; i++) {
      track[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      track[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // insertion
          track[j - 1][i] + 1, // deletion
          track[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return track[str2.length][str1.length];
  }

  /**
   * Load existing tools (placeholder)
   */
  private loadExistingTools(): KnowledgeTool[] {
    // Will use agentKB.getAllTools() after initialization
    return [];
  }

  /**
   * Handle proposal response
   */
  async handleProposalResponse(
    proposalId: string, 
    action: 'approve' | 'reject', 
    feedback?: string
  ): Promise<void> {
    console.log(`[DataAggregator] Received ${action} for proposal ${proposalId}`);
    
    if (action === 'approve') {
      // Fetch proposal data and save to KB
      console.log('[DataAggregator] Proposal approved - would save tool');
    }
    
    if (feedback) {
      console.log(`[DataAggregator] Feedback: ${feedback}`);
    }
  }

  /**
   * Get agent health
   */
  getHealth() {
    return {
      agentId: this.id,
      status: this.isRunning ? 'healthy' : 'healthy',
      lastHeartbeat: new Date().toISOString(),
      pendingProposals: 0,
      errorCount: 0,
      uptime: 0,
    };
  }

  /**
   * Get agent configuration
   */
  getConfig(): DataAggregatorConfig {
    return this.config;
  }
}

// Export singleton
export const dataAggregator = new DataAggregatorAgent();