import test from "node:test";
import assert from "node:assert/strict";
import { TOPIC_GUIDES } from "../src/data/topic-guides-data.js";
import { TOPIC_GUIDES as before } from "../docs/evidence/four-week-growth-20260927/r97-before/topic-guides-data.js";

const fields = ["categoryZhHant", "titleZhHant", "metaTitleZhHant", "descZhHant"];
const owners = ["meme-coins", "no-kyc"];

test("related topic summaries provide explicit Traditional Chinese without mixed simplified wording", () => {
  for (const slug of owners) {
    const owner = TOPIC_GUIDES[slug];
    for (const field of fields) {
      assert.equal(typeof owner[field], "string", `${slug}.${field} must be explicit`);
      assert.ok(owner[field].length);
      assert.doesNotMatch(owner[field], /币|检查|流动性|路径|代币|公开|授权|风险|资格|当前|身份验证|注册|请|与|比较|评测/);
    }
    assert.match(owner.metaTitleZhHant, / — NexuAlpha$/);
  }
  assert.match(TOPIC_GUIDES["meme-coins"].descZhHant, /目前官方頁面核驗/);
  assert.match(TOPIC_GUIDES["no-kyc"].descZhHant, /身分驗證.*註冊或交易前/);
});

test("removing exactly the eight summary additions restores all input data", () => {
  const restored = structuredClone(TOPIC_GUIDES);
  for (const slug of owners) for (const field of fields) delete restored[slug][field];
  assert.deepEqual(restored, before);
});
