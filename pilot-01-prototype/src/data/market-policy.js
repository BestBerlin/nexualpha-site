const MARKET_RE = /^(?:unknown|global|OTHER|[A-Z]{2}|EU|UK)$/;
const MARKET_ALPHA3_RE = /^[A-Z]{3}$/;

const LOCALE_BY_MARKET = {
  BR: "pt-BR",
  ID: "id",
  VN: "vi",
  MX: "es",
  TW: "zh-Hant",
  HK: "zh-Hant",
  OTHER: "en",
  EU: "en",
  UK: "en",
  JP: "ja",
  KR: "ko",
  SG: "en",
  TR: "tr",
  US: "en",
  GLOBAL: "en",
  GLOBAL_OTHER: "en",
  global: "en",
  unknown: "en",
};

const PRODUCT_BY_MARKET = {
  BR: "spot",
  ID: "unknown",
  VN: "unknown",
  MX: "unknown",
  TW: "unknown",
  HK: "unknown",
  OTHER: "unknown",
  EU: "unknown",
  UK: "unknown",
  JP: "spot",
  KR: "spot",
  SG: "spot",
  TR: "spot",
  US: "spot",
  global: "unknown",
  unknown: "unknown",
};

const PAYMENT_BY_MARKET = {
  BR: {
    applicable: true,
    modes: ["BRL", "Pix", "TED", "bank_transfer"],
    accountCurrency: ["BRL"],
    notes: ["Use platform-facing method visibility and deposit page context as final source."],
  },
  ID: {
    applicable: false,
    modes: ["IDR", "bank_virtual_account", "QRIS", "wallet", "crypto_onchain"],
    accountCurrency: ["IDR", "USDT"],
    notes: ["Use OJK/Bappebti context and the official account flow to verify IDR, VA bank, QRIS, wallet, fees, limits and deposit or withdrawal direction separately."],
  },
  VN: {
    applicable: false,
    modes: ["local_fiat", "bank_transfer", "wallet", "usdt_onchain"],
    accountCurrency: ["VND", "USDT"],
    notes: ["Keep Vietnam payment checks as research-only until official local-source coverage and account-screen evidence are reviewed."],
  },
  MX: {
    applicable: false,
    modes: ["MXN", "SPEI", "bank_transfer"],
    accountCurrency: ["MXN", "USDT"],
    notes: ["Verify the platform and local payment-account path before showing a market-specific CTA."],
  },
  TW: {
    applicable: false,
    modes: ["TWD", "personal_bank_transfer", "crypto_onchain"],
    accountCurrency: ["TWD", "USDT"],
    notes: ["Confirm the current FSC registration context, KYC and verified personal-bank-account name match in the official account flow; check TWD deposit and withdrawal separately."],
  },
  HK: {
    applicable: false,
    modes: ["bank_transfer", "crypto_onchain"],
    accountCurrency: ["HKD", "USDT"],
    notes: ["Deposit paths vary by account state and compliance policy."],
  },
  OTHER: {
    applicable: false,
    modes: ["global_fiat", "usdt_onchain", "card"],
    accountCurrency: ["USD"],
    notes: ["Use global directory and venue-specific onboarding defaults."],
  },
  EU: {
    applicable: false,
    modes: ["bank_transfer", "card", "sepa", "usdt_onchain"],
    accountCurrency: ["EUR", "USDT"],
    notes: ["Regional compliance and residency constraints are account-level and campaign-level."],
  },
  UK: {
    applicable: false,
    modes: ["bank_transfer", "card", "sepa", "usdt_onchain"],
    accountCurrency: ["GBP", "USDT"],
    notes: ["Use official venue terms for residency and offer availability."],
  },
  JP: {
    applicable: false,
    modes: ["JPY", "bank_transfer", "crypto_onchain"],
    accountCurrency: ["JPY", "USDT"],
    notes: ["Confirm the current JPY funding route and supported products in the official account flow."],
  },
  KR: {
    applicable: false,
    modes: ["KRW", "bank_transfer", "crypto_onchain"],
    accountCurrency: ["KRW", "USDT"],
    notes: ["Confirm the current KRW funding route and supported products in the official account flow."],
  },
  SG: {
    applicable: false,
    modes: ["SGD", "bank_transfer", "card", "crypto_onchain"],
    accountCurrency: ["SGD", "USD", "USDT"],
    notes: ["Confirm the current SGD funding route, service entity and supported products in the official account flow."],
  },
  TR: {
    applicable: false,
    modes: ["TRY", "bank_transfer", "crypto_onchain"],
    accountCurrency: ["TRY", "USDT"],
    notes: ["Use SPK context and the platform's official account flow to check TRY funding, identity and product scope."],
  },
  US: {
    applicable: false,
    modes: ["USD", "ACH", "wire", "crypto_onchain"],
    accountCurrency: ["USD", "USDT"],
    notes: ["Use official account screens and platform help pages to verify USD rails, state support, holds, bank-name match and product scope."],
  },
  global: {
    applicable: false,
    modes: ["global_fiat", "card", "usdt_onchain"],
    accountCurrency: ["USD", "USDT"],
    notes: ["Default to region policy when query params define region explicitly."],
  },
  unknown: {
    applicable: false,
    modes: ["unknown"],
    accountCurrency: [],
    notes: ["market and residency not set explicitly."],
  },
};

const ACCOUNT_STAGE_BY_MARKET = {
  BR: {
    requiresKyc: true,
    requiresResidenceMatch: true,
    campaignMayVaryByAccount: true,
    paymentGateKnown: true,
    offerDelivery: "post_account",
  },
  ID: {
    requiresKyc: true,
    requiresResidenceMatch: true,
    campaignMayVaryByAccount: true,
    paymentGateKnown: false,
    offerDelivery: "platform_dependent",
  },
  VN: {
    requiresKyc: true,
    requiresResidenceMatch: true,
    campaignMayVaryByAccount: true,
    paymentGateKnown: false,
    offerDelivery: "platform_dependent",
  },
  MX: {
    requiresKyc: true,
    requiresResidenceMatch: true,
    campaignMayVaryByAccount: true,
    paymentGateKnown: false,
    offerDelivery: "platform_dependent",
  },
  TW: {
    requiresKyc: true,
    requiresResidenceMatch: true,
    campaignMayVaryByAccount: true,
    paymentGateKnown: false,
    offerDelivery: "platform_dependent",
  },
  HK: {
    requiresKyc: true,
    requiresResidenceMatch: true,
    campaignMayVaryByAccount: true,
    paymentGateKnown: false,
    offerDelivery: "platform_dependent",
  },
  OTHER: {
    requiresKyc: true,
    requiresResidenceMatch: false,
    campaignMayVaryByAccount: true,
    paymentGateKnown: false,
    offerDelivery: "platform_dependent",
  },
  EU: {
    requiresKyc: true,
    requiresResidenceMatch: true,
    campaignMayVaryByAccount: true,
    paymentGateKnown: false,
    offerDelivery: "platform_dependent",
  },
  UK: {
    requiresKyc: true,
    requiresResidenceMatch: true,
    campaignMayVaryByAccount: true,
    paymentGateKnown: false,
    offerDelivery: "platform_dependent",
  },
  JP: {
    requiresKyc: true,
    requiresResidenceMatch: true,
    campaignMayVaryByAccount: true,
    paymentGateKnown: false,
    offerDelivery: "platform_dependent",
  },
  KR: {
    requiresKyc: true,
    requiresResidenceMatch: true,
    campaignMayVaryByAccount: true,
    paymentGateKnown: false,
    offerDelivery: "platform_dependent",
  },
  SG: {
    requiresKyc: true,
    requiresResidenceMatch: true,
    campaignMayVaryByAccount: true,
    paymentGateKnown: false,
    offerDelivery: "platform_dependent",
  },
  TR: {
    requiresKyc: true,
    requiresResidenceMatch: true,
    campaignMayVaryByAccount: true,
    paymentGateKnown: false,
    offerDelivery: "platform_dependent",
  },
  US: {
    requiresKyc: true,
    requiresResidenceMatch: true,
    campaignMayVaryByAccount: true,
    paymentGateKnown: false,
    offerDelivery: "platform_dependent",
  },
  global: {
    requiresKyc: true,
    requiresResidenceMatch: false,
    campaignMayVaryByAccount: true,
    paymentGateKnown: false,
    offerDelivery: "platform_dependent",
  },
  unknown: {
    requiresKyc: false,
    requiresResidenceMatch: false,
    campaignMayVaryByAccount: true,
    paymentGateKnown: false,
    offerDelivery: "unknown",
  },
};

const OFFER_APPLICABILITY_BY_MARKET = {
  BR: {
    requiresVerification: true,
    shareableToUsers: false,
    confidence: "conditional",
    notes: ["Do not express a fixed bonus to users; verify campaign in-account."],
  },
  ID: {
    requiresVerification: true,
    shareableToUsers: false,
    confidence: "research-only",
    notes: ["OJK/Bappebti context and official platform guides do not establish account approval, IDR funding, product access or referral benefits. Keep handoff closed until the official account confirms identity, service entity, IDR route, fees, limits and product scope."],
  },
  VN: {
    requiresVerification: true,
    shareableToUsers: false,
    confidence: "research-only",
    notes: ["No source-linked funding matrix row is published yet; do not present Vietnam as a direct handoff market."],
  },
  MX: {
    requiresVerification: true,
    shareableToUsers: false,
    confidence: "conditional",
    notes: ["Separate platform account eligibility from local payment-account setup."],
  },
  TW: {
    requiresVerification: true,
    shareableToUsers: false,
    confidence: "research-only",
    notes: ["FSC registration and the promulgated Virtual Asset Service Act do not establish account or product availability. Keep every handoff closed until the official account confirms identity, service entity, TWD funding direction and product scope."],
  },
  HK: {
    requiresVerification: true,
    shareableToUsers: false,
    confidence: "conditional",
    notes: ["Offer terms may vary by user profile and campaign cycle."],
  },
  OTHER: {
    requiresVerification: true,
    shareableToUsers: false,
    confidence: "conditional",
    notes: ["Offer terms vary by account and region; avoid fixed promises."],
  },
  EU: {
    requiresVerification: true,
    shareableToUsers: false,
    confidence: "conditional",
    notes: ["Offer terms vary by account and region; avoid fixed promises."],
  },
  UK: {
    requiresVerification: true,
    shareableToUsers: false,
    confidence: "conditional",
    notes: ["Offer terms vary by account and region; avoid fixed promises."],
  },
  JP: {
    requiresVerification: true,
    shareableToUsers: false,
    confidence: "conditional",
    notes: ["Do not publish a fixed benefit; verify account and regional terms on the official platform."],
  },
  KR: {
    requiresVerification: true,
    shareableToUsers: false,
    confidence: "conditional",
    notes: ["Do not publish a fixed benefit; verify account and regional terms on the official platform."],
  },
  SG: {
    requiresVerification: true,
    shareableToUsers: false,
    confidence: "conditional",
    notes: ["Do not publish a fixed benefit; verify account, service entity and regional terms on the official platform."],
  },
  TR: {
    requiresVerification: true,
    shareableToUsers: false,
    confidence: "conditional",
    notes: ["Do not publish a fixed benefit; SPK list status, account verification, TRY funding and product scope must be checked separately."],
  },
  US: {
    requiresVerification: true,
    shareableToUsers: false,
    confidence: "research-only",
    notes: ["Do not publish a fixed benefit; FinCEN, SEC, CFTC, NMLS, NYDFS, state support, account verification, USD rails and product scope must be checked separately."],
  },
  global: {
    requiresVerification: true,
    shareableToUsers: false,
    confidence: "conditional",
    notes: ["Offer terms vary by account and region; avoid fixed promises."],
  },
  unknown: {
    requiresVerification: false,
    shareableToUsers: false,
    confidence: "unknown",
    notes: ["No explicit market context available."],
  },
};

export const MARKET_PROFILE_KEYS = ["BR", "ID", "VN", "MX", "TW", "HK", "OTHER", "EU", "UK", "JP", "KR", "SG", "TR", "US", "global", "unknown"];

function normalizeMarketInput(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const lowered = trimmed.toLowerCase();
  if (lowered === "global") return "global";
  if (lowered === "other") return "OTHER";
  const normalized = trimmed.toUpperCase();
  if (MARKET_RE.test(normalized)) return normalized;
  if (MARKET_ALPHA3_RE.test(normalized)) return normalized;
  return null;
}

function localeToMarketFallback(locale) {
  if (locale === "pt-BR") return "BR";
  if (locale === "id") return "ID";
  if (locale === "zh-Hans" || locale === "zh-Hant") return "TW";
  if (locale === "en" || locale === "de" || locale === "fr" || locale === "es" || locale === "it" || locale === "ru" || locale === "tr" || locale === "vi") return "OTHER";
  return "unknown";
}

export const marketPolicyRegistry = {
  BR: {
    targetMarket: "BR",
    residenceMarket: "BR",
    defaultLocale: LOCALE_BY_MARKET.BR,
    product: PRODUCT_BY_MARKET.BR,
    payment: PAYMENT_BY_MARKET.BR,
    accountStage: ACCOUNT_STAGE_BY_MARKET.BR,
    offer: OFFER_APPLICABILITY_BY_MARKET.BR,
    pathPrefixes: ["/br"],
    enabled: true,
  },
  ID: {
    targetMarket: "ID",
    residenceMarket: "ID",
    defaultLocale: LOCALE_BY_MARKET.ID,
    product: PRODUCT_BY_MARKET.ID,
    payment: PAYMENT_BY_MARKET.ID,
    accountStage: ACCOUNT_STAGE_BY_MARKET.ID,
    offer: OFFER_APPLICABILITY_BY_MARKET.ID,
    pathPrefixes: ["/id"],
    enabled: true,
  },
  VN: {
    targetMarket: "VN",
    residenceMarket: "VN",
    defaultLocale: LOCALE_BY_MARKET.VN,
    product: PRODUCT_BY_MARKET.VN,
    payment: PAYMENT_BY_MARKET.VN,
    accountStage: ACCOUNT_STAGE_BY_MARKET.VN,
    offer: OFFER_APPLICABILITY_BY_MARKET.VN,
    pathPrefixes: ["/vn"],
    enabled: true,
  },
  MX: {
    targetMarket: "MX",
    residenceMarket: "MX",
    defaultLocale: LOCALE_BY_MARKET.MX,
    product: PRODUCT_BY_MARKET.MX,
    payment: PAYMENT_BY_MARKET.MX,
    accountStage: ACCOUNT_STAGE_BY_MARKET.MX,
    offer: OFFER_APPLICABILITY_BY_MARKET.MX,
    pathPrefixes: ["/mx"],
    enabled: true,
  },
  TW: {
    targetMarket: "TW",
    residenceMarket: "TW",
    defaultLocale: LOCALE_BY_MARKET.TW,
    product: PRODUCT_BY_MARKET.TW,
    payment: PAYMENT_BY_MARKET.TW,
    accountStage: ACCOUNT_STAGE_BY_MARKET.TW,
    offer: OFFER_APPLICABILITY_BY_MARKET.TW,
    pathPrefixes: ["/tw"],
    enabled: true,
  },
  HK: {
    targetMarket: "HK",
    residenceMarket: "HK",
    defaultLocale: LOCALE_BY_MARKET.HK,
    product: PRODUCT_BY_MARKET.HK,
    payment: PAYMENT_BY_MARKET.HK,
    accountStage: ACCOUNT_STAGE_BY_MARKET.HK,
    offer: OFFER_APPLICABILITY_BY_MARKET.HK,
    pathPrefixes: ["/hk"],
    enabled: true,
  },
  OTHER: {
    targetMarket: "OTHER",
    residenceMarket: "OTHER",
    defaultLocale: LOCALE_BY_MARKET.OTHER,
    product: PRODUCT_BY_MARKET.OTHER,
    payment: PAYMENT_BY_MARKET.OTHER,
    accountStage: ACCOUNT_STAGE_BY_MARKET.OTHER,
    offer: OFFER_APPLICABILITY_BY_MARKET.OTHER,
    pathPrefixes: ["/int"],
    enabled: true,
  },
  EU: {
    targetMarket: "EU",
    residenceMarket: "OTHER",
    defaultLocale: LOCALE_BY_MARKET.EU,
    product: PRODUCT_BY_MARKET.EU,
    payment: PAYMENT_BY_MARKET.EU,
    accountStage: ACCOUNT_STAGE_BY_MARKET.EU,
    offer: OFFER_APPLICABILITY_BY_MARKET.EU,
    pathPrefixes: ["/eu"],
    enabled: true,
  },
  UK: {
    targetMarket: "UK",
    residenceMarket: "UK",
    defaultLocale: LOCALE_BY_MARKET.UK,
    product: PRODUCT_BY_MARKET.UK,
    payment: PAYMENT_BY_MARKET.UK,
    accountStage: ACCOUNT_STAGE_BY_MARKET.UK,
    offer: OFFER_APPLICABILITY_BY_MARKET.UK,
    pathPrefixes: ["/uk"],
    enabled: true,
  },
  JP: {
    targetMarket: "JP",
    residenceMarket: "JP",
    defaultLocale: LOCALE_BY_MARKET.JP,
    product: PRODUCT_BY_MARKET.JP,
    payment: PAYMENT_BY_MARKET.JP,
    accountStage: ACCOUNT_STAGE_BY_MARKET.JP,
    offer: OFFER_APPLICABILITY_BY_MARKET.JP,
    pathPrefixes: ["/jp"],
    enabled: true,
  },
  KR: {
    targetMarket: "KR",
    residenceMarket: "KR",
    defaultLocale: LOCALE_BY_MARKET.KR,
    product: PRODUCT_BY_MARKET.KR,
    payment: PAYMENT_BY_MARKET.KR,
    accountStage: ACCOUNT_STAGE_BY_MARKET.KR,
    offer: OFFER_APPLICABILITY_BY_MARKET.KR,
    pathPrefixes: ["/kr"],
    enabled: true,
  },
  SG: {
    targetMarket: "SG",
    residenceMarket: "SG",
    defaultLocale: LOCALE_BY_MARKET.SG,
    product: PRODUCT_BY_MARKET.SG,
    payment: PAYMENT_BY_MARKET.SG,
    accountStage: ACCOUNT_STAGE_BY_MARKET.SG,
    offer: OFFER_APPLICABILITY_BY_MARKET.SG,
    pathPrefixes: ["/sg"],
    enabled: true,
  },
  TR: {
    targetMarket: "TR",
    residenceMarket: "TR",
    defaultLocale: LOCALE_BY_MARKET.TR,
    product: PRODUCT_BY_MARKET.TR,
    payment: PAYMENT_BY_MARKET.TR,
    accountStage: ACCOUNT_STAGE_BY_MARKET.TR,
    offer: OFFER_APPLICABILITY_BY_MARKET.TR,
    pathPrefixes: ["/tr/markets/turkiye", "/markets/turkiye"],
    enabled: true,
  },
  US: {
    targetMarket: "US",
    residenceMarket: "US",
    defaultLocale: LOCALE_BY_MARKET.US,
    product: PRODUCT_BY_MARKET.US,
    payment: PAYMENT_BY_MARKET.US,
    accountStage: ACCOUNT_STAGE_BY_MARKET.US,
    offer: OFFER_APPLICABILITY_BY_MARKET.US,
    pathPrefixes: ["/us"],
    enabled: true,
  },
  global: {
    targetMarket: "global",
    residenceMarket: "OTHER",
    defaultLocale: LOCALE_BY_MARKET.global,
    product: PRODUCT_BY_MARKET.global,
    payment: PAYMENT_BY_MARKET.global,
    accountStage: ACCOUNT_STAGE_BY_MARKET.global,
    offer: OFFER_APPLICABILITY_BY_MARKET.global,
    pathPrefixes: [],
    enabled: true,
  },
  unknown: {
    targetMarket: "unknown",
    residenceMarket: "OTHER",
    defaultLocale: LOCALE_BY_MARKET.unknown,
    product: PRODUCT_BY_MARKET.unknown,
    payment: PAYMENT_BY_MARKET.unknown,
    accountStage: ACCOUNT_STAGE_BY_MARKET.unknown,
    offer: OFFER_APPLICABILITY_BY_MARKET.unknown,
    pathPrefixes: [],
    enabled: true,
  },
};

export const marketPolicy = marketPolicyRegistry;

export function resolveTargetMarket({ market, pathname = "", locale } = {}) {
  const normalizedMarket = normalizeMarketInput(market);
  if (normalizedMarket) return normalizedMarket;
  if (typeof pathname === "string") {
    const found = Object.values(marketPolicyRegistry).find((policy) =>
      policy.pathPrefixes?.some((prefix) => {
        if (typeof prefix !== "string") return false;
        return pathname === prefix || pathname.startsWith(`${prefix}/`);
      })
    );
    if (found) return found.targetMarket;
  }
  if (typeof locale === "string") {
    return localeToMarketFallback(locale);
  }
  return "unknown";
}

export function resolveResidenceMarket(input) {
  if (!input || typeof input !== "object") return "unknown";
  const explicitResidence = normalizeMarketInput(input.residenceMarket);
  if (explicitResidence) return explicitResidence;
  const explicitMarket = normalizeMarketInput(input.market);
  if (explicitMarket) return explicitMarket;
  return "unknown";
}

export function resolveMarketLocale(input = {}) {
  const targetMarket = resolveTargetMarket(input);
  return marketPolicyRegistry[targetMarket]?.defaultLocale || LOCALE_BY_MARKET.unknown;
}

export function resolveMarketProduct(input = {}) {
  const targetMarket = resolveTargetMarket(input);
  return marketPolicyRegistry[targetMarket]?.product || PRODUCT_BY_MARKET.unknown;
}

export function resolveMarketPayment(input = {}) {
  const targetMarket = resolveTargetMarket(input);
  return marketPolicyRegistry[targetMarket]?.payment || PAYMENT_BY_MARKET.unknown;
}

export function resolveMarketAccountStage(input = {}) {
  const targetMarket = resolveTargetMarket(input);
  return marketPolicyRegistry[targetMarket]?.accountStage || ACCOUNT_STAGE_BY_MARKET.unknown;
}

export function resolveMarketOffer(input = {}) {
  const targetMarket = resolveTargetMarket(input);
  return marketPolicyRegistry[targetMarket]?.offer || OFFER_APPLICABILITY_BY_MARKET.unknown;
}

export function resolveMarketPolicy(input = {}) {
  const targetMarket = resolveTargetMarket(input);
  return marketPolicyRegistry[targetMarket] || marketPolicyRegistry.unknown;
}

export function normalizeMarketValue(value = "") {
  return normalizeMarketInput(value);
}
