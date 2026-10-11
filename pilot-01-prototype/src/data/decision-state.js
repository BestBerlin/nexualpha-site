export const DECISION_STATE_VERSION = 1;
export const DECISION_STORAGE_KEY = "nexualpha:brazil-decision:v1";

import { sanitizeDecisionAccountStage, sanitizeDecisionFunding } from "./decision-passport.js";
import { applySafeAttributionToSearchParams, sanitizeTrackingMedium, sanitizeTrackingValue } from "./tracking-attribution.js";

export const decisionStateSchema = {
  regions: ["BR", "ID", "TW", "HK", "OTHER"],
  products: ["spot", "perpetuals", "unknown"],
  platforms: ["", "binance", "okx", "bybit"],
};

export const defaultDecisionState = Object.freeze({
  region: "BR",
  product: "spot",
  platform: "",
  amount: 1000,
  spotFeeBps: 10,
  depositFeePercent: 0,
  depositFixedBrl: 0,
  source: "",
  medium: "",
  campaign: "",
  publisher: "",
  accountStage: "",
  funding: "",
});

const stateKeys = ["region", "product", "platform", "amount", "spotFeeBps", "depositFeePercent", "depositFixedBrl", "source", "medium", "campaign", "publisher", "accountStage", "funding"];
const PARAMS = {
  region: "market",
  product: "product",
  platform: "platform",
  amount: "amount",
  spotFeeBps: "spot_fee_bps",
  depositFeePercent: "deposit_fee_pct",
  depositFixedBrl: "deposit_fixed_brl",
  source: "utm_source",
  medium: "utm_medium",
  campaign: "utm_campaign",
  publisher: "publisher",
  accountStage: "account_stage",
  funding: "funding",
};
const SAFE_LOCALES = new Set(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"]);

function enumValue(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function explicitEnumValue(value, allowed, fallback, unsupported) {
  if (value === undefined || value === null) return fallback;
  return allowed.includes(value) ? value : unsupported;
}

function safeNumber(value, fallback, { min = 0, max = 1_000_000 } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function trackingValue(value, fallback = "") {
  return sanitizeTrackingValue(value, fallback);
}

function trackingMediumValue(value, fallback = "") {
  return sanitizeTrackingMedium(value, fallback);
}

export function normalizeDecisionState(value = {}) {
  const region = enumValue(value.region, decisionStateSchema.regions, defaultDecisionState.region);
  return {
    region,
    product: enumValue(value.product, decisionStateSchema.products, defaultDecisionState.product),
    platform: enumValue(value.platform, decisionStateSchema.platforms, defaultDecisionState.platform),
    amount: Math.round(safeNumber(value.amount, defaultDecisionState.amount, { min: 0, max: 10_000_000 }) * 100) / 100,
    spotFeeBps: Math.round(safeNumber(value.spotFeeBps, defaultDecisionState.spotFeeBps, { min: 0, max: 500 }) * 100) / 100,
    depositFeePercent: Math.round(safeNumber(value.depositFeePercent, defaultDecisionState.depositFeePercent, { min: 0, max: 10 }) * 100) / 100,
    depositFixedBrl: Math.round(safeNumber(value.depositFixedBrl, defaultDecisionState.depositFixedBrl, { min: 0, max: 10_000 }) * 100) / 100,
    source: trackingValue(value.source, defaultDecisionState.source),
    medium: trackingMediumValue(value.medium, defaultDecisionState.medium),
    campaign: trackingValue(value.campaign, defaultDecisionState.campaign),
    publisher: trackingValue(value.publisher, defaultDecisionState.publisher),
    accountStage: sanitizeDecisionAccountStage(value.accountStage) || defaultDecisionState.accountStage,
    funding: sanitizeDecisionFunding(value.funding, region) || defaultDecisionState.funding,
  };
}

export function decisionStateFromSearch(search = "", fallback = defaultDecisionState) {
  const params = new URLSearchParams(search);
  const next = { ...fallback };
  for (const key of stateKeys) {
    const value = params.get(PARAMS[key]);
    if (value !== null) next[key] = value;
  }
  const normalized = normalizeDecisionState(next);
  return {
    ...normalized,
    region: explicitEnumValue(params.get(PARAMS.region), decisionStateSchema.regions, normalized.region, "OTHER"),
    product: explicitEnumValue(params.get(PARAMS.product), decisionStateSchema.products, normalized.product, "unknown"),
    funding: sanitizeDecisionFunding(params.get(PARAMS.funding), normalized.region) || "",
  };
}

export function decisionStateFromUrl(input, fallback = defaultDecisionState) {
  try {
    const url = input instanceof URL ? input : new URL(String(input), "https://nexualpha.com");
    return decisionStateFromSearch(url.search, fallback);
  } catch {
    return normalizeDecisionState(fallback);
  }
}

export function writeDecisionStateToUrl(input, state) {
  const sourceUrl = input instanceof URL ? input : new URL(String(input || "/br"), "https://nexualpha.com");
  const url = new URL(sourceUrl.pathname || "/br", "https://nexualpha.com");
  const locale = sourceUrl.searchParams.get("locale");
  const isBrazilPath = /^\/br(?:\/|$)/i.test(url.pathname);
  if (SAFE_LOCALES.has(locale) && locale !== "en" && (!isBrazilPath || locale === "pt-BR")) url.searchParams.set("locale", locale);
  const normalized = normalizeDecisionState(state);
  for (const key of stateKeys) {
    const value = normalized[key];
    if (value !== "") url.searchParams.set(PARAMS[key], String(value));
  }
  applySafeAttributionToSearchParams(url.searchParams, normalized);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function hasDecisionStateSearch(search = "") {
  const params = new URLSearchParams(search);
  return ["market", "product", "platform", "amount", "spot_fee_bps", "deposit_fee_pct", "deposit_fixed_brl", "utm_source", "utm_medium", "utm_campaign", "publisher", "account_stage", "funding"].some((key) => params.has(key));
}

export function loadDecisionState(storage, fallback = defaultDecisionState) {
  try {
    const raw = storage?.getItem?.(DECISION_STORAGE_KEY);
    if (!raw) return normalizeDecisionState(fallback);
    const parsed = JSON.parse(raw);
    if (parsed?.version !== DECISION_STATE_VERSION) return normalizeDecisionState(fallback);
    return normalizeDecisionState({ ...fallback, ...parsed.state });
  } catch {
    return normalizeDecisionState(fallback);
  }
}

export function browserSessionStorage(windowLike) {
  try {
    return windowLike?.sessionStorage ?? null;
  } catch {
    return null;
  }
}

export function saveDecisionState(storage, state) {
  try {
    storage?.setItem?.(DECISION_STORAGE_KEY, JSON.stringify({
      version: DECISION_STATE_VERSION,
      state: normalizeDecisionState(state),
    }));
    return true;
  } catch {
    return false;
  }
}

export function costEstimate({ amount, spotFeeBps, depositFeePercent, depositFixedBrl } = defaultDecisionState) {
  const normalized = normalizeDecisionState({ ...defaultDecisionState, amount, spotFeeBps, depositFeePercent, depositFixedBrl });
  const spotFee = normalized.amount * (normalized.spotFeeBps / 10_000);
  const depositFee = normalized.amount * (normalized.depositFeePercent / 100) + normalized.depositFixedBrl;
  return {
    amount: normalized.amount,
    spotFee,
    depositFee,
    total: spotFee + depositFee,
  };
}
