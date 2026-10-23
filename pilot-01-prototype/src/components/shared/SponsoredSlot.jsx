import { SignupEvidence } from "./SignupEvidence.jsx";
import React from 'react';
import { promotionCopy } from '../../data/promotions.js';
import { contextualHref } from '../../data/contextual-href.js';
import { publicCtaForVenue } from '../../data/source-bound-cta.js';
import { partnerBenefitParts } from '../../data/owner-rebate-line.js';
import { BrandMark } from '../brand/BrandMark.jsx';
import { inner9Copy, signupUrlCarriesCode, splitShareFigure } from '../v3/inner9-copy.js';
import './sponsored-slot.css';

// Sign-up promotions render as the in-article exchange card (inner-page pass 2026-10-23): logo and name, the partner
// rebate share set large, the invite code with a note on whether the sign-up link applies it, one sign-up button (the
// "Sponsored" label is the disclosure; no disclaimer paragraphs, #145). The href, rel and "Sponsored" label are unchanged; tools keep the plain card.
function signupDetails(p, locale, market) {
  if (p.kind === 'tool' || !p.partner) return null;
  const cta = publicCtaForVenue(p.partner, locale, market);
  const code = cta && !cta.actionGate && cta.hasReferral ? cta.inviteCode : null;
  const parts = code ? partnerBenefitParts(p.partner, locale) : null;
  return { code, parts, auto: signupUrlCarriesCode(cta?.registrationUrl, code) };
}

export function SponsoredSlot({ promotions = [], variant = 'end', locale = 'en', market }) {
  const t = promotionCopy(locale);
  const x = inner9Copy(locale);
  return <div className={`sponsored-slot sponsored-slot--${variant}`} data-sponsored-slot={variant} lang={locale} dir={['ar', 'ur'].includes(locale) ? 'rtl' : 'ltr'}>
    {promotions.map(p => {
      const d = signupDetails(p, locale, market);
      const name = p.name || p.partner;
      const href = p.kind === 'tool' ? contextualHref(p.link, { locale, market }) : `${p.link}&locale=${encodeURIComponent(locale)}${market ? `&market=${encodeURIComponent(market)}` : ''}`;
      const fig = d?.parts ? splitShareFigure(d.parts.value) : null;
      return <div className={`sponsored-slot__card${d ? ' sponsored-slot__card--signup' : ''}`} key={p.id} data-signup-cta={d ? p.partner : undefined} data-signup-card={d ? p.partner : undefined}>
        <small className="sponsored-slot__label">{p.kind === 'tool' ? t.tool : t.sponsored}</small>
        {d ? <span className="sponsored-slot__brand"><BrandMark slug={p.partner} compact /><strong translate="no">{name}</strong></span> : <strong>{name}</strong>}
        {fig && <p className="sponsored-slot__share"><span>{d.parts.label}</span><b><bdi dir="ltr">{fig.num}</bdi></b>{fig.pre && <span className="sponsored-slot__share-pre">{fig.pre}</span>}</p>}
        {p.conditions?.[locale] && <p>{p.conditions[locale]}</p>}
        {d?.code && <p className="sponsored-slot__code" data-auto={d.auto ? '' : undefined}><span aria-hidden="true">{d.auto ? '✓' : '→'}</span><span>{d.auto ? x.auto : x.enter}: <code translate="no" dir="ltr">{d.code}</code></span></p>}
        <a href={href} target={p.kind === 'tool' ? undefined : '_blank'} rel={p.kind === 'tool' ? undefined : 'sponsored noopener'}>{d?.code ? x.signup.replace('{name}', name) : t.open} →</a>
        {d && <SignupEvidence slug={p.partner} locale={locale} market={market} />}
      </div>;
    })}
  </div>;
}
