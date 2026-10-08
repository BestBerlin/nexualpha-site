import React from "react";
import { collectionHubCopy, factbookHubItems, topicHubItems } from "../../data/collection-hubs.js";
import { localizedHref } from "../../data/locale-routing.js";
import { BrandMark } from "../brand/BrandMark";
import { feeFact } from "../../data/exchange-facts.js";

const hasCheckedFees = (slug) => feeFact(slug, "spot").state === "checked" || feeFact(slug, "perp").state === "checked";
// Factbook rows group by venue type in their existing order (consecutive runs only, so the link order never changes);
// other hubs stay one list.
function groupsOf(kind, items) {
  if (kind !== "factbook") return [{ key: "all", caption: null, items }];
  const out = [];
  for (const item of items) {
    const key = item.category || "other";
    if (!out.length || out[out.length - 1].key !== key) out.push({ key, caption: item.category || null, items: [] });
    out[out.length - 1].items.push(item);
  }
  return out.length > 1 ? out : [{ key: "all", caption: null, items }];
}

export function CollectionHubPage({ kind, locale = "en" }) {
  const copy = collectionHubCopy(kind, locale);
  const items = kind === "factbook" ? factbookHubItems(locale) : topicHubItems(locale);
  const hubDecision = kind === "factbook" ? "factbook_source_record" : "topic_research_path";
  const hubProduct = kind === "factbook" ? "source-review" : "research";

  return <main className="v6 v2-page v3-page collection-hub-page" data-collection-hub={kind}>
    <section className="v2-shell v3-section">
      <h1>{copy.title}</h1>
      <p className="v3-section__sub">{copy.description}</p>
      <p className="v3-section__meta">{copy.itemLabel}: {items.length}</p>
      <div className="v3-hero-actions" aria-label={copy.itemLabel}>
        {/* the factbook hero names no venue first (the rows below are the entry points); other hubs keep an outline primary */}
        {kind !== "factbook" && <a
          href={localizedHref(copy.primaryHref, { locale })}
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
          href={localizedHref(copy.secondaryHref, { locale })}
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
    <section className="v2-shell v3-section" aria-label={copy.itemLabel} data-route-label={copy.itemLabel}>
      {groupsOf(kind, items).map((group) => <div className="r9-hub-group" key={group.key} data-hub-group={group.key}>
      {group.caption && <p className="r9-hub-group__cap">{group.caption} <span className="v6-num">· {group.items.length}</span></p>}
      <div className="topic-grid">
        {group.items.map((item) => (
          <article className="topic-card" key={item.slug} data-fees={kind === "factbook" ? (hasCheckedFees(item.slug) ? "checked" : "pending") : undefined}>
            {kind === "factbook" ? <span className="topic-card__logo" aria-hidden="true"><BrandMark slug={item.slug} compact /></span> : null}
            <h2><a href={localizedHref(item.href, { locale })}>{item.title}</a></h2>
            <p>{item.description}</p>
            {item.meta ? <p className="v3-section__meta topic-card__facts">{item.meta}</p> : null}
            {item.officialDomain ? <p className="v3-section__meta">{item.officialDomain}</p> : null}
            <a
              href={localizedHref(item.href, { locale })}
              className="button-quiet"
              data-cta-kind="research"
              data-cta-placement={`${kind}-collection-card`}
              data-growth-decision={item.slug}
              data-growth-placement={`${kind}-collection-card`}
              data-growth-product={hubProduct}
            >
              {copy.cardCta} →
            </a>
          </article>
        ))}
      </div>
      </div>)}
    </section>
  </main>;
}
