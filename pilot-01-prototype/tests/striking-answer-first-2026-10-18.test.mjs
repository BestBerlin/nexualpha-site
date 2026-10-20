import { strikingDistanceVenueTitle, isStrikingDistanceVenueTitle } from '../src/data/striking-distance-venue-copy.js';
// Striking-distance rewrites, answer-first money pages and data freshness stamps (SEO pass 2026-10-18).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer as createViteServer } from "vite";
import { SERP_CTR_NEWS_OVERRIDES, serpCtrNewsOverride } from "../src/data/serp-ctr-news-overrides.js";
import { strikingPageOverride, strikingPagePaths } from "../src/data/striking-page-overrides.js";
import { ANSWER_FIRST_LOCALES, ANSWER_FIRST_VENUES, answerLength, compareShortAnswer, directoryShortAnswer, ratesDataModified, ratesShortAnswer, venueAnswerModified, venueShortAnswer } from "../src/data/answer-first.js";
import { dataUpdatedStamp } from "../src/data/data-updated.js";
import { feeFact } from "../src/data/exchange-facts.js";
import { REFERRAL_PARTNERS } from "../src/data/referral-partners.generated.js";
import { NEUTRAL_CTA_LOCALE_LIST } from "../src/data/locale-policy.js";
import { routeMetadata } from "../worker/index.js";

const budget = (locale) => (/^(zh|ja|ko)/.test(locale) ? 32 : 60);
const HYPE = /\b(best ever|guaranteed?|risk-free|100% safe|moon|skyrocket)\b/i;
const env = { ASSETS: { fetch: async () => new Response("missing", { status: 404 }) } };
const CODES = REFERRAL_PARTNERS.map((partner) => partner.inviteCode).filter(Boolean);

const REWRITTEN_NEWS = [
  "how-to-register-okx-account-verify-identity-safely",
  "okx-api-upcoming-changes-websocket-amend-cancel-order-controls",
  "why-is-bitcoin-up-today-back-above-83k-shorts-squeezed-chip-perps",
  "how-to-register-mexc-account-complete-primary-kyc-and-secure-first-deposit",
  "okx-api-kyc-order-tagged-rate-limit-migration-checklist",
  "how-to-use-jupiter-connect-wallet-and-make-first-swap-safely",
  "coinbase-address-allowlist-setup-network-hold-tutorial",
  "how-to-onboard-hyperliquid-connect-wallet-enable-trading-and-test-deposit",
  "how-to-set-up-coinbase-advanced-trade-api-key-portfolio-permissions-safely",
  "how-to-unlock-kraken-pro-stock-trading-and-verify-equities-eligibility",
  "binance-travel-rule-address-book-satoshi-test-checklist",
  "how-to-use-uniswap-connect-wallet-and-make-first-swap-safely",
  "okx-websocket-orders-state-live-finality-checklist",
];

test("news rewrites lead with the searched words and stay within the snippet budgets", () => {
  for (const slug of REWRITTEN_NEWS) {
    const entry = SERP_CTR_NEWS_OVERRIDES[slug];
    assert.ok(entry, slug);
    for (const [locale, fields] of [["en", entry], ...Object.entries(entry.locales || {})]) {
      assert.ok((isStrikingDistanceVenueTitle(fields.title, locale) || fields.title.length <= budget(locale)), `${slug}/${locale} title ${fields.title.length}`);
      assert.ok(fields.description.length >= 110 && fields.description.length <= (locale === "en" ? 155 : 160), `${slug}/${locale} description ${fields.description.length}`);
      assert.doesNotMatch(`${fields.title} ${fields.description} ${fields.h1 || ""} ${fields.intro || ""}`, HYPE);
      if (fields.intro && locale === "en") assert.ok(answerLength(fields.intro) >= 35 && answerLength(fields.intro) <= 70, `${slug} intro ${answerLength(fields.intro)} words`);
    }
  }
  const okx = serpCtrNewsOverride("how-to-register-okx-account-verify-identity-safely", "en");
  assert.equal(okx.title, "OKX Account: How to Register and Verify Identity (2026)");
  assert.equal(okx.h1, "OKX Account: How to Register and Verify Your Identity (KYC)");
  assert.match(okx.intro, /^To register an OKX account/);
  assert.equal(serpCtrNewsOverride("how-to-register-okx-account-verify-identity-safely", "zh-Hans").h1, "OKX 怎么注册账户并完成身份认证（KYC）");
  assert.equal(serpCtrNewsOverride("okx-api-kyc-order-tagged-rate-limit-migration-checklist", "en").title, "OKX API Rate Limits: KYC Level and Order-Tagged Limits");
  assert.equal(serpCtrNewsOverride("okx-websocket-orders-state-live-finality-checklist", "en").title, "OKX RPI & Post-Only Orders: WebSocket state live Change");
  // Earlier passes keep their fields when the 2026-10-18 entry only adds a headline and answer.
  assert.equal(serpCtrNewsOverride("how-to-use-jupiter-connect-wallet-and-make-first-swap-safely", "zh-Hans").title, "Jupiter 怎么用（2026）：连接钱包与首次兑换");
  assert.equal(serpCtrNewsOverride("how-to-use-jupiter-connect-wallet-and-make-first-swap-safely", "zh-Hans").h1, "Jupiter 怎么用：连接钱包并完成首次兑换");
  assert.equal(serpCtrNewsOverride("okx-api-upcoming-changes-websocket-amend-cancel-order-controls", "en").title, "OKX API Docs: Upcoming WebSocket Amend & Cancel Changes");
});

test("non-article pages: titles match the queries, fee figures come from exchange-facts", () => {
  for (const path of strikingPagePaths()) {
    for (const locale of ["en", "zh-Hans"]) {
      const override = strikingPageOverride(path, locale);
      if (!override) continue;
      assert.ok(override.title.length <= (path === "/exchanges/deribit" ? 80 : budget(locale)), `${path}/${locale} title ${override.title.length}`);
      assert.ok(override.description.length >= (path === "/exchanges/deribit" ? 90 : 110) && override.description.length <= (locale === "en" ? 155 : 160), `${path}/${locale} description ${override.description.length}`);
    }
  }
  const perp = feeFact("deribit", "perp");
  assert.equal(strikingPageOverride("/exchanges/deribit", "en").title, strikingDistanceVenueTitle("deribit", "en"));
  assert.ok(strikingPageOverride("/exchanges/deribit", "en").description.includes(`(official API, ${perp.checkedOn})`));
  assert.equal(strikingPageOverride("/compare/okx-vs-mexc", "en").title, "OKX vs MEXC (2026): Fees, Futures, Listings and KYC");
  assert.equal(strikingPageOverride("/telegram", "en").title, "NexuAlpha Telegram Bot: Price Alerts & Daily Research Digest");
  assert.equal(strikingPageOverride("/eu", "zh-Hans"), null, "no zh edition is published for /eu");
});

test("the Worker head serves the reviewed titles (and leaves other editions alone)", async () => {
  const deribit = await routeMetadata(new URL("https://nexualpha.com/exchanges/deribit"), env);
  assert.equal(deribit.title, strikingDistanceVenueTitle("deribit", "en"));
  const deribitZh = await routeMetadata(new URL("https://nexualpha.com/zh-hans/exchanges/deribit"), env);
  assert.equal(deribitZh.title, strikingPageOverride("/exchanges/deribit", "zh-Hans").title);
  const eu = await routeMetadata(new URL("https://nexualpha.com/eu"), env);
  assert.equal(eu.title, "Crypto Exchanges in the EU (2026): MiCA, SEPA and KYC Checks");
  const telegramEs = await routeMetadata(new URL("https://nexualpha.com/es/telegram"), env);
  assert.notEqual(telegramEs.title, strikingPageOverride("/telegram", "en").title);
  const rates = await routeMetadata(new URL("https://nexualpha.com/rates"), env);
  const ratesSchema = [rates.schema].flat().find((node) => node?.["@type"] === "WebPage");
  assert.equal(ratesSchema.dateModified, ratesDataModified());
});

test("money-page short answers: 40-60 words, a figure, a source and an as-of date", () => {
  for (const slug of ANSWER_FIRST_VENUES) {
    const answer = venueShortAnswer(slug, "en");
    assert.ok(answer, slug);
    const words = answerLength(answer.text, "en");
    assert.ok(words >= 40 && words <= 60, `${slug}: ${words} words`);
    assert.match(answer.text, /\d+(?:\.\d+)?%/, `${slug} states a fee`);
    assert.match(answer.text, /\b[a-z0-9-]+\.com\b/, `${slug} names the official source`);
    assert.match(answer.text, /20\d\d-\d\d-\d\d/, `${slug} carries an as-of date`);
    assert.doesNotMatch(answer.text, /commission|we earn|affiliate|not (?:financial|investment) advice/i, `${slug}: altruistic, no fine print`);
  }
  assert.equal(venueShortAnswer("bitget", "en").text, "Bitget charges 0.10% maker / 0.10% taker on spot and 0.02% / 0.06% on USDT perpetuals at its standard tier. With code nexu888, up to 60% of your trading fees come back automatically every day: 100,000 USDT of futures volume → up to $36 returned. Fees from bitget.com's official fee page, as of 2026-10-10; rebate terms confirmed 2026-10-10.");
  assert.match(venueShortAnswer("okx", "zh-Hans").text, /合约交易量 100,000 U → 最高返还 \$20/);
  for (const [a, b] of [["bitget", "okx"], ["binance", "okx"], ["bybit", "bitget"], ["binance", "bitget"]]) {
    const answer = compareShortAnswer(a, b, "en");
    const words = answerLength(answer.text, "en");
    assert.ok(words >= 40 && words <= 60, `${a}-vs-${b}: ${words} words`);
  }
  for (const answer of [ratesShortAnswer("en"), directoryShortAnswer(24, "en")]) {
    const words = answerLength(answer.text, "en");
    assert.ok(words >= 40 && words <= 60, `${answer.text}: ${words} words`);
  }
  // MEXC fees are held back in exchange-facts.js; the lead quotes the two figures that note records.
  assert.match(feeFact("mexc", "spot").note, /0% spot/);
  assert.match(feeFact("mexc", "spot").note, /0\/0\.08%/);
  assert.equal(venueAnswerModified("bitget", "2026-09-15"), "2026-10-10");
});

test("locale rules: neutral editions carry no code or rebate, Türkiye drops Bitget, every shipped locale has copy", () => {
  for (const locale of ANSWER_FIRST_LOCALES) {
    for (const slug of ANSWER_FIRST_VENUES) {
      const answer = venueShortAnswer(slug, locale);
      if (locale === "tr" && slug === "bitget") { assert.equal(answer, null); continue; }
      assert.ok(answer?.text, `${slug}/${locale}`);
      if (NEUTRAL_CTA_LOCALE_LIST.includes(locale)) {
        for (const code of CODES) assert.ok(!answer.text.includes(code), `${slug}/${locale} shows no code ${code}`);
      }
    }
    assert.ok(ratesShortAnswer(locale)?.text, `rates/${locale}`);
    assert.ok(compareShortAnswer("bitget", "okx", locale) || locale === "tr", `compare/${locale}`);
  }
  assert.equal(compareShortAnswer("bitget", "okx", "tr"), null);
  assert.doesNotMatch(ratesShortAnswer("tr").text, /Bitget/);
  assert.doesNotMatch(compareShortAnswer("bitget", "okx", "vi").text, /nexu888|\d+% của|hoàn/i);
});

test("freshness stamp: live data prints date + SGT clock, reviewed data prints its review date only", () => {
  assert.equal(dataUpdatedStamp("2026-10-18T14:49:00Z", "zh-Hans").text, "数据更新于 2026-10-18 22:49 SGT");
  assert.equal(dataUpdatedStamp("2026-10-18T14:49:00Z", "en").text, "Data updated 2026-10-18 22:49 SGT");
  assert.equal(dataUpdatedStamp("2026-10-15", "en").text, "Data updated 2026-10-15 SGT");
  for (const locale of ANSWER_FIRST_LOCALES) assert.match(dataUpdatedStamp("2026-10-18T14:49:00Z", locale).text, /2026-10-18 22:49 SGT$/, locale);
});

let vite;
async function render(url, options) {
  if (!vite) vite = await createViteServer({ appType: "custom", logLevel: "error", server: { middlewareMode: true } });
  const { render: renderPage } = await vite.ssrLoadModule("/src/entry-server.jsx");
  return renderPage(url, options);
}
test.after(async () => { await vite?.close(); });
const text = (html) => html.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, "\"").replace(/\s+/g, " ");

test("SSR: money pages open with the short answer, data pages print the SGT stamp", async () => {
  const bitget = await render("/exchanges/bitget");
  assert.match(bitget, /data-short-answer-placement="venue-hero"/);
  assert.ok(text(bitget).includes("up to $36 returned"), "bitget short answer in SSR");
  assert.equal((bitget.match(/data-short-answer=""/g) || []).length, 1, "one short answer on the profile");
  const vi = await render("/vi/exchanges/okx");
  assert.match(vi, /data-short-answer-placement="venue-hero"/);
  assert.ok(!text(vi).includes("nexu888"), "vi profile carries no code");
  const compare = await render("/compare/bitget-vs-okx");
  assert.match(compare, /data-short-answer-placement="compare-hero"/);
  const rates = await render("/rates");
  assert.match(rates, /data-short-answer-placement="rates-hero"/);
  assert.ok(text(rates).includes(`Data updated ${ratesDataModified()} SGT`));
  const directory = await render("/exchanges");
  assert.match(directory, /data-short-answer-placement="directory-hero"/);
  const deposit = await render("/zh-hans/churujin");
  assert.match(text(deposit), /数据更新于 20\d\d-\d\d-\d\d SGT/);
  const generatedAt = "2026-10-18T14:49:00.000Z";
  const feed = { generatedAt, liquidations: { source: "test", h1: { longUsd: 1, shortUsd: 1, totalUsd: 2, orders: 1 }, h4: { longUsd: 1, shortUsd: 1, totalUsd: 2, orders: 1 }, h24: { longUsd: 1, shortUsd: 1, totalUsd: 2, orders: 1 } }, funding: { generatedAt, rows: [] } };
  const liquidations = await render("/liquidations", { marketEvents: feed });
  assert.ok(text(liquidations).includes("Data updated 2026-10-18 22:49 SGT"), "liquidations stamp in SSR");
  const liquidationsZh = await render("/zh-hans/liquidations", { marketEvents: feed });
  assert.ok(text(liquidationsZh).includes("数据更新于 2026-10-18 22:49 SGT"));
});

test("SSR: a rewritten news article shows the reviewed headline and answer", async () => {
  const feed = JSON.parse(readFileSync(new URL("../public/content/news-feed.json", import.meta.url), "utf8"));
  const article = feed.articles.find((item) => item.slug === "how-to-register-okx-account-verify-identity-safely");
  const html = await render(`/news/${article.slug}`, { newsArticles: [article] });
  assert.match(html, /<h1 class="news-detail__title">OKX Account: How to Register and Verify Your Identity \(KYC\)<\/h1>/);
  assert.match(html, /data-search-answer="how-to-register-okx-account-verify-identity-safely"/);
  const zh = await render(`/zh-hans/news/${article.slug}`, { newsArticles: [article] });
  assert.ok(text(zh).includes("OKX 怎么注册账户并完成身份认证（KYC）"));
  assert.ok(text(zh).includes("简短回答："));
});
