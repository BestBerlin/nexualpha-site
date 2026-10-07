import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  appendAccountStageToSearch,
  restoreYellowPagesStateFromUrl,
  writeYellowPagesStateToUrl,
} from "../src/components/v3/venue-yellow-pages-state.js";

const venues = [
  { slug: "binance" },
  { slug: "okx" },
  { slug: "bybit" },
];

test("yellow pages URL state restores only supported filters and visible venues", () => {
  const state = restoreYellowPagesStateFromUrl(
    "?category=DEX&filters=noKyc,por,bad&sort=fee&query=%00%20Binance%20&selection=okx,missing,okx,binance,bybit&account_stage=another_platform",
    { venues, defaultCategory: "CEX" },
  );

  assert.deepEqual(state, {
    category: "DEX",
    filters: { noKyc: true, por: true, fiat: false, highLev: false },
    sort: "fee",
    query: "Binance",
    selection: ["okx", "binance"],
    accountStage: "another_platform",
  });
});

test("yellow pages URL state falls back without inventing unsupported values", () => {
  const state = restoreYellowPagesStateFromUrl(
    "?category=bad&filters=fiat&sort=fast&selection=missing&account_stage=vip",
    { venues, defaultCategory: "Perp DEX" },
  );

  assert.equal(state.category, "Perp DEX");
  assert.deepEqual(state.filters, { noKyc: false, por: false, fiat: true, highLev: false });
  assert.equal(state.sort, "default");
  assert.deepEqual(state.selection, []);
  assert.equal(state.accountStage, null);
});

test("yellow pages URL writer replaces only yellow-page state keys", () => {
  const href = "https://nexualpha.com/exchanges?locale=ja&category=CEX&filters=fiat&selection=old#grid";
  const next = writeYellowPagesStateToUrl(href, {
    category: "Perp DEX",
    filters: { noKyc: false, por: true, fiat: false, highLev: true },
    sort: "rebate",
    query: "Hyperliquid",
    selection: ["okx", "bybit", "binance"],
    accountStage: "existing_account",
    defaultCategory: "CEX",
  });

  assert.equal(next, "/exchanges?locale=ja&category=Perp+DEX&filters=por%2ChighLev&sort=rebate&query=Hyperliquid&selection=okx%2Cbybit&account_stage=existing_account#grid");
});

test("yellow pages account-stage helper keeps existing directory context", () => {
  assert.equal(appendAccountStageToSearch("market=JP&product=spot", "new_account"), "market=JP&product=spot&account_stage=new_account");
  assert.equal(appendAccountStageToSearch("market=JP&product=spot", "vip"), "market=JP&product=spot");
});

test("regional empty states have native copy instead of an English fallback", async () => {
  const source = await readFile(new URL("../src/components/v3/VenueYellowPages.jsx", import.meta.url), "utf8");
  const directoryUiStart = source.indexOf("const directoryUiCopy = {");
  const directoryUiEnd = source.indexOf("const filterLabels", directoryUiStart);
  assert.ok(directoryUiStart >= 0 && directoryUiEnd > directoryUiStart, "directoryUiCopy scope");
  const directoryUiSource = source.slice(directoryUiStart, directoryUiEnd);
  for (const locale of ["es", "pt-BR", "fr", "de", "ja", "ko", "ar", "tr", "ru", "id", "vi", "it"]) {
    const quotedStart = directoryUiSource.indexOf(`  ${JSON.stringify(locale)}: {`);
    const start = quotedStart >= 0 ? quotedStart : directoryUiSource.indexOf(`  ${locale}: {`);
    assert.notEqual(start, -1, `${locale} directoryUiCopy`);
    const next = directoryUiSource.indexOf("\n  },", start);
    const block = directoryUiSource.slice(start, next);
    assert.match(block, /emptyTitle:/, `${locale}.emptyTitle`);
    assert.match(block, /emptyBody:/, `${locale}.emptyBody`);
    assert.match(block, /resetFilters:/, `${locale}.resetFilters`);
    assert.doesNotMatch(block, /No platforms match these filters/, `${locale} must not reuse English empty state`);
  }
});

test("directory related research shell has native copy for priority international locales", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(source, /ja: \{ label: "関連リサーチ", note: "地域、プラットフォーム、手数料、資産構造を続けて比較できます"/);
  assert.match(source, /ko: \{ label: "관련 리서치"/);
  assert.match(source, /tr: \{ label: "İlgili araştırmalar"/);
});
