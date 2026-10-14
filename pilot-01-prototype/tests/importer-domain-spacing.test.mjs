import assert from "node:assert/strict";
import test from "node:test";
import { completeSentenceExcerpt } from "../scripts/import-nexualpha-content.mjs";

const locales = {
  "zh-Hans": ["请核验", "后再操作。", "后续说明需要完整保留。"],
  ja: ["確認先は", "です。", "続く説明も完全な文にします。"],
  ko: ["확인 대상은", "입니다.", "다음 설명도 완전한 문장입니다."],
};
const tokens = [
  "www.bybit.com", "x.y.z", "Crypto.com", "gate.io", "example.xyz", "example.net",
  "https://www.bybit.com/help/v1.2?next=gate.io&amount=1.26#account",
  "https://example.com/path!segment?value=1.26",
  "HTTP://example.com/v1.2", "ftp://example.net/file.v2",
  "support.team+news@example.com", "$1.26M", ".5", "v1.2.3", "1.2.3.4", "U.S.", "e.g.",
];
for (const [locale, [prefix, suffix, followup]] of Object.entries(locales)) {
  for (const token of tokens) {
    test(`${locale}: excerpt preserves ${token} when selecting sentences`, () => {
      const first = `${prefix} ${token} ${suffix}`;
      assert.equal(completeSentenceExcerpt(`${first} ${followup.repeat(30)}`, first.length + 2), first);
      assert.equal(completeSentenceExcerpt(`${first} ${followup}`, 500), `${first} ${followup}`);
    });
  }
}
test("an incomplete domain, URL, email or version is not a complete sentence", () => {
  for (const token of tokens.filter((token) => !["U.S.", "e.g."].includes(token))) {
    assert.equal(completeSentenceExcerpt(`请核验 ${token}`, 15), "", token);
  }
});
test("URL scheme colons are not clause fallback boundaries", () => {
  const text = `请核验${"详细说明".repeat(12)}https://example.com/${"path/".repeat(30)}`;
  assert.equal(completeSentenceExcerpt(text, 80), "");
});
test("ordinary sentence and clause boundaries still produce bounded excerpts", () => {
  assert.equal(completeSentenceExcerpt("First sentence. Second sentence.", 16), "First sentence.");
  const clause = "A sufficiently long introduction with verified details";
  assert.equal(completeSentenceExcerpt(`${clause}; ${"more detail ".repeat(30)}.`, 80), `${clause}.`);
});
