// Home v7 only. Rebate shares the owner stated for each venue's partner program (2026-10-09). Share of the fees the user
// already paid, returned to the user. null = not confirmed yet: shown as "pending" and never counted.
// Not a source of invite codes or links (those stay in partner-registry.js, untouched).
export const HOME_REBATE_MAX_PCT = 50; // owner: some partner programs allow up to 50%; per-venue shares differ and are disclosed per row
export const HOME_REBATE_SHARE = Object.freeze({ okx: 0.2, binance: 0.2, bitget: 0.3, bybit: null });
export const HOME_VENUES = Object.freeze(["okx", "binance", "bitget", "bybit"]);
