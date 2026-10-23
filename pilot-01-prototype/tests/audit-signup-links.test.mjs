import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { auditPage, carriesCode, crawlSitemap, markdownReport } from '../scripts/audit-signup-links.mjs';
const fixture = name => readFile(new URL(`./fixtures/signup-links/${name}.html`, import.meta.url), 'utf8');
const redirect = async () => new Response(null, { status: 302, headers: { location: 'https://www.binance.com?ref=11350287' } });
test('saved SSR pairs each referral CTA with visible registry code and disclosure', async () => {
  const rows = await auditPage({ url: 'https://nexualpha.com/zh-Hans/', html: await fixture('valid'), fetchImpl: redirect });
  assert.equal(rows.length, 2); assert.ok(rows.every(row => !row.issues.length));
  assert.match(markdownReport(rows, 1), /\| binance \| home \| 1 \| 0/);
});
test('hidden evidence, missing redirect code, partial code and unrelated sibling block fail', async () => {
  const rows = await auditPage({ url: 'https://nexualpha.com/news/example', html: await fixture('invalid'), fetchImpl: async () => new Response(null, { status: 302, headers: { location: 'https://www.binance.com/register' } }) });
  assert.deepEqual(rows[0].issues, ['invalid-go-redirect','missing-visible-code-chip','missing-visible-disclosure']);
  assert.deepEqual(rows[1].issues, ['direct-link-missing-code']);
  assert.ok(rows[2].issues.includes('missing-visible-code-chip'));
  assert.match(markdownReport(rows), /\| binance \| news \| 2 \| 2/);
});
test('manual redirect is required, foreign redirect with matching code fails', async () => {
  const rows = await auditPage({ url: 'https://nexualpha.com/', html: await fixture('valid'), fetchImpl: async (url, options) => { assert.equal(options.redirect, 'manual'); return new Response(null,{status:302,headers:{location:'https://evil.example?ref=11350287'}}); } });
  assert.deepEqual(rows[0].issues, ['invalid-go-redirect']);
  assert.equal(carriesCode(new URL('https://www.okx.com/join/NEXU888'), 'nexu888'), true);
  assert.equal(carriesCode(new URL('https://www.okx.com/?ref=nexu888oops'), 'nexu888'), false);
});
test('sitemap index traverses children and balances samples across locales', async () => {
  const calls = [];
  const fetchImpl = async url => { calls.push(url); if (url.endsWith('/sitemap.xml')) return new Response('<sitemapindex><sitemap><loc>https://nexualpha.com/child.xml</loc></sitemap></sitemapindex>'); if (url.endsWith('child.xml')) return new Response('<urlset><url><loc>https://nexualpha.com/</loc></url><url><loc>https://nexualpha.com/exchanges</loc></url><url><loc>https://nexualpha.com/ar/</loc></url></urlset>'); return new Response('<main>No signup links</main>'); };
  const result = await crawlSitemap('https://nexualpha.com', { sample: 2, fetchImpl });
  assert.equal(result.pages, 2); assert.ok(calls.includes('https://nexualpha.com/ar/')); assert.ok(!calls.includes('https://nexualpha.com/exchanges'));
});
test('regional locales retain page type and hidden or inert anchors still audit redirects only', async () => {
  const html = '<div aria-hidden="true"><a href="/go/binance">Sign up</a></div><div inert><a href="/go/binance">Sign up</a></div>';
  const rows = await auditPage({ url: 'https://nexualpha.com/pt-BR/', html, fetchImpl: redirect });
  assert.ok(rows.every(row => row.pageType === 'home' && row.issues.length === 0));
  const failed = await auditPage({ url: 'https://nexualpha.com/pt-BR/', html, fetchImpl: async () => new Response(null, { status:302, headers:{location:'https://www.binance.com/'} }) });
  assert.ok(failed.every(row => row.issues.join() === 'invalid-go-redirect'));
});
test('chip full attribute and text must match code and nested CTA evidence cannot satisfy its parent', async () => {
  const html = '<div data-signup-cta><a href="/go/binance">Sign up</a><section data-signup-cta="okx"><span data-invite-code="11350287">11350287</span><p data-commission-disclosure>Commission</p></section></div><div data-signup-cta><a href="/go/binance">Sign up</a><span data-invite-code="wrong">11350287</span><p data-commission-disclosure>Commission</p></div>';
  const rows = await auditPage({ url:'https://nexualpha.com/', html, fetchImpl:redirect });
  assert.deepEqual(rows[0].issues, ['missing-visible-code-chip','missing-visible-disclosure']);
  assert.deepEqual(rows[1].issues, ['missing-visible-code-chip']);
});
test('actual labeled CodeChip markup and backup alias use base registry without changing href', async () => {
  const html = '<div data-signup-cta><a href="/go/binance-alt?src=backup">Sign up</a><span class="cro-code" data-invite-code="11350287"><span>Invite code</span><strong class="cro-code__code">11350287</strong><button>Copy</button><span aria-live="polite">Copied</span></span><p data-commission-disclosure>Commission</p></div>';
  const rows = await auditPage({url:'https://nexualpha.com/', html, fetchImpl:async url => { assert.equal(url,'https://nexualpha.com/go/binance-alt?src=backup'); return new Response(null,{status:302,headers:{location:'https://www.bsmkweb.cc/join?ref=11350287'}}); }});
  assert.equal(rows[0].exchange,'binance'); assert.deepEqual(rows[0].issues,[]);
});
