import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { LICENSE_COUNTRIES, LICENSE_INDEX_LOCALES, licenseRecords, licenseTitle, licenseAnswer, licenseSchemas, licenseRecordsForCountry, licenseLastmod } from '../src/data/licenses.js';
import { licenseResearch } from '../src/data/licenses-research.js';
import { licenseRouteSeo, licenseSitemapEntries } from '../src/data/licenses-seo.js';
import { licenseSignup } from '../src/data/licenses-cta.js';
import { localizedPath } from '../src/data/locale-routing.js';

// Research gaps must never turn into commercial permission or indexable empty datasets.
test('country expansion preserves neutral markets, dated answers and visible schema row counts', () => {
  assert.ok(LICENSE_COUNTRIES.length >= 20);
  for (const country of LICENSE_COUNTRIES) {
    const records = licenseRecordsForCountry(country.slug);
    const answer = licenseAnswer(country.slug, 'en');
    assert.ok(answer.includes(licenseLastmod(country.slug)));
    assert.ok(answer.split(/\s+/).length >= 40 && answer.split(/\s+/).length <= 60, country.slug);
    assert.match(licenseTitle(country.slug, 'en'), /Best crypto exchanges.*licence-checked/);
    const dataset = licenseSchemas(country.slug, 'en').find(schema => schema['@type'] === 'Dataset');
    assert.equal(dataset.mainEntity.numberOfItems, records.length);
    if (!records.length) {
      assert.equal(licenseRouteSeo(`/licenses/${country.slug}`, 'en').indexable, false);
      assert.deepEqual(licenseRouteSeo(`/licenses/${country.slug}`, 'en').alternatesLocales, []);
    }
  }
  const row = { exchange: 'okx', country: 'TR', status: 'licensed' };
  for (const locale of ['vi', 'vi-VN', 'ar', 'ar-AE', 'ur', 'uk', 'ru-RU', 'zh-Hant']) assert.equal(licenseSignup(row, { locale }), null);
  assert.equal(licenseSignup({ ...row, country: 'VN' }, { locale: 'en' }), null);
  assert.equal(licenseSignup({ ...row, country: 'EU' }, { locale: 'en' }), null);
  assert.equal(licenseSignup({ ...row, authorised: false }, { locale: 'tr' }), null);
});

test('all requested jurisdictions have reproducible research and entity provenance', () => {
  const expected = ['PH','BR','NG','ID','VN','IN','KR','TH','MX','AR','PK','UA','TR','AE','SG','JP','HK','EU','GB','AU','CA'];
  assert.deepEqual(Object.keys(licenseResearch).sort(), expected.sort());
  for (const code of expected) {
    const source = JSON.parse(readFileSync(new URL(`../../docs/licence-research/${code}.json`, import.meta.url), 'utf8'));
    assert.equal(licenseResearch[code].checkedDate, source.checkedDate);
    for (const row of source.records) {
      assert.ok(row.exchange === row.exchange.toLowerCase());
      assert.ok(licenseRecords.some(record => record.country === code && record.entityName === row.entityName && record.sourceUrl === row.sourceUrl));
      assert.ok(source.sources.some(item => item.url === row.sourceUrl && /^(read|readable)(?:$|[-_])/.test(item.result)));
      if (row.authorised === false || !['licensed','registered','authorised'].includes(row.status)) assert.equal(licenseSignup(row, { locale: 'en' }), null);
    }
  }
});
test('published sitemap and localized schemas agree with indexable visible records', () => {
  const candidates = licenseSitemapEntries({ urlFor: (path, locale) => `https://nexualpha.com${localizedPath(path, locale)}` });
  const reviewPending = locale => ['ur', 'uk'].includes(locale);
  const entries = candidates.filter(entry => !reviewPending(entry.locale));
  const xml = readFileSync(new URL('../public/sitemap-licenses.xml', import.meta.url), 'utf8');
  const published = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(match => match[1]);
  assert.equal((xml.match(/<loc>/g) || []).length, entries.length);
  for (const entry of candidates.filter(entry => reviewPending(entry.locale))) assert.ok(!xml.includes(`<loc>${entry.loc}</loc>`), entry.loc);
  for (const entry of entries) {
    const block = published.find(body => body.includes(`<loc>${entry.loc}</loc>`));
    assert.ok(block, entry.loc);
    const alternates = [...block.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map(match => ({ hreflang: match[1], href: match[2] }));
    assert.deepEqual(alternates, entry.alternates.filter(alt => !reviewPending(alt.hreflang)), entry.loc);
  }
  for (const locale of LICENSE_INDEX_LOCALES) for (const country of LICENSE_COUNTRIES) {
    const schemas = licenseSchemas(country.slug, locale);
    const dataset = schemas.find(schema => schema['@type'] === 'Dataset');
    const list = schemas.find(schema => schema['@type'] === 'ItemList');
    assert.deepEqual(list, dataset.mainEntity);
    assert.deepEqual(list.itemListElement.map(item => item.url), licenseRecordsForCountry(country.slug).map(row => row.sourceUrl));
  }
});
