import { resolveMarketPolicy } from "./market-policy.js";
import { sanitizeDecisionAccountStage, sanitizeDecisionFunding } from "./decision-passport.js";
import { appendFragmentContext } from "./contextual-href.js";
import { localizedHref } from "./locale-routing.js";

export function regionalDirectoryHref({ market = "MX", locale = "en", stage = "", product = "spot", funding = "" } = {}) {
  const policy = resolveMarketPolicy({ market });
  const context = {
    market: policy.targetMarket,
    product: product === "unknown" ? "spot" : product,
    utm_source: "regional_preview",
    utm_campaign: `${policy.targetMarket.toLowerCase()}-research-preview`,
  };
  const verifiedStage = sanitizeDecisionAccountStage(stage);
  if (verifiedStage) context.account_stage = verifiedStage;
  const verifiedFunding = sanitizeDecisionFunding(funding, policy.targetMarket);
  if (verifiedFunding) context.funding = verifiedFunding;
  return appendFragmentContext(localizedHref("/exchanges", { locale: locale || policy.defaultLocale }), context);
}

export function regionalToolHref({ path = "/rates", market = "MX", locale = "en", product = "spot", accountStage = "", funding = "" } = {}) {
  const policy = resolveMarketPolicy({ market });
  const context = {
    market: policy.targetMarket,
    product: product === "unknown" ? "spot" : product,
    utm_source: "regional_preview",
    utm_campaign: `${policy.targetMarket.toLowerCase()}-research-preview`,
  };
  const verifiedStage = sanitizeDecisionAccountStage(accountStage);
  if (verifiedStage) context.account_stage = verifiedStage;
  const verifiedFunding = sanitizeDecisionFunding(funding, policy.targetMarket);
  if (verifiedFunding) context.funding = verifiedFunding;
  return appendFragmentContext(localizedHref(path, { locale: locale || policy.defaultLocale }), context);
}

// Recover a scoped empty directory without broadening venue eligibility.
export function regionalResearchReturnHref({ market, locale = "en", product = "spot", accountStage = "", funding = "" } = {}) {
  const policy = resolveMarketPolicy({ market });
  const path = policy.pathPrefixes?.[0];
  if (!path || policy.targetMarket === "OTHER") return null;
  return regionalToolHref({ path, market: policy.targetMarket, locale, product, accountStage, funding });
}
