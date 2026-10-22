// Site click beacon (owner 2026-10-10). Sign-up buttons on the website keep linking straight to the partner URL
// (the deploy-time CTA guard compares those hrefs), so the click itself is reported out of band: the browser sends
// navigator.sendBeacon('/api/cta-click', {partner, src, path}) and this route appends
// {t, partner, src, ref: path, kind: "site"} plus sanitized attribution metadata to the same CLICK_EVENT_FILE the /go/<partner> redirect writes.
// Validation: partner must exist in the build's partner feed, src is a placement slug, path is a site path.
// Same classifier as /go. The raw IP stays in memory; only a daily-salted hash and coarse UA family are written
// (the home hero experiment adds only its id and the a/b bucket, read from the first-party nx_hero cookie).
import { clickStorage } from './click-storage.mjs';
import { analyticsOriginAllowed } from './analytics-origin.mjs';
import { clickMetadata, createClickClassifier, safeClickPath } from './click-metadata.mjs';
import { SRC, createPartnerMapLoader } from './go-redirect.mjs';
import { homeHeroClickContext } from '../src/data/home-hero-experiment.js';

export const CTA_CLICK_PATH = '/api/cta-click';
const PATH_RE = /^\/[A-Za-z0-9/_.~%-]{0,199}$/;
const MAX_BODY_BYTES = 1024;
const NO_STORE = { 'cache-control': 'no-store' };

export function validateCtaClick(value, partners) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const partner = typeof value.partner === 'string' ? value.partner.toLowerCase() : '';
  if (!partners.has(partner)) return null;
  const src = typeof value.src === 'string' && SRC.test(value.src) ? value.src : null;
  if (!src) return null;
  const ref = typeof value.path === 'string' && PATH_RE.test(value.path) ? safeClickPath(value.path) : null;
  if (!ref) return null;
  return { partner, src, ref };
}

// Fixed-window counter per client key. Keys are only held in memory and dropped once their window expires.
export function createRateLimiter({ limit = 30, windowMs = 60_000, now = Date.now } = {}) {
  const windows = new Map();
  let sweepAt = 0;
  return function allow(key) {
    const t = now();
    if (t >= sweepAt) {
      for (const [k, w] of windows) if (w.resetAt <= t) windows.delete(k);
      sweepAt = t + windowMs;
    }
    const w = windows.get(key);
    if (!w || w.resetAt <= t) { windows.set(key, { count: 1, resetAt: t + windowMs }); return true; }
    w.count += 1;
    return w.count <= limit;
  };
}

// Security audit 2026-10-15: the first X-Forwarded-For value is client-controlled (nginx appends, it does not
// replace), so rotating it bypassed the limit. Trust nginx's X-Real-IP ($remote_addr), then the last XFF hop.
export function clientKey(req) {
  const realIp = req?.headers?.['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim();
  const forwarded = req?.headers?.['x-forwarded-for'];
  const last = typeof forwarded === 'string' ? forwarded.split(',').map((part) => part.trim()).filter(Boolean).pop() : '';
  return last || req?.socket?.remoteAddress || 'unknown';
}

export function createCtaClickBeacon({ clientRoot, eventFile = null, now = () => new Date(), limit = 30, windowMs = 60_000, heroForce = null, registry, env = process.env, storage = clickStorage, origin, burst, allow = createRateLimiter({ limit, windowMs }), classify = createClickClassifier({ env, now: () => now().getTime(), ...(burst ? { burst } : {}) }) } = {}) {
  const partnerMap = createPartnerMapLoader(clientRoot);


  return async function handle(request, key = 'unknown') {
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { ...NO_STORE, allow: 'POST' } });
    if (!analyticsOriginAllowed(request, origin || new URL(request.url).origin, { allowMissingOrigin: true })) return new Response(null, { status: 403, headers: NO_STORE });
    if (!await allow(key)) return new Response(null, { status: 429, headers: { ...NO_STORE, 'retry-after': String(Math.ceil(windowMs / 1000)) } });
    const reader = request.body?.getReader();
    if (!reader) return new Response(null, { status: 400, headers: NO_STORE });
    let bytes = 0;
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) { await reader.cancel().catch(() => {}); return new Response(null, { status: 413, headers: NO_STORE }); }
      chunks.push(value);
    }
    let data;
    try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return new Response(null, { status: 400, headers: NO_STORE }); }
    let partners;
    try { partners = await partnerMap(); } catch { partners = new Map(); }
    const click = validateCtaClick(data, partners);
    if (!click) return new Response(null, { status: 400, headers: NO_STORE });
    const ua = request.headers.get('user-agent') || '';
    if (eventFile) {
      const at = now();
      const classification = await classify(request, { clientIp: key, partner: click.partner, at });
      if (classification.cls === 'internal') return new Response(null, { status: 204, headers: NO_STORE });
      // Home hero experiment (X5): {experiment, variant} from the visitor's bucket cookie while the experiment runs.
      const hero = homeHeroClickContext({ cookieHeader: request.headers.get('cookie') || '', userAgent: ua, force: heroForce, ...(registry ? { registry } : {}) });
      const metadata = clickMetadata({ path: click.ref, src: click.src });
      const written = await storage.write(eventFile, { t: at.toISOString(), ...click, kind: 'site', ...classification, ...Object.fromEntries(Object.entries(metadata).filter(([, value]) => value)), ...(hero || {}) }, 'site');
      if (!written) return new Response(null, { status: 503, headers: NO_STORE });
    }
    return new Response(null, { status: 204, headers: NO_STORE });
  };
}
