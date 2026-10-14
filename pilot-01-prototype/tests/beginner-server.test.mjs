import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { createProductionServer } from '../server.mjs';
import { BEGINNER_LOCALES, beginnerPath } from '../src/data/beginner-routes.js';
import { beginnerRouteSeo } from '../src/data/beginner-seo.js';
import { LOCALE_PREFIX_BY_CODE, localizedPath } from '../src/data/locale-routing.js';
import { decodeEntities } from './helpers/ssr-hydration-harness.mjs';

// Exercise the built Worker and SSR bundle through the production HTTP entrypoint.
test('production server beginner aliases redirect to rendered canonical pages in all locales', async () => {
  const server = await createProductionServer({ env: { INTEL_REFRESH: 'off', FX_REFRESH: 'off', BITGET_ALLIANCE_POOL: 'off', KRAKEN_USDG_LIVE: 'off' } });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  let redirects = 0;
  try {
    for (const locale of BEGINNER_LOCALES) {
      for (const [kind, step] of [['start', null], ['questions', null], ['check', null], ...Array.from({ length: 7 }, (_, i) => ['start', i + 1])]) {
        const alias = `/${LOCALE_PREFIX_BY_CODE[locale] || 'en'}/${kind}${step ? `/${step}` : ''}`;
        const canonical = localizedPath(beginnerPath(kind, locale, step), locale);
        const query = '?market=TR&tag=a%2Fb&tag=two';
        if (alias !== canonical) {
          for (const method of ['GET', 'HEAD']) {
            const response = await fetch(origin + alias + query, { redirect: 'manual', method });
            assert.equal(response.status, 301, alias);
            assert.equal(response.headers.get('location'), canonical + query, alias);
            await response.arrayBuffer();
          }
          redirects++;
        }
        const response = await fetch(origin + canonical + query, { redirect: 'manual' });
        assert.equal(response.status, 200, canonical);
        const html = await response.text();
        assert.match(html, /class="nxb /, canonical);
        const seo = beginnerRouteSeo(beginnerPath(kind, locale, step), locale);
        assert.equal(decodeEntities(html.match(/<p class="nxb-lead">([\s\S]*?)<\/p>/)?.[1] || ''), seo.description, canonical);
        assert.ok(decodeEntities(html.match(/<title>(.*?)<\/title>/)?.[1] || '').length <= 60, canonical);
        assert.equal(decodeEntities(html.match(/<meta name="description" content="([^"]*)"/)?.[1] || ''), seo.description, canonical);
      }
    }
    assert.equal(redirects, 169); // French /fr/questions is already canonical.
  } finally {
    await new Promise((resolve, reject) => { server.close(error => error ? reject(error) : resolve()); server.closeAllConnections(); });
  }
});
