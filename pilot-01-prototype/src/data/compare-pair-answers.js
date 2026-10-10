// Comparison pairs added 2026-10-10 from the market keyword plan (most-wanted pairs without an indexable page:
// binance-vs-bitget 18 queries, bybit-vs-mexc 16, bitget-vs-okx 15, bitget-vs-mexc 15). Each pair carries all 15
// locales in the compareDirectAnswers shape, so the SSR, the Worker metadata, the JSON-LD and the visible page all
// read the same copy. Facts (fees, products, KYC) are rendered from venue-database.js and reviewed records; the
// narrative here only names which product each venue leads with and what to verify in the official account.
import { binanceVsBitget } from "./compare-pairs/binance-vs-bitget.js";
import { bitgetVsOkx } from "./compare-pairs/bitget-vs-okx.js";
import { bybitVsMexc } from "./compare-pairs/bybit-vs-mexc.js";
import { bitgetVsMexc } from "./compare-pairs/bitget-vs-mexc.js";
export { COMPARE_PAIR_LOCALES, COMPARE_PAIR_REVIEWED_AT } from "./compare-pairs/shared.js";

export const comparePairAnswers = Object.freeze({
  "binance-vs-bitget": binanceVsBitget,
  "bitget-vs-okx": bitgetVsOkx,
  "bybit-vs-mexc": bybitVsMexc,
  "bitget-vs-mexc": bitgetVsMexc,
});

export const comparePairAnswerSlugs = Object.freeze(Object.keys(comparePairAnswers));
