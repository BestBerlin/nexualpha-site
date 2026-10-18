import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { licenseProfileCopy, publicFactValue } from '../src/components/licenses/license-profile-copy.js';
const locales = ['en', 'zh-Hans', 'zh-Hant', 'es', 'pt-BR', 'fr', 'de', 'ja', 'ko', 'tr', 'ru', 'ar', 'id', 'vi', 'it', 'ur', 'uk'];
test('profile licence labels and statuses cover all 17 locales', () => {
  const english = licenseProfileCopy('en');
  for (const locale of locales) {
    const copy = licenseProfileCopy(locale);
    for (const key of ['title', 'exchange', 'country', 'entity', 'regulator', 'type', 'status', 'source', 'lastChecked', 'all', 'open']) {
      assert.ok(copy[key], `${locale}/${key}`);
      // These labels are shared words in the target language, not fallbacks.
      if (locale !== 'en' && !['it/exchange', 'es/exchange', 'pt-BR/status', 'de/status', 'id/status', 'id/regulator'].includes(`${locale}/${key}`)) assert.notEqual(copy[key], english[key], `${locale}/${key}`);
    }
    for (const status of Object.keys(english.statuses)) {
      assert.ok(copy.statuses[status], `${locale}/${status}`);
      if (locale !== 'en') assert.notEqual(copy.statuses[status], english.statuses[status], `${locale}/${status}`);
    }
  }
});
test('authorisation remains distinct from licensing without dropping other statuses', () => {
  for (const locale of locales) {
    const statuses = licenseProfileCopy(locale).statuses;
    assert.notEqual(statuses.authorised, statuses.licensed, locale);
    for (const key of ['registered', 'applied', 'restricted', 'banned', 'warning', 'withdrawn', 'revoked']) assert.ok(statuses[key], `${locale}/${key}`);
  }
  assert.equal(licenseProfileCopy('ja').statuses.authorised, '認可済み');
  assert.equal(licenseProfileCopy('ko').statuses.authorised, '인가됨');
});
test('missing source fields render nothing while meaningful source wording survives', () => {
  for (const value of ['N/A', 'n/a', '尚未核验', '尚未核驗', '待核验', 'unknown', null, undefined, '—']) assert.equal(publicFactValue(value), '');
  assert.equal(publicFactValue('Registration is not authorisation'), 'Registration is not authorisation');
  assert.equal(publicFactValue('0%'), '0%');
});
test('SSR CJK labels do not fall back to English and placeholders are omitted', async () => {
  const directory = await mkdtemp(new URL('./.tmp-fact-locales-', import.meta.url));
  try {
    await writeFile(`${directory}/entry.jsx`, `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { ExchangeKeyFacts } from '../../src/components/v3/ExchangeKeyFacts.jsx';
      import { LicenseTable } from '../../src/components/licenses/LicensePages.jsx';
      const record = { exchange: 'binance', country: 'JP', entityName: 'N/A', regulator: '尚未核验', type: 'N/A', number: 'N/A', statusNote: '尚未核驗', status: 'registered', sourceUrl: 'https://example.com/', lastChecked: '2026-10-14' };
      console.log(JSON.stringify(Object.fromEntries(['zh-Hans','zh-Hant','ja','ko'].map(locale => [locale, {
        facts: renderToStaticMarkup(React.createElement(ExchangeKeyFacts, { slug: 'binance', locale })),
        licenses: renderToStaticMarkup(React.createElement(LicenseTable, { records: [record], locale })),
      }]))));
    `);
    execFileSync('./node_modules/.bin/esbuild', [`${directory}/entry.jsx`, '--bundle', '--platform=node', '--format=cjs', '--loader:.css=empty', `--outfile=${directory}/bundle.cjs`], { stdio: 'pipe' });
    const pages = JSON.parse(execFileSync(process.execPath, [`${directory}/bundle.cjs`], { encoding: 'utf8' }));
    for (const [locale, page] of Object.entries(pages)) {
      const uiLabels = `${page.facts.match(/<th\b[^>]*>.*?<\/th>/g)?.join('') || ''}${page.licenses.match(/<(?:th|dt)\b[^>]*>.*?<\/(?:th|dt)>/g)?.join('') || ''}`;
      assert.doesNotMatch(uiLabels, /Key facts|Proof of reserves|Deposit methods|Platform|Products|Spot fee|Perp fee|Official register|Last checked|Licence|License|Country|Entity|Regulator|Status/);
      assert.doesNotMatch(page.facts + page.licenses, /\bN\/A\b|尚未核[验驗]/, locale);
      assert.match(page.facts, /2026-10-10/, locale);
      assert.match(page.licenses, /https:\/\/example.com\//, locale);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
