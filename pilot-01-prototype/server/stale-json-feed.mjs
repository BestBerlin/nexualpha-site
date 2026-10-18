// A single refresh per TTL, with a bounded wait and an indefinitely retained last good payload.
export const STALE_JSON_CACHE_CONTROL = 'public, max-age=10, stale-while-revalidate=60';
export function createStaleJsonFeed({ load, ttlMs = 15000, timeoutMs = 3000, now = Date.now, log = () => {}, cacheControl = STALE_JSON_CACHE_CONTROL }) {
  let snapshot = null, goodAt = 0, attemptedAt = null, pending = null, failed = false, flight = 0;
  // 2026-10-18: the ticker froze for three days. The in-flight promise used to be released only when the *source*
  // settled, so one Binance request that ignored its abort kept every later refresh waiting on it forever and
  // /api/ticker.json served the same frame. Now the flight ends with the bounded race (finally), and a flight older
  // than 2x the TTL is abandoned regardless; a result that arrives after its flight ended is ignored.
  const refresh = () => {
    // (ttlMs 0 = no cache: concurrent cold reads still share one flight until its own timeout)
    if (pending && attemptedAt !== null && now() - attemptedAt < (ttlMs > 0 ? 2 * ttlMs : timeoutMs)) return pending;
    const id = ++flight;
    attemptedAt = now();
    const controller = new AbortController();
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('feed refresh timed out')); }, timeoutMs);
    });
    const source = Promise.resolve().then(() => load(controller.signal));
    source.catch(() => {}); // the timeout may win; a late rejection is not an unhandled error
    const current = Promise.race([source, timeout])
      .then((next) => {
        if (id !== flight) return;
        if (next && typeof next === 'object' && !next.stale) { snapshot = next; goodAt = now(); failed = false; }
        else {
          // A backing reader may already hold the process's last good frame (for example, primed by SSR).
          if (!snapshot && next && typeof next === 'object' && next.stale) snapshot = next;
          failed = true;
        }
      })
      .catch((error) => { if (id === flight) failed = true; log(`feed refresh failed: ${error?.message || error}`); })
      .finally(() => {
        clearTimeout(timer);
        if (pending === current) pending = null;
      });
    pending = current;
    return current;
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
