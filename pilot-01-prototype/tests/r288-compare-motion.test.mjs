import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const path = new URL("../src/styles/compare-motion-refinement.css", import.meta.url);
const targets = ["v3-matrix-cta-btn", "v3-gold-matrix-card", "v3-decision-side-card", "v3-decision-action-btn", "v3-faq-item"];
test("comparison motion is scoped and never uses transition all", () => {
 const css = fs.readFileSync(path,"utf8");
 assert.doesNotMatch(css,/transition\s*:\s*all/);
 const selectors = css.replace(/\/\*[\s\S]*?\*\//g, "").match(/[^{}]+(?=\{)/g).filter(s => !s.trim().startsWith("@"));
 for (const group of selectors) for (const selector of group.split(",")) assert.ok(selector.trim().startsWith(".v3-compare-page "), selector);
});
test("reduced motion covers actual cards and CTA without clearing disclosure state", () => {
 const css=fs.readFileSync(path,"utf8");
 const reduce=css.split("@media (prefers-reduced-motion: reduce)")[1];
 for (const t of targets) assert.ok(reduce.includes("."+t));
 assert.match(reduce,/transition: none !important/);
 assert.match(reduce,/v3-faq-arrow[\s\S]*transition: none !important/);
 assert.doesNotMatch(reduce,/\[open\]/);
 const arrowBlock=reduce.match(/\.v3-compare-page \.v3-faq-arrow\s*\{([^}]+)/)[1];
 assert.doesNotMatch(arrowBlock,/transform:/);
});
test("coarse pointer suppresses hover displacement for real floating selectors", () => {
 const css=fs.readFileSync(path,"utf8");
 const coarse=css.split("@media (hover: none), (pointer: coarse)")[1].split("@media")[0];
 for(const t of targets.slice(0,4)) assert.ok(coarse.includes("."+t+":hover"));
 assert.match(coarse,/transform: none !important/);
 assert.doesNotMatch(css,/outline\s*:\s*(none|0)|href|inviteCode/);
});
