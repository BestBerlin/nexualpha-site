import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { JSDOM } from 'jsdom';
import { licenseRecords } from '../src/data/licenses.js';
import { licenseTypeLabel, licenseScopeNote, publicFactValue } from '../src/components/licenses/license-presentation.js';

test('Chinese and Arabic license types are translated without changing source records', () => {
  for (const record of licenseRecords) {
    for (const locale of ['zh-Hans', 'zh-Hant', 'ar']) assert.notEqual(licenseTypeLabel(record.type, locale), record.type, record.type);
    assert.equal(licenseTypeLabel(record.type, 'en'), record.type);
  }
  assert.match(licenseScopeNote({ statusNote: 'registered' }, 'zh-Hans'), /不等于全面授权/);
  for (const value of [null, '', '—', 'N/A', '尚未核验', '待官方核验']) assert.equal(publicFactValue(value), false);
  for (const value of ['registered', '0%', '0']) assert.equal(publicFactValue(value), true);
});

test('venue facts collapse long records and announcements show only five compact localized links', async () => {
  const vite = await createServer({ optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom', logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false } });
  try {
    const { ExchangeKeyFacts } = await vite.ssrLoadModule('/src/components/v3/ExchangeKeyFacts.jsx');
    const { ExchangeLicenseSection } = await vite.ssrLoadModule('/src/components/licenses/LicensePages.jsx');
    const { ActivityCards, venueEventSnapshotNow } = await vite.ssrLoadModule('/src/components/v3/VenueDetailPage.jsx');
    for (const locale of ['zh-Hans', 'ar']) {
      const html = renderToStaticMarkup(React.createElement(ExchangeKeyFacts, { slug: 'okx', locale }));
      const doc = new JSDOM(html).window.document;
      assert.equal(doc.querySelector('section > table tbody').children.length, 3);
      assert.ok(doc.querySelector('details:not([open]) table'));
      assert.doesNotMatch(doc.body.textContent, /Regular user|Recorded store listings|Dated factbook|MiCA CASP authorisation|Active; issued/);
      const licenses = renderToStaticMarkup(React.createElement(ExchangeLicenseSection, { slug: 'okx', locale }));
      assert.match(licenses, /<details>/);
      assert.doesNotMatch(licenses, /Active; issued|PSAV registration|VASP Licence/);
    }
    const announcements = Array.from({ length: 12 }, (_, i) => ({ id: `test-${i}`, title: { en: `English ${i}`, 'zh-Hans': `中文标题 ${i}` }, platform: { slug: 'okx', name: 'OKX' }, discoveredAt: '2026-10-14T23:00:00Z', url: `https://www.okx.com/help/test-${i}` }));
    const html = renderToStaticMarkup(React.createElement(ActivityCards, { locale: 'zh-Hans', text: {}, updates: announcements }));
    const doc = new JSDOM(html).window.document;
    assert.equal(doc.querySelectorAll('li').length, 5);
    assert.doesNotMatch(doc.body.textContent, /English/);
    assert.equal(doc.querySelector('time').textContent, '2026-10-14');
    assert.equal(doc.querySelectorAll('a').length, 0, 'OKX source follows the existing outbound policy');
    assert.equal(doc.querySelector('[data-source-plain]').getAttribute('data-source-plain'), 'okx.com');
    const external = renderToStaticMarkup(React.createElement(ActivityCards, { locale: 'zh-Hans', text: {}, updates: [{ ...announcements[0], url: 'https://example.org/official-notice' }] }));
    assert.equal(new JSDOM(external).window.document.querySelector('a').href, 'https://example.org/official-notice');
    assert.equal(venueEventSnapshotNow(announcements), Date.parse('2026-10-14T23:00:00Z'));
    assert.equal(venueEventSnapshotNow([{ publishedAt: 'invalid' }]), 0);
  } finally { await vite.close(); }
});
