import { COIN_ROWS } from "./coins-data.generated.js";
import { coinBySlug, coinSignup, coinPath, fill, spotVenues } from "./coins.js";
import { CONVERTER_COPY } from "./converter-copy.js";
import { FIATS } from "./converter-routes.js";
export { FIATS };
// Fixed release universe: runtime price/rank updates cannot silently change the route set.
const SLUGS = COIN_ROWS.slice().sort((a, b) => a[4] - b[4]).slice(0, 30).map((row) => row[1]);
export const converterCoins = () => SLUGS.map(coinBySlug);
export const converterCoin = (symbol) => converterCoins().find((coin) => coin.symbol.toLowerCase() === String(symbol).toLowerCase()) || null;
export const converterPath = (coin, fiat) => `/convert/${coin.symbol.toLowerCase()}-to-${fiat.toLowerCase()}`;
export const CONVERTER_INDEXABLE_SYMBOLS = Object.freeze(["BTC", "ETH", "SOL", "USDT"]);
export const CONVERTER_INDEXABLE_FIATS = Object.freeze(["USD", "EUR", "GBP"]);
export const CONVERTER_INDEXABLE_LOCALES = Object.freeze(["en"]);
const MARKETS = Object.freeze({ USD: ["en", "es", "fr", "de"], EUR: ["en", "es", "fr", "de"], BRL: ["pt-BR"], TRY: ["tr"], IDR: ["id"], VND: ["vi"], MXN: ["es"], JPY: ["ja"], KRW: ["ko"], CNY: ["zh-Hans"], GBP: ["en"], INR: [] });
export const converterLocales = (fiat) => MARKETS[fiat] || [];
export const converterIndexable = (coin, fiat, locale) => Boolean(coin?.venues.length)
  && CONVERTER_INDEXABLE_SYMBOLS.includes(String(coin.symbol || "").toUpperCase())
  && CONVERTER_INDEXABLE_FIATS.includes(fiat)
  && CONVERTER_INDEXABLE_LOCALES.includes(locale);
export const converterIndexableCoins = () => converterCoins().filter((coin) => CONVERTER_INDEXABLE_SYMBOLS.includes(String(coin?.symbol || "").toUpperCase()));
export function converterRelatedTargets(coin, fiat, locale, { fiatLimit = 4, peerLimit = 4 } = {}) {
  const relatedFiats = FIATS
    .filter((code) => code !== fiat)
    .map((code) => ({ code, locale: converterLocales(code).find((candidate) => converterIndexable(coin, code, candidate)) }))
    .filter((item) => item.locale)
    .slice(0, fiatLimit);
  const peers = converterIndexableCoins()
    .filter((row) => row && row.slug !== coin?.slug && converterIndexable(row, fiat, locale))
    .slice(0, peerLimit);
  return { relatedFiats, peers };
}
export const converterCopy = (locale) => CONVERTER_COPY[locale] || CONVERTER_COPY.en;
export const converterTitle = (coin, fiat, locale) => fill(converterCopy(locale).title, { coin: coin.name, symbol: coin.symbol, fiat });
export function converterFaq(coin, fiat, locale) {
  const t = converterCopy(locale), vars = { coin: coin.name, symbol: coin.symbol, fiat };
  // USD needs no exchange-rate step (QA 2026-10-13: "multiply by the USD exchange rate" on /convert/btc-to-usd).
  const rateAnswer = fiat === "USD" ? (t.faqRateUsdA || converterCopy("en").faqRateUsdA) : t.faqRateA;
  return [{ question: fill(t.faqRate, vars), answer: fill(rateAnswer, vars) }, { question: fill(t.faqBuy, vars), answer: fill(t.faqBuyA, vars) }];
}
export const QUICK_AMOUNTS = Object.freeze([0.01, 0.1, 1, 5, 10, 25, 50, 100]);
export function unitPrice(usd, fiat, snapshot) {
  const rate = fiat === "USD" ? 1 : snapshot?.rates?.[fiat];
  if (!Number.isFinite(usd) || usd <= 0 || !Number.isFinite(rate) || rate <= 0) return null;
  const price = usd * rate;
  return Number.isFinite(price) && price > 0 ? price : null;
}
export function convertedAmount(input, price, reverse = false) {
  if (String(input).trim() === "" || !Number.isFinite(price) || price <= 0) return null;
  const value = Number(input);
  if (!Number.isFinite(value) || value < 0) return null;
  const result = reverse ? value / price : value * price;
  return Number.isFinite(result) ? result : null;
}
export function formatAmount(value, locale) {
  if (!Number.isFinite(value)) return "–";
  try { return new Intl.NumberFormat(locale, { maximumFractionDigits: 8 }).format(value); } catch { return String(value); }
}
// Fiat amounts (QA 2026-10-13: "1 BTC = 13,172,339.614544 JPY"): whole units for currencies without minor units in
// everyday use, cents for the rest; amounts below 1 keep four significant digits so cheap coins stay readable.
const WHOLE_UNIT_FIATS = new Set(["JPY", "KRW", "VND", "IDR"]);
export function formatFiatAmount(value, locale, fiat) {
  if (!Number.isFinite(value)) return "–";
  const options = Math.abs(value) >= 1 || value === 0
    ? { maximumFractionDigits: WHOLE_UNIT_FIATS.has(fiat) ? 0 : 2, minimumFractionDigits: WHOLE_UNIT_FIATS.has(fiat) ? 0 : 2 }
    : { maximumSignificantDigits: 4 };
  try { return new Intl.NumberFormat(locale, options).format(value); } catch { return String(value); }
}
// A quote currency is evidence of a spot pair only. Funding support is kept separate.
export const fiatSpotVenues = (coin, fiat) => spotVenues(coin).filter((venue) => venue.spot.includes(fiat));
// Existing reviewed platform guidance covers BRL and MXN; account availability remains conditional.
export const FUNDING_GUIDES = Object.freeze({
  BRL: [{ venue: "binance", url: "https://www.binance.com/pt-BR/support/faq/detail/53636607eebc42dbb513863b49bba98f" }, { venue: "okx", url: "https://www.okx.com/help/how-do-i-deposit-brl" }],
  MXN: [{ venue: "binance", url: "https://www.binance.com/es-MX/support/faq/detail/c45b457e73a14580ab6be95f10bef5b5" }],
});
export function converterVenues(coin, fiat, context) {
  const guides = FUNDING_GUIDES[fiat] || [];
  return spotVenues(coin).flatMap((venue) => {
    const guide = guides.find((row) => row.venue === venue.slug);
    const signup = coinSignup(venue.slug, coin, context);
    if (!guide || !signup) return [];
    return [{ ...venue, guide: guide.url, signup: { ...signup, href: `/go/${venue.slug}?src=convert-${coin.symbol.toLowerCase()}-${fiat.toLowerCase()}` } }];
  });
}
export { coinPath };
