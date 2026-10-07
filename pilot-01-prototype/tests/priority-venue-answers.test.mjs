import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizePriorityLocale,
  priorityVenueAnswerFor,
  priorityVenueAnswers,
  priorityVenueAnswerSlugs,
} from "../src/data/priority-venue-answers.js";
import { mergePriorityVenueSeo } from "../src/data/priority-venue-seo.js";

const locales = ["en", "zh-Hans", "zh-Hant"];
const blockedCommercialUrlPattern = /(?:bsmkweb|partner\.bitget|topzhjdgxcb|accounts\.binance|binance\.com\/join|okx\.com\/join|backpack\.exchange\/join|affiliate_id|channelCode|utm_medium|ref=11350287|nexu888|LUCKX|CANDY007|INS898|1836370407|NEXU888|luckybitcoin)/i;
const internalWorkflowPattern = /(?:What should CTA say|answer-engine extraction|Search intent shortcut|Page role|future editor|staged for NexuAlpha publication review)/i;
const expectedReviewedAt = {
  hyperliquid: "2026-09-22",
  uniswap: "2026-09-22",
  gmx: "2026-09-28",
  drift: "2026-09-29",
  deribit: "2026-09-29",
};

const stringify = (value) => JSON.stringify(value, null, 2);

test("priority venue answers expose exact supported locales only", () => {
  assert.deepEqual(priorityVenueAnswerSlugs, ["hyperliquid", "uniswap", "gmx", "drift", "deribit"]);
  assert.equal(normalizePriorityLocale("en-US"), "en");
  assert.equal(normalizePriorityLocale("zh-CN"), "zh-Hans");
  assert.equal(normalizePriorityLocale("zh-TW"), "zh-Hant");
  assert.equal(normalizePriorityLocale("ja"), null);
  assert.equal(priorityVenueAnswerFor("uniswap", "ja"), null, "unsupported locales must not silently render English");
  assert.equal(priorityVenueAnswerFor("unknown", "en"), null);
});

test("priority venue answers are complete, concise and source-backed", () => {
  for (const slug of priorityVenueAnswerSlugs) {
    for (const locale of locales) {
      const answer = priorityVenueAnswerFor(slug, locale);
      assert.ok(answer, `${slug}/${locale}`);
      assert.equal(answer.slug, slug);
      assert.equal(answer.locale, locale);
      assert.equal(answer.reviewedAt, expectedReviewedAt[slug], `${slug}/${locale}.reviewedAt`);
      assert.ok(answer.reviewedLabel.length >= 20, `${slug}/${locale}.reviewedLabel`);
      assert.ok(answer.title.trim().length > 0, `${slug}/${locale}.title`);
      assert.ok(answer.body.trim().length > 0, `${slug}/${locale}.body`);
      assert.ok(answer.body.length <= 520, `${slug}/${locale}.body should fit the hero block`);
      assert.ok(answer.checks.length >= 3 && answer.checks.length <= 4, `${slug}/${locale}.checks mobile height`);
      assert.ok(answer.boundary.trim().length > 0, `${slug}/${locale}.boundary`);
      assert.ok(answer.seoTitle.trim().length > 0, `${slug}/${locale}.seoTitle`);
      assert.ok(answer.seoDescription.trim().length > 0, `${slug}/${locale}.seoDescription`);
      assert.ok(answer.sources.length >= 4, `${slug}/${locale}.sources`);
      assert.ok(answer.internalLinks.length >= 2 && answer.internalLinks.length <= 3, `${slug}/${locale}.internalLinks`);
      assert.ok(answer.faq.length >= 4 && answer.faq.length <= (slug === "uniswap" ? 6 : 5), `${slug}/${locale}.faq`);
      if (["hyperliquid", "uniswap"].includes(slug)) {
        for (const groupName of ["fit", "avoid", "nextSteps"]) {
          assert.ok(answer[groupName]?.label?.length >= 2, `${slug}/${locale}.${groupName}.label`);
          assert.ok(answer[groupName]?.items?.length >= 2, `${slug}/${locale}.${groupName}.items`);
        }
      }

      const text = stringify(answer);
      assert.doesNotMatch(text, internalWorkflowPattern, `${slug}/${locale}: no internal workflow copy`);
      assert.doesNotMatch(text, blockedCommercialUrlPattern, `${slug}/${locale}: no invitation links or codes`);

      for (const [label, href] of answer.sources) {
        assert.ok(label.length >= 6, `${slug}/${locale}.source.label`);
        assert.match(href, /^https:\/\//, `${slug}/${locale}.source.href`);
      }
      for (const [label, href] of answer.internalLinks) {
        assert.ok(label.length >= 6, `${slug}/${locale}.internal.label`);
        assert.match(href, /^\//, `${slug}/${locale}.internal.href`);
        assert.notEqual(href, "/topics/derivatives#dex-wallet-safety", `${slug}/${locale}: removed dead topic anchor`);
      }
      for (const [question, response, sourceUrls] of answer.faq) {
        assert.ok(question.length >= 12, `${slug}/${locale}.faq.question`);
        assert.ok(response.trim().length > 0, `${slug}/${locale}.faq.answer`);
        assert.ok(Array.isArray(sourceUrls) && sourceUrls.length >= 1, `${slug}/${locale}.faq.sourceUrls`);
        for (const href of sourceUrls) assert.match(href, /^https:\/\//, `${slug}/${locale}.faq.sourceUrl`);
      }
    }
  }
});

test("venue-specific search intent boundaries are visible", () => {
  const hyperliquid = priorityVenueAnswerFor("hyperliquid", "en");
  assert.match(stringify(hyperliquid), /funded-account/i);
  assert.match(stringify(hyperliquid), /Best fit|更适合|更適合/i);
  assert.match(stringify(hyperliquid), /Decision order before leaving NexuAlpha|离开 NexuAlpha 前的顺序|離開 NexuAlpha 前的順序/i);
  assert.match(stringify(hyperliquid), /rolling 14-day/i);
  assert.match(stringify(hyperliquid), /HIP-3/i);
  assert.match(stringify(hyperliquid), /sub-account/i);
  assert.match(stringify(hyperliquid), /vault-volume/i);
  assert.match(stringify(hyperliquid), /hypercore\/vaults/i);
  assert.match(stringify(hyperliquid), /hourly/i);
  assert.match(stringify(hyperliquid), /maintenance margin/i);
  assert.match(stringify(hyperliquid), /Does Hyperliquid have cashback or a referral discount/i);
  assert.match(stringify(hyperliquid), /referral discounts do not apply to vaults or sub-accounts/i);
  assert.match(stringify(hyperliquid), /hyperliquid-docs\/referrals/i);
  assert.match(stringify(hyperliquid), /topics\/no-kyc/i);
  assert.doesNotMatch(stringify(hyperliquid), /guaranteed cashback|unconditional cashback|无条件返现承诺|無條件返現承諾/i);

  const hyperliquidZhHans = priorityVenueAnswerFor("hyperliquid", "zh-Hans");
  const hyperliquidZhHant = priorityVenueAnswerFor("hyperliquid", "zh-Hant");
  assert.match(stringify(hyperliquidZhHans), /Hyperliquid 有 cashback 或邀请折扣吗/);
  assert.match(stringify(hyperliquidZhHans), /邀请折扣不适用于 vault 或子账户/);
  assert.match(stringify(hyperliquidZhHant), /Hyperliquid 有 cashback 或邀請折扣嗎/);
  assert.match(stringify(hyperliquidZhHant), /邀請折扣不適用於 vault 或子帳戶/);

  const uniswap = priorityVenueAnswerFor("uniswap", "en");
  assert.match(stringify(uniswap), /testnet/i);
  assert.match(stringify(uniswap), /Best fit|更适合|更適合/i);
  assert.match(stringify(uniswap), /Decision order before signing|签名前的顺序|簽名前的順序/i);
  assert.match(stringify(uniswap), /API/i);
  assert.match(stringify(uniswap), /live swap/i);
  assert.match(stringify(uniswap), /Ethereum Sepolia/i);
  assert.match(stringify(uniswap), /Base Sepolia/i);
  assert.match(stringify(uniswap), /disconnecting a wallet revoke/i);
  assert.match(stringify(uniswap), /Permit2/i);
  assert.match(stringify(uniswap), /universal-router\/overview/i);
  assert.match(stringify(uniswap), /cex-vs-dex-vs-perp-dex/i);
  assert.match(stringify(uniswap), /familiar page does not make every token or approval safe|熟悉页面不代表每个代币或授权都安全|熟悉頁面不代表每個代幣或授權都安全/i);

  const gmx = priorityVenueAnswerFor("gmx", "en");
  assert.match(stringify(gmx), /GM\/GLV/i);
  assert.match(stringify(gmx), /oracle(?:-based)? (?:pricing|execution)/i);
  assert.match(stringify(gmx), /borrow/i);
  assert.match(stringify(gmx), /price impact/i);
  assert.match(stringify(gmx), /collateral token|抵押币种|抵押幣種/i);
  assert.match(stringify(gmx), /slippage|滑点|滑點/i);
  assert.match(stringify(gmx), /cex-vs-dex-vs-perp-dex/i);

  const drift = priorityVenueAnswerFor("drift", "en");
  assert.match(stringify(drift), /documentation redirect|documentation route/i);
  assert.match(stringify(drift), /docs\.drift\.trade/i);
  assert.match(stringify(drift), /Stop condition/i);
  assert.match(stringify(drift), /Drift-owned source/i);
  assert.match(stringify(drift), /does not promise Drift availability/i);
  assert.match(stringify(drift), /sponsored registration/i);
  assert.match(stringify(drift), /Recovery Update/i);
  assert.match(stringify(drift), /cex-vs-dex-vs-perp-dex/i);
  assert.doesNotMatch(stringify(drift), /Velocity mechanism|normal current trading is available|TVL >|top-ranked|region support is available|maker\/taker fee|fee rebate & ecosystem access|Solana perps fee rebate/i);

  const driftZhHans = priorityVenueAnswerFor("drift", "zh-Hans");
  const driftZhHant = priorityVenueAnswerFor("drift", "zh-Hant");
  assert.match(stringify(driftZhHans), /文档重定向/);
  assert.match(stringify(driftZhHans), /停止条件/);
  assert.match(stringify(driftZhHans), /sponsored registration/);
  assert.match(stringify(driftZhHans), /不能证明当前充值、交易、奖励、TVL、排名、费率或地区资格正常可用/);
  assert.match(stringify(driftZhHant), /文件重新導向/);
  assert.match(stringify(driftZhHant), /停止條件/);
  assert.match(stringify(driftZhHant), /sponsored registration/);
  assert.match(stringify(driftZhHant), /不能證明目前儲值、交易、獎勵、TVL、排名、費率或地區資格正常可用/);

  const deribit = priorityVenueAnswerFor("deribit", "en");
  assert.match(stringify(deribit), /options, futures or perpetual route/i);
  assert.match(stringify(deribit), /10% user trading-fee discount|10% trading-fee discount/i);
  assert.match(stringify(deribit), /first six months/i);
  assert.match(stringify(deribit), /DRB Panama/i);
  assert.match(stringify(deribit), /Deribit FZE/i);
  assert.match(stringify(deribit), /spot is excluded|spot discount/i);
  assert.match(stringify(deribit), /2026-09-09/i);
  assert.match(stringify(deribit), /2027-01-01/i);
  assert.match(stringify(deribit), /25944777728797-Affiliate-Program/i);
  assert.match(stringify(deribit), /NexuAlpha partner economics stay out of public user-facing copy/i);
  assert.match(stringify(deribit), /liquidation fees/i);
  assert.match(stringify(deribit), /margin/i);
  assert.match(stringify(deribit), /delivery|settlement/i);
  assert.match(stringify(deribit), /tokenized-stocks-vs-perpetuals/i);
  assert.match(stringify(deribit), /25944746248989-Fees/i);
  assert.match(stringify(deribit), /25944811317149-Margin-types-and-usage/i);
  assert.doesNotMatch(stringify(deribit), /\b(?:[2-9]\d|\d{3,})%\s+(?:NexuAlpha\s+)?commission|referrer commission|private commission rate/i);
  assert.doesNotMatch(stringify(deribit), /Source-backed Deribit|基于官方来源的 Deribit|基於官方來源的 Deribit/);});

test("Chinese answers do not silently reuse the English answer", () => {
  for (const slug of priorityVenueAnswerSlugs) {
    const en = priorityVenueAnswerFor(slug, "en");
    const zhHans = priorityVenueAnswerFor(slug, "zh-Hans");
    const zhHant = priorityVenueAnswerFor(slug, "zh-Hant");
    assert.notEqual(zhHans.body, en.body, `${slug}.zh-Hans.body localized`);
    assert.notEqual(zhHant.body, en.body, `${slug}.zh-Hant.body localized`);
    assert.match(zhHans.body, /[\u4e00-\u9fff]/, `${slug}.zh-Hans has CJK`);
    assert.match(zhHant.body, /[\u4e00-\u9fff]/, `${slug}.zh-Hant has CJK`);
  }
});

test("SEO merge consumes the same visible FAQ and sources", () => {
  const merged = mergePriorityVenueSeo("uniswap", "zh-Hans", { title: "Existing title", relatedLinks: ["/existing"] });
  const visible = priorityVenueAnswerFor("uniswap", "zh-Hans");
  assert.equal(merged.title, "Existing title", "existing route identity title is preserved");
  assert.equal(merged.description, visible.seoDescription);
  assert.equal(merged.reviewedAt, visible.reviewedAt);
  assert.deepEqual(merged.sourceUrls, visible.sources.map(([, href]) => href));
  assert.deepEqual(merged.directAnswer, {
    question: visible.faq[0][0],
    answer: visible.faq[0][1],
    citations: visible.faq[0][2],
  });
  assert.deepEqual(merged.faq, visible.faq.slice(1));
  assert.ok(merged.relatedLinks.includes("/existing"));
  assert.ok(merged.relatedLinks.includes("/compare/uniswap-vs-jupiter"));
  assert.equal(mergePriorityVenueSeo("uniswap", "ja", { title: "Keep" }).title, "Keep");});
