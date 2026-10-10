// One sentence for an exchange's owner-declared rebate terms (top share + payout cadence), from the same data the home
// sign-up desk uses (home-rebate-tiers.js) and the same localized words (home7-copy). Returns null for venues without a
// declared share, so their pages keep the "verify in your account" wording.
import { HOME_REBATE_SHARE, HOME_AUTO_SETTLE, HOME_SETTLE } from "./home-rebate-tiers.js";
import { h7Copy } from "../components/v7/home7-copy.js";

export function ownerRebateLine(slug, locale = "en", name = slug) {
  const share = HOME_REBATE_SHARE[slug];
  if (!share) return null;
  const t = h7Copy(locale);
  const parts = [`${t.lgShare(name)} ${Math.round(share * 100)}%`];
  if (HOME_AUTO_SETTLE.includes(slug)) parts.push(t.lgAuto);
  if (HOME_SETTLE[slug]) parts.push(HOME_SETTLE[slug] === "hourly" ? t.settleH : t.settleD);
  return parts.join(" · ");
}
