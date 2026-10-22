import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { TOPIC_GUIDES } from "../src/data/topic-guides-data.js";
import { sanitizePublicText } from "../src/data/public-copy-sanitizer.js";

test("compliant funding FAQ separates same-name checks from bank-risk guarantees", () => {
  const faq = TOPIC_GUIDES["compliant-exchanges"].faqs[0];
  for (const answer of [faq.aEn, faq.aZh]) {
    assert.doesNotMatch(answer, /foolproof|completely eliminating|100%|唯一|杜绝|杜絕/i);
  }
  assert.match(faq.aEn, /does not guarantee/i);
  assert.match(faq.aEn, /same-name/i);
  assert.match(faq.aEn, /bank.*entity.*jurisdiction.*source of funds.*current terms/i);
  assert.match(faq.aZh, /不能保证/);
  assert.match(faq.aZh, /同名/);
  assert.match(faq.aZh, /银行.*服务主体.*司法辖区.*资金来源.*当前条款/);
  assert.doesNotMatch(`${faq.qEn} ${faq.qZh}`, /guarantee zero|100%/i);
});

test("existing JA KO TR ES and PT compliant-topic overrides remain unchanged", () => {
  const source = readFileSync(new URL("../src/components/v3/TopicGuidePage.jsx", import.meta.url), "utf8");
  const start = source.indexOf('  "compliant-exchanges": {', source.indexOf("const TOPIC_LOCALE_COPY"));
  const end = source.indexOf('  "no-kyc": {', start);
  assert.ok(start > 0 && end > start);
  // Class b: later approved topic presentation copy changed this locale-copy block while preserving the existing locale override boundary.
  assert.equal(createHash("sha256").update(source.slice(start, end)).digest("hex"), "a238a8e1b6b61416fd055f2495ea936ffe80b2c988addf8a7d1818f146ff6041");
});

test("all compliant funding FAQs avoid automatic activation and unsupported compensation promises", () => {
  const [, onboarding, compensation] = TOPIC_GUIDES["compliant-exchanges"].faqs;
  const body = JSON.stringify([onboarding, compensation]);
  assert.doesNotMatch(body, /10,000|10000|\$100k|数十万|全套合规激活|垫付赔偿|compensation reserves reimburse/i);
  assert.match(onboarding.aEn, /official.*account.*entity.*residence.*product/i);
  assert.match(onboarding.aZh, /官方.*账户.*服务主体.*居住地.*产品/);
  assert.match(compensation.aEn, /applicable.*merchant.*order.*documents.*exclusions/i);
  assert.match(compensation.aZh, /适用.*商家.*订单.*材料.*排除/);
  assert.match(compensation.aEn, /does not promise/i);
});

test("the entire compliant owner contains checks rather than absolute safety or global license claims", () => {
  const owner = TOPIC_GUIDES["compliant-exchanges"];
  // FAQ negations are tested above; scanning them here would reject a denial
  // of the old promise rather than an affirmative safety claim.
  const { faqs, ...remainingOwner } = owner;
  const publicText = JSON.stringify(remainingOwner);
  assert.doesNotMatch(publicText, /100%|0\.00%|百分之百|零 P2P|0 冻卡|zero (?:bank|P2P)|foolproof|eliminating P2P|彻底隔离|杜绝|US\/EU regulated|comprehensive US\/UK\/EU|完整牌照|先行垫付|即.*激活|zero legal recourse|frozen indefinitely|operating flawlessly|Gold Standard|Rail Leader|\$500M|\$0 ~ \$15/i);
  assert.ok(owner.quickStats.every((stat) => stat.value === "Pending"));
  assert.ok(owner.platforms.every((platform) => platform.score === "Pending"));
  assert.match(owner.platforms[0].highlightEn, /Global.*Exchange.*separately/i);
  assert.match(owner.platforms[2].highlightEn, /applicable.*claim.*exclusions/i);
});

test("three shared FAQs retain explicit Traditional Chinese and source-specific dates", () => {
  const faqs = TOPIC_GUIDES["compliant-exchanges"].faqs;
  assert.equal(faqs.length, 3);
  for (const faq of faqs) {
    assert.ok(faq.qHant && faq.aHant);
    assert.match(faq.aHant, /帳戶|條款/);
    assert.ok(faq.sources.length);
    for (const source of faq.sources) {
      assert.equal(source.reviewedAt, "2026-10-02");
      assert.equal(source.updatedAt, source.url.includes("hashkey.com") ? "2025-12-04" : "2026-05-29");
      assert.match(source.url, /^https:\/\//);
    }
  }
  assert.match(faqs[0].aHant, /^不能保證/);
  assert.match(faqs[2].aHant, /不承諾/);
  assert.deepEqual(faqs.map((faq) => faq.sources.length), [2, 2, 1]);
});

test("compliant platform identity and protected link/code/commission fields are retained", () => {
  const project = (venue) => [venue.slug, venue.name, venue.affiliateUrl, venue.inviteCode, venue.rebate];
  assert.deepEqual(TOPIC_GUIDES["compliant-exchanges"].platforms.map(project), [
    ["hashkey", "HashKey Global / Exchange", "https://global.hashkey.com", "N/A", 0],
    ["kraken", "Kraken", "/go/kraken?src=topic-guide", "N/A", 0],
    ["okx", "OKX (欧易)", "https://www.okx.com/join/nexu888", "nexu888", 20],
  ]);
});

test("compliant English bank checks and platform categories survive public copy sanitizing", () => {
  const owner = TOPIC_GUIDES["compliant-exchanges"];
  assert.equal(owner.painPoints[0].titleEn, "1. Treating a funding rail as a substitute for bank review");
  assert.match(owner.evaluationPillars[1].descEn, /Name matching does not settle bank risk\.$/);
  for (const value of [owner.painPoints[0].titleEn, owner.evaluationPillars[1].descEn, ...owner.platforms.map((platform) => platform.categoryEn)]) {
    assert.equal(typeof value, "string");
    assert.equal(sanitizePublicText(value), value);
    assert.doesNotMatch(value, /[\u3400-\u9fff]/);
  }
});
