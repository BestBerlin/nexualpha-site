import { loopbackUnavailableReason } from './sandbox-network.mjs';
import test from "node:test";
import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createOgImageRoute, wrapText, formatUsdCompact, socialImagePathForRoute, OG_WIDTH, OG_HEIGHT } from "../server/og-image.mjs";
import { CUSTOM_INVITE_CODES } from "../src/data/partner-registry.js";
import { publicCtaForVenue } from "../src/data/public-cta.js";
import worker, { routeMetadata, applySocialImage } from "../worker/index.js";
import { createProductionServer } from "../server.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.join(here, "..", "public");

const ARTICLE = {
  slug: "verify-official-exchange-site",
  status: "PUBLISHED",
  category: "research",
  categoryName: { en: "Source-Backed Research", "zh-Hans": "源头核验研究" },
  publishedAt: "2026-10-09T08:00:00.000Z",
  title: {
    en: "How to Verify the Official Crypto Exchange Website Before Clicking, Signing In or Depositing Any Funds at All This Year",
    "zh-Hans": "点击、登录或入金前，如何核验加密交易所官方网站",
    ar: "كيفية التحقق من موقع منصة العملات الرسمي قبل النقر أو تسجيل الدخول أو الإيداع",
  },
  summary: { en: "s" },
  content: { en: "body" },
  sources: [{ id: "a", url: "https://example.com" }],
  seo: { noindex: false },
};
const MARKET_EVENTS = {
  generatedAt: "2026-10-10T14:05:00.000Z",
  liquidations: { h24: { longUsd: 212_400_000, shortUsd: 98_300_000, totalUsd: 310_700_000, orders: 4211, largest: { symbol: "BTCUSDT", side: "long", usd: 12_400_000, at: "2026-10-10T03:00:00.000Z" } } },
};

const pngSize = (buffer) => ({ width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) });
const isPng = (buffer) => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

async function fixture() {
  const dir = await mkdtemp(path.join(tmpdir(), "og-image-"));
  const clientRoot = path.join(dir, "dist", "client");
  await mkdir(path.join(clientRoot, "content"), { recursive: true });
  await mkdir(path.join(clientRoot, "brands"), { recursive: true });
  await mkdir(path.join(clientRoot, "brand", "nexualpha"), { recursive: true });
  await mkdir(path.join(clientRoot, "intel"), { recursive: true });
  await writeFile(path.join(clientRoot, "content", "news-feed.json"), JSON.stringify({ articles: [ARTICLE, { ...ARTICLE, slug: "draft-only", status: "DRAFT" }] }));
  await writeFile(path.join(clientRoot, "intel", "market-events.json"), JSON.stringify(MARKET_EVENTS));
  await copyFile(path.join(publicRoot, "brands", "okx.png"), path.join(clientRoot, "brands", "okx.png"));
  await copyFile(path.join(publicRoot, "brand", "nexualpha", "nexualpha-social-v1.jpg"), path.join(clientRoot, "brand", "nexualpha", "nexualpha-social-v1.jpg"));
  const cacheDir = path.join(dir, "og-cache");
  return { dir, clientRoot, cacheDir, close: () => rm(dir, { recursive: true, force: true }) };
}

const get = (route, url) => route(new Request(url));

test("every card kind renders a 1200x630 PNG with public cache headers", async () => {
  const f = await fixture();
  try {
    const route = createOgImageRoute({ clientRoot: f.clientRoot, buildId: "3.0-test" });
    for (const [url, cacheControl] of [
      ["https://nexualpha.com/og/news/verify-official-exchange-site.png", "public, max-age=86400"],
      ["https://nexualpha.com/og/news/verify-official-exchange-site.png?locale=zh-Hans", "public, max-age=86400"],
      ["https://nexualpha.com/og/news/verify-official-exchange-site.png?locale=ar", "public, max-age=86400"],
      ["https://nexualpha.com/og/venue/okx.png", "public, max-age=86400"],
      ["https://nexualpha.com/og/venue/binance.png?locale=ja", "public, max-age=86400"],
      ["https://nexualpha.com/og/compare/binance-vs-okx.png", "public, max-age=86400"],
      ["https://nexualpha.com/og/liquidations/24h.png", "public, max-age=600"],
      ["https://nexualpha.com/og/default/site.png", "public, max-age=86400"],
    ]) {
      const response = await get(route, url);
      assert.equal(response.status, 200, url);
      assert.equal(response.headers.get("content-type"), "image/png", url);
      assert.equal(response.headers.get("cache-control"), cacheControl, url);
      assert.match(response.headers.get("etag"), /^"[a-f0-9]{20}"$/, url);
      const png = Buffer.from(await response.arrayBuffer());
      assert.ok(isPng(png), `${url} is a PNG`);
      assert.deepEqual(pngSize(png), { width: OG_WIDTH, height: OG_HEIGHT }, url);
      assert.equal(response.headers.get("content-length"), String(png.length), url);
    }
    const head = await route(new Request("https://nexualpha.com/og/venue/okx.png", { method: "HEAD" }));
    assert.equal(head.status, 200);
    assert.equal(head.body, null);
  } finally {
    await f.close();
  }
});

test("unknown ids, kinds and malformed paths answer 404 without rendering", async () => {
  const f = await fixture();
  let renders = 0;
  try {
    const route = createOgImageRoute({ clientRoot: f.clientRoot, buildId: "3.0-test", loadRenderer: async () => { renders += 1; throw new Error("must not render"); } });
    for (const url of [
      "https://nexualpha.com/og/news/not-an-article.png",
      "https://nexualpha.com/og/news/draft-only.png",
      "https://nexualpha.com/og/venue/not-a-venue.png",
      "https://nexualpha.com/og/compare/binance-vs-nowhere.png",
      "https://nexualpha.com/og/compare/binance-vs-binance.png",
      "https://nexualpha.com/og/compare/binance.png",
      "https://nexualpha.com/og/liquidations/7d.png",
      "https://nexualpha.com/og/default/other.png",
      "https://nexualpha.com/og/poster/okx.png",
      "https://nexualpha.com/og/venue/okx.jpg",
      "https://nexualpha.com/og/venue/OKX.png",
      "https://nexualpha.com/og/venue/..%2F..%2Fetc.png",
    ]) {
      const response = await get(route, url);
      assert.equal(response.status, 404, url);
      assert.equal(response.headers.get("cache-control"), "public, max-age=300", url);
    }
    assert.equal(renders, 0);
  } finally {
    await f.close();
  }
});

test("rendered cards are cached in memory and on disk under the build id", async () => {
  const f = await fixture();
  try {
    let renders = 0;
    const counting = async () => { const mod = await import("@resvg/resvg-js"); renders += 1; return mod.Resvg; };
    const route = createOgImageRoute({ clientRoot: f.clientRoot, buildId: "3.0-build-A", cacheDir: f.cacheDir, loadRenderer: counting });
    const first = Buffer.from(await (await get(route, "https://nexualpha.com/og/venue/okx.png")).arrayBuffer());
    const second = Buffer.from(await (await get(route, "https://nexualpha.com/og/venue/okx.png")).arrayBuffer());
    assert.ok(first.equals(second));
    assert.equal(route.cacheSize(), 1);
    const files = (await readdir(f.cacheDir)).filter((name) => name.endsWith(".png"));
    assert.equal(files.length, 1, "one PNG persisted on disk");
    // A fresh process with the same build id serves from disk without loading the renderer.
    let coldRenders = 0;
    const cold = createOgImageRoute({ clientRoot: f.clientRoot, buildId: "3.0-build-A", cacheDir: f.cacheDir, loadRenderer: async () => { coldRenders += 1; throw new Error("disk cache expected"); } });
    const cached = await get(cold, "https://nexualpha.com/og/venue/okx.png");
    assert.equal(cached.status, 200);
    assert.ok(Buffer.from(await cached.arrayBuffer()).equals(first));
    assert.equal(coldRenders, 0);
    // A new build id is a new cache key.
    const next = createOgImageRoute({ clientRoot: f.clientRoot, buildId: "3.0-build-B", cacheDir: f.cacheDir, loadRenderer: counting });
    await get(next, "https://nexualpha.com/og/venue/okx.png");
    assert.equal((await readdir(f.cacheDir)).filter((name) => name.endsWith(".png")).length, 2);
    // Conditional requests answer 304.
    const etag = (await get(route, "https://nexualpha.com/og/venue/okx.png")).headers.get("etag");
    const conditional = await route(new Request("https://nexualpha.com/og/venue/okx.png", { headers: { "if-none-match": etag } }));
    assert.equal(conditional.status, 304);
    // Liquidation cards are live data: memory only, never persisted.
    await get(route, "https://nexualpha.com/og/liquidations/24h.png");
    assert.equal((await readdir(f.cacheDir)).filter((name) => name.endsWith(".png")).length, 2);
  } finally {
    await f.close();
  }
});

test("cards print page facts, only public CTA invite codes, and right-aligned RTL titles", async () => {
  const f = await fixture();
  try {
    const route = createOgImageRoute({ clientRoot: f.clientRoot, buildId: "3.0-test" });
    const codes = Object.values(CUSTOM_INVITE_CODES).filter((code) => typeof code === "string" && code.length >= 4);
    assert.ok(codes.length > 0);
    for (const [kind, id] of [["venue", "okx"], ["venue", "binance"], ["venue", "bitget"], ["compare", "binance-vs-okx"], ["compare", "okx-vs-bitget-vs-bybit"]]) {
      const svg = await route.svgFor(kind, id, "en");
      assert.ok(svg, `${kind}/${id} resolves`);
      const permitted = kind === "venue" ? publicCtaForVenue(id).inviteCode : null;
      for (const code of codes) if (code !== permitted) assert.ok(!svg.includes(code), `${kind}/${id} must not print another invite code`);
      if (permitted) { assert.ok(svg.includes(permitted)); assert.match(svg, /commission/); }
    }
    const okx = await route.svgFor("venue", "okx", "en");
    assert.match(okx, /OKX/);
    assert.match(okx, /0\.08% \/ 0\.10%/, "spot maker/taker from exchange-facts");
    assert.match(okx, /Fees checked 2026-\d\d-\d\d/);
    assert.match(okx, /Rebate share up to 40%/, "owner-confirmed OKX share from home-rebate-tiers");
    assert.match(okx, /data:image\/png;base64,/, "local logo embedded");
    const uniswap = await route.svgFor("venue", "uniswap", "en");
    assert.match(uniswap, /Not yet checked/, "unchecked fees are never estimated");
    const compare = await route.svgFor("compare", "binance-vs-okx", "en");
    assert.match(compare, /Binance/);
    assert.match(compare, /0\.10% \/ 0\.10%/);
    assert.match(compare, /0\.02% \/ 0\.05%/);
    const liq = await route.svgFor("liquidations", "24h", "en");
    assert.match(liq, /\$311M/);
    assert.match(liq, /Longs {2}\$212M/);
    assert.match(liq, /Shorts {2}\$98\.3M/);
    assert.match(liq, /\$12\.4M · BTCUSDT Longs/);
    const news = await route.svgFor("news", "verify-official-exchange-site", "en");
    assert.match(news, /Source-Backed Research/);
    assert.match(news, /2026-10-09/);
    assert.equal((news.match(/data-og-title="true"/g) || []).length, 2, "article title uses at most two lines");
    assert.match(news, /…<\/text>/, "truncated title ends with an ellipsis");
    const ar = await route.svgFor("news", "verify-official-exchange-site", "ar");
    assert.match(ar, /direction="rtl"/);
    assert.match(ar, /text-anchor="end"[^>]*xml:lang="ar"[^>]*>كيفية/);
    const zh = await route.svgFor("news", "verify-official-exchange-site", "zh-Hans");
    assert.match(zh, /源头核验研究/);
    assert.match(zh, /点击、登录或入金前/);
  } finally {
    await f.close();
  }
});

test("a missing liquidation feed renders an 'updating' card and a missing renderer falls back to the brand image", async () => {
  const f = await fixture();
  try {
    const noFeed = createOgImageRoute({ clientRoot: f.clientRoot, buildId: "3.0-test", marketEventsFile: path.join(f.dir, "absent.json") });
    const updating = await get(noFeed, "https://nexualpha.com/og/liquidations/24h.png");
    assert.equal(updating.status, 200);
    assert.equal(updating.headers.get("cache-control"), "public, max-age=300");
    assert.match(await noFeed.svgFor("liquidations", "24h", "en"), /Liquidation feed is updating/);
    const fallback = createOgImageRoute({ clientRoot: f.clientRoot, buildId: "3.0-test", fallbackImage: path.join(f.clientRoot, "brand", "nexualpha", "nexualpha-social-v1.jpg"), loadRenderer: async () => { throw new Error("no native binary"); } });
    const response = await get(fallback, "https://nexualpha.com/og/venue/okx.png");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "image/jpeg");
    assert.equal(response.headers.get("x-nexualpha-og"), "fallback");
    assert.equal(fallback.rendererFailed(), true);
  } finally {
    await f.close();
  }
});

test("wrapText keeps three lines with an ellipsis and formatUsdCompact rounds like the page", () => {
  const long = wrapText("Alpha ".repeat(80), { fontSize: 58, maxWidth: 1056, maxLines: 3 });
  assert.equal(long.length, 3);
  assert.ok(long[2].endsWith("…"));
  const short = wrapText("Binance vs OKX fees", { fontSize: 58, maxWidth: 1056, maxLines: 3 });
  assert.deepEqual(short, ["Binance vs OKX fees"]);
  const hard = wrapText("x".repeat(500), { fontSize: 58, maxWidth: 1056, maxLines: 3 });
  assert.equal(hard.length, 3);
  assert.ok(hard[2].endsWith("…"));
  assert.deepEqual(wrapText("", { fontSize: 58, maxWidth: 1056 }), []);
  assert.equal(formatUsdCompact(310_700_000), "$311M");
  assert.equal(formatUsdCompact(1_234_000_000), "$1.23B");
  assert.equal(formatUsdCompact(98_300_000), "$98.3M");
  assert.equal(formatUsdCompact(12_400), "$12K");
  assert.equal(formatUsdCompact(-1), "–");
});

test("route metadata points og:image and twitter:image at the page's card by route kind", async () => {
  const feed = { articles: [ARTICLE] };
  const env = { ASSETS: { fetch: async (req) => new URL(req.url).pathname === "/content/news-feed.json" ? new Response(JSON.stringify(feed)) : new Response("", { status: 404 }) } };
  const news = await routeMetadata(new URL("https://nexualpha.com/news/verify-official-exchange-site"), env);
  assert.equal(news.image, "https://nexualpha.com/og/news/verify-official-exchange-site.png?v=2");
  const newsZh = await routeMetadata(new URL("https://nexualpha.com/zh-hans/news/verify-official-exchange-site"), env);
  assert.equal(newsZh.image, "https://nexualpha.com/og/news/verify-official-exchange-site.png?v=2&locale=zh-Hans");
  const okx = await routeMetadata(new URL("https://nexualpha.com/exchanges/okx"), {});
  assert.equal(okx.image, "https://nexualpha.com/og/venue/okx.png?v=2");
  const compare = await routeMetadata(new URL("https://nexualpha.com/compare/binance-vs-okx"), {});
  assert.equal(compare.image, "https://nexualpha.com/og/compare/binance-vs-okx.png?v=2");
  const missing = await routeMetadata(new URL("https://nexualpha.com/exchanges/not-a-venue"), {});
  assert.equal(missing.status, 404);
  assert.equal(missing.image, undefined, "404 pages keep the brand image");
  const home = await routeMetadata(new URL("https://nexualpha.com/"), {});
  // Owner 2026-10-11 (brand slogans): the home page uses the default card, which carries slogan A under the wordmark.
  assert.equal(home.image, "https://nexualpha.com/og/default/site.png?v=2", "home uses the slogan card");
  const homeAr = await routeMetadata(new URL("https://nexualpha.com/ar/"), {});
  assert.equal(homeAr.image, "https://nexualpha.com/og/default/site.png?v=2&locale=ar", "home card follows the edition locale");
  // Generic by route kind, so pages built in parallel branches pick a card up as soon as they return 200.
  assert.equal(applySocialImage({ status: 200 }, "/liquidations", "en").image, "https://nexualpha.com/og/liquidations/24h.png?v=2");
  assert.equal(applySocialImage({ status: 200 }, "/funding-rates", "ar").image, "https://nexualpha.com/og/funding/rates.png?v=2&locale=ar");
  assert.equal(applySocialImage({ status: 200, image: "https://nexualpha.com/custom.png" }, "/exchanges/okx").image, "https://nexualpha.com/custom.png", "a route's own image wins");
  assert.equal(socialImagePathForRoute("/methodology"), null);
  assert.equal(socialImagePathForRoute("/news/"), null);
  // Rendered head: og:image plus explicit dimensions, twitter card stays summary_large_image.
  const html = await (await worker.fetch(new Request("https://nexualpha.com/exchanges/okx"), {
    ASSETS: { fetch: async (req) => new URL(req.url).pathname === "/index.html" || new URL(req.url).pathname === "/exchanges/okx"
      ? new Response("<!doctype html><html><head><title>x</title></head><body><div id=\"root\"></div></body></html>", { headers: { "content-type": "text/html; charset=utf-8" } })
      : new Response("", { status: 404 }) },
  })).text();
  assert.match(html, /<meta property="og:image" content="https:\/\/nexualpha\.com\/og\/venue\/okx\.png\?v=2"/);
  assert.match(html, /<meta property="og:image:width" content="1200"/);
  assert.match(html, /<meta property="og:image:height" content="630"/);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/nexualpha\.com\/og\/venue\/okx\.png\?v=2"/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);
  // The worker alone never serves an HTML page at an image URL.
  const workerOnly = await worker.fetch(new Request("https://nexualpha.com/og/venue/okx.png?v=2"), { ASSETS: { fetch: async () => new Response("<html></html>") } });
  assert.equal(workerOnly.status, 404);
});

test("the production server serves /og cards before the worker and keeps HEAD/trailing-slash behaviour", {skip:await loopbackUnavailableReason()}, async () => {
  const f = await fixture();
  let server;
  try {
    await writeFile(path.join(f.clientRoot, "index.html"), "<html></html>");
    server = await createProductionServer({
      appRoot: f.dir,
      env: { DIST_ROOT: path.join(f.dir, "dist"), OG_CACHE_DIR: f.cacheDir, BUILD_ID: "3.0-test-build" },
      worker: { fetch: async () => new Response("site-html", { headers: { "content-type": "text/html" } }) },
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const png = await fetch(`${base}/og/compare/binance-vs-okx.png?locale=zh-Hans`);
    assert.equal(png.status, 200);
    assert.equal(png.headers.get("content-type"), "image/png");
    assert.equal(png.headers.get("cache-control"), "public, max-age=86400");
    assert.deepEqual(pngSize(Buffer.from(await png.arrayBuffer())), { width: 1200, height: 630 });
    assert.equal((await fetch(`${base}/og/venue/nope.png`)).status, 404);
    assert.equal(await (await fetch(`${base}/exchanges/okx`)).text(), "site-html", "other routes still reach the worker");
    const files = (await readdir(f.cacheDir)).filter((name) => name.endsWith(".png"));
    assert.equal(files.length, 1, "disk cache written through OG_CACHE_DIR");
  } finally {
    if (server?.listening) await new Promise((resolve) => { server.close(resolve); server.closeIdleConnections?.(); });
    await f.close();
  }
});

test('stock news cards embed the same local SVG used by stock identities', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'stock-news-og-'));
  try {
    await mkdir(path.join(root, 'content'));
    await mkdir(path.join(root, 'brands/stocks'), { recursive: true });
    await copyFile(new URL('../public/brands/stocks/aapl.svg', import.meta.url), path.join(root, 'brands/stocks/aapl.svg'));
    await writeFile(path.join(root, 'content/news-feed.json'), JSON.stringify({ articles: [{
      slug: 'apple-tokenized-stocks', status: 'PUBLISHED', title: { en: 'Apple tokenized stocks' },
      category: 'research', publishedAt: '2026-10-23T00:00:00Z',
    }, { slug: 'ordinary-news', status: 'PUBLISHED', title: { en: 'Exchange research' }, category: 'research', publishedAt: '2026-10-23T00:00:00Z' }] }));
    const handler = createOgImageRoute({ clientRoot: root });
    const svg = await handler.svgFor('news', 'apple-tokenized-stocks');
    assert.match(svg, /data:image\/svg\+xml;base64,/);
    assert.doesNotMatch(svg, /href="\/brands\/stocks/);
    const embedded = svg.match(/data:image\/svg\+xml;base64,([^"\s]+)/)[1];
    assert.match(Buffer.from(embedded, 'base64').toString(), /<svg/);
    const unrelated = await handler.svgFor('news', 'ordinary-news');
    assert.doesNotMatch(unrelated, /data:image\/svg\+xml;base64,/);
    assert.match(unrelated, /Exchange research/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
