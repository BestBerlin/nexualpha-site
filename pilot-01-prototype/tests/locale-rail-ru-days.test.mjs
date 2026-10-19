import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sentencePack } from "../src/data/whale-sentences.js";

test("Russian whale sentences use correct plural of день", () => {
  const ru = sentencePack("ru").stealth;
  const line = (n) => ru.buyDays({ who: "Кит", days: n, coin: "X" });
  assert.ok(line(1).includes("1 день подряд"), line(1));
  assert.ok(line(3).includes("3 дня подряд"), line(3));
  assert.ok(line(5).includes("5 дней подряд"), line(5));
  assert.ok(line(11).includes("11 дней подряд"), line(11));
  assert.ok(line(21).includes("21 день подряд"), line(21));
  const src = readFileSync(new URL("../src/data/whale-sentences.js", import.meta.url), "utf8");
  assert.ok(!src.includes("${p.days} дня подряд"), "hard-coded genitive singular must not come back");
});

test("daily market data block has its own copy for every site locale", () => {
  const src = readFileSync(new URL("../src/components/v7/home7-below.jsx", import.meta.url), "utf8");
  const block = src.slice(src.indexOf("const DATA_RAIL_COPY"), src.indexOf("function DataRail"));
  for (const key of ["en", '"zh-Hans"', '"zh-Hant"', "es", '"pt-BR"', "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur"]) {
    assert.ok(new RegExp(`^  ${key}: \\{ title:`, "m").test(block), `missing ${key}`);
  }
});

test("non-Latin and diacritic-heavy home eyebrows drop mono letter-spacing", () => {
  const css = readFileSync(new URL("../src/styles/v7/home7.src.css", import.meta.url), "utf8");
  assert.match(css, /\.h7-ts-k:is\(:lang\(vi\), :lang\(ru\)[^)]*\)[\s\S]{0,80}letter-spacing:0/);
});
