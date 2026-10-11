import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildVenueFeeSummary } from "../src/data/venue-fee-summary.js";
import { feePctOfRate } from "../src/data/exchange-facts.js";
import { reviewedFeeCopy } from "../src/data/reviewed-fee-copy.js";
import { regionalVenueCta } from "../src/data/source-bound-cta.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"];
// Class b: 4a31e90 publishes reviewed spot and perpetual schedules, including OKX.
const reviewedSlugs = ["binance", "okx", "bybit", "bitget"];

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#x27;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

async function renderFeeBenchmark(renderLocales = locales) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-fee-benchmark-reviewed-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { FeeBenchmarkTerminal } from "../../src/components/v3/FeeBenchmarkTerminal.jsx";
      const locales = ${JSON.stringify(renderLocales)};
      const pages = locales.map((locale) => ({
        locale,
        html: renderToStaticMarkup(React.createElement(FeeBenchmarkTerminal, { locale, market: "BR", product: "spot" }))
      }));
      console.log(JSON.stringify(pages));
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
      "--log-level=warning",
    ], { cwd: projectRoot, stdio: "pipe" });
    return JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function feeTerminal(html) {
  const start = html.indexOf('id="rate-terminal"');
  assert.notEqual(start, -1, "fee benchmark section should render");
  return html.slice(start);
}

test("fee benchmark uses reviewed spot records and localized reviewed copy", async () => {
  const pages = await renderFeeBenchmark(locales);
  for (const { locale, html } of pages) {
    const section = feeTerminal(html);
    for (const slug of reviewedSlugs) {
      for (const rate of buildVenueFeeSummary({ slug }).rates) {
        const copy = reviewedFeeCopy(rate, locale);
        assert.ok(section.includes(`href="${escapeHtml(rate.sourceUrl)}"`), `${locale}/${slug}: reviewed source URL`);
        assert.ok(section.includes(rate.checkedAt), `${locale}/${slug}: reviewed date`);
        assert.ok(section.includes(escapeHtml(copy.tier)), `${locale}/${slug}: reviewed tier`);
        assert.ok(section.includes(escapeHtml(copy.scope)), `${locale}/${slug}: reviewed scope`);
        assert.ok(section.includes(escapeHtml(copy.conditions)), `${locale}/${slug}: reviewed conditions`);
        assert.match(section, new RegExp(`data-fee-product="${rate.product}"`), `${locale}/${slug}: reviewed product`);
      }
    }
    assert.match(section, /data-fee-product="spot"/, `${locale}: spot reviewed records should be rendered`);
    // Class b: 4a31e90 formats the same reviewed rate with the locale decimal and percent convention.
    assert.ok(section.includes(escapeHtml(feePctOfRate(0.001, locale))), `${locale}: reviewed 0.10% rate should be visible`);
    // Class b: reviewed perpetual schedules now exist; the source/date/scope checks above apply to both products.
    assert.match(section, /data-fee-product="futures"/, `${locale}: sourced futures schedules are rendered`);
    assert.doesNotMatch(section, /↓ -0%|0\.00%|VIP 9/, `${locale}: unknown rebate/net/trend must not be invented`);
  }
});

test("fee benchmark localizes next-step and pending states across priority locales", async () => {
  const pages = await renderFeeBenchmark(["ar", "ja", "ko", "tr", "pt-BR", "es"]);
  for (const { locale, html } of pages) {
    const section = feeTerminal(html);
    assert.doesNotMatch(section, /Ready to choose\?|Compare platforms or continue|View platform directory|What the public fee check can answer|It cannot prove your final account rate|Pending source review|Pending verification|Not calculated|No reviewed trend/, locale);
  }
  const arabic = pages.find((page) => page.locale === "ar").html;
  assert.match(arabic, /id="rate-terminal" dir="rtl"/);
  assert.match(arabic, /بانتظار مراجعة المصدر/);
  assert.match(arabic, /غير محسوب/);
});


// Class d: c581073 replaced six-row expansion with a checked-only ledger; it has no six-row expand control; retain this historical contract for Claude.
test("fee benchmark mobile expand controls are localized for every supported locale", async () => {
  const pages = await renderFeeBenchmark(locales);
  const expected = {
    en: [/Mobile shows 6 of \d+ venues first/, /View all \d+ venues/],
    "zh-Hans": [/手机先显示 6 家，共 \d+ 家，可展开查看全部。/, /查看全部 \d+ 家平台/],
    "zh-Hant": [/手機先顯示 6 家，共 \d+ 家，可展開查看全部。/, /查看全部 \d+ 家平台/],
    es: [/En móvil se muestran primero 6 de \d+ plataformas/, /Ver las \d+ plataformas/],
    "pt-BR": [/No celular, aparecem primeiro 6 de \d+ plataformas/, /Ver todas as \d+ plataformas/],
    fr: [/Sur mobile, 6 plateformes sur \d+ s'affichent d'abord/, /Voir les \d+ plateformes/],
    de: [/Auf Mobilgeräten werden zuerst 6 von \d+ Plattformen angezeigt/, /Alle \d+ Plattformen anzeigen/],
    ja: [/モバイルではまず6件／全\d+件を表示します。/, /全\d+件を表示/],
    ko: [/모바일에서는 먼저 6개 \/ 전체 \d+개 플랫폼을 표시합니다。|모바일에서는 먼저 6개 \/ 전체 \d+개 플랫폼을 표시합니다\./, /전체 \d+개 플랫폼 보기/],
    ar: [/على الهاتف نعرض أولاً 6 من أصل \d+ منصة/, /عرض كل المنصات \(\d+\)/],
    tr: [/Mobilde önce \d+ platformdan 6 tanesi gösterilir/, /\d+ platformun tümünü gör/],
    ru: [/На телефоне сначала показано 6 из \d+ платформ/, /Показать все \d+ платформ/],
    id: [/Di ponsel, 6 dari \d+ platform ditampilkan lebih dulu/, /Lihat semua \d+ platform/],
    vi: [/Trên điện thoại, hiển thị trước 6 trong tổng số \d+ nền tảng/, /Xem tất cả \d+ nền tảng/],
    it: [/Su mobile vengono mostrate prima 6 piattaforme su \d+/, /Vedi tutte le \d+ piattaforme/],
  };
  for (const { locale, html } of pages) {
    const section = feeTerminal(html);
    const visibleText = section.replaceAll("&#x27;", "'").replaceAll("&amp;", "&");
    for (const pattern of expected[locale]) {
      assert.match(visibleText, pattern, locale);
    }
    if (locale !== "en") {
      assert.doesNotMatch(visibleText, /Mobile shows|View all|Show fewer|high-intent|高意向|高意圖/, locale);
    }
  }

  const source = await readFile(new URL("../src/components/v3/FeeBenchmarkTerminal.jsx", import.meta.url), "utf8");
  for (const phrase of [
    "Show fewer venues",
    "收起平台列表",
    "Afficher moins de plateformes",
    "Weniger Plattformen anzeigen",
    "عرض منصات أقل",
    "Показать меньше платформ",
    "Tampilkan lebih sedikit platform",
    "Hiển thị ít nền tảng hơn",
    "Mostra meno piattaforme",
  ]) {
    assert.ok(source.includes(phrase), `collapse copy present: ${phrase}`);
  }
});

// Class d: c581073 replaced the mobile row limit with a checked-only ledger; it has no mobile-extra row hiding; retain this historical contract for Claude.
test("fee benchmark preserves source-bound CTA destinations and mobile six-row behavior", async () => {
  const [{ html }] = await renderFeeBenchmark(["en"]);
  const section = feeTerminal(html);
  for (const slug of ["binance", "okx", "bybit", "bitget", "backpack"]) {
    const cta = regionalVenueCta(slug, "en", "BR", "spot");
    assert.ok(section.includes(`href="${escapeHtml(cta.ctaHref)}"`), `${slug}: CTA href remains from source-bound regionalVenueCta`);
  }
  const rows = section.match(/<tr/g) || [];
  assert.ok(rows.length > 6, "SSR keeps the full table DOM to avoid hydration row-count jumps");
  assert.match(section, /fee-terminal__mobile-extra/, "rows after the sixth are marked for mobile CSS hiding");
  const source = await readFile(new URL("../src/components/v3/FeeBenchmarkTerminal.jsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/components/v3/fee-benchmark-terminal.css", import.meta.url), "utf8");
  assert.doesNotMatch(source, /rows\.slice\(0, 6\)|window\.innerWidth|isMobile/, "mobile row limit should not depend on client viewport detection");
  assert.match(css, /max-width:\s*768px[\s\S]*fee-terminal__mobile-extra[\s\S]*display:\s*none/, "CSS hides extra mobile rows before hydration");
  assert.match(css, /fee-terminal-section--expanded[\s\S]*fee-terminal__mobile-extra[\s\S]*display:\s*table-row/, "expanded state restores hidden mobile rows");
  assert.doesNotMatch(source, /partnerRegistry\[[^\]]+\]\s*=/, "benchmark must not mutate partner registry");
});

test("rates route exposes answer-first conversion bridge through source-bound CTA routes", async () => {
  const [{ html }] = await renderFeeBenchmark(["en"]);
  const section = feeTerminal(html);
  const binanceCta = regionalVenueCta("binance", "en", "BR", "spot");
  const bybitCta = regionalVenueCta("bybit", "en", "BR", "spot");
  assert.match(section, /fee-terminal__answer-block/, "answer block should render in SSR");
  assert.match(section, /What the public fee check can answer/);
  assert.match(section, /It cannot prove your final account rate/);
  assert.ok(section.includes('href="/compare/binance-vs-okx?market=BR&amp;product=spot"'), "spot comparison handoff");
  assert.ok(section.includes('href="/compare/bybit-vs-bitget?market=BR&amp;product=perpetuals"'), "perpetual comparison handoff");
  assert.ok(section.includes('href="/topics/derivatives?market=BR&amp;product=perpetuals"'), "derivatives education handoff");
  // Class b: 4a31e90 places the result cards before the follow-up action strip.
  assert.ok(section.indexOf("cost-decision__results") >= 0, "results are present");
  assert.ok(section.indexOf("cost-decision__results") < section.indexOf("cost-decision__next-actions"), "next actions follow results");
  assert.ok(section.includes(`href="${escapeHtml(binanceCta.ctaHref)}"`), "spot next step uses source-bound regionalVenueCta");
  assert.ok(section.includes(`href="${escapeHtml(bybitCta.ctaHref)}"`), "results keep the source-bound derivatives route");
  assert.ok(!section.includes("cost-decision__telegram"), "Telegram support appears once on the page, not inside the calculator");
});
