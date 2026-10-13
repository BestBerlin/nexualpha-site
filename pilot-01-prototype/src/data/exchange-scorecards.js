import { COINS, COINS_GENERATED_AT, COIN_VENUE_SLUGS, coinVenueStatus } from "./coins.js";
import { FUNDING_GUIDES } from "./converter.js";
import { FACTS_AS_OF, factsForVenue, feeFact, feePair, primarySourceUrl } from "./exchange-facts.js";
import { FUNDING_MATRIX_SYMBOLS, FUNDING_MATRIX_VENUES, venueName as fundingVenueName, venueSlug } from "./funding-matrix.js";
import { isPartnerPromotableIn, isTurkeyGated, promotionCountries, jurisdictionPromotionBan } from "./partner-geo-policy.js";
import { resolvePromotions } from "./promotions.js";
import { venueDatabase } from "./venue-database.js";
import { licenseRecords } from "./licenses.js";

export const SCORECARD_MARKETS = Object.freeze([
  { key: "tr", country: "TR", name: "Türkiye", fiat: "TRY", locale: "tr" },
  { key: "vi", country: "VN", name: "Vietnam", fiat: "VND", locale: "vi" },
  { key: "id", country: "ID", name: "Indonesia", fiat: "IDR", locale: "id" },
  { key: "br", country: "BR", name: "Brazil", fiat: "BRL", locale: "pt-BR" },
  { key: "mx", country: "MX", name: "Mexico", fiat: "MXN", locale: "es" },
  { key: "latam", country: "MX", name: "LATAM (Mexico / MXN evidence)", fiat: "MXN", locale: "es" },
]);

const FALLBACK_SNAPSHOT_NOW = `${FACTS_AS_OF}T12:00:00+08:00`;
const TOP_COIN_LIMIT = 200;
const TURKEY_VENUES = new Set(["okx", "binance", "bybit"]);

const normalizeSlug = (value) => venueSlug(String(value || "").trim().toLowerCase());
const compact = (values) => values.filter((value) => value != null && value !== "");
const unique = (values) => [...new Set(compact(values))];
const numberOrNull = (value) => (typeof value === "number" && Number.isFinite(value) ? value : null);
const asIsoDay = (value) => (typeof value === "string" && /^\d{4}-\d\d-\d\d/.test(value) ? value.slice(0, 10) : null);
const asSgtDay = (value) => {
  const time = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(time)) return null;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(time));
};

const displayNumber = (value) => (numberOrNull(value) == null ? null : new Intl.NumberFormat("en").format(value));
const displayCount = (value, suffix) => (numberOrNull(value) == null ? "Not checked" : `${displayNumber(value)} ${suffix}`);
const displayBool = (value) => (value === true ? "Yes" : value === false ? "No" : "Not checked");

export function scorecardNow(now) {
  if (now == null) return Date.now();
  const clock = typeof now === "number" ? now : Date.parse(now);
  return Number.isFinite(clock) ? clock : Date.parse(FALLBACK_SNAPSHOT_NOW);
}

export function top200CoinCounts(slugs = []) {
  const wanted = new Set(slugs.map(normalizeSlug));
  const knownVenues = new Set(COIN_VENUE_SLUGS.filter((slug) => coinVenueStatus(slug)?.ok));
  const counts = Object.fromEntries([...wanted].map((slug) => [slug, knownVenues.has(slug) ? 0 : null]));
  for (const coin of COINS) {
    if (!coin || numberOrNull(coin.rank) == null || coin.rank > TOP_COIN_LIMIT) continue;
    for (const venue of coin.venues || []) {
      const slug = normalizeSlug(venue.slug);
      if (wanted.has(slug) && counts[slug] != null && (venue.spot?.length || venue.perp?.length)) counts[slug] += 1;
    }
  }
  return Object.freeze(counts);
}

function venue(slug) {
  const key = normalizeSlug(slug);
  const fact = factsForVenue(key);
  const profile = venueDatabase[key] || {};
  return Object.freeze({
    slug: key,
    name: fact?.name || profile.name || fundingVenueName(key),
    type: fact?.type || String(profile.category || "").toLowerCase() || null,
    profileHref: `/exchanges/${key}`,
  });
}

function numericWinner(values, direction) {
  const numeric = values.filter((item) => numberOrNull(item.value) != null);
  if (!numeric.length) return [];
  const target = direction === "min" ? Math.min(...numeric.map((item) => item.value)) : Math.max(...numeric.map((item) => item.value));
  return numeric.filter((item) => item.value === target).map((item) => item.slug);
}

function row(key, label, values, { direction = "max", rule, reason } = {}) {
  const winners = direction === "none" ? [] : numericWinner(values, direction);
  return Object.freeze({ key, label, values: Object.freeze(values), winners: Object.freeze(winners), rule, reason });
}

function withWinners(rowData, winners) {
  return Object.freeze({ ...rowData, winners: Object.freeze(unique(winners)) });
}

function value(slug, raw, display, { asOf = null, sources = [], meta = {} } = {}) {
  return Object.freeze({
    slug,
    value: raw,
    display: display || (raw == null ? "Not checked" : String(raw)),
    asOf,
    sources: Object.freeze(unique(sources)),
    ...meta,
  });
}

function feeValue(slug, product, locale) {
  const fact = feeFact(slug, product);
  const both = fact.state === "checked" && numberOrNull(fact.maker) != null && numberOrNull(fact.taker) != null;
  const blended = both ? (fact.maker + fact.taker) / 2 : null;
  return value(slug, blended, both ? feePair(fact.maker, fact.taker, locale) : fact.state === "none" ? "Not offered" : "Not checked", {
    asOf: fact.checkedOn,
    sources: [primarySourceUrl(slug)],
    meta: { maker: both ? fact.maker : null, taker: both ? fact.taker : null, state: fact.state },
  });
}

function coinCountValue(slug, counts) {
  const count = numberOrNull(counts[slug]);
  return value(slug, count, displayCount(count, `of top-${TOP_COIN_LIMIT}`), {
    asOf: asSgtDay(COINS_GENERATED_AT),
    sources: ["/coins"],
  });
}

function fundingCoverageValue(slug) {
  const supported = FUNDING_MATRIX_VENUES.includes(slug);
  return value(slug, supported, supported ? "Included in funding-rate matrix" : "Outside the reviewed funding matrix", {
    asOf: null,
    sources: ["/funding-rates"],
    meta: { supported, observedCoverage: null, configuredUniverse: FUNDING_MATRIX_SYMBOLS.length },
  });
}

function promotionValue(slug, context) {
  const selected = resolvePromotions({ ...context, venue: slug, topicTags: [slug] }).filter((item) => item.kind === "campaign" && item.partner === slug);
  const active = selected.length > 0;
  return value(slug, active, active ? "Current verified promotion" : "No current verified promotion", {
    asOf: asSgtDay(context.now),
    sources: active ? selected.map((item) => item.officialSource) : ["/activities"],
    meta: { promotions: selected.map((item) => ({ id: item.id, kind: item.kind, link: item.link, lastVerified: item.lastVerified || null })) },
  });
}

function fiatRailValue(slug, fiat, context) {
  const guide = (FUNDING_GUIDES[fiat] || []).find((item) => item.venue === slug);
  const countries = promotionCountries(context);
  const trBlocked = countries.includes("TR") && isTurkeyGated(slug, context);
  return value(slug, guide && !trBlocked ? true : null, guide && !trBlocked ? `${fiat} guide available` : "No reviewed local rail guide", {
    asOf: null,
    sources: guide ? [guide.url, `/convert/btc-to-${String(fiat || "usd").toLowerCase()}`] : ["/convert"],
    meta: { fiat, guide: guide?.url || null, promotionAllowed: !trBlocked },
  });
}

function productValue(slug, product) {
  const fact = feeFact(slug, product);
  const offered = fact.state === "checked" ? true : fact.state === "none" ? false : null;
  return value(slug, offered, displayBool(offered), {
    asOf: fact.checkedOn || FACTS_AS_OF,
    sources: [primarySourceUrl(slug)],
    meta: { state: fact.state },
  });
}

function nullFactValue(slug, label) {
  return value(slug, null, "Not in repo data", { asOf: null, sources: [], meta: { fact: label } });
}

function licenseValue(slug) {
  const records = licenseRecords.filter((record) => record.exchange === slug);
  if (!records.length) return value(slug, null, "No official register entry recorded", { asOf: null, sources: [], meta: { fact: "licenses" } });
  const display = records.map((record) => `${record.regulator} (${record.country}): ${record.status}`).join("; ");
  const asOf = records.map((record) => record.lastChecked).filter(Boolean).sort().at(-1) || null;
  return value(slug, records.length, display, { asOf, sources: records.map((record) => record.sourceUrl), meta: { records: records.length } });
}

function buildRows(slugs, context) {
  const counts = top200CoinCounts(slugs);
  const rows = [
    row("spotFees", "Lowest checked spot fees", slugs.map((slug) => feeValue(slug, "spot", context.locale)), { direction: "none", rule: "Lowest checked spot taker fee, then maker fee; unchecked rows do not compete." }),
    row("perpFees", "Lowest checked futures fees", slugs.map((slug) => feeValue(slug, "perp", context.locale)), { direction: "none", rule: "Lowest checked futures taker fee, then maker fee; unchecked rows do not compete." }),
    row("top200Coins", "Most top-200 coin availability", slugs.map((slug) => coinCountValue(slug, counts)), { direction: "none", rule: "Counts top-200 coins with spot or perp listing in coins data." }),
    row("fundingCoverage", "Funding-rate matrix participation", slugs.map(fundingCoverageValue), { direction: "none", rule: "Shows participation in the reviewed funding-matrix universe; no live observed pair count is inferred." }),
    row("localFiatRails", `Reviewed ${context.fiat || "local fiat"} funding guide`, slugs.map((slug) => fiatRailValue(slug, context.fiat, context)), { direction: "none", rule: "Only converter funding guides count as local fiat rail evidence." }),
    row("currentPromotion", "Current verified promotion", slugs.map((slug) => promotionValue(slug, context)), { direction: "none", rule: "Promotion must pass existing time, source, locale, market and partner gates." }),
    row("futures", "Futures product evidence", slugs.map((slug) => productValue(slug, "perp")), { direction: "none", rule: "Futures evidence comes from checked futures fee facts." }),
    row("licenses", "Official register entries", slugs.map(licenseValue), { direction: "none", rule: "Entries from the official-register directory (/licenses); statuses differ by regulator, so no venue wins this row." }),
    row("appRatings", "App rating facts", slugs.map((slug) => nullFactValue(slug, "appRatings")), { direction: "max", rule: "No app-rating data file is present in this repo slice, so no venue competes." }),
  ];
  return Object.freeze(rows.map((item) => {
    if (item.key === "spotFees") return withWinners(item, lowestBy(item, context, ["taker", "maker"]));
    if (item.key === "perpFees") return withWinners(item, lowestBy(item, context, ["taker", "maker"]));
    if (item.key === "top200Coins") return withWinners(item, highestBy(item, context));
    if (item.key === "localFiatRails") return withWinners(item, firstAvailable(item, context));
    if (item.key === "currentPromotion") return withWinners(item, firstAvailable(item, context));
    if (item.key === "futures") return withWinners(item, firstAvailable(item, context));
    if (item.key === "licenses" || item.key === "appRatings") return withWinners(item, []);
    return item;
  }));
}

function eligibleValues(rowData, context) {
  return (rowData?.values || []).filter((item) => isPartnerPromotableIn(item.slug, context));
}

function lowestBy(rowData, context, fields = ["value"]) {
  const values = eligibleValues(rowData, context).filter((item) => fields.every((field) => numberOrNull(item[field]) != null));
  if (!values.length) return [];
  const sorted = [...values].sort((a, b) => {
    for (const field of fields) {
      const delta = a[field] - b[field];
      if (delta !== 0) return delta;
    }
    return a.slug.localeCompare(b.slug);
  });
  const best = sorted[0];
  return sorted.filter((item) => fields.every((field) => item[field] === best[field])).map((item) => item.slug);
}

function highestBy(rowData, context, field = "value") {
  const values = eligibleValues(rowData, context).filter((item) => numberOrNull(item[field]) != null);
  if (!values.length) return [];
  const best = Math.max(...values.map((item) => item[field]));
  return values.filter((item) => item[field] === best).map((item) => item.slug).sort();
}

function firstAvailable(rowData, context) {
  return eligibleValues(rowData, context).filter((item) => item.value === true).map((item) => item.slug).sort();
}

function verdict(key, label, winners, rule) {
  return Object.freeze({ key, label, winners: Object.freeze(unique(winners)), rule });
}

function buildVerdicts(rows, context) {
  const byKey = Object.fromEntries(rows.map((item) => [item.key, item]));
  const beginnerRails = firstAvailable(byKey.localFiatRails, context);
  return Object.freeze([
    verdict("lowestFees", "Best for lowest checked fees", lowestBy(byKey.spotFees, context, ["taker", "maker"]), "Choose the lowest checked spot taker fee, then maker fee; ties remain ties."),
    verdict("mostCoins", "Best for most top-200 coins", highestBy(byKey.top200Coins, context), "Choose the highest actual top-200 listing count from coins data."),
    verdict("futures", "Best for futures", lowestBy(byKey.perpFees, context, ["taker", "maker"]), "Choose the lowest checked futures taker fee, then maker fee; funding matrix participation is descriptive only."),
    verdict("beginners", "Best for beginners (funding / fee proxy)", beginnerRails.length ? beginnerRails : lowestBy(byKey.spotFees, context, ["taker", "maker"]), "Prefer a reviewed local funding guide; otherwise choose the lowest checked spot taker fee, then maker fee."),
  ]);
}

function marketFor(context) {
  const market = SCORECARD_MARKETS.find((item) => item.key === String(context.market || "").toLowerCase() || item.country === String(context.market || "").toUpperCase())
    || (!context.market || context.market === "unknown" ? SCORECARD_MARKETS.find((item) => item.locale === context.locale) : null);
  return market || { key: String(context.market || "global"), name: "Global", fiat: context.fiat || "USD", locale: context.locale };
}

export function buildScorecard(slugs, { locale = "en", market, fiat, now = Date.now() } = {}) {
  const selected = unique((Array.isArray(slugs) ? slugs : String(slugs || "").split("-vs-")).map(normalizeSlug)).filter(Boolean);
  const marketInfo = marketFor({ locale, market, fiat });
  const context = { locale, market: market || marketInfo.key, fiat: fiat || marketInfo.fiat, now: scorecardNow(now) };
  const rows = buildRows(selected, context);
  return Object.freeze({
    generatedAt: asSgtDay(context.now),
    factsAsOf: FACTS_AS_OF,
    coinListingsAsOf: asIsoDay(COINS_GENERATED_AT),
    market: marketInfo,
    venues: Object.freeze(selected.map(venue)),
    rows,
    verdicts: buildVerdicts(rows, context),
  });
}

export function countryRankings({ locale = "en", market, now = Date.now() } = {}) {
  // A no-promotion jurisdiction (Vietnam, owner 2026-10-13: Resolution 05/2025/NQ-CP) gets no "best exchange" table.
  return Object.freeze(SCORECARD_MARKETS.filter((item) => (!market || item.key === market) && !jurisdictionPromotionBan({ market: item.country })).map((item) => {
    // Geo policy is keyed by ISO country; Türkiye is further limited to OKX / Binance / Bybit (owner rule).
    const slugs = unique(COIN_VENUE_SLUGS.filter((slug) => isPartnerPromotableIn(slug, { locale: item.locale, market: item.country })
      && (item.country !== "TR" || TURKEY_VENUES.has(normalizeSlug(slug)))));
    const card = buildScorecard(slugs, { locale: locale || item.locale, market: item.country, fiat: item.fiat, now: scorecardNow(now) });
    return Object.freeze({
      key: item.key,
      name: item.name,
      fiat: item.fiat,
      asOf: card.generatedAt,
      venues: card.venues,
      rows: card.rows,
      verdicts: card.verdicts,
    });
  }));
}
