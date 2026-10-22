import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { supportedLocales } from "../src/content/locale-manifest.ts";
import { createSsrHarness } from "./helpers/ssr-hydration-harness.mjs";
import { h7NeutralCopy } from "../src/components/v7/home7-neutral-copy.js";
import { HERO_VOLUME_STEPS, HERO_VOLUME_DEFAULT_STEP, heroSayText, heroVolumeText } from "../src/components/v7/home7-hero-volume.js";
import { HOME_AUTO_SETTLE, homePushFor } from "../src/data/home-rebate-tiers.js";
import { isNeutralCtaLocale } from "../src/data/locale-policy.js";
import { publicCtaForVenue } from "../src/data/source-bound-cta.js";

let harness;
test.before(async () => { harness = await createSsrHarness(); });
async function renderHome(locale) { return harness.render(`/?locale=${encodeURIComponent(locale)}`); }

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'");
}

function textFromHtml(value) {
  return decodeHtml(value.replace(/<br\s*\/?\s*>/gi, " ").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim());
}

test.after(async () => {
  await harness?.close();
});

test("SSR homepage renders one visible localized H1 per supported locale", async () => {
  const seenHeadings = new Set();

  for (const locale of supportedLocales) {
    const html = await renderHome(locale);
    const h1Matches = [...html.matchAll(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/g)];

    assert.equal(h1Matches.length, 1, `${locale}: one SSR h1`);
    const [fullMatch, attributes, body] = h1Matches[0];
    if (!isNeutralCtaLocale(locale)) assert.match(attributes, /class="hx-say"/, `${locale}: visible volume hero class`);
    assert.doesNotMatch(fullMatch, /\b(?:hidden|aria-hidden="true"|display:\s*none|visibility:\s*hidden)\b/i, `${locale}: homepage h1 is visible markup`);

    const heading = textFromHtml(body);
    const slug = homePushFor(locale)[0];
    const expected = isNeutralCtaLocale(locale)
      ? `${h7NeutralCopy(locale).h1a} ${h7NeutralCopy(locale).h1b}`
      : heroSayText(locale, { vol: heroVolumeText(HERO_VOLUME_STEPS[HERO_VOLUME_DEFAULT_STEP], locale), venue: publicCtaForVenue(slug, locale).name, auto: HOME_AUTO_SETTLE.includes(slug) });
    assert.equal(heading, expected.replace(/\s+/g, " ").trim(), `${locale}: SSR h1 uses current shared localized copy`);
    assert.ok(!seenHeadings.has(heading), `${locale}: h1 text is unique`);
    seenHeadings.add(heading);
  }

  assert.equal(seenHeadings.size, supportedLocales.length);
});

test("SSR homepage preserves the registry-backed Binance signup route after the hero redesign", async () => {
  const dom = new JSDOM(await renderHome("en"));
  try {
    const links = [...dom.window.document.querySelectorAll('.h7 a[data-cta-platform="binance"][data-cta-kind="registration"]')];
    const cta = publicCtaForVenue("binance", "en");
    assert.ok(links.length > 0, "Binance remains available below the primary hero");
    for (const link of links) {
      const href = new URL(link.getAttribute("href"), "https://nexualpha.com");
      assert.equal(href.pathname, "/go/binance", "signup uses the tracked handoff");
      assert.ok(href.searchParams.get("src"), "handoff retains placement attribution");
      assert.equal(link.getAttribute("data-cta-code"), cta.inviteCode);
      assert.ok(link.rel.split(/\s+/).includes("sponsored"));
    }
  } finally { dom.window.close(); }
});
