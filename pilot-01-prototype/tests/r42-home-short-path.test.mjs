import { createSsrHarness } from './helpers/ssr-hydration-harness.mjs';
import { JSDOM } from 'jsdom';
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

async function renderLeanHero({ locale = "en", search = "" } = {}) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-r42-home-short-path-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { LeanHero } from "../../src/components/v3/LeanHero.jsx";

      globalThis.window = { location: { search: ${JSON.stringify(search)} } };
      const html = renderToStaticMarkup(React.createElement(LeanHero, { locale: ${JSON.stringify(locale)} }));
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

    return execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function firstIndex(html, needle, context) {
  const index = html.indexOf(needle);
  assert.ok(index >= 0, `${context}: missing ${needle}`);
  return index;
}

test("home hero presents two short paths before supporting research", async () => {
  const html = await renderLeanHero({ locale: "en" });
  const context = "home/en";

  // Class b: PR #78/#79 enabled the hx home hero experiment and replaced the lean hero class names.
  const title = firstIndex(html, 'class="hx__title enter"', context);
  const decision = firstIndex(html, 'class="hx-intent"', context);
  const direct = firstIndex(html, 'data-growth-decision="known_platform"', context);
  const compare = firstIndex(html, 'data-growth-decision="compare_first"', context);
  const selectedRoute = firstIndex(html, 'class="hx-route"', context);
  const registrationCard = firstIndex(html, 'class="registration-card registration-card--compact"', context);
  const supporting = firstIndex(html, 'class="hx-matrix"', context);

  assert.ok(title < decision, `${context}: heading should lead into the decision card`);
  assert.ok(direct < selectedRoute, `${context}: direct path should appear before the selected platform route`);
  assert.ok(compare < selectedRoute, `${context}: compare path should appear before the selected platform route`);
  assert.ok(selectedRoute < registrationCard, `${context}: selected platform identity should introduce the protected registration card`);
  assert.ok(registrationCard < supporting, `${context}: protected registration handoff should appear before supporting research links`);
  assert.match(html, /I’ve chosen/);
  const compareButton = html.match(/<button\b[^>]*data-growth-decision="compare_first"[^>]*>([\s\S]*?)<\/button>/)?.[1];
  assert.ok(compareButton, "approved compare path remains a real button");
  assert.match(compareButton, /Compare first/, "R163 approved short action stays in its own button");
  assert.equal((html.match(/data-growth-decision="known_platform"/g) || []).length, 1);
  assert.equal((html.match(/data-growth-decision="compare_first"/g) || []).length, 1);
});

test("home selected-platform CTA uses RegistrationCard protected referral route", async () => {
  const html = await renderLeanHero({ locale: "en" });
  const context = "home/en/registration";

  assert.match(html, /data-cta-placement="registration-card-primary"/, `${context}: home CTA should use RegistrationCard placement`);
  // Class b: 84b6426 made the official binance.com route the preserved Binance path.
  assert.match(html, /href="\/go\/binance\?src=registration-card-primary[^\"]*"/, `${context}: Binance protected referral URL should be preserved`);
  assert.match(html, /data-cta-code="11350287"/, `${context}: code-confirmation copy should be visible before handoff`);
  assert.match(html, /data-r37-cro="home-partner-route-nudge"/, `${context}: legacy home CTA telemetry marker should remain for continuity`);
});

test("home registration card carries decision passport context from query params", async () => {
  const html = await renderLeanHero({
    locale: "en",
    search: "?market=HK&product=spot&account_stage=new_account&funding=HKD%20bank%20transfer",
  });
  const context = "home/en/passport";

  assert.match(html, /data-decision-passport="HK"/, `${context}: homepage should pass market into the decision passport`);
  assert.match(html, /New account|First account|new account/i, `${context}: homepage should pass account stage into the decision passport`);
  assert.match(html, /HKD bank transfer/, `${context}: homepage should pass funding into the decision passport`);
  assert.match(html, /account_stage=new_account/, `${context}: onsite verification path should carry account stage`);
  assert.match(html, /funding=HKD(?:%20|\+)bank(?:%20|\+)transfer/, `${context}: onsite verification path should carry funding`);
  assert.match(html, /data-registration-decision-state="blocked"/, `${context}: unverified regional route should stay onsite`);
});


test("home hero layout uses natural full-width rows and four desktop platform options", async () => {
  const heroCss = await readFile(path.join(projectRoot, "src/components/v3/lean-hero.css"), "utf8");
  const growthCss = await readFile(path.join(projectRoot, "src/components/v3/growth-conversion.css"), "utf8");
  const container = heroCss.match(/\.lean-hero__container\s*\{([^}]+)\}/)?.[1] || "";
  assert.match(container, /grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(growthCss, /\.lean-hero__container\s*\{[^}]*grid-template-rows:\s*auto/);
  for (const section of ["content", "telemetry", "secondary"]) {
    const block = growthCss.match(new RegExp(`\\.lean-hero__${section}\\s*\\{([^}]+)\\}`))?.[1] || "";
    assert.match(block, /grid-column:\s*1 \/ -1/);
    assert.match(block, /grid-row:\s*auto/);
  }
  assert.doesNotMatch(growthCss, /grid-row:\s*1 \/ span 2/);
  assert.match(growthCss, /@media \(min-width: 1025px\)\s*\{\s*\.growth-platform-list\s*\{\s*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(container, /(?:^|;)\s*(?:height|max-height):/);
});

test("localized home rows preserve heading-first order and a sole protected referral CTA", async () => {
  for (const locale of ["ja", "ko", "tr"]) {
    const html = await renderLeanHero({ locale });
    // Class b: PR #78/#79 enabled the hx home hero experiment across locales.
    const title = firstIndex(html, 'class="hx__title enter"', locale);
    const decision = firstIndex(html, 'class="hx-intent"', locale);
    const supporting = firstIndex(html, 'class="hx-matrix"', locale);
    assert.ok(title < decision && decision < supporting);
    assert.equal((html.match(/data-cta-placement="registration-card-primary"/g) || []).length, 1);
    assert.match(html, /11350287/);
    assert.match(html, /href="\/go\/binance\?src=registration-card-primary[^\"]*"/);
  }
});

test('current Arabic homepage uses the neutral HomeV7 path with research choices and no registration', async () => {
  const harness = await createSsrHarness();
  let html;
  try { html = await harness.render('https://nexualpha.com/ar'); } finally { await harness.close(); }
  const dom = new JSDOM(html);
  const hero = dom.window.document.querySelector('.h7-hero[data-neutral]');
  assert.ok(hero, 'current authoritative homepage applies neutral-edition policy');
  assert.equal(hero.querySelectorAll('.nh-actions a').length, 2);
  assert.doesNotMatch(hero.outerHTML, /\/go\/|data-cta-kind="registration"|11350287|nexu888/);
  dom.window.close();
});
