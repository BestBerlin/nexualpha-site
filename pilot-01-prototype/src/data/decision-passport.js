import { REGIONAL_FUNDING_VERIFICATION_MATRIX } from "./regional-funding-verification-matrix.js";
import { venueDatabase } from "./venue-database.js";

const MARKET_RE = /^(?:unknown|global|OTHER|[A-Z]{2}|EU|UK)$/;
const PRODUCTS = new Set(["unknown", "spot", "futures", "perpetuals", "perp_dex", "dex", "cex", "copy_trading", "earn", "wallet"]);
const ACCOUNT_STAGES = new Set(["new_account", "another_platform", "existing_account"]);
const ANONYMOUS_DECISION_RESUME_VERSION = 1;
export const ANONYMOUS_DECISION_RESUME_STORAGE_KEY = "nexualpha:anonymous-decision-resume:v1";
const RESUME_SCENARIOS = new Set(["fees", "cost", "compare", "venue", "selected", "monitor"]);
const PROTECTED_RESUME_KEY_RE = /(?:referral|ref_code|invite|invite_code|inviteCode|user_id|userid|telegram_id|telegramUser|identity|email|wallet|address|external|outbound|href|url|link)/i;
const PROTECTED_RESUME_VALUE_RE = /(?:https?:|accounts\.|register|signup|invite|referral|inviteCode|invite_code|nexu888|11350287|luckybitcoin)/i;

const fundingByMarket = new Map(REGIONAL_FUNDING_VERIFICATION_MATRIX.map((row) => [
  row.market,
  new Map(row.paymentRails.map((rail) => [rail.toLocaleLowerCase("en-US"), rail])),
]));

// The HK route historically used an English stable token in saved URLs while
// the zh-Hant Telegram resume flow uses the localized label. Accept both and
// preserve whichever verified token entered the decision passport.
fundingByMarket.get("HK")?.set("hkd 銀行轉帳", "HKD 銀行轉帳");

export function sanitizeDecisionMarket(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const lowered = trimmed.toLowerCase();
  const normalized = lowered === "unknown" ? "unknown"
    : lowered === "global" ? "global"
      : lowered === "other" ? "OTHER"
        : trimmed.toUpperCase();
  return MARKET_RE.test(normalized) ? normalized : null;
}

export function sanitizeDecisionProduct(value) {
  if (typeof value !== "string") return null;
  const raw = value.trim().toLowerCase().replace(/-/g, "_");
  const normalized = raw === "perp" ? "perpetuals" : raw;
  return PRODUCTS.has(normalized) ? normalized : null;
}

export function sanitizeDecisionAccountStage(value) {
  return typeof value === "string" && ACCOUNT_STAGES.has(value.trim()) ? value.trim() : null;
}

export function sanitizeDecisionFunding(value, market) {
  if (typeof value !== "string") return null;
  const normalizedMarket = sanitizeDecisionMarket(market);
  const options = fundingByMarket.get(normalizedMarket);
  if (!options) return null;
  return options.get(value.trim().toLocaleLowerCase("en-US")) || null;
}

export function readDecisionPassport(search = "", overrides = {}) {
  const params = new URLSearchParams(search || "");
  const market = sanitizeDecisionMarket(overrides.market) || sanitizeDecisionMarket(params.get("market"));
  const product = sanitizeDecisionProduct(overrides.product) || sanitizeDecisionProduct(params.get("product"));
  const accountStage = sanitizeDecisionAccountStage(overrides.accountStage) || sanitizeDecisionAccountStage(params.get("account_stage"));
  const funding = sanitizeDecisionFunding(overrides.funding, market) || sanitizeDecisionFunding(params.get("funding"), market);
  return {
    ...(market && market !== "unknown" ? { market } : {}),
    ...(product && product !== "unknown" ? { product } : {}),
    ...(accountStage ? { accountStage } : {}),
    ...(funding ? { funding } : {}),
  };
}

export function buildDecisionPassportQuery(input = {}) {
  const passport = readDecisionPassport("", input);
  const params = new URLSearchParams();
  if (passport.market) params.set("market", passport.market);
  if (passport.product) params.set("product", passport.product);
  if (passport.accountStage) params.set("account_stage", passport.accountStage);
  if (passport.funding) params.set("funding", passport.funding);
  return params;
}

export function appendDecisionPassportQuery(href, input = {}) {
  const passport = buildDecisionPassportQuery(input);
  if (!passport.size) return href;
  const [pathAndSearch, hash = ""] = String(href || "").split("#");
  const target = new URL(pathAndSearch, "https://nexualpha.com");
  for (const [key, value] of passport) target.searchParams.set(key, value);
  return `${target.pathname}${target.search}${hash ? `#${hash}` : ""}`;
}


function hasProtectedResumeMaterial(value) {
  if (!value || typeof value !== "object") return false;
  for (const [key, nested] of Object.entries(value)) {
    if (PROTECTED_RESUME_KEY_RE.test(key)) return true;
    if (typeof nested === "string" && PROTECTED_RESUME_VALUE_RE.test(nested)) return true;
    if (nested && typeof nested === "object" && hasProtectedResumeMaterial(nested)) return true;
  }
  return false;
}

export function sanitizeDecisionScenario(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/-/g, "_");
  return RESUME_SCENARIOS.has(normalized) ? normalized : null;
}

export function sanitizeDecisionVenue(value) {
  if (typeof value !== "string" || PROTECTED_RESUME_VALUE_RE.test(value)) return null;
  const slug = value.trim().toLowerCase().replace(/_/g, "-");
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(slug) && Object.hasOwn(venueDatabase, slug) ? slug : null;
}

export function sanitizeDecisionPair(value) {
  if (typeof value !== "string" || PROTECTED_RESUME_VALUE_RE.test(value)) return null;
  const slugs = value.trim().toLowerCase().split("-vs-").map((slug) => sanitizeDecisionVenue(slug));
  if (slugs.length < 2 || slugs.length > 3 || slugs.some((slug) => !slug) || new Set(slugs).size !== slugs.length) return null;
  return slugs.join("-vs-");
}

function resumeStateFrom(input = {}) {
  if (!input || typeof input !== "object") return null;
  const market = sanitizeDecisionMarket(input.market);
  const product = sanitizeDecisionProduct(input.product);
  const accountStage = sanitizeDecisionAccountStage(input.accountStage ?? input.account_stage);
  const funding = sanitizeDecisionFunding(input.funding, market);
  const scenario = sanitizeDecisionScenario(input.scenario);
  const venue = sanitizeDecisionVenue(input.venue);
  const pair = sanitizeDecisionPair(input.pair);
  const state = {
    ...(market && market !== "unknown" ? { market } : {}),
    ...(product && product !== "unknown" ? { product } : {}),
    ...(accountStage ? { accountStage } : {}),
    ...(funding ? { funding } : {}),
    ...(scenario ? { scenario } : {}),
    ...(venue ? { venue } : {}),
    ...(pair ? { pair } : {}),
  };
  return Object.keys(state).length ? state : null;
}

export function buildAnonymousDecisionResumeSnapshot(input = {}) {
  const state = resumeStateFrom(input);
  return state ? { version: ANONYMOUS_DECISION_RESUME_VERSION, anonymousOnly: true, state } : null;
}

export function readAnonymousDecisionResumeSnapshot(raw) {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || parsed.version !== ANONYMOUS_DECISION_RESUME_VERSION || parsed.anonymousOnly !== true) return null;
    if (hasProtectedResumeMaterial(parsed.state)) return null;
    return buildAnonymousDecisionResumeSnapshot(parsed.state);
  } catch {
    return null;
  }
}

export function saveAnonymousDecisionResumeSnapshot(storage, input = {}) {
  try {
    const snapshot = buildAnonymousDecisionResumeSnapshot(input);
    if (!snapshot) return false;
    storage?.setItem?.(ANONYMOUS_DECISION_RESUME_STORAGE_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

export function loadAnonymousDecisionResumeSnapshot(storage) {
  try {
    return readAnonymousDecisionResumeSnapshot(storage?.getItem?.(ANONYMOUS_DECISION_RESUME_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function clearAnonymousDecisionResumeSnapshot(storage) {
  try {
    storage?.removeItem?.(ANONYMOUS_DECISION_RESUME_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function buildAnonymousDecisionResumeQuery(input = {}) {
  const snapshot = buildAnonymousDecisionResumeSnapshot(input);
  const params = new URLSearchParams();
  const state = snapshot?.state || {};
  if (state.market) params.set("market", state.market);
  if (state.product) params.set("product", state.product);
  if (state.accountStage) params.set("account_stage", state.accountStage);
  if (state.funding) params.set("funding", state.funding);
  if (state.scenario) params.set("scenario", state.scenario);
  if (state.venue) params.set("venue", state.venue);
  if (state.pair) params.set("pair", state.pair);
  return params;
}
