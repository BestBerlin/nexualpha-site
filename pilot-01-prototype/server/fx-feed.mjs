// Public fiat FX snapshot for converter pages. The open ExchangeRate-API endpoint is USD-based, updates daily, and
// includes all converter fiat currencies. A failed refresh keeps the last good snapshot for a bounded stale window; the
// endpoint never fills missing currencies or fabricates rates.
export const FX_JSON_PATH = "/intel/fx.json";
export const FX_SOURCE_URL = "https://open.er-api.com/v6/latest/USD";
export const FX_SOURCE_NAME = "Rates By Exchange Rate API";
export const FX_ATTRIBUTION_HTML = '<a href="https://www.exchangerate-api.com">Rates By Exchange Rate API</a>';
export const CONVERTER_FIATS = Object.freeze(["USD", "EUR", "BRL", "TRY", "IDR", "VND", "MXN", "JPY", "KRW", "CNY", "GBP", "INR"]);

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_STALE_MS = 7 * DAY_MS;
const DEFAULT_TIMEOUT_MS = 8000;
const SOURCE_FUTURE_GRACE_MS = 5 * 60 * 1000;

function positiveNumber(value) {
  return Number.isFinite(value) && value > 0;
}

function isoFromUnixSeconds(value) {
  return Number.isFinite(value) && value > 0 ? new Date(value * 1000).toISOString() : null;
}

export function normalizeFxSnapshot(raw, { sourceUrl = FX_SOURCE_URL, now = Date.now(), maxSourceAgeMs = DEFAULT_STALE_MS, futureGraceMs = SOURCE_FUTURE_GRACE_MS } = {}) {
  if (!raw || raw.result !== "success" || raw.base_code !== "USD" || !raw.rates || typeof raw.rates !== "object") {
    throw new Error("invalid FX response envelope");
  }

  const rates = {};
  for (const code of CONVERTER_FIATS) {
    const rate = Number(raw.rates[code]);
    if (!positiveNumber(rate)) throw new Error(`missing or invalid ${code} FX rate`);
    rates[code] = rate;
  }
  if (rates.USD !== 1) throw new Error("USD FX rate must be 1");

  const generatedAt = isoFromUnixSeconds(Number(raw.time_last_update_unix))
    || (raw.time_last_update_utc ? new Date(raw.time_last_update_utc).toISOString() : null);
  if (!generatedAt || Number.isNaN(Date.parse(generatedAt))) throw new Error("missing valid FX update time");
  const generatedAtMs = Date.parse(generatedAt);
  if (generatedAtMs < now - maxSourceAgeMs) throw new Error("FX source update is too old");
  if (generatedAtMs > now + futureGraceMs) throw new Error("FX source update is in the future");

  return {
    generatedAt,
    base: "USD",
    rates,
    source: FX_SOURCE_NAME,
    sourceUrl,
    provider: "ExchangeRate-API",
    providerUrl: typeof raw.provider === "string" ? raw.provider : "https://www.exchangerate-api.com",
    documentation: typeof raw.documentation === "string" ? raw.documentation : "https://www.exchangerate-api.com/docs/free",
    termsOfUse: typeof raw.terms_of_use === "string" ? raw.terms_of_use : "https://www.exchangerate-api.com/terms",
    attribution: "Rates By Exchange Rate API",
    attributionHtml: FX_ATTRIBUTION_HTML,
    fetchedAt: new Date(now).toISOString(),
    nextUpdateAt: isoFromUnixSeconds(Number(raw.time_next_update_unix))
      || (raw.time_next_update_utc ? new Date(raw.time_next_update_utc).toISOString() : null),
  };
}

export async function fetchFxSnapshot({ sourceUrl = FX_SOURCE_URL, fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS, now = Date.now } = {}) {
  const response = await fetchImpl(sourceUrl, {
    headers: { accept: "application/json", "user-agent": "NexuAlphaFxReader/1.0 (+https://nexualpha.com)" },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`FX source HTTP ${response.status}`);
  return normalizeFxSnapshot(await response.json(), { sourceUrl, now: now() });
}

function withFreshness(snapshot, { currentTime, lastGoodAt, lastError, everyMs }) {
  const sourceAgeMs = currentTime - Date.parse(snapshot.generatedAt);
  const stale = Boolean(lastError) || currentTime - lastGoodAt >= everyMs || sourceAgeMs >= everyMs;
  return {
    ...snapshot,
    status: stale ? "stale" : "ok",
    freshness: stale ? "stale" : "fresh",
    stale,
    lastGoodAt: new Date(lastGoodAt).toISOString(),
    ...(lastError ? { lastError } : {}),
  };
}

export function createFxFeed({
  sourceUrl = FX_SOURCE_URL, everyMs = DAY_MS, staleMs = DEFAULT_STALE_MS, timeoutMs = DEFAULT_TIMEOUT_MS,
  enabled = true, fetchImpl = fetch, now = Date.now, log = () => {},
} = {}) {
  let snapshot = null, lastGoodAt = 0, lastError = null, refreshing = null;
  const refresh = () => {
    if (refreshing) return refreshing;
    refreshing = fetchFxSnapshot({ sourceUrl, fetchImpl, timeoutMs, now })
      .then((next) => {
        if (snapshot && Date.parse(next.generatedAt) < Date.parse(snapshot.generatedAt)) {
          throw new Error("FX source update is older than the snapshot in memory");
        }
        snapshot = next;
        lastGoodAt = now();
        lastError = null;
        log(`fx refreshed: ${Object.keys(next.rates).length} fiat rates`);
        return next;
      })
      .catch((error) => {
        lastError = String(error?.message || error);
        log(`fx refresh failed: ${lastError}`);
        return null;
      })
      .finally(() => { refreshing = null; });
    return refreshing;
  };

  let timer = null;
  if (enabled) {
    refresh();
    timer = setInterval(refresh, everyMs);
    timer.unref?.();
  }

  const read = async () => {
      if (!snapshot && refreshing) await refreshing;
      if (!snapshot) return null;
      const currentTime = now();
      if (currentTime - lastGoodAt > staleMs || currentTime - Date.parse(snapshot.generatedAt) > staleMs) return null;
      return withFreshness(snapshot, { currentTime: now(), lastGoodAt, lastError, everyMs });
  };
  return {
    refresh,
    stop: () => { if (timer) clearInterval(timer); },
    read,
    async respond(method = "GET") {
      const current = await read();
      if (!current) {
        return new Response(JSON.stringify({
          status: "unavailable",
          reasonCode: snapshot ? "FX_SNAPSHOT_STALE" : "FX_SNAPSHOT_UNAVAILABLE",
          base: "USD",
          rates: null,
          generatedAt: null,
          source: FX_SOURCE_NAME,
          sourceUrl,
          updatedAt: new Date(now()).toISOString(),
        }), { status: 503, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
      }
      return new Response(method === "HEAD" ? null : `${JSON.stringify(current)}\n`, {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": current.stale ? "public, max-age=60" : "public, max-age=300",
          "last-modified": new Date(current.generatedAt).toUTCString(),
          "x-content-type-options": "nosniff",
        },
      });
    },
  };
}
