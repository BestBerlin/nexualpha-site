import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const parent = path.resolve(root, '..');
const componentFile = 'src/components/v3/VenueYellowPages.jsx';
const cssFile = 'src/components/v3/venue-yellow-pages.css';
const componentPath = path.join(root, componentFile);
const cssPath = path.join(root, cssFile);
const baselinePath = path.join(parent, 'baseline/VenueYellowPages.before-copy-feedback.jsx');
const registryPath = path.join(root, 'src/data/partner-registry.js');
const read = (file) => fs.readFileSync(file, 'utf8');
const sha = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const locales = ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'tr', 'es', 'pt-BR', 'fr', 'de', 'ru', 'ar', 'id', 'vi', 'it'];

test('R286 copy feedback replaces optimistic success while preserving referral data boundaries', () => {
  const source = read(componentPath);
  const before = read(baselinePath);
  const css = read(cssPath);

  assert.match(before, /navigator\.clipboard\.writeText\(code\);\s*setCopiedToast\(code\);/);
  assert.doesNotMatch(source, /navigator\.clipboard\.writeText\(code\);\s*setCopiedToast\(code\);/);
  assert.match(source, /await writeText\.call\(navigator\.clipboard, code\)/);
  assert.match(source, /setCopyFeedback\(\{ status: "failed", code, feedbackId \}\)/);
  assert.match(source, /renderCopyFeedback\(`\$\{venue\.slug\}-compact`\)/);
  assert.match(source, /renderCopyFeedback\(`\$\{venue\.slug\}-directory`\)/);
  assert.equal((source.match(/onClick=\{\(e\) => handleCopyCode\(inviteCode, `\$\{venue\.slug\}-(?:compact|directory)`, e\)\}/g) || []).length, 2);
  for (const locale of locales) {
    const key = locale.includes('-') ? `"${locale}"` : `${locale}:`;
    assert.ok(source.includes(key), `copy feedback locale ${locale} exists`);
  }
  assert.match(css, /\.yellow-card__copy-feedback \{/);
  assert.match(css, /\.yellow-card__copy-manual \{/);
  assert.equal(sha(registryPath), '8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a');
});

async function runComponentHarness() {
  const dir = await mkdtemp(path.join(root, 'tests/.tmp-r286-copy-feedback-'));
  try {
    const fakeReact = path.join(dir, 'react.mjs');
    const fakeRuntime = path.join(dir, 'jsx-runtime.mjs');
    const entry = path.join(dir, 'entry.mjs');
    const bundle = path.join(dir, 'bundle.mjs');
    await writeFile(fakeReact, `
      let cells = [], cursor = 0, effects = [], cleanups = [], component = null, componentProps = null, tree = null, mounted = false, setAfterUnmount = 0;
      export const Fragment = Symbol('Fragment');
      export function jsx(type, props) { return { type, props: props || {} }; }
      export const jsxs = jsx;
      export function useState(initial) { const i = cursor++; if (!(i in cells)) cells[i] = typeof initial === 'function' ? initial() : initial; const set = (value) => { if (!mounted) setAfterUnmount++; cells[i] = typeof value === 'function' ? value(cells[i]) : value; }; return [cells[i], set]; }
      export function useRef(initial) { const i = cursor++; if (!(i in cells)) cells[i] = { current: initial }; return cells[i]; }
      export function useMemo(fn) { return fn(); }
      export function useEffect(fn) { effects.push(fn); }
      function resolve(node) { if (node == null || typeof node === 'boolean' || typeof node === 'string' || typeof node === 'number') return node; if (Array.isArray(node)) return node.map(resolve); if (node.type === Fragment) return resolve(node.props.children); if (typeof node.type === 'function') return resolve(node.type(node.props || {})); const props = { ...(node.props || {}) }; props.children = resolve(props.children); return { ...node, props }; }
      export function mount(nextComponent, nextProps) { cells = []; cleanups = []; component = nextComponent; componentProps = nextProps; mounted = true; tree = rerender(); for (const fn of effects) { const cleanup = fn(); if (typeof cleanup === 'function') cleanups.push(cleanup); } return tree; }
      export function rerender() { cursor = 0; effects = []; tree = resolve(jsx(component, componentProps)); return tree; }
      export function unmount() { for (const cleanup of cleanups.splice(0)) cleanup(); mounted = false; }
      export function setCallsAfterUnmount() { return setAfterUnmount; }
      function walk(node, visit) { if (node == null) return; if (Array.isArray(node)) { for (const item of node) walk(item, visit); return; } if (typeof node !== 'object') return; visit(node); walk(node.props?.children, visit); }
      export function findAll(predicate) { const out = []; walk(tree, (node) => { if (predicate(node)) out.push(node); }); return out; }
      function collectText(node) { if (node == null || typeof node === 'boolean') return ''; if (typeof node === 'string' || typeof node === 'number') return String(node); if (Array.isArray(node)) return node.map(collectText).join(''); if (typeof node !== 'object') return ''; return collectText(node.props?.children); }
      export function text(node) { return collectText(node); }
      export default { createElement: jsx, Fragment };
    `);
    await writeFile(fakeRuntime, `export { jsx, jsxs, Fragment } from './react.mjs';`);
    await writeFile(entry, `
      import { mount, rerender, unmount, findAll, text, setCallsAfterUnmount } from './react.mjs';
      import { VenueYellowPages } from ${JSON.stringify(componentPath)};
      import { venueDatabase } from ${JSON.stringify(path.join(root, 'src/data/venue-database.js'))};

      const event = () => ({ preventDefault(){}, stopPropagation(){} });
      const buttons = () => findAll((node) => String(node.props?.className || '').includes('yellow-card__code--btn'));
      const statuses = () => findAll((node) => node.props?.role === 'status').map((node) => text(node));
      const manualInputs = () => findAll((node) => node.type === 'input' && String(node.props?.className || '').includes('yellow-card__copy-manual')).map((node) => ({ value: node.props.value, label: node.props['aria-label'] }));
      const toasts = () => findAll((node) => String(node.props?.className || '').includes('yellow-pages__toast')).map((node) => text(node));
      const setupNavigator = (clipboard) => Object.defineProperty(globalThis, 'navigator', { value: clipboard === undefined ? {} : { clipboard }, configurable: true });
      globalThis.window = { location: { pathname: '/exchanges', search: '', hash: '', href: 'https://nexualpha.com/exchanges' }, history: { state: {}, replaceState() {} } };

      function mountPage(locale = 'en') { mount(VenueYellowPages, { venues: Object.values(venueDatabase), locale, compact: true, market: 'unknown', product: 'spot' }); const copyButtons = buttons(); if (copyButtons.length < 2) throw new Error('expected at least two copy buttons'); return copyButtons; }

      async function resolveScenario() {
        setupNavigator({ writeText: async () => undefined });
        const [button] = mountPage('en');
        const code = text(button).replace('📋', '');
        await button.props.onClick(event());
        rerender();
        return { code, statuses: statuses(), toasts: toasts(), manuals: manualInputs() };
      }

      async function rejectScenario() {
        setupNavigator({ writeText: async () => { throw new Error('denied'); } });
        const [button] = mountPage('ja');
        const code = text(button).replace('📋', '');
        await button.props.onClick(event());
        rerender();
        return { code, statuses: statuses(), toasts: toasts(), manuals: manualInputs() };
      }

      async function missingScenario() {
        setupNavigator(undefined);
        const [button] = mountPage('ar');
        const code = text(button).replace('📋', '');
        await button.props.onClick(event());
        rerender();
        return { code, statuses: statuses(), toasts: toasts(), manuals: manualInputs() };
      }

      async function raceScenario() {
        const resolvers = [];
        setupNavigator({ writeText: (value) => new Promise((resolve) => { resolvers.push({ value, resolve }); }) });
        const copyButtons = mountPage('en');
        const unique = [];
        for (const button of copyButtons) { const code = text(button).replace('📋', ''); if (!unique.find((item) => item.code === code)) unique.push({ button, code }); if (unique.length === 2) break; }
        if (unique.length < 2) throw new Error('expected two unique invite-code buttons');
        const first = unique[0].button.props.onClick(event());
        const second = unique[1].button.props.onClick(event());
        resolvers[1].resolve();
        await second;
        rerender();
        const afterSecond = toasts();
        resolvers[0].resolve();
        await first;
        rerender();
        return { firstCode: unique[0].code, secondCode: unique[1].code, afterSecond, finalToasts: toasts(), statuses: statuses() };
      }

      async function unmountScenario() {
        let resolveCopy;
        setupNavigator({ writeText: () => new Promise((resolve) => { resolveCopy = resolve; }) });
        const [button] = mountPage('en');
        const pending = button.props.onClick(event());
        unmount();
        resolveCopy();
        await pending;
        return { setAfterUnmount: setCallsAfterUnmount() };
      }

      const result = { resolve: await resolveScenario(), reject: await rejectScenario(), missing: await missingScenario(), race: await raceScenario(), unmount: await unmountScenario() };
      console.log(JSON.stringify(result));
    `);
    await build({
      entryPoints: [entry],
      bundle: true,
      format: 'esm',
      platform: 'node',
      outfile: bundle,
      jsx: 'automatic',
      loader: { '.css': 'empty' },
      plugins: [{
        name: 'fake-react',
        setup(build) {
          build.onResolve({ filter: /^react$/ }, () => ({ path: fakeReact }));
          build.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({ path: fakeRuntime }));
        }
      }],
      logLevel: 'warning'
    });
    return JSON.parse(execFileSync('node', [bundle], { cwd: root, encoding: 'utf8' }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('R286 copy buttons use result-bound feedback in a controlled component harness', async () => {
  const result = await runComponentHarness();

  assert.deepEqual(result.resolve.statuses, [result.resolve.toasts[0]]);
  assert.match(result.resolve.toasts[0], new RegExp(result.resolve.code));
  assert.deepEqual(result.resolve.manuals, []);

  assert.deepEqual(result.reject.toasts, []);
  assert.ok(result.reject.statuses.some((value) => value.includes('コピーできませんでした')));
  assert.deepEqual(result.reject.manuals, [{ value: result.reject.code, label: '手動コピー用コード' }]);

  assert.deepEqual(result.missing.toasts, []);
  assert.ok(result.missing.statuses.some((value) => value.includes('تعذر النسخ')));
  assert.deepEqual(result.missing.manuals, [{ value: result.missing.code, label: 'رمز الدعوة للنسخ اليدوي' }]);

  assert.notEqual(result.race.firstCode, result.race.secondCode);
  assert.deepEqual(result.race.afterSecond, result.race.finalToasts);
  assert.match(result.race.finalToasts[0], new RegExp(result.race.secondCode));
  assert.doesNotMatch(result.race.finalToasts[0], new RegExp(result.race.firstCode));
  assert.deepEqual(result.race.statuses, [result.race.finalToasts[0]]);

  assert.equal(result.unmount.setAfterUnmount, 0);
});
