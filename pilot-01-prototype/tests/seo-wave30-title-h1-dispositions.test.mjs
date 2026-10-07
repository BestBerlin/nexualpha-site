import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { parsePublicRoute } from "../src/data/locale-routing.js";
import { normalizeNewsFeed } from "../src/data/news-feed-client.js";
import { routeInventory, INDEXABLE_LOCALES } from "../scripts/generate-prerender-manifest.mjs";
import { buildSearchPublicationEligibility, selectSitemapPublicationEntries } from "../scripts/sitemap-publication-policy.mjs";
import worker from "../worker/index.js";
import { auditIndexablePages } from "../scripts/audit-indexable-content-duplication.mjs";

const wave29Report = JSON.parse(await readFile(new URL("../../artifacts/seo/wave29-indexable-content-duplication.json", import.meta.url), "utf8"));
const dispositions = JSON.parse(await readFile(new URL("../scripts/indexable-content-duplication-dispositions.json", import.meta.url), "utf8"));
const shell = '<!doctype html><html><head><title>Base</title><meta name="description" content="Base"></head><body><div id="root"></div></body></html>';
const unsafeClaims = /\b(guaranteed|risk-free|real-time yield|live yield|safe route|route safety guaranteed|available in every region|regional availability guaranteed|private commission|佣金比例|返佣|稳赚|无风险)\b/i;
const invitationTokens = /nexu888|11350287|LUCKX|CANDY007|INS898|luckybitcoin/i;
const feedText = await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8");
const articles = normalizeNewsFeed(JSON.parse(feedText));
const publicationEligibility = buildSearchPublicationEligibility(
  selectSitemapPublicationEntries(routeInventory(articles), articles, { allLocales: INDEXABLE_LOCALES }),
);

function urlForMember(member) {
  const url = new URL(member.canonical);
  return `${url.pathname}${url.search}` || "/";
}

function normalizePath(path) {
  const url = new URL(`https://nexualpha.com${path}`);
  const locale = url.searchParams.get("locale");
  if (!locale) return path;
  url.searchParams.delete("locale");
  const prefix = locale.toLowerCase() === "en" ? "" : `/${locale.toLowerCase()}`;
  return `${prefix}${url.pathname}${url.search}${url.hash}` || "/";
}

function expectedRobots(path) {
  const url = new URL(`https://nexualpha.com${normalizePath(path)}`);
  const route = parsePublicRoute(url.pathname, url.searchParams);
  return publicationEligibility.has(route.contentPathname, route.locale) ? "index,follow" : "noindex,follow";
}

function assets() {
  return {
    async fetch(request) {
      const path = new URL(request.url).pathname;
      if (path === "/index.html") return new Response(shell, { headers: { "content-type": "text/html; charset=utf-8" } });
      if (path === "/content/news-feed.json") return Response.json({ articles: [] });
      if (path === "/prerender-manifest.json") return new Response("missing", { status: 404 });
      return new Response("missing", { status: 404 });
    },
  };
}

async function workerMetadata(path) {
  path = normalizePath(path);
  const response = await worker.fetch(
    new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: assets() },
  );
  const html = await response.text();
  return {
    status: response.status,
    title: (html.match(/<title[^>]*>([^<]*)<\/title>/)?.[1] || "").replaceAll("&amp;", "&"),
    description: html.match(/<meta name="description" content="([^"]*)"/)?.[1] || "",
    robots: html.match(/<meta name="robots" content="([^"]*)"/)?.[1] || "",
    canonical: html.match(/rel="canonical" href="([^"]+)"/)?.[1] || "",
    html,
  };
}

test("Wave30 resolves all Wave29 duplicate title groups as real zh-Hant locale conflicts", async () => {
  assert.equal(wave29Report.totals.duplicateTitleGroups, 19, "Wave30 test tracks the authoritative Wave29 title baseline");

  for (const group of wave29Report.duplicateTitles) {
    const titles = [];
    for (const member of group.members) {
      const path = urlForMember(member);
      const client = computeRouteSeo({ url: normalizePath(path) });
      const served = await workerMetadata(path);
      assert.equal(client.status, 200, path);
      assert.equal(served.status, 200, path);
      assert.equal(client.robots, expectedRobots(path), path);
      assert.equal(served.robots, client.robots, path);
      assert.equal(served.canonical, client.canonical, path);
      assert.equal(served.title, client.title, path);
      assert.doesNotMatch(`${client.title}\n${client.description}\n${served.html}`, unsafeClaims, path);
      assert.doesNotMatch(`${client.title}\n${client.description}`, invitationTokens, path);
      if (client.robots === "index,follow") titles.push(client.title);
    }
    assert.equal(new Set(titles).size, titles.length, `title group should be split: ${group.value}`);
  }
});

test("Wave30 H1 dispositions allow only documented same-route entity headings", () => {
  assert.equal(wave29Report.totals.duplicateH1Groups, 53, "Wave30 test tracks the authoritative Wave29 H1 baseline");
  assert.equal(dispositions.items.length, 53);
  assert.ok(dispositions.items.every((item) => item.field === "h1" && item.disposition === "allow" && item.reason && item.paths.length === 1 && item.locales.length >= 2));

  const pages = wave29Report.duplicateH1s.flatMap((group) => group.members.map((member) => ({
    status: 200,
    robots: "index,follow",
    path: member.path,
    locale: member.locale,
    canonical: member.canonical,
    title: `${member.canonical} title`,
    description: `${member.canonical} description`,
    h1: group.value,
    mainTextLength: 600,
    mainTextFingerprint: `${member.canonical}|body`,
  })));

  const report = auditIndexablePages({ pages }, { dispositions });
  assert.equal(report.totals.duplicateH1Groups, 0);
  assert.equal(report.severity.advisory, 0);
  assert.equal(report.allowedDuplicates.h1.length, 53);
  assert.ok(report.allowedDuplicates.h1.every((group) => group.disposition === "allow" && group.reason));
  assert.equal(report.allowedDuplicates.title.length, 0);
});
