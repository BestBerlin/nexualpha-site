import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const css = readFileSync(path.join(root, 'src/components/v3/trader-wizard.css'), 'utf8');

function block(selector) {
  const match = css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([\\s\\S]*?)\\}`));
  assert.ok(match, `${selector} rule exists`);
  return match[1];
}

function prop(rule, name) {
  const match = rule.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
  assert.ok(match, `${name} exists`);
  return match[1].trim();
}

test('wizard modal is capped to the visual viewport and keeps the body as the only scroll region', () => {
  const modal = block('.wizard-modal');
  assert.match(prop(modal, 'max-height'), /100d?vh/, 'modal must be capped by viewport height');
  assert.equal(prop(modal, 'display'), 'flex');
  assert.equal(prop(modal, 'flex-direction'), 'column');
  assert.equal(prop(modal, 'overflow'), 'hidden');

  const body = block('.wizard-modal__body');
  assert.equal(prop(body, 'overflow-y'), 'auto');
  assert.equal(prop(body, 'min-height'), '0');
  assert.match(prop(body, 'flex'), /^1\s+1\s+auto$/, 'body must flex-scroll instead of pushing footer out');
  assert.doesNotMatch(body, /max-height\s*:\s*60vh/, 'old body-only 60vh cap caused header+footer overflow');

  assert.equal(prop(block('.wizard-modal__header'), 'flex'), '0 0 auto');
  assert.equal(prop(block('.wizard-modal__footer'), 'flex'), '0 0 auto');
});

test('wizard controls keep 44px pointer targets without changing copy or model files', () => {
  assert.match(block('.wizard-modal__close'), /(?:min-width|width)\s*:\s*44px/);
  assert.match(block('.wizard-modal__close'), /(?:min-height|height)\s*:\s*44px/);
  assert.match(block('.wizard-btn'), /min-height\s*:\s*44px/);
  assert.match(block('.wizard-result__cta'), /min-height\s*:\s*44px/);
  assert.match(block('.wizard-result__secondary'), /min-height\s*:\s*44px/);
});
