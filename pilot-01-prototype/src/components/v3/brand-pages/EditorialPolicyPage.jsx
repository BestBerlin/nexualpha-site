// /editorial-policy — sourcing rules, corrections, partner links, AI assistance and update cadence.
// Linked from the footer, the article byline and the Research Desk section on /about.
import React from "react";
import { localizedHref } from "../../../data/locale-routing.js";
import { ABOUT_PATH, BRAND, EDITORIAL_POLICY_PATH, METHODOLOGY_PATH, RESEARCH_DESK_ANCHOR, RESEARCH_DESK_NAME, brandLocale } from "../../../data/brand-entity.js";
import { BrandPageHeader, textDirection } from "./AboutPage.jsx";
import { EDITORIAL_POLICY_COPY } from "./editorial-policy-copy.js";
import "./brand-pages.css";

export function EditorialPolicyPage({ locale = "en" }) {
  const code = brandLocale(locale);
  const t = EDITORIAL_POLICY_COPY[code] || EDITORIAL_POLICY_COPY.en;
  const href = (target) => localizedHref(target, { locale: code });
  return (
    <main className="v6 v2-page v3-page nxb nxb--policy" id="top" lang={code} dir={textDirection(code)} data-testid="editorial-policy-page">
      <BrandPageHeader locale={code} copy={t} pathname={EDITORIAL_POLICY_PATH}>
        <p className="nxb-byline"><a href={href(RESEARCH_DESK_ANCHOR)}>{RESEARCH_DESK_NAME}</a></p>
      </BrandPageHeader>

      <section className="nxb-section v2-shell" id="sourcing" aria-labelledby="nxb-sourcing-h" data-rv="1">
        <h2 id="nxb-sourcing-h">{t.sourcingTitle}</h2>
        <ol className="nxb-rules">
          {t.sourcingItems.map((item, index) => <li key={index} id={index === 2 ? "lower-bound" : undefined}>{item}</li>)}
        </ol>
      </section>

      <section className="nxb-section nxb-section--card v2-shell" id="corrections" aria-labelledby="nxb-corrections-h" data-rv="1">
        <h2 id="nxb-corrections-h">{t.correctionsTitle}</h2>
        <p>{t.correctionsBody}</p>
        <ul className="nxb-bullets">
          {t.correctionsItems.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
        <p className="nxb-links">
          <a href={BRAND.telegram.bot} target="_blank" rel="noopener noreferrer" dir="ltr">@NexuAlphaAssistantBot</a>
          <span aria-hidden="true"> · </span>
          <a href={`mailto:${BRAND.email}`} dir="ltr">{BRAND.email}</a>
        </p>
      </section>

      <section className="nxb-section v2-shell" id="partner-links" aria-labelledby="nxb-partner-h" data-rv="1">
        <h2 id="nxb-partner-h">{t.partnerTitle}</h2>
        <p>{t.partnerBody}</p>
      </section>

      <section className="nxb-section nxb-section--card v2-shell" id="ai-assistance" aria-labelledby="nxb-ai-h" data-rv="1">
        <h2 id="nxb-ai-h">{t.aiTitle}</h2>
        <p className="nxb-ai-note">{t.aiBody}</p>
      </section>

      <section className="nxb-section v2-shell" id="update-cadence" aria-labelledby="nxb-cadence-h" data-rv="1">
        <h2 id="nxb-cadence-h">{t.cadenceTitle}</h2>
        <ul className="nxb-bullets">
          {t.cadenceItems.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      </section>

      <section className="nxb-section v2-shell" id="contact" aria-labelledby="nxb-policy-contact-h" data-rv="1">
        <h2 id="nxb-policy-contact-h">{t.contactTitle}</h2>
        <p>{t.contactBody}</p>
        <p className="nxb-links">
          <a href={href(METHODOLOGY_PATH)}>{t.methodologyLink}</a>
          <span aria-hidden="true"> · </span>
          <a href={href(ABOUT_PATH)}>{t.aboutLink}</a>
        </p>
      </section>
    </main>
  );
}

export default EditorialPolicyPage;
