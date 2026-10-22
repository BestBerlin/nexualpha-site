import { committedFileHash } from './r100-test-contracts.mjs';
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  PRIORITY_QUERY_OWNER_REGISTRY,
  priorityCanonicalOwnerPath,
  priorityOwnerForPath,
  priorityOwnerForQuery,
} from "../src/data/priority-query-owner-registry.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";
import { buildSitemap, routeInventory } from "../scripts/generate-prerender-manifest.mjs";

const protectedFiles = {
  "src/data/partner-registry.js": committedFileHash('src/data/partner-registry.js'),
  "src/data/venue-database.js": committedFileHash('src/data/venue-database.js'),
  "src/data/public-cta.js": committedFileHash('src/data/public-cta.js'),
  "src/data/regional-cta.js": committedFileHash('src/data/regional-cta.js'),
};

const assets = {
  fetch: async () => new Response("missing", { status: 404, headers: { "content-type": "text/plain" } }),
};

test("R49 assigns Deribit and Drift queries to one canonical owner", () => {
  const cases = [
    ["deribit-options-decision", "deribit options fees", "/exchanges/deribit", "/factbook/deribit"],
    ["drift-protocol-decision", "drift protocol", "/exchanges/drift", "/factbook/drift"],
  ];

  for (const [id, query, ownerPath, supportPath] of cases) {
    const owner = PRIORITY_QUERY_OWNER_REGISTRY[id];
    assert.equal(owner.canonicalOwnerPath, ownerPath);
    assert.equal(owner.supportPath, supportPath);
    assert.equal(priorityOwnerForQuery(query)?.canonicalOwnerPath, ownerPath);
    assert.equal(priorityCanonicalOwnerPath(query), ownerPath);
    assert.equal(priorityOwnerForPath(ownerPath)?.canonicalOwnerPath, ownerPath);
    assert.equal(priorityOwnerForPath(supportPath)?.canonicalOwnerPath, ownerPath);
    assert.match(owner.ownerBoundary, /should land/i);
  }
});

test("R49 client and worker publish matching indexable Deribit and Drift owner metadata", async () => {
  for (const slug of ["deribit", "drift"]) {
    const path = `/exchanges/${slug}`;
    const client = computeRouteSeo({ url: path, locale: "en" });
    const worker = await routeMetadata(new URL(`https://nexualpha.com${path}`), { ASSETS: assets });
    const joined = `${JSON.stringify(client.schemas)}\n${JSON.stringify(worker.schema)}`;

    assert.equal(client.canonical, `https://nexualpha.com${path}`);
    assert.equal(worker.canonical, client.canonical);
    assert.equal(client.robots, "index,follow");
    assert.equal(worker.robots, "index,follow");
    assert.equal(worker.title, client.title);
    assert.equal(worker.description, client.description);
    assert.match(joined, slug === "deribit" ? /WebSocket, HTTP and FIX/i : /documentation redirect|documentation route/i);
    assert.doesNotMatch(joined, /guaranteed|risk-free|always available/i);
  }
});

test("R49 publishes every reviewed Deribit and Drift language variant in the sitemap", () => {
  const sitemap = buildSitemap(routeInventory(), []);
  for (const slug of ["deribit", "drift"]) {
    for (const path of [`/exchanges/${slug}`, `/zh-hans/exchanges/${slug}`, `/zh-hant/exchanges/${slug}`]) {
      assert.match(sitemap, new RegExp(`<loc>https://nexualpha\\.com${path}</loc>`), path);
    }
  }
});

test("R49 keeps protected invitation and CTA registries byte-identical", async () => {
  for (const [relativePath, expectedSha] of Object.entries(protectedFiles)) {
    const source = await readFile(new URL(`../${relativePath}`, import.meta.url));
    assert.equal(createHash("sha256").update(source).digest("hex"), expectedSha, relativePath);
  }
});
