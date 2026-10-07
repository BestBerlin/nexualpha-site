import assert from "node:assert/strict";
import test from "node:test";
import { localizedHref, legacyLocaleRedirect, parsePublicRoute } from "../src/data/locale-routing.js";

test("English country navigation survives repeated hydration URL normalization", () => {
  for (const path of ["/mx", "/mx/comparar", "/mx/costos", "/mx/conta", "/jp", "/kr", "/tw", "/hk", "/id", "/vn"]) {
    const initial = `${path}?locale=es&market=MX&product=spot&account_stage=another_platform&funding=SPEI&utm_source=tg_channel#checks`;
    const href = localizedHref(initial, { locale: "en" });
    const url = new URL(href, "https://nexualpha.com");
    assert.equal(url.searchParams.get("locale"), "en", path);
    assert.equal(parsePublicRoute(url.pathname, url.searchParams).locale, "en");
    assert.equal(localizedHref(href, { locale: "en" }), href, "normalization is a fixed point");
    assert.equal(legacyLocaleRedirect(url.href), null, "Worker-compatible country query is not redirected");
    for (const key of ["market", "product", "account_stage", "funding", "utm_source"]) {
      assert.equal(url.searchParams.get(key), new URL(initial, url.origin).searchParams.get(key));
    }
    assert.equal(url.hash, "#checks");
  }
});

test("country defaults and generic English canonical navigation remain unchanged", () => {
  assert.equal(parsePublicRoute("/mx").locale, "es");
  assert.equal(localizedHref("/mx?locale=en", { locale: "es" }), "/mx?locale=es");
  assert.equal(localizedHref("/es/exchanges/binance?market=MX", { locale: "en" }), "/exchanges/binance?market=MX");
  for (const path of ["/eu", "/uk", "/us", "/sg", "/int", "/br", "/br/pix"]) {
    assert.equal(localizedHref(path, { locale: "en" }), path);
  }
  assert.equal(parsePublicRoute("/br").locale, "pt-BR");
});
