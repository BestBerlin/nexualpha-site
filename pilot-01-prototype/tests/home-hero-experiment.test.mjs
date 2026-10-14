// Home hero copy A/B (scorecard X5, 2026-10-11). Pins: the registry flag ships off (everyone A, no cookie, headers
// unchanged), server-side stable 50/50 cookie assignment, crawlers always A, variant B prerendered and served from the
// same fast path with SSR markup == hydrated markup for both variants, and every partner click (beacon, /go, v2 events)
// carrying the experiment id and variant while it runs.
import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import worker from "../worker/index.js";
import { experimentRegistry, HOME_HERO_ROUTES, validateExperimentDefinition, resolveExperimentContext } from "../src/data/experiment-registry.js";
import {
  HOME_HERO_COOKIE, HOME_HERO_EXPERIMENT_ID, assignHomeHeroVariant, clientHomeHeroVariant, homeHeroClickContext, homeHeroEventContext,
  isHomeHeroBot, isHomeHeroRoute, readHomeHeroCookie, homeHeroSetCookie,
} from "../src/data/home-hero-experiment.js";
import { HOME_HERO_B, heroCopyFor } from "../src/components/v7/home7-hero-variants.js";
import { H7_COPY } from "../src/components/v7/home7-copy.js";
import { localizedHref } from "../src/data/locale-routing.js";
import { formatPercent } from "../src/data/format-percent.js";
import { HOME_REBATE_MAX_PCT } from "../src/data/home-rebate-tiers.js";
import { getExperimentContext } from "../src/data/cta-analytics.js";
import { createGoRedirect } from "../server/go-redirect.mjs";
import { createCtaClickBeacon } from "../server/cta-click.mjs";
import { summarize } from "../server/growth-report.mjs";
import { createSsrHarness, prerenderState, rootInnerHtml, hydrateInJsdom, hydrationErrors, h1Texts } from "./helpers/ssr-hydration-harness.mjs";

const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"];
const HUMAN_UA = "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";
const BOT_UAS = [
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0 Safari/537.36",
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/140.0.0.0 Safari/537.36",
  "facebookexternalhit/1.1",
  "TelegramBot (like TwitterBot)",
  "",
];
const disabledRegistry = { ...experimentRegistry, [HOME_HERO_EXPERIMENT_ID]: { ...experimentRegistry[HOME_HERO_EXPERIMENT_ID], enabled: false, status: "DESIGNED" } };
const enabledRegistry = { ...experimentRegistry, [HOME_HERO_EXPERIMENT_ID]: { ...experimentRegistry[HOME_HERO_EXPERIMENT_ID], enabled: true, status: "ACTIVE" } };

test("registry: home_hero_copy_v1 is running (owner approved 2026-10-11), valid, on the 17 localized home routes", () => {
  const definition = experimentRegistry[HOME_HERO_EXPERIMENT_ID];
  assert.equal(definition.enabled, true, "owner approved variant B and started the test on 2026-10-11");
  assert.equal(definition.status, "ACTIVE");
  assert.deepEqual(validateExperimentDefinition(definition), { ok: true });
  assert.deepEqual([...HOME_HERO_ROUTES], LOCALES.map((locale) => localizedHref("/", { locale })));
  assert.equal(definition.control.id, "a");
  assert.equal(definition.treatment.id, "b");
  for (const route of HOME_HERO_ROUTES) assert.ok(isHomeHeroRoute(route) && isHomeHeroRoute(`${route}/`), route);
  assert.equal(isHomeHeroRoute("/exchanges"), false);
  // While disabled, the collector rejects any event claiming the experiment.
  assert.equal(resolveExperimentContext({ experiment: HOME_HERO_EXPERIMENT_ID, variant: "b", pathname: "/", market: "unknown", registry: disabledRegistry }).ok, false);
  assert.equal(resolveExperimentContext({ experiment: HOME_HERO_EXPERIMENT_ID, variant: "b", pathname: "/", market: "unknown" }).ok, true);
  assert.equal(resolveExperimentContext({ experiment: HOME_HERO_EXPERIMENT_ID, variant: "b", pathname: "/ar", market: "unknown", registry: enabledRegistry }).ok, true);
});

test("variant B copy: 17 locales, headline keeps {max}%, no new numbers, differs from A", () => {
  assert.deepEqual(Object.keys(HOME_HERO_B).sort(), [...LOCALES].sort());
  for (const locale of LOCALES) {
    const b = HOME_HERO_B[locale];
    assert.deepEqual(Object.keys(b).sort(), ["h1a", "h1b", "sub"], locale);
    assert.ok(b.h1b.includes("{max}%"), `${locale} h1b keeps the headline share placeholder`);
    assert.doesNotMatch(`${b.h1a} ${b.h1b.replace("{max}%", "")} ${b.sub}`, /\d/, `${locale}: no figures beyond the headline share`);
    assert.match(b.sub, /NexuAlpha/, `${locale}: names the partner invite link`);
    assert.notEqual(b.h1a, H7_COPY[locale].h1a, `${locale}: B headline differs from A`);
    const t = H7_COPY[locale];
    assert.equal(heroCopyFor(t, locale, "a"), t, "A is the live copy object, untouched");
    assert.equal(heroCopyFor(t, locale, "b").h1a, b.h1a);
    assert.equal(heroCopyFor(t, locale, "b").kick, t.kick, "only headline and subline change");
  }
});

test("assignment: flag off (or kill switch) = inactive for everyone, no cookie", () => {
  const off = { registry: disabledRegistry };
  for (const userAgent of [HUMAN_UA, ...BOT_UAS]) {
    for (const cookieHeader of ["", `${HOME_HERO_COOKIE}=b`]) {
      assert.deepEqual(assignHomeHeroVariant({ ...off, cookieHeader, userAgent }), { active: false, variant: "a", setCookie: null });
      assert.deepEqual(assignHomeHeroVariant({ cookieHeader, userAgent, force: "off" }), { active: false, variant: "a", setCookie: null }, "kill switch beats the live flag");
    }
  }
  assert.equal(homeHeroClickContext({ ...off, cookieHeader: `${HOME_HERO_COOKIE}=b`, userAgent: HUMAN_UA }), null);
  assert.equal(homeHeroClickContext({ cookieHeader: `${HOME_HERO_COOKIE}=b`, userAgent: HUMAN_UA, force: "off" }), null);
  assert.deepEqual(homeHeroEventContext({ ...off, pathname: "/", cookie: `${HOME_HERO_COOKIE}=b` }), {});
  assert.equal(clientHomeHeroVariant({ ...off, prerenderState: null, cookie: `${HOME_HERO_COOKIE}=b` }), "a");
});

test("assignment: stable cookie, 50/50 draw, crawlers always A without a cookie", () => {
  const on = { registry: enabledRegistry };
  assert.deepEqual(assignHomeHeroVariant({ ...on, userAgent: HUMAN_UA, random: () => 0.1 }), { active: true, variant: "a", setCookie: "a" });
  assert.deepEqual(assignHomeHeroVariant({ ...on, userAgent: HUMAN_UA, random: () => 0.9 }), { active: true, variant: "b", setCookie: "b" });
  for (let i = 0; i < 20; i++) {
    // An assigned visitor keeps the bucket on every later request, whatever the draw would say.
    assert.deepEqual(assignHomeHeroVariant({ ...on, userAgent: HUMAN_UA, cookieHeader: `theme=dark; ${HOME_HERO_COOKIE}=b; x=1`, random: () => 0.01 }), { active: true, variant: "b", setCookie: null });
    assert.deepEqual(assignHomeHeroVariant({ ...on, userAgent: HUMAN_UA, cookieHeader: `${HOME_HERO_COOKIE}=a`, random: () => 0.99 }), { active: true, variant: "a", setCookie: null });
  }
  let b = 0;
  const draws = 20000;
  for (let i = 0; i < draws; i++) if (assignHomeHeroVariant({ ...on, userAgent: HUMAN_UA }).variant === "b") b += 1;
  assert.ok(Math.abs(b / draws - 0.5) < 0.02, `50/50 within 2 pts (got ${(b / draws * 100).toFixed(1)}% B)`);
  for (const userAgent of BOT_UAS) {
    assert.ok(isHomeHeroBot(userAgent), userAgent);
    const result = assignHomeHeroVariant({ ...on, userAgent, cookieHeader: `${HOME_HERO_COOKIE}=b`, random: () => 0.9 });
    assert.equal(result.variant, /HeadlessChrome/.test(userAgent) ? "b" : "a", `browser mode preserves the cookie; named crawlers get control: ${userAgent}`);
    assert.equal(result.setCookie, null);
    assert.equal(homeHeroClickContext({ ...on, userAgent, cookieHeader: `${HOME_HERO_COOKIE}=b` }), null);
  }
  assert.equal(isHomeHeroBot(HUMAN_UA), false);
  assert.equal(readHomeHeroCookie(`${HOME_HERO_COOKIE}=c`), null, "unknown bucket values are ignored");
  assert.equal(homeHeroSetCookie("b"), "nx_hero=b; Path=/; Max-Age=2592000; SameSite=Lax; Secure");
  assert.equal(homeHeroSetCookie("x"), null);
  // Preview force (non-production only, server.mjs): "b" serves B to humans without touching cookies.
  assert.deepEqual(assignHomeHeroVariant({ userAgent: HUMAN_UA, force: "b" }), { active: true, variant: "b", setCookie: null, forced: true });
  assert.equal(assignHomeHeroVariant({ userAgent: BOT_UAS[0], force: "b" }).variant, "a");
});

test("browser: hydrates the server's variant on a home page, uses the cookie elsewhere only while enabled", () => {
  assert.equal(clientHomeHeroVariant({ prerenderState: { pathname: "/", heroVariant: "b" }, cookie: "nx_hero=a" }), "b");
  assert.equal(clientHomeHeroVariant({ prerenderState: { pathname: "/" }, cookie: "nx_hero=b", registry: enabledRegistry }), "a", "home HTML without a variant is A");
  assert.equal(clientHomeHeroVariant({ prerenderState: { pathname: "/exchanges" }, cookie: "nx_hero=b", registry: enabledRegistry }), "b");
  assert.equal(clientHomeHeroVariant({ prerenderState: { pathname: "/exchanges" }, cookie: "nx_hero=b", registry: disabledRegistry }), "a");
});

// ---- worker: SSR, headers, hydration ----
const SHELL = "<!doctype html><html lang=\"en\"><head><title>Shell</title><link rel=\"stylesheet\" href=\"/assets/index-AbCdEf12.css\"></head><body><div id=\"root\"></div><script type=\"module\" src=\"/assets/index-AbCdEf12.js\"></script></body></html>";
let harness;
let assets;
const rendered = {};
test.before(async () => {
  harness = await createSsrHarness();
  const files = new Map();
  const routes = {};
  // ar is a neutral locale (information-only home, no hero experiment copy), so id is the second edition here.
  for (const locale of ["en", "id"]) {
    const url = `https://nexualpha.com${localizedHref("/", { locale })}`;
    rendered[`${locale}:a`] = await harness.render(url, {});
    rendered[`${locale}:b`] = await harness.render(url, { heroVariant: "b" });
    files.set(`/prerender/${locale}/home.json`, JSON.stringify({ html: rendered[`${locale}:a`] }));
    files.set(`/prerender/${locale}/home-hero-b.json`, JSON.stringify({ html: rendered[`${locale}:b`] }));
    routes[`/|${locale}`] = { pathname: "/", locale, asset: `/prerender/${locale}/home.json`, searchPublished: true, heroVariants: { b: `/prerender/${locale}/home-hero-b.json` } };
  }
  files.set("/prerender-manifest.json", JSON.stringify({ version: "nexualpha-prerender-v1", routes }));
  files.set("/critical-css.json", JSON.stringify({ version: 1, routes: { home: { css: ".h7-hero{display:grid}", sheets: ["/assets/index-AbCdEf12.css"] } } }));
  assets = { fetch: async (request) => {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/" || pathname === "/index.html") return new Response(SHELL, { headers: { "content-type": "text/html; charset=utf-8" } });
    if (files.has(pathname)) return new Response(files.get(pathname), { headers: { "content-type": "application/json" } });
    return new Response("missing", { status: 404 });
  } };
});
test.after(async () => { await harness?.close(); });

const fetchHome = (pathname, { ua = HUMAN_UA, cookie, force = "off", method = "GET" } = {}) => worker.fetch(new Request(`https://nexualpha.com${pathname}`, {
  method, headers: { accept: "text/html", "user-agent": ua, ...(cookie ? { cookie } : {}) },
}), { ASSETS: assets, ...(force ? { HOME_HERO_EXPERIMENT_FORCE: force } : {}) });

test("worker, kill switch off: home HTML and headers are unchanged (A, public cache, no cookie, no variant state)", async () => {
  for (const cookie of [undefined, "nx_hero=b"]) {
    const response = await fetchHome("/", { cookie });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal(response.headers.get("x-nexualpha-hero-variant"), null);
    assert.match(response.headers.get("cache-control"), /^public, max-age=300/);
    assert.doesNotMatch(response.headers.get("vary") || "", /cookie/i);
    assert.equal(rootInnerHtml(html), rendered["en:a"]);
    assert.equal("heroVariant" in prerenderState(html), false);
    assert.match(html, /<style[^>]*>\.h7-hero\{display:grid\}/, "inline critical CSS path still applies");
  }
});

test("worker, experiment running: B visitors get the B prerender, private + Vary: Cookie, crawlers get A", async () => {
  const b = await fetchHome("/id-id", { cookie: "nx_hero=b", force: "on" });
  const bHtml = await b.text();
  assert.equal(rootInnerHtml(bHtml), rendered["id:b"], "served markup is the build-time B render");
  assert.equal(prerenderState(bHtml).heroVariant, "b");
  assert.equal(b.headers.get("x-nexualpha-hero-variant"), "b");
  assert.equal(b.headers.get("cache-control"), "private, max-age=300");
  assert.match(b.headers.get("vary"), /cookie/i);
  assert.equal(b.headers.get("set-cookie"), null, "an assigned visitor is not re-assigned");
  assert.match(bHtml, /<style[^>]*>\.h7-hero\{display:grid\}/, "critical CSS inlined for B too");
  assert.deepEqual(h1Texts(rootInnerHtml(bHtml)).slice(0, 1).map((text) => text.replace(/\u00a0/g, " ")), [`${HOME_HERO_B.id.h1a}${HOME_HERO_B.id.h1b.replace("{max}%", formatPercent("id", HOME_REBATE_MAX_PCT))}`]);

  for (const ua of BOT_UAS) {
    const bot = await fetchHome("/", { ua, cookie: "nx_hero=b", force: "on" });
    const html = await bot.text();
    const variant = /HeadlessChrome/.test(ua) ? "b" : "a";
    assert.equal(rootInnerHtml(html), rendered[`en:${variant}`], `browser context / named crawler: ${ua}`);
    assert.equal(prerenderState(html).heroVariant, variant);
    assert.equal(bot.headers.get("set-cookie"), null);
  }

  const seen = new Set();
  for (let i = 0; i < 40 && seen.size < 2; i++) {
    const fresh = await fetchHome("/", { force: "on" });
    const html = await fresh.text();
    const cookie = fresh.headers.get("set-cookie");
    const variant = cookie?.match(/^nx_hero=(a|b); Path=\/; Max-Age=2592000; SameSite=Lax; Secure$/)?.[1];
    assert.ok(variant, `new visitor gets a bucket cookie (${cookie})`);
    assert.equal(prerenderState(html).heroVariant, variant, "the cookie names the variant that was rendered");
    assert.equal(rootInnerHtml(html), rendered[`en:${variant}`]);
    seen.add(variant);
  }
  assert.deepEqual([...seen].sort(), ["a", "b"], "both buckets are drawn");
});

for (const variant of ["a", "b"]) {
  test(`SSR markup equals hydrated markup for variant ${variant.toUpperCase()} (en, id)`, async () => {
    for (const pathname of ["/", "/id-id"]) {
      const locale = pathname === "/" ? "en" : "id";
      const html = await (await fetchHome(pathname, { cookie: `nx_hero=${variant}`, force: "on" })).text();
      const state = prerenderState(html);
      assert.equal(state.heroVariant, variant);
      // Both render-time metadata fields vary between independent SSR calls; hydration reuses the HTML clock.
      const stable = (markup) => String(markup).replace(/tg_expires=\d+/g, "tg_expires=T").replace(/data-rendered-at="[^"]+"/g, 'data-rendered-at="T"');
      assert.equal(stable(await harness.render(`https://nexualpha.com${pathname}`, { heroVariant: state.heroVariant })), stable(rootInnerHtml(html)), "client props render the same markup");
      const { errors, inspected } = await hydrateInJsdom(harness.vite, html, `https://nexualpha.com${pathname}`, {
        inspect: (window) => ({ h1: window.document.querySelector(".h7-hero h1")?.textContent, sub: window.document.querySelector(".h7-sub")?.textContent, marker: window.document.querySelector(".h7-hero")?.getAttribute("data-hero-variant") }),
      });
      assert.deepEqual(hydrationErrors(errors), [], errors.join("\n"));
      const copy = variant === "b" ? HOME_HERO_B[locale] : H7_COPY[locale];
      assert.equal(inspected.sub, undefined, `${locale}: the design removes the hero subtitle in every variant`);
      assert.ok(inspected.h1.startsWith(copy.h1a), `${locale}: hydrated headline is variant ${variant}`);
      assert.equal(inspected.marker, variant === "b" ? "b" : null);
    }
  });
}

// ---- click attribution ----
async function clickFixture() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "hero-clicks-"));
  const clientRoot = path.join(dir, "client");
  await mkdir(path.join(clientRoot, "intel"), { recursive: true });
  await writeFile(path.join(clientRoot, "intel", "partners.json"), JSON.stringify({ partners: [{ slug: "okx", registrationUrl: "https://www.okx.com/join/TEST" }] }));
  return { dir, clientRoot, eventFile: path.join(dir, "clicks.jsonl") };
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 30));
const readRows = async (file) => (await readFile(file, "utf8").catch(() => "")).split("\n").filter(Boolean).map((line) => JSON.parse(line));

test("/go/<partner> and the site beacon record experiment + variant while it runs, nothing extra when off", async () => {
  const { dir, clientRoot, eventFile } = await clickFixture();
  try {
    const goOff = createGoRedirect({ clientRoot, eventFile, registry: disabledRegistry });
    const goOn = createGoRedirect({ clientRoot, eventFile, registry: enabledRegistry });
    const beaconOn = createCtaClickBeacon({ clientRoot, eventFile, registry: enabledRegistry });
    const beaconForced = createCtaClickBeacon({ clientRoot, eventFile, heroForce: "on" });
    const go = (handler, cookie, ua = HUMAN_UA) => handler(new Request("https://nexualpha.com/go/okx?src=tg-channel-zh", { headers: { "user-agent": ua, ...(cookie ? { cookie } : {}) } }));
    const beacon = (handler, cookie) => handler(new Request("https://nexualpha.com/api/cta-click", {
      method: "POST", headers: { "content-type": "application/json", "user-agent": HUMAN_UA, ...(cookie ? { cookie } : {}) },
      body: JSON.stringify({ partner: "okx", src: "home-v7-hero", path: "/" }),
    }), "k");
    assert.equal((await go(goOff, "nx_hero=b")).status, 302);
    assert.equal((await go(goOn, "nx_hero=b")).status, 302);
    assert.equal((await go(goOn, "")).status, 302);
    assert.equal((await go(goOn, "nx_hero=b", BOT_UAS[0])).status, 302);
    assert.equal((await beacon(beaconOn, "nx_hero=a")).status, 204);
    assert.equal((await beacon(beaconForced, "other=1; nx_hero=b")).status, 204);
    let rows = [];
    for (let i = 0; i < 100 && rows.length < 5; i++) { await settle(); rows = await readRows(eventFile); }
    await settle();
    rows = await readRows(eventFile);
    assert.equal(rows.length, 5, "the crawler click is not recorded");
    // Appends are fire-and-forget (the redirect never waits on disk), so the file order is not the request order.
    const key = (tuple) => tuple.map(String).join("|");
    assert.deepEqual(rows.map((row) => [row.kind || "go", row.experiment || null, row.variant || null]).sort((x, y) => key(x).localeCompare(key(y))), [
      ["go", null, null],
      ["go", HOME_HERO_EXPERIMENT_ID, "b"],
      ["go", null, null],
      ["site", HOME_HERO_EXPERIMENT_ID, "a"],
      ["site", HOME_HERO_EXPERIMENT_ID, "b"],
    ].sort((x, y) => key(x).localeCompare(key(y))));
    for (const row of rows) assert.ok(!JSON.stringify(row).includes("nx_hero"), "the cookie itself is never written");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("v2 analytics events on home routes carry the variant (collector-valid) and growth-report splits by it", () => {
  const saved = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", { value: { cookie: "a=1; nx_hero=b" }, configurable: true, writable: true });
  try {
    assert.deepEqual(getExperimentContext("", { pathname: "/zh-hans", market: "unknown", registry: enabledRegistry }), { experiment: HOME_HERO_EXPERIMENT_ID, variant: "b" });
    assert.deepEqual(getExperimentContext("", { pathname: "/exchanges", market: "unknown", registry: enabledRegistry }), {}, "only the home routes");
    assert.deepEqual(getExperimentContext("", { pathname: "/", market: "unknown", registry: disabledRegistry }), {}, "flag off: no context");
  } finally {
    if (saved) Object.defineProperty(globalThis, "document", saved); else delete globalThis.document;
  }
  const base = { version: 2, page: "/", locale: "en", source: "direct", market: "unknown", product: "unknown", device: "mobile", experiment: HOME_HERO_EXPERIMENT_ID };
  const rows = [
    { ...base, type: "page_view", eventId: "1", session: "s1", variant: "a" },
    { ...base, type: "page_view", eventId: "2", session: "s2", variant: "b" },
    { ...base, type: "referral_click", eventId: "3", session: "s2", variant: "b", platform: "okx", placement: "home-v7-hero" },
  ];
  const report = summarize(rows);
  const split = Object.fromEntries(report.byExperiment.filter((row) => row.experiment === HOME_HERO_EXPERIMENT_ID).map((row) => [row.variant, row.referralClicks]));
  assert.deepEqual(split, { a: 0, b: 1 });
});

test("HeadlessChrome and Chrome serve byte-identical home HTML for the same experiment context", async () => {
  const headless = HUMAN_UA.replace("Chrome/", "HeadlessChrome/");
  for (const pathname of ["/", "/id-id"]) for (const variant of ["a", "b"]) {
    for (const options of [{ cookie: `nx_hero=${variant}`, force: "on" }, { force: variant }]) {
      const human = await fetchHome(pathname, { ua: HUMAN_UA, ...options });
      const automated = await fetchHome(pathname, { ua: headless, ...options });
      assert.equal(await automated.text(), await human.text(), `${pathname} ${JSON.stringify(options)}`);
      assert.equal(automated.headers.get("x-nexualpha-hero-variant"), variant);
    }
  }
  assert.equal(homeHeroClickContext({ userAgent: headless, cookieHeader: "nx_hero=b", force: "on" }), null, "browser audit visits remain excluded from analytics");
});
