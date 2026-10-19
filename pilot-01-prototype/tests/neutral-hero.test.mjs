import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { NEUTRAL_HERO_COPY } from '../src/components/v7/home7-neutral-copy.js';
import { NEUTRAL_CTA_LOCALE_LIST } from '../src/data/locale-policy.js';
import { feeFact } from '../src/data/exchange-facts.js';
import { createSsrHarness, hydrateInJsdom, hydrationErrors } from './helpers/ssr-hydration-harness.mjs';

const locales = ['en','zh-Hans','zh-Hant','es','pt-BR','fr','de','it','ja','ko','ru','tr','id','vi','ar','ur','uk'];
test('neutral hero has complete information-only copy in all 17 locales', () => {
  assert.deepEqual(Object.keys(NEUTRAL_HERO_COPY).sort(), locales.sort());
  for (const [locale, copy] of Object.entries(NEUTRAL_HERO_COPY)) {
    for (const key of ['eyebrow','lead','compare','course','title','calculator','updated','volume']) assert.ok(copy[key]?.trim(), `${locale}.${key}`);
    assert.doesNotMatch(Object.values(copy).join(' '), /\/go\/|nexu888|11350287|BL686|rebate|sign.up|返佣|返還|返还/i);
  }
});
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
test('neutral and jurisdiction-banned SSR heroes show six real fee rows and only internal learning/comparison links', async () => {
  for (const locale of [...NEUTRAL_CTA_LOCALE_LIST, 'en']) {
    const path = locale === 'uk' ? 'uk-ua' : locale.toLowerCase();
    const html = await harness.render(`https://nexualpha.com/${locale === 'en' ? '?market=VN' : path}`, locale === 'en' ? {market:'VN'} : {});
    const dom = new JSDOM(html);
    const hero = dom.window.document.querySelector('.h7-hero[data-neutral]');
    assert.ok(hero, locale);
    const rows = [...hero.querySelectorAll('[data-testid="neutral-hero-row"]')];
    assert.equal(rows.length, 6, locale);
    const lower = [...dom.window.document.querySelectorAll('#h7-calc .h7-xr')].slice(0,6);
    assert.equal(lower.length, 6);
    rows.forEach((row, i) => {
      assert.equal(row.querySelector('.nh-venue bdi').textContent, lower[i].querySelector('.h7-xn b').textContent);
      const slug = lower[i].querySelector('.h7-dt').getAttribute('href').match(/exchanges\/([^?#/]+)/)[1];
      assert.equal(row.querySelector('.nh-money').textContent, '$' + Math.round(1e7 * feeFact(slug,'perp').taker / 100).toLocaleString('en-US'));
    });
    assert.doesNotMatch(hero.outerHTML, /\/go\/|nexu888|11350287|BL686/i);
    assert.equal(hero.querySelectorAll('.nh-actions a').length, 2);
    assert.match(hero.querySelector('.nh-primary').getAttribute('href'), /\/compare/);
    assert.match(hero.querySelector('.nh-actions a:last-child').getAttribute('href'), /\/academy/);
    assert.equal(hero.querySelectorAll('.nh-chip').length, 3);
    dom.window.close();
  }
});

test('neutral market chips preserve server ticker splicing and first-render markup', async () => {
  const { tickerFromBinance, spliceTickerHtml } = await import('../src/data/ticker.js');
  const ticker = tickerFromBinance(['BTC','ETH','SOL','BNB','XRP'].map((sym, i) => ({symbol:sym+'USDT',lastPrice:String(100+i),priceChangePercent:'1.3',quoteVolume:'1000000000'})), {now:Date.parse('2026-10-19T00:00:00Z')});
  for (const path of ['ru','vi','ar','zh-hant','ur','uk-ua']) {
    const empty = await harness.render(`https://nexualpha.com/${path}`);
    const seeded = await harness.render(`https://nexualpha.com/${path}`, {ticker});
    const a = new JSDOM(spliceTickerHtml(empty,ticker));
    const b = new JSDOM(seeded);
    assert.equal(a.window.document.querySelector('.h7-hero').outerHTML, b.window.document.querySelector('.h7-hero').outerHTML, path);
    assert.match(a.window.document.querySelector('.nh-chip').textContent, /BTC \$100/);
    a.window.close(); b.window.close();
  }
});

test('promotional SSR heroes retain registration and do not render neutral research actions', async () => {
  for (const path of ['en','zh-hans','tr']) {
    const dom = new JSDOM(await harness.render(`https://nexualpha.com/${path === "en" ? "" : path}`));
    const hero = dom.window.document.querySelector('.h7-hero');
    assert.equal(hero.querySelector('.nh-board, .nh-actions, .nh-chips'), null, path);
    assert.ok(hero.querySelector('[data-cta-placement="home-v7-hero"]'), path);
    assert.equal(hero.querySelector('a[href="#h7-calc"]'), null, path);
    dom.window.close();
  }
});


test('neutral hero keeps perpetual fees when the hydrated lower calculator switches to spot', async () => {
  const client = await createSsrHarness({clientHome:true});
  try {
    const url = 'https://nexualpha.com/ar';
    const html = await harness.render(url);
    let clicked = false, before, lowerBefore;
    const document = `<div id="root">${html}</div><script type="application/json" id="nexualpha-prerender-state">{}</script>`;
    const result = await hydrateInJsdom(client.vite, document, url, {
      timeoutMs: 5000,
      until(window) {
        const doc = window.document;
        const spot = doc.querySelector('#h7-calc .h7-seg button:nth-child(2)');
        if (!clicked && doc.querySelector('#h7-below-root[data-hydrated="true"]') && spot) {
          before = doc.querySelector('.nh-board').textContent;
          lowerBefore = doc.querySelector('#h7-calc .h7-am').textContent;
          clicked = true;
          spot.click();
          return false;
        }
        return clicked && spot?.getAttribute('aria-pressed') === 'true';
      },
      inspect(window) {
        return {board:window.document.querySelector('.nh-board').textContent,
          lower:window.document.querySelector('#h7-calc .h7-am').textContent,
          spot:window.document.querySelector('#h7-calc .h7-seg button:nth-child(2)')?.getAttribute('aria-pressed')};
      },
    });
    assert.ok(clicked, 'the lower calculator hydrated and was clicked');
    assert.equal(result.inspected.spot, 'true');
    assert.notEqual(result.inspected.lower, lowerBefore, 'spot fees really changed');
    assert.equal(result.inspected.board, before, 'hero remains a perpetual fee snapshot');
    assert.deepEqual(hydrationErrors(result.errors), []);
  } finally { await client.close(); }
});
