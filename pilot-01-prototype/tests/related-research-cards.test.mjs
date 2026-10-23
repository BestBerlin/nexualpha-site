import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { localizedHref } from '../src/data/locale-routing.js';
import { withoutTurkeyUnlisted } from '../src/data/partner-geo-policy.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const locales = ['en', 'zh-Hans', 'zh-Hant', 'es', 'pt-BR', 'fr', 'de', 'it', 'ja', 'ko', 'tr', 'ru', 'id', 'vi', 'ar', 'ur', 'uk'];
const scopes = ['home', 'directory', 'rates', 'compare', 'tokenized'];
// Pre-redesign href contract, kept independent of the component's rendering groups.
const pairs = ['binance-vs-kraken', 'binance-vs-mexc', 'binance-vs-okx', 'bybit-vs-bitget', 'hyperliquid-vs-dydx', 'okx-vs-bybit', 'okx-vs-mexc'].map(pair => `/compare/${pair}`);
const tokenized = ['/topics/tokenized-assets', '/topics/tokenized-stocks-vs-perpetuals', '/topics/tokenized-treasuries'];
const brazil = ['/br/comparar', '/br/conta', '/br/custos', '/br/kyc-cpf', '/br/pix', '/br/saque-pix'];
const englishResearch = ['/us', '/id', '/tw', '/topics/bybit-alternatives', '/topics/brazil-crypto-exchange-deadline-2026'];
const editions = locales.filter(locale => !['ur', 'uk'].includes(locale));
let rendered;
test.before(async () => {
  const temp = await mkdtemp(path.join(root, 'tests/.tmp-research-cards-'));
  try {
    const entry = path.join(temp, 'entry.mjs');
    const bundle = path.join(temp, 'bundle.cjs');
    await writeFile(entry, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { CrawlPriorityLinks } from '../../src/components/shared/CrawlPriorityLinks.jsx';
      console.log(JSON.stringify(Object.fromEntries(${JSON.stringify(locales)}.flatMap(locale =>
        ${JSON.stringify(scopes)}.map(scope => [locale + ':' + scope,
        renderToStaticMarkup(React.createElement(CrawlPriorityLinks, { locale, scope }))])))));
    `);
    execFileSync(path.join(root, 'node_modules/.bin/esbuild'), [entry, '--bundle', '--platform=node', '--format=cjs', '--loader:.css=empty', '--log-level=warning', `--outfile=${bundle}`], { cwd: root });
    rendered = JSON.parse(execFileSync('node', [bundle], { cwd: root, encoding: 'utf8' }));
  } finally { await rm(temp, { recursive: true, force: true }); }
});

test('every original related-research href survives all locales and scopes, including closed native details', () => {
  for (const locale of locales) for (const scope of scopes) {
    const document = new JSDOM(rendered[`${locale}:${scope}`]).window.document;
    const hrefs = new Set([...document.querySelectorAll('a')].map(a => a.getAttribute('href')));
    let originals = [...pairs];
    if (scope !== 'tokenized') originals.push(...tokenized);
    if (scope !== 'rates') originals.push('/topics', '/rates');
    if (locale === 'en') originals.push(...englishResearch);
    if (scope === 'home' && ['en', 'pt-BR'].includes(locale)) originals.push(...brazil);
    if (scope === 'home' && locale === 'en') originals.push('/coins', '/licenses', '/convert/btc-to-usd');
    originals = withoutTurkeyUnlisted(originals, { locale }, href => href);
    for (const href of originals) {
      const expected = href.startsWith('/br') ? href : localizedHref(href, { locale });
      assert.ok(hrefs.has(expected), `${locale}:${scope} preserves ${expected}`);
    }
    if (scope === 'home' && locale === 'en') for (const edition of editions) {
      const expected = localizedHref('/news', { locale: edition });
      const anchor = document.querySelector(`[data-news-editions] a[href="${expected}"]`);
      assert.ok(anchor, `preserve ${edition} archive bridge`);
      assert.equal(anchor.getAttribute('lang'), edition);
      assert.equal(anchor.getAttribute('hreflang'), edition);
      assert.ok(anchor.classList.contains('research-library__chip'));
    }
  }
});

test('six initial paired-logo comparison cards, localized directory action and icon cards', async () => {
  for (const locale of locales) for (const scope of scopes) {
    const document = new JSDOM(rendered[`${locale}:${scope}`]).window.document;
    const featured = [...document.querySelectorAll('.research-library__cards--compare > a')];
    assert.ok(featured.length > 0 && featured.length <= 6, `${locale}:${scope}`);
    for (const anchor of featured) {
      assert.equal(anchor.querySelectorAll('img').length, 2);
      assert.ok(anchor.textContent.trim());
      for (const logo of anchor.querySelectorAll('img')) {
        assert.equal(logo.getAttribute('width'), '40');
        assert.equal(logo.getAttribute('height'), '40');
        assert.equal(logo.getAttribute('alt'), '');
        await access(path.join(root, 'public', logo.getAttribute('src')));
      }
    }
    const all = document.querySelector('.research-library__all');
    assert.equal(all.getAttribute('href'), localizedHref('/compare', { locale }));
    if (locale !== 'en') assert.doesNotMatch(all.textContent, /All comparisons/);
    const more = document.querySelector('.research-library__more');
    if (more) {
      assert.equal(more.hasAttribute('open'), false);
      assert.ok(more.querySelector('summary'));
      assert.ok(more.querySelectorAll('a').length > 0);
    }
    for (const anchor of document.querySelectorAll('.research-library__section--tools a, .research-library__section--tokenized a, .research-library__section--brazil a')) {
      assert.ok(anchor.querySelector('svg[aria-hidden="true"]'), `${locale}:${scope} has an icon card`);
    }
  }
});
