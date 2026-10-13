// Health probe for /go/okx-apk and /go/binance-apk (lead 2026-10-13). Follows the official URL's redirects by hand
// (at most 3 hops); every hop must stay on the venue's own APK host (OKX: *.okx.com, Binance: download.binance.com) and
// the final answer must be an Android APK. Healthy -> the official URL; anything else (error, timeout, another host, a
// non-APK response) -> the exchange's official download page. Results are cached (30 min healthy, 5 min unhealthy); an
// expired result is served while one refresh runs in the background, so only a cold start waits.
import { EXCHANGE_APKS, apkHostAllowed, isApkContentType } from '../src/data/exchange-apk.js';

const HEALTHY_TTL_MS = 30 * 60 * 1000;
const UNHEALTHY_TTL_MS = 5 * 60 * 1000;
const TIMEOUT_MS = 4000;
const MAX_HOPS = 3;

export async function checkApkChain(venue, fetchImpl = fetch, { timeoutMs = TIMEOUT_MS } = {}) {
  const apk = EXCHANGE_APKS[venue];
  if (!apk) return { healthy: false };
  const hops = [];
  try {
    let url = apk.officialUrl;
    for (let hop = 0; hop <= MAX_HOPS; hop += 1) {
      // Never request a URL outside the venue's own host.
      if (!apkHostAllowed(venue, url)) return { healthy: false, hops, offHost: url };
      let res = await fetchImpl(url, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
      if (res.status >= 300 && res.status < 400) {
        let next = null;
        try { next = new URL(res.headers.get('location') || '', url).href; } catch { next = null; }
        hops.push({ url, status: res.status });
        if (!next || !res.headers.get('location')) return { healthy: false, hops };
        if (!apkHostAllowed(venue, next) && apk.channelFile && new URL(next).pathname === apk.channelFile) {
          // OKX's own host redirected to a regional mirror for our channel file: healthy, mirror not requested.
          return { healthy: true, hops, mirror: next };
        }
        url = next;
        continue;
      }
      if (!(res.status >= 200 && res.status < 300)) {
        // Some CDNs refuse HEAD; a one-byte ranged GET answers with the same content type.
        res = await fetchImpl(url, { method: 'GET', redirect: 'manual', headers: { range: 'bytes=0-0' }, signal: AbortSignal.timeout(timeoutMs) });
        res.body?.cancel().catch(() => {});
      }
      const contentType = res.headers.get('content-type');
      hops.push({ url, status: res.status, contentType });
      return { healthy: res.status >= 200 && res.status < 300 && isApkContentType(contentType), hops };
    }
    return { healthy: false, hops, tooManyRedirects: true };
  } catch (error) {
    return { healthy: false, hops, error: String(error?.name || error) };
  }
}

export function createApkProbe(venue, { fetchImpl = fetch, now = () => Date.now(), check = checkApkChain } = {}) {
  const apk = EXCHANGE_APKS[venue];
  if (!apk) throw new Error(`unknown APK venue ${venue}`);
  let cached = null;
  let inflight = null;
  const refresh = () => {
    if (!inflight) {
      inflight = Promise.resolve()
        .then(() => check(venue, fetchImpl))
        .catch(() => ({ healthy: false }))
        .then((result) => { cached = { ...result, at: now() }; return cached; })
        .finally(() => { inflight = null; });
    }
    return inflight;
  };
  /** Resolves to the redirect target for /go/<venue>-apk. */
  async function target() {
    let state = cached;
    if (!state) state = await refresh();
    else if (now() - state.at > (state.healthy ? HEALTHY_TTL_MS : UNHEALTHY_TTL_MS)) refresh();
    return state.healthy ? apk.officialUrl : apk.fallbackUrl;
  }
  target.refresh = refresh;
  target.state = () => cached;
  return target;
}
