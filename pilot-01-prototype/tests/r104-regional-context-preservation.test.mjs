import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { regionalVenueCta } from "../src/data/source-bound-cta.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

async function renderFixture(source) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-r104-context-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, source);

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

    return execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8" });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("source-bound regional research fallback preserves decision context", () => {
  const cta = regionalVenueCta("drift", "en", "BR", "perpetuals", {
    accountStage: "existing_account",
    funding: "Pix",
  });

  assert.equal(cta.direct, false);
  assert.equal(cta.ctaState, "blocked");
  assert.match(cta.ctaHref, /^\/exchanges\/drift\?/);
  assert.match(cta.ctaHref, /market=BR/);
  assert.match(cta.ctaHref, /product=perpetuals/);
  assert.match(cta.ctaHref, /account_stage=existing_account/);
  assert.match(cta.ctaHref, /funding=Pix/);
  assert.match(cta.ctaHref, /#source-review$/);
});

test("compare final-choice detail links preserve account stage and funding", async () => {
  const html = await renderFixture(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { CompareFinalChoiceCard } from "../../src/components/v3/CompareFinalChoiceCard.jsx";
    import { venueDatabase } from "../../src/data/venue-database.js";

    const directAnswer = {
      title: "Choose before signup",
      body: "Compare the official source path before opening an account.",
      checks: ["Region", "Funding"],
      nextSteps: ["Open the detail page first"],
      sourceLinks: [],
      internalLinks: [],
    };

    const profiles = [venueDatabase.binance, venueDatabase.okx];
    const html = renderToStaticMarkup(React.createElement(CompareFinalChoiceCard, {
      directAnswer,
      profiles,
      locale: "en",
      market: "BR",
      product: "spot",
      accountStage: "existing_account",
      funding: "Pix",
    }));
    console.log(html);
  `);

  const detailLinks = Array.from(html.matchAll(/<a[^>]+href="([^"]+)"[^>]+data-cta-placement="compare-final-choice-detail"/g), (match) => match[1]);
  assert.equal(detailLinks.length, 2, "both final-choice detail links should render with preserved context");
  for (const href of detailLinks) {
    assert.match(href, /^\/exchanges\/(binance|okx)\?/);
    assert.match(href, /market=BR/);
    assert.match(href, /product=spot/);
    assert.match(href, /account_stage=existing_account/);
    assert.match(href, /funding=Pix/);
    assert.match(href, /#registration-path$/);
  }
});


test("compare final-choice internal links merge regional context without replacing explicit link product", async () => {
  const html = await renderFixture(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { CompareFinalChoiceCard } from "../../src/components/v3/CompareFinalChoiceCard.jsx";
    import { venueDatabase } from "../../src/data/venue-database.js";

    const directAnswer = {
      title: "Choose before signup",
      body: "Compare the official source path before opening an account.",
      checks: ["Region", "Funding"],
      nextSteps: ["Open the detail page first"],
      sourceLinks: [],
      internalLinks: [["Spot fee calculator", "/rates?product=spot"]],
    };

    const profiles = [venueDatabase.binance, venueDatabase.okx];
    const html = renderToStaticMarkup(React.createElement(CompareFinalChoiceCard, {
      directAnswer,
      profiles,
      locale: "en",
      market: "BR",
      product: "perpetuals",
      accountStage: "existing_account",
      funding: "Pix",
    }));
    console.log(html);
  `);

  const internalLink = Array.from(html.matchAll(/<a[^>]+href="([^"]+)"[^>]+data-cta-placement="compare-direct-answer-internal"/g), (match) => match[1])
    .find((href) => href.startsWith("/rates?"));
  assert.ok(internalLink, "direct-answer internal rates link should render");
  assert.match(internalLink, /market=BR/);
  assert.match(internalLink, /product=spot/);
  assert.doesNotMatch(internalLink, /product=perpetuals/);
  assert.match(internalLink, /account_stage=existing_account/);
  assert.match(internalLink, /funding=Pix/);
});

test("compare final-choice context links reject invalid account stage and market funding pairs", async () => {
  const html = await renderFixture(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { CompareFinalChoiceCard } from "../../src/components/v3/CompareFinalChoiceCard.jsx";
    import { venueDatabase } from "../../src/data/venue-database.js";

    const directAnswer = {
      title: "Choose before signup",
      body: "Compare the official source path before opening an account.",
      checks: ["Region", "Funding"],
      nextSteps: ["Open the detail page first"],
      sourceLinks: [],
      internalLinks: [["Perp calculator", "/rates?product=perpetuals"]],
    };

    const profiles = [venueDatabase.binance, venueDatabase.okx];
    const html = renderToStaticMarkup(React.createElement(CompareFinalChoiceCard, {
      directAnswer,
      profiles,
      locale: "en",
      market: "JP",
      product: "spot",
      accountStage: "admin_account",
      funding: "Pix",
    }));
    console.log(html);
  `);

  assert.doesNotMatch(html, /account_stage=admin_account/);
  assert.doesNotMatch(html, /funding=Pix/);
  const detailLinks = Array.from(html.matchAll(/<a[^>]+href="([^"]+)"[^>]+data-cta-placement="compare-final-choice-detail"/g), (match) => match[1]);
  assert.equal(detailLinks.length, 2);
  for (const href of detailLinks) {
    assert.match(href, /market=JP/);
    assert.match(href, /product=spot/);
    assert.doesNotMatch(href, /account_stage=/);
    assert.doesNotMatch(href, /funding=/);
  }
});

test("Spanish compare page preserves MX account and funding context across research links", async () => {
  const html = await renderFixture(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { CompareDeepPage } from "../../src/components/v3/V3Pages.jsx";
    import { venueDatabase } from "../../src/data/venue-database.js";

    const pageCopy = {
      common: { dimension: "Dimensión" },
      assetCapabilities: { none: "Pendiente" },
    };

    const html = renderToStaticMarkup(React.createElement(CompareDeepPage, {
      copy: pageCopy,
      locale: "es",
      selected: ["binance", "okx"],
      venues: Object.values(venueDatabase),
      updates: [],
      market: "MX",
      product: "spot",
      accountStage: "another_platform",
      funding: "SPEI",
    }));
    console.log(html);
  `);

  const linksByPlacement = (placement) => Array.from(
    html.matchAll(new RegExp(`<a[^>]+href="([^"]+)"[^>]+data-cta-placement="${placement}"`, "g")),
    (match) => match[1]
  );

  for (const placement of [
    "compare-verdict-detail",
    "compare-metric-matrix-detail",
    "compare-decision-guide",
  ]) {
    const links = linksByPlacement(placement);
    assert.ok(links.length >= 2, `${placement} should render compare research links`);
    for (const href of links) {
      assert.match(href, /market=MX/, `${placement} keeps market`);
      assert.match(href, /product=spot/, `${placement} keeps product`);
      assert.match(href, /account_stage=another_platform/, `${placement} keeps account stage`);
      assert.match(href, /funding=SPEI/, `${placement} keeps funding`);
    }
  }

  const curatedLinks = Array.from(html.matchAll(/<a[^>]+href="([^"]+)"[^>]+data-growth-placement="curated-comparison"/g), (match) => match[1]);
  assert.ok(curatedLinks.length > 0, "curated comparison links should render");
  for (const href of curatedLinks) {
    assert.match(href, /market=MX/);
    assert.match(href, /product=spot/);
    assert.match(href, /account_stage=another_platform/);
    assert.match(href, /funding=SPEI/);
  }
});

test("venue direct-answer internal links preserve regional decision context", async () => {
  const html = await renderFixture(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { VenueDetailPage } from "../../src/components/v3/V3Pages.jsx";
    import { venueDatabase } from "../../src/data/venue-database.js";

    const html = renderToStaticMarkup(React.createElement(VenueDetailPage, {
      copy: {},
      locale: "en",
      venue: venueDatabase.binance,
      venues: Object.values(venueDatabase),
      updates: [],
      market: "MX",
      product: "perpetuals",
      accountStage: "another_platform",
      funding: "SPEI",
    }));
    console.log(html);
  `);

  const directAnswerLinks = Array.from(
    html.matchAll(/<a[^>]+href="([^"]+)"[^>]+data-cta-placement="venue-direct-answer-internal"/g),
    (match) => match[1].replaceAll("&amp;", "&")
  );

  const compareLink = directAnswerLinks.find((href) => href.startsWith("/compare/binance-vs-okx?"));
  assert.ok(compareLink, "default direct-answer compare link should render");
  assert.match(compareLink, /market=MX/);
  assert.match(compareLink, /product=perpetuals/);
  assert.match(compareLink, /account_stage=another_platform/);
  assert.match(compareLink, /funding=SPEI/);

  const ratesLink = directAnswerLinks.find((href) => href.startsWith("/rates?"));
  assert.ok(ratesLink, "default direct-answer rates link should render");
  assert.match(ratesLink, /market=MX/);
  assert.match(ratesLink, /product=spot/);
  assert.doesNotMatch(ratesLink, /product=perpetuals/);
  assert.match(ratesLink, /account_stage=another_platform/);
  assert.match(ratesLink, /funding=SPEI/);
});

test("priority venue direct-answer internal links preserve validated context", async () => {
  const html = await renderFixture(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { VenueDetailPage } from "../../src/components/v3/V3Pages.jsx";
    import { venueDatabase } from "../../src/data/venue-database.js";

    const html = renderToStaticMarkup(React.createElement(VenueDetailPage, {
      copy: {},
      locale: "es",
      venue: venueDatabase.binance,
      venues: Object.values(venueDatabase),
      updates: [],
      market: "MX",
      product: "spot",
      accountStage: "another_platform",
      funding: "SPEI",
    }));
    console.log(html);
  `);

  const directAnswerLinks = Array.from(
    html.matchAll(/<a[^>]+href="([^"]+)"[^>]+data-cta-placement="venue-direct-answer-internal"/g),
    (match) => match[1].replaceAll("&amp;", "&")
  );

  assert.ok(directAnswerLinks.length >= 3, "priority direct-answer internal links should render");
  for (const href of directAnswerLinks) {
    assert.match(href, /market=MX/);
    assert.match(href, /product=spot/);
    assert.match(href, /account_stage=another_platform/);
    assert.match(href, /funding=SPEI/);
  }
});
