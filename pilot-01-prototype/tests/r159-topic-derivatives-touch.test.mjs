import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const locales = ["en", "zh-Hans", "zh-Hant", "ja", "ko", "tr", "es", "pt-BR", "fr", "de", "ru", "ar", "id", "vi", "it"];

async function readText(relativePath) {
  return readFile(path.join(projectRoot, relativePath), "utf8");
}

function cssBlock(css, selector) {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `${selector} rule is present`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}\n", open);
  assert.notEqual(close, -1, `${selector} rule closes`);
  return css.slice(open + 1, close);
}

async function renderDerivatives(locale) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-r159-topic-touch-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { TopicGuidePage } from "../../src/components/v3/TopicGuidePage.jsx";
      const html = renderToStaticMarkup(React.createElement(TopicGuidePage, {
        slug: "derivatives",
        locale: ${JSON.stringify(locale)},
        market: "unknown",
        product: "perp",
        venues: [],
      }));
      console.log(html);
    `);
    execFileSync(path.join(projectRoot, "node_modules/.bin/esbuild"), [
      entryPath,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundlePath}`,
      "--loader:.css=empty",
      "--log-level=warning",
    ], { cwd: projectRoot, stdio: "pipe" });
    return execFileSync(process.execPath, [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("derivatives route touch selector is mounted by the topic page and the route exists in SSR", async () => {
  const page = await readText("src/components/v3/TopicGuidePage.jsx");
  assert.match(page, /import "\.\/topic-guide\.css";/, "TopicGuidePage loads the CSS module that owns the touch rule");
  assert.match(page, /<details className="topic-derivatives-route-detail" open=\{isSelected \|\| undefined\}[\s\S]*?onToggle=\{/, "derivatives routes use native details controls with selected-state opening and native toggle sync");

  const totals = { locales: 0, summaries: 0, bodies: 0, checks: 0 };
  for (const locale of locales) {
    const html = await renderDerivatives(locale);
    const details = html.match(/<details class="topic-derivatives-route-detail"[^>]*>/g) || [];
    assert.equal(details.length, 4, `${locale} renders all four native derivatives route controls`);
    const routeCards = [...html.matchAll(/<article\b[^>]*data-derivatives-route-id="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)];
    assert.deepEqual(routeCards.map((card) => card[1]), ['cex-account', 'wallet-perp-dex', 'specialist-options-perps', 'gmx-pool-route'], `${locale} preserves ordered original route identity`);
    for (const card of routeCards) {
      const summaries = [...card[2].matchAll(/<summary>([\s\S]*?)<\/summary>/g)].map((match) => match[1]);
      const bodies = [...card[2].matchAll(/<p>([\s\S]*?)<\/p>/g)].map((match) => match[1]);
      const checks = [...card[2].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((match) => match[1]);
      assert.equal(summaries.length, 1, `${locale}/${card[1]} one readable native summary`);
      assert.equal(bodies.length, 1, `${locale}/${card[1]} one complete original body`);
      assert.equal(checks.length, 3, `${locale}/${card[1]} three complete original checks`);
      for (const text of [...summaries, ...bodies, ...checks]) assert.ok(text.trim().length > 0, `${locale}/${card[1]} nonempty original text`);
      totals.summaries += summaries.length;
      totals.bodies += bodies.length;
      totals.checks += checks.length;
    }
    totals.locales += 1;

    assert.match(html, /data-testid="derivatives-decision-routes"/, `${locale} renders the route section`);
    assert.match(html, /href="(?:\/[a-z]{2}(?:-[a-z]{2,4})?)?\/compare\/binance-vs-okx\?market=unknown&amp;product=perp/, `${locale} keeps primary compare route hrefs`);
    assert.doesNotMatch(html, /<details class="topic-derivatives-route-detail"[^>]*open/, `${locale} keeps native route details closed by default`);
  }
  assert.deepEqual(totals, { locales: 15, summaries: 60, bodies: 60, checks: 180 }, "native summary touch checks execute across all original text records");
});

test("derivatives route summary has a 44px touch target and visible focus without hiding localized labels", async () => {
  const css = await readText("src/components/v3/topic-guide.css");
  const summaryRule = cssBlock(css, ".topic-derivatives-route-detail > summary");
  const focusRule = cssBlock(css, ".topic-derivatives-route-detail > summary:focus-visible");

  assert.match(summaryRule, /min-height:\s*44px\s*;/, "summary row meets the 44px touch target baseline");
  assert.match(summaryRule, /box-sizing:\s*border-box\s*;/, "summary keeps the 44px target including padding");
  assert.match(summaryRule, /padding-block:\s*8px\s*;/, "summary has vertical padding without replacing native details marker layout");
  assert.doesNotMatch(summaryRule, /display:\s*(flex|grid|block|inline-flex|inline-grid)/, "summary does not override native list-item marker display");
  assert.doesNotMatch(summaryRule, /align-items:/, "summary does not use flex alignment that can suppress native markers");
  assert.match(summaryRule, /overflow-wrap:\s*anywhere\s*;/, "long 15-locale labels may wrap instead of clipping");
  assert.doesNotMatch(summaryRule, /white-space:\s*nowrap|overflow:\s*hidden|text-overflow:\s*ellipsis|list-style:\s*none/, "labels are not hidden, ellipsized, forced into one line, or stripped of the native marker");
  assert.match(focusRule, /outline:\s*2px\s+solid\s+#7dd3fc\s*;/, "keyboard focus remains visible");
  assert.match(focusRule, /outline-offset:\s*3px\s*;/, "focus outline remains offset from the control");
});
