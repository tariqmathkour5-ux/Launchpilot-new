"use client";

import { useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface UseBlogDraftAutosaveOptions<T> {
  /** The current in-progress form state to save. */
  data: T;
  /** Autosave does nothing while this is false (e.g. an empty, untouched form). */
  enabled: boolean;
  /** Persists `data` — the caller supplies this, using the existing create/update API. */
  onSave: (data: T) => Promise<void>;
  /** Debounce delay after the last change before saving. Default 3s. */
  intervalMs?: number;
  /**
   * The data as originally loaded (e.g. from the server), if any. Seeds the
   * "last saved" baseline so a freshly-opened editor with zero real edits
   * doesn't fire a pointless autosave the moment the debounce timer
   * elapses — there's nothing to save yet.
   */
  initialData?: T;
}

/**
 * Debounced draft autosave. Two request-optimization mechanisms, both
 * required for this to be usable in a text editor rather than firing a
 * request per keystroke:
 *  - Debounce: waits `intervalMs` after the *last* change before saving,
 *    so a burst of typing produces one request, not one per keystroke.
 *  - Dedup: skips saving entirely if `data` is unchanged (by JSON
 *    equality) since the last successful save — e.g. the user tabs away
 *    and back without editing anything.
 * Also guards against overlapping saves (a slow request completing after
 * a newer one was already scheduled).
 */
export function useBlogDraftAutosave<T>({
  data,
  enabled,
  onSave,
  intervalMs = 3000,
  initialData,
}: UseBlogDraftAutosaveOptions<T>) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>(initialData !== undefined ? JSON.stringify(initialData) : "");
  const savingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const serialized = JSON.stringify(data);
    if (serialized === lastSavedRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      if (savingRef.current) return;
      savingRef.current = true;
      setStatus("saving");

      try {
        await onSave(data);
        lastSavedRef.current = serialized;
        setStatus("saved");
      } catch {
        setStatus("error");
      } finally {
        savingRef.current = false;
      }
    }, intervalMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data), enabled, intervalMs]);

  return { status };
}
