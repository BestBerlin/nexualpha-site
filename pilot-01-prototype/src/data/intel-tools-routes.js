// Daily-return data pages (2026-10-13): /etf-flows (US spot crypto ETF flows) and /calendar (macro events,
// exchange dates, campaign deadlines). Entry-safe: the router, header/footer links, /flash and the data pages
// import this file, so it carries only paths (link labels: intel-tools-links.js; page copy: intel-tools-copy.js).

export const ETF_FLOWS_PATH = "/etf-flows";
export const CALENDAR_PATH = "/calendar";
export const CALENDAR_ICS_PATH = "/calendar.ics";
export const ETF_FLOWS_JSON_PATH = "/intel/etf-flows.json";
export const CALENDAR_JSON_PATH = "/intel/calendar.json";
export const INTEL_TOOL_PATHS = Object.freeze([ETF_FLOWS_PATH, CALENDAR_PATH]);
// Search editions with written copy. Other UI locales render the English page as noindex,follow.
export const INTEL_TOOL_INDEX_LOCALES = Object.freeze(["en", "zh-Hans", "es", "pt-BR", "tr", "vi", "id", "ja", "ko"]);

// /etf-flows stays noindex, out of the sitemap and unlinked until a data source we may republish is approved: issuer
// sites (BlackRock, 21Shares/ARK, Bitwise), Farside, SoSoValue and DefiLlama forbid automated collection or reuse.
// Flip to true once a licensed or permitted feed writes /intel/etf-flows.json (docs/etf-calendar-refresh.md).
export const ETF_FLOWS_LIVE = false;
export const INTEL_TOOL_LIVE_PATHS = Object.freeze(INTEL_TOOL_PATHS.filter((p) => p !== ETF_FLOWS_PATH || ETF_FLOWS_LIVE));
export const isIntelToolLive = (pathname) => INTEL_TOOL_LIVE_PATHS.includes(pathname);
export const isIntelToolPath = (pathname) => INTEL_TOOL_PATHS.includes(String(pathname || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/");
export const intelToolKey = (pathname) => (pathname === ETF_FLOWS_PATH ? "etf" : pathname === CALENDAR_PATH ? "calendar" : null);
