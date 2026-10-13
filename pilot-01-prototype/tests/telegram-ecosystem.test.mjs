import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  TELEGRAM_CONFIG,
  TELEGRAM_COMMANDS,
  TELEGRAM_GROWTH_OPERATING_SYSTEM,
  TELEGRAM_MANUAL_REVIEW_POLICY,
  TELEGRAM_WEEK1_RETENTION_LOOP,
  TELEGRAM_RESEARCH_PATHS,
  TELEGRAM_SEARCH_TOPIC_QUEUE,
  TELEGRAM_WAVE7_SEARCH_TOPICS,
  TELEGRAM_WAVE8_SEARCH_TOPICS,
  TELEGRAM_WAVE9_SEARCH_TOPICS,
  TELEGRAM_WAVE10_SEARCH_TOPICS,
  TELEGRAM_WAVE11_SEARCH_TOPICS,
  TELEGRAM_WAVE13_SEARCH_TOPICS,
  TELEGRAM_WAVE25_SEARCH_TOPICS,
  TELEGRAM_WAVE26_SEARCH_TOPICS,
  TELEGRAM_WAVE27_SEARCH_TOPICS,
  TELEGRAM_WAVE28_SEARCH_TOPICS,
  TELEGRAM_WAVE29_SEARCH_TOPICS,
  TELEGRAM_WAVE30_SEARCH_TOPICS,
  TELEGRAM_WAVE31_SEARCH_TOPICS,
  TELEGRAM_WAVE32_SEARCH_TOPICS,
  TELEGRAM_WAVE33_SEARCH_TOPICS,
  TELEGRAM_WAVE34_SEARCH_TOPICS,
  TELEGRAM_WAVE35_SEARCH_TOPICS,
  TELEGRAM_WAVE36_SEARCH_TOPICS,
  TELEGRAM_WAVE37_SEARCH_TOPICS,
  TELEGRAM_WAVE38_SEARCH_TOPICS,
  TELEGRAM_WAVE39_SEARCH_TOPICS,
  TELEGRAM_WAVE57_SEARCH_TOPICS,
  TELEGRAM_WAVE58_SEARCH_TOPICS,
  TELEGRAM_WAVE20_COMMAND_ROUTE_MAP,
  TELEGRAM_WAVE20_SEARCH_TOPIC_ROUTES,
  TELEGRAM_WAVE21_COMMAND_ROUTE_MAP,
  TELEGRAM_WAVE21_GSC_QUERY_ROUTES,
  TELEGRAM_WAVE22_ONSITE_BOT_HANDOFFS,
  cleanTelegramStartPayload,
  buildTelegramStartPayload,
  buildTelegramWebsiteFunnelContext,
  parseTelegramWebsiteStartPayload,
  getTelegramDeepLink,
  getTelegramShareUrl,
} from "../src/data/telegram-config.js";
import { readTelegramReturnContext } from "../src/data/telegram-decision-return.js";
import { localizedHref } from "../src/data/locale-routing.js";
import {
  buildTelegramPublishQueue,
  escapeMarkdownV2,
  generateTelegramBroadcasts,
  renderTelegramAttributionGuide,
  renderTelegramManualCopyPack,
  renderTelegramPostLogTemplate,
  renderTelegramPreflightChecklist,
  renderTelegramWeeklyReviewTemplate,
  validateTelegramBroadcastSystem,
  writeTelegramBroadcastFeed,
  writeTelegramManualPublishPack,
} from "../scripts/generate_tg_broadcast_feed.mjs";

test("TELEGRAM_CONFIG retains official verified handles and web preview", () => {
  assert.equal(TELEGRAM_CONFIG.botUsername, "NexuAlphaAssistantBot");
  assert.equal(TELEGRAM_CONFIG.botUrl, "https://t.me/NexuAlphaAssistantBot");
  assert.equal(TELEGRAM_CONFIG.channelUsername, "NexuAlphaClub");
  assert.equal(TELEGRAM_CONFIG.channelUrl, "https://t.me/NexuAlphaClub");
  assert.equal(TELEGRAM_CONFIG.webPreviewUrl, "https://t.me/s/NexuAlphaClub");
  assert.equal(TELEGRAM_CONFIG.groupUsername, "NexuAlphaWorld");
  assert.equal(TELEGRAM_CONFIG.groupUrl, "https://t.me/NexuAlphaWorld");
});

test("Telegram manual review policy keeps onsite-first anonymous measurement boundaries", () => {
  assert.equal(TELEGRAM_MANUAL_REVIEW_POLICY.status, "manual_review_required");
  assert.equal(TELEGRAM_MANUAL_REVIEW_POLICY.noTelegramApiCall, true);
  assert.match(TELEGRAM_MANUAL_REVIEW_POLICY.onsiteFirstRule, /NexuAlpha landing URL before any Bot follow-up/);
  assert.deepEqual(TELEGRAM_MANUAL_REVIEW_POLICY.requiredPublicParams, ["utm_source", "utm_medium", "utm_campaign"]);
  assert.deepEqual(TELEGRAM_MANUAL_REVIEW_POLICY.requiredTelegramContextParams, [
    "tg_market",
    "tg_locale",
    "tg_product",
    "tg_funnel",
    "tg_intent",
    "tg_theme",
    "tg_draft",
  ]);
  assert.ok(TELEGRAM_MANUAL_REVIEW_POLICY.anonymousMetrics24h.includes("landingVisits"));
  assert.ok(TELEGRAM_MANUAL_REVIEW_POLICY.anonymousMetrics7d.includes("decision"));
  assert.ok(TELEGRAM_MANUAL_REVIEW_POLICY.forbiddenClaims.includes("raw exchange registration URL"));
  assert.deepEqual(TELEGRAM_MANUAL_REVIEW_POLICY.reviewWindows.map((window) => window.id), ["24h", "7d"]);
});

test("Telegram growth operating system defines 90-day channel group bot execution without external sends", () => {
  assert.equal(TELEGRAM_GROWTH_OPERATING_SYSTEM.status, "draft_only_manual_execution");
  assert.equal(TELEGRAM_GROWTH_OPERATING_SYSTEM.publicSurfaces.length, 3);
  assert.deepEqual(TELEGRAM_GROWTH_OPERATING_SYSTEM.publicSurfaces.map((surface) => surface.id), [
    "channel",
    "group",
    "assistant_bot",
  ]);
  assert.equal(TELEGRAM_GROWTH_OPERATING_SYSTEM.publicSurfaces[0].handle, TELEGRAM_CONFIG.channelUsername);
  assert.equal(TELEGRAM_GROWTH_OPERATING_SYSTEM.publicSurfaces[1].handle, TELEGRAM_CONFIG.groupUsername);
  assert.equal(TELEGRAM_GROWTH_OPERATING_SYSTEM.publicSurfaces[2].handle, TELEGRAM_CONFIG.botUsername);
  assert.deepEqual(TELEGRAM_GROWTH_OPERATING_SYSTEM.ninetyDayPhases.map((phase) => phase.id), [
    "phase_1_foundation_days_1_30",
    "phase_2_regional_conversion_days_31_60",
    "phase_3_compounding_days_61_90",
  ]);

  for (const locale of ["zh-Hans", "en", "pt-BR"]) {
    const template = TELEGRAM_GROWTH_OPERATING_SYSTEM.localeLaunchTemplates[locale];
    assert.ok(template.welcome.length > 60, `${locale} welcome copy should be specific`);
    assert.ok(template.channelPost.includes(locale === "pt-BR" ? "NexuAlpha" : "NexuAlpha"), `${locale} channel post should point to NexuAlpha`);
    assert.match(template.groupPrompt, /KYC|费用|taxa|fees/i, `${locale} group prompt should collect cost or KYC objections`);
    assert.match(template.groupPrompt, /地区|region|regiao|produto|product|产品/i, `${locale} group prompt should collect region and product context`);
    assert.ok(template.botMenu.length >= 6, `${locale} bot menu should cover resume/save/check/settings/unsubscribe`);
  }
});

test("Telegram event contract preserves conversion attribution boundaries", () => {
  const events = new Map(TELEGRAM_GROWTH_OPERATING_SYSTEM.eventContract.map((event) => [event.name, event]));
  assert.deepEqual([...events.keys()], ["bot_start", "intent_resolved", "saved_choice", "site_return", "invite_click"]);

  assert.ok(events.get("site_return").requiredFields.includes("utm_campaign"));
  assert.ok(events.get("site_return").requiredFields.includes("tg_locale"));
  assert.match(events.get("site_return").boundary, /not an exchange registration/);
  assert.match(events.get("invite_click").boundary, /click is not registration/);
  assert.match(events.get("invite_click").boundary, /commission/);
  assert.match(events.get("saved_choice").boundary, /must not contain private exchange account data/);

  for (const event of events.values()) {
    assert.ok(event.requiredFields.length >= 3, `${event.name} should be reportable`);
    assert.doesNotMatch(`${event.meaning}\n${event.boundary}`, /guaranteed signup|guaranteed discount|private commission terms/i);
  }
});

test("Telegram operating rules forbid raw referral material and require opt-in alerts", () => {
  const serialized = JSON.stringify(TELEGRAM_GROWTH_OPERATING_SYSTEM);
  assert.doesNotMatch(serialized, /(accounts\.binance\.com|binance\.com\/join|bsmkweb\.cc|partner\.bitget|bitget\.com\/expressly|okx\.com\/join|topzhjdgxcb\.net|backpack\.exchange\/join)/i);
  assert.doesNotMatch(serialized, /11350287|nexu888|luckybitcoin|LUCKX|CANDY007|INS898|1836370407|NEXU888/);

  assert.equal(TELEGRAM_GROWTH_OPERATING_SYSTEM.optInAndUnsubscribe.defaultAlertState, "off");
  assert.equal(TELEGRAM_GROWTH_OPERATING_SYSTEM.optInAndUnsubscribe.optInRequired, true);
  assert.ok(TELEGRAM_GROWTH_OPERATING_SYSTEM.optInAndUnsubscribe.unsubscribeCommands.includes("/stop"));
  assert.ok(TELEGRAM_GROWTH_OPERATING_SYSTEM.optInAndUnsubscribe.unsubscribeCommands.includes("/delete"));
  assert.equal(TELEGRAM_GROWTH_OPERATING_SYSTEM.reportingCadence.forbiddenRollups.includes("click_to_registration_claim"), true);
  assert.ok(TELEGRAM_GROWTH_OPERATING_SYSTEM.sourceReviewRules.some((rule) => /NexuAlpha first-party pages/.test(rule)));
});

test("Week1 Telegram retention loop maps Bot entry to onsite return without acting for users", () => {
  assert.equal(TELEGRAM_WEEK1_RETENTION_LOOP.status, "local_draft_contract");
  assert.equal(TELEGRAM_WEEK1_RETENTION_LOOP.safetyBoundary.noTelegramApiCall, true);
  assert.equal(TELEGRAM_WEEK1_RETENTION_LOOP.safetyBoundary.noRealAccountOperation, true);
  assert.equal(TELEGRAM_WEEK1_RETENTION_LOOP.safetyBoundary.noExternalSubmission, true);
  assert.equal(TELEGRAM_WEEK1_RETENTION_LOOP.safetyBoundary.noPartnerRegistryEdit, true);
  assert.deepEqual(TELEGRAM_WEEK1_RETENTION_LOOP.safetyBoundary.protectedUserActionCommands, ["/choice", "/stop", "/delete"]);
  assert.match(TELEGRAM_WEEK1_RETENTION_LOOP.safetyBoundary.commandExecutionPolicy, /never execute/i);

  assert.deepEqual(TELEGRAM_WEEK1_RETENTION_LOOP.requiredContextFields, [
    "market",
    "locale",
    "product",
    "candidateVenues",
    "onsiteReturnHref",
    "botIntent",
    "subscriptionState",
  ]);

  const scenarioIds = TELEGRAM_WEEK1_RETENTION_LOOP.scenarioMatrix.map((scenario) => scenario.id);
  assert.deepEqual(scenarioIds, ["br-spot-pix-choice", "global-perp-compare-choice", "kr-dex-source-check"]);

  const brScenario = TELEGRAM_WEEK1_RETENTION_LOOP.scenarioMatrix.find((scenario) => scenario.id === "br-spot-pix-choice");
  assert.equal(
    brScenario.onsiteReturnHref,
    "/br/conta?locale=pt-BR&market=BR&product=spot&tg_funnel=retention_week1",
  );
  assert.doesNotMatch(brScenario.onsiteReturnHref, /^\/pt-br\/br\/conta(?:\?|$)/);

  for (const scenario of TELEGRAM_WEEK1_RETENTION_LOOP.scenarioMatrix) {
    assert.ok(scenario.market);
    assert.ok(scenario.locale);
    assert.ok(scenario.product);
    assert.ok(scenario.botIntent);
    assert.ok(scenario.candidateVenues.length >= 3);
    assert.match(scenario.onsiteReturnHref, /^\//);
    assert.doesNotMatch(scenario.onsiteReturnHref, /^\/\//);
    assert.equal(scenario.subscriptionState, "off_until_explicit_opt_in");
    assert.ok(scenario.manualAcceptance.length >= 3);
    assert.match(getTelegramDeepLink(scenario.botDeepLinkAction), /^https:\/\/t\.me\/NexuAlphaAssistantBot\?start=/);
  }

  const serialized = JSON.stringify(TELEGRAM_WEEK1_RETENTION_LOOP);
  assert.doesNotMatch(serialized, /(accounts\.binance\.com|bsmkweb\.cc|partner\.bitget|bitget\.com\/(?:expressly|register|referral|signup)|okx\.com\/(?:join|register|referral)|topzhjdgxcb|backpack\.exchange\/join)/i);
  assert.doesNotMatch(serialized, /11350287|nexu888|luckybitcoin|LUCKX|CANDY007|INS898|1836370407|NEXU888/);
});

test("Week1 Telegram return review keeps subscription and return metrics anonymous", () => {
  assert.deepEqual(TELEGRAM_WEEK1_RETENTION_LOOP.returnReview.windows, ["24h", "7d"]);
  assert.equal(TELEGRAM_WEEK1_RETENTION_LOOP.returnReview.anonymousOnly, true);
  assert.ok(TELEGRAM_WEEK1_RETENTION_LOOP.returnReview.metrics.includes("subscriptionOptIns"));
  assert.ok(TELEGRAM_WEEK1_RETENTION_LOOP.returnReview.metrics.includes("unsubscribes"));
  assert.ok(TELEGRAM_WEEK1_RETENTION_LOOP.returnReview.forbiddenMetrics.includes("registration"));
  assert.ok(TELEGRAM_WEEK1_RETENTION_LOOP.returnReview.forbiddenMetrics.includes("privateCommission"));
  assert.equal(TELEGRAM_WEEK1_RETENTION_LOOP.manualAcceptanceArtifacts.length, 2);
  assert.ok(TELEGRAM_WEEK1_RETENTION_LOOP.manualAcceptanceArtifacts.every((artifact) => artifact.startsWith("docs/")));
});

test("Week1 Telegram manual acceptance artifacts are local-only and protect invite material", () => {
  const markdown = fs.readFileSync(
    new URL("../docs/strategy/telegram-week1-retention-manual-acceptance-20260928.md", import.meta.url),
    "utf8",
  );
  const evidence = JSON.parse(
    fs.readFileSync(new URL("../docs/evidence/telegram-week1-retention-local-review-20260928.json", import.meta.url), "utf8"),
  );
  const serialized = `${markdown}\n${JSON.stringify(evidence)}`;

  assert.equal(evidence.status, "PASS_LOCAL_CONTRACT_ONLY");
  assert.equal(evidence.scope.telegramApiCalls, 0);
  assert.equal(evidence.scope.telegramMessagesSent, 0);
  assert.equal(evidence.scope.realAccountsOperated, 0);
  assert.equal(evidence.scope.externalSubmissions, 0);
  assert.equal(evidence.scope.partnerRegistryEdited, false);
  assert.deepEqual(evidence.scope.protectedUserCommandsExecuted, []);
  assert.equal(evidence.contract.scenarioCount, TELEGRAM_WEEK1_RETENTION_LOOP.scenarioMatrix.length);
  assert.match(markdown, /Do not execute `\/choice`, `\/stop`, `\/delete`/);
  assert.match(markdown, /Do not edit `src\/data\/partner-registry\.js`/);

  for (const scenario of evidence.scenarios) {
    const matchingContract = TELEGRAM_WEEK1_RETENTION_LOOP.scenarioMatrix.find((item) => item.id === scenario.id);
    assert.ok(matchingContract, `${scenario.id} must exist in TELEGRAM_WEEK1_RETENTION_LOOP`);
    assert.equal(scenario.firstOnsiteRoute, matchingContract.onsiteReturnHref);
    assert.deepEqual(scenario.candidateVenues, matchingContract.candidateVenues);
  }

  assert.doesNotMatch(serialized, /(accounts\.binance\.com|bsmkweb\.cc|partner\.bitget|bitget\.com\/(?:expressly|register|referral|signup)|okx\.com\/(?:join|register|referral)|topzhjdgxcb|backpack\.exchange\/join)/i);
  assert.doesNotMatch(serialized, /11350287|nexu888|luckybitcoin|LUCKX|CANDY007|INS898|1836370407|NEXU888/);
  assert.doesNotMatch(serialized, /guaranteed signup|guaranteed rebate|commission payout|commission rate/i);
});

test("Telegram SEO AEO GEO backlog turns community demand into owned-page work", () => {
  assert.equal(TELEGRAM_GROWTH_OPERATING_SYSTEM.seoAeoGeoBacklog.length, 4);
  for (const item of TELEGRAM_GROWTH_OPERATING_SYSTEM.seoAeoGeoBacklog) {
    assert.ok(item.signal.length > 20);
    assert.ok(item.owner);
    assert.ok(item.action.length > 40);
    assert.ok(item.priorityMarkets.length >= 1);
    assert.doesNotMatch(`${item.signal}\n${item.action}`, /commission|raw referral|guaranteed/i);
  }
});

test("cleanTelegramStartPayload enforces Telegram protocol limits (letters, digits, _, -, max 64 chars)", () => {
  assert.equal(cleanTelegramStartPayload("fee_calc_binance"), "fee_calc_binance");
  assert.equal(cleanTelegramStartPayload("compare_binance-vs-okx"), "compare_binance-vs-okx");
  // 特殊符号过滤与多下划线合并
  assert.equal(cleanTelegramStartPayload("calc?!@#binance"), "calc_binance");
  // 长度截断测试
  const overlyLong = "a".repeat(100);
  assert.equal(cleanTelegramStartPayload(overlyLong).length, 64);
});

test("Telegram start payload preserves market locale and product when campaign text is long", () => {
  const payload = buildTelegramStartPayload({
    action: "compare",
    pair: "binance-vs-okx-with-a-very-long-onsite-route",
    campaign: "wave23-onsite-visible-handoff_derivatives_m_GLOBAL_l_ja_t_spot_extra_long",
    market: "GLOBAL",
    locale: "ja",
    product: "spot",
  });

  assert.equal(payload.length, 64);
  assert.match(payload, /_m_GLOBAL_l_ja_t_spot$/);
  assert.doesNotMatch(payload, /wave23-onsite-visible-handoff/);
});

test("Telegram start payload bounds hostile metadata and keeps long actions collision-resistant", () => {
  const hostile = buildTelegramStartPayload({
    action: "compare",
    pair: "binance-vs-okx",
    market: "M".repeat(120),
    locale: "L".repeat(120),
    product: "P".repeat(120),
  });
  assert.ok(hostile.length <= 64);
  assert.match(hostile, /_m_/);
  assert.match(hostile, /_l_/);
  assert.match(hostile, /_t_/);

  const common = "research_route_" + "a".repeat(100);
  const first = buildTelegramStartPayload({ action: `${common}x`, market: "BR", locale: "pt-BR", product: "spot" });
  const second = buildTelegramStartPayload({ action: `${common}y`, market: "BR", locale: "pt-BR", product: "spot" });
  assert.ok(first.length <= 64);
  assert.ok(second.length <= 64);
  assert.notEqual(first, second);
});

test("getTelegramDeepLink correctly routes parameterized actions", () => {
  // 任务指定 4 种典型调用
  assert.equal(
    getTelegramDeepLink({ action: "fee_calc", venue: "binance" }),
    "https://t.me/NexuAlphaAssistantBot?start=fee_calc_binance"
  );
  assert.equal(
    getTelegramDeepLink({ action: "compare", pair: "binance-vs-okx" }),
    "https://t.me/NexuAlphaAssistantBot?start=compare_binance-vs-okx"
  );
  assert.equal(
    getTelegramDeepLink({ action: "launchpool_alert" }),
    "https://t.me/NexuAlphaAssistantBot?start=launchpool_alert"
  );
  assert.equal(
    getTelegramDeepLink({ action: "verify_domain", venue: "okx" }),
    "https://t.me/NexuAlphaAssistantBot?start=verify_domain_okx"
  );

  // 扩展协议：合伙人咨询、地区、语言与分发渠道
  assert.equal(
    getTelegramDeepLink({ action: "partner_desk" }),
    "https://t.me/NexuAlphaAssistantBot?start=partner_desk"
  );
  assert.equal(
    getTelegramDeepLink({ action: "partner_desk", publisher: "kol_alpha" }),
    "https://t.me/NexuAlphaAssistantBot?start=partner_desk_kol_alpha"
  );
  assert.equal(
    getTelegramDeepLink({ action: "partner_desk", market: "BR", locale: "ja", product: "spot" }),
    "https://t.me/NexuAlphaAssistantBot?start=partner_desk_m_BR_l_ja_t_spot"
  );
  assert.equal(
    getTelegramDeepLink({ action: "compare", pair: "binance-vs-okx", market: "BR", locale: "pt-BR", publisher: "creator_01" }),
    "https://t.me/NexuAlphaAssistantBot?start=compare_binance-vs-okx_m_BR_l_ptBR_p_creator_01"
  );
  assert.equal(
    getTelegramDeepLink({ action: "compare", pair: "binance-vs-okx", market: "MX", locale: "es", product: "spot" }),
    "https://t.me/NexuAlphaAssistantBot?start=compare_binance-vs-okx_m_MX_l_es_t_spot"
  );

  // 向下兼容原始字符串与历史形式
  assert.equal(
    getTelegramDeepLink("bleed_okx_futures_100000"),
    "https://t.me/NexuAlphaAssistantBot?start=bleed_okx_futures_100000"
  );
  assert.equal(
    getTelegramDeepLink("/start monitor_binance"),
    "https://t.me/NexuAlphaAssistantBot?start=monitor_binance"
  );
  assert.equal(getTelegramDeepLink(""), "https://t.me/NexuAlphaAssistantBot");
});

test("Telegram hub Bot payloads retain market locale product and campaign context", () => {
  const hubPayload = buildTelegramStartPayload({
    action: "partner_desk",
    market: "JP",
    locale: "ja",
    product: "spot",
    campaign: "telegram_hub_bot",
  });
  assert.ok(hubPayload.length <= 64);
  assert.match(hubPayload, /^partner_desk/);
  assert.match(hubPayload, /_m_JP_l_ja_t_spot/);

  const commandPayload = buildTelegramStartPayload({
    action: "compare",
    pair: "binance-vs-okx",
    market: "BR",
    locale: "pt-BR",
    product: "spot",
    campaign: "telegram_command_rates",
  });
  assert.ok(commandPayload.length <= 64);
  assert.match(commandPayload, /^compare_binance-vs-okx/);
  assert.match(commandPayload, /_m_BR_l_ptBR_t_spot/);
  assert.match(getTelegramDeepLink({ action: "partner_desk", market: "JP", locale: "ja", product: "spot", campaign: "telegram_hub_bot" }), /^https:\/\/t\.me\/NexuAlphaAssistantBot\?start=/);
});

test("website to Telegram funnel context matches Bot candidate return-link protocol", () => {
  const selected = buildTelegramWebsiteFunnelContext({
    intent: "selected",
    venue: "bitget",
    locale: "pt-BR",
    market: "BR",
    product: "spot",
    amount: 1000,
  });
  assert.match(selected.startPayload, /^saved_choice_bitget_m_BR_l_ptBR_t_spot/);
  assert.equal(new URL(selected.deepLink).searchParams.get("start"), selected.startPayload);
  const selectedReturn = readTelegramReturnContext(new URL(`https://nexualpha.example${selected.returnHref}`).search);
  assert.equal(selectedReturn.status, "restored");
  assert.deepEqual(selectedReturn.object, { kind: "venue", venue: "bitget" });
  assert.equal(selectedReturn.market, "BR");
  assert.equal(selectedReturn.product, "spot");
  assert.equal(selectedReturn.locale, "pt-BR");
  assert.equal(selectedReturn.webOnly, false);

  const compare = buildTelegramWebsiteFunnelContext({
    intent: "compare",
    slugs: ["bybit", "bitget"],
    locale: "ja",
    market: "JP",
    product: "perpetuals",
  });
  assert.match(compare.startPayload, /^compare_bybit-vs-bitget_m_JP_l_ja_t_perpetuals/);
  const compareReturn = readTelegramReturnContext(new URL(`https://nexualpha.example${compare.returnHref}`).search);
  assert.equal(compareReturn.status, "restored");
  assert.deepEqual(compareReturn.object, { kind: "pair", pair: "bybit-vs-bitget" });
  assert.equal(compareReturn.market, "JP");
  assert.equal(compareReturn.product, "perpetuals");
  assert.equal(compareReturn.locale, "ja");

  const fees = buildTelegramWebsiteFunnelContext({
    intent: "fees",
    venue: "binance",
    locale: "ko",
    market: "KR",
    product: "spot",
    instrument: "spot",
    amount: 50000,
  });
  assert.match(fees.startPayload, /^fee_calc_binance_spot_50000_m_KR_l_ko_t_spot/);
  const feesReturn = readTelegramReturnContext(new URL(`https://nexualpha.example${fees.returnHref}`).search);
  assert.equal(feesReturn.status, "restored");
  assert.deepEqual(feesReturn.object, { kind: "venue", venue: "binance" });
  assert.equal(feesReturn.market, "KR");
  assert.equal(feesReturn.product, "spot");
  assert.equal(feesReturn.locale, "ko");

  const decimalFees = buildTelegramWebsiteFunnelContext({
    intent: "fees",
    venue: "okx",
    locale: "pt-BR",
    market: "BR",
    product: "spot",
    instrument: "spot",
    amount: 12500.25,
  });
  assert.match(decimalFees.startPayload, /^fee_calc_okx_spot_12500p25_m_BR_l_ptBR_t_spot/);
  assert.equal(new URL(decimalFees.deepLink).searchParams.get("start"), decimalFees.startPayload);
  const decimalFeesReturn = readTelegramReturnContext(new URL(`https://nexualpha.example${decimalFees.returnHref}`).search);
  assert.equal(decimalFeesReturn.status, "restored");
  assert.deepEqual(decimalFeesReturn.object, { kind: "venue", venue: "okx" });
  assert.equal(decimalFeesReturn.market, "BR");
  assert.equal(decimalFeesReturn.product, "spot");

  const stepCanonicalFees = buildTelegramWebsiteFunnelContext({
    intent: "fees",
    venue: "okx",
    locale: "pt-BR",
    market: "BR",
    product: "spot",
    instrument: "spot",
    amount: 12.3456,
  });
  assert.match(stepCanonicalFees.startPayload, /^fee_calc_okx_spot_12p35_m_BR_l_ptBR_t_spot/);
  assert.equal(readTelegramReturnContext(new URL(`https://nexualpha.example${stepCanonicalFees.returnHref}`).search).status, "restored");

  const belowStepFees = buildTelegramWebsiteFunnelContext({
    intent: "fees",
    venue: "okx",
    locale: "pt-BR",
    market: "BR",
    product: "spot",
    instrument: "spot",
    amount: 0.0001,
  });
  assert.match(belowStepFees.startPayload, /^fee_calc_okx_spot_0_m_BR_l_ptBR_t_spot/);
  assert.equal(readTelegramReturnContext(new URL(`https://nexualpha.example${belowStepFees.returnHref}`).search).status, "restored");

  const unsafeLongFees = buildTelegramWebsiteFunnelContext({
    intent: "fees",
    venue: "okx",
    locale: "pt-BR",
    market: "BR",
    product: "spot",
    instrument: "spot",
    amount: "10000000000.01",
  });
  assert.match(unsafeLongFees.startPayload, /^fee_calc_okx_spot_m_BR_l_ptBR_t_spot/);
  assert.doesNotMatch(unsafeLongFees.startPayload, /10000000000|p01/);
  assert.equal(readTelegramReturnContext(new URL(`https://nexualpha.example${unsafeLongFees.returnHref}`).search).status, "restored");

  const allVenueFees = buildTelegramWebsiteFunnelContext({
    intent: "fees",
    venue: "all",
    locale: "ja",
    market: "GLOBAL",
    product: "spot",
    instrument: "spot",
    amount: 777777,
  });
  assert.match(allVenueFees.startPayload, /^fee_calc_all_spot_777777_m_GLOBAL_l_ja_t_spot/);
  assert.equal(readTelegramReturnContext(new URL(`https://nexualpha.example${allVenueFees.returnHref}`).search).reason, "unknown_object");
  assert.doesNotMatch(allVenueFees.startPayload + allVenueFees.returnHref, /binance/i);

  const monitor = buildTelegramWebsiteFunnelContext({
    intent: "monitor",
    venue: "okx",
    locale: "tr",
    market: "TR",
    product: "perpetuals",
  });
  assert.match(monitor.startPayload, /^monitor_okx_m_TR_l_tr_t_perpetuals/);
  const monitorReturn = readTelegramReturnContext(new URL(`https://nexualpha.example${monitor.returnHref}`).search);
  assert.equal(monitorReturn.status, "restored");
  assert.deepEqual(monitorReturn.object, { kind: "venue", venue: "okx" });
  assert.equal(monitorReturn.market, "TR");
  assert.equal(monitorReturn.product, "perpetuals");
  for (const context of [selected, compare, fees, decimalFees, stepCanonicalFees, belowStepFees, unsafeLongFees, allVenueFees, monitor]) {
    assert.ok(context.startPayload.length <= 64);
    assert.doesNotMatch(context.deepLink + context.returnHref, /accounts\.binance\.com|partner\.bitget|topzhjdgxcb|backpack\.exchange|11350287|nexu888|luckybitcoin/i);
  }
});

test("website Telegram funnel compresses long metadata while keeping Bot-parsed critical fields", () => {
  const context = buildTelegramWebsiteFunnelContext({
    intent: "compare",
    pair: "hyperliquid-vs-dydx",
    market: "GLOBAL",
    locale: "pt-BR",
    product: "perpetuals",
    campaign: "very_long_campaign_name_that_should_not_break_telegram_start_payload",
  });
  assert.ok(context.startPayload.length <= 64);
  assert.match(context.startPayload, /_m_GLOBAL_l_ptBR_t_perpetuals/);
  const restored = readTelegramReturnContext(new URL(`https://nexualpha.example${context.returnHref}`).search);
  assert.equal(restored.status, "restored");
  assert.deepEqual(restored.object, { kind: "pair", pair: "hyperliquid-vs-dydx" });
  assert.equal(restored.market, "GLOBAL");
  assert.equal(restored.product, "perpetuals");
  assert.equal(restored.locale, "pt-BR");
});

test("TELEGRAM_COMMANDS lists only commands the bot registers (/fees, /alert, /checklink) with multilingual support", () => {
  const ids = TELEGRAM_COMMANDS.map((c) => c.id);
  assert.deepEqual(ids, ["rates", "alert", "check"]);
  assert.deepEqual(TELEGRAM_COMMANDS.map((c) => c.command), ["/fees", "/alert", "/checklink"]);

  for (const cmd of TELEGRAM_COMMANDS) {
    assert.ok(cmd.command.startsWith("/"));
    assert.ok(cmd.nameZh && cmd.nameHant && cmd.nameEn);
    assert.ok(cmd.descZh && cmd.descHant && cmd.descEn);
    assert.ok(cmd.badgeZh && cmd.badgeHant && cmd.badgeEn);
    assert.ok(cmd.sampleUsage);
    assert.ok(cmd.deepLinkAction);
    const deepLink = getTelegramDeepLink(cmd.deepLinkAction);
    assert.match(deepLink, /^https:\/\/t\.me\/NexuAlphaAssistantBot\?start=/);
  }
});

test("TELEGRAM_RESEARCH_PATHS keeps public hub routes answer-first and onsite-only", () => {
  assert.equal(TELEGRAM_RESEARCH_PATHS.length, 4);
  const expectedIds = ["fee-comparison", "regional-onboarding", "dex-safety", "ops-news"];
  assert.deepEqual(TELEGRAM_RESEARCH_PATHS.map((path) => path.id), expectedIds);

  for (const path of TELEGRAM_RESEARCH_PATHS) {
    assert.ok(path.question.en, `English question is required for ${path.id}`);
    assert.ok(path.answer.en, `English answer is required for ${path.id}`);
    assert.ok(path.deepLinkAction, `Bot follow-up action is required for ${path.id}`);
    assert.ok(path.entries.length >= 3, `at least three onsite entries are required for ${path.id}`);
    for (const entry of path.entries) {
      assert.ok(entry.label.en, `English entry label is required for ${path.id}`);
      assert.match(entry.href, /^\//, `entry must stay onsite for ${path.id}`);
      assert.doesNotMatch(entry.href, /^\/\//, `entry must not be protocol-relative for ${path.id}`);
      assert.doesNotMatch(entry.href, /^https?:/i, `entry must not be external for ${path.id}`);
    }
    assert.match(getTelegramDeepLink(path.deepLinkAction), /^https:\/\/t\.me\/NexuAlphaAssistantBot\?start=/);
  }
});

test("TELEGRAM_WAVE7_SEARCH_TOPICS maps the three target queries to onsite-first review routes", () => {
  assert.deepEqual(TELEGRAM_WAVE7_SEARCH_TOPICS.map((topic) => topic.query), [
    "hyperliquid fees",
    "hyperliquid funded account",
    "uniswap testnet",
  ]);

  for (const topic of TELEGRAM_WAVE7_SEARCH_TOPICS) {
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.ok(topic.answer.length > 80);
    assert.match(topic.primaryPath, /^\//);
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.doesNotMatch(`${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /^https?:/im);
  }
});

test("TELEGRAM_WAVE8_SEARCH_TOPICS adds Aerodrome, Jupiter and no-KYC onsite-first routes", () => {
  assert.deepEqual(TELEGRAM_WAVE8_SEARCH_TOPICS.map((topic) => topic.query), [
    "aerodrome base pool",
    "jupiter swap route",
    "no kyc crypto exchange",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  for (const topic of TELEGRAM_WAVE8_SEARCH_TOPICS) {
    assert.equal(topic.wave, "wave8_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.ok(topic.answer.length > 70);
    assert.match(topic.primaryPath, /^\//);
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.doesNotMatch(`${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /^https?:/im);
  }
});

test("TELEGRAM_WAVE9_SEARCH_TOPICS adds RWA, OKX migration and perp-platform onsite-first routes", () => {
  assert.deepEqual(TELEGRAM_WAVE9_SEARCH_TOPICS.map((topic) => topic.query), [
    "tokenized treasury",
    "OKX USD to USDC spot pair migration",
    "crypto perpetual platform",
  ]);

  for (const topic of TELEGRAM_WAVE9_SEARCH_TOPICS) {
    assert.equal(topic.wave, "wave9_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.ok(topic.answer.length > 70);
    assert.match(topic.primaryPath, /^\//);
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.doesNotMatch(`${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /^https?:/im);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /signup reward|guaranteed discount|private commission|invite code|referral link/i);
  }
});

test("TELEGRAM_WAVE10_SEARCH_TOPICS adds Korea and Turkey onsite-first regional routes", () => {
  assert.deepEqual(TELEGRAM_WAVE10_SEARCH_TOPICS.map((topic) => topic.query), [
    "한국 가상자산 플랫폼 공식 확인",
    "원화 입금 실명 계좌 조건",
    "Türkiye kripto platformu SPK listesi",
    "TRY yatırma banka hesabı koşulları",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  for (const topic of TELEGRAM_WAVE10_SEARCH_TOPICS) {
    assert.equal(topic.wave, "wave10_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.ok(["ko", "tr"].includes(topic.locale));
    assert.ok(topic.answer.length > 70);
    assert.match(topic.primaryPath, /^\//);
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /private commission|invite code|referral link|raw registration/i);
    assert.ok(topic.supportPaths.includes("/exchanges/hyperliquid") || topic.supportPaths.includes("/compare/hyperliquid-vs-dydx"));
    assert.ok(topic.supportPaths.includes("/exchanges/uniswap") || topic.supportPaths.includes("/rates"));
  }
});

test("TELEGRAM_WAVE11_SEARCH_TOPICS adds DeFi, operations, Brazil, Korea and Türkiye routes", () => {
  assert.deepEqual(TELEGRAM_WAVE11_SEARCH_TOPICS.map((topic) => topic.query), [
    "Hyperliquid funding rate before opening a position",
    "Hyperliquid vs dYdX risk comparison",
    "Uniswap v4 deployment official check",
    "Jupiter Ultra token mint check",
    "Aerodrome Slipstream incentives check",
    "BUIDL BENJI tokenized treasury comparison",
    "OKX USDC migration API instrument check",
    "saque Pix exchange cripto Brasil",
    "KYC CPF corretora cripto Brasil",
    "한국 가상자산 계정 공식 확인 체크리스트",
    "Türkiye kripto hesap kontrol listesi",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  for (const topic of TELEGRAM_WAVE11_SEARCH_TOPICS) {
    assert.equal(topic.wave, "wave11_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.ok(["en", "pt-BR", "ko", "tr"].includes(topic.locale));
    assert.ok(topic.answer.length > 70);
    assert.match(topic.primaryPath, /^\//);
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /private commission|invite code|referral link|raw registration/i);
  }

  const turkeyTopic = TELEGRAM_WAVE11_SEARCH_TOPICS.find((topic) => topic.id === "turkey-market-account-check-tr");
  assert.equal(turkeyTopic.primaryPath, "/markets/turkiye");
});

test("TELEGRAM_WAVE13_SEARCH_TOPICS adds non-duplicated tokenized-assets, Korea and Türkiye drafts", () => {
  assert.deepEqual(TELEGRAM_WAVE13_SEARCH_TOPICS.map((topic) => topic.query), [
    "tokenized treasury redemption risk",
    "tokenized stock vs stock perpetual",
    "tokenized assets custody proof",
    "RWA treasury transfer restrictions",
    "한국 토큰화 자산 주식 퍼프 구분",
    "한국 Hyperliquid funding 수수료 청산 확인",
    "한국 Uniswap 지갑 서명 경로 확인",
    "Bybit Bitget 주식 상품 토큰화 구분",
    "Türkiye tokenized asset hisse perp ayrımı",
    "Türkiye Hyperliquid funding ücret likidasyon kontrolü",
    "Türkiye Uniswap cüzdan imza yolu kontrolü",
    "Bybit Bitget stock tokenized perp Türkiye",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  const previousTopicIds = new Set([
    ...TELEGRAM_WAVE7_SEARCH_TOPICS,
    ...TELEGRAM_WAVE8_SEARCH_TOPICS,
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE10_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
  ].map((topic) => topic.id));
  for (const topic of TELEGRAM_WAVE13_SEARCH_TOPICS) {
    assert.equal(previousTopicIds.has(topic.id), false, `Wave13 topic must not duplicate existing queue id: ${topic.id}`);
    assert.equal(topic.wave, "wave13_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.ok(["en", "ko", "tr"].includes(topic.locale));
    assert.ok(topic.answer.length > 80);
    assert.match(topic.primaryPath, /^\//);
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /private commission|invite code|referral link|raw registration|bonus guarantee/i);
  }
});

test("TELEGRAM_WAVE25_SEARCH_TOPICS adds citation-asset distribution drafts", () => {
  assert.deepEqual(TELEGRAM_WAVE25_SEARCH_TOPICS.map((topic) => topic.query), [
    "perp dex cost field dictionary",
    "crypto regional funding verification matrix",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  const previousTopicIds = new Set([
    ...TELEGRAM_WAVE7_SEARCH_TOPICS,
    ...TELEGRAM_WAVE8_SEARCH_TOPICS,
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE10_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
    ...TELEGRAM_WAVE13_SEARCH_TOPICS,
  ].map((topic) => topic.id));
  for (const topic of TELEGRAM_WAVE25_SEARCH_TOPICS) {
    assert.equal(previousTopicIds.has(topic.id), false, `Wave25 topic must not duplicate existing queue id: ${topic.id}`);
    assert.equal(topic.wave, "wave25_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.equal(topic.locale, "en");
    assert.ok(topic.answer.length > 120);
    assert.match(topic.primaryPath, /^\//);
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /private commission|invite code|referral link|raw registration|guaranteed signup|guaranteed discount/i);
  }
});

test("TELEGRAM_WAVE26_SEARCH_TOPICS adds the regional funding matrix rollout draft", () => {
  assert.deepEqual(TELEGRAM_WAVE26_SEARCH_TOPICS.map((topic) => topic.query), [
    "regional crypto funding verification checklist",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  const previousTopicIds = new Set([
    ...TELEGRAM_WAVE7_SEARCH_TOPICS,
    ...TELEGRAM_WAVE8_SEARCH_TOPICS,
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE10_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
    ...TELEGRAM_WAVE13_SEARCH_TOPICS,
    ...TELEGRAM_WAVE25_SEARCH_TOPICS,
  ].map((topic) => topic.id));
  for (const topic of TELEGRAM_WAVE26_SEARCH_TOPICS) {
    assert.equal(previousTopicIds.has(topic.id), false, `Wave26 topic must not duplicate existing queue id: ${topic.id}`);
    assert.equal(topic.wave, "wave26_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.equal(topic.locale, "en");
    assert.ok(topic.answer.length > 120);
    assert.equal(topic.primaryPath, "/br/pix");
    assert.deepEqual(topic.supportPaths, ["/kr", "/markets/turkiye"]);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /private commission|invite code|referral link|raw registration|guaranteed signup|guaranteed discount/i);
  }
});

test("TELEGRAM_WAVE27_SEARCH_TOPICS adds Aerodrome/Jupiter and JP/MX funding drafts", () => {
  assert.deepEqual(TELEGRAM_WAVE27_SEARCH_TOPICS.map((topic) => topic.query), [
    "Aerodrome Jupiter route cost check",
    "日本 メキシコ 暗号資産 入金 条件",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  const previousTopicIds = new Set([
    ...TELEGRAM_WAVE7_SEARCH_TOPICS,
    ...TELEGRAM_WAVE8_SEARCH_TOPICS,
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE10_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
    ...TELEGRAM_WAVE13_SEARCH_TOPICS,
    ...TELEGRAM_WAVE25_SEARCH_TOPICS,
    ...TELEGRAM_WAVE26_SEARCH_TOPICS,
  ].map((topic) => topic.id));
  for (const topic of TELEGRAM_WAVE27_SEARCH_TOPICS) {
    assert.equal(previousTopicIds.has(topic.id), false, `Wave27 topic must not duplicate existing queue id: ${topic.id}`);
    assert.equal(topic.wave, "wave27_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.ok(["en", "ja"].includes(topic.locale));
    assert.ok(topic.answer.length > 80);
    assert.match(topic.primaryPath, /^\//);
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /private commission|invite code|referral link|raw registration|guaranteed signup|guaranteed discount/i);
  }
});

test("TELEGRAM_WAVE28_SEARCH_TOPICS adds localized on-chain route drafts", () => {
  assert.deepEqual(TELEGRAM_WAVE28_SEARCH_TOPICS.map((topic) => topic.query), [
    "한국 온체인 라우트 지갑 수수료 확인",
    "Türkiye on-chain cüzdan rota ücret kontrolü",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  const previousTopicIds = new Set([
    ...TELEGRAM_WAVE7_SEARCH_TOPICS,
    ...TELEGRAM_WAVE8_SEARCH_TOPICS,
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE10_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
    ...TELEGRAM_WAVE13_SEARCH_TOPICS,
    ...TELEGRAM_WAVE25_SEARCH_TOPICS,
    ...TELEGRAM_WAVE26_SEARCH_TOPICS,
    ...TELEGRAM_WAVE27_SEARCH_TOPICS,
  ].map((topic) => topic.id));
  for (const topic of TELEGRAM_WAVE28_SEARCH_TOPICS) {
    assert.equal(previousTopicIds.has(topic.id), false, `Wave28 topic must not duplicate existing queue id: ${topic.id}`);
    assert.equal(topic.wave, "wave28_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.ok(["ko", "tr"].includes(topic.locale));
    assert.ok(topic.answer.length > 80);
    assert.match(topic.primaryPath, /^\//);
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /private commission|invite code|referral link|raw registration|guaranteed signup|guaranteed discount/i);
  }
});

test("TELEGRAM_WAVE29_SEARCH_TOPICS adds French and German GSC-demand drafts", () => {
  assert.deepEqual(TELEGRAM_WAVE29_SEARCH_TOPICS.map((topic) => topic.query), [
    "frais funding Hyperliquid perp DEX",
    "Uniswap Wallet Route Gebühren prüfen",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  const previousTopicIds = new Set([
    ...TELEGRAM_WAVE7_SEARCH_TOPICS,
    ...TELEGRAM_WAVE8_SEARCH_TOPICS,
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE10_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
    ...TELEGRAM_WAVE13_SEARCH_TOPICS,
    ...TELEGRAM_WAVE25_SEARCH_TOPICS,
    ...TELEGRAM_WAVE26_SEARCH_TOPICS,
    ...TELEGRAM_WAVE27_SEARCH_TOPICS,
    ...TELEGRAM_WAVE28_SEARCH_TOPICS,
  ].map((topic) => topic.id));
  for (const topic of TELEGRAM_WAVE29_SEARCH_TOPICS) {
    assert.equal(previousTopicIds.has(topic.id), false, `Wave29 topic must not duplicate existing queue id: ${topic.id}`);
    assert.equal(topic.wave, "wave29_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.ok(["fr", "de"].includes(topic.locale));
    assert.ok(topic.answer.length > 120);
    assert.match(topic.primaryPath, /^\/exchanges\//);
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /private commission|invite code|referral link|raw registration|guaranteed signup|guaranteed discount|garantie|garantiert/i);
  }
});

test("TELEGRAM_WAVE30_SEARCH_TOPICS deepens French Hyperliquid and German Uniswap drafts", () => {
  assert.deepEqual(TELEGRAM_WAVE30_SEARCH_TOPICS.map((topic) => topic.query), [
    "Hyperliquid frais funding source officielle liquidation",
    "Uniswap Genehmigung Slippage Gas offizielle Quelle",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  const previousTopicIds = new Set([
    ...TELEGRAM_WAVE7_SEARCH_TOPICS,
    ...TELEGRAM_WAVE8_SEARCH_TOPICS,
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE10_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
    ...TELEGRAM_WAVE13_SEARCH_TOPICS,
    ...TELEGRAM_WAVE25_SEARCH_TOPICS,
    ...TELEGRAM_WAVE26_SEARCH_TOPICS,
    ...TELEGRAM_WAVE27_SEARCH_TOPICS,
    ...TELEGRAM_WAVE28_SEARCH_TOPICS,
    ...TELEGRAM_WAVE29_SEARCH_TOPICS,
  ].map((topic) => topic.id));
  for (const topic of TELEGRAM_WAVE30_SEARCH_TOPICS) {
    assert.equal(previousTopicIds.has(topic.id), false, `Wave30 topic must not duplicate existing queue id: ${topic.id}`);
    assert.equal(topic.wave, "wave30_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.ok(["fr", "de"].includes(topic.locale));
    assert.ok(topic.answer.length > 120);
    assert.match(topic.primaryPath, /^\/exchanges\//);
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /private commission|invite code|referral link|raw registration|guaranteed signup|guaranteed discount|garantie|garantiert|profit promise|yield promise/i);
  }
});

test("TELEGRAM_WAVE31_SEARCH_TOPICS adds multilingual Binance fee, KYC and source-boundary drafts", () => {
  assert.deepEqual(TELEGRAM_WAVE31_SEARCH_TOPICS.map((topic) => topic.query), [
    "Binance vs OKX comisiones KYC restricciones regionales",
    "Binance taxas KYC restrições regionais fonte oficial",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  const previousTopicIds = new Set([
    ...TELEGRAM_WAVE7_SEARCH_TOPICS,
    ...TELEGRAM_WAVE8_SEARCH_TOPICS,
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE10_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
    ...TELEGRAM_WAVE13_SEARCH_TOPICS,
    ...TELEGRAM_WAVE25_SEARCH_TOPICS,
    ...TELEGRAM_WAVE26_SEARCH_TOPICS,
    ...TELEGRAM_WAVE27_SEARCH_TOPICS,
    ...TELEGRAM_WAVE28_SEARCH_TOPICS,
    ...TELEGRAM_WAVE29_SEARCH_TOPICS,
    ...TELEGRAM_WAVE30_SEARCH_TOPICS,
  ].map((topic) => topic.id));
  for (const topic of TELEGRAM_WAVE31_SEARCH_TOPICS) {
    assert.equal(previousTopicIds.has(topic.id), false, `Wave31 topic must not duplicate existing queue id: ${topic.id}`);
    assert.equal(topic.wave, "wave31_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.ok(["es", "pt-BR"].includes(topic.locale));
    assert.ok(topic.answer.length > 120);
    assert.ok(["/compare/binance-vs-okx", "/exchanges/binance"].includes(topic.primaryPath));
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.match(`${topic.query}\n${topic.answer}`, /KYC|regi[oó]n|regionais|restricciones|restrições/i);
    assert.match(`${topic.query}\n${topic.answer}`, /comisiones|taxas|fee|fuente|fonte|source/i);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /private commission|invite code|referral link|raw registration|guaranteed signup|guaranteed discount|bono garantizado|bônus garantido|cadastro aceito garantido/i);
  }
});

test("TELEGRAM_WAVE32_SEARCH_TOPICS adds dated news-source drafts for GSC zero-click pages", () => {
  assert.deepEqual(TELEGRAM_WAVE32_SEARCH_TOPICS.map((topic) => topic.query), [
    "OKX USD USDC migration spot pair date API orders",
    "Hyperliquid vs dYdX 资金费率 手续费 风险 对比",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  const previousTopicIds = new Set([
    ...TELEGRAM_WAVE7_SEARCH_TOPICS,
    ...TELEGRAM_WAVE8_SEARCH_TOPICS,
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE10_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
    ...TELEGRAM_WAVE13_SEARCH_TOPICS,
    ...TELEGRAM_WAVE25_SEARCH_TOPICS,
    ...TELEGRAM_WAVE26_SEARCH_TOPICS,
    ...TELEGRAM_WAVE27_SEARCH_TOPICS,
    ...TELEGRAM_WAVE28_SEARCH_TOPICS,
    ...TELEGRAM_WAVE29_SEARCH_TOPICS,
    ...TELEGRAM_WAVE30_SEARCH_TOPICS,
    ...TELEGRAM_WAVE31_SEARCH_TOPICS,
  ].map((topic) => topic.id));
  for (const topic of TELEGRAM_WAVE32_SEARCH_TOPICS) {
    assert.equal(previousTopicIds.has(topic.id), false, `Wave32 topic must not duplicate existing queue id: ${topic.id}`);
    assert.equal(topic.wave, "wave32_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.ok(["en", "zh-Hans"].includes(topic.locale));
    assert.ok(topic.answer.length > 120);
    assert.match(topic.primaryPath, /^\/news\//);
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.match(`${topic.answer}\n${topic.query}`, /date|source|fees|official|日期|来源|资金费率|手续费/i);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /private commission|invite code|referral link|raw registration|guaranteed signup|guaranteed discount|承诺收益|收益保证|交易结果保证/i);
  }
});

test("TELEGRAM_WAVE33_SEARCH_TOPICS adds boundary drafts for Hyperliquid, Uniswap and tokenized Treasuries", () => {
  assert.deepEqual(TELEGRAM_WAVE33_SEARCH_TOPICS.map((topic) => topic.query), [
    "Hyperliquid fees funded account boundary",
    "Uniswap testnet mainnet wallet route boundary",
    "tokenized Treasury issuer custody redemption boundary",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  const previousTopicIds = new Set([
    ...TELEGRAM_WAVE7_SEARCH_TOPICS,
    ...TELEGRAM_WAVE8_SEARCH_TOPICS,
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE10_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
    ...TELEGRAM_WAVE13_SEARCH_TOPICS,
    ...TELEGRAM_WAVE25_SEARCH_TOPICS,
    ...TELEGRAM_WAVE26_SEARCH_TOPICS,
    ...TELEGRAM_WAVE27_SEARCH_TOPICS,
    ...TELEGRAM_WAVE28_SEARCH_TOPICS,
    ...TELEGRAM_WAVE29_SEARCH_TOPICS,
    ...TELEGRAM_WAVE30_SEARCH_TOPICS,
    ...TELEGRAM_WAVE31_SEARCH_TOPICS,
    ...TELEGRAM_WAVE32_SEARCH_TOPICS,
  ].map((topic) => topic.id));
  for (const topic of TELEGRAM_WAVE33_SEARCH_TOPICS) {
    assert.equal(previousTopicIds.has(topic.id), false, `Wave33 topic must not duplicate existing queue id: ${topic.id}`);
    assert.equal(topic.wave, "wave33_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.equal(topic.locale, "en");
    assert.ok(topic.answer.length > 120);
    assert.match(topic.primaryPath, /^\/(exchanges|news|topics)\//);
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.match(`${topic.query}\n${topic.answer}`, /boundary|fees|funded|testnet|mainnet|issuer|custodian|redemption|Treasury|custody/i);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /private commission|invite code|referral link|raw registration|guaranteed signup|guaranteed discount|guaranteed yield|guaranteed trading|guaranteed redemption/i);
  }
});

test("TELEGRAM_WAVE34_SEARCH_TOPICS adds product, perpetual-risk and dated-news boundary drafts", () => {
  assert.deepEqual(TELEGRAM_WAVE34_SEARCH_TOPICS.map((topic) => topic.query), [
    "bitget vs bybit stocks",
    "crypto perpetual platform",
    "hyperliquid latest news",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  const previousTopicIds = new Set([
    ...TELEGRAM_WAVE7_SEARCH_TOPICS,
    ...TELEGRAM_WAVE8_SEARCH_TOPICS,
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE10_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
    ...TELEGRAM_WAVE13_SEARCH_TOPICS,
    ...TELEGRAM_WAVE25_SEARCH_TOPICS,
    ...TELEGRAM_WAVE26_SEARCH_TOPICS,
    ...TELEGRAM_WAVE27_SEARCH_TOPICS,
    ...TELEGRAM_WAVE28_SEARCH_TOPICS,
    ...TELEGRAM_WAVE29_SEARCH_TOPICS,
    ...TELEGRAM_WAVE30_SEARCH_TOPICS,
    ...TELEGRAM_WAVE31_SEARCH_TOPICS,
    ...TELEGRAM_WAVE32_SEARCH_TOPICS,
    ...TELEGRAM_WAVE33_SEARCH_TOPICS,
  ].map((topic) => topic.id));
  for (const topic of TELEGRAM_WAVE34_SEARCH_TOPICS) {
    assert.equal(previousTopicIds.has(topic.id), false, `Wave34 topic must not duplicate existing queue id: ${topic.id}`);
    assert.equal(topic.wave, "wave34_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.equal(topic.locale, "en");
    assert.ok(topic.answer.length > 120);
    assert.match(topic.primaryPath, /^\/(compare|topics|news)\//);
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /private commission|invite code|referral link|raw registration|guaranteed signup|guaranteed discount|real-time news|live incident|current trading signal/i);
  }

  const stockTopic = TELEGRAM_WAVE34_SEARCH_TOPICS.find((topic) => topic.id === "bitget-bybit-stocks-product-boundary-en");
  assert.match(stockTopic.answer, /real equities|tokenized stocks|stock perpetuals|copy trading/i);
  const perpetualTopic = TELEGRAM_WAVE34_SEARCH_TOPICS.find((topic) => topic.id === "crypto-perpetual-platform-risk-stack-en");
  assert.match(perpetualTopic.answer, /funding|margin|collateral|oracle|liquidation/i);
  const latestNewsTopic = TELEGRAM_WAVE34_SEARCH_TOPICS.find((topic) => topic.id === "hyperliquid-latest-news-date-source-en");
  assert.match(latestNewsTopic.answer, /dated NexuAlpha source page|platform profile/i);
  assert.match(latestNewsTopic.answer, /source review only|does not present/i);
});

test("TELEGRAM_WAVE35_SEARCH_TOPICS adds AI-citation readability drafts", () => {
  assert.deepEqual(TELEGRAM_WAVE35_SEARCH_TOPICS.map((topic) => topic.query), [
    "how NexuAlpha cites crypto platform sources",
    "crypto exchange fee evidence source boundary",
    "regional crypto funding verification AI answer",
    "tokenized asset ownership redemption evidence",
    "perp risk fields funding margin collateral oracle liquidation",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  const previousTopicIds = new Set([
    ...TELEGRAM_WAVE7_SEARCH_TOPICS,
    ...TELEGRAM_WAVE8_SEARCH_TOPICS,
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE10_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
    ...TELEGRAM_WAVE13_SEARCH_TOPICS,
    ...TELEGRAM_WAVE25_SEARCH_TOPICS,
    ...TELEGRAM_WAVE26_SEARCH_TOPICS,
    ...TELEGRAM_WAVE27_SEARCH_TOPICS,
    ...TELEGRAM_WAVE28_SEARCH_TOPICS,
    ...TELEGRAM_WAVE29_SEARCH_TOPICS,
    ...TELEGRAM_WAVE30_SEARCH_TOPICS,
    ...TELEGRAM_WAVE31_SEARCH_TOPICS,
    ...TELEGRAM_WAVE32_SEARCH_TOPICS,
    ...TELEGRAM_WAVE33_SEARCH_TOPICS,
    ...TELEGRAM_WAVE34_SEARCH_TOPICS,
  ].map((topic) => topic.id));
  for (const topic of TELEGRAM_WAVE35_SEARCH_TOPICS) {
    assert.equal(previousTopicIds.has(topic.id), false, `Wave35 topic must not duplicate existing queue id: ${topic.id}`);
    assert.equal(topic.wave, "wave35_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.equal(topic.locale, "en");
    assert.ok(topic.answer.length > 120);
    assert.match(topic.primaryPath, /^\/(methodology|news|br|topics)\b/);
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /private commission|invite code|referral link|raw registration|guaranteed signup|guaranteed discount|guaranteed yield|guaranteed ranking|trade recommendation/i);
  }

  assert.match(TELEGRAM_WAVE35_SEARCH_TOPICS.find((topic) => topic.id === "ai-citation-source-methodology-en").answer, /checked|official|outside scope|citation/i);
  assert.match(TELEGRAM_WAVE35_SEARCH_TOPICS.find((topic) => topic.id === "ai-citation-fee-evidence-boundary-en").answer, /maker\/taker|VIP|source date|evidence/i);
  assert.match(TELEGRAM_WAVE35_SEARCH_TOPICS.find((topic) => topic.id === "ai-citation-regional-funding-check-en").answer, /local rail|identity|withdrawal|official-source date/i);
  assert.match(TELEGRAM_WAVE35_SEARCH_TOPICS.find((topic) => topic.id === "ai-citation-tokenized-asset-ownership-redemption-en").answer, /issuer|custodian|holder rights|redemption/i);
  assert.match(TELEGRAM_WAVE35_SEARCH_TOPICS.find((topic) => topic.id === "ai-citation-perp-risk-fields-en").answer, /funding cadence|margin mode|collateral asset|oracle source|liquidation rule/i);
});

test("TELEGRAM_WAVE36_SEARCH_TOPICS adds indexable regional return-path drafts", () => {
  assert.deepEqual(TELEGRAM_WAVE36_SEARCH_TOPICS.map((topic) => topic.query), [
    "Hong Kong crypto account VASP funding checklist",
    "EU crypto platform MiCA access funding checklist",
    "UK crypto exchange FCA risk warning funding checklist",
    "日本 暗号資産 交換業者 日本円 入金 確認",
    "한국 가상자산 거래소 원화 입금 계정 확인",
    "Türkiye kripto platformu TRY yatırma SPK kontrol listesi",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  const previousTopicIds = new Set([
    ...TELEGRAM_WAVE7_SEARCH_TOPICS,
    ...TELEGRAM_WAVE8_SEARCH_TOPICS,
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE10_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
    ...TELEGRAM_WAVE13_SEARCH_TOPICS,
    ...TELEGRAM_WAVE25_SEARCH_TOPICS,
    ...TELEGRAM_WAVE26_SEARCH_TOPICS,
    ...TELEGRAM_WAVE27_SEARCH_TOPICS,
    ...TELEGRAM_WAVE28_SEARCH_TOPICS,
    ...TELEGRAM_WAVE29_SEARCH_TOPICS,
    ...TELEGRAM_WAVE30_SEARCH_TOPICS,
    ...TELEGRAM_WAVE31_SEARCH_TOPICS,
    ...TELEGRAM_WAVE32_SEARCH_TOPICS,
    ...TELEGRAM_WAVE33_SEARCH_TOPICS,
    ...TELEGRAM_WAVE34_SEARCH_TOPICS,
    ...TELEGRAM_WAVE35_SEARCH_TOPICS,
  ].map((topic) => topic.id));
  const expectedLandingPaths = new Map([
    ["hk-vasp-account-check-en", "/hk"],
    ["eu-mica-platform-access-en", "/eu"],
    ["uk-fca-crypto-risk-access-en", "/uk"],
    ["jp-fsa-jpy-funding-check-ja", "/jp"],
    ["kr-krw-account-funding-check-ko", "/kr"],
    ["tr-try-spk-funding-check-tr", "/markets/turkiye"],
  ]);
  for (const topic of TELEGRAM_WAVE36_SEARCH_TOPICS) {
    assert.equal(previousTopicIds.has(topic.id), false, `Wave36 topic must not duplicate existing queue id: ${topic.id}`);
    assert.equal(topic.wave, "wave36_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.equal(topic.primaryPath, expectedLandingPaths.get(topic.id));
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.ok(topic.answer.length > 80);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /private commission|invite code|referral link|raw registration|guaranteed signup|guaranteed discount|guaranteed yield|guaranteed ranking|raw exchange/i);
  }
  assert.match(TELEGRAM_WAVE36_SEARCH_TOPICS.find((topic) => topic.id === "hk-vasp-account-check-en").answer, /SFC\/VASP|funding rail|custody/i);
  assert.match(TELEGRAM_WAVE36_SEARCH_TOPICS.find((topic) => topic.id === "eu-mica-platform-access-en").answer, /MiCA|country availability|stablecoin/i);
  assert.match(TELEGRAM_WAVE36_SEARCH_TOPICS.find((topic) => topic.id === "uk-fca-crypto-risk-access-en").answer, /FCA|GBP funding|withdrawal/i);
  assert.match(TELEGRAM_WAVE36_SEARCH_TOPICS.find((topic) => topic.id === "jp-fsa-jpy-funding-check-ja").answer, /FSA登録|日本円入金|保証しない/);
  assert.match(TELEGRAM_WAVE36_SEARCH_TOPICS.find((topic) => topic.id === "kr-krw-account-funding-check-ko").answer, /공식 출처|원화 입금|보장하지 않습니다/);
  assert.match(TELEGRAM_WAVE36_SEARCH_TOPICS.find((topic) => topic.id === "tr-try-spk-funding-check-tr").answer, /SPK|TRY yatırma|garantisi vermez/i);
});

test("TELEGRAM_WAVE37_SEARCH_TOPICS adds funding data-asset boundary drafts", () => {
  assert.deepEqual(TELEGRAM_WAVE37_SEARCH_TOPICS.map((topic) => topic.query), [
    "regional funding verification matrix nine source-linked markets",
    "HK KR SG TR crypto funding official verification rows",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  const previousTopicIds = new Set([
    ...TELEGRAM_WAVE7_SEARCH_TOPICS,
    ...TELEGRAM_WAVE8_SEARCH_TOPICS,
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE10_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
    ...TELEGRAM_WAVE13_SEARCH_TOPICS,
    ...TELEGRAM_WAVE25_SEARCH_TOPICS,
    ...TELEGRAM_WAVE26_SEARCH_TOPICS,
    ...TELEGRAM_WAVE27_SEARCH_TOPICS,
    ...TELEGRAM_WAVE28_SEARCH_TOPICS,
    ...TELEGRAM_WAVE29_SEARCH_TOPICS,
    ...TELEGRAM_WAVE30_SEARCH_TOPICS,
    ...TELEGRAM_WAVE31_SEARCH_TOPICS,
    ...TELEGRAM_WAVE32_SEARCH_TOPICS,
    ...TELEGRAM_WAVE33_SEARCH_TOPICS,
    ...TELEGRAM_WAVE34_SEARCH_TOPICS,
    ...TELEGRAM_WAVE35_SEARCH_TOPICS,
    ...TELEGRAM_WAVE36_SEARCH_TOPICS,
  ].map((topic) => topic.id));
  for (const topic of TELEGRAM_WAVE37_SEARCH_TOPICS) {
    assert.equal(previousTopicIds.has(topic.id), false, `Wave37 topic must not duplicate existing queue id: ${topic.id}`);
    assert.equal(topic.wave, "wave37_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.equal(topic.primaryPath, "/methodology");
    assert.ok(topic.answer.length > 120);
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /private commission|invite code|referral link|raw registration|guaranteed signup|guaranteed discount|guaranteed yield|availability promise|only 5 markets|reviewed matrix row exists for those markets|pending matrix row/i);
  }
  assert.match(TELEGRAM_WAVE37_SEARCH_TOPICS.find((topic) => topic.id === "regional-funding-matrix-data-asset-en").answer, /9 source-linked research rows|BR, MX, EU, UK, JP, HK, KR, SG and TR|official logged-in account flow/i);
  assert.match(TELEGRAM_WAVE37_SEARCH_TOPICS.find((topic) => topic.id === "hk-kr-tr-official-verification-boundary-en").answer, /HK, KR, SG and TR now have source-linked research rows|official logged-in account flow|remain pending/i);
});

test("TELEGRAM_WAVE38_SEARCH_TOPICS adds local-language funding-matrix drafts for priority markets", () => {
  assert.deepEqual(TELEGRAM_WAVE38_SEARCH_TOPICS.map((topic) => topic.query), [
    "Hong Kong crypto funding matrix SFC VASP account check",
    "한국 원화 입금 실명 계좌 funding matrix 확인",
    "Singapore crypto SGD funding MAS account verification matrix",
    "Türkiye TRY yatırma funding matrix SPK hesap kontrolü",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  const previousTopicIds = new Set([
    ...TELEGRAM_WAVE7_SEARCH_TOPICS,
    ...TELEGRAM_WAVE8_SEARCH_TOPICS,
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE10_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
    ...TELEGRAM_WAVE13_SEARCH_TOPICS,
    ...TELEGRAM_WAVE25_SEARCH_TOPICS,
    ...TELEGRAM_WAVE26_SEARCH_TOPICS,
    ...TELEGRAM_WAVE27_SEARCH_TOPICS,
    ...TELEGRAM_WAVE28_SEARCH_TOPICS,
    ...TELEGRAM_WAVE29_SEARCH_TOPICS,
    ...TELEGRAM_WAVE30_SEARCH_TOPICS,
    ...TELEGRAM_WAVE31_SEARCH_TOPICS,
    ...TELEGRAM_WAVE32_SEARCH_TOPICS,
    ...TELEGRAM_WAVE33_SEARCH_TOPICS,
    ...TELEGRAM_WAVE34_SEARCH_TOPICS,
    ...TELEGRAM_WAVE35_SEARCH_TOPICS,
    ...TELEGRAM_WAVE36_SEARCH_TOPICS,
    ...TELEGRAM_WAVE37_SEARCH_TOPICS,
  ].map((topic) => topic.id));
  for (const topic of TELEGRAM_WAVE38_SEARCH_TOPICS) {
    assert.equal(previousTopicIds.has(topic.id), false, `Wave38 topic must not duplicate existing queue id: ${topic.id}`);
    assert.equal(topic.wave, "wave38_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.ok(["/hk", "/kr", "/sg", "/markets/turkiye"].includes(topic.primaryPath));
    assert.equal(topic.supportPaths.includes("/research/regional-funding-verification-matrix.json"), true);
    assert.ok(topic.answer.length > 140);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /private commission|invite code|referral link|raw registration|guaranteed signup|guaranteed discount|guaranteed yield|availability promise|account approval is confirmed/i);
  }
  assert.match(TELEGRAM_WAVE38_SEARCH_TOPICS.find((topic) => topic.id === "hong-kong-funding-matrix-check-en").answer, /SFC\/VASP|account-name match|does not prove approval/i);
  assert.match(TELEGRAM_WAVE38_SEARCH_TOPICS.find((topic) => topic.id === "korea-krw-funding-matrix-ko").answer, /공식 출처|실명 확인|공식 계정 화면/i);
  assert.match(TELEGRAM_WAVE38_SEARCH_TOPICS.find((topic) => topic.id === "singapore-sgd-funding-matrix-en").answer, /MAS Digital Payment Token|PayNow or FAST|not a promise/i);
  assert.match(TELEGRAM_WAVE38_SEARCH_TOPICS.find((topic) => topic.id === "turkey-try-funding-matrix-tr").answer, /SPK|TRY yatırma|garantisi vermez/i);
});

test("TELEGRAM_WAVE39_SEARCH_TOPICS adds the minimal non-duplicated priority canonical review bundle", () => {
  assert.deepEqual(TELEGRAM_WAVE39_SEARCH_TOPICS.map((topic) => topic.query), [
    "NexuAlpha priority canonical review: Hyperliquid fees funded account, Uniswap testnet, Bybit vs Bitget stocks, tokenized Treasuries and derivatives",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  const previousTopicIds = new Set([
    ...TELEGRAM_WAVE7_SEARCH_TOPICS,
    ...TELEGRAM_WAVE8_SEARCH_TOPICS,
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE10_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
    ...TELEGRAM_WAVE13_SEARCH_TOPICS,
    ...TELEGRAM_WAVE25_SEARCH_TOPICS,
    ...TELEGRAM_WAVE26_SEARCH_TOPICS,
    ...TELEGRAM_WAVE27_SEARCH_TOPICS,
    ...TELEGRAM_WAVE28_SEARCH_TOPICS,
    ...TELEGRAM_WAVE29_SEARCH_TOPICS,
    ...TELEGRAM_WAVE30_SEARCH_TOPICS,
    ...TELEGRAM_WAVE31_SEARCH_TOPICS,
    ...TELEGRAM_WAVE32_SEARCH_TOPICS,
    ...TELEGRAM_WAVE33_SEARCH_TOPICS,
    ...TELEGRAM_WAVE34_SEARCH_TOPICS,
    ...TELEGRAM_WAVE35_SEARCH_TOPICS,
    ...TELEGRAM_WAVE36_SEARCH_TOPICS,
    ...TELEGRAM_WAVE37_SEARCH_TOPICS,
    ...TELEGRAM_WAVE38_SEARCH_TOPICS,
  ].map((topic) => topic.id));
  for (const topic of TELEGRAM_WAVE39_SEARCH_TOPICS) {
    assert.equal(previousTopicIds.has(topic.id), false, `Wave39 topic must not duplicate existing queue id: ${topic.id}`);
    assert.equal(topic.wave, "wave39_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.equal(topic.primaryPath, "/methodology");
    assert.deepEqual(topic.supportPaths, [
      "/exchanges/hyperliquid",
      "/exchanges/uniswap",
      "/compare/bybit-vs-bitget",
      "/news/tokenized-treasuries-structure-access-risks",
      "/topics/derivatives",
    ]);
    assert.match(topic.answer, /already covered|one non-duplicated manual-review bundle|NexuAlpha-first/i);
    assert.match(topic.answer, /Hyperliquid fees|funded-account|Uniswap testnet|Bybit vs Bitget stock|tokenized Treasuries|derivatives/i);
    assert.doesNotMatch(`${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`, /private commission|invite code|referral link|raw registration|guaranteed signup|guaranteed discount|guaranteed yield|availability promise|account approval is confirmed/i);
  }
});

test("TELEGRAM_WAVE57_SEARCH_TOPICS routes the latest five articles into onsite-first manual review", () => {
  assert.deepEqual(TELEGRAM_WAVE57_SEARCH_TOPICS.map((topic) => topic.id), [
    "cftc-self-custodial-wallet-boundary-en",
    "spot-listing-timeline-disclosure-en",
    "leveraged-etf-x-perp-risk-en",
    "okx-vvv-listing-preopen-en",
    "payment-stablecoin-margin-collateral-en",
  ]);
  assert.deepEqual(TELEGRAM_WAVE57_SEARCH_TOPICS.map((topic) => topic.primaryPath), [
    "/news/cftc-self-custodial-wallet-no-action-letter-scope-user-boundary",
    "/news/crypto-spot-listing-timeline-deposit-trading-withdrawal-disclosure-radar",
    "/news/leveraged-etf-x-perp-vs-standard-equity-perpetual-stacked-leverage-risk",
    "/news/okx-vvv-usdt-spot-listing-preopen-price-limit-transfer-checklist",
    "/news/payment-stablecoin-margin-collateral-issuer-eligibility-custody-haircut-framework",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  const previousTopicIds = new Set([
    ...TELEGRAM_WAVE7_SEARCH_TOPICS,
    ...TELEGRAM_WAVE8_SEARCH_TOPICS,
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE10_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
    ...TELEGRAM_WAVE13_SEARCH_TOPICS,
    ...TELEGRAM_WAVE25_SEARCH_TOPICS,
    ...TELEGRAM_WAVE26_SEARCH_TOPICS,
    ...TELEGRAM_WAVE27_SEARCH_TOPICS,
    ...TELEGRAM_WAVE28_SEARCH_TOPICS,
    ...TELEGRAM_WAVE29_SEARCH_TOPICS,
    ...TELEGRAM_WAVE30_SEARCH_TOPICS,
    ...TELEGRAM_WAVE31_SEARCH_TOPICS,
    ...TELEGRAM_WAVE32_SEARCH_TOPICS,
    ...TELEGRAM_WAVE33_SEARCH_TOPICS,
    ...TELEGRAM_WAVE34_SEARCH_TOPICS,
    ...TELEGRAM_WAVE35_SEARCH_TOPICS,
    ...TELEGRAM_WAVE36_SEARCH_TOPICS,
    ...TELEGRAM_WAVE37_SEARCH_TOPICS,
    ...TELEGRAM_WAVE38_SEARCH_TOPICS,
    ...TELEGRAM_WAVE39_SEARCH_TOPICS,
  ].map((topic) => topic.id));

  for (const topic of TELEGRAM_WAVE57_SEARCH_TOPICS) {
    assert.equal(previousTopicIds.has(topic.id), false, `Wave57 topic must not duplicate existing queue id: ${topic.id}`);
    assert.equal(topic.wave, "wave57_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.match(topic.primaryPath, /^\/news\//);
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.ok(topic.answer.length > 120);
    assert.doesNotMatch(
      `${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`,
      /private commission|invite code|referral link|raw registration|guaranteed signup|guaranteed discount|guaranteed yield|availability promise|account approval is confirmed/i,
    );
  }
});

test("TELEGRAM_WAVE58_SEARCH_TOPICS adds a non-duplicated priority ecosystem review set", () => {
  assert.deepEqual(TELEGRAM_WAVE58_SEARCH_TOPICS.map((topic) => topic.id), [
    "wave58-hyperliquid-fees-funded-boundary-en",
    "wave58-uniswap-testnet-mainnet-safety-en",
    "wave58-bybit-bitget-stock-meaning-en",
    "wave58-derivatives-risk-stack-en",
  ]);
  assert.deepEqual(TELEGRAM_WAVE58_SEARCH_TOPICS.map((topic) => topic.primaryPath), [
    "/exchanges/hyperliquid",
    "/exchanges/uniswap",
    "/compare/bybit-vs-bitget",
    "/topics/derivatives",
  ]);
  assert.equal(TELEGRAM_SEARCH_TOPIC_QUEUE.length, 84);

  const previousTopicIds = new Set([
    ...TELEGRAM_WAVE7_SEARCH_TOPICS,
    ...TELEGRAM_WAVE8_SEARCH_TOPICS,
    ...TELEGRAM_WAVE9_SEARCH_TOPICS,
    ...TELEGRAM_WAVE10_SEARCH_TOPICS,
    ...TELEGRAM_WAVE11_SEARCH_TOPICS,
    ...TELEGRAM_WAVE13_SEARCH_TOPICS,
    ...TELEGRAM_WAVE25_SEARCH_TOPICS,
    ...TELEGRAM_WAVE26_SEARCH_TOPICS,
    ...TELEGRAM_WAVE27_SEARCH_TOPICS,
    ...TELEGRAM_WAVE28_SEARCH_TOPICS,
    ...TELEGRAM_WAVE29_SEARCH_TOPICS,
    ...TELEGRAM_WAVE30_SEARCH_TOPICS,
    ...TELEGRAM_WAVE31_SEARCH_TOPICS,
    ...TELEGRAM_WAVE32_SEARCH_TOPICS,
    ...TELEGRAM_WAVE33_SEARCH_TOPICS,
    ...TELEGRAM_WAVE34_SEARCH_TOPICS,
    ...TELEGRAM_WAVE35_SEARCH_TOPICS,
    ...TELEGRAM_WAVE36_SEARCH_TOPICS,
    ...TELEGRAM_WAVE37_SEARCH_TOPICS,
    ...TELEGRAM_WAVE38_SEARCH_TOPICS,
    ...TELEGRAM_WAVE39_SEARCH_TOPICS,
    ...TELEGRAM_WAVE57_SEARCH_TOPICS,
  ].map((topic) => topic.id));

  for (const topic of TELEGRAM_WAVE58_SEARCH_TOPICS) {
    assert.equal(previousTopicIds.has(topic.id), false, `Wave58 topic must not duplicate existing queue id: ${topic.id}`);
    assert.equal(topic.wave, "wave58_search_topics");
    assert.equal(topic.cadence, "weekly_review");
    assert.equal(topic.reviewTtlDays, 7);
    assert.equal(topic.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.ok(topic.answer.length > 120);
    assert.doesNotMatch(
      `${topic.answer}\n${topic.primaryPath}\n${topic.supportPaths.join("\n")}`,
      /private commission|invite code|referral link|raw registration|guaranteed signup|guaranteed discount|guaranteed yield|availability promise|account approval is confirmed/i,
    );
  }
});


test("TELEGRAM_WAVE20_SEARCH_TOPIC_ROUTES maps high-intent topics to real onsite canonical routes", () => {
  assert.deepEqual(TELEGRAM_WAVE20_SEARCH_TOPIC_ROUTES.map((route) => route.id), [
    "jp-fsa-jpy-account-ja",
    "bybit-bitget-stock-product-boundary-en",
    "okx-usdc-migration-account-ops-en",
    "tokenized-treasury-custody-redemption-en",
  ]);

  const commandIds = new Set(TELEGRAM_COMMANDS.map((command) => command.command));
  const expectedCanonicals = new Map([
    ["jp-fsa-jpy-account-ja", { pathname: "/jp", locale: "ja", command: "/checklink" }],
    ["bybit-bitget-stock-product-boundary-en", { pathname: "/compare/bybit-vs-bitget", locale: null, command: "/fees" }],
    ["okx-usdc-migration-account-ops-en", { pathname: "/news/okx-usd-to-usdc-spot-pair-migration", locale: null, command: "/checklink" }],
    ["tokenized-treasury-custody-redemption-en", { pathname: "/topics/tokenized-treasuries", locale: null, command: "/alert" }],
  ]);

  for (const route of TELEGRAM_WAVE20_SEARCH_TOPIC_ROUTES) {
    const expected = expectedCanonicals.get(route.id);
    assert.ok(expected, `unexpected Wave20 route ${route.id}`);
    assert.equal(commandIds.has(route.command), true, `command must exist for ${route.id}`);
    assert.equal(route.command, expected.command);
    assert.match(route.canonicalPath, /^\//);
    assert.equal(route.supportPaths.every((pathname) => pathname.startsWith("/")), true);
    assert.equal(route.answer.length > 100, true, `answer should be useful for ${route.id}`);
    assert.match(route.anonymousMeasurement, /24h\/7d onsite UTM only/);
    assert.doesNotMatch(
      `${route.answer}\n${route.canonicalPath}\n${route.supportPaths.join("\n")}`,
      /private commission|raw registration|guaranteed signup|guaranteed discount/i
    );

    const localized = new URL(localizedHref(route.canonicalPath, { locale: route.locale }), "https://nexualpha.com");
    assert.equal(localized.pathname, expected.pathname);
    if (expected.locale) assert.equal(localized.pathname === expected.pathname, true);

    const deepLink = getTelegramDeepLink(route.deepLinkAction);
    assert.ok(deepLink.startsWith("https://t.me/NexuAlphaAssistantBot?start="));
    assert.doesNotMatch(deepLink, /accounts\.binance\.com|partner\.bitget|topzhjdgxcb|backpack\.exchange/i);
  }

  assert.deepEqual(TELEGRAM_WAVE20_COMMAND_ROUTE_MAP["/checklink"], ["jp-fsa-jpy-account-ja", "okx-usdc-migration-account-ops-en"]);
  assert.deepEqual(TELEGRAM_WAVE20_COMMAND_ROUTE_MAP["/fees"], ["bybit-bitget-stock-product-boundary-en"]);
  assert.deepEqual(TELEGRAM_WAVE20_COMMAND_ROUTE_MAP["/alert"], ["tokenized-treasury-custody-redemption-en"]);
});


test("TELEGRAM_WAVE21_GSC_QUERY_ROUTES maps visible GSC queries without duplicating Wave20 routes", () => {
  assert.deepEqual(TELEGRAM_WAVE21_GSC_QUERY_ROUTES.map((route) => [route.query, route.clicks, route.impressions]), [
    ["hyperliquid fees", 0, 15],
    ["hyperliquid funded account", 0, 6],
    ["uniswap testnet", 0, 6],
    ["tokenized treasury", 0, 3],
    ["bitget vs bybit stocks", 0, 2],
    ["crypto perpetual platform", 0, 2],
  ]);

  const wave20Ids = new Set(TELEGRAM_WAVE20_SEARCH_TOPIC_ROUTES.map((route) => route.id));
  const searchTopicIds = new Set(TELEGRAM_SEARCH_TOPIC_QUEUE.map((topic) => topic.id));
  const broadcastIds = new Set(generateTelegramBroadcasts({ nowIso: "2026-09-14T00:00:00.000Z" }).map((item) => item.id));
  const expected = new Map([
    ["gsc-hyperliquid-fees", { pathname: "/exchanges/hyperliquid", command: "/fees" }],
    ["gsc-hyperliquid-funded-account", { pathname: "/exchanges/hyperliquid", command: "/checklink" }],
    ["gsc-uniswap-testnet", { pathname: "/exchanges/uniswap", command: "/checklink" }],
    ["gsc-tokenized-treasury", { pathname: "/topics/tokenized-treasuries", command: "/alert", extendsWave20RouteId: "tokenized-treasury-custody-redemption-en" }],
    ["gsc-bitget-vs-bybit-stocks", { pathname: "/compare/bybit-vs-bitget", command: "/fees", extendsWave20RouteId: "bybit-bitget-stock-product-boundary-en" }],
    ["gsc-crypto-perpetual-platform", { pathname: "/topics/derivatives", command: "/checklink" }],
  ]);

  for (const route of TELEGRAM_WAVE21_GSC_QUERY_ROUTES) {
    const expectedRoute = expected.get(route.id);
    assert.ok(expectedRoute, `unexpected Wave21 route ${route.id}`);
    assert.equal(wave20Ids.has(route.id), false, `Wave21 route id must not duplicate Wave20 route id: ${route.id}`);
    if (route.linkedSearchTopicId) {
      assert.equal(searchTopicIds.has(route.linkedSearchTopicId), true, `Wave21 route must reference existing search topic ${route.linkedSearchTopicId}`);
    } else {
      assert.equal(broadcastIds.has(route.linkedBroadcastId), true, `Wave21 route must reference existing broadcast template ${route.linkedBroadcastId}`);
    }
    assert.equal(route.command, expectedRoute.command);
    assert.match(route.sourceEvidence, /^docs\/evidence\/gsc-visible-/);
    assert.equal(route.clicks, 0);
    assert.ok(route.impressions > 0);
    assert.match(route.anonymousMeasurement, /24h\/7d onsite UTM only/);
    assert.doesNotMatch(`${route.query}\n${route.canonicalPath}\n${route.supportPaths.join("\n")}`, /private commission|raw registration|invite code|guaranteed signup|guaranteed discount/i);

    if (expectedRoute.extendsWave20RouteId) {
      assert.equal(route.extendsWave20RouteId, expectedRoute.extendsWave20RouteId);
      assert.equal(wave20Ids.has(route.extendsWave20RouteId), true);
    }

    const localized = new URL(localizedHref(route.canonicalPath, { locale: route.locale }), "https://nexualpha.com");
    assert.equal(localized.pathname, expectedRoute.pathname);
    assert.equal(localized.origin, "https://nexualpha.com");

    const deepLink = getTelegramDeepLink(route.deepLinkAction);
    assert.ok(deepLink.startsWith("https://t.me/NexuAlphaAssistantBot?start="));
    assert.doesNotMatch(deepLink, /accounts\.binance\.com|partner\.bitget|topzhjdgxcb|backpack\.exchange/i);
  }

  assert.deepEqual(TELEGRAM_WAVE21_COMMAND_ROUTE_MAP["/fees"], ["gsc-hyperliquid-fees", "gsc-bitget-vs-bybit-stocks"]);
  assert.deepEqual(TELEGRAM_WAVE21_COMMAND_ROUTE_MAP["/checklink"], ["gsc-hyperliquid-funded-account", "gsc-uniswap-testnet", "gsc-crypto-perpetual-platform"]);
  assert.deepEqual(TELEGRAM_WAVE21_COMMAND_ROUTE_MAP["/alert"], ["gsc-tokenized-treasury"]);
});


test("TELEGRAM_WAVE22_ONSITE_BOT_HANDOFFS closes onsite canonical pages back to Bot without raw exchange links", () => {
  const expectedPages = [
    "/exchanges/hyperliquid",
    "/exchanges/uniswap",
    "/topics/tokenized-treasuries",
    "/compare/bybit-vs-bitget",
    "/topics/derivatives",
  ];
  assert.deepEqual(Object.keys(TELEGRAM_WAVE22_ONSITE_BOT_HANDOFFS), expectedPages);

  const wave21Ids = new Set(TELEGRAM_WAVE21_GSC_QUERY_ROUTES.map((route) => route.id));
  const expectedRoutesByPage = new Map([
    ["/exchanges/hyperliquid", ["gsc-hyperliquid-fees", "gsc-hyperliquid-funded-account"]],
    ["/exchanges/uniswap", ["gsc-uniswap-testnet"]],
    ["/topics/tokenized-treasuries", ["gsc-tokenized-treasury"]],
    ["/compare/bybit-vs-bitget", ["gsc-bitget-vs-bybit-stocks"]],
    ["/topics/derivatives", ["gsc-crypto-perpetual-platform"]],
  ]);

  for (const [canonicalPath, handoff] of Object.entries(TELEGRAM_WAVE22_ONSITE_BOT_HANDOFFS)) {
    assert.deepEqual(handoff.routeIds, expectedRoutesByPage.get(canonicalPath));
    assert.equal(handoff.canonicalPath, canonicalPath);
    assert.equal(handoff.onsiteFirst, true);
    assert.equal(handoff.manualAuthorizationRequired, true);
    assert.equal(handoff.authorizationState, "not_authorized");
    assert.ok(handoff.primaryCtaLabel.includes("NexuAlpha Bot"));
    assert.ok(handoff.queries.length >= 1);
    assert.match(handoff.measurement.policy, /anonymous_onsite_24h_7d_only/);
    assert.deepEqual(handoff.measurement.publicParams, ["utm_source", "utm_medium", "utm_campaign"]);
    assert.ok(handoff.measurement.telegramContextParams.includes("tg_locale"));
    assert.ok(handoff.measurement.anonymousMetrics24h.includes("botStartsIfVisible"));
    assert.ok(handoff.measurement.anonymousMetrics7d.includes("decision"));
    assert.match(handoff.boundary, /must not contain raw exchange registration URLs/);

    for (const id of handoff.routeIds) assert.equal(wave21Ids.has(id), true);

    const canonical = new URL(canonicalPath, "https://nexualpha.com");
    assert.equal(canonical.origin, "https://nexualpha.com");
    const deepLink = getTelegramDeepLink(handoff.botDeepLinkAction);
    assert.ok(deepLink.startsWith("https://t.me/NexuAlphaAssistantBot?start="));
    assert.doesNotMatch(deepLink, /accounts\.binance\.com|partner\.bitget|topzhjdgxcb|backpack\.exchange|11350287|nexu888/i);
    assert.doesNotMatch(
      JSON.stringify({ cta: handoff.primaryCtaLabel, action: handoff.botDeepLinkAction, context: handoff.context }),
      /private commission|raw registration|guaranteed signup|guaranteed discount/i
    );
  }
});

test("escapeMarkdownV2 safely escapes Telegram MarkdownV2 reserved characters", () => {
  const specialChars = "_ * [ ] ( ) ~ ` > # + - = | { } . !";
  const escaped = escapeMarkdownV2(specialChars);
  // 所有特殊符号前都应该带有转义符
  assert.doesNotMatch(escaped, /(?<!\\)[_*\[\]()~`>#+\-=|{}.!]/);
});

test("generateTelegramBroadcasts prepares the high-intent Telegram growth pack honestly", () => {
  const broadcasts = generateTelegramBroadcasts({ nowIso: "2026-09-14T00:00:00.000Z" });
  assert.equal(broadcasts.length, 101);

  const expectedIds = new Set([
    "compare-binance-vs-okx-en",
    "compare-bybit-vs-bitget-en",
    "hyperliquid-fees-en",
    "hyperliquid-funded-account-en",
    "uniswap-testnet-en",
    "jupiter-swap-route-en",
    "aerodrome-base-pool-en",
    "no-kyc-dex-check-en",
    "tokenized-treasuries-en",
    "bybit-bitget-stock-exposure-en",
    "crypto-perpetual-platform-en",
    "hyperliquid-latest-news-en",
    "hyperliquid-funding-hourly-en",
    "tokenized-stock-margin-zh",
    "okx-usd-usdc-migration-en",
    "brazil-pix-ptbr",
    "brazil-saque-pix-ptbr",
    "brazil-kyc-cpf-ptbr",
    "brazil-cost-ptbr",
    "brazil-account-ptbr",
    "brazil-hub-ptbr",
    "brazil-compare-ptbr",
    "mexico-spei-es",
    "hong-kong-account-en",
    "korea-regulatory-context-ko",
    "korea-krw-funding-ko",
    "turkey-spk-register-tr",
    "turkey-try-funding-tr",
    "hyperliquid-funding-decision-en",
    "hyperliquid-dydx-risk-en",
    "uniswap-v4-deployment-check-en",
    "jupiter-ultra-token-mint-en",
    "aerodrome-slipstream-incentives-en",
    "tokenized-treasury-buidl-benji-en",
    "okx-usdc-api-check-en",
    "brazil-pix-withdrawal-ptbr",
    "brazil-kyc-cpf-check-ptbr",
    "korea-official-account-check-ko",
    "turkey-market-account-check-tr",
    "fee-disclosure-audit-zh",
    "withdrawal-network-guide-zh",
    "tokenized-treasury-redemption-risk-en",
    "tokenized-stock-vs-stock-perp-en",
    "tokenized-assets-custody-proof-en",
    "rwa-treasury-transfer-restrictions-en",
    "korea-tokenized-asset-boundary-ko",
    "korea-perp-dex-funding-check-ko",
    "korea-uniswap-wallet-route-ko",
    "korea-bybit-bitget-stock-boundary-ko",
    "turkey-tokenized-asset-boundary-tr",
    "turkey-perp-dex-funding-check-tr",
    "turkey-uniswap-wallet-route-tr",
    "turkey-bybit-bitget-stock-boundary-tr",
    "perp-dex-cost-field-dictionary-en",
    "regional-funding-verification-matrix-en",
    "regional-funding-matrix-rollout-en",
    "aerodrome-jupiter-route-cost-check-en",
    "japan-mexico-funding-matrix-ja",
    "korea-onchain-route-localization-ko",
    "turkey-onchain-route-localization-tr",
    "hyperliquid-funding-fee-fr",
    "uniswap-wallet-route-fee-de",
    "hyperliquid-source-boundary-fr",
    "uniswap-approval-slippage-de",
    "binance-okx-fee-kyc-boundary-es",
    "binance-fee-kyc-source-ptbr",
    "okx-usd-usdc-migration-date-boundary-en",
    "hyperliquid-dydx-funding-fee-boundary-zh",
    "hyperliquid-fees-funded-boundary-en",
    "uniswap-testnet-mainnet-boundary-en",
    "tokenized-treasury-issuer-custody-redemption-en",
    "bitget-bybit-stocks-product-boundary-en",
    "crypto-perpetual-platform-risk-stack-en",
    "hyperliquid-latest-news-date-source-en",
    "ai-citation-source-methodology-en",
    "ai-citation-fee-evidence-boundary-en",
    "ai-citation-regional-funding-check-en",
    "ai-citation-tokenized-asset-ownership-redemption-en",
    "ai-citation-perp-risk-fields-en",
    "hk-vasp-account-check-en",
    "eu-mica-platform-access-en",
    "uk-fca-crypto-risk-access-en",
    "jp-fsa-jpy-funding-check-ja",
    "kr-krw-account-funding-check-ko",
    "tr-try-spk-funding-check-tr",
    "regional-funding-matrix-data-asset-en",
    "hk-kr-tr-official-verification-boundary-en",
    "hong-kong-funding-matrix-check-en",
    "korea-krw-funding-matrix-ko",
    "singapore-sgd-funding-matrix-en",
    "turkey-try-funding-matrix-tr",
    "priority-canonical-five-review-bundle-en",
    "cftc-self-custodial-wallet-boundary-en",
    "spot-listing-timeline-disclosure-en",
    "leveraged-etf-x-perp-risk-en",
    "okx-vvv-listing-preopen-en",
    "payment-stablecoin-margin-collateral-en",
    "wave58-hyperliquid-fees-funded-boundary-en",
    "wave58-uniswap-testnet-mainnet-safety-en",
    "wave58-bybit-bitget-stock-meaning-en",
    "wave58-derivatives-risk-stack-en",
  ]);
  assert.deepEqual(new Set(broadcasts.map((b) => b.id)), expectedIds);

  const expectedPaths = new Set([
    "/compare/binance-vs-okx",
    "/compare/bybit-vs-bitget",
    "/exchanges/binance",
    "/exchanges/hyperliquid",
    "/exchanges/uniswap",
    "/exchanges/jupiter",
    "/exchanges/aerodrome",
    "/topics/no-kyc",
    "/topics/tokenized-treasuries",
    "/topics/derivatives",
    "/compare/hyperliquid-vs-dydx",
    "/news/hyperliquid-vs-dydx",
    "/news/okx-usd-to-usdc-spot-pair-migration",
    "/br/pix",
    "/br/saque-pix",
    "/br/kyc-cpf",
    "/br/custos",
    "/br/conta",
    "/br",
    "/br/comparar",
    "/mx",
    "/eu",
    "/uk",
    "/jp",
    "/hk",
    "/kr",
    "/sg",
    "/tr/markets/turkiye",
    "/markets/turkiye",
    "/methodology",
    "/news/crypto-exchange-fee-disclosure-audit",
    "/news/how-to-choose-crypto-withdrawal-network",
    "/news/cftc-self-custodial-wallet-no-action-letter-scope-user-boundary",
    "/news/crypto-spot-listing-timeline-deposit-trading-withdrawal-disclosure-radar",
    "/news/leveraged-etf-x-perp-vs-standard-equity-perpetual-stacked-leverage-risk",
    "/news/okx-vvv-usdt-spot-listing-preopen-price-limit-transfer-checklist",
    "/news/payment-stablecoin-margin-collateral-issuer-eligibility-custody-haircut-framework",
  ]);
  const actualPaths = new Set(broadcasts.map((b) => b.path));
  assert.deepEqual(actualPaths, expectedPaths);

  const campaigns = new Set();
  const ids = new Set();
  const forbiddenClaims = /(官方交易助手|高权重|自动索引|Googlebot|guaranteed indexing|guaranteed ranking)/i;
  const forbiddenExchangeUrls = /(accounts\.binance\.com|binance\.com\/join|bsmkweb\.cc|partner\.bitget|bitget\.com\/expressly|okx\.com\/join|topzhjdgxcb\.net|backpack\.exchange\/join)/i;

  for (const item of broadcasts) {
    assert.equal(item.publishedAt, "2026-09-14T00:00:00.000Z");
    assert.equal(ids.has(item.id), false, `id must be unique for ${item.id}`);
    ids.add(item.id);
    assert.ok(item.campaign, `campaign is required for ${item.id}`);
    assert.equal(campaigns.has(item.campaign), false, `campaign must be unique for ${item.id}`);
    campaigns.add(item.campaign);
    assert.ok(item.region, `region classification is required for ${item.id}`);
    assert.ok(item.regionSegment, `region segment is required for ${item.id}`);
    assert.ok(item.theme, `theme is required for ${item.id}`);
    assert.ok(item.funnelStage, `funnel stage is required for ${item.id}`);
    assert.ok(item.searchIntent, `search intent is required for ${item.id}`);
    assert.ok(item.reviewBy, `reviewBy is required for ${item.id}`);
    assert.equal(new Date(item.reviewBy) > new Date(item.publishedAt), true, `reviewBy must be after publishedAt for ${item.id}`);
    assert.ok(item.discussionPrompt, `discussion prompt is required for ${item.id}`);
    assert.ok(item.answerFirst, `answer-first summary is required for ${item.id}`);
    assert.ok(Array.isArray(item.onsiteEntries), `onsite entries are required for ${item.id}`);
    assert.ok(item.onsiteEntries.length >= 2, `at least two onsite entries are required for ${item.id}`);
    assert.equal(item.distributionStatus, "draft_not_posted", `broadcast item must remain draft-only for ${item.id}`);
    assert.ok(item.plainText.includes("Answer first:"), `plainText must include answer-first section for ${item.id}`);
    assert.ok(item.markdownV2.includes("Answer first"), `markdownV2 must include answer-first section for ${item.id}`);
    assert.ok(item.plainText.includes("Onsite next steps:"), `plainText must include onsite next steps for ${item.id}`);
    assert.ok(item.markdownV2.includes("Onsite next steps"), `markdownV2 must include onsite next steps for ${item.id}`);
    assert.ok(item.plainText.includes("Question for the community:"), `plainText must include community question for ${item.id}`);
    assert.ok(item.markdownV2.includes("Question for the community"), `markdownV2 must include community question for ${item.id}`);
    assert.ok(item.plainText.includes("Operator routing:"), `plainText must include operator routing for ${item.id}`);
    assert.ok(item.markdownV2.includes("Operator routing"), `markdownV2 must include operator routing for ${item.id}`);
    assert.equal(item.canonicalLandingUrl, item.canonicalBacklink, `canonical landing URL must mirror canonical backlink for ${item.id}`);
    assert.equal(item.utmReview.canonicalLandingUrl, item.canonicalBacklink, `UTM review must expose exact landing URL for ${item.id}`);
    assert.equal(item.utmReview.publicParams.utm_source, "tg_channel", `UTM source review is required for ${item.id}`);
    assert.equal(item.utmReview.publicParams.utm_medium, "broadcast", `UTM medium review is required for ${item.id}`);
    assert.equal(item.utmReview.publicParams.utm_campaign, item.campaign, `UTM campaign review is required for ${item.id}`);
    assert.equal(item.utmReview.reviewPolicy.includes("raw registration links"), true, `UTM review policy must block raw registration links for ${item.id}`);
    assert.equal(item.landingPageReview.primaryOnsiteCta.url, item.onsiteEntries[0].url, `landing review must identify first onsite CTA for ${item.id}`);
    assert.equal(item.landingPageReview.expectedFirstScreen.some((check) => check.includes("answer the Telegram question")), true, `landing review must describe first-screen answer path for ${item.id}`);

    const url = new URL(item.canonicalBacklink);
    assert.equal(url.origin, "https://nexualpha.com");
    const expectedPathUrl = new URL(item.path, "https://nexualpha.com");
    const expectedLocalizedPathUrl = new URL(localizedHref(item.path, { locale: item.locale }), "https://nexualpha.com");
    assert.equal(url.pathname, expectedLocalizedPathUrl.pathname);
    for (const [key, value] of expectedPathUrl.searchParams) {
      assert.equal(url.searchParams.get(key), value, `canonical backlink must preserve ${key} for ${item.id}`);
    }
    if (item.locale === "en" && expectedLocalizedPathUrl.searchParams.get("locale") === "en") {
      assert.equal(url.searchParams.get("locale"), "en", `country route with non-English market default must pin explicit English for ${item.id}`);
    } else if (item.locale === "en") {
      assert.equal(url.searchParams.has("locale"), false, `generic English target should not need locale override for ${item.id}`);
    } else if (expectedLocalizedPathUrl.searchParams.has("locale")) {
      assert.equal(url.searchParams.get("locale"), item.locale, `canonical backlink must pin content locale for ${item.id}`);
    } else {
      assert.equal(url.searchParams.has("locale"), false, `path-localized target should not duplicate locale for ${item.id}`);
    }
    assert.equal(url.searchParams.get("utm_source"), "tg_channel");
    assert.equal(url.searchParams.get("utm_medium"), "broadcast");
    assert.equal(url.searchParams.get("utm_campaign"), item.campaign);
    assert.equal(url.searchParams.get("tg_market"), item.trackingContext.market);
    assert.equal(url.searchParams.get("tg_locale"), item.trackingContext.locale);
    assert.equal(url.searchParams.get("tg_product"), item.trackingContext.product);
    assert.equal(url.searchParams.get("tg_funnel"), item.trackingContext.funnel);
    assert.equal(url.searchParams.get("tg_intent"), item.trackingContext.intent);
    assert.equal(url.searchParams.get("tg_theme"), item.trackingContext.theme);
    assert.equal(url.searchParams.get("tg_draft"), item.trackingContext.draft);
    assert.deepEqual(item.trackingRequiredParams, [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "tg_market",
      "tg_locale",
      "tg_product",
      "tg_funnel",
      "tg_intent",
      "tg_theme",
      "tg_draft",
    ]);
    for (const entry of item.onsiteEntries) {
      const entryUrl = new URL(entry.url);
      assert.equal(entryUrl.origin, "https://nexualpha.com", `onsite entry must stay on NexuAlpha for ${item.id}`);
      assert.ok(item.plainText.includes(entry.url), `plainText must include onsite entry for ${item.id}`);
      assert.ok(item.markdownV2.includes(entry.url), `markdownV2 must include onsite entry for ${item.id}`);
      assert.ok(
        item.plainText.indexOf(entry.url) < item.plainText.indexOf(item.deepLink),
        `plainText should keep onsite entry before Bot deep link for ${item.id}`
      );
      assert.ok(
        item.markdownV2.indexOf(entry.url) < item.markdownV2.indexOf(item.deepLink),
        `markdownV2 should keep onsite entry before Bot deep link for ${item.id}`
      );
    }

    assert.ok(item.deepLink.startsWith("https://t.me/NexuAlphaAssistantBot?start="));
    assert.ok(item.plainText.includes(item.canonicalBacklink), `plainText must contain canonical backlink for ${item.id}`);
    assert.ok(item.markdownV2.includes(item.canonicalBacklink), `markdownV2 must contain canonical backlink for ${item.id}`);
    assert.ok(
      item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink),
      `plainText should send readers to NexuAlpha before Bot deep link for ${item.id}`
    );
    assert.ok(
      item.markdownV2.indexOf(item.canonicalBacklink) < item.markdownV2.indexOf(item.deepLink),
      `markdownV2 should send readers to NexuAlpha before Bot deep link for ${item.id}`
    );
    assert.doesNotMatch(`${item.title}\n${item.summary}\n${item.plainText}\n${item.markdownV2}\n${item.sourcePosture}`, forbiddenClaims);
    assert.doesNotMatch(JSON.stringify(item), forbiddenExchangeUrls, `Telegram drafts must not carry raw exchange registration URLs for ${item.id}`);
  }

  assert.equal(broadcasts.find((b) => b.id === "hyperliquid-funded-account-en").campaign, "hyperliquid_funded_account_en");
  const wave7ById = Object.fromEntries(TELEGRAM_WAVE7_SEARCH_TOPICS.map((topic) => [topic.id, topic]));
  for (const id of Object.keys(wave7ById)) {
    const item = broadcasts.find((b) => b.id === id);
    const topic = wave7ById[id];
    assert.equal(item.wave, "wave7_search_topics");
    assert.equal(item.searchTopic.query, topic.query);
    assert.equal(item.searchTopic.campaign, item.campaign);
    assert.equal(item.answerFirst, topic.answer);
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.updateCadence.reviewTtlDays, 7);
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.ok(item.manualReviewSummary.includes(topic.query));
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, topic.primaryPath);
    assert.equal(new URL(item.canonicalBacklink).searchParams.get("utm_campaign"), topic.campaign);
    assert.equal(new URL(item.canonicalBacklink).searchParams.get("utm_source"), "tg_channel");
    assert.equal(new URL(item.canonicalBacklink).searchParams.get("utm_medium"), "broadcast");
  }
  assert.deepEqual(
    broadcasts
      .filter((b) => b.gscOpportunity)
      .map((b) => [b.id, b.gscOpportunity.query, b.gscOpportunity.visibleImpressions, b.gscOpportunity.clicks, b.gscOpportunity.landingPage]),
    [
      ["hyperliquid-fees-en", "hyperliquid fees", 15, 0, "/exchanges/hyperliquid"],
      ["hyperliquid-funded-account-en", "hyperliquid funded account", 6, 0, "/exchanges/hyperliquid"],
      ["uniswap-testnet-en", "uniswap testnet", 6, 0, "/exchanges/uniswap"],
      ["no-kyc-dex-check-en", "no kyc crypto exchange", 4, 0, "/topics/no-kyc"],
      ["tokenized-treasuries-en", "tokenized treasury", 5, 0, "/topics/tokenized-treasuries"],
      ["bybit-bitget-stock-exposure-en", "bitget vs bybit stocks", 2, 0, "/compare/bybit-vs-bitget"],
      ["crypto-perpetual-platform-en", "crypto perpetual platform", 2, 0, "/topics/derivatives"],
      ["hyperliquid-latest-news-en", "hyperliquid latest news", 1, 0, "/news/hyperliquid-vs-dydx"],
      ["hyperliquid-funding-hourly-en", "site:hyperliquid.gitbook.io/hyperliquid-docs \"funding is paid hourly\"", 1, 0, "/exchanges/hyperliquid"],
      ["tokenized-stock-margin-zh", "代币化股票保证金", 1, 0, "/compare/bybit-vs-bitget"],
      ["okx-usd-usdc-migration-en", "OKX USD to USDC spot pair migration", 11, 0, "/news/okx-usd-to-usdc-spot-pair-migration"],
    ]
  );
  assert.deepEqual(broadcasts.find((b) => b.id === "tokenized-treasuries-en").gscOpportunity.relatedQueries, ["tokenized treasuries"]);
  assert.equal(broadcasts.find((b) => b.id === "jupiter-swap-route-en").path, "/exchanges/jupiter");
  assert.equal(broadcasts.find((b) => b.id === "aerodrome-base-pool-en").path, "/exchanges/aerodrome");
  assert.equal(broadcasts.find((b) => b.id === "no-kyc-dex-check-en").path, "/topics/no-kyc");
  for (const id of ["aerodrome-base-pool-en", "jupiter-swap-route-en", "no-kyc-dex-check-en"]) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave8_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, item.searchTopic.primaryPath);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
  }
  for (const id of ["tokenized-treasuries-en", "okx-usd-usdc-migration-en", "crypto-perpetual-platform-en"]) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave9_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, item.searchTopic.primaryPath);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
  }
  for (const id of ["korea-regulatory-context-ko", "korea-krw-funding-ko", "turkey-spk-register-tr", "turkey-try-funding-tr"]) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave10_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, new URL(localizedHref(item.searchTopic.primaryPath, { locale: item.locale }), "https://nexualpha.com").pathname);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
  }
  for (const id of [
    "hyperliquid-funding-decision-en",
    "hyperliquid-dydx-risk-en",
    "uniswap-v4-deployment-check-en",
    "jupiter-ultra-token-mint-en",
    "aerodrome-slipstream-incentives-en",
    "tokenized-treasury-buidl-benji-en",
    "okx-usdc-api-check-en",
    "brazil-pix-withdrawal-ptbr",
    "brazil-kyc-cpf-check-ptbr",
    "korea-official-account-check-ko",
    "turkey-market-account-check-tr",
  ]) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave11_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, new URL(localizedHref(item.searchTopic.primaryPath, { locale: item.locale }), "https://nexualpha.com").pathname);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
  }
  for (const id of TELEGRAM_WAVE13_SEARCH_TOPICS.map((topic) => topic.id)) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave13_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, new URL(localizedHref(item.searchTopic.primaryPath, { locale: item.locale }), "https://nexualpha.com").pathname);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.doesNotMatch(JSON.stringify(item), forbiddenExchangeUrls);
  }
  for (const id of TELEGRAM_WAVE25_SEARCH_TOPICS.map((topic) => topic.id)) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave25_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, new URL(localizedHref(item.searchTopic.primaryPath, { locale: item.locale }), "https://nexualpha.com").pathname);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.doesNotMatch(JSON.stringify(item), forbiddenExchangeUrls);
  }
  for (const id of TELEGRAM_WAVE26_SEARCH_TOPICS.map((topic) => topic.id)) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave26_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, new URL(localizedHref(item.searchTopic.primaryPath, { locale: item.locale }), "https://nexualpha.com").pathname);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.doesNotMatch(JSON.stringify(item), forbiddenExchangeUrls);
  }
  for (const id of TELEGRAM_WAVE27_SEARCH_TOPICS.map((topic) => topic.id)) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave27_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, new URL(localizedHref(item.searchTopic.primaryPath, { locale: item.locale }), "https://nexualpha.com").pathname);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.doesNotMatch(JSON.stringify(item), forbiddenExchangeUrls);
  }
  for (const id of TELEGRAM_WAVE28_SEARCH_TOPICS.map((topic) => topic.id)) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave28_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, new URL(localizedHref(item.searchTopic.primaryPath, { locale: item.locale }), "https://nexualpha.com").pathname);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.doesNotMatch(JSON.stringify(item), forbiddenExchangeUrls);
  }
  for (const id of TELEGRAM_WAVE29_SEARCH_TOPICS.map((topic) => topic.id)) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave29_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, new URL(localizedHref(item.searchTopic.primaryPath, { locale: item.locale }), "https://nexualpha.com").pathname);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.doesNotMatch(JSON.stringify(item), forbiddenExchangeUrls);
  }
  for (const id of TELEGRAM_WAVE30_SEARCH_TOPICS.map((topic) => topic.id)) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave30_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, new URL(localizedHref(item.searchTopic.primaryPath, { locale: item.locale }), "https://nexualpha.com").pathname);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.doesNotMatch(JSON.stringify(item), forbiddenExchangeUrls);
  }
  for (const id of TELEGRAM_WAVE31_SEARCH_TOPICS.map((topic) => topic.id)) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave31_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, new URL(localizedHref(item.searchTopic.primaryPath, { locale: item.locale }), "https://nexualpha.com").pathname);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.doesNotMatch(JSON.stringify(item), forbiddenExchangeUrls);
  }
  for (const id of TELEGRAM_WAVE32_SEARCH_TOPICS.map((topic) => topic.id)) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave32_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, new URL(localizedHref(item.searchTopic.primaryPath, { locale: item.locale }), "https://nexualpha.com").pathname);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.doesNotMatch(JSON.stringify(item), forbiddenExchangeUrls);
  }
  for (const id of TELEGRAM_WAVE33_SEARCH_TOPICS.map((topic) => topic.id)) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave33_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, new URL(localizedHref(item.searchTopic.primaryPath, { locale: item.locale }), "https://nexualpha.com").pathname);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.doesNotMatch(JSON.stringify(item), forbiddenExchangeUrls);
  }
  for (const id of TELEGRAM_WAVE34_SEARCH_TOPICS.map((topic) => topic.id)) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave34_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, new URL(localizedHref(item.searchTopic.primaryPath, { locale: item.locale }), "https://nexualpha.com").pathname);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.doesNotMatch(JSON.stringify(item), forbiddenExchangeUrls);
  }
  for (const id of TELEGRAM_WAVE35_SEARCH_TOPICS.map((topic) => topic.id)) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave35_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, new URL(localizedHref(item.searchTopic.primaryPath, { locale: item.locale }), "https://nexualpha.com").pathname);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.doesNotMatch(JSON.stringify(item), forbiddenExchangeUrls);
  }
  for (const id of TELEGRAM_WAVE36_SEARCH_TOPICS.map((topic) => topic.id)) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave36_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, new URL(localizedHref(item.searchTopic.primaryPath, { locale: item.locale }), "https://nexualpha.com").pathname);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.doesNotMatch(JSON.stringify(item), forbiddenExchangeUrls);
  }
  for (const id of TELEGRAM_WAVE37_SEARCH_TOPICS.map((topic) => topic.id)) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave37_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, new URL(localizedHref(item.searchTopic.primaryPath, { locale: item.locale }), "https://nexualpha.com").pathname);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.doesNotMatch(JSON.stringify(item), forbiddenExchangeUrls);
  }
  for (const id of TELEGRAM_WAVE38_SEARCH_TOPICS.map((topic) => topic.id)) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave38_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, new URL(localizedHref(item.searchTopic.primaryPath, { locale: item.locale }), "https://nexualpha.com").pathname);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.doesNotMatch(JSON.stringify(item), forbiddenExchangeUrls);
  }
  for (const id of TELEGRAM_WAVE39_SEARCH_TOPICS.map((topic) => topic.id)) {
    const item = broadcasts.find((b) => b.id === id);
    assert.equal(item.wave, "wave39_search_topics");
    assert.equal(item.updateCadence.cadence, "weekly_review");
    assert.equal(item.reviewBy, "2026-09-21T00:00:00.000Z");
    assert.equal(new URL(item.onsiteEntries[0].url).pathname, new URL(localizedHref(item.searchTopic.primaryPath, { locale: item.locale }), "https://nexualpha.com").pathname);
    assert.ok(item.manualReviewSummary.includes(item.searchTopic.query));
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.doesNotMatch(JSON.stringify(item), forbiddenExchangeUrls);
  }
  assert.equal(broadcasts.find((b) => b.id === "brazil-saque-pix-ptbr").path, "/br/saque-pix");
  assert.equal(broadcasts.find((b) => b.id === "brazil-kyc-cpf-ptbr").path, "/br/kyc-cpf");
  assert.equal(broadcasts.find((b) => b.id === "turkey-market-account-check-tr").path, "/tr/markets/turkiye");
});

test("validateTelegramBroadcastSystem enforces dedupe, classification and raw-link safety", () => {
  const broadcasts = generateTelegramBroadcasts({ nowIso: "2026-09-14T00:00:00.000Z" });
  const validation = validateTelegramBroadcastSystem(broadcasts);
  assert.equal(validation.ok, true);
  assert.equal(validation.counts.broadcasts, 101);
  assert.equal(validation.counts.ids, 101);
  assert.equal(validation.counts.campaigns, 101);
  assert.equal(validation.counts.deepLinks, 101);
  assert.equal(validation.rawExchangeRegistrationLinks, false);
  assert.equal(validation.requiredUtmParams, true);
  assert.equal(validation.humanAuthorizationRequired, true);

  const duplicateCampaign = [
    ...broadcasts,
    {
      ...broadcasts[0],
      id: "duplicate-campaign-probe",
      deepLink: `${broadcasts[0].deepLink}_probe`,
    },
  ];
  const duplicateResult = validateTelegramBroadcastSystem(duplicateCampaign);
  assert.equal(duplicateResult.ok, false);
  assert.ok(duplicateResult.problems.some((problem) => problem.includes("duplicate campaign")));

  const rawLinkLeak = [
    {
      ...broadcasts[0],
      plainText: `${broadcasts[0].plainText}\nhttps://partner.bitget.com/bg/zc8pmupf`,
    },
  ];
  const rawLinkResult = validateTelegramBroadcastSystem(rawLinkLeak);
  assert.equal(rawLinkResult.ok, false);
  assert.ok(rawLinkResult.problems.some((problem) => problem.includes("raw exchange registration URL")));
});

test("writeTelegramBroadcastFeed keeps generated feed draft-only and NexuAlpha-first", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nexualpha-tg-feed-"));
  const outputPath = path.join(tempDir, "feed.json");
  const result = await writeTelegramBroadcastFeed(outputPath, { nowIso: "2026-09-14T00:00:00.000Z" });
  const payload = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  const forbiddenExchangeUrls = /(accounts\.binance\.com|binance\.com\/join|bsmkweb\.cc|partner\.bitget|bitget\.com\/expressly|okx\.com\/join|topzhjdgxcb\.net|backpack\.exchange\/join)/i;

  assert.equal(result.count, 101);
  assert.equal(payload.totalBroadcasts, 101);
  assert.equal(payload.distributionPolicy.status, "draft_only");
  assert.equal(payload.distributionPolicy.posting, "manual_review_required");
  assert.doesNotMatch(JSON.stringify(payload), forbiddenExchangeUrls);

  for (const item of payload.broadcasts) {
    assert.equal(item.distributionStatus, "draft_not_posted");
    assert.ok(item.canonicalBacklink.startsWith("https://nexualpha.com/"));
    assert.ok(item.plainText.indexOf(item.canonicalBacklink) < item.plainText.indexOf(item.deepLink));
    assert.ok(item.markdownV2.indexOf(item.canonicalBacklink) < item.markdownV2.indexOf(item.deepLink));
  }
});

test("non-English Telegram backlinks pin landing-page language independent of previous browser locale", () => {
  const broadcasts = generateTelegramBroadcasts({ nowIso: "2026-09-14T00:00:00.000Z" });
  const byId = Object.fromEntries(broadcasts.map((item) => [item.id, item]));

  for (const id of ["fee-disclosure-audit-zh", "withdrawal-network-guide-zh", "tokenized-stock-margin-zh"]) {
    const url = new URL(byId[id].canonicalBacklink);
    assert.equal(url.pathname.startsWith("/zh-hans/news/") || url.pathname.startsWith("/zh-hans/compare/"), true);
    assert.equal(url.searchParams.get("locale"), null);
  }

  for (const id of ["brazil-pix-ptbr", "brazil-saque-pix-ptbr", "brazil-kyc-cpf-ptbr", "brazil-cost-ptbr", "brazil-account-ptbr", "brazil-hub-ptbr", "brazil-compare-ptbr"]) {
    const url = new URL(byId[id].canonicalBacklink);
    assert.equal(url.pathname === "/br" || url.pathname.startsWith("/br/"), true);
    assert.equal(url.searchParams.get("locale"), null);
  }

  const mexicoUrl = new URL(byId["mexico-spei-es"].canonicalBacklink);
  assert.equal(mexicoUrl.pathname, "/mx");
  assert.equal(mexicoUrl.searchParams.get("locale"), null);
  assert.equal(mexicoUrl.searchParams.get("utm_campaign"), "mx_spei_es");
  assert.equal(mexicoUrl.searchParams.get("tg_market"), "mx");
  assert.equal(mexicoUrl.searchParams.get("tg_locale"), "es");
  assert.match(byId["mexico-spei-es"].deepLink, /start=partner_desk_m_MX_l_es_t_spot/);
  assert.match(byId["mexico-spei-es"].title, /SPEI, Medá/);
  assert.match(byId["mexico-spei-es"].summary, /Binance MXN\/SPEI\/Medá/);
  assert.match(byId["mexico-spei-es"].sourceNotes.join(" "), /OKX u otra plataforma global debe verificarse dentro de su propio flujo oficial de cuenta/);
  assert.doesNotMatch(
    JSON.stringify({
      title: byId["mexico-spei-es"].title,
      summary: byId["mexico-spei-es"].summary,
      sourceNotes: byId["mexico-spei-es"].sourceNotes,
      useCases: byId["mexico-spei-es"].useCases,
      plainText: byId["mexico-spei-es"].plainText,
      onsiteEntries: byId["mexico-spei-es"].onsiteEntries,
    }),
    /partner\.bitget|bsmkweb|topzhjdgxcb|nexu888|11350287|comisión privada/i
  );

  const hongKongUrl = new URL(byId["hong-kong-account-en"].canonicalBacklink);
  assert.equal(hongKongUrl.pathname, "/hk");
  assert.equal(hongKongUrl.searchParams.get("locale"), null);
  assert.equal(hongKongUrl.searchParams.get("utm_campaign"), "hk_account_en");
  assert.equal(hongKongUrl.searchParams.get("tg_market"), "hk");
  assert.equal(hongKongUrl.searchParams.get("tg_locale"), "en");
  assert.match(byId["hong-kong-account-en"].deepLink, /start=partner_desk_m_HK_l_en_t_spot/);
  assert.equal(
    byId["hong-kong-account-en"].onsiteEntries.some((entry) => new URL(entry.url).pathname === "/hk/comparar"),
    true,
  );
  assert.equal(
    byId["hong-kong-account-en"].onsiteEntries.some((entry) => new URL(entry.url).pathname === "/compare/osl-vs-hashkey"),
    false,
  );

  for (const id of ["korea-regulatory-context-ko", "korea-krw-funding-ko"]) {
    const url = new URL(byId[id].canonicalBacklink);
    assert.equal(url.pathname, "/kr");
    assert.equal(url.searchParams.get("locale"), null);
    assert.equal(url.searchParams.get("tg_market"), "kr");
    assert.equal(url.searchParams.get("tg_locale"), "ko");
    assert.match(byId[id].deepLink, /start=partner_desk_m_KR_l_ko_t_spot/);
  }

  for (const id of ["turkey-spk-register-tr", "turkey-try-funding-tr"]) {
    const url = new URL(byId[id].canonicalBacklink);
    assert.equal(url.pathname, "/tr/markets/turkiye");
    assert.equal(url.searchParams.has("market"), false);
    assert.equal(url.searchParams.has("locale"), false);
    assert.equal(url.searchParams.get("tg_market"), "tr");
    assert.equal(url.searchParams.get("tg_locale"), "tr");
    assert.match(byId[id].deepLink, /start=partner_desk_m_TR_l_tr_t_spot/);
  }

  const turkeyWave11Url = new URL(byId["turkey-market-account-check-tr"].canonicalBacklink);
  assert.equal(turkeyWave11Url.pathname, "/tr/markets/turkiye");
  assert.equal(turkeyWave11Url.searchParams.has("locale"), false);
  assert.equal(turkeyWave11Url.searchParams.get("tg_market"), "tr");
  assert.equal(turkeyWave11Url.searchParams.get("tg_locale"), "tr");
  assert.match(byId["turkey-market-account-check-tr"].deepLink, /start=partner_desk_m_TR_l_tr_t_spot/);
});

test("buildTelegramPublishQueue produces a 7-day regional manual-review queue", () => {
  const broadcasts = generateTelegramBroadcasts({ nowIso: "2026-09-14T00:00:00.000Z" });
  const queue = buildTelegramPublishQueue(broadcasts, { startDate: "2026-09-15" });
  const queuedIds = queue.flatMap((day) => day.slots.map((slot) => slot.itemId));

  assert.equal(queue.length, 7);
  assert.equal(queue[0].label, "2026-09-15");
  assert.equal(queue[6].label, "2026-09-21");
  assert.deepEqual(new Set(queuedIds), new Set(broadcasts.map((item) => item.id)));
  assert.equal(queuedIds.length, broadcasts.length);

  for (const day of queue) {
    assert.equal(day.status, "draft_only");
    assert.equal(day.posting, "manual_review_required");
    assert.ok(day.slots.length >= 1);
    assert.ok(day.slots.length <= 49);
    for (const slot of day.slots) {
    assert.equal(slot.state, "draft_only");
    assert.equal(slot.review, "manual_review_required");
    assert.equal(slot.publishOrder, "onsite_link_before_bot_deep_link");
    assert.equal(slot.humanAuthorizationRequired, true);
    assert.equal(slot.authorizationRecord.status, "not_authorized");
    assert.equal(slot.authorizationRecord.requiredBeforePost, true);
    assert.ok(["BR", "MX", "HK", "KR", "SG", "TR", "ZH", "GLOBAL"].includes(slot.region));
      assert.ok(slot.funnelStage);
      assert.ok(slot.searchIntent);
      if (slot.gscOpportunity) {
        assert.ok([
          "hyperliquid fees",
          "hyperliquid funded account",
          "uniswap testnet",
          "tokenized treasury",
          "bitget vs bybit stocks",
          "crypto perpetual platform",
          "hyperliquid latest news",
          "site:hyperliquid.gitbook.io/hyperliquid-docs \"funding is paid hourly\"",
          "代币化股票保证金",
          "OKX USD to USDC spot pair migration",
          "no kyc crypto exchange",
          "한국 가상자산 플랫폼 공식 확인",
          "원화 입금 실명 계좌 조건",
          "Türkiye kripto platformu SPK listesi",
          "TRY yatırma banka hesabı koşulları",
          "Hyperliquid funding rate before opening a position",
          "Hyperliquid vs dYdX risk comparison",
          "Uniswap v4 deployment official check",
          "Jupiter Ultra token mint check",
          "Aerodrome Slipstream incentives check",
          "BUIDL BENJI tokenized treasury comparison",
          "OKX USDC migration API instrument check",
          "saque Pix exchange cripto Brasil",
          "KYC CPF corretora cripto Brasil",
          "한국 가상자산 계정 공식 확인 체크리스트",
          "Türkiye kripto hesap kontrol listesi",
          "tokenized treasury redemption risk",
          "tokenized stock vs stock perpetual",
          "tokenized assets custody proof",
          "RWA treasury transfer restrictions",
          "한국 토큰화 자산 주식 퍼프 구분",
          "한국 Hyperliquid funding 수수료 청산 확인",
          "한국 Uniswap 지갑 서명 경로 확인",
          "Bybit Bitget 주식 상품 토큰화 구분",
          "Türkiye tokenized asset hisse perp ayrımı",
          "Türkiye Hyperliquid funding ücret likidasyon kontrolü",
          "Türkiye Uniswap cüzdan imza yolu kontrolü",
          "Bybit Bitget stock tokenized perp Türkiye",
        ].includes(slot.gscOpportunity.query));
        assert.equal(slot.gscOpportunity.clicks, 0);
        assert.match(slot.gscOpportunity.source, /^gsc-visible-(?:baseline|page-baseline|query-page-pairs)-/);
      }
      assert.ok(slot.regionSegment);
      assert.ok(slot.reviewBy);
      assert.ok(slot.postRecordId.includes(slot.campaign));
      assert.ok(slot.trackingContext.market);
      assert.ok(slot.trackingContext.locale);
      assert.ok(slot.trackingContext.product);
      assert.ok(slot.trackingContext.funnel);
      assert.ok(slot.trackingContext.intent);
      assert.ok(slot.trackingContext.theme);
      assert.ok(slot.trackingContext.draft);
      assert.ok(slot.answerFirst);
      assert.ok(slot.onsiteEntries.length >= 2);
      assert.equal(slot.canonicalLandingUrl, slot.onsiteUrl);
      assert.equal(slot.utmReview.canonicalLandingUrl, slot.onsiteUrl);
      assert.equal(slot.utmReview.publicParams.utm_campaign, slot.campaign);
      assert.equal(slot.landingPageReview.primaryOnsiteCta.url, slot.onsiteEntries[0].url);
      assert.equal(slot.landingPageReview.prePublishChecks.some((check) => check.includes("HTTP 200")), true);
      assert.equal(slot.onsiteEntries.every((entry) => entry.url.startsWith("https://nexualpha.com/")), true);
      if (["wave7_search_topics", "wave8_search_topics", "wave9_search_topics", "wave10_search_topics", "wave11_search_topics", "wave13_search_topics"].includes(slot.wave)) {
        assert.ok(slot.searchTopic.query);
        assert.ok(slot.manualReviewSummary.includes(slot.searchTopic.query));
        assert.equal(slot.updateCadence.cadence, "weekly_review");
        assert.equal(slot.updateCadence.reviewTtlDays, 7);
        assert.equal(slot.reviewBy, "2026-09-21T00:00:00.000Z");
      }
      assert.deepEqual(slot.trackingRequiredParams, [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "tg_market",
        "tg_locale",
        "tg_product",
        "tg_funnel",
        "tg_intent",
        "tg_theme",
        "tg_draft",
      ]);
      assert.match(slot.onsiteUrl, /^https:\/\/nexualpha\.com\//);
      assert.match(slot.botDeepLink, /^https:\/\/t\.me\/NexuAlphaAssistantBot\?start=/);
      const onsiteUrl = new URL(slot.onsiteUrl);
      assert.equal(onsiteUrl.searchParams.get("utm_campaign"), slot.campaign);
      assert.equal(onsiteUrl.searchParams.get("tg_market"), slot.trackingContext.market);
      assert.equal(onsiteUrl.searchParams.get("tg_locale"), slot.trackingContext.locale);
      assert.equal(onsiteUrl.searchParams.get("tg_product"), slot.trackingContext.product);
    }
  }

  assert.equal(queue[0].slots[0].itemId, "brazil-hub-ptbr");
  assert.equal(queue[6].slots[0].itemId, "brazil-compare-ptbr");
  assert.equal(queue[6].slots[4].itemId, "turkey-market-account-check-tr");
  assert.equal(queuedIds.includes("tokenized-treasury-redemption-risk-en"), true);
  assert.equal(queuedIds.includes("korea-tokenized-asset-boundary-ko"), true);
  assert.equal(queuedIds.includes("turkey-bybit-bitget-stock-boundary-tr"), true);
});

test("manual publish pack renderers keep copyable outputs draft-only and onsite-first", () => {
  const broadcasts = generateTelegramBroadcasts({ nowIso: "2026-09-14T00:00:00.000Z" });
  const queue = buildTelegramPublishQueue(broadcasts, { startDate: "2026-09-15" });
  const copyPack = renderTelegramManualCopyPack(broadcasts, queue);
  const preflight = renderTelegramPreflightChecklist(broadcasts, queue);
  const attribution = renderTelegramAttributionGuide(queue);
  const postLog = renderTelegramPostLogTemplate(queue);
  const weeklyReview = renderTelegramWeeklyReviewTemplate(queue);
  const forbiddenExchangeUrls = /(accounts\.binance\.com|binance\.com\/join|bsmkweb\.cc|partner\.bitget|bitget\.com\/expressly|okx\.com\/join|topzhjdgxcb\.net|backpack\.exchange\/join)/i;

  assert.match(copyPack, /Status: draft_only \/ manual_review_required/);
  assert.match(copyPack, /## 7-day queue/);
  assert.match(copyPack, /Canonical landing URL:/);
  assert.match(copyPack, /Landing first-screen check:/);
  assert.match(copyPack, /Landing URL/);
  assert.match(copyPack, /Plain text:/);
  assert.match(copyPack, /MarkdownV2:/);
  assert.match(preflight, /does not promise approval, bonus, fee discount, indexing, ranking, signup, retention, trading outcome/);
  assert.match(preflight, /answer-first summary/);
  assert.match(preflight, /Wave7, Wave8, Wave9, Wave10, Wave11, Wave13, Wave25, Wave26, Wave27, Wave28, Wave29, Wave30, Wave31, Wave32, Wave33, Wave34, Wave35, Wave36, Wave37, Wave38, Wave39 and Wave57 search-topic posts/);
  assert.match(copyPack, /Answer first:/);
  assert.match(copyPack, /Onsite next steps:/);
  assert.match(copyPack, /Wave: wave7_search_topics/);
  assert.match(copyPack, /Wave: wave8_search_topics/);
  assert.match(copyPack, /Wave: wave9_search_topics/);
  assert.match(copyPack, /Wave: wave10_search_topics/);
  assert.match(copyPack, /Wave: wave11_search_topics/);
  assert.match(copyPack, /Wave: wave13_search_topics/);
  assert.match(copyPack, /Update cadence: Weekly manual refresh/);
  assert.match(copyPack, /Manual review summary: hyperliquid fees/);
  assert.match(copyPack, /Manual review summary: uniswap testnet/);
  assert.match(preflight, /GSC-priority posts carry a visible Search Console query/);
  assert.match(preflight, /canonicalLandingUrl/);
  assert.match(preflight, /first viewport points users to the answer/);
  assert.match(preflight, /tg_market/);
  assert.match(attribution, /Official exchange registration APIs are not available/);
  assert.match(attribution, /GSC-priority drafts can be reviewed by their attached query/);
  assert.match(copyPack, /hyperliquid fees/);
  assert.match(copyPack, /uniswap testnet/);
  assert.match(copyPack, /tokenized treasury/);
  assert.match(copyPack, /bitget vs bybit stocks/);
  assert.match(copyPack, /crypto perpetual platform/);
  assert.match(copyPack, /代币化股票保证金/);
  assert.match(copyPack, /OKX USD to USDC spot pair migration/);
  assert.match(copyPack, /no kyc crypto exchange/);
  assert.match(copyPack, /한국 가상자산 플랫폼 공식 확인/);
  assert.match(copyPack, /Türkiye kripto platformu SPK listesi/);
  assert.match(copyPack, /Hyperliquid funding rate before opening a position/);
  assert.match(copyPack, /Aerodrome Slipstream incentives check/);
  assert.match(copyPack, /Türkiye kripto hesap kontrol listesi/);
  assert.match(copyPack, /tokenized treasury redemption risk/);
  assert.match(copyPack, /한국 토큰화 자산 주식 퍼프 구분/);
  assert.match(copyPack, /Türkiye tokenized asset hisse perp ayrımı/);
  assert.match(attribution, /utm_source=tg_channel/);
  assert.match(attribution, /tg_locale/);
  assert.match(postLog, /Telegram manual post log template/);
  assert.match(postLog, /24h protectedOutboundClicks/);
  assert.match(postLog, /24h onsiteNextStepClicks/);
  assert.match(postLog, /7d searchImpressionDeltaIfAvailable/);
  assert.match(weeklyReview, /Telegram weekly review template/);
  assert.match(weeklyReview, /24h evidence/);
  assert.match(weeklyReview, /7d evidence/);
  assert.match(weeklyReview, /keep \/ refresh \/ pause \/ localize/);
  assert.match(weeklyReview, /Onsite CTA intent events/);
  assert.doesNotMatch(`${copyPack}\n${preflight}\n${attribution}\n${postLog}\n${weeklyReview}`, forbiddenExchangeUrls);

  for (const item of broadcasts) {
    const headingIdIndex = copyPack.indexOf(`. ${item.id}\n\nRegion:`);
    const itemStart = copyPack.lastIndexOf("\n#### ", headingIdIndex);
    const nextItemStart = copyPack.indexOf("\n#### ", itemStart + 1);
    const dayStart = copyPack.indexOf("\n### ", itemStart + 1);
    const candidates = [nextItemStart, dayStart].filter((index) => index > itemStart);
    const itemEnd = candidates.length ? Math.min(...candidates) : copyPack.length;
    const itemBlock = copyPack.slice(itemStart, itemEnd);
    assert.ok(copyPack.includes(item.id), `copy pack must include ${item.id}`);
    assert.ok(itemBlock.includes(item.canonicalBacklink), `copy block must include onsite URL for ${item.id}`);
    assert.ok(itemBlock.includes(item.deepLink), `copy block must include bot deep link for ${item.id}`);
    assert.ok(
      itemBlock.indexOf(item.canonicalBacklink) < itemBlock.indexOf(item.deepLink),
      `copy pack should keep onsite URL before Bot deep link for ${item.id}`
    );
  }
});

test("writeTelegramManualPublishPack writes operator artifacts without sending Telegram messages", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "nexualpha-tg-pack-"));
  const result = await writeTelegramManualPublishPack(tempDir, {
    nowIso: "2026-09-14T00:00:00.000Z",
    startDate: "2026-09-15",
  });
  const queuePayload = JSON.parse(fs.readFileSync(path.join(tempDir, "queue.json"), "utf8"));
  const copyPack = fs.readFileSync(path.join(tempDir, "copy-pack.md"), "utf8");
  const preflight = fs.readFileSync(path.join(tempDir, "preflight-checklist.md"), "utf8");
  const attribution = fs.readFileSync(path.join(tempDir, "attribution-guide.md"), "utf8");
  const postLog = fs.readFileSync(path.join(tempDir, "post-log-template.md"), "utf8");
  const weeklyReview = fs.readFileSync(path.join(tempDir, "weekly-review-template.md"), "utf8");

  assert.equal(result.count, 101);
  assert.equal(result.days, 7);
  assert.equal(queuePayload.distributionPolicy.status, "draft_only");
  assert.equal(queuePayload.distributionPolicy.posting, "manual_review_required");
  assert.equal(queuePayload.distributionPolicy.noTelegramApiCall, true);
  assert.equal(queuePayload.distributionPolicy.noRawExchangeRegistrationLinks, true);
  assert.deepEqual(queuePayload.distributionPolicy.trackingRequiredParams, [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "tg_market",
    "tg_locale",
    "tg_product",
    "tg_funnel",
    "tg_intent",
    "tg_theme",
    "tg_draft",
  ]);
  assert.equal(queuePayload.validation.ok, true);
  assert.equal(queuePayload.queue.length, 7);
  assert.equal(queuePayload.queue[0].slots[0].canonicalLandingUrl, queuePayload.queue[0].slots[0].onsiteUrl);
  assert.equal(queuePayload.queue[0].slots[0].utmReview.publicParams.utm_source, "tg_channel");
  assert.equal(queuePayload.queue[0].slots[0].landingPageReview.primaryOnsiteCta.url, queuePayload.queue[0].slots[0].onsiteEntries[0].url);
  assert.match(copyPack, /NexuAlpha Telegram 7-day manual publish pack/);
  assert.match(preflight, /Run before any manual channel post/);
  assert.match(attribution, /What must remain unknown/);
  assert.match(postLog, /Telegram manual post log template/);
  assert.match(weeklyReview, /Telegram weekly review template/);
});
