import { hasPermission } from '@/lib/permissions';

// =====================================================
// BLOG PERMISSION SYSTEM
// Every function here is a thin, named wrapper around the existing
// hasPermission() from src/lib/permissions.ts — no session decoding, no
// role comparisons, no authentication logic of any kind lives in this
// file. This module exists to give the six actions this task asks about
// clear, self-documenting names instead of scattering
// hasPermission('blogPosts', 'manage')-style calls (and their exact
// resource/action string pairs) across every blog route.
// =====================================================

export async function canCreateBlogPosts(): Promise<boolean> {
  return hasPermission('blogPosts', 'create');
}

export async function canEditBlogPosts(): Promise<boolean> {
  return hasPermission('blogPosts', 'update');
}

export async function canDeleteBlogPosts(): Promise<boolean> {
  return hasPermission('blogPosts', 'delete');
}

/**
 * Publishing (and archiving) is mapped to the "manage" action, which only
 * ADMIN has — matching the ADMIN-only publish/archive rule already built
 * into assertCanSetStatus() in blog-post-service.ts (Task 31). This
 * doesn't replace that check; a caller that wants the exact same rule the
 * status-transition logic already enforces can use either — they're
 * intentionally consistent, not two different sources of truth.
 */
export async function canPublishBlogPosts(): Promise<boolean> {
  return hasPermission('blogPosts', 'manage');
}

/**
 * Category create/update/delete is ADMIN-only in the already-shipped
 * routes (Task 2: GET allows EDITOR, POST/PUT/DELETE do not) — mapped to
 * "manage" to match, not to introduce a new restriction.
 */
export async function canManageBlogCategories(): Promise<boolean> {
  return hasPermission('blogCategories', 'manage');
}

/**
 * Comment moderation (approve/reject/delete) already allows both ADMIN
 * and EDITOR in the shipped routes (Tasks 27/28) — mapped to "moderate",
 * which EDITOR was given specifically for this in src/lib/permissions.ts.
 */
export async function canManageBlogComments(): Promise<boolean> {
  return hasPermission('blogComments', 'moderate');
}
