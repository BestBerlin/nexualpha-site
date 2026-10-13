import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createGoRedirect } from '../server/go-redirect.mjs';
import { createPartnerProgram, programTarget } from '../server/partner-program.mjs';
import { PARTNER_PROGRAM_PROMOTABLE_LOCALES, partnerProgramCopy } from '../src/data/partner-program-copy.js';
import { partnersProgram } from '../src/data/partners-program.js';
const registry = [{ id: 'alice', name: 'Alice', locales: ['en', 'tr'], codes: { okx: 'alice-code' } }];
const token = 'private-partner-token-123456789';
async function setup() {
  const root = await mkdtemp(path.join(tmpdir(), 'partner-program-'));
  await mkdir(path.join(root, 'intel'));
  await writeFile(path.join(root, 'intel/partners.json'), JSON.stringify({ partners: [{ slug: 'okx', registrationUrl: 'https://www.okx.com/join/nexu888' }, { slug: 'bybit', registrationUrl: 'https://www.bybit.com/invite?ref=MAIN' }] }));
  const eventFile = path.join(root, 'clicks.jsonl');
  return { eventFile, go: createGoRedirect({ clientRoot: root, eventFile, programRegistry: registry }), program: createPartnerProgram({ eventFile, registry, tokens: { alice: token } }) };
}
const click = (query) => new Request(`https://nexualpha.com/go/${query}`, { headers: { 'user-agent': 'Mozilla/5.0' } });
test('registry is empty by default; sub-code routes and main fallback retain anonymous attribution', async () => {
  assert.deepEqual(partnersProgram, []);
  const { go, eventFile } = await setup();
  assert.equal((await go(click('okx?p=alice&src=community'))).headers.get('location'), 'https://www.okx.com/join/alice-code');
  assert.equal((await go(click('bybit?p=alice'))).headers.get('location'), 'https://www.bybit.com/invite?ref=MAIN');
  assert.equal((await go(click('okx?p=unknown'))).headers.get('location'), 'https://www.okx.com/join/nexu888');
  const rows = (await readFile(eventFile, 'utf8')).trim().split('\n').map(JSON.parse);
  assert.equal(rows[0].partnerId, 'alice');
  assert.equal(rows[1].partnerId, 'alice');
  assert.equal(rows[2].partnerId, undefined);
  assert.doesNotMatch(JSON.stringify(rows), /cookie|user-agent|alice-code/);
});
test('approved sub-links are host-locked and invalid codes fall back', () => {
  const base = 'https://www.okx.com/join/nexu888';
  for (const url of ['https://www.okx.com/help', 'https://www.okx.com/join/', 'https://evil.example/join/code', 'javascript:alert(1)', 'https://www.okx.com:444/join/code', 'https://x@www.okx.com/join/code']) {
    assert.equal(programTarget({ codes: { okx: { url } } }, 'okx', base), base);
  }
  assert.equal(programTarget({ codes: { okx: { url: 'https://www.okx.com/join/sub' } } }, 'okx', base), 'https://www.okx.com/join/sub');
});
test('landing carries only query attribution, locale gates reject neutral/unassigned locales', async () => {
  const { program, go } = await setup();
  const res = await program(new Request('https://nexualpha.com/p/alice?locale=en&src=community'));
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/exchanges?p=alice&src=community');
  assert.equal(res.headers.get('set-cookie'), null);
  for (const locale of ['ru', 'ar', 'zh-Hant', 'ur', 'uk', 'vi', 'fr']) {
    assert.equal((await program(new Request(`https://nexualpha.com/p/alice?locale=${locale}`))).status, 404);
    assert.equal((await go(click(`okx?p=alice&locale=${locale}`))).status, 403);
  }
  assert.equal((await program(new Request('https://nexualpha.com/p/missing'))).status, 404);
});
test('stats fail closed, aggregate this partner UTC daily counts and render noindex without token leakage', async () => {
  const { program, eventFile } = await setup();
  await writeFile(eventFile, [
    { t: '2026-10-13T08:00:00Z', partner: 'okx', partnerId: 'alice' },
    { t: '2026-10-13T09:00:00Z', partner: 'okx', partnerId: 'alice' },
    { t: '2026-10-12T23:59:00Z', partner: 'bybit', partnerId: 'alice' },
    { t: '2026-10-13T08:00:00Z', partner: 'okx', partnerId: 'bob' },
  ].map(JSON.stringify).join('\n') + '\npartial');
  for (const query of ['', '?t=wrong', '?t=']) assert.equal((await program(new Request(`https://nexualpha.com/api/partner-stats/alice${query}`))).status, 401);
  const res = await program(new Request(`https://nexualpha.com/api/partner-stats/alice?t=${token}`));
  assert.equal(res.status, 200);
  assert.deepEqual((await res.json()).daily, [{ day: '2026-10-12', venue: 'bybit', clicks: 1 }, { day: '2026-10-13', venue: 'okx', clicks: 2 }]);
  const html = await program(new Request(`https://nexualpha.com/partners/stats/alice?t=${token}`));
  assert.match(html.headers.get('x-robots-tag'), /noindex/);
  assert.equal(html.headers.get('cache-control'), 'no-store');
  assert.doesNotMatch(await html.text(), new RegExp(token));
  assert.equal((await createPartnerProgram({ registry, tokens: { alice: token } })(new Request(`https://nexualpha.com/api/partner-stats/alice?t=${token}`))).status, 503);
});

test('public partner page copy is fully localized for every promotable locale', () => {
  assert.deepEqual(PARTNER_PROGRAM_PROMOTABLE_LOCALES, ['en', 'zh-Hans', 'es', 'pt-BR', 'fr', 'de', 'ja', 'ko', 'tr', 'id', 'it']);
  const en = partnerProgramCopy('en');
  for (const locale of PARTNER_PROGRAM_PROMOTABLE_LOCALES) {
    const copy = partnerProgramCopy(locale);
    assert.equal(copy.benefits.length, 6, locale);
    assert.equal(copy.steps.length, 3, locale);
    assert.equal(copy.faqs.length, 4, locale);
    for (const key of ['home', 'breadcrumb', 'kicker', 'title', 'lead', 'primaryCta', 'secondaryCta', 'benefitsTitle', 'stepsTitle', 'faqTitle']) {
      assert.equal(typeof copy[key], 'string', `${locale} ${key}`);
      assert.ok(copy[key].trim(), `${locale} ${key}`);
    }
    if (locale !== 'en') {
      assert.notDeepEqual(copy.benefits, en.benefits, `${locale} benefits must not fall back to English`);
      assert.notDeepEqual(copy.steps, en.steps, `${locale} steps must not fall back to English`);
      assert.notDeepEqual(copy.faqs, en.faqs, `${locale} faqs must not fall back to English`);
      assert.doesNotMatch(copy.lead, /Revenue share is|set per partner/i, `${locale} lead should be localized`);
    }
  }
});

test('rendered program exposes localized application options and neutral editions hide recruitment', async () => {
  const { buildSync } = await import('esbuild');
  const { fileURLToPath } = await import('node:url');
  const { createRequire } = await import('node:module');
  const { runInNewContext } = await import('node:vm');
  const require = createRequire(import.meta.url);
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const module = { exports: {} };
  const bundle = buildSync({ entryPoints: [fileURLToPath(new URL('../src/components/v3/PartnerEmbedGuide.jsx', import.meta.url))], bundle: true, write: false, format: 'cjs', platform: 'node', external: ['react'], loader: { '.jsx': 'jsx', '.css': 'empty' } });
  runInNewContext(bundle.outputFiles[0].text, { module, exports: module.exports, require, URL, URLSearchParams });
  const render = (locale, pathname = '/partners') => renderToStaticMarkup(React.createElement(module.exports.PartnerEmbedGuide, { locale, pathname }));
  for (const locale of PARTNER_PROGRAM_PROMOTABLE_LOCALES) {
    const html = render(locale);
    assert.match(html, /<h1>/, locale);
    assert.match(html, /mailto:partners@nexualpha\.com/, locale);
    assert.match(html, /https:\/\/t\.me\/NexuAlphaAssistantBot/, locale);
    assert.match(html, /\{split\}/, locale);
    assert.match(html, /data-cta-kind="partner-application"/, locale);
  }
  for (const locale of ['ru', 'ar', 'zh-Hant', 'ur', 'uk', 'vi']) {
    assert.doesNotMatch(render(locale), /partner-application|mailto:partners@nexualpha\.com/, locale);
  }
  assert.match(render('en', '/partners/embed-guide'), /<iframe|&lt;iframe/);
});

test('partner attribution preserves venue territorial gates', async () => {
  const { go } = await setup();
  const response = await go(new Request('https://nexualpha.com/go/okx?p=alice&locale=en', { headers: { 'cf-ipcountry': 'VN', 'user-agent': 'Mozilla/5.0' } }));
  assert.equal(response.status, 403);
});
