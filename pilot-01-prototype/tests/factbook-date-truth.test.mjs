import assert from "node:assert/strict";
import test from "node:test";
import { AUDIT_DATE, FACTBOOK_REGISTRY } from "../src/data/factbook-registry.js";
import { buildFactbookSchemas, computeRouteSeo } from "../src/data/seo-injection.js";
import sitesWorker from "../worker/index.js";

function datasetFrom(schemas) {
  return schemas.find((schema) => schema?.["@type"] === "Dataset");
}

async function workerFactbookHtml(pathname) {
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

function workerSchemas(html) {
  const schemaText = html.match(/<script id="nexualpha-route-schema"[^>]*>(.*?)<\/script>/)?.[1];
  assert.ok(schemaText, "Worker SSR schema script should be present");
  const payload = JSON.parse(schemaText);
  return payload["@graph"] || payload;
}

test("Factbook visible titles and schemas use the source-review audit date as the single truth", async () => {
  const venue = FACTBOOK_REGISTRY.binance;
  const client = computeRouteSeo({ url: "/factbook/binance" });
  const clientDataset = datasetFrom(client.schemas);
  const directDataset = datasetFrom(buildFactbookSchemas(venue, "en"));
  const workerHtml = await workerFactbookHtml("/factbook/binance");
  const workerDataset = datasetFrom(workerSchemas(workerHtml));

  assert.equal(client.title, `Binance Source Review Factbook [${AUDIT_DATE}] — NexuAlpha`);
  assert.match(workerHtml, new RegExp(`<title[^>]*>Binance Source Review Factbook \\[${AUDIT_DATE}\\] — NexuAlpha</title>`));

  assert.equal(directDataset.dateModified, AUDIT_DATE);
  assert.equal(clientDataset.dateModified, AUDIT_DATE);
  assert.equal(workerDataset.dateModified, AUDIT_DATE);

  assert.doesNotMatch(client.title, /2026-09-15/);
  assert.doesNotMatch(workerHtml, /Binance Source Review Factbook \[2026-09-15\]/);
});
