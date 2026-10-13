// 2026-10-10: the Mini App partner feed comes from the same data as the site and never carries placeholder codes.
import test from "node:test";
import assert from "node:assert/strict";
import { buildPartnersFeed } from "../src/data/partners-feed.js";
import { HOME_PARTNERS } from "../src/data/home-rebate-tiers.js";
import { partnerRegistry } from "../src/data/partner-registry.js";

test("partner feed lists real invite routes with owner shares and cadence", () => {
  const f = buildPartnersFeed({ generatedAt: "2026-10-10T00:00:00Z" });
  const by = Object.fromEntries(f.partners.map((p) => [p.slug, p]));

  const registryPartnerSlugs = Object.entries(partnerRegistry)
    .filter(([, partner]) => partner?.hasReferral && /^https:\/\//i.test(partner.registrationUrl || "") && partner.inviteCode && !/^NEXU_[A-Z0-9]+$/.test(String(partner.inviteCode)))
    .map(([slug]) => slug);
  assert.deepEqual([...HOME_PARTNERS].sort(), registryPartnerSlugs.sort(), "home partner count is registry-derived");
  assert.equal(f.partners.length, HOME_PARTNERS.length);
  assert.deepEqual(f.partners.map((p) => p.slug), HOME_PARTNERS);
  assert.equal(f.partners[0].slug, "okx");
  assert.equal(by.okx.inviteCode, "nexu888"); assert.equal(by.okx.share, 0.4); assert.equal(by.okx.settle, "hourly");
  assert.equal(by.bitget.share, 0.6); assert.equal(by.bitget.settle, "daily");
  assert.equal(by.binance.inviteCode, "11350287");
  assert.equal(by.htx.inviteCode, "nexu888");
  assert.equal(by.coinw.inviteCode, "2296057");
  for (const p of f.partners) {
    assert.match(p.registrationUrl, /^https:\/\//);
    assert.doesNotMatch(String(p.inviteCode), /^NEXU_/);
  }
  assert.ok(!by.kucoin && !by.deribit && !by.gmx, "placeholder-code venues are not offered");
  assert.equal(f.maxSharePct, 60);
});
