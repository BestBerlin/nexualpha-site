// One sentence for an exchange's owner-declared rebate terms (top share + payout cadence), from the single partner
// benefit record (partner-benefit-status.js, built on home-rebate-tiers.js) and the same localized words (home7-copy).
// Returns null for venues without a declared share, so their pages keep the "verify in your account" wording.
import { partnerBenefitStatus, partnerBenefitCopy } from "./partner-benefit-status.js";
import { h7Copy } from "../components/v7/home7-copy.js";
import { formatPercent } from "./format-percent.js";
import { isTurkeyGated } from "./partner-geo-policy.js";

export function ownerRebateLine(slug, locale = "en", name = slug) {
  // Türkiye: no rebate share for a partner that may not be promoted there (owner 2026-10-13, legal).
  const status = isTurkeyGated(slug, { locale }) ? null : partnerBenefitStatus(slug);
  if (!status) return null;
  const t = h7Copy(locale);
  const parts = [`${t.lgShare(name)} ${formatPercent(locale, status.sharePct)}`];
  if (status.autoSettle) parts.push(t.lgAuto);
  if (status.settle) parts.push(status.settle === "hourly" ? t.settleH : t.settleD);
  return parts.join(" · ");
}

// Factbook / evidence wording (NX-02): "Partner rebate share: up to 40% — partner terms confirmed 2026-10-10; your
// account's eligibility is confirmed by the exchange after sign-up". Null without a partner record ("pending" stays).
export function partnerBenefitParts(slug, locale = "en") {
  // Türkiye: no rebate share for a partner that may not be promoted there (owner 2026-10-13, legal).
  const status = isTurkeyGated(slug, { locale }) ? null : partnerBenefitStatus(slug);
  if (!status) return null;
  const t = h7Copy(locale);
  const c = partnerBenefitCopy(locale);
  const value = `${t.upTo} ${formatPercent(locale, status.sharePct)}`;
  const settle = [status.autoSettle ? t.lgAuto : null, status.settle ? (status.settle === "hourly" ? t.settleH : t.settleD) : null].filter(Boolean).join(" · ");
  return {
    label: c.label,
    value,
    confirmed: c.confirmed.replace("{date}", status.confirmedOn),
    account: c.account,
    checks: c.checks,
    settle,
    confirmedOn: status.confirmedOn,
    line: `${c.label}: ${value} — ${c.confirmed.replace("{date}", status.confirmedOn)}; ${c.account}`,
  };
}
