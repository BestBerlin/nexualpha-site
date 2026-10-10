# e2e report: https://nexualpha.com

Build `3.0-20261010T1107-GH-7949c79`, 1186s.

| Check | Status | Fail | Warn |
|---|---|---|---|
| void | WARN | 0 | 413 |
| type | WARN | 0 | 323 |
| overflow | PASS | 0 | 0 |
| tap | WARN | 0 | 38 |
| collision | WARN | 0 | 4 |
| css | PASS | 0 | 0 |
| cta | PASS | 0 | 0 |
| jsoff | PASS | 0 | 0 |
| console | PASS | 0 | 0 |
| i18n | WARN | 0 | 34 |
| clicklat | WARN | 0 | 1 |

## void (413)

- WARN `/embed/calculator@1280` column y=480 h=368 w=568 x=72 in div.bleed-analyzer__grid
- WARN `/embed/calculator@1440` column y=480 h=344 w=600 x=120 in div.bleed-analyzer__grid
- WARN `/embed/calculator@1024` column y=480 h=424 w=448 x=64 in div.bleed-analyzer__grid
- WARN `/topics/derivatives@1280` column y=4944 h=304 w=600 x=640 in section.topic-section
- WARN `/topics/derivatives@1440` column y=4944 h=304 w=600 x=720 in section.topic-section
- WARN `/topics/derivatives@1024` column y=5216 h=368 w=480 x=512 in section.topic-section
- WARN `/@1440` column y=136 h=472 w=200 x=584 in section.h7-hero
- WARN `/@1280` column y=128 h=472 w=192 x=504 in section.h7-hero
- WARN `/@1440` column y=648 h=184 w=488 x=120 in section.h7-hero
- WARN `/zh-hans/@1024` column y=104 h=544 w=160 x=400 in section.h7-hero
- WARN `/zh-hans/@1440` column y=640 h=184 w=472 x=120 in section.h7-hero
- WARN `/ar@1440` column y=648 h=176 w=480 x=840 in section.h7-hero
- WARN `/@1280` column y=640 h=184 w=448 x=40 in section.h7-hero
- WARN `/zh-hans/@1280` column y=624 h=184 w=448 x=40 in section.h7-hero
- WARN `/ar@1280` column y=632 h=168 w=480 x=760 in section.h7-hero
- WARN `/zh-hans/@1440` column y=136 h=176 w=456 x=328 in section.h7-hero
- WARN `/de@1440` column y=336 h=360 w=216 x=568 in section.h7-hero
- WARN `/de@1280` column y=688 h=176 w=432 x=40 in section.h7-hero
- WARN `/zh-hans/@1280` column y=128 h=168 w=448 x=248 in section.h7-hero
- WARN `/zh-hans/@1024` column y=568 h=208 w=360 x=32 in section.h7-hero
- WARN `/ar@1024` column y=600 h=192 w=360 x=632 in section.h7-hero
- WARN `/exchanges/binance@1024` band y=3353 h=198 (+70 over padding) in div.v3-venue-metrics-grid
- WARN `/exchanges/bitget@1024` band y=3168 h=198 (+70 over padding) in section#fee-schedule
- WARN `/exchanges/bybit@1024` band y=3168 h=198 (+70 over padding) in section.v3-profile-account-section.v3-profile-account-cost
- WARN `/exchanges/okx@1024` band y=3190 h=198 (+70 over padding) in section.v3-profile-account-section.v3-profile-account-cost
- WARN `/exchanges/uniswap@1024` band y=3077 h=198 (+70 over padding) in section#fee-schedule
- WARN `/ja/exchanges/bitget@1024` band y=3045 h=198 (+70 over padding) in section.v3-profile-account-section.v3-profile-account-cost
- WARN `/zh-hans/exchanges/bitget@1024` band y=2966 h=198 (+70 over padding) in section.v3-profile-account-section.v3-profile-account-cost
- WARN `/de@1024` column y=480 h=280 w=224 x=288 in section.h7-hero
- WARN `/zh-hans/@1024` column y=104 h=160 w=368 x=32 in section.h7-hero
- WARN `/@1024` column y=656 h=160 w=352 x=32 in section.h7-hero
- WARN `/zh-hans/@1440` column y=392 h=320 w=176 x=608 in section.h7-hero
- WARN `/rates@1024` column y=1104 h=272 w=200 x=248 in nav.fee-terminal__answer-links
- WARN `/de@1280` column y=128 h=168 w=312 x=384 in section.h7-hero
- WARN `/news@1280` column y=768 h=176 w=296 x=832 in article.news-article-card
- WARN `/news@1440` column y=768 h=176 w=296 x=912 in article.news-article-card
- WARN `/news@1280` column y=952 h=184 w=280 x=792 in article.news-article-card
- WARN `/news@1440` column y=952 h=184 w=280 x=872 in article.news-article-card
- WARN `/news@1280` column y=512 h=168 w=304 x=768 in article.news-article-card
- WARN `/news@1440` column y=512 h=168 w=304 x=848 in article.news-article-card
- WARN `/ar@1024` column y=104 h=184 w=272 x=720 in section.h7-hero
- WARN `/news@1280` column y=1144 h=184 w=272 x=800 in article.news-article-card
- WARN `/news@1440` column y=1144 h=184 w=272 x=880 in article.news-article-card
- WARN `/ar@1440` column y=136 h=168 w=296 x=1024 in section.h7-hero
- WARN `/zh-hans/@1280` column y=376 h=296 w=168 x=528 in section.h7-hero
- WARN `/de@1024` column y=104 h=288 w=168 x=392 in section.h7-hero
- WARN `/ar@1280` column y=128 h=160 w=296 x=944 in section.h7-hero
- WARN `/de@1024` column y=664 h=184 w=256 x=32 in section.h7-hero
- WARN `/exchanges/uniswap@1280` column y=192 h=280 w=160 x=680 in main#top
- WARN `/exchanges/uniswap@1440` column y=192 h=280 w=160 x=760 in main#top
- WARN `/de@768` band y=5965 h=135 (+63 over padding) in div.v6-close__index.v6-wrap
- WARN `/de@1280` column y=432 h=208 w=208 x=488 in section.h7-hero
- WARN `/@768` band y=5678 h=133 (+61 over padding) in div.v6-close__index.v6-wrap
- WARN `/ar@768` band y=5476 h=133 (+61 over padding) in div.v6-close__index.v6-wrap
- WARN `/exchanges/binance@768` band y=3837 h=133 (+61 over padding) in div.v3-venue-metrics-grid
- WARN `/exchanges/bitget@768` band y=3631 h=133 (+61 over padding) in section#fee-schedule
- WARN `/exchanges/bybit@768` band y=3652 h=133 (+61 over padding) in section#fee-schedule
- WARN `/exchanges/okx@768` band y=3631 h=133 (+61 over padding) in section.v3-profile-account-section.v3-profile-account-cost
- WARN `/exchanges/uniswap@768` band y=3474 h=133 (+61 over padding) in section#fee-schedule
- WARN `/ja/exchanges/bitget@768` band y=3646 h=133 (+61 over padding) in section#fee-schedule
- ... 353 more

## collision (4)

- WARN `/rates@1024` div > strong 'Need the full directory?' overlaps .rt-foot__links > a 'Compare Binance and OKX ' at y=3341 x=24 (2735px2)
- WARN `/topics/derivatives@390` .topic-nav-strip > a.topic-nav-btn 'JSON ↓' overlaps .topic-nav-strip > a.topic-nav-btn 'Wave48 CSV ↓' at y=2939 x=108 (419px2)
- WARN `/topics/derivatives@768` .topic-nav-strip > a.topic-nav-btn 'JSON ↓' overlaps .topic-nav-strip > a.topic-nav-btn 'Wave48 CSV ↓' at y=2946 x=108 (419px2)
- WARN `/topics/derivatives@1024` .topic-nav-strip > a.topic-nav-btn 'JSON ↓' overlaps .topic-nav-strip > a.topic-nav-btn 'Wave48 CSV ↓' at y=2416 x=121 (236px2)

## type (323)

- WARN `/@1024` lh 1.00 x87 e.g. .h7-cta > a.h7-btn.h7-hero-go
- WARN `/@1280` lh 1.00 x87 e.g. .h7-cta > a.h7-btn.h7-hero-go
- WARN `/@1440` lh 1.00 x87 e.g. .h7-cta > a.h7-btn.h7-hero-go
- WARN `/@390` lh 1.00 x87 e.g. button > b
- WARN `/@768` lh 1.00 x87 e.g. .h7-cta > a.h7-btn.h7-hero-go
- WARN `/ar@1024` lh 1.00 x87 e.g. .h7-cta > a.h7-btn.h7-hero-go
- WARN `/ar@1280` lh 1.00 x87 e.g. .h7-cta > a.h7-btn.h7-hero-go
- WARN `/ar@1440` lh 1.00 x87 e.g. .h7-cta > a.h7-btn.h7-hero-go
- WARN `/ar@390` lh 1.00 x87 e.g. button > b
- WARN `/ar@768` lh 1.00 x87 e.g. .h7-cta > a.h7-btn.h7-hero-go
- WARN `/de@1024` lh 1.00 x87 e.g. .h7-cta > a.h7-btn.h7-hero-go
- WARN `/de@1280` lh 1.00 x87 e.g. .h7-cta > a.h7-btn.h7-hero-go
- WARN `/de@1440` lh 1.00 x87 e.g. .h7-cta > a.h7-btn.h7-hero-go
- WARN `/de@390` lh 1.00 x87 e.g. button > b
- WARN `/de@768` lh 1.00 x87 e.g. .h7-cta > a.h7-btn.h7-hero-go
- WARN `/zh-hans/@1024` lh 1.00 x87 e.g. .h7-cta > a.h7-btn.h7-hero-go
- WARN `/zh-hans/@1280` lh 1.00 x87 e.g. .h7-cta > a.h7-btn.h7-hero-go
- WARN `/zh-hans/@1440` lh 1.00 x87 e.g. .h7-cta > a.h7-btn.h7-hero-go
- WARN `/zh-hans/@390` lh 1.00 x87 e.g. button > b
- WARN `/zh-hans/@768` lh 1.00 x87 e.g. .h7-cta > a.h7-btn.h7-hero-go
- WARN `/@1024` lh 1.50 x46 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/@1280` lh 1.50 x46 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/@1440` lh 1.50 x46 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/@768` lh 1.50 x46 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/ar@1024` lh 1.50 x46 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/ar@1280` lh 1.50 x46 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/ar@1440` lh 1.50 x46 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/ar@768` lh 1.50 x46 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/de@1024` lh 1.50 x46 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/de@1280` lh 1.50 x46 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/de@1440` lh 1.50 x46 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/de@768` lh 1.50 x46 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/zh-hans/@1024` lh 1.50 x46 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/zh-hans/@1280` lh 1.50 x46 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/zh-hans/@1440` lh 1.50 x46 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/zh-hans/@768` lh 1.50 x46 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/@390` lh 1.50 x43 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/ar@390` lh 1.50 x43 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/de@390` lh 1.50 x43 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/zh-hans/@390` lh 1.50 x43 e.g. #h7-desk > p.h7-lg-disclosure
- WARN `/@1024` lh 1.20 x20 e.g. button > i
- WARN `/@1280` lh 1.20 x20 e.g. button > i
- WARN `/@1440` lh 1.20 x20 e.g. button > i
- WARN `/@768` lh 1.20 x20 e.g. button > i
- WARN `/ar@1024` lh 1.20 x20 e.g. button > i
- WARN `/ar@1280` lh 1.20 x20 e.g. button > i
- WARN `/ar@1440` lh 1.20 x20 e.g. button > i
- WARN `/ar@768` lh 1.20 x20 e.g. button > i
- WARN `/de@1024` lh 1.20 x20 e.g. button > i
- WARN `/de@1280` lh 1.20 x20 e.g. button > i
- WARN `/de@1440` lh 1.20 x20 e.g. button > i
- WARN `/de@768` lh 1.20 x20 e.g. button > i
- WARN `/zh-hans/@1024` lh 1.20 x20 e.g. button > i
- WARN `/zh-hans/@1280` lh 1.20 x20 e.g. button > i
- WARN `/zh-hans/@1440` lh 1.20 x20 e.g. button > i
- WARN `/zh-hans/@768` lh 1.20 x20 e.g. button > i
- WARN `/@390` lh 1.20 x19 e.g. .h7-btn > small.h7-go-disclosure
- WARN `/ar@390` lh 1.20 x19 e.g. .h7-btn > small.h7-go-disclosure
- WARN `/de@390` lh 1.20 x19 e.g. .h7-btn > small.h7-go-disclosure
- WARN `/zh-hans/@390` lh 1.20 x19 e.g. .h7-btn > small.h7-go-disclosure
- ... 263 more

## tap (38)

- WARN `/zh-hans/compare/binance-vs-okx@390` 48x16 .commission-disclosure-line > a '合作披露' y=4576
- WARN `/partners@390` 38x22 .guide-breadcrumbs > a 'Home' y=84
- WARN `/br/pix@390` 27x44 .br-chain__evidence > a 'CPF' y=2804
- WARN `/compare/okx-vs-bybit@390` 102x16 .commission-disclosure-line > a 'Affiliate Disclosure' y=4956
- WARN `/rates@390` 102x16 .commission-disclosure-line > a 'Affiliate Disclosure' y=852
- WARN `/rates@390` 102x16 .commission-disclosure-line > a 'Affiliate Disclosure' y=3148
- WARN `/br/pix@390` 39x44 .br-chain__evidence > a 'Conta' y=2804
- WARN `/br/pix@390` 42x44 .br-chain__evidence > a 'Saque' y=2804
- WARN `/methodology@390` 43x44 li > a 'Korea' y=2856
- WARN `/methodology@390` 43x44 li > a 'Brazil' y=3132
- WARN `/exchanges@390` 119x18 .commission-disclosure-line > a 'Affiliate Disclosure' y=604
- WARN `/news@390` 75x34 .news-article-card__venues > a.news-article-card__venue-chip 'Bybit' y=1341
- WARN `/news@390` 85x34 .news-article-card__venues > a.news-article-card__venue-chip 'Kraken' y=1341
- WARN `/embed/calculator@390` 185x16 .embed-attribution-bar > a.embed-attribution-link 'Explore platform comparisons ↗' y=1634
- WARN `/news@390` 91x34 .news-article-card__venues > a.news-article-card__venue-chip 'Binance' y=1301
- WARN `/embed/calculator@390` 83x40 .bleed-venue-selector > button.bleed-venue-btn.bleed-venue-btn--active 'OKX' y=272
- WARN `/news@390` 99x34 .news-article-card__venues > a.news-article-card__venue-chip 'Coinbase' y=1301
- WARN `/embed/calculator@390` 89x40 .bleed-venue-selector > button.bleed-venue-btn 'Bybit' y=272
- WARN `/embed/calculator@390` 94x40 .bleed-venue-selector > button.bleed-venue-btn 'MEXC' y=364
- WARN `/embed/calculator@390` 95x40 .bleed-venue-selector > button.bleed-venue-btn 'Bitget' y=318
- WARN `/embed/calculator@390` 101x40 .bleed-venue-selector > button.bleed-venue-btn 'Gate.io' y=318
- WARN `/embed/calculator@390` 102x40 .bleed-venue-selector > button.bleed-venue-btn 'KuCoin' y=364
- WARN `/embed/calculator@390` 108x40 .bleed-venue-selector > button.bleed-venue-btn 'Binance' y=272
- WARN `/embed/calculator@390` 228x24 .bleed-embed-row > button.bleed-embed-btn 'Embed this calculator on your ' y=1526
- WARN `/embed/calculator@390` 295x19 .bleed-fee-source > summary 'Checked: 2026-10-10 · 0.05% · ' y=914
- WARN `/factbook/binance@390` 136x42 dd > a.factbook-domain-link 'www.binance.com' y=464
- WARN `/eu@390` 287x22 .v3-card > a 'Open research profile' y=1581
- WARN `/mx/comparar@390` 296x22 .v3-card > a 'Abrir perfil de investigación' y=1457
- WARN `/mx@390` 296x22 .v3-card > a 'Abrir perfil de investigación' y=1396
- WARN `/eu@390` 313x22 .v3-card > a 'Compare account paths' y=4371
- WARN `/markets/turkiye@390` 313x22 .v3-card > a 'Koşulları karşılaştır' y=3393
- WARN `/tw@390` 313x22 .v3-card > a '比較開戶條件' y=2660
- WARN `/news@390` 342x22 .news-index-search > label 'Search articles' y=326
- WARN `/partners@390` 259x38 .guide-tg-card > a.guide-tg-btn 'Open partner desk on Telegram→' y=1970
- WARN `/topics/derivatives@390` 320x38 .topic-derivatives-route-card > a.topic-nav-btn.topic-derivatives-route-primary 'Binance vs OKX →' y=1914
- WARN `/topics/derivatives@390` 320x38 .topic-derivatives-route-card > a.topic-nav-btn.topic-derivatives-route-primary 'Hyperliquid vs dYdX →' y=2044
- WARN `/topics/derivatives@390` 320x38 .topic-derivatives-route-card > a.topic-nav-btn.topic-derivatives-route-primary 'Deribit profile →' y=2175
- WARN `/topics/derivatives@390` 320x38 .topic-derivatives-route-card > a.topic-nav-btn.topic-derivatives-route-primary 'GMX profile →' y=2305

## i18n (34)

- WARN `/` English leftover: [mixed] 5 家链上永续 Perp DEX
- WARN `/exchanges/binance` English leftover: 自存私钥安全准则 (Not Your Keys, Not Your Coins)
- WARN `/exchanges/binance` English leftover: ● Source record match
- WARN `/exchanges/binance` English leftover: 官方渠道真伪验证器 (Official Verification Channel)
- WARN `/exchanges/binance,/compare/binance-vs-okx` English leftover: [mixed] 现货费用以 maker/taker 展示，并按 30 日交易量和/或 BNB 持仓分层。
- WARN `/exchanges/binance` English leftover: Binance fees and product navigation
- WARN `/exchanges/binance` English leftover: Binance identity verification FAQ
- WARN `/exchanges/binance` English leftover: [mixed] 注册前请固定产品、地区、账户等级和 Maker/Taker 口径。
- WARN `/compare/binance-vs-okx` English leftover: [mixed] 现货 Maker / Taker 费率
- WARN `/compare/binance-vs-okx` English leftover: [mixed] 合约 Maker / Taker 费率
- WARN `/exchanges/binance,/compare/binance-vs-okx` English leftover: [mixed] Binance の公開 Spot & Margin 手数料表にある Regular User 行を使用します。BNB 25% オフ、USDC 列、VIP 階層、プロモーション、口座別条件、地域資格は公式アカウント手続きで確認
- WARN `/exchanges/binance` English leftover: ● Source record match
- WARN `/exchanges/binance` English leftover: Binance fees and product navigation
- WARN `/exchanges/binance` English leftover: Binance identity verification FAQ
- WARN `/exchanges/binance` English leftover: パブリック Rewards Hub は、タスク、ポイント、バウチャーを分離します。目に見えるハブは個人的な特典の提供ではありません。
- WARN `/compare/binance-vs-okx` English leftover: [mixed] 商品、マーケット、maker/taker、アカウント階層を先に決めます。公開表は確認リストであり、最終条件ではありません。
- WARN `/` English leftover: News
- WARN `/exchanges/binance` English leftover: Source review status
- WARN `/exchanges/binance` English leftover: Verify public products, regional eligibility and official fees first
- WARN `/exchanges/binance` English leftover: Only source-linked facts with a review date are publishable
- WARN `/exchanges/binance` English leftover: Regional restrictions, account eligibility and campaign terms need official verification
- WARN `/exchanges/binance` English leftover: Pending
- WARN `/exchanges/binance` English leftover: Audit Mechanism
- WARN `/exchanges/binance` English leftover: Refer to official disclosure
- WARN `/exchanges/binance` English leftover: Addresses and audit scope require official-source verification
- WARN `/exchanges/binance` English leftover: 3-Step Verification Guide
- WARN `/exchanges/binance` English leftover: View Official PoR Audit Report ↗
- WARN `/exchanges/binance` English leftover: ● Source record match
- WARN `/exchanges/binance` English leftover: Binance fees and product navigation
- WARN `/exchanges/binance` English leftover: Binance identity verification FAQ
- WARN `/exchanges/binance,/compare/binance-vs-okx` English leftover: [mixed] يعتمد على صف Regular User في جدول Spot & Margin العام لدى Binance. خصم BNB 25%، وأعمدة USDC، وفئات VIP، والعروض،
- WARN `/exchanges/binance` English leftover: ● Source record match
- WARN `/exchanges/binance` English leftover: Binance fees and product navigation
- WARN `/exchanges/binance` English leftover: Binance identity verification FAQ

## clicklat (1)

- WARN `/@1440` clicklat produced no data: wright._impl._errors.Error: Page.evaluate: TypeError: Cannot read properties of null (reading 'scrollIntoView')
    at eval (eval at evaluate (:302:30), <anonymous>:1:30)
    at eval (<anonymous>)
    at UtilityScript.evaluate (<anonymous>:302:30)
    at UtilityScript.<anonymous> (<anonymous>:1:44)

