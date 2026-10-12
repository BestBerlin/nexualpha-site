// Home initial JS budget (2026-10-12): the router reads small path helpers instead of the Brazil content and the news
// library, so those modules stay out of the browser entry's static closure.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BRAZIL_PAGES, getBrazilPage } from "../src/data/brazil-market.js";
import { BRAZIL_PAGE_PATHS, isBrazilPagePath } from "../src/data/brazil-page-paths.js";
import * as newsLibrary from "../src/data/news-library.js";
import * as newsListingPath from "../src/data/news-listing-path.js";

test("Brazil page path list matches BRAZIL_PAGES", () => {
  assert.deepEqual([...BRAZIL_PAGE_PATHS].sort(), BRAZIL_PAGES.map((page) => page.path).sort());
  for (const path of ["/br", "/br/pix", "/br/missing", "/news", "", undefined]) assert.equal(isBrazilPagePath(path), Boolean(getBrazilPage(path)), String(path));
});

test("news-library re-exports the listing path helpers unchanged", () => {
  for (const name of ["NEWS_CATEGORY_KEYS", "isNewsCategory", "parseNewsListingPath", "newsListingPath"]) assert.equal(newsLibrary[name], newsListingPath[name], name);
  assert.deepEqual(newsLibrary.parseNewsListingPath("/news/category/guide/page/1"), { category: "guide", page: 1, canonicalPath: "/news/category/guide", redirect: "/news/category/guide" });
  assert.equal(newsLibrary.parseNewsListingPath("/news/abc"), null);
});

test("the router does not import the Brazil content or the news library", async () => {
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(app, /from\s+"\.\/data\/(?:brazil-market|news-library|news-feed-client)\.js"/);
});
