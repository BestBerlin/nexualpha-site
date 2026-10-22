// Stock-by-stock view of the tokenized-stocks hub and home strip (2026-10-22): every figure comes from the listing rows
// (no invented values), Türkiye never carries Bitget, sorting keeps missing values last, and the copy exists in every edition.
import assert from "node:assert/strict";
import test from "node:test";
import { TS_TICKERS } from "../src/data/tokenized-stocks-facts.js";
import { tsTickerRows, tsTickerSummary } from "../src/data/tokenized-stocks-rows.js";
import { tsMatrix, tsNewestListings, tsSortMatrix } from "../src/data/tokenized-stocks-matrix.js";
import { TS_COPY } from "../src/data/tokenized-stocks-copy.js";
import { TS_TEASER } from "../src/data/tokenized-stocks-teaser.js";

test("matrix figures are the listing rows' own values", () => {
  const rows = tsMatrix({ locale: "en" });
  assert.equal(rows.length, TS_TICKERS.length);
  for (const row of rows) {
    const listing = tsTickerRows(row.ticker, { locale: "en" });
    const sum = tsTickerSummary(listing);
    assert.equal(row.venues, new Set(listing.map((r) => r.exchange.slug)).size, row.ticker);
    assert.equal(row.maxLev, sum.maxLev, row.ticker);
    assert.equal(row.minTaker, sum.minTaker, row.ticker);
    for (const [slug, lanes] of Object.entries(row.by)) {
      for (const [lane, sym] of Object.entries(lanes)) {
        assert.ok(listing.some((r) => r.exchange.slug === slug && (lane === "spot" ? r.lane === "spot" : r.lane !== "spot") && r.symbol === sym), `${row.ticker} ${slug}:${lane}`);
      }
    }
    if (row.latest) assert.match(row.latest.date, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test("Türkiye: no Bitget in the matrix or the newest listings", () => {
  for (const row of tsMatrix({ locale: "tr" })) assert.ok(!row.by.bitget && row.latest?.slug !== "bitget", row.ticker);
  assert.ok(tsNewestListings({ locale: "tr", limit: 50 }).every((item) => item.slug !== "bitget"));
});

test("newest listings are sorted newest first", () => {
  const items = tsNewestListings({ locale: "en", limit: 20 });
  for (let i = 1; i < items.length; i += 1) assert.ok(items[i - 1].date >= items[i].date);
});

test("sorting keeps rows without a value at the bottom in both directions", () => {
  const rows = [{ ticker: "A", minTaker: 0.05 }, { ticker: "B", minTaker: null }, { ticker: "C", minTaker: 0.02 }];
  assert.deepEqual(tsSortMatrix(rows, "fee", "asc").map((r) => r.ticker), ["C", "A", "B"]);
  assert.deepEqual(tsSortMatrix(rows, "fee", "desc").map((r) => r.ticker), ["A", "C", "B"]);
});

test("stock-table and risk copy exist in every edition; the home strip gets its strings", () => {
  for (const [locale, t] of Object.entries(TS_COPY)) {
    assert.ok(t.mx?.h && t.mx.sort.includes("{col}") && t.mx.dataNote.includes("{time}"), locale);
    assert.equal(t.risk?.items?.length, 5, locale);
    assert.ok(TS_TEASER[locale]?.mx?.homeMore && TS_TEASER[locale]?.cta, locale);
  }
  assert.doesNotMatch(JSON.stringify(TS_COPY.tr.mx) + JSON.stringify(TS_COPY.tr.risk), /bitget|rToken/i);
});
