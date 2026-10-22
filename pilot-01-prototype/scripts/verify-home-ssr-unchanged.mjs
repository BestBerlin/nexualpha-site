#!/usr/bin/env node
// Compare built React SSR roots or actual build-time prerender roots, before outer-shell asset URLs are added.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const baseline = process.argv[2];
if (!baseline) throw new Error("Usage: node scripts/verify-home-ssr-unchanged.mjs <baseline-directory> [--capture] [--prerender]");
const prerender = process.argv.includes("--prerender");
const { render } = prerender ? {} : await import(pathToFileURL(path.resolve("dist/ssr/entry-server.js")));
Date.now = () => Date.UTC(2026, 9, 23);
const capture = process.argv.includes("--capture");
if (capture) await mkdir(baseline, { recursive: true });
const results = [];
for (const route of ["/", "/zh-hans", "/tr", "/ar"]) {
  const name = route === "/" ? "en" : prerender && route === "/zh-hans" ? "zh-Hans" : route.slice(1);
  const html = prerender ? JSON.parse(await readFile(`dist/client/prerender/${name}/home.json`, "utf8")).html : render(route);
  const file = path.join(baseline, `${name}.html`);
  if (capture) await writeFile(file, html);
  const previous = capture ? html : await readFile(file, "utf8");
  // Build-time prerenders carry the real build clock. Permit exactly this attribute, never text/link changes.
  const stable = (value) => prerender ? value.replace(/data-rendered-at="[^"]+"/g, 'data-rendered-at="T"') : value;
  assert.equal(stable(html), stable(previous), `${route}: SSR content changed`);
  results.push({
    route, bytes: Buffer.byteLength(html), sha256: createHash("sha256").update(html).digest("hex"),
    byteIdentical: capture ? undefined : html === previous,
    attributeDiff: !capture && prerender ? {
      attribute: "data-rendered-at",
      before: [...previous.matchAll(/data-rendered-at="([^"]+)"/g)].map((match) => match[1]),
      after: [...html.matchAll(/data-rendered-at="([^"]+)"/g)].map((match) => match[1]),
    } : undefined,
  });
}
console.log(JSON.stringify({ capture, prerender, results }, null, 2));
