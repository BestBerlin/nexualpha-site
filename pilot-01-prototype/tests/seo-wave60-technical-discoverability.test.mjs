import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeRouteSeo } from "../src/data/seo-injection.js";

test("Wave60 robots keeps search discovery open without conflating OpenAI crawler roles", async () => {
  const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");

  assert.match(robots, /User-agent: OAI-SearchBot\nAllow: \//);
  assert.match(robots, /User-agent: GPTBot\nAllow: \//);
  assert.match(robots, /User-agent: ChatGPT-User\nAllow: \//);
  assert.match(robots, /User-agent: PerplexityBot\nAllow: \//);
  assert.match(robots, /User-agent: ClaudeBot\nAllow: \//);
  assert.match(robots, /User-agent: Claude-SearchBot\nAllow: \//);
  assert.match(robots, /User-agent: Claude-User\nAllow: \//);
  assert.match(robots, /User-agent: anthropic-ai\nAllow: \//);
  assert.match(robots, /User-agent: Google-Extended\nAllow: \//);
  assert.match(robots, /User-agent: Applebot-Extended\nAllow: \//);
  assert.match(robots, /User-agent: Bingbot\nAllow: \//);
  assert.match(robots, /User-agent: \*\nAllow: \//);
  assert.match(robots, /Sitemap: https:\/\/nexualpha\.com\/sitemap\.xml/);
  assert.match(robots, /Sitemap: https:\/\/nexualpha\.com\/news-sitemap\.xml/);
});

test("Wave60 discovery files retain canonical source and answer inventories", async () => {
  const [sitemap, small, llms, full] = await Promise.all([
    readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8"),
    readFile(new URL("../public/llms-small.txt", import.meta.url), "utf8"),
    readFile(new URL("../public/llms.txt", import.meta.url), "utf8"),
    readFile(new URL("../public/llms-full.txt", import.meta.url), "utf8"),
  ]);

  assert.match(sitemap, /<loc>https:\/\/nexualpha\.com\/methodology<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/nexualpha\.com\/exchanges\/uniswap<\/loc>/);
  for (const text of [llms, full]) {
    assert.match(text, /https:\/\/nexualpha\.com\/llms-small\.txt/);
    assert.match(text, /https:\/\/nexualpha\.com\/methodology/);
    assert.match(text, /https:\/\/nexualpha\.com\/methodology#data-license/);
    assert.match(text, /does not grant redistribution, republication or sublicensing rights/);
    assert.match(text, /https:\/\/nexualpha\.com\/llms-full\.txt/);
    assert.match(text, /## Retrieval question inventory/);
    assert.match(text, /## Priority answer map/);
    assert.match(text, /answer route: https:\/\/nexualpha\.com\/eu/);
    assert.match(text, /answer route: https:\/\/nexualpha\.com\/tr\/markets\/turkiye/);
    assert.match(text, /answer route: https:\/\/nexualpha\.com\/exchanges\/hyperliquid/);
    assert.match(text, /## Reviewed news article answers/);
    assert.doesNotMatch(text.match(/## Priority answer map[\s\S]*?(?=\n\n## Reviewed news article answers)/)?.[0] || "", /nexu888|11350287|LUCKX|CANDY007|INS898|luckybitcoin|commission rate/i);
  }
  assert.ok(Buffer.byteLength(small) < 5_000, `llms-small.txt should stay compact, got ${Buffer.byteLength(small)} bytes`);
  assert.match(small, /NexuAlpha is a neutral crypto trading-venue research directory/);
  assert.match(small, /https:\/\/nexualpha\.com\/llms\.txt/);
  assert.match(small, /https:\/\/nexualpha\.com\/llms-full\.txt/);
  assert.match(small, /https:\/\/nexualpha\.com\/exchanges/);
  assert.match(small, /https:\/\/nexualpha\.com\/compare\/binance-vs-okx/);
  assert.match(small, /https:\/\/nexualpha\.com\/methodology/);
  assert.match(small, /## Priority answer map/);
  assert.match(small, /EU\/regulation: Where can a user check the current ESMA MiCA register/);
  assert.match(small, /TR\/regulation: Türkiye'de bir kripto varlık hizmet sağlayıcısını/);
  assert.match(small, /Commercial terms, referral codes, commission rates, rebates and welcome offers are intentionally omitted/);
  assert.match(small, /https:\/\/nexualpha\.com\/methodology#data-license/);
  assert.match(small, /does not grant redistribution, republication or sublicensing rights/);
  assert.doesNotMatch(small, /Detailed venue records|## Retrieval question inventory|private commission|invite code|referral link|nexu888|11350287/i);
});

test("Wave60 uses standard visible-content schema types rather than an AI-only schema", () => {
  const venue = computeRouteSeo({ url: "/exchanges/uniswap", locale: "en" });
  const types = venue.schemas.map((schema) => schema["@type"]);
  assert.ok(types.includes("BreadcrumbList"));
  assert.ok(types.includes("WebPage"));
  assert.ok(types.includes("FAQPage"));
  assert.doesNotMatch(JSON.stringify(venue.schemas), /AIContent|LLMContent|GEOPage|AnswerEnginePage/);
});
