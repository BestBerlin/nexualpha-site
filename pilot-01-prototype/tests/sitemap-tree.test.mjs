import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { isSitemapIndex, readSitemapTree, sitemapPageUrls } from "../scripts/sitemap-tree.mjs";
import { checkSitemap } from "../scripts/weekly-growth-ops.mjs";

const index = (names) => `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${names.map((name) => `  <sitemap><loc>https://nexualpha.com/${name}</loc></sitemap>`).join("\n")}
</sitemapindex>`;
const urlset = (body) => `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${body}</urlset>`;
const venues = urlset(`<url><loc>https://nexualpha.com/venues/okx?a=1&amp;b=2</loc></url><url><loc>https://nexualpha.com/</loc></url>`);
const locales = urlset(`<url><loc>https://nexualpha.com/</loc>
  <xhtml:link rel="alternate" hreflang="ja" href="https://nexualpha.com/ja" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://nexualpha.com/" /></url>`);

async function fixture(files) {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexu-sitemap-tree-"));
  await mkdir(path.join(root, "public"), { recursive: true });
  for (const [name, xml] of Object.entries(files)) await writeFile(path.join(root, "public", name), xml, "utf8");
  return root;
}

test("a sitemap index is read through its children and yields page URLs only", async () => {
  const root = await fixture({ "sitemap.xml": index(["sitemap-venues.xml", "sitemap-locales.xml"]), "sitemap-venues.xml": venues, "sitemap-locales.xml": locales });
  try {
    const tree = readSitemapTree(path.join(root, "public", "sitemap.xml"));
    assert.equal(isSitemapIndex(tree.files[0].xml), true);
    assert.equal(tree.files.length, 3);
    assert.deepEqual(tree.missing, []);
    assert.deepEqual(sitemapPageUrls(tree), ["https://nexualpha.com/venues/okx?a=1&b=2", "https://nexualpha.com/"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a plain urlset is a single-file tree", async () => {
  const root = await fixture({ "sitemap.xml": venues });
  try {
    const tree = readSitemapTree(path.join(root, "public", "sitemap.xml"));
    assert.equal(tree.files.length, 1);
    assert.deepEqual(sitemapPageUrls(tree), ["https://nexualpha.com/venues/okx?a=1&b=2", "https://nexualpha.com/"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("weekly growth checkSitemap counts pages and hreflang across index children", async () => {
  const root = await fixture({ "sitemap.xml": index(["sitemap-venues.xml", "sitemap-locales.xml"]), "sitemap-venues.xml": venues, "sitemap-locales.xml": locales });
  try {
    const result = await checkSitemap(root);
    assert.equal(result.status, "PASS");
    assert.deepEqual(result.issues, []);
    assert.equal(result.metrics.locCount, 2);
    assert.equal(result.metrics.sitemapFileCount, 3);
    assert.deepEqual(result.metrics.hreflangs, ["ja", "x-default"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("weekly growth checkSitemap flags a child sitemap the index lists but public/ lacks", async () => {
  const root = await fixture({ "sitemap.xml": index(["sitemap-locales.xml", "sitemap-gone.xml"]), "sitemap-locales.xml": locales });
  try {
    const result = await checkSitemap(root);
    assert.equal(result.status, "NEEDS_REVIEW");
    assert.deepEqual(result.issues, ["missing_child_sitemaps"]);
    assert.deepEqual(result.metrics.missingChildSitemaps, ["https://nexualpha.com/sitemap-gone.xml"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
