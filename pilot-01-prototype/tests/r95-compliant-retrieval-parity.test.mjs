import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOPIC_GUIDES } from "../src/data/topic-guides-data.js";
import { AEO_QUESTION_REGISTRY, AEO_QUESTION_REVIEWED_AT } from "../src/data/aeo-question-registry.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const ids = ["compliant-fiat-name-match", "compliant-hashkey-onboarding", "compliant-okx-freeze-terms"];

test("R95 appends exactly three English source-derived checklist questions without changing existing records", async () => {
  const before = await readFile(path.join(root, "docs/evidence/four-week-growth-20260927/r95-before/src/data/aeo-question-registry.js"), "utf8");
  const resolved = before.replace(/from "(\.\/[^\"]+)"/g, (_, specifier) => `from "${new URL(specifier, new URL("../src/data/aeo-question-registry.js", import.meta.url)).href}"`);
  const old = await import(`data:text/javascript;base64,${Buffer.from(resolved).toString("base64")}`);
  assert.deepEqual(AEO_QUESTION_REGISTRY.filter(entry=>!entry.id.startsWith("r100-") && !ids.includes(entry.id)), old.AEO_QUESTION_REGISTRY);
  assert.equal(AEO_QUESTION_REVIEWED_AT, old.AEO_QUESTION_REVIEWED_AT);
  assert.deepEqual(AEO_QUESTION_REGISTRY.filter(entry=>ids.includes(entry.id)).map(entry => entry.id), ids);
  for (const [index, id] of ids.entries()) {
    const entry = AEO_QUESTION_REGISTRY.find(row => row.id === id);
    const faq = TOPIC_GUIDES["compliant-exchanges"].faqs[index];
    assert.equal(entry.question, faq.qEn);
    assert.deepEqual(entry.sourceUrls, faq.sources.map(source => source.url));
    assert.equal(entry.reviewedAt, "2026-10-02");
    assert.equal(entry.locale, "en");
    assert.equal(entry.canonicalPath, "/topics/compliant-exchanges");
    assert.equal(entry.status, "source-linked");
    assert.match(entry.answerBoundary, /not|do not/);
  }
});

test("R95 generated standard and full retrieval mirror all nine visible FAQs and exact source dates", async t => {
  const output = await mkdtemp(path.join(tmpdir(), "r95-compliant-retrieval-"));
  t.after(() => rm(output, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, ["scripts/generate-public-llms.mjs"], {
    cwd: root, env: { ...process.env, NEXUALPHA_LLMS_OUTPUT_DIR: output }, encoding: "utf8", timeout: 30000,
  });
  assert.equal(result.status, 0, result.stderr);
  for (const filename of ["llms.txt", "llms-full.txt"]) {
    const text = await readFile(path.join(output, filename), "utf8");
    for (const [locale, qField, aField, prefix] of [["en", "qEn", "aEn", ""], ["zh-Hans", "qZh", "aZh", "/zh-hans"], ["zh-Hant", "qHant", "aHant", "/zh-hant"]]) {
      assert.ok(text.includes(`- Canonical: https://nexualpha.com${prefix}/topics/compliant-exchanges\n- Language: ${locale}`));
      for (const faq of TOPIC_GUIDES["compliant-exchanges"].faqs) {
        assert.ok(text.includes(`### ${faq[qField]}`));
        assert.ok(text.includes(`- Direct answer: ${faq[aField]}`));
        for (const source of faq.sources) assert.ok(text.includes(`[${source.label}](${source.url}) — reviewed: ${source.reviewedAt}; document updated: ${source.updatedAt}`));
      }
    }
    assert.ok(text.includes("## Reviewed news article answers"));
    assert.ok(text.includes("## Priority answer map"));
    assert.ok(text.includes("## Support-owner comparison records"));
  }
  assert.equal(await readFile(path.join(output, "llms-small.txt"), "utf8"), await readFile(path.join(root, "public/llms-small.txt"), "utf8"));
});

test("R95 missing localized answer or source date aborts before retrieval files are written", async t => {
  for (const mutation of ["faq.aHant = ''", "faq.sources[0].updatedAt = null", "faq.sources[0].reviewedAt = null"]) {
    const output = await mkdtemp(path.join(tmpdir(), "r95-compliant-invalid-"));
    t.after(() => rm(output, { recursive: true, force: true }));
    const code = `import { TOPIC_GUIDES } from './src/data/topic-guides-data.js'; const faq = TOPIC_GUIDES['compliant-exchanges'].faqs[0]; ${mutation}; await import('./scripts/generate-public-llms.mjs');`;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", code], {
      cwd: root, env: { ...process.env, NEXUALPHA_LLMS_OUTPUT_DIR: output }, encoding: "utf8", timeout: 30000,
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Compliant retrieval/);
    assert.deepEqual(await readdir(output), []);
  }
});
