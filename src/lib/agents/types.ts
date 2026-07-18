/**
 * Multi-Agent System Types
 * Shared types for all 15 agents in the LaunchPilot system
 */

// Agent IDs
export type AgentId = 
  | 'AGT-DATA'      // Data Aggregator
  | 'AGT-MKTG'      // Market Intelligence
  | 'AGT-EDIT'      // Content Editor
  | 'AGT-SEO'       // SEO Optimizer
  | 'AGT-MONET'     // Monetization
  | 'AGT-TECH'      // Technical Sentinel
  | 'AGT-CONV'      // Conversion
  | 'AGT-GROWTH'    // Growth
  | 'AGT-CLEAN'     // Database Cleanup
  | 'AGT-SEC'       // Security
  | 'AGT-FEEDBACK'  // Feedback Analyst
  | 'AGT-STRAT'     // Content Strategist
  | 'AGT-LANG'      // Language
  | 'AGT-ARCH'      // System Architect
  | 'AGT-ORCH';    // Orchestrator

// Message types
export type MessageType =
  // Command & Control
  | 'EXECUTE_TASK'
  | 'TASK_COMPLETED'
  | 'TASK_FAILED'
  | 'HEARTBEAT'
  | 'LOCK_ACQUIRE'
  | 'LOCK_RELEASE'
  | 'LOCK_DENIED'
  
  // Knowledge Base Events
  | 'KB_READ_REQUEST'
  | 'KB_READ_RESPONSE'
  | 'KB_WRITE_REQUEST'
  | 'KB_WRITE_COMPLETED'
  | 'KB_UPDATED'
  
  // Proposal System
  | 'PROPOSAL_CREATED'
  | 'PROPOSAL_APPROVED'
  | 'PROPOSAL_REJECTED'
  | 'PROPOSAL_RESPONSE'
  
  // Agent-specific events
  | 'TOOL_DISCOVERED'
  | 'TOOL_VALIDATED'
  | 'CONTENT_GENERATED'
  | 'SEO_SCORE_CALCULATED'
  | 'REVENUE_TRACKED'
  | 'ERROR_DETECTED'
  | 'FEEDBACK_RECEIVED';

// Proposal types
export type ProposalType =
  | 'NEW_TOOL'
  | 'NEW_CATEGORY'
  | 'SEO_UPDATE'
  | 'CONTENT_ADD'
  | 'CONTENT_UPDATE'
  | 'MONETIZATION_OPPORTUNITY'
  | 'SECURITY_ALERT'
  | 'SYSTEM_UPDATE'
  | 'LANGUAGE_TRANSLATION';

// Standardized message envelope
export interface AgentMessage {
  id: string;
  source: AgentId;
  target?: AgentId;
  type: MessageType;
  payload: Record<string, unknown>;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
  correlationId?: string;
  ttl?: number;
}

export interface AgentResponse extends AgentMessage {
  status: 'success' | 'error' | 'pending';
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Agent configuration
export interface AgentConfig {
  id: AgentId;
  name: string;
  description: string;
  schedule?: string;  // Cron expression
  enabled: boolean;
  dependencies: AgentId[];
  maxRetries: number;
  timeoutMs: number;
}

// Task status
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// Agent task
export interface AgentTask {
  id: string;
  agentId: AgentId;
  name: string;
  status: TaskStatus;
  priority: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  nextRunAt?: Date;
  lastRunAt?: Date;
  retryCount: number;
  maxRetries: number;
}

// Proposal payload
export interface ProposalPayload {
  id: string;
  agentId: AgentId;
  type: ProposalType;
  title: string;
  description: string;
  impact: {
    category: 'HIGH' | 'MEDIUM' | 'LOW';
    riskScore: number;
    estimatedValue?: string;
  };
  data: Record<string, unknown>;
  preview?: {
    text: string;
    imageUrl?: string;
  };
  createdAt: string;
  expiresAt: string;
}

// Shared state with versioning
export interface AgentStateEntry {
  key: string;
  value: Record<string, unknown>;
  version: number;
  lockedBy?: AgentId;
  lockedAt?: Date;
}

// Agent health metrics
export interface AgentHealth {
  agentId: AgentId;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastHeartbeat: string;
  lastCompletedTask?: {
    taskId: string;
    duration: number;
    success: boolean;
  };
  pendingProposals: number;
  errorCount: number;
  uptime: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

// Tool data from knowledge base
export interface KnowledgeTool {
  id?: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  category: string;
  pricing: string;
  websites?: {
    website: string;
    type: string;
  }[];
  platforms?: string[];
  features?: string[];
  use_cases?: string[];
  has_api?: boolean;
  rating?: number;
  source?: string;
  scrapedAt?: Date;
}

// Error types
export enum AgentErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  KB_ACCESS_ERROR = 'KB_ACCESS_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

// Agent error interface
export interface AgentError extends Error {
  type: AgentErrorType;
  agentId: AgentId;
  context: Record<string, unknown>;
  retryable: boolean;
  fatal: boolean;
}

// Telegram types
export interface TelegramInlineKeyboard {
  inline_keyboard: Array<Array<{
    text: string;
    callback_data: string;
  }>>;
}

export interface TelegramMessage {
  chat_id: string | number;
  text: string;
  parse_mode?: 'HTML' | 'MarkdownV2';
  reply_markup?: TelegramInlineKeyboard;
  disable_web_page_preview?: boolean;
}