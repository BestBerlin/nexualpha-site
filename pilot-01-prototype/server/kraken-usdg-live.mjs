// Live figures of the Kraken 5M USDG Futures Challenge (/activities/kraken-usdg-challenge, owner 2026-10-13) for
// /intel/kraken-usdg.json. Kraken's challenge page server-renders its competition data (community volume, active tier,
// top-5 leaderboard) into the public HTML, no login. The server reads it at most once every 10 minutes, on demand (no
// background timer), keeps the last good answer and never fills or estimates a missing number: an answer whose tiers no
// longer match the published rules is rejected and the page keeps the figures it was rendered with.
import { KRAKEN_USDG_OFFICIAL_URL, KRAKEN_USDG_TIERS } from "../src/data/kraken-usdg.js";

export const KRAKEN_USDG_LIVE_PATH = "/intel/kraken-usdg.json";
export const KRAKEN_USDG_LIVE_SOURCE = KRAKEN_USDG_OFFICIAL_URL;
const COMPETITION = "futures-5m-usdg-challenge-10-26";
const TTL_MS = 10 * 60 * 1000;
const STALE_MS = 2 * 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 10000;

const amount = (value) => {
  const n = Number(value?.amount ?? value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};

/** The JSON object that starts at `start` (a "{"), read with string-aware brace matching, or throws. */
function objectAt(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    const c = text[i];
    if (c === '"') {
      for (i += 1; i < text.length && text[i] !== '"'; i += 1) if (text[i] === "\\") i += 1;
    } else if (c === "{") depth += 1;
    else if (c === "}" && (depth -= 1) === 0) return JSON.parse(text.slice(start, i + 1));
  }
  throw new Error("unterminated competition object");
}

/** The competition result object embedded in the challenge page HTML, or throws. */
export function extractKrakenCompetition(html) {
  const text = String(html || "");
  const marker = text.indexOf('"individual_leaderboard":[');
  if (marker < 0) throw new Error("no leaderboard in the page");
  const key = text.lastIndexOf('"result":{', marker);
  if (key < 0) throw new Error("no competition result in the page");
  return objectAt(text, key + '"result":'.length);
}

/** Validated public figures, or throws. Tier thresholds and pools must be the published ones. */
export function normalizeKrakenUsdg(result, { now = Date.now() } = {}) {
  if (!result || result.name !== COMPETITION) throw new Error("unexpected competition");
  const tiers = result.prize?.tiers;
  if (!Array.isArray(tiers) || tiers.length !== KRAKEN_USDG_TIERS.length) throw new Error("tier count changed");
  tiers.forEach((t, i) => {
    const threshold = i === 0 ? 0 : amount(t.activation_threshold);
    const pool = (t.prize_pools || []).reduce((sum, p) => sum + (amount(p.pool_size?.direct) || 0), 0);
    if (threshold !== KRAKEN_USDG_TIERS[i].threshold || Math.abs(pool - KRAKEN_USDG_TIERS[i].pool) > 1) throw new Error(`tier ${i + 1} differs from the rules`);
  });
  const progress = result.prize_tier_progress || {};
  const activeTier = Number(progress.active_tier_index);
  const communityVolume = amount(progress.current_activation_metric);
  if (!Number.isInteger(activeTier) || activeTier < 0 || activeTier >= tiers.length) throw new Error("invalid active tier");
  if (communityVolume === null) throw new Error("missing community volume");
  const leaderboard = (Array.isArray(result.individual_leaderboard) ? result.individual_leaderboard : []).slice(0, 5).map((row) => ({
    rank: Number(row.rank),
    name: /^[A-Za-z0-9]{1,40}$/.test(String(row.display_name || "")) ? String(row.display_name) : null,
    volume: amount(row.trade_volume),
  }));
  if (leaderboard.some((row) => !Number.isInteger(row.rank) || row.rank < 1 || !row.name || row.volume === null)) throw new Error("invalid leaderboard row");
  return { communityVolume, activeTier, leaderboard, source: "www.kraken.com", fetchedAt: new Date(now).toISOString() };
}

export function createKrakenUsdgLive({ enabled = true, fetchImpl = fetch, now = () => Date.now(), log = () => {} } = {}) {
  let last = null;
  let lastAt = -Infinity;
  let inflight = null;
  const refresh = async () => {
    const response = await fetchImpl(KRAKEN_USDG_LIVE_SOURCE, {
      headers: { accept: "text/html", "accept-language": "en-US,en;q=0.8", "user-agent": "Mozilla/5.0 (compatible; NexuAlphaCampaignReader/1.0; +https://nexualpha.com)" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return normalizeKrakenUsdg(extractKrakenCompetition(await response.text()), { now: now() });
  };
  async function read() {
    if (!enabled) return null;
    if (now() - lastAt >= TTL_MS) {
      inflight ||= refresh().then((next) => { last = next; lastAt = now(); }).catch((error) => {
        // Keep the last good figures; retry on the next request after a short pause.
        lastAt = now() - TTL_MS + 60_000;
        log(`kraken usdg challenge refresh failed: ${error?.message || error}`);
      }).finally(() => { inflight = null; });
      await inflight;
    }
    if (!last || now() - Date.parse(last.fetchedAt) > STALE_MS) return null;
    return last;
  }
  return {
    read,
    async respond(method = "GET") {
      const data = await read();
      if (!data) return new Response(method === "HEAD" ? null : "Not Found", { status: 404, headers: { "cache-control": "no-store" } });
      return new Response(method === "HEAD" ? null : `${JSON.stringify(data)}\n`, { status: 200, headers: {
        "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300", "x-content-type-options": "nosniff",
      } });
    },
  };
}
