// l10n gaps (2026-10-11): a production sweep of 14 locales × 18 templates found UI copy that stayed English on
// non-English pages (home campaign radar and sentiment panel, /telegram command summary, /methodology funding-route
// answer and data license, compare decision lead, /partners embed guide). These tests render the affected components
// for every UI locale and pin that none of the previously-English strings comes back, and that every copy map the fix
// introduced or extended has a complete, non-English entry per locale.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

import { partnerEmbedCopy, PARTNER_EMBED_LOCALIZED_LOCALES } from "../src/data/partner-embed-copy.js";
import { formatDate, formatMonthYear, intlLocale } from "../src/data/format-date.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const localeManifest = fs.readFileSync(path.join(root, "src/content/locale-manifest.ts"), "utf8");
const LOCALES = [...localeManifest.matchAll(/^\s+"?([A-Za-z-]+)"?:\s*\{\s*language:/gm)].map((m) => m[1]);
assert.equal(LOCALES.length, 17, "17 UI locales");
const NON_EN = LOCALES.filter((l) => l !== "en");

// Strings the production sweep found identical to the English page on non-English pages (classification "a").
const PREVIOUSLY_ENGLISH = {
  campaignRadar: [
    "Official Exchange Campaigns &amp; Welcome Packs",
    "Source-reviewed official activity leads. Eligibility, timing and user benefits still require account-level confirmation.",
    "Eligibility and timing depend on the official account",
    "Open official registration",
    "Source reviewed: 2026-09-06T18:35:39Z",
    "Source reviewed: 2026-09-06T18:11:47Z",
    "User Benefit Status",
    "Review Official Terms",
    "Key Participation Terms",
    "No account-specific amount or qualifying task was exposed in this public view.",
    "Open the task assigned to the eligible account before acting.",
    "The public hub labels the 135 USDT welcome package as multiple vouchers, not 135 USDT of freely withdrawable cash.",
    "Complete the required identity verification before claiming.",
    "Confirm EEA residence support, a new main account, identity checks and the eligible entry channel.",
    "Read voucher use and expiry separately from points redemption.",
  ],
  sentiment: [
    "MARKET SENTIMENT &amp; RISK MONITOR",
    "Crypto Fear &amp; Greed Index &amp; Asset Monitor",
    "Crypto Fear &amp; Greed Index",
    "No verifiable market or sentiment feed is currently connected; simulated prices, indexes and venue advice are hidden.",
    "Data status: no verified live feed yet, so no market or venue conclusions are shown.",
    "Data unavailable",
  ],
  telegram: ["Open advanced Bot commands"],
  methodology: [
    "Last revised 2026-09 · specification v3.8",
    "specification v3.8",
    "Page reviewed 2026-09-15",
    "How we check exchange fee schedules, reserve disclosures and official domains, and the sources, dates and limits behind every record.",
    "Regional funding route answer",
    "How should international users verify crypto funding routes?",
    "Source-backed regional entry points",
    "Then compare platform routes",
    "Machine-readable matrix",
    "SPK list context, TRY funding and product scope",
    "SFC status, HKD funding, identity and product scope",
    "Pix, CPF/KYC and BRL funding route checks",
    "MiCA register context, country scope and EUR or SEPA route",
    "MXN, SPEI and identity checks before signup",
    "MAS DPT context, SGD funding and product scope",
    "KRW funding, real-name bank account and identity checks",
    "FSA registration context, JPY funding and account-name checks",
    "FCA context, GBP funding, residence and onboarding checks",
    "Access to NexuAlpha datasets does not grant redistribution rights.",
    "NexuAlpha Data License and Source Boundary",
    "Editorial independence and commercial separation",
    "Data correction and community governance",
    "Contact Research Desk on Telegram",
    "E-E-A-T Institutional Research Standards",
    "Traceable Sources",
    "Zero Pay-for-Rank",
    "Four evaluation pillars",
  ],
  compareDecision: [
    "PRE-SIGNUP DECISION CHECKLIST",
    "which conditions should you compare?",
    "Check published fees, product scope, regional eligibility, account requirements and source dates before entering a signup flow.",
  ],
  partners: [
    "What the current embed includes",
    "The widget separates published base terms from values visitors enter. It does not present a live exchange feed or a solvency audit.",
    "Open partner desk on Telegram",
    "Need help configuring the iframe?",
    "Interactive preview · Scroll for results",
    "Copy the HTML iframe shown below. The calculator adapts to mobile and wide containers without a separate package.",
    "An optional publisher tag identifies the embed source. Registration and commercial attribution require separate confirmation from the partner platform.",
    "Publish an independent fee calculator in an iframe.",
    "Open the NexuAlpha partner desk with the current market, language and product context.",
  ],
};

function loadBundle() {
  const dir = fs.mkdtempSync(path.join(root, "tests/.tmp-l10n-gaps-"));
  try {
    const outfile = path.join(dir, "bundle.cjs");
    buildSync({
      stdin: {
        contents: `
          export { CampaignRadar, campaignRadarCopy, campaignRadarCopyFor } from "./src/components/v3/CampaignRadar.jsx";
          export { MarketFearGreedPanel, marketFearGreedCopy, marketFearGreedCopyFor } from "./src/components/v3/MarketFearGreedPanel.jsx";
          export { TelegramBotHub } from "./src/components/v3/TelegramBotHub.jsx";
          export { MethodologyPage, methodologyCopyMaps } from "./src/components/v3/MethodologyPage.jsx";
          export { CompareDecisionGuide, CompareDeepPage, compareDecisionLeadCopyByLocale } from "./src/components/v3/V3Pages.jsx";
          export { venueDatabase } from "./src/data/venue-database.js";
        `,
        resolveDir: root,
        loader: "jsx",
      },
      bundle: true,
      write: true,
      outfile,
      format: "cjs",
      platform: "node",
      external: ["react", "react/jsx-runtime", "react-dom", "react-dom/server"],
      loader: { ".css": "empty" },
      logLevel: "silent",
    });
    return require(outfile);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const mod = loadBundle();
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
const assertNoneOf = (html, strings, label) => {
  for (const text of strings) assert.ok(!html.includes(text), `${label}: still shows English "${text}"`);
};
const assertCompleteCopy = (map, label, { allowSame = [] } = {}) => {
  const en = map.en;
  assert.ok(en, `${label}: en copy exists`);
  for (const locale of LOCALES) {
    const entry = map[locale];
    assert.ok(entry, `${label}: ${locale} copy exists`);
    for (const key of Object.keys(en)) {
      const value = entry[key];
      assert.ok(value !== undefined && value !== null && String(typeof value === "function" ? value("A", "B") : Array.isArray(value) ? JSON.stringify(value) : value).trim() !== "", `${label}: ${locale}.${key} is set`);
      if (locale !== "en" && !allowSame.includes(key) && typeof value === "string" && /[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(en[key])) {
        assert.notEqual(value, en[key], `${label}: ${locale}.${key} still falls back to English`);
      }
    }
  }
};

test("home campaign radar renders localized UI copy and research text for every locale", () => {
  const en = render(mod.CampaignRadar, { locale: "en" });
  assert.match(en, /Official Exchange Campaigns &amp; Welcome Packs/);
  assert.match(en, /Source reviewed: <!-- -->Sep 7, 2026|Source reviewed: Sep 7, 2026/);
  assert.doesNotMatch(en, /2026-09-06T18:35:39Z</, "raw ISO stamp is no longer visible text (it stays in dateTime)");
  for (const locale of NON_EN) {
    const html = render(mod.CampaignRadar, { locale });
    assertNoneOf(html, PREVIOUSLY_ENGLISH.campaignRadar, `campaign radar ${locale}`);
    assert.match(html, /data-cta-placement="campaign-radar"/, `${locale} keeps the CTA placement`);
    assert.match(html, /<time dateTime="2026-09-06T18:\d{2}:\d{2}Z">/, `${locale} keeps the machine-readable review stamp`);
  }
  // Without a localized source title, retain the source link under its localized hub label.
  const japanese = render(mod.CampaignRadar, { locale: "ja" });
  assert.ok(japanese.includes(mod.campaignRadarCopy.ja.directHub));
  assert.doesNotMatch(japanese, /Backpack Exchange referral program/);
  assert.match(japanese, /class="campaign-card__source-link"/);
  assert.match(en, /Backpack Exchange referral program/);
  assertCompleteCopy(mod.campaignRadarCopy, "campaignRadarCopy");
  assert.equal(mod.campaignRadarCopyFor("pt").title, mod.campaignRadarCopy["pt-BR"].title);
  assert.equal(mod.campaignRadarCopyFor("zh-TW").title, mod.campaignRadarCopy["zh-Hant"].title);
});

test("home sentiment panel copy is complete for every locale, including the Chinese eyebrow", () => {
  for (const locale of NON_EN) {
    assertNoneOf(render(mod.MarketFearGreedPanel, { locale }), PREVIOUSLY_ENGLISH.sentiment, `sentiment ${locale}`);
  }
  assertCompleteCopy(mod.marketFearGreedCopy, "marketFearGreedCopy", { allowSame: ["fearIndexValue", "marketAssets"] });
  // SEO audit 2026-10-11 #6 (owner-approved): without a verified feed the panel renders nothing; with a reading it shows
  // the localized panel.
  assert.equal(render(mod.MarketFearGreedPanel, { locale: "zh-Hans" }), "");
  assert.match(render(mod.MarketFearGreedPanel, { locale: "zh-Hans", index: { value: 42 } }), /市场情绪与风险监测[\s\S]*42/);
});

test("telegram hub command summary is localized wherever the command deck renders", () => {
  for (const locale of NON_EN) {
    const html = render(mod.TelegramBotHub, { locale, headingLevel: 1, market: "GLOBAL", product: "research" });
    assertNoneOf(html, PREVIOUSLY_ENGLISH.telegram, `telegram ${locale}`);
  }
  for (const locale of ["ja", "ko", "tr"]) {
    assert.match(render(mod.TelegramBotHub, { locale, headingLevel: 1, market: "GLOBAL", product: "research" }), /tg-command-disclosure/, `${locale} still renders the command deck`);
  }
});

test("methodology page renders the funding-route answer, data license and shell in every locale with Intl dates", () => {
  for (const locale of NON_EN) {
    const html = render(mod.MethodologyPage, { locale });
    assertNoneOf(html, PREVIOUSLY_ENGLISH.methodology, `methodology ${locale}`);
    assert.match(html, /id="regional-funding-routes"/, `${locale} keeps the AEO funding-route section`);
    assert.match(html, /id="data-license"/, `${locale} keeps the data-license anchor`);
    assert.match(html, /<time dateTime="2026-09">/, `${locale} keeps the machine-readable revision month`);
    assert.match(html, /<time dateTime="2026-09-15">/, `${locale} keeps the machine-readable review date`);
  }
  const en = render(mod.MethodologyPage, { locale: "en" });
  assert.match(en, /Last revised September 2026 · specification v3\.8/);
  assert.match(en, /Page reviewed Sep 15, 2026/);
  assert.match(render(mod.MethodologyPage, { locale: "de" }), /Zuletzt überarbeitet: September 2026/);
  assert.match(render(mod.MethodologyPage, { locale: "ja" }), /2026年9月/);
  assert.match(render(mod.MethodologyPage, { locale: "zh-Hant" }), /最後修訂：2026年9月/);
  const maps = mod.methodologyCopyMaps;
  assertCompleteCopy(maps.REGIONAL_FUNDING_ROUTE_COPY, "REGIONAL_FUNDING_ROUTE_COPY", { allowSame: ["compareLinks"] });
  assertCompleteCopy(maps.DATA_LICENSE_COPY, "DATA_LICENSE_COPY");
  assertCompleteCopy(maps.researchTrustCopy, "researchTrustCopy", { allowSame: ["json", "csv"] });
  for (const locale of LOCALES) {
    const shell = maps.methodologyCopy[locale];
    assert.ok(shell, `methodologyCopy.${locale}`);
    for (const key of ["badge", "subtitle", "lastUpdated", "pill1", "pill2", "pill3", "pillarsTitle", "wallTitle", "feedbackTitle", "btnBack", "btnTg"]) {
      if (locale !== "en") assert.notEqual(shell[key], maps.methodologyCopy.en[key], `methodologyCopy.${locale}.${key} falls back to English`);
    }
    assert.match(shell.lastUpdated, /\{date\}/, `methodologyCopy.${locale}.lastUpdated uses the {date} placeholder`);
    assert.doesNotMatch(shell.lastUpdated, /2026/, `methodologyCopy.${locale}.lastUpdated does not hard-code the year`);
    const routes = maps.REGIONAL_FUNDING_ROUTE_COPY[locale].marketRoutes;
    assert.equal(routes.length, 9, `${locale} keeps nine regional routes`);
    assert.deepEqual(routes.map((r) => r[1]), maps.REGIONAL_FUNDING_ROUTE_COPY.en.marketRoutes.map((r) => r[1]), `${locale} keeps the route hrefs`);
  }
});

test("compare decision lead is localized for every locale", () => {
  const profiles = [mod.venueDatabase.binance, mod.venueDatabase.okx];
  for (const locale of NON_EN) {
    const html = render(mod.CompareDecisionGuide, { profiles, locale, market: "GLOBAL", product: "research" });
    assertNoneOf(html, PREVIOUSLY_ENGLISH.compareDecision, `compare decision ${locale}`);
    assert.match(html, /v3-decision-title/, `${locale} renders the lead`);
  }
  assert.match(render(mod.CompareDecisionGuide, { profiles, locale: "en" }), /Binance vs OKX: which conditions should you compare\?/);
  assertCompleteCopy(mod.compareDecisionLeadCopyByLocale, "compareDecisionLeadCopyByLocale");
});

test("compare versus block shows the localized campaign conditions instead of zh-Hans or forced English", () => {
  const pageCopy = { common: { dimension: "Dimension" }, assetCapabilities: { none: "Pending source review" } };
  const renderCompare = (locale) => render(mod.CompareDeepPage, { copy: pageCopy, locale, selected: ["binance", "okx"], venues: Object.values(mod.venueDatabase), updates: [], market: "unknown", product: "unknown" });
  const de = renderCompare("de");
  assert.match(de, /Öffnen Sie die dem berechtigten Konto zugewiesene Aufgabe, bevor Sie handeln\./, "de reads the German condition");
  assert.doesNotMatch(de, /操作前查看合资格账户实际获得的任务/, "de no longer falls through to zh-Hans");
  const ar = renderCompare("ar");
  assert.match(ar, /افتح المهمة المخصصة للحساب المؤهل قبل التصرف\./, "ar reads the Arabic condition");
  assert.doesNotMatch(ar, /Open the task assigned to the eligible account before acting\./, "ar is no longer forced to English");
});

test("partner embed guide copy exists for every locale", () => {
  const en = partnerEmbedCopy("en");
  for (const locale of NON_EN) {
    assert.ok(PARTNER_EMBED_LOCALIZED_LOCALES.includes(locale), `${locale} embed copy pack`);
    const copy = partnerEmbedCopy(locale);
    const flat = JSON.stringify(copy);
    assertNoneOf(flat, PREVIOUSLY_ENGLISH.partners, `partners ${locale}`);
    assert.equal(copy.cards.length, 3, `${locale} cards`);
    for (const key of Object.keys(en)) {
      // "brazil" is a proper-noun chip and "codeLabel" names the HTML iframe snippet; both stay English in every pack.
      if (key === "cards" || key === "brazil" || key === "codeLabel") continue;
      assert.ok(copy[key]?.trim(), `${locale}.${key}`);
      if (/[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(en[key])) assert.notEqual(copy[key], en[key], `${locale}.${key} falls back to English`);
    }
  }
});

test("format-date renders ISO stamps per locale in SGT and tolerates unknown input", () => {
  assert.equal(formatMonthYear("en", "2026-09"), "September 2026");
  assert.equal(formatMonthYear("de", "2026-09"), "September 2026");
  assert.equal(formatMonthYear("ja", "2026-09"), "2026年9月");
  assert.equal(formatDate("en", "2026-09-06T18:35:39Z"), "Sep 7, 2026");
  assert.equal(formatDate("de", "2026-09-06T23:59:59Z"), "07.09.2026", "SGT day, not the host timezone");
  assert.equal(formatDate("en", "not a date"), "");
  assert.equal(formatDate("en", null), "");
  assert.equal(intlLocale("pt-br"), "pt-BR");
  assert.equal(intlLocale("zz-INVALID-locale-!!"), "en");
});
