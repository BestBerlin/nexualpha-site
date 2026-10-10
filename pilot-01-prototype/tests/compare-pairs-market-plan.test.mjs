// 2026-10-10 market-plan comparison pairs: binance-vs-bitget, bitget-vs-okx, bybit-vs-mexc, bitget-vs-mexc.
// Route metadata in all 15 locales, locale sitemap inclusion, reverse-slug redirects, curated navigation and an SSR
// render that shows both partner sign-up routes next to the commission disclosure.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import worker, { renderLocaleSitemap, routeMetadata } from "../worker/index.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { compareDirectAnswerFor } from "../src/data/compare-direct-answers.js";
import { comparePairAnswerSlugs, comparePairAnswers, COMPARE_PAIR_LOCALES } from "../src/data/compare-pair-answers.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { CURATED_COMPARISONS, sitemapLocalesForRoute } from "../scripts/generate-prerender-manifest.mjs";
import { venueDatabase } from "../src/data/venue-database.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
// JSX cannot be imported by node:test directly; the curated navigation list is read from source.
const v3PagesSource = await readFile(path.join(projectRoot, "src/components/v3/V3Pages.jsx"), "utf8");
const goldenSource = v3PagesSource.slice(v3PagesSource.indexOf("export const GOLDEN_COMPARE_PAIRS = ["), v3PagesSource.indexOf("export function CompareGoldMatrixNav"));
const GOLDEN_COMPARE_PAIRS = [...goldenSource.matchAll(/\{\s*slug: "([a-z-]+)",\s*left: "([a-z-]+)",\s*right: "([a-z-]+)",[\s\S]*?title: (\{[^\n]*\}),\s*tagline: (\{[^\n]*\}),/g)].map((match) => ({
  slug: match[1],
  left: match[2],
  right: match[3],
  title: Function(`return (${match[4]});`)(),
  tagline: Function(`return (${match[5]});`)(),
}));
const PAIRS = ["binance-vs-bitget", "bitget-vs-okx", "bybit-vs-mexc", "bitget-vs-mexc"];
const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"];
const GENERIC_TITLE = /Trading Fees & Platform Comparison|手续费与平台选择|手續費與平台選擇|取引手数料とプラットフォーム比較|거래 수수료 및 플랫폼 비교/;
// Numbers are rendered from venue data, never written into the narrative copy.
const FEE_FIGURE = /\d+(?:[.,]\d+)?\s?%|\d+x\b/;
// Comparison copy stays neutral: no referral solicitation in any locale.
const SOLICITATION = /referral code|invite code|邀请码|邀請碼|紹介コード|추천 코드|رمز الإحالة|referans kodu|реферальн|kode referral|mã giới thiệu|codice referral|código de referido|código de indicação|code de parrainage|Empfehlungscode/i;

test("the four market-plan pairs are registered everywhere a curated comparison must appear", () => {
  assert.deepEqual([...comparePairAnswerSlugs].sort(), [...PAIRS].sort());
  for (const pair of PAIRS) {
    assert.ok(CURATED_COMPARISONS.includes(pair), `${pair} in prerender curated list`);
    assert.ok(GOLDEN_COMPARE_PAIRS.some((entry) => entry.slug === pair), `${pair} in curated navigation`);
    const [left, right] = pair.split("-vs-");
    const card = GOLDEN_COMPARE_PAIRS.find((entry) => entry.slug === pair);
    assert.equal(card.left, left);
    assert.equal(card.right, right);
    for (const key of ["en", "zh-Hans", "zh-Hant"]) {
      assert.ok(card.title[key] && card.tagline[key], `${pair} ${key} card copy`);
    }
    assert.deepEqual(sitemapLocalesForRoute({ pathname: `/compare/${pair}`, template: "comparison", index: true }, LOCALES).sort(), ["en", "ja", "ko", "tr", "zh-Hans"].sort());
    assert.ok(venueDatabase[left] && venueDatabase[right], `${pair} venues exist in venue data`);
  }
});

test("every pair carries natural copy in all 15 locales without invented figures or referral solicitation", () => {
  assert.deepEqual([...COMPARE_PAIR_LOCALES], LOCALES);
  for (const pair of PAIRS) {
    const [left, right] = pair.split("-vs-");
    for (const locale of LOCALES) {
      const answer = compareDirectAnswerFor(pair, locale);
      assert.ok(answer, `${pair} ${locale} answer`);
      assert.equal(answer.locale, locale);
      assert.equal(answer.reviewedAt, "2026-10-10");
      const picks = answer.decisionCard.picks;
      assert.ok(picks[left]?.fit && picks[left]?.verify && picks[right]?.fit && picks[right]?.verify, `${pair} ${locale} picks`);
      assert.ok(answer.faq.length >= 3, `${pair} ${locale} faq count`);
      assert.ok(answer.sourceLinks.length >= 4 && answer.internalLinks.length >= 3, `${pair} ${locale} links`);
      const strings = [answer.ownerQuestion, answer.title, answer.body, answer.decisionCard.title, answer.boundary, answer.seoTitle, answer.seoDescription, answer.seoQuestion, picks[left].fit, picks[left].verify, picks[right].fit, picks[right].verify, ...answer.faq.flat()];
      for (const text of strings) {
        assert.ok(typeof text === "string" && text.trim().length > 0, `${pair} ${locale} empty string`);
        assert.doesNotMatch(text, FEE_FIGURE, `${pair} ${locale} figure in copy: ${text}`);
        assert.doesNotMatch(text, SOLICITATION, `${pair} ${locale} solicitation: ${text}`);
      }
      assert.match(answer.seoTitle, / — NexuAlpha$/);
      // Copy is locale-native, not an English fallback (the two Chinese scripts and non-Latin locales are checked by script).
      if (locale === "zh-Hans" || locale === "zh-Hant") assert.match(answer.body, /[\u4e00-\u9fff]/);
      if (locale === "ja") assert.match(answer.body, /[\u3040-\u30ff]/);
      if (locale === "ko") assert.match(answer.body, /[\uac00-\ud7af]/);
      if (locale === "ar") assert.match(answer.body, /[\u0600-\u06ff]/);
      if (locale === "ru") assert.match(answer.body, /[\u0400-\u04ff]/);
    }
    // Locale copy is pair-specific, not one template with the names swapped.
    const enBodies = PAIRS.map((slug) => comparePairAnswers[slug].en.body);
    assert.equal(new Set(enBodies).size, PAIRS.length);
  }
});

test("Worker route metadata publishes the four pairs in all 15 locales with canonical, hreflang and locale FAQ", async () => {
  for (const pair of PAIRS) {
    for (const locale of LOCALES) {
      const loc = `https://nexualpha.com${localizedPath(`/compare/${pair}`, locale)}`;
      const meta = await routeMetadata(new URL(loc), {});
      const label = `${pair} ${locale}`;
      assert.equal(meta.status, 200, label);
      assert.equal(meta.robots, "index,follow", label);
      assert.equal(meta.canonical, loc, label);
      assert.doesNotMatch(meta.title, GENERIC_TITLE, label);
      const alternates = meta.alternates || [];
      assert.equal(alternates.length, LOCALES.length + 1, `${label} hreflang count`);
      assert.deepEqual(alternates.map((alt) => alt.hreflang).sort(), [...LOCALES, "x-default"].sort(), `${label} hreflang set`);
      assert.equal(alternates.find((alt) => alt.hreflang === locale)?.href, loc, `${label} self hreflang`);
      const graph = meta.schema?.["@graph"] || (Array.isArray(meta.schema) ? meta.schema : [meta.schema]);
      const faq = graph.find((schema) => schema?.["@type"] === "FAQPage");
      const expected = compareDirectAnswerFor(pair, locale);
      assert.ok(faq?.mainEntity?.length >= 4, `${label} FAQPage`);
      assert.equal(faq.mainEntity[0].name, expected.seoQuestion, `${label} direct answer question`);
      assert.equal(meta.title, expected.seoTitle, `${label} title`);
      assert.equal(meta.description, expected.seoDescription, `${label} description`);
      // The SSR metadata path reads the same source.
      const client = computeRouteSeo({ url: `${loc}`, locale });
      assert.equal(client.title, meta.title, `${label} SSR title parity`);
      assert.equal(client.description, meta.description, `${label} SSR description parity`);
      assert.equal(client.canonical, meta.canonical, `${label} SSR canonical parity`);
    }
  }
});

test("existing curated pairs keep their metadata and the reverse slugs redirect to the canonical order", async () => {
  const existing = await routeMetadata(new URL("https://nexualpha.com/compare/binance-vs-bybit"), {});
  assert.equal(existing.status, 200);
  assert.equal(existing.robots, "index,follow");
  assert.match(existing.title, /^Binance vs Bybit/);
  for (const [reversed, canonical] of [
    ["/compare/bitget-vs-binance", "/compare/binance-vs-bitget"],
    ["/compare/okx-vs-bitget", "/compare/bitget-vs-okx"],
    ["/compare/mexc-vs-bybit", "/compare/bybit-vs-mexc"],
    ["/compare/mexc-vs-bitget", "/compare/bitget-vs-mexc"],
  ]) {
    const response = await worker.fetch(new Request(`https://nexualpha.com/tr${reversed}?utm_source=gsc`, { headers: { accept: "text/html" }, redirect: "manual" }), {});
    assert.equal(response.status, 301, reversed);
    assert.equal(response.headers.get("location"), `https://nexualpha.com/tr${canonical}?utm_source=gsc`, reversed);
  }
});

test("locale sitemap lists the four pairs for every locale with matching hreflang rows", async () => {
  const xml = await renderLocaleSitemap({});
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  for (const pair of PAIRS) {
    for (const locale of LOCALES) {
      const loc = `https://nexualpha.com${localizedPath(`/compare/${pair}`, locale)}`;
      assert.ok(locs.includes(loc), loc);
    }
    const block = xml.slice(xml.indexOf(`<loc>https://nexualpha.com/compare/${pair}</loc>`));
    const entry = block.slice(0, block.indexOf("</url>"));
    assert.equal((entry.match(/hreflang="/g) || []).length, LOCALES.length + 1, `${pair} hreflang rows`);
  }
});

async function renderComparePage(pair, locale) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-compare-pairs-market-plan-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const [left, right] = pair.split("-vs-");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { CompareDeepPage } from "../../src/components/v3/V3Pages.jsx";
      import { venueDatabase } from "../../src/data/venue-database.js";
      import { v3Copy } from "../../src/data/v3-product.js";
      const locale = ${JSON.stringify(locale)};
      const html = renderToStaticMarkup(React.createElement(CompareDeepPage, {
        copy: { ...v3Copy(locale), common: { dimension: "Dimension" }, assetCapabilities: { none: "None" } },
        locale,
        selected: [${JSON.stringify(left)}, ${JSON.stringify(right)}],
        venues: Object.values(venueDatabase),
        updates: [],
        market: "unknown",
        product: "unknown",
      }));
      console.log(html);
    `);
    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await access(esbuildBin);
    execFileSync(esbuildBin, [entryPath, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundlePath}`, "--loader:.css=empty", "--loader:.svg=text", "--loader:.webp=file", "--log-level=warning"], { cwd: projectRoot, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
    const bundle = await readFile(bundlePath, "utf8");
    return execFileSync("node", ["-"], { cwd: projectRoot, input: bundle, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("SSR renders both venue sign-up routes beside the commission disclosure for the new pairs", async () => {
  for (const [pair, locale] of [["binance-vs-bitget", "en"], ["bybit-vs-mexc", "zh-Hans"], ["bitget-vs-okx", "tr"], ["bitget-vs-mexc", "ar"]]) {
    const html = await renderComparePage(pair, locale);
    const [left, right] = pair.split("-vs-");
    const answer = compareDirectAnswerFor(pair, locale);
    const label = `${pair} ${locale}`;
    assert.match(html, new RegExp(`<h1[^>]*>${answer.ownerQuestion.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "(?:'|&#x27;)")}</h1>`), `${label} question H1`);
    const finalChoice = html.slice(html.indexOf('id="compare-final-choice"'));
    const card = finalChoice.slice(0, finalChoice.indexOf("</article>") + 10);
    assert.ok(card.includes('class="commission-disclosure-line v3-compare-final-choice-card__disclosure"'), `${label} disclosure inside the final-choice card`);
    for (const slug of [left, right]) {
      const anchor = card.match(new RegExp(`<a[^>]+data-cta-platform="${slug}"[^>]+data-cta-placement="compare-final-choice-registration"[^>]*>`))?.[0];
      assert.ok(anchor, `${label} ${slug} sign-up route`);
      assert.match(anchor, /href="https?:\/\//, `${label} ${slug} external href`);
      assert.match(anchor, /rel="sponsored noopener noreferrer"/, `${label} ${slug} sponsored rel`);
    }
    // The sticky bar and the hero versus card also carry one route per venue.
    for (const slug of [left, right]) {
      assert.match(html, new RegExp(`data-cta-platform="${slug}"[^>]+data-cta-placement="compare-sticky-registration"`), `${label} ${slug} sticky route`);
      assert.match(html, new RegExp(`data-cta-platform="${slug}"[^>]+data-cta-placement="compare-hero-versus"`), `${label} ${slug} hero route`);
    }
    assert.match(html, /data-disclosure-placement="compare-versus"/, `${label} versus disclosure`);
    // The visible FAQ shows the locale questions and the fee row comes from venue data (or the pending state), not from copy.
    assert.ok(html.includes(answer.faq[0][0]), `${label} first FAQ question visible`);
    assert.match(html, /id="compare-faq"/, `${label} faq section`);
    assert.doesNotMatch(html, /undefined|\[object Object\]/, `${label} no undefined leaks`);
  }
});
