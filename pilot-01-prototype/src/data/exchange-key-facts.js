import { EXCHANGE_KEY_FACT_SHEETS } from "./exchange-key-facts.generated.js";
import { promotionCountries } from "./partner-geo-policy.js";

export const EXCHANGE_KEY_FACT_SLUGS = Object.freeze(Object.keys(EXCHANGE_KEY_FACT_SHEETS));
// A build-time source snapshot shared by profile SSR, hydration and the GET endpoint.
export function exchangeKeyFacts(slug, context = {}) {
  if (slug === "bitget" && (context.locale === "tr" || promotionCountries(context).includes("TR"))) return null;
  return Object.hasOwn(EXCHANGE_KEY_FACT_SHEETS, slug) ? EXCHANGE_KEY_FACT_SHEETS[slug] : null;
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
