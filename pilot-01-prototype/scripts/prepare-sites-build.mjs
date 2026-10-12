#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
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
  "academy-content-en.js", "academy-content-zh-hans.js", "academy-content-zh-hant.js", "academy-content-es.js", "academy-content-pt-br.js", "academy-content-fr.js", "academy-content-de.js", "academy-content-ja.js", "academy-content-ko.js", "academy-content-ru.js", "academy-content-tr.js", "academy-content-id.js", "academy-content-vi.js", "academy-content-ar.js"];
// Where to buy <coin> (2026-10-12): the Worker head imports the coin table, copy, SEO helper and every locale's descriptions.
const coinData = ["coins-routes.js", "coins.js", "coins-seo.js", "coins-copy.js", "coins-data.generated.js", "coins-links.generated.js", "coins-venue-links.generated.js",
  "coin-content-en.js", "coin-content-zh-hans.js", "coin-content-es.js", "coin-content-pt-br.js", "coin-content-fr.js", "coin-content-de.js",
  "coin-content-ja.js", "coin-content-ko.js", "coin-content-tr.js", "coin-content-vi.js", "coin-content-id.js",
  // Sign-up gating on coin pages goes through publicCtaForVenue (source-bound-cta.js) and its regional helpers.
  "source-bound-cta.js", "public-cta.js", "commercial-claims.js", "regional-cta.js", "directory-context.js", "market-policy.js",
  "regional-eligibility-evidence.js", "decision-passport.js", "regional-funding-verification-matrix.js", "contextual-href.js",
  "regional-shortlist.js", "regional-directory.js", "telegram-start-payload.js"];
const sharedSchemaData = ["activity-update-path.js", "activity-update.js", "campaign-briefs.js", "generated-official-activities.js", "owner-campaigns.js", "legal-pages.js", "brand-slogan.js", "home-search-copy.js", "format-percent.js", "news-library.js", "topic-clusters.js", "news-content-repair.js", "home-hero-experiment.js", "experiment-registry.js", "article-embeds.js", "news-list-copy.js", "announcement-intel.js", "announcement-archive.js", "official-research-route.js", "referral-seo.js", "partner-geo-restrictions.js", "partner-geo-policy.js", "partner-geo-policy.generated.js", "referral-partners.generated.js", "partner-venue-faq.js", "priority-venue-answers.js", "topic-reviewed-faqs.js", "topic-source-registry.js", "topic-guides-data.js", "exchange-research.js", "tokenized-assets-cluster.js", "venue-alternatives.js", "venue-alternative-slugs.js", "brazil-vasp-deadline.js", "brazil-vasp-deadline-chrome.js", "brazil-vasp-deadline-slugs.js", "brazil-vasp-status.js", "news-feed-client.js", "locale-routing.js", "social-image.js", "market-data-pages.js", "market-data-pages-nav.js", "meta-description.js", "brand-entity.js", "compare-generated.js", "reviewed-base-fees.js", "exchange-facts.js", "article-inline-markdown.js", "onchain-guide.js", "venue-database.js", "partner-registry.js", "format-fee.js", "factbook-dates.js", "partner-benefit-status.js", "home-rebate-tiers.js", "news-read-time.js", "tr-percent.js", "article-empty-headings.js", "no-kyc-meta-title.js", ...academyData, ...coinData];
// Comparison pairs (2026-10-10): worker/index.js imports compare-direct-answers.js, which pulls the per-pair copy from
// src/data/compare-pairs/. These ship under the same relative paths so the server can resolve them.
const comparePairData = ["compare-direct-answers.js", "compare-direct-answer-drafts.js", "compare-pair-answers.js", "compare-slug.js"];
const comparePairsDir = "compare-pairs";
const comparePairFiles = ["shared.js", "binance-vs-bitget.js", "bitget-vs-okx.js", "bybit-vs-mexc.js", "bitget-vs-mexc.js"];
const hosting = path.join(root, ".openai", "hosting.json");

for (const file of [index, worker, newsRuntime, hosting, publication, attribution, ...sharedSchemaData.map(name => path.join(root, "src", "data", name)), ...comparePairData.map(name => path.join(root, "src", "data", name)), ...comparePairFiles.map(name => path.join(root, "src", "data", comparePairsDir, name))]) {
  if (!existsSync(file)) throw new Error("Missing Sites build input: " + file);
}

mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });
copyFileSync(worker, path.join(dist, "server", "index.js"));
// The runtime update feed uses the same review gate as the activity cards.
const updatesModelDir = path.join(dist, "src", "components", "official-updates");
mkdirSync(updatesModelDir, { recursive: true });
copyFileSync(path.join(root, "src", "components", "official-updates", "official-updates-model.js"), path.join(updatesModelDir, "official-updates-model.js"));
mkdirSync(path.join(dist, "src", "data"), { recursive: true });
copyFileSync(publication, path.join(dist, "src", "data", "reviewed-news-publication.js"));
copyFileSync(attribution, path.join(dist, "src", "data", "tracking-attribution.js"));
for (const name of sharedSchemaData) copyFileSync(path.join(root, "src", "data", name), path.join(dist, "src", "data", name));
for (const name of comparePairData) copyFileSync(path.join(root, "src", "data", name), path.join(dist, "src", "data", name));
mkdirSync(path.join(dist, "src", "data", comparePairsDir), { recursive: true });
for (const name of comparePairFiles) copyFileSync(path.join(root, "src", "data", comparePairsDir, name), path.join(dist, "src", "data", comparePairsDir, name));
copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));

console.log("Prepared Sites build: dist/server/index.js and dist/.openai/hosting.json");
