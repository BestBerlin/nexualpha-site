import { SignupEvidence } from "../shared/SignupEvidence.jsx";
// Crypto glossary (/glossary, /glossary/<slug>), 2026-10-13. Term page: the one-sentence definition first (featured
// snippet), then how it works (with links to other terms), a worked example, common mistakes, the next step (Academy
// lesson, data tool, coin page, and on trading terms a soft partner sign-up), FAQ and related terms. Hub: search,
// topic filter and an A–Z list. Owner rules: no fine print, no price predictions; sign-up only via the promotions
// resolver (geo-gated) and our tracked /go/<venue> link. SSR renders every word; the browser only runs the hub filter
// and the copy-code button. Content arrives as props (the locale's index or the term's shard module).
import React, { useState } from "react";
import { GLOSSARY_CATEGORIES, GLOSSARY_NEUTRAL_LOCALES, glossaryContentLocale, glossaryHref, glossaryLetter, glossarySignup, glossaryTermPath } from "../../data/glossary.js";
import { glossaryCopy, fill } from "../../data/glossary-copy.js";
import { glossaryTermBySlug } from "../../data/glossary-terms.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import "./glossary.css";

const RTL = new Set(["ar", "ur"]);
const dirOf = (locale) => (RTL.has(locale) ? "rtl" : "ltr");
const baseName = (term) => String(term || "").replace(/\s*[（(][^）)]*[）)]\s*/g, " ").replace(/\s+/g, " ").trim();
const lessonPath = (lesson) => `/academy/${lesson.slug}`;
// "How funding rate works": English names start lower-case mid-sentence (acronyms and proper names keep their case).
const PROPER = new Set(["bitcoin", "ethereum", "usdt", "usdc", "mica"]);
const midSentence = (name, locale, slug) => (locale === "en" && !PROPER.has(slug) && /^[A-Z][a-z]/.test(name) ? name[0].toLowerCase() + name.slice(1) : name);

function Crumbs({ locale, market, t, term }) {
  return <nav className="nxg-crumbs" aria-label="Breadcrumb">
    <a href={glossaryHref("/", locale)}>{t.home}</a><span aria-hidden="true">/</span>
    {term ? <><a href={glossaryHref("/glossary", locale, market)}>{t.brand}</a><span aria-hidden="true">/</span><span aria-current="page">{baseName(term.term)}</span></>
      : <span aria-current="page">{t.brand}</span>}
  </nav>;
}

// Text with glossary cross-links: a string, or segments (string | [text, slug]) compiled at build time.
function Linked({ value, locale, market }) {
  if (typeof value === "string") return value;
  return value.map((part, index) => (typeof part === "string" ? part
    : <a key={index} className="nxg-term-link" href={glossaryHref(glossaryTermPath(part[1]), locale, market)} data-glossary-link={part[1]}>{part[0]}</a>));
}

function CopyCode({ code, t }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked: the code stays visible */ }
  };
  return <span className="nxg-code"><span className="nxg-code__label">{t.codeLabel}</span><code translate="no">{code}</code>
    <button type="button" onClick={copy} aria-live="polite">{copied ? t.copied : t.copy}</button></span>;
}

function NextSteps({ term, locale, market, t }) {
  const name = baseName(term.term);
  const tool = term.tool ? t.tools[term.tool] || glossaryCopy("en").tools[term.tool] : null;
  const signup = glossarySignup(term, { locale, market });
  const cards = [];
  if (term.lesson) cards.push(<a key="lesson" className="nxg-step" href={glossaryHref(lessonPath(term.lesson), locale, market)} data-glossary-next="lesson">
    <span className="nxg-step__kind">{t.lesson}</span><b>{term.lesson.title}</b><small>{fill(t.lessonMeta, { n: term.lesson.ep })}</small></a>);
  if (tool) cards.push(<a key="tool" className="nxg-step" href={glossaryHref(term.tool, locale, market)} data-glossary-next="tool">
    <span className="nxg-step__kind">{t.tool}</span><b>{tool[0]}</b><small>{tool[1]}</small></a>);
  if (term.coin) cards.push(<a key="coin" className="nxg-step" href={glossaryHref(`/coins/${term.coin.slug}`, locale, market)} data-glossary-next="coin">
    <span className="nxg-step__kind">{fill(t.coin, { coin: term.coin.name })}</span><b translate="no">{term.coin.name} ({term.coin.symbol})</b><small>{fill(t.coinMeta, { symbol: term.coin.symbol })}</small></a>);
  if (!cards.length && !signup) return null;
  return <section className="nxg-sec" aria-labelledby="nxg-next-h">
    <h2 id="nxg-next-h">{t.nextSteps}</h2>
    {cards.length ? <div className="nxg-steps">{cards}</div> : null}
    {signup ? <div className="nxg-cta" data-glossary-cta={signup.venue}>
      <div className="nxg-cta__text">
        <p className="nxg-cta__title"><BrandMark slug={signup.venue} compact /><span>{t.ctaTitle}</span></p>
        <p>{fill(t.ctaBody, { venue: signup.name, term: name })}</p>
      </div>
      <div className="nxg-cta__actions">
        {signup.code ? <CopyCode code={signup.code} t={t} /> : null}
        <span data-signup-cta={signup.venue} className="signup-cta-block"><a className="nxg-btn" href={signup.href} target="_blank" rel="sponsored noopener noreferrer" data-offer-link="go" data-cta-platform={signup.venue} data-cta-placement={`glossary-${term.slug}`}>{fill(t.ctaButton, { venue: signup.name })}</a><SignupEvidence slug={signup.venue} locale={locale} market={market} /></span>
      </div>
    </div> : null}
  </section>;
}

export function GlossaryTermPage({ locale = "en", content, slug, market }) {
  const t = glossaryCopy(locale);
  const term = content?.[slug] || null;
  if (!term || !glossaryTermBySlug(slug)) return <main className="nxg nxg--missing" id="top" dir={dirOf(locale)}><div className="nxg-shell"><h1>404</h1><p><a className="nxg-link" href={glossaryHref("/glossary", locale, market)}>{t.backToHub}</a></p></div></main>;
  const name = baseName(term.term);
  const lang = term.contentLocale !== locale ? term.contentLocale : undefined;
  return <main className="nxg nxg--term" id="top" dir={dirOf(locale)} data-glossary-term={term.slug}>
    <div className="nxg-shell nxg-shell--read">
      <Crumbs locale={locale} market={market} t={t} term={term} />
      <article lang={lang}>
        <header className="nxg-head">
          <p className="nxg-overline"><a href={`${glossaryHref("/glossary", locale, market)}#cat-${term.cat}`}>{t.categories[term.cat]}</a></p>
          <h1 className="nxg-title">{term.term}</h1>
          {term.aka?.length ? <p className="nxg-aka"><span>{t.alsoCalled}:</span> {term.aka.join(" · ")}</p> : null}
          <div className="nxg-def" data-glossary-definition>
            <p className="nxg-def__label">{t.definition}</p>
            <p className="nxg-def__text">{term.short}</p>
          </div>
          {lang ? <p className="nxg-muted nxg-note" lang={locale}>{t.englishNote}</p> : null}
        </header>

        <section className="nxg-sec" aria-labelledby="nxg-how-h">
          <h2 id="nxg-how-h">{fill(t.howItWorks, { term: midSentence(name, locale, term.slug) })}</h2>
          {term.body.map((paragraph, index) => <p key={index}><Linked value={paragraph} locale={locale} market={market} /></p>)}
          <div className="nxg-example">
            <p className="nxg-example__label">{t.example}</p>
            <p><Linked value={term.example} locale={locale} market={market} /></p>
          </div>
        </section>

        <section className="nxg-sec" aria-labelledby="nxg-mistakes-h">
          <h2 id="nxg-mistakes-h">{t.mistakes}</h2>
          <ul className="nxg-mistakes">{term.mistakes.map((item, index) => <li key={index}>{item}</li>)}</ul>
        </section>

        <NextSteps term={term} locale={locale} market={market} t={t} />

        <section className="nxg-sec nxg-faq" aria-labelledby="nxg-faq-h">
          <h2 id="nxg-faq-h">{t.faq}</h2>
          {term.faq.map((entry, index) => <details key={index} open={index === 0}>
            <summary>{entry.q}</summary>
            <p>{entry.a}</p>
          </details>)}
        </section>
      </article>

      <section className="nxg-sec nxg-related" aria-labelledby="nxg-related-h">
        <h2 id="nxg-related-h">{t.related}</h2>
        <ul>{term.related.map(([relatedSlug, relatedName, relatedShort]) => <li key={relatedSlug}>
          <a href={glossaryHref(glossaryTermPath(relatedSlug), locale, market)}><b>{relatedName}</b><small>{relatedShort}</small></a>
        </li>)}</ul>
        <p><a className="nxg-link" href={glossaryHref("/glossary", locale, market)}>{t.backToHub} →</a></p>
      </section>
    </div>
  </main>;
}

export function GlossaryHubPage({ locale = "en", content, market }) {
  const t = glossaryCopy(locale);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const rows = (content?.terms || []).map(([slug, name, short, cat]) => {
    const english = glossaryTermBySlug(slug)?.en || name;
    return { slug, name, short, cat, english, letter: glossaryLetter(name, english) };
  });
  const cjk = rows.some((row) => /^[぀-ヿ㐀-鿿가-힯]/.test(row.name));
  if (cjk) rows.sort((a, b) => a.english.localeCompare(b.english, "en"));
  const q = query.trim().toLowerCase();
  const visible = rows.filter((row) => (category === "all" || row.cat === category)
    && (!q || row.name.toLowerCase().includes(q) || row.english.toLowerCase().includes(q) || row.short.toLowerCase().includes(q) || row.slug.includes(q)));
  const letters = [...new Set(rows.map((row) => row.letter))].sort();
  const groups = letters.map((letter) => [letter, visible.filter((row) => row.letter === letter)]).filter(([, list]) => list.length);
  const counts = Object.fromEntries(GLOSSARY_CATEGORIES.map((cat) => [cat, rows.filter((row) => row.cat === cat).length]));
  const contentLang = glossaryContentLocale(locale) !== locale ? "en" : undefined;
  return <main className="nxg nxg--hub" id="top" dir={dirOf(locale)}>
    <div className="nxg-shell">
      <Crumbs locale={locale} market={market} t={t} />
      <header className="nxg-hubhead">
        <h1 className="nxg-title">{fill(t.hubTitle, { count: rows.length })}</h1>
        <p className="nxg-lead">{t.hubLead}</p>
      </header>
      <div className="nxg-tools" role="search">
        <label className="nxg-search">
          <span className="nxg-visually-hidden">{t.searchLabel}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPlaceholder} autoComplete="off" spellCheck={false} />
        </label>
        <div className="nxg-chips" role="group" aria-label={t.byCategory}>
          {["all", ...GLOSSARY_CATEGORIES].map((key) => <button type="button" key={key} id={key === "all" ? undefined : `cat-${key}`} aria-pressed={category === key} onClick={() => setCategory(key)}>
            {key === "all" ? t.filterAll : t.categories[key]}<small>{key === "all" ? rows.length : counts[key]}</small></button>)}
        </div>
        <nav className="nxg-az" aria-label={t.azLabel}>
          <span className="nxg-az__label">{t.azLabel}</span>
          {letters.map((letter) => groups.some(([l]) => l === letter) ? <a key={letter} href={`#letter-${letter === "#" ? "num" : letter}`}>{letter}</a> : <span key={letter} aria-hidden="true">{letter}</span>)}
        </nav>
      </div>
      <p className="nxg-muted nxg-count" aria-live="polite">{fill(t.showing, { n: visible.length })}</p>
      {groups.length ? <div className="nxg-groups" lang={contentLang}>
        {groups.map(([letter, list]) => <section key={letter} className="nxg-group" id={`letter-${letter === "#" ? "num" : letter}`} aria-label={letter}>
          <h2 className="nxg-group__letter">{letter}</h2>
          <ul className="nxg-list">{list.map((row) => <li key={row.slug} data-glossary-row={row.slug}>
            <a href={glossaryHref(glossaryTermPath(row.slug), locale, market)}>
              <b>{row.name}</b>{cjk && !row.name.includes(row.english) ? <span className="nxg-list__en" lang="en">{row.english}</span> : null}
              <small>{row.short}</small>
            </a>
          </li>)}</ul>
        </section>)}
      </div> : <p className="nxg-empty">{fill(t.noResults, { q: query })}</p>}
      {GLOSSARY_NEUTRAL_LOCALES.has(locale) ? null : null}
    </div>
  </main>;
}

export default GlossaryTermPage;
