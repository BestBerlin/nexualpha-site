import test from 'node:test';
import assert from 'node:assert/strict';
import * as brazilMarket from '../src/data/brazil-market.js';

const { BRAZIL_DECISION_CHAIN, BRAZIL_EVIDENCE_CHAIN, BRAZIL_PAGES, BRAZIL_SOURCES, BRAZIL_VENUES, getBrazilPage, getBrazilPartnerVenue } = brazilMarket;
const privateOrGuaranteePattern = /commissionrate|payout|revenue|kickback|佣金比例|返给用户|garantia de bônus|garantia de desconto|bônus garantido|desconto garantido|lucro garantido|rendimento garantido/i;

test('Brazil market data is seven original pt-BR routes with source-backed content', () => {
  assert.deepEqual(BRAZIL_PAGES.map((page) => page.path), ['/br', '/br/comparar', '/br/pix', '/br/saque-pix', '/br/custos', '/br/conta', '/br/kyc-cpf']);
  for (const page of BRAZIL_PAGES) {
    assert.ok(page.title.length > 20, page.path);
    assert.ok(page.description.length > 50, page.path);
    assert.ok(page.answer.length > 80, page.path);
    assert.ok(page.sections.length >= 2, page.path);
    assert.ok(page.faq.length >= 2, page.path);
    assert.ok(page.sourceIds.length >= 3, page.path);
    for (const id of page.sourceIds) assert.ok(BRAZIL_SOURCES.some((source) => source.id === id), `${page.path} missing ${id}`);
  }
  assert.equal(getBrazilPage('/br/pix')?.slug, 'br-pix');
  assert.equal(getBrazilPage('/br/missing'), null);
});

test('Brazil decision chain keeps a four-step mobile CTA route and separate evidence entries', () => {
  assert.deepEqual(BRAZIL_DECISION_CHAIN.map((step) => step.path), ['/br', '/br/pix', '/br/custos', '/br/comparar']);
  assert.deepEqual(BRAZIL_EVIDENCE_CHAIN.map((step) => step.path), ['/br/kyc-cpf', '/br/conta', '/br/saque-pix']);
  assert.equal(new Set([...BRAZIL_DECISION_CHAIN, ...BRAZIL_EVIDENCE_CHAIN].map((step) => step.path)).size, 7);
  for (const step of BRAZIL_DECISION_CHAIN) {
    assert.ok(getBrazilPage(step.path), step.path);
    assert.ok(step.label.length >= 5, step.path);
    assert.ok(step.shortLabel.length >= 3, step.path);
  }
  for (const step of BRAZIL_EVIDENCE_CHAIN) {
    assert.ok(getBrazilPage(step.path), step.path);
    assert.ok(step.label.length >= 5, step.path);
    assert.ok(step.shortLabel.length >= 3, step.path);
  }
});

test('Brazil AEO answers are structured, source-backed and do not make private or guaranteed-benefit claims', () => {
  const expected = {
    '/br/pix': ['br-pix-deposit', 'br-pix-withdraw'],
    '/br/saque-pix': ['br-pix-withdrawal-checklist'],
    '/br/custos': ['br-fee-estimate'],
    '/br/conta': ['br-referral-boundary'],
    '/br/kyc-cpf': ['br-kyc-cpf-checklist'],
  };
  for (const [pathname, ids] of Object.entries(expected)) {
    const page = getBrazilPage(pathname);
    assert.deepEqual(page.aeoAnswers.map((answer) => answer.id), ids);
    for (const answer of page.aeoAnswers) {
      assert.ok(answer.question.length > 40, answer.id);
      assert.ok(answer.answer.length >= 180 && answer.answer.length <= 420, answer.id);
      assert.ok(answer.steps.length >= 3, answer.id);
      assert.ok(answer.table.length >= 2, answer.id);
      assert.ok(answer.sourceIds.length >= 3, answer.id);
      for (const id of answer.sourceIds) assert.ok(BRAZIL_SOURCES.some((source) => source.id === id), `${answer.id} missing ${id}`);
      for (const row of answer.table) {
        assert.ok(row.item && row.check, answer.id);
        assert.ok(row.sourceIds.length >= 1, answer.id);
        for (const id of row.sourceIds) assert.ok(BRAZIL_SOURCES.some((source) => source.id === id), `${answer.id} table missing ${id}`);
      }
      assert.doesNotMatch(JSON.stringify(answer), privateOrGuaranteePattern, answer.id);
    }
  }
});

test('Brazil local shortlist only includes source-backed Binance and OKX without private commercial fields', () => {
  assert.deepEqual(BRAZIL_VENUES.map((venue) => venue.slug), ['binance', 'okx']);
  assert.ok(BRAZIL_VENUES.every((venue) => venue.access === 'source-backed'));
  assert.ok(BRAZIL_VENUES.every((venue) => venue.product === 'spot'));
  for (const venue of BRAZIL_VENUES) {
    assert.ok(venue.sourceIds.length >= 4, venue.slug);
    for (const id of venue.sourceIds) assert.ok(BRAZIL_SOURCES.some((source) => source.id === id), `${venue.slug} missing ${id}`);
    const serialized = JSON.stringify(venue).toLowerCase();
    assert.doesNotMatch(serialized, /commissionrate|payout|revenue|kickback|佣金比例|返给用户/);
  }
  assert.equal(getBrazilPartnerVenue('bybit'), null);
});

test('Brazil source contract uses official venue pages and no custom share builder', () => {
  assert.equal('buildBrazilShareUrl' in brazilMarket, false);
  assert.ok(BRAZIL_SOURCES.some((source) => source.url.startsWith('https://www.binance.com/')));
  assert.ok(BRAZIL_SOURCES.some((source) => source.url.startsWith('https://www.okx.com/')));
  for (const source of BRAZIL_SOURCES) {
    if (source.id === 'okx-brl-pix-deposit') {
      assert.equal(source.checkedAt, '2026-10-02T00:00:00.000Z');
    } else {
      assert.match(source.checkedAt, /^2026-09-\d{2}T/);
    }
    assert.doesNotMatch(source.url, /affiliate|ref=/i);
  }
});
