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
        "id": "license-AE-Dubai VARA",
        "value": {
          "jurisdiction": "AE",
          "regulator": "Dubai VARA",
          "status": "licensed",
          "entity": "Binance FZE",
          "type": "VASP Licence (Exchange, Broker-Dealer, Lending and Borrowing, Management and Investment)",
          "note": "Active; issued 2024-04-15. Retail, qualified and institutional investors permitted; margin and derivatives permissions restricted to qualified and institutional investors."
        },
        "sourceUrls": [
          "https://www.vara.ae/en/licenses-and-register/public-register/binance-fze/"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-AE-ADGM FSRA",
        "value": {
          "jurisdiction": "AE",
          "regulator": "ADGM FSRA",
          "status": "licensed",
          "entity": "Nest Exchange Limited",
          "type": "Recognised Investment Exchange (Multilateral Trading Facility)",
          "note": "Active; recognition order dated 2026-01-05; Binance trading name. Stipulation permits operating a multilateral trading facility. Permission is entity and jurisdiction specific."
        },
        "sourceUrls": [
          "https://www.adgm.com/public-registers/fsra/firms/recognized-bodies/nest-services-limited"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-AE-ADGM FSRA",
        "value": {
          "jurisdiction": "AE",
          "regulator": "ADGM FSRA",
          "status": "licensed",
          "entity": "Nest Clearing and Custody Limited",
          "type": "Recognised Clearing House (Custody and Central Securities Depository)",
          "note": "Active; recognition order dated 2025-12-08. Former Binance (AD) Limited; Binance trading name. Stipulations include custody and central securities depository."
        },
        "sourceUrls": [
          "https://www.adgm.com/public-registers/fsra/firms/recognized-bodies/nest-clearing-and-custody-limited"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-AE-ADGM FSRA",
        "value": {
          "jurisdiction": "AE",
          "regulator": "ADGM FSRA",
          "status": "licensed",
          "entity": "Nest Trading Limited",
          "type": "Financial Services Permission",
          "note": "Active; FSP dated 2026-01-05; register website identifies Binance. Activity table renders no results; do not infer activity scope. Not permitted to hold or control client money."
        },
        "sourceUrls": [
          "https://www.adgm.com/public-registers/fsra/firms/financial-firms/nest-trading-limited-260000"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-AR-CNV",
        "value": {
          "jurisdiction": "AR",
          "regulator": "CNV",
          "status": "registered",
          "entity": "BINANCE SERVICES LATINOAMÉRICA S.A. DE C.V. -S.S.E",
          "type": "PSAV registration",
          "note": "Registered in CNV PSAV register; not represented as a full exchange licence."
        },
        "sourceUrls": [
          "https://www.cnv.gov.ar/SitioWeb/Reportes/ListadoRegistrosPsav"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-AU-AUSTRAC",
        "value": {
          "jurisdiction": "AU",
          "regulator": "AUSTRAC",
          "status": "registered",
          "entity": "INVESTBYBIT PTY LTD",
          "type": "VASP AML/CTF registration",
          "note": "Returned legal name with trading name BINANCE AUSTRALIA. This is not evidence for the Bybit exchange despite the legal-name substring."
        },
        "sourceUrls": [
          "https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=Binance&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-IN-FIU-IND",
        "value": {
          "jurisdiction": "IN",
          "regulator": "FIU-IND",
          "status": "registered",
          "entity": "Nest Services Limited (Earlier Binance International Limited)",
          "type": "VDA reporting entity registration (AML/CFT only); official snapshot 2026-03-09",
          "note": "Registered reporting entity — snapshot 2026-03-09"
        },
        "sourceUrls": [
          "https://sansad.in/getFile/loksabhaquestions/annex/187/AU5805_lMTYNK.pdf?source=pqals"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-JP-Japan FSA",
        "value": {
          "jurisdiction": "JP",
          "regulator": "Japan FSA",
          "status": "registered",
          "entity": "Binance Japan株式会社",
          "type": "Crypto-asset Exchange Service Provider",
          "note": "Register lists Binance Japan with supported assets; local entity only."
        },
        "sourceUrls": [
          "https://www.fsa.go.jp/menkyo/menkyoj/kasoutuka.pdf"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-TH-Securities and Exchange Commission Thailand",
        "value": {
          "jurisdiction": "TH",
          "regulator": "Securities and Exchange Commission Thailand",
          "status": "licensed",
          "entity": "GULF BINANCE COMPANY LIMITED (BINANCE TH only)",
          "type": "Digital Asset Exchange and Digital Asset Broker (local BINANCE TH)",
          "note": "licensed local entity; international venue not verified"
        },
        "sourceUrls": [
          "https://market.sec.or.th/LicenseCheck/views/DABusiness"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-TR-SPK",
        "value": {
          "jurisdiction": "TR",
          "regulator": "SPK",
          "status": "applied",
          "entity": "Binance Turkey Kripto Varlık Alım Satım Platformu AŞ",
          "type": "Transitional operating list",
          "note": "Named in the transitional operating list; SPK explicitly says inclusion does not mean authorisation."
        },
        "sourceUrls": [
          "https://www.spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi"
        ],
        "checkedOn": "2026-10-14"
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
        "id": "license-AE-Dubai VARA",
        "value": {
          "jurisdiction": "AE",
          "regulator": "Dubai VARA",
          "status": "licensed",
          "entity": "OKX Middle East Fintech FZE",
          "type": "VASP Licence (Exchange, Broker-Dealer, Lending and Borrowing, Management and Investment)",
          "note": "Active; issued 2024-09-17. Retail, qualified and institutional investors permitted. Derivatives and margin permissions have specific conditions; collateral optimisation restricted to qualified and institutional investors."
        },
        "sourceUrls": [
          "https://www.vara.ae/en/licenses-and-register/public-register/okx-middle-east-fintech-fze/"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-AR-CNV",
        "value": {
          "jurisdiction": "AR",
          "regulator": "CNV",
          "status": "registered",
          "entity": "OKX Fintech, S.A. de C.V. (Sucursal Argentina)",
          "type": "PSAV registration",
          "note": "Registered in CNV PSAV register; not represented as a full exchange licence."
        },
        "sourceUrls": [
          "https://www.cnv.gov.ar/SitioWeb/Reportes/ListadoRegistrosPsav"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-AU-AUSTRAC",
        "value": {
          "jurisdiction": "AU",
          "regulator": "AUSTRAC",
          "status": "registered",
          "entity": "OKX AUSTRALIA FINANCIAL PTY LTD",
          "type": "VASP AML/CTF registration",
          "note": "Returned registered VASP legal name; ACN 145724509 is a company identifier, not a licence number."
        },
        "sourceUrls": [
          "https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=OKX&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-AU-AUSTRAC",
        "value": {
          "jurisdiction": "AU",
          "regulator": "AUSTRAC",
          "status": "registered",
          "entity": "OKX AUSTRALIA PTY LTD",
          "type": "VASP AML/CTF registration",
          "note": "Returned registered VASP legal name; ACN 636269040 is a company identifier, not a licence number."
        },
        "sourceUrls": [
          "https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=OKX&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-EU-Malta Financial Services Authority (MFSA)",
        "value": {
          "jurisdiction": "EU",
          "regulator": "Malta Financial Services Authority (MFSA)",
          "status": "licensed",
          "entity": "OKX Europe Limited",
          "type": "MiCA crypto-asset service provider authorisation",
          "note": "National MiCA authorisation; service and passport scope is entity-specific. See the official register."
        },
        "sourceUrls": [
          "https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-HK-SFC",
        "value": {
          "jurisdiction": "HK",
          "regulator": "SFC",
          "status": "withdrawn",
          "entity": "OKX Hong Kong FinTech Company Limited",
          "type": "Virtual asset trading platform (VATP)",
          "note": "Application submitted 2023-11-16; removed 2024-05-24, reason Withdrawn."
        },
        "sourceUrls": [
          "https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Virtual-asset-trading-platforms-operators/Lists-of-virtual-asset-trading-platforms"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-JP-Japan FSA",
        "value": {
          "jurisdiction": "JP",
          "regulator": "Japan FSA",
          "status": "registered",
          "entity": "オーケーコイン・ジャパン株式会社",
          "type": "Crypto-asset Exchange Service Provider",
          "note": "Register lists OKCoin Japan with supported assets; retain existing local-entity mapping, not an authorisation for OKX global."
        },
        "sourceUrls": [
          "https://www.fsa.go.jp/menkyo/menkyoj/kasoutuka.pdf"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-SG-MAS",
        "value": {
          "jurisdiction": "SG",
          "regulator": "MAS",
          "status": "licensed",
          "entity": "OKX SG PTE. LTD.",
          "type": "Major Payment Institution — Digital Payment Token Service",
          "note": "MAS institution detail lists Major Payment Institution status with Digital Payment Token Service and Cross-border Money Transfer Service. No licence number is printed; the URL identifier is not a licence number."
        },
        "sourceUrls": [
          "https://eservices.mas.gov.sg/fid/institution/detail/422854-OKX-SG-PTE-LTD"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-TR-SPK",
        "value": {
          "jurisdiction": "TR",
          "regulator": "SPK",
          "status": "applied",
          "entity": "OKX TR Kripto Varlık Alım Satım Platformu AŞ",
          "type": "Transitional operating list",
          "note": "Named in the transitional operating list; SPK explicitly says inclusion does not mean authorisation."
        },
        "sourceUrls": [
          "https://www.spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi"
        ],
        "checkedOn": "2026-10-14"
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
        "id": "license-AR-CNV",
        "value": {
          "jurisdiction": "AR",
          "regulator": "CNV",
          "status": "registered",
          "entity": "LUZPAY S.A.",
          "type": "PSAV registration",
          "note": "Registered in CNV PSAV register; not represented as a full exchange licence."
        },
        "sourceUrls": [
          "https://www.cnv.gov.ar/SitioWeb/Reportes/ListadoRegistrosPsav"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-EU-Austrian Financial Market Authority (FMA)",
        "value": {
          "jurisdiction": "EU",
          "regulator": "Austrian Financial Market Authority (FMA)",
          "status": "licensed",
          "entity": "Bybit EU GmbH",
          "type": "MiCA crypto-asset service provider authorisation",
          "note": "National MiCA authorisation; service and passport scope is entity-specific. See the official register."
        },
        "sourceUrls": [
          "https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-HK-SFC",
        "value": {
          "jurisdiction": "HK",
          "regulator": "SFC",
          "status": "applied",
          "entity": "Spark Fintech Limited",
          "type": "Virtual asset trading platform (VATP)",
          "note": "Application submitted 2025-06-06. Earlier application withdrawn 2024-05-31."
        },
        "sourceUrls": [
          "https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Virtual-asset-trading-platforms-operators/Lists-of-virtual-asset-trading-platforms"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-IN-FIU-IND",
        "value": {
          "jurisdiction": "IN",
          "regulator": "FIU-IND",
          "status": "registered",
          "entity": "Bybit Fintech Limited",
          "type": "VDA reporting entity registration (AML/CFT only); official snapshot 2026-03-09",
          "note": "Registered reporting entity — snapshot 2026-03-09"
        },
        "sourceUrls": [
          "https://sansad.in/getFile/loksabhaquestions/annex/187/AU5805_lMTYNK.pdf?source=pqals"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-JP-Japan FSA",
        "value": {
          "jurisdiction": "JP",
          "regulator": "Japan FSA",
          "status": "warning",
          "entity": "Bybit Fintech Limited",
          "type": "Unregistered overseas operator warning",
          "note": "FSA warning list records November 2024 notice for unregistered services to Japanese residents. Historical warning does not establish current operations."
        },
        "sourceUrls": [
          "https://www.fsa.go.jp/ordinary/chuui/angoushisan_mutouroku.html"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-TR-SPK",
        "value": {
          "jurisdiction": "TR",
          "regulator": "SPK",
          "status": "applied",
          "entity": "Bybit Kripto Varlık Alım Satım Platformu AŞ",
          "type": "Transitional operating list",
          "note": "Named in the transitional operating list; SPK explicitly says inclusion does not mean authorisation."
        },
        "sourceUrls": [
          "https://www.spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi"
        ],
        "checkedOn": "2026-10-14"
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
        "id": "license-AR-CNV",
        "value": {
          "jurisdiction": "AR",
          "regulator": "CNV",
          "status": "registered",
          "entity": "BTGT INNOVACION S.A.",
          "type": "PSAV registration",
          "note": "Registered in CNV PSAV register; not represented as a full exchange licence."
        },
        "sourceUrls": [
          "https://www.cnv.gov.ar/SitioWeb/Reportes/ListadoRegistrosPsav"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-AU-AUSTRAC",
        "value": {
          "jurisdiction": "AU",
          "regulator": "AUSTRAC",
          "status": "registered",
          "entity": "BTGT AUS PTY LTD",
          "type": "VASP AML/CTF registration",
          "note": "Returned legal name with trading name Bitget."
        },
        "sourceUrls": [
          "https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=Bitget&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-JP-Japan FSA",
        "value": {
          "jurisdiction": "JP",
          "regulator": "Japan FSA",
          "status": "warning",
          "entity": "Bitget Limited",
          "type": "Unregistered overseas operator warning",
          "note": "FSA warning list records November 2024 notice for unregistered services to Japanese residents. Historical warning does not establish current operations."
        },
        "sourceUrls": [
          "https://www.fsa.go.jp/ordinary/chuui/angoushisan_mutouroku.html"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-TR-SPK",
        "value": {
          "jurisdiction": "TR",
          "regulator": "SPK",
          "status": "liquidation list",
          "entity": "Bitget Teknoloji AŞ",
          "type": "Transitional liquidation list",
          "note": "Named in the list of organisations that will not continue crypto-asset services."
        },
        "sourceUrls": [
          "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/tasfiye-surecinde-olanlar-listesi"
        ],
        "checkedOn": "2026-10-14"
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
        "id": "license-AR-CNV",
        "value": {
          "jurisdiction": "AR",
          "regulator": "CNV",
          "status": "registered",
          "entity": "Coinbase Bermuda Services Limited",
          "type": "PSAV registration",
          "note": "Registered in CNV PSAV register; not represented as a full exchange licence."
        },
        "sourceUrls": [
          "https://www.cnv.gov.ar/SitioWeb/Reportes/ListadoRegistrosPsav"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-AU-AUSTRAC",
        "value": {
          "jurisdiction": "AU",
          "regulator": "AUSTRAC",
          "status": "registered",
          "entity": "COINBASE AUSTRALIA PTY LTD",
          "type": "VASP AML/CTF registration",
          "note": "Returned registered VASP legal name."
        },
        "sourceUrls": [
          "https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=Coinbase&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-CA-Canadian Securities Administrators (CSA)",
        "value": {
          "jurisdiction": "CA",
          "regulator": "Canadian Securities Administrators (CSA)",
          "status": "authorised",
          "entity": "Coinbase Canada Inc.",
          "type": "Authorised crypto asset trading platform",
          "note": "The CSA authorised-platform list names Coinbase Canada Inc., links its April 3, 2024 decision and April 1, 2026 amended decision; list last updated September 18, 2026. No licence number is printed in this list."
        },
        "sourceUrls": [
          "https://www.securities-administrators.ca/crypto-platforms-regulation-and-enforcement-actions/crypto-platforms-authorized-to-do-business-with-canadians/"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-EU-Commission de Surveillance du Secteur Financier (CSSF)",
        "value": {
          "jurisdiction": "EU",
          "regulator": "Commission de Surveillance du Secteur Financier (CSSF)",
          "status": "licensed",
          "entity": "Coinbase Luxembourg S.A.",
          "type": "MiCA crypto-asset service provider authorisation",
          "note": "National MiCA authorisation; service and passport scope is entity-specific. See the official register."
        },
        "sourceUrls": [
          "https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-IN-FIU-IND",
        "value": {
          "jurisdiction": "IN",
          "regulator": "FIU-IND",
          "status": "registered",
          "entity": "Coinbase India Private Limited",
          "type": "VDA reporting entity registration (AML/CFT only); official snapshot 2026-03-09",
          "note": "Registered reporting entity — snapshot 2026-03-09"
        },
        "sourceUrls": [
          "https://sansad.in/getFile/loksabhaquestions/annex/187/AU5805_lMTYNK.pdf?source=pqals"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-JP-Japan FSA",
        "value": {
          "jurisdiction": "JP",
          "regulator": "Japan FSA",
          "status": "registered",
          "entity": "Coinbase株式会社",
          "type": "Crypto-asset Exchange Service Provider",
          "note": "Registered, but asset column says no assets handled; availability not established."
        },
        "sourceUrls": [
          "https://www.fsa.go.jp/menkyo/menkyoj/kasoutuka.pdf"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-SG-MAS",
        "value": {
          "jurisdiction": "SG",
          "regulator": "MAS",
          "status": "licensed",
          "entity": "COINBASE SINGAPORE PTE. LTD.",
          "type": "Major Payment Institution — Digital Payment Token Service",
          "note": "MAS institution detail lists Major Payment Institution status with Digital Payment Token Service and Cross-border Money Transfer Service. No licence number is printed; the URL identifier is not a licence number."
        },
        "sourceUrls": [
          "https://eservices.mas.gov.sg/fid/institution/detail/235467-COINBASE-SINGAPORE-PTE-LTD"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-TR-SPK",
        "value": {
          "jurisdiction": "TR",
          "regulator": "SPK",
          "status": "liquidation list",
          "entity": "Tasfiye Halinde Coinbase Turkey Yazılım Teknolojileri AŞ",
          "type": "Transitional liquidation list",
          "note": "Named in the list of organisations that will not continue crypto-asset services."
        },
        "sourceUrls": [
          "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/tasfiye-surecinde-olanlar-listesi"
        ],
        "checkedOn": "2026-10-14"
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
        "id": "license-AE-Dubai VARA",
        "value": {
          "jurisdiction": "AE",
          "regulator": "Dubai VARA",
          "status": "licensed",
          "entity": "Payward FZCO",
          "type": "VASP Licence (Broker-Dealer, Management and Investment)",
          "note": "Active; issued 2026-10-06. Register website identifies Kraken; retail, qualified and institutional investors permitted. No exchange-service licence listed."
        },
        "sourceUrls": [
          "https://www.vara.ae/en/licenses-and-register/public-register/payward-fzco/"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-AE-ADGM FSRA",
        "value": {
          "jurisdiction": "AE",
          "regulator": "ADGM FSRA",
          "status": "withdrawn",
          "entity": "Payward MENA Holdings Limited",
          "type": "Withdrawn Financial Services Permission",
          "note": "Withdrawn 2025-12-19; virtual-asset multilateral trading facility and custody permissions both withdrawn. This historical ADGM permission is not current authorisation. Separate Payward FZCO VARA record is active."
        },
        "sourceUrls": [
          "https://www.adgm.com/public-registers/fsra/firms/financial-firms/payward-mena-holdings-limited-190008"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-AR-CNV",
        "value": {
          "jurisdiction": "AR",
          "regulator": "CNV",
          "status": "registered",
          "entity": "Payward Trading Ltd. - SSE",
          "type": "PSAV registration",
          "note": "Registered in CNV PSAV register; not represented as a full exchange licence."
        },
        "sourceUrls": [
          "https://www.cnv.gov.ar/SitioWeb/Reportes/ListadoRegistrosPsav"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-AU-AUSTRAC",
        "value": {
          "jurisdiction": "AU",
          "regulator": "AUSTRAC",
          "status": "registered",
          "entity": "BIT TRADE PTY LIMITED",
          "type": "VASP AML/CTF registration",
          "note": "Returned legal name with trading names KRAKEN DIGITAL ASSET EXCHANGE, KRAKEN EXCHANGE and PAYWARD AUSTRALIA."
        },
        "sourceUrls": [
          "https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=Kraken&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-CA-Canadian Securities Administrators (CSA)",
        "value": {
          "jurisdiction": "CA",
          "regulator": "Canadian Securities Administrators (CSA)",
          "status": "authorised",
          "entity": "Payward Canada Inc. (Kraken)",
          "type": "Authorised crypto asset trading platform",
          "note": "The CSA authorised-platform list names Payward Canada Inc. (Kraken), with its April 1, 2025 decision. List last updated September 18, 2026. No licence number is printed in this list."
        },
        "sourceUrls": [
          "https://www.securities-administrators.ca/crypto-platforms-regulation-and-enforcement-actions/crypto-platforms-authorized-to-do-business-with-canadians/"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-EU-Central Bank of Ireland (CBI)",
        "value": {
          "jurisdiction": "EU",
          "regulator": "Central Bank of Ireland (CBI)",
          "status": "licensed",
          "entity": "Payward Global Solutions Limited",
          "type": "MiCA crypto-asset service provider authorisation",
          "note": "Operation of a trading platform only; listed service countries are Cyprus and Ireland."
        },
        "sourceUrls": [
          "https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-EU-Central Bank of Ireland (CBI)",
        "value": {
          "jurisdiction": "EU",
          "regulator": "Central Bank of Ireland (CBI)",
          "status": "licensed",
          "entity": "Payward Europe Solutions Limited",
          "type": "MiCA crypto-asset service provider authorisation",
          "note": "National MiCA authorisation; service and passport scope is entity-specific. See the official register."
        },
        "sourceUrls": [
          "https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv"
        ],
        "checkedOn": "2026-10-14"
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
        "id": "license-AE-Dubai VARA",
        "value": {
          "jurisdiction": "AE",
          "regulator": "Dubai VARA",
          "status": "licensed",
          "entity": "Gate Technology FZE",
          "type": "VASP Licence (Exchange Services)",
          "note": "Active; issued 2025-04-25. Retail, qualified and institutional investors permitted; register website identifies Gate Dubai."
        },
        "sourceUrls": [
          "https://www.vara.ae/en/licenses-and-register/public-register/gate-technology-fze/"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-EU-Malta Financial Services Authority (MFSA)",
        "value": {
          "jurisdiction": "EU",
          "regulator": "Malta Financial Services Authority (MFSA)",
          "status": "licensed",
          "entity": "Gate Technology Limited",
          "type": "MiCA crypto-asset service provider authorisation",
          "note": "National MiCA authorisation; service and passport scope is entity-specific. See the official register."
        },
        "sourceUrls": [
          "https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-HK-SFC",
        "value": {
          "jurisdiction": "HK",
          "regulator": "SFC",
          "status": "withdrawn",
          "entity": "Gate Digital Limited",
          "type": "Virtual asset trading platform (VATP)",
          "note": "Application submitted 2024-02-28; removed 2024-05-22, reason Withdrawn."
        },
        "sourceUrls": [
          "https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Virtual-asset-trading-platforms-operators/Lists-of-virtual-asset-trading-platforms"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-JP-Japan FSA",
        "value": {
          "jurisdiction": "JP",
          "regulator": "Japan FSA",
          "status": "registered",
          "entity": "Gate Japan株式会社",
          "type": "Crypto-asset Exchange Service Provider",
          "note": "Registered, but asset column says no assets handled; availability not established."
        },
        "sourceUrls": [
          "https://www.fsa.go.jp/menkyo/menkyoj/kasoutuka.pdf"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-TR-SPK",
        "value": {
          "jurisdiction": "TR",
          "regulator": "SPK",
          "status": "applied",
          "entity": "Gate Kripto Varlık Alım Satım Platformu AŞ",
          "type": "Transitional operating list",
          "note": "Named in the transitional operating list; SPK explicitly says inclusion does not mean authorisation."
        },
        "sourceUrls": [
          "https://www.spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi"
        ],
        "checkedOn": "2026-10-14"
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
        "id": "license-AE-Dubai VARA",
        "value": {
          "jurisdiction": "AE",
          "regulator": "Dubai VARA",
          "status": "warning",
          "entity": "MX Holdings Ltd",
          "type": "VARA enforcement register — cease-and-desist and penalties (2026-06-17)",
          "note": "VARA enforcement table lists MX Holdings Ltd (MEXC), cease-and-desist and penalties dated 2026-06-17. Dubai scope; no current authorisation established."
        },
        "sourceUrls": [
          "https://www.vara.ae/en/enforcement/"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-JP-Japan FSA",
        "value": {
          "jurisdiction": "JP",
          "regulator": "Japan FSA",
          "status": "warning",
          "entity": "MEXC Global",
          "type": "Unregistered overseas operator warning",
          "note": "FSA warning list records November 2024 notice for unregistered services to Japanese residents. Historical warning does not establish current operations."
        },
        "sourceUrls": [
          "https://www.fsa.go.jp/ordinary/chuui/angoushisan_mutouroku.html"
        ],
        "checkedOn": "2026-10-14"
      },
      {
        "id": "license-TR-SPK",
        "value": {
          "jurisdiction": "TR",
          "regulator": "SPK",
          "status": "applied",
          "entity": "Mexc Kripto Varlık Alım Satım Platformu AŞ",
          "type": "Transitional operating list",
          "note": "Named in the transitional operating list; SPK explicitly says inclusion does not mean authorisation."
        },
        "sourceUrls": [
          "https://www.spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi"
        ],
        "checkedOn": "2026-10-14"
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
        "id": "license-HK-SFC",
        "value": {
          "jurisdiction": "HK",
          "regulator": "SFC",
          "status": "withdrawn",
          "entity": "HBGL Hong Kong Limited",
          "type": "Virtual asset trading platform (VATP)",
          "note": "Application submitted 2024-02-26; removed 2024-05-14, reason Withdrawn. Earlier application withdrawn 2024-02-23."
        },
        "sourceUrls": [
          "https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Virtual-asset-trading-platforms-operators/Lists-of-virtual-asset-trading-platforms"
        ],
        "checkedOn": "2026-10-14"
      },
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
        "id": "license-AU-AUSTRAC",
        "value": {
          "jurisdiction": "AU",
          "regulator": "AUSTRAC",
          "status": "registered",
          "entity": "LCT HOLDING AU PTY LTD",
          "type": "VASP AML/CTF registration",
          "note": "Returned legal name with trading name CoinW; unrelated COINWORLD PTY LTD result excluded."
        },
        "sourceUrls": [
          "https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=CoinW&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true"
        ],
        "checkedOn": "2026-10-14"
      },
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
          "entity": "HashKey Japan株式会社",
          "type": "Crypto-asset Exchange Service Provider",
          "note": "Register lists HashKey Japan with BTC and ETH."
        },
        "sourceUrls": [
          "https://www.fsa.go.jp/menkyo/menkyoj/kasoutuka.pdf"
        ],
        "checkedOn": "2026-10-14"
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
