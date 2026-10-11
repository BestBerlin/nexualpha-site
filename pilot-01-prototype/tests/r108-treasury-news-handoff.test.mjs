import {assertVersionedAcceptedFeed} from './r189-feed-contract.mjs';
import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("..", import.meta.url));
const slug = "tokenized-treasuries-structure-access-risks";
// Class b: 84b6426 made the official binance.com referral route the accepted protected registry bytes.
const protectedHashes = new Map([
  ["src/data/partner-registry.js", "e53261a6e7e39e64bd35bbedda4ef4a36c1521521750a77eaff3d26c52925d69"],
  ["src/data/venue-database.js", "0ce124afbe9f4758ce9ec093c79372550ce2e2e90a7342aa05ecc8d3482e1d52"],
  ["src/data/public-cta.js", "675875240d5fbb05498284a37f90a14488d6ace73d19b102caeb5add9e33f8e3"],
  ["src/data/regional-cta.js", "a2542bb137b6b6ff123a0d3c6b3a01b09e1e3a785ee223e3b4e04a3fe8aab665"],
  ["public/content/news-feed.json", "6bdbbd21a9f8f4ed6ed36307fbc582fbdaf633cb673f157f6a3e97c7bd318f08"],
  ["public/research/wave48-tokenized-treasury-rights-ops.json", "aabfccd32a94c53553854a631bda5ff40b37a072fad7c96ab168117ee41ee15d"],
]);

async function renderCases() {
  const dir = await mkdtemp(path.join(root, "tests/.tmp-r108-treasury-"));
  try {
    const entry = path.join(dir, "entry.mjs");
    const bundle = path.join(dir, "bundle.cjs");
    await writeFile(entry, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import feed from '../../public/content/news-feed.json' with { type: 'json' };
      import { NewsDetailPage } from '../../src/components/v3/news/NewsDetailPage.jsx';
      import { TokenizedAssetsPage } from '../../src/components/v3/TokenizedAssetsPage.jsx';
      const slug = '${slug}';
      const cases = {
        enNews: renderToStaticMarkup(React.createElement(NewsDetailPage, { slug, locale: 'en', initialArticles: feed.articles })),
        zhNews: renderToStaticMarkup(React.createElement(NewsDetailPage, { slug, locale: 'zh-Hans', initialArticles: feed.articles })),
        jaNews: renderToStaticMarkup(React.createElement(NewsDetailPage, { slug, locale: 'ja', initialArticles: feed.articles })),
        enTopic: renderToStaticMarkup(React.createElement(TokenizedAssetsPage, { slug: 'tokenized-treasuries', locale: 'en' })),
        zhTopic: renderToStaticMarkup(React.createElement(TokenizedAssetsPage, { slug: 'tokenized-treasuries', locale: 'zh-Hans' })),
      };
      console.log(JSON.stringify(cases));
    `);
    await build({
      entryPoints: [entry],
      bundle: true,
      platform: "node",
      format: "cjs",
      outfile: bundle,
      loader: { ".css": "empty", ".json": "json", ".svg": "text", ".png": "dataurl", ".jpg": "dataurl", ".jpeg": "dataurl" },
      logLevel: "silent",
      define: {
        "import.meta.env.DEV": "false",
        "import.meta.env.PROD": "true",
        "import.meta.env.SSR": "true",
        "import.meta.env.VITE_DATA_SOURCE": "\"local-research\"",
      },
    });
    return JSON.parse(execFileSync(process.execPath, [bundle], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const rendered = await renderCases();

function firstDecision(html) {
  const start = html.indexOf('class="top-decision-box news-detail__first-decision"');
  assert.ok(start >= 0, "news first decision box is server-rendered");
  // R194 moves optional research after full content. Bound this contract to the actual primary decision aside.
  const open = html.lastIndexOf('<aside ', start);
  assert.ok(open >= 0 && html.indexOf('>', open) > start, 'decision class belongs to its actual aside');
  const end = html.indexOf('</aside>', start);
  assert.ok(end > start, "actual primary decision aside is complete");
  const box = html.slice(open, end + '</aside>'.length);
  assert.equal((box.match(/<aside\b/g) || []).length, 1, 'no nested/neighbor module included');
  assert.equal((box.match(/<\/aside>/g) || []).length, 1, 'exact sole primary decision boundary');
  assert.ok(end < html.indexOf('class="news-detail__content"', start), 'primary decision stays before complete body');
  return box;
}

function firstHref(fragment) {
  const match = fragment.match(/<a\s+href="([^"]+)"/);
  assert.ok(match, "first decision has at least one action");
  return match[1];
}

test("tokenized Treasury EN news handoff points first to the anchored evergreen checklist", () => {
  const box = firstDecision(rendered.enNews);
  assert.match(box, /Before comparing tokenized Treasury yield/);
  assert.equal(firstHref(box), "/topics/tokenized-treasuries#treasury-evidence-checklist");
  assert.match(box, /2026-09-15 historical evidence snapshot|historical evidence/i);
  assert.doesNotMatch(box, /11350287|nexu888|bsmkweb|partner\.bitget|private commission|guaranteed yield|guaranteed ownership|account approval/i);
});

test("tokenized Treasury SC news handoff is localized and no longer starts with Coinbase generic profile", () => {
  const box = firstDecision(rendered.zhNews);
  assert.match(box, /代币化美债|美债/);
  assert.equal(firstHref(box), "/zh-hans/topics/tokenized-treasuries#treasury-evidence-checklist");
  assert.doesNotMatch(box, /coinbase|kraken|打开平台档案|查看站内档案/i);
  assert.doesNotMatch(box, /11350287|nexu888|bsmkweb|partner\.bitget|私有佣金|保证收益|账户批准|合资格徽章/i);
});

test("unsupported news locale keeps existing localized fallback instead of treasury-specific handoff", () => {
  const box = firstDecision(rendered.jaNews);
  assert.match(box, /この市場アップデートで行動する前に/);
  assert.equal(firstHref(box), "/ja/exchanges/coinbase");
  assert.doesNotMatch(box, /treasury-evidence-checklist|代币化美债核对清单/);
});

test("Treasury evidence checklist exposes a stable outer anchor for news handoff", () => {
  assert.match(rendered.enTopic, /<details[^>]*id="treasury-evidence-checklist"[^>]*class="treasury-evidence-checklist"/);
  assert.match(rendered.zhTopic, /<details[^>]*id="treasury-evidence-checklist"[^>]*class="treasury-evidence-checklist"/);
});

test("R108 protected commercial and historical source files remain byte-stable", async () => {
  for (const [filePath, expected] of protectedHashes) {
    const bytes = await readFile(new URL(`../${filePath}`, import.meta.url));
    if (filePath === "public/content/news-feed.json") assertVersionedAcceptedFeed(bytes, expected);
    else assert.equal(createHash("sha256").update(bytes).digest("hex"), expected, filePath);
  }
});
