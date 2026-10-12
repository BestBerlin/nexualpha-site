// Alert texts in the eight /alerts languages (2026-10-11). One rendered message per language per message type
// against the shared fixture; zh and en are pinned byte for byte to fixtures/zh-en-baseline.json, which was rendered
// with the zh/en-only sender before this change.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ARTICLE_LOCALE, LANGS, LOCALE_PATH, articleLink, digestMessage, eventMessage, fmt, listingMessage, msgLang, partnerButtons, readMore, sitePath } from "./alert-sender.mjs";
import { articles, campaignItem, campaigns, listingItem, mk, partners } from "./fixtures/alert-fixture.mjs";

const baseline = JSON.parse(readFileSync(new URL("./fixtures/zh-en-baseline.json", import.meta.url), "utf8"));
const NEW_LANGS = ["ru", "tr", "vi", "id", "es", "pt"];
const EVENT_TYPES = ["liquidation-spike", "both-sides-liquidated", "sharp-move"];
// Intl separates numbers from units with no-break spaces (U+00A0 / U+202F), which Telegram renders as spaces and
// which keep "120 млн $" on one line; comparisons below read them as plain spaces.
const plain = (s) => String(s).replace(/[\u00A0\u202F]/g, " ");
const noLeaks = (text, where) => {
  assert.doesNotMatch(text, /\{\w+\}|\$\{|undefined|null|NaN|\[object/, `${where} leaks a placeholder`);
};

// Expected per-language anchors: heading of the liquidation alert, a word from the disclosure, the read-more label.
const EXPECT = {
  ru: { head: "💥 Всплеск ликвидаций", both: "⚔️ Ликвидированы и лонги, и шорты", move: "⚡ Резкое движение", disclosure: "Партнёрские ссылки", lowerBound: "нижняя оценка", readMore: "Подробнее →", digest: "Ежедневная сводка NexuAlpha", today: "Сегодня на NexuAlpha", campaigns: "Акции бирж", getAlerts: "🔔 Получать оповещения", funding: "📊 Ставки финансирования", signUp: "Регистрация на OKX", listing: "Листинг", campaign: "Акция", notice: "Официальное объявление", usd1h: "120 млн $", pct: "-2,1 %" },
  tr: { head: "💥 Likidasyon patlaması", both: "⚔️ Long ve short pozisyonlar birlikte likide edildi", move: "⚡ Sert hareket", disclosure: "Partner bağlantıları", lowerBound: "alt sınırdır", readMore: "Devamını oku →", digest: "NexuAlpha günlük özet", today: "Bugün NexuAlpha'da", campaigns: "Borsa kampanyaları", getAlerts: "🔔 Uyarı al", funding: "📊 Fonlama oranları", signUp: "OKX hesabı aç", listing: "Listeleme", campaign: "Kampanya", notice: "Resmi duyuru", usd1h: "$120 Mn", pct: "-%2,1" },
  vi: { head: "💥 Thanh lý tăng vọt", both: "⚔️ Cả long và short đều bị thanh lý", move: "⚡ Biến động mạnh", disclosure: "Liên kết đối tác", lowerBound: "mức tối thiểu", readMore: "Xem chi tiết →", digest: "Bản tin hằng ngày NexuAlpha", today: "Hôm nay trên NexuAlpha", campaigns: "Sự kiện sàn giao dịch", getAlerts: "🔔 Nhận cảnh báo", funding: "📊 Phí funding", signUp: "Đăng ký OKX", listing: "Niêm yết", campaign: "Sự kiện", notice: "Thông báo chính thức", usd1h: "120 Tr US$", pct: "-2,1%" },
  id: { head: "💥 Lonjakan likuidasi", both: "⚔️ Long dan short sama-sama terlikuidasi", move: "⚡ Pergerakan tajam", disclosure: "Tautan partner", lowerBound: "batas bawah", readMore: "Baca selengkapnya →", digest: "Ringkasan harian NexuAlpha", today: "Hari ini di NexuAlpha", campaigns: "Kampanye bursa", getAlerts: "🔔 Dapatkan notifikasi", funding: "📊 Funding rate", signUp: "Daftar di OKX", listing: "Listing", campaign: "Kampanye", notice: "Pengumuman resmi", usd1h: "US$120 jt", pct: "-2,1%" },
  es: { head: "💥 Pico de liquidaciones", both: "⚔️ Largos y cortos liquidados a la vez", move: "⚡ Movimiento brusco", disclosure: "Los enlaces de partners", lowerBound: "mínimo estimado", readMore: "Leer más →", digest: "Resumen diario de NexuAlpha", today: "Hoy en NexuAlpha", campaigns: "Campañas de exchanges", getAlerts: "🔔 Recibir alertas", funding: "📊 Tasas de financiación", signUp: "Regístrate en OKX", listing: "Listado", campaign: "Campaña", notice: "Aviso oficial", usd1h: "120 M US$", pct: "-2,1 %" },
  pt: { head: "💥 Pico de liquidações", both: "⚔️ Longs e shorts liquidados ao mesmo tempo", move: "⚡ Movimento brusco", disclosure: "Links de parceiros", lowerBound: "estimativa mínima", readMore: "Saiba mais →", digest: "Resumo diário NexuAlpha", today: "Hoje na NexuAlpha", campaigns: "Campanhas das corretoras", getAlerts: "🔔 Receber alertas", funding: "📊 Taxas de funding", signUp: "Cadastre-se na OKX", listing: "Listagem", campaign: "Campanha", notice: "Aviso oficial", usd1h: "US$ 120 mi", pct: "-2,1%" },
};

test("zh and en render byte-identically to the pre-i18n sender (fixtures/zh-en-baseline.json)", () => {
  for (const lang of ["zh", "en"]) {
    for (const type of EVENT_TYPES) assert.equal(eventMessage({ type }, mk, lang), baseline[lang].events[type], `${lang} ${type}`);
    assert.deepEqual(digestMessage(mk, partners, articles, campaigns, lang), baseline[lang].digest, `${lang} digest`);
    assert.deepEqual(listingMessage(listingItem, partners[0], lang), baseline[lang].listing, `${lang} listing`);
    assert.deepEqual(listingMessage(campaignItem, partners[1], lang), baseline[lang].campaign, `${lang} campaign`);
    assert.equal(readMore(lang, "/liquidations", "tg-alert"), baseline[lang].readMore);
  }
});

test("msgLang returns the subscriber's language when supported and falls back to en", () => {
  assert.deepEqual(LANGS, ["zh", "en", "ru", "tr", "vi", "id", "es", "pt"]);
  for (const lang of LANGS) assert.equal(msgLang({ lang }), lang);
  assert.equal(msgLang({ lang: "de" }), "en");
  assert.equal(msgLang({ lang: "pt-BR" }), "en", "state.lang stores short codes only");
  assert.equal(msgLang({}), "en");
  assert.equal(msgLang(undefined), "en");
});

test("unknown languages render English, never a blank or half-rendered message", () => {
  assert.equal(eventMessage({ type: "sharp-move" }, mk, "de"), eventMessage({ type: "sharp-move" }, mk, "en"));
  assert.equal(sitePath("de", "/liquidations", "tg-alert"), "https://nexualpha.com/liquidations?src=tg-alert");
  assert.deepEqual(partnerButtons(partners, "xx", "tg-x"), partnerButtons(partners, "en", "tg-x"));
});

test("site backlinks use the locale path of each language", () => {
  assert.deepEqual(LOCALE_PATH, { zh: "/zh-hans", en: "", ru: "/ru", tr: "/tr", vi: "/vi", id: "/id-id", es: "/es", pt: "/pt-br" });
  assert.equal(sitePath("ru", "/liquidations", "tg-alert"), "https://nexualpha.com/ru/liquidations?src=tg-alert");
  assert.equal(sitePath("id", "/activities", "tg-listing"), "https://nexualpha.com/id-id/activities?src=tg-listing");
  assert.equal(sitePath("pt", "/news", "tg-digest"), "https://nexualpha.com/pt-br/news?src=tg-digest");
  assert.equal(readMore("tr", "/liquidations", "tg-alert"), '<a href="https://nexualpha.com/tr/liquidations?src=tg-alert">Devamını oku →</a>');
});

for (const lang of NEW_LANGS) {
  const e = EXPECT[lang];
  const path = LOCALE_PATH[lang];

  test(`${lang}: event alerts carry the heading, numbers, locale backlink, no footer`, () => {
    const spike = eventMessage({ type: "liquidation-spike" }, mk, lang);
    noLeaks(spike, `${lang} liquidation-spike`);
    assert.match(spike, new RegExp(`^<b>${e.head.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</b>\n`));
    assert.ok(plain(spike).includes(e.usd1h), `${lang} formats 120e6 USD as ${e.usd1h}: ${spike.split("\n")[1]}`);
    assert.ok(spike.includes(`BTC ${fmt.num(lang, 100000)}`), `${lang} BTC price is locale-formatted`);
    assert.ok(plain(spike).includes(e.pct), `${lang} formats -2.1% as ${e.pct}`);
    assert.ok(spike.includes("BTCUSDT"), "largest liquidation line present");
    assert.ok(!spike.includes(e.disclosure) && !spike.includes("<i>"), `${lang} event alert carries no commission/data footer (owner 2026-10-12)`);
    const link = `<a href="https://nexualpha.com${path}/liquidations?src=tg-alert">${e.readMore}</a>`;
    assert.ok(spike.endsWith(link), `${lang} backlink is the last line: ${spike}`);
    assert.ok(eventMessage({ type: "both-sides-liquidated" }, mk, lang).startsWith(`<b>${e.both}</b>`));
    assert.ok(eventMessage({ type: "sharp-move" }, mk, lang).startsWith(`<b>${e.move}</b>`));
    // all three event types end on the same backlink
    const tail = (t) => eventMessage({ type: t }, mk, lang).split("\n\n").pop();
    assert.equal(tail("both-sides-liquidated"), tail("liquidation-spike"));
    assert.equal(tail("sharp-move"), tail("liquidation-spike"));
  });

  test(`${lang}: daily digest has the sections, no footer, locale article links and tg-digest-${lang} buttons`, () => {
    const d = digestMessage(mk, partners, articles, campaigns, lang);
    noLeaks(d.text, `${lang} digest`);
    assert.ok(d.text.startsWith(`<b>🗞 ${e.digest}</b>\n\n`), d.text.split("\n")[0]);
    assert.ok(d.text.includes(`<b>${e.today}</b>`), "today-on-NexuAlpha header");
    assert.ok(d.text.includes(`<b>${e.campaigns}</b>`), "exchange campaigns header");
    assert.ok(d.text.includes("OKX: <a href=\"https://www.okx.com/help/campaign-1\">"), "campaign keeps the official URL");
    assert.ok(!d.text.includes(e.disclosure) && !d.text.includes("<i>"), "digest carries no footer");
    assert.ok(d.text.endsWith(`<a href="https://nexualpha.com${path}/news?src=tg-digest">${e.readMore}</a>`), "digest backlink");
    assert.ok(d.text.includes(`DOGE ${fmt.pct(lang, 12.3, true)}`), "movers are signed and locale-formatted");
    assert.ok(d.text.includes(`BTC ${fmt.num(lang, 100000)}  ${fmt.pct(lang, -4.5, true)}`), "majors row");
    // article 2 has no edition in this language -> English URL and title; article 1 only in ru/tr
    assert.ok(d.text.includes('<a href="https://nexualpha.com/news/funding-rates-explained">Funding rates explained</a>'), "no edition -> English URL");
    if (["ru", "tr"].includes(lang)) {
      assert.ok(d.text.includes(`<a href="https://nexualpha.com${path}/news/btc-liquidations-weekly">${articles[0].title[ARTICLE_LOCALE[lang]]}</a>`), `${lang} edition link`);
    } else {
      assert.ok(d.text.includes('<a href="https://nexualpha.com/news/btc-liquidations-weekly">BTC liquidations weekly</a>'), `${lang} falls back to English article`);
    }
    // Turkey (owner 2026-10-11): only SPK-"operating" partners (OKX, Binance, Bybit); the fixture has OKX of those.
    assert.deepEqual(d.buttons[0].map((b) => b.url), lang === "tr" ? [`https://nexualpha.com/go/okx?src=tg-digest-tr`] : [`https://nexualpha.com/go/okx?src=tg-digest-${lang}`, `https://nexualpha.com/go/bitget?src=tg-digest-${lang}`]);
    assert.equal(d.buttons[0][0].text, e.signUp);
    assert.deepEqual(d.buttons[1].map((b) => b.text), [e.getAlerts, e.funding]);
    assert.equal(d.buttons[1][1].url, `https://nexualpha.com${path}/rates`);
    for (const b of d.buttons.flat()) noLeaks(b.text, `${lang} button`);
  });

  test(`${lang}: listing and campaign DMs name the category and venue, no footer, keep /go buttons`, () => {
    const m = listingMessage(listingItem, partners[0], lang);
    noLeaks(m.text, `${lang} listing`);
    assert.ok(m.text.startsWith(`<b>[${e.listing} · OKX] </b>OKX lists ABC (ABC/USDT) for spot trading\n\n`), m.text.split("\n")[0]);
    assert.ok(m.text.includes(`<a href="https://nexualpha.com${path}/activities?src=tg-listing">${e.readMore}</a>`), "listing backlink");
    assert.ok(!m.text.includes(e.disclosure) && !m.text.includes("<i>"), "listing carries no footer");
    assert.deepEqual(m.buttons[0].map((b) => b.text), [e.notice, e.signUp]);
    assert.deepEqual(m.buttons[0].map((b) => b.url), ["https://www.okx.com/help/abc", `https://nexualpha.com/go/okx?src=tg-dm-listing-${lang}`]);
    const c = listingMessage(campaignItem, partners[1], lang);
    assert.ok(c.text.startsWith(`<b>[${e.campaign} · Bitget] </b>Bitget launchpool: stake BGB &amp; earn XYZ`), c.text.split("\n")[0]);
    assert.equal(c.buttons[0][1].url, `https://nexualpha.com/go/bitget?src=tg-dm-listing-${lang}`);
  });
}

test("Turkish percent sign leads the number; other locales follow their own conventions", () => {
  assert.equal(plain(fmt.pct("tr", 60)), "+%60");
  assert.equal(plain(fmt.pct("tr", -2.1)), "-%2,1");
  assert.equal(plain(fmt.pct("tr", 0)), "%0");
  assert.equal(plain(fmt.pct("ru", -4.5)), "-4,5 %");
  assert.equal(plain(fmt.pct("pt", 2.5, true)), "+2,5%");
  assert.equal(plain(fmt.pct("en", 2.5)), "2.5%");
  assert.equal(plain(fmt.pct("en", 2.5, true)), "+2.5%");
  assert.equal(plain(fmt.pct("zh", -4.5, true)), "-4.5%");
  assert.equal(plain(fmt.usd("en", 1.2e9)), "1.20B");
  assert.equal(plain(fmt.usd("ru", 1.2e9)), "1,2 млрд $");
  assert.equal(plain(fmt.usd("pt", 450e3)), "US$ 450 mil");
  assert.equal(plain(fmt.num("tr", 100000)), "100.000");
});

test("digest article links use the locale edition only when availableLocales lists it", () => {
  const a = { slug: "s", title: { en: "E", ru: "R", "pt-BR": "P", "zh-Hans": "Z" }, availableLocales: ["en", "ru"] };
  assert.equal(articleLink(a, "ru"), '• <a href="https://nexualpha.com/ru/news/s">R</a>');
  assert.equal(articleLink(a, "pt"), '• <a href="https://nexualpha.com/news/s">E</a>', "pt-BR title exists but the edition is not listed");
  assert.equal(articleLink(a, "zh"), '• <a href="https://nexualpha.com/news/s">E</a>');
  assert.equal(articleLink(a, "en"), '• <a href="https://nexualpha.com/news/s">E</a>');
  assert.equal(articleLink({ ...a, availableLocales: ["en", "pt-BR"] }, "pt"), '• <a href="https://nexualpha.com/pt-br/news/s">P</a>');
  // feeds without availableLocales: a title in that locale stands for an edition (pre-i18n behaviour for zh)
  assert.equal(articleLink({ slug: "s", title: { en: "E", "zh-Hans": "Z" } }, "zh"), '• <a href="https://nexualpha.com/zh-hans/news/s">Z</a>');
  assert.equal(articleLink({ slug: "s", title: { en: "E" } }, "tr"), '• <a href="https://nexualpha.com/news/s">E</a>');
  assert.equal(articleLink({ slug: "s", title: { en: "E", ru: "R" }, availableLocales: ["en"] }, "ru"), '• <a href="https://nexualpha.com/news/s">E</a>', "listed locales win over a stray title");
});

test("ALERT_CHANNELS maps one channel per known language and drops unknown or empty entries", async () => {
  const { parseChannels } = await import("./alert-sender.mjs");
  assert.deepEqual(parseChannels("zh:@NexuAlphaClub, en:@NexuAlphaGlobal,ru:@NexuAlphaRU,tr:-1003789577571,xx:@nope,vi:"), {
    zh: "@NexuAlphaClub", en: "@NexuAlphaGlobal", ru: "@NexuAlphaRU", tr: "-1003789577571",
  });
});


test("partner buttons: second row Bybit / Hyperliquid / Backpack; Turkey only SPK-operating partners; no rebate wording without a confirmed share", async () => {
  const { partnerButtons } = await import("./alert-sender.mjs");
  const P = [
    { slug: "okx", name: "OKX", featured: true, share: 0.4 }, { slug: "bitget", name: "Bitget", featured: true, share: 0.6 },
    { slug: "binance", name: "Binance", featured: true, share: 0.25 }, { slug: "bybit", name: "Bybit", share: null },
    { slug: "hyperliquid", name: "Hyperliquid", share: null }, { slug: "backpack", name: "Backpack", share: null },
  ];
  const slugs = (rows) => rows.slice(0, -1).map((r) => r.map((b) => b.url.match(/go\/([a-z]+)/)[1]));
  assert.deepEqual(slugs(partnerButtons(P, "en", "x")), [["okx", "bitget", "binance"], ["bybit", "hyperliquid", "backpack"]]);
  assert.deepEqual(slugs(partnerButtons(P, "tr", "x")), [["okx", "binance", "bybit"]]);
  const zh = partnerButtons(P, "zh", "x");
  assert.match(zh[0][0].text, /返佣/);
  assert.doesNotMatch(zh[1][0].text, /返佣/, "Bybit has no confirmed share");
});
