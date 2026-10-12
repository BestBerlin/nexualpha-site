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
const MARKETS = Object.freeze({ USD: ["en", "es", "fr", "de"], EUR: ["en", "es", "fr", "de"], BRL: ["pt-BR"], TRY: ["tr"], IDR: ["id"], VND: ["vi"], MXN: ["es"], JPY: ["ja"], KRW: ["ko"], CNY: ["zh-Hans"], GBP: ["en"], INR: [] });
export const converterLocales = (fiat) => MARKETS[fiat] || [];
export const converterIndexable = (coin, fiat, locale) => FIATS.includes(fiat) && converterLocales(fiat).includes(locale) && Boolean(coin?.venues.length);
export const converterCopy = (locale) => CONVERTER_COPY[locale] || CONVERTER_COPY.en;
export const converterTitle = (coin, fiat, locale) => fill(converterCopy(locale).title, { coin: coin.name, symbol: coin.symbol, fiat });
export function converterFaq(coin, fiat, locale) {
  const t = converterCopy(locale), vars = { coin: coin.name, symbol: coin.symbol, fiat };
  return [{ question: fill(t.faqRate, vars), answer: fill(t.faqRateA, vars) }, { question: fill(t.faqBuy, vars), answer: fill(t.faqBuyA, vars) }];
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
