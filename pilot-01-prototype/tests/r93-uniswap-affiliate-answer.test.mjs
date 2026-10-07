import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { priorityVenueAnswerFor } from '../src/data/priority-venue-answers.js';
import { AEO_QUESTION_REGISTRY } from '../src/data/aeo-question-registry.js';

const urls = ['https://developers.uniswap.org/docs/trading/swapping-api/faqs', 'https://developers.uniswap.org/docs/trading/custom-interface-links'];
const baseline = {
  en: '5045ed96426f8fd0a57320a689463d5c7dec6b9bc96523dd1b8321919cea7ae0',
  'zh-Hans': 'b63b58f07e7643e0368f62920237d79d580c10d1606af1b55035c321eebbf621',
  'zh-Hant': '3fb9ba3a692b6ed28a1d2a6d15aa4b68e5590956142c70a5371174421c6204bc',
};
test('Uniswap affiliate answers distinguish developer mechanisms from consumer reward eligibility', () => {
  for (const locale of Object.keys(baseline)) {
    const answer = priorityVenueAnswerFor('uniswap', locale);
    const [question, body, citations] = answer.faq.at(-1);
    assert.match(question, /Uniswap affiliate program/);
    assert.match(body, /2026-10-02/);
    assert.match(body, /integrator fee/);
    assert.match(body, /v2/);
    assert.deepEqual(citations, urls);
    assert.ok(urls.every(url => answer.sources.some(([, href]) => href === url)));
    assert.deepEqual(answer.sourceReviewedAt, Object.fromEntries(urls.map(url => [url, '2026-10-02'])));
    if (locale === 'en') {
      assert.match(body, /not evidence that a consumer qualifies/);
      assert.match(body, /do not establish whether a consumer affiliate program exists/);
      assert.match(body, /no reward or cashback is promised/);
    } else {
      assert.match(body, /不是消[费費]者/);
      assert.match(body, /计划有无|計劃有無/);
      assert.match(body, /不承诺奖励或返现|不承諾獎勵或返現/);
    }
    const record = AEO_QUESTION_REGISTRY.find(item => item.id === `uniswap-affiliate-boundary-${locale}`);
    assert.ok(record);
    assert.equal(record.question, question);
    assert.equal(record.reviewedAt, '2026-10-02');
    assert.equal(record.status, 'source-linked');
    assert.deepEqual(record.sourceUrls, urls);
    const prefix = locale === 'en' ? '' : locale === 'zh-Hans' ? '/zh-hans' : '/zh-hant';
    assert.equal(record.canonicalPath, `${prefix}/exchanges/uniswap`);
  }
});
test('Uniswap existing testnet answers, titles and historical review dates remain exact', () => {
  for (const [locale, expected] of Object.entries(baseline)) {
    const a = priorityVenueAnswerFor('uniswap', locale);
    assert.equal(a.faq.length, 6);
    const original = {title:a.title,body:a.body,reviewedAt:a.reviewedAt,reviewedLabel:a.reviewedLabel,seoTitle:a.seoTitle,seoDescription:a.seoDescription,faq:a.faq.slice(0,-1)};
    assert.equal(createHash('sha256').update(JSON.stringify(original)).digest('hex'), expected, locale);
  }
});
test('Uniswap affiliate FAQ does not fall back to English in unsupported priority locales', () => {
  for (const locale of ['es','pt-BR','fr','de','ja','ko','ar','tr','ru','id','vi','it']) {
    assert.equal(priorityVenueAnswerFor('uniswap', locale), null, locale);
    assert.equal(AEO_QUESTION_REGISTRY.some(item => item.id === `uniswap-affiliate-boundary-${locale}`), false);
  }
});
