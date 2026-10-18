// Linkable data assets + press kit (SEO W43, 2026-10-18). Entry-safe: the router, the footer and /about import this
// file, so it holds only paths, asset keys and the short "Press & data" link label (17 UI locales).
// Pages: /data/exchange-fee-index, /data/tokenized-stock-tracker, /data/whale-accumulation-report and /press.
// Downloads (Worker, same builders as the pages): /research/<asset>.csv. Embeds: /embed/<asset>.svg.

export const FEE_INDEX_PATH = "/data/exchange-fee-index";
export const TS_TRACKER_PATH = "/data/tokenized-stock-tracker";
export const WHALE_REPORT_PATH = "/data/whale-accumulation-report";
export const PRESS_PATH = "/press";

/** asset key -> page path. The key is also the CSV and SVG file name. */
export const DATA_ASSETS = Object.freeze({
  "exchange-fee-index": FEE_INDEX_PATH,
  "tokenized-stock-tracker": TS_TRACKER_PATH,
  "whale-accumulation-report": WHALE_REPORT_PATH,
});
export const DATA_ASSET_KEYS = Object.freeze(Object.keys(DATA_ASSETS));
export const DATA_ASSET_PAGE_PATHS = Object.freeze(Object.values(DATA_ASSETS));
export const DATA_ASSET_ROUTE_PATHS = Object.freeze([...DATA_ASSET_PAGE_PATHS, PRESS_PATH]);
// Written editions (indexable, in the sitemap with hreflang). Other UI locales render the English page noindex,follow.
export const DATA_ASSET_INDEX_LOCALES = Object.freeze(["en", "zh-Hans"]);

export const dataAssetCsvPath = (key) => `/research/${key}.csv`;
export const dataAssetSvgPath = (key) => `/embed/${key}.svg`;
export const dataAssetKeyForPath = (pathname) => DATA_ASSET_KEYS.find((key) => DATA_ASSETS[key] === pathname) || null;
export const isDataAssetRoute = (pathname) => DATA_ASSET_ROUTE_PATHS.includes(String(pathname || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/");

const CSV_ROUTE = new RegExp(`^/research/(${DATA_ASSET_KEYS.join("|")})\\.csv$`);
const SVG_ROUTE = new RegExp(`^/embed/(${DATA_ASSET_KEYS.join("|")})\\.svg$`);
/** { kind: "csv"|"svg", key } for a download/embed path, else null. */
export function parseDataAssetFilePath(pathname) {
  const csv = CSV_ROUTE.exec(String(pathname || ""));
  if (csv) return { kind: "csv", key: csv[1] };
  const svg = SVG_ROUTE.exec(String(pathname || ""));
  return svg ? { kind: "svg", key: svg[1] } : null;
}

// Footer / about link label.
const PRESS_LABELS = Object.freeze({
  en: "Press & data", "zh-Hans": "媒体与数据", "zh-Hant": "媒體與數據", es: "Prensa y datos", "pt-BR": "Imprensa e dados",
  fr: "Presse et données", de: "Presse & Daten", it: "Stampa e dati", ja: "プレス・データ", ko: "보도자료·데이터",
  ru: "Пресса и данные", tr: "Basın ve veri", id: "Pers & data", vi: "Báo chí & dữ liệu", ar: "الصحافة والبيانات",
  ur: "پریس اور ڈیٹا", uk: "Преса й дані",
});
export function pressNavLabel(locale = "en") {
  return PRESS_LABELS[locale] || (String(locale).startsWith("zh") ? PRESS_LABELS["zh-Hans"] : PRESS_LABELS.en);
}
