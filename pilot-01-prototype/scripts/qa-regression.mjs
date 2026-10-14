#!/usr/bin/env node
// Real-device regression gate (release engineering, 2026-10-14).
//
//   node scripts/qa-regression.mjs --base https://nexualpha.com [--out DIR] [--only home,exchanges,venues,rates,news,go]
//                                  [--chrome PATH] [--parallel N] [--quiet]
//
// Drives the real Chrome at /Applications/Google Chrome.app through puppeteer-core (shared install in
// ~/.codex/shared-tools/web-quality) with real iPhone Safari / Android Chrome / Mac Chrome user agents at 344/390/768/1440
// and checks every user-visible promise listed in scripts/qa-regression-manifest.mjs against the data modules the site
// renders from. Writes <out>/qa-regression.json, <out>/qa-regression.md and one full-page screenshot per page load.
// Exit 0 = all checks passed, 1 = at least one failed, 2 = the runner itself could not complete.
//
// deploy-local.sh runs this twice: against the staged build's local preview before cutover (abort on failure) and
// against production after cutover (automatic rollback on failure). scripts/qa-prod-hourly.sh runs it every hour.

import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { QA_MANIFEST, deviceForWidth } from "./qa-regression-manifest.mjs";
import { HOME_REBATE_SHARE } from "../src/data/home-rebate-tiers.js";
import { feeFact } from "../src/data/exchange-facts.js";
import { partnerRebateShare } from "../src/data/partner-benefit-status.js";
import { HERO_VOLUME_STEPS, HERO_VOLUME_DEFAULT_STEP, heroMoneyParts, heroRebateAmount, heroVolumeText } from "../src/components/v7/home7-hero-volume.js";
import { formatPercent } from "../src/data/format-percent.js";
import { partnerRegistry } from "../src/data/partner-registry.js";
import { BACKUP_SIGNUP_URLS } from "../src/data/backup-signup.js";
import { publicCtaForVenue } from "../src/data/source-bound-cta.js";

const sharedRequire = createRequire("/Users/bestberlin/.codex/shared-tools/web-quality/package.json");
const puppeteer = sharedRequire("puppeteer-core");

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const M = QA_MANIFEST;

// ---------------------------------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------------------------------
function parseArgs(argv) {
  const args = { base: "", out: "", only: null, chrome: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", parallel: 1, quiet: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--base") args.base = next();
    else if (a.startsWith("--base=")) args.base = a.slice(7);
    else if (a === "--out") args.out = next();
    else if (a.startsWith("--out=")) args.out = a.slice(6);
    else if (a === "--only") args.only = next().split(",").map((s) => s.trim()).filter(Boolean);
    else if (a.startsWith("--only=")) args.only = a.slice(7).split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--chrome") args.chrome = next();
    else if (a === "--parallel") args.parallel = Math.max(1, Number.parseInt(next(), 10) || 1);
    else if (a === "--quiet") args.quiet = true;
    else if (a === "--help" || a === "-h") { args.help = true; }
    else throw new Error(`unknown argument ${a}`);
  }
  return args;
}

function usage() {
  return [
    "usage: node scripts/qa-regression.mjs --base <url> [--out <dir>] [--only home,exchanges,venues,rates,news,go] [--chrome <path>] [--parallel N] [--quiet]",
    "  --base      site origin to test, e.g. https://nexualpha.com or http://127.0.0.1:4173 (required)",
    "  --out       report directory (default .qa-regression/<timestamp>); JSON, markdown and screenshots land there",
    "  --only      run a subset of suites",
    "  --parallel  page loads in flight (default 1; idle-JS and CLS budgets are CPU sensitive, keep 1 for gating)",
  ].join("\n");
}

// ---------------------------------------------------------------------------------------------------------------------
// Expected values, read from the site's own data modules
// ---------------------------------------------------------------------------------------------------------------------
const placeholderCode = new RegExp(M.go.placeholderCodePattern);
const registryPartners = Object.entries(partnerRegistry)
  .filter(([, p]) => p?.hasReferral && p.inviteCode && !placeholderCode.test(String(p.inviteCode)) && /^https:\/\//i.test(p.registrationUrl || ""))
  .map(([slug]) => slug);
const allRegistryCodes = [...new Set(Object.values(partnerRegistry).flatMap((p) => [p.inviteCode, ...(p.inviteCodes || [])]).filter(Boolean).map(String))];
const codeTokens = allRegistryCodes.filter((c) => !placeholderCode.test(c));

function acceptedCodes(slug) {
  const p = partnerRegistry[slug];
  if (!p) return [];
  return [p.inviteCode, ...(p.inviteCodes || [])].filter(Boolean).map((c) => String(c).toLowerCase());
}

function registryUrls(slug) {
  const p = partnerRegistry[slug];
  if (!p) return [];
  return [p.registrationUrl, ...(p.alternateRegistrationUrls || [])].filter(Boolean);
}

/** Registry code for a venue row ("" = no code expected, null = unknown venue). Source-bound venues fall back to public-cta. */
function expectedRowCode(slug) {
  const p = partnerRegistry[slug];
  if (p) return p.hasReferral && p.inviteCode && !placeholderCode.test(String(p.inviteCode)) ? String(p.inviteCode) : "";
  try { const cta = publicCtaForVenue(slug, "zh-Hans"); if (cta && typeof cta.hasReferral === "boolean") return cta.hasReferral && cta.inviteCode ? String(cta.inviteCode) : ""; } catch { /* unknown */ }
  return null;
}

function hostOf(href) {
  try { return new URL(href).hostname.toLowerCase(); } catch { return ""; }
}

function allowedGoHosts(slug) {
  const p = partnerRegistry[slug];
  const hosts = new Set();
  if (p?.officialDomain) hosts.add(String(p.officialDomain).toLowerCase());
  for (const u of registryUrls(slug)) hosts.add(hostOf(u));
  if (BACKUP_SIGNUP_URLS[slug]) hosts.add(hostOf(BACKUP_SIGNUP_URLS[slug]));
  hosts.delete("");
  return hosts;
}

// ---------------------------------------------------------------------------------------------------------------------
// Result collection
// ---------------------------------------------------------------------------------------------------------------------
const results = [];
const warnings = [];
let log = (line) => process.stderr.write(`${line}\n`);

function record(suite, page, device, check, ok, detail = "", extra = {}) {
  const r = { suite, page, device, check, ok: Boolean(ok), detail: String(detail ?? ""), ...extra };
  results.push(r);
  log(`${ok ? "PASS" : "FAIL"} [${suite}] ${page} @${device} ${check}${detail ? ` - ${detail}` : ""}`);
  return r;
}

function warn(suite, page, device, detail) {
  warnings.push({ suite, page, device, detail });
  log(`WARN [${suite}] ${page} @${device} ${detail}`);
}

// ---------------------------------------------------------------------------------------------------------------------
// Browser helpers
// ---------------------------------------------------------------------------------------------------------------------
const CLS_BOOTSTRAP = `(() => {
  // Chrome's session-window CLS: shifts < 1 s apart within a 5 s window, largest window wins. Mirrors scripts/mobile-lab.mjs.
  const s = { windows: [], cur: { value: 0, first: 0, last: 0 }, max: 0 };
  window.__nxCls = () => Math.max(s.max, s.cur.value);
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        if (s.cur.value && (e.startTime - s.cur.last > 1000 || e.startTime - s.cur.first > 5000)) {
          s.max = Math.max(s.max, s.cur.value); s.cur = { value: 0, first: e.startTime, last: e.startTime };
        }
        if (!s.cur.value) s.cur.first = e.startTime;
        s.cur.value += e.value; s.cur.last = e.startTime;
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch {}
})();`;

const ANALYTICS_BEACONS = new Set(["/api/analytics/cta", "/api/cta-click"]);
const HYDRATION_RE = /hydrat|Minified React error #(418|423|424|425)|did not match|Text content does not match|server-rendered HTML/i;

async function openPage(browser, device, url, { settleMs = 1500 } = {}) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const console_ = { errors: [], warnings: [], hydration: [], pageErrors: [], failedRequests: [] };
  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") { console_.errors.push(text); if (HYDRATION_RE.test(text)) console_.hydration.push(text); }
    else if (msg.type() === "warning") { console_.warnings.push(text); if (HYDRATION_RE.test(text)) console_.hydration.push(text); }
  });
  page.on("pageerror", (err) => { const text = String(err?.message || err); console_.pageErrors.push(text); if (HYDRATION_RE.test(text)) console_.hydration.push(text); });
  page.on("requestfailed", (req) => console_.failedRequests.push(`${req.failure()?.errorText || "failed"} ${req.url()}`));
  // Never count QA as traffic: Umami (/insights/*, data-domains=nexualpha.com) gets an empty script and the click
  // beacons get 204, so the gate writes no analytics rows in production and needs no nginx-only path locally.
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (req.isInterceptResolutionHandled()) return;
    let pathname = "";
    try { pathname = new URL(req.url()).pathname; } catch { /* data: etc. */ }
    if (pathname.startsWith("/insights/")) return req.respond({ status: 200, contentType: "application/javascript", body: "" });
    if (ANALYTICS_BEACONS.has(pathname)) return req.respond({ status: 204, body: "" });
    return req.continue();
  });
  await page.setUserAgent(device.ua);
  await page.setViewport({ width: device.width, height: device.height, deviceScaleFactor: device.dpr, isMobile: device.mobile, hasTouch: device.touch });
  await page.evaluateOnNewDocument(CLS_BOOTSTRAP);
  const t0 = Date.now();
  const response = await page.goto(url, { waitUntil: "load", timeout: M.budgets.navigationTimeoutMs });
  const loadMs = Date.now() - t0;
  if (settleMs) await sleep(settleMs);
  return { page, context, console: console_, response, loadMs, close: () => context.close().catch(() => {}) };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForSections(page, sections, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  const missing = new Set(sections.map((s) => s.id));
  const bySel = Object.fromEntries(sections.map((s) => [s.id, s.selector]));
  while (missing.size && Date.now() < deadline) {
    const present = await page.evaluate((entries) => entries.filter(([, sel]) => document.querySelector(sel)).map(([id]) => id), Object.entries(bySel).filter(([id]) => missing.has(id)));
    for (const id of present) missing.delete(id);
    if (missing.size) await sleep(150);
  }
  return [...missing].map((id) => `${id} (${bySel[id]})`);
}

// Idle main-thread cost. The gate is JS time (ScriptDuration) per 5 s; it is sampled over 10 s and normalised so a
// periodic poll that fires once in the window is charged at its real rate. Total task time (style, layout, paint
// commits of CSS animations) is reported alongside and only warns.
async function measureIdle(page, windowMs = 10000) {
  const a = await page.metrics();
  await sleep(windowMs);
  const b = await page.metrics();
  const per5s = (key) => round((((b[key] ?? 0) - (a[key] ?? 0)) * 1000) / (windowMs / 5000));
  return { windowMs, scriptMsPer5s: per5s("ScriptDuration"), taskMsPer5s: per5s("TaskDuration"), layoutMsPer5s: per5s("LayoutDuration") };
}

const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

// Hydration settle before an idle sample: network idle (500 ms quiet, capped at 10 s), then one idle callback and two
// animation frames inside the page, so the deferred below-fold island has finished hydrating before we measure.
async function settleAfterHydration(page) {
  await page.waitForNetworkIdle({ idleTime: 500, timeout: 10000 }).catch(() => {});
  await page.evaluate(() => new Promise((resolve) => {
    const frames = () => requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    if (typeof requestIdleCallback === "function") requestIdleCallback(frames, { timeout: 3000 }); else setTimeout(frames, 200);
  })).catch(() => {});
}

async function readCls(page) {
  return page.evaluate(() => (typeof window.__nxCls === "function" ? window.__nxCls() : -1));
}

async function overflow(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const sw = document.documentElement.scrollWidth;
    const offenders = [];
    if (sw > vw + 1) {
      for (const el of document.body.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.width && r.right > vw + 1 && getComputedStyle(el).position !== "fixed") {
          offenders.push(`${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${el.className && typeof el.className === "string" ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}` : ""} right=${Math.round(r.right)}`);
          if (offenders.length >= 5) break;
        }
      }
    }
    return { viewport: vw, scrollWidth: sw, offenders };
  });
}

async function bodyText(page, excludeSelector) {
  return page.evaluate((exclude) => {
    const clone = document.body.cloneNode(true);
    for (const el of clone.querySelectorAll("script, style, noscript, template")) el.remove();
    if (exclude) for (const el of clone.querySelectorAll(exclude)) el.remove();
    clone.style.position = "absolute"; clone.style.left = "-100000px"; clone.style.top = "0";
    document.documentElement.appendChild(clone);
    const text = clone.innerText;
    clone.remove();
    return text;
  }, excludeSelector);
}

async function screenshot(page, outDir, name) {
  const file = path.join(outDir, "screens", `${name.replace(/[^a-z0-9._-]+/gi, "_")}.png`);
  try { await page.screenshot({ path: file, fullPage: true }); return path.relative(outDir, file); } catch (error) { return `screenshot failed: ${error.message}`; }
}

function consoleChecks(suite, pageId, deviceId, c) {
  const errs = [...c.errors, ...c.pageErrors];
  record(suite, pageId, deviceId, "console-errors", errs.length <= M.budgets.consoleErrors, errs.length ? `${errs.length}: ${errs.slice(0, 3).map((e) => trim(e, 240)).join(" | ")}` : "0", { errors: errs });
  record(suite, pageId, deviceId, "hydration-errors", c.hydration.length <= M.budgets.hydrationErrors, c.hydration.length ? c.hydration.slice(0, 2).map((e) => trim(e, 240)).join(" | ") : "0");
  if (c.failedRequests.length) warn(suite, pageId, deviceId, `${c.failedRequests.length} failed request(s): ${c.failedRequests.slice(0, 3).join(" | ")}`);
}

const trim = (s, n = 160) => (String(s).length > n ? `${String(s).slice(0, n)}…` : String(s));

// ---------------------------------------------------------------------------------------------------------------------
// Suite: home
// ---------------------------------------------------------------------------------------------------------------------
async function homeSuite(browser, base, outDir) {
  const H = M.home;
  const jobs = [];
  for (const loc of H.locales) for (const width of H.widths) jobs.push({ loc, device: deviceForWidth(width) });
  await runJobs(jobs, async ({ loc, device }) => {
    const pageId = `home:${loc.code}`;
    const url = new URL(loc.path, base).href;
    let opened;
    try {
      opened = await openPage(browser, device, url);
    } catch (error) {
      record("home", pageId, device.id, "load", false, error.message);
      return;
    }
    const { page, close } = opened;
    try {
      record("home", pageId, device.id, "load", opened.response?.ok(), `HTTP ${opened.response?.status()} in ${opened.loadMs} ms`);

      // 1. Sections present within 5 s.
      const expected = [...H.sections, ...(loc.mode === "full" ? H.fullSections : []), ...(H.localeSections[loc.code] || [])];
      const missing = await waitForSections(page, expected, M.budgets.sectionTimeoutMs);
      record("home", pageId, device.id, "sections", missing.length === 0, missing.length ? `missing ${missing.join(", ")}` : `${expected.length}/${expected.length} within ${M.budgets.sectionTimeoutMs} ms`);

      // 2. Idle main-thread budget and CLS (no interaction yet).
      // Sample only once hydration has settled (network idle + an idle callback + two frames); a single over-budget
      // window is re-measured once after 5 s, so a late-hydration spike does not fail the gate but a real regression
      // (over budget twice) still does (lead 2026-10-15).
      await settleAfterHydration(page);
      let idle = await measureIdle(page);
      let idleNote = "";
      if (idle.scriptMsPer5s >= M.budgets.idleJsMsPer5s) {
        const first = idle;
        await sleep(5000);
        idle = await measureIdle(page);
        idleNote = `; first window ${first.scriptMsPer5s} ms, re-measured after 5 s`;
        if (idle.scriptMsPer5s < M.budgets.idleJsMsPer5s) warn("home", pageId, device.id, `idle JS spike ${first.scriptMsPer5s} ms / 5 s did not repeat (${idle.scriptMsPer5s} ms on re-measure)`);
      }
      record("home", pageId, device.id, "idle-js", idle.scriptMsPer5s < M.budgets.idleJsMsPer5s, `${idle.scriptMsPer5s} ms JS / 5 s (all tasks ${idle.taskMsPer5s}, layout ${idle.layoutMsPer5s}; sampled ${idle.windowMs / 1000} s${idleNote})`, { idle });
      if (idle.taskMsPer5s > M.budgets.idleJsMsPer5s * 3) warn("home", pageId, device.id, `idle main thread busy ${idle.taskMsPer5s} ms / 5 s although JS is ${idle.scriptMsPer5s} ms (style/layout/paint work while idle)`);
      const cls = await readCls(page);
      record("home", pageId, device.id, "cls", cls >= 0 && cls < M.budgets.cls, `CLS ${round(cls, 4)}`, { cls });

      // 3. Horizontal overflow.
      const ov = await overflow(page);
      record("home", pageId, device.id, "no-horizontal-overflow", ov.scrollWidth <= ov.viewport + 1, ov.offenders.length ? `scrollWidth ${ov.scrollWidth} > ${ov.viewport}: ${ov.offenders.join("; ")}` : `scrollWidth ${ov.scrollWidth} <= ${ov.viewport}`);

      // 4. Fine print (body, footer excluded) - footer hits are warnings.
      const text = await bodyText(page, H.finePrintExcludeSelector);
      const lower = text.toLowerCase();
      const hits = H.finePrint.filter((s) => lower.includes(s.toLowerCase()));
      record("home", pageId, device.id, "no-fine-print", hits.length === 0, hits.length ? `found: ${hits.join(" / ")}` : `0 of ${H.finePrint.length} strings`);
      const footerText = (await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((el) => el.innerText).join("\n"), H.finePrintExcludeSelector)).toLowerCase();
      const footerHits = H.finePrint.filter((s) => footerText.includes(s.toLowerCase()));
      if (footerHits.length) warn("home", pageId, device.id, `footer disclosure present (allowed): ${footerHits.join(" / ")}`);

      // 5. Hero v3 (owner 2026-10-14): the headline is the live sentence for the default volume ("交易 1000万U，…").
      const heroVolume = HERO_VOLUME_STEPS[HERO_VOLUME_DEFAULT_STEP];
      const h1 = await page.$eval(H.selectors.headline, (el) => el.textContent).catch(() => "");
      if (loc.mode === "full") record("home", pageId, device.id, "headline-volume-sentence", h1.includes(heroVolumeText(heroVolume, loc.code)), `h1 "${trim(h1, 80)}" expects ${heroVolumeText(heroVolume, loc.code)}`);

      if (loc.mode === "full") {
        // 6. Rebate figure + code for every selectable venue (click each tab).
        // SSR vs hydrated desk tabs: the server HTML and the hydrated DOM must agree on what is selectable.
        const ssrTabCount = await fetch(url, { headers: { "user-agent": device.ua, accept: "text/html" }, signal: AbortSignal.timeout(15000) }).then((r) => r.text()).then((html) => (html.match(/class="hx-tab"/g) || []).length).catch(() => -1);
        const tabInfo = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((el) => ({ tag: el.tagName, text: el.textContent.trim(), href: el.getAttribute("href") })), H.selectors.tabs);
        const anchorTabs = tabInfo.filter((t) => t.tag === "A");
        record("home", pageId, device.id, "desk-tabs-ssr-match", ssrTabCount === tabInfo.length, `SSR ${ssrTabCount} tab(s), hydrated ${tabInfo.length} (${tabInfo.map((t) => `${t.text}${t.tag === "A" ? `->${t.href}` : ""}`).join(", ")})`);
        if (anchorTabs.length) warn("home", pageId, device.id, `${anchorTabs.length} desk tab(s) are links, not venue picks: ${anchorTabs.map((t) => `${t.text}->${t.href}`).join(", ")}`);
        const tabs = await page.$$(`${H.selectors.tabs}:not(a)`);
        const seen = [];
        const pageUrl = page.url();
        for (let i = 0; i < tabs.length; i += 1) {
          const tab = tabs[i];
          const before = await page.$eval(H.selectors.desk, (el) => el.getAttribute("data-pick")).catch(() => null);
          if (i > 0 || tabs.length === 1) await tab.click().catch(() => {});
          if (i > 0) await page.waitForFunction((sel, prev) => document.querySelector(sel)?.getAttribute("data-pick") !== prev, { timeout: 2000 }, H.selectors.desk, before).catch(() => {});
          await sleep(150);
          if (page.url() !== pageUrl) { record("home", pageId, device.id, "desk-tab-click", false, `tab ${i + 1} navigated to ${page.url()}`); break; }
          const state = await page.evaluate((S) => ({
            pick: document.querySelector(S.desk)?.getAttribute("data-pick") || null,
            digits: document.querySelector(S.rebateDigits)?.textContent?.trim() || null,
            pct: document.querySelector(S.rebatePercentSign)?.textContent?.trim() || null,
            code: document.querySelector(S.code)?.textContent?.trim() || null,
            ctaHref: document.querySelector(S.heroCta)?.getAttribute("href") || null,
          }), H.selectors);
          const slug = state.pick;
          seen.push(slug);
          // Figure = default volume × perpetual taker fee × partner share, from the same sources the page renders from.
          const fee = feeFact(slug, "perp");
          const amount = fee.state === "checked" ? heroRebateAmount(heroVolume, fee.taker, partnerRebateShare(slug)) : null;
          const expected = amount == null ? null : heroMoneyParts(amount, loc.code);
          record("home", pageId, device.id, `rebate-figure:${slug}`, Boolean(expected) && state.digits === expected.num && state.pct === expected.cur, `shows ${state.pct ?? ""}${state.digits}, expected ${expected ? `${expected.cur}${expected.num}${expected.unit}` : "none"} (${heroVolumeText(heroVolume, loc.code)} × ${fee.taker}% × ${partnerRebateShare(slug)})`);
          const expectedCode = partnerRegistry[slug]?.inviteCode ? String(partnerRegistry[slug].inviteCode) : null;
          record("home", pageId, device.id, `invite-code:${slug}`, Boolean(expectedCode) && sameCode(state.code, expectedCode), `shows ${state.code}, registry ${expectedCode}`);
          if (expectedCode && state.code !== expectedCode && sameCode(state.code, expectedCode)) warn("home", pageId, device.id, `invite code case differs: page "${state.code}" vs registry "${expectedCode}"`);
          record("home", pageId, device.id, `hero-cta-via-go:${slug}`, typeof state.ctaHref === "string" && state.ctaHref.startsWith(`/go/${slug}`), `href ${state.ctaHref}`);
        }
        record("home", pageId, device.id, "desk-venues", seen.length >= 2 && seen.every(Boolean), `tabs: ${seen.join(", ")}`);

        // 7. Partner strip "up to X%" badges match the registry share per venue.
        const strip = await page.evaluate((S) => [...document.querySelectorAll(S.stripVenue)].map((a) => ({
          slug: a.querySelector(`[${S.brandSlugAttr}]`)?.getAttribute(S.brandSlugAttr) || null,
          share: a.querySelector(S.stripVenueShare)?.textContent?.trim() || null,
        })), H.selectors);
        const stripBad = strip.filter((v) => v.slug && HOME_REBATE_SHARE[v.slug] && (!v.share || !v.share.includes(formatPercent(loc.code, Math.round(HOME_REBATE_SHARE[v.slug] * 100)))))
          .concat(strip.filter((v) => v.slug && !HOME_REBATE_SHARE[v.slug] && v.share));
        record("home", pageId, device.id, "strip-shares", strip.length > 0 && stripBad.length === 0, stripBad.length ? `mismatch: ${stripBad.map((v) => `${v.slug}=${v.share}`).join(", ")}` : `${strip.length} venues, shares match registry`);

        // 8. Every visible code on the page is a registry code; every /go link targets a registry partner.
        const codesOnPage = await page.evaluate(() => [...document.querySelectorAll("code")].map((el) => el.textContent.trim()).filter(Boolean));
        const unknownCodes = codesOnPage.filter((c) => !codeTokens.some((k) => k.toLowerCase() === c.toLowerCase()) && /^[A-Za-z0-9_-]{3,24}$/.test(c));
        record("home", pageId, device.id, "codes-are-registry", unknownCodes.length === 0, unknownCodes.length ? `unknown codes: ${unknownCodes.join(", ")}` : `${codesOnPage.length} code element(s) all in registry`);
      } else {
        // Neutral (information-only) home: nothing commercial.
        const neutral = await page.evaluate(() => ({
          go: document.querySelectorAll('a[href^="/go/"]').length,
          sponsored: document.querySelectorAll('a[rel~="sponsored"]').length,
          desk: document.querySelectorAll("#h7-desk").length,
          codes: [...document.querySelectorAll("code, .hx-code")].map((el) => el.textContent.trim()),
        }));
        const codeHits = codeTokens.filter((c) => new RegExp(`(^|[^A-Za-z0-9])${escapeRe(c)}([^A-Za-z0-9]|$)`, "i").test(text));
        record("home", pageId, device.id, "neutral-no-cta", neutral.go === 0 && neutral.sponsored === 0 && neutral.desk === 0, `/go links ${neutral.go}, sponsored ${neutral.sponsored}, desk ${neutral.desk}`);
        record("home", pageId, device.id, "neutral-no-codes", neutral.codes.length === 0 && codeHits.length === 0, codeHits.length || neutral.codes.length ? `codes found: ${[...neutral.codes, ...codeHits].join(", ")}` : "0 codes");
      }

      // 9. Forbidden venues for this market (tr: Bitget).
      for (const venue of loc.forbiddenVenues || []) {
        const name = partnerRegistry[venue]?.name || venue;
        const found = await page.evaluate((v) => ({
          brand: document.querySelectorAll(`[data-brand-slug="${v}"]`).length,
          links: [...document.querySelectorAll(`a[href*="${v}"]`)].map((a) => a.getAttribute("href")).slice(0, 3),
        }), venue);
        const textHit = new RegExp(escapeRe(name), "i").test(text) || new RegExp(escapeRe(venue), "i").test(text);
        record("home", pageId, device.id, `no-${venue}`, !textHit && found.brand === 0 && found.links.length === 0, textHit || found.brand || found.links.length ? `text:${textHit} brand-marks:${found.brand} links:${found.links.join(",")}` : "absent from text, brand marks and links");
      }

      // 10. Console after interaction too.
      consoleChecks("home", pageId, device.id, opened.console);
      const shot = await screenshot(page, outDir, `home-${loc.code}-${device.id}`);
      results.push({ suite: "home", page: pageId, device: device.id, check: "screenshot", ok: true, detail: shot, info: true });
    } finally {
      await close();
    }
  });
}

const sameCode = (a, b) => typeof a === "string" && typeof b === "string" && a.trim().toLowerCase() === b.trim().toLowerCase();
const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------------------------------------------------------------------------------------------------------------------
// Suite: exchanges
// ---------------------------------------------------------------------------------------------------------------------
async function exchangesSuite(browser, base, outDir) {
  const E = M.exchanges;
  const jobs = E.widths.map((w) => ({ device: deviceForWidth(w) }));
  await runJobs(jobs, async ({ device }) => {
    const pageId = "exchanges";
    let opened;
    try { opened = await openPage(browser, device, new URL(E.path, base).href); } catch (error) { record("exchanges", pageId, device.id, "load", false, error.message); return; }
    const { page, close } = opened;
    try {
      record("exchanges", pageId, device.id, "load", opened.response?.ok(), `HTTP ${opened.response?.status()} in ${opened.loadMs} ms`);
      await page.waitForSelector(E.rowSelector, { timeout: M.budgets.sectionTimeoutMs }).catch(() => {});
      const rows = await page.evaluate((E) => [...document.querySelectorAll(E.rowSelector)].map((td) => {
        const btn = td.querySelector(E.rowCodeTextSelector);
        const r = btn?.getBoundingClientRect();
        return { slug: td.getAttribute(E.rowSlugAttr), attrCode: td.getAttribute(E.rowCodeAttr) || "", text: btn?.textContent?.trim() || "", visible: Boolean(r && r.width > 0 && r.height > 0) };
      }), E);
      const bad = [];
      let withCode = 0;
      const caseDiff = [];
      for (const row of rows) {
        const expected = expectedRowCode(row.slug);
        if (expected === null) { bad.push(`${row.slug}: not in registry or source-bound CTA`); continue; }
        if (expected) withCode += 1;
        if (!sameCode(row.attrCode, expected) && !(expected === "" && row.attrCode === "")) bad.push(`${row.slug}: attr "${row.attrCode}" != registry "${expected}"`);
        else if (expected && row.attrCode !== expected) caseDiff.push(`${row.slug} "${row.attrCode}" vs "${expected}"`);
        else if (expected && !row.text.toLowerCase().includes(expected.toLowerCase())) bad.push(`${row.slug}: visible text "${row.text}" lacks ${expected}`);
        else if (expected && !row.visible) bad.push(`${row.slug}: code button not visible`);
      }
      record("exchanges", pageId, device.id, "row-codes", rows.length > 0 && bad.length === 0 && withCode >= E.minRowsWithCode, bad.length ? bad.join("; ") : `${rows.length} rows, ${withCode} with codes, all match registry`);
      if (caseDiff.length) warn("exchanges", pageId, device.id, `invite code case differs from registry: ${caseDiff.join(", ")}`);
      const ov = await overflow(page);
      if (ov.scrollWidth > ov.viewport + 1) warn("exchanges", pageId, device.id, `page scrollWidth ${ov.scrollWidth} > ${ov.viewport} (${ov.offenders.slice(0, 2).join("; ")})`);
      consoleChecks("exchanges", pageId, device.id, opened.console);
      results.push({ suite: "exchanges", page: pageId, device: device.id, check: "screenshot", ok: true, detail: await screenshot(page, outDir, `exchanges-${device.id}`), info: true });
    } finally { await close(); }
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// Suite: venue pages (/exchanges/bitget, /exchanges/okx)
// ---------------------------------------------------------------------------------------------------------------------
async function venuesSuite(browser, base, outDir) {
  const V = M.venuePages;
  const device = deviceForWidth(V.width);
  const direct = new RegExp(V.directSignupPattern, "i");
  await runJobs(V.slugs.map((slug) => ({ slug })), async ({ slug }) => {
    const pageId = `venue:${slug}`;
    const url = new URL(V.pathFor.replace("{slug}", slug), base).href;
    let opened;
    try { opened = await openPage(browser, device, url); } catch (error) { record("venues", pageId, device.id, "load", false, error.message); return; }
    const { page, close } = opened;
    try {
      record("venues", pageId, device.id, "load", opened.response?.ok(), `HTTP ${opened.response?.status()} in ${opened.loadMs} ms`);
      const data = await page.evaluate((V, slug) => {
        const anchors = [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
        return {
          go: anchors.filter((h) => h.startsWith(`/go/${slug}`)),
          primary: [...document.querySelectorAll(V.primaryCtaSelector)].map((a) => a.getAttribute("href")),
          codes: V.codeSelectors.flatMap((sel) => [...document.querySelectorAll(sel)].map((el) => ({ sel, text: el.textContent.trim() }))),
          anchors,
        };
      }, V, slug);
      const hosts = allowedGoHosts(slug);
      const bypass = data.anchors.filter((h) => /^https?:/i.test(h) && hosts.has(hostOf(h)) && direct.test(h));
      record("venues", pageId, device.id, "cta-via-go", data.go.length > 0 && bypass.length === 0, bypass.length ? `direct sign-up links bypass /go: ${bypass.slice(0, 3).join(", ")}` : `${data.go.length} /go/${slug} link(s), 0 direct sign-up links`);
      record("venues", pageId, device.id, "primary-cta-via-go", data.primary.length > 0 && data.primary.some((h) => h.startsWith(`/go/${slug}`)), `registration card hrefs: ${data.primary.join(", ") || "none"}`);
      const expected = String(partnerRegistry[slug]?.inviteCode || "");
      const wrong = data.codes.filter((c) => !sameCode(c.text, expected));
      record("venues", pageId, device.id, "code-matches-registry", expected && data.codes.length > 0 && wrong.length === 0, wrong.length ? `mismatch: ${wrong.map((c) => `${c.sel}="${c.text}"`).join("; ")} (registry ${expected})` : `${data.codes.length} code element(s) = ${expected}`);
      const ov = await overflow(page);
      record("venues", pageId, device.id, "no-horizontal-overflow", ov.scrollWidth <= ov.viewport + 1, ov.offenders.length ? `scrollWidth ${ov.scrollWidth} > ${ov.viewport}: ${ov.offenders.join("; ")}` : `scrollWidth ${ov.scrollWidth} <= ${ov.viewport}`);
      consoleChecks("venues", pageId, device.id, opened.console);
      results.push({ suite: "venues", page: pageId, device: device.id, check: "screenshot", ok: true, detail: await screenshot(page, outDir, `venue-${slug}-${device.id}`), info: true });
    } finally { await close(); }
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// Suite: rates (names unbroken at 344)
// ---------------------------------------------------------------------------------------------------------------------
async function ratesSuite(browser, base, outDir) {
  const R = M.rates;
  const device = deviceForWidth(R.width);
  const pageId = "rates";
  let opened;
  try { opened = await openPage(browser, device, new URL(R.path, base).href); } catch (error) { record("rates", pageId, device.id, "load", false, error.message); return; }
  const { page, close } = opened;
  try {
    record("rates", pageId, device.id, "load", opened.response?.ok(), `HTTP ${opened.response?.status()} in ${opened.loadMs} ms`);
    await page.waitForSelector(R.nameSelector, { timeout: M.budgets.sectionTimeoutMs }).catch(() => {});
    // A name is "unbroken" when no word is split across lines (a wrap at a space, "HashKey / Global", is fine; a mid-word
    // or letter-by-letter break is not) and nothing in its cell is clipped. Each word is measured with its own Range.
    const names = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((a) => {
      const walker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
      const splitWords = [];
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        for (const match of node.data.matchAll(/\S+/g)) {
          const range = document.createRange(); range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length);
          const tops = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));
          if (tops.size > 1) splitWords.push(match[0]);
        }
      }
      const whole = document.createRange(); whole.selectNodeContents(a);
      const lines = new Set([...whole.getClientRects()].map((r) => Math.round(r.top))).size;
      const cell = a.closest("td, th") || a.parentElement;
      return { text: a.textContent.trim(), lines, splitWords, clipped: cell ? cell.scrollWidth > cell.clientWidth + 1 : false, width: Math.round(a.getBoundingClientRect().width) };
    }), R.nameSelector);
    const broken = names.filter((n) => n.splitWords.length > 0 || n.clipped || n.width === 0);
    record("rates", pageId, device.id, "names-unbroken", names.length >= R.minNames && broken.length === 0, broken.length ? `broken: ${broken.map((n) => `"${n.text}" lines=${n.lines}${n.splitWords.length ? ` split=${n.splitWords.join("|")}` : ""}${n.clipped ? " clipped" : ""}${n.width === 0 ? " zero-width" : ""}`).join("; ")}` : `${names.length} venue names, no word split across lines`);
    consoleChecks("rates", pageId, device.id, opened.console);
    results.push({ suite: "rates", page: pageId, device: device.id, check: "screenshot", ok: true, detail: await screenshot(page, outDir, `rates-${device.id}`), info: true });
  } finally { await close(); }
}

// ---------------------------------------------------------------------------------------------------------------------
// Suite: news list + one article ("www. x. com")
// ---------------------------------------------------------------------------------------------------------------------
async function newsSuite(browser, base, outDir) {
  const N = M.news;
  const device = deviceForWidth(N.width);
  const patterns = N.brokenDomainPatterns.map((p) => new RegExp(p, "i"));
  const checkText = (suite, pageId, text) => {
    const hits = [];
    for (const re of patterns) { const m = text.match(re); if (m) hits.push(`"${trim(m[0], 40)}"`); }
    record(suite, pageId, device.id, "no-broken-domains", hits.length === 0, hits.length ? `found ${hits.join(", ")}` : "no split domains in body text");
  };
  let articlePath = null;
  {
    const pageId = "news";
    let opened;
    try { opened = await openPage(browser, device, new URL(N.listPath, base).href); } catch (error) { record("news", pageId, device.id, "load", false, error.message); return; }
    const { page, close } = opened;
    try {
      record("news", pageId, device.id, "load", opened.response?.ok(), `HTTP ${opened.response?.status()} in ${opened.loadMs} ms`);
      checkText("news", pageId, await bodyText(page, null));
      // First link that is an article (one slug under /news/), not a category, tag or pagination hub.
      articlePath = await page.$$eval(N.articleLinkSelector, (as, pattern) => as.map((a) => a.getAttribute("href")).find((h) => new RegExp(pattern).test(h)) || null, N.articleHrefPattern).catch(() => null);
      record("news", pageId, device.id, "has-articles", Boolean(articlePath), articlePath ? `first article ${articlePath}` : "no article links");
      consoleChecks("news", pageId, device.id, opened.console);
      results.push({ suite: "news", page: pageId, device: device.id, check: "screenshot", ok: true, detail: await screenshot(page, outDir, `news-${device.id}`), info: true });
    } finally { await close(); }
  }
  if (!articlePath) return;
  {
    const pageId = `article:${articlePath.split("/").pop()}`;
    let opened;
    try { opened = await openPage(browser, device, new URL(articlePath, base).href); } catch (error) { record("news", pageId, device.id, "load", false, error.message); return; }
    const { page, close } = opened;
    try {
      record("news", pageId, device.id, "load", opened.response?.ok(), `HTTP ${opened.response?.status()} in ${opened.loadMs} ms`);
      const hasBody = await page.$(N.articleBodySelector);
      record("news", pageId, device.id, "article-body", Boolean(hasBody), hasBody ? `${N.articleBodySelector} present` : `${N.articleBodySelector} missing`);
      checkText("news", pageId, await bodyText(page, null));
      const ov = await overflow(page);
      record("news", pageId, device.id, "no-horizontal-overflow", ov.scrollWidth <= ov.viewport + 1, ov.offenders.length ? `scrollWidth ${ov.scrollWidth} > ${ov.viewport}: ${ov.offenders.join("; ")}` : `scrollWidth ${ov.scrollWidth} <= ${ov.viewport}`);
      consoleChecks("news", pageId, device.id, opened.console);
      results.push({ suite: "news", page: pageId, device: device.id, check: "screenshot", ok: true, detail: await screenshot(page, outDir, `article-${device.id}`), info: true });
    } finally { await close(); }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Suite: /go/<partner> redirect chains (fetch, bot UA so no click is recorded)
// ---------------------------------------------------------------------------------------------------------------------
async function goSuite(base) {
  const G = M.go;
  const baseHost = new URL(base).hostname;
  const slugs = [...registryPartners];
  if (G.includeMirrorRoutes) for (const venue of Object.keys(BACKUP_SIGNUP_URLS)) if (registryPartners.includes(venue)) slugs.push(`${venue}-alt`);
  const internalHost = (h) => h === baseHost || h === "nexualpha.com" || h === "www.nexualpha.com";
  for (const slug of slugs) {
    const venue = slug.endsWith("-alt") ? slug.slice(0, -4) : slug;
    const start = new URL(`/go/${slug}?src=${G.src}`, base).href;
    const chain = [];
    let current = start;
    let finalUrl = null;
    let error = null;
    let delegated = false;
    for (let hop = 0; hop < G.maxHops; hop += 1) {
      let res;
      try {
        res = await fetch(current, { method: "GET", redirect: "manual", headers: { "user-agent": G.userAgent, accept: "text/html" }, signal: AbortSignal.timeout(15000) });
      } catch (e) { error = `${e.message} at ${current}`; break; }
      const loc = res.headers.get("location");
      chain.push({ url: current, status: res.status, location: loc });
      if (res.status >= 300 && res.status < 400 && loc) {
        const nextUrl = new URL(loc, current).href;
        const nextHost = hostOf(nextUrl);
        if (internalHost(nextHost)) { if (nextHost !== baseHost) delegated = true; current = nextUrl; continue; }
        finalUrl = nextUrl; // first external hop: the exchange's own URL
        break;
      }
      error = `HTTP ${res.status} without external redirect`;
      break;
    }
    const detailChain = chain.map((c) => `${c.status}`).join(" -> ");
    if (!finalUrl) { record("go", `/go/${slug}`, "fetch", false, error || `no external hop after ${chain.length} hops`, { chain }); continue; }
    const host = hostOf(finalUrl);
    const hosts = allowedGoHosts(venue);
    const urls = new Set(registryUrls(venue).concat(BACKUP_SIGNUP_URLS[venue] ? [BACKUP_SIGNUP_URLS[venue]] : []).map(normalizeUrl));
    const codes = acceptedCodes(venue);
    const lowerUrl = finalUrl.toLowerCase();
    const exact = urls.has(normalizeUrl(finalUrl));
    const hasCode = codes.some((c) => lowerUrl.includes(c));
    const ok = hosts.has(host) && (exact || hasCode);
    const isMirror = BACKUP_SIGNUP_URLS[venue] && host === hostOf(BACKUP_SIGNUP_URLS[venue]);
    record("go", `/go/${slug}`, "fetch", ok, `${detailChain} -> ${finalUrl}${exact ? " (registry URL)" : hasCode ? " (carries code)" : " (NO registry code)"}${isMirror ? " [mirror]" : ""}${hosts.has(host) ? "" : ` host ${host} not official`}`, { chain, finalUrl });
    if (delegated) warn("go", `/go/${slug}`, "fetch", "local /go delegated to production nexualpha.com before reaching the exchange");
  }
}

function normalizeUrl(u) {
  try { const x = new URL(u); x.hash = ""; return x.href.replace(/\/$/, "").toLowerCase(); } catch { return String(u).toLowerCase(); }
}

// ---------------------------------------------------------------------------------------------------------------------
// Job runner (bounded concurrency)
// ---------------------------------------------------------------------------------------------------------------------
let PARALLEL = 1;
async function runJobs(jobs, fn) {
  const queue = [...jobs];
  const workers = Array.from({ length: Math.min(PARALLEL, queue.length) }, async () => {
    while (queue.length) { const job = queue.shift(); await fn(job); }
  });
  await Promise.all(workers);
}

// ---------------------------------------------------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------------------------------------------------
function markdown(summary) {
  const lines = [];
  lines.push(`# QA regression - ${summary.status}`);
  lines.push("");
  lines.push(`- base: ${summary.base}`);
  lines.push(`- build: ${summary.buildId || "unknown"}`);
  lines.push(`- ran: ${summary.startedAt} -> ${summary.finishedAt} (${Math.round(summary.durationMs / 1000)} s)`);
  lines.push(`- checks: ${summary.passed} passed, ${summary.failed} failed, ${summary.warnings} warning(s)`);
  lines.push(`- report dir: ${summary.outDir}`);
  lines.push("");
  const failed = summary.results.filter((r) => !r.ok);
  if (failed.length) {
    lines.push("## Failures");
    lines.push("");
    lines.push("| Suite | Page | Device | Check | Detail |");
    lines.push("|---|---|---|---|---|");
    for (const r of failed) lines.push(`| ${r.suite} | ${r.page} | ${r.device} | ${r.check} | ${md(r.detail)} |`);
    lines.push("");
  }
  lines.push("## Suites");
  lines.push("");
  lines.push("| Suite | Pages x devices | Checks | Failed |");
  lines.push("|---|---|---|---|");
  for (const [suite, rows] of Object.entries(groupBy(summary.results.filter((r) => !r.info), (r) => r.suite))) {
    const combos = new Set(rows.map((r) => `${r.page}@${r.device}`)).size;
    lines.push(`| ${suite} | ${combos} | ${rows.length} | ${rows.filter((r) => !r.ok).length} |`);
  }
  if (summary.warningsList.length) {
    lines.push("");
    lines.push("## Warnings (informational)");
    lines.push("");
    for (const w of summary.warningsList) lines.push(`- [${w.suite}] ${w.page} @${w.device}: ${md(w.detail)}`);
  }
  return `${lines.join("\n")}\n`;
}

const md = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
const groupBy = (arr, key) => arr.reduce((acc, x) => { (acc[key(x)] ||= []).push(x); return acc; }, {});

// ---------------------------------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(usage()); return 0; }
  if (!args.base) { console.error(usage()); return 2; }
  const base = args.base.replace(/\/+$/, "");
  new URL(base); // throws on garbage
  if (args.quiet) log = () => {};
  PARALLEL = args.parallel;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.resolve(args.out || path.join(projectRoot, ".qa-regression", stamp));
  await mkdir(path.join(outDir, "screens"), { recursive: true });
  if (!existsSync(args.chrome)) throw new Error(`Chrome not found at ${args.chrome}`);

  const startedAt = new Date();
  let buildId = null;
  try { buildId = (await (await fetch(`${base}/version.json?ts=${Date.now()}`, { signal: AbortSignal.timeout(10000) })).json()).buildId || null; } catch { /* reported as unknown */ }

  // Warm-up (2026-10-15): a freshly started server (the staged build in deploy-local.sh) fills its live feeds in the
  // background. The first home render before the funding feed's first refresh has no #h7-funding, so the first page the
  // gate visited (zh-Hans @344) failed on every deploy. Wait (max 45 s) until the feed answers with rows, like a server
  // that has been up for a minute; the section check itself is unchanged. A feed that never fills still fails the gate.
  const warmUntil = Date.now() + 45000;
  for (;;) {
    try {
      const r = await fetch(`${base}/intel/funding-rates.json?ts=${Date.now()}`, { signal: AbortSignal.timeout(10000) });
      const j = r.ok ? await r.json() : null;
      if (j && Object.values(j.venues || {}).some((v) => Array.isArray(v?.rows) && v.rows.length)) break;
    } catch { /* not ready yet */ }
    if (Date.now() > warmUntil) { log("warm-up: funding feed still empty after 45 s; running checks anyway"); break; }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  const only = args.only;
  const want = (s) => !only || only.includes(s);
  const browser = await puppeteer.launch({
    executablePath: args.chrome,
    headless: true,
    args: ["--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-features=TranslateUI", "--hide-scrollbars", "--mute-audio"],
  });
  try {
    if (want("home")) await homeSuite(browser, base, outDir);
    if (want("exchanges")) await exchangesSuite(browser, base, outDir);
    if (want("venues")) await venuesSuite(browser, base, outDir);
    if (want("rates")) await ratesSuite(browser, base, outDir);
    if (want("news")) await newsSuite(browser, base, outDir);
  } finally {
    await browser.close().catch(() => {});
  }
  if (want("go")) await goSuite(base);

  const finishedAt = new Date();
  const scored = results.filter((r) => !r.info);
  const failed = scored.filter((r) => !r.ok);
  const summary = {
    status: failed.length ? "FAIL" : "PASS",
    base,
    buildId,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt - startedAt,
    outDir,
    passed: scored.length - failed.length,
    failed: failed.length,
    warnings: warnings.length,
    manifestVersion: M.version,
    chrome: args.chrome,
    results,
    warningsList: warnings,
  };
  await writeFile(path.join(outDir, "qa-regression.json"), `${JSON.stringify(summary, null, 2)}\n`);
  const report = markdown(summary);
  await writeFile(path.join(outDir, "qa-regression.md"), report);
  process.stdout.write(report);
  return failed.length ? 1 : 0;
}

main().then((code) => { process.exitCode = code; }).catch((error) => {
  console.error(`qa-regression: runner error: ${error?.stack || error}`);
  process.exitCode = 2;
});
