// Owner 2026-10-10: news articles link the first plain-text mention of each partner exchange to its profile page and
// close with a "Related" line (profiles + curated comparison) when two partners are mentioned. Headings, code and
// existing links are never rewritten.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createPartnerAutolinker, relatedPartnerLinks, partnerMentionTargets, PARTNER_RELATED_COPY } from "../src/components/v3/news/partner-autolink.js";
import { getAllPartners } from "../src/data/partner-registry.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar"];
const fakeLink = ({ slug, href, text }) => ({ link: slug, href, text });

test("partner mention targets come from the registry and match whole names only", () => {
  const targets = partnerMentionTargets();
  assert.deepEqual(new Set(targets.map((t) => t.slug)), new Set(getAllPartners().map((p) => p.slug)));
  const okx = targets.find((t) => t.slug === "okx");
  assert.match("Open OKX today", okx.pattern);
  assert.match("OKX手续费对比", okx.pattern, "CJK text may touch the name");
  assert.doesNotMatch("OKXCOIN is different", okx.pattern);
  assert.doesNotMatch("myokx", okx.pattern);
  const gate = targets.find((t) => t.slug === "gate-io");
  assert.match("Gate.io lists it", gate.pattern);
  assert.doesNotMatch("GateXio lists it", gate.pattern, "the dot is literal");
});

test("only the first plain-text mention of each partner is linked; elements pass through untouched", () => {
  const linker = createPartnerAutolinker({ locale: "en", createLink: fakeLink });
  const existing = { element: "a", text: "Binance" };
  const out = linker.linkSegments(["Binance and OKX publish fees. ", existing, " Later Binance and OKX again, then Bitget."]);
  const links = out.filter((part) => typeof part === "object" && part.link);
  assert.deepEqual(links.map((l) => l.link), ["binance", "okx", "bitget"], "each partner linked once, in reading order");
  assert.equal(links[0].href, "/exchanges/binance");
  assert.equal(links[0].text, "Binance");
  assert.ok(out.includes(existing), "existing link element is untouched");
  assert.ok(out.filter((p) => typeof p === "string").join("").includes("Later Binance and OKX again"), "second mentions stay plain text");
  assert.deepEqual(linker.linkedSlugs(), ["binance", "okx", "bitget"]);
  assert.deepEqual(linker.mentionedSlugs(), ["binance", "okx", "bitget"]);
});

test("mentions in headings are observed but never linked; links use the locale path", () => {
  const linker = createPartnerAutolinker({ locale: "ja", createLink: fakeLink });
  linker.observe("## OKX の手数料");
  assert.deepEqual(linker.mentionedSlugs(), ["okx"]);
  assert.deepEqual(linker.linkedSlugs(), []);
  const out = linker.linkSegments(["Bitget と OKX を比較します。"]);
  const links = out.filter((p) => typeof p === "object");
  assert.deepEqual(links.map((l) => [l.link, l.href]), [["bitget", "/ja/exchanges/bitget"], ["okx", "/ja/exchanges/okx"]]);
});

test("related line appears from two partner mentions with a curated comparison and policy-aware labels in all locales", () => {
  assert.equal(relatedPartnerLinks({ locale: "en", slugs: ["okx"] }), null);
  for (const locale of LOCALES) {
    const related = relatedPartnerLinks({ locale, slugs: ["okx", "binance"] });
    assert.ok(related, locale);
    assert.equal(related.label, PARTNER_RELATED_COPY[locale].related);
    assert.deepEqual(related.profiles.map((p) => p.slug), ["okx", "binance"]);
    for (const profile of related.profiles) assert.ok(profile.label.includes(profile.name), `${locale}: label names the exchange`);
    assert.equal(related.compare.slug, "binance-vs-okx", `${locale}: curated order`);
    assert.ok(related.compare.href.endsWith("/compare/binance-vs-okx"), `${locale}: compare href`);
    assert.ok(related.compare.label.includes("Binance") && related.compare.label.includes("OKX"), `${locale}: compare label`);
    const prefix = locale === "en" ? "" : `/${locale === "id" ? "id-id" : locale.toLowerCase()}`;
    assert.equal(related.profiles[0].href, `${prefix}/exchanges/okx`, `${locale}: locale path`);
  }
  // neutral-title locales and tr for non-SPK venues do not say "rebate"
  assert.equal(relatedPartnerLinks({ locale: "ru", slugs: ["okx", "binance"] }).profiles[0].label, PARTNER_RELATED_COPY.ru.feesProfile("OKX"));
  assert.equal(relatedPartnerLinks({ locale: "tr", slugs: ["bitget", "bybit"] }).profiles[0].label, PARTNER_RELATED_COPY.tr.feesProfile("Bitget"));
  assert.equal(relatedPartnerLinks({ locale: "tr", slugs: ["bitget", "bybit"] }).profiles[1].label, PARTNER_RELATED_COPY.tr.feesRebate("Bybit"));
  assert.equal(relatedPartnerLinks({ locale: "en", slugs: ["okx", "binance"] }).profiles[0].label, "OKX fees & rebate");
  assert.equal(relatedPartnerLinks({ locale: "en", slugs: ["kraken", "deribit"] }).compare, null, "no invented comparison route");
});

async function renderArticle(content, locale) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-seo-onpage-news-"));
  try {
    const entryPath = path.join(tempDir, "entry.jsx");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { NewsDetailPage } from "../../src/components/v3/news/NewsDetailPage.jsx";
      import feed from "../../public/content/news-feed.json";
      const source = feed.articles.find((article) => article.slug === "okx-usd-to-usdc-spot-pair-migration");
      const article = { ...source, content: { en: ${JSON.stringify(content)} }, availableLocales: ["en"] };
      console.log(JSON.stringify(renderToStaticMarkup(React.createElement(NewsDetailPage, { slug: article.slug, locale: ${JSON.stringify(locale)}, initialArticles: [article] }))));
    `);
    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [entryPath, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundlePath}`, "--loader:.css=empty", "--loader:.svg=text", "--log-level=warning"], { cwd: projectRoot, stdio: "pipe" });
    return JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("server-rendered article links the first partner mention, skips headings/code/links and adds the related line", async () => {
  const content = [
    "## Direct answer",
    "## Why OKX and Binance differ",
    "Binance publishes tiers; OKX publishes a separate schedule. See `OKX API` for symbols and [Binance fees](https://www.binance.com/en/fee/schedule).",
    "Later OKX and Binance both appear again without links.",
  ].join("\n\n");
  const html = await renderArticle(content, "en");
  const bodyLinks = [...html.matchAll(/<a([^>]*data-partner-link="([a-z0-9-]+)"[^>]*)>([^<]+)<\/a>/g)].map((m) => ({ slug: m[2], href: m[1].match(/href="([^"]+)"/)[1], text: m[3] }));
  assert.deepEqual(bodyLinks.map((m) => m.slug), ["binance", "okx"], "one body link per partner");
  assert.ok(bodyLinks[0].href.startsWith("/exchanges/binance"), bodyLinks[0].href);
  assert.equal(bodyLinks[0].text, "Binance", "anchor text is the exchange name");
  assert.doesNotMatch(html, /<h2[^>]*>[^<]*<a/, "no link inside a heading");
  assert.doesNotMatch(html, /<code>[^<]*<a/, "no link inside code");
  assert.match(html, /<a href="https:\/\/www\.binance\.com\/en\/fee\/schedule"[^>]*>Binance fees<\/a>/, "existing link untouched");
  const related = html.match(/<p class="news-detail__related-partners"[^>]*>([\s\S]*?)<\/p>/);
  assert.ok(related, "related line present");
  assert.match(related[1], /Related:/);
  assert.match(related[1], /data-related-partner="binance"[^>]*>Binance fees &amp; rebate</);
  assert.match(related[1], /data-related-partner="okx"[^>]*>OKX fees &amp; rebate</);
  assert.match(related[1], /data-related-compare="binance-vs-okx"[^>]*>Compare Binance vs OKX</);
  const single = await renderArticle("## Direct answer\n\nOnly OKX is mentioned here.", "en");
  assert.doesNotMatch(single, /news-detail__related-partners/, "no related line with one partner");
  assert.equal((single.match(/data-partner-link=/g) || []).length, 1);
});
