// Home hero v3 (owner 2026-10-14): "在 Bitget 交易 1000万U，自动返还你 $3,600". Pins the honest sum (volume × perpetual taker
// fee × partner share, read from the sources, never typed here), the Chinese/Latin money format, the log dial stops,
// the 17-locale sentence, and the SSR hero per market: CTA locales show sentence + figure + dial + code + CTA; Türkiye
// shows no Bitget; neutral locales show no figure, dial, code or /go link.
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { feeFact } from "../src/data/exchange-facts.js";
import { partnerRebateShare } from "../src/data/partner-benefit-status.js";
import { HOME_AUTO_SETTLE } from "../src/data/home-rebate-tiers.js";
import {
  HERO_SAY, HERO_VOLUME_STEPS, HERO_VOLUME_DEFAULT_STEP, HERO_VOLUME_TICKS, heroMoneyText, heroRebateAmount, heroSayText, heroVolumeText,
} from "../src/components/v7/home7-hero-volume.js";
import { createSsrHarness } from "./helpers/ssr-hydration-harness.mjs";

const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"];
const amountFor = (slug, volume) => heroRebateAmount(volume, feeFact(slug, "perp").taker, partnerRebateShare(slug));

test("the sum is volume × perpetual taker × partner share, read from the sources", () => {
  for (const slug of ["bitget", "okx", "binance", "htx"]) {
    const fee = feeFact(slug, "perp");
    assert.equal(fee.state, "checked", `${slug} perpetual fee is checked`);
    for (const volume of HERO_VOLUME_STEPS) assert.ok(Math.abs(amountFor(slug, volume) - volume * (fee.taker / 100) * partnerRebateShare(slug)) < 1e-6, `${slug} ${volume}`);
  }
  // The owner's headline example, from the same sources: 1000万U on Bitget (0.06% × 60%) is $3,600.
  assert.equal(heroMoneyText(amountFor("bitget", 1e7), "zh-Hans"), "$3,600");
  assert.equal(heroMoneyText(amountFor("okx", 1e7), "zh-Hans"), "$2,000");
  assert.equal(heroMoneyText(amountFor("binance", 1e7), "zh-Hans"), "$1,250");
  assert.equal(heroMoneyText(amountFor("htx", 1e7), "zh-Hans"), "$2,400");
  assert.equal(heroRebateAmount(1e7, null, 0.6), null, "a missing fee is never estimated");
  assert.equal(heroRebateAmount(1e7, 0.06, null), null, "a missing share is never estimated");
});

test("HTX fee comes from the official page (2026-10-14) and HTX is not auto-settled", () => {
  const fee = feeFact("htx", "perp");
  assert.deepEqual([fee.maker, fee.taker], [0.02, 0.06]);
  assert.equal(partnerRebateShare("htx"), 0.4);
  assert.equal(HOME_AUTO_SETTLE.includes("htx"), false);
});

test("money format: full figure below 10,000, then the locale's unit", () => {
  const cases = [[3.6, "$3.6"], [360, "$360"], [3600, "$3,600"], [36000, "$3.6万"], [3.6e6, "$360万"], [1.2e8, "$1.2亿"]];
  for (const [value, text] of cases) assert.equal(heroMoneyText(value, "zh-Hans"), text);
  assert.equal(heroMoneyText(36000, "zh-Hant"), "$3.6萬");
  assert.equal(heroMoneyText(36000, "ko"), "$3.6만");
  assert.equal(heroMoneyText(36000, "en"), "$36K");
  assert.equal(heroMoneyText(3.6e6, "en"), "$3.6M");
  assert.equal(heroVolumeText(1e7, "zh-Hans"), "1000万U");
  assert.equal(heroVolumeText(1e9, "zh-Hans"), "10亿U");
  assert.equal(heroVolumeText(1e7, "en"), "$10M");
});

test("dial: 21 log stops from 1万U to 10亿U, default 1000万U, ticks on the snap points", () => {
  assert.equal(HERO_VOLUME_STEPS.length, 21);
  assert.equal(HERO_VOLUME_STEPS[0], 1e4);
  assert.equal(HERO_VOLUME_STEPS.at(-1), 1e9);
  assert.equal(HERO_VOLUME_STEPS[HERO_VOLUME_DEFAULT_STEP], 1e7);
  assert.deepEqual(HERO_VOLUME_TICKS.map((i) => HERO_VOLUME_STEPS[i]), [1e5, 1e6, 1e7, 1e8, 1e9]);
  for (let i = 1; i < HERO_VOLUME_STEPS.length; i++) assert.ok(HERO_VOLUME_STEPS[i] > HERO_VOLUME_STEPS[i - 1]);
});

test("sentence: 17 locales, both placeholders, no time unit, no commission or fine print", () => {
  assert.deepEqual(Object.keys(HERO_SAY).sort(), [...LOCALES].sort());
  for (const locale of LOCALES) {
    const s = HERO_SAY[locale];
    const sentence = `${s.l1} ${s.auto}`;
    assert.ok(sentence.includes("{vol}") && sentence.includes("{venue}"), locale);
    for (const key of ["l1", "auto", "manual", "label", "screen", "fee", "back"]) assert.ok(s[key], `${locale}.${key}`);
    const text = Object.values(s).join(" ");
    assert.doesNotMatch(text, /年|月|year|month|annual|\baño\b|\bmes\b|\bano\b|\bmês\b|par an\b|Jahr|Monat|\banno\b|\bmese\b|년|월|год|месяц|\byıl\b|\btahun\b|\bbulan\b|\bnăm\b|tháng|سنة|شهر|سال|مہینہ|рік|місяць/i, `${locale}: no time unit`);
    assert.doesNotMatch(text, /佣金|返佣|not (financial )?advice|免责|disclaimer|\*/i, `${locale}: no commission wording or fine print (the 'our commission' phrases are pinned in l10n-qa-2026-10-13)`);
  }
  assert.equal(heroSayText("zh-Hans", { vol: "1000万U", venue: "Bitget", auto: true }), "在 Bitget 交易 1000万U，自动返还你");
  assert.equal(heroSayText("zh-Hans", { vol: "1000万U", venue: "HTX", auto: false }), "在 HTX 交易 1000万U，返还给你");
});

let harness;
test.before(async () => { harness = await createSsrHarness(); });
test.after(async () => { await harness?.close(); });
const hero = async (pathname, market) => {
  const html = await harness.render(`https://nexualpha.com${pathname}${market ? `?market=${market}` : ""}`, market ? { market } : {});
  const dom = new JSDOM(html);
  return { doc: dom.window.document, close: () => dom.window.close() };
};

test("SSR /zh-hans: live sentence, $3,600, dial at 1000万U, code and /go CTA, desktop device screen", async () => {
  const { doc, close } = await hero("/zh-hans");
  assert.equal(doc.querySelector(".h7-hero h1").textContent, "在 Bitget 交易 1000万U，自动返还你");
  const figure = doc.querySelector(".hx-amt");
  assert.equal(figure.getAttribute("data-final-value"), "3600");
  assert.equal(figure.textContent, "$3,600", "real text, final value in the HTML");
  const dial = doc.querySelector(".hx-dial-input");
  assert.equal(dial.getAttribute("type"), "range");
  assert.equal(dial.getAttribute("value"), String(HERO_VOLUME_DEFAULT_STEP));
  assert.equal(dial.getAttribute("aria-valuetext"), "1000万U");
  assert.equal(doc.querySelector(".hx-code code").textContent, "nexu888");
  assert.match(doc.querySelector(".hx-go").getAttribute("href"), /^\/go\/bitget\?/);
  const rows = [...doc.querySelectorAll(".hx-screen .hx-scr-rows li")].map((li) => li.textContent.replace(/\s+/g, " ").trim());
  assert.ok(rows.some((row) => row.includes("Bitget") && row.includes("$6,000") && row.includes("$3,600")), rows.join(" | "));
  assert.ok(rows.some((row) => row.includes("HTX") && row.includes("$2,400")), "HTX appears with its checked fee");
  assert.equal(doc.querySelector(".hx-screen").getAttribute("aria-hidden"), "true", "the device repeats the figure; it is hidden from AT");
  assert.equal(doc.querySelector(".h7-hero .ht, #h7-terminal-root"), null, "no price terminal on the CTA hero");
  close();
});

test("SSR Türkiye: OKX first, no Bitget anywhere in the hero", async () => {
  const { doc, close } = await hero("/tr");
  const heroHtml = doc.querySelector(".h7-hero").outerHTML;
  assert.doesNotMatch(heroHtml, /bitget/i);
  assert.match(doc.querySelector(".h7-hero h1").textContent, /OKX/);
  close();
});

test("SSR neutral locales: information headline only, no figure, dial, code or /go link", async () => {
  for (const pathname of ["/ru", "/vi", "/ar", "/zh-hant", "/ur", "/uk-ua"]) {
    const { doc, close } = await hero(pathname);
    const section = doc.querySelector(".h7-hero");
    assert.ok(section.hasAttribute("data-neutral"), pathname);
    assert.equal(section.querySelector(".hx-amt, .hx-dial, .hx-code, .hx-screen"), null, pathname);
    assert.doesNotMatch(section.outerHTML, /href="\/go\//, pathname);
    close();
  }
});

test("calculator: same volume framing in 17 locales, 1万U → 10亿U range, no time words", async () => {
  const { CALC_SAY, CALC_VMIN, CALC_VMAX, calcToPos, calcToVol } = await import("../src/components/v7/home7-hero-volume.js");
  assert.deepEqual(Object.keys(CALC_SAY).sort(), [...LOCALES].sort());
  for (const locale of LOCALES) {
    const c = CALC_SAY[locale];
    for (const key of ["h", "empty", "label", "back", "fee", "most", "rates", "nh", "low"]) assert.ok(c[key], `${locale}.${key}`);
    assert.ok(c.most.includes("{n}") && c.most.includes("{v}") && c.low.includes("{n}") && c.low.includes("{v}"), locale);
    assert.doesNotMatch(Object.values(c).join(" "), /年|月|year|month|annual|\baño\b|\bmes\b|\bano\b|\bmês\b|par an\b|Jahr|Monat|\banno\b|\bmese\b|년|월|год|месяц|\byıl\b|\btahun\b|\bbulan\b|\bnăm\b|tháng|سنة|شهر|سال|مہینہ|рік|місяць/i, `${locale}: no time unit`);
  }
  assert.equal(calcToVol(0), CALC_VMIN);
  assert.equal(calcToVol(1000), CALC_VMAX);
  assert.equal(calcToVol(calcToPos(1e7)), 1e7);
});

test("Gate.io: owner-confirmed 40% (2026-10-15) on the official perpetual fee, so it has a hero amount", () => {
  const fee = feeFact("gate-io", "perp");
  assert.equal(fee.state, "checked");
  assert.deepEqual([fee.maker, fee.taker], [0.02, 0.05]);
  assert.equal(partnerRebateShare("gate-io"), 0.4);
  assert.equal(HOME_AUTO_SETTLE.includes("gate-io"), false, "not on the auto-settle list: its sentence has no 自动");
  assert.equal(heroMoneyText(amountFor("gate-io", 1e7), "zh-Hans"), "$2,000");
});

test("hero life stays finite: desktop-only screen cycle, two rounds, stops on touch, pauses offscreen/hidden, no reduced motion", async () => {
  const { readFile } = await import("node:fs/promises");
  const home = await readFile(new URL("../src/components/v7/HomeV7.jsx", import.meta.url), "utf8");
  const cycle = home.slice(home.indexOf("const touchedRef"), home.indexOf("}, [banned]);"));
  for (const guard of ["reducedMotion()", "(min-width: 1024px)", "IntersectionObserver", "visibilitychange", "touchedRef.current", "seq.length * 2", "4000"]) assert.ok(cycle.includes(guard), guard);
  assert.ok(cycle.includes("setScreenStep(seq[at])") && !cycle.includes("setHeroStep(seq"), "only the laptop screen cycles: the headline and figure never change on their own (no CLS)");
  const css = await readFile(new URL("../src/styles/v7/home7.src.css", import.meta.url), "utf8");
  assert.match(css, /@ \.hx-scr-live\[data-on\] i\{[^}]*animation:hx-live/, "the live dot pulses only while cycling");
  assert.match(css, /@ \.hx-scr-hl\{[^}]*transform:translateY\(calc\(var\(--i,0\) \* 50px\)\)/, "row highlight glides by transform");
  assert.match(css, /@ \.hx-amt \.hx-rate-logo\{[^}]*inline-size:\.58em/, "brand mark is em-sized to the figure");
});

test("SSR: the brand mark sits inside the figure's line box", async () => {
  const { doc, close } = await hero("/zh-hans");
  assert.ok(doc.querySelector(".hx-amt > .hx-rate-logo [data-brand-slug=bitget]"));
  close();
});
