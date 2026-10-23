import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { LOCALE_PREFIX_BY_CODE } from '../src/data/locale-routing.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const raw = await readFile(new URL('./fixtures/footer-redesign-hrefs.json', import.meta.url));
const fixture = JSON.parse(raw);
let rendered;

test.before(async () => {
  const temp = await mkdtemp(path.join(root, 'tests/.tmp-footer-href-contract-'));
  try {
    const bundle = path.join(temp, 'bundle.cjs');
    await build({
      stdin: {
        contents: `
          import React from 'react';
          import { renderToStaticMarkup } from 'react-dom/server';
          import { CleanFooter } from './src/components/v3/CleanFooter.jsx';
          import { CrawlPriorityLinks } from './src/components/shared/CrawlPriorityLinks.jsx';
          const components = { footer: CleanFooter, research: CrawlPriorityLinks };
          const cases = ${JSON.stringify(fixture.snapshots.map(({ component, props }) => ({ component, props })))};
          console.log(JSON.stringify(cases.map(({ component, props }) =>
            renderToStaticMarkup(React.createElement(components[component], props)))));
        `,
        resolveDir: root,
        loader: 'jsx',
      },
      bundle: true,
      platform: 'node',
      format: 'cjs',
      jsx: 'automatic',
      loader: { '.css': 'empty' },
      logLevel: 'warning',
      outfile: bundle,
    });
    rendered = JSON.parse(execFileSync(process.execPath, [bundle], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    }));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('pre-redesign href fixture covers every locale, alias, scope and market gate', () => {
  assert.equal(createHash('sha256').update(raw).digest('hex'), '474889b214c453a80a1690c7f085eeae3775d168b126ed8a595332f4e8344325');
  assert.equal(fixture.provenance.commit, 'ab3f70dd292ea33f070ee1856cde84b47598d122');
  assert.deepEqual(new Set(fixture.locales), new Set([...Object.keys(LOCALE_PREFIX_BY_CODE), 'zh-CN', 'zh-TW']));
  assert.equal(fixture.snapshots.length, 141);
  assert.equal(fixture.snapshots.reduce((count, snapshot) => count + snapshot.hrefs.length, 0), 3353);
  for (const locale of fixture.locales) {
    for (const brazil of [false, true]) {
      assert.ok(fixture.snapshots.some(row => row.component === 'footer'
        && row.props.locale === locale && row.props.brazil === brazil && !row.props.market));
    }
    for (const scope of fixture.scopes) {
      assert.ok(fixture.snapshots.some(row => row.component === 'research'
        && row.props.locale === locale && row.props.scope === scope));
    }
  }
  for (const [locale, market] of [['en', 'TR'], ['en', 'VN'], ['tr', 'SG'], ['tr', 'VN']]) {
    for (const brazil of [false, true]) {
      assert.ok(fixture.snapshots.some(row => row.component === 'footer'
        && row.props.locale === locale && row.props.market === market && row.props.brazil === brazil));
    }
  }
});

for (const component of ['footer', 'research']) {
  test(`${component} retains every pre-redesign SSR href as a crawlable anchor`, () => {
    for (const [index, snapshot] of fixture.snapshots.entries()) {
      if (snapshot.component !== component) continue;
      const dom = new JSDOM(rendered[index]);
      try {
        // Parse real anchors rather than matching strings in comments, JSON, or data attributes.
        // Disclosure/language details remain crawlable; explicit hidden anchors do not count.
        const hrefs = new Set([...dom.window.document.querySelectorAll('a[href]')]
          .filter(anchor => !anchor.closest('[hidden], [aria-hidden="true"], template')
            && !/display\s*:\s*none|visibility\s*:\s*hidden/i.test(anchor.getAttribute('style') || ''))
          .map(anchor => anchor.getAttribute('href')));
        const missing = snapshot.hrefs.filter(href => !hrefs.has(href));
        assert.deepEqual(missing, [], `${component} ${JSON.stringify(snapshot.props)} lost hrefs`);
      } finally {
        dom.window.close();
      }
    }
  });
}
