import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  REGIONAL_FUNDING_MATRIX_BOUNDARY,
  REGIONAL_FUNDING_MATRIX_METHODOLOGY,
  REGIONAL_FUNDING_MATRIX_PUBLIC_CSV,
  REGIONAL_FUNDING_MATRIX_PUBLIC_JSON,
  REGIONAL_FUNDING_MATRIX_REVIEWED_AT,
  REGIONAL_FUNDING_MATRIX_SCOPE,
  REGIONAL_FUNDING_VERIFICATION_MATRIX,
  regionalFundingMatrixSummary,
  regionalFundingRowsForMarkets,
} from "../src/data/regional-funding-verification-matrix.js";

const unsafePublicPattern = /private commission|invite code|referral link|nexu888|11350287|fixed benefit|guaranteed bonus/i;

test("regional funding verification matrix covers BR MX US EU UK JP HK KR SG and TR with official-source boundaries", () => {
  const rows = regionalFundingRowsForMarkets(["BR", "MX", "US", "EU", "UK", "JP", "HK", "KR", "SG", "TR"]);
  assert.deepEqual(rows.map((row) => row.market), ["BR", "MX", "US", "EU", "UK", "JP", "HK", "KR", "SG", "TR"]);
  assert.equal(REGIONAL_FUNDING_MATRIX_REVIEWED_AT, "2026-09-28");
  assert.match(REGIONAL_FUNDING_MATRIX_SCOPE, /Local fiat and payment-route verification/);
  assert.match(REGIONAL_FUNDING_MATRIX_BOUNDARY, /does not prove account approval/i);
  assert.match(REGIONAL_FUNDING_MATRIX_METHODOLOGY, /official regulator, payment-system or platform support pages/i);

  for (const row of rows) {
    assert.match(row.id, /^[a-z]{2,3}-/);
    assert.match(row.fiatCurrency, /^(BRL|MXN|USD|EUR|GBP|JPY|HKD|KRW|SGD|TRY)$/);
    assert.ok(row.paymentRails.length >= 3, row.market);
    assert.ok(row.accountScreenChecks.length >= 3, row.market);
    assert.ok(row.feeOrTimingChecks.length >= 2, row.market);
    assert.ok(row.officialSources.length >= 3, row.market);
    assert.ok(row.unknowns.length >= 2, row.market);
    assert.match(row.unknowns.join(" "), /Whether|Se |Si |Apakah|特定使用者/);
    assert.match(row.cannotPromise, /Does not prove|Does not prove one universal|不保證/);
    for (const source of row.officialSources) {
      assert.match(source.url, /^https:\/\//);
      assert.ok(source.label);
      assert.ok(source.role);
      assert.match(source.reviewedAt, /^2026-09-(08|14|15|28)$/);
    }
  }

  const mx = rows.find((row) => row.market === "MX");
  assert.match(mx.paymentRails.join(" "), /SPEI/);
  assert.match(mx.accountScreenChecks.join(" "), /CURP|Medá|SPEI/);
  assert.match(mx.feeOrTimingChecks.join(" "), /pending|official account screen/i);
  assert.match(mx.officialSources.map((source) => source.label).join(" "), /Banco de México|CNBV|Binance MXN/);

  const us = rows.find((row) => row.market === "US");
  assert.deepEqual(us.paymentRails, ["ACH", "wire transfer", "debit card", "on-chain crypto transfer"]);
  assert.match(us.accountScreenChecks.join(" "), /state|identity-verification|legal name|deposit and withdrawal|spot account funding|derivatives/i);
  assert.match(us.feeOrTimingChecks.join(" "), /state exclusions|ACH|wire|debit-card|derivatives collateral/i);
  assert.match(us.unknowns.join(" "), /bank-name|ACH|wire transfer|debit-card|state exclusions|spot trading|US futures|derivatives/i);
  assert.match(us.cannotPromise, /US state availability|ACH|wire|debit-card|on-chain transfer|spot trading|derivatives access/);
  assert.match(us.officialSources.map((source) => source.label).join(" "), /Coinbase North America|Coinbase US derivatives|Kraken US domestic funding|FinCEN/);
  assert.doesNotMatch(us.officialSources.map((source) => source.url).join(" "), /refer|affiliate|invite|signup/i);

  const jp = rows.find((row) => row.market === "JP");
  assert.match(jp.paymentRails.join(" "), /JPY|bank account|pending/);
  assert.match(jp.accountScreenChecks.join(" "), /FSA|bank account|JPY/);
  assert.match(jp.feeOrTimingChecks.join(" "), /pending|official account/i);
  assert.match(jp.officialSources.map((source) => source.label).join(" "), /Japan FSA|bitFlyer/);

  const hk = rows.find((row) => row.market === "HK");
  assert.match(hk.paymentRails.join(" "), /HKD|eDDA|鏈上/);
  assert.match(hk.accountScreenChecks.join(" "), /SFC|銀行驗證|本人銀行帳戶/);
  assert.match(hk.unknowns.join(" "), /HKD 銀行轉帳|eDDA|鏈上轉帳/);
  assert.match(hk.cannotPromise, /註冊歸因/);
  assert.match(hk.officialSources.map((source) => source.label).join(" "), /SFC licensed|HashKey|OSL/);

  const kr = rows.find((row) => row.market === "KR");
  assert.match(kr.paymentRails.join(" "), /KRW|real-name bank account/);
  assert.match(kr.accountScreenChecks.join(" "), /FSC|KOFIU|real-name/);
  assert.match(kr.unknowns.join(" "), /KRW funding|real-name bank-account/);
  assert.match(kr.officialSources.map((source) => source.label).join(" "), /FSC Korea|Korea Financial Intelligence Unit|Upbit/);

  const sg = rows.find((row) => row.market === "SG");
  assert.match(sg.paymentRails.join(" "), /SGD|PayNow|FAST|pending/);
  assert.match(sg.accountScreenChecks.join(" "), /MAS|identity|payment methods/);
  assert.match(sg.unknowns.join(" "), /PayNow|FAST|SGD funding/);
  assert.match(sg.officialSources.map((source) => source.label).join(" "), /MAS|Coinbase Singapore|Independent Reserve/);

  const tr = rows.find((row) => row.market === "TR");
  assert.match(tr.paymentRails.join(" "), /TRY|bank transfer/);
  assert.match(tr.accountScreenChecks.join(" "), /SPK|Bitget Teknoloji AŞ|identity|account-verification/);
  assert.match(tr.unknowns.join(" "), /TRY funding|bank-account|operation list and liquidation list/);
  assert.match(tr.cannotPromise, /provider status/);
  assert.match(tr.officialSources.map((source) => source.label).join(" "), /SPK|Paribu/);

  assert.doesNotMatch(JSON.stringify(rows), unsafePublicPattern);
});

test("regional funding public JSON and CSV match the module contract", async () => {
  const [jsonText, csvText] = await Promise.all([
    readFile(new URL("../public/research/regional-funding-verification-matrix.json", import.meta.url), "utf8"),
    readFile(new URL("../public/research/regional-funding-verification-matrix.csv", import.meta.url), "utf8"),
  ]);
  const payload = JSON.parse(jsonText);

  assert.equal(REGIONAL_FUNDING_MATRIX_PUBLIC_JSON, "/research/regional-funding-verification-matrix.json");
  assert.equal(REGIONAL_FUNDING_MATRIX_PUBLIC_CSV, "/research/regional-funding-verification-matrix.csv");
  assert.equal(payload.version, 3);
  assert.equal(payload.assetType, "regional-funding-verification-matrix");
  assert.equal(payload.reviewedAt, REGIONAL_FUNDING_MATRIX_REVIEWED_AT);
  assert.equal(payload.scope, REGIONAL_FUNDING_MATRIX_SCOPE);
  assert.equal(payload.boundary, REGIONAL_FUNDING_MATRIX_BOUNDARY);
  assert.equal(payload.methodology, REGIONAL_FUNDING_MATRIX_METHODOLOGY);
  assert.deepEqual(payload.rows.map((row) => row.market), REGIONAL_FUNDING_VERIFICATION_MATRIX.map((row) => row.market));
  assert.match(jsonText, /Banco Central do Brasil Pix FAQ/);
  assert.match(jsonText, /Banco de México SPEI information/);
  assert.match(jsonText, /https:\/\/www\.banxico\.org\.mx\/servicios\/spei_-informacion-banco-mex\.html/);
  assert.doesNotMatch(jsonText, /https:\/\/www\.banxico\.org\.mx\/servicios\/spei-informacion\.html/);
  assert.match(jsonText, /Coinbase North America payment-method verification/);
  assert.match(jsonText, /Kraken US domestic funding requirements/);
  assert.match(jsonText, /FinCEN MSB Registration Web site notice/);
  assert.match(jsonText, /US state availability/);
  assert.match(jsonText, /spot trading, derivatives access/);
  assert.match(jsonText, /ESMA databases and registers/);
  assert.match(jsonText, /FCA cryptoasset registration guidance/);
  assert.match(jsonText, /Japan FSA registered crypto-asset exchange providers/);
  assert.match(jsonText, /SFC licensed virtual asset trading platforms/);
  assert.match(jsonText, /Upbit Korea KRW deposit and withdrawal guidance/);
  assert.match(jsonText, /MAS Financial Institutions Directory/);
  assert.match(jsonText, /Paribu Turkish lira deposit guidance/);
  assert.match(jsonText, /Bitget Teknoloji AŞ/);
  assert.match(jsonText, /provider status/);
  assert.match(jsonText, /"unknowns"/);
  assert.doesNotMatch(jsonText, unsafePublicPattern);

  const csvLines = csvText.trim().split(/\r?\n/);
  assert.equal(csvLines.length, 13);
  assert.match(csvLines[0], /^id,market,marketName,locale,fiatCurrency,paymentRails,accountScreenChecks,feeOrTimingChecks,unknowns,officialSourceLabels,officialSourceRoles,officialSourceReviewedAt,officialSourceUrls/);
  assert.match(csvText, /br-brl-pix,BR/);
  assert.match(csvText, /mx-mxn-spei,MX/);
  assert.match(csvText, /tw-twd-personal-bank,TW/);
  assert.match(csvText, /id-idr-va-qris,ID,Indonesia,id,IDR/);
  assert.match(csvText, /us-usd-ach-wire-card,US/);
  assert.match(csvText, /eu-eur-sepa,EU/);
  assert.match(csvText, /uk-gbp-bank,UK/);
  assert.match(csvText, /jp-jpy-bank,JP/);
  assert.match(csvText, /hk-hkd-edda,HK/);
  assert.match(csvText, /kr-krw-real-name,KR/);
  assert.match(csvText, /sg-sgd-account,SG/);
  assert.match(csvText, /tr-try-bank,TR/);
  assert.match(csvText, /Bitget Teknoloji AŞ/);
  assert.match(csvText, /provider status/);
  assert.match(csvText, /Banco de México SPEI information/);
  assert.match(csvText, /https:\/\/www\.banxico\.org\.mx\/servicios\/spei_-informacion-banco-mex\.html/);
  assert.doesNotMatch(csvText, /https:\/\/www\.banxico\.org\.mx\/servicios\/spei-informacion\.html/);
  assert.match(csvText, /Coinbase North America payment-method verification/);
  assert.match(csvText, /Kraken US domestic funding requirements/);
  assert.match(csvText, /US state availability/);
  assert.match(csvText, /official-payment-system-reference/);
  assert.match(csvText, /2026-09-28/);
  assert.match(csvText, /2026-09-08/);
  assert.doesNotMatch(csvText, unsafePublicPattern);
});

test("regional funding summary exposes machine-readable coverage", () => {
  const summary = regionalFundingMatrixSummary(["US", "MX", "JP", "HK", "KR", "TR"]);
  assert.equal(summary.reviewedAt, REGIONAL_FUNDING_MATRIX_REVIEWED_AT);
  assert.deepEqual(summary.markets, ["MX", "US", "JP", "HK", "KR", "TR"]);
  assert.deepEqual(summary.currencies, ["MXN", "USD", "JPY", "HKD", "KRW", "TRY"]);
  assert.equal(summary.rows.length, 6);
});

test("regional funding matrix component is collapsed and compact by default", async () => {
  const [component, css] = await Promise.all([
    readFile(new URL("../src/components/v3/international/RegionalMarketPreview.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/v3/international/regional-market-preview.css", import.meta.url), "utf8"),
  ]);

  assert.match(component, /regional-funding-verification-matrix\.js/);
  assert.match(component, /data-regional-funding-matrix/);
  assert.match(component, /<details>/);
  assert.match(component, /Open JSON asset/);
  assert.match(component, /Open CSV asset/);
  assert.match(component, /\["BR", "MX", "EU", "UK", "JP"\]/);
  assert.match(component, /policy\.targetMarket === "OTHER" && <InternationalRouteCards/);
  assert.match(component, /<FundingVerificationMatrix market=\{policy\.targetMarket\} locale=\{locale\} \/>/);

  assert.match(css, /\.regional-market-preview__funding-matrix details\s*\{/);
  assert.match(css, /\.regional-market-preview__funding-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/s);
  assert.match(css, /@media \(max-width:\s*720px\)\s*\{[\s\S]*\.regional-market-preview__funding-grid\s*\{\s*grid-template-columns:\s*1fr;\s*\}/);
});
