export const SAFE_TRACKING_VALUE_RE = /^[a-zA-Z0-9._-]{1,60}$/;
export const SAFE_DECISION_MEDIUMS = new Set(["broadcast", "manual_draft"]);
export const SAFE_ATTRIBUTION_PARAMS = Object.freeze(["utm_source", "utm_medium", "utm_campaign"]);

export function sanitizeTrackingValue(value, fallback = "") {
  return typeof value === "string" && SAFE_TRACKING_VALUE_RE.test(value) ? value : fallback;
}

export function sanitizeTrackingMedium(value, fallback = "") {
  const normalized = sanitizeTrackingValue(value, fallback);
  return normalized && SAFE_DECISION_MEDIUMS.has(normalized) ? normalized : fallback;
}

export function sanitizeBrAttributionFromSearch(searchParams) {
  const params = searchParams instanceof URLSearchParams
    ? searchParams
    : new URLSearchParams(searchParams || "");
  const source = sanitizeTrackingValue(params.get("utm_source"));
  const medium = sanitizeTrackingMedium(params.get("utm_medium"));
  const campaign = sanitizeTrackingValue(params.get("utm_campaign"));
  return source || medium || campaign ? { source, medium, campaign } : null;
}

export function applySafeAttributionToSearchParams(params, attribution) {
  if (!(params instanceof URLSearchParams)) return params;
  for (const [key, value] of [
    ["utm_source", attribution?.source],
    ["utm_medium", attribution?.medium],
    ["utm_campaign", attribution?.campaign],
  ]) {
    const normalized = key === "utm_medium" ? sanitizeTrackingMedium(value) : sanitizeTrackingValue(value);
    if (normalized) params.set(key, normalized);
    else params.delete(key);
  }
  return params;
}
