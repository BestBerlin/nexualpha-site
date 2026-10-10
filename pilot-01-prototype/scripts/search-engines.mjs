#!/usr/bin/env node
// Search-engine operations for nexualpha.com: Google Search Console, Bing Webmaster, Yandex Webmaster.
// Keys are read from the owner's machine (~/.codex/private/*.env); nothing secret lives in this repo.
//   node scripts/search-engines.mjs verify   # one-time: confirm ownership via the files in public/
//   node scripts/search-engines.mjs submit   # after every deploy: submit both sitemaps to all three
//   node scripts/search-engines.mjs status   # sitemap state, errors and indexing summary (--full for whole responses)
//   node scripts/search-engines.mjs inspect <url>...   # Google URL inspection: index state, crawl time, canonical
//   node scripts/search-engines.mjs perf [days]   # Google clicks / impressions: totals, top queries, top pages, by section
import { readFileSync, existsSync } from "node:fs";
import { createSign } from "node:crypto";
import { homedir } from "node:os";
import path from "node:path";

const SITE = "https://nexualpha.com/";
const SITEMAPS = ["https://nexualpha.com/sitemap.xml", "https://nexualpha.com/news-sitemap.xml", "https://nexualpha.com/news-library-sitemap.xml", "https://nexualpha.com/locale-sitemap.xml"];
// An empty news sitemap is reported by Google as an error ("missing <url>"); submit only sitemaps that list URLs.
async function nonEmptySitemaps() {
  const keep = [];
  for (const url of SITEMAPS) {
    try { const text = await (await fetch(url, { headers: { "cache-control": "no-cache" } })).text(); if (/<url>/.test(text)) keep.push(url); else console.log(`skip    ${url} (no <url> entries)`); }
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

// ---------- Google (service account) ----------
async function googleToken() {
  const env = readEnv("gsc-api.env");
  if (!env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error("gsc-api.env has no GOOGLE_APPLICATION_CREDENTIALS");
  const key = JSON.parse(readFileSync(env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "RS256", typ: "JWT" });
  const claim = b64({ iss: key.client_email, scope: "https://www.googleapis.com/auth/webmasters https://www.googleapis.com/auth/siteverification", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 });
  const sig = createSign("RSA-SHA256").update(`${head}.${claim}`).sign(key.private_key, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${head}.${claim}.${sig}` });
  const json = await res.json();
  if (!json.access_token) throw new Error(`Google auth failed: ${json.error || res.status}`);
  return json.access_token;
}
async function google(method, url, body) {
  const res = await fetch(url, { method, headers: { authorization: `Bearer ${await googleToken()}`, "content-type": "application/json" }, body: body && JSON.stringify(body) });
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
  const end = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
  const start = new Date(Date.now() - (days + 2) * 864e5).toISOString().slice(0, 10);
  // Search data lives in the domain property (sc-domain:nexualpha.com); the URL-prefix property has none. Use the
  // domain property when the service account has been added to it, else fall back.
  const domainProbe = await google("POST", `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent("sc-domain:nexualpha.com")}/searchAnalytics/query`, { startDate: start, endDate: end, dimensions: [], rowLimit: 1 });
  const perfSite = domainProbe.status === 200 ? encodeURIComponent("sc-domain:nexualpha.com") : gscSite;
  if (domainProbe.status !== 200) console.log("note: no access to sc-domain:nexualpha.com (add the service account as a user there); using the URL-prefix property");
  const q = async (dimensions, rowLimit = 25) => {
    const r = await google("POST", `https://www.googleapis.com/webmasters/v3/sites/${perfSite}/searchAnalytics/query`, { startDate: start, endDate: end, dimensions, rowLimit });
    if (r.status !== 200) throw new Error(`searchAnalytics ${r.status} ${short(r.text)}`);
    return JSON.parse(r.text).rows || [];
  };
  const fmt = (x) => `${String(x.clicks).padStart(5)} clicks ${String(x.impressions).padStart(7)} impr  pos ${x.position.toFixed(1).padStart(5)}`;
  const [total] = await q([], 1);
  console.log(`Google ${start}..${end}: ${total ? fmt(total) : "no data"}`);
  console.log("\nTop queries"); for (const x of await q(["query"])) console.log(`${fmt(x)}  ${x.keys[0]}`);
  const pages = await q(["page"], 5000);
  console.log("\nTop pages"); for (const x of pages.slice(0, 20)) console.log(`${fmt(x)}  ${x.keys[0].replace(SITE, "/")}`);
  const sec = {};
  for (const x of pages) { const k = x.keys[0].replace(SITE, "/").split("/").filter(Boolean).filter((p) => !/^(zh-hans|zh-hant|ja|ko|ru|es|pt-br|tr|vi|id|de|fr|it|ar)$/.test(p))[0] || "(home)"; const a = (sec[k] ||= { pages: 0, clicks: 0, impressions: 0 }); a.pages++; a.clicks += x.clicks; a.impressions += x.impressions; }
  console.log("\nBy section (pages with impressions)"); for (const [k, a] of Object.entries(sec).sort((a, b) => b[1].impressions - a[1].impressions)) console.log(`${String(a.pages).padStart(5)} pages ${String(a.clicks).padStart(5)} clicks ${String(a.impressions).padStart(7)} impr  /${k}`);
  console.log("\nBy country"); for (const x of await q(["country"], 10)) console.log(`${fmt(x)}  ${x.keys[0]}`);
} else {
  console.log("usage: node scripts/search-engines.mjs verify|submit|status|inspect <url>...|perf [days] [--full]");
  process.exitCode = 1;
}
