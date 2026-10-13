import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  auditInternalInlinks,
  extractPlainInternalAnchors,
  hasNoindex,
  manifestRouteCanonicalPath,
  parseArgs,
  readHtmlInventory,
  readSitemapInventory,
  routeType,
  runAuditComplete,
} from "../scripts/audit-internal-inlinks.mjs";

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "nexu-inlinks-"));
  return root;
}

function page(canonicalPath, html, { noindex = false } = {}) {
  return {
    canonicalPath,
    file: `${canonicalPath}.html`,
    noindex,
    routeType: routeType(canonicalPath),
    links: extractPlainInternalAnchors(html),
  };
}

test("plain anchor extraction ignores scripts, external URLs, queries, fragments and self links", () => {
  const html = `
    <a href="/target?utm_source=nav#fees">Target one</a>
    <a href='https://nexualpha.com/target#again'>Target two</a>
    <a href="/self#top">Self</a>
    <a href="https://example.com/target">External</a>
    <script>document.write('<a href="/script-only">bad</a>')</script>
  `;
  assert.deepEqual(
    extractPlainInternalAnchors(html).map((link) => link.canonicalPath),
    ["/target", "/target", "/self"],
  );

  const report = auditInternalInlinks({
    sitemapPagePaths: ["/self", "/target"],
    pages: [
      page("/self", html),
      page("/target", `<a href="/self">self source</a>`),
    ],
  });
  assert.equal(report.lowInlinks.find((row) => row.path === "/target").inlinks, 1);
  assert.deepEqual(report.lowInlinks.find((row) => row.path === "/target").referrers, ["/self"]);
});

test("noindex pages are distinguished from indexable pages and external links do not count", () => {
  const html = `<head><meta name="robots" content="noindex,follow"></head><body><a href="/indexable">Indexable</a></body>`;
  assert.equal(hasNoindex(html), true);

  const report = auditInternalInlinks({
    sitemapPagePaths: ["/", "/indexable", "/private"],
    pages: [
      page("/", `<a href="/indexable">Indexable</a><a href="https://external.example/private">External</a>`),
      page("/indexable", `<a href="/">Home</a>`),
      page("/private", html, { noindex: true }),
    ],
  });
  assert.deepEqual(report.noindexInSitemap, ["/private"]);
  assert.equal(report.lowInlinks.some((row) => row.path === "/private"), false);
});

test("sitemap-required URLs missing built HTML are reported", async () => {
  const root = await fixture();
  try {
    await mkdir(path.join(root, "public"), { recursive: true });
    await writeFile(path.join(root, "public", "sitemap.xml"), `<sitemapindex><sitemap><loc>https://nexualpha.com/sitemap-pages.xml</loc></sitemap><sitemap><loc>https://nexualpha.com/sitemap-missing.xml</loc></sitemap></sitemapindex>`);
    await writeFile(path.join(root, "public", "sitemap-pages.xml"), `<urlset><url><loc>https://nexualpha.com/</loc></url><url><loc>https://nexualpha.com/news/missing</loc></url></urlset>`);

    const sitemap = readSitemapInventory(path.join(root, "public", "sitemap.xml"));
    assert.deepEqual(sitemap.pagePaths, ["/", "/news/missing"]);
    assert.deepEqual(sitemap.missingSitemaps, ["https://nexualpha.com/sitemap-missing.xml"]);

    const report = auditInternalInlinks({ sitemapPagePaths: sitemap.pagePaths, pages: [page("/", `<a href="/news/missing">Missing</a>`)] });
    assert.deepEqual(report.missingHtml, ["/news/missing"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("route-type grouping fails only when an indexable route type has zero inbound references", () => {
  const report = auditInternalInlinks({
    sitemapPagePaths: ["/", "/about", "/rates", "/exchanges/binance", "/us"],
    pages: [
      page("/", `<a href="/exchanges/binance?market=BR#fees">Binance</a><a href="/exchanges/binance">Binance again</a>`),
      page("/about", `<a href="/exchanges/binance#review">Binance</a>`),
      page("/rates", `<a href="/exchanges/binance">Binance</a>`),
      page("/exchanges/binance", `<a href="/">Home</a><a href="/about">About</a><a href="/rates">Rates</a>`),
      page("/us", `<p>United States route.</p>`),
    ],
  });

  const venue = report.lowInlinks.find((row) => row.path === "/exchanges/binance");
  assert.equal(venue, undefined);
  assert.deepEqual(report.zeroInboundRouteTypes, ["/us"]);
});

test("prerender manifest variants map to canonical served URLs and use searchPublished as noindex metadata", async () => {
  const root = await fixture();
  try {
    const client = path.join(root, "dist", "client");
    await mkdir(path.join(client, "prerender", "en", "embed"), { recursive: true });
    await mkdir(path.join(client, "prerender", "en", "news"), { recursive: true });
    await mkdir(path.join(client, "prerender", "zh-Hans", "news"), { recursive: true });
    await writeFile(path.join(client, "prerender", "en", "news", "target.json"), JSON.stringify({ html: `<a href="/zh-hans/news/target?x=1#copy">ZH target</a>` }));
    await writeFile(path.join(client, "prerender", "zh-Hans", "news", "target.json"), JSON.stringify({ html: `<a href="/news/target">EN target</a>` }));
    await writeFile(path.join(client, "prerender", "en", "embed", "calculator.json"), JSON.stringify({ html: `<a href="/target">Target</a>` }));
    await writeFile(path.join(client, "prerender-manifest.json"), JSON.stringify({
      routes: {
        "/news/target|en": { pathname: "/news/target", locale: "en", asset: "/prerender/en/news/target.json", searchPublished: true },
        "/news/target|zh-Hans": { pathname: "/news/target", locale: "zh-Hans", asset: "/prerender/zh-Hans/news/target.json", searchPublished: true },
        "/embed/calculator|en": { pathname: "/embed/calculator", locale: "en", asset: "/prerender/en/embed/calculator.json", searchPublished: false },
      },
    }));

    assert.equal(manifestRouteCanonicalPath({ pathname: "/news/target", locale: "zh-Hans" }), "/zh-hans/news/target");
    assert.equal(manifestRouteCanonicalPath({ pathname: "/embed/calculator", locale: "ja" }), "/embed/calculator");

    const pages = readHtmlInventory(client);
    assert.deepEqual(pages.map((row) => row.canonicalPath), ["/embed/calculator", "/news/target", "/zh-hans/news/target"]);
    assert.equal(pages.find((row) => row.canonicalPath === "/embed/calculator").noindex, true);
    assert.equal(pages.find((row) => row.canonicalPath === "/zh-hans/news/target").links[0].canonicalPath, "/news/target");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

// Full local SSR crawl, matching the SEO index audit budget on shared build hosts.
test("built corpus has HTML coverage and no zero-inbound indexable route types", { timeout: 600_000 }, async (t) => {
  if (!existsSync(new URL("../dist/client/prerender-manifest.json", import.meta.url))) {
    t.skip("build output missing: run npm run build before the built-corpus internal inlink regression");
    return;
  }

  const report = await runAuditComplete(parseArgs([]));
  assert.equal(report.stats.missingHtml, 0, JSON.stringify(report.inputs.renderErrorsSample || []));
  assert.deepEqual(report.zeroInboundRouteTypes, []);
});
