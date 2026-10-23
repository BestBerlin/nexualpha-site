import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { partnerRegistry, CUSTOM_INVITE_CODES } from '../src/data/partner-registry.js';

const normalizedHost = (host) => host.toLowerCase().replace(/^www\./, '');
const decode = (value) => { try { return decodeURIComponent(value); } catch { return value; } };
export function carriesCode(url, code) {
  if (!code) return false;
  const expected = String(code).toLowerCase();
  return [...url.searchParams.values(), ...url.pathname.split('/').map(decode)].some(value => value.toLowerCase() === expected);
}
function hostsFor(partner) {
  return [partner.officialDomain, ...[partner.registrationUrl, ...(partner.alternateRegistrationUrls || [])].filter(Boolean).map(value => new URL(value).hostname)]
    .filter(Boolean).map(normalizedHost);
}
export function pageType(url) {
  const path = url.pathname.replace(/^\/(?:zh-Hans|zh-Hant|[a-z]{2}(?:-[A-Z]{2})?)(?=\/|$)/i, '') || '/';
  if (path === '/') return 'home';
  if (/^\/exchanges\/[^/]+/.test(path)) return 'exchange-detail';
  return path.split('/').filter(Boolean)[0] || 'home';
}
function visible(node) {
  for (let element = node; element; element = element.parentElement) {
    if (element.hidden || element.hasAttribute('inert') || element.getAttribute('aria-hidden') === 'true' || /(?:display\s*:\s*none|visibility\s*:\s*hidden)/i.test(element.getAttribute('style') || '')) return false;
  }
  return Boolean(node.textContent.trim());
}
export async function auditPage({ url, html, fetchImpl = fetch, registry = partnerRegistry, codes = CUSTOM_INVITE_CODES }) {
  const document = new JSDOM(html).window.document;
  const rows = [];
  for (const anchor of document.querySelectorAll('a[href]')) {
    let href;
    try { href = new URL(anchor.getAttribute('href'), url); } catch { continue; }
    const go = href.origin === new URL(url).origin && href.pathname.match(/^\/go\/([^/]+)\/?$/);
    const slug = go ? decode(go[1]).replace(/-alt$/, '') : Object.keys(registry).find(key => hostsFor(registry[key]).some(host => normalizedHost(href.hostname) === host || normalizedHost(href.hostname).endsWith(`.${host}`)));
    if (!slug) continue;
    const issues = [];
    const code = codes[slug] || registry[slug]?.inviteCode;
    if (!code || /^NEXU_[A-Z0-9]+$/.test(code)) issues.push('missing-real-registry-code');
    if (go) {
      try {
        const response = await fetchImpl(href.href, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
        const location = response.headers.get('location');
        const destination = location && new URL(location, href);
        if (![301,302,303,307,308].includes(response.status) || !destination || !registry[slug] || !hostsFor(registry[slug]).some(host => normalizedHost(destination.hostname) === host || normalizedHost(destination.hostname).endsWith(`.${host}`)) || !carriesCode(destination, code)) issues.push('invalid-go-redirect');
      } catch { issues.push('go-fetch-failed'); }
    } else if (!carriesCode(href, code)) issues.push('direct-link-missing-code');
    // A bounded wrapper is mandatory: the whole page cannot count as the CTA block.
    const block = anchor.closest('[data-signup-cta]');
    if (visible(anchor)) {
      const owned = node => node.closest('[data-signup-cta]') === block;
      const chips = block ? [...block.querySelectorAll('[data-invite-code]')].filter(owned) : [];
      if (!chips.some(chip => visible(chip) && chip.getAttribute('data-invite-code') === code && [...chip.querySelectorAll('.cro-code__code, code, strong'), chip].some(value => visible(value) && value.textContent.trim() === code))) issues.push('missing-visible-code-chip');
      const disclosures = block ? [...block.querySelectorAll('[data-commission-disclosure], .commission-disclosure, .commission-disclosure-line')].filter(owned) : [];
      if (!disclosures.some(visible)) issues.push('missing-visible-disclosure');
    }
    rows.push({ exchange: slug, pageType: pageType(new URL(url)), page: url, href: href.href, issues });
  }
  document.defaultView.close();
  return rows;
}
export function markdownReport(rows, pages = 0) {
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.exchange}|${row.pageType}`;
    const group = groups.get(key) || { exchange: row.exchange, type: row.pageType, total: 0, failed: 0, issues: new Set() };
    group.total++; group.failed += Number(row.issues.length > 0); row.issues.forEach(issue => group.issues.add(issue)); groups.set(key, group);
  }
  return [`# Sign-up link audit`, '', `Pages checked: ${pages}. SSR evidence only; viewport geometry and clipboard behavior require browser QA.`, '', '| Exchange | Page type | Links | Failed | Issues |', '| --- | --- | ---: | ---: | --- |', ...[...groups.values()].sort((a,b) => `${a.exchange}/${a.type}`.localeCompare(`${b.exchange}/${b.type}`)).map(group => `| ${group.exchange} | ${group.type} | ${group.total} | ${group.failed} | ${[...group.issues].join(', ') || '—'} |`), '', ...rows.filter(row => row.issues.length).map(row => `- ${row.page} → ${row.href}: ${row.issues.join(', ')}`)].join('\n');
}
export async function crawlSitemap(baseUrl, { sample = 400, fetchImpl = fetch } = {}) {
  const base = new URL(baseUrl);
  const pending = [new URL('/sitemap.xml', base).href], seen = new Set(), pages = new Set();
  while (pending.length) {
    const sitemap = pending.shift(); if (seen.has(sitemap)) continue; seen.add(sitemap);
    const response = await fetchImpl(sitemap, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Sitemap HTTP ${response.status}: ${sitemap}`);
    const document = new JSDOM(await response.text(), { contentType: 'text/xml' }).window.document;
    const index = document.documentElement.localName === 'sitemapindex';
    for (const element of document.querySelectorAll('loc')) {
      const link = new URL(element.textContent.trim(), sitemap);
      if (link.origin !== base.origin) continue;
      if (index) pending.push(link.href); else pages.add(link.href);
    }
    document.defaultView.close();
  }
  // Round-robin locale groups prevents early sitemap entries from excluding other locales.
  const locales = new Map();
  for (const page of pages) { const locale = new URL(page).pathname.match(/^\/(zh-Hans|zh-Hant|[a-z]{2}(?:-[A-Z]{2})?)(?=\/|$)/i)?.[1] || 'en'; if (!locales.has(locale)) locales.set(locale, []); locales.get(locale).push(page); }
  const selected = [];
  while (selected.length < sample && [...locales.values()].some(group => group.length)) for (const group of locales.values()) if (group.length && selected.length < sample) selected.push(group.shift());
  const rows = [];
  for (const page of selected) {
    const response = await fetchImpl(page, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Page HTTP ${response.status}: ${page}`);
    rows.push(...await auditPage({ url: page, html: await response.text(), fetchImpl }));
  }
  return { rows, pages: selected.length };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const sample = Number(process.argv[3] || 400);
  if (!process.argv[2] || !Number.isInteger(sample) || sample < 1) { console.error('Usage: node scripts/audit-signup-links.mjs <baseUrl> [sample=400]'); process.exitCode = 2; }
  else try { const result = await crawlSitemap(process.argv[2], { sample }); console.log(markdownReport(result.rows, result.pages)); if (result.rows.some(row => row.issues.length)) process.exitCode = 1; } catch (error) { console.error(error.message); process.exitCode = 1; }
}
