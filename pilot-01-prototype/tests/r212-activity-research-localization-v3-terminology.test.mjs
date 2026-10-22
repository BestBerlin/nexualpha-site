import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { campaignResearchLocalizedText } from '../src/data/official-campaign-localizations.js';
import { officialCampaignResearchByVenue } from '../src/data/official-campaign-research.js';
import { researchView } from '../src/data/official-campaign-model.js';

const now = Date.parse('2026-09-07T00:00:00Z');
const sourceText = readFileSync(new URL('../src/data/official-campaign-localizations.js', import.meta.url), 'utf8');

test('R212 v3 fixes audited finance terminology without weakening source identity or protected registry', () => {
  const registry = readFileSync(new URL('../src/data/partner-registry.js', import.meta.url));
  assert.equal(createHash('sha256').update(registry).digest('hex'), '3a69b03020089ccb700370fcac011230635fe21d00a5cdae39d342284b78ef83');
});

test('Kraken default-currency amount does not become USD in Japanese or Arabic', () => {
  const jaFields = [
    campaignResearchLocalizedText('kraken', ['signupReward', 'summary'], 'ja'),
    campaignResearchLocalizedText('kraken', ['evidenceRequirements', 'limitations'], 'ja'),
    campaignResearchLocalizedText('kraken', ['evidenceRequirements', 'gaps', '1'], 'ja'),
  ];
  const arFields = [
    campaignResearchLocalizedText('kraken', ['signupReward', 'summary'], 'ar'),
    campaignResearchLocalizedText('kraken', ['evidenceRequirements', 'limitations'], 'ar'),
    campaignResearchLocalizedText('kraken', ['evidenceRequirements', 'gaps', '1'], 'ar'),
  ];
  for (const value of jaFields) {
    assert.match(value, /最大 200|固定 20|デフォルト通貨/);
    assert.doesNotMatch(value, /ドル|USD|USDT/);
  }
  for (const value of arFields) {
    assert.match(value, /200|20|العملة الافتراضية/);
    assert.doesNotMatch(value, /دولار|USD|USDT/);
  }
});

test('current account and perpetuals keep product meaning in audited Japanese and Arabic fields', () => {
  const bybitJa = campaignResearchLocalizedText('bybit', ['sources', 'bybit-rewards-faq', 'summary'], 'ja');
  assert.match(bybitJa, /現在のアカウント/);
  assert.doesNotMatch(bybitJa, /当座預金口座/);

  const okxJa = campaignResearchLocalizedText('okx', ['sources', 'okx-fet-september', 'summary'], 'ja');
  assert.match(okxJa, /FET\/USDT 永続先物/);
  assert.match(okxJa, /現在のアカウント/);
  assert.doesNotMatch(okxJa, /永久提供|当座預金口座/);

  const okxAr = campaignResearchLocalizedText('okx', ['sources', 'okx-fet-september', 'summary'], 'ar');
  assert.match(okxAr, /عقود FET\/USDT الدائمة/);
  assert.match(okxAr, /الحساب الحالي/);
  assert.doesNotMatch(okxAr, /بشكل دائم|الحساب الجاري/);

  const bybitPerpAr = campaignResearchLocalizedText('bybit', ['sources', 'bybit-cpusdt-september', 'summary'], 'ar');
  assert.match(bybitPerpAr, /عقود CPUSDT الدائمة/);
  assert.doesNotMatch(bybitPerpAr, /عمليات CPUSDT الدائمة/);
});

test('targeted terminology repair does not remove numeric facts or original field cardinality', () => {
  const bitgetPt = researchView(officialCampaignResearchByVenue.bitget, 'pt-BR', now);
  assert.match(bitgetPt.signupReward.summary, /6[.,]200\s*USDT/);
  const krakenJa = researchView(officialCampaignResearchByVenue.kraken, 'ja', now);
  assert.equal(krakenJa.signupReward.conditions.length, officialCampaignResearchByVenue.kraken.signupReward.conditions.length);
  assert.equal(krakenJa.notices.length, officialCampaignResearchByVenue.kraken.notices.length);
  assert.match(krakenJa.signupReward.summary, /最大 200|固定 20|デフォルト通貨/);
});

test('audited mistranslation tokens are absent from the final localization source', () => {
  for (const token of ['当座預金口座', '永久提供', 'بشكل دائم', 'الحساب الجاري', '20 دولارًا ثابتًا', '200 دولار بينما']) {
    assert.equal(sourceText.includes(token), false, token);
  }
});
