import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

async function renderStaticPayload(source) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-r48-mobile-compression-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, source);
    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [
      entryPath,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundlePath}`,
      "--loader:.css=empty",
      "--log-level=warning",
    ], { cwd: projectRoot, stdio: "pipe" });
    return JSON.parse(execFileSync("node", [bundlePath], {
      cwd: projectRoot,
      encoding: "utf8",
      maxBuffer: 24 * 1024 * 1024,
    }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function countMatches(html, pattern) {
  return [...html.matchAll(pattern)].length;
}

function firstIndex(html, needle, context) {
  const index = html.indexOf(needle);
  assert.ok(index >= 0, `${context}: missing ${needle}`);
  return index;
}

function escapeAttribute(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

test("R48 news list SSR exposes one lead and complete day rows for the current page", async () => {
  const { html, slugs } = await renderStaticPayload(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { NewsListPage } from "../../src/components/v3/news/NewsListPage.jsx";
    const articles = Array.from({ length: 7 }, (_, index) => ({
      slug: \`r48-mobile-research-\${index + 1}\`,
      status: "PUBLISHED",
      category: index % 2 === 0 ? "research" : "rates",
      categoryName: { en: index % 2 === 0 ? "Research" : "Rates", "zh-Hans": index % 2 === 0 ? "研究" : "费率" },
      title: { en: \`R48 mobile research article \${index + 1}\`, "zh-Hans": \`R48 移动端文章 \${index + 1}\` },
      summary: { en: \`Reviewed summary for article \${index + 1}\`, "zh-Hans": \`第 \${index + 1} 篇审核摘要\` },
      publishedAt: new Date(Date.UTC(2026, 8, 10 + index)).toISOString(),
      readTime: "4 min",
      author: "NexuAlpha Research Desk",
      relatedVenues: index < 2 ? ["bybit", "bitget"] : [],
      availableLocales: ["en", "zh-Hans"],
    }));
    console.log(JSON.stringify({
      html: renderToStaticMarkup(React.createElement(NewsListPage, {
        locale: "en",
        market: "unknown",
        product: "unknown",
        initialArticles: articles,
      })),
      slugs: articles.map((article) => article.slug),
    }));
  `);

  assert.equal(countMatches(html, /data-news-lead=/g), 1, 'one prominent lead story');
  assert.equal(countMatches(html, /data-news-row=/g), slugs.length - 1, 'every remaining page article is a day row');
  assert.match(html, /id="news-article-grid" data-visible-count="7"/, 'whole page is visible without the retired four-card collapse');
  assert.doesNotMatch(html, /class="news-articles-toggle"/, 'no unnecessary show-more control for a complete short page');
  for (const slug of slugs) {
    assert.match(html, new RegExp(`/news/${slug}`), `research index keeps ${slug} linked in SSR`);
  }
});

test("R48 compare pages expose two hero choices before evidence without duplicating referral handoffs", async () => {
  const { html } = await renderStaticPayload(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { CompareDeepPage } from "../../src/components/v3/V3Pages.jsx";
    import { venueDatabase } from "../../src/data/venue-database.js";
    const copy = { common: { dimension: "Dimension" }, assetCapabilities: { none: "Pending source review" } };
    const selected = ["bybit", "bitget"];
    console.log(JSON.stringify({
      html: renderToStaticMarkup(React.createElement(CompareDeepPage, {
        copy,
        locale: "en",
        selected,
        venues: Object.values(venueDatabase),
        updates: [],
        market: "unknown",
        product: "unknown",
      })),
    }));
  `);

  const hero = firstIndex(html, 'class="v3-compare-hero-actions"', 'compare hero actions');
  const matrix = firstIndex(html, 'id="hardcore-matrix"', 'comparison evidence');
  assert.ok(hero < matrix, 'two actionable choices precede the full evidence matrix');
  assert.equal(countMatches(html, /data-cta-placement="compare-hero-signup"/g), 2);
  assert.equal(countMatches(html, /data-cta-placement="compare-sticky-registration"/g), 2);
  for (const slug of ['bitget', 'bybit']) {
    assert.equal(countMatches(html, new RegExp(`href="/go/${slug}\\?`, 'g')), 4, `${slug} retains exactly the reviewed hero, sticky, final-choice and verdict handoffs`);
  }

});

test("R48 mobile compression preserves full readable comparison copy and compact hero spacing", async () => {
  const css = await readFile(path.join(projectRoot, "src/components/v3/crossroads-compare.css"), "utf8");
  assert.match(css, /@media \(max-width:\s*680px\)[\s\S]*\.v3-compare-page \.v3-page-hero[\s\S]*padding-block:\s*0\.9rem 1rem;/);
  assert.match(css, /\.v3-versus-fit\s*\{[^}]*line-height:/);
  assert.doesNotMatch(css, /\.v3-compare-page \.v3-versus-fit\s*\{[^}]*-webkit-line-clamp:/, 'comparison conditions remain complete on mobile');
});
