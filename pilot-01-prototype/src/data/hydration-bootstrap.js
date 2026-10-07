// Use the exact public prerender URL for the first React pass. Browser context
// is captured by the entrypoint before child effects and restored after mount.
import { applySafeAttributionToSearchParams, sanitizeTrackingMedium, sanitizeTrackingValue } from "./tracking-attribution.js";

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
    if (/^\/br(?:\/|$)/i.test(pathname)) {
      applySafeAttributionToSearchParams(url.searchParams, validBrAttributionPayload(prerenderState.brAttribution));
    }
    initialUrl = url.href;
  }
  return { hydrate, initialUrl, browserUrl };
}
