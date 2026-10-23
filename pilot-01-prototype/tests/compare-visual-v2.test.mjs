import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const code = buildSync({
  stdin: {
    contents: `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { CompareDeepPage } from "./src/components/v3/V3Pages.jsx";
      import { venueDatabase } from "./src/data/venue-database.js";
      import { FEE_SCALE } from "./src/components/v6/InnerLedger.jsx";
      import { feeFact } from "./src/data/exchange-facts.js";
      export const render = (selected, locale = "en") => renderToStaticMarkup(React.createElement(CompareDeepPage, {
        copy: { common: { dimension: "Dimension" }, assetCapabilities: { none: "Pending" } },
        selected, locale, venues: Object.values(venueDatabase), market: "unknown", product: "spot",
      }));
      export { FEE_SCALE, feeFact };
    `,
    resolveDir: root,
    loader: "jsx",
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  external: ["react", "react-dom/server"],
  loader: { ".css": "empty" },
  logLevel: "silent",
}).outputFiles[0].text;
const module = { exports: {} };
new Function("require", "module", "exports", code)(require, module, module.exports);
const { render, FEE_SCALE, feeFact } = module.exports;
const html = render(["binance", "okx"]);

const section = (source, id) => {
  const marker = source.indexOf(`id="${id}"`);
  assert.ok(marker >= 0, `${id} renders`);
  const start = source.lastIndexOf("<section", marker);
  const tags = /<\/?section\b[^>]*>/g;
  tags.lastIndex = start;
  let depth = 0;
  for (let match; (match = tags.exec(source));) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (!depth) return source.slice(start, tags.lastIndex);
  }
  throw new Error(`${id} must close`);
};

test("compare hero presents eager official logos and an honest fee gap before the answer and actions", () => {
  const hero = section(html, "compare-hero");
  assert.ok(hero.indexOf('class="r9-cmp"') < hero.indexOf('data-short-answer'), "the fee visual leads the answer");
  assert.ok(hero.indexOf('class="r9-cmp"') < hero.indexOf('class="v3-compare-hero-actions'), "the fee visual leads actions");
  const ids = [...hero.matchAll(/<p class="r9-cmp__id[^]*?<\/p>/g)].map(([mark]) => mark);
  assert.equal(ids.length, 2);
  for (const [index, slug] of ["binance", "okx"].entries()) {
    assert.ok(ids[index].includes(`data-brand-slug="${slug}"`));
    assert.match(ids[index], /loading="eager"/);
    assert.match(ids[index], /fetchPriority="high"/);
  }
  assert.match(hero, /r9-cmp__num/);
  assert.match(hero, /pp/);
});

test("matrix mirrors checked maker/taker bars on the global fee scale and uses no reserve-score bars", () => {
  const matrix = section(html, "hardcore-matrix");
  const barSets = [...matrix.matchAll(/data-compare-bars="(spot|futures)" data-compare-side="([ab])"/g)];
  assert.equal(barSets.length, 4);
  assert.deepEqual(barSets.map(([, metric, side]) => [metric, side]), [["spot", "a"], ["spot", "b"], ["futures", "a"], ["futures", "b"]]);
  for (const [slug, key] of [["binance", "spot"], ["okx", "spot"], ["binance", "perp"], ["okx", "perp"]]) {
    const fees = feeFact(slug, key);
    for (const value of [fees.maker, fees.taker]) {
      const expected = Math.max(0, Math.min(1, value / FEE_SCALE));
      const actual = [...matrix.matchAll(/--compare-w:([0-9.e+-]+)/g)].map(([, number]) => Number(number));
      assert.ok(actual.some((number) => Math.abs(number - expected) < 1e-10), `${slug} ${key}: checked fee controls the bar length`);
    }
  }
  assert.match(matrix, /data-compare-category="por"/);
  assert.doesNotMatch(matrix, /data-compare-bars="(?:por|kyc)"/);
  assert.doesNotMatch(matrix, /data-compare-bars="benefit"/, "pending benefits do not become quantities");
  assert.match(matrix, /data-cta-placement="compare-metric-matrix-detail"/);
});

test("unknown pair fees remain empty, while localized FAQ keeps native accordion controls", () => {
  const generic = render(["uniswap", "jupiter"], "ar");
  const hero = section(generic, "compare-hero");
  assert.match(hero, /r9-cmp__gap[^]*?data-none=""/);
  assert.doesNotMatch(hero, /class="r9-cmp__num[^]*?<small>pp<\/small>/);
  assert.doesNotMatch(section(generic, "hardcore-matrix"), /data-compare-bars=/);
  const faq = section(generic, "compare-faq");
  assert.match(faq, /<details class="v3-faq-item"/);
  assert.match(faq, /<summary class="v3-faq-summary">/);
  assert.match(faq, /class="v3-compare-faq-icon" aria-hidden="true"/);
  assert.match(faq, /aria-expanded="false"/);
  assert.match(faq, /class="v3-faq-item" hidden=""/);
});

test("compare visuals stay in the route stylesheet with reduced-motion and constrained mobile logo dimensions", () => {
  const css = readFileSync(new URL("../src/styles/v9/compare9.src.css", import.meta.url), "utf8");
  assert.match(css, /^\/\* scope: #top\.v3-compare-page \*\//);
  assert.match(css, /inline-size:96px;block-size:96px/);
  assert.match(css, /inline-size:64px;block-size:64px/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.doesNotMatch(css, /animation-timeline|view\(\)/);
});
