// Venue money-page hero figure (inner-page pass 2026-10-23): the partner rebate share set large above the registration
// card, the way the home hero sets "50%". Text only, no link of its own: the card under it keeps the one sign-up button,
// so the page still has a single primary action. Figures come from owner-rebate-line.js (partner terms with their
// confirmation date) and the invite code from the source-bound CTA; nothing here is typed by hand.
import { partnerBenefitParts } from "../../data/owner-rebate-line.js";
import { inner9Copy, signupUrlCarriesCode, splitShareFigure } from "./inner9-copy.js";

export function VenueRebateHero({ slug, locale, name, inviteCode, registrationUrl, disclosure }) {
  const parts = partnerBenefitParts(slug, locale, name);
  if (!parts?.value || !inviteCode) return null;
  const t = inner9Copy(locale);
  const fig = splitShareFigure(parts.value);
  const auto = signupUrlCarriesCode(registrationUrl, inviteCode);
  return (
    <section className="vx-rebate" aria-label={parts.label} data-code-auto={auto ? "true" : "false"}>
      <p className="vx-rebate__label"><i className="vx-live" aria-hidden="true" />{parts.label}</p>
      <p className="vx-rebate__fig">
        {fig.pre && <span className="vx-rebate__pre">{fig.pre}</span>}
        <bdi className="vx-rebate__num" dir="ltr">{fig.num}</bdi>
        {fig.post && <span className="vx-rebate__pre">{fig.post}</span>}
      </p>
      <p className="vx-rebate__terms">{[parts.settle, parts.confirmed].filter(Boolean).join(" · ")}</p>
      <p className="vx-rebate__code" data-auto={auto ? "" : undefined}>
        <span aria-hidden="true">{auto ? "✓" : "→"}</span>
        <span>{auto ? t.auto : t.enter}: <code translate="no" dir="ltr">{inviteCode}</code></span>
      </p>
      {disclosure && <p className="vx-rebate__disc">{disclosure}</p>}
    </section>
  );
}
