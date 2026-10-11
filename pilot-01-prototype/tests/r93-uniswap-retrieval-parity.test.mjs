import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { priorityVenueAnswerFor } from "../src/data/priority-venue-answers.js";
import { AEO_QUESTION_REGISTRY } from "../src/data/aeo-question-registry.js";
test("generated Uniswap retrieval records mirror visible answers and registry", async () => {
 const full = await readFile(new URL("../public/llms-full.txt", import.meta.url), "utf8");
 const section = full.split("## Uniswap affiliate search boundary")[1]?.split("## Reviewed news article answers")[0];
 assert.ok(section);
 for (const locale of ["en", "zh-Hans", "zh-Hant"]) {
  const entry = AEO_QUESTION_REGISTRY.find(e => e.id === `uniswap-affiliate-boundary-${locale}`);
  const faq = priorityVenueAnswerFor("uniswap", locale).faq.at(-1);
  for (const value of [faq[0],faq[1],...faq[2],`https://nexualpha.com${entry.canonicalPath}`,`- Language: ${locale}`,`- Reviewed: ${entry.reviewedAt}`]) assert.ok(section.includes(value), value);
 }
});
test("protected commercial configuration remains exact", async () => {
 // Class b: 84b6426 made the official binance.com referral route the accepted protected registry bytes.
 const files = {"partner-registry.js":"e53261a6e7e39e64bd35bbedda4ef4a36c1521521750a77eaff3d26c52925d69","venue-database.js":"0ce124afbe9f4758ce9ec093c79372550ce2e2e90a7342aa05ecc8d3482e1d52","public-cta.js":"675875240d5fbb05498284a37f90a14488d6ace73d19b102caeb5add9e33f8e3","regional-cta.js":"a2542bb137b6b6ff123a0d3c6b3a01b09e1e3a785ee223e3b4e04a3fe8aab665"};
 for (const [file, expected] of Object.entries(files)) assert.equal(createHash("sha256").update(await readFile(new URL(`../src/data/${file}`,import.meta.url))).digest("hex"),expected,file);
});
