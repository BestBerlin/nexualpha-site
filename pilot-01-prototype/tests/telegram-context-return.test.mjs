import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildTelegramReturnContext,
  cleanTelegramReturnSearch,
  readTelegramReturnContext,
  resolveTelegramReturnBannerState,
} from "../src/data/telegram-decision-return.js";
import {
  buildTelegramWebsiteFunnelContext,
  buildTelegramWebsiteStartPayloadReturnContext,
  getTelegramDeepLink,
  parseTelegramWebsiteStartPayload,
  resolveTelegramWebsiteStartPayloadRuntime,
} from "../src/data/telegram-config.js";

const NOW = Date.UTC(2026, 8, 28, 12, 0, 0);
const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

async function bundleAndRun(source) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-telegram-context-return-"));
  try {
    const entryPath = path.join(tempDir, "entry.mjs");
    const bundlePath = path.join(tempDir, "bundle.cjs");
    await writeFile(entryPath, source, "utf8");
    const esbuildBin = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuildBin);
    execFileSync(esbuildBin, [
      entryPath,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundlePath}`,
      "--loader:.css=empty",
      "--log-level=warning",
    ], { cwd: projectRoot, stdio: "pipe" });
    return execFileSync("node", [bundlePath], { cwd: projectRoot, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function renderedHrefValues(html) {
  return [...String(html).matchAll(/\shref="([^"]+)"/g)].map((match) => match[1]);
}

test("Telegram website funnel preserves venue pair activity and public context for return links", () => {
  const venue = buildTelegramWebsiteFunnelContext({
    intent: "monitor",
    venue: "bitget",
    market: "BR",
    product: "spot",
    locale: "pt-BR",
    campaign: "telegram_context_return",
    now: NOW,
  });
  assert.match(venue.deepLink, /^https:\/\/t\.me\/NexuAlphaAssistantBot\?start=/);
  assert.match(venue.returnHref, /^\/pt-br\/exchanges\/bitget\?/);
  assert.match(venue.returnHref, /tg_return=bot/);
  assert.match(venue.returnHref, /tg_venue=bitget/);
  assert.match(venue.returnHref, /tg_market=BR/);
  assert.match(venue.returnHref, /tg_product=spot/);
  assert.match(venue.returnHref, /tg_campaign=telegram_context_return/);
  assert.equal(readTelegramReturnContext(venue.returnHref.split("?")[1], { now: NOW }).status, "restored");

  const pair = buildTelegramWebsiteFunnelContext({
    intent: "compare",
    pair: "binance-vs-okx",
    market: "GLOBAL",
    product: "perpetuals",
    locale: "ko",
    campaign: "telegram_pair_return",
    now: NOW,
  });
  assert.match(pair.returnHref, /^\/ko\/compare\/binance-vs-okx\?/);
  assert.match(pair.returnHref, /tg_pair=binance-vs-okx/);
  assert.deepEqual(readTelegramReturnContext(pair.returnHref.split("?")[1], { now: NOW }).object, {
    kind: "pair",
    pair: "binance-vs-okx",
  });

  const activity = buildTelegramReturnContext({
    activity: "bitget-official-research",
    market: "TR",
    product: "research",
    locale: "tr",
    campaign: "telegram_activity_return",
    now: NOW,
  });
  assert.match(activity.href, /^\/tr\/activities\/bitget-official-research\?/);
  assert.deepEqual(readTelegramReturnContext(activity.href.split("?")[1], { now: NOW }).object, {
    kind: "activity",
    activity: "bitget-official-research",
  });
});

test("Telegram return context degrades safely on unknown tampered or expired state", () => {
  for (const search of [
    "?tg_return=bot&tg_venue=unknown-venue&tg_expires=1790596800000",
    "?tg_return=bot&tg_pair=binance-vs-evil&tg_expires=1790596800000",
    "?tg_return=bot&tg_venue=bitget&tg_venue=okx&tg_expires=1790596800000",
    "?tg_return=bot&tg_venue=bitget&tg_expires=1790596800000&account_stage=new_account&account_stage=existing_account",
    "?tg_return=bot&tg_activity=../../secret&tg_expires=1790596800000",
    "?tg_return=bot&tg_venue=bitget&tg_expires=1",
  ]) {
    const result = readTelegramReturnContext(search, { now: NOW });
    assert.equal(result.status, "fallback", search);
    assert.match(result.href, /^\/(?:exchanges|telegram)/, search);
    assert.equal(result.webOnly, true, search);
  }
});

test("Telegram return banner state appears only for the current venue or compare route", () => {
  const venueReturn = buildTelegramReturnContext({
    venue: "bitget",
    market: "HK",
    product: "spot",
    locale: "zh-Hant",
    campaign: "telegram_resume_test",
    now: NOW,
  });
  const venueSearch = new URL(`https://nexualpha.example${venueReturn.href}&account_stage=new_account&funding=${encodeURIComponent("HKD 銀行轉帳")}`).search;
  const venueState = resolveTelegramReturnBannerState({
    search: venueSearch,
    expectedKind: "venue",
    expectedId: "bitget",
    locale: "zh-Hant",
    accountStage: "new_account",
    funding: "HKD 銀行轉帳",
    now: NOW,
  });
  assert.equal(venueState.status, "restored");
  assert.equal(venueState.objectId, "bitget");
  assert.equal(venueState.object.kind, "venue");
  assert.match(venueState.cleanSearch, /market=HK/);
  assert.match(venueState.cleanSearch, /product=spot/);
  assert.match(venueState.cleanSearch, /locale=zh-Hant/);
  assert.match(venueState.cleanSearch, /account_stage=new_account/);
  assert.match(venueState.cleanSearch, /funding=HKD(?:\+|%20)%E9%8A%80%E8%A1%8C%E8%BD%89%E5%B8%B3/);
  assert.doesNotMatch(venueState.cleanSearch, /tg_/);

  assert.equal(resolveTelegramReturnBannerState({
    search: venueSearch,
    expectedKind: "venue",
    expectedId: "okx",
    now: NOW,
  }), null);
  assert.equal(resolveTelegramReturnBannerState({
    search: venueSearch,
    expectedKind: "pair",
    expectedId: "bybit-vs-bitget",
    now: NOW,
  }), null);

  const compareReturn = buildTelegramReturnContext({
    pair: "binance-vs-okx",
    market: "GLOBAL",
    product: "perpetuals",
    locale: "ko",
    campaign: "telegram_compare_resume",
    now: NOW,
  });
  const compareState = resolveTelegramReturnBannerState({
    search: new URL(`https://nexualpha.example${compareReturn.href}`).search,
    expectedKind: "pair",
    expectedId: "binance-vs-okx",
    now: NOW,
  });
  assert.equal(compareState.status, "restored");
  assert.deepEqual(compareState.object, { kind: "pair", pair: "binance-vs-okx" });
});

test("Telegram return context keeps anonymous decision resume fields in normal URL state", () => {
  const context = buildTelegramReturnContext({
    venue: "bitget",
    market: "BR",
    product: "spot",
    locale: "pt-BR",
    accountStage: "new_account",
    funding: "Pix",
    scenario: "venue",
    now: NOW,
  });
  const parsed = new URL(`https://nexualpha.example${context.href}`);
  assert.equal(parsed.searchParams.get("account_stage"), "new_account");
  assert.equal(parsed.searchParams.get("funding"), "Pix");
  assert.equal(parsed.searchParams.get("scenario"), "venue");
  assert.equal(parsed.searchParams.has("referral"), false);
  assert.equal(parsed.searchParams.has("inviteCode"), false);

  const restored = readTelegramReturnContext(parsed.search, { now: NOW });
  assert.equal(restored.status, "restored");
  assert.equal(restored.accountStage, "new_account");
  assert.equal(restored.funding, "Pix");
  assert.equal(restored.scenario, "venue");
  assert.equal(restored.anonymousResume.state.market, "BR");
  assert.equal(restored.anonymousResume.state.venue, "bitget");
});

test("Telegram return cleanup keeps only anonymous decision context", () => {
  const cleaned = cleanTelegramReturnSearch("?locale=ja&market=JP&product=spot&account_stage=new_account&funding=bank&tg_return=bot&tg_venue=bitget&tg_expires=1790596800000&utm_source=telegram", {
    locale: "ja",
    market: "JP",
    product: "spot",
    accountStage: "new_account",
    funding: "bank",
    scenario: "venue",
    venue: "bitget",
    pair: "binance-vs-okx",
  });
  assert.equal(cleaned, "locale=ja&market=JP&product=spot&account_stage=new_account&scenario=venue&venue=bitget&pair=binance-vs-okx");
});

test("Telegram return cleanup persists only whitelisted anonymous decision fields", () => {
  const cleaned = cleanTelegramReturnSearch("?locale=pt-BR&market=BR&product=spot&account_stage=new_account&funding=Pix&scenario=venue&tg_return=bot&tg_venue=bitget&tg_expires=1790596800000&venue=bitget&pair=binance-vs-okx&referral=nexu888&inviteCode=11350287&identity=telegram-user-123&protectedUrl=https%3A%2F%2Fpartner.bitget.com%2Fbg%2Fzc8pmupf", {
    locale: "pt-BR",
    market: "BR",
    product: "spot",
    accountStage: "new_account",
    funding: "Pix",
    scenario: "venue",
    venue: "bitget",
    pair: "binance-vs-okx",
  });
  const params = new URLSearchParams(cleaned);

  assert.deepEqual([...params.keys()].sort(), [
    "account_stage",
    "funding",
    "locale",
    "market",
    "pair",
    "product",
    "scenario",
    "venue",
  ]);
  assert.doesNotMatch(cleaned, /tg_|referral|inviteCode|identity|protectedUrl|nexu888|11350287|partner\.bitget/i);
});

test("Telegram website start payload restores only anonymous onsite return context", () => {
  const funnel = buildTelegramWebsiteFunnelContext({
    intent: "fees",
    venue: "okx",
    market: "BR",
    product: "spot",
    locale: "pt-BR",
    instrument: "spot",
    amount: 12500.25,
    campaign: "telegram_payload_return",
    now: NOW,
  });
  const parsed = parseTelegramWebsiteStartPayload(funnel.startPayload);
  assert.equal(parsed.action, "fee_calc");
  assert.equal(parsed.venue, "okx");
  assert.equal(parsed.anonymousOnly, true);
  assert.equal(parsed.telegramApiCalls, 0);
  assert.equal(parsed.telegramMessagesSent, 0);
  assert.equal(parsed.realUserDataTouched, false);

  const restored = buildTelegramWebsiteStartPayloadReturnContext(funnel.startPayload, { now: NOW });
  assert.equal(restored.status, "restored");
  assert.equal(restored.anonymousOnly, true);
  assert.equal(restored.telegramApiCalls, 0);
  assert.equal(restored.telegramMessagesSent, 0);
  assert.equal(restored.realUserDataTouched, false);
  assert.equal(restored.externalSubmission, false);
  assert.equal(restored.protectedOutbound, false);
  assert.match(restored.href, /^\/pt-br\/exchanges\/okx\?/);
  assert.match(restored.href, /tg_return=bot/);
  assert.match(restored.href, /tg_venue=okx/);
  assert.match(restored.href, /tg_market=BR/);
  assert.match(restored.href, /tg_product=spot/);
  assert.deepEqual(restored.returnContext.object, { kind: "venue", venue: "okx" });
  assert.equal(readTelegramReturnContext(new URL(`https://nexualpha.example${restored.href}`).search, { now: NOW }).status, "restored");
  assert.doesNotMatch(restored.href, /register|signup|commission|inviteCode|invite_code|nexu888|11350287|luckybitcoin/i);

  const compare = buildTelegramWebsiteStartPayloadReturnContext("compare_binance-vs-okx_m_GLOBAL_l_en_t_perpetuals", { now: NOW });
  assert.equal(compare.status, "restored");
  assert.match(compare.href, /^\/compare\/binance-vs-okx\?/);
  assert.deepEqual(compare.returnContext.object, { kind: "pair", pair: "binance-vs-okx" });
});

test("Telegram website start payload return rejects piggybacked or protected material", () => {
  for (const payload of [
    "saved_choice_bitget_user_12345_m_BR_l_ptBR_t_spot",
    "monitor_partner_bitget_inviteCode_nexu888_m_BR_l_ptBR_t_spot",
    "fee_calc_all_spot_777777_m_GLOBAL_l_en_t_spot",
    "saved_choice_accounts.binance.com/register?inviteCode=nexu888",
  ]) {
    const restored = buildTelegramWebsiteStartPayloadReturnContext(payload, { now: NOW });
    assert.equal(restored.status, "fallback", payload);
    assert.equal(restored.anonymousOnly, true, payload);
    assert.equal(restored.telegramApiCalls, 0, payload);
    assert.equal(restored.telegramMessagesSent, 0, payload);
    assert.equal(restored.realUserDataTouched, false, payload);
    assert.equal(restored.externalSubmission, false, payload);
    assert.equal(restored.protectedOutbound, false, payload);
    assert.match(restored.href, /^\/(?:pt-br\/)?telegram(?:\?|$)/, payload);
    assert.doesNotMatch(restored.href, /accounts\.binance\.com|register|signup|inviteCode|invite_code|nexu888|11350287|luckybitcoin/i, payload);
    assert.equal(restored.returnContext, null, payload);
  }
});

test("Telegram runtime adapter consumes start payloads into onsite return links only", () => {
  const funnel = buildTelegramWebsiteFunnelContext({
    intent: "compare",
    pair: "binance-vs-okx",
    market: "BR",
    product: "spot",
    locale: "pt-BR",
    campaign: "telegram_runtime_return",
    now: NOW,
  });

  for (const input of [
    funnel.startPayload,
    `/start ${funnel.startPayload}`,
    `/start@NexuAlphaAssistantBot ${funnel.startPayload}`,
    new URLSearchParams({ start: funnel.startPayload }),
    { messageText: `/start ${funnel.startPayload}` },
  ]) {
    const resolved = resolveTelegramWebsiteStartPayloadRuntime(input, { now: NOW });
    assert.equal(resolved.status, "restored");
    assert.equal(resolved.mode, "local_runtime_adapter_only");
    assert.equal(resolved.telegramApiCalls, 0);
    assert.equal(resolved.telegramMessagesSent, 0);
    assert.equal(resolved.realUserDataTouched, false);
    assert.equal(resolved.externalSubmission, false);
    assert.equal(resolved.protectedOutbound, false);
    assert.equal(resolved.safeReply.kind, "onsite_return_link");
    assert.match(resolved.href, /^\/pt-br\/compare\/binance-vs-okx\?/);
    assert.match(resolved.href, /tg_return=bot/);
    assert.deepEqual(resolved.returnContext.object, { kind: "pair", pair: "binance-vs-okx" });
    assert.doesNotMatch(JSON.stringify(resolved), /accounts\.binance\.com|partner\.bitget|topzhjdgxcb|nexu888|11350287|luckybitcoin/i);
  }
});

test("Telegram runtime adapter fails closed for duplicate empty or protected start payloads", () => {
  const duplicate = new URLSearchParams();
  duplicate.append("start", "monitor_bitget_m_BR_l_ptBR_t_spot");
  duplicate.append("start", "monitor_okx_m_BR_l_ptBR_t_spot");

  for (const [input, reason] of [
    [duplicate, "duplicate_start"],
    ["", "empty"],
    [{ text: "/start" }, "empty"],
    ["/start saved_choice_partner_bitget_inviteCode_nexu888_m_BR_l_ptBR_t_spot", "unexpected_body_tail"],
    ["/start saved_choice_accounts.binance.com/register?ref=11350287", "unexpected_body_tail"],
  ]) {
    const resolved = resolveTelegramWebsiteStartPayloadRuntime(input, { now: NOW, locale: "pt-BR", market: "BR", product: "spot" });
    assert.equal(resolved.status, "fallback", reason);
    assert.equal(resolved.reason, reason);
    assert.equal(resolved.safeReply.kind, "onsite_return_link");
    assert.match(resolved.href, /^\/pt-br\/telegram\?/);
    assert.equal(resolved.telegramApiCalls, 0);
    assert.equal(resolved.telegramMessagesSent, 0);
    assert.equal(resolved.realUserDataTouched, false);
    assert.equal(resolved.externalSubmission, false);
    assert.equal(resolved.protectedOutbound, false);
    assert.doesNotMatch(JSON.stringify(resolved), /accounts\.binance\.com|partner\.bitget|topzhjdgxcb|nexu888|11350287|luckybitcoin/i);
  }
});

test("Telegram return links and deep links do not become registration conversion evidence", async () => {
  const link = getTelegramDeepLink({
    action: "compare",
    pair: "binance-vs-okx",
    market: "BR",
    product: "spot",
    locale: "pt-BR",
    campaign: "telegram_context_return",
  });
  assert.match(link, /^https:\/\/t\.me\/NexuAlphaAssistantBot\?start=/);
  assert.doesNotMatch(link, /registration|register|signup|commission|invite|referral/i);

  const hub = await readFile(new URL("../src/components/v3/TelegramBotHub.jsx", import.meta.url), "utf8");
  const handoff = await readFile(new URL("../src/components/v3/OnsiteTelegramBotHandoff.jsx", import.meta.url), "utf8");
  const serialized = `${hub}\n${handoff}`;
  assert.match(serialized, /data-telegram-return-href/);
  assert.match(serialized, /data-telegram-web-only-fallback/);
  assert.match(serialized, /readTelegramReturnContext/);
  assert.doesNotMatch(serialized, /data-cta-kind="registration"|registration conversion|signup conversion/i);
});

test("Telegram hub SSR does not expose transient return context as crawlable onsite hrefs", async () => {
  const output = await bundleAndRun(`
    import React from "react";
    import { renderToStaticMarkup } from "react-dom/server";
    import { TelegramBotHub } from "../../src/components/v3/TelegramBotHub.jsx";
    const html = renderToStaticMarkup(React.createElement(TelegramBotHub, { locale: "en", headingLevel: 1, market: "BR", product: "spot" }));
    console.log(JSON.stringify({ html }));
  `);
  const { html } = JSON.parse(output);
  const onsiteHrefs = renderedHrefValues(html).filter((href) => href.startsWith("/"));
  assert.ok(onsiteHrefs.length > 10, "Telegram hub should render internal research links");
  assert.ok(onsiteHrefs.some((href) => href.startsWith("/exchanges?")), "web-only return context should fall back to the clean directory");
  assert.equal(onsiteHrefs.filter((href) => /(?:^|[?&])tg_[^=&]+=/.test(href)).length, 0);

  const botHrefs = renderedHrefValues(html).filter((href) => href.startsWith("https://t.me/NexuAlphaAssistantBot"));
  assert.ok(botHrefs.length >= 2, "Bot deep links should keep working");
  assert.ok(botHrefs.every((href) => href.includes("?start=")), "Bot deep links should retain start payloads");
});


test("Telegram return banner source persists anonymous resume without protected material", async () => {
  const banner = await readFile(new URL("../src/components/v3/TelegramReturnBanner.jsx", import.meta.url), "utf8");
  assert.match(banner, /saveAnonymousDecisionResumeSnapshot/);
  assert.match(banner, /loadAnonymousDecisionResumeSnapshot/);
  assert.match(banner, /data-anonymous-decision-resume="available"/);
  assert.doesNotMatch(banner, /localStorage\.setItem\([^)]*referral|inviteCode|accounts\.binance|sendMessage|fetch\(/i);
});

// Exercise the actual saved-state JSX with test-only deterministic hooks.
// SSR normally starts without client storage; this does not claim browser effect acceptance.
async function renderTelegramBannerLocales(locales, { restored = false } = {}) {
  const tempDir = await mkdtemp(path.join(projectRoot, "tests/.tmp-resume-locales-"));
  try {
    const originalPath = path.join(projectRoot, "src/components/v3/TelegramReturnBanner.jsx");
    let component = await readFile(originalPath, "utf8");
    component = component.replace('import { useEffect, useMemo, useState } from "react";', `
      import React from "react";
      let stateCall = 0;
      const useState = () => [(stateCall++ % 2 === 0) ? globalThis.__returnState : globalThis.__resumeSnapshot, () => {}];
      const useEffect = () => {};
      const useMemo = (calculate) => calculate();
    `).replace(/import "\.\/telegram-return-banner\.css";/, "")
      .replace(/from "(\.\.[^"]+)"/g, (_, relative) => `from ${JSON.stringify(path.resolve(path.dirname(originalPath), relative))}`);
    await writeFile(path.join(tempDir, "banner.jsx"), component);
    const entry = path.join(tempDir, "entry.mjs");
    const bundle = path.join(tempDir, "bundle.cjs");
    await writeFile(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { TelegramReturnBanner } from "./banner.jsx";
      globalThis.__resumeSnapshot = {version:1,anonymousOnly:true,state:{market:"BR",product:"spot",accountStage:"new_account",funding:"Pix",scenario:"venue",venue:"bitget"}};
      globalThis.__returnState = ${JSON.stringify(restored ? {status:"restored", object:{kind:"venue",venue:"bitget"},objectId:"bitget",market:"BR",product:"spot",expiresAt:NOW+86400000,cleanSearch:"market=BR&product=spot&venue=bitget"} : null)};

      console.log(JSON.stringify(${JSON.stringify(locales)}.map(locale => ({locale,html:renderToStaticMarkup(React.createElement(TelegramReturnBanner,{locale,expectedKind:"venue",expectedId:"bitget",continueHash:"#registration-checklist"}))}))));
    `);
    execFileSync(path.join(projectRoot,"node_modules/.bin/esbuild"), [entry,"--bundle","--platform=node","--format=cjs",`--outfile=${bundle}`,"--loader:.css=empty","--log-level=warning"], {cwd:projectRoot,stdio:"pipe"});
    return JSON.parse(execFileSync("node",[bundle],{cwd:projectRoot,encoding:"utf8"}));
  } finally { await rm(tempDir,{recursive:true,force:true}); }
}

test("anonymous resume renders localized five-key copy and preserves onsite context in all 15 locales", async () => {
  const titles = {
    en:"Continue your last anonymous decision", "zh-Hans":"恢复上次匿名决策", "zh-Hant":"恢復上次匿名決策",
    ja:"前回の匿名の比較を続ける", ko:"이전 익명 비교 이어가기", tr:"Son anonim karşılaştırmanıza devam edin",
    es:"Continúa tu última comparación anónima", "pt-BR":"Continue sua última comparação anônima",
    vi:"Tiếp tục so sánh ẩn danh trước đó", de:"Letzten anonymen Vergleich fortsetzen", fr:"Reprendre votre dernière comparaison anonyme",
    it:"Riprendi il tuo ultimo confronto anonimo", ru:"Продолжить последнее анонимное сравнение", ar:"متابعة آخر مقارنة دون بيانات شخصية", id:"Lanjutkan perbandingan anonim terakhir",
  };
  for (const {locale,html} of await renderTelegramBannerLocales(Object.keys(titles))) {
    assert.match(html,/data-anonymous-decision-resume="available"/,locale);
    assert.ok(html.includes(titles[locale]),`${locale} needs its own visible anonymous-resume heading`);
    const browserScope = {en:"this browser", "zh-Hans":"此浏览器", "zh-Hant":"此瀏覽器", ja:"このブラウザー", ko:"이 브라우저", tr:"bu tarayıcı", es:"este navegador", "pt-BR":"neste navegador", vi:"trình duyệt này", de:"diesem Browser", fr:"ce navigateur", it:"questo browser", ru:"этом браузере", ar:"هذا المتصفح", id:"browser ini"};
    assert.ok(html.includes(browserScope[locale]), `${locale}: saved-state scope must identify this browser`);
    const body = html.match(/<p>([^<]+)<\/p>/)?.[1] || "";
    assert.match(body, /Bot/, `${locale}: browser state must remain distinct from Bot choices`);
    assert.match(body, /Telegram/, `${locale}: excluded account data boundary must remain`);
    if (["en", "tr", "es", "pt-BR", "vi", "de", "fr", "it", "id"].includes(locale)) assert.ok(body.split(/\s+/).length <= 35, `${locale}: compact browser explanation cannot exceed 35 whitespace-separated words`);
    const semanticTerms = {
      en:[/market/i,/product/i,/purpose/i,/route/i,/identity/i,/referral/i,/account/i],
      "zh-Hans":[/市场/,/产品/,/目的/,/路径/,/身份/,/邀请链接/,/账号/],
      "zh-Hant":[/市場/,/產品/,/目的/,/路徑/,/身分/,/邀請連結/,/帳號/],
      ja:[/市場/,/商品/,/目的/,/経路/,/個人情報/,/紹介リンク/,/アカウント/],
      ko:[/시장/,/상품/,/목적/,/경로/,/신원/,/추천 링크/,/계정/],
      tr:[/piyasa/i,/ürün/i,/amaç/i,/rota/i,/kimlik/i,/davet bağlantı/i,/hesap/i],
      es:[/mercado/i,/producto/i,/objetivo/i,/ruta/i,/identidad/i,/invitación/i,/cuenta/i],
      "pt-BR":[/mercado/i,/produto/i,/objetivo/i,/caminho/i,/identidade/i,/convite/i,/conta/i],
      vi:[/thị trường/i,/sản phẩm/i,/mục đích/i,/đường dẫn/i,/danh tính/i,/giới thiệu/i,/tài khoản/i],
      de:[/markt/i,/produkt/i,/vergleichszweck/i,/pfad/i,/identitätsdaten/i,/einladungslinks/i,/kontodaten/i],
      fr:[/marché/i,/produit/i,/objectif/i,/parcours/i,/identité/i,/parrainage/i,/compte/i],
      it:[/mercato/i,/prodotto/i,/obiettivo/i,/percorso/i,/identità/i,/invito/i,/account/i],
      ru:[/рынок/i,/продукт/i,/цель/i,/путь/i,/личных данных/i,/реферальных/i,/аккаунта/i],
      ar:[/السوق/,/المنتج/,/الهدف/,/المسار/,/الهوية/,/الدعوة/,/حساب/],
      id:[/pasar/i,/produk/i,/tujuan/i,/jalur/i,/identitas/i,/undangan/i,/akun/i],
    };
    for (const term of semanticTerms[locale]) assert.match(body, term, `${locale}: bounded restored fields and excluded private material must remain explained`);

    if (["de", "fr", "it", "ru", "ar", "id"].includes(locale)) assert.doesNotMatch(html, /<dt>(?:Market|Product|Route)<\/dt>/, `${locale}: metadata labels cannot fall back to English`);

    assert.equal((html.match(/data-cta-placement="anonymous-decision-resume"/g)||[]).length,1,locale);
    if(locale!=="en") assert.doesNotMatch(html,/Continue later|Continue your last anonymous decision|Only market, product, scenario and route fields are restored|Continue last decision|Forget saved decision/,`${locale}: all five copy fields must avoid English fallback`);
    const href = renderedHrefValues(html)[0].replaceAll("&amp;","&");
    const url = new URL(href,"https://nexualpha.com");
    assert.match(url.pathname,/\/exchanges\/bitget$/,locale);
    const prefixes = {en:"", "zh-Hans":"/zh-hans", "zh-Hant":"/zh-hant", "pt-BR":"/pt-br", id:"/id-id"};
    assert.equal(url.pathname, `${prefixes[locale] ?? `/${locale}`}/exchanges/bitget`, locale);
    assert.match(html, /class="v3-telegram-return-banner__eyebrow">[^<]+<\/span>/, locale);
    assert.match(html, /<p>[^<]+<\/p>/, locale);
    assert.equal(url.searchParams.get("market"),"BR",locale);
    assert.equal(url.searchParams.get("product"),"spot",locale);
    assert.equal(url.searchParams.get("account_stage"),"new_account",locale);
    assert.equal(url.searchParams.get("funding"),"Pix",locale);
    assert.equal(url.hash,"#registration-checklist",locale);
    assert.doesNotMatch(href,/https?:|tg_|invite|referral|nexu888/,locale);
    assert.match(html,/<button[^>]*type="button"[^>]*class="v3-telegram-return-banner__clear"/,locale);
  }
});

test("anonymous resume metadata labels localize where Telegram-return copy remains English fallback", async () => {
  for (const {locale,html} of await renderTelegramBannerLocales(["de","fr","it","ru","ar","id"])) {
    assert.doesNotMatch(html, /<dt>(?:Market|Product|Route)<\/dt>/, `${locale}: independent anonymous metadata labels required`);
    assert.equal((html.match(/<dt>[^<]+<\/dt>/g)||[]).length,3,locale);
  }
});


test("inbound Telegram expiry cannot renew an overlong or fractional return window", () => {
  const maxTtl = 14 * 24 * 60 * 60 * 1000;
  for (const expiry of [NOW + maxTtl + 1, NOW + 1000.5, Number.MAX_SAFE_INTEGER]) {
    const result = readTelegramReturnContext(`?tg_return=bot&tg_venue=bitget&tg_locale=ja&tg_market=JP&tg_product=spot&tg_expires=${expiry}`, { now: NOW });
    assert.equal(result.status, "fallback", String(expiry));
    assert.equal(result.reason, "invalid_expiry");
    assert.equal(result.webOnly, true);
    assert.match(result.href, /^\/ja\/exchanges\?/);
    const fallbackUrl = new URL(result.href, "https://nexualpha.com");
    assert.equal(fallbackUrl.searchParams.get("market"), "JP");
    for (const key of fallbackUrl.searchParams.keys()) assert.equal(key.startsWith("tg_"), false);
    assert.equal(fallbackUrl.searchParams.has("utm_source"), false);
    assert.equal(fallbackUrl.searchParams.has("ref"), false);
    assert.equal(resolveTelegramReturnBannerState({search: `?tg_return=bot&tg_venue=bitget&tg_expires=${expiry}`, expectedKind: "venue", expectedId: "bitget", now: NOW}), null);
  }
  for (const expiry of [NOW + 1, NOW + maxTtl]) {
    const result = readTelegramReturnContext(`?tg_return=bot&tg_venue=bitget&tg_expires=${expiry}`, { now: NOW });
    assert.equal(result.status, "restored");
    assert.equal(result.expiresAt, expiry);
  }
});


test("restored Telegram banner does not fall back to English in any supported UI locale", async () => {
  const locales = ["en","zh-Hans","zh-Hant","es","pt-BR","fr","de","ja","ko","ar","tr","ru","id","vi","it"];
  const rows = await renderTelegramBannerLocales(locales, {restored:true});
  const english = rows.find(row=>row.locale === "en").html;
  for (const {locale,html} of rows) {
    assert.match(html,/data-telegram-return-banner="restored"/,locale);
    assert.match(html,/<h2>[^<]+<\/h2>/,locale);
    assert.match(html,/<button[^>]*>[^<]+<\/button>/,locale);
    if (locale !== "en") for (const pattern of [/<h2>([^<]+)<\/h2>/, /<p>([^<]+)<\/p>/, /<button[^>]*>([^<]+)<\/button>/]) {
      assert.notEqual(html.match(pattern)?.[1], english.match(pattern)?.[1], `${locale} visible return copy must be localized`);
    }
  }
});
