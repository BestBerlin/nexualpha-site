import { committedFileHash } from './r100-test-contracts.mjs';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from "node:test";
import assert from "node:assert/strict";
import { TOPIC_GUIDES } from "../src/data/topic-guides-data.js";
import { TOPIC_GUIDES as before } from "../docs/evidence/four-week-growth-20260927/r96-before/topic-guides-data.js";

const topFields = ["categoryZhHant", "titleZhHant", "metaTitleZhHant", "descZhHant", "pillsZhHant", "badgeZhHant"];
const nestedFields = {
  quickStats: ["labelZhHant", "descZhHant"],
  painPoints: ["titleZhHant", "descZhHant"],
  evaluationPillars: ["titleZhHant", "descZhHant"],
  pitfalls: ["titleZhHant", "descZhHant"],
  platforms: ["categoryZhHant", "badgeZhHant", "highlightZhHant", "listingSpeedZhHant", "spotFeeZhHant", "netFeeZhHant", "slippageZhHant", "barrierZhHant", "bonusZhHant"],
  telegramCommands: ["descZhHant"],
};

test("compliant owner has explicit Traditional Chinese for every non-FAQ decision block", () => {
  const owner = TOPIC_GUIDES["compliant-exchanges"];
  const values = [];
  for (const field of topFields) {
    assert.ok(owner[field], `missing ${field}`);
    values.push(...(Array.isArray(owner[field]) ? owner[field] : [owner[field]]));
  }
  assert.equal(owner.pillsZhHant.length, owner.pillsZh.length);
  for (const [section, fields] of Object.entries(nestedFields)) {
    for (const [index, item] of owner[section].entries()) {
      for (const field of fields) {
        assert.equal(typeof item[field], "string", `missing ${section}[${index}].${field}`);
        assert.ok(item[field].length);
        values.push(item[field]);
      }
    }
  }
  assert.equal(owner.titleZhHant, "法幣通道與帳戶資格：HashKey、Kraken、OKX");
  for (const value of values) {
    assert.doesNotMatch(value, /法币|资格|核对|账户|当前|监管|选择|保证|服务|地区|产品|资金|转账|费用|风险|条款|冻结|获赔|银行|记录|材料是否符合.*税务|支持|限额|订单|执行|身份/);
    assert.doesNotMatch(value, /100%|零風險|必獲賠償|自動開戶保證|先行墊付/);
  }
});

test("removing R96 Hant additions restores its compliant owner exactly", () => {
  const restored = structuredClone(TOPIC_GUIDES);
  const owner = restored["compliant-exchanges"];
  for (const field of topFields) delete owner[field];
  for (const [section, fields] of Object.entries(nestedFields)) {
    for (const item of owner[section]) for (const field of fields) delete item[field];
  }
  // Later authorized owners have separate input-preservation tests.
  const expected = structuredClone(before["compliant-exchanges"]);
  // The later reviewed Kraken signup bridge is independent of the Hant copy addition.
  expected.platforms.find((item) => item.slug === 'kraken').affiliateUrl = '/go/kraken?src=topic-guide';
  assert.deepEqual(restored["compliant-exchanges"], expected);
  assert.equal(createHash('sha256').update(readFileSync(new URL('../src/data/topic-guides-data.js', import.meta.url))).digest('hex'), committedFileHash('src/data/topic-guides-data.js'));
});
