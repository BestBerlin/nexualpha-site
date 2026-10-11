import React from "react";
import { collectionHubCopy, collectionHubIndexCopy, factbookHubItems, hubRecordsLocalized, topicHubItems } from "../../data/collection-hubs.js";
import { enAttrs } from "../../utils/fallback-lang.js";
import { localizedHref } from "../../data/locale-routing.js";
import { BrandMark } from "../brand/BrandMark";
import { feeFact } from "../../data/exchange-facts.js";
import { DataRule } from "../shared/DataRule.jsx";
import "./CollectionHubPage.css";

const hasCheckedFees = (slug) => feeFact(slug, "spot").state === "checked" || feeFact(slug, "perp").state === "checked";
const pad2 = (n) => String(n).padStart(2, "0");
// ISO dates keep their digit order inside Arabic text.
const ltr = (value) => <bdi dir="ltr">{value}</bdi>;
const stripBrand = (title) => String(title || "").replace(/\s+[—–-]\s+NexuAlpha$/, "");
// Factbook rows group by venue type in their existing order (consecutive runs only, so the link order never changes).
function groupsOf(items) {
  const out = [];
  for (const item of items) {
    const key = item.category || "other";
    if (!out.length || out[out.length - 1].key !== key) out.push({ key, items: [] });
    out[out.length - 1].items.push(item);
  }
  return out;
}
const latestDate = (items) => items.map((item) => item.checkedOn).filter(Boolean).sort().at(-1) || null;
// Featured factbook records: the most recently fee-checked records with both fee fields checked (registry order breaks ties).
function featuredRecords(items, count = 4) {
  return items
    .map((item, order) => ({ item, order }))
    .filter(({ item }) => item.checkedOn && item.checkedFields === 2)
    .sort((a, b) => b.item.checkedOn.localeCompare(a.item.checkedOn) || a.order - b.order)
    .slice(0, count)
    .map(({ item }) => item);
}

/** Editorial hub index (2026-10-11): featured row, grouped sections with counts and review dates, one link per row. */
export function CollectionHubPage({ kind, locale = "en" }) {
  const copy = collectionHubCopy(kind, locale);
  const ix = collectionHubIndexCopy(locale);
  const items = kind === "factbook" ? factbookHubItems(locale) : topicHubItems(locale);
  // Headings and record rows are localized in all 15 locales (links-l10n lane 2026-10-11); a locale without record
  // copy would keep the English rows, marked as English.
  const recordLang = hubRecordsLocalized(kind, locale) ? undefined : enAttrs(locale);
  const hubDecision = kind === "factbook" ? "factbook_source_record" : "topic_research_path";
  const hubProduct = kind === "factbook" ? "source-review" : "research";
  const href = (path) => localizedHref(path, { locale });

  return <main className="v6 v2-page v3-page collection-hub-page" data-collection-hub={kind}>
    <section className="v2-shell v3-section collection-hub__hero">
      <h1>{copy.title}</h1>
      <p className="v3-section__sub">{copy.description}</p>
      <p className="v3-section__meta">{copy.itemLabel}: {items.length}</p>
      <div className="v3-hero-actions" aria-label={copy.itemLabel}>
        {/* the factbook hero names no venue first (the rows below are the entry points); other hubs keep an outline primary */}
        {kind !== "factbook" && <a
          href={href(copy.primaryHref)}
          className="button-quiet"
          data-cta-kind="research"
          data-cta-placement={`${kind}-collection-hero-primary`}
          data-growth-decision={hubDecision}
          data-growth-placement={`${kind}-collection-hero`}
          data-growth-product={hubProduct}
        >
          {copy.primaryCta}
        </a>}
        <a
          href={href(copy.secondaryHref)}
          className="button-quiet"
          data-cta-kind="research"
          data-cta-placement={`${kind}-collection-hero-secondary`}
          data-growth-decision={kind === "factbook" ? "platform_directory" : "fee_calculator"}
          data-growth-placement={`${kind}-collection-hero`}
          data-growth-product={hubProduct}
        >
          {copy.secondaryCta}
        </a>
      </div>
    </section>
    {kind === "factbook"
      ? <FactbookIndex items={items} copy={copy} ix={ix} href={href} recordLang={recordLang} hubProduct={hubProduct} />
      : <TopicIndex items={items} copy={copy} ix={ix} href={href} recordLang={recordLang} hubProduct={hubProduct} />}
  </main>;
}

function TopicIndex({ items, copy, ix, href, recordLang, hubProduct }) {
  const featured = items.find((item) => item.href === copy.primaryHref) || items[0];
  return <>
    {featured && <section className="v2-shell collection-hub__featured" aria-labelledby="hub-featured-title">
      <DataRule label={ix.featured} stamp={featured.updatedOn ? <>{ix.updated} {ltr(featured.updatedOn)}</> : null} dateTime={featured.updatedOn || undefined} />
      <article className="collection-hub__lead">
        <p className="collection-hub__lead-name" {...recordLang}>{featured.name}</p>
        <h2 className="collection-hub__lead-title" id="hub-featured-title" {...recordLang}>{stripBrand(featured.title)}</h2>
        <p className="collection-hub__lead-desc" {...recordLang}>{featured.description}</p>
        <p className="collection-hub__lead-meta"><span>{ix.platforms(featured.count)}</span></p>
        <a
          href={href(featured.href)}
          className="collection-hub__lead-link"
          data-cta-kind="research"
          data-cta-placement="topics-collection-featured"
          data-growth-decision={featured.slug}
          data-growth-placement="topics-collection-featured"
          data-growth-product={hubProduct}
        >{copy.cardCta} <span aria-hidden="true">→</span></a>
      </article>
    </section>}
    <section className="v2-shell collection-hub__section" aria-labelledby="hub-index-title" data-route-label={copy.itemLabel}>
      <DataRule as="h2" label={copy.itemLabel} labelId="hub-index-title" stamp={ix.records(items.length)} />
      <ol className="collection-hub__rows">
        {items.map((item, index) => (
          <li className="collection-hub__row" key={item.slug} data-hub-row={item.slug}>
            <span className="collection-hub__num" aria-hidden="true">{pad2(index + 1)}</span>
            <div className="collection-hub__main">
              <h3 className="collection-hub__name">
                <a
                  href={href(item.href)}
                  data-cta-kind="research"
                  data-cta-placement="topics-collection-card"
                  data-growth-decision={item.slug}
                  data-growth-placement="topics-collection-card"
                  data-growth-product={hubProduct}
                ><span {...recordLang}>{item.name}</span></a>
              </h3>
              <p className="collection-hub__desc" {...recordLang}>{item.description}</p>
            </div>
            <p className="collection-hub__facts">
              <span>{ix.platforms(item.count)}</span>
              {item.updatedOn && <time dateTime={item.updatedOn}>{ix.updated} {ltr(item.updatedOn)}</time>}
            </p>
            <span className="collection-hub__go" aria-hidden="true">{copy.cardCta} →</span>
          </li>
        ))}
      </ol>
    </section>
  </>;
}

function FactbookIndex({ items, copy, ix, href, recordLang, hubProduct }) {
  const featured = featuredRecords(items);
  const status = (item) => item.checkedOn ? <>{ix.reviewed} {ltr(item.checkedOn)} · {ix.fields(item.checkedFields)}</> : ix.notChecked;
  return <>
    {featured.length > 0 && <section className="v2-shell collection-hub__featured" aria-labelledby="hub-featured-title">
      <DataRule as="h2" label={ix.featured} labelId="hub-featured-title" stamp={latestDate(featured) ? <>{ix.reviewed} {ltr(latestDate(featured))}</> : null} dateTime={latestDate(featured) || undefined} />
      <ul className="collection-hub__tiles">
        {featured.map((item) => (
          <li key={item.slug} className="collection-hub__tile">
            <span className="collection-hub__logo" aria-hidden="true"><BrandMark slug={item.slug} compact /></span>
            <a
              href={href(item.href)}
              data-cta-kind="research"
              data-cta-placement="factbook-collection-featured"
              data-growth-decision={item.slug}
              data-growth-placement="factbook-collection-featured"
              data-growth-product={hubProduct}
            ><span {...recordLang}>{item.title}</span></a>
            <p {...recordLang}>{item.description}</p>
            <time dateTime={item.checkedOn}>{ltr(item.checkedOn)}</time>
          </li>
        ))}
      </ul>
    </section>}
    <div className="v2-shell collection-hub__groups" aria-label={copy.itemLabel} data-route-label={copy.itemLabel}>
      {groupsOf(items).map((group) => {
        const [label, description] = ix.groups[group.key] || [group.key, null];
        const reviewed = latestDate(group.items);
        const headingId = `hub-group-${group.key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        return <section className="collection-hub__section r9-hub-group" key={group.key} data-hub-group={group.key} aria-labelledby={headingId}>
          <DataRule as="h2" label={label} labelId={headingId} stamp={<>{ix.records(group.items.length)}{reviewed ? <> · {ix.reviewed} {ltr(reviewed)}</> : null}</>} />
          {description && <p className="collection-hub__section-desc">{description}</p>}
          <ol className="collection-hub__rows">
            {group.items.map((item) => (
              <li className="collection-hub__row collection-hub__row--record" key={item.slug} data-hub-row={item.slug} data-fees={hasCheckedFees(item.slug) ? "checked" : "pending"}>
                <span className="collection-hub__logo" aria-hidden="true"><BrandMark slug={item.slug} compact /></span>
                <div className="collection-hub__main">
                  <h3 className="collection-hub__name">
                    <a
                      href={href(item.href)}
                      data-cta-kind="research"
                      data-cta-placement="factbook-collection-card"
                      data-growth-decision={item.slug}
                      data-growth-placement="factbook-collection-card"
                      data-growth-product={hubProduct}
                    ><span {...recordLang}>{item.title}</span></a>
                  </h3>
                  <p className="collection-hub__desc" {...recordLang}>{item.description}</p>
                </div>
                <p className="collection-hub__facts">
                  <span data-state={item.checkedOn ? "checked" : "pending"}>{status(item)}</span>
                  {item.officialDomain && <span className="collection-hub__domain" translate="no" lang="en" dir="ltr">{item.officialDomain}</span>}
                </p>
                <span className="collection-hub__go" aria-hidden="true">{copy.cardCta} →</span>
              </li>
            ))}
          </ol>
        </section>;
      })}
    </div>
  </>;
}
