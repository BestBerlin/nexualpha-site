// "Get alerts on Telegram" (2026-10-13) on /flash, coin pages and /liquidations: one line naming the bot's personal
// triggers, opening @NexuAlphaAssistantBot's /alerts card in the reader's language (?start=alerts-<lang>), tracked as a
// telegram CTA with its placement. No fine print.
import assert from "node:assert/strict";
import test from "node:test";
import { createSsrHarness } from "./helpers/ssr-hydration-harness.mjs";

let harness, TELEGRAM_TRIGGER_PLACEMENTS, telegramTriggerCopy, telegramTriggerUrl;
test.before(async () => {
  harness = await createSsrHarness();
  ({ TELEGRAM_TRIGGER_PLACEMENTS, telegramTriggerCopy, telegramTriggerUrl } = await harness.vite.ssrLoadModule("/src/components/shared/TelegramTriggerCta.jsx"));
});
test.after(async () => { await harness?.close(); });

const cta = (html) => html.match(/<aside class="nx-tgcta[^"]*"[\s\S]*?<\/aside>/)?.[0] || "";

test("deep link opens the /alerts card in the bot's languages, plain card elsewhere", () => {
  assert.equal(telegramTriggerUrl("en"), "https://t.me/NexuAlphaAssistantBot?start=alerts-en");
  assert.equal(telegramTriggerUrl("zh-Hant"), "https://t.me/NexuAlphaAssistantBot?start=alerts-zh");
  assert.equal(telegramTriggerUrl("pt-BR"), "https://t.me/NexuAlphaAssistantBot?start=alerts-pt");
  assert.equal(telegramTriggerUrl("ja"), "https://t.me/NexuAlphaAssistantBot?start=alerts");
  for (const locale of ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"]) {
    const [line, action] = telegramTriggerCopy(locale);
    assert.ok(line && action, locale);
    assert.doesNotMatch(line + action, /advice|commission|DYOR|建议|佣金/i, locale);
  }
});

test("coin page and /liquidations render the CTA on the server with their placements", async () => {
  const coin = await harness.render("https://nexualpha.com/coins/bitcoin", {});
  assert.match(cta(coin), /data-telegram-alerts-strip="coin-telegram-alerts"/);
  assert.match(cta(coin), /href="https:\/\/t\.me\/NexuAlphaAssistantBot\?start=alerts-en"[^>]*data-cta-kind="telegram" data-cta-placement="coin-telegram-alerts"/);
  const zhCoin = await harness.render("https://nexualpha.com/zh-hans/coins/bitcoin", {});
  assert.match(cta(zhCoin), /在 Telegram 接收提醒/);
  const feed = { generatedAt: new Date().toISOString(), liquidations: { h1: { totalUsd: 1e6, longUsd: 6e5, shortUsd: 4e5, topSymbols: [] }, h4: { totalUsd: 2e6, longUsd: 1e6, shortUsd: 1e6, topSymbols: [] }, h24: { totalUsd: 9e6, longUsd: 5e6, shortUsd: 4e6, topSymbols: [], largest: null } }, market: { majors: [], movers: [] } };
  const liq = await harness.render("https://nexualpha.com/liquidations", { marketEvents: feed });
  assert.match(cta(liq), /data-cta-placement="liquidations-telegram-alerts"/);
  assert.equal((liq.match(/<aside class="nx-tgcta/g) || []).length, 1, "one Telegram line per page");
  assert.doesNotMatch(liq, /Get liquidation and sharp-move alerts in Telegram/, "replaces the older topic-only line");
  const unavailable = await harness.render("https://nexualpha.com/liquidations", {});
  assert.match(cta(unavailable), /liquidations-telegram-alerts/, "shown even while the feed is unavailable");
  const funding = await harness.render("https://nexualpha.com/funding-rates", {});
  assert.match(cta(funding), /data-cta-placement="funding-telegram-alerts"/);
  assert.deepEqual(TELEGRAM_TRIGGER_PLACEMENTS, ["flash-telegram-alerts", "coin-telegram-alerts", "liquidations-telegram-alerts", "funding-telegram-alerts"]);
});
