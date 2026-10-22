import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { buildSync } from 'esbuild';
import { fileURLToPath } from 'node:url';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const searchDialog = readFileSync(new URL('../src/components/finder/SearchDialog.jsx', import.meta.url), 'utf8');

function between(source, start, end) {
  const a = source.indexOf(start);
  assert.notEqual(a, -1, `missing start: ${start}`);
  const b = source.indexOf(end, a + start.length);
  assert.notEqual(b, -1, `missing end: ${end}`);
  return source.slice(a, b);
}

test('App records a connected search opener for header and mobile menu search', () => {
  assert.match(app, /const searchReturnFocusRef = useRef\(null\)/);
  assert.match(app, /const openSearchDialog = useCallback\(\(event\) => \{/);
  assert.match(app, /const candidate = event\?\.currentTarget/);
  assert.match(app, /searchReturnFocusRef\.current = candidate/);
  assert.match(app, /searchReturnFocusRef\.current = active && active !== document\.body \? active : null/);

  assert.match(app, /<Header[\s\S]*onSearch=\{openSearchDialog\}/);
  assert.match(app, /onClose=\{closeMobile\} onSearch=\{\(\) => \{ closeMobile\(\); onSearch\(\{ currentTarget: mobileTriggerRef\.current \}\)/);
  assert.match(app, /onSearch\(\{ currentTarget: mobileTriggerRef\.current \}\)/);
});

test('SearchDialog restores explicit opener first and clears the stale ref after close', () => {
  assert.match(searchDialog, /returnFocusRef/);
  assert.match(searchDialog, /const explicitReturn = returnFocusRef\?\.current/);
  assert.match(searchDialog, /const target = returnFocusRef\?\.current\?\.isConnected \? returnFocusRef\.current : previous/);
  assert.match(searchDialog, /target !== document\.body/);
  assert.match(searchDialog, /target\.focus\(\{ preventScroll: true \}\)/);
  assert.match(searchDialog, /returnFocusRef\.current = null/);
});

test('SearchDialog still focuses the input first and uses the same cleanup path for Escape and close button', () => {
  assert.match(searchDialog, /querySelector\("input, button, a\[href\]"\)\?\.focus\(\)/);
  assert.match(searchDialog, /event\.key === "Escape"/);
  assert.match(app, /<SearchDialog label=\{copy\.common\.openFinder\} onClose=\{closeSearchDialog\} returnFocusRef=\{searchReturnFocusRef\}/);

  const commandFinderDialog = between(app, 'const searchDialog = searchOpen &&', ';\n  const footer');
  assert.match(commandFinderDialog, /<CommandFinder copy=\{copy\} command=\{command\} autoFocus onClose=\{closeSearchDialog\}/);
  assert.match(commandFinderDialog, /<button type="button" onClick=\{closeSearchDialog\}>\{copy\.common\.closeFinder\}<\/button>/);
});


test('SearchDialog lifecycle restores the explicit opener instead of leaving focus on body', () => {
  const output = buildSync({
    entryPoints: [fileURLToPath(new URL('../src/components/finder/SearchDialog.jsx', import.meta.url))],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    external: ['react', 'react/jsx-runtime'],
  }).outputFiles[0].text;
  let cleanup;
  const focused = [];
  const opener = { isConnected: true, focus: (options) => focused.push(['opener', options]) };
  const input = { isConnected: true, focus: () => focused.push(['input']) };
  const close = { getClientRects: () => [1], focus: () => focused.push(['close']) };
  const dialog = {
    querySelector: () => input,
    querySelectorAll: () => [input, close],
  };
  const fakeReact = {
    useRef: () => ({ current: dialog }),
    useEffect: (fn) => { cleanup = fn(); },
  };
  const module = { exports: {} };
  vm.runInNewContext(output, {
    module,
    exports: module.exports,
    require: (name) => {
      if (name === 'react') return fakeReact;
      if (name === 'react/jsx-runtime') return { jsx: () => ({}), jsxs: () => ({}), Fragment: 'Fragment' };
      throw new Error(name);
    },
    document: {
      activeElement: { isConnected: true, focus: () => focused.push(['previous']) },
      body: { style: { overflow: '' } },
      addEventListener: () => {},
      removeEventListener: () => {},
    },
  });
  const returnFocusRef = { current: opener };
  module.exports.SearchDialog({ label: 'Search', onClose: () => {}, returnFocusRef, children: [] });
  assert.deepEqual(focused.shift(), ['input']);
  cleanup();
  assert.equal(returnFocusRef.current, null);
  assert.equal(focused.at(-1)[0], 'opener');
  assert.equal(focused.at(-1)[1]?.preventScroll, true);
});
