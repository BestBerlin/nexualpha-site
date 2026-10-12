// Brand entity (2026-10-11): one Organization @id for the publisher on every page type, the Research Desk as the
// editorial team, /about and /editorial-policy in all 15 locales, and the article byline that links to both.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { routeMetadata, metaDescriptionLimit } from "../worker/index.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { normalizeNewsFeed } from "../src/data/news-feed-client.js";
import { DATA_PAGE_PATHS } from "../src/data/market-data-pages.js";
import {
  ABOUT_PATH, BRAND, BRAND_LOCALES, BRAND_PAGE_PATHS, BRAND_PAGE_SEO, BRAND_SAME_AS, EDITORIAL_POLICY_PATH, ENTITY_REVIEWED_AT,
  NEXUALPHA_PUBLISHER, ORGANIZATION_ID, RESEARCH_DESK, RESEARCH_DESK_ID, RESEARCH_DESK_NAME, WEBSITE_ID, brandPageMeta, organizationSchema,
} from "../src/data/brand-entity.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar"];
const env = { ASSETS: { fetch: async () => new Response("missing", { status: 404 }) } };
const graphOf = (metadata) => (Array.isArray(metadata.schema) ? metadata.schema : [metadata.schema]).filter(Boolean);
const findType = (graph, type) => graph.find((node) => node?.["@type"] === type);

test("brand entity facts: one Organization @id, logo ImageObject, Telegram sameAs, Research Desk department, no people", () => {
  assert.equal(ORGANIZATION_ID, "https://nexualpha.com/#organization");
  assert.equal(RESEARCH_DESK_ID, "https://nexualpha.com/about#research-desk");
  const org = organizationSchema("en");
  assert.equal(org["@id"], ORGANIZATION_ID);
  assert.equal(org.logo["@type"], "ImageObject");
  assert.match(org.logo.url, /\/brand\/nexualpha\/nexualpha-round\.svg$/);
  for (const url of ["https://t.me/NexuAlphaClub", "https://t.me/NexuAlphaGlobal", "https://t.me/NexuAlphaAssistantBot", "https://app.nexualpha.com/"]) {
    assert.ok(org.sameAs.includes(url), url);
  }
  assert.deepEqual(org.sameAs, [...BRAND_SAME_AS]);
  assert.equal(org.email, "Bestberlin@nexualpha.com");
  assert.equal(org.department["@id"], RESEARCH_DESK_ID);
  assert.equal(org.department["@type"], "Organization", "the desk is a team, never a fabricated Person");
  assert.equal(org.department.parentOrganization["@id"], ORGANIZATION_ID);
  assert.equal(org.publishingPrinciples, "https://nexualpha.com/editorial-policy");
  assert.equal(org.ownershipFundingInfo, "https://nexualpha.com/about#funding");
  assert.ok(Array.isArray(org.knowsAbout) && org.knowsAbout.length >= 5);
  const json = JSON.stringify(org);
  assert.doesNotMatch(json, /"@type":"Person"/);
  assert.doesNotMatch(json, /award|founder|address/i);
  assert.equal(NEXUALPHA_PUBLISHER["@id"], ORGANIZATION_ID);
  assert.equal(RESEARCH_DESK.name, RESEARCH_DESK_NAME);
  assert.equal(RESEARCH_DESK.url, RESEARCH_DESK_ID);
  assert.match(ENTITY_REVIEWED_AT, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual([...BRAND_LOCALES].sort(), [...LOCALES, "ur", "uk"].sort());
  assert.ok(BRAND.telegram.channelZh && BRAND.telegram.channelEn && BRAND.telegram.bot && BRAND.telegram.miniApp);
});

test("/about and /editorial-policy route metadata in all 15 locales: indexable, self-canonical, length-bounded, 16 hreflang, entity JSON-LD", async () => {
  for (const pathname of BRAND_PAGE_PATHS) {
    assert.deepEqual(Object.keys(BRAND_PAGE_SEO[pathname]).sort(), [...LOCALES, "ur", "uk"].sort(), `${pathname} copy locales`);
    for (const locale of LOCALES) {
      const loc = `https://nexualpha.com${localizedPath(pathname, locale)}`;
      const meta = await routeMetadata(new URL(loc), env);
      assert.equal(meta.status, 200, loc);
      assert.equal(meta.robots, "index,follow", loc);
      assert.equal(meta.canonical, loc, loc);
      assert.equal(meta.locale, locale, loc);
      assert.equal(meta.title, brandPageMeta(pathname, locale).title, loc);
      assert.ok(meta.title.length <= 65, `${loc} title ${meta.title.length}`);
      assert.ok(meta.description.length <= metaDescriptionLimit(locale), `${loc} description ${meta.description.length}`);
      assert.ok(meta.description.length >= 40, `${loc} description too short`);
      assert.equal(meta.alternates.length, 16, loc);
      assert.ok(meta.alternates.some((a) => a.hreflang === "x-default" && a.href === `https://nexualpha.com${pathname}`), loc);
      assert.ok(meta.alternates.some((a) => a.hreflang === locale && a.href === loc), loc);
      const graph = graphOf(meta);
      const page = graph[0];
      assert.equal(page["@context"], "https://schema.org", loc);
      assert.equal(page["@type"], pathname === ABOUT_PATH ? "AboutPage" : "WebPage", loc);
      assert.equal(page.url, loc, loc);
      assert.equal(page.inLanguage, locale, loc);
      assert.equal(page.dateModified, ENTITY_REVIEWED_AT, loc);
      assert.equal(page.publisher["@id"], ORGANIZATION_ID, loc);
      assert.equal(page.isPartOf["@id"], WEBSITE_ID, loc);
      if (pathname === ABOUT_PATH) {
        assert.equal(page.mainEntity["@id"], ORGANIZATION_ID, loc);
        assert.equal(page.mainEntity.department["@id"], RESEARCH_DESK_ID, loc);
      } else {
        assert.equal(page.about["@id"], ORGANIZATION_ID, loc);
        assert.equal(page.author["@id"], RESEARCH_DESK_ID, loc);
      }
      // the client router mirrors the Worker
      const client = computeRouteSeo({ url: loc, locale });
      assert.equal(client.title, meta.title, `${loc} client title`);
      assert.equal(client.description, meta.description, `${loc} client description`);
      assert.equal(client.robots, "index,follow", `${loc} client robots`);
      assert.equal(client.schemas?.[0]?.["@type"], page["@type"], `${loc} client schema`);
      assert.equal(client.schemas?.[0]?.publisher?.["@id"], ORGANIZATION_ID, `${loc} client publisher`);
    }
  }
});

test("home, article and data pages emit the same Organization @id and Research Desk author", async () => {
  // home: WebSite + Organization
  const home = graphOf(await routeMetadata(new URL("https://nexualpha.com/"), env));
  const website = findType(home, "WebSite");
  const organization = findType(home, "Organization");
  assert.equal(website["@id"], WEBSITE_ID);
  assert.equal(website.publisher["@id"], ORGANIZATION_ID);
  assert.equal(organization["@id"], ORGANIZATION_ID);
  assert.equal(organization.department["@id"], RESEARCH_DESK_ID);
  assert.deepEqual(organization.sameAs, [...BRAND_SAME_AS]);
  const homeZh = graphOf(await routeMetadata(new URL("https://nexualpha.com/zh-hans"), env));
  assert.equal(findType(homeZh, "Organization")["@id"], ORGANIZATION_ID);
  const homeClient = computeRouteSeo({ url: "https://nexualpha.com/", locale: "en" });
  assert.equal(findType(homeClient.schemas, "Organization")["@id"], ORGANIZATION_ID);
  assert.equal(findType(homeClient.schemas, "WebSite")["@id"], WEBSITE_ID);

  // data pages: Dataset creator (desk) + publisher (organization)
  for (const pathname of DATA_PAGE_PATHS) {
    const dataset = findType(graphOf(await routeMetadata(new URL(`https://nexualpha.com${pathname}`), env)), "Dataset");
    assert.equal(dataset.creator["@id"], RESEARCH_DESK_ID, pathname);
    assert.equal(dataset.publisher["@id"], ORGANIZATION_ID, pathname);
  }

  // article: NewsArticle author (desk) + publisher (organization), from the repository feed
  const feedText = await readFile(path.join(root, "public/content/news-feed.json"), "utf8");
  const articles = normalizeNewsFeed(JSON.parse(feedText));
  const article = articles.find((item) => item.seo?.noindex === false && item.author === RESEARCH_DESK_NAME) || articles[0];
  assert.ok(article, "feed has at least one article");
  const newsEnv = { ASSETS: { fetch: async (request) => new URL(request.url).pathname === "/content/news-feed.json"
    ? new Response(feedText, { headers: { "content-type": "application/json" } })
    : new Response("missing", { status: 404 }) } };
  const articleMeta = await routeMetadata(new URL(`https://nexualpha.com/news/${article.slug}`), newsEnv);
  assert.equal(articleMeta.status, 200);
  const newsArticle = findType(graphOf(articleMeta), "NewsArticle");
  assert.ok(newsArticle, "NewsArticle schema");
  assert.equal(newsArticle.author["@id"], RESEARCH_DESK_ID);
  assert.equal(newsArticle.author.name, RESEARCH_DESK_NAME);
  assert.equal(newsArticle.author.parentOrganization["@id"], ORGANIZATION_ID);
  assert.equal(newsArticle.publisher["@id"], ORGANIZATION_ID);
  assert.equal(newsArticle.publisher.logo["@type"], "ImageObject");
  assert.equal(newsArticle.reviewedBy["@id"], RESEARCH_DESK_ID);
  // every node round-trips as JSON without undefined holes
  for (const graph of [home, graphOf(articleMeta)]) {
    for (const node of graph) {
      assert.ok(node["@type"], "node has @type");
      assert.doesNotMatch(JSON.stringify(node), /undefined|\[object Object\]/);
    }
  }
});

test("worker serves /about and /editorial-policy in every locale with the static-route marker and renders the brand page body when a renderer exists", async () => {
  const worker = (await import("../worker/index.js")).default;
  const shell = '<!doctype html><html lang="en"><head><title>Base</title><meta name="description" content="Base"></head><body><div id="root"></div></body></html>';
  const assets = { async fetch(request) {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/index.html") return new Response(shell, { headers: { "content-type": "text/html" } });
    return new Response("missing", { status: 404 });
  } };
  const rendered = [];
  const renderEnv = { ASSETS: assets, NEWS_SSR_RENDER: async (href) => { rendered.push(href); return '<main class="nxb nxb--about"><header class="nxb-hero"><h1>About</h1></header><section id="research-desk"></section></main>'; } };
  for (const pathname of BRAND_PAGE_PATHS) {
    for (const locale of ["en", "zh-Hans", "ar"]) {
      const url = `https://nexualpha.com${localizedPath(pathname, locale)}`;
      const response = await worker.fetch(new Request(url, { headers: { accept: "text/html" } }), renderEnv);
      const html = await response.text();
      assert.equal(response.status, 200, url);
      assert.match(html, new RegExp(`rel="canonical" href="${url.replaceAll("/", "\\/")}"`), url);
      assert.match(html, /name="robots" content="index,follow"/, url);
      assert.match(html, /NEXUALPHA_STATIC_ROUTE_V1/, url);
      assert.match(html, /class="nxb-hero"/, `${url} SSR body injected`);
      assert.match(html, /"@id":"https:\/\/nexualpha\.com\/#organization"/, `${url} organization id in JSON-LD`);
      const alternates = html.match(/rel="alternate" hreflang="/g) || [];
      assert.equal(alternates.length, 16, `${url} hreflang links`);
    }
  }
  assert.ok(rendered.length >= 6);
  // without a renderer the client shell still ships indexable metadata
  const plain = await worker.fetch(new Request("https://nexualpha.com/about", { headers: { accept: "text/html" } }), { ASSETS: assets });
  assert.equal(plain.status, 200);
  assert.match(await plain.text(), /"@type":"AboutPage"/);
});

test("about, editorial-policy pages, byline and footer render localized in all 15 locales (SSR) and link the entity routes", async () => {
  const temp = await mkdtemp(path.join(root, "tests/.tmp-brand-"));
  try {
    const entry = path.join(temp, "entry.mjs");
    const bundle = path.join(temp, "bundle.cjs");
    await writeFile(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { AboutPage } from "../../src/components/v3/brand-pages/AboutPage.jsx";
      import { EditorialPolicyPage } from "../../src/components/v3/brand-pages/EditorialPolicyPage.jsx";
      import { ArticleByline } from "../../src/components/v3/news/NewsDetailPage.jsx";
      import { CleanFooter } from "../../src/components/v3/CleanFooter.jsx";
      const locales = ${JSON.stringify(LOCALES)};
      const article = { author: "NexuAlpha Research Desk", publishedAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-09T00:00:00Z" };
      const other = { author: "Guest Analyst", publishedAt: "2026-10-01T00:00:00Z" };
      console.log(JSON.stringify(Object.fromEntries(locales.map((locale) => [locale, {
        about: renderToStaticMarkup(React.createElement(AboutPage, { locale })),
        policy: renderToStaticMarkup(React.createElement(EditorialPolicyPage, { locale })),
        byline: renderToStaticMarkup(React.createElement(ArticleByline, { article, locale })),
        guest: renderToStaticMarkup(React.createElement(ArticleByline, { article: other, locale })),
        footer: renderToStaticMarkup(React.createElement(CleanFooter, { locale })),
      }]))));
    `);
    execFileSync(path.join(root, "node_modules/.bin/esbuild"), [entry, "--bundle", "--platform=node", "--format=cjs", "--loader:.css=empty", "--log-level=warning", `--outfile=${bundle}`], { cwd: root });
    const output = JSON.parse(execFileSync(process.execPath, [bundle], { cwd: root, encoding: "utf8" }));
    const { ABOUT_COPY } = await import("../src/components/v3/brand-pages/about-copy.js");
    const { EDITORIAL_POLICY_COPY } = await import("../src/components/v3/brand-pages/editorial-policy-copy.js");
    const escapeHtml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
    for (const locale of LOCALES) {
      const { about, policy, byline, guest, footer } = output[locale];
      const prefix = localizedPath("/", locale).replace(/\/$/, "");
      const t = ABOUT_COPY[locale];
      const e = EDITORIAL_POLICY_COPY[locale];
      assert.ok(t && e, `${locale} has native copy`);
      // about: h1, sections, research desk anchor, disclosure, methodology + policy links, Telegram routes, reviewed date
      assert.match(about, new RegExp(`<h1>${escapeHtml(t.h1)}</h1>`), `${locale} about h1`);
      for (const id of ["publisher", "funding", "verification", "research-desk", "contact"]) assert.match(about, new RegExp(`id="${id}"`), `${locale} about #${id}`);
      assert.ok(about.includes(escapeHtml(t.deskAi)), `${locale} about AI-assistance sentence`);
      assert.match(about, /commission-disclosure-line/, `${locale} about commission disclosure`);
      assert.ok(about.includes(`href="${prefix}/methodology"`), `${locale} about links methodology`);
      assert.ok(about.includes(`href="${prefix}/editorial-policy"`), `${locale} about links editorial policy`);
      for (const url of ["https://t.me/NexuAlphaClub", "https://t.me/NexuAlphaGlobal", "https://t.me/NexuAlphaAssistantBot", "https://app.nexualpha.com/", "mailto:Bestberlin@nexualpha.com"]) assert.ok(about.includes(`href="${url}"`), `${locale} about ${url}`);
      assert.match(about, new RegExp(`datetime="${ENTITY_REVIEWED_AT}"`, "i"), `${locale} about reviewed date`);
      assert.ok(about.includes(`dir="${locale === "ar" ? "rtl" : "ltr"}"`), `${locale} about direction`);
      assert.doesNotMatch(about, /@type":"Person|photo|avatar/i, `${locale} about has no fabricated people`);
      // editorial policy: sections, lower-bound anchor, AI sentence, links
      assert.match(policy, new RegExp(`<h1>${escapeHtml(e.h1)}</h1>`), `${locale} policy h1`);
      for (const id of ["sourcing", "lower-bound", "corrections", "partner-links", "ai-assistance", "update-cadence"]) assert.match(policy, new RegExp(`id="${id}"`), `${locale} policy #${id}`);
      assert.ok(policy.includes(escapeHtml(e.aiBody)), `${locale} policy AI sentence`);
      assert.ok(policy.includes(`href="${prefix}/about#research-desk"`), `${locale} policy links research desk`);
      assert.ok(policy.includes(`href="${prefix}/methodology"`), `${locale} policy links methodology`);
      // byline: desk author linked to /about#research-desk, reviewed date, editorial policy link
      assert.ok(byline.includes(`href="${prefix}/about#research-desk"`), `${locale} byline author link`);
      assert.match(byline, /rel="author"/, `${locale} byline rel=author`);
      assert.match(byline, /NexuAlpha Research Desk/, `${locale} byline name`);
      assert.match(byline, /datetime="2026-10-09"/i, `${locale} byline reviewed date (updatedAt wins)`);
      assert.ok(byline.includes(`href="${prefix}/editorial-policy"`), `${locale} byline policy link`);
      assert.doesNotMatch(guest, /about#research-desk/, `${locale} guest author is not linked to the desk`);
      assert.match(guest, /Guest Analyst/, `${locale} guest author name`);
      // footer: About / Editorial policy / Methodology in the existing nav group
      assert.ok(footer.includes(`href="${prefix}/about"`), `${locale} footer about`);
      assert.ok(footer.includes(`href="${prefix}/editorial-policy"`), `${locale} footer editorial policy`);
      assert.ok(footer.includes(`href="${prefix}/methodology"`), `${locale} footer methodology`);
    }
    // English fallbacks must not leak into other locales' headings
    const englishH1 = new Set([ABOUT_COPY.en.h1, EDITORIAL_POLICY_COPY.en.h1]);
    for (const locale of LOCALES.filter((code) => code !== "en")) {
      assert.ok(!englishH1.has(ABOUT_COPY[locale].h1), `${locale} about h1 is localized`);
      assert.ok(!englishH1.has(EDITORIAL_POLICY_COPY[locale].h1), `${locale} policy h1 is localized`);
      assert.notEqual(ABOUT_COPY[locale].deskAi, ABOUT_COPY.en.deskAi, `${locale} AI sentence is localized`);
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test("server build ships brand-entity.js and the brand pages have their own style chunk allow-listed", async () => {
  const prepare = await readFile(path.join(root, "scripts/prepare-sites-build.mjs"), "utf8");
  assert.match(prepare, /"brand-entity\.js"/);
  const vite = await readFile(path.join(root, "vite.config.mjs"), "utf8");
  assert.match(vite, /brand-pages\/"\)\) return "route-brand-pages"/);
  const worker = await readFile(path.join(root, "worker/index.js"), "utf8");
  assert.match(worker, /"\/about": \["route-brand-pages-"\]/);
  assert.match(worker, /"\/editorial-policy": \["route-brand-pages-"\]/);
  assert.doesNotMatch(worker, /const RESEARCH_DESK = Object\.freeze/, "worker reuses the shared Research Desk reference");
  const llms = await readFile(path.join(root, "scripts/generate-public-llms.mjs"), "utf8");
  assert.match(llms, /https:\/\/nexualpha\.com\/editorial-policy/);
  assert.match(llms, /https:\/\/nexualpha\.com\/about/);
});
