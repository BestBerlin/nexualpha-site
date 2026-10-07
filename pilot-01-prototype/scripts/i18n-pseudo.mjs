import { mkdir, readFile, writeFile } from "node:fs/promises";

const base = JSON.parse(await readFile(new URL("../locales/en.json", import.meta.url), "utf8"));
const accents = { a: "á", e: "ë", i: "ï", o: "ô", u: "ü", A: "Á", E: "Ë", I: "Ï", O: "Ô", U: "Ü" };
const pseudo = Object.fromEntries(Object.entries(base).map(([key, value]) => [key, `［${value.replace(/[aeiouAEIOU]/g, (letter) => accents[letter])}］`]));
const out = new URL("../artifacts/i18n/pseudo-en.json", import.meta.url);
await mkdir(new URL("../artifacts/i18n/", import.meta.url), { recursive: true });
await writeFile(out, `${JSON.stringify(pseudo, null, 2)}\n`);
console.log(`Wrote ${Object.keys(pseudo).length} pseudo-localized messages to artifacts/i18n/pseudo-en.json`);
