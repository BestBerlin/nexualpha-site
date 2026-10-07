#!/usr/bin/env node

import { partnerRegistry } from "../src/data/partner-registry.js";

const base = (process.env.SMOKE_BASE_URL || "https://nexualpha.com").replace(/\/$/, "");
const checks = [];

async function get(path) {
  const response = await fetch(`${base}${path}`, { redirect: "follow" });
  return { response, body: await response.text() };
}

async function check(label, path, predicate) {
  try {
    const result = await get(path);
    const ok = result.response.ok && predicate(result.body, result.response);
    checks.push({ label, path, status: result.response.status, ok });
  } catch (error) {
    checks.push({ label, path, status: null, ok: false, error: error.message });
  }
}

async function checkPost(label, path, body, expectedStatus) {
  try {
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: new URL(base).origin,
      },
      body: JSON.stringify(body),
    });
    checks.push({ label, path, status: response.status, ok: response.status === expectedStatus });
  } catch (error) {
    checks.push({ label, path, status: null, ok: false, error: error.message });
  }
}

await check("version", "/version.json", (body) => Boolean(JSON.parse(body).buildId));
await check("live health", "/api/v1/health/live", (body) => JSON.parse(body).status === "live");
await check("Japanese homepage", "/?locale=ja", (body) => /<h1[\s\S]*世界|<html[^>]+lang=["']ja/.test(body));
await check("Portuguese rates", "/rates?locale=pt-BR", (body) => /<h1[\s\S]*(taxas|referência)/i.test(body));
await check("Korean Telegram", "/telegram?locale=ko", (body) => /<h1[\s\S]*Telegram에서/.test(body));
// An intentionally invalid body must reach the collector and fail validation
// with 400. A 5xx response means the public proxy-to-collector hop is broken.
// This probe never writes an analytics row.
await checkPost("CTA collector public proxy", "/api/analytics/cta", {}, 400);

for (const slug of ["binance", "bitget", "okx"]) {
  const venue = partnerRegistry[slug];
  const accepted = [venue.inviteCode, ...(venue.inviteCodes || [])].filter(Boolean).map((value) => String(value).toLowerCase());
  await check(`${slug} CTA`, `/exchanges/${slug}?locale=en`, (body) => accepted.some((code) => body.toLowerCase().includes(code)));
}

const failed = checks.filter((check) => !check.ok);
console.log(JSON.stringify({ base, checks, status: failed.length ? "FAIL" : "PASS" }, null, 2));
if (failed.length) process.exitCode = 1;
