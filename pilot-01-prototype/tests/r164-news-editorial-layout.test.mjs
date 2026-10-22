import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import postcss from "postcss";

const readText = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("news listing uses shared page size and semantic day groups instead of the retired four-card grid", async () => {
  const page = await readText("src/components/v3/news/NewsListPage.jsx");
  assert.match(page, /const NEWS_INITIAL_VISIBLE_COUNT = NEWS_PAGE_SIZE;/);
  assert.match(page, /const NEWS_BATCH_SIZE = NEWS_PAGE_SIZE;/);
  assert.match(page, /className="news-grid news-days"[^>]*data-visible-count=\{visibleArticles\.length\}/);
  assert.match(page, /groupNewsByDay\(listRows\)\.map/);
  assert.match(page, /<section className="news-day"[^>]*aria-labelledby=\{headingId\}/);
  assert.match(page, /<ol className="news-day__list">/);
  assert.match(page, /<li key=\{article\.slug\} className="news-row"/);
  assert.match(page, /<h3 className="news-row__title"><a href=\{articleUrl\}/);
});

test("current editorial day layout remains responsive and exposes visible row keyboard focus", async () => {
  const css = await readText("src/components/v3/news/news-list-page.css");
  const ast = postcss.parse(css);
  const rules = [];
  ast.walkRules((rule) => rules.push(rule));
  const dayGrid = rules.filter((rule) => rule.selector.includes(".news-grid.news-days")).at(-1);
  assert.equal(dayGrid.nodes.find((node) => node.prop === "display")?.value, "block");
  const mobileRow = rules.find((rule) => rule.selector.startsWith("#top.news-page .news-row:not") && rule.parent.params === "(max-width: 640px)");
  assert.ok(mobileRow, "mobile has a scoped editorial-row layout");
  assert.equal(mobileRow.nodes.find((node) => node.prop === "grid-template-columns")?.value, "6ch minmax(0, 1fr)");
  const focus = rules.find((rule) => rule.selector.includes(".news-row:has(.news-row__title a:focus-visible)"));
  assert.equal(focus.nodes.find((node) => node.prop === "outline")?.value, "2px solid var(--ix-ac)");
  assert.match(css, /\.news-row__title a::after\s*\{[^}]*inset:\s*0/);
});
