// Telegram surfaces of the site's tools (owner 2026-10-13): pinned menu, digest "today" block, tool of the week,
// bot /start menu. Rules: every language; Türkiye has no Bitget anywhere; ru is neutral (no sign-up wording);
// no fine print; no domain-like brand text in visible copy; links tagged with a src.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CAMPAIGN_TITLE, digestMessage, eventMessage, listingMessage, partnerButtons } from "./alert-sender.mjs";
import { CAMPAIGN_TITLE as FEED_CAMPAIGN_TITLE, NEUTRAL_CTA_LOCALE_LIST as FEED_NEUTRAL } from "../channel-feed/channel-feed.mjs";
import { articles, campaignItem, campaigns, listingItem, mk, partners } from "./fixtures/alert-fixture.mjs";
import { VENUE_PRIORITY as SITE_VENUE_PRIORITY } from "../../pilot-01-prototype/src/data/venue-priority.js";
import {
  CAMPAIGN_PAGES, FEATURE_KEYS, FEATURE_LANGS, NEUTRAL_CTA_LOCALE_LIST, campaignLinks, isNeutralCtaLocale, feature, langFromCode, pinnedMenuMessage, rotatingFeatures, startMenu,
  calendarRecapEvents, comingCalendarEvents, comingUpHead, todayBlock, todayRecapHead, todaysCalendarEvents, toolOfWeekKey, toolOfWeekMessage, topImportantFlash,
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

test("Telegram venue priority uses the canonical site constant", () => {
  assert.deepEqual(CAMPAIGN_PAGES, ["bitget-alliance", "binance-october-gifts", "bybit-stocks"]);
  assert.deepEqual(SITE_VENUE_PRIORITY.slice(0, 3), ["bitget", "okx", "binance"]);
});

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

  test(`${lang}: digest today block separates recap from coming-up calendar items`, () => {
    const lines = todayBlock({ now: NOW, lang, flash, calendar });
    const text = lines.join("\n");
    const feats = rotatingFeatures(NOW, lang, `tg-digest-${lang}`);
    assert.ok(text.includes(`<b>${todayRecapHead(lang)}</b>`));
    assert.ok(text.includes(`<b>${comingUpHead(lang)}</b>`));
    assert.equal(feats.length, 2);
    for (const f of feats) assert.ok(text.includes(`<a href="${f.url}">`), f.key);
    assert.equal((text.match(/Binance lists ABC/g) || []).length, 1, "deduped by headline");
    assert.ok(!text.includes("Old news") && !text.includes("OKX minor notice"));
    assert.ok(text.includes("/flash/aaa-binance-lists-abc?src=tg-digest-"));
    assert.ok(text.includes(lang === "ru" ? "20:30 Инфляция CPI в США" : "20:30 US CPI inflation"), "CPI at 20:30 SGT");
    assert.ok(text.includes("14 Oct 01:00 SGT Tomorrow in SGT"), "coming-up items include date and SGT time");
    assert.ok(lines.length <= 14, "short");
    if (lang === "tr") assert.doesNotMatch(text, /bitget/i);
    else assert.ok(text.includes("Bitget lists XYZ"));
  });
}

test("calendar helpers split same-day recap from the next 7 days", () => {
  const recap = calendarRecapEvents(calendar, NOW, "en").map((e) => e.title);
  const coming = comingCalendarEvents(calendar, NOW, "en").map((e) => e.title);
  assert.ok(recap.includes("US CPI inflation"));
  assert.ok(recap.includes("Bybit to delist 1 token"));
  assert.ok(!recap.includes("Tomorrow in SGT"));
  assert.deepEqual(coming, ["Tomorrow in SGT"]);
  assert.equal(todayRecapHead("id"), "Rekap hari ini");
  assert.equal(comingUpHead("es"), "Próximo (fechas límite / calendario)");
  assert.equal(todaysCalendarEvents(null, NOW, "en").length, 0);
  assert.equal(topImportantFlash({ items: [{ important: true, time: "2026-10-13T14:00:00Z", headline: "Future", path: "/flash/future" }] }, NOW, "en").length, 0);
});

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
  assert.deepEqual(campaignLinks("en", "x").map((c) => c.key), ["bitget-alliance", "binance-october-gifts", "bybit-stocks"]);
  assert.deepEqual(campaignLinks("tr", "x").map((c) => c.key), ["binance-october-gifts", "bybit-stocks"]);
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

// Owner 2026-10-13: vi is an information-only locale like ru (Vietnam Resolution 05/2025/NQ-CP): news, market data and
// tools stay; no sign-up CTA, no invite code, no /go/ partner button, no campaign post or campaign page link.
const CODES = ["nexu888", "11350287", "7f97gkqw", "DPRWSXAS", "48553"];
try {
  const feed = JSON.parse(readFileSync(new URL("../../pilot-01-prototype/public/intel/partners.json", import.meta.url), "utf8"));
  for (const p of feed.partners || []) if (p.inviteCode) CODES.push(p.inviteCode);
} catch {}
for (const p of partners) if (p.inviteCode) CODES.push(p.inviteCode);
const CODE_RE = new RegExp(CODES.map((c) => String(c).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i");
const VI_SIGNUP = /đăng ký|mã mời|giới thiệu|hoàn tới|hoàn phí|ưu đãi|sign ?up|register|referral/i;
const CAMPAIGN_PAGE = /\/activities(?!\/updates\/)/;
const viSurfaces = () => [
  pinnedMenuMessage("vi"), startMenu("vi"), ...WEEKS.map((w) => toolOfWeekMessage(w, "vi")), campaignLinks("vi", "x"),
  partnerButtons(partners, "vi", "x"), digestMessage(mk, partners, articles, campaigns, "vi", { now: NOW, flash, calendar }),
  digestMessage(mk, partners, articles, campaigns, "vi"),
  eventMessage({ type: "liquidation-spike" }, mk, "vi"), listingMessage(listingItem, partners[0], "vi"),
];

test("vi is neutral: no /go/, no invite code, no sign-up copy, no campaign page in any Telegram surface", () => {
  const all = allText(viSurfaces());
  assert.doesNotMatch(all, /\/go\//);
  assert.doesNotMatch(all, CODE_RE);
  assert.doesNotMatch(all, CAMPAIGN_PAGE);
  assert.doesNotMatch(visible(all.replace(/https?:[^"\\]+/g, "")), VI_SIGNUP);
  assert.deepEqual(campaignLinks("vi", "x"), []);
});

test("vi pinned menu and /start: news, market and tool links only, no campaign row", () => {
  const pin = pinnedMenuMessage("vi");
  assert.doesNotMatch(pin.text, /🎁/);
  for (const k of ["flash", "calendar", "liquidations", "matrix"]) assert.ok(pin.text.includes(feature(k, "vi", "tg-pin-vi").url), k);
  const urls = [...pin.text.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).concat(pin.buttons.flat().map((b) => b.url));
  for (const u of urls) assert.match(u, /^https:\/\/(nexualpha\.com\/vi\/(flash|calendar|liquidations|funding-rates|coins|convert|academy|glossary)|t\.me\/NexuAlphaAssistantBot\?start=alerts-vi)/, u);
  const start = startMenu("vi");
  assert.equal(start.rows.length, 3, "tool rows only");
  assert.ok(!start.rows.flat().some((b) => /🎁/.test(b.text) || CAMPAIGN_PAGE.test(b.url)));
});

test("vi digest: exchange buttons show only the name and open the exchange page; no campaigns block", () => {
  const d = digestMessage(mk, partners, articles, campaigns, "vi", { now: NOW, flash, calendar });
  const exchangeButtons = d.buttons.flat().filter((b) => b.url.includes("/exchanges/"));
  assert.ok(exchangeButtons.length >= 2);
  for (const b of exchangeButtons) {
    assert.ok(partners.some((p) => p.name === b.text), `name only: ${b.text}`);
    assert.match(b.url, /^https:\/\/nexualpha\.com\/vi\/exchanges\/[a-z-]+\?src=tg-digest-vi$/);
  }
  assert.ok(!d.text.includes("Sự kiện sàn giao dịch"), "no campaigns heading");
  for (const c of campaigns) assert.ok(!d.text.includes(c.url), "no campaign links");
  const en = digestMessage(mk, partners, articles, campaigns, "en", { now: NOW, flash, calendar });
  assert.ok(en.buttons.flat().some((b) => b.url.includes("/go/")), "non-neutral channels keep sign-up buttons");
});

test("vi listing DMs: official notice + exchange page; campaign DMs are not sent", () => {
  assert.equal(listingMessage(campaignItem, partners.find((p) => p.slug === "bitget") || partners[0], "vi"), null);
  assert.equal(listingMessage(campaignItem, partners.find((p) => p.slug === "bitget") || partners[0], "ru"), null);
  const m = listingMessage(listingItem, partners[0], "vi");
  assert.doesNotMatch(allText(m), /\/go\//);
  assert.match(m.buttons[0][0].url, /^https:\/\/nexualpha\.com\/vi\/activities\/updates\/okx\//);
  assert.equal(m.buttons[0][0].text, "Đọc phần giải thích");
  assert.ok(listingMessage(campaignItem, partners[0], "en"), "other languages unchanged");
});

test("Telegram senders share one neutral list and one campaign-title pattern", () => {
  assert.deepEqual(FEED_NEUTRAL, NEUTRAL_CTA_LOCALE_LIST);
  assert.equal(FEED_CAMPAIGN_TITLE.source, CAMPAIGN_TITLE.source);
  assert.equal(listingMessage({ ...listingItem, title: "OKX Futures Challenge: share 100,000 USDT" }, partners[0], "vi"), null);
});

test("neutral locale list matches the site policy (pilot-01-prototype/src/data/locale-policy.js)", async (t) => {
  const policy = new URL("../../pilot-01-prototype/src/data/locale-policy.js", import.meta.url);
  let site;
  try { readFileSync(policy); site = await import(policy.href); } catch (e) { if (e.code === "ENOENT") return t.skip("site locale-policy.js not in this tree"); throw e; }
  assert.deepEqual([...NEUTRAL_CTA_LOCALE_LIST].sort(), [...site.NEUTRAL_CTA_LOCALE_LIST].sort());
  for (const l of ["ru", "vi", "vi-VN", "zh-Hant", "zh-TW", "zh-HK", "ar", "ur", "uk", "en", "zh", "tr", "id", "es", "pt", "zh-Hans", "ruby", ""]) {
    assert.equal(isNeutralCtaLocale(l), site.isNeutralCtaLocale(l), l);
  }
});
