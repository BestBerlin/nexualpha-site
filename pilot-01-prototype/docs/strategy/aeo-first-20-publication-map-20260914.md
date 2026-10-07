# NexuAlpha AEO first 20 publication map

Date: 2026-09-14  
Scope: content architecture only. This file maps the first 20 real public-answer opportunities from `AEO_QUESTION_REGISTRY`, the current sitemap, and the current high-intent entry set. It does not change frontend code, deployment, referral links, partner codes, or public commercial claims.

> Wave35 current-state note (2026-09-15): the question set remains valid, but the route-status rows below are a historical planning snapshot. The current `route-inventory.json` now marks `/hk`, `/eu`, `/uk`, `/jp` and `/kr` indexable in their owned languages. `/tr/markets/turkiye` is indexable in Turkish; `/mx`, `/tw` and `/id` remain noindex previews. Use the current route inventory for execution decisions.

## Source evidence used

- `src/data/aeo-question-registry.js` currently contains 56 reviewed question records across HK, EU, UK, JP, KR, TR, BR, MX, TW, ID and OTHER.
- `dist/client/route-inventory.json` and `dist/client/sitemap.xml` show that `/br`, `/br/comparar`, `/br/pix`, `/br/custos`, `/br/conta`, global directory/comparison/factbook/news/methodology/telegram routes are indexable.
- The same inventory shows `/hk`, `/eu`, `/uk`, `/jp`, `/kr`, `/mx`, `/tw`, `/id`, `/int` and their regional preview children as `index:false` or absent from sitemap. They must not be treated as published answers.
- `public/content/news-feed.json` contains bilingual indexed news articles, but only `en` and `zh-Hans` are indexable for news. Unsupported locale previews are not publication targets.
- `public/llms.txt` and `public/llms-full.txt` expose neutral machine-readable context and explicitly omit private commercial terms, referral codes, commissions, rebates and welcome offers.

## Twelve current entry surfaces checked

| Entry | Sitemap/index status | Current role in AEO plan | Decision |
| --- | --- | --- | --- |
| `/` | indexed | broad chooser and internal routing | Use as discovery surface, not final answer page. |
| `/exchanges` | indexed across 15 UI locales | platform directory | Good internal hub; not enough for country-specific legal/funding answers. |
| `/compare/binance-vs-okx` | indexed across 15 UI locales | flagship comparison | Good comparison carrier; keep answers product/account scoped. |
| `/exchanges/binance` | indexed across 15 UI locales | venue detail and CTA path | Good for venue facts; not a country regulation answer. |
| `/factbook/binance` | indexed across 15 UI locales | source-review record | Good for citable facts; do not expose private referral economics. |
| `/news` | indexed only `en` and `zh-Hans` | article index | Good for source-backed articles only in real article locales. |
| `/news/crypto-exchange-fee-disclosure-audit` | indexed only `en` and `zh-Hans` | fee-disclosure article | Useful supporting source for fee questions. |
| `/methodology` | indexed across 15 UI locales | trust boundary | Good for disclosure and source-bound methodology. |
| `/telegram` | indexed across 15 UI locales | community/research distribution | Use for community CTA, not ranking or registration promises. |
| `/br` and `/br/*` | indexed only `pt-BR` | Brazil decision journey | Strong first published regional cluster; should be strengthened before cloning. |
| `/hk`, `/eu`, `/uk`, `/jp`, `/kr` | route exists but `index:false`; not in sitemap | regional previews | Do not count as published answers; require new published pages or promotion gates. |
| `/mx`, `/tw`, `/id`, `/int` | route exists but `index:false`; not in sitemap | regional previews | Do not count as published answers; use only as planning inputs. |

## Publication rules for this batch

1. One question can share an existing page only when the page is indexable, has the same locale, and can hold a direct answer without becoming a thin duplicate.
2. A noindex regional preview is research inventory, not a public answer.
3. For Google-facing SEO, do not create one thin page per small variant. Consolidate related questions into country decision pages with direct-answer blocks, tables, steps and official-source links.
4. For AEO/GEO, each page needs an extractable 40-60 word direct answer, one comparison/checklist table when the query implies choices, a numbered verification path when the query implies action, and source links with dates.
5. No page should promise registration, bonus, discount, eligibility, ranking, indexing, approval, lower fees or conversion unless the cited source and account screen support that exact claim.

## First 20 question-to-publication map

| # | Registry ID | Real user question | Existing indexable carrier | Is current answer enough? | Missing direct answer / table / steps / sources | Need new page? | Publication decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `br-pix-deposit` | Como conferir o caminho oficial de depósito em BRL ou Pix antes de escolher uma plataforma? | `/br/pix` and `/br` are indexed `pt-BR`. | Partly enough. `/br/pix` has a useful Pix checklist and official-source framing. | Add a short direct-answer block naming the exact verification sequence: official domain, logged-in account, BRL/Pix method, CPF/name match, limits/fees/time. Add a two-column table for Binance vs OKX source links. | No. | Strengthen `/br/pix`; do not create another Pix deposit page. |
| 2 | `br-pix-withdraw` | Quais condições devo confirmar antes de sacar BRL por Pix? | `/br/pix` is indexed `pt-BR`. | Partial. Current page covers Pix and account conditions, but withdrawal is not as explicit as deposit. | Add withdrawal-specific answer, checklist row for destination ownership, fee/limit/time, processing status, and official withdrawal help links. | No. | Add a withdrawal subsection to `/br/pix` to avoid duplicate thin content. |
| 3 | `br-fee-estimate` | Por que uma estimativa de taxas não substitui a tabela oficial da conta? | `/br/custos` is indexed `pt-BR`; `/news/crypto-exchange-fee-disclosure-audit` supports fee-source logic in `en/zh-Hans`. | Mostly enough. `/br/custos` already says estimates are editable hypotheses, not official tariffs. | Add a direct answer that distinguishes estimate, published base fee, account-tier fee, spread/slippage and deposit/withdrawal cost. Add a small formula table. | No. | Strengthen `/br/custos`; link methodology and fee-disclosure article as supporting context. |
| 4 | `br-referral-boundary` | Um link de parceiro garante bônus ou desconto para todo usuário brasileiro? | `/br/conta` and `/methodology` are indexed. | Mostly enough. `/br/conta` states partner link is not a guaranteed benefit. | Add a concise answer block and a table separating partner link, referral code, campaign eligibility, account task and final account screen. | No. | Strengthen `/br/conta`; keep private commission and invitation-link data out of public machine-readable layers. |
| 5 | `hk-residence-platform` | Which crypto platforms publish a Hong Kong licensing or platform-status record? | No dedicated indexable carrier. `/hk` exists but is `index:false` and absent from sitemap. | No. Existing noindex preview cannot be counted. | Need a public HK page with direct answer, SFC platform-status table, OSL/HashKey/other official-source rows, and date-stamped source links. | Yes. | Create or promote a real `/hk` publication only after content QA; do not rely on preview. |
| 6 | `hk-hkd-funding` | What HKD or on-chain funding route should a Hong Kong user verify before opening an account? | No dedicated indexable carrier. `/hk` is `index:false`. | No. | Need HKD/on-chain funding checklist: official domain, account stage, bank/wallet route, currency, fee/limit/time, source date. Add table by platform where sources exist. | Yes. | Combine with the HK country page rather than creating a separate thin funding page first. |
| 7 | `eu-mica-register` | Where can a user check the current ESMA MiCA register before comparing a crypto platform? | No dedicated indexable carrier. `/eu` is `index:false`; `/news/esma-mica-register-how-to-check-casp-issuer-status` is indexed in `en/zh-Hans`. | Partial. The news article can answer the ESMA-check mechanic, but it is article-shaped, not a durable EU decision hub. | Add or promote an EU evergreen page with direct answer and ESMA register step list. Link the existing news article as supporting evidence. | Yes. | Build `/eu` as durable hub; keep the news article as supporting source. |
| 8 | `eu-member-state` | Why must a European crypto platform decision be checked by country and service scope? | No dedicated indexable carrier. `/eu` is `index:false`. | No. | Need direct answer explaining MiCA/CASP does not equal every product/every country/every account. Add country/service-scope table and official-source links. | Yes. | Include this in the EU hub; no separate page until hub has enough substance. |
| 9 | `eu-sepa-funding` | What EUR or SEPA funding conditions should an EU user verify on the official platform page? | No dedicated indexable carrier. `/eu` is `index:false`. | No. | Need SEPA checklist: legal entity, supported country, bank account name, deposit/withdrawal route, fees, limits, processing time, source date. | Yes. | EU hub can include this as a funding module; avoid a thin `/eu/sepa` until source depth is higher. |
| 10 | `uk-fca-register` | How can a UK user check whether a cryptoasset firm appears in the FCA register? | No dedicated indexable carrier. `/uk` is `index:false`. | No. | Need direct answer, numbered FCA-check steps, FCA register/status table, and caveat that registration does not prove product availability or suitability. | Yes. | Publish a UK hub before any UK CTA expansion. |
| 11 | `uk-gbp-funding` | What GBP funding method and account limits should a UK user confirm on the official site? | No dedicated indexable carrier. `/uk` is `index:false`. | No. | Need GBP funding checklist with official platform path, bank account ownership, transfer rail, limits, fees, processing time, account stage. | Yes. | Add as UK hub module; do not publish as standalone until the hub covers regulation/account context. |
| 12 | `jp-fsa-register` | 日本で暗号資産交換業者の登録情報を確認するには、どの公式情報源を見ればよいですか？ | No dedicated indexable carrier. `/jp` is `index:false`; generic homepage `?locale=ja` is indexed but not an answer. | No. | Need Japanese direct answer, FSA source link/table, exchange-business registration check steps, and product-scope warning. | Yes. | Create Japanese-original `/jp?locale=ja` or equivalent published country page; do not use translated generic homepage. |
| 13 | `jp-jpy-funding` | 日本円の入金方法と本人名義口座の条件は、どこで確認できますか？ | No dedicated indexable carrier. `/jp` is `index:false`. | No. | Need JPY funding table by sourced platform, name-match/bank-account steps, limits/fees/time, and official support links. | Yes. | Add as module inside the Japan country page. |
| 14 | `kr-regulatory-context` | 한국에서 가상자산 플랫폼을 비교하기 전에 금융위원회 공식 규제 맥락을 어떻게 확인해야 하나요? | No dedicated indexable carrier. `/kr` is `index:false`; generic homepage `?locale=ko` is indexed but not an answer. | No. | Need Korean direct answer, FSC/KOFIU official-source table, what each source proves, and what it does not prove. | Yes. | Create Korean-original `/kr?locale=ko` or equivalent published country page. |
| 15 | `kr-krw-funding` | 원화 입금과 본인 명의 은행계좌 조건은 어디에서 확인할 수 있나요? | No dedicated indexable carrier. `/kr` is `index:false`. | No. | Need KRW funding checklist: real-name bank account, account verification, deposit/withdrawal path, limits/fees/time and platform support links. | Yes. | Add as module inside the Korea country page, not as a standalone thin article. |
| 16 | `tr-spk-register` | Türkiye'de bir kripto varlık hizmet sağlayıcısını karşılaştırmadan önce SPK'nın güncel geçici listesi nasıl kontrol edilmelidir? | `/exchanges?locale=tr` is indexed, but the registry path `/exchanges?market=TR&locale=tr` is not a dedicated sitemap URL. | No. Generic directory is not a Turkey regulatory answer. | Need Turkish direct answer, SPK active/liquidation list table, official-source links, and caveat about product/account scope. | Yes. | Create a Turkey country page before treating this query as covered. |
| 17 | `tr-try-funding` | Paribu'da TRY yatırmadan önce banka hesabı ve transfer koşulları nereden doğrulanmalıdır? | `/exchanges?locale=tr` is indexed but generic. | No. | Need TRY funding steps with bank-account ownership, transfer route, app/account requirements, limits/fees/time and Paribu support links. | Yes. | Add as Turkey hub module; avoid a single-platform thin page unless there are multiple verified source rows. |
| 18 | `mx-spei-route` | ¿Qué debe confirmar un usuario mexicano sobre SPEI antes de elegir una plataforma? | No dedicated indexable carrier. `/mx` is `index:false`; `/exchanges?locale=es` is generic. | No. | Need Spanish direct answer, SPEI-specific checklist, platform/source table, and CNBV/Fintech context boundary. | Yes. | Create Mexico hub only after source QA; do not count `/mx` preview. |
| 19 | `tw-bank-verification` | 台灣使用者在選擇平台前，應如何核對銀行驗證與服務主體？ | No dedicated indexable carrier. `/tw` is `index:false`; generic Chinese homepage is indexed but not answer-specific. | No. | Need Traditional Chinese direct answer, MAX/bank-account verification steps, service-entity table, FSC law/source link and scope caveat. | Yes. | Create Taiwan Traditional Chinese hub; no thin bank-only page first. |
| 20 | `id-va-qris-route` | Apa yang harus diverifikasi pengguna Indonesia tentang VA atau QRIS sebelum memilih platform? | No dedicated indexable carrier. `/id` is `index:false`; `/exchanges?locale=id` is generic. | No. | Need Indonesian direct answer, VA/QRIS checklist, Tokocrypto source links, referral-code boundary and product/region warning. | Yes. | Create Indonesia hub only after partner/local-source validation; keep preview noindex until then. |

## Immediate content backlog from the map

### Wave A: strengthen pages already published

1. `/br/pix`: add deposit and withdrawal direct-answer blocks, source table and step checklist.
2. `/br/custos`: add formula table and answer block distinguishing estimate from official account fee.
3. `/br/conta`: add partner-link/referral-boundary table and explicit “not guaranteed” answer block.
4. `/br`: link the three answer modules from the first screen so AEO crawlers and users can reach them quickly.

### Wave B: publish one substantial country hub at a time

Recommended order: HK, EU, UK, JP, KR, TR, MX, TW, ID. Each hub should launch only when it has at least:

- one 40-60 word direct answer per included question;
- one official-source table with source date and what the source proves;
- one action checklist;
- a “what this does not prove” boundary;
- internal links to `/methodology`, relevant `/factbook/*`, and any supporting indexed news article;
- no private commission data and no invitation-link mutation.

### Wave C: supporting articles only when the hub is too dense

Standalone articles are justified only when the answer has independent search intent and enough sourced detail. Current candidates:

- EU: ESMA MiCA register article already exists; use it as support, not as a substitute for `/eu`.
- UK: FCA register guide can become a supporting article after the UK hub exists.
- JP/KR/TR: publish country hubs first because one-off articles would currently look thin without local navigation and account/funding context.

## Open risks and guardrails

- Noindex regional previews must stay out of publication claims until route inventory, sitemap, canonical, hreflang and Worker metadata are intentionally changed together.
- Do not mass-produce locale copies from the 56-question registry. Each published country page needs original language QA and official-source coverage.
- Do not expose private commission figures, settlement terms, internal partner economics or invitation-link alternates in public schema, `llms.txt`, articles or Telegram copy.
- Do not edit referral URLs or invitation codes while implementing AEO content. The project constitution freezes those values.
