// Closing band, folded index: the directory facets (same hrefs and labels the hero produced) and the Telegram / Brazil
// routes. Rendered inline on the server; in the browser ClosingBand loads this chunk only when the fold scrolls near,
// because LeanHero and BrazilEntryLink pull the hero and regional route bundles with them (perf lane 2026-10-11).
import { LeanHero } from "../v3/LeanHero";
import { BrazilEntryLink } from "../v3/international/BrazilDecisionPage.jsx";

export function ClosingIndexGroups({ locale = "en", r }) {
  return (
    <div className="crawl-priority-links__groups">
      <LeanHero locale={locale} render={(k) => <>
        <div className="crawl-priority-links__group v6-close__more"><span>{r[2]}</span>{k.pills.map((p) => <a key={p.text} href={p.href}>{p.text}</a>)}</div>
        <div className="crawl-priority-links__group v6-close__more"><span>{r[4]}</span><a href={k.telegram.href} target="_blank" rel="noopener noreferrer">{k.telegram.label}</a><BrazilEntryLink locale={locale} /></div>
      </>} />
    </div>
  );
}
