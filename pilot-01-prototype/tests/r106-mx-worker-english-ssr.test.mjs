import assert from 'node:assert/strict';
import test from 'node:test';
import { computeRouteSeo } from '../src/data/seo-injection.js';
import worker, { routeMetadata } from '../worker/index.js';
import { routeInventory, buildSitemap } from '../scripts/generate-prerender-manifest.mjs';

const paths = ['/mx', '/mx/comparar', '/mx/costos', '/mx/conta'];
const assets = {
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === '/index.html') return new Response('<!doctype html><html><head><title>NexuAlpha</title></head><body><div id="root"></div></body></html>', { headers: {'content-type': 'text/html'} });
    if (path === '/prerender-manifest.json') return Response.json({ version: 'nexualpha-prerender-v1', routes: Object.fromEntries(paths.flatMap(path => ['es','en'].map(locale => [`${path}|${locale}`, {pathname:path,locale,html:`<main><h1>${locale === 'en' ? 'Mexico account checks' : 'México cuenta'}</h1></main>`}])))});
    return new Response('missing', {status:404});
  }
};

test('MX explicit English uses English SSR body, state and metadata without publishing an English search owner', async () => {
  for (const path of paths) {
    const url = new URL(`https://nexualpha.com${path}?locale=en&market=MX&product=spot&account_stage=another_platform&funding=SPEI`);
    const response = await worker.fetch(new Request(url, {headers:{accept:'text/html'}}), {ASSETS:assets});
    const html = await response.text();
    assert.equal(response.status,200,path);
    assert.match(html,/<html lang="en"/,path);
    assert.match(html,/<h1>Mexico account checks<\/h1>/,path);
    const state = JSON.parse(html.match(/id="nexualpha-prerender-state">([^<]+)<\/script>/)[1]);
    assert.equal(state.locale,'en',path);
    const meta = await routeMetadata(url, {ASSETS:assets});
    assert.equal(meta.locale,'en',path);
    assert.equal(meta.canonical,`https://nexualpha.com${path}`,path);
    assert.equal(meta.robots,'noindex,follow',path);
    assert.deepEqual(meta.alternates,[],path);
    assert.match(meta.title,/Mexico/,path);
    for (const schema of [].concat(meta.schema)) {
      if (schema.inLanguage) assert.equal(schema.inLanguage,'en',path);
      assert.notEqual(schema['@type'],'FAQPage','English view must not publish Spanish FAQ schema');
    }
    const owner = await routeMetadata(new URL(`https://nexualpha.com${path}`),{ASSETS:assets});
    assert.equal(owner.locale,'es',path);
    assert.equal(owner.robots,path === '/mx' ? 'index,follow' : 'noindex,follow',path);
  }
});

test('MX English display prerenders remain separate from Spanish sitemap publication', () => {
  const inventory = routeInventory([]);
  for (const path of paths) {
    const row = inventory.find(row => row.pathname === path);
    assert.deepEqual(row.locales,['es']);
    assert.deepEqual(row.prerenderLocales,['es','en']);
  }
  const xml = buildSitemap(inventory,[]);
  assert.match(xml,/<loc>https:\/\/nexualpha\.com\/mx<\/loc>/);
  assert.doesNotMatch(xml,/\/mx(?:\/comparar|\/costos|\/conta)?\?locale=en/);
});

 test('MX English display metadata agrees between server and client', async () => {
  for (const path of paths) {
    const url = new URL(`https://nexualpha.com${path}?locale=en`);
    const server = await routeMetadata(url,{ASSETS:assets});
    const route = path === '/mx' ? {name:'regionalPreview',market:'MX'} : {name:'regionalDecision',market:'MX',decisionPath:path.split('/').pop()};
    const client = computeRouteSeo({url:url.href,locale:'en',route});
    for (const key of ['status','title','description','canonical','robots','locale']) assert.equal(server[key],client[key],`${path}: ${key}`);
  }
 });
