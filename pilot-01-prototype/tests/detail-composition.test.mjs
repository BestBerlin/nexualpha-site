import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/components/v3/V3Pages.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/components/v3/v3.css", import.meta.url), "utf8");
const research = await readFile(new URL("../src/components/v3/ResearchPanels.jsx", import.meta.url), "utf8");
const registrationCard = await readFile(new URL("../src/components/v3/RegistrationCard.jsx", import.meta.url), "utf8");
const premiumCss = await readFile(new URL("../src/styles/fintech-premium.css", import.meta.url), "utf8");
const feeMatrixSource = source.slice(
  source.indexOf("function VenueTieredFeeMatrix"),
  source.indexOf("// --------------------------------------------------------------------------\n// 模块 B")
);
const dexCompactDictionary = source.slice(
  source.indexOf("const dexFeeCompactUiByLocale = {"),
  source.indexOf("const dexFeeCompactUi =")
);

test("profile separates locale prose from the preserved platform identity", () => {
  assert.match(source, /className="v3-venue-context"/);
  assert.match(source, /className="v3-venue-identity">\s*<BrandMark/);
  assert.doesNotMatch(source, /className="v3-venue-identity" translate="no" lang="en" dir="ltr"/);
  assert.match(css, /\.v3-venue-identity\s*\{[^}]*align-items:\s*center/s);
  assert.match(source, /className="v3-venue-title__suffix"/);
  assert.match(css, /\.v3-venue-title__suffix\s*\{[^}]*display:\s*inline-block/s);
  assert.doesNotMatch(css, /\.v3-venue-hero h1\s*\{\s*font-size:\s*36px/);
});

test("profile alternatives are informative rows with individual comparison links", () => {
  assert.match(source, /className="v3-alternative-list"/);
  assert.match(source, /className="v3-alternative__summary"/);
  assert.match(source, /compareSlug\(\[profile.slug, candidate.slug\]\)/);
});

test("missing approved activity does not allocate a promotional empty panel", () => {
  assert.match(source, /v3-activity-panel--empty/);
  assert.match(source, /v3-activity-empty/);
  assert.doesNotMatch(source, /VenueRewardSummary/);
});

test("shared secondary headings and domain labels use one readable axis", () => {
  assert.match(css, /--section-lead-areas:\s*"eyebrow" "title" "summary"/);
  assert.match(css, /\.v3-decision-brief dl div\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
  assert.match(css, /\.v3-venue-hero\s*\{[^}]*min-width:\s*0/s);
});

test("research dates are localized and full source labels remain accessible", () => {
  assert.match(research, /Intl\.DateTimeFormat\(locale/);
  assert.match(research, /dateTime=\{research.checkedAt\}/);
  assert.match(research, /aria-label=\{`\$\{text\[2\]\}: \$\{fact.label\}`\}/);
});

test("DEX mechanism cards and CEX sourced fee summaries keep distinct presentations", () => {
  assert.match(feeMatrixSource, /const isCexVenue = venueCategory === "cex"/);
  assert.match(feeMatrixSource, /if \(!isCexVenue\) \{[\s\S]*className="v3-fee-matrix-card v3-dex-fee-compact"/);
  assert.match(feeMatrixSource, /data-venue-fee-model=\{isPerpDex \? "perp-dex" : "dex"\}/);
  assert.match(feeMatrixSource, /const compactUi = dexFeeCompactUi\(locale, localizedVenueName, isPerpDex\)/);
  assert.match(feeMatrixSource, /const sourceUrl = db\.officialVerifyUrl \|\| db\.registrationUrl \|\| null/);
  assert.match(feeMatrixSource, /const safeRegistrationUrl = typeof registrationUrl === "string" && registrationUrl\.length \? registrationUrl : null/);
  assert.match(feeMatrixSource, /\{sourceUrl && \(/);
  assert.match(feeMatrixSource, /safeRegistrationUrl \? \(/);
  assert.match(feeMatrixSource, /className="v3-fee-lock-btn v3-fee-lock-btn--disabled"/);
  assert.match(feeMatrixSource, /className="v3-dex-fee-compact__research"/);
  assert.match(feeMatrixSource, /data-cta-placement=\{action\.placement\}/);
  assert.match(feeMatrixSource, /className="v3-fee-table"/);
  assert.doesNotMatch(feeMatrixSource, /VIP 9|makerMultiplier|takerMultiplier/);
  assert.match(feeMatrixSource, /data-venue-fee-model="sourced-base-fees"/);
  assert.match(css, /\.v3-dex-fee-compact__grid\s*\{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
  assert.match(css, /\.v3-dex-fee-compact__research\s*\{[\s\S]*display: flex;/);
  assert.match(css, /\.v3-fee-lock-btn--disabled,[\s\S]*?cursor: not-allowed;/);
  assert.match(css, /@media \(max-width: 640px\) \{[\s\S]*\.v3-dex-fee-compact__grid\s*\{[\s\S]*grid-template-columns: 1fr;/);
});

test("non-CEX details add comparison and Telegram research paths without changing registration links", () => {
  assert.match(source, /const nonCexResearchActions = String\(profile\.category \|\| venue\.category \|\| ""\)\.toUpperCase\(\) === "CEX" \? \[\] : \[/);
  assert.match(source, /href: `\/compare\/\$\{compareSlug\(\[profile\.slug, similar\[0\]\.slug\]\)\}\?\$\{contextSearch\}`/);
  assert.match(source, /getTelegramDeepLink\(\{ action: "verify_domain", venue: venue\.slug, market, locale, product \}\)/);
  assert.match(source, /researchActions=\{nonCexResearchActions\}/);
});

test("mobile sticky identity labels do not present non-partner domains as invite codes", () => {
  assert.match(source, /const mobileStickyIdentityLabel = hasReferral/);
  assert.match(source, /runtimeUi\.stickyOfficial/);
  assert.match(source, /const mobileStickyIdentityAction = hasReferral/);
  assert.match(source, /runtimeUi\.globalVerification/);
  assert.match(source, /<span className="v3-mobile-sticky-bar__label">\{mobileStickyIdentityLabel\}<\/span>/);
  assert.match(source, /<small>\{mobileStickyIdentityAction\}<\/small>/);
});

test("DEX compact copy is localized for every supported UI locale", () => {
  const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"];
  for (const locale of locales) {
    const keyPattern = locale.includes("-") ? `"${locale}"` : locale;
    const localeBlock = new RegExp(`${keyPattern}: \\[[^\\n]+\\]`, "m");
    assert.match(dexCompactDictionary, localeBlock, `${locale} compact locale block`);
  }
  assert.match(source, /dexFeeCompactUiByLocale\[locale\] \|\| dexFeeCompactUiByLocale\[key\] \|\| dexFeeCompactUiByLocale\.en/);
  assert.match(source, /tag: isPerpDex \? ui\[1\] : ui\[0\]/);
  assert.match(source, /unavailable: ui\[13\]/);
});

test("venue route and evidence labels reuse the localized detail and DEX dictionaries", () => {
  assert.match(source, /const routeUi = dexFeeCompactUi\(locale, localizedVenueName, false\)/);
  assert.match(source, /<span className="v3-rebate-tag">\{detailLabels\.review\}<\/span>/);
  assert.match(source, /<p className="v3-rebate-no-code">\{routeUi\.noCode\}<\/p>/);
  assert.match(source, /<span>\{detailLabels\.deeper\}<\/span>/);
});

test("venue detail consolidates repeated cost modules without hiding them from SSR", () => {
  const detail = source.slice(
    source.indexOf("export function VenueDetailPage"),
    source.indexOf("export function CompareDeepPage")
  );
  assert.equal((detail.match(/className="v3-profile-cost-conditions"/g) || []).length, 1);
  assert.doesNotMatch(detail, /className="v3-venue-metrics-disclosure"/);
  assert.doesNotMatch(detail, /className="v3-detail-calculator-disclosure"/);
  assert.doesNotMatch(premiumCss, /\.v3-venue-metrics-disclosure|\.v3-detail-calculator-disclosure/);
  assert.match(detail, /className="v3-profile-cost-conditions__body"[\s\S]*className="v3-venue-metrics-grid"[\s\S]*className="v3-detail-calculator"[\s\S]*<VenueTieredFeeMatrix/);
  assert.match(detail, /className="v3-venue-rebate-card"[\s\S]*className="v3-profile-cost-conditions"/);
});

test("venue detail moves protected invite and registration action into the hero decision area", () => {
  const detail = source.slice(
    source.indexOf("export function VenueDetailPage"),
    source.indexOf("export function CompareDeepPage")
  );
  const quickIndex = detail.indexOf('className="v3-venue-quick-registration"');
  const directAnswerIndex = detail.indexOf('className="v3-venue-direct-answer"');
  const costIndex = detail.indexOf('className="v3-profile-cost-conditions"');
  const fullCardIndex = detail.indexOf('id="registration-checklist"');
  assert.ok(quickIndex > 0, "quick registration strip exists in detail hero");
  assert.ok(quickIndex < directAnswerIndex, "quick registration strip appears before the long direct answer");
  assert.ok(quickIndex < costIndex, "quick registration strip appears before cost/research disclosure");
  assert.ok(quickIndex < fullCardIndex, "quick registration strip appears before full registration card");
  assert.match(detail, /href=\{`\/exchanges\/\$\{profile\.slug\}\?\$\{contextSearch\}#registration-path`\}/);
  assert.match(detail, /data-registration-confirmation-entry="registration-card"/);
  assert.match(detail, /detailRegistrationReviewLabel\(locale, \{ hasReferral \}\)/);
  assert.match(detail, /\{registrationReviewLabel\}/);
  assert.doesNotMatch(detail, /前往官网注册|前往官網註冊|Register on Official Site/);
  assert.doesNotMatch(detail, /href=\{venueCta\.ctaHref\}/);
  assert.doesNotMatch(detail, /rel=\{venueCta\.direct \? "sponsored noopener noreferrer" : undefined\}/);
  assert.match(detail, /data-cta-placement="venue-hero-quick-registration"/);
  assert.match(css, /\.v3-venue-quick-registration\s*\{/);
});

test("Hyperliquid and Uniswap direct answers cover on-chain cost and production-boundary queries", () => {
  const directAnswerBlock = source.slice(
    source.indexOf("const venueDirectAnswerOverrides = {"),
    source.indexOf("const detailCtaLabel =")
  );

  assert.match(directAnswerBlock, /Hyperliquid fees are a stack: rolling maker\/taker tier, referral discount, hourly funding, collateral route, liquidation rule and wallet permission/);
  assert.match(directAnswerBlock, /round-trip trading fees ± hourly funding \+ spread\/slippage \+ collateral transfer and exit cost/);
  assert.match(directAnswerBlock, /Official sources reviewed September 15, 2026/);
  assert.match(directAnswerBlock, /master wallet, sub-account or API wallet/);
  assert.match(directAnswerBlock, /does not promise Hyperliquid cashback, a funded account, third-party capital allocation/);
  assert.match(directAnswerBlock, /\/topics\/derivatives#perp-cost-field-dictionary/);
  assert.match(directAnswerBlock, /\/news\/hyperliquid-vs-dydx/);
  assert.match(directAnswerBlock, /Uniswap testnet and mainnet checks start with the official app, docs, token contract, approval and wallet preview/);
  assert.match(directAnswerBlock, /official app domain and docs, selected network, token contract, pool or route, v4 deployment mapping/);
  assert.match(directAnswerBlock, /Permit2 or approval spender, gas asset, quoted output and final wallet transaction preview/);
  assert.doesNotMatch(directAnswerBlock, /guaranteed discount|signup reward|private commission|invite code|referral link/i);
});

test("venue detail high-intent controls cannot render English fallbacks for supported locales", () => {
  assert.match(source, /const detailRuntimeUi = \(locale, text, venueName\) => \(\{/);
  assert.match(source, /calculatorOpen: text\.comparisonMatrix/);
  assert.match(source, /calculatorPending: text\.ctaLocked/);
  for (const token of [
    "runtimeUi.calculatorOpen",
    "runtimeUi.calculatorTitle(localizedVenueName)",
    "runtimeUi.monthlyVolume",
    "runtimeUi.volumeSlider",
    "runtimeUi.calculatorBenefit(inviteCode)",
    "runtimeUi.calculatorPending",
    "runtimeUi.similarOpen",
    "runtimeUi.showFewer",
    "runtimeUi.showMore(similar.length - 2)",
    "runtimeUi.stickyQuickAction",
    "runtimeUi.stickyOfficial",
    "runtimeUi.stickyFeeBenefit",
    "runtimeUi.stickyDirectRoute",
  ]) {
    assert.ok(source.includes(token), `${token} must be used by the venue detail page`);
  }
});

test("registration handoff owns localized route, region, disclosure and context copy", () => {
  assert.match(registrationCard, /import \{ v3Copy \} from "\.\.\/\.\.\/data\/v3-product\.js"/);
  assert.match(registrationCard, /function registrationRuntimeCopy\(locale, baseCopy\)/);
  assert.match(registrationCard, /const text = v3Copy\(locale\)/);
  assert.match(registrationCard, /routeState: inheritedEnglish\("routeState"\) \? text\.partnerState : baseCopy\.routeState/);
  for (const token of [
    "copy.productSpot",
    "copy.productChoose",
    "copy.regionalContext?.(context.label, productLabel)",
    "copy.stateListLabel",
    "copy.disclosureSummary",
  ]) {
    assert.ok(registrationCard.includes(token), `${token} must drive RegistrationCard localized UI`);
  }
  assert.doesNotMatch(registrationCard, /aria-label=\{locale\.startsWith\("zh"\) \? "合作入口、优惠和地区状态" : "Partner route, benefit and regional states"\}/);
});
