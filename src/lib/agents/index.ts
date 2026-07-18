/**
 * Multi-Agent System Index
 * Exports all agents and utilities
 */

// Types
export * from './types';

// Core infrastructure
export { AgentKBClient, agentKB } from './agent-kb';
export { TelegramGateway, telegramGateway, generateCallbackData, generateProposalKeyboard } from './telegram-gateway';
export type { ResponseCallback } from './telegram-gateway';
export { 
  AgentErrorHandler, 
  classifyError, 
  handleError, 
  scheduleRetry, 
  withErrorHandling,
  getErrorSeverity,
  DEFAULT_RECOVERY_STRATEGIES,
} from './agent-errors';

// Orchestrator
export { Orchestrator, orchestrator, AGENT_CONFIGS } from './orchestrator';

// Agents
export { DataAggregatorAgent, dataAggregator } from './data-aggregator';

// Note: Additional agents will be exported as they are implemented
// export { MarketIntelligenceAgent, marketIntelligence } from './market-intelligence';
// export { ContentEditorAgent, contentEditor } from './content-editor';
// export { SeoOptimizerAgent, seoOptimizer } from './seo-optimizer';
// etc.