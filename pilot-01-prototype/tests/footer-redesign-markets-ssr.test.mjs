import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { createSsrHarness } from './helpers/ssr-hydration-harness.mjs';

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

test('the home closing panel receives the same VN promotion gate as its hero and footer', async () => {
  const dom = new JSDOM(await harness.render('/?market=VN'));
  const closing = dom.window.document.querySelector('.nx-close');
  assert.ok(closing);
  assert.equal(closing.querySelector('small'), null, 'no rebate claims in a prohibited market');
  assert.ok([...closing.querySelectorAll('a')].every(link => !link.getAttribute('href').includes('registration-path')));
  assert.equal(dom.window.document.querySelector('[data-footer-partner-links]'), null);
  dom.window.close();
});

test('the home closing panel respects Türkiye and retains partner rebate labels in eligible markets', async () => {
  for (const path of ['/?market=TR', '/tr?market=SG', '/']) {
    const dom = new JSDOM(await harness.render(path));
    const closing = dom.window.document.querySelector('.nx-close');
    assert.ok(closing.querySelector('small'), path);
    if (path !== '/') assert.doesNotMatch(closing.innerHTML, /\/exchanges\/(?:bitget|coinw|hyperliquid|backpack)/);
    else assert.match(closing.innerHTML, /\/exchanges\/bitget#registration-path/);
    dom.window.close();
  }
});
