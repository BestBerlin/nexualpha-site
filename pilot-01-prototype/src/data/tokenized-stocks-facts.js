// Tokenized US stocks (代币化美股, owner 2026-10-15): which exchanges list stock tokens, stock perpetuals and pre-IPO
// perpetuals. Every value below is copied from the research packet vendored at research/tokenized-stocks/exchanges.json
// (as of 2026-10-15; tests/tokenized-stocks.test.mjs checks sources, dates and tickers against it) and carries the ids of the official pages it comes from (TS_SOURCES: URL, title,
// publication date or, when the page shows none, the date it was read). Unknown values are absent, never guessed:
// a lane, count, fee or leverage that the packet leaves null is simply not in this file, and the page shows nothing.
// Count, leverage and fee values that the packet dates to a launch or a guide keep that date in `asOf`.
// Shared by the hub, the ticker pages, the home strip and the exchange profiles (route chunks only, never the entry).

import { TS_TICKERS_ALL } from "./tokenized-stocks-routes.js";

export const TS_CHECKED = "2026-10-15";
export const TS_PUBLISHED = "2026-10-15";

/** Official sources: id -> [url, title, date, dateKind] ("published" when the page carries a date, else "checked"). */
const S = {
  "bitget-rtoken-page": ["https://www.bitget.com/campaigns/bitget-rtoken", "Bitget rToken", "2026-10-14", "checked"],
  "bitget-rtoken-faq": ["https://www.bitget.com/asia/academy/bitget-rtoken-faq", "Bitget rToken FAQ", "2026-08-26", "published"],
  "bitget-24-7": ["https://www.bitget.com/support/articles/12560603849504", "Bitget to upgrade stock futures to 24/7 trading mode", "2026-01-30", "published"],
  "bitget-perps-faq": ["https://www.bitget.com/support/articles/12560603847596", "Bitget Stock Perps FAQ", "2026-01-09", "published"],
  "bitget-fees-guide": ["https://www.bitget.com/support/articles/12560603887612", "How to Trade Tokenized Stocks and Stock Perps With USDT on Bitget UEX", "2026-06-29", "published"],
  "bitget-jio": ["https://www.bitget.com/support/articles/12560603897601", "Bitget lists JIO (Jio Platforms) Pre-IPO perpetual futures", "2026-10-14", "published"],
  "bitget-alliance": ["https://www.bitget.com/support/articles/12560603896118", "Bitget Alliance Program", "2026-09-28", "published"],
  "bitget-dividends": ["https://www.bitget.com/support/articles/12560603884677", "RWA stock perps: Cash dividend settlement mechanism", "2026-06-05", "published"],
  "okx-unified": ["https://www.okx.com/help/unified-tokenized-stocks", "OKX Unified Tokenized Stocks", "2026-07-15", "published"],
  "okx-launch": ["https://www.okx.com/learn/unified-tokenized-stocks", "OKX launches Unified Tokenized Stocks", "2026-07-15", "published"],
  "okx-stock-perps": ["https://www.okx.com/help/stock-perpetuals", "OKX Stock Perpetuals", "2026-02-24", "published"],
  "okx-perps-faq": ["https://www.okx.com/en-gb/help/stock-perpetuals-faq", "OKX Stock Perpetuals FAQ", "2026-04-01", "published"],
  "okx-preipo-listing": ["https://www.okx.com/en-us/help/okx-to-list-pre-ipo-openaiusd-and-anthropicusd-x-perps", "OKX to list Pre-IPO OPENAIUSD and ANTHROPICUSD X-Perps", "2026-09-10", "published"],
  "okx-oura": ["https://www.okx.com/help/okx-to-list-pre-ipo-ourausd-x-perps", "OKX to list Pre-IPO OURAUSD X-Perps", "2026-10-07", "published"],
  "okx-preipo": ["https://www.okx.com/ua/help/what-are-pre-ipo-x-perps-and-how-do-they-work", "What are pre-IPO X-Perps and how do they work", "2026-09-08", "published"],
  "okx-campaign": ["https://www.okx.com/ru/campaigns/xstocks-equity-trading", "OKX xStocks equity trading", "2026-10-14", "checked"],
  "okx-latest-spot": ["https://www.okx.com/help/okx-to-list-unified-tokenized-stocks-xlunr-xoscr-and-more-for-spot-trading", "OKX to list Unified Tokenized Stocks xLUNR, xOSCR and more", "2026-10-12", "published"],
  "binance-bstocks-faq": ["https://www.binance.com/en/support/faq/detail/f0c03cd6509a4085b4cce1636f16be38", "Binance bStocks FAQ", "2026-06-11", "published"],
  "binance-bstocks-conversion": ["https://www.binance.com/en/support/announcement/detail/c16868c76a264a0690d18ac26f637b0c", "Binance bStocks token conversion", "2026-08-13", "published"],
  "binance-stock-perps": ["https://www.binance.com/en/academy/articles/how-to-trade-stock-perpetual-contracts-on-binance", "How to trade stock perpetual contracts on Binance", "2026-04-23", "published"],
  "binance-etf-perps": ["https://www.binance.com/en/academy/articles/etf-contracts-you-can-trade-on-binance-futures", "ETF contracts you can trade on Binance Futures", "2026-04-21", "published"],
  "binance-latest-perps": ["https://www.binance.com/ja/square/post/376400136183151", "Binance Futures new TradFi perpetuals", "2026-10-12", "published"],
  "binance-anthropic": ["https://www.binance.com/en-IN/support/announcement/detail/2b9ff1e1acf8433793bc40c59a0cb852", "Binance Futures ANTHROPICUSDT pre-IPO perpetual", "2026-06-02", "published"],
  "binance-bstocks-fees": ["https://www.binance.com/en-IN/blog/markets/8716450413672266850", "Binance bStocks fees", "2026-07-02", "published"],
  "binance-wallet-campaign": ["https://www.binance.com/en/square/post/10-13-2026-binance-wallet-to-launch-bstocks-tokenized-securities-trading-competition-with-50-000-usdc-in-rewards-376773005998340", "Binance Wallet bStocks trading competition, 50,000 USDC", "2026-10-13", "published"],
  "bybit-xstocks": ["https://www.bybit.com/en/help-center/article/FAQ-xStocks-on-Bybit", "FAQ — xStocks on Bybit", "2026-07-30", "published"],
  "bybit-perps-guide": ["https://www.bybit.com/en/learn/bybit-tradfi/bybit-tradfi-perpetuals", "Bybit TradFi perpetuals", "2026-08-06", "published"],
  "bybit-preipo": ["https://announcements.bybit.com/en/article/new-listing-openaiusdt-and-anthropicusdt-pre-ipo-perpetual-contracts-with-up-to-20x-leverage--art657b4039477f/", "New listing: OPENAIUSDT and ANTHROPICUSDT pre-IPO perpetual contracts", "2026-07-13", "published"],
  "bybit-comparison": ["https://www.bybit.com/en/learn/bybit-tradfi/xstocks-cfds-perpetuals-bybit", "xStocks, CFDs and perpetuals on Bybit", "2026-08-06", "published"],
  "bybit-restricted": ["https://www.bybit.com/en/help-center/article/Service-Restricted-Countries", "Bybit Service Restricted Countries", "2026-10-13", "published"],
  "bybit-stock-buzz-tsla": ["https://announcements.bybit.com/en-US/article/stock-buzz-trade-tesla-compete-for-a-share-of-100-000-usdt--art39f8ac7bc7f4/", "Stock Buzz: Trade Tesla. Compete For a Share of 100,000 USDT.", "2026-10-16", "published"],
  "bybit-stock-buzz-mu": ["https://announcements.bybit.com/en-US/article/stock-buzz-trade-micron-compete-for-a-share-of-100-000-usdt--art12b57db35368/", "Stock Buzz: Trade Micron. Compete For a Share of 100,000 USDT.", "2026-09-30", "published"],
  "bybit-full-stocks-ahead": ["https://announcements.bybit.com/en-US/article/exclusive-launch-full-stocks-ahead-share-150-000-usdc--art6a5cd5beed87/", "[Exclusive Launch] Full Stocks Ahead: Share 150,000 USDC", "2026-10-14", "published"],
  "bybit-activities-api": ["https://api.bybit.com/v5/announcements/index?locale=en-US&type=latest_activities", "Bybit announcements API: activity start and end times", "2026-10-18", "checked"],
  "kraken-faq": ["https://support.kraken.com/articles/xstocks-faq", "Kraken xStocks FAQ", "2026-09-18", "published"],
  "kraken-perps": ["https://support.kraken.com/articles/xstocks-perps-kraken", "xStocks perps on Kraken", "2026-02-24", "published"],
  "kraken-product": ["https://www.kraken.com/pro/perps/xstocks-perpetuals", "Kraken xStocks perpetuals", "2026-10-14", "checked"],
  "kraken-availability": ["https://support.kraken.com/articles/xstocks-availability", "Kraken xStocks availability", "2026-06-18", "published"],
  "gate-launch": ["https://www.gate.com/announcements/article/45926", "Gate lists xStocks spot and perpetuals", "2025-07-03", "published"],
  "gate-app-guide": ["https://www.gate.com/help/trade/stocks/49421/how-to-buy-tokenized-stocks-on-gate-app", "How to buy tokenized stocks on Gate App", "2026-01-22", "published"],
  "gate-stock-perps": ["https://www.gate.com/pt-br/announcements/article/51518", "Gate stocks and ETF USDT-M perpetuals", "2026-06-04", "published"],
  "gate-preipo-perps": ["https://www.gate.com/ja/blog/gate-pre-ipos-updates-how-retail-users-can-participate", "Gate Pre-IPOs updates", "2026-04-14", "published"],
  "gate-faq": ["https://www.gate.com/help/trade/stocks/48921", "Gate tokenized stocks FAQ", "2025-12-26", "published"],
  "gate-agreement": ["https://www.gate.com/legal/user-agreement", "Gate user agreement", "2026-10-14", "checked"],
  "mexc-initial-spot": ["https://www.mexc.com/en-GB/announcements/article/mexc-to-launch-ondo-s-tokenized-stock-trading-pairs-on-spot-markets-2025-09-03-17827791529298", "MEXC launches Ondo tokenized stock spot pairs", "2025-09-03", "published"],
  "mexc-future-list": ["https://www.mexc.com/announcements/article/mexc-to-list-aph-stm-on-and-ms-stock-futures-with-0-fee-trading-on-jul-16-17827791536896", "MEXC lists APH, STM, ON and MS stock futures", "2026-07-16", "published"],
  "mexc-spot-five": ["https://blog.mexc.com/press-release/mexc-adds-five-ondo-tokenized-stocks/", "MEXC adds five Ondo tokenized stocks", "2026-07-17", "published"],
  "mexc-user-terms": ["https://www.mexc.com/terms", "MEXC user agreement", "2026-10-13", "published"],
  "htx-rwa": ["https://square.htx.com/htx-ventures-latest-report-rwa-perps-a-new-frontier-in-the-on-chain-expansion-of-global-financial-markets/", "HTX Ventures report: RWA perps", "2026-06-15", "published"],
  "htx-product": ["https://square.htx.com/popular-tradfi-assets-now-live-on-htx-en/", "Popular TradFi assets now live on HTX", "2026-05-28", "published"],
  "htx-research": ["https://square.htx.com/htx-research-latest-report-on-chain-u-s-equities-from-crypto-perpetuals-to-the-shift-in-pricing-power-2/", "HTX Research: on-chain US equities", "2026-05-28", "published"],
  "coinw-academy": ["https://www.coinw.com/academy/articles/TradFi-vs-Traditional-Brokers-So-What-the-Difference/483", "CoinW TradFi vs traditional brokers", "2026-09-16", "published"],
  "coinw-launch": ["https://www.coinw.com/help-center/announcement-center/new-listings/latest-listings/2026-04-29/tradfi-perpetual-futures/7698", "CoinW lists TradFi perpetual futures", "2026-04-29", "published"],
  "coinw-us-termination": ["https://www.coinw.com/en_XA/help-center/announcement-center/more/2026-05-08/notice-on-orderly-termination-of-coinw-services-in-the-us/7725", "CoinW: orderly termination of services in the US", "2026-05-08", "published"],
  "backpack-markets": ["https://backpack.exchange/markets", "Backpack markets", "2026-10-14", "checked"],
  "backpack-perps": ["https://learn.backpack.exchange/blog/backpack-lists-nvda-spcx-aapl-perp", "Backpack lists NVDA, SPCX and AAPL perps", "2026-09-03", "published"],
  "backpack-token": ["https://learn.backpack.exchange/blog/tokenized-spacex-spcx", "Tokenized SpaceX (SPCX) on Backpack", "2026-06-13", "published"],
  "hl-xyz-meta": ["https://api.hyperliquid.xyz/info", "Hyperliquid info API (xyz markets)", "2026-10-14", "checked"],
  "hl-xyz-fees": ["https://docs.trade.xyz/perpetuals/mechanics/fees", "trade[XYZ] fees", "2026-10-14", "checked"],
  "hl-preipo": ["https://docs.trade.xyz/perpetuals/markets/pre-ipo-perpetuals", "trade[XYZ] pre-IPO perpetuals", "2026-10-14", "checked"],
  "hl-preipo-index": ["https://docs.trade.xyz/perpetuals/specifications-and-schedules/pre-ipo-specification-index", "trade[XYZ] pre-IPO specification index", "2026-10-14", "checked"],
  "hl-terms": ["https://trade.xyz/terms", "trade[XYZ] terms", "2026-09-06", "published"],
};

// Sources added after the 2026-10-15 research packet (campaigns read from the exchanges' own announcements on 2026-10-18).
export const TS_LATER_SOURCE_IDS = Object.freeze(new Set(["bybit-stock-buzz-tsla", "bybit-stock-buzz-mu", "bybit-full-stocks-ahead", "bybit-activities-api"]));

export const TS_SOURCES = Object.freeze(Object.fromEntries(Object.entries(S).map(([id, [url, title, date, dateKind]]) => [id, Object.freeze({ id, url, title, date, dateKind })])));

/**
 * Lanes: spot (stock tokens), perp (stock / ETF perpetuals), preipo (pre-IPO perpetuals).
 * Every fact is { v, s: [sourceIds], asOf? }. `tickers` lists the underlying symbols the source names, `sym` is how the
 * exchange writes them ("{t}" = the US ticker), `form` names the token family.
 */
const f = (v, s, asOf) => Object.freeze(asOf ? { v, s, asOf } : { v, s });

const EXCHANGES = [
  {
    slug: "bitget", name: "Bitget",
    spot: { form: f("rToken", ["bitget-rtoken-page"]), sym: "r{t}", settle: f("USDT", ["bitget-rtoken-page"]),
      tickers: f(["NVDA", "AAPL", "TSLA", "MSFT", "MSTR", "COIN", "SPY", "QQQ"], ["bitget-rtoken-faq"]),
      count: f("1,700+", ["bitget-rtoken-faq"], "2026-08"), hours: f("24/5+", ["bitget-rtoken-faq"]),
      lev: f(10, ["bitget-rtoken-faq"]), path: f("Trading > Stocks > rAAPL", ["bitget-fees-guide"]),
      dividends: f("cash", ["bitget-rtoken-faq"]) },
    perp: { form: f("USDT-M", ["bitget-perps-faq"]), sym: "{t}USDT", settle: f("USDT", ["bitget-perps-faq"]),
      tickers: f(["TSLA", "NVDA", "AAPL", "MSFT", "COIN", "MSTR", "HOOD", "CRCL", "QQQ"], ["bitget-24-7"]),
      hours: f("24/7", ["bitget-24-7"]), lev: f(100, ["bitget-perps-faq"]),
      fee: f({ maker: 0.02, taker: 0.06 }, ["bitget-fees-guide"]), dividends: f("adjust", ["bitget-dividends"]),
      path: f("TradFi > Stocks", ["bitget-perps-faq"]) },
    preipo: { tickers: f(["JIO"], ["bitget-jio"]), sym: "{t}USDT", hours: f("24/7", ["bitget-jio"]), lev: f(20, ["bitget-jio"]), settle: f("USDT", ["bitget-jio"]) },
    excluded: f(["US"], ["bitget-rtoken-faq"]),
    promo: { key: "bitgetAlliance", endAt: "2026-10-26T08:00:00Z", s: ["bitget-alliance"], href: "/activities/bitget-alliance" },
  },
  {
    slug: "okx", name: "OKX",
    spot: { form: f("xStocks", ["okx-unified"]), sym: "x{t}", settle: f("USDT", ["okx-unified"]),
      tickers: f(["NVDA", "TSLA", "AAPL", "MSFT", "MSTR", "COIN", "SPY", "QQQ", "HOOD", "CRCL"], ["okx-campaign"]),
      count: f("40+", ["okx-launch"], "2026-07"), hours: f("24/7", ["okx-unified"]),
      path: f("Spot > xNVDA/USDT", ["okx-campaign"]), dividends: f("reinvest", ["okx-unified"]) },
    perp: { form: f("USDT-M", ["okx-stock-perps"]), sym: "{t}", settle: f("USDT", ["okx-stock-perps"]),
      tickers: f(["AAPL", "TSLA", "NVDA"], ["okx-stock-perps"]), hours: f("24/7", ["okx-stock-perps"]),
      path: f("Trade > Futures > TradFi", ["okx-perps-faq"]), dividends: f("none", ["okx-perps-faq"]) },
    preipo: { tickers: f(["OPENAI", "ANTHROPIC", "OURA"], ["okx-preipo-listing", "okx-oura"]), sym: "{t}USD", hours: f("24/7", ["okx-preipo-listing", "okx-oura"]), dividends: f("none", ["okx-preipo"]) },
    excluded: f(["US"], ["okx-latest-spot"]),
  },
  {
    slug: "binance", name: "Binance",
    spot: { form: f("bStocks", ["binance-bstocks-faq"]), sym: "{t}B", tickers: f(["TSLA"], ["binance-bstocks-faq"]),
      hours: f("24/7", ["binance-bstocks-conversion"]), fee: f({ flatUsd: 0.35, pct: 0.1 }, ["binance-bstocks-fees"], "2026-07"),
      path: f("Spot", ["binance-bstocks-faq"]), dividends: f("reinvest", ["binance-bstocks-faq"]) },
    perp: { form: f("USDT-M", ["binance-stock-perps"]), sym: "{t}USDT", settle: f("USDT", ["binance-stock-perps"]),
      tickers: f(["MSTR", "AMZN", "CRCL", "COIN", "PLTR", "QQQ", "SPY"], ["binance-stock-perps", "binance-etf-perps"]),
      hours: f("24/7", ["binance-stock-perps"]), lev: f(20, ["binance-latest-perps"], "2026-10"),
      path: f("Futures > TradFi", ["binance-stock-perps"]) },
    preipo: { tickers: f(["ANTHROPIC"], ["binance-anthropic"]), sym: "{t}USDT", hours: f("24/7", ["binance-anthropic"]), lev: f(20, ["binance-anthropic"], "2026-06"), settle: f("USDT", ["binance-anthropic"]) },
    excluded: f(["US"], ["binance-bstocks-faq"]),
    promo: { key: "binanceWalletBstocks", endAt: "2026-10-20T10:00:00Z", s: ["binance-wallet-campaign"] },
  },
  {
    slug: "bybit", name: "Bybit",
    spot: { form: f("xStocks", ["bybit-xstocks"]), sym: "{t}X", settle: f("USDT", ["bybit-comparison"]),
      tickers: f(["COIN", "NVDA", "AAPL"], ["bybit-xstocks"]), hours: f("24/7", ["bybit-xstocks"]),
      fee: f({ maker: 0.2, taker: 0.2 }, ["bybit-xstocks"]), path: f("Spot > xStocks", ["bybit-xstocks"]), dividends: f("reinvest", ["bybit-xstocks"]) },
    perp: { form: f("USDT-M", ["bybit-perps-guide"]), sym: "{t}USDT", settle: f("USDT", ["bybit-perps-guide"]),
      tickers: f(["SKHY", "SNDK", "MU", "SOXL", "KORU"], ["bybit-perps-guide"]), hours: f("24/7", ["bybit-perps-guide"]),
      path: f("TradFi > Futures", ["bybit-perps-guide"]), dividends: f("none", ["bybit-perps-guide"]) },
    preipo: { tickers: f(["OPENAI", "ANTHROPIC"], ["bybit-preipo"]), sym: "{t}USDT", hours: f("24/7", ["bybit-preipo"]), settle: f("USDT", ["bybit-preipo"]) },
    excluded: f(["US", "CN", "HK", "SG", "CA"], ["bybit-restricted"]),
  },
  {
    slug: "gate-io", name: "Gate",
    spot: { form: f("xStocks", ["gate-launch"]), sym: "{t}X", settle: f("USDT", ["gate-launch"]),
      tickers: f(["COIN", "NVDA", "CRCL", "AAPL", "META", "HOOD", "TSLA", "GOOGL"], ["gate-launch"]), hours: f("24/7", ["gate-app-guide"]),
      path: f("Spot > Stocks", ["gate-app-guide"]), dividends: f("nocash", ["gate-faq"]) },
    perp: { form: f("USDT-M", ["gate-stock-perps"]), sym: "{t}X", settle: f("USDT", ["gate-launch"]),
      tickers: f(["COIN", "NVDA", "CRCL", "AAPL", "META", "HOOD"], ["gate-launch"]), hours: f("24/7", ["gate-launch"]),
      lev: f(20, ["gate-stock-perps"], "2026-06") },
    preipo: { tickers: f(["OPENAI", "ANTHROPIC", "ANDURIL", "KALSHI", "POLYMARKET", "SPACEX"], ["gate-preipo-perps"]), lev: f(10, ["gate-preipo-perps"], "2026-04"), settle: f("USDT", ["gate-preipo-perps"]) },
    excluded: f(["US", "CN", "SG", "CA", "HK", "GB", "JP", "KR"], ["gate-agreement"]),
  },
  {
    slug: "mexc", name: "MEXC",
    spot: { form: f("Ondo", ["mexc-initial-spot"]), sym: "{t}ON", settle: f("USDT", ["mexc-initial-spot"]),
      tickers: f(["NVDA", "TSLA", "AAPL", "COIN", "HOOD", "CRCL"], ["mexc-initial-spot"]),
      path: f("Spot > NVDAON/USDT", ["mexc-initial-spot"]), dividends: f("reinvest", ["mexc-spot-five"]) },
    perp: { form: f("USDT-M", ["mexc-future-list"]), sym: "{t}USDT", settle: f("USDT", ["mexc-user-terms"]),
      tickers: f(["APH", "STM", "ON", "MS"], ["mexc-future-list"]), hours: f("24/7", ["mexc-future-list"]), lev: f(20, ["mexc-future-list"], "2026-07") },
    excluded: f(["US", "CN", "SG", "MY", "GB", "HK", "CA"], ["mexc-user-terms"]),
  },
  {
    slug: "htx", name: "HTX",
    perp: { form: f("USDT-M", ["htx-rwa"]), sym: "{t}", settle: f("USDT", ["htx-rwa"]),
      tickers: f(["NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "TSM", "AVGO", "INTC", "COIN", "MSTR", "CRCL", "PLTR", "QQQ", "SPY"], ["htx-rwa"]),
      hours: f("24/7", ["htx-product"]) },
    preipo: { tickers: f(["SPACEX", "OPENAI", "ANTHROPIC"], ["htx-research"], "2026-05") },
  },
  {
    slug: "kraken", name: "Kraken",
    spot: { form: f("xStocks", ["kraken-faq"]), sym: "{t}x", settle: f("USD/USDC/USDG", ["kraken-faq", "kraken-availability"]),
      tickers: f(["AAPL", "CRCL", "GOOGL", "HOOD", "MSTR", "NVDA", "QQQ", "SPY", "TSLA"], ["kraken-faq"]),
      count: f("131", ["kraken-faq"]), hours: f("24/5+", ["kraken-faq"]), lev: f(3, ["kraken-availability"]),
      fee: f({ zeroUsd: true }, ["kraken-faq"]), dividends: f("reinvest", ["kraken-faq"]) },
    perp: { form: f("xStocks perps", ["kraken-perps"]), sym: "{t}x",
      tickers: f(["AAPL", "CRCL", "GOOGL", "HOOD", "MSTR", "NVDA", "QQQ", "SPY", "TSLA"], ["kraken-perps"]),
      hours: f("24/7", ["kraken-perps"]), lev: f(20, ["kraken-perps", "kraken-product"]) },
    excluded: f(["US", "GB", "CA", "AU"], ["kraken-faq", "kraken-availability"]),
  },
  {
    slug: "backpack", name: "Backpack",
    spot: { form: f("Backpack Securities", ["backpack-token"]), sym: "{t}", tickers: f(["SPCX"], ["backpack-token"]), hours: f("24/7", ["backpack-token"]) },
    perp: { form: f("Perp", ["backpack-markets"]), sym: "{t}-PERP",
      tickers: f(["NVDA", "SNDK", "MU", "SPCX", "INTC", "CRCL", "AAPL", "QQQ", "TSLA", "GOOGL", "HOOD", "AMD", "SPY", "SKHY", "DRAM", "AMZN", "META"], ["backpack-markets"]),
      count: f("17", ["backpack-markets"]), hours: f("24/7", ["backpack-perps"]), lev: f(10, ["backpack-perps"]), settle: f("USD", ["backpack-perps"]) },
  },
  {
    slug: "hyperliquid", name: "Hyperliquid",
    perp: { form: f("trade[XYZ]", ["hl-xyz-meta"]), sym: "xyz:{t}", settle: f("USDC", ["hl-xyz-meta"]),
      tickers: f(["TSLA", "NVDA", "HOOD", "COIN", "AAPL", "MSFT", "MSTR", "CRCL"], ["hl-xyz-meta"]),
      lev: f(20, ["hl-xyz-meta"]), levBy: f({ TSLA: 20, NVDA: 20, HOOD: 10, COIN: 10, AAPL: 20, MSFT: 20, MSTR: 10, CRCL: 10 }, ["hl-xyz-meta"]),
      fee: f({ maker: 0.03, taker: 0.09 }, ["hl-xyz-fees"]) },
    preipo: { tickers: f(["OURA"], ["hl-preipo-index"]), sym: "xyz:{t}", hours: f("24/7", ["hl-preipo"]), lev: f(5, ["hl-preipo-index"]), settle: f("USDC", ["hl-xyz-meta"]) },
    excluded: f(["US", "CA", "GB"], ["hl-terms"]),
  },
  {
    slug: "coinw", name: "CoinW",
    perp: { form: f("USDT-M", ["coinw-academy"]), sym: "{t}USDT", settle: f("USDT", ["coinw-academy"]),
      tickers: f(["AAPL", "TSLA", "INTC", "MSTR", "NVDA"], ["coinw-launch"], "2026-04"), hours: f("24/7", ["coinw-academy"]), lev: f(10, ["coinw-launch"], "2026-04") },
    excluded: f(["US"], ["coinw-us-termination"]),
  },
];

const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(deepFreeze); }
  else if (value && typeof value === "object") Object.values(value).forEach(deepFreeze);
  return value;
};
export const TS_EXCHANGES = deepFreeze(EXCHANGES);
export const TS_LANES = Object.freeze(["spot", "perp", "preipo"]);

// The ticker pages: the twelve of the 2026-10-15 launch (the research packet's editorial backlog plus GOOGL and AMZN) and
// eighteen more from the 2026-10-18 live listing snapshot (tokenized-stocks-routes.js holds the list).
export const TS_TICKERS = TS_TICKERS_ALL;
export const TS_ETFS = Object.freeze(new Set(["SPY", "QQQ"]));
// Private companies: their pages describe pre-IPO perpetuals, not stocks (no shares, no dividends).
export const TS_PREIPO = Object.freeze(new Set(["OPENAI", "ANTHROPIC"]));

export const tsSource = (id) => TS_SOURCES[id] || null;
export const tsSymbol = (lane, ticker) => String(lane?.sym || "{t}").replace("{t}", ticker);

/** Lanes of an exchange that list `ticker` (the ticker page rows). */
export function tsListings(ticker) {
  const out = [];
  for (const ex of TS_EXCHANGES) {
    for (const lane of ["spot", "perp"]) {
      const data = ex[lane];
      if (!data?.tickers?.v.includes(ticker)) continue;
      out.push({ exchange: ex, lane, data, symbol: tsSymbol(data, ticker), lev: data.levBy?.v?.[ticker] ?? null, levSource: data.levBy?.s || null });
    }
  }
  return out;
}

export const tsExchange = (slug) => TS_EXCHANGES.find((ex) => ex.slug === slug) || null;

/** Lanes an exchange has: ["spot", "perp", "preipo"] subset in that order. */
export const tsLanesOf = (ex) => TS_LANES.filter((lane) => ex?.[lane]);

/** Every source id used anywhere in the dataset (tests: each must resolve). */
export function tsAllSourceIds() {
  const ids = new Set();
  const walk = (value) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value.s) && "v" in value) value.s.forEach((id) => ids.add(id));
    if (Array.isArray(value.s) && value.endAt) value.s.forEach((id) => ids.add(id));
    Object.values(value).forEach(walk);
  };
  walk(EXCHANGES);
  walk(TS_CAMPAIGNS);
  return [...ids];
}

// Stock-trading campaigns shown on the ticker and exchange pages (start/end from the exchange's own announcements API).
// `tickers: null` = the campaign covers every stock the exchange lists. `href` opens OUR page (activities, campaign guide),
// never the exchange directly; the sign-up next to it goes through /go with our code.
export const TS_CAMPAIGNS = Object.freeze([
  { venue: "bybit", key: "bybitStockBuzzTsla", tickers: ["TSLA"], endAt: "2026-10-29T08:00:00Z", s: ["bybit-stock-buzz-tsla", "bybit-activities-api"], href: "/activities" },
  { venue: "bybit", key: "bybitStockBuzzMu", tickers: ["MU"], endAt: "2026-10-31T00:00:00Z", s: ["bybit-stock-buzz-mu", "bybit-activities-api"], href: "/activities" },
  { venue: "bybit", key: "bybitFullStocksAhead", tickers: null, endAt: "2026-10-31T00:00:00Z", s: ["bybit-full-stocks-ahead", "bybit-activities-api"], href: "/activities/bybit-stocks" },
].map((c) => Object.freeze(c)));

/** Active promotion of an exchange at `now` (expired ones never show). */
export function tsPromo(ex, now = Date.now()) {
  const promo = ex?.promo;
  return promo && Date.parse(promo.endAt) > now ? promo : null;
}
