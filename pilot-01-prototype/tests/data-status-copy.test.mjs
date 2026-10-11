import assert from "node:assert/strict";
import test from "node:test";
import { dataStatusCopy } from "../src/content/data-status-copy.js";

const locales = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it", "ur", "uk"];
const states = ["ready", "error", "loading", "refresh", "mock", "empty", "stale"];
const connectedWords = [
  "connected",
  "已连接",
  "已連線",
  "conectado",
  "connecté",
  "verbunden",
  "接続済み",
  "연결됨",
  "الاتصال",
  "bağlanıldı",
  "подключ",
  "terhubung",
  "kết nối",
  "connesso",
];

test("all supported locales expose complete non-empty data status copy", () => {
  for (const locale of locales) {
    const copy = dataStatusCopy(locale);
    for (const state of states) {
      assert.equal(typeof copy[state], "string", `${locale}.${state}`);
      assert.ok(copy[state].trim().length > 0, `${locale}.${state}`);
    }
  }
});

test("empty and stale states reuse the unavailable copy, not a connected claim", () => {
  for (const locale of locales) {
    const copy = dataStatusCopy(locale);
    assert.equal(copy.empty, copy.error, `${locale}.empty`);
    assert.equal(copy.stale, copy.error, `${locale}.stale`);
    assert.equal(connectedWords.some((word) => copy.error.toLowerCase().includes(word.toLowerCase())), false, `${locale}.error`);
  }
});

test("ready, loading, error, and mock labels remain semantically distinct", () => {
  for (const locale of locales) {
    const copy = dataStatusCopy(locale);
    assert.notEqual(copy.ready, copy.error, `${locale}.ready/error`);
    assert.notEqual(copy.ready, copy.loading, `${locale}.ready/loading`);
    assert.notEqual(copy.ready, copy.mock, `${locale}.ready/mock`);
    assert.notEqual(copy.error, copy.loading, `${locale}.error/loading`);
  }
});

test("unknown locales fall back to English data status copy", () => {
  assert.deepEqual(dataStatusCopy("not-a-locale"), dataStatusCopy("en"));
});
