// News content sweep (links-l10n lane 2026-10-11; scorecard C4): raw Markdown links shown as text, dangling or
// truncated descriptions, local filesystem paths, "undefined"/"null" leaks and broken internal links. The repairs are
// deterministic (src/data/news-content-repair.js) and applied by the importer, the repair script, the Worker's feed
// loader and the client normalizer; the sweep (scripts/qa-content-sweep.mjs) must find nothing in the repository feed.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { repairNewsArticle, repairTruncatedSummary, stripPlainMarkdown, unwrapLocalPathLinks } from "../src/data/news-content-repair.js";
import { normalizeNewsArticle, normalizeNewsArticleSummary } from "../src/data/news-feed-client.js";
import worker from "../worker/index.js";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

test("a truncated summary is completed from the same body, never invented", () => {
  const body = "## 简短回答\n\n可靠系统必须设置 REST 快照边界、去重、序列或时间戳检查、重连恢复，并且只用权威终态事件关闭订单状态机。下一句不应出现。";
  assert.equal(repairTruncatedSummary("可靠系统必须设置 REST 快照边界、去重、序列或时间戳检查、重连恢复，并且只", body), "可靠系统必须设置 REST 快照边界、去重、序列或时间戳检查、重连恢复，并且只用权威终态事件关闭订单状态机。");
  const en = "## Short answer\n\nBinance removes the pairs on 11 September at 06:00 UTC and closes the related bots. Later text.";
  assert.equal(repairTruncatedSummary("Binance removes the pairs on 11 September at 06:00 UTC and closes the rel", en), "Binance removes the pairs on 11 September at 06:00 UTC and closes the related bots.");
  assert.equal(repairTruncatedSummary("The first sentence is complete and carries most of the text. Then it was cut", "unrelated body"), "The first sentence is complete and carries most of the text.", "cut back to the last full sentence");
  assert.equal(repairTruncatedSummary("A single clause that stops mid", "unrelated body"), "A single clause that stops mid…", "otherwise closed with an ellipsis");
  assert.equal(repairTruncatedSummary("Complete sentence.", ""), "Complete sentence.");
  assert.equal(repairTruncatedSummary("移除多组 `USDC` 杠杆交易对。", ""), "移除多组 USDC 杠杆交易对。", "code markers removed from plain text");
});

test("plain-text fields lose Markdown markers; local filesystem link targets become their label", () => {
  assert.equal(stripPlainMarkdown("See [OKX fees](/exchanges/okx) and **bold** `code`"), "See OKX fees and bold code");
  assert.equal(unwrapLocalPathLinks("Source: [registry](/Users/me/repo/registry.ts) and [OKX](/exchanges/okx)."), "Source: registry and [OKX](/exchanges/okx).");
  assert.equal(unwrapLocalPathLinks("[file](file:///tmp/x) [win](C:\\x\\y)"), "file win");
  const { article, changes } = repairNewsArticle({ slug: "x", title: { en: "Title" }, summary: { en: "Cut summary that ends in the mid" }, content: { en: "## A\n\nCut summary that ends in the middle of a sentence. More. [path](/Volumes/disk/file.md)" } });
  assert.equal(article.summary.en, "Cut summary that ends in the middle of a sentence.");
  assert.equal(article.content.en.includes("/Volumes/"), false);
  assert.equal(changes.length, 2);
  const untouched = { slug: "y", title: { en: "Fine" }, summary: { en: "Fine." }, content: { en: "Body." } };
  assert.equal(repairNewsArticle(untouched).article, untouched, "unchanged articles keep their identity");
});

test("the client normalizers never show Markdown markers in titles or summaries", () => {
  const raw = { slug: "a-b", status: "PUBLISHED", publishedAt: "2026-10-01T00:00:00Z", title: { en: "**OKX** fees" }, summary: { en: "Uses `USDC` pairs.", "zh-Hans": "使用 `USDC` 交易对。" }, content: { en: "Body." }, sources: [{ url: "https://example.com", publisher: "Example", title: "Example" }] };
  assert.equal(normalizeNewsArticle(raw).title.en, "OKX fees");
  assert.equal(normalizeNewsArticle(raw).summary["zh-Hans"], "使用 USDC 交易对。");
  assert.equal(normalizeNewsArticleSummary(raw).summary.en, "Uses USDC pairs.");
});

test("the Worker serves repaired articles from an unrepaired feed (fallback body and article JSON)", async () => {
  const feed = { articles: [{ slug: "cut-summary", status: "PUBLISHED", category: "research", categoryName: { en: "Research" }, publishedAt: "2026-10-01T00:00:00Z", readTime: "5 min",
    title: { en: "Cut summary article", "zh-Hans": "截断摘要" }, summary: { en: "The venue removes the pairs and closes the rel", "zh-Hans": "平台移除交易对并关闭相" },
    content: { en: "## Short answer\n\nThe venue removes the pairs and closes the related bots. See [registry](/Users/me/registry.ts).", "zh-Hans": "## 简短回答\n\n平台移除交易对并关闭相关机器人。" },
    sources: [{ url: "https://example.com/notice", publisher: "Example", title: "Notice" }], relatedVenues: [], seo: { noindex: false } }] };
  const text = JSON.stringify(feed);
  const assets = { fetch: async (request) => {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/content/news-feed.json") return new Response(text);
    if (pathname === "/content/news-feed.sha256.txt") return new Response(`${"b".repeat(64)}\n`);
    if (pathname === "/index.html") return new Response("<!doctype html><html><head><title>x</title></head><body><div id=\"root\"></div></body></html>", { headers: { "content-type": "text/html" } });
    if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
    return new Response("missing", { status: 404 });
  } };
  const html = await (await worker.fetch(new Request("https://nexualpha.com/news/cut-summary", { headers: { accept: "text/html" } }), { ASSETS: assets })).text();
  assert.match(html, /The venue removes the pairs and closes the related bots\./);
  assert.doesNotMatch(html, /\/Users\/me/, "no local path in the page");
  const zh = await (await worker.fetch(new Request("https://nexualpha.com/zh-hans/news/cut-summary", { headers: { accept: "text/html" } }), { ASSETS: assets })).text();
  assert.match(zh, /平台移除交易对并关闭相关机器人。/);
});

test("the content sweep finds nothing in the repository feed", () => {
  const output = execFileSync(process.execPath, [path.join(root, "scripts/qa-content-sweep.mjs")], { cwd: root, encoding: "utf8" });
  for (const kind of ["raw-markdown-link", "markdown-in-plain", "dangling", "local-path", "undefined-null", "broken-internal"]) {
    assert.match(output, new RegExp(`${kind}\\s+0\\b`), `${kind} is 0:\n${output}`);
  }
});
