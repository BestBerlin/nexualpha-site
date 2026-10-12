#!/usr/bin/env node
// Search-engine operations for nexualpha.com: Google Search Console, Bing Webmaster, Yandex Webmaster.
// Keys are read from the owner's machine (~/.codex/private/*.env); nothing secret lives in this repo.
//   node scripts/search-engines.mjs verify   # one-time: confirm ownership via the files in public/
//   node scripts/search-engines.mjs submit   # after every deploy: submit both sitemaps to all three
//   node scripts/search-engines.mjs status   # sitemap state, errors and indexing summary (--full for whole responses)
//   node scripts/search-engines.mjs inspect <url>...   # Google URL inspection: index state, crawl time, canonical
//   node scripts/search-engines.mjs perf [days]   # Google clicks / impressions: totals, top queries, top pages, by section
//   node scripts/search-engines.mjs striking [--write <dir>] [--date YYYY-MM-DD]   # pages at avg position 4–30 (90 + 28 days)
// Network: run with NODE_OPTIONS=--dns-result-order=ipv4first on the owner's Mac (IPv6 routes to Google time out).
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { groupStrikingRows, mergeStrikingWindows, strikingMarkdownTable } from "./striking-distance-lib.mjs";
import { createSign } from "node:crypto";
import { homedir } from "node:os";
import path from "node:path";

const SITE = "https://nexualpha.com/";
// news-library-sitemap.xml and locale-sitemap.xml 301 to sitemap.xml since #118; the index now lists their content.
const SITEMAPS = ["https://nexualpha.com/sitemap.xml", "https://nexualpha.com/news-sitemap.xml"];
// An empty news sitemap is reported by Google as an error ("missing <url>"); submit only sitemaps that list URLs
// or, since 2026-10-12, a sitemap index listing <sitemap> children.
async function nonEmptySitemaps() {
  const keep = [];
  for (const url of SITEMAPS) {
    try { const text = await (await fetch(url, { headers: { "cache-control": "no-cache" } })).text(); if (/<url>|<sitemap>/.test(text)) keep.push(url); else console.log(`skip    ${url} (no <url>/<sitemap> entries)`); }
    catch { keep.push(url); }
  }
  return keep;
}
const PRIVATE = process.env.NEXU_KEYS_DIR || path.join(homedir(), ".codex", "private");

function readEnv(file) {
  const p = path.join(PRIVATE, file);
  if (!existsSync(p)) return {};
  return Object.fromEntries(readFileSync(p, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
}
const out = (engine, step, status, detail = "") => console.log(`${engine.padEnd(7)} ${step.padEnd(16)} ${String(status).padEnd(5)} ${detail}`.trimEnd());
const short = (text) => (process.argv.includes("--full") ? String(text) : String(text).replace(/\s+/g, " ").slice(0, 300));

// Transient TLS / socket failures (ECONNRESET, "fetch failed", handshake errors) are retried with backoff.
const TRANSIENT = /fetch failed|ECONNRESET|ETIMEDOUT|EPIPE|ENOTFOUND|EAI_AGAIN|socket|TLS|SSL|certificate|UND_ERR/i;
async function fetchRetry(url, init, tries = 5) {
  for (let attempt = 1; ; attempt++) {
    try { return await fetch(url, init); }
    catch (error) {
      const msg = `${error.message} ${error.cause?.code || ""} ${error.cause?.message || ""}`;
      if (attempt >= tries || !TRANSIENT.test(msg)) throw error;
      console.error(`retry   ${attempt}/${tries - 1} after network error: ${msg.trim().slice(0, 120)}`);
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
}

// ---------- Google (service account) ----------
let cachedToken = null;
async function googleToken() {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.value;
  const env = readEnv("gsc-api.env");
  if (!env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error("gsc-api.env has no GOOGLE_APPLICATION_CREDENTIALS");
  const key = JSON.parse(readFileSync(env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "RS256", typ: "JWT" });
  const claim = b64({ iss: key.client_email, scope: "https://www.googleapis.com/auth/webmasters https://www.googleapis.com/auth/siteverification", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 });
  const sig = createSign("RSA-SHA256").update(`${head}.${claim}`).sign(key.private_key, "base64url");
  const res = await fetchRetry("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${head}.${claim}.${sig}` });
  const json = await res.json();
  if (!json.access_token) throw new Error(`Google auth failed: ${json.error || res.status}`);
  cachedToken = { value: json.access_token, exp: Date.now() + 3500_000 };
  return json.access_token;
}
async function google(method, url, body) {
  const res = await fetchRetry(url, { method, headers: { authorization: `Bearer ${await googleToken()}`, "content-type": "application/json" }, body: body && JSON.stringify(body) });
  return { status: res.status, text: await res.text() };
}
const gscSite = encodeURIComponent(SITE);

// ---------- Bing ----------
const BING = "https://ssl.bing.com/webmaster/api.svc/json";
async function bing(method, op, body) {
  const key = readEnv("bing-webmaster-api.env").BING_WEBMASTER_API_KEY;
  if (!key) throw new Error("bing-webmaster-api.env has no BING_WEBMASTER_API_KEY");
  const qs = method === "GET" ? `&${new URLSearchParams(body || {})}` : "";
  const res = await fetch(`${BING}/${op}?apikey=${key}${qs}`, { method, headers: { "content-type": "application/json; charset=utf-8" }, body: method === "GET" ? undefined : JSON.stringify(body) });
  return { status: res.status, text: await res.text() };
}

// ---------- Yandex ----------
const YANDEX = "https://api.webmaster.yandex.net/v4";
const YHOST = "https:nexualpha.com:443";
async function yandex(method, pathname, body) {
  const token = readEnv("yandex-webmaster.env").YANDEX_OAUTH_TOKEN;
  if (!token) throw new Error("yandex-webmaster.env has no YANDEX_OAUTH_TOKEN");
  const headers = { authorization: `OAuth ${token}`, "content-type": "application/json" };
  const user = (await (await fetch(`${YANDEX}/user`, { headers })).json()).user_id;
  const res = await fetch(`${YANDEX}/user/${user}${pathname}`, { method, headers, body: body && JSON.stringify(body) });
  return { status: res.status, text: await res.text() };
}

async function run(engine, step, fn) {
  try { const r = await fn(); out(engine, step, r.status, short(r.text)); return r; }
  catch (error) { out(engine, step, "ERR", error.message); return null; }
}

// Search data lives in the domain property (sc-domain:nexualpha.com); the URL-prefix property has none. Use the
// domain property when the service account has been added to it, else fall back.
function gscWindow(days, endOffsetDays = 2) {
  const end = new Date(Date.now() - endOffsetDays * 864e5).toISOString().slice(0, 10);
  const start = new Date(Date.now() - (days + endOffsetDays) * 864e5).toISOString().slice(0, 10);
  return { start, end };
}
async function perfProperty(start, end) {
  const domainProbe = await google("POST", `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent("sc-domain:nexualpha.com")}/searchAnalytics/query`, { startDate: start, endDate: end, dimensions: [], rowLimit: 1 });
  if (domainProbe.status === 200) return encodeURIComponent("sc-domain:nexualpha.com");
  console.log("note: no access to sc-domain:nexualpha.com (add the service account as a user there); using the URL-prefix property");
  return gscSite;
}
// All [query, page] rows for a window, paged 25 000 at a time (the API maximum per request).
async function queryPageRows(property, start, end) {
  const rows = [];
  for (let startRow = 0; ; startRow += 25000) {
    const r = await google("POST", `https://www.googleapis.com/webmasters/v3/sites/${property}/searchAnalytics/query`, { startDate: start, endDate: end, dimensions: ["query", "page"], rowLimit: 25000, startRow, dataState: "final" });
    if (r.status !== 200) throw new Error(`searchAnalytics ${r.status} ${short(r.text)}`);
    const page = JSON.parse(r.text).rows || [];
    rows.push(...page);
    if (page.length < 25000) return rows;
  }
}
function argValue(name) { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; }

const cmd = process.argv[2];
if (cmd === "verify") {
  await run("google", "verify file", () => google("POST", "https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=FILE", { site: { type: "SITE", identifier: SITE } }));
  await run("google", "add property", () => google("PUT", `https://www.googleapis.com/webmasters/v3/sites/${gscSite}`));
  await run("bing", "verify", () => bing("POST", "VerifySite", { siteUrl: SITE }));
  await run("yandex", "verify file", () => yandex("POST", `/hosts/${YHOST}/verification?verification_type=HTML_FILE`));
} else if (cmd === "submit") {
  for (const sm of await nonEmptySitemaps()) {
    await run("google", "sitemap", () => google("PUT", `https://www.googleapis.com/webmasters/v3/sites/${gscSite}/sitemaps/${encodeURIComponent(sm)}`));
    await run("bing", "sitemap", () => bing("POST", "SubmitFeed", { siteUrl: SITE, feedUrl: sm }));
    await run("yandex", "sitemap", async () => {
      const r = await yandex("POST", `/hosts/${YHOST}/user-added-sitemaps/`, { url: sm });
      return r.status === 409 && r.text.includes("SITEMAP_ALREADY_ADDED") ? { status: 200, text: "already registered; Yandex re-reads it on its own schedule" } : r;
    });
  }
} else if (cmd === "status") {
  await run("google", "sitemaps", () => google("GET", `https://www.googleapis.com/webmasters/v3/sites/${gscSite}/sitemaps`));
  await run("bing", "feeds", () => bing("GET", "GetFeeds", { siteUrl: SITE }));
  await run("bing", "crawl issues", () => bing("GET", "GetCrawlIssues", { siteUrl: SITE }));
  await run("yandex", "summary", () => yandex("GET", `/hosts/${YHOST}/summary`));
  await run("yandex", "verification", () => yandex("GET", `/hosts/${YHOST}/verification`));
} else if (cmd === "index-stats") {
  // Per-sitemap submitted / indexed counts as Google reports them (the "indexed" field can lag or read 0).
  const r = await google("GET", `https://www.googleapis.com/webmasters/v3/sites/${gscSite}/sitemaps`);
  const list = r.status === 200 ? JSON.parse(r.text).sitemap || [] : [];
  if (r.status !== 200) console.log(`google sitemaps ${r.status}`);
  for (const sm of list) {
    const web = (sm.contents || []).find((c) => c.type === "web") || {};
    console.log(`google  ${sm.path.replace(SITE, "/").padEnd(28)} submitted ${String(web.submitted ?? "-").padStart(5)}  indexed ${String(web.indexed ?? "-").padStart(5)}  downloaded ${sm.lastDownloaded || "-"}  pending ${sm.isPending}`);
  }
} else if (cmd === "inspect") {
  for (const url of process.argv.slice(3).filter((a) => !a.startsWith("--"))) {
    await run("google", "inspect", async () => {
      const r = await google("POST", "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", { inspectionUrl: url, siteUrl: SITE });
      const x = JSON.parse(r.text).inspectionResult?.indexStatusResult || {};
      return { status: r.status, text: x.verdict ? `${url} ${x.verdict} | ${x.coverageState} | fetch ${x.pageFetchState} | robots ${x.robotsTxtState} | crawled ${x.lastCrawlTime || "-"} | google canonical ${x.googleCanonical || "-"}` : r.text };
    });
  }
} else if (cmd === "perf") {
  const days = Number(process.argv[3]) || 28;
  const { start, end } = gscWindow(days);
  const perfSite = await perfProperty(start, end);
  const q = async (dimensions, rowLimit = 25, extra = {}) => {
    const r = await google("POST", `https://www.googleapis.com/webmasters/v3/sites/${perfSite}/searchAnalytics/query`, { startDate: start, endDate: end, dimensions, rowLimit, ...extra });
    if (r.status !== 200) throw new Error(`searchAnalytics ${r.status} ${short(r.text)}`);
    return JSON.parse(r.text).rows || [];
  };
  const fmt = (x) => `${String(x.clicks).padStart(5)} clicks ${String(x.impressions).padStart(7)} impr  pos ${typeof x.position === "number" ? x.position.toFixed(1).padStart(5) : "    -"}`;
  const [total] = await q([], 1);
  console.log(`Google ${start}..${end}: ${total ? fmt(total) : "no data"}`);
  console.log("\nTop queries"); for (const x of await q(["query"])) console.log(`${fmt(x)}  ${x.keys[0]}`);
  const pages = await q(["page"], 5000);
  console.log("\nTop pages"); for (const x of pages.slice(0, 20)) console.log(`${fmt(x)}  ${x.keys[0].replace(SITE, "/")}`);
  const sec = {};
  for (const x of pages) { const k = x.keys[0].replace(SITE, "/").split("/").filter(Boolean).filter((p) => !/^(zh-hans|zh-hant|ja|ko|ru|es|pt-br|tr|vi|id|de|fr|it|ar)$/.test(p))[0] || "(home)"; const a = (sec[k] ||= { pages: 0, clicks: 0, impressions: 0 }); a.pages++; a.clicks += x.clicks; a.impressions += x.impressions; }
  console.log("\nBy section (pages with impressions)"); for (const [k, a] of Object.entries(sec).sort((a, b) => b[1].impressions - a[1].impressions)) console.log(`${String(a.pages).padStart(5)} pages ${String(a.clicks).padStart(5)} clicks ${String(a.impressions).padStart(7)} impr  /${k}`);
  console.log("\nBy country"); for (const x of await q(["country"], 10)) console.log(`${fmt(x)}  ${x.keys[0]}`);
  // By locale prefix (2026-10-11): the 14 non-English prefixes vs English, so the localized lane can be judged.
  const loc = {};
  for (const x of pages) { const first = x.keys[0].replace(SITE, "/").split("/").filter(Boolean)[0] || ""; const k = /^(zh-hans|zh-hant|ja|ko|ru|es|pt-br|tr|vi|id-id|de|fr|it|ar)$/.test(first) ? first : "en"; const a = (loc[k] ||= { pages: 0, clicks: 0, impressions: 0 }); a.pages++; a.clicks += x.clicks; a.impressions += x.impressions; }
  const totalImpr = Object.values(loc).reduce((n, a) => n + a.impressions, 0) || 1;
  console.log("\nBy locale prefix"); for (const [k, a] of Object.entries(loc).sort((a, b) => b[1].impressions - a[1].impressions)) console.log(`${String(a.pages).padStart(5)} pages ${String(a.clicks).padStart(5)} clicks ${String(a.impressions).padStart(7)} impr ${String(Math.round((100 * a.impressions) / totalImpr)).padStart(3)}%  ${k}`);
  // Google Discover (news cards): separate search type; usually empty until the site has Discover traffic.
  const disc = await q([], 1, { type: "discover" }).catch(() => null);
  console.log(`\nDiscover ${start}..${end}: ${disc && disc[0] ? fmt(disc[0]) : "no data"}`);
  if (disc && disc[0]) for (const x of await q(["page"], 10, { type: "discover" })) console.log(`${fmt(x)}  ${x.keys[0].replace(SITE, "/")}`);
} else if (cmd === "striking") {
  // Striking-distance pages: average position 4–30 with ≥ 3 impressions per [query, page] row, grouped by page.
  const snapshotDate = argValue("--date") || new Date().toISOString().slice(0, 10);
  const windows = {};
  let property = null;
  for (const days of [90, 28]) {
    const { start, end } = gscWindow(days);
    property ||= await perfProperty(start, end);
    const rows = await queryPageRows(property, start, end);
    const pages = groupStrikingRows(rows, { site: SITE, topQueries: 5 });
    // Page-level supplement: Search Console hides rare/anonymized queries from [query, page] rows, so a page can sit
    // in striking distance overall while no single query row reaches 3 impressions. Listed separately, never merged.
    const pr = await google("POST", `https://www.googleapis.com/webmasters/v3/sites/${property}/searchAnalytics/query`, { startDate: start, endDate: end, dimensions: ["page"], rowLimit: 25000 });
    if (pr.status !== 200) throw new Error(`searchAnalytics ${pr.status} ${short(pr.text)}`);
    const queryLevel = new Set(pages.map((p) => p.page));
    const pageLevel = (JSON.parse(pr.text).rows || [])
      .map((x) => ({ page: x.keys[0].startsWith(SITE) ? `/${x.keys[0].slice(SITE.length)}` : x.keys[0], impressions: x.impressions, clicks: x.clicks, position: Math.round(x.position * 10) / 10 }))
      .filter((x) => x.position >= 4 && x.position <= 30 && x.impressions >= 3 && !queryLevel.has(x.page))
      .sort((a, b) => b.impressions * (31 - b.position) - a.impressions * (31 - a.position));
    // Context for intent: the visible queries behind each page-level entry, any impressions or position.
    for (const entry of pageLevel) {
      entry.visibleQueries = rows.filter((x) => x.keys[1] === `${SITE}${entry.page.slice(1)}`)
        .sort((a, b) => b.impressions - a.impressions).slice(0, 8)
        .map((x) => ({ query: x.keys[0], impressions: x.impressions, clicks: x.clicks, position: Math.round(x.position * 10) / 10 }));
    }
    windows[`d${days}`] = { days, start, end, rowsFetched: rows.length, pages, pageLevelOnly: pageLevel };
    console.log(`\nStriking distance, last ${days} days (${start}..${end}): ${pages.length} pages from ${rows.length} [query, page] rows`);
    console.log(strikingMarkdownTable(pages, { limit: 30 }));
  }
  const merged = mergeStrikingWindows(windows.d90.pages, windows.d28.pages);
  const snapshot = { generatedAt: new Date().toISOString(), snapshotDate, property: decodeURIComponent(property),
    filter: { minPosition: 4, maxPosition: 30, minImpressions: 3, dimensions: ["query", "page"], score: "impressions × (31 − impression-weighted avg position) / 27" },
    windows, ranking: merged.map((m) => ({ page: m.page, score: m.score, d90: m.d90 && { impressions: m.d90.impressions, avgPosition: m.d90.avgPosition, bestPosition: m.d90.bestPosition }, d28: m.d28 && { impressions: m.d28.impressions, avgPosition: m.d28.avgPosition, bestPosition: m.d28.bestPosition } })) };
  const dir = argValue("--write");
  if (dir) {
    mkdirSync(dir, { recursive: true });
    const base = path.join(dir, `striking-distance-${snapshotDate}`);
    writeFileSync(`${base}.json`, `${JSON.stringify(snapshot, null, 2)}\n`);
    const md = [`# Striking-distance pages — ${snapshotDate}`, "",
      `Google Search Console (${snapshot.property}), dimensions [query, page]; rows kept when average position is 4–30 and impressions ≥ 3, then grouped by page.`,
      "Score = impressions × closeness to the top 10, where closeness = (31 − impression-weighted average position) / 27. Re-measure with",
      "`NODE_OPTIONS=--dns-result-order=ipv4first node scripts/search-engines.mjs striking --write ../docs/company` and compare page by page.", "",
      `## Combined ranking (90-day score + 28-day score), top 40`, "",
      "| # | Page | Score | 90d impr | 90d avg pos | 90d best | 28d impr | 28d avg pos | 28d best |", "|---|---|---:|---:|---:|---:|---:|---:|---:|",
      ...merged.slice(0, 40).map((m, i) => `| ${i + 1} | \`${m.page}\` | ${m.score} | ${m.d90?.impressions ?? "-"} | ${m.d90?.avgPosition ?? "-"} | ${m.d90?.bestPosition ?? "-"} | ${m.d28?.impressions ?? "-"} | ${m.d28?.avgPosition ?? "-"} | ${m.d28?.bestPosition ?? "-"} |`), "",
      ...["d90", "d28"].flatMap((k) => [`## Last ${windows[k].days} days (${windows[k].start}..${windows[k].end}) — ${windows[k].pages.length} pages`, "", strikingMarkdownTable(windows[k].pages, { limit: 60 }), "",
        `### Page-level only, last ${windows[k].days} days — position 4–30 and ≥ 3 impressions for the page, but no single query row qualifies (queries hidden or spread thin)`, "",
        "| Page | Impr | Clicks | Avg pos | Visible queries (impr / pos) |", "|---|---:|---:|---:|---|", ...windows[k].pageLevelOnly.slice(0, 40).map((x) => `| \`${x.page}\` | ${x.impressions} | ${x.clicks} | ${x.position} | ${x.visibleQueries.slice(0, 4).map((q) => `${q.query.replace(/\|/g, "\\|")} (${q.impressions} / ${q.position})`).join("<br>") || "(hidden)"} |`), ""]),
    ].join("\n");
    writeFileSync(`${base}.md`, md);
    console.log(`\nwrote ${base}.json and ${base}.md`);
  }
} else {
  console.log("usage: node scripts/search-engines.mjs verify|submit|status|inspect <url>...|perf [days]|striking [--write dir] [--date YYYY-MM-DD] [--full]");
  process.exitCode = 1;
}
