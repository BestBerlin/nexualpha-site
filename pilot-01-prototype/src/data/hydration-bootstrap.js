import { parseBeginnerPath } from "./beginner-routes.js";
// Use the exact public prerender URL for the first React pass. Browser context
// is captured by the entrypoint before child effects and restored after mount.
import { appendFragmentContextParams } from "./locale-routing.js";
import { sanitizeTrackingMedium, sanitizeTrackingValue } from "./tracking-attribution.js";

function validBrAttributionPayload(value) {
  if (!value || typeof value !== "object") return null;
  const source = sanitizeTrackingValue(value.source);
  const medium = sanitizeTrackingMedium(value.medium);
  const campaign = sanitizeTrackingValue(value.campaign);
  return source || medium || campaign ? { source, medium, campaign } : null;
}

export function buildHydrationBootstrap({ browserUrl, prerenderState, hasServerHtml, clientRender = false } = {}) {
  const hydrate = Boolean(hasServerHtml && !clientRender);
  const pathname = prerenderState?.pathname;
  const hasPrerenderUrl = hydrate && typeof pathname === "string" && pathname.startsWith("/") && !pathname.startsWith("//") && !/[?#]/.test(pathname);
  let initialUrl = browserUrl;
  if (hasPrerenderUrl) {
    const url = new URL(pathname, browserUrl || "https://nexualpha.com");
    // Explicit English prevents a saved browser language changing neutral SSR.
    url.searchParams.set("locale", prerenderState.locale || "en");
    // Runtime home funding is rendered with the requested market and product context.
    if (parseBeginnerPath(pathname) || pathname === "/guides/bitget-first-trade") {
      const market = prerenderState.beginnerContext?.market;
      if (typeof market === "string" && market && market.length <= 64) url.searchParams.set("market", market);
    }
    if (pathname === "/" && prerenderState.homeContext) {
      for (const key of ["market", "product", "account_stage", "funding"]) {
        const value = prerenderState.homeContext[key];
        if (typeof value === "string" && value && value.length <= 64) url.searchParams.set(key, value);
      }
    }
    // Activity pages render these gates at request time; hydrate the same market instead of briefly exposing an unscoped CTA.
    if (/^\/activities(?:\/|$)/.test(pathname) && prerenderState.activityContext) {
      for (const key of ["market", "product", "account_stage", "funding"]) {
        const value = prerenderState.activityContext[key];
        if (typeof value === "string" && value && value.length <= 64) url.searchParams.set(key, value);
      }
    }
    // App download registration uses the same explicit market on the first client render as request-time SSR.
    if (/^\/exchanges\/[^/]+\/app$/.test(pathname) && prerenderState.appDownloadContext) {
      for (const key of ["market", "product", "account_stage", "funding"]) {
        const value = prerenderState.appDownloadContext[key];
        if (typeof value === "string" && value && value.length <= 64) url.searchParams.set(key, value);
      }
    }
    if (/^\/br(?:\/|$)/i.test(pathname)) {
      const attribution = validBrAttributionPayload(prerenderState.brAttribution);
      if (attribution) {
        const context = {
          utm_source: attribution.source,
          utm_medium: attribution.medium,
          utm_campaign: attribution.campaign,
          locale: url.searchParams.get("locale") || prerenderState.locale || "pt-BR",
        };
        url.search = "";
        initialUrl = new URL(appendFragmentContextParams(url.pathname, context), url).href;
      } else {
        initialUrl = url.href;
      }
    } else {
      initialUrl = url.href;
    }
  }
  return { hydrate, initialUrl, browserUrl };
}
