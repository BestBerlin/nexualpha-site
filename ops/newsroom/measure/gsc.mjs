// Google Search Console client for the newsroom measurement loop (T9) and the T10 thin-page list.
// Service-account JWT auth; the key path is read from ~/.codex/private/gsc-api.env (never committed, never printed).
import { readFileSync } from "node:fs";
import crypto from "node:crypto";
import os from "node:os";

export const GSC_SITE = "sc-domain:nexualpha.com";
const ENV_FILE = process.env.GSC_API_ENV || `${os.homedir()}/.codex/private/gsc-api.env`;

function readEnv(file) {
  return Object.fromEntries(readFileSync(file, "utf8").split("\n").filter((line) => line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")]));
}

let cachedToken = null;
export async function gscToken() {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.value;
  const env = readEnv(ENV_FILE);
  const keyPath = Object.values(env).find((value) => value.endsWith(".json"));
  if (!keyPath) throw new Error("GSC service-account key path missing in gsc-api.env");
  const key = JSON.parse(readFileSync(keyPath, "utf8"));
  const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: key.client_email, scope: "https://www.googleapis.com/auth/webmasters", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
  const jwt = `${unsigned}.${crypto.sign("RSA-SHA256", Buffer.from(unsigned), key.private_key).toString("base64url")}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const json = await response.json();
  if (!json.access_token) throw new Error(`GSC token request failed (${response.status})`);
  cachedToken = { value: json.access_token, exp: Date.now() + 3500_000 };
  return cachedToken.value;
}

export const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);

// All rows for the given dimensions, paged (25k rows per request).
export async function searchAnalytics({ startDate, endDate, dimensions = ["page"], filters = [], site = GSC_SITE, dataState = "all" }) {
  const token = await gscToken();
  const rows = [];
  for (let startRow = 0; ; startRow += 25000) {
    const body = { startDate, endDate, dimensions, rowLimit: 25000, startRow, dataState };
    if (filters.length) body.dimensionFilterGroups = [{ filters }];
    const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(`searchAnalytics ${response.status}: ${JSON.stringify(json).slice(0, 200)}`);
    rows.push(...(json.rows || []));
    if (!json.rows || json.rows.length < 25000) break;
  }
  return rows;
}

export async function inspectUrl(url, site = GSC_SITE) {
  const token = await gscToken();
  const response = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: site }),
  });
  const json = await response.json();
  if (!response.ok) {
    const error = new Error(`urlInspection ${response.status}: ${json?.error?.message || "error"}`);
    error.status = response.status;
    throw error;
  }
  const status = json.inspectionResult?.indexStatusResult || {};
  return {
    verdict: status.verdict || null,
    coverageState: status.coverageState || null,
    indexingState: status.indexingState || null,
    robotsTxtState: status.robotsTxtState || null,
    pageFetchState: status.pageFetchState || null,
    lastCrawlTime: status.lastCrawlTime || null,
    googleCanonical: status.googleCanonical || null,
    userCanonical: status.userCanonical || null,
  };
}

export async function submitSitemap(sitemapUrl, site = GSC_SITE) {
  const token = await gscToken();
  const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps/${encodeURIComponent(sitemapUrl)}`, {
    method: "PUT",
    headers: { authorization: `Bearer ${token}` },
  });
  return response.status;
}

// "/zh-hans/news/<slug>" and "/news/<slug>" -> { slug, locale }; anything else -> null.
export function newsUrlParts(url) {
  const match = String(url || "").match(/^https:\/\/nexualpha\.com(?:\/([a-z]{2}(?:-[a-z]{2,4})?))?\/news\/([a-z0-9][a-z0-9-]*)\/?(?:[?#].*)?$/i);
  if (!match || match[2] === "page" || match[2] === "category") return null;
  return { locale: match[1] ? match[1].toLowerCase() : "en", slug: match[2].toLowerCase() };
}
