import { partnerPromotionGate } from "./partner-geo-policy.js";
import { partnerRegistry } from "./partner-registry.js";
// Home v7 only. Rebate shares the owner stated for each venue's partner program (2026-10-09). Share of the fees the user
// already paid, returned to the user. null = not confirmed yet: shown as "pending" and never counted.
// Not a source of invite codes or links (those stay in partner-registry.js, untouched).
export const HOME_REBATE_MAX_PCT = 60; // owner 2026-10-10: Bitget up to 60% is the top partner tier; per-venue shares differ and are disclosed per row
// Owner 2026-10-10: these are each program's MAXIMUM shares (OKX up to 40%, Binance up to 25%, Bitget up to 60%); the
// home shows them as "up to" and estimates with them.
export const HOME_REBATE_SHARE = Object.freeze({ okx: 0.4, binance: 0.25, bitget: 0.6, bybit: null });
export const HOME_VENUES = Object.freeze(["okx", "binance", "bitget", "bybit"]);
// Display order for registry-derived partner routes. The set and count still come from partnerRegistry: venues with
// placeholder invite codes or missing HTTPS registration routes fail closed before they can appear on the home page.
const HOME_PARTNER_ORDER = Object.freeze(["okx", "bitget", "binance", "bybit", "gate-io", "mexc", "htx", "kraken", "backpack", "hyperliquid", "coinw"]);
const PLACEHOLDER_INVITE_CODE = /^NEXU_[A-Z0-9]+$/;
const registryPartnerSlugs = Object.freeze(Object.entries(partnerRegistry)
  .filter(([, partner]) => partner?.hasReferral && /^https:\/\//i.test(partner.registrationUrl || "") && partner.inviteCode && !PLACEHOLDER_INVITE_CODE.test(String(partner.inviteCode)))
  .map(([slug]) => slug));
export const HOME_PARTNERS = Object.freeze([
  ...HOME_PARTNER_ORDER.filter((slug) => registryPartnerSlugs.includes(slug)),
  ...registryPartnerSlugs.filter((slug) => !HOME_PARTNER_ORDER.includes(slug)),
]);
// Owner (2026-10-09): OKX and Bitget are the primary push; the home sign-up desk shows them first, OKX selected.
export const HOME_PUSH = Object.freeze(["okx", "bitget", "binance"]);
// Owner (2026-10-09): rebates on these partner programs are settled by the exchange itself ("官方自动结算"); a few
// exchanges are not, so the badge is shown only for venues listed here. Edit this list when the owner confirms more.
export const HOME_AUTO_SETTLE = Object.freeze(["okx", "bitget", "binance"]);
// Owner 2026-10-10: how often each exchange pays the rebate out automatically.
export const HOME_SETTLE = Object.freeze({ okx: "hourly", binance: "hourly", bitget: "daily" });

// Owner 2026-10-13 (legal): a partner that may not be promoted in the visitor's market (Türkiye: only
// TURKEY_PROMOTED_PARTNERS; Bitget is on the SPK list) is left out of the home desk, calculator and strip entirely —
// no card, no "sign up" button, no eligibility link. Other markets keep the full list (their gated CTAs already fall
// back to the eligibility page).
const turkeyGated = (slug, locale, market) => partnerPromotionGate(slug, { locale, market })?.country === "TR";
export const homePartnersFor = (locale, market) => HOME_PARTNERS.filter((slug) => !turkeyGated(slug, locale, market));
export const homePushFor = (locale, market) => HOME_PUSH.filter((slug) => !turkeyGated(slug, locale, market));
/** Headline "up to X%": the top share among the partners this market's home actually shows. */
export function homeRebateMaxPctFor(locale, market) {
  const shares = homePartnersFor(locale, market).map((slug) => HOME_REBATE_SHARE[slug] ?? 0);
  return shares.length ? Math.round(Math.max(...shares) * 100) : HOME_REBATE_MAX_PCT;
}
