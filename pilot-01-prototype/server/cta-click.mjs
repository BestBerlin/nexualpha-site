// Site click beacon (owner 2026-10-10). Sign-up buttons on the website keep linking straight to the partner URL
// (the deploy-time CTA guard compares those hrefs), so the click itself is reported out of band: the browser sends
// navigator.sendBeacon('/api/cta-click', {partner, src, path}) and this route appends
// {t, partner, src, ref: path, kind: "site"} to the same CLICK_EVENT_FILE the /go/<partner> redirect writes.
// Validation: partner must exist in the build's partner feed, src is a placement slug, path is a site path.
// Same crawler filter as /go. Per-IP rate limit lives in memory only; no IP, cookie or user id is ever written.
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { BOT_UA, SRC, createPartnerMapLoader } from './go-redirect.mjs';

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
  const ref = typeof value.path === 'string' && PATH_RE.test(value.path) ? value.path : null;
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

export function clientKey(req) {
  const forwarded = req?.headers?.['x-forwarded-for'];
  const first = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';
  return first || req?.socket?.remoteAddress || 'unknown';
}

export function createCtaClickBeacon({ clientRoot, eventFile = null, now = () => new Date(), limit = 30, windowMs = 60_000 } = {}) {
  const partnerMap = createPartnerMapLoader(clientRoot);
  const allow = createRateLimiter({ limit, windowMs });
  if (eventFile) mkdir(path.dirname(eventFile), { recursive: true }).catch(() => {});

  return async function handle(request, key = 'unknown') {
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { ...NO_STORE, allow: 'POST' } });
    if (!allow(key)) return new Response(null, { status: 429, headers: { ...NO_STORE, 'retry-after': String(Math.ceil(windowMs / 1000)) } });
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
    if (eventFile && !BOT_UA.test(ua)) {
      appendFile(eventFile, `${JSON.stringify({ t: now().toISOString(), ...click, kind: 'site' })}\n`, { mode: 0o600 }).catch(() => {});
    }
    return new Response(null, { status: 204, headers: NO_STORE });
  };
}
