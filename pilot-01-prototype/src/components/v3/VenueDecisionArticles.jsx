import { enIfLatin } from "../../utils/fallback-lang.js";
import { decisionCopy, decisionForVenue } from "../../data/venue-decision-content.js";
import { venueDatabase } from "../../data/venue-database.js";
import { sanitizePublicText } from "../../data/public-copy-sanitizer.js";
import "./venue-decision.css";

export function VenueDecisionArticles({ slug, locale, text }) {
  const decision = decisionForVenue(slug, locale);
  if (!decision) return null;
  const ui = decisionCopy[locale] ?? decisionCopy.en;
  const reviewed = Boolean(venueDatabase[slug]?.decisionSourceReviewedAt);
  const pending = locale.startsWith("zh")
    ? {
        fit: "公开产品、地区资格与官方费率待逐项核对",
        why: "仅展示有来源和复核日期的事实",
        avoid: "地区限制、账户资格与活动条件待官方核验",
      }
    : {
        fit: "Verify public products, regional eligibility and official fees first",
        why: "Only source-linked facts with a review date are publishable",
        avoid: "Regional restrictions, account eligibility and campaign terms need official verification",
      };
  const items = [
    [text.detailBestFit, reviewed ? decision.fit : pending.fit],
    [text.detailWhyChoose, reviewed ? decision.why : pending.why],
    [reviewed && decision.suitabilityUnresolved ? ui[3] : text.detailNotFor, reviewed ? decision.avoid : pending.avoid],
  ];
  return items.map(([title, body], index) => <article className="venue-decision" key={title}>
    <h3>{title}</h3>
    {index === 0 && <small className="venue-decision__context" {...(reviewed ? undefined : enIfLatin(locale.startsWith("zh") ? "" : "Source review status", locale))}>{reviewed ? ui[0] : (locale.startsWith("zh") ? "来源复核状态" : "Source review status")}{reviewed && decision.contentLocale !== locale && <> {ui[1]}.</>}</small>}
    <p lang={reviewed ? decision.contentLocale : enIfLatin(body, locale) ? "en" : locale} dir={reviewed || enIfLatin(body, locale) ? "ltr" : undefined}>{reviewed ? sanitizePublicText(body) : body}</p>
    {index === 1 && reviewed && <a href="#platform-facts">{ui[2]}</a>}
    {index === 2 && reviewed && decision.supplementalSources.map((basis) => <a key={basis.id} href={basis.sourceUrl} target="_blank" rel="noopener noreferrer">{text.openOfficialSource} <time dateTime={basis.checkedAt}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(basis.checkedAt))}</time></a>)}
  </article>);
}
