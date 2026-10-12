// Custom /alert rules: parser, store (poller side), evaluation and messages (sender side), sender integration.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  DAILY_CAP, LANGS, LOCALE_PATH, MAX_TRIGGERS, alertCardSuffix, alertLangFor, clearUserTriggers, copyFor, describeTrigger,
  evaluateTriggers, handleAlertCommand, loadTriggers, moveCoins, parseAlertArgument, stopAllText, triggerLines, triggerMessage,
} from "./alert-triggers.mjs";
import { LOCALE_PATH as SENDER_LOCALE_PATH, coinSlugs, fetchTriggerPrices, runTriggerAlerts } from "./alert-sender.mjs";

const tmp = () => { const dir = mkdtempSync(path.join(tmpdir(), "nx-trig-")); return { file: path.join(dir, "triggers.json"), subsFile: path.join(dir, "subs.json") }; };
const ok = (arg) => { const r = parseAlertArgument(arg); assert.equal(r.ok, true, `${arg}: ${r.error}`); return r.trigger; };
const err = (arg) => { const r = parseAlertArgument(arg); assert.equal(r.ok, false, arg); return r.error; };
const H = 3600e3;
const plain = (s) => String(s).replace(/[\u00A0\u202F]/g, " "); // Intl uses no-break spaces
const T0 = Date.parse("2026-10-13T00:00:00Z");

// ---------- parser ----------
test("price rules: symbols, words, Chinese, k/m suffixes, USDT suffix", () => {
  assert.deepEqual(ok("btc > 70000"), { type: "price", coin: "BTC", op: "above", value: 70000 });
  assert.deepEqual(ok("BTC<60000"), { type: "price", coin: "BTC", op: "below", value: 60000 });
  assert.deepEqual(ok("  btc   above   70k "), { type: "price", coin: "BTC", op: "above", value: 70000 });
  assert.deepEqual(ok("btc below 1.2m"), { type: "price", coin: "BTC", op: "below", value: 1.2e6 });
  assert.deepEqual(ok("btc 高于 70000"), { type: "price", coin: "BTC", op: "above", value: 70000 });
  assert.deepEqual(ok("btc低于60000"), { type: "price", coin: "BTC", op: "below", value: 60000 });
  assert.deepEqual(ok("ETHUSDT ＞ 3,500"), { type: "price", coin: "ETH", op: "above", value: 3500 });
  assert.deepEqual(ok("pepe < 0.00001"), { type: "price", coin: "PEPE", op: "below", value: 0.00001 });
  assert.deepEqual(ok("btc >= 7万"), { type: "price", coin: "BTC", op: "above", value: 70000 });
});

test("move, liquidation, funding and listing rules", () => {
  for (const a of ["btc 5%", "btc ±5%", "btc move 5%", "BTC move 5", "btc 5% 1h", "btc 波动 5%"]) assert.deepEqual(ok(a), { type: "move", coin: "BTC", pct: 5 }, a);
  assert.deepEqual(ok("eth 3% 1h"), { type: "move", coin: "ETH", pct: 3 });
  for (const a of ["liq", "liquidations", "爆仓", "LIQ"]) assert.deepEqual(ok(a), { type: "liquidation", minUsd: 50e6 }, a);
  assert.deepEqual(ok("liq 30m"), { type: "liquidation", minUsd: 30e6 });
  assert.deepEqual(ok("爆仓 1b"), { type: "liquidation", minUsd: 1e9 });
  assert.deepEqual(ok("liq 500000k"), { type: "liquidation", minUsd: 5e8 });
  assert.deepEqual(ok("funding"), { type: "funding", coin: null, absRate: 0.0005 });
  assert.deepEqual(ok("资金费率"), { type: "funding", coin: null, absRate: 0.0005 });
  assert.deepEqual(ok("funding btc"), { type: "funding", coin: "BTC", absRate: 0.0005 });
  assert.deepEqual(ok("funding btc 0.1%"), { type: "funding", coin: "BTC", absRate: 0.001 });
  assert.deepEqual(ok("资金费率 eth 0.2%"), { type: "funding", coin: "ETH", absRate: 0.002 });
  assert.deepEqual(ok("listing binance"), { type: "listing", venue: "binance" });
  assert.deepEqual(ok("listing OKX"), { type: "listing", venue: "okx" });
  assert.deepEqual(ok("上币 bybit"), { type: "listing", venue: "bybit" });
  assert.deepEqual(ok("上币 币安"), { type: "listing", venue: "binance" });
});

test("parser errors carry a code (and the rule type for ranges)", () => {
  assert.equal(err(""), "bad_format");
  assert.equal(err("btc"), "bad_format");
  assert.equal(err("btc 70000"), "bad_format");
  assert.equal(err("btc > abc"), "bad_format");
  assert.equal(err("btc > 0"), "bad_format");
  assert.equal(err("btc 5% 4h"), "bad_format");
  assert.equal(err("x > 1"), "bad_coin");
  assert.equal(err("bitcoin-cash > 1"), "bad_coin");
  assert.equal(err("listing gate"), "unsupported_venue");
  assert.equal(err("listing"), "unsupported_venue");
  assert.deepEqual(parseAlertArgument("btc 0.5%"), { ok: false, error: "out_of_range", type: "move" });
  assert.deepEqual(parseAlertArgument("btc 60%"), { ok: false, error: "out_of_range", type: "move" });
  assert.deepEqual(parseAlertArgument("liq 1m"), { ok: false, error: "out_of_range", type: "liquidation" });
  assert.deepEqual(parseAlertArgument("liq 10b"), { ok: false, error: "out_of_range", type: "liquidation" });
  assert.deepEqual(parseAlertArgument("funding 5%"), { ok: false, error: "out_of_range", type: "funding" });
  assert.deepEqual(parseAlertArgument("funding 0.001%"), { ok: false, error: "out_of_range", type: "funding" });
});

// ---------- store / commands ----------
test("add, list, delete and clear through /alert, in the member's language", () => {
  const o = tmp();
  assert.match(handleAlertCommand(1, "", { ...o, lang: "en" }).text, /^🔔 Custom alerts/);
  assert.match(handleAlertCommand(1, "list", { ...o, lang: "en" }).text, /no custom alerts yet/);
  assert.equal(handleAlertCommand(1, "btc > 70000", { ...o, lang: "en" }).text, "✅ Alert added: BTC above $70,000\nSee all: /alert list");
  assert.match(handleAlertCommand(1, "eth 5%", { ...o, lang: "en" }).text, /ETH moves ±5% within 1h/);
  assert.match(handleAlertCommand(1, "listing okx", { ...o, lang: "en" }).text, /New listings on OKX/);
  assert.deepEqual(triggerLines(1, "en", o), ["1. BTC above $70,000", "2. ETH moves ±5% within 1h", "3. New listings on OKX"]);
  assert.deepEqual(triggerLines(1, "zh", o), ["1. BTC 高于 $70,000", "2. ETH 1 小时涨跌超过 ±5%", "3. OKX 新上币"]);
  assert.match(handleAlertCommand(1, "list", { ...o, lang: "en" }).text, /^🎯 Your custom alerts:\n1\. BTC above \$70,000\n2\./);
  assert.equal(handleAlertCommand(1, "del 2", { ...o, lang: "en" }).text, "🗑 Removed: ETH moves ±5% within 1h");
  assert.match(handleAlertCommand(1, "remove 9", { ...o, lang: "en" }).text, /No alert with that number/);
  const doc = loadTriggers(o);
  assert.equal(doc.version, 1);
  assert.equal(doc.users["1"].lang, "en");
  assert.deepEqual(doc.users["1"].triggers.map((t) => t.type), ["price", "listing"]);
  for (const t of doc.users["1"].triggers) { assert.match(t.id, /^[a-z0-9]+$/); assert.ok(Date.parse(t.createdAt)); }
  assert.equal(handleAlertCommand(1, "off", { ...o, lang: "en" }).text, "🗑 Cleared all custom alerts (2).");
  assert.deepEqual(loadTriggers(o).users, {});
  assert.equal(existsSync(`${o.file}.tmp`), false, "atomic write leaves no tmp file");
});

test("duplicates are rejected, the 10-rule limit holds, errors are localized", () => {
  const o = tmp();
  assert.match(handleAlertCommand(7, "btc > 70000", { ...o, lang: "zh" }).text, /^✅ 已添加提醒：BTC 高于 \$70,000/);
  assert.equal(handleAlertCommand(7, "BTC above 70k", { ...o, lang: "zh" }).text, "这条提醒已经存在。");
  for (let i = 2; i <= MAX_TRIGGERS; i++) handleAlertCommand(7, `btc > ${70000 + i}`, { ...o, lang: "zh" });
  assert.equal(loadTriggers(o).users["7"].triggers.length, MAX_TRIGGERS);
  assert.match(handleAlertCommand(7, "eth > 1", { ...o, lang: "zh" }).text, /已有 10 条/);
  assert.match(handleAlertCommand(7, "listing gate", { ...o, lang: "en" }).text, /Binance, OKX, Bitget, Bybit, KuCoin, Kraken/);
  assert.match(handleAlertCommand(7, "liq 1m", { ...o, lang: "ru" }).text, /от \$5M до \$5B/);
  assert.match(handleAlertCommand(7, "what", { ...o, lang: "es" }).text, /No pude entender/);
  assert.equal(clearUserTriggers(7, o), MAX_TRIGGERS);
  assert.equal(clearUserTriggers(7, o), 0);
});

test("language: /alerts choice first, then the stored trigger language, then zh; /alerts card suffix", () => {
  const o = tmp();
  assert.equal(alertLangFor(5, o), "zh");
  handleAlertCommand(5, "btc > 1", { ...o, lang: "tr" });
  assert.equal(alertLangFor(5, o), "tr");
  writeFileSync(o.subsFile, JSON.stringify({ version: 1, users: { 5: { topics: [], lang: "vi" } } }));
  assert.equal(alertLangFor(5, o), "vi");
  handleAlertCommand(5, "list", { ...o, lang: "vi" });
  assert.equal(loadTriggers(o).users["5"].lang, "vi", "the stored language follows the member's latest choice");
  assert.equal(alertCardSuffix(5, "en", o), "\n\n🎯 Custom alerts:\n1. BTC above $1\nCustom alerts: /alert btc > 70000 · /alert list");
  assert.equal(alertCardSuffix(6, "zh", o), "\n\n自定义提醒：/alert btc > 70000 · /alert list");
  assert.equal(alertCardSuffix(undefined, "xx", o), "\n\n自定义提醒：/alert btc > 70000 · /alert list");
  assert.match(stopAllText("en"), /All private alerts are off/);
});

// ---------- evaluation ----------
const doc1 = (triggers, lang = "en") => ({ version: 1, users: { 42: { lang, triggers } } });
const market = (o = {}) => ({ liquidations: { h1: { totalUsd: 80e6, longUsd: 60e6, shortUsd: 20e6 } }, funding: { rows: [] }, ...o });

test("price fires only on a crossing; the first observation is a baseline; 6 h cooldown", () => {
  const doc = doc1([{ id: "p1", type: "price", coin: "BTC", op: "above", value: 70000 }]);
  const run = (state, price, now) => evaluateTriggers({ doc, state, now, prices: { BTC: { price, change24hPct: 1 } }, market: market(), coinSlugs: { BTC: "bitcoin" } });
  let r = run(undefined, 71000, T0);
  assert.equal(r.deliveries.length, 0, "already above at the first look: no alert");
  r = run(r.state, 69000, T0 + 120e3);
  assert.equal(r.deliveries.length, 0);
  r = run(r.state, 70500, T0 + 240e3);
  assert.equal(r.deliveries.length, 1);
  assert.equal(r.deliveries[0].text.split("\n")[0], "<b>🔔 BTC crossed above $70,000</b>");
  assert.match(r.deliveries[0].text, /href="https:\/\/nexualpha\.com\/coins\/bitcoin\?src=tg-alert-price"/);
  r = run(r.state, 69000, T0 + 360e3);
  r = run(r.state, 70500, T0 + 480e3);
  assert.equal(r.deliveries.length, 0, "second crossing inside 6 h is suppressed");
  r = run(r.state, 69000, T0 + 6 * H);
  r = run(r.state, 70500, T0 + 6 * H + 600e3);
  assert.equal(r.deliveries.length, 1, "fires again after the cooldown");
  // below rule
  const below = doc1([{ id: "p2", type: "price", coin: "ETH", op: "below", value: 2000 }]);
  let s = evaluateTriggers({ doc: below, now: T0, prices: { ETH: { price: 2100 } } }).state;
  const b = evaluateTriggers({ doc: below, state: s, now: T0 + 1, prices: { ETH: { price: 1990 } } });
  assert.equal(b.deliveries.length, 1);
  assert.match(b.deliveries[0].text, /href="https:\/\/nexualpha\.com\/coins\?src=tg-alert-price"/, "no slug -> /coins");
  s = evaluateTriggers({ doc: below, state: b.state, now: T0 + 2, prices: {} }).state;
  assert.equal(s.byId["42:p2"].side, "below", "a missing price changes nothing");
});

test("move fires when |1h change| reaches the threshold, 1 h cooldown", () => {
  const doc = doc1([{ id: "m1", type: "move", coin: "SOL", pct: 5 }]);
  const run = (state, change1hPct, now) => evaluateTriggers({ doc, state, now, prices: { SOL: { price: 150, change1hPct, change24hPct: 8 } } });
  assert.equal(run(undefined, 4.9, T0).deliveries.length, 0);
  let r = run(undefined, -5.2, T0);
  assert.equal(r.deliveries.length, 1);
  assert.equal(r.deliveries[0].text.split("\n")[0], "<b>⚡ SOL -5.2% in the past hour</b>");
  assert.match(r.deliveries[0].text, /Price \$150 · 1h -5\.2% · 24h \+8%/);
  assert.equal(run(r.state, 7, T0 + 30 * 60e3).deliveries.length, 0);
  assert.equal(run(r.state, 7, T0 + H).deliveries.length, 1);
  assert.equal(run(undefined, undefined, T0).deliveries.length, 0, "no kline data -> no alert");
});

test("liquidation fires on the 1h total with a 3 h cooldown and shows the long/short split", () => {
  const doc = doc1([{ id: "l1", type: "liquidation", minUsd: 50e6 }]);
  let r = evaluateTriggers({ doc, now: T0, market: market() });
  assert.equal(r.deliveries.length, 1);
  assert.equal(r.deliveries[0].text.split("\n").slice(0, 2).join("\n"), "<b>💥 $80M liquidated in the past hour</b>\nLongs $60M · Shorts $20M");
  assert.match(r.deliveries[0].text, /nexualpha\.com\/liquidations\?src=tg-alert-liquidation/);
  assert.equal(evaluateTriggers({ doc, state: r.state, now: T0 + 2 * H, market: market() }).deliveries.length, 0);
  assert.equal(evaluateTriggers({ doc, state: r.state, now: T0 + 3 * H, market: market() }).deliveries.length, 1);
  assert.equal(evaluateTriggers({ doc, now: T0, market: market({ liquidations: { h1: { totalUsd: 10e6 } } }) }).deliveries.length, 0);
});

test("funding fires per coin at most once per 8 h, using the more extreme of Binance and OKX", () => {
  const rows = [
    { symbol: "BTC", binanceRate: 0.0001, okxRate: -0.0009, binanceNextAt: "2026-10-13T08:00:00Z", okxNextAt: "2026-10-13T08:00:00Z" },
    { symbol: "ETH", binanceRate: 0.0006, okxRate: 0.0001, binanceNextAt: "2026-10-13T08:00:00Z" },
    { symbol: "SOL", binanceRate: 0.0001, okxRate: 0.0001 },
  ];
  const all = doc1([{ id: "f1", type: "funding", coin: null, absRate: 0.0005 }]);
  let r = evaluateTriggers({ doc: all, now: T0, market: market({ funding: { rows } }) });
  assert.equal(r.deliveries.length, 1);
  assert.deepEqual(r.deliveries[0].text.split("\n").slice(0, 3), ["<b>📊 Extreme funding rates</b>", "BTC -0.09% (OKX) · next 08:00 UTC", "ETH +0.06% (Binance) · next 08:00 UTC"]);
  assert.match(r.deliveries[0].text, /nexualpha\.com\/funding-rates\?src=tg-alert-funding/);
  assert.equal(evaluateTriggers({ doc: all, state: r.state, now: T0 + 7 * H, market: market({ funding: { rows } }) }).deliveries.length, 0);
  assert.equal(evaluateTriggers({ doc: all, state: r.state, now: T0 + 8 * H, market: market({ funding: { rows } }) }).deliveries.length, 1);
  const eth = doc1([{ id: "f2", type: "funding", coin: "ETH", absRate: 0.001 }]);
  assert.equal(evaluateTriggers({ doc: eth, now: T0, market: market({ funding: { rows } }) }).deliveries.length, 0);
  const btc = doc1([{ id: "f3", type: "funding", coin: "BTC", absRate: 0.0005 }]);
  assert.match(evaluateTriggers({ doc: btc, now: T0, market: market({ funding: { rows } }) }).deliveries[0].text, /^<b>📊 BTC funding rate at an extreme<\/b>\nBTC -0\.09% \(OKX\)/);
});

test("listing: first evaluation baselines, then each new announcement once per member", () => {
  const doc = doc1([{ id: "s1", type: "listing", venue: "binance" }]);
  const ann = (id, mins, extra = {}) => ({ id, venue: "binance", category: "listing", title: `Binance will list ${id} <X&Y>`, url: "https://binance.com/x", publishedAt: new Date(T0 - mins * 60e3).toISOString(), ...extra });
  let r = evaluateTriggers({ doc, now: T0, announcements: [ann("a1", 30), ann("a2", 60)] });
  assert.equal(r.deliveries.length, 0, "existing listings are only baselined");
  r = evaluateTriggers({ doc, state: r.state, now: T0 + 120e3, announcements: [ann("a1", 30), ann("a2", 60), ann("a3", 1), ann("o1", 1, { venue: "okx" }), ann("d1", 1, { category: "delisting" }), ann("old", 7 * 60)] });
  assert.equal(r.deliveries.length, 1);
  assert.equal(r.deliveries[0].text.split("\n").slice(0, 2).join("\n"), "<b>🆕 New listing on Binance</b>\nBinance will list a3 &lt;X&amp;Y&gt;");
  assert.match(r.deliveries[0].text, /nexualpha\.com\/flash\?src=tg-alert-listing/);
  assert.doesNotMatch(r.deliveries[0].text, /binance\.com\/x/, "links only to our page");
  r = evaluateTriggers({ doc, state: r.state, now: T0 + 240e3, announcements: [ann("a3", 1)] });
  assert.equal(r.deliveries.length, 0, "once per announcement id");
});

test("20 alerts per member per UTC day; extra ones are dropped, not queued; counter resets next day", () => {
  const triggers = Array.from({ length: 10 }, (_, i) => ({ id: `m${i}`, type: "move", coin: `C${i}X`, pct: 1 }));
  const doc = doc1(triggers);
  const prices = Object.fromEntries(triggers.map((t) => [t.coin, { price: 1, change1hPct: 3 }]));
  let state;
  let sent = 0, dropped = 0;
  for (let h = 0; h < 3; h++) { const r = evaluateTriggers({ doc, state, now: T0 + h * H, prices }); state = r.state; sent += r.deliveries.length; dropped += r.dropped.length; }
  assert.equal(sent, DAILY_CAP);
  assert.equal(dropped, 10);
  assert.equal(state.counts["42"], DAILY_CAP);
  const r = evaluateTriggers({ doc, state, now: T0 + 3 * H, prices });
  assert.equal(r.deliveries.length, 0, "dropped alerts are not replayed");
  const next = evaluateTriggers({ doc, state, now: T0 + 24 * H, prices });
  assert.equal(next.deliveries.length, 10);
  assert.equal(next.state.day, "2026-10-14");
});

test("state for deleted rules and members is pruned; the input state is not mutated", () => {
  const doc = doc1([{ id: "p1", type: "price", coin: "BTC", op: "above", value: 1 }, { id: "s1", type: "listing", venue: "okx" }]);
  const r = evaluateTriggers({ doc, now: T0, prices: { BTC: { price: 2 } }, announcements: [{ id: "x", venue: "okx", category: "listing", title: "t", publishedAt: new Date(T0).toISOString() }] });
  assert.deepEqual(Object.keys(r.state.byId).sort(), ["42:p1", "42:s1"]);
  const frozen = JSON.stringify(r.state);
  const after = evaluateTriggers({ doc: doc1([{ id: "p1", type: "price", coin: "BTC", op: "above", value: 1 }]), state: r.state, now: T0 + 1, prices: { BTC: { price: 2 } } });
  assert.deepEqual(Object.keys(after.state.byId), ["42:p1"]);
  assert.deepEqual(after.state.seen, {}, "listing memory goes with the last listing rule");
  assert.equal(JSON.stringify(r.state), frozen);
  assert.deepEqual(evaluateTriggers({ doc: { users: {} }, state: after.state, now: T0 + 2 }).state.byId, {});
});

test("delivery language: trigger doc, then /alerts subscription, then zh", () => {
  const t = [{ id: "l", type: "liquidation", minUsd: 5e6 }];
  const lang = (doc, subs) => evaluateTriggers({ doc, subs, now: T0, market: market() }).deliveries[0].lang;
  assert.equal(lang({ users: { 1: { lang: "ru", triggers: t } } }, { users: { 1: { lang: "es" } } }), "ru");
  assert.equal(lang({ users: { 1: { triggers: t } } }, { users: { 1: { lang: "es" } } }), "es");
  assert.equal(lang({ users: { 1: { lang: "de", triggers: t } } }), "zh");
});

// ---------- messages in 8 languages ----------
const SAMPLES = {
  price: { coin: "BTC", op: "above", value: 70000, price: 70120, change1hPct: 0.8, change24hPct: -2.1, slug: "bitcoin" },
  move: { coin: "ETH", price: 3000, change1hPct: -5.4, change24hPct: -7, slug: "ethereum" },
  liquidation: { totalUsd: 120e6, longUsd: 90e6, shortUsd: 30e6 },
  funding: { coin: null, hits: [{ symbol: "BTC", venue: "Binance", rate: 0.0011, nextAt: "2026-10-13T08:00:00Z" }] },
  listing: { venue: "okx", title: "OKX lists <ABC> & XYZ" },
};
const PATHS = { price: "/coins/bitcoin", move: "/coins/ethereum", liquidation: "/liquidations", funding: "/funding-rates", listing: "/flash" };
const FINE_PRINT = /not (financial|investment) advice|не является инвестиционной|yatırım tavsiyesi|lời khuyên đầu tư|saran investasi|asesoramiento|recomendação de investimento|投资建议|免责声明|disclaimer/i;

test("every message type renders in all 8 languages with a bold head, our locale link and the manage line", () => {
  assert.deepEqual(LOCALE_PATH, SENDER_LOCALE_PATH, "same locale map as alert-sender");
  for (const lang of LANGS) {
    for (const [type, data] of Object.entries(SAMPLES)) {
      const text = triggerMessage(type, data, lang);
      const lines = text.split("\n");
      assert.match(lines[0], /^<b>(🔔|⚡|💥|📊|🆕) .+<\/b>$/u, `${lang} ${type} head`);
      assert.doesNotMatch(text, /undefined|null|NaN|\[object|\$\{/, `${lang} ${type} leaks`);
      assert.doesNotMatch(text, FINE_PRINT, `${lang} ${type} fine print`);
      const href = `https://nexualpha.com${LOCALE_PATH[lang]}${PATHS[type]}?src=tg-alert-${type}`;
      assert.ok(text.includes(`<a href="${href}">${copyFor(lang).more}</a>`), `${lang} ${type} link ${href}`);
      assert.equal(lines.at(-1), copyFor(lang).manage);
      assert.match(lines.at(-1), /\/alerts.*\/stop/);
      if (type === "listing") assert.ok(text.includes("OKX lists &lt;ABC&gt; &amp; XYZ"), `${lang} escapes`);
    }
  }
});

test("copy tables are complete in all 8 languages and carry no fine print", () => {
  const keys = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`])).sort();
  const en = keys(copyFor("en"));
  for (const lang of LANGS) {
    const c = copyFor(lang);
    assert.deepEqual(keys(c), en, `${lang} keys`);
    assert.match(c.usage, /\/alert btc > 70000|\/alert btc 5%/);
    assert.match(c.usage, /\/alerts/);
    assert.match(c.usage, /\/stop/);
    assert.match(c.usage, /20/);
    assert.match(c.usage, /listing binance|上币 binance/);
    assert.match(c.usage, /funding btc/);
    assert.doesNotMatch(JSON.stringify(c) + c.usage, FINE_PRINT, lang);
    for (const t of [{ type: "price", coin: "BTC", op: "below", value: 60000 }, { type: "move", coin: "BTC", pct: 5 }, { type: "liquidation", minUsd: 50e6 }, { type: "funding", coin: null, absRate: 0.0005 }, { type: "listing", venue: "kucoin" }]) {
      const d = describeTrigger(t, lang);
      assert.ok(d && !/undefined|NaN/.test(d), `${lang} ${t.type}: ${d}`);
    }
    assert.ok(handleAlertCommand(1, "x > 1", { lang, file: tmp().file }).text.length > 10);
  }
  assert.equal(copyFor("xx"), copyFor("zh"));
});

// ---------- sender integration (dry: fake fetch + fake dm) ----------
test("runTriggerAlerts fetches prices once, klines only for move coins, and DMs each delivery", async () => {
  const calls = [];
  const fetchBinance = async (url) => {
    calls.push(url);
    if (url.endsWith("/ticker/24hr")) return [{ symbol: "BTCUSDT", lastPrice: "71000", priceChangePercent: "2.5" }, { symbol: "ETHUSDT", lastPrice: "3150", priceChangePercent: "-1" }, { symbol: "ETHBTC", lastPrice: "0.05" }];
    if (url.includes("klines?symbol=ETHUSDT")) return [[0, "3300"], [0, "3000"]];
    throw new Error(`unexpected ${url}`);
  };
  const fetchSite = async () => ({ coins: [{ symbol: "BTC", slug: "bitcoin" }, { symbol: "btc", slug: "fake-btc" }, { symbol: "ETH", slug: "ethereum" }] });
  const doc = { version: 1, users: {
    1: { lang: "en", triggers: [{ id: "a", type: "price", coin: "BTC", op: "above", value: 70000 }, { id: "b", type: "move", coin: "ETH", pct: 5 }] },
    2: { triggers: [{ id: "c", type: "liquidation", minUsd: 50e6 }] },
  } };
  const sent = [];
  const dm = async (uid, text, buttons) => sent.push({ uid, text, buttons });
  const state0 = { byId: { "1:a": { side: "below" } } };
  const st = await runTriggerAlerts({ doc, state: state0, subs: { users: { 2: { lang: "pt" } } }, market: market(), announcements: [], dm, now: T0, fetchBinance, fetchSite, sleep: async () => {} });
  assert.deepEqual(calls, ["https://fapi.binance.com/fapi/v1/ticker/24hr", "https://fapi.binance.com/fapi/v1/klines?symbol=ETHUSDT&interval=1h&limit=2"]);
  assert.deepEqual(sent.map((s) => [s.uid, plain(s.text.split("\n")[0])]), [
    ["1", "<b>🔔 BTC crossed above $70,000</b>"],
    ["1", "<b>⚡ ETH +5% in the past hour</b>"],
    ["2", "<b>💥 US$ 80 mi liquidados na última hora</b>"],
  ]);
  assert.match(sent[0].text, /\/coins\/bitcoin\?src=tg-alert-price/);
  assert.equal(sent[0].buttons, null);
  assert.equal(st.counts["1"], 2);
  assert.deepEqual(await runTriggerAlerts({ doc: { users: {} }, state: st, dm, fetchBinance: () => assert.fail("no fetch without rules") }), st);
});

test("fetchTriggerPrices dedupes and caps kline calls; coinSlugs survives a failed fetch", async () => {
  const urls = [];
  const coins = Array.from({ length: 50 }, (_, i) => `C${i}`);
  const prices = await fetchTriggerPrices({
    fetchJson: async (url) => { urls.push(url); return url.endsWith("24hr") ? coins.map((c) => ({ symbol: `${c}USDT`, lastPrice: "2", priceChangePercent: "1" })) : [[0, "1"]]; },
    coins: [...coins, "C0"], sleep: async () => {},
  });
  assert.equal(urls.length, 1 + 40);
  assert.equal(prices.C0.change1hPct, 100);
  assert.equal(prices.C45.change1hPct, undefined);
  assert.deepEqual(moveCoins({ users: { 1: { triggers: [{ type: "move", coin: "BTC" }, { type: "move", coin: "BTC" }, { type: "price", coin: "ETH" }] } } }), ["BTC"]);
  // runs after the integration test above filled the cache at T0: a failed refresh keeps the last good map
  assert.equal((await coinSlugs({ fetchJson: async () => { throw new Error("down"); }, now: T0 + 7 * H })).BTC, "bitcoin");
  assert.equal((await coinSlugs({ fetchJson: async () => assert.fail("cached"), now: T0 + H })).ETH, "ethereum");
});

test("the sender still reads the triggers file only (no writes) and a missing file means no rules", () => {
  const src = readFileSync(new URL("./alert-sender.mjs", import.meta.url), "utf8");
  assert.match(src, /loadTriggers\(\{ file: TRIGGERS \}\)/);
  assert.doesNotMatch(src, /saveTriggers|handleAlertCommand|clearUserTriggers/);
  assert.deepEqual(loadTriggers({ file: path.join(tmpdir(), "nx-does-not-exist", "t.json") }), { version: 1, users: {} });
});

test("runTriggerAlerts pauses a member who blocked the bot for 7 days instead of retrying every cycle", async () => {
  const doc = { version: 1, users: { 9: { lang: "en", triggers: [{ id: "l", type: "liquidation", minUsd: 50e6 }] } } };
  const blocked = new Set();
  const sent = [];
  const dm = async (uid) => { sent.push(uid); blocked.add(uid); };
  const st1 = await runTriggerAlerts({ doc, state: {}, subs: { users: {} }, market: market(), announcements: [], dm, blocked, now: T0 });
  assert.deepEqual(sent, ["9"]);
  assert.ok(st1.paused["9"] > T0);
  const st2 = await runTriggerAlerts({ doc, state: { ...st1, byId: {} }, subs: { users: {} }, market: market(), announcements: [], dm, blocked: new Set(), now: T0 + 4 * H });
  assert.deepEqual(sent, ["9"], "still paused");
  const st3 = await runTriggerAlerts({ doc, state: { ...st2, byId: {}, day: "" }, subs: { users: {} }, market: market(), announcements: [], dm: async (uid) => sent.push(uid), blocked: new Set(), now: T0 + 8 * 24 * H });
  assert.deepEqual(sent, ["9", "9"], "resumes after the pause");
  assert.equal(st3.paused["9"], undefined);
});
