import { decisionContextSearchFromUrl } from '../src/data/decision-passport.js';
import assert from "node:assert/strict";
import test from "node:test";
import { localizedHref, legacyLocaleRedirect, parsePublicRoute } from "../src/data/locale-routing.js";

test("English country navigation survives repeated hydration URL normalization", () => {
  for (const path of ["/mx", "/mx/comparar", "/mx/costos", "/mx/conta", "/tw", "/hk", "/vn"]) {
    const initial = `${path}?locale=es&market=MX&product=spot&account_stage=another_platform&funding=SPEI&utm_source=tg_channel#checks`;
    const href = localizedHref(initial, { locale: "en" });
    const url = new URL(href, "https://nexualpha.com");
    assert.equal(new URLSearchParams(decisionContextSearchFromUrl(url)).get("locale"), "en", path);
    assert.equal(parsePublicRoute(url.pathname, url.searchParams).locale, parsePublicRoute(path).locale);
    assert.equal(localizedHref(href, { locale: "en" }), href, "normalization is a fixed point");
    assert.equal(legacyLocaleRedirect(url.href), null, "Worker-compatible country query is not redirected");
    for (const key of ["market", "product", "account_stage", "funding", "utm_source"]) {
      assert.equal(new URLSearchParams(decisionContextSearchFromUrl(url)).get(key), new URL(initial, url.origin).searchParams.get(key));
    }
    assert.equal(url.hash.split("?")[0], "#checks");
  }
});

test("country defaults and generic English canonical navigation remain unchanged", () => {
  assert.equal(parsePublicRoute("/mx").locale, "es");
  assert.equal(localizedHref("/mx?locale=en", { locale: "es" }), "/mx");
  assert.equal(localizedHref("/es/exchanges/binance?market=MX", { locale: "en" }), "/exchanges/binance#nxa-context?market=MX");
  for (const path of ["/eu", "/uk", "/us", "/sg", "/int", "/br", "/br/pix"]) {
    assert.equal(new URL(localizedHref(path, { locale: "en" }), "https://nexualpha.com").pathname, path);
  }
  assert.equal(parsePublicRoute("/br").locale, "pt-BR");
});
