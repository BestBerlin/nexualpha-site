// Neutral-locale patch (v2) on temp copies of the current compiled release files (fixtures/poller/), after v1.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { SRC_DIR, applyPollerPatch } from "./apply-poller-patch.mjs";
import { applyStartPatch } from "./apply-start-patch.mjs";
import { MARKER, SERVICE, applyNeutralPatch } from "./apply-neutral-patch.mjs";
import { startMenu } from "../site-features.mjs";

const FIXTURES = new URL("../fixtures/poller/", import.meta.url);
const COPY = { "mock-community-service.js": SERVICE, "alert-subscriptions.js": path.join(SRC_DIR, "alert-subscriptions.js"),
  "contracts-telegram.js": "dist/packages/contracts/src/telegram.js", "update-decoder.js": "dist/packages/telegram/src/update-decoder.js" };
function release({ start = true } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "nx-neutral-"));
  writeFileSync(path.join(dir, "package.json"), JSON.stringify({ type: "module" }));
  for (const [from, to] of Object.entries(COPY)) { mkdirSync(path.dirname(path.join(dir, to)), { recursive: true }); cpSync(new URL(from, FIXTURES), path.join(dir, to)); }
  applyPollerPatch(dir);
  if (start) applyStartPatch(dir);
  return dir;
}
const svc = (dir) => readFileSync(path.join(dir, SERVICE), "utf8");

test("patches the service after v1: neutral /start has no /hub, sign-up requests get the tools menu, file parses", () => {
  const dir = release();
  const before = svc(dir);
  const r = applyNeutralPatch(dir, { now: new Date("2026-10-13T05:00:00Z") });
  assert.equal(r.status, "patched");
  assert.equal(readFileSync(r.backup, "utf8"), before);
  execFileSync(process.execPath, ["--check", r.file]);
  const s = svc(dir);
  assert.match(s, /import \{ isNeutralCtaLocale \} from "\.\/site-features\.js";/);
  assert.match(s, /isNeutralCtaLocale\(nxMenuLang\) \? \[navigationButton\("🔔 \/alerts", "alerts"\)\] :/);
  assert.match(s, /isSignupIntent\(event\.text\) \|\| nxNeutralSignupText !== undefined/);
  assert.match(s, /if \(parsed\.command === "signup"\) \{\n\s+const menu = startMenu\(nxLang\);/);
  // guard sits after the menu/stop handling and right before the send
  const guard = s.indexOf("nx-neutral-cta: information-only languages");
  assert.ok(guard > s.indexOf("nx-start-menu: a private /start") && guard > s.indexOf("custom_alert_stop_failed"));
  assert.ok(guard < s.indexOf("if (response && (event.isPrivateChat || groupReplyCommands.has(parsed.command)))"));
  assert.equal(readFileSync(path.join(dir, SRC_DIR, "site-features.js"), "utf8"), readFileSync(new URL("../site-features.mjs", import.meta.url), "utf8").replace('from "../../pilot-01-prototype/src/data/venue-priority.js"', 'from "./venue-priority.js"'));
  assert.equal(readFileSync(path.join(dir, SRC_DIR, "venue-priority.js"), "utf8"), readFileSync(new URL("../../../pilot-01-prototype/src/data/venue-priority.js", import.meta.url), "utf8"));
});

test("the neutral sign-up text detector: Vietnamese/Russian sign-up words, short texts only", () => {
  const s = svc((() => { const d = release(); applyNeutralPatch(d); return d; })());
  const line = s.split("\n").find((l) => l.includes("const nxNeutralSignupText ="));
  const detect = new Function("event", `${line.trim()} return nxNeutralSignupText;`);
  const ev = (text, isPrivateChat = true) => ({ text, isPrivateChat });
  assert.equal(detect(ev("đăng ký")), "vi");
  assert.equal(detect(ev("Đăng ký OKX thế nào?")), "vi");
  assert.equal(detect(ev("mã mời là gì")), "vi");
  assert.equal(detect(ev("как зарегистрироваться")), "ru");
  assert.equal(detect(ev("đăng ký", false)), undefined, "groups: not a private sign-up request");
  assert.equal(detect(ev("giá BTC hôm nay")), undefined);
  assert.equal(detect(ev("đăng ký ".repeat(10))), undefined, "long texts are conversation, not a request");
});

test("idempotent; refuses to run before v1; refuses a half-patched file", () => {
  const dir = release();
  applyNeutralPatch(dir);
  const snap = svc(dir);
  assert.equal(applyNeutralPatch(dir).status, "already");
  assert.equal(svc(dir), snap);
  assert.equal(readdirSync(path.join(dir, SRC_DIR)).filter((f) => f.startsWith("mock-community-service.js.bak-")).length, 3, "poller + start + neutral backups");
  assert.throws(() => applyNeutralPatch(release({ start: false })), /run apply-start-patch\.mjs first/);
  const half = release();
  writeFileSync(path.join(half, SERVICE), `${svc(half)}\n${MARKER}\n`);
  assert.throws(() => applyNeutralPatch(half), /patches are missing/);
});

test("site-features start menu: neutral locales never get a campaign row; others keep it", () => {
  for (const l of ["vi", "zh-Hant", "zh-tw", "uk", "ar", "ur"]) assert.ok(!startMenu(l).rows.flat().some((b) => /🎁|\/activities/.test(b.text + b.url)), l);
  assert.equal(startMenu("zh-tw").text.split("\n")[0], startMenu("zh").text.split("\n")[0], "zh-Hant readers get the zh copy");
  assert.ok(startMenu("en").rows.flat().some((b) => /🎁/.test(b.text)));
  assert.ok(startMenu("ru").rows.flat().some((b) => /\/ru\/activities\?/.test(b.url)), "ru keeps its neutral hub link (unchanged)");
});
