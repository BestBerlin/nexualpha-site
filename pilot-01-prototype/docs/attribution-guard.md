# Attribution guard

Run `npm run build` before `npm run test:sites`. The guard fails if built HTML or the full prerender manifest is missing. It parses all built HTML and every prerender asset, including home variants, renders every academy lesson, all 200 coin pages, all four app-download pages and the three campaign pages through the built SSR renderer in all 17 UI locales, and scans `src/content` and `src/data` literals (including TypeScript) and text documents.

Registered query values must match exactly; opaque path codes are checked against registered destinations. Main partner links and Binance/Bitget campaign links are independent valid destinations. `/go` destinations must name an existing venue or registered campaign; every emitted `/go` URL is also checked through the real redirect handler. Official-only venues use their unchanged registry URLs for tracking. Omitted referral venues remain unavailable. Bybit Stocks uses its existing `/go/bybit` route; Kraken retains its registered route.

Every neutral locale (`ru`, `ar`, `zh-Hant`, `ur`, `uk`) blocks sign-up routes. Turkish pages retain Bitget source labels as text. Internal informational venue links remain available.

Registry `registrationUrl` declarations for venues explicitly marked `hasReferral: false` are configuration inventory, not outbound clicks; their rendered links are still scanned and must use `/go` or an informational exception. Templates are checked after SSR resolves them. No partner codes or commission rules were changed.

## Final non-sign-up allow-list

Sign-up/campaign CTA attributes override every exception. Identity homepages require a source/identity context; reward-hub and expired-campaign pages require a citation context. An unqualified bare CEX homepage fails.

| # | Exact hosts | Path rule | Reason |
| --- | --- | --- | --- |
| 1 | `www.binance.com`, `binance.com` | `/^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:fee(?:\/&#124;$)&#124;support(?:\/(?:faq&#124;announcement)(?:\/&#124;$)&#124;$)&#124;academy\/articles&#124;blog&#124;about-legal&#124;risk-warning&#124;network&#124;square\/post)/` | Official fee schedules, help evidence and announcement sources. |
| 2 | `www.okx.com`, `okx.com` | `/^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:fees&#124;help&#124;learn&#124;proof-of-reserves&#124;docs-v5&#124;service-center&#124;status&#124;about)(?:\/&#124;$)/` | Official fees, help, educational evidence and reserve disclosures. |
| 3 | `www.bybit.com`, `bybit.com` | `/^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?help-center(?:\/&#124;$)/` | Official fee and eligibility help articles. |
| 4 | `announcements.bybit.com` | `/^\/(?:en&#124;en-US)\/(?:article\/&#124;$)/` | Official announcement index and article sources. |
| 5 | `www.bitget.com`, `bitget.com` | `/^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:support&#124;academy&#124;fee&#124;api-doc&#124;docs&#124;promotion\/regulatory-license)(?:\/&#124;$)/` | Official help, educational evidence and fee pages. |
| 6 | `support.kraken.com` | `/^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:articles&#124;sections&#124;hc\/en-us\/articles&#124;$)(?:\/&#124;$)/` | Official Kraken support evidence. |
| 7 | `www.kraken.com`, `kraken.com` | `/^\/(?:[a-z]{2}-[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:features&#124;legal&#124;learn&#124;wallet&#124;xstocks)(?:\/&#124;$)/` | Kraken fee schedule and legal terms. |
| 8 | `blog.kraken.com` | `/^\//` | Official Kraken announcement blog and feed. |
| 9 | `www.gate.com`, `www.gate.io`, `gate.com`, `gate.io` | `/^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:fee&#124;help&#124;announcements&#124;article&#124;docs&#124;legal&#124;learn)(?:\/&#124;$)/` | Gate fee, help and announcement evidence. |
| 10 | `www.mexc.com`, `mexc.com`, `www.mexc.co` | `/^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:fee&#124;support&#124;terms&#124;announcements&#124;learn&#124;api-docs)(?:\/&#124;$)/` | MEXC fee, help and mandatory identity-verification terms. |
| 11 | `www.htx.com`, `htx.com` | `/^\/(?:[a-z]{2}-[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:fee&#124;support&#124;fees&#124;opendocument)(?:\/&#124;$)/` | HTX fee schedules and official support evidence. |
| 12 | `www.kucoin.com`, `kucoin.com` | `/^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:vip\/level&#124;support&#124;announcement&#124;legal&#124;docs)(?:\/&#124;$)/` | KuCoin fees, support, announcements and legal evidence. |
| 13 | `api.binance.com`, `api.bitget.com`, `api.bybit.com`, `api.kraken.com`, `api.kucoin.com`, `api-futures.kucoin.com`, `api.mexc.com`, `api.gateio.ws`, `api.htx.com`, `futures.kraken.com` | `/^\/(?:api(?:\/&#124;$)&#124;0(?:\/&#124;$)&#124;derivatives\/api\/&#124;$)/` | Official public market-data and fee API endpoints; no registration. |
| 14 | `developers.binance.com`, `docs.kraken.com`, `docs-legacy.kraken.com` | `/^\/(?:en\/docs&#124;docs&#124;api&#124;exchange&#124;llms\.txt&#124;$)(?:\/&#124;$)/` | Official API documentation. |
| 15 | `www.binance.com`, `www.okx.com`, `www.bybit.com`, `www.bitget.com`, `www.gate.com`, `www.gate.io`, `www.mexc.com`, `www.htx.com`, `www.kraken.com`, `www.kucoin.com`, `www.coinbase.com` | `/^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:proof-of-reserves&#124;official-verification&#124;official-verify&#124;cert&#124;security&#124;support-region-list&#124;terms&#124;legal)(?:\/&#124;$)/` | Reserve disclosures, anti-phishing verification, security and jurisdiction/legal evidence. |
| 16 | `docs.dydx.xyz`, `docs.gmx.io`, `docs.drift.trade`, `docs.deribit.com`, `docs.backpack.exchange`, `docs.uniswap.org`, `developers.uniswap.org`, `docs.raydium.io`, `docs.pancakeswap.finance`, `developer.pancakeswap.finance`, `dev.jup.ag`, `developers.jup.ag`, `station.jup.ag`, `docs.cdp.coinbase.com`, `resources.curve.finance` | `/^\/(?:docs&#124;contracts&#124;advanced-trade&#124;api-reference&#124;products&#124;getting-started&#124;reference&#124;raydium&#124;user&#124;concepts&#124;welcome-to-pancakeswap&#124;integration-guides&#124;coinbase-app&#124;coinbase-business&#124;exchange&#124;get-started&#124;payments&#124;prime&#124;wallets&#124;x402&#124;$)/` | Official protocol/API documentation and safety/fee references; no sign-up destinations. |
| 17 | `support.deribit.com`, `support.uniswap.org` | `/^\/hc\/[a-z-]+\/articles\//` | Official support articles about fees, referrals, margin and wallet safety. |
| 18 | `support.backpack.exchange` | `/^\/(?:exchange&#124;technical-docs&#124;backpack-securities)\//` | Official account eligibility, securities boundaries and referral terms. |
| 19 | `help.dydx.trade` | `/^\/en\/(?:articles\/&#124;$)/` | Official dYdX fee, funding and liquidation documentation. |
| 20 | `help.coinbase.com` | `/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:coinbase&#124;exchange&#124;pro&#124;account-protection-overview&#124;developer-platform&#124;getting-started&#124;new-customer-guide&#124;prime&#124;trading-and-funding&#124;wallet)(?:\/&#124;$)/` | Official fees, funding, verification and eligibility support articles. |
| 21 | `learn.backpack.exchange` | `/^\/(?:about&#124;articles&#124;blog)(?:\/&#124;$)/` | Official Backpack product and securities educational sources. |
| 22 | `blog.uniswap.org`, `blog.pancakeswap.finance` | `/^\/(?:blog(?:\/&#124;$)&#124;articles\/&#124;how-permissioned-pools-work-on-uniswap-v4&#124;$)/` | Official product announcement blogs; non-conversion sources. |
| 23 | `www.drift.trade`, `jup.ag`, `insights.deribit.com` | `/^\/(?:updates&#124;exchange-updates)(?:\/&#124;$)/` | Official recovery/product announcement sources. |
| 24 | `www.deribit.com` | `/^\/api\/v2(?:\/&#124;$)/` | Official public instrument API. |
| 25 | `www.okx.com` | `/^\/api\/v5(?:\/&#124;$)/` | Official public market-data API. |
| 26 | `api.coinbase.com`, `api.raydium.io`, `api.uniswap.org`, `api.hyperliquid.xyz`, `quote-api.jup.ag`, `indexer.dydx.trade`, `dlob.drift.trade`, `api.backpack.exchange` | `/^\/(?:api&#124;v[1246]&#124;info&#124;$)/` | Official public data/quote endpoints, not sign-up pages. |
| 27 | `web3.bitget.com` | `/^\/en\/docs(?:\/&#124;$)/` | Official wallet developer documentation. |
| 28 | `www.okx.com` | `/^\/cdn\/assets\/plugins\/announcements\/contentful\/.+\/Risk_Warning___Disclosure_Statement\.pdf$/` | Exact legal risk-disclosure PDF family. |
| 29 | `aerodrome.finance` | `/^\/docs(?:\/&#124;$)/` | Official protocol and launcher documentation. |
| 30 | `www.coinbase.com` | `/^\/(?:[a-z]{2}-[a-z]{2}\/)?(?:blog&#124;learn&#124;institutional\/research-insights)(?:\/&#124;$)/` | Official Coinbase product announcements. |
| 31 | `status.coinbase.com`, `status.exchange.coinbase.com`, `status.kraken.com` | `/^\/(?:api(?:\/&#124;$)&#124;$)/` | Official service status and incident APIs. |
| 32 | `web3.okx.com` | `/^\/(?:dex-fees&#124;help)(?:\/&#124;$)/` | Official wallet fee and legal documentation. |
| 33 | `app.hyperliquid.xyz` | `/^\/terms$/` | Official Hyperliquid legal terms. |
| 34 | `support.jup.ag` | `/^\/$/` | Official Jupiter support index. |
| 35 | `www.binance.com`, `www.okx.com`, `www.bybit.com`, `www.bitget.com`, `www.gate.io`, `www.gate.com`, `www.mexc.com`, `www.htx.com`, `www.kraken.com`, `www.kucoin.com`, `www.deribit.com`, `backpack.exchange`, `app.hyperliquid.xyz`, `hyperliquid.xyz`, `app.drift.trade`, `drift.trade`, `www.drift.trade`, `gmx.io`, `www.coinbase.com` | `/^\/$/` | Official domain identity evidence; restricted to recorded identity/source and brand-provenance references, never sign-up buttons. |
| 36 | `app.uniswap.org`, `uniswap.org`, `pancakeswap.finance`, `curve.finance`, `aerodrome.finance`, `dydx.trade`, `raydium.io`, `jup.ag`, `info.uniswap.org` | `/^\/(?:info&#124;liquidity&#124;perps&#124;$)(?:\/&#124;$)/` | Non-sign-up protocol identity, public pool data and app verification references; these venues have no registered referral route. |
| 37 | `www.binance.com`, `www.okx.com`, `www.bitget.com`, `www.bybit.com` | `/^\/(?:[a-z]{2}\/)?(?:download&#124;learn\/how-to-download-and-install-binance)(?:\/&#124;$)/` | Official app-download and installation verification pages; sign-up CTAs use /go separately. |
| 38 | `www.htx.com` | `/^\/en-us\/finance\/proof-of-reserves\/?$/` | Official HTX reserve disclosure. |
| 39 | `www.binance.com` | `/^\/en\/futures\/trading-parameters$/` | Official trading-parameter/fee evidence. |
| 40 | `www.binance.com` | `/^\/en\/markets\/opportunity$/` | Official market-discovery evidence cited by news. |
| 41 | `www.okx.com` | `/^\/trade-swap\/orcl-usd-swap$/` | Specific instrument page cited as product-existence evidence, not a sign-up CTA. |
| 42 | `www.coinbase.com` | `/^\/(?:en-in\/exchange&#124;en-sg&#124;business)$/` | Official regional eligibility and product-scope evidence. |
| 43 | `pro.kraken.com` | `/^\/perps\/crypto-perpetuals$/` | Official product-scope evidence. |
| 44 | `square.htx.com` | `/^\/zh\//` | Official community announcement/security sources. |
| 45 | `unified.jup.ag` | `/^\/$/` | Official Jupiter API product documentation index. |
| 46 | `help.coinbase.com` | `/^\/en\/?$/` | Official help index. |
| 47 | `app.gmx.io` | `/^\/$/` | Public pool reserve evidence, exactly the /#/pools view. |
| 48 | `raydium.io` | `/^\/swap$/` | Non-sign-up protocol swap-interface reference; no referral route is registered. |
| 49 | `www.binance.com` | `/^\/en\/rewards-hub$/` | Rewards terms source in reviewed campaign research; conversion buttons retain attributed destinations. |
| 50 | `www.gate.com` | `/^\/rewards_hub$/` | Rewards terms source in reviewed campaign research; conversion buttons retain attributed destinations. |
| 51 | `www.mexc.com` | `/^\/zh-MY\/campaigns\/TradingPapa8$/` | Expired campaign terms retained as historical evidence, not an active conversion destination. |
| 52 | `hyperliquid.gitbook.io` | `/^\/hyperliquid-docs(?:\/&#124;$)/` | Official protocol fee, risk, referral and API documentation hosted on GitBook. |
| 53 | `www.bitget.com`, `hyperliquid.xyz`, `www.kraken.com` | `/^\/(?:baseasset\/favicon4\.png&#124;micro-runtime\/images\/logo-light\.svg&#124;apple-touch-icon\.png&#124;_assets\/icons\/apple-touch-icon\.png)$/` | Exact official brand-image acquisition URLs; source metadata only, not outbound conversion links. |
| 54 | `fapi.binance.com` | `/^\/(?:futures\/data&#124;fapi\/v1)\//` | Official public USDT-M futures statistics API used as a /long-short data source. |
| 55 | `api.bybit.com` | `/^\/v5\/market\//` | Official public v5 market-data API used as a /long-short data source. |
| 56 | `www.kraken.com` | `/^\/competitions\//` | Official Kraken competition terms cited as the campaign source (source context only); conversion buttons use /go. |
| 57 | `www.okx.com` | `/^\/affiliatedownload\/apk$/` | Official OKX channel-APK URL (channelId NEXU888 binds the invite), source literal for the /go/okx-apk redirect only. |
| 58 | `download.binance.com` | `/^\/pack\/[A-Za-z0-9_]+\.apk$/` | Official Binance channel APK, source literal for the /go/binance-apk redirect only; the page shows the code beside the button. |
