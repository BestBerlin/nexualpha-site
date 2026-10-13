// Singapore time for the data pages (owner 2026-10-13: every displayed clock time in SGT, 中文 "新加坡时间").
// Intl with timeZone "Asia/Singapore"; same string on the server and in every browser. A shared formatter
// (src/data/time-format.js) may replace this once it lands on main.
const PARTS = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** { day: "YYYY-MM-DD", time: "HH:MM" } in Singapore time, or null for an invalid date. */
export function sgtParts(value) {
  const t = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(t)) return null;
  const p = Object.fromEntries(PARTS.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, time: `${p.hour === "24" ? "00" : p.hour}:${p.minute}` };
}
export const sgtLabel = (locale) => (String(locale || "").startsWith("zh") ? "新加坡时间" : "SGT");
/** "2026-10-13 07:39 SGT" (zh: "2026-10-13 07:39 新加坡时间"). */
export function formatSgtStamp(value, locale = "en") {
  const p = sgtParts(value);
  return p ? `${p.day} ${p.time} ${sgtLabel(locale)}` : "—";
}
export const formatSgtTime = (value, locale = "en") => { const p = sgtParts(value); return p ? `${p.time} ${sgtLabel(locale)}` : "—"; };
