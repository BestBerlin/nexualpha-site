import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));

function renderDock(props) {
  const dir = mkdtempSync(path.join(root, "tests/.tmp-regional-mobile-dock-"));
  try {
    const entry = path.join(dir, "entry.jsx");
    writeFileSync(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { RegionalMobileDecisionDock } from "../../src/components/v3/international/RegionalMobileDecisionDock.jsx";
      console.log(renderToStaticMarkup(<RegionalMobileDecisionDock {...${JSON.stringify(props)}} />));
    `);
    execFileSync(path.join(root, "node_modules/.bin/esbuild"), [
      entry,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${dir}/bundle.cjs`,
      "--loader:.css=empty",
      "--log-level=error",
    ]);
    return execFileSync(process.execPath, [path.join(dir, "bundle.cjs")], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function renderPreview(props) {
  const dir = mkdtempSync(path.join(root, "tests/.tmp-regional-preview-locale-key-"));
  try {
    const entry = path.join(dir, "entry.jsx");
    writeFileSync(entry, `
      import React from "react";
      import { renderToStaticMarkup } from "react-dom/server";
      import { RegionalMarketPreview } from "../../src/components/v3/international/RegionalMarketPreview.jsx";
      console.log(renderToStaticMarkup(<RegionalMarketPreview {...${JSON.stringify(props)}} />));
    `);
    execFileSync(path.join(root, "node_modules/.bin/esbuild"), [
      entry,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${dir}/bundle.cjs`,
      "--loader:.css=empty",
      "--log-level=error",
    ]);
    return execFileSync(process.execPath, [path.join(dir, "bundle.cjs")], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function hrefsFrom(html) {
  return [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
}

test("regional mobile decision dock renders exactly three onsite decision entries with anonymous context", () => {
  const html = renderDock({
    locale: "ja",
    market: "JP",
    product: "spot",
    accountStage: "another_platform",
    funding: "JPY deposit",
    shortlist: { pair: "binance-vs-okx" },
  });
  const hrefs = hrefsFrom(html);
  assert.equal(hrefs.length, 3);
  assert.match(html, /data-regional-mobile-decision-dock="JP"/);
  assert.ok(hrefs.every((href) => href.startsWith("/") && !/^https?:/i.test(href)), hrefs.join("\n"));
  assert.match(hrefs[0], /^\/ja\/exchanges#nxa-context\?/);
  assert.match(hrefs[1], /^\/ja\/compare\/binance-vs-okx#nxa-context\?/);
  assert.match(hrefs[1], /market=JP/);
  assert.match(hrefs[2], /^\/ja\/telegram#nxa-context\?/);
  assert.match(hrefs[2], /market=JP/);
  assert.match(hrefs[2], /product=spot/);
  assert.match(hrefs[2], /account_stage=another_platform/);
  assert.match(hrefs[2], /funding=JPY\+deposit/);
  assert.match(hrefs[2], /scenario=compare/);
  assert.match(hrefs[2], /pair=binance-vs-okx/);
  assert.doesNotMatch(hrefs.join("\n"), /return=|https%3A%2F%2Ft\.me|t\.me|ref=|invite|invite_code|nexu888|11350287|luckybitcoin/i);
});

test("regional mobile decision dock opens candidate selection when no reviewed compare pair exists", () => {
  const html = renderDock({
    locale: "id",
    market: "ID",
    product: "spot",
    accountStage: "new_account",
    funding: "IDR bank transfer",
    shortlist: { pair: "" },
  });
  const hrefs = hrefsFrom(html);
  assert.equal(hrefs.length, 3);
  assert.match(hrefs[1], /^\/id-id\/exchanges#exchanges$/);
  assert.match(hrefs[1], /#exchanges$/);
  assert.match(html, /data-regional-compare-mode="select-candidates"/);
  assert.doesNotMatch(hrefs[1], /\/compare\//);
  assert.match(hrefs[2], /^\/id-id\/telegram#nxa-context\?/);
  assert.match(hrefs[2], /scenario=selected/);
  assert.doesNotMatch(hrefs[2], /pair=/);
});

test("App delegates mobile navigation to the regional dock for JP KR TR MX and ID", () => {
  const appSource = readFileSync(path.join(root, "src/App.jsx"), "utf8");
  assert.match(appSource, /const REGIONAL_DECISION_DOCK_MARKETS = new Set\(\["JP", "KR", "TR", "MX", "ID"\]\)/);
  assert.match(appSource, /const regionalDecisionDockOwnsMobileNav = \["regionalPreview", "regionalDecision"\]\.includes\(route\.name\)/);
  assert.match(appSource, /const showSharedMobileNav = route\.name !== "venue" && route\.name !== "compare" && !regionalDecisionDockOwnsMobileNav/);
  assert.match(appSource, /<RegionalMarketPreview market=\{route\.market\} locale=\{locale\} decisionPassport=\{decisionPassport\} \/>/);
});

test("regional decision routes also delegate mobile navigation and dock targets stay accessible", () => {
  const appSource = readFileSync(path.join(root, "src/App.jsx"), "utf8");
  const cssSource = readFileSync(path.join(root, "src/components/v3/international/regional-mobile-decision-dock.css"), "utf8");
  assert.match(appSource, /if \(route\.name === "regionalDecision"\) return pageShell\(<RegionalMarketPreview/);
  assert.match(appSource, /\["regionalPreview", "regionalDecision"\]\.includes\(route\.name\)/);
  assert.match(cssSource, /\.regional-mobile-decision-dock a \{[\s\S]*?min-height:\s*44px;/);
});

test("regional locale-key fallbacks keep JP KR TR decision actions and account toggles out of English", () => {
  const cases = [
    ["JP", "ja-JP", /利用候補を確認/, /他の口座段階を見る/],
    ["KR", "ko-KR", /이용 후보 확인/, /다른 계정 단계 보기/],
    ["TR", "tr-TR", /Uygun platformları inceleyin/, /Diğer hesap aşamalarını göster/],
  ];
  for (const [market, locale, quickAction, accountToggle] of cases) {
    const html = renderPreview({ market, locale });
    assert.match(html, quickAction, `${market} quick action`);
    assert.match(html, accountToggle, `${market} account toggle`);
    assert.doesNotMatch(html, /Review platform candidates|View other account stages|Hide other account stages/);
  }
});

test("JP KR TR funding matrix SSR avoids English account-check and boundary leakage", () => {
  const cases = [
    [
      "JP",
      "ja-JP",
      [/登録ルートを比較する前に/, /現在の JPY 入出金/, /特定ユーザーの登録承認/],
      [/Confirm the provider appears/, /Read the official account or fee page/, /Does not prove registration approval/],
    ],
    [
      "KR",
      "ko-KR",
      [/한국 계정 경로를 비교하기 전에/, /KRW 금액 한도/, /특정 사용자의 계정 승인/],
      [/Confirm the official FSC or KOFIU/, /Read the official account screen/, /Does not prove account approval/],
    ],
    [
      "TR",
      "tr-TR",
      [/Bir Türkiye platform rotasını/, /Banka transferi koşulları/, /Belirli kullanıcı için hesap onayı/],
      [/Confirm the current SPK operation/, /Use the official account screen/, /Does not prove account approval/],
    ],
  ];
  for (const [market, locale, expectedTexts, forbiddenTexts] of cases) {
    const html = renderPreview({ market, locale });
    for (const pattern of expectedTexts) assert.match(html, pattern, `${market} localized funding text`);
    for (const pattern of forbiddenTexts) assert.doesNotMatch(html, pattern, `${market} English funding leakage`);
  }
});

test("international route cards use base-locale fallback before English defaults", () => {
  const html = renderPreview({ market: "OTHER", locale: "ar-SA" });
  assert.match(html, /اختر أقرب مسار موثق/);
  assert.match(html, /الولايات المتحدة أو بلد غير مدرج/);
  assert.doesNotMatch(html, /Choose the closest verified path|United States or unlisted country/);
});
