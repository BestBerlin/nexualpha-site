import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const protectedPartnerRegistrySha = "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a";

test("tokenized Treasuries exposes the citation asset, methodology and correction route visibly", async () => {
  const source = await readFile(new URL("../src/components/v3/TokenizedAssetsPage.jsx", import.meta.url), "utf8");

  assert.match(source, /page\.slug === "tokenized-treasuries"/);
  assert.match(source, /TOKENIZED_TREASURY_RIGHTS_OPS_ASSET/);
  assert.match(source, /localizedHref\("\/methodology"/);
  assert.match(source, /mailto:contact@nexualpha\.com\?subject=NexuAlpha%20tokenized%20Treasury%20dataset%20correction/);
  assert.match(source, /Citation-ready research data/);
  assert.match(source, /可引用研究数据/);
  assert.match(source, /href="#tokenized-treasury-research-asset-title"/);
  assert.match(source, /open=\{index < 2\}/);
});

test("Wave53 citation UI preserves the protected partner registry", async () => {
  const partnerRegistry = await readFile(new URL("../src/data/partner-registry.js", import.meta.url));
  assert.equal(createHash("sha256").update(partnerRegistry).digest("hex"), protectedPartnerRegistrySha);
});
