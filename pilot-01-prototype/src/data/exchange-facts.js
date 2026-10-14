// The ONE source for public fee facts: every surface (directory, /rates, /compare/*, /factbook/*,
// /exchanges/{slug}, home hero, compare lab) reads fees, status and check dates from here.
// Raw data: RAW below is docs/data/exchange-facts-20261010.json verbatim (official fee pages fetched
// 2026-10-08, re-verified and extended 2026-10-10); update both together. Percent units. A null stays null and renders as "Not yet checked":
// never estimate, never fall back to another file.
//
// Publishing rules (keyed by venue + field + date):
// - a figure is "checked" only when the venue status is "verified" and the field's note does not ask
//   for a re-check; its date is that venue's verified_on;
// - a figure flagged "re-check" in the JSON is held back (state "recheck") and published as null;
// - a token discount is published for a product only when that product's base fee is checked.
import { formatFee, formatFeePair, formatFeeRate } from "./format-fee.js";

const raw = {
 "as_of": "2026-10-10",
 "units": "percent",
 "exchanges": [
  {
   "slug": "binance",
   "name": "Binance",
   "type": "cex",
   "fees": {
    "spot": {
     "maker": 0.1,
     "taker": 0.1,
     "note": "Regular User, Maker/Taker 0.100%/0.100%. Official fee page (binance.com/en/fee/trading), read 2026-10-10."
    },
    "perp": {
     "maker": 0.02,
     "taker": 0.05,
     "note": "Regular User, USDⓈ-M USDT perpetuals Maker/Taker 0.0200%/0.0500%. Official futures fee page (binance.com/en/fee/futureFee), read 2026-10-10."
    }
   },
   "discount": {
    "token": "BNB",
    "spot_pct": 25,
    "perp_pct": 10,
    "note": "Official fee pages: BNB 25% off spot, 10% off USDⓈ-M futures."
   },
   "kyc": null,
   "restricted_regions": [],
   "source_urls": [
    "https://www.binance.com/en/fee/schedule",
    "https://www.binance.com/en/support/faq/detail/360033544231",
    "https://www.binance.com/en/fee/trading",
    "https://www.binance.com/en/fee/futureFee"
   ],
   "verified_on": "2026-10-10",
   "status": "verified"
  },
  {
   "slug": "okx",
   "name": "OKX",
   "type": "cex",
   "fees": {
    "spot": {
     "maker": 0.08,
     "taker": 0.1,
     "note": "Regular user, Spot standard pairs. Official fee page okx.com/fees, re-read 2026-10-10."
    },
    "perp": {
     "maker": 0.02,
     "taker": 0.05,
     "note": "Regular user, Futures tab (USDT-margined). Public endpoint used by okx.com/fees, re-read 2026-10-10."
    }
   },
   "discount": {},
   "kyc": null,
   "restricted_regions": [],
   "source_urls": [
    "https://www.okx.com/fees"
   ],
   "verified_on": "2026-10-10",
   "status": "verified"
  },
  {
   "slug": "bybit",
   "name": "Bybit",
   "type": "cex",
   "fees": {
    "spot": {
     "maker": 0.1,
     "taker": 0.1,
     "note": "VIP 0, Spot crypto-crypto. Official Trading Fee Structure article (updated 2026-09-02), re-read 2026-10-10."
    },
    "perp": {
     "maker": 0.02,
     "taker": 0.055,
     "note": "VIP 0, Perpetual & Futures. Same official article, re-read 2026-10-10."
    }
   },
   "discount": {
    "token": "MNT",
    "note": "Page references paying fees in MNT but states no percentage; value null"
   },
   "kyc": null,
   "restricted_regions": [],
   "source_urls": [
    "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure"
   ],
   "verified_on": "2026-10-10",
   "status": "verified"
  },
  {
   "slug": "bitget",
   "name": "Bitget",
   "type": "cex",
   "fees": {
    "spot": {
     "maker": 0.1,
     "taker": 0.1,
     "note": "VIP 0 spot. Data source of bitget.com/fee (VIP rules config), re-read 2026-10-10."
    },
    "perp": {
     "maker": 0.02,
     "taker": 0.06,
     "note": "VIP 0 USDT-M futures; also BTCUSDT contract API makerFeeRate/takerFeeRate. Re-read 2026-10-10."
    }
   },
   "discount": {
    "token": "BGB",
    "note": "Spot fee discount when BGB offset enabled; percentage not retrieved"
   },
   "kyc": null,
   "restricted_regions": [],
   "source_urls": [
    "https://www.bitget.com/support/articles/12560603892734",
    "https://www.bitget.com/fee"
   ],
   "verified_on": "2026-10-10",
   "status": "verified"
  },
  {
   "slug": "coinbase",
   "name": "Coinbase",
   "type": "cex",
   "fees": {
    "spot": {
     "maker": null,
     "taker": null,
     "note": "unverifiable: rates are shown only after sign-in (coinbase.com/advanced-fees redirects to login); help article lists no rates"
    },
    "perp": {
     "maker": null,
     "taker": null,
     "note": "unverifiable: same"
    }
   },
   "discount": {},
   "kyc": null,
   "restricted_regions": [],
   "source_urls": [
    "https://help.coinbase.com/en/coinbase/trading-and-funding/advanced-trade/advanced-trade-fees"
   ],
   "verified_on": "2026-10-08",
   "status": "unverifiable"
  },
  {
   "slug": "kraken",
   "name": "Kraken",
   "type": "cex",
   "fees": {
    "spot": {
     "maker": 0.4,
     "taker": 0.8,
     "note": "Tier 1 ($0+ < $5M) Spot Maker/Taker 0.40%/0.80% on Kraken's official fee schedule (cross-platform tiers), read 2026-10-10. A Spot Maker Rebate table on the same page shows 0.38%/0.80%."
    },
    "perp": {
     "maker": 0.02,
     "taker": 0.05,
     "note": "Tier 1 Futures Maker/Taker 0.02%/0.05% on the official fee schedule; also futures.kraken.com fee schedule API tier 0. Read 2026-10-10."
    }
   },
   "discount": {},
   "kyc": null,
   "restricted_regions": [
    "US/Canada/NZ: futures unavailable (per fee page)"
   ],
   "source_urls": [
    "https://www.kraken.com/features/fee-schedule",
    "https://support.kraken.com/articles/360000381846-kraken-and-kyc-verification-levels",
    "https://www.kraken.com/en-us/features/fee-schedule",
    "https://futures.kraken.com/derivatives/api/v3/feeschedules"
   ],
   "verified_on": "2026-10-10",
   "status": "verified"
  },
  {
   "slug": "hyperliquid",
   "name": "Hyperliquid",
   "type": "perp-dex",
   "fees": {
    "spot": {
     "maker": 0.04,
     "taker": 0.07,
     "note": "Tier 0 base rate (14-day volume ≤ $5M), before staking/referral discounts. Official docs, re-read 2026-10-10."
    },
    "perp": {
     "maker": 0.015,
     "taker": 0.045,
     "note": "Tier 0 perps base rate. Official docs, re-read 2026-10-10."
    }
   },
   "discount": {
    "token": "HYPE",
    "staking_tiers_pct": {
     ">10": 5,
     ">100": 10,
     ">1000": 15,
     ">10000": 20,
     ">100000": 30,
     ">500000": 40
    },
    "note": "Referral discount applies to first $25M volume; percentage not stated on page"
   },
   "kyc": null,
   "restricted_regions": [],
   "source_urls": [
    "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees"
   ],
   "verified_on": "2026-10-10",
   "status": "verified"
  },
  {
   "slug": "uniswap",
   "name": "Uniswap",
   "type": "dex",
   "fees": {
    "spot": {
     "maker": null,
     "taker": null,
     "note": "Interface/wallet fee 0% (Uniswap Labs charges none as of 2025-12-27); pool fee tiers not stated on page, so maker/taker null"
    },
    "perp": {
     "maker": null,
     "taker": null,
     "note": "Not applicable"
    }
   },
   "discount": {},
   "kyc": null,
   "restricted_regions": [],
   "source_urls": [
    "https://support.uniswap.org/hc/en-us/articles/20131678274957-What-fees-do-I-pay-on-Uniswap"
   ],
   "verified_on": "2026-10-08",
   "status": "verified"
  },
  {
   "slug": "gate",
   "name": "Gate",
   "type": "cex",
   "fees": {
    "spot": {
     "maker": 0.1,
     "taker": 0.1,
     "note": "VIP0 spot 0.1%/0.1% (GT deduction 0.09%). Official fee page gate.com/fee, read 2026-10-10."
    },
    "perp": {
     "maker": 0.02,
     "taker": 0.05,
     "note": "VIP0 USDT perpetuals 0.02%/0.05%. Official fee page gate.com/fee, read 2026-10-10."
    }
   },
   "discount": {
    "token": "GT",
    "note": "GT deduction: VIP0 spot 0.09%/0.09% per fee page"
   },
   "kyc": null,
   "restricted_regions": [],
   "source_urls": [
    "https://www.gate.com/fee"
   ],
   "verified_on": "2026-10-10",
   "status": "verified"
  },
  {
   "slug": "mexc",
   "name": "MEXC",
   "type": "cex",
   "fees": {
    "spot": {
     "maker": null,
     "taker": null,
     "note": "Not published: official sources disagree (fee page says 0% spot; official API sets per-pair fees, most commonly 0/0.08%). Varies by pair and region (2026-10-10)."
    },
    "perp": {
     "maker": null,
     "taker": null,
     "note": "Not published: fee page states 0%/0.04% standard futures, official contract API varies per contract (BTC_USDT 0/0.02%, most 0.01/0.04%). Varies by pair (2026-10-10)."
    }
   },
   "discount": {
    "token": "MX",
    "spot_pct": 20,
    "perp_pct": 20,
    "note": "MX deduction 20% per fee page note"
   },
   "kyc": null,
   "restricted_regions": [],
   "source_urls": [
    "https://www.mexc.com/fee",
    "https://www.mexc.co/fee"
   ],
   "verified_on": "2026-10-10",
   "status": "unverifiable"
  },
  {
   "slug": "kucoin",
   "name": "KuCoin",
   "type": "cex",
   "fees": {
    "spot": {
     "maker": null,
     "taker": null,
     "note": "Not confirmed: the official VIP page is JS-rendered and the base-fee endpoint needs auth (2026-10-10)."
    },
    "perp": {
     "maker": 0.02,
     "taker": 0.06,
     "note": "Official futures API: every active USDT-settled contract (e.g. XBTUSDTM) makerFeeRate 0.0002 / takerFeeRate 0.0006. Read 2026-10-10."
    }
   },
   "discount": {},
   "kyc": null,
   "restricted_regions": [],
   "source_urls": [
    "https://www.kucoin.com/vip/level",
    "https://www.kucoin.com/announcement/it-vip-program-update-spot-trading-fees-volume-requirements-will-be-updated",
    "https://api-futures.kucoin.com/api/v1/contracts/XBTUSDTM"
   ],
   "verified_on": "2026-10-10",
   "status": "verified"
  },
  {
   "slug": "htx",
   "name": "HTX",
   "type": "cex",
   "fees": {
    "spot": {
     "maker": 0.2,
     "taker": 0.2,
     "note": "Prime0 spot maker/taker 0.2000%/0.2000%. Official fee page htx.com/en-us/fee (Spot Fee Rates tab), read 2026-10-14."
    },
    "perp": {
     "maker": 0.02,
     "taker": 0.06,
     "note": "Prime0 USDT-margined futures maker/taker 0.0200%/0.0600% (Group 1, the page's default tab). Official fee page htx.com/en-us/fee (Futures Fee Rates tab), read 2026-10-14."
    }
   },
   "discount": {},
   "kyc": null,
   "restricted_regions": [],
   "source_urls": [
    "https://www.htx.com/en-us/fee/"
   ],
   "verified_on": "2026-10-14",
   "status": "verified"
  },
  {
   "slug": "dydx",
   "name": "dYdX",
   "type": "perp-dex",
   "fees": {
    "spot": {
     "maker": null,
     "taker": null,
     "offered": false,
     "note": "No spot market on dYdX v4."
    },
    "perp": {
     "maker": 0.01,
     "taker": 0.05,
     "note": "Tier 1 (< $1M 30-day volume): taker 5.0 bps, maker 1.0 bps. Official docs; schedule set by governance. Read 2026-10-10."
    }
   },
   "discount": {},
   "kyc": null,
   "restricted_regions": [],
   "source_urls": [
    "https://docs.dydx.xyz/concepts/trading/rewards"
   ],
   "verified_on": "2026-10-10",
   "status": "verified"
  },
  {
   "slug": "deribit",
   "name": "Deribit",
   "type": "cex",
   "fees": {
    "spot": {
     "maker": 0.02,
     "taker": 0.05,
     "note": "Official public API instrument BTC_USDC: maker_commission 0.0002, taker_commission 0.0005. Read 2026-10-10."
    },
    "perp": {
     "maker": 0.015,
     "taker": 0.035,
     "note": "Official public API: BTC_USDC-PERPETUAL (USDC-margined linear perps; the USDT perp is archived) maker 0.00015 / taker 0.00035; inverse BTC-PERPETUAL the same. Read 2026-10-10."
    }
   },
   "discount": {},
   "kyc": null,
   "restricted_regions": [],
   "source_urls": [
    "https://www.deribit.com/api/v2/public/get_instruments?currency=USDC&kind=future"
   ],
   "verified_on": "2026-10-10",
   "status": "verified"
  }
 ]
};

// The JSON's "gate" is "gate-io" in the site catalog.
const SLUG_ALIAS = Object.freeze({ gate: "gate-io" });

export const FACTS_AS_OF = raw.as_of;

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const needsRecheck = (note) => /re-check/i.test(String(note || ""));

function fieldOf(entry, product) {
  const row = entry.fees?.[product] || {};
  const maker = num(row.maker), taker = num(row.taker);
  const verified = entry.status === "verified";
  const recheck = needsRecheck(row.note);
  const publish = verified && !recheck;
  // "none": the official source says the venue has no such market (e.g. dYdX v4 spot) — not the same as unknown.
  const state = verified && row.offered === false ? "none" : !verified || (maker == null && taker == null) ? "unchecked" : recheck ? "recheck" : "checked";
  return {
    maker: publish ? maker : null,
    taker: publish ? taker : null,
    state,
    checkedOn: state === "checked" ? entry.verified_on : null,
    note: row.note || "",
  };
}

function build(entry) {
  const spot = fieldOf(entry, "spot");
  const perp = fieldOf(entry, "perp");
  const d = entry.discount || {};
  const pct = (p, field) => (d.token && num(d[`${p}_pct`]) != null && field.state === "checked" ? d[`${p}_pct`] : null);
  return Object.freeze({
    name: entry.name,
    type: entry.type,
    status: entry.status,
    verifiedOn: entry.verified_on,
    spot: Object.freeze([spot.maker, spot.taker]),
    perp: Object.freeze([perp.maker, perp.taker]),
    fields: Object.freeze({ spot: Object.freeze(spot), perp: Object.freeze(perp) }),
    discount: Object.freeze({ token: d.token || null, spot: pct("spot", spot), perp: pct("perp", perp) }),
    regions: Object.freeze([...(entry.restricted_regions || [])]),
    sourceUrls: Object.freeze([...(entry.source_urls || [])]),
  });
}

export const EXCHANGE_FACTS = Object.freeze(Object.fromEntries(
  raw.exchanges.map((e) => [SLUG_ALIAS[e.slug] || e.slug, build(e)]),
));

const keyOf = (slug) => (typeof slug === "string" ? slug.trim().toLowerCase() : "");
const productKey = (p) => (p === "futures" || p === "perp" || p === "perpetuals" || p === "perps" ? "perp" : "spot");

export function factsForVenue(slug) {
  return EXCHANGE_FACTS[keyOf(slug)] || null;
}

// { maker, taker, state: "checked"|"recheck"|"unchecked"|"none", checkedOn, note } — never undefined.
export function feeFact(slug, product = "spot") {
  const f = factsForVenue(slug);
  return f ? f.fields[productKey(product)] : { maker: null, taker: null, state: "unchecked", checkedOn: null, note: "" };
}

// Percent off for paying fees in the venue token, or null when the base fee itself is not checked.
export function discountFact(slug, product = "spot") {
  const f = factsForVenue(slug);
  return f ? f.discount[productKey(product)] : null;
}

// Latest date on which any figure of this venue was checked, or null when none is published.
export function venueCheckedOn(slug) {
  const f = factsForVenue(slug);
  if (!f) return null;
  return f.fields.spot.checkedOn || f.fields.perp.checkedOn || null;
}

export function primarySourceUrl(slug) {
  const u = factsForVenue(slug)?.sourceUrls?.[0];
  return typeof u === "string" && u.startsWith("https://") ? u : null;
}

// Fee formatting lives in format-fee.js (audit NX-01): two decimals, three only when the third is significant (0.055%,
// 0.015%), never rounded into a different published figure; locale-aware when a locale is passed. Null stays null.
export const feePct = (v, locale = "en") => formatFee(v, locale);
// Fraction in (0.001 = 0.10%), same output. reviewed-base-fees.js and venue-fee-summary.js hold fractions.
export const feePctOfRate = (r, locale = "en") => formatFeeRate(r, locale);
// Always maker first: "0.08% / 0.10%". A missing side reads "–".
export const feePair = (maker, taker, locale = "en") => formatFeePair(maker, taker, locale);
// ISO day (YYYY-MM-DD) for every check/review date shown on the site.
export const isoDay = (v) => (typeof v === "string" && /^\d{4}-\d\d-\d\d/.test(v) ? v.slice(0, 10) : (v && Number.isFinite(Date.parse(v)) ? new Date(v).toISOString().slice(0, 10) : null));

// "0.10% / 0.10%" (maker / taker) when the field is checked, otherwise null ("Not yet checked").
export function feeDisplay(slug, product = "spot", locale = "en") {
  const f = feeFact(slug, product);
  return f.state === "checked" ? feePair(f.maker, f.taker, locale) : null;
}
