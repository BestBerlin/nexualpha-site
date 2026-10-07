import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

// Reuse the workspace's existing compiler; no candidate dependency is added.
const requireCompiler = createRequire(new URL('../../../../pilot-01-prototype/package.json', import.meta.url));
const { transformSync } = requireCompiler('esbuild');
const locales = ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'es', 'pt-BR', 'fr', 'de', 'tr', 'ru', 'ar', 'id', 'vi', 'it'];
const tableBody = '| A | B | C | D |\n| --- | --- | --- | --- |\n| first | second | third | last |';
const article = { slug: 'fixture', content: Object.fromEntries(locales.map(locale => [locale, tableBody])), title: 'Fixture', categoryName: 'Research', publishedAt: '2026-10-05', readTime: '2 min', author: 'Fixture', sources: [] };

function events() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    dispatch(type) { for (const fn of [...(listeners.get(type) || [])]) fn({ type }); },
    count() { return [...listeners.values()].reduce((n, list) => n + list.size, 0); }
  };
}
function clock() {
  let now = 0, id = 0;
  const tasks = new Map();
  const add = (fn, delay, interval) => { tasks.set(++id, { fn, due: now + delay, interval }); return id; };
  return {
    setInterval: (fn, delay) => add(fn, delay, delay),
    setTimeout: (fn, delay) => add(fn, delay, 0),
    clearInterval: value => tasks.delete(value),
    clearTimeout: value => tasks.delete(value),
    count: () => tasks.size,
    advance(ms) {
      const end = now + ms;
      for (;;) {
        const next = [...tasks].sort((a, b) => a[1].due - b[1].due)[0];
        if (!next || next[1].due > end) break;
        const [key, task] = next; now = task.due;
        if (task.interval) task.due += task.interval; else tasks.delete(key);
        task.fn();
      }
      now = end;
    }
  };
}
function harness(file, { reduced = false, hidden = false, width = 390, expose = '' } = {}) {
  const media = { ...events(), matches: reduced };
  const document = { ...events(), hidden };
  const window = { ...events(), innerWidth: width, matchMedia: () => media };
  const timers = clock();
  const slots = [], pending = [];
  let cursor = 0;
  const React = {
    Fragment: 'fragment',
    createElement(type, props, ...children) { return { type, props: props || {}, children: children.flat(Infinity) }; },
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, value => { slots[index].value = typeof value === 'function' ? value(slots[index].value) : value; }];
    },
    useRef(initial) { const index = cursor++; slots[index] ??= { current: initial }; return slots[index]; },
    useEffect(fn, deps) {
      const index = cursor++, previous = slots[index];
      if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
        pending.push(() => { previous?.cleanup?.(); slots[index] = { deps, fn, cleanup: fn() }; });
      }
    }
  };
  const mocks = {
    getNewsArticleBySlug: () => article,
    venueDatabase: {}, OKX_USD_USDC_OWNER_CHECKLIST: { slug: 'other' },
    resolveNewsContentLocale: locale => locale,
    localizedValue: (value, locale) => typeof value === 'object' ? value[locale] || value.en : value,
    localizedNewsTitle: () => 'Fixture', localizedNewsSummary: () => 'Fixture summary',
    contextualHref: href => href, injectSeoMetadata() {}
  };
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  const compiled = transformSync(source + expose, { loader: 'jsx', format: 'cjs', jsx: 'transform' }).code;
  const module = { exports: {} };
  vm.runInNewContext(compiled, { module, exports: module.exports, require: name => name === 'react' ? React : mocks, window, document, ...timers });
  return {
    module: module.exports, window, document, media, timers,
    render(component, props) { cursor = 0; return component(props); },
    flush() { while (pending.length) pending.shift()(); },
    replayEffects() { for (const slot of slots) if (slot?.fn) { slot.cleanup?.(); slot.cleanup = slot.fn(); } },
    unmount() { for (const slot of slots) slot?.cleanup?.(); }
  };
}
function find(node, type) {
  if (!node || typeof node !== 'object') return undefined;
  if (node.type === type) return node;
  for (const child of node.children || []) { const found = find(child, type); if (found) return found; }
}
function proof(options) {
  const h = harness('../src/components/v3/LiveConversionProof.jsx', options);
  h.draw = () => h.render(h.module.LiveConversionProof, { locale: 'en' });
  h.draw(); h.flush();
  return h;
}
function news(options) {
  const h = harness('../src/components/v3/news/NewsDetailPage.jsx', options);
  h.props = { slug: 'fixture', locale: 'en', initialArticles: [article] };
  h.draw = () => h.render(h.module.NewsDetailPage, h.props);
  return h;
}

test('reduced motion keeps one labelled static example and creates no timer', () => {
  const h = proof({ reduced: true });
  const initial = h.draw(); h.timers.advance(30000);
  assert.deepEqual(h.draw(), initial);
  assert.equal(h.timers.count(), 0);
  assert.match(initial.props['aria-label'], /not a live user event/);
  h.unmount(); assert.equal(h.media.count() + h.document.count(), 0);
});
test('normal rotation runs, then visibility cancels the pending hide/update and resumes without catch-up', () => {
  const h = proof(); h.timers.advance(4500);
  assert.match(h.draw().props.className, /--out/);
  h.document.hidden = true; h.document.dispatch('visibilitychange');
  assert.equal(h.timers.count(), 0); assert.match(h.draw().props.className, /--in/);
  const paused = h.draw(); h.timers.advance(30000); assert.deepEqual(h.draw(), paused);
  h.document.hidden = false; h.document.dispatch('visibilitychange');
  assert.equal(h.timers.count(), 1); h.timers.advance(4900);
  assert.notDeepEqual(h.draw(), paused); h.unmount();
});
test('switching reduced motion on cancels pending callbacks; switching off restarts one interval', () => {
  const h = proof(); h.timers.advance(4500);
  h.media.matches = true; h.media.dispatch('change');
  const frozen = h.draw(); assert.equal(h.timers.count(), 0);
  h.timers.advance(30000); assert.deepEqual(h.draw(), frozen);
  h.media.matches = false; h.media.dispatch('change'); assert.equal(h.timers.count(), 1);
  h.unmount(); assert.equal(h.timers.count(), 0);
});
test('unmount while fade timeout is queued removes both timers and both listeners', () => {
  const h = proof(); h.timers.advance(4500); assert.equal(h.timers.count(), 2);
  h.unmount(); assert.equal(h.timers.count(), 0);
  assert.equal(h.document.count() + h.media.count(), 0);
  const stopped = h.draw(); h.timers.advance(30000); assert.deepEqual(h.draw(), stopped);
});
test('hidden initial tab has no rotation until foregrounded', () => {
  const h = proof({ hidden: true }); assert.equal(h.timers.count(), 0);
  h.document.hidden = false; h.document.dispatch('visibilitychange');
  assert.equal(h.timers.count(), 1); h.unmount();
});
test('pre-hydration native expansion is adopted and survives effect replay', () => {
  const h = news({ width: 390 });
  const details = find(h.draw(), 'details'); details.props.ref.current = { open: true };
  h.flush(); assert.equal(find(h.draw(), 'details').props.open, true);
  h.replayEffects(); assert.equal(find(h.draw(), 'details').props.open, true);
});
test('mobile reader expansion survives same-width and cross-breakpoint resize', () => {
  const h = news({ width: 390 }); h.draw(); h.flush();
  find(h.draw(), 'details').props.onToggle({ currentTarget: { open: true } });
  for (const width of [390, 600, 900]) {
    h.window.innerWidth = width; h.window.dispatch('resize'); h.draw(); h.flush();
    assert.equal(find(h.draw(), 'details').props.open, true);
  }
});
test('desktop reader collapse survives resize but a new language receives its default', () => {
  const h = news({ width: 900 }); h.draw(); h.flush();
  assert.equal(find(h.draw(), 'details').props.open, true);
  find(h.draw(), 'details').props.onToggle({ currentTarget: { open: false } });
  h.window.innerWidth = 920; h.window.dispatch('resize'); h.draw(); h.flush();
  assert.equal(find(h.draw(), 'details').props.open, false);
  h.props.locale = 'ja'; h.draw(); h.flush();
  assert.equal(find(h.draw(), 'details').props.open, true);
  h.window.innerWidth = 390; h.props.locale = 'ko'; h.draw(); h.flush();
  assert.equal(find(h.draw(), 'details').props.open, false);
});
test('four-column table retains all cells inside a named keyboard-focusable local region in all 15 locales', () => {
  const h = harness('../src/components/v3/news/NewsDetailPage.jsx', { expose: '\nexport { copy, renderMarkdownBlock };' });
  const english = h.module.copy.en.tableScrollHint;
  for (const locale of locales) {
    const tree = h.module.renderMarkdownBlock(tableBody, 8, h.module.copy[locale]);
    const hint = find(tree, 'p'); const region = tree.children[1]; const table = find(tree, 'table');
    assert.equal(region.props.role, 'region'); assert.equal(region.props.tabIndex, 0);
    assert.equal(region.props['aria-labelledby'], hint.props.id);
    assert.ok(hint.children[0]); if (locale !== 'en') assert.notEqual(hint.children[0], english);
    assert.equal(table.props.style['--news-table-columns'], 4);
    assert.equal(find(table, 'thead').children[0].children.length, 4);
    assert.equal(find(table, 'tbody').children[0].children.length, 4);
    assert.equal(find(table, 'tbody').children[0].children[3].children[0], 'last');
    assert.ok(find(table, 'thead').children[0].children.every(cell => cell.props.scope === 'col'));
  }
});

test('separator-only editorial table does not crash article rendering', () => {
  const h = harness('../src/components/v3/news/NewsDetailPage.jsx', { expose: '\nexport { copy, renderMarkdownBlock };' });
  const tree = h.module.renderMarkdownBlock('| --- | --- |\n| --- | --- |', 9, h.module.copy.en);
  const table = find(tree, 'table');
  assert.equal(find(table, 'thead').children[0].children.length, 0);
  assert.equal(find(table, 'tbody').children.length, 0);
});
