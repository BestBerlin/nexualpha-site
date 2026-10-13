// Telegram surfaces of the site's tools (owner 2026-10-13): pinned menu, digest "today" block, tool of the week,
// bot /start menu. Rules: every language; Türkiye has no Bitget anywhere; ru is neutral (no sign-up wording);
// no fine print; no domain-like brand text in visible copy; links tagged with a src.
import test from "node:test";
import assert from "node:assert/strict";
import { digestMessage, partnerButtons } from "./alert-sender.mjs";
import { articles, campaigns, mk, partners } from "./fixtures/alert-fixture.mjs";
import {
  FEATURE_KEYS, FEATURE_LANGS, campaignLinks, feature, langFromCode, pinnedMenuMessage, rotatingFeatures, startMenu,
  todayBlock, todaysCalendarEvents, toolOfWeekKey, toolOfWeekMessage, topImportantFlash,
} from "./site-features.mjs";

const CHANNEL_LANGS = ["zh", "en", "ru", "tr", "vi"];
const NOW = new Date("2026-10-13T13:00:00Z"); // 21:00 SGT
const WEEKS = Array.from({ length: FEATURE_KEYS.length }, (_, i) => new Date(Date.UTC(2026, 9, 12 + 7 * i, 12, 5)));
const visible = (s) => String(s).replace(/<a href="[^"]*">/g, "").replace(/<[^>]+>/g, "");
const allText = (o) => JSON.stringify(o);
const FINE_PRINT = /disclaimer|not financial advice|terms apply|risk warning|风险提示|免责声明|返佣|commission|комисси|komisyon|hoa hồng|partner links|партнёрск/i;
const DOMAIN = /\b[a-z0-9-]+\.(com|io|org|net|co|exchange|app)\b/i;
const RU_SIGNUP = /регистр|зарегистр|sign ?up|бонус|реферал/i;

const flash = { items: [
  { important: true, time: "2026-10-13T10:00:00Z", headline: "Binance lists ABC", path: "/flash/aaa-binance-lists-abc", venue: "binance" },
  { important: true, time: "2026-10-13T09:00:00Z", headline: "Binance lists ABC", path: "/flash/bbb-binance-lists-abc", venue: "binance" },
  { important: true, time: "2026-10-13T08:00:00Z", headline: "Bitget lists XYZ", path: "/flash/ccc-bitget-lists-xyz", venue: "bitget" },
  { important: false, time: "2026-10-13T07:00:00Z", headline: "OKX minor notice", path: "/flash/ddd", venue: "okx" },
  { important: true, time: "2026-10-11T07:00:00Z", headline: "Old news", path: "/flash/eee", venue: "okx" },
] };
const calendar = { events: [
  { start: "2026-10-13T12:30:00Z", allDay: false, title: "US CPI inflation", titles: { ru: "Инфляция CPI в США" } },
  { start: "2026-10-13T00:00:00Z", allDay: true, title: "Bitget delists 3 tokens", venue: "bitget" },
  { start: "2026-10-13T00:00:00Z", allDay: true, title: "Bybit to delist 1 token", venue: "bybit" },
  { start: "2026-10-13T17:00:00Z", allDay: false, title: "Tomorrow in SGT" },
] };

for (const lang of FEATURE_LANGS) {
  test(`${lang}: start menu lists /alert examples and tagged tool buttons, no fine print, no domain text`, () => {
    const m = startMenu(lang);
    assert.match(m.text, /\/alert btc > 70000/);
    assert.match(m.text, /\/alert eth < 2500/);
    assert.match(m.text, /\/alert sol 5%/);
    assert.match(m.text, /\/stop/);
    assert.ok(m.text.length < 1200);
    const urls = m.rows.flat().map((b) => b.url);
    assert.ok(urls.length >= 6);
    for (const u of urls) assert.match(u, new RegExp(`^https://nexualpha\\.com.*[?&]src=tg-bot-start-${lang}$`));
    assert.doesNotMatch(m.text, FINE_PRINT);
    assert.doesNotMatch(m.text + m.rows.flat().map((b) => b.text).join(" "), DOMAIN);
  });
}

for (const lang of CHANNEL_LANGS) {
  test(`${lang}: weekly tool posts rotate through every feature, 2–3 lines, one button`, () => {
    const keys = new Set();
    for (const w of WEEKS) {
      const m = toolOfWeekMessage(w, lang);
      keys.add(m.key);
      const body = m.text.split("\n\n")[1];
      assert.ok(body && body.length < 260, `${lang} ${m.key} blurb length`);
      assert.equal(m.buttons.flat().length, 1);
      assert.doesNotMatch(visible(m.text), DOMAIN);
      assert.doesNotMatch(m.text, FINE_PRINT);
    }
    assert.equal(keys.size, FEATURE_KEYS.length, "a full rotation covers every feature");
  });

  test(`${lang}: digest today block = rotating features + 24 h important flash (deduped) + today's SGT calendar`, () => {
    const lines = todayBlock({ now: NOW, lang, flash, calendar });
    const text = lines.join("\n");
    const feats = rotatingFeatures(NOW, lang, `tg-digest-${lang}`);
    assert.equal(feats.length, 2);
    for (const f of feats) assert.ok(text.includes(`<a href="${f.url}">`), f.key);
    assert.equal((text.match(/Binance lists ABC/g) || []).length, 1, "deduped by headline");
    assert.ok(!text.includes("Old news") && !text.includes("OKX minor notice"));
    assert.ok(text.includes("/flash/aaa-binance-lists-abc?src=tg-digest-"));
    assert.ok(text.includes(lang === "ru" ? "20:30 Инфляция CPI в США" : "20:30 US CPI inflation"), "CPI at 20:30 SGT");
    assert.ok(!text.includes("Tomorrow in SGT"), "01:00 SGT next day is not today");
    assert.ok(lines.length <= 10, "short");
    if (lang === "tr") assert.doesNotMatch(text, /bitget/i);
    else assert.ok(text.includes("Bitget lists XYZ"));
  });
}

test("digestMessage with the today block: one header, two articles max, tr has no Bitget, ru buttons are neutral", () => {
  for (const lang of CHANNEL_LANGS) {
    const d = digestMessage(mk, partners, articles, campaigns, lang, { now: NOW, flash, calendar });
    assert.ok(d.text.length < 3000);
    assert.doesNotMatch(d.text, FINE_PRINT);
    if (lang === "tr") assert.doesNotMatch(allText(d), /bitget/i);
    if (lang === "ru") assert.doesNotMatch(allText(d.buttons), RU_SIGNUP);
  }
  const en = digestMessage(mk, partners, articles, campaigns, "en", { now: NOW, flash, calendar });
  assert.equal((en.text.match(/Today on NexuAlpha/g) || []).length, 1);
  assert.ok(en.text.includes("📅"));
  const zh = digestMessage(mk, partners, articles, campaigns, "zh", { now: NOW, flash, calendar });
  assert.ok(zh.text.includes("<b>今日 NexuAlpha</b>"));
});

test("Türkiye: no Bitget in any Telegram surface; ru: no sign-up wording in any surface", () => {
  const surfaces = (lang) => [pinnedMenuMessage(lang), startMenu(lang), ...WEEKS.map((w) => toolOfWeekMessage(w, lang)), campaignLinks(lang, "x"), partnerButtons(partners, lang, "x")];
  assert.doesNotMatch(allText(surfaces("tr")), /bitget/i);
  assert.doesNotMatch(visible(allText(surfaces("ru")).replace(/https?:[^"\\]+/g, "")), RU_SIGNUP);
  assert.deepEqual(campaignLinks("ru", "x").map((c) => c.key), ["activities"]);
  assert.ok(campaignLinks("zh", "x").some((c) => c.key === "bitget-alliance"));
  assert.ok(!campaignLinks("tr", "x").some((c) => /bitget/.test(c.key)));
});

test("helpers: language codes, rotation, links", () => {
  assert.equal(langFromCode("zh-hans"), "zh");
  assert.equal(langFromCode("pt-br"), "pt");
  assert.equal(langFromCode("ru"), "ru");
  assert.equal(langFromCode("de"), null);
  assert.equal(langFromCode(undefined), null);
  assert.equal(toolOfWeekKey(new Date("2026-10-12T12:00:00Z")), toolOfWeekKey(new Date("2026-10-18T15:59:00Z")), "same SGT week");
  assert.notEqual(toolOfWeekKey(new Date("2026-10-12T12:00:00Z")), toolOfWeekKey(new Date("2026-10-19T12:00:00Z")));
  assert.equal(feature("convert", "tr", "s").url, "https://nexualpha.com/tr/convert/btc-to-try?src=s");
  assert.equal(feature("convert", "zh", "s").url, "https://nexualpha.com/zh-hans/convert/btc-to-cny?src=s");
  assert.equal(feature("alerts", "vi").url, "https://t.me/NexuAlphaAssistantBot?start=alerts-vi");
  assert.notDeepEqual(rotatingFeatures(NOW, "en", "s").map((f) => f.key), rotatingFeatures(new Date(NOW.getTime() + 864e5), "en", "s").map((f) => f.key));
  assert.equal(topImportantFlash({ items: [] }, NOW, "en").length, 0);
  assert.equal(todaysCalendarEvents(null, NOW, "en").length, 0);
});
