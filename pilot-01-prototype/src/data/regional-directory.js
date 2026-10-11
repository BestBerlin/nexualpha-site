import { resolveMarketPolicy } from "./market-policy.js";
import { sanitizeDecisionAccountStage, sanitizeDecisionFunding } from "./decision-passport.js";

function appendKnownParam(params, key, value) {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue || normalizedValue.toLowerCase() === "unknown") return;
  params.set(key, normalizedValue);
}

function appendLocaleParam(params, locale) {
  const normalizedLocale = String(locale || "").trim();
  if (!normalizedLocale || normalizedLocale === "en") return;
  params.set("locale", normalizedLocale);
}

export function regionalDirectoryHref({ market = "MX", locale = "en", stage = "", product = "spot", funding = "" } = {}) {
  const policy = resolveMarketPolicy({ market });
  const params = new URLSearchParams();
  appendKnownParam(params, "market", policy.targetMarket);
  appendKnownParam(params, "product", product === "unknown" ? "spot" : product);
  appendLocaleParam(params, locale || policy.defaultLocale);
  params.set("utm_source", "regional_preview");
  params.set("utm_campaign", `${policy.targetMarket.toLowerCase()}-research-preview`);
  const verifiedStage = sanitizeDecisionAccountStage(stage);
  if (verifiedStage) params.set("account_stage", verifiedStage);
  const verifiedFunding = sanitizeDecisionFunding(funding, policy.targetMarket);
  if (verifiedFunding) params.set("funding", verifiedFunding);
  return `/exchanges?${params.toString()}`;
}

export function regionalToolHref({ path = "/rates", market = "MX", locale = "en", product = "spot", accountStage = "", funding = "" } = {}) {
  const policy = resolveMarketPolicy({ market });
  const params = new URLSearchParams();
  appendKnownParam(params, "market", policy.targetMarket);
  appendKnownParam(params, "product", product === "unknown" ? "spot" : product);
  appendKnownParam(params, "account_stage", sanitizeDecisionAccountStage(accountStage));
  const verifiedFunding = sanitizeDecisionFunding(funding, policy.targetMarket);
  if (verifiedFunding) params.set("funding", verifiedFunding);
  appendLocaleParam(params, locale || policy.defaultLocale);
  params.set("utm_source", "regional_preview");
  params.set("utm_campaign", `${policy.targetMarket.toLowerCase()}-research-preview`);
  return `${path}?${params.toString()}`;
}

// Recover a scoped empty directory without broadening venue eligibility.
export function regionalResearchReturnHref({ market, locale = "en", product = "spot", accountStage = "", funding = "" } = {}) {
  const policy = resolveMarketPolicy({ market });
  const path = policy.pathPrefixes?.[0];
  if (!path || policy.targetMarket === "OTHER") return null;
  return regionalToolHref({ path, market: policy.targetMarket, locale, product, accountStage, funding });
}
