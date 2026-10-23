#!/usr/bin/env node
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const index = path.join(dist, "client", "index.html");
const worker = path.join(root, "worker", "index.js");
const newsRuntime = path.join(dist, "news-ssr", "entry-server.js");
const publication = path.join(root, "src", "data", "reviewed-news-publication.js");
const attribution = path.join(root, "src", "data", "tracking-attribution.js");
// NexuAlpha Academy (2026-10-12): the Worker head imports the episode index, the SEO helper and every locale's lessons.
const academyData = ["academy.js", "academy-season1.js", "academy-seo.js", "academy-copy.js", "academy-content-all.js",
  "academy-content-en.js", "academy-content-zh-hans.js", "academy-content-zh-hant.js", "academy-content-es.js", "academy-content-pt-br.js", "academy-content-fr.js", "academy-content-de.js", "academy-content-ja.js", "academy-content-ko.js", "academy-content-ru.js", "academy-content-tr.js", "academy-content-id.js", "academy-content-vi.js", "academy-content-ar.js",
  // Binance October campaigns page (2026-10-12): the Worker head imports its route, SEO helper and copy.
  "binance-october.js", "binance-october-path.js", "binance-october-seo.js", "binance-october-copy.js", "binance-october-tournament-copy.js"];
// App pages use the existing source-bound CTA projection; ship its transitive public data dependencies.
const appCtaData = ["directory-cta-context.js", "regional-funding-rails.generated.js", "source-bound-cta.js", "public-cta.js", "commercial-claims.js", "regional-cta.js", "directory-context.js", "market-policy.js", "regional-eligibility-evidence.js", "decision-passport.js", "regional-funding-verification-matrix.js", "contextual-href.js", "regional-shortlist.js", "regional-directory.js", "telegram-start-payload.js"];
// Flash (2026-10-12): the Worker builds the flash feed, its head and sitemap from these.
// Live ticker bar (2026-10-13): the Worker splices the server snapshot into the home page (ticker.js); same for the home
// "Today's movers" board (movers.js, movers-html.js) and the whale-watch replacement (whales-home.js).
const flashData = ["flash.js", "flash-path.js", "flash-feed.js", "local-time.js", "ticker.js", "ticker-labels.js", "movers.js", "movers-html.js", "whales-home.js", "whale-sentences.js"];
// License directory (2026-10-13): Worker head imports the route parser, data table and SEO helper.
const licenseData = ["licenses-routes.js", "licenses.js", "licenses-seo.js", "licenses-research.js", "licenses-editorial.js", "venue-display-names.js", "license-region-names.js"];
// Deposit & withdraw hub (2026-10-15): the Worker head imports the route parser, model, copy, SEO helper and fiat tables.
const depositData = ["deposit-routes.js", "deposit.js", "deposit-copy.js", "deposit-seo.js", "fiat-rails.generated.js", "fiat-rails-summary.generated.js"];
// Where to buy <coin> (2026-10-12): the Worker head imports the coin table, copy, SEO helper and every locale's descriptions.
const coinData = ["coins-routes.js", "coins.js", "coins-snapshot.js", "coins-seo.js", "coins-copy.js", "coins-data.generated.js", "coins-links.generated.js", "coins-venue-links.generated.js",
  "coin-content-en.js", "coin-content-zh-hans.js", "coin-content-es.js", "coin-content-pt-br.js", "coin-content-fr.js", "coin-content-de.js",
  "coin-content-ja.js", "coin-content-ko.js", "coin-content-tr.js", "coin-content-vi.js", "coin-content-id.js"];
// Crypto glossary (2026-10-13): the Worker head imports the term index, the SEO helper, its UI copy and every locale's
// generated content modules (glossary-content-all.js imports the index and shard files).
const glossaryData = ["glossary-routes.js", "glossary-terms.js", "glossary-seo.js", "glossary-copy.js", "glossary-content-all.js",
  ...readdirSync(path.join(root, "src", "data")).filter((name) => /^glossary-(?:index|shard)-[a-z0-9-]+\.js$/.test(name))];
// Converter pages share the coin table and add fiat route/copy/SEO helpers.
const converterData = ["converter-routes.js", "converter.js", "converter-copy.js", "converter-seo.js"];
// Bybit Stocks campaign page (2026-10-12): the Worker head imports its route, SEO helper and copy.
const bybitStocksData = ["bybit-stocks.js", "bybit-stocks-path.js", "bybit-stocks-seo.js", "bybit-stocks-copy.js"];
// Tokenized US stocks (2026-10-15): the Worker head imports its routes, SEO helper, sourced facts and copy.
const tokenizedStocksData = ["tokenized-stocks.js", "tokenized-stocks-routes.js", "tokenized-stocks-labels.js", "tokenized-stocks-seo.js", "tokenized-stocks-facts.js", "tokenized-stocks-copy.js", "tokenized-stocks-teaser.js", "tokenized-stocks-model.js", "tokenized-stocks-matrix.js", "tokenized-stocks-rows.js", "tokenized-stocks-live-sources.js", "tokenized-stocks-live.generated.js"];
// Spot ETF flows + crypto calendar (2026-10-13): the Worker head, SSR state and iCal export import these.
// Linkable data assets + /press (SEO W43, 2026-10-18): the Worker head, CSV/SVG routes and SSR state import these.
const dataAssetsData = ["data-assets-routes.js", "data-assets.js", "data-assets-copy.js", "data-assets-seo.js"];
const intelToolData = ["intel-tools-routes.js", "intel-tools-copy.js", "intel-tools-seo.js", "intel-tools-labels.js", "etf-flows.js", "crypto-calendar.js", "sgt-time.js"];
// Bitget Alliance campaign page (2026-10-13): the Worker head imports its route, SEO helper and copy.
const bitgetAllianceData = ["bitget-alliance.js", "bitget-alliance-path.js", "bitget-alliance-seo.js", "bitget-alliance-copy.js"];
// Kraken 5M USDG Challenge page (2026-10-13): the Worker head imports its route, SEO helper and copy.
const krakenUsdgData = ["kraken-usdg.js", "kraken-usdg-path.js", "kraken-usdg-seo.js", "kraken-usdg-copy.js"];
const optionalSharedSchemaData = ["radar.js", "radar-ui-copy.js", "whale-routes.js"];
const sharedSchemaData = ["market-events-assets.js", "money-topic-hubs.js", "article-sitemap-seo.js", "article-related-links.js", "dataset-schema.js", "bitget-guide-routes.js", "bitget-guide.js", "bitget-guide-seo.js", "bitget-guide-copy-zh-en.js", "bitget-guide-copy-id.js", "bitget-guide-copy-es-pt.js", "referral-native.js", "binance-pro-step.js", "beginner-routes.js", "beginner-seo.js", "beginner-content-all.js", "partner-program-copy.js", "campaign-autodraft.js", "campaign-autodraft.generated.js", "campaign-locale-policy.js", "promotions.js", "promotions.generated.js", "promotion-copy.js", "activity-update-path.js", "activity-update.js", "campaign-briefs.js", "generated-official-activities.js", "owner-campaigns.js", "legal-pages.js", "brand-slogan.js", "home-search-copy.js", "format-percent.js", "news-library.js", "news-geo-policy.js", "news-listing-path.js", "topic-clusters.js", "tokenized-stocks-news.js", "news-content-repair.js", "news-search-state.js", "news-search-state.generated.js", "home-hero-experiment.js", "experiment-registry.js", "article-embeds.js", "news-list-copy.js", "announcement-intel.js", "announcement-archive.js", "official-research-route.js", "event-source.js", "home-cta-label.js", "venue-faq-fallback.js", "referral-seo.js", "striking-distance-venue-copy.js", "serp-ctr-news-overrides.js", "partner-geo-restrictions.js", "partner-geo-policy.js", "partner-geo-policy.generated.js", "locale-policy.js", "neutral-referral-topic.js", "neutral-article.js", "campaign-codes.js", "referral-partners.generated.js", "partner-venue-faq.js", "exchange-quick-answers.js", "exchange-quick-answer-schema.js", "priority-venue-answers.js", "topic-reviewed-faqs.js", "topic-source-registry.js", "topic-guides-data.js", "exchange-research.js", "tokenized-assets-cluster.js", "venue-alternatives.js", "venue-alternative-slugs.js", "brazil-vasp-deadline.js", "brazil-vasp-deadline-chrome.js", "brazil-vasp-deadline-slugs.js", "brazil-vasp-status.js", "news-feed-client.js", "hub-entity-news.js", "locale-routing.js", "social-image.js", "market-data-pages.js", "market-data-pages-nav.js", "meta-description.js", "brand-entity.js", "brand-definition.js", "brand-social.js", "page-schemas.js", "compare-generated.js", "reviewed-base-fees.js", "exchange-facts.js", "exchange-key-facts.js", "exchange-key-facts.generated.js", "article-inline-markdown.js", "exchange-outbound.js", "backup-signup.js", "onchain-guide.js", "radar-seo.js", "venue-database.js", "partner-registry.js", "format-fee.js", "factbook-dates.js", "partner-benefit-status.js", "home-rebate-tiers.js", "news-read-time.js", "tr-percent.js", "article-empty-headings.js", "no-kyc-meta-title.js", "app-download-path.js", "app-downloads.js", "app-download-copy.js", "exchange-apk.js", ...appCtaData, ...academyData, ...licenseData, ...depositData, ...flashData, ...bybitStocksData, ...tokenizedStocksData, ...bitgetAllianceData, ...krakenUsdgData, ...coinData, ...glossaryData, ...converterData, ...optionalSharedSchemaData.filter((name) => existsSync(path.join(root, "src", "data", name))), "funding-rates.js", "funding-matrix.js", "funding-matrix-seo.js", "funding-matrix-copy.js", ...intelToolData, ...dataAssetsData, "heatmap-copy.js", "heatmap-view.js", "liquidation-levels.js", "venue-priority.js", "striking-page-overrides.js", "answer-first.js", "seo-autopilot.js", "seo-autopilot-overrides.json"];
const serverRuntimeFiles = ["liquidation-levels-feed.mjs", "stale-json-feed.mjs", "source-freshness.mjs"];
// Comparison pairs (2026-10-10): worker/index.js imports compare-direct-answers.js, which pulls the per-pair copy from
// src/data/compare-pairs/. These ship under the same relative paths so the server can resolve them.
const comparePairData = ["compare-direct-answers.js", "compare-direct-answer-drafts.js", "compare-pair-answers.js", "compare-slug.js"];
const comparePairsDir = "compare-pairs";
const comparePairFiles = ["shared.js", "binance-vs-bitget.js", "bitget-vs-okx.js", "bybit-vs-mexc.js", "bitget-vs-mexc.js"];
const hosting = path.join(root, ".openai", "hosting.json");

for (const file of [index, worker, newsRuntime, hosting, publication, attribution, ...sharedSchemaData.map(name => path.join(root, "src", "data", name)), ...serverRuntimeFiles.map(name => path.join(root, "server", name)), ...comparePairData.map(name => path.join(root, "src", "data", name)), ...comparePairFiles.map(name => path.join(root, "src", "data", comparePairsDir, name))]) {
  if (!existsSync(file)) throw new Error("Missing Sites build input: " + file);
}

mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });
copyFileSync(worker, path.join(dist, "server", "index.js"));
for (const name of serverRuntimeFiles) copyFileSync(path.join(root, "server", name), path.join(dist, "server", name));
// The runtime update feed uses the same review gate as the activity cards.
const updatesModelDir = path.join(dist, "src", "components", "official-updates");
mkdirSync(updatesModelDir, { recursive: true });
copyFileSync(path.join(root, "src", "components", "official-updates", "official-updates-model.js"), path.join(updatesModelDir, "official-updates-model.js"));
mkdirSync(path.join(dist, "src", "components", "shared"), { recursive: true });
copyFileSync(path.join(root, "src", "components", "shared", "announcement-snapshot.js"), path.join(dist, "src", "components", "shared", "announcement-snapshot.js"));
// Per-locale script font faces (perf 2026-10-22): the Worker head inlines the page locale's @font-face block.
mkdirSync(path.join(dist, "src", "data"), { recursive: true });
copyFileSync(path.join(root, "src", "data", "locale-font-faces.js"), path.join(dist, "src", "data", "locale-font-faces.js"));
// The Worker imports these pure research selectors at runtime.
const researchDir = path.join(dist, "src", "components", "research");
mkdirSync(researchDir, { recursive: true });
for (const name of ["research-selection.js", "hub-research.js"]) {
  copyFileSync(path.join(root, "src", "components", "research", name), path.join(researchDir, name));
}
mkdirSync(path.join(dist, "src", "data"), { recursive: true });
copyFileSync(publication, path.join(dist, "src", "data", "reviewed-news-publication.js"));
copyFileSync(attribution, path.join(dist, "src", "data", "tracking-attribution.js"));
cpSync(path.join(root, "src", "data", "beginner-copy"), path.join(dist, "src", "data", "beginner-copy"), { recursive: true });
for (const name of sharedSchemaData) copyFileSync(path.join(root, "src", "data", name), path.join(dist, "src", "data", name));
mkdirSync(path.join(dist, "src", "data", "referral-native-copy"), { recursive: true });
for (const name of readdirSync(path.join(root, "src", "data", "referral-native-copy"))) copyFileSync(path.join(root, "src", "data", "referral-native-copy", name), path.join(dist, "src", "data", "referral-native-copy", name));
for (const name of comparePairData) copyFileSync(path.join(root, "src", "data", name), path.join(dist, "src", "data", name));
mkdirSync(path.join(dist, "src", "data", comparePairsDir), { recursive: true });
for (const name of comparePairFiles) copyFileSync(path.join(root, "src", "data", comparePairsDir, name), path.join(dist, "src", "data", comparePairsDir, name));
copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));

console.log("Prepared Sites build: dist/server/index.js and dist/.openai/hosting.json");

// Stock social-card renderer shares the local identity manifest with React.
const stockLogoDir = path.join(dist, "src", "components", "tokenized-stocks");
mkdirSync(stockLogoDir, { recursive: true });
copyFileSync(path.join(root, "src", "components", "tokenized-stocks", "stock-logo-manifest.js"), path.join(stockLogoDir, "stock-logo-manifest.js"));
