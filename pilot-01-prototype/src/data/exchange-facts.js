// The ONE source for public fee facts: every surface (directory, /rates, /compare/*, /factbook/*,
// /exchanges/{slug}, home hero, compare lab) reads fees, status and check dates from here.
// Raw data: RAW below is docs/data/exchange-facts-20261008.json verbatim (official fee pages fetched
// 2026-10-08); update both together. Percent units. A null stays null and renders as "Not yet checked":
// never estimate, never fall back to another file.
//
// Publishing rules (keyed by venue + field + date):
// - a figure is "checked" only when the venue status is "verified" and the field's note does not ask
//   for a re-check; its date is that venue's verified_on;
// - a figure flagged "re-check" in the JSON is held back (state "recheck") and published as null;
// - a token discount is published for a product only when that product's base fee is checked.
const raw = {
 "as_of": "2026-10-08",
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
     "note": "Regular User tier, percent. Official fee schedule."
    },
    "perp": {
     "maker": null,
     "taker": null,
     "note": "unverifiable: Binance fee pages are bot-blocked (HTTP 202/blank); support FAQ states no base rate; left null"
    }
   },
   "discount": {
    "token": "BNB",
    "spot_pct": 25,
    "perp_pct": 10,
    "note": "Spot 25% per fee schedule columns; futures 10% per FAQ, requires BNB in futures account"
   },
   "kyc": null,
   "restricted_regions": [],
   "source_urls": [
    "https://www.binance.com/en/fee/schedule",
    "https://www.binance.com/en/support/faq/detail/360033544231"
   ],
   "verified_on": "2026-10-08",
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
     "note": "Regular user (below VIP 1), standard pairs, percent. Official fee page, Spot tab."
    },
    "perp": {
     "maker": 0.02,
     "taker": 0.05,
     "note": "Regular user, Futures tab (USDT-margined and other contracts share this table), percent."
    }
   },
   "discount": {},
   "kyc": null,
   "restricted_regions": [],
   "source_urls": [
    "https://www.okx.com/fees"
   ],
   "verified_on": "2026-10-08",
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
     "note": "Non-VIP, percent"
    },
    "perp": {
     "maker": 0.02,
     "taker": 0.055,
     "note": "Row labeled 'Perpetual & Futures' (not explicitly USDT); rates may vary by region"
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
   "verified_on": "2026-10-08",
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
     "note": "Standard tier, percent. Official Bitget Support Center FAQ; live fee page tables are not rendered without login."
    },
    "perp": {
     "maker": 0.02,
     "taker": 0.06,
     "note": "Standard tier USDT-M futures, percent. Same source."
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
   "verified_on": "2026-10-08",
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
     "note": "Kraken Pro Tier 1 as extracted from fee schedule; re-check manually, figure looks high vs. historical 0.25/0.40"
    },
    "perp": {
     "maker": 0.02,
     "taker": 0.05,
     "note": "Futures Tier 1 (<$5M 30d volume); futures not available to US/Canada/NZ customers per page"
    }
   },
   "discount": {},
   "kyc": null,
   "restricted_regions": [
    "US/Canada/NZ: futures unavailable (per fee page)"
   ],
   "source_urls": [
    "https://www.kraken.com/features/fee-schedule",
    "https://support.kraken.com/articles/360000381846-kraken-and-kyc-verification-levels"
   ],
   "verified_on": "2026-10-08",
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
     "note": "Tier 0, percent"
    },
    "perp": {
     "maker": 0.015,
     "taker": 0.045,
     "note": "Tier 0, percent"
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
   "verified_on": "2026-10-08",
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
     "note": "VIP0, percent. Official fee page (zh locale), Spot tab."
    },
    "perp": {
     "maker": 0.02,
     "taker": 0.05,
     "note": "VIP0, USDT perpetual, Groups A/B/C all identical at VIP0."
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
   "verified_on": "2026-10-08",
   "status": "verified"
  },
  {
   "slug": "mexc",
   "name": "MEXC",
   "type": "cex",
   "fees": {
    "spot": {
     "maker": 0.0,
     "taker": null,
     "note": "Official fee page shows spot Maker 0.0000% and Taker range 0.0000%-0.0500% across pairs; no single base-tier taker, so taker null."
    },
    "perp": {
     "maker": null,
     "taker": null,
     "note": "Official fee page shows perp Maker 0.000%-0.040% and Taker 0.000%-0.100% by contract (per-pair rates); no single base rate, so null."
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
    "https://www.mexc.com/fee"
   ],
   "verified_on": "2026-10-08",
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
     "note": "unverifiable: live fee table hides VIP0-4 rows for logged-out viewers; only a 2024-11-06 official announcement states VIP0 Class A 0.1/0.1 (B 0.2, C 0.3), too old to treat as current"
    },
    "perp": {
     "maker": null,
     "taker": null,
     "note": "unverifiable: no VIP0 futures rate on any fetched official page"
    }
   },
   "discount": {},
   "kyc": null,
   "restricted_regions": [],
   "source_urls": [
    "https://www.kucoin.com/vip/level",
    "https://www.kucoin.com/announcement/it-vip-program-update-spot-trading-fees-volume-requirements-will-be-updated"
   ],
   "verified_on": "2026-10-08",
   "status": "unverifiable"
  },
  {
   "slug": "htx",
   "name": "HTX",
   "type": "cex",
   "fees": {
    "spot": {
     "maker": null,
     "taker": null,
     "note": "unverifiable: fee page and support articles did not load (timeout/empty)"
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
    "https://www.htx.com/fee/"
   ],
   "verified_on": "2026-10-08",
   "status": "unverifiable"
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
  const state = !verified || (maker == null && taker == null) ? "unchecked" : recheck ? "recheck" : "checked";
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

// { maker, taker, state: "checked"|"recheck"|"unchecked", checkedOn, note } — never undefined.
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

const pctText = (v) => `${v.toFixed(v >= 0.1 || Number.isInteger(Math.round(v * 1e6) / 1e4) ? 2 : 3)}%`;

// "0.10% / 0.10%" (maker / taker) when the field is checked, otherwise null ("Not yet checked").
export function feeDisplay(slug, product = "spot") {
  const f = feeFact(slug, product);
  if (f.state !== "checked") return null;
  const m = f.maker == null ? "–" : pctText(f.maker);
  const t = f.taker == null ? "–" : pctText(f.taker);
  return `${m} / ${t}`;
}
