import { readerDayKey } from "../../../data/local-time.js";
const calendar = (now) => { const [year, month, day] = readerDayKey(now).split("-"); return { year, month, day }; };
export function monthCampaigns(items, locale, now = Date.now()) {
  const current = calendar(now, locale);
  return items.filter(item => item.category === "event" && Number.isFinite(Date.parse(item.publishedAt)) && Date.parse(item.publishedAt) <= now).filter(item => {
    const date = calendar(Date.parse(item.publishedAt), locale);
    return date.year === current.year && date.month === current.month;
  }).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 6);
}
export function isStartOfMonth(locale, now = Date.now()) { return Number(calendar(now, locale).day) <= 7; }
