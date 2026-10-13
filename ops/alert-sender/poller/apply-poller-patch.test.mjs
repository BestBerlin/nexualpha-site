// The poller patch runs against a temp copy of the current compiled release file (fixtures/poller/, our own code).
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MARKER, PATCHES, SRC_DIR, applyPollerPatch, patchSource } from "./apply-poller-patch.mjs";

const FIXTURES = new URL("../fixtures/poller/", import.meta.url);
const original = readFileSync(new URL("mock-community-service.js", FIXTURES), "utf8");

function release() {
  const dir = mkdtempSync(path.join(tmpdir(), "nx-poller-"));
  const src = path.join(dir, SRC_DIR);
  mkdirSync(src, { recursive: true });
  writeFileSync(path.join(dir, "package.json"), JSON.stringify({ type: "module" }));
  for (const f of ["mock-community-service.js", "alert-subscriptions.js"]) cpSync(new URL(f, FIXTURES), path.join(src, f));
  return { dir, src, target: path.join(src, "mock-community-service.js") };
}

test("every anchor appears exactly once in the current release file", () => {
  for (const [name, anchor] of PATCHES) assert.equal(original.split(anchor).length - 1, 1, name);
});

test("patch replaces all anchors, copies alert-triggers.js, writes a backup, and the result parses", () => {
  const r = release();
  const res = applyPollerPatch(r.dir, { now: new Date("2026-10-13T00:00:00Z") });
  assert.equal(res.status, "patched");
  const out = readFileSync(r.target, "utf8");
  for (const [name, , replacement] of PATCHES) assert.ok(out.includes(replacement), name);
  assert.ok(out.includes(MARKER));
  assert.match(out, /from "\.\/alert-triggers\.js"/);
  assert.match(out, /const customAlert = event\.isPrivateChat \? \/\^\\\/alert\(\?:@\\w\+\)\?/);
  assert.ok(out.indexOf("const customAlert") < out.indexOf("const stopParsed = privateStopCommand(event);"), "/alert is handled before /stop parsing");
  assert.match(out, /alertsText\(memberOutcome\?\.state\) \+ alertCardSuffix\(/);
  assert.match(out, /clearUserTriggers\(event\.userId\);\n\s+handleAlertsCommand\(event\.userId, "off"\);/);
  assert.match(out, /let response = responseFor\(/);
  assert.doesNotMatch(out, /const response = responseFor\(/);
  assert.equal(readFileSync(res.backup, "utf8"), original);
  assert.match(path.basename(res.backup), /^mock-community-service\.js\.bak-2026-10-13T00-00-00-000Z$/);
  assert.equal(readFileSync(path.join(r.src, "alert-triggers.js"), "utf8"), readFileSync(new URL("../alert-triggers.mjs", import.meta.url), "utf8"));
  execFileSync(process.execPath, ["--check", r.target]);
  execFileSync(process.execPath, ["--check", path.join(r.src, "alert-triggers.js")]);
});

test("the copied alert-triggers.js loads as an ES module inside the release and exports what the patch imports", async () => {
  const r = release();
  applyPollerPatch(r.dir);
  const mod = await import(pathToFileURL(path.join(r.src, "alert-triggers.js")).href);
  for (const name of ["alertCardSuffix", "alertErrorText", "alertLangFor", "clearUserTriggers", "handleAlertCommand", "stopAllText"]) assert.equal(typeof mod[name], "function", name);
});

test("running twice is a no-op (no second backup, identical file)", () => {
  const r = release();
  applyPollerPatch(r.dir);
  const once = readFileSync(r.target, "utf8");
  const second = applyPollerPatch(r.dir);
  assert.equal(second.status, "already");
  assert.equal(second.helperChanged, false);
  assert.equal(second.backup, null);
  assert.equal(readFileSync(r.target, "utf8"), once);
  assert.equal(readdirSync(r.src).filter((f) => f.includes(".bak-")).length, 1);
  assert.equal(patchSource(once).status, "already");
});

test("a missing anchor aborts with a clear error and changes nothing", () => {
  const r = release();
  const broken = original.replace("const stopParsed = privateStopCommand(event);", "const stopParsed = privateStopCommandV2(event);");
  writeFileSync(r.target, broken);
  assert.throws(() => applyPollerPatch(r.dir), /anchor check failed, nothing changed[\s\S]*alert-command \(found 0x\)/);
  assert.equal(readFileSync(r.target, "utf8"), broken);
  assert.equal(existsSync(path.join(r.src, "alert-triggers.js")), false);
  assert.equal(readdirSync(r.src).filter((f) => f.includes(".bak-")).length, 0);
});

test("a duplicated anchor or a half-patched file is refused", () => {
  const anchor = PATCHES.find(([n]) => n === "alerts-state-user")[1];
  assert.throws(() => patchSource(original.replace(anchor, `${anchor}\n${anchor}`)), /alerts-state-user \(found 2x\)/);
  const half = `${MARKER}\n${original}`;
  assert.throws(() => patchSource(half), /patches are missing/);
});

test("CLI exits non-zero without touching a directory that is not a release", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "nx-empty-"));
  const script = fileURLToPath(new URL("./apply-poller-patch.mjs", import.meta.url));
  assert.throws(() => execFileSync(process.execPath, [script, dir], { stdio: "pipe" }), /not a bot-community release/);
  assert.deepEqual(readdirSync(dir), []);
});
