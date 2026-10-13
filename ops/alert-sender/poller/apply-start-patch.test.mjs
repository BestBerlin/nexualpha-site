// The start-menu patch runs against temp copies of the current compiled release files (fixtures/poller/).
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { SRC_DIR, applyPollerPatch } from "./apply-poller-patch.mjs";
import { ALERT_START_ANCHOR, ALERT_START_MARKER, ALERT_START_REPLACEMENT, FILES, MARKER, applyStartPatch } from "./apply-start-patch.mjs";
import { applyNeutralPatch } from "./apply-neutral-patch.mjs";
import { applyHubPatch } from "./apply-hub-patch.mjs";
import { applyAlertStartPatch, patchAlertStartText } from "./apply-alert-start-patch.mjs";

const FIXTURES = new URL("../fixtures/poller/", import.meta.url);
const COPY = { "mock-community-service.js": path.join(SRC_DIR, "mock-community-service.js"), "alert-subscriptions.js": path.join(SRC_DIR, "alert-subscriptions.js"),
  "contracts-telegram.js": "dist/packages/contracts/src/telegram.js", "update-decoder.js": "dist/packages/telegram/src/update-decoder.js" };

function release({ triggers = true } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "nx-start-"));
  writeFileSync(path.join(dir, "package.json"), JSON.stringify({ type: "module" }));
  for (const [from, to] of Object.entries(COPY)) { mkdirSync(path.dirname(path.join(dir, to)), { recursive: true }); cpSync(new URL(from, FIXTURES), path.join(dir, to)); }
  if (triggers) applyPollerPatch(dir);
  return dir;
}
const read = (dir, rel) => readFileSync(path.join(dir, rel), "utf8");

test("patches service, contract and decoder, copies site-features.js, keeps backups, and every file parses", () => {
  const dir = release();
  const before = Object.fromEntries(FILES.map(([name, rel]) => [name, read(dir, rel)]));
  const r = applyStartPatch(dir, { now: new Date("2026-10-13T00:00:00Z") });
  assert.deepEqual(r.results.map((x) => x.status), ["patched", "patched", "patched"]);
  for (const x of r.results) { assert.equal(readFileSync(x.backup, "utf8"), before[x.name]); execFileSync(process.execPath, ["--check", x.file]); }
  const svc = read(dir, FILES[0][1]);
  assert.match(svc, /import \{ langFromCode, startMenu \} from "\.\/site-features\.js";/);
  assert.ok(svc.indexOf("nx-start-menu: a private /start") > svc.indexOf("let response = responseFor("), "menu replaces the computed response");
  assert.ok(svc.indexOf("nx-start-menu: a private /start") < svc.indexOf("if (response && (event.isPrivateChat || groupReplyCommands.has(parsed.command)))"), "before sending");
  assert.match(svc, /startAlertRoute \? \{ command: "alerts", argument: nxAlertLang \? `lang-\$\{nxAlertLang\}` : undefined \}/);
  assert.match(svc, /startTarget === "launchpool_alert"/);
  assert.match(svc, /startMenu\(nxStartLang \?\? nxStored \?\? langFromCode\(event\.languageCode\) \?\? "en"\)/);
  assert.match(read(dir, FILES[1][1]), /languageCode: z\.string\(\)\.max\(35\)\.optional\(\),/);
  const dec = read(dir, FILES[2][1]);
  assert.match(dec, /language_code: z\.string\(\)\.max\(35\)\.optional\(\) \}\)\.optional\(\),/);
  assert.match(dec, /languageCode: sender\.language_code/);
  assert.equal(read(dir, path.join(SRC_DIR, "site-features.js")), readFileSync(new URL("../site-features.mjs", import.meta.url), "utf8").replace('from "../../pilot-01-prototype/src/data/venue-priority.js"', 'from "./venue-priority.js"'));
  assert.equal(read(dir, path.join(SRC_DIR, "venue-priority.js")), readFileSync(new URL("../../../pilot-01-prototype/src/data/venue-priority.js", import.meta.url), "utf8"));
});

test("generic alert start payloads route to the alerts card with language context and no topic opt-in", () => {
  const dir = release();
  applyStartPatch(dir);
  const source = read(dir, FILES[0][1]);
  const block = source.slice(source.indexOf("        const startTarget"), source.indexOf("        const controlEvent"));
  const run = new Function("rawParsed", "event", "langFromCode", `${block}\nreturn parsed;`);
  const route = (argument, languageCode = "en") => run({ command: "start", argument }, { languageCode }, (value) => {
    const c = String(value || "").toLowerCase();
    if (c.startsWith("zh")) return "zh";
    if (c.startsWith("pt")) return "pt";
    return ["en", "ru", "tr", "vi", "id", "es"].includes(c.split(/[-_]/)[0]) ? c.split(/[-_]/)[0] : null;
  });
  assert.deepEqual(route("alert_l_ptBR"), { command: "alerts", argument: "lang-pt" });
  assert.deepEqual(route("launchpool_alert", "ru"), { command: "alerts", argument: undefined });
  assert.deepEqual(route("alert", "zz"), { command: "alerts", argument: undefined });
});

test("incremental alert-start patch upgrades an already start-neutral-hub patched release", () => {
  const dir = release();
  applyStartPatch(dir);
  applyNeutralPatch(dir);
  applyHubPatch(dir);
  const file = path.join(dir, FILES[0][1]);
  const fullyPatched = read(dir, FILES[0][1]);
  const oldPatched = fullyPatched.replace(ALERT_START_REPLACEMENT, ALERT_START_ANCHOR);
  assert.notEqual(oldPatched, fullyPatched);
  writeFileSync(file, oldPatched);

  const result = applyAlertStartPatch(dir, { now: new Date("2026-10-13T12:00:00Z") });
  assert.equal(result.status, "patched");
  assert.equal(readFileSync(result.backup, "utf8"), oldPatched);
  assert.equal(read(dir, FILES[0][1]), fullyPatched);
  assert.equal(applyAlertStartPatch(dir).status, "already");
  assert.throws(() => patchAlertStartText(oldPatched.replace(ALERT_START_ANCHOR, "")), /anchor check failed/);
  assert.throws(() => patchAlertStartText(`${oldPatched}\n${ALERT_START_MARKER}\n`), /incomplete/);
});

test("the copied helpers load inside the release and export what the patch imports", async () => {
  const dir = release();
  applyStartPatch(dir);
  const sf = await import(pathToFileURL(path.join(dir, SRC_DIR, "site-features.js")).href);
  assert.equal(typeof sf.startMenu, "function");
  assert.equal(sf.langFromCode("pt-br"), "pt");
  const at = await import(pathToFileURL(path.join(dir, SRC_DIR, "alert-triggers.js")).href);
  assert.equal(at.storedLangFor("1", { subsFile: "/nonexistent", triggersFile: "/nonexistent" }), null);
});

test("idempotent; refuses to run before the alert-triggers patch; refuses a half-patched file", () => {
  const dir = release();
  applyStartPatch(dir);
  const snap = FILES.map(([, rel]) => read(dir, rel));
  const again = applyStartPatch(dir);
  assert.deepEqual(again.results.map((x) => x.status), ["already", "already", "already"]);
  assert.deepEqual(FILES.map(([, rel]) => read(dir, rel)), snap);
  assert.equal(readdirSync(path.join(dir, SRC_DIR)).filter((f) => f.startsWith("mock-community-service.js.bak-")).length, 2, "poller + start backups only");

  const raw = release({ triggers: false });
  assert.throws(() => applyStartPatch(raw), /run apply-poller-patch\.mjs first/);
  assert.equal(read(raw, FILES[1][1]), readFileSync(new URL("contracts-telegram.js", FIXTURES), "utf8"), "nothing written");

  const half = release();
  writeFileSync(path.join(half, FILES[1][1]), `${read(half, FILES[1][1])}\n${MARKER}\n`);
  assert.throws(() => applyStartPatch(half), /patches are missing: contract-language/);
});
