import test from "node:test";
import assert from "node:assert/strict";
import { BACKLINK_PATH, buildFunnelReport, digestMessage, eventMessage, funnelReportDue, listingMessage, readMore, sitePath } from "./alert-sender.mjs";

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

test("digest links to /news and keeps the partner /go buttons with their tg-digest sources", () => {
  const d = digestMessage(mk, partners, [{ slug: "a1", title: { en: "Hello", "zh-Hans": "你好" }, publishedAt: "2026-10-11T00:00:00Z" }], [], "zh");
  assert.match(d.text, /<a href="https:\/\/nexualpha\.com\/zh-hans\/news\/a1">你好<\/a>/);
  assert.match(d.text, /<a href="https:\/\/nexualpha\.com\/zh-hans\/news\?src=tg-digest">查看详情 →<\/a>$/);
  assert.deepEqual(d.buttons[0].map((b) => b.url), ["https://nexualpha.com/go/okx?src=tg-digest-zh", "https://nexualpha.com/go/bitget?src=tg-digest-zh"]);
  const en = digestMessage(mk, partners, [], [], "en");
  assert.match(en.text, /<a href="https:\/\/nexualpha\.com\/news\?src=tg-digest">Read more →<\/a>/);
  assert.deepEqual(en.buttons[0].map((b) => b.url), ["https://nexualpha.com/go/okx?src=tg-digest-en", "https://nexualpha.com/go/bitget?src=tg-digest-en"]);
});

test("listing DMs link to the activities page and keep the official notice and /go sign-up buttons", () => {
  const item = { category: "listing", title: "OKX lists ABC", url: "https://www.okx.com/help/abc" };
  const m = listingMessage(item, partners[0], "en");
  assert.match(m.text, /<a href="https:\/\/nexualpha\.com\/activities\?src=tg-listing">Read more →<\/a>/);
  assert.deepEqual(m.buttons[0].map((b) => b.url), ["https://www.okx.com/help/abc", "https://nexualpha.com/go/okx?src=tg-dm-listing-en"]);
  assert.match(listingMessage(item, partners[0], "zh").text, /zh-hans\/activities\?src=tg-listing">查看详情 →/);
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
