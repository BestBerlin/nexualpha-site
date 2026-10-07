import test from "node:test";
import assert from "node:assert/strict";
import { sanitizePublicText, sanitizePublicValue } from "../src/data/public-copy-sanitizer.js";

test("public copy removes unverified ranking, execution and commercial superlatives", () => {
  const input = "World #1, lowest trading fees, zero-slippage, instant execution, $1B+ fund and 20% fee rebate";
  const output = sanitizePublicText(input);
  assert.doesNotMatch(output, /World #1|lowest trading fees|zero-slippage|instant execution|\$1B|20% fee rebate/i);
  assert.match(output, /source-linked research|published fee|published execution|published timing|pending verification/i);
});

test("nested public records are sanitized without changing their shape", () => {
  const output = sanitizePublicValue({ title: "#1 venue", stats: ["zero-fee", "20% cashback"] });
  assert.deepEqual(Object.keys(output), ["title", "stats"]);
  assert.equal(output.stats.length, 2);
  assert.doesNotMatch(JSON.stringify(output), /#1 venue|zero-fee|20% cashback/i);
});

test("Chinese topic copy removes promotional superlatives and unverified benefit language", () => {
  const output = sanitizePublicText("2026 百倍 Meme 币权威指南：终身最高20%返佣、0手续费、秒级交互与独家福利");
  assert.doesNotMatch(output, /百倍|权威|终身|20%|0手续费|秒级|独家/);
  assert.match(output, /高波动|独立研究|用户权益|公开费率条件|公开执行时序|平台特定/);
});

test("Chinese rebate wording is sanitized across futures research dimensions", () => {
  const output = sanitizePublicText("专属 20% 实时返现后的终身净有效费率");
  assert.doesNotMatch(output, /20%|实时返现|终身净有效费率/);
  assert.match(output, /用户权益|账户净费率待核验/);
});

test("Chinese venue cards do not publish absolute safety, ranking, or fee claims", () => {
  const output = sanitizePublicText("全球第二大衍生品交易中心，资金安全绝对顶级，费率低至万分之四，撮合引擎极速抗压，功能极其成熟。");
  assert.doesNotMatch(output, /全球第二大|绝对顶级|费率低至|极速抗压|极其成熟/);
  assert.match(output, /来源研究|公开费率|市场条件/);
});
