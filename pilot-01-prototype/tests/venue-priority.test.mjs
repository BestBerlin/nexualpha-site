import test from "node:test";
import assert from "node:assert/strict";
import { VENUE_PRIORITY, orderVenues, compareVenuePriority } from "../src/data/venue-priority.js";
import { homePartnersFor, homePushFor, HOME_REBATE_SHARE } from "../src/data/home-rebate-tiers.js";
import { filterDirectoryVenues } from "../src/data/directory-context.js";
import { pickNewsOfferVenue } from "../src/data/news-offer.js";
import { resolvePromotions } from "../src/data/promotions.js";
import { localizedHref } from "../src/data/locale-routing.js";
import { isNeutralCtaLocale } from "../src/data/locale-policy.js";
import { createSsrHarness } from "./helpers/ssr-hydration-harness.mjs";

const locales = ["en", "zh-Hans", "zh-Hant", "ja", "ko", "tr", "es", "pt-BR", "fr", "de", "ru", "ar", "id", "vi", "it", "ur", "uk"];
const input = ["binance", "okx", "bitget"];
test("one immutable owner priority, stable rest and no input mutation", () => {
  assert.deepEqual(VENUE_PRIORITY.slice(0, 3), ["bitget", "okx", "binance"]);
  assert.ok(Object.isFrozen(VENUE_PRIORITY));
  assert.deepEqual(orderVenues(["unknown-b", ...input, "unknown-a"]), ["bitget", "okx", "binance", "unknown-b", "unknown-a"]);
  assert.deepEqual(input, ["binance", "okx", "bitget"]);
  assert.equal(compareVenuePriority({ slug: "bitget" }, { slug: "okx" }), -1);
  assert.deepEqual(orderVenues(input, "tr-TR"), ["okx", "binance"]);
});
for (const locale of locales) {
  test(`home, directory, news offers and promotion order/gates: ${locale}`, () => {
    const expected = locale === "tr" ? ["okx", "binance"] : ["bitget", "okx", "binance"];
    assert.deepEqual(homePartnersFor(locale).slice(0, expected.length), expected);
    assert.deepEqual(homePushFor(locale), expected);
    assert.deepEqual(filterDirectoryVenues(input.map(slug => ({ slug })), undefined, { locale }).map(v => v.slug), expected);
    const offer = pickNewsOfferVenue(input, locale);
    if (isNeutralCtaLocale(locale)) assert.equal(offer, null);
    else assert.equal(offer?.slug, locale === "ja" ? "binance" : expected[0]);
    const records = input.map(partner => ({ id: partner, partner, enabled: true, officialSource: `https://${partner}.com`, link: `/go/${partner}?src=news-campaign`, lastVerified: "2026-10-14", topicTags: [partner] }));
    const promos = resolvePromotions({ venue: input, locale, now: Date.parse("2026-10-14") }, records);
    if (isNeutralCtaLocale(locale)) assert.equal(promos[0].kind, "tool");
    else assert.deepEqual(promos.map(p => p.partner), locale === "ja" ? ["binance"] : expected.slice(0, 2));
  });
}
test("market gates survive prioritization", () => {
  assert.ok(!homePartnersFor("en", "TR").includes("bitget"));
  assert.equal(homePushFor("en", "TR")[0], "okx");
  assert.equal(pickNewsOfferVenue(input, "en", "TR")?.slug, "okx");
  assert.equal(pickNewsOfferVenue(input, "en", "VN"), null);
  assert.equal(HOME_REBATE_SHARE.bitget, 0.6);
});
test("rendered home sticky-bar default and directory order for every locale", async () => {
  const harness = await createSsrHarness();
  try {
    for (const locale of locales) {
      const home = harness.render(`https://nexualpha.com${localizedHref("/", { locale })}`, {});
      const dock = home.match(/class="h7-dock[^>]*>[\s\S]*?<select[^>]*>([\s\S]*?)<\/select>/)?.[1];
      if (isNeutralCtaLocale(locale) || locale === "ja") assert.ok(!home.includes('class="h7-dock'), locale);
      else {
        assert.ok(dock, locale);
        const slugs = [...dock.matchAll(/<option value="([^"]+)"/g)].map(m => m[1]);
        assert.deepEqual(slugs, homePushFor(locale), locale);
        assert.match(dock, new RegExp(`<option value="${homePushFor(locale)[0]}" selected=""`), locale);
      }
      const directory = harness.render(`https://nexualpha.com${localizedHref("/exchanges", { locale })}`, {});
      // Directory rows are data-backed; each row's first identity attribute identifies its venue.
      const rows = [...directory.matchAll(/class="mx-row"[^>]*data-slug="([^"]+)"/g)].map(m => m[1]);
      assert.ok(rows.length, `directory rows: ${locale}`);
      assert.deepEqual(rows.slice(0, locale === "tr" ? 2 : 3), homePushFor(locale), locale);
    }
  } finally { await harness.close(); }
});
