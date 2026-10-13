// Brazil BCB 30-Oct-2026 deadline topic (owner plan 2026-10-12): /pt-br/topics/<pt slug> (Portuguese) and
// /topics/<en slug> (English). Other locales get translated chrome around the English article, with noindex.
// Data and copy: src/data/brazil-vasp-deadline.js (article) and src/data/brazil-vasp-status.js (per-exchange status).
// Partner links come only from publicCtaForVenue, never for an exchange whose status is "leaving". The commission
// disclosure lives only in the site footer and legal pages (owner rule 2026-10-12).
import { localizedHref } from "../../data/locale-routing.js";
import { SourceLink } from "../shared/SourceLink.jsx";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { sectionEyebrowAttrs } from "../../data/section-eyebrow.js";
import { BRAZIL_DEADLINE_PATH_EN, BRAZIL_DEADLINE_PATH_PT } from "../../data/brazil-vasp-deadline-slugs.js";
import { BRAZIL_DEADLINE_DATE, BRAZIL_DEADLINE_REVIEWED_AT, brazilStatusLabel } from "../../data/brazil-vasp-status.js";
import { brazilDeadlineChrome, brazilDeadlineContent, brazilDeadlineRows } from "../../data/brazil-vasp-deadline.js";
import "./brazil-deadline-page.css";

export function BrazilDeadlinePage({ locale = "en" }) {
  const chrome = brazilDeadlineChrome(locale);
  const content = brazilDeadlineContent(locale);
  const bodyLang = content.contentLocale;
  const bodyAttrs = bodyLang !== chrome.locale ? { lang: bodyLang, dir: "ltr" } : {};
  const rows = brazilDeadlineRows().map((row) => {
    const cta = row.promotable ? publicCtaForVenue(row.slug, locale) : null;
    return { ...row, registrationUrl: cta?.hasPartnerRoute ? cta.registrationUrl : null, sponsored: Boolean(cta?.hasReferral) };
  });
  const otherEditions = locale === "pt-BR"
    ? [[chrome.readEn, localizedHref(BRAZIL_DEADLINE_PATH_EN, { locale: "en" }), "en"]]
    : locale === "en"
    ? [[chrome.readPt, localizedHref(BRAZIL_DEADLINE_PATH_PT, { locale: "pt-BR" }), "pt-BR"]]
    : [[chrome.readEn, localizedHref(BRAZIL_DEADLINE_PATH_EN, { locale: "en" }), "en"], [chrome.readPt, localizedHref(BRAZIL_DEADLINE_PATH_PT, { locale: "pt-BR" }), "pt-BR"]];

  return (
    <main className="v6 brazil-deadline-page v2-page" id="top" lang={chrome.locale} {...sectionEyebrowAttrs(locale, "exchanges")}>
      <section className="brazil-deadline-hero v2-shell">
        <h1 {...bodyAttrs}>{content.h1}</h1>
        <p className="brazil-deadline-hero__lead" {...bodyAttrs}>{content.lead}</p>
        <ul className="brazil-deadline-facts">
          <li>{chrome.deadline}: <b><time dateTime={BRAZIL_DEADLINE_DATE}>{chrome.formatDate(BRAZIL_DEADLINE_DATE)}</time></b></li>
          <li>{chrome.reviewed}: <b><time dateTime={BRAZIL_DEADLINE_REVIEWED_AT}>{chrome.formatDate(BRAZIL_DEADLINE_REVIEWED_AT)}</time></b></li>
        </ul>
        <p className="brazil-deadline-lang">
          {locale !== "en" && locale !== "pt-BR" ? <>{chrome.editionsNote} </> : null}
          {otherEditions.map(([label, href, lang], index) => (
            <span key={href}>{index ? " · " : ""}<a href={href} hrefLang={lang} lang={lang} data-cta-kind="research" data-cta-placement="brazil-deadline-edition">{label}</a></span>
          ))}
        </p>
      </section>

      <section className="brazil-deadline-section v2-shell" aria-labelledby="brazil-deadline-answer-title" {...bodyAttrs}>
        <h2 id="brazil-deadline-answer-title">{content.answerTitle}</h2>
        <div className="brazil-deadline-answer"><p>{content.answer}</p></div>
      </section>

      {content.sections.map((section) => (
        <section key={section.id} className="brazil-deadline-section v2-shell" aria-labelledby={`brazil-deadline-${section.id}`} {...bodyAttrs}>
          <h2 id={`brazil-deadline-${section.id}`}>{section.title}</h2>
          {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.steps ? <ol>{section.steps.map((step) => <li key={step}>{step}</li>)}</ol> : null}
          {section.items ? <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
        </section>
      ))}

      <section className="brazil-deadline-section v2-shell" aria-labelledby="brazil-deadline-status-title">
        <h2 id="brazil-deadline-status-title">{chrome.tableTitle}</h2>
        <p>{chrome.tableLead}</p>
        <div className="brazil-deadline-table-wrap" role="region" aria-label={chrome.tableTitle} tabIndex={0}>
          <table className="brazil-deadline-table">
            <thead><tr>{chrome.cols.map((col) => <th key={col} scope="col">{col}</th>)}</tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.slug} data-brazil-status={row.status}>
                  <th scope="row"><span translate="no">{row.name}</span></th>
                  <td>
                    <span className={`brazil-deadline-status brazil-deadline-status--${row.status}`}>{brazilStatusLabel(row.status, locale)}</span>
                    {row.note ? <small {...bodyAttrs}>{row.note[bodyLang] || row.note.en}</small> : null}
                  </td>
                  <td>{row.source ? <SourceLink locale={locale} href={row.source} target="_blank" rel="noopener noreferrer" data-cta-kind="source" data-cta-placement="brazil-deadline-status-source">{row.sourceLabel} ↗</SourceLink> : <span className="brazil-deadline-note">{chrome.noSource}</span>}</td>
                  <td className="v6-num">{row.sourceDate ? <time dateTime={row.sourceDate}>{row.sourceDate}</time> : "—"}</td>
                  <td className="brazil-deadline-actions">
                    {row.profile ? <a href={localizedHref(row.profile, { locale })} data-cta-kind="research" data-cta-placement="brazil-deadline-profile">{chrome.profile}</a> : null}
                    {row.registrationUrl ? (
                      <a href={row.registrationUrl} target="_blank" rel={row.sponsored ? "sponsored noopener noreferrer" : "noopener noreferrer"} data-cta-kind="registration" data-cta-platform={row.slug} data-cta-placement="brazil-deadline-table">{chrome.register}</a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="brazil-deadline-note">{chrome.tableNote}</p>
      </section>

      <section className="brazil-deadline-section v2-shell" aria-labelledby="brazil-deadline-faq-title" {...bodyAttrs}>
        <h2 id="brazil-deadline-faq-title">{content.faqTitle}</h2>
        {content.faq.map(([question, answer]) => (
          <details key={question} className="brazil-deadline-faq" open>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </section>

      <section className="brazil-deadline-section v2-shell" aria-labelledby="brazil-deadline-sources-title">
        <h2 id="brazil-deadline-sources-title">{chrome.sourcesTitle}</h2>
        <ol className="brazil-deadline-sources">
          {content.sources.map((source) => (
            <li key={source.url}>
              <SourceLink locale={locale} href={source.url} target="_blank" rel="noopener noreferrer" data-cta-kind="source" data-cta-placement="brazil-deadline-source"><span {...bodyAttrs}>{source.label}</span> ↗</SourceLink>{" "}
              <time dateTime={source.date}>{chrome.sourceDated(source.date)}</time>
            </li>
          ))}
        </ol>
        <p className="brazil-deadline-note">{chrome.disclaimer}</p>
      </section>
    </main>
  );
}

export default BrazilDeadlinePage;
