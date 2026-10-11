import assert from "node:assert/strict";
import test from "node:test";

import { homeCopy, homeHeroH1 } from "../src/content/home-copy.js";

const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"];
const emptyishPattern = /^\s*$/;
const forbiddenPromisePattern = /(?:profit|yield|guarantee|eligible|收益|资格|資格|保證|保证)/i;

test("home copy exposes complete research labels for every locale", () => {
  for (const locale of locales) {
    const copy = homeCopy(locale);

    for (const field of ["intro", "compareTitle", "compareIntro", "viewAll", "featured", "slogan", "researchLabel"]) {
      assert.equal(typeof copy[field], "string", `${locale}.${field} type`);
      assert.doesNotMatch(copy[field], emptyishPattern, `${locale}.${field} not empty`);
      assert.doesNotMatch(copy[field], forbiddenPromisePattern, `${locale}.${field} no implied outcome or eligibility promise`);
    }

    assert.equal(typeof homeHeroH1(locale), "string", `${locale}.heroH1 type`);
    assert.doesNotMatch(homeHeroH1(locale), emptyishPattern, `${locale}.heroH1 not empty`);
    assert.doesNotMatch(homeHeroH1(locale), forbiddenPromisePattern, `${locale}.heroH1 no implied outcome or eligibility promise`);

    assert.ok(Array.isArray(copy.compareDimensionLabels), `${locale}.compareDimensionLabels array`);
    assert.equal(copy.compareDimensionLabels.length, 3, `${locale}.compareDimensionLabels count`);
    for (const label of copy.compareDimensionLabels) {
      assert.equal(typeof label, "string", `${locale}.compareDimensionLabels item type`);
      assert.doesNotMatch(label, emptyishPattern, `${locale}.compareDimensionLabels item not empty`);
      assert.doesNotMatch(label, forbiddenPromisePattern, `${locale}.compareDimensionLabels no implied promise`);
    }
  }
});

test("home hero H1 is unique and concise for every homepage locale", () => {
  const headings = locales.map((locale) => [locale, homeHeroH1(locale)]);
  assert.equal(new Set(headings.map(([, heading]) => heading)).size, locales.length);
  for (const [locale, heading] of headings) {
    assert.ok(heading.length <= 62, `${locale}.heroH1 remains concise`);
  }
});

test("home copy has fixed brand slogan and research label for core locales", () => {
  assert.equal(homeCopy("en").slogan, "Published fee benchmarks, reserve sources & official exchange routes.");
  assert.equal(homeCopy("en").researchLabel, "Independent crypto platform research");
  assert.deepEqual(homeCopy("en").compareDimensionLabels, ["Products", "Fees", "Account access"]);

  assert.equal(homeCopy("zh-Hans").slogan, "公开费率核对 · 储备金来源 · 用户权益待核验 · 官方入口核验。");
  assert.equal(homeCopy("zh-Hans").researchLabel, "独立加密平台研究");
  assert.deepEqual(homeCopy("zh-Hans").compareDimensionLabels, ["产品", "费用", "使用条件"]);

  assert.equal(homeCopy("zh-Hant").slogan, "公開費率核對 · 儲備金來源 · 用戶權益待核驗 · 官方入口核驗。");
  assert.equal(homeCopy("zh-Hant").researchLabel, "獨立加密平台研究");
  assert.deepEqual(homeCopy("zh-Hant").compareDimensionLabels, ["產品", "費用", "使用條件"]);
});

test("Korean and Turkish home research labels are localized for high-intent entry points", () => {
  assert.equal(homeCopy("ko").researchLabel, "독립 암호화폐 플랫폼 리서치");
  assert.doesNotMatch(homeCopy("ko").researchLabel, /\bcrypto\b/i);
  assert.equal(homeCopy("tr").researchLabel, "Bağımsız kripto platform araştırması");
});

test("home copy falls back to English for new fields", () => {
  const fallback = homeCopy("unknown-locale");
  assert.equal(fallback.slogan, homeCopy("en").slogan);
  assert.equal(fallback.researchLabel, homeCopy("en").researchLabel);
  assert.deepEqual(fallback.compareDimensionLabels, homeCopy("en").compareDimensionLabels);
});
