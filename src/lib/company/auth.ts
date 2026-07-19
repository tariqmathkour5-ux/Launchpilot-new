import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export type CompanyRole = 'owner' | 'administrator' | 'editor' | 'marketing_manager' | 'support_agent' | 'analytics_viewer';

export interface CompanyMember {
  companyId: string;
  userId: string;
  role: CompanyRole;
}

export const ROLE_PERMISSIONS: Record<CompanyRole, string[]> = {
  owner: ['read', 'write', 'delete', 'team', 'billing', 'analytics', 'campaigns', 'leads', 'media', 'reviews', 'verification'],
  administrator: ['read', 'write', 'delete', 'team', 'analytics', 'campaigns', 'leads', 'media', 'reviews'],
  editor: ['read', 'write', 'media', 'reviews'],
  marketing_manager: ['read', 'write', 'campaigns', 'leads', 'media', 'analytics'],
  support_agent: ['read', 'reviews', 'leads'],
  analytics_viewer: ['read', 'analytics'],
};

export async function getCompanySession(companyId?: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  // Check if admin (full access to all companies)
  const userRows = await prisma.$queryRaw<Array<{ role: string }>>`
    SELECT "legacyRole" as role FROM "User" WHERE id = ${userId}
  `;
  const isAdmin = userRows[0]?.role === 'ADMIN';

  if (isAdmin) {
    return { userId, companyId: companyId || null, role: 'administrator' as CompanyRole, isAdmin: true };
  }

  if (!companyId) {
    // Find any company this user belongs to
    const memberships = await prisma.$queryRaw<Array<{ company_id: string; role: string }>>`
      SELECT company_id, role FROM company_members
      WHERE user_id = ${userId} AND status = 'active'
      LIMIT 1
    `;
    if (!memberships[0]) return null;
    return { userId, companyId: memberships[0].company_id, role: memberships[0].role as CompanyRole, isAdmin: false };
  }

  const membership = await prisma.$queryRaw<Array<{ role: string }>>`
    SELECT role FROM company_members
    WHERE user_id = ${userId} AND company_id = ${companyId} AND status = 'active'
  `;

  if (!membership[0]) return null;
  return { userId, companyId, role: membership[0].role as CompanyRole, isAdmin: false };
}

export function hasPermission(role: CompanyRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermission(role: CompanyRole, permission: string) {
  if (!hasPermission(role, permission)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }
  return null;
}

export async function sendCompanyNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  try {
    await prisma.$executeRaw`
      INSERT INTO "Notification" ("id", "userId", "type", "title", "message", "data", "read", "createdAt")
      VALUES (
        gen_random_uuid()::text,
        ${userId},
        ${type},
        ${title},
        ${message},
        ${JSON.stringify(data || {})}::jsonb,
        false,
        now()
      )
    `;
  } catch { /* Notification failure is non-critical */ }
}

export const ROLE_LABELS: Record<CompanyRole, string> = {
  owner: 'Owner',
  administrator: 'Administrator',
  editor: 'Editor',
  marketing_manager: 'Marketing Manager',
  support_agent: 'Support Agent',
  analytics_viewer: 'Analytics Viewer',
};
