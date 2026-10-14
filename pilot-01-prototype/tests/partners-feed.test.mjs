// 2026-10-10: the Mini App partner feed comes from the same data as the site and never carries placeholder codes.
import test from "node:test";
import assert from "node:assert/strict";
import { buildPartnersFeed } from "../src/data/partners-feed.js";
import { HOME_PARTNERS } from "../src/data/home-rebate-tiers.js";
import { partnerRegistry } from "../src/data/partner-registry.js";
import { publicCtaForVenue } from "../src/data/source-bound-cta.js";
import { venueDatabase } from "../src/data/venue-database.js";
import { VENUE_PRIORITY } from "../src/data/venue-priority.js";

test("partner feed lists real invite routes with owner shares and cadence", () => {
  const f = buildPartnersFeed({ generatedAt: "2026-10-10T00:00:00Z" });
  const by = Object.fromEntries(f.partners.map((p) => [p.slug, p]));

  const registryPartnerSlugs = Object.entries(partnerRegistry)
    .filter(([, partner]) => partner?.hasReferral && /^https:\/\//i.test(partner.registrationUrl || "") && partner.inviteCode && !/^NEXU_[A-Z0-9]+$/.test(String(partner.inviteCode)))
    .map(([slug]) => slug);
  assert.deepEqual([...HOME_PARTNERS].sort(), registryPartnerSlugs.sort(), "home partner count is registry-derived");
  assert.equal(f.partners.length, HOME_PARTNERS.length);
  assert.deepEqual(f.partners.map((p) => p.slug), HOME_PARTNERS);
  assert.equal(f.partners[0].slug, VENUE_PRIORITY[0]);
  assert.equal(by.okx.inviteCode, "nexu888"); assert.equal(by.okx.share, 0.4); assert.equal(by.okx.settle, "hourly");
  assert.equal(by.bitget.share, 0.6); assert.equal(by.bitget.settle, "daily");
  assert.equal(by.binance.inviteCode, "11350287");
  assert.equal(by.htx.inviteCode, "nexu888");
  assert.equal(by.coinw.inviteCode, "2296057");
  for (const p of f.partners) {
    assert.match(p.registrationUrl, new RegExp(`^https://nexualpha\\.com/go/${p.slug}\\?src=tg-partners-feed$`));
    assert.doesNotMatch(String(p.inviteCode), /^NEXU_/);
  }
  assert.doesNotMatch(
    JSON.stringify(f.partners.map((p) => p.registrationUrl)),
    /(accounts\.binance\.com|binance\.com\/join|bsmkweb\.cc|partner\.bitget|bitget\.com\/expressly|okx\.com\/join|topzhjdgxcb\.net|backpack\.exchange\/join)/i,
    "Telegram partner feed exposes only tracked NexuAlpha /go links",
  );
  assert.ok(!by.kucoin && !by.deribit && !by.gmx, "placeholder-code venues are not offered");
  assert.equal(f.maxSharePct, 60);
});

test("active referral venue rows stay aligned to the protected partner registry", () => {
  for (const [slug, partner] of Object.entries(partnerRegistry)) {
    const venue = venueDatabase[slug];
    assert.ok(venue, `${slug} exists in venue database`);
    const cta = publicCtaForVenue(slug, "en");
    if (!partner.hasReferral || cta.actionGate || !cta.routeAvailable) continue;
    assert.equal(venue.inviteCode ?? null, partner.inviteCode ?? null, `${slug} invite code`);
    assert.equal(venue.registrationUrl ?? null, partner.registrationUrl ?? null, `${slug} registration URL`);
    assert.equal(venue.officialDomain ?? null, partner.officialDomain ?? null, `${slug} official domain`);
  }
});
