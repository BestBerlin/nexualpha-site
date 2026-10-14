import React from 'react';
import { bitgetGuideCopy } from '../../data/bitget-guide.js';
import './beginner.css';
export function BitgetGuidePage({ locale = 'en' }) {
  const copy = bitgetGuideCopy(locale);
  if (!copy) return null;
  return <main className="nxb v2-shell" lang={locale}>
    <header><p className="nxb-eyebrow">NexuAlpha · Bitget · 01—07</p><h1>{copy.title}</h1><p className="nxb-lead">{copy.description}</p></header>
    <p>{copy.intro}</p>
    <ol className="nxb-path">{copy.steps.map((step, i) => <li id={`step-${i + 1}`} key={step.title}><h2>{step.title}</h2>{step.paragraphs.map(p => <p key={p}>{p}</p>)}</li>)}</ol>
    <p><a className="nxb-action" href="/go/bitget?src=guide" rel="nofollow sponsored" data-cta-kind="registration" data-cta-platform="bitget" data-cta-placement="bitget-first-trade-guide">{copy.cta}</a></p>
    <section className="nxb-faq"><h2>{copy.faqLabel}</h2>{copy.faqs.map(faq => <article key={faq.q}><h3>{faq.q}</h3><p>{faq.a}</p></article>)}</section>
    <section><h2>{copy.sourcesLabel}</h2><ul>{copy.sources.map(source => <li key={source.url}><a href={source.url}>{source.title}</a></li>)}</ul></section>
  </main>;
}
