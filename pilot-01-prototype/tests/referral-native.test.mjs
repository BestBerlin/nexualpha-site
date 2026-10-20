import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  NATIVE_REFERRAL_SLUGS,
  REFERRAL_HELP,
  isNativeReferralTitle,
  nativeReferralFor,
} from "../src/data/referral-native.js";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

test("native referral answers keep the finite venue/date contract", () => {
  assert.deepEqual(NATIVE_REFERRAL_SLUGS, [
    "bitget",
    "okx",
    "binance",
    "bybit",
    "htx",
    "coinw",
    "kraken",
  ]);
  assert.deepEqual(
    Object.fromEntries(NATIVE_REFERRAL_SLUGS.map((slug) => [slug, REFERRAL_HELP[slug]?.reviewedAt])),
    {
      bitget: "2026-10-14",
      okx: "2026-10-14",
      binance: "2026-10-14",
      bybit: "2026-10-14",
      htx: null,
      coinw: "2026-10-14",
      kraken: "2026-10-14",
    },
  );
});

test("localized title builders preserve exact query text", () => {
  const cases = [
    ["en", "referral code"],
    ["id", "kode referral OKX"],
    ["es", "código de referido OKX"],
    ["pt-BR", "código de convite OKX"],
    ["zh-Hans", "OKX 邀请码"],
    ["tr", "OKX referans kodu"],
  ];

  for (const [locale, query] of cases) {
    const data = nativeReferralFor("okx", locale);
    assert.ok(data, `${locale} OKX native answer exists`);
    assert.ok(data.title.includes(query) || (locale === "zh-Hans" && data.title.includes("OKX 手续费、注册与 KYC")), `${locale} title includes exact query text`);
    assert.equal(isNativeReferralTitle(data.title, locale), true, `${locale} title is allowlisted`);
  }

  const hant = nativeReferralFor("okx", "zh-Hant");
  assert.equal(hant.title, null, "Traditional Chinese informational answer has no generated page title");
  assert.ok(
    hant.copy.verifiedTitle("OKX", "demo", hant.copy.noBenefit, "2026-10-14").includes("OKX 推薦碼"),
    "Traditional Chinese copy builder still preserves exact query text",
  );
});

test("missing benefit never invents a rebate percentage", () => {
  for (const slug of ["bybit", "coinw", "kraken"]) {
    const data = nativeReferralFor(slug, "en");
    assert.ok(data, `${slug} native answer exists`);
    assert.equal(data.benefit, data.copy.noBenefit);
    assert.doesNotMatch(data.benefit, /%/);
    assert.doesNotMatch(data.title ?? "", /Up to \d+%|% of fees back/);
  }
});

test("neutral and jurisdiction gates suppress codes instead of weakening policy", () => {
  const hant = nativeReferralFor("okx", "zh-Hant");
  assert.ok(hant, "Traditional Chinese keeps an informational answer");
  assert.equal(hant.neutral, true);
  assert.equal(hant.code, null);
  assert.equal(hant.title, null);
  assert.equal(hant.partnerDate, null);

  assert.equal(nativeReferralFor("okx", "vi"), null, "Vietnamese locale remains promotion-blocked");

  const trVisible = NATIVE_REFERRAL_SLUGS.filter((slug) => nativeReferralFor(slug, "tr") !== null);
  assert.deepEqual(trVisible, ["okx", "binance", "bybit"], "Turkish native answers expose only the three promoted native venues");

  for (const context of [{ locale: "tr" }, { locale: "en", market: "TR" }, { locale: "en", market: "US" }]) {
    assert.equal(nativeReferralFor("coinw", context.locale, context.market), null, `CoinW banned in ${JSON.stringify(context)}`);
  }
});

test("later-add gates carry the corrected Binance and Bybit constraints", () => {
  const binance = nativeReferralFor("binance", "en");
  assert.match(binance.later, /conditional affiliate rebinding/);
  assert.match(binance.later, /less than \$5,000 volume in the previous 90 days/);
  assert.match(binance.later, /\$150,000 eligible volume within 30 days/);
  assert.match(binance.later, /do not trade just to rebind/);

  const bybit = nativeReferralFor("bybit", "en");
  assert.match(bybit.later, /within 14 days/);
  assert.match(bybit.later, /Ordinary referral codes/);
  assert.match(bybit.later, /market-maker and institutional accounts are excluded/);
  assert.match(bybit.later, /cannot be changed or cancelled afterwards/);
  assert.doesNotMatch(bybit.later, /3 business days|approval can take/i);
});

async function renderReferralNative(locale, slug, market = "TR") {
  const dir = await mkdtemp(path.join(root, "tests/.tmp-referral-native-"));
  try {
    const entry = path.join(dir, "entry.mjs");
    const bundle = path.join(dir, "bundle.cjs");
    await writeFile(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { ReferralNativeAnswers } from "../../src/components/v3/ReferralNativeAnswers.jsx";
      const html = renderToStaticMarkup(React.createElement(ReferralNativeAnswers, {
        slug: ${JSON.stringify(slug)},
        locale: ${JSON.stringify(locale)},
        market: ${JSON.stringify(market)},
      }));
      console.log(html);
    `);

    const esbuild = path.join(root, "node_modules/.bin/esbuild");
    await access(esbuild);
    execFileSync(esbuild, [
      entry,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundle}`,
      "--loader:.css=empty",
      "--log-level=warning",
    ], { cwd: root, stdio: "pipe" });
    return execFileSync("node", [bundle], { cwd: root, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("ReferralNativeAnswers SSR keeps SourceLink attribution for representative native locales", async () => {
  const cases = [
    ["tr", "okx", "TR", /data-cta-placement="referral-verification-source"/],
    ["id", "okx", "ID", /data-cta-placement="referral-verification-source"/],
    ["zh-Hant", "okx", "TW", /data-source-plain="okx\.com"/],
  ];

  for (const [locale, slug, market, sourceExpectation] of cases) {
    const html = await renderReferralNative(locale, slug, market);
    assert.match(html, /id="referral-answer"/, `${locale} renders referral section`);
    assert.match(html, /data-cta-kind="source"/, `${locale} keeps source CTA attribution`);
    assert.match(html, sourceExpectation, `${locale} renders source through SourceLink policy`);
    assert.match(html, new RegExp(`${slug} ·`), `${locale} includes venue source label`);
  }
});

test('visible and schema partner FAQ construction respects explicit restricted markets', async () => {
  const { partnerVenueFaqFor, applyPartnerVenueFaqSchema } = await import('../src/data/partner-venue-faq.js');
  for (const [slug, locale, market] of [['bitget', 'id', 'TR'], ['coinw', 'en', 'US'], ['coinw', 'pt-BR', 'TR']]) {
    assert.equal(partnerVenueFaqFor(slug, locale, market), null, `${slug}/${locale}/${market}`);
    const schema = { '@type': 'FAQPage', mainEntity: [] };
    assert.deepEqual(applyPartnerVenueFaqSchema(schema, slug, locale, market), schema);
  }
});

test('locale aliases keep native titles and neutral Chinese/Vietnamese gates', () => {
  for (const [alias, locale] of [['id-ID', 'id'], ['es-MX', 'es'], ['pt', 'pt-BR'], ['tr-TR', 'tr'], ['zh-CN', 'zh-Hans']]) {
    const answer = nativeReferralFor('okx', alias);
    assert.equal(answer.title, nativeReferralFor('okx', locale).title);
    assert.equal(isNativeReferralTitle(answer.title, alias), true);
  }
  for (const alias of ['zh-TW', 'zh-HK', 'zh-hant']) {
    assert.equal(nativeReferralFor('okx', alias).code, null);
    assert.equal(nativeReferralFor('okx', alias).title, null);
  }
  assert.equal(nativeReferralFor('okx', 'vi-VN'), null);
});

test('review dates do not shift in western client timezones', () => {
  const script = `import { nativeReferralFor } from './src/data/referral-native.js'; console.log(JSON.stringify(['tr','id','es','zh-Hans'].map(locale => nativeReferralFor('okx', locale).title)));`;
  const render = TZ => execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: root, env: { ...process.env, TZ }, encoding: 'utf8' });
  assert.equal(render('America/Sao_Paulo'), render('UTC'));
  assert.equal(render('Pacific/Honolulu'), render('Asia/Shanghai'));
});

test("Binance sign-up answers start with the Pro-mode step (owner 2026-10-14) on code locales only", async () => {
  const { nativeReferralFor } = await import("../src/data/referral-native.js");
  const { BINANCE_PRO_STEP } = await import("../src/data/binance-pro-step.js");
  for (const locale of ["en", "zh-Hans", "es", "pt-BR", "id", "tr"]) {
    const native = nativeReferralFor("binance", locale);
    if (!native?.code) continue;
    assert.ok(native.entry.startsWith(BINANCE_PRO_STEP[locale]), `${locale}: entry starts with the Pro step`);
    assert.equal(native.faq[0].answer, native.entry);
  }
  assert.equal(BINANCE_PRO_STEP["zh-Hans"], "注册时请使用币安专业版（Pro），不要选简易版（Lite）。");
  const okx = nativeReferralFor("okx", "en");
  assert.ok(!okx?.entry?.includes("Binance Pro"), "other venues unchanged");
});
