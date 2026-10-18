import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  compareDirectAnswerFor,
  compareSeoOverrideFromDirectAnswer,
  normalizeCompareAnswerLocale,
} from "../src/data/compare-direct-answers.js";
import { computeRouteSeo } from "../src/data/seo-injection.js";
import { budgetTitle, routeMetaDescription, titleBudgetForLocale } from "../src/data/meta-description.js";
import { routeMetadata } from "../worker/index.js";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
// Transparent partnership disclosures may say commission/佣金; the public-copy guard still blocks private economics and guarantees.
const forbiddenPublicCopy = /\bCTA\b|private partner economics|private commission|guaranteed|risk-free|公开私人合作经济项|公開私人合作經濟項|私佣/i;

test("deployed comparison metadata matches the visible answer source without creating a venue route", async () => {
  for (const locale of ["en", "zh-Hans", "zh-Hant"]) {
    const url = new URL(`https://nexualpha.com/compare/bybit-vs-bitget?locale=${locale}`);
    const client = computeRouteSeo({ url: url.href, locale });
    const server = await routeMetadata(url, {});
    assert.equal(server.status, 200);
    assert.equal(server.title, client.title);
    assert.equal(server.description, client.description);
    assert.equal(server.canonical, client.canonical);
    const graph = server.schema?.["@graph"] || (Array.isArray(server.schema) ? server.schema : [server.schema]);
    const serverFaq = graph.find((s) => s?.["@type"] === "FAQPage");
    const clientFaq = client.schemas.find((s) => s?.["@type"] === "FAQPage");
    assert.deepEqual(serverFaq?.mainEntity, clientFaq?.mainEntity);
    assert.ok(serverFaq?.mainEntity?.length > 0);
  }
  const fakeVenue = await routeMetadata(new URL("https://nexualpha.com/exchanges/bybit-vs-bitget"), {});
  assert.equal(fakeVenue.status, 404);
});

async function renderComparePage(locale) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-compare-direct-answer-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    await writeFile(entryPath, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { CompareDeepPage } from "../../src/components/v3/V3Pages.jsx";
      import { venueDatabase } from "../../src/data/venue-database.js";
      import { v3Copy } from "../../src/data/v3-product.js";
      const locale = ${JSON.stringify(locale)};
      const html = renderToStaticMarkup(React.createElement(CompareDeepPage, {
        copy: { ...v3Copy(locale), common: { dimension: "Dimension" }, assetCapabilities: { none: "None" } },
        locale,
        selected: ["bybit", "bitget"],
        venues: Object.values(venueDatabase),
        updates: [],
        market: "unknown",
        product: "unknown",
      }));
      console.log(html);
    `);

    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await access(esbuildBin);
    execFileSync(esbuildBin, [
      entryPath,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundlePath}`,
      "--loader:.css=empty",
      "--loader:.svg=text",
      "--loader:.webp=file",
      "--log-level=warning",
    ], { cwd: projectRoot, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

    const bundle = await readFile(bundlePath, "utf8");
    return execFileSync("node", ["-"], { cwd: projectRoot, input: bundle, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

test("compare direct answer is independent from venue priority answers and supports exact content locales", () => {
  assert.equal(normalizeCompareAnswerLocale("en-US"), "en");
  assert.equal(normalizeCompareAnswerLocale("zh-CN"), "zh-Hans");
  assert.equal(normalizeCompareAnswerLocale("zh-TW"), "zh-Hant");
  assert.equal(normalizeCompareAnswerLocale("ja-JP"), "ja");
  assert.equal(normalizeCompareAnswerLocale("pt-BR"), "pt-BR");
  assert.equal(normalizeCompareAnswerLocale("pt-PT"), "pt-BR");
  assert.equal(normalizeCompareAnswerLocale("ar-AE"), "ar");

  for (const locale of ["en", "zh-Hans", "zh-Hant"]) {
    const answer = compareDirectAnswerFor("bybit-vs-bitget", locale);
    assert.equal(answer.slug, "bybit-vs-bitget");
    assert.equal(answer.locale, locale);
    assert.equal(answer.reviewedAt, "2026-09-22");
    assert.match(answer.searchIntent.detail, /32 impressions|32 次|32 次曝光/);
    assert.ok(answer.productTypes.length >= 3);
    assert.equal(answer.searchDemand.length, locale === "en" ? 5 : 4);
    assert.ok(answer.checks.length === 3);
    assert.ok(answer.nextSteps.length >= 3);
    assert.ok(answer.sourceLinks.length >= 14);
    assert.ok(answer.internalLinks.some(([, href]) => href === "/compare/bybit-vs-bitget") === false, "answer should not self-link as a fake venue");
    const serialized = JSON.stringify(answer);
    assert.match(serialized, /FAQ-xStocks-on-Bybit/);
    assert.match(serialized, /7700532076057/);
    assert.match(serialized, /12560603892733/);
    assert.match(serialized, /12560603795184/);
    assert.match(serialized, /Copy-Trading-Profit-Sharing-Explained/);
    assert.match(serialized, /9083311039641/);
    assert.match(serialized, /Unified-Trading-Account-Asset-Page/);
    assert.match(serialized, /FAQ-Unified-Trading-Account/);
    assert.match(serialized, /12560603885783/);
    assert.match(serialized, /12560603890654/);
    assert.match(serialized, /Unified Trading Account \(UTA\)|统一交易账户（UTA）|統一交易帳戶（UTA）/);
    assert.match(serialized, /Bybit alternatives|Bybit 替代选择|Bybit 替代選擇/);
    assert.match(serialized, /supported collateral|支持抵押品|支援抵押品/);
    assert.match(serialized, /liquidation rules|清算规则|清算規則/);
    assert.match(serialized, /Adventure Zone & xStocks/);
    assert.match(serialized, /First-time account route|官方路径|官方路徑/);
    assert.match(serialized, /protected registration path|受保护的开户注册路径|受保護的開戶註冊路徑/);
    assert.doesNotMatch(serialized, forbiddenPublicCopy);
  }

  for (const locale of ["ja", "ko", "tr", "ar"]) {
    const answer = compareDirectAnswerFor("bybit-vs-bitget", locale);
    assert.equal(answer.slug, "bybit-vs-bitget");
    assert.equal(answer.locale, locale);
    assert.equal(answer.reviewedAt, "2026-09-22");
    assert.ok(answer.title.length > 20);
    assert.ok(answer.body.length > 50);
    assert.ok(answer.seoQuestion.length > 20);
    assert.ok(answer.sourceLinks.length >= 14);
    assert.ok(answer.internalLinks.some(([, href]) => href === "/compare/bybit-vs-bitget") === false, "answer should not self-link as a fake venue");
    assert.doesNotMatch(JSON.stringify(answer), forbiddenPublicCopy);
  }
});

test("R36 priority comparison direct answers have deep localized AEO coverage", () => {
  const priorityPairs = ["binance-vs-okx", "bybit-vs-bitget", "hyperliquid-vs-dydx"];
  const priorityLocales = ["ja", "ko", "tr", "pt-BR"];

  for (const slug of priorityPairs) {
    for (const locale of priorityLocales) {
      const answer = compareDirectAnswerFor(slug, locale);
      assert.ok(answer, `${slug} ${locale}: direct answer should exist`);
      assert.equal(answer.locale, locale, `${slug} ${locale}: locale should not fall back`);
      assert.ok(answer.decisionCard?.title?.length > 20, `${slug} ${locale}: decision card should be localized`);
      assert.ok(answer.productTypes.length >= 3, `${slug} ${locale}: productTypes should be deep enough`);
      assert.ok(answer.checks.length >= 3, `${slug} ${locale}: checks should be deep enough`);
      assert.ok(answer.searchDemand.length >= 3, `${slug} ${locale}: searchDemand should be deep enough`);
      assert.ok(answer.nextSteps.length >= 3, `${slug} ${locale}: nextSteps should be deep enough`);
      assert.ok(answer.faq.length >= 3, `${slug} ${locale}: FAQ should expose at least three entries`);
      assert.ok(answer.sourceLinks.length >= 4, `${slug} ${locale}: source links should stay attached`);
      assert.ok(answer.internalLinks.length >= 3, `${slug} ${locale}: internal links should stay attached`);
      assert.match(answer.boundary, /KYC|本人確認|본인|kimlik|identidade|eligibility|資格|자격|uygunluk|elegibilidade/i, `${slug} ${locale}: boundary should preserve verification language`);
      assert.doesNotMatch(JSON.stringify(answer), forbiddenPublicCopy);
    }
  }
});

test("compare SEO override uses the same direct-answer data as the visible page source", () => {
  for (const locale of ["en", "zh-Hans", "zh-Hant"]) {
    const answer = compareDirectAnswerFor("bybit-vs-bitget", locale);
    const override = compareSeoOverrideFromDirectAnswer("bybit-vs-bitget", locale);
    const seo = computeRouteSeo({ url: `/compare/bybit-vs-bitget?locale=${locale}` });
    const faq = seo.schemas.find((schema) => schema["@type"] === "FAQPage")
      || seo.schemas.find((schema) => schema.subjectOf?.["@type"] === "FAQPage")?.subjectOf;
    const serialized = JSON.stringify(faq);

    assert.equal(override.title, answer.seoTitle);
    assert.equal(override.description, answer.seoDescription);
    assert.equal(override.directAnswer.answer, answer.body);
    assert.deepEqual(override.sourceUrls, answer.sourceLinks.map(([, href]) => href));
    // Owner title-budget rule: long served titles drop the trailing brand suffix, while source copy keeps it.
    assert.equal(seo.title, budgetTitle(answer.seoTitle, titleBudgetForLocale(locale)));
    assert.equal(seo.description, routeMetaDescription(seo.title, answer.seoDescription, locale));
    assert.match(serialized, new RegExp(answer.seoQuestion.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.doesNotMatch(`${seo.title}\n${seo.description}\n${serialized}`, forbiddenPublicCopy);
  }
});

test("CompareDeepPage SSR renders the Bybit vs Bitget direct answer in supported locales", async () => {
  const directAnswerBlock = (html) => {
    const start = html.indexOf('class="v3-compare-final-choice-card"');
    const end = html.indexOf('id="compare-versus-card"', start);
    assert.ok(start > 0 && end > start, "final choice card should render before versus cards");
    return html.slice(start, end).replace(/ data-cta-[^=]+="[^"]*"/g, "");
  };

  const enBlock = directAnswerBlock(await renderComparePage("en"));
  assert.match(enBlock, /Bybit vs Bitget: choose by product route, UTA model and account screen before signup\./);
  assert.match(enBlock, /Bybit xStocks/);
  assert.match(enBlock, /Bitget stock futures/);
  assert.match(enBlock, /First-time account route/);
  assert.match(enBlock, /profit-sharing rules/);
  assert.match(enBlock, /32 impressions on the Bybit vs Bitget comparison page/);
  assert.match(enBlock, /Bybit alternatives/);
  assert.match(enBlock, /If you mean lower fees/);
  assert.match(enBlock, /If you mean signup path/);
  assert.match(enBlock, /confirm the official signup screen still shows the expected account route/);
  assert.match(enBlock, /Adventure Zone (?:&|&amp;) xStocks/);
  assert.match(enBlock, /FAQ-xStocks-on-Bybit/);
  assert.match(enBlock, /Unified Trading Account \(UTA\)/);
  assert.match(enBlock, /The same UTA label does not prove the same risk model or product access/);
  assert.doesNotMatch(enBlock, forbiddenPublicCopy);

  const zhHansBlock = directAnswerBlock(await renderComparePage("zh-Hans"));
  assert.match(zhHansBlock, /Bybit vs Bitget：先确认产品类型、费用、KYC 与账户路径。/);
  assert.match(zhHansBlock, /代币化敞口/);
  assert.match(zhHansBlock, /Bitget 股票期货/);
  assert.match(zhHansBlock, /32 次展示/);
  assert.match(zhHansBlock, /Bybit 替代选择/);
  assert.match(zhHansBlock, /如果你关心低费率/);
  assert.match(zhHansBlock, /受保护的开户注册路径/);
  assert.match(zhHansBlock, /普通加密现货费率/);
  assert.match(zhHansBlock, /统一交易账户（UTA）/);
  assert.match(zhHansBlock, /相同的 UTA 名称不能证明两家的风险模型或产品权限相同/);
  assert.doesNotMatch(zhHansBlock, forbiddenPublicCopy);

  const localizedNeedles = {
    ja: [/商品幅と xStocks の確認を重視するなら Bybit/, /公式登録画面に表示される紹介コード/, /地域の利用条件を確認/],
    ko: [/가입 전 수수료/, /공식 출처 확인 대기|지역 이용 가능성/, /지역 이용 가능 여부 확인/],
    tr: [/kayıt öncesi ücret/, /Resmi kaynak doğrulaması bekleniyor|bölgesel uygunluk/, /Bölgesel uygunluğu doğrula/],
    // The final-choice card renders the localized decision title/body; the eyebrow remains source data, not visible card copy.
    ar: [/Bybit مقابل Bitget: تحقق من مسار المنتج/, /اختر Bybit عند أولوية تنوع المنتجات/, /ظهور رمز الدعوة في شاشة التسجيل الرسمية/],
  };
  for (const [locale, needles] of Object.entries(localizedNeedles)) {
    const block = directAnswerBlock(await renderComparePage(locale));
    for (const needle of needles) assert.match(block, needle, `${locale}: localized final choice content should render`);
    assert.doesNotMatch(block, forbiddenPublicCopy);
  }
});
test("CompareDeepPage SSR renders all priority FAQ entries and hides items after the first two", async () => {
  const decodeHtml = (value) => value
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  const faqBlock = (html) => {
    const start = html.indexOf('id="compare-faq"');
    const end = html.indexOf('</section>', start);
    assert.ok(start > 0 && end > start, "FAQ section should render");
    return decodeHtml(html.slice(start, end).replace(/ data-cta-[^=]+="[^"]*"/g, ""));
  };

  for (const locale of ["en", "zh-Hans", "zh-Hant"]) {
    const answer = compareDirectAnswerFor("bybit-vs-bitget", locale);
    const block = faqBlock(await renderComparePage(locale));
    const expectedEntries = [[answer.seoQuestion, answer.body], ...answer.faq];

    for (const [question, response] of expectedEntries) {
      assert.ok(block.includes(question), `${locale}: missing FAQ question ${question}`);
      assert.ok(block.includes(response), `${locale}: missing FAQ answer ${question}`);
    }

    const firstHiddenIndex = block.indexOf(`hidden=""><summary class="v3-faq-summary"><div class="v3-faq-summary-left"><span class="v3-faq-q-text">${expectedEntries[2][0]}`);
    assert.ok(firstHiddenIndex > 0, `${locale}: third FAQ should be SSR-rendered but hidden before expansion`);
    assert.match(block, /aria-expanded="false"/);
    assert.match(block, locale === "en" ? /Show 4 more questions/ : /查看其余 4 个问题|查看其餘 4 個問題/);
    assert.doesNotMatch(block, /Which has lower fees, Bybit or Bitget\?/);
    assert.doesNotMatch(block, forbiddenPublicCopy);
  }
});

test("CompareDeepPage SSR localizes matrix lead and accessibility labels", async () => {
  const decodeHtml = (value) => value
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  const cases = [
    ["zh-Hans", "按官方来源逐项核对费率、储备金、KYC、产品限制与用户权益；未完成核验的项目保持待确认。", "费率、返佣、储备金与门槛", "选择平台前应该怎样比较 Bybit 与 Bitget？"],
    ["zh-Hant", "按官方來源逐項核對費率、儲備金、KYC、產品限制與用戶權益；未完成核驗的項目保持待確認。", "費率、返傭、準備金與門檻全維度對決", "選擇平台前應該怎樣比較 Bybit 與 Bitget？"],
    ["pt-BR", "Compare taxas com fonte, reservas, KYC, limites de produto e benefícios; itens não verificados ficam pendentes.", "Comparação de taxas, benefícios, reservas e limites", null],
  ];

  for (const [locale, lead, matrixLabel, directLabel] of cases) {
    const html = decodeHtml(await renderComparePage(locale));
    assert.ok(html.includes(lead), `${locale}: matrix lead should use exact locale copy`);
    assert.match(html, new RegExp(`aria-label="${matrixLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `${locale}: matrix aria-label should be localized`);
    assert.doesNotMatch(html, /Compare source-linked fee schedules, reserve disclosures, KYC, product limits and user-benefit status; unverified items remain pending\./, `${locale}: matrix lead must not fall back to English`);
    if (directLabel) assert.match(html, new RegExp(`class="v3-compare-final-choice-evidence"[^>]*aria-label="${directLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`), `${locale}: direct answer aria-label should use local question`);
  }
});
