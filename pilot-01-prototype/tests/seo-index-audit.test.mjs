import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildSitemap } from "../scripts/generate-prerender-manifest.mjs";
import { homeTitle, homeDescription } from "../src/data/home-search-copy.js";
import { referralSeoFor } from "../src/data/referral-seo.js";
import { strikingDistanceVenueTitle } from "../src/data/striking-distance-venue-copy.js";
import { localizedHref } from "../src/data/locale-routing.js";

import {
  auditUrlKey,
  headerRobotsFlags,
  parseHeadMetadata,
  parseSitemapXml,
  readBuiltSitemapTree,
  runSeoIndexAudit,
  validateIndexConsistency,
} from "../scripts/audit-seo-index.mjs";

async function tempRoot() {
  return mkdtemp(path.join(os.tmpdir(), "nexu-seo-index-"));
}

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const jsonLdFor = (path) => [{ index: 1, value: { "@context": "https://schema.org", "@type": "WebPage", url: `https://nexualpha.com${path}` } }];

test("sitemap parser decodes URLsets, alternates, and lastmod while rejecting external paths", () => {
  const parsed = parseSitemapXml(`<?xml version="1.0"?><urlset xmlns:xhtml="http://www.w3.org/1999/xhtml">
    <url>
      <loc>https://nexualpha.com/news/a%20b</loc>
      <xhtml:link rel="alternate" hreflang="en" href="https://nexualpha.com/news/a%20b" />
      <xhtml:link rel="alternate" hreflang="x-default" href="https://nexualpha.com/news/a%20b" />
      <xhtml:link rel="alternate" hreflang="evil" href="https://evil.example/news/a" />
      <lastmod>2026-10-12</lastmod>
    </url>
  </urlset>`);
  assert.equal(parsed.kind, "urlset");
  assert.equal(parsed.urls[0].path, "/news/a%20b");
  assert.equal(parsed.urls[0].lastmod, "2026-10-12");
  assert.deepEqual(parsed.urls[0].alternates.map((alternate) => [alternate.hreflang, alternate.path]), [
    ["en", "/news/a%20b"],
    ["x-default", "/news/a%20b"],
    ["evil", null],
  ]);
});

test("head parser uses exact robots tokens and extracts canonical plus hreflang metadata", () => {
  const meta = parseHeadMetadata(`<!doctype html><head>
    <title>Safe &amp; Sound</title>
    <meta name="description" content="A useful description.">
    <meta name="robots" content="noindex,follow">
    <link rel="canonical" href="https://nexualpha.com/news/a">
    <link rel="alternate" hreflang="en" href="https://nexualpha.com/news/a">
    <link rel="alternate" hreflang="x-default" href="https://nexualpha.com/news/a">
  </head>`);
  assert.equal(meta.title, "Safe & Sound");
  assert.equal(meta.description, "A useful description.");
  assert.equal(meta.noindex, true);
  assert.equal(meta.indexFollow, false);
  assert.equal(meta.canonicalPath, "/news/a");
  assert.deepEqual(meta.alternates.map((alternate) => alternate.hreflang), ["en", "x-default"]);
});

test("built sitemap tree reports missing child sitemap files as hard audit input failures", async () => {
  const root = await tempRoot();
  try {
    await mkdir(path.join(root, "dist", "client"), { recursive: true });
    await writeFile(path.join(root, "dist", "client", "sitemap.xml"), `<sitemapindex><sitemap><loc>https://nexualpha.com/sitemap-pages.xml</loc></sitemap></sitemapindex>`);
    const tree = readBuiltSitemapTree(path.join(root, "dist", "client", "sitemap.xml"));
    assert.deepEqual(tree.urls, []);
    assert.equal(tree.missingSitemaps.length, 1);
    assert.equal(path.basename(tree.missingSitemaps[0]), "sitemap-pages.xml");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("audit fails closed when the built site is absent", async () => {
  const root = await tempRoot();
  try {
    const report = await runSeoIndexAudit({
      root,
      baseUrl: "https://nexualpha.com",
      sitemap: path.join(root, "dist", "client", "sitemap.xml"),
      concurrency: 1,
      sampleLimit: 5,
    });
    assert.equal(report.ok, false);
    assert.equal(report.failures[0].kind, "missing-built-site");
    assert.equal(report.stats.failures, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("index consistency validator catches adversarial SEO graph violations", () => {
  const page = (path, overrides = {}) => ({
    path,
    canonicalPath: path,
    canonicalHref: `https://nexualpha.com${path}`,
    responseStatus: 200,
    responseUrl: `https://nexualpha.com${path}`,
    noindex: false,
    indexFollow: true,
    robots: "index,follow",
    alternates: [],
    title: `Title ${path}`,
    description: `Description ${path}`,
    lang: "en",
    jsonLdSchemas: jsonLdFor(path),
    jsonLdErrors: [],
    ...overrides,
  });
  const pages = [
    page("/a", {
      title: "Duplicate",
      description: "Duplicate description",
      alternates: [
        { hreflang: "en", href: "https://nexualpha.com/a", path: "/a" },
        { hreflang: "es", href: "https://nexualpha.com/es/a", path: "/es/a" },
        { hreflang: "de", href: "https://nexualpha.com/de/a", path: "/de/a" },
        { hreflang: "x-default", href: "https://nexualpha.com/a", path: "/a" },
      ],
    }),
    page("/es/a", {
      lang: "es",
      alternates: [
        { hreflang: "en", href: "https://nexualpha.com/a", path: "/a" },
        { hreflang: "es", href: "https://nexualpha.com/es/a", path: "/es/a" },
        { hreflang: "fr", href: "https://nexualpha.com/fr/a", path: "/fr/a" },
        { hreflang: "x-default", href: "https://nexualpha.com/a", path: "/a" },
      ],
    }),
    page("/fr/a", { lang: "fr" }),
    page("/blocked", { title: "Duplicate", description: "Duplicate description" }),
    page("/query", { canonicalHref: "https://nexualpha.com/query", responseUrl: "https://nexualpha.com/query?ref=1" }),
    page("/redirect", { responseUrl: "https://nexualpha.com/redirected" }),
    page("/header-noindex", { noindex: true, indexFollow: false, robots: "googlebot: noindex" }),
    page("/noindex", { noindex: true, indexFollow: false, robots: "noindex,follow", alternates: [{ hreflang: "en", href: "https://nexualpha.com/noindex", path: "/noindex" }] }),
    page("/chain-a", { canonicalPath: "/chain-b", canonicalHref: "https://nexualpha.com/chain-b" }),
    page("/chain-b", { canonicalPath: "/chain-c", canonicalHref: "https://nexualpha.com/chain-c" }),
    page("/bad-title", { title: "2026 最新 OKX 邀请码与交易手续费核验指南", jsonLdErrors: [{ index: 1, error: "Unexpected token" }], jsonLdSchemas: [] }),
    page("/bad-title-en-length", { title: "x".repeat(61) }),
    page("/bad-title-cjk-length", { title: "日".repeat(33), lang: "ja" }),
    page("/bad-jsonld", { jsonLdSchemas: [{ index: 1, value: { "@context": "https://schema.org", name: "Missing type" } }] }),
    page("/bad-description", { description: "x".repeat(161) }),
    page("/news/bad-schema", { jsonLdSchemas: [{ index: 1, value: { "@context": "https://schema.org", "@type": "WebPage", url: "https://nexualpha.com/news/bad-schema" } }] }),
  ];
  const sitemap = {
    urls: [
      { path: "/a", loc: "https://nexualpha.com/a", lastmod: "2026-10-12", alternates: [{ hreflang: "en", href: "https://nexualpha.com/a" }] },
      { path: "/blocked", loc: "https://nexualpha.com/blocked", lastmod: "2026-10-12" },
      { path: "/query", loc: "https://nexualpha.com/query?ref=1", lastmod: "2026-10-12" },
      { path: "/redirect", loc: "https://nexualpha.com/redirect", lastmod: "2026-10-12" },
      { path: "/noindex", loc: "https://nexualpha.com/noindex", lastmod: "2026-10-12" },
    ],
    missingSitemaps: [],
  };
  const report = validateIndexConsistency({
    pages,
    sitemap,
    robotsContent: "User-agent: Googlebot\nUser-agent: Googlebot-News\nDisallow: /blocked$\n\nUser-agent: *\nDisallow: /\nAllow: /allowed",
    baseUrl: "https://nexualpha.com",
  });
  for (const kind of [
    "hreflang-not-reciprocal",
    "hreflang-cluster-incomplete",
    "hreflang-target-not-rendered",
    "sitemap-head-hreflang-mismatch",
    "robots-blocks-indexable",
    "robots-blocks-indexable-corpus",
    "canonical-not-self",
    "sitemap-url-redirected",
    "sitemap-url-not-index-follow",
    "noindex-in-sitemap",
    "noindex-has-hreflang",
    "canonical-chain",
    "duplicate-title",
    "duplicate-description",
    "invite-code-year-title",
    "jsonld-parse-error",
    "jsonld-invalid-node",
    "jsonld-page-type-mismatch",
    "description-over-budget",
  ]) {
    assert.ok(report.failuresByKind[kind] > 0, kind);
  }
  const titleBudgetFailures = report.failures.filter((failure) => failure.kind === "title-over-budget");
  assert.deepEqual(titleBudgetFailures.map((failure) => [failure.path, failure.length, failure.limit]), [
    ["/bad-title-en-length", 61, 60],
    ["/bad-title-cjk-length", 33, 32],
  ]);
  const llmsReport = validateIndexConsistency({ pages: [page("/llms-target")], llms: { missingFiles: ["llms.txt"], missingStaticRefs: [{ path: "/missing.json" }], pageRefs: ["/llms-target", "/llms-missing"] } });
  assert.equal(llmsReport.failuresByKind["llms-file-missing"], 1);
  assert.equal(llmsReport.failuresByKind["llms-static-ref-missing"], 1);
  assert.equal(llmsReport.failuresByKind["llms-page-ref-not-rendered"], 1);
});


test("canonical aliases do not create duplicate metadata findings", () => {
  const page = (path, overrides = {}) => ({
    path,
    canonicalPath: path,
    canonicalHref: `https://nexualpha.com${path}`,
    responseStatus: 200,
    responseUrl: `https://nexualpha.com${path}`,
    noindex: false,
    indexFollow: true,
    robots: "index,follow",
    alternates: [],
    title: `Title ${path}`,
    description: `Description ${path}`,
    lang: "en",
    jsonLdSchemas: jsonLdFor(path),
    jsonLdErrors: [],
    ...overrides,
  });
  const report = validateIndexConsistency({
    pages: [
      page("/alias", { title: "Canonical alias title", description: "Canonical alias description" }),
      page("/alias?locale=en", { canonicalPath: "/alias", canonicalHref: "https://nexualpha.com/alias", title: "Canonical alias title", description: "Canonical alias description" }),
      page("/owner-a", { title: "True duplicate owner", description: "True duplicate owner description" }),
      page("/owner-b", { title: "True duplicate owner", description: "True duplicate owner description" }),
    ],
  });
  assert.equal(report.failuresByKind["duplicate-title"], 1);
  assert.equal(report.failuresByKind["duplicate-description"], 1);
  assert.deepEqual(report.samples["duplicate-title"][0].paths, ["/owner-a", "/owner-b"]);
  assert.deepEqual(report.samples["duplicate-description"][0].paths, ["/owner-a", "/owner-b"]);
});


function policyPage(pathname, overrides = {}) {
  return {
    path: pathname, canonicalPath: pathname, canonicalHref: `https://nexualpha.com${pathname}`,
    responseStatus: 200, responseUrl: `https://nexualpha.com${pathname}`, noindex: false,
    indexFollow: true, robots: "index,follow", alternates: [], lang: "en",
    title: `Title ${pathname}`, description: `Description ${pathname}`,
    jsonLdSchemas: jsonLdFor(pathname), jsonLdErrors: [], ...overrides,
  };
}

test("reviewed home and venue titles are allowed only at their exact locale owner and current copy", () => {
  const pages = [policyPage("/", { title: homeTitle("en") }), policyPage("/zh-hans", { title: homeTitle("zh-Hans"), lang: "zh-Hans" })];
  for (const locale of ["en", "zh-Hans"]) {
    for (const slug of ["bybit", "gate-io", "okx", "hyperliquid", "deribit", "jupiter", "mexc", "backpack"]) {
      const pathname = localizedHref(`/exchanges/${slug}`, { locale });
      const title = referralSeoFor(slug, locale)?.title || strikingDistanceVenueTitle(slug, locale);
      pages.push(policyPage(pathname, { title, lang: locale }));
    }
  }
  const report = validateIndexConsistency({ pages });
  assert.equal(report.failuresByKind["title-over-budget"], undefined);
  assert.equal(report.failuresByKind["invite-code-year-title"], undefined);

  const venueTitle = referralSeoFor("bybit", "en").title;
  const chineseTitle = referralSeoFor("okx", "zh-Hans").title;
  const hostile = validateIndexConsistency({ pages: [
    policyPage("/unrelated", { title: homeTitle("en") }),
    policyPage("/", { title: `${homeTitle("en")} extra` }),
    policyPage("/exchanges/bybit", { title: `${venueTitle} extra` }),
    policyPage("/exchanges/okx", { title: venueTitle }),
    policyPage("/fr/exchanges/bybit", { title: venueTitle, lang: "en" }),
    policyPage("/zh-hans/exchanges/okx", { title: `${chineseTitle} 新增`, lang: "zh-Hans" }),
    policyPage("/zh-hans/exchanges/binance", { title: chineseTitle, lang: "zh-Hans" }),
  ] });
  assert.equal(hostile.failuresByKind["title-over-budget"], 7);
  assert.equal(hostile.failuresByKind["invite-code-year-title"], 2);
});

test("only the exact home and About entity description pair is exempt from duplicate findings", () => {
  for (const locale of ["en", "zh-Hans", "es"]) {
    const home = localizedHref("/", { locale });
    const about = localizedHref("/about", { locale });
    const description = homeDescription(locale);
    const pair = [policyPage(home, { description, lang: locale }), policyPage(about, { description, lang: locale })];
    assert.equal(validateIndexConsistency({ pages: pair }).failuresByKind["duplicate-description"], undefined, locale);
    for (const pages of [
      pair.map(page => ({ ...page, description: "An unreviewed shared description" })),
      [...pair, policyPage(localizedHref("/rates", { locale }), { description, lang: locale })],
      [pair[0], policyPage(localizedHref("/rates", { locale }), { description, lang: locale })],
      pair.map(page => ({ ...page, description: description.toUpperCase() === description ? `${description} modified` : description.toUpperCase() })),
    ]) {
      assert.equal(validateIndexConsistency({ pages }).failuresByKind["duplicate-description"], 1, locale);
    }
  }
  const description = homeDescription("en");
  const unknownLocale = [policyPage("/", { description, lang: "unknown" }), policyPage("/about", { description, lang: "unknown" })];
  assert.equal(validateIndexConsistency({ pages: unknownLocale }).failuresByKind["duplicate-description"], 1);
});

test("built public sitemap, canonical, hreflang, robots and metadata stay index-consistent", { timeout: 600_000 }, async () => {
  // The built Worker harness calls worker.fetch directly and does not bind a socket.
  assert.equal(existsSync(path.join(projectRoot, "dist", "client", "sitemap.xml")), true, "build output missing: run npm run build before the built SEO index audit");
  const report = await runSeoIndexAudit({
    root: projectRoot,
    baseUrl: "https://nexualpha.com",
    concurrency: Number(process.env.SEO_INDEX_AUDIT_CONCURRENCY || 8),
    sampleLimit: 5,
  });
  if (process.env.SEO_INDEX_AUDIT_REPORT) {
    await writeFile(process.env.SEO_INDEX_AUDIT_REPORT, `${JSON.stringify(report, null, 2)}\n`);
  }
  assert.equal(report.ok, true, JSON.stringify({ stats: report.stats, failuresByKind: report.failuresByKind, samples: report.samples }, null, 2));
});

test("request keys preserve query strings, slashes, and encoding", () => {
  assert.equal(auditUrlKey("https://nexualpha.com/a%20b/?page=2&amp;x=3"), "/a%20b/?page=2&x=3");
  assert.equal(auditUrlKey(""), null);
  assert.equal(auditUrlKey("https://evil.example/a"), null);
  assert.equal(auditUrlKey("/a#fragment"), null);
});

test("Google robot header restrictions respect scopes and restrictive directives", () => {
  assert.deepEqual(headerRobotsFlags("googlebot: noindex, nofollow"), { noindex: true, nofollow: true });
  assert.deepEqual(headerRobotsFlags("bingbot: noindex, nofollow"), { noindex: false, nofollow: false });
  assert.deepEqual(headerRobotsFlags("nofollow, googlebot: noindex"), { noindex: true, nofollow: true });
  assert.deepEqual(headerRobotsFlags("none"), { noindex: true, nofollow: true });
  const meta = parseHeadMetadata('<head><meta name="robots" content="index,follow"><meta name="googlebot" content="nofollow"></head>');
  assert.equal(meta.indexFollow, false);
  assert.equal(meta.canonicalPath, null);
});

test("malformed sitemap content fails closed", () => {
  assert.throws(() => parseSitemapXml("<html>upstream error</html>"), /Invalid sitemap XML/);
  assert.throws(() => parseSitemapXml("<urlset><url>"), /Invalid sitemap XML/);
});

test("content dates reject a build timestamp and accept omitted optional lastmod", () => {
  const page = { path: '/a', canonicalPath: '/a', canonicalHref: 'https://nexualpha.com/a', responseUrl: 'https://nexualpha.com/a', responseStatus: 200, lang: 'en', noindex: false, indexFollow: true, title: 'A', description: 'A description', alternates: [{ hreflang: 'en', href: 'https://nexualpha.com/a', path: '/a' }, { hreflang: 'x-default', href: 'https://nexualpha.com/a', path: '/a' }], jsonLdSchemas: jsonLdFor('/a'), jsonLdErrors: [] };
  const entry = { path: '/a', loc: page.canonicalHref, lastmod: '2026-10-13' };
  const options = { pages: [page], sitemap: { urls: [entry] }, expectedLastmod: () => '2026-09-20' };
  assert.equal(validateIndexConsistency(options).failuresByKind['content-lastmod-mismatch'], 1);
  assert.equal(validateIndexConsistency({ ...options, sitemap: { urls: [{ ...entry, lastmod: null }] } }).ok, true);
});

test("translated slugs form one complete reciprocal cluster", () => {
  const alternates = [{ hreflang: 'en', href: 'https://nexualpha.com/topics/english', path: '/topics/english' }, { hreflang: 'pt-BR', href: 'https://nexualpha.com/pt-br/topics/portuguese', path: '/pt-br/topics/portuguese' }, { hreflang: 'x-default', href: 'https://nexualpha.com/topics/english', path: '/topics/english' }];
  const pages = alternates.filter((row) => row.hreflang !== 'x-default').map((row) => ({ path: row.path, canonicalPath: row.path, canonicalHref: row.href, responseStatus: 200, lang: row.hreflang, indexFollow: true, noindex: false, title: row.hreflang, description: row.hreflang, alternates, jsonLdSchemas: jsonLdFor(row.path), jsonLdErrors: [] }));
  assert.equal(validateIndexConsistency({ pages }).ok, true);
});

test("unchanged sitemap content keeps its dates across build clocks", () => {
  const RealDate = globalThis.Date;
  const inventory = [{ pathname: "/exchanges/okx", template: "venue", index: true, locales: ["en"] }];
  const renderAt = (stamp) => {
    const instant = RealDate.parse(stamp);
    globalThis.Date = class extends RealDate {
      constructor(...args) { super(...(args.length ? args : [instant])); }
      static now() { return instant; }
    };
    try { return buildSitemap(inventory, []); } finally { globalThis.Date = RealDate; }
  };
  const earlier = renderAt("2026-10-13T00:00:00Z");
  const later = renderAt("2028-11-20T00:00:00Z");
  assert.equal(earlier, later);
  assert.match(earlier, /<lastmod>2026-09-15<\/lastmod>/);
});


test("language links must belong to the page hreflang set and canonicals must target indexable pages", () => {
  const html = `<html lang="en"><head><meta name="robots" content="index,follow"><title>Test</title><meta name="description" content="Test description"><link rel="canonical" href="https://nexualpha.com/a"><link rel="alternate" hreflang="en" href="https://nexualpha.com/a"></head><body><a class="nx-lang__opt" href="/a#nxa-context?market=BR" hreflang="en">English</a><a href="/ja/a" class="nx-lang__opt" hreflang="ja">Japanese</a></body></html>`;
  const metadata = parseHeadMetadata(html);
  assert.equal(metadata.languageLinks.length, 2);
  const page = { ...metadata, path: "/a", responseStatus: 200 };
  const report = validateIndexConsistency({ pages: [page] });
  assert.equal(report.failuresByKind["language-link-not-in-hreflang"], 1);
  assert.equal(validateIndexConsistency({ pages: [{ ...page, languageLinks: metadata.languageLinks.slice(0, 1) }] }).failuresByKind["language-link-not-in-hreflang"], undefined);
  const blocked = { ...page, path: "/blocked", canonicalPath: "/blocked", canonicalHref: "https://nexualpha.com/blocked", noindex: true, alternates: [], languageLinks: [] };
  const duplicate = { ...page, canonicalPath: "/blocked", canonicalHref: "https://nexualpha.com/blocked", languageLinks: [] };
  assert.equal(validateIndexConsistency({ pages: [duplicate, blocked] }).failuresByKind["canonical-target-noindex"], 1);
});


test("noindex metadata clears stale language alternates from an existing hydration payload", async () => {
  const { default: worker } = await import("../worker/index.js");
  const staleState = { pathname: "/glossary/airdrop", locale: "it", version: "nexualpha-prerender-v1", seoAlternates: [{ hreflang: "it", href: "https://nexualpha.com/it/glossary/airdrop" }] };
  const shell = `<html><head><title>Old</title></head><body><div id="root"><main><h1>Airdrop</h1></main></div><script type="application/json" id="nexualpha-prerender-state">${JSON.stringify(staleState)}</script></body></html>`;
  const response = await worker.fetch(new Request("https://nexualpha.com/it/glossary/airdrop"), {
    ASSETS: { fetch: async request => new URL(request.url).pathname === "/index.html" ? new Response(shell, { headers: { "content-type": "text/html" } }) : new Response("missing", { status: 404 }) },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.equal(parseHeadMetadata(html).noindex, true);
  const payload = html.match(/id="nexualpha-prerender-state">([^<]*)<\/script>/)?.[1];
  assert.ok(payload);
  assert.deepEqual(JSON.parse(payload).seoAlternates, []);
});
