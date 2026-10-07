import assert from "node:assert/strict";
import test from "node:test";

import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";

const expectedTitle = "GMX v2 Fees: Pools, Price Impact, Funding and Liquidation — NexuAlpha";
const expectedDescription = "Source-backed GMX answer covering GM/GLV pools, oracle pricing, collateral choice, position and swap fees, price impact, borrow, funding and liquidation boundaries.";

test("Wave42 changes only the English GMX title for the observed exact query", async () => {
  const client = computeRouteSeo({ url: "/exchanges/gmx", locale: "en" });
  const worker = await routeMetadata(new URL("https://nexualpha.com/exchanges/gmx"));

  assert.equal(client.title, expectedTitle);
  assert.equal(worker.title, expectedTitle);
  assert.equal(client.description, expectedDescription);
  assert.equal(worker.description, expectedDescription);
  assert.equal(client.canonical, "https://nexualpha.com/exchanges/gmx");
  assert.equal(worker.canonical, "https://nexualpha.com/exchanges/gmx");
  assert.equal(client.robots, "index,follow");
  assert.equal(worker.robots, "index,follow");
});

test("Wave42 GMX title experiment does not replace localized titles", async () => {
  const client = computeRouteSeo({ url: "/exchanges/gmx?locale=tr", locale: "tr" });
  const worker = await routeMetadata(new URL("https://nexualpha.com/exchanges/gmx?locale=tr"));

  assert.match(client.title, /Platform profili ve ücretler/);
  assert.match(worker.title, /Platform profili ve ücretler/);
  assert.doesNotMatch(`${client.title}\n${worker.title}`, /GMX Pool Liquidity/);
});
