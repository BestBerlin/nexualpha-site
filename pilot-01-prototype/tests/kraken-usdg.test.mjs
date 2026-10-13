// Kraken 5M USDG Futures Challenge page (/activities/kraken-usdg-challenge, owner 2026-10-13): request-time SSR, head
// metadata and JSON-LD, sitemap, the funnel (step 1 = /go/kraken with our registry code, step 2 = the tracked route
// /go/kraken-usdg-challenge to Kraken's official page, which falls back to /exchanges/kraken after the end), geo gating
// (no CTA in Türkiye, excluded countries, neutral locales or fr/de/pt-BR/ja editions), the owner's no-fine-print and
// no-"we earn" rules, the live figures endpoint, the campaign brief and the featured placements.
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import worker from "../worker/index.js";
import {
  KRAKEN_USDG_ANNOUNCEMENT_ID, KRAKEN_USDG_CAMPAIGN, KRAKEN_USDG_INDEX_LOCALES, KRAKEN_USDG_OFFICIAL_URL, KRAKEN_USDG_PATH, KRAKEN_USDG_TIERS,
  krakenUsdgExample, krakenUsdgPromotable, krakenUsdgSignup, krakenUsdgSignupGate, krakenUsdgTeaser, krakenUsdgTierFor, krakenUsdgTierTotal,
} from "../src/data/kraken-usdg.js";
import { KRAKEN_USDG_COPY } from "../src/data/kraken-usdg-copy.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { partnerRegistry } from "../src/data/partner-registry.js";
import { titleBudgetForLocale } from "../src/data/meta-description.js";
import { validateCampaignBriefs } from "../src/data/campaign-briefs.js";
import { createGoRedirect } from "../server/go-redirect.mjs";
import { createKrakenUsdgLive, extractKrakenCompetition, normalizeKrakenUsdg } from "../server/kraken-usdg-live.mjs";
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
const CODE = partnerRegistry.kraken.inviteCode;
const DURING = Date.parse("2026-10-13T00:00:00Z");
const AFTER = Date.parse("2026-12-11T00:00:00Z");

const FINE_PRINT = [
  /not (?:investment|financial) advice/i, /capital (?:is )?at risk/i, /may get back less/i, /pays our commission/i, /affiliate commission/i,
  /commission disclosure/i, /partner link ·/i, /terms (?:and conditions )?apply/i, /past performance/i, /disclaimer/i,
  /非投资建议|不构成投资建议|资本有风险|佣金由交易所支付|免责声明|投资有风险/, /非投資建議|資本有風險/,
];
const SELF_INTEREST = /\bwe earn|\bour referral|support us|we get paid|earns? (?:us|NexuAlpha)|NexuAlpha (?:earns|is paid|gets paid)|commission (?:to|for) (?:us|NexuAlpha)|inviter (?:earns|gets)|我们获得|我們獲得|我们赚|我們賺|支持我们|支持我們|邀请人(?:获得|赚)|返佣给我们/i;

test("rules: 8 tiers add up to their pools, thresholds and prizes match Kraken's rules", () => {
  assert.equal(CODE, "7f97gkqw");
  assert.deepEqual(KRAKEN_USDG_TIERS.map((t) => t.threshold), [0, 3e9, 3.5e9, 5e9, 6e9, 7.5e9, 12e9, 18.5e9]);
  assert.deepEqual(KRAKEN_USDG_TIERS.map((t) => t.pool), [25000, 100000, 300000, 700000, 1000000, 1500000, 3000000, 5000000]);
  for (const t of KRAKEN_USDG_TIERS) assert.equal(krakenUsdgTierTotal(t), t.pool);
  assert.deepEqual(KRAKEN_USDG_TIERS[0].prizes, [3750, 2000, 1500, 750, 500, 250, 37.5]);
  assert.equal(KRAKEN_USDG_TIERS[0].tail, 10125);
  assert.equal(KRAKEN_USDG_TIERS[7].prizes[0], 750000);
  assert.equal(krakenUsdgTierFor(2999999999), 0);
  assert.equal(krakenUsdgTierFor(3e9), 1);
  assert.equal(krakenUsdgTierFor(2e10), 7);
  assert.equal(KRAKEN_USDG_CAMPAIGN.startAt, "2026-10-12T13:30:00Z");
  assert.equal(KRAKEN_USDG_CAMPAIGN.endAt, "2026-12-10T23:59:59Z");
});

test("worked example: 60,000 USD qualifies; 2x counts 120,000, 3x 180,000", () => {
  assert.deepEqual(krakenUsdgExample(60000, 1), { weighted: 60000, qualifies: true });
  assert.deepEqual(krakenUsdgExample(60000, 2), { weighted: 120000, qualifies: true });
  assert.deepEqual(krakenUsdgExample(60000, 3), { weighted: 180000, qualifies: true });
  assert.equal(krakenUsdgExample(30000, 2).qualifies, false, "the minimum counts actual volume, not weighted");
});

test("copy: 10 written editions, same structure, code only through the placeholder, SGT times", () => {
  assert.deepEqual(Object.keys(KRAKEN_USDG_COPY).sort(), [...KRAKEN_USDG_INDEX_LOCALES].sort());
  for (const locale of KRAKEN_USDG_INDEX_LOCALES) {
    const t = KRAKEN_USDG_COPY[locale];
    const blob = JSON.stringify(t);
    assert.equal(t.faq.length, 7, locale);
    assert.equal(t.steps.length, 3, locale);
    assert.ok(t.step1Cta.includes("{code}") && t.steps[0][0].includes("{code}"), `${locale}: code from the placeholder`);
    assert.doesNotMatch(blob, new RegExp(CODE, "i"), `${locale}: no hand-typed code`);
    assert.doesNotMatch(blob, /kraken\.com/i, `${locale}: no domain-like brand text`);
    assert.match(t.endsAt, /07:59:59 SGT/, `${locale}: end time in SGT`);
    for (const n of ["5,000,000", "50,000"]) assert.ok(blob.includes(n), `${locale}: ${n}`);
    assert.ok(String(t.seoTitle).replace("{code}", CODE).length <= titleBudgetForLocale(locale), `${locale}: title budget`);
  }
});

test("funnel: step 1 = /go/kraken with src + registry code, step 2 = /go/kraken-usdg-challenge", () => {
  assert.deepEqual(krakenUsdgSignup({ locale: "en", placement: "hero", now: DURING }),
    { code: CODE, href: "/go/kraken?src=kraken-usdg-hero", registerHref: "/go/kraken-usdg-challenge?src=kraken-usdg-hero" });
  for (const locale of ["en", "zh-Hans", "es", "id", "ko"]) assert.ok(krakenUsdgSignup({ locale, now: DURING }), locale);
  assert.equal(krakenUsdgSignup({ locale: "en", now: AFTER }), null, "no CTA after the end");
});

test("geo: no CTA in Türkiye, excluded countries, neutral locales or fr/de/pt-BR/ja editions", () => {
  assert.equal(krakenUsdgSignupGate({ locale: "tr" }), "partner-geo-restricted", "Türkiye: Kraken is not on the allow-list");
  for (const market of ["TR", "US", "UK", "BR", "AR-COUNTRY", "JP", "EU"]) assert.equal(krakenUsdgSignup({ locale: "en", market, now: DURING }), null, `market ${market}`);
  for (const locale of NEUTRAL_CTA_LOCALE_LIST) assert.equal(krakenUsdgSignupGate({ locale }), "neutral-locale", locale);
  for (const locale of ["fr", "de", "it", "pt-BR", "ja"]) assert.equal(krakenUsdgSignup({ locale, now: DURING }), null, locale);
  assert.equal(krakenUsdgPromotable({ locale: "tr", now: DURING }), false);
  assert.equal(krakenUsdgPromotable({ locale: "en", now: AFTER }), false);
});

async function goSetup(at) {
  const dir = await mkdtemp(path.join(tmpdir(), "go-kr-"));
  await mkdir(path.join(dir, "client", "intel"), { recursive: true });
  await writeFile(path.join(dir, "client", "intel", "partners.json"), JSON.stringify({ partners: [{ slug: "kraken", registrationUrl: `https://www.kraken.com/sign-up?ref=${CODE}` }] }));
  const eventFile = path.join(dir, "go.jsonl");
  return { handle: createGoRedirect({ clientRoot: path.join(dir, "client"), eventFile, now: () => new Date(at) }), eventFile };
}

test("/go/kraken-usdg-challenge 302s to Kraken's challenge page and logs the click; /go/kraken keeps the code", async () => {
  const { handle, eventFile } = await goSetup("2026-10-13T00:00:00Z");
  const ua = { "user-agent": "Mozilla/5.0" };
  let res = await handle(new Request("https://nexualpha.com/go/kraken-usdg-challenge?src=kraken-usdg-hero", { headers: ua }));
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), `${KRAKEN_USDG_OFFICIAL_URL}?ref=7f97gkqw`, "official challenge page with our Kraken code (owner 2026-10-13)");
  assert.match(res.headers.get("x-robots-tag"), /noindex/);
  res = await handle(new Request("https://nexualpha.com/go/kraken?src=kraken-usdg-hero", { headers: ua }));
  assert.equal(res.headers.get("location"), `https://www.kraken.com/sign-up?ref=${CODE}`);
  await new Promise((r) => setTimeout(r, 50));
  const rows = (await readFile(eventFile, "utf8")).trim().split("\n").map((l) => JSON.parse(l));
  assert.deepEqual(rows.map((r) => [r.partner, r.src, r.venue || null, r.campaign || null]).sort(),
    [["kraken", "kraken-usdg-hero", null, null], ["kraken-usdg-challenge", "kraken-usdg-hero", "kraken", "usdg-challenge"]].sort());
});

test("/go/kraken-usdg-challenge falls back to /exchanges/kraken after 11 Dec 07:59:59 SGT", async () => {
  const late = await goSetup("2026-12-11T00:00:00Z");
  const res = await late.handle(new Request("https://nexualpha.com/go/kraken-usdg-challenge?src=short", { headers: { "user-agent": "Mozilla/5.0" } }));
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "/exchanges/kraken");
  const early = await goSetup("2026-12-10T23:59:58Z");
  const live = await early.handle(new Request("https://nexualpha.com/go/kraken-usdg-challenge", { headers: { "user-agent": "Mozilla/5.0" } }));
  assert.equal(live.headers.get("location"), `${KRAKEN_USDG_OFFICIAL_URL}?ref=7f97gkqw`);
});

test("page renders at request time with canonical, hreflang, tiers, prizes, worked example, countdown", async () => {
  for (const [p, locale] of [[KRAKEN_USDG_PATH, "en"], [`/zh-hans${KRAKEN_USDG_PATH}`, "zh-Hans"], [`/vi${KRAKEN_USDG_PATH}`, "vi"]]) {
    const response = await fetchPage(p);
    const html = await response.text();
    assert.equal(response.status, 200, p);
    assert.deepEqual(h1Texts(html), [KRAKEN_USDG_COPY[locale].h1], `${p}: one h1`);
    assert.match(html, /<main class="nxku /, `${p}: page body in SSR`);
    assert.match(html, /<meta name="robots" content="index,follow"/, `${p}: indexable`);
    assert.equal((html.match(/rel="alternate" hreflang=/g) || []).length, KRAKEN_USDG_INDEX_LOCALES.length + 1, `${p}: hreflang`);
    const main = mainHtml(html);
    for (const n of ["5,000,000", "18,500,000,000 USD", "750,000 USDG", "10,125", "120,000 USD", "180,000 USD"]) assert.ok(main.includes(n), `${p}: ${n}`);
    assert.match(main, /datetime="2026-12-10T23:59:59Z"/i, `${p}: countdown end`);
    assert.match(main, /role="progressbar"/, `${p}: progress to the next tier`);
    for (const [question] of KRAKEN_USDG_COPY[locale].faq) assert.ok(main.includes(question.replaceAll("'", "&#x27;")) || main.includes(question), `${p}: FAQ in SSR`);
  }
  for (const p of [`/it${KRAKEN_USDG_PATH}`, `/tr${KRAKEN_USDG_PATH}`, `/ru${KRAKEN_USDG_PATH}`]) {
    assert.match(await (await fetchPage(p)).text(), /<meta name="robots" content="noindex,follow"/, `${p}: unwritten locale is noindex`);
  }
});

test("JSON-LD: WebPage, FAQPage, BreadcrumbList; client head helper agrees", async () => {
  const ld = ldJson(await (await fetchPage(KRAKEN_USDG_PATH)).text());
  const faq = ld.find((item) => item["@type"] === "FAQPage");
  assert.deepEqual(faq.mainEntity.map((q) => q.name), KRAKEN_USDG_COPY.en.faq.map(([q]) => q));
  assert.ok(ld.some((item) => item["@type"] === "WebPage" && item.about?.name === "Kraken"));
  assert.ok(ld.some((item) => item["@type"] === "BreadcrumbList"));
  const seo = computeRouteSeo({ url: `/zh-hans${KRAKEN_USDG_PATH}` });
  assert.equal(seo.status, 200);
  assert.ok(seo.schemas.some((item) => item["@type"] === "FAQPage"));
});

test("primary CTAs use /go/kraken with src and the code + copy button; step 2 uses /go/kraken-usdg-challenge; no direct Kraken links", async () => {
  for (const p of [KRAKEN_USDG_PATH, `/zh-hans${KRAKEN_USDG_PATH}`, `/es${KRAKEN_USDG_PATH}`, `/ko${KRAKEN_USDG_PATH}`, `/id-id${KRAKEN_USDG_PATH}`]) {
    const main = mainHtml(await (await fetchPage(p)).text());
    const links = anchors(main);
    for (const { href } of links) assert.doesNotMatch(href, /^https?:\/\/[^/]*kraken\./i, `${p}: direct Kraken link ${href}`);
    const primary = links.filter(({ tag }) => /data-offer-link="go"/.test(tag));
    assert.ok(primary.length >= 4, `${p}: hero, steps, example, final (${primary.length})`);
    for (const { href, tag } of primary) {
      assert.match(href, /^\/go\/kraken\?src=kraken-usdg-[a-z]+$/, `${p}: ${href}`);
      assert.match(tag, /rel="sponsored/);
    }
    const register = links.filter(({ tag }) => /data-campaign-link="register"/.test(tag));
    assert.ok(register.length >= 4, `${p}: step-2 links`);
    for (const { href, tag } of register) {
      assert.match(href, /^\/go\/kraken-usdg-challenge\?src=kraken-usdg-[a-z]+$/, `${p}: ${href}`);
      assert.match(tag, /target="_blank"/);
    }
    assert.ok(main.indexOf('data-offer-link="go"') < main.indexOf('data-campaign-link="register"'), `${p}: step 1 comes before step 2`);
    assert.equal((main.match(new RegExp(`<code translate="no">${CODE}</code>`, "g")) || []).length, primary.length, `${p}: code next to every sign-up CTA`);
  }
});

test("no CTA, no code in Türkiye, excluded markets, neutral or excluded-country editions", async () => {
  for (const p of [`/tr${KRAKEN_USDG_PATH}`, `${KRAKEN_USDG_PATH}?market=US`, `${KRAKEN_USDG_PATH}?market=UK`, `${KRAKEN_USDG_PATH}?market=TR`, `/ru${KRAKEN_USDG_PATH}`, `/ar${KRAKEN_USDG_PATH}`,
    `/zh-hant${KRAKEN_USDG_PATH}`, `/ur${KRAKEN_USDG_PATH}`, `/uk-ua${KRAKEN_USDG_PATH}`, `/fr${KRAKEN_USDG_PATH}`, `/de${KRAKEN_USDG_PATH}`, `/pt-br${KRAKEN_USDG_PATH}`, `/ja${KRAKEN_USDG_PATH}`]) {
    const response = await fetchPage(p);
    assert.equal(response.status, 200, p);
    const main = mainHtml(await response.text());
    assert.doesNotMatch(main, new RegExp(`href="/go/|rel="sponsored|${CODE}|kraken\\.com/(?:sign-up|competitions)`), `${p}: no CTA`);
    assert.match(main, /data-signup="off"/, `${p}: informational edition`);
  }
});

test("no fine print and no 'we earn' wording on the page, teasers or brief", async () => {
  for (const locale of KRAKEN_USDG_INDEX_LOCALES) {
    const main = mainHtml(await harness.render(`https://nexualpha.com${KRAKEN_USDG_PATH}?locale=${locale}`, {}));
    for (const pattern of [...FINE_PRINT, SELF_INTEREST]) {
      assert.doesNotMatch(main, pattern, `${locale}: ${pattern}`);
      assert.doesNotMatch(JSON.stringify(KRAKEN_USDG_COPY[locale]), pattern, `${locale} copy: ${pattern}`);
    }
    assert.doesNotMatch(JSON.stringify(krakenUsdgTeaser(locale)), SELF_INTEREST, `${locale}: teaser`);
  }
  const payload = JSON.parse(await readFile(new URL("../public/content/campaign-briefs.json", import.meta.url), "utf8"));
  const brief = payload.items.find((item) => item.id === KRAKEN_USDG_ANNOUNCEMENT_ID);
  for (const pattern of [...FINE_PRINT, SELF_INTEREST]) assert.doesNotMatch(JSON.stringify(brief), pattern, "brief");
});

test("hydration has no mismatch (en, zh-hans, ar)", async () => {
  for (const p of [KRAKEN_USDG_PATH, `/zh-hans${KRAKEN_USDG_PATH}`, `/ar${KRAKEN_USDG_PATH}`]) {
    const html = await (await fetchPage(p)).text();
    const { errors } = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${p}`);
    assert.deepEqual(hydrationErrors(errors), [], `${p}: ${errors.join("\n")}`);
  }
});

const competitionHtml = (overrides = {}) => {
  const tiers = KRAKEN_USDG_TIERS.map((t, i) => ({ ...(i ? { activation_threshold: { amount: String(t.threshold), asset: "USD" } } : {}),
    prize_pools: [{ top_rank: 1, pool_size: { direct: { amount: String(t.pool), asset: "USDG" } } }] }));
  const result = { name: "futures-5m-usdg-challenge-10-26", prize: { tiers }, prize_tier_progress: { active_tier_index: 1, current_activation_metric: { amount: "3100000000.5", asset: "USD" } },
    individual_leaderboard: [{ rank: 1, display_name: "BriskPapayaGapBatch", trade_volume: { amount: "905595.37", asset: "USD" } }], ...overrides };
  return `<html><script>{"x":{"result":${JSON.stringify(result)}}}</script></html>`;
};

test("live figures: Kraken's public page is parsed, validated, cached and served as /intel/kraken-usdg.json", async () => {
  let calls = 0;
  let t = Date.parse("2026-10-13T00:00:00Z");
  const live = createKrakenUsdgLive({ fetchImpl: async (url) => { calls += 1; assert.equal(url, KRAKEN_USDG_OFFICIAL_URL); return new Response(competitionHtml()); }, now: () => t });
  const res = await live.respond();
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.communityVolume, 3100000000.5);
  assert.equal(data.activeTier, 1);
  assert.equal(data.leaderboard[0].volume, 905595.37);
  await live.read(); t += 5 * 60 * 1000; await live.read();
  assert.equal(calls, 1, "cached for 10 minutes");
  const changed = extractKrakenCompetition(competitionHtml());
  changed.prize.tiers[7].activation_threshold.amount = "20000000000";
  assert.throws(() => normalizeKrakenUsdg(changed), /differs/);
  assert.throws(() => extractKrakenCompetition("<html></html>"), /leaderboard/);
  const broken = createKrakenUsdgLive({ fetchImpl: async () => new Response("no", { status: 503 }) });
  assert.equal((await broken.respond()).status, 404, "nothing invented when Kraken fails");
  assert.equal((await createKrakenUsdgLive({ enabled: false }).respond()).status, 404);
});

test("sitemap-campaigns.xml lists every written edition", async () => {
  const sitemap = buildCampaignSitemap();
  assert.equal((sitemap.xml.match(/<loc>[^<]*\/activities\/kraken-usdg-challenge<\/loc>/g) || []).length, KRAKEN_USDG_INDEX_LOCALES.length);
  assert.equal(await readFile(new URL("../public/sitemap-campaigns.xml", import.meta.url), "utf8"), sitemap.xml, "committed sitemap is current");
});

test("campaign brief and archived row: valid, localized, free of codes and URLs", async () => {
  const payload = JSON.parse(await readFile(new URL("../public/content/campaign-briefs.json", import.meta.url), "utf8"));
  const brief = payload.items.find((item) => item.id === KRAKEN_USDG_ANNOUNCEMENT_ID);
  assert.equal(brief.deadline, KRAKEN_USDG_CAMPAIGN.endAt);
  assert.ok(Object.keys(brief.headline).length >= 10);
  assert.deepEqual(validateCampaignBriefs({ items: [brief] }, { ids: [KRAKEN_USDG_ANNOUNCEMENT_ID], partnerCodes: [CODE] }), []);
  const archive = JSON.parse(await readFile(new URL("../public/intel/official-announcements-archive.json", import.meta.url), "utf8"));
  assert.equal(archive.items.find((item) => item.id === KRAKEN_USDG_ANNOUNCEMENT_ID)?.url, KRAKEN_USDG_OFFICIAL_URL);
});

test("featured placements: home, /activities, /exchanges/kraken and /flash link our page; Bitget Alliance stays featured", async () => {
  const featured = (html) => [...html.matchAll(/data-featured-campaign="([^"]+)"/g)].map((m) => m[1]);
  const home = await harness.render("https://nexualpha.com/?locale=en", {});
  assert.equal(featured(home)[0], "kraken-usdg", "home: first featured row");
  assert.ok(featured(home).includes("bitget-alliance"), "home: Bitget Alliance still featured");
  const activities = await harness.render("https://nexualpha.com/activities?locale=zh-Hans", {});
  assert.equal(featured(activities)[0], "kraken-usdg");
  assert.match(activities, /class="campaign-spotlight" href="\/zh-hans\/activities\/kraken-usdg-challenge"/);
  const venue = await harness.render("https://nexualpha.com/exchanges/kraken?locale=en", {});
  assert.match(venue, /class="v3-venue-campaign-banner"[^>]*href="\/activities\/kraken-usdg-challenge"/, "Kraken profile banner");
  const tr = await harness.render("https://nexualpha.com/exchanges/kraken?locale=tr", {});
  assert.doesNotMatch(tr, /kraken-usdg/, "no banner in Türkiye");
  assert.doesNotMatch(await harness.render("https://nexualpha.com/?locale=tr", {}), /kraken-usdg/, "no row on the Turkish home");
  const flash = await harness.render("https://nexualpha.com/flash?locale=en", {});
  assert.deepEqual(featured(flash).slice(0, 2), ["kraken-usdg", "bitget-alliance"], "/flash pins both");
  for (const html of [home, activities, venue, flash]) assert.doesNotMatch(html, /\/go\/kraken-usdg-challenge/, "placements link our page");
});
