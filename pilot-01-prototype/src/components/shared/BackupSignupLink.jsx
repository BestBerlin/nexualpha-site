import React from 'react';
import { backupSignupHref, backupSignupLabel } from '../../data/backup-signup.js';
import { OUTBOUND_NEUTRAL_LOCALES } from '../../data/exchange-outbound.js';
import { isPartnerPromotableIn } from '../../data/partner-geo-policy.js';

// Compact icon next to a primary sign-up button (owner 2026-10-13): for visitors who cannot open the official
// exchange domain, /go/<venue>-alt opens the mirror registration link with the same code (health-checked server side,
// falls back to the official link). Promotable locales only; never in neutral locales, VN, or Bitget in Türkiye.
export function BackupSignupLink({ venue, locale = 'en', market, placement = 'signup', className = '' }) {
  if (OUTBOUND_NEUTRAL_LOCALES.has(locale) || String(market || '').toUpperCase() === 'VN') return null;
  if (!isPartnerPromotableIn(venue, { locale, market })) return null;
  const href = backupSignupHref(venue, { src: `${placement}-alt`.slice(0, 48) });
  if (!href) return null;
  return <a className={`nx-backup-signup ${className}`.trim()} href={href} target="_blank" rel="nofollow sponsored noopener"
    data-cta-kind="backup-registration" data-cta-platform={venue} data-cta-placement={`${placement}-alt`}
    aria-label={backupSignupLabel(locale)} title={backupSignupLabel(locale)}
    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 44px', width: 44, height: 44, verticalAlign: 'middle', color: 'inherit', background: 'transparent', border: 0, padding: 0, textDecoration: 'none' }}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 3h7v7M21 3l-9 9M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" /></svg></a>;
}
