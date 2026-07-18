#!/usr/bin/env ts-node

/**
 * Growth Automation - Database Backup Script
 * Backs up SQLite dev.db to backups/ directory on every build
 */

import { existsSync, mkdirSync, copyFileSync, statSync } from 'fs';
import { join } from 'path';
import { prisma } from '../src/lib/prisma';

const BACKUP_DIR = join(process.cwd(), 'backups');
const DB_PATH = join(process.cwd(), 'prisma', 'dev.db');

function createBackup(): void {
  try {
    // Create backups directory if it doesn't exist
    if (!existsSync(BACKUP_DIR)) {
      mkdirSync(BACKUP_DIR, { recursive: true });
      console.log(`[GrowthAutomation] Created backups directory: ${BACKUP_DIR}`);
    }

    // Generate timestamp for backup filename
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .substring(0, 19);
    
    const backupFilename = `dev.db.backup.${timestamp}`;
    const backupPath = join(BACKUP_DIR, backupFilename);

    // Check if source DB exists
    if (!existsSync(DB_PATH)) {
      console.log(`[GrowthAutomation] No database found at ${DB_PATH} - skipping backup`);
      return;
    }

    // Copy the database file
    copyFileSync(DB_PATH, backupPath);
    
    const stats = statSync(backupPath);
    const sizeKB = (stats.size / 1024).toFixed(2);

    console.log(`[GrowthAutomation] ✅ Database backed up successfully`);
    console.log(`[GrowthAutomation] Source: ${DB_PATH}`);
    console.log(`[GrowthAutomation] Destination: ${backupPath}`);
    console.log(`[GrowthAutomation] Size: ${sizeKB} KB`);

    // Log to activity log if prisma is available
    logActivity('DB_BACKUP', 'system', undefined, {
      backupPath,
      sizeKB,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error(`[GrowthAutomation] ❌ Backup failed:`, error);
  }
}

async function logActivity(
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        resource,
        resourceId,
        details: details ? JSON.stringify(details) : undefined,
        ipAddress: 'system',
        userAgent: 'build-script',
      },
    });
  } catch (e) {
    // Ignore logging errors during backup
  }
}

// Run backup
createBackup();

// Close prisma connection
prisma.$disconnect().catch(() => {});