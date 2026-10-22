import { committedFileHash } from './r100-test-contracts.mjs';
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import reactPlugin from "@vitejs/plugin-react";
import React from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const leanHeroPath = path.join(projectRoot, "src/components/v3/LeanHero.jsx");
const registryPath = path.join(projectRoot, "src/data/partner-registry.js");
const expectedPartnerRegistrySha =
  committedFileHash('src/data/partner-registry.js');

test("R119 LeanHero keeps partner registry immutable", async () => {
  const registry = await readFile(registryPath);
  assert.equal(createHash("sha256").update(registry).digest("hex"), expectedPartnerRegistrySha);
});

test("R119 LeanHero defaults to direct signup intent during SSR", async () => {
  const vite = await createServer({
    root: projectRoot,
    appType: "custom",
    logLevel: "silent",
    plugins: [reactPlugin(), {
      name: "r119-empty-css-for-ssr-test",
      enforce: "pre",
      resolveId(id) {
        return id.endsWith(".css") ? `\0r119-empty-css-${Buffer.from(id).toString("base64url")}` : null;
      },
      load(id) {
        return id.startsWith("\0r119-empty-css-") ? "export default {};" : null;
      },
    }],
  });
  try {
    const [{ LeanHero }, { publicCtaForVenue }] = await Promise.all([
      vite.ssrLoadModule("/src/components/v3/LeanHero.jsx"),
      vite.ssrLoadModule("/src/data/source-bound-cta.js"),
    ]);
    const html = renderToString(React.createElement(LeanHero, { locale: "en" }));

    assert.match(html, /data-growth-decision="known_platform"/);
    assert.match(html, /data-growth-decision="compare_first"/);
    assert.match(html, /aria-pressed="true"[^>]*data-growth-decision="known_platform"/);
    assert.match(html, /aria-pressed="false"[^>]*data-growth-decision="compare_first"/);
    assert.match(html, /class="hx-route"/);
    assert.match(html, /data-cta-placement="home-decision-panel"/);
    assert.doesNotMatch(html, /class="hx-compare__list"/);
    assert.equal(publicCtaForVenue("bitget", "en").registrationUrl, "https://partner.bitget.com/bg/C6PRAF");
  } finally {
    await vite.close();
  }
});

test("R119 LeanHero source uses mutually exclusive panels without details toggle loops", async () => {
  const source = await readFile(leanHeroPath, "utf8");

  assert.doesNotMatch(source, /<details\s+className="growth-compare-shortcuts"/);
  assert.doesNotMatch(source.slice(source.indexOf("function HomeDecisionPanel"), source.indexOf("export function LeanHero")), /onToggle=\{/);
  assert.match(source, /activeIntent === "compare" \? \(/);
  assert.match(source, /<section className="hx-compare"/);
  assert.match(source, /: \(\s*<div className="hx-route"/);
  assert.match(source, /setActiveIntent\("direct"\)/);
  assert.match(source, /setActiveIntent\("compare"\)/);
});
