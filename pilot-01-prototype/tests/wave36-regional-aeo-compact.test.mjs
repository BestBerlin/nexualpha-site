import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";
import { aeoQuestionsForMarket } from "../src/data/aeo-question-registry.js";
import { internationalSourcesFor } from "../src/data/international-source-registry.js";
import { regionalAeoCoverageSummary } from "../src/data/regional-preview-copy.js";

const component = await readFile(new URL("../src/components/v3/international/RegionalMarketPreview.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/components/v3/international/regional-market-preview.css", import.meta.url), "utf8");
const copy = await readFile(new URL("../src/data/regional-preview-copy.js", import.meta.url), "utf8");

const lockedInvitePatterns = [
  /11350287/,
  /nexu888/i,
  /partner\.bitget/i,
  /bsmkweb/i,
  /topzhjdgxcb/i,
  /LUCKX/,
  /CANDY007/,
  /INS898/,
  /1836370407/,
];

test("Wave36 regional AEO summary distinguishes indexed carriers from noindex previews", () => {
  for (const market of ["BR", "MX", "TW", "ID", "HK", "EU", "UK", "JP", "KR", "SG", "TR"]) {
    const summary = regionalAeoCoverageSummary({
      market,
      locale: market === "JP" ? "ja" : market === "KR" ? "ko" : market === "TR" ? "tr" : market === "TW" ? "zh-Hant" : market === "ID" ? "id" : "en",
      questions: aeoQuestionsForMarket(market),
      registry: internationalSourcesFor(market),
    });

    assert.equal(summary.statusTone, "indexed", `${market} should be treated as an indexed/public carrier lane`);
    assert.ok(summary.count >= 1, `${market} should have fixed registry questions`);
    assert.match(summary.publicationStatus, /Current public carrier|現在の公開ページ|현재 공개 경로|Geçerli yayın yolu|Página pública atual|Rute publik saat ini/);
    assert.match(summary.directAnswer, /official account|公式アカウント|공식 계정|resmî hesap|conta oficial|alur akun resmi/i);
    assert.ok(summary.knownItems.length >= 3);
    assert.ok(summary.unknownItems.length >= 3);
    assert.ok(summary.verificationSteps.length >= 4);
  }
});

test("Wave36 component adds compact registry answer without expanding page length by default", () => {
  assert.match(component, /aeoQuestionsForMarket/);
  assert.match(component, /regionalAeoCoverageSummary/);
  assert.match(component, /function RegionalAeoCompactAnswer/);
  assert.match(component, /data-regional-aeo-compact/);
  assert.match(component, /<details>/);
  assert.match(component, /<summary>/);
  assert.match(component, /data-aeo-extractable-answer/);
  assert.match(component, /<ol>/);
  assert.match(component, /<RegionalAeoCompactAnswer summary=\{aeoCoverageSummary\}/);
});

test("Wave36 CSS keeps the regional answer compact and mobile-collapsible", () => {
  assert.match(css, /regional-market-preview__aeo-compact/);
  assert.match(css, /regional-market-preview__aeo-compact summary/);
  assert.match(css, /touch-action: manipulation/);
  assert.match(css, /text-wrap: pretty/);
  assert.match(css, /regional-market-preview__aeo-sequence ol[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*regional-market-preview__aeo-sequence ol[\s\S]*grid-template-columns: 1fr/);
});

test("Wave36 scoped files do not contain protected invite codes or referral URLs", () => {
  const touched = [component, css, copy].join("\n");
  for (const pattern of lockedInvitePatterns) {
    assert.doesNotMatch(touched, pattern);
  }
});
