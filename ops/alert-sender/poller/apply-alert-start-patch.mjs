#!/usr/bin/env node
// Incremental patch for existing bot-community releases that already carry start/neutral/hub patches.
// It maps generic /start alert payloads to the /alerts card without enabling topics or changing language unless the
// deep link itself carries an explicit l_<locale> payload meta part.
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { SERVICE } from "./apply-neutral-patch.mjs";
import { MARKER as HUB_MARKER } from "./apply-hub-patch.mjs";
import { ALERT_START_ANCHOR, ALERT_START_MARKER, ALERT_START_REPLACEMENT } from "./apply-start-patch.mjs";

const count = (s, sub) => s.split(sub).length - 1;

export function patchAlertStartText(src) {
  if (src.includes(ALERT_START_MARKER)) {
    if (!src.includes(ALERT_START_REPLACEMENT)) throw new Error(`file carries ${ALERT_START_MARKER} but the alert-start patch is incomplete`);
    return { status: "already", text: src };
  }
  if (!src.includes(HUB_MARKER)) throw new Error(`run apply-hub-patch.mjs first (missing ${HUB_MARKER})`);
  const found = count(src, ALERT_START_ANCHOR);
  if (found !== 1) throw new Error(`anchor check failed, nothing changed: generic-alert-start (found ${found}x)`);
  return { status: "patched", text: src.replace(ALERT_START_ANCHOR, ALERT_START_REPLACEMENT) };
}

export function applyAlertStartPatch(releaseDir, { now = new Date() } = {}) {
  const file = path.join(releaseDir, SERVICE);
  if (!existsSync(file)) throw new Error(`not a bot-community release (missing ${file})`);
  const plan = patchAlertStartText(readFileSync(file, "utf8"));
  let backup = null;
  if (plan.status === "patched") {
    const stamp = now.toISOString().replace(/[:.]/g, "-");
    backup = `${file}.bak-${stamp}`;
    copyFileSync(file, backup);
    writeFileSync(file, plan.text);
  }
  return { file, status: plan.status, backup };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (!process.argv[2]) throw new Error("usage: node apply-alert-start-patch.mjs <releaseDir>");
    console.log(JSON.stringify(applyAlertStartPatch(path.resolve(process.argv[2])), null, 2));
  } catch (error) { console.error(`apply-alert-start-patch: ${error.message}`); process.exitCode = 1; }
}
