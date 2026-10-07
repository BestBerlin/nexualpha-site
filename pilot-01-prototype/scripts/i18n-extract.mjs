import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const file = new URL("../src/App.jsx", import.meta.url);
const source = await readFile(file, "utf8");
const candidates = [...source.matchAll(/>([^<>{}\n]+)</g)]
  .map((match) => match[1].trim())
  .filter((value) => /[A-Za-z]{2}/.test(value) && !/[=&?]/.test(value));
const fingerprint = createHash("sha256").update(JSON.stringify(candidates)).digest("hex");
console.log(JSON.stringify({ file: "src/App.jsx", candidateCount: candidates.length, fingerprint, candidates }, null, 2));
