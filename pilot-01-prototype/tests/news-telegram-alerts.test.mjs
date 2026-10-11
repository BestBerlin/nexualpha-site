import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("article page renders the Telegram alerts deep link in all 17 locales", async () => {
  const src = readFileSync(new URL("../src/components/v3/news/NewsTelegramAlerts.jsx", import.meta.url), "utf8");
  assert.match(src, /https:\/\/t\.me\/NexuAlphaAssistantBot\?start=alerts/);
  for (const locale of ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"]) {
    assert.ok(src.includes(locale.includes("-") ? `"${locale}":` : `${locale}:`), locale);
  }
  const page = readFileSync(new URL("../src/components/v3/news/NewsDetailPage.jsx", import.meta.url), "utf8");
  assert.match(page, /<NewsTelegramAlerts locale=\{locale\} \/>/);
});
