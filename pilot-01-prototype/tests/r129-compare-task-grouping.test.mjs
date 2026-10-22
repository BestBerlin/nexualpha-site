import { existsSync } from 'node:fs';
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const css = readFileSync(new URL("../src/components/v3/crossroads-compare.css", import.meta.url), "utf8");

const renderComparePages = async (cases) => {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-r120-compare-hierarchy-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { CompareDeepPage } from "../../src/components/v3/V3Pages.jsx";
      import { CompareDeepPage as Before } from "/Users/bestberlin/Documents/ChatGPT/Crypto聚合/release-candidates/r128-home-mobile/candidate/src/components/v3/V3Pages.jsx";
      const NativeDate=Date; globalThis.Date=class extends NativeDate {constructor(...a){super(...(a.length?a:[1791158400000]));}static now(){return 1791158400000;}};
      import { venueDatabase } from "../../src/data/venue-database.js";
      const copy = { common: { dimension: "Dimension" }, assetCapabilities: { none: "Pending source review" } };
      const venues = Object.values(venueDatabase);
      const cases = ${JSON.stringify(cases)};
      console.log(JSON.stringify(cases.map((item) => ({
        key: item.key,
        html: renderToStaticMarkup(React.createElement(item.before ? Before : CompareDeepPage, {
          copy,
          locale: item.locale || "en",
          selected: item.selected,
          venues,
          updates: [],
          market: "unknown",
          product: "unknown",
        })),
      }))));
    `);
    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [entryPath, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundlePath}`, "--loader:.css=empty", "--log-level=warning"], { cwd: projectRoot, stdio: "pipe" });
    return JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};


const summaries=html=>[...html.matchAll(/<summary[^>]*>(.*?)<\/summary>/gs)].map(m=>m[1].replace(/<[^>]*>/g,''));
const hrefs=html=>[...html.matchAll(/\bhref="([^"]*)"/g)].map(m=>m[1]).sort();
test('R129 comparison groups each supporting task once and retains raw full links', {skip: !existsSync('/Users/bestberlin/Documents/ChatGPT/Crypto聚合/release-candidates/r128-home-mobile/candidate/src/components/v3/V3Pages.jsx') && 'Original R128 historical candidate is absent from a fresh checkout'},async()=>{
const cases=[['binance','okx'],['uniswap','jupiter'],['binance','kraken']].flatMap(selected=>['en','ja','ar'].flatMap(locale=>[{selected,locale,before:true},{selected,locale}]));
const results=await renderComparePages(cases);
for(let i=0;i<results.length;i+=2){const before=results[i].html,after=results[i+1].html;
assert.deepEqual(hrefs(after),hrefs(before),'all raw invitation and source hrefs retained');
if(cases[i].locale==='en'){
assert.equal(summaries(after).filter(s=>s.startsWith('Open scenario fit and next steps')).length,1,'one scenario entry');
assert.equal(summaries(after).filter(s=>s.startsWith('Open the detailed research comparison')).length,1,'one research entry');
}
assert.equal((after.match(/data-compare-task="research"/g)||[]).length,1);
assert.equal((after.match(/data-compare-task="scenario"/g)||[]).length,1);
}
});
