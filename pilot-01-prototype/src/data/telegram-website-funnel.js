import { localizedPath } from "./locale-routing.js";
import { buildTelegramReturnContext } from "./telegram-decision-return.js";
import { TELEGRAM_CONFIG, buildTelegramStartPayload, compactTelegramMetaValue, sanitizeTelegramStartPayload, telegramPayloadTag } from "./telegram-start-payload.js";

const TELEGRAM_WEBSITE_INTENTS = new Set(["selected", "compare", "fees", "monitor"]);

function compactSlug(value = "", fallback = "") {
  const cleaned = sanitizeTelegramStartPayload(String(value || "").toLowerCase().replace(/_/g, "-")).replace(/_/g, "-");
  return cleaned || fallback;
}

function normalizeWebsitePair(target = {}) {
  if (typeof target.pair === "string" && /^[a-z0-9-]+-vs-[a-z0-9-]+(?:-vs-[a-z0-9-]+)?$/i.test(target.pair.trim())) {
    return target.pair.trim().toLowerCase();
  }
  const slugs = Array.isArray(target.slugs) ? target.slugs : [target.venueA, target.venueB].filter(Boolean);
  const cleaned = slugs.map((slug) => compactSlug(slug)).filter(Boolean);
  return cleaned.length >= 2 ? cleaned.slice(0, 3).join("-vs-") : "binance-vs-okx";
}

function normalizeWebsiteVolume(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 10_000_000_000) return undefined;
  return String(Math.round((number + Number.EPSILON) * 100) / 100);
}

function encodeTelegramVolume(value) {
  if (value === undefined) return undefined;
  return String(value).replace(".", "p");
}

function normalizeWebsiteInstrument(value, product) {
  const normalized = String(value || product || "spot").toLowerCase();
  return ["futures", "perpetuals", "perp", "perps"].includes(normalized) ? "futures" : "spot";
}

export function telegramReturnParams(target = {}, extras = {}, { extrasFirst = false } = {}) {
  const params = extrasFirst ? { ...extras } : {};
  if (target.market && String(target.market).toLowerCase() !== "unknown") params.market = target.market;
  if (target.product && String(target.product).toLowerCase() !== "unknown") params.product = target.product;
  if (!extrasFirst) Object.assign(params, extras);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") delete params[key];
  }
  return params;
}

export function telegramLocalizedReturnHref(pathname = "/", locale = "en", params = {}) {
  const normalizedPathname = String(pathname || "/").startsWith("/") ? String(pathname || "/") : `/${pathname}`;
  const localized = localizedPath(normalizedPathname, locale);
  const [localizedPathname, localizedQuery = ""] = localized.split("?");
  const searchParams = new URLSearchParams(localizedQuery);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") searchParams.append(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `${localizedPathname}?${query}` : localizedPathname;
}

export function buildTelegramWebsiteFunnelContext(target = {}) {
  const intent = TELEGRAM_WEBSITE_INTENTS.has(target.intent) ? target.intent : "selected";
  const locale = target.locale || "en";
  const venue = compactSlug(target.venue, "binance");
  const botVenue = venue;
  const product = target.product || (target.instrument === "futures" ? "perpetuals" : "spot");
  const volume = normalizeWebsiteVolume(target.amount ?? target.volume ?? target.vol);
  const campaign = target.campaign || `website_${intent}`;

  if (intent === "compare") {
    const pair = normalizeWebsitePair(target);
    const botTarget = { action: "compare", pair, market: target.market, locale, product, campaign };
    const startPayload = buildTelegramWebsiteStartPayload(botTarget);
    const returnContext = target.returnRoute
      ? buildTelegramReturnContext({ route: target.returnRoute, market: target.market, locale, product, campaign, now: target.now, expiresAt: target.expiresAt })
      : buildTelegramReturnContext({ pair, market: target.market, locale, product, campaign, now: target.now, expiresAt: target.expiresAt });
    const returnHref = returnContext.href || telegramLocalizedReturnHref(`/compare/${pair}`, locale, telegramReturnParams(target, { compare: pair }));
    return { intent, botTarget, startPayload, deepLink: getTelegramDeepLinkFromPayload(startPayload), returnHref };
  }

  if (intent === "fees") {
    const instrument = normalizeWebsiteInstrument(target.instrument ?? target.type, product);
    const botTarget = { action: "fee_calc", venue: botVenue, type: instrument, vol: encodeTelegramVolume(volume), market: target.market, locale, product, campaign };
    const startPayload = buildTelegramWebsiteStartPayload(botTarget);
    const returnContext = target.returnRoute
      ? buildTelegramReturnContext({ route: target.returnRoute, market: target.market, locale, product, campaign, now: target.now, expiresAt: target.expiresAt })
      : buildTelegramReturnContext({ venue: botVenue, market: target.market, locale, product, campaign, now: target.now, expiresAt: target.expiresAt });
    const returnHref = returnContext.href || telegramLocalizedReturnHref("/embed/calculator", locale, telegramReturnParams(target, { scenario: "fees", venue: botVenue, instrument, volume, amount: volume }, { extrasFirst: true }));
    return { intent, botTarget, startPayload, deepLink: getTelegramDeepLinkFromPayload(startPayload), returnHref };
  }

  const botTarget = {
    action: intent === "selected" ? "saved_choice" : "monitor",
    venue,
    market: target.market,
    locale,
    product,
  };
  const startPayload = buildTelegramWebsiteStartPayload(botTarget);
  const returnContext = target.returnRoute
    ? buildTelegramReturnContext({ route: target.returnRoute, market: target.market, locale, product, campaign, now: target.now, expiresAt: target.expiresAt })
    : buildTelegramReturnContext({ venue, market: target.market, locale, product, campaign, now: target.now, expiresAt: target.expiresAt });
  const returnHref = returnContext.href || telegramLocalizedReturnHref(`/exchanges/${venue}`, locale, telegramReturnParams(target, { venue, amount: volume }));
  return { intent, botTarget, startPayload, deepLink: getTelegramDeepLinkFromPayload(startPayload), returnHref };
}

function getTelegramDeepLinkFromPayload(payload = "") {
  if (!payload) return TELEGRAM_CONFIG.botUrl;
  return `${TELEGRAM_CONFIG.botUrl}?start=${encodeURIComponent(payload)}`;
}

function buildTelegramWebsiteStartPayload(target = {}) {
  const standardPayload = buildTelegramStartPayload(target);
  if (!target.campaign || standardPayload.length === 64 || standardPayload.includes("_c_")) {
    return standardPayload;
  }

  const criticalMetaParts = [];
  if (target.market) criticalMetaParts.push(`m_${compactTelegramMetaValue(target.market, 8)}`);
  if (target.locale) criticalMetaParts.push(`l_${compactTelegramMetaValue(String(target.locale).replace(/-/g, ""), 8)}`);
  if (target.product) criticalMetaParts.push(`t_${compactTelegramMetaValue(target.product, 12)}`);
  const criticalSuffix = criticalMetaParts.length ? `_${criticalMetaParts.join("_")}` : "";
  const campaignPart = `c_${telegramPayloadTag(target.campaign)}`;

  let base = standardPayload;
  if (criticalSuffix && standardPayload.endsWith(criticalSuffix)) {
    base = standardPayload.slice(0, -criticalSuffix.length);
  }

  const suffix = `_${[campaignPart, ...criticalMetaParts].join("_")}`;
  if (base.length + suffix.length <= 64) return `${base}${suffix}`;

  const baseLimit = Math.max(1, 64 - suffix.length);
  const compactBase = sanitizeTelegramStartPayload(base).slice(0, baseLimit).replace(/_+$/g, "");
  return `${compactBase}${suffix}`.slice(0, 64);
}


