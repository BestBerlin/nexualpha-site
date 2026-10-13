import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { localizedHref, localizedLanguageHref } from '../src/data/locale-routing.js';
const root = fileURLToPath(new URL('..', import.meta.url));
test('language listbox and footer render native links for all 17 supported locales', () => {
  const temp = mkdtempSync(path.join(root, 'tests/.tmp-language-'));
  try {
    const entry = path.join(temp, 'entry.jsx');
    const bundle = path.join(temp, 'bundle.cjs');
    writeFileSync(entry, `import React from 'react';
      import {renderToStaticMarkup} from 'react-dom/server';
      import {LanguageMenu} from '../../src/components/shell/LanguageMenu.jsx';
      import {CleanFooter} from '../../src/components/v3/CleanFooter.jsx';
      import {localeManifest,supportedLocales} from '../../src/content/locale-manifest';
      import {localizedHref,localizedLanguageHref} from '../../src/data/locale-routing.js';
      const routes=['/','/exchanges/okx','/compare/binance-vs-okx','/news/example','/mx'];
      const options=route=>supportedLocales.map(code=>({code,label:localeManifest[code].language,href:localizedLanguageHref(route,{locale:code})}));
      console.log(JSON.stringify({menus:routes.map(route=>renderToStaticMarkup(<LanguageMenu locale="en" label="Language" options={options(route)} onSelect={()=>{}}/>)),footer:renderToStaticMarkup(<CleanFooter/>)}));`);
    execFileSync(path.join(root, 'node_modules/.bin/esbuild'), [entry,'--bundle','--platform=node','--format=cjs','--log-level=warning',`--outfile=${bundle}`], {cwd:root});
    const result = JSON.parse(execFileSync('node',[bundle], {cwd:root,encoding:'utf8'}));
    for (const [i, route] of ['/','/exchanges/okx','/compare/binance-vs-okx','/news/example','/mx'].entries()) {
      const document = new JSDOM(result.menus[i]).window.document;
      const links = [...document.querySelectorAll('[role="option"] a')];
      assert.equal(links.length,17);
      for (const link of links) {
        assert.equal(link.getAttribute('href'),localizedLanguageHref(route,{locale:link.hreflang}));
        assert.equal(link.lang,link.hreflang);
      }
      assert.equal(document.querySelector('[aria-selected="true"] a').getAttribute('aria-current'),'true');
      assert.equal(document.querySelector('[role="listbox"]').hidden,true);
    }
    const footer = new JSDOM(result.footer).window.document;
    const links = [...footer.querySelectorAll('.nx-ftr__locales a')];
    assert.equal(links.length,17);
    assert.equal(new Set(links.map(a=>a.href)).size,17);
    for (const link of links) assert.equal(link.getAttribute('href'),localizedHref('/',{locale:link.hreflang}));
  } finally {rmSync(temp,{recursive:true,force:true});}
});

test('application SSR language links retain the current route and match head hreflang targets', { timeout: 120000 }, async (t) => {
  const { createSsrHarness } = await import('./helpers/ssr-hydration-harness.mjs');
  const { routeMetadata } = await import('../worker/index.js');
  const harness = await createSsrHarness();
  t.after(() => harness.close());
  for (const route of ['/', '/exchanges/okx', '/compare/binance-vs-okx', '/news']) {
    const html = await harness.render(`https://nexualpha.com${route}`);
    const document = new JSDOM(html).window.document;
    const links = [...document.querySelectorAll('.nx-lang__list a')];
    assert.ok(links.length >= 15, route);
    const metadata = await routeMetadata(new URL(`https://nexualpha.com${route}`), {});
    for (const alternate of metadata.alternates || []) {
      if (alternate.hreflang === 'x-default') continue;
      const link = links.find(a => a.hreflang === alternate.hreflang);
      assert.ok(link, `${route}: ${alternate.hreflang}`);
      assert.equal(new URL(link.getAttribute('href'),'https://nexualpha.com').href, alternate.href);
    }
    for (const link of links) assert.equal(link.getAttribute('href'), localizedHref(route, {locale:link.hreflang}));
  }
});

test('regional language options use native country canonical and published global locale homes', () => {
  assert.equal(localizedLanguageHref('/br', {locale:'pt-BR'}), '/br');
  assert.equal(localizedLanguageHref('/mx', {locale:'es'}), '/mx');
  assert.equal(localizedLanguageHref('/mx', {locale:'ja'}), '/ja');
  assert.equal(localizedLanguageHref('/mx', {locale:'en'}), '/');
});
