import assert from "node:assert/strict";
import test from "node:test";

import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";

const faqOf = (schemas) => (schemas?.["@graph"] || schemas || []).find((schema) => schema?.["@type"] === "FAQPage");
const BAD_GENERIC = /最终手续费和账户条件在哪里确认|NexuAlpha 是否保证|fees and account terms be confirmed|Does NexuAlpha guarantee|最终费率、产品范围和资格条件|认证材料、处理时间|conditions can vary/i;

function assertNoGenericFallback(faq, label) {
  assert.ok(faq, `${label}: FAQPage exists`);
  const serialized = JSON.stringify(faq.mainEntity);
  assert.doesNotMatch(serialized, BAD_GENERIC, `${label}: no generic fallback FAQ`);
  assert.match(serialized, /www\.mexc\.com/, `${label}: official domain is direct data`);
}

test("client and Worker venue fallback FAQ schema use direct recorded fields", async () => {
  const clientZh = faqOf(computeRouteSeo({ pathname: "/zh-hans/exchanges/mexc", url: "https://nexualpha.com/zh-hans/exchanges/mexc", locale: "zh-Hans" }).schemas);
  assertNoGenericFallback(clientZh, "client zh-Hans");

  const clientEn = faqOf(computeRouteSeo({ pathname: "/exchanges/mexc", url: "https://nexualpha.com/exchanges/mexc", locale: "en" }).schemas);
  assertNoGenericFallback(clientEn, "client en");

  const workerZh = faqOf((await routeMetadata(new URL("https://nexualpha.com/zh-hans/exchanges/mexc"), {})).schema);
  assertNoGenericFallback(workerZh, "worker zh-Hans");
  assert.deepEqual(workerZh.mainEntity, clientZh.mainEntity, "both runtimes drop unsourced fee/KYC questions");
  assert.equal(workerZh.mainEntity.length, 1, "worker zh-Hans drops unavailable fee/KYC fallback questions");
  assert.doesNotMatch(JSON.stringify(workerZh.mainEntity), /待官方来源核验|pending official-source verification/, "worker zh-Hans: no pending-placeholder FAQ answers");
});
