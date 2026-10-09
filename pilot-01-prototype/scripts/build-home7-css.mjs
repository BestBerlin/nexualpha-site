// Expands src/styles/v7/home7.src.css into home7.css. "@ " at the start of a selector becomes ".h7:not(#_):not(#_) ",
// which lifts the home rules above the v6 specificity stack without touching v6 files.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dir = new URL("../src/styles/v7/", import.meta.url);
const src = readFileSync(fileURLToPath(new URL("home7.src.css", dir)), "utf8");
const out = src.replace(/(^|[,{}\s])@ (?=\S)/gm, "$1.h7:not(#_):not(#_) ");
if (/(^|[,{}\s])@ /m.test(out)) throw new Error("unexpanded @ selector left in home7.css");
writeFileSync(fileURLToPath(new URL("home7.css", dir)), `/* GENERATED from home7.src.css by scripts/build-home7-css.mjs. Edit the source, not this file. */\n${out}`);
console.log("home7.css written");
