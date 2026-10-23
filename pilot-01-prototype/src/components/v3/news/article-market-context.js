// Market context for an article (editorial templates, 2026-10-11): when an article is about BTC, ETH or SOL, the
// article rail shows that asset's live numbers from the market collector feed (/intel/market-events.json, the same
// feed /liquidations and /funding-rates render from). Pure helpers: asset detection is deterministic from the article
// text; the snapshot is read only from the feed and returns null when a figure is missing (nothing is invented).

export { MARKET_CONTEXT_ASSETS, detectArticleAssets, articleMarketAssets } from "../../../data/market-events-assets.js";

export { marketAssetSnapshot as marketContextSnapshot } from "../../../data/market-events-assets.js";

// Deterministic number formatting (no Intl: same output in every runtime).
const group = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
export function formatPrice(value) {
  if (value == null) return "—";
  const digits = value >= 1000 ? 0 : value >= 1 ? 2 : 4;
  const [int, frac] = value.toFixed(digits).split(".");
  return `$${group(int)}${frac ? `.${frac}` : ""}`;
}
export function formatSignedPct(value, digits = 2) {
  if (value == null) return "—";
  const fixed = Math.abs(value).toFixed(digits);
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${fixed}%`;
}
/** Funding rate (fraction per 8 h) as a percent with 4 decimals, e.g. -0.0014%. */
export const formatFunding = (rate) => (rate == null ? "—" : formatSignedPct(rate * 100, 4));
export function formatUsdShort(value) {
  if (value == null) return "—";
  const abs = Math.abs(value);
  const unit = abs >= 1e9 ? [1e9, "B"] : abs >= 1e6 ? [1e6, "M"] : abs >= 1e3 ? [1e3, "K"] : [1, ""];
  const v = abs / unit[0];
  return `$${v.toFixed(v >= 100 || unit[1] === "" ? 0 : v >= 10 ? 1 : 2)}${unit[1]}`;
}

export const MARKET_CONTEXT_COPY = {
  en: { title: "Market context", price: "Price · 24h", funding: "Funding / 8h", liq: "Liquidations 24h", venues: "Binance · OKX", source: "NexuAlpha market feed" },
  "zh-Hans": { title: "市场背景", price: "价格 · 24h", funding: "资金费率 / 8h", liq: "24h 爆仓", venues: "Binance · OKX", source: "NexuAlpha 市场数据" },
  "zh-Hant": { title: "市場背景", price: "價格 · 24h", funding: "資金費率 / 8h", liq: "24h 爆倉", venues: "Binance · OKX", source: "NexuAlpha 市場數據" },
  es: { title: "Contexto de mercado", price: "Precio · 24h", funding: "Funding / 8h", liq: "Liquidaciones 24h", venues: "Binance · OKX", source: "Datos de mercado NexuAlpha" },
  "pt-BR": { title: "Contexto de mercado", price: "Preço · 24h", funding: "Funding / 8h", liq: "Liquidações 24h", venues: "Binance · OKX", source: "Dados de mercado NexuAlpha" },
  fr: { title: "Contexte de marché", price: "Prix · 24h", funding: "Funding / 8h", liq: "Liquidations 24h", venues: "Binance · OKX", source: "Données de marché NexuAlpha" },
  de: { title: "Marktumfeld", price: "Preis · 24h", funding: "Funding / 8h", liq: "Liquidationen 24h", venues: "Binance · OKX", source: "NexuAlpha-Marktdaten" },
  it: { title: "Contesto di mercato", price: "Prezzo · 24h", funding: "Funding / 8h", liq: "Liquidazioni 24h", venues: "Binance · OKX", source: "Dati di mercato NexuAlpha" },
  ja: { title: "市場の状況", price: "価格 · 24h", funding: "資金調達率 / 8h", liq: "24h 清算", venues: "Binance · OKX", source: "NexuAlpha 市場データ" },
  ko: { title: "시장 상황", price: "가격 · 24h", funding: "펀딩비 / 8h", liq: "24h 청산", venues: "Binance · OKX", source: "NexuAlpha 시장 데이터" },
  ru: { title: "Рыночный контекст", price: "Цена · 24ч", funding: "Фандинг / 8ч", liq: "Ликвидации 24ч", venues: "Binance · OKX", source: "Рыночные данные NexuAlpha" },
  tr: { title: "Piyasa bağlamı", price: "Fiyat · 24s", funding: "Fonlama / 8s", liq: "Tasfiyeler 24s", venues: "Binance · OKX", source: "NexuAlpha piyasa verisi" },
  id: { title: "Konteks pasar", price: "Harga · 24j", funding: "Funding / 8j", liq: "Likuidasi 24j", venues: "Binance · OKX", source: "Data pasar NexuAlpha" },
  vi: { title: "Bối cảnh thị trường", price: "Giá · 24h", funding: "Funding / 8h", liq: "Thanh lý 24h", venues: "Binance · OKX", source: "Dữ liệu thị trường NexuAlpha" },
  ar: { title: "سياق السوق", price: "السعر · 24 ساعة", funding: "التمويل / 8 ساعات", liq: "التصفيات 24 ساعة", venues: "Binance · OKX", source: "بيانات سوق NexuAlpha" },

 // l10n: needs native review
 ur: {title:"مارکیٹ کا تناظر",price:"قیمت · 24h",funding:"فنڈنگ / 8h",liq:"لیکویڈیشنز 24h",venues:"Binance · OKX",source:"NexuAlpha مارکیٹ ڈیٹا"},
 // l10n: needs native review
 uk: {title:"Контекст ринку",price:"Ціна · 24h",funding:"Фінансування / 8h",liq:"Ліквідації 24h",venues:"Binance · OKX",source:"Ринкові дані NexuAlpha"},
};
export const marketContextCopy = (locale) => MARKET_CONTEXT_COPY[locale] || (String(locale || "").startsWith("zh") ? MARKET_CONTEXT_COPY["zh-Hans"] : MARKET_CONTEXT_COPY.en);
