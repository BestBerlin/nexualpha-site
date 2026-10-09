import assert from "node:assert/strict";
import test from "node:test";
import { createServer as createViteServer } from "vite";
import { homeHeroH1 } from "../src/content/home-copy.js";
import { supportedLocales } from "../src/content/locale-manifest.ts";

let vite;

async function renderHome(locale) {
  if (!vite) {
    vite = await createViteServer({
      appType: "custom",
      logLevel: "error",
      server: { middlewareMode: true },
    });
  }
  const { render } = await vite.ssrLoadModule("/src/entry-server.jsx");
  return render(`/?locale=${encodeURIComponent(locale)}`);
}

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
  return decodeHtml(value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim());
}

test.after(async () => {
  await vite?.close();
});

test("SSR homepage renders one visible localized H1 per supported locale", async () => {
  const seenHeadings = new Set();

  for (const locale of supportedLocales) {
    const html = await renderHome(locale);
    const h1Matches = [...html.matchAll(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/g)];

    assert.equal(h1Matches.length, 1, `${locale}: one SSR h1`);
    const [fullMatch, attributes, body] = h1Matches[0];
    assert.match(attributes, /class="(?:rf-title(?: rf-title--\w+)?|lean-hero__title)"/, `${locale}: homepage h1 keeps visible hero class`); // v6 hero: .rf-title
    assert.doesNotMatch(fullMatch, /\b(?:hidden|aria-hidden="true"|display:\s*none|visibility:\s*hidden)\b/i, `${locale}: homepage h1 is visible markup`);

    const heading = textFromHtml(body);
    assert.equal(heading, homeHeroH1(locale), `${locale}: SSR h1 uses shared localized copy`);
    assert.ok(!seenHeadings.has(heading), `${locale}: h1 text is unique`);
    seenHeadings.add(heading);
  }

  assert.equal(seenHeadings.size, supportedLocales.length);
});

test("SSR homepage renders the R37 partner-route next step without losing the protected Binance route", async () => {
  const html = await renderHome("en");

  assert.match(html, /data-r37-cro="home-partner-route-nudge"/);
  assert.match(html, /data-r37-platform="binance"/);
  assert.match(html, /data-r37-has-code="true"/);
  assert.match(html, /confirm referral code 11350287/i);
  assert.match(html, /Open route and confirm code/);
  assert.match(html, /href="https:\/\/www\.bsmkweb\.cc\/join\?ref=11350287&amp;utm_medium=web_share_copy"/);
  assert.match(html, /data-cta-placement="home-decision-panel"/);
});
