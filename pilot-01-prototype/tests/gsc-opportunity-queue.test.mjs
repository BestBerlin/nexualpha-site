import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildConservativeHints,
  buildGscOpportunityQueue,
  buildOpportunityQueue,
  classifyIntent,
  classifyUrlPath,
  parseGscInput,
  parseSiteSearchInput,
  renderMarkdown,
} from "../scripts/gsc-opportunity-queue.mjs";

test("missing GSC input stays unknown instead of reporting zero demand", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-gsc-missing-"));
  try {
    const result = await buildGscOpportunityQueue({
      input: path.join(dir, "missing.csv"),
      output: path.join(dir, "queue.json"),
      markdown: path.join(dir, "queue.md"),
    });

    assert.equal(result.report.status, "INPUT_MISSING");
    assert.equal(result.report.totals.inputRows, null);
    assert.equal(result.report.totals.rankedRows, null);
    assert.deepEqual(result.report.queue, []);
    const markdown = await readFile(result.markdown, "utf8");
    assert.match(markdown, /Search demand: unknown/);
    assert.doesNotMatch(markdown, /Input rows: 0/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("CSV exports are scored by impressions, position, CTR gap and business intent", () => {
  const csv = [
    "Page,Query,Clicks,Impressions,CTR,Position",
    "https://nexualpha.com/compare/bybit-vs-bitget,bybit vs bitget fees,0,120,0%,12.4",
    "https://nexualpha.com/news/tokenized-treasuries-structure-access-risks,tokenized treasury,1,80,1.25%,24",
    "https://nexualpha.com/br,pix binance referral code,0,40,0%,8",
  ].join("\n");

  const rows = parseGscInput(csv, "gsc.csv");
  const report = buildOpportunityQueue(rows, { top: 10, minImpressions: 1 });

  assert.equal(report.status, "QUEUE_READY");
  assert.equal(report.totals.inputRows, 3);
  assert.equal(report.queue[0].page, "/compare/bybit-vs-bitget");
  assert.equal(report.queue[0].urlClass, "comparison");
  assert.equal(report.queue[0].granularity, "query-page");
  assert.equal(report.queue[0].status, "RANKED_QUERY_PAGE_FROM_GSC_EXPORT");
  assert.deepEqual(report.queue[0].intent, ["comparison", "cost_or_payment", "venue"]);
  assert.equal(report.queue[0].recommendedAction, "add_answer_block_table_faq_and_internal_links");
  assert.equal(report.queue.find((row) => row.page === "/br").market, "BR");
  assert.equal(report.queue.find((row) => row.page === "/br").urlClass, "regional-decision");
  assert.ok(report.queue[0].opportunityScore > report.queue[1].opportunityScore);
});

test("URL-level page query country device rows expose actionable opportunity types", () => {
  const csv = [
    "Page,Query,Country,Device,Clicks,Impressions,CTR,Position",
    "https://nexualpha.com/br,bitget pix fees,BR,MOBILE,0,240,0.4%,9.8",
    "https://nexualpha.com/compare/binance-vs-okx,binance vs okx,US,DESKTOP,7,90,7.7%,4.2",
  ].join("\n");

  const report = buildOpportunityQueue(parseGscInput(csv, "gsc-country-device.csv"), { top: 10, minImpressions: 1 });
  const row = report.queue.find((candidate) => candidate.page === "/br");
  const markdown = renderMarkdown(report);

  assert.equal(row.granularity, "query-page-country-device");
  assert.equal(row.country, "BR");
  assert.equal(row.device, "MOBILE");
  assert.ok(row.opportunityTypes.includes("HIGH_EXPOSURE_LOW_CTR"));
  assert.ok(row.opportunityTypes.includes("NEAR_TOP_LOW_CLICK"));
  assert.equal(row.internalSearch.status, "UNKNOWN");
  assert.equal(report.inputCompleteness.internalSearch.status, "INPUT_MISSING");
  assert.match(report.inputCompleteness.internalSearch.boundary, /unknown, not zero/i);
  assert.match(markdown, /Onsite-search status: INPUT_MISSING/);
  assert.match(markdown, /query-page-country-device/);
});

test("onsite-search input flags strong internal demand only when a real input row matches", () => {
  const gscCsv = [
    "Page,Query,Country,Device,Clicks,Impressions,CTR,Position",
    "https://nexualpha.com/br,bitget pix fees,BR,MOBILE,0,80,0%,14",
    "https://nexualpha.com/exchanges/hyperliquid,hyperliquid fees,US,DESKTOP,3,70,4.2%,8",
  ].join("\n");
  const siteSearchCsv = [
    "Page,Query,Searches",
    "https://nexualpha.com/br,bitget pix fees,22",
  ].join("\n");

  const report = buildOpportunityQueue(parseGscInput(gscCsv, "gsc.csv"), {
    siteSearchRows: parseSiteSearchInput(siteSearchCsv, "site-search.csv"),
    top: 10,
  });
  const strong = report.queue.find((row) => row.page === "/br");
  const unmatched = report.queue.find((row) => row.page === "/exchanges/hyperliquid");

  assert.equal(report.inputCompleteness.internalSearch.status, "READY");
  assert.equal(report.totals.siteSearchRows, 1);
  assert.equal(strong.internalSearch.status, "STRONG_SEARCH_WEAK_GSC");
  assert.equal(strong.internalSearch.searches, 22);
  assert.equal(strong.internalSearch.match.matchType, "page_query");
  assert.ok(strong.opportunityTypes.includes("STRONG_INTERNAL_SEARCH_WEAK_GSC"));
  assert.equal(strong.recommendedAction, "align_page_answer_with_internal_search_intent");
  assert.equal(unmatched.internalSearch.status, "NO_MATCH");
});

test("ranked rows include AEO/GEO content briefs without making conversion claims", () => {
  const csv = [
    "Page,Query,Country,Device,Clicks,Impressions,CTR,Position",
    "https://nexualpha.com/compare/bybit-vs-bitget,bybit vs bitget fees,US,DESKTOP,0,120,0%,12.4",
    "https://nexualpha.com/br,bitget pix referral code,BR,MOBILE,0,64,0%,9.8",
  ].join("\n");

  const report = buildOpportunityQueue(parseGscInput(csv, "gsc.csv"), { top: 10 });
  const compare = report.queue.find((row) => row.page === "/compare/bybit-vs-bitget");
  const regional = report.queue.find((row) => row.page === "/br");
  const markdown = renderMarkdown(report);

  assert.equal(compare.contentBrief.searchIntent, "bybit vs bitget fees");
  for (const section of ["direct_answer", "comparison_table", "fee_or_funding_table", "official_source_check", "source_dates_and_limits", "next_step_internal_links"]) {
    assert.ok(compare.contentBrief.requiredSections.includes(section), section);
  }
  assert.ok(compare.contentBrief.schemaCandidates.includes("FAQPage"));
  assert.ok(compare.contentBrief.geoChecklist.includes("Use source dates beside fee, funding or payment claims."));
  assert.match(compare.contentBrief.boundary, /does not prove registration/i);

  assert.ok(regional.contentBrief.requiredSections.includes("regional_eligibility_check"));
  assert.ok(regional.contentBrief.aeoChecklist.includes("Answer the observed query in the first screen with a neutral, source-bound summary."));
  assert.ok(regional.contentBrief.geoChecklist.includes("State market availability and eligibility limits before any signup language."));
  assert.ok(regional.contentBrief.commercialChecklist.includes("Keep referral or registration claims fail-closed until destination, terms and disclosure are verified."));

  assert.match(markdown, /## Content Briefs/);
  assert.match(markdown, /bybit vs bitget fees/);
  assert.match(markdown, /direct_answer, comparison_table, fee_or_funding_table/);
  assert.match(markdown, /Commercial boundary/);
  assert.doesNotMatch(markdown, /conversion proven|registration proven/i);
});

test("JSON GSC rows keep partial metrics blocked and do not coerce missing CTR to zero", () => {
  const json = JSON.stringify({
    rows: [
      { keys: ["hyperliquid fees", "https://nexualpha.com/exchanges/hyperliquid"], clicks: 0, impressions: 24, ctr: 0, position: 18.2 },
      { keys: ["uniswap testnet", "https://nexualpha.com/exchanges/uniswap"], clicks: 0, impressions: 9, position: 30.1 },
    ],
  });

  const report = buildOpportunityQueue(parseGscInput(json, "gsc.json"));

  assert.equal(report.queue.length, 1);
  assert.equal(report.queue[0].page, "/exchanges/hyperliquid");
  assert.equal(report.queue[0].urlClass, "venue-profile");
  assert.equal(report.queue[0].ctr, 0);
  assert.equal(report.blocked.length, 1);
  assert.equal(report.blocked[0].page, "/exchanges/uniswap");
  assert.deepEqual(report.blocked[0].missingFields, ["ctr"]);
  assert.equal(report.blocked[0].opportunityScore, null);
  assert.equal(renderMarkdown(report).includes("uniswap testnet"), true);
});

test("page-level GSC snapshots rank pages but keep query-page demand blocked", () => {
  const json = JSON.stringify({
    source: "Google Search Console visible page table",
    rows: [
      { page: "https://nexualpha.com/exchanges/hyperliquid", clicks: 0, impressions: 24, ctr: "0%", position: 52.5 },
      { page: "https://nexualpha.com/news/tokenized-treasuries-structure-access-risks", clicks: 0, impressions: 13, ctr: "0%", position: 37 },
    ],
  });

  const report = buildOpportunityQueue(parseGscInput(json, "visible-pages.json"));
  const markdown = renderMarkdown(report);

  assert.equal(report.status, "QUEUE_READY");
  assert.equal(report.totals.pageOnlyRows, 2);
  assert.equal(report.totals.queryPageRows, 0);
  assert.equal(report.queue[0].granularity, "page");
  assert.equal(report.queue[0].status, "RANKED_PAGE_LEVEL_FROM_GSC_EXPORT");
  assert.equal(report.inputCompleteness.status, "PAGE_LEVEL_ONLY");
  assert.match(report.inputCompleteness.blocker, /page and query together/i);
  assert.equal(report.queue[0].page, "/exchanges/hyperliquid");
  assert.match(markdown, /Query-page blocker:/);
});

test("separate page-only and query-only rows produce conservative planning hints without query-page claims", () => {
  const csv = [
    "Page,Query,Clicks,Impressions,CTR,Position",
    "https://nexualpha.com/exchanges/hyperliquid,,0,24,0%,52.5",
    "https://nexualpha.com/news/tokenized-treasuries-structure-access-risks,,0,13,0%,37",
    "https://nexualpha.com/compare/bybit-vs-bitget,,0,6,0%,50.2",
    ",hyperliquid fees,0,15,0%,63.3",
    ",tokenized treasuries,0,2,0%,81",
    ",bitget vs bybit stocks,0,2,0%,70",
  ].join("\n");

  const report = buildOpportunityQueue(parseGscInput(csv, "mixed-gsc.csv"));
  const markdown = renderMarkdown(report);

  assert.equal(report.inputCompleteness.status, "PAGE_LEVEL_ONLY");
  assert.equal(report.totals.queryPageRows, 0);
  assert.ok(report.totals.conservativeHintRows >= 3);
  assert.match(report.inputCompleteness.hintBoundary, /planning aids/i);

  const byQuery = Object.fromEntries(report.conservativeHints.map((row) => [row.query, row]));
  assert.equal(byQuery["hyperliquid fees"].page, "/exchanges/hyperliquid");
  assert.equal(byQuery["tokenized treasuries"].page, "/topics/tokenized-treasuries");
  assert.equal(byQuery["tokenized treasuries"].recommendedOwnerPage, "/topics/tokenized-treasuries");
  assert.equal(byQuery["tokenized treasuries"].observedPage, "/news/tokenized-treasuries-structure-access-risks");
  assert.equal(byQuery["bitget vs bybit stocks"].page, "/compare/bybit-vs-bitget");
  assert.equal(byQuery["hyperliquid fees"].status, "CONSERVATIVE_HINT_NOT_QUERY_PAGE_EVIDENCE");
  assert.match(byQuery["hyperliquid fees"].evidenceBoundary, /does not prove Google paired/i);
  assert.match(markdown, /Conservative Hints/);
  assert.match(markdown, /not query-page evidence/i);
  assert.match(markdown, /\| \/exchanges\/hyperliquid \| \/exchanges\/hyperliquid \| venue-profile \| hyperliquid fees \|/);
  assert.match(markdown, /\| \/topics\/tokenized-treasuries \| \/news\/tokenized-treasuries-structure-access-risks \| topic-hub \| tokenized treasuries \|/);
});

test("conservative hint helper only pairs rows when separate query and page evidence share route tokens", () => {
  const hints = buildConservativeHints([
    { page: "/exchanges/hyperliquid", query: null, clicks: 0, impressions: 24, ctr: 0, position: 52.5 },
    { page: "/exchanges/uniswap", query: null, clicks: 0, impressions: 9, ctr: 0, position: 48.1 },
    { page: null, query: "hyperliquid funded account", clicks: 0, impressions: 6, ctr: 0, position: 60 },
    { page: null, query: "unrelated brand login", clicks: 0, impressions: 5, ctr: 0, position: 70 },
  ]);

  assert.equal(hints.length, 1);
  assert.equal(hints[0].page, "/exchanges/hyperliquid");
  assert.equal(hints[0].query, "hyperliquid funded account");
  assert.deepEqual(hints[0].overlapTokens, ["hyperliquid"]);
});

test("aggregate or query-only exports cannot become URL-level opportunity rows", () => {
  const csv = [
    "Query,Clicks,Impressions,CTR,Position",
    "crypto exchange comparison,0,90,0%,16",
    ",1,120,0.8%,9",
  ].join("\n");

  const report = buildOpportunityQueue(parseGscInput(csv, "aggregate.csv"));

  assert.equal(report.queue.length, 0);
  assert.equal(report.totals.queryOnlyRows, 1);
  assert.equal(report.totals.aggregateRows, 1);
  assert.equal(report.blocked.length, 2);
  assert.equal(report.blocked.every((row) => row.missingFields.includes("page")), true);
  assert.equal(report.blocked.every((row) => row.opportunityScore === null), true);
  assert.equal(renderMarkdown(report).includes("Aggregate/unknown rows: 1"), true);
});

test("URL path classifier mirrors the Week 1 ledger classes", () => {
  assert.equal(classifyUrlPath("/"), "home");
  assert.equal(classifyUrlPath("/compare/binance-vs-okx"), "comparison");
  assert.equal(classifyUrlPath("/exchanges/uniswap"), "venue-profile");
  assert.equal(classifyUrlPath("/news/stablecoin-routing"), "news-article");
  assert.equal(classifyUrlPath("/br/kyc-cpf"), "regional-decision");
  assert.equal(classifyUrlPath(null), "unknown");
});

test("expanded on-chain venue set is classified as venue intent", () => {
  for (const venue of ["aerodrome", "jupiter", "raydium", "pancakeswap", "gmx", "drift"]) {
    const result = classifyIntent({ page: `/exchanges/${venue}`, query: null });
    assert.ok(result.intent.includes("venue"), venue);
  }
});

test("CLI builder writes JSON and Markdown reports from a real CSV file", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-gsc-queue-"));
  try {
    const input = path.join(dir, "gsc.csv");
    const output = path.join(dir, "queue.json");
    const markdown = path.join(dir, "queue.md");
    await writeFile(input, "Page,Query,Clicks,Impressions,CTR,Position\n/br,binance pix fees,0,50,0%,14\n", "utf8");

    const result = await buildGscOpportunityQueue({ input, output, markdown, top: 5, minImpressions: 1 });
    assert.equal(result.report.status, "QUEUE_READY");
    assert.equal(JSON.parse(await readFile(output, "utf8")).queue[0].market, "BR");
    assert.match(await readFile(markdown, "utf8"), /binance pix fees/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
