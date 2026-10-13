import { decisionCopy, decisionForVenue } from "../../data/venue-decision-content.js";
import { SourceLink } from "../shared/SourceLink.jsx";
import { venueDatabase } from "../../data/venue-database.js";
import { sanitizePublicText } from "../../data/public-copy-sanitizer.js";
import { pendingDecisionCopy } from "../../data/pending-decision-copy.js";
import "./venue-decision.css";

export function VenueDecisionArticles({ slug, locale, text }) {
  const decision = decisionForVenue(slug, locale);
  if (!decision) return null;
  const ui = decisionCopy[locale] ?? decisionCopy.en;
  const reviewed = Boolean(venueDatabase[slug]?.decisionSourceReviewedAt);
  const pending = pendingDecisionCopy(locale);
  const items = [
    [text.detailBestFit, reviewed ? decision.fit : pending.fit],
    [text.detailWhyChoose, reviewed ? decision.why : pending.why],
    [reviewed && decision.suitabilityUnresolved ? ui[3] : text.detailNotFor, reviewed ? decision.avoid : pending.avoid],
  ];
  return items.map(([title, body], index) => <article className="venue-decision" key={title}>
    <h3>{title}</h3>
    {index === 0 && <small className="venue-decision__context">{reviewed ? ui[0] : pending.status}{reviewed && decision.contentLocale !== locale && <> {ui[1]}.</>}</small>}
    <p lang={reviewed ? decision.contentLocale : locale} dir={reviewed ? "ltr" : undefined}>{reviewed ? sanitizePublicText(body) : body}</p>
    {index === 1 && reviewed && <a href="#platform-facts">{ui[2]}</a>}
    {index === 2 && reviewed && decision.supplementalSources.map((basis) => <SourceLink locale={locale} key={basis.id} href={basis.sourceUrl} target="_blank" rel="noopener noreferrer">{text.openOfficialSource} <time dateTime={basis.checkedAt}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(basis.checkedAt))}</time></SourceLink>)}
  </article>);
}
