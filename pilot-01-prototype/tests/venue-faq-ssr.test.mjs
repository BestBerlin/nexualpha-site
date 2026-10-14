import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

async function renderVenueFaq(slug, locale) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-venue-faq-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { VenueFaqSection } from "../../src/components/v3/VenueFaqSection.jsx";
      import { venueDatabase } from "../../src/data/venue-database.js";
      import { partnerRegistry } from "../../src/data/partner-registry.js";
      import { venueProfile } from "../../src/data/v3-product.js";

      const slug = ${JSON.stringify(slug)};
      const locale = ${JSON.stringify(locale)};
      const profile = venueProfile(slug);
      const venue = { ...profile, slug, name: profile?.name || venueDatabase[slug]?.name, category: profile?.category || venueDatabase[slug]?.category || "CEX" };
      const html = renderToStaticMarkup(React.createElement(VenueFaqSection, {
        venue,
        profile: venue,
        locale,
        db: venueDatabase[slug],
        partner: partnerRegistry[slug] || {},
      }));
      console.log(html);
    `);

    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);

    execFileSync(esbuildBin, [
      entryPath,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundlePath}`,
      "--loader:.css=empty",
      "--log-level=warning",
    ], { cwd: projectRoot, stdio: "pipe" });

    return execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8" });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("Japanese Bitget venue FAQ renders actual venue questions instead of comparison placeholders", async () => {
  const html = await renderVenueFaq("bitget", "ja");
  assert.match(html, /Bitget/);
  assert.match(html, /Bitget の手数料・準備金・安全性 FAQ/);
  assert.doesNotMatch(html, /Platform A|Platform B/);
  assert.doesNotMatch(html, /どちらの手数料が低い|初心者.*Platform A/);
});

test("English OKX venue FAQ uses public facts without Chinese punctuation or generic boilerplate", async () => {
  const html = await renderVenueFaq("okx", "en");
  assert.match(html, /OKX/);
  assert.match(html, /www\.okx\.com/);
  assert.doesNotMatch(html, /。|：/);
  assert.doesNotMatch(html, /Independent research scope|Must verify before registration|research independently|verify before signing up|DYOR/i);
  assert.match(html, /Official domain|www\.okx\.com|Spot fee/i);
});

test("Chinese OKX fallback FAQ uses recorded facts instead of generic verify boilerplate", async () => {
  const html = await renderVenueFaq("okx", "zh-Hans");
  assert.match(html, /www\.okx\.com/);
  assert.doesNotMatch(html, /当前记录的现货费率|当前记录的 KYC/);
  assert.doesNotMatch(html, /最终费率、产品范围和资格条件以平台当前官方页面为准|认证材料、处理时间、产品范围和法币渠道会因地区与账户等级变化/);
});
