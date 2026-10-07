import test from "node:test";
import assert from "node:assert/strict";
import { computeRouteSeo } from "../src/data/seo-injection.js";

for (const slug of ["bitget", "okx", "binance", "backpack"]) {
  test(`${slug} profile exposes source-backed FAQ schema`, () => {
    const seo = computeRouteSeo({ pathname: `/ja/exchanges/${slug}`, url: `https://nexualpha.com/ja/exchanges/${slug}`, locale: "ja" });
    const faq = seo.schemas.find((schema) => schema["@type"] === "FAQPage");
    assert.ok(faq, "venue profile should expose FAQPage");
    assert.equal(faq.inLanguage, "ja");
    assert.ok(faq.mainEntity.length >= 2);
    assert.ok(faq.mainEntity.every((entry) => entry.acceptedAnswer.citation?.length));
  });
}
