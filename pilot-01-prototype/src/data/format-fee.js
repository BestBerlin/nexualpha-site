// THE fee formatter (audit NX-01, 2026-10-11). Every maker/taker fee printed on the site goes through here, so a card,
// the directory, a venue page, /compare, /rates, the factbook and the social cards all print the same figure.
//
// Precision rule: the reviewed figure keeps the precision it was published with — two decimals, three only when the
// third is significant (0.055% stays 0.055%, 0.015% stays 0.015%, 0.1% prints 0.10% so columns align). Never rounded
// into a different figure: the displayed rate times the scenario volume reproduces the displayed cost.
//
// Locale rule: decimal separator, percent sign position and spacing come from Intl (fr/de/es/ru "0,055 %", tr "%0,055",
// pt-BR/it/id/vi "0,055%", en/zh/ja/ko "0.055%"). Arabic keeps Latin digits (the rest of the site prints Latin digits in
// ar, and server/browser ICU builds disagree on the default Arabic numbering system).
// Inputs are percent (0.055 means 0.055%) unless the function name says "Rate" (fraction, 0.00055 = 0.055%).

const MAX_DECIMALS = 3;
const cache = new Map();

function intlLocale(locale) {
  const raw = String(locale || "en");
  if (raw === "zh" || raw === "zh-CN") return "zh-Hans";
  if (raw === "zh-TW" || raw === "zh-HK") return "zh-Hant";
  if (raw.split(/[-_]/)[0].toLowerCase() === "ar") return "ar-u-nu-latn";
  return raw;
}

function formatter(locale, decimals, style) {
  const key = `${locale}|${decimals}|${style}`;
  let f = cache.get(key);
  if (!f) {
    const options = { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: false, ...(style === "percent" ? { style: "percent" } : {}) };
    try { f = new Intl.NumberFormat(intlLocale(locale), options); } catch { f = new Intl.NumberFormat("en", options); }
    cache.set(key, f);
  }
  return f;
}

// Removes float noise (0.1 * 0.6 = 0.06000000000000001) without changing a published figure.
const clean = (v) => Math.round(v * 1e6) / 1e6;

/** Decimals a percent figure is shown with: 2, or 3 when the third decimal is significant (max 3). */
export function feeDecimals(pct) {
  const v = Math.abs(clean(pct));
  return Number.isInteger(Math.round(v * 1e6) / 1e4) ? 2 : MAX_DECIMALS;
}

/** formatFee(0.055) → "0.055%"; formatFee(0.1, "fr") → "0,10 %"; formatFee(0.055, "tr") → "%0,055". Null for non-numbers. */
// Half-up rounding on the decimal figure (0.0375 → 0.038), not on its binary approximation (toFixed gives 0.037).
const roundTo = (v, d) => Math.round(v * 10 ** d) / 10 ** d;

export function formatFee(pct, locale = "en") {
  if (!Number.isFinite(pct)) return null;
  const v = clean(pct);
  const d = feeDecimals(v);
  const r = roundTo(v, d);
  if (String(locale || "en") === "en") return `${r.toFixed(d)}%`; // byte-identical to the previous feePct for published figures
  return formatter(locale, d, "percent").format(r / 100);
}

/** Same figure without the percent sign (for "pp" gaps and axis ticks). */
export function formatFeeNumber(pct, locale = "en") {
  if (!Number.isFinite(pct)) return null;
  const v = clean(pct);
  const d = feeDecimals(v);
  return formatter(locale, d, "decimal").format(roundTo(v, d));
}

/** Fraction in (0.00055 = 0.055%), same output as formatFee. */
export function formatFeeRate(rate, locale = "en") {
  return Number.isFinite(rate) ? formatFee(Math.round(rate * 1e8) / 1e6, locale) : null;
}

/** Maker first: "0.02% / 0.055%". A missing side reads "–". */
export function formatFeePair(maker, taker, locale = "en") {
  return `${formatFee(maker, locale) || "–"} / ${formatFee(taker, locale) || "–"}`;
}

/**
 * The cost a displayed fee produces: volume × displayed percent / 100. Uses the same rounding as the display, so
 * "0.055%" × 100,000 = 55 — a reader can redo the sum with the printed number.
 */
export function costFromDisplayedFee(volume, pct) {
  if (!Number.isFinite(volume) || !Number.isFinite(pct)) return null;
  const shown = roundTo(clean(pct), feeDecimals(pct));
  return (volume * shown) / 100;
}

/**
 * The formatted fee split for typesetting: { prefix, number, suffix } — e.g. en {"", "0.055", "%"}, fr {"", "0,055",
 * " %"}, tr {"%", "0,055", ""}. prefix + number + suffix === formatFee(pct, locale).
 */
export function formatFeeParts(pct, locale = "en") {
  const text = formatFee(pct, locale);
  if (text == null) return null;
  const m = text.match(/^([^0-9]*)([0-9][0-9.,٫٬]*)(.*)$/u);
  return m ? { prefix: m[1], number: m[2], suffix: m[3] } : { prefix: "", number: text, suffix: "" };
}
