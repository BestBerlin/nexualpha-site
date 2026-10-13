// US macro release dates for the crypto calendar (2026-10-13). Official schedules only:
//   - FOMC: the Federal Reserve's meeting calendar page (statement at 2:00 pm ET on the second day of each meeting).
//   - GDP and PCE (Personal Income and Outlays): BEA's official iCalendar subscription.
//   - CPI and the Employment Situation (jobs report): the BLS release schedule. bls.gov refuses automated requests, so
//     the published dates live in BLS_SCHEDULE below (8:30 am ET); add the next year when BLS publishes it.
// Times are converted from US Eastern time to UTC with the US daylight-saving rules.

export const FOMC_URL = "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm";
export const BEA_ICS_URL = "https://www.bea.gov/news/schedule/ics/online-calendar-subscription.ics";
const BLS_CPI_URL = "https://www.bls.gov/schedule/news_release/cpi.htm";
const BLS_EMPSIT_URL = "https://www.bls.gov/schedule/news_release/empsit.htm";
// BLS release schedule (published dates, 8:30 am ET).
export const BLS_SCHEDULE = Object.freeze({
  cpi: ["2026-01-13", "2026-02-13", "2026-03-11", "2026-04-10", "2026-05-12", "2026-06-10", "2026-07-14", "2026-08-12", "2026-09-11", "2026-10-14", "2026-11-10", "2026-12-10"],
  nfp: ["2026-01-09", "2026-02-11", "2026-03-06", "2026-04-03", "2026-05-08", "2026-06-05", "2026-07-02", "2026-08-07", "2026-09-04", "2026-10-02", "2026-11-06", "2026-12-04"],
});
export const MACRO_SOURCES = Object.freeze([
  { name: "Federal Reserve: FOMC meeting calendar", url: FOMC_URL },
  { name: "BLS: Consumer Price Index release schedule", url: BLS_CPI_URL },
  { name: "BLS: Employment Situation release schedule", url: BLS_EMPSIT_URL },
  { name: "BEA: release schedule", url: "https://www.bea.gov/news/schedule" },
]);

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const monthIndex = (name) => MONTHS.findIndex((m) => m.startsWith(String(name).toLowerCase().slice(0, 3)));

// US daylight saving time: from the second Sunday of March 02:00 to the first Sunday of November 02:00 (local).
function nthSunday(year, month, n) {
  const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
  return 1 + ((7 - first) % 7) + (n - 1) * 7;
}
export function usOffsetHours(year, month, day, standardOffset) {
  const start = nthSunday(year, 2, 2), end = nthSunday(year, 10, 1);
  const dst = (month > 2 && month < 10) || (month === 2 && day >= start) || (month === 10 && day < end);
  return standardOffset - (dst ? 1 : 0);
}
/** UTC ISO of a wall-clock time in US Eastern (standardOffset 5) or Central (6) time. */
export function usLocalToUtc(year, month, day, hour, minute, standardOffset = 5) {
  return new Date(Date.UTC(year, month, day, hour + usOffsetHours(year, month, day, standardOffset), minute)).toISOString();
}

/** FOMC decision days from the Fed calendar page: two-day scheduled meetings only (unscheduled calls are skipped). */
export function parseFomcCalendar(html) {
  const out = [];
  const sections = String(html).split(/(\d{4}) FOMC Meetings/).slice(1);
  for (let i = 0; i < sections.length; i += 2) {
    const year = Number(sections[i]);
    const body = sections[i + 1] || "";
    for (const row of body.matchAll(/fomc-meeting__month[^>]*>\s*<strong>([^<]+)<\/strong>[\s\S]*?fomc-meeting__date[^>]*>([^<]+)</g)) {
      const month = row[1].trim(), date = row[2].trim();
      const m = date.match(/^(\d{1,2})-(\d{1,2})\*?$/);
      if (!m) continue;
      const months = month.split("/").map((name) => monthIndex(name.trim()));
      const decisionMonth = months[months.length - 1];
      if (decisionMonth < 0) continue;
      const day = Number(m[2]);
      out.push({
        id: `macro:fomc:${year}-${String(decisionMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`, type: "macro", kind: "fomc",
        start: usLocalToUtc(year, decisionMonth, day, 14, 0, 5), allDay: false, title: "FOMC interest rate decision",
        sourceUrl: FOMC_URL, sourceName: "Federal Reserve",
      });
    }
  }
  return out;
}

export function blsEvents() {
  return Object.entries(BLS_SCHEDULE).flatMap(([kind, days]) => days.map((day) => {
    const [y, m, d] = day.split("-").map(Number);
    return {
      id: `macro:${kind}:${day}`, type: "macro", kind, start: usLocalToUtc(y, m - 1, d, 8, 30, 5), allDay: false,
      title: kind === "cpi" ? "US CPI inflation" : "US jobs report (Employment Situation)",
      sourceUrl: kind === "cpi" ? BLS_CPI_URL : BLS_EMPSIT_URL, sourceName: "U.S. Bureau of Labor Statistics",
    };
  }));
}

/** GDP and PCE releases from BEA's iCalendar feed (DTSTART is UTC). */
export function parseBeaIcs(text) {
  const unfolded = String(text).replace(/\r?\n[ \t]/g, "");
  const out = [];
  for (const block of unfolded.split("BEGIN:VEVENT").slice(1)) {
    const summary = (block.match(/\nSUMMARY:([^\r\n]*)/)?.[1] || "").replace(/\\([,;\\])/g, "$1").trim();
    const start = block.match(/\nDTSTART[^:]*:(\d{8}T\d{6}Z)/)?.[1];
    if (!summary || !start) continue;
    const kind = /^Personal Income and Outlays\b/.test(summary) ? "pce" : /^(GDP|Gross Domestic Product) \((Advance|Second|Third) Estimate\)/.test(summary) ? "gdp" : null;
    if (!kind) continue;
    const iso = `${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(6, 8)}T${start.slice(9, 11)}:${start.slice(11, 13)}:00.000Z`;
    out.push({ id: `macro:${kind}:${iso.slice(0, 10)}`, type: "macro", kind, start: iso, allDay: false, title: summary.slice(0, 160), sourceUrl: "https://www.bea.gov/news/schedule", sourceName: "U.S. Bureau of Economic Analysis" });
  }
  return out;
}

export async function collectMacro({ fetchText, window }) {
  const fomc = parseFomcCalendar(await fetchText(FOMC_URL, { accept: "text/html" }));
  if (!fomc.length) throw new Error("FOMC calendar: no meetings parsed");
  const bea = parseBeaIcs(await fetchText(BEA_ICS_URL, { accept: "text/calendar" }));
  if (!bea.length) throw new Error("BEA calendar: no GDP/PCE releases parsed");
  const inWindow = (e) => { const t = Date.parse(e.start); return t >= window.from && t <= window.to; };
  const seen = new Set();
  return [...fomc, ...blsEvents(), ...bea].filter(inWindow).filter((e) => !seen.has(e.id) && seen.add(e.id));
}
