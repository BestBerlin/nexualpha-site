import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const JSX_EXTENSIONS = new Set([".jsx", ".tsx"]);
const SAFE_CTA_SOURCES = ["publicCtaForVenue", "regionalVenueCta"];
const GENERATED_DIRS = new Set(["dist", "node_modules", "docs", ".git"]);

function lineFor(source, index) {
  return source.slice(0, index).split("\n").length;
}

function attrMatch(tag, name) {
  const escaped = name.replaceAll("-", "\\-");
  const pattern = new RegExp(`\\b${escaped}(?=\\s|=|/?>)\\s*(?:=\\s*(\\{[\\s\\S]*?\\}|\"[^\"]*\"|'[^']*'))?`, "m");
  return tag.match(pattern);
}

function attrValue(tag, name) {
  return attrMatch(tag, name)?.[1] || null;
}

function hasAttr(tag, name) {
  return Boolean(attrMatch(tag, name));
}

function hasRegistrationKind(tag) {
  const value = attrValue(tag, "data-cta-kind");
  return Boolean(value && /\bregistration\b/.test(value));
}

function stablePlacementIssue(value) {
  if (!value) return "missing_data_cta_placement";
  if (/\bundefined\b|\bnull\b/.test(value)) return "unstable_data_cta_placement";
  if (/^\{\s*\w+\s*\}$/.test(value)) return "dynamic_data_cta_placement_without_local_stable_prefix";
  return null;
}

function traceableRegistrationSource({ source, tag, index }) {
  const fileUsesSafeSource = SAFE_CTA_SOURCES.some((name) => source.includes(name));
  if (!fileUsesSafeSource) return null;

  const href = attrValue(tag, "href") || "";
  const localWindow = source.slice(Math.max(0, index - 2500), Math.min(source.length, index + tag.length + 1200));
  const sourceInLocalWindow = SAFE_CTA_SOURCES.find((name) => localWindow.includes(name));
  const ctaVariableLooksProtected = /\b(ctaHref|registrationUrl|primaryRegistrationHref|mainRegistrationUrl|regUrl|affiliateUrl)\b/.test(href)
    || /\b(Cta|cta|publicCta|activeCta|venueCta|directAnswerCta|visiblePartner|matchResult|activationCta)\b/.test(href);

  if (sourceInLocalWindow) return sourceInLocalWindow;
  if (ctaVariableLooksProtected) return SAFE_CTA_SOURCES.find((name) => source.includes(name)) || null;
  return null;
}

function findJsxTags(source) {
  const tags = [];
  const pattern = /<([A-Za-z][A-Za-z0-9_.:-]*)\b(?![^>]*\/script\b)[\s\S]*?>/g;
  let match;
  while ((match = pattern.exec(source))) {
    const tag = match[0];
    if (tag.startsWith("</") || tag.startsWith("<!")) continue;
    tags.push({ tag, tagName: match[1], index: match.index });
  }
  return tags;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (GENERATED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
      continue;
    }
    if (entry.isFile() && JSX_EXTENSIONS.has(path.extname(entry.name))) files.push(fullPath);
  }
  return files.sort();
}

function analyzeFile({ file, root, source }) {
  const registrationCtas = [];
  const decisionControls = [];
  const relativeFile = path.relative(root, file);

  for (const item of findJsxTags(source)) {
    const line = lineFor(source, item.index);
    if (hasRegistrationKind(item.tag)) {
      const placementValue = attrValue(item.tag, "data-cta-placement");
      const sourceTrace = traceableRegistrationSource({ source, tag: item.tag, index: item.index });
      const issues = [
        stablePlacementIssue(placementValue),
        sourceTrace ? null : "registration_target_not_traced_to_public_or_regional_cta",
      ].filter(Boolean);
      registrationCtas.push({
        file: relativeFile,
        line,
        tag: item.tagName,
        placement: placementValue ? "present" : "missing",
        sourceTrace,
        issues,
      });
    }

    const hasDecision = hasAttr(item.tag, "data-growth-decision");
    const hasPlacement = hasAttr(item.tag, "data-growth-placement");
    if (hasDecision || hasPlacement) {
      const issues = [];
      if (!hasDecision) issues.push("missing_data_growth_decision");
      if (!hasPlacement) issues.push("missing_data_growth_placement");
      decisionControls.push({
        file: relativeFile,
        line,
        tag: item.tagName,
        hasDecision,
        hasPlacement,
        issues,
      });
    }
  }

  return { registrationCtas, decisionControls };
}

export async function auditCtaFunnelCoverage(options = {}) {
  const root = path.resolve(options.root || path.dirname(fileURLToPath(new URL("../package.json", import.meta.url))));
  const srcDir = path.resolve(root, options.srcDir || "src");
  const files = await walk(srcDir);
  const registrationCtas = [];
  const decisionControls = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const report = analyzeFile({ file, root, source });
    registrationCtas.push(...report.registrationCtas);
    decisionControls.push(...report.decisionControls);
  }

  const issues = [
    ...registrationCtas.flatMap((cta) => cta.issues.map((issue) => ({ type: "registration_cta", issue, file: cta.file, line: cta.line }))),
    ...decisionControls.flatMap((control) => control.issues.map((issue) => ({ type: "decision_control", issue, file: control.file, line: control.line }))),
  ];

  return {
    status: issues.length ? "FAIL" : "PASS",
    root,
    srcDir: path.relative(root, srcDir) || ".",
    filesScanned: files.length,
    totals: {
      registrationCtas: registrationCtas.length,
      decisionControls: decisionControls.length,
      issues: issues.length,
    },
    registrationCtas,
    decisionControls,
    issues,
  };
}

function parseArgs(argv) {
  const options = { strict: false, pretty: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") options.root = argv[++index];
    else if (arg === "--src") options.srcDir = argv[++index];
    else if (arg === "--strict") options.strict = true;
    else if (arg === "--pretty") options.pretty = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const report = await auditCtaFunnelCoverage(options);
    process.stdout.write(`${JSON.stringify(report, null, options.pretty ? 2 : 0)}\n`);
    if (options.strict && report.status !== "PASS") process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
