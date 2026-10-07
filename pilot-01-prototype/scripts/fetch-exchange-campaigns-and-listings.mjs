#!/usr/bin/env node
/**
 * Build-time official activity materializer.
 *
 * No official API/feed adapter is currently configured for this build step.
 * The old implementation refreshed hard-coded examples with the current time
 * and marked them APPROVED. That made fixtures look like live official events.
 * Until a source-backed adapter is installed, the only truthful build output
 * is an explicit empty feed.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const outputPath = path.join(rootDir, "src/data/generated-official-activities.js");

export function renderUnavailableActivityModule() {
  return `/**
 * generated-official-activities.js
 * Generated fail-closed: no official activity feed adapter is configured.
 */

export const GENERATED_AT = null;
export const GENERATION_STATUS = "UNAVAILABLE_NO_OFFICIAL_FEED";
export const OFFICIAL_EXCHANGE_ACTIVITIES = [];

export default OFFICIAL_EXCHANGE_ACTIVITIES;
`;
}

export async function generateActivities() {
  fs.writeFileSync(outputPath, renderUnavailableActivityModule(), "utf8");
  process.stdout.write("[NexuAlpha] Official activity feed unavailable; emitted an empty fail-closed dataset.\n");
  return { status: "UNAVAILABLE_NO_OFFICIAL_FEED", count: 0, outputPath };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await generateActivities();
}
