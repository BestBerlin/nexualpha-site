const normalizeLocale = (locale) => String(locale || "en").toLowerCase();
const normalizeVenue = (item) => String(item?.venue || item?.platform?.slug || "").toLowerCase();
const normalizeCategory = (item) => String(item?.category || item?.type || item?.kind || "").toLowerCase();

export function campaignVisibleInLocale(item, locale = "en") {
  if (normalizeLocale(locale) !== "tr") return true;
  if (normalizeVenue(item) !== "bitget") return true;
  return !["event", "campaign", "platform_activity"].includes(normalizeCategory(item));
}
