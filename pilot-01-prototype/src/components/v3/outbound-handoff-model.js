export const NO_HANDOFF_COUNTRY = "";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const ISO_REGION_CODES = [
  "AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ",
  "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW", "BV", "BR",
  "IO", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "KY", "CF", "TD", "CL", "CN", "CX", "CC",
  "CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CW", "CY", "CZ", "DK", "DJ", "DM", "DO",
  "EC", "EG", "SV", "GQ", "ER", "EE", "SZ", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF",
  "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY",
  "HT", "HM", "VA", "HN", "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM",
  "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY",
  "LI", "LT", "LU", "MO", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX",
  "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI",
  "NE", "NG", "NU", "NF", "MK", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH",
  "PN", "PL", "PT", "PR", "QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC",
  "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SX", "SK", "SI", "SB", "SO", "ZA", "GS",
  "SS", "ES", "LK", "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK",
  "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU",
  "VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW",
];

export function countryOptionsForLocale(locale) {
  let displayNames = null;
  try {
    displayNames = new Intl.DisplayNames([locale || "en"], { type: "region" });
  } catch {
    displayNames = null;
  }
  return ISO_REGION_CODES.map((code) => ({
    code,
    label: displayNames?.of(code) ? `${displayNames.of(code)} (${code})` : code,
  }));
}

export function buildOfferLookupPath(venueSlug, country) {
  if (!country) throw new Error("HANDOFF_COUNTRY_REQUIRED");
  return `/api/v1/venues/${encodeURIComponent(venueSlug)}/outbound-offer?country=${encodeURIComponent(country)}`;
}

export function offerIdentity(offer) {
  if (!offer) return "";
  return [offer.offerId, offer.offerVersion, offer.country, offer.disclosureVersion].join("::");
}

export function buildHandoffPayload(offer, idempotencyKey) {
  return {
    offerId: offer.offerId,
    offerVersion: offer.offerVersion,
    country: offer.country,
    disclosureVersion: offer.disclosureVersion,
    accepted: true,
    idempotencyKey,
  };
}

export function createHandoffIdempotencyKey(cryptoSource = globalThis.crypto) {
  if (cryptoSource?.randomUUID) return cryptoSource.randomUUID();
  if (!cryptoSource?.getRandomValues) throw new Error("HANDOFF_UUID_UNAVAILABLE");

  const bytes = new Uint8Array(16);
  cryptoSource.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function validateOfferPayload(data, expectedVenueSlug, expectedCountry) {
  if (!data || typeof data !== "object") throw new Error("HANDOFF_OFFER_INVALID");
  const offer = data.data ?? data;
  if (!offer || typeof offer !== "object") throw new Error("HANDOFF_OFFER_INVALID");

  for (const field of ["offerId", "venueSlug", "officialHost", "disclosureText", "disclosureVersion", "country", "expiresAt"]) {
    if (typeof offer[field] !== "string" || !offer[field].trim()) throw new Error("HANDOFF_OFFER_INVALID");
  }
  if (!isUuid(offer.offerId)) throw new Error("HANDOFF_OFFER_INVALID");
  if (!Number.isSafeInteger(offer.offerVersion) || offer.offerVersion <= 0) throw new Error("HANDOFF_OFFER_INVALID");
  if (offer.venueSlug !== expectedVenueSlug) throw new Error("HANDOFF_OFFER_INVALID");
  if (offer.country !== expectedCountry) throw new Error("HANDOFF_OFFER_INVALID");
  if (!/^[a-z0-9.-]+$/i.test(offer.officialHost) || offer.officialHost.includes("..")) throw new Error("HANDOFF_OFFER_INVALID");
  const expiresAt = Date.parse(offer.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) throw new Error("HANDOFF_OFFER_STALE");
  return offer;
}

export function validateHandoffResponse(data) {
  if (!data || typeof data !== "object") throw new Error("HANDOFF_RESPONSE_UNSAFE");
  const handoff = data.data ?? data;
  if (!handoff || typeof handoff !== "object") throw new Error("HANDOFF_RESPONSE_UNSAFE");
  if (!isUuid(handoff.id)) throw new Error("HANDOFF_RESPONSE_UNSAFE");
  if (handoff.handoffRequested !== true) throw new Error("HANDOFF_RESPONSE_UNSAFE");
  if (handoff.disposition !== "ELIGIBLE_NO_NAVIGATION") throw new Error("HANDOFF_RESPONSE_UNSAFE");
  if (handoff.navigationRecorded !== false || handoff.conversionRecorded !== false) throw new Error("HANDOFF_RESPONSE_UNSAFE");
  if (typeof handoff.destination !== "string" || typeof handoff.officialHost !== "string") throw new Error("HANDOFF_RESPONSE_UNSAFE");
  return handoff;
}

export function validateSafeDestination(destination, officialHost) {
  let url;
  try {
    url = new URL(destination);
  } catch {
    throw new Error("HANDOFF_DESTINATION_UNSAFE");
  }

  if (destination.length > 4096 || /[\s\\]/u.test(destination)) throw new Error("HANDOFF_DESTINATION_UNSAFE");
  if (url.protocol !== "https:") throw new Error("HANDOFF_DESTINATION_UNSAFE");
  if (url.hostname !== officialHost) throw new Error("HANDOFF_DESTINATION_UNSAFE");
  if (url.username || url.password) throw new Error("HANDOFF_DESTINATION_UNSAFE");
  if (url.hash || url.port) throw new Error("HANDOFF_DESTINATION_UNSAFE");
  if (!url.hostname.includes(".") || url.hostname.endsWith(".") || /^[\d.]+$/.test(url.hostname)) throw new Error("HANDOFF_DESTINATION_UNSAFE");
  if (url.href !== destination) throw new Error("HANDOFF_DESTINATION_UNSAFE");
  return url.toString();
}

export function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
