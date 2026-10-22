import assert from "node:assert/strict";
import test from "node:test";

import { AEO_HIGH_INTENT_VISIBILITY_BASELINE, AEO_QUESTION_REGISTRY } from "../src/data/aeo-question-registry.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeInventory } from "../scripts/generate-prerender-manifest.mjs";

const unresolvedIds = [
  "baseline-uniswap-testnet-mainnet",
  "baseline-uniswap-router-permit2",
  "baseline-gmx-pool-perp-cost",
  "baseline-deribit-options-margin-fees",
  "baseline-br-pix-crypto-exchange",
  "baseline-br-kyc-cpf-crypto-account",
];

const existingIndexedRoutes = new Set(routeInventory([]).filter((route) => route.index).map((route) => route.pathname));

test("Week 3 unobserved search remediation stays on existing indexable canonical URLs", () => {
  const baselineById = new Map(AEO_HIGH_INTENT_VISIBILITY_BASELINE.map((item) => [item.id, item]));

  for (const id of unresolvedIds) {
    const item = baselineById.get(id);
    assert.ok(item, id);
    const pathname = new URL(item.targetUrl).pathname;
    assert.ok(existingIndexedRoutes.has(pathname), `${id} should use an existing indexable route`);

    const seo = computeRouteSeo({ url: pathname, locale: pathname.startsWith("/br") ? "pt-BR" : "en" });
    assert.equal(seo.status, 200, id);
    assert.equal(seo.robots, "index,follow", id);
    assert.equal(seo.canonical, `https://nexualpha.com${pathname}`, id);
  }
});

test("Week 3 unobserved pages expose the missing query fields in title, description or FAQ answers", () => {
  const expectations = [
    ["/exchanges/uniswap", [/testnet/i, /mainnet/i, /Universal Router|Permit2/i, /spender|wallet signature|transaction preview/i]],
    ["/exchanges/gmx", [/pool(?: liquidity|s)|GM\/GLV/i, /price impact/i, /borrow/i, /funding/i]],
    ["/exchanges/deribit", [/options/i, /fees/i, /portfolio margin|margin/i, /liquidation/i]],
    ["/br/pix", [/Brazil|Brasil/i, /Pix/i, /BRL/i, /depósito|deposit/i, /saque|withdrawal/i, /corretora cripto|crypto exchange/i]],
    ["/br/kyc-cpf", [/Brazil|Brasil/i, /KYC/i, /CPF/i, /titularidade bancária|bank ownership/i, /benefício|bonus/i]],
  ];

  for (const [pathname, patterns] of expectations) {
    const seo = computeRouteSeo({ url: pathname, locale: pathname.startsWith("/br") ? "pt-BR" : "en" });
    const faq = seo.schemas.find((schema) => schema["@type"] === "FAQPage");
    const haystack = [seo.title, seo.description, JSON.stringify(faq?.mainEntity || [])].join("\n");
    for (const pattern of patterns) assert.match(haystack, pattern, `${pathname} missing ${pattern}`);
  }
});

test("Brazil Pix AEO registry points deposit and withdrawal questions at the existing Pix owner page", () => {
  const entries = AEO_QUESTION_REGISTRY.filter((entry) => ["br-pix-deposit", "br-pix-withdraw"].includes(entry.id));

  assert.equal(entries.length, 2);
  assert.ok(entries.every((entry) => entry.canonicalPath === "/br/pix"));
  assert.ok(entries.every((entry) => existingIndexedRoutes.has(entry.canonicalPath)));
});
