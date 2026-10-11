import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  ISO_REGION_CODES,
  NO_HANDOFF_COUNTRY,
  buildHandoffPayload,
  buildOfferLookupPath,
  countryOptionsForLocale,
  createHandoffIdempotencyKey,
  offerIdentity,
  validateHandoffResponse,
  validateOfferPayload,
  validateSafeDestination,
} from "../src/components/v3/outbound-handoff-model.js";
import { handoffCopy, handoffLocales } from "../src/components/v3/outbound-handoff-copy.js";

const component = await readFile(new URL("../src/components/v3/RegistrationCard.jsx", import.meta.url), "utf8");
const registrationCardCss = await readFile(new URL("../src/components/v3/registration-card.css", import.meta.url), "utf8");
const componentCss = await readFile(new URL("../src/components/v3/outbound-handoff.css", import.meta.url), "utf8");
const v3Pages = await readFile(new URL("../src/components/v3/V3Pages.jsx", import.meta.url), "utf8");
// venue-graph lane 2026-10-11: the venue detail route lives in VenueDetailPage.jsx (+ VenueDetailResearch.jsx for the sources hub).
const venuePage = await readFile(new URL("../src/components/v3/VenueDetailPage.jsx", import.meta.url), "utf8");
const venueResearch = await readFile(new URL("../src/components/v3/VenueDetailResearch.jsx", import.meta.url), "utf8");
const venueDetailSource = `${venuePage.slice(venuePage.indexOf("export function VenueDetailPage"))}\n${venueResearch}`;

const offer = Object.freeze({
  offerId: "123e4567-e89b-42d3-a456-426614174111",
  venueSlug: "binance",
  officialHost: "www.binance.com",
  offerVersion: 1,
  disclosureText: "NexuAlpha only opens the official handoff after your explicit confirmation.",
  disclosureVersion: "disc-2026-09-05",
  country: "TW",
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
});

test("buildOfferLookupPath requires an explicit country declaration without locale inference", () => {
  assert.equal(NO_HANDOFF_COUNTRY, "");
  assert.throws(() => buildOfferLookupPath("binance"), /HANDOFF_COUNTRY_REQUIRED/);
  assert.equal(buildOfferLookupPath("binance", "TW"), "/api/v1/venues/binance/outbound-offer?country=TW");
  assert.equal(buildOfferLookupPath("hyper liquid", "TW"), "/api/v1/venues/hyper%20liquid/outbound-offer?country=TW");
});

test("countryOptionsForLocale exposes the ISO region set with localized labels and no initial default", () => {
  assert.ok(ISO_REGION_CODES.includes("TW"));
  assert.ok(ISO_REGION_CODES.includes("US"));
  assert.ok(ISO_REGION_CODES.length > 240);
  const options = countryOptionsForLocale("zh-Hant");

  assert.equal(options[0].code, "AF");
  assert.equal(options.some((option) => option.code === "TW" && option.label.includes("TW")), true);
  assert.equal(options.some((option) => option.code === ""), false);
});

test("buildHandoffPayload emits the exact POST contract keys", () => {
  const payload = buildHandoffPayload(offer, "123e4567-e89b-42d3-a456-426614174000");

  assert.deepEqual(Object.keys(payload), [
    "offerId",
    "offerVersion",
    "country",
    "disclosureVersion",
    "accepted",
    "idempotencyKey",
  ]);
  assert.deepEqual(payload, {
    offerId: "123e4567-e89b-42d3-a456-426614174111",
    offerVersion: 1,
    country: "TW",
    disclosureVersion: "disc-2026-09-05",
    accepted: true,
    idempotencyKey: "123e4567-e89b-42d3-a456-426614174000",
  });
});

test("validateOfferPayload requires the backend numeric offerVersion contract", () => {
  assert.equal(validateOfferPayload({ data: offer }, "binance", "TW").offerVersion, 1);
  assert.throws(() => validateOfferPayload({ data: { ...offer, offerVersion: "1" } }, "binance", "TW"), /HANDOFF_OFFER_INVALID/);
  assert.throws(() => validateOfferPayload({ data: { ...offer, offerId: "offer-binance-tw-v1" } }, "binance", "TW"), /HANDOFF_OFFER_INVALID/);
});

test("createHandoffIdempotencyKey falls back to getRandomValues when randomUUID is unavailable", () => {
  let offset = 0;
  const key = createHandoffIdempotencyKey({
    getRandomValues(bytes) {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = (offset + index) & 0xff;
      }
      offset += bytes.length;
      return bytes;
    },
  });

  assert.match(key, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("validateSafeDestination accepts only HTTPS URLs on the looked-up official host", () => {
  assert.equal(validateSafeDestination("https://www.binance.com/register?ref=review", "www.binance.com"), "https://www.binance.com/register?ref=review");
  assert.throws(() => validateSafeDestination("http://www.binance.com/register", "www.binance.com"), /HANDOFF_DESTINATION_UNSAFE/);
  assert.throws(() => validateSafeDestination("https://evil-www.binance.com/register", "www.binance.com"), /HANDOFF_DESTINATION_UNSAFE/);
  assert.throws(() => validateSafeDestination("https://www.binance.com.evil.test/register", "www.binance.com"), /HANDOFF_DESTINATION_UNSAFE/);
  assert.throws(() => validateSafeDestination("https://user:pass@www.binance.com/register", "www.binance.com"), /HANDOFF_DESTINATION_UNSAFE/);
  assert.throws(() => validateSafeDestination("https://www.binance.com:443/register", "www.binance.com"), /HANDOFF_DESTINATION_UNSAFE/);
  assert.throws(() => validateSafeDestination("https://www.binance.com/register#kyc", "www.binance.com"), /HANDOFF_DESTINATION_UNSAFE/);
  assert.throws(() => validateSafeDestination("https://www.binance.com/reg ister", "www.binance.com"), /HANDOFF_DESTINATION_UNSAFE/);
  assert.throws(() => validateSafeDestination("https://127.0.0.1/register", "127.0.0.1"), /HANDOFF_DESTINATION_UNSAFE/);
});

test("validateHandoffResponse rejects navigation claims that are not eligible no-navigation handoffs", () => {
  assert.equal(validateHandoffResponse({
    id: "123e4567-e89b-42d3-a456-426614174222",
    handoffRequested: true,
    disposition: "ELIGIBLE_NO_NAVIGATION",
    navigationRecorded: false,
    conversionRecorded: false,
    destination: "https://www.binance.com/register",
    officialHost: "www.binance.com",
    replayed: false,
  }).destination, "https://www.binance.com/register");

  assert.throws(() => validateHandoffResponse({
    id: "123e4567-e89b-42d3-a456-426614174222",
    handoffRequested: true,
    disposition: "NAVIGATION_RECORDED",
    navigationRecorded: true,
    conversionRecorded: false,
    destination: "https://www.binance.com/register",
    officialHost: "www.binance.com",
    replayed: false,
  }), /HANDOFF_RESPONSE_UNSAFE/);
});

test("offerIdentity changes when country or offer version changes so consent and retry keys reset", () => {
  const first = offerIdentity(offer);
  assert.notEqual(first, offerIdentity({ ...offer, country: "SG" }));
  assert.notEqual(first, offerIdentity({ ...offer, offerVersion: 2 }));
  assert.notEqual(first, offerIdentity({ ...offer, disclosureVersion: "disc-2026-09-06" }));
});

test("handoffCopy provides local strings for every supported selector locale", () => {
  assert.deepEqual(handoffLocales, ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"]);
  for (const locale of handoffLocales) {
    const copy = handoffCopy(locale);
    for (const key of ["title", "loading", "noOffer", "unavailable", "retry", "countryLabel", "chooseCountry", "chooseCountryHint", "consentLabel", "continue", "disclosurePrefix", "originalDisclosureNote", "destinationHost", "safetyError", "requestError", "staleError"]) {
      assert.equal(typeof copy[key], "string", `${locale}.${key}`);
      assert.ok(copy[key].trim().length > 0, `${locale}.${key}`);
    }
  }
});

test("RegistrationCard (OutboundHandoff) provides complete link, copyable code, anti-phishing domain and transparent disclosure", () => {
  assert.match(component, /getPartner\(venueSlug\)/);
  assert.match(component, /publicCtaForVenue/);
  assert.match(component, /visiblePartner\.officialDomain/);
  assert.match(component, /visiblePartner\.registrationUrl/);
  assert.match(component, /visiblePartner\.inviteCode/);
  assert.match(component, /Raw partner/);
  assert.match(component, /handleCopy/);
  assert.match(component, /copy\.disclosureTitle/);
  assert.match(component, /copy\.disclosureBody/);
  assert.match(component, /rel="sponsored noopener noreferrer"/);
  assert.match(component, /target="_blank"/);
  assert.match(component, /id="registration-path"/);
  assert.match(component, /dir="ltr"/);
  assert.match(component, /translate="no"/);
});

test("detail-page registration handoff supports a compact repeated decision point", () => {
  assert.match(component, /compact = false/);
  assert.match(component, /registration-card--compact/);
  assert.match(venuePage, /<OutboundHandoff compact/);
  assert.match(component, /registration-card__mobile-route-details/);
  assert.match(component, /setMobileRouteOpen\(!compact\)/);
  assert.doesNotMatch(component, /window\.matchMedia/);
  assert.match(component, /!compact && <>\{preflight\}\{primaryAction\}<\/>/);
  assert.match(registrationCardCss, /registration-card--compact \.registration-card__url-row/);
  assert.match(registrationCardCss, /registration-card--compact \.registration-card__mobile-route-details:not\(\[open\]\) \.registration-card__mobile-route-body/);
});

test("RegistrationCard mobile handoff copy can shrink and wrap across localized labels", () => {
  assert.match(registrationCardCss, /\.registration-card__domain-box \{[\s\S]*min-width: 0;/);
  assert.match(registrationCardCss, /\.registration-card__domain-badge b \{[\s\S]*overflow-wrap: anywhere;/);
  assert.match(registrationCardCss, /\.registration-card__preflight span \{[\s\S]*overflow-wrap: anywhere;/);
  assert.match(registrationCardCss, /\.registration-card__primary-btn \{[\s\S]*max-width: 100%;[\s\S]*overflow-wrap: anywhere;[\s\S]*white-space: normal;/);
  assert.match(registrationCardCss, /\.registration-card__mobile-route-summary span \{[\s\S]*min-width: 0;/);
  assert.match(registrationCardCss, /\.registration-card__mobile-route-summary small \{[\s\S]*overflow-wrap: anywhere;/);
});

test("OutboundHandoff keeps the detail card full width and uses scalable hit-area sizing", () => {
  assert.match(componentCss, /\.v3-detail-grid__handoff\s*\{\s*grid-column: 1 \/ -1;/);
  assert.match(componentCss, /min-height: 2\.75rem/);
  assert.match(componentCss, /font-size: \.875rem/);
  assert.doesNotMatch(componentCss, /font-size:\s*\d+px|min-height:\s*\d+px/);
});

test("VenueDetailPage mounts one registration-path handoff and removes static pending partner state", () => {
  const detail = venueDetailSource;

  assert.match(venuePage, /import \{ OutboundHandoff \} from "\.\/OutboundHandoff"/);
  assert.match(detail, /<OutboundHandoff/);
  assert.equal((detail.match(/id="registration-path"/g) || []).length, 0);
  assert.match(component, /id="registration-path"/);
  assert.doesNotMatch(detail, /text\.partnerState/);
  assert.doesNotMatch(detail, /text\.notConfigured/);
  assert.match(component, /registrationUrl: null/);
  assert.match(component, /registration-card__primary-btn--disabled/);
});
