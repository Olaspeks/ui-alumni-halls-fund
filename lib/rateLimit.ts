/**
 * Minimal in-memory sliding-window rate limiter for the donation-init
 * endpoint. Good enough for a single long-lived process (local dev, or a
 * small always-on server) and for demo purposes.
 *
 * Caveat (documented, not hidden): on Vercel's serverless runtime, each
 * function instance has its own memory, so this limit is per-instance,
 * not global. For a production deployment expecting real traffic, swap
 * this for Upstash Redis or Vercel KV (a five-line change — the call
 * site below is the only place that needs to change). Left out of the
 * default stack so the app has zero required extra services to demo.
 */

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 8;

export function checkRateLimit(key: string): { ok: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { ok: true };
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000);
    return { ok: false, retryAfterSeconds };
  }

  bucket.count += 1;
  return { ok: true };
}

// Periodically forget stale buckets so this doesn't grow unbounded on a
// long-lived process.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now - bucket.windowStart >= WINDOW_MS * 5) buckets.delete(key);
    }
  }, WINDOW_MS * 5).unref?.();
}
