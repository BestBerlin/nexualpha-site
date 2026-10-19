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

test("R48 news list SSR shows four cards while retaining indexable article links", async () => {
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

  assert.equal(countMatches(html, /class="news-article-card"/g), 4, "SSR renders four full article cards by default");
  assert.match(html, /id="news-article-grid" data-visible-count="4"/, "visible grid exposes the four-card mobile default");
  assert.match(html, /class="news-articles-toggle"[^>]*aria-expanded="false"/, "show-more control starts collapsed");
  assert.match(html, /id="news-research-index"[^>]*data-ssr-indexable="true"/, "research index declares the SSR indexability bridge");
  for (const slug of slugs) {
    assert.match(html, new RegExp(`/news/${slug}`), `research index keeps ${slug} linked in SSR`);
  }
});

test("R48 compare pages expose mobile quick choices before long comparison evidence without duplicating referrals", async () => {
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

  const quick = firstIndex(html, 'class="v3-compare-quick-actions"', "compare quick actions");
  const finalChoice = firstIndex(html, 'class="v3-compare-final-choice-card"', "compare final choice");
  const versus = firstIndex(html, 'id="compare-versus-card"', "compare versus");

  assert.ok(quick < finalChoice, "mobile quick CTA strip appears before final choice card");
  assert.ok(quick < versus, "mobile quick CTA strip appears before long versus evidence");
  assert.equal(countMatches(html, /data-cta-placement="compare-mobile-quick-choice"/g), 2, "quick strip keeps one onsite decision choice per compared venue");
  assert.equal(countMatches(html, /href="#compare-final-choice"/g), 2, "quick choices move to the existing final-choice card");
  assert.match(html, /data-cta-placement="compare-final-choice-registration"/, "existing final-choice registration CTA remains");
  assert.match(html, /data-cta-placement="compare-hero-versus"/, "existing versus CTA remains");

  assert.equal(countMatches(html, /href="https:\/\/partner\.bitget\.com\/bg\/C6PRAF"/g), 3, "Bitget referral route is not duplicated");
  assert.equal(countMatches(html, /href="https:\/\/www\.bybit\.com\/register\?affiliate_id=48553"/g), 3, "Bybit referral route is not duplicated");
});

test("R48 mobile compression CSS keeps the quick strip mobile-only and compacts dense compare blocks", async () => {
  const css = await readFile(path.join(projectRoot, "src/components/v3/crossroads-compare.css"), "utf8");
  assert.match(css, /\.v3-compare-quick-actions\s*{\s*display:\s*none;/, "quick actions are hidden outside the mobile breakpoint");
  assert.match(css, /@media \(max-width:\s*680px\)[\s\S]*\.v3-compare-quick-actions\s*{[\s\S]*display:\s*grid;/, "quick actions become visible on mobile");
  assert.match(css, /@media \(max-width:\s*680px\)[\s\S]*\.v3-compare-page \.v3-versus-fit[\s\S]*-webkit-line-clamp:\s*2;/, "versus fit copy is line-clamped on mobile");
  assert.match(css, /@media \(max-width:\s*680px\)[\s\S]*\.v3-compare-page \.v3-page-hero[\s\S]*padding-block:\s*0\.9rem 1rem;/, "compare hero vertical padding is compacted on mobile");
});
