import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { auditCtaFunnelCoverage } from "../scripts/audit-cta-funnel-coverage.mjs";

const runFile = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts/audit-cta-funnel-coverage.mjs");

async function componentFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) return componentFiles(next);
    if (entry.isFile() && next.endsWith(".jsx")) return [next];
    return [];
  }));
  return files.flat();
}

function openingTagsWithRegistrationCta(source) {
  const tags = [];
  let index = 0;
  while (index < source.length) {
    const start = source.indexOf("data-cta-kind", index);
    if (start === -1) break;
    const tagStart = source.lastIndexOf("<", start);
    const tagEnd = source.indexOf(">", start);
    if (tagStart === -1 || tagEnd === -1) {
      index = start + 1;
      continue;
    }
    const tag = source.slice(tagStart, tagEnd + 1);
    if (/^<(a|button)\b/.test(tag) && /data-cta-kind=\{?["']registration["']/.test(tag)) {
      tags.push({ tag, line: source.slice(0, tagStart).split("\n").length });
    }
    index = tagEnd + 1;
  }
  return tags;
}

async function fixture(files) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "nexu-cta-coverage-"));
  const src = path.join(dir, "src");
  await mkdir(src, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(src, name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content, "utf8");
  }
  return { dir, close: () => rm(dir, { recursive: true, force: true }) };
}

test("CTA funnel coverage passes protected registration CTA and paired decision controls", async () => {
  const f = await fixture({
    "Good.jsx": `
      import { regionalVenueCta } from "./regional-cta.js";
      export function Good({ slug, locale }) {
        const cta = regionalVenueCta(slug, locale, "BR", "spot");
        return <a href={cta.ctaHref} data-cta-kind={cta.direct ? "registration" : "research"} data-cta-placement="fixture-primary" data-growth-decision={slug} data-growth-placement="fixture-primary">Open</a>;
      }
    `,
  });
  try {
    const report = await auditCtaFunnelCoverage({ root: f.dir });
    assert.equal(report.status, "PASS");
    assert.equal(report.totals.registrationCtas, 1);
    assert.equal(report.registrationCtas[0].sourceTrace, "regionalVenueCta");
  } finally {
    await f.close();
  }
});

test("CTA funnel coverage recognizes derived protected hrefs and exact growth attributes", async () => {
  const f = await fixture({
    "Derived.jsx": `
      import { publicCtaForVenue } from "./public-cta.js";
      export function Derived({ slug }) {
        const publicCta = publicCtaForVenue(slug);
        const primaryRegistrationHref = publicCta.ctaHref;
        return <div>
          <a href={primaryRegistrationHref} data-cta-kind="registration" data-cta-placement="derived-primary" data-growth-decision={slug} data-growth-placement="derived-primary">Register</a>
          <a href="/research" data-growth-decision-state="verify-first">Research</a>
        </div>;
      }
    `,
  });
  try {
    const report = await auditCtaFunnelCoverage({ root: f.dir });
    assert.equal(report.status, "PASS");
    assert.equal(report.registrationCtas[0].sourceTrace, "publicCtaForVenue");
    assert.equal(report.decisionControls.length, 1);
  } finally {
    await f.close();
  }
});

test("CTA funnel coverage fails missing placement, untraced registration source and unpaired growth controls", async () => {
  const f = await fixture({
    "Bad.jsx": `
      const secret = "https://partner.example.invalid/private-ref";
      export function Bad({ direct }) {
        return <div>
          <a href={secret} data-cta-kind="registration">Register</a>
          <button type="button" data-growth-decision="compare_first">Compare</button>
          <a href="/compare" data-growth-placement="floating-compare">Compare route</a>
        </div>;
      }
    `,
  });
  try {
    const report = await auditCtaFunnelCoverage({ root: f.dir });
    assert.equal(report.status, "FAIL");
    assert.deepEqual(report.issues.map((item) => item.issue).sort(), [
      "missing_data_cta_placement",
      "missing_data_growth_decision",
      "missing_data_growth_placement",
      "registration_target_not_traced_to_public_or_regional_cta",
    ]);

    const output = JSON.stringify(report);
    assert.doesNotMatch(output, /private-ref/);
    assert.doesNotMatch(output, /partner\.example/);
  } finally {
    await f.close();
  }
});

test("CTA funnel coverage CLI emits JSON and can enforce strict failure", async () => {
  const f = await fixture({
    "BadCli.jsx": `export function BadCli() { return <a href="https://example.invalid/raw" data-cta-kind="registration">Open</a>; }`,
  });
  try {
    const loose = await runFile(process.execPath, [script, "--root", f.dir], { timeout: 10000, maxBuffer: 1024 * 1024 });
    const looseReport = JSON.parse(loose.stdout);
    assert.equal(looseReport.status, "FAIL");
    assert.doesNotMatch(loose.stdout, /example\.invalid\/raw/);

    await assert.rejects(
      runFile(process.execPath, [script, "--root", f.dir, "--strict"], { timeout: 10000, maxBuffer: 1024 * 1024 }),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stdout, /"status":"FAIL"/);
        return true;
      },
    );
  } finally {
    await f.close();
  }
});

test("component registration CTAs carry growth decision and placement attributes", async () => {
  const files = await componentFiles(path.join(root, "src/components"));
  const missing = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const { tag, line } of openingTagsWithRegistrationCta(source)) {
      if (!/data-growth-decision=/.test(tag) || !/data-growth-placement=/.test(tag)) {
        missing.push(`${path.relative(root, file)}:${line}`);
      }
    }
  }

  assert.deepEqual(missing, []);
});
