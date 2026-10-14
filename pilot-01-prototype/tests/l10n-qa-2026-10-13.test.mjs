// Native-speaker QA (2026-10-13): page bodies carry no "we earn commission" sentence (the footer and legal pages keep
// the disclosure), route meta descriptions carry no generic padding, converter amounts are formatted per currency,
// and the BTC→USD FAQ has no exchange-rate step.
import assert from "node:assert/strict";
import test from "node:test";
import { HERO_SAY } from "../src/components/v7/home7-hero-volume.js";
import { H7_COPY } from "../src/components/v7/home7-copy.js";
import { routeMetaDescription } from "../src/data/meta-description.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { converterFaq, converterCoin, formatFiatAmount } from "../src/data/converter.js";
import { CONVERTER_COPY } from "../src/data/converter-copy.js";
import { converterMeta } from "../src/data/converter-seo.js";
import { coinBySlug } from "../src/data/coins.js";
import { coinMeta } from "../src/data/coins-seo.js";
import { ownerRebateLine } from "../src/data/owner-rebate-line.js";

// "We receive a commission", "our commission is disclosed", "paid by the platform" in the QA locales.
const COMMISSION_CLAIMS = [
  /commission is disclosed|we (?:earn|receive|get) (?:a )?commission/i, /佣金公开披露|我们从交易所获得佣金|我們從交易所獲得佣金|佣金公開揭露/,
  /Nuestra comisión|Recibimos una comisión/, /Nossa comissão|Recebemos uma comissão/, /Notre commission|Nous percevons une commission|Versé par la plateforme/,
  /Unsere Provision|Wir erhalten von der Börse/, /紹介報酬は開示|紹介報酬を受け取り/, /커미션은 공개|커미션을 받으며/,
  /Komisyonumuz|komisyon alıyor/, /Komisi kami|Kami menerima komisi/, /Hoa hồng của chúng tôi|Chúng tôi nhận hoa hồng/,
];
const flatten = (value) => typeof value === "string" ? [value] : typeof value === "function" ? [(() => { try { return String(value("X", "Y")); } catch { return ""; } })()] : Array.isArray(value) ? value.flatMap(flatten) : value && typeof value === "object" ? Object.values(value).flatMap(flatten) : [];

test("home copy (both hero variants) has no commission claim in any locale", () => {
  for (const [locale, copy] of Object.entries(H7_COPY)) {
    const texts = flatten({ ...copy, foot: undefined });
    for (const re of COMMISSION_CLAIMS) for (const text of texts) assert.doesNotMatch(text, re, `${locale}: ${text}`);
  }
  for (const [locale, copy] of Object.entries(HERO_SAY)) for (const re of COMMISSION_CLAIMS) assert.doesNotMatch(Object.values(copy).join(" "), re, `${locale} hero sentence`);
});

test("offer-card rebate line shows the user benefit, not who pays", () => {
  for (const locale of ["en", "fr", "de", "es", "pt-BR", "ja", "ko", "vi", "id", "zh-Hans"]) {
    const line = ownerRebateLine("okx", locale, "OKX");
    assert.ok(line, locale);
    for (const re of COMMISSION_CLAIMS) assert.doesNotMatch(line, re, `${locale}: ${line}`);
    assert.doesNotMatch(line, /par la plateforme|pela própria corretora|durch die Börse|liquida la plataforma/, `${locale}: ${line}`);
  }
});

const BOILERPLATE = /Use this NexuAlpha page|用这一页了解|用這一頁了解|Nutzen Sie diese NexuAlpha-Seite|Usa esta página de NexuAlpha|Use esta página da NexuAlpha|Utilisez cette page NexuAlpha|このNexuAlphaページで|이 NexuAlpha 페이지에서|Bu NexuAlpha sayfası|Gunakan halaman NexuAlpha ini|Dùng trang NexuAlpha này|source boundary|页面只整理公开来源/;

test("route meta descriptions are served as written, without generic padding", () => {
  assert.equal(routeMetaDescription("T", "Convert BTC to USD.", "en"), "Convert BTC to USD.");
  const prefixes = { en: "", "zh-Hans": "/zh-hans", de: "/de", es: "/es", "pt-BR": "/pt-br", fr: "/fr", ja: "/ja", ko: "/ko", tr: "/tr", vi: "/vi", id: "/id-id" };
  const paths = ["/coins", "/coins/bitcoin", "/convert/btc-to-usd", "/convert/btc-to-eur", "/academy", "/academy/first-spot-trade", "/academy/can-i-buy-part-of-a-bitcoin", "/activities/bybit-stocks", "/activities/binance-october-gifts", "/rates", "/telegram"];
  for (const [locale, prefix] of Object.entries(prefixes)) for (const path of paths) {
    const seo = computeRouteSeo({ url: `https://nexualpha.com${prefix}${path}`, locale });
    if (typeof seo?.description !== "string") continue;
    assert.doesNotMatch(seo.description, BOILERPLATE, `${locale}${path}: ${seo.description}`);
  }
});

test("convert and coin meta descriptions are specific to the page", () => {
  const btc = converterCoin("btc");
  for (const locale of Object.keys(CONVERTER_COPY)) {
    const { description } = converterMeta(btc, "EUR", locale);
    assert.match(description, /BTC/, locale);
    assert.match(description, /EUR/, locale);
    assert.doesNotMatch(description, /\{(?:coin|symbol|fiat)\}/, locale);
  }
  assert.match(coinMeta(coinBySlug("bitcoin"), "en").description, /and 5 more exchanges/);
  assert.match(coinMeta(coinBySlug("bitcoin"), "de").description, /und 5 weiteren Börsen/);
  assert.match(coinMeta(coinBySlug("bitcoin"), "zh-Hans").description, /及另外5家交易所/);
});

test("fiat amounts use whole units for JPY/KRW/VND/IDR and cents elsewhere", () => {
  assert.equal(formatFiatAmount(13172339.614544, "ja", "JPY"), "13,172,340");
  assert.equal(formatFiatAmount(111611040.974752, "ko", "KRW"), "111,611,041");
  assert.equal(formatFiatAmount(74309.578992, "de", "EUR"), "74.309,58");
  assert.equal(formatFiatAmount(557786.907392, "zh-Hans", "CNY"), "557,786.91");
  assert.equal(formatFiatAmount(0.000123456, "en", "USD"), "0.0001235");
});

test("BTC→USD FAQ multiplies by the USD price only; other currencies keep the FX step", () => {
  const btc = converterCoin("btc");
  for (const locale of Object.keys(CONVERTER_COPY)) {
    const [usd] = converterFaq(btc, "USD", locale);
    const [eur] = converterFaq(btc, "EUR", locale);
    assert.notEqual(usd.answer, eur.answer, locale);
    assert.doesNotMatch(usd.answer, /\{(?:coin|symbol|fiat)\}/, locale);
  }
  const copy = CONVERTER_COPY.en;
  assert.ok(!("generic" in copy), "no 'no verified on-ramp' disclaimer");
  for (const locale of Object.keys(CONVERTER_COPY)) assert.doesNotMatch(Object.values(CONVERTER_COPY[locale].methods).join(" "), /bypass|never|nunca eludas|绕过|回避しないで/i, locale);
});
