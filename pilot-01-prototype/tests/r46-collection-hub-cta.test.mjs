import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { FACTBOOK_SLUGS } from "../src/data/factbook-registry.js";
import { TOPIC_SLUGS } from "../src/data/topic-guides-data.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const forbiddenCommercialSurface = /data-cta-kind="registration"|data-cta-kind="source"|href="https?:\/\/|nexu888|11350287|LUCKX|CANDY007|INS898|1836370407|luckybitcoin/i;

async function renderCollectionHubs() {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-r46-collection-hub-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { CollectionHubPage } from "../../src/components/v3/CollectionHubPage.jsx";

      const fixtures = {
        topicsEn: renderToStaticMarkup(React.createElement(CollectionHubPage, { kind: "topics", locale: "en" })),
        topicsZh: renderToStaticMarkup(React.createElement(CollectionHubPage, { kind: "topics", locale: "zh-Hans" })),
        factbookEn: renderToStaticMarkup(React.createElement(CollectionHubPage, { kind: "factbook", locale: "en" })),
      };

      console.log(JSON.stringify(fixtures));
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

    return JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 12 * 1024 * 1024 }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function hrefsFrom(html) {
  return [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
}

function assertOnsiteResearchCtas(html) {
  assert.doesNotMatch(html, forbiddenCommercialSurface);
  assert.ok(hrefsFrom(html).every((href) => href.startsWith("/")), "collection hub CTAs must stay on-site");
  assert.ok((html.match(/data-cta-kind="research"/g) || []).length >= 3, "collection hub needs research CTA coverage");
  assert.match(html, /data-growth-product="/);
}

test("R46 topic collection hub adds first-viewport and card research CTAs", async () => {
  const { topicsEn, topicsZh } = await renderCollectionHubs();

  assert.match(topicsEn, /data-collection-hub="topics"/);
  assert.match(topicsEn, /href="\/topics\/derivatives"[\s\S]*data-cta-kind="research"[\s\S]*data-cta-placement="topics-collection-hero-primary"/);
  assert.match(topicsEn, /href="\/rates"[\s\S]*data-cta-placement="topics-collection-hero-secondary"/);
  assert.match(topicsEn, /data-growth-decision="topic_research_path"/);
  assert.equal((topicsEn.match(/data-cta-placement="topics-collection-card"/g) || []).length, TOPIC_SLUGS.length);
  assertOnsiteResearchCtas(topicsEn);

  assert.match(topicsZh, /先看衍生品决策路径/);
  assert.match(topicsZh, /href="\/zh-hans\/topics\/derivatives"/);
  assertOnsiteResearchCtas(topicsZh);
});

test("R46 factbook collection hub adds source-record research CTAs without outbound commercial links", async () => {
  const { factbookEn } = await renderCollectionHubs();

  assert.match(factbookEn, /data-collection-hub="factbook"/);
  assert.match(factbookEn, /href="\/factbook\/binance"[\s\S]*data-cta-kind="research"[\s\S]*data-cta-placement="factbook-collection-hero-primary"/);
  assert.match(factbookEn, /href="\/exchanges"[\s\S]*data-cta-placement="factbook-collection-hero-secondary"/);
  assert.match(factbookEn, /data-growth-decision="factbook_source_record"/);
  assert.equal((factbookEn.match(/data-cta-placement="factbook-collection-card"/g) || []).length, FACTBOOK_SLUGS.length);
  assertOnsiteResearchCtas(factbookEn);
});
