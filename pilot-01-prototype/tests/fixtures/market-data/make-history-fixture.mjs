#!/usr/bin/env node
// Regenerates the liquidation-history fixtures from the sample feed with a deterministic pseudo-random series:
//   market-history.sample.jsonl        the last 3 days of hourly collector rows ending at the sample feed's generatedAt
//   market-events.history.sample.json  the sample feed plus the `history` summary the collector would write
// Run: node tests/fixtures/market-data/make-history-fixture.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { historySnapshot, summarizeHistory } from "../../../../ops/market-collector/market-history.mjs";

const here = new URL("./", import.meta.url);
const feed = JSON.parse(readFileSync(new URL("market-events.sample.json", here), "utf8"));
const end = Date.parse(feed.generatedAt);
const start = Date.UTC(2026, 8, 11, 0, 5); // 2026-09-11T00:05Z → 30 UTC days up to the partial 2026-10-10
let seed = 20261011;
const rand = () => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed / 2 ** 31; };

const rows = [];
for (let t = start; t <= end; t += 3600e3) {
  const day = Math.floor((t - start) / 86400e3);
  const spike = day === 12 ? 4.2 : day === 21 ? 2.3 : 1; // two visible event days
  const h1 = Math.round((180e3 + rand() * 520e3) * spike);
  const longShare = 0.3 + rand() * 0.45;
  const h1Long = Math.round(h1 * longShare), h1Short = h1 - h1Long;
  const doc = {
    ...feed,
    liquidations: {
      ...feed.liquidations,
      h1: { longUsd: h1Long, shortUsd: h1Short, totalUsd: h1, orders: 20 + Math.round(rand() * 60), topSymbols: feed.liquidations.h1.topSymbols, largest: feed.liquidations.h1.largest },
      h4: { longUsd: h1Long * 4, shortUsd: h1Short * 4, totalUsd: h1 * 4, orders: 90, topSymbols: feed.liquidations.h4.topSymbols, largest: feed.liquidations.h4.largest },
      h24: { longUsd: h1Long * 22, shortUsd: h1Short * 22, totalUsd: h1 * 22, orders: 500, topSymbols: feed.liquidations.h24.topSymbols, largest: feed.liquidations.h24.largest },
    },
  };
  rows.push(historySnapshot(doc, t));
}
writeFileSync(new URL("market-history.sample.jsonl", here), rows.slice(-72).map((r) => JSON.stringify(r)).join("\n") + "\n");
const history = summarizeHistory(rows, { now: end });
writeFileSync(new URL("market-events.history.sample.json", here), JSON.stringify({ ...feed, history }, null, 1) + "\n");
console.log(`rows=${rows.length} days=${history.days} daily=${history.daily.length} avg=${history.avgDailyUsd} largest=${history.records.largestDay.day} rank=${history.records.todayRankInMonth}/${history.records.daysInMonth}`);
