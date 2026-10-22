import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loopbackUnavailableReason } from './sandbox-network.mjs';

const networkSkip = await loopbackUnavailableReason();
const verifier = new URL('../scripts/verify-whole-site-seo.mjs', import.meta.url);
const projectRoot = fileURLToPath(new URL('..', import.meta.url));

function html({ title = 'Page', canonical, body = '', id = 'nexualpha-prerender-state' }) {
  return `<!doctype html><html><head><title>${title}</title><meta name="robots" content="index,follow"><link rel="canonical" href="${canonical}"><meta property="og:url" content="${canonical}"></head><body><h1>${title}</h1><main id="${id}">${body}<p>Enough rendered body copy for the whole-site verifier to treat this page as a real prerendered document.</p></main><script type="application/ld+json">{"@type":"WebPage","url":"${canonical}","inLanguage":"en"}</script></body></html>`;
}

function sitemap(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?><urlset>${urls.map((url) => `<url><loc>${url}</loc></url>`).join('')}</urlset>`;
}

async function withServer(routes, callback) {
  const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const key = `${url.pathname}${url.search}`;
    const route = routes[key] ?? routes[url.pathname];
    if (!route) {
      response.writeHead(404, { 'content-type': 'text/html' });
      response.end('missing');
      return;
    }
    response.writeHead(route.status ?? 200, route.headers ?? { 'content-type': route.type ?? 'text/html' });
    response.end(route.body ?? '');
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function runVerifier({ routes, inventory, buildId = null }) {
  const temp = await mkdtemp(path.join(tmpdir(), 'nexualpha-seo-link-guard-'));
  await mkdir(path.join(temp, 'out'));
  const inventoryPath = path.join(temp, 'inventory.json');
  await writeFile(inventoryPath, JSON.stringify({ locales: ['en'], rows: inventory }, null, 2));
  try {
    return await withServer(routes, async (base) => {
      const out = path.join(temp, 'out');
      const cliArgs = [fileURLToPath(verifier), '--base', base, '--inventory', inventoryPath, '--out', out];
      if (buildId) cliArgs.push('--build-id', buildId);
      const child = spawn(process.execPath, cliArgs, {
        cwd: projectRoot,
        env: { ...process.env, NO_COLOR: '1' },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => { stdout += chunk; });
      child.stderr.on('data', (chunk) => { stderr += chunk; });
      const code = await new Promise((resolve) => child.on('close', resolve));
      const result = JSON.parse(await readFile(path.join(out, 'results.json'), 'utf8'));
      return { code, stdout, stderr, result };
    });
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

test('whole-site SEO verifier checks the canonical homepage entry bundle for the build identity', { skip: networkSkip }, async () => {
  const buildId = '3.0-test-build';
  const inventory = [{ path: '/', template: 'home', index: true }];
  const routes = {
    '/': { body: html({ title: 'Home', canonical: 'https://nexualpha.com/', body: '<a href="/">Home</a><script type="module" src="/assets/app.js"></script>' }) },
    '/?locale=en': { status: 308, headers: { location: 'https://nexualpha.com/' }, body: '' },
    '/assets/app.js': { type: 'text/javascript', body: `document.documentElement.dataset.build=${JSON.stringify(buildId)};` },
    '/version.json': { type: 'application/json', body: JSON.stringify({ version: '3.0.0', buildId }) },
    '/sitemap.xml': { type: 'application/xml', body: sitemap(['https://nexualpha.com/']) },
  };

  const { result } = await runVerifier({ routes, inventory, buildId });

  assert.equal(result.summary.buildIdVerifiedFromBundle, true);
  assert.equal(result.issues.some((issue) => issue.code === 'BUILD_ID_NOT_FOUND_IN_ENTRY_BUNDLE'), false);
  assert.equal(result.issues.some((issue) => issue.code === 'VERSION_JSON_BUILD_ID_MISMATCH'), false);
});

test('whole-site SEO verifier reports indexable pages with no internal inbound links', { skip: networkSkip }, async () => {
  const inventory = [
    { path: '/', template: 'home', index: true },
    { path: '/orphan', template: 'topic', index: true },
  ];
  const routes = {
    '/': { body: html({ title: 'Home', canonical: 'https://nexualpha.com/', body: '<a href="/">Home</a>' }) },
    '/?locale=en': { body: html({ title: 'Home', canonical: 'https://nexualpha.com/', body: '<a href="/">Home</a>' }) },
    '/orphan?locale=en': { body: html({ title: 'Orphan', canonical: 'https://nexualpha.com/orphan' }) },
    '/sitemap.xml': { type: 'application/xml', body: sitemap(['https://nexualpha.com/', 'https://nexualpha.com/orphan']) },
  };

  const { code, result } = await runVerifier({ routes, inventory });

  assert.equal(code, 1);
  assert.ok(result.issues.some((issue) => issue.scope === '/orphan|en' && issue.code === 'ZERO_INTERNAL_INBOUND'));
});

test('whole-site SEO verifier reports missing internal fragment targets', { skip: networkSkip }, async () => {
  const inventory = [
    { path: '/', template: 'home', index: true },
    { path: '/linked', template: 'topic', index: true },
  ];
  const routes = {
    '/': { body: html({ title: 'Home', canonical: 'https://nexualpha.com/', body: '<a href="/linked#missing-section">Linked</a>' }) },
    '/?locale=en': { body: html({ title: 'Home', canonical: 'https://nexualpha.com/', body: '<a href="/linked#missing-section">Linked</a>' }) },
    '/linked?locale=en': { body: html({ title: 'Linked', canonical: 'https://nexualpha.com/linked' }) },
    '/linked': { body: html({ title: 'Linked', canonical: 'https://nexualpha.com/linked' }) },
    '/sitemap.xml': { type: 'application/xml', body: sitemap(['https://nexualpha.com/', 'https://nexualpha.com/linked']) },
  };

  const { code, result } = await runVerifier({ routes, inventory });

  assert.equal(code, 1);
  assert.ok(result.issues.some((issue) => issue.scope === '/linked' && issue.code === 'MISSING_LINK_FRAGMENT' && issue.detail === 'missing-section'));
});

test('whole-site SEO verifier permits controlled context and reports unknown non-canonical query variants', { skip: networkSkip }, async () => {
  const inventory = [
    { path: '/', template: 'home', index: true },
    { path: '/linked', template: 'topic', index: true },
  ];
  const routes = {
    '/': { body: html({ title: 'Home', canonical: 'https://nexualpha.com/', body: '<a href="/linked?locale=en&market=BR&product=spot&account_stage=ready&utm_source=home">Linked</a><a href="/linked?unexpected=stale">Bad variant</a><a href="/?page=newsDetail&slug=stale">Legacy</a>' }) },
    '/?locale=en': { body: html({ title: 'Home', canonical: 'https://nexualpha.com/', body: '<a href="/linked?locale=en&market=BR&product=spot&account_stage=ready&utm_source=home">Linked</a><a href="/linked?unexpected=stale">Bad variant</a><a href="/?page=newsDetail&slug=stale">Legacy</a>' }) },
    '/linked?locale=en': { body: html({ title: 'Linked', canonical: 'https://nexualpha.com/linked' }) },
    '/linked': { body: html({ title: 'Linked', canonical: 'https://nexualpha.com/linked' }) },
    '/?page=newsDetail&slug=stale': { status: 301, headers: { location: '/news/stale' }, body: '' },
    '/sitemap.xml': { type: 'application/xml', body: sitemap(['https://nexualpha.com/', 'https://nexualpha.com/linked']) },
  };

  const { code, result } = await runVerifier({ routes, inventory });

  assert.equal(code, 1);
  assert.ok(result.issues.some((issue) => issue.code === 'NON_CANONICAL_INTERNAL_LINK' && issue.detail.includes('unexpected=stale')));
  assert.equal(result.issues.some((issue) => issue.code === 'NON_CANONICAL_INTERNAL_LINK' && issue.detail.includes('account_stage=ready')), false);
  assert.ok(result.issues.some((issue) => issue.code === 'LEGACY_QUERY_INTERNAL_LINK' && issue.detail.includes('page=newsDetail')));
});

test('whole-site SEO verifier ignores nofollow internal state variants', { skip: networkSkip }, async () => {
  const inventory = [
    { path: '/', template: 'home', index: true },
    { path: '/br/pix', template: 'brazil', index: true, locales: ['pt-BR'] },
  ];
  const routes = {
    '/': {
      body: html({
        title: 'Home',
        canonical: 'https://nexualpha.com/',
        body: '<a rel="nofollow" href="/br/pix?locale=pt-BR&market=BR&product=spot&amount=1000&spot_fee_bps=10&deposit_fee_pct=0&deposit_fixed_brl=0">Brazil state</a>',
      }),
    },
    '/?locale=en': { body: html({ title: 'Home', canonical: 'https://nexualpha.com/' }) },
    '/br/pix': { body: html({ title: 'Brazil Pix', canonical: 'https://nexualpha.com/br/pix', body: '<a href="/">Home</a>' }) },
    '/sitemap.xml': { type: 'application/xml', body: sitemap(['https://nexualpha.com/', 'https://nexualpha.com/br/pix']) },
  };

  const { result } = await runVerifier({ routes, inventory });

  assert.equal(result.issues.some((issue) => issue.code === 'NON_CANONICAL_INTERNAL_LINK' && issue.detail.includes('spot_fee_bps')), false);
});

test('whole-site SEO verifier permits alternate links, static assets and campaign-tagged registration exits', { skip: networkSkip }, async () => {
  const inventory = [
    { path: '/', template: 'home', index: true },
    { path: '/linked', template: 'topic', index: true },
  ];
  const routes = {
    '/': { body: html({ title: 'Home', canonical: 'https://nexualpha.com/', body: '<link rel="alternate" hreflang="ja" href="https://nexualpha.com/?locale=ja"><a href="/linked">Linked</a><a href="/assets/logo.png?utm_source=cdn">Asset</a><a href="https://partner.bitget.com/bg/zc8pmupf?utm_source=nexualpha">Bitget</a>' }) },
    '/?locale=en': { body: html({ title: 'Home', canonical: 'https://nexualpha.com/', body: '<a href="/linked">Linked</a>' }) },
    '/linked?locale=en': { body: html({ title: 'Linked', canonical: 'https://nexualpha.com/linked', body: '<a href="/">Home</a>' }) },
    '/linked': { body: html({ title: 'Linked', canonical: 'https://nexualpha.com/linked', body: '<a href="/">Home</a>' }) },
    '/assets/logo.png?utm_source=cdn': { type: 'image/png', body: '' },
    '/sitemap.xml': { type: 'application/xml', body: sitemap(['https://nexualpha.com/', 'https://nexualpha.com/linked']) },
  };

  const { result } = await runVerifier({ routes, inventory });

  assert.equal(result.issues.filter((issue) => ['NON_CANONICAL_INTERNAL_LINK', 'LEGACY_QUERY_INTERNAL_LINK', 'ZERO_INTERNAL_INBOUND'].includes(issue.code)).length, 0);
});
