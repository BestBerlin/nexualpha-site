// Local market brief on the /tr, /vi and /id-id home pages (links-l10n lane 2026-10-11; scorecard M5): regulator with
// its official site, the source-bound local payment rail and what NexuAlpha cannot confirm for residents. Content and
// sources: src/data/local-market-brief.js. No partner link or invite code is shown here, so no commission disclosure.
import { localMarketBrief, LOCAL_MARKET_BRIEF_ENABLED, LOCAL_MARKET_BRIEF_REVIEWED_AT } from "../../data/local-market-brief.js";

export function LocalMarketBrief({ locale, enabled = LOCAL_MARKET_BRIEF_ENABLED }) {
  const brief = enabled ? localMarketBrief(locale) : null;
  if (!brief) return null;
  return (
    <section className="h7-in h7-local" id="h7-local" aria-labelledby="h7-local-h" lang={locale} data-local-market={brief.market}>
      <h2 id="h7-local-h">{brief.title}</h2>
      <p className="h7-local-lead">{brief.lead}</p>
      <div className="h7-local-grid">
        {brief.sections.map((section) => (
          <div className="h7-local-col" key={section.heading}>
            <h3>{section.heading}</h3>
            {section.regulator && <p className="h7-local-reg"><a href={section.regulator.url} target="_blank" rel="noopener noreferrer">{section.regulator.name} ↗</a></p>}
            <ul>
              {section.items.map((item) => (
                <li key={item.text}>
                  <span>{item.text}</span>
                  {item.source && <a className="h7-local-src" href={item.source.url} target="_blank" rel="noopener noreferrer">{brief.sourcesLabel}: {item.source.label} ↗</a>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="h7-local-foot">
        <a href={brief.marketPath}>{brief.marketLink} →</a>
        <span>{brief.reviewed(LOCAL_MARKET_BRIEF_REVIEWED_AT)}</span>
      </p>
    </section>
  );
}
