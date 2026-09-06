/**
 * Per-IP login throttle, backed by the KV namespace already bound for the
 * incremental cache.
 *
 * Supabase Auth throttles too; this is the layer in front of it, so a credential
 * stuffing run dies at the edge instead of costing an Auth request each time.
 *
 * It fails OPEN. If KV is unreachable the attempt is allowed: locking the client
 * out of their own site because a cache is down is a worse outcome than letting
 * Supabase's own throttle handle it.
 *
 * KV is eventually consistent and per-colo, and this read-modify-write is not
 * atomic, so under a distributed attack the real ceiling is meaningfully above
 * LIMIT-per-WINDOW_MS. That's an acceptable trade here — Supabase Auth is the
 * second layer — but if a hard limit is ever needed, move this to a Durable
 * Object or Cloudflare's native rate-limiting binding instead.
 */

export const LIMIT = 8;
export const WINDOW_MS = 15 * 60 * 1000;

export type RateStore = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<unknown>;
  delete(key: string): Promise<unknown>;
};

export type RateResult = { allowed: boolean; retryAfterMs: number };

const key = (ip: string) => `login:${ip}`;

/** Records the attempt and reports whether it may proceed. */
export async function checkLoginRate(
  store: RateStore,
  ip: string,
  now: number = Date.now(),
): Promise<RateResult> {
  try {
    const raw = await store.get(key(ip));
    // Guard the shape, not just the parse: a malformed value would otherwise land in
    // the catch below and fail open for the whole TTL, silently disabling the throttle.
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const stamps: number[] = Array.isArray(parsed) ? parsed.filter((t) => typeof t === "number") : [];
    const recent = stamps.filter((t) => now - t < WINDOW_MS);

    if (recent.length >= LIMIT) {
      const oldest = Math.min(...recent);
      return { allowed: false, retryAfterMs: WINDOW_MS - (now - oldest) };
    }

    recent.push(now);
    await store.put(key(ip), JSON.stringify(recent), {
      expirationTtl: Math.ceil(WINDOW_MS / 1000),
    });
    return { allowed: true, retryAfterMs: 0 };
  } catch (err) {
    console.error("[ratelimit] store unavailable, failing open:", err);
    return { allowed: true, retryAfterMs: 0 };
  }
}

/** Called after a successful login so a legitimate user is never left throttled. */
export async function clearLoginRate(store: RateStore, ip: string): Promise<void> {
  try {
    await store.delete(key(ip));
  } catch (err) {
    console.error("[ratelimit] clear failed:", err);
  }
}

/**
 * Binds the check to the Workers KV namespace. Outside a Worker — `next dev`
 * without the OpenNext dev hook, or a unit test — there is no binding, so it
 * fails open by design.
 */
export async function loginRate(ip: string): Promise<RateResult> {
  const store = await kv();
  if (!store) return { allowed: true, retryAfterMs: 0 };
  return checkLoginRate(store, ip);
}

export async function loginRateClear(ip: string): Promise<void> {
  const store = await kv();
  if (store) await clearLoginRate(store, ip);
}

async function kv(): Promise<RateStore | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    return (env as unknown as { NEXT_INC_CACHE_KV?: RateStore }).NEXT_INC_CACHE_KV ?? null;
  } catch {
    return null;
  }
}
