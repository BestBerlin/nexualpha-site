# Exchange keyword map (2026-10-11)

Research only. No site code was changed. Machine-readable copy: `exchange-keyword-map-2026-10-11.json` (same folder).

**Scope (owner, 2026-10-11).** We compete for exchange searches that carry a decision word: referral or invite code, sign-up, fees, rebate, "X vs Y", "X alternatives", "is X safe", KYC and country availability. We do **not** target bare brand or navigational searches such as "binance", "okx login" or "币安官网". The official site always wins those, and our page would look like impersonation.

Partners come from `https://nexualpha.com/intel/partners.json` (generated 2026-10-11):

| Exchange | Code | Share |
|---|---|---|
| OKX | nexu888 | 40%, hourly |
| Bitget | nexu888 | 60%, daily |
| Binance | 11350287 | 25%, hourly |
| Bybit | 48553 | not confirmed |
| Gate | nexubest | not confirmed |
| MEXC | 4BRhe | not confirmed |
| HTX | nexu888 | not confirmed |
| Kraken | 7f97gkqw | not confirmed |
| Backpack | luckybitcoin | not confirmed |
| Hyperliquid | NEXU888 | not confirmed |

## How to read this

- **Demand signal.** No paid keyword tool is connected, so there are **no search volumes** in this document and none were invented. Each row shows three counts:
  - `G-AC n`: the number of distinct Google autocomplete suggestions that match the term cluster. Requests used the locale's language and country, for example hl=tr with gl=TR.
  - `Bing n`: the same count from Bing autosuggest. Bing returned almost nothing in non-English markets, so a missing Bing count does not mean low demand.
  - `GSC n impr`: impressions our own site already received for the term in the last 90 days.

  A higher autocomplete count means more distinct real queries were seen, not more volume. The counts can be compared only within a locale.
- **Data sources:**
  - Google autocomplete: 2,522 requests from the 2026-10-10 market research (`/Volumes/致态2TB/nx-agents/keywords/`) plus 315 new requests today. Today's run added global English, the rebate, alternatives and "is X safe/legit/available" modifiers, extra tr/vi/id/ru/pt-BR modifiers, es-ES, zh-Hans, de and fr-FR.
  - Bing autosuggest: 260 requests.
  - Search Console: sc-domain, 2026-07-11 to 2026-10-09, query by page. The whole site had 11 clicks and 2,060 impressions in that window.
  - Requests were spaced at least 1.2 s apart. Nothing was blocked. The scripts and raw data are in `/Volumes/致态2TB/nx-agents/exchange-keywords/`.
- **Difficulty is a qualitative judgement.** A scripted Google results page came back as a "JavaScript required" shell, so I did not scrape Google and did not try to get around that. Difficulty comes from 16 probes of the WebSearch tool (a US index, mostly English), from the Bing results the 2026-10-10 research opened by hand in a browser, and from known SERP types. What the probes found:
  - Referral-code results are dominated by **parasite pages on high-authority hosts**: flux.ai, intercom.help/signupbonus, unitapedia, audible podcast pages, blog.udn.com farms and discord support-community posts.
  - Below those come the exchanges' own referral pages and a few affiliate publishers: datawallet, rebatly, coinbureau and tradersunion.
  - Long-tail problem questions (where to enter the code, adding it after sign-up, "not working") are answered mostly by thin pages, forums and YouTube. That is where a trustworthy page can win.
- **Rank order** follows a transparent score. The formula is in the JSON `scoring` field. It weights referral and sign-up intent and the low-competition locales (tr, vi, pt-BR, id, es). Exchange weights follow the owner update of 2026-10-11 21:40: OKX and Bitget 1.3; Bybit, Hyperliquid and Backpack 1.25; Binance 1.2. It then discounts for difficulty and gives a small bonus when the page already exists.

## Compliance filters applied before ranking

These follow existing owner decisions. They are not new legal opinions.

- **ru, ar and zh-Hant: no referral-intent targets.** This matches `NEUTRAL_TITLE_LOCALES` in `pilot-01-prototype/src/data/referral-seo.js`. Russian appears below only with neutral fee and comparison terms. This works against the "weight ru" instruction, but the owner's 2026-10-10 policy takes precedence.
- **tr: targets only for OKX, Binance and Bybit.** This follows the owner update of 2026-10-11 21:40, which uses the SPK operating list. There are no Bitget, Backpack or Hyperliquid targets in Turkish. Gate and MEXC tr rows were also dropped; `TR_SPK_LISTED` in `referral-seo.js` still lists gate-io and mexc, so the lead may want to align it. Bitget's Turkish page is already neutral ("Bitget Platform profili ve ücretler").
- **ja, ko and mainland China are excluded markets.** zh-Hans is kept at low weight because its readers are overseas Chinese.
- **vi:** under Resolution 05/2025, remove referral calls to action within 6 months of the first Ministry of Finance licence.
- **id:** none of the partners' global entities is OJK-licensed. Rows carry the caveat.
- **pt-BR:** after the BCB authorization deadline (October 2026), show each partner's status.
- **No rebate percentages for Bybit, Hyperliquid or Backpack**, because their shares are unconfirmed in `partners.json`. Their pages lead with the code, the official route, fees and the exchange's own terms.
- **Backpack is never described as "SEC-approved".** The SEC's 2026-09-17 exemption is general and does not name Backpack.

## 1. Top 40 targets (ranked)

| # | Term (main variant) | Locale | Intent | Demand signal | NexuAlpha now | Target page | Gap: what the page must contain | Difficulty |
|---|---|---|---|---|---|---|---|---|
| 1 | **okx referans kodu** — okx referans kodu nerede yazılır / nereye yazılır / değiştirme; okx tr davet kodu nasıl alınır | tr | referral | G-AC 19 | no impressions | `/tr/exchanges/okx` | Turkish FAQ for: nereye yazılır (web/app screenshots), sonradan eklenir mi, TR (tr.okx.com) vs global hesap, kod çalışmıyor; FAQPage has only 2 Qs today — *Confirm with OKX that nexu888 attributes on the OKX TR entity before promising a rebate in Turkish* | low-med: tr.okx.com/referral, YouTube, small TR blogs, parasite pages (flux.ai, discord support posts) |
| 2 | **binance referans kodu** — binance referans kodu nerede yazar / sonradan ekleme / olmadan üye oldum; binance tr davet kodu | tr | referral | G-AC 20, Bing 1 | no impressions | `/tr/exchanges/binance` | Answer 'sonradan ekleme' honestly (normally impossible after sign-up) + Binance TR vs Binance global; code 11350287 validity on Binance TR — *Binance TR is on the SPK operating list* | low-med: technopat forum, discord-support parasite posts, binance.com/tr pages |
| 3 | **mã giới thiệu okx** — mã giới thiệu okx ở đâu / lấy ở đâu; nhập mã giới thiệu okx; đổi mã giới thiệu okx | vi | referral | G-AC 14 | no impressions | `/vi/exchanges/okx` | Vietnamese FAQ: nhập mã ở đâu (app/máy tính), đã đăng ký có thêm mã được không, hoàn phí nhận ở đâu — *Res. 05/2025: watch first MoF licence (6-month clock) and drop referral CTAs then* | low-med: okx.com/vi/referral, backcoms/backcomhub, rebatly vn |
| 4 | **bybit referans kodu** — bybit referans kodu değiştirme / ekleme / nerede yazar; bybit tr kayıt | tr | referral | G-AC 11 | no impressions | `/tr/exchanges/bybit` | Same FAQ set; Bybit TR entity; share not yet confirmed so lead with fees not rebate % — *Bybit TR is on the SPK operating list; no rebate % (share not confirmed)* | low |
| 5 | **mã giới thiệu bitget** — nhập / đổi / thêm mã giới thiệu bitget; cách nhập mã giới thiệu bitget | vi | referral | G-AC 10 | no impressions | `/vi/exchanges/bitget` | Same FAQ set; Bitget 60% share is the strongest rebate offer in vi — *Same Res. 05/2025 watch* | low-med: bitget.com/vi/support, blog.udn parasite, rebatly vn |
| 6 | **mã giới thiệu bybit** — bybit mã giới thiệu ở đâu (trên máy tính); nhập / đổi mã giới thiệu bybit | vi | referral | G-AC 8 | no impressions | `/vi/exchanges/bybit` | FAQ where to enter (desktop/app), add after sign-up, change code; no rebate % (Bybit share not confirmed) — *Same* | low |
| 7 | **hyperliquid referral code / fee rebate** — hyperliquid fees; hyperliquid fee rebate; hyperliquid cashback; hyperliquid rebates; hyperliquid change referral code | en | rebate | G-AC 41, Bing 6, GSC 83 impr | GSC avg pos 60 (83 impr) on /exchanges/hyperliquid | `/exchanges/hyperliquid` | Biggest GSC term (69 impr for 'hyperliquid fees', pos 62): fee-tier table + Hyperliquid's own official referral-discount terms (quote the docs, link them) in the first screen; FAQ 'change referral code', 'referral discount vs rewards'. No NexuAlpha rebate % (share not confirmed) | med: docs, defillama, parasites |
| 8 | **hyperliquid funded account** — get funded to trade hyperliquid; hyperliquid perps prop firm; prop firm on hyperliquid | en | signup | G-AC 1, GSC 25 impr | GSC avg pos 49 (25 impr) on /exchanges/hyperliquid | `/exchanges/hyperliquid` | Title already carries 'Funded Account Checks'; add an H2 that answers it directly: Hyperliquid has no funded accounts of its own; separate self-funded wallet, sub-accounts, API-wallet delegation, vaults and third-party prop-firm offers (risk checklist). No rebate % — *Same page as the fees row: one URL, two H2s* | low-med: prop-firm marketing pages, Reddit |
| 9 | **kode referral bybit** — bybit kode referalnya; cara daftar bybit | id | referral | G-AC 10 | no impressions | `/id-id/exchanges/bybit` | Indonesian FAQ; no rebate % — *OJK caveat* | low-med |
| 10 | **hoàn phí okx / bitget** — cách hoàn phí giao dịch okx; bitget hoàn phí; okx có hoàn phí giao dịch không | vi | rebate | G-AC 11, Bing 1 | no impressions | `/vi/exchanges/bitget` | Explain who pays the rebate (exchange), cadence (OKX hourly, Bitget daily), how to check it in-account; one rebate table OKX/Bitget/Binance on the home or a vi rebate section — *Map to /vi/exchanges/bitget (highest share); OKX profile links to it* | low-med: ngoisao.vn advertorial, finhay, backcom sites |
| 11 | **kode referral bitget** — bitget kode referral opsional; kode referral bitget wallet; cara daftar bitget | id | referral | G-AC 8 | no impressions | `/id-id/exchanges/bitget` | Indonesian FAQ: kolom 'kode referral (opsional)', wallet vs exchange, OJK status answered honestly — *OJK: offshore platforms not licensed; prior plan said informational only - owner kept id referral titles on 2026-10-10* | low-med: flux.ai/intercom parasites, bitdegree id |
| 12 | **mã giới thiệu binance** — mã giới thiệu binance ở đâu; nhập mã giới thiệu binance ở đâu | vi | referral | G-AC 12, Bing 1 | no impressions | `/vi/exchanges/binance` | FAQ + 'mã giới thiệu binance wallet' vs exchange account distinction — *Same* | med |
| 13 | **cara daftar okx** — cara daftar okx exchange; daftar okx minimal umur berapa; cara daftar okx tanpa nomor hp | id | signup | G-AC 14 | no impressions | `/id-id/news/how-to-sign-up-okx-referral-code-nexu888-fee-rebate` **(needs localized version; today noindex)** | Indonesian translation of OKX sign-up guide: minimum age, phone-less sign-up, KYC docs (KTP) — *OJK caveat* | low-med |
| 14 | **cara daftar bitget** — daftar bitget exchange; daftar bitget minimal umur | id | signup | G-AC 14 | no impressions | `/id-id/news/how-to-sign-up-bitget-referral-code-fee-rebate` **(needs localized version; today noindex)** | Indonesian translation of Bitget sign-up guide — *OJK caveat* | low-med |
| 15 | **binance código de convite** — binance código de convite não funciona; binance cadastro brasil / cnpj / bônus | pt-BR | referral | G-AC 8, Bing 2 | no impressions | `/pt-br/exchanges/binance` | FAQ + PJ/CNPJ account question — *BCB watch* | med |
| 16 | **cách đăng ký okx** — cách đăng ký okx trên điện thoại / trên máy tính; okx đăng ký tài khoản | vi | signup | G-AC 10 | no impressions | `/vi/news/how-to-sign-up-okx-referral-code-nexu888-fee-rebate` **(needs localized version; today noindex)** | Vietnamese translation of the OKX sign-up guide with phone + desktop steps — *Same* | low-med |
| 17 | **bybit código de indicação** — bybit codigo de referencia; bybit bonus de cadastro; codigo de indicação cartão bybit | pt-BR | referral | G-AC 5 | no impressions | `/pt-br/exchanges/bybit` | Code 48553 + 'não funciona' FAQ; Bybit card vs exchange code distinction; no rebate % — *BCB watch* | low-med |
| 18 | **backpack exchange referral code** — backpack exchange invite code (not working); backpack exchange referral code reddit | en | referral | G-AC 11 | no impressions | `/exchanges/backpack` | Code luckybitcoin + official join link in first screen; FAQ where to enter / not working / after sign-up; EU (MiCA entity) vs global eligibility. No rebate % (share not confirmed) — *Never describe Backpack as 'SEC-approved' (the SEC 2026-09-17 exemption is general; Backpack is not named)* | low: few dedicated pages; generic 'backpack' queries are polluted by bags, so always say 'Backpack Exchange' |
| 19 | **okx nasıl kayıt olunur** — okx kayıt bonusu; okx tr kayıt olma; okx global kayıt | tr | signup | G-AC 9 | no impressions | `/tr/news/how-to-sign-up-okx-referral-code-nexu888-fee-rebate` **(needs localized version; today noindex)** | Turkish translation of the existing OKX sign-up guide (today /tr/news/... is noindex + canonical to English) — *tr targets limited to OKX/Binance/Bybit (owner 2026-10-11)* | low-med |
| 20 | **okx código de referido** — como registrarse en okx; okx codigo de invitacion; okx registro en español | es | referral | G-AC 5, Bing 2 | no impressions | `/es/exchanges/okx` | FAQ + registration steps | med |
| 21 | **bitget código de convite** — bitget código de convite não funciona; como criar conta na bitget no brasil | pt-BR | referral | G-AC 4 | no impressions | `/pt-br/exchanges/bitget` | Same 'não funciona' FAQ + 60% cashback explanation — *BCB watch* | low-med |
| 22 | **mexc código de referido** — mexc inscribirse; cómo registrarse en mexc; mexc codigo referido | es | referral | G-AC 3, Bing 1, GSC 1 impr | GSC avg pos 6 (1 impr) on /es/compare/okx-vs-mexc | `/es/exchanges/mexc` | GSC 'mexc inscribirse' already at pos 6 (1 impr): add registration steps + code 4BRhe FAQ in Spanish | low-med |
| 23 | **binance kayıt nasıl yapılır** — binance tr nasıl üye olunur; binance kayıt bonusu | tr | signup | G-AC 14, Bing 1 | no impressions | `/tr/news/how-to-open-binance-account-complete-identity-verification-safely` **(needs localized version; today noindex)** | Turkish translation of Binance account guide incl. kimlik doğrulama sorunları — *tr targets limited to OKX/Binance/Bybit (owner 2026-10-11)* | med |
| 24 | **bybit código de referido** — como registrarse en bybit; bybit verificacion paso a paso; bybit bono por registro | es | referral | G-AC 3, Bing 2 | no impressions | `/es/exchanges/bybit` | Registration + verification steps, code 48553; no rebate % | med |
| 25 | **taxas bybit** — bybit taxas; taxa bybit; bybit taxa de saque pix | pt-BR | fees | G-AC 8, Bing 2, GSC 4 impr | GSC avg pos 59 (4 impr) on /exchanges/bybit?locale=pt-BR | `/pt-br/exchanges/bybit` | Already earning impressions (pos ~57-62); add Pix deposit/withdraw fee rows and a localized fee answer above the fold | med |
| 26 | **bitget código de referido** — cómo registrarse en bitget (en español); bitget código de invitación que significa | es | referral | G-AC 4, Bing 1 | no impressions | `/es/exchanges/bitget` | FAQ + rebate 60% explanation; Mexico SPEI/OXXO note — *Argentina: CVN PSAV registry check before CTA* | med: datawallet es, codigodereferido.mx, parasites |
| 27 | **binance referral code** — binance referral code where to find; binance sign up bonus; binance invite code | en | referral | G-AC 37, Bing 11 | no impressions | `/exchanges/binance` | Same FAQ; spot vs futures referral explanation | high |
| 28 | **okx referral code** — okx referral code where to find / after registration / reddit; okx invite code; okx sign up bonus | en | referral | G-AC 26, Bing 5 | no impressions | `/exchanges/okx` | Title already targets it; needs 'where to enter / after registration / not working' FAQ, updated-date stamp, screenshot steps; de-duplicate with /news/how-to-sign-up-okx-referral-code-nexu888-fee-rebate (guide should target 'where to enter', link to profile) | high: okx.com/referral, datawallet/coinbureau-class affiliates, Reddit, parasite pages (flux.ai, intercom, unitapedia) |
| 29 | **bybit vs bitget** — bitget vs bybit; bitget vs bybit uta/stocks | en | compare | G-AC 3, Bing 3, GSC 19 impr | GSC avg pos 58 (19 impr) on /compare/bybit-vs-bitget?locale=en, /news | `/compare/bybit-vs-bitget` | Earning impressions (13 across variants, pos 56-82): add UTA + stock-perps rows the queries ask for | med |
| 30 | **bybit referral code after registration** — bybit referral code; bybit invite code; bybit sign up bonus; bybit kyc transfer | en | referral | G-AC 32, Bing 4 | no impressions | `/exchanges/bybit` | Honest answer to 'after registration' (no duplicate accounts); Bybit share unconfirmed so no % claim | high |
| 31 | **bitget referral code** — bitget invite code; bitget sign up bonus (no deposit); bitget referral code reddit | en | referral | G-AC 30, Bing 2 | no impressions | `/exchanges/bitget` | Same; 60% share is a differentiator vs 'BGB101' parasite pages | high |
| 32 | **taxa gate io** — taxas gate io; gate verification | pt-BR | fees | G-AC 1, GSC 3 impr | GSC avg pos 30 (3 impr) on /exchanges/gate-io?locale=pt-BR, /news/how-to-register-gate-account-complete-identity-verification-and-secure-access | `/pt-br/exchanges/gate-io` | Fee table in BRL context; earning impressions at pos ~35 | low-med |
| 33 | **okx código de convite** — okx código de convite não funciona; okx código de indicação; como criar conta na okx | pt-BR | referral | G-AC 2 | no impressions | `/pt-br/exchanges/okx` | FAQ 'não funciona' (prazo, campo certo, entidade OKX Brasil vs global), Pix deposit link to /br/pix — *BCB authorization deadline Oct 2026 - add partner status note after it* | low-med: okx.com/pt-br/referral, literaciafinanceira.pt, udn parasites |
| 34 | **htx referral code** — htx referral code reddit; htx sign up bonus; htx kyc; is htx legit | en | referral | G-AC 36, Bing 1 | no impressions | `/exchanges/htx` **(needs new page)** | /exchanges/htx 301s to /factbook/htx (locales: noindex). Needs a real indexable profile with code nexu888, fees, KYC; HTX share not confirmed so no % claim | med: htx.com referral page, parasites |
| 35 | **bybit или okx** — okx vs bybit; bitget или bybit; сравнение бирж | ru | compare | G-AC 16 | no impressions | `/ru/compare/okx-vs-bybit` | Russian decision answer; neutral — *Neutral only* | med |
| 36 | **comisiones bitget vs binance** — bitget vs binance; comisiones bybit vs binance | es | compare | G-AC 10 | no impressions | `/es/compare/binance-vs-bitget` | Localized decision answer + fee table in first screen | med |
| 37 | **kode referral okx** — okx kode referral; kode undangan okx | id | referral | G-AC 2 | no impressions | `/id-id/exchanges/okx` | FAQ where to enter + rebate cadence — *OJK caveat* | low-med: flux.ai parasites dominate |
| 38 | **backpack exchange avis** — backpack exchange avis avis; backpack exchange fees; backpack kyc | fr | trust | G-AC 10, GSC 15 impr | GSC avg pos 67 (15 impr) on /exchanges/backpack?locale=fr, /factbook/backpack?locale=fr, /fr/factbook/backpack | `/fr/exchanges/backpack` | Already 8+ impressions (pos 45-80, split across /fr/exchanges and /fr/factbook): French 'Avis' H2 (fees, KYC, MiCA/EU entity, security), make factbook link to the profile so one URL ranks — *fr pages reach France/Belgium: MiCA entity wording; never 'SEC-approved'* | low-med |
| 39 | **binance código de referido** — mi codigo de referido binance; codigo de referido futuros binance; binance registro | es | referral | G-AC 2, Bing 2 | no impressions | `/es/exchanges/binance` | Spot vs futures code distinction (datawallet ranks on this) | high: datawallet.com/es, finantres, intercom parasites |
| 40 | **комиссия bybit** — bybit комиссия спот/фьючерсы; комиссии okx | ru | fees | G-AC 11 | no impressions | `/ru/exchanges/bybit` | Neutral fee page: localized fee answer + VIP table; no referral wording (policy) — *Owner policy 2026-10-10: ru titles neutral; referral-code terms excluded* | med: 1000bankov, vc.ru, profinvestment, forklog |

### Rows 41+ (kept for completeness)

| # | Term (main variant) | Locale | Intent | Demand signal | NexuAlpha now | Target page | Gap: what the page must contain | Difficulty |
|---|---|---|---|---|---|---|---|---|
| 41 | **okx 邀请码 / bitget 返佣** — 欧易邀请码; bitget 返佣; 币安邀请码 | zh-Hans | referral | G-AC 10, Bing 10 | no impressions | `/zh-hans/exchanges/okx` | Profiles already titled; add 补填/更改 FAQ (Simplified) — *Mainland China: trading banned (2021 PBoC); audience is overseas Chinese* | high: Chinese affiliate sites, udn blog farms |
| 42 | **does backpack exchange require kyc** — backpack exchange kyc; backpack kyc verification | en | kyc | G-AC 15 | no impressions | `/exchanges/backpack` | FAQ answer per region (EU vs global) + link /topics/no-kyc | low |
| 43 | **bybit alternatives** — bybit alternatives reddit / usa / india; bybit competitors; binance perps alternative | en | alternatives | G-AC 15, GSC 9 impr | GSC avg pos 74 (9 impr) on /topics/derivatives | `/topics/bybit-alternatives` **(needs new page)** | GSC sends it to /topics/derivatives (pos 75-82). New page: ranked alternatives with OKX/Bitget first, fee + KYC + region table; add slug to TOPIC_SLUGS | med-high: kraken.com/learn, coincub, alternativeto |
| 44 | **okx vs binance** — binance vs okx; okx fees vs binance | en | compare | G-AC 5, Bing 3, GSC 4 impr | GSC avg pos 58 (4 impr) on /compare/binance-vs-okx?market=GLOBAL&product=research | `/compare/binance-vs-okx` | Earning impressions at pos 58 | high |
| 45 | **backpack exchange stocks** — backpack exchange tokenized stocks; backpack exchange stocks list; backpack exchange token | en | trust | G-AC 11 | no impressions | `/exchanges/backpack` | H2 'Tokenized stocks on Backpack Exchange': what is offered, who can access it by region, what you own (token vs share), link /topics/tokenized-stocks-vs-perpetuals; dated, sourced to Backpack's own announcements — *Never 'SEC-approved'; describe the SEC exemption only as general and not naming Backpack* | low-med: Backpack blog/announcements, crypto news |
| 46 | **binance vs bitget** — bitget vs binance; bitget fees vs binance | en | compare | G-AC 2, Bing 3 | no impressions | `/compare/binance-vs-bitget` | Fee table + decision answer | med-high |
| 47 | **hyperliquid kyc** — does hyperliquid require kyc; hyperliquid no kyc; where is hyperliquid allowed | en | kyc | G-AC 10, GSC 2 impr | GSC avg pos 66 (2 impr) on /exchanges/hyperliquid, /topics/no-kyc | `/exchanges/hyperliquid` | FAQ answer + link to /topics/no-kyc | med |
| 48 | **backpack exchange opiniones** — backpack exchange mica; backpack exchange fees | es | trust | G-AC 3 | no impressions | `/es/exchanges/backpack` | Spanish review H2: fees, KYC, MiCA status for EU users — *Never 'SEC-approved'* | low |
| 49 | **is bitget safe / legit** — is bitget legit in nigeria/uk/canada; is bitget safe reddit | en | trust | G-AC 20 | no impressions | `/exchanges/bitget` | Add a 'Is Bitget safe?' H2 that summarises PoR, protection fund, licences by region (sections exist but are not phrased as the question) | med-high: coinbureau, cypherock |
| 50 | **is okx available in <country>** — is okx available in usa / nigeria / philippines / canada / india | en | availability | G-AC 11 | no impressions | `/exchanges/okx` | Region availability table (country -> entity -> code works?) on the profile 'Regions and eligibility' block; FAQ per top countries | med |
| 51 | **bitget vs okx** — okx vs bitget; bitget fees vs okx | en | compare | G-AC 2 | no impressions | `/compare/bitget-vs-okx` | Page live; needs fee table + 'which for futures' answer; both featured partners so CTA for both | med-high: coinbureau, tradersunion, rfp.wiki |

## 2. What a winning "<exchange> referral code" page must contain

Sources:
- the ranking pages read today: datawallet.com/es Binance referral page and rebatly.io "change Bybit referral code", fetched 2026-10-11;
- the parasite pages that fill the result lists;
- the long-tail questions in autocomplete.

The parasite pages win on host authority alone; Google's site-reputation-abuse policy is removing them. A real page that answers what users ask, with an honest code, is the stable winner. Requirements in priority order:

1. **The code and the official link in the first screen.** Show the code as text, with a copy button, then the button to the official registration route. The commission disclosure sits in the same viewport (house rule). Datawallet does this but has no copy button. NexuAlpha profiles already show the code high on the page.
2. **The exact phrase in the title, H1 and first sentence, in the locale's own wording.** Use what people actually type:
   - tr: *referans kodu*, then *davet kodu*;
   - vi: *mã giới thiệu*, then *mã mời*;
   - id: *kode referral / kode referal*;
   - es: *código de referido*;
   - pt-BR: **código de convite**. Autocomplete shows 16 Google and 12 Bing matches for *convite* against 6 for *indicação*. Our pt-BR titles use "Código de indicação" only, so add *convite*.
3. **A dated "short answer" block** (house rule: `## The short answer`). It states what the code gives, who pays it (the exchange, from the trading fee), how often it is paid (OKX hourly, Bitget daily, Binance hourly), and an "updated" date. Datawallet shows "Última actualización". The parasite pages and rebatly show "Updated October 2026".
   - **Bybit, Hyperliquid and Backpack:** no rebate percentage, because the share is unconfirmed. Lead with the code, the official link, the fee table and the exchange's own published terms. For Hyperliquid, that is the docs' referral-discount rules, quoted and linked.
   - **Backpack:** never "SEC-approved".
4. **Step-by-step sign-up for both app and desktop, with screenshots.** Users search "trên điện thoại / trên máy tính" and "app / web". Include where the code field is, and that it is often labelled "(opcional)" or "optional", which is why people miss it.
5. **A problem FAQ that matches the long tail.** It belongs on the localized page and in that language. Today the localized profiles' FAQPage has only 2 questions.
   - **Where do I enter the code?** (*nerede yazılır*, *nhập ở đâu*, *di mana*)
   - **Can I add it after I registered?** (*sonradan ekleme*, *đã đăng ký có thêm được không*, *补填*, "after registration")
     - Answer honestly: usually no.
     - Some exchanges allow re-binding through their own identity-verification transfer. Rebatly describes this for Bybit.
     - Never suggest duplicate accounts.
   - **The code is not working** (*não funciona*, "not working"). Typical reasons: wrong regional entity, an existing account, a typo, an ad blocker stripping the link parameter.
   - **Can I change the code?** (*değiştirme*, *đổi mã*, 更改)
   - **Local entity or global account?** Covers OKX TR / Binance TR / Bybit TR, OKX Brasil and the EU MiCA entities. **Open owner question:** do our codes attribute on the TR entities? The 2026-10-10 research flagged that tr.okx.com runs its own programme.
   - **Exchange account or wallet?** ("okx vs okx wallet", "bitget vs bitget wallet", *mã giới thiệu binance wallet*) Explain which one the code applies to.
   - **Do I need KYC for the rebate or bonus?** Cover KYC levels 1 and 2.
   - **Is the sign-up bonus real or a no-deposit bonus?** ("sign up bonus no deposit" recurs in English for every exchange.) Explain the exchange's own welcome tasks without inventing amounts.
6. **Fee table and rebate maths.** Show spot and perp maker/taker rates from `partners.json` `feesAsOf`, the effective fee after the rebate, and a one-line worked example. Rebate searches (*hoàn phí*, "fee rebate", *komisyon iadesi nasıl yapılır*) want the mechanism, not just a percentage.
7. **Region and eligibility box.** List where the code does not apply or the exchange is unavailable (US, UK, the country's own rules). English autocomplete is full of "is X available in <country>" and "is X legit in nigeria".
8. **Trust signals.** Include:
   - a named author or editorial team and a methodology link;
   - official sources (the exchange's referral terms and fee page);
   - a PoR/security link;
   - an anti-phishing note giving the official domains.

   The safety questions ("is bitget safe", *okx có lừa đảo không*) sit next to referral intent.
9. **Structured data.** Add FAQPage in the page's language, HowTo-shaped steps, BreadcrumbList and `dateModified`.
10. **One page per term.** On English OKX and Bitget, both the profile (`/exchanges/okx`, titled "OKX Referral Code nexu888…") and the guide (`/news/how-to-sign-up-okx-referral-code-nexu888-fee-rebate`) target the same head term.
    - Let the **profile own "<exchange> referral code"**.
    - Retitle the **guide to own "where to enter / after registration"**, linking to the profile.

## 3. Cross-cutting findings

1. **Localized sign-up guides are missing, and localized article URLs are noindex.**
   - `/tr/news/how-to-sign-up-okx-referral-code-nexu888-fee-rebate` is `noindex,follow` with its canonical on the English page. Only zh-hans has real translations.
   - Every sign-up row in tr, vi and id marked "needs localized version" is new work. The route already exists (`/<prefix>/news/<slug>`), so only translated content is needed, not new routing.
2. **New URLs fit existing routing as follows:**
   - venue profile `/<prefix>/exchanges/<slug>` (`/^\/exchanges\/([a-z0-9-]+)$/`);
   - compare page `/<prefix>/compare/<a>-vs-<b>`. Any valid pair renders `index,follow`, and reversed slugs 301 to the canonical order, for example `okx-vs-bitget` to `bitget-vs-okx`;
   - topic `/<prefix>/topics/<slug>`, which needs the slug added to `TOPIC_SLUGS`;
   - news/guide `/<prefix>/news/<slug>`.

   A path like `/exchanges/okx/referral-code` does **not** match the venue route and would 404. That is why this map puts referral pages on the existing profiles.
3. **"X alternatives" has no home.**
   - GSC sends "bybit alternatives", "bybit competitors" and "binance perps alternative" to `/topics/derivatives`, at positions 60 to 82.
   - Proposal: `/topics/bybit-alternatives` (and later `/topics/binance-alternatives`), listing OKX and Bitget first.
   - English autocomplete shows country-shaped demand, for example "binance alternatives in nigeria / kenya / pakistan / philippines".
4. **HTX has demand but no indexable page.** `/exchanges/htx` 301s to `/factbook/htx`, which is noindex in the locales, yet "htx referral code / sign up / kyc / legit" each return 10 suggestions.
5. **Hyperliquid is the one partner term with real impressions.** "hyperliquid fees" had 69 impressions at position 62, plus rebates, cashback and funded-account variants: 83 impressions in the cluster. Moving the fee-tier table and the referral-discount terms into the first screen is the cheapest win on the list.
6. **Compare pages already earn impressions.** bybit-vs-bitget variants had 19 impressions at positions 56 to 82, and okx-vs-binance and kraken-vs-binance also show up. The queries name features the pages do not cover yet: "uta", "stocks", "cfd pro vs stp".
7. **Rebate vocabulary differs by market:**
   - vi: *hoàn phí*, *hoàn phí thường niên* (annual rebate), *backcom*;
   - tr: *komisyon iadesi nasıl yapılır*;
   - id and English: "rebate" or "fee rebate";
   - pt-BR and ru: "cashback", which mostly means the exchanges' **card** cashback (okx cashback card, bybit cashback card). Do not target cashback with the referral rebate there; it is a different intent.
8. **Bing autosuggest is weak outside English.** The `market` parameter is largely ignored: tr seeds returned unrelated "kayak"/"kitchen" completions, so those rows rely on Google.

## 4. Terms deliberately not targeted

| Term | Locale | Reason |
|---|---|---|
| bybit реферальный код, okx промокод, bybit регистрация из россии | ru | Owner policy: neutral ru titles. Russian advertising rules; content that funds restricted exchanges. |
| okx 邀請碼 補填, bitget 返傭 | zh-Hant | Owner policy: neutral zh-Hant (HK SFC Part 5B; TW MLCA Art. 6). |
| bitget / backpack / hyperliquid / kraken / htx / gate.io / mexc referans kodu | tr | Owner update of 2026-10-11: tr targets are OKX, Binance and Bybit only (SPK operating list, Law 7518). |
| كود الاحالة bybit / okx | ar | Owner policy: neutral ar (Egypt CBE law 194/2020). |
| binance, okx login, 币安官网 and other bare brand or login terms | all | Navigational; the official site wins, and our page would look like impersonation. |
| 紹介コード, 추천인 코드 | ja, ko | Excluded markets (FSA / FIU solicitation rules). |
| "buy verified gate.io accounts" (GSC, 3 impressions) | en | Account-trading intent. Do not serve it. |

## 5. Suggested order of work (for the lead)

1. **Localized FAQ blocks on existing profiles.** Ranks 1 to 15 are mostly this; no new URLs are needed.
   - Order: tr (OKX, Binance, Bybit), then vi (OKX, Bitget, Bybit, Binance), then id, pt-BR and es.
   - Use the FAQ list in section 2.
   - In the same pass, add *código de convite* to pt-BR titles.
2. **Hyperliquid fees and funded-account H2s, the Backpack Exchange profile (referral, tokenized stocks, French "avis"), and the bybit-vs-bitget feature rows.** These pages already have impressions.
3. **Translate the existing OKX, Bitget and Binance sign-up guides** into tr, vi and id so the localized `/news/` URLs become indexable.
4. **Before publishing any Turkish rebate claim, confirm that the codes attribute on the TR entities.**
5. **New pages:**
   - `/topics/bybit-alternatives`;
   - a real `/exchanges/htx` profile;
   - retitle `/news/how-to-sign-up-okx-referral-code-nexu888-fee-rebate` to the "where to enter / after registration" angle.
6. **Measure.** Run `node scripts/search-engines.mjs perf 28` after each deploy, and compare against this file's GSC column, which is all zeros except the rows noted.
