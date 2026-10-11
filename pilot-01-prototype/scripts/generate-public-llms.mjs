import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { FACTBOOK_REGISTRY, FACTBOOK_SLUGS, AUDIT_DATE, generateLlmMarkdown } from "../src/data/factbook-registry.js";
import { INTERNATIONAL_SOURCE_REVIEWED_AT, internationalSourceRegistry } from "../src/data/international-source-registry.js";
import { getBrazilPage, BRAZIL_SOURCES } from "../src/data/brazil-market.js";
import { AEO_QUESTION_REGISTRY, AEO_QUESTION_REVIEWED_AT } from "../src/data/aeo-question-registry.js";
import { priorityVenueAnswerFor } from "../src/data/priority-venue-answers.js";
import { researchForVenue } from "../src/data/exchange-research.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { localizedValue, normalizeNewsFeed } from "../src/data/news-feed-client.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { brandSlogan } from "../src/data/brand-slogan.js";
import { buildPartnersFeed } from "../src/data/partners-feed.js";
import { compareDirectAnswerFor } from "../src/data/compare-direct-answers.js";
import { topicReviewedFaqRecords } from "../src/data/topic-reviewed-faqs.js";
import { TOPIC_GUIDES } from "../src/data/topic-guides-data.js";
import { retainRetrievalNews } from "./retrieval-news-policy.mjs";
import { INDEXABLE_LOCALES, routeInventory } from "./generate-prerender-manifest.mjs";
import {
  SEARCH_PUBLICATION_VERSION,
  buildSearchPublicationReport,
  loadSearchPublicationBaseline,
  selectPublicationNewsArticles,
  selectSitemapPublicationEntries,
} from "./sitemap-publication-policy.mjs";

const root = process.env.NEXUALPHA_LLMS_OUTPUT_DIR
  ? new URL(`${pathToFileURL(process.env.NEXUALPHA_LLMS_OUTPUT_DIR).href.replace(/\/?$/, "/")}`)
  : new URL("../public/", import.meta.url);
const PUBLIC_ORIGIN = "https://nexualpha.com";
const TECHNICAL_INDEX_AUDIT_DATE = "2026-09-21";
const PUBLIC_LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"];
const REGIONAL_FUNDING_MATRIX_REVIEWED_AT = "2026-09-15";
const REGIONAL_FUNDING_MATRIX_COVERAGE = "Reviewed funding checklist rows currently cover BR, MX, TW, ID, EU, UK, US, JP, HK, KR, SG and TR; every rail and account outcome still requires confirmation in the official logged-in account flow.";
const REGIONAL_FUNDING_MATRIX_LIMITATIONS = "The matrix is a dated research checklist, not a live-rate feed, account approval decision, funding availability promise, product-access promise, user-benefit promise or registration outcome.";
const WAVE48_ASSET_LIMITATIONS = "These assets are dated source-review snapshots, not live rates, live yield, trading recommendations, legal advice, account eligibility decisions, registration outcomes, ownership guarantees or referral routes.";
const WAVE56_PERP_DEX_FINDING = "Finding: across Hyperliquid, dYdX, GMX and Aevo, all 24 required venue-field records are source-backed as known, but Perp DEX cost review still requires the full fee, funding, collateral, margin, oracle and liquidation stack rather than a single static fee or live funding quote.";
const WAVE57_TOKENIZED_TREASURY_FINDING = "Finding: the reviewed tokenized Treasury matrix covers five products across four distinct product types; compare issuer/legal wrapper, recordkeeper, custody, redemption, eligibility jurisdiction and yield basis before comparing yield, token addresses or venue access.";
const allNewsArticles = normalizeNewsFeed(JSON.parse(await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8")));
const newsPublication = selectSitemapPublicationEntries(routeInventory(allNewsArticles), allNewsArticles, {
  policy: loadSearchPublicationBaseline(),
  allLocales: INDEXABLE_LOCALES,
});
const newsPublicationReport = buildSearchPublicationReport(newsPublication);
const newsFeed = selectPublicationNewsArticles(allNewsArticles, newsPublication);
const RETRIEVAL_PRIORITY_NEWS_SLUGS = Object.freeze([
  "binance-okx-proof-of-reserves-disclosure-audit",
  "bybit-vs-okx-subaccounts-risk-isolation-api-controls",
  "coinbase-address-allowlist-setup-network-hold-tutorial",
  "how-to-set-up-binance-anti-phishing-code",
  "jupiter-vs-raydium-solana-swap-routing-execution-controls",
  "verify-official-crypto-exchange-website",
]);
const retrievalNewsFeed = [
  ...newsFeed,
  ...RETRIEVAL_PRIORITY_NEWS_SLUGS
    .map((slug) => allNewsArticles.find((article) => article.slug === slug))
    .filter((article) => retainRetrievalNews(article, newsPublicationReport.historicalIndexedUrlDispositions)
      && !newsFeed.some((entry) => entry.slug === article.slug)),
];

function directAnswer(article) {
  const content = localizedValue(article.content, "en");
  const match = content.match(/^##\s+Direct answer\s*\n+([\s\S]*?)(?=\n\n|$)/im);
  return (match?.[1] || localizedValue(article.summary, "en"))
    .replace(/^#+\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

const sourceLines = Object.entries(internationalSourceRegistry).flatMap(([market, pack]) => [
  `### ${market} — ${pack.authority}`,
  ...(pack.sources.length ? pack.sources.flatMap((item) => [
    `- [${item.label}](${item.url}) — ${item.role}; ${item.note}`,
  ]) : ["- No authority source pack selected for this market."]),
]);

// What the site is, in one sentence that starts with brand slogan A (SEO audit 2026-10-11 #9, owner-approved): independent
// exchange research with disclosed partner links and invite codes. The old text called the site a "neutral directory"
// and said referral codes were omitted, the opposite of what the venue pages say.
const SITE_SUMMARY = `${brandSlogan("en").replace(/[.。]\s*$/, "")}: NexuAlpha is independent crypto exchange research that checks trading fees, official domains and sign-up routes against each exchange's own sources, with disclosed partner links and invite codes.`;
// Same sentence as the site's registration-card and footer disclosure (src/components/v3/RegistrationCard.jsx disclosureShort).
const COMMISSION_DISCLOSURE = "Partner links may earn NexuAlpha a platform-paid commission at no extra cost to you.";
const partnersFeed = buildPartnersFeed();
const percent = (share) => `${Math.round(Number(share) * 100)}%`;
const partnerFactLines = partnersFeed.partners.filter((partner) => partner.inviteCode).map((partner) => {
  const share = Number.isFinite(partner.share) && partner.share > 0
    ? `up to ${percent(partner.share)} of trading fees returned${partner.settle ? `, settled ${partner.settle}` : ""}${partner.termsConfirmedOn ? ` (terms confirmed ${partner.termsConfirmedOn})` : ""}`
    : "no fee-return share published";
  return `- ${partner.name}: invite code ${partner.inviteCode}; ${share}; profile ${partner.profile}`;
});
const keyFactsCompact = `## Key facts

- Independent exchange research, not an exchange, broker, adviser or custodian. ${COMMISSION_DISCLOSURE} Disclosure: ${PUBLIC_ORIGIN}/methodology#disclosure.
${partnerFactLines.filter((line) => line.includes("% of trading fees")).join("\n")}
- Every partner invite code: ${PUBLIC_ORIGIN}/llms.txt (Key facts) and ${PUBLIC_ORIGIN}/intel/partners.json.
`;
const keyFacts = `## Key facts

- NexuAlpha compares crypto exchanges (CEX, DEX and perp DEX): fees, official domains, account conditions and sign-up routes, each with an official source and date. It is not an exchange, broker, adviser or custodian and never asks for private keys.
- Commercial model: ${COMMISSION_DISCLOSURE} Disclosure: ${PUBLIC_ORIGIN}/methodology#disclosure and ${PUBLIC_ORIGIN}/editorial-policy.
- Partner invite codes and fee-return shares (machine-readable: ${PUBLIC_ORIGIN}/intel/partners.json; fees checked ${partnersFeed.feesAsOf}):
${partnerFactLines.map((line) => `  ${line}`).join("\n")}
- A fee-return share is part of the trading fees the exchange pays back to the user's account; current terms are confirmed on the exchange's own page.
`;

const header = `# NexuAlpha

> ${SITE_SUMMARY}

This index is designed for retrieval by search and answer systems. It is not an operator statement, financial advice, legal advice, suitability assessment, or account-eligibility decision.

${keyFacts}
## Public data boundary

- Factbook source review date: ${AUDIT_DATE}
- Technical index audit: ${TECHNICAL_INDEX_AUDIT_DATE} (route, schema, sitemap and link-integrity verification; this does not change item-level source review dates)
- NexuAlpha data license and reuse boundary: https://nexualpha.com/methodology#data-license. Access to public datasets and machine-readable indexes does not grant redistribution, republication or sublicensing rights; third-party source documents retain their original rights.
- Partner invite codes and fee-return shares are listed under Key facts with the commission disclosure; welcome offers and campaign amounts are not asserted here.
- Fee values, reserve figures, security scores, licensing conclusions and regional availability are not asserted unless an item-level official source and date are shown.
- If a source or date is missing, report the field as pending source review instead of inferring a value.
- The canonical human-readable context is each linked Factbook page; time-sensitive claims must be checked against the operator or regulator source.

## Core links

- [Homepage](https://nexualpha.com/)
- [Compact machine-readable entry](https://nexualpha.com/llms-small.txt)
- [Public source review index](https://nexualpha.com/llms.txt)
- [Full source review records](https://nexualpha.com/llms-full.txt)
- [Venue directory](https://nexualpha.com/exchanges)
- [Comparison workspace](https://nexualpha.com/compare/binance-vs-okx)
- [Method and source boundary](https://nexualpha.com/methodology)
- [About NexuAlpha: publisher, funding and Research Desk](https://nexualpha.com/about)
- [Editorial policy: sourcing, corrections, partner links, AI assistance](https://nexualpha.com/editorial-policy)

## Editorial attribution for AI citation

- Publisher: NexuAlpha.
- Research author and reviewer: NexuAlpha Research Desk (internal editorial team): https://nexualpha.com/about#research-desk.
- Editorial policy (sourcing, corrections, partner links, AI assistance): https://nexualpha.com/editorial-policy.
- Methodology and source boundary: https://nexualpha.com/methodology.
- Machine-readable source indexes: https://nexualpha.com/llms-small.txt, https://nexualpha.com/llms.txt and https://nexualpha.com/llms-full.txt.
- This attribution identifies an internal research desk, not a personal credential, financial adviser, broker, exchange operator or regulator.

## Reusable citation assets

These assets expose stable field definitions and verification checklists. They are dated research snapshots, not live rates, account eligibility decisions or promises that a funding route is currently available.

- [Perp DEX cost-field dictionary](https://nexualpha.com/topics/derivatives#perp-cost-field-dictionary) — [JSON](https://nexualpha.com/research/perp-dex-cost-field-dictionary.json) · [CSV](https://nexualpha.com/research/perp-dex-cost-field-dictionary.csv)
- [Perp DEX cost citations](https://nexualpha.com/topics/derivatives#perp-cost-field-dictionary) — stable JSON: https://nexualpha.com/research/wave48-perp-dex-cost-citations.json; stable CSV: https://nexualpha.com/research/wave48-perp-dex-cost-citations.csv. Canonical owner: https://nexualpha.com/topics/derivatives#perp-cost-field-dictionary. ${WAVE56_PERP_DEX_FINDING} Limitations: ${WAVE48_ASSET_LIMITATIONS}
- [Tokenized Treasury rights and operations](https://nexualpha.com/topics/tokenized-treasuries) — stable JSON: https://nexualpha.com/research/wave48-tokenized-treasury-rights-ops.json. Canonical owner: https://nexualpha.com/topics/tokenized-treasuries. ${WAVE57_TOKENIZED_TREASURY_FINDING} Limitations: ${WAVE48_ASSET_LIMITATIONS}
- [Regional funding verification matrix](https://nexualpha.com/br/pix#regional-funding-verification-matrix) — Dataset reviewed: ${REGIONAL_FUNDING_MATRIX_REVIEWED_AT}; stable JSON: https://nexualpha.com/research/regional-funding-verification-matrix.json; stable CSV: https://nexualpha.com/research/regional-funding-verification-matrix.csv. Coverage: ${REGIONAL_FUNDING_MATRIX_COVERAGE} Limitations: ${REGIONAL_FUNDING_MATRIX_LIMITATIONS}

## Language and regional entry points

The same research boundary is available in these UI languages. Locale pages are presentation variants; they do not change eligibility or commercial claims.

${PUBLIC_LOCALES.map((locale) => `- [${locale} homepage](https://nexualpha.com${localizedPath("/", locale)})`).join("\n")}

- [Brazil BRL and Pix decision path](https://nexualpha.com/br)
- [Mexico research path](https://nexualpha.com/mx)
- [Taiwan FSC, VASP-registration and TWD account-check owner page](https://nexualpha.com/tw)
- [Indonesia OJK/Bappebti, IDR VA and QRIS account-check owner page](https://nexualpha.com/id)
- [Hong Kong research path](https://nexualpha.com/hk)
- [EU research path](https://nexualpha.com/eu)
- [UK research path](https://nexualpha.com/uk)
- [United States research path](https://nexualpha.com/us)
- [Japan research path](https://nexualpha.com/jp?locale=ja)
- [Korea research path](https://nexualpha.com/kr?locale=ko)
- [Türkiye research path](https://nexualpha.com/tr/markets/turkiye)

## Venue source-review pages

`;

const venueLinks = FACTBOOK_SLUGS.map((slug) => {
  const venue = FACTBOOK_REGISTRY[slug];
  return `- [${venue.name} source review](https://nexualpha.com/factbook/${slug}) — ${venue.category}; official discovery domain: https://${venue.officialDomain}`;
}).join("\n");

const canonicalVenueDetailSlugs = ["binance", "okx", "bybit", "bitget", "hyperliquid", "uniswap", "gmx"];
const canonicalVenueDetailLines = canonicalVenueDetailSlugs.map((slug) => {
  const venue = FACTBOOK_REGISTRY[slug];
  const research = researchForVenue(slug, "en");
  const seo = computeRouteSeo({ url: `/exchanges/${slug}`, locale: "en" });
  const sourceUrls = research?.sources?.map((source) => source.url).filter(Boolean) ?? [];
  const sourceSummary = research
    ? `${research.summary} Source-bound checks: ${research.facts.map((fact) => `${fact.label}: ${fact.value}`).join(" ")}`
    : "Source-bound venue research is pending item-level review.";
  const sourceSuffix = sourceUrls.length
    ? ` Sources: ${sourceUrls.map((url) => `[source](${url})`).join(", ")}.`
    : " Sources pending item-level review.";
  return `- [${venue.name} venue detail](${seo.canonical}) — ${venue.name} source review; ${sourceSummary} Boundary: verify fees, account permissions, regional availability and campaign terms in the official account flow before acting.${sourceSuffix}`;
}).join("\n");
const canonicalVenueDetails = `\n\n## Source-backed venue detail canonicals\n\nThese are existing English venue-detail pages with source-bounded summaries. Partner venues show their invite code and fee-return share next to the commission disclosure (see Key facts); nothing here promises registration, fees, account eligibility or execution quality.\n\n${canonicalVenueDetailLines}\n`;

const SUPPORT_OWNER_COMPARE_SLUGS = ["hyperliquid-vs-dydx", "uniswap-vs-jupiter"];
const supportOwnerCompareLines = SUPPORT_OWNER_COMPARE_SLUGS.map((slug) => {
  const answer = compareDirectAnswerFor(slug, "en");
  const seo = computeRouteSeo({ url: `/compare/${slug}`, locale: "en" });
  if (!answer || seo.robots !== "index,follow") return null;
  const primaryNextStep = answer.primaryNextAction ? `${answer.primaryNextAction[0]}: ${PUBLIC_ORIGIN}${answer.primaryNextAction[1]}` : "Primary next step pending source review.";
  const limitations = answer.boundary || "Limitations pending source review.";
  const sourceLinks = answer.sourceLinks?.map(([label, href]) => `[${label}](${href})`).join(", ") || "Sources pending item-level review.";
  const internalLinks = answer.internalLinks?.map(([label, href]) => `[${label}](${PUBLIC_ORIGIN}${href})`).join(", ") || "Internal support links pending source review.";
  return `### ${answer.title}\n\n- Canonical: ${seo.canonical}\n- Robots: ${seo.robots}\n- Reviewed: ${answer.reviewedAt}\n- Support-owner answer: ${answer.body}\n- Primary next step: ${primaryNextStep}\n- Limitations: ${limitations}\n- Internal support links: ${internalLinks}\n- Sources: ${sourceLinks}`;
}).filter(Boolean).join("\n\n");
const supportOwnerComparisons = `\n\n## Support-owner comparison records\n\nThese support records mirror visible comparison-page direct-answer content. They do not promise route execution, trading outcomes, account eligibility or user benefits.\n\n${supportOwnerCompareLines}\n`;

const international = `\n\n## International authority source packs\n\nThese links are research aids for jurisdiction-specific review. They do not decide whether a user or product is eligible in a market. Source pack review date: ${INTERNATIONAL_SOURCE_REVIEWED_AT}.\n\n${sourceLines.join("\n")}\n`;

const questionLines = AEO_QUESTION_REGISTRY.map((item) => {
  const sources = item.sourceUrls.length ? item.sourceUrls.map((url) => `[source](${url})`).join(", ") : "no source selected; pending source review";
  return `- **${item.market} / ${item.locale} / ${item.intent}** — ${item.question} — canonical: https://nexualpha.com${item.canonicalPath}; status: ${item.status}; answer boundary: ${item.answerBoundary}; ${sources}`;
}).join("\n");
const questionInventory = `\n\n## Retrieval question inventory\n\nThis is a reviewed question backlog for answer and search systems, not a set of eligibility or promotion claims. Review date: ${AEO_QUESTION_REVIEWED_AT}.\n\n${questionLines}\n`;

const PRIORITY_AEO_ENTRY_IDS = Object.freeze([
  "hk-sfc-platform-status-zh-hant",
  "hk-hkd-edda-bank-zh-hant",
  "hk-proof-address-product-scope-zh-hant",
  "tw-fsc-act-effective-boundary",
  "tw-fsc-aml-registration-list",
  "id-va-qris-route",
  "id-account-stage",
  "eu-mica-register",
  "uk-fca-register",
  "us-fincen-msb-non-endorsement",
  "jp-fsa-register",
  "kr-regulatory-context",
  "tr-spk-register",
  "br-pix-deposit",
  "hyperliquid-fees-before-trading",
  "uniswap-token-router-permit2-spender",
  "bybit-bitget-stock-exposure-boundary",
  "tokenized-treasury-legal-claim",
]);
const priorityAeoEntries = PRIORITY_AEO_ENTRY_IDS.map((id) => AEO_QUESTION_REGISTRY.find((item) => item.id === id)).filter(Boolean);
const compactPriorityAeoEntries = [
  ...priorityAeoEntries.slice(0, 6),
  priorityAeoEntries.find((item) => item.id === "tr-spk-register"),
].filter(Boolean);
const priorityAnswerMapLines = priorityAeoEntries.map((item) => {
  const canonical = `${PUBLIC_ORIGIN}${item.canonicalPath}`;
  return `- ${item.market} / ${item.intent}: ${item.question} — answer route: ${canonical}; source status: ${item.status}; boundary: ${item.answerBoundary}`;
}).join("\n");
const priorityAnswerMap = `\n\n## Priority answer map\n\nThese high-intent question routes help answer systems choose the canonical NexuAlpha page before summarizing. They are not eligibility, registration, reward or trading recommendations.\n\n${priorityAnswerMapLines}\n`;

const reviewedNewsIndex = `\n\n## Reviewed news article answers\n\nThese public articles expose a direct answer, editorial attribution, publication dates and item-level source links. They remain dated research and do not prove current account eligibility, live fees, user benefits or outcomes.\n\n- Search publication version: ${SEARCH_PUBLICATION_VERSION}; sitemap URLs: ${newsPublicationReport.totalUrls}; query-locale URLs: ${newsPublicationReport.queryLocaleUrls}; published article canonicals: ${newsPublicationReport.articleSlugs.length}.\n\n${retrievalNewsFeed.map((article) => `- [${localizedValue(article.title, "en")}](https://nexualpha.com/news/${article.slug}) — author: ${article.author}; published: ${article.publishedAt}; updated: ${article.updatedAt || article.publishedAt}; direct answer: ${directAnswer(article)}; official/source citations: ${article.sources.length}.`).join("\n")}\n`;

const reviewedNewsFull = `\n\n## Reviewed news source records\n\n${retrievalNewsFeed.map((article) => `### ${localizedValue(article.title, "en")}\n\n- Canonical: https://nexualpha.com/news/${article.slug}\n- Author: ${article.author}\n- Published: ${article.publishedAt}\n- Updated: ${article.updatedAt || article.publishedAt}\n- Direct answer: ${directAnswer(article)}\n- Sources:\n${article.sources.map((source) => `  - [${source.publisher}: ${source.title}](${source.url})`).join("\n")}`).join("\n\n")}\n`;

const pixRecipientQuestion = AEO_QUESTION_REGISTRY.find((item) => item.id === "br-pix-recipient-check");
const pixRecipientPage = getBrazilPage("/br/pix");
const pixRecipientFaq = pixRecipientPage.faq.find((item) => item.question === pixRecipientQuestion.question);
const pixRecipientSource = BRAZIL_SOURCES.find((item) => item.id === "okx-brl-pix-deposit");
if (!pixRecipientFaq || !pixRecipientPage.sourceIds.includes(pixRecipientSource.id)) {
  throw new Error("Pix recipient retrieval record must mirror the visible source-linked FAQ");
}
const pixRecipientRecord = `\n\n## Brazil Pix recipient verification\n\n- Canonical: ${PUBLIC_ORIGIN}/br/pix\n- Language: pt-BR\n- Reviewed: ${pixRecipientQuestion.reviewedAt}\n- Question: ${pixRecipientFaq.question}\n- Direct answer: ${pixRecipientFaq.answer}\n- Source: [${pixRecipientSource.title}](${pixRecipientSource.url})\n- Boundary: ${pixRecipientQuestion.answerBoundary}\n`;

const uniswapAffiliateRecords = `\n\n## Uniswap affiliate search boundary\n` + ["en", "zh-Hans", "zh-Hant"].map((locale) => {
  const entry = AEO_QUESTION_REGISTRY.find((item) => item.id === `uniswap-affiliate-boundary-${locale}`);
  const visibleFaq = priorityVenueAnswerFor("uniswap", locale)?.faq.find(([question]) => question === entry?.question);
  if (!entry || !visibleFaq || JSON.stringify(entry.sourceUrls) !== JSON.stringify(visibleFaq[2])) {
    throw new Error(`Uniswap affiliate retrieval record must mirror visible FAQ: ${locale}`);
  }
  return `\n\n### ${visibleFaq[0]}\n\n- Canonical: ${PUBLIC_ORIGIN}${entry.canonicalPath}\n- Language: ${locale}\n- Reviewed: ${entry.reviewedAt}\n- Direct answer: ${visibleFaq[1]}\n- Sources: ${visibleFaq[2].join("; ")}\n- Boundary: ${entry.answerBoundary}\n`;
}).join("");

const compliantQuestionIds = ["compliant-fiat-name-match", "compliant-hashkey-onboarding", "compliant-okx-freeze-terms"];
const compliantFundingRecords = "\n\n## Fiat funding and account-condition checklist\n" + ["en", "zh-Hans", "zh-Hant"].map(locale => {
  const fields = locale === "en" ? ["qEn", "aEn"] : locale === "zh-Hans" ? ["qZh", "aZh"] : ["qHant", "aHant"];
  return compliantQuestionIds.map((id, index) => {
    const entry = AEO_QUESTION_REGISTRY.find(item => item.id === id);
    const faq = TOPIC_GUIDES["compliant-exchanges"]?.faqs?.[index];
    if (!entry || !faq?.[fields[0]] || !faq?.[fields[1]] || entry.question !== faq.qEn || entry.canonicalPath !== "/topics/compliant-exchanges" || JSON.stringify(entry.sourceUrls) !== JSON.stringify(faq.sources?.map(source => source.url))) {
      throw new Error(`Compliant retrieval record must mirror visible FAQ: ${id}/${locale}`);
    }
    const sources = faq.sources.map(source => {
      if (!source.label || !source.url || !source.reviewedAt || !source.updatedAt || !Number.isFinite(Date.parse(source.reviewedAt)) || !Number.isFinite(Date.parse(source.updatedAt))) {
        throw new Error(`Compliant retrieval source requires item-level dates: ${id}/${locale}`);
      }
      return `  - [${source.label}](${source.url}) — reviewed: ${source.reviewedAt}; document updated: ${source.updatedAt}`;
    }).join("\n");
    return `\n### ${faq[fields[0]]}\n\n- Canonical: ${PUBLIC_ORIGIN}${localizedPath(entry.canonicalPath, locale)}\n- Language: ${locale}\n- Direct answer: ${faq[fields[1]]}\n- Sources:\n${sources}\n- Boundary: ${entry.answerBoundary}\n`;
  }).join("\n");
}).join("\n");

const reviewedTopicRecords = "\n\n## Source-bound topic decision answers\n" + ['meme-coins','derivatives','no-kyc'].map(slug => ['en','zh-Hans','zh-Hant'].map(locale => topicReviewedFaqRecords(slug,locale).map(record => {
  const entry=AEO_QUESTION_REGISTRY.find(item=>item.id===record.id);
  const english=topicReviewedFaqRecords(slug,'en').find(item=>item.id===record.id);
  if(!entry || entry.question!==english.question || entry.canonicalPath!=='/topics/'+slug || JSON.stringify(entry.sourceUrls)!==JSON.stringify(record.sources.map(source=>source.url))) throw new Error('Reviewed topic retrieval contract mismatch: '+record.id+'/'+locale);
  const sources=record.sources.map(source=>`  - [${source.label}](${source.url}) — reviewed: ${source.reviewedAt}; document updated: ${source.updatedAt ?? 'not stated'}`).join("\n");
  return `\n### ${record.question}\n\n- Canonical: ${PUBLIC_ORIGIN}${localizedPath(entry.canonicalPath,locale)}\n- Language: ${locale}\n- Direct answer: ${record.answer}\n- Sources:\n${sources}\n- Boundary: ${record.answerBoundary}\n`;
}).join("\n")).join("\n")).join("\n");

const full = `${header}${venueLinks}${canonicalVenueDetails}${supportOwnerComparisons}${international}${questionInventory}${priorityAnswerMap}${pixRecipientRecord}${uniswapAffiliateRecords}${compliantFundingRecords}${reviewedTopicRecords}${reviewedNewsIndex}${reviewedNewsFull}\n\n## Detailed venue records\n\n${FACTBOOK_SLUGS.map((slug) => generateLlmMarkdown(FACTBOOK_REGISTRY[slug])).join("\n\n")}`;

const llms = `${header}${venueLinks}${canonicalVenueDetails}${supportOwnerComparisons}${international}${questionInventory}${priorityAnswerMap}${compliantFundingRecords}${reviewedTopicRecords}${reviewedNewsIndex}`;
const small = `# NexuAlpha

> ${SITE_SUMMARY}

This compact entry helps answer systems and users compare CEX, DEX and Perp DEX options, verify official destination domains, and find source-bounded pages before leaving NexuAlpha.

${keyFactsCompact}
## Canonical machine-readable files

- Compact entry: https://nexualpha.com/llms-small.txt
- Public source review index: https://nexualpha.com/llms.txt
- Full source review records: https://nexualpha.com/llms-full.txt

## Core human pages

- Homepage: https://nexualpha.com/
- Venue directory: https://nexualpha.com/exchanges
- Comparison workspace: https://nexualpha.com/compare/binance-vs-okx
- Methodology and source boundary: https://nexualpha.com/methodology
- About the publisher and the Research Desk: https://nexualpha.com/about
- Editorial policy: https://nexualpha.com/editorial-policy
- Regional entry points: https://nexualpha.com/br, https://nexualpha.com/mx, https://nexualpha.com/tw, https://nexualpha.com/id, https://nexualpha.com/hk, https://nexualpha.com/eu, https://nexualpha.com/uk, https://nexualpha.com/us, https://nexualpha.com/jp?locale=ja, https://nexualpha.com/kr?locale=ko, https://nexualpha.com/tr/markets/turkiye

## Public data and commercial boundary

- Factbook source review date: ${AUDIT_DATE}.
- Technical index audit: ${TECHNICAL_INDEX_AUDIT_DATE} (route, schema, sitemap and link-integrity verification; item-level source review dates remain unchanged).
- Data license and reuse boundary: https://nexualpha.com/methodology#data-license. Public datasets and machine-readable indexes may be read for citation context, but access does not grant redistribution, republication or sublicensing rights.
- NexuAlpha is not an exchange, broker, adviser, custodian, regulator or eligibility decision-maker.
- Partner invite codes and fee-return shares are listed under Key facts with the commission disclosure; commission rates paid to NexuAlpha, welcome offers and campaign amounts are not asserted here.
- Fee values, reserve figures, security scores, licensing conclusions and regional availability require an item-level official source and date.
- Missing source/date means pending source review, not zero, unavailable or verified.
- Account eligibility, registration success, benefit availability and funding access must be checked in the official operator account flow.

## Canonical content clusters

- Factbook source reviews: https://nexualpha.com/factbook/binance, https://nexualpha.com/factbook/okx, https://nexualpha.com/factbook/bybit, https://nexualpha.com/factbook/bitget, https://nexualpha.com/factbook/hyperliquid, https://nexualpha.com/factbook/gmx, https://nexualpha.com/factbook/uniswap
- Source-backed venue detail canonicals: ${canonicalVenueDetailSlugs.map((slug) => `https://nexualpha.com/exchanges/${slug}`).join(", ")}
- Research assets: https://nexualpha.com/research/perp-dex-cost-field-dictionary.json, https://nexualpha.com/research/wave48-perp-dex-cost-citations.json, https://nexualpha.com/research/wave48-tokenized-treasury-rights-ops.json, https://nexualpha.com/research/regional-funding-verification-matrix.json
- Reviewed news answers are indexed in https://nexualpha.com/llms.txt with source records expanded in https://nexualpha.com/llms-full.txt.

## Priority answer map

${compactPriorityAeoEntries.map((item) => `- ${item.market}/${item.intent}: ${item.question} — https://nexualpha.com${item.canonicalPath}`).join("\n")}
`;
await mkdir(root, { recursive: true });
await writeFile(new URL("llms-small.txt", root), small, "utf8");
await writeFile(new URL("llms.txt", root), llms, "utf8");
await writeFile(new URL("llms-full.txt", root), full, "utf8");
console.log(`Generated public/llms-small.txt (${Buffer.byteLength(small)} bytes)`);
console.log(`Generated public/llms.txt (${Buffer.byteLength(llms)} bytes)`);
console.log(`Generated public/llms-full.txt (${Buffer.byteLength(full)} bytes)`);
