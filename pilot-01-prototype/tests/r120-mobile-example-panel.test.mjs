import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("optional example panel cannot occupy or overlap mobile footer",()=>{
 const css=readFileSync(new URL("../src/components/v3/live-conversion-proof.css",import.meta.url),"utf8");
 assert.match(css,/@media \(max-width: 780px\)[\s\S]*?\.conversion-proof-toast\s*\{\s*display: none;/);
 assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
});
