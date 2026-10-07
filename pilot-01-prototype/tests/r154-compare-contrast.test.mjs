import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((start) => Number.parseInt(value.slice(start, start + 2), 16));
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground, background) {
  const fg = luminance(foreground);
  const bg = luminance(background);
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}

function extractGradientHexes(block) {
  return [...block.matchAll(/#[0-9a-fA-F]{6}/g)].map((match) => match[0].toLowerCase());
}

function ruleBlock(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`, "m"));
  assert.ok(match, `${selector} rule should exist`);
  return match[1];
}

test("matrix CTA hover keeps existing layout, focus and route ownership while meeting AA contrast", async () => {
  const css = await read("src/components/v3/crossroads-compare.css");
  const growthCss = await read("src/components/v3/growth-conversion.css");
  const source = await read("src/components/v3/V3Pages.jsx");
  const normal = ruleBlock(css, ".v3-matrix-cta-btn");
  const hover = ruleBlock(css, ".v3-matrix-cta-btn:hover");

  assert.match(normal, /width:\s*100%;/);
  assert.match(normal, /max-width:\s*12rem;/);
  assert.match(normal, /color:\s*#ffffff;/i);
  assert.match(growthCss, /\.v3-matrix-cta-btn[\s\S]*?min-height:\s*44px;/, "shared growth CSS keeps the 44px touch target");
  assert.match(growthCss, /\.v3-matrix-cta-btn:focus-visible[\s\S]*?outline:\s*2px solid #8fb0ff;/, "focus-visible ring remains in shared growth CSS");
  assert.match(source, /href=\{`\/exchanges\/\$\{d\.slug\}\?\$\{directoryContextSearch\([\s\S]*?\)\}#registration-path`\}/, "matrix CTA keeps onsite registration-path href builder");
  assert.match(source, /data-cta-placement="compare-metric-matrix-detail"/);

  const endpoints = extractGradientHexes(hover);
  assert.ok(endpoints.length >= 2, "hover should keep a blue gradient");
  for (const endpoint of endpoints) {
    assert.ok(
      contrastRatio("#ffffff", endpoint) >= 4.5,
      `white matrix CTA text must be >=4.5:1 on hover endpoint ${endpoint}`,
    );
  }
});

function assertResearchPathPlusToken(block) {
  assert.match(block, /color:\s*var\(--blue-text\);/, "decorative plus must use the actual high-contrast blue text token");
  assert.doesNotMatch(block, /color:\s*var\(--blue\)/, "decorative plus should not use the low-contrast base blue on dark background");
  assert.doesNotMatch(block, /color:\s*#315ccf/i, "decorative plus should not regress to the measured low-contrast color");
  assert.match(block, /font-size:\s*22px;/, "existing glyph size stays unchanged");
  assert.match(block, /font-weight:\s*400;/, "existing glyph weight stays unchanged");
}

test("compare research path plus remains decorative and uses the exact high-contrast affordance token", async () => {
  const css = await read("src/styles/v3-layout-stability.css");
  const source = await read("src/components/v3/V3Pages.jsx");
  const block = ruleBlock(css, ".v3-compare-research-paths > summary b");

  assert.match(source, /<b aria-hidden="true">＋<\/b>/, "research path plus remains a decorative glyph, not new semantic copy");
  assertResearchPathPlusToken(block);
});

test("compare research path plus contrast guard fails for the old token or measured low-contrast color", async () => {
  const css = await read("src/styles/v3-layout-stability.css");
  const block = ruleBlock(css, ".v3-compare-research-paths > summary b");

  assert.throws(
    () => assertResearchPathPlusToken(block.replace("var(--blue-text)", "var(--blue)")),
    /high-contrast blue text token|low-contrast base blue/,
    "mutation back to the old base-blue token must fail the guard",
  );
  assert.throws(
    () => assertResearchPathPlusToken(block.replace("var(--blue-text)", "#315ccf")),
    /high-contrast blue text token|measured low-contrast color/,
    "mutation to the measured low-contrast color must fail the guard",
  );
});
