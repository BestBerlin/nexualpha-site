import React from "react";
import { publicCtaForVenue } from "../../../data/source-bound-cta.js";
import { isPartnerPromotableIn } from "../../../data/partner-geo-policy.js";
import { partnerBenefitStatus } from "../../../data/partner-benefit-status.js";
import { CommissionDisclosureLine } from "../CommissionDisclosureLine.jsx";
import { campaignJoinCopy } from "./campaign-join-copy.js";
import "./campaign-join.css";

const isNeutralLocale = (locale) => /^(ru|ar|ur|uk)(-|$)|^zh-(Hant|TW|HK)(-|$)/i.test(locale);
export function CampaignJoin({ venue, locale = "en", market, officialUrl, placement = "activities-live-campaign" }) {
  const t = campaignJoinCopy(locale);
  const cta = publicCtaForVenue(venue, locale, market);
  const allowed = cta.hasPartnerRoute && cta.inviteCode && isPartnerPromotableIn(venue, { locale, market });
  if (!allowed) return officialUrl ? <a className="campaign-join__official" href={officialUrl} target="_blank" rel="noopener noreferrer nofollow">{t.official} ↗</a> : null;
  const neutral = isNeutralLocale(locale);
  const share = neutral ? null : partnerBenefitStatus(venue)?.sharePct ?? null;
  return <aside className="campaign-join" data-campaign-join={venue}>
    <p>{t.body(cta.name, neutral ? null : cta.inviteCode, share)}</p>
    <a href={cta.registrationUrl} target="_blank" rel="sponsored noopener noreferrer" data-cta-kind="registration" data-cta-platform={venue} data-cta-placement={placement} data-cta-code={neutral ? undefined : cta.inviteCode}>{t.button(cta.name)}</a>
    <small>{t.fine(cta.name)}</small>
    <CommissionDisclosureLine locale={locale} placement={placement} />
  </aside>;
}
