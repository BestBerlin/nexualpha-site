import { isStrikingDistanceVenueTitle, strikingDistanceVenueTitle } from '../src/data/striking-distance-venue-copy.js';
// CTR pass 2026-10-13: titles/descriptions for pages in the top 15 with no clicks, the registration intent bridge on
// news tutorials, and the query-owner links for split queries.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nativeReferralFor, isNativeReferralTitle } from "../src/data/referral-native.js";
import { referralSeoFor } from "../src/data/referral-seo.js";
import { REFERRAL_PARTNERS } from "../src/data/referral-partners.generated.js";
import { SERP_CTR_NEWS_OVERRIDES, serpCtrNewsOverride } from "../src/data/serp-ctr-news-overrides.js";
import { factbookProfileAnchor, newsQueryOwnerLink, newsSignupBridge, registrationVenueForArticle } from "../src/data/news-lead-links.js";
import { organizationDescription } from "../src/data/brand-definition.js";
import { HOME_SEARCH_COPY } from "../src/data/home-search-copy.js";
import { NEWS_HUB_SEO_EN } from "../src/data/news-list-copy.js";
import { NEWS_CANONICAL_TARGETS } from "../src/data/news-search-state.generated.js";
import { routeMetadata } from "../worker/index.js";
import { NEUTRAL_CTA_LOCALE_LIST } from "../src/data/locale-policy.js";
import { metaDescriptionLimit } from "../src/data/meta-description.js";

const PROMOTABLE = ["en", "zh-Hans", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "tr", "id"];
const NEUTRAL = [...NEUTRAL_CTA_LOCALE_LIST];
const budget = (locale) => (/^(zh|ja|ko)/.test(locale) ? 32 : 60);
const env = { ASSETS: { fetch: async () => new Response("missing", { status: 404 }) } };
const HYPE = /\b(best ever|guaranteed?|risk-free|100% safe|moon)\b/i;

test("partner profile titles answer the sign-up query within the title budget", () => {
  for (const partner of REFERRAL_PARTNERS.filter((p) => p.inviteCode)) {
    for (const locale of PROMOTABLE) {
      const seo = referralSeoFor(partner.slug, locale);
      if (!seo) continue;
      assert.ok(isNativeReferralTitle(seo.title, locale) || isStrikingDistanceVenueTitle(seo.title, locale) || seo.title.length <= budget(locale), `${partner.slug}/${locale} title ${seo.title.length}: ${seo.title}`);
      assert.ok(seo.description.length <= metaDescriptionLimit(locale), `${partner.slug}/${locale} description ${seo.description.length}`);
      assert.doesNotMatch(seo.description, /Partner link|Enlace de socio|Link de parceiro|Partnerlink|Lien partenaire|Ortaklık bağlantısı|Tautan mitra/i, `${partner.slug}/${locale} carries no fine print`);
      assert.doesNotMatch(`${seo.title} ${seo.description}`, HYPE);
    }
  }
  assert.equal(referralSeoFor("bitget", "en").title, nativeReferralFor("bitget", "en").title);
  assert.equal(referralSeoFor("okx", "en").title, nativeReferralFor("okx", "en").title);
  assert.match(referralSeoFor("okx", "en").description, /[Uu]p to 40% of fees back/);
  assert.equal(referralSeoFor("okx", "zh-Hans").title, nativeReferralFor("okx", "zh-Hans").title);
  assert.equal(referralSeoFor("okx", "tr").title, nativeReferralFor("okx", "tr").title);
  assert.equal(referralSeoFor("okx", "id").title, nativeReferralFor("okx", "id").title);
  assert.equal(referralSeoFor("bybit", "es").title, nativeReferralFor("bybit", "es").title);
  // Hyperliquid is a wallet venue: no KYC wording.
  for (const locale of PROMOTABLE) assert.doesNotMatch(referralSeoFor("hyperliquid", locale)?.description || "", /KYC/, locale);
});

test("neutral locales (ru, ar, zh-Hant, ur, uk, vi) get no codes or sign-up titles", () => {
  for (const partner of REFERRAL_PARTNERS) {
    for (const locale of NEUTRAL) assert.equal(referralSeoFor(partner.slug, locale), null, `${partner.slug}/${locale}`);
  }
});

test("news SERP overrides stay within 60/155 characters and only apply to their edition", () => {
  for (const [slug, entry] of Object.entries(SERP_CTR_NEWS_OVERRIDES)) {
    if (slug === "tokenized-treasuries-structure-access-risks") continue; // pre-existing copy, owned by r102 tests
    assert.ok(entry.title.length <= 60, `${slug} title ${entry.title.length}`);
    assert.ok(entry.description.length >= 110 && entry.description.length <= 155, `${slug} description ${entry.description.length}`);
    assert.doesNotMatch(`${entry.title} ${entry.description}`, HYPE);
    for (const [locale, localized] of Object.entries(entry.locales || {})) {
      assert.ok(localized.title.length <= budget(locale), `${slug}/${locale} title`);
      assert.ok(localized.description.length >= 110 && localized.description.length <= 160, `${slug}/${locale} description`);
    }
  }
  assert.equal(serpCtrNewsOverride("hyperliquid-vs-dydx", "zh-Hans"), null);
  assert.match(serpCtrNewsOverride("how-to-use-jupiter-connect-wallet-and-make-first-swap-safely", "zh-Hans").title, /^Jupiter 怎么用/);
  assert.equal(serpCtrNewsOverride("no-such-slug", "en"), null);
});

test("registration tutorials open with a link to the exchange profile (and app page)", () => {
  const hasVenue = (slug) => ["okx", "bybit", "bitget", "gate-io", "kucoin", "coinbase", "hyperliquid"].includes(slug);
  const venueName = (slug) => ({ okx: "OKX", bybit: "Bybit", bitget: "Bitget", "gate-io": "Gate.io", kucoin: "KuCoin", coinbase: "Coinbase", hyperliquid: "Hyperliquid" })[slug];
  assert.equal(registrationVenueForArticle("how-to-register-okx-account-verify-identity-safely", hasVenue), "okx");
  assert.equal(registrationVenueForArticle("how-to-register-gate-account-complete-identity-verification-and-secure-access", hasVenue), "gate-io");
  assert.equal(registrationVenueForArticle("how-to-create-coinbase-advanced-trade-api-key-with-portfolio-scope-safely", hasVenue), null);
  assert.equal(registrationVenueForArticle("how-to-create-gemini-account-verify-identity-and-set-withdrawal-protection", hasVenue), null, "no profile page, no bridge");
  assert.equal(registrationVenueForArticle("okx-usd-to-usdc-spot-pair-migration", hasVenue), null);

  const en = newsSignupBridge({ articleSlug: "how-to-register-okx-account-verify-identity-safely", locale: "en", hasVenue, venueName });
  assert.equal(en.neutral, false);
  assert.deepEqual(en.links.map((link) => link.href), ["/exchanges/okx#registration-path", "/exchanges/okx/app"]);
  assert.match(en.links[0].label, /OKX sign-up guide: steps, KYC and code nexu888/);

  const zh = newsSignupBridge({ articleSlug: "how-to-register-bybit-account-complete-kyc-and-secure-first-login", locale: "zh-Hans", hasVenue, venueName });
  assert.match(zh.links[0].label, /Bybit 注册教程/);

  for (const locale of NEUTRAL) {
    const neutral = newsSignupBridge({ articleSlug: "how-to-register-okx-account-verify-identity-safely", locale, hasVenue, venueName });
    assert.equal(neutral.neutral, true, locale);
    assert.deepEqual(neutral.links.map((link) => link.href), ["/exchanges/okx"], locale);
    assert.doesNotMatch(neutral.links[0].label, /nexu888|sign-up|注册|đăng ký|регистра/i, locale);
  }
  // Turkey: Bitget is not promoted, so the bridge stays neutral.
  assert.equal(newsSignupBridge({ articleSlug: "how-to-register-bitget-account-complete-identity-verification", locale: "tr", hasVenue, venueName }).neutral, true);
  // Wallet venue: plain profile link.
  assert.equal(newsSignupBridge({ articleSlug: "hyperliquid-referral-code-2026-where-to-enter-4-percent-discount", locale: "en", hasVenue, venueName }).neutral, true);
});

test("split queries point at one owner", () => {
  assert.equal(newsQueryOwnerLink("okx-api-kyc-order-tagged-rate-limit-migration-checklist").href, "/news/okx-api-upcoming-changes-websocket-amend-cancel-order-controls");
  assert.equal(newsQueryOwnerLink("how-to-secure-a-kraken-account-passkeys-funding-2fa-verification").href, "/news/how-to-enable-kraken-trading-funding-2fa-global-settings-lock-safely");
  assert.equal(newsQueryOwnerLink("okx-usd-to-usdc-spot-pair-migration"), null);
  assert.match(factbookProfileAnchor("backpack", "fr"), /^Backpack Exchange : avis/);
  assert.equal(factbookProfileAnchor("backpack", "ru"), null);
  // Near-duplicates use rel=canonical (T10 list), not internal links.
  assert.equal(NEWS_CANONICAL_TARGETS["how-to-verify-binance-travel-rule-address-book-satoshi-test"], "binance-travel-rule-address-book-satoshi-test-checklist");
  const factbook = readFileSync(new URL("../src/components/v3/FactbookPage.jsx", import.meta.url), "utf8");
  assert.match(factbook, /factbookProfileAnchor\(venue\.slug, locale\) \|\| t\.openDecisionPath/);
});

test("app route heads carry the new English titles", async () => {
  const head = async (path) => routeMetadata(new URL(`https://nexualpha.com${path}`), env);
  assert.equal(HOME_SEARCH_COPY.en[0], "NexuAlpha — Crypto Fee Comparison, Rebates & Referral Codes (Official)");
  for (const [locale, [, description]] of Object.entries(HOME_SEARCH_COPY)) {
    assert.ok(description.length <= 160, `${locale} home description ${description.length}`);
    assert.ok(organizationDescription(locale).startsWith(description), `${locale}: preserved brand-entity description`);
  }
  assert.equal(NEWS_HUB_SEO_EN.title, "Crypto Exchange News: Binance, OKX, Bybit — NexuAlpha");
  assert.equal((await head("/exchanges")).title, "Crypto Exchange List 2026: Fees, KYC, Sign-Up — NexuAlpha");
  assert.equal((await head("/activities")).title, "Exchange Campaigns: Launchpool, Airdrops (2026) — NexuAlpha");
  assert.equal((await head("/methodology")).title, "How NexuAlpha Checks Exchange Fees and Codes — NexuAlpha");
  assert.equal((await head("/exchanges/deribit")).title, strikingDistanceVenueTitle("deribit", "en")); // SEO pass 2026-10-18
  assert.equal((await head("/exchanges/curve")).title, "Curve Finance (2026): Swap Fees, Pools and Wallet Checks");
  assert.equal((await head("/exchanges/okx")).title, nativeReferralFor("okx", "en").title);
  assert.equal((await head("/fr/exchanges/backpack")).title, `Backpack Exchange avis (${new Date().getUTCFullYear()}) : frais et code LuckyBitcoin`);
  assert.doesNotMatch((await head("/vi/exchanges/okx")).title, /nexu888|giới thiệu/);
});
