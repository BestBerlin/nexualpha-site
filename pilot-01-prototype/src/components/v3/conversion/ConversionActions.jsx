import React, { useEffect, useRef, useState } from 'react';
import { ctaUiCopy, copyText, trackCodeCopy } from '../../../data/cta-ui-copy.js';

// The checkout has no CommissionDisclosureLine component: reuse its existing localized disclosure wording.
export function CommissionDisclosureLine() {
  // Owner 2026-10-23: no disclosure sentences in page bodies; the footer "合作披露" page carries it.
  return null;
}

export function ConversionCode({ cta, slug, locale, placement }) {
  const [feedback, setFeedback] = useState('');
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const t = ctaUiCopy(locale);
  if (!cta.inviteCode) return null;
  return <button type="button" className="cv-code" onClick={async () => {
    clearTimeout(timer.current);
    setFeedback('');
    const ok = await copyText(cta.inviteCode);
    setFeedback(ok ? t.copied : t.copyFail);
    if (ok) trackCodeCopy(slug, placement);
    timer.current = setTimeout(() => setFeedback(''), 2000);
  }}>
    <span>{t.code} <code translate="no" dir="ltr">{cta.inviteCode}</code></span>
    <span aria-live="polite" aria-atomic="true">{feedback || t.copy}</span>
  </button>;
}

export function ConversionSignup({ cta, slug, locale, placement, href = cta.registrationUrl }) {
  return <a className="cv-signup" href={href} target="_blank" rel="sponsored noopener noreferrer"
    data-cta-kind="registration" data-cta-platform={slug} data-cta-placement={placement}
    data-cta-code={cta.inviteCode || undefined}>{ctaUiCopy(locale).signupN.replace('{n}', cta.name || slug)} <span aria-hidden="true">↗</span></a>;
}
