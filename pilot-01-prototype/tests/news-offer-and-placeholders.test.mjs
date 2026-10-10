// 2026-10-10: placeholder invite codes never reach a CTA; news offers only use real invite routes.
import test from "node:test";
import assert from "node:assert/strict";
import { publicCtaForVenue, PLACEHOLDER_INVITE_CODE } from "../src/data/source-bound-cta.js";
import { pickNewsOfferVenue } from "../src/data/news-offer.js";

test("placeholder codes (NEXU_*) are not offered as invite codes", () => {
  for (const slug of ["kucoin", "deribit", "gmx"]) {
    const cta = publicCtaForVenue(slug, "zh-Hans");
    assert.equal(cta.hasReferral, false, slug);
    assert.equal(cta.inviteCode, null, slug);
    assert.equal(cta.registrationUrl, null, slug);
  }
  assert.ok(PLACEHOLDER_INVITE_CODE.test("NEXU_KUCOIN"));
  assert.ok(!PLACEHOLDER_INVITE_CODE.test("nexu888") && !PLACEHOLDER_INVITE_CODE.test("NEXU888"));
});

test("owner invite routes are untouched", () => {
  assert.equal(publicCtaForVenue("okx").inviteCode, "nexu888");
  assert.equal(publicCtaForVenue("binance").inviteCode, "11350287");
  assert.match(publicCtaForVenue("bitget").registrationUrl, /C6PRAF/);
});

test("news offer picks the first mentioned venue with a real invite route", () => {
  assert.equal(pickNewsOfferVenue(["kucoin", "okx"]).slug, "okx");
  assert.equal(pickNewsOfferVenue(["kucoin", "deribit"]), null);
  assert.equal(pickNewsOfferVenue(undefined), null);
});
