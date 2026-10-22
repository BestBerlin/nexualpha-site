import test from "node:test";
import assert from "node:assert/strict";
import * as regional from "../src/data/regional-directory.js";
import { readFile } from "node:fs/promises";

test("empty directory returns to exact market research with safe decision context", () => {
  assert.equal(typeof regional.regionalResearchReturnHref, "function");
  for (const [market, pathname] of [["KR", "/kr"], ["JP", "/jp"], ["TR", "/ko/markets/turkiye"], ["US", "/us"]]) {
    const href = regional.regionalResearchReturnHref({market, locale: "ko", product: "spot", accountStage: "existing_account", funding: "KRW deposit and withdrawal"});
    const url = new URL(href, "https://nexualpha.com");
    assert.equal(url.pathname, pathname);
    assert.equal(new URLSearchParams(url.hash.split('?')[1] || url.search).get("market"), market);
    assert.equal(new URLSearchParams(url.hash.split('?')[1] || url.search).get("locale"), market === "US" ? "ko" : null, "only a country page with a different display edition needs a locale override");
    assert.equal(new URLSearchParams(url.hash.split('?')[1] || url.search).get("product"), "spot");
    assert.equal(new URLSearchParams(url.hash.split('?')[1] || url.search).get("account_stage"), "existing_account");
    if (market === "KR") assert.equal(new URLSearchParams(url.hash.split('?')[1] || url.search).get("funding"), "KRW deposit and withdrawal");
  }
  for (const market of ["unknown", "global", "ZZ", "https://evil.example"]) assert.equal(regional.regionalResearchReturnHref({market}), null);
});

test("empty state renders a native localized recovery anchor", async () => {
 const jsx = await readFile(new URL("../src/components/v3/VenueYellowPages.jsx", import.meta.url), "utf8");
 assert.match(jsx, /href=\{regionalReturnHref\}/);
 assert.match(jsx, /data-cta-placement="directory-empty-region-return"/);
 assert.match(jsx, /returnToRegion: "지역 조사로 돌아가기"/);
});

test("actual empty-state SSR has 15 localized region links and no unknown-market loop", async () => {
 const {execFileSync} = await import("node:child_process");
 const {mkdtemp, writeFile, rm} = await import("node:fs/promises");
 const path = await import("node:path");
 const root = process.cwd(); const dir = await mkdtemp(path.join(root, "tests/.tmp-r70-return-"));
 const locales = ["en", "zh-Hans", "zh-Hant", "ja", "ko", "tr", "pt-BR", "es", "de", "fr", "it", "ru", "ar", "id", "vi"];
 try {
  const entry=path.join(dir,"entry.jsx");const bundle=path.join(dir,"bundle.cjs");
  await writeFile(entry, `import React from "react"; import {renderToStaticMarkup} from "react-dom/server"; import {VenueYellowPages} from "../../src/components/v3/VenueYellowPages.jsx";
  console.log(JSON.stringify(${JSON.stringify(locales)}.map(locale=>({locale, html:renderToStaticMarkup(React.createElement(VenueYellowPages,{venues:[],locale,market:"KR",product:"spot",accountStage:"existing_account",funding:"KRW deposit and withdrawal"}))})).concat([{locale:"unknown",html:renderToStaticMarkup(React.createElement(VenueYellowPages,{venues:[],locale:"en",market:"unknown"}))}])));`);
  execFileSync(path.join(root,"node_modules/.bin/esbuild"),[entry,"--bundle","--platform=node","--format=cjs","--jsx=automatic",`--outfile=${bundle}`,"--loader:.css=empty","--loader:.svg=text","--log-level=warning"],{cwd:root,stdio:"pipe"});
  const rows=JSON.parse(execFileSync("node",[bundle],{cwd:root,encoding:"utf8",maxBuffer:10*1024*1024}));
  for(const row of rows){
   const anchor=row.html.match(/<a\b([^>]*data-cta-placement="directory-empty-region-return"[^>]*)>(.*?)<\/a>/s);
   if(row.locale==="unknown"){assert.equal(anchor,null);continue;}
   assert.ok(anchor,row.locale);assert.ok(anchor[2].trim());assert.doesNotMatch(anchor[2],/undefined|null/);
   const url=new URL(anchor[1].match(/href="([^"]+)"/)[1].replaceAll("&amp;","&"),"https://nexualpha.com");assert.equal(url.pathname,"/kr");assert.equal(new URLSearchParams(url.hash.split('?')[1] || url.search).get("market"),"KR");assert.equal(new URLSearchParams(url.hash.split('?')[1] || url.search).get("account_stage"),"existing_account");
   if(row.locale!=="en") assert.notEqual(anchor[2],"Return to market research");
   if(row.locale==="ko")assert.equal(anchor[2],"지역 조사로 돌아가기");
  }
 }finally{await rm(dir,{recursive:true,force:true});}
});
