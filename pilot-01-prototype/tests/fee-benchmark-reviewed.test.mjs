import assert from "node:assert/strict";
import { rendersSource, renderedSourceHref } from './helpers/outbound-expect.mjs';
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildVenueFeeSummary } from "../src/data/venue-fee-summary.js";
import { feePctOfRate } from "../src/data/exchange-facts.js";
import { reviewedFeeCopy } from "../src/data/reviewed-fee-copy.js";
import { JSDOM } from "jsdom";
import { venueDatabase } from "../src/data/venue-database.js";
import { regionalVenueCta } from "../src/data/source-bound-cta.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"];
// Class b: 4a31e90 publishes reviewed spot and perpetual schedules, including OKX.
const reviewedSlugs = ["binance", "okx", "bybit", "bitget"];


function combinedParams(url) {
  const params = new URLSearchParams(url.search);
  const hash = String(url.hash || "");
  const hashQuery = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "";
  for (const [key, value] of new URLSearchParams(hashQuery)) if (!params.has(key)) params.set(key, value);
  return params;
}

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
        if (locale === 'tr' && slug === 'bitget') {
          // tr-bitget-sweep: Türkiye pages list no SPK-listed venue in the benchmark at all.
          assert.ok(!section.includes(`href="${escapeHtml(rate.sourceUrl)}"`), `${locale}/${slug}: outbound source blocked`);
          assert.doesNotMatch(section, /bitget/i, `${locale}/${slug}: row removed`);
          continue;
        } else {
          assert.ok(rendersSource(section, rate.sourceUrl, { locale }) || section.includes(`data-source-plain="${new URL(rate.sourceUrl).hostname.replace(/^www\./, '')}"`), `${locale}/${slug}: reviewed source (coded route or plain label)`);
          assert.ok(!section.includes(`href="${escapeHtml(rate.sourceUrl)}"`) || renderedSourceHref(rate.sourceUrl, { locale }) === escapeHtml(rate.sourceUrl), `${locale}/${slug}: no uncoded exchange link`);
        }
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
    assert.doesNotMatch(section, /Ready to choose\?|Compare platforms or continue|View platform directory|What this table tells you|Your final rate is the one your exchange account shows|Pending source review|Pending verification|Not calculated|No reviewed trend/, locale);
  }
  const arabic = pages.find((page) => page.locale === "ar").html;
  assert.match(arabic, /id="rate-terminal" dir="rtl"/);
  assert.match(arabic, /بانتظار مراجعة المصدر/);
  assert.match(arabic, /غير محسوب/);
});


// c581073 replaces the six-row toggle with native, localized ledger disclosures.
test("fee benchmark progressive ledger controls are localized for every supported locale", async () => {
  const expectedConditions = {
    en: "Conditions", "zh-Hans": "条件", "zh-Hant": "条件", es: "Condiciones",
    "pt-BR": "Condições", fr: "Conditions", de: "Bedingungen", ja: "条件",
    ko: "조건", ar: "الشروط", tr: "Koşullar", ru: "Условия", id: "Ketentuan",
    vi: "Điều kiện", it: "Condizioni", ur: "شرائط", uk: "Умови",
  };
  for (const { locale, html } of await renderFeeBenchmark(locales)) {
    const dom = new JSDOM(html);
    try {
      const section = dom.window.document.querySelector("#rate-terminal");
      const conditions = [...section.querySelectorAll("details.ft-cond")];
      assert.ok(conditions.length >= reviewedSlugs.length, `${locale}: reviewed rows offer expandable conditions`);
      for (const details of conditions) {
        assert.equal(details.querySelector("summary").textContent, expectedConditions[locale], `${locale}: localized conditions control`);
        assert.equal(details.open, false, `${locale}: conditions start collapsed`);
        assert.ok(details.querySelector("p")?.textContent.trim(), `${locale}: full conditions remain in SSR`);
      }
      const pending = section.querySelector(".ft-pending details");
      assert.ok(pending, `${locale}: pending venues have a native disclosure`);
      assert.equal(pending.open, false, `${locale}: pending venues start collapsed`);
      assert.ok(pending.querySelector("summary .ft-pending__count")?.textContent.trim(), `${locale}: pending control has a visible label`);
      assert.ok(pending.querySelectorAll("li a").length > 0, `${locale}: pending venue access remains available`);
      if (locale !== "en") {
        assert.doesNotMatch(pending.querySelector("summary").textContent, /venues? pending source review/, `${locale}: pending control has no English fallback`);
      }
      assert.equal(section.getAttribute("dir"), ["ar", "ur"].includes(locale) ? "rtl" : null, `${locale}: ledger direction`);
    } finally {
      dom.window.close();
    }
  }
});

test("fee benchmark preserves source-bound CTA destinations and progressive full venue access", async () => {
  const [{ html }] = await renderFeeBenchmark(["en"]);
  const dom = new JSDOM(html);
  try {
    const section = dom.window.document.querySelector("#rate-terminal");
    const table = section.querySelector("#rate-terminal-table");
    const actions = [...table.querySelectorAll('[data-cta-placement="rate-benchmark-row"]')];
    assert.deepEqual(actions.map((a) => a.dataset.ctaPlatform).sort(), Object.keys(venueDatabase).sort(), "every venue retains exactly one ledger action");
    for (const action of actions) {
      const slug = action.dataset.ctaPlatform;
      const cta = regionalVenueCta(slug, "en", "BR", "spot");
      assert.equal(action.getAttribute("href"), cta.ctaHref, `${slug}: exact source-bound destination`);
      assert.equal(action.dataset.ctaKind, cta.direct ? "registration" : "research", `${slug}: explicit action kind`);
      if (cta.direct) assert.equal(action.getAttribute("rel"), "sponsored noopener noreferrer", `${slug}: sponsored handoff`);
      const container = action.closest("li") || action.closest("tr");
      const research = container.querySelector('[data-cta-placement="rate-benchmark-detail"]');
      assert.ok(research, `${slug}: full platform research remains accessible`);
      const url = new URL(research.href, "https://nexualpha.com");
      assert.equal(url.pathname, `/exchanges/${slug}`);
      const params = combinedParams(url);
      assert.equal(params.get("market"), "BR");
      assert.equal(params.get("product"), "spot");
      assert.equal(url.hash.startsWith("#registration-path?"), true);
    }
    const pending = table.querySelector(".ft-pending details");
    assert.equal(pending.open, false, "pending venue list remains progressive");
    assert.ok(pending.querySelectorAll("li").length > 0, "collapsed pending list retains all its actions in SSR");
    for (const slug of reviewedSlugs) {
      const action = actions.find((a) => a.dataset.ctaPlatform === slug);
      assert.ok(action.closest("tr").querySelector(".ft-checked time"), `${slug}: checked schedule is visible outside pending disclosure`);
      assert.equal(action.closest(".ft-pending"), null, `${slug}: checked venue is not hidden with pending venues`);
    }
    const block = table.closest(".fee-terminal__table-block");
    assert.ok(block, "ledger actions sit in the table block");
    assert.equal(block.querySelector("[data-disclosure-placement]"), null, "owner rule 2026-10-12: no commission disclosure inside the ledger block");
  } finally {
    dom.window.close();
  }
  const source = await readFile(new URL("../src/components/v3/FeeBenchmarkTerminal.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /rows\.slice\(0, 6\)|window\.innerWidth|isMobile/, "SSR venue access does not depend on client viewport detection");
  assert.doesNotMatch(source, /partnerRegistry\[[^\]]+\]\s*=/, "benchmark must not mutate partner registry");
});

test("rates route exposes answer-first conversion bridge through source-bound CTA routes", async () => {
  const [{ html }] = await renderFeeBenchmark(["en"]);
  const section = feeTerminal(html);
  const binanceCta = regionalVenueCta("binance", "en", "BR", "spot");
  const bybitCta = regionalVenueCta("bybit", "en", "BR", "spot");
  assert.match(section, /fee-terminal__answer-block/, "answer block should render in SSR");
  assert.match(section, /What this table tells you/);
  assert.match(section, /Your final rate is the one your exchange account shows/);
  assert.ok(section.includes('href="/compare/binance-vs-okx#nxa-context?market=BR&amp;product=spot"'), "spot comparison handoff");
  assert.ok(section.includes('href="/compare/bybit-vs-bitget#nxa-context?market=BR&amp;product=perpetuals"'), "perpetual comparison handoff");
  assert.ok(section.includes('href="/topics/derivatives#nxa-context?market=BR&amp;product=perpetuals"'), "derivatives education handoff");
  // Class b: 4a31e90 places the result cards before the follow-up action strip.
  assert.ok(section.indexOf("cost-decision__results") >= 0, "results are present");
  assert.ok(section.indexOf("cost-decision__results") < section.indexOf("cost-decision__next-actions"), "next actions follow results");
  assert.ok(section.includes(`href="${escapeHtml(binanceCta.ctaHref)}"`), "spot next step uses source-bound regionalVenueCta");
  assert.ok(section.includes(`href="${escapeHtml(bybitCta.ctaHref)}"`), "results keep the source-bound derivatives route");
  assert.ok(!section.includes("cost-decision__telegram"), "Telegram support appears once on the page, not inside the calculator");
});
