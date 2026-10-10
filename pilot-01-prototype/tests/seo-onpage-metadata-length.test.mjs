// Owner 2026-10-10 (GSC CTR work): home title/description carry the commercial search intent in all 15 locales, and no
// route ships a meta description beyond the snippet budget (160 characters; 80 for zh/ja/ko).
import test from "node:test";
import assert from "node:assert/strict";
import { routeMetadata, clampMetaDescription, metaDescriptionLimit } from "../worker/index.js";
import { computeRouteSeo, HOME_SEARCH_COPY } from "../src/data/seo-injection.js";
import { localizedPath } from "../src/data/locale-routing.js";

const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar"];
const ROUTES = ["/", "/exchanges", "/exchanges/okx", "/exchanges/bitget", "/exchanges/binance", "/compare/binance-vs-okx", "/news"];
const env = { ASSETS: { fetch: async () => new Response("missing", { status: 404 }) } };
const TRAILING_FRAGMENT = /[\s,;:，、；：\-–—(（]$/u;

test("meta description limit is 80 for zh/ja/ko and 160 elsewhere", () => {
  for (const locale of ["zh-Hans", "zh-Hant", "ja", "ko"]) assert.equal(metaDescriptionLimit(locale), 80, locale);
  for (const locale of ["en", "tr", "ru", "ar", "pt-BR", "vi"]) assert.equal(metaDescriptionLimit(locale), 160, locale);
});

test("clampMetaDescription cuts at a word or punctuation boundary without a trailing fragment", () => {
  const short = "Short description stays unchanged.";
  assert.equal(clampMetaDescription(short, "en"), short);
  const long = Array.from({ length: 40 }, (_, i) => `word${i}`).join(" ") + ", tail fragment that is cut";
  const clamped = clampMetaDescription(long, "en");
  assert.ok(clamped.length <= 160, `length ${clamped.length}`);
  assert.doesNotMatch(clamped, TRAILING_FRAGMENT);
  assert.ok(long.startsWith(clamped), "clamp is a prefix of the source");
  assert.ok(/word\d+$/.test(clamped), "ends on a whole word");
  const sentence = "First sentence ends here. " + "x".repeat(150);
  assert.equal(clampMetaDescription(sentence, "en"), "First sentence ends here.");
  const cjk = "第一句说明手续费与邀请码的核验方式。" + "第二句很长没有标点".repeat(12);
  const cjkClamped = clampMetaDescription(cjk, "zh-Hans");
  assert.ok(cjkClamped.length <= 80, `cjk length ${cjkClamped.length}`);
  assert.equal(cjkClamped, "第一句说明手续费与邀请码的核验方式。");
  assert.equal(clampMetaDescription("  spaced   out  ", "en"), "spaced out");
});

test("route metadata stays within the description budget for every locale and commercial route", async () => {
  for (const pathname of ROUTES) {
    for (const locale of LOCALES) {
      const url = new URL(`https://nexualpha.com${localizedPath(pathname, locale)}`);
      const metadata = await routeMetadata(url, env);
      assert.equal(metadata.status, 200, `${pathname} ${locale}`);
      assert.ok(metadata.description.length <= metaDescriptionLimit(locale), `${pathname} ${locale}: ${metadata.description.length} chars`);
      assert.doesNotMatch(metadata.description, TRAILING_FRAGMENT, `${pathname} ${locale}: trailing fragment`);
      assert.ok(metadata.title.length > 0, `${pathname} ${locale}: title`);
    }
  }
});

test("home title carries the commercial search intent per locale and stays within 65 characters", async () => {
  const expectations = {
    en: [/Referral Codes/, /Fee Rebates/],
    "zh-Hans": [/邀请码/, /返佣/],
    "zh-Hant": [/邀請碼/, /返傭/],
    ja: [/手数料/, /紹介コード/],
    ko: [/수수료/, /추천코드/],
    tr: [/komisyon iadesi/, /referans kodu/],
    es: [/referido/, /comisiones/],
    "pt-BR": [/indicação/, /cashback|taxas/],
    fr: [/parrainage/, /frais/],
    de: [/Empfehlungscodes/, /Gebührenrabatte/],
    it: [/referral/, /commissioni/],
    id: [/referral/, /biaya/],
    vi: [/giới thiệu/, /hoàn phí/],
    ru: [/Комиссии/, /OKX/],
    ar: [/رسوم/, /OKX/],
  };
  for (const locale of LOCALES) {
    const metadata = await routeMetadata(new URL(`https://nexualpha.com${localizedPath("/", locale)}`), env);
    assert.ok(metadata.title.length <= 65, `${locale}: ${metadata.title.length} chars`);
    for (const pattern of expectations[locale]) assert.match(metadata.title, pattern, `${locale} title`);
    assert.match(metadata.title, /NexuAlpha/, `${locale} brand`);
    // ja/ko keep an informational tone; ru/ar stay neutral like the referral-title policy
    if (["ja", "ko"].includes(locale)) assert.doesNotMatch(`${metadata.title} ${metadata.description}`, /登録して|会員登録|가입하세요|회원가입/);
    if (["ru", "ar"].includes(locale)) assert.doesNotMatch(metadata.title, /реферальн|промокод|إحالة/i);
    if (locale !== "ru" && locale !== "ar" && locale !== "tr") assert.match(metadata.description, /60\s?%/, `${locale} keeps the owner-confirmed "up to 60%" headline`);
    // the Worker mirror and the client router share one copy table
    const client = computeRouteSeo({ url: `https://nexualpha.com${localizedPath("/", locale)}`, locale });
    assert.equal(metadata.title, HOME_SEARCH_COPY[locale][0], `${locale} worker title`);
    assert.equal(client.title, HOME_SEARCH_COPY[locale][0], `${locale} client title`);
    assert.equal(client.description, HOME_SEARCH_COPY[locale][1], `${locale} client description`);
  }
});
