// Crypto glossary (2026-10-13): /glossary hub and /glossary/<slug> term pages in 9 natively written locales. Request-time SSR
// through the Worker with the component the browser hydrates, DefinedTerm/DefinedTermSet/FAQPage/BreadcrumbList JSON-LD,
// sitemap-glossary.xml, noindex rules (non-index locales, English fallbacks), the soft geo-gated partner CTA, the owner's
// no-fine-print / no-prediction rules, and the auto-links from news articles and academy transcripts (cap 5).
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";
import { GLOSSARY_CATEGORIES, GLOSSARY_SLUGS, GLOSSARY_TERMS, glossaryTermBySlug } from "../src/data/glossary-terms.js";
import { GLOSSARY_INDEX_LOCALES, GLOSSARY_SHARDS, glossaryShard, parseGlossaryPath } from "../src/data/glossary-routes.js";
import { GLOSSARY_CONTENT_BY_LOCALE } from "../src/data/glossary-content-all.js";
import { glossaryEntry, glossaryHubLocales, glossaryTermLocales, glossaryWrittenIn } from "../src/data/glossary-seo.js";
import { glossarySignup } from "../src/data/glossary.js";
import { glossaryCopy } from "../src/data/glossary-copy.js";
import { createGlossaryLinker } from "../src/data/glossary-autolink.js";
import { GLOSSARY_LINKS as EN_LINKS } from "../src/data/glossary-links-en.js";
import { GLOSSARY_LINKS as ZH_LINKS } from "../src/data/glossary-links-zh-hans.js";
import { validateFile } from "../scripts/validate-glossary-content.mjs";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { publicCtaForVenue } from "../src/data/source-bound-cta.js";
import { titleBudgetForLocale } from "../src/data/meta-description.js";
import { ACADEMY_EPISODES } from "../src/data/academy-season1.js";
import { COIN_ROWS } from "../src/data/coins-data.generated.js";
import { modulePathsForRoute } from "../src/data/route-module-cache.js";
import { buildGlossarySitemap, buildSplitSitemaps, routeInventory } from "../scripts/generate-prerender-manifest.mjs";
import { createSsrHarness, SHELL_HTML, hydrateInJsdom, hydrationErrors, h1Texts, decodeEntities } from "./helpers/ssr-hydration-harness.mjs";
// Shared neutral list (ru, ar, zh-Hant, ur, uk and, since 2026-10-13, vi): src/data/locale-policy.js.
import { NEUTRAL_CTA_LOCALE_LIST } from "../src/data/locale-policy.js";

const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
  if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  return new Response("missing", { status: 404 });
} };
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
const env = () => ({ ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) });
const fetchPage = (path, e = env()) => worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html" } }), e);
const ldJson = (html) => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => { const v = JSON.parse(m[1]); return Array.isArray(v) ? v : (v["@graph"] || [v]); });
const mainHtml = (html) => (html.match(/<main\b[\s\S]*<\/main>/) || [""])[0];
const robots = (html) => (html.match(/<meta name="robots" content="([^"]+)"/) || [])[1];
const LOCALE_PREFIX = { en: "", "zh-Hans": "/zh-hans", es: "/es", "pt-BR": "/pt-br", tr: "/tr", vi: "/vi", id: "/id-id", ja: "/ja", ko: "/ko" };

const FINE_PRINT = [
  /not (?:investment|financial) advice/i, /pays? (?:us |our )?(?:a )?commission/i, /affiliate commission/i, /we (?:may )?earn/i,
  /terms (?:and conditions )?apply/i, /do your own research|DYOR/i,
  /非投资建议|不构成投资建议|仅供参考/, /no es asesoramiento|não é recomendação|yatırım tavsiyesi değildir|投資助言ではありません|투자 조언이 아닙니다|bukan saran investasi|không phải lời khuyên đầu tư/i,
];
const PREDICTION = /price prediction|will (?:reach|hit|rise to)|could reach \$|价格预测|预计将?涨/i;

test("term index: ~150+ unique terms in every category, valid links to academy lessons and coin pages", () => {
  assert.ok(GLOSSARY_TERMS.length >= 150, `${GLOSSARY_TERMS.length} terms`);
  assert.equal(new Set(GLOSSARY_SLUGS).size, GLOSSARY_TERMS.length);
  const coins = new Set(COIN_ROWS.map((row) => row[1]));
  const lessons = new Set(ACADEMY_EPISODES.map((e) => e.id));
  for (const term of GLOSSARY_TERMS) {
    assert.ok(GLOSSARY_CATEGORIES.includes(term.cat), term.slug);
    assert.ok(/^[a-z0-9][a-z0-9-]*$/.test(term.slug), term.slug);
    for (const related of term.related) assert.ok(glossaryTermBySlug(related) && related !== term.slug, `${term.slug} -> ${related}`);
    if (term.lesson) assert.ok(lessons.has(term.lesson), `${term.slug}: lesson ${term.lesson}`);
    if (term.coin) assert.ok(coins.has(term.coin), `${term.slug}: coin ${term.coin}`);
    if (term.tool) assert.match(term.tool, /^\/(?:funding-rates|liquidations|rates|coins|onchain|exchanges|compare|activities|topics\/[a-z-]+)$/, term.slug);
  }
  for (const cat of GLOSSARY_CATEGORIES) assert.ok(GLOSSARY_TERMS.some((t) => t.cat === cat), cat);
  for (const slug of ["funding-rate", "perpetual-futures", "liquidation", "isolated-margin", "cross-margin", "slippage", "bid-ask-spread", "market-order",
    "limit-order", "seed-phrase", "kyc", "travel-rule", "copy-trading", "launchpool", "crypto-earn", "p2p-trading", "unified-trading-account", "tokenized-stocks", "stablecoin"]) {
    assert.ok(glossaryTermBySlug(slug), `scope: ${slug}`);
  }
  assert.deepEqual(parseGlossaryPath("/glossary"), { kind: "hub" });
  assert.deepEqual(parseGlossaryPath("/glossary/funding-rate"), { kind: "term", slug: "funding-rate" });
  assert.equal(parseGlossaryPath("/glossary/a/b").kind, "missing");
  assert.equal(parseGlossaryPath("/coins/bitcoin"), null);
  assert.ok(GLOSSARY_SLUGS.every((slug) => glossaryShard(slug) >= 0 && glossaryShard(slug) < GLOSSARY_SHARDS));
});

test("content: every index locale is written natively for (almost) every term and passes the content validator", async () => {
  for (const locale of GLOSSARY_INDEX_LOCALES) {
    const json = JSON.parse(await readFile(new URL(`../content-source/glossary/${locale}.json`, import.meta.url), "utf8"));
    assert.deepEqual(validateFile(json), [], locale);
    const written = GLOSSARY_TERMS.filter((t) => glossaryWrittenIn(t.slug, locale)).length;
    assert.ok(written >= GLOSSARY_TERMS.length * 0.95, `${locale}: ${written}/${GLOSSARY_TERMS.length} written`);
  }
  assert.deepEqual(glossaryHubLocales(), GLOSSARY_INDEX_LOCALES);
  // Native, not a copy of the English text.
  for (const locale of GLOSSARY_INDEX_LOCALES.filter((l) => l !== "en")) {
    assert.notEqual(glossaryEntry("funding-rate", locale).short, glossaryEntry("funding-rate", "en").short, locale);
  }
  // The terminology traps the benchmark called out (Gas, Volume, Wick) use the trader words in Chinese.
  const zh = JSON.stringify(GLOSSARY_CONTENT_BY_LOCALE["zh-Hans"].terms);
  assert.doesNotMatch(zh, /气体费|灯芯|体积/);
});

test("hub and term pages render at request time with one h1, self canonical, hreflang, title budget (9 locales)", async () => {
  for (const locale of GLOSSARY_INDEX_LOCALES) {
    for (const slug of [null, "funding-rate", "seed-phrase"]) {
      const path = `${LOCALE_PREFIX[locale]}/glossary${slug ? `/${slug}` : ""}`;
      const response = await fetchPage(path);
      const html = await response.text();
      assert.equal(response.status, 200, path);
      assert.match(html, /<main class="nxg /, `${path}: glossary body in the SSR HTML`);
      const entry = slug && glossaryEntry(slug, locale);
      const h1 = entry ? entry.term : glossaryCopy(locale).hubTitle.replace("{count}", String(GLOSSARY_TERMS.length));
      assert.deepEqual(h1Texts(html), [h1], `${path}: one h1`);
      assert.match(html, new RegExp(`<link rel="canonical" href="https://nexualpha.com${path}"`), `${path}: self canonical`);
      assert.equal(robots(html), "index,follow", `${path}: indexable`);
      const expected = (slug ? glossaryTermLocales(slug) : glossaryHubLocales()).length + 1;
      assert.equal((html.match(/rel="alternate" hreflang=/g) || []).length, expected, `${path}: hreflang set`);
      const title = decodeEntities(html.match(/<title[^>]*>([^<]*)<\/title>/)[1]);
      assert.ok(title.length <= Math.max(titleBudgetForLocale(locale), 70), `${path}: title budget (${title})`);
      if (entry) {
        const main = mainHtml(html);
        assert.ok(decodeEntities(main).includes(entry.short), `${path}: definition first`);
        assert.ok(main.indexOf("data-glossary-definition") < main.indexOf("nxg-how-h"), `${path}: definition before the explanation`);
      }
    }
  }
});

test("term page links: academy lesson, data tool, coin page, related terms and in-text cross-links", async () => {
  const funding = mainHtml(await (await fetchPage("/glossary/funding-rate")).text());
  assert.match(funding, /href="\/academy\/funding-fees-final"/, "lesson E24");
  assert.match(funding, /href="\/funding-rates"/, "data tool");
  assert.match(funding, /href="\/glossary\/perpetual-futures"/, "related term");
  const liq = mainHtml(await (await fetchPage("/zh-hans/glossary/liquidation")).text());
  assert.match(liq, /href="\/zh-hans\/liquidations"/);
  assert.match(liq, /href="\/zh-hans\/academy\/liquidation-mark-price"/);
  const btc = mainHtml(await (await fetchPage("/es/glossary/bitcoin")).text());
  assert.match(btc, /href="\/es\/coins\/bitcoin"/, "coin page");
  // Cross-links inside the explanation point at other terms, never at the page itself.
  const crossLinks = [...funding.matchAll(/data-glossary-link="([a-z0-9-]+)"/g)].map((m) => m[1]);
  assert.ok(crossLinks.length >= 1 && !crossLinks.includes("funding-rate"), `cross-links: ${crossLinks}`);
});

test("JSON-LD: DefinedTerm in the DefinedTermSet, FAQPage matching the visible FAQ, BreadcrumbList; hub DefinedTermSet", async () => {
  const html = await (await fetchPage("/glossary/slippage")).text();
  const graph = ldJson(html);
  const term = graph.find((item) => item["@type"] === "DefinedTerm");
  const entry = glossaryEntry("slippage", "en");
  assert.equal(term.name, entry.term);
  assert.equal(term.description, entry.short);
  assert.equal(term.inDefinedTermSet["@type"], "DefinedTermSet");
  assert.equal(term.inDefinedTermSet.url, "https://nexualpha.com/glossary");
  const faq = graph.find((item) => item["@type"] === "FAQPage");
  assert.equal(faq.mainEntity.length, entry.faq.length);
  const main = decodeEntities(mainHtml(html));
  for (const q of faq.mainEntity) assert.ok(main.includes(q.name), `visible FAQ: ${q.name}`);
  assert.ok(graph.some((item) => item["@type"] === "BreadcrumbList"));
  const hub = ldJson(await (await fetchPage("/ko/glossary")).text());
  const set = hub.find((item) => item["@type"] === "DefinedTermSet");
  assert.equal(set.hasDefinedTerm.length, GLOSSARY_TERMS.length);
  assert.match(set.hasDefinedTerm[0].url, /^https:\/\/nexualpha\.com\/ko\/glossary\//);
  const seo = computeRouteSeo({ url: "/ja/glossary/funding-rate" });
  assert.equal(seo.status, 200);
  assert.ok(seo.schemas.some((item) => item["@type"] === "DefinedTerm"));
});

test("noindex: non-index UI locales show the English entry noindex,follow; unknown slugs 404", async () => {
  for (const path of ["/it/glossary/funding-rate", "/ru/glossary", "/zh-hant/glossary/kyc", "/ar/glossary/staking", "/fr/glossary/leverage"]) {
    const html = await (await fetchPage(path)).text();
    assert.equal(robots(html), "noindex,follow", path);
    assert.match(html, /<main class="nxg /, `${path}: still rendered`);
  }
  assert.match(mainHtml(await (await fetchPage("/de/glossary/funding-rate")).text()), /<article lang="en">/, "English entry marked lang=en");
  assert.equal((await fetchPage("/glossary/not-a-term")).status, 404);
  assert.equal((await fetchPage("/glossary/a/b")).status, 404);
});

test("sitemap-glossary.xml lists written editions with the head's hreflang set; in the sitemap index and robots.txt", async () => {
  const sitemap = buildGlossarySitemap();
  const expected = GLOSSARY_TERMS.reduce((sum, term) => sum + glossaryTermLocales(term.slug).length, 0) + glossaryHubLocales().length;
  assert.equal(sitemap.count, expected);
  assert.ok(sitemap.count >= GLOSSARY_TERMS.length * 9 * 0.95, `${sitemap.count} URLs`);
  assert.match(sitemap.xml, /<loc>https:\/\/nexualpha\.com\/glossary\/funding-rate<\/loc>/);
  assert.match(sitemap.xml, /<loc>https:\/\/nexualpha\.com\/pt-br\/glossary\/liquidation<\/loc>/);
  assert.doesNotMatch(sitemap.xml, /\/(?:it|ru|ar|zh-hant|ur|uk-ua|fr|de)\/glossary/);
  const split = buildSplitSitemaps(routeInventory([]), []);
  assert.match(split.index, /<loc>https:\/\/nexualpha\.com\/sitemap-glossary\.xml<\/loc>/);
  const head = await (await fetchPage("/vi/glossary/staking")).text();
  const headAlternates = [...head.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => `${m[1]} ${m[2]}`).sort();
  const entry = sitemap.xml.split("<url>").find((block) => block.includes("<loc>https://nexualpha.com/vi/glossary/staking</loc>"));
  const siteAlternates = [...entry.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => `${m[1]} ${m[2]}`).sort();
  assert.deepEqual(siteAlternates, headAlternates);
  assert.match(await readFile(new URL("../public/robots.txt", import.meta.url), "utf8"), /Sitemap: https:\/\/nexualpha\.com\/sitemap-glossary\.xml/);
  const response = await worker.fetch(new Request("https://nexualpha.com/sitemap-glossary.xml"), { ASSETS: { fetch: async () => new Response(sitemap.xml, { headers: { "content-type": "application/xml" } }) } });
  assert.equal(response.status, 200);
});

test("partner CTA: only on trading terms, registry code via /go/<venue>?src=glossary-<slug>, Türkiye OKX/Binance/Bybit, none in neutral locales", async () => {
  const funding = glossaryTermBySlug("funding-rate");
  const en = glossarySignup(funding, { locale: "en" });
  assert.ok(en, "en sign-up");
  assert.match(en.href, /^\/go\/[a-z-]+\?src=glossary-funding-rate&locale=en$/);
  assert.equal(en.code, publicCtaForVenue(en.venue, "en").inviteCode, "code from the partner registry");
  for (const slug of ["seed-phrase", "phishing", "kyc", "travel-rule", "rug-pull"]) assert.equal(glossarySignup(glossaryTermBySlug(slug), { locale: "en" }), null, `no CTA on ${slug}`);
  for (const term of GLOSSARY_TERMS.filter((t) => t.cta)) {
    const tr = glossarySignup(term, { locale: "tr" });
    if (tr) assert.ok(["okx", "binance", "bybit"].includes(tr.venue), `tr ${term.slug}: ${tr.venue}`);
    const trMarket = glossarySignup(term, { locale: "en", market: "TR" });
    if (trMarket) assert.ok(["okx", "binance", "bybit"].includes(trMarket.venue), `market=TR ${term.slug}`);
    for (const locale of NEUTRAL_CTA_LOCALE_LIST) assert.equal(glossarySignup(term, { locale }), null, `${locale} ${term.slug}`);
  }
  const page = mainHtml(await (await fetchPage("/glossary/funding-rate")).text());
  assert.match(page, /href="\/go\/[a-z-]+\?src=glossary-funding-rate&amp;locale=en"/);
  assert.match(page, /rel="sponsored noopener noreferrer"/);
  const seedPage = mainHtml(await (await fetchPage("/glossary/seed-phrase")).text());
  assert.doesNotMatch(seedPage, /href="\/go\//, "no sign-up on wallet security terms");
  for (const path of ["/ru/glossary/funding-rate", "/zh-hant/glossary/funding-rate", "/ar/glossary/perpetual-futures"]) {
    assert.doesNotMatch(mainHtml(await (await fetchPage(path)).text()), /href="\/go\//, `${path}: neutral`);
  }
});

test("no fine print, disclaimers or price predictions in any locale's glossary content or page", async () => {
  for (const locale of GLOSSARY_INDEX_LOCALES) {
    const blob = JSON.stringify(GLOSSARY_CONTENT_BY_LOCALE[locale].terms) + JSON.stringify(glossaryCopy(locale));
    for (const pattern of [...FINE_PRINT, PREDICTION]) assert.doesNotMatch(blob, pattern, `${locale}: ${pattern}`);
  }
  for (const path of ["/glossary/leverage", "/zh-hans/glossary/leverage", "/tr/glossary/perpetual-futures"]) {
    const main = mainHtml(await (await fetchPage(path)).text());
    for (const pattern of [...FINE_PRINT, PREDICTION]) assert.doesNotMatch(main, pattern, `${path}: ${pattern}`);
  }
});

test("auto-linker: first mention only, whole words, acronyms case-sensitive, CJK inside running text, cap 5", () => {
  const linker = createGlossaryLinker(EN_LINKS, { max: 5 });
  const out = linker.linkText("The funding rate rose while slippage widened. Funding rate again; KYC and a pos terminal; leverage, staking, airdrop, hodl.");
  const links = out.filter((part) => typeof part === "object");
  assert.equal(links.length, 5, "cap 5");
  assert.equal(links[0].slug, "funding-rate");
  assert.equal(links.filter((l) => l.slug === "funding-rate").length, 1, "first mention only");
  assert.ok(links.some((l) => l.slug === "kyc"));
  assert.ok(!links.some((l) => l.slug === "proof-of-stake"), "acronym PoS is case-sensitive ('pos' is not linked)");
  assert.equal(out.map((p) => (typeof p === "string" ? p : p.text)).join(""), "The funding rate rose while slippage widened. Funding rate again; KYC and a pos terminal; leverage, staking, airdrop, hodl.", "text unchanged");
  const zh = createGlossaryLinker(ZH_LINKS, { max: 5 }).linkText("永续合约的资金费率每8小时结算一次。");
  assert.ok(zh.some((p) => typeof p === "object" && p.slug === "funding-rate"), "CJK match inside running text");
  assert.deepEqual(createGlossaryLinker(EN_LINKS, { max: 5 }).linkText("Nothing relevant here."), ["Nothing relevant here."]);
});

test("academy lesson transcripts link glossary terms (max 5) in written locales; module preloaded before hydration", async () => {
  const html = mainHtml(await harness.render("https://nexualpha.com/academy/funding-fees-final", {}));
  const transcript = html.slice(html.indexOf("nxa-transcript"));
  const links = [...transcript.matchAll(/data-glossary-link="([a-z0-9-]+)"/g)].map((m) => m[1]);
  assert.ok(links.length >= 1 && links.length <= 5, `transcript links: ${links}`);
  assert.equal(new Set(links).size, links.length, "each term once");
  assert.match(transcript, /href="\/glossary\/[a-z0-9-]+"/);
  const ru = mainHtml(await harness.render("https://nexualpha.com/ru/academy/funding-fees-final", {}));
  assert.doesNotMatch(ru, /data-glossary-link=/, "no glossary links where the glossary is not written");
  assert.ok(modulePathsForRoute({ name: "academyEpisode" }, "/academy/funding-fees-final").includes("./data/glossary-links-en.js"));
  assert.ok(modulePathsForRoute({ name: "newsDetail" }, "/ja/news/x").includes("./data/glossary-links-ja.js"));
  assert.ok(!modulePathsForRoute({ name: "newsDetail" }, "/ru/news/x").some((p) => p.includes("glossary")));
  assert.deepEqual(modulePathsForRoute({ name: "glossaryTerm", slug: "kyc" }, "/glossary/kyc"), ["./components/glossary/GlossaryPages.jsx", `./data/glossary-shard-en-${glossaryShard("kyc")}.js`]);
});

test("hydration of the hub and term pages has no mismatch (en, zh-hans, tr, ja)", async () => {
  for (const path of ["/glossary", "/zh-hans/glossary/funding-rate", "/tr/glossary/liquidation", "/ja/glossary/seed-phrase", "/academy/funding-fees-final"]) {
    const html = await (await fetchPage(path)).text();
    const { errors } = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`);
    assert.deepEqual(hydrationErrors(errors), [], `${path}: ${errors.join("\n")}`);
  }
});

test("footer links the glossary on every page", async () => {
  const home = await harness.render("https://nexualpha.com/?locale=ko", {});
  assert.match(home, /href="\/ko\/glossary">용어 사전</);
});
