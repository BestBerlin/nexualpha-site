// Quality sweep (2026-10-11, scorecard V3 / V4 / V5): pins the fixes the browser sweeps found and the sweep scripts
// themselves. Browser evidence comes from scripts/qa-axe-sweep.py (axe-core + keyboard focus walk) and
// scripts/qa-reduced-motion.py; this file keeps the CSS / source contracts from regressing between sweeps.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { formatCountdown } from "../src/data/market-data-pages.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(path.join(projectRoot, file), "utf8");

// WCAG relative luminance contrast of two #rrggbb colours.
function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test("V4 contrast fixes: offer button keeps on-accent ink, muted notes and summary hints stay >= 4.5:1", async () => {
  const offer = await read("src/components/v3/news/news-venue-offer.css");
  assert.match(offer, /\.news-offer \.news-offer__go(:not\(#_\)){4}, \.news-offer \.news-offer__go:hover(:not\(#_\)){4} \{ color: #04130F; \}/,
    "the offer button outranks the v6 inner-page link colour (was ink on accent, 1.44:1, on /liquidations and /funding-rates)");
  assert.ok(contrast("#04130F", "#1FE0C0") >= 4.5);

  const telegram = await read("src/components/v3/telegram-bot-hub.css");
  // The hero data note was removed (owner rule 2026-10-12: no caveat fine print under page blocks).
  assert.doesNotMatch(telegram, /\.tg-signal-hero__note\b/);
  assert.match(telegram, /\.tg-signal-sample__label small \{[^}]*color: #9097a0;/);
  assert.ok(!/\.tg-signal-sample__label small \{[^}]*#6b7280/.test(telegram), "#6b7280 on the canvas is 4.14:1");
  assert.ok(contrast("#9097A0", "#07080A") >= 4.5);

  const system = await read("src/styles/v6/system.css");
  const summaryRule = system.split("\n").find((line) => line.includes("details > summary > :is(small, span + span):not(#_):not(#_) {"));
  assert.ok(summaryRule, "summary hint rule present");
  assert.ok(!/opacity:\s*0?\.72/.test(summaryRule), "summary hints no longer fade ink-3 with opacity .72 (3.6:1 on /rates and /telegram)");
  assert.match(summaryRule, /color: var\(--ink-3, #9097a0\)/);
});

test("V4 focus: the home calculator input shows a 2px accent underline on focus; inputs that drop the outline restyle a ring", async () => {
  const src = await read("src/styles/v7/home7.src.css");
  assert.match(src, /@ \.h7-vin:focus-within\{border-color:var\(--ac\);box-shadow:0 1px 0 var\(--ac\)\}/);
  const built = await read("src/styles/v7/home7.css");
  assert.ok(built.includes(".h7-vin:focus-within{border-color:var(--ac);box-shadow:0 1px 0 var(--ac)}"), "home7.css regenerated (node scripts/build-home7-css.mjs)");
  // The inputs that remove their outline must restyle a visible indicator in the same rule.
  for (const [file, pattern] of [
    ["src/styles/v6/pages-rates.css", /\.rt-field__box input:focus \{[^}]*box-shadow: 0 0 0 3px[^}]*outline: none;/],
    ["src/styles/r1-content.css", /\.news-index-search > input:focus \{ outline: none; border-color: [^;]+; box-shadow: 0 0 0 4px/],
  ]) assert.match(await read(file), pattern, file);
});

test("V5 reduced motion: global duration clamp and per-minute countdowns", async () => {
  const tokens = await read("src/styles/tokens.css");
  const clamp = tokens.match(/@media\(prefers-reduced-motion:reduce\)\{\*,\*::before,\*::after\{animation-duration:(\d+)ms!important;transition-duration:(\d+)ms!important;scroll-behavior:auto!important\}\}/);
  assert.ok(clamp, "global reduced-motion clamp present in tokens.css");
  assert.ok(Number(clamp[1]) <= 10 && Number(clamp[2]) <= 10, "animations and transitions <= 0.01 s under reduce");
  assert.ok(tokens.includes("@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-iteration-count:1!important}}"));

  const hook = await read("src/components/data/useMarketEvents.js");
  assert.match(hook, /const delay = intervalMs \?\? \(prefersReducedMotion\(\) \? 60 \* 1000 : 1000\)/,
    "funding countdown clock ticks once a minute under reduce (was a per-second ticker)");
  assert.match(hook, /setInterval\(tick, delay\)/);
  assert.match(hook, /if \(doc\?\.visibilityState === "hidden"\) return/);
  const funding = await read("src/components/data/FundingRatesPage.jsx");
  assert.match(funding, /formatCountdown\(remaining, \{ seconds: !prefersReducedMotion\(\) \}\)/);
  const home = await read("src/components/v7/home7-funding.jsx");
  assert.match(home, /const now = useClientNow\(\)/, "home countdown reuses the tested reduced-motion and hidden-tab clock");
  assert.match(home, /countdown\(now === null \? null : Date\.parse\(r\.nextAt\) - now, showSeconds\)/);

  assert.match(home, /useEffect\(\(\) => \{ setShowSeconds\(!reduced\(\)\); \}, \[\]\)/, "motion preference is read after hydration");

  // Explicit unavailable snapshots keep their status visible; absent data still hides and no placeholder table is fabricated.
  assert.match(home, /if \(!feed \|\| \(!selectedSymbol && feed\.status !== "unavailable"\)\) return null;/);
  assert.match(home, /rows\.length > 0 &&/);
  assert.match(home, /availableSymbols\.map\(\(s\) => <button/);
  assert.doesNotMatch(home, /FUNDING_VENUES\.map/);
  assert.doesNotMatch(home, /h7-fr-row--wait|aria-busy/);

  assert.equal(formatCountdown(3 * 3600e3 + 7 * 60e3 + 9e3), "03:07:09");
  assert.equal(formatCountdown(3 * 3600e3 + 7 * 60e3 + 9e3, { seconds: false }), "03:07");
  assert.equal(formatCountdown(0, { seconds: false }), "00:00");
});

test("V3 data rule: section rules on venue, compare, activities and data pages; numbered by CSS counter", async () => {
  const css = await read("src/styles/v8/site-signature.css");
  assert.match(css, /body \{ counter-reset: nx-section; \}/);
  assert.match(css, /\.nx-rule\.nx-rule--section(:not\(#_\)){10} \{ counter-increment: nx-section;/);
  assert.match(css, /\.nx-rule__index(:not\(#_\)){10}::before \{ content: counter\(nx-section, decimal-leading-zero\); display: inline; \}/);
  const uses = {
    "src/components/v3/VenueDetailPage.jsx": 3,
    "src/components/v3/ExchangeFactsV5.jsx": 1,
    "src/components/v3/VenueFaqSection.jsx": 1,
    "src/components/v3/V3Pages.jsx": 2,
    "src/components/v3/CompareFinalChoiceCard.jsx": 1,
    "src/components/v3/activity/LiveCampaigns.jsx": 1,
    "src/components/v3/activity/ActivityCenterV3.jsx": 1,
    "src/components/data/LiquidationsPage.jsx": 2,
    "src/components/data/LiquidationHistory.jsx": 2,
    "src/components/data/FundingRatesPage.jsx": 1,
    "src/components/data/DataPageFrame.jsx": 2,
  };
  for (const [file, count] of Object.entries(uses)) {
    const src = await read(file);
    assert.match(src, /import \{[^}]*SectionRule[^}]*\} from "[./]+\/shared\/DataRule\.jsx";/, `${file} imports SectionRule`);
    assert.equal((src.match(/<SectionRule\b/g) || []).length, count, `${file} renders ${count} section rule(s)`);
  }
  const home = await read("src/components/v7/HomeV7.jsx");
  assert.ok(!home.includes("SectionRule"), "not on the home hero");
});

test("V3 SectionRule markup: decorative, label from the counter, SGT stamp drops its date on phones", async () => {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-quality-sweep-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { SectionRule, UtcRuleStamp } from "../../src/components/shared/DataRule.jsx";
      console.log(JSON.stringify({
        plain: renderToStaticMarkup(React.createElement(SectionRule)),
        count: renderToStaticMarkup(React.createElement(SectionRule, { stamp: 5 })),
        utc: renderToStaticMarkup(React.createElement(SectionRule, { stamp: React.createElement(UtcRuleStamp, { iso: "2026-10-11T09:08:31Z" }), dateTime: "2026-10-11T09:08:31Z" })),
      }));
    `);
    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [entryPath, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundlePath}`, "--loader:.css=empty", "--log-level=warning"], { cwd: projectRoot, stdio: "pipe" });
    const out = JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8" }));
    assert.equal(out.plain, '<div class="nx-rule nx-rule--section" aria-hidden="true"><span class="nx-rule__label nx-rule__index"></span><span class="nx-rule__line"></span></div>');
    assert.match(out.count, /<span class="nx-rule__stamp">5<\/span><\/div>$/);
    assert.match(out.utc, /<time class="nx-rule__stamp" dateTime="2026-10-11T09:08:31Z"><span class="nx-rule__date">2026-10-11 · <\/span>17:08 SGT<\/time>/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("sweep scripts: axe + focus walk and reduced-motion sweep cover every template and parse", async () => {
  const templates = await read("scripts/qa_templates.py");
  for (const p of ["/", "/exchanges", "/exchanges/okx", "/exchanges/hyperliquid", "/compare", "/compare/binance-vs-okx", "/activities",
    "/liquidations", "/funding-rates", "/rates", "/news", "/news/{article}", "/topics", "/factbook", "/factbook/okx", "/about",
    "/methodology", "/telegram"]) assert.ok(templates.includes(`"${p}")`), `template ${p}`);
  assert.ok(templates.includes('"ar": "/ar"') && templates.includes('"id": "/id-id"'));
  const axe = await read("scripts/qa-axe-sweep.py");
  assert.ok(axe.includes("'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'") && axe.includes('keyboard.press("Tab")'));
  const motion = await read("scripts/qa-reduced-motion.py");
  assert.ok(motion.includes("document.getAnimations()") && motion.includes("requestAnimationFrame") && motion.includes('reduced_motion=args.motion'));
  try {
    execFileSync("python3", ["-c", "import ast,sys\nfor f in sys.argv[1:]: ast.parse(open(f).read(), f)", "scripts/qa-axe-sweep.py", "scripts/qa-reduced-motion.py", "scripts/qa_templates.py", "scripts/qa-browser-sweep.py"], { cwd: projectRoot, stdio: "pipe" });
  } catch (error) {
    if (error.code === "ENOENT") return; // no python3 on this host: the source checks above still ran
    throw error;
  }
});
