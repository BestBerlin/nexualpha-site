// Shared fixture for alert-sender tests: one market snapshot, partners, articles, campaigns and listing items.
// zh-en-baseline.json was rendered from this fixture with the zh/en-only sender (origin/main 9570ad4) before the
// other six languages were added; the i18n test asserts the current sender still renders zh and en byte-identically.
export const mk = {
  liquidations: {
    h1: { longUsd: 120e6, shortUsd: 30e6, largest: { symbol: "BTCUSDT", side: "long", usd: 5e6 } },
    h24: { longUsd: 900e6, shortUsd: 400e6 },
  },
  market: {
    majors: [
      { symbol: "BTCUSDT", price: 100000, change1hPct: -2.1, change24hPct: -4.5 },
      { symbol: "ETHUSDT", price: 3000, change1hPct: -3, change24hPct: -6 },
      { symbol: "SOLUSDT", price: 150.5, change1hPct: 1.2, change24hPct: 2.5 },
    ],
    movers: [{ symbol: "DOGEUSDT", change24hPct: 12.3 }, { symbol: "XRPUSDT", change24hPct: -8.7 }],
  },
};
export const partners = [
  { slug: "okx", name: "OKX", featured: true },
  { slug: "bitget", name: "Bitget", featured: true },
  { slug: "htx", name: "HTX", featured: false },
];
export const articles = [
  { slug: "btc-liquidations-weekly", title: { en: "BTC liquidations weekly", "zh-Hans": "BTC 爆仓周报", ru: "Ликвидации BTC за неделю", tr: "Haftalık BTC likidasyonları" }, availableLocales: ["en", "zh-Hans", "ru", "tr"], publishedAt: "2026-10-11T08:00:00Z" },
  { slug: "funding-rates-explained", title: { en: "Funding rates explained", "zh-Hans": "资金费率详解" }, availableLocales: ["en", "zh-Hans"], publishedAt: "2026-10-11T06:00:00Z" },
];
export const campaigns = [
  { venue: "okx", title: "OKX trading campaign: share 100,000 USDT", url: "https://www.okx.com/help/campaign-1", category: "event", publishedAt: "2026-10-11T07:00:00Z" },
];
export const listingItem = { category: "listing", title: "OKX lists ABC (ABC/USDT) for spot trading", url: "https://www.okx.com/help/abc", venue: "okx" };
export const campaignItem = { category: "event", title: "Bitget launchpool: stake BGB & earn XYZ", url: "https://www.bitget.com/support/xyz", venue: "bitget" };
