import { isPartnerPromotableIn } from "../src/data/partner-geo-restrictions.js";
import { publicCtaForVenue } from "../src/data/source-bound-cta.js";
import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createSsrHarness } from "./helpers/ssr-hydration-harness.mjs";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const coreLocales = ["en", "ja", "ko", "tr", "ar"];
const coreVenueSlugs = ["binance", "bitget", "backpack"];

async function renderStaticPages(source) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-week2-mobile-shortpath-"));
  let harness;
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const moduleSource = source.replace(/console\.log\(JSON\.stringify\(pages\)\);\s*$/, "export default pages;");
    assert.notEqual(moduleSource, source, "static page fixture must export its rendered pages");
    await writeFile(entryPath, moduleSource);
    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    harness = await createSsrHarness();
    const mod = await harness.vite.ssrLoadModule(pathToFileURL(entryPath).href);
    return mod.default;
  } finally {
    await harness?.close();
    await rm(tempDir, { recursive: true, force: true });
  }
}

function firstIndex(html, needle, context) {
  const index = html.indexOf(needle);
  assert.ok(index >= 0, `${context}: missing ${needle}`);
  return index;
}

function assertClosedDetails(html, selectorClass, context) {
  const openPattern = new RegExp(`<details class="${selectorClass}"[^>]*\\sopen(?:\\s|=|>)`);
  assert.doesNotMatch(html, openPattern, `${context}: ${selectorClass} should be collapsed by default`);
}

test("venue detail mobile contract keeps the registration path before long evidence blocks", async () => {
  const pages = await renderStaticPages(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { VenueDetailPage } from "../../src/components/v3/VenueDetailPageStatic.jsx";
    import { venueDatabase } from "../../src/data/venue-database.js";
    const copy = { common: { dimension: "Dimension" }, assetCapabilities: { none: "Pending source review" } };
    const venues = Object.values(venueDatabase);
    const pages = [];
    for (const locale of ${JSON.stringify(coreLocales)}) {
      for (const slug of ${JSON.stringify(coreVenueSlugs)}) {
        pages.push({
          locale,
          slug,
          html: renderToStaticMarkup(React.createElement(VenueDetailPage, {
            copy,
            locale,
            venue: venueDatabase[slug],
            venues,
            updates: [],
            market: "unknown",
            product: "unknown",
          })),
        });
      }
    }
    console.log(JSON.stringify(pages));
  `);

  assert.equal(pages.length, coreLocales.length * coreVenueSlugs.length);
  for (const { locale, slug, html } of pages) {
    const context = `${slug}/${locale}`;
    const quickRegistration = firstIndex(html, 'data-cta-surface="venue-profile-main-registration"', context);
    const promotable = Boolean(publicCtaForVenue(slug, locale).registrationUrl) && isPartnerPromotableIn(slug, { locale });
    const primaryCta = firstIndex(html, promotable ? 'data-cta-placement="registration-card-primary"' : 'registration-card__primary-btn--disabled', context);
    if (!promotable) {
      const original = publicCtaForVenue(slug, "en");
      assert.ok(!html.includes(original.inviteCode), `${context}: restricted code hidden`);
      assert.doesNotMatch(html, /data-cta-placement="registration-card-primary"/, `${context}: restricted signup hidden`);
      assert.doesNotMatch(html, /data-cta-kind="registration"|data-cta-code=|href="\/go\//, `${context}: gated signup and codes absent`);
    }
    const directAnswer = html.indexOf('class="v3-venue-direct-answer"');
    // R110 venue split moved invitation proof into the grouped Sources chapter while keeping the CTA route before it.
    const invitationDisclosure = firstIndex(html, 'class="v3-profile-account-block v3-venue-invitation-disclosure"', context);
    const rebateCard = firstIndex(html, 'class="v3-venue-rebate-card"', context);
    const costDrawer = firstIndex(html, 'class="v3-profile-account-section v3-profile-account-cost"', context);
    const evidenceDrawer = firstIndex(html, 'class="v3-profile-research-chapter" data-research-task="sources"', context);
    const checklist = firstIndex(html, 'id="registration-checklist"', context);
    const stickyBar = firstIndex(html, 'class="v3-mobile-sticky-bar"', context);

    assert.ok(quickRegistration < invitationDisclosure, `${context}: quick registration appears before invite proof disclosure`);
    assert.equal((html.match(/data-cta-surface="venue-profile-main-registration"/g) || []).length, 1, `${context}: sole main registration owner`);
    const readiness = firstIndex(html, 'class="venue-readiness"', context);
    assert.ok(readiness < costDrawer, `${context}: eligibility/readiness remains before long cost evidence`);
    if (directAnswer >= 0) {
      assert.ok(directAnswer < costDrawer, `${context}: existing product decision and key restrictions remain before long cost evidence`);
    }
    assert.ok(invitationDisclosure < rebateCard, `${context}: invite proof is nested inside the disclosure`);
    assert.ok(rebateCard < costDrawer, `${context}: invite proof remains available before cost drawer`);
    assert.ok(primaryCta < costDrawer, `${context}: primary CTA appears before cost drawer`);
    assert.ok(primaryCta < evidenceDrawer, `${context}: primary CTA appears before evidence drawer`);
    assert.ok(stickyBar > checklist, `${context}: sticky CTA stays available after the decision content`);
    assert.match(html, /data-cta-placement="venue-mobile-sticky"/, `${context}: mobile sticky CTA is tracked`);
    assertClosedDetails(html, "v3-profile-sources-group", context);
    assertClosedDetails(html, "v3-registration-notes", context);
    assertClosedDetails(html, "v2-section v3-similar v3-similar-disclosure", context);
    if (locale === "ar") assert.match(html, /dir="rtl"/, `${context}: RTL text direction is represented`);
    if (locale === "en" && slug === "bitget") {
      assert.match(html, /Review code and signup conditions/, `${context}: internal registration anchor uses review wording`);
      assert.doesNotMatch(html, /Register on Official Site/, `${context}: internal registration anchor is not labelled as an external signup jump`);
    }
  }
});

test("English compare page mobile contract presents final choice before dense matrices", async () => {
  const pages = await renderStaticPages(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { CompareDeepPage } from "../../src/components/v3/V3Pages.jsx";
    import { venueDatabase } from "../../src/data/venue-database.js";
    const copy = { common: { dimension: "Dimension" }, assetCapabilities: { none: "Pending source review" } };
    const venues = Object.values(venueDatabase);
    const selected = ["bybit", "bitget"];
    const pages = [];
    for (const locale of ${JSON.stringify(["en"])}) {
      pages.push({
        locale,
        html: renderToStaticMarkup(React.createElement(CompareDeepPage, {
          copy,
          locale,
          selected,
          venues,
          updates: [],
          market: "unknown",
          product: "unknown",
        })),
      });
    }
    console.log(JSON.stringify(pages));
  `);

  assert.equal(pages.length, 1);
  for (const { locale, html } of pages) {
    const context = `bybit-vs-bitget/${locale}`;
    const stickyBar = firstIndex(html, 'class="v3-compare-sticky-bar', context);
    const hero = firstIndex(html, 'id="compare-hero"', context);
    const finalChoice = firstIndex(html, 'class="v3-compare-final-choice-card"', context);
    const versus = firstIndex(html, 'id="compare-versus-card"', context);
    const snapshot = firstIndex(html, 'id="compare-snapshot"', context);
    const matrix = firstIndex(html, 'id="hardcore-matrix"', context);
    const scenario = firstIndex(html, 'v3-compare-section-disclosure', context);

    assert.ok(stickyBar < hero, `${context}: sticky CTA is mounted before hero for mobile activation`);
    // R111 keeps the high-intent matrix visible before the final-choice card, then groups repeated evidence below it.
    assert.ok(matrix < finalChoice, `${context}: metric matrix appears before final choice`);
    assert.ok(finalChoice < versus, `${context}: final choice appears before versus cards`);
    assert.ok(versus < snapshot, `${context}: snapshot is downgraded below the decisive hero area`);
    assert.ok(versus < scenario, `${context}: hero comparison appears before scenario research drawer`);
    assertClosedDetails(html, "v2-section v3-compare-group v3-compare-group--notes", context);
    assert.match(html, /class="v3-compare-final-choice-evidence"[^>]*aria-label=/, `${context}: source evidence remains grouped below the final choice`);
    assert.match(html, /data-cta-placement="compare-final-choice-registration"/, `${context}: command surface owns the primary registration CTA`);
    assert.match(html, /class="v3-versus-card v3-versus-card--supporting"/, `${context}: versus card is downgraded to supporting evidence`);
    assertClosedDetails(html, "v2-section v3-page-snapshot v3-compare-snapshot v3-compare-snapshot-disclosure", context);
    assertClosedDetails(html, "v3-versus-stats-disclosure", context);
    assertClosedDetails(html, "v3-versus-sources-disclosure", context);
    assertClosedDetails(html, "v3-compare-research-paths", context);
    assert.match(html, /data-cta-placement="compare-hero-versus"/, `${context}: direct comparison CTA remains tracked`);
    assert.match(html, /data-cta-placement="compare-final-choice-detail"/, `${context}: onsite detail CTA remains tracked`);
  }
});

test("localized compare pages keep dense research collapsed before the matrix", async () => {
  const pages = await renderStaticPages(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { CompareDeepPage } from "../../src/components/v3/V3Pages.jsx";
    import { venueDatabase } from "../../src/data/venue-database.js";
    const copy = { common: { dimension: "Dimension" }, assetCapabilities: { none: "Pending source review" } };
    const venues = Object.values(venueDatabase);
    const selected = ["bybit", "bitget"];
    const pages = [];
    for (const locale of ${JSON.stringify(["ja", "ko", "tr", "ar"])}) {
      pages.push({
        locale,
        html: renderToStaticMarkup(React.createElement(CompareDeepPage, {
          copy,
          locale,
          selected,
          venues,
          updates: [],
          market: "unknown",
          product: "unknown",
        })),
      });
    }
    console.log(JSON.stringify(pages));
  `);

  assert.equal(pages.length, 4);
  for (const { locale, html } of pages) {
    const context = `bybit-vs-bitget/${locale}`;
    const stickyBar = firstIndex(html, 'class="v3-compare-sticky-bar', context);
    const hero = firstIndex(html, 'id="compare-hero"', context);
    const finalChoice = firstIndex(html, 'class="v3-compare-final-choice-card"', context);
    const versus = firstIndex(html, 'id="compare-versus-card"', context);
    const snapshot = firstIndex(html, 'id="compare-snapshot"', context);
    const matrix = firstIndex(html, 'id="hardcore-matrix"', context);
    const scenario = firstIndex(html, 'v3-compare-section-disclosure', context);

    assert.ok(stickyBar < hero, `${context}: sticky CTA is mounted before hero for mobile activation`);
    assert.ok(matrix < finalChoice, `${context}: localized metric matrix appears before final choice`);
    assert.ok(finalChoice < versus, `${context}: localized final choice appears before versus cards`);
    assert.ok(versus < snapshot, `${context}: snapshot is downgraded below the decisive hero area`);
    assert.ok(versus < scenario, `${context}: hero comparison appears before research drawers`);
    assertClosedDetails(html, "v2-section v3-compare-group v3-compare-group--notes", context);
    assert.match(html, /class="v3-compare-final-choice-evidence"[^>]*aria-label=/, `${context}: localized source evidence remains grouped below the final choice`);
    assert.match(html, /data-cta-placement="compare-final-choice-registration"/, `${context}: localized command surface owns the primary registration CTA`);
    assert.match(html, /class="v3-versus-card v3-versus-card--supporting"/, `${context}: localized versus card is downgraded to supporting evidence`);
    assertClosedDetails(html, "v2-section v3-page-snapshot v3-compare-snapshot v3-compare-snapshot-disclosure", context);
    assertClosedDetails(html, "v3-versus-stats-disclosure", context);
    assertClosedDetails(html, "v3-versus-sources-disclosure", context);
    assertClosedDetails(html, "v3-compare-research-paths", context);
    assert.match(html, /data-cta-placement="compare-hero-versus"/, `${context}: direct comparison CTA remains tracked`);
  }
});

test("rates page mobile contract answers first and limits the first table payload", async () => {
  const pages = await renderStaticPages(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { FeeBenchmarkTerminal } from "../../src/components/v3/FeeBenchmarkTerminal.jsx";
    const pages = [];
    for (const locale of ${JSON.stringify(coreLocales)}) {
      pages.push({
        locale,
        html: renderToStaticMarkup(React.createElement(FeeBenchmarkTerminal, {
          locale,
          market: "BR",
          product: "spot",
        })),
      });
    }
    console.log(JSON.stringify(pages));
  `);

  assert.equal(pages.length, coreLocales.length);
  for (const { locale, html } of pages) {
    const context = `rates/${locale}`;
    const answer = firstIndex(html, 'class="fee-terminal__answer-block ', context);
    const nextStep = firstIndex(html, 'class="fee-terminal__next-step ', context);
    const costDecision = firstIndex(html, 'class="cost-decision ', context);
    const rail = firstIndex(html, 'class="decision-path-rail"', context);
    const table = firstIndex(html, 'id="rate-terminal-table"', context);

    assert.ok(answer < nextStep, `${context}: answer block appears before next-step CTA`);
    assert.ok(nextStep < costDecision, `${context}: CTA bridge appears before calculator results`);
    assert.ok(costDecision < rail, `${context}: calculator appears before related decision rail`);
    assert.ok(rail < table, `${context}: decision rail appears before dense benchmark table`);
    // R11 renders reviewed rows directly and collapses only the unsourced venue group in-table.
    assert.match(html, /class="ft-pending"[\s\S]*<details>/, `${context}: pending venue payload stays collapsed after reviewed rows`);
    assert.match(html, /class="fee-terminal__table-wrapper [^"]*" tabindex="0"/, `${context}: table wrapper remains keyboard reachable`);
    if (locale === "ar") assert.match(html, /dir="rtl"/, `${context}: RTL table direction is represented`);
  }
});

test("mobile disclosure controls keep keyboard and touch affordances in CSS", async () => {
  const [layoutCss, compareCss, ratesCss] = await Promise.all([
    readFile(new URL("../src/styles/v3-layout-stability.css", import.meta.url), "utf8"),
    readFile(new URL("../src/components/v3/crossroads-compare.css", import.meta.url), "utf8"),
    readFile(new URL("../src/components/v3/fee-benchmark-terminal.css", import.meta.url), "utf8"),
  ]);

  assert.match(layoutCss, /\.v3-profile-cost-conditions > summary[\s\S]*cursor:\s*pointer/, "venue cost drawer summary is visibly interactive");
  assert.match(layoutCss, /\.v3-registration-notes > summary[\s\S]*cursor:\s*pointer/, "venue registration notes summary is visibly interactive");
  assert.match(compareCss, /\.v3-compare-section-disclosure > summary[\s\S]*cursor:\s*pointer/, "compare section summary is visibly interactive");
  assert.match(compareCss, /\.v3-compare-final-choice-card__evidence > summary[\s\S]*cursor:\s*pointer/, "compare evidence summary is visibly interactive");
  assert.match(ratesCss, /\.fee-terminal__table-wrapper:focus-visible[\s\S]*outline:/, "rates table wrapper has a keyboard focus state");
  assert.match(ratesCss, /\.fee-terminal__table-wrapper[\s\S]*overflow-x:\s*auto/, "rates table remains horizontally scrollable instead of overflowing the page");
});
