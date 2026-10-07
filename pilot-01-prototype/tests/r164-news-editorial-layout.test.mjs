import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readText(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

function topLevelRule(css, selector) {
  const rule = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([\\s\\S]*?)\\}`, "m").exec(css);
  assert.ok(rule, `${selector} rule exists`);
  return rule[1];
}

function mediaBlocks(css, params) {
  const marker = `@media ${params}`;
  const blocks = [];
  let searchFrom = 0;
  while (true) {
    const start = css.indexOf(marker, searchFrom);
    if (start === -1) break;
    const open = css.indexOf("{", start);
    let depth = 0;
    for (let i = open; i < css.length; i++) {
      if (css[i] === "{") depth++;
      if (css[i] === "}") depth--;
      if (depth === 0) {
        blocks.push(css.slice(open + 1, i));
        searchFrom = i + 1;
        break;
      }
    }
  }
  assert.ok(blocks.length > 0, `${marker} exists`);
  return blocks.join("\n");
}

test("news first paint keeps four articles but no longer leaves the desktop grid in a 3+1 orphan state", async () => {
  const page = await readText("src/components/v3/news/NewsListPage.jsx");
  const css = await readText("src/components/v3/news/news-list-page.css");

  assert.match(page, /const NEWS_INITIAL_VISIBLE_COUNT = 4;/, "first paint remains four articles");
  assert.match(page, /<div className="news-grid" id="news-article-grid" data-visible-count=\{visibleArticles\.length\}>/, "grid exposes visible count for scoped layout");

  const baseGrid = topLevelRule(css, ".news-grid");
  assert.match(baseGrid, /grid-template-columns:\s*repeat\(3,\s*1fr\)\s*;/, "normal desktop grid remains three columns for expanded counts");
  assert.equal(4 % 3, 1, "four cards in the base three-column grid would leave one orphan card");

  const fourCardMedia = mediaBlocks(css, "(min-width: 641px)");
  assert.match(fourCardMedia, /\.news-grid\[data-visible-count="4"\]\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*;/, "four-card state is balanced as a 2x2 editorial grid above mobile");
  assert.doesNotMatch(fourCardMedia, /NEWS_INITIAL_VISIBLE_COUNT|article\.|href=|ref=|invite|partner/i, "layout fix does not touch content or commercial data");
});

test("news mobile layout and protected commercial registry remain unchanged", async () => {
  const css = await readText("src/components/v3/news/news-list-page.css");
  const page = await readText("src/components/v3/news/NewsListPage.jsx");
  const registry = await readText("src/data/partner-registry.js");

  const mobile = mediaBlocks(css, "(max-width: 640px)");
  assert.match(mobile, /\.news-grid\s*\{[\s\S]*grid-template-columns:\s*1fr\s*;/, "320/390 mobile remains one column for long localized copy");
  assert.match(mobile, /\.news-article-card\s*\{[\s\S]*padding:\s*0\.85rem;[\s\S]*contain-intrinsic-size:\s*0 240px;/, "existing mobile compression contract stays intact");
  assert.doesNotMatch(page, /NEWS_INITIAL_VISIBLE_COUNT = 6|NEWS_INITIAL_VISIBLE_COUNT = 3/, "article count is not changed to hide the layout issue");
  assert.equal(createHash("sha256").update(registry).digest("hex"), "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a", "partner registry SHA remains protected");
});
