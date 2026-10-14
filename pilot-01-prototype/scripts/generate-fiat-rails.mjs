#!/usr/bin/env node
// Builds src/data/fiat-rails.generated.js and src/data/fiat-rails-summary.generated.js from the official-source fiat
// research snapshot (rails.json + cards.json, researched 2026-10-15). Only records with available === true and at least
// one resolvable source become rows; unknown (null) facts stay out. Explicitly documented absences are kept separately.
// Fees and speeds are normalized into small codes the pages localize; anything that cannot be normalized faithfully is
// dropped (shown as nothing), never guessed.
//
// Inputs live in the repo (data/research/fiat-rails/, copied from the research run) so builds never read outside it.
// Usage: node scripts/generate-fiat-rails.mjs [--check] [researchDir]
//   --check  regenerate in memory and exit 1 if the committed generated files differ (tests/deposit-hub.test.mjs).
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const check = args.includes("--check");
const researchDir = args.find((arg) => !arg.startsWith("--")) || path.join(root, "data/research/fiat-rails");
const outputs = new Map();
const emit = (relative, body) => outputs.set(path.join(root, relative), body);
const rails = JSON.parse(readFileSync(path.join(researchDir, "rails.json"), "utf8"));
const cardsDoc = JSON.parse(readFileSync(path.join(researchDir, "cards.json"), "utf8"));

const SLUG = { Bitget: "bitget", OKX: "okx", Binance: "binance", Bybit: "bybit", "Gate.io": "gate-io", MEXC: "mexc", HTX: "htx", CoinW: "coinw", Kraken: "kraken", Backpack: "backpack", Coinbase: "coinbase" };
const COUNTRY = { "China mainland": "CN", "Hong Kong": "HK", Taiwan: "TW", Singapore: "SG", Malaysia: "MY", Indonesia: "ID", Philippines: "PH", Vietnam: "VN", Thailand: "TH", India: "IN", "Türkiye": "TR", Brazil: "BR", Argentina: "AR", Mexico: "MX", Nigeria: "NG", "EU/SEPA": "EU", UK: "GB", Japan: "JP", Korea: "KR", Russia: "RU" };

const sources = new Map([...rails.sources, ...cardsDoc.sources].map((s) => [s.id, s]));
const usedSources = new Set();
const useSources = (ids) => {
  const valid = (ids || []).filter((id) => sources.get(id)?.url?.startsWith("https://"));
  valid.forEach((id) => usedSources.add(id));
  return valid;
};

// ---- rail labels -------------------------------------------------------------------------------------------------
// Proper-noun rails keep their official name; generic descriptions ("Bank transfer") become null and the page shows the
// localized method label with the currency instead.
const RAIL_LABEL = {
  "Bank Transfer": null, "Bank transfer": null, "bank transfer to personal IBAN": "IBAN",
  "Bank transfer (Alias, CBU or CVU)": "CBU / CVU", "Bank transfer / Binance CVU": "CVU",
  "Faster Payments Service (FPS)": "FPS", "Faster Payments": "FPS", FPS: "FPS",
  "FAST / MEPS / International wire": "FAST / MEPS", "SWIFT via ZA Bank": "SWIFT · ZA Bank",
  "SEPA Standard / SEPA Instant": "SEPA / SEPA Instant", "SEPA / SEPA Instant": "SEPA / SEPA Instant", "SEPA Instant": "SEPA Instant", SEPA: "SEPA",
  PIX: "PIX", Pix: "PIX", "Pix / Bank transfer": "PIX", "PIX / Bank Transfer": "PIX", "PIX / TED": "PIX / TED",
  "Debit card": null, "3D Secure card": null, "Visa / Mastercard debit card": "Visa / Mastercard", "Visa/Mastercard": "Visa / Mastercard",
  "Visa / Mastercard / Apple Pay / Google Pay": "Visa / Mastercard / Apple Pay / Google Pay", "India-issued Mastercard": "Mastercard",
  "QR Code Payment": "QR", "Easy Bank Transfer": "Easy Bank Transfer", "Havale / EFT": "Havale / EFT", SPEI: "SPEI", SWIFT: "SWIFT",
  IMPS: "IMPS", NEFT: "NEFT", RTGS: "RTGS", UPI: "UPI", iDEAL: "iDEAL", BLIK: "BLIK", PayNow: "PayNow", "PayLah!": "PayLah!", FAST: "FAST",
  "Apple Pay": "Apple Pay", "Google Pay": "Google Pay",
};

function kindOf(row) {
  if (row.method === "p2p") return "p2p";
  if (["card_purchase", "apple_pay", "google_pay"].includes(row.method)) return "card";
  if (row.method === "e_wallet") return "ewallet";
  if (row.method === "qr_payment") return "qr";
  if (row.method === "bank_transfer") return "bank";
  return null;
}

// ---- fees ----------------------------------------------------------------------------------------------------------
// { t: "free" } | { t: "pct", v, approx?, tax? } | { t: "flat", v, cur, approx?, after? } | null
function feeOf(fee) {
  if (fee == null) return null;
  if (typeof fee === "string") {
    const s = fee.trim();
    if (/^free$/i.test(s)) return { t: "free" };
    let m = s.match(/^([\d.]+)%\s*IOF/i);
    if (m) return { t: "pct", v: Number(m[1]), tax: "IOF" };
    m = s.match(/^Approximately\s+([\d.]+)%/i);
    if (m) return { t: "pct", v: Number(m[1]), approx: true };
    m = s.match(/^([\d.]+)%$/);
    if (m) return { t: "pct", v: Number(m[1]) };
    m = s.match(/^([\d.]+)\s+([A-Z]{3})$/);
    if (m) return Number(m[1]) === 0 ? { t: "free" } : { t: "flat", v: Number(m[1]), cur: m[2] };
    return null; // "Rate shown on withdrawal page", "Estimated 2-5%"…
  }
  if (typeof fee.percent === "number") return { t: "pct", v: fee.percent };
  if (typeof fee.amount === "number") return fee.amount === 0 ? { t: "free" } : { t: "flat", v: fee.amount, cur: fee.currency };
  if (typeof fee.typical_amount === "number") return { t: "flat", v: fee.typical_amount, cur: fee.currency, approx: true };
  if (typeof fee.processing_usd === "number") return { t: "flat", v: fee.processing_usd, cur: "USD" };
  if (typeof fee.post_allowance_flat_usd === "number") return { t: "flat", v: fee.post_allowance_flat_usd, cur: "USD", after: true };
  for (const key of ["processing", "processing_fee", "exchange_fee", "coinbase_transfer_fee", "exchange_deposit_fee"]) {
    if (fee[key] === 0) return { t: "free" };
  }
  return null;
}

// ---- speeds --------------------------------------------------------------------------------------------------------
// Ordered rules; the first match wins. Conflicting official text (Binance FPS) maps to null.
const SPEED_RULES = [
  [/^Table: a few minutes/i, null],
  [/^PIX available 24\/7/i, "h24"],
  [/during banking hours|weekdays 09:00/i, "banking"],
  [/^Typically 1–5 business days/i, "bd1_5"],
  [/^3-4 business days/i, "bd3_4"],
  [/^0–3 business days|standard up to 3 business days/i, "bd0_3"],
  [/^Guide: 1–2 business days; fee page gives 1–3/i, "bd1_3"],
  [/^1-3 business days/i, "bd1_3"],
  [/^Instant: seconds; Standard: 1–2|^Instant to 2 business days|SEPA Instant within 2 hours; otherwise 0–2|^Within 2 business days/i, "bd0_2"],
  [/^Guide: 1–2 business days$|^Typically 1–2 business days|^1–2 business days/i, "bd1_2"],
  [/^0–1 business days/i, "bd0_1"],
  [/within 1 business day|^Up to 1 business day/i, "bd1"],
  [/~30 minutes; up to 2 hours/i, "m30_h2"],
  [/^Up to 2 hours/i, "h2"],
  [/^Up to 20 minutes/i, "m20"],
  [/^(Instant|Near-instant|Processed instantly|Within seconds|Expected within a few seconds|FAST usually instant)/i, "instant"],
];
function speedOf(text) {
  if (!text) return null;
  for (const [pattern, key] of SPEED_RULES) if (pattern.test(text)) return key;
  return null;
}

// ---- rows ----------------------------------------------------------------------------------------------------------
const rows = [];
const unknownSpeeds = new Set();
for (const row of rails.rails) {
  if (row.available !== true) continue;
  const kind = kindOf(row);
  if (!kind) continue; // wallet onramps are wallet products, not exchange rails
  const s = useSources(row.source_ids);
  if (!s.length) continue;
  const code = COUNTRY[row.country];
  const rail = Object.prototype.hasOwnProperty.call(RAIL_LABEL, row.rail || "") ? RAIL_LABEL[row.rail || ""] : (row.rail || null);
  if (row.rail && !Object.prototype.hasOwnProperty.call(RAIL_LABEL, row.rail)) throw new Error(`Unmapped rail label: ${row.rail}`);
  const sp = speedOf(row.speed);
  if (row.speed && sp === undefined) unknownSpeeds.add(row.speed);
  // Gate TR (gate.tr) is a separate Turkish entity: its TRY rails are not reachable through a gate.com account.
  const entity = row.exchange === "Gate.io" && s.every((id) => /\/\/(?:www\.)?gate\.tr\//.test(sources.get(id).url)) ? "gate-tr" : SLUG[row.exchange];
  const item = { x: entity, c: code, k: kind, d: row.direction, s };
  // A card purchase in another currency than the market's own (MEXC BRL card listed under Mexico) keeps the market but
  // drops the currency so no MXN claim is implied.
  if (row.currency && !(code === "MX" && row.currency === "BRL")) item.cur = row.currency;
  if (rail) item.r = rail;
  const fee = feeOf(row.fee);
  if (fee) item.f = fee;
  if (sp) item.t = sp;
  rows.push(item);
}

// Explicitly documented absences worth telling a reader (dated, sourced); the page names them without speculation.
const NEGATIVES = [
  { x: "binance", c: "NG", what: ["bank-deposit", "bank-withdrawal", "p2p"], since: "2024-03-05", s: ["binance-ngn"] },
  { x: "okx", c: "HK", what: ["all"], since: "2024-05-31", s: ["okx-16"] },
  { x: "bitget", c: "IN", what: ["visa"], s: ["bitget-9"] },
  { x: "mexc", c: "GB", what: ["card"], s: ["mexc-1"] },
  { x: "gate-tr", c: "TR", what: ["papara", "paycell"], s: ["gate-3"] },
  { x: "bitget", c: "TH", what: ["card", "onramp"], since: "2025-04-28", s: ["bitget-10"] },
].map((entry) => ({ ...entry, s: useSources(entry.s) })).filter((entry) => entry.s.length);

// ---- global card-purchase capability (venue profiles; never used as country eligibility) -----------------------------
const globalCard = {};
for (const g of rails.global_card_purchase) {
  if (!g.supported) continue;
  const s = useSources(g.source_ids);
  if (!s.length) continue;
  const entry = { s };
  if (Array.isArray(g.networks) && g.networks.length) entry.n = g.networks;
  if (g.apple_pay === true) entry.ap = true;
  if (g.google_pay === true) entry.gp = true;
  globalCard[SLUG[g.exchange]] = entry;
}

// ---- spending cards (curated from cards.json; every value below is copied from the cited record) ---------------------
// st: live | wallet (applications via the exchange's wallet) | existing (no new applications on the exchange)
// regions: ISO codes or EU/EEA/APAC program labels exactly as the record scopes them; null = not established.
// cb: { upTo } | { range: [a, b] } | { pct } with kind cashback|points|assetback.
// fees: [key, value] where value is a number (percent), "0" (none) or { flat, cur } / { pct, after } objects.
// apply: localized step keys.
const card = (name, exchange, fields) => {
  const record = cardsDoc.cards.find((item) => item.name === name);
  if (!record) throw new Error(`Card record missing: ${name}`);
  const s = useSources(record.source_ids);
  if (!s.length) throw new Error(`Card without source: ${name}`);
  return { id: fields.id, x: exchange, name: fields.label || name, net: fields.net, st: fields.st, regions: fields.regions ?? null, cb: fields.cb ?? null, fees: fields.fees || [], apply: fields.apply, s };
};
const CARDS = [
  card("Bitget Wallet Card (separate wallet product)", "bitget", { id: "bitget-wallet-card", label: "Bitget Wallet Card", net: "Visa / Mastercard", st: "wallet", cb: { upTo: 3, kind: "assetback" }, fees: [["annual", "0"], ["monthly", "0"]], apply: ["wallet_pay_card", "kyc", "approval"] }),
  card("Bitget Card (exchange account card)", "bitget", { id: "bitget-card", label: "Bitget Card", net: "Visa", st: "existing", fees: [["annual", "0"], ["issuance", "0"], ["tx", 0.9], ["fx", 1], ["atm", { flat: 0.65, cur: "USD", plusPct: 2 }]], apply: ["moved_wallet"] }),
  card("OKX Card (EEA)", "okx", { id: "okx-card-eea", label: "OKX Card", net: "Mastercard", st: "live", regions: ["EU", "NO"], fees: [["tx", 0], ["fx", 0], ["conversion", 0.1]], apply: ["app_card", "kyc", "stablecoin"] }),
  card("Binance Card - Global Program (Mexico)", "binance", { id: "binance-card-mx", label: "Binance Card", net: "Mastercard", st: "live", regions: ["MX"], cb: { range: [0.5, 2], kind: "cashback" }, fees: [["annual", "0"], ["issuance", "0"], ["fx", 2], ["conversion", 0.9], ["atm", { free: 2 }]], apply: ["residence_id", "app_card", "approval"] }),
  card("Bybit EU Card (distinct EU program)", "bybit", { id: "bybit-card-eu", label: "Bybit Card (EU)", net: "Mastercard", st: "live", regions: ["EU"], cb: { pct: 1, kind: "cashback" }, fees: [["annual", "0"], ["fx", 0.5], ["conversion", 0.9], ["atm", { pct: 2, after: true }]], apply: ["kyc", "poa_non_eea", "virtual_first", "approval"] }),
  card("Bybit Card (Brazil)", "bybit", { id: "bybit-card-br", label: "Bybit Card (Brazil)", net: "Mastercard", st: "live", regions: ["BR"], fees: [["fx", 1.5], ["conversion", 0.9], ["atm", { pct: 2, after: true }]], apply: ["app_bybit", "kyc", "virtual_first"] }),
  card("Bybit Card (Mexico)", "bybit", { id: "bybit-card-mx", label: "Bybit Card (Mexico)", net: "Mastercard", st: "live", regions: ["MX"], fees: [["fx", 2], ["conversion", 0.9], ["atm", { pct: 2, after: true }]], apply: ["app_bybit", "kyc", "virtual_first"] }),
  card("Bybit Card (Argentina)", "bybit", { id: "bybit-card-ar", label: "Bybit Card (Argentina)", net: "Mastercard", st: "live", regions: ["AR"], fees: [["fx", 7], ["conversion", 0.5], ["atm", { pct: 2, after: true }]], apply: ["app_bybit", "kyc", "virtual_first"] }),
  card("Bybit Card (Asia Pacific)", "bybit", { id: "bybit-card-apac", label: "Bybit Card (Asia Pacific)", net: "Visa", st: "live", regions: ["APAC"], fees: [["fx", 2], ["conversion", 0.9], ["atm", { pct: 2, after: true }]], apply: ["app_bybit", "kyc", "virtual_first"] }),
  card("Gate Card (Classic & Platinum)", "gate-io", { id: "gate-card", label: "Gate Card", net: "Visa", st: "live", cb: { upTo: 8, kind: "points" }, fees: [["annual", "0"], ["issuance", "0"], ["fx", 0.4], ["conversion", 0.9], ["atm", { pct: 2 }]], apply: ["gate_pay", "kyc_l2", "approval"] }),
  card("MEXC Global Card", "mexc", { id: "mexc-global-card", label: "MEXC Global Card", net: "Visa", st: "live", cb: { upTo: 10, kind: "cashback" }, fees: [["annual", "0"], ["issuance", "0"], ["tx", 1], ["conversion", 0], ["fx", 0]], apply: ["kyc_adv", "poa", "web_card"] }),
  card("MEXC Card (APAC)", "mexc", { id: "mexc-card-apac", label: "MEXC Card (APAC)", net: "Visa", st: "live", regions: ["TW", "PH", "TH", "VN"], cb: { upTo: 10, kind: "cashback" }, fees: [["annual", "0"], ["issuance", "0"], ["tx", 0], ["fx", 1]], apply: ["kyc_adv", "web_card"] }),
  card("Kraken Debit Card / Krak Card", "kraken", { id: "kraken-card", label: "Kraken Card", net: "Mastercard", st: "live", regions: ["GB", "EU"], cb: { range: [0, 2], kind: "cashback" }, fees: [["annual", "0"], ["monthly", "0"], ["tx", 0], ["fx", 0]], apply: ["app_card", "kyc"] }),
  card("CoinW Card (virtual and physical product family)", "coinw", { id: "coinw-card", label: "CoinW Card", net: "Visa / Mastercard", st: "live", fees: [["monthly", "0"]], apply: ["app_card", "kyc"] }),
  card("Coinbase Card (EU/UK debit)", "coinbase", { id: "coinbase-card", label: "Coinbase Card", net: "Visa", st: "live", regions: ["EU", "GB"], fees: [["tx", 0]], apply: ["app_card", "kyc", "residence"] }),
];

// Mainland China: regulatory context only (official notice), no exchange recommendation.
const cn = rails.regulatory_context.find((item) => item.market === "China mainland");
const CN_NOTICE = cn ? { doc: cn.document, published: cn.published_at, checked: cn.accessed_at, url: cn.url } : null;
const cnExcluded = [...new Set(rails.rails.filter((row) => row.country === "China mainland" && row.available === false).map((row) => SLUG[row.exchange]))];

const SOURCES = Object.fromEntries([...usedSources].sort().map((id) => {
  const src = sources.get(id);
  // 5th field: the exchange that owns the page (exchange pages are cited through a code-carrying route or as plain text).
  return [id, [src.url, src.title || "", src.accessed_at || rails.researched_at, src.published_at || null, src.exchange ? SLUG[src.exchange] || src.exchange : null]];
}));

const header = `// Generated by scripts/generate-fiat-rails.mjs from the official-source fiat research (${rails.researched_at}). Do not edit.\n`;
const body = `${header}export const FIAT_CHECKED = ${JSON.stringify(rails.researched_at)};
export const FIAT_SOURCES = ${JSON.stringify(SOURCES)};
export const FIAT_ROWS = ${JSON.stringify(rows)};
export const FIAT_NEGATIVES = ${JSON.stringify(NEGATIVES)};
export const FIAT_GLOBAL_CARD = ${JSON.stringify(globalCard)};
export const CRYPTO_CARDS = ${JSON.stringify(CARDS)};
export const CN_NOTICE = ${JSON.stringify(CN_NOTICE)};
export const CN_EXCLUDED = ${JSON.stringify(cnExcluded)};
`;
emit("src/data/fiat-rails.generated.js", body);

// Per-exchange summary for the directory badges and the venue profile block (small; no sources table). Countries whose
// partner terms restrict the exchange are left out, like on the country pages.
const { PARTNER_RESTRICTED_COUNTRIES } = await import(path.join(root, "src/data/partner-geo-policy.generated.js"));
const summary = {};
for (const row of rows) {
  if ((PARTNER_RESTRICTED_COUNTRIES[row.x] || []).includes(row.c)) continue;
  const entry = summary[row.x] ||= { k: [], c: [], r: [] };
  const filterKind = row.k === "p2p" ? "p2p" : row.k === "card" ? "card" : "bank";
  if (!entry.k.includes(filterKind)) entry.k.push(filterKind);
  if (!entry.c.includes(row.c)) entry.c.push(row.c);
  if (row.r && row.k !== "card" && !entry.r.includes(row.r)) entry.r.push(row.r);
}
for (const [slug, g] of Object.entries(globalCard)) {
  const entry = summary[slug] ||= { k: [], c: [], r: [] };
  if (!entry.k.includes("card")) entry.k.push("card");
  if (g.n) entry.n = g.n;
}
for (const item of CARDS) {
  const entry = summary[item.x] ||= { k: [], c: [], r: [] };
  if (!entry.k.includes("cryptoCard")) entry.k.push("cryptoCard");
  (entry.cards ||= []).push(item.name);
}
emit("src/data/fiat-rails-summary.generated.js", `${header}export const FIAT_SUMMARY_CHECKED = ${JSON.stringify(rails.researched_at)};\nexport const FIAT_SUMMARY = ${JSON.stringify(summary)};\n`);
if (check) {
  const stale = [...outputs].filter(([file, text]) => { try { return readFileSync(file, "utf8") !== text; } catch { return true; } }).map(([file]) => path.relative(root, file));
  if (stale.length) { console.error(`fiat rails: generated files differ from data/research/fiat-rails inputs: ${stale.join(", ")}`); process.exit(1); }
  console.log("fiat rails: generated files match the research inputs");
  process.exit(0);
}
for (const [file, text] of outputs) writeFileSync(file, text);
console.log(`fiat rails: ${rows.length} rows, ${NEGATIVES.length} negatives, ${CARDS.length} cards, ${usedSources.size} sources`);
