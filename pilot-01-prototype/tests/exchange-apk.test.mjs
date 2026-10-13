// Official Android APK buttons (lead 2026-10-13): /go/okx-apk and /go/binance-apk count the click and 302 to the
// exchange's own APK URL; a cached probe falls back to the exchange's download page when a hop leaves the venue's host
// (OKX: *.okx.com, Binance: download.binance.com) or the file is no longer an APK. The buttons sit after the App Store /
// Google Play buttons on /exchanges/<venue>/app, rel="nofollow", only where sign-up CTAs show (never ru/ar/zh-Hant/ur/uk,
// never a restricted ?market=), no fine print. Binance's APK does not embed the code, so its code + copy + line show.
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import worker from "../worker/index.js";
import { EXCHANGE_APKS, EXCHANGE_APK_COPY_LOCALES, apkHostAllowed, exchangeApkCopy, isApkContentType } from "../src/data/exchange-apk.js";
import { appDownloadSignupAllowed } from "../src/data/app-downloads.js";
import { appDownloadPath } from "../src/data/app-download-path.js";
import { LOCALE_PREFIX_BY_CODE, localizedPath } from "../src/data/locale-routing.js";
import { publicCtaForVenue } from "../src/data/source-bound-cta.js";
import { createGoRedirect } from "../server/go-redirect.mjs";
import { checkApkChain, createApkProbe } from "../server/exchange-apk-probe.mjs";
import { createSsrHarness, SHELL_HTML, hydrateInJsdom, hydrationErrors } from "./helpers/ssr-hydration-harness.mjs";

const OKX = EXCHANGE_APKS.okx;
const BINANCE = EXCHANGE_APKS.binance;
const OKX_CDN = "https://static.okx.com/upgradeapp/growth/channel/apk/android_41620026.apk";
const APK_TYPE = "application/vnd.android.package-archive";
const NEUTRAL = ["ru", "ar", "zh-Hant", "ur", "uk"];

const assets = { fetch: async (request) => {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/prerender-manifest.json") return Response.json({ version: "nexualpha-prerender-v1", routes: {} });
  if (pathname === "/index.html") return new Response(SHELL_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });
  return new Response("missing", { status: 404 });
} };
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
const fetchPage = (p) => worker.fetch(new Request(`https://nexualpha.com${p}`, { headers: { accept: "text/html" } }), { ASSETS: assets, NEWS_SSR_RENDER: (href, options) => harness.render(href, options) });
const main = (html) => html.match(/<main\b[\s\S]*?<\/main>/)?.[0] || "";

// fetch stub: "METHOD url" or url -> { status, headers } (or an Error to throw); records every call.
function stubFetch(routes) {
  const calls = [];
  const impl = async (url, init = {}) => {
    const method = init.method || "GET";
    calls.push({ url: String(url), method, redirect: init.redirect });
    const row = routes[`${method} ${url}`] ?? routes[String(url)];
    if (!row) throw new Error(`unexpected fetch ${method} ${url}`);
    if (row instanceof Error) throw row;
    return new Response(null, { status: row.status, headers: row.headers || {} });
  };
  return { impl, calls };
}
const okxHealthy = { [OKX.officialUrl]: { status: 302, headers: { location: OKX_CDN } }, [OKX_CDN]: { status: 200, headers: { "content-type": APK_TYPE } } };
const binanceHealthy = { [BINANCE.officialUrl]: { status: 200, headers: { "content-type": APK_TYPE } } };

test("official URLs, fallbacks and codes are unchanged", () => {
  assert.equal(OKX.goSlug, "okx-apk");
  assert.equal(OKX.officialUrl, "https://www.okx.com/affiliatedownload/apk?channelId=NEXU888");
  assert.equal(OKX.fallbackUrl, "https://www.okx.com/download");
  assert.equal(BINANCE.goSlug, "binance-apk");
  assert.equal(BINANCE.officialUrl, "https://download.binance.com/pack/BNApp_F0000928.apk");
  assert.equal(BINANCE.fallbackUrl, "https://www.binance.com/download");
  assert.equal(publicCtaForVenue("okx", "en").inviteCode, "nexu888");
  assert.equal(publicCtaForVenue("binance", "en").inviteCode, "11350287");
});

test("host rule: OKX only on https *.okx.com, Binance only on https download.binance.com", () => {
  for (const ok of [OKX_CDN, "https://okx.com/x.apk", OKX.officialUrl]) assert.equal(apkHostAllowed("okx", ok), true, ok);
  for (const bad of ["http://static.okx.com/a.apk", "https://okx.com.evil.test/a.apk", "https://evilokx.com/a.apk", "https://user@static.okx.com/a.apk",
    "https://static.okx.com:8443/a.apk", "https://example.com/a.apk", "not a url", null]) assert.equal(apkHostAllowed("okx", bad), false, String(bad));
  assert.equal(apkHostAllowed("binance", BINANCE.officialUrl), true);
  for (const bad of ["https://www.binance.com/a.apk", "https://download.binance.com.evil.test/a.apk", "http://download.binance.com/a.apk", "https://cdn.example.net/a.apk"]) assert.equal(apkHostAllowed("binance", bad), false, bad);
  assert.equal(apkHostAllowed("bybit", "https://www.bybit.com/a.apk"), false);
  assert.equal(isApkContentType(`${APK_TYPE}; charset=binary`), true);
  assert.equal(isApkContentType("text/html"), false);
});

test("probe: healthy chains, off-host targets never fetched, non-APK, missing file, network error, HEAD refused", async () => {
  let s = stubFetch(okxHealthy);
  assert.equal((await checkApkChain("okx", s.impl)).healthy, true);
  assert.deepEqual(s.calls.map((c) => [c.method, c.url, c.redirect]), [["HEAD", OKX.officialUrl, "manual"], ["HEAD", OKX_CDN, "manual"]]);
  s = stubFetch(binanceHealthy);
  assert.equal((await checkApkChain("binance", s.impl)).healthy, true);

  for (const [venue, routes] of [
    ["okx", { [OKX.officialUrl]: { status: 302, headers: { location: "https://cdn.example.net/android.apk" } } }],
    ["binance", { [BINANCE.officialUrl]: { status: 302, headers: { location: "https://cdn.example.net/android.apk" } } }],
  ]) {
    s = stubFetch(routes);
    assert.equal((await checkApkChain(venue, s.impl)).healthy, false, venue);
    assert.equal(s.calls.length, 1, `${venue}: a target off the venue's host is never requested`);
  }
  for (const [venue, routes] of [
    ["okx", { ...okxHealthy, [OKX_CDN]: { status: 200, headers: { "content-type": "text/html" } } }],
    ["okx", { [OKX.officialUrl]: { status: 200, headers: { "content-type": "text/html" } } }],
    ["okx", { [OKX.officialUrl]: new Error("ECONNRESET") }],
    ["binance", { [BINANCE.officialUrl]: { status: 200, headers: { "content-type": "text/html" } } }],
    ["binance", { [`HEAD ${BINANCE.officialUrl}`]: { status: 404 }, [`GET ${BINANCE.officialUrl}`]: { status: 404 } }],
  ]) assert.equal((await checkApkChain(venue, stubFetch(routes).impl)).healthy, false);

  // okx.com handing OUR channel file to a regional mirror is healthy; the mirror itself is never requested.
  s = stubFetch({ [OKX.officialUrl]: { status: 302, headers: { location: `https://exgglyfor.mpwrs.cn${OKX.channelFile}` } } });
  assert.equal((await checkApkChain("okx", s.impl)).healthy, true);
  assert.equal(s.calls.length, 1, "the regional mirror is never requested");
  // A mirror redirect naming any other file stays unhealthy.
  s = stubFetch({ [OKX.officialUrl]: { status: 302, headers: { location: "https://exgglyfor.mpwrs.cn/upgradeapp/growth/channel/apk/android_99999999.apk" } } });
  assert.equal((await checkApkChain("okx", s.impl)).healthy, false);

  s = stubFetch({ [OKX.officialUrl]: okxHealthy[OKX.officialUrl], [`HEAD ${OKX_CDN}`]: { status: 405 }, [`GET ${OKX_CDN}`]: { status: 206, headers: { "content-type": APK_TYPE } } });
  assert.equal((await checkApkChain("okx", s.impl)).healthy, true);
  // A redirect loop on the right host gives up instead of following forever.
  s = stubFetch({ [BINANCE.officialUrl]: { status: 302, headers: { location: BINANCE.officialUrl } } });
  assert.equal((await checkApkChain("binance", s.impl)).healthy, false);
});

test("probe cache: one check per TTL, stale result served while a refresh runs, unhealthy -> fallback", async () => {
  let t = 0;
  let healthy = true;
  let checks = 0;
  const probe = createApkProbe("okx", { now: () => t, check: async () => { checks += 1; return { healthy }; } });
  assert.deepEqual(await Promise.all([probe(), probe()]), [OKX.officialUrl, OKX.officialUrl]);
  assert.equal(checks, 1, "concurrent cold requests share one check");
  t = 29 * 60 * 1000;
  await probe();
  assert.equal(checks, 1);
  healthy = false;
  t = 31 * 60 * 1000;
  assert.equal(await probe(), OKX.officialUrl, "expired healthy result is served while refreshing");
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(checks, 2);
  assert.equal(await probe(), OKX.fallbackUrl);
  assert.equal(await createApkProbe("binance", { check: async () => { throw new Error("boom"); } })(), BINANCE.fallbackUrl);
});

async function goSetup(apkTargets) {
  const dir = await mkdtemp(path.join(tmpdir(), "go-apk-"));
  await mkdir(path.join(dir, "client", "intel"), { recursive: true });
  await writeFile(path.join(dir, "client", "intel", "partners.json"), JSON.stringify({ partners: [{ slug: "okx", registrationUrl: "https://www.okx.com/join/nexu888" }] }));
  const eventFile = path.join(dir, "go.jsonl");
  return { handle: createGoRedirect({ clientRoot: path.join(dir, "client"), eventFile, apkTargets }), eventFile };
}

test("/go/okx-apk and /go/binance-apk 302 to the official URL and count the click like other /go routes", async () => {
  const { handle, eventFile } = await goSetup({ okx: createApkProbe("okx", { fetchImpl: stubFetch(okxHealthy).impl }), binance: createApkProbe("binance", { fetchImpl: stubFetch(binanceHealthy).impl }) });
  const human = { "user-agent": "Mozilla/5.0" };
  for (const apk of [OKX, BINANCE]) {
    const res = await handle(new Request(`https://nexualpha.com/go/${apk.goSlug}?src=app-apk-en`, { headers: human }));
    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), apk.officialUrl);
    assert.match(res.headers.get("x-robots-tag"), /noindex/);
    assert.equal(res.headers.get("cache-control"), "no-store");
  }
  await handle(new Request("https://nexualpha.com/go/okx-apk?src=app-apk-en", { headers: { "user-agent": "Googlebot/2.1" } }));
  await new Promise((r) => setTimeout(r, 50));
  const rows = (await readFile(eventFile, "utf8")).trim().split("\n").map((l) => JSON.parse(l));
  assert.deepEqual(rows.map((r) => [r.partner, r.src, r.venue, r.campaign]).sort(),
    [["binance-apk", "app-apk-en", "binance", "android-apk"], ["okx-apk", "app-apk-en", "okx", "android-apk"]], "human clicks only, crawler not counted");
});

test("/go/<venue>-apk falls back to the official download page when the chain breaks or leaves the venue's host", async () => {
  const human = { "user-agent": "Mozilla/5.0" };
  for (const [apk, routes] of [
    [OKX, { [OKX.officialUrl]: { status: 302, headers: { location: "https://cdn.example.net/android.apk" } } }],
    [OKX, { ...okxHealthy, [OKX_CDN]: { status: 200, headers: { "content-type": "text/html" } } }],
    [OKX, { [OKX.officialUrl]: new Error("timeout") }],
    [BINANCE, { [BINANCE.officialUrl]: { status: 302, headers: { location: "https://www.binance.com/en/download" } } }],
    [BINANCE, { [BINANCE.officialUrl]: { status: 200, headers: { "content-type": "text/html" } } }],
  ]) {
    const { handle } = await goSetup({ [apk.venue]: createApkProbe(apk.venue, { fetchImpl: stubFetch(routes).impl }) });
    const res = await handle(new Request(`https://nexualpha.com/go/${apk.goSlug}?src=x`, { headers: human }));
    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), apk.fallbackUrl);
  }
  // Whatever a probe returns, the route only ever sends visitors to the official URL or the official download page.
  const { handle } = await goSetup({ okx: async () => "https://evil.example/app.apk", binance: async () => { throw new Error("x"); } });
  assert.equal((await handle(new Request("https://nexualpha.com/go/okx-apk", { headers: human }))).headers.get("location"), OKX.fallbackUrl);
  assert.equal((await handle(new Request("https://nexualpha.com/go/binance-apk", { headers: human }))).headers.get("location"), BINANCE.fallbackUrl);
});

test("buttons: after the store buttons, nofollow, /go route, size, native copy; codes + copy buttons; neutral locales none", async () => {
  const expected = {
    okx: { en: ["Download Android APK (invite code built in)", "about 568 MB"], "zh-Hans": ["Android 直接下载（已绑定邀请码）", "约 568 MB"], tr: ["davet kodu dahil", "568"] },
    binance: { en: ["Download Android APK", "about 322 MB"], "zh-Hans": ["Android 直接下载", "约 322 MB"], tr: ["Android APK indir", "322"] },
  };
  for (const apk of [OKX, BINANCE]) for (const locale of Object.keys(LOCALE_PREFIX_BY_CODE)) {
    const p = localizedPath(appDownloadPath(apk.venue), locale);
    const html = main(await (await fetchPage(p)).text());
    const allowed = appDownloadSignupAllowed(apk.venue, { locale });
    if (NEUTRAL.includes(locale)) assert.equal(allowed, false, p);
    if (["en", "zh-Hans", "tr"].includes(locale)) assert.equal(allowed, true, p);
    if (!allowed) { assert.doesNotMatch(html, /data-official-apk|data-apk-code|\/go\/[a-z]+-apk/, p); continue; }
    assert.ok(EXCHANGE_APK_COPY_LOCALES.includes(locale), `native copy for ${locale}`);
    const tag = html.match(/<a\b[^>]*data-official-apk[^>]*>[\s\S]*?<\/a>/)?.[0];
    assert.ok(tag, p);
    assert.match(tag, new RegExp(`href="/go/${apk.goSlug}\\?src=app-apk-${locale.toLowerCase()}"`));
    assert.match(tag, /rel="nofollow"/);
    assert.ok(tag.includes(String(apk.sizeMb)), p);
    for (const text of expected[apk.venue][locale] || []) assert.ok(tag.includes(text), `${p}: ${text}`);
    const iStore = html.indexOf(">App Store</a>"), iPlay = html.indexOf(">Google Play</a>"), iApk = html.indexOf("data-official-apk");
    assert.ok(iStore > -1 && iStore < iPlay && iPlay < iApk, `${p}: store buttons first`);
    const code = publicCtaForVenue(apk.venue, locale).inviteCode;
    assert.ok(html.includes(`>${code}</strong>`), `${p}: code visible`);
    assert.match(html, /data-copy-code/);
    if (apk.codeBuiltIn) assert.doesNotMatch(html, /data-apk-code/, p);
    else {
      const line = html.match(/<p\b[^>]*data-apk-code[^>]*>[\s\S]*?<\/p>/)?.[0] || "";
      assert.ok(line.includes(exchangeApkCopy(apk.venue, locale, code).enterCode), p);
      assert.ok(line.includes(code) && /data-copy-code/.test(line), `${p}: code + copy button next to the APK button`);
    }
    assert.doesNotMatch(html, /not (?:investment|financial) advice|disclaimer|terms (?:and conditions )?apply|免责声明|非投资建议|佣金/i);
  }
  assert.ok(main(await (await fetchPage("/exchanges/binance/app")).text()).includes("Enter code 11350287 when you sign up"));
  assert.ok(main(await (await fetchPage("/zh-hans/exchanges/binance/app")).text()).includes("注册时填写邀请码 11350287"));
});

test("button gating: other venues, an explicit restricted market and hydration", async () => {
  for (const slug of ["bitget", "bybit"]) assert.doesNotMatch(main(await (await fetchPage(appDownloadPath(slug))).text()), /data-official-apk/, slug);
  assert.doesNotMatch(main(await (await fetchPage("/exchanges/okx/app?market=CA")).text()), /data-official-apk/);
  for (const p of ["/exchanges/okx/app", "/zh-hans/exchanges/okx/app", "/exchanges/binance/app"]) {
    const html = await (await fetchPage(p)).text();
    const hydrated = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${p}`, { inspect: (w) => w.document.querySelector("[data-official-apk]")?.getAttribute("href") });
    assert.deepEqual(hydrationErrors(hydrated.errors), [], p);
    assert.match(hydrated.inspected, /^\/go\/(?:okx|binance)-apk\?src=app-apk-/);
  }
});

test("no APK is hosted and the APK modules only know the exchanges' own URLs", async () => {
  const root = new URL("..", import.meta.url);
  const urls = [...(await readFile(new URL("src/data/exchange-apk.js", root), "utf8")).matchAll(/https?:\/\/[^\s"'`)]+/g)].map((m) => m[0]);
  assert.deepEqual(urls.sort(), [BINANCE.officialUrl, BINANCE.fallbackUrl, OKX.officialUrl, OKX.fallbackUrl].sort());
  assert.doesNotMatch(await readFile(new URL("server/exchange-apk-probe.mjs", root), "utf8"), /https?:\/\//);
  for (const dir of ["public", "public/downloads"]) {
    const names = await readdir(new URL(`${dir}/`, root)).catch(() => []);
    assert.equal(names.filter((n) => /\.apk$/i.test(n)).length, 0, dir);
  }
});
