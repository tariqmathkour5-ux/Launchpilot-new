/**
 * Orchestrator Agent (AGT-ORCH)
 * Central coordination hub for all agents in the Multi-Agent System
 */

import { AgentId, AgentMessage, AgentConfig, TaskStatus } from './types';
import { telegramGateway } from './telegram-gateway';

// Agent configurations
export const AGENT_CONFIGS: Record<AgentId, AgentConfig> = {
  'AGT-DATA': {
    id: 'AGT-DATA',
    name: 'Data Aggregator',
    description: 'Collects, validates, and ingests new tool data',
    schedule: '0 */6 * * *', // Every 6 hours
    enabled: true,
    dependencies: ['AGT-ARCH', 'AGT-SEC', 'AGT-LANG'],
    maxRetries: 3,
    timeoutMs: 300000, // 5 minutes
  },
  'AGT-MKTG': {
    id: 'AGT-MKTG',
    name: 'Market Intelligence',
    description: 'Competitive analysis and market trend monitoring',
    schedule: '0 0 * * *', // Daily at midnight
    enabled: true,
    dependencies: ['AGT-DATA', 'AGT-STRAT'],
    maxRetries: 2,
    timeoutMs: 600000, // 10 minutes
  },
  'AGT-EDIT': {
    id: 'AGT-EDIT',
    name: 'Content Editor',
    description: 'Automated content generation and optimization',
    schedule: '0 */12 * * *', // Every 12 hours
    enabled: true,
    dependencies: ['AGT-LANG', 'AGT-SEO'],
    maxRetries: 3,
    timeoutMs: 180000, // 3 minutes
  },
  'AGT-SEO': {
    id: 'AGT-SEO',
    name: 'SEO Optimizer',
    description: 'Search engine optimization and meta generation',
    schedule: '0 2 * * *', // Daily at 2 AM
    enabled: true,
    dependencies: ['AGT-EDIT', 'AGT-ARCH'],
    maxRetries: 3,
    timeoutMs: 120000, // 2 minutes
  },
  'AGT-MONET': {
    id: 'AGT-MONET',
    name: 'Monetization',
    description: 'Revenue optimization and affiliate management',
    schedule: '*/30 * * * *', // Every 30 minutes
    enabled: true,
    dependencies: ['AGT-CONV', 'AGT-TECH'],
    maxRetries: 3,
    timeoutMs: 60000, // 1 minute
  },
  'AGT-TECH': {
    id: 'AGT-TECH',
    name: 'Technical Sentinel',
    description: 'Code quality, performance, and security monitoring',
    schedule: '*/15 * * * *', // Every 15 minutes
    enabled: true,
    dependencies: [], // Monitors all agents
    maxRetries: 2,
    timeoutMs: 30000, // 30 seconds
  },
  'AGT-CONV': {
    id: 'AGT-CONV',
    name: 'Conversion',
    description: 'Conversion rate optimization and A/B testing',
    schedule: '0 */4 * * *', // Every 4 hours
    enabled: true,
    dependencies: ['AGT-GROWTH', 'AGT-MONET'],
    maxRetries: 3,
    timeoutMs: 120000, // 2 minutes
  },
  'AGT-GROWTH': {
    id: 'AGT-GROWTH',
    name: 'Growth',
    description: 'User engagement and retention strategies',
    schedule: '0 9 * * *', // Daily at 9 AM
    enabled: true,
    dependencies: ['AGT-FEEDBACK', 'AGT-MONET'],
    maxRetries: 2,
    timeoutMs: 300000, // 5 minutes
  },
  'AGT-CLEAN': {
    id: 'AGT-CLEAN',
    name: 'Database Cleanup',
    description: 'Data integrity and cleanup operations',
    schedule: '0 3 * * 0', // Sundays at 3 AM
    enabled: true,
    dependencies: ['AGT-ARCH'],
    maxRetries: 1,
    timeoutMs: 600000, // 10 minutes
  },
  'AGT-SEC': {
    id: 'AGT-SEC',
    name: 'Security',
    description: 'Security audits and vulnerability management',
    schedule: '*/45 * * * *', // Every 45 minutes
    enabled: true,
    dependencies: ['AGT-TECH'],
    maxRetries: 2,
    timeoutMs: 120000, // 2 minutes
  },
  'AGT-FEEDBACK': {
    id: 'AGT-FEEDBACK',
    name: 'Feedback Analyst',
    description: 'User feedback processing and sentiment analysis',
    schedule: '0 */8 * * *', // Every 8 hours
    enabled: true,
    dependencies: ['AGT-ARCH', 'AGT-STRAT'],
    maxRetries: 3,
    timeoutMs: 180000, // 3 minutes
  },
  'AGT-STRAT': {
    id: 'AGT-STRAT',
    name: 'Content Strategist',
    description: 'Content planning and SEO strategy',
    schedule: '0 0 1 * * *', // Monthly on 1st
    enabled: true,
    dependencies: ['AGT-MKTG', 'AGT-FEEDBACK'],
    maxRetries: 2,
    timeoutMs: 600000, // 10 minutes
  },
  'AGT-LANG': {
    id: 'AGT-LANG',
    name: 'Language',
    description: 'Internationalization and localization',
    schedule: '0 1 * * *', // Daily at 1 AM
    enabled: true,
    dependencies: [], // Used by all content-producing agents
    maxRetries: 3,
    timeoutMs: 180000, // 3 minutes
  },
  'AGT-ARCH': {
    id: 'AGT-ARCH',
    name: 'System Architect',
    description: 'System health and architectural decisions',
    schedule: '*/10 * * * *', // Every 10 minutes
    enabled: true,
    dependencies: [], // Supervisory role
    maxRetries: 2,
    timeoutMs: 60000, // 1 minute
  },
  'AGT-ORCH': {
    id: 'AGT-ORCH',
    name: 'Orchestrator',
    description: 'Central coordination hub',
    schedule: '* * * * *', // Every minute
    enabled: true,
    dependencies: ['AGT-ARCH'],
    maxRetries: 3,
    timeoutMs: 30000, // 30 seconds
  },
};

/**
 * Orchestrator class
 */
export class Orchestrator {
  private static instance: Orchestrator;
  private agentHeartbeats: Map<AgentId, Date>;
  private isRunning: boolean;
  private proposalHandlers: Map<string, (action: string, feedback?: string) => Promise<void>>;

  private constructor() {
    this.agentHeartbeats = new Map();
    this.isRunning = false;
    this.proposalHandlers = new Map();
    
    // Set up response handler for Telegram callbacks
    telegramGateway.setResponseHandler(async (proposalId, action, feedback) => {
      const handler = this.proposalHandlers.get(proposalId);
      if (handler) {
        await handler(action, feedback);
      }
    });
  }

  static getInstance(): Orchestrator {
    if (!Orchestrator.instance) {
      Orchestrator.instance = new Orchestrator();
    }
    return Orchestrator.instance;
  }

  /**
   * Start the orchestrator
   */
  async start(): Promise<void> {
    this.isRunning = true;
    console.log('[Orchestrator] Started');

    // Initialize heartbeats
    for (const agentId of Object.keys(AGENT_CONFIGS) as AgentId[]) {
      this.agentHeartbeats.set(agentId, new Date());
    }

    // Send startup notification
    await telegramGateway.sendHeartbeat('AGT-ORCH', 'started');
  }

  /**
   * Stop the orchestrator
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('[Orchestrator] Stopped');
  }

  /**
   * Update agent heartbeat
   */
  updateHeartbeat(agentId: AgentId): void {
    this.agentHeartbeats.set(agentId, new Date());
  }

  /**
   * Get agent status
   */
  getAgentStatus(agentId: AgentId): 'healthy' | 'degraded' | 'unhealthy' {
    const lastHeartbeat = this.agentHeartbeats.get(agentId);
    if (!lastHeartbeat) return 'unhealthy';

    const timeSince = Date.now() - lastHeartbeat.getTime();
    
    // Consider unhealthy if no heartbeat for 5 minutes
    if (timeSince > 5 * 60 * 1000) return 'unhealthy';
    // Consider degraded if no heartbeat for 2 minutes
    if (timeSince > 2 * 60 * 1000) return 'degraded';
    return 'healthy';
  }

  /**
   * Get all agent statuses
   */
  getAllAgentStatuses(): Record<AgentId, 'healthy' | 'degraded' | 'unhealthy'> {
    const statuses: Record<string, 'healthy' | 'degraded' | 'unhealthy'> = {};
    for (const agentId of Object.keys(AGENT_CONFIGS) as AgentId[]) {
      statuses[agentId] = this.getAgentStatus(agentId);
    }
    return statuses as Record<AgentId, 'healthy' | 'degraded' | 'unhealthy'>;
  }

  /**
   * Check if dependencies are satisfied
   */
  async checkDependencies(agentId: AgentId): Promise<boolean> {
    const config = AGENT_CONFIGS[agentId];
    if (!config) return false;

    for (const depId of config.dependencies) {
      const status = this.getAgentStatus(depId);
      if (status === 'unhealthy') {
        console.warn(`[Orchestrator] Dependency ${depId} is unhealthy for ${agentId}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Route a message to the appropriate agent
   */
  async routeMessage(message: AgentMessage): Promise<void> {
    // In a real implementation, this would publish to Redis Pub/Sub
    console.log(`[Orchestrator] Routing message from ${message.source} to ${message.target ?? 'broadcast'}`);
  }

  /**
   * Send a message directly to the admin Telegram chat
   * This is the main communication method for internal agent-to-admin messaging
   */
  async sendToAdminChat(text: string, options?: { parse_mode?: 'HTML' | 'MarkdownV2'; disable_web_page_preview?: boolean }): Promise<boolean> {
    try {
      const result = await telegramGateway.sendToAdminChat(text, options);
      console.log(`[Orchestrator] Message sent to admin chat`);
      return result;
    } catch (error) {
      console.error('[Orchestrator] Failed to send to admin chat:', error);
      return false;
    }
  }

  /**
   * Register a proposal response handler
   * Used by agents to handle their own proposal responses
   */
  registerProposalHandler(proposalId: string, handler: (action: string, feedback?: string) => Promise<void>): void {
    this.proposalHandlers.set(proposalId, handler);
  }

  /**
   * Unregister a proposal response handler
   */
  unregisterProposalHandler(proposalId: string): void {
    this.proposalHandlers.delete(proposalId);
  }

  /**
   * Poll for Telegram responses (button presses)
   * Call this periodically to check for user responses
   */
  async pollTelegramResponses(): Promise<void> {
    await telegramGateway.pollForResponses();
  }
}

// Export singleton
export const orchestrator = Orchestrator.getInstance();