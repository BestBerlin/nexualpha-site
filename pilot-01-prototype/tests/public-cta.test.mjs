import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { publicCtaForVenue, publicCtaForTopicPlatform } from "../src/data/public-cta.js";

test("public CTA keeps official destination but hides unverified partner economics", () => {
  const cta = publicCtaForVenue("binance", "en");
  // owner instruction 2026-10-10: official binance.com route is primary
  assert.equal(cta.registrationUrl, "https://www.binance.com?ref=11350287");
  assert.deepEqual(cta.registrationUrls, [
    "https://www.binance.com?ref=11350287",
    "https://www.binance.com/join?ref=11350287",
    "https://accounts.binance.com/register?ref=11350287",
    "https://www.bsmkweb.cc/join?ref=11350287&utm_medium=web_share_copy",
    "https://www.bsmkweb.cc/join?ref=11350287",
  ]);
  assert.equal(cta.hasPartnerRoute, true);
  assert.equal(cta.routeAvailable, true);
  assert.equal(cta.benefitVerified, false);
  assert.equal(cta.rebatePercent, 0);
  assert.equal(cta.inviteCode, "11350287");
  assert.match(cta.benefit, /official Binance account/i);
});

test("public CTA preserves Bitget attribution parameters on the signup route", () => {
  const cta = publicCtaForVenue("bitget", "en");
  assert.equal(cta.registrationUrl, "https://partner.bitget.cafe/bg/C6PRAF");
  assert.equal(cta.registrationUrls.length, 8);
  assert.ok(cta.registrationUrls.includes("https://partner.bitget.com/bg/zc8pmupf"));
  assert.ok(cta.registrationUrls.includes("https://www.bitget.com/expressly?channelCode=nexu888&vipCode=nexu888"));
  assert.equal(cta.hasPartnerRoute, true);
  assert.equal(cta.inviteCode, "nexu888");
});

test("public CTA exposes configured invite codes without verifying private benefit economics", () => {
  const expected = {
    binance: ["https://www.binance.com?ref=11350287", "11350287"],
    bitget: ["https://partner.bitget.cafe/bg/C6PRAF", "nexu888"],
    okx: ["https://www.okx.com/join/nexu888", "nexu888"],
    backpack: ["https://backpack.exchange/join/luckybitcoin", "luckybitcoin"],
  };

  for (const [slug, [registrationUrl, inviteCode]] of Object.entries(expected)) {
    const cta = publicCtaForVenue(slug, "en");
    assert.equal(cta.registrationUrl, registrationUrl, `${slug} primary route`);
    assert.equal(cta.inviteCode, inviteCode, `${slug} invite code`);
    assert.equal(cta.hasPartnerRoute, true, `${slug} partner route`);
    assert.equal(cta.benefitVerified, false, `${slug} benefit verification`);
    assert.equal(cta.rebatePercent, 0, `${slug} public rebate`);
  }
});

test("public CTA pairs the displayed code with the primary registration route", () => {
  const okx = publicCtaForVenue("okx", "en");
  assert.equal(okx.registrationUrl, "https://www.okx.com/join/nexu888");
  assert.equal(okx.inviteCode, "nexu888");
  assert.equal(okx.configuredInviteCode, "nexu888");
  assert.ok(okx.registrationUrls.includes("https://www.topzhjdgxcb.net/join/CANDY007"));

  const bitget = publicCtaForVenue("bitget", "en");
  assert.equal(bitget.registrationUrl, "https://partner.bitget.cafe/bg/C6PRAF");
  assert.equal(bitget.inviteCode, "nexu888");
  assert.equal(bitget.configuredInviteCode, "nexu888");
});

test("unregistered HashKey and Aevo records do not expose fallback invite codes", () => {
  for (const [slug, registrationUrl] of Object.entries({
    hashkey: "https://global.hashkey.com",
    aevo: "https://app.aevo.xyz",
  })) {
    const cta = publicCtaForVenue(slug, "en");
    assert.equal(cta.registrationUrl, registrationUrl, `${slug} official route`);
    assert.equal(cta.inviteCode, null, `${slug} visible invite code`);
    assert.equal(cta.configuredInviteCode, null, `${slug} configured invite code`);
    assert.equal(cta.hasReferral, false, `${slug} referral flag`);
    assert.equal(cta.hasPartnerRoute, false, `${slug} partner route`);
    assert.equal(cta.routeAvailable, false, `${slug} route availability`);
  }
});

test("worker factbook venue snapshot does not ship HashKey or Aevo NEXUALPHA codes", () => {
  const worker = readFileSync(new URL("../worker/index.js", import.meta.url), "utf8");
  for (const slug of ["hashkey", "aevo"]) {
    const start = worker.indexOf(`  ${slug}: {`);
    assert.notEqual(start, -1, `${slug} worker venue record`);
    const end = worker.indexOf("\n  },", start);
    assert.notEqual(end, -1, `${slug} worker venue record end`);
    const record = worker.slice(start, end);
    assert.doesNotMatch(record, /NEXUALPHA/, `${slug} worker record must not expose NEXUALPHA`);
    assert.match(record, /inviteCode: null/, `${slug} worker invite code`);
  }
});

test("topic CTA projection keeps partner route separate from unverified benefit economics", () => {
  const platform = publicCtaForTopicPlatform({
    slug: "binance",
    affiliateUrl: "https://example.invalid",
    inviteCode: "legacy-code",
    rebate: 20,
    bonus: "$100",
  }, "en");
  assert.equal(platform.affiliateUrl, "https://www.binance.com?ref=11350287");
  assert.equal(platform.hasPartnerRoute, true);
  assert.equal(platform.benefitVerified, false);
  assert.equal(platform.inviteCode, "11350287");
  assert.equal(platform.rebate, 0);
  assert.equal(platform.bonus, null);
  assert.equal(platform.hasReferral, true);
});
