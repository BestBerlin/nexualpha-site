import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CODE_LABELS, scanInviteHtml, scanInviteText, scanInviteJson } from '../scripts/invite-code-consistency.mjs';
import { CUSTOM_INVITE_CODES } from '../src/data/partner-registry.js';
import { LOCALE_PREFIX_BY_CODE } from '../src/data/locale-routing.js';

const root = fileURLToPath(new URL('../', import.meta.url));
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
}

test('guard rejects every translated label followed by a year, including split HTML and entities', () => {
  for (const label of CODE_LABELS) {
    assert.ok(scanInviteText(`Hyperliquid ${label} 2026`).some(i => i.kind === 'year-as-code'), label);
    assert.ok(scanInviteHtml(`<h1>Hyperliquid <span>${label}</span>&#32;<b>2026</b></h1>`).some(i => i.kind === 'year-as-code'), label);
  }
  assert.equal(scanInviteText('2026 Hyperliquid referral code: NEXU888').length, 0);
  assert.equal(scanInviteText('Hyperliquid referral code guide (2026)').length, 0);
  assert.ok(scanInviteHtml('<a><span>Hyperliquid</span><span>邀请码</span> <strong>2026</strong></a>').some(i => i.kind === 'year-as-code'));
  assert.ok(scanInviteHtml('<script type="application/ld+json">{"name":"Hyperliquid 邀请码 2026"}</script>').some(i => i.kind === 'year-as-code'));
  assert.ok(scanInviteJson({ slug: 'hyperliquid', inviteCode: 'nexu888' }).some(i => i.kind === 'wrong-code'));
});

test('guard checks exchange-specific case-sensitive values and placeholders without reading URL codes', () => {
  for (const [venue, code] of Object.entries(CUSTOM_INVITE_CODES)) {
    if (code.startsWith('NEXU_')) {
      assert.ok(scanInviteHtml(`<p>${code}</p>`).some(i => i.kind === 'placeholder'));
      continue;
    }
    assert.equal(scanInviteText(`Referral code: ${code}`, { venue }).length, 0, venue);
    assert.ok(scanInviteText('Referral code: WRONG123', { venue }).some(i => i.kind === 'wrong-code'), venue);
  }
  assert.ok(scanInviteHtml('<section><h2>Hyperliquid</h2><div>Referral code:</div><div>nexu888</div></section>').some(i => i.kind === 'wrong-code'));
  assert.ok(scanInviteText('Binance: nexu888').some(i => i.kind === 'wrong-code'));
  assert.ok(scanInviteText('Binance NEXU888').some(i => i.kind === 'wrong-code'));
  assert.ok(scanInviteText('Código de convite Hyperliquid WRONG123').some(i => i.kind === 'wrong-code'));
  assert.ok(scanInviteText('Hyperliquid código de referido WRONG123').some(i => i.kind === 'wrong-code'));
  assert.ok(scanInviteHtml('<p>Hyperliquid <code>WRONG123</code></p>').some(i => i.kind === 'wrong-code'));
  assert.ok(scanInviteHtml('<p><span>Binance</span><span>nexu888</span></p>').some(i => i.kind === 'wrong-code'));
  assert.equal(scanInviteHtml('<p>OKX referral code: nexu888</p><a href="https://example.com/join/OTHER">Official link</a>').length, 0);
  assert.equal(scanInviteText('Binance referral code: 11350287; Hyperliquid referral code: NEXU888').length, 0);
  assert.equal(scanInviteHtml('<table><tr><td>Binance</td><td>Referral code</td><td>11350287</td></tr><tr><td>Hyperliquid</td><td>Referral code</td><td>NEXU888</td></tr></table>').length, 0);
  assert.ok(scanInviteHtml('<table><tr><td>Binance</td><td>Referral code</td><td>NEXU888</td></tr></table>').some(i => i.kind === 'wrong-code'));
  assert.equal(scanInviteHtml('<p>Binance accepts <code>USDC</code> as collateral.</p><p>Bybit anti-phishing code 02</p>').length, 0);
  assert.equal(scanInviteHtml('<section>Open official Binance registration Code: 11350287 ↗ Open official Bitget registration Code: nexu888 ↗</section>').length, 0);
});

test('all built prerender HTML and client HTML remain invite-code consistent in every UI locale', () => {
  const client = path.join(root, 'dist/client');
  assert.ok(existsSync(path.join(client, 'prerender-manifest.json')), 'Run npm run build first; never silently skip built coverage');
  const issues = [];
  const covered = new Set();
  let scanned = 0;
  for (const file of files(client)) {
    let html;
    if (file.endsWith('.html')) html = readFileSync(file, 'utf8');
    else if (file.includes(`${path.sep}prerender${path.sep}`) && file.endsWith('.json')) {
      const payload = JSON.parse(readFileSync(file, 'utf8'));
      assert.equal(typeof payload.html, 'string', file);
      html = payload.html;
      covered.add(path.relative(path.join(client, 'prerender'), file).split(path.sep)[0]);
    }
    if (html === undefined) continue;
    scanned++;
    const venue = file.match(/exchanges\/([^/.]+)/)?.[1] || null;
    issues.push(...scanInviteHtml(html, { source: path.relative(root, file), venue }));
  }
  assert.ok(scanned > 0);
  for (const locale of Object.keys(LOCALE_PREFIX_BY_CODE)) assert.ok(covered.has(locale), `Missing built HTML for ${locale}`);
  for (const locale of Object.keys(LOCALE_PREFIX_BY_CODE)) for (const venue of Object.keys(CUSTOM_INVITE_CODES)) assert.ok(existsSync(path.join(client, 'prerender', locale, 'exchanges', `${venue}.json`)), `Missing ${locale}/${venue} built profile`);
  console.log(`Invite-code guard scanned ${scanned} built HTML documents across ${covered.size} locales`);
  assert.equal(issues.length, 0, JSON.stringify(issues.slice(0, 80), null, 2));
});

test('built worker referral titles and descriptions keep code values unambiguous in every locale', async () => {
  const { routeMetadata } = await import('../dist/server/index.js');
  const env = { ASSETS: { fetch: async () => new Response('missing', { status: 404 }) } };
  const issues = [];
  for (const [locale, prefix] of Object.entries(LOCALE_PREFIX_BY_CODE)) {
    for (const venue of Object.keys(CUSTOM_INVITE_CODES)) {
      const route = `${prefix ? `/${prefix}` : ''}/exchanges/${venue}`;
      const metadata = await routeMetadata(new URL(`https://nexualpha.com${route}`), env);
      assert.equal(metadata.status, 200, `${locale}: ${route}`);
      if (venue === 'hyperliquid' && metadata.title.includes(CUSTOM_INVITE_CODES.hyperliquid)) assert.doesNotMatch(metadata.title, /\b[12]\d{3}\b/, 'Hyperliquid title must keep the real code separate from dated editorial context');
      for (const copy of [metadata.title, metadata.description]) issues.push(...scanInviteText(copy, { source: route, venue }));
    }
  }
  assert.deepEqual(issues, []);
});

test('generated public llms files never expose placeholder codes or label/year ambiguity', () => {
  for (const name of ['llms.txt', 'llms-small.txt', 'llms-full.txt']) {
    const file = path.join(root, 'dist/client', name);
    const issues = readFileSync(file, 'utf8').split('\n').flatMap((line, index) => scanInviteText(line, { source: `${name}:${index + 1}` }));
    assert.deepEqual(issues, [], JSON.stringify(issues.slice(0, 20)));
  }
});

test('built public JSON feeds never expose placeholder or mismatched invite codes', () => {
  const issues = [];
  for (const file of files(path.join(root, 'dist/client'))) {
    if (!file.endsWith('.json') || file.includes(`${path.sep}prerender${path.sep}`)) continue;
    issues.push(...scanInviteJson(JSON.parse(readFileSync(file, 'utf8')), { source: path.relative(root, file) }));
  }
  assert.equal(issues.length, 0, JSON.stringify(issues.slice(0, 30), null, 2));
});

test('public CTA shows the registry casing when the route URL carries the same code in another case', async () => {
  const { publicCtaForVenue } = await import('../src/data/source-bound-cta.js');
  for (const [venue, code] of Object.entries(CUSTOM_INVITE_CODES)) {
    const cta = publicCtaForVenue(venue, 'en');
    if (!cta.inviteCode) continue;
    if (cta.inviteCode.toLowerCase() === code.toLowerCase()) assert.equal(cta.inviteCode, code, venue);
  }
  const backpack = publicCtaForVenue('backpack', 'en');
  assert.equal(backpack.inviteCode, 'LuckyBitcoin');
  assert.equal(backpack.registrationUrl, 'https://backpack.exchange/join/luckybitcoin', 'registration URLs are not rewritten');
});
