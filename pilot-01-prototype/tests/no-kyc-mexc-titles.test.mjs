import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { TOPIC_GUIDES } from "../src/data/topic-guides-data.js";
import { topicHubItems } from "../src/data/collection-hubs.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import worker, { routeMetadata, routeSeoPayload } from "../worker/index.js";
import { budgetTitle, titleBudgetForLocale } from "../src/data/meta-description.js";
import { noKycMetaTitle } from "../src/data/no-kyc-meta-title.js";

// Class b: MEXC requires identity verification under its User Agreement. The approved
// title change contrasts wallet self-custody with a KYC exchange, preserving /topics/no-kyc.
const titles = JSON.parse(await readFile(new URL("./fixtures/no-kyc-titles.json", import.meta.url), "utf8"));
const locales = Object.keys(titles);
const root = fileURLToPath(new URL("..", import.meta.url));
const dir = await mkdtemp(path.join(root, "tests/.tmp-no-kyc-titles-"));
let renders;
try {
  const entry = path.join(dir, "entry.mjs"), out = path.join(dir, "out.cjs");
  await writeFile(entry, `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {TopicGuidePage} from '../../src/components/v3/TopicGuidePage.jsx';const r={};for(const locale of ${JSON.stringify(locales)})r[locale]=renderToStaticMarkup(React.createElement(TopicGuidePage,{slug:'no-kyc',locale}));console.log(JSON.stringify(r));`);
  await build({ entryPoints: [entry], bundle: true, platform: "node", format: "cjs", outfile: out, loader: { ".css": "empty" }, logLevel: "silent" });
  renders = JSON.parse(execFileSync(process.execPath, [out], { encoding: "utf8", maxBuffer: 5 * 1024 * 1024 }));
} finally {
  await rm(dir, { recursive: true, force: true });
}

for (const locale of locales) {
  test(`${locale}: no-KYC H1, hub and metadata explicitly contrast self-custody with KYC MEXC`, async () => {
    const prefix = locale === "en" ? "" : locale === "id" ? "/id-id" : `/${locale.toLowerCase()}`;
    const pathname = `${prefix}/topics/no-kyc`;
    const expected = titles[locale];
    const dom = new JSDOM(renders[locale]);
    assert.deepEqual([...dom.window.document.querySelectorAll("h1")].map(node => node.textContent), [expected]);
    dom.window.close();
    const hub = topicHubItems(locale).find(item => item.slug === "no-kyc");
    assert.equal(hub.title.replace(/ — NexuAlpha$/, ""), expected);
    assert.equal(hub.href, "/topics/no-kyc");
    const seo = computeRouteSeo({ pathname, locale });
    const meta = await routeMetadata(new URL(`https://nexualpha.com${pathname}`), {});
    const payload = routeSeoPayload(meta, new URL(`https://nexualpha.com${pathname}`));
    const expectedMetaTitle = noKycMetaTitle(locale);
    assert.ok(expectedMetaTitle.length <= titleBudgetForLocale(locale), `${locale}: compact meta title length`);
    for (const title of [seo.title, meta.title, payload.title]) {
      assert.equal(title, expectedMetaTitle);
      assert.ok(title.includes("MEXC") && title.includes("Hyperliquid") && title.includes("dYdX") && (/KYC|实名|實名/.test(title)));
    }
    // Exercise actual HTML head injection, rather than inferring it from metadata tables.
    const response = await worker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), {
      ASSETS: { fetch: async request => new URL(request.url).pathname.endsWith(".json") ? new Response("missing", { status: 404 }) : new Response(`<!doctype html><html><head><title>base</title></head><body>${renders[locale]}</body></html>`, { headers: { "content-type": "text/html" } }) },
    });
    assert.equal(response.status, 200);
    const html = new JSDOM(await response.text());
    assert.equal(html.window.document.title, noKycMetaTitle(locale));
    assert.equal(html.window.document.querySelector('meta[property="og:title"]').content, html.window.document.title);
    html.window.close();
  });
}

test("source topic title fields preserve the KYC contrast and the original slug", () => {
  const topic = TOPIC_GUIDES["no-kyc"];
  assert.equal(topic.slug, "no-kyc");
  for (const [locale, suffix] of [["en", "En"], ["zh-Hans", "Zh"], ["zh-Hant", "ZhHant"]]) {
    assert.equal(topic[`title${suffix}`], titles[locale]);
    assert.equal(topic[`metaTitle${suffix}`], `${titles[locale]} — NexuAlpha`);
  }
});
