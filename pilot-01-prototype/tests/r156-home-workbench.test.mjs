import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { buildSync } from "esbuild";

const req = createRequire(import.meta.url);
const React = req("react");
const { renderToStaticMarkup } = req("react-dom/server");
const root = new URL("../", import.meta.url);
const commercialLocales = ["en", "zh-Hans", "ja", "ko", "tr", "es", "pt-BR", "fr", "de", "id", "it"];
const neutralLocales = ["zh-Hant", "ar", "ru", "vi"];

class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [1791172800000])); }
  static now() { return 1791172800000; }
}

function read(file) {
  return readFileSync(new URL(file, root), "utf8");
}

function load(file, extra = "") {
  const absolute = fileURLToPath(new URL(file, root));
  const output = buildSync({
    stdin: { contents: read(file) + extra, resolveDir: path.dirname(absolute), sourcefile: absolute, loader: "jsx" },
    jsx: "automatic",
    bundle: true,
    write: false,
    format: "cjs",
    platform: "node",
    external: ["react", "react-dom", "react/jsx-runtime"],
    loader: { ".css": "empty" },
  }).outputFiles[0].text;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require: req, URL, URLSearchParams, Intl, Date: FixedDate, console, setTimeout, clearTimeout });
  return module.exports;
}

const heroSource = read("src/components/v3/LeanHero.jsx");
const { RegistrationCard } = load("src/components/v3/RegistrationCard.jsx");
const { HomeDecisionPanel, getUi } = load("src/components/v3/LeanHero.jsx", "\nexport { HomeDecisionPanel, getUi };");

function renderHome(locale) {
  return renderToStaticMarkup(React.createElement(HomeDecisionPanel, { locale, ui: getUi(locale) }));
}

test("R156 rendered home workbench keeps direct registration before compare workbench", () => {
  for (const locale of commercialLocales) {
    const html = renderHome(locale);
    assert.match(html, /hx-route__registration/, `${locale}: direct registration region`);
    assert.match(html, /data-growth-decision="compare_first"/, `${locale}: compare branch switch remains available`);
    assert.match(html, /href="\/go\/binance\?src=registration-card-primary&amp;locale=[^"]+(?:&amp;product=spot)?"/, `${locale}: protected CTA href`);
    assert.doesNotMatch(html, /href="https?:\/\//, `${locale}: no raw external CTA href in rendered workbench`);
  }
});

test("R156 compact registration preserves code, benefit, action, and full href across eligible locales and platforms", () => {
  const cases = [
    { slug: "binance", code: "11350287", locales: commercialLocales, hrefPattern: /\/go\/binance\?src=registration-card-primary&amp;locale=[^&"]+(?:&amp;product=spot)?/ },
    { slug: "okx", code: "nexu888", locales: commercialLocales.filter((locale) => locale !== "ja"), hrefPattern: /\/go\/okx\?src=registration-card-primary&amp;locale=[^&"]+(?:&amp;product=spot)?/ },
  ];
  for (const { slug, code, locales, hrefPattern } of cases) {
    for (const locale of locales) {
      const compact = renderToStaticMarkup(React.createElement(RegistrationCard, { venueSlug: slug, locale, compact: true, homeCodeIdentity: true }));
      const full = renderToStaticMarkup(React.createElement(RegistrationCard, { venueSlug: slug, locale, compact: false }));
      assert.match(compact, new RegExp(`data-cta-code="${code}"`), `${locale}/${slug}: exact code`);
      assert.match(compact, hrefPattern, `${locale}/${slug}: protected full href`);
      assert.match(compact, /registration-card__code-benefit/, `${locale}/${slug}: compact benefit`);
      assert.match(full, /registration-card__benefit(?! registration-card__code-benefit)/, `${locale}/${slug}: full benefit`);
      assert.ok(compact.indexOf("registration-card__code-value") < compact.indexOf("registration-card__primary-btn"), `${locale}/${slug}: code before action`);
    }
  }
});

test("R156 neutral and official branches stay fail-closed without partner code CTAs", () => {
  for (const locale of neutralLocales) {
    const html = renderToStaticMarkup(React.createElement(RegistrationCard, { venueSlug: "binance", locale, compact: true, homeCodeIdentity: true }));
    assert.doesNotMatch(html, /data-cta-code=/, `${locale}: neutral locale has no partner code`);
    assert.doesNotMatch(html, /href="\/go\//, `${locale}: neutral locale has no protected partner redirect`);
  }
  const official = renderToStaticMarkup(React.createElement(RegistrationCard, { venueSlug: "coinbase", locale: "en", compact: true }));
  assert.match(official, /data-registration-preflight="official-route"/);
  assert.doesNotMatch(official, /data-cta-code=/);
});

test("R156 scoped CSS additions do not hide compact benefit content", () => {
  assert.match(heroSource, /<RegistrationCard[\s\S]*compact[\s\S]*homeCodeIdentity/);
  const css = read("src/components/v3/registration-card.css");
  assert.match(css, /\.registration-card--compact \.registration-card__code-benefit\s*\{/);
  assert.doesNotMatch(css, /\.registration-card--compact \.registration-card__code-benefit[\s\S]{0,180}(?:display\s*:\s*none|visibility\s*:\s*hidden)/);
});
