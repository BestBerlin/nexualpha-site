import React from "react";
import {
  TOKENIZED_ASSET_CLUSTER_REVIEW_DATE,
  TOKENIZED_ASSET_PAGES,
  tokenizedAssetLocale,
  tokenizedAssetLocalized,
  tokenizedAssetPage,
  tokenizedAssetSources,
} from "../../data/tokenized-assets-cluster.js";
import { localizedHref } from "../../data/locale-routing.js";
import "./tokenized-assets-page.css";

const TOKENIZED_TREASURY_RIGHTS_OPS_ASSET = "https://nexualpha.com/research/wave48-tokenized-treasury-rights-ops.json";
const NEXUALPHA_DATA_LICENSE_URL = "https://nexualpha.com/methodology#data-license";
const WAVE57_TOKENIZED_TREASURY_FINDING = "Wave57 finding: the reviewed tokenized Treasury matrix covers five products across four distinct product types; compare issuer/legal wrapper, recordkeeper, custody, redemption, eligibility jurisdiction and yield basis before comparing yield, token addresses or venue access.";

function pageCopy(locale) {
  return tokenizedAssetLocale(locale) === "zh-Hans"
    ? {
      eyebrow: "TOKENIZED ASSETS · 来源绑定研究集群",
      updated: "最后来源审阅",
      directAnswer: "直接答案",
      decisionTitle: "先分清产品形态，再决定 CTA",
      decisionSubtitle: "同样是“股票”或“美债”敞口，托管、赎回、权益、强平和地区资格可能完全不同。",
      tableUse: "适合研究",
      tableVerify: "必须核对",
      openRoute: "打开研究页",
      sourcesTitle: "官方与第一方来源",
      sourcesLead: "本页只使用监管、发行方、平台或项目方来源，动态收益、规模和资格以源站当前页面为准。",
      clusterTitle: "集群入口",
      factbookTitle: "相关事实库与托管研究",
      researchAssetTitle: "可引用研究数据",
      researchAssetLead: "下载带来源、审阅日期、未知项和限制说明的权利与运营矩阵。引用或发现问题时，可查看方法论并联系编辑团队纠正。",
      researchAssetFinding: "Wave57 发现：当前矩阵覆盖 5 个产品与 4 种不同产品类型。比较收益率、token 地址或平台入口前，应先分开核对发行/法律载体、登记方、托管、赎回、地区资格和收益依据。",
      openDataset: "打开 JSON 数据集",
      openMethodology: "查看研究方法",
      reportCorrection: "提交纠错",
      jumpToResearchAsset: "跳到研究数据与引用入口",
      faqTitle: "AEO 直接问答",
      schemaNotice: "结构化数据已随页面正文输出为 FAQPage、BreadcrumbList 和 CollectionPage。",
    }
    : {
      eyebrow: "TOKENIZED ASSETS · SOURCE-BOUND RESEARCH CLUSTER",
      updated: "Last source review",
      directAnswer: "Direct Answer",
      decisionTitle: "Classify the product before choosing the CTA",
      decisionSubtitle: "The same stock or Treasury exposure can differ by custody, redemption, investor rights, liquidation and regional eligibility.",
      tableUse: "Best used for",
      tableVerify: "Verify first",
      openRoute: "Open research page",
      sourcesTitle: "Official and first-party citations",
      sourcesLead: "This page uses regulatory, issuer, platform or project-owned sources. Dynamic yield, scale and eligibility remain controlled by the current source page.",
      clusterTitle: "Cluster Entries",
      factbookTitle: "Related Factbook and Custody Research",
      researchAssetTitle: "Citation-ready research data",
      researchAssetLead: "Download the rights-and-operations matrix with sources, review dates, unknown fields and limitations. Use the methodology and corrections route when citing or challenging a record.",
      researchAssetFinding: WAVE57_TOKENIZED_TREASURY_FINDING,
      openDataset: "Open JSON dataset",
      openMethodology: "Review methodology",
      reportCorrection: "Report a correction",
      jumpToResearchAsset: "Jump to research data and citation tools",
      faqTitle: "AEO Direct Questions",
      schemaNotice: "The page body emits FAQPage, BreadcrumbList and CollectionPage structured data.",
    };
}

function schemaFor(page, locale, canonicalPath, sources) {
  const canonicalUrl = `https://nexualpha.com${localizedHref(canonicalPath, { locale: tokenizedAssetLocale(locale) })}`;
  const title = tokenizedAssetLocalized(page.metaTitle || page.title, locale);
  const description = tokenizedAssetLocalized(page.description, locale);
  const isTokenizedTreasuries = page.slug === "tokenized-treasuries";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "NexuAlpha", item: "https://nexualpha.com/" },
          { "@type": "ListItem", position: 2, name: tokenizedAssetLocale(locale) === "zh-Hans" ? "主题研究" : "Topic Research", item: "https://nexualpha.com/topics/meme-coins" },
          { "@type": "ListItem", position: 3, name: title, item: canonicalUrl },
        ],
      },
      {
        "@type": "CollectionPage",
        name: title,
        description,
        url: canonicalUrl,
        inLanguage: tokenizedAssetLocale(locale),
        dateModified: TOKENIZED_ASSET_CLUSTER_REVIEW_DATE,
        isBasedOn: sources.map((source) => source.url),
        ...(isTokenizedTreasuries ? {
          subjectOf: {
            "@type": "Dataset",
            name: "Wave48 tokenized Treasury rights and operations",
            url: TOKENIZED_TREASURY_RIGHTS_OPS_ASSET,
            dateModified: "2026-09-16",
            license: NEXUALPHA_DATA_LICENSE_URL,
            abstract: WAVE57_TOKENIZED_TREASURY_FINDING,
            description: `${WAVE57_TOKENIZED_TREASURY_FINDING} Dated source-review matrix; not legal advice, investment advice, live yield data, account eligibility, signup eligibility, registration outcome, ownership guarantee or redemption guarantee.`,
            conditionsOfAccess: "Dated source-review matrix; not legal advice, investment advice, live yield data, account eligibility, signup eligibility, registration outcome, ownership guarantee or redemption guarantee.",
          },
        } : {}),
        mainEntity: {
          "@type": "ItemList",
          itemListElement: page.decisionRows.map((row, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: tokenizedAssetLocalized(row.label, locale),
            description: tokenizedAssetLocalized(row.verify, locale),
            url: row.route ? `https://nexualpha.com${localizedHref(row.route, { locale: tokenizedAssetLocale(locale) })}` : canonicalUrl,
          })),
        },
        relatedLink: [
          ...page.relatedLinks.map((href) => `https://nexualpha.com${href}`),
          ...(isTokenizedTreasuries ? [TOKENIZED_TREASURY_RIGHTS_OPS_ASSET] : []),
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: page.faqs.map((faq) => ({
          "@type": "Question",
          name: tokenizedAssetLocalized(faq.q, locale),
          acceptedAnswer: {
            "@type": "Answer",
            text: tokenizedAssetLocalized(faq.a, locale),
            citation: sources.slice(0, 3).map((source) => source.url),
          },
        })),
      },
    ],
  };
}

export function TokenizedAssetsPage({ slug = "tokenized-assets", locale = "en" }) {
  const page = tokenizedAssetPage(slug) || tokenizedAssetPage("tokenized-assets");
  const resolvedLocale = tokenizedAssetLocale(locale);
  const copy = pageCopy(resolvedLocale);
  const sources = tokenizedAssetSources(page);
  const schema = schemaFor(page, resolvedLocale, page.path, sources);
  const siblings = Object.values(TOKENIZED_ASSET_PAGES);
  const factbookLinks = page.relatedLinks.filter((href) => href.startsWith("/factbook") || href === "/methodology" || href.startsWith("/compare"));
  const primaryNextAction = page.nextAction;

  return (
    <main className="tokenized-assets-page v2-page" id="top">
      <script type="application/ld+json" data-nexualpha-tokenized-schema dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="tokenized-assets-hero v2-shell">
        <span className="v3-independent-badge">{copy.eyebrow}</span>
        <p className="tokenized-assets-hero__date">{copy.updated}: {TOKENIZED_ASSET_CLUSTER_REVIEW_DATE}</p>
        <h1>{tokenizedAssetLocalized(page.title, resolvedLocale)}</h1>
        <p className="tokenized-assets-hero__lead">{tokenizedAssetLocalized(page.description, resolvedLocale)}</p>
        <div className="tokenized-assets-answer" aria-label={copy.directAnswer}>
          <strong>{copy.directAnswer}</strong>
          <p>{tokenizedAssetLocalized(page.directAnswer, resolvedLocale)}</p>
        </div>
        {primaryNextAction ? (
          <a
            className="tokenized-assets-hero__primary-action"
            href={localizedHref(primaryNextAction.href, { locale: resolvedLocale })}
            data-cta-kind="research"
            data-cta-placement="tokenized-assets-primary-next-action"
          >
            {tokenizedAssetLocalized(primaryNextAction.label, resolvedLocale)} →
          </a>
        ) : null}
        {page.slug === "tokenized-treasuries" ? (
          <a className="tokenized-assets-hero__research-jump" href="#tokenized-treasury-research-asset-title">
            {copy.jumpToResearchAsset} ↓
          </a>
        ) : null}
      </section>

      <section className="tokenized-assets-section v2-shell">
        <div className="tokenized-assets-section__heading">
          <span>{copy.decisionTitle}</span>
          <p>{copy.decisionSubtitle}</p>
        </div>
        <div className="tokenized-assets-table" role="table" aria-label={copy.decisionTitle}>
          <div role="row" className="tokenized-assets-table__head">
            <span role="columnheader">{resolvedLocale === "zh-Hans" ? "路径" : "Route"}</span>
            <span role="columnheader">{copy.tableUse}</span>
            <span role="columnheader">{copy.tableVerify}</span>
          </div>
          {page.decisionRows.map((row) => (
            <div role="row" className="tokenized-assets-table__row" key={tokenizedAssetLocalized(row.label, resolvedLocale)}>
              <span role="cell">
                <strong>{tokenizedAssetLocalized(row.label, resolvedLocale)}</strong>
                {row.route ? <a href={localizedHref(row.route, { locale: resolvedLocale })}>{copy.openRoute}</a> : null}
              </span>
              <span role="cell">{tokenizedAssetLocalized(row.bestFor, resolvedLocale)}</span>
              <span role="cell">{tokenizedAssetLocalized(row.verify, resolvedLocale)}</span>
            </div>
          ))}
        </div>
      </section>

      {page.slug === "tokenized-treasuries" ? (
        <section className="tokenized-assets-section v2-shell" aria-labelledby="tokenized-treasury-research-asset-title">
          <div className="tokenized-assets-research-asset">
            <div className="tokenized-assets-section__heading">
              <span id="tokenized-treasury-research-asset-title">{copy.researchAssetTitle}</span>
              <p>{copy.researchAssetLead}</p>
            </div>
            <div className="tokenized-assets-answer tokenized-assets-answer--compact">
              <strong>{resolvedLocale === "zh-Hans" ? "可引用发现 · 2026-09-16" : "Citation-ready finding · 2026-09-16"}</strong>
              <p>{copy.researchAssetFinding}</p>
            </div>
            <nav className="tokenized-assets-factbook" aria-label={copy.researchAssetTitle}>
              <a href={TOKENIZED_TREASURY_RIGHTS_OPS_ASSET}>{copy.openDataset}</a>
              <a href={localizedHref("/methodology", { locale: resolvedLocale })}>{copy.openMethodology}</a>
              <a href="mailto:contact@nexualpha.com?subject=NexuAlpha%20tokenized%20Treasury%20dataset%20correction">{copy.reportCorrection}</a>
            </nav>
          </div>
        </section>
      ) : null}

      <section className="tokenized-assets-section v2-shell tokenized-assets-grid">
        <div>
          <div className="tokenized-assets-section__heading">
            <span>{copy.clusterTitle}</span>
            <p>{resolvedLocale === "zh-Hans" ? "父主题和两个子主题保持互相引用，方便搜索和 AI 引擎理解集群关系。" : "The parent and two child pages cross-link so search and AI systems can parse the cluster relationship."}</p>
          </div>
          <div className="tokenized-assets-link-list">
            {siblings.map((item) => (
              <a key={item.slug} href={localizedHref(item.path, { locale: resolvedLocale })} aria-current={item.slug === page.slug ? "page" : undefined}>
                <strong>{tokenizedAssetLocalized(item.title, resolvedLocale)}</strong>
                <span>{tokenizedAssetLocalized(item.description, resolvedLocale)}</span>
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="tokenized-assets-section__heading">
            <span>{copy.factbookTitle}</span>
            <p>{resolvedLocale === "zh-Hans" ? "在开户或跳转前，先用事实库确认官方域名、产品范围和托管/衍生品边界。" : "Before signup or outbound routing, use Factbook to verify official domains, product scope and custody or derivative boundaries."}</p>
          </div>
          <div className="tokenized-assets-factbook">
            {factbookLinks.map((href) => (
              <a key={href} href={localizedHref(href, { locale: resolvedLocale })}>{href.replace("/", "").replaceAll("/", " / ")}</a>
            ))}
          </div>
        </div>
      </section>

      <section className="tokenized-assets-section v2-shell tokenized-assets-grid">
        <div>
          <div className="tokenized-assets-section__heading">
            <span>{copy.faqTitle}</span>
            <p>{copy.schemaNotice}</p>
          </div>
          <div className="tokenized-assets-faq">
            {page.faqs.map((faq, index) => (
              <details key={tokenizedAssetLocalized(faq.q, resolvedLocale)} open={index < 2}>
                <summary>{tokenizedAssetLocalized(faq.q, resolvedLocale)}</summary>
                <p>{tokenizedAssetLocalized(faq.a, resolvedLocale)}</p>
              </details>
            ))}
          </div>
        </div>
        <div>
          <div className="tokenized-assets-section__heading">
            <span>{copy.sourcesTitle}</span>
            <p>{copy.sourcesLead}</p>
          </div>
          <div className="tokenized-assets-sources">
            {sources.map((source) => (
              <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                <strong>{source.name}</strong>
                <span>{tokenizedAssetLocalized(source.role, resolvedLocale)}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
