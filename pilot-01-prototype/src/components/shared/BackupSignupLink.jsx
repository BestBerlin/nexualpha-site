import React from 'react';
import { backupSignupHref, backupSignupLabel } from '../../data/backup-signup.js';
import { OUTBOUND_NEUTRAL_LOCALES } from '../../data/exchange-outbound.js';
import { isPartnerPromotableIn } from '../../data/partner-geo-policy.js';

// Small secondary link next to a primary sign-up button (owner 2026-10-13): for visitors who cannot open the official
// exchange domain, /go/<venue>-alt opens the mirror registration link with the same code (health-checked server side,
// falls back to the official link). Promotable locales only; never in neutral locales, VN, or Bitget in Türkiye.
export function BackupSignupLink({ venue, locale = 'en', market, placement = 'signup', className = '' }) {
  if (OUTBOUND_NEUTRAL_LOCALES.has(locale) || String(market || '').toUpperCase() === 'VN') return null;
  if (!isPartnerPromotableIn(venue, { locale, market })) return null;
  const href = backupSignupHref(venue, { src: `${placement}-alt`.slice(0, 48) });
  if (!href) return null;
  return <a className={`nx-backup-signup ${className}`.trim()} href={href} target="_blank" rel="nofollow sponsored noopener"
    data-cta-kind="backup-registration" data-cta-platform={venue} data-cta-placement={`${placement}-alt`}
    style={{ display: 'inline-block', marginTop: 6, fontSize: '0.8em', opacity: 0.85, textDecoration: 'underline' }}>{backupSignupLabel(locale)} ↗</a>;
}
