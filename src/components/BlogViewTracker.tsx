"use client";

import { useEffect } from "react";

const SESSION_KEY = "lp_analytics_sid";

function getOrCreateSessionId(): string | undefined {
  try {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    // Storage blocked/unavailable (private browsing, etc.) — view still
    // gets recorded server-side, just without session-based deduping.
    return undefined;
  }
}

/**
 * Fires a fire-and-forget view-tracking request after the page has
 * already rendered and hydrated — this never delays or blocks the
 * server-rendered post content itself, which is the point of doing this
 * client-side rather than as an `await` inside the page's server component.
 */
export default function BlogViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    const sessionId = getOrCreateSessionId();

    fetch("/api/blog/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, sessionId }),
      keepalive: true,
    }).catch(() => {
      // Never surface a tracking failure to the reader.
    });
  }, [postId]);

  return null;
}
