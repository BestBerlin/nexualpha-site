import {quickAnswerEntities} from '../src/data/exchange-quick-answers.js';
import {partnerVenueFaqFor,partnerFaqQuestion} from '../src/data/partner-venue-faq.js';
import test from "node:test";
import assert from "node:assert/strict";
import { computeRouteSeo } from "../src/data/seo-injection.js";

for (const slug of ["bitget", "okx", "binance", "backpack"]) {
  test(`${slug} profile exposes source-backed FAQ schema`, () => {
    const seo = computeRouteSeo({ pathname: `/ja/exchanges/${slug}`, url: `https://nexualpha.com/ja/exchanges/${slug}`, locale: "ja" });
    const faq = seo.schemas.find((schema) => schema["@type"] === "FAQPage");
    assert.ok(faq, "venue profile should expose FAQPage");
    assert.equal(faq.inLanguage, "ja");
    assert.ok(faq.mainEntity.length >= 2);
    const partnerQuestions=[...(partnerVenueFaqFor(slug,'ja')?.entries.map(partnerFaqQuestion)||[]),...quickAnswerEntities(slug,'ja')];
    assert.ok(faq.mainEntity.some(entry=>entry.acceptedAnswer.citation?.length),'reviewed research retains source citations');
    for(const entry of faq.mainEntity){
      if(entry.acceptedAnswer.citation?.length)continue;
      assert.ok(partnerQuestions.some(question=>question.name===entry.name && question.acceptedAnswer.text===entry.acceptedAnswer.text),'only helper-backed partner/quick-answer FAQ may omit a research citation');
    }
  });
}
