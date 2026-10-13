// /etf-flows and /calendar (2026-10-13): readers, formatting, collectors' parsers, the runtime snapshot reader, the
// Worker head/SSR/hydration, the iCal export and the sitemap.
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import worker from "../worker/index.js";
import { compactEtfFlows, etfAssetView, etfAssets, etfChartModel, etfWindowSum, formatSignedMillions, formatSignedUsd, formatUsdShort, readEtfFlows } from "../src/data/etf-flows.js";
import { compactCalendar, filterEvents, formatEventTime, readCalendar, renderIcs, upcomingGroups, weekModel, weekStart } from "../src/data/crypto-calendar.js";
import { ETF_FLOWS_LIVE, INTEL_TOOL_INDEX_LOCALES, isIntelToolPath } from "../src/data/intel-tools-routes.js";
import { intelToolRouteSeo, intelToolsSitemapEntries } from "../src/data/intel-tools-seo.js";
import { intelToolsCopy, intelToolsCopyLocales } from "../src/data/intel-tools-copy.js";
import { calendarEventLabel } from "../src/data/intel-tools-labels.js";
import { createJsonSnapshotReader } from "../server/intel-tools-feed.mjs";
import { etfSignup } from "../src/data/etf-signup.js";
import { campaignEvents, exchangeEvents, titleEventDate } from "../scripts/intel-tools/collect-calendar.mjs";
import { createSsrHarness, SHELL_HTML, hydrateInJsdom, hydrationErrors, prerenderState, h1Texts } from "./helpers/ssr-hydration-harness.mjs";

const NOW = Date.parse("2026-10-14T12:00:00Z");
const day = (offset) => new Date(Date.parse("2026-10-14T00:00:00Z") + offset * 864e5).toISOString().slice(0, 10);

export function etfFixture() {
  const fund = (ticker, issuer, asset, aumUsd, holdings) => ({ ticker, name: `${issuer} ${asset} Trust`, issuer, asset, feePct: null, sourceUrl: `https://example.com/${ticker}`, sourceName: `${issuer} fund page`, latest: { date: day(-1), sharesOutstanding: 1000000, nav: 50.12, aumUsd, holdings } });
  return {
    schema: "nexualpha.etf-flows.v1", generatedAt: "2026-10-14T02:30:00Z", method: "flow = Δshares × NAV",
    sources: [{ name: "iShares IBIT", url: "https://example.com/IBIT" }],
    funds: [fund("IBIT", "iShares", "BTC", 80e9, 800000.5), fund("FBTC", "Fidelity", "BTC", 20e9, 200000), fund("ETHA", "iShares", "ETH", 10e9, 3000000), fund("NEWB", "NewCo", "BTC", null, null)],
    days: [
      { date: day(-3), asset: "BTC", flows: { IBIT: 100e6, FBTC: -20e6 } },
      { date: day(-2), asset: "BTC", flows: { IBIT: -50.04e6, FBTC: null } },
      { date: day(-1), asset: "BTC", flows: { IBIT: 25e6, FBTC: 5e6, NEWB: 1e6 } },
      { date: day(-1), asset: "ETH", flows: { ETHA: -7.5e6 } },
      { date: day(-1), asset: "NOPE", flows: { X: 1 } },
    ],
  };
}
export function calendarFixture() {
  const ev = (id, type, kind, start, extra = {}) => ({ id, type, kind, start, allDay: false, title: id, sourceUrl: `https://example.com/${id}`, sourceName: "Example", ...extra });
  return {
    schema: "nexualpha.calendar.v1", generatedAt: "2026-10-14T03:00:00Z",
    sources: [{ name: "Federal Reserve FOMC calendar", url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm" }],
    events: [
      ev("fomc-2026-10-28", "macro", "fomc", "2026-10-28T18:00:00Z"),
      ev("cpi-2026-10", "macro", "cpi", "2026-10-15T12:30:00Z", { period: "Sep 2026" }),
      ev("nfp-2026-11", "macro", "nfp", "2026-10-15T20:30:00Z"),
      ev("exchange:binance:1", "exchange", "delisting", "2026-10-17T03:00:00Z", { venue: "binance", title: "Binance Will Delist X on 2026-10-17", pagePath: "/activities/updates/binance/x-1" }),
      ev("campaign:okx:1", "campaign", "campaign-end", "2026-10-20T23:59:00Z", { venue: "okx", title: "OKX campaign ends", titles: { "zh-Hans": "OKX 活动截止" } }),
      ev("old", "macro", "nfp", "2026-10-02T12:30:00Z", { period: "Sep 2026" }),
      { id: "broken", type: "macro", kind: "fomc", start: "nope", sourceUrl: "https://x" },
      ev("no-source", "macro", "fomc", "2026-11-01T00:00:00Z", { sourceUrl: "javascript:alert(1)" }),
    ],
  };
}

test("ETF reader: totals, partial days, cumulative and AUM", () => {
  const data = readEtfFlows(etfFixture());
  assert.ok(data);
  assert.deepEqual(etfAssets(data), ["BTC", "ETH"]);
  const btc = etfAssetView(data, "BTC");
  assert.deepEqual(btc.funds.map((f) => f.ticker), ["IBIT", "FBTC", "NEWB"], "largest AUM first, unknown AUM last");
  assert.deepEqual(btc.days.map((d) => [d.date, d.totalUsd, d.reported, d.expected]), [[day(-3), 80e6, 2, 2], [day(-2), -50.04e6, 1, 2], [day(-1), 31e6, 3, 3]]);
  assert.equal(btc.cumulativeUsd, 80e6 - 50.04e6 + 31e6);
  assert.equal(btc.aumUsd, 100e9);
  assert.equal(btc.aumFunds, 2);
  assert.equal(btc.since, day(-3));
  assert.equal(etfWindowSum(btc, 2).usd, -50.04e6 + 31e6);
  assert.equal(readEtfFlows({ generatedAt: "x", funds: [] }), null);
  assert.equal(readEtfFlows({ generatedAt: "2026-10-14T00:00:00Z", funds: [] }), null);
  const compact = compactEtfFlows(etfFixture(), 1);
  assert.deepEqual(compact.days.map((d) => `${d.asset}:${d.date}`).sort(), [`BTC:${day(-1)}`, `ETH:${day(-1)}`, `NOPE:${day(-1)}`]);
});

test("ETF formatting is exact and deterministic", () => {
  assert.equal(formatSignedUsd(123456789.4), "+$123,456,789");
  assert.equal(formatSignedUsd(-1234.5), "−$1,234");
  assert.equal(formatSignedUsd(0), "$0");
  assert.equal(formatSignedUsd(null), "—");
  assert.equal(formatSignedMillions(-50.04e6), "−50.0M");
  assert.equal(formatSignedMillions(1234.56e6), "+1,234.6M");
  assert.equal(formatUsdShort(84.123e9), "$84.12B");
  const model = etfChartModel([{ date: day(-2), totalUsd: -50e6, reported: 1, expected: 2 }, { date: day(-1), totalUsd: 30e6, reported: 2, expected: 2 }]);
  assert.equal(model.bars.length, 2);
  assert.equal(model.bars[0].sign, "out");
  assert.equal(model.bars[0].partial, true);
  assert.ok(model.bars[1].y < model.plot.baseline && model.bars[0].y >= model.plot.baseline - 0.01);
});

test("calendar reader drops events without a date or an https source; week and list views", () => {
  const data = readCalendar(calendarFixture());
  assert.deepEqual(data.events.map((e) => e.id), ["old", "cpi-2026-10", "nfp-2026-11", "exchange:binance:1", "campaign:okx:1", "fomc-2026-10-28"]);
  assert.equal(weekStart(NOW), "2026-10-12", "weeks start on Monday, Singapore time");
  assert.equal(weekStart(Date.parse("2026-10-18T17:00:00Z")), "2026-10-19", "Sunday 17:00 UTC is Monday 01:00 SGT");
  const week = weekModel(data.events, NOW);
  assert.deepEqual(week.map((d) => d.events.length), [0, 0, 0, 1, 1, 1, 0], "20:30 UTC on the 15th is the 16th in Singapore");
  assert.equal(weekModel(data.events, NOW, 2)[3].events[0].id, "fomc-2026-10-28", "18:00 UTC Wednesday is 02:00 SGT Thursday");
  assert.deepEqual(upcomingGroups(filterEvents(data.events, "macro"), NOW).map((g) => g.day), ["2026-10-15", "2026-10-16", "2026-10-29"]);
  assert.equal(formatEventTime(data.events.find((e) => e.kind === "fomc"), "en"), "02:00 SGT");
  assert.equal(formatEventTime(data.events.find((e) => e.kind === "fomc"), "zh-Hans"), "02:00 新加坡时间");
    assert.equal(calendarEventLabel(data.events.find((e) => e.kind === "cpi"), "zh-Hans"), "美国 CPI 通胀（Sep 2026）");
  assert.equal(calendarEventLabel(data.events.find((e) => e.type === "campaign"), "zh-Hans"), "OKX 活动截止");
  assert.equal(calendarEventLabel(data.events.find((e) => e.type === "campaign"), "ja"), "OKX campaign ends");
  assert.equal(compactCalendar(calendarFixture(), NOW).events.some((e) => e.id === "old"), false);
});

test("iCal export: escaped, folded at 75 octets, CRLF", () => {
  const data = readCalendar(calendarFixture());
  const ics = renderIcs(data.events.slice(0, 3), { generatedAt: data.generatedAt, describe: (e) => ({ summary: `${e.title}; a, b — 长标题`.repeat(4), description: "x" }) });
  assert.match(ics, /^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\n/);
  assert.match(ics, /DTSTART:20261015T123000Z/);
  assert.match(ics, /SUMMARY:cpi-2026-10\\; a\\, b/);
  for (const line of ics.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75, line);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
});

test("collector parsers: dates named in official titles, campaign deadlines", () => {
  assert.deepEqual(titleEventDate("New listing: Listing of YPFUSDT on Bybit TradFi Perpetual on Oct 12, 2026, 11:05AM UTC"), { start: "2026-10-12T11:05:00.000Z", allDay: false });
  assert.deepEqual(titleEventDate("Bybit to Delist 1 Token(s) on Oct 13, 2026"), { start: "2026-10-13T00:00:00.000Z", allDay: true });
  assert.deepEqual(titleEventDate("KuCoin Will Delist Multiple Tokens on 2026-10-08"), { start: "2026-10-08T00:00:00.000Z", allDay: true });
  assert.equal(titleEventDate("Binance Will Delist ABC (2026-10-09)"), null, "parenthesized dates are announcement dates");
  assert.equal(titleEventDate("Listing on Sat 12 PM"), null);
  const soon = new Date(Date.now() + 3 * 864e5);
  const title = `Bybit to Delist 1 Token(s) on ${soon.toLocaleString("en-US", { month: "short", timeZone: "UTC" })} ${soon.getUTCDate()}, ${soon.getUTCFullYear()}`;
  const items = [
    { id: "bybit:1", venue: "bybit", category: "delisting", title, url: "https://announcements.bybit.com/x" },
    { id: "bybit:2", venue: "bybit", category: "event", title, url: "https://announcements.bybit.com/y" },
    { id: "okx:3", venue: "okx", category: "event", title: "Flash Earn", url: "https://www.okx.com/help/z" },
  ];
  const ex = exchangeEvents(items);
  assert.equal(ex.length, 1);
  assert.equal(ex[0].kind, "delisting");
  assert.match(ex[0].pagePath, /^\/activities\/updates\/bybit\//);
  const camp = campaignEvents([{ id: "okx:3", deadline: soon.toISOString(), headline: { en: "OKX Flash Earn ends", "zh-Hans": "OKX 活动" } }, { id: "missing", deadline: soon.toISOString() }], items);
  assert.equal(camp.length, 1);
  assert.equal(camp[0].titles["zh-Hans"], "OKX 活动");
  assert.equal(camp[0].sourceUrl, "https://www.okx.com/help/z");
});

test("runtime reader: runtime file first, release copy as fallback, broken rewrites keep the last good file", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "intel-tools-"));
  try {
    const file = path.join(dir, "etf.json"), fallback = path.join(dir, "release.json");
    let now = 0;
    const reader = createJsonSnapshotReader({ file, fallbackFile: fallback, validate: (j) => Boolean(readEtfFlows(j)), ttlMs: 1000, now: () => now });
    assert.equal(await reader.read(), null);
    await writeFile(fallback, JSON.stringify({ ...etfFixture(), generatedAt: "2026-10-13T00:00:00Z" }));
    now += 2000;
    assert.equal((await reader.read()).generatedAt, "2026-10-13T00:00:00Z");
    assert.equal(await reader.respond(), null, "the release copy is served as a static file");
    await writeFile(file, JSON.stringify(etfFixture()));
    now += 2000;
    assert.equal((await reader.read()).generatedAt, "2026-10-14T02:30:00Z");
    assert.equal((await reader.respond()).status, 200);
    await writeFile(file, "{ broken");
    now += 2000;
    assert.equal((await reader.read()).generatedAt, "2026-10-14T02:30:00Z");
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("SEO: nine indexable editions, titles inside the budget, sitemap with hreflang", () => {
  assert.deepEqual(intelToolsCopyLocales(), INTEL_TOOL_INDEX_LOCALES);
  for (const locale of INTEL_TOOL_INDEX_LOCALES) {
    for (const pathname of ["/etf-flows", "/calendar"]) {
      const seo = intelToolRouteSeo(pathname, locale, { urlFor: (p) => `https://nexualpha.com${p}`, data: readCalendar(calendarFixture()), now: NOW });
      assert.ok(seo.title.length <= (/^(zh|ja|ko)/.test(locale) ? 32 : 60), `${locale} ${pathname}: ${seo.title}`);
      assert.ok(seo.description.length <= 160, `${locale} ${pathname} description`);
      assert.equal(seo.indexable, pathname === "/calendar" || ETF_FLOWS_LIVE, `${locale} ${pathname}`);
      assert.ok(seo.schemas.some((s) => s["@type"] === "Dataset"));
      assert.ok(seo.schemas.some((s) => s["@type"] === "FAQPage"));
    }
    const copy = intelToolsCopy(locale);
    assert.equal(Object.keys(copy.calendar.kinds).length, 8);
  }
  const cal = intelToolRouteSeo("/calendar", "en", { urlFor: (p) => p, data: readCalendar(calendarFixture()), now: NOW });
  const list = cal.schemas.find((s) => s["@type"] === "ItemList");
  assert.equal(list.itemListElement[0].item["@type"], "Event");
  assert.equal(list.itemListElement.some((e) => e.item.name.includes("Nonfarm") || e.item.startDate.startsWith("2026-10-02")), false, "past events stay out of the list");
  assert.equal(intelToolRouteSeo("/fr/etf-flows", "fr", { urlFor: (p) => p }), null);
  assert.equal(intelToolRouteSeo("/etf-flows", "fr", { urlFor: (p) => p }).indexable, false);
  assert.ok(isIntelToolPath("/calendar/"));
  const entries = intelToolsSitemapEntries({ urlFor: (p, l) => `https://nexualpha.com${l === "en" ? "" : `/${l}`}${p}` });
  assert.equal(entries.length, ETF_FLOWS_LIVE ? 18 : 9, "no permitted ETF source yet: /etf-flows stays out of the sitemap");
  assert.equal(entries[0].alternates.length, 10);
});

test("ETF sign-up CTA is geo-gated and tracked as src=etf-flows", () => {
  assert.equal(etfSignup({ locale: "en" })?.href, "/go/okx?src=etf-flows");
  assert.equal(etfSignup({ locale: "zh-Hant" }), null, "neutral locales show no sign-up");
  const tr = etfSignup({ locale: "tr" });
  assert.ok(!tr || ["okx", "binance"].includes(tr.venue));
});

// ------------------------------------------------------------------ Worker: head, SSR body, hydration, iCal
const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
  if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  return new Response("missing", { status: 404 });
} };
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
const envWith = (extra = {}) => ({ ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options), ETF_FLOWS_READ: async () => etfFixture(), CALENDAR_READ: async () => calendarFixture(), ...extra });
const page = async (url, env = envWith()) => (await worker.fetch(new Request(url, { headers: { accept: "text/html" } }), env)).text();

test("worker renders /etf-flows from the runtime snapshot and the browser hydrates it", async () => {
  const html = await page("https://nexualpha.com/etf-flows");
  assert.deepEqual(h1Texts(html), ["Spot crypto ETF flows"]);
  assert.match(html, /"@type":"Dataset"/);
  assert.match(html, ETF_FLOWS_LIVE ? /<meta name="robots" content="index,follow/ : /<meta name="robots" content="noindex,follow/);
  assert.match(html, /\+\$31,000,000/, "latest BTC day total, exact");
  assert.match(html, /2 of 3 funds reported|1 of 2 funds reported/);
  assert.match(html, /href="\/go\/okx\?src=etf-flows"/);
  assert.equal(prerenderState(html).intelTool.kind, "etf");
  const { errors } = await hydrateInJsdom(harness.vite, html, "https://nexualpha.com/etf-flows");
  assert.deepEqual(hydrationErrors(errors), [], errors.join("\n"));
});

test("worker renders /zh-hans/calendar with Event schema; no snapshot shows the unavailable state", async () => {
  const html = await page("https://nexualpha.com/zh-hans/calendar");
  assert.deepEqual(h1Texts(html), ["加密日历"]);
  assert.match(html, /"@type":"Event"/);
  assert.match(html, /美国 CPI 通胀/);
  assert.match(html, /新加坡时间/);
  assert.doesNotMatch(html, /代币解锁/);
  assert.match(html, /href="\/calendar\.ics\?locale=zh-Hans"/);
  const state = prerenderState(html).intelTool;
  assert.equal(state.kind, "calendar");
  assert.ok(Number.isFinite(state.now));
  const { errors } = await hydrateInJsdom(harness.vite, html, "https://nexualpha.com/zh-hans/calendar");
  assert.deepEqual(hydrationErrors(errors), [], errors.join("\n"));
  const empty = await page("https://nexualpha.com/calendar", envWith({ CALENDAR_READ: async () => null }));
  assert.match(empty, /data-testid="intel-tool-unavailable"/);
  assert.match(html, /<meta name="robots" content="index,follow/);
  assert.match(html, /hreflang="ja" href="https:\/\/nexualpha\.com\/ja\/calendar"/);
  const fr = await page("https://nexualpha.com/fr/calendar");
  assert.match(fr, /<meta name="robots" content="noindex,follow/);
});

test("/calendar.ics serves the snapshot as iCalendar, optionally one type", async () => {
  const res = await worker.fetch(new Request("https://nexualpha.com/calendar.ics?type=macro&locale=ja"), envWith());
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /^text\/calendar/);
  const body = await res.text();
  assert.match(body, /SUMMARY:\[経済指標\] FOMC政策金利発表/);
  assert.doesNotMatch(body, /\[(取引所|キャンペーン)\]/);
  const none = await worker.fetch(new Request("https://nexualpha.com/calendar.ics"), envWith({ CALENDAR_READ: async () => null }));
  assert.equal(none.status, 503);
});

test("the shipped calendar.json is a usable snapshot with official sources", async () => {
  const { readFile } = await import("node:fs/promises");
  const data = readCalendar(JSON.parse(await readFile(new URL("../public/intel/calendar.json", import.meta.url), "utf8")));
  assert.ok(data && data.events.length > 10);
  for (const e of data.events) assert.match(e.sourceUrl, /^https:\/\//);
  assert.ok(data.events.some((e) => e.kind === "fomc"));
});

test("macro parsers: FOMC page, BEA iCal, DST conversion", async () => {
  const { parseFomcCalendar, parseBeaIcs, usLocalToUtc, blsEvents } = await import("../scripts/intel-tools/macro-schedule.mjs");
  const html = '<h4><a>2026 FOMC Meetings</a></h4><div class="fomc-meeting--shaded row fomc-meeting"><div class="fomc-meeting--shaded fomc-meeting__month col"><strong>October</strong></div><div class="fomc-meeting__date col">27-28</div></div><div class="row fomc-meeting"><div class="fomc-meeting__month"><strong>December</strong></div><div class="fomc-meeting__date">8-9*</div></div><div class="row fomc-meeting"><div class="fomc-meeting__month"><strong>August</strong></div><div class="fomc-meeting__date">22 (notation vote)</div></div>';
  assert.deepEqual(parseFomcCalendar(html).map((e) => e.start), ["2026-10-28T18:00:00.000Z", "2026-12-09T19:00:00.000Z"]);
  assert.equal(usLocalToUtc(2026, 2, 7, 8, 30), "2026-03-07T13:30:00.000Z", "before DST");
  assert.equal(usLocalToUtc(2026, 2, 9, 8, 30), "2026-03-09T12:30:00.000Z", "after DST starts (8 March 2026)");
  assert.equal(usLocalToUtc(2026, 10, 2, 8, 30), "2026-11-02T13:30:00.000Z", "after DST ends (1 November 2026)");
  const ics = "BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nSUMMARY:Personal Income and Outlays\\, Septem\r\n ber 2026\r\nDTSTART;VALUE=DATE-TIME:20261029T123000Z\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nSUMMARY:U.S. International Trade\r\nDTSTART;VALUE=DATE-TIME:20261105T133000Z\r\nEND:VEVENT\r\n";
  assert.deepEqual(parseBeaIcs(ics).map((e) => [e.kind, e.start, e.title]), [["pce", "2026-10-29T12:30:00.000Z", "Personal Income and Outlays, September 2026"]]);
  assert.ok(blsEvents().some((e) => e.id === "macro:cpi:2026-10-14" && e.start === "2026-10-14T12:30:00.000Z"));
});
