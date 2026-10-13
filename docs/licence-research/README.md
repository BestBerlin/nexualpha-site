# Official register research

Checked dates are retrieval dates, not an assertion that an older register snapshot is current. Unreadable registers add no entity rows. Historical rows retain their original check dates unless explicitly replaced.

| Jurisdiction | Added records | Coverage |
| --- | ---: | --- |
| AE | 9 | VARA Dubai excludes DIFC; ADGM permissions are separate entity-specific authorisations. Seven current authorised records across four brands, two non-authorised historical/warning rows. Bybit IPA unverified; no claim of no licence outside checked registers. No sourced fiat rail data added. |
| AR | 6 | Six target venues matched by official register entity and website. Other target venues did not yield a matched row; this is not a claim of absence or illegality. PSAV registration alone is not treated as an authorised licence or CTA permission. No fiat rail claim is made. |
| AU | 7 | AUSTRAC public VASP register was read directly on the checked date. Seven rows cover six brands. AML/CTF registration is not a financial-services authorisation or endorsement, so all rows have authorised:false. No registration number was printed in the fetched search data; ABN/ACN and internal record IDs are intentionally not used as licence numbers. Python urllib requests returned application Error 403; curl requests returned the register data. The initial Coinbase query with pageSize=200 returned HTTP 500; the normal application pageSize=20 succeeded. Gate entity mapping is unresolved. No Bybit, HTX or MEXC positive record was established by the checked brand queries. No fiat rails were researched. |
| BR | 0 | No authorised Brazil virtual-asset licence row was verified for OKX, Binance, Bybit, Bitget, Kraken, HTX, CoinW, Gate, MEXC or Coinbase in this run. This is an evidence gap, not a claim that these venues are unlicensed. Do not infer a crypto licence from payment, foreign-exchange, securities, company or tax registration; no licence number or local fiat rail is asserted. |
| CA | 2 | CA evidence uses the CSA authorised-platform list, not FINTRAC AML registration as a crypto dealer licence. Exact current FINTRAC rows could not be read. No local fiat rails researched; no authorisation inferred for unmatched partner names. |
| EU | 6 | EU is a regional MiCA register, not a national licence. National authorities grant authorisations; services and passport countries differ by entity. No matching requested-brand rows found for Binance, Bitget, HTX, CoinW or MEXC in this snapshot; absence is not proof of a ban. No fiat rail claims sourced. Preserve the separate Kraken entity service scopes; Payward Global Solutions Limited lists trading platform service only for CY and IE. |
| GB | 0 | The FCA cryptoasset register was unreadable during this bounded check. No current UK entity-level cryptoasset registration was verified for OKX, Binance, Bybit, Bitget, Kraken, HTX, CoinW, Gate, MEXC or Coinbase, and no numbers or rows are inferred from search snippets, prior knowledge, investment-firm permissions or marketing claims. This evidence gap does not establish that any venue lacks registration or is prohibited. FCA AML cryptoasset registration alone would not be treated as an authorised investment licence or permission to enable a signup CTA. |
| HK | 4 | No partner appears in the licensed VATP table. Withdrawn records are historical applications, not current permissions. Bybit is a current applicant. Other requested partners were not identified; absence is not a legal determination. Huobi HK is mapped to the HTX brand; this does not imply group-wide authorisation. |
| ID | 0 | No direct partner-brand authorization has been verified for Indonesia from the fetched official registers. This is an evidence limitation, not proof that every partner is prohibited or unlicensed. Do not assign Tokocrypto authorization to Binance or enable a partner CTA from affiliate inference. The readable whitelist is older than the inaccessible May 2026 attachment. |
| IN | 3 | These are historical official registration observations, not current trading licences. No partner CTA is authorised. The parliamentary answer includes historical takedown directions separately; they cannot establish present registration or prohibition. Other partner statuses remain unverified. |
| JP | 8 | No direct entries matched Kraken or CoinW; BitTrade is listed but HTX brand relationship is not established by this register, so omitted. Gate and Coinbase have registrations but no assets handled: no CTA. OKCoin Japan row preserves existing OKX association; registration belongs solely to the named local entity. Binance Holdings historical warning is separate from Binance Japan registration. No local fiat rail claims verified. |
| KR | 0 | KoFIU VASP list attachment was unreadable during this check. Zero partner records verified; no inference of absence, authorisation, or registration number. FIU registration is AML reporting scope and would not itself qualify a partner for an authorised CTA. |
| MX | 0 | No partner entity-level crypto authorisation was verified in the bounded official-register checks. CNBV legal-name searches do not establish that partners or affiliates lack authorisation; no licence numbers or authorisation rows are inferred. Banco de México Circular 4/2019 is contextual and does not verify any partner licence. |
| NG | 0 | As of 14 October 2026, no licence row for OKX, Binance, Bybit, Bitget, Kraken, HTX, CoinW, Gate, MEXC or Coinbase was verified from the SEC Nigeria registers retrieved for this check. The readable FinPort directory concerns RI/ARIP incubation participants, which must not be represented as unrestricted final licences. This scoped check does not establish that any venue is unregistered, illegal, eligible to serve Nigerian residents, or safe to use. Do not render an authorised status or a signup CTA from this evidence. |
| PH | 0 | Partner-only research scope: OKX, Binance, Bybit, Bitget, Kraken, HTX, CoinW, Gate, MEXC and Coinbase. No directly verified partner authorisation record added for PH. BSP directory readable; SEC evidence inaccessible. Absence of a matched name from this scoped directory is not evidence of absence across all Philippine registrations. Do not show authorised claims or authorised CTAs from this result. |
| PK | 0 | No Pakistan licence rows added: a readable PVARA licensee register was not located in bounded official-site searches. PVARA news names Binance and HTX as historical NOC recipients; its licensing FAQ says an NOC does not authorise virtual asset services. Those announcements are not accepted as register evidence. This research does not establish current licence status or absence for any requested venue. |
| SG | 2 | Refreshed both existing OKX and Coinbase rows from readable MAS institution detail entries. Binance, Bybit, Bitget, Kraken, HTX, CoinW, Gate and MEXC are omitted because no matching authorised entity was established from the register reviewed. No invented licence numbers or unsupported negative status rows; no sourced local fiat rails added. |
| TH | 1 | Gulf Binance / BINANCE TH is a locally licensed exchange and broker; the Binance row is scoped to that entity and deliberately cannot enable an international Binance CTA. No direct authorization was verified for OKX, Bybit, Bitget, Kraken, HTX, CoinW, Gate, MEXC or Coinbase from the fetched lists; this is a verification limitation, not a finding that every venue is prohibited. No sourced fiat-rail detail was verified. |
| TR | 7 | Seven partner entity matches were found across the two complete official transitional lists. None establishes authorisation. No licence numbers are asserted: row ordinals are not licence numbers. Kraken, HTX and CoinW were not matched; this does not establish that they are unlicensed. No local fiat rails were verified. |
| UA | 0 | No partner venue authorization rows are added: the official sources fetched are regulatory context, not an operational VASP register. The September 2026 NSSMC statement treats authorization infrastructure as planned. This does not establish an individual venue ban, restriction, application or absence from all possible registers. Do not present draft legislation, availability to Ukrainian users, or foreign licences as Ukrainian authorization; keep commercial CTA fail-closed. |
| VN | 0 | No partner venue licence records verified from a readable Ministry of Finance register in this check; this is an evidence gap, not a finding of non-registration. Resolution 05/2025/NQ-CP Article 4(4) permits crypto-asset advertising and marketing only by MoF-licensed organisations. Suppress all promotional CTAs for Vietnam under the brief; do not claim a blanket prohibition on licensed organisations. |

## Added records

| Venue | Country | Entity | Status / type | Number printed | Official source | Checked |
| --- | --- | --- | --- | --- | --- | --- |
| okx | AE | OKX Middle East Fintech FZE | licensed: VASP Licence (Exchange, Broker-Dealer, Lending and Borrowing, Management and Investment) | VL/23/12/003 | [Register](https://www.vara.ae/en/licenses-and-register/public-register/okx-middle-east-fintech-fze/) | 2026-10-14 |
| binance | AE | Binance FZE | licensed: VASP Licence (Exchange, Broker-Dealer, Lending and Borrowing, Management and Investment) | VL/24/04/001 | [Register](https://www.vara.ae/en/licenses-and-register/public-register/binance-fze/) | 2026-10-14 |
| kraken | AE | Payward FZCO | licensed: VASP Licence (Broker-Dealer, Management and Investment) | VL/26/10/002 | [Register](https://www.vara.ae/en/licenses-and-register/public-register/payward-fzco/) | 2026-10-14 |
| gate-io | AE | Gate Technology FZE | licensed: VASP Licence (Exchange Services) | VL/25/04/007 | [Register](https://www.vara.ae/en/licenses-and-register/public-register/gate-technology-fze/) | 2026-10-14 |
| binance | AE | Nest Exchange Limited | licensed: Recognised Investment Exchange (Multilateral Trading Facility) | 0072 | [Register](https://www.adgm.com/public-registers/fsra/firms/recognized-bodies/nest-services-limited) | 2026-10-14 |
| binance | AE | Nest Clearing and Custody Limited | licensed: Recognised Clearing House (Custody and Central Securities Depository) | 0070 | [Register](https://www.adgm.com/public-registers/fsra/firms/recognized-bodies/nest-clearing-and-custody-limited) | 2026-10-14 |
| binance | AE | Nest Trading Limited | licensed: Financial Services Permission | 260000 | [Register](https://www.adgm.com/public-registers/fsra/firms/financial-firms/nest-trading-limited-260000) | 2026-10-14 |
| kraken | AE | Payward MENA Holdings Limited | withdrawn: Withdrawn Financial Services Permission | 190008 | [Register](https://www.adgm.com/public-registers/fsra/firms/financial-firms/payward-mena-holdings-limited-190008) | 2026-10-14 |
| mexc | AE | MX Holdings Ltd | warning: VARA enforcement register — cease-and-desist and penalties (2026-06-17) | Not printed / not verified | [Register](https://www.vara.ae/en/enforcement/) | 2026-10-14 |
| bybit | AR | LUZPAY S.A. | registered: PSAV registration | 48 | [Register](https://www.cnv.gov.ar/SitioWeb/Reportes/ListadoRegistrosPsav) | 2026-10-14 |
| binance | AR | BINANCE SERVICES LATINOAMÉRICA S.A. DE C.V. -S.S.E | registered: PSAV registration | 76 | [Register](https://www.cnv.gov.ar/SitioWeb/Reportes/ListadoRegistrosPsav) | 2026-10-14 |
| coinbase | AR | Coinbase Bermuda Services Limited | registered: PSAV registration | 104 | [Register](https://www.cnv.gov.ar/SitioWeb/Reportes/ListadoRegistrosPsav) | 2026-10-14 |
| okx | AR | OKX Fintech, S.A. de C.V. (Sucursal Argentina) | registered: PSAV registration | 141 | [Register](https://www.cnv.gov.ar/SitioWeb/Reportes/ListadoRegistrosPsav) | 2026-10-14 |
| kraken | AR | Payward Trading Ltd. - SSE | registered: PSAV registration | 155 | [Register](https://www.cnv.gov.ar/SitioWeb/Reportes/ListadoRegistrosPsav) | 2026-10-14 |
| bitget | AR | BTGT INNOVACION S.A. | registered: PSAV registration | 168 | [Register](https://www.cnv.gov.ar/SitioWeb/Reportes/ListadoRegistrosPsav) | 2026-10-14 |
| okx | AU | OKX AUSTRALIA FINANCIAL PTY LTD | registered: VASP AML/CTF registration | Not printed / not verified | [Register](https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=OKX&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true) | 2026-10-14 |
| okx | AU | OKX AUSTRALIA PTY LTD | registered: VASP AML/CTF registration | Not printed / not verified | [Register](https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=OKX&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true) | 2026-10-14 |
| binance | AU | INVESTBYBIT PTY LTD | registered: VASP AML/CTF registration | Not printed / not verified | [Register](https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=Binance&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true) | 2026-10-14 |
| bitget | AU | BTGT AUS PTY LTD | registered: VASP AML/CTF registration | Not printed / not verified | [Register](https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=Bitget&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true) | 2026-10-14 |
| kraken | AU | BIT TRADE PTY LIMITED | registered: VASP AML/CTF registration | Not printed / not verified | [Register](https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=Kraken&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true) | 2026-10-14 |
| coinw | AU | LCT HOLDING AU PTY LTD | registered: VASP AML/CTF registration | Not printed / not verified | [Register](https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=CoinW&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true) | 2026-10-14 |
| coinbase | AU | COINBASE AUSTRALIA PTY LTD | registered: VASP AML/CTF registration | Not printed / not verified | [Register](https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=Coinbase&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true) | 2026-10-14 |
| coinbase | CA | Coinbase Canada Inc. | authorised: Authorised crypto asset trading platform | Not printed / not verified | [Register](https://www.securities-administrators.ca/crypto-platforms-regulation-and-enforcement-actions/crypto-platforms-authorized-to-do-business-with-canadians/) | 2026-10-14 |
| kraken | CA | Payward Canada Inc. (Kraken) | authorised: Authorised crypto asset trading platform | Not printed / not verified | [Register](https://www.securities-administrators.ca/crypto-platforms-regulation-and-enforcement-actions/crypto-platforms-authorized-to-do-business-with-canadians/) | 2026-10-14 |
| bybit | EU | Bybit EU GmbH | licensed: MiCA crypto-asset service provider authorisation | Not printed / not verified | [Register](https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv) | 2026-10-14 |
| kraken | EU | Payward Global Solutions Limited | licensed: MiCA crypto-asset service provider authorisation | Not printed / not verified | [Register](https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv) | 2026-10-14 |
| kraken | EU | Payward Europe Solutions Limited | licensed: MiCA crypto-asset service provider authorisation | Not printed / not verified | [Register](https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv) | 2026-10-14 |
| coinbase | EU | Coinbase Luxembourg S.A. | licensed: MiCA crypto-asset service provider authorisation | Not printed / not verified | [Register](https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv) | 2026-10-14 |
| okx | EU | OKX Europe Limited | licensed: MiCA crypto-asset service provider authorisation | Not printed / not verified | [Register](https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv) | 2026-10-14 |
| gate-io | EU | Gate Technology Limited | licensed: MiCA crypto-asset service provider authorisation | Not printed / not verified | [Register](https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv) | 2026-10-14 |
| bybit | HK | Spark Fintech Limited | applied: Virtual asset trading platform (VATP) | Not printed / not verified | [Register](https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Virtual-asset-trading-platforms-operators/Lists-of-virtual-asset-trading-platforms) | 2026-10-14 |
| okx | HK | OKX Hong Kong FinTech Company Limited | withdrawn: Virtual asset trading platform (VATP) | Not printed / not verified | [Register](https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Virtual-asset-trading-platforms-operators/Lists-of-virtual-asset-trading-platforms) | 2026-10-14 |
| gate-io | HK | Gate Digital Limited | withdrawn: Virtual asset trading platform (VATP) | Not printed / not verified | [Register](https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Virtual-asset-trading-platforms-operators/Lists-of-virtual-asset-trading-platforms) | 2026-10-14 |
| htx | HK | HBGL Hong Kong Limited | withdrawn: Virtual asset trading platform (VATP) | Not printed / not verified | [Register](https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Virtual-asset-trading-platforms-operators/Lists-of-virtual-asset-trading-platforms) | 2026-10-14 |
| binance | IN | Nest Services Limited (Earlier Binance International Limited) | registered: VDA reporting entity registration (AML/CFT only); official snapshot 2026-03-09 | Not printed / not verified | [Register](https://sansad.in/getFile/loksabhaquestions/annex/187/AU5805_lMTYNK.pdf?source=pqals) | 2026-10-14 |
| bybit | IN | Bybit Fintech Limited | registered: VDA reporting entity registration (AML/CFT only); official snapshot 2026-03-09 | Not printed / not verified | [Register](https://sansad.in/getFile/loksabhaquestions/annex/187/AU5805_lMTYNK.pdf?source=pqals) | 2026-10-14 |
| coinbase | IN | Coinbase India Private Limited | registered: VDA reporting entity registration (AML/CFT only); official snapshot 2026-03-09 | Not printed / not verified | [Register](https://sansad.in/getFile/loksabhaquestions/annex/187/AU5805_lMTYNK.pdf?source=pqals) | 2026-10-14 |
| okx | JP | オーケーコイン・ジャパン株式会社 | registered: Crypto-asset Exchange Service Provider | 関東財務局長 第00020号 | [Register](https://www.fsa.go.jp/menkyo/menkyoj/kasoutuka.pdf) | 2026-10-14 |
| binance | JP | Binance Japan株式会社 | registered: Crypto-asset Exchange Service Provider | 関東財務局長 第00031号 | [Register](https://www.fsa.go.jp/menkyo/menkyoj/kasoutuka.pdf) | 2026-10-14 |
| hashkey | JP | HashKey Japan株式会社 | registered: Crypto-asset Exchange Service Provider | 関東財務局長 第00027号 | [Register](https://www.fsa.go.jp/menkyo/menkyoj/kasoutuka.pdf) | 2026-10-14 |
| gate-io | JP | Gate Japan株式会社 | registered: Crypto-asset Exchange Service Provider | 関東財務局長 第00018号 | [Register](https://www.fsa.go.jp/menkyo/menkyoj/kasoutuka.pdf) | 2026-10-14 |
| coinbase | JP | Coinbase株式会社 | registered: Crypto-asset Exchange Service Provider | 関東財務局長 第00028号 | [Register](https://www.fsa.go.jp/menkyo/menkyoj/kasoutuka.pdf) | 2026-10-14 |
| bybit | JP | Bybit Fintech Limited | warning: Unregistered overseas operator warning | Not printed / not verified | [Register](https://www.fsa.go.jp/ordinary/chuui/angoushisan_mutouroku.html) | 2026-10-14 |
| bitget | JP | Bitget Limited | warning: Unregistered overseas operator warning | Not printed / not verified | [Register](https://www.fsa.go.jp/ordinary/chuui/angoushisan_mutouroku.html) | 2026-10-14 |
| mexc | JP | MEXC Global | warning: Unregistered overseas operator warning | Not printed / not verified | [Register](https://www.fsa.go.jp/ordinary/chuui/angoushisan_mutouroku.html) | 2026-10-14 |
| okx | SG | OKX SG PTE. LTD. | licensed: Major Payment Institution — Digital Payment Token Service | Not printed / not verified | [Register](https://eservices.mas.gov.sg/fid/institution/detail/422854-OKX-SG-PTE-LTD) | 2026-10-14 |
| coinbase | SG | COINBASE SINGAPORE PTE. LTD. | licensed: Major Payment Institution — Digital Payment Token Service | Not printed / not verified | [Register](https://eservices.mas.gov.sg/fid/institution/detail/235467-COINBASE-SINGAPORE-PTE-LTD) | 2026-10-14 |
| binance | TH | GULF BINANCE COMPANY LIMITED (BINANCE TH only) | licensed: Digital Asset Exchange and Digital Asset Broker (local BINANCE TH) | Not printed / not verified | [Register](https://market.sec.or.th/LicenseCheck/views/DABusiness) | 2026-10-14 |
| binance | TR | Binance Turkey Kripto Varlık Alım Satım Platformu AŞ | applied: Transitional operating list | Not printed / not verified | [Register](https://www.spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi) | 2026-10-14 |
| bybit | TR | Bybit Kripto Varlık Alım Satım Platformu AŞ | applied: Transitional operating list | Not printed / not verified | [Register](https://www.spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi) | 2026-10-14 |
| gate-io | TR | Gate Kripto Varlık Alım Satım Platformu AŞ | applied: Transitional operating list | Not printed / not verified | [Register](https://www.spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi) | 2026-10-14 |
| mexc | TR | Mexc Kripto Varlık Alım Satım Platformu AŞ | applied: Transitional operating list | Not printed / not verified | [Register](https://www.spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi) | 2026-10-14 |
| okx | TR | OKX TR Kripto Varlık Alım Satım Platformu AŞ | applied: Transitional operating list | Not printed / not verified | [Register](https://www.spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi) | 2026-10-14 |
| bitget | TR | Bitget Teknoloji AŞ | liquidation list: Transitional liquidation list | Not printed / not verified | [Register](https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/tasfiye-surecinde-olanlar-listesi) | 2026-10-14 |
| coinbase | TR | Tasfiye Halinde Coinbase Turkey Yazılım Teknolojileri AŞ | liquidation list: Transitional liquidation list | Not printed / not verified | [Register](https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/tasfiye-surecinde-olanlar-listesi) | 2026-10-14 |

## Register access evidence

### AE

- [Official source](https://www.vara.ae/en/licenses-and-register/public-register/okx-middle-east-fintech-fze/): **readable** — Official individual register entry fetched; entity, identifier and current status checked.
- [Official source](https://www.vara.ae/en/licenses-and-register/public-register/binance-fze/): **readable** — Official individual register entry fetched; entity, identifier and current status checked.
- [Official source](https://www.vara.ae/en/licenses-and-register/public-register/payward-fzco/): **readable** — Official individual register entry fetched; entity, identifier and current status checked.
- [Official source](https://www.vara.ae/en/licenses-and-register/public-register/gate-technology-fze/): **readable** — Official individual register entry fetched; entity, identifier and current status checked.
- [Official source](https://www.adgm.com/public-registers/fsra/firms/recognized-bodies/nest-services-limited): **readable** — Official individual register entry fetched; entity, identifier and current status checked.
- [Official source](https://www.adgm.com/public-registers/fsra/firms/recognized-bodies/nest-clearing-and-custody-limited): **readable** — Official individual register entry fetched; entity, identifier and current status checked.
- [Official source](https://www.adgm.com/public-registers/fsra/firms/financial-firms/nest-trading-limited-260000): **readable** — Official individual register entry fetched; entity, identifier and current status checked.
- [Official source](https://www.adgm.com/public-registers/fsra/firms/financial-firms/payward-mena-holdings-limited-190008): **readable** — Official withdrawal entry or warning fetched; no CTA eligibility.
- [Official source](https://www.vara.ae/en/regulations/regulatory-notices/vara-investor-and-marketplace-alert-mexc-estonia-oue-and-mexc-global-ltd-commercially-advertising-as-mexc/): **readable** — Official withdrawal entry or warning fetched; no CTA eligibility.
- [Official source](https://www.vara.ae/en/licenses-and-register/public-register/): **readable** — 58 licensed VASP entries rendered. Original OKX, Binance and Payward FZCO records verified against individual entries. No current partner records identified for Bitget, CoinW, HTX or Coinbase; absence from this rendered list is not a legal prohibition.
- [Official source](https://www.vara.ae/en/licenses-and-register/public-register/bybit-fintech-fze/): **skipped** — Individual entry unavailable through web fetch, including trailing-slash variant. IPA toggle did not expose IPA records; historical Bybit claims not revalidated and not added.
- [Official source](https://www.vara.ae/en/licenses-and-register/public-register/ht-markets-mena-fze/): **excluded** — Register links hextrust.com; entity belongs to Hex Trust, not HTX. Do not map by initials.
- [Official source](https://www.vara.ae/en/enforcement/): **readable** — Enforcement table includes MX Holdings Ltd (MEXC), 2026-06-17, cease-and-desist and penalties. Entity wording differs from warning; stored warning row uses its exact named entities.

### AR

- [Official source](https://www.cnv.gov.ar/SitioWeb/RegistrosPublicos/Psav): **readable** — Official CNV register landing page exposes downloadable workbook.
- [Official source](https://www.cnv.gov.ar/SitioWeb/Reportes/ListadoRegistrosPsav): **readable** — Downloaded official XLSX successfully and parsed worksheet entries, including entity, registration number and website.
- [Official source](https://www.cnv.gov.ar/SitioWeb/ProveedoresServiciosActivosVirtuales/RegistrosPSAV): **skipped** — Web reader timed out twice; used official downloadable register instead.

### AU

- [Official source](https://www.austrac.gov.au/news-and-media/article/virtual-asset-service-provider-register-goes-public): **readable** — AUSTRAC announces the public VASP register; registration concerns AML/CTF oversight.
- [Official source](https://online.apps.austrac.gov.au/vaspr): **readable** — Public JavaScript application; its search endpoint returned official register data using curl. No login required.
- [Official source](https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=OKX&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true): **readable** — Two matching registered VASP entities.
- [Official source](https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=Binance&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true): **readable** — One matching registered entity with BINANCE AUSTRALIA trading name.
- [Official source](https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=Bybit&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true): **readable** — Only INVESTBYBIT PTY LTD / BINANCE AUSTRALIA returned; excluded as a Bybit match.
- [Official source](https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=BTGT&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true): **readable** — One matching registered entity with Bitget trading name.
- [Official source](https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=Kraken&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true): **readable** — One matching registered entity with Kraken trading names.
- [Official source](https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=HTX&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true): **readable** — No matching rows for this brand query; does not prove no registration under another name.
- [Official source](https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=CoinW&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true): **readable** — LCT HOLDING AU PTY LTD has CoinW trading name; unrelated COINWORLD result excluded.
- [Official source](https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=Gate&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true): **readable** — GATE INFORMATION PTY LTD and SALLIES ON RAMP GATEWAY PTY LTD returned, but no brand-identifying trading name; excluded pending entity mapping.
- [Official source](https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=MEXC&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true): **readable** — No matching rows for this brand query; does not prove no registration under another name.
- [Official source](https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=Coinbase&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true): **readable** — One matching registered VASP entity.
- [Official source](https://online.apps.austrac.gov.au/vaspr/remitters/?searchTerm=Bitget&page=0&orderBy=legalName&pageSize=20&direction=1&vasprSearch=true): **readable** — One matching registered entity with Bitget trading name.

### BR

- [Official source](https://bcb.gov.br/meubc/encontreinstituicao): **skipped** — Direct fetch returned only a JavaScript-required message; no named entity entries could be read.
- [Official source](https://dadosabertos.bcb.gov.br/pt_PT/dataset/dados-cadastrais-de-entidades-autorizadas): **readable_catalogue** — Official catalogue identifies BCBase as the source of authorised institution data and links the BCB OData API; this catalogue does not itself establish any partner venue authorisation.
- [Official source](https://olinda.bcb.gov.br/olinda/servico/BcBase/versao/v2/odata/TipoEntidadeSupervisionada?$format=json): **readable_dictionary** — Official dictionary includes type 50, Sociedade Prestadora de Serviços de Ativos Virtuais. Type definitions alone are not proof of entity authorisation.
- [Official source](https://olinda.bcb.gov.br/olinda/servico/BcBase/versao/v2/odata/_EntidadesSupervisionadas?$top=2&$format=json): **skipped** — Entity data fetch returned HTTP 500. Function endpoint attempts for checked date and previous day also returned HTTP 500, with both ISO and compact date parameters. No entity rows were available to verify.
- [Official source](https://sistemas.cvm.gov.br/asp/cvmwww/cadastro/formcad.asp?pag=ciaaberta): **skipped** — Participant search requires entering a CAPTCHA image. The readable form contains no result rows. A CVM securities registration would not by itself prove a BCB virtual-asset services authorisation.

### CA

- [Official source](https://www.securities-administrators.ca/crypto-platforms-regulation-and-enforcement-actions/crypto-platforms-authorized-to-do-business-with-canadians/): **read** — Complete official authorised-platform list fetched; Coinbase and Kraken are named. No matching names for OKX, Binance, Bybit, Bitget, HTX, CoinW, Gate or MEXC on this list; absence is not a definitive finding of illegality.
- [Official source](https://fintrac-canafe.canada.ca/msb-esm/reg-eng): **partial** — Official explanatory page readable, but JavaScript table rows unavailable in extracted response. FINTRAC says registration is not endorsement or licensing.
- [Official source](https://fintrac-canafe.canada.ca/msb-esm/reg-eng.csv): **skipped** — Web fetch rejected application/octet-stream; independent direct Python urllib fetch returned HTTP 403 Forbidden. No FINTRAC row or number inferred.
- [Official source](https://www.osc.ca/en/securities-law/orders-rulings-decisions/coinbase-canada-inc-and-coinbase-inc-0): **skipped** — CSA-linked amended decision returned HTTP 403 Forbidden. Current authorisation supported by accessible CSA list itself.
- [Official source](https://www.securities-administrators.ca/wp-content/uploads/2025/04/Payward-Canada-decision-document-signed-dated-April-1-2025.pdf): **read** — Official 63-page April 1, 2025 decision fetched; corroborates Payward Canada Inc. operates Kraken in Canada. Not used to invent a licence number.

### EU

- [Official source](https://www.esma.europa.eu/sites/default/files/2024-12/CASPS.csv): **readable** — Fetched official CSV directly; parsed 370 data rows. Six matching entity records for five requested exchange brands.
- [Official source](https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica): **readable** — Official register page identifies CASP CSV as authorised providers and displays last update 7 October 2026. ESMA warns that register publication can lag national registers.

### GB

- [Official source](https://www.fca.org.uk/firms/cryptoassets/registered-firms): **skipped** — Direct curl retrieval returned HTTP 403 and a Cloudflare interactive challenge headed One more step; web retrieval reported the page inaccessible. No register entries were readable.
- [Official source](https://register.fca.org.uk/s/search?predefined=CA): **skipped** — Direct curl retrieval returned HTTP 403; web retrieval showed only Loading / Sorry to interrupt / CSS Error and no register entries.
- [Official source](https://register.fca.org.uk/s/): **skipped** — Web retrieval showed only Loading / Sorry to interrupt / CSS Error and no register entries.

### HK

- [Official source](https://www.sfc.hk/en/Welcome-to-the-Fintech-Contact-Point/Virtual-assets/Virtual-asset-trading-platforms-operators/Lists-of-virtual-asset-trading-platforms): **readable** — Official SFC licensed, applicant and removed-applicant tables fetched directly; no licence numbers printed for these rows.

### ID

- [Official source](https://ojk.go.id/id/berita-dan-kegiatan/siaran-pers/Pages/OJK-Terbitkan-Whitelist-Penyelenggara-Perdagangan-Aset-Keuangan-Digital-Dan-Aset-Kripto-Berizin.aspx): **readable** — OJK whitelist dated 19 December 2025 was fetched. No direct OKX, Binance, Bybit, Bitget, Kraken, HTX, CoinW, Gate, MEXC or Coinbase platform entry was found. Tokocrypto (PT Aset Digital Berkat) is separately listed with S-14/D.07/2025, dated 1 February 2025; the register does not establish a Binance authorization.
- [Official source](https://ojk.go.id/id/Fungsi-Utama/ITSK/Perizinan-ITSK-Aset-Keuangan-Digital-Aset-Kripto/Pages/Daftar-Penyelenggara-Perdagangan-Aset-Keuangan-Digital-Posisi-25-Mei-2026.aspx): **readable-index-only** — The index page, published 26 May 2026, links a provider list as of 25 May 2026; provider rows are in an attachment and cannot be verified from the index alone.
- [Official source](https://ojk.go.id/id/Fungsi-Utama/ITSK/Perizinan-ITSK-Aset-Keuangan-Digital-Aset-Kripto/Documents/Daftar%20Penyelenggara%20Perdagangan%20Aset%20Keuangan%20Digital%20Posisi%2025%20Mei%202026.pdf): **skipped** — Web fetch timed out. A bounded curl retry returned a 247-byte HTML document rather than the PDF. No records inferred from its title or search snippets.
- [Official source](https://bappebti.go.id/pedagang_aset_kripto): **readable-empty-table** — Official trader page was fetched but exposed only table headings and no trader rows. Cannot establish any partner authorization.
- [Official source](https://ceklegalitas.bappebti.go.id/): **readable-transition-notice** — Official legal-status portal states that regulation and supervision of digital financial assets including crypto have transferred from Bappebti to OJK. No usable partner entry was fetched.

### IN

- [Official source](https://sansad.in/getFile/loksabhaquestions/annex/187/AU5805_lMTYNK.pdf?source=pqals): **readable** — Official March 30, 2026 parliamentary answer contains the FIU-IND list as of March 9, 2026. It explains that registration concerns AML/CFT obligations and is not licensing or government endorsement.
- [Official source](https://fiuindia.gov.in/): **readable-no-public-register** — Official homepage fetched. No searchable public VDA reporting entity register was available; the parliamentary answer confirms that FIU-IND does not publish one.

### JP

- [Official source](https://www.fsa.go.jp/menkyo/menkyoj/kasoutuka.pdf): **read** — All four PDF pages read; register effective 2026-09-01, 27 operators. Relevant entries matched directly; numbers copied as printed.
- [Official source](https://www.fsa.go.jp/ordinary/chuui/angoushisan_mutouroku.html): **read** — Read warning table and its caveat that entries describe conditions at warning issuance, not necessarily today.

### KR

- [Official source](https://www.kofiu.go.kr/kor/notification/notice.do): **readable-index-only** — Live HTML is a JavaScript board shell; the official board JSON API returned the notice titled 가상자산사업자 신고 현황(2026.9.30. 기준). No partner registration rows are inferred from the board shell.
- [Official source](https://www.kofiu.go.kr/cmn/board/selectBoardListFile.do?seCd=0007&page=1&size=10): **readable** — Official board API returned notice 194 and its XLSX attachment metadata, dated 2026-09-30. This is discovery metadata, not entity registration evidence.
- [Official source](https://www.kofiu.go.kr/cmn/file/downloadBoard.do?fileId=Z9FCk6wD7t0PcqgaQHJ2nRkhoSoBsIvAHu7tIC2dSIo%3D): **skipped** — Attachment fetch returned 2072 bytes of HTML titled Page Not Found rather than an XLSX workbook. Register rows could not be read.

### MX

- [Official source](https://pes.cnbv.gob.mx/Consulta/ConsultaEntidad?entidad=OKX&nombreCorto=&subsectorName=NULL): **readable** — HTTP 200; legal-name search for OKX; returned 0 rows. No inference of licence absence from name search.
- [Official source](https://pes.cnbv.gob.mx/Consulta/ConsultaEntidad?entidad=Binance&nombreCorto=&subsectorName=NULL): **readable** — HTTP 200; legal-name search for Binance; returned 0 rows. No inference of licence absence from name search.
- [Official source](https://pes.cnbv.gob.mx/Consulta/ConsultaEntidad?entidad=Bybit&nombreCorto=&subsectorName=NULL): **readable** — HTTP 200; legal-name search for Bybit; returned 0 rows. No inference of licence absence from name search.
- [Official source](https://pes.cnbv.gob.mx/Consulta/ConsultaEntidad?entidad=Bitget&nombreCorto=&subsectorName=NULL): **readable** — HTTP 200; legal-name search for Bitget; returned 0 rows. No inference of licence absence from name search.
- [Official source](https://pes.cnbv.gob.mx/Consulta/ConsultaEntidad?entidad=Kraken&nombreCorto=&subsectorName=NULL): **readable** — HTTP 200; legal-name search for Kraken; returned 0 rows. No inference of licence absence from name search.
- [Official source](https://pes.cnbv.gob.mx/Consulta/ConsultaEntidad?entidad=HTX&nombreCorto=&subsectorName=NULL): **readable** — HTTP 200; legal-name search for HTX; returned 0 rows. No inference of licence absence from name search.
- [Official source](https://pes.cnbv.gob.mx/Consulta/ConsultaEntidad?entidad=CoinW&nombreCorto=&subsectorName=NULL): **readable** — HTTP 200; legal-name search for CoinW; returned 0 rows. No inference of licence absence from name search.
- [Official source](https://pes.cnbv.gob.mx/Consulta/ConsultaEntidad?entidad=Gate&nombreCorto=&subsectorName=NULL): **readable** — HTTP 200; legal-name substring search for Gate returned 1 unrelated row: BLK ACCIONES MEGATENDENCIAS INTERNACIONAL, S.A. DE C.V. FONDO DE INVERSIÓN DE RENTA VARIABLE, short name BLKMEGA, CNBV key 053713. It is not evidence for Gate exchange. No inference of licence absence from name search.
- [Official source](https://pes.cnbv.gob.mx/Consulta/ConsultaEntidad?entidad=MEXC&nombreCorto=&subsectorName=NULL): **readable** — HTTP 200; legal-name search for MEXC; returned 0 rows. No inference of licence absence from name search.
- [Official source](https://pes.cnbv.gob.mx/Consulta/ConsultaEntidad?entidad=Coinbase&nombreCorto=&subsectorName=NULL): **readable** — HTTP 200; legal-name search for Coinbase; returned 0 rows. No inference of licence absence from name search.
- [Official source](https://pes.cnbv.gob.mx/Consulta/ConsultaEntidad?entidad=Payward&nombreCorto=&subsectorName=NULL): **readable** — HTTP 200; legal-name search for Payward; returned 0 rows. No inference of licence absence from name search.
- [Official source](https://www.cnbv.gob.mx/lists/entidadesautorizadas/entidadesautorizadas.aspx): **partial** — HTTP 200; paginated list returned first 30 banking entities only. Not an exhaustive crypto register; no partner record extracted.
- [Official source](https://www.banxico.org.mx/marco-normativo/normativa-emitida-por-el-banco-de-mexico/circular-4-2019/%7B8D7769AF-03F6-701A-68AA-EF25A73AD035%7D.pdf): **readable-context-only** — Official Circular 4/2019 PDF fetched and read; sections 3 and 5 define internal virtual-asset operations and entity-specific permission, not a partner authorisation register. No licence row extracted.

### NG

- [Official source](https://www.sec.gov.ng/fintech-and-innovation-hub-finport/registered-fintech-operators/): **read** — Official SEC FinPort RI and ARIP directory fetched directly on 2026-10-14. Visible ARIP Digital Assets Exchange entries are Busha Digital Limited (Busha) and Quidax Technologies Limited (Quidax). Neither is among the requested partner venues; no partner registration row was added.
- [Official source](https://www.sec.gov.ng/for-investors/find-a-registered-operator/): **partial** — Official general Capital Market Operator directory fetched directly on 2026-10-14, but exposed page 1 of 49. The full paginated register was not retrieved; it is excluded as evidence of a partner licence or of absence from the register.

### PH

- [Official source](https://www.bsp.gov.ph/Lists/Directories/Attachments/19/VASP.pdf): **read** — Official BSP one-page VASP directory fetched and read directly, dated 15 July 2026 (TRISD Database). Lists Betur/Coins.ph, Maya, Moneybees, PDAX, TopJuan, WIBS PHP, Direct Agent 5/SurgePay, GoTyme and Union Bank. No matched partner venue entity was verified; no licence number is printed. This scoped observation is not a finding that any venue lacks authorisation.
- [Official source](https://www.sec.gov.ph/): **skipped** — Direct web fetch and independent urllib request both returned HTTP 403 Forbidden; unable to read or navigate the official SEC register. No registration status inferred.
- [Official source](https://www.sec.gov.ph/wp-content/uploads/2023/11/2023Advisory-against-Binance.pdf): **skipped** — Official SEC Binance advisory PDF direct web fetch failed and independent urllib request returned HTTP 403 Forbidden. Search snippet not accepted as directly fetched evidence; no warning row added.

### PK

- [Official source](https://www.pvara.gov.pk/licensing): **readable; public register not located** — Official licensing FAQ describes a public licensee register but provides no register entry or link in the fetched page. FAQ distinguishes NOC preliminary approval from permission to provide virtual asset services.
- [Official source](https://www.pvara.gov.pk/news): **readable; excluded as non-register** — Official news page identifies Binance and HTX as NOC recipients on 12 December 2025; this is not a licensee register and publishes no legal entity or certificate number.

### SG

- [Official source](https://eservices.mas.gov.sg/fid/institution?activity=Digital+Payment+Token+Service&category=Major+Payment+Institution&count=100&sector=Payments): **read** — Official MAS filtered directory returned 38 institutions. OKX SG and Coinbase Singapore are listed; no other requested partner brand was identified in this filtered list. Absence of a brand match does not establish its legal status.
- [Official source](https://eservices.mas.gov.sg/fid/institution/detail/422854-OKX-SG-PTE-LTD): **read** — Official institution detail confirms the named entity, Major Payment Institution status and Digital Payment Token Service.
- [Official source](https://eservices.mas.gov.sg/fid/institution/detail/235467-COINBASE-SINGAPORE-PTE-LTD): **read** — Official institution detail confirms the named entity, Major Payment Institution status and Digital Payment Token Service.

### TH

- [Official source](https://market.sec.or.th/LicenseCheck/views/DABusiness): **readable** — SEC register lists GULF BINANCE under licensed digital asset exchanges and brokers, with binance.th as its website. This verifies the local BINANCE TH operator, not Binance.com or a global referral destination.
- [Official source](https://market.sec.or.th/public/orap/COMPANYPROFILE03.aspx?lang=en): **readable** — English licensee list names GULF BINANCE CO.,LTD. in digital asset exchange and broker categories for crypto and tokens. No direct global partner entry was verified.
- [Official source](https://market.sec.or.th/LicenseCheck/CompanyDetail/0000033495): **readable-partial** — Entity profile confirms GULF BINANCE COMPANY LIMITED and binance.th. The licence fields remain unresolved template expressions; no licence number is verified. Printed 0105565079411 is corporate registration at the Department of Business Development, not a digital asset licence number.

### TR

- [Official source](https://www.spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi): **readable_register** — Full 52-row operating list and its explicit non-authorisation disclaimer were readable.
- [Official source](https://www.spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/tasfiye-surecinde-olanlar-listesi): **skipped** — Direct web open failed; the same official list was readable on the non-www hostname.
- [Official source](https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/tasfiye-surecinde-olanlar-listesi): **readable_register** — Full 56-row liquidation list was readable on the official non-www hostname.

### UA

- [Official source](https://www.nssmc.gov.ua/en/ua-holova-nktspfr-pytannia-ne-v-tomu-chy-rehuliuvaty-virtualni-aktyvy-a-iak/): **readable-regulator-context** — NSSMC statement dated 2026-09-16 describes draft law 10225-d before its second reading, says the virtual asset market operates without government authorization, and describes registries as a future step after passage. This is not an exchange authorization register.
- [Official source](https://www.nssmc.gov.ua/en/u-nktspfr-rozpovily-iak-rehuliuvatymut-rynok-virtualnykh-aktyviv-v-ukraini/): **readable-regulator-context** — 2022 regulator explanation describes a proposed special register and conditional commencement after Tax Code amendments; it contains no venue-level authorization entries.

### VN

- [Official source](https://mof.gov.vn/): **skipped** — Direct fetch and web open returned an application shell, not a readable licence-holder register. No partner authorisations or licence numbers inferred.
- [Official source](https://mof.gov.vn/tin-tuc-tai-chinh/thoi-su/bo-tai-chinh-ban-hanh-cac-thu-tuc-hanh-chinh-phuc-vu-thi-diem-thi-truong-tai-san-ma-hoa): **skipped** — Direct fetch returned HTTP 200 with 2003 bytes and an empty app element; web open returned zero lines. Search snippets were not treated as a register.
- [Official source](https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-5-2025-nq-cp-ve-trien-khai-thi-diem-thi-truong-tai-san-ma-hoa-tai-viet-nam-119250909184045221.htm): **readable-policy-only** — Official Government full text of Resolution 05/2025/NQ-CP; Article 4(4) restricts crypto-asset advertising and marketing to organisations licensed by the Ministry of Finance. This is legislation, not a venue register.
