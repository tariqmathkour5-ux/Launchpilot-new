/**
 * Agent Error Handling Module
 * Centralized error logging and recovery for the Multi-Agent System
 */

import { prisma } from '@/lib/prisma';
import { AgentId, AgentError, AgentErrorType } from './types';
// Lazy import to avoid circular dependency
let TelegramGatewayClass: typeof import('./telegram-gateway').TelegramGateway | null = null;
function getTelegramGateway() {
  if (!TelegramGatewayClass) {
    TelegramGatewayClass = require('./telegram-gateway').TelegramGateway;
  }
  return TelegramGatewayClass;
}

/**
 * Custom error class for agent errors
 */
export class AgentErrorHandler extends Error implements AgentError {
  public readonly type: AgentErrorType;
  public readonly agentId: AgentId;
  public readonly context: Record<string, unknown>;
  public readonly retryable: boolean;
  public readonly fatal: boolean;

  constructor(params: {
    type: AgentErrorType;
    agentId: AgentId;
    message: string;
    context?: Record<string, unknown>;
    retryable?: boolean;
    fatal?: boolean;
  }) {
    super(params.message);
    this.name = 'AgentError';
    this.type = params.type;
    this.agentId = params.agentId;
    this.context = params.context ?? {};
    this.retryable = params.retryable ?? false;
    this.fatal = params.fatal ?? false;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AgentErrorHandler);
    }
  }
}

/**
 * Error classification helper
 */
export function classifyError(error: unknown, agentId: AgentId): AgentError {
  if (error instanceof AgentErrorHandler) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const context = error instanceof Error ? { stack: error.stack } : { originalError: error };

  // Classify based on error message patterns
  if (message.includes('validation') || message.includes('invalid')) {
    return new AgentErrorHandler({
      type: AgentErrorType.VALIDATION_ERROR,
      agentId,
      message,
      context,
      retryable: false,
      fatal: false,
    });
  }

  if (message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT') || message.includes('network')) {
    return new AgentErrorHandler({
      type: AgentErrorType.NETWORK_ERROR,
      agentId,
      message,
      context,
      retryable: true,
      fatal: false,
    });
  }

  if (message.includes('database') || message.includes('prisma')) {
    return new AgentErrorHandler({
      type: AgentErrorType.KB_ACCESS_ERROR,
      agentId,
      message,
      context,
      retryable: true,
      fatal: false,
    });
  }

  if (message.includes('JSON') || message.includes('parse')) {
    return new AgentErrorHandler({
      type: AgentErrorType.PARSING_ERROR,
      agentId,
      message,
      context,
      retryable: false,
      fatal: false,
    });
  }

  return new AgentErrorHandler({
    type: AgentErrorType.BUSINESS_LOGIC_ERROR,
    agentId,
    message,
    context,
    retryable: false,
    fatal: false,
  });
}

/**
 * Log error to database and optionally notify
 */
export async function handleError(error: AgentError): Promise<void> {
  // Log to database
  try {
    await prisma.activityLog.create({
      data: {
        action: `AGENT_ERROR_${error.type}`,
        resource: error.agentId,
        resourceId: error.context.taskId as string | undefined,
        details: JSON.stringify({
          message: error.message,
          context: error.context,
          stack: error.stack,
          retryable: error.retryable,
          fatal: error.fatal,
        }),
      },
    });
  } catch (loggingError) {
    console.error('[AgentErrorHandler] Failed to log error:', loggingError);
  }

// Send to Telegram if critical or fatal
  if (error.type === AgentErrorType.EXTERNAL_SERVICE_ERROR || error.fatal) {
    const GatewayClass = getTelegramGateway();
    if (GatewayClass) {
      const gateway = new GatewayClass();
      await gateway.sendErrorAlert({
        agentId: error.agentId,
        type: error.type,
        message: error.message,
        context: error.context,
      });
    }
  }
}

/**
 * Schedule retry for recoverable errors
 * Note: Requires prisma generate after adding AgentTask model
 */
export async function scheduleRetry(
  _taskId: string,
  _agentId: AgentId,
  _maxRetries: number,
  _retryCount: number,
  _delayMs?: number
): Promise<void> {
  // This will be implemented after Prisma migration
  // For now, log the retry request
  console.log(`[AgentErrorHandler] Scheduling retry for task ${_taskId}`);
}

/**
 * Wrapper for async agent operations with automatic error handling
 */
export async function withErrorHandling<T>(
  agentId: AgentId,
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const agentError = classifyError(error, agentId);
    await handleError(agentError);

    // Re-throw for caller to handle
    throw agentError;
  }
}

/**
 * Error severity levels
 */
export function getErrorSeverity(error: AgentError): 'low' | 'medium' | 'high' {
  if (error.fatal === true) return 'high';
  if (error.type === AgentErrorType.EXTERNAL_SERVICE_ERROR) return 'high';
  if (error.retryable) return 'medium';
  return 'low';
}

/**
 * Error recovery strategies
 */
export interface RecoveryStrategy {
  canHandle: (error: AgentError) => boolean;
  recover: (error: AgentError) => Promise<void>;
}

export const DEFAULT_RECOVERY_STRATEGIES: RecoveryStrategy[] = [
  {
    canHandle: (error) => error.type === AgentErrorType.NETWORK_ERROR,
    recover: async () => {
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 5000));
    },
  },
  {
    canHandle: (error) => error.type === AgentErrorType.KB_ACCESS_ERROR,
    recover: async () => {
      // Invalidate cache and retry
      // Implementation would clear Redis cache
    },
  },
];