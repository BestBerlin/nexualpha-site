import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  dedupeRepeatedLongSentences,
  normalizeNewsFeed,
} from "../src/data/news-feed-client.js";

const repeated = "Opening an exchange account is a legal and security onboarding process, not a shortcut to a trade.";

test("dedupeRepeatedLongSentences keeps the first exact long sentence and unique content", () => {
  const markdown = `## Before you begin\n\n${repeated}\n\nKeep your recovery codes offline.\n\n${repeated}`;
  const cleaned = dedupeRepeatedLongSentences(markdown);

  assert.equal(cleaned.match(new RegExp(repeated.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))?.length, 1);
  assert.match(cleaned, /^## Before you begin/m);
  assert.match(cleaned, /Keep your recovery codes offline\./);
});

test("published news feed has no repeated exact long sentences after normalization", async () => {
  const raw = JSON.parse(await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8"));
  const articles = normalizeNewsFeed(raw);

  assert.ok(articles.length >= 100, "expected the complete reviewed news corpus");
  for (const article of articles) {
    for (const [locale, content] of Object.entries(article.content)) {
      const seen = new Set();
      for (const match of content.matchAll(/[^.!?。！？\n]+[.!?。！？]/g)) {
        const sentence = match[0].replace(/\s+/g, " ").trim().toLowerCase();
        if (sentence.length < 80) continue;
        assert.equal(
          seen.has(sentence),
          false,
          `repeated long sentence remains in ${article.slug} (${locale}): ${sentence.slice(0, 120)}`,
        );
        seen.add(sentence);
      }
    }
  }
});

test("public news feed raw article bodies are already free of repeated exact long sentences", async () => {
  const raw = JSON.parse(await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8"));

  assert.ok(raw.articles.length >= 100, "expected the complete public news corpus");
  for (const article of raw.articles) {
    for (const [locale, content] of Object.entries(article.content || {})) {
      const seen = new Set();
      for (const match of String(content).matchAll(/[^.!?。！？\n]+[.!?。！？]/g)) {
        const sentence = match[0].replace(/\s+/g, " ").trim().toLowerCase();
        if (sentence.length < 80) continue;
        assert.equal(
          seen.has(sentence),
          false,
          `raw feed repeated long sentence remains in ${article.slug} (${locale}): ${sentence.slice(0, 120)}`,
        );
        seen.add(sentence);
      }
    }
  }
});
