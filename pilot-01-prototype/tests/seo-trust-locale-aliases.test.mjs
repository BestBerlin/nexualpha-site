import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import worker, { renderLocaleSitemap, routeMetadata } from "../worker/index.js";
import { LOCALE_PATH_ALIASES, legacyLocaleRedirect, localizedHref } from "../src/data/locale-routing.js";
import { routeInventory, buildSitemap } from "../scripts/generate-prerender-manifest.mjs";

test("retired locale prefixes permanently redirect roots and deep paths without losing attribution", async () => {
  for (const [alias, canonical] of Object.entries(LOCALE_PATH_ALIASES)) {
    for (const suffix of ["", "/", "/exchanges/okx", "/news/example"]) {
      const path = `/${alias}${suffix}?locale=en&market=JP&utm_source=telegram&p=publisher&src=channel&x=drop`;
      const expected = `/${canonical}${suffix === "/" ? "" : suffix}?market=JP&utm_source=telegram&p=publisher&src=channel`;
      assert.equal(legacyLocaleRedirect(`https://nexualpha.com${path}`), expected);
      for (const method of ["GET", "HEAD"]) {
        const response = await worker.fetch(new Request(`https://nexualpha.com${path}`, { method }), {
          ASSETS: { fetch: () => { throw new Error("Redirects must not fetch assets"); } },
        });
        assert.equal(response.status, 301, path);
        assert.equal(response.headers.get("location"), `https://nexualpha.com${expected}`);
      }
    }
    assert.equal(legacyLocaleRedirect(`https://nexualpha.com/${canonical}`), null);
    for (const suffix of ["", "/exchanges/okx"]) {
      const url = new URL(`https://nexualpha.com/${canonical}${suffix}`);
      const meta = await routeMetadata(url, {});
      assert.equal(meta.canonical, url.href);
      for (const alternate of meta.alternates || []) {
        assert.doesNotMatch(alternate.href, /https:\/\/nexualpha\.com\/(?:id|jp|kr|zh-cn)(?:[/?<"]|$)/);
      }
    }
  }
  assert.equal(localizedHref("/jp/exchanges/okx", { locale: "ja" }), "/ja/exchanges/okx");
  assert.equal(localizedHref("/id", { locale: "id" }), "/id-id");
});

test("retired prefixes never occur in sitemap locations or hreflang targets", async () => {
  const inventory = routeInventory([]);
  for (const alias of Object.keys(LOCALE_PATH_ALIASES)) {
    assert.ok(!inventory.some(({ pathname }) => pathname === `/${alias}`));
  }
  const xmls = [buildSitemap(inventory, []), await renderLocaleSitemap({}),
    readFileSync(new URL("../public/sitemap-locales.xml", import.meta.url), "utf8")];
  for (const xml of xmls) assert.doesNotMatch(xml, /https:\/\/nexualpha\.com\/(?:id|jp|kr|zh-cn)(?:[/?<"]|$)/);
});
