type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Limite simple en mémoire (par instance). Pour cluster, utiliser Redis. */
export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= maxAttempts) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
