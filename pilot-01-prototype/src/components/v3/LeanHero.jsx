import React, { useState, useEffect, useRef, useCallback } from "react";
import { BrandMark } from "../brand/BrandMark.jsx";
import { TraderWizardModal } from "./TraderWizardModal.jsx";
import { getTelegramDeepLink } from "../../data/telegram-config.js";
import { venueDatabase } from "../../data/venue-database.js";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { contextualHref } from "../../data/contextual-href.js";
import { localizedHref } from "../../data/locale-routing.js";
import { v3Copy } from "../../data/v3-product.js";
import { homeHeroH1 } from "../../content/home-copy.js";
import { RegistrationCard } from "./RegistrationCard.jsx";
import "./lean-hero.css";
import "./growth-conversion.css";

const directoryVenues = Object.values(venueDatabase);
const directoryStats = directoryVenues.reduce((acc, venue) => {
  acc.total += 1;
  if (venue.category === "CEX") acc.cex += 1;
  else if (venue.category === "DEX") acc.dex += 1;
  else if (venue.category === "Perp DEX") acc.perpDex += 1;
  return acc;
}, { total: 0, cex: 0, dex: 0, perpDex: 0 });

const directoryCountCopy = {
  "zh-Hans": {
    badge: `全球 ${directoryStats.total} 家加密平台官方核验 · 费率透明 · 储备金透视`,
    title: `全球 ${directoryStats.total} 家主流交易平台透明对比与官方入口核验`,
    explore: `浏览 ${directoryStats.total} 家平台黄页 ↓`,
    pills: [`${directoryStats.cex} 家主流 CEX`, `${directoryStats.dex} 家去中心化 DEX`, `${directoryStats.perpDex} 家链上永续 Perp DEX`],
    metricValue: `${directoryStats.total} 家`,
    metricSub: `${directoryStats.cex} CEX · ${directoryStats.dex} DEX · ${directoryStats.perpDex} Perp DEX`,
    verifiedStatus: `✓ ${directoryStats.total} 家平台来源已登记，条件仍按页面逐项核对`,
  },
  "zh-Hant": {
    badge: `全球 ${directoryStats.total} 家加密平台官方核驗 · 費率透明 · 儲備金透視`,
    title: `全球 ${directoryStats.total} 家主流交易平台透明對比與官方入口核驗`,
    explore: `瀏覽 ${directoryStats.total} 家平台黃頁 ↓`,
    pills: [`${directoryStats.cex} 家主流 CEX`, `${directoryStats.dex} 家去中心化 DEX`, `${directoryStats.perpDex} 家鏈上永續 Perp DEX`],
    metricValue: `${directoryStats.total} 家`,
    metricSub: `${directoryStats.cex} CEX · ${directoryStats.dex} DEX · ${directoryStats.perpDex} Perp DEX`,
    verifiedStatus: `✓ ${directoryStats.total} 家平台來源已登記，條件仍按頁面逐項核對`,
  },
  en: {
    badge: `Verified Crypto Platforms Directory · ${directoryStats.total} Venues · Zero Custody`,
    title: `Independent comparison of ${directoryStats.total} global platforms: published terms, sources and official routes`,
    pills: [`${directoryStats.cex} Flagship CEXs`, `${directoryStats.dex} On-chain DEXs`, `${directoryStats.perpDex} High-speed Perp DEXs`],
    metricValue: `${directoryStats.total} Venues`,
    metricSub: `${directoryStats.cex} CEX · ${directoryStats.dex} DEX · ${directoryStats.perpDex} Perp DEX`,
    verifiedStatus: `✓ ${directoryStats.total} venue sources listed; conditions remain item-level`,
  },
  "pt-BR": {
    badge: `Diretório independente de plataformas cripto · ${directoryStats.total} plataformas · sem custódia`,
    title: `Comparação independente de ${directoryStats.total} plataformas globais: termos publicados e canais oficiais`,
    pills: [`${directoryStats.cex} CEX principais`, `${directoryStats.dex} DEX on-chain`, `${directoryStats.perpDex} DEX perp de alta velocidade`],
    metricValue: `${directoryStats.total} plataformas`,
    metricSub: `${directoryStats.cex} CEX · ${directoryStats.dex} DEX · ${directoryStats.perpDex} Perp DEX`,
    verifiedStatus: `✓ Fontes de ${directoryStats.total} plataformas listadas; condições verificadas por item`,
  },
  ja: {
    badge: `確認済み暗号資産プラットフォーム一覧 · ${directoryStats.total}サービス · 資産保管なし`,
    title: `世界${directoryStats.total}のプラットフォームを比較：公開条件、出典、公式導線`,
    pills: [`主要CEX ${directoryStats.cex}サービス`, `オンチェーンDEX ${directoryStats.dex}サービス`, `高速Perp DEX ${directoryStats.perpDex}サービス`],
    metricValue: `${directoryStats.total}サービス`,
    metricSub: `CEX ${directoryStats.cex} · DEX ${directoryStats.dex} · Perp DEX ${directoryStats.perpDex}`,
    verifiedStatus: `✓ ${directoryStats.total}サービスの出典を掲載。条件は各ページで確認`,
  },
};

function withDirectoryCounts(ui, locale) {
  const countCopy = directoryCountCopy[locale] || directoryCountCopy.en;
  const metrics = ui.telemetry?.metrics?.map((metric, index) => index === 0
    ? { ...metric, val: countCopy.metricValue, sub: countCopy.metricSub }
    : metric);
  const pills = ui.pills?.map((pill, index) => index < 3 ? { ...pill, text: countCopy.pills[index] } : pill);
  return {
    ...ui,
    badge: countCopy.badge || ui.badge,
    title: homeHeroH1(locale),
    explore: countCopy.explore || ui.explore,
    pills,
    telemetry: {
      ...ui.telemetry,
      metrics,
      verifiedStatus: countCopy.verifiedStatus || ui.telemetry?.verifiedStatus,
    },
  };
}

const TELEGRAM_CTA_LABELS = {
  en: "Join NexuAlpha Telegram · Rebate Tracking · Safe Onboarding",
  "pt-BR": "Participe do Telegram NexuAlpha · Acompanhe condições · Entrada segura",
  es: "Únete al Telegram de NexuAlpha · Seguimiento de condiciones · Acceso seguro",
  fr: "Rejoindre le Telegram NexuAlpha · Suivi des conditions · Accès sécurisé",
  de: "NexuAlpha auf Telegram beitreten · Bedingungen verfolgen · Sicherer Zugang",
  ar: "انضم إلى Telegram NexuAlpha · تتبع الشروط · دخول آمن",
  id: "Gabung Telegram NexuAlpha · Pantau ketentuan · Akses aman",
  vi: "Tham gia Telegram NexuAlpha · Theo dõi điều kiện · Truy cập an toàn",
  it: "Unisciti al Telegram NexuAlpha · Monitora le condizioni · Accesso sicuro",
};

const telegramCtaLabel = (locale) => {
  if (locale === "zh-Hans" || locale === "zh-CN") return "加入 NexuAlpha TG 社群 · 返佣追踪 · 0 钓鱼开户";
  if (locale === "zh-Hant" || locale === "zh-TW") return "加入 NexuAlpha TG 社群 · 返佣追蹤 · 0 釣魚開戶";
  if (locale === "ja") return "NexuAlpha Telegram に参加 · 条件追跡 · 安全な導線";
  if (locale === "ko") return "NexuAlpha Telegram 참여 · 조건 추적 · 안전한 안내";
  if (locale === "tr") return "NexuAlpha Telegram'a katıl · Koşul takibi · Güvenli yönlendirme";
  if (locale === "ru") return "Telegram NexuAlpha · Отслеживание условий · Безопасный переход";
  return TELEGRAM_CTA_LABELS[locale] || TELEGRAM_CTA_LABELS.en;
};


/* ── 示例决策路径（按语言隔离，不代表实时用户事件） ── */
const SOCIAL_PROOFS_ZH_HANS = [
  { flag: "🇨🇳", action: "示例路径：先核对 OKX 官方开户条件与用户权益" },
  { flag: "🇸🇬", action: "研究路径：核对 Binance 官方储备金与域名白名单" },
  { flag: "🇺🇸", action: "研究路径：比较 Hyperliquid 的公开费率与执行条件" },
  { flag: "🇭🇰", action: "示例路径：核对 HashKey / Bybit 的地区准入条件" },
  { flag: "🇦🇺", action: "研究路径：在 Telegram 获取费率状态与来源链接" },
  { flag: "🇨🇳", action: "示例路径：比较 Gate / Bitget 官方费率阶梯" },
];

const SOCIAL_PROOFS_ZH_HANT = [
  { flag: "🇭🇰", action: "示例路徑：先核對 OKX 官方開戶條件與用戶權益" },
  { flag: "🇹🇼", action: "研究路徑：核對 Binance 官方儲備金與網域白名單" },
  { flag: "🇸🇬", action: "研究路徑：比較 Hyperliquid 公開費率與執行條件" },
  { flag: "🇭🇰", action: "示例路徑：核對 HashKey 的地區准入條件" },
  { flag: "🇦🇺", action: "研究路徑：在 Telegram 查看費率狀態與來源連結" },
  { flag: "🇹🇼", action: "示例路徑：比較 Bybit 官方費率階梯" },
];

const SOCIAL_PROOFS_EN = [
  { flag: "🇺🇸", action: "Example path: verify Hyperliquid public fees and execution terms" },
  { flag: "🇸🇬", action: "Research path: verify Binance PoR and official domain" },
  { flag: "🇬🇧", action: "Example path: compare Bybit API access and fee terms" },
  { flag: "🇦🇺", action: "Research path: monitor fee status and sources in Telegram" },
  { flag: "🇩🇪", action: "Example path: verify GMX maker-fee terms before trading" },
  { flag: "🇳🇱", action: "Research path: review custody model and Uniswap route" },
];

const SOCIAL_PROOFS_JA = [
  { flag: "🇯🇵", action: "例：Hyperliquid の公開手数料と約定条件を確認" },
  { flag: "🇸🇬", action: "調査：Binance の準備金と公式ドメインを確認" },
  { flag: "🇦🇺", action: "例：Bybit の API 利用条件と手数料を比較" },
  { flag: "🇩🇪", action: "調査：Telegram で手数料の状態と出典を確認" },
  { flag: "🇯🇵", action: "例：GMX のメーカー手数料条件を確認" },
  { flag: "🇳🇱", action: "調査：カストディモデルと Uniswap の経路を確認" },
];

const SOCIAL_PROOFS_KO = [
  { flag: "🇰🇷", action: "예시 경로: Hyperliquid 공개 수수료와 체결 조건 확인" },
  { flag: "🇸🇬", action: "조사 경로: Binance 준비금과 공식 도메인 확인" },
  { flag: "🇦🇺", action: "예시 경로: Bybit API 이용 조건과 수수료 비교" },
  { flag: "🇩🇪", action: "조사 경로: Telegram에서 수수료 상태와 출처 확인" },
  { flag: "🇰🇷", action: "예시 경로: GMX 메이커 수수료 조건 확인" },
  { flag: "🇳🇱", action: "조사 경로: 보관 모델과 Uniswap 경로 검토" },
];

const SOCIAL_PROOFS_TR = [
  { flag: "🇹🇷", action: "Örnek yol: Hyperliquid yayınlanan ücret ve işlem koşullarını doğrula" },
  { flag: "🇸🇬", action: "Araştırma yolu: Binance rezervlerini ve resmi alan adını doğrula" },
  { flag: "🇬🇧", action: "Örnek yol: Bybit API erişimi ve ücret koşullarını karşılaştır" },
  { flag: "🇩🇪", action: "Araştırma yolu: Telegram'da ücret durumunu ve kaynakları izle" },
  { flag: "🇹🇷", action: "Örnek yol: GMX maker ücret koşullarını doğrula" },
  { flag: "🇳🇱", action: "Araştırma yolu: saklama modelini ve Uniswap rotasını incele" },
];

const uiText = {
  "zh-Hans": {
    badge: `全球 ${directoryStats.total} 家加密平台官方核验 · 费率透明 · 储备金透视`,
    title: `全球 ${directoryStats.total} 家主流交易平台透明对比与官方入口核验`,
    subtitle: "公开费率与储备金来源对比 · 用户权益按官方条款核验 · 官方域名防钓鱼。一站式对比 Binance、OKX 等主流 CEX 与 Hyperliquid、Uniswap 等去中心化协议。",
    explore: `浏览 ${directoryStats.total} 家平台黄页 ↓`,
    compare: "平台横向对比 →",
    wizardBtn: "30 秒智能选所向导",
    intentDirect: "我已选好平台",
    intentCompare: "帮我比较平台",
    decisionTitle: "直接选择平台开户，或先对比两家",
    decisionLead: "选平台后直接开户；没决定先看两家对比。",
    searchLabel: "常用合作平台",
    searchPlaceholder: "搜索 Binance / OKX / Bybit / Bitget / Gate / MEXC",
    selectedBenefit: "用户权益",
    referralCode: "专属码",
    noCode: "无需邀请码",
    feeLabel: "现货费率",
    kycLabel: "KYC",
    openRegister: "打开注册链接",
    reviewTerms: "先查看官方条件",
    openDetail: "查看平台注册条件",
    comparePair: "打开两家对比",
    allVenues: "查看全部平台",
    routeFacts: "展开费率、KYC 与邀请码信息",
    pills: [
      { text: `${directoryStats.cex} 家主流 CEX`, href: "#exchanges" },
      { text: `${directoryStats.dex} 家去中心化 DEX`, href: "#exchanges" },
      { text: `${directoryStats.perpDex} 家链上永续 Perp DEX`, href: "#exchanges" },
      { text: "查阅官方域名入口", href: "/exchanges" },
      { text: "透明返佣披露", href: "#bleed-analyzer" }
    ],
    telemetry: {
      header: "NexuAlpha 聚合核验引擎",
      status: "来源状态可用",
      metrics: [
        { label: "已核验入驻平台", val: `${directoryStats.total} 家`, sub: `${directoryStats.cex} CEX · ${directoryStats.dex} DEX · ${directoryStats.perpDex} Perp DEX`, highlight: "blue", href: "#exchanges" },
        { label: "资产托管风险", val: "$0 零托管", sub: "纯聚合黄页，不托管任何用户资产", highlight: "green", href: "#policy" },
        { label: "官方域名入口", val: "来源核验", sub: "进入官方域名与防钓鱼核对路径", highlight: "purple", href: "/exchanges" },
        { label: "用户手续费权益", val: "平台独立配置", sub: "每家交易所使用自己的邀请码与入口", highlight: "gold", href: "#bleed-analyzer" },
      ],
      copiedCode: "已复制邀请码！",
      copyPrompt: "点击复制所选平台邀请码",
      verifiedStatus: `✓ ${directoryStats.total} 家平台来源已登记，条件仍按页面逐项核对`,
    }
  },
  "zh-Hant": {
    badge: `全球 ${directoryStats.total} 家加密平台官方核驗 · 費率透明 · 儲備金透視`,
    title: `全球 ${directoryStats.total} 家主流交易平台透明對比與官方入口核驗`,
    subtitle: "公開費率與儲備金來源對比 · 用戶權益按官方條款核驗 · 官方網域防釣魚。一站式對比 Binance、OKX 等主流 CEX 與 Hyperliquid、Uniswap 等去中心化協議。",
    explore: `瀏覽 ${directoryStats.total} 家平台黃頁 ↓`,
    compare: "平台橫向對比 →",
    wizardBtn: "30 秒智能選所嚮導",
    intentDirect: "我已選好平台",
    intentCompare: "幫我比較平台",
    decisionTitle: "直接選擇平台開戶，或先對比兩家",
    decisionLead: "選平台後直接開戶；沒決定先看兩家對比。",
    searchLabel: "常用合作平台",
    searchPlaceholder: "搜尋 Binance / OKX / Bybit / Bitget / Gate / MEXC",
    selectedBenefit: "用戶權益",
    referralCode: "專屬碼",
    noCode: "無需邀請碼",
    feeLabel: "現貨費率",
    kycLabel: "KYC",
    openRegister: "開啟註冊連結",
    reviewTerms: "先查看官方條件",
    openDetail: "查看平台註冊條件",
    comparePair: "打開兩家對比",
    allVenues: "查看全部平台",
    routeFacts: "展開費率、KYC 與邀請碼資訊",
    pills: [
      { text: `${directoryStats.cex} 家主流 CEX`, href: "#exchanges" },
      { text: `${directoryStats.dex} 家去中心化 DEX`, href: "#exchanges" },
      { text: `${directoryStats.perpDex} 家鏈上永續 Perp DEX`, href: "#exchanges" },
      { text: "查閱官方網域入口", href: "/exchanges" },
      { text: "透明返佣披露", href: "#bleed-analyzer" }
    ],
    telemetry: {
      header: "NexuAlpha 聚合核驗引擎",
      status: "來源狀態可用",
      metrics: [
        { label: "已核驗入駐平台", val: `${directoryStats.total} 家`, sub: `${directoryStats.cex} CEX · ${directoryStats.dex} DEX · ${directoryStats.perpDex} Perp DEX`, highlight: "blue", href: "#exchanges" },
        { label: "資產託管風險", val: "$0 零託管", sub: "純聚合黃頁，不託管任何用戶資產", highlight: "green", href: "#policy" },
        { label: "官方網域入口", val: "來源核對", sub: "進入官方網域與防釣魚核對路徑", highlight: "purple", href: "/exchanges" },
        { label: "用戶手續費權益", val: "平台獨立配置", sub: "每家交易所使用自己的邀請碼與入口", highlight: "gold", href: "#bleed-analyzer" },
      ],
      copiedCode: "已複製邀請碼！",
      copyPrompt: "點擊複製所選平台邀請碼",
      verifiedStatus: `✓ ${directoryStats.total} 家平台来源已登记，条件仍按页面逐项核对`,
    }
  },
  en: {
    badge: `Verified Crypto Platforms Directory · ${directoryStats.total} Venues · Zero Custody`,
    title: `Independent comparison of ${directoryStats.total} global platforms: published terms, sources and official routes`,
    subtitle: "Compare published fee sources, reserve disclosures and official-domain routes across Binance, OKX, Bybit and DEXes such as Hyperliquid and Uniswap. User benefits remain subject to official terms.",
    explore: "Browse Yellow Pages ↓",
    compare: "Compare Platforms →",
    wizardBtn: "30s Matcher Wizard",
    intentDirect: "I already chose a platform",
    intentCompare: "Help me compare platforms",
    decisionTitle: "Pick a platform now, or compare two first",
    decisionLead: "Select a platform to register, or compare two first.",
    searchLabel: "Common partner platforms",
    searchPlaceholder: "Search Binance / OKX / Bybit / Bitget / Gate / MEXC",
    selectedBenefit: "User benefit",
    referralCode: "Code",
    noCode: "No invite code",
    feeLabel: "Spot fee",
    kycLabel: "KYC",
    openRegister: "Open registration link",
    reviewTerms: "Review official terms first",
    openDetail: "Review Account Conditions",
    comparePair: "Open comparison",
    allVenues: "View all venues",
    routeFacts: "Review fee, KYC and code details",
    pills: [
      { text: `${directoryStats.cex} Flagship CEXs`, href: "#exchanges" },
      { text: `${directoryStats.dex} On-chain DEXs`, href: "#exchanges" },
      { text: `${directoryStats.perpDex} High-speed Perp DEXs`, href: "#exchanges" },
      { text: "Official Domain Directory", href: "/exchanges" },
      { text: "Affiliate disclosure", href: "/methodology#disclosure" }
    ],
    telemetry: {
      header: "NexuAlpha Source Directory",
      status: "SOURCE STATUS AVAILABLE",
      metrics: [
        { label: "Indexed & Verified Venues", val: `${directoryStats.total} Venues`, sub: `${directoryStats.cex} CEX · ${directoryStats.dex} DEX · ${directoryStats.perpDex} Perp DEX`, highlight: "blue", href: "#exchanges" },
        { label: "Custody Asset Risk", val: "$0 Zero-Custody", sub: "Pure yellow pages routing, no private keys", highlight: "green", href: "#policy" },
        { label: "Official Domain Directory", val: "Source-reviewed routes", sub: "Review the official domain and anti-phishing path", highlight: "purple", href: "/exchanges" },
        { label: "User Fee Benefits", val: "Per-platform terms", sub: "Each exchange keeps its own code and route", highlight: "gold", href: "#bleed-analyzer" },
      ],
      copiedCode: "Copied Referral Code!",
      copyPrompt: "Click to copy selected platform code",
      verifiedStatus: `✓ ${directoryStats.total} venue sources listed; conditions remain item-level`,
    }
  },
};

const PT_BR_UI = {
  ...uiText.en,
  badge: `Diretório independente de plataformas cripto · ${directoryStats.total} plataformas · sem custódia`,
  title: `Comparação independente de ${directoryStats.total} plataformas globais: termos publicados e canais oficiais`,
  subtitle: "Compare fontes de taxas, informações de reservas e domínios oficiais de Binance, OKX, Bybit e protocolos como Hyperliquid e Uniswap. Benefícios dependem dos termos oficiais.",
  explore: "Ver diretório de plataformas ↓",
  compare: "Comparar plataformas →",
  wizardBtn: "Assistente de escolha em 30 s",
  intentDirect: "Já escolhi uma plataforma",
  intentCompare: "Ajude-me a comparar plataformas",
  decisionTitle: "Escolha uma plataforma ou compare duas primeiro",
  decisionLead: "Selecione uma plataforma para revisar o cadastro ou compare duas antes.",
  searchLabel: "Plataformas parceiras comuns",
  searchPlaceholder: "Pesquisar Binance / OKX / Bybit / Bitget / Gate / MEXC",
  selectedBenefit: "Benefício do usuário",
  referralCode: "Código",
  noCode: "Sem código de convite",
  feeLabel: "Taxa spot",
  kycLabel: "KYC",
  openRegister: "Abrir link de cadastro",
  reviewTerms: "Revisar os termos oficiais primeiro",
  openDetail: "Ver condições da conta",
  comparePair: "Abrir comparação",
  allVenues: "Ver todas as plataformas",
  routeFacts: "Ver taxas, KYC e detalhes do código",
  pills: [
    { text: `${directoryStats.cex} CEX principais`, href: "#exchanges" },
    { text: `${directoryStats.dex} DEX on-chain`, href: "#exchanges" },
    { text: `${directoryStats.perpDex} DEX perp de alta velocidade`, href: "#exchanges" },
    { text: "Diretório de domínios oficiais", href: "/exchanges" },
    { text: "Divulgação de afiliação", href: "/methodology#disclosure" }
  ],
  telemetry: {
    ...uiText.en.telemetry,
    header: "Diretório de fontes NexuAlpha",
    status: "STATUS DAS FONTES DISPONÍVEL",
    metrics: [
      { label: "Plataformas listadas", val: `${directoryStats.total} plataformas`, sub: `${directoryStats.cex} CEX · ${directoryStats.dex} DEX · ${directoryStats.perpDex} Perp DEX`, highlight: "blue", href: "#exchanges" },
      { label: "Risco de custódia", val: "$0 sem custódia", sub: "Diretório informativo, sem chaves privadas", highlight: "green", href: "#policy" },
      { label: "Domínios oficiais", val: "Rotas revisadas", sub: "Confira o domínio oficial e o caminho anti-phishing", highlight: "purple", href: "/exchanges" },
      { label: "Benefícios de taxas", val: "Termos por plataforma", sub: "Cada exchange mantém seu próprio código e rota", highlight: "gold", href: "#bleed-analyzer" }
    ],
    copiedCode: "Código de indicação copiado!",
    copyPrompt: "Clique para copiar o código da plataforma",
    verifiedStatus: `✓ Fontes de ${directoryStats.total} plataformas listadas; condições verificadas por item`
  }
};

const JA_UI = {
  ...uiText.en,
  badge: `確認済み暗号資産プラットフォーム一覧 · ${directoryStats.total}サービス · 資産保管なし`,
  title: `世界${directoryStats.total}のプラットフォームを比較：公開条件、出典、公式導線`,
  subtitle: "Binance、OKX、Bybit、Hyperliquid、Uniswap などの公開手数料、準備金情報、公式ドメインを比較します。ユーザー向け条件は各公式規約をご確認ください。",
  explore: "プラットフォーム一覧を見る ↓",
  compare: "プラットフォームを比較 →",
  wizardBtn: "30秒プラットフォーム診断",
  intentDirect: "利用先は決まっている",
  intentCompare: "プラットフォームを比較する",
  decisionTitle: "今すぐ選ぶか、先に2つを比較",
  decisionLead: "利用先を選んで公式条件を確認するか、まず2つを比較します。",
  searchLabel: "主な掲載プラットフォーム",
  searchPlaceholder: "Binance / OKX / Bybit / Bitget / Gate / MEXC を検索",
  selectedBenefit: "ユーザー向け条件",
  referralCode: "コード",
  noCode: "招待コードなし",
  feeLabel: "現物手数料",
  kycLabel: "KYC",
  openRegister: "登録リンクを開く",
  reviewTerms: "先に公式条件を確認",
  openDetail: "口座条件を見る",
  comparePair: "比較を開く",
  allVenues: "全プラットフォームを見る",
  routeFacts: "手数料・KYC・コードの詳細を確認",
  pills: [
    { text: `主要CEX ${directoryStats.cex}サービス`, href: "#exchanges" },
    { text: `オンチェーンDEX ${directoryStats.dex}サービス`, href: "#exchanges" },
    { text: `高速Perp DEX ${directoryStats.perpDex}サービス`, href: "#exchanges" },
    { text: "公式ドメイン一覧", href: "/exchanges" },
    { text: "アフィリエイト開示", href: "/methodology#disclosure" },
  ],
  telemetry: {
    header: "NexuAlpha 出典ディレクトリ",
    status: "出典ステータスを表示",
    metrics: [
      { label: "掲載プラットフォーム", val: `${directoryStats.total}サービス`, sub: `CEX ${directoryStats.cex} · DEX ${directoryStats.dex} · Perp DEX ${directoryStats.perpDex}`, highlight: "blue", href: "#exchanges" },
      { label: "資産保管リスク", val: "$0 保管なし", sub: "比較・案内のみ。ユーザー資産を預かりません", highlight: "green", href: "#policy" },
      { label: "公式ドメイン一覧", val: "出典を確認済み", sub: "公式ドメインとフィッシング対策を確認", highlight: "purple", href: "/exchanges" },
      { label: "ユーザー向け手数料条件", val: "サービスごとの規約", sub: "コードと導線はサービスごとに異なります", highlight: "gold", href: "#bleed-analyzer" },
    ],
    copiedCode: "紹介コードをコピーしました",
    copyPrompt: "選択したサービスのコードをコピー",
    verifiedStatus: `✓ ${directoryStats.total}サービスの出典を掲載。条件は各ページで確認`,
  },
};

const KO_UI = {
  ...uiText.en,
  badge: `검증된 암호화폐 플랫폼 디렉터리 · ${directoryStats.total}개 플랫폼 · 자산 보관 없음`,
  title: `${directoryStats.total}개 글로벌 플랫폼 비교: 공개 조건, 출처, 공식 경로`,
  subtitle: "Binance, OKX, Bybit, Hyperliquid, Uniswap 등의 공개 수수료 출처, 준비금 정보, 공식 도메인을 비교합니다. 사용자 혜택은 각 플랫폼의 공식 조건을 확인해야 합니다.",
  explore: "플랫폼 디렉터리 보기 ↓",
  compare: "플랫폼 비교 →",
  wizardBtn: "30초 플랫폼 매칭",
  intentDirect: "이미 플랫폼을 골랐습니다",
  intentCompare: "플랫폼을 먼저 비교하겠습니다",
  decisionTitle: "바로 플랫폼을 고르거나, 먼저 두 곳을 비교하세요",
  decisionLead: "가입 전에 지역, 본인확인, 입금 방식과 공식 조건을 확인하세요.",
  searchLabel: "주요 파트너 플랫폼",
  searchPlaceholder: "Binance / OKX / Bybit / Bitget / Gate / MEXC 검색",
  selectedBenefit: "사용자 혜택 조건",
  referralCode: "코드",
  noCode: "초대 코드 없음",
  feeLabel: "현물 수수료",
  kycLabel: "본인확인",
  openRegister: "가입 링크 열기",
  reviewTerms: "공식 조건 먼저 확인",
  openDetail: "계정 조건 보기",
  comparePair: "비교 열기",
  allVenues: "전체 플랫폼 보기",
  routeFacts: "수수료, 본인확인, 코드 세부 정보 확인",
  pills: [
    { text: `주요 CEX ${directoryStats.cex}개`, href: "#exchanges" },
    { text: `온체인 DEX ${directoryStats.dex}개`, href: "#exchanges" },
    { text: `고속 Perp DEX ${directoryStats.perpDex}개`, href: "#exchanges" },
    { text: "공식 도메인 디렉터리", href: "/exchanges" },
    { text: "제휴 고지", href: "/methodology#disclosure" },
  ],
  telemetry: {
    header: "NexuAlpha 출처 디렉터리",
    status: "출처 상태 표시",
    metrics: [
      { label: "등록 플랫폼", val: `${directoryStats.total}개`, sub: `${directoryStats.cex} CEX · ${directoryStats.dex} DEX · ${directoryStats.perpDex} Perp DEX`, highlight: "blue", href: "#exchanges" },
      { label: "자산 보관 위험", val: "$0 보관 없음", sub: "비교와 안내만 제공하며 사용자 자산을 보관하지 않습니다", highlight: "green", href: "#policy" },
      { label: "공식 도메인", val: "출처 검토됨", sub: "공식 도메인과 피싱 방지 경로를 확인합니다", highlight: "purple", href: "/exchanges" },
      { label: "수수료 혜택 조건", val: "플랫폼별 조건", sub: "각 거래소는 자체 코드와 경로를 사용합니다", highlight: "gold", href: "#bleed-analyzer" },
    ],
    copiedCode: "추천 코드가 복사되었습니다",
    copyPrompt: "선택한 플랫폼 코드를 복사",
    verifiedStatus: `✓ ${directoryStats.total}개 플랫폼 출처가 등록되어 있으며 조건은 각 페이지에서 확인합니다`,
  },
};

const TR_UI = {
  ...uiText.en,
  badge: `Doğrulanmış kripto platform dizini · ${directoryStats.total} platform · saklama yok`,
  title: `${directoryStats.total} global platformu karşılaştır: yayımlanmış koşullar, kaynaklar ve resmi rotalar`,
  subtitle: "Binance, OKX, Bybit, Hyperliquid ve Uniswap gibi platformlarda yayımlanmış ücret kaynaklarını, rezerv bilgilerini ve resmi alan adlarını karşılaştırın. Kullanıcı avantajları resmi koşullara bağlıdır.",
  explore: "Platform dizinine git ↓",
  compare: "Platformları karşılaştır →",
  wizardBtn: "30 sn platform eşleştirici",
  intentDirect: "Platformumu seçtim",
  intentCompare: "Önce platformları karşılaştıracağım",
  decisionTitle: "Platformu şimdi seç veya önce iki platformu karşılaştır",
  decisionLead: "Kayıt öncesi bölge, kimlik doğrulama, para yatırma ve resmi koşulları kontrol edin.",
  searchLabel: "Yaygın partner platformları",
  searchPlaceholder: "Binance / OKX / Bybit / Bitget / Gate / MEXC ara",
  selectedBenefit: "Kullanıcı avantaj koşulu",
  referralCode: "Kod",
  noCode: "Davet kodu yok",
  feeLabel: "Spot ücreti",
  kycLabel: "Kimlik doğrulama",
  openRegister: "Kayıt linkini aç",
  reviewTerms: "Önce resmi koşulları incele",
  openDetail: "Hesap koşullarını gör",
  comparePair: "Karşılaştırmayı aç",
  allVenues: "Tüm platformları gör",
  routeFacts: "Ücret, kimlik doğrulama ve kod detaylarını kontrol et",
  pills: [
    { text: `${directoryStats.cex} ana CEX`, href: "#exchanges" },
    { text: `${directoryStats.dex} on-chain DEX`, href: "#exchanges" },
    { text: `${directoryStats.perpDex} hızlı Perp DEX`, href: "#exchanges" },
    { text: "Resmi alan adı dizini", href: "/exchanges" },
    { text: "Ortaklık açıklaması", href: "/methodology#disclosure" },
  ],
  telemetry: {
    header: "NexuAlpha kaynak dizini",
    status: "Kaynak durumu görüntüleniyor",
    metrics: [
      { label: "Listelenen platformlar", val: `${directoryStats.total} platform`, sub: `${directoryStats.cex} CEX · ${directoryStats.dex} DEX · ${directoryStats.perpDex} Perp DEX`, highlight: "blue", href: "#exchanges" },
      { label: "Varlık saklama riski", val: "$0 saklama yok", sub: "Yalnızca karşılaştırma ve yönlendirme; kullanıcı varlığı tutulmaz", highlight: "green", href: "#policy" },
      { label: "Resmi alan adları", val: "Kaynak incelendi", sub: "Resmi alan adını ve phishing kontrol yolunu inceleyin", highlight: "purple", href: "/exchanges" },
      { label: "Ücret avantajları", val: "Platforma göre koşullar", sub: "Her borsa kendi kodunu ve rotasını kullanır", highlight: "gold", href: "#bleed-analyzer" },
    ],
    copiedCode: "Referans kodu kopyalandı",
    copyPrompt: "Seçilen platform kodunu kopyala",
    verifiedStatus: `✓ ${directoryStats.total} platform kaynağı listelendi; koşullar sayfa bazında kontrol edilir`,
  },
};

const registrationLinkCopy = {
  en: "Open Partner Signup Link",
  "zh-Hans": "打开平台开户链接",
  "zh-Hant": "開啟平台开户連結",
  es: "Abrir registro de socio",
  "pt-BR": "Abrir cadastro parceiro",
  fr: "Ouvrir l’inscription partenaire",
  de: "Partner-Registrierung öffnen",
  ja: "提携登録リンクを開く",
  ko: "파트너 가입 링크 열기",
  ar: "افتح رابط تسجيل الشريك",
  tr: "Partner kayıt bağlantısını aç",
  ru: "Открыть партнерскую регистрацию",
  id: "Buka tautan daftar partner",
  vi: "Mở liên kết đăng ký đối tác",
  it: "Apri registrazione partner",
};

function getUi(locale) {
  const localeBase = String(locale || "en").split("-")[0].toLowerCase();
  if (localeBase === "ja") locale = "ja";
  else if (localeBase === "ko") locale = "ko";
  else if (localeBase === "tr") locale = "tr";
  else if (localeBase === "pt") locale = "pt-BR";
  else if (localeBase === "zh" && /(?:tw|hant)/i.test(String(locale))) locale = "zh-Hant";
  else if (localeBase === "zh") locale = "zh-Hans";
  const registrationCopy = registrationLinkCopy[locale] || registrationLinkCopy.en;
  if (locale === "zh-Hans" || locale === "zh-CN") return withDirectoryCounts({ ...uiText["zh-Hans"], openRegister: registrationCopy }, "zh-Hans");
  if (locale === "zh-Hant" || locale === "zh-TW") return withDirectoryCounts({ ...uiText["zh-Hant"], openRegister: registrationCopy }, "zh-Hant");
  if (locale === "pt-BR") return withDirectoryCounts({ ...PT_BR_UI, openRegister: registrationCopy }, "pt-BR");
  if (locale === "ja") return withDirectoryCounts({ ...JA_UI, openRegister: registrationCopy }, "ja");
  if (locale === "ko") return withDirectoryCounts({ ...KO_UI, openRegister: registrationCopy }, "ko");
  if (locale === "tr") return withDirectoryCounts({ ...TR_UI, openRegister: registrationCopy }, "tr");
  if (locale && locale !== "en") {
    const text = v3Copy(locale);
    const category = text.platformType || text.independent || "Crypto platforms";
    const metrics = [
      { label: text.platformType, val: text.resultVenues?.(directoryStats.total) || String(directoryStats.total), sub: directoryCountCopy.en.metricSub, highlight: "blue", href: "#exchanges" },
      { label: text.accessModel, val: text.noOfficial || "—", sub: text.relationship, highlight: "green", href: "#policy" },
      { label: text.officialDomain, val: text.sourceState, sub: text.researchScope, highlight: "purple", href: "/exchanges" },
      { label: text.partnerState, val: text.notConfigured, sub: text.ctaLocked, highlight: "gold", href: "#bleed-analyzer" },
    ];
    return {
      ...uiText.en,
      badge: text.independent || uiText.en.badge,
      title: homeHeroH1(locale),
      subtitle: text.compareIntro || text.relationship || uiText.en.subtitle,
      explore: text.backToDirectory || uiText.en.explore,
      compare: text.viewCompare || uiText.en.compare,
      wizardBtn: text.funnelTitle || uiText.en.wizardBtn,
      intentDirect: text.openOfficialSource || uiText.en.intentDirect,
      intentCompare: text.deepCompare || uiText.en.intentCompare,
      decisionTitle: text.compareVerdictTitle || uiText.en.decisionTitle,
      decisionLead: text.compareVerdictLead || uiText.en.decisionLead,
      searchLabel: text.platformType || uiText.en.searchLabel,
      searchPlaceholder: text.sourceHost || uiText.en.searchPlaceholder,
      selectedBenefit: text.partnerState || uiText.en.selectedBenefit,
      referralCode: text.partnerState || uiText.en.referralCode,
      openRegister: registrationCopy,
      reviewTerms: text.verifyBefore || uiText.en.reviewTerms,
      openDetail: text.openDetail || uiText.en.openDetail,
      comparePair: text.viewCompare || uiText.en.comparePair,
      allVenues: text.backToDirectory || uiText.en.allVenues,
      routeFacts: text.comparisonMatrix || uiText.en.routeFacts,
      pills: uiText.en.pills.map((pill, index) => ({ ...pill, text: [text.platformType, text.sourceState, text.activityState, text.officialDomain, text.researchScope][index] || pill.text })),
      telemetry: { ...uiText.en.telemetry, header: text.independent || category, status: text.sourceState || uiText.en.telemetry.status, metrics },
    };
  }
  return withDirectoryCounts(uiText.en, "en");
}

function getProofs(locale) {
  if (locale === "zh-Hans" || locale === "zh-CN") return SOCIAL_PROOFS_ZH_HANS;
  if (locale === "zh-Hant" || locale === "zh-TW") return SOCIAL_PROOFS_ZH_HANT;
  if (locale === "ja") return SOCIAL_PROOFS_JA;
  if (locale === "ko") return SOCIAL_PROOFS_KO;
  if (locale === "tr") return SOCIAL_PROOFS_TR;
  return SOCIAL_PROOFS_EN;
}

const priorityVenueSlugs = ["binance", "okx", "bybit", "bitget", "gate-io", "mexc"];
const priorityCompareRoutes = {
  binance: ["binance", "okx"],
  okx: ["binance", "okx"],
  bybit: ["bybit", "bitget"],
  bitget: ["bybit", "bitget"],
};

function isZhLocale(locale) {
  return locale === "zh-Hans" || locale === "zh-CN" || locale === "zh-Hant" || locale === "zh-TW" || String(locale || "").startsWith("zh");
}

function localeHref(locale, href) {
  return localizedHref(href, { locale });
}

function heroPillsForLocale(ui, locale) {
  if (locale !== "ja") return ui.pills;
  return [
    ...ui.pills.slice(0, 4),
    { text: "日本の口座条件", href: "/jp?locale=ja" },
  ];
}

function partnerCard(slug, locale) {
  const publicCta = publicCtaForVenue(slug, locale);
  const db = venueDatabase[slug] || {};
  const zh = isZhLocale(locale);
  if (!publicCta.hasPartnerRoute) return null;
  const benefitVerified = publicCta.benefitVerified;
  const rebatePercent = benefitVerified && publicCta.hasReferral ? publicCta.rebatePercent : null;
  return {
    slug,
    name: publicCta.name || db.name || slug,
    category: db.category || "CEX",
    officialDomain: publicCta.officialDomain || db.officialDomain || "",
    registrationUrl: publicCta.registrationUrl,
    claimStatus: publicCta.claim.status,
    directRoute: publicCta.hasPartnerRoute,
    inviteCode: publicCta.inviteCode,
    hasReferral: publicCta.hasReferral,
    rebatePercent,
    benefit: publicCta.benefit || (zh ? "用户权益待官方核验" : (v3Copy(locale).pendingReview || "User benefits require official verification")),
    fee: db.spotFee?.display && db.feeCheckedAt ? db.spotFee.display : (zh ? "待来源核验" : ({ ja: "出典確認待ち", ko: "출처 확인 대기", tr: "Kaynak doğrulaması bekleniyor", fr: "Vérification de la source en attente", de: "Quellenprüfung ausstehend", ru: "Ожидается проверка источника", ar: "بانتظار التحقق من المصدر", id: "Menunggu verifikasi sumber", vi: "Đang chờ xác minh nguồn", it: "Verifica della fonte in sospeso" }[String(locale || "").split("-")[0]] || "Pending source review")),
    kyc: db.kycCheckedAt
      ? (zh
        ? (db.kycSummary?.[locale] || db.kycSummary?.["zh-Hans"] || "以官方流程为准")
        : (db.kycSummary?.en || db.kycSummary?.[locale] || v3Copy(locale).verifyBefore || "Verify in official flow"))
      : (zh ? "官方流程核验" : (v3Copy(locale).verifyBefore || "Verify in official flow")),
  };
}

const homeModeTaskCopy = Object.freeze({
  "en": {
    "direct": "I’ve chosen",
    "compare": "Compare first"
  },
  "zh-Hans": {
    "direct": "已选平台",
    "compare": "先做比较"
  },
  "zh-Hant": {
    "direct": "已選平台",
    "compare": "先做比較"
  },
  "ja": {
    "direct": "利用先は決定済み",
    "compare": "まず比較"
  },
  "ko": {
    "direct": "플랫폼 선택 완료",
    "compare": "먼저 비교"
  },
  "tr": {
    "direct": "Platformu seçtim",
    "compare": "Önce karşılaştır"
  },
  "es": {
    "direct": "Ya elegí",
    "compare": "Comparar primero"
  },
  "pt-BR": {
    "direct": "Já escolhi",
    "compare": "Comparar primeiro"
  },
  "fr": {
    "direct": "J’ai choisi",
    "compare": "Comparer d’abord"
  },
  "de": {
    "direct": "Bereits gewählt",
    "compare": "Zuerst vergleichen"
  },
  "ru": {
    "direct": "Уже выбрано",
    "compare": "Сначала сравнить"
  },
  "ar": {
    "direct": "اخترت منصة",
    "compare": "المقارنة أولًا"
  },
  "id": {
    "direct": "Sudah memilih",
    "compare": "Bandingkan dulu"
  },
  "vi": {
    "direct": "Đã chọn",
    "compare": "So sánh trước"
  },
  "it": {
    "direct": "Ho già scelto",
    "compare": "Prima confronta"
  }
});

function HomeDecisionPanel({ locale, ui }) {
  const platformChooserTaskCopy = {
    "en": "Change platform",
    "zh-Hans": "更换平台",
    "zh-Hant": "更換平台",
    "ja": "変更",
    "ko": "플랫폼 변경",
    "tr": "Platformu değiştir",
    "es": "Cambiar plataforma",
    "pt-BR": "Trocar plataforma",
    "fr": "Changer de plateforme",
    "de": "Plattform wechseln",
    "ru": "Сменить платформу",
    "ar": "تغيير المنصة",
    "id": "Ganti platform",
    "vi": "Đổi nền tảng",
    "it": "Cambia piattaforma"
  };
  const compactHomeTaskCopy = {
    ru: { change: "Сменить", copy: "Копировать", copyFull: "Скопировать код", signup: "Регистрация ↗" },
    fr: { change: "Changer", copy: "Copier", copyFull: "Copier le code", signup: "Inscription ↗" },
    "pt-BR": { change: "Trocar", copy: "Copiar", copyFull: "Copiar código", signup: "Cadastro ↗" },
    tr: { change: "Değiştir", copy: "Kopyala", copyFull: "Kodu kopyala", signup: "Kayıt ↗" },
    it: { change: "Cambia", copy: "Copia", copyFull: "Copia codice", signup: "Registrazione ↗" },
  };
  const chooserEmptyCopy = {
    en: { noResults: "No matching platform in this shortlist.", clear: "Clear search" },
    "zh-Hans": { noResults: "暂无匹配平台", clear: "清除搜索" },
    "zh-Hant": { noResults: "暫無匹配平台", clear: "清除搜尋" },
    ja: { noResults: "該当するプラットフォームはありません", clear: "検索をクリア" },
    ko: { noResults: "일치하는 플랫폼이 없습니다", clear: "검색 지우기" },
    tr: { noResults: "Eşleşen platform yok", clear: "Aramayı temizle" },
    ar: { noResults: "لا توجد منصة مطابقة", clear: "مسح البحث" },
    es: { noResults: "No hay plataformas coincidentes", clear: "Borrar búsqueda" },
    "pt-BR": { noResults: "Nenhuma plataforma correspondente", clear: "Limpar busca" },
    fr: { noResults: "Aucune plateforme correspondante", clear: "Effacer la recherche" },
    de: { noResults: "Keine passende Plattform", clear: "Suche löschen" },
    ru: { noResults: "Нет совпадающих платформ", clear: "Очистить поиск" },
    id: { noResults: "Tidak ada platform yang cocok", clear: "Hapus pencarian" },
    vi: { noResults: "Không có nền tảng phù hợp", clear: "Xóa tìm kiếm" },
    it: { noResults: "Nessuna piattaforma corrispondente", clear: "Cancella ricerca" },
  };
  const localeBase = String(locale || "en").split("-")[0];
  const modeTaskCopy = homeModeTaskCopy[locale] || homeModeTaskCopy[localeBase] || homeModeTaskCopy.en;
  const compactHomeTask = compactHomeTaskCopy[locale] || compactHomeTaskCopy[localeBase];
  const chooserEmpty = chooserEmptyCopy[locale] || chooserEmptyCopy[localeBase] || chooserEmptyCopy.en;
  const fullChooserTaskLabel = platformChooserTaskCopy[locale] || platformChooserTaskCopy[localeBase] || platformChooserTaskCopy.en;
  const chooserTaskLabel = compactHomeTask?.change || fullChooserTaskLabel;
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState(priorityVenueSlugs[0]);
  const [activeIntent, setActiveIntent] = useState("direct");
  const [chooserOpen, setChooserOpen] = useState(false);
  const chooserSummaryRef = useRef(null);
  const chooserSearchRef = useRef(null);
  const venues = priorityVenueSlugs.map((slug) => partnerCard(slug, locale)).filter(Boolean);
  const selected = venues.find((venue) => venue.slug === selectedSlug) || venues[0];
  const chooserSummaryAriaLabel = locale === "ja" ? `${selected.name}、プラットフォームを変更` : compactHomeTask ? `${selected.name}: ${fullChooserTaskLabel}` : undefined;
  const compactCopyLabel = locale === "ja" ? "コピー" : compactHomeTask?.copy;
  const compactCopyAriaLabel = locale === "ja" ? "コードをコピー" : compactHomeTask?.copyFull;
  const zh = isZhLocale(locale);
  const [compareLeftSlug, compareRightSlug] = priorityCompareRoutes[selected.slug] || ["binance", selected.slug];
  const compareLeft = venues.find((venue) => venue.slug === compareLeftSlug);
  const compareRight = venues.find((venue) => venue.slug === compareRightSlug);
  const contextParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const contextMarket = contextParams?.get("market") || undefined;
  const contextProduct = contextParams?.get("product") || (selected.category === "Perp DEX" ? "perpetuals" : "spot");
  const contextAccountStage = contextParams?.get("account_stage") || contextParams?.get("accountStage") || undefined;
  const contextFunding = contextParams?.get("funding") || undefined;
  const dynamicComparePath = `/compare/${compareLeftSlug}-vs-${compareRightSlug}`;
  const compareHref = contextualHref(dynamicComparePath, { locale, market: contextMarket, product: contextProduct });
  const compareLabel = `${compareLeft?.name || compareLeftSlug} vs ${compareRight?.name || compareRightSlug}`;
  const staticComparePaths = ["/compare/binance-vs-okx", "/compare/bybit-vs-bitget"];
  const filtered = venues.filter((venue) => {
    const haystack = `${venue.name} ${venue.slug} ${venue.category}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });
  const hasChooserQuery = query.trim().length > 0;
  const visibleVenueOptions = (hasChooserQuery ? filtered : venues).slice(0, hasChooserQuery ? 6 : 4);
  const selectVenue = (slug) => {
    setSelectedSlug(slug);
    setChooserOpen(false);
    chooserSummaryRef.current?.focus?.();
  };
  const clearChooserSearch = () => {
    setQuery("");
    chooserSearchRef.current?.focus?.();
  };

  return (
    <aside className="growth-decision-panel" aria-label={ui.decisionTitle}>

      <div className="growth-intent-switch" role="group" aria-label={ui.decisionTitle}>
        <button
          type="button"
          className={activeIntent === "direct" ? "is-active" : ""}
          aria-pressed={activeIntent === "direct"}
          onClick={() => setActiveIntent("direct")}
          data-growth-decision="known_platform"
          data-growth-placement="home-intent-switch"
          data-growth-product={contextProduct}
        >
          <span aria-hidden="true">1</span>
          {modeTaskCopy.direct}
        </button>
        <button
          type="button"
          className={activeIntent === "compare" ? "is-active" : ""}
          aria-pressed={activeIntent === "compare"}
          onClick={() => setActiveIntent("compare")}
          data-growth-decision="compare_first"
          data-growth-placement="home-intent-switch"
          data-growth-product={contextProduct}
        >
          <span aria-hidden="true">2</span>
          {modeTaskCopy.compare}
        </button>
      </div>

      {activeIntent === "compare" ? (
        <section className="growth-compare-shortcuts" aria-label={ui.intentCompare}>
          <div className="growth-compare-shortcuts__links">
            <a href={contextualHref("/compare/binance-vs-okx", { locale, market: contextMarket, product: contextProduct })} data-growth-decision="comparison" data-growth-placement="home-compare-shortcut" data-growth-product="spot">{ui.comparePair}: Binance vs OKX</a>
            <a href={contextualHref("/compare/bybit-vs-bitget", { locale, market: contextMarket, product: contextProduct })} data-growth-decision="comparison" data-growth-placement="home-compare-shortcut" data-growth-product="spot">{ui.comparePair}: Bybit vs Bitget</a>
            {!staticComparePaths.includes(dynamicComparePath) && (
              <a href={compareHref} data-growth-decision="dynamic_comparison" data-growth-placement="home-compare-shortcut" data-growth-product={contextProduct}>{ui.comparePair}: {compareLabel}</a>
            )}
            <a href={contextualHref("/exchanges", { locale, market: contextMarket, product: contextProduct })} data-growth-decision="venue_directory" data-growth-placement="home-compare-shortcut" data-growth-product={contextProduct}>{ui.allVenues}</a>
          </div>
        </section>
      ) : (
        <>
          <div className="growth-direct-workbench">
            <details
              className="growth-platform-chooser"
              open={chooserOpen}
              onToggle={(event) => setChooserOpen(event.currentTarget.open)}
            >
              <summary className="growth-platform-chooser__summary" aria-label={chooserSummaryAriaLabel} ref={chooserSummaryRef}>
                <span className="growth-platform-chooser__identity">
                  <BrandMark slug={selected.slug} priority />
                  <strong translate="no" lang="en" dir="ltr">{selected.name}</strong>
                </span>
                <span className="growth-platform-chooser__change">{chooserTaskLabel}</span>
              </summary>
              <div className="growth-platform-chooser__body">
                <label className="growth-platform-search">
                  <span>{ui.searchLabel}</span>
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    ref={chooserSearchRef}
                    placeholder={ui.searchPlaceholder}
                    autoComplete="off"
                  />
                </label>
                {visibleVenueOptions.length > 0 ? (
                  <ul className="growth-platform-list" aria-label={ui.searchLabel}>
                    {visibleVenueOptions.map((venue) => (
                      <li key={venue.slug}>
                        <button
                          type="button"
                          className={`growth-platform-option${venue.slug === selected.slug ? " is-selected" : ""}`}
                          onClick={() => selectVenue(venue.slug)}
                          aria-pressed={venue.slug === selected.slug}
                          data-growth-decision={venue.slug}
                          data-growth-placement="home-platform-selector"
                          data-growth-product={venue.category === "Perp DEX" ? "perpetuals" : "spot"}
                        >
                          <BrandMark slug={venue.slug} compact priority />
                          <span>
                            <b translate="no" lang="en" dir="ltr">{venue.name}</b>
                            <small>{venue.category}{venue.officialDomain ? ` · ${venue.officialDomain}` : ""}</small>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="growth-platform-empty" role="status">
                    <p>{chooserEmpty.noResults}</p>
                    <button type="button" className="growth-platform-empty__clear" onClick={clearChooserSearch}>{chooserEmpty.clear}</button>
                  </div>
                )}
              </div>
            </details>

            <div className="growth-selected-route">
              <div
                className="growth-selected-route__registration"
                data-r37-cro="home-partner-route-nudge"
                data-r37-platform={selected.slug}
                data-r37-has-code={selected.inviteCode ? "true" : "false"}
                data-r37-primary-label="Open route and confirm code"
                data-cta-placement="home-decision-panel"
              >
                <RegistrationCard
                  venueSlug={selected.slug}
                  fallbackDomain={selected.officialDomain}
                  locale={locale}
                  market={contextMarket}
                  product={contextProduct}
                  accountStage={contextAccountStage}
                  funding={contextFunding}
                  compact
                  compactCopyLabel={compactCopyLabel}
                  compactCopyAriaLabel={compactCopyAriaLabel}
                  compactSignupLabel={compactHomeTask?.signup}
                  homeCodeIdentity
                />
              </div>
            </div>

          </div>
        </>
      )}
    </aside>
  );
}

export function LeanHero({ locale = "en" }) {
  const ui = getUi(locale);
  const heroPills = heroPillsForLocale(ui, locale);
  const proofs = getProofs(locale);
  const [wizardOpen, setWizardOpen] = useState(false);
  const closeWizard = useCallback(() => setWizardOpen(false), []);
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const secondaryToggleRef = useRef(null);

  const [proofIdx, setProofIdx] = useState(0);
  const [proofVisible, setProofVisible] = useState(true);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Match the CSS visibility of the secondary example exactly.
    const hiddenExampleLayout = window.matchMedia("(max-width: 640px)");
    let interval = null;
    let timeout = null;
    let active = true;
    const stop = () => {
      clearInterval(interval);
      clearTimeout(timeout);
      interval = null;
      timeout = null;
    };
    const sync = () => {
      stop();
      setProofVisible(true);
      if (motionPreference.matches) {
        setProofIdx(0);
        return;
      }
      if (!secondaryOpen || hiddenExampleLayout.matches || document.hidden || proofs.length < 2) return;
      interval = setInterval(() => {
        setProofVisible(false);
        timeout = setTimeout(() => {
          timeout = null;
          if (!active || hiddenExampleLayout.matches || document.hidden || motionPreference.matches) return;
          setProofIdx(i => (i + 1) % proofs.length);
          setProofVisible(true);
        }, 400);
      }, 4200);
    };
    motionPreference.addEventListener("change", sync);
    hiddenExampleLayout.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      active = false;
      stop();
      motionPreference.removeEventListener("change", sync);
      hiddenExampleLayout.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [proofs.length, secondaryOpen]);

  const proof = proofs[proofIdx % proofs.length];
  const telegramParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const telegramHref = getTelegramDeepLink({
    action: "compare",
    pair: "binance-vs-okx",
    market: telegramParams?.get("market") || undefined,
    locale,
    product: telegramParams?.get("product") || "spot",
  });

  return (
    <section className="lean-hero">
      <div className="lean-hero__container v2-shell">
        <div className="lean-hero__content">
          <div className="lean-hero__badge">
            <span className="lean-hero__badge-dot" aria-hidden="true"></span>
            <span>{ui.badge}</span>
          </div>

          <h1 className="lean-hero__title">
            {ui.title}
          </h1>


        </div>

        <div className="lean-hero__telemetry">
          <HomeDecisionPanel locale={locale} ui={ui} />
        </div>
        <div className="lean-hero__secondary" data-open={secondaryOpen}>
          <button type="button" className="lean-hero__secondary-toggle" ref={secondaryToggleRef} aria-expanded={secondaryOpen} aria-controls="lean-hero-support" onClick={() => setSecondaryOpen(open => !open)}>{({"en": "Platform selection help", "zh-Hans": "选所辅助", "zh-Hant": "選所輔助", "ja": "取引所選びのサポート", "ko": "거래소 선택 도움", "tr": "Platform seçimi desteği", "ar": "مساعدة في اختيار المنصة", "es": "Ayuda para elegir plataforma", "pt-BR": "Ajuda para escolher a plataforma", "fr": "Aide au choix de plateforme", "de": "Hilfe bei der Plattformwahl", "ru": "Помощь в выборе платформы", "id": "Bantuan memilih platform", "vi": "Hỗ trợ chọn nền tảng", "it": "Aiuto nella scelta della piattaforma"})[locale] || "Platform selection help"}</button>
          <div className="lean-hero__secondary-body lean-hero__research" id="lean-hero-research" onBlurCapture={(event) => {
            const toggle = secondaryToggleRef.current;
            if (event.relatedTarget === null && event.currentTarget.getClientRects().length === 0 && toggle?.getClientRects().length > 0) {
              toggle.focus({ preventScroll: true });
            }
          }}>
            <p className="lean-hero__subtitle">
              {ui.subtitle}
            </p>

            <div className="lean-hero__actions">
              <button
                type="button"
                className="lean-hero__btn-wizard"
                onClick={() => setWizardOpen(true)}
              >
                {ui.wizardBtn}
              </button>
              <a href={localeHref(locale, "#exchanges")} className="lean-hero__btn-primary">
                {ui.explore}
              </a>
              <a href={localeHref(locale, "#compare")} className="lean-hero__btn-secondary">
                {ui.compare}
              </a>
            </div>

          </div>
          <div className="lean-hero__secondary-body lean-hero__support" id="lean-hero-support">
            <section className="lean-hero__decision-help" aria-label={ui.decisionTitle}>
              <h2>{ui.decisionTitle}</h2>
              <p>{ui.decisionLead}</p>
            </section>
            {/* Telegram 生态入口 CTA */}
            <a
              className="lean-hero__tg-cta"
              href={telegramHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className="lean-hero__tg-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.504-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span className="lean-hero__tg-label">
                {telegramCtaLabel(locale)}
              </span>
              <span className="lean-hero__tg-arrow" aria-hidden="true">↗</span>
            </a>

            {/* 示例决策路径提示 */}
            <div className="lean-hero__social-proof" aria-live="polite" aria-atomic="true">
              <span
                className={`lean-hero__social-proof-inner ${proofVisible ? "is-visible" : "is-hidden"}`}
              >
                <span className="lean-hero__proof-flag" aria-hidden="true">{proof.flag}</span>
                <span className="lean-hero__proof-action">{proof.action}</span>
              </span>
            </div>

            <div className="lean-hero__pill-row">
              {heroPills.map((pill) => (
                <a key={pill.text} href={localeHref(locale, pill.href)} className="lean-hero__pill">
                  {pill.text}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <TraderWizardModal isOpen={wizardOpen} onClose={closeWizard} locale={locale} />
    </section>
  );
}

export default LeanHero;
