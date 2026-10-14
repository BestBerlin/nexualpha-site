// A single refresh per TTL, with a bounded wait and an indefinitely retained last good payload.
export const STALE_JSON_CACHE_CONTROL = 'public, max-age=10, stale-while-revalidate=60';
export function createStaleJsonFeed({ load, ttlMs = 15000, timeoutMs = 3000, now = Date.now, log = () => {}, cacheControl = STALE_JSON_CACHE_CONTROL }) {
  let snapshot = null, goodAt = 0, attemptedAt = null, pending = null, failed = false;
  const refresh = () => {
    if (pending) return pending;
    attemptedAt = now();
    const controller = new AbortController();
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('feed refresh timed out')); }, timeoutMs);
    });
    const source = Promise.resolve().then(() => load(controller.signal));
    pending = Promise.race([source, timeout])
      .then((next) => {
        if (next && typeof next === 'object' && !next.stale) { snapshot = next; goodAt = now(); failed = false; }
        else {
          // A backing reader may already hold the process's last good frame (for example, primed by SSR).
          if (!snapshot && next && typeof next === 'object' && next.stale) snapshot = next;
          failed = true;
        }
      })
      .catch((error) => { failed = true; log(`feed refresh failed: ${error?.message || error}`); })
      .finally(() => { clearTimeout(timer); });
    // A source that ignores abort still owns the flight until it settles. Callers await only the bounded race.
    Promise.allSettled([source, pending]).then(() => { pending = null; });
    return pending;
  };
  const read = async () => {
    if (attemptedAt === null || now() - attemptedAt >= ttlMs) {
      const running = refresh();
      if (!snapshot) await running;
    } else if (!snapshot && pending) await pending;
    return snapshot && ((failed || now() - goodAt >= ttlMs) ? { ...snapshot, stale: true } : snapshot);
  };
  const respond = async (method = 'GET') => {
    const data = await read();
    const headers = { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex',
      'cache-control': data ? cacheControl : 'no-store' };
    return new Response(method === 'HEAD' ? null : JSON.stringify(data || { status: 'unavailable' }), { status: data ? 200 : 503, headers });
  };
  return { read, respond, refresh };
}
