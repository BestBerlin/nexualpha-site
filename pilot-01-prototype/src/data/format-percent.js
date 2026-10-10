// Percent formatting per UI locale (owner 2026-10-10, Turkish copy review). Turkish writes the sign before the number
// ("%60", "%0,02"), so every rebate share or fee rate shown in `tr` goes through Intl.NumberFormat. Every other locale
// keeps the previous "60%" / "0.02%" rendering byte for byte, so this helper changes nothing outside Turkish.
const TR_PERCENT = new Intl.NumberFormat("tr", { style: "percent", maximumFractionDigits: 2 });

function isTurkish(locale) {
  return String(locale || "").toLowerCase().split(/[-_]/)[0] === "tr";
}

/**
 * formatPercent("tr", 60) → "%60"; formatPercent("en", 60) → "60%"; formatPercent("tr", 0.02, { fractionDigits: 2 }) → "%0,02".
 * `value` is the percentage (60 means sixty percent), not a ratio.
 */
export function formatPercent(locale, value, { fractionDigits } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  if (isTurkish(locale)) {
    const formatter = fractionDigits == null
      ? TR_PERCENT
      : new Intl.NumberFormat("tr", { style: "percent", minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
    return formatter.format(number / 100);
  }
  return `${fractionDigits == null ? number : number.toFixed(fractionDigits)}%`;
}

/** Replaces the "{max}%" placeholder used by the home copy with the locale's percent rendering. */
export function replaceMaxPercent(text, locale, max) {
  return String(text).replace("{max}%", formatPercent(locale, max)).replace("{max}", String(max));
}
