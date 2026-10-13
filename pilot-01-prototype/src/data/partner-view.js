import { isNeutralCtaLocale } from "./locale-policy.js";
import { partnerRegistry } from "./partner-registry.js";
import { findProgramPartner, safePartnerId } from "./partners-program.js";
import { parsePublicRoute } from "./locale-routing.js";

const GO_PATH = /^\/go\/[a-z0-9-]+(?:[?#]|$)/;
const SRC_RE = /^[a-z0-9][a-z0-9_-]{0,47}$/;

function urlFor(href) {
  try { return new URL(String(href || ""), "https://nexualpha.com"); } catch { return null; }
}

export function partnerViewContext(source, { registry, locale } = {}) {
  const url = source instanceof URL ? source : urlFor(source || "/");
  const id = safePartnerId(url?.searchParams?.get("p") || "");
  const partner = id ? findProgramPartner(id, registry) : null;
  const viewLocale = locale || url?.searchParams?.get("locale") || (url ? parsePublicRoute(url.pathname, url.searchParams).locale : "") || documentLocale();
  if (!partner || isNeutralCtaLocale(viewLocale) || !partner.locales?.includes(viewLocale)) return null;
  return { id, locale: viewLocale, partner };
}

function documentLocale() {
  if (typeof document === "undefined") return "en";
  return document.documentElement?.lang || "en";
}

export function partnerGoHref(href, context, { src } = {}) {
  if (!context?.id) return href;
  const target = urlFor(href);
  if (!target || target.origin !== "https://nexualpha.com" || !GO_PATH.test(`${target.pathname}${target.search}${target.hash}`)) return href;
  target.searchParams.set("p", context.id);
  target.searchParams.set("locale", context.locale || "en");
  if (SRC_RE.test(src || "") && !target.searchParams.has("src")) target.searchParams.set("src", src);
  return `${target.pathname}${target.search}${target.hash}`;
}

export function venueGoHref(venue, context, { src } = {}) {
  const slug = String(venue || "").toLowerCase();
  if (!partnerRegistry[slug]?.hasReferral) return null;
  return partnerGoHref(`/go/${slug}`, context, { src });
}

export function rewritePartnerViewHtml(html, sourceUrl, { registry, locale } = {}) {
  const context = partnerViewContext(sourceUrl, { registry, locale });
  if (!context || typeof html !== "string") return html;
  return html.replace(/<a\b([^>]*?)\bhref="([^"]+)"([^>]*)>/g, (match, before, rawHref, after) => {
    const attrs = `${before} ${after}`;
    const href = rawHref.replaceAll("&amp;", "&");
    let next = href.startsWith("/go/") ? partnerGoHref(href, context) : href;
    if (next === href && /\bdata-cta-kind="registration"/.test(attrs)) {
      const venue = /\bdata-cta-platform="([^"]+)"/.exec(attrs)?.[1];
      const src = /\bdata-cta-placement="([^"]+)"/.exec(attrs)?.[1];
      next = venueGoHref(venue, context, { src }) || href;
    }
    return next === href ? match : `<a${before}href="${next.replaceAll("&", "&amp;")}"${after}>`;
  });
}

function rewriteAnchor(anchor, context) {
  const href = anchor.getAttribute("href") || "";
  if (href.startsWith("/go/")) {
    const next = partnerGoHref(href, context, { src: anchor.dataset?.ctaPlacement });
    if (next !== href) anchor.setAttribute("href", next);
    return;
  }
  if (anchor.dataset?.ctaKind !== "registration") return;
  const next = venueGoHref(anchor.dataset.ctaPlatform, context, { src: anchor.dataset.ctaPlacement });
  if (next) anchor.setAttribute("href", next);
}

export function installPartnerViewPropagation({ window: win = globalThis.window, document: doc = globalThis.document, registry } = {}) {
  if (!win || !doc || win.__nexuPartnerViewPropagation) return () => {};
  const currentContext = () => partnerViewContext(win.location?.href, { registry, locale: doc.documentElement?.lang || "en" });
  if (!currentContext()) return () => {};
  win.__nexuPartnerViewPropagation = true;
  const apply = (root = doc) => {
    const context = currentContext();
    if (!context) return;
    if (root.matches?.("a[href]")) rewriteAnchor(root, context);
    root.querySelectorAll?.("a[href]")?.forEach((anchor) => rewriteAnchor(anchor, context));
  };
  apply();
  const onPointer = (event) => {
    const context = currentContext();
    if (!context) return;
    const anchor = event.target?.closest?.("a[href]");
    if (anchor) rewriteAnchor(anchor, context);
  };
  const observer = typeof MutationObserver === "function" ? new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes || []) if (node?.nodeType === 1) apply(node);
    }
  }) : null;
  observer?.observe(doc.documentElement, { childList: true, subtree: true });
  doc.addEventListener("pointerdown", onPointer, { capture: true, passive: true });
  doc.addEventListener("click", onPointer, { capture: true, passive: true });
  doc.addEventListener("keydown", onPointer, { capture: true, passive: true });
  doc.addEventListener("focusin", onPointer, { capture: true });
  return () => {
    observer?.disconnect();
    doc.removeEventListener("pointerdown", onPointer, true);
    doc.removeEventListener("click", onPointer, true);
    doc.removeEventListener("keydown", onPointer, true);
    doc.removeEventListener("focusin", onPointer, true);
    win.__nexuPartnerViewPropagation = false;
  };
}
