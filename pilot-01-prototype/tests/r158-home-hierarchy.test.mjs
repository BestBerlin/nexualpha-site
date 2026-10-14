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

const { RegistrationCard } = load("src/components/v3/RegistrationCard.jsx");
const { HomeDecisionPanel, getUi } = load("src/components/v3/LeanHero.jsx", "\nexport { HomeDecisionPanel, getUi };");

function renderHome(locale) {
  return renderToStaticMarkup(React.createElement(HomeDecisionPanel, { locale, ui: getUi(locale) }));
}

test("R158 rendered home hierarchy places direct registration after selection copy and before compare content", () => {
  for (const locale of commercialLocales) {
    const html = renderHome(locale);
    assert.ok(html.indexOf("hx-route__who") < html.indexOf("hx-route__registration"), `${locale}: route copy before registration`);
    assert.match(html, /hx-route__registration/, `${locale}: direct registration region`);
    assert.match(html, /data-growth-decision="compare_first"/, `${locale}: compare branch switch remains available`);
    assert.ok(html.indexOf("registration-card__code-value") < html.indexOf("registration-card__primary-btn"), `${locale}: code before action`);
    assert.ok(html.indexOf("registration-card__primary-btn") < html.indexOf("registration-card__mobile-route-details"), `${locale}: disclosure after action`);
  }
});

test("R158 rendered direct mode keeps disclosure details and current CTA contract", () => {
  for (const locale of commercialLocales) {
    const html = renderToStaticMarkup(React.createElement(RegistrationCard, { venueSlug: "binance", locale, compact: true, homeCodeIdentity: true }));
    assert.match(html, /<details class="registration-card__mobile-route-details">/, `${locale}: native details`);
    const details = html.match(/<details class="registration-card__mobile-route-details">([\s\S]*?)<\/details>/)?.[1] || "";
    assert.match(details, /Partner route|官方|公式|파트너|Route|Ruta|Cadastro|Inscription|Registrierung|registrasi|registrazione/i, `${locale}: route detail copy`);
    assert.match(html, /href="\/go\/binance\?src=registration-card-primary&amp;locale=[^"]+(?:&amp;product=spot)?"/, `${locale}: protected full CTA href`);
    assert.match(html, /data-cta-code="11350287"/, `${locale}: code identity`);
  }
});

test("R158 compare and blocked branches do not duplicate partner invite details", () => {
  const heroSource = read("src/components/v3/LeanHero.jsx");
  const compareBranch = heroSource.slice(heroSource.indexOf('activeIntent === "compare"'), heroSource.indexOf(') : (', heroSource.indexOf('activeIntent === "compare"')));
  assert.doesNotMatch(compareBranch, /registration-card__mobile-route-details|<RegistrationCard/);

  const blocked = renderToStaticMarkup(React.createElement(RegistrationCard, { venueSlug: "binance", locale: "en", compact: true, market: "US", product: "perpetuals" }));
  assert.match(blocked, /data-registration-decision-state="blocked"/);
  assert.doesNotMatch(blocked, /href="\/go\//);
  assert.doesNotMatch(blocked, /data-cta-code=/);
});

test("R158 explanation and registration CSS remains scoped and readable", () => {
  const growthCss = read("src/components/v3/growth-conversion.css");
  assert.match(growthCss, /\.growth-decision-explanation\s*\{/);
  assert.match(growthCss, /\.growth-decision-explanation__summary\s*\{/);
  assert.doesNotMatch(growthCss, /\.growth-decision-explanation[\s\S]{0,240}(?:display\s*:\s*none|visibility\s*:\s*hidden)/);

  const registrationCss = read("src/components/v3/registration-card.css");
  assert.match(registrationCss, /\.registration-card__mobile-route-details/);
  assert.match(registrationCss, /\.registration-card__mobile-route-details > summary/);
  assert.doesNotMatch(registrationCss, /\.registration-card__mobile-route-details[\s\S]{0,220}visibility\s*:\s*hidden/);
});
