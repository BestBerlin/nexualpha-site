import React from 'react';
import { promotionCopy } from '../../data/promotions.js';
import { contextualHref } from '../../data/contextual-href.js';
import './sponsored-slot.css';

export function SponsoredSlot({ promotions = [], variant = 'end', locale = 'en', market }) {
  const t = promotionCopy(locale);
  return <div className={`sponsored-slot sponsored-slot--${variant}`} data-sponsored-slot={variant} lang={locale} dir={['ar', 'ur'].includes(locale) ? 'rtl' : 'ltr'}>
    {promotions.map(p => <div className="sponsored-slot__card" key={p.id}>
      <small className="sponsored-slot__label">{p.kind === 'tool' ? t.tool : t.sponsored}</small>
      <strong>{p.name || p.partner}</strong>
      {p.conditions?.[locale] && <p>{p.conditions[locale]}</p>}
      <a href={p.kind === 'tool' ? contextualHref(p.link, { locale, market }) : `${p.link}&locale=${encodeURIComponent(locale)}${market ? `&market=${encodeURIComponent(market)}` : ''}`} target={p.kind === 'tool' ? undefined : '_blank'} rel={p.kind === 'tool' ? undefined : 'sponsored noopener'}>{t.open} →</a>
    </div>)}
  </div>;
}
