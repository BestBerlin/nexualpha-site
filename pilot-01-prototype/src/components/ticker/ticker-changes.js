// Which ticker values changed between two snapshots, and in which direction (drives the refresh flash in TickerBar).
const EMPTY = "—";
// Numeric value of a formatted price ("$81,936") or change ("−1.79%"); NaN for anything else.
const numberOf = (text) => Number(String(text || "").replace(/\u2212/g, "-").replace(/[$,%+\s]/g, ""));
function tickerValues(data) {
  const values = new Map();
  for (const item of data?.items || []) { values.set(`${item.sym}-p`, item.price); values.set(`${item.sym}-c`, item.change); }
  if (data?.mover) { values.set("mover-sym", data.mover.sym); values.set("mover-c", data.mover.change); }
  return values;
}
/** Keys whose text changed between two snapshots, with the direction of the move ("up" | "down"). */
export function tickerChanges(prev, next) {
  const before = tickerValues(prev), after = tickerValues(next), out = new Map();
  for (const [key, value] of after) {
    const old = before.get(key);
    if (old == null || old === value || value === EMPTY) continue;
    const a = numberOf(old), b = numberOf(value);
    out.set(key, Number.isFinite(a) && Number.isFinite(b) ? (b >= a ? "up" : "down") : (next?.mover?.dir === "down" ? "down" : "up"));
  }
  return out;
}
