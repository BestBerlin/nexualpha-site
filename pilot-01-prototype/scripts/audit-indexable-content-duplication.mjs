#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

const input = path.resolve(arg("--input", path.join(projectRoot, "artifacts/whole-site/seo-final/results.json")));
const output = path.resolve(arg("--output", path.join(projectRoot, "artifacts/seo/indexable-content-duplication.json")));
const markdown = path.resolve(arg("--markdown", path.join(projectRoot, "artifacts/seo/indexable-content-duplication.md")));
const minMainText = Number.parseInt(arg("--min-main-text", "300"), 10);
const baselinePath = arg("--baseline", "");
const dispositionsPath = path.resolve(arg("--dispositions", path.join(projectRoot, "scripts/indexable-content-duplication-dispositions.json")));

function normalized(value) {
  return String(value || "").normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

function groupDuplicates(pages, field, minimumLength = 1) {
  const groups = new Map();
  for (const page of pages) {
    const value = normalized(page[field]);
    if (value.length < minimumLength) continue;
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push({ path: page.path, locale: page.locale, canonical: page.canonical });
  }
  return [...groups.entries()]
    .filter(([, members]) => new Set(members.map((item) => item.canonical)).size > 1)
    .map(([value, members]) => ({ value, count: members.length, members }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
}

function dispositionKey(group) {
  const paths = [...new Set((group.members || []).map((item) => item.path))].sort();
  const locales = [...new Set((group.members || []).map((item) => item.locale))].sort();
  return `${group.value}||${paths.join(",")}||${locales.join(",")}`;
}

function normalizeDispositions(dispositions = [], field) {
  const index = new Map();
  for (const item of dispositions) {
    if (item.field !== field || item.disposition !== "allow") continue;
    if (!item.reason || !String(item.reason).trim()) continue;
    const value = normalized(item.value);
    const paths = [...new Set(item.paths || [])].sort();
    const locales = [...new Set(item.locales || [])].sort();
    if (!value || !paths.length || !locales.length) continue;
    index.set(`${value}||${paths.join(",")}||${locales.join(",")}`, { ...item, value, paths, locales });
  }
  return index;
}

function applyDuplicateDispositions(groups, field, dispositions = []) {
  const index = normalizeDispositions(dispositions, field);
  const open = [];
  const allowed = [];
  for (const group of groups) {
    const disposition = index.get(dispositionKey(group));
    if (!disposition) {
      open.push(group);
      continue;
    }
    allowed.push({ ...group, disposition: disposition.disposition, reason: disposition.reason });
  }
  return { open, allowed };
}

export function auditIndexablePages(payload, options = {}) {
  const threshold = options.minMainText ?? 300;
  const dispositions = options.dispositions?.items || options.dispositions || [];
  const pages = (payload.pages || []).filter((page) => page.status === 200 && page.robots === "index,follow");
  const rawDuplicateTitles = groupDuplicates(pages, "title", 8);
  const duplicateDescriptions = groupDuplicates(pages, "description", 20);
  const rawDuplicateH1s = groupDuplicates(pages, "h1", 8);
  const titleDisposition = applyDuplicateDispositions(rawDuplicateTitles, "title", dispositions);
  const h1Disposition = applyDuplicateDispositions(rawDuplicateH1s, "h1", dispositions);
  const duplicateTitles = titleDisposition.open;
  const duplicateH1s = h1Disposition.open;
  const duplicateMainFingerprints = groupDuplicates(pages, "mainTextFingerprint", 32);
  const thinPages = pages
    .filter((page) => Number(page.mainTextLength) < threshold)
    .map(({ path, locale, canonical, mainTextLength }) => ({ path, locale, canonical, mainTextLength }))
    .sort((left, right) => left.mainTextLength - right.mainTextLength);

  const localeFingerprintGroups = new Map();
  for (const page of pages) {
    const key = `${page.path}|${page.mainTextFingerprint}`;
    if (!localeFingerprintGroups.has(key)) localeFingerprintGroups.set(key, []);
    localeFingerprintGroups.get(key).push({ path: page.path, locale: page.locale, canonical: page.canonical });
  }
  const localeFallbackRisks = [...localeFingerprintGroups.values()]
    .filter((members) => new Set(members.map((item) => item.locale)).size > 1)
    .sort((left, right) => right.length - left.length);

  const severity = {
    high: duplicateMainFingerprints.length + localeFallbackRisks.length + thinPages.length,
    medium: duplicateDescriptions.length,
    advisory: duplicateTitles.length + duplicateH1s.length,
  };
  const reviewCount = severity.high + severity.medium + severity.advisory;
  return {
    generatedAt: new Date().toISOString(),
    status: reviewCount ? "REVIEW" : "PASS",
    boundary: "Exact duplicate and thin-content screening only. Similar wording can still be legitimate; every merge, rewrite or noindex decision requires page-intent review.",
    totals: {
      indexablePages: pages.length,
      duplicateTitleGroups: duplicateTitles.length,
      duplicateDescriptionGroups: duplicateDescriptions.length,
      duplicateH1Groups: duplicateH1s.length,
      duplicateMainFingerprintGroups: duplicateMainFingerprints.length,
      localeFallbackRiskGroups: localeFallbackRisks.length,
      thinPages: thinPages.length,
    },
    severity,
    duplicateTitles,
    duplicateDescriptions,
    duplicateH1s,
    ...(titleDisposition.allowed.length || h1Disposition.allowed.length ? {
      allowedDuplicates: {
        title: titleDisposition.allowed,
        h1: h1Disposition.allowed,
      },
    } : {}),
    duplicateMainFingerprints,
    localeFallbackRisks,
    thinPages,
  };
}

export function compareAuditToBaseline(report, baseline) {
  if (!baseline) return report;
  const current = report.severity || {};
  const previous = baseline.severity || {
    high: Number(baseline.totals?.duplicateMainFingerprintGroups || 0)
      + Number(baseline.totals?.localeFallbackRiskGroups || 0)
      + Number(baseline.totals?.thinPages || 0),
    medium: Number(baseline.totals?.duplicateDescriptionGroups || 0),
    advisory: Number(baseline.totals?.duplicateTitleGroups || 0)
      + Number(baseline.totals?.duplicateH1Groups || 0),
  };
  const delta = {
    high: current.high - previous.high,
    medium: current.medium - previous.medium,
    advisory: current.advisory - previous.advisory,
  };
  const status = delta.high > 0
    ? "REGRESSED"
    : delta.high < 0
      ? "IMPROVED"
      : (delta.medium > 0 ? "REGRESSED" : (delta.medium < 0 ? "IMPROVED" : "STABLE"));
  return {
    ...report,
    status,
    baselineComparison: {
      status,
      previous,
      current,
      delta,
      policy: "High-confidence body, locale-fallback and thin-page signals take priority. Description regressions break ties; repeated brand titles and H1s remain advisory until page-intent review.",
    },
  };
}

export function renderAuditMarkdown(report) {
  const lines = [
    "# NexuAlpha indexable content duplication audit",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    "",
    `Boundary: ${report.boundary}`,
    "",
    "## Totals",
    "",
    ...Object.entries(report.totals).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Severity",
    "",
    ...Object.entries(report.severity || {}).map(([key, value]) => `- ${key}: ${value}`),
    "",
  ];
  if (report.baselineComparison) {
    lines.push(
      "## Baseline comparison",
      "",
      `- status: ${report.baselineComparison.status}`,
      `- high-confidence delta: ${report.baselineComparison.delta.high}`,
      `- description delta: ${report.baselineComparison.delta.medium}`,
      `- advisory title/H1 delta: ${report.baselineComparison.delta.advisory}`,
      `- policy: ${report.baselineComparison.policy}`,
      "",
    );
  }
  if (report.allowedDuplicates && (report.allowedDuplicates.title.length || report.allowedDuplicates.h1.length)) {
    lines.push("## Allowed advisory duplicates", "");
    for (const [field, groups] of Object.entries(report.allowedDuplicates)) {
      for (const group of groups) {
        lines.push(`- ${field}: ${group.count} pages · ${group.value}`);
        lines.push(`  - disposition: ${group.disposition}`);
        lines.push(`  - reason: ${group.reason}`);
        for (const member of group.members.slice(0, 12)) lines.push(`  - ${member.locale}: ${member.canonical}`);
      }
    }
    lines.push("");
  }
  for (const [label, groups] of [
    ["Duplicate titles", report.duplicateTitles],
    ["Duplicate descriptions", report.duplicateDescriptions],
    ["Duplicate H1s", report.duplicateH1s],
    ["Duplicate main-content fingerprints", report.duplicateMainFingerprints],
    ["Cross-locale identical-content risks", report.localeFallbackRisks.map((members) => ({ value: members[0]?.path || "route", count: members.length, members }))],
  ]) {
    lines.push(`## ${label}`, "");
    if (!groups.length) lines.push("- None detected.", "");
    else {
      for (const group of groups.slice(0, 50)) {
        lines.push(`- ${group.count} pages · ${group.value}`);
        for (const member of group.members.slice(0, 12)) lines.push(`  - ${member.locale}: ${member.canonical}`);
      }
      lines.push("");
    }
  }
  lines.push("## Thin main-content candidates", "");
  if (!report.thinPages.length) lines.push("- None detected.");
  else for (const page of report.thinPages.slice(0, 100)) lines.push(`- ${page.mainTextLength} chars · ${page.locale} · ${page.canonical}`);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const payload = JSON.parse(await readFile(input, "utf8"));
  const baseline = baselinePath ? JSON.parse(await readFile(path.resolve(baselinePath), "utf8")) : null;
  let dispositions = null;
  try {
    dispositions = JSON.parse(await readFile(path.resolve(dispositionsPath), "utf8"));
  } catch (error) {
    if (args.includes("--dispositions")) throw error;
  }
  const report = compareAuditToBaseline(auditIndexablePages(payload, { minMainText, dispositions }), baseline);
  await mkdir(path.dirname(output), { recursive: true });
  await mkdir(path.dirname(markdown), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(markdown, renderAuditMarkdown(report), "utf8");
  console.log(`Indexable content duplication audit: ${report.status}; ${report.totals.indexablePages} indexable pages; ${Object.values(report.totals).slice(1).reduce((sum, value) => sum + value, 0)} review signals`);
}
