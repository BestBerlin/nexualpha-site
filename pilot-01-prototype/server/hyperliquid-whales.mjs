// Hyperliquid whale engine (2026-10-14): wallet selection, polite polling and fill-based accumulation signals.
// Sources (free, public, no key): POST https://api.hyperliquid.xyz/info (clearinghouseState, userFillsByTime, spotMeta)
// and the public leaderboard file https://stats-data.hyperliquid.xyz/Mainnet/leaderboard.
// Rate limits: the info API allows 1200 weight/min per IP; clearinghouseState weighs 2, spotMeta 20 and
// userFillsByTime 20 plus 1 per 20 returned fills. One collector cycle spends at most HL_CYCLE_WEIGHT (~25% of the cap)
// and sleeps between calls; the 39 MB leaderboard file is fetched at most once every six hours.
// Signals are computed only from fills the wallets really made (persisted as per-day SGT buckets), never from guesses.
import { HYPERLIQUID_CURATED_WHALES } from "./hyperliquid-whale-list.mjs";

const UA = "NexuAlphaWhaleCollector/1.1 (+https://nexualpha.com)";
export const HL_INFO_URL = "https://api.hyperliquid.xyz/info";
export const HL_LEADERBOARD_URL = "https://stats-data.hyperliquid.xyz/Mainnet/leaderboard";
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const SGT_OFFSET_MS = 8 * HOUR;
export const HL_TRACK_LIMIT = 80;
export const HL_CYCLE_WEIGHT = 300;
const HL_LEADERBOARD_TTL_MS = 6 * HOUR;
const HL_SPOT_META_TTL_MS = 6 * HOUR;
const HL_STATE_INTERVAL_MS = 5 * 60_000;
const HL_FILLS_INTERVAL_MS = 15 * 60_000;
const HL_BACKFILL_MS = 7 * DAY;
const HL_BUCKET_RETENTION_MS = 8 * DAY;
const HL_TIMEOUT_MS = 10_000;
const MIN_ACCOUNT_USD = 2_000_000;
const MAX_MONTH_TURNOVER = 60;
const MIN_MONTH_TURNOVER = 0.2;
const MAJORS = new Set(["BTC", "ETH"]);

const finite = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const isEthAddress = (value) => /^0x[0-9a-f]{40}$/.test(String(value || ""));
const sleep = (ms) => (ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve());
export const sgtDay = (t) => Math.floor((t + SGT_OFFSET_MS) / DAY);
const compactAddress = (address) => {
  const raw = String(address || "");
  return raw.length > 12 ? `${raw.slice(0, 6)}…${raw.slice(-4)}` : raw;
};

export function emptyHyperliquidState() {
  return { tracked: { at: 0, addresses: [] }, cursors: {}, boundary: {}, stateAt: {}, fillsAt: {}, buckets: {}, spot: { at: 0, names: {} }, rotation: 0, back: {} };
}

export function normalizeHyperliquidState(raw) {
  const base = emptyHyperliquidState();
  if (!raw || typeof raw !== "object") return base;
  return {
    tracked: raw.tracked && Array.isArray(raw.tracked.addresses) ? { at: finite(raw.tracked.at) || 0, addresses: raw.tracked.addresses.filter(isEthAddress) } : base.tracked,
    cursors: raw.cursors && typeof raw.cursors === "object" ? raw.cursors : {},
    boundary: raw.boundary && typeof raw.boundary === "object" ? raw.boundary : {},
    stateAt: raw.stateAt && typeof raw.stateAt === "object" ? raw.stateAt : {},
    fillsAt: raw.fillsAt && typeof raw.fillsAt === "object" ? raw.fillsAt : {},
    buckets: raw.buckets && typeof raw.buckets === "object" ? raw.buckets : {},
    spot: raw.spot && typeof raw.spot === "object" && raw.spot.names ? raw.spot : base.spot,
    rotation: finite(raw.rotation) || 0,
    back: raw.back && typeof raw.back === "object" ? raw.back : {},
  };
}

const windowVolume = (row, key) => {
  const windows = Array.isArray(row?.windowPerformances) ? row.windowPerformances : [];
  const hit = windows.find((entry) => Array.isArray(entry) && entry[0] === key);
  return finite(hit?.[1]?.vlm) || 0;
};

// Directional whales: large accounts that traded this week, excluding vault/market-maker style turnover.
export function selectTrackedWhales(leaderboardRows = [], { curated = HYPERLIQUID_CURATED_WHALES, limit = HL_TRACK_LIMIT } = {}) {
  const excluded = new Set(curated.filter((row) => row.role === "mm").map((row) => row.address));
  const curatedTraders = new Set(curated.filter((row) => row.role !== "mm").map((row) => row.address));
  const scored = [];
  for (const row of Array.isArray(leaderboardRows) ? leaderboardRows : []) {
    const address = String(row?.ethAddress || row?.user || row?.address || "").toLowerCase();
    if (!isEthAddress(address) || excluded.has(address)) continue;
    const accountValue = finite(row.accountValue) || 0;
    const week = windowVolume(row, "week");
    const month = windowVolume(row, "month");
    if (accountValue < MIN_ACCOUNT_USD || week <= 0) continue;
    const turnover = month / accountValue;
    if (turnover < MIN_MONTH_TURNOVER || turnover > MAX_MONTH_TURNOVER) continue;
    scored.push({ address, score: accountValue * (curatedTraders.has(address) ? 1.5 : 1) });
  }
  scored.sort((a, b) => b.score - a.score);
  return [...new Set(scored.map((row) => row.address))].slice(0, limit);
}

async function postInfo(fetchImpl, body) {
  const res = await fetchImpl(HL_INFO_URL, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json", "user-agent": UA },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(HL_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`hyperliquid ${body.type} HTTP ${res.status}`);
  return res.json();
}

async function refreshTracked(fetchImpl, hl, now, log) {
  if (hl.tracked.addresses.length && now - hl.tracked.at < HL_LEADERBOARD_TTL_MS) return hl.tracked.addresses;
  try {
    const res = await fetchImpl(HL_LEADERBOARD_URL, { headers: { accept: "application/json", "user-agent": UA }, signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`leaderboard HTTP ${res.status}`);
    const payload = await res.json();
    const addresses = selectTrackedWhales(payload?.leaderboardRows || payload?.rows || payload);
    if (addresses.length) hl.tracked = { at: now, addresses };
  } catch (error) {
    log?.(`hyperliquid leaderboard: ${error?.message || error}`);
    if (!hl.tracked.addresses.length) {
      hl.tracked = { at: now - HL_LEADERBOARD_TTL_MS + 15 * 60_000, addresses: HYPERLIQUID_CURATED_WHALES.filter((row) => row.role !== "mm").map((row) => row.address).slice(0, HL_TRACK_LIMIT) };
    }
  }
  return hl.tracked.addresses;
}

export function spotNamesFromMeta(meta) {
  const tokens = Array.isArray(meta?.tokens) ? meta.tokens : [];
  const byIndex = new Map(tokens.map((token) => [token.index, token.name]));
  const names = {};
  for (const pair of Array.isArray(meta?.universe) ? meta.universe : []) {
    const base = byIndex.get(Array.isArray(pair.tokens) ? pair.tokens[0] : null);
    if (!base) continue;
    names[`@${pair.index}`] = base;
    if (pair.name) names[pair.name] = base;
  }
  return names;
}

async function refreshSpotNames(fetchImpl, hl, now, log) {
  if (Object.keys(hl.spot.names || {}).length && now - (hl.spot.at || 0) < HL_SPOT_META_TTL_MS) return 0;
  try {
    hl.spot = { at: now, names: spotNamesFromMeta(await postInfo(fetchImpl, { type: "spotMeta" })) };
  } catch (error) {
    log?.(`hyperliquid spotMeta: ${error?.message || error}`);
  }
  return 20;
}

// Polite polling: each cycle refreshes a rotating slice of wallets and stops once the weight budget is used.
export function createHyperliquidWhaleSource({ weightBudget = HL_CYCLE_WEIGHT, pauseMs = 250, stateIntervalMs = HL_STATE_INTERVAL_MS, fillsIntervalMs = HL_FILLS_INTERVAL_MS, log = () => {} } = {}) {
  return async function hyperliquidWhaleSource(fetchImpl, { wallets = [], now = Date.now(), state } = {}) {
    const hl = state?.hl || (state ? (state.hl = emptyHyperliquidState()) : emptyHyperliquidState());
    const configured = (wallets || []).map((row) => String(typeof row === "string" ? row : row?.address || "").toLowerCase()).filter(isEthAddress);
    const tracked = configured.length ? [...new Set(configured)].slice(0, HL_TRACK_LIMIT) : await refreshTracked(fetchImpl, hl, now, log);
    let weight = await refreshSpotNames(fetchImpl, hl, now, log);
    const out = new Map();
    const entryFor = (address) => out.get(address) || out.set(address, { address, source: "hyperliquid-info", fills: [], backfill: [] }).get(address);
    const start = tracked.length ? hl.rotation % tracked.length : 0;
    const order = tracked.map((_, i) => tracked[(start + i) % tracked.length]);
    let failures = 0;
    const call = async (body, cost) => {
      try {
        const result = await postInfo(fetchImpl, body);
        failures = 0;
        return result;
      } catch (error) {
        failures += 1;
        throw error;
      } finally {
        weight += typeof cost === "number" ? cost : 20;
        await sleep(pauseMs);
      }
    };
    const budgetLeft = () => weight < weightBudget && failures < 3; // three failed calls in a row: stop until next cycle
    // Phase 1 (cheap, weight 2): current positions for every wallet that is due.
    for (const address of order) {
      if (!budgetLeft()) break;
      if (now - (finite(hl.stateAt[address]) || 0) < stateIntervalMs) continue;
      try {
        entryFor(address).clearinghouseState = await call({ type: "clearinghouseState", user: address }, 2);
        hl.stateAt[address] = now;
      } catch (error) {
        entryFor(address).stateError = error?.message || String(error);
      }
    }
    // Phase 2: fills. First pull = the most recent 2,000 fills (userFills), then incremental userFillsByTime from the
    // cursor; older days inside the 7-day window are backfilled page by page with whatever budget remains.
    let visited = 0;
    for (const address of order) {
      if (!budgetLeft()) break;
      visited += 1;
      const back = hl.back?.[address];
      if (now - (finite(hl.fillsAt[address]) || 0) >= fillsIntervalMs) {
        const cursor = finite(hl.cursors[address]);
        try {
          const rows = cursor
            ? await call({ type: "userFillsByTime", user: address, startTime: Math.max(cursor, now - HL_BACKFILL_MS), endTime: now, aggregateByTime: true })
            : await call({ type: "userFills", user: address, aggregateByTime: true });
          const list = Array.isArray(rows) ? rows : [];
          weight += Math.ceil(list.length / 20);
          entryFor(address).fills.push(...list);
          if (!cursor && list.length >= 2000) {
            const oldest = Math.min(...list.map((row) => finite(row.time) || now));
            if (oldest > now - HL_BACKFILL_MS) (hl.back || (hl.back = {}))[address] = { next: now - HL_BACKFILL_MS, to: oldest };
          }
          if (cursor || list.length < 2000 || hl.back?.[address]) hl.fillsAt[address] = now;
          if (cursor && list.length >= 2000) hl.fillsAt[address] = now - fillsIntervalMs; // more pages waiting: next cycle
        } catch (error) {
          entryFor(address).fillsError = error?.message || String(error);
        }
      } else if (back && budgetLeft()) {
        try {
          const rows = await call({ type: "userFillsByTime", user: address, startTime: back.next, endTime: back.to - 1, aggregateByTime: true });
          const list = (Array.isArray(rows) ? rows : []).filter((row) => (finite(row.time) || 0) < back.to);
          weight += Math.ceil(list.length / 20);
          entryFor(address).backfill.push(...list);
          const last = list.length ? Math.max(...list.map((row) => finite(row.time) || 0)) : back.to;
          if (list.length < 2000 || last + 1 >= back.to) delete hl.back[address];
          else back.next = last + 1;
        } catch (error) {
          entryFor(address).fillsError = error?.message || String(error);
        }
      }
    }
    hl.rotation = (start + Math.max(1, visited)) % Math.max(1, tracked.length || 1);
    return [...out.values()].filter((entry) => entry.clearinghouseState || entry.fills.length || entry.backfill.length);
  };
}

const STABLE_RE = /^(USD|USDC|USDT|USDE|USDH|USDT0|FDUSD|DAI)/i;
function fillLegs(fill, coin) {
  const dir = String(fill?.dir || "");
  const sz = Math.abs(finite(fill?.sz) || 0);
  const start = finite(fill?.startPosition) || 0;
  if (!sz) return [];
  if (dir === "Buy") return [{ side: "spot", open: true, sz }];
  if (dir === "Sell") return [{ side: "spot", open: false, sz }];
  if (dir === "Open Long") return [{ side: "long", open: true, sz, fromZero: Math.abs(start) < 1e-12 }];
  if (dir === "Open Short") return [{ side: "short", open: true, sz, fromZero: Math.abs(start) < 1e-12 }];
  if (dir === "Close Long") return [{ side: "long", open: false, sz }];
  if (dir === "Close Short") return [{ side: "short", open: false, sz }];
  if (dir === "Long > Short") {
    const closeSz = Math.min(sz, Math.abs(start));
    return [{ side: "long", open: false, sz: closeSz }, { side: "short", open: true, sz: sz - closeSz, fromZero: true }].filter((leg) => leg.sz > 0);
  }
  if (dir === "Short > Long") {
    const closeSz = Math.min(sz, Math.abs(start));
    return [{ side: "short", open: false, sz: closeSz }, { side: "long", open: true, sz: sz - closeSz, fromZero: true }].filter((leg) => leg.sz > 0);
  }
  void coin;
  return [];
}

export function hyperliquidCoin(rawCoin, spotNames = {}) {
  const raw = String(rawCoin || "");
  if (!raw) return null;
  if (raw.startsWith("@") || raw.includes("/")) {
    const name = spotNames[raw];
    return name ? String(name).toUpperCase() : null;
  }
  if (raw.includes(":")) return null; // builder-deployed perp dexs: skip, names are not unique market-wide
  return raw.toUpperCase();
}

export function isLiquidationOf(fill, address) {
  const liq = fill?.liquidation;
  if (liq === true) return true;
  if (!liq || typeof liq !== "object") return false;
  const user = String(liq.liquidatedUser || "").toLowerCase();
  return !user || user === address;
}

function foldOne(hl, address, fill, now) {
  const t = finite(fill?.time);
  if (t == null || now - t > HL_BUCKET_RETENTION_MS) return 0;
  const coin = hyperliquidCoin(fill.coin, hl.spot?.names || {});
  const px = finite(fill.px);
  if (!coin || !px || STABLE_RE.test(coin)) return 0;
  const liquidated = isLiquidationOf(fill, address);
  let added = 0;
  for (const leg of fillLegs(fill, coin)) {
    const usd = leg.sz * px;
    const day = sgtDay(t);
    const key = `${address}|${coin}|${leg.side}|${day}`;
    const b = hl.buckets[key] || (hl.buckets[key] = { a: address, c: coin, s: leg.side, d: day, oU: 0, oS: 0, cU: 0, cS: 0, n: 0, h: [], t0: t, t1: t, pnl: 0, liqU: 0, nz: 0 });
    if (leg.open) { b.oU += usd; b.oS += leg.sz; } else { b.cU += usd; b.cS += leg.sz; }
    if (leg.open && leg.fromZero) b.nz = Math.max(b.nz, t);
    if (!leg.open) b.pnl += finite(fill.closedPnl) || 0;
    if (liquidated && !leg.open) b.liqU += usd;
    b.n += 1;
    const hour = Math.floor(t / HOUR);
    if (!b.h.includes(hour)) b.h.push(hour);
    b.t0 = Math.min(b.t0, t);
    b.t1 = Math.max(b.t1, t);
    added += 1;
  }
  return added;
}

// Fold fresh fills into per-wallet/coin/side/SGT-day buckets. Dedupes with a per-wallet time cursor plus the trade ids
// seen at that exact millisecond, so overlapping pages and restarts never double count.
export function foldHyperliquidFills(hl, walletPayloads, now) {
  let added = 0;
  for (const wallet of Array.isArray(walletPayloads) ? walletPayloads : []) {
    const address = String(wallet?.address || wallet?.user || "").toLowerCase();
    if (!isEthAddress(address)) continue;
    if (Array.isArray(wallet.backfill) && wallet.backfill.length) {
      // Backfill pages cover a range strictly older than the first pull, so they never overlap the cursor stream.
      for (const fill of wallet.backfill) added += foldOne(hl, address, fill, now);
    }
    if (!Array.isArray(wallet.fills) || !wallet.fills.length) continue;
    let cursor = finite(hl.cursors[address]) || 0;
    let boundary = new Set(Array.isArray(hl.boundary[address]) ? hl.boundary[address] : []);
    const fills = [...wallet.fills].sort((a, b) => (finite(a.time) || 0) - (finite(b.time) || 0));
    for (const fill of fills) {
      const t = finite(fill.time);
      if (t == null || t < cursor) continue;
      const id = String(fill.tid ?? `${fill.hash}:${fill.oid}:${fill.px}:${fill.sz}`);
      if (t === cursor && boundary.has(id)) continue;
      if (t > cursor) { cursor = t; boundary = new Set(); }
      boundary.add(id);
      added += foldOne(hl, address, fill, now);
    }
    hl.cursors[address] = cursor;
    hl.boundary[address] = [...boundary].slice(-200);
  }
  const cutoffDay = sgtDay(now - HL_BUCKET_RETENTION_MS);
  for (const [key, bucket] of Object.entries(hl.buckets)) if (bucket.d < cutoffDay) delete hl.buckets[key];
  return added;
}

const explorer = (address) => `https://app.hyperliquid.xyz/explorer/address/${address}`;
const MIN_DAY_USD = 50_000;

// Turns the buckets into plain-language intent signals: 连续加仓 / 减仓 / 新建仓 / 同步做多(空).
export function buildHyperliquidFillSignals(hl, { now = Date.now(), positions = new Map(), minUsd = 1_000_000 } = {}) {
  const groups = new Map();
  for (const bucket of Object.values(hl?.buckets || {})) {
    const key = `${bucket.a}|${bucket.c}|${bucket.s}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(bucket);
  }
  const today = sgtDay(now);
  const signals = [];
  const positionFor = (address, coin, side) => positions.get(`${address}:${coin}:${side}`) || null;
  const stateKnown = (address) => Boolean(finite(hl?.stateAt?.[address]));
  for (const [key, buckets] of groups) {
    const [address, coin, side] = key.split("|");
    buckets.sort((a, b) => a.d - b.d);
    for (const mode of ["add", "reduce"]) {
      const sign = mode === "add" ? 1 : -1;
      let run = null;
      for (let i = buckets.length - 1; i >= 0; i -= 1) {
        const b = buckets[i];
        const net = sign * (b.oU - b.cU);
        if (!run) {
          if (net < MIN_DAY_USD) break;
          if (today - b.d > 1) break; // the most recent move must be today or yesterday (SGT)
          run = { days: 0, net: 0, oU: 0, oS: 0, cU: 0, cS: 0, hours: new Set(), t0: b.t0, t1: b.t1, last: b.d, liqU: 0, pnl: 0 };
        } else if (net < 0 && -net > Math.max(MIN_DAY_USD, run.net * 0.1)) break;
        else if (run.last - b.d > 2) break; // allow a single quiet day inside a streak, not longer gaps
        if (net >= MIN_DAY_USD) run.days += 1;
        run.net += net;
        run.oU += b.oU; run.oS += b.oS; run.cU += b.cU; run.cS += b.cS;
        run.liqU += b.liqU; run.pnl += b.pnl;
        for (const h of b.h) run.hours.add(h);
        run.t0 = Math.min(run.t0, b.t0); run.t1 = Math.max(run.t1, b.t1); run.last = b.d;
      }
      if (!run || run.net < minUsd) continue;
      if (run.days < 2 && run.hours.size < 3) continue;
      const position = side === "spot" ? null : positionFor(address, coin, side);
      if (mode === "add" && side !== "spot" && stateKnown(address) && !position) continue; // already closed again
      if (mode === "reduce" && run.liqU > run.cU * 0.5) continue; // forced closes are liquidations, shown elsewhere
      const avgPx = mode === "add" ? (run.oS ? run.oU / run.oS : null) : (run.cS ? run.cU / run.cS : null);
      const type = mode === "add" ? (side === "short" ? "increase_short" : "accumulation") : (side === "short" ? "reduce_short" : "distribution");
      signals.push({
        id: `signal:hl:${address}:${coin}:${side}:${mode}`,
        category: "signal",
        type,
        signalType: type,
        mode,
        label: mode === "add" ? (side === "short" ? "加仓空单" : side === "spot" ? "买入" : "加仓") : (side === "short" ? "减仓空单" : side === "spot" ? "卖出" : "减仓"),
        source: "hyperliquid-fills",
        platform: "hyperliquid",
        market: side === "spot" ? "spot" : "perp",
        time: new Date(run.t1).toISOString(),
        coin,
        side,
        walletsCount: 1,
        addresses: [address],
        address,
        days: run.days,
        streak: run.days >= 2 ? "days" : "hours",
        activeHours: run.hours.size,
        totalUsd: run.net,
        sizeUsd: run.net,
        periodHours: Math.max(1, Math.round((run.t1 - run.t0) / HOUR)),
        period: run.days >= 2 ? `${run.days}d` : "24h",
        avgEntry: mode === "add" ? avgPx : null,
        avgExit: mode === "reduce" ? avgPx : null,
        positionUsd: position ? finite(position.notionalUsd) : null,
        leverage: position ? finite(position.leverage) : null,
        pnlUsd: position ? finite(position.unrealizedPnlUsd) : null,
        realizedPnlUsd: mode === "reduce" ? run.pnl : null,
        explorerUrl: explorer(address),
        explanation: `${compactAddress(address)} ${mode === "add" ? "added" : "reduced"} ${coin} ${side} on ${run.days} day(s), net $${Math.round(run.net).toLocaleString("en-US")}.`,
      });
    }
    // 新建仓: a position opened from zero within 72h that is still open and already large.
    const opened = buckets.filter((b) => b.nz && now - b.nz <= 72 * HOUR);
    if (side !== "spot" && opened.length) {
      const position = positionFor(address, coin, side);
      const notional = finite(position?.notionalUsd) || 0;
      if (position && notional >= minUsd && !signals.some((s) => s.id === `signal:hl:${address}:${coin}:${side}:add`)) {
        const since = Math.max(...opened.map((b) => b.nz));
        signals.push({
          id: `signal:hl:${address}:${coin}:${side}:new`,
          category: "signal",
          type: "new-position",
          signalType: "new-position",
          mode: "new",
          label: "建仓",
          source: "hyperliquid-fills",
          platform: "hyperliquid",
          market: "perp",
          time: new Date(Math.max(...buckets.map((b) => b.t1))).toISOString(),
          openedAt: new Date(since).toISOString(),
          coin,
          side,
          walletsCount: 1,
          addresses: [address],
          address,
          totalUsd: notional,
          sizeUsd: notional,
          periodHours: Math.max(1, Math.round((now - since) / HOUR)),
          period: `${Math.max(1, Math.round((now - since) / HOUR))}h`,
          avgEntry: finite(position.entryPx),
          leverage: finite(position.leverage),
          pnlUsd: finite(position.unrealizedPnlUsd),
          smallCap: !MAJORS.has(coin),
          explorerUrl: explorer(address),
          explanation: `${compactAddress(address)} opened a new ${coin} ${side} worth $${Math.round(notional).toLocaleString("en-US")}.`,
        });
      }
    }
  }
  // 同步做多/做空: several tracked whales adding the same coin and direction inside 24h.
  const recent = new Map();
  for (const bucket of Object.values(hl?.buckets || {})) {
    if (now - bucket.t1 > DAY) continue;
    const dirSide = bucket.s === "short" ? "short" : "long";
    const key = `${bucket.c}|${dirSide}`;
    if (!recent.has(key)) recent.set(key, new Map());
    const perWallet = recent.get(key);
    const prev = perWallet.get(bucket.a) || { net: 0, oU: 0, oS: 0, t1: 0 };
    prev.net += bucket.oU - bucket.cU; prev.oU += bucket.oU; prev.oS += bucket.oS; prev.t1 = Math.max(prev.t1, bucket.t1);
    perWallet.set(bucket.a, prev);
  }
  for (const [key, perWallet] of recent) {
    const [coin, side] = key.split("|");
    const adders = [...perWallet.entries()].filter(([, row]) => row.net >= 200_000);
    const total = adders.reduce((sum, [, row]) => sum + row.net, 0);
    if (!((adders.length >= 3 && total >= 2 * minUsd) || (adders.length >= 2 && total >= 5 * minUsd))) continue;
    const oU = adders.reduce((sum, [, row]) => sum + row.oU, 0);
    const oS = adders.reduce((sum, [, row]) => sum + row.oS, 0);
    const type = side === "short" ? "coordinated-short" : "coordinated-long";
    signals.push({
      id: `signal:hl:${coin}:${side}:cluster`,
      category: "signal",
      type,
      signalType: type,
      mode: "cluster",
      label: side === "short" ? "同步做空" : "同步做多",
      source: "hyperliquid-fills",
      platform: "hyperliquid",
      time: new Date(Math.max(...adders.map(([, row]) => row.t1))).toISOString(),
      coin,
      side,
      walletsCount: adders.length,
      addresses: adders.map(([address]) => address),
      address: adders.sort((a, b) => b[1].net - a[1].net)[0][0],
      totalUsd: total,
      sizeUsd: total,
      periodHours: 24,
      period: "24h",
      avgEntry: oS ? oU / oS : null,
      pnlUsd: null,
      explorerUrl: explorer(adders[0][0]),
      explanation: `${adders.length} tracked Hyperliquid whales added ${side} ${coin} in 24h, net $${Math.round(total).toLocaleString("en-US")}.`,
    });
  }
  // Ranking: the owner's core signal is quiet multi-day building, so the pattern type outweighs raw size (size counts
  // logarithmically): multi-day adds > several whales together > fresh small/mid-cap positions > reductions.
  const weight = (s) => (s.mode === "add" ? 1 + 0.5 * Math.min(4, (s.days || 1) - 1) + (MAJORS.has(s.coin) ? 0 : 0.2)
    : s.mode === "cluster" ? 1.2 + 0.1 * Math.min(6, s.walletsCount)
    : s.mode === "new" ? (s.smallCap ? 0.9 : 0.5)
    : 0.6);
  const recency = (s) => Math.max(0.3, 1 - (now - Date.parse(s.time)) / (3 * DAY));
  const size = (s) => 1 + Math.log10(Math.max(1, (finite(s.totalUsd) || 0) / 1_000_000));
  const ranked = signals.map((s) => ({ s, score: weight(s) * recency(s) * size(s) })).sort((a, b) => b.score - a.score);
  const perWallet = new Map();
  const out = [];
  for (const { s } of ranked) {
    const n = perWallet.get(s.address) || 0;
    if (s.mode !== "cluster" && n >= 2) continue;
    perWallet.set(s.address, n + 1);
    out.push(s);
  }
  return out;
}

export function hyperliquidLiquidationEvents(hl, { now = Date.now(), minUsd = 1_000_000 } = {}) {
  return Object.values(hl?.buckets || {})
    .filter((b) => b.liqU >= minUsd && now - b.t1 <= DAY)
    .map((b) => ({
      id: `hl-liq:${b.a}:${b.c}:${b.s}:${b.d}`,
      category: "position",
      type: "liquidation",
      eventType: "liquidation",
      platform: "hyperliquid",
      source: "hyperliquid-fills",
      explorerUrl: explorer(b.a),
      time: new Date(b.t1).toISOString(),
      observedAt: new Date(b.t1).toISOString(),
      address: b.a,
      label: compactAddress(b.a),
      coin: b.c,
      side: b.s,
      sizeUsd: b.liqU,
      notionalUsd: b.liqU,
      liquidation: true,
      closedPnlUsd: b.pnl,
      realizedPnlUsd: b.pnl,
    }));
}
