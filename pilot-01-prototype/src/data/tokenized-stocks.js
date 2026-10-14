// Tokenized US stocks: venue order, sign-up gating and small formatters shared by the hub, the ticker pages, the home
// strip and the exchange-profile block. Facts live in tokenized-stocks-facts.js (every value carries its source).
//
// Sign-up rules (owner): order Bitget > OKX > Binance > the rest (venue-priority.js); Türkiye never shows Bitget at all;
// neutral locales (ru, ar, zh-Hant, ur, uk, vi) and no-promotion markets show no code, no CTA and no campaign. The code
// is the registry code (publicCtaForVenue) and every sign-up goes through /go/<venue>?src=tokenized-stocks-<placement>.
import { publicCtaForVenue, venueGoHref } from "./source-bound-cta.js";
import { orderVenues } from "./venue-priority.js";
import { isTurkeyPage } from "./partner-geo-policy.js";
import { isNeutralCtaLocale } from "./locale-policy.js";
import { TS_EXCHANGES, TS_SOURCES, tsPromo } from "./tokenized-stocks-facts.js";

export const TS_INDEX_LOCALES = Object.freeze(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "tr", "id", "ja", "ko", "vi", "ru", "ar", "fr", "de", "it", "ur", "uk"]);
export const TS_ORIGIN = "https://nexualpha.com";
export const TS_SRC_PREFIX = "tokenized-stocks";

const turkey = (locale, market) => /^tr(?:-|$)/i.test(String(locale || "")) || isTurkeyPage({ locale, market });

/** Exchanges in owner order for this page; Türkiye drops Bitget everywhere (rows, chips, sources, schema). */
export function tsVenues(locale = "en", market) {
  const list = orderVenues(TS_EXCHANGES, locale);
  return turkey(locale, market) ? list.filter((ex) => ex.slug !== "bitget") : list;
}

/** Source ids that may be cited on this page (Türkiye: no Bitget pages). */
export function tsCitable(ids = [], locale = "en", market) {
  const tr = turkey(locale, market);
  return [...new Set(ids)].map((id) => TS_SOURCES[id]).filter((src) => src && !(tr && /bitget\.com/i.test(src.url)));
}

/** { code, href } where the sign-up may be shown, else null. Placement becomes the /go src suffix. */
export function tsSignup(slug, { locale = "en", market, placement = "hub" } = {}) {
  if (isNeutralCtaLocale(locale)) return null;
  if (slug === "bitget" && turkey(locale, market)) return null;
  const cta = publicCtaForVenue(slug, locale, market);
  if (!cta?.routeAvailable || !cta.inviteCode || !cta.hasReferral) return null;
  const href = venueGoHref(slug, `${TS_SRC_PREFIX}-${placement}`.slice(0, 48), locale, market);
  return href ? { code: cta.inviteCode, href } : null;
}

/** Active promotion where campaigns may be shown (never on neutral/no-signup pages). */
export function tsActivePromo(ex, { locale = "en", market, now = Date.now() } = {}) {
  if (!tsSignup(ex.slug, { locale, market })) return null;
  return tsPromo(ex, now);
}

export const fillTs = (template, vars = {}) => String(template ?? "").replace(/\{(\w+)\}/g, (_m, key) => (vars[key] ?? ""));
export const tsPct = (n) => `${Number(n).toString()}%`;

/** Localized list "A, B and C" (Intl.ListFormat, stable across Node and browsers for these locales). */
export function tsList(items, locale = "en") {
  const list = items.filter(Boolean);
  try { return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(list); } catch { return list.join(", "); }
}

/** Fee fact -> localized text using the page copy. */
export function tsFeeText(fee, t) {
  const v = fee?.v;
  if (!v) return "";
  if (v.zeroUsd) return t.feeZero;
  if (v.flatUsd != null) return fillTs(t.feeFlat, { flat: v.flatUsd, pct: tsPct(v.pct) });
  if (v.maker != null) return fillTs(t.feeMakerTaker, { maker: tsPct(v.maker), taker: tsPct(v.taker) });
  return "";
}
