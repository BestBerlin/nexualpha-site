import assert from "node:assert/strict";
import test from "node:test";

import { analyzeNginxTraffic, parseCombinedLogLine, renderTrafficMarkdown } from "../scripts/nginx-traffic-baseline.mjs";

const log = [
  '203.0.113.8 - - [15/Sep/2026:10:00:00 +0800] "GET /ja?locale=ja&utm_source=telegram HTTP/1.1" 200 123 "-" "Mozilla/5.0 OAI-SearchBot/1.0"',
  '198.51.100.4 - - [15/Sep/2026:10:00:01 +0800] "GET /compare/binance-vs-okx?campaign=secret HTTP/1.1" 200 456 "https://example.com/private" "Mozilla/5.0 ChatGPT-User/1.0"',
  '198.51.100.5 - - [15/Sep/2026:10:00:01 +0800] "GET /exchanges/uniswap?utm_source=private HTTP/1.1" 200 456 "https://chatgpt.com/c/secret" "Mozilla/5.0"',
  '198.51.100.6 - - [15/Sep/2026:10:00:01 +0800] "GET /llms.txt HTTP/1.1" 200 456 "-" "Mozilla/5.0 GPTBot/1.4"',
  '192.0.2.9 - - [15/Sep/2026:10:00:02 +0800] "GET /missing?token=private HTTP/1.1" 404 10 "-" "Mozilla/5.0"',
  '192.0.2.10 - - [15/Sep/2026:10:00:03 +0800] "GET /assets/app.js HTTP/1.1" 200 900 "-" "Googlebot/2.1"',
  '192.0.2.11 - - [15/Sep/2026:10:00:04 +0800] "GET /api/v1/venues HTTP/1.1" 200 900 "-" "Mozilla/5.0"',
  '192.0.2.12 - - [15/Sep/2026:10:00:05 +0800] "GET /topics/no-kyc HTTP/1.1" 200 900 "-" "Mozilla/5.0 HeadlessChrome/140.0"',
  '192.0.2.13 - - [15/Sep/2026:10:00:06 +0800] "GET /.git/config HTTP/1.1" 404 10 "-" "Mozilla/5.0"',
  'unparseable line containing 203.0.113.99',
].join("\n");

test("parses combined log request fields without retaining IP or query string", () => {
  const record = parseCombinedLogLine(log.split("\n")[0]);
  assert.deepEqual(record, { method: "GET", pathname: "/ja", status: 200, referralSource: null, userAgent: "Mozilla/5.0 OAI-SearchBot/1.0" });
});

test("classifies only exact or subdomain ChatGPT referrer hosts", () => {
  const valid = parseCombinedLogLine('198.51.100.7 - - [15/Sep/2026:10:00:07 +0800] "GET /methodology HTTP/1.1" 200 123 "https://share.chatgpt.com/example" "Mozilla/5.0"');
  const spoofed = parseCombinedLogLine('198.51.100.8 - - [15/Sep/2026:10:00:08 +0800] "GET /methodology HTTP/1.1" 200 123 "https://chatgpt.com.evil.example/example" "Mozilla/5.0"');

  assert.equal(valid.referralSource, "ChatGPT");
  assert.equal(spoofed.referralSource, null);
});

test("aggregates anonymous request, crawler and 404 evidence", () => {
  const report = analyzeNginxTraffic(log, { generatedAt: "2026-09-15T02:00:00.000Z", top: 10 });
  assert.equal(report.status, "READY");
  assert.deepEqual(report.totals, { parsedRequests: 9, unparsedLines: 1 });
  assert.deepEqual(report.statuses, { 200: 7, 404: 2 });
  assert.deepEqual(report.htmlTrafficClasses, {
    htmlRequests: 6,
    automationHtmlRequests: 1,
    knownCrawlerHtmlRequests: 2,
    otherHtmlRequests: 3,
    boundary: "Other HTML requests are anonymous non-matching requests, not verified people or unique visitors.",
  });
  assert.equal(report.crawlerUserAgentCounts["OAI-SearchBot"], 1);
  assert.equal(report.crawlerUserAgentCounts.GPTBot, 1);
  assert.equal(report.crawlerUserAgentCounts["ChatGPT-User"], 1);
  assert.equal(report.crawlerUserAgentCounts.Googlebot, 1);
  assert.equal(report.automationUserAgentCounts.HeadlessChrome, 1);
  assert.equal(report.referralSourceCounts.ChatGPT, 1);
  assert.deepEqual(report.topReferralHtmlPaths.ChatGPT, [{ path: "/exchanges/uniswap", requests: 1 }]);
  assert.deepEqual(report.topCrawlerHtmlPaths["OAI-SearchBot"], [{ path: "/ja", requests: 1 }]);
  assert.deepEqual(report.topCrawlerHtmlPaths["ChatGPT-User"], [{ path: "/compare/binance-vs-okx", requests: 1 }]);
  assert.deepEqual(report.topCrawlerHtmlPaths.Googlebot, []);
  assert.deepEqual(report.topOtherContentHtmlPaths, [{ path: "/exchanges/uniswap", requests: 1 }, { path: "/missing", requests: 1 }]);
  assert.deepEqual(report.top404Paths, [{ path: "/.git/config", requests: 1 }, { path: "/missing", requests: 1 }]);
  assert.deepEqual(report.topContent404Paths, [{ path: "/missing", requests: 1 }]);
  assert.equal(report.topHtmlPaths.some((item) => item.path === "/assets/app.js"), false);
  assert.equal(report.topHtmlPaths.some((item) => item.path === "/api/v1/venues"), false);
});

test("markdown cannot leak IPs, query values, referrers or raw user-agent strings", () => {
  const markdown = renderTrafficMarkdown(analyzeNginxTraffic(log, { generatedAt: "2026-09-15T02:00:00.000Z" }));
  assert.doesNotMatch(markdown, /203\.0\.113\.|198\.51\.100\.|192\.0\.2\./);
  assert.doesNotMatch(markdown, /telegram|campaign=secret|token=private|example\.com\/private|Mozilla\/5\.0/);
  assert.doesNotMatch(markdown, /chatgpt\.com\/c\/secret|utm_source=private/);
  assert.match(markdown, /Normalized referral-source labels/);
  assert.match(markdown, /Headers may be missing or spoofed/);
  assert.match(markdown, /Counts are not unique users/);
  assert.match(markdown, /user-agent strings and are not verified identities/);
});
