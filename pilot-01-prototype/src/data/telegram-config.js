import { LOCALE_PREFIX_BY_CODE, localizedPath } from "./locale-routing.js";
import { priorityCanonicalOwnerPath } from "./priority-query-owner-registry.js";
import { buildTelegramReturnContext, readTelegramReturnContext } from "./telegram-decision-return.js";

// NexuAlpha 官方 Telegram 生态唯一权威凭据配置
// 严格对齐 /Telegram 项目真实运行中的 Bot、Channel 与 Group，绝不捏造。

export const TELEGRAM_CONFIG = {
  botUsername: "NexuAlphaAssistantBot",
  botUrl: "https://t.me/NexuAlphaAssistantBot",
  channelUsername: "NexuAlphaClub",
  channelUrl: "https://t.me/NexuAlphaClub",
  webPreviewUrl: "https://t.me/s/NexuAlphaClub",
  groupUsername: "NexuAlphaWorld",
  groupUrl: "https://t.me/NexuAlphaWorld",
};

export const TELEGRAM_RESEARCH_PATHS = [
  {
    id: "fee-comparison",
    question: {
      en: "Which venue is cheaper for my next trade?",
      "zh-Hans": "下一笔交易哪个平台成本更低？",
      "zh-Hant": "下一筆交易哪個平台成本更低？",
      "pt-BR": "Qual plataforma custa menos para minha proxima operacao?",
      ko: "다음 거래에서 어떤 플랫폼의 비용을 먼저 확인해야 하나요?",
      tr: "Bir sonraki işlem için hangi platformun maliyetini önce kontrol etmeliyim?",
    },
    answer: {
      en: "Start with published fees, then check spread, funding, withdrawal network and account-specific conditions separately.",
      "zh-Hans": "先看公开费率，再把点差、资金费、提现网络和账户内条件分开核对。",
      "zh-Hant": "先看公開費率，再把點差、資金費、提現網路和帳戶內條件分開核對。",
      "pt-BR": "Comece pelas taxas publicadas, depois separe spread, funding, saque e condicoes da conta.",
      ko: "공개 수수료를 먼저 보고 스프레드, 펀딩, 출금 네트워크와 계정별 조건을 따로 확인하세요.",
      tr: "Önce yayımlanan ücretleri, sonra spread, fonlama, çekim ağı ve hesaba özel koşulları ayrı ayrı kontrol edin.",
    },
    entries: [
      { label: { en: "Compare Binance vs OKX", "zh-Hans": "比较 Binance 与 OKX", "zh-Hant": "比較 Binance 與 OKX", "pt-BR": "Comparar Binance vs OKX", ko: "Binance vs OKX 비교", tr: "Binance vs OKX karşılaştır" }, href: "/compare/binance-vs-okx" },
      { label: { en: "Open Hyperliquid fee detail", "zh-Hans": "查看 Hyperliquid 费用详情", "zh-Hant": "查看 Hyperliquid 費用詳情", "pt-BR": "Ver custos da Hyperliquid", ko: "Hyperliquid 비용 세부 정보", tr: "Hyperliquid ücret detayını aç" }, href: "/exchanges/hyperliquid" },
      { label: { en: "Use the fee scenario tool", "zh-Hans": "打开费用情景工具", "zh-Hant": "打開費用情景工具", "pt-BR": "Usar simulador de custos", ko: "수수료 시나리오 도구 사용", tr: "Ücret senaryosu aracını kullan" }, href: "/rates" },
    ],
    deepLinkAction: { action: "fee_calc", venue: "binance", product: "spot" },
  },
  {
    id: "regional-onboarding",
    question: {
      en: "Can I open and fund an account in my region?",
      "zh-Hans": "我所在地区能开户和入金吗？",
      "zh-Hant": "我所在地區能開戶和入金嗎？",
      "pt-BR": "Posso abrir e financiar uma conta na minha regiao?",
      ko: "내 지역에서 계정을 만들고 입금할 수 있는지 어디서 확인하나요?",
      tr: "Bölgemde hesap açma ve para yatırma koşullarını nerede doğrularım?",
    },
    answer: {
      en: "Treat region, identity, funding rail, product access and visible account benefit as separate checks before any signup route.",
      "zh-Hans": "把地区、身份、入金通道、产品权限和账户内可见权益拆成独立核验项，再进入注册路径。",
      "zh-Hant": "把地區、身分、入金通道、產品權限和帳戶內可見權益拆成獨立核驗項，再進入註冊路徑。",
      "pt-BR": "Separe regiao, identidade, trilho de deposito, produto e beneficio visivel antes de qualquer cadastro.",
      ko: "지역, 신원 확인, 입금 경로, 상품 접근성과 계정 내 표시 조건을 분리해 확인한 뒤 계정 경로로 이동하세요.",
      tr: "Bölge, kimlik, para yatırma yolu, ürün erişimi ve hesapta görünen koşulları ayrı kontrol etmeden kayıt rotasına geçmeyin.",
    },
    entries: [
      { label: { en: "Brazil account checklist", "zh-Hans": "巴西账户核对表", "zh-Hant": "巴西帳戶核對表", "pt-BR": "Checklist de conta Brasil", ko: "브라질 계정 체크리스트", tr: "Brezilya hesap kontrol listesi" }, href: "/br/conta" },
      { label: { en: "Korea account research", "zh-Hans": "韩国账户研究入口", "zh-Hant": "韓國帳戶研究入口", "pt-BR": "Pesquisa de conta Coreia", ko: "한국 계정 리서치", tr: "Kore hesap araştırması" }, href: "/kr" },
      { label: { en: "Turkey market research", "zh-Hans": "土耳其市场研究入口", "zh-Hant": "土耳其市場研究入口", "pt-BR": "Pesquisa de mercado Turquia", ko: "튀르키예 시장 리서치", tr: "Türkiye piyasa araştırması" }, href: "/markets/turkiye" },
    ],
    deepLinkAction: { action: "partner_desk", market: "BR", locale: "pt-BR", product: "spot" },
  },
  {
    id: "dex-safety",
    question: {
      en: "What should I verify before using a DEX or Perp DEX?",
      "zh-Hans": "使用 DEX 或 Perp DEX 前先核验什么？",
      "zh-Hant": "使用 DEX 或 Perp DEX 前先核驗什麼？",
      "pt-BR": "O que verificar antes de usar uma DEX ou Perp DEX?",
      ko: "DEX 또는 Perp DEX를 쓰기 전에 무엇을 확인해야 하나요?",
      tr: "DEX veya Perp DEX kullanmadan önce neyi doğrulamalıyım?",
    },
    answer: {
      en: "Check official domain, wallet route, network, token or market identifier, fees, slippage and liquidation rules before signing.",
      "zh-Hans": "签名前先核验官方域名、钱包路径、网络、代币或市场标识、费用、滑点和清算规则。",
      "zh-Hant": "簽名前先核驗官方網域、錢包路徑、網路、代幣或市場標識、費用、滑點和清算規則。",
      "pt-BR": "Confira dominio oficial, carteira, rede, token ou mercado, taxas, slippage e liquidacao antes de assinar.",
      ko: "서명 전에 공식 도메인, 지갑 경로, 네트워크, 토큰 또는 마켓 식별자, 수수료, 슬리피지와 청산 규칙을 확인하세요.",
      tr: "İmzalamadan önce resmî alan adı, cüzdan yolu, ağ, token veya piyasa kimliği, ücret, kayma ve likidasyon kurallarını kontrol edin.",
    },
    entries: [
      { label: { en: "Uniswap verification path", "zh-Hans": "Uniswap 核验路径", "zh-Hant": "Uniswap 核驗路徑", "pt-BR": "Verificacao Uniswap", ko: "Uniswap 검증 경로", tr: "Uniswap doğrulama yolu" }, href: "/exchanges/uniswap" },
      { label: { en: "Jupiter route checklist", "zh-Hans": "Jupiter 路由核对表", "zh-Hant": "Jupiter 路由核對表", "pt-BR": "Checklist Jupiter", ko: "Jupiter 경로 체크리스트", tr: "Jupiter rota kontrol listesi" }, href: "/exchanges/jupiter" },
      { label: { en: "Hyperliquid vs dYdX", "zh-Hans": "Hyperliquid vs dYdX", "zh-Hant": "Hyperliquid vs dYdX", "pt-BR": "Hyperliquid vs dYdX", ko: "Hyperliquid vs dYdX", tr: "Hyperliquid vs dYdX" }, href: "/compare/hyperliquid-vs-dydx" },
    ],
    deepLinkAction: { action: "verify_domain", venue: "uniswap", product: "spot" },
  },
  {
    id: "ops-news",
    question: {
      en: "Is this exchange update something I need to act on?",
      "zh-Hans": "这条交易所更新需要我操作吗？",
      "zh-Hant": "這條交易所更新需要我操作嗎？",
      "pt-BR": "Essa atualizacao da exchange exige alguma acao?",
      ko: "이 거래소 업데이트가 내 계정에 조치가 필요한 내용인가요?",
      tr: "Bu borsa güncellemesi hesabımda işlem gerektiriyor mu?",
    },
    answer: {
      en: "Use dated research first; separate account impact, open orders, bots, balances, API instruments and official deadlines.",
      "zh-Hans": "先看带日期的研究，再拆分账户影响、挂单、机器人、余额、API 标识和官方截止时间。",
      "zh-Hant": "先看帶日期的研究，再拆分帳戶影響、掛單、機器人、餘額、API 標識和官方截止時間。",
      "pt-BR": "Use pesquisa datada primeiro; separe impacto na conta, ordens, bots, saldos, API e prazo oficial.",
      ko: "날짜가 있는 리서치를 먼저 보고 계정 영향, 미체결 주문, 봇, 잔고, API 식별자와 공식 마감일을 분리해 확인하세요.",
      tr: "Önce tarihli araştırmayı okuyun; hesap etkisi, açık emir, bot, bakiye, API alanı ve resmî son tarihi ayrı değerlendirin.",
    },
    entries: [
      { label: { en: "OKX USD to USDC migration", "zh-Hans": "OKX USD 到 USDC 迁移", "zh-Hant": "OKX USD 到 USDC 遷移", "pt-BR": "Migracao OKX USD para USDC", ko: "OKX USD에서 USDC 이전", tr: "OKX USD'den USDC'ye geçiş" }, href: "/news/okx-usd-to-usdc-spot-pair-migration" },
      { label: { en: "Withdrawal network guide", "zh-Hans": "提现网络指南", "zh-Hant": "提現網路指南", "pt-BR": "Guia de rede de saque", ko: "출금 네트워크 가이드", tr: "Çekim ağı rehberi" }, href: "/news/how-to-choose-crypto-withdrawal-network" },
      { label: { en: "Fee disclosure audit", "zh-Hans": "费率披露审计", "zh-Hant": "費率披露審計", "pt-BR": "Auditoria de taxas", ko: "수수료 공시 점검", tr: "Ücret açıklama denetimi" }, href: "/news/crypto-exchange-fee-disclosure-audit" },
    ],
    deepLinkAction: { action: "rates", venue: "all", product: "research" },
  },
];

export const TELEGRAM_WAVE7_SEARCH_TOPICS = [
  {
    id: "hyperliquid-fees-en",
    query: "hyperliquid fees",
    campaign: "hyperliquid_fees_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    answer: "Hyperliquid cost research starts with maker/taker fees, but funding, margin, liquidation, bridge and wallet-transfer costs must be checked as separate fields.",
    primaryPath: "/exchanges/hyperliquid",
    supportPaths: ["/rates", "/compare/hyperliquid-vs-dydx"],
  },
  {
    id: "hyperliquid-funded-account-en",
    query: "hyperliquid funded account",
    campaign: "hyperliquid_funded_account_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    answer: "A funded-account search must separate self-funded wallet collateral, vault participation and third-party prop-capital claims before any account or wallet route is treated as actionable.",
    primaryPath: "/exchanges/hyperliquid",
    supportPaths: ["/compare/hyperliquid-vs-dydx", "/telegram"],
  },
  {
    id: "uniswap-testnet-en",
    query: "uniswap testnet",
    campaign: "uniswap_testnet_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    answer: "Uniswap testnet research should verify the official app/docs, target network, token contract, wallet approval and gas route before any wallet connection.",
    primaryPath: "/exchanges/uniswap",
    supportPaths: ["/exchanges/jupiter", "/telegram"],
  },
];

export const TELEGRAM_WAVE8_SEARCH_TOPICS = [
  {
    id: "aerodrome-base-pool-en",
    query: "aerodrome base pool",
    campaign: "aerodrome_base_pool_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave8_search_topics",
    answer: "Aerodrome searches should separate Base network readiness, pool fee type, token or pool address, bridge path, incentives and veAERO reward rules before any wallet action.",
    primaryPath: "/exchanges/aerodrome",
    supportPaths: ["/topics/no-kyc", "/exchanges/jupiter"],
  },
  {
    id: "jupiter-swap-route-en",
    query: "jupiter swap route",
    campaign: "jupiter_swap_route_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave8_search_topics",
    answer: "Jupiter route research should verify the official app, token mint, route legs, slippage, platform-fee settings, wallet transaction and Solana network cost before signing.",
    primaryPath: "/exchanges/jupiter",
    supportPaths: ["/exchanges/uniswap", "/topics/no-kyc"],
  },
  {
    id: "no-kyc-dex-check-en",
    query: "no kyc crypto exchange",
    campaign: "no_kyc_dex_check_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave8_search_topics",
    answer: "No-KYC research must separate custodial account claims from non-custodial wallet routes, then check region, fiat access, withdrawal limits, protocol risk and official domains before action.",
    primaryPath: "/topics/no-kyc",
    supportPaths: ["/exchanges/hyperliquid", "/exchanges/uniswap"],
  },
];

export const TELEGRAM_WAVE9_SEARCH_TOPICS = [
  {
    id: "tokenized-treasuries-en",
    query: "tokenized treasury",
    campaign: "tokenized_treasuries_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave9_search_topics",
    answer: "Tokenized treasury research must separate the fund or note, issuer, custodian, reserve asset, transfer rule and redemption claim before treating a token as direct Treasury exposure.",
    primaryPath: priorityCanonicalOwnerPath("tokenized treasury"),
    supportPaths: ["/news/tokenized-treasuries-structure-access-risks", "/topics/compliant-exchanges"],
  },
  {
    id: "okx-usd-usdc-migration-en",
    query: "OKX USD to USDC spot pair migration",
    campaign: "okx_usd_usdc_migration_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave9_search_topics",
    answer: "OKX migration research should check affected instruments, open orders, bots, balances, API identifiers and official deadlines before any live account action.",
    primaryPath: "/news/okx-usd-to-usdc-spot-pair-migration",
    supportPaths: ["/exchanges/okx", "/news/how-to-choose-crypto-withdrawal-network"],
  },
  {
    id: "crypto-perpetual-platform-en",
    query: "crypto perpetual platform",
    campaign: "crypto_perpetual_platform_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave9_search_topics",
    answer: "Perpetual platform research should compare custody model, collateral, funding, liquidation, official app domain and regional account access as separate decisions.",
    primaryPath: "/topics/derivatives",
    supportPaths: ["/compare/hyperliquid-vs-dydx", "/exchanges/hyperliquid"],
  },
];

export const TELEGRAM_WAVE10_SEARCH_TOPICS = [
  {
    id: "korea-regulatory-context-ko",
    query: "한국 가상자산 플랫폼 공식 확인",
    campaign: "kr_regulatory_context_ko",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave10_search_topics",
    locale: "ko",
    answer: "한국 시장 리서치는 FSC/KOFIU의 공식 맥락, 본인확인, 원화 입출금, 상품 범위와 계정별 조건을 분리해 확인한 뒤 Hyperliquid나 Uniswap 같은 글로벌 경로와 비교해야 합니다.",
    primaryPath: "/kr",
    supportPaths: ["/exchanges/hyperliquid", "/exchanges/uniswap"],
  },
  {
    id: "korea-krw-funding-ko",
    query: "원화 입금 실명 계좌 조건",
    campaign: "kr_krw_funding_ko",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave10_search_topics",
    locale: "ko",
    answer: "원화 입금은 실명확인 계좌, 고객확인, 입출금 한도, 앱 내 안내와 공식 도움말을 따로 확인해야 하며, 파트너 경로나 글로벌 DEX 비교가 원화 입금 가능성을 증명하지 않습니다.",
    primaryPath: "/kr",
    supportPaths: ["/rates", "/compare/hyperliquid-vs-dydx"],
  },
  {
    id: "turkey-spk-register-tr",
    query: "Türkiye kripto platformu SPK listesi",
    campaign: "tr_spk_register_tr",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave10_search_topics",
    locale: "tr",
    answer: "Türkiye araştırması SPK'nın güncel geçici listesi, tasfiye listesi, kimlik doğrulama, TRY yatırma yolu ve ürün kapsamını ayrı ayrı kontrol eder; bir liste kaydı yetki, hesap uygunluğu veya ürün erişimi anlamına gelmez.",
    primaryPath: "/markets/turkiye",
    supportPaths: ["/exchanges/hyperliquid", "/exchanges/uniswap"],
  },
  {
    id: "turkey-try-funding-tr",
    query: "TRY yatırma banka hesabı koşulları",
    campaign: "tr_try_funding_tr",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave10_search_topics",
    locale: "tr",
    answer: "TRY yatırmadan önce banka hesabının kime ait olduğu, uygulama içi transfer yolu, limit, ücret, süre ve hesap doğrulama gereksinimi resmî kaynakta kontrol edilmelidir; bu kontrol komisyon veya kayıt garantisi değildir.",
    primaryPath: "/markets/turkiye",
    supportPaths: ["/rates", "/compare/hyperliquid-vs-dydx"],
  },
];

export const TELEGRAM_WAVE11_SEARCH_TOPICS = [
  {
    id: "hyperliquid-funding-decision-en",
    query: "Hyperliquid funding rate before opening a position",
    campaign: "hyperliquid_funding_decision_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave11_search_topics",
    locale: "en",
    answer: "Hyperliquid funding should be reviewed as a position-holding cost, separate from maker/taker fees, collateral, liquidation and bridge costs. NexuAlpha routes the user back to source checks before any wallet action.",
    primaryPath: "/exchanges/hyperliquid",
    supportPaths: ["/compare/hyperliquid-vs-dydx", "/rates"],
  },
  {
    id: "hyperliquid-dydx-risk-en",
    query: "Hyperliquid vs dYdX risk comparison",
    campaign: "hyperliquid_dydx_risk_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave11_search_topics",
    locale: "en",
    answer: "Hyperliquid vs dYdX research should split custody model, collateral, funding, liquidation, official app domain and regional product access before a user treats either route as ready.",
    primaryPath: "/compare/hyperliquid-vs-dydx",
    supportPaths: ["/exchanges/hyperliquid", "/topics/no-kyc"],
  },
  {
    id: "uniswap-v4-deployment-check-en",
    query: "Uniswap v4 deployment official check",
    campaign: "uniswap_v4_deployment_check_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave11_search_topics",
    locale: "en",
    answer: "Uniswap v4 or deployment research must verify the official app/docs, chain, pool or hook address, wallet approval and final transaction details before signing anything.",
    primaryPath: "/exchanges/uniswap",
    supportPaths: ["/exchanges/jupiter", "/topics/no-kyc"],
  },
  {
    id: "jupiter-ultra-token-mint-en",
    query: "Jupiter Ultra token mint check",
    campaign: "jupiter_ultra_token_mint_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave11_search_topics",
    locale: "en",
    answer: "Jupiter Ultra or token-route research should verify the official app, token mint, route legs, slippage, platform fee, Solana network cost and wallet transaction before approval.",
    primaryPath: "/exchanges/jupiter",
    supportPaths: ["/exchanges/uniswap", "/telegram"],
  },
  {
    id: "aerodrome-slipstream-incentives-en",
    query: "Aerodrome Slipstream incentives check",
    campaign: "aerodrome_slipstream_incentives_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave11_search_topics",
    locale: "en",
    answer: "Aerodrome Slipstream research should separate Base network readiness, pool fee type, incentives, voting rewards, bridge route and token or pool address before wallet action.",
    primaryPath: "/exchanges/aerodrome",
    supportPaths: ["/topics/no-kyc", "/exchanges/jupiter"],
  },
  {
    id: "tokenized-treasury-buidl-benji-en",
    query: "BUIDL BENJI tokenized treasury comparison",
    campaign: "tokenized_treasury_buidl_benji_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave11_search_topics",
    locale: "en",
    answer: "BUIDL and BENJI research should separate fund structure, issuer, custodian, reserve asset, transfer restrictions and redemption claim before treating a token as Treasury exposure.",
    primaryPath: priorityCanonicalOwnerPath("tokenized treasuries"),
    supportPaths: ["/news/tokenized-treasuries-structure-access-risks", "/topics/compliant-exchanges"],
  },
  {
    id: "okx-usdc-api-check-en",
    query: "OKX USDC migration API instrument check",
    campaign: "okx_usdc_api_check_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave11_search_topics",
    locale: "en",
    answer: "OKX USDC migration research should check affected instruments, API identifiers, open orders, bots, balances and official deadlines before any live account change.",
    primaryPath: "/news/okx-usd-to-usdc-spot-pair-migration",
    supportPaths: ["/exchanges/okx", "/news/how-to-choose-crypto-withdrawal-network"],
  },
  {
    id: "brazil-pix-withdrawal-ptbr",
    query: "saque Pix exchange cripto Brasil",
    campaign: "br_pix_withdrawal_ptbr",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave11_search_topics",
    locale: "pt-BR",
    answer: "Antes de sacar BRL por Pix, confira titularidade da conta, CPF, limite, taxa, prazo, status da plataforma e tela oficial da conta. O checklist não promete aprovação, bônus ou desconto.",
    primaryPath: "/br/saque-pix",
    supportPaths: ["/br/pix", "/br/conta"],
  },
  {
    id: "brazil-kyc-cpf-check-ptbr",
    query: "KYC CPF corretora cripto Brasil",
    campaign: "br_kyc_cpf_check_ptbr",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave11_search_topics",
    locale: "pt-BR",
    answer: "CPF, nome, residência, banco próprio, limites e produto liberado devem ser confirmados como etapas separadas antes de usar qualquer rota de cadastro ou depósito.",
    primaryPath: "/br/kyc-cpf",
    supportPaths: ["/br/conta", "/br/custos"],
  },
  {
    id: "korea-official-account-check-ko",
    query: "한국 가상자산 계정 공식 확인 체크리스트",
    campaign: "kr_official_account_check_ko",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave11_search_topics",
    locale: "ko",
    answer: "한국 이용자는 공식 규제 맥락, 본인확인, 원화 입출금, 상품 범위, 수수료와 공식 도메인을 분리해 확인한 뒤 계정 경로를 선택해야 합니다. 규제 맥락은 출발점이며 계정 승인이나 혜택을 보장하지 않습니다.",
    primaryPath: "/kr",
    supportPaths: ["/exchanges/hyperliquid", "/compare/hyperliquid-vs-dydx"],
  },
  {
    id: "turkey-market-account-check-tr",
    query: "Türkiye kripto hesap kontrol listesi",
    campaign: "tr_market_account_check_tr",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave11_search_topics",
    locale: "tr",
    answer: "Türkiye kullanıcıları SPK bağlamı, kimlik doğrulama, TRY yatırma yolu, banka hesabı sahipliği, ürün kapsamı ve ücretleri ayrı ayrı kontrol etmeden kayıt yoluna geçmemelidir.",
    primaryPath: "/markets/turkiye",
    supportPaths: ["/exchanges?market=TR", "/compare/hyperliquid-vs-dydx"],
  },
];

export const TELEGRAM_WAVE13_SEARCH_TOPICS = [
  {
    id: "tokenized-treasury-redemption-risk-en",
    query: "tokenized treasury redemption risk",
    campaign: "tokenized_treasury_redemption_risk_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave13_search_topics",
    locale: "en",
    answer: "Tokenized Treasury research should separate issuer, reserve asset, custodian, transfer restrictions, redemption mechanics and holder rights before a user treats yield or liquidity language as equivalent to owning Treasury bills.",
    primaryPath: priorityCanonicalOwnerPath("tokenized treasuries"),
    supportPaths: ["/news/tokenized-treasuries-structure-access-risks", "/topics/compliant-exchanges"],
  },
  {
    id: "tokenized-stock-vs-stock-perp-en",
    query: "tokenized stock vs stock perpetual",
    campaign: "tokenized_stock_vs_stock_perp_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave13_search_topics",
    locale: "en",
    answer: "A tokenized stock, stock perpetual, copy-trading basket and real share are different exposure types. NexuAlpha routes the user to product-scope checks before any Bybit or Bitget comparison becomes actionable.",
    primaryPath: "/compare/bybit-vs-bitget",
    supportPaths: ["/news/tokenized-treasuries-structure-access-risks", "/news/crypto-exchange-fee-disclosure-audit"],
  },
  {
    id: "tokenized-assets-custody-proof-en",
    query: "tokenized assets custody proof",
    campaign: "tokenized_assets_custody_proof_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave13_search_topics",
    locale: "en",
    answer: "Tokenized-asset custody checks should identify who issues the claim, who custodies the reserve, what the token holder can redeem, and which source proves each point. A ticker alone is not proof.",
    primaryPath: priorityCanonicalOwnerPath("tokenized treasuries"),
    supportPaths: ["/news/tokenized-treasuries-structure-access-risks", "/methodology"],
  },
  {
    id: "rwa-treasury-transfer-restrictions-en",
    query: "RWA treasury transfer restrictions",
    campaign: "rwa_treasury_transfer_restrictions_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave13_search_topics",
    locale: "en",
    answer: "RWA Treasury products can have transfer, whitelist, jurisdiction, wallet, redemption and secondary-market limits. Those limits should be checked before a user treats the token as freely transferable cash-like collateral.",
    primaryPath: priorityCanonicalOwnerPath("tokenized treasuries"),
    supportPaths: ["/news/tokenized-treasuries-structure-access-risks", "/methodology"],
  },
  {
    id: "korea-tokenized-asset-boundary-ko",
    query: "한국 토큰화 자산 주식 퍼프 구분",
    campaign: "kr_tokenized_asset_boundary_ko",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave13_search_topics",
    locale: "ko",
    answer: "한국어 리서치에서는 실제 주식, 토큰화 자산, 주식 무기한 계약, 카피트레이딩 노출을 분리해야 합니다. 상품 명칭만으로 원화 계정, 소유권, 상환권이나 혜택을 판단하면 안 됩니다.",
    primaryPath: "/compare/bybit-vs-bitget",
    supportPaths: ["/kr", "/news/tokenized-treasuries-structure-access-risks"],
  },
  {
    id: "korea-perp-dex-funding-check-ko",
    query: "한국 Hyperliquid funding 수수료 청산 확인",
    campaign: "kr_perp_dex_funding_check_ko",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave13_search_topics",
    locale: "ko",
    answer: "Perp DEX를 쓰기 전에는 거래 수수료, funding, 담보, 청산, 지갑 경로와 지역 접근성을 분리해 확인해야 합니다. 이 초안은 계정 승인이나 수익을 약속하지 않습니다.",
    primaryPath: "/compare/hyperliquid-vs-dydx",
    supportPaths: ["/exchanges/hyperliquid", "/kr"],
  },
  {
    id: "korea-uniswap-wallet-route-ko",
    query: "한국 Uniswap 지갑 서명 경로 확인",
    campaign: "kr_uniswap_wallet_route_ko",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave13_search_topics",
    locale: "ko",
    answer: "Uniswap 경로는 공식 앱, 체인, 토큰 계약, 승인 권한, 가스와 최종 지갑 트랜잭션을 확인한 뒤 진행해야 합니다. 테스트넷이나 화면 캡처는 실거래 안전성을 증명하지 않습니다.",
    primaryPath: "/exchanges/uniswap",
    supportPaths: ["/exchanges/jupiter", "/topics/no-kyc"],
  },
  {
    id: "korea-bybit-bitget-stock-boundary-ko",
    query: "Bybit Bitget 주식 상품 토큰화 구분",
    campaign: "kr_bybit_bitget_stock_boundary_ko",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave13_search_topics",
    locale: "ko",
    answer: "Bybit과 Bitget 비교에서 주식 관련 문구는 실제 주식, 토큰화 노출, 무기한 계약, 카피트레이딩 또는 지역 제한을 뜻할 수 있습니다. 공식 상품 범위를 먼저 확인해야 합니다.",
    primaryPath: "/compare/bybit-vs-bitget",
    supportPaths: ["/kr", "/news/crypto-exchange-fee-disclosure-audit"],
  },
  {
    id: "turkey-tokenized-asset-boundary-tr",
    query: "Türkiye tokenized asset hisse perp ayrımı",
    campaign: "tr_tokenized_asset_boundary_tr",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave13_search_topics",
    locale: "tr",
    answer: "Türkiye araştırmasında gerçek hisse, tokenized asset, stock perpetual ve copy trading aynı ürün değildir. Ürün kapsamı, bölge erişimi ve hesap koşulları resmi sayfada ayrı ayrı kontrol edilmelidir.",
    primaryPath: "/compare/bybit-vs-bitget",
    supportPaths: ["/markets/turkiye", "/news/tokenized-treasuries-structure-access-risks"],
  },
  {
    id: "turkey-perp-dex-funding-check-tr",
    query: "Türkiye Hyperliquid funding ücret likidasyon kontrolü",
    campaign: "tr_perp_dex_funding_check_tr",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave13_search_topics",
    locale: "tr",
    answer: "Perp DEX kararında işlem ücreti, funding, teminat, likidasyon, cüzdan yolu ve bölgesel erişim ayrı kontrol edilmelidir. Bu içerik kayıt, getiri veya daha düşük ücret vaadi değildir.",
    primaryPath: "/compare/hyperliquid-vs-dydx",
    supportPaths: ["/exchanges/hyperliquid", "/markets/turkiye"],
  },
  {
    id: "turkey-uniswap-wallet-route-tr",
    query: "Türkiye Uniswap cüzdan imza yolu kontrolü",
    campaign: "tr_uniswap_wallet_route_tr",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave13_search_topics",
    locale: "tr",
    answer: "Uniswap işlemi öncesi resmi uygulama, ağ, token sözleşmesi, onay yetkisi, gas ve son cüzdan işlemi kontrol edilmelidir. Testnet veya sosyal ekran görüntüsü canlı işlem güvenliği sağlamaz.",
    primaryPath: "/exchanges/uniswap",
    supportPaths: ["/exchanges/jupiter", "/topics/no-kyc"],
  },
  {
    id: "turkey-bybit-bitget-stock-boundary-tr",
    query: "Bybit Bitget stock tokenized perp Türkiye",
    campaign: "tr_bybit_bitget_stock_boundary_tr",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave13_search_topics",
    locale: "tr",
    answer: "Bybit ve Bitget karşılaştırmasında stock ifadesi gerçek hisse, tokenized exposure, perpetual veya copy trading anlamına gelebilir. Resmi ürün kapsamı ve bölge erişimi kontrol edilmelidir.",
    primaryPath: "/compare/bybit-vs-bitget",
    supportPaths: ["/markets/turkiye", "/news/crypto-exchange-fee-disclosure-audit"],
  },
];

export const TELEGRAM_WAVE25_SEARCH_TOPICS = [
  {
    id: "perp-dex-cost-field-dictionary-en",
    query: "perp dex cost field dictionary",
    campaign: "perp_dex_cost_dictionary_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave25_search_topics",
    locale: "en",
    answer: "Perp DEX cost research should separate trading fee, funding, collateral, margin mode, oracle path, bridge cost and liquidation rule before treating a platform comparison as ready for action.",
    primaryPath: "/topics/derivatives",
    supportPaths: ["/compare/hyperliquid-vs-dydx", "/exchanges/hyperliquid"],
  },
  {
    id: "regional-funding-verification-matrix-en",
    query: "crypto regional funding verification matrix",
    campaign: "regional_funding_verification_matrix_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave25_search_topics",
    locale: "en",
    answer: "Regional funding research should separate local rail, account-name match, identity check, deposit and withdrawal direction, fee, limit, settlement time and official-source date before any signup or deposit path.",
    primaryPath: "/br/pix",
    supportPaths: ["/kr", "/markets/turkiye"],
  },
];

export const TELEGRAM_WAVE26_SEARCH_TOPICS = [
  {
    id: "regional-funding-matrix-rollout-en",
    query: "regional crypto funding verification checklist",
    campaign: "regional_funding_matrix_rollout_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave26_search_topics",
    locale: "en",
    answer: "Regional funding checks should compare Pix, KRW and TRY style routes as evidence categories: account-name match, identity step, deposit direction, withdrawal direction, limits, fees, timing and official-source date.",
    primaryPath: "/br/pix",
    supportPaths: ["/kr", "/markets/turkiye"],
  },
];

export const TELEGRAM_WAVE27_SEARCH_TOPICS = [
  {
    id: "aerodrome-jupiter-route-cost-check-en",
    query: "Aerodrome Jupiter route cost check",
    campaign: "aerodrome_jupiter_route_cost_check_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave27_search_topics",
    locale: "en",
    answer: "Aerodrome and Jupiter route research should separate official app, network, pool or route legs, token address, incentive source, slippage, platform fee and wallet transaction before any wallet approval.",
    primaryPath: "/exchanges/aerodrome",
    supportPaths: ["/exchanges/jupiter", "/topics/no-kyc"],
  },
  {
    id: "japan-mexico-funding-matrix-ja",
    query: "日本 メキシコ 暗号資産 入金 条件",
    campaign: "jp_mx_funding_matrix_ja",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave27_search_topics",
    locale: "ja",
    answer: "日本とメキシコの入金調査では、登録情報、本人確認、銀行名義、入金方向、出金方向、手数料、限度額、処理時間、公式ソースの日付を分けて確認します。地域ページは承認、特典、入金成功を保証するものではありません。",
    primaryPath: "/jp",
    supportPaths: ["/mx", "/methodology"],
  },
];

export const TELEGRAM_WAVE28_SEARCH_TOPICS = [
  {
    id: "korea-onchain-route-localization-ko",
    query: "한국 온체인 라우트 지갑 수수료 확인",
    campaign: "kr_onchain_route_localization_ko",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave28_search_topics",
    locale: "ko",
    answer: "한국어 온체인 경로에서는 공식 앱, 지갑 서명, 네트워크, 토큰 계약, 가스, 수수료, 원화 입출금 가능성과 계정 조건을 분리해 확인해야 하며, 지역 페이지는 승인이나 혜택을 보장하지 않습니다.",
    primaryPath: "/kr",
    supportPaths: ["/exchanges/uniswap", "/exchanges/jupiter"],
  },
  {
    id: "turkey-onchain-route-localization-tr",
    query: "Türkiye on-chain cüzdan rota ücret kontrolü",
    campaign: "tr_onchain_route_localization_tr",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave28_search_topics",
    locale: "tr",
    answer: "Türkiye on-chain rota kontrolünde resmi uygulama, cüzdan imzası, ağ, token sözleşmesi, gaz, işlem ücreti, yerel para giriş-çıkış koşulları ve hesap şartları ayrı ayrı doğrulanmalıdır; bölge sayfası onay veya avantaj garantisi vermez.",
    primaryPath: "/markets/turkiye",
    supportPaths: ["/exchanges/uniswap", "/exchanges/jupiter"],
  },
];

export const TELEGRAM_WAVE29_SEARCH_TOPICS = [
  {
    id: "hyperliquid-funding-fee-fr",
    query: "frais funding Hyperliquid perp DEX",
    campaign: "fr_hyperliquid_funding_fee_fr",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave29_search_topics",
    locale: "fr",
    answer: "Pour analyser les frais et le funding Hyperliquid, il faut séparer frais de trading, cadence de financement, marge, collatéral, liquidation, source officielle et horodatage avant de traiter une page comme prête pour décision.",
    primaryPath: "/exchanges/hyperliquid",
    supportPaths: ["/topics/derivatives", "/compare/hyperliquid-vs-dydx"],
  },
  {
    id: "uniswap-wallet-route-fee-de",
    query: "Uniswap Wallet Route Gebühren prüfen",
    campaign: "de_uniswap_wallet_route_fee_de",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave29_search_topics",
    locale: "de",
    answer: "Bei einer Uniswap-Wallet-Route sollten offizielle App, Netzwerk, Token-Vertrag, Route, Slippage, Gas, Wallet-Signatur und Genehmigungen getrennt geprüft werden; die Seite verspricht keine Ausführung, Rendite oder Gebührenersparnis.",
    primaryPath: "/exchanges/uniswap",
    supportPaths: ["/topics/no-kyc", "/exchanges/jupiter"],
  },
];

export const TELEGRAM_WAVE30_SEARCH_TOPICS = [
  {
    id: "hyperliquid-source-boundary-fr",
    query: "Hyperliquid frais funding source officielle liquidation",
    campaign: "fr_hyperliquid_source_boundary_fr",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave30_search_topics",
    locale: "fr",
    answer: "La page Hyperliquid en français doit servir de point de contrôle: distinguer source officielle, frais, funding, marge, collatéral, liquidation et date de vérification. Elle ne promet ni rendement, ni économie de frais, ni résultat de trading.",
    primaryPath: "/exchanges/hyperliquid",
    supportPaths: ["/topics/derivatives", "/compare/hyperliquid-vs-dydx"],
  },
  {
    id: "uniswap-approval-slippage-de",
    query: "Uniswap Genehmigung Slippage Gas offizielle Quelle",
    campaign: "de_uniswap_approval_slippage_de",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave30_search_topics",
    locale: "de",
    answer: "Die deutsche Uniswap-Seite soll vor einer Wallet-Aktion die offizielle App, Token-Vertrag, Genehmigung, Slippage, Gas, Route und Signatur trennen. Sie gibt keine Rendite-, Ausführungs- oder Gebührenersparnis-Zusage.",
    primaryPath: "/exchanges/uniswap",
    supportPaths: ["/topics/no-kyc", "/exchanges/jupiter"],
  },
];

export const TELEGRAM_WAVE31_SEARCH_TOPICS = [
  {
    id: "binance-okx-fee-kyc-boundary-es",
    query: "Binance vs OKX comisiones KYC restricciones regionales",
    campaign: "es_binance_okx_fee_kyc_boundary_es",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave31_search_topics",
    locale: "es",
    answer: "Antes de elegir entre Binance y OKX, separa comisiones publicadas, nivel de cuenta, KYC, región, productos disponibles, fuente oficial y fecha de revisión. La comparación no promete aprobación, descuento, bono ni acceso regional.",
    primaryPath: "/compare/binance-vs-okx",
    supportPaths: ["/exchanges/binance", "/methodology"],
  },
  {
    id: "binance-fee-kyc-source-ptbr",
    query: "Binance taxas KYC restrições regionais fonte oficial",
    campaign: "br_binance_fee_kyc_source_ptbr",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave31_search_topics",
    locale: "pt-BR",
    answer: "Na página da Binance, trate taxa publicada, KYC, região, produto disponível, domínio oficial e data da fonte como itens separados. O resumo não promete aprovação de conta, bônus, desconto, cadastro aceito ou resultado de negociação.",
    primaryPath: "/exchanges/binance",
    supportPaths: ["/compare/binance-vs-okx", "/methodology"],
  },
];

export const TELEGRAM_WAVE32_SEARCH_TOPICS = [
  {
    id: "okx-usd-usdc-migration-date-boundary-en",
    query: "OKX USD USDC migration spot pair date API orders",
    campaign: "okx_usd_usdc_migration_date_boundary_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave32_search_topics",
    locale: "en",
    answer: "Before acting on an OKX USD to USDC migration notice, separate the article date, official source, affected pairs, open orders, bots, API symbols, balances, margin settings and fees. This is an operations checklist, not a trading or account-outcome promise.",
    primaryPath: "/news/okx-usd-to-usdc-spot-pair-migration",
    supportPaths: ["/exchanges/okx", "/methodology"],
  },
  {
    id: "hyperliquid-dydx-funding-fee-boundary-zh",
    query: "Hyperliquid vs dYdX 资金费率 手续费 风险 对比",
    campaign: "zh_hyperliquid_dydx_funding_fee_boundary_zh",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave32_search_topics",
    locale: "zh-Hans",
    answer: "阅读 Hyperliquid vs dYdX 时，应先拆开文章日期、官方来源、资金费率机制、交易费、抵押品、保证金、清算规则、链上执行边界和更新频率。文章只提供研究路径，后续判断以页面日期和官方状态为准，需复核最新页面与官方说明，不能替代交易决策。",
    primaryPath: "/news/hyperliquid-vs-dydx",
    supportPaths: ["/compare/hyperliquid-vs-dydx", "/topics/derivatives"],
  },
];

export const TELEGRAM_WAVE33_SEARCH_TOPICS = [
  {
    id: "hyperliquid-fees-funded-boundary-en",
    query: "Hyperliquid fees funded account boundary",
    campaign: "hyperliquid_fees_funded_boundary_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave33_search_topics",
    locale: "en",
    answer: "A Hyperliquid fees or funded-account question should separate published trading fees, funding cadence, collateral, margin mode, liquidation rules, account funding source and official status. The page is a research boundary, not proof of account approval or trading outcome.",
    primaryPath: "/exchanges/hyperliquid",
    supportPaths: ["/compare/hyperliquid-vs-dydx", "/topics/derivatives"],
  },
  {
    id: "uniswap-testnet-mainnet-boundary-en",
    query: "Uniswap testnet mainnet wallet route boundary",
    campaign: "uniswap_testnet_mainnet_boundary_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave33_search_topics",
    locale: "en",
    answer: "Uniswap testnet and mainnet checks must separate official app, network selector, token contract, route, approval, slippage, gas and wallet signature. A testnet path does not prove live execution, liquidity or asset safety on mainnet.",
    primaryPath: "/exchanges/uniswap",
    supportPaths: ["/topics/no-kyc", "/exchanges/jupiter"],
  },
  {
    id: "tokenized-treasury-issuer-custody-redemption-en",
    query: "tokenized Treasury issuer custody redemption boundary",
    campaign: "tokenized_treasury_issuer_custody_redemption_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave33_search_topics",
    locale: "en",
    answer: "Tokenized Treasury research should separate issuer, custodian, reserve asset, transfer restrictions, holder rights, redemption path, source date and platform access. Yield wording is not the same as direct Treasury ownership or redemption access.",
    primaryPath: priorityCanonicalOwnerPath("tokenized treasuries"),
    supportPaths: ["/news/tokenized-treasuries-structure-access-risks", "/methodology"],
  },
];

export const TELEGRAM_WAVE34_SEARCH_TOPICS = [
  {
    id: "bitget-bybit-stocks-product-boundary-en",
    query: "bitget vs bybit stocks",
    campaign: "bitget_bybit_stocks_product_boundary_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave34_search_topics",
    locale: "en",
    answer: "A Bitget vs Bybit stocks query must separate real equities, tokenized stocks, stock perpetuals, index-style exposure and copy trading labels before any account path. The comparison page is a product-boundary review, not proof that a region can trade shares or receive a specific benefit.",
    primaryPath: "/compare/bybit-vs-bitget",
    supportPaths: ["/news/tokenized-treasuries-structure-access-risks", "/methodology"],
  },
  {
    id: "crypto-perpetual-platform-risk-stack-en",
    query: "crypto perpetual platform",
    campaign: "crypto_perpetual_platform_risk_stack_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave34_search_topics",
    locale: "en",
    answer: "A crypto perpetual platform review should separate funding, margin mode, collateral, oracle path, liquidation rule, fee schedule, leverage availability and custody model before platform selection. It is a risk-stack checklist, not a trading recommendation.",
    primaryPath: "/topics/derivatives",
    supportPaths: ["/compare/hyperliquid-vs-dydx", "/exchanges/hyperliquid"],
  },
  {
    id: "hyperliquid-latest-news-date-source-en",
    query: "hyperliquid latest news",
    campaign: "hyperliquid_latest_news_date_source_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave34_search_topics",
    locale: "en",
    answer: "Hyperliquid latest-news searches should be routed to a dated NexuAlpha source page or the platform profile, then checked against official status. This draft is for source review only and does not present a live update, incident feed, market-timing cue or trade setup.",
    primaryPath: "/news/hyperliquid-vs-dydx",
    supportPaths: ["/exchanges/hyperliquid", "/topics/derivatives"],
  },
];

export const TELEGRAM_WAVE35_SEARCH_TOPICS = [
  {
    id: "ai-citation-source-methodology-en",
    query: "how NexuAlpha cites crypto platform sources",
    campaign: "ai_citation_source_methodology_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave35_search_topics",
    locale: "en",
    answer: "For AI-citation readiness, NexuAlpha source pages should expose what was checked, when it was checked, which official page or document anchored it, and which claim remains outside scope. Methodology is the citation spine, not a ranking or signup promise.",
    primaryPath: "/methodology",
    supportPaths: ["/news/crypto-exchange-fee-disclosure-audit", "/partners"],
  },
  {
    id: "ai-citation-fee-evidence-boundary-en",
    query: "crypto exchange fee evidence source boundary",
    campaign: "ai_citation_fee_evidence_boundary_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave35_search_topics",
    locale: "en",
    answer: "Fee evidence should separate published maker/taker tables, VIP tier, product type, regional condition, discount rule, funding or withdrawal cost, and the source date. A readable fee answer must show evidence boundaries before any platform handoff.",
    primaryPath: "/news/crypto-exchange-fee-disclosure-audit",
    supportPaths: ["/rates", "/methodology"],
  },
  {
    id: "ai-citation-regional-funding-check-en",
    query: "regional crypto funding verification AI answer",
    campaign: "ai_citation_regional_funding_check_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave35_search_topics",
    locale: "en",
    answer: "A regional funding answer should cite the local rail, account-name match, identity step, deposit direction, withdrawal direction, fee, limit, timing and official-source date. It should not turn funding eligibility into a signup guarantee.",
    primaryPath: "/br/pix",
    supportPaths: ["/kr", "/markets/turkiye"],
  },
  {
    id: "ai-citation-tokenized-asset-ownership-redemption-en",
    query: "tokenized asset ownership redemption evidence",
    campaign: "ai_citation_tokenized_asset_ownership_redemption_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave35_search_topics",
    locale: "en",
    answer: "Tokenized-asset readability should separate issuer, custodian, reserve asset, token holder rights, transfer limits, redemption path, jurisdiction and source date. Ownership wording needs an evidence boundary before any yield or liquidity comparison.",
    primaryPath: priorityCanonicalOwnerPath("tokenized treasuries"),
    supportPaths: ["/news/tokenized-treasuries-structure-access-risks", "/methodology"],
  },
  {
    id: "ai-citation-perp-risk-fields-en",
    query: "perp risk fields funding margin collateral oracle liquidation",
    campaign: "ai_citation_perp_risk_fields_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave35_search_topics",
    locale: "en",
    answer: "A readable perp answer should name the risk fields separately: funding cadence, margin mode, collateral asset, oracle source, liquidation rule, fee schedule, leverage ceiling and custody model. Those fields make the answer citable while keeping platform choice and trading decisions outside the draft.",
    primaryPath: "/topics/derivatives",
    supportPaths: ["/compare/hyperliquid-vs-dydx", "/exchanges/hyperliquid"],
  },
];


export const TELEGRAM_WAVE36_SEARCH_TOPICS = [
  {
    id: "hk-vasp-account-check-en",
    query: "Hong Kong crypto account VASP funding checklist",
    campaign: "hk_vasp_account_check_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave36_search_topics",
    locale: "en",
    answer: "A Hong Kong account answer should separate SFC/VASP status, supported product scope, identity step, local funding rail, custody model, fee source date and account-screen confirmation. The regional page is the first stop before any exchange or app handoff.",
    primaryPath: "/hk",
    supportPaths: ["/methodology", "/news/crypto-exchange-fee-disclosure-audit"],
  },
  {
    id: "eu-mica-platform-access-en",
    query: "EU crypto platform MiCA access funding checklist",
    campaign: "eu_mica_platform_access_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave36_search_topics",
    locale: "en",
    answer: "An EU platform-access answer should separate regulatory label, country availability, fiat rail, stablecoin or token restrictions, fee source date, custody model and account eligibility. It should keep MiCA context visible without promising signup approval or product access.",
    primaryPath: "/eu",
    supportPaths: ["/topics/compliant-exchanges", "/methodology"],
  },
  {
    id: "uk-fca-crypto-risk-access-en",
    query: "UK crypto exchange FCA risk warning funding checklist",
    campaign: "uk_fca_crypto_risk_access_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave36_search_topics",
    locale: "en",
    answer: "A UK onboarding answer should separate FCA-facing risk-warning context, identity checks, GBP funding route, product availability, fee evidence and withdrawal limits. The page should answer the access question before any Bot follow-up and without implying approval or suitability.",
    primaryPath: "/uk",
    supportPaths: ["/news/how-to-choose-crypto-withdrawal-network", "/methodology"],
  },
  {
    id: "jp-fsa-jpy-funding-check-ja",
    query: "日本 暗号資産 交換業者 日本円 入金 確認",
    campaign: "jp_fsa_jpy_funding_check_ja",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave36_search_topics",
    locale: "ja",
    answer: "日本向けの確認では、FSA登録、本人確認、日本円入金、本人名義口座、商品範囲、手数料の出典日を分けて見ます。地域ページを先に読み、口座承認・特典・利用可能商品を保証しない前提で判断します。",
    primaryPath: "/jp",
    supportPaths: ["/methodology", "/rates"],
  },
  {
    id: "kr-krw-account-funding-check-ko",
    query: "한국 가상자산 거래소 원화 입금 계정 확인",
    campaign: "kr_krw_account_funding_check_ko",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave36_search_topics",
    locale: "ko",
    answer: "한국 지역 답변은 공식 출처, 실명 확인, 원화 입금 가능 여부, 은행 계정 명의, 상품 범위, 수수료 기준일과 출금 조건을 분리해야 합니다. NexuAlpha 지역 페이지를 먼저 열고 계정 승인이나 혜택을 보장하지 않습니다.",
    primaryPath: "/kr",
    supportPaths: ["/news/crypto-exchange-fee-disclosure-audit", "/methodology"],
  },
  {
    id: "tr-try-spk-funding-check-tr",
    query: "Türkiye kripto platformu TRY yatırma SPK kontrol listesi",
    campaign: "tr_try_spk_funding_check_tr",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave36_search_topics",
    locale: "tr",
    answer: "Türkiye cevabı SPK bağlamını, kimlik adımını, TRY yatırma yolunu, banka hesabı sahipliğini, ürün kapsamını, ücret kaynak tarihini ve çekim koşullarını ayrı tutmalıdır. Bölge sayfası önce gelir; kayıt, bonus, indirim veya erişim garantisi vermez.",
    primaryPath: "/markets/turkiye",
    supportPaths: ["/news/crypto-exchange-fee-disclosure-audit", "/methodology"],
  },
];


export const TELEGRAM_WAVE37_SEARCH_TOPICS = [
  {
    id: "regional-funding-matrix-data-asset-en",
    query: "regional funding verification matrix nine source-linked markets",
    campaign: "regional_funding_matrix_data_asset_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave37_search_topics",
    locale: "en",
    answer: "The current regional funding verification matrix v3 is a data asset with 9 source-linked research rows: BR, MX, EU, UK, JP, HK, KR, SG and TR. It separates local rails, account-name match, identity step, fee or timing checks and official-source dates, while funding and account availability still require the official logged-in account flow.",
    primaryPath: "/methodology",
    supportPaths: ["/research/regional-funding-verification-matrix.json", "/research/regional-funding-verification-matrix.csv"],
  },
  {
    id: "hk-kr-tr-official-verification-boundary-en",
    query: "HK KR SG TR crypto funding official verification rows",
    campaign: "hk_kr_sg_tr_official_verification_rows_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave37_search_topics",
    locale: "en",
    answer: "HK, KR, SG and TR now have source-linked research rows in the v3 regional funding matrix. The draft should route users to NexuAlpha methodology and regional pages first, then remind them that regulator context, bank or fiat rail, identity, fee, limit, product scope and account-screen availability remain pending until confirmed in the official logged-in account flow.",
    primaryPath: "/methodology",
    supportPaths: ["/hk", "/kr", "/markets/turkiye"],
  },
];

export const TELEGRAM_WAVE38_SEARCH_TOPICS = [
  {
    id: "hong-kong-funding-matrix-check-en",
    query: "Hong Kong crypto funding matrix SFC VASP account check",
    campaign: "hk_funding_matrix_check_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave38_search_topics",
    locale: "en",
    answer: "For Hong Kong, the funding matrix should be used as a NexuAlpha-first checklist: SFC/VASP context, identity and address checks, account-name match, local funding rail, fee or timing evidence and product scope are separate fields. It does not prove approval, benefit eligibility or current account-screen availability.",
    primaryPath: "/hk",
    supportPaths: ["/methodology", "/research/regional-funding-verification-matrix.json"],
  },
  {
    id: "korea-krw-funding-matrix-ko",
    query: "한국 원화 입금 실명 계좌 funding matrix 확인",
    campaign: "kr_krw_funding_matrix_ko",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave38_search_topics",
    locale: "ko",
    answer: "한국 원화 입금 답변은 NexuAlpha 지역 페이지와 funding matrix를 먼저 사용해 공식 출처, 실명 확인, 은행 계정 명의, 원화 입금 가능 여부, 수수료 기준일, 출금 조건과 상품 범위를 분리합니다. 계정 승인, 혜택, 입금 가능성은 공식 계정 화면에서 다시 확인해야 합니다.",
    primaryPath: "/kr",
    supportPaths: ["/methodology", "/research/regional-funding-verification-matrix.json"],
  },
  {
    id: "singapore-sgd-funding-matrix-en",
    query: "Singapore crypto SGD funding MAS account verification matrix",
    campaign: "sg_sgd_funding_matrix_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave38_search_topics",
    locale: "en",
    answer: "For Singapore, the matrix route should separate MAS Digital Payment Token service context, official service entity, identity and residence checks, SGD funding route, PayNow or FAST visibility, fees, timing and product scope. A Singapore-facing page is research evidence, not a promise that a specific account can deposit, trade or receive benefits.",
    primaryPath: "/sg",
    supportPaths: ["/methodology", "/research/regional-funding-verification-matrix.json"],
  },
  {
    id: "turkey-try-funding-matrix-tr",
    query: "Türkiye TRY yatırma funding matrix SPK hesap kontrolü",
    campaign: "tr_try_funding_matrix_tr",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave38_search_topics",
    locale: "tr",
    answer: "Türkiye için funding matrix taslağı önce NexuAlpha sayfasına dönmelidir: SPK bağlamı, kimlik adımı, TRY yatırma yolu, banka hesabı sahipliği, ücret veya zamanlama kanıtı, çekim koşulu ve ürün kapsamı ayrı kontrol edilir. Hesap onayı, bonus, indirim veya erişim garantisi vermez.",
    primaryPath: "/markets/turkiye",
    supportPaths: ["/methodology", "/research/regional-funding-verification-matrix.json"],
  },
];

export const TELEGRAM_WAVE39_SEARCH_TOPICS = [
  {
    id: "priority-canonical-five-review-bundle-en",
    query: "NexuAlpha priority canonical review: Hyperliquid fees funded account, Uniswap testnet, Bybit vs Bitget stocks, tokenized Treasuries and derivatives",
    campaign: "priority_canonical_five_review_bundle_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave39_search_topics",
    locale: "en",
    answer: "The five priority canonical paths are already covered by existing Telegram queue drafts, so Wave39 adds one non-duplicated manual-review bundle instead of repeating five posts. Review Hyperliquid fees or funded-account language, Uniswap testnet routes, Bybit vs Bitget stock meaning, tokenized Treasuries and derivatives as separate NexuAlpha-first source checks before any Bot handoff or external action.",
    primaryPath: "/methodology",
    supportPaths: ["/exchanges/hyperliquid", "/exchanges/uniswap", "/compare/bybit-vs-bitget", "/news/tokenized-treasuries-structure-access-risks", "/topics/derivatives"],
  },
];

export const TELEGRAM_WAVE57_SEARCH_TOPICS = [
  {
    id: "cftc-self-custodial-wallet-boundary-en",
    query: "CFTC self-custodial wallet no-action letter user boundary",
    campaign: "cftc_self_custodial_wallet_boundary_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave57_search_topics",
    locale: "en",
    answer: "Self-custodial wallet policy research should separate agency scope, wallet provider obligations, user custody, trading venue status and account eligibility before treating a headline as permission to act.",
    primaryPath: "/news/cftc-self-custodial-wallet-no-action-letter-scope-user-boundary",
    supportPaths: ["/exchanges/uniswap", "/topics/no-kyc"],
  },
  {
    id: "spot-listing-timeline-disclosure-en",
    query: "crypto spot listing deposit trading withdrawal timeline checklist",
    campaign: "spot_listing_timeline_disclosure_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave57_search_topics",
    locale: "en",
    answer: "Spot-listing research should check deposit open time, trading start, withdrawal availability, transfer limits, price controls and official announcement source before any account or token action.",
    primaryPath: "/news/crypto-spot-listing-timeline-deposit-trading-withdrawal-disclosure-radar",
    supportPaths: ["/news/okx-vvv-usdt-spot-listing-preopen-price-limit-transfer-checklist", "/exchanges"],
  },
  {
    id: "leveraged-etf-x-perp-risk-en",
    query: "leveraged ETF X-perp stacked leverage risk checklist",
    campaign: "leveraged_etf_x_perp_risk_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave57_search_topics",
    locale: "en",
    answer: "Leveraged-ETF X-perp research should separate the ETF's embedded leverage, perpetual funding, liquidation, margin, rebalancing path and issuer disclosure before treating it like a standard equity perp.",
    primaryPath: "/news/leveraged-etf-x-perp-vs-standard-equity-perpetual-stacked-leverage-risk",
    supportPaths: ["/topics/derivatives", "/compare/bybit-vs-bitget"],
  },
  {
    id: "okx-vvv-listing-preopen-en",
    query: "OKX VVV USDT listing pre-open price limit transfer checklist",
    campaign: "okx_vvv_listing_preopen_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave57_search_topics",
    locale: "en",
    answer: "OKX VVV listing research should verify pre-open rules, price limits, deposit and withdrawal status, affected account products and official notice timing before touching live orders.",
    primaryPath: "/news/okx-vvv-usdt-spot-listing-preopen-price-limit-transfer-checklist",
    supportPaths: ["/exchanges/okx", "/news/crypto-spot-listing-timeline-deposit-trading-withdrawal-disclosure-radar"],
  },
  {
    id: "payment-stablecoin-margin-collateral-en",
    query: "payment stablecoin margin collateral issuer custody haircut framework",
    campaign: "payment_stablecoin_margin_collateral_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave57_search_topics",
    locale: "en",
    answer: "Payment-stablecoin collateral research should separate issuer quality, custody, redemption, haircut, venue acceptance and margin-rule changes before treating a stablecoin as equivalent collateral.",
    primaryPath: "/news/payment-stablecoin-margin-collateral-issuer-eligibility-custody-haircut-framework",
    supportPaths: ["/topics/derivatives", "/news/tokenized-collateral-acceptance-reuse-rehypothecation-risk-framework"],
  },
];

export const TELEGRAM_WAVE58_SEARCH_TOPICS = [
  {
    id: "wave58-hyperliquid-fees-funded-boundary-en",
    query: "hyperliquid fees funded account boundary maker taker funding vault",
    campaign: "wave58_hyperliquid_fees_funded_boundary_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave58_search_topics",
    locale: "en",
    answer: "Hyperliquid fee and funded-account searches should separate maker/taker fees, funding payments, bridge or wallet costs, self-funded collateral, vault participation and third-party prop-capital language before treating any route as an account action.",
    primaryPath: "/exchanges/hyperliquid",
    supportPaths: ["/rates", "/compare/hyperliquid-vs-dydx"],
  },
  {
    id: "wave58-uniswap-testnet-mainnet-safety-en",
    query: "uniswap testnet mainnet official app token contract wallet approval",
    campaign: "wave58_uniswap_testnet_mainnet_safety_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave58_search_topics",
    locale: "en",
    answer: "Uniswap testnet or mainnet research should verify the official app and docs, selected network, token contract or pool, wallet approval, Permit2 spender, gas route and transaction preview before any signature.",
    primaryPath: "/exchanges/uniswap",
    supportPaths: ["/exchanges/jupiter", "/topics/no-kyc"],
  },
  {
    id: "wave58-bybit-bitget-stock-meaning-en",
    query: "Bybit vs Bitget stocks tokenized stock perpetual product meaning",
    campaign: "wave58_bybit_bitget_stock_meaning_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave58_search_topics",
    locale: "en",
    answer: "Bybit vs Bitget stock wording should be reviewed as product scope first: real shares, tokenized exposure, equity perpetuals, indices, copy trading labels and regional availability are different meanings with different risks.",
    primaryPath: "/compare/bybit-vs-bitget",
    supportPaths: ["/news/tokenized-treasuries-structure-access-risks", "/topics/derivatives"],
  },
  {
    id: "wave58-derivatives-risk-stack-en",
    query: "crypto derivatives risk stack collateral funding liquidation oracle custody",
    campaign: "wave58_derivatives_risk_stack_en",
    cadence: "weekly_review",
    reviewTtlDays: 7,
    wave: "wave58_search_topics",
    locale: "en",
    answer: "Derivatives research should stack the risks separately: custody, collateral, margin mode, funding, liquidation, oracle source, bridge route, venue outage, regional access and account permissions all need their own source check.",
    primaryPath: "/topics/derivatives",
    supportPaths: ["/compare/hyperliquid-vs-dydx", "/exchanges/hyperliquid"],
  },
];

export const TELEGRAM_WAVE20_SEARCH_TOPIC_ROUTES = [
  {
    id: "jp-fsa-jpy-account-ja",
    query: "日本 暗号資産 交換業者 登録 日本円 入金",
    command: "/check",
    locale: "ja",
    market: "JP",
    product: "spot",
    funnel: "regional_research",
    intent: "official_source_check",
    theme: "japan_market_entry",
    campaign: "jp_fsa_jpy_account_ja",
    canonicalPath: "/jp?locale=ja",
    supportPaths: ["/methodology", "/exchanges"],
    answer: "日本市場の確認では、FSA登録情報、本人確認、日本円入金、本人名義口座、商品範囲を分けて確認します。登録情報は出発点であり、口座承認、手数料、特典や利用可能商品を保証しません。Telegram からはまず NexuAlpha の日本ページに戻し、公式資料と条件の境界を見てから次の行動を判断します。",
    deepLinkAction: { action: "partner_desk", market: "JP", locale: "ja", product: "spot", campaign: "jp_fsa_jpy_account_ja" },
    anonymousMeasurement: "24h/7d onsite UTM only; no user identifiers, exchange account identifiers, raw registration URLs, invite codes or private commission fields.",
  },
  {
    id: "bybit-bitget-stock-product-boundary-en",
    query: "Bybit vs Bitget stocks tokenized stock perpetual copy trading",
    command: "/rates",
    locale: "en",
    market: "GLOBAL",
    product: "perpetuals",
    funnel: "consideration",
    intent: "product_boundary_comparison",
    theme: "bybit_bitget_product_boundary",
    campaign: "bybit_bitget_product_boundary_en",
    canonicalPath: "/compare/bybit-vs-bitget",
    supportPaths: ["/news/tokenized-treasuries-structure-access-risks", "/news/crypto-exchange-fee-disclosure-audit"],
    answer: "Bybit vs Bitget stock wording can mean real shares, tokenized exposure, stock perpetuals, indices, copy trading or regional product labels. The comparison route keeps product scope, fee source date, account access and risk disclosure separate before any external handoff.",
    deepLinkAction: { action: "compare", pair: "bybit-vs-bitget", locale: "en", product: "perpetuals", campaign: "bybit_bitget_product_boundary_en" },
    anonymousMeasurement: "24h/7d onsite UTM only; no user identifiers, exchange account identifiers, raw registration URLs, invite codes or private commission fields.",
  },
  {
    id: "okx-usdc-migration-account-ops-en",
    query: "OKX USD USDC migration open orders API bots",
    command: "/check",
    locale: "en",
    market: "GLOBAL",
    product: "spot",
    funnel: "activation",
    intent: "operational_risk_reduction",
    theme: "okx_migration_ops",
    campaign: "okx_usdc_migration_account_ops_en",
    canonicalPath: "/news/okx-usd-to-usdc-spot-pair-migration",
    supportPaths: ["/exchanges/okx", "/news/how-to-choose-crypto-withdrawal-network"],
    answer: "OKX migration research should route users to the dated NexuAlpha checklist before touching live orders, bots, API instrument IDs, balances or margin settings. It is an operations checklist, not a trading signal or account-outcome promise.",
    deepLinkAction: { action: "verify_domain", venue: "okx", locale: "en", product: "spot", campaign: "okx_usdc_migration_account_ops_en" },
    anonymousMeasurement: "24h/7d onsite UTM only; no user identifiers, exchange account identifiers, raw registration URLs, invite codes or private commission fields.",
  },
  {
    id: "tokenized-treasury-custody-redemption-en",
    query: "tokenized treasuries custody redemption transfer restrictions",
    command: "/alert",
    locale: "en",
    market: "GLOBAL",
    product: "research",
    funnel: "awareness",
    intent: "source_bound_answer",
    theme: "tokenized_treasury_structure",
    campaign: "tokenized_treasury_custody_redemption_en",
    canonicalPath: priorityCanonicalOwnerPath("tokenized treasuries"),
    supportPaths: ["/news/tokenized-treasuries-structure-access-risks", "/methodology"],
    answer: "Tokenized Treasury research must separate issuer, custodian, reserve asset, holder rights, transfer restrictions and redemption mechanics before treating yield or liquidity language as equivalent to owning Treasury bills directly.",
    deepLinkAction: { action: "rates", venue: "all", locale: "en", product: "research", campaign: "tokenized_treasury_custody_redemption_en" },
    anonymousMeasurement: "24h/7d onsite UTM only; no user identifiers, exchange account identifiers, raw registration URLs, invite codes or private commission fields.",
  },
];

export const TELEGRAM_WAVE20_COMMAND_ROUTE_MAP = Object.freeze(
  TELEGRAM_WAVE20_SEARCH_TOPIC_ROUTES.reduce((acc, route) => {
    acc[route.command] = [...(acc[route.command] || []), route.id];
    return acc;
  }, {})
);


export const TELEGRAM_WAVE21_GSC_QUERY_ROUTES = [
  {
    id: "gsc-hyperliquid-fees",
    query: "hyperliquid fees",
    clicks: 0,
    impressions: 15,
    sourceEvidence: "docs/evidence/gsc-visible-baseline-20260915-wave21.md",
    command: "/rates",
    locale: "en",
    market: "GLOBAL",
    product: "perpetuals",
    funnel: "awareness",
    intent: "fee_source_check",
    theme: "gsc_visible_query",
    linkedSearchTopicId: "hyperliquid-fees-en",
    canonicalPath: "/exchanges/hyperliquid",
    supportPaths: ["/rates", "/compare/hyperliquid-vs-dydx"],
    deepLinkAction: { action: "fee_calc", venue: "hyperliquid", locale: "en", product: "perpetuals", campaign: "hyperliquid_fees_en" },
    anonymousMeasurement: "24h/7d onsite UTM only; no user identifiers, exchange account identifiers, raw registration URLs, invite codes or private commission fields.",
  },
  {
    id: "gsc-hyperliquid-funded-account",
    query: "hyperliquid funded account",
    clicks: 0,
    impressions: 6,
    sourceEvidence: "docs/evidence/gsc-visible-baseline-20260915-wave21.md",
    command: "/check",
    locale: "en",
    market: "GLOBAL",
    product: "perpetuals",
    funnel: "awareness",
    intent: "account_claim_boundary",
    theme: "gsc_visible_query",
    linkedSearchTopicId: "hyperliquid-funded-account-en",
    canonicalPath: "/exchanges/hyperliquid",
    supportPaths: ["/compare/hyperliquid-vs-dydx", "/telegram"],
    deepLinkAction: { action: "verify_domain", venue: "hyperliquid", locale: "en", product: "perpetuals", campaign: "hyperliquid_funded_account_en" },
    anonymousMeasurement: "24h/7d onsite UTM only; no user identifiers, exchange account identifiers, raw registration URLs, invite codes or private commission fields.",
  },
  {
    id: "gsc-uniswap-testnet",
    query: "uniswap testnet",
    clicks: 0,
    impressions: 6,
    sourceEvidence: "docs/evidence/gsc-visible-baseline-20260915-wave21.md",
    command: "/check",
    locale: "en",
    market: "GLOBAL",
    product: "spot",
    funnel: "awareness",
    intent: "wallet_route_safety",
    theme: "gsc_visible_query",
    linkedSearchTopicId: "uniswap-testnet-en",
    canonicalPath: "/exchanges/uniswap",
    supportPaths: ["/exchanges/jupiter", "/telegram"],
    deepLinkAction: { action: "verify_domain", venue: "uniswap", locale: "en", product: "spot", campaign: "uniswap_testnet_en" },
    anonymousMeasurement: "24h/7d onsite UTM only; no user identifiers, exchange account identifiers, raw registration URLs, invite codes or private commission fields.",
  },
  {
    id: "gsc-tokenized-treasury",
    query: "tokenized treasury",
    clicks: 0,
    impressions: 3,
    sourceEvidence: "docs/evidence/gsc-visible-baseline-20260915-wave21.md",
    command: "/alert",
    locale: "en",
    market: "GLOBAL",
    product: "research",
    funnel: "awareness",
    intent: "source_bound_answer",
    theme: "gsc_visible_query",
    linkedSearchTopicId: "tokenized-treasuries-en",
    extendsWave20RouteId: "tokenized-treasury-custody-redemption-en",
    canonicalPath: priorityCanonicalOwnerPath("tokenized treasury"),
    supportPaths: ["/news/tokenized-treasuries-structure-access-risks", "/topics/compliant-exchanges"],
    deepLinkAction: { action: "rates", venue: "all", locale: "en", product: "research", campaign: "tokenized_treasuries_en" },
    anonymousMeasurement: "24h/7d onsite UTM only; no user identifiers, exchange account identifiers, raw registration URLs, invite codes or private commission fields.",
  },
  {
    id: "gsc-bitget-vs-bybit-stocks",
    query: "bitget vs bybit stocks",
    clicks: 0,
    impressions: 2,
    sourceEvidence: "docs/evidence/gsc-visible-baseline-20260915-wave21.md",
    command: "/rates",
    locale: "en",
    market: "GLOBAL",
    product: "perpetuals",
    funnel: "consideration",
    intent: "product_boundary_comparison",
    theme: "gsc_visible_query",
    linkedBroadcastId: "bybit-bitget-stock-exposure-en",
    extendsWave20RouteId: "bybit-bitget-stock-product-boundary-en",
    canonicalPath: "/compare/bybit-vs-bitget",
    supportPaths: ["/news/tokenized-treasuries-structure-access-risks", "/news/crypto-exchange-fee-disclosure-audit"],
    deepLinkAction: { action: "compare", pair: "bybit-vs-bitget", locale: "en", product: "perpetuals", campaign: "bybit_bitget_stock_exposure_en" },
    anonymousMeasurement: "24h/7d onsite UTM only; no user identifiers, exchange account identifiers, raw registration URLs, invite codes or private commission fields.",
  },
  {
    id: "gsc-crypto-perpetual-platform",
    query: "crypto perpetual platform",
    clicks: 0,
    impressions: 2,
    sourceEvidence: "docs/evidence/gsc-visible-query-page-pairs-20260915-wave23.json",
    command: "/check",
    locale: "en",
    market: "GLOBAL",
    product: "perpetuals",
    funnel: "awareness",
    intent: "perpetual_platform_research",
    theme: "gsc_visible_query",
    linkedSearchTopicId: "crypto-perpetual-platform-en",
    canonicalPath: "/topics/derivatives",
    supportPaths: ["/compare/hyperliquid-vs-dydx", "/exchanges/hyperliquid", "/telegram"],
    deepLinkAction: { action: "topic_review", project: "derivatives", locale: "en", product: "perpetuals", campaign: "crypto_perpetual_platform_en" },
    anonymousMeasurement: "24h/7d onsite UTM only; no user identifiers, exchange account identifiers, raw registration URLs, invite codes or private commission fields.",
  },
];

export const TELEGRAM_WAVE21_COMMAND_ROUTE_MAP = Object.freeze(
  TELEGRAM_WAVE21_GSC_QUERY_ROUTES.reduce((acc, route) => {
    acc[route.command] = [...(acc[route.command] || []), route.id];
    return acc;
  }, {})
);


export const TELEGRAM_SEARCH_TOPIC_QUEUE = [
  ...TELEGRAM_WAVE7_SEARCH_TOPICS.map((topic) => ({ ...topic, wave: topic.wave || "wave7_search_topics" })),
  ...TELEGRAM_WAVE8_SEARCH_TOPICS,
  ...TELEGRAM_WAVE9_SEARCH_TOPICS,
  ...TELEGRAM_WAVE10_SEARCH_TOPICS,
  ...TELEGRAM_WAVE11_SEARCH_TOPICS,
  ...TELEGRAM_WAVE13_SEARCH_TOPICS,
  ...TELEGRAM_WAVE25_SEARCH_TOPICS,
  ...TELEGRAM_WAVE26_SEARCH_TOPICS,
  ...TELEGRAM_WAVE27_SEARCH_TOPICS,
  ...TELEGRAM_WAVE28_SEARCH_TOPICS,
  ...TELEGRAM_WAVE29_SEARCH_TOPICS,
  ...TELEGRAM_WAVE30_SEARCH_TOPICS,
  ...TELEGRAM_WAVE31_SEARCH_TOPICS,
  ...TELEGRAM_WAVE32_SEARCH_TOPICS,
  ...TELEGRAM_WAVE33_SEARCH_TOPICS,
  ...TELEGRAM_WAVE34_SEARCH_TOPICS,
  ...TELEGRAM_WAVE35_SEARCH_TOPICS,
  ...TELEGRAM_WAVE36_SEARCH_TOPICS,
  ...TELEGRAM_WAVE37_SEARCH_TOPICS,
  ...TELEGRAM_WAVE38_SEARCH_TOPICS,
  ...TELEGRAM_WAVE39_SEARCH_TOPICS,
  ...TELEGRAM_WAVE57_SEARCH_TOPICS,
  ...TELEGRAM_WAVE58_SEARCH_TOPICS,
];

export const TELEGRAM_MANUAL_REVIEW_POLICY = Object.freeze({
  status: "manual_review_required",
  noTelegramApiCall: true,
  onsiteFirstRule: "Telegram copy must place the NexuAlpha landing URL before any Bot follow-up.",
  requiredPublicParams: ["utm_source", "utm_medium", "utm_campaign"],
  requiredTelegramContextParams: ["tg_market", "tg_locale", "tg_product", "tg_funnel", "tg_intent", "tg_theme", "tg_draft"],
  anonymousMetrics24h: [
    "landingVisits",
    "onsiteNextStepClicks",
    "comparisonOrToolClicks",
    "protectedOutboundClicks",
    "botStartsIfVisible",
    "repliesOrDiscussionNotes",
    "sourceLocaleOrCtaIssues",
  ],
  anonymousMetrics7d: [
    "landingVisits",
    "repeatVisits",
    "onsiteNextStepClicks",
    "comparisonOrToolClicks",
    "protectedOutboundClicks",
    "botStartsIfVisible",
    "searchImpressionDeltaIfAvailable",
    "decision",
  ],
  forbiddenClaims: [
    "raw exchange registration URL",
    "invite code",
    "private commission",
    "guaranteed signup",
    "guaranteed discount",
    "ranking claim",
    "trading outcome claim",
  ],
  reviewWindows: [
    { id: "24h", label: "24h anonymous post check", metricKey: "anonymousMetrics24h" },
    { id: "7d", label: "7d anonymous topic review", metricKey: "anonymousMetrics7d" },
  ],
});

const WAVE22_QUERY_ROUTE_BY_ID = Object.freeze(
  TELEGRAM_WAVE21_GSC_QUERY_ROUTES.reduce((acc, route) => {
    acc[route.id] = route;
    return acc;
  }, {})
);

function wave22Handoff(routeIds, recommendedCommand, primaryCtaLabel) {
  const routes = routeIds.map((id) => WAVE22_QUERY_ROUTE_BY_ID[id]).filter(Boolean);
  const primaryRoute = routes.find((route) => route.command === recommendedCommand) || routes[0];
  return {
    routeIds,
    queries: routes.map((route) => route.query),
    canonicalPath: primaryRoute?.canonicalPath || "",
    recommendedCommand,
    primaryCtaLabel,
    botDeepLinkAction: primaryRoute?.deepLinkAction || null,
    onsiteFirst: true,
    manualAuthorizationRequired: true,
    authorizationState: "not_authorized",
    context: {
      market: primaryRoute?.market || "GLOBAL",
      locale: primaryRoute?.locale || "en",
      product: primaryRoute?.product || "research",
      funnel: primaryRoute?.funnel || "awareness",
      intent: primaryRoute?.intent || "research",
      theme: "wave22_onsite_bot_handoff",
    },
    measurement: {
      policy: "anonymous_onsite_24h_7d_only",
      publicParams: TELEGRAM_MANUAL_REVIEW_POLICY.requiredPublicParams,
      telegramContextParams: TELEGRAM_MANUAL_REVIEW_POLICY.requiredTelegramContextParams,
      anonymousMetrics24h: TELEGRAM_MANUAL_REVIEW_POLICY.anonymousMetrics24h,
      anonymousMetrics7d: TELEGRAM_MANUAL_REVIEW_POLICY.anonymousMetrics7d,
    },
    boundary: "Bot return links must stay after the NexuAlpha canonical answer path and must not contain raw exchange registration URLs, invite codes or private commission terms.",
  };
}

export const TELEGRAM_WAVE22_ONSITE_BOT_HANDOFFS = Object.freeze({
  "/exchanges/hyperliquid": wave22Handoff(
    ["gsc-hyperliquid-fees", "gsc-hyperliquid-funded-account"],
    "/rates",
    "Continue with Hyperliquid fee/account checks in the NexuAlpha Bot"
  ),
  "/exchanges/uniswap": wave22Handoff(
    ["gsc-uniswap-testnet"],
    "/check",
    "Continue with the Uniswap domain, network and token check in the NexuAlpha Bot"
  ),
  "/topics/tokenized-treasuries": wave22Handoff(
    ["gsc-tokenized-treasury"],
    "/alert",
    "Continue with tokenized Treasury source checks in the NexuAlpha Bot"
  ),
  "/compare/bybit-vs-bitget": wave22Handoff(
    ["gsc-bitget-vs-bybit-stocks"],
    "/rates",
    "Continue with the Bybit vs Bitget product-boundary check in the NexuAlpha Bot"
  ),
  "/topics/derivatives": wave22Handoff(
    ["gsc-crypto-perpetual-platform"],
    "/check",
    "Continue with the perpetual platform research checklist in the NexuAlpha Bot"
  ),
});

const TELEGRAM_WEBSITE_INTENTS = new Set(["selected", "compare", "fees", "monitor"]);

function compactSlug(value = "", fallback = "") {
  const cleaned = sanitizeTelegramStartPayload(String(value || "").toLowerCase().replace(/_/g, "-")).replace(/_/g, "-");
  return cleaned || fallback;
}

function normalizeWebsitePair(target = {}) {
  if (typeof target.pair === "string" && /^[a-z0-9-]+-vs-[a-z0-9-]+(?:-vs-[a-z0-9-]+)?$/i.test(target.pair.trim())) {
    return target.pair.trim().toLowerCase();
  }
  const slugs = Array.isArray(target.slugs) ? target.slugs : [target.venueA, target.venueB].filter(Boolean);
  const cleaned = slugs.map((slug) => compactSlug(slug)).filter(Boolean);
  return cleaned.length >= 2 ? cleaned.slice(0, 3).join("-vs-") : "binance-vs-okx";
}

function normalizeWebsiteVolume(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 10_000_000_000) return undefined;
  return String(Math.round((number + Number.EPSILON) * 100) / 100);
}

function encodeTelegramVolume(value) {
  if (value === undefined) return undefined;
  return String(value).replace(".", "p");
}

function normalizeWebsiteInstrument(value, product) {
  const normalized = String(value || product || "spot").toLowerCase();
  return ["futures", "perpetuals", "perp", "perps"].includes(normalized) ? "futures" : "spot";
}

function telegramReturnParams(target = {}, extras = {}, { extrasFirst = false } = {}) {
  const params = extrasFirst ? { ...extras } : {};
  if (target.market && String(target.market).toLowerCase() !== "unknown") params.market = target.market;
  if (target.product && String(target.product).toLowerCase() !== "unknown") params.product = target.product;
  if (!extrasFirst) Object.assign(params, extras);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") delete params[key];
  }
  return params;
}

function telegramLocalizedReturnHref(pathname = "/", locale = "en", params = {}) {
  const normalizedPathname = String(pathname || "/").startsWith("/") ? String(pathname || "/") : `/${pathname}`;
  const localized = localizedPath(normalizedPathname, locale);
  const [localizedPathname, localizedQuery = ""] = localized.split("?");
  const searchParams = new URLSearchParams(localizedQuery);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") searchParams.append(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `${localizedPathname}?${query}` : localizedPathname;
}

export function buildTelegramWebsiteFunnelContext(target = {}) {
  const intent = TELEGRAM_WEBSITE_INTENTS.has(target.intent) ? target.intent : "selected";
  const locale = target.locale || "en";
  const venue = compactSlug(target.venue, "binance");
  const botVenue = venue;
  const product = target.product || (target.instrument === "futures" ? "perpetuals" : "spot");
  const volume = normalizeWebsiteVolume(target.amount ?? target.volume ?? target.vol);
  const campaign = target.campaign || `website_${intent}`;

  if (intent === "compare") {
    const pair = normalizeWebsitePair(target);
    const botTarget = { action: "compare", pair, market: target.market, locale, product, campaign };
    const startPayload = buildTelegramWebsiteStartPayload(botTarget);
    const returnContext = target.returnRoute
      ? buildTelegramReturnContext({ route: target.returnRoute, market: target.market, locale, product, campaign, now: target.now, expiresAt: target.expiresAt })
      : buildTelegramReturnContext({ pair, market: target.market, locale, product, campaign, now: target.now, expiresAt: target.expiresAt });
    const returnHref = returnContext.href || telegramLocalizedReturnHref(`/compare/${pair}`, locale, telegramReturnParams(target, { compare: pair }));
    return { intent, botTarget, startPayload, deepLink: getTelegramDeepLinkFromPayload(startPayload), returnHref };
  }

  if (intent === "fees") {
    const instrument = normalizeWebsiteInstrument(target.instrument ?? target.type, product);
    const botTarget = { action: "fee_calc", venue: botVenue, type: instrument, vol: encodeTelegramVolume(volume), market: target.market, locale, product, campaign };
    const startPayload = buildTelegramWebsiteStartPayload(botTarget);
    const returnContext = target.returnRoute
      ? buildTelegramReturnContext({ route: target.returnRoute, market: target.market, locale, product, campaign, now: target.now, expiresAt: target.expiresAt })
      : buildTelegramReturnContext({ venue: botVenue, market: target.market, locale, product, campaign, now: target.now, expiresAt: target.expiresAt });
    const returnHref = returnContext.href || telegramLocalizedReturnHref("/embed/calculator", locale, telegramReturnParams(target, { scenario: "fees", venue: botVenue, instrument, volume, amount: volume }, { extrasFirst: true }));
    return { intent, botTarget, startPayload, deepLink: getTelegramDeepLinkFromPayload(startPayload), returnHref };
  }

  const botTarget = {
    action: intent === "selected" ? "saved_choice" : "monitor",
    venue,
    market: target.market,
    locale,
    product,
  };
  const startPayload = buildTelegramWebsiteStartPayload(botTarget);
  const returnContext = target.returnRoute
    ? buildTelegramReturnContext({ route: target.returnRoute, market: target.market, locale, product, campaign, now: target.now, expiresAt: target.expiresAt })
    : buildTelegramReturnContext({ venue, market: target.market, locale, product, campaign, now: target.now, expiresAt: target.expiresAt });
  const returnHref = returnContext.href || telegramLocalizedReturnHref(`/exchanges/${venue}`, locale, telegramReturnParams(target, { venue, amount: volume }));
  return { intent, botTarget, startPayload, deepLink: getTelegramDeepLinkFromPayload(startPayload), returnHref };
}

/**
 * 清洗 Telegram Bot start= 参数，严格遵守 Telegram 协议规范：
 * - 允许字符: [a-zA-Z0-9_-]
 * - 最大长度: 64 字符
 * @param {string} raw 
 * @returns {string}
 */
function sanitizeTelegramStartPayload(raw = "") {
  if (typeof raw !== "string") return "";
  return raw
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function cleanTelegramStartPayload(raw = "") {
  return sanitizeTelegramStartPayload(raw).slice(0, 64);
}

function telegramPayloadTag(raw = "") {
  let hash = 2166136261;
  for (const char of String(raw)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(36).slice(0, 6).padStart(6, "0");
}

function compactTelegramMetaValue(raw = "", maxLength = 12) {
  const cleaned = sanitizeTelegramStartPayload(String(raw));
  if (cleaned.length <= maxLength) return cleaned;
  const tag = telegramPayloadTag(cleaned);
  const headLength = Math.max(1, maxLength - tag.length - 1);
  return `${cleaned.slice(0, headLength)}-${tag}`.slice(0, maxLength);
}

function composeTelegramStartPayload(base = "", metaParts = []) {
  const cleanBase = sanitizeTelegramStartPayload(String(base));
  const cleanMetaParts = metaParts.map((part) => cleanTelegramStartPayload(part)).filter(Boolean);
  const criticalMetaParts = cleanMetaParts.filter((part) => /^(m|l|t)_/.test(part));
  const optionalMetaParts = cleanMetaParts.filter((part) => !/^(m|l|t)_/.test(part));
  const joinPayload = (basePart, parts) => [basePart, ...parts].filter(Boolean).join("_");

  const selectedParts = [...criticalMetaParts];
  for (const part of optionalMetaParts) {
    if (joinPayload(cleanBase, [...selectedParts, part]).length <= 64) {
      selectedParts.push(part);
    }
  }

  const fullPayload = joinPayload(cleanBase, selectedParts);
  if (fullPayload.length <= 64) return fullPayload;

  const suffix = selectedParts.length ? `_${selectedParts.join("_")}` : "";
  const baseLimit = Math.max(1, 64 - suffix.length);
  const tag = `_${telegramPayloadTag(cleanBase)}`;
  const compactBase = baseLimit > tag.length
    ? `${cleanBase.slice(0, baseLimit - tag.length).replace(/_+$/g, "")}${tag}`
    : telegramPayloadTag(cleanBase).slice(0, baseLimit);
  return `${compactBase}${suffix}`.slice(0, 64);
}


function expandTelegramLocaleMeta(value = "") {
  const cleaned = String(value || "");
  const known = {
    ptBR: "pt-BR",
    zhHans: "zh-Hans",
    zhHant: "zh-Hant",
  };
  return known[cleaned] || cleaned || null;
}

function parseTelegramPayloadMeta(tokens = []) {
  const body = [...tokens];
  const meta = {};
  while (body.length >= 2) {
    const key = body[body.length - 2];
    const value = body[body.length - 1];
    if (!["m", "l", "t", "c", "p"].includes(key)) break;
    body.splice(body.length - 2, 2);
    if (key === "m") meta.market = value;
    if (key === "l") meta.locale = expandTelegramLocaleMeta(value);
    if (key === "t") meta.product = value;
    if (key === "c") meta.campaignTag = value;
    if (key === "p") meta.publisher = value;
  }
  return { body, meta };
}

export function parseTelegramWebsiteStartPayload(payload = "") {
  const cleaned = cleanTelegramStartPayload(String(payload || ""));
  const boundary = "Local parse only: no Telegram API call, no Telegram message, no account operation, no registration, KYC, group-join or commission evidence.";
  const base = {
    status: cleaned ? "parsed" : "empty",
    payload: cleaned,
    anonymousOnly: true,
    webOnly: true,
    telegramApiCalls: 0,
    telegramMessagesSent: 0,
    realUserDataTouched: false,
    externalSubmission: false,
    protectedOutbound: false,
    boundary,
  };
  if (!cleaned) return base;

  const { body, meta } = parseTelegramPayloadMeta(cleaned.split("_"));
  const [head, second, third, ...rest] = body;
  const parsed = { ...base, ...meta, action: head || "unknown" };

  if (head === "saved" && second === "choice" && third) return { ...parsed, action: "saved_choice", venue: third };
  if (head === "monitor" && second) return { ...parsed, action: "monitor", venue: second };
  if (head === "compare" && second) return { ...parsed, action: "compare", pair: second };
  if (head === "fee" && second === "calc") {
    const [venue, type, volume] = [third, rest[0], rest[1]];
    return { ...parsed, action: "fee_calc", ...(venue ? { venue } : {}), ...(type ? { type } : {}), ...(volume ? { volume: volume.replace(/p/g, ".") } : {}) };
  }
  if (head === "partner" && second === "desk") return { ...parsed, action: "partner_desk" };
  if (head === "verify" && second === "domain") return { ...parsed, action: "verify_domain", ...(third ? { venue: third } : {}) };
  if (head === "rates") return { ...parsed, action: "rates", ...(second ? { venue: second } : {}) };
  return { ...parsed, status: "unrecognized" };
}

function websiteStartPayloadBodyShape(payload = "") {
  const cleaned = cleanTelegramStartPayload(String(payload || ""));
  if (!cleaned) return { cleaned, valid: false, reason: "empty" };
  const { body } = parseTelegramPayloadMeta(cleaned.split("_"));
  const [head, second] = body;

  if (head === "saved" && second === "choice") return { cleaned, valid: body.length === 3, reason: body.length === 3 ? null : "unexpected_body_tail" };
  if (head === "monitor") return { cleaned, valid: body.length === 2, reason: body.length === 2 ? null : "unexpected_body_tail" };
  if (head === "compare") return { cleaned, valid: body.length === 2, reason: body.length === 2 ? null : "unexpected_body_tail" };
  if (head === "fee" && second === "calc") return { cleaned, valid: body.length >= 3 && body.length <= 5, reason: body.length >= 3 && body.length <= 5 ? null : "unexpected_body_tail" };
  if (head === "partner" && second === "desk") return { cleaned, valid: body.length >= 2 && body.length <= 3, reason: body.length >= 2 && body.length <= 3 ? null : "unexpected_body_tail" };
  if (head === "verify" && second === "domain") return { cleaned, valid: body.length >= 2 && body.length <= 3, reason: body.length >= 2 && body.length <= 3 ? null : "unexpected_body_tail" };
  if (head === "rates") return { cleaned, valid: body.length >= 1 && body.length <= 2, reason: body.length >= 1 && body.length <= 2 ? null : "unexpected_body_tail" };
  return { cleaned, valid: true, reason: null };
}

function telegramPayloadReturnCampaign(parsed = {}, options = {}) {
  if (parsed.campaignTag) return `telegram-${parsed.campaignTag}`;
  return options.campaign || "telegram-start-return";
}

function fallbackTelegramWebsiteStartPayloadReturnContext(reason = "unavailable", parsed = {}, options = {}) {
  const locale = parsed.locale || options.locale || "en";
  const campaign = telegramPayloadReturnCampaign(parsed, options);
  const href = telegramLocalizedReturnHref("/telegram", locale, telegramReturnParams({
    market: parsed.market || options.market,
    product: parsed.product || options.product,
    campaign,
  }));
  return {
    status: "fallback",
    reason,
    href,
    payload: parsed.payload || "",
    anonymousOnly: true,
    webOnly: true,
    telegramApiCalls: 0,
    telegramMessagesSent: 0,
    realUserDataTouched: false,
    externalSubmission: false,
    protectedOutbound: false,
    returnContext: null,
    parsed,
    boundary: "Website start payload return is anonymous onsite context only. It does not call Telegram, send messages, touch user data, expose invite material, register accounts, join groups, submit KYC or prove commission.",
  };
}

export function buildTelegramWebsiteStartPayloadReturnContext(payload = "", options = {}) {
  const parsed = parseTelegramWebsiteStartPayload(payload);
  const shape = websiteStartPayloadBodyShape(payload);
  if (!parsed.payload) return fallbackTelegramWebsiteStartPayloadReturnContext("empty", parsed, options);
  if (parsed.status !== "parsed") return fallbackTelegramWebsiteStartPayloadReturnContext(parsed.status || "unrecognized", parsed, options);
  if (!shape.valid) return fallbackTelegramWebsiteStartPayloadReturnContext(shape.reason, parsed, options);

  const input = {
    market: parsed.market || options.market,
    locale: parsed.locale || options.locale,
    product: parsed.product || options.product,
    campaign: telegramPayloadReturnCampaign(parsed, options),
    now: options.now,
    expiresAt: options.expiresAt,
  };

  if (parsed.action === "saved_choice" || parsed.action === "monitor" || parsed.action === "fee_calc" || parsed.action === "verify_domain" || parsed.action === "rates") {
    if (parsed.venue) input.venue = parsed.venue;
  }
  if (parsed.action === "compare" && parsed.pair) input.pair = parsed.pair;

  const returnContext = buildTelegramReturnContext(input);
  if (!returnContext.href || returnContext.object?.kind === "hub") {
    return fallbackTelegramWebsiteStartPayloadReturnContext("unknown_object", parsed, options);
  }

  return {
    status: "restored",
    href: returnContext.href,
    payload: parsed.payload,
    anonymousOnly: true,
    webOnly: true,
    telegramApiCalls: 0,
    telegramMessagesSent: 0,
    realUserDataTouched: false,
    externalSubmission: false,
    protectedOutbound: false,
    returnContext,
    parsed,
    boundary: "Website start payload return restores only anonymous onsite page state. It does not call Telegram, send messages, touch user data, expose invite material, register accounts, join groups, submit KYC or prove commission.",
  };
}

export const TELEGRAM_WEBSITE_START_PAYLOAD_RUNTIME_CONTRACT = Object.freeze({
  mode: "local_runtime_adapter_only",
  inputSurfaces: ["raw_start_payload", "/start payload text", "URLSearchParams", "adapter object"],
  output: "anonymous onsite return href plus boundary metadata",
  telegramApiCalls: 0,
  telegramMessagesSent: 0,
  realUserDataTouched: false,
  externalSubmission: false,
  protectedOutbound: false,
  boundary:
    "Runtime adapter consumes Telegram start payloads locally and returns a NexuAlpha onsite URL only. It does not call Telegram, send messages, touch real user data, expose invite material, register accounts, join groups, submit KYC or prove commission.",
});

function extractTelegramStartPayloadFromText(text = "") {
  const value = String(text || "").trim();
  const match = value.match(/^\/start(?:@\w+)?(?:\s+(.+))?$/i);
  return match ? match[1] || "" : value;
}

function extractTelegramStartPayload(input = {}) {
  if (input instanceof URLSearchParams) {
    const starts = input.getAll("start");
    return { payload: starts.length === 1 ? starts[0] : "", reason: starts.length > 1 ? "duplicate_start" : starts.length === 0 ? "missing_start" : null };
  }

  if (typeof input === "string") {
    return { payload: extractTelegramStartPayloadFromText(input), reason: null };
  }

  if (input && typeof input === "object") {
    if (input.searchParams instanceof URLSearchParams) return extractTelegramStartPayload(input.searchParams);
    if (input.query instanceof URLSearchParams) return extractTelegramStartPayload(input.query);
    const raw = input.startPayload ?? input.start ?? input.payload ?? input.messageText ?? input.text ?? "";
    return { payload: extractTelegramStartPayloadFromText(raw), reason: raw ? null : "missing_start" };
  }

  return { payload: "", reason: "unsupported_input" };
}

export function resolveTelegramWebsiteStartPayloadRuntime(input = {}, options = {}) {
  const extracted = extractTelegramStartPayload(input);
  const restored = extracted.reason
    ? fallbackTelegramWebsiteStartPayloadReturnContext(extracted.reason, { payload: "" }, options)
    : buildTelegramWebsiteStartPayloadReturnContext(extracted.payload, options);
  const isRestored = restored.status === "restored";
  return {
    ...TELEGRAM_WEBSITE_START_PAYLOAD_RUNTIME_CONTRACT,
    status: restored.status,
    reason: restored.reason || extracted.reason || null,
    source: options.source || "telegram_start_payload",
    payload: isRestored ? restored.payload || cleanTelegramStartPayload(extracted.payload || "") : "",
    href: restored.href,
    returnContext: restored.returnContext,
    parsed: isRestored ? restored.parsed : { status: restored.parsed?.status || "fallback", reason: restored.reason || extracted.reason || null },
    webOnly: true,
    anonymousOnly: true,
    safeReply: {
      kind: "onsite_return_link",
      href: restored.href,
      text: restored.status === "restored"
        ? "Open NexuAlpha return context"
        : "Open NexuAlpha Telegram hub",
      boundary: TELEGRAM_WEBSITE_START_PAYLOAD_RUNTIME_CONTRACT.boundary,
    },
  };
}

function getTelegramDeepLinkFromPayload(payload = "") {
  if (!payload) return TELEGRAM_CONFIG.botUrl;
  return `${TELEGRAM_CONFIG.botUrl}?start=${encodeURIComponent(payload)}`;
}

function buildTelegramWebsiteStartPayload(target = {}) {
  const standardPayload = buildTelegramStartPayload(target);
  if (!target.campaign || standardPayload.length === 64 || standardPayload.includes("_c_")) {
    return standardPayload;
  }

  const criticalMetaParts = [];
  if (target.market) criticalMetaParts.push(`m_${compactTelegramMetaValue(target.market, 8)}`);
  if (target.locale) criticalMetaParts.push(`l_${compactTelegramMetaValue(String(target.locale).replace(/-/g, ""), 8)}`);
  if (target.product) criticalMetaParts.push(`t_${compactTelegramMetaValue(target.product, 12)}`);
  const criticalSuffix = criticalMetaParts.length ? `_${criticalMetaParts.join("_")}` : "";
  const campaignPart = `c_${telegramPayloadTag(target.campaign)}`;

  let base = standardPayload;
  if (criticalSuffix && standardPayload.endsWith(criticalSuffix)) {
    base = standardPayload.slice(0, -criticalSuffix.length);
  }

  const suffix = `_${[campaignPart, ...criticalMetaParts].join("_")}`;
  if (base.length + suffix.length <= 64) return `${base}${suffix}`;

  const baseLimit = Math.max(1, 64 - suffix.length);
  const compactBase = sanitizeTelegramStartPayload(base).slice(0, baseLimit).replace(/_+$/g, "");
  return `${compactBase}${suffix}`.slice(0, 64);
}

/**
 * 根据参数化路由构建标准的 Telegram Bot start 参数
 * @param {string|object} target 
 * @returns {string}
 */
export function buildTelegramStartPayload(target = "") {
  if (!target) return "";
  if (typeof target === "string") {
    const stripped = target.startsWith("/start ") ? target.slice(7) : target;
    return cleanTelegramStartPayload(stripped);
  }

  if (typeof target !== "object") return "";

  const { action, venue, pair, venueA, venueB, type, vol, domain, project, symbol, campaign, market, locale, product, publisher } = target;

  // 格式化辅助：若包含市场、语言或分发者标识，生成紧凑后缀（如 _m_BR_l_pt_p_c01）
  const metaParts = [];
  if (market) metaParts.push(`m_${compactTelegramMetaValue(market, 8)}`);
  if (locale) metaParts.push(`l_${compactTelegramMetaValue(String(locale).replace(/-/g, ""), 8)}`);
  if (product) metaParts.push(`t_${compactTelegramMetaValue(product, 12)}`);
  if (publisher) metaParts.push(`p_${compactTelegramMetaValue(publisher, 16)}`);
  if (campaign) metaParts.push(`c_${telegramPayloadTag(campaign)}`);

  switch (action) {
    case "partner_desk": {
      const p = publisher ? `_${publisher}` : "";
      return composeTelegramStartPayload(`partner_desk${p}`, metaParts.filter((part) => !part.startsWith("p_")));
    }
    case "fee_calc": {
      const v = venue || "general";
      const sub = [type, vol].filter(Boolean).join("_");
      const base = sub ? `fee_calc_${v}_${sub}` : `fee_calc_${v}`;
      return composeTelegramStartPayload(base, metaParts);
    }
    case "compare": {
      const p = pair || (venueA && venueB ? `${venueA}-vs-${venueB}` : "top");
      return composeTelegramStartPayload(`compare_${p}`, metaParts);
    }
    case "launchpool_alert": {
      const p = project || symbol || "";
      const base = p ? `launchpool_alert_${p}` : "launchpool_alert";
      return composeTelegramStartPayload(base, metaParts);
    }
    case "verify_domain": {
      const v = venue || domain || "general";
      return composeTelegramStartPayload(`verify_domain_${v}`, metaParts);
    }
    case "rates": {
      const v = venue || pair || "all";
      return composeTelegramStartPayload(`rates_${v}`, metaParts);
    }
    case "monitor": {
      const v = venue || domain || "general";
      return composeTelegramStartPayload(`monitor_${v}`, metaParts);
    }
    default: {
      if (action) {
        const parts = [venue, pair, type, vol, campaign, project].filter(Boolean).join("_");
        const base = parts ? `${action}_${parts}` : action;
        return composeTelegramStartPayload(base, metaParts);
      }
      return "";
    }
  }
}

/**
 * 生成符合 Telegram 官方 Deep Link 标准的唤醒链接
 * 支持对象参数与原始字符串两种调用方式
 * 
 * 示例：
 * getTelegramDeepLink({ action: 'fee_calc', venue: 'binance' })
 *  -> https://t.me/NexuAlphaAssistantBot?start=fee_calc_binance
 * getTelegramDeepLink({ action: 'compare', pair: 'binance-vs-okx' })
 *  -> https://t.me/NexuAlphaAssistantBot?start=compare_binance-vs-okx
 * getTelegramDeepLink({ action: 'launchpool_alert' })
 *  -> https://t.me/NexuAlphaAssistantBot?start=launchpool_alert
 * getTelegramDeepLink({ action: 'verify_domain', venue: 'okx' })
 *  -> https://t.me/NexuAlphaAssistantBot?start=verify_domain_okx
 * 
 * @param {string|object} target 启动参数或路由对象
 * @returns {string} 完整的 t.me Deep Link
 */
export function getTelegramDeepLink(target = "") {
  const payload = buildTelegramStartPayload(target);
  if (!payload) return TELEGRAM_CONFIG.botUrl;
  return `${TELEGRAM_CONFIG.botUrl}?start=${encodeURIComponent(payload)}`;
}

/**
 * Telegram 快捷分享链接
 * @param {{ url: string, text?: string }} options
 * @returns {string}
 */
export function getTelegramShareUrl({ url = "", text = "" } = {}) {
  const base = "https://t.me/share/url";
  const params = new URLSearchParams();
  if (url) params.append("url", url);
  if (text) params.append("text", text);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export const TELEGRAM_GROWTH_OPERATING_SYSTEM = Object.freeze({
  status: "draft_only_manual_execution",
  version: "2026-09-27-telegram-ops-90d-v1",
  publicSurfaces: [
    {
      id: "channel",
      handle: TELEGRAM_CONFIG.channelUsername,
      url: TELEGRAM_CONFIG.channelUrl,
      role: "source-reviewed digest and durable distribution surface",
      objective: "send users to a first-party NexuAlpha answer, comparison, calculator or regional checklist before any external platform action",
      maxFrequency: { cadence: "3_channel_posts_per_week", hardCap: "1_primary_post_per_day" },
    },
    {
      id: "group",
      handle: TELEGRAM_CONFIG.groupUsername,
      url: TELEGRAM_CONFIG.groupUrl,
      role: "community question intake and objection discovery",
      objective: "collect repeated platform-selection, regional-funding and safety questions for SEO/AEO/GEO updates",
      maxFrequency: { cadence: "2_group_prompts_per_week", hardCap: "1_structured_prompt_per_day" },
    },
    {
      id: "assistant_bot",
      handle: TELEGRAM_CONFIG.botUsername,
      url: TELEGRAM_CONFIG.botUrl,
      role: "context resume, saved-choice recall, source-check menus and explicit opt-in alerts",
      objective: "restore a user's public decision context and return them to the matching NexuAlpha route",
      maxFrequency: { cadence: "user_initiated_or_opt_in_only", hardCap: "1_alert_digest_per_user_per_day" },
    },
  ],
  ninetyDayPhases: [
    {
      id: "phase_1_foundation_days_1_30",
      goal: "ship the channel-group-bot operating loop with zh-Hans, en and pt-BR templates",
      outputs: ["weekly_manual_publish_pack", "first_party_landing_review", "anonymous_24h_7d_review", "seo_aeo_question_queue"],
      scaleGate: "no raw exchange links in Telegram copy, onsite URL before Bot link, and at least one reviewed page-improvement item per week",
    },
    {
      id: "phase_2_regional_conversion_days_31_60",
      goal: "deepen Brazil plus global comparison themes and add only evidence-backed regions",
      outputs: ["br_pix_cpf_cost_cards", "binance_okx_bybit_bitget_comparison_cards", "regional_objection_digest"],
      scaleGate: "positive onsite engagement or repeated community objections; click metrics remain CTA clicks, not registrations",
    },
    {
      id: "phase_3_compounding_days_61_90",
      goal: "turn repeated Telegram questions into search-visible NexuAlpha pages and reusable Bot menus",
      outputs: ["answer_update_backlog", "localized_menu_refresh", "creator_brief_candidates"],
      scaleGate: "source-reviewed page shipped before broadcast scaling; no private commission or guaranteed benefit claims",
    },
  ],
  localeLaunchTemplates: {
    "zh-Hans": {
      welcome: "欢迎来到 NexuAlpha。这里先帮你把交易平台选择拆清楚：地区、产品、费用、入金、官方入口分别核验；点击始终先回到 NexuAlpha 页面，再决定是否进入第三方平台。",
      channelPost: "问题：开户前最容易漏看什么？\n结论：先确认地区、产品权限、费用口径和官方入口，再看是否继续注册。\n下一步：打开 NexuAlpha 对应页面，先完成站内核验。",
      groupPrompt: "你现在选择平台时卡在哪一步？费用、KYC、入金、提现网络、还是两家平台不知道怎么选？请说明地区、产品和当前障碍，我们会把高频问题整理成站内答案。",
      botMenu: ["继续上次比较", "保存我的选择", "核验官方域名", "费用情景测算", "提醒设置", "退订/删除数据"],
    },
    en: {
      welcome: "Welcome to NexuAlpha. We help you separate region, product access, fees, funding rails and official routes before you open an account. Telegram brings you back to a NexuAlpha page first.",
      channelPost: "Question: what should you check before signup?\nAnswer: region, product scope, published fees, funding route and official-domain path belong in separate checks.\nNext: open the NexuAlpha page first.",
      groupPrompt: "Where does platform selection get stuck for you: fees, KYC, deposits, withdrawal network, or choosing between two venues? Add your region and product so repeated questions become source-reviewed NexuAlpha answers.",
      botMenu: ["Resume comparison", "Save my choice", "Verify official domain", "Run fee scenario", "Alert settings", "Unsubscribe/delete"],
    },
    "pt-BR": {
      welcome: "Bem-vindo ao NexuAlpha. Antes do cadastro, separe regiao, produto, Pix/BRL, CPF/KYC, custos e dominio oficial. O Telegram sempre leva primeiro para uma pagina NexuAlpha.",
      channelPost: "Pergunta: o que confirmar antes do cadastro?\nResposta: Pix/BRL, CPF/KYC, produto disponivel, custos publicados e dominio oficial devem ser checados separadamente.\nProximo passo: abrir a pagina NexuAlpha primeiro.",
      groupPrompt: "Na escolha de corretora, onde voce trava: Pix, CPF/KYC, taxa, saque, ou Binance vs OKX/Bitget/Bybit? Inclua regiao e produto para virar resposta revisada no NexuAlpha.",
      botMenu: ["Continuar comparacao", "Salvar minha escolha", "Verificar dominio oficial", "Simular custos", "Configurar alertas", "Cancelar/excluir"],
    },
  },
  eventContract: [
    {
      name: "bot_start",
      meaning: "user opened or resumed the AssistantBot flow",
      requiredFields: ["surface", "locale", "market", "product", "start_payload"],
      boundary: "does not prove onsite engagement, signup, KYC, deposit or commission",
    },
    {
      name: "intent_resolved",
      meaning: "user selected a supported decision intent such as compare, fee, official-domain or regional readiness",
      requiredFields: ["intent", "locale", "market", "product"],
      boundary: "does not prove a platform choice or external account action",
    },
    {
      name: "saved_choice",
      meaning: "user explicitly saved a public comparison or checklist context",
      requiredFields: ["choice_type", "route", "locale", "expires_at"],
      boundary: "must not contain private exchange account data or raw referral destination",
    },
    {
      name: "site_return",
      meaning: "Telegram context returned to a first-party NexuAlpha route",
      requiredFields: ["route", "utm_source", "utm_medium", "utm_campaign", "tg_locale", "tg_market", "tg_product"],
      boundary: "onsite return is not an exchange registration",
    },
    {
      name: "invite_click",
      meaning: "protected outbound click to a configured partner route from NexuAlpha",
      requiredFields: ["venue", "route", "source_surface", "dedupe_window"],
      boundary: "click is not registration, KYC, first trade, rebate, discount entitlement or commission",
    },
  ],
  sourceReviewRules: [
    "Telegram copy must link to NexuAlpha first-party pages before any Bot deep link.",
    "Telegram copy must not paste raw exchange registration URLs, invite codes, private commission terms or guaranteed user benefits.",
    "Every post must include one concrete question, a short answer, an applicability boundary and a reviewed NexuAlpha landing page.",
    "Source freshness, locale fit and CTA boundary must be reviewed before manual posting.",
    "Repeated group questions become SEO/AEO/GEO backlog items only after personal data is removed.",
  ],
  optInAndUnsubscribe: {
    defaultAlertState: "off",
    optInRequired: true,
    unsubscribeCommands: ["/stop", "/delete", "unsubscribe"],
    deleteExpectation: "delete saved choices and alert preferences while keeping aggregate anonymous counters",
    maxAlertFrequency: "1_digest_per_user_per_day",
    staleSourceBehavior: "hold_alert_and_send_no_placeholder",
  },
  seoAeoGeoBacklog: [
    {
      signal: "repeated local funding or KYC question",
      owner: "seo_aeo_geo",
      action: "update regional funding checklist and add direct-answer FAQ",
      priorityMarkets: ["BR", "KR", "TR", "HK", "MX", "JP"],
    },
    {
      signal: "comparison confusion after channel post",
      owner: "conversion_content",
      action: "tighten first paragraph, table labels, internal links and CTA order on comparison page",
      priorityMarkets: ["GLOBAL", "BR"],
    },
    {
      signal: "source challenge or stale offer objection",
      owner: "editorial_source_review",
      action: "add source boundary, reviewed date, pending-source label or remove claim from draft queue",
      priorityMarkets: ["GLOBAL"],
    },
    {
      signal: "strong operational question from group",
      owner: "news_and_guides",
      action: "create or refresh a how-to article linked from relevant venue pages",
      priorityMarkets: ["GLOBAL", "ZH", "BR"],
    },
  ],
  reportingCadence: {
    daily: ["manual review queue status", "held posts and reason", "source or locale defects"],
    weekly: ["bot_start", "intent_resolved", "saved_choice", "site_return", "invite_click", "unsubscribes", "seo_aeo_backlog_updates"],
    forbiddenRollups: ["click_to_registration_claim", "commission_claim", "guaranteed_rebate_claim", "google_ranking_claim_without_gsc_evidence"],
  },
});

export const TELEGRAM_WEEK1_RETENTION_LOOP = Object.freeze({
  status: "local_draft_contract",
  version: "2026-09-28-week1-retention-v1",
  scope: "Bot entry -> market/product/candidate venues -> NexuAlpha onsite deep link -> explicit opt-in subscription -> anonymous return review.",
  safetyBoundary: {
    noTelegramApiCall: true,
    noRealAccountOperation: true,
    noExternalSubmission: true,
    noPartnerRegistryEdit: true,
    protectedUserActionCommands: ["/choice", "/stop", "/delete"],
    commandExecutionPolicy: "manual_acceptance_text_only; never execute protected user-action commands for a user",
    protectedInviteMaterialPolicy: "do not expose raw exchange registration URLs, invitation codes, private commission terms or partner invite links in Telegram copy or evidence",
  },
  requiredContextFields: ["market", "locale", "product", "candidateVenues", "onsiteReturnHref", "botIntent", "subscriptionState"],
  entrypoints: [
    {
      id: "bot_start",
      surface: "NexuAlphaAssistantBot",
      allowedTrigger: "user opens the Bot or follows a draft deep link",
      records: ["start_payload", "market", "locale", "product", "intent"],
      boundary: "Bot start is not signup, KYC, deposit, trade, rebate activation or commission evidence.",
    },
    {
      id: "onsite_handoff",
      surface: "NexuAlpha first-party page",
      allowedTrigger: "user returns to a NexuAlpha page from Telegram context",
      records: ["route", "utm_campaign", "tg_market", "tg_locale", "tg_product", "tg_draft"],
      boundary: "Onsite return must happen before any protected outbound exchange handoff.",
    },
    {
      id: "subscription_opt_in",
      surface: "Bot settings",
      allowedTrigger: "explicit alert opt-in only",
      records: ["topic", "locale", "market", "product", "frequency_cap"],
      boundary: "Default alert state is off; a draft or channel post cannot subscribe a user.",
    },
  ],
  scenarioMatrix: [
    {
      id: "br-spot-pix-choice",
      market: "BR",
      locale: "pt-BR",
      product: "spot",
      botIntent: "regional_readiness",
      candidateVenues: ["binance", "okx", "bitget"],
      onsiteReturnHref: "/br/conta?locale=pt-BR&market=BR&product=spot&tg_funnel=retention_week1",
      botDeepLinkAction: { action: "partner_desk", market: "BR", locale: "pt-BR", product: "spot", campaign: "week1_retention_br_spot" },
      subscriptionState: "off_until_explicit_opt_in",
      manualAcceptance: [
        "open Bot draft deep link without sending a Telegram message",
        "confirm Brazil account checklist is the first return route",
        "confirm candidate venues remain comparison choices, not raw registration links",
      ],
    },
    {
      id: "global-perp-compare-choice",
      market: "GLOBAL",
      locale: "en",
      product: "perpetuals",
      botIntent: "compare",
      candidateVenues: ["hyperliquid", "dydx", "bybit"],
      onsiteReturnHref: "/compare/hyperliquid-vs-dydx?market=GLOBAL&product=perpetuals&tg_funnel=retention_week1",
      botDeepLinkAction: { action: "compare", pair: "hyperliquid-vs-dydx", market: "GLOBAL", locale: "en", product: "perpetuals", campaign: "week1_retention_global_perp" },
      subscriptionState: "off_until_explicit_opt_in",
      manualAcceptance: [
        "confirm comparison page is the first hop",
        "confirm Perp DEX cost, funding and liquidation checks are separated",
        "confirm no platform choice is saved unless a human tester explicitly records a local test note",
      ],
    },
    {
      id: "kr-dex-source-check",
      market: "KR",
      locale: "ko",
      product: "dex",
      botIntent: "verify_domain",
      candidateVenues: ["uniswap", "jupiter", "hyperliquid"],
      onsiteReturnHref: "/ko/exchanges/uniswap?market=KR&product=dex&tg_funnel=retention_week1",
      botDeepLinkAction: { action: "verify_domain", venue: "uniswap", market: "KR", locale: "ko", product: "dex", campaign: "week1_retention_kr_dex" },
      subscriptionState: "off_until_explicit_opt_in",
      manualAcceptance: [
        "confirm official-domain checklist precedes wallet or exchange action",
        "confirm source freshness and locale fit are reviewed before any reuse",
        "confirm no wallet signature, account login or user command is executed",
      ],
    },
  ],
  returnReview: {
    windows: ["24h", "7d"],
    anonymousOnly: true,
    metrics: ["landingVisits", "onsiteNextStepClicks", "botStartsIfVisible", "subscriptionOptIns", "unsubscribes", "sourceLocaleOrCtaIssues"],
    forbiddenMetrics: ["registration", "kycApproval", "deposit", "firstTrade", "rebateActivation", "privateCommission", "userLevelCrossDeviceFunnel"],
  },
  manualAcceptanceArtifacts: [
    "docs/strategy/telegram-week1-retention-manual-acceptance-20260928.md",
    "docs/evidence/telegram-week1-retention-local-review-20260928.json",
  ],
});

export const TELEGRAM_WEEK4_CONTEXT_RETURN_PACK = Object.freeze({
  status: "manual_review_pack_only",
  version: "2026-09-29-week4-context-return-v1",
  cadenceDays: 14,
  scope: "regional, venue and comparison return paths from Telegram back to first-party NexuAlpha pages",
  safetyBoundary: {
    noTelegramApiCall: true,
    noTelegramMessagesSent: true,
    noExternalSubmission: true,
    noPartnerRegistryEdit: true,
    noRawExchangeRegistrationLinks: true,
    anonymousOnly: true,
    forbiddenClaims: [
      "registration",
      "KYC approval",
      "deposit",
      "first trade",
      "rebate activation",
      "non-public revenue-share terms",
      "guaranteed user benefit",
    ],
  },
  requiredReturnParams: [
    "tg_return",
    "tg_expires",
    "tg_market",
    "tg_locale",
    "tg_product",
    "tg_campaign",
  ],
  slots: [
    {
      day: 1,
      id: "mx-spei-account-readiness",
      market: "MX",
      locale: "es",
      product: "spot",
      type: "regional",
      firstOnsiteRoute: "/mx?locale=es&market=MX&product=spot&account_stage=new_account&funding=SPEI",
      returnContext: { route: "/mx", market: "MX", locale: "es", product: "spot", accountStage: "new_account", funding: "SPEI", campaign: "week4_mx_spei_return" },
      botDeepLinkAction: { action: "partner_desk", market: "MX", locale: "es", product: "spot", campaign: "week4_mx_spei_return" },
      reviewFocus: "SPEI, MXN, account-name match and official account flow remain separate checks.",
    },
    {
      day: 2,
      id: "br-pix-account-readiness",
      market: "BR",
      locale: "pt-BR",
      product: "spot",
      type: "regional",
      firstOnsiteRoute: "/br/conta?locale=pt-BR&market=BR&product=spot&account_stage=new_account&funding=Pix",
      returnContext: { route: "/br/conta", market: "BR", locale: "pt-BR", product: "spot", accountStage: "new_account", funding: "Pix", campaign: "week4_br_pix_return" },
      botDeepLinkAction: { action: "partner_desk", market: "BR", locale: "pt-BR", product: "spot", campaign: "week4_br_pix_return" },
      reviewFocus: "CPF, Pix, platform screen and product access must be checked before any signup path.",
    },
    {
      day: 3,
      id: "jp-exchange-source-check",
      market: "JP",
      locale: "ja",
      product: "spot",
      type: "regional",
      firstOnsiteRoute: "/jp?locale=ja&market=JP&product=spot",
      returnContext: { route: "/jp", market: "JP", locale: "ja", product: "spot", campaign: "week4_jp_source_return" },
      botDeepLinkAction: { action: "verify_domain", venue: "bitget", market: "JP", locale: "ja", product: "spot", campaign: "week4_jp_source_return" },
      reviewFocus: "Japanese copy must keep official-source and account-result boundaries visible.",
    },
    {
      day: 4,
      id: "kr-dex-domain-check",
      market: "KR",
      locale: "ko",
      product: "dex",
      type: "venue",
      firstOnsiteRoute: "/ko/exchanges/uniswap?market=KR&product=dex",
      returnContext: { venue: "uniswap", market: "KR", locale: "ko", product: "dex", campaign: "week4_kr_dex_return" },
      botDeepLinkAction: { action: "verify_domain", venue: "uniswap", market: "KR", locale: "ko", product: "dex", campaign: "week4_kr_dex_return" },
      reviewFocus: "Wallet route, official app, chain and token address precede any signature.",
    },
    {
      day: 5,
      id: "tr-spk-market-check",
      market: "TR",
      locale: "tr",
      product: "spot",
      type: "regional",
      firstOnsiteRoute: "/markets/turkiye?locale=tr&market=TR&product=spot",
      returnContext: { route: "/markets/turkiye", market: "TR", locale: "tr", product: "spot", campaign: "week4_tr_spk_return" },
      botDeepLinkAction: { action: "partner_desk", market: "TR", locale: "tr", product: "spot", campaign: "week4_tr_spk_return" },
      reviewFocus: "SPK list context does not prove account eligibility, TRY rail or product access.",
    },
    {
      day: 6,
      id: "hk-account-language-route",
      market: "HK",
      locale: "zh-Hant",
      product: "spot",
      type: "regional",
      firstOnsiteRoute: "/hk?locale=zh-Hant&market=HK&product=spot",
      returnContext: { route: "/hk", market: "HK", locale: "zh-Hant", product: "spot", campaign: "week4_hk_account_return" },
      botDeepLinkAction: { action: "monitor", venue: "okx", market: "HK", locale: "zh-Hant", product: "spot", campaign: "week4_hk_account_return" },
      reviewFocus: "Traditional Chinese path keeps region, account and product checks separate.",
    },
    {
      day: 7,
      id: "sg-comparison-next-step",
      market: "SG",
      locale: "en",
      product: "spot",
      type: "regional",
      firstOnsiteRoute: "/sg?market=SG&product=spot",
      returnContext: { route: "/sg", market: "SG", locale: "en", product: "spot", campaign: "week4_sg_compare_return" },
      botDeepLinkAction: { action: "compare", pair: "binance-vs-okx", market: "SG", locale: "en", product: "spot", campaign: "week4_sg_compare_return" },
      reviewFocus: "Compare published differences first; do not imply approval or account benefit.",
    },
    {
      day: 8,
      id: "tw-law-effective-boundary",
      market: "TW",
      locale: "zh-Hant",
      product: "spot",
      type: "regional",
      firstOnsiteRoute: "/tw?locale=zh-Hant&market=TW&product=spot",
      returnContext: { route: "/tw", market: "TW", locale: "zh-Hant", product: "spot", campaign: "week4_tw_source_return" },
      botDeepLinkAction: { action: "monitor", venue: "binance", market: "TW", locale: "zh-Hant", product: "spot", campaign: "week4_tw_source_return" },
      reviewFocus: "Law-effective timing, AML registration and account outcome stay separate.",
    },
    {
      day: 9,
      id: "us-source-policy-aeo",
      market: "US",
      locale: "en",
      product: "spot",
      type: "regional",
      firstOnsiteRoute: "/us?market=US&product=spot",
      returnContext: { route: "/us", market: "US", locale: "en", product: "spot", campaign: "week4_us_source_return" },
      botDeepLinkAction: { action: "verify_domain", venue: "coinbase", market: "US", locale: "en", product: "spot", campaign: "week4_us_source_return" },
      reviewFocus: "Source policy and state/account constraints cannot become signup advice.",
    },
    {
      day: 10,
      id: "eu-miCA-source-review",
      market: "EU",
      locale: "en",
      product: "spot",
      type: "regional",
      firstOnsiteRoute: "/eu?market=EU&product=spot",
      returnContext: { route: "/eu", market: "EU", locale: "en", product: "spot", campaign: "week4_eu_mica_return" },
      botDeepLinkAction: { action: "monitor", venue: "kraken", market: "EU", locale: "en", product: "spot", campaign: "week4_eu_mica_return" },
      reviewFocus: "MiCA, country, fiat rail and product scope are reviewed before platform action.",
    },
    {
      day: 11,
      id: "uk-fca-account-scope",
      market: "UK",
      locale: "en",
      product: "spot",
      type: "regional",
      firstOnsiteRoute: "/uk?market=UK&product=spot",
      returnContext: { route: "/uk", market: "UK", locale: "en", product: "spot", campaign: "week4_uk_fca_return" },
      botDeepLinkAction: { action: "monitor", venue: "kraken", market: "UK", locale: "en", product: "spot", campaign: "week4_uk_fca_return" },
      reviewFocus: "FCA-facing language stays research-only and excludes product-access promises.",
    },
    {
      day: 12,
      id: "id-bappebti-source-route",
      market: "ID",
      locale: "id",
      product: "spot",
      type: "regional",
      firstOnsiteRoute: "/id?locale=id&market=ID&product=spot",
      returnContext: { route: "/id", market: "ID", locale: "id", product: "spot", campaign: "week4_id_source_return" },
      botDeepLinkAction: { action: "verify_domain", venue: "binance", market: "ID", locale: "id", product: "spot", campaign: "week4_id_source_return" },
      reviewFocus: "Indonesian route keeps regulator, account flow and referral outcome independent.",
    },
    {
      day: 13,
      id: "global-perp-dex-compare",
      market: "GLOBAL",
      locale: "en",
      product: "perpetuals",
      type: "compare",
      firstOnsiteRoute: "/compare/hyperliquid-vs-dydx?market=GLOBAL&product=perpetuals",
      returnContext: { pair: "hyperliquid-vs-dydx", market: "GLOBAL", locale: "en", product: "perpetuals", campaign: "week4_perp_compare_return" },
      botDeepLinkAction: { action: "compare", pair: "hyperliquid-vs-dydx", market: "GLOBAL", locale: "en", product: "perpetuals", campaign: "week4_perp_compare_return" },
      reviewFocus: "Funding, liquidation, custody model and bridge route are distinct checks.",
    },
    {
      day: 14,
      id: "global-registration-path-safety",
      market: "GLOBAL",
      locale: "en",
      product: "spot",
      type: "venue",
      firstOnsiteRoute: "/exchanges/bitget?market=GLOBAL&product=spot",
      returnContext: { venue: "bitget", market: "GLOBAL", locale: "en", product: "spot", campaign: "week4_bitget_path_return" },
      botDeepLinkAction: { action: "monitor", venue: "bitget", market: "GLOBAL", locale: "en", product: "spot", campaign: "week4_bitget_path_return" },
      reviewFocus: "Registration path can be inspected only on NexuAlpha; Telegram copy must not paste invite URLs or codes.",
    },
  ],
  reviewWindows: ["24h", "7d"],
  anonymousMetrics: ["landingVisits", "onsiteNextStepClicks", "botStartsIfVisible", "returnBannerContinues", "sourceLocaleOrCtaIssues"],
  manualAcceptanceArtifacts: [
    "docs/strategy/telegram-week4-context-return-review-pack-20260929.md",
    "docs/evidence/telegram-week4-context-return-review-pack-20260929.json",
  ],
});

export function validateTelegramWeek4ContextReturnPackUrls({
  pack = TELEGRAM_WEEK4_CONTEXT_RETURN_PACK,
  now = Date.now(),
} = {}) {
  const checks = [];
  const problems = [];

  for (const slot of pack.slots || []) {
    const generated = buildTelegramReturnContext({ ...slot.returnContext, now });
    const firstOnsiteUrl = new URL(slot.firstOnsiteRoute, "https://nexualpha.com");
    const generatedUrl = new URL(generated.href, "https://nexualpha.com");
    const restored = readTelegramReturnContext(generatedUrl.search, { now });
    const requiredMissing = (pack.requiredReturnParams || []).filter((param) => !generatedUrl.searchParams.get(param));
    const localizedFirstPath = new URL(localizedPath(firstOnsiteUrl.pathname, slot.locale), "https://nexualpha.com").pathname;
    const routeMatches = firstOnsiteUrl.pathname === generatedUrl.pathname || localizedFirstPath === generatedUrl.pathname;
    const publicContextMatches = restored.status === "restored"
      && restored.market === slot.market
      && restored.locale === slot.locale
      && restored.product === slot.product
      && restored.campaign === slot.returnContext?.campaign;
    const firstHopIsOnsite = slot.firstOnsiteRoute.startsWith("/") && !slot.firstOnsiteRoute.startsWith("//");
    const generatedIsOnsite = generated.href.startsWith("/") && !generated.href.startsWith("//");
    const pass = firstHopIsOnsite && generatedIsOnsite && routeMatches && publicContextMatches && requiredMissing.length === 0;

    if (!pass) {
      problems.push({
        id: slot.id,
        firstHopIsOnsite,
        generatedIsOnsite,
        routeMatches,
        publicContextMatches,
        requiredMissing,
        firstPath: firstOnsiteUrl.pathname,
        generatedPath: generatedUrl.pathname,
        restoredStatus: restored.status,
      });
    }

    checks.push({
      id: slot.id,
      day: slot.day,
      type: slot.type,
      firstOnsiteRoute: slot.firstOnsiteRoute,
      generatedReturnHref: generated.href,
      restoredObject: restored.object,
      market: restored.market,
      locale: restored.locale,
      product: restored.product,
      campaign: restored.campaign,
      pass,
    });
  }

  return {
    status: problems.length === 0 ? "PASS_TELEGRAM_WEEK4_RETURN_URLS" : "FAIL_TELEGRAM_WEEK4_RETURN_URLS",
    checkedSlots: checks.length,
    telegramApiCalls: 0,
    telegramMessagesSent: 0,
    externalSubmissions: 0,
    anonymousOnly: true,
    checks,
    problems,
    boundary: "Automatic URL acceptance validates only first-party onsite return URLs and anonymous public context. It does not call Telegram, send messages, expose invite material, register accounts, join groups or prove commission.",
  };
}

/**
 * NexuAlpha Telegram 官方交互指令矩阵（用于前端交互卡片与机器人指令对齐）
 */
export const TELEGRAM_COMMANDS = [
  {
    id: "rates",
    command: "/rates",
    nameZh: "费率资料入口",
    nameHant: "實時費率對比",
    nameEn: "Fee Source Comparison",
    nameJa: "手数料ソース比較", nameKo: "수수료 출처 비교", nameTr: "Ücret kaynağı karşılaştırması",
    descZh: "打开对应的比较路径；费率与点差以页面标注的来源、时间和官方条件为准。",
    descHant: "打開對應的比較路徑；費率與點差以頁面標注的來源、時間和官方條件為準。",
    descEn: "Open the comparison path; fee and spread data are shown with their source, date, and official conditions.",
    descJa: "比較ページを開き、出典・日付・公式条件とともに手数料とスプレッドを確認します。", descKo: "비교 경로를 열고 출처·날짜·공식 조건과 함께 수수료와 스프레드를 확인합니다.", descTr: "Karşılaştırma yolunu açın; ücret ve spread verilerini kaynak, tarih ve resmî koşullarla inceleyin.",
    deepLinkAction: { action: "compare", pair: "binance-vs-okx" },
    badgeZh: "比较入口",
    badgeHant: "實時比價",
    badgeEn: "Compare",
    badgeJa: "比較", badgeKo: "비교", badgeTr: "Karşılaştır",
    icon: "⚡",
    sampleUsage: "/rates binance-vs-okx",
  },
  {
    id: "calc",
    command: "/calc",
    nameZh: "手续费情景测算",
    nameHant: "交易回血測算",
    nameEn: "Fee Scenario Calculator",
    nameJa: "手数料シナリオ計算", nameKo: "수수료 시나리오 계산기", nameTr: "Ücret senaryosu hesaplayıcı",
    descZh: "输入交易量与标的，查看公开费率情景；用户权益不能用模型结果代替，需在官方账户核验。",
    descHant: "輸入交易量與標的，查看公開費率情景；用戶權益不能用模型結果代替，需在官方帳戶核驗。",
    descEn: "Model a published-fee scenario; user benefits are separate and must be verified in the official account.",
    descJa: "公開手数料のシナリオを試算します。ユーザー向け特典は別途、公式アカウントで確認してください。", descKo: "공개 수수료 시나리오를 계산합니다. 사용자 혜택은 공식 계정에서 별도로 확인해야 합니다.", descTr: "Yayımlanan ücret senaryosunu modelleyin; kullanıcı avantajları resmî hesapta ayrıca doğrulanmalıdır.",
    deepLinkAction: { action: "fee_calc", venue: "binance" },
    badgeZh: "情景测算",
    badgeHant: "精算回血",
    badgeEn: "Fee Scenario",
    badgeJa: "手数料シナリオ", badgeKo: "수수료 시나리오", badgeTr: "Ücret senaryosu",
    icon: "🧮",
    sampleUsage: "/calc binance futures 100000",
  },
  {
    id: "alert",
    command: "/alert",
    nameZh: "突发上币与挖矿",
    nameHant: "突發上幣與挖礦",
    nameEn: "Campaign Research",
    nameJa: "キャンペーン調査", nameKo: "캠페인 조사", nameTr: "Kampanya araştırması",
    descZh: "打开活动研究入口；只有接入并通过来源检查的更新才会进入正式提醒。",
    descHant: "打開活動研究入口；只有接入並通過來源檢查的更新才會進入正式提醒。",
    descEn: "Open the campaign research path; only connected, source-checked updates can become formal alerts.",
    descJa: "キャンペーン調査を開きます。接続済みで出典確認された更新だけが正式な通知対象になります。", descKo: "캠페인 조사 경로를 엽니다. 연결되고 출처가 확인된 업데이트만 공식 알림이 됩니다.", descTr: "Kampanya araştırmasını açın; yalnızca bağlı ve kaynak kontrolü yapılmış güncellemeler resmî uyarıya dönüşür.",
    deepLinkAction: { action: "launchpool_alert" },
    badgeZh: "研究入口",
    badgeHant: "突發推送",
    badgeEn: "Research",
    badgeJa: "調査", badgeKo: "리서치", badgeTr: "Araştırma",
    icon: "🚨",
    sampleUsage: "/alert launchpool",
  },
  {
    id: "check",
    command: "/check",
    nameZh: "防钓鱼真伪验真",
    nameHant: "防釣魚真偽驗真",
    nameEn: "Anti-Phishing Verifier",
    nameJa: "フィッシング対策確認", nameKo: "피싱 방지 검증기", nameTr: "Kimlik avı karşıtı doğrulama",
    descZh: "发送域名进入核验路径；核验结果以已配置的官方来源和当前状态为准。",
    descHant: "發送網域進入核驗路徑；核驗結果以已配置的官方來源和目前狀態為準。",
    descEn: "Send a domain to enter the verification path; results depend on configured official sources and current status.",
    descJa: "ドメインを確認ルートへ送ります。結果は設定済みの公式ソースと現在の状態に依存します。", descKo: "도메인을 검증 경로로 보내며 결과는 설정된 공식 출처와 현재 상태에 따라 달라집니다.", descTr: "Bir alan adını doğrulama yoluna gönderin; sonuçlar yapılandırılmış resmî kaynaklara ve güncel duruma bağlıdır.",
    deepLinkAction: { action: "verify_domain", venue: "okx" },
    badgeZh: "安全验真",
    badgeHant: "安全驗真",
    badgeEn: "Anti-Phishing",
    badgeJa: "安全確認", badgeKo: "피싱 방지", badgeTr: "Kimlik avı karşıtı",
    icon: "🛡️",
    sampleUsage: "/check okx.com",
  },
];
