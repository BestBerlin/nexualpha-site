import { EXCHANGE_KEY_FACT_SHEETS } from "./exchange-key-facts.generated.js";
import { promotionCountries } from "./partner-geo-policy.js";

export const EXCHANGE_KEY_FACT_SLUGS = Object.freeze(Object.keys(EXCHANGE_KEY_FACT_SHEETS));
// A build-time source snapshot shared by profile SSR, hydration and the GET endpoint.
export function exchangeKeyFacts(slug, context = {}) {
  if (slug === "bitget" && (context.locale === "tr" || promotionCountries(context).includes("TR"))) return null;
  return Object.hasOwn(EXCHANGE_KEY_FACT_SHEETS, slug) ? EXCHANGE_KEY_FACT_SHEETS[slug] : null;
}

const LICENSE_SOURCE_STATUSES = new Set(["licensed", "registered", "applied", "restricted", "banned", "liquidation list", "warning", "revoked", "withdrawn"]);
const CODE_SOURCE_STATUSES = new Set(["verified", "source-backed", "confirmed"]);
const isoDayTime = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(time)) return null;
  return new Date(time).toISOString().startsWith(value) ? time : null;
};
const verifiedLastDateRow = (row) => {
  const id = String(row?.id || "");
  if (id.endsWith("-fees")) return true;
  if (id.startsWith("license-")) return LICENSE_SOURCE_STATUSES.has(String(row?.value?.status || "").toLowerCase());
  if (/(?:invite|referral|code)/i.test(id)) {
    const status = String(row?.value?.status || "").toLowerCase();
    return row?.value?.verified === true || CODE_SOURCE_STATUSES.has(status);
  }
  return false;
};

export function exchangeLastVerifiedDate(slug) {
  const sheet = Object.hasOwn(EXCHANGE_KEY_FACT_SHEETS, slug) ? EXCHANGE_KEY_FACT_SHEETS[slug] : null;
  const dated = (sheet?.rows || [])
    .filter(verifiedLastDateRow)
    .map((row) => ({ day: row.checkedOn, time: isoDayTime(row.checkedOn) }))
    .filter((row) => row.time !== null)
    .sort((a, b) => a.time - b.time);
  return dated.at(-1)?.day || null;
}

export function exchangeFactsResponse(request) {
  const url = new URL(request.url);
  const match = /^\/api\/exchange-facts\/([a-z0-9-]+)\.json$/.exec(url.pathname);
  const headers = { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "x-content-type-options": "nosniff" };
  if (!["GET", "HEAD"].includes(request.method)) return new Response(null, { status: 405, headers: { ...headers, allow: "GET, HEAD", "cache-control": "no-store" } });
  const sheet = match && exchangeKeyFacts(match[1], { locale: url.searchParams.get("locale") || "en", market: url.searchParams.get("market") });
  return new Response(request.method === "HEAD" ? null : JSON.stringify(sheet || { error: "Not found" }), {
    status: sheet ? 200 : 404, headers: { ...headers, "cache-control": sheet ? "public, max-age=3600" : "no-store" },
  });
}
