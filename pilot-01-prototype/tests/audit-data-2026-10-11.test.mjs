// External audit 2026-10-11 (NX-01, NX-02, NX-03, NX-06, NX-08, 5.4): one fee formatter, one partner benefit record,
// labelled cost bases, scenario URLs that survive home → /rates → venue, honest factbook dates and no internal
// editorial notes in public modules.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { formatFee, formatFeeRate, formatFeeNumber, formatFeeParts, feeDecimals, costFromDisplayedFee } from "../src/data/format-fee.js";
import { EXCHANGE_FACTS, feeFact, feePct, feeDisplay, venueCheckedOn } from "../src/data/exchange-facts.js";
import { HOME_REBATE_SHARE, HOME_PARTNERS } from "../src/data/home-rebate-tiers.js";
import { partnerBenefitStatus, partnerRebateShare, partnerBenefitCopy, PARTNER_TERMS_CONFIRMED_ON } from "../src/data/partner-benefit-status.js";
import { ownerRebateLine, partnerBenefitParts } from "../src/data/owner-rebate-line.js";
import { appendCostScenarioQuery, buildDecisionReturnHref, readDecisionReturnState } from "../src/data/decision-return.js";
import { costBasisCopy } from "../src/data/cost-decision-copy.js";
import { factbookDates, factbookDatesCopy, FACTBOOK_DOSSIER_COMPILED_ON } from "../src/data/factbook-dates.js";
import { AUDIT_DATE, FACTBOOK_REGISTRY } from "../src/data/factbook-registry.js";
import { buildFactbookSchemas, computeRouteSeo } from "../src/data/seo-injection.js";
import { H7_COPY } from "../src/components/v7/home7-copy.js";
import { matrixCopy } from "../src/components/v3/exchange-matrix-copy.js";

const LOCALES = ["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar"];
const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

async function ssr(body) {
  const dir = await mkdtemp(path.join(projectRoot, "tests/.tmp-audit-data-"));
  try {
    const entry = path.join(dir, "entry.jsx");
    const bundle = path.join(dir, "bundle.cjs");
    await writeFile(entry, `import React from "react";\nimport { renderToStaticMarkup } from "react-dom/server";\n${body}`);
    const esbuild = path.join(projectRoot, "node_modules/.bin/esbuild");
    await access(esbuild);
    execFileSync(esbuild, [entry, "--bundle", "--platform=node", "--format=cjs", `--outfile=${bundle}`, "--loader:.css=empty", "--loader:.png=empty", "--loader:.svg=empty", "--define:import.meta.env.SSR=true", "--log-level=error"], { cwd: projectRoot, stdio: "pipe" });
    return JSON.parse(execFileSync("node", [bundle], { cwd: projectRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
const text = (html) => String(html).replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, " ");

// ---------- NX-01: one formatter, exact precision ----------
test("NX-01 formatter keeps the reviewed precision (max 3 decimals) and aligns two-decimal figures", () => {
  assert.equal(formatFee(0.055), "0.055%");
  assert.equal(formatFee(0.015), "0.015%");
  assert.equal(formatFee(0.045), "0.045%");
  assert.equal(formatFee(0.1), "0.10%");
  assert.equal(formatFee(0.02), "0.02%");
  assert.equal(formatFee(0.0375), "0.038%", "derived figures round half-up on the decimal value");
  assert.equal(formatFeeRate(0.00055), "0.055%");
  assert.equal(feeDecimals(0.06), 2);
  assert.equal(formatFee(null), null);
  assert.equal(formatFee(Number.NaN), null);
});

test("NX-01 formatter is locale-aware via Intl (fr/de/es/ru '0,055 %', tr '%0,055', ar keeps Latin digits)", () => {
  const nb = (s) => s.replace(/[  ]/g, " ").replace(/‎/g, "");
  assert.equal(nb(formatFee(0.055, "fr")), "0,055 %");
  assert.equal(nb(formatFee(0.055, "de")), "0,055 %");
  assert.equal(nb(formatFee(0.055, "es")), "0,055 %");
  assert.equal(nb(formatFee(0.055, "ru")), "0,055 %");
  assert.equal(formatFee(0.055, "tr"), "%0,055");
  assert.equal(formatFee(0.055, "pt-BR"), "0,055%");
  assert.equal(formatFee(0.1, "it"), "0,10%");
  assert.equal(formatFee(0.055, "ja"), "0.055%");
  assert.equal(nb(formatFee(0.055, "ar")), "0.055%");
  assert.equal(formatFeeNumber(0.055, "fr"), "0,055");
  for (const locale of LOCALES) {
    const p = formatFeeParts(0.055, locale);
    assert.equal(p.prefix + p.number + p.suffix, formatFee(0.055, locale), locale);
    assert.match(p.number, /^0[.,]055$/, locale);
  }
});

test("NX-01 exchange-facts formatters delegate to the shared formatter (English output unchanged)", () => {
  for (const [slug, f] of Object.entries(EXCHANGE_FACTS)) for (const p of ["spot", "perp"]) {
    const x = f.fields[p];
    if (x.state !== "checked") continue;
    assert.equal(feePct(x.maker), formatFee(x.maker), `${slug} ${p}`);
    assert.equal(feeDisplay(slug, p), `${formatFee(x.maker)} / ${formatFee(x.taker)}`);
    assert.equal(feeDisplay(slug, p, "fr"), `${formatFee(x.maker, "fr")} / ${formatFee(x.taker, "fr")}`);
  }
  assert.equal(feeDisplay("bybit", "perp"), "0.02% / 0.055%");
  assert.equal(feeDisplay("hyperliquid", "perp"), "0.015% / 0.045%");
});

test("NX-01 every displayed fee times the scenario volume reproduces the displayed cost", () => {
  const yearly = 100000 * 12;
  for (const slug of HOME_PARTNERS) for (const p of ["spot", "perp"]) {
    const f = feeFact(slug, p);
    if (f.state !== "checked") continue;
    for (const v of [f.maker, f.taker]) {
      const shown = Number(formatFee(v).replace("%", ""));
      assert.equal(Math.round(yearly * shown / 100), Math.round(yearly * v / 100), `${slug} ${p} ${v}: ${formatFee(v)}`);
      assert.equal(costFromDisplayedFee(yearly, v), yearly * shown / 100);
    }
  }
  assert.equal(costFromDisplayedFee(1200000, 0.055), 660);
  assert.equal(costFromDisplayedFee(1200000, 0.045), 540);
  assert.equal(costFromDisplayedFee(1200000, 0.015), 180);
});

test("NX-01 no fee call site rounds to two fixed decimals or prints its own percent", async () => {
  const files = ["src/components/v7/home7-below.jsx", "src/components/v3/ExchangeMatrix.jsx", "src/components/v3/LeanHero.jsx", "src/components/v3/TradingBleedAnalyzer.jsx"];
  for (const file of files) {
    const src = await readFile(path.join(projectRoot, file), "utf8");
    assert.doesNotMatch(src, /formatPercent\(locale, r\.(maker|taker), \{ fractionDigits: 2 \}\)/, file);
    assert.doesNotMatch(src, /toFixed\(3\)/, file);
    assert.match(src, /format-fee\.js/, `${file} uses the shared formatter`);
  }
  const og = await readFile(path.join(projectRoot, "server/og-image.mjs"), "utf8");
  assert.match(og, /feeDisplay\(slug, "spot", locale\)/);
});

test("NX-01 home calculator rows print the exact rate next to a reproducible yearly figure", async () => {
  const out = await ssr(`
    import { HomeBelowFold } from "../../src/components/v7/home7-below.jsx";
    import { h7Copy } from "../../src/components/v7/home7-copy.js";
    import { feeFact } from "../../src/data/exchange-facts.js";
    import { partnerRebateShare } from "../../src/data/partner-benefit-status.js";
    const vol = 100000;
    const rows = ["okx", "bybit", "hyperliquid"].map((slug) => {
      const f = feeFact(slug, "perp"); const share = partnerRebateShare(slug);
      const gross = vol * 12 * f.taker / 100; const net = gross * (1 - (share || 0));
      return { slug, name: slug, maker: f.maker, taker: f.taker, share, gross, net, save: gross - net, code: null, url: "https://example.invalid", open: false };
    });
    const calc = { rows, best: rows[0], most: rows[0], maxGross: 1 };
    const html = renderToStaticMarkup(React.createElement(HomeBelowFold, { t: h7Copy("en"), locale: "en", vol, setVol() {}, mode: "taker", setMode() {}, product: "perp", setProduct() {}, calc, priced: [] }));
    const fr = renderToStaticMarkup(React.createElement(HomeBelowFold, { t: h7Copy("fr"), locale: "fr", vol, setVol() {}, mode: "taker", setMode() {}, product: "perp", setProduct() {}, calc, priced: [] }));
    console.log(JSON.stringify({ html, fr }));
  `);
  const t = text(out.html);
  assert.match(t, /0\.02% \/ 0\.055%/);
  assert.match(t, /0\.015% \/ 0\.045%/);
  assert.match(t, /\$660/);
  assert.match(t, /\$540/);
  assert.doesNotMatch(t, /0\.06%|0\.04%|0\.01% /);
  assert.match(t, /per year · base fees/);
  assert.match(t, /per year · after max rebate/);
  assert.match(out.html, /href="\/rates#cost-scenario\?(?=[^"]*scenario=cost)(?=[^"]*volume=100000)(?=[^"]*basis=rebate)[^"]*"/);
  assert.match(text(out.fr), /0,02\s%\s\/\s0,055\s%/u);
});

// ---------- NX-02: one partner benefit record ----------
test("NX-02 partner benefit status is derived from home-rebate-tiers (no new numbers)", () => {
  assert.equal(PARTNER_TERMS_CONFIRMED_ON, "2026-10-10");
  for (const [slug, share] of Object.entries(HOME_REBATE_SHARE)) {
    const s = partnerBenefitStatus(slug);
    if (!share) { assert.equal(s, null, slug); continue; }
    assert.equal(s.share, share);
    assert.equal(partnerRebateShare(slug), share);
    assert.deepEqual([...s.accountChecks], ["product-scope", "region", "account-tier", "promotion-stacking"]);
  }
  assert.equal(partnerBenefitStatus("okx").sharePct, 40);
  assert.equal(partnerBenefitStatus("bitget").sharePct, 60);
  assert.equal(partnerBenefitStatus("binance").sharePct, 25);
  for (const slug of ["bybit", "kraken", "hyperliquid", "gate-io"]) assert.equal(partnerBenefitStatus(slug), null, slug);
});

test("NX-02 benefit wording exists in all 15 locales and the factbook line matches the audit wording", () => {
  for (const locale of LOCALES) {
    const c = partnerBenefitCopy(locale);
    assert.ok(c.label && c.confirmed.includes("{date}") && c.account && c.checks, locale);
    const parts = partnerBenefitParts("okx", locale);
    assert.ok(!/undefined|\{/.test(parts.line), `${locale}: ${parts.line}`);
    if (locale !== "en") assert.notEqual(c.label, partnerBenefitCopy("en").label, `${locale} is translated`);
  }
  assert.equal(partnerBenefitParts("okx", "en").line, "Partner rebate share: Up to 40% — partner terms confirmed 2026-10-10; your account's eligibility is confirmed by the exchange after sign-up");
  assert.equal(partnerBenefitParts("kraken", "en"), null);
  assert.match(ownerRebateLine("okx", "en", "OKX"), /40%.*hourly/);
});

test("NX-02 home, factbook, registration card, /rates and the OG card read the single record", async () => {
  const reads = {
    "src/components/v7/HomeV7.jsx": /HOME_REBATE_SHARE\[slug\]/,
    "src/components/v3/FactbookPage.jsx": /partnerBenefitParts\(venue\.slug, locale\)/,
    "src/components/v3/RegistrationCard.jsx": /partnerBenefitParts\(publicCta\.slug, locale\)/,
    "src/components/v3/CostDecision.jsx": /partnerRebateShare\(slug\)/,
    "src/components/v3/FeeBenchmarkTerminal.jsx": /partnerBenefitStatus\(slug\)/,
    "src/data/owner-rebate-line.js": /partnerBenefitStatus\(slug\)/,
    "server/og-image.mjs": /partnerRebateShare\(slug\)/,
  };
  for (const [file, re] of Object.entries(reads)) assert.match(await readFile(path.join(projectRoot, file), "utf8"), re, file);
  const generator = await readFile(path.join(projectRoot, "scripts/generate-home-rebate-runtime.mjs"), "utf8");
  assert.match(generator, /home-rebate-tiers\.js/);
});

test("NX-02 /factbook/okx states the partner share with its basis instead of a bare pending; non-partners stay pending", async () => {
  const out = await ssr(`
    import { FactbookPage } from "../../src/components/v3/FactbookPage.jsx";
    const okx = renderToStaticMarkup(React.createElement(FactbookPage, { slug: "okx", locale: "en" }));
    const kraken = renderToStaticMarkup(React.createElement(FactbookPage, { slug: "kraken", locale: "en" }));
    const de = renderToStaticMarkup(React.createElement(FactbookPage, { slug: "okx", locale: "de" }));
    console.log(JSON.stringify({ okx, kraken, de }));
  `);
  const okx = text(out.okx);
  assert.match(okx, /Partner rebate share Up to 40% — partner terms confirmed 2026-10-10; your account's eligibility is confirmed by the exchange after sign-up/);
  assert.doesNotMatch(okx, /User benefit status pending/i);
  assert.match(okx, /product scope, region, account tier and stacking with exchange promotions/);
  assert.doesNotMatch(out.okx, /data-disclosure-placement=/, "owner rule 2026-10-12: no commission disclosure beside the activation CTA");
  assert.match(text(out.kraken), /User benefit status pending/i);
  assert.match(text(out.de), /Partner-Rückvergütungsanteil/);
  // NX-06 visible dates
  assert.match(okx, /Fees checked 2026-10-10 Benefit terms confirmed 2026-10-10 Source dossier compiled 2026-09-08/);
  assert.match(text(out.kraken), /Benefit terms confirmed Not yet/);
});

// ---------- NX-03: labelled bases, shared URL params ----------
test("NX-03 cost basis labels exist in 15 locales on home and /rates", () => {
  for (const locale of LOCALES) {
    const h = H7_COPY[locale] || H7_COPY.en;
    assert.ok(h.basisBase && h.basisNet && h.ratesGo, `home ${locale}`);
    if (locale !== "en") assert.notEqual(h.basisNet, H7_COPY.en.basisNet, `home ${locale} translated`);
    const b = costBasisCopy(locale);
    for (const k of ["group", "base", "rebate", "perMonthBase", "perMonthRebate", "noShare", "method"]) assert.ok(b[k], `${locale} ${k}`);
    if (locale !== "en") assert.notEqual(b.perMonthRebate, costBasisCopy("en").perMonthRebate, `rates ${locale} translated`);
  }
});

test("NX-03 /rates shows base and after-rebate figures with the home formula and labels each figure", async () => {
  const out = await ssr(`
    import { CostDecision } from "../../src/components/v3/CostDecision.jsx";
    console.log(JSON.stringify({ html: renderToStaticMarkup(React.createElement(CostDecision, { locale: "en", product: "perpetuals" })) }));
  `);
  const t = text(out.html);
  // 100,000 USDT/month, perp taker: OKX 50 base → 30 after 40%; Bitget 60 → 24; Binance 50 → 37.5; Bybit 55 (no record).
  assert.match(t, /OKX 50 USDT\/mo per month · base fees/);
  assert.match(t, /per month · after max rebate: 30 USDT/);
  assert.match(t, /per month · after max rebate: 24 USDT/);
  assert.match(t, /per month · after max rebate: 37\.5 USDT/);
  assert.match(t, /Bybit 55 USDT\/mo per month · base fees/);
  assert.match(t, /Cost basis Base fees After max rebate/);
  assert.match(t, /0\.055%/);
});

test("NX-03 same inputs give the same ranking on home (per year) and /rates (per month, after max rebate)", () => {
  const vol = 100000;
  const venues = ["binance", "okx", "bybit", "bitget"];
  const home = venues.map((s) => ({ s, v: vol * 12 * feeFact(s, "perp").taker / 100 * (1 - (partnerRebateShare(s) || 0)) })).sort((a, b) => a.v - b.v).map((x) => x.s);
  const rates = venues.map((s) => ({ s, v: vol * feeFact(s, "perp").taker / 100 * (1 - (partnerRebateShare(s) || 0)) })).sort((a, b) => a.v - b.v).map((x) => x.s);
  assert.deepEqual(rates, home);
  assert.equal(home[0], "bitget");
});

test("NX-03 scenario params round-trip home → /rates → venue/compare", async () => {
  const homeHref = buildDecisionReturnHref({ kind: "cost", locale: "en", instrument: "futures", order: "taker", volume: 100000, basis: "rebate" });
  assert.match(homeHref, /^\/rates#cost-scenario\?/);
  const homeHash = `#${homeHref.split("#")[1]}`;
  const { restored } = await ssr(`
    import { restoreCostDecisionState } from "../../src/components/v3/CostDecision.jsx";
    console.log(JSON.stringify({ restored: restoreCostDecisionState("", ${JSON.stringify(homeHash)}) }));
  `);
  assert.deepEqual(restored, { volume: "100000", market: "futuresFee", order: "takerRate", basis: "rebate" });
  const venueHref = appendCostScenarioQuery("/exchanges/okx?product=perpetuals#registration-path", { instrument: "futures", order: "taker", volume: 100000, basis: "rebate" });
  assert.match(venueHref, /#registration-path\?/);
  const venueHash = `#${venueHref.split("#")[1]}`;
  const state = readDecisionReturnState("", venueHash);
  assert.equal(state.instrument, "futures");
  assert.equal(state.order, "taker");
  assert.equal(state.volume, 100000);
  assert.equal(state.basis, "rebate");
  assert.equal(new URLSearchParams(venueHash.split("?")[1]).get("product"), "perpetuals");
  const compareHref = appendCostScenarioQuery("/compare/bybit-vs-bitget", { instrument: "spot", order: "maker", volume: 5000, basis: "base" });
  const cmp = readDecisionReturnState("", `#${compareHref.split("#")[1]}`);
  assert.deepEqual([cmp.kind, cmp.product, cmp.instrument, cmp.order, cmp.volume, cmp.basis], ["cost", "spot", "spot", "maker", 5000, "base"]);
  assert.equal(readDecisionReturnState("scenario=cost&instrument=spot&order=maker&volume=10&basis=evil").basis, undefined);
});

// ---------- NX-06: factbook dates ----------
test("NX-06 factbook dates are layered and dateModified is the latest real review date", () => {
  assert.equal(AUDIT_DATE, FACTBOOK_DOSSIER_COMPILED_ON);
  const okx = factbookDates("okx");
  assert.deepEqual(okx, { feesCheckedOn: venueCheckedOn("okx"), benefitConfirmedOn: "2026-10-10", dossierCompiledOn: "2026-09-08", latestReviewOn: "2026-10-10" });
  const today = new Date().toISOString().slice(0, 10);
  for (const slug of Object.keys(FACTBOOK_REGISTRY)) {
    const d = factbookDates(slug);
    const real = [d.feesCheckedOn, d.benefitConfirmedOn, d.dossierCompiledOn].filter(Boolean).sort().at(-1);
    assert.equal(d.latestReviewOn, real, slug);
    if (today > "2026-10-10") assert.notEqual(d.latestReviewOn, today, `${slug} must not be dated today mechanically`);
    const schema = buildFactbookSchemas(FACTBOOK_REGISTRY[slug], "en").find((s) => s["@type"] === "Dataset");
    assert.equal(schema.dateModified, d.latestReviewOn, slug);
  }
  for (const locale of LOCALES) assert.ok(Object.values(factbookDatesCopy(locale)).every(Boolean), locale);
});

test("NX-06 factbook <title> carries no bracketed stale date", () => {
  const seo = computeRouteSeo({ url: "/factbook/okx" });
  assert.equal(seo.title, "OKX Source Review Factbook — NexuAlpha");
  assert.doesNotMatch(seo.title, /\[\d{4}-\d\d-\d\d\]/);
  assert.equal(seo.schemas.find((s) => s["@type"] === "Dataset").dateModified, "2026-10-10");
});

// ---------- NX-08: public modules carry no internal notes ----------
const BANNED = /publish (this|the) board|before publishing|connect a verified feed|canonical|\bTODO:|internal note|keyword|no commercial code|候选包|接入经过验证|接入验证源后再发布|NexuAlpha priority/i;

test("NX-08 home research modules render without editorial/dev instructions in every locale", async () => {
  const out = await ssr(`
    import { CampaignRadar } from "../../src/components/v3/CampaignRadar.jsx";
    import { OnChainLiquidityBoard } from "../../src/components/v3/OnChainLiquidityBoard.jsx";
    import { MarketFearGreedPanel } from "../../src/components/v3/MarketFearGreedPanel.jsx";
    import { TelegramBotHub } from "../../src/components/v3/TelegramBotHub.jsx";
    const locales = ${JSON.stringify(LOCALES)};
    const res = {};
    for (const locale of locales) res[locale] = [CampaignRadar, OnChainLiquidityBoard, MarketFearGreedPanel, TelegramBotHub].map((C) => renderToStaticMarkup(React.createElement(C, { locale }))).join("\\n");
    console.log(JSON.stringify(res));
  `);
  for (const [locale, html] of Object.entries(out)) {
    const t = text(html);
    const hit = t.match(BANNED); assert.equal(hit, null, `${locale}: …${hit ? t.slice(Math.max(0, hit.index - 120), hit.index + 80) : ""}…`);
    const topics = html.match(/<ul class="tg-public-topics__list">([\s\S]*?)<\/ul>/);
    if (topics) assert.ok((topics[1].match(/<li/g) || []).length <= 4, `${locale}: at most 4 related links`);
  }
  assert.match(text(out.en), /This research panel does not include referral codes; the sign-up cards on this site do\./);
  // SEO audit 2026-10-11 #6 (owner-approved): an unverified welcome benefit renders nothing (was "Welcome campaign
  // status: Pending official-source review" on every card); the radar subtitle carries the account-level caveat.
  assert.match(text(out.en), /Official Exchange Campaigns & Welcome Packs/);
  assert.doesNotMatch(text(out.en), /Pending official-source review/);
});

test("NX-08 the partner/commercial copy sources contain none of the banned internal phrases", async () => {
  for (const file of ["src/data/official-campaign-localizations.js", "src/data/official-campaign-research.js", "src/components/v3/MarketFearGreedPanel.jsx", "src/components/v3/OnChainLiquidityBoard.jsx"]) {
    const src = await readFile(path.join(projectRoot, file), "utf8");
    assert.doesNotMatch(src, /no commercial code|Publish this board|Connect a verified feed before publishing|候选包/, file);
  }
});

// ---------- 5.4: what "Verified first" verifies ----------
test("5.4 the Verified first toggle explains what is verified in 15 locales", async () => {
  for (const locale of LOCALES) {
    const c = matrixCopy(locale);
    assert.ok(c.verifiedHint, locale);
    if (locale !== "en") assert.notEqual(c.verifiedHint, matrixCopy("en").verifiedHint, locale);
  }
  const src = await readFile(path.join(projectRoot, "src/components/v3/ExchangeMatrix.jsx"), "utf8");
  assert.match(src, /title=\{mc\.verifiedHint\} aria-describedby="mx-verified-legend"/);
  assert.match(src, /<p className="mx-legend" id="mx-verified-legend">\{mc\.verifiedHint\}<\/p>/);
  assert.match(src, /const isChecked = \(r\) => Boolean\(r\.spot \|\| r\.perp\);/, "sorting unchanged");
});
