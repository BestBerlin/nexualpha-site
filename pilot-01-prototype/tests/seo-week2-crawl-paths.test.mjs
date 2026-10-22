import assert from "node:assert/strict";
import test from "node:test";
import { createServer as createViteServer } from "vite";

let vite;

async function renderRoute(pathname) {
  if (!vite) {
    vite = await createViteServer({
      appType: "custom",
      logLevel: "error",
      server: { middlewareMode: true },
    });
  }
  const { render } = await vite.ssrLoadModule("/src/entry-server.jsx");
  return render(pathname);
}

function assertLinks(html, hrefs, label) {
  for (const href of hrefs) {
    assert.match(html, new RegExp(`<a\\b[^>]+href="${href.replaceAll("/", "\\/")}"`), `${label}: ${href}`);
  }
}

test.after(async () => {
  await vite?.close();
});

test("home SSR exposes crawl paths through the fee comparison and current navigation", async () => {
  const html = await renderRoute("/");

  assert.match(html, /<main[^>]*class="[^"]*home-refinement/);
  assertLinks(html, [
    "/exchanges",
    "/compare",
    "/academy",
    "/news",
  ], "home SSR crawl links");
});

test("Week2 related priority pages keep compact SSR links to adjacent crawl targets", async () => {
  const directory = await renderRoute("/exchanges");
  const rates = await renderRoute("/rates");
  const compare = await renderRoute("/compare/binance-vs-okx");
  const tokenized = await renderRoute("/topics/tokenized-assets");

  assert.match(directory, /data-crawl-priority-links="directory"/);
  assertLinks(directory, ["/compare/binance-vs-okx", "/rates", "/topics/tokenized-assets"], "directory SSR crawl links");

  assert.match(rates, /data-crawl-priority-links="rates"/);
  assertLinks(rates, ["/compare/bybit-vs-bitget", "/topics/tokenized-treasuries"], "rates SSR crawl links");

  assert.match(compare, /data-crawl-priority-links="compare"/);
  assertLinks(compare, ["/rates", "/topics/tokenized-stocks-vs-perpetuals"], "compare SSR crawl links");

  assert.match(tokenized, /data-crawl-priority-links="tokenized"/);
  assertLinks(tokenized, ["/compare/hyperliquid-vs-dydx", "/rates"], "tokenized SSR crawl links");
});
