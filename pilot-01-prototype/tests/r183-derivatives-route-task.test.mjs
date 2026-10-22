import { existsSync as historicalFixtureExists } from 'node:fs';
// Only historical comparisons need this external review snapshot. Local checks run.
const historicalFixture = new URL("../../../r176-editorial-mobile-integration/candidate/src/components/v3/TopicGuidePage.jsx", import.meta.url);
import {withoutAcceptedR196Tail} from './r198-peer-contract.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { buildSync } from 'esbuild';

const req = createRequire(import.meta.url);
const React = req('react');
const postcss = req('postcss');
const { renderToStaticMarkup } = req('react-dom/server');
const root = fileURLToPath(new URL('../', import.meta.url));
const base = fileURLToPath(new URL('../../../r176-editorial-mobile-integration/candidate/', import.meta.url));
const locales = ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it'];
const read = (r, p) => readFileSync(path.join(r, p), 'utf8');
const routeIds = ['cex-account','wallet-perp-dex','specialist-options-perps','gmx-pool-route'];

function load(r, selectedRouteId = null) {
  const file = path.join(r, 'src/components/v3/TopicGuidePage.jsx');
  let stateCalls = 0;
  const output = buildSync({
    entryPoints: [file],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    loader: { '.css': 'empty' },
    external: ['react', 'react/jsx-runtime'],
  }).outputFiles[0].text;
  const module = { exports: {} };
  const fakeReact = {
    ...React,
    useState(init) {
      stateCalls += 1;
      if (stateCalls === 1 && selectedRouteId !== null) return [selectedRouteId, () => {}];
      return React.useState(init);
    },
  };
  const reactModule = selectedRouteId === null ? React : fakeReact;
  vm.runInNewContext(output, { module, exports: module.exports, require: (name) => name === 'react' ? reactModule : req(name), URL, URLSearchParams, Intl, Date, console });
  return module.exports;
}

function renderTopic(mod, slug, locale) {
  return renderToStaticMarkup(React.createElement(mod.TopicGuidePage, { slug, locale, market: 'BR', product: 'perp' }));
}


function loadWithStateHarness(r, initialSelectedRouteId = null) {
  const file = path.join(r, 'src/components/v3/TopicGuidePage.jsx');
  const stateSets = [];
  const refs = [];
  let selectedRouteId = initialSelectedRouteId;
  const output = buildSync({
    entryPoints: [file],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    loader: { '.css': 'empty' },
    external: ['react', 'react/jsx-runtime'],
  }).outputFiles[0].text;
  const module = { exports: {} };
  const fakeReact = {
    ...React,
    useEffect() {},
    useRef(init) {
      const ref = { current: init };
      refs.push(ref);
      return ref;
    },
    useState(init) {
      return [selectedRouteId ?? init, (next) => {
        selectedRouteId = typeof next === 'function' ? next(selectedRouteId) : next;
        stateSets.push(selectedRouteId);
      }];
    },
  };
  vm.runInNewContext(output, { module, exports: module.exports, require: (name) => name === 'react' ? fakeReact : req(name), URL, URLSearchParams, Intl, Date, console });
  return {
    mod: module.exports,
    stateSets,
    refs,
    get selectedRouteId() { return selectedRouteId; },
    set selectedRouteId(next) { selectedRouteId = next; },
  };
}

function walkElements(node, visit) {
  if (node == null || typeof node === 'boolean') return;
  if (Array.isArray(node)) {
    for (const child of node) walkElements(child, visit);
    return;
  }
  if (typeof node !== 'object') return;
  visit(node);
  const children = node.props?.children;
  if (children != null) walkElements(children, visit);
}


function findArticle(tree, routeId) {
  let found = null;
  walkElements(tree, (node) => {
    if (node.type === 'article' && node.props?.['data-derivatives-route-id'] === routeId) found = node;
  });
  assert.ok(found, `article ${routeId} exists`);
  return found;
}

function findFirstByType(tree, type) {
  let found = null;
  walkElements(tree, (node) => {
    if (!found && node.type === type) found = node;
  });
  assert.ok(found, `${type} exists`);
  return found;
}

function findChoice(tree, routeId) {
  let found = null;
  walkElements(tree, (node) => {
    if (node.props?.['data-derivatives-route-choice'] === routeId) found = node;
  });
  assert.ok(found, `choice ${routeId} exists`);
  return found;
}

function section(html) {
  const marker = 'data-testid="derivatives-decision-routes"';
  const start = html.indexOf(marker);
  assert.ok(start >= 0, 'derivatives section exists');
  const before = html.lastIndexOf('<section', start);
  const end = html.indexOf('<section id="perp-cost-field-dictionary"', start);
  assert.ok(before >= 0 && end > before, 'derivatives section boundary exists');
  return html.slice(before, end);
}

function hrefs(html) {
  return [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((m) => m[1]).sort();
}

function normalizeVolatileHtml(html) {
  return html.replace(/tg_expires=\d+/g, 'tg_expires=TIMESTAMP');
}


function originalRouteText(html, context) {
  const cards = [...html.matchAll(/<article\b[^>]*data-derivatives-route-id="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)];
  assert.deepEqual(cards.map((card) => card[1]), routeIds, context + ' preserves all four original ordered route cards');
  return cards.map((card) => {
    const summaries = [...card[2].matchAll(/<summary>([\s\S]*?)<\/summary>/g)].map((match) => match[1]);
    const bodies = [...card[2].matchAll(/<p>([\s\S]*?)<\/p>/g)].map((match) => match[1]);
    const checks = [...card[2].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((match) => match[1]);
    assert.equal(summaries.length, 1, context + '/' + card[1] + ' one original summary');
    assert.equal(bodies.length, 1, context + '/' + card[1] + ' one original body');
    assert.equal(checks.length, 3, context + '/' + card[1] + ' three original checks');
    for (const text of [...summaries, ...bodies, ...checks]) assert.ok(text.trim().length > 0, context + '/' + card[1] + ' original text must not be empty');
    return { id: card[1], summaries, bodies, checks };
  });
}

function assertOriginalRouteText(before, after, context) {
  const original = originalRouteText(before, context + '/original');
  const current = originalRouteText(after, context + '/current');
  assert.deepEqual(current, original, context + ' all original summary/body/check bytes remain in their own route');
  return { summaries: original.reduce((n, route) => n + route.summaries.length, 0), bodies: original.reduce((n, route) => n + route.bodies.length, 0), checks: original.reduce((n, route) => n + route.checks.length, 0) };
}

test('R183 derivatives SSR preserves all original route text and complete original route links in every locale', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
  const oldMod = load(base);
  const newMod = load(root);
  const totals = { locales: 0, summaries: 0, bodies: 0, checks: 0 };
  for (const locale of locales) {
    const before = section(renderTopic(oldMod, 'derivatives', locale));
    const after = section(renderTopic(newMod, 'derivatives', locale));
    const counts = assertOriginalRouteText(before, after, locale);
    totals.locales += 1;
    for (const field of ['summaries', 'bodies', 'checks']) totals[field] += counts[field];
    for (const id of routeIds) assert.match(after, new RegExp(`data-derivatives-route-id="${id}"`), locale + '/' + id);
    const oldSummaries = [...before.matchAll(/<summary>([\s\S]*?)<\/summary>/g)].map((m) => m[1]);
    assert.equal(oldSummaries.length, 4, locale + ' baseline must expose four summaries; empty protection is a failure');
    for (const summary of oldSummaries) assert.ok(after.includes(summary), locale + ' preserves summary ' + summary);
    const oldParagraphs = [...before.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
    assert.equal(oldParagraphs.length, 4, locale + ' four nonempty original route bodies');
    for (const paragraph of oldParagraphs) assert.ok(after.includes(paragraph), locale + ' preserves route body');
    const oldChecks = [...before.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
    assert.equal(oldChecks.length, 12, locale + ' twelve original checklist items');
    for (const check of oldChecks) assert.ok(after.includes(`<li>${check}</li>`), locale + ' preserves check');
    const afterHrefCounts = new Map(hrefs(after).map((href) => [href, hrefs(after).filter((x) => x === href).length]));
    for (const href of hrefs(before)) assert.ok((afterHrefCounts.get(href) || 0) >= hrefs(before).filter((x) => x === href).length, locale + ' preserves href ' + href);
  }
  assert.deepEqual(totals, { locales: 15, summaries: 60, bodies: 60, checks: 180 }, 'all fifteen languages execute real nonempty original text protection');
});

test('R183 non-derivatives topic SSR remains byte-identical', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
  const oldMod = load(base);
  const newMod = load(root);
  for (const locale of ['en','ja','ar','pt-BR','zh-Hant']) {
    assert.equal(normalizeVolatileHtml(renderTopic(newMod, 'meme-coins', locale)), normalizeVolatileHtml(renderTopic(oldMod, 'meme-coins', locale)), locale + ' meme topic exact except volatile telegram expiry');
  }
});

test('R183 selected route becomes clear reading state without duplicating four long route buttons', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
  const mod = load(root, 'wallet-perp-dex');
  const html = section(renderTopic(mod, 'derivatives', 'en'));
  assert.match(html, /class="topic-derivatives-route-picker"/);
  assert.equal((html.match(/data-derivatives-route-choice=/g) || []).length, 4);
  assert.doesNotMatch(html, /data-derivatives-route-choice="wallet-perp-dex"[^>]*>Wallet-connected Perp DEX route</, 'route choices use compact labels, not duplicated long card titles');
  assert.match(html, /data-derivatives-route-id="wallet-perp-dex"[^>]*data-derivatives-route-state="selected"/);
  assert.match(html, /<details class="topic-derivatives-route-detail" open=""/);
  assert.match(html, /data-derivatives-route-choice="wallet-perp-dex"[^>]*aria-pressed="true"/);
  assert.match(html, /href="\/topics\/derivatives\?market=BR&amp;product=perp#perp-cost-field-dictionary"/);
});


test('R183 route picker is locale-visible, accessible, and does not create recommendation claims', () => {
  const mod = load(root);
  for (const locale of locales) {
    const html = section(renderTopic(mod, 'derivatives', locale));
    assert.equal((html.match(/data-derivatives-route-choice=/g) || []).length, 4, locale + ' has four route choices');
    assert.equal((html.match(/aria-pressed="false"/g) || []).length, 4, locale + ' default SSR leaves choices unselected');
    assert.equal((html.match(/data-derivatives-route-state="unselected"/g) || []).length, 4, locale + ' default SSR leaves cards unselected');
    assert.doesNotMatch(html, /recommended|best route|eligible|qualified|approved|review complete/i, locale + ' avoids recommendation or qualification claims');
    for (const id of routeIds) {
      const card = html.match(new RegExp(`data-derivatives-route-id="${id}"[\\s\\S]*?<summary>([\\s\\S]*?)<\/summary>`));
      const choice = html.match(new RegExp(`data-derivatives-route-choice="${id}"[^>]*aria-label="([^"]+)"[^>]*>([\\s\\S]*?)<\/button>`));
      assert.ok(card, locale + '/' + id + ' card exists');
      assert.ok(choice, locale + '/' + id + ' choice exists');
      assert.ok(choice[1].includes(card[1]), locale + '/' + id + ' aria label includes complete route title');
      assert.ok(choice[1].includes(choice[2]), locale + '/' + id + ' aria label includes visible short label');
      assert.notEqual(choice[2], card[1], locale + '/' + id + ' visible choice keeps compact label');
    }
  }
});


test('R183 route choice handlers dispatch route ids and reopen the same native details after manual close', () => {
  const harness = loadWithStateHarness(root);

  let tree = harness.mod.TopicGuidePage({ slug: 'derivatives', locale: 'en', market: 'BR', product: 'perp' });
  const buttons = [];
  walkElements(tree, (node) => {
    if (node.props?.['data-derivatives-route-choice']) buttons.push(node);
  });
  assert.deepEqual(buttons.map((button) => button.props['data-derivatives-route-choice']), routeIds);
  for (const button of buttons) assert.equal(button.props['aria-pressed'], false);

  const targetId = 'wallet-perp-dex';
  const firstArticle = findArticle(tree, targetId);
  const firstDetails = findFirstByType(firstArticle, 'details');
  const fakeDetailsNode = { open: false };
  firstDetails.props.ref(fakeDetailsNode);

  const firstChoice = findChoice(tree, targetId);
  firstChoice.props.onClick();
  assert.equal(harness.selectedRouteId, targetId, 'first click stores selected route');
  assert.equal(fakeDetailsNode.open, true, 'first click imperatively opens native details');

  tree = harness.mod.TopicGuidePage({ slug: 'derivatives', locale: 'en', market: 'BR', product: 'perp' });
  const selectedArticle = findArticle(tree, targetId);
  const selectedDetails = findFirstByType(selectedArticle, 'details');
  assert.equal(selectedDetails.props.open, true, 'selected state renders native details open');
  selectedDetails.props.onToggle({ currentTarget: { open: false } });
  assert.equal(harness.selectedRouteId, null, 'native close clears selected state');

  fakeDetailsNode.open = false;
  tree = harness.mod.TopicGuidePage({ slug: 'derivatives', locale: 'en', market: 'BR', product: 'perp' });
  const closedArticle = findArticle(tree, targetId);
  const closedDetails = findFirstByType(closedArticle, 'details');
  closedDetails.props.ref(fakeDetailsNode);
  const repeatedChoice = findChoice(tree, targetId);
  repeatedChoice.props.onClick();
  assert.equal(harness.selectedRouteId, targetId, 'same route click after native close stores selected route again');
  assert.equal(fakeDetailsNode.open, true, 'same route click after native close reopens native details despite prior same-id history');
  assert.deepEqual(harness.stateSets, [targetId, null, targetId]);
});


function between(css, startSelector, endSelector) {
  const start = css.indexOf(startSelector);
  const end = css.indexOf(endSelector, start + startSelector.length);
  assert.ok(start >= 0, `start selector ${startSelector} exists`);
  assert.ok(end > start, `end selector ${endSelector} follows ${startSelector}`);
  return css.slice(start, end);
}


function blockFrom(css, start) {
  const open = css.indexOf('{', start);
  assert.ok(open > start, 'block has opening brace');
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') depth -= 1;
    if (depth === 0) return css.slice(start, i + 1);
  }
  throw new Error('block does not close');
}

function atRuleBlock(css, signature) {
  const start = css.indexOf(signature);
  assert.ok(start >= 0, `at-rule ${signature} exists`);
  return blockFrom(css, start);
}

function removeBlock(css, selector) {
  const start = css.indexOf(selector);
  assert.ok(start >= 0, `selector ${selector} exists`);
  const open = css.indexOf('{', start);
  assert.ok(open > start, `selector ${selector} has opening brace`);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') depth -= 1;
    if (depth === 0) {
      let end = i + 1;
      while (css[end] === '\n') end += 1;
      return css.slice(0, start) + css.slice(end);
    }
  }
  throw new Error(`selector ${selector} block does not close`);
}

test('R183 derivatives CSS parses, keeps compact choices/evidence keyboard-sized, and has no motion in scoped additions', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, async () => {
  const css = withoutAcceptedR196Tail(read(root, 'src/components/v3/topic-guide.css'));
  await postcss().process(css, { from: 'topic-guide.css' });
  const addedSelectors = [
    '.topic-derivatives-route-picker',
    '.topic-derivatives-route-choice',
    '.topic-derivatives-route-choice[aria-pressed="true"]',
    '.topic-derivatives-route-choice:focus-visible',
    '.topic-derivatives-route-card.is-selected',
    '.topic-derivatives-route-selected',
    '.topic-derivatives-evidence-next',
    '.topic-derivatives-evidence-next a',
    '.topic-derivatives-evidence-next a:focus-visible',
  ];
  const addedBlocks = addedSelectors.map((selector) => between(css, selector, selector === '.topic-derivatives-evidence-next a:focus-visible' ? '.topic-derivatives-route-detail .topic-nav-strip' : addedSelectors[addedSelectors.indexOf(selector) + 1] || '.topic-derivatives-route-detail .topic-nav-strip')).join('\n');
  assert.match(between(css, '.topic-derivatives-route-choice', '.topic-derivatives-route-choice[aria-pressed="true"]'), /min-height:\s*44px;/);
  assert.match(between(css, '.topic-derivatives-evidence-next a', '.topic-derivatives-evidence-next a:focus-visible'), /min-height:\s*44px;/);
  assert.doesNotMatch(addedBlocks, /animation\s*:|transition\s*:/, 'scoped derivatives route additions do not add motion');
  assert.doesNotMatch(atRuleBlock(css, '@media (max-width: 768px)'), /\.topic-derivatives-route-picker|\.topic-derivatives-route-choice/, 'mobile media query does not duplicate route picker/choice rules');
});


test('R183 topic CSS has an exact inverse back to R176 except the scoped derivatives route additions', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
  const css = withoutAcceptedR196Tail(read(root, 'src/components/v3/topic-guide.css'));
  const baseCss = read(base, 'src/components/v3/topic-guide.css');
  let inverse = css;
  for (const selector of [
    '.topic-derivatives-route-picker',
    '.topic-derivatives-route-choice',
    '.topic-derivatives-route-choice[aria-pressed="true"]',
    '.topic-derivatives-route-choice:focus-visible',
    '.topic-derivatives-route-card.is-selected',
    '.topic-derivatives-route-selected',
    '.topic-derivatives-evidence-next',
    '.topic-derivatives-evidence-next a',
    '.topic-derivatives-evidence-next a:focus-visible',
  ]) inverse = removeBlock(inverse, selector);
  assert.equal(inverse, baseCss, 'removing the scoped R183 derivatives additions restores R176 topic CSS byte-for-byte');
  assert.equal(between(css, '.topic-source-detail__links a', '.topic-cost-dictionary__grid'), between(baseCss, '.topic-source-detail__links a', '.topic-cost-dictionary__grid'), 'source links remain byte-identical to R176');
});


test('R183 source boundaries remain unchanged outside the scoped derivatives implementation', { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
  for (const p of ['src/data/partner-registry.js','src/data/topic-guides-data.js','src/data/source-bound-cta.js','src/App.jsx']) assert.equal(read(root, p), read(base, p), p);
});


for (const locale of ['en', 'ja', 'ar']) {
  for (const [name, mutate] of [
    ['empty summary despite original title remaining in picker aria', (html) => html.replace(/<summary>[\s\S]*?<\/summary>/, '<summary></summary>')],
    ['rewritten route body', (html) => html.replace(/<p>([\s\S]*?)<\/p>/, '<p>UNAUTHORIZED REWRITTEN BODY</p>')],
    ['removed checklist item', (html) => html.replace(/<li>[\s\S]*?<\/li>/, '')],
    ['missing original route body', (html) => html.replace(/<p>[\s\S]*?<\/p>/, '')],
  ]) {
    test('R183 text protection rejects ' + locale + ': ' + name, { skip: !historicalFixtureExists(historicalFixture) && "Missing historical review fixture: " + historicalFixture.pathname }, () => {
      const before = section(renderTopic(load(base), 'derivatives', locale));
      const after = section(renderTopic(load(root), 'derivatives', locale));
      const changed = mutate(after);
      assert.notEqual(changed, after, 'negative fixture really changes actual SSR');
      assert.throws(() => assertOriginalRouteText(before, changed, locale));
    });
  }
}

test('R183 original text protection rejects an empty baseline instead of vacuous preservation', () => {
  const after = section(renderTopic(load(root), 'derivatives', 'en'));
  assert.throws(() => assertOriginalRouteText('', after, 'empty-baseline'));
});
