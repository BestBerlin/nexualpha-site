import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  AI_ENGINES,
  PRINT_LANGS,
  QUESTIONS,
  QUESTION_SET_VERSION,
  buildBingRows,
  buildGscRows,
  buildReport,
  competitorDomains,
  fetchSerp,
  findOurRank,
  isoWeek,
  isoWeekEnd,
  manualTemplate,
  matchQueryRows,
  parseBraveResults,
  parseDdgResults,
  questionText,
  serpQueries,
  summarizeSerp,
} from "../scripts/aeo-monitor.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name) => readFileSync(path.join(here, "fixtures", "aeo-monitor", name), "utf8");

test("question set is fixed: 20 questions, unique ids and queries, six display languages, 10 localized", () => {
  assert.match(QUESTION_SET_VERSION, /^\d{4}-\d{2}-\d{2}\.v\d+$/);
  assert.equal(QUESTIONS.length, 20);
  assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, 20);
  assert.equal(new Set(QUESTIONS.map((q) => q.en.toLowerCase())).size, 20);
  for (const q of QUESTIONS) {
    assert.match(q.targetPath, /^\//);
    for (const lang of PRINT_LANGS) assert.ok(questionText(q, lang)?.length >= 6, `${q.id} missing ${lang}`);
    if (q.market !== "global") {
      assert.ok(q.local?.query, `${q.id} market question needs a local query`);
      assert.equal(q.local.lang === "id" ? "id" : q.local.lang, q.market);
    }
  }
  const required = ["best OKX referral code", "OKX vs Binance fees", "Bitget referral code rebate", "Binance vs Bybit which is cheaper", "crypto liquidations today",
    "BTC funding rate now Binance vs OKX", "how to sign up on Bitget with a referral code", "MEXC vs Bybit KYC", "which exchange has the lowest perp fees", "is bitget.cafe an official Bitget domain"];
  for (const text of required) assert.ok(QUESTIONS.some((q) => q.en === text), `missing fixed question "${text}"`);
  assert.equal(QUESTIONS.filter((q) => q.local).length, 10);
  assert.deepEqual([...new Set(QUESTIONS.filter((q) => q.local).map((q) => q.local.lang))].sort(), ["es", "id", "ru", "tr", "vi"]);
});

test("SERP query list is 20 English + 10 local, all distinct", () => {
  const rows = serpQueries();
  assert.equal(rows.length, 30);
  assert.equal(rows.filter((r) => r.lang === "en").length, 20);
  assert.equal(new Set(rows.map((r) => `${r.lang}|${r.query.toLowerCase()}`)).size, 30);
});

test("DuckDuckGo parser reads a real result page and finds no nexualpha.com entry", () => {
  const parsed = parseDdgResults(fixture("ddg-best-okx-referral-code.html"));
  assert.equal(parsed.status, "ok");
  assert.ok(parsed.results.length >= 8, `got ${parsed.results.length}`);
  assert.deepEqual(parsed.results.map((r) => r.rank), parsed.results.map((_, i) => i + 1));
  assert.equal(parsed.results[0].domain, "bitdegree.org");
  assert.match(parsed.results[0].url, /^https:\/\/www\.bitdegree\.org\/crypto\/deals\/okx-referral-code$/);
  assert.match(parsed.results[0].title, /OKX Referral/i);
  for (const r of parsed.results) { assert.match(r.url, /^https?:\/\//); assert.doesNotMatch(r.url, /duckduckgo\.com\/l\//); }
  assert.deepEqual(findOurRank(parsed.results), { rank: null, url: null });
});

test("DuckDuckGo parser ranks nexualpha.com and skips ads; a challenge page is reported as blocked", () => {
  const html = fixture("ddg-best-okx-referral-code.html").replace('uddg=https%3A%2F%2Fwww.datawallet.com%2Fcrypto%2Fokx%2Dreferral%2Dcode', "uddg=https%3A%2F%2Fnexualpha.com%2Fexchanges%2Fokx");
  const parsed = parseDdgResults(html);
  assert.deepEqual(findOurRank(parsed.results), { rank: 2, url: "https://nexualpha.com/exchanges/okx" });
  const withAd = `<div class="result result--ad"><a class="result__a" href="//duckduckgo.com/y.js?ad_domain=x">ad</a></div>${html}`;
  assert.equal(parseDdgResults(withAd).results[0].domain, "bitdegree.org");
  assert.equal(parseDdgResults('<html><body><div class="anomaly-modal">If this error persists, please let us know</div></body></html>').status, "blocked");
  assert.equal(parseDdgResults("<html><body>nothing</body></html>").status, "no-results");
});

test("Brave parser reads a real result page in display order", () => {
  const parsed = parseBraveResults(fixture("brave-best-okx-referral-code.html"));
  assert.equal(parsed.status, "ok");
  assert.ok(parsed.results.length >= 10, `got ${parsed.results.length}`);
  assert.deepEqual(parsed.results.map((r) => r.rank), parsed.results.map((_, i) => i + 1));
  assert.equal(parsed.results[0].domain, "bitdegree.org");
  assert.match(parsed.results[0].title, /OKX Referral/i);
  assert.equal(parsed.results[1].domain, "cryptoninjas.net");
  for (const r of parsed.results) assert.doesNotMatch(r.url, /search\.brave\.com/);
  const swapped = fixture("brave-best-okx-referral-code.html").replace('<a href="https://www.cryptoninjas.net/referral-code/okx/" target="_self" class="svelte-14r20fy l1">', '<a href="https://nexualpha.com/exchanges/okx" target="_self" class="svelte-14r20fy l1">');
  assert.equal(findOurRank(parseBraveResults(swapped).results).rank, 2);
  assert.equal(parseBraveResults('<html><body><form class="captcha-form">Verify you are human</form></body></html>').status, "blocked");
});

test("fetchSerp records a blocked status on HTTP 429 without throwing", async () => {
  const fake = async () => ({ status: 429, text: async () => "slow down" });
  const r = await fetchSerp("ddg", serpQueries()[0], fake);
  assert.equal(r.status, "blocked");
  assert.equal(r.nexualphaRank, null);
  const ok = await fetchSerp("brave", serpQueries()[0], async () => ({ status: 200, text: async () => fixture("brave-best-okx-referral-code.html") }));
  assert.equal(ok.status, "ok");
  assert.equal(ok.top.length, 10);
});

test("GSC matching: exact rows, token variants, top page; Bing stats use the same matcher", () => {
  const queries = serpQueries().filter((q) => q.questionId === "okx-vs-binance-fees" || q.questionId === "tr-okx-referans-nerede");
  const queryRows = [
    { keys: ["okx vs binance fees"], clicks: 1, impressions: 40, ctr: 0.025, position: 8.2 },
    { keys: ["okx vs binance trading fees"], clicks: 0, impressions: 10, ctr: 0, position: 14 },
    { keys: ["binance fees"], clicks: 0, impressions: 300, ctr: 0, position: 40 },
    { keys: ["okx referans kodu nerede yazar"], clicks: 0, impressions: 5, ctr: 0, position: 6 },
  ];
  const queryPageRows = [
    { keys: ["okx vs binance fees", "https://nexualpha.com/compare/binance-vs-okx"], clicks: 1, impressions: 30, ctr: 0, position: 8 },
    { keys: ["okx vs binance fees", "https://nexualpha.com/exchanges/okx"], clicks: 0, impressions: 10, ctr: 0, position: 9 },
    { keys: ["okx referans kodu nerede yazar", "https://nexualpha.com/tr/exchanges/okx"], clicks: 0, impressions: 5, ctr: 0, position: 6 },
  ];
  const rows = buildGscRows(queries, queryRows, queryPageRows);
  const okx = rows.find((r) => r.questionId === "okx-vs-binance-fees" && r.lang === "en");
  assert.deepEqual(okx.exact, { impressions: 40, clicks: 1, position: 8.2 });
  assert.equal(okx.variants.length, 1);
  assert.equal(okx.variants[0].query, "okx vs binance trading fees");
  assert.equal(okx.topPage, "https://nexualpha.com/compare/binance-vs-okx");
  const tr = rows.find((r) => r.lang === "tr");
  assert.equal(tr.exact.impressions, 5);
  assert.equal(tr.topPage, "https://nexualpha.com/tr/exchanges/okx");
  assert.equal(rows.find((r) => r.questionId === "tr-okx-referans-nerede" && r.lang === "en").exact.impressions, 0);
  assert.equal(matchQueryRows("Binance fees", queryRows, (r) => r.keys[0]).exact.length, 1);

  const bing = buildBingRows(queries, [{ Query: "OKX vs Binance fees", Impressions: 12, Clicks: 1, AvgImpressionPosition: 5 }, { Query: "irrelevant", Impressions: 9 }]);
  assert.equal(bing.find((r) => r.lang === "en" && r.questionId === "okx-vs-binance-fees").exact.impressions, 12);
});

test("manual template covers every engine x question with the agreed fields", () => {
  const t = manualTemplate("2026-10-13");
  assert.equal(t.results.length, QUESTIONS.length * AI_ENGINES.length);
  assert.deepEqual(Object.keys(t.results[0]), ["engine", "questionId", "question", "cited", "rank_of_citation", "cited_url", "competitor_domains", "notes"]);
});

test("ISO week helpers follow Asia/Shanghai calendar dates", () => {
  assert.equal(isoWeek("2026-10-11"), "2026-W41");
  assert.equal(isoWeek("2026-10-12"), "2026-W42");
  assert.equal(isoWeek("2027-01-01"), "2026-W53");
  assert.equal(isoWeekEnd("2026-W41"), "2026-10-11");
});

function serpFixture(week, ranks) {
  const results = [];
  for (const engine of ["ddg", "brave"]) {
    for (const row of serpQueries()) {
      const rank = ranks[`${engine}:${row.questionId}:${row.lang}`] ?? null;
      const top = [{ rank: 1, domain: "bitdegree.org", url: "https://www.bitdegree.org/x" }, { rank: 2, domain: "datawallet.com", url: "https://www.datawallet.com/x" }];
      if (rank) top.splice(rank - 1, 0, { rank, domain: "nexualpha.com", url: `https://nexualpha.com${row.targetPath}` });
      results.push({ ...row, engine, status: "ok", httpStatus: 200, nexualphaRank: rank, nexualphaUrl: rank ? `https://nexualpha.com${row.targetPath}` : null, top });
    }
  }
  return { schema: "nexualpha.aeo-serp.v1", week, engines: ["ddg", "brave"], summary: summarizeSerp(results), results };
}
function gscFixture(week, impressions, position) {
  const rows = buildGscRows(serpQueries(), [{ keys: ["okx vs binance fees"], clicks: 2, impressions, position }], [{ keys: ["okx vs binance fees", "https://nexualpha.com/compare/binance-vs-okx"], clicks: 2, impressions, position }]);
  return { schema: "nexualpha.aeo-gsc.v1", week, window: { start: "2026-09-10", end: "2026-10-08", days: 28 }, google: { status: "ok", siteTotals: { clicks: 7, impressions: 1834, position: 20.3 }, rows }, bing: { status: "ok", rows: [] } };
}

test("report merges serp + gsc + manual and shows week-on-week deltas", () => {
  const prevSerp = serpFixture("2026-W41", { "ddg:okx-vs-binance-fees:en": 7 });
  const serp = serpFixture("2026-W42", { "ddg:okx-vs-binance-fees:en": 3, "brave:okx-vs-binance-fees:en": 9, "ddg:tr-okx-referans-nerede:tr": 2 });
  const manual = manualTemplate("2026-10-19");
  manual.results[1] = { ...manual.results[1], cited: true, rank_of_citation: 2, cited_url: "https://nexualpha.com/exchanges/okx", competitor_domains: ["bitdegree.org"] };
  const { markdown, summary } = buildReport({ week: "2026-W42", serp, gsc: gscFixture("2026-W42", 60, 6.5), manual, prevSerp, prevGsc: gscFixture("2026-W41", 40, 8.2), prevManual: null });
  assert.equal(summary.serp.ddg.top10, 2);
  assert.equal(summary.serp.ddg.top3, 2);
  assert.equal(summary.serp.brave.top10, 1);
  assert.equal(summary.gsc.impressions, 60);
  assert.equal(summary.gsc.position, 6.5);
  assert.equal(summary.manual.cited, 1);
  assert.equal(summary.previousWeek, "2026-W41");
  assert.match(markdown, /# AEO monitor — 2026-W42/);
  assert.match(markdown, /\| DuckDuckGo: queries with nexualpha\.com in top 10 \(of 30\) \| 2 \| 1 \| \+1 \|/);
  assert.match(markdown, /\| Brave: queries with nexualpha\.com in top 10 \(of 30\) \| 1 \| 0 \| \+1 \|/);
  assert.match(markdown, /GSC: impressions on tracked queries \(exact \+ variants\) \| 60 \| 40 \| \+20 \|/);
  assert.match(markdown, /GSC: impression-weighted position on tracked queries \| 6\.5 \| 8\.2 \| −1\.7 \|/);
  assert.match(markdown, /AI answer engines: citations of nexualpha\.com \(of 80 engine×question checks, 2026-10-19\) \| 1 \| - \| new \|/);
  assert.match(markdown, /\| 1 \| best OKX referral code \| – \| – \| 0 \| - \| - \| · P#2 · · \|/);
  assert.match(markdown, /\| 2 \| OKX vs Binance fees \| #3 \| #9 \| 60 \| 6\.5 \| \/compare\/binance-vs-okx \| · · · · \|/);
  assert.match(markdown, /\| tr \| okx referans kodu nerede yazar \| #2 \| – \|/);
  assert.match(markdown, /\| bitdegree\.org \| \d+ \|/);
  assert.equal(competitorDomains(serp.results)[0].domain, "bitdegree.org");
});

test("report without previous week or manual data labels the baseline instead of inventing deltas", () => {
  const { markdown, summary } = buildReport({ week: "2026-W41", serp: serpFixture("2026-W41", {}), gsc: null, manual: null, prevSerp: null, prevGsc: null, prevManual: null });
  assert.equal(summary.previousWeek, null);
  assert.match(markdown, /previous week: none \(baseline\)/);
  assert.match(markdown, /\| 0 \| - \| new \|/);
  assert.match(markdown, /\| GSC \| not run \| \| \|/);
  assert.match(markdown, /manual check not run this week/);
});
