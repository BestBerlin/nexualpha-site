import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { TELEGRAM_WAVE22_ONSITE_BOT_HANDOFFS as authoritative, buildTelegramWebsiteFunnelContext as publicBuilder } from "../src/data/telegram-config.js";
import { TELEGRAM_WAVE22_ONSITE_BOT_HANDOFFS as runtime } from "../src/data/telegram-onsite-handoffs.js";
import { buildTelegramWebsiteFunnelContext } from "../src/data/telegram-website-funnel.js";

test("onsite Telegram runtime preserves the editorial handoff projection", async () => {
  assert.deepEqual(runtime, authoritative);
  assert.equal(publicBuilder, buildTelegramWebsiteFunnelContext, "public API reexports the same authoritative builder");
  const source = await readFile(new URL("../src/data/telegram-website-funnel.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /from ["']\.\/telegram-config/);
  for (const intent of ["selected", "compare", "fees", "monitor"]) {
    const result = buildTelegramWebsiteFunnelContext({ intent, venue: "okx", pair: "binance-vs-okx", locale: "zh-Hans", market: "SG", volume: 1234.5, now: 0 });
    assert.ok(result.startPayload.length <= 64);
    assert.match(result.deepLink, /^https:\/\/t\.me\/NexuAlphaAssistantBot\?start=/);
    assert.match(result.returnHref, /^\/zh-hans\//);
  }
});
