import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PARTNER_REGISTRATION_URLS, CUSTOM_INVITE_CODES } from "../src/data/partner-registry.js";
import { publicCtaForVenue } from "../src/data/source-bound-cta.js";

const partnerRegistrySource = await readFile(new URL("../src/data/partner-registry.js", import.meta.url), "utf8");
const expectedPartnerRegistrySha256 = "3a69b03020089ccb700370fcac011230635fe21d00a5cdae39d342284b78ef83";

// Intentional owner changes: Binance official primary (84b6426), Bitget domain migration (3ac4fbd8),
// and registry-cased Backpack code in source-bound-cta. Keep full URL cluster and source-hash protection.
const expected = {
  binance: [
    "https://www.binance.com?ref=11350287",
    "https://www.binance.com/join?ref=11350287",
    "https://accounts.binance.com/register?ref=11350287",
    "https://www.bsmkweb.cc/join?ref=11350287&utm_medium=web_share_copy",
    "https://www.bsmkweb.cc/join?ref=11350287",
  ],
  bitget: [
    "https://partner.bitget.com/bg/C6PRAF",
    "https://partner.bitget.com/bg/neh7w5h9",
    "https://partner.bitget.com/bg/7nfg94491669857692277",
    "https://partner.bitget.com/bg/7nfg8123",
    "https://partner.bitget.com/bg/7nfg70121688265185866",
    "https://partner.bitget.com/bg/7nfg38641689775663839",
    "https://partner.bitget.com/bg/zc8pmupf",
    "https://www.bitget.com/expressly?channelCode=nexu888&vipCode=nexu888",
  ],
  okx: [
    "https://www.okx.com/join/nexu888",
    "https://www.topzhjdgxcb.net/join/CANDY007",
    "https://www.topzhjdgxcb.net/join/NEXU888",
    "https://www.topzhjdgxcb.net/join/INS898",
    "https://www.topzhjdgxcb.net/join/1836370407",
    "https://www.topzhjdgxcb.net/join/QICYQ",
    "https://www.topzhjdgxcb.net/join/BL686",
  ],
  backpack: [
    "https://backpack.exchange/join/luckybitcoin",
    "https://backpack.exchange/refer/LuckyBitcoin",
  ],
};

const expectedInviteCodes = {
  binance: "11350287",
  bitget: "nexu888",
  okx: "nexu888",
  backpack: CUSTOM_INVITE_CODES.backpack,
};

test("constitutional invitation link clusters remain exact and complete", () => {
  for (const [slug, urls] of Object.entries(expected)) {
    const cta = publicCtaForVenue(slug);
    assert.deepEqual(PARTNER_REGISTRATION_URLS[slug], urls, slug);
    assert.deepEqual(cta.registrationUrls, urls, `${slug} public CTA`);
    assert.equal(cta.registrationUrl, urls[0], `${slug} primary route`);
    assert.equal(cta.inviteCode, expectedInviteCodes[slug], `${slug} invite code`);
    assert.equal(cta.hasPartnerRoute, true, `${slug} partner route`);
    assert.equal(cta.benefitVerified, false, `${slug} benefit remains unverified`);
  }
});

test("constitutional partner registry source hash remains unchanged", () => {
  const actual = createHash("sha256").update(partnerRegistrySource).digest("hex");

  assert.equal(actual, expectedPartnerRegistrySha256);
});
