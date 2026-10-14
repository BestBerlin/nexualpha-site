// Deposit/withdrawal hub model (出入金, 2026-10-15): turns the sourced fiat rows (fiat-rails.generated.js) into the hub,
// country and crypto-card views. Rules:
// - Only sourced facts render; unknown values render nothing.
// - Exchange order is the owner's push order (Bitget > OKX > Binance > …); Türkiye pages and the tr locale never show
//   Bitget; an exchange whose own terms restrict a country is left out of that country's page.
// - Sign-up links are /go routes from venueGoHref (code-carrying), gated per locale and per country market; neutral
//   locales and Vietnam get none. Source citations link only through a code-carrying /go route, otherwise plain text.
import { FIAT_CHECKED, FIAT_SOURCES, FIAT_ROWS, FIAT_NEGATIVES, CRYPTO_CARDS, CN_NOTICE, CN_EXCLUDED } from "./fiat-rails.generated.js";
import { PARTNER_RESTRICTED_COUNTRIES } from "./partner-geo-policy.generated.js";
import { isTurkeyUnlistedVenue } from "./partner-geo-policy.js";
import { isNeutralCtaLocale } from "./locale-policy.js";
import { venueGoHref } from "./source-bound-cta.js";
import { outboundLink, sourceDomain } from "./exchange-outbound.js";
import { venueDisplayName } from "./venue-display-names.js";
import { licenseRegionName } from "./license-region-names.js";
import { DEPOSIT_COUNTRY_SLUGS, DEPOSIT_LOCALES, depositPath, CRYPTO_CARDS_PATH } from "./deposit-routes.js";
import { depositCopy, fillDeposit } from "./deposit-copy.js";

export { FIAT_CHECKED, CN_NOTICE };
export const PUSH_ORDER = Object.freeze(["bitget", "okx", "binance", "bybit", "gate-io", "gate-tr", "mexc", "htx", "coinw", "kraken", "backpack", "coinbase"]);
const NAMES = { backpack: "Backpack", "gate-tr": "Gate TR" };
const exName = (slug) => NAMES[slug] || venueDisplayName(slug);
const PROFILE_SLUGS = new Set(["bitget", "okx", "binance", "bybit", "gate-io", "mexc", "coinw", "kraken", "backpack", "coinbase"]);

// slug, ISO-like code used by the research rows, partner-policy market, local currency, hub region.
export const DEPOSIT_COUNTRIES = Object.freeze([
  { slug: "singapore", code: "SG", market: "SG", cur: "SGD", region: "asia", locales: ["en", "zh-Hans"] },
  { slug: "hong-kong", code: "HK", market: "HK", cur: "HKD", region: "asia", locales: ["en", "zh-Hans", "zh-Hant"] },
  { slug: "taiwan", code: "TW", market: "TW", cur: "TWD", region: "asia", locales: ["en", "zh-Hans", "zh-Hant"] },
  { slug: "japan", code: "JP", market: "JP", cur: "JPY", region: "asia", locales: ["en", "zh-Hans", "ja"] },
  { slug: "south-korea", code: "KR", market: "KR", cur: "KRW", region: "asia", locales: ["en", "zh-Hans", "ko"] },
  { slug: "philippines", code: "PH", market: "PH", cur: "PHP", region: "asia", locales: ["en", "zh-Hans"] },
  { slug: "indonesia", code: "ID", market: "ID", cur: "IDR", region: "asia", locales: ["en", "zh-Hans", "id"] },
  { slug: "vietnam", code: "VN", market: "VN", cur: "VND", region: "asia", locales: ["en", "zh-Hans", "vi"] },
  { slug: "india", code: "IN", market: "IN", cur: "INR", region: "asia", locales: ["en", "zh-Hans"] },
  { slug: "brazil", code: "BR", market: "BR", cur: "BRL", region: "americas", locales: ["en", "zh-Hans", "pt-BR", "es"] },
  { slug: "mexico", code: "MX", market: "MX", cur: "MXN", region: "americas", locales: ["en", "zh-Hans", "es"] },
  { slug: "argentina", code: "AR", market: "AR", cur: "ARS", region: "americas", locales: ["en", "zh-Hans", "es"] },
  { slug: "eu-sepa", code: "EU", market: "EU", cur: "EUR", region: "europe", locales: ["en", "zh-Hans", "de", "fr", "it", "es"] },
  { slug: "united-kingdom", code: "GB", market: "UK", cur: "GBP", region: "europe", locales: ["en", "zh-Hans"] },
  { slug: "turkiye", code: "TR", market: "TR", cur: "TRY", region: "europe", locales: ["en", "tr"] },
  { slug: "nigeria", code: "NG", market: "NG", cur: "NGN", region: "africa", locales: ["en", "zh-Hans"] },
].filter((country) => DEPOSIT_COUNTRY_SLUGS.includes(country.slug)));
export const DEPOSIT_REGIONS = Object.freeze(["asia", "americas", "europe", "africa"]);

const TAIWAN = { en: "Taiwan", "zh-Hans": "台湾", "zh-Hant": "台灣", es: "Taiwán", "pt-BR": "Taiwan", fr: "Taïwan", de: "Taiwan", it: "Taiwan", ja: "台湾", ko: "대만", tr: "Tayvan", ru: "Тайвань", ar: "تايوان", id: "Taiwan", vi: "Đài Loan", ur: "تائیوان", uk: "Тайвань" };
const EU_SEPA = { en: "the EU (SEPA)", "zh-Hans": "欧盟（SEPA）", "zh-Hant": "歐盟（SEPA）", es: "la UE (SEPA)", "pt-BR": "a UE (SEPA)", fr: "UE (SEPA)", de: "EU (SEPA)", it: "UE (SEPA)", ja: "EU（SEPA）", ko: "EU(SEPA)", tr: "AB (SEPA)", ru: "ЕС (SEPA)", ar: "الاتحاد الأوروبي (SEPA)", id: "Uni Eropa (SEPA)", vi: "EU (SEPA)", ur: "یورپی یونین (SEPA)", uk: "ЄС (SEPA)" };
const EU_SHORT = { en: "EU (SEPA)", es: "UE (SEPA)", "pt-BR": "UE (SEPA)" };
const UK_EN = { en: "the UK" };

export const depositCountry = (slug) => DEPOSIT_COUNTRIES.find((country) => country.slug === slug) || null;
export function depositCountryName(slugOrCountry, locale = "en", { inSentence = true } = {}) {
  const country = typeof slugOrCountry === "string" ? depositCountry(slugOrCountry) : slugOrCountry;
  if (!country) return "";
  if (country.code === "TW") return TAIWAN[locale] || TAIWAN.en;
  if (country.code === "EU") return (!inSentence && EU_SHORT[locale]) || EU_SEPA[locale] || EU_SEPA.en;
  if (country.code === "GB" && inSentence && UK_EN[locale]) return UK_EN[locale];
  return licenseRegionName(country.code, locale, country.slug);
}
export const depositCountryLabel = (country, locale) => depositCountryName(country, locale, { inSentence: false }).replace(/^the /, "");

// ---- formatting (static, identical in SSR and the browser) ----------------------------------------------------------
const COMMA_DECIMAL = new Set(["es", "pt-BR", "fr", "de", "it", "tr", "ru", "id", "vi", "uk"]);
const num = (value, locale) => {
  const text = String(Math.round(value * 100) / 100);
  return COMMA_DECIMAL.has(locale) ? text.replace(".", ",") : text;
};
export function pct(value, locale) {
  const n = num(value, locale);
  if (locale === "tr") return `%${n}`;
  if (locale === "fr" || locale === "de") return `${n} %`;
  return `${n}%`;
}
const money = (value, cur, locale) => `${num(value, locale)} ${cur}`;
const CJK = (locale) => /^(zh|ja)/.test(locale);
const listSep = (locale) => (CJK(locale) ? "、" : ["ar", "ur"].includes(locale) ? "، " : ", ");
export const joinList = (items, locale) => [...new Set(items.filter(Boolean))].join(listSep(locale));

export function feeText(fee, locale) {
  if (!fee) return "";
  const t = depositCopy(locale).fee;
  if (fee.t === "free") return t.free;
  const value = fee.t === "pct" ? pct(fee.v, locale) : money(fee.v, fee.cur, locale);
  if (fee.tax) return fillDeposit(t.tax, { v: value });
  if (fee.approx) return fillDeposit(t.approx, { v: value });
  if (fee.after) return fillDeposit(t.after, { v: value });
  return value;
}
export function speedText(key, locale) {
  if (!key) return "";
  const t = depositCopy(locale).speed;
  const range = key.match(/^bd(\d)_(\d)$/);
  if (range) return fillDeposit(t.bd, { a: range[1], b: range[2] });
  return t[key] || "";
}
// Chinese copy keeps a space between Latin names/figures and Han characters ("在 OKX 注册").
export function cjkSpace(text, locale) {
  if (!String(locale || "").startsWith("zh")) return text;
  return String(text).replace(/([A-Za-z0-9%)\]])([\u4e00-\u9fff])/g, "$1 $2").replace(/([\u4e00-\u9fff])([A-Za-z0-9(\[])/g, "$1 $2");
}
const paren = (parts, locale) => {
  const value = parts.filter(Boolean).join(" · ");
  if (!value) return "";
  return CJK(locale) ? `（${value}）` : ` (${value})`;
};

// ---- rows ----------------------------------------------------------------------------------------------------------
const pushRank = (slug) => { const i = PUSH_ORDER.indexOf(slug); return i < 0 ? 99 : i; };
export const byPush = (a, b) => pushRank(a) - pushRank(b);

/** Sourced rows for one country, after the country restriction, Türkiye and tr-locale rules. */
export function depositRows(country, { locale = "en" } = {}) {
  const code = country.code;
  return FIAT_ROWS.filter((row) => row.c === code
    && !(PARTNER_RESTRICTED_COUNTRIES[row.x] || []).includes(code)
    && !isTurkeyUnlistedVenue(row.x, { locale })
    && !(code === "TR" && isTurkeyUnlistedVenue(row.x, { market: "TR" })));
}

const railLabel = (row, locale) => row.r || `${depositCopy(locale).method[row.k] || ""}${row.cur ? ` ${row.cur}` : ""}`.trim();
const column = (row) => (row.k === "card" ? "card" : row.k === "p2p" ? "p2p" : row.d === "withdrawal" ? "bankOut" : "bankIn");

/** Signed-up /go route for one exchange on this page, or null (neutral locale, Vietnam, partner gate, Türkiye). */
export function depositSignup(slug, { locale = "en", market, src = "deposit" } = {}) {
  if (isNeutralCtaLocale(locale)) return null;
  if (isTurkeyUnlistedVenue(slug, { locale }) || (market === "TR" && isTurkeyUnlistedVenue(slug, { market: "TR" }))) return null;
  // Both gates, like the licence directory: the reader's locale and the page's country.
  if (!venueGoHref(slug, src, locale)) return null;
  return market ? venueGoHref(slug, src, locale, market) : venueGoHref(slug, src, locale);
}

/** Source footnote: { n, id, label, title, href|null, checked, published }. */
function sourceEntry(id, n, locale, market) {
  const [url, title, checked, published, owner] = FIAT_SOURCES[id] || [];
  if (!url) return null;
  const host = sourceDomain(url);
  // Exchange-owned pages are cited only through a code-carrying /go route (Binance, Bybit, Kraken), otherwise as plain
  // text; pages that belong to no exchange (regulators) link directly.
  const link = outboundLink(url, { locale, market, src: "deposit-source" });
  const href = owner ? (link && !link.external && link.href?.startsWith("/go/") ? link.href : null) : (link?.href || url);
  return { n, id, label: host, title, href, checked, published };
}

function footnotes(rows, locale, market) {
  const ids = [];
  for (const row of rows) for (const id of row.s) if (!ids.includes(id)) ids.push(id);
  return ids.map((id, index) => sourceEntry(id, index + 1, locale, market)).filter(Boolean);
}

function exchangeRoutes(rows, notes, locale) {
  const slugs = [...new Set(rows.map((row) => row.x))].sort(byPush);
  return slugs.map((slug) => {
    const own = rows.filter((row) => row.x === slug);
    const cells = { card: [], bankIn: [], bankOut: [], p2p: [] };
    for (const row of own) cells[column(row)].push({
      label: railLabel(row, locale), fee: feeText(row.f, locale), speed: speedText(row.t, locale), dir: row.d,
      notes: row.s.map((id) => notes.find((note) => note.id === id)?.n).filter(Boolean),
    });
    return { slug, name: exName(slug), profile: PROFILE_SLUGS.has(slug), rows: own, cells };
  });
}

function bestRoute(entry) {
  const inRow = entry.rows.find((row) => column(row) === "bankIn");
  const outRow = entry.rows.find((row) => column(row) === "bankOut");
  return { inRow, outRow, card: entry.cells.card.length > 0, p2p: entry.rows.find((row) => row.k === "p2p") };
}

/** Method summary ("PIX, Card, P2P") for one exchange or the whole page. */
function methodsSummary(rows, locale) {
  const t = depositCopy(locale);
  const rails = rows.filter((row) => row.k !== "card" && row.k !== "p2p").map((row) => row.r || `${t.method[row.k]}${row.cur ? ` ${row.cur}` : ""}`);
  const extra = [rows.some((row) => row.k === "card") && t.method.card, rows.some((row) => row.k === "p2p") && `${t.method.p2p}${rows.find((row) => row.k === "p2p")?.cur ? ` ${rows.find((row) => row.k === "p2p").cur}` : ""}`];
  return joinList([...rails, ...extra], locale);
}

export function depositCountryModel(slug, locale = "en") {
  const country = depositCountry(slug);
  if (!country) return null;
  const t = depositCopy(locale);
  const rows = depositRows(country, { locale });
  const notes = footnotes(rows, locale, country.market);
  const exchanges = exchangeRoutes(rows, notes, locale);
  for (const entry of exchanges) entry.signup = depositSignup(entry.slug, { locale, market: country.market, src: `deposit-${country.slug}`.slice(0, 48) });
  const promotable = exchanges.filter((entry) => entry.signup);
  // First choice: the best local route class (two-way local-currency bank > local bank deposit > two-way foreign-currency
  // wire > card/P2P), then the owner's push order; exchanges we can sign people up to come first.
  const routeClass = (entry) => {
    const { inRow, outRow } = bestRoute(entry);
    const local = (row) => row && (!row.cur || row.cur === country.cur);
    if (local(inRow) && local(outRow)) return 4;
    if (local(inRow)) return 3;
    if (inRow && outRow) return 2;
    return 1;
  };
  const ranked = (list) => [...list].sort((a, b) => routeClass(b) - routeClass(a) || byPush(a.slug, b.slug));
  const top = ranked(promotable)[0] || ranked(exchanges)[0] || null;
  const informational = promotable.length === 0;
  const name = depositCountryName(country, locale);
  const vars = { country: name, cur: country.cur };
  const answer = [];
  if (exchanges.length) answer.push(fillDeposit(t.a1, { ...vars, exs: joinList(exchanges.map((e) => e.name), locale), methods: methodsSummary(rows, locale) }));
  if (top) {
    const { inRow, outRow } = bestRoute(top);
    if (inRow && outRow) answer.push(fillDeposit(t.a2, { ex: top.name, rail: railLabel(inRow, locale), inFee: paren([feeText(inRow.f, locale), speedText(inRow.t, locale)], locale), outFee: paren([feeText(outRow.f, locale), speedText(outRow.t, locale)], locale) }));
    else if (inRow) answer.push(fillDeposit(t.a2in, { ex: top.name, rail: railLabel(inRow, locale), inFee: paren([feeText(inRow.f, locale), speedText(inRow.t, locale)], locale) }));
  }
  const p2pEx = exchanges.filter((e) => e.cells.p2p.length).map((e) => e.name);
  if (p2pEx.length) answer.push(fillDeposit(t.a3, { ...vars, exs: joinList(p2pEx, locale) }));
  const cardEx = exchanges.filter((e) => e.cells.card.length).map((e) => e.name);
  if (cardEx.length) answer.push(fillDeposit(t.a4, { exs: joinList(cardEx, locale) }));
  answer.push(fillDeposit(t.checked, { date: FIAT_CHECKED }));

  const steps = [];
  if (top) {
    const route = bestRoute(top);
    steps.push(fillDeposit(t.s1, { ex: top.name }));
    if (route.inRow) steps.push(fillDeposit(t.s2bank, { cur: route.inRow.cur || country.cur, rail: route.inRow.r || t.method[route.inRow.k] }));
    if (route.card) steps.push(t.s2card);
    if (route.p2p) steps.push(fillDeposit(t.s2p2p, { cur: route.p2p.cur || country.cur }));
    steps.push(t.s3);
    if (route.outRow) steps.push(fillDeposit(t.s4bank, { cur: route.outRow.cur || country.cur, rail: route.outRow.r || t.method[route.outRow.k] }));
    else if (route.p2p) steps.push(fillDeposit(t.s4p2p, { cur: route.p2p.cur || country.cur }));
  }

  const faqs = [];
  if (top && !informational) faqs.push([fillDeposit(t.faqBest, vars), fillDeposit(t.faqBestA, { ...vars, ex: top.name, methods: methodsSummary(top.rows, locale) })]);
  const outEx = exchanges.filter((e) => e.cells.bankOut.length);
  const outLocal = outEx.filter((e) => e.rows.some((row) => column(row) === "bankOut" && (!row.cur || row.cur === country.cur)));
  if (outLocal.length) faqs.push([fillDeposit(t.faqOut, vars), fillDeposit(t.faqOutYes, { ...vars, exs: joinList(outLocal.map((e) => e.name), locale) })]);
  else if (p2pEx.length) faqs.push([fillDeposit(t.faqOut, vars), fillDeposit(t.faqOutP2p, { ...vars, exs: joinList(p2pEx, locale) })]);

  const negatives = FIAT_NEGATIVES.filter((entry) => entry.c === country.code && !isTurkeyUnlistedVenue(entry.x, { locale }))
    .map((entry) => ({ ...entry, name: exName(entry.x), what: entry.what.map((key) => t.not[key]).filter(Boolean), note: sourceEntry(entry.s[0], null, locale, country.market) }));
  const cards = depositCards(locale).filter((item) => (item.regions || []).includes(country.code));
  const exchangeCount = exchanges.length;
  const indexable = rows.length >= 3 && exchangeCount >= 2;
  return {
    country, name, label: depositCountryLabel(country, locale), rows, exchanges, top, informational,
    cta: !informational && top?.signup ? { href: top.signup, slug: top.slug, name: top.name } : null,
    answer: cjkSpace(answer.join(CJK(locale) ? "" : " "), locale), steps: steps.map((step) => cjkSpace(step, locale)),
    faqs: faqs.map(([q, a]) => [cjkSpace(q, locale), cjkSpace(a, locale)]), notes, negatives, cards,
    indexable, indexLocales: indexable ? country.locales : [],
  };
}

/** Hub cards: one per country with the first exchange, its method chips and the headline route. */
export function depositHubModel(locale = "en") {
  const t = depositCopy(locale);
  const countries = DEPOSIT_COUNTRIES.map((country) => {
    const model = depositCountryModel(country.slug, locale);
    const top = model.top;
    const route = top ? bestRoute(top) : {};
    const headline = route.inRow || route.outRow || top?.rows[0] || null;
    const kinds = [...new Set(model.rows.map((row) => (row.k === "ewallet" || row.k === "qr" ? "bank" : row.k)))];
    if (model.cards.length) kinds.push("cryptoCard");
    return {
      slug: country.slug, region: country.region, label: model.label, href: depositPath(locale, country.slug),
      top: top ? { slug: top.slug, name: top.name } : null, informational: model.informational,
      kinds, rails: [...new Set(model.rows.filter((row) => row.k !== "card" && row.k !== "p2p" && row.r).map((row) => row.r))].slice(0, 3),
      headline: headline ? { label: railLabel(headline, locale), fee: feeText(headline.f, locale), speed: speedText(headline.t, locale), dir: t.dir[headline.d] } : null,
      exchangeCount: model.exchanges.length,
    };
  });
  return { countries, cn: cnModel(locale) };
}

function cnModel(locale) {
  if (!CN_NOTICE) return null;
  const t = depositCopy(locale);
  const excluded = CN_EXCLUDED.filter((slug) => !isTurkeyUnlistedVenue(slug, { locale })).sort(byPush).map(exName);
  return { title: t.cnTitle, body: cjkSpace(fillDeposit(t.cnBody, { doc: CN_NOTICE.doc, date: CN_NOTICE.published, exs: joinList(excluded, locale) }), locale), url: CN_NOTICE.url, checked: CN_NOTICE.checked, published: CN_NOTICE.published };
}

// ---- crypto cards --------------------------------------------------------------------------------------------------
function rewardText(cb, locale) {
  if (!cb) return "";
  const r = depositCopy(locale).reward;
  const value = cb.upTo != null ? fillDeposit(r.upTo, { v: pct(cb.upTo, locale) }) : cb.range ? fillDeposit(r.range, { a: num(cb.range[0], locale), b: pct(cb.range[1], locale) }) : pct(cb.pct, locale);
  return `${value} ${r[cb.kind] || ""}`.trim();
}
function cardFeeText([key, value], locale) {
  const t = depositCopy(locale);
  const name = t.feeName[key] || key;
  let text;
  if (value === "0" || value === 0) text = t.feeVal.none;
  else if (typeof value === "number") text = pct(value, locale);
  else if (value?.free != null) text = fillDeposit(t.feeVal.freeMonth, { v: value.free });
  else if (value?.flat != null) text = `${money(value.flat, value.cur, locale)}${value.plusPct != null ? ` + ${pct(value.plusPct, locale)}` : ""}`;
  else if (value?.pct != null) text = value.after ? fillDeposit(t.feeVal.afterFree, { v: pct(value.pct, locale) }) : pct(value.pct, locale);
  return text ? { name, text } : null;
}
function regionsText(regions, locale) {
  if (!regions) return "";
  const t = depositCopy(locale);
  return joinList(regions.map((code) => t.regionName[code] || (code === "TW" ? TAIWAN[locale] || TAIWAN.en : licenseRegionName(code, locale, code))), locale);
}

export function depositCards(locale = "en") {
  const t = depositCopy(locale);
  return CRYPTO_CARDS.filter((item) => !isTurkeyUnlistedVenue(item.x, { locale })).sort((a, b) => byPush(a.x, b.x)).map((item) => ({
    ...item,
    exchangeName: exName(item.x),
    status: t.status[item.st] || "",
    regionsText: regionsText(item.regions, locale),
    reward: rewardText(item.cb, locale),
    feeList: item.fees.map((fee) => cardFeeText(fee, locale)).filter(Boolean),
    steps: item.apply.map((key) => t.apply[key]).filter(Boolean),
    signup: depositSignup(item.x, { locale, src: "crypto-cards" }),
    profile: PROFILE_SLUGS.has(item.x),
  }));
}

export function depositCardNotes(cards, locale) {
  const ids = [];
  for (const item of cards) for (const id of item.s) if (!ids.includes(id)) ids.push(id);
  const notes = ids.map((id, index) => sourceEntry(id, index + 1, locale)).filter(Boolean);
  return { notes, byCard: Object.fromEntries(cards.map((item) => [item.id, item.s.map((id) => notes.find((note) => note.id === id)?.n).filter(Boolean)])) };
}

export const DEPOSIT_INDEX_LOCALES = DEPOSIT_LOCALES;
export { CRYPTO_CARDS_PATH, depositPath };
