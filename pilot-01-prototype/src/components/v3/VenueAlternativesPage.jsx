// /topics/<exchange>-alternatives (owner exchange keyword plan 2026-10-11). Data and copy: src/data/venue-alternatives.js.
// Fees come from exchange-facts.js, codes from the partner feed; the table states it is not a ranking and the
// commission disclosure sits directly above it. Codes are hidden where the referral-title policy keeps a locale neutral.
import { localizedHref } from "../../data/locale-routing.js";
import { referralTitleAllowed } from "../../data/referral-seo.js";
import { sectionEyebrowAttrs } from "../../data/section-eyebrow.js";
import {
  VENUE_ALTERNATIVES_REVIEWED_AT,
  venueAlternativePage,
  venueAlternativeRows,
  venueAlternativesContent,
  venueAlternativesCopy,
} from "../../data/venue-alternatives.js";
import { CommissionDisclosureLine } from "./CommissionDisclosureLine.jsx";
import "./venue-alternatives-page.css";

export function VenueAlternativesPage({ slug = "bybit-alternatives", locale = "en" }) {
  const page = venueAlternativePage(slug);
  if (!page) return null;
  const content = venueAlternativesContent(page, locale);
  const copy = venueAlternativesCopy(content.locale);
  const rows = venueAlternativeRows(page, locale);
  const href = (path) => localizedHref(path, { locale });
  const codeShown = (row) => Boolean(row.code && referralTitleAllowed(row.slug, locale));
  const anyCode = rows.some(codeShown);
  const sourceRows = rows.filter((row) => row.source);

  return (
    <main className="v6 venue-alternatives-page v2-page" id="top" lang={content.locale} {...sectionEyebrowAttrs(locale, "exchanges")}>
      <section className="venue-alternatives-hero v2-shell">
        <h1>{content.h1}</h1>
        <p className="venue-alternatives-hero__lead">{copy.lead(content.target)}</p>
        <p className="venue-alternatives-hero__date"><time dateTime={VENUE_ALTERNATIVES_REVIEWED_AT}>{VENUE_ALTERNATIVES_REVIEWED_AT}</time></p>
      </section>

      <section className="venue-alternatives-section v2-shell" aria-label={content.h1}>
        <p className="venue-alternatives-not-ranking">{copy.notRanking}</p>
        {anyCode ? <CommissionDisclosureLine locale={locale} placement="venue-alternatives-table" /> : null}
        <div className="venue-alternatives-table-wrap" role="region" aria-label={content.h1} tabIndex={0}>
          <table className="venue-alternatives-table">
            <thead><tr>{copy.cols.map((col) => <th key={col} scope="col">{col}</th>)}</tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.slug} className={row.reference ? "venue-alternatives-table__reference" : undefined}>
                  <th scope="row"><span translate="no">{row.name}</span>{row.reference ? <small> · {copy.reference}</small> : null}</th>
                  <td>{row.model === "dex" ? copy.dex : copy.cex}</td>
                  <td className="v6-num" translate="no">{row.spot || <span className="venue-alternatives-nc">{copy.notChecked}</span>}</td>
                  <td className="v6-num" translate="no">{row.perp || <span className="venue-alternatives-nc">{copy.notChecked}</span>}</td>
                  <td className="v6-num">{row.checkedOn ? <time dateTime={row.checkedOn}>{row.checkedOn}</time> : "—"}</td>
                  <td>{codeShown(row) ? <code translate="no">{row.code}</code> : "—"}</td>
                  <td className="venue-alternatives-actions">
                    <a href={href(row.profile)} data-cta-kind="research" data-cta-placement="venue-alternatives-profile">{copy.profile}</a>
                    {row.compare ? <a href={href(row.compare)} data-cta-kind="research" data-cta-placement="venue-alternatives-compare">{copy.compare(content.target)}</a> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="venue-alternatives-note">{copy.sourceNote}</p>
      </section>

      <section className="venue-alternatives-section v2-shell" aria-labelledby="venue-alternatives-notes-title">
        <h2 id="venue-alternatives-notes-title">{copy.notesTitle}</h2>
        <ul className="venue-alternatives-notes">
          {page.notes.map((slugKey) => (
            <li key={slugKey}>{copy.notes[slugKey]} <a href={page.noteSources[slugKey]} target="_blank" rel="noopener noreferrer" data-cta-kind="source" data-cta-placement="venue-alternatives-note-source">↗</a></li>
          ))}
        </ul>
      </section>

      <section className="venue-alternatives-section v2-shell" aria-labelledby="venue-alternatives-faq-title">
        <h2 id="venue-alternatives-faq-title">{copy.faqTitle}</h2>
        {content.faq.map(([question, answer]) => (
          <details key={question} className="venue-alternatives-faq" open>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
        <h3>{copy.sources}</h3>
        <ul className="venue-alternatives-sources">
          {sourceRows.map((row) => (
            <li key={row.slug}><a href={row.source} target="_blank" rel="noopener noreferrer" data-cta-kind="source" data-cta-placement="venue-alternatives-fee-source"><span translate="no">{row.name}</span> ↗</a></li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default VenueAlternativesPage;
