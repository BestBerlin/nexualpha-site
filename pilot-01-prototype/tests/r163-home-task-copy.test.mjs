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
const expected = JSON.parse(readFileSync(new URL("./fixtures/r163-task-copy.json", import.meta.url), "utf8"));
const locales = Object.keys(expected.modes);
const commercialLocales = ["en", "zh-Hans", "ja", "ko", "tr", "es", "pt-BR", "fr", "de", "id", "it"];
const semanticTerms = {
  en: ["Third-party", "before submitting", "if missing"],
  "zh-Hans": ["第三方注册", "提交前", "手动填写"],
  "zh-Hant": ["第三方註冊", "提交前", "手動填寫"],
  ja: ["第三者の登録", "送信前", "手入力"],
  ko: ["제3자 가입", "제출 전", "직접 입력"],
  tr: ["Üçüncü taraf kayıt", "göndermeden önce", "elle girin"],
  es: ["registro de terceros", "antes de enviar", "manualmente"],
  "pt-BR": ["cadastro de terceiros", "antes de enviar", "manualmente"],
  fr: ["site tiers", "avant de valider l’inscription", "manuellement"],
  de: ["Registrierung auf der Drittseite", "vor dem Absenden", "manuell"],
  ru: ["сторонней странице регистрации", "перед отправкой", "вручную"],
  ar: ["تسجيل الطرف الثالث", "قبل الإرسال", "يدويًا"],
  id: ["pendaftaran pihak ketiga", "sebelum mengirim", "manual"],
  vi: ["đăng ký bên thứ ba", "trước khi gửi", "thủ công"],
  it: ["registrazione sul sito terzo", "prima di inviare", "manualmente"],
};

class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [1791172800000])); }
  static now() { return 1791172800000; }
}

function esc(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
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

test("R163 rendered home mode buttons use the approved short task copy for eligible locales", () => {
  for (const locale of commercialLocales) {
    const html = renderHome(locale);
    assert.ok(html.includes(`>${esc(expected.modes[locale][0])}</button>`), `${locale}: direct task label rendered`);
    assert.ok(html.includes(`>${esc(expected.modes[locale][1])}</button>`), `${locale}: compare task label rendered`);
  }
});

test("R163 compact partner signup prompts keep current action, fullhref, code, and disclosure", () => {
  for (const locale of commercialLocales) {
    const html = renderToStaticMarkup(React.createElement(RegistrationCard, { venueSlug: "binance", locale, compact: true, homeCodeIdentity: true }));
    const normalizedHtml = html.replace(/sign-up/g, "signup");
    const normalizedAction = expected.compact[locale][2].replace(/sign-up/g, "signup");
    assert.ok(normalizedHtml.includes(`>${esc(normalizedAction)}</a>`), `${locale}: action`);
    assert.match(html, /href="\/go\/binance\?src=registration-card-primary&amp;locale=[^"]+(?:&amp;product=spot)?"/, `${locale}: protected full href`);
    assert.match(html, /data-cta-code="11350287"/, `${locale}: exact invite code`);
    assert.match(html, /registration-card__mobile-route-details/, `${locale}: third-party disclosure`);
    assert.ok(html.indexOf("registration-card__code-value") < html.indexOf("registration-card__primary-btn"), `${locale}: code before action`);
  }
});

test("R163 noneligible branches do not show third-party invite task copy or protected partner CTA", () => {
  const official = renderToStaticMarkup(React.createElement(RegistrationCard, { venueSlug: "coinbase", locale: "en", compact: true }));
  assert.match(official, /data-registration-preflight="official-route"/);
  assert.doesNotMatch(official, /class="registration-card__code-value"/);
  assert.match(official, /href="\/go\/coinbase\?src=registration-card-official-route"/);
  assert.doesNotMatch(official, /data-cta-kind="registration"/);
  assert.doesNotMatch(official, /data-cta-code=/);

  const blocked = renderToStaticMarkup(React.createElement(RegistrationCard, { venueSlug: "binance", locale: "en", compact: true, market: "US", product: "perpetuals" }));
  assert.match(blocked, /data-registration-decision-state="blocked"/);
  assert.doesNotMatch(blocked, /Third-party signup: check code/);
  assert.doesNotMatch(blocked, /href="\/go\//);
  assert.doesNotMatch(blocked, /data-cta-code=/);

  const noCode = renderToStaticMarkup(React.createElement(RegistrationCard, { venueSlug: "uniswap", locale: "en", compact: true }));
  assert.doesNotMatch(noCode, /class="registration-card__code-value"/);
  assert.doesNotMatch(noCode, /Third-party signup: check code/);
  assert.match(noCode, /href="\/go\/uniswap\?src=registration-card-official-route"/);
  assert.doesNotMatch(noCode, /data-cta-kind="registration"/);
  assert.doesNotMatch(noCode, /data-cta-code=/);
});

test("R163 copy fixture retains all reviewed locales and semantic duties", () => {
  assert.equal(locales.length, 15);
  for (const locale of locales) {
    const body = expected.compact[locale][1];
    for (const phrase of semanticTerms[locale]) assert.ok(body.includes(phrase), `${locale}: ${phrase}`);
    assert.ok(expected.modes[locale].every(Boolean), `${locale}: mode labels`);
  }
});
