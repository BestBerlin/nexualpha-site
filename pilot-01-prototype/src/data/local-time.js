// Fixed site timezone: SSR and browsers must display the same clock and calendar day.
export const SITE_TIME_ZONE = "Asia/Singapore";
const validDate = (iso) => {
  if (iso == null || iso === "") return null;
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) ? date : null;
};
export function readerDayKey(iso) {
  const date = validDate(iso);
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export function formatSgt(iso, locale = "en", style = "stamp") {
  const date = validDate(iso);
  if (!date) return "";
  const options = { timeZone: SITE_TIME_ZONE };
  const clock = new Intl.DateTimeFormat(locale, { ...options, hour: "2-digit", minute: "2-digit", ...(style === "seconds" ? { second: "2-digit" } : {}), hourCycle: "h23" }).format(date);
  if (style === "clock") return `${clock} SGT`;
  if (style === "date") return new Intl.DateTimeFormat(locale, { ...options, dateStyle: "medium" }).format(date);
  if (style === "end") return `${new Intl.DateTimeFormat(locale, { ...options, day: "numeric", month: "short" }).format(date)} ${clock} SGT`;
  return `${readerDayKey(iso)} · ${clock} SGT`;
}
export function formatReaderTime(iso, locale = "en", now = null) {
  const date = validDate(iso);
  if (!date) return { label: "", title: "", relative: "" };
  const age = now === null ? -1 : now - date.getTime();
  const relative = age >= 0 && age < 3600000
    ? new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "short" }).format(-Math.floor(age / 60000), "minute") : "";
  return { label: formatSgt(iso, locale, "clock"), title: formatSgt(iso, locale), relative };
}
