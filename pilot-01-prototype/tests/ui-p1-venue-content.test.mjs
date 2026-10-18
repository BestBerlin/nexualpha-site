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

test('venue announcements show at most five localized items and SSR shares the snapshot clock (#418)', async () => {
  const vite = await createServer({ optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom', logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false } });
  try {
    const { ActivityCards, venueEventSnapshotNow } = await vite.ssrLoadModule('/src/components/v3/VenueDetailPage.jsx');
    const announcements = Array.from({ length: 12 }, (_, i) => ({ id: `test-${i}`, title: { en: `English ${i}`, 'zh-Hans': `中文标题 ${i}` }, platform: { slug: 'okx', name: 'OKX' }, discoveredAt: '2026-10-14T23:00:00Z', url: `https://www.okx.com/help/${i}` }));
    const html = renderToStaticMarkup(React.createElement(ActivityCards, { locale: 'zh-Hans', updates: announcements }));
    const doc = new JSDOM(html).window.document;
    assert.ok(doc.querySelectorAll('li').length <= 5);
    assert.doesNotMatch(doc.body.textContent, /English/);
    assert.equal(venueEventSnapshotNow(announcements), Date.parse('2026-10-14T23:00:00Z'));
    assert.equal(venueEventSnapshotNow([{ publishedAt: 'invalid' }]), 0);
  } finally { await vite.close(); }
});
