import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../scripts/package-growth-review.py", import.meta.url), "utf8");

test("local review bundle includes source modules required by the Sites runtime", () => {
  assert.match(source, /'dist\/client','dist\/server','dist\/\.openai','src'/);
});

test("candidate archive preserves dotted build identifiers in its filename", () => {
  assert.match(source, /archive=target\.parent\/f'\{target\.name\}\.zip'/);
  assert.doesNotMatch(source, /archive=target\.with_suffix\('\.zip'\)/);
});
