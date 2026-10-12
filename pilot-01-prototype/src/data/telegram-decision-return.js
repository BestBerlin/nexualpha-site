import { venueDatabase } from "./venue-database.js";
import { localizedHref, LOCALE_PREFIX_BY_CODE } from "./locale-routing.js";
import { sanitizeGrowthSlug, sanitizeMarket, sanitizeProduct } from "./growth-context.js";
import {
  buildAnonymousDecisionResumeQuery,
  buildAnonymousDecisionResumeSnapshot,
  sanitizeDecisionAccountStage,
  sanitizeDecisionFunding,
  sanitizeDecisionScenario,
} from "./decision-passport.js";

const RETURN_SOURCE = "bot";
const RETURN_ATTRIBUTION_SOURCE = "telegram";
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const CONTEXT_KEYS = [
  "tg_return",
  "tg_venue",
  "tg_pair",
  "tg_activity",
  "tg_route",
  "tg_market",
  "tg_product",
  "tg_locale",
  "tg_campaign",
  "tg_expires",
  "account_stage",
  "funding",
  "scenario",
  "venue",
  "pair",
];
const ACTIVITY_RE = /^[a-z0-9][a-z0-9._-]{0,79}$/i;
const BANNER_SUPPORTED_KINDS = new Set(["venue", "pair"]);
const SAFE_FIRST_PARTY_ROUTE_RE = /^\/(?:rates|br(?:\/(?:conta|pix|saque-pix|kyc-cpf|custos))?|mx(?:\/(?:comparar|costos|conta))?|tw|id|vn|hk|eu|uk|us|jp|kr|sg|int|markets\/turkiye|news\/[a-z0-9-]+|topics\/[a-z0-9-]+)$/;

function supportedLocale(value) {
  return Object.hasOwn(LOCALE_PREFIX_BY_CODE, value) ? value : "en";
}

function contextNow(inputNow) {
  const value = Number(inputNow ?? Date.now());
  return Number.isFinite(value) ? value : Date.now();
}

function expiryFrom(input = {}) {
  const now = contextNow(input.now);
  const requested = Number(input.expiresAt);
  if (Number.isFinite(requested) && requested > now && requested - now <= MAX_TTL_MS) return Math.round(requested);
  return Math.round(now + DEFAULT_TTL_MS);
}

function cleanVenue(value) {
  const slug = sanitizeGrowthSlug(value);
  return slug && Object.hasOwn(venueDatabase, slug) ? slug : null;
}

function cleanPair(value) {
  const raw = sanitizeGrowthSlug(value);
  if (!raw) return null;
  const slugs = raw.split("-vs-");
  if (slugs.length < 2 || slugs.length > 3 || new Set(slugs).size !== slugs.length) return null;
  return slugs.every((slug) => Object.hasOwn(venueDatabase, slug)) ? slugs.join("-vs-") : null;
}

function cleanActivity(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return ACTIVITY_RE.test(trimmed) && !trimmed.includes("..") ? trimmed : null;
}

function cleanFirstPartyRoute(value) {
  if (typeof value !== "string") return null;
  const path = value.trim().split("?")[0].split("#")[0];
  return SAFE_FIRST_PARTY_ROUTE_RE.test(path) ? path : null;
}

function cleanCampaign(value) {
  const campaign = sanitizeGrowthSlug(value);
  return campaign ? campaign.slice(0, 80) : null;
}

function normalizeReturnMarket(value) {
  const market = sanitizeMarket(value);
  return market === "global" ? "GLOBAL" : market;
}

function basePublicContext(input = {}) {
  const market = normalizeReturnMarket(input.market) || undefined;
  const product = sanitizeProduct(input.product) || undefined;
  const locale = supportedLocale(input.locale);
  const campaign = cleanCampaign(input.campaign);
  const accountStage = sanitizeDecisionAccountStage(input.accountStage ?? input.account_stage);
  const funding = sanitizeDecisionFunding(input.funding, market);
  const scenario = sanitizeDecisionScenario(input.scenario);
  return { market, product, locale, campaign, accountStage, funding, scenario };
}

function targetObject(input = {}) {
  const route = cleanFirstPartyRoute(input.route);
  if (route) return { kind: "route", route, path: route };

  const venue = cleanVenue(input.venue);
  if (venue) return { kind: "venue", venue, path: `/exchanges/${venue}` };

  const pair = cleanPair(input.pair);
  if (pair) return { kind: "pair", pair, path: `/compare/${pair}` };

  const activity = cleanActivity(input.activity);
  if (activity) return { kind: "activity", activity, path: `/activities/${activity}` };

  return { kind: "hub", path: "/telegram" };
}

function paramsFor(context) {
  const params = {
    tg_return: RETURN_SOURCE,
    tg_expires: context.expiresAt,
  };
  if (context.object.kind === "venue") params.tg_venue = context.object.venue;
  if (context.object.kind === "pair") params.tg_pair = context.object.pair;
  if (context.object.kind === "activity") params.tg_activity = context.object.activity;
  if (context.object.kind === "route") params.tg_route = context.object.route;
  if (context.market && context.market !== "unknown") params.tg_market = context.market;
  if (context.product && context.product !== "unknown") params.tg_product = context.product;
  if (context.locale) params.tg_locale = context.locale;
  if (context.campaign) params.tg_campaign = context.campaign;
  return params;
}

function publicContextParams(context = {}) {
  const params = {};
  if (context.market && context.market !== "unknown") params.market = context.market;
  if (context.product && context.product !== "unknown") params.product = context.product;
  if (context.accountStage) params.account_stage = context.accountStage;
  if (context.funding) params.funding = context.funding;
  if (context.scenario) params.scenario = context.scenario;
  if (context.campaign) params.utm_campaign = context.campaign;
  return params;
}

function appendKnownParam(params, key, value) {
  const normalized = String(value || "").trim();
  if (!normalized || normalized.toLowerCase() === "unknown") return;
  if (!params.has(key)) params.set(key, normalized);
}

export function telegramReturnObjectId(object = {}) {
  if (object.kind === "venue") return object.venue || null;
  if (object.kind === "pair") return object.pair || null;
  if (object.kind === "activity") return object.activity || null;
  if (object.kind === "route") return object.route || null;
  return null;
}

export function cleanTelegramReturnSearch(search = "", keep = {}) {
  const incoming = new URLSearchParams(String(search || "").startsWith("?") ? String(search || "").slice(1) : search);
  const clean = new URLSearchParams();
  const localeInput = keep.locale ?? incoming.get("locale");
  const market = normalizeReturnMarket(keep.market ?? incoming.get("market"));
  const product = sanitizeProduct(keep.product ?? incoming.get("product"));
  const accountStage = sanitizeDecisionAccountStage(keep.accountStage ?? incoming.get("account_stage"));
  const funding = sanitizeDecisionFunding(keep.funding ?? incoming.get("funding"), market);
  const scenario = sanitizeDecisionScenario(keep.scenario ?? incoming.get("scenario"));
  const venue = cleanVenue(keep.venue ?? incoming.get("venue"));
  const pair = cleanPair(keep.pair ?? incoming.get("pair"));

  if (localeInput) appendKnownParam(clean, "locale", supportedLocale(localeInput));
  appendKnownParam(clean, "market", market);
  appendKnownParam(clean, "product", product);
  appendKnownParam(clean, "account_stage", accountStage);
  appendKnownParam(clean, "funding", funding);
  appendKnownParam(clean, "scenario", scenario);
  appendKnownParam(clean, "venue", venue);
  appendKnownParam(clean, "pair", pair);
  return clean.toString();
}

export function matchesTelegramReturnTarget(context, { expectedKind, expectedId } = {}) {
  if (!context || context.status !== "restored") return false;
  if (!BANNER_SUPPORTED_KINDS.has(expectedKind)) return false;
  if (context.object?.kind !== expectedKind) return false;
  return telegramReturnObjectId(context.object) === sanitizeGrowthSlug(expectedId);
}

export function resolveTelegramReturnBannerState({
  search = "",
  expectedKind,
  expectedId,
  locale,
  market,
  product,
  accountStage,
  funding,
  now,
} = {}) {
  const context = readTelegramReturnContext(search, { now });
  if (!matchesTelegramReturnTarget(context, { expectedKind, expectedId })) return null;
  const cleanSearch = cleanTelegramReturnSearch(search, {
    locale: locale || context.locale,
    market: market || context.market,
    product: product || context.product,
    accountStage: accountStage || context.accountStage,
    funding: funding || context.funding,
    scenario: context.scenario,
    venue: context.object?.venue,
    pair: context.object?.pair,
  });
  return {
    ...context,
    objectId: telegramReturnObjectId(context.object),
    cleanSearch,
  };
}

function fallback(reason = "unavailable", input = {}) {
  const context = basePublicContext(input);
  const href = localizedHref("/exchanges", { locale: context.locale, ...publicContextParams(context) });
  return {
    status: "fallback",
    reason,
    webOnly: true,
    object: { kind: "directory" },
    ...context,
    href,
    boundary: "Web-only fallback: Telegram return context was unavailable, unknown, duplicated or expired. This is not registration, KYC, group-join or commission evidence.",
  };
}

function duplicateContextParam(params) {
  return CONTEXT_KEYS.find((key) => params.getAll(key).length > 1) || null;
}

export function buildTelegramReturnContext(input = {}) {
  const object = targetObject(input);
  const context = {
    status: "restored",
    webOnly: false,
    object: { kind: object.kind, ...(object.venue ? { venue: object.venue } : {}), ...(object.pair ? { pair: object.pair } : {}), ...(object.activity ? { activity: object.activity } : {}), ...(object.route ? { route: object.route } : {}) },
    ...basePublicContext(input),
    expiresAt: expiryFrom(input),
  };
  const anonymousResume = buildAnonymousDecisionResumeSnapshot({
    market: context.market,
    product: context.product,
    accountStage: context.accountStage,
    funding: context.funding,
    scenario: context.scenario || object.kind,
    venue: object.venue,
    pair: object.pair,
  });
  const resumeParams = Object.fromEntries(buildAnonymousDecisionResumeQuery(anonymousResume?.state));
  const href = localizedHref(object.path, {
    locale: context.locale,
    preserveQuery: true,
    ...publicContextParams(context),
    ...resumeParams,
    ...paramsFor(context),
    // This marker is added only after the return target and expiry have been
    // constructed from the strict public-context allowlist above. It measures
    // an anonymous first-party return visit; it is never partner-side signup,
    // KYC, deposit, trade, rebate or commission evidence.
    utm_source: RETURN_ATTRIBUTION_SOURCE,
  });
  return {
    ...context,
    anonymousResume,
    href,
    params: paramsFor(context),
    boundary: "Telegram return context restores only public page state. It is not registration, KYC, group-join or commission evidence.",
  };
}

export function readTelegramReturnContext(search = "", options = {}) {
  const params = new URLSearchParams(String(search || "").startsWith("?") ? String(search || "").slice(1) : search);
  if (!params.has("tg_return")) return fallback("missing");
  const duplicated = duplicateContextParam(params);
  if (duplicated) return fallback(`duplicate_${duplicated}`, {
    locale: params.get("tg_locale"),
    market: params.get("tg_market"),
    product: params.get("tg_product"),
    campaign: params.get("tg_campaign"),
  });
  if (params.get("tg_return") !== RETURN_SOURCE) return fallback("unknown_source", {
    locale: params.get("tg_locale"),
    market: params.get("tg_market"),
    product: params.get("tg_product"),
    campaign: params.get("tg_campaign"),
  });

  const expiresAt = Number(params.get("tg_expires"));
  const now = contextNow(options.now);
  // Issuing a new link may choose a default TTL; reading an existing link must
  // never renew a malformed or overlong expiry into a fresh return context.
  if (Number.isFinite(expiresAt) && (!Number.isSafeInteger(expiresAt) || expiresAt - now > MAX_TTL_MS)) return fallback("invalid_expiry", {
    locale: params.get("tg_locale"),
    market: params.get("tg_market"),
    product: params.get("tg_product"),
    campaign: params.get("tg_campaign"),
  });
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return fallback("expired", {
    locale: params.get("tg_locale"),
    market: params.get("tg_market"),
    product: params.get("tg_product"),
    campaign: params.get("tg_campaign"),
  });

  const input = {
    venue: params.get("tg_venue"),
    pair: params.get("tg_pair"),
    activity: params.get("tg_activity"),
    route: params.get("tg_route"),
    market: params.get("tg_market"),
    product: params.get("tg_product"),
    locale: params.get("tg_locale") || params.get("locale"),
    campaign: params.get("tg_campaign"),
    accountStage: params.get("account_stage"),
    funding: params.get("funding"),
    scenario: params.get("scenario"),
    expiresAt,
    now,
  };
  const object = targetObject(input);
  if (object.kind === "hub") return fallback("unknown_object", input);

  return buildTelegramReturnContext(input);
}

export function telegramReturnDataAttrs(context) {
  if (!context) return {};
  return {
    "data-telegram-return-href": context.href,
    "data-telegram-return-status": context.status,
    "data-telegram-web-only-fallback": context.webOnly ? "true" : "false",
    ...(context.object?.kind ? { "data-telegram-return-kind": context.object.kind } : {}),
  };
}
