#!/usr/bin/env node
// AEO / GEO monitor for nexualpha.com: a repeatable weekly measurement of whether search and answer engines
// surface the site for a fixed set of 20 buyer questions.
//
//   node scripts/aeo-monitor.mjs questions [--json]      # the fixed, versioned 20-question set in en/zh/tr/ru/vi/es
//   node scripts/aeo-monitor.mjs serp [--engine ddg|brave] [--limit N]
//                                                        # DuckDuckGo HTML + Brave HTML, 30 queries (20 en + 10 local),
//                                                        # rank of nexualpha.com in the top 10 -> serp-<YYYY-Www>.json
//   node scripts/aeo-monitor.mjs gsc [--days 28]          # Google Search Console (sc-domain) + Bing Webmaster query stats
//                                                        # for the same queries -> gsc-<YYYY-Www>.json
//   node scripts/aeo-monitor.mjs manual-template          # blank manual-<date>.json for the ChatGPT/Perplexity/Gemini/AIO check
//   node scripts/aeo-monitor.mjs report [--week YYYY-Www] # merge serp + gsc + manual into <YYYY-Www>.md with a week-on-week delta
//
// Results live in docs/company/aeo-monitor/ (repo root), never in the public build. No paid API, no login, no captcha
// bypass: public HTML result pages are fetched once per query with a 2-3 s pause and a UA that names this monitor.
// Google/Bing keys are read from ~/.codex/private like scripts/search-engines.mjs and are never printed.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { createSign } from "node:crypto";
import { promisify } from "node:util";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const OUTPUT_DIR = path.resolve(here, "..", "..", "docs", "company", "aeo-monitor");
export const SITE_DOMAIN = "nexualpha.com";
export const USER_AGENT = "Mozilla/5.0 (compatible; NexuAlphaMonitor/1.0; +https://nexualpha.com/)";
export const QUESTION_SET_VERSION = "2026-10-11.v1";
export const AI_ENGINES = ["chatgpt-search", "perplexity", "gemini", "google-ai-overview"];
export const PRINT_LANGS = ["en", "zh", "tr", "ru", "vi", "es"];

// ---------- the fixed question set (version above; change the version when you change a question) ----------
// `en` is the English query used for SERP + GSC. `local` (10 questions) is the native-language query for the market
// that speaks that language and is the second SERP query for that question. `i18n` holds display translations.
export const QUESTIONS = [
  { id: "okx-referral-code", market: "global", targetPath: "/exchanges/okx", en: "best OKX referral code",
    i18n: { zh: "OKX 最好的邀请码是什么", tr: "en iyi OKX referans kodu", ru: "лучший реферальный код OKX", vi: "mã giới thiệu OKX tốt nhất", es: "mejor código de referido OKX" } },
  { id: "okx-vs-binance-fees", market: "global", targetPath: "/compare/binance-vs-okx", en: "OKX vs Binance fees",
    i18n: { zh: "OKX 和币安手续费对比", tr: "OKX vs Binance komisyonları", ru: "комиссии OKX и Binance сравнение", vi: "phí OKX so với Binance", es: "comisiones OKX vs Binance" } },
  { id: "bitget-referral-rebate", market: "global", targetPath: "/exchanges/bitget", en: "Bitget referral code rebate",
    i18n: { zh: "Bitget 邀请码返佣", tr: "Bitget referans kodu komisyon iadesi", ru: "Bitget реферальный код возврат комиссии", vi: "mã giới thiệu Bitget hoàn phí", es: "código de referido Bitget reembolso" } },
  { id: "binance-vs-bybit-cheaper", market: "global", targetPath: "/compare/binance-vs-bybit", en: "Binance vs Bybit which is cheaper",
    i18n: { zh: "币安和 Bybit 哪个更便宜", tr: "Binance mi Bybit mi daha ucuz", ru: "Binance или Bybit что дешевле", vi: "Binance hay Bybit rẻ hơn", es: "Binance o Bybit cuál es más barato" } },
  { id: "crypto-liquidations-today", market: "global", targetPath: "/liquidations", en: "crypto liquidations today",
    i18n: { zh: "今日加密货币爆仓数据", tr: "bugünkü kripto likidasyonları", ru: "ликвидации криптовалют сегодня", vi: "thanh lý crypto hôm nay", es: "liquidaciones crypto hoy" } },
  { id: "btc-funding-rate-binance-okx", market: "global", targetPath: "/funding-rates", en: "BTC funding rate now Binance vs OKX",
    i18n: { zh: "BTC 资金费率 币安 vs OKX 实时", tr: "BTC fonlama oranı şu an Binance vs OKX", ru: "ставка финансирования BTC сейчас Binance и OKX", vi: "funding rate BTC hiện tại Binance vs OKX", es: "funding rate BTC ahora Binance vs OKX" } },
  { id: "bitget-signup-referral", market: "global", targetPath: "/exchanges/bitget", en: "how to sign up on Bitget with a referral code",
    i18n: { zh: "如何用邀请码注册 Bitget", tr: "Bitget'e referans koduyla nasıl kayıt olunur", ru: "как зарегистрироваться на Bitget с реферальным кодом", vi: "cách đăng ký Bitget bằng mã giới thiệu", es: "cómo registrarse en Bitget con código de referido" } },
  { id: "mexc-vs-bybit-kyc", market: "global", targetPath: "/compare/bybit-vs-mexc", en: "MEXC vs Bybit KYC",
    i18n: { zh: "MEXC 和 Bybit 的 KYC 对比", tr: "MEXC vs Bybit KYC", ru: "MEXC или Bybit верификация KYC", vi: "KYC MEXC so với Bybit", es: "KYC MEXC vs Bybit" } },
  { id: "lowest-perp-fees", market: "global", targetPath: "/derivatives", en: "which exchange has the lowest perp fees",
    i18n: { zh: "哪个交易所永续合约手续费最低", tr: "en düşük perp komisyonu hangi borsada", ru: "на какой бирже самые низкие комиссии на фьючерсы", vi: "sàn nào phí perp thấp nhất", es: "qué exchange tiene las comisiones de perpetuos más bajas" } },
  { id: "bitget-cafe-official", market: "global", targetPath: "/exchanges/bitget", en: "is bitget.cafe an official Bitget domain",
    i18n: { zh: "bitget.cafe 是 Bitget 官方域名吗", tr: "bitget.cafe resmi bir Bitget alan adı mı", ru: "bitget.cafe официальный домен Bitget", vi: "bitget.cafe có phải tên miền chính thức của Bitget", es: "es bitget.cafe un dominio oficial de Bitget" } },
  // ---- market questions from nx-agents/keywords/MARKET-PLAN.md (tr / vi / es / ru / id) ----
  { id: "tr-okx-referans-nerede", market: "tr", targetPath: "/tr/exchanges/okx", en: "where to enter the OKX referral code",
    local: { lang: "tr", query: "okx referans kodu nerede yazar" },
    i18n: { zh: "OKX 邀请码在哪里填写", tr: "okx referans kodu nerede yazar", ru: "где вводить реферальный код OKX", vi: "nhập mã giới thiệu OKX ở đâu", es: "dónde se ingresa el código de referido OKX" } },
  { id: "tr-okx-kayit", market: "tr", targetPath: "/tr/exchanges/okx", en: "how to register on OKX TR",
    local: { lang: "tr", query: "okx tr nasıl kayıt olunur" },
    i18n: { zh: "如何注册 OKX TR", tr: "okx tr nasıl kayıt olunur", ru: "как зарегистрироваться на OKX TR", vi: "cách đăng ký OKX TR", es: "cómo registrarse en OKX TR" } },
  { id: "vi-okx-ma-gioi-thieu", market: "vi", targetPath: "/vi/exchanges/okx", en: "where to get an OKX referral code",
    local: { lang: "vi", query: "mã giới thiệu okx lấy ở đâu" },
    i18n: { zh: "OKX 邀请码从哪里获取", tr: "OKX referans kodu nereden alınır", ru: "где взять реферальный код OKX", vi: "mã giới thiệu okx lấy ở đâu", es: "dónde conseguir un código de referido OKX" } },
  { id: "vi-okx-dang-ky", market: "vi", targetPath: "/vi/exchanges/okx", en: "how to register on OKX",
    local: { lang: "vi", query: "cách đăng ký okx" },
    i18n: { zh: "如何注册 OKX", tr: "OKX'e nasıl kayıt olunur", ru: "как зарегистрироваться на OKX", vi: "cách đăng ký okx", es: "cómo registrarse en OKX" } },
  { id: "vi-okx-hoan-phi", market: "vi", targetPath: "/vi/exchanges/okx", en: "does OKX refund trading fees",
    local: { lang: "vi", query: "okx có hoàn phí giao dịch không" },
    i18n: { zh: "OKX 有交易手续费返还吗", tr: "OKX işlem ücreti iadesi yapar mı", ru: "возвращает ли OKX торговые комиссии", vi: "okx có hoàn phí giao dịch không", es: "OKX devuelve comisiones de trading" } },
  { id: "es-okx-codigo-referido", market: "es", targetPath: "/es/exchanges/okx", en: "OKX referral code Mexico",
    local: { lang: "es", query: "okx codigo de referido" },
    i18n: { zh: "OKX 邀请码 墨西哥", tr: "OKX referans kodu Meksika", ru: "реферальный код OKX Мексика", vi: "mã giới thiệu OKX Mexico", es: "okx codigo de referido" } },
  { id: "es-okx-registrarse", market: "es", targetPath: "/es/exchanges/okx", en: "how to register on OKX in Mexico",
    local: { lang: "es", query: "como registrarse en okx" },
    i18n: { zh: "如何在墨西哥注册 OKX", tr: "Meksika'da OKX'e nasıl kayıt olunur", ru: "как зарегистрироваться на OKX в Мексике", vi: "cách đăng ký OKX tại Mexico", es: "como registrarse en okx" } },
  { id: "es-okx-confiable-mexico", market: "es", targetPath: "/mx", en: "is OKX reliable in Mexico",
    local: { lang: "es", query: "okx es confiable en mexico" },
    i18n: { zh: "OKX 在墨西哥可靠吗", tr: "OKX Meksika'da güvenilir mi", ru: "надёжна ли OKX в Мексике", vi: "OKX có đáng tin ở Mexico không", es: "okx es confiable en mexico" } },
  // Russia is an AVOID market (MARKET-PLAN §4): the /ru pages carry neutral fee / KYC facts only, so the tracked
  // query is a neutral fee question, not a sign-up or funding question.
  { id: "ru-bybit-komissii", market: "ru", targetPath: "/ru/exchanges/bybit", en: "Bybit trading fees",
    local: { lang: "ru", query: "bybit комиссии за торговлю" },
    i18n: { zh: "Bybit 交易手续费", tr: "Bybit işlem komisyonları", ru: "bybit комиссии за торговлю", vi: "phí giao dịch Bybit", es: "comisiones de trading Bybit" } },
  // Indonesia is LATER / informational (MARKET-PLAN §10): the honest OJK-status question.
  { id: "id-bitget-ojk", market: "id", targetPath: "/id-id/exchanges/bitget", en: "is Bitget registered with OJK",
    local: { lang: "id", query: "bitget terdaftar di ojk" },
    i18n: { zh: "Bitget 在 OJK 注册了吗", tr: "Bitget OJK'ya kayıtlı mı", ru: "зарегистрирована ли Bitget в OJK", vi: "Bitget có đăng ký với OJK không", es: "está Bitget registrado en la OJK" } },
];

// SERP region hints per query language (public URL parameters only).
const REGION = {
  en: { ddg: "us-en", brave: "us" }, tr: { ddg: "tr-tr", brave: "tr" }, vi: { ddg: "vn-vi", brave: "vn" },
  es: { ddg: "mx-es", brave: "mx" }, ru: { ddg: "ru-ru", brave: "ru" }, id: { ddg: "id-id", brave: "id" },
};

export function questionText(question, lang) {
  return lang === "en" ? question.en : question.i18n[lang];
}

/** The 30 SERP / GSC queries: 20 English + 10 native-language market queries. */
export function serpQueries() {
  const rows = [];
  for (const q of QUESTIONS) {
    rows.push({ questionId: q.id, lang: "en", market: q.market, query: q.en, targetPath: q.targetPath });
    if (q.local) rows.push({ questionId: q.id, lang: q.local.lang, market: q.market, query: q.local.query, targetPath: q.targetPath });
  }
  return rows;
}

// ---------- week / dates (Asia/Shanghai, ISO week) ----------
export function shanghaiDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  return parts; // YYYY-MM-DD
}
export function isoWeek(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((date - yearStart) / 864e5 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
export const currentWeek = () => isoWeek(shanghaiDate());

// ---------- SERP parsers (pure; tested against saved fixtures) ----------
const decodeEntities = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/<[^>]+>/g, "").trim();
export function hostnameOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
}
export const isOurDomain = (url) => { const h = hostnameOf(url); return h === SITE_DOMAIN || h.endsWith(`.${SITE_DOMAIN}`); };

/** DuckDuckGo HTML endpoint: organic results are `div.result` blocks (ads carry `result--ad`), links go via /l/?uddg=. */
export function parseDdgResults(html) {
  if (/anomaly-modal|\/bots\.html|challenge-form|If this error persists/i.test(html) && !/result__a/.test(html)) return { status: "blocked", results: [] };
  const blocks = html.split(/<div class="result\s/).slice(1);
  const results = [];
  for (const block of blocks) {
    if (/result--ad|result--more|result__sponsored/.test(block.slice(0, 200))) continue;
    const m = block.match(/class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!m) continue;
    let url = m[1].replace(/&amp;/g, "&");
    const uddg = url.match(/[?&]uddg=([^&]+)/);
    if (uddg) url = decodeURIComponent(uddg[1]);
    else if (url.startsWith("//")) url = `https:${url}`;
    if (!/^https?:\/\//.test(url) || /duckduckgo\.com\/y\.js/.test(url)) continue;
    results.push({ rank: results.length + 1, url, domain: hostnameOf(url), title: decodeEntities(m[2]) });
  }
  return { status: results.length ? "ok" : "no-results", results };
}

/** Brave Search HTML: organic results are `div.snippet[data-type="web"]`; the first absolute href is the result URL. */
export function parseBraveResults(html) {
  const re = /<div class="snippet[^"]*" data-pos="\d+" data-type="web"[^>]*>([\s\S]*?)(?=<div class="snippet[^"]*" data-pos="|<\/main>|$)/g;
  const results = [];
  for (const m of html.matchAll(re)) {
    const link = m[1].match(/<a href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!link) continue;
    const url = link[1].replace(/&amp;/g, "&");
    if (/search\.brave\.com/.test(url)) continue;
    const title = link[2].match(/class="title[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    results.push({ rank: results.length + 1, url, domain: hostnameOf(url), title: title ? decodeEntities(title[1]) : decodeEntities(link[2]).slice(0, 160) });
  }
  if (!results.length) {
    const visible = html.replace(/<script[\s\S]*?<\/script>/g, "");
    if (/verify you are human|unusual traffic|id="challenge|class="captcha|captcha-form/i.test(visible)) return { status: "blocked", results };
    return { status: "no-results", results };
  }
  return { status: "ok", results };
}

export function findOurRank(results, limit = 10) {
  const hit = results.slice(0, limit).find((r) => isOurDomain(r.url));
  return hit ? { rank: hit.rank, url: hit.url } : { rank: null, url: null };
}

// pauseMs: DuckDuckGo tolerates 2-3 s between requests; Brave returns HTTP 429 after the third request at that pace
// (measured 2026-10-11), so Brave queries are spaced 20 s apart. A 429 is retried once after 60 s, then recorded as blocked.
const ENGINES = {
  ddg: { url: (q, lang) => `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=${REGION[lang]?.ddg || "us-en"}`, parse: parseDdgResults, pauseMs: 2000 },
  brave: { url: (q, lang) => `https://search.brave.com/search?q=${encodeURIComponent(q)}&source=web&country=${REGION[lang]?.brave || "us"}`, parse: parseBraveResults, pauseMs: 20000 },
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const politePause = (engine) => sleep(ENGINES[engine].pauseMs + Math.floor(Math.random() * 1000));
const RETRY_AFTER_429_MS = 60000;

// Plain GET through the system curl (HTTP/2). Brave answers Node's built-in fetch client with HTTP 429 on the very
// first request while the same URL, UA and headers via curl get a normal page, so the monitor uses curl when it is
// installed and falls back to fetch. Nothing is spoofed: same monitor UA, one request per query, no cookies, no retries.
export async function curlFetch(url, { headers = {} } = {}) {
  const args = ["-sS", "-L", "--max-time", "30", "--compressed", "-w", "\n%{http_code}"];
  for (const [k, v] of Object.entries(headers)) args.push("-H", `${k}: ${v}`);
  args.push(url);
  try {
    const { stdout } = await promisify(execFile)("curl", args, { maxBuffer: 16 * 1024 * 1024 });
    const cut = stdout.lastIndexOf("\n");
    const status = Number(stdout.slice(cut + 1)) || 0;
    const body = stdout.slice(0, cut);
    return { status, text: async () => body };
  } catch (error) {
    if (error.code === "ENOENT") return fetch(url, { headers, redirect: "follow" });
    throw error;
  }
}

export async function fetchSerp(engine, row, fetchImpl = curlFetch, retryWait = 0) {
  const url = ENGINES[engine].url(row.query, row.lang);
  const fetchedAt = new Date().toISOString();
  try {
    const get = () => fetchImpl(url, { headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml", "accept-language": `${row.lang},en;q=0.8` }, redirect: "follow" });
    let res = await get();
    if (res.status === 429 && retryWait) { await sleep(retryWait); res = await get(); }
    const html = await res.text();
    if (res.status === 429 || res.status === 403) return { ...row, engine, fetchedAt, status: "blocked", httpStatus: res.status, nexualphaRank: null, nexualphaUrl: null, top: [] };
    const parsed = ENGINES[engine].parse(html);
    const ours = findOurRank(parsed.results);
    return { ...row, engine, fetchedAt, status: parsed.status, httpStatus: res.status, nexualphaRank: ours.rank, nexualphaUrl: ours.url,
      top: parsed.results.slice(0, 10).map((r) => ({ rank: r.rank, domain: r.domain, url: r.url })) };
  } catch (error) {
    return { ...row, engine, fetchedAt, status: "error", error: error.message, nexualphaRank: null, nexualphaUrl: null, top: [] };
  }
}

export function summarizeSerp(results) {
  const summary = { queries: new Set(results.map((r) => `${r.questionId}:${r.lang}`)).size };
  for (const engine of Object.keys(ENGINES)) {
    const rows = results.filter((r) => r.engine === engine);
    summary[engine] = {
      checked: rows.length, ok: rows.filter((r) => r.status === "ok").length, blocked: rows.filter((r) => r.status === "blocked").length,
      top10: rows.filter((r) => r.nexualphaRank !== null).length, top3: rows.filter((r) => r.nexualphaRank !== null && r.nexualphaRank <= 3).length,
    };
  }
  return summary;
}

/** Domains that occupy the top-3 slots most often, i.e. who we compete with for these answers. */
export function competitorDomains(results, slots = 3, limit = 12) {
  const counts = {};
  for (const r of results) for (const t of r.top.slice(0, slots)) if (!isOurDomain(t.url) && t.domain) counts[t.domain] = (counts[t.domain] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([domain, count]) => ({ domain, count }));
}

// ---------- Google Search Console + Bing Webmaster (keys outside the repo, never printed) ----------
const PRIVATE = process.env.NEXU_KEYS_DIR || path.join(homedir(), ".codex", "private");
function readEnv(file) {
  const p = path.join(PRIVATE, file);
  if (!existsSync(p)) return {};
  return Object.fromEntries(readFileSync(p, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
}
async function googleToken() {
  const env = readEnv("gsc-api.env");
  if (!env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error("gsc-api.env has no GOOGLE_APPLICATION_CREDENTIALS");
  const key = JSON.parse(readFileSync(env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "RS256", typ: "JWT" });
  const claim = b64({ iss: key.client_email, scope: "https://www.googleapis.com/auth/webmasters.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 });
  const sig = createSign("RSA-SHA256").update(`${head}.${claim}`).sign(key.private_key, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${head}.${claim}.${sig}` });
  const json = await res.json();
  if (!json.access_token) throw new Error(`Google auth failed: ${json.error || res.status}`);
  return json.access_token;
}
const GSC_PROPERTY = encodeURIComponent("sc-domain:nexualpha.com");
async function gscQuery(token, body) {
  const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${GSC_PROPERTY}/searchAnalytics/query`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body) });
  const text = await res.text();
  if (res.status !== 200) throw new Error(`searchAnalytics ${res.status} ${text.replace(/\s+/g, " ").slice(0, 200)}`);
  return JSON.parse(text).rows || [];
}
async function bingQueryStats() {
  const key = readEnv("bing-webmaster-api.env").BING_WEBMASTER_API_KEY;
  if (!key) throw new Error("bing-webmaster-api.env has no BING_WEBMASTER_API_KEY");
  const res = await fetch(`https://ssl.bing.com/webmaster/api.svc/json/GetQueryStats?apikey=${key}&siteUrl=${encodeURIComponent("https://nexualpha.com/")}`);
  const text = await res.text();
  if (res.status !== 200) throw new Error(`Bing GetQueryStats ${res.status} ${text.replace(/\s+/g, " ").replace(key, "***").slice(0, 200)}`);
  return JSON.parse(text).d || [];
}

const STOPWORDS = new Set(["the", "a", "an", "is", "vs", "and", "or", "to", "on", "in", "with", "which", "how", "what", "now", "today", "best", "code", "en", "de", "la", "el", "ở", "có", "không", "nerede", "nasıl", "tr", "mi", "di", "за"]);
export const normalizeQuery = (s) => s.toLowerCase().normalize("NFC").replace(/[.,?!'"¿¡]/g, " ").replace(/\s+/g, " ").trim();
export function significantTokens(query) {
  return normalizeQuery(query).split(" ").filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}
/** exact match, else a GSC query that contains every significant token of ours (e.g. "okx vs binance trading fees"). */
export function matchQueryRows(query, rows, textOf) {
  const target = normalizeQuery(query);
  const tokens = significantTokens(query);
  const exact = rows.filter((r) => normalizeQuery(textOf(r)) === target);
  const variants = tokens.length ? rows.filter((r) => { const t = normalizeQuery(textOf(r)); return t !== target && tokens.every((tok) => t.includes(tok)); }) : [];
  return { exact, variants };
}
const aggregate = (rows) => {
  if (!rows.length) return { impressions: 0, clicks: 0, position: null };
  const impressions = rows.reduce((a, r) => a + r.impressions, 0);
  const clicks = rows.reduce((a, r) => a + r.clicks, 0);
  const position = impressions ? rows.reduce((a, r) => a + r.position * r.impressions, 0) / impressions : null;
  return { impressions, clicks, position: position === null ? null : Number(position.toFixed(1)) };
};

export function buildGscRows(queries, queryRows, queryPageRows) {
  return queries.map((q) => {
    const { exact, variants } = matchQueryRows(q.query, queryRows, (r) => r.keys[0]);
    const toRow = (r) => ({ query: r.keys[0], impressions: r.impressions, clicks: r.clicks, position: r.position });
    const matchedTexts = new Set([...exact, ...variants].map((r) => normalizeQuery(r.keys[0])));
    const pages = {};
    for (const r of queryPageRows) if (matchedTexts.has(normalizeQuery(r.keys[0]))) { const p = r.keys[1]; pages[p] = (pages[p] || 0) + r.impressions; }
    const topPage = Object.entries(pages).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    return { ...q, exact: aggregate(exact.map(toRow)), variants: variants.map(toRow).sort((a, b) => b.impressions - a.impressions).slice(0, 8), variantsTotal: aggregate(variants.map(toRow)), topPage };
  });
}

export function buildBingRows(queries, stats) {
  const rows = stats.map((s) => ({ query: s.Query, impressions: s.Impressions || 0, clicks: s.Clicks || 0, position: s.AvgImpressionPosition || s.AvgClickPosition || 0 }));
  return queries.map((q) => {
    const { exact, variants } = matchQueryRows(q.query, rows, (r) => r.query);
    return { questionId: q.questionId, lang: q.lang, query: q.query, exact: aggregate(exact), variantsTotal: aggregate(variants), variants: variants.slice(0, 5) };
  });
}

// ---------- files ----------
export function ensureDir(dir) { mkdirSync(dir, { recursive: true }); }
export function writeJson(file, data) { ensureDir(path.dirname(file)); writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`); }
export function readJson(file) { return JSON.parse(readFileSync(file, "utf8")); }
export function listFiles(dir, prefix) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith(".json")).sort();
}
/** latest `<prefix>-<key>.json` whose key <= `upTo` (keys sort lexically: YYYY-Www or YYYY-MM-DD). */
export function latestFile(dir, prefix, upTo = "￿") {
  const files = listFiles(dir, `${prefix}-`).filter((f) => f.slice(prefix.length + 1, -5) <= upTo);
  return files.length ? path.join(dir, files[files.length - 1]) : null;
}

export const fileKey = (file, prefix) => path.basename(file).slice(prefix.length + 1, -5);
/** latest `<prefix>-<key>.json` whose key is strictly before `key`. */
export function previousFile(dir, prefix, key) {
  const files = listFiles(dir, `${prefix}-`).filter((f) => fileKey(f, prefix) < key);
  return files.length ? path.join(dir, files[files.length - 1]) : null;
}

export function manualTemplate(date = shanghaiDate()) {
  return {
    schema: "nexualpha.aeo-manual-check.v1", questionSetVersion: QUESTION_SET_VERSION, date, operator: "", durationMinutes: null,
    results: QUESTIONS.flatMap((q) => AI_ENGINES.map((engine) => ({ engine, questionId: q.id, question: q.en, cited: false, rank_of_citation: null, cited_url: null, competitor_domains: [], notes: "" }))),
  };
}

// ---------- report ----------
const fmtDelta = (now, prev, digits = 0) => {
  if (now === null || now === undefined) return "-";
  if (prev === null || prev === undefined) return "new";
  const d = now - prev;
  const s = digits ? Math.abs(d).toFixed(digits) : String(Math.abs(d));
  return d === 0 ? "±0" : d > 0 ? `+${s}` : `−${s}`;
};
const num = (x, digits = 0) => (x === null || x === undefined ? "-" : digits ? x.toFixed(digits) : String(x));
const rankCell = (r) => (!r ? "-" : r.status === "blocked" ? "blocked" : r.status === "error" ? "error" : r.nexualphaRank === null ? "–" : `#${r.nexualphaRank}`);

export function gscSummary(gsc) {
  if (!gsc) return null;
  const rows = gsc.google?.rows || [];
  const withImpr = rows.filter((r) => r.exact.impressions + r.variantsTotal.impressions > 0);
  const impressions = withImpr.reduce((a, r) => a + r.exact.impressions + r.variantsTotal.impressions, 0);
  const clicks = withImpr.reduce((a, r) => a + r.exact.clicks + r.variantsTotal.clicks, 0);
  const weighted = withImpr.reduce((a, r) => a + (r.exact.position || 0) * r.exact.impressions + (r.variantsTotal.position || 0) * r.variantsTotal.impressions, 0);
  const bingRows = gsc.bing?.rows || [];
  return { queriesWithImpressions: withImpr.length, impressions, clicks, position: impressions ? Number((weighted / impressions).toFixed(1)) : null,
    siteImpressions: gsc.google?.siteTotals?.impressions ?? null, siteClicks: gsc.google?.siteTotals?.clicks ?? null, sitePosition: gsc.google?.siteTotals?.position ?? null,
    bingQueriesWithImpressions: bingRows.filter((r) => r.exact.impressions + r.variantsTotal.impressions > 0).length };
}
export function manualSummary(manual) {
  if (!manual) return null;
  const byEngine = {};
  for (const e of AI_ENGINES) { const rows = manual.results.filter((r) => r.engine === e); byEngine[e] = { checked: rows.length, cited: rows.filter((r) => r.cited).length }; }
  return { date: manual.date, cited: manual.results.filter((r) => r.cited).length, checked: manual.results.length, byEngine };
}

export function buildReport({ week, serp, gsc, manual, prevSerp, prevGsc, prevManual }) {
  const s = serp ? summarizeSerp(serp.results) : null, ps = prevSerp ? summarizeSerp(prevSerp.results) : null;
  const g = gscSummary(gsc), pg = gscSummary(prevGsc);
  const m = manualSummary(manual), pm = manualSummary(prevManual);
  const prevWeek = prevSerp?.week || prevGsc?.week || null;
  const L = [];
  L.push(`# AEO monitor — ${week}`, "", `Generated ${new Date().toISOString()} · question set ${QUESTION_SET_VERSION} · previous week: ${prevWeek || "none (baseline)"}`, "",
    "Measures whether nexualpha.com is surfaced for 20 fixed buyer questions: DuckDuckGo and Brave top-10 presence (30 queries: 20 en + 10 local),",
    "Google Search Console impressions/position for the same queries, Bing Webmaster query stats, and a manual citation check in four answer engines.", "");
  L.push("## Scoreboard", "", "| Metric | This week | Last week | Δ |", "|---|---|---|---|");
  const row = (label, now, prev, digits = 0) => L.push(`| ${label} | ${num(now, digits)} | ${num(prev, digits)} | ${fmtDelta(now, prev, digits)} |`);
  if (s) {
    row(`DuckDuckGo: queries with nexualpha.com in top 10 (of ${s.ddg.checked})`, s.ddg.top10, ps?.ddg.top10);
    row("DuckDuckGo: in top 3", s.ddg.top3, ps?.ddg.top3);
    row(`Brave: queries with nexualpha.com in top 10 (of ${s.brave.checked})`, s.brave.top10, ps?.brave.top10);
    row("Brave: in top 3", s.brave.top3, ps?.brave.top3);
    row("SERP fetches blocked / challenged", s.ddg.blocked + s.brave.blocked, ps ? ps.ddg.blocked + ps.brave.blocked : null);
  } else L.push("| SERP | not run | | |");
  if (g) {
    row(`GSC (${gsc.window.start}..${gsc.window.end}): tracked queries with impressions (of ${gsc.google.rows.length})`, g.queriesWithImpressions, pg?.queriesWithImpressions);
    row("GSC: impressions on tracked queries (exact + variants)", g.impressions, pg?.impressions);
    row("GSC: clicks on tracked queries", g.clicks, pg?.clicks);
    row("GSC: impression-weighted position on tracked queries", g.position, pg?.position, 1);
    row("GSC: whole-site impressions in window", g.siteImpressions, pg?.siteImpressions);
    row("GSC: whole-site clicks in window", g.siteClicks, pg?.siteClicks);
    row("GSC: whole-site average position", g.sitePosition, pg?.sitePosition, 1);
    if (gsc.bing?.status === "ok") row("Bing Webmaster: tracked queries with impressions", g.bingQueriesWithImpressions, pg?.bingQueriesWithImpressions);
    else L.push(`| Bing Webmaster | ${gsc.bing?.status || "not run"}${gsc.bing?.message ? `: ${gsc.bing.message}` : ""} | | |`);
  } else L.push("| GSC | not run | | |");
  if (m) {
    row(`AI answer engines: citations of nexualpha.com (of ${m.checked} engine×question checks, ${m.date})`, m.cited, pm?.cited);
    for (const e of AI_ENGINES) row(`  ${e}`, m.byEngine[e].cited, pm?.byEngine[e].cited);
  } else L.push("| AI answer engines | manual check not run this week (see MANUAL-AI-CHECK.md) | | |");
  L.push("");

  const serpBy = (id, lang, engine) => serp?.results.find((r) => r.questionId === id && r.lang === lang && r.engine === engine);
  const gscBy = (id, lang) => gsc?.google?.rows.find((r) => r.questionId === id && r.lang === lang);
  const LETTER = { "chatgpt-search": "C", perplexity: "P", gemini: "G", "google-ai-overview": "A" };
  const manualCell = (id) => (m ? AI_ENGINES.map((e) => { const r = manual.results.find((x) => x.engine === e && x.questionId === id); return r?.cited ? `${LETTER[e]}#${r.rank_of_citation ?? "?"}` : "·"; }).join(" ") : "-");
  L.push("## Per question (English queries)", "", "| # | Question | DDG | Brave | GSC impr | GSC pos | Top GSC page | AI cited (C=ChatGPT P=Perplexity G=Gemini A=AI Overview) |", "|---|---|---|---|---|---|---|---|");
  QUESTIONS.forEach((q, i) => {
    const gr = gscBy(q.id, "en");
    const impr = gr ? gr.exact.impressions + gr.variantsTotal.impressions : null;
    const pos = gr ? (gr.exact.impressions ? gr.exact.position : gr.variantsTotal.position) : null;
    L.push(`| ${i + 1} | ${q.en} | ${rankCell(serpBy(q.id, "en", "ddg"))} | ${rankCell(serpBy(q.id, "en", "brave"))} | ${num(impr)} | ${num(pos, 1)} | ${gr?.topPage ? gr.topPage.replace("https://nexualpha.com", "") : "-"} | ${manualCell(q.id)} |`);
  });
  L.push("", "## Per question (local-language queries)", "", "| Market | Query | DDG | Brave | GSC impr | GSC pos | Top GSC page |", "|---|---|---|---|---|---|---|");
  for (const q of QUESTIONS.filter((x) => x.local)) {
    const gr = gscBy(q.id, q.local.lang);
    const impr = gr ? gr.exact.impressions + gr.variantsTotal.impressions : null;
    const pos = gr ? (gr.exact.impressions ? gr.exact.position : gr.variantsTotal.position) : null;
    L.push(`| ${q.market} | ${q.local.query} | ${rankCell(serpBy(q.id, q.local.lang, "ddg"))} | ${rankCell(serpBy(q.id, q.local.lang, "brave"))} | ${num(impr)} | ${num(pos, 1)} | ${gr?.topPage ? gr.topPage.replace("https://nexualpha.com", "") : "-"} |`);
  }
  if (serp) {
    L.push("", "## Who holds the top-3 slots (DDG + Brave, all 30 queries)", "", "| Domain | Top-3 appearances |", "|---|---|");
    for (const c of competitorDomains(serp.results)) L.push(`| ${c.domain} | ${c.count} |`);
    const blocked = serp.results.filter((r) => r.status !== "ok");
    if (blocked.length) { L.push("", "## SERP fetches without a result list", ""); for (const b of blocked) L.push(`- ${b.engine} · ${b.lang} · "${b.query}" → ${b.status}${b.httpStatus ? ` (HTTP ${b.httpStatus})` : ""}${b.error ? ` ${b.error}` : ""}`); }
  }
  if (gsc?.google?.rows) {
    const variants = gsc.google.rows.filter((r) => r.variants.length);
    if (variants.length) { L.push("", "## GSC query variants matched", ""); for (const r of variants) L.push(`- **${r.query}** (${r.lang}): ${r.variants.map((v) => `"${v.query}" ${v.impressions} impr pos ${v.position.toFixed(1)}`).join("; ")}`); }
  }
  if (m) {
    L.push("", `## Manual AI check (${manual.date}${manual.operator ? `, ${manual.operator}` : ""})`, "", "| Engine | Question | Cited | Rank | URL | Competitors cited |", "|---|---|---|---|---|---|");
    for (const r of manual.results) L.push(`| ${r.engine} | ${r.question} | ${r.cited ? "yes" : "no"} | ${r.rank_of_citation ?? "-"} | ${r.cited_url || "-"} | ${(r.competitor_domains || []).join(", ") || "-"} |`);
  }
  L.push("", "## Files", "", `- serp: ${serp ? `serp-${serp.week}.json` : "-"}`, `- gsc: ${gsc ? `gsc-${gsc.week}.json` : "-"}`, `- manual: ${manual ? `manual-${manual.date}.json` : "-"}`, "");
  return { markdown: L.join("\n"), summary: { week, serp: s, gsc: g, manual: m, previousWeek: prevWeek } };
}

// ---------- CLI ----------
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback; };

async function cmdQuestions() {
  if (process.argv.includes("--json")) { console.log(JSON.stringify({ version: QUESTION_SET_VERSION, questions: QUESTIONS, serpQueries: serpQueries() }, null, 2)); return; }
  console.log(`Question set ${QUESTION_SET_VERSION} — ${QUESTIONS.length} questions, ${serpQueries().length} SERP queries\n`);
  QUESTIONS.forEach((q, i) => {
    console.log(`${String(i + 1).padStart(2)}. [${q.id}] market=${q.market} target=${q.targetPath}`);
    for (const lang of PRINT_LANGS) console.log(`    ${lang}: ${questionText(q, lang)}`);
    if (q.local) console.log(`    SERP local (${q.local.lang}): ${q.local.query}`);
  });
}

async function cmdSerp() {
  const week = arg("--week", currentWeek());
  const engines = arg("--engine", "ddg,brave").split(",");
  const limit = Number(arg("--limit", 0)) || Infinity;
  const queries = serpQueries().slice(0, limit);
  const results = [];
  let n = 0;
  for (const engine of engines) {
    for (const row of queries) {
      if (n++) await politePause(engine);
      const r = await fetchSerp(engine, row, curlFetch, RETRY_AFTER_429_MS);
      results.push(r);
      console.log(`${engine.padEnd(5)} ${row.lang} ${String(r.status).padEnd(10)} ${r.nexualphaRank === null ? " –" : `#${r.nexualphaRank}`}  ${row.query}${r.top[0] ? `  (1st: ${r.top[0].domain})` : ""}`);
    }
  }
  const file = path.join(OUTPUT_DIR, `serp-${week}.json`);
  // a partial run (--engine ddg) keeps the other engine's rows already recorded for this week
  const kept = existsSync(file) ? readJson(file).results.filter((r) => !engines.includes(r.engine)) : [];
  const all = [...kept, ...results];
  const data = { schema: "nexualpha.aeo-serp.v1", questionSetVersion: QUESTION_SET_VERSION, week, generatedAt: new Date().toISOString(), engines: [...new Set(all.map((r) => r.engine))], summary: summarizeSerp(all), competitors: competitorDomains(all), results: all };
  writeJson(file, data);
  console.log(`\n${JSON.stringify(data.summary)}\nwrote ${path.relative(process.cwd(), file)}`);
}

async function cmdGsc() {
  const week = arg("--week", currentWeek());
  const days = Number(arg("--days", 28));
  const end = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
  const start = new Date(Date.now() - (days + 2) * 864e5).toISOString().slice(0, 10);
  const queries = serpQueries();
  const data = { schema: "nexualpha.aeo-gsc.v1", questionSetVersion: QUESTION_SET_VERSION, week, generatedAt: new Date().toISOString(), window: { start, end, days }, google: null, bing: null };
  try {
    const token = await googleToken();
    const [total] = await gscQuery(token, { startDate: start, endDate: end, dimensions: [], rowLimit: 1 });
    const queryRows = await gscQuery(token, { startDate: start, endDate: end, dimensions: ["query"], rowLimit: 5000 });
    const queryPageRows = await gscQuery(token, { startDate: start, endDate: end, dimensions: ["query", "page"], rowLimit: 5000 });
    data.google = { status: "ok", property: "sc-domain:nexualpha.com", siteTotals: total ? { clicks: total.clicks, impressions: total.impressions, position: Number(total.position.toFixed(1)) } : { clicks: 0, impressions: 0, position: null }, distinctQueries: queryRows.length, rows: buildGscRows(queries, queryRows, queryPageRows) };
    for (const r of data.google.rows) console.log(`gsc  ${r.lang} ${String(r.exact.impressions + r.variantsTotal.impressions).padStart(5)} impr  pos ${num(r.exact.impressions ? r.exact.position : r.variantsTotal.position, 1).padStart(5)}  ${r.query}${r.topPage ? `  → ${r.topPage.replace("https://nexualpha.com", "")}` : ""}`);
    console.log(`gsc  site ${start}..${end}: ${data.google.siteTotals.clicks} clicks ${data.google.siteTotals.impressions} impr pos ${data.google.siteTotals.position}`);
  } catch (error) { data.google = { status: "error", message: error.message, rows: [] }; console.log(`gsc  ERR ${error.message}`); }
  try {
    const stats = await bingQueryStats();
    data.bing = { status: "ok", distinctQueries: stats.length, rows: buildBingRows(queries, stats) };
    console.log(`bing ${stats.length} queries with stats; tracked queries with impressions: ${data.bing.rows.filter((r) => r.exact.impressions + r.variantsTotal.impressions > 0).length}`);
  } catch (error) { data.bing = { status: "error", message: error.message, rows: [] }; console.log(`bing ERR ${error.message}`); }
  const file = path.join(OUTPUT_DIR, `gsc-${week}.json`);
  writeJson(file, data);
  console.log(`wrote ${path.relative(process.cwd(), file)}`);
}

async function cmdManualTemplate() {
  const date = arg("--date", shanghaiDate());
  const file = path.join(OUTPUT_DIR, `manual-${date}.json`);
  if (existsSync(file) && !process.argv.includes("--force")) { console.log(`${file} exists; use --force to overwrite`); return; }
  writeJson(file, manualTemplate(date));
  console.log(`wrote ${path.relative(process.cwd(), file)} — fill it in per MANUAL-AI-CHECK.md`);
}

async function cmdReport() {
  const week = arg("--week", currentWeek());
  const load = (f) => (f ? readJson(f) : null);
  const serpFile = latestFile(OUTPUT_DIR, "serp", week), gscFile = latestFile(OUTPUT_DIR, "gsc", week);
  const serp = load(serpFile), gsc = load(gscFile);
  const prevSerp = load(serpFile ? previousFile(OUTPUT_DIR, "serp", fileKey(serpFile, "serp")) : null);
  const prevGsc = load(gscFile ? previousFile(OUTPUT_DIR, "gsc", fileKey(gscFile, "gsc")) : null);
  // manual check: the latest run dated within 10 days before the end of this week counts for this week
  const manualAll = listFiles(OUTPUT_DIR, "manual-").map((f) => path.join(OUTPUT_DIR, f));
  const weekEnd = isoWeekEnd(week);
  const recent = manualAll.filter((f) => { const d = path.basename(f).slice(7, -5); return d <= weekEnd && daysBetween(d, weekEnd) <= 10; });
  const manual = recent.length ? load(recent[recent.length - 1]) : null;
  const older = manualAll.filter((f) => !recent.includes(f) && path.basename(f).slice(7, -5) < (manual?.date || weekEnd));
  const prevManual = older.length ? load(older[older.length - 1]) : null;
  const { markdown, summary } = buildReport({ week, serp, gsc, manual, prevSerp, prevGsc, prevManual });
  const file = path.join(OUTPUT_DIR, `${week}.md`);
  ensureDir(OUTPUT_DIR);
  writeFileSync(file, markdown);
  console.log(markdown.split("\n").slice(0, 30).join("\n"));
  console.log(`\nwrote ${path.relative(process.cwd(), file)}`);
  return summary;
}
export function isoWeekEnd(week) { // Sunday of the ISO week, YYYY-MM-DD
  const [y, w] = week.split("-W").map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const monday = new Date(jan4.getTime() - ((jan4.getUTCDay() || 7) - 1) * 864e5 + (w - 1) * 7 * 864e5);
  return new Date(monday.getTime() + 6 * 864e5).toISOString().slice(0, 10);
}
export const daysBetween = (a, b) => Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 864e5);

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2];
  const commands = { questions: cmdQuestions, serp: cmdSerp, gsc: cmdGsc, "manual-template": cmdManualTemplate, report: cmdReport };
  if (!commands[cmd]) { console.log("usage: node scripts/aeo-monitor.mjs questions|serp|gsc|manual-template|report [--week YYYY-Www] [--engine ddg,brave] [--days 28]"); process.exitCode = 1; }
  else await commands[cmd]();
}
