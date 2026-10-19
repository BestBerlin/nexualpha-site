import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createServer as createViteServer } from "vite";
import { clickMetadata } from "../server/click-metadata.mjs";
import { createCtaClickBeacon, createRateLimiter, clientKey, validateCtaClick } from "../server/cta-click.mjs";
import { createProductionServer } from "../server.mjs";
import { ctaClickPayload, ctaClickSource, registrationAnchor, sendCtaClick } from "../src/data/cta-click-beacon.js";

const wait = () => new Promise((r) => setTimeout(r, 60));
const rows = async (file) => (await readFile(file, "utf8").catch(() => "")).trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));

async function fixture() {
  const dir = await mkdtemp(path.join(tmpdir(), "cta-click-"));
  const distRoot = path.join(dir, "dist");
  await mkdir(path.join(distRoot, "client", "intel"), { recursive: true });
  await mkdir(path.join(dir, "app"), { recursive: true });
  await writeFile(path.join(distRoot, "client", "intel", "partners.json"), JSON.stringify({ partners: [
    { slug: "okx", registrationUrl: "https://www.okx.com/join/nexu888" },
    { slug: "bitget", registrationUrl: "https://www.bitget.com/referral/register?code=nexu" },
    { slug: "bad", registrationUrl: "javascript:alert(1)" },
  ] }));
  const eventFile = path.join(dir, "private", "clicks", "go-clicks.jsonl");
  return { dir, distRoot, clientRoot: path.join(distRoot, "client"), eventFile, close: () => rm(dir, { recursive: true, force: true }) };
}

const post = (body, headers = {}) => new Request("https://nexualpha.com/api/cta-click", {
  method: "POST", body: typeof body === "string" ? body : JSON.stringify(body),
  headers: { origin: "https://nexualpha.com", "content-type": "application/json", "user-agent": "Mozilla/5.0 (iPhone)", ...headers },
});

test("cta-click beacon appends one anonymous site click to the shared click file", async () => {
  const f = await fixture();
  try {
    const handle = createCtaClickBeacon({ clientRoot: f.clientRoot, eventFile: f.eventFile, now: () => new Date("2026-10-10T12:00:00Z") });
    const res = await handle(post({ partner: "OKX", src: "home-v7-hero", path: "/zh-hans/exchanges/okx" }), "203.0.113.9");
    assert.equal(res.status, 204);
    assert.equal(res.headers.get("cache-control"), "no-store");
    await wait();
    assert.deepEqual(await rows(f.eventFile), [{ t: "2026-10-10T12:00:00.000Z", partner: "okx", src: "home-v7-hero", ref: "/zh-hans/exchanges/okx", kind: "site", cls: "unknown", inapp: "none", path: "/zh-hans/exchanges/okx", locale: "zh-Hans" }]);
    const raw = await readFile(f.eventFile, "utf8");
    assert.doesNotMatch(raw, /203\.0\.113\.9/, "IPs are never written");
  } finally { await f.close(); }
});

test("click metadata keeps only safe path, locale and country attribution", () => {
  assert.deepEqual(clickMetadata({ ref: "https://nexualpha.com/pt-br/compare/binance-vs-okx?utm_source=x", src: "telegram" }), { path: "/pt-br/compare/binance-vs-okx", locale: "pt-BR", country: null });
  assert.deepEqual(clickMetadata({ path: "/br", src: "home-v7-hero" }), { path: "/br", locale: "pt-BR", country: null });
  assert.deepEqual(clickMetadata({ path: "/br/en", src: "home-v7-hero" }), { path: "/br/en", locale: "en", country: null });
  assert.deepEqual(clickMetadata({ src: "tg-digest-zh", country: "gb" }), { path: null, locale: "zh-Hans", country: "GB" });
  assert.deepEqual(clickMetadata({ ref: "https://evil.example/zh-hans/exchanges/okx", locale: "<script>", country: "ZZZ" }), { path: null, locale: null, country: null });
  assert.deepEqual(clickMetadata({ path: "//evil.example/path", src: "home-v7-hero" }), { path: null, locale: null, country: null });
  assert.deepEqual(clickMetadata({ path: "/users/alice%40example.com", src: "home-v7-hero" }), { path: null, locale: null, country: null });
  assert.deepEqual(clickMetadata({ ref: "https://user@example.com/zh-hans/exchanges/okx", src: "home-v7-hero" }), { path: null, locale: null, country: null });
});

test("cta-click beacon rejects unknown partners, bad sources, long paths, oversized or non-JSON bodies and wrong methods", async () => {
  const f = await fixture();
  try {
    const handle = createCtaClickBeacon({ clientRoot: f.clientRoot, eventFile: f.eventFile });
    assert.equal((await handle(post({ partner: "nope", src: "home", path: "/" }))).status, 400);
    assert.equal((await handle(post({ partner: "bad", src: "home", path: "/" }))).status, 400, "non-https partner feed entries are not partners");
    assert.equal((await handle(post({ partner: "okx", src: "<script>", path: "/" }))).status, 400);
    assert.equal((await handle(post({ partner: "okx", src: "Home", path: "/" }))).status, 400, "src must be lower-case slug");
    assert.equal((await handle(post({ partner: "okx", src: "home", path: `/${"a".repeat(200)}` }))).status, 400);
    assert.equal((await handle(post({ partner: "okx", src: "home", path: "//evil.example/path" }))).status, 400);
    assert.equal((await handle(post({ partner: "okx", src: "home", path: "/users/alice%40example.com" }))).status, 400);
    assert.equal((await handle(post({ partner: "okx", src: "home", path: "https://evil.example/" }))).status, 400);
    assert.equal((await handle(post({ partner: "okx", src: "home" }))).status, 400);
    assert.equal((await handle(post("not json"))).status, 400);
    assert.equal((await handle(post({ partner: "okx", src: "home", path: "/", pad: "x".repeat(1100) }))).status, 413);
    assert.equal((await handle(new Request("https://nexualpha.com/api/cta-click"))).status, 405);
    await wait();
    assert.deepEqual(await rows(f.eventFile), []);
  } finally { await f.close(); }
});

test("cta-click beacon ignores crawlers and rate-limits per client in memory", async () => {
  const f = await fixture();
  try {
    const handle = createCtaClickBeacon({ clientRoot: f.clientRoot, eventFile: f.eventFile, limit: 3 });
    assert.equal((await handle(post({ partner: "okx", src: "home", path: "/" }, { "user-agent": "Googlebot/2.1" }), "a")).status, 204);
    await wait();
    assert.deepEqual(await rows(f.eventFile), [], "bot clicks are accepted but not counted");
    for (let i = 0; i < 3; i += 1) assert.equal((await handle(post({ partner: "bitget", src: "directory-card", path: "/exchanges" }), "b")).status, 204);
    const limited = await handle(post({ partner: "bitget", src: "directory-card", path: "/exchanges" }), "b");
    assert.equal(limited.status, 429);
    assert.equal((await handle(post({ partner: "bitget", src: "directory-card", path: "/exchanges" }), "c")).status, 204, "other clients are unaffected");
    await wait();
    assert.equal((await rows(f.eventFile)).length, 4);
  } finally { await f.close(); }
});

test("rate limiter is a fixed window that forgets clients after the window", () => {
  let t = 0;
  const allow = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
  assert.equal(allow("x"), true); assert.equal(allow("x"), true); assert.equal(allow("x"), false);
  t = 1001;
  assert.equal(allow("x"), true);
  // nginx appends the real client to X-Forwarded-For; the first value is whatever the client sent (spoofable).
  assert.equal(clientKey({ headers: { "x-forwarded-for": "198.51.100.7, 203.0.113.9" }, socket: { remoteAddress: "127.0.0.1" } }), "203.0.113.9");
  assert.equal(clientKey({ headers: { "x-real-ip": "203.0.113.9", "x-forwarded-for": "1.2.3.4, 203.0.113.9" }, socket: { remoteAddress: "127.0.0.1" } }), "203.0.113.9");
  assert.equal(clientKey({ headers: { "x-real-ip": "203.0.113.9", "x-forwarded-for": "6.6.6.6" } }), "203.0.113.9", "a spoofed first hop never becomes the key");
  assert.equal(clientKey({ headers: {}, socket: { remoteAddress: "10.0.0.2" } }), "10.0.0.2");
  assert.equal(validateCtaClick({ partner: "okx", src: "x", path: "/" }, new Map([["okx", "https://x"]])).partner, "okx");
  assert.equal(validateCtaClick(["okx"], new Map([["okx", "https://x"]])), null);
});

test("production server routes POST /api/cta-click and writes to CLICK_EVENT_FILE without disturbing /go", async () => {
  const f = await fixture();
  let server;
  try {
    server = await createProductionServer({
      appRoot: path.join(f.dir, "app"),
      env: { DIST_ROOT: f.distRoot, CLICK_EVENT_FILE: f.eventFile, INTEL_REFRESH: "off" },
      worker: { fetch: async () => new Response("site-ok") },
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const res = await fetch(`${base}/api/cta-click`, { method: "POST", headers: { origin: "https://nexualpha.com", "content-type": "application/json", "user-agent": "Mozilla/5.0" },
      body: JSON.stringify({ partner: "okx", src: "registration-card-primary", path: "/exchanges/okx" }) });
    assert.equal(res.status, 204);
    assert.equal((await fetch(`${base}/api/cta-click`)).status, 405);
    const go = await fetch(`${base}/go/okx?src=tg-channel-zh`, { redirect: "manual", headers: { "user-agent": "Mozilla/5.0" } });
    assert.equal(go.status, 302);
    const health = await fetch(`${base}/health/click-storage`);
    assert.equal(health.status, 200);
    const diagnostics = await health.json();
    assert.equal(diagnostics.ready, true);
    assert.equal(typeof diagnostics.failures, "number");
    assert.deepEqual(Object.keys(diagnostics).sort(), ["configured", "failures", "ready", "writes"]);
    await wait();
    const all = await rows(f.eventFile);
    assert.deepEqual(all.map((r) => [r.partner, r.src, r.ref, r.kind ?? null, r.path ?? null, r.locale ?? null]), [["okx", "registration-card-primary", "/exchanges/okx", "site", "/exchanges/okx", "en"], ["okx", "tg-channel-zh", null, null, null, "zh-Hans"]]);
  } finally {
    if (server?.listening) await new Promise((resolve) => { server.close(resolve); server.closeIdleConnections?.(); });
    await f.close();
  }
});

test("client payload reads the shared registration attributes and reports placement as src", () => {
  const anchor = { dataset: { ctaKind: "registration", ctaPlatform: "OKX", ctaPlacement: "Home-V7-Hero" }, href: "https://www.okx.com/join/x", closest: (sel) => (sel === "a[href]" ? anchor : null) };
  assert.deepEqual(ctaClickPayload(anchor, { pathname: "/zh-hans/exchanges/okx" }), { partner: "okx", src: "home-v7-hero", path: "/zh-hans/exchanges/okx" });
  assert.equal(ctaClickPayload({ dataset: { ctaKind: "registration", ctaPartner: "bitget" } }, { pathname: "/" }).partner, "bitget", "data-cta-partner is honoured too");
  assert.equal(ctaClickPayload({ dataset: { ctaKind: "registration" } }, { pathname: "/" }), null);
  assert.equal(ctaClickSource("activities-live-campaign"), "activities-live-campaign");
  assert.equal(ctaClickSource("Bad Placement!"), "unknown");
  assert.equal(registrationAnchor({ closest: () => anchor }), anchor);
  const research = { dataset: { ctaKind: "research" }, closest: (sel) => (sel === "a[href]" ? research : null) };
  assert.equal(registrationAnchor({ closest: () => research }), null);
  const beacons = [];
  assert.equal(sendCtaClick({ partner: "okx", src: "home-v7-hero", path: "/" }, { navigator: { sendBeacon: (url, blob) => { beacons.push([url, blob.type]); return true; } } }), true);
  assert.deepEqual(beacons, [["/api/cta-click", "application/json"]]);
  const fetched = [];
  sendCtaClick({ partner: "okx", src: "home-v7-hero", path: "/" }, { navigator: {}, fetcher: async (url, init) => { fetched.push([url, init.method, init.keepalive, JSON.parse(init.body).partner]); return new Response(null, { status: 204 }); } });
  assert.deepEqual(fetched, [["/api/cta-click", "POST", true, "okx"]]);
});

test("SSR pages carry data-cta-kind/platform/placement on every partner sign-up link", { timeout: 240_000 }, async () => {
  const vite = await createViteServer({ appType: "custom", logLevel: "error", server: { middlewareMode: true } });
  try {
    const { render } = await vite.ssrLoadModule("/src/entry-server.jsx");
    const expectations = [
      ["/", ["home-v7-hero", "home-v7-row"]],
      ["/exchanges", ["directory-card"]],
      ["/exchanges/okx", ["registration-card-primary"]],
      ["/compare/binance-vs-okx", ["compare-final-choice-registration", "compare-sticky-registration"]],
    ];
    for (const [url, placements] of expectations) {
      const html = (await render(url))?.html ?? (await render(url));
      const text = typeof html === "string" ? html : String(html?.appHtml || html?.html || "");
      const anchors = [...text.matchAll(/<a\b[^>]*rel="sponsored[^"]*"[^>]*>/g)].map((m) => m[0]);
      assert.ok(anchors.length > 0, `${url} renders at least one sponsored sign-up link`);
      for (const tag of anchors) {
        assert.match(tag, /data-cta-kind="registration"/, `${url}: ${tag.slice(0, 160)}`);
        assert.match(tag, /data-cta-platform="[a-z0-9_-]+"/, `${url}: ${tag.slice(0, 160)}`);
        assert.match(tag, /data-cta-placement="[a-z0-9][a-z0-9_-]{0,47}"/, `${url}: ${tag.slice(0, 160)}`);
      }
      for (const placement of placements) assert.ok(anchors.some((tag) => tag.includes(`data-cta-placement="${placement}"`)), `${url} exposes placement ${placement}`);
    }
  } finally { await vite.close(); }
});

test("beacon classification uses headers rather than submitted classification fields", async () => {
  const f = await fixture();
  try {
    const handle = createCtaClickBeacon({ clientRoot: f.clientRoot, eventFile: f.eventFile });
    const body = { partner: "okx", src: "home-test", path: "/", cls: "human", inapp: "x" };
    assert.equal((await handle(post(body, { "user-agent": "Mozilla/5.0 Telegram-iOS/11.0" }))).status, 204);
    assert.equal((await handle(post(body, { purpose: "prefetch" }))).status, 204);
    const saved = await rows(f.eventFile);
    assert.deepEqual(saved.map(({ cls, inapp }) => ({ cls, inapp })), [
      { cls: "unknown", inapp: "telegram" }, { cls: "prefetch", inapp: "none" },
    ]);
    assert.doesNotMatch(JSON.stringify(saved), /Mozilla|Telegram-iOS/);
  } finally { await f.close(); }
});
