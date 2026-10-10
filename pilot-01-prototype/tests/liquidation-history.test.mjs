// /liquidations "Last 30 days" (2026-10-11): feed reader, SVG chart geometry, facts in words, SSR with and without
// history, the collecting state and the Dataset temporalCoverage.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import worker, { routeMetadata } from "../worker/index.js";
import { DATA_PAGE_LOCALES, LIQUIDATIONS_PATH, compactMarketEvents, dataPageCopy, dataPageSchemas, dataPageTemporalCoverage, readHistory } from "../src/data/market-data-pages.js";
import { CHART_HEIGHT, CHART_WIDTH, historyChartModel, historyFacts, niceCeiling } from "../src/data/liquidation-history.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const historyFeed = JSON.parse(readFileSync(new URL("./fixtures/market-data/market-events.history.sample.json", import.meta.url), "utf8"));
const plainFeed = JSON.parse(readFileSync(new URL("./fixtures/market-data/market-events.sample.json", import.meta.url), "utf8"));
const shell = '<!doctype html><html lang="en"><head><title>Base</title><meta name="description" content="Base"></head><body><div id="root"></div></body></html>';
const assets = { async fetch(request) {
  return new URL(request.url).pathname === "/index.html" ? new Response(shell, { headers: { "content-type": "text/html" } }) : new Response("missing", { status: 404 });
} };
const oneDayFeed = { ...historyFeed, history: { ...historyFeed.history, daily: historyFeed.history.daily.slice(-1), days: 1 } };

test("readHistory normalizes the collector block, sorts days and flags the collecting state below two days", () => {
  const h = readHistory(historyFeed);
  assert.equal(h.since, "2026-09-11T00:05:00.000Z");
  assert.equal(h.daily.length, 30);
  assert.equal(h.days, 30);
  assert.equal(h.collecting, false);
  assert.equal(h.daily[29].day, "2026-10-10");
  assert.equal(h.daily[29].partial, true);
  assert.equal(h.daily[28].partial, false);
  assert.equal(h.hourly.length, 24);
  assert.equal(h.avgDailyUsd, historyFeed.history.avgDailyUsd);
  assert.deepEqual(h.records.largestDay, { day: "2026-09-23", totalUsd: historyFeed.history.records.largestDay.totalUsd, partial: false });
  assert.equal(h.records.todayRankInMonth, 10);
  assert.equal(h.records.daysInMonth, 10);
  assert.equal(readHistory(plainFeed), null, "older collector without a history block");
  assert.equal(readHistory({ history: { since: "nope" } }), null);
  const one = readHistory(oneDayFeed);
  assert.equal(one.collecting, true);
  const shuffled = readHistory({ history: { since: historyFeed.history.since, daily: [...historyFeed.history.daily].reverse() } });
  assert.equal(shuffled.daily[0].day, "2026-09-11");
  assert.equal(readHistory({ history: { since: historyFeed.history.since, daily: [{ day: "2026-10-01", longUsd: "7", shortUsd: 3 }] } }).daily[0].totalUsd, 10, "missing total is the sum of the sides");
  const compact = compactMarketEvents(historyFeed);
  assert.ok(compact.history && compact.history.daily.length === 30, "hydration payload carries the history block");
});

test("chart model: every bar and label is finite and inside the viewBox, longs sit on the baseline with shorts stacked", () => {
  const h = readHistory(historyFeed);
  const m = historyChartModel(h.daily);
  assert.equal(m.width, CHART_WIDTH);
  assert.equal(m.height, CHART_HEIGHT);
  assert.equal(m.bars.length, 30);
  assert.equal(m.max, niceCeiling(Math.max(...h.daily.map((d) => d.totalUsd))));
  for (const b of m.bars) {
    for (const v of [b.x, b.width, b.long.y, b.long.height, b.short.y, b.short.height]) assert.ok(Number.isFinite(v), `${b.day} ${JSON.stringify(b)}`);
    assert.ok(b.x >= m.plot.x && b.x + b.width <= m.plot.x + m.plot.width + 0.01, `${b.day} inside horizontally`);
    assert.ok(b.short.y >= m.plot.y - 0.01 && b.long.y + b.long.height <= m.plot.baseline + 0.01, `${b.day} inside vertically`);
    assert.ok(Math.abs(b.long.y + b.long.height - m.plot.baseline) < 0.01, "long segment starts at the baseline");
    assert.ok(Math.abs(b.short.y + b.short.height - b.long.y) < 0.01, "short segment sits on the long one");
    assert.ok(b.long.height + b.short.height <= m.plot.height + 0.01);
  }
  const tallest = m.bars.find((b) => b.day === "2026-09-23");
  assert.ok(tallest.long.height + tallest.short.height > m.plot.height * 0.8, "the largest day nearly fills the plot");
  assert.equal(m.bars[29].partial, true);
  assert.deepEqual(m.ticks.map((t) => t.label), ["0", "$25.0M", "$50.0M"]);
  assert.ok(m.xLabels.length >= 6 && m.xLabels.length <= 8, `x labels ${m.xLabels.length}`);
  assert.equal(m.xLabels[0].label, "11");
  assert.equal(m.xLabels[m.xLabels.length - 1].label, "10");
  for (const l of m.xLabels) assert.ok(l.x > 0 && l.x < m.width && l.y <= m.height);
  // degenerate inputs never produce NaN
  const empty = historyChartModel([]);
  assert.equal(empty.bars.length, 0);
  assert.ok(empty.ticks.every((t) => Number.isFinite(t.y)));
  const zero = historyChartModel([{ day: "2026-10-01", totalUsd: 0, longUsd: 0, shortUsd: 0 }, { day: "2026-10-02", totalUsd: NaN, longUsd: undefined, shortUsd: null }]);
  for (const b of zero.bars) for (const v of [b.x, b.width, b.long.y, b.long.height, b.short.y, b.short.height]) assert.ok(Number.isFinite(v));
  assert.equal(niceCeiling(41_600_000), 50_000_000);
  assert.equal(niceCeiling(2_100_000), 2_500_000);
  assert.equal(niceCeiling(0), 1);
  assert.ok(historyChartModel(Array.from({ length: 45 }, (_, i) => ({ day: `2026-08-${String((i % 28) + 1).padStart(2, "0")}`, totalUsd: 1, longUsd: 1, shortUsd: 0 }))).bars.length === 30, "never more than 30 bars");
});

test("facts in words exist in all 15 locales and name the numbers; near-average is ±5 %", () => {
  const h = readHistory(historyFeed);
  const facts = historyFacts(h, 6_114_135);
  assert.equal(facts.vsAverage.direction, "below");
  assert.equal(facts.vsAverage.pct, 50);
  assert.equal(facts.vsAverage.now, "$6.11M");
  assert.equal(facts.vsAverage.avg, "$12.2M");
  assert.deepEqual(facts.rank, { rank: 10, days: 10 });
  assert.equal(facts.today.day, "2026-10-10");
  assert.equal(historyFacts(h, h.avgDailyUsd * 1.04).vsAverage.direction, "near");
  assert.equal(historyFacts(h, h.avgDailyUsd * 1.3).vsAverage.direction, "above");
  assert.equal(historyFacts(h, h.avgDailyUsd * 1.3).vsAverage.pct, 30);
  assert.equal(historyFacts(readHistory(oneDayFeed), 1), null, "collecting → no facts");
  assert.equal(historyFacts(readHistory({ history: { since: h.since, daily: h.daily.slice(-3), records: {} } }), 1).rank, null, "no month rank without the records block");
  const english = dataPageCopy("en").liquidations;
  for (const locale of DATA_PAGE_LOCALES) {
    const page = dataPageCopy(locale).liquidations;
    for (const key of ["historyTitle", "historyLead", "historyChartLabel", "historyAvg", "historyToday", "historyLargest", "historyPartial", "historyAxis"]) {
      assert.equal(typeof page[key], "string", `${locale} ${key}`);
      assert.ok(page[key].length > 2, `${locale} ${key}`);
      if (locale !== "en") assert.notEqual(page[key], english[key], `${locale} ${key} is translated`);
    }
    const sentence = page.historyVsAvg(facts.vsAverage);
    assert.ok(sentence.includes("$6.11M") && sentence.includes("$12.2M") && sentence.includes("50"), `${locale}: ${sentence}`);
    const near = page.historyVsAvg({ ...facts.vsAverage, direction: "near" });
    assert.ok(!/\b50\b/.test(near), `${locale}: near-average sentence carries no percentage: ${near}`);
    const rank = page.historyRank(3, 11);
    assert.ok(rank.includes("3") && rank.includes("11"), `${locale}: ${rank}`);
    assert.ok(page.historyCollecting("2026-10-11").includes("2026-10-11"), locale);
    assert.ok(page.historyDays(30).includes("30"), locale);
    for (const key of ["embedTitle", "embedIntro", "embedIframe", "embedScript", "copy", "copied", "embedTerms", "poweredBy", "embedUpdated"]) {
      assert.equal(typeof dataPageCopy(locale).common[key], "string", `${locale} common.${key}`);
    }
  }
});

async function renderLiquidations(feedJson, locales) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-liq-history-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { LiquidationsPage } from "../../src/components/data/LiquidationsPage.jsx";
      const feed = ${feedJson};
      const out = {};
      for (const locale of ${JSON.stringify(locales)}) out[locale] = renderToStaticMarkup(React.createElement(LiquidationsPage, { locale, initialFeed: feed }));
      console.log(JSON.stringify(out));
    `);
    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [entryPath, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundlePath}`, "--loader:.css=empty", "--log-level=warning"], { cwd: projectRoot, stdio: "pipe" });
    return JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("SSR: the history section renders the chart and facts from the feed; without history it is absent; one day shows the collecting state", async () => {
  const withHistory = await renderLiquidations(JSON.stringify(historyFeed), ["en", "ar", "ja"]);
  const en = withHistory.en;
  assert.match(en, /<section class="nxd-history v2-shell" id="history"[^>]*data-state="ready"/);
  assert.match(en, /<h2 id="nxd-history-h">Last 30 days<\/h2>/);
  assert.match(en, /The last 24 hours \(\$6\.11M\) are 50% below the 30-day daily average \(\$12\.2M\)\./);
  assert.match(en, /Today ranks 10 of 10 days this month/);
  const svg = en.match(/<svg class="nxd-chart nxd-chart--wide"[\s\S]*?<\/svg>/)[0];
  const compact = en.match(/<svg class="nxd-chart nxd-chart--compact"[\s\S]*?<\/svg>/)[0];
  assert.match(compact, /viewBox="0 0 360 200"/, "phone variant of the same chart");
  assert.equal((compact.match(/<g class="nxd-chart__bar/g) || []).length, 30);
  assert.ok(!/NaN|undefined|Infinity/.test(compact));
  for (const [, x, y, w, h] of compact.matchAll(/<rect class="nxd-chart__(?:long|short)" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
    assert.ok(Number(x) >= 0 && Number(x) + Number(w) <= 360 && Number(y) >= 0 && Number(y) + Number(h) <= 200, "compact bar inside its viewBox");
  }
  assert.match(svg, /viewBox="0 0 640 220"/);
  assert.match(svg, /role="img" aria-label="Daily liquidation totals, last 30 days"/);
  assert.match(svg, /<title>Daily liquidation totals, last 30 days<\/title>/);
  assert.ok(!/NaN|undefined|Infinity/.test(svg), "no NaN in the SVG");
  const rects = [...svg.matchAll(/<rect class="nxd-chart__(long|short)" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)];
  assert.ok(rects.length >= 58, `stacked rects: ${rects.length}`);
  for (const [, , x, y, w, h] of rects) {
    assert.ok(Number(x) >= 0 && Number(x) + Number(w) <= 640, "bar inside viewBox horizontally");
    assert.ok(Number(y) >= 0 && Number(y) + Number(h) <= 220, "bar inside viewBox vertically");
  }
  assert.equal((svg.match(/class="nxd-chart__bar nxd-chart__bar--partial"/g) || []).length, 1, "today is marked partial");
  assert.equal((en.match(/class="nxd-chart__bar nxd-chart__bar--partial"/g) || []).length, 2, "one partial bar per variant");
  assert.match(svg, /<text x="48" y="106" text-anchor="end">\$25\.0M<\/text>/, "labelled y axis");
  assert.match(svg, /<text class="nxd-chart__x" x="[\d.]+" y="212" text-anchor="middle">11<\/text>/, "labelled x axis");
  assert.match(en, /<dt>30-day average<\/dt><dd>\$12\.2M<\/dd>/);
  assert.match(en, /<dt>Today so far<\/dt><dd>\$5\.81M<\/dd>/);
  assert.match(en, /<dt>Largest day in the window<\/dt><dd>\$41\.6M <small>2026-09-23<\/small>/);
  assert.match(en, /<time dateTime="2026-09-11T00:05:00.000Z">2026-09-11<\/time> <small>30 days of history<\/small>/);
  assert.match(en, /bar covers only the hours collected so far \(UTC\)/);
  assert.ok(en.indexOf('id="history"') < en.indexOf("news-tg-alerts"), "history sits before the tail (alerts, explainer, sign-up card)");
  // RTL: copy follows the page direction, the chart stays LTR with identical numbers
  assert.match(withHistory.ar, /<main[^>]*dir="rtl"/);
  assert.match(withHistory.ar, /<div class="nxd-history__chart" dir="ltr"><svg class="nxd-chart nxd-chart--wide"[^>]*dir="ltr"/);
  assert.ok(withHistory.ar.includes("$12.2M") && withHistory.ar.includes("آخر 30 يومًا"));
  assert.match(withHistory.ja, /<h2 id="nxd-history-h">過去30日<\/h2>/);
  // embed block on the page: collapsed <details>, both snippets, copy buttons
  assert.match(en, /<details class="nxd-embed v2-shell" data-rv="1" data-testid="embed-this-liquidations"><summary><h2>Embed this on your site<\/h2><\/summary>/);
  assert.ok(!/<details class="nxd-embed[^>]*\sopen/.test(en), "collapsed by default");
  assert.ok(en.includes("&lt;iframe src=&quot;https://nexualpha.com/embed/liquidations?locale=en&amp;theme=dark&quot;"), "iframe snippet");
  assert.ok(en.includes("&lt;script src=&quot;https://nexualpha.com/embed/liquidations.js&quot; data-locale=&quot;en&quot; data-theme=&quot;dark&quot;"), "script snippet");
  assert.equal((en.match(/class="nxd-embed__copy"/g) || []).length, 2);
  assert.match(en, /Free to embed\. Keep the attribution link/);

  const without = await renderLiquidations(JSON.stringify(plainFeed), ["en"]);
  assert.ok(!without.en.includes('data-testid="liquidation-history"'), "no history block → no section, nothing invented");
  assert.ok(without.en.includes("$6.11M"), "live numbers still render");
  assert.match(without.en, /data-testid="embed-this-liquidations"/, "embed block does not depend on history");

  const oneDay = await renderLiquidations(JSON.stringify(oneDayFeed), ["en", "de"]);
  assert.match(oneDay.en, /data-testid="liquidation-history" data-state="collecting"/);
  assert.match(oneDay.en, /History is being collected since 2026-09-11\. The 30-day chart appears once two full days exist\./);
  assert.ok(!oneDay.en.includes("nxd-chart"), "no chart from a single bar");
  assert.match(oneDay.de, /Die Historie wird seit dem 2026-09-11 gesammelt/);

  const noFeed = await renderLiquidations("null", ["en"]);
  assert.match(noFeed.en, /data-testid="data-unavailable"/);
  assert.ok(!noFeed.en.includes('data-testid="liquidation-history"'));
});

test("Dataset temporalCoverage starts at the earlier of launch day and the history's first snapshot; the worker passes the feed's history", async () => {
  assert.equal(dataPageTemporalCoverage("liquidations", null), "2026-10-10/..");
  assert.equal(dataPageTemporalCoverage("liquidations", { since: "2026-09-11T00:05:00.000Z" }), "2026-09-11/..");
  assert.equal(dataPageTemporalCoverage("liquidations", { since: "2026-10-12T00:05:00.000Z" }), "2026-10-10/..", "the live pages have shown data since launch");
  assert.equal(dataPageTemporalCoverage("funding", { since: "2026-09-11T00:05:00.000Z" }), "2026-10-10/..", "funding has no history");
  assert.equal(dataPageSchemas(LIQUIDATIONS_PATH, "fr", { history: readHistory(historyFeed) })[0].temporalCoverage, "2026-09-11/..");
  assert.equal(dataPageSchemas(LIQUIDATIONS_PATH, "fr")[0].temporalCoverage, "2026-10-10/..");
  const meta = await routeMetadata(new URL("https://nexualpha.com/fr/liquidations"), { MARKET_EVENTS_READ: async () => historyFeed });
  assert.equal(meta.schema[0].temporalCoverage, "2026-09-11/..");
  const failing = await routeMetadata(new URL("https://nexualpha.com/liquidations"), { MARKET_EVENTS_READ: async () => { throw new Error("down"); } });
  assert.equal(failing.schema[0].temporalCoverage, "2026-10-10/..");
  assert.equal(failing.status, 200);
  const html = await (await worker.fetch(new Request("https://nexualpha.com/liquidations", { headers: { accept: "text/html" } }), { ASSETS: assets, MARKET_EVENTS_READ: async () => historyFeed })).text();
  assert.match(html, /"temporalCoverage":"2026-09-11\/\.\."/);
});
