import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("R124 mobile decision rail stacks readable rows with stable number, label and arrow columns", async () => {
  const css = await readFile(new URL("../src/components/v3/decision-path-rail.css", import.meta.url), "utf8");
  const mobile = css.match(/@media \(max-width: 640px\) \{[\s\S]*\n\}/)?.[0] ?? "";

  assert.match(mobile, /\.decision-path-rail__links \{[\s\S]*grid-template-columns: minmax\(0, 1fr\);/);
  assert.doesNotMatch(mobile, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(mobile, /\.decision-path-rail \.decision-path-rail__links > \.decision-path-rail__link \{[\s\S]*display: grid !important;/);
  assert.match(mobile, /grid-template-columns: auto minmax\(0, 1fr\) auto;/);
  assert.match(mobile, /min-height: 44px;/);
  assert.match(mobile, /font-size: \.78rem;/);
  assert.match(mobile, /\.decision-path-rail__link span \{[\s\S]*font-size: \.65rem;/);
  assert.match(mobile, /\.decision-path-rail__link b \{[\s\S]*justify-self: end;/);
});

test("R124 decision rail keeps desktop three-up layout and existing link contract in JSX", async () => {
  const css = await readFile(new URL("../src/components/v3/decision-path-rail.css", import.meta.url), "utf8");
  const jsx = await readFile(new URL("../src/components/v3/DecisionPathRail.jsx", import.meta.url), "utf8");
  const beforeMobile = css.split("@media (max-width: 640px)")[0];

  assert.match(beforeMobile, /\.decision-path-rail__links \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
  assert.match(jsx, /href: decisionHref\(`\/compare\/\$\{compareSlugFor\(selectedVenue, selectedShortlist\)\}`\)/);
  assert.match(jsx, /href: decisionHref\(`\/factbook\/\$\{selectedVenue\}#rates`\)/);
  assert.match(jsx, /href: decisionHref\("\/exchanges"\)/);
  assert.match(jsx, /<span aria-hidden="true">0\{index \+ 1\}<\/span>\{link\.label\} <b aria-hidden="true">→<\/b>/);
});
