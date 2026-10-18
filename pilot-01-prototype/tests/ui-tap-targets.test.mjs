import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
test("activities nav preserves labels and links without stars across locales", async () => {
 const vite = await createServer({ configFile: false, esbuild: { jsx: "automatic" }, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: "custom" });
 try {
  const { SiteHeader } = await vite.ssrLoadModule("/src/components/shell/SiteHeader.jsx");
  for (const locale of ["en","zh-Hans","zh-Hant","es","pt-BR","fr","de","it","ja","ko","ru","tr","id","vi","ar","ur","uk"]) {
   const href = "/" + locale + "/activities";
   const html = renderToStaticMarkup(React.createElement(SiteHeader, { locale, copy: { ui: { menu: "Menu", language: "Language" } }, nav: [["Activities",href]], homeHref:"/", navState:()=>({}), localeOptions:[], mobileOpen:false }));
   assert.ok(!html.includes("✦"), locale);
   assert.ok(html.includes('href="' + href + '"'), locale);
   assert.match(html, /nx-hot-chip__full">[^<]+<\/span>/, locale);
  }
  assert.ok(!read("../src/styles/v5/shell.css").includes("✦"));
 } finally { await vite.close(); }
});
test("FAQ source links get a mobile-only 44px hit area", () => {
 const css = read("../src/components/tokenized-stocks/tokenized-stocks.css");
 const mobile = css.match(/@media \(max-width: 768px\) \{([\s\S]*?)\n\}/)?.[1];
 assert.ok(mobile);
 assert.match(mobile, /\.nxts-faq \.nxts-src a.*display: inline-flex/);
 assert.match(mobile, /\.nxts-faq \.nxts-src a.*min-block-size: 44px/);
 for (const file of ["TokenizedStocksPages.jsx","TokenizedStocksDetail.jsx"]) {
  assert.ok(read("../src/components/tokenized-stocks/" + file).includes('className="nxts'));
 }
});
