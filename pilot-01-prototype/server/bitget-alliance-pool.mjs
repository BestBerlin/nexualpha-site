// Live prize pool of the Bitget Alliance campaign (/activities/bitget-alliance, owner 2026-10-13) for
// /intel/bitget-alliance.json. Bitget's campaign page reads the same public endpoint without a login
// (POST www.bitget.com/v1/act/withdraw/special/v2/getActivityInfo). The server asks at most once every 10 minutes, on
// demand (no background timer), keeps the last good answer, and never fills or estimates a missing number: an invalid
// answer is rejected and the page keeps the figures it was rendered with.
export const BITGET_ALLIANCE_POOL_PATH = "/intel/bitget-alliance.json";
export const BITGET_ALLIANCE_POOL_SOURCE = "https://www.bitget.com/v1/act/withdraw/special/v2/getActivityInfo";
const TTL_MS = 10 * 60 * 1000;
const STALE_MS = 3 * 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 6000;

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};

/** Validated public figures, or throws. Pools must add up (60/40 split of the total) and the data day must be a date. */
export function normalizeBitgetAlliancePool(raw, { now = Date.now() } = {}) {
  if (!raw || String(raw.code) !== "00000" || !raw.data || typeof raw.data !== "object") throw new Error("invalid Bitget response envelope");
  const d = raw.data;
  const out = {
    statDay: typeof d.displayStatDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.displayStatDay) ? d.displayStatDay : null,
    totalPool: num(d.totalRewardPool), tradePool: num(d.tradeRewardPool), assetPool: num(d.fundRewardPool),
    dailyTradePool: num(d.dailyTradeRewardPool), dailyAssetPool: num(d.dailyFundRewardPool),
    tradeVolume: num(d.tradeDailyRankTotalVolume), assetValue: num(d.fundDailyRankTotalVolume),
  };
  for (const [key, value] of Object.entries(out)) if (value === null) throw new Error(`missing ${key}`);
  if (out.totalPool <= 0 || Math.abs(out.tradePool + out.assetPool - out.totalPool) > Math.max(1, out.totalPool * 0.001)) throw new Error("pool parts do not add up");
  if (Date.parse(`${out.statDay}T00:00:00Z`) > now + 2 * 864e5) throw new Error("data day in the future");
  return { ...out, source: "www.bitget.com", fetchedAt: new Date(now).toISOString() };
}

export function createBitgetAlliancePool({ enabled = true, fetchImpl = fetch, now = () => Date.now(), log = () => {} } = {}) {
  let last = null;
  let lastAt = -Infinity;
  let inflight = null;
  const refresh = async () => {
    const response = await fetchImpl(BITGET_ALLIANCE_POOL_SOURCE, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", "user-agent": "NexuAlphaCampaignReader/1.0 (+https://nexualpha.com)" },
      body: "{}",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return normalizeBitgetAlliancePool(await response.json(), { now: now() });
  };
  async function read() {
    if (!enabled) return null;
    if (now() - lastAt >= TTL_MS) {
      inflight ||= refresh().then((next) => { last = next; lastAt = now(); }).catch((error) => {
        // Keep the last good figures; retry on the next request after a short pause.
        lastAt = now() - TTL_MS + 60_000;
        log(`bitget alliance pool refresh failed: ${error?.message || error}`);
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
