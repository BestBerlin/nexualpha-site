import React, { useEffect, useState } from 'react';
import { BrandMark } from '../../brand/BrandMark.jsx';
import { partnerBenefitParts } from '../../../data/owner-rebate-line.js';
import { venueGoHref } from '../../../data/source-bound-cta.js';
import { ctaUiCopy } from '../../../data/cta-ui-copy.js';
import { conversionCta, stickyVisible } from './conversion-model.js';
import { CommissionDisclosureLine, ConversionCode, ConversionSignup } from './ConversionActions.jsx';
import './venue-sticky-bar.css';

export function VenueStickyBar({ slug, locale, market, product, accountStage, funding }) {
  const cta = conversionCta(slug, locale, market, product, { accountStage, funding });
  const [active, setActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const key = `nx.conversion.dismissed.${slug}`;
  useEffect(() => {
    setActive(false);
    setDismissed(false);
    if (!cta || typeof IntersectionObserver !== 'function') return undefined;
    try { if (sessionStorage.getItem(key)) { setDismissed(true); return undefined; } } catch { /* storage is optional */ }
    const surface = document.querySelector('[data-cta-surface="venue-profile-main-registration"]');
    const hero = surface?.querySelector('a[data-cta-kind="registration"]') || surface;
    if (!hero) return undefined;
    const media = window.matchMedia('(max-width: 767px)');
    const footer = document.querySelector('footer');
    const visibility = new Map();
    let heroPassed = false;
    const update = () => setActive(stickyVisible({ eligible: true, mobile: media.matches, dismissed: false,
      heroPassed, ctaVisible: [...visibility.entries()].some(([target, visible]) => target !== footer && visible),
      footerVisible: visibility.get(footer) }));
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        visibility.set(entry.target, entry.isIntersecting);
        if (entry.target === hero) heroPassed = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
      }
      update();
    }, { threshold: 0 });
    const targets = new Set([hero, ...[...document.querySelectorAll('.v3-profile-page a[data-cta-kind="registration"]')].filter(target => !target.closest('[data-conversion-sticky]'))]);
    if (footer) targets.add(footer);
    for (const target of targets) observer.observe(target);
    media.addEventListener('change', update);
    return () => { observer.disconnect(); media.removeEventListener('change', update); };
  }, [slug, locale, market, product, accountStage, funding, Boolean(cta), key]);
  if (!cta) return null;
  const shown = active && !dismissed;
  const benefit = partnerBenefitParts(slug, locale);
  const terms = benefit ? `${benefit.label}: ${benefit.value}` : null;
  return <aside className="cv-sticky" data-conversion-sticky="" data-active={shown ? 'true' : 'false'}
    aria-label={ctaUiCopy(locale).caption} aria-hidden={!shown} inert={!shown}>
    <div className="cv-sticky__row">
      <div className="cv-sticky__venue"><BrandMark slug={slug} compact /><div><strong translate="no">{cta.name || slug}</strong>{terms && <small>{terms}</small>}</div></div>
      <button type="button" className="cv-sticky__close" aria-label={ctaUiCopy(locale).close} onClick={() => {
        setDismissed(true);
        try { sessionStorage.setItem(key, '1'); } catch { /* storage is optional */ }
      }}>×</button>
      <ConversionCode cta={cta} slug={slug} locale={locale} placement="venue-mobile-sticky-code" />
      {/* Preserve the existing sticky CTA href, including its /go attribution parameters. */}
      <ConversionSignup cta={cta} slug={slug} locale={locale} placement="venue-mobile-sticky" href={venueGoHref(slug, 'venue-mobile-sticky', locale, market)} />
    </div>
    <CommissionDisclosureLine locale={locale} />
  </aside>;
}
