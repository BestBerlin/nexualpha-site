// Shared chrome of the public data pages (/liquidations, /funding-rates): breadcrumb, H1, "updated · source" line,
// unavailable state, explainer, Telegram alerts line, one partner sign-up block (same component and data as the news
// pages, so invite codes and links are identical and the commission disclosure sits inside the card), the FAQ and the
// collapsed "Embed this" block (src/components/data/EmbedThisBlock.jsx).
import React from "react";
import { localizedHref } from "../../data/locale-routing.js";
import { DATA_PAGE_SIGNUP_VENUES, FUNDING_RATES_PATH, LIQUIDATIONS_PATH, MARKET_EVENTS_PATH, dataPageCopy, formatUtc } from "../../data/market-data-pages.js";
import { NewsTelegramAlerts } from "../v3/news/NewsTelegramAlerts.jsx";
import { NewsVenueOffer } from "../v3/news/NewsVenueOffer.jsx";
import { EmbedThisBlock } from "./EmbedThisBlock.jsx";
import "./data-pages.css";

export const textDirection = (locale) => (locale === "ar" ? "rtl" : "ltr");

export function DataPageHero({ locale, page, pathname, generatedAt, sourceLine, children }) {
  const copy = dataPageCopy(locale);
  return (
    <header className="nxd-hero v2-shell">
      <nav className="nxd-crumbs" aria-label="Breadcrumb">
        <a href={localizedHref("/", { locale })}>{copy.common.home}</a>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{page.h1}</span>
      </nav>
      <h1>{page.h1}</h1>
      <p className="nxd-lead">{page.lead}</p>
      <p className="nxd-updated" data-testid={`${pathname.slice(1)}-updated`}>
        {generatedAt ? <><span className="nxd-dot" aria-hidden="true" /><strong>{copy.common.updated}</strong> <time dateTime={generatedAt} dir="ltr">{formatUtc(generatedAt)}</time> · </> : null}
        <strong>{copy.common.source}:</strong> {sourceLine}
      </p>
      {children}
    </header>
  );
}

export function DataUnavailable({ locale }) {
  const copy = dataPageCopy(locale);
  return (
    <section className="nxd-unavailable v2-shell" data-rv="1" role="status" aria-live="polite" data-testid="data-unavailable">
      <h2>{copy.common.unavailableTitle}</h2>
      <p>{copy.common.unavailable}</p>
    </section>
  );
}

export function DataPageTail({ locale, page, pathname }) {
  const copy = dataPageCopy(locale);
  const other = pathname === LIQUIDATIONS_PATH ? [FUNDING_RATES_PATH, copy.nav.funding] : [LIQUIDATIONS_PATH, copy.nav.liquidations];
  return (
    <>
      <div className="v2-shell nxd-alerts" data-rv="1"><NewsTelegramAlerts locale={locale} /></div>
      <section className="nxd-explainer v2-shell" data-rv="1" aria-labelledby="nxd-explainer-h">
        <h2 id="nxd-explainer-h">{copy.common.explainer}</h2>
        {page.explainer.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
      </section>
      <div className="v2-shell nxd-offer" data-rv="1"><NewsVenueOffer venues={DATA_PAGE_SIGNUP_VENUES} locale={locale} articleSlug={pathname.slice(1)} variant="inline" /></div>
      <section className="nxd-faq v2-shell" data-rv="1" aria-labelledby="nxd-faq-h">
        <h2 id="nxd-faq-h">{copy.common.faq}</h2>
        {page.faq.map(([question, answer]) => (
          <article key={question} className="nxd-faq__item">
            <h3>{question}</h3>
            <p>{answer}</p>
          </article>
        ))}
      </section>
      <EmbedThisBlock locale={locale} pathname={pathname} />
      <footer className="nxd-foot v2-shell" data-rv="1">
        <p>{copy.common.refresh}</p>
        <p className="nxd-foot__links">
          <span>{copy.common.relatedData}:</span> <a href={localizedHref(other[0], { locale })}>{other[1]}</a>
          <span aria-hidden="true"> · </span>
          <a href={MARKET_EVENTS_PATH} rel="nofollow" dir="ltr">{copy.common.json}</a>
        </p>
      </footer>
    </>
  );
}
