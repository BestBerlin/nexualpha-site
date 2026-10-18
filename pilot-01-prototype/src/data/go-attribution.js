import { SAFE_ATTRIBUTION_PARAMS, sanitizeTrackingValue } from './tracking-attribution.js';

const SAFE_SRC = /^[a-z0-9][a-z0-9_-]{0,47}$/;
const SAFE_PAGE = /^\/[A-Za-z0-9/_.~%-]{0,199}$/;
export function safeGoPage(value) {
  if (typeof value !== 'string' || value.startsWith('//') || !SAFE_PAGE.test(value)) return null;
  try { if (decodeURIComponent(value).includes('@')) return null; } catch { return null; }
  return value;
}
export const safeGoModule = value => typeof value === 'string' && SAFE_SRC.test(value) ? value : null;

// Keep the full page and placement separately; the bounded src remains useful to existing consumers.
export function attributedGoHref(href, location, placement, landingSearch = location.search) {
  let target;
  try { target = new URL(href, location.href); } catch { return href; }
  if (target.origin !== location.origin || !/^\/go\/[a-z0-9-]+$/.test(target.pathname)) return href;
  const page = safeGoPage(location.pathname) || '/';
  const module = safeGoModule(target.searchParams.get('module')) || safeGoModule(target.searchParams.get('src')) || safeGoModule(placement) || 'link';
  const pageTag = page === '/' ? 'home' : page.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 22) || 'page';
  target.searchParams.set('src', `${pageTag}--${module}`.slice(0, 48));
  target.searchParams.set('page', page);
  target.searchParams.set('module', module);
  const landing = new URLSearchParams(landingSearch || '');
  const current = new URLSearchParams(location.search || '');
  for (const key of SAFE_ATTRIBUTION_PARAMS) {
    const value = sanitizeTrackingValue(target.searchParams.get(key)) || sanitizeTrackingValue(current.get(key)) || sanitizeTrackingValue(landing.get(key));
    if (value) target.searchParams.set(key, value);
    else target.searchParams.delete(key);
  }
  return `${target.pathname}${target.search}${target.hash}`;
}

export function installGoAttribution({ window: win = globalThis.window, document: doc = globalThis.document } = {}) {
  if (!win || !doc || win.__nexuGoAttribution) return () => {};
  win.__nexuGoAttribution = true;
  const landingSearch = win.location.search;
  const decorate = event => {
    if (event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) return;
    const anchor = event.target?.closest?.('a[href]');
    if (!anchor || anchor.closest('[data-analytics-exclude]')) return;
    const href = anchor.getAttribute('href');
    if (href) anchor.setAttribute('href', attributedGoHref(href, win.location, anchor.dataset?.ctaPlacement, landingSearch));
  };
  // pointerdown includes context-menu/open-in-new-tab; click/auxclick include keyboard and middle-click navigation.
  for (const type of ['pointerdown', 'click', 'auxclick']) doc.addEventListener(type, decorate, true);
  return () => {
    for (const type of ['pointerdown', 'click', 'auxclick']) doc.removeEventListener(type, decorate, true);
    win.__nexuGoAttribution = false;
  };
}

// No partner has implicit permission to receive extra query parameters. Policy keys are exact HTTPS hostnames;
// values are approved parameter names, supplied by reviewed server configuration. Referral parameters always win.
export function partnerAttributionTarget(target, incoming, policy = {}) {
  let url;
  try { url = new URL(target); } catch { return target; }
  if (url.protocol !== 'https:' || url.username || url.password) return target;
  const allowed = Object.hasOwn(policy, url.hostname) ? policy[url.hostname] : [];
  if (!Array.isArray(allowed)) return target;
  let changed = false;
  for (const key of ['src', ...SAFE_ATTRIBUTION_PARAMS]) {
    if (!allowed.includes(key) || url.searchParams.has(key)) continue;
    const value = key === 'src' ? safeGoModule(incoming.get(key)) : sanitizeTrackingValue(incoming.get(key));
    if (value) { url.searchParams.set(key, value); changed = true; }
  }
  return changed ? url.href : target;
}

// Internal campaign fallbacks can retain attribution without granting partner forwarding permission.
export function retainGoAttribution(href, incoming) {
  const target = new URL(href, 'https://nexualpha.com');
  for (const key of ['page', 'module', ...SAFE_ATTRIBUTION_PARAMS]) {
    const raw = incoming.get(key);
    const value = key === 'page' ? safeGoPage(raw) : key === 'module' ? safeGoModule(raw) : sanitizeTrackingValue(raw);
    if (value) target.searchParams.set(key, value);
  }
  return `${target.pathname}${target.search}`;
}
