// Reviewed non-conversion destinations. Campaign-term exceptions below require citation context.
// Sign-up/campaign CTA attributes always override these exceptions in the guard.
// Each rule is host/path bounded; new destination families require a reason and review.
const rule = (hosts, path, reason, context = () => true) => ({ hosts, path, reason, matches: (url, attrs = {}) => hosts.includes(url.hostname) && path.test(url.pathname) && context(attrs) });
export const ATTRIBUTION_ALLOWLIST = [
  rule(['backpack.exchange'], /^\/fees$/, 'Official Backpack fee schedule added to the reviewed fee facts on 2026-10-23; citation only, never a sign-up exception.'),
  rule(['www.binance.com', 'binance.com'], /^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:fee(?:\/|$)|support(?:\/(?:faq|announcement)(?:\/|$)|$)|academy\/articles|blog|about-legal|risk-warning|network|square\/post)/, 'Official fee schedules, help evidence and announcement sources.'),
  rule(['www.okx.com', 'okx.com'], /^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:fees|help|learn|proof-of-reserves|docs-v5|service-center|status|about)(?:\/|$)/, 'Official fees, help, educational evidence and reserve disclosures.'),
  rule(['www.bybit.com', 'bybit.com'], /^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?help-center(?:\/|$)/, 'Official fee and eligibility help articles.'),
  rule(['announcements.bybit.com'], /^\/(?:en|en-US)\/(?:article\/|$)/, 'Official announcement index and article sources.'),
  rule(['www.bitget.com', 'bitget.com'], /^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:support|academy|fee|api-doc|docs|promotion\/regulatory-license)(?:\/|$)/, 'Official help, educational evidence and fee pages.'),
  rule(['support.kraken.com'], /^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:articles|sections|hc\/en-us\/articles|$)(?:\/|$)/, 'Official Kraken support evidence.'),
  rule(['www.kraken.com', 'kraken.com'], /^\/(?:[a-z]{2}-[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:features|legal|learn|wallet|xstocks)(?:\/|$)/, 'Kraken fee schedule and legal terms.'),
  rule(['blog.kraken.com'], /^\//, 'Official Kraken announcement blog and feed.'),
  rule(['www.gate.com', 'www.gate.io', 'gate.com', 'gate.io'], /^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:fee|help|announcements|article|docs|legal|learn)(?:\/|$)/, 'Gate fee, help and announcement evidence.'),
  rule(['www.mexc.com', 'mexc.com', 'www.mexc.co'], /^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:fee|support|terms|announcements|learn|api-docs)(?:\/|$)/, 'MEXC fee, help and mandatory identity-verification terms.'),
  rule(['www.htx.com', 'htx.com'], /^\/(?:[a-z]{2}-[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:fee|support|fees|opendocument)(?:\/|$)/, 'HTX fee schedules and official support evidence.'),
  rule(['www.kucoin.com', 'kucoin.com'], /^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:vip\/level|support|announcement|legal|docs)(?:\/|$)/, 'KuCoin fees, support, announcements and legal evidence.'),
  rule(['api.binance.com', 'api.bitget.com', 'api.bybit.com', 'api.kraken.com', 'api.kucoin.com', 'api-futures.kucoin.com', 'api.mexc.com', 'api.gateio.ws', 'api.htx.com', 'futures.kraken.com'], /^\/(?:api(?:\/|$)|0(?:\/|$)|derivatives\/api\/|$)/, 'Official public market-data and fee API endpoints; no registration.'),
  rule(['developers.binance.com', 'docs.kraken.com', 'docs-legacy.kraken.com'], /^\/(?:en\/docs|docs|api|exchange|llms\.txt|$)(?:\/|$)/, 'Official API documentation.'),
  rule(['www.binance.com', 'www.okx.com', 'www.bybit.com', 'www.bitget.com', 'www.gate.com', 'www.gate.io', 'www.mexc.com', 'www.htx.com', 'www.kraken.com', 'www.kucoin.com', 'www.coinbase.com'], /^\/(?:[a-z]{2}(?:-[A-Za-z]{2,4})?\/)?(?:proof-of-reserves|official-verification|official-verify|cert|security|support-region-list|terms|legal)(?:\/|$)/, 'Reserve disclosures, anti-phishing verification, security and jurisdiction/legal evidence.'),
  rule(['docs.dydx.xyz', 'docs.gmx.io', 'docs.drift.trade', 'docs.deribit.com', 'docs.backpack.exchange', 'docs.uniswap.org', 'developers.uniswap.org', 'docs.raydium.io', 'docs.pancakeswap.finance', 'developer.pancakeswap.finance', 'dev.jup.ag', 'developers.jup.ag', 'station.jup.ag', 'docs.cdp.coinbase.com', 'resources.curve.finance'], /^\/(?:docs|contracts|advanced-trade|api-reference|products|getting-started|reference|raydium|user|concepts|welcome-to-pancakeswap|integration-guides|coinbase-app|coinbase-business|exchange|get-started|payments|prime|wallets|x402|$)/, 'Official protocol/API documentation and safety/fee references; no sign-up destinations.'),
  rule(['support.deribit.com', 'support.uniswap.org'], /^\/hc\/[a-z-]+\/articles\//, 'Official support articles about fees, referrals, margin and wallet safety.'),
  rule(['support.backpack.exchange'], /^\/(?:exchange|technical-docs|backpack-securities)\//, 'Official account eligibility, securities boundaries and referral terms.'),
  rule(['help.dydx.trade'], /^\/en\/(?:articles\/|$)/, 'Official dYdX fee, funding and liquidation documentation.'),
  rule(['help.coinbase.com'], /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:coinbase|exchange|pro|account-protection-overview|developer-platform|getting-started|new-customer-guide|prime|trading-and-funding|wallet)(?:\/|$)/, 'Official fees, funding, verification and eligibility support articles.'),
  rule(['learn.backpack.exchange'], /^\/(?:about|articles|blog)(?:\/|$)/, 'Official Backpack product and securities educational sources.'),
  rule(['blog.uniswap.org', 'blog.pancakeswap.finance'], /^\/(?:blog(?:\/|$)|articles\/|how-permissioned-pools-work-on-uniswap-v4|$)/, 'Official product announcement blogs; non-conversion sources.'),
  rule(['www.drift.trade', 'jup.ag', 'insights.deribit.com'], /^\/(?:updates|exchange-updates)(?:\/|$)/, 'Official recovery/product announcement sources.'),
  rule(['www.deribit.com'], /^\/api\/v2(?:\/|$)/, 'Official public instrument API.'),
  rule(['www.okx.com'], /^\/api\/v5(?:\/|$)/, 'Official public market-data API.'),
  rule(['api.coinbase.com', 'api.raydium.io', 'api.uniswap.org', 'api.hyperliquid.xyz', 'quote-api.jup.ag', 'indexer.dydx.trade', 'dlob.drift.trade', 'api.backpack.exchange'], /^\/(?:api|v[1246]|info|$)/, 'Official public data/quote endpoints, not sign-up pages.'),
  rule(['web3.bitget.com'], /^\/en\/docs(?:\/|$)/, 'Official wallet developer documentation.'),
  rule(['www.okx.com'], /^\/cdn\/assets\/plugins\/announcements\/contentful\/.+\/Risk_Warning___Disclosure_Statement\.pdf$/, 'Exact legal risk-disclosure PDF family.'),
  rule(['aerodrome.finance'], /^\/docs(?:\/|$)/, 'Official protocol and launcher documentation.'),
  rule(['www.coinbase.com'], /^\/(?:[a-z]{2}-[a-z]{2}\/)?(?:blog|learn|institutional\/research-insights)(?:\/|$)/, 'Official Coinbase product announcements.'),
  rule(['status.coinbase.com', 'status.exchange.coinbase.com', 'status.kraken.com'], /^\/(?:api(?:\/|$)|$)/, 'Official service status and incident APIs.'),
  rule(['web3.okx.com'], /^\/(?:dex-fees|help)(?:\/|$)/, 'Official wallet fee and legal documentation.'),
  rule(['app.hyperliquid.xyz'], /^\/terms$/, 'Official Hyperliquid legal terms.'),
  rule(['support.jup.ag'], /^\/$/, 'Official Jupiter support index.'),
  // Identity links are permitted only in an explicitly informational context; a bare conversion link still fails.
  rule(['www.binance.com', 'www.okx.com', 'www.bybit.com', 'www.bitget.com', 'www.gate.io', 'www.gate.com', 'www.mexc.com', 'www.htx.com', 'www.kraken.com', 'www.kucoin.com', 'www.deribit.com', 'backpack.exchange', 'app.hyperliquid.xyz', 'hyperliquid.xyz', 'app.drift.trade', 'drift.trade', 'www.drift.trade', 'gmx.io', 'www.coinbase.com'], /^\/$/, 'Official domain identity evidence; restricted to recorded identity/source and brand-provenance references, never sign-up buttons.', attrs =>
    attrs.sourceLiteral && attrs.sourceContext && attrs.sourceKey !== 'affiliateUrl'
    || attrs['data-cta-placement'] === 'factbook-official-domain'
    || attrs['data-cta-kind'] === 'source'
    || attrs.sourceContext
    || ['v3-expand-tiers-btn', 'v3-por-audit-btn', 'v3-open-verifier-btn', 'v3-por-audit-link', 'factbook-merkle-link'].includes(attrs.class)),
  rule(['app.uniswap.org', 'uniswap.org', 'pancakeswap.finance', 'curve.finance', 'aerodrome.finance', 'dydx.trade', 'raydium.io', 'jup.ag', 'info.uniswap.org'], /^\/(?:info|liquidity|perps|$)(?:\/|$)/, 'Non-sign-up protocol identity, public pool data and app verification references; these venues have no registered referral route.'),
  rule(['www.binance.com', 'www.okx.com', 'www.bitget.com', 'www.bybit.com'], /^\/(?:[a-z]{2}\/)?(?:download|learn\/how-to-download-and-install-binance)(?:\/|$)/, 'Official app-download and installation verification pages; sign-up CTAs use /go separately.'),
  // Fiat-rails research (deposit hub, 2026-10-15): exact official product/help pages cited as plain-text sources on
  // /deposit and /crypto-cards (src/data/fiat-rails.generated.js); rendered pages never link them directly.
  rule(['web3.bitget.com', 'www.gate.com'], /^\/card$/, 'Official crypto-card product descriptions cited as plain-text fiat sources.'),
  rule(['www.bitget.com'], /^\/news\/detail\/\d+$/, 'Official Bitget announcement cited as a dated fiat-rail source.'),
  rule(['www.coinw.com'], /^\/crypto-card$/, 'Official CoinW card page and FAQ cited as plain-text sources.'),
  rule(['www.gate.tr'], /^\/en\/help\/guidetr\/deposit_withdraw_tr\/\d+$/, 'Gate TR (separate Turkish entity) TRY deposit/withdrawal guides cited as plain-text sources.'),
  rule(['square.htx.com'], /^\/purchasing-crypto-with-fiat\/$/, 'Official HTX fiat-purchase guide cited as a plain-text source.'),
  rule(['blog.mexc.com'], /^\/press-release\/[a-z0-9-]+\/$/, 'Official MEXC press release cited as a dated card source.'),
  rule(['www.htx.com'], /^\/en-us\/finance\/proof-of-reserves\/?$/, 'Official HTX reserve disclosure.'),
  rule(['www.binance.com'], /^\/en\/futures\/trading-parameters$/, 'Official trading-parameter/fee evidence.'),
  rule(['www.binance.com'], /^\/en\/markets\/opportunity$/, 'Official market-discovery evidence cited by news.'),
  rule(['www.okx.com'], /^\/trade-swap\/orcl-usd-swap$/, 'Specific instrument page cited as product-existence evidence, not a sign-up CTA.'),
  rule(['www.coinbase.com'], /^\/(?:en-in\/exchange|en-sg|business)$/, 'Official regional eligibility and product-scope evidence.'),
  rule(['pro.kraken.com'], /^\/perps\/crypto-perpetuals$/, 'Official product-scope evidence.'),
  rule(['square.htx.com'], /^\/zh\//, 'Official community announcement/security sources.'),
  rule(['unified.jup.ag'], /^\/$/, 'Official Jupiter API product documentation index.'),
  rule(['help.coinbase.com'], /^\/en\/?$/, 'Official help index.'),
  rule(['app.gmx.io'], /^\/$/, 'Public pool reserve evidence, exactly the /#/pools view.', attrs => attrs.href?.endsWith('/#/pools')),
  rule(['raydium.io'], /^\/swap$/, 'Non-sign-up protocol swap-interface reference; no referral route is registered.'),
  rule(['www.binance.com'], /^\/en\/rewards-hub$/, 'Rewards terms source in reviewed campaign research; conversion buttons retain attributed destinations.', attrs => attrs.sourceLiteral || attrs.class === 'campaign-card__source-link' || attrs.class === 'v3-versus-source-link' || ['activity-center-v3__source-actions', 'official-research__source-head'].includes(attrs.sourceContext)),
  rule(['www.gate.com'], /^\/rewards_hub$/, 'Rewards terms source in reviewed campaign research; conversion buttons retain attributed destinations.', attrs => attrs.sourceLiteral || attrs.class === 'campaign-card__source-link' || attrs.class === 'v3-versus-source-link' || ['activity-center-v3__source-actions', 'official-research__source-head'].includes(attrs.sourceContext)),
  rule(['www.mexc.com'], /^\/zh-MY\/campaigns\/TradingPapa8$/, 'Expired campaign terms retained as historical evidence, not an active conversion destination.', attrs => attrs.sourceLiteral || attrs.class === 'campaign-card__source-link' || attrs.class === 'v3-versus-source-link' || ['activity-center-v3__source-actions', 'official-research__source-head'].includes(attrs.sourceContext)),
  rule(['fapi.binance.com'], /^\/(?:futures\/data|fapi\/v1)\//, 'Official public USDT-M futures statistics API used as a /long-short data source.'),
  rule(['api.bybit.com'], /^\/v5\/market\//, 'Official public v5 market-data API used as a /long-short data source.'),
  rule(['api.bybit.com'], /^\/v5\/announcements\/index$/, 'Official public announcements API: campaign start/end times cited on the tokenized-stocks pages.'),
  rule(['contract.mexc.com'], /^\/api\/v1\/contract\/detail$/, 'Official public MEXC futures contract list: stock-perpetual symbols, leverage and fees (tokenized-stocks live snapshot).'),
  rule(['www.kraken.com'], /^\/competitions\//, 'Official Kraken competition terms cited as the campaign source; conversion buttons use /go.', attrs => attrs.sourceLiteral || attrs.class === 'campaign-card__source-link'),
  rule(['www.okx.com'], /^\/affiliatedownload\/apk$/, 'Official OKX channel-APK URL (channelId NEXU888 binds the invite) used only as the /go/okx-apk server redirect target.', attrs => attrs.sourceLiteral),
  rule(['download.binance.com'], /^\/pack\/[A-Za-z0-9_]+\.apk$/, 'Official Binance channel APK used only as the /go/binance-apk server redirect target; the page shows the code beside the button.', attrs => attrs.sourceLiteral),
  rule(['www.coinw.com', 'coinw.com'], /^\/(?:[a-z]{2}_[A-Z]{2}\/)?(?:about-us|proof-of-reserves|install-app|fees|help-center)(?:\/|$)/, 'CoinW about, reserve disclosure, app-download, fee and help-center evidence (KYC, legal statement, announcements); sign-up CTAs use /go/coinw.'),
  rule(['www.coinw.com', 'coinw.com'], /^\/$/, 'Official CoinW domain identity evidence; restricted to recorded identity/source and brand-provenance references, never sign-up buttons.', attrs =>
    attrs.sourceLiteral && attrs.sourceContext && attrs.sourceKey !== 'affiliateUrl'
    || attrs['data-cta-placement'] === 'factbook-official-domain'
    || attrs['data-cta-kind'] === 'source'
    || attrs.sourceContext
    || attrs.sourceLiteral && ['officialPage', 'officialVerifyUrl'].includes(attrs.sourceKey)
    || ['v3-expand-tiers-btn', 'v3-por-audit-btn', 'v3-open-verifier-btn', 'v3-por-audit-link', 'factbook-merkle-link'].includes(attrs.class)),
  rule(['hyperliquid.gitbook.io'], /^\/hyperliquid-docs(?:\/|$)/, 'Official protocol fee, risk, referral and API documentation hosted on GitBook.'),
  rule(['www.bitget.com', 'hyperliquid.xyz', 'www.kraken.com'], /^\/(?:baseasset\/favicon4\.png|micro-runtime\/images\/logo-light\.svg|apple-touch-icon\.png|_assets\/icons\/apple-touch-icon\.png)$/, 'Exact official brand-image acquisition URLs; source metadata only, not outbound conversion links.', attrs => attrs.sourceLiteral && attrs.sourceKey === 'directUrl'),
  // Tokenized US stocks research sources (src/data/tokenized-stocks-facts.js, 2026-10-15): official product, FAQ and listing
  // pages cited next to each fact. Rendered pages print them as plain text unless outboundLink can route them through /go.
  rule(['www.bitget.com'], /^\/(?:campaigns\/bitget-rtoken|asia\/academy\/bitget-rtoken-faq)$/, 'Bitget rToken product page and FAQ: tokenized-stock ticker, hours and KYC evidence (source literal only).', attrs => attrs.sourceLiteral),
  rule(['www.okx.com'], /^\/ru\/campaigns\/xstocks-equity-trading$/, 'OKX xStocks listing evidence (source literal only).', attrs => attrs.sourceLiteral),
  rule(['www.bybit.com'], /^\/en\/learn\/bybit-tradfi\//, 'Bybit TradFi perpetuals and xStocks guides: product evidence (source literal only).', attrs => attrs.sourceLiteral),
  rule(['www.kraken.com'], /^\/pro\/perps\/xstocks-perpetuals$/, 'Kraken xStocks perpetuals product page: leverage and availability evidence (source literal only).', attrs => attrs.sourceLiteral),
  rule(['www.gate.com'], /^\/ja\/blog\/gate-pre-ipos-updates-how-retail-users-can-participate$/, 'Gate pre-IPO perpetuals evidence (source literal only).', attrs => attrs.sourceLiteral),
  rule(['square.htx.com'], /^\/(?:htx-|popular-tradfi-assets)/, 'HTX official research and product posts: TradFi perpetuals evidence (source literal only).', attrs => attrs.sourceLiteral),
  rule(['www.coinw.com'], /^\/academy\/articles\//, 'CoinW TradFi academy article: stock perpetuals evidence (source literal only).', attrs => attrs.sourceLiteral),
  rule(['backpack.exchange'], /^\/markets$/, 'Backpack public markets list: equity perpetuals evidence (source literal only).', attrs => attrs.sourceLiteral),
];
