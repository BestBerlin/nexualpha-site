// /about — who publishes NexuAlpha, how it earns, how facts are checked, the Research Desk and contact routes.
// Facts come from src/data/brand-entity.js (one entity for the whole site); wording from about-copy.js (15 locales).
import React from "react";
import { localizedHref } from "../../../data/locale-routing.js";
import { ABOUT_PATH, BRAND, EDITORIAL_POLICY_PATH, ENTITY_REVIEWED_AT, METHODOLOGY_PATH, RESEARCH_DESK_NAME, brandLocale, entityAtAGlance } from "../../../data/brand-entity.js";
import { ABOUT_COPY } from "./about-copy.js";
import { PRESS_PATH, pressNavLabel } from "../../../data/data-assets-routes.js";
import "./brand-pages.css";

export const textDirection = (locale) => (["ar", "ur"].includes(locale) ? "rtl" : "ltr");

export function BrandPageHeader({ locale, copy, pathname, children }) {
  const home = localizedHref("/", { locale });
  return (
    <header className="nxb-hero v2-shell">
      <nav className="nxb-crumbs" aria-label="Breadcrumb">
        <a href={home}>NexuAlpha</a>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{copy.h1}</span>
      </nav>
      <h1>{copy.h1}</h1>
      <p className="nxb-lead">{copy.lead}</p>
      <p className="nxb-reviewed" data-testid={`${pathname.slice(1)}-reviewed`}>
        <strong>{copy.reviewed}</strong> <time dateTime={ENTITY_REVIEWED_AT} dir="ltr">{ENTITY_REVIEWED_AT}</time>
      </p>
      {children}
    </header>
  );
}

export function AboutPage({ locale = "en" }) {
  const code = brandLocale(locale);
  const t = ABOUT_COPY[code] || ABOUT_COPY.en;
  const href = (target) => localizedHref(target, { locale: code });
  const entity = entityAtAGlance(code);
  const profiles = BRAND.profiles.map((url) => [url, url.replace(/^https:\/\/(?:www\.)?/, "")]);
  const contacts = [
    [t.contactChannelZh, BRAND.telegram.channelZh, "@NexuAlphaClub"],
    [t.contactChannelEn, BRAND.telegram.channelEn, "@NexuAlphaGlobal"],
    [t.contactBot, BRAND.telegram.bot, "@NexuAlphaAssistantBot"],
    [t.contactMiniApp, BRAND.telegram.miniApp, "app.nexualpha.com"],
    [t.contactEmail, `mailto:${BRAND.email}`, BRAND.email],
  ];
  return (
    <main className="v6 v2-page v3-page nxb nxb--about" id="top" lang={code} dir={textDirection(code)} data-testid="about-page">
      <BrandPageHeader locale={code} copy={t} pathname={ABOUT_PATH} />

      <section className="nxb-section nxb-section--card v2-shell" id="entity" aria-labelledby="nxb-entity-h" data-rv="1">
        <h2 id="nxb-entity-h">{entity.title}</h2>
        <p>{entity.body}</p>
        <p className="nxb-links">
          <strong>{entity.profilesLabel}{/^(zh|ja)/.test(code) ? "：" : ":"}</strong>{" "}
          {profiles.map(([url, label], index) => (
            <React.Fragment key={url}>
              {index ? " · " : ""}
              <a href={url} dir="ltr" target="_blank" rel="noopener noreferrer me">{label}</a>
            </React.Fragment>
          ))}
        </p>
      </section>

      <section className="nxb-section v2-shell" id="publisher" aria-labelledby="nxb-publisher-h" data-rv="1">
        <h2 id="nxb-publisher-h">{t.publisherTitle}</h2>
        <p>{t.publisherBody}</p>
      </section>

      <section className="nxb-section nxb-section--card v2-shell" id="funding" aria-labelledby="nxb-funding-h" data-rv="1">
        <h2 id="nxb-funding-h">{t.fundingTitle}</h2>
        <p>{t.fundingBody}</p>
      </section>

      <section className="nxb-section v2-shell" id="verification" aria-labelledby="nxb-verify-h" data-rv="1">
        <h2 id="nxb-verify-h">{t.verifyTitle}</h2>
        <p>{t.verifyBody}</p>
        <p className="nxb-links"><a href={href(METHODOLOGY_PATH)}>{t.verifyLink}</a> · <a href={href(PRESS_PATH)} data-testid="about-press-link">{pressNavLabel(code)}</a></p>
      </section>

      <section className="nxb-section nxb-section--card nxb-desk v2-shell" id="research-desk" aria-labelledby="nxb-desk-h" data-rv="1">
        <p className="nxb-eyebrow">{RESEARCH_DESK_NAME}</p>
        <h2 id="nxb-desk-h">{t.deskTitle}</h2>
        <p>{t.deskBody}</p>
        <p className="nxb-ai-note">{t.deskAi}</p>
        <p className="nxb-links"><a href={href(EDITORIAL_POLICY_PATH)}>{t.deskPolicyLink}</a></p>
      </section>

      <section className="nxb-section v2-shell" id="contact" aria-labelledby="nxb-contact-h" data-rv="1">
        <h2 id="nxb-contact-h">{t.contactTitle}</h2>
        <p>{t.contactBody}</p>
        <ul className="nxb-contacts">
          {contacts.map(([label, url, handle]) => (
            <li key={url}>
              <span className="nxb-contacts__label">{label}</span>
              <a href={url} dir="ltr" {...(url.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{handle}</a>
            </li>
          ))}
        </ul>
        <p className="nxb-fine">{t.notAdvice}</p>
      </section>
    </main>
  );
}

export default AboutPage;
