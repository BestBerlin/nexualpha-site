// 交易所中英文展示名称与 SEO 优化工具函数

const CHINESE_ALIAS_MAP = {
  binance: "币安",
  okx: "欧易",
  mexc: "抹茶",
  gate: "芝麻开门",
  "gate-io": "芝麻开门",
  kucoin: "库币",
  htx: "火币",
  huobi: "火币",
  kraken: "海妖",
};

const TRADITIONAL_CHINESE_ALIAS_MAP = {
  binance: "幣安",
  okx: "歐易",
  mexc: "抹茶",
  gate: "芝麻開門",
  "gate-io": "芝麻開門",
  kucoin: "庫幣",
  htx: "火幣",
  huobi: "火幣",
  kraken: "海妖",
};

/**
 * 获取符合当前语言环境与 SEO 优化的平台展示名称
 * @param {string|object} venueOrSlug 交易所实体对象或 slug 标识
 * @param {string} locale 当前语种代码 (如 zh-Hans, zh-Hant, en)
 * @returns {string} 格式化后的名称，中文环境下带括号别名（如 OKX (欧易)、Binance (币安)）
 */
export function getLocalizedVenueName(venueOrSlug, locale = "en") {
  if (!venueOrSlug) return "";
  const slug = typeof venueOrSlug === "string" ? venueOrSlug.toLowerCase() : (venueOrSlug.slug || "").toLowerCase();
  const rawName = typeof venueOrSlug === "string" ? venueOrSlug : (venueOrSlug.name || venueOrSlug.slug || "");

  const isZh = locale && (locale.startsWith("zh") || locale === "zh-Hans" || locale === "zh-Hant" || locale === "zh-CN" || locale === "zh-TW");
  if (!isZh) return rawName;

  const aliasMap = locale === "zh-Hant" || locale === "zh-TW" ? TRADITIONAL_CHINESE_ALIAS_MAP : CHINESE_ALIAS_MAP;
  const alias = aliasMap[slug];
  if (alias && !rawName.includes(alias)) {
    return `${rawName} (${alias})`;
  }
  return rawName;
}
