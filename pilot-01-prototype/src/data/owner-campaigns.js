// Owner-curated exchange campaigns (sign-up bonuses, monthly sign-up drives, airdrops). Add an entry only from an
// exchange's own page; every field is shown as written. Expired entries hide themselves on endAt.
// {
//   id: "okx-2026-11-signup",            // unique
//   venue: "okx",                         // site slug; the card uses this venue's invite route
//   title: { "zh-Hans": "…", en: "…" },   // other locales fall back to en
//   summary: { "zh-Hans": "…", en: "…" }, // optional, one or two sentences
//   url: "https://www.okx.com/…",        // the exchange's official campaign page
//   startAt: "2026-11-01T00:00:00Z", endAt: "2026-11-30T23:59:59Z",
//   checkedAt: "2026-10-31",              // when the terms were read on the official page
// }
export const OWNER_CAMPAIGNS = Object.freeze([]);

export function activeOwnerCampaigns(now = Date.now()) {
  return OWNER_CAMPAIGNS.filter((c) => c?.id && c.venue && /^https:\/\//.test(c.url || "") && (!c.endAt || Date.parse(c.endAt) > now) && (!c.startAt || Date.parse(c.startAt) <= now + 7 * 864e5));
}
