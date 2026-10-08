import React from "react";
import { collectionHubCopy, factbookHubItems, topicHubItems } from "../../data/collection-hubs.js";
import { localizedHref } from "../../data/locale-routing.js";
import { BrandMark } from "../brand/BrandMark";

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
      <div className="topic-grid">
        {items.map((item) => (
          <article className="topic-card" key={item.slug}>
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
    </section>
  </main>;
}
