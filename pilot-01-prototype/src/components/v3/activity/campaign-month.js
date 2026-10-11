const calendar = (now, locale) => new Intl.DateTimeFormat("en-CA", { timeZone: String(locale).startsWith("zh") ? "Asia/Shanghai" : "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(now)).filter(p => p.type !== "literal").reduce((out, p) => ({ ...out, [p.type]: p.value }), {});
export function monthCampaigns(items, locale, now = Date.now()) {
  const current = calendar(now, locale);
  return items.filter(item => item.category === "event" && Number.isFinite(Date.parse(item.publishedAt)) && Date.parse(item.publishedAt) <= now).filter(item => {
    const date = calendar(Date.parse(item.publishedAt), locale);
    return date.year === current.year && date.month === current.month;
  }).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 6);
}
export function isStartOfMonth(locale, now = Date.now()) { return Number(calendar(now, locale).day) <= 7; }
