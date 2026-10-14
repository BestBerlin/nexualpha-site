import { BITGET_GUIDE_PATH, bitgetGuideAvailable, bitgetGuideLabel } from "../../data/bitget-guide-routes.js";
import { BEGINNER_COUNTRIES as COUNTRIES, BEGINNER_COUNTRY_LABELS } from "../../data/beginner-countries.js";
import { BEGINNER_SOURCE_NOTES, isTaxQuestion } from "../../data/beginner-source-notes.js";
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { beginnerPath } from '../../data/beginner-routes.js';
import { beginnerChoice, beginnerSignupHref, checkBeginnerLink } from '../../data/beginner.js';
import { localizedHref } from '../../data/locale-routing.js';
import { promotionCountries } from '../../data/partner-geo-policy.js';
import { isNeutralCtaLocale } from '../../data/locale-policy.js';
import { BACKUP_SIGNUP_URLS, backupSignupLabel } from '../../data/backup-signup.js';
import { ctaUiCopy } from '../../data/cta-ui-copy.js';
import { SourceLink } from '../shared/SourceLink.jsx';
import './beginner.css';

const STORAGE = 'nexualpha-beginner-progress';
function savedProgress() {
  try { const value = JSON.parse(localStorage.getItem(STORAGE) || '[]'); return Array.isArray(value) ? value.filter(n => Number.isInteger(n) && n >= 1 && n <= 7) : []; } catch { return []; }
}
function Signup({ choice, locale, market, copy }) {
  if (!choice || isNeutralCtaLocale(locale)) return null;
  const ui = ctaUiCopy(locale);
  return <section className="nxb-signup" aria-label={copy.labels.register}>
    {choice.benefitVerified ? <p>{choice.benefit}</p> : null}
    <a className="nxb-action" href={beginnerSignupHref(choice.slug, locale, market)} rel="nofollow sponsored" data-cta-kind="registration" data-cta-platform={choice.slug} data-cta-placement="beginner-step-2">{ui.openN.replace('{n}', choice.name)}</a>
    {choice.inviteCode ? <p>{ui.code}: <code>{choice.inviteCode}</code><br />{ui.check.replace('{c}', choice.inviteCode)}</p> : null}
    {BACKUP_SIGNUP_URLS[choice.slug] ? <a href={beginnerSignupHref(choice.slug, locale, market, true)} rel="nofollow sponsored">{backupSignupLabel(locale)}</a> : null}
  </section>;
}
export function BeginnerPage({ locale = 'en', market, route, copy }) {
  const [country, setCountry] = useState(() => {
    const countries = promotionCountries({ locale, market });
    return countries.length === 1 && COUNTRIES.includes(countries[0]) ? countries[0] : '';
  });
  const useCountryEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
  useCountryEffect(() => {
    const countries = promotionCountries({ locale, market });
    setCountry(countries.length === 1 && COUNTRIES.includes(countries[0]) ? countries[0] : '');
  }, [locale, market]);
  const [completed, setCompleted] = useState([]);
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  useEffect(() => { setCompleted(savedProgress()); }, []);
  // Country survives ordinary page links in the URL; progress stays on this device only.
  const href = (kind, step) => localizedHref(`${beginnerPath(kind, locale, step)}${country ? `?market=${encodeURIComponent(country)}` : ''}`, { locale });
  const choice = country ? beginnerChoice(locale, country) : null;
  const l = copy.labels;
  const step = route.step ? copy.steps[route.step - 1] : null;
  const pageSeo = step ? copy.seo.steps[route.step - 1] : copy.seo[route.kind];
  const title = pageSeo.title;
  const names = BEGINNER_COUNTRY_LABELS[locale] || BEGINNER_COUNTRY_LABELS.en;
  function markDone() {
    const next = [...new Set([...completed, route.step])].sort();
    setCompleted(next); try { localStorage.setItem(STORAGE, JSON.stringify(next)); } catch { /* Storage can be disabled. */ }
  }
  return <main className="nxb v2-shell" dir={['ar', 'ur'].includes(locale) ? 'rtl' : 'ltr'} lang={locale}>
    <nav className="nxb-nav" aria-label={l.start}>
      {['start', 'questions', 'check'].map(kind => <a key={kind} href={href(kind)} aria-current={route.kind === kind ? 'page' : undefined}>{l[kind]}</a>)}
    </nav>
    <header><p className="nxb-eyebrow">NexuAlpha · {route.kind === 'start' ? '01—07' : route.kind === 'questions' ? copy.faqs.length : 'HTTPS'}</p><h1>{title}</h1><p className="nxb-lead">{pageSeo.description}</p></header>
    {["start", "check"].includes(route.kind) ? <label className="nxb-country">{l.country}<select value={country} onChange={e => setCountry(e.target.value)}><option value="">{l.chooseCountry}</option>{COUNTRIES.map(code => <option key={code} value={code}>{names[code]}</option>)}</select></label> : null}
    {route.kind === 'start' ? <>
      <p>{l.progress}: {completed.length}/7</p><progress value={completed.length} max="7" aria-label={l.progress} />
      {(!step || route.step <= 2) && !isNeutralCtaLocale(locale) ? <section className="nxb-choice">
        {choice ? <><h2>{choice.name}</h2><p>{l.why}: {copy.why.join(' ')}</p><a href={localizedHref(`/exchanges/${choice.slug}?market=${encodeURIComponent(country)}`, { locale })}>{choice.name} →</a>
          <p><a href={localizedHref('/licenses', { locale })}>{copy.faqs.find(f => f.step === 1)?.q}</a></p>
          {choice.records.map(record => <p key={record.entityName}>{record.entityName} · {record.regulator} · {record.status}<br /><SourceLink href={record.sourceUrl} locale={locale} market={country}>{record.regulator}</SourceLink></p>)}
        </> : <p>{l.noChoice}</p>}
      </section> : null}
      {!step ? <ol className="nxb-path">{copy.steps.map((item, i) => <li key={item.title}><a href={href('start', i + 1)}>{item.title} {completed.includes(i + 1) ? '✓' : '→'}</a><p>{item.answer}</p></li>)}</ol> : <>
        {route.step === 2 ? <>{bitgetGuideAvailable(locale, country) ? <p><a href={localizedHref(BITGET_GUIDE_PATH, { locale, market: country })}>{bitgetGuideLabel(locale)}</a></p> : null}<Signup choice={choice} locale={locale} market={country} copy={copy} /><section><h2>{l.official} · OKX</h2><p>{BEGINNER_SOURCE_NOTES[locale]}</p><SourceLink href={BEGINNER_SOURCE_NOTES.source} locale={locale} market={country}>OKX · FAQ</SourceLink></section></> : null}
        <section><h2>{l.steps}</h2><ol>{step.actions.map(item => <li key={item}>{item}</li>)}</ol></section>
        <section><h2>{l.mistakes}</h2><ul>{step.mistakes.map(item => <li key={item}>{item}</li>)}</ul></section>
        <button type="button" onClick={markDone}>{l.complete} {completed.includes(route.step) ? '✓' : ''}</button>
        <p><a className="nxb-action" href={route.step < 7 ? href('start', route.step + 1) : href('questions')}>{l.next} →</a></p>
      </>}
      <button type="button" onClick={() => { setCompleted([]); try { localStorage.removeItem(STORAGE); } catch {} }}>{l.reset}</button>
    </> : null}
    {route.kind === 'questions' ? <section className="nxb-faq">{copy.faqs.map((faq, i) => <article key={faq.q} id={`q-${i + 1}`}><h2>{faq.q}</h2><p>{faq.a}</p><a href={href('start', faq.step)}>{copy.steps[faq.step - 1].title} →</a>{country === "US" && isTaxQuestion(faq.q) ? <p><a href={BEGINNER_SOURCE_NOTES.taxSource}>US · IRS</a></p> : null}{faq.source ? <p><SourceLink href={faq.source} locale={locale} market={country}>{l.official}</SourceLink></p> : null}</article>)}</section> : null}
    {route.kind === 'check' ? <>
      <form onSubmit={e => { e.preventDefault(); setResult(checkBeginnerLink(input)); }}><label htmlFor="nxb-url">{l.urlLabel}</label><input id="nxb-url" type="url" value={input} onChange={e => { setInput(e.target.value); setResult(null); }} placeholder="https://" required dir="ltr" autoComplete="off" /><button type="submit">{l.checkButton}</button></form>
      {result ? <p role="status" aria-live="polite"><strong>{l[result.kind]}</strong>{result.host ? <> · <bdi>{result.host}</bdi></> : null}</p> : null}
      {copy.scams.map(scam => <section key={scam.title}><h2>{scam.title}</h2><p>{scam.answer}</p></section>)}
      <nav className="nxb-apps" aria-label={l.official}>{['bitget', 'okx', 'binance'].filter(slug => (locale !== 'tr' && country !== 'TR') || slug !== 'bitget').map(slug => <a key={slug} href={localizedHref(`/exchanges/${slug}/app`, { locale })}>{slug} · {l.official}</a>)}</nav>
      {!isNeutralCtaLocale(locale) ? <><h2>{l.official}</h2><Signup choice={choice} locale={locale} market={country} copy={copy} />{!choice ? <p><a href={href("start", 1)}>{l.chooseCountry} →</a></p> : null}</> : null}
    </> : null}
  </main>;
}
