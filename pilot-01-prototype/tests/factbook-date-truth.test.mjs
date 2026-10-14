import assert from "node:assert/strict";
import test from "node:test";
import { AUDIT_DATE, FACTBOOK_REGISTRY } from "../src/data/factbook-registry.js";
import { buildFactbookSchemas } from "../src/data/seo-injection.js";
import { factbookDates } from "../src/data/factbook-dates.js";
import sitesWorker from "../worker/index.js";

function datasetFrom(schemas) {
  return schemas.find((schema) => schema?.["@type"] === "Dataset");
}

async function workerHtml(pathname) {
  const assets = {
    fetch: async (request) => {
      const url = new URL(request.url);
      if (url.pathname === "/index.html") {
        return new Response(
          "<!doctype html><html><head><title>NexuAlpha</title></head><body><div id=\"root\"></div></body></html>",
          { headers: { "content-type": "text/html; charset=utf-8" } },
        );
      }
      return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain" } });
    },
  };

  const response = await sitesWorker.fetch(
    new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: assets },
  );
  assert.equal(response.status, 200, pathname);
  return response.text();
}

async function workerResponse(pathname) {
  const assets = {
    fetch: async (request) => {
      const url = new URL(request.url);
      if (url.pathname === "/index.html") {
        return new Response(
          "<!doctype html><html><head><title>NexuAlpha</title></head><body><div id=\"root\"></div></body></html>",
          { headers: { "content-type": "text/html; charset=utf-8" } },
        );
      }
      return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain" } });
    },
  };
  return sitesWorker.fetch(new Request(`https://nexualpha.com${pathname}`, { headers: { accept: "text/html" } }), { ASSETS: assets });
}

// Audit NX-06 (2026-10-11, owner-approved batch): the title no longer carries a bracketed date, and the Dataset
// dateModified is the latest real review date of the data shown (fees checked / benefit terms / dossier compiled).
test("Factbook titles carry no stale date and schemas use the latest real review date", async () => {
  const venue = FACTBOOK_REGISTRY.binance;
  const directDataset = datasetFrom(buildFactbookSchemas(venue, "en"));
  const redirect = await workerResponse("/factbook/binance");
  const exchangeHtml = await workerHtml("/exchanges/binance");

  const latest = factbookDates("binance").latestReviewOn;
  assert.ok(latest >= AUDIT_DATE);
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get("location"), "https://nexualpha.com/exchanges/binance#sources");
  // Referral titles keep the registry code; benefit terms and review dates belong in body/schema evidence.
  assert.match(exchangeHtml, /<title[^>]*>Binance referral code: 11350287<\/title>/);
  assert.doesNotMatch(exchangeHtml.match(/<title[^>]*>(.*?)<\/title>/)?.[1] || "", /20\d{2}|verified|fees back/i);
  assert.match(exchangeHtml, /Up to 25% of fees back/);

  assert.equal(directDataset.dateModified, latest);

  assert.doesNotMatch(exchangeHtml, /Binance Source Review Factbook \[2026-09-15\]/);
});
