// =====================================================
// MINIMAL RATE LIMITING
// No Redis, Upstash, or any external rate-limiting service is a
// dependency anywhere in this codebase — there was nothing to reuse.
// This is a small, self-contained, in-memory sliding-window limiter for
// the blog's fully-public, unauthenticated write endpoints
// (POST /api/blog/comments, POST /api/blog/views), which are the actual
// abuse targets (comment spam, view-count inflation).
//
// Known, stated limitation: this is per-process memory. In a serverless
// or multi-instance deployment, each instance has its own counters, so
// the effective limit is (per-instance limit) x (instance count), not a
// true global limit. That's an honest constraint of not having a shared
// store available, not a design flaw being hidden — a real fix would be
// Redis/Upstash-backed, which is infrastructure this task doesn't add.
// =====================================================

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Cheap unbounded-growth guard so `buckets` doesn't grow forever over the
// process lifetime — only matters for long-lived processes.
const MAX_TRACKED_KEYS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Fixed-window rate limit check. `key` is caller-supplied — typically an
 * IP address, or IP + resource.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    if (buckets.size > MAX_TRACKED_KEYS) {
      const oldestFirst = Array.from(buckets.entries()).sort((a, b) => a[1].windowStart - b[1].windowStart);
      for (const [staleKey] of oldestFirst.slice(0, buckets.size - MAX_TRACKED_KEYS)) {
        buckets.delete(staleKey);
      }
    }
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count };
}

/** Best-effort client IP extraction — the same header Task 29's view tracker already reads. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  return forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
}
