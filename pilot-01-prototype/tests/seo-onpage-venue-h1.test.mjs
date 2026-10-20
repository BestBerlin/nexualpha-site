import { strikingDistanceVenueH1 } from '../src/data/striking-distance-venue-copy.js';
// The exchange profile H1 carries the search intent under the same
// referral-title policy as the <title>, stays a single H1, keeps the data-bound invite code and the fees-checked chip.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { nativeReferralFor } from "../src/data/referral-native.js";
import { referralSeoFor, referralTitleAllowed } from "../src/data/referral-seo.js";
import { CUSTOM_INVITE_CODES } from "../src/data/partner-registry.js";
import { priorityVenueAnswerFor } from "../src/data/priority-venue-answers.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"];
const slugs = ["okx", "bitget", "binance", "uniswap"];
const decode = (value) => value.replaceAll("&amp;", "&").replaceAll("&#x27;", "'").replaceAll("&quot;", '"');
const textOf = (html) => decode(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

async function renderHeroes() {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-seo-onpage-h1-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { VenueDetailPage } from "../../src/components/v3/VenueDetailPageStatic.jsx";
      import { venueDatabase } from "../../src/data/venue-database.js";
      const pageCopy = { common: { dimension: "Dimension" }, assetCapabilities: { none: "Pending source review" } };
      const venues = Object.values(venueDatabase);
      const pages = [];
      for (const locale of ${JSON.stringify(locales)}) {
        for (const slug of ${JSON.stringify(slugs)}) {
          const html = renderToStaticMarkup(React.createElement(VenueDetailPage, { copy: pageCopy, locale, venue: venueDatabase[slug], venues, updates: [], market: "unknown", product: "unknown" }));
          pages.push({ locale, slug, html });
        }
      }
      console.log(JSON.stringify(pages));
    `);
    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [entryPath, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundlePath}`, "--loader:.css=empty", "--log-level=warning"], { cwd: projectRoot, stdio: "pipe" });
    return JSON.parse(execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("exchange H1 carries the exact referral code where allowed, neutral profile elsewhere, and no year", async () => {
  const pages = await renderHeroes();
  assert.equal(pages.length, locales.length * slugs.length);
  for (const { locale, slug, html } of pages) {
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
    assert.equal(h1s.length, 1, `${slug}/${locale}: exactly one H1`);
    const h1 = textOf(h1s[0][1]);
    const code = CUSTOM_INVITE_CODES[slug];
    const native = nativeReferralFor(slug, locale);
    if (native?.title) {
      assert.equal(h1, strikingDistanceVenueH1(slug, locale, code) || native.title, `${slug}/${locale}: native referral H1`);
    } else if (priorityVenueAnswerFor(slug, locale)) {
      // owner-reviewed priority answers keep their question as the H1 (tests/week3-owner-intent-contract.test.mjs)
      assert.equal(h1, priorityVenueAnswerFor(slug, locale).ownerQuestion, `${slug}/${locale}: owner question H1`);
      continue;
    }
    const referral = Boolean(code) && referralTitleAllowed(slug, locale) && referralSeoFor(slug, locale) !== null;
    assert.doesNotMatch(h1, /independent profile|独立研究|獨立研究|bağımsız profili|Независимый профиль/i, `${slug}/${locale}: old H1 wording`);
    if (referral) {
      assert.ok(h1.includes(code), `${slug}/${locale}: H1 "${h1}" must carry the data-bound invite code ${code}`);
      assert.doesNotMatch(h1, /20\d{2}/, `${slug}/${locale}: referral H1 must not mix the code with a year`);
    } else {
      assert.ok(!/nexu888|11350287|48553/.test(h1), `${slug}/${locale}: neutral H1 "${h1}" must not promote a code`);
    }
    // the H1 never changes an invite code: the code shown anywhere on the page is the registry code
    const shownCodes = [...html.matchAll(/<code[^>]*>([^<]+)<\/code>/g)].map((m) => decode(m[1]).trim()).filter((v) => /^[A-Za-z0-9_]+$/.test(v));
    for (const shown of shownCodes) if (code && shown.toLowerCase() === code.toLowerCase()) assert.equal(shown, code, `${slug}/${locale}: code casing`);
    assert.match(html, /v3-trust-metal-badge/, `${slug}/${locale}: fees-checked chip stays in the hero`);
  }
  const en = pages.find((p) => p.locale === "en" && p.slug === "okx");
  assert.equal(textOf(en.html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1]), strikingDistanceVenueH1("okx", "en", CUSTOM_INVITE_CODES.okx));
  const tr = pages.find((p) => p.locale === "tr" && p.slug === "okx");
  assert.equal(textOf(tr.html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1]), nativeReferralFor("okx", "tr").title);
  const trBitget = pages.find((p) => p.locale === "tr" && p.slug === "bitget");
  assert.match(textOf(trBitget.html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1]), /^Bitget ücretleri ve platform profili$/, "tr only promotes SPK-listed venues");
  const ru = pages.find((p) => p.locale === "ru" && p.slug === "okx");
  assert.match(textOf(ru.html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1]), /^Комиссии OKX и профиль платформы$/);
});

test("Turkish rebate shares render with the percent sign first", async () => {
  const pages = await renderHeroes();
  const tr = pages.find((p) => p.locale === "tr" && p.slug === "okx");
  assert.doesNotMatch(tr.html, /(?<![\d.])40%/, "tr page must not render the 40% rebate share as 40%");
  assert.match(tr.html, /%40/, "tr page renders %40");
  const en = pages.find((p) => p.locale === "en" && p.slug === "okx");
  assert.match(en.html, /40%/, "en keeps 40%");
});
