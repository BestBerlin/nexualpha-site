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
const sharedSchemaData = ["referral-seo.js", "referral-partners.generated.js", "topic-reviewed-faqs.js", "topic-source-registry.js", "topic-guides-data.js", "exchange-research.js", "tokenized-assets-cluster.js", "news-feed-client.js", "locale-routing.js"];
const hosting = path.join(root, ".openai", "hosting.json");

for (const file of [index, worker, newsRuntime, hosting, publication, attribution, ...sharedSchemaData.map(name => path.join(root, "src", "data", name))]) {
  if (!existsSync(file)) throw new Error("Missing Sites build input: " + file);
}

mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });
copyFileSync(worker, path.join(dist, "server", "index.js"));
mkdirSync(path.join(dist, "src", "data"), { recursive: true });
copyFileSync(publication, path.join(dist, "src", "data", "reviewed-news-publication.js"));
copyFileSync(attribution, path.join(dist, "src", "data", "tracking-attribution.js"));
for (const name of sharedSchemaData) copyFileSync(path.join(root, "src", "data", name), path.join(dist, "src", "data", name));
copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));

console.log("Prepared Sites build: dist/server/index.js and dist/.openai/hosting.json");
