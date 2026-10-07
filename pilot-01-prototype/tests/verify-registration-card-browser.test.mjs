import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const script = await readFile(new URL("../scripts/verify-registration-card.mjs", import.meta.url), "utf8");

test("registration-card browser gate tries cached browsers when system Chrome cannot launch", () => {
  assert.match(script, /async function browserCandidates\(\)/);
  assert.match(script, /puppeteer-chrome-for-testing/);
  assert.match(script, /playwright-chrome-for-testing/);
  assert.match(script, /puppeteer-headless-shell-single-process/);
});

test("registration-card browser gate records launch attempts in the evidence report", () => {
  assert.match(script, /async function launchBrowser\(\)/);
  assert.match(script, /attempts\.push/);
  assert.match(script, /const results = \{ base, browser: launch,/);
});

test("registration-card browser gate provides the context it expects on the CTA", () => {
  assert.match(script, /url\.searchParams\.set\("market", "BR"\)/);
  assert.match(script, /url\.searchParams\.set\("product", "spot"\)/);
  assert.match(script, /assert\.equal\(state\.primary\?\.growthMarket, "BR"/);
  assert.match(script, /assert\.equal\(state\.primary\?\.growthProduct, "spot"/);
});

test("registration-card browser gate pairs Brazil market checks with Brazil copy", () => {
  assert.match(script, /for \(const locale of \["pt-BR", "zh-Hans", "zh-Hant"\]\)/);
  assert.match(script, /Domínio oficial/);
});
