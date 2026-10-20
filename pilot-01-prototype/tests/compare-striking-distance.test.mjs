import assert from "node:assert/strict";
import test from "node:test";
import worker from "../worker/index.js";
import { compareDirectAnswerFor, compareSeoOverrideFromDirectAnswer, strikingDistanceComparePairs } from "../src/data/compare-direct-answers.js";

test("search-demand comparisons lead with a checked fee winner, tie, tradeoff or explicit unknown", () => {
  for (const slug of strikingDistanceComparePairs) for (const locale of ["en", "zh-Hans"]) {
    const answer = compareDirectAnswerFor(slug, locale);
    assert.ok(answer.body.length > 50, `${slug} ${locale}`);
    assert.ok(answer.sourceLinks.length > 0, `${slug} source evidence`);
    assert.equal(compareSeoOverrideFromDirectAnswer(slug, locale).directAnswer.answer, answer.body);
    assert.match(answer.decisionCard.title, /vs/);
    const [left, right] = slug.split("-vs-");
    assert.ok(answer.internalLinks.some(([, href]) => href === `/exchanges/${left}`));
    assert.ok(answer.internalLinks.some(([, href]) => href === `/exchanges/${right}`));
    assert.match(answer.body, locale === "en" ? /^On (spot|perpetual) fees,|^No spot fee winner can be verified/ : /手续费|基础费率/);
  }
  assert.match(compareDirectAnswerFor("binance-vs-kraken").body, /^On spot fees, Binance has lower base fees/);
  assert.match(compareDirectAnswerFor("binance-vs-bybit").body, /^On spot fees, the base schedules tie/);
  assert.match(compareDirectAnswerFor("hyperliquid-vs-dydx").body, /^On perpetual fees, neither venue wins both/);
  assert.match(compareDirectAnswerFor("gate-io-vs-mexc").body, /^No spot fee winner can be verified/);
});

test("all eight reverse comparison slugs retain canonical 301s and attribution", async () => {
  for (const slug of strikingDistanceComparePairs) for (const prefix of ["", "/zh-hans"]) {
    const reverse = slug.split("-vs-").reverse().join("-vs-");
    const response = await worker.fetch(new Request(`https://nexualpha.com${prefix}/compare/${reverse}?utm_source=gsc`, { headers: { accept: "text/html" } }), {});
    assert.equal(response.status, 301, `${prefix} ${reverse}`);
    assert.equal(response.headers.get("location"), `https://nexualpha.com${prefix}/compare/${slug}?utm_source=gsc`);
  }
});
