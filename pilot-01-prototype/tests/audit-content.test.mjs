// External audit 2026-10-11, content batch: NX-10 (raw Markdown links in articles), NX-09 (meta descriptions cut
// mid-sentence), NX-05 (/onchain promised a live board), NX-07 (English payment labels, "1 plateformes", repeated
// eligibility entries). 4.6 (Compare nav -> /compare hub) is covered in tests/ux-polish-review.test.mjs.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { countRawMarkdownLinks, inlineMarkdownHtml, resolveArticleLinkHref, tokenizeInlineMarkdown } from "../src/data/article-inline-markdown.js";
import { budgetTitle, clampMetaDescription, endsWithDanglingWord, metaDescriptionLimit, routeMetaDescription, titleBudgetForLocale } from "../src/data/meta-description.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";
import { ONCHAIN_GUIDE_LOCALES, onchainGuideReserveSources, onchainGuideSeo } from "../src/data/onchain-guide.js";
import { venueDatabase } from "../src/data/venue-database.js";
import { LOCALIZED_PAYMENT_METHODS, paymentMethodLabel, paymentMethodLabels } from "../src/data/payment-method-labels.js";
import { PLURAL_COPY_LOCALES, platformCount, showFewerPlatforms, showMorePlatforms } from "../src/data/plural-copy.js";
import { textEntryKey } from "../src/utils/unique-text.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"];
const PREFIX = { en: "", "zh-Hans": "/zh-hans", "zh-Hant": "/zh-hant", "pt-BR": "/pt-br", id: "/id-id", uk: "/uk-ua" };
const localePath = (locale, pathname) => `${PREFIX[locale] ?? `/${locale}`}${pathname}`;

// Paragraphs modeled on the production article that showed six raw links (okx-unified-tokenized-stocks-...).
const ARTICLE_MARKDOWN = [
  "## Direct answer",
  "OKX lists these stocks. Our framework on [custodial vs synthetic tokenized stocks](/news/custodial-vs-synthetic-tokenized-stocks-shareholder-rights-framework) explains the difference.",
  "Dividends follow the issuer; see how Bitget handles its [ACN stock perp](/news/bitget-acn-stock-perp-dividend-settlement-longs-shorts) on 13 Oct.",
  "- Read **the [tokenized stocks vs stock perpetuals](/news/tokenized-stocks-vs-stock-perpetuals) guide** first\n- Check fees (see [/rates](/rates)) and *the [OKX profile](/exchanges/okx)*\n- Unknown target [internal tool](/admin/tools) and script [x](javascript:alert(1))",
  "| Route | Link |\n| --- | --- |\n| Activities | [/activities](/activities) |\n| Funding | [funding rates](/funding-rates) |",
  "> Quote with a [Bybit vs Bitget comparison](/compare/bybit-vs-bitget) inside.",
  "Official source: [OKX announcement](https://www.okx.com/help/x). Later OKX and Bitget appear again.",
].join("\n\n");

test("NX-10 tokenizer links allowed internal paths and https URLs in every inline context", () => {
  const html = inlineMarkdownHtml("A [one](/news/a-b) b **bold [two](/exchanges/okx)** c *em [three](/compare/x-vs-y)* (see [four](/rates)) `[code](/news/x)` [ext](https://example.com/a_(b))", { locale: "en" });
  assert.match(html, /<a href="\/news\/a-b">one<\/a>/);
  assert.match(html, /<strong>bold <a href="\/exchanges\/okx">two<\/a><\/strong>/);
  assert.match(html, /<em>em <a href="\/compare\/x-vs-y">three<\/a><\/em>/);
  assert.match(html, /\(see <a href="\/rates">four<\/a>\)/);
  assert.match(html, /<code>\[code\]\(\/news\/x\)<\/code>/, "code spans stay literal");
  assert.match(html, /<a href="https:\/\/example\.com\/a_\(b\)" target="_blank" rel="noopener noreferrer">ext<\/a>/);
  for (const allowed of ["/news/x", "/exchanges/okx", "/compare/a-vs-b", "/rates", "/activities", "/liquidations", "/funding-rates", "/topics/no-kyc", "/factbook/okx"]) {
    assert.ok(resolveArticleLinkHref(allowed, "en"), allowed);
  }
  for (const blocked of ["/admin", "/api/x", "//evil.example", "javascript:alert(1)", "mailto:a@b.c", "pilot-01/config/source-registry.json"]) {
    assert.equal(resolveArticleLinkHref(blocked, "en"), null, blocked);
  }
  assert.equal(resolveArticleLinkHref("/zh-hans/news/x", "ja").href, "/ja/news/x", "locale-prefixed targets follow the reader's locale");
  assert.equal(inlineMarkdownHtml("[label](/admin/tools) and [x](javascript:alert(1))"), "label and x", "a blocked target keeps only its label");
  assert.equal(countRawMarkdownLinks(tokenizeInlineMarkdown("a [b](/news/c) d").map((t) => t.text ?? "").join("")), 0);
});

test("NX-10 the worker fallback article HTML uses the shared tokenizer", async () => {
  const worker = await readFile(new URL("../worker/index.js", import.meta.url), "utf8");
  assert.match(worker, /import \{ inlineMarkdownHtml \} from "\.\.\/src\/data\/article-inline-markdown\.js"/);
  assert.doesNotMatch(worker, /linkPattern = \/\\\[\(\[\^\\\]\]\+\)\\\]\\\(\(https\?/, "the https-only link pattern is gone");
});

async function bundleAndRun(entrySource) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-audit-content-"));
  try {
    const entryPath = path.join(tempDir, "entry.jsx");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, entrySource);
    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [entryPath, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundlePath}`, "--loader:.css=empty", "--loader:.svg=text", "--log-level=error"], { cwd: projectRoot, stdio: "pipe" });
    return JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

const rendered = await bundleAndRun(`
  import React from "react";
  import { renderToStaticMarkup } from "react-dom/server";
  import { NewsDetailPage } from "../../src/components/v3/news/NewsDetailPage.jsx";
  import { OnChainLiquidityBoard } from "../../src/components/v3/OnChainLiquidityBoard.jsx";
  import { ExchangeFactsV5 } from "../../src/components/v3/ExchangeFactsV5.jsx";
  import { v3Copy, venueProfile } from "../../src/data/v3-product.js";
  import { venueDatabase } from "../../src/data/venue-database.js";
  import feed from "../../public/content/news-feed.json";
  const source = feed.articles.find((article) => article.slug === "okx-usd-to-usdc-spot-pair-migration");
  const article = { ...source, content: { en: ${JSON.stringify(ARTICLE_MARKDOWN)} }, availableLocales: ["en"] };
  const out = { article: {}, onchain: {}, facts: {}, profiles: {}, resultVenues: { fr: v3Copy("fr").resultVenues(1), es: v3Copy("es").resultVenues(1) } };
  for (const locale of ["en", "ja"]) out.article[locale] = renderToStaticMarkup(React.createElement(NewsDetailPage, { slug: article.slug, locale, initialArticles: [article] }));
  for (const locale of ${JSON.stringify(LOCALES)}) {
    out.onchain[locale] = renderToStaticMarkup(React.createElement(OnChainLiquidityBoard, { locale, headingLevel: 1 }));
    const venue = { ...venueDatabase.okx, slug: "okx", name: "OKX", category: "CEX" };
    out.facts[locale] = renderToStaticMarkup(React.createElement(ExchangeFactsV5, { slug: "okx", locale, profile: venueProfile(venue, locale) }));
    out.profiles[locale] = Object.entries(venueDatabase).map(([slug, record]) => {
      const profile = venueProfile({ ...record, slug, name: record.name || slug, category: record.category || "CEX" }, locale);
      return { slug, items: [...(profile.checks || []), ...(profile.limitations || [])] };
    });
  }
  console.log(JSON.stringify(out));
`);

const decode = (html) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'");
const prose = (html) => html.slice(html.indexOf('class="news-detail__prose'));

test("NX-10 SSR article: no raw Markdown link survives in paragraphs, lists, tables, quotes, bold, italics or parentheses", () => {
  const html = rendered.article.en;
  assert.equal(countRawMarkdownLinks(decode(prose(html))), 0, "no [label](target) text in the rendered article");
  for (const href of ["/news/custodial-vs-synthetic-tokenized-stocks-shareholder-rights-framework", "/news/bitget-acn-stock-perp-dividend-settlement-longs-shorts", "/news/tokenized-stocks-vs-stock-perpetuals", "/rates", "/exchanges/okx", "/activities", "/funding-rates", "/compare/bybit-vs-bitget"]) {
    assert.match(html, new RegExp(`<a href="${href.replace(/[/.-]/g, "\\$&")}">`), href);
  }
  assert.match(html, /<li>Read <strong>the <a href="\/news\/tokenized-stocks-vs-stock-perpetuals">tokenized stocks vs stock perpetuals<\/a> guide<\/strong> first<\/li>/);
  assert.match(html, /<td><a href="\/activities">\/activities<\/a><\/td>/);
  assert.match(html, /<blockquote><p>Quote with a <a href="\/compare\/bybit-vs-bitget">Bybit vs Bitget comparison<\/a> inside\.<\/p><\/blockquote>/);
  assert.match(html, /<em>the <a href="\/exchanges\/okx">OKX profile<\/a><\/em>/);
  assert.doesNotMatch(html, /javascript:|\/admin\/tools/);
  assert.match(html, /Unknown target internal tool and script x/);
  assert.match(html, /<a href="https:\/\/www\.okx\.com\/help\/x" target="_blank" rel="noopener noreferrer">OKX announcement<\/a>/);
  // Partner autolink: first plain-text mention only, never inside an existing link.
  const partner = [...html.matchAll(/data-partner-link="([a-z0-9-]+)"[^>]*>([^<]+)</g)].map((m) => m[1]);
  assert.equal(partner.filter((slug) => slug === "okx").length, 1, "OKX autolinked once");
  assert.doesNotMatch(html, /<a [^>]*>[^<]*<a /, "no nested links");
  assert.match(rendered.article.ja, /<a href="\/ja\/news\/bitget-acn-stock-perp-dividend-settlement-longs-shorts">/, "internal links follow the reading locale");
});

test("NX-09 descriptions end on a complete sentence or a clean clause cut, never on a dangling word", () => {
  const sample = "OKX Unified Tokenized Stocks (xStocks-based, 24/7, USDT pairs) give share-for-share price exposure, not ownership. Rights, dividends, U.S. restriction, the Oct 9 and Oct 12 listings and costs explained.";
  assert.equal(clampMetaDescription(sample, "en"), "OKX Unified Tokenized Stocks (xStocks-based, 24/7, USDT pairs) give share-for-share price exposure, not ownership.");
  assert.ok(endsWithDanglingWord("Rights, dividends, U.S. restriction, the Oct"));
  assert.ok(endsWithDanglingWord("fees fell to 0.08"));
  assert.ok(!endsWithDanglingWord("Fees explained."));
  const noSentence = "Compare fees across venues including Binance, OKX, Bybit, Bitget, Kraken and Coinbase with the published maker and taker rates for spot and futures and the conditions for VIP tiers in October 2026 and the";
  const cut = clampMetaDescription(noSentence, "en");
  assert.ok(cut.endsWith("…") && cut.length <= 160 && cut.length >= 112, cut);
  assert.ok(!endsWithDanglingWord(cut), cut);
  const zh = "OKX 统一代币化股票（Unified Tokenized Stocks）是一类现货资产，命名方式是在美股代码前加一个“X”，按“股”为单位提供美股或 ETF 的价格敞口，以 USDT 计价，全天候交易。 它基于 Payward 的 xStocks 框架";
  const zhCut = clampMetaDescription(zh, "zh-Hans");
  assert.ok(zhCut.length <= metaDescriptionLimit("zh-Hans", zhCut) && (zhCut.endsWith("…") || /[。！？]$/.test(zhCut)), zhCut);
  assert.equal(clampMetaDescription("Short and complete.", "en"), "Short and complete.");
});

test("NX-09 every article route in the feed gets a non-dangling meta description within budget, matching the Worker clamp", async () => {
  const feed = JSON.parse(await readFile(new URL("../public/content/news-feed.json", import.meta.url), "utf8"));
  let checked = 0;
  for (const article of feed.articles) {
    for (const locale of LOCALES) {
      const seo = computeRouteSeo({ url: `https://nexualpha.com${localePath(locale, `/news/${article.slug}`)}`, locale, article, newsArticles: feed.articles });
      if (seo.status !== 200) continue;
      checked += 1;
      assert.ok(seo.description.length <= metaDescriptionLimit(seo.locale, seo.description), `${locale} ${article.slug}: over budget`);
      assert.ok(!endsWithDanglingWord(seo.description), `${locale} ${article.slug}: "${seo.description.slice(-40)}"`);
      assert.ok(!endsWithDanglingWord(clampMetaDescription(seo.description, seo.locale)), "clamped text remains clean");
    }
  }
  assert.ok(checked > feed.articles.length * 10, `checked ${checked} routes`);
});

test("NX-05 /onchain is a verification guide in all 17 locales: honest title, description, schema and status", async () => {
  const forbidden = /\b(board|dashboard|live)\b|看板|ボード|보드|panosu|\bPanel\b|Painel|Tableau|Pannello|Панель|لوحة|Papan|Bảng/i;
  assert.deepEqual([...ONCHAIN_GUIDE_LOCALES].sort(), [...LOCALES].sort());
  const sources = onchainGuideReserveSources();
  assert.ok(sources.length >= 6, "official PoR pages come from the venue records");
  for (const source of sources) {
    assert.equal(source.url, venueDatabase[source.slug].porAuditUrl, `${source.slug}: URL read from venue-database.js`);
    assert.match(source.url, /^https:\/\/[^/]+\/.*proof-of-reserves/);
  }
  for (const locale of LOCALES) {
    const seo = onchainGuideSeo(locale);
    assert.doesNotMatch(seo.title, forbidden, `${locale} title`);
    assert.ok(seo.title.length <= 70, `${locale} title length ${seo.title.length}`);
    assert.ok(seo.description.length <= metaDescriptionLimit(locale, seo.description), `${locale} description fits without clamping`);
    const url = new URL(`https://nexualpha.com${localePath(locale, "/onchain")}`);
    const worker = await routeMetadata(url, {});
    const client = computeRouteSeo({ url: url.href, locale });
    assert.equal(worker.status, 200);
    assert.equal(worker.robots, ["ur", "uk"].includes(locale) ? "noindex,follow" : "index,follow", `${locale}: native-review gate; others indexable`);
    // Class b: 3c54a66 budgets long head titles by removing the brand suffix.
    assert.equal(worker.title, budgetTitle(seo.title, titleBudgetForLocale(locale)), `${locale} worker title`);
    assert.equal(worker.description, routeMetaDescription(worker.title, seo.description, locale), `${locale} worker description`);
    assert.equal(client.title, worker.title, `${locale} SSR/client title parity`);
    assert.equal(client.description, worker.description, `${locale} SSR/client description parity`);
    const schema = Array.isArray(worker.schema) ? worker.schema[0] : worker.schema;
    assert.equal(schema["@type"], "WebPage");
    assert.deepEqual(schema.citation, sources.map((s) => s.url));
    assert.doesNotMatch(JSON.stringify(schema), /Dataset|solvency board/i);
  }
});

test("NX-05 /onchain body: guide H1, plain 'not published' status, official report links and the not-a-guarantee note", () => {
  const sources = onchainGuideReserveSources();
  for (const locale of LOCALES) {
    const html = rendered.onchain[locale];
    const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1] || "";
    assert.ok(h1, `${locale}: one H1`);
    assert.equal((html.match(/<h1/g) || []).length, 1);
    assert.doesNotMatch(h1, /board|dashboard|看板|ボード|보드|panosu|Panel|Painel|Tableau|Pannello|Панель|لوحة|Papan|Bảng/i, `${locale} H1`);
    assert.match(html, /role="status" data-live-metrics="not-published">[^<]{20,}</, `${locale}: status says live metrics are not published`);
    for (const source of sources) assert.ok(html.includes(`href="${source.url}"`), `${locale}: ${source.slug} official report link`);
    assert.doesNotMatch(html, /rel="sponsored|<table/, `${locale}: no partner table or sponsored link`);
    assert.match(html, /class="onchain-board__guarantee"[\s\S]*?<p>[^<]{40,}<\/p>/, `${locale}: visible not-a-guarantee note`);
    assert.match(html, /<ol>(<li>[^<]+<\/li>){5}<\/ol>/, `${locale}: five reading steps`);
  }
  assert.match(rendered.onchain.en, /not a solvency or safety guarantee/);
  assert.match(rendered.onchain["zh-Hans"], /不是偿付能力或资金安全保证/);
  assert.match(rendered.onchain.ja, /支払能力や安全の保証でも/);
});

test("NX-07 generic payment labels are localized in all 17 locales; brands stay as recorded", () => {
  for (const method of LOCALIZED_PAYMENT_METHODS) {
    for (const locale of LOCALES.filter((code) => code !== "en")) {
      const label = paymentMethodLabel(method, locale);
      const sameWordByDesign = method === "Crypto" && ["fr", "it"].includes(locale); // "Crypto" is the French/Italian word too
      assert.ok(label && (label !== method || sameWordByDesign), `${locale}: ${method} -> ${label}`);
    }
    assert.equal(paymentMethodLabel(method, "en"), method);
  }
  for (const brand of ["Apple Pay", "Google Pay", "SEPA", "FedWire"]) assert.equal(paymentMethodLabel(brand, "fr"), brand);
  assert.deepEqual(paymentMethodLabels(["P2P", "Credit Card", "Apple Pay", "Bank Transfer"], "fr"), ["P2P (entre particuliers)", "Carte de crédit", "Apple Pay", "Virement bancaire"]);
  assert.deepEqual(paymentMethodLabels(["Bank Wire", "Wire Transfer"], "fr"), ["Virement télégraphique"], "two records with one localized label appear once");
  for (const locale of ["zh-Hans", "fr", "ar", "ja", "de"]) {
    const html = rendered.facts[locale];
    assert.doesNotMatch(html, /Credit Card|Bank Transfer/, `${locale}: no English generic payment labels`);
    assert.match(html, /Apple Pay/, `${locale}: brand kept`);
  }
  assert.match(rendered.facts["zh-Hans"], /信用卡、Apple Pay、银行转账/);
});

test("NX-07 eligibility lists never repeat an entry in any locale or venue", () => {
  for (const locale of LOCALES) {
    for (const { slug, items: entries } of rendered.profiles[locale]) {
      const merged = entries.map(textEntryKey);
      assert.equal(new Set(merged).size, merged.length, `${locale} ${slug}: duplicated eligibility entry`);
    }
    const items = [...rendered.facts[locale].matchAll(/<li[^>]*>([^<]+)<\/li>/g)].map((m) => textEntryKey(m[1]));
    assert.equal(new Set(items).size, items.length, `${locale}: rendered OKX facts repeat an item`);
  }
});

test("NX-07 platform counts use CLDR plural rules", () => {
  assert.deepEqual(PLURAL_COPY_LOCALES.slice().sort(), LOCALES.slice().sort());
  assert.equal(platformCount(1, "fr"), "1 plateforme");
  assert.equal(platformCount(2, "fr"), "2 plateformes");
  assert.equal(platformCount(1, "en"), "1 platform");
  assert.equal(platformCount(1, "de"), "1 Plattform");
  assert.equal(platformCount(21, "ru"), "21 платформа");
  assert.equal(platformCount(3, "ru"), "3 платформы");
  assert.equal(platformCount(5, "ru"), "5 платформ");
  assert.equal(platformCount(2, "ar"), "منصتان");
  assert.equal(platformCount(5, "ar"), "5 منصات");
  assert.equal(rendered.resultVenues.fr, "1 plateforme");
  assert.equal(rendered.resultVenues.es, "1 plataforma");
  assert.equal(showMorePlatforms(1, "fr"), "Afficher 1 autre plateforme");
  assert.equal(showMorePlatforms(3, "fr"), "Afficher 3 autres plateformes");
  for (const locale of LOCALES) {
    assert.ok(showFewerPlatforms(locale), locale);
    assert.match(showMorePlatforms(2, locale), /2|منصتين/, locale);
  }
});
