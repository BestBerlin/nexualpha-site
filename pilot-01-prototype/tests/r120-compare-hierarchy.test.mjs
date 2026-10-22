import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const css = readFileSync(new URL("../src/components/v3/crossroads-compare.css", import.meta.url), "utf8");

const renderComparePages = async (cases) => {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-r120-compare-hierarchy-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { CompareDeepPage } from "../../src/components/v3/V3Pages.jsx";
      import { venueDatabase } from "../../src/data/venue-database.js";
      const copy = { common: { dimension: "Dimension" }, assetCapabilities: { none: "Pending source review" } };
      const venues = Object.values(venueDatabase);
      const cases = ${JSON.stringify(cases)};
      console.log(JSON.stringify(cases.map((item) => ({
        key: item.key,
        html: renderToStaticMarkup(React.createElement(CompareDeepPage, {
          copy,
          locale: item.locale || "en",
          selected: item.selected,
          venues,
          updates: [],
          market: "unknown",
          product: "unknown",
        })),
      }))));
    `);
    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [entryPath, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundlePath}`, "--loader:.css=empty", "--log-level=warning"], { cwd: projectRoot, stdio: "pipe" });
    return JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};

const indexOfOrThrow = (html, needle, label = needle) => {
  const index = html.indexOf(needle);
  assert.ok(index >= 0, `${label} must be present`);
  return index;
};

test("R120 direct-answer pair exposes matrix before repeated verdict chrome without changing invite hrefs", async () => {
  const [{ html }] = await renderComparePages([{ key: "binance-okx", selected: ["binance", "okx"] }]);

  const firstMatrixJump = indexOfOrThrow(html, 'href="#hardcore-matrix"', "early matrix jump");
  assert.doesNotMatch(html, /class="v3-compare-quick-actions/,'priority pair avoids duplicate quick choices');
  const finalChoice = indexOfOrThrow(html, 'id="compare-final-choice"');
  const support = indexOfOrThrow(html, 'id="compare-versus-card"');
  const matrix = indexOfOrThrow(html, 'id="hardcore-matrix"');
  const snapshot = indexOfOrThrow(html, 'id="compare-snapshot"');
  const secondaryVerdict = indexOfOrThrow(html, 'v3-compare-section-disclosure--secondary-verdict');
  const verdict = indexOfOrThrow(html, 'class="v2-section v3-compare-verdict"');

  assert.ok(firstMatrixJump < support, "matrix jump stays in the primary decision nav");
  assert.ok(firstMatrixJump < support, "matrix jump should appear before the supporting CTA/stat disclosure");
  assert.ok(finalChoice < support, "Final Call remains the primary choice before support details");
  assert.ok(matrix < snapshot, "matrix should move before snapshot/repeated summary blocks on direct-answer pair pages");
  assert.ok(matrix < verdict, "matrix should appear before repeated pre-registration verdict cards");
  assert.ok(secondaryVerdict < verdict, "repeated verdict content should be retained inside a secondary native details disclosure");

  assert.match(html, /data-cta-placement="compare-final-choice-registration"/);
  assert.match(html, /href="\/go\/okx\?src=compare-binance-vs-okx&amp;locale=en(?:&amp;[^\"]*)?"/);
  assert.doesNotMatch(html.slice(matrix, html.indexOf('class="v3-matrix-expand"')), /https:\/\/www\.bsmkweb\.cc\/join\?ref=11350287|https:\/\/www\.okx\.com\/join\/nexu888/, "matrix action remains onsite-first and does not duplicate protected external registration URLs");
});

test("R120 fallback and three-platform comparisons keep the old supporting disclosure behavior", async () => {
  const pages = await renderComparePages([
    { key: "three", selected: ["binance", "okx", "bitget"] },
    { key: "localized-fallback", locale: "it", selected: ["binance", "okx"] },
  ]);
  const three = pages.find((p) => p.key === "three").html;
  const fallback = pages.find((p) => p.key === "localized-fallback").html;

  assert.match(three.match(/<details\b[^>]*id="compare-versus-card"[^>]*>/)?.[0] || "", /\bopen(?:=|\s|>)/, "three-platform support disclosure stays open");
  assert.match(fallback.match(/<details\b[^>]*id="compare-versus-card"[^>]*>/)?.[0] || "", /\bopen(?:=|\s|>)/, "locale without direct answer keeps support disclosure open");
  assert.ok(indexOfOrThrow(fallback, 'class="v3-compare-decision-nav"') < indexOfOrThrow(fallback, 'id="compare-snapshot"'), "fallback keeps the standard nav before snapshot");
});

test("R120 compare CSS keeps mobile matrix access visible and scopes title compaction", () => {
  assert.doesNotMatch(css, /\.v3-compare-final-choice-card__actions > a\[data-cta-placement="compare-final-choice-matrix"\]\s*\{\s*display:\s*none;/, "mobile matrix action must not be hidden");
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.v3-compare-page \.v3-venue-hero h1 \{[\s\S]*font-size:\s*clamp\(1\.38rem, 7\.4vw, 2\.2rem\);[\s\S]*text-wrap:\s*balance;/, "mobile H1 compaction must stay scoped to compare pages");
  assert.match(css, /\.v3-compare-page \.v3-venue-hero > \.v3-compare-decision-nav/, "early decision nav spacing must be scoped to compare hero");
  assert.match(css, /\.v3-compare-section-disclosure--secondary-verdict:not\(\[open\]\) > \.v3-compare-verdict \{\s*display:\s*none;/, "secondary verdict details must not reserve height while closed");
  assert.match(css, /\.v3-compare-quick-actions__item \{[\s\S]*min-block-size:\s*48px;/, "mobile quick choices remain touchable");
});
