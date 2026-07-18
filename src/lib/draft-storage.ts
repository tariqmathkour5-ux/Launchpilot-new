const PREFIX = "lp_blog_draft_";

export interface LocalDraftSnapshot<T> {
  data: T;
  savedAt: number;
}

/**
 * Local-only safety net for a new, not-yet-created post: until the first
 * server-side autosave succeeds, there's no post id to restore from, so a
 * closed tab or crashed browser would lose everything. This snapshots the
 * in-progress form to localStorage on every debounced change (cheap,
 * zero-latency, no network) so there's still something to recover.
 * Once the post actually exists server-side, the server is authoritative
 * and this snapshot is cleared (clearLocalDraft) — this is not a second,
 * competing persistence layer, only a bridge until the real one exists.
 */
export function saveLocalDraft<T>(key: string, data: T): void {
  try {
    const snapshot: LocalDraftSnapshot<T> = { data, savedAt: Date.now() };
    localStorage.setItem(PREFIX + key, JSON.stringify(snapshot));
  } catch {
    // Storage unavailable (private browsing, quota, disabled) — this is a
    // safety net, not the primary save path, so failing silently is fine.
  }
}

export function loadLocalDraft<T>(key: string): LocalDraftSnapshot<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as LocalDraftSnapshot<T>) : null;
  } catch {
    return null;
  }
}

export function clearLocalDraft(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // Nothing to do if storage isn't available.
  }
}
