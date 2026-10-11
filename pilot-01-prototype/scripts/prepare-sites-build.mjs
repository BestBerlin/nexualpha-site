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
const sharedSchemaData = ["news-library.js", "topic-clusters.js", "news-content-repair.js", "home-hero-experiment.js", "experiment-registry.js", "article-embeds.js", "news-list-copy.js", "announcement-intel.js", "official-research-route.js", "referral-seo.js", "referral-partners.generated.js", "partner-venue-faq.js", "priority-venue-answers.js", "topic-reviewed-faqs.js", "topic-source-registry.js", "topic-guides-data.js", "exchange-research.js", "tokenized-assets-cluster.js", "news-feed-client.js", "locale-routing.js", "social-image.js", "market-data-pages.js", "market-data-pages-nav.js", "meta-description.js", "brand-entity.js", "compare-generated.js", "reviewed-base-fees.js", "exchange-facts.js", "article-inline-markdown.js", "onchain-guide.js", "venue-database.js", "partner-registry.js", "format-fee.js", "factbook-dates.js", "partner-benefit-status.js", "home-rebate-tiers.js"];
// Comparison pairs (2026-10-10): worker/index.js imports compare-direct-answers.js, which pulls the per-pair copy from
// src/data/compare-pairs/. These ship under the same relative paths so the server can resolve them.
const comparePairData = ["compare-direct-answers.js", "compare-pair-answers.js", "compare-slug.js"];
const comparePairsDir = "compare-pairs";
const comparePairFiles = ["shared.js", "binance-vs-bitget.js", "bitget-vs-okx.js", "bybit-vs-mexc.js", "bitget-vs-mexc.js"];
const hosting = path.join(root, ".openai", "hosting.json");

for (const file of [index, worker, newsRuntime, hosting, publication, attribution, ...sharedSchemaData.map(name => path.join(root, "src", "data", name)), ...comparePairData.map(name => path.join(root, "src", "data", name)), ...comparePairFiles.map(name => path.join(root, "src", "data", comparePairsDir, name))]) {
  if (!existsSync(file)) throw new Error("Missing Sites build input: " + file);
}

mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });
copyFileSync(worker, path.join(dist, "server", "index.js"));
mkdirSync(path.join(dist, "src", "data"), { recursive: true });
copyFileSync(publication, path.join(dist, "src", "data", "reviewed-news-publication.js"));
copyFileSync(attribution, path.join(dist, "src", "data", "tracking-attribution.js"));
for (const name of sharedSchemaData) copyFileSync(path.join(root, "src", "data", name), path.join(dist, "src", "data", name));
for (const name of comparePairData) copyFileSync(path.join(root, "src", "data", name), path.join(dist, "src", "data", name));
mkdirSync(path.join(dist, "src", "data", comparePairsDir), { recursive: true });
for (const name of comparePairFiles) copyFileSync(path.join(root, "src", "data", comparePairsDir, name), path.join(dist, "src", "data", comparePairsDir, name));
copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));

console.log("Prepared Sites build: dist/server/index.js and dist/.openai/hosting.json");
