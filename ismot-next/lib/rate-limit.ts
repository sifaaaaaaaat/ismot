/**
 * Small fixed-window limiter for public endpoints.
 *
 * It is per server instance, which is exactly the level of protection a form
 * like this needs (it stops a stuck retry loop or a trivial script). Durable
 * spam protection lives with the data: the submission id is unique in the
 * database, and the same phone number is refused for a short cool-down.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();

  // Keep the map from growing without bound on a long-lived instance.
  if (buckets.size > 5000) {
    for (const [k, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }

  return { ok: true };
}

/** Client address, best effort — only ever used as a rate-limit key. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}
