// Generated from existing dated fee, license, app and research records. Run scripts/generate-exchange-key-facts.mjs.
export const EXCHANGE_KEY_FACT_SHEETS = {
  "binance": {
    "schemaVersion": 1,
    "slug": "binance",
    "name": "Binance",
    "profileUrl": "https://nexualpha.com/exchanges/binance",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/binance.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "spot-fees",
        "value": {
          "maker": 0.1,
          "taker": 0.1,
          "units": "percent",
          "scope": "Regular User, Maker/Taker 0.100%/0.100%. Official fee page (binance.com/en/fee/trading), read 2026-10-10."
        },
        "sourceUrls": [
          "https://www.binance.com/en/fee/schedule",
          "https://www.binance.com/en/support/faq/detail/360033544231",
          "https://www.binance.com/en/fee/trading",
          "https://www.binance.com/en/fee/futureFee"
        ],
        "checkedOn": "2026-10-10"
      },
      {
        "id": "perp-fees",
        "value": {
          "maker": 0.02,
          "taker": 0.05,
          "units": "percent",
          "scope": "Regular User, USDⓈ-M USDT perpetuals Maker/Taker 0.0200%/0.0500%. Official futures fee page (binance.com/en/fee/futureFee), read 2026-10-10."
        },
        "sourceUrls": [
          "https://www.binance.com/en/fee/schedule",
          "https://www.binance.com/en/support/faq/detail/360033544231",
          "https://www.binance.com/en/fee/trading",
          "https://www.binance.com/en/fee/futureFee"
        ],
        "checkedOn": "2026-10-10"
      },
      {
        "id": "license-TR-SPK",
        "value": {
          "jurisdiction": "TR",
          "regulator": "SPK",
          "status": "applied",
          "entity": "Binance Turkey Kripto Varlık Alım Satım Platformu AŞ",
          "type": "Temporary operating-list entry for crypto-asset service providers",
          "note": "SPK states that presence on the operating list does not mean the entity has been authorized under the relevant legislation."
        },
        "sourceUrls": [
          "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "license-JP-Japan FSA",
        "value": {
          "jurisdiction": "JP",
          "regulator": "Japan FSA",
          "status": "registered",
          "entity": "Binance Japan Inc.",
          "type": "Crypto-asset Exchange Service Provider",
          "note": ""
        },
        "sourceUrls": [
          "https://www.fsa.go.jp/en/regulated/licensed/en_kasoutuka.pdf"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "license-AE-Dubai VARA",
        "value": {
          "jurisdiction": "AE",
          "regulator": "Dubai VARA",
          "status": "licensed",
          "entity": "Binance FZE",
          "type": "VASP Licence (Exchange, Broker-Dealer, Lending and Borrowing, Management and Investment)",
          "note": "VARA public register: VASP Licence VL/24/04/001, issued 2024-04-15, status Active."
        },
        "sourceUrls": [
          "https://www.vara.ae/en/licenses-and-register/public-register/"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "proof-of-reserves",
        "value": {
          "url": "https://www.binance.com/en/proof-of-reserves",
          "scope": "Recorded disclosure URL; reserve figures are not verified by this fact sheet."
        },
        "sourceUrls": [
          "https://www.binance.com/en/proof-of-reserves"
        ],
        "checkedOn": "2026-09-08"
      },
      {
        "id": "apps",
        "value": {
          "ios": true,
          "android": true,
          "scope": "Recorded store listings; regional availability requires checking the store."
        },
        "sourceUrls": [
          "https://www.binance.com/en/download",
          "https://www.binance.com/en/learn/how-to-download-and-install-binance"
        ],
        "checkedOn": "2026-10-12"
      },
      {
        "id": "product-scope",
        "value": "The public fee page separates Spot & Margin, NFT, P2P, and fiat-fee sections; derivative availability should be checked on product-specific Binance pages.",
        "sourceUrls": [
          "https://www.binance.com/en/fee/trading"
        ],
        "checkedOn": "2026-09-04"
      }
    ]
  },
  "okx": {
    "schemaVersion": 1,
    "slug": "okx",
    "name": "OKX",
    "profileUrl": "https://nexualpha.com/exchanges/okx",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/okx.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "spot-fees",
        "value": {
          "maker": 0.08,
          "taker": 0.1,
          "units": "percent",
          "scope": "Regular user, Spot standard pairs. Official fee page okx.com/fees, re-read 2026-10-10."
        },
        "sourceUrls": [
          "https://www.okx.com/fees"
        ],
        "checkedOn": "2026-10-10"
      },
      {
        "id": "perp-fees",
        "value": {
          "maker": 0.02,
          "taker": 0.05,
          "units": "percent",
          "scope": "Regular user, Futures tab (USDT-margined). Public endpoint used by okx.com/fees, re-read 2026-10-10."
        },
        "sourceUrls": [
          "https://www.okx.com/fees"
        ],
        "checkedOn": "2026-10-10"
      },
      {
        "id": "license-TR-SPK",
        "value": {
          "jurisdiction": "TR",
          "regulator": "SPK",
          "status": "applied",
          "entity": "OKX TR Kripto Varlık Alım Satım Platformu AŞ",
          "type": "Temporary operating-list entry for crypto-asset service providers",
          "note": "SPK states that presence on the operating list does not mean the entity has been authorized under the relevant legislation."
        },
        "sourceUrls": [
          "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "license-JP-Japan FSA",
        "value": {
          "jurisdiction": "JP",
          "regulator": "Japan FSA",
          "status": "registered",
          "entity": "OKCoin Japan K.K.",
          "type": "Crypto-asset Exchange Service Provider",
          "note": "Japan FSA list (as of 1 September 2026) shows OKCoin Japan K.K. as a registered crypto-asset exchange service provider."
        },
        "sourceUrls": [
          "https://www.fsa.go.jp/en/regulated/licensed/en_kasoutuka.pdf"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "license-SG-MAS",
        "value": {
          "jurisdiction": "SG",
          "regulator": "MAS",
          "status": "licensed",
          "entity": "OKX SG PTE. LTD.",
          "type": "Major Payment Institution - Digital Payment Token Service",
          "note": "MAS Financial Institutions Directory lists OKX SG PTE. LTD. as a Major Payment Institution with Digital Payment Token Service."
        },
        "sourceUrls": [
          "https://eservices.mas.gov.sg/fid/institution/detail/422854-OKX-SG-PTE-LTD"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "license-AE-Dubai VARA",
        "value": {
          "jurisdiction": "AE",
          "regulator": "Dubai VARA",
          "status": "licensed",
          "entity": "OKX Middle East Fintech FZE",
          "type": "VASP Licence (Exchange, Broker-Dealer, Lending and Borrowing, Management and Investment)",
          "note": "VARA public register: VASP Licence VL/23/12/003, issued 2024-09-17, status Active."
        },
        "sourceUrls": [
          "https://www.vara.ae/en/licenses-and-register/public-register/"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "license-MT-MFSA",
        "value": {
          "jurisdiction": "MT",
          "regulator": "MFSA",
          "status": "licensed",
          "entity": "OKX Europe Limited",
          "type": "MiCA CASP authorisation",
          "note": "ESMA interim MiCA CASP register: authorised 2025-01-27 by the Malta Financial Services Authority (LEI 54930069NLWEIGLHXU42)."
        },
        "sourceUrls": [
          "https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "proof-of-reserves",
        "value": {
          "url": "https://www.okx.com/proof-of-reserves",
          "scope": "Recorded disclosure URL; reserve figures are not verified by this fact sheet."
        },
        "sourceUrls": [
          "https://www.okx.com/proof-of-reserves"
        ],
        "checkedOn": "2026-09-08"
      },
      {
        "id": "apps",
        "value": {
          "ios": true,
          "android": true,
          "scope": "Recorded store listings; regional availability requires checking the store."
        },
        "sourceUrls": [
          "https://www.okx.com/download"
        ],
        "checkedOn": "2026-10-12"
      },
      {
        "id": "product-scope",
        "value": "OKX navigation lists spot, futures, DEX, events/options, trading bots, copy trading, Earn, institutional APIs, and proof-of-reserves areas.",
        "sourceUrls": [
          "https://www.okx.com/fees"
        ],
        "checkedOn": "2026-09-04"
      }
    ]
  },
  "bybit": {
    "schemaVersion": 1,
    "slug": "bybit",
    "name": "Bybit",
    "profileUrl": "https://nexualpha.com/exchanges/bybit",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/bybit.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "spot-fees",
        "value": {
          "maker": 0.1,
          "taker": 0.1,
          "units": "percent",
          "scope": "VIP 0, Spot crypto-crypto. Official Trading Fee Structure article (updated 2026-09-02), re-read 2026-10-10."
        },
        "sourceUrls": [
          "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure"
        ],
        "checkedOn": "2026-10-10"
      },
      {
        "id": "perp-fees",
        "value": {
          "maker": 0.02,
          "taker": 0.055,
          "units": "percent",
          "scope": "VIP 0, Perpetual & Futures. Same official article, re-read 2026-10-10."
        },
        "sourceUrls": [
          "https://www.bybit.com/en/help-center/article/Trading-Fee-Structure"
        ],
        "checkedOn": "2026-10-10"
      },
      {
        "id": "license-TR-SPK",
        "value": {
          "jurisdiction": "TR",
          "regulator": "SPK",
          "status": "applied",
          "entity": "Bybit Kripto Varlık Alım Satım Platformu AŞ",
          "type": "Temporary operating-list entry for crypto-asset service providers",
          "note": "SPK states that presence on the operating list does not mean the entity has been authorized under the relevant legislation."
        },
        "sourceUrls": [
          "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "license-FR-AMF",
        "value": {
          "jurisdiction": "FR",
          "regulator": "AMF",
          "status": "licensed",
          "entity": "Bybit EU GmbH",
          "type": "MiCA CASP (PSCA) - passported authorisation",
          "note": "AMF white list: PSCA 'Agréé MICA' via passport from 2025-05-28; home authority FMA (Austria)."
        },
        "sourceUrls": [
          "https://www.amf-france.org/fr/espace-epargnants/proteger-son-epargne/listes-blanches/psca/bybit-eu-gmbh"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "license-DE-BaFin",
        "value": {
          "jurisdiction": "DE",
          "regulator": "BaFin",
          "status": "licensed",
          "entity": "Bybit EU GmbH",
          "type": "Cross-border MiCA CASP services (Art. 65 MiCA)",
          "note": "BaFin company database (BaFin-ID 10164511) lists incoming MiCA services from 2025-05-28; supervised in Austria."
        },
        "sourceUrls": [
          "https://portal.mvp.bafin.de/database/InstInfo/institutDetails.do?cmd=loadInstitutAction&institutId=164511"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "license-AT-FMA",
        "value": {
          "jurisdiction": "AT",
          "regulator": "FMA",
          "status": "licensed",
          "entity": "Bybit EU GmbH",
          "type": "MiCA CASP authorisation",
          "note": "ESMA interim MiCA CASP register: authorised 2025-05-28 by the Austrian FMA (LEI 5299005V5GBSN2A4C303)."
        },
        "sourceUrls": [
          "https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "proof-of-reserves",
        "value": {
          "url": "https://www.bybit.com/en/proof-of-reserves",
          "scope": "Recorded disclosure URL; reserve figures are not verified by this fact sheet."
        },
        "sourceUrls": [
          "https://www.bybit.com/en/proof-of-reserves"
        ],
        "checkedOn": "2026-09-08"
      },
      {
        "id": "apps",
        "value": {
          "ios": true,
          "android": true,
          "scope": "Recorded store listings; regional availability requires checking the store."
        },
        "sourceUrls": [
          "https://www.bybit.com/en/download/"
        ],
        "checkedOn": "2026-10-12"
      }
    ]
  },
  "bitget": {
    "schemaVersion": 1,
    "slug": "bitget",
    "name": "Bitget",
    "profileUrl": "https://nexualpha.com/exchanges/bitget",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/bitget.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "spot-fees",
        "value": {
          "maker": 0.1,
          "taker": 0.1,
          "units": "percent",
          "scope": "VIP 0 spot. Data source of bitget.com/fee (VIP rules config), re-read 2026-10-10."
        },
        "sourceUrls": [
          "https://www.bitget.com/support/articles/12560603892734",
          "https://www.bitget.com/fee"
        ],
        "checkedOn": "2026-10-10"
      },
      {
        "id": "perp-fees",
        "value": {
          "maker": 0.02,
          "taker": 0.06,
          "units": "percent",
          "scope": "VIP 0 USDT-M futures; also BTCUSDT contract API makerFeeRate/takerFeeRate. Re-read 2026-10-10."
        },
        "sourceUrls": [
          "https://www.bitget.com/support/articles/12560603892734",
          "https://www.bitget.com/fee"
        ],
        "checkedOn": "2026-10-10"
      },
      {
        "id": "license-TR-SPK",
        "value": {
          "jurisdiction": "TR",
          "regulator": "SPK",
          "status": "liquidation list",
          "entity": "Bitget Teknoloji AŞ",
          "type": "Temporary liquidation-list entry for crypto-asset service providers",
          "note": ""
        },
        "sourceUrls": [
          "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/tasfiye-surecinde-olanlar-listesi"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "proof-of-reserves",
        "value": {
          "url": "https://www.bitget.com/proof-of-reserves",
          "scope": "Recorded disclosure URL; reserve figures are not verified by this fact sheet."
        },
        "sourceUrls": [
          "https://www.bitget.com/proof-of-reserves"
        ],
        "checkedOn": "2026-09-08"
      },
      {
        "id": "apps",
        "value": {
          "ios": true,
          "android": true,
          "scope": "Recorded store listings; regional availability requires checking the store."
        },
        "sourceUrls": [
          "https://www.bitget.com/download"
        ],
        "checkedOn": "2026-10-12"
      }
    ]
  },
  "coinbase": {
    "schemaVersion": 1,
    "slug": "coinbase",
    "name": "Coinbase",
    "profileUrl": "https://nexualpha.com/exchanges/coinbase",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/coinbase.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "license-SG-MAS",
        "value": {
          "jurisdiction": "SG",
          "regulator": "MAS",
          "status": "licensed",
          "entity": "COINBASE SINGAPORE PTE. LTD.",
          "type": "Major Payment Institution - Digital Payment Token Service",
          "note": ""
        },
        "sourceUrls": [
          "https://eservices.mas.gov.sg/fid/institution?activity=Digital+Payment+Token+Service"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "license-JP-Japan FSA",
        "value": {
          "jurisdiction": "JP",
          "regulator": "Japan FSA",
          "status": "registered",
          "entity": "Coinbase Co., Ltd.",
          "type": "Crypto-asset Exchange Service Provider",
          "note": ""
        },
        "sourceUrls": [
          "https://www.fsa.go.jp/en/regulated/licensed/en_kasoutuka.pdf"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "license-FR-AMF",
        "value": {
          "jurisdiction": "FR",
          "regulator": "AMF",
          "status": "licensed",
          "entity": "Coinbase Luxembourg S.A.",
          "type": "MiCA CASP (PSCA) - passported authorisation",
          "note": "AMF white list: PSCA 'Agréé MICA' via passport from 2025-06-20; home authority CSSF (Luxembourg)."
        },
        "sourceUrls": [
          "https://www.amf-france.org/fr/espace-epargnants/proteger-son-epargne/listes-blanches/psca/coinbase-luxembourg-sa"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "license-CY-CySEC",
        "value": {
          "jurisdiction": "CY",
          "regulator": "CySEC",
          "status": "licensed",
          "entity": "Coinbase Financial Services Europe Ltd",
          "type": "Cyprus Investment Firm (MiFID investment services)",
          "note": "CySEC Investment Firms register: licence 374/19 dated 2019-04-15."
        },
        "sourceUrls": [
          "https://www.cysec.gov.cy/en-GB/entities/investment-firms/cypriot/84044/"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "license-LU-CSSF",
        "value": {
          "jurisdiction": "LU",
          "regulator": "CSSF",
          "status": "licensed",
          "entity": "Coinbase Luxembourg S.A.",
          "type": "MiCA CASP authorisation",
          "note": "ESMA interim MiCA CASP register: authorised 2025-06-20 by the CSSF (LEI 984500F14CA4571AAC11)."
        },
        "sourceUrls": [
          "https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "proof-of-reserves",
        "value": {
          "url": "https://www.coinbase.com/proof-of-reserves",
          "scope": "Recorded disclosure URL; reserve figures are not verified by this fact sheet."
        },
        "sourceUrls": [
          "https://www.coinbase.com/proof-of-reserves"
        ],
        "checkedOn": "2026-09-08"
      },
      {
        "id": "product-scope",
        "value": "Coinbase Exchange presents direct access to spot exchange trading through FIX, REST APIs, and WebSocket feeds.",
        "sourceUrls": [
          "https://www.coinbase.com/en-in/exchange"
        ],
        "checkedOn": "2026-09-04"
      }
    ]
  },
  "kraken": {
    "schemaVersion": 1,
    "slug": "kraken",
    "name": "Kraken",
    "profileUrl": "https://nexualpha.com/exchanges/kraken",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/kraken.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "spot-fees",
        "value": {
          "maker": 0.4,
          "taker": 0.8,
          "units": "percent",
          "scope": "Tier 1 ($0+ < $5M) Spot Maker/Taker 0.40%/0.80% on Kraken's official fee schedule (cross-platform tiers), read 2026-10-10. A Spot Maker Rebate table on the same page shows 0.38%/0.80%."
        },
        "sourceUrls": [
          "https://www.kraken.com/features/fee-schedule",
          "https://support.kraken.com/articles/360000381846-kraken-and-kyc-verification-levels",
          "https://www.kraken.com/en-us/features/fee-schedule",
          "https://futures.kraken.com/derivatives/api/v3/feeschedules"
        ],
        "checkedOn": "2026-10-10"
      },
      {
        "id": "perp-fees",
        "value": {
          "maker": 0.02,
          "taker": 0.05,
          "units": "percent",
          "scope": "Tier 1 Futures Maker/Taker 0.02%/0.05% on the official fee schedule; also futures.kraken.com fee schedule API tier 0. Read 2026-10-10."
        },
        "sourceUrls": [
          "https://www.kraken.com/features/fee-schedule",
          "https://support.kraken.com/articles/360000381846-kraken-and-kyc-verification-levels",
          "https://www.kraken.com/en-us/features/fee-schedule",
          "https://futures.kraken.com/derivatives/api/v3/feeschedules"
        ],
        "checkedOn": "2026-10-10"
      },
      {
        "id": "license-AE-Dubai VARA",
        "value": {
          "jurisdiction": "AE",
          "regulator": "Dubai VARA",
          "status": "licensed",
          "entity": "Payward FZCO",
          "type": "VASP Licence (Broker-Dealer, Management and Investment)",
          "note": "VARA public register: VASP Licence VL/26/10/002, issued 2026-10-06, status Active."
        },
        "sourceUrls": [
          "https://www.vara.ae/en/licenses-and-register/public-register/"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "license-FR-AMF",
        "value": {
          "jurisdiction": "FR",
          "regulator": "AMF",
          "status": "licensed",
          "entity": "Payward Europe Solutions Limited (Kraken Digital Asset Exchange)",
          "type": "MiCA CASP (PSCA) - passported authorisation",
          "note": "AMF white list: PSCA 'Agréé MICA' via passport from 2025-06-25; home authority Central Bank of Ireland."
        },
        "sourceUrls": [
          "https://www.amf-france.org/fr/espace-epargnants/proteger-son-epargne/listes-blanches/psca/payward-europe-solutions-limited-kraken-digital-asset-exchange-kraken"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "license-CY-CySEC",
        "value": {
          "jurisdiction": "CY",
          "regulator": "CySEC",
          "status": "licensed",
          "entity": "Payward Europe Digital Solutions (CY) Limited",
          "type": "Cyprus Investment Firm (MiFID investment services)",
          "note": "CySEC Investment Firms register: licence 342/17 dated 2017-11-13 (formerly I.F. Greenfields Wealth Ltd)."
        },
        "sourceUrls": [
          "https://www.cysec.gov.cy/en-GB/entities/investment-firms/cypriot/45914/"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "license-IE-Central Bank of Ireland",
        "value": {
          "jurisdiction": "IE",
          "regulator": "Central Bank of Ireland",
          "status": "licensed",
          "entity": "Payward Europe Solutions Limited",
          "type": "MiCA CASP authorisation",
          "note": "ESMA interim MiCA CASP register: authorised 2025-06-25 by the Central Bank of Ireland (LEI 254900641D8KNHUZYX24)."
        },
        "sourceUrls": [
          "https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "license-IE-Central Bank of Ireland",
        "value": {
          "jurisdiction": "IE",
          "regulator": "Central Bank of Ireland",
          "status": "licensed",
          "entity": "Payward Global Solutions Limited",
          "type": "MiCA CASP authorisation (operation of a trading platform)",
          "note": "ESMA interim MiCA CASP register: authorised 2025-06-25 by the Central Bank of Ireland (LEI 9845003D98SCC2851458)."
        },
        "sourceUrls": [
          "https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "proof-of-reserves",
        "value": {
          "url": "https://www.kraken.com/proof-of-reserves",
          "scope": "Recorded disclosure URL; reserve figures are not verified by this fact sheet."
        },
        "sourceUrls": [
          "https://www.kraken.com/proof-of-reserves"
        ],
        "checkedOn": "2026-09-08"
      },
      {
        "id": "product-scope",
        "value": "Kraken's features page lists Kraken Pro, margin, perpetuals/futures, OTC, staking, API, institutional, custody, and account-management services.",
        "sourceUrls": [
          "https://www.kraken.com/features"
        ],
        "checkedOn": "2026-09-04"
      }
    ]
  },
  "gate-io": {
    "schemaVersion": 1,
    "slug": "gate-io",
    "name": "Gate.io",
    "profileUrl": "https://nexualpha.com/exchanges/gate-io",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/gate-io.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "spot-fees",
        "value": {
          "maker": 0.1,
          "taker": 0.1,
          "units": "percent",
          "scope": "VIP0 spot 0.1%/0.1% (GT deduction 0.09%). Official fee page gate.com/fee, read 2026-10-10."
        },
        "sourceUrls": [
          "https://www.gate.com/fee"
        ],
        "checkedOn": "2026-10-10"
      },
      {
        "id": "perp-fees",
        "value": {
          "maker": 0.02,
          "taker": 0.05,
          "units": "percent",
          "scope": "VIP0 USDT perpetuals 0.02%/0.05%. Official fee page gate.com/fee, read 2026-10-10."
        },
        "sourceUrls": [
          "https://www.gate.com/fee"
        ],
        "checkedOn": "2026-10-10"
      },
      {
        "id": "license-TR-SPK",
        "value": {
          "jurisdiction": "TR",
          "regulator": "SPK",
          "status": "applied",
          "entity": "Gate Kripto Varlık Alım Satım Platformu AŞ",
          "type": "Temporary operating-list entry for crypto-asset service providers",
          "note": "SPK states that presence on the operating list does not mean the entity has been authorized under the relevant legislation."
        },
        "sourceUrls": [
          "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "proof-of-reserves",
        "value": {
          "url": "https://www.gate.io/proof-of-reserves",
          "scope": "Recorded disclosure URL; reserve figures are not verified by this fact sheet."
        },
        "sourceUrls": [
          "https://www.gate.io/proof-of-reserves"
        ],
        "checkedOn": "2026-09-08"
      },
      {
        "id": "product-scope",
        "value": "Gate API documentation exposes spot and futures REST/WebSocket areas as separate integration surfaces.",
        "sourceUrls": [
          "https://www.gate.com/docs/developers/apiv4/"
        ],
        "checkedOn": "2026-09-04"
      }
    ]
  },
  "kucoin": {
    "schemaVersion": 1,
    "slug": "kucoin",
    "name": "KuCoin",
    "profileUrl": "https://nexualpha.com/exchanges/kucoin",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/kucoin.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "perp-fees",
        "value": {
          "maker": 0.02,
          "taker": 0.06,
          "units": "percent",
          "scope": "Official futures API: every active USDT-settled contract (e.g. XBTUSDTM) makerFeeRate 0.0002 / takerFeeRate 0.0006. Read 2026-10-10."
        },
        "sourceUrls": [
          "https://www.kucoin.com/vip/level",
          "https://www.kucoin.com/announcement/it-vip-program-update-spot-trading-fees-volume-requirements-will-be-updated",
          "https://api-futures.kucoin.com/api/v1/contracts/XBTUSDTM"
        ],
        "checkedOn": "2026-10-10"
      },
      {
        "id": "license-TR-SPK",
        "value": {
          "jurisdiction": "TR",
          "regulator": "SPK",
          "status": "applied",
          "entity": "Kucoın TR Kripto Varlık Alım Satım Platformu AŞ",
          "type": "Temporary operating-list entry for crypto-asset service providers",
          "note": "SPK states that presence on the operating list does not mean the entity has been authorized under the relevant legislation."
        },
        "sourceUrls": [
          "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "proof-of-reserves",
        "value": {
          "url": "https://www.kucoin.com/proof-of-reserves",
          "scope": "Recorded disclosure URL; reserve figures are not verified by this fact sheet."
        },
        "sourceUrls": [
          "https://www.kucoin.com/proof-of-reserves"
        ],
        "checkedOn": "2026-09-08"
      }
    ]
  },
  "mexc": {
    "schemaVersion": 1,
    "slug": "mexc",
    "name": "MEXC",
    "profileUrl": "https://nexualpha.com/exchanges/mexc",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/mexc.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "license-TR-SPK",
        "value": {
          "jurisdiction": "TR",
          "regulator": "SPK",
          "status": "applied",
          "entity": "Mexc Kripto Varlık Alım Satım Platformu AŞ",
          "type": "Temporary operating-list entry for crypto-asset service providers",
          "note": "SPK states that presence on the operating list does not mean the entity has been authorized under the relevant legislation."
        },
        "sourceUrls": [
          "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "proof-of-reserves",
        "value": {
          "url": "https://www.mexc.com/proof-of-reserves",
          "scope": "Recorded disclosure URL; reserve figures are not verified by this fact sheet."
        },
        "sourceUrls": [
          "https://www.mexc.com/proof-of-reserves"
        ],
        "checkedOn": "2026-09-08"
      },
      {
        "id": "product-scope",
        "value": "MEXC spot API documentation exposes spot account, market, and trading endpoints separately from contract APIs.",
        "sourceUrls": [
          "https://mexcdevelop.github.io/apidocs/spot_v3_en/"
        ],
        "checkedOn": "2026-09-04"
      }
    ]
  },
  "htx": {
    "schemaVersion": 1,
    "slug": "htx",
    "name": "HTX",
    "profileUrl": "https://nexualpha.com/exchanges/htx",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/htx.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "proof-of-reserves",
        "value": {
          "url": "https://www.htx.com/proof-of-reserves",
          "scope": "Recorded disclosure URL; reserve figures are not verified by this fact sheet."
        },
        "sourceUrls": [
          "https://www.htx.com/proof-of-reserves"
        ],
        "checkedOn": "2026-09-08"
      }
    ]
  },
  "backpack": {
    "schemaVersion": 1,
    "slug": "backpack",
    "name": "Backpack",
    "profileUrl": "https://nexualpha.com/exchanges/backpack",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/backpack.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "product-scope",
        "value": "Backpack's API FAQ says the same order and account endpoints support both spot and perpetual futures.",
        "sourceUrls": [
          "https://support.backpack.exchange/exchange/api-and-developer-docs/faqs"
        ],
        "checkedOn": "2026-09-04"
      }
    ]
  },
  "coinw": {
    "schemaVersion": 1,
    "slug": "coinw",
    "name": "CoinW",
    "profileUrl": "https://nexualpha.com/exchanges/coinw",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/coinw.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "proof-of-reserves",
        "value": {
          "url": "https://www.coinw.com/proof-of-reserves",
          "scope": "Recorded disclosure URL; reserve figures are not verified by this fact sheet."
        },
        "sourceUrls": [
          "https://www.coinw.com/proof-of-reserves"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "apps",
        "value": {
          "ios": true,
          "android": true,
          "scope": "Recorded store listings; regional availability requires checking the store."
        },
        "sourceUrls": [
          "https://www.coinw.com/install-app"
        ],
        "checkedOn": "2026-10-13"
      },
      {
        "id": "product-scope",
        "value": "CoinW's official site lists spot trading, USDT perpetual futures, futures and spot copy trading, Earn (savings and auto-invest), grid and martingale bots, and a crypto card.",
        "sourceUrls": [
          "https://www.coinw.com/about-us"
        ],
        "checkedOn": "2026-10-13"
      }
    ]
  },
  "deribit": {
    "schemaVersion": 1,
    "slug": "deribit",
    "name": "Deribit",
    "profileUrl": "https://nexualpha.com/exchanges/deribit",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/deribit.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "spot-fees",
        "value": {
          "maker": 0.02,
          "taker": 0.05,
          "units": "percent",
          "scope": "Official public API instrument BTC_USDC: maker_commission 0.0002, taker_commission 0.0005. Read 2026-10-10."
        },
        "sourceUrls": [
          "https://www.deribit.com/api/v2/public/get_instruments?currency=USDC&kind=future"
        ],
        "checkedOn": "2026-10-10"
      },
      {
        "id": "perp-fees",
        "value": {
          "maker": 0.015,
          "taker": 0.035,
          "units": "percent",
          "scope": "Official public API: BTC_USDC-PERPETUAL (USDC-margined linear perps; the USDT perp is archived) maker 0.00015 / taker 0.00035; inverse BTC-PERPETUAL the same. Read 2026-10-10."
        },
        "sourceUrls": [
          "https://www.deribit.com/api/v2/public/get_instruments?currency=USDC&kind=future"
        ],
        "checkedOn": "2026-10-10"
      },
      {
        "id": "product-scope",
        "value": "Deribit API docs describe the venue as offering futures, options, and perpetuals.",
        "sourceUrls": [
          "https://docs.deribit.com/"
        ],
        "checkedOn": "2026-09-04"
      }
    ]
  },
  "hashkey": {
    "schemaVersion": 1,
    "slug": "hashkey",
    "name": "HashKey Global",
    "profileUrl": "https://nexualpha.com/exchanges/hashkey",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/hashkey.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "license-JP-Japan FSA",
        "value": {
          "jurisdiction": "JP",
          "regulator": "Japan FSA",
          "status": "registered",
          "entity": "HashKey Japan Co., Ltd.",
          "type": "Crypto-asset Exchange Service Provider",
          "note": ""
        },
        "sourceUrls": [
          "https://www.fsa.go.jp/en/regulated/licensed/en_kasoutuka.pdf"
        ],
        "checkedOn": "2026-10-13"
      }
    ]
  },
  "hyperliquid": {
    "schemaVersion": 1,
    "slug": "hyperliquid",
    "name": "Hyperliquid",
    "profileUrl": "https://nexualpha.com/exchanges/hyperliquid",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/hyperliquid.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "spot-fees",
        "value": {
          "maker": 0.04,
          "taker": 0.07,
          "units": "percent",
          "scope": "Tier 0 base rate (14-day volume ≤ $5M), before staking/referral discounts. Official docs, re-read 2026-10-10."
        },
        "sourceUrls": [
          "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees"
        ],
        "checkedOn": "2026-10-10"
      },
      {
        "id": "perp-fees",
        "value": {
          "maker": 0.015,
          "taker": 0.045,
          "units": "percent",
          "scope": "Tier 0 perps base rate. Official docs, re-read 2026-10-10."
        },
        "sourceUrls": [
          "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees"
        ],
        "checkedOn": "2026-10-10"
      },
      {
        "id": "product-scope",
        "value": "Hyperliquid docs describe HyperCore as including fully on-chain perpetual futures and spot order books.",
        "sourceUrls": [
          "https://hyperliquid.gitbook.io/hyperliquid-docs"
        ],
        "checkedOn": "2026-09-04"
      },
      {
        "id": "deposit-methods",
        "value": "Hyperliquid USDC docs describe native Hyperliquid L1 USDC and point users to Circle's Arbitrum-to-HyperCore CCTP transfer documentation.",
        "sourceUrls": [
          "https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/usdc"
        ],
        "checkedOn": "2026-09-04"
      }
    ]
  },
  "dydx": {
    "schemaVersion": 1,
    "slug": "dydx",
    "name": "dYdX",
    "profileUrl": "https://nexualpha.com/exchanges/dydx",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/dydx.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "perp-fees",
        "value": {
          "maker": 0.01,
          "taker": 0.05,
          "units": "percent",
          "scope": "Tier 1 (< $1M 30-day volume): taker 5.0 bps, maker 1.0 bps. Official docs; schedule set by governance. Read 2026-10-10."
        },
        "sourceUrls": [
          "https://docs.dydx.xyz/concepts/trading/rewards"
        ],
        "checkedOn": "2026-10-10"
      }
    ]
  },
  "gmx": {
    "schemaVersion": 1,
    "slug": "gmx",
    "name": "GMX",
    "profileUrl": "https://nexualpha.com/exchanges/gmx",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/gmx.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "source-context",
        "value": "GMX docs say trading is powered by GM and GLV liquidity pools and routes orders against those pools.",
        "sourceUrls": [
          "https://docs.gmx.io/docs/intro/"
        ],
        "checkedOn": "2026-09-04"
      }
    ]
  },
  "drift": {
    "schemaVersion": 1,
    "slug": "drift",
    "name": "Drift",
    "profileUrl": "https://nexualpha.com/exchanges/drift",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/drift.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "product-scope",
        "value": "Drift's own website positions the product around Solana trading, market data, points, stats, staking, governance, and developer entry points.",
        "sourceUrls": [
          "https://www.drift.trade/"
        ],
        "checkedOn": "2026-09-04"
      }
    ]
  },
  "aevo": {
    "schemaVersion": 1,
    "slug": "aevo",
    "name": "Aevo",
    "profileUrl": "https://nexualpha.com/exchanges/aevo",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/aevo.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "source-context",
        "value": "Recorded API documentation URL (discovery only).",
        "sourceUrls": [
          "https://docs.aevo.xyz/"
        ],
        "checkedOn": "2026-09-08"
      }
    ]
  },
  "uniswap": {
    "schemaVersion": 1,
    "slug": "uniswap",
    "name": "Uniswap",
    "profileUrl": "https://nexualpha.com/exchanges/uniswap",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/uniswap.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "product-scope",
        "value": "Uniswap v4 documentation points developers to hooks, flash accounting, dynamic fees, deployments, SDKs, and audit reports.",
        "sourceUrls": [
          "https://developers.uniswap.org/docs/protocols/v4/overview"
        ],
        "checkedOn": "2026-09-16"
      }
    ]
  },
  "pancakeswap": {
    "schemaVersion": 1,
    "slug": "pancakeswap",
    "name": "PancakeSwap",
    "profileUrl": "https://nexualpha.com/exchanges/pancakeswap",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/pancakeswap.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "product-scope",
        "value": "PancakeSwap Infinity documentation describes a modular architecture supporting Concentrated Liquidity Pools and Liquidity Book Pools.",
        "sourceUrls": [
          "https://developer.pancakeswap.finance/contracts/infinity/faq/pancakeswap-infinity-vs-uniswap-v4"
        ],
        "checkedOn": "2026-09-04"
      }
    ]
  },
  "jupiter": {
    "schemaVersion": 1,
    "slug": "jupiter",
    "name": "Jupiter",
    "profileUrl": "https://nexualpha.com/exchanges/jupiter",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/jupiter.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "source-context",
        "value": "Jupiter Swap API is the quote-and-transaction path for apps that need to fetch routes and build Solana swap transactions before the user signs in a wallet.",
        "sourceUrls": [
          "https://dev.jup.ag/docs/swap"
        ],
        "checkedOn": "2026-09-04"
      }
    ]
  },
  "raydium": {
    "schemaVersion": 1,
    "slug": "raydium",
    "name": "Raydium",
    "profileUrl": "https://nexualpha.com/exchanges/raydium",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/raydium.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "product-scope",
        "value": "Raydium docs cover AMM v4, CPMM, CLMM, Farm, LaunchLab, Perps, on-chain accounts, math, instructions, fees, SDK, and runnable code.",
        "sourceUrls": [
          "https://docs.raydium.io/"
        ],
        "checkedOn": "2026-09-04"
      }
    ]
  },
  "aerodrome": {
    "schemaVersion": 1,
    "slug": "aerodrome",
    "name": "Aerodrome",
    "profileUrl": "https://nexualpha.com/exchanges/aerodrome",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/aerodrome.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "source-context",
        "value": "Aerodrome's docs describe it as the trading and liquidity hub of Base, so the route should be evaluated as a Base DEX path rather than a multi-chain exchange account.",
        "sourceUrls": [
          "https://aerodrome.finance/docs"
        ],
        "checkedOn": "2026-09-04"
      }
    ]
  },
  "curve": {
    "schemaVersion": 1,
    "slug": "curve",
    "name": "Curve",
    "profileUrl": "https://nexualpha.com/exchanges/curve",
    "jsonUrl": "https://nexualpha.com/api/exchange-facts/curve.json",
    "limitations": "Dated source records, not live fees, account eligibility, legal advice or reserve guarantees. Unknown fields are omitted.",
    "rows": [
      {
        "id": "source-context",
        "value": "Curve's risk documentation discusses pool-level impermanent-loss behavior and separates Cryptoswap V2 mechanics from a generic DEX claim.",
        "sourceUrls": [
          "https://resources.curve.finance/user/security/risks/pools"
        ],
        "checkedOn": "2026-09-04"
      }
    ]
  }
};
