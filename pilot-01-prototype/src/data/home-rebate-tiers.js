// Home v7 only. Rebate shares the owner stated for each venue's partner program (2026-10-09). Share of the fees the user
// already paid, returned to the user. null = not confirmed yet: shown as "pending" and never counted.
// Not a source of invite codes or links (those stay in partner-registry.js, untouched).
export const HOME_REBATE_MAX_PCT = 50; // owner: some partner programs allow up to 50%; per-venue shares differ and are disclosed per row
export const HOME_REBATE_SHARE = Object.freeze({ okx: 0.2, binance: 0.2, bitget: 0.3, bybit: null });
export const HOME_VENUES = Object.freeze(["okx", "binance", "bitget", "bybit"]);
// Every partner with a real invite code in partner-registry.js, in home display order. kucoin/deribit/gmx are left out
// while their codes are placeholders (NEXU_KUCOIN, NEXU_DERIBIT, NEXU_GMX). Codes and links still come only from publicCtaForVenue.
export const HOME_PARTNERS = Object.freeze(["okx", "bitget", "binance", "bybit", "gate-io", "mexc", "htx", "kraken", "backpack", "hyperliquid"]);
// Owner (2026-10-09): OKX and Bitget are the primary push; the home sign-up desk shows them first, OKX selected.
export const HOME_PUSH = Object.freeze(["okx", "bitget", "binance"]);
// Owner (2026-10-09): rebates on these partner programs are settled by the exchange itself ("官方自动结算"); a few
// exchanges are not, so the badge is shown only for venues listed here. Edit this list when the owner confirms more.
export const HOME_AUTO_SETTLE = Object.freeze(["okx", "bitget", "binance"]);
