import { SignupEvidence } from "../../shared/SignupEvidence.jsx";
import React from "react";
import { publicCtaForVenue, venueGoHref } from "../../../data/source-bound-cta.js";
import { isPartnerPromotableIn } from "../../../data/partner-geo-policy.js";
import { campaignJoinCopy } from "./campaign-join-copy.js";
import { isNeutralCtaLocale } from "../../../data/locale-policy.js";
import { SourceLink } from "../../shared/SourceLink.jsx";
import { BackupSignupLink } from "../../shared/BackupSignupLink.jsx";
import "./campaign-join.css";

const isNeutralLocale = isNeutralCtaLocale;
export function CampaignJoin({ venue, locale = "en", market, officialUrl, placement = "activities-live-campaign" }) {
  const t = campaignJoinCopy(locale);
  const cta = publicCtaForVenue(venue, locale, market);
  const neutral = isNeutralLocale(locale);
  if (neutral) {
    const href = officialUrl || (cta.officialDomain ? `https://${cta.officialDomain}` : null);
    return href ? <SourceLink locale={locale} market={market} className="campaign-join__official" href={href} target="_blank" rel="noopener noreferrer nofollow">{t.official} ↗</SourceLink> : null;
  }
  const allowed = cta.hasPartnerRoute && cta.inviteCode && isPartnerPromotableIn(venue, { locale, market });
  if (!allowed) return officialUrl ? <SourceLink locale={locale} market={market} className="campaign-join__official" href={officialUrl} target="_blank" rel="noopener noreferrer nofollow">{t.official} ↗</SourceLink> : null;
  const registrationHref = venueGoHref(venue, placement, locale, market);
  if (!registrationHref) return officialUrl ? <SourceLink locale={locale} market={market} className="campaign-join__official" href={officialUrl} target="_blank" rel="noopener noreferrer nofollow">{t.official} ↗</SourceLink> : null;
  return <aside className="campaign-join" data-campaign-join={venue}>
    <span data-signup-cta={venue} className="signup-cta-block"><a href={registrationHref} target="_blank" rel="sponsored noopener noreferrer" data-cta-kind="registration" data-cta-platform={venue} data-cta-placement={placement} data-cta-code={neutral ? undefined : cta.inviteCode} data-growth-decision={venue} data-growth-placement={placement}>{t.button(cta.name)}</a><SignupEvidence slug={venue} locale={locale} market={market} /></span>
    <BackupSignupLink venue={venue} locale={locale} market={market} placement={placement} />
  </aside>;
}
