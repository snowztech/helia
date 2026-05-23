import type { Context, MiddlewareHandler } from "hono";

/**
 * In-process sliding-window rate limiter. Keyed by the request's source
 * IP (falling back to a sentinel when we can't determine one). Holds the
 * timestamps of recent hits per key in a Map.
 *
 * Single-process deployment only. When we run multiple API instances we
 * swap this for a Redis-backed counter; the middleware interface stays
 * the same.
 */
interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

interface Options {
  windowMs: number;
  max: number;
  /** Optional override of the IP-resolution behavior (mainly for tests). */
  key?: (c: Context) => string;
}

export function rateLimit({ windowMs, max, key }: Options): MiddlewareHandler {
  return async (c, next) => {
    const id = key ? key(c) : clientIp(c);
    const now = Date.now();
    const cutoff = now - windowMs;

    let bucket = buckets.get(id);
    if (!bucket) {
      bucket = { hits: [] };
      buckets.set(id, bucket);
    }
    // Drop timestamps that have aged out of the window.
    while (bucket.hits.length > 0 && bucket.hits[0]! < cutoff) {
      bucket.hits.shift();
    }

    if (bucket.hits.length >= max) {
      const oldest = bucket.hits[0]!;
      const retryAfterSec = Math.max(
        1,
        Math.ceil((oldest + windowMs - now) / 1000),
      );
      c.header("Retry-After", String(retryAfterSec));
      return c.json(
        {
          error: "rate limit exceeded",
          retryAfterSec,
        },
        429,
      );
    }

    bucket.hits.push(now);
    return next();
  };
}

/**
 * Best-effort source IP. Honors `x-forwarded-for` (first hop) when present
 * (we're behind a reverse proxy in prod), falls back to the Node-adapter
 * remote address otherwise. Returns "unknown" if neither is available.
 */
function clientIp(c: Context): string {
  const xff = c.req.header("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = c.req.header("x-real-ip");
  if (realIp) return realIp;
  const remote = c.env?.incoming?.socket?.remoteAddress as
    | string
    | undefined;
  return remote ?? "unknown";
}

/**
 * Test/dev helper to wipe state between runs. Not exported via the route
 * surface, only for unit tests.
 */
export function _resetForTests(): void {
  buckets.clear();
}
