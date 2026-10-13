import { readFile } from 'node:fs/promises';
import { timingSafeEqual } from 'node:crypto';
import { partnersProgram, findProgramPartner } from '../src/data/partners-program.js';
import { partnerRegistry } from '../src/data/partner-registry.js';
import { isNeutralCtaLocale } from '../src/data/locale-policy.js';
import { localizedPath, LOCALE_PREFIX_BY_CODE } from '../src/data/locale-routing.js';

// Accept links only on the venue's approved registration hosts. Codes replace the
// main code in its existing path/query, without inventing a venue parameter.
function carriesSubCode(target, configured, code) {
  if (code != null && (typeof code !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(code))) return false;
  const mainCodes = new Set([configured.inviteCode, ...(configured.inviteCodes || [])].filter(Boolean));
  const accepts = (value) => /^[a-zA-Z0-9_-]{1,100}$/.test(value || '') && (!code || value === code);
  for (const href of [configured.registrationUrl, ...(configured.alternateRegistrationUrls || [])]) {
    const registered = new URL(href);
    for (const [key, value] of registered.searchParams) {
      if (mainCodes.has(value) && target.pathname === registered.pathname && accepts(target.searchParams.get(key))) return true;
    }
    const parts = registered.pathname.split('/');
    if (mainCodes.has(parts.at(-1))) {
      const candidate = target.pathname.split('/');
      if (parts.slice(0, -1).join('/') === candidate.slice(0, -1).join('/') && accepts(candidate.at(-1))) return true;
    }
  }
  return false;
}

export function programTarget(partner, venue, fallback) {
  const entry = partner?.codes?.[venue];
  if (!entry || !fallback) return fallback;
  const configured = partnerRegistry[venue];
  if (!configured?.hasReferral) return fallback;
  const code = typeof entry === 'string' ? entry : entry.code;
  if (typeof entry === 'object' && entry.url) {
    try {
      const target = new URL(entry.url);
      const hosts = [configured.registrationUrl, ...(configured.alternateRegistrationUrls || []), `https://${configured.officialDomain}`].map((href) => new URL(href).hostname);
      if (target.protocol === 'https:' && !target.username && !target.password && !target.port && hosts.includes(target.hostname) && carriesSubCode(target, configured, code)) return target.href;
    } catch { /* fail closed to the main registered link */ }
    return fallback;
  }
  if (typeof code !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(code)) return fallback;
  const target = new URL(fallback);
  const main = configured.inviteCode;
  if (!main) return fallback;
  let replaced = false;
  for (const [key, value] of target.searchParams) {
    if (value === main) { target.searchParams.set(key, code); replaced = true; }
  }
  target.pathname = target.pathname.split('/').map((segment) => {
    if (segment === main) { replaced = true; return code; }
    return segment;
  }).join('/');
  return replaced ? target.href : fallback;
}
export function programPartnerForRequest(url, request, registry = partnersProgram) {
  const partner = findProgramPartner(url.searchParams.get('p'), registry);
  if (!partner) return null;
  const locale = url.searchParams.get('locale') || url.searchParams.get('lang') || 'en';
  if (isNeutralCtaLocale(locale) || !partner.locales?.includes(locale)) return null;
  return partner;
}
const headers = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'no-referrer' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'content-type': 'application/json; charset=utf-8' } });
export function createPartnerProgram({ eventFile, tokens = {}, registry = partnersProgram } = {}) {
  return async (request) => {
    const url = new URL(request.url);
    const landing = /^\/p\/([^/]+)$/.exec(url.pathname);
    const stats = /^\/(?:api\/partner-stats|partners\/stats)\/([^/]+)$/.exec(url.pathname);
    if (!landing && !stats) return null;
    if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'Method not allowed' }, 405);
    const id = (landing || stats)[1];
    const partner = findProgramPartner(id, registry);
    if (landing) {
      const locale = url.searchParams.get('locale') || partner?.locales?.[0] || 'en';
      if (!partner || isNeutralCtaLocale(locale) || !partner.locales?.includes(locale) || !(locale in LOCALE_PREFIX_BY_CODE)) return json({ error: 'Not found' }, 404);
      const target = new URL(localizedPath('/exchanges', locale), url.origin);
      target.searchParams.set('p', id);
      const src = url.searchParams.get('src');
      if (/^[a-z0-9][a-z0-9_-]{0,47}$/.test(src || '')) target.searchParams.set('src', src);
      return new Response(null, { status: 302, headers: { ...headers, location: target.pathname + target.search } });
    }
    const expected = tokens && !Array.isArray(tokens) && Object.hasOwn(tokens, id) ? tokens[id] : null;
    const supplied = url.searchParams.get('t') || '';
    if (!partner || typeof expected !== 'string' || expected.length < 24 || supplied.length > 512 || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return json({ error: 'Unauthorized' }, 401);
    if (!eventFile) return json({ error: 'Click logging is not configured' }, 503);
    let raw;
    try { raw = await readFile(eventFile, 'utf8'); } catch (error) {
      if (error.code !== 'ENOENT') return json({ error: 'Click log unavailable' }, 503);
      raw = '';
    }
    const counts = new Map();
    for (const line of raw.split('\n')) {
      let row;
      try { row = JSON.parse(line); } catch { continue; }
      if (row.partnerId !== id || !/^\d{4}-\d{2}-\d{2}T/.test(row.t || '')) continue;
      const venue = row.venue || row.partner;
      if (!Object.hasOwn(partnerRegistry, venue)) continue;
      const day = row.t.slice(0, 10);
      const key = `${day}:${venue}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const daily = [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([key, clicks]) => ({ day: key.split(':')[0], venue: key.split(':')[1], clicks }));
    const payload = { partnerId: id, timezone: 'UTC', daily };
    if (url.pathname.startsWith('/api/')) return json(payload);
    const rows = daily.map((row) => `<tr><td>${row.day}</td><td>${row.venue}</td><td>${row.clicks}</td></tr>`).join('');
    return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width"><title>Partner click statistics — NexuAlpha</title></head><body><main><h1>Partner click statistics</h1><p>${id} · Daily anonymous clicks · UTC</p><table><thead><tr><th>Date</th><th>Venue</th><th>Clicks</th></tr></thead><tbody>${rows}</tbody></table>${daily.length ? '' : '<p>No clicks recorded.</p>'}<p>Reload to refresh. Clicks do not measure registrations or earnings.</p></main></body></html>`, { headers: { ...headers, 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'" } });
  };
}
