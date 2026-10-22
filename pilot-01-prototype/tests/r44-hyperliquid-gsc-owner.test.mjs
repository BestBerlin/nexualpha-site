import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeRouteSeo } from "../src/data/seo-injection.js";

const GSC_QUERIES = ["hyperliquid fees", "hyperliquid funded account", "hyperliquid cashback"];

test("R44 Hyperliquid page owns GSC fee, funded-account and cashback demand without turning it into a promise", async () => {
  const seo = computeRouteSeo({ url: "/exchanges/hyperliquid", locale: "en" });
  const serializedSeo = JSON.stringify(seo.schemas);
  const priorityAnswers = await readFile(new URL("../src/data/priority-venue-answers.js", import.meta.url), "utf8");
  const v3Pages = await readFile(new URL("../src/components/v3/VenueDetailPage.jsx", import.meta.url), "utf8");

  for (const query of GSC_QUERIES) {
    assert.match(priorityAnswers, new RegExp(query, "i"), `priority answer should name ${query}`);
    assert.match(serializedSeo, new RegExp(query === "hyperliquid funded account" ? "Hyperliquid.*funded account" : query, "i"), `SEO schema should expose ${query}`);
  }

  assert.doesNotMatch(priorityAnswers, /\b\d+\s+impressions\s*\/\s*0\s+clicks\b/i);
  assert.doesNotMatch(serializedSeo, /\b\d+\s+impressions\s*\/\s*0\s+clicks\b/i);
  assert.doesNotMatch(priorityAnswers, /GSC opportunity/i);
  assert.match(priorityAnswers, /Search intent/);
  assert.match(priorityAnswers, /queryOwner/);
  assert.match(v3Pages, /v3-venue-direct-answer__query-owner/);
  assert.match(serializedSeo, /official referral discount and reward terms/i);
  assert.match(serializedSeo, /self-funded wallet collateral/i);
  assert.match(serializedSeo, /third-party trader-funding offers/i);

  assert.doesNotMatch(
    `${priorityAnswers}\n${serializedSeo}`,
    /guaranteed cashback|guaranteed funded account|guaranteed capital allocation|promised payout|private commission|commission rate/i,
  );
});
