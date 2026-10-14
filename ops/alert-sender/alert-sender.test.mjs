import test from "node:test";
import assert from "node:assert/strict";
import { BACKLINK_PATH, articleLink, assertTelegramOk, buildFunnelReport, deliverOnce, digestMessage, eventButtons, eventMessage, funnelReportDue, groupListingItems, listingGroupMessage, listingMessage, partnerButtons, readMore, sitePath } from "./alert-sender.mjs";

const mk = {
  liquidations: { h1: { longUsd: 120e6, shortUsd: 30e6, largest: { symbol: "BTCUSDT", side: "long", usd: 5e6 } }, h24: { longUsd: 900e6, shortUsd: 400e6 } },
  market: { majors: [{ symbol: "BTCUSDT", price: 100000, change1hPct: -2.1, change24hPct: -4.5 }, { symbol: "ETHUSDT", price: 3000, change1hPct: -3, change24hPct: -6 }], movers: [] },
};
const partners = [{ slug: "okx", name: "OKX", featured: true }, { slug: "bitget", name: "Bitget", featured: true }];

test("site backlinks are locale-prefixed and tagged with a src", () => {
  assert.equal(sitePath("zh", "/liquidations", "tg-alert"), "https://nexualpha.com/zh-hans/liquidations?src=tg-alert");
  assert.equal(sitePath("en", "/news", "tg-digest"), "https://nexualpha.com/news?src=tg-digest");
  assert.equal(readMore("zh", "/liquidations", "tg-alert"), '<a href="https://nexualpha.com/zh-hans/liquidations?src=tg-alert">查看详情 →</a>');
  assert.equal(readMore("en", "/liquidations", "tg-alert"), '<a href="https://nexualpha.com/liquidations?src=tg-alert">Read more →</a>');
  assert.deepEqual(BACKLINK_PATH, { "liquidation-spike": "/liquidations", "both-sides-liquidated": "/liquidations", "sharp-move": "/liquidations", listing: "/activities", digest: "/news" });
});

test("liquidation and sharp-move alerts link to /liquidations as the last line, in both languages", () => {
  for (const type of ["liquidation-spike", "both-sides-liquidated", "sharp-move"]) {
    const zh = eventMessage({ type }, mk, "zh");
    const en = eventMessage({ type }, mk, "en");
    assert.match(zh, /<a href="https:\/\/nexualpha\.com\/zh-hans\/liquidations\?src=tg-alert">查看详情 →<\/a>$/);
    assert.match(en, /<a href="https:\/\/nexualpha\.com\/liquidations\?src=tg-alert">Read more →<\/a>$/);
  }
  assert.match(eventMessage({ type: "liquidation-spike" }, mk, "zh"), /^<b>💥 爆仓激增<\/b>\n1 小时爆仓：多 120\.0M \/ 空 30\.0M 美元/);
});

test("risk event buttons use one relevant action row and no partner sign-up routes", () => {
  assert.deepEqual(eventButtons("en", "tg-alert-channel-en"), [[
    { text: "💥 Liquidations", url: "https://nexualpha.com/liquidations?src=tg-alert-channel-en" },
  ]]);
  const all = JSON.stringify(eventButtons("zh", "tg-alert-dm-zh"));
  assert.doesNotMatch(all, /\/go\/|Sign up|注册 OKX|Bitget|Binance|Bybit|Hyperliquid|Backpack/);
});

test("telegram send failures are explicit and safe to log", () => {
  assert.deepEqual(assertTelegramOk({ ok: true, result: { message_id: 1 } }, "event zh"), { ok: true, result: { message_id: 1 } });
  assert.throws(
    () => assertTelegramOk({ ok: false, error_code: 429, description: "Too Many Requests: retry after 3" }, "daily brief en"),
    /daily brief en: 429 Too Many Requests: retry after 3/,
  );
  assert.throws(
    () => assertTelegramOk({ ok: false, error: "network timeout" }, "event tr"),
    /event tr: unknown network timeout/,
  );
});

test("partial fanout retries only the explicitly rejected recipient after a persisted restart", async () => {
  let state = {}, disk = {}, calls = [];
  const save = () => { disk = structuredClone(state); };
  const first = key => deliverOnce({ state, key, save, deliver: async () => {
    calls.push(key);
    return key === "en" ? { ok: false, error_code: 429, parameters: { retry_after: 10 } } : { ok: true };
  }, now: 1000 });
  await first("zh");
  await assert.rejects(first("en"), /429/);
  state = structuredClone(disk);
  const retry = (key, now) => deliverOnce({ state, key, save, now, deliver: async () => { calls.push(key); return { ok: true }; } });
  await retry("zh", 2000);
  await assert.rejects(retry("en", 2000), /backoff/);
  await retry("en", 11000);
  assert.deepEqual(calls, ["zh", "en", "en"]);
});

test("ambiguous delivery and receipt-write failure do not replay a possibly accepted message", async () => {
  let state = {}, disk = {}, requests = 0;
  const save = () => { disk = structuredClone(state); };
  await assert.rejects(deliverOnce({ state, key: "event:1", save, deliver: async () => {
    requests++; throw new Error("timeout after remote acceptance");
  } }), /timeout/);
  state = structuredClone(disk);
  await assert.rejects(deliverOnce({ state, key: "event:1", save, deliver: async () => { requests++; return { ok: true }; } }), /outcome unknown/);
  assert.equal(requests, 1);
  await assert.rejects(deliverOnce({ state: {}, key: "digest:1", save: () => { throw new Error("disk full"); }, deliver: async () => { requests++; return { ok: true }; } }), /disk full/);
  assert.equal(requests, 1, "no request before durable intent");
});

test("digest links to /news and keeps the partner /go buttons with their tg-digest sources", () => {
  const d = digestMessage(mk, partners, [{ slug: "a1", title: { en: "Hello", "zh-Hans": "你好" }, publishedAt: "2026-10-11T00:00:00Z" }], [], "zh");
  assert.match(d.text, /<a href="https:\/\/nexualpha\.com\/zh-hans\/news\/a1">你好<\/a>/);
  assert.match(d.text, /<a href="https:\/\/nexualpha\.com\/zh-hans\/news\?src=tg-digest">查看详情 →<\/a>$/);
  assert.deepEqual(d.buttons[0].map((b) => b.url), ["https://nexualpha.com/go/bitget?src=tg-digest-zh", "https://nexualpha.com/go/okx?src=tg-digest-zh"]);
  const en = digestMessage(mk, partners, [], [], "en");
  assert.match(en.text, /<a href="https:\/\/nexualpha\.com\/news\?src=tg-digest">Read more →<\/a>/);
  assert.deepEqual(en.buttons[0].map((b) => b.url), ["https://nexualpha.com/go/bitget?src=tg-digest-en", "https://nexualpha.com/go/okx?src=tg-digest-en"]);
});

test("ru digest article links use ru editions and mark English fallbacks", () => {
  const ru = articleLink({ slug: "ru-ready", title: { en: "English", ru: "Русский" }, availableLocales: ["en", "ru"] }, "ru");
  assert.equal(ru, '• <a href="https://nexualpha.com/ru/news/ru-ready">Русский</a>');
  const fallback = articleLink({ slug: "en-only", title: { en: "English only" }, availableLocales: ["en"] }, "ru");
  assert.equal(fallback, '• <a href="https://nexualpha.com/news/en-only">English only (EN)</a>');
});

test("today digest article recap appears before the coming-up heading", async () => {
  const { comingUpHead } = await import("./site-features.mjs");
  const d = digestMessage(
    mk,
    partners,
    [{ slug: "a1", title: { en: "Recap article" }, availableLocales: ["en"], publishedAt: "2026-10-11T00:00:00Z" }],
    [],
    "en",
    { now: new Date("2026-10-13T13:00:00Z"), calendar: { events: [{ start: "2026-10-13T17:00:00Z", title: "Tomorrow in SGT" }] }, flash: { items: [] } },
  );
  assert.ok(d.text.indexOf("Recap article") < d.text.indexOf(comingUpHead("en")));
});

test("partner sign-up buttons are capped to the first commercial row", () => {
  const P = [
    { slug: "okx", name: "OKX", featured: true },
    { slug: "bitget", name: "Bitget", featured: true },
    { slug: "binance", name: "Binance", featured: true },
    { slug: "bybit", name: "Bybit", featured: true },
  ];
  const signupUrls = partnerButtons(P, "en", "tg-digest-en").flat().map((b) => b.url).filter((u) => u.includes("/go/"));
  assert.deepEqual(signupUrls, [
    "https://nexualpha.com/go/bitget?src=tg-digest-en",
    "https://nexualpha.com/go/okx?src=tg-digest-en",
    "https://nexualpha.com/go/binance?src=tg-digest-en",
  ]);
  const neutralRows = partnerButtons(P, "ru", "tg-digest-ru").slice(0, -1).map((row) => row.map((b) => b.url));
  assert.deepEqual(neutralRows, [
    [
      "https://nexualpha.com/ru/exchanges/bitget?src=tg-digest-ru",
      "https://nexualpha.com/ru/exchanges/okx?src=tg-digest-ru",
      "https://nexualpha.com/ru/exchanges/binance?src=tg-digest-ru",
    ],
    ["https://nexualpha.com/ru/exchanges/bybit?src=tg-digest-ru"],
  ]);
});

test("listing DMs link to update explainers and keep official sources attributed safely", () => {
  const item = { category: "listing", title: "OKX lists ABC", url: "https://www.okx.com/help/abc" };
  const m = listingMessage(item, partners[0], "en");
  assert.match(m.text, /<a href="https:\/\/nexualpha\.com\/activities\?src=tg-listing">Read more →<\/a>/);
  assert.match(m.text, /Official source: https:\/\/www\.okx\.com\/help\/abc/);
  assert.deepEqual(m.buttons[0].map((b) => b.text), ["Read the explainer", "Sign up on OKX"]);
  assert.match(m.buttons[0][0].url, /^https:\/\/nexualpha\.com\/activities\/updates\/okx\//);
  assert.equal(m.buttons[0][1].url, "https://nexualpha.com/go/okx?src=tg-dm-listing-en");
  assert.match(listingMessage(item, partners[0], "zh").text, /zh-hans\/activities\?src=tg-listing">查看详情 →/);
  const binance = listingMessage({ ...item, venue: "binance", url: "https://www.binance.com/en/support/announcement/listing" }, { slug: "binance", name: "Binance" }, "en");
  assert.deepEqual(binance.buttons[0].map((b) => b.text), ["Read the explainer", "Official source", "Sign up on Binance"]);
  assert.equal(binance.buttons[0][1].url, "https://nexualpha.com/go/binance-page?to=%2Fen%2Fsupport%2Fannouncement%2Flisting&src=tg-dm-listing-en");
});

test("listing DM grouping merges consecutive routine listings and keeps campaigns distinct", () => {
  const items = [
    { category: "listing", title: "OKX lists ABC", url: "https://www.okx.com/help/abc", venue: "okx" },
    { category: "listing", title: "Bitget lists XYZ", url: "https://www.bitget.com/support/xyz", venue: "bitget" },
    { category: "event", title: "OKX trading campaign", url: "https://www.okx.com/help/campaign", venue: "okx" },
    { category: "listing", title: "OKX Futures Challenge: share 100,000 USDT", url: "https://www.okx.com/help/challenge", venue: "okx" },
  ];
  assert.deepEqual(groupListingItems(items).map((g) => [g.type, g.items.length]), [["listing", 2], ["single", 1], ["single", 1]]);
  const bySlug = Object.fromEntries(partners.map((p) => [p.slug, p]));
  const grouped = listingGroupMessage(items.slice(0, 2), bySlug, "en");
  assert.match(grouped.text, /2 new listing notices/);
  assert.match(grouped.text, /activities\/updates\/okx/);
  assert.match(grouped.text, /activities\/updates\/bitget/);
  assert.deepEqual(grouped.buttons.at(-1).map((b) => b.url), ["https://nexualpha.com/go/okx?src=tg-dm-listing-en", "https://nexualpha.com/go/bitget?src=tg-dm-listing-en"]);
  assert.equal(listingGroupMessage(items.slice(2), bySlug, "ru"), null, "neutral locale skips campaign-like items when the whole group is campaign-like");
});

test("risk-like listing DMs stay single and suppress signup actions", () => {
  const item = { category: "listing", title: "OKX suspends ABC margin trading", url: "https://www.okx.com/help/abc-margin", venue: "okx" };
  assert.deepEqual(groupListingItems([item]).map((g) => [g.type, g.items.length]), [["single", 1]]);
  const m = listingMessage(item, partners[0], "en");
  assert.equal(m.buttons[0][0].text, "Read the explainer");
  assert.equal(m.buttons[0].some((b) => /Sign up/.test(b.text) || /\/go\/okx\?/.test(b.url)), false);
});

test("large grouped listing DMs stay within Telegram text limits while counting all ids", () => {
  const many = Array.from({ length: 18 }, (_, i) => ({
    category: "listing",
    title: `OKX lists ${String(i).padStart(2, "0")} ${"LONGTITLE".repeat(20)}`,
    url: `https://www.okx.com/help/list-${i}`,
    venue: "okx",
  }));
  const bySlug = Object.fromEntries(partners.map((p) => [p.slug, p]));
  const m = listingGroupMessage(many, bySlug, "en");
  assert.match(m.text, /18 new listing notices/);
  assert.match(m.text, /13 more in the listing feed/);
  assert.ok(m.text.length <= 4096, `length ${m.text.length}`);
});

test("owner funnel report is due once per day from 13:05 UTC and only with OWNER_CHAT_ID", () => {
  assert.equal(funnelReportDue({ now: new Date("2026-10-11T13:05:00Z"), sentDates: [], ownerChatId: "123" }), true);
  assert.equal(funnelReportDue({ now: new Date("2026-10-11T13:04:59Z"), sentDates: [], ownerChatId: "123" }), false);
  assert.equal(funnelReportDue({ now: new Date("2026-10-11T13:40:00Z"), sentDates: ["2026-10-11"], ownerChatId: "123" }), false);
  assert.equal(funnelReportDue({ now: new Date("2026-10-11T14:05:00Z"), sentDates: [], ownerChatId: "123" }), false);
  assert.equal(funnelReportDue({ now: new Date("2026-10-11T13:05:00Z"), sentDates: [], ownerChatId: "" }), false);
  const now = Date.parse("2026-10-11T13:05:00Z");
  const clicksText = [
    JSON.stringify({ t: new Date(now - 3600e3).toISOString(), partner: "okx", src: "home-v7-hero", ref: "/", kind: "site" }),
    JSON.stringify({ t: new Date(now - 7200e3).toISOString(), partner: "okx", src: "tg-channel-zh", ref: "t.me" }),
  ].join("\n");
  const text = buildFunnelReport({ clicksText, subs: { users: { 1: {}, 2: {}, 3: {} } }, now });
  assert.match(text, /过去 24 小时<\/b>: 2 点击 \(网站按钮 1 \/ Telegram 1 \/ 其他 0\)/);
  assert.match(text, /告警订阅用户: 3/);
  assert.match(buildFunnelReport({ clicksText: null, subs: {}, now }), /CLICK_EVENT_FILE 未挂载或为空/);
});

test('grouped listing text budget includes long original source URLs and escaped titles', () => {
  const items = Array.from({ length: 5 }, (_, i) => ({ venue: 'okx', category: 'listing', title: '&'.repeat(180), url: `https://www.okx.com/help/${i}?detail=${'x'.repeat(4000)}` }));
  const message = listingGroupMessage(items, Object.fromEntries(partners.map((p) => [p.slug, p])), 'en');
  assert.ok(message.text.length <= 3900);
  assert.match(message.text, /5 new listing notices/);
  assert.match(message.text, /5 more in the listing feed/);
  assert.match(message.text, /nexualpha\.com\/activities/);
});
