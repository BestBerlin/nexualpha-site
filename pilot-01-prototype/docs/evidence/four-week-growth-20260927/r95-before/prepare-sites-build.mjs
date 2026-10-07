#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const index = path.join(dist, "client", "index.html");
const worker = path.join(root, "worker", "index.js");
const publication = path.join(root, "src", "data", "reviewed-news-publication.js");
const attribution = path.join(root, "src", "data", "tracking-attribution.js");
const hosting = path.join(root, ".openai", "hosting.json");

for (const file of [index, worker, hosting, publication, attribution]) {
  if (!existsSync(file)) throw new Error("Missing Sites build input: " + file);
}

mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });
copyFileSync(worker, path.join(dist, "server", "index.js"));
mkdirSync(path.join(dist, "src", "data"), { recursive: true });
copyFileSync(publication, path.join(dist, "src", "data", "reviewed-news-publication.js"));
copyFileSync(attribution, path.join(dist, "src", "data", "tracking-attribution.js"));
copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));

console.log("Prepared Sites build: dist/server/index.js and dist/.openai/hosting.json");
