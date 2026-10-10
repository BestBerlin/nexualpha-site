#!/usr/bin/env node
// Search-engine operations for nexualpha.com: Google Search Console, Bing Webmaster, Yandex Webmaster.
// Keys are read from the owner's machine (~/.codex/private/*.env); nothing secret lives in this repo.
//   node scripts/search-engines.mjs verify   # one-time: confirm ownership via the files in public/
//   node scripts/search-engines.mjs submit   # after every deploy: submit both sitemaps to all three
//   node scripts/search-engines.mjs status   # sitemap state, errors and indexing summary
import { readFileSync, existsSync } from "node:fs";
import { createSign } from "node:crypto";
import { homedir } from "node:os";
import path from "node:path";

const SITE = "https://nexualpha.com/";
const SITEMAPS = ["https://nexualpha.com/sitemap.xml", "https://nexualpha.com/news-sitemap.xml"];
const PRIVATE = process.env.NEXU_KEYS_DIR || path.join(homedir(), ".codex", "private");

function readEnv(file) {
  const p = path.join(PRIVATE, file);
  if (!existsSync(p)) return {};
  return Object.fromEntries(readFileSync(p, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
}
const out = (engine, step, status, detail = "") => console.log(`${engine.padEnd(7)} ${step.padEnd(16)} ${String(status).padEnd(5)} ${detail}`.trimEnd());
const short = (text) => String(text).replace(/\s+/g, " ").slice(0, 300);

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
  for (const sm of SITEMAPS) {
    await run("google", "sitemap", () => google("PUT", `https://www.googleapis.com/webmasters/v3/sites/${gscSite}/sitemaps/${encodeURIComponent(sm)}`));
    await run("bing", "sitemap", () => bing("POST", "SubmitFeed", { siteUrl: SITE, feedUrl: sm }));
    await run("yandex", "sitemap", () => yandex("POST", `/hosts/${YHOST}/user-added-sitemaps/`, { url: sm }));
  }
} else if (cmd === "status") {
  await run("google", "sitemaps", () => google("GET", `https://www.googleapis.com/webmasters/v3/sites/${gscSite}/sitemaps`));
  await run("bing", "feeds", () => bing("GET", "GetFeeds", { siteUrl: SITE }));
  await run("bing", "crawl issues", () => bing("GET", "GetCrawlIssues", { siteUrl: SITE }));
  await run("yandex", "summary", () => yandex("GET", `/hosts/${YHOST}/summary`));
  await run("yandex", "verification", () => yandex("GET", `/hosts/${YHOST}/verification`));
} else {
  console.log("usage: node scripts/search-engines.mjs verify|submit|status");
  process.exitCode = 1;
}
