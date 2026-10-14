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

function loadHome() {
  const absolute = fileURLToPath(new URL("src/components/v3/LeanHero.jsx", root));
  const output = buildSync({
    stdin: { contents: read("src/components/v3/LeanHero.jsx") + "\nexport { HomeDecisionPanel, getUi };", resolveDir: path.dirname(absolute), sourcefile: absolute, loader: "jsx" },
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

const { HomeDecisionPanel, getUi } = loadHome();
const source = read("src/components/v3/LeanHero.jsx");

function renderHome(locale) {
  return renderToStaticMarkup(React.createElement(HomeDecisionPanel, { locale, ui: getUi(locale) }));
}

test("R128 rendered home keeps the platform benefit only inside the registration card", () => {
  for (const locale of commercialLocales) {
    const html = renderHome(locale);
    const routeWho = html.match(/<div class="hx-route__who">([\s\S]*?)<div class="hx-route__registration"/)?.[1] || "";
    const registration = html.match(/<div class="hx-route__registration"([\s\S]*?)<\/aside>/)?.[1] || "";
    assert.doesNotMatch(routeWho, /20% off spot fees|现货手续费 8 折|手数料|수수료|ücret|comisiones|taxas|frais|Gebühren|biaya|commissioni/i, `${locale}: outer route does not duplicate benefit copy`);
    assert.match(registration, /registration-card__code-benefit/, `${locale}: registration card keeps benefit copy`);
    assert.match(registration, /registration-card__code-value/, `${locale}: registration card keeps visible code`);
  }
});

test("R128 rendered home preserves protected registration CTA semantics", () => {
  for (const locale of commercialLocales) {
    const html = renderHome(locale);
    assert.match(html, /href="\/go\/binance\?src=registration-card-primary&amp;locale=[^"]+(?:&amp;product=spot)?"/, `${locale}: protected full CTA href`);
    assert.match(html, /data-cta-code="11350287"/, `${locale}: exact code identity`);
    assert.match(html, /registration-card__mobile-route-details/, `${locale}: disclosure remains rendered`);
    assert.ok(html.indexOf("registration-card__code-value") < html.indexOf("registration-card__primary-btn"), `${locale}: code appears before primary action`);
  }
});

test("R128 source keeps the obsolete outer benefit fallback removed", () => {
  assert.doesNotMatch(source, /<span>\{selected\.benefit \|\| \(zh \? "官方直达入口，按平台当前条件执行" : "Official route with current platform terms"\)\}<\/span>/);
  assert.match(source, /<RegistrationCard[\s\S]*homeCodeIdentity/);
});
