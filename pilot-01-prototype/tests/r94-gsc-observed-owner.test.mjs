import assert from "node:assert/strict";
import test from "node:test";
import { buildOpportunityQueue } from "../scripts/gsc-opportunity-queue.mjs";

const metrics = { clicks: 1, impressions: 80, ctr: 0.0125, position: 24 };
const newsPage = "/news/tokenized-treasuries-structure-access-risks";

test("R94 paired treasury demand preserves the observed news page and recommends the registered topic", () => {
  const report = buildOpportunityQueue([{ page: newsPage, query: "tokenized treasury", ...metrics }]);
  const row = report.queue[0];
  assert.equal(row.page, newsPage);
  assert.equal(row.observedPage, newsPage);
  assert.equal(row.recommendedOwnerPage, "/topics/tokenized-treasuries");
  assert.equal(row.urlClass, "news-article");
  for (const [key, value] of Object.entries(metrics)) assert.equal(row[key], value);
  assert.equal(row.status, "RANKED_QUERY_PAGE_FROM_GSC_EXPORT");
  assert.equal(report.conservativeHints.length, 0);
});

test("R94 paired and separate evidence use the same registered owner without moving metrics", () => {
  const report = buildOpportunityQueue([
    { page: newsPage, ...metrics },
    { query: "tokenized treasury", ...metrics },
  ]);
  const hint = report.conservativeHints[0];
  assert.equal(hint.page, "/topics/tokenized-treasuries");
  assert.equal(hint.observedPage, newsPage);
  assert.equal(hint.recommendedOwnerPage, "/topics/tokenized-treasuries");
  assert.equal(hint.status, "CONSERVATIVE_HINT_NOT_QUERY_PAGE_EVIDENCE");
  assert.equal(report.queue[0].page, newsPage);
});

test("R94 unregistered queries and unpaired observations do not acquire guessed owners", () => {
  for (const input of [
    { page: newsPage, query: "tokenized treasury imaginary product", ...metrics },
    { page: newsPage, query: "tokenized treasury redemption risk", ...metrics },
    { page: newsPage, ...metrics },
    { query: "tokenized treasury", ...metrics },
  ]) {
    const report = buildOpportunityQueue([input]);
    const row = report.queue[0] || report.blocked[0];
    assert.equal(row.recommendedOwnerPage, undefined);
    assert.equal(row.observedPage, undefined);
    assert.equal(row.page, input.page || null);
    assert.equal(report.conservativeHints.length, 0);
  }
});

test("R94 known owner does not fill missing metrics or redirect onsite-search evidence", () => {
  const report = buildOpportunityQueue([
    { page: newsPage, query: "tokenized treasury", ...metrics, ctr: null },
  ], {
    siteSearchRows: [{ page: newsPage, query: "tokenized treasury", searches: 25, sourceRow: 1, status: "READY" }],
  });
  assert.equal(report.queue.length, 0);
  const row = report.blocked[0];
  assert.equal(row.observedPage, newsPage);
  assert.equal(row.recommendedOwnerPage, "/topics/tokenized-treasuries");
  assert.equal(row.ctr, null);
  assert.equal(row.opportunityScore, null);
  assert.deepEqual(row.missingFields, ["ctr"]);
  assert.equal(row.internalSearch.match.page, newsPage);
  assert.equal(row.internalSearch.match.matchType, "page_query");
});

test("R94 registered Hyperliquid and Uniswap paired rows keep their observed venues", () => {
  for (const [query, page] of [["hyperliquid fees", "/exchanges/hyperliquid"], ["uniswap testnet", "/exchanges/uniswap"]]) {
    const row = buildOpportunityQueue([{ query, page, ...metrics }]).queue[0];
    assert.equal(row.page, page);
    assert.equal(row.observedPage, page);
    assert.equal(row.recommendedOwnerPage, page);
    for (const [key, value] of Object.entries(metrics)) assert.equal(row[key], value);
  }
});
