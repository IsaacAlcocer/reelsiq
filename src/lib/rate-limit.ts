// ---------------------------------------------------------------------------
// IP-based rate limiting + budget kill switch — Section 8
// ---------------------------------------------------------------------------

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_JOBS_PER_IP = 10;

interface BucketEntry {
  count: number;
  resetAt: number;
}

const ipBuckets = new Map<string, BucketEntry>();

/**
 * Returns `true` if the request should be allowed, `false` if rate-limited.
 */
export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  // Budget kill switch — set REELSIQ_KILL_SWITCH=1 to immediately block all new jobs
  if (process.env.REELSIQ_KILL_SWITCH === "1") {
    return { allowed: false, retryAfterMs: 0 };
  }

  const now = Date.now();
  const entry = ipBuckets.get(ip);

  if (!entry || now >= entry.resetAt) {
    ipBuckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= MAX_JOBS_PER_IP) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}
