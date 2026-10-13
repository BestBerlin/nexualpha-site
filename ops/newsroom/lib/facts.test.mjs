import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mergeRawItems } from './dedupe.mjs';
import { storyFacts, conflictingFacts, factsMatch, inferNarrativeType } from './facts.mjs';
import { matchingFacts, verifyEvent } from './verification.mjs';
const watchlist = [{ id: 'binance', aliases: ['Binance', '币安'], status: 'active' }];
const item = (id, title, extra = {}) => ({ id, title, source_id: `outlet-${id}`, platform: 'media', tier: 2, url: `https://outlet${id}.example/story`, published_at: '2026-10-12T10:00:00Z', ...extra });
test('different wording and Chinese titles cluster by entity, action and ticker with durable provenance', () => {
  const result = mergeRawItems([
    item(1, 'Binance lists Solana (SOL)'),
    item(2, 'SOL trading arrives on Binance', { event_type_guess: 'listing' }),
    item(3, '币安上线 SOL', { event_type_guess: 'listing' }),
  ], { watchlist });
  assert.equal(result.events.length, 1);
  const event = result.events[0];
  assert.equal(event.discussion.independent_sources, 3);
  assert.equal(event.discussion.merge_provenance.length, 2);
  assert.equal(verifyEvent(event, { watchlist }), 'corroborated');
});
test('symbol and amount contradictions block even a shared URL, hash or hard key', () => {
  for (const titles of [ ['Binance lists ABC', 'Binance lists XYZ'], ['Binance hacked for $10 million', 'Binance hacked for $20 million'] ]) {
    const result = mergeRawItems(titles.map((title, i) => item(i, title, { content_hash: 'same', url: 'https://shared.example/notice', official_notice_id: 'same' })), { watchlist });
    assert.equal(result.events.length, 2);
  }
});
test('48h boundary is inclusive and same entity/action alone cannot merge unrelated headlines', () => {
  assert.equal(mergeRawItems([item(1, 'Binance lists ABC'), item(2, 'Binance lists ABC', { published_at: '2026-10-14T10:00:01Z' })], { watchlist }).events.length, 2);
  assert.equal(mergeRawItems([item(1, 'Binance lists ABC'), item(2, 'Binance lists ABC', { published_at: '2026-10-14T10:00:00Z' })], { watchlist }).events.length, 1);
});
test('key facts must be captured, with normalized financial scales and explicit dates', () => {
  const event = { title_internal: 'Binance hacked for $10 million on 2026-10-12', event_type: 'hack_exploit' };
  assert.equal(matchingFacts(event, { title: '币安遭攻击损失1000万美元 2026年10月12日' }, watchlist), true);
  for (const title of ['Binance hacked', 'Binance hacked for $20 million on 2026-10-12', 'Binance hacked for $10 million on 2026-10-13']) assert.equal(matchingFacts(event, { title }, watchlist), false);
  assert.deepEqual(storyFacts({ title: 'Binance lists ABC and XYZ' }).tickers, ['ABC', 'XYZ']);
});
test('recorded Bitget facts distinguish deposit suspension from another token withdrawal resumption', () => {
  const payload = JSON.parse(readFileSync(new URL('../collectors/fixtures/recorded/bitget.json', import.meta.url)));
  const [resume, halt] = payload.data;
  const event = { title_internal: resume.annTitle, event_type: 'withdrawal_halt' };
  assert.equal(matchingFacts(event, { title: halt.annTitle }), false);
  assert.equal(matchingFacts(event, { title: resume.annTitle }), true);
});
test('a publisher covering one story twice does not inflate source count', () => {
  const { events } = mergeRawItems([item(1, 'Binance lists ABC'), item(2, 'Binance lists ABC', { url: 'https://outlet1.example/update' })], { watchlist });
  assert.equal(events[0].discussion.independent_sources, 1);
});
test('same asset listings on different venues remain separate', () => {
  const { events } = mergeRawItems([item(1, 'Binance lists SOL', { entities: ['solana'] }), item(2, 'OKX lists SOL', { entities: ['solana'] })], { watchlist });
  assert.equal(events.length, 2);
});
test('recorded official notice joins an explicitly derived paraphrase without requiring the headline', () => {
  const payload = JSON.parse(readFileSync(new URL('../collectors/fixtures/recorded/bitget.json', import.meta.url)));
  const captured = payload.data[0];
  // The notice is captured; the paraphrase is a deterministic regression input, not a live media claim.
  const rows = [
    item(100, captured.annTitle, { source_id: 'bitget-announcements', platform: 'exchange', tier: 1, verified_official: true, url: captured.annUrl, event_type_guess: 'withdrawal_halt' }),
    item(101, 'NEAR withdrawals return at Bitget', { event_type_guess: 'withdrawal_halt' }),
  ];
  const { events } = mergeRawItems(rows, { watchlist: [{ id: 'bitget', aliases: ['Bitget'], status: 'active' }] });
  assert.equal(events.length, 1);
  assert.equal(events[0].raw_items.length, 2);
  assert.equal(verifyEvent(events[0]), 'verified-primary');
  assert.equal(matchingFacts(events[0], { title: rows[1].title }), true);
});

test('generic acronyms are not tickers and do not split one story', () => {
  const a = storyFacts({ title: 'US SEC charges Unicoin executives over $100 million fraud' });
  const b = storyFacts({ title: 'SEC sues Unicoin for $100M crypto fraud, DOJ joins' });
  assert.deepEqual(a.tickers, []);
  assert.deepEqual(b.tickers, []);
  assert.equal(conflictingFacts(a, b), false);
});

test('Chinese venue names resolve and listings still never merge different symbols', () => {
  const en = storyFacts({ title: 'Binance will list Plasma (XPL) with seed tag' });
  const zh = storyFacts({ title: '币安将上线 XPL' });
  const other = storyFacts({ title: 'Binance will list Linea (LINEA)' });
  assert.ok(zh.venues.includes('binance'));
  assert.equal(factsMatch(en, zh), true);
  assert.equal(conflictingFacts(en, other), true);
});

test('media reports with an extra percentage or coin still corroborate, different amounts do not', () => {
  const a = storyFacts({ title: 'Bybit hacker moves $1.4 billion in ETH' });
  const b = storyFacts({ title: 'Bybit hack: $1.4 billion ETH moved, BTC falls 3%' });
  const c = storyFacts({ title: 'Bybit hacker moves $200 million in ETH' });
  assert.equal(conflictingFacts(a, b), false);
  assert.equal(conflictingFacts(a, c), true);
});

test('narrative topic types are inferred only from wording that names the topic', () => {
  assert.equal(inferNarrativeType('Evernorth names former Coinbase exec to steer 473 million XRP treasury'), 'crypto_treasury_company');
  assert.equal(inferNarrativeType('Ether ETFs extend outflow streak to nine days'), 'flows');
  assert.equal(inferNarrativeType('Blockchain.com seeks CFTC approval for prediction markets'), 'regulation');
  assert.equal(inferNarrativeType('South Korean bank launches Bitcoin-backed business loans'), 'product_launch');
  assert.equal(inferNarrativeType('Bitcoin Bleeds in Uptober'), null);
});

test('a paraphrased report corroborates without repeating every number, a contradicting one does not', () => {
  const event = { title_internal: 'Sam Altman-backed bitcoin life insurer Meanwhile raises $37.5 million round led by Bain Capital Crypto', source_published_at: '2026-10-12T10:00:00Z' };
  const paraphrase = { title: 'This Sam Altman-Backed Life Insurer Runs Entirely on Bitcoin, and Just Raised $37.5 Million', published_at: '2026-10-12T12:00:00Z' };
  const noNumber = { title: 'Sam Altman-backed Bitcoin life insurer, Meanwhile, raises more funds', published_at: '2026-10-12T12:00:00Z' };
  const contradicting = { title: 'Sam Altman-backed bitcoin life insurer Meanwhile raises $20 million', published_at: '2026-10-12T12:00:00Z' };
  assert.equal(matchingFacts(event, paraphrase), true);
  assert.equal(matchingFacts(event, noNumber), true);
  assert.equal(matchingFacts(event, contradicting), false);
});
