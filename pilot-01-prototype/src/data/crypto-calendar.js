// Crypto calendar (/calendar, 2026-10-13): US macro releases, token unlocks, dated exchange listings/delistings and
// the deadlines of the campaigns we cover. Pure and dependency-free (Worker head + ICS, SSR, browser, host collector
// ops/intel-tools/collect-calendar.mjs). Every event carries the official source it was read from.
//
// Snapshot shape (schema nexualpha.calendar.v1):
// { schema, generatedAt, sources: [{ name, url }],
//   events: [{ id, type: "macro"|"unlock"|"exchange"|"campaign", kind, start: ISO, allDay, title, titles?: { locale: text },
//              asset?, venue?, amount?, pctSupply?, usdValue?, period?, sourceUrl, sourceName, pagePath? }] }

export const CALENDAR_SCHEMA = "nexualpha.calendar.v1";
export const CALENDAR_TYPES = Object.freeze(["macro", "unlock", "exchange", "campaign"]);
export const CALENDAR_KINDS = Object.freeze(["fomc", "cpi", "nfp", "pce", "gdp", "unlock", "listing", "delisting", "campaign-end"]);
const DAY_MS = 864e5;

const num = (v) => { const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN; return Number.isFinite(n) ? n : null; };
const cleanText = (v, max = 200) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const cleanUrl = (v) => (/^https:\/\/[^\s"<>]+$/.test(String(v || "")) ? String(v) : null);
const cleanPath = (v) => (/^\/[A-Za-z0-9/_.~%-]*$/.test(String(v || "")) ? String(v) : null);

export function readCalendar(json) {
  if (!json || typeof json !== "object") return null;
  const t = Date.parse(json.generatedAt);
  if (!Number.isFinite(t)) return null;
  const seen = new Set();
  const events = (Array.isArray(json.events) ? json.events : []).map((e) => {
    const start = Date.parse(e?.start);
    const type = CALENDAR_TYPES.includes(e?.type) ? e.type : null;
    const kind = CALENDAR_KINDS.includes(e?.kind) ? e.kind : null;
    const id = cleanText(e?.id, 160);
    const sourceUrl = cleanUrl(e?.sourceUrl);
    if (!Number.isFinite(start) || !type || !kind || !id || seen.has(id) || !sourceUrl) return null;
    seen.add(id);
    const titles = {};
    if (e.titles && typeof e.titles === "object") for (const [k, v] of Object.entries(e.titles)) if (/^[a-z]{2}(?:-[A-Za-z]{2,4})?$/.test(k) && cleanText(v)) titles[k] = cleanText(v);
    return {
      id, type, kind, start: new Date(start).toISOString(), allDay: e.allDay === true, title: cleanText(e.title) || id, titles,
      asset: cleanText(e.asset, 16) || null, assetName: cleanText(e.assetName, 60) || null, venue: cleanText(e.venue, 24) || null,
      amount: num(e.amount), pctSupply: num(e.pctSupply), usdValue: num(e.usdValue), period: cleanText(e.period, 40) || null,
      sourceUrl, sourceName: cleanText(e.sourceName, 80), pagePath: cleanPath(e.pagePath),
    };
  }).filter(Boolean).sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id));
  const sources = (Array.isArray(json.sources) ? json.sources : []).map((s) => ({ name: cleanText(s?.name, 80), url: cleanUrl(s?.url) })).filter((s) => s.name && s.url);
  return { generatedAt: new Date(t).toISOString(), sources, events };
}

export const filterEvents = (events, type) => (CALENDAR_TYPES.includes(type) ? events.filter((e) => e.type === type) : events);
export const eventTitle = (event, locale) => event.titles?.[locale] || (String(locale).startsWith("zh") ? event.titles?.["zh-Hans"] : null) || event.title;
export const utcDay = (iso) => String(iso).slice(0, 10);

/** Monday 00:00 UTC of the week containing `now`, shifted by `offset` weeks. */
export function weekStart(now, offset = 0) {
  const d = new Date(now);
  const day = (d.getUTCDay() + 6) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + offset * 7);
}
/** Seven UTC days ({ day: "YYYY-MM-DD", events }) of one week. */
export function weekModel(events, now, offset = 0) {
  const start = weekStart(now, offset);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start + i * DAY_MS).toISOString().slice(0, 10);
    return { day, events: events.filter((e) => utcDay(e.start) === day) };
  });
}
/** Upcoming events (from the start of today UTC) grouped by day, at most `days` days ahead. */
export function upcomingGroups(events, now, { days = 120, limit = 400 } = {}) {
  const from = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate());
  const to = from + days * DAY_MS;
  const groups = new Map();
  for (const e of events) {
    const t = Date.parse(e.start);
    if (t < from || t >= to) continue;
    const day = utcDay(e.start);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day).push(e);
    if (--limit <= 0) break;
  }
  return [...groups.entries()].map(([day, list]) => ({ day, events: list }));
}
export function recentEvents(events, now, days = 7) {
  const today = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate());
  return events.filter((e) => { const t = Date.parse(e.start); return t < today && t >= today - days * DAY_MS; }).reverse();
}
export const typeCounts = (events) => Object.fromEntries(CALENDAR_TYPES.map((type) => [type, events.filter((e) => e.type === type).length]));

export function formatEventTime(event) {
  if (event.allDay) return null;
  const d = new Date(event.start), p = (x) => String(x).padStart(2, "0");
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}

// ------------------------------------------------------------------ iCalendar export (RFC 5545)
const icsEscape = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const icsStamp = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsDate = (iso) => utcDay(iso).replace(/-/g, "");
function fold(line) {
  // 75 octets per line; continuation lines start with one space. Split on code points so UTF-8 is never cut.
  const out = [];
  let current = "", bytes = 0;
  for (const ch of line) {
    const size = new TextEncoder().encode(ch).length;
    if (bytes + size > (out.length ? 74 : 75)) { out.push(current); current = ""; bytes = 0; }
    current += ch; bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}
/**
 * VCALENDAR text for the given events. `describe(event)` returns the localized summary/description; `urlFor(event)`
 * the page link (our page when we have one, else the official source).
 */
export function renderIcs(events, { name = "NexuAlpha crypto calendar", generatedAt, describe = (e) => ({ summary: e.title, description: "" }), urlFor = (e) => e.sourceUrl } = {}) {
  const stamp = icsStamp(generatedAt || new Date(0).toISOString());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NexuAlpha//Crypto Calendar//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(name)}`, "X-WR-TIMEZONE:UTC", "REFRESH-INTERVAL;VALUE=DURATION:PT6H", "X-PUBLISHED-TTL:PT6H"];
  for (const e of events) {
    const { summary, description } = describe(e);
    lines.push("BEGIN:VEVENT", `UID:${icsEscape(e.id.replace(/[^A-Za-z0-9._:-]/g, "-"))}@nexualpha.com`, `DTSTAMP:${stamp}`);
    if (e.allDay) {
      const next = new Date(Date.parse(`${utcDay(e.start)}T00:00:00Z`) + DAY_MS).toISOString();
      lines.push(`DTSTART;VALUE=DATE:${icsDate(e.start)}`, `DTEND;VALUE=DATE:${icsDate(next)}`);
    } else {
      lines.push(`DTSTART:${icsStamp(e.start)}`, `DTEND:${icsStamp(new Date(Date.parse(e.start) + 30 * 60e3).toISOString())}`);
    }
    lines.push(`SUMMARY:${icsEscape(summary)}`, `DESCRIPTION:${icsEscape(description)}`, `URL:${urlFor(e)}`, `CATEGORIES:${e.type.toUpperCase()}`, "TRANSP:TRANSPARENT", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

/** What the server embeds for hydration: events from 8 days back to 130 days ahead of `now`. */
export function compactCalendar(json, now) {
  if (!json || typeof json !== "object" || !Array.isArray(json.events)) return json ?? null;
  const from = now - 8 * DAY_MS, to = now + 130 * DAY_MS;
  return { ...json, events: json.events.filter((e) => { const t = Date.parse(e?.start); return t >= from && t <= to; }) };
}
