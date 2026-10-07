#!/usr/bin/env node
import { createHash } from "node:crypto";
import { lstat, readFile, readdir, readlink, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SCHEMA_VERSION = "nexualpha-production-archive-cleanup-plan-v1";
const DEFAULT_STATE_FILE = ".nexualpha-bluegreen/state.json";
const NEWEST_BACKUP_KEEP = 2;
const COMMERCIAL_PROTECTED_PATHS = new Set([
  "src/data/partner-registry.js",
  "src/data/public-cta.js",
  "src/data/regional-cta.js",
  "src/data/venue-database.js",
]);

class ArchiveCleanupError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = "ArchiveCleanupError";
    this.code = code;
  }
}

export async function planArchiveCleanup(options = {}) {
  if (options.apply) throw new ArchiveCleanupError("APPLY_NOT_IMPLEMENTED");
  const now = normalizeNow(options.now);
  const roots = await resolveRoots(options.roots || defaultRoots(process.cwd()));
  const stateFile = path.resolve(options.stateFile || DEFAULT_STATE_FILE);
  const state = await readJsonIfExists(stateFile);
  const stateReferences = collectStateReferences(state);
  const staticAliasTarget = await resolveOptionalSymlink(options.staticAliasPath);
  if (staticAliasTarget) stateReferences.set(staticAliasTarget, ["static-alias-target"]);

  const scanned = [];
  for (const root of roots) {
    scanned.push(...await scanRoot(root));
  }
  const uniqueEntries = dedupeEntries(scanned);
  const backupPathsToKeep = new Set(uniqueEntries
    .filter((entry) => entry.kind === "backup")
    .sort((left, right) => right.mtimeMs - left.mtimeMs)
    .slice(0, NEWEST_BACKUP_KEEP)
    .map((entry) => entry.path));

  const entries = await Promise.all(uniqueEntries.map(async (entry) => {
    const referencedBy = stateReferences.get(entry.path) || [];
    const protection = protectionReasons(entry, referencedBy, backupPathsToKeep);
    const hashed = await hashEntry(entry);
    return {
      path: entry.path,
      kind: entry.kind,
      bytes: entry.bytes,
      mtime: new Date(entry.mtimeMs).toISOString(),
      buildId: entry.buildId,
      sha256: hashed.sha256,
      manifest: hashed.manifest,
      referencedBy,
      protection,
      disposition: protection.length ? (protection.includes("commercial-protected-path") ? "blocked" : "keep") : "candidate",
      reason: protection.length ? protection.join(",") : "UNREFERENCED_ARCHIVE_OR_RELEASE",
    };
  }));

  const totals = entries.reduce((acc, entry) => {
    acc.bytesScanned += entry.bytes;
    if (entry.disposition === "candidate") acc.bytesCandidate += entry.bytes;
    if (entry.disposition === "keep" || entry.disposition === "blocked") acc.bytesProtected += entry.bytes;
    if (entry.disposition === "candidate") acc.bytesReclaimable += entry.bytes;
    return acc;
  }, { bytesScanned: 0, bytesProtected: 0, bytesCandidate: 0, bytesReclaimable: 0 });

  return {
    schemaVersion: SCHEMA_VERSION,
    mode: "dry-run",
    status: "READY_FOR_REVIEW",
    generatedAt: now.toISOString(),
    roots,
    protected: entries.filter((entry) => entry.disposition !== "candidate").map((entry) => ({
      path: entry.path,
      kind: entry.kind,
      disposition: entry.disposition,
      reason: entry.reason,
      referencedBy: entry.referencedBy,
      protection: entry.protection,
    })),
    candidates: entries.filter((entry) => entry.disposition === "candidate").map((entry) => ({
      path: entry.path,
      kind: entry.kind,
      bytes: entry.bytes,
      sha256: entry.sha256,
      reason: entry.reason,
    })),
    entries: entries.sort((left, right) => left.path.localeCompare(right.path)),
    totals,
    requirements: {
      applySupported: false,
      defaultReadOnly: true,
      applyRequiresExplicitFlag: true,
      applyRequiresManifest: true,
      preserveCurrentAndPrevious: true,
      preservePending: true,
      preserveTwoNewestBackups: true,
      permanentDeleteImplemented: false,
      futureApplyMode: "explicit quarantine move only",
    },
  };
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const plan = await planArchiveCleanup(options);
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
  return plan;
}

function parseArgs(argv) {
  const options = { roots: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--apply") {
      options.apply = true;
    } else if (arg === "--dry-run") {
      options.apply = false;
    } else if (arg === "--root") {
      options.roots.push(requiredValue(argv, ++index, arg));
    } else if (arg === "--state-file") {
      options.stateFile = requiredValue(argv, ++index, arg);
    } else if (arg === "--static-alias-path") {
      options.staticAliasPath = requiredValue(argv, ++index, arg);
    } else {
      throw new ArchiveCleanupError("ARG_INVALID", `Unexpected argument: ${arg}`);
    }
  }
  if (!options.roots.length) delete options.roots;
  return options;
}

function requiredValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new ArchiveCleanupError("ARG_VALUE_REQUIRED", `Missing value for ${flag}`);
  return value;
}

function normalizeNow(value) {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new ArchiveCleanupError("NOW_INVALID");
  return date;
}

function defaultRoots(cwd) {
  return [
    path.join(cwd, ".nexualpha-bluegreen", "releases"),
    path.join(cwd, "releases"),
    path.join(cwd, "backups"),
    path.join(cwd, "artifacts", "ops"),
  ];
}

async function resolveRoots(roots) {
  const resolved = [];
  for (const root of roots) {
    const absolute = path.resolve(root);
    try {
      await lstat(absolute);
      resolved.push(absolute);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return [...new Set(resolved)];
}

async function readJsonIfExists(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function collectStateReferences(state) {
  const references = new Map();
  for (const key of ["active", "previous", "pending"]) {
    const releaseDir = state?.[key]?.releaseDir;
    if (!releaseDir) continue;
    addReference(references, path.resolve(releaseDir), `state:${key}.releaseDir`);
  }
  return references;
}

function addReference(map, target, label) {
  const list = map.get(target) || [];
  list.push(label);
  map.set(target, list);
}

async function resolveOptionalSymlink(linkPath) {
  if (!linkPath) return null;
  try {
    const link = path.resolve(linkPath);
    const target = await readlink(link);
    return path.resolve(path.dirname(link), target);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EINVAL") return null;
    throw error;
  }
}

async function scanRoot(root) {
  const rootStat = await lstat(root);
  if (!rootStat.isDirectory()) return [await describePath(root, rootStat)];
  const names = await readdir(root);
  const entries = [];
  for (const name of names) {
    if (name === "node_modules" || name === ".git") continue;
    const target = path.join(root, name);
    const entry = await describePath(target);
    entries.push(entry);
    if (entry.directory && entry.kind !== "release-dir") entries.push(...await scanNestedDirectory(entry.path));
  }
  return entries;
}

async function scanNestedDirectory(directory) {
  const entries = [];
  const names = await readdir(directory);
  for (const name of names) {
    if (name === "node_modules" || name === ".git") continue;
    const target = path.join(directory, name);
    const entry = await describePath(target);
    entries.push(entry);
    if (entry.directory && entry.kind !== "release-dir") entries.push(...await scanNestedDirectory(entry.path));
  }
  return entries;
}

async function describePath(target, knownStat = null) {
  const info = knownStat || await lstat(target);
  const directory = info.isDirectory();
  const bytes = directory ? await directorySize(target) : info.size;
  const buildId = directory ? await readBuildId(target) : buildIdFromName(path.basename(target));
  return {
    path: path.resolve(target),
    kind: classifyKind(target, directory, buildId),
    directory,
    bytes,
    mtimeMs: info.mtimeMs,
    buildId,
  };
}

async function directorySize(directory) {
  let total = 0;
  for (const name of await readdir(directory)) {
    const target = path.join(directory, name);
    const info = await lstat(target);
    if (info.isDirectory()) total += await directorySize(target);
    else total += info.size;
  }
  return total;
}

async function readBuildId(directory) {
  try {
    const version = JSON.parse(await readFile(path.join(directory, "version.json"), "utf8"));
    return typeof version.buildId === "string" ? version.buildId : buildIdFromName(path.basename(directory));
  } catch (error) {
    if (error.code === "ENOENT") return buildIdFromName(path.basename(directory));
    throw error;
  }
}

function buildIdFromName(name) {
  const match = name.match(/(?:^|[-_])(3\.[a-zA-Z0-9._-]+|[0-9]+\.[0-9][a-zA-Z0-9._-]*)/);
  return match?.[1] || null;
}

function classifyKind(target, directory, buildId) {
  const name = path.basename(target);
  if (isCommercialPath(target)) return "commercial";
  if (directory && buildId) return "release-dir";
  if (/nexualpha-pre-.*\.(?:tar\.gz|tgz|zip)$/i.test(name)) return "backup";
  if (/\.(?:tar\.gz|tgz|zip)$/i.test(name)) return "archive";
  if (/release|candidate/i.test(name)) return directory ? "release-dir" : "archive";
  return directory ? "directory" : "file";
}

function protectionReasons(entry, referencedBy, backupPathsToKeep) {
  const reasons = [];
  if (referencedBy.length) reasons.push("referenced-by-release-state");
  if (backupPathsToKeep.has(entry.path)) reasons.push("newest-backup-retention");
  if (isCommercialPath(entry.path)) reasons.push("commercial-protected-path");
  return reasons;
}

function isCommercialPath(target) {
  const normalized = target.replaceAll("\\", "/");
  for (const suffix of COMMERCIAL_PROTECTED_PATHS) {
    if (normalized.endsWith(suffix)) return true;
  }
  return /(?:private|analytics|cta-collector|partner-registry|public-cta|regional-cta|venue-database)/i.test(normalized);
}

async function hashEntry(entry) {
  if (!entry.directory) {
    const bytes = await readFile(entry.path);
    return { sha256: sha256(bytes), manifest: null };
  }
  const files = await listFiles(entry.path);
  const rows = await Promise.all(files.map(async (file) => {
    const bytes = await readFile(path.join(entry.path, file));
    return { path: file, sha256: sha256(bytes), bytes: bytes.byteLength };
  }));
  rows.sort((left, right) => left.path.localeCompare(right.path));
  return {
    sha256: sha256(rows.map((row) => `${row.path}\0${row.sha256}\0${row.bytes}`).join("\n")),
    manifest: { algorithm: "sha256", files: rows },
  };
}

async function listFiles(directory, prefix = "") {
  const rows = [];
  for (const name of await readdir(path.join(directory, prefix))) {
    const relative = prefix ? `${prefix}/${name}` : name;
    const target = path.join(directory, relative);
    const info = await stat(target);
    if (info.isDirectory()) rows.push(...await listFiles(directory, relative));
    else rows.push(relative);
  }
  return rows;
}

function dedupeEntries(entries) {
  return [...new Map(entries.map((entry) => [entry.path, entry])).values()];
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    const status = error instanceof ArchiveCleanupError ? error.code : "ARCHIVE_CLEANUP_PLAN_ERROR";
    process.stderr.write(`${JSON.stringify({ status, message: error.message }, null, 2)}\n`);
    process.exitCode = 1;
  });
}
