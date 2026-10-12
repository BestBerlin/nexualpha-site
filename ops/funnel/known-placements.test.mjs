import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { knownPlacementDiscovery, knownPlacementRecords, knownPlacements } from './known-placements.mjs';

function fixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), 'known-placements-'));
  mkdirSync(join(root, 'pilot-01-prototype/src/components/v3'), { recursive: true });
  mkdirSync(join(root, 'pilot-01-prototype/src/data'), { recursive: true });
  mkdirSync(join(root, 'pilot-01-prototype/server'), { recursive: true });
  mkdirSync(join(root, 'ops/alert-sender'), { recursive: true });
  mkdirSync(join(root, 'ops/channel-feed'), { recursive: true });
  mkdirSync(join(root, 'ops/shorts'), { recursive: true });
  mkdirSync(join(root, 'tests'), { recursive: true });
  writeFileSync(join(root, 'pilot-01-prototype/src/components/v3/Example.jsx'), `
    <a data-cta-placement="directory-card" href="/go/okx?src=hero-link">go</a>
    <a data-cta-placement={'compare-final-choice-registration'} />
    <a data-cta-placement={\`mobile-nav-\${item.id}\`} />
    <Cta placement="home-v7-hero" />
    const click = { partner: "okx", src: "object-placement", kind: "site" };
    const config = { placement: "placement-config-literal" };
  `);
  writeFileSync(join(root, 'pilot-01-prototype/src/components/v3/MobileBottomNav.jsx'), `
    const item = { id: "search" };
  `);
  writeFileSync(join(root, 'pilot-01-prototype/src/components/v3/CollectionHubPage.jsx'), `
    const placement = \`\${kind}-collection-hero-secondary\`;
  `);
  writeFileSync(join(root, 'pilot-01-prototype/src/data/market-data-pages.js'), `
    export const EMBED_KINDS = Object.freeze({ liquidations: { path: "/liquidations" }, "funding-rates": { path: "/funding-rates" } });
  `);
  writeFileSync(join(root, 'pilot-01-prototype/src/data/academy-season1.js'), `
    export const ACADEMY_EPISODES = [
      { "id": "E01", "slug": "first" },
      { "id": "E12", "slug": "finale" }
    ];
  `);
  writeFileSync(join(root, 'pilot-01-prototype/server/embed-widgets.mjs'), `
    const href = "https://nexualpha.com/liquidations?src=embed-liquidations";
  `);
  writeFileSync(join(root, 'ops/alert-sender/alert-sender.mjs'), `
    export const LANGS = ["zh", "en"];
    const url = "https://nexualpha.com/go/okx?src=tg-alert";
    lines.push(readMore(lang, "/liquidations", "tg-listing"));
    const more = readMore(lang, "/liquidations", "tg-alert");
    await send(tok, chat, eventMessage(ev, mk, lang), partnerButtons(partners, lang, \`tg-alert-channel-\${lang}\`));
    await dm(uid, eventMessage(ev, mk, msgLang(u)), partnerButtons(partners, msgLang(u), \`tg-alert-dm-\${msgLang(u)}\`));
    const dynamic = "https://nexualpha.com/go/okx?src=tg-digest-\${lang}";
  `);
  writeFileSync(join(root, 'ops/channel-feed/channel-feed.mjs'), `
    const LOCALE_PATH = { zh: "/zh-hans", en: "", ru: "/ru" };
  `);
  writeFileSync(join(root, 'ops/channel-feed/article-feed.mjs'), `
    export const ARTICLE_LANGS = ["zh", "en"];
  `);
  writeFileSync(join(root, 'ops/channel-feed/pin-guide.mjs'), `
    export const GUIDE_LANGS = ["zh"];
  `);
  writeFileSync(join(root, 'ops/alert-sender/channel-rhythm.mjs'), `
    export const RHYTHM_LANGS = ["zh", "en"];
  `);
  writeFileSync(join(root, 'ops/shorts/strings.mjs'), `
    export const PLATFORM_KEYS = ['youtube','x'];
  `);
  writeFileSync(join(root, 'ops/shorts/builders.mjs'), `
    const url = \`https://nexualpha.com/liquidations?src=\${platform}-short\`;
  `);
  writeFileSync(join(root, 'tests/not-truth.test.mjs'), `
    const bad = "https://nexualpha.com/go/okx?src=test-only";
    const node = '<a data-cta-placement="fixture-only"></a>';
  `);
  return root;
}

test('discovers literal placements, query src values, finite dynamic families, and provenance', () => {
  const root = fixtureRoot();
  try {
    const placements = knownPlacements(root);
    assert.ok(placements.includes('directory-card'));
    assert.ok(placements.includes('compare-final-choice-registration'));
    assert.ok(placements.includes('hero-link'));
    assert.ok(placements.includes('home-v7-hero'));
    assert.ok(placements.includes('placement-config-literal'));
    assert.ok(placements.includes('object-placement'));
    assert.ok(placements.includes('tg-alert'));
    assert.ok(placements.includes('tg-listing'));
    assert.ok(placements.includes('tg-alert-dm-en'));
    assert.ok(placements.includes('tg-alert-channel-en'));
    assert.ok(placements.includes('tg-digest-zh'));
    assert.ok(placements.includes('tg-digest-en'));
    assert.equal(placements.includes('tg-digest-ru'), false, 'alert sender languages are derived from LANGS, not a shared superset');
    assert.equal(placements.includes('tg-digest'), false, 'dynamic ?src prefixes are not recorded as real placements');
    assert.ok(placements.includes('academy-e01'));
    assert.ok(placements.includes('academy-e12'));
    assert.ok(placements.includes('embed-liquidations'));
    assert.ok(placements.includes('embed-funding-rates'), 'static embed kind expansion covers non-literal active kinds');
    assert.ok(placements.includes('mobile-nav-search'), 'finite UI item expansion is recorded once the template is active in source');
    assert.equal(placements.includes('fixture-only'), false);
    assert.equal(placements.includes('test-only'), false);
    assert.equal(placements.includes('unknown'), false);
    assert.equal([...placements].sort().join('\n'), placements.join('\n'), 'registry order is reproducible');
    const record = knownPlacementRecords(root).find((item) => item.src === 'directory-card');
    assert.deepEqual([...new Set(record.provenance.map((item) => item.kind))], ['data-cta-placement']);
    assert.match(record.provenance[0].source, /Example\.jsx$/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('discovery reports ignored truth sources and unresolved template families', () => {
  const root = fixtureRoot();
  try {
    const discovery = knownPlacementDiscovery(root);
    assert.ok(discovery.ignoredSegments.includes('tests'));
    assert.ok(discovery.dynamicFamilies.some((item) => item.family === 'embed widget landing attribution'));
    assert.ok(discovery.unresolvedDynamicFamilies.some((item) => item.pattern.includes('regional-onchain')));
    assert.ok(discovery.records.some((item) => item.src === 'academy-e01'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
