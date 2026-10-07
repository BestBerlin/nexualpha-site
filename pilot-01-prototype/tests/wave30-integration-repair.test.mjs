import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildHydrationBootstrap } from "../src/data/hydration-bootstrap.js";

test("verify-whole-site final language policy accepts fixed BR and unsupported news locale fallbacks", async () => {
  const source = await readFile(new URL("../scripts/verify-whole-site.mjs", import.meta.url), "utf8");
  assert.match(source, /function expectedDocumentLang\(job\)/);
  assert.match(source, /\(job\.path==='\/br'\|\|job\.path\.startsWith\('\/br\/'\)\)\&\&job\.locale==='en'/);
  assert.match(source, /job\.path==='\/news'/);
  assert.match(source, /return normalize\(job\.locale\)/);
  assert.match(source, /job\.path\.startsWith\('\/news\/'\)/);
  assert.match(source, /String\(job\.locale\|\|'\'\)\.startsWith\('zh'\)\?'zh-Hans':'en'/);
  assert.match(source, /if\(lang==='ar'\&\&data\.dir!=='rtl'\)/);
});

test("news fallback SSR opts out of hydration while normal prerender keeps hydrateRoot", async () => {
  const worker = await readFile(new URL("../worker/index.js", import.meta.url), "utf8");
  const main = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
  assert.match(worker, /data-nexualpha-client-render="true"/);
  const browserUrl="https://nexualpha.com/news/source-backed-guide?locale=ja&market=JP";
  const prerenderState={pathname:"/news/source-backed-guide",locale:"en",version:"nexualpha-prerender-v1"};
  const fallback=buildHydrationBootstrap({browserUrl,prerenderState,hasServerHtml:true,clientRender:true});
  assert.equal(fallback.hydrate,false);
  assert.equal(fallback.initialUrl,browserUrl,'fallback first pass keeps the authoritative browser URL');
  const normal=buildHydrationBootstrap({browserUrl,prerenderState,hasServerHtml:true,clientRender:false});
  assert.equal(normal.hydrate,true);
  assert.equal(normal.initialUrl,"https://nexualpha.com/news/source-backed-guide?locale=en");
  assert.equal(normal.browserUrl,browserUrl,'normal hydration preserves full URL for the mounted pass');
  assert.match(main, /clientRender: root\?\.dataset\.nexualphaClientRender === "true"/);
  assert.match(main, /if \(bootstrap\.hydrate\)/);
  assert.match(main, /hydrateRoot\(root, app\)/);
  assert.match(main, /createRoot\(root\)\.render\(app\)/);
});
