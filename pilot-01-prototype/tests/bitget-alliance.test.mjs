// Bitget Alliance campaign page (/activities/bitget-alliance, owner 2026-10-13): request-time SSR, head metadata and
// JSON-LD, sitemap, the tracked campaign route /go/bitget-alliance (official www.bitget.com page with the campaign code,
// locale-mapped, click-logged, falls back to /go/bitget after the end date), geo gating (no CTA in Türkiye, the US, other
// Bitget-restricted markets or neutral locales), every CTA through /go/bitget-alliance, the owner's no-fine-print and
// no-"we earn" rules, the live pool endpoint, the campaign brief and the featured placements.
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import worker from "../worker/index.js";
import {
  BITGET_ALLIANCE_ANNOUNCEMENT_ID, BITGET_ALLIANCE_CAMPAIGN, BITGET_ALLIANCE_CODE, BITGET_ALLIANCE_INDEX_LOCALES, BITGET_ALLIANCE_PATH,
  BITGET_ALLIANCE_SNAPSHOT, bitgetAllianceDailyReward, bitgetAlliancePromotable, bitgetAllianceSignup, bitgetAllianceSignupGate,
  bitgetAllianceTeaser, bitgetAllianceUrl,
} from "../src/data/bitget-alliance.js";
import { BITGET_ALLIANCE_COPY } from "../src/data/bitget-alliance-copy.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { publicCtaForVenue } from "../src/data/source-bound-cta.js";
import { titleBudgetForLocale } from "../src/data/meta-description.js";
import { validateCampaignBriefs } from "../src/data/campaign-briefs.js";
import { createGoRedirect } from "../server/go-redirect.mjs";
import { createBitgetAlliancePool, normalizeBitgetAlliancePool } from "../server/bitget-alliance-pool.mjs";
import { buildCampaignSitemap } from "../scripts/generate-prerender-manifest.mjs";
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
const fetchPage = (p) => worker.fetch(new Request(`https://nexualpha.com${p}`, { headers: { accept: "text/html" } }), env());
const ldJson = (html) => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => { const v = JSON.parse(m[1]); return Array.isArray(v) ? v : (v["@graph"] || [v]); });
const mainHtml = (html) => (html.match(/<main\b[\s\S]*<\/main>/) || [""])[0];
const anchors = (html) => [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>/g)].map((m) => ({ tag: m[0], href: m[1].replaceAll("&amp;", "&") }));
const MAIN_CODE = publicCtaForVenue("bitget", "en").inviteCode;
const DURING = Date.parse("2026-10-13T00:00:00Z");
const AFTER = Date.parse("2026-10-26T08:00:01Z");

const FINE_PRINT = [
  /not (?:investment|financial) advice/i, /capital (?:is )?at risk/i, /may get back less/i, /pays our commission/i, /affiliate commission/i,
  /commission disclosure/i, /partner link ·/i, /terms (?:and conditions )?apply/i, /past performance/i, /disclaimer/i,
  /非投资建议|不构成投资建议|资本有风险|佣金由交易所支付|免责声明|投资有风险/, /非投資建議|資本有風險/,
];
// Owner copy rule: the reader gets the deal; NexuAlpha only passes it on. Nothing may say or imply that we (or the inviter) earn.
const SELF_INTEREST = /\bwe earn|\bour referral|support us|we get paid|earns? (?:us|NexuAlpha)|NexuAlpha (?:earns|is paid|gets paid)|commission (?:to|for) (?:us|NexuAlpha)|inviter (?:earns|gets)|我们获得|我們獲得|我们赚|我們賺|支持我们|支持我們|邀请人(?:获得|赚)|返佣给我们/i;

test("copy: 10 written editions, same structure, placeholders for the code and the rule figures of English", () => {
  assert.deepEqual(Object.keys(BITGET_ALLIANCE_COPY).sort(), [...BITGET_ALLIANCE_INDEX_LOCALES].sort());
  const numbers = (value) => (JSON.stringify(value).match(/\d[\d,.]*/g) || []).map((n) => n.replace(/[.,]$/, ""));
  const en = BITGET_ALLIANCE_COPY.en;
  for (const locale of BITGET_ALLIANCE_INDEX_LOCALES) {
    const t = BITGET_ALLIANCE_COPY[locale];
    // Rule figures (shares, thresholds, caps, payout days, prize caps) must be the English ones; CJK month digits may add 9/10.
    for (const key of ["mechanics", "boxPrizes", "dates"]) {
      t[key].forEach((row, i) => {
        const got = new Set(numbers(row));
        for (const n of numbers(en[key][i])) assert.ok(got.has(n), `${locale} ${key}[${i}] keeps ${n}`);
        for (const n of got) assert.ok(numbers(en[key][i]).includes(n) || ["9", "10"].includes(n), `${locale} ${key}[${i}] adds ${n}`);
      });
    }
    for (const n of ["0.49", "4.86", "3,000,000", "0.10"]) assert.ok(numbers(t.faq[3]).includes(n), `${locale}: worked figure ${n} in the FAQ`);
    assert.equal(t.faq.length, 7, `${locale}: seven questions`);
    assert.equal(t.steps.length, 4, `${locale}: four steps`);
    assert.ok(t.cta.includes("{code}") && t.steps[0][1].includes("{code}"), `${locale}: code comes from the placeholder`);
    assert.doesNotMatch(JSON.stringify(t), new RegExp(`${BITGET_ALLIANCE_CODE}|${MAIN_CODE}`, "i"), `${locale}: no hand-typed code`);
    assert.ok(String(t.seoTitle).replace("{code}", BITGET_ALLIANCE_CODE).length <= titleBudgetForLocale(locale), `${locale}: title budget`);
    assert.match(JSON.stringify(t), /Bitget\.com/, `${locale}: Bitget shown as Bitget.com`);
  }
});

test("worked example matches Bitget's formula and figures (11 Oct)", () => {
  const r = bitgetAllianceDailyReward({ volume: 100000, assets: 10000 });
  assert.equal(r.trade.toFixed(2), "4.86");
  assert.equal(r.asset.toFixed(2), "0.10");
  assert.equal(bitgetAllianceDailyReward({ volume: 10000 }).trade.toFixed(2), "0.49");
  assert.equal(bitgetAllianceDailyReward({ volume: 9e6 }).trade, bitgetAllianceDailyReward({ volume: 3e6 }).trade, "volume capped at 3,000,000");
  assert.equal(bitgetAllianceDailyReward({ assets: 99 }).asset, 0, "assets below 100 USDT count as 0");
  assert.ok(Math.abs(BITGET_ALLIANCE_SNAPSHOT.tradePool + BITGET_ALLIANCE_SNAPSHOT.assetPool - BITGET_ALLIANCE_SNAPSHOT.totalPool) < 0.02);
});

test("campaign CTA: /go/bitget-alliance with DPRWSXAS only; none in Türkiye, the US, restricted markets, neutral or fr/de/ja editions", () => {
  assert.equal(BITGET_ALLIANCE_CODE, "DPRWSXAS");
  assert.notEqual(MAIN_CODE, BITGET_ALLIANCE_CODE, "the campaign code is separate from the main Bitget code");
  assert.deepEqual(bitgetAllianceSignup({ locale: "en", placement: "hero", now: DURING }), { code: "DPRWSXAS", href: "/go/bitget-alliance?src=alliance-hero" });
  assert.deepEqual(bitgetAllianceSignup({ locale: "zh-Hans", placement: "final", now: DURING }), { code: "DPRWSXAS", href: "/go/bitget-alliance?src=alliance-final&lang=zh-Hans" });
  for (const locale of ["zh-Hans", "es", "pt-BR", "id", "ko"]) assert.ok(bitgetAllianceSignup({ locale, now: DURING }), locale);
  assert.equal(bitgetAllianceSignupGate({ locale: "tr" }), "partner-geo-restricted", "Türkiye: Bitget is not promoted (SPK list)");
  assert.equal(bitgetAllianceSignup({ locale: "en", market: "TR", now: DURING }), null, "TR market");
  for (const market of ["US", "CA", "SG", "HK", "JP", "FR", "DE"]) assert.equal(bitgetAllianceSignup({ locale: "en", market, now: DURING }), null, `market ${market}`);
  for (const locale of NEUTRAL_CTA_LOCALE_LIST) assert.equal(bitgetAllianceSignupGate({ locale }), "neutral-locale", locale);
  for (const locale of ["fr", "de", "ja"]) assert.equal(bitgetAllianceSignup({ locale, now: DURING }), null, `${locale}: Bitget-restricted country edition`);
  assert.equal(bitgetAllianceSignup({ locale: "en", now: AFTER }), null, "no campaign CTA after the end");
  assert.equal(bitgetAlliancePromotable({ locale: "tr", now: DURING }), false, "no teaser in Türkiye");
  assert.equal(bitgetAlliancePromotable({ locale: "en", now: AFTER }), false, "teasers stop at the end");
});

async function goSetup(at) {
  const dir = await mkdtemp(path.join(tmpdir(), "go-bg-"));
  await mkdir(path.join(dir, "client", "intel"), { recursive: true });
  await writeFile(path.join(dir, "client", "intel", "partners.json"), JSON.stringify({ partners: [{ slug: "bitget", registrationUrl: "https://partner.bitget.com/bg/C6PRAF" }] }));
  const eventFile = path.join(dir, "go.jsonl");
  return { handle: createGoRedirect({ clientRoot: path.join(dir, "client"), eventFile, now: () => new Date(at) }), eventFile };
}

test("/go/bitget-alliance 302s to the official www.bitget.com campaign page with clacCode=DPRWSXAS in the visitor's language and logs the click", async () => {
  const { handle, eventFile } = await goSetup("2026-10-13T00:00:00Z");
  const ua = { "user-agent": "Mozilla/5.0" };
  let res = await handle(new Request("https://nexualpha.com/go/bitget-alliance?src=alliance-hero&lang=zh-Hans", { headers: ua }));
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "https://www.bitget.com/zh-CN/activity/bitget-alliance?clacCode=DPRWSXAS");
  assert.match(res.headers.get("x-robots-tag"), /noindex/);
  res = await handle(new Request("https://nexualpha.com/go/bitget-alliance?src=tg-en", { headers: ua }));
  assert.equal(res.headers.get("location"), "https://www.bitget.com/activity/bitget-alliance?clacCode=DPRWSXAS");
  for (const [lang, seg] of [["pt-BR", "pt/"], ["vi", "vi/"], ["es", "es/"], ["ja", "ja/"], ["ko", ""], ["id", "id/"]]) {
    assert.equal(bitgetAllianceUrl(lang), `https://www.bitget.com/${seg}activity/bitget-alliance?clacCode=DPRWSXAS`, lang);
  }
  res = await handle(new Request("https://nexualpha.com/go/bitget?src=x", { headers: ua }));
  assert.equal(res.headers.get("location"), "https://partner.bitget.com/bg/C6PRAF", "regular /go/bitget is unchanged");
  await new Promise((r) => setTimeout(r, 50));
  const rows = (await readFile(eventFile, "utf8")).trim().split("\n").map((l) => JSON.parse(l));
  assert.deepEqual(rows.map((r) => [r.partner, r.src, r.venue || null, r.campaign || null]).sort(),
    [["bitget", "x", null, null], ["bitget-alliance", "alliance-hero", "bitget", "alliance"], ["bitget-alliance", "tg-en", "bitget", "alliance"]].sort());
  for (const row of rows) assert.doesNotMatch(JSON.stringify(row), /bitget\.work|clacCode/, "only sanitized click metadata");
});

test("/go/bitget-alliance falls back to /go/bitget after 26 Oct 16:00 (UTC+8)", async () => {
  assert.equal(BITGET_ALLIANCE_CAMPAIGN.endAt, "2026-10-26T08:00:00Z");
  const late = await goSetup("2026-10-26T08:00:01Z");
  const res = await late.handle(new Request("https://nexualpha.com/go/bitget-alliance?src=short", { headers: { "user-agent": "Mozilla/5.0" } }));
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "/go/bitget?src=short-expired");
  const early = await goSetup("2026-10-26T07:59:59Z");
  const live = await early.handle(new Request("https://nexualpha.com/go/bitget-alliance", { headers: { "user-agent": "Mozilla/5.0" } }));
  assert.match(live.headers.get("location"), /^https:\/\/www\.bitget\.com\//);
});

test("/activities/bitget-alliance renders at request time in en and zh-hans with canonical, hreflang, title budget, pool and countdown", async () => {
  for (const [p, locale] of [[BITGET_ALLIANCE_PATH, "en"], [`/zh-hans${BITGET_ALLIANCE_PATH}`, "zh-Hans"], [`/ja${BITGET_ALLIANCE_PATH}`, "ja"]]) {
    const response = await fetchPage(p);
    const html = await response.text();
    assert.equal(response.status, 200, p);
    assert.deepEqual(h1Texts(html), [BITGET_ALLIANCE_COPY[locale].h1], `${p}: one h1`);
    assert.match(html, /<main class="nxba /, `${p}: page body in the SSR HTML`);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://nexualpha.com${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `${p}: self canonical`);
    assert.match(html, /<meta name="robots" content="index,follow"/, `${p}: indexable`);
    assert.equal((html.match(/rel="alternate" hreflang=/g) || []).length, BITGET_ALLIANCE_INDEX_LOCALES.length + 1, `${p}: hreflang set`);
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/)[1];
    assert.ok(title.length <= titleBudgetForLocale(locale), `${p}: title budget (${title})`);
    const main = mainHtml(html);
    assert.ok(main.includes("4,847,923.09"), `${p}: total pool in the HTML`);
    assert.match(main, /datetime="2026-10-26T08:00:00Z"/i, `${p}: countdown end`);
    for (const [question] of BITGET_ALLIANCE_COPY[locale].faq) assert.ok(main.includes(question.replaceAll("'", "&#x27;")) || main.includes(question), `${p}: FAQ in SSR`);
    assert.ok(main.includes("≈ 4.86 USDT") && main.includes("≈ 0.49 USDT"), `${p}: worked example rows`);
    assert.match(main, /href="(?:\/[a-z-]+)?\/exchanges\/bitget"/, `${p}: related profile`);
    assert.match(main, /\/activities\/updates\/bitget\//, `${p}: our summary of the announcement`);
  }
  for (const p of [`/it${BITGET_ALLIANCE_PATH}`, `/ru${BITGET_ALLIANCE_PATH}`]) {
    assert.match(await (await fetchPage(p)).text(), /<meta name="robots" content="noindex,follow"/, `${p}: unwritten locale is noindex`);
  }
});

test("JSON-LD: WebPage, FAQPage with the page's questions, BreadcrumbList; client head helper agrees", async () => {
  const html = await (await fetchPage(BITGET_ALLIANCE_PATH)).text();
  const ld = ldJson(html);
  const faq = ld.find((item) => item["@type"] === "FAQPage");
  assert.ok(faq, "FAQPage");
  assert.deepEqual(faq.mainEntity.map((q) => q.name), BITGET_ALLIANCE_COPY.en.faq.map(([q]) => q));
  assert.ok(ld.some((item) => item["@type"] === "WebPage" && item.about?.name === "Bitget"));
  assert.ok(ld.some((item) => item["@type"] === "BreadcrumbList"));
  const seo = computeRouteSeo({ url: `/zh-hans${BITGET_ALLIANCE_PATH}` });
  assert.equal(seo.status, 200);
  assert.ok(seo.schemas.some((item) => item["@type"] === "FAQPage"));
});

test("every CTA uses /go/bitget-alliance with the code and a copy button next to it; no direct bitget.com sign-up link", async () => {
  // vi is neutral since 2026-10-13 (covered by tests/vi-neutral-locale.test.mjs): id takes its place here.
  for (const p of [BITGET_ALLIANCE_PATH, `/zh-hans${BITGET_ALLIANCE_PATH}`, `/es${BITGET_ALLIANCE_PATH}`, `/id-id${BITGET_ALLIANCE_PATH}`, `/ko${BITGET_ALLIANCE_PATH}`]) {
    const main = mainHtml(await (await fetchPage(p)).text());
    const links = anchors(main);
    for (const { href } of links) {
      if (/^https?:\/\/[^/]*bitget\./i.test(href)) assert.fail(`${p}: links bitget directly (${href}); CTAs must go through /go/bitget-alliance`);
      assert.doesNotMatch(href, /bitget\.work|clacCode|channelCode|\/go\/bitget(?:\?|$)/, `${p}: ${href}`);
    }
    const ctas = links.filter(({ tag }) => /data-offer-link="go"|rel="sponsored/.test(tag));
    assert.ok(ctas.length >= 4, `${p}: hero, steps, example and final CTAs (${ctas.length})`);
    for (const { href } of ctas) assert.match(href, /^\/go\/bitget-alliance\?src=alliance-[a-z]+(?:&lang=[A-Za-z-]+)?$/, `${p}: CTA ${href}`);
    assert.equal((main.match(/<code translate="no">DPRWSXAS<\/code>/g) || []).length, ctas.length, `${p}: the code with a copy button next to every CTA`);
    assert.doesNotMatch(main, new RegExp(MAIN_CODE, "i"), `${p}: the main Bitget code is not used on this page`);
  }
});

test("no CTA in Türkiye, the US, restricted markets or neutral/restricted editions; informational page instead", async () => {
  for (const p of [`${BITGET_ALLIANCE_PATH}?market=US`, `${BITGET_ALLIANCE_PATH}?market=TR`, `/ru${BITGET_ALLIANCE_PATH}`, `/ar${BITGET_ALLIANCE_PATH}`,
    `/zh-hant${BITGET_ALLIANCE_PATH}`, `/ur${BITGET_ALLIANCE_PATH}`, `/fr${BITGET_ALLIANCE_PATH}`, `/de${BITGET_ALLIANCE_PATH}`, `/ja${BITGET_ALLIANCE_PATH}`]) {
    const response = await fetchPage(p);
    assert.equal(response.status, 200, p);
    const main = mainHtml(await response.text());
    assert.doesNotMatch(main, /href="\/go\/|rel="sponsored|DPRWSXAS/, `${p}: no CTA, no code`);
    assert.match(main, /data-signup="off"/, `${p}: informational edition`);
  }
});

test("no fine print and no 'we earn' wording on the page, its teasers or its brief (footer excluded)", async () => {
  for (const locale of BITGET_ALLIANCE_INDEX_LOCALES) {
    const main = mainHtml(await harness.render(`https://nexualpha.com${BITGET_ALLIANCE_PATH}?locale=${locale}`, {}));
    for (const pattern of [...FINE_PRINT, SELF_INTEREST]) assert.doesNotMatch(main, pattern, `${locale}: ${pattern}`);
    const blob = JSON.stringify(BITGET_ALLIANCE_COPY[locale]);
    for (const pattern of [...FINE_PRINT, SELF_INTEREST]) assert.doesNotMatch(blob, pattern, `${locale} copy: ${pattern}`);
    assert.doesNotMatch(JSON.stringify(bitgetAllianceTeaser(locale)), SELF_INTEREST, `${locale}: teaser`);
  }
  const payload = JSON.parse(await readFile(new URL("../public/content/campaign-briefs.json", import.meta.url), "utf8"));
  const brief = payload.items.find((item) => item.id === BITGET_ALLIANCE_ANNOUNCEMENT_ID);
  for (const pattern of [...FINE_PRINT, SELF_INTEREST]) assert.doesNotMatch(JSON.stringify(brief), pattern, "brief");
});

test("hydration has no mismatch (en, zh-hans, ar)", async () => {
  for (const p of [BITGET_ALLIANCE_PATH, `/zh-hans${BITGET_ALLIANCE_PATH}`, `/ar${BITGET_ALLIANCE_PATH}`]) {
    const html = await (await fetchPage(p)).text();
    const { errors } = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${p}`);
    assert.deepEqual(hydrationErrors(errors), [], `${p}: ${errors.join("\n")}`);
  }
});

test("live pool: Bitget's public figures are validated, cached and served as /intel/bitget-alliance.json", async () => {
  const body = { code: "00000", data: { displayStatDay: "2026-10-12", totalRewardPool: "5000000.5", tradeRewardPool: "3000000.3", fundRewardPool: "2000000.2", dailyTradeRewardPool: "70000", dailyFundRewardPool: "46000", tradeDailyRankTotalVolume: "1400000000", fundDailyRankTotalVolume: "4600000000" } };
  let calls = 0;
  let t = Date.parse("2026-10-13T00:00:00Z");
  const pool = createBitgetAlliancePool({ fetchImpl: async (url, init) => { calls += 1; assert.equal(init.method, "POST"); assert.match(url, /^https:\/\/www\.bitget\.com\/v1\/act\//); return Response.json(body); }, now: () => t });
  const res = await pool.respond();
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.totalPool, 5000000.5);
  assert.equal(data.statDay, "2026-10-12");
  await pool.read(); t += 5 * 60 * 1000; await pool.read();
  assert.equal(calls, 1, "cached for 10 minutes");
  assert.throws(() => normalizeBitgetAlliancePool({ code: "00000", data: { ...body.data, tradeRewardPool: "1" } }), /add up/);
  assert.throws(() => normalizeBitgetAlliancePool({ code: "40001", data: {} }), /envelope/);
  const broken = createBitgetAlliancePool({ fetchImpl: async () => new Response("no", { status: 503 }) });
  assert.equal((await broken.respond()).status, 404, "no figures are invented when Bitget fails");
  assert.equal((await createBitgetAlliancePool({ enabled: false }).respond()).status, 404);
});

test("sitemap-campaigns.xml lists every written edition", async () => {
  const sitemap = buildCampaignSitemap();
  assert.equal((sitemap.xml.match(/<loc>[^<]*\/activities\/bitget-alliance<\/loc>/g) || []).length, BITGET_ALLIANCE_INDEX_LOCALES.length);
  assert.match(sitemap.xml, /<loc>https:\/\/nexualpha\.com\/zh-hans\/activities\/bitget-alliance<\/loc>/);
  assert.equal(await readFile(new URL("../public/sitemap-campaigns.xml", import.meta.url), "utf8"), sitemap.xml, "committed sitemap is current");
});

test("campaign brief and archived announcement: valid, localized, free of codes and URLs", async () => {
  const payload = JSON.parse(await readFile(new URL("../public/content/campaign-briefs.json", import.meta.url), "utf8"));
  const brief = payload.items.find((item) => item.id === BITGET_ALLIANCE_ANNOUNCEMENT_ID);
  assert.ok(brief, "brief for the Bitget Alliance announcement");
  assert.equal(brief.deadline, BITGET_ALLIANCE_CAMPAIGN.endAt);
  assert.ok(Object.keys(brief.headline).length >= 10);
  assert.deepEqual(validateCampaignBriefs({ items: [brief] }, { ids: [BITGET_ALLIANCE_ANNOUNCEMENT_ID], partnerCodes: [BITGET_ALLIANCE_CODE, MAIN_CODE] }), []);
  const archive = JSON.parse(await readFile(new URL("../public/intel/official-announcements-archive.json", import.meta.url), "utf8"));
  const row = archive.items.find((item) => item.id === BITGET_ALLIANCE_ANNOUNCEMENT_ID);
  assert.equal(row?.url, "https://www.bitget.com/en/support/articles/12560603896118");
});

test("featured placements: top of the home campaigns block, /activities, /exchanges/bitget and /flash link the campaign page", async () => {
  const home = await harness.render("https://nexualpha.com/?locale=en", {});
  // Kraken 5M USDG Challenge (2026-10-13) leads; Bitget Alliance stays featured right after it.
  const featured = (html) => [...html.matchAll(/data-featured-campaign="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(featured(home).slice(0, 2).includes("bitget-alliance"), "home: Bitget Alliance is among the first two featured rows");
  assert.match(home, /data-featured-campaign="bitget-alliance"[\s\S]*?href="\/activities\/bitget-alliance"/, "home featured row");
  const activities = await harness.render("https://nexualpha.com/activities?locale=zh-Hans", {});
  assert.ok(featured(activities).slice(0, 2).includes("bitget-alliance"), "/activities: among the top two spotlights");
  assert.match(activities, /class="campaign-spotlight" href="\/zh-hans\/activities\/bitget-alliance"/);
  const venue = await harness.render("https://nexualpha.com/exchanges/bitget?locale=en", {});
  assert.match(venue, /class="v3-venue-campaign-banner"[^>]*href="\/activities\/bitget-alliance"/, "Bitget profile banner");
  const tr = await harness.render("https://nexualpha.com/exchanges/bitget?locale=tr", {});
  assert.doesNotMatch(tr, /bitget-alliance/, "no Bitget campaign banner in Türkiye");
  const trHome = await harness.render("https://nexualpha.com/?locale=tr", {});
  assert.doesNotMatch(trHome, /bitget-alliance/, "no Bitget campaign row on the Turkish home page");
  const okx = await harness.render("https://nexualpha.com/exchanges/okx?locale=en", {});
  assert.doesNotMatch(okx, /data-featured-campaign="bitget-alliance"/, "only on Bitget");
  const flash = await harness.render("https://nexualpha.com/flash?locale=en", {});
  assert.match(flash, /class="nxf-feat" href="\/activities\/bitget-alliance"/, "/flash pinned campaign item");
  for (const html of [home, activities, venue, flash]) assert.doesNotMatch(html, /\/go\/bitget-alliance|DPRWSXAS/, "placements link our page, not the campaign route");
});
