// Article page UI strings that still fell back to English (mobile-perf lane l10n sweep 2026-10-11), e.g. the
// "Read this first / Before you act on this market update" block in fr, de, it, ru, id and vi.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { NEWS_DETAIL_COPY_L10N, mergeNewsDetailCopy } from "../src/components/v3/news/news-detail-copy-l10n.js";

const UI_KEYS = [
  "back", "author", "published", "readTime", "minuteUnit", "partnerSectionTitle", "claimBtn", "nextStepTitle", "nextStepBody",
  "compareBtn", "verifiedDomain", "sourcesTitle", "openFullArticle", "closeFullArticle", "relatedTitle", "relatedBody",
  "nextDecisionEyebrow", "firstDecisionEyebrow", "firstDecisionTitle", "firstDecisionBody", "firstDecisionChecks",
  "sourceBodyTitle", "sourceBodyBody", "profileSuffix", "factbookSuffix", "comparePrefix", "topicSuffix", "methodologyLabel",
  "notFoundTitle", "notFoundBody", "loadingTitle", "loadingBody",
];
const EN = {
  firstDecisionTitle: "Before you act",
  firstDecisionEyebrow: "READ THIS FIRST",
  firstDecisionBody: "Use this article as a source-checked research starting point. Confirm the official domain, regional eligibility, product scope and account terms before acting.",
  compareBtn: "Open comparison",
  closeFullArticle: "Show less",
  relatedBody: "Continue with the internal profiles, comparisons and methodology that support the next decision.",
  nextStepTitle: "Continue with a venue decision",
  notFoundBody: "The requested research article does not exist or has been archived.",
  loadingBody: "Reading the verified article body and sources.",
};

test("fr, de, it, ru, id and vi carry every article UI string, none of them in English", () => {
  for (const locale of ["fr", "de", "it", "ru", "id", "vi"]) {
    const strings = NEWS_DETAIL_COPY_L10N[locale];
    assert.ok(strings, locale);
    for (const key of UI_KEYS) {
      const value = strings[key];
      assert.ok(value !== undefined && value !== "", `${locale}.${key}`);
      if (EN[key]) assert.notEqual(value, EN[key], `${locale}.${key} still English`);
    }
    assert.equal(strings.firstDecisionChecks.length, 3, `${locale}: three checks`);
    for (const check of strings.firstDecisionChecks) assert.ok(typeof check === "string" && check.length > 10, `${locale}: check`);
  }
});

test("locales that only missed the not-found / loading strings get them", () => {
  for (const locale of ["ja", "ko", "tr", "es", "pt-BR", "ar"]) {
    for (const key of ["notFoundBody", "loadingBody"]) {
      assert.ok(NEWS_DETAIL_COPY_L10N[locale]?.[key], `${locale}.${key}`);
      assert.notEqual(NEWS_DETAIL_COPY_L10N[locale][key], EN[key], `${locale}.${key}`);
    }
  }
  assert.match(NEWS_DETAIL_COPY_L10N.ar.loadingBody, /[؀-ۿ]/, "Arabic script");
});

test("merge fills only the strings a locale still inherits from English", () => {
  const en = { ...EN, back: "← Back to News & Reports", originalLanguageNotice: "English notice" };
  const copy = {
    en,
    fr: { ...en, originalLanguageNotice: "Avis en français" },
    ja: { ...en, firstDecisionTitle: "この市場アップデートで行動する前に" },
  };
  mergeNewsDetailCopy(copy);
  assert.equal(copy.fr.firstDecisionTitle, "Avant d’agir sur cette actualité de marché");
  assert.equal(copy.fr.back, NEWS_DETAIL_COPY_L10N.fr.back);
  assert.equal(copy.fr.originalLanguageNotice, "Avis en français", "inline strings win");
  assert.equal(copy.ja.firstDecisionTitle, "この市場アップデートで行動する前に", "inline translation kept");
  assert.equal(copy.ja.notFoundBody, NEWS_DETAIL_COPY_L10N.ja.notFoundBody, "missing string filled");
  assert.equal(copy.en.firstDecisionTitle, EN.firstDecisionTitle, "English untouched");
});

test("uncertain translations are marked for native review", () => {
  const source = readFileSync(new URL("../src/components/v3/news/news-detail-copy-l10n.js", import.meta.url), "utf8");
  for (const locale of ["ru", "id", "vi", "ar"]) {
    assert.match(source, new RegExp(`// l10n: needs native review\\n  ${locale}: \\{`), locale);
  }
});
