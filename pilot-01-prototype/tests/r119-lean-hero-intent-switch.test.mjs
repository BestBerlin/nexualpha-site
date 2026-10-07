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
  "8bc700d18c11100ba7f0d35b77767f0cea2c735390d666c1240ac6ea1ec3818a";

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
    assert.match(html, /class="growth-platform-search"/);
    assert.match(html, /data-cta-placement="home-decision-panel"/);
    assert.doesNotMatch(html, /class="growth-compare-shortcuts__links"/);
    assert.equal(publicCtaForVenue("bitget", "en").registrationUrl, "https://partner.bitget.cafe/bg/C6PRAF");
  } finally {
    await vite.close();
  }
});

test("R119 LeanHero source uses mutually exclusive panels without details toggle loops", async () => {
  const source = await readFile(leanHeroPath, "utf8");

  assert.doesNotMatch(source, /<details\s+className="growth-compare-shortcuts"/);
  assert.doesNotMatch(source.slice(source.indexOf("function HomeDecisionPanel"), source.indexOf("export function LeanHero")), /onToggle=\{/);
  assert.match(source, /activeIntent === "compare" \? \(/);
  assert.match(source, /<section className="growth-compare-shortcuts"/);
  assert.match(source, /: \(\s*<>\s*<label className="growth-platform-search"/);
  assert.match(source, /setActiveIntent\("direct"\)/);
  assert.match(source, /setActiveIntent\("compare"\)/);
});
