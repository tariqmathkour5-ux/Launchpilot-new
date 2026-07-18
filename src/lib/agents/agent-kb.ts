/**
 * Agent Knowledge Base Client
 * Provides type-safe access to the knowledge base for agents
 */

import { prisma } from '@/lib/prisma';
import { AgentId, KnowledgeTool, AgentStateEntry } from './types';
import fs from 'fs';
import path from 'path';

// Knowledge base path
const KB_PATH = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase', 'tools_master.json');

/**
 * Knowledge Base Client interface
 */
export interface KnowledgeBaseClient {
  // Read operations
  read<T>(key: string): Promise<T | null>;
  readMany<T>(pattern: string): Promise<T[]>;
  
  // Write operations
  write<T>(key: string, value: T, expectedVersion?: number): Promise<void>;
  atomic<T>(key: string, updater: (current: T | null) => T): Promise<void>;
  
  // Locking
  acquireLock(key: string, ttlSeconds?: number): Promise<boolean>;
  releaseLock(key: string): Promise<void>;
  
  // Tool operations
  getTool(slug: string): Promise<KnowledgeTool | null>;
  getAllTools(): Promise<KnowledgeTool[]>;
  searchTools(query: string): Promise<KnowledgeTool[]>;
}

/**
 * Agent Knowledge Base Client implementation
 */
export class AgentKBClient implements KnowledgeBaseClient {
  private cache: Map<string, { data: unknown; timestamp: number }>;
  private cacheTTL: number;

  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Read a value from the knowledge base
   */
  async read<T>(key: string): Promise<T | null> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data as T;
    }

    try {
      const result = await prisma.agentState.findUnique({
        where: { key },
      });

      if (result) {
        const data = JSON.parse(result.value) as T;
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
      }

      return null;
    } catch (error) {
      console.error(`[AgentKBClient] Failed to read key ${key}:`, error);
      return null;
    }
  }

  /**
   * Read multiple values matching a pattern
   */
  async readMany<T>(_pattern: string): Promise<T[]> {
    // For now, return empty array - can be implemented with Redis SCAN
    return [];
  }

  /**
   * Write a value to the knowledge base with version checking
   */
  async write<T>(key: string, value: T, expectedVersion?: number): Promise<void> {
    const stringValue = JSON.stringify(value);

    try {
      if (expectedVersion !== undefined) {
        // Optimistic concurrency check
        const existing = await prisma.agentState.findUnique({
          where: { key },
        });

        if (existing && existing.version !== expectedVersion) {
          throw new Error(`Version mismatch for key ${key}`);
        }
      }

      await prisma.agentState.upsert({
        where: { key },
        create: {
          key,
          value: stringValue,
          version: 1,
        },
        update: {
          value: stringValue,
          version: { increment: 1 },
          lockedBy: null,
          lockedAt: null,
        },
      });

      // Invalidate cache
      this.cache.delete(key);
    } catch (error) {
      console.error(`[AgentKBClient] Failed to write key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Atomic update operation
   */
  async atomic<T>(key: string, updater: (current: T | null) => T): Promise<void> {
    const current = await this.read<T>(key);
    const updated = updater(current);
    await this.write(key, updated);
  }

  /**
   * Acquire a lock for a key
   */
  async acquireLock(key: string, ttlSeconds: number = 30): Promise<boolean> {
    try {
      const existing = await prisma.agentState.findUnique({
        where: { key },
      });

      const now = new Date();
      const lockExpiry = existing?.lockedAt 
        ? new Date(existing.lockedAt.getTime() + ttlSeconds * 1000)
        : now;

      // If already locked and not expired, deny
      if (existing?.lockedBy && existing.lockedAt && existing.lockedAt > now) {
        return false;
      }

      await prisma.agentState.upsert({
        where: { key },
        create: {
          key,
          value: JSON.stringify({ locked: true }),
          version: 1,
          lockedBy: 'AGT-ORCH',
          lockedAt: lockExpiry,
        },
        update: {
          lockedBy: 'AGT-ORCH',
          lockedAt: lockExpiry,
        },
      });

      return true;
    } catch (error) {
      console.error(`[AgentKBClient] Failed to acquire lock for ${key}:`, error);
      return false;
    }
  }

  /**
   * Release a lock
   */
  async releaseLock(key: string): Promise<void> {
    try {
      await prisma.agentState.update({
        where: { key },
        data: {
          lockedBy: null,
          lockedAt: null,
        },
      });
    } catch (error) {
      console.error(`[AgentKBClient] Failed to release lock for ${key}:`, error);
    }
  }

  /**
   * Get a tool by slug
   */
  async getTool(slug: string): Promise<KnowledgeTool | null> {
    const tools = await this.getAllTools();
    return tools.find((t) => t.slug === slug) ?? null;
  }

  /**
   * Get all tools from JSON knowledge base
   */
  async getAllTools(): Promise<KnowledgeTool[]> {
    try {
      if (fs.existsSync(KB_PATH)) {
        const content = fs.readFileSync(KB_PATH, 'utf-8');
        return JSON.parse(content) as KnowledgeTool[];
      }
    } catch (error) {
      console.error('[AgentKBClient] Failed to load tools:', error);
    }
    return [];
  }

  /**
   * Search tools by query
   */
  async searchTools(query: string): Promise<KnowledgeTool[]> {
    const tools = await this.getAllTools();
    const lowerQuery = query.toLowerCase();

    return tools.filter((tool) =>
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      tool.category.toLowerCase().includes(lowerQuery) ||
      tool.features?.some((f) => f.toLowerCase().includes(lowerQuery)) ||
      tool.use_cases?.some((u) => u.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Check if tool exists by slug
   */
  async toolExists(slug: string): Promise<boolean> {
    const tool = await this.getTool(slug);
    return tool !== null;
  }

  /**
   * Save tool to database (after approval)
   */
  async saveTool(tool: KnowledgeTool, approvedBy?: string): Promise<void> {
    // This will be implemented after Prisma migration includes agent models
    console.log('[AgentKBClient] Saving tool:', tool.slug);
  }
}

// Export singleton instance
export const agentKB = new AgentKBClient();