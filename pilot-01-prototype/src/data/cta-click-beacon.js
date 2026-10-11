// Site click beacon (owner 2026-10-10). Every sign-up button is rendered as
// <a data-cta-kind="registration" data-cta-platform="<slug>" data-cta-placement="<placement>" href=<partner URL>>.
// The href stays the partner link (the deploy-time CTA guard compares it), so the click is reported out of band with
// navigator.sendBeacon('/api/cta-click', {partner, src: placement, path}) and never delays or redirects navigation.
// Only partner, placement and the site path are sent: no IP, session or user id (see server/cta-click.mjs). The request
// is same-origin like every beacon, so the server can add the home hero experiment bucket (nx_hero cookie, a/b) to the row.
const SRC_RE = /^[a-z0-9][a-z0-9_-]{0,47}$/;
const PATH_RE = /^\/[A-Za-z0-9/_.~%-]{0,199}$/;
export const CTA_CLICK_ENDPOINT = '/api/cta-click';

export function ctaClickSource(placement) {
  const value = String(placement || '').trim().toLowerCase();
  return SRC_RE.test(value) ? value : 'unknown';
}

export function registrationAnchor(target) {
  const anchor = target?.closest?.('a[href]');
  if (!anchor || anchor.closest('[data-analytics-exclude]')) return null;
  return anchor.dataset?.ctaKind === 'registration' ? anchor : null;
}

// A visitor who arrived from an embedded widget carries ?src=embed-<kind> (the widget's footer link, see
// server/embed-widgets.mjs). That landing source wins over the button placement so clicks attribute to the embed.
const EMBED_SRC_RE = /^embed-[a-z0-9][a-z0-9-]{0,40}$/;
export function landingSource(search) {
  try {
    const value = new URLSearchParams(String(search || '')).get('src');
    return value && EMBED_SRC_RE.test(value) ? value : null;
  } catch { return null; }
}

export function ctaClickPayload(anchor, location = globalThis.location) {
  const data = anchor?.dataset || {};
  const partner = String(data.ctaPartner || data.ctaPlatform || '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{0,47}$/.test(partner)) return null;
  const pathname = String(location?.pathname || '/');
  return { partner, src: landingSource(location?.search) || ctaClickSource(data.ctaPlacement), path: PATH_RE.test(pathname) ? pathname : pathname.slice(0, 200) };
}

export function sendCtaClick(payload, { navigator: nav = globalThis.navigator, fetcher = globalThis.fetch } = {}) {
  if (!payload) return false;
  const body = JSON.stringify(payload);
  try {
    if (typeof nav?.sendBeacon === 'function') return nav.sendBeacon(CTA_CLICK_ENDPOINT, new Blob([body], { type: 'application/json' }));
  } catch { /* fall through to fetch */ }
  if (typeof fetcher !== 'function') return false;
  // same-origin (like sendBeacon): the server reads only the home hero experiment bucket cookie (nx_hero) from it.
  fetcher(CTA_CLICK_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true, credentials: 'same-origin' }).catch(() => {});
  return true;
}

export function installCtaClickBeacon({ window: win = globalThis.window, document: doc = globalThis.document } = {}) {
  if (!win || !doc || win.__nexuCtaClickBeacon) return () => {};
  win.__nexuCtaClickBeacon = true;
  // Automated browsers would pollute the click log; real visitors are the only audience of this counter.
  if (win.navigator?.webdriver) return () => {};
  const onClick = (event) => {
    if (!event.isTrusted || event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) return;
    const anchor = registrationAnchor(event.target);
    if (!anchor) return;
    sendCtaClick(ctaClickPayload(anchor, win.location));
  };
  doc.addEventListener('click', onClick, { capture: true, passive: true });
  doc.addEventListener('auxclick', onClick, { capture: true, passive: true });
  return () => { doc.removeEventListener('click', onClick, true); doc.removeEventListener('auxclick', onClick, true); win.__nexuCtaClickBeacon = false; };
}
