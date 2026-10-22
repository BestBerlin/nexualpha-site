import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { bleedCopyFeedback, tradingBleedLocales } from '../src/data/trading-bleed-copy.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const regSource = read('src/components/v3/RegistrationCard.jsx');
const factbookSource = read('src/components/v3/FactbookPage.jsx');

function registrationHandleHarness({ clipboard, execResult = true, execThrows = false, code = 'nexu888' } = {}) {
  const states = [];
  const writes = [];
  const timers = new Map();
  let timerId = 0;
  const refs = [{ current: null }, { current: 0 }, { current: true }];
  const document = {
    createElement: () => ({ value: '', select() {} }),
    body: { appendChild() {}, removeChild() {} },
    execCommand(name) {
      assert.equal(name, 'copy');
      if (execThrows) throw new Error('denied');
      return execResult;
    },
  };
  const navigator = clipboard === undefined ? {} : { clipboard: { writeText(value) { writes.push(value); return clipboard(value); } } };
  const setTimeout = (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId; };
  const clearTimeout = (id) => timers.delete(id);
  const begin = regSource.indexOf('  const handleCopy = ');
  const end = regSource.indexOf('\n  };', begin) + '\n  };'.length;
  assert.ok(begin >= 0 && end > begin, 'RegistrationCard handleCopy block exists');
  const arrow = regSource.slice(begin, end).replace('  const handleCopy = ', '').trim().replace(/;$/, '');
  const handler = Function(
    'visiblePartner', 'navigator', 'document', 'setCopyState', 'setTimeout', 'clearTimeout', 'copyFeedbackTimerRef', 'copyRequestRef', 'copyMountedRef', 'trackCodeCopy', 'venueSlug', 'compact',
    `return (${arrow});`,
  )({ inviteCode: code }, navigator, document, (value) => states.push(value), setTimeout, clearTimeout, ...refs, () => {}, "test-venue", false);
  return { handler, states, writes, timers };
}

function factbookCopyHarness({ clipboard } = {}) {
  const states = [];
  const rawToggles = [];
  const writes = [];
  const navigator = clipboard === undefined ? {} : { clipboard: { writeText(value) { writes.push(value); return clipboard(value); } } };
  const begin = factbookSource.indexOf('async function copyFactbookValue(');
  const end = factbookSource.indexOf('\nfunction FactbookCopyStatus', begin);
  assert.ok(begin >= 0 && end > begin, 'Factbook copy helper exists');
  const helperSource = `${factbookSource.slice(begin, end)}\nreturn copyFactbookValue;`;
  const helper = Function('navigator', 'setTimeout', helperSource)(navigator, (fn, ms) => { states.push(`timer:${ms}`); fn(); return 1; });
  return { helper, states, rawToggles, writes };
}

test('RegistrationCard surfaces copy failure instead of silently returning to idle', async () => {
  const h = registrationHandleHarness({ clipboard: () => Promise.reject(new Error('blocked')) });
  await h.handler();
  assert.deepEqual(h.writes, ['nexu888']);
  assert.deepEqual(h.states, ['pending', 'error']);
  assert.equal(h.timers.size, 0);
  assert.match(regSource, /copyFailed[\s\S]*role="status"[\s\S]*aria-live="polite"/);
  assert.match(regSource, /bleedCopyFeedback\(locale\)/);
  assert.match(regSource, /className="registration-card__manual-copy"/);
  assert.match(regSource, /aria-label=\{copyFeedback\.codeLabel\}/);
  assert.match(regSource, /readOnly/);
  assert.match(regSource, /value=\{visiblePartner\.inviteCode\}/);
  assert.match(regSource, /onFocus=\{\(event\) => event\.currentTarget\.select\(\)\}/);
  assert.match(regSource, /dir="ltr"/);
  assert.match(regSource, /minHeight: 44/);
  assert.match(regSource, /maxWidth: "100%"/);
});

test('RegistrationCard keeps original success and native fallback behavior', async () => {
  const success = registrationHandleHarness({ clipboard: () => Promise.resolve() });
  await success.handler();
  assert.deepEqual(success.states.slice(0, 2), ['pending', 'success']);
  assert.equal([...success.timers.values()][0].ms, 2000);

  const failedFallback = registrationHandleHarness({ execResult: false });
  await failedFallback.handler();
  assert.deepEqual(failedFallback.states, ['pending', 'error']);
});

test('Factbook copy helper handles rejected and missing clipboard paths', async () => {
  const rejected = factbookCopyHarness({ clipboard: () => Promise.reject(new Error('denied')) });
  await rejected.helper('RAW_MD', (value) => rejected.states.push(value), { revealManual: () => rejected.rawToggles.push(true) });
  assert.deepEqual(rejected.writes, ['RAW_MD']);
  assert.deepEqual(rejected.states, ['error']);
  assert.deepEqual(rejected.rawToggles, [true]);

  const missing = factbookCopyHarness();
  await missing.helper('HASH', (value) => missing.states.push(value));
  assert.deepEqual(missing.states, ['error']);

  const success = factbookCopyHarness({ clipboard: () => Promise.resolve() });
  await success.helper('HASH', (value) => success.states.push(value));
  assert.deepEqual(success.states, ['success', 'timer:2000', 'idle']);

  const markdown = factbookCopyHarness({ clipboard: () => Promise.resolve() });
  await markdown.helper('RAW_MD', (value) => markdown.states.push(value), { timeout: 2500 });
  assert.deepEqual(markdown.states, ['success', 'timer:2500', 'idle']);
});

test('Factbook renders explicit failure status and manual recovery surfaces', () => {
  assert.match(factbookSource, /role="status"/);
  assert.match(factbookSource, /aria-live="polite"/);
  assert.match(factbookSource, /bleedCopyFeedback\(locale\)\.failed/);
  assert.match(factbookSource, /setShowRawMd\(true\)/);
  assert.match(factbookSource, /factbook-hash-code/);
  assert.match(factbookSource, /factbook-raw-markdown-code/);
  assert.match(factbookSource, /className="factbook-copy-manual-input"/);
  assert.match(factbookSource, /value=\{venue\.auditHash\}/);
  assert.match(factbookSource, /className="factbook-copy-manual-input factbook-copy-manual-input--markdown"/);
  assert.match(factbookSource, /value=\{rawMarkdown\}/);
  assert.match(factbookSource, /onFocus=\{\(event\) => event\.currentTarget\.select\(\)\}/);
  assert.match(factbookSource, /dir="ltr"/);
  assert.match(factbookSource, /maxWidth: "100%"/);
});

test('copy failure feedback reuses all supported locale feedback source', () => {
  assert.deepEqual([...tradingBleedLocales].sort(), ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'tr', 'es', 'pt-BR', 'fr', 'de', 'ru', 'ar', 'ur', 'uk', 'id', 'vi', 'it'].sort());
  for (const locale of tradingBleedLocales) {
    const feedback = bleedCopyFeedback(locale);
    assert.ok(feedback.failed, `${locale} has localized failed feedback`);
    assert.ok(feedback.codeLabel, `${locale} has localized code label`);
  }
  assert.notEqual(bleedCopyFeedback('ja').failed, bleedCopyFeedback('en').failed);
  assert.notEqual(bleedCopyFeedback('ar').failed, bleedCopyFeedback('en').failed);
  assert.match(regSource, /import \{ bleedCopyFeedback \} from "\.\.\/\.\.\/data\/trading-bleed-feedback\.js"/);
  assert.match(factbookSource, /import \{ bleedCopyFeedback \} from "\.\.\/\.\.\/data\/trading-bleed-feedback\.js"/);
});

test('Factbook copy requests ignore stale promises and stale reset timers', () => {
  assert.match(factbookSource, /const factbookCopyMountedRef = useRef\(true\)/);
  assert.match(factbookSource, /const mdCopyRequestRef = useRef\(0\)/);
  assert.match(factbookSource, /const hashCopyRequestRef = useRef\(0\)/);
  assert.match(factbookSource, /mdCopyRequestRef\.current \+= 1/);
  assert.match(factbookSource, /hashCopyRequestRef\.current \+= 1/);
  assert.match(factbookSource, /clearTimeout\(mdCopyTimerRef\.current\)/);
  assert.match(factbookSource, /clearTimeout\(hashCopyTimerRef\.current\)/);
  assert.match(factbookSource, /isActive: \(\) => factbookCopyMountedRef\.current && mdCopyRequestRef\.current === request/);
  assert.match(factbookSource, /isActive: \(\) => factbookCopyMountedRef\.current && hashCopyRequestRef\.current === request/);
  assert.match(factbookSource, /requestRef\.current === request[\s\S]*setStatus\("idle"\)/);
});

test('Factbook resets copy state and raw recovery when venue context changes', () => {
  assert.match(factbookSource, /useEffect\(\(\) => \{[\s\S]*setCopiedMd\("idle"\)[\s\S]*setCopiedHash\("idle"\)[\s\S]*setShowRawMd\(false\)/);
  assert.match(factbookSource, /\}, \[venue\.slug, venue\.auditHash, rawMarkdown, locale\]\)/);
  assert.match(factbookSource, /mdCopyRequestRef\.current \+= 1/);
  assert.match(factbookSource, /hashCopyRequestRef\.current \+= 1/);
});

test('R277 copy recovery does not change partner registry or invite values', () => {
  const registry = read('src/data/partner-registry.js');
  assert.equal(createHash('sha256').update(registry).digest('hex'), '3a69b03020089ccb700370fcac011230635fe21d00a5cdae39d342284b78ef83');
  assert.match(regSource, /inviteCode: publicCta\.inviteCode/);
  assert.match(regSource, /registrationUrl: regionalCta\.direct \? regionalCta\.ctaHref : null/);
});
