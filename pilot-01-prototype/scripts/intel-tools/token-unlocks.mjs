// Token unlocks for the crypto calendar (2026-10-13). Third-party unlock trackers (DefiLlama, Tokenomist, CryptoRank)
// do not allow republishing their data, so the schedules come from each project's own documentation
// (token-unlock-schedules.json). The USD value uses the OKX public spot ticker at collection time; unlocks worth less
// than MIN_USD are left out.
import { readFile } from "node:fs/promises";

export const UNLOCK_SOURCE = Object.freeze({ name: "Project tokenomics documentation (per event)", url: "https://docs.arbitrum.foundation/token-supply" });
export const MIN_USD = 5_000_000;
const SCHEDULES_URL = new URL("./token-unlock-schedules.json", import.meta.url);

/** Dates (YYYY-MM-DD) of a schedule inside [from, to]. */
export function scheduleDates(schedule, from, to) {
  if (schedule.cadence !== "monthly") return [];
  const [fy, fm, fd] = schedule.firstDate.split("-").map(Number);
  const last = Date.parse(`${schedule.lastDate}T00:00:00Z`);
  const out = [];
  for (let i = 0; i < 600; i += 1) {
    const t = Date.UTC(fy, fm - 1 + i, fd);
    if (t > last || t > to) break;
    if (t >= from - 864e5) out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

async function okxPrice(fetchJson, instId) {
  const json = await fetchJson(`https://www.okx.com/api/v5/market/ticker?instId=${encodeURIComponent(instId)}`);
  const last = Number(json?.data?.[0]?.last);
  return Number.isFinite(last) && last > 0 ? last : null;
}

export async function collectUnlocks({ fetchJson, window }) {
  const { schedules } = JSON.parse(await readFile(SCHEDULES_URL, "utf8"));
  const out = [];
  for (const s of schedules) {
    const days = scheduleDates(s, window.from, window.to);
    if (!days.length) continue;
    let price = null;
    try { price = await okxPrice(fetchJson, s.okxInstId); } catch { price = null; }
    const usdValue = price != null ? Math.round(s.amount * price) : null;
    if (usdValue != null && usdValue < MIN_USD) continue;
    for (const day of days) {
      out.push({
        id: `unlock:${s.symbol.toLowerCase()}:${day}`, type: "unlock", kind: "unlock", start: `${day}T00:00:00.000Z`, allDay: true,
        title: `${s.name} (${s.symbol}) token unlock`, asset: s.symbol, assetName: s.name, amount: s.amount,
        pctSupply: s.totalSupply ? Math.round((s.amount / s.totalSupply) * 1e4) / 100 : null, usdValue,
        sourceUrl: s.sourceUrl, sourceName: s.sourceName,
      });
    }
  }
  return out;
}
