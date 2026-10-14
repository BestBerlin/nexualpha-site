// Owner privacy (2026-10-15): nothing the public site serves may link nexualpha.com to the owner's personal handle
// or personal mailbox. The brand contact is contact@nexualpha.com and the byline is "NexuAlpha Research Desk".
// Checked surfaces: Organization / Article JSON-LD from the Worker, the brand + legal pages, the public text assets
// (llms.txt, llms-full.txt, research datasets, feeds, sitemaps) and, when present, the built dist output.
// Partner referral URLs are owner-managed and out of scope here; JS bundles are not scanned.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { routeMetadata } from "../worker/index.js";
import { BRAND, organizationSchema } from "../src/data/brand-entity.js";
import { LEGAL_COPY, LEGAL_PAGE_PATHS } from "../src/data/legal-pages.js";
import { localizedPath } from "../src/data/locale-routing.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const PERSONAL_IDENTITY = /bestberlin|lilixin/i;
const SCANNED_EXTENSIONS = new Set([".html", ".json", ".txt", ".xml", ".md", ".webmanifest"]);
const env = { ASSETS: { fetch: async () => new Response("missing", { status: 404 }) } };

async function* textFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* textFiles(full);
    else if (SCANNED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) yield full;
  }
}

async function leaksIn(dir) {
  const leaks = [];
  for await (const file of textFiles(dir)) {
    const match = (await readFile(file, "utf8")).match(PERSONAL_IDENTITY);
    if (match) leaks.push(`${path.relative(root, file)} (${match[0]})`);
  }
  return leaks;
}

test("brand entity and legal copy use the neutral brand mailbox", () => {
  assert.equal(BRAND.email, "contact@nexualpha.com");
  for (const locale of ["en", "zh-Hans", "ar"]) assert.doesNotMatch(JSON.stringify(organizationSchema(locale)), PERSONAL_IDENTITY, locale);
  assert.doesNotMatch(JSON.stringify(LEGAL_COPY), PERSONAL_IDENTITY);
});

test("worker metadata and JSON-LD for brand, legal, data and news routes carry no personal identity", async () => {
  const feed = JSON.parse(await readFile(path.join(root, "public/content/news-feed.json"), "utf8"));
  const articles = (Array.isArray(feed) ? feed : feed.articles || feed.items || []).slice(0, 5);
  const newsPaths = articles.map((article) => article?.slug && `/news/${article.slug}`).filter(Boolean);
  const paths = ["/", "/about", "/editorial-policy", "/methodology", "/news", ...LEGAL_PAGE_PATHS, ...newsPaths];
  for (const pathname of paths) for (const locale of ["en", "zh-Hans", "es", "ar"]) {
    const url = new URL(`https://nexualpha.com${localizedPath(pathname, locale)}`);
    const metadata = await routeMetadata(url, env);
    assert.doesNotMatch(JSON.stringify(metadata), PERSONAL_IDENTITY, url.href);
  }
});

test("public text assets (llms, datasets, feeds, sitemaps) carry no personal identity", async () => {
  assert.deepEqual(await leaksIn(path.join(root, "public")), []);
});

test("built dist output (HTML, JSON-LD, llms, feeds) carries no personal identity", { skip: !existsSync(path.join(root, "dist")) && "dist not built" }, async () => {
  assert.deepEqual(await leaksIn(path.join(root, "dist")), []);
});
