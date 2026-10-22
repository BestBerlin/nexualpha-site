import test from 'node:test';
import assert from 'node:assert/strict';
import { radarRouteSeo, LONG_SHORT_INDEX_LOCALES } from '../src/data/radar-seo.js';
import { coinMeta, coinIndexLocales } from '../src/data/coins-seo.js';
import { coinBySlug } from '../src/data/coins.js';
import { titleBudgetForLocale } from '../src/data/meta-description.js';
import { computeRouteSeo } from '../src/data/seo-injection.js';
import { localizedPath } from '../src/data/locale-routing.js';
import { routeMetadata } from '../worker/index.js';

test('long/short search titles distinguish every indexable locale in both page-head paths', async () => {
  const titles = new Set();
  for (const locale of LONG_SHORT_INDEX_LOCALES) {
    const title = radarRouteSeo('/long-short', locale).title;
    assert.ok(!titles.has(title), `${locale}: duplicate title ${title}`);
    titles.add(title);
    const pathname = localizedPath('/long-short', locale);
    const pageTitle = computeRouteSeo({ pathname }).title;
    assert.ok(pageTitle.startsWith(title.replace(" — NexuAlpha", "")));
    assert.equal((await routeMetadata(new URL(`https://nexualpha.com${pathname}`), {})).title, pageTitle);
  }
});

test('long coin names retain localized purchase intent within the search title budget', async () => {
  const coin = coinBySlug('artificial-superintelligence-alliance');
  assert.ok(coin);
  const titles = new Set();
  for (const locale of coinIndexLocales(coin)) {
    const { title } = coinMeta(coin, locale);
    assert.ok(title.includes('FET'), `${locale}: ${title}`);
    assert.ok(title.length <= titleBudgetForLocale(locale), `${locale}: ${title}`);
    assert.notEqual(title, `${coin.name} (${coin.symbol})`);
    assert.ok(!titles.has(title), `${locale}: duplicate title ${title}`);
    titles.add(title);
    const pathname = localizedPath(`/coins/${coin.slug}`, locale);
    assert.equal(computeRouteSeo({ pathname }).title, title);
    assert.equal((await routeMetadata(new URL(`https://nexualpha.com${pathname}`), {})).title, title);
  }
});
