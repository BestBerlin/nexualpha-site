import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/components/v3/OnChainLiquidityBoard.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/components/v3/on-chain-liquidity-board.css", import.meta.url), "utf8");
const requiredLocales = ["zh-Hans", "zh-Hant", "ja", "ko", "tr", "es", "pt-BR", "fr", "de", "ar", "ru", "id", "vi", "it"];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function objectBlockForLocale(locale) {
  const key = locale.includes("-") ? `"${locale}"` : locale;
  const pattern = new RegExp(`\\n  ${escapeRegExp(key)}: \\{`);
  const match = pattern.exec(source);
  assert.ok(match, `${locale} copy block exists`);
  const start = match.index + match[0].lastIndexOf("{");
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`Could not close ${locale} copy block`);
}

test("onchain page exposes useful localized body copy for all priority locales", () => {
  assert.match(source, /data-onchain-localized-body=\{locale\}/);
  assert.match(source, /answerTitle/);
  assert.match(source, /checksTitle/);
  assert.match(source, /sourcesTitle/);
  assert.match(source, /boundary/);
  assert.match(source, /data-source-reviewed-at=\{SOURCE_REVIEWED_AT\}/);
  assert.match(source, /const LIQUIDITY_VENUES = \[\]/);

  for (const locale of requiredLocales) {
    const block = objectBlockForLocale(locale);
    for (const token of ["answerTitle", "answer", "checksTitle", "checks", "sourcesTitle", "sources", "boundary", "status", "cta"]) {
      assert.match(block, new RegExp(`${token}:`), `${locale} has ${token}`);
    }
    assert.match(block, /official|官方|公式|oficial|officielle|offiziell|공식|oficial|رسمية|resmî|официаль|resmi|chính thức|ufficial/i, `${locale} keeps official-source boundary`);
    assert.match(block, /verif|验证|驗證|検証|검증|doğrula|verificar|vérifier|prüf|تحقق|провер|verifikasi|xác minh|verifica/i, `${locale} keeps verification framing`);
  }
});

test("onchain localized body avoids English fallback and invented live data claims", () => {
  assert.doesNotMatch(source, /copy\.ar = \{ \.\.\.copy\.en/);
  assert.doesNotMatch(source, /copy\.ru = \{ \.\.\.copy\.en/);
  assert.doesNotMatch(source, /copy\.id = \{ \.\.\.copy\.en/);
  assert.doesNotMatch(source, /copy\.vi = \{ \.\.\.copy\.en/);
  assert.doesNotMatch(source, /copy\.it = \{ \.\.\.copy\.en/);

  for (const locale of requiredLocales) {
    const block = objectBlockForLocale(locale);
    assert.doesNotMatch(block, /What can this page answer now\?|Data status: unavailable|Open official page|Accepted source boundary|Check before funding or connecting a wallet/, `${locale} must not reuse English body fallback`);
    assert.doesNotMatch(block, /guaranteed|real-time ranking|live netflow available|safe to deposit|private commission|invite code|referral link/i, `${locale} must not invent live or commercial claims`);
  }
});

test("onchain body remains compact and readable", () => {
  assert.match(css, /\.onchain-board__answer\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1\.15fr\) minmax\(0,\s*1fr\) minmax\(0,\s*1fr\)/);
  assert.match(css, /@media \(max-width:\s*860px\) \{[\s\S]*\.onchain-board__answer\s*\{\s*grid-template-columns:\s*1fr;/);
  assert.match(css, /\.onchain-board__empty\s*\{[\s\S]*gap:\s*0\.35rem/);
  assert.match(source, /role="status"/);
  assert.match(source, /dir=\{\["ar", "ur"\]\.includes\(String\(locale \|\| ""\)\.split\("-"\)\[0\]\) \? "rtl" : undefined\}/);
});
