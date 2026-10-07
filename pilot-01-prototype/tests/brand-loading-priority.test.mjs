import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("brand marks lazy-load by default and the homepage decision panel opts into priority", async () => {
  const [brandMark, leanHero] = await Promise.all([
    readFile(new URL("../src/components/brand/BrandMark.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/v3/LeanHero.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(brandMark, /priority\s*=\s*false/);
  assert.match(brandMark, /loading=\{priority\s*\?\s*"eager"\s*:\s*"lazy"\}/);
  assert.ok((leanHero.match(/<BrandMark[^>]+priority/g) || []).length >= 2);
  assert.doesNotMatch(brandMark, /loading="eager"/);
});
