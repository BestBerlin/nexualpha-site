import assert from "node:assert/strict";
import test from "node:test";
import { auditIndexablePages, compareAuditToBaseline, renderAuditMarkdown } from "../scripts/audit-indexable-content-duplication.mjs";

const page = (overrides) => ({
  status: 200,
  robots: "index,follow",
  path: "/a",
  locale: "en",
  canonical: "https://nexualpha.com/a",
  title: "Unique title A",
  description: "A useful and sufficiently distinct description.",
  h1: "Unique heading A",
  mainTextLength: 600,
  mainTextFingerprint: "a".repeat(64),
  ...overrides,
});

test("duplication audit separates exact duplicate, locale fallback and thin-content signals", () => {
  const report = auditIndexablePages({ pages: [
    page({}),
    page({ path: "/b", canonical: "https://nexualpha.com/b", title: "Unique title B", description: "Another useful and sufficiently distinct description.", h1: "Unique heading B", mainTextFingerprint: "b".repeat(64) }),
    page({ locale: "ja", canonical: "https://nexualpha.com/ja/a" }),
    page({ path: "/thin", canonical: "https://nexualpha.com/thin", title: "Thin page", description: "A separate but intentionally short test description.", h1: "Thin heading", mainTextLength: 80, mainTextFingerprint: "c".repeat(64) }),
    page({ path: "/hidden", canonical: "https://nexualpha.com/hidden", robots: "noindex,follow", title: "Unique title A" }),
  ] }, { minMainText: 300 });

  assert.equal(report.status, "REVIEW");
  assert.equal(report.totals.indexablePages, 4);
  assert.equal(report.totals.duplicateTitleGroups, 1);
  assert.equal(report.totals.duplicateMainFingerprintGroups, 1);
  assert.equal(report.totals.localeFallbackRiskGroups, 1);
  assert.equal(report.totals.thinPages, 1);
  assert.match(renderAuditMarkdown(report), /requires page-intent review/i);
});

test("duplication audit passes distinct indexable pages", () => {
  const report = auditIndexablePages({ pages: [
    page({}),
    page({ path: "/b", canonical: "https://nexualpha.com/b", title: "Unique title B", description: "Another useful and sufficiently distinct description.", h1: "Unique heading B", mainTextFingerprint: "b".repeat(64) }),
  ] });
  assert.equal(report.status, "PASS");
  assert.deepEqual(report.totals, {
    indexablePages: 2,
    duplicateTitleGroups: 0,
    duplicateDescriptionGroups: 0,
    duplicateH1Groups: 0,
    duplicateMainFingerprintGroups: 0,
    localeFallbackRiskGroups: 0,
    thinPages: 0,
  });
  assert.deepEqual(report.severity, { high: 0, medium: 0, advisory: 0 });
});

test("baseline comparison prioritizes body, locale fallback and thin-page regressions", () => {
  const report = auditIndexablePages({ pages: [
    page({}),
    page({ path: "/thin", canonical: "https://nexualpha.com/thin", title: "Thin page", description: "A separate but intentionally short test description.", h1: "Thin heading", mainTextLength: 80, mainTextFingerprint: "c".repeat(64) }),
  ] });
  const compared = compareAuditToBaseline(report, {
    totals: {
      duplicateTitleGroups: 10,
      duplicateDescriptionGroups: 2,
      duplicateH1Groups: 10,
      duplicateMainFingerprintGroups: 2,
      localeFallbackRiskGroups: 2,
      thinPages: 3,
    },
  });
  assert.equal(compared.status, "IMPROVED");
  assert.deepEqual(compared.baselineComparison.previous, { high: 7, medium: 2, advisory: 20 });
  assert.deepEqual(compared.baselineComparison.current, { high: 1, medium: 0, advisory: 0 });
  assert.match(renderAuditMarkdown(compared), /high-confidence delta: -6/i);
});

test("baseline comparison reports a high-confidence regression even when advisory duplicates fall", () => {
  const report = {
    ...auditIndexablePages({ pages: [] }),
    severity: { high: 2, medium: 0, advisory: 0 },
  };
  const compared = compareAuditToBaseline(report, { severity: { high: 1, medium: 4, advisory: 20 } });
  assert.equal(compared.status, "REGRESSED");
  assert.equal(compared.baselineComparison.delta.high, 1);
});
