import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { NEWS_DISPLAY_LOCALES } from "../src/data/news-feed-client.js";
import { buildTelegramWebsiteFunnelContext, resolveTelegramWebsiteStartPayloadRuntime } from "../src/data/telegram-config.js";
import { venueDatabase } from "../src/data/venue-database.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const krakenNewsSlug = "kraken-crypto-withdrawal-network-address-confirmation-checklist";

async function renderNewsFixtures() {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-r233-news-bot-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { readFileSync } from "node:fs";
      import { NewsDetailPage } from "../../src/components/v3/news/NewsDetailPage.jsx";
      import { NEWS_DISPLAY_LOCALES } from "../../src/data/news-feed-client.js";
      const feed = JSON.parse(readFileSync("public/content/news-feed.json", "utf8"));
      const base = feed.articles.find((article) => article.slug === ${JSON.stringify(krakenNewsSlug)});
      if (!base) throw new Error("missing kraken news fixture");
      const renderCase = (relatedVenues, locale = "en", slug = base.slug) => {
        const article = structuredClone(base);
        article.slug = slug;
        article.relatedVenues = relatedVenues;
        article.seo = { ...(article.seo || {}), internalLinkTargets: [] };
        return renderToStaticMarkup(React.createElement(NewsDetailPage, {
          slug,
          locale,
          market: "unknown",
          product: "spot",
          initialArticles: [article],
        }));
      };
      const htmlByLocale = Object.fromEntries(NEWS_DISPLAY_LOCALES.map((locale) => [locale, renderCase(["kraken"], locale)]));
      const output = {
        htmlByLocale,
        noVenue: renderCase([], "en", "r233-no-venue-fixture"),
        invalidOnly: renderCase(["not-a-real-venue"], "en", "r233-invalid-venue-fixture"),
        invalidThenKraken: renderCase(["not-a-real-venue", "kraken"], "en", "r233-invalid-then-kraken-fixture"),
        coinbaseThenKraken: renderCase(["coinbase", "kraken"], "en", "r233-coinbase-then-kraken-fixture"),
      };
      console.log(JSON.stringify(output));
    `);

    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [
      entryPath,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundlePath}`,
      "--loader:.css=empty",
      "--loader:.svg=text",
      "--loader:.webp=file",
      "--log-level=warning",
    ], { cwd: projectRoot, stdio: "pipe" });

    return JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function extractTelegramStart(html) {
  return html.match(/data-telegram-start="([^"]+)"/)?.[1] || "";
}

function extractTelegramReturnHref(html) {
  return (html.match(/data-telegram-return-href="([^"]+)"/)?.[1] || "").replaceAll("&amp;", "&");
}

function telegramHandoffCount(html) {
  return (html.match(/data-telegram-canonical="\/news\/[^"]+"/g) || []).length;
}

test("Telegram website codec supports Kraken monitor without silently falling back to Binance", () => {
  assert.equal(venueDatabase.kraken?.slug, "kraken");
  const funnel = buildTelegramWebsiteFunnelContext({
    intent: "monitor",
    venue: "kraken",
    locale: "en",
    product: "spot",
    returnRoute: `/news/${krakenNewsSlug}`,
  });
  assert.equal(funnel.botTarget.venue, "kraken");
  assert.match(funnel.startPayload, /^monitor_kraken(?:_|$)/);
  assert.doesNotMatch(funnel.startPayload, /monitor_binance/);
  assert.match(funnel.deepLink, /start=monitor_kraken/);
  assert.match(funnel.returnHref, new RegExp(`/news/${krakenNewsSlug}`));
  const restored = resolveTelegramWebsiteStartPayloadRuntime({ start: funnel.startPayload });
  assert.equal(restored.status, "restored");
  assert.equal(restored.parsed?.action, "monitor");
  assert.equal(restored.parsed?.venue, "kraken");
});

test("news detail SSR passes the first valid related venue into the Telegram monitor while preserving the news return route", async () => {
  const rendered = await renderNewsFixtures();
  for (const locale of NEWS_DISPLAY_LOCALES) {
    const html = rendered.htmlByLocale[locale];
    assert.equal(telegramHandoffCount(html), 1, `${locale} renders one explicit news handoff`);
    assert.match(extractTelegramStart(html), /^monitor_kraken(?:_|$)/, `${locale} uses the Kraken monitor payload`);
    assert.doesNotMatch(extractTelegramStart(html), /monitor_binance/, `${locale} never falls back to Binance`);
    assert.match(extractTelegramReturnHref(html), new RegExp(`/news/${krakenNewsSlug}`), `${locale} keeps the news route return href`);
  }
});

test("news detail SSR omits the monitor handoff when no valid related venue exists", async () => {
  const rendered = await renderNewsFixtures();
  for (const html of [rendered.noVenue, rendered.invalidOnly]) {
    assert.equal(telegramHandoffCount(html), 0);
    assert.equal(extractTelegramStart(html), "");
    assert.doesNotMatch(html, /monitor_binance/);
  }
});

test("news detail SSR skips invalid related venues and preserves ordered first-valid venue selection", async () => {
  const rendered = await renderNewsFixtures();
  assert.match(extractTelegramStart(rendered.invalidThenKraken), /^monitor_kraken(?:_|$)/);
  assert.doesNotMatch(extractTelegramStart(rendered.invalidThenKraken), /monitor_binance/);
  assert.match(extractTelegramReturnHref(rendered.invalidThenKraken), /\/news\/r233-invalid-then-kraken-fixture/);
  assert.match(extractTelegramStart(rendered.coinbaseThenKraken), /^monitor_coinbase(?:_|$)/);
  assert.doesNotMatch(extractTelegramStart(rendered.coinbaseThenKraken), /monitor_kraken/);
  assert.match(extractTelegramReturnHref(rendered.coinbaseThenKraken), /\/news\/r233-coinbase-then-kraken-fixture/);
});
