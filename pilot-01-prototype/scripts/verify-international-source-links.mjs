import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { internationalSourceRegistry } from "../src/data/international-source-registry.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(projectRoot, process.env.INTERNATIONAL_SOURCE_REPORT || "artifacts/international-source-review/latest.json");
const timeoutMs = Number(process.env.INTERNATIONAL_SOURCE_TIMEOUT_MS || 12000);

async function checkSource(market, source) {
  const checkedAt = new Date().toISOString();
  const request = async (method) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(source.url, {
        method,
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "NexuAlpha-source-review/1.0" },
      });
      if (method === "GET") await response.body?.cancel();
      return response;
    } finally {
      clearTimeout(timer);
    }
  };
  const requestWithRetry = async (method) => {
    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try { return await request(method); }
      catch (error) {
        lastError = error;
        if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    throw lastError;
  };
  try {
    let response;
    try {
      response = await requestWithRetry("HEAD");
      if ([404, 405, 501].includes(response.status)) {
        const headStatus = response.status;
        response = await requestWithRetry("GET");
        response._headError = `HTTP_${headStatus}`;
      }
    } catch (headError) {
      response = await requestWithRetry("GET");
      response._headError = String(headError?.message || headError);
    }
    const reachable = response.status >= 200 && response.status < 400;
    const restricted = response.status === 401 || response.status === 403 || response.status === 429;
    return {
      market,
      label: source.label,
      url: source.url,
      checkedAt,
      status: reachable ? "reachable" : restricted ? "restricted" : "unreachable",
      httpStatus: response.status,
      finalUrl: response.url,
      ...(response._headError ? { fallback: "GET", headError: response._headError } : {}),
      ...(reachable ? {} : { error: restricted ? `HTTP_${response.status}_ACCESS_RESTRICTED` : `HTTP_${response.status}` }),
    };
  } catch (error) {
    return { market, label: source.label, url: source.url, checkedAt, status: error?.name === "AbortError" ? "timeout" : "unreachable", error: String(error?.message || error) };
  }
}

const jobs = Object.entries(internationalSourceRegistry).flatMap(([market, pack]) => pack.sources.map((source) => checkSource(market, source)));
const results = await Promise.all(jobs);
const report = {
  generatedAt: new Date().toISOString(),
  sourceRegistryReviewDate: Object.values(internationalSourceRegistry).flatMap((pack) => pack.sources).map((source) => source.reviewedAt).sort().at(-1) || null,
  policy: "Reachability is not source validation, licensing confirmation, eligibility, or a CTA authorization.",
  totals: {
    checked: results.length,
    reachable: results.filter((item) => item.status === "reachable").length,
    restricted: results.filter((item) => item.status === "restricted").length,
    unavailable: results.filter((item) => item.status === "unreachable").length,
  },
  results,
};
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Wrote ${outputPath}`);
console.log(`Checked ${report.totals.checked}; reachable ${report.totals.reachable}; restricted ${report.totals.restricted}; unavailable ${report.totals.unavailable}`);
