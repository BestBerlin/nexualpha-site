// Localized label of a calendar event, shared by the /calendar page, its head (Event schema) and the iCal export.
import { fill, intelToolsCopy } from "./intel-tools-copy.js";
import { eventTitle } from "./crypto-calendar.js";

const MACRO_KINDS = new Set(["fomc", "cpi", "nfp", "pce", "gdp"]);
export function calendarEventLabel(event, locale) {
  const t = intelToolsCopy(locale).calendar;
  if (event.kind === "unlock") return fill(t.kinds.unlock, { name: event.assetName || event.asset || "", symbol: event.asset || "" });
  if (MACRO_KINDS.has(event.kind)) return fill(t.kinds[event.kind], { period: event.period || "" }).replace(/\s*[(（]\s*[)）]/, "");
  return eventTitle(event, locale);
}
