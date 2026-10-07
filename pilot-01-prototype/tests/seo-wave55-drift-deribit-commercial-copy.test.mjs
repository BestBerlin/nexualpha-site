import assert from "node:assert/strict";
import test from "node:test";

import { publicCtaForVenue, regionalVenueCta } from "../src/data/source-bound-cta.js";
import { priorityVenueAnswerFor } from "../src/data/priority-venue-answers.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";

const graph = (schema) => schema?.["@graph"] || (Array.isArray(schema) ? schema : [schema]);
const textOf = (value) => JSON.stringify(value);

test("R55 Drift copy stays fail-closed across visible answer, CTA model and schemas", async () => {
  const visible = priorityVenueAnswerFor("drift", "en");
  const client = computeRouteSeo({ url: "/exchanges/drift", locale: "en" });
  const worker = await routeMetadata(new URL("https://nexualpha.com/exchanges/drift"), {});
  const cta = publicCtaForVenue("drift", "en");
  const regionalCta = regionalVenueCta("drift", "en", "BR", "perpetuals");
  const combined = [visible, client.schemas, worker.schema].map(textOf).join("\n");

  assert.equal(cta.commercialClaim.status, "unverified");
  assert.equal(cta.routeAvailable, false);
  assert.equal(cta.hasPartnerRoute, false);
  assert.equal(cta.registrationUrl, null);
  assert.equal(cta.inviteCode, null);
  assert.equal(regionalCta.direct, false);
  assert.equal(regionalCta.ctaState, "blocked");
  assert.doesNotMatch(regionalCta.ctaHref, /app\.drift\.trade|\/ref\//i);
  assert.equal(cta.rebatePercent, 0);
  assert.match(cta.benefit, /User benefits need verification/i);
  assert.match(combined, /sponsored registration/i);
  assert.match(combined, /Stop before sending a user to deposit, trade or a sponsored registration route/i);
  assert.doesNotMatch(combined, /Solana perps fee rebate & ecosystem access|fee rebate and ecosystem access|generic fee rebate promise/i);
  assert.doesNotMatch(combined, /\b(?:guaranteed|verified|published)\b[^.\n]{0,80}\b(?:fee rebate|registration CTA|deposit path)\b/i);
});

test("R55 Deribit user discount and migration limits stay source-bound in client and Worker schema", async () => {
  const visible = priorityVenueAnswerFor("deribit", "en");
  const client = computeRouteSeo({ url: "/exchanges/deribit", locale: "en" });
  const worker = await routeMetadata(new URL("https://nexualpha.com/exchanges/deribit"), {});
  const workerFaq = graph(worker.schema).find((entry) => entry["@type"] === "FAQPage");
  const clientFaq = client.schemas.find((entry) => entry["@type"] === "FAQPage");
  const combined = [visible, client.schemas, worker.schema].map(textOf).join("\n");

  assert.ok(workerFaq, "Worker schema includes FAQPage");
  assert.deepEqual(workerFaq.mainEntity, clientFaq.mainEntity);
  assert.match(combined, /10% trading-fee discount/i);
  assert.match(combined, /first six months/i);
  assert.match(combined, /DRB Panama/i);
  assert.match(combined, /Deribit FZE/i);
  assert.match(combined, /spot is excluded|spot discount/i);
  assert.match(combined, /regional eligibility/i);
  assert.match(combined, /2026-09-09/i);
  assert.match(combined, /2027-01-01/i);
  assert.match(combined, /25944777728797-Affiliate-Program/i);
  assert.match(combined, /NexuAlpha partner economics stay out of public user-facing copy/i);
  assert.doesNotMatch(combined, /private commission|referrer commission|commission rate|our commission|NexuAlpha earns \d+%/i);
});

test("source-bound regional projection never opens a partner route while eligibility still needs verification", () => {
  for (const [slug, market, product] of [["binance", "US", "spot"], ["binance", "BR", "spot"], ["bitget", "TR", "perpetuals"]]) {
    const cta = regionalVenueCta(slug, "en", market, product);
    if (cta.ctaState !== "verify") continue;
    assert.equal(cta.direct, false, `${slug}/${market}`);
    assert.match(cta.ctaHref, new RegExp(`/exchanges/${slug}`));
    assert.doesNotMatch(cta.ctaHref, /^https:\/\//i);
  }
});
