import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { announcementDraft, generateDrafts, promoteDraft, promotionErrors, sgtDate } from '../scripts/campaign-autodraft.mjs';
import { campaignSignup, campaignTarget } from '../src/data/campaign-autodraft.js';
import { partnerRegistry } from '../src/data/partner-registry.js';
const fixture = JSON.parse(readFileSync(new URL('./fixtures/campaign-autodraft/announcements.json', import.meta.url)));
function sandbox(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'campaign-autodraft-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, 'src/data'), { recursive: true }); mkdirSync(path.join(root, 'public'));
  writeFileSync(path.join(root, 'src/data/campaign-autodraft.generated.js'), 'export const APPROVED_CAMPAIGNS = [];\n');
  writeFileSync(path.join(root, 'public/sitemap-campaigns.xml'), '<urlset></urlset>');
  return root;
}
function approve(draft) {
  return { ...draft, status: 'APPROVED', eligibilityReviewed: true, reviewedBy: 'Fixture reviewer', reviewedAt: '2026-10-13T08:00:00+08:00' };
}
test('official partner filtering, SGT dates, bilingual copy and missing-fact TODOs', () => {
  const drafts = fixture.events.map(announcementDraft).filter(Boolean);
  assert.equal(drafts.length, 5);
  assert.deepEqual(drafts.map(d => d.venue), ['okx', 'bitget', 'binance', 'bybit', 'kraken']);
  assert.equal(drafts[0].startAt, '2026-10-13T06:00:00+08:00');
  assert.match(drafts[0].copy['zh-Hans'].rewardHeadline, /25 USDT/);
  assert.equal(drafts[1].startAt, null); assert.match(drafts[1].copy.en.eligibility, /TODO/);
  assert.match(drafts[1].campaignLinkTodo, /owner/);
  assert.equal(sgtDate('2026-02-30T12:00:00Z'), null);
  assert.equal(sgtDate('2026-10-13'), null);
});
test('generation is draft-only and idempotent, retains owner edits and handles since', t => {
  const root = sandbox(t);
  const before = readFileSync(path.join(root, 'public/sitemap-campaigns.xml'), 'utf8');
  const ids = generateDrafts(fixture, { root }); assert.equal(ids.length, 5);
  const file = path.join(root, 'drafts/campaigns', `${ids[0]}.json`);
  const draft = JSON.parse(readFileSync(file)); draft.copy.en.title = 'Owner edit'; writeFileSync(file, JSON.stringify(draft));
  assert.deepEqual(generateDrafts(fixture, { root }), []);
  assert.equal(JSON.parse(readFileSync(file)).copy.en.title, 'Owner edit');
  assert.equal(readFileSync(path.join(root, 'public/sitemap-campaigns.xml'), 'utf8'), before);
  assert.match(readFileSync(path.join(root, 'src/data/campaign-autodraft.generated.js'), 'utf8'), /\[\]/);
  assert.match(readFileSync(path.join(root, 'drafts/campaigns/REVIEW.md'), 'utf8'), /Nothing.*published/);
  assert.equal(announcementDraft({ ...fixture.events[0], original_links: [fixture.events[0].original_links[0] + '?utm_source=test'] }).id, ids[0]);
  assert.deepEqual(generateDrafts(fixture, { root, since: '2026-10-14T00:00:00Z' }), []);
});
test('promotion fails closed until reviewed, copies to live registry and both sitemap editions', t => {
  const root = sandbox(t); const [id] = generateDrafts(fixture, { root });
  const file = path.join(root, 'drafts/campaigns', `${id}.json`);
  assert.throws(() => promoteDraft(id, { root }), /owner approval/);
  const draft = approve(JSON.parse(readFileSync(file))); writeFileSync(file, JSON.stringify(draft));
  assert.deepEqual(promotionErrors(draft), []);
  const promoted = promoteDraft(id, { root }); assert.equal(promoted.id, id);
  assert.match(readFileSync(path.join(root, 'src/data/campaign-autodraft.generated.js'), 'utf8'), /APPROVED/);
  assert.match(readFileSync(path.join(root, 'public/sitemap-campaigns.xml'), 'utf8'), new RegExp(`/zh-hans/activities/${id}`));
  assert.match(readFileSync(path.join(root, 'drafts/campaigns/REVIEW.md'), 'utf8'), /PROMOTED/);
  assert.throws(() => promoteDraft(id, { root }), /already promoted/);
  assert.deepEqual(generateDrafts(fixture, { root }), []);
  assert.throws(() => promoteDraft('../escape', { root }), /Invalid campaign id/);
});
test('locale variants, VN and Türkiye gates, campaign countries and active dates', () => {
  const c = approve(announcementDraft(fixture.events[0])); const now = Date.parse('2026-10-14T00:00:00Z');
  const signup = campaignSignup(c, { now }); assert.ok(signup); assert.equal(signup.code, partnerRegistry.okx.inviteCode);
  for (const locale of ['ru', 'ru-RU', 'ar', 'zh-Hant', 'zh-TW', 'ur', 'uk', 'vi', 'vi-VN']) assert.equal(campaignSignup(c, { locale, now }), null, locale);
  assert.equal(campaignSignup(c, { market: 'VN', now }), null);
  const bitget = { ...c, venue: 'bitget' };
  for (const locale of ['tr', 'tr-TR', 'TR']) assert.equal(campaignSignup(bitget, { locale, now }), null, locale);
  assert.equal(campaignSignup(bitget, { market: 'TR', now }), null);
  assert.equal(campaignSignup({ ...c, restrictedCountries: ['SG'] }, { market: 'SG', now }), null);
  assert.equal(campaignSignup({ ...c, allowedCountries: ['SG'] }, { now }), null);
  assert.ok(campaignSignup({ ...c, allowedCountries: ['SG'] }, { market: 'SG', now }));
  for (const time of ['2026-10-01', '2026-11-01']) assert.equal(campaignSignup(c, { now: Date.parse(time) }), null);
});
test('special campaign targets cannot bypass exact referral attribution and source validation', () => {
  const c = approve(announcementDraft(fixture.events[0]));
  assert.equal(campaignTarget(c), partnerRegistry.okx.registrationUrl);
  for (const campaignUrl of ['https://www.okx.com/campaign', 'https://www.okx.com.evil.example/campaign?ref=nexu888', 'https://user@www.okx.com/campaign', 'http://www.okx.com/campaign']) {
    assert.equal(campaignTarget({ ...c, campaignLinkRequired: true, campaignUrl }), null);
  }
  const kraken = { ...c, venue: 'kraken', campaignLinkRequired: true, campaignUrl: 'https://www.kraken.com/competitions/test' };
  assert.equal(new URL(campaignTarget(kraken)).searchParams.get('ref'), partnerRegistry.kraken.inviteCode);
  assert.ok(promotionErrors({ ...c, eligibilityReviewed: 'false' }).includes('review eligibility and country gates'));
  assert.ok(promotionErrors({ ...c, id: 'forged' }).includes('source identity changed'));
  assert.ok(promotionErrors({ ...c, campaignLinkRequired: true }).some(error => error.includes('attributed')));
});
test('media-first newsroom evidence chooses the official partner source', () => {
  const d = announcementDraft({ type: 'campaign', original_links: ['https://media.example/news', fixture.events[0].original_links[0]] });
  assert.equal(d.id, announcementDraft(fixture.events[0]).id);
});
test('promotion normalizes edited UTC timestamps to SGT', t => {
  const root = sandbox(t); const [id] = generateDrafts(fixture, { root });
  const file = path.join(root, 'drafts/campaigns', `${id}.json`);
  const d = approve(JSON.parse(readFileSync(file))); d.startAt = '2026-10-12T22:00:00Z'; writeFileSync(file, JSON.stringify(d));
  assert.equal(promoteDraft(id, { root }).startAt, '2026-10-13T06:00:00+08:00');
});
test('approved registry drives real SSR page, worker metadata, sitemap and redirect gates', async t => {
  const { APPROVED_CAMPAIGNS } = await import('../src/data/campaign-autodraft.generated.js');
  const { createGoRedirect } = await import('../server/go-redirect.mjs');
  const { buildCampaignSitemap } = await import('../scripts/generate-prerender-manifest.mjs');
  const { createSsrHarness, SHELL_HTML } = await import('./helpers/ssr-hydration-harness.mjs');
  const { default: worker } = await import('../worker/index.js');
  const c = approve(announcementDraft(fixture.events[0]));
  c.startAt = new Date(Date.now() - 86400000).toISOString(); c.endAt = new Date(Date.now() + 86400000).toISOString();
  const harness = await createSsrHarness();
  t.after(() => harness.close());
  const ssrRegistry = await harness.vite.ssrLoadModule('/src/data/campaign-autodraft.generated.js');
  APPROVED_CAMPAIGNS.push(c); ssrRegistry.APPROVED_CAMPAIGNS.push(c);
  t.after(() => { APPROVED_CAMPAIGNS.pop(); ssrRegistry.APPROVED_CAMPAIGNS.pop(); });
  const assets = { fetch: async request => new URL(request.url).pathname === '/index.html' ? new Response(SHELL_HTML, { headers: { 'content-type': 'text/html' } }) : new Response('missing', { status: 404 }) };
  for (const [prefix, title, cta] of [['', 'OKX challenge', true], ['/zh-hans', 'OKX 挑战赛', true], ['/vi', 'OKX challenge', false]]) {
    const response = await worker.fetch(new Request(`https://nexualpha.com${prefix}/activities/${c.id}`, { headers: { accept: 'text/html' } }), { ASSETS: assets, NEWS_SSR_RENDER: harness.render });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes(`<h1>${title}</h1>`), 'full SSR body');
    assert.equal(html.includes('data-signup-cta="campaign"'), cta);
    if (prefix === '/vi') assert.match(html, /noindex,follow/);
  }
  assert.ok(buildCampaignSitemap().xml.includes(`/zh-hans/activities/${c.id}`));
  const handle = createGoRedirect({ clientRoot: '/unused', now: () => new Date() });
  const href = `https://nexualpha.com/go/campaign-${c.id}`;
  const response = await handle(new Request(href)); assert.equal(response.status, 302); assert.equal(response.headers.get('location'), partnerRegistry.okx.registrationUrl);
  assert.equal((await handle(new Request(`${href}?locale=vi`))).headers.get('location'), '/vi/exchanges/okx');
  assert.equal((await handle(new Request(`${href}?market=SG`, { headers: { 'cf-ipcountry': 'VN' } }))).headers.get('location'), '/exchanges/okx');
  const inactive = createGoRedirect({ clientRoot: '/unused', now: () => new Date(c.endAt) });
  assert.equal((await inactive(new Request(href))).headers.get('location'), '/exchanges/okx');
});
test('special-link promotion stores the attributed URL rather than an unbound URL', t => {
  const root = sandbox(t);
  const row = { ...fixture.events[0], original_links: ['https://blog.kraken.com/fixture-campaign'] };
  const [id] = generateDrafts([row], { root });
  const file = path.join(root, 'drafts/campaigns', `${id}.json`);
  const d = approve(JSON.parse(readFileSync(file)));
  d.campaignLinkRequired = true; d.campaignUrl = 'https://www.kraken.com/competitions/fixture';
  writeFileSync(file, JSON.stringify(d));
  const promoted = promoteDraft(id, { root });
  assert.equal(new URL(promoted.campaignUrl).searchParams.get('ref'), partnerRegistry.kraken.inviteCode);
});
