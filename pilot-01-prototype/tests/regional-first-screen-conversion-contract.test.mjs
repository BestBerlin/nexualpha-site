import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const protectedFiles = {
  "src/data/partner-registry.js": "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a",
  "src/data/venue-database.js": "0ce124afbe9f4758ce9ec093c79372550ce2e2e90a7342aa05ecc8d3482e1d52",
  "src/data/public-cta.js": "675875240d5fbb05498284a37f90a14488d6ace73d19b102caeb5add9e33f8e3",
  "src/data/regional-cta.js": "a2542bb137b6b6ff123a0d3c6b3a01b09e1e3a785ee223e3b4e04a3fe8aab665",
};

function renderRegionalPages() {
  const dir = mkdtempSync(path.join(root, "tests/.tmp-regional-first-screen-"));
  try {
    const entry = path.join(dir, "entry.jsx");
    writeFileSync(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { RegionalMarketPreview } from "../../src/components/v3/international/RegionalMarketPreview.jsx";
      const cases = [["JP","ja"],["KR","ko"],["TR","tr"],["SG","en"],["HK","zh-Hant"],["MX","es"],["ID","id"]];
      console.log(JSON.stringify(Object.fromEntries(cases.map(([market, locale]) => [market, renderToStaticMarkup(<RegionalMarketPreview market={market} locale={locale} />)]))));
    `);
    execFileSync(path.join(root, "node_modules/.bin/esbuild"), [entry, "--bundle", "--platform=node", "--format=cjs", `--outfile=${dir}/bundle.cjs`, "--loader:.css=empty", "--log-level=error"]);
    return JSON.parse(execFileSync(process.execPath, [path.join(dir, "bundle.cjs")], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("regional owner pages put decision actions before shortlist and evidence while retaining SSR proof", () => {
  const pages = renderRegionalPages();
  for (const [market, html] of Object.entries(pages)) {
    const quick = html.indexOf("data-regional-quick-actions");
    const shortlist = html.indexOf("data-regional-shortlist=");
    const proof = html.indexOf("data-regional-proof-pack");
    assert.ok(quick >= 0, `${market}: quick actions`);
    assert.ok(shortlist > quick, `${market}: shortlist follows quick actions`);
    assert.ok(proof > shortlist, `${market}: proof stays after decision layer`);
    for (const placement of ["regional-first-screen-directory", "regional-first-screen-compare", "regional-first-screen-telegram"]) {
      const position = html.indexOf(`data-cta-placement=\"${placement}\"`);
      assert.ok(position > quick && position < shortlist, `${market}: ${placement} stays in first decision layer`);
    }
    const firstLayer = html.slice(quick, shortlist);
    assert.match(firstLayer, /data-regional-compare-mode="select-candidates"/, `${market}: missing regional pair is disclosed`);
    assert.doesNotMatch(firstLayer, /binance-vs-okx/, `${market}: local market intent is not silently routed to a global pair`);
    assert.match(firstLayer, /href="[^"]*\/exchanges[^"]*"[^>]*data-regional-compare-mode="select-candidates"/, `${market}: candidate selection opens the regional directory`);
    assert.match(firstLayer, /href="[^"]*\/telegram\?[^\"]*return=https%3A%2F%2Ft\.me%2FNexuAlphaAssistantBot[^\"]*"[^>]*data-cta-placement="regional-first-screen-telegram"/, `${market}: Telegram handoff stays onsite and wraps only the official Bot return`);
    assert.match(html, /https:\/\//, `${market}: official sources remain in SSR`);
    assert.match(html, /regional-market-preview__proof-pack/, `${market}: proof disclosure remains in SSR`);
    assert.match(html, /regional-market-preview__questions/, `${market}: AEO questions remain in SSR`);
  }
});

test("Japanese Korean and Turkish first-screen decision copy does not fall back to English", () => {
  const pages = renderRegionalPages();
  const blocked = /Review platform candidates|Compare before choosing|Keep market, product and account stage|Open guided handoff|Put fees, identity, funding and product scope/;
  assert.doesNotMatch(pages.JP.slice(0, pages.JP.indexOf("data-regional-shortlist=")), blocked);
  assert.doesNotMatch(pages.KR.slice(0, pages.KR.indexOf("data-regional-shortlist=")), blocked);
  assert.doesNotMatch(pages.TR.slice(0, pages.TR.indexOf("data-regional-shortlist=")), blocked);
  assert.match(pages.JP, /候補|比較/);
  assert.match(pages.KR, /후보|비교/);
  assert.match(pages.TR, /platformları|karşılaştırın/i);
});

test("regional conversion work keeps constitutional invitation registries byte-identical", () => {
  for (const [relativePath, expected] of Object.entries(protectedFiles)) {
    const source = readFileSync(path.join(root, relativePath));
    assert.equal(createHash("sha256").update(source).digest("hex"), expected, relativePath);
  }
});
