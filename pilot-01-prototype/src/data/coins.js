// "Where to buy <coin>" model (route chunk + SSR). Rows come from coins-data.generated.js (scripts/build-coin-availability.mjs,
// public exchange endpoints + CoinGecko); fees from exchange-facts.js; sign-up gating from the partner geo policy and the
// partner registry (publicCtaForVenue). Links to partners always go through our tracked /go/<venue>?src=coin-<slug>.
import { COIN_ROWS, COIN_VENUE_SLUGS, COIN_VENUE_STATUS as BAKED_VENUE_STATUS, COINS_GENERATED_AT as BAKED_GENERATED_AT } from "./coins-data.generated.js";
import { coinRowFromSnapshotCoin, coinVenueStatusFromSnapshot, isUsableCoinSnapshot } from "./coins-snapshot.js";
import { COIN_COPY } from "./coins-copy.js";
import { COIN_INDEX_LOCALES, coinContentLocale, coinPath, COINS_PATH } from "./coins-routes.js";
import { formatSgt } from "./local-time.js";

// Same neutral set as the academy and the campaign join block: no sign-up wording or partner code.
export const COIN_NEUTRAL_LOCALES = new Set(["ru", "ar", "zh-Hant", "ur", "uk"]);
import { feeFact, feePair } from "./exchange-facts.js";
import { isPartnerPromotableIn, isTurkeyGated, promotionCountries } from "./partner-geo-policy.js";
import { PARTNER_RESTRICTED_COUNTRIES } from "./partner-geo-policy.generated.js";
import { publicCtaForVenue } from "./source-bound-cta.js";
import { ACADEMY_EPISODES } from "./academy-season1.js";

export { COIN_VENUE_SLUGS, COIN_INDEX_LOCALES, COINS_PATH, coinPath, coinContentLocale };

export const COIN_VENUE_NAMES = Object.freeze({ okx: "OKX", binance: "Binance", bitget: "Bitget", bybit: "Bybit", "gate-io": "Gate", mexc: "MEXC", htx: "HTX", kraken: "Kraken" });
// Owner rule (academy, DECISIONS 2026-10-12 #3): Bitget's sign-up button names the domain.
const CTA_NAMES = Object.freeze({ bitget: "Bitget.com" });
// Owner rule for Türkiye: only these partners are linked for sign-up.
const TURKEY_SIGNUP_VENUES = new Set(["okx", "binance", "bybit"]);
export const COIN_YEAR = 2026;

const toVenue = ([slug, [spot, perp, networks]]) => ({ slug, name: COIN_VENUE_NAMES[slug] || slug, spot: spot || [], perp: perp || [], networks: networks || null });
function toCoin(row) {
  const [id, slug, name, symbol, rank, category, networks, price, change24h, marketCap, venueRows] = row;
  const venues = COIN_VENUE_SLUGS.filter((venue) => venueRows[venue]).map((venue) => toVenue([venue, venueRows[venue]]));
  return { id, slug, name, symbol, rank, category, networks, price, change24h, marketCap, venues };
}
// Live bindings: the baked table (coins-data.generated.js) until applyCoinOverlay swaps in a fresher runtime snapshot.
export let COINS = Object.freeze(COIN_ROWS.map(toCoin));
export let COINS_GENERATED_AT = BAKED_GENERATED_AT;
let COIN_VENUE_STATUS = BAKED_VENUE_STATUS;
let BY_SLUG = new Map(COINS.map((coin) => [coin.slug, coin]));

// Runtime refresh (2026-10-12): the BaoTa job rewrites coins.json daily (listings) and weekly (universe, prices); the
// server reads it (COINS_FILE) and every coin page renders from it without a redeploy. The page set stays the baked one
// (sitemap, routes and descriptions ship with the build): coins outside the baked universe are ignored and a baked coin
// missing from the snapshot keeps its baked row. The overlay carries only rows that differ from the baked table, so the
// hydration payload stays small; server and browser apply the same overlay before rendering.
const BAKED_BY_SLUG = new Map(COIN_ROWS.map((row) => [row[1], row]));
const BAKED_JSON = new Map(COIN_ROWS.map((row) => [row[1], JSON.stringify(row)]));
let overlayCache = { key: null, overlay: null };
/** Compact overlay { generatedAt, venueStatus, rows } from a coins.json snapshot, or null when it adds nothing. */
export function coinOverlayFromSnapshot(snapshot) {
  if (!isUsableCoinSnapshot(snapshot) || !(Date.parse(snapshot.generatedAt) > Date.parse(BAKED_GENERATED_AT))) return null;
  if (overlayCache.key === snapshot.generatedAt) return overlayCache.overlay;
  const rows = snapshot.coins.filter((coin) => BAKED_BY_SLUG.has(coin.slug)).map(coinRowFromSnapshotCoin)
    .filter((row) => JSON.stringify(row) !== BAKED_JSON.get(row[1]));
  const overlay = { generatedAt: snapshot.generatedAt, venueStatus: coinVenueStatusFromSnapshot(snapshot), rows };
  overlayCache = { key: snapshot.generatedAt, overlay };
  return overlay;
}
/** Swap in an overlay (idempotent; ignores malformed or older-than-baked input). Returns true when the table changed. */
export function applyCoinOverlay(overlay) {
  if (!overlay || typeof overlay !== "object" || !Array.isArray(overlay.rows) || overlay.generatedAt === COINS_GENERATED_AT) return false;
  if (!(Date.parse(overlay.generatedAt) > Date.parse(BAKED_GENERATED_AT))) return false;
  const next = new Map(BAKED_BY_SLUG);
  for (const row of overlay.rows) if (Array.isArray(row) && row.length === 11 && BAKED_BY_SLUG.has(row[1]) && row[10] && typeof row[10] === "object") next.set(row[1], row);
  COINS = Object.freeze([...next.values()].map(toCoin)); // baked order: the hub and related lists stay stable
  BY_SLUG = new Map(COINS.map((coin) => [coin.slug, coin]));
  COINS_GENERATED_AT = overlay.generatedAt;
  COIN_VENUE_STATUS = overlay.venueStatus && typeof overlay.venueStatus === "object" ? overlay.venueStatus : BAKED_VENUE_STATUS;
  return true;
}
export const coinBySlug = (slug) => BY_SLUG.get(String(slug || "").toLowerCase()) || null;

// Türkiye (owner 2026-10-13, legal): a partner that may not be promoted there is still named where it lists the coin,
// but after every other exchange, never as the example venue or among the headline names.
const localeOrder = (venues, locale) => (locale ? [...venues.filter((v) => !isTurkeyGated(v.slug, { locale })), ...venues.filter((v) => isTurkeyGated(v.slug, { locale }))] : venues);
export const spotVenues = (coin, locale) => localeOrder(coin.venues.filter((venue) => venue.spot.length), locale);
export const perpVenues = (coin, locale) => localeOrder(coin.venues.filter((venue) => venue.perp.length), locale);
export const isCoinListed = (coin) => Boolean(coin && coin.venues.length);

export function coinCopy(locale) {
  return COIN_COPY[locale] || (String(locale || "").startsWith("zh") ? COIN_COPY["zh-Hans"] : COIN_COPY.en) || COIN_COPY.en;
}
export const fill = (template, vars = {}) => String(template ?? "").replace(/\{(\w+)\}/g, (_m, key) => (vars[key] ?? ""));
export function joinList(items, locale) {
  const t = coinCopy(locale);
  const list = items.filter(Boolean);
  if (list.length <= 1) return list.join("");
  return `${list.slice(0, -1).join(t.listJoin)}${t.listLast}${list[list.length - 1]}`;
}

/** The pair most venues list (USDT first on ties), with how many spot venues list it. */
export function mainPair(coin) {
  const counts = new Map();
  for (const venue of spotVenues(coin)) for (const quote of venue.spot) counts.set(quote, (counts.get(quote) || 0) + 1);
  const order = ["USDT", "USDC", "USD", "EUR", "BTC"];
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1] || (order.indexOf(a[0]) + 99) % 99 - (order.indexOf(b[0]) + 99) % 99)[0];
  return best ? { pair: `${coin.symbol}/${best[0]}`, quote: best[0], count: best[1] } : null;
}

// ---------------------------------------------------------------- sign-up gating
/** Sign-up link for one venue on a coin page, or null (neutral locale, geo gate, Türkiye rule, no partner route). */
export function coinSignup(venueSlug, coin, { locale = "en", market } = {}) {
  if (COIN_NEUTRAL_LOCALES.has(locale)) return null;
  const countries = promotionCountries({ locale, market });
  if (countries.includes("TR") && !TURKEY_SIGNUP_VENUES.has(venueSlug)) return null;
  if (!isPartnerPromotableIn(venueSlug, { locale, market })) return null;
  const cta = publicCtaForVenue(venueSlug, locale, market);
  if (!cta || cta.actionGate || !cta.registrationUrl) return null;
  return {
    venue: venueSlug,
    name: CTA_NAMES[venueSlug] || COIN_VENUE_NAMES[venueSlug] || venueSlug,
    code: cta.inviteCode || null,
    href: coinGoHref(venueSlug, coin),
  };
}
export const coinGoHref = (venueSlug, coin) => `/go/${venueSlug}?src=${`coin-${coin?.slug || "hub"}`.slice(0, 48)}`;
/** First venue (our order) that lists the coin on spot and may be promoted here: the page's primary button. */
export function primarySignup(coin, context) {
  for (const venue of [...spotVenues(coin), ...perpVenues(coin)]) {
    const signup = coinSignup(venue.slug, coin, context);
    if (signup) return signup;
  }
  return null;
}

// ---------------------------------------------------------------- facts
export function spotFeeText(venueSlug, locale) {
  const fact = feeFact(venueSlug, "spot");
  return fact.state === "checked" ? feePair(fact.maker, fact.taker, locale) : null;
}

/** Country of the visitor for notes (explicit ?market= first, else the locale's country); null when not one country. */
export function coinCountry({ locale = "en", market } = {}) {
  const countries = promotionCountries({ locale, market });
  return countries.length === 1 ? countries[0] : null;
}
/** Which venues listing the coin serve the visitor's country under their own terms. */
export function coinCountryNote(coin, context = {}) {
  const country = coinCountry(context);
  if (!country || !isCoinListed(coin)) return null;
  const restricted = coin.venues.filter((venue) => (PARTNER_RESTRICTED_COUNTRIES[venue.slug] || []).some((code) => code === country || country.startsWith(`${code}-`)));
  const open = coin.venues.filter((venue) => !restricted.includes(venue));
  return { country, open, restricted, turkey: country === "TR" };
}

/** Same-category coins that are listed, nearest by rank; topped up with the largest listed coins. */
export function relatedCoins(coin, limit = 6) {
  const listed = COINS.filter((other) => other.slug !== coin.slug && isCoinListed(other));
  const same = listed.filter((other) => other.category === coin.category).sort((a, b) => Math.abs(a.rank - coin.rank) - Math.abs(b.rank - coin.rank));
  const rest = listed.filter((other) => !same.includes(other) && other.category !== "stablecoin");
  return [...same, ...rest].slice(0, limit);
}

/** Academy lessons the how-to steps link to (KYC E05, first spot trade E07, transfer checklist E09, ...). */
export function coinLesson(id) {
  const episode = ACADEMY_EPISODES.find((item) => item.id === id);
  return episode ? { id, path: `/academy/${episode.slug}` } : null;
}

export const coinDataCheckedOn = () => String(COINS_GENERATED_AT || "").slice(0, 10);
export const coinVenueStatus = (slug) => COIN_VENUE_STATUS[slug] || null;

/** USD price text, deterministic on server and client. */
export function formatUsd(value, locale = "en") {
  if (!Number.isFinite(value)) return "–";
  const digits = value >= 1000 ? 0 : value >= 1 ? 2 : value >= 0.01 ? 4 : 8;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: "USD", minimumFractionDigits: value >= 1000 ? 0 : Math.min(2, digits), maximumFractionDigits: digits }).format(value);
  } catch { return `$${value.toFixed(digits)}`; }
}
export function formatCompactUsd(value, locale = "en") {
  if (!Number.isFinite(value)) return "–";
  if (String(locale).startsWith("vi")) { const a = Math.abs(value); const [d, w] = a >= 1e12 ? [1e12, " nghìn tỷ"] : a >= 1e9 ? [1e9, " tỷ"] : a >= 1e6 ? [1e6, " triệu"] : [1, ""]; try { return `${new Intl.NumberFormat("vi", { maximumFractionDigits: 1 }).format(value / d)}${w} USD`; } catch { return `${Math.round(value)} USD`; } }
  try {
    // Indonesian short compact "M" means miliar (billion) and reads as million; spell the unit out.
    if (/^id\b/i.test(String(locale))) return `US$${new Intl.NumberFormat(locale, { notation: "compact", compactDisplay: "long", maximumFractionDigits: 1 }).format(value)}`;
    return new Intl.NumberFormat(locale, { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
  } catch { return `$${Math.round(value)}`; }
}
export function formatChange(value, locale = "en") {
  if (!Number.isFinite(value)) return "–";
  try { return new Intl.NumberFormat(locale, { style: "percent", signDisplay: "exceptZero", maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value / 100); } catch { return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`; }
}
/** Singapore-time stamp, identical in every runtime. Kept as utcStamp for existing call-site compatibility. */
export const utcStamp = (iso, locale = "en") => formatSgt(iso, locale);

// ---------------------------------------------------------------- answer text (page + meta + FAQ)
export function coinAnswer(coin, locale) {
  const t = coinCopy(locale);
  const spot = spotVenues(coin, locale), perp = perpVenues(coin, locale);
  const vars = { coin: coin.name, symbol: coin.symbol };
  if (!coin.venues.length) return fill(t.answerNone, vars);
  if (!spot.length) return fill(t.answerPerpOnly, { ...vars, venues: joinList(perp.map((v) => v.name), locale) });
  const main = mainPair(coin);
  const first = spot.length === 1
    ? fill(t.answerListedOne, { ...vars, venues: spot[0].name, pair: main.pair })
    : fill(t.answerListed, { ...vars, venues: joinList(spot.map((v) => v.name), locale), pair: main.pair, pairCount: main.count });
  const gap = /^(zh|ja)/.test(String(locale)) ? "" : " ";
  const perpLine = perp.length ? `${gap}${fill(t.answerPerp, { ...vars, perpCount: perp.length })}` : "";
  return `${first}${perpLine}`;
}

/** FAQ entries ({ question, answer }) shared by the page and the FAQPage JSON-LD. */
export function coinFaq(coin, locale, description) {
  const t = coinCopy(locale);
  const vars = { coin: coin.name, symbol: coin.symbol };
  const spot = spotVenues(coin, locale), perp = perpVenues(coin, locale);
  const entries = [];
  if (coin.venues.length) {
    const main = mainPair(coin);
    entries.push({ question: fill(t.faqWhere, vars), answer: fill(t.faqWhereA, { ...vars, venues: joinList((spot.length ? spot : perp).map((v) => v.name), locale), pair: main?.pair || `${coin.symbol}/USDT` }) });
  } else {
    entries.push({ question: fill(t.faqWhere, vars), answer: fill(t.faqWhereNoneA, { ...vars, similar: joinList(relatedCoins(coin, 3).map((c) => `${c.name} (${c.symbol})`), locale) }) });
  }
  if (description) entries.push({ question: fill(t.faqWhat, vars), answer: description });
  if (coin.venues.length) {
    entries.push({ question: fill(t.faqPerp, vars), answer: perp.length ? fill(t.faqPerpYes, { ...vars, venues: joinList(perp.map((v) => v.name), locale) }) : fill(t.faqPerpNo, vars) });
    const withNetworks = spot.find((v) => v.networks?.length);
    if (withNetworks) entries.push({ question: fill(t.faqNetwork, vars), answer: fill(t.faqNetworkA, { ...vars, venue: withNetworks.name, networks: joinList(withNetworks.networks.slice(0, 5), locale) }) });
    else if (!coin.networks) entries.push({ question: fill(t.faqNetwork, vars), answer: fill(t.faqNetworkNative, vars) });
    const fees = spot.map((v) => [v.name, spotFeeText(v.slug, locale)]).filter(([, fee]) => fee).slice(0, 3);
    if (fees.length) entries.push({ question: fill(t.faqFees, vars), answer: fill(t.faqFeesA, { ...vars, fees: joinList(fees.map(([name, fee]) => `${name} ${fee}`), locale) }) });
  }
  return entries.slice(0, 5);
}
