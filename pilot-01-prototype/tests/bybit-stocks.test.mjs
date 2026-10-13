// Bybit Stocks campaign page (/activities/bybit-stocks, 2026-10-12): request-time SSR with the hydrated component, head
// metadata and JSON-LD (WebPage, FAQPage, BreadcrumbList), sitemap, geo-gated sign-up (registry code through /go/bybit,
// none in the US, restricted markets or neutral locales), every sign-up attributed to us, the owner's no-fine-print rule,
// no Bybit rebate percentage, the campaign brief, and the featured placements (home stream, /activities, /exchanges/bybit).
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";
import { BYBIT_STOCKS_ANNOUNCEMENT_ID, BYBIT_STOCKS_CAMPAIGN, BYBIT_STOCKS_INDEX_LOCALES, BYBIT_STOCKS_PATH, bybitStocksInviteCode, bybitStocksSignupGate, bybitStocksTeaser } from "../src/data/bybit-stocks.js";
import { bybitStocksSignup } from "../src/data/bybit-stocks-signup.js";
import { BYBIT_STOCKS_COPY } from "../src/data/bybit-stocks-copy.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { publicCtaForVenue } from "../src/data/source-bound-cta.js";
import { titleBudgetForLocale } from "../src/data/meta-description.js";
import { validateCampaignBriefs } from "../src/data/campaign-briefs.js";
import { buildCampaignSitemap, buildSplitSitemaps, routeInventory } from "../scripts/generate-prerender-manifest.mjs";
import { createSsrHarness, SHELL_HTML, hydrateInJsdom, hydrationErrors, h1Texts } from "./helpers/ssr-hydration-harness.mjs";
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
const fetchPage = (path) => worker.fetch(new Request(`https://nexualpha.com${path}`, { headers: { accept: "text/html" } }), env());
const ldJson = (html) => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => { const v = JSON.parse(m[1]); return Array.isArray(v) ? v : (v["@graph"] || [v]); });
const mainHtml = (html) => (html.match(/<main\b[\s\S]*<\/main>/) || [""])[0];
const anchors = (html) => [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>/g)].map((m) => ({ tag: m[0], href: m[1].replaceAll("&amp;", "&") }));
const CODE = publicCtaForVenue("bybit", "en").inviteCode;

const FINE_PRINT = [
  /not (?:investment|financial) advice/i, /capital (?:is )?at risk/i, /may get back less/i, /pays our commission/i, /affiliate commission/i,
  /commission disclosure/i, /partner link ·/i, /terms (?:and conditions )?apply/i, /\bSEC[- ](?:approved|licensed|registered)/i,
  /非投资建议|不构成投资建议|资本有风险|佣金由交易所支付/, /非投資建議|資本有風險/,
];
// No rebate share is confirmed for Bybit: no percentage next to rebate wording anywhere on the page.
const REBATE_PERCENT = /(?:rebate|返佣|返還|返还|cashback|reembolso|rabatt|remise|iade|hoàn)[^<]{0,40}\d+\s?%|\d+\s?%[^<]{0,40}(?:rebate|返佣|返還|返还|cashback)/i;

test("copy: 14 written editions, same structure and the same figures as English", () => {
  assert.deepEqual(Object.keys(BYBIT_STOCKS_COPY).sort(), [...BYBIT_STOCKS_INDEX_LOCALES].sort());
  // Separators are compared out (QA 2026-10-13: localized "2.000" / "2 000" is the same figure as "2,000").
  const numbers = (value) => (JSON.stringify(value).match(/\d(?:[\d,.]|[\u202f\u00a0](?=\d))*/g) || []).map((n) => n.replace(/[.,]$/, "").replace(/[\s.,\u202f\u00a0]/g, ""));
  const en = BYBIT_STOCKS_COPY.en;
  for (const locale of BYBIT_STOCKS_INDEX_LOCALES) {
    const t = BYBIT_STOCKS_COPY[locale];
    for (const key of ["facts", "rewards", "multiplierEarlyRows", "multiplierHoldRows", "compareRows"]) {
      t[key].forEach((row, i) => {
        const want = numbers(en[key][i]).filter((n) => n !== "10").sort().join("|");
        const got = numbers(row).filter((n) => n !== "10").sort().join("|");
        assert.equal(got, want, `${locale} ${key}[${i}]`);
      });
    }
    assert.equal(t.faq.length, 6, `${locale}: six questions`);
    assert.ok(JSON.stringify(t).includes("{code}"), `${locale}: code comes from the registry placeholder`);
    assert.doesNotMatch(JSON.stringify(t), /48553/, `${locale}: no hand-typed invite code`);
  }
});

test("sign-up gating: registry code via /go/bybit, none in the US, restricted markets or neutral locales; Türkiye allowed", () => {
  assert.equal(CODE, "48553");
  const en = bybitStocksSignup({ locale: "en" });
  assert.deepEqual(en, { code: CODE, href: "/go/bybit?src=bybit-stocks-hero" });
  assert.ok(bybitStocksSignup({ locale: "tr" }), "Bybit may be promoted in Türkiye");
  for (const locale of ["zh-Hans", "es", "pt-BR", "id", "ja", "ko"]) assert.ok(bybitStocksSignup({ locale }), locale);
  for (const locale of NEUTRAL_CTA_LOCALE_LIST) assert.equal(bybitStocksSignup({ locale }), null, `${locale} is neutral`);
  for (const locale of ["fr", "de", "it"]) assert.equal(bybitStocksSignup({ locale }), null, `${locale}: Bybit Stocks is restricted in the EEA`);
  for (const market of ["US", "EU", "IN", "SG", "HK"]) assert.equal(bybitStocksSignup({ locale: "en", market }), null, `market ${market}`);
  assert.equal(bybitStocksSignupGate({ locale: "en", market: "US" }), "partner-geo-restricted");
  assert.equal(bybitStocksInviteCode({ locale: "en" }), CODE, "the head reads the same registry code");
  assert.equal(bybitStocksInviteCode({ locale: "ru" }), null);
});

test("/activities/bybit-stocks renders at request time in en, zh-hans and tr with canonical, hreflang and title budget", async () => {
  for (const [path, locale] of [[BYBIT_STOCKS_PATH, "en"], [`/zh-hans${BYBIT_STOCKS_PATH}`, "zh-Hans"], [`/tr${BYBIT_STOCKS_PATH}`, "tr"]]) {
    const response = await fetchPage(path);
    const html = await response.text();
    assert.equal(response.status, 200, path);
    assert.deepEqual(h1Texts(html), [BYBIT_STOCKS_COPY[locale].h1], `${path}: one h1`);
    assert.match(html, /<main class="nxbs /, `${path}: page body in the SSR HTML`);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://nexualpha.com${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `${path}: self canonical`);
    assert.match(html, /<meta name="robots" content="index,follow"/, `${path}: indexable`);
    assert.equal((html.match(/rel="alternate" hreflang=/g) || []).length, BYBIT_STOCKS_INDEX_LOCALES.length + 1, `${path}: hreflang set`);
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/)[1];
    assert.ok(title.length <= titleBudgetForLocale(locale), `${path}: title budget (${title})`);
    const main = mainHtml(html);
    for (const [question] of BYBIT_STOCKS_COPY[locale].faq) assert.ok(main.includes(question.replaceAll("'", "&#x27;")) || main.includes(question), `${path}: FAQ in SSR`);
    assert.ok(main.includes(BYBIT_STOCKS_COPY[locale].campaignH), `${path}: campaign block`);
    assert.match(main, /datetime="2026-10-31T00:00:00Z"/i, `${path}: countdown end`);
    for (const ticker of ["AAPL", "NVDA", "TSLA", "QQQ"]) assert.ok(main.includes(`>${ticker}<`), `${path}: ${ticker} chip`);
    assert.match(main, /href="\/exchanges\/bybit"|href="\/[a-z-]+\/exchanges\/bybit"/, `${path}: related profile`);
    assert.match(main, /news\/bybit-us-stocks-etfs-usdc-alpaca-what-you-own/, `${path}: related news`);
    assert.match(main, /academy\/first-spot-trade/);
    assert.match(main, /academy\/kyc-who-gets-your-id/);
  }
  const it = await (await fetchPage(`/it${BYBIT_STOCKS_PATH}`)).text();
  assert.match(it, /<meta name="robots" content="noindex,follow"/, "unwritten locale is noindex");
});

test("JSON-LD: WebPage, FAQPage with the page's questions, BreadcrumbList; client head helper agrees", async () => {
  const html = await (await fetchPage(BYBIT_STOCKS_PATH)).text();
  const ld = ldJson(html);
  const faq = ld.find((item) => item["@type"] === "FAQPage");
  assert.ok(faq, "FAQPage");
  assert.deepEqual(faq.mainEntity.map((q) => q.name), BYBIT_STOCKS_COPY.en.faq.map(([q]) => q));
  assert.ok(faq.mainEntity.some((q) => /available in my country/i.test(q.name)));
  assert.ok(faq.mainEntity.some((q) => /real shares/i.test(q.name)));
  assert.ok(faq.mainEntity.some((q) => /dividends/i.test(q.name)));
  assert.ok(ld.some((item) => item["@type"] === "WebPage"));
  assert.ok(ld.some((item) => item["@type"] === "BreadcrumbList"));
  const seo = computeRouteSeo({ url: `/zh-hans${BYBIT_STOCKS_PATH}` });
  assert.equal(seo.status, 200);
  assert.ok(seo.schemas.some((item) => item["@type"] === "FAQPage"));
});

test("every sign-up is attributed: CTAs are /go/bybit?src=bybit-stocks-*, no direct bybit.com sign-up link, code with copy next to each CTA", async () => {
  // vi is neutral since 2026-10-13 (covered by tests/vi-neutral-locale.test.mjs): id takes its place here.
  for (const path of [BYBIT_STOCKS_PATH, `/zh-hans${BYBIT_STOCKS_PATH}`, `/tr${BYBIT_STOCKS_PATH}`, `/id-id${BYBIT_STOCKS_PATH}`]) {
    const main = mainHtml(await (await fetchPage(path)).text());
    const links = anchors(main);
    for (const { href } of links) {
      assert.doesNotMatch(href, /bybit\.com\/(?:[a-z-]+\/)?register|affiliate_id=/i, `${path}: direct registration link ${href}`);
      if (/^https?:\/\/[^/]*bybit\./i.test(href)) assert.fail(`${path}: links bybit.com directly (${href}); sign-up must go through /go/bybit`);
    }
    const ctas = links.filter(({ tag }) => /data-offer-link="go"|rel="sponsored/.test(tag));
    assert.ok(ctas.length >= 4, `${path}: hero, steps, campaign and final CTAs (${ctas.length})`);
    for (const { href } of ctas) assert.match(href, /^\/go\/bybit\?src=bybit-stocks-[a-z]+$/, `${path}: CTA ${href}`);
    assert.ok(links.some(({ href }) => href === "/go/bybit?src=bybit-stocks-hero"), `${path}: hero CTA`);
    assert.equal((main.match(new RegExp(`<code translate="no">${CODE}</code>`, "g")) || []).length, ctas.length, `${path}: a copyable code next to every CTA`);
    assert.ok(main.includes(CODE) && main.includes(`>${BYBIT_STOCKS_COPY[path === BYBIT_STOCKS_PATH ? "en" : path.startsWith("/zh") ? "zh-Hans" : path.startsWith("/tr") ? "tr" : "id"].steps[0][0]}<`), `${path}: step 1`);
  }
});

test("no sign-up in the US market or neutral/restricted editions; informational page instead", async () => {
  for (const path of [`${BYBIT_STOCKS_PATH}?market=US`, `${BYBIT_STOCKS_PATH}?market=VN`, `/vi${BYBIT_STOCKS_PATH}`, `/ru${BYBIT_STOCKS_PATH}`, `/ar${BYBIT_STOCKS_PATH}`, `/zh-hant${BYBIT_STOCKS_PATH}`, `/de${BYBIT_STOCKS_PATH}`, `/fr${BYBIT_STOCKS_PATH}`]) {
    const response = await fetchPage(path);
    assert.equal(response.status, 200, path);
    const main = mainHtml(await response.text());
    assert.doesNotMatch(main, /href="\/go\/|rel="sponsored|48553|affiliate_id/, `${path}: no sign-up`);
    assert.match(main, /data-signup="off"/, `${path}: informational edition`);
  }
});

test("no fine print, no SEC claim and no rebate percentage on the page (footer excluded)", async () => {
  for (const locale of BYBIT_STOCKS_INDEX_LOCALES) {
    const html = await harness.render(`https://nexualpha.com${BYBIT_STOCKS_PATH}?locale=${locale}`, {});
    const main = mainHtml(html);
    for (const pattern of FINE_PRINT) assert.doesNotMatch(main, pattern, `${locale}: ${pattern}`);
    assert.doesNotMatch(main, REBATE_PERCENT, `${locale}: rebate percentage`);
    const blob = JSON.stringify(BYBIT_STOCKS_COPY[locale]);
    for (const pattern of FINE_PRINT) assert.doesNotMatch(blob, pattern, `${locale} copy: ${pattern}`);
    assert.doesNotMatch(blob, REBATE_PERCENT, `${locale} copy: rebate percentage`);
  }
});

// Owner copy rule (2026-10-12): the reader gets the deal; NexuAlpha only passes it on. Nothing may say or imply that we
// earn from sign-ups.
const SELF_INTEREST = /\bwe earn|\bour referral|support us|we get paid|earns? (?:us|NexuAlpha)|NexuAlpha (?:earns|is paid|gets paid)|commission (?:to|for) (?:us|NexuAlpha)|我们获得|我們獲得|我们赚|我們賺|支持我们|支持我們/i;
test("no 'we earn' / 'our referral' / 'support us' wording on the page, its teasers or its brief", async () => {
  for (const locale of BYBIT_STOCKS_INDEX_LOCALES) {
    const main = mainHtml(await harness.render(`https://nexualpha.com${BYBIT_STOCKS_PATH}?locale=${locale}`, {}));
    assert.doesNotMatch(main, SELF_INTEREST, `${locale}: page`);
    assert.doesNotMatch(JSON.stringify(BYBIT_STOCKS_COPY[locale]), SELF_INTEREST, `${locale}: copy`);
    assert.doesNotMatch(JSON.stringify(bybitStocksTeaser(locale)), SELF_INTEREST, `${locale}: teaser`);
  }
  const payload = JSON.parse(await readFile(new URL("../public/content/campaign-briefs.json", import.meta.url), "utf8"));
  assert.doesNotMatch(JSON.stringify(payload.items.find((item) => item.id === BYBIT_STOCKS_ANNOUNCEMENT_ID)), SELF_INTEREST, "brief");
});

test("hydration has no mismatch (en, zh-hans, ar)", async () => {
  for (const path of [BYBIT_STOCKS_PATH, `/zh-hans${BYBIT_STOCKS_PATH}`, `/ar${BYBIT_STOCKS_PATH}`]) {
    const html = await (await fetchPage(path)).text();
    const { errors } = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${path}`);
    assert.deepEqual(hydrationErrors(errors), [], `${path}: ${errors.join("\n")}`);
  }
});

test("sitemap-campaigns.xml lists every written edition and is in the sitemap index and robots.txt", async () => {
  const sitemap = buildCampaignSitemap();
  // Shared with other campaign pages (Binance October): count this page's entries.
  assert.equal((sitemap.xml.match(/<loc>[^<]*\/activities\/bybit-stocks<\/loc>/g) || []).length, BYBIT_STOCKS_INDEX_LOCALES.length);
  assert.match(sitemap.xml, /<loc>https:\/\/nexualpha\.com\/zh-hans\/activities\/bybit-stocks<\/loc>/);
  assert.match(sitemap.xml, /hreflang="x-default" href="https:\/\/nexualpha\.com\/activities\/bybit-stocks"/);
  const split = buildSplitSitemaps(routeInventory([]), []);
  assert.match(split.index, /<loc>https:\/\/nexualpha\.com\/sitemap-campaigns\.xml<\/loc>/);
  assert.match(await readFile(new URL("../public/robots.txt", import.meta.url), "utf8"), /Sitemap: https:\/\/nexualpha\.com\/sitemap-campaigns\.xml/);
  assert.equal(await readFile(new URL("../public/sitemap-campaigns.xml", import.meta.url), "utf8"), sitemap.xml, "committed sitemap is current");
});

test("campaign brief for the official announcement is valid, localized and free of codes and URLs", async () => {
  const payload = JSON.parse(await readFile(new URL("../public/content/campaign-briefs.json", import.meta.url), "utf8"));
  const brief = payload.items.find((item) => item.id === BYBIT_STOCKS_ANNOUNCEMENT_ID);
  assert.ok(brief, "brief for the Bybit stocks announcement");
  assert.equal(brief.deadline, BYBIT_STOCKS_CAMPAIGN.endAt);
  assert.equal(Object.keys(brief.headline).length, 14);
  assert.deepEqual(validateCampaignBriefs({ items: [brief] }, { ids: [BYBIT_STOCKS_ANNOUNCEMENT_ID], partnerCodes: [CODE] }), []);
});

test("featured placements: home notices, /activities and /exchanges/bybit link the campaign page", async () => {
  const home = await harness.render("https://nexualpha.com/?locale=en", {});
  assert.match(home, /data-featured-campaign="bybit-stocks"[\s\S]*?href="\/activities\/bybit-stocks"/, "home featured row");
  assert.match(home, /class="h7-ic h7-ic-event" data-hot="true"/, "gold sparkle chip");
  const activities = await harness.render("https://nexualpha.com/activities?locale=zh-Hans", {});
  const first = activities.indexOf('data-featured-campaign="bybit-stocks"');
  assert.ok(first > 0 && first < activities.indexOf('id="campaign-month-title"'), "/activities: spotlight is the first campaign item");
  assert.match(activities, /class="campaign-spotlight" href="\/zh-hans\/activities\/bybit-stocks"/);
  const venue = await harness.render("https://nexualpha.com/exchanges/bybit?locale=en", {});
  assert.match(venue, /class="v3-venue-campaign-banner"[^>]*href="\/activities\/bybit-stocks"/, "Bybit profile banner");
  const okx = await harness.render("https://nexualpha.com/exchanges/okx?locale=en", {});
  assert.doesNotMatch(okx, /v3-venue-campaign-banner/, "only on Bybit");
});
