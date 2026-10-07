import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { publicCtaForVenue } from "../src/data/public-cta.js";
import { regionalVenueCta } from "../src/data/regional-cta.js";

const registrationCard = await readFile(new URL("../src/components/v3/RegistrationCard.jsx", import.meta.url), "utf8");
const detailPage = await readFile(new URL("../src/components/v3/V3Pages.jsx", import.meta.url), "utf8");
const partnerRegistrySource = await readFile(new URL("../src/data/partner-registry.js", import.meta.url), "utf8");

const protectedPartners = {
  binance: ["https://www.bsmkweb.cc/join?ref=11350287&utm_medium=web_share_copy", "11350287"],
  bitget: ["https://partner.bitget.cafe/bg/C6PRAF", "nexu888"],
  okx: ["https://www.okx.com/join/nexu888", "nexu888"],
  backpack: ["https://backpack.exchange/join/luckybitcoin", "luckybitcoin"],
};

test("non-partner venues keep official routes as source links, not referral registrations", () => {
  const officialRoutes = {
    aerodrome: "https://aerodrome.finance",
    coinbase: "https://www.coinbase.com/signup",
    uniswap: "https://app.uniswap.org",
    jupiter: "https://jup.ag",
    dydx: "https://dydx.trade",
  };

  for (const [slug, expectedUrl] of Object.entries(officialRoutes)) {
    const publicCta = publicCtaForVenue(slug, "en");
    const regionalCta = regionalVenueCta(slug, "en");

    assert.equal(publicCta.registrationUrl, expectedUrl, `${slug} official route`);
    assert.equal(publicCta.hasReferral, false, `${slug} must not claim referral`);
    assert.equal(publicCta.hasPartnerRoute, false, `${slug} must not claim partner route`);
    assert.equal(publicCta.inviteCode, null, `${slug} must not expose a code`);
    assert.equal(regionalCta.direct, false, `${slug} must not be a direct conversion handoff`);
    assert.match(regionalCta.ctaHref, new RegExp(`/exchanges/${slug}`), `${slug} research fallback`);
    assert.match(regionalCta.ctaHref, /#registration-path$/, `${slug} anchors to the decision card`);
  }
});

test("RegistrationCard exposes a non-sponsored official fallback plus comparison and Telegram research actions", () => {
  assert.match(registrationCard, /const officialRouteUrl = !publicCta\.hasPartnerRoute/);
  assert.match(registrationCard, /data-cta-kind="source"/);
  assert.match(registrationCard, /data-cta-placement="registration-card-official-route"/);
  assert.match(registrationCard, /rel="noopener noreferrer"/);
  assert.doesNotMatch(registrationCard, /registration-card-official-route"[\s\S]{0,160}rel="sponsored noopener noreferrer"/);
  assert.match(registrationCard, /data-cta-kind="research" data-cta-placement="registration-card-compare"/);
  assert.match(registrationCard, /data-cta-kind="telegram" data-cta-placement="registration-card-telegram-research"/);
});

test("venue hero and mobile sticky CTA classify non-direct routes as research", () => {
  assert.match(detailPage, /data-cta-kind="research"[\s\S]{0,180}data-cta-placement="venue-hero-quick-registration"/);
  assert.match(detailPage, /data-cta-kind="research"[\s\S]{0,180}data-cta-placement="venue-mobile-sticky"/);
});

test("protected partner invitation routes remain unchanged", () => {
  for (const [slug, [expectedUrl, expectedCode]] of Object.entries(protectedPartners)) {
    const publicCta = publicCtaForVenue(slug, "en");
    assert.equal(publicCta.registrationUrl, expectedUrl, `${slug} protected URL`);
    assert.equal(publicCta.inviteCode, expectedCode, `${slug} protected code`);
    assert.equal(publicCta.hasPartnerRoute, true, `${slug} remains direct partner route`);
  }

  const registryHash = createHash("sha256").update(partnerRegistrySource).digest("hex");
  assert.equal(registryHash, "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a");
});
