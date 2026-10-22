import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { quickAnswersForExchange, quickAnswerEntities } from "../src/data/exchange-quick-answers.js";
import { applyExchangeQuickAnswers } from "../src/data/exchange-quick-answer-schema.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { routeMetadata } from "../worker/index.js";
import { localizedPath } from "../src/data/locale-routing.js";
import { REFERRAL_PARTNERS } from "../src/data/referral-partners.generated.js";
import { createSsrHarness } from "./helpers/ssr-hydration-harness.mjs";

const slugs = ["okx", "binance", "bybit", "bitget", "kraken", "backpack"];
const neutral = ["zh-Hant", "ru", "ar", "vi", "ur", "uk"];
const locales = ["en", "zh-Hans", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "tr", "id", ...neutral];
let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });

test("quick answers render on every supported profile and share one client/Worker FAQPage", async () => {
  for (const locale of locales) for (const slug of slugs) {
    const route = localizedPath(`/exchanges/${slug}`, locale);
    const copy = quickAnswersForExchange(slug, locale);
    const html = harness.render(`https://nexualpha.com${route}`);
    const dom = new JSDOM(html);
    try {
      const section = dom.window.document.querySelector("#quick-answers");
      if (locale === "tr" && slug === "bitget") {
        assert.equal(copy, null);
        assert.equal(section, null);
        continue;
      }
      assert.ok(copy?.items.length >= (slug === "backpack" ? 2 : 4) && copy.items.length <= 6, `${route}: sourced answer count (Backpack fees are unchecked)`);
      assert.ok(section, `${route}: visible section`);
      if (locale !== "en") {
        assert.notEqual(copy.title, "Quick answers", `${route}: localized heading`);
        assert.ok(copy.items.every(item => !/official domain$/.test(item.question)), `${route}: localized questions`);
      }
      assert.equal(section.querySelectorAll("dt").length, copy.items.length, route);
      for (const item of copy.items) {
        assert.ok(section.textContent.includes(item.question), route);
        assert.ok(section.textContent.includes(item.answer), route);
      }
      for (const anchor of section.querySelectorAll("a")) {
        const target = new URL(anchor.href, `https://nexualpha.com${route}`);
        if (target.pathname === route && target.hash) assert.ok(dom.window.document.getElementById(target.hash.slice(1)), `${route}: missing ${target.hash}`);
      }
      const client = computeRouteSeo({ url: route, locale }).schemas.filter(s => s["@type"] === "FAQPage");
      const worker = (await routeMetadata(new URL(`https://nexualpha.com${route}`), {})).schema.filter(s => s["@type"] === "FAQPage");
      assert.equal(client.length, 1, route);
      assert.equal(worker.length, 1, route);
      const expected = quickAnswerEntities(slug, locale);
      assert.deepEqual(client[0].mainEntity.slice(0, expected.length), expected, route);
      assert.deepEqual(worker[0].mainEntity.slice(0, expected.length), expected, route);
      assert.ok(expected.every(q => q["@type"] === "Question" && q.acceptedAnswer["@type"] === "Answer" && q.acceptedAnswer.text), route);
      assert.doesNotMatch(JSON.stringify(expected), /\{(?:name|code|maker|taker)\}/, route);
      if (neutral.includes(locale)) {
        for (const partner of REFERRAL_PARTNERS.filter(p => p.inviteCode)) assert.ok(!section.textContent.includes(partner.inviteCode), `${route}: leaked code`);
        assert.doesNotMatch(section.innerHTML, /\/go\/|#registration|sign.up|register|referral|invite code/i, route);
      }
    } finally { dom.window.close(); }
  }
});

test("schema extension retains reviewed questions, removes duplicate names and leaves other schemas alone", () => {
  const question = quickAnswerEntities("okx", "en")[0];
  const kept = { "@type": "Question", name: "Reviewed question", acceptedAnswer: { "@type": "Answer", text: "Reviewed answer" } };
  const schema = { "@type": "FAQPage", mainEntity: [question, kept] };
  const result = applyExchangeQuickAnswers(schema, "okx", "en");
  assert.equal(result.mainEntity.filter(q => q.name === question.name).length, 1);
  assert.deepEqual(result.mainEntity.at(-1), kept);
  assert.deepEqual(schema.mainEntity, [question, kept]);
  const organization = { "@type": "Organization" };
  assert.equal(applyExchangeQuickAnswers(organization, "okx", "en"), organization);
  assert.equal(quickAnswersForExchange("unknown", "en"), null);
  for (const [locale, country] of [["fr", "FR"], ["de", "DE"], ["ja", "JP"]]) {
    const entries = quickAnswersForExchange("bitget", locale).items;
    assert.ok(entries.some(entry => entry.question.includes(country) && entry.sources.includes("https://www.bitget.com/support/articles/360014944032")), `${locale}: sourced main-country restriction`);
  }
  // Backpack's Tier 1 fees were read from its official fee page on 2026-10-23: the rate answer cites only that page.
  assert.ok(quickAnswersForExchange("backpack", "en").items.filter(item => item.answer.includes("%")).every(item => item.sources.every(url => url === "https://backpack.exchange/fees")), "Backpack rates cite the official fee page");
  assert.ok(quickAnswersForExchange("coinw", "en")?.items?.every(item => !item.answer.includes("%")) ?? true, "unchecked rates are omitted");
  assert.equal(quickAnswersForExchange("bitget", "en", "TR"), null);
  for (const locale of ["vi-VN", "zh-TW", "ru-RU"]) {
    const copy = quickAnswersForExchange("okx", locale);
    assert.ok(copy);
    const text = JSON.stringify(copy);
    for (const partner of REFERRAL_PARTNERS.filter(p => p.inviteCode)) assert.ok(!text.includes(partner.inviteCode), locale);
  }
});
