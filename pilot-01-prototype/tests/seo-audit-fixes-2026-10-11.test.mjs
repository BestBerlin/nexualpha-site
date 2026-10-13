// SEO/GEO audit 2026-10-11 fixes (docs/company/seo-geo-audit-2026-10-11.md, owner-approved 2026-10-11):
// one hreflang source for every sitemap, NewsArticle image, real lastmod, locale news-listing threshold, answer-first
// article order, no placeholder copy in SSR, per-edition read time, robots /go/ in every group, noindex /embed/*,
// accurate llms*.txt, and the Turkish percent dative suffix.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import worker, { renderLiveNewsSitemap, renderLocaleSitemap, renderNewsLibrarySitemap, routeMetadata } from "../worker/index.js";
import { buildNewsSeoFiles } from "../scripts/update-news-seo.mjs";
import { buildSitemap, routeInventory, routeLastmod } from "../scripts/generate-prerender-manifest.mjs";
import { sitemapHreflangAlternates } from "../scripts/sitemap-publication-policy.mjs";
import {
  NEWS_LISTING_MIN_NATIVE_ARTICLES,
  hreflangAlternates,
  newsArticleSeoLocales,
  newsListingIndexableLocales,
  newsListingPublishedLocales,
  normalizeNewsFeed,
} from "../src/data/news-feed-client.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { estimateReadMinutes, newsReadTimes } from "../src/data/news-read-time.js";
import { dropEmptyArticleHeadings } from "../src/components/v3/news/article-reading-sections.js";
import { trDativeSuffix, trPercentDative } from "../src/data/tr-percent.js";
import { referralSeoFor } from "../src/data/referral-seo.js";
import { buildPartnersFeed } from "../src/data/partners-feed.js";
import { brandSlogan } from "../src/data/brand-slogan.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const ORIGIN = "https://nexualpha.com";

// ---------- fixture feed: 6 articles with a native Spanish edition, 3 with Turkish ----------
const body = (words, lead = "## The short answer\n\nThe answer comes first.") => `${lead}\n\n## Details\n\n${"word ".repeat(words).trim()}`;
function article(index, extraLocales = []) {
  const n = String(index).padStart(2, "0");
  const locales = ["en", "zh-Hans", ...extraLocales];
  const text = (prefix) => Object.fromEntries(locales.map((locale) => [locale, `${prefix} ${n} ${locale}`]));
  return {
    slug: `audit-article-${n}`,
    status: "PUBLISHED",
    category: "research",
    categoryName: { en: "Research", "zh-Hans": "研究" },
    publishedAt: new Date(Date.UTC(2026, 8, 20 + index, 12)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, 8, 21 + index, 12)).toISOString(),
    readTime: "16 min",
    author: "NexuAlpha Research Desk",
    title: text("Title"),
    summary: text("Summary sentence."),
    content: Object.fromEntries(locales.map((locale) => [locale, locale === "zh-Hans" ? `## 简短回答\n\n${"字".repeat(4500)}` : body(2300)])),
    sources: [{ id: "s", url: "https://example.com/source", publisher: "Example", title: "Source" }],
    relatedVenues: ["okx"],
    seo: { noindex: false },
    availableLocales: locales,
  };
}
const feedArticles = Array.from({ length: 6 }, (_, index) => article(index, index < 3 ? ["es", "tr"] : ["es"]));
const articles = normalizeNewsFeed({ articles: feedArticles });
const feedText = JSON.stringify({ generatedAt: "2026-10-11T08:00:00Z", articles: feedArticles });
const shell = "<!doctype html><html><head><title>Shell</title></head><body><div id=\"root\"></div></body></html>";
const envFor = (text) => ({ ASSETS: { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/content/news-feed.json") return new Response(text, { headers: { "content-type": "application/json" } });
  if (pathname === "/index.html") return new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } });
  return new Response("missing", { status: 404 });
} } });
const env = envFor(feedText);

const altSet = (alternates) => (alternates || []).map((alt) => `${alt.hreflang} ${alt.href}`).sort();
const xmlEntries = (xml) => Object.fromEntries([...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => [
  block.match(/<loc>([^<]+)<\/loc>/)[1].replaceAll("&amp;", "&"),
  {
    alternates: [...block.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)" \/>/g)].map(([, hreflang, href]) => `${hreflang} ${href.replaceAll("&amp;", "&")}`).sort(),
    lastmod: block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] || null,
  },
]));
const splitXmlEntries = (files) => Object.assign({}, ...Object.values(files.sitemapFiles || {}).map(xmlEntries));

// ---------- #1 one hreflang source ----------
test("#1 every sitemap entry that carries hreflang matches the page head; other routes carry none in sitemap.xml", async () => {
  const files = buildNewsSeoFiles({ generatedAt: "2026-10-11T08:00:00Z", articles: feedArticles });
  const built = splitXmlEntries(files);
  const library = xmlEntries(renderNewsLibrarySitemap(articles));
  const live = xmlEntries(renderLiveNewsSitemap(articles, Date.parse("2026-09-27T00:00:00Z")));
  let compared = 0;
  for (const [loc, entry] of Object.entries(built)) {
    const url = new URL(loc);
    const isNews = /^\/(?:[a-z-]+\/)?news(?:\/|$)/.test(url.pathname);
    if (!isNews) {
      assert.deepEqual(entry.alternates, [], `${loc}: non-news hreflang is owned by the page and /locale-sitemap.xml`);
      continue;
    }
    const meta = await routeMetadata(url, env);
    assert.equal(meta.robots, "index,follow", loc);
    assert.deepEqual(entry.alternates, altSet(meta.alternates), `${loc}: sitemap.xml vs page`);
    for (const other of [library, live]) if (other[loc]) assert.deepEqual(other[loc].alternates, entry.alternates, `${loc}: sitemaps disagree`);
    compared += 1;
  }
  assert.ok(compared >= 12, `compared ${compared} news URLs`);
  // locale-sitemap.xml (worker routeMetadata) agrees with the page for every listed URL.
  const locale = xmlEntries(await renderLocaleSitemap({}));
  for (const loc of Object.keys(locale).filter((_, i) => i % 40 === 0)) {
    const meta = await routeMetadata(new URL(loc), {});
    assert.deepEqual(locale[loc].alternates, altSet(meta.alternates), loc);
  }
});

test("#1 the build sitemap uses the same helpers, and stale flat sitemap blocks are not carried into split children", () => {
  const xml = buildSitemap(routeInventory(articles), articles);
  for (const [loc, entry] of Object.entries(xmlEntries(xml))) {
    const pathname = new URL(loc).pathname.replace(/^\/(?:zh-hans|zh-hant|es|pt-br|fr|de|it|ja|ko|ru|tr|id-id|vi|ar)(?=\/|$)/, "") || "/";
    const art = articles.find((item) => pathname === `/news/${item.slug}`);
    assert.deepEqual(entry.alternates, altSet(sitemapHreflangAlternates(pathname, { article: art, newsArticles: articles })), loc);
  }
  const stale = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n  <url>\n    <loc>${ORIGIN}/compare/binance-vs-bybit</loc>\n    <xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}/compare/binance-vs-bybit" />\n    <xhtml:link rel="alternate" hreflang="ja" href="${ORIGIN}/ja/compare/binance-vs-bybit" />\n    <lastmod>2026-10-11</lastmod>\n  </url>\n  <url>\n    <loc>${ORIGIN}/legacy-page</loc>\n    <xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}/legacy-page" />\n    <lastmod>2026-09-01</lastmod>\n  </url>\n  <url>\n    <loc>${ORIGIN}/embed/calculator</loc>\n    <lastmod>2026-10-11</lastmod>\n  </url>\n</urlset>\n`;
  const result = buildNewsSeoFiles({ generatedAt: "2026-10-11T08:00:00Z", articles: feedArticles }, { existingSitemap: stale });
  const split = splitXmlEntries(result);
  assert.match(result.sitemap, /<sitemapindex/);
  assert.deepEqual(split[`${ORIGIN}/compare/binance-vs-bybit`].alternates, []);
  assert.equal(split[`${ORIGIN}/legacy-page`], undefined, "legacy URLs are not carried into the new split sitemap index");
  assert.equal(split[`${ORIGIN}/embed/calculator`], undefined, "#13: the embed widget is not listed");
});

test("#1 hreflangAlternates is the page head shape: one link per edition plus x-default on the first", () => {
  assert.deepEqual(hreflangAlternates(["en", "es"], (l) => l), [{ hreflang: "en", href: "en" }, { hreflang: "es", href: "es" }, { hreflang: "x-default", href: "en" }]);
  assert.deepEqual(hreflangAlternates([], (l) => l), []);
});

// ---------- #2 NewsArticle image ----------
test("#2 NewsArticle JSON-LD carries the article's 1200x630 social card in the worker head and the SSR head", async () => {
  const slug = articles[0].slug;
  for (const [pathname, locale] of [[`/news/${slug}`, "en"], [`/es/news/${slug}`, "es"]]) {
    const meta = await routeMetadata(new URL(`${ORIGIN}${pathname}`), env);
    const schema = meta.schema.find((node) => node["@type"] === "NewsArticle");
    const expected = [{ "@type": "ImageObject", url: `${ORIGIN}/og/news/${slug}.png${locale === "en" ? "" : `?locale=${locale}`}`, width: 1200, height: 630 }];
    assert.deepEqual(schema.image, expected, pathname);
    assert.equal(meta.image, expected[0].url, `${pathname}: same URL as og:image`);
    assert.equal(schema.author["@type"], "Organization", "author stays the desk until a named author exists in data");
    const ssr = computeRouteSeo({ url: pathname, locale, article: articles[0], newsArticles: articles, route: { name: "newsDetail", slug } });
    const ssrSchema = (ssr.schemas || ssr.schema || []).flat().find((node) => node?.["@type"] === "NewsArticle");
    assert.deepEqual(ssrSchema.image, expected, `${pathname}: SSR head parity`);
  }
});

// ---------- #3 lastmod ----------
test("#3 sitemap lastmod is each route's own content date, not the publish/build date", () => {
  const files = buildNewsSeoFiles({ generatedAt: "2026-10-11T08:00:00Z", articles: feedArticles });
  const entries = splitXmlEntries(files);
  const inventory = routeInventory(articles);
  const route = (pathname) => inventory.find((item) => item.pathname === pathname);
  assert.equal(entries[`${ORIGIN}/exchanges/okx`].lastmod, routeLastmod(route("/exchanges/okx"), null).slice(0, 10));
  assert.notEqual(entries[`${ORIGIN}/exchanges/okx`].lastmod, "2026-10-11");
  assert.equal(entries[`${ORIGIN}/news/${articles[0].slug}`].lastmod, articles[0].updatedAt.slice(0, 10));
  const newest = articles.map((item) => item.updatedAt).sort().at(-1).slice(0, 10);
  assert.equal(entries[`${ORIGIN}/`].lastmod, newest, "home: newest published article");
  assert.equal(entries[`${ORIGIN}/news`].lastmod, newest);
  // Only routes whose own content date is the feed day may carry it (the bybit-alternatives topic was reviewed that day).
  const feedDay = Object.entries(entries).filter(([, entry]) => entry.lastmod === "2026-10-11").map(([loc]) => new URL(loc).pathname.replace(/^\/[a-z]{2}(?:-[a-z]{2,4})?(?=\/)/, ""));
  for (const pathname of feedDay) assert.equal(String(routeLastmod(route(pathname), null)).slice(0, 10), "2026-10-11", pathname);
  assert.ok(feedDay.length < 5, `only real same-day routes: ${feedDay.join(", ")}`);
});

// ---------- #4 locale news listings ----------
test(`#4 a locale news listing is indexable only with >= ${NEWS_LISTING_MIN_NATIVE_ARTICLES} native editions`, async () => {
  assert.equal(NEWS_LISTING_MIN_NATIVE_ARTICLES, 5);
  assert.deepEqual(newsListingPublishedLocales(articles), ["en", "zh-Hans", "es", "tr"]);
  assert.deepEqual(newsListingIndexableLocales(articles), ["en", "zh-Hans", "es"], "6 es, 3 tr editions");
  assert.deepEqual(newsListingIndexableLocales(articles.slice(0, 4)), ["en"], "4 editions each: only English");
  for (const [pathname, robots] of [["/es/news", "index,follow"], ["/tr/news", "noindex,follow"], ["/news", "index,follow"], ["/zh-hans/news", "index,follow"]]) {
    const meta = await routeMetadata(new URL(`${ORIGIN}${pathname}`), env);
    assert.equal(meta.robots, robots, pathname);
    assert.equal(meta.alternates.length > 0, robots === "index,follow", `${pathname}: hreflang only when indexable`);
    if (robots === "index,follow") assert.deepEqual(meta.alternates.map((alt) => alt.hreflang), ["en", "zh-Hans", "es", "x-default"]);
  }
  const trMeta = await routeMetadata(new URL(`${ORIGIN}/tr/news`), env);
  assert.equal(trMeta.canonical, `${ORIGIN}/tr/news`, "the thin edition keeps its self canonical (noindex,follow, no cross-canonical)");
  const library = renderNewsLibrarySitemap(articles);
  assert.match(library, /<loc>https:\/\/nexualpha\.com\/es\/news<\/loc>/);
  assert.doesNotMatch(library, /\/tr\/news/);
  // At the threshold the listing turns indexable automatically.
  const two = [...feedArticles, article(6, ["tr"]), article(7, ["tr"])];
  const twoEnv = envFor(JSON.stringify({ articles: two }));
  assert.equal((await routeMetadata(new URL(`${ORIGIN}/tr/news`), twoEnv)).robots, "index,follow");
  assert.match(renderNewsLibrarySitemap(normalizeNewsFeed({ articles: two })), /<loc>https:\/\/nexualpha\.com\/tr\/news<\/loc>/);
  const inventory = routeInventory(articles).find((route) => route.pathname === "/news");
  assert.deepEqual(inventory.locales, ["en", "zh-Hans", "es"], "sitemap.xml lists the indexable editions");
  assert.deepEqual(inventory.prerenderLocales, ["en", "zh-Hans", "es", "tr"], "every published edition is still prerendered");
});

// ---------- #5 + #6 + #7 rendered pages ----------
function renderEntry(source) {
  const dir = mkdtempSync(path.join(root, "tests/.tmp-audit-fixes-"));
  try {
    writeFileSync(path.join(dir, "entry.jsx"), source);
    execFileSync(path.join(root, "node_modules/.bin/esbuild"), [path.join(dir, "entry.jsx"), "--bundle", "--platform=node", "--format=cjs", `--outfile=${dir}/bundle.cjs`, "--loader:.css=empty", "--loader:.svg=text", "--loader:.webp=file", "--log-level=error"], { cwd: root });
    return JSON.parse(execFileSync(process.execPath, [path.join(dir, "bundle.cjs")], { cwd: root, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 }));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("#5 #7 the article's short answer is the first content after the byline; read time is the shown edition's own", () => {
  const legacy = { ...feedArticles[0], content: { en: `## The short answer\n\nAnswer first.\n\n## Control Notes\n\n## Details\n\n${"word ".repeat(2300)}`, "zh-Hans": `## 简短回答\n\n${"字".repeat(4500)}` } };
  const out = renderEntry(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { NewsDetailPage } from "../../src/components/v3/news/NewsDetailPage.jsx";
    const article = ${JSON.stringify(legacy)};
    const out = {};
    for (const locale of ["en", "es", "zh-Hans", "tr"]) out[locale] = renderToStaticMarkup(React.createElement(NewsDetailPage, { slug: article.slug, locale, market: "unknown", product: "unknown", initialArticles: [article] }));
    console.log(JSON.stringify(out));
  `);
  for (const [locale, html] of Object.entries(out)) {
    const h1 = html.indexOf("<h1");
    const answer = html.indexOf('data-lead-kind="short-answer"');
    const decision = html.indexOf("news-detail__first-decision");
    assert.ok(h1 >= 0 && answer > h1, `${locale}: short answer after the H1`);
    assert.ok(decision > answer, `${locale}: the generic decision block follows the short answer`);
    assert.ok(decision > html.indexOf('class="news-detail__content"'), `${locale}: the rail follows the article body in the DOM`);
    assert.doesNotMatch(html, /Control Notes/, `${locale}: an empty section heading is not rendered`);
  }
  assert.match(out.en, /class="news-detail__readtime">11 min</, "2,300 English words / 230 = 10 -> 11 with the lead lines");
  assert.match(out["zh-Hans"], /class="news-detail__readtime">11 分/, "4,504 Han characters / 450, not the English length");
});

test("#6 home and venue SSR render no placeholder or internal workflow copy", () => {
  const out = renderEntry(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { CampaignRadar } from "../../src/components/v3/CampaignRadar.jsx";
    import { MarketFearGreedPanel } from "../../src/components/v3/MarketFearGreedPanel.jsx";
    import { TelegramBotHub } from "../../src/components/v3/TelegramBotHub.jsx";
    import { VenueDetailPage } from "../../src/components/v3/VenueDetailPageStatic.jsx";
    import { venueDatabase } from "../../src/data/venue-database.js";
    const venues = Object.values(venueDatabase);
    const copy = { common: { dimension: "Dimension" }, assetCapabilities: { none: "Pending source review" } };
    const out = {};
    for (const locale of ["en", "zh-Hans", "es", "tr", "ar"]) {
      out["home:" + locale] = [CampaignRadar, MarketFearGreedPanel, TelegramBotHub].map((C) => renderToStaticMarkup(React.createElement(C, { locale }))).join("\\n");
      out["fear:" + locale] = renderToStaticMarkup(React.createElement(MarketFearGreedPanel, { locale }));
      for (const slug of ["okx", "bitget"]) out[slug + ":" + locale] = renderToStaticMarkup(React.createElement(VenueDetailPage, { copy, locale, venue: venueDatabase[slug], venues, updates: [], market: "unknown", product: "unknown" }));
    }
    console.log(JSON.stringify(out));
  `);
  for (const [key, html] of Object.entries(out)) {
    const visible = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");
    assert.doesNotMatch(visible, /Data unavailable|Pending official-source (?:review|verification)|Telegram handoff|Telegram visitors get|is publishable|No publishable update|ANSWER-FIRST ROUTES/, key);
    assert.doesNotMatch(html, /<h([2-4])[^>]*>\s*<\/h\1>/, `${key}: no empty heading`);
    if (key.startsWith("fear:")) assert.equal(html, "", `${key}: no feed, no panel`);
  }
  for (const slug of ["okx", "bitget"]) {
    const html = out[`${slug}:en`];
    assert.doesNotMatch(html, /v3-por-status-pill|v3-por-metrics|v3-por-coins-grid/, `${slug}: unverified PoR shows no metrics`);
    assert.match(html, /id="proof-of-reserves"/, `${slug}: the PoR explanation and self-check guide stay`);
    assert.match(html, /<h3 class="v3-profile-sources-group__heading">[^<]+<\/h3>[\s\S]*?<h4 class="v3-profile-account-section__heading">/, `${slug}: chapter h3, sub-sections h4`);
  }
});

test("#6 empty article headings are dropped, headings with sub-sections kept", () => {
  assert.equal(dropEmptyArticleHeadings("## A\n\n## B\n\ntext\n\n## C\n\n### c\n\nx\n\n## End"), "## B\n\ntext\n\n## C\n\n### c\n\nx");
  assert.equal(dropEmptyArticleHeadings("```\n## not a heading\n```\n\n## Kept\n\ntext"), "```\n## not a heading\n```\n\n## Kept\n\ntext");
});

// ---------- #7 read time ----------
test("#7 read time per edition: words/230 for space-separated scripts, Han/Kana characters/450 for CJK", () => {
  assert.equal(estimateReadMinutes("word ".repeat(2300), "en"), 10);
  assert.equal(estimateReadMinutes("palabra ".repeat(1150), "es"), 5);
  assert.equal(estimateReadMinutes("字".repeat(4500), "zh-Hans"), 10);
  assert.equal(estimateReadMinutes("あ".repeat(900), "ja"), 2);
  assert.equal(estimateReadMinutes("[link text](https://example.com/very/long/url) word", "en"), 1);
  assert.deepEqual(newsReadTimes({ en: "word ".repeat(1220), "zh-Hans": "字".repeat(7000) }), { en: "6 min", "zh-Hans": "16 min" }, "audit example: 1,220 words read in 6 min, not 16");
  const first = articles.find((item) => item.slug === "audit-article-00");
  assert.equal(first.readTime, "11 min", "normalized feed recomputes the stored 16 min value from the English body");
  assert.deepEqual(Object.keys(first.readTimeByLocale).sort(), ["en", "es", "tr", "zh-Hans"]);
  const importer = readFileSync(path.join(root, "scripts/import-nexualpha-content.mjs"), "utf8");
  assert.match(importer, /readTimeByLocale: newsReadTimes\(/);
  assert.doesNotMatch(importer, /zhChars \/ 450/);
});

// ---------- #8 robots ----------
test("#8 every crawler-specific robots group repeats the * group's Disallow lines", async () => {
  const robots = await readFile(path.join(root, "public/robots.txt"), "utf8");
  const groups = robots.split(/\n\s*\n/).filter((group) => /^User-agent:/m.test(group));
  const star = groups.find((group) => /^User-agent: \*$/m.test(group));
  const disallows = star.match(/^Disallow: .+$/gm);
  assert.deepEqual(disallows, ["Disallow: /go/"]);
  assert.ok(groups.length >= 12);
  for (const group of groups) for (const line of disallows) assert.ok(group.includes(line), `${group.split("\n").find((l) => l.startsWith("User-agent"))} lacks ${line}`);
});

// ---------- #9 embed ----------
test("#9 /embed/* is noindex in the meta tag and the X-Robots-Tag header, and not in the route inventory index", async () => {
  const meta = await routeMetadata(new URL(`${ORIGIN}/embed/calculator`), {});
  assert.equal(meta.robots, "noindex,follow");
  assert.deepEqual(meta.alternates, []);
  const response = await worker.fetch(new Request(`${ORIGIN}/embed/calculator`, { headers: { accept: "text/html" } }), env);
  assert.equal(response.headers.get("x-robots-tag"), "noindex,follow");
  assert.match(await response.text(), /<meta name="robots" content="noindex,follow"/);
  assert.equal(routeInventory(articles).find((route) => route.pathname === "/embed/calculator").index, false);
  assert.equal(computeRouteSeo({ url: "/embed/calculator", locale: "en", route: { name: "embedCalculator" } }).robots, "noindex,follow");
});

// ---------- #10 llms ----------
test("#10 llms*.txt describe the site accurately: slogan-led summary, partner codes with disclosure, no code names", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "llms-audit-"));
  try {
    execFileSync(process.execPath, [path.join(root, "scripts/generate-public-llms.mjs")], { cwd: root, env: { ...process.env, NEXUALPHA_LLMS_OUTPUT_DIR: dir }, stdio: "pipe" });
    const partners = buildPartnersFeed().partners.filter((partner) => partner.inviteCode);
    for (const file of ["llms.txt", "llms-small.txt", "llms-full.txt"]) {
      const text = await readFile(path.join(dir, file), "utf8");
      const [h1, , summary] = text.split("\n");
      assert.equal(h1, "# NexuAlpha", file);
      assert.ok(summary.startsWith(`> ${brandSlogan("en").replace(/\.$/, "")}`), `${file}: summary starts with slogan A`);
      assert.match(summary, /independent crypto exchange research/);
      assert.match(summary, /disclosed partner links and invite codes/);
      assert.match(text, /Partner links may earn NexuAlpha a platform-paid commission at no extra cost to you\./, `${file}: disclosure wording`);
      // llms-small lists the partners with a published fee-return share and points to the full list.
      for (const partner of partners.filter((item) => file !== "llms-small.txt" || item.share > 0)) assert.ok(text.includes(`${partner.name}: invite code ${partner.inviteCode};`), `${file}: ${partner.name}`);
      if (file === "llms-small.txt") assert.match(text, /Every partner invite code: https:\/\/nexualpha\.com\/llms\.txt/);
      assert.doesNotMatch(text, /\bWave\d+\b/, `${file}: internal code names`);
      assert.doesNotMatch(text, /neutral (?:research|crypto trading-venue) directory|referral codes[^.\n]*(?:are|is) (?:intentionally )?omitted|intentionally omitted from/i, file);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  const registration = await readFile(path.join(root, "src/components/v3/RegistrationCard.jsx"), "utf8");
  // Owner rule 2026-10-12: the on-site disclosure moved to the footer and legal pages; the registration card has none.
  assert.ok(!registration.includes("disclosureShort") && !registration.includes("platform-paid commission"), "registration card carries no commission disclosure");
});

// ---------- Turkish percent dative (lead request 2026-10-11) ----------
test("Turkish percent dative follows the spoken number: %40'a, %25'e, %50'ye", () => {
  const expected = { 10: "%10'a", 20: "%20'ye", 25: "%25'e", 30: "%30'a", 40: "%40'a", 50: "%50'ye", 60: "%60'a" };
  for (const [n, value] of Object.entries(expected)) assert.equal(trPercentDative(Number(n)), value, n);
  assert.equal(trDativeSuffix(100), "'e");
  assert.equal(trDativeSuffix("12.5"), "'e");
  for (const slug of ["okx", "bitget", "binance"]) {
    const seo = referralSeoFor(slug, "tr");
    if (!seo) continue;
    assert.doesNotMatch(`${seo.title} ${seo.description}`, /%(?:40|60)'e|%25'a|%50'e/, slug);
  }
  const okx = referralSeoFor("okx", "tr");
  if (okx) assert.match(okx.description, /%40'a varan/); // CTR pass 2026-10-13: the share moved to the description
  const og = readFileSync(path.join(root, "server/og-image.mjs"), "utf8");
  assert.match(og, /rebate: "İade payı \{pct\} kadar"/);
  assert.match(og, /trPercentDative\(pct\)/);
});
