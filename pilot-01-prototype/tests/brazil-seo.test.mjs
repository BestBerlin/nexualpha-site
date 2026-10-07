import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import worker, { routeMetadata } from '../worker/index.js';
import { BRAZIL_PAGES } from '../src/data/brazil-market.js';
import { getBrazilSeo } from '../src/data/brazil-seo.js';
import { computeRouteSeo } from '../src/data/seo-injection.js';
import { routeInventory, buildSitemap } from '../scripts/generate-prerender-manifest.mjs';

const origin = 'https://nexualpha.com';
const root = path.resolve(import.meta.dirname, '..');
function assets() {
  return { fetch: async (request) => {
    const pathname = new URL(request.url).pathname;
    if (pathname === '/content/brazil-metadata.json') return Response.json({ version: 1,
      pages: Object.fromEntries(BRAZIL_PAGES.map((page) => [page.path, getBrazilSeo(page.path)])) });
    try {
      const body = await readFile(path.join(root, 'dist/client', pathname));
      return new Response(body, { headers: { 'content-type': pathname.endsWith('.html') ? 'text/html' : 'application/json' } });
    } catch { return new Response('missing', { status: 404 }); }
  } };
}

test('Brazil originals keep Portuguese canonical/schema in server and browser for every UI locale', async () => {
  const env = { ASSETS: assets() };
  for (const page of BRAZIL_PAGES) for (const locale of ['pt-BR', 'en', 'zh-Hans', 'zh-Hant', 'ar']) {
    const url = new URL(`${origin}${page.path}?locale=${locale}&utm_source=creator&publisher=pilot`);
    const server = await routeMetadata(url, env);
    const client = computeRouteSeo({ url: url.href, locale });
    assert.equal(server.status, 200);
    assert.equal(server.canonical, origin + page.path);
    assert.equal(server.title, client.title);
    assert.equal(server.description, client.description);
    assert.equal(server.locale, 'pt-BR');
    assert.deepEqual(server.alternates.map((row) => row.hreflang), ['pt-BR', 'x-default']);
    assert.deepEqual(server.schema, client.schemas);
    const expectedFaqQuestions = [...new Set([...(page.faq || []), ...(page.aeoAnswers || [])].map((faq) => faq.question))];
    const faqQuestions = client.schemas.find((row) => row['@type'] === 'FAQPage')?.mainEntity.map((row) => row.name);
    assert.deepEqual(faqQuestions, expectedFaqQuestions);
  }
});

test('Brazil AEO answers are merged into FAQ schema once, without HowTo expansion', () => {
  const byPath = Object.fromEntries(BRAZIL_PAGES.map((page) => [page.path, getBrazilSeo(page.path)]));
  assert.ok(byPath['/br/pix'].schemas.find((row) => row['@type'] === 'FAQPage').mainEntity.some((row) => row.name === 'Como conferir depósito e saque Pix/BRL antes de escolher uma corretora cripto?'));
  assert.ok(byPath['/br/pix'].schemas.find((row) => row['@type'] === 'FAQPage').mainEntity.some((row) => row.name === 'Quais condições devo confirmar antes de sacar BRL por Pix?'));
  assert.ok(byPath['/br/saque-pix'].schemas.find((row) => row['@type'] === 'FAQPage').mainEntity.some((row) => row.name === 'Como revisar saque Pix em BRL antes de retirar fundos de uma corretora cripto?'));
  assert.ok(byPath['/br/custos'].schemas.find((row) => row['@type'] === 'FAQPage').mainEntity.some((row) => row.name === 'Por que uma estimativa de taxas não substitui a tabela oficial da conta?'));
  assert.ok(byPath['/br/conta'].schemas.find((row) => row['@type'] === 'FAQPage').mainEntity.some((row) => row.name === 'Um link de parceiro garante bônus ou desconto para todo usuário brasileiro?'));
  assert.ok(byPath['/br/kyc-cpf'].schemas.find((row) => row['@type'] === 'FAQPage').mainEntity.some((row) => row.name === 'O que revisar sobre KYC, CPF, titularidade bancária e benefício antes de abrir conta cripto no Brasil?'));
  for (const metadata of Object.values(byPath)) {
    const types = metadata.schemas.map((row) => row['@type']);
    assert.equal(new Set(metadata.schemas.find((row) => row['@type'] === 'FAQPage').mainEntity.map((row) => row.name)).size,
      metadata.schemas.find((row) => row['@type'] === 'FAQPage').mainEntity.length);
    assert.equal(types.includes('HowTo'), false);
  }
});

test('Brazil /br WebPage schema uses the newest official source review date', () => {
  const metadata = getBrazilSeo('/br');
  const webPage = metadata.schemas.find((row) => row['@type'] === 'WebPage');
  assert.equal(webPage.dateModified, '2026-10-02');
});

test('Brazil /br WebPage schema carries research owner attribution and bounded main sources', () => {
  const metadata = getBrazilSeo('/br');
  const webPage = metadata.schemas.find((row) => row['@type'] === 'WebPage');
  assert.deepEqual(webPage.author, { '@type': 'Organization', name: 'NexuAlpha Research Desk', url: 'https://nexualpha.com/methodology' });
  assert.deepEqual(webPage.publisher, { '@type': 'Organization', name: 'NexuAlpha', url: 'https://nexualpha.com' });
  assert.deepEqual(webPage.isBasedOn, [
    'https://www.binance.com/pt-BR/support/faq/detail/53636607eebc42dbb513863b49bba98f',
    'https://www.binance.com/pt-BR/support/faq/detail/2604a5d35bd947d485dc30d865539e3e',
    'https://www.binance.com/pt-BR/support/faq/detail/b90065c7a7d44d0bb8b2ac7dc2cb0391',
    'https://www.okx.com/help/how-do-i-deposit-brl',
  ]);
});

test('only seven original Portuguese routes enter the sitemap, without fictional translated duplicates', () => {
  const inventory = routeInventory([]);
  const rows = inventory.filter((row) => row.template === 'brazilDecision');
  assert.equal(rows.length, 7);
  assert.ok(rows.every((row) => row.locales.join(',') === 'pt-BR'));
  const xml = buildSitemap(inventory, []);
  assert.equal((xml.match(/<loc>https:\/\/nexualpha.com\/br(?:\/[^<]+)?<\/loc>/g) || []).length, 7);
  assert.doesNotMatch(xml, /<loc>https:\/\/nexualpha.com\/br[^<]*locale=/);
  assert.match(xml, /hreflang="pt-BR"/);
});

test('Portuguese HTTP pages contain prerendered answers, while customized decision state is rendered by the client', async () => {
  const env = { ASSETS: assets() };
  for (const page of BRAZIL_PAGES) {
    const response = await worker.fetch(new Request(origin + page.path), env);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /<html lang="pt-BR"/);
    assert.match(html, /id="nexualpha-prerender-state"/);
    assert.ok(html.includes(page.title.replaceAll('&', '&amp;')));
    assert.match(html, /"locale":"pt-BR"/);
  }
  const response = await worker.fetch(new Request(origin + '/br?market=ID&platform=okx'), env);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /id="nexualpha-prerender-state"/);
  // R64/R74 preserve neutral BR content at first paint; the browser restores
  // the requested decision after mounting instead of injecting eligibility.
  const prerenderState = JSON.parse(html.match(/<script[^>]*id="nexualpha-prerender-state"[^>]*>([\s\S]*?)<\/script>/)[1]);
  assert.equal(prerenderState.pathname, '/br');
  assert.equal(prerenderState.locale, 'pt-BR');
  assert.doesNotMatch(JSON.stringify(prerenderState), /market=ID|platform=okx|"market":"ID"/);
  assert.match(html, /rel="canonical" href="https:\/\/nexualpha.com\/br"/);

  const unsupportedLocale = await worker.fetch(new Request(origin + '/br?locale=ar'), env);
  assert.equal(unsupportedLocale.status, 308);
  assert.equal(unsupportedLocale.headers.get('location'), origin + '/br');

  for (const unsupported of ['en', 'zh-Hans', 'ja', 'ko', 'tr']) {
    const result = await worker.fetch(new Request(`${origin}/br/pix?locale=${unsupported}&utm_source=telegram`), env);
    assert.equal(result.status, 308, unsupported);
    assert.equal(result.headers.get('location'), `${origin}/br/pix?utm_source=telegram`, unsupported);
  }
});

test('unknown Brazil routes are 404 and unavailable metadata never inherits a global signup page', async () => {
  assert.equal((await routeMetadata(new URL(origin + '/br/missing'), { ASSETS: assets() })).status, 404);
  const broken = { ASSETS: { fetch: async () => new Response('missing', { status: 404 }) } };
  const result = await routeMetadata(new URL(origin + '/br'), broken);
  assert.equal(result.status, 503);
  assert.match(result.robots, /noindex/);
});

test('regional research previews keep unpublished country routes noindex in the worker', async () => {
  const env = { ASSETS: assets() };
  for (const pathname of ['/id', '/eu', '/uk', '/kr', '/int']) {
    const metadata = await routeMetadata(new URL(`${origin}${pathname}?locale=zh-Hant`), env);
    assert.equal(metadata.status, 200, pathname);
    assert.equal(metadata.robots, 'noindex,follow', pathname);
    assert.equal(metadata.canonical, `${origin}${pathname}`, pathname);
    const response = await worker.fetch(new Request(`${origin}${pathname}?locale=zh-Hant`), env);
    assert.equal(response.status, 200, pathname);
    assert.match(await response.text(), /name="robots" content="noindex,follow"/);
  }
});

test('Mexico owner hub remains indexable after its source-backed production promotion', async () => {
  const env = { ASSETS: assets() };
  const metadata = await routeMetadata(new URL(`${origin}/mx?locale=zh-Hant`), env);
  assert.equal(metadata.status, 200);
  assert.equal(metadata.robots, 'index,follow');
  assert.equal(metadata.canonical, `${origin}/mx`);
  const response = await worker.fetch(new Request(`${origin}/mx?locale=zh-Hant`), env);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /name="robots" content="index,follow"/);
});

test('Hong Kong regional route is indexable only in Traditional Chinese after source-backed metadata is present', async () => {
  const env = { ASSETS: assets() };
  const metadata = await routeMetadata(new URL(`${origin}/hk`), env);
  assert.equal(metadata.status, 200);
  assert.equal(metadata.robots, 'index,follow');
  assert.equal(metadata.canonical, `${origin}/hk`);
  assert.deepEqual(metadata.alternates.map((row) => row.hreflang), ['zh-Hant', 'x-default']);
  assert.match(JSON.stringify(metadata.schema), /sfc\.hk|港幣入金|虛擬資產交易平台/);

  const localized = await routeMetadata(new URL(`${origin}/hk?locale=en`), env);
  assert.equal(localized.status, 200);
  assert.equal(localized.robots, 'noindex,follow');
  assert.equal(localized.canonical, `${origin}/hk`);
  assert.deepEqual(localized.alternates, []);

  const response = await worker.fetch(new Request(`${origin}/hk`), env);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /name="robots" content="index,follow"/);
  assert.match(html, /rel="canonical" href="https:\/\/nexualpha.com\/hk"/);
});

test('Singapore regional route is indexable only after source-backed metadata is present', async () => {
  const env = { ASSETS: assets() };
  const metadata = await routeMetadata(new URL(`${origin}/sg`), env);
  assert.equal(metadata.status, 200);
  assert.equal(metadata.robots, 'index,follow');
  assert.equal(metadata.canonical, `${origin}/sg`);
  assert.deepEqual(metadata.alternates.map((row) => row.hreflang), ['en', 'x-default']);
  assert.match(JSON.stringify(metadata.schema), /MAS Digital Payment Token/);

  const response = await worker.fetch(new Request(`${origin}/sg`), env);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /name="robots" content="index,follow"/);
  assert.match(html, /rel="canonical" href="https:\/\/nexualpha.com\/sg"/);
});
