import test from "node:test";
import assert from "node:assert/strict";
import { countSubscribers, funnelReportMessage, parseClickLines, sourceGroup, summarizeClicks } from "./funnel-report.mjs";

const NOW = Date.parse("2026-10-11T13:05:00Z");
const h = (hoursAgo) => new Date(NOW - hoursAgo * 3600e3).toISOString();
const FIXTURE = [
  JSON.stringify({ t: h(1), partner: "okx", src: "home-v7-hero", ref: "/", kind: "site" }),
  JSON.stringify({ t: h(2), partner: "okx", src: "home-v7-hero", ref: "/zh-hans", kind: "site" }),
  JSON.stringify({ t: h(3), partner: "bitget", src: "directory-card", ref: "/exchanges", kind: "site" }),
  JSON.stringify({ t: h(4), partner: "okx", src: "tg-channel-zh", ref: "t.me" }),
  JSON.stringify({ t: h(5), partner: "binance", src: "tg-alert-dm-en", ref: null }),
  JSON.stringify({ t: h(6), partner: "okx", src: "unknown", ref: "nexualpha.com" }),
  JSON.stringify({ t: h(30), partner: "okx", src: "tg-digest-zh", ref: "t.me" }),
  JSON.stringify({ t: h(31), partner: "bitget", src: "registration-card-primary", ref: "/exchanges/bitget", kind: "site" }),
  JSON.stringify({ t: h(32), partner: "bitget", src: "registration-card-primary", ref: "/exchanges/bitget", kind: "site" }),
  JSON.stringify({ t: h(32), partner: "bitget", src: "compare-final-choice-registration", ref: "/compare/x", kind: "site" }),
  JSON.stringify({ t: h(24 * 8), partner: "okx", src: "tg-channel-en", ref: "t.me" }),
  "{not json",
  JSON.stringify({ partner: "okx", src: "no-time" }),
  "",
].join("\n");

test("parses JSON lines, skipping corrupt or incomplete rows, and groups sources", () => {
  const rows = parseClickLines(FIXTURE);
  assert.equal(rows.length, 11);
  assert.deepEqual(rows.slice(0, 1).map(sourceGroup), ["site"]);
  assert.equal(sourceGroup(rows[3]), "telegram");
  assert.equal(sourceGroup(rows[5]), "other");
});

test("summarizes 24 h and 7 d windows by group, partner and top placements with a previous-day delta", () => {
  const s = summarizeClicks(parseClickLines(FIXTURE), NOW);
  assert.equal(s.day.total, 6);
  assert.deepEqual(s.day.groups, { site: 3, telegram: 2, other: 1 });
  assert.deepEqual(s.day.partners, [["okx", 4], ["binance", 1], ["bitget", 1]]);
  assert.deepEqual(s.day.placements, [["home-v7-hero", 2], ["directory-card", 1]]);
  assert.deepEqual(s.day.tgSources, [["tg-alert-dm-en", 1], ["tg-channel-zh", 1]]);
  assert.equal(s.previousDay, 4);
  assert.equal(s.deltaDay, 2);
  assert.equal(s.week.total, 10, "the 8-day-old click is outside the week");
  assert.deepEqual(s.week.placements, [["home-v7-hero", 2], ["registration-card-primary", 2], ["compare-final-choice-registration", 1], ["directory-card", 1]]);
});

test("formats the owner DM in zh and en with subscriber count only", () => {
  const s = summarizeClicks(parseClickLines(FIXTURE), NOW);
  const subs = { users: { "1": { lang: "zh", topics: ["liquidation"] }, "2": { lang: "en", topics: [] } } };
  assert.equal(countSubscribers(subs), 2);
  assert.equal(countSubscribers(null), 0);
  const zh = funnelReportMessage({ summary: s, subscribers: 2, lang: "zh", date: "2026-10-11" });
  assert.match(zh, /每日转化漏斗.*2026-10-11/);
  assert.match(zh, /过去 24 小时<\/b>: 6 点击 \(网站按钮 3 \/ Telegram 2 \/ 其他 1\)/);
  assert.match(zh, /较前一日 \+2（前一日 4）/);
  assert.match(zh, /网站位置 Top 5: home-v7-hero 2 · registration-card-primary 2/);
  assert.match(zh, /告警订阅用户: 2$/);
  assert.doesNotMatch(zh, /"1"|lang/, "no subscriber details leak into the report");
  const en = funnelReportMessage({ summary: s, subscribers: 2, lang: "en", date: "2026-10-11" });
  assert.match(en, /Last 24 h<\/b>: 6 clicks/);
  assert.match(en, /\+2 vs previous day \(4\)/);
  const empty = funnelReportMessage({ summary: summarizeClicks([], NOW), subscribers: 0, lang: "zh", fileReadable: false });
  assert.match(empty, /CLICK_EVENT_FILE 未挂载或为空/);
  assert.match(empty, /按交易所: 暂无点击/);
  assert.match(empty, /与前一日持平（0）/);
});

test("home hero A/B (X5): rows carrying experiment + variant are split per variant in the 7-day report", () => {
  const text = [
    JSON.stringify({ t: h(1), partner: "okx", src: "home-v7-hero", ref: "/", kind: "site", experiment: "home_hero_copy_v1", variant: "a" }),
    JSON.stringify({ t: h(2), partner: "bitget", src: "home-v7-hero", ref: "/", kind: "site", experiment: "home_hero_copy_v1", variant: "b" }),
    JSON.stringify({ t: h(3), partner: "okx", src: "tg-channel-zh", ref: "t.me", experiment: "home_hero_copy_v1", variant: "b" }),
    JSON.stringify({ t: h(4), partner: "okx", src: "home-v7-hero", ref: "/", kind: "site", experiment: "home_hero_copy_v1" }),
    JSON.stringify({ t: h(5), partner: "okx", src: "home-v7-hero", ref: "/", kind: "site", experiment: "<script>", variant: "b" }),
  ].join("\n");
  const rows = parseClickLines(text);
  assert.equal(rows.filter((r) => r.variant).length, 3, "a variant without an experiment (or a bad id) is dropped, the click is kept");
  const s = summarizeClicks(rows, NOW);
  assert.deepEqual(s.week.experiments, { home_hero_copy_v1: { a: 1, b: 2 } });
  assert.match(funnelReportMessage({ summary: s, subscribers: 0, lang: "en" }), /A\/B clicks \(7 d\) home_hero_copy_v1: a 1 · b 2/);
  assert.doesNotMatch(funnelReportMessage({ summary: summarizeClicks(parseClickLines(FIXTURE), NOW), subscribers: 0, lang: "en" }), /A\/B/, "no line without experiment rows");
});

test('combined top five placements include redirects and beacons, with counts only', () => {
  const s = summarizeClicks(parseClickLines(FIXTURE), NOW);
  assert.equal(s.week.allPlacements.length, 5);
  assert.deepEqual(s.week.allPlacements[0], ['home-v7-hero', 2]);
  assert.ok(s.week.allPlacements.some(([src]) => src === 'tg-alert-dm-en'));
  const message = funnelReportMessage({ summary: s, subscribers: 0, lang: 'en' });
  assert.match(message, /Top 5 placements \(7 d\):/);
  assert.doesNotMatch(message, /\/exchanges|t.me/);
});

test('invalid placement slugs are unknown and historical partner HTML is escaped', () => {
  const rows = parseClickLines(JSON.stringify({ t: h(1), partner: '<b>unsafe</b>', src: '<script>' }));
  assert.equal(rows[0].src, 'unknown');
  const message = funnelReportMessage({ summary: summarizeClicks(rows, NOW), subscribers: 0, lang: 'en' });
  assert.match(message, /&lt;b&gt;unsafe/);
  assert.doesNotMatch(message, /<script>|<b>unsafe/);
});
