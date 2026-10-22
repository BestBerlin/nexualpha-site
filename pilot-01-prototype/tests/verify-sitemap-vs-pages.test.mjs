import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { inspectPage, verifySitemapVsPages } from '../scripts/verify-sitemap-vs-pages.mjs';

const script = fileURLToPath(new URL('../scripts/verify-sitemap-vs-pages.mjs', import.meta.url));
const base = 'https://fixture.example';
const urlset = (urls) => `<urlset>${urls.map((url) => `<url><loc>${url.replaceAll('&', '&amp;')}</loc></url>`).join('')}</urlset>`;
const index = (urls) => `<sitemapindex>${urls.map((url) => `<sitemap><loc>${url}</loc></sitemap>`).join('')}</sitemapindex>`;
const page = (canonical, extra = '') => `<html><head>${extra}<link href="${canonical}" rel="canonical"></head><body>Article</body></html>`;
// The managed sandbox disallows listening sockets. Inject the HTTP transport,
// retaining real Request/Response/Headers semantics and testing the actual crawl.
function fixture(handler) {
  const requests = [];
  const fetchImpl = async (value) => {
    const request = new Request(value);
    requests.push(new URL(request.url).pathname + new URL(request.url).search);
    const result = await handler(request);
    const response = new Response(result.body || '', { status: result.status || 200, headers: result.headers || { 'content-type': 'text/html' } });
    Object.defineProperty(response, 'url', { value: result.url || request.url });
    return response;
  };
  return { fetchImpl, requests };
}
function cli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args]);
    let output = '';
    child.stdout.on('data', (data) => { output += data; });
    child.stderr.on('data', (data) => { output += data; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, output }));
  });
}
const run = (transport, options = {}) => verifySitemapVsPages({ base, ...transport, log: () => {}, ...options });

test('crawler follows nested and repeated sitemap children and checks unique pages including XML entities', async () => {
  const transport = fixture((req) => {
    const url = new URL(req.url);
    const maps = { '/sitemap.xml': index([`${base}/child.xml`, `${base}/child.xml`]), '/child.xml': index([`${base}/articles.xml`]), '/articles.xml': urlset([`${base}/a?x=1&y=2`, `${base}/a?x=1&y=2`, `${base}/b`]) };
    return { body: maps[url.pathname] || page(req.url) };
  });
  const result = await run(transport);
  assert.equal(result.checked, 2);
  assert.equal(result.sitemaps, 3);
  assert.deepEqual(result.inconsistencies, []);
  assert.equal(transport.requests.filter((url) => url === '/child.xml').length, 1);
  assert.equal(transport.requests.filter((url) => url === '/a?x=1&y=2').length, 1);
});

test('crawler reports noindex, canonical drift, redirects and status failures', async () => {
  const transport = fixture((req) => {
    const pathname = new URL(req.url).pathname;
    if (pathname === '/sitemap.xml') return { body: urlset(['noindex', 'canonical', 'redirect', 'missing', 'header'].map((name) => `${base}/${name}`)) };
    return {
      status: pathname === '/missing' ? 404 : 200,
      url: pathname === '/redirect' ? `${base}/ok` : req.url,
      headers: { 'content-type': 'text/html', ...(pathname === '/header' ? { 'x-robots-tag': 'googlebot: noindex, follow' } : {}) },
      body: page(pathname === '/canonical' ? `${base}/en/original` : req.url, pathname === '/noindex' ? '<meta name="robots" content="noindex,follow">' : ''),
    };
  });
  const lines = [];
  const result = await run(transport, { log: (line) => lines.push(line) });
  assert.equal(result.inconsistencies.length, 5);
  for (const text of ['noindex', 'canonical ->', 'redirect ->', 'HTTP 404', '5 inconsistency record(s)']) assert.ok(lines.join('\n').includes(text), text);
});

test('head checks use exact robots tokens, Googlebot, real tags and canonical attribute boundaries', () => {
  const url = `${base}/article`;
  const response = { status: 200, url, headers: new Headers({ 'content-type': 'text/html' }) };
  assert.deepEqual(inspectPage(page('/article', '<meta name=robots content="index,follow,noindexing,nofollowing"><!-- <meta name="robots" content="noindex"> --><script>"<meta name=robots content=noindex>"</script>') + '<meta name="robots" content="noindex">', response, url), []);
  assert.deepEqual(inspectPage(page(url, '<meta content="NoIndex,Follow" name="Googlebot">'), response, url), ['noindex']);
  assert.deepEqual(inspectPage(page(url, '<meta content="none" name="robots">'), response, url), ['noindex', 'nofollow']);
  assert.match(inspectPage('<head><link data-rel="canonical" href="/article"></head>', response, url).join(), /found 0/);
  assert.match(inspectPage(page(url).replace('</head>', '<link rel="canonical" href="/article"></head>'), response, url).join(), /found 2/);
  assert.match(inspectPage(page('/article#section'), response, url).join(), /canonical ->/);
  assert.deepEqual(inspectPage(page(url), { ...response, headers: new Headers({ 'content-type': 'text/html', 'x-robots-tag': 'otherbot: noindex, nofollow, googlebot: index, follow' }) }, url), []);
  assert.match(inspectPage('<head></head>', response, url).join(), /found 0/);
  assert.deepEqual(inspectPage(page(url, '<script>const markup = \"</head><meta name=robots content=noindex>\";</script>'), response, url), []);
  assert.deepEqual(inspectPage(page(url), { ...response, headers: new Headers({ 'content-type': 'text/html', 'x-robots-tag': 'max-snippet: -1, noindex' }) }, url), ['noindex']);
});

test('local sitemap files support sibling children and limit avoids requesting unsampled pages', async (t) => {
  const transport = fixture((req) => ({ body: page(req.url) }));
  const directory = await mkdtemp(path.join(tmpdir(), 'nx-verify-sitemaps-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(path.join(directory, 'sitemap.xml'), index(['child.xml']));
  await writeFile(path.join(directory, 'child.xml'), urlset([`${base}/a`, `${base}/b`, `${base}/c`]));
  const lines = [];
  const result = await run(transport, { sitemap: path.join(directory, 'sitemap.xml'), limit: 2, log: (line) => lines.push(line) });
  assert.equal(result.checked, 2);
  assert.deepEqual(result.inconsistencies, []);
  assert.match(lines.join(), /sample, not a full-site result/);
  assert.deepEqual(transport.requests.sort(), ['/a', '/b']);
});

test('remote sitemap HTTP failures, malformed XML, missing loc and empty maps fail closed', async () => {
  const maps = { '/broken.xml': '<urlset><url><loc>/x</loc></url>', '/loc.xml': '<urlset><url></url></urlset>', '/empty.xml': '<urlset></urlset>', '/unclosed.xml': '<urlset><url><loc>/x</loc></urlset>' };
  const transport = fixture((req) => ({ body: maps[new URL(req.url).pathname], status: new URL(req.url).pathname in maps ? 200 : 503 }));
  for (const name of ['/broken.xml', '/loc.xml', '/empty.xml', '/unclosed.xml', '/missing.xml']) {
    const result = await run(transport, { sitemap: `${base}${name}` });
    assert.equal(result.inconsistencies.length, 1, name);
    assert.equal(result.checked, 0, name);
  }
});

test('page crawling uses at most eight concurrent requests and reports transport errors', async () => {
  let active = 0;
  let maximum = 0;
  const transport = fixture(async (req) => {
    const pathname = new URL(req.url).pathname;
    if (pathname === '/sitemap.xml') return { body: urlset(Array.from({ length: 17 }, (_, i) => `${base}/p${i}`)) };
    if (pathname === '/p16') throw new TypeError('fetch failed');
    active++;
    maximum = Math.max(maximum, active);
    await new Promise((resolve) => setTimeout(resolve, 15));
    active--;
    return { body: page(req.url) };
  });
  const result = await run(transport);
  assert.equal(result.checked, 17);
  assert.equal(maximum, 8);
  assert.equal(result.inconsistencies.length, 1);
  assert.match(result.inconsistencies[0].issues[0], /fetch error/);
});

test('CLI exits one for invalid inputs and sitemap input errors; help exits zero', async (t) => {
  for (const args of [[], ['--wat'], ['--base'], ['--base', 'ftp://example.com'], ['--base', base, '--limit', '0'], ['--base', base, '--limit', '1.5']]) {
    assert.equal((await cli(args)).code, 1, JSON.stringify(args));
  }
  const directory = await mkdtemp(path.join(tmpdir(), 'nx-verify-cli-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const sitemap = path.join(directory, 'sitemap.xml');
  await writeFile(sitemap, '<html>Not XML</html>');
  const result = await cli(['--base', base, '--sitemap', sitemap]);
  assert.equal(result.code, 1);
  assert.match(result.output, /INCONSISTENT.*sitemap error/);
  assert.equal((await cli(['--help'])).code, 0);
});
