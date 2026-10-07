import test from 'node:test';
import assert from 'node:assert/strict';
import { localizedHref } from '../src/data/locale-routing.js';
import { withoutApprovedR183EvidenceLinks } from './r189-presentation-contract.mjs';
for (const locale of ['en','zh-Hans','zh-Hant','ja','ko','tr','ar','es','pt-BR','fr','de','ru','id','vi','it']) {
  test(locale + ': bounded R183 additions reject rewrite/missing/duplicate and preserve every unrelated href', () => {
    const href=(localizedHref('/topics/derivatives',{locale})+'#perp-cost-field-dictionary').replaceAll('&','&amp;');
    const anchor=`<a href="${href}" data-cta-kind="research" data-cta-placement="topic-derivatives-route-evidence" data-growth-decision="perp_cost_dictionary" data-growth-placement="topic-derivatives-route-evidence">Cost fields</a>`;
    const original='<a href="https://partner.bitget.cafe/bg/C6PRAF">Original</a>';
    const body=original+anchor.repeat(4);
    assert.equal(withoutApprovedR183EvidenceLinks(body,'derivatives:'+locale),original);
    for (const broken of [original+anchor.repeat(3),body+anchor,body.replace(href,href+'bad'),body.replace('data-cta-kind="research"','data-cta-kind="signup"')]) assert.throws(()=>withoutApprovedR183EvidenceLinks(broken,'derivatives:'+locale));
    assert.throws(()=>withoutApprovedR183EvidenceLinks(body,'no-kyc:'+locale));
    assert.equal(withoutApprovedR183EvidenceLinks(original,'no-kyc:'+locale),original);
  });
}
