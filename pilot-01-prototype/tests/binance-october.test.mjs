// Binance October campaigns page (/activities/binance-october-gifts, 2026-10-12): request-time SSR, head metadata,
// sitemap, the three tracked campaign routes (/go/binance-gifts, /go/binance-refer2earn, /go/binance-tournament) with
// locale mapping, click logging and expiry fallback, geo gating, each section using only its own route, the featured
// placements, and the owner's copy rules (no fine print; the reader's reward leads; NexuAlpha never "earns").
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import worker from "../worker/index.js";
import { createGoRedirect } from "../server/go-redirect.mjs";
import {
  BINANCE_OCTOBER_CAMPAIGNS, BINANCE_OCTOBER_INDEX_LOCALES, BINANCE_OCTOBER_PATH, binanceCampaignHref, binanceCampaignUrl,
  binanceOctoberPromotable, binanceOctoberSignupGate,
} from "../src/data/binance-october.js";
import { BINANCE_OCTOBER_COPY } from "../src/data/binance-october-copy.js";
import { BINANCE_TOURNAMENT_COPY } from "../src/data/binance-october-tournament-copy.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { titleBudgetForLocale } from "../src/data/meta-description.js";
import { buildCampaignSitemap } from "../scripts/generate-prerender-manifest.mjs";
import { createSsrHarness, SHELL_HTML, h1Texts } from "./helpers/ssr-hydration-harness.mjs";

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
const mainHtml = (html) => (html.match(/<main\b[\s\S]*<\/main>/) || [""])[0];
const anchors = (html) => [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>/g)].map((m) => ({ tag: m[0], href: m[1].replaceAll("&amp;", "&") }));
const sectionHtml = (main, id) => (main.match(new RegExp(`<section[^>]*aria-labelledby="${id}"[\\s\\S]*?</section>`)) || [""])[0];

const FINE_PRINT = [
  /not (?:investment|financial) advice/i, /capital (?:is )?at risk/i, /may get back less/i, /risk warning/i, /affiliate commission/i,
  /commission disclosure/i, /terms (?:and conditions )?apply/i, /past performance/i,
  /非投资建议|不构成投资建议|资本有风险|风险提示|佣金/,
];
// Owner rule: NexuAlpha only passes the offer on; it never "earns".
const SELF_EARNING = [/we earn/i, /our commission/i, /our referral/i, /support us/i, /我们获得/, /我们赚/, /支持我们/];

test("copy: the same keys and shapes as English in every written edition; no fine print; NexuAlpha never earns", () => {
  for (const [name, copy] of [["page", BINANCE_OCTOBER_COPY], ["tournament", BINANCE_TOURNAMENT_COPY]]) {
    const en = copy.en;
    for (const [locale, t] of Object.entries(copy)) {
      assert.ok(BINANCE_OCTOBER_INDEX_LOCALES.includes(locale), `${name}: ${locale} is a listed edition`);
      for (const key of Object.keys(en)) {
        assert.ok(key in t, `${name} ${locale}: ${key}`);
        if (Array.isArray(en[key])) assert.equal(t[key].length, en[key].length, `${name} ${locale}: ${key} length`);
      }
      const text = JSON.stringify(t);
      for (const re of FINE_PRINT) assert.doesNotMatch(text, re, `${name} ${locale}: fine print ${re}`);
      for (const re of SELF_EARNING) assert.doesNotMatch(text, re, `${name} ${locale}: self-earning wording ${re}`);
      assert.doesNotMatch(text, /https?:\/\/|bsmkweb|GRO_|11350287/, `${name} ${locale}: no hand-typed links or codes`);
    }
  }
  assert.match(BINANCE_OCTOBER_COPY.en.h1, /8\.8 USDT/);
  assert.match(BINANCE_OCTOBER_COPY["zh-Hans"].h1, /8\.8 USDT/);
});

test("campaign URLs: binance.com only, exact refs, locale segment mapped", () => {
  assert.equal(binanceCampaignUrl("gifts", "zh-Hans"), "https://www.binance.com/zh-CN/referral/tier-reward/2610tierreferral/claim?ref=GRO_100029289_0QEW9");
  assert.equal(binanceCampaignUrl("gifts", "en"), "https://www.binance.com/en/referral/tier-reward/2610tierreferral/claim?ref=GRO_100029289_0QEW9");
  for (const [locale, seg] of [["es", "es"], ["pt-BR", "pt-BR"], ["tr", "tr"], ["vi", "vi"], ["id", "id"], ["ja", "ja"], ["ko", "ko"], ["fr", "fr"], ["de", "de"], ["it", "en"], ["xx", "en"]]) {
    assert.ok(binanceCampaignUrl("gifts", locale).startsWith(`https://www.binance.com/${seg}/`), locale);
  }
  assert.equal(binanceCampaignUrl("refer2earn", "en"), "https://www.binance.com/en/referral/earn-together/refer2earn-usdc/claim?ref=GRO_28502_ES1YJ");
  assert.equal(binanceCampaignUrl("tournament", "zh-Hans"), "https://www.binance.com/zh-CN/activity/trading-competition/ref-tournament-oct?ref=11350287");
  assert.equal(BINANCE_OCTOBER_CAMPAIGNS.tournament.endAt, "2026-10-31T23:59:59Z");
});

async function goSetup(at) {
  const dir = await mkdtemp(path.join(tmpdir(), "go-bn-"));
  await mkdir(path.join(dir, "client", "intel"), { recursive: true });
  await writeFile(path.join(dir, "client", "intel", "partners.json"), JSON.stringify({ partners: [{ slug: "binance", registrationUrl: "https://accounts.binance.com/register?ref=11350287" }] }));
  const eventFile = path.join(dir, "go.jsonl");
  return { handle: createGoRedirect({ clientRoot: path.join(dir, "client"), eventFile, now: () => new Date(at) }), eventFile };
}

test("/go/binance-* 302 to the official campaign page in the visitor's language and record the click", async () => {
  const { handle, eventFile } = await goSetup("2026-10-13T00:00:00Z");
  const ua = { "user-agent": "Mozilla/5.0" };
  let res = await handle(new Request("https://nexualpha.com/go/binance-gifts?src=gifts-hero&lang=zh-Hans", { headers: ua }));
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "https://www.binance.com/zh-CN/referral/tier-reward/2610tierreferral/claim?ref=GRO_100029289_0QEW9");
  assert.match(res.headers.get("x-robots-tag"), /noindex/);
  res = await handle(new Request("https://nexualpha.com/go/binance-refer2earn?src=r2e-section&lang=tr", { headers: ua }));
  assert.equal(res.headers.get("location"), "https://www.binance.com/tr/referral/earn-together/refer2earn-usdc/claim?ref=GRO_28502_ES1YJ");
  res = await handle(new Request("https://nexualpha.com/go/binance-tournament?src=tg-en", { headers: ua }));
  assert.equal(res.headers.get("location"), "https://www.binance.com/en/activity/trading-competition/ref-tournament-oct?ref=11350287");
  res = await handle(new Request("https://nexualpha.com/go/binance?src=x", { headers: ua }));
  assert.equal(res.headers.get("location"), "https://accounts.binance.com/register?ref=11350287", "regular /go/binance is unchanged");
  await new Promise((r) => setTimeout(r, 50));
  const rows = (await readFile(eventFile, "utf8")).trim().split("\n").map((l) => JSON.parse(l));
  // appendFile is fire-and-forget, so rows may land in any order.
  assert.deepEqual(rows.map((r) => [r.partner, r.src, r.campaign || null]).sort(), [["binance-gifts", "gifts-hero", "gifts"], ["binance-refer2earn", "r2e-section", "refer2earn"], ["binance-tournament", "tg-en", "tournament"], ["binance", "x", null]].sort());
});

test("/go/binance-* fall back to /go/binance after each campaign ends", async () => {
  const late = await goSetup("2026-11-05T00:00:00Z");
  const gifts = await late.handle(new Request("https://nexualpha.com/go/binance-gifts?src=short", { headers: { "user-agent": "Mozilla/5.0" } }));
  assert.equal(gifts.status, 302);
  assert.equal(gifts.headers.get("location"), "/go/binance?src=short-expired");
  const tour = await late.handle(new Request("https://nexualpha.com/go/binance-tournament", { headers: { "user-agent": "Mozilla/5.0" } }));
  assert.equal(tour.headers.get("location"), "/go/binance?src=unknown-expired");
  const r2e = await late.handle(new Request("https://nexualpha.com/go/binance-refer2earn?src=x", { headers: { "user-agent": "Mozilla/5.0" } }));
  assert.ok(r2e.headers.get("location").startsWith("https://www.binance.com/"), "Refer2Earn runs until its 30-day review");
  const review = await goSetup("2026-11-12T00:00:00Z");
  const r2eLate = await review.handle(new Request("https://nexualpha.com/go/binance-refer2earn?src=x", { headers: { "user-agent": "Mozilla/5.0" } }));
  assert.equal(r2eLate.headers.get("location"), "/go/binance?src=x-expired");
  assert.equal(binanceCampaignHref("gifts", { locale: "en", now: Date.parse("2026-11-05T00:00:00Z") }), null, "no campaign CTA after the end");
});

test("geo gating follows the site's Binance rules: neutral locales and restricted markets get no CTA; Türkiye allowed", () => {
  const now = Date.parse("2026-10-13T00:00:00Z");
  assert.equal(binanceCampaignHref("gifts", { locale: "en", placement: "gifts-hero", now }), "/go/binance-gifts?src=gifts-hero&lang=en");
  assert.equal(binanceCampaignHref("gifts", { locale: "tr", now }), "/go/binance-gifts?src=page&lang=tr");
  for (const locale of ["ru", "ar", "zh-Hant", "ur", "uk"]) {
    assert.equal(binanceOctoberSignupGate({ locale }), "neutral-locale", locale);
    assert.equal(binanceCampaignHref("gifts", { locale, now }), null, locale);
    assert.equal(binanceOctoberPromotable({ locale, now }), false, `${locale}: no teaser`);
  }
  for (const market of ["NL", "CA", "EU"]) assert.equal(binanceCampaignHref("tournament", { locale: "en", market, now }), null, `market ${market}`);
});

test("/activities/binance-october-gifts renders at request time; canonical, hreflang, title budget, FAQ in SSR", async () => {
  for (const [p, locale] of [[BINANCE_OCTOBER_PATH, "en"], [`/zh-hans${BINANCE_OCTOBER_PATH}`, "zh-Hans"]]) {
    const response = await fetchPage(p);
    const html = await response.text();
    assert.equal(response.status, 200, p);
    assert.deepEqual(h1Texts(html), [BINANCE_OCTOBER_COPY[locale].h1], `${p}: one h1`);
    assert.match(html, /<main class="nxbg /, `${p}: page body in the SSR HTML`);
    assert.match(html, /<meta name="robots" content="index,follow"/, `${p}: indexable`);
    assert.equal((html.match(/rel="alternate" hreflang=/g) || []).length, Object.keys(BINANCE_OCTOBER_COPY).length + 1, `${p}: hreflang set`);
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/)[1];
    assert.ok(title.length <= titleBudgetForLocale(locale), `${p}: title budget (${title})`);
    const main = mainHtml(html);
    assert.match(main, /datetime="2026-11-04T15:59:59Z"/i, "gifts countdown");
    assert.match(main, /datetime="2026-10-31T23:59:59Z"/i, "tournament countdown");
    assert.ok(main.includes("FAQPage") === false);
    assert.ok(html.includes('"@type":"FAQPage"'), `${p}: FAQPage JSON-LD`);
  }
  const ru = await (await fetchPage(`/ru${BINANCE_OCTOBER_PATH}`)).text();
  assert.match(ru, /<meta name="robots" content="noindex,follow"/, "unwritten locale is noindex");
  assert.equal(computeRouteSeo({ url: `/zh-hans${BINANCE_OCTOBER_PATH}` }).status, 200);
  const sitemap = buildCampaignSitemap();
  // The campaigns sitemap is shared with other campaign pages (Bybit Stocks): count this page's entries.
  assert.equal((sitemap.xml.match(/<loc>[^<]*\/activities\/binance-october-gifts<\/loc>/g) || []).length, Object.keys(BINANCE_OCTOBER_COPY).length);
  assert.match(sitemap.xml, /https:\/\/nexualpha\.com\/zh-hans\/activities\/binance-october-gifts/);
});

test("every CTA is attributed: each section uses only its own /go route; no direct binance.com link; neutral editions have none", async () => {
  for (const p of [BINANCE_OCTOBER_PATH, `/zh-hans${BINANCE_OCTOBER_PATH}`, `/tr${BINANCE_OCTOBER_PATH}`]) {
    const main = mainHtml(await (await fetchPage(p)).text());
    const offers = anchors(main).filter((a) => /data-offer-link="go"/.test(a.tag));
    assert.ok(offers.length >= 5, `${p}: CTAs present (${offers.length})`);
    for (const a of offers) {
      assert.match(a.href, /^\/go\/binance-(?:gifts|refer2earn|tournament)\?src=/, `${p}: ${a.href}`);
      assert.match(a.tag, /rel="sponsored noopener noreferrer"/);
    }
    assert.ok(!anchors(main).some((a) => /binance\.com|bsmkweb/.test(a.href)), `${p}: no direct Binance links`);
    const own = (id, slug) => {
      const hrefs = anchors(sectionHtml(main, id)).filter((a) => a.href.startsWith("/go/")).map((a) => a.href);
      assert.ok(hrefs.length >= 1, `${p} ${id}: has a CTA`);
      for (const href of hrefs) assert.ok(href.startsWith(`/go/${slug}?`), `${p} ${id}: ${href}`);
    };
    own("nxbg-steps", "binance-gifts");
    own("nxbg-tour", "binance-tournament");
    own("nxbg-r2e", "binance-refer2earn");
    for (const re of [...FINE_PRINT, ...SELF_EARNING]) assert.doesNotMatch(main.replace(/<[^>]+>/g, " "), re, `${p}: ${re}`);
  }
  for (const locale of ["ru", "zh-hant", "ar"]) {
    const main = mainHtml(await (await fetchPage(`/${locale}${BINANCE_OCTOBER_PATH}`)).text());
    assert.ok(!anchors(main).some((a) => a.href.startsWith("/go/")), `${locale}: informational only`);
  }
  const nl = mainHtml(await (await fetchPage(`${BINANCE_OCTOBER_PATH}?market=NL`)).text());
  assert.ok(!anchors(nl).some((a) => a.href.startsWith("/go/")), "restricted market: no CTA");
});

test("placements: home stream, /activities spotlight and /exchanges/binance banner link our page (not Binance)", async () => {
  const src = async (f) => readFile(new URL(`../src/components/${f}`, import.meta.url), "utf8");
  for (const f of ["v7/home7-below.jsx", "v3/activity/LiveCampaigns.jsx", "v3/VenueDetailPage.jsx"]) {
    const code = await src(f);
    assert.match(code, /BINANCE_OCTOBER_PATH/, f);
    assert.match(code, /binanceOctoberPromotable\(/, `${f}: gated`);
    assert.doesNotMatch(code, /binance-gifts|GRO_/, `${f}: placements link our page, not the campaign route`);
  }
  assert.equal(binanceOctoberPromotable({ locale: "en", now: Date.parse("2026-10-13T00:00:00Z") }), true);
  assert.equal(binanceOctoberPromotable({ locale: "en", now: Date.parse("2026-11-05T00:00:00Z") }), false, "placements disappear after the gifts campaign");
});
