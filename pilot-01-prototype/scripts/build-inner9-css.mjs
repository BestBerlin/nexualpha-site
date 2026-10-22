// Expands src/styles/v9/*.src.css (inner-page pass 2026-10-23) into the matching .css files.
// Each source starts with "/* scope: <selector> */". In a selector, "@&" becomes that scope and "@ " becomes the scope
// followed by a descendant combinator, both lifted with fifteen :not(#_) so the rules win over the v6/v8 specificity
// stack (up to fourteen ids on the article prose) without editing those files. The outputs join existing route
// stylesheets (vite.config.mjs), so the lift, not the cascade order, decides. Run after editing a source: node scripts/build-inner9-css.mjs
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dir = new URL("../src/styles/v9/", import.meta.url);
const LIFT = ":not(#_)".repeat(15);
for (const file of readdirSync(fileURLToPath(dir)).filter((name) => name.endsWith(".src.css"))) {
  const src = readFileSync(fileURLToPath(new URL(file, dir)), "utf8");
  const scope = src.match(/^\/\* scope: ([^*]+?) \*\//)?.[1];
  if (!scope) throw new Error(`${file}: first line must be /* scope: <selector> */`);
  const out = src
    .replace(/(^|[,{}\s(])@&/gm, `$1${scope}${LIFT}`)
    .replace(/(^|[,{}\s(])@ (?=\S)/gm, `$1${scope}${LIFT} `);
  if (/(^|[,{}\s(])@(?:&| )/m.test(out.replace(/@media|@supports|@keyframes|@container|@layer|@font-face/g, ""))) throw new Error(`${file}: unexpanded @ selector`);
  const target = file.replace(/\.src\.css$/, ".css");
  writeFileSync(fileURLToPath(new URL(target, dir)), `/* GENERATED from ${file} by scripts/build-inner9-css.mjs. Edit the source, not this file. */\n${out}`);
  console.log(`${target} written`);
}
