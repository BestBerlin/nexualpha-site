import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { transformSync } from "esbuild";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
// The component file is JSX; compile it once so the copy table and channel mapping are tested as shipped.
const jsx = readFileSync(new URL("../src/components/v3/news/NewsTelegramAlerts.jsx", import.meta.url), "utf8");
const out = path.join(mkdtempSync(path.join(tmpdir(), "tg-join-")), "m.mjs");
writeFileSync(out, transformSync(jsx, { loader: "jsx", format: "esm", jsx: "automatic" }).code.replace(/^import .*react\/jsx-runtime.*$/m, "const jsx = () => null, jsxs = () => null;"));
const { TELEGRAM_JOIN_COPY, telegramChannelFor, telegramJoinCopy } = await import(out);

// Owner 2026-10-22: every article shows the Telegram channel entry right under the header, not only at the end.
test("join card sits inside the article header, before the body", () => {
  const page = readFileSync(new URL("../src/components/v3/news/NewsDetailPage.jsx", import.meta.url), "utf8");
  const header = page.slice(page.indexOf('<header className="news-detail__header">'), page.indexOf("</header>", page.indexOf('<header className="news-detail__header">')));
  assert.match(header, /<NewsTelegramJoin locale=\{locale\} \/>/);
});

test("each locale opens its own channel", () => {
  assert.equal(telegramChannelFor("zh-Hans"), "https://t.me/NexuAlphaClub");
  assert.equal(telegramChannelFor("zh-Hant"), "https://t.me/NexuAlphaClub");
  assert.equal(telegramChannelFor("ru"), "https://t.me/NexuAlphaRU");
  for (const l of ["en", "es", "pt-BR", "id", "tr", "vi", "ar", "de"]) assert.equal(telegramChannelFor(l), "https://t.me/NexuAlphaGlobal", l);
});

test("promotable locales carry the search keywords; neutral locales carry no rebate or sign-up wording", () => {
  assert.match(telegramJoinCopy("zh-Hans").join(" "), /返佣/); assert.match(telegramJoinCopy("zh-Hans").join(" "), /比特币/); assert.match(telegramJoinCopy("zh-Hans").join(" "), /代币化美股/);
  assert.match(telegramJoinCopy("en").join(" "), /rebates/i);
  for (const l of ["zh-Hant", "ru", "vi", "ar", "uk", "ur"]) {
    assert.doesNotMatch(telegramJoinCopy(l).join(" "), /rebate|返佣|返傭|cashback|rabat|reembolso|komisyon|комисси|hoàn phí|sign.?up|注册|註冊|регистр|đăng ký/i, l);
  }
  for (const [l, copy] of Object.entries(TELEGRAM_JOIN_COPY)) assert.equal(copy.length, 3, l);
});
