import { appendFragmentContextParams, localizedHref } from "./locale-routing.js";

function canonicalContextValue(value) {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim();
  if (!normalized || normalized.toLowerCase() === "unknown") return undefined;
  return normalized;
}

export function appendFragmentContext(href, context = {}) {
  return appendFragmentContextParams(href, context);
}

export function contextualHref(href, { locale = "en", market, product, ...extra } = {}) {
  const context = { ...extra };
  const marketValue = canonicalContextValue(market);
  const productValue = canonicalContextValue(product);
  if (marketValue) context.market = marketValue;
  if (productValue) context.product = productValue;
  return appendFragmentContext(localizedHref(href, { locale }), context);
}
