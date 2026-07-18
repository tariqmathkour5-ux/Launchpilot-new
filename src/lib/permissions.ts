import { auth } from "@/lib/auth";

export type PermissionResource =
  | "tools"
  | "users"
  | "companies"
  | "reviews"
  | "categories"
  | "settings"
  | "analytics"
  | "media"
  | "affiliates"
  | "ads"
  | "coupons"
  | "blogPosts"
  | "blogCategories"
  | "blogComments";

export type PermissionAction =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "moderate"
  | "manage"
  | "upload";

const LEGACY_ROLE_PERMISSIONS: Record<string, PermissionAction[]> = {
  ADMIN: ["read", "create", "update", "delete", "moderate", "manage", "upload"],
  // "moderate" added here for blog comment moderation (Tasks 27/28 already
  // let EDITOR approve/reject/delete comments in the live routes — this
  // extension has to match that already-shipped behavior, not quietly
  // tighten it just because hasPermission() previously had no callers to
  // notice the difference).
  EDITOR: ["read", "create", "update", "upload", "moderate"],
  USER: ["read"],
};

export async function hasPermission(
  resource: PermissionResource,
  action: PermissionAction
): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;

  const userRole = session.user.role;

  // Check legacy role permissions
  if (userRole in LEGACY_ROLE_PERMISSIONS) {
    return LEGACY_ROLE_PERMISSIONS[userRole].includes(action);
  }

  return false;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { authorized: false, error: "Unauthorized", status: 401 };
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "EDITOR") {
    return { authorized: false, error: "Forbidden", status: 403 };
  }

  return { authorized: true, user: session.user };
}

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { authorized: false, error: "Unauthorized", status: 401 };
  }

  if (session.user.role !== "ADMIN") {
    return { authorized: false, error: "Forbidden", status: 403 };
  }

  return { authorized: true, user: session.user };
}

export function isAdmin(role: string): boolean {
  return role === "ADMIN" || role === "EDITOR";
}
