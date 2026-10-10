import test from "node:test";
import assert from "node:assert/strict";
import { renderLocaleSitemap, routeMetadata } from "../worker/index.js";

test("locale sitemap lists only indexable, self-canonical pages and covers the translated locales", async () => {
  const xml = await renderLocaleSitemap({});
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length > 300, `only ${locs.length} URLs`);
  for (const prefix of ["/pt-br/", "/es/", "/fr/", "/de/", "/vi/", "/id-id/", "/it/"]) assert.ok(locs.some((l) => l.includes(prefix)), prefix);
  for (const loc of locs.filter((_, i) => i % 25 === 0)) {
    const meta = await routeMetadata(new URL(loc), {});
    assert.equal(meta.robots, "index,follow", loc);
    assert.equal(meta.canonical, loc, loc);
  }
  assert.ok(!locs.some((l) => /\/exchanges\/hyperliquid$/.test(l) && /\/(es|pt-br|fr)\//.test(l)), "excluded locales stay out");
});
