// One record per partner venue for the user-facing rebate status (audit NX-02, 2026-10-11). The home, the venue page
// (registration card), the factbook, article partner blocks and /rates all read the rebate share, its basis and what
// still needs account-level confirmation from here, so no page says "confirmed" while another says "pending".
//
// No new numbers: the share, auto-settlement and payout cadence come from home-rebate-tiers.js (owner-confirmed
// 2026-10-10: OKX up to 40%, Bitget up to 60%, Binance up to 25%). Invite codes and links stay in partner-registry.js /
// source-bound-cta.js. A venue without a share keeps the "pending" state.
import { HOME_REBATE_SHARE, HOME_AUTO_SETTLE, HOME_SETTLE } from "./home-rebate-runtime.js";

/** Date the site owner confirmed the partner programme terms (shares + settlement) — the "benefit terms confirmed" date. */
export const PARTNER_TERMS_CONFIRMED_ON = "2026-10-10";

/** What the exchange still confirms per account after sign-up (the share is each programme's maximum). */
export const ACCOUNT_LEVEL_CHECKS = Object.freeze(["product-scope", "region", "account-tier", "promotion-stacking"]);

const key = (slug) => (typeof slug === "string" ? slug.trim().toLowerCase() : "");

/**
 * null when the venue has no confirmed partner share (callers keep "pending"); otherwise
 * { slug, share (0–1), sharePct, basis, confirmedOn, autoSettle, settle: "hourly"|"daily"|null, accountChecks }.
 */
export function partnerBenefitStatus(slug) {
  const s = key(slug);
  const share = HOME_REBATE_SHARE[s];
  if (!(typeof share === "number" && share > 0)) return null;
  return Object.freeze({
    slug: s,
    share,
    sharePct: Math.round(share * 100),
    basis: "partner-terms-confirmed-by-site-owner",
    confirmedOn: PARTNER_TERMS_CONFIRMED_ON,
    autoSettle: HOME_AUTO_SETTLE.includes(s),
    settle: HOME_SETTLE[s] || null,
    accountChecks: ACCOUNT_LEVEL_CHECKS,
  });
}

/** Rebate share (0–1) or null; the single read used by calculators (home, /rates). */
export const partnerRebateShare = (slug) => partnerBenefitStatus(slug)?.share ?? null;

