import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { FACTBOOK_REGISTRY, FACTBOOK_SLUGS, AUDIT_DATE, AUDIT_DECLARATION, generateLlmMarkdown } from "../../data/factbook-registry.js";
import { neutralVenueCatalog } from "../../data/market-command.js";
import { localizedHref } from "../../data/locale-routing.js";
import { formatPercent } from "../../data/format-percent.js";
import { factbookDates, factbookDatesCopy } from "../../data/factbook-dates.js";
import { CommissionDisclosureLine } from "./CommissionDisclosureLine.jsx";
import { partnerBenefitParts } from "../../data/owner-rebate-line.js";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { bleedCopyFeedback } from "../../data/trading-bleed-copy.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import { DecisionPathRail } from "./DecisionPathRail.jsx";
import "./factbook-page.css";
import { feesCheckedLabel, feesStatusLabel } from "./ExchangeFactsV5.jsx";
import { VenueFeeLedger } from "../v6/InnerLedger.jsx";
import { discountFact, venueCheckedOn } from "../../data/exchange-facts.js";

const factbookRecordCount = FACTBOOK_SLUGS.length;
const comparisonDirectoryCount = neutralVenueCatalog.length;
const factbookOnlyDecisionSlugs = new Set(["htx", "hashkey", "aevo"]);

async function copyFactbookValue(text, setStatus, { revealManual, timeout = 2000, isActive = () => true, scheduleReset } = {}) {
  try {
    if (typeof navigator === "undefined" || typeof navigator.clipboard?.writeText !== "function") throw new Error("CLIPBOARD_UNAVAILABLE");
    await navigator.clipboard.writeText(text);
    if (!isActive()) return;
    setStatus("success");
    if (typeof scheduleReset === "function") {
      scheduleReset(setStatus, timeout);
    } else {
      setTimeout(() => setStatus("idle"), timeout);
    }
  } catch {
    if (!isActive()) return;
    setStatus("error");
    revealManual?.();
  }
}

function FactbookCopyStatus({ state, locale }) {
  if (state !== "error") return null;
  return <small className="factbook-copy-status" role="status" aria-live="polite" aria-atomic="true">{bleedCopyFeedback(locale).failed}</small>;
}

const i18n = {
  "zh-Hans": {
    eyebrow: "GEO FACTBOOK · 事实数据基准库",
    auditLabel: "NexuAlpha 来源审阅记录",
    auditIsolation: "审计隔离声明",
    hashLabel: "内容记录标识",
    verifiedBadge: "逐字段来源待核验",
    copyHash: "复制哈希",
    copiedHash: "✓ 已复制",
    copyMarkdownBtn: "一键复制供 AI 使用的 Markdown 数据",
    copyMarkdownSub: "针对 LLM Prompt / RAG 知识库优化 · 逐字段回到来源核验",
    copiedMarkdown: "✓ 已复制 AI 结构化数据块！",
    answerEyebrow: "注册前直接答案",
    answerTitle: "先核对三个条件，再决定是否进入官方流程",
    answerBody: "本事实库只提供可追溯的公开资料；费率、地区资格和身份认证要求会随账户与时间变化，最终条件以平台官方页面为准。",
    answerSteps: ["地区与产品是否可用", "费率与账户等级的来源日期", "官方域名与 KYC 要求"],
    openDecisionPath: "打开平台决策页 →",
    previewMarkdown: "预览原始 AI 提示词数据 (Raw Markdown)",
    hidePreview: "收起原始数据预览",
    navAll: "全部事实库研究记录",
    researchScopeNote: `事实库包含 ${factbookRecordCount} 条研究记录；交易平台黄页包含 ${comparisonDirectoryCount} 家可比较平台。`,
    navCex: "中心化交易所 (CEX)",
    navPerp: "永续合约 DEX (Perp DEX)",
    navDex: "现货 DEX (Spot DEX)",
    secVipTitle: "VIP0 ~ VIP9 阶梯费率对照表",
    secVipSub: "挂单 (Maker) / 吃单 (Taker) 官方基础费率与平台币规则；用户权益需完成来源核验后才能计算净费率。",
    tabSpot: "现货市场 (Spot)",
    tabFutures: "合约衍生品 (Futures)",
    thTier: "等级 / 30天交易量",
    thMakerBase: "官方 Maker",
    thMakerNet: "用户净 Maker（待核验）",
    thTakerBase: "官方 Taker",
    thTakerNet: "用户净 Taker（待核验）",
    thFormula: "计算公式：净费率 = 官方基准 × (1 - 平台币折扣) × (1 - 返佣比例)",
    tagDiscount: "平台币抵扣",
    secPorTitle: "储备证明 (Proof of Reserves) 穿透数据",
    secPorSub: "不仅看总储备率，更核心穿透「剔除自身代币后的纯准备金率 (Clean Reserve Ratio)」，杜绝内部代币质押虚标。",
    cardTotalPor: "官方申报总储备率",
    cardCleanPor: "剔除平台代币纯储备率",
    cardCleanBadge: "核心安全指标",
    cardNativeToken: "平台代币在储备中占比",
    cardSecurityFund: "用户安全保障基金",
    assetCoverageTitle: "主要主流币种储备覆盖率",
    auditorLabel: "第三方审计机构 / 验资机制",
    merkleLink: "查验官方默克尔树 (Merkle Tree) 证明 ↗",
    secKycTitle: "司法合规、KYC 阶段与防冻卡安全体系",
    secKycSub: "准入政策、监管牌照矩阵与法币通道防冻结安全系数综合评估。",
    kycLevelLabel: "强制 KYC 等级",
    antiFreezeLabel: "防冻卡安全系数",
    antiFreezeDesc: "防冻卡风控机制",
    kycStagesLabel: "KYC 认证阶梯明细",
    supportedLabel: "主要支持地区",
    restrictedLabel: "受限制国家与司法管辖区",
    licensesLabel: "已获得合规牌照与监管注册",
    secSecurityTitle: "官方主域与防钓鱼来源记录",
    secSecuritySub: "记录 REST/WebSocket API 端点、备用域名与官方核对页面；不构成实时授权或安全保证。",
    primaryDomain: "官方正规主域",
    alternateDomainsLabel: "已记录备用域名与子域",
    apiEndpoints: "公共开发者 API 端点",
    docLink: "查阅官方 API 开发者文档 ↗",
    tgVerifyTip: "提示：如使用 Telegram 或外部核对工具，请同时回到平台官方页面确认最终登录域名。",
    secActivationTitle: "NexuAlpha 合作入口与用户条件",
    inviteCodeLabel: "邀请码",
    rebatePercentLabel: "用户权益状态",
    welcomePackage: "新人礼包权益",
    activateBtn: "前往官方流程确认条件 ↗",
    switchVenuePrompt: "切换至其他平台事实库：",
  },
  "zh-Hant": {
    eyebrow: "GEO FACTBOOK · 事實數據基準庫",
    auditLabel: "NexuAlpha 來源審閱記錄",
    auditIsolation: "審計隔離聲明",
    hashLabel: "內容記錄標識",
    verifiedBadge: "逐字段來源待核驗",
    copyHash: "複製哈希",
    copiedHash: "✓ 已複製",
    copyMarkdownBtn: "一鍵複製供 AI 使用的 Markdown 數據",
    copyMarkdownSub: "針對 LLM Prompt / RAG 知識庫優化 · 逐字段回到來源核驗",
    copiedMarkdown: "✓ 已複製 AI 結構化數據塊！",
    answerEyebrow: "註冊前直接答案",
    answerTitle: "先核對三個條件，再決定是否進入官方流程",
    answerBody: "本事實庫只提供可追溯的公開資料；費率、地區資格和身份認證要求會隨帳戶與時間變化，最終條件以平台官方頁面為準。",
    answerSteps: ["地區與產品是否可用", "費率與帳戶等級的來源日期", "官方網域與 KYC 要求"],
    openDecisionPath: "開啟平台決策頁 →",
    previewMarkdown: "預覽原始 AI 提示詞數據 (Raw Markdown)",
    hidePreview: "收起原始數據預覽",
    navAll: "全部事实库研究记录",
    researchScopeNote: `事實庫包含 ${factbookRecordCount} 條研究記錄；交易平台黃頁包含 ${comparisonDirectoryCount} 家可比較平台。`,
    navCex: "中心化交易所 (CEX)",
    navPerp: "永續合約 DEX (Perp DEX)",
    navDex: "現貨 DEX (Spot DEX)",
    secVipTitle: "VIP0 ~ VIP9 階梯費率對照表",
    secVipSub: "掛單 (Maker) / 吃單 (Taker) 官方基礎費率與平台幣規則；用戶權益需完成來源核驗後才能計算淨費率。",
    tabSpot: "現貨市場 (Spot)",
    tabFutures: "合約衍生品 (Futures)",
    thTier: "等級 / 30天交易量",
    thMakerBase: "官方 Maker",
    thMakerNet: "真實淨 Maker",
    thTakerBase: "官方 Taker",
    thTakerNet: "真實淨 Taker",
    thFormula: "計算公式：淨費率 = 官方基準 × (1 - 平台幣折扣) × (1 - 返佣比例)",
    tagDiscount: "平台幣抵扣",
    secPorTitle: "儲備證明 (Proof of Reserves) 穿透數據",
    secPorSub: "不僅看總儲備率，更核心穿透「剔除自身代幣後的純準備金率 (Clean Reserve Ratio)」，杜絕內部代幣質押虛標。",
    cardTotalPor: "官方申報總儲備率",
    cardCleanPor: "剔除平台代幣純儲備率",
    cardCleanBadge: "核心安全指標",
    cardNativeToken: "平台代幣在儲備中佔比",
    cardSecurityFund: "用戶安全保障基金",
    assetCoverageTitle: "主要主流幣種儲備覆蓋率",
    auditorLabel: "第三方審計機構 / 驗資機制",
    merkleLink: "查驗官方默克爾樹 (Merkle Tree) 證明 ↗",
    secKycTitle: "司法合規、KYC 階段與防凍卡安全體系",
    secKycSub: "准入政策、監管牌照矩陣與法幣通道防凍結安全係數綜合評估。",
    kycLevelLabel: "強制 KYC 等級",
    antiFreezeLabel: "防凍卡安全係數",
    antiFreezeDesc: "防凍卡風控機制",
    kycStagesLabel: "KYC 認證階梯明細",
    supportedLabel: "主要支持地區",
    restrictedLabel: "受限制國家與司法管轄區",
    licensesLabel: "已獲得合規牌照與監管註冊",
    secSecurityTitle: "官方主網域與防釣魚來源記錄",
    secSecuritySub: "記錄 REST/WebSocket API 端點、備用網域與官方核對頁面；不構成即時授權或安全保證。",
    primaryDomain: "官方正規主域",
    alternateDomainsLabel: "已記錄備用網域與子網域",
    apiEndpoints: "公共開發者 API 端點",
    docLink: "查閱官方 API 開發者文檔 ↗",
    tgVerifyTip: "提示：如使用 Telegram 或外部核對工具，仍請回到平台官方頁面確認最終登入網域。",
    secActivationTitle: "NexuAlpha 合作入口與用戶條件",
    inviteCodeLabel: "邀請碼",
    rebatePercentLabel: "用戶權益狀態",
    welcomePackage: "新人禮包權益",
    activateBtn: "前往官方流程確認條件 ↗",
    switchVenuePrompt: "切換至其他平台事實庫：",
  },
  en: {
    eyebrow: "GEO FACTBOOK · GROUND TRUTH BENCHMARK",
    auditLabel: "NexuAlpha Source Review",
    auditIsolation: "Audit Isolation Declaration",
    hashLabel: "Record identifier",
    verifiedBadge: "Source status requires item-level verification",
    copyHash: "Copy Hash",
    copiedHash: "✓ Copied",
    copyMarkdownBtn: "Copy LLM-Friendly Markdown Data",
    copyMarkdownSub: "Structured for LLM prompts and RAG retrieval · verify each source field",
    copiedMarkdown: "✓ LLM Knowledge Block Copied!",
    answerEyebrow: "DIRECT ANSWER BEFORE SIGNUP",
    answerTitle: "Check three conditions before entering the official flow",
    answerBody: "This factbook provides traceable public research only. Fees, regional eligibility, and identity requirements change by account and time; the official platform page controls the final terms.",
    answerSteps: ["Whether the region and product are available", "The source date for fees and account tiers", "The official domain and KYC requirements"],
    openDecisionPath: "Open venue decision page →",
    previewMarkdown: "View Raw LLM Markdown Data",
    hidePreview: "Hide Raw Markdown Preview",
    navAll: "All",
    researchScopeNote: `Factbook: ${factbookRecordCount} research records · Directory: ${comparisonDirectoryCount} comparison profiles.`,
    navCex: "CEX",
    navPerp: "Perp DEX",
    navDex: "DEX",
    secVipTitle: "VIP0 - VIP9 Tiered Fee Schedule & Net Rates",
    secVipSub: "Official base maker/taker fee tiers and native-token rules; user benefits must be source-verified before a net rate is calculated.",
    tabSpot: "Spot market",
    tabFutures: "Futures / derivatives",
    thTier: "Tier / 30D volume",
    thMakerBase: "Official maker",
    thMakerNet: "Net maker rate",
    thTakerBase: "Official taker",
    thTakerNet: "Net taker rate",
    thFormula: "Formula: Net Fee = Base Rate × (1 - Token Discount) × (1 - Rebate Ratio)",
    tagDiscount: "Token Discount",
    secPorTitle: "Proof of reserves",
    secPorSub: "Reserve figures appear here only with a dated official source; until then each item is marked “not yet checked”.",
    cardTotalPor: "Declared total reserve ratio",
    cardCleanPor: "Clean reserve ratio (non-native)",
    cardCleanBadge: "Critical solvency metric",
    cardNativeToken: "Native token reserve share",
    cardSecurityFund: "User protection fund",
    assetCoverageTitle: "Major asset reserve coverage",
    auditorLabel: "Auditor and verification methodology",
    merkleLink: "Verify Official Merkle Tree Proof ↗",
    secKycTitle: "Regulatory compliance, KYC and account security",
    secKycSub: "Access policies, licensing registrations, and anti-freezing risk coefficient assessment.",
    kycLevelLabel: "KYC requirement level",
    antiFreezeLabel: "Anti-Freeze Security Score",
    antiFreezeDesc: "Anti-Freeze Risk Model",
    kycStagesLabel: "KYC tier breakdown",
    supportedLabel: "Supported jurisdictions",
    restrictedLabel: "Restricted jurisdictions",
    licensesLabel: "Regulatory licenses and registrations",
    secSecurityTitle: "Official domains and anti-phishing source records",
    secSecuritySub: "Recorded REST/WebSocket API endpoints, alternate domains, and official route clues; not live authorization or a safety guarantee.",
    primaryDomain: "Primary official domain",
    alternateDomainsLabel: "Recorded alternate domains and subdomains",
    apiEndpoints: "Public API endpoints",
    docLink: "View official API documentation ↗",
    tgVerifyTip: "Tip: If you use Telegram or another checker, still confirm the final login domain on the platform's own page.",
    secActivationTitle: "NexuAlpha Partner Route & User Conditions",
    inviteCodeLabel: "Referral Code",
    rebatePercentLabel: "User Benefit Status",
    welcomePackage: "Welcome Package",
    activateBtn: "Confirm Conditions in Official Flow ↗",
    switchVenuePrompt: "Switch to another Factbook benchmark:",
    auditDeclaration: "This page separates public research from marketing. Rewards, net rates, reserve ratios and compliance judgments are marked “not yet checked” until their source and timestamp are verified.",
    foundedLabel: "Founded", hqLabel: "HQ", primaryLabel: "Primary", rawMarkdownTitle: "LLM source-aware Markdown block (review before production use)", copyLabel: "Copy", platformSwitcher: "Platform Switcher", formulaLabel:"FORMULA", pendingLabel:"pending", showFewerTiers:"Show fewer fee tiers", viewFullTiers:"View full VIP0-VIP9 matrix", openReserveData:"Open full reserve data", openComplianceData:"Open full compliance data", openSecurityData:"Open recorded endpoints", verifiedTls:"TLS/SSL status to confirm", restApiLabel:"REST API:", webSocketLabel:"WebSocket:",
  },
};

// Factbook data may contain operator research fields, but the public page must
// not turn an unverified offer, fee schedule, or solvency figure into a user
// promise. The 24 records are a research index; the public comparison
// directory intentionally contains 21 profiles.
const factbookStateCopy = {
  "en": {
    "activationEyebrow": "Partner signup route",
    "signupTitle": "partner signup route",
    "signupButton": "Open partner signup route ↗",
    "inviteCodeLabel": "Referral code",
    "rebatePercentLabel": "User benefit status",
    "welcomePackage": "Welcome package",
    "activateBtn": "Confirm conditions in official flow ↗",
    "pendingReview": "Pending official-source verification",
    "officialDisclosure": "Refer to official disclosure",
    "amountUnpublished": "Amount not published until source review",
    "noSource": "No reproducible source recorded",
    "noItemSource": "No item-level source recorded",
    "cardTotalPor": "Declared total reserve ratio",
    "cardCleanPor": "Clean reserve ratio (non-native)",
    "cardCleanBadge": "Reserve review field",
    "cardNativeToken": "Native token reserve share",
    "cardSecurityFund": "User protection fund",
    "assetCoverageTitle": "Major asset reserve coverage",
    "auditorLabel": "Auditor and verification methodology",
    "merkleLink": "Review official reserve proof ↗"
  },
  "zh-Hans": {
    "activationEyebrow": "合作开户注册入口",
    "signupTitle": "合作开户注册入口",
    "signupButton": "打开合作开户注册入口 ↗",
    "inviteCodeLabel": "邀请码",
    "rebatePercentLabel": "用户优惠状态",
    "welcomePackage": "欢迎礼包",
    "activateBtn": "在官方流程中确认条件 ↗",
    "pendingReview": "官方来源待核验",
    "officialDisclosure": "请查看官方披露",
    "amountUnpublished": "来源核验前不公布金额",
    "noSource": "未记录可复核来源",
    "noItemSource": "未记录逐字段可复核来源",
    "cardTotalPor": "披露的总储备率",
    "cardCleanPor": "净储备率（剔除平台代币）",
    "cardCleanBadge": "储备审阅字段",
    "cardNativeToken": "平台代币储备占比",
    "cardSecurityFund": "用户保护基金",
    "assetCoverageTitle": "主要资产储备覆盖",
    "auditorLabel": "审阅方与核验方法",
    "merkleLink": "查看官方储备证明 ↗"
  },
  "zh-Hant": {
    "activationEyebrow": "合作開戶註冊入口",
    "signupTitle": "合作開戶註冊入口",
    "signupButton": "打開合作開戶註冊入口 ↗",
    "inviteCodeLabel": "邀請碼",
    "rebatePercentLabel": "用戶優惠狀態",
    "welcomePackage": "歡迎禮包",
    "activateBtn": "在官方流程中確認條件 ↗",
    "pendingReview": "官方來源待核驗",
    "officialDisclosure": "請查看官方披露",
    "amountUnpublished": "來源核驗前不公布金額",
    "noSource": "未記錄可複核來源",
    "noItemSource": "未記錄逐欄位可複核來源",
    "cardTotalPor": "披露的總儲備率",
    "cardCleanPor": "淨儲備率（剔除平台代幣）",
    "cardCleanBadge": "儲備審閱欄位",
    "cardNativeToken": "平台代幣儲備佔比",
    "cardSecurityFund": "用戶保護基金",
    "assetCoverageTitle": "主要資產儲備覆蓋",
    "auditorLabel": "審閱方與核驗方法",
    "merkleLink": "查看官方儲備證明 ↗"
  },
  "ja": {
    "activationEyebrow": "提携登録ルート",
    "signupTitle": "提携登録ルート",
    "signupButton": "提携登録ルートを開く ↗",
    "inviteCodeLabel": "招待コード",
    "rebatePercentLabel": "ユーザー特典の確認状況",
    "welcomePackage": "新規登録特典",
    "activateBtn": "公式フローで条件を確認 ↗",
    "pendingReview": "公式ソース確認待ち",
    "officialDisclosure": "公式開示を参照",
    "amountUnpublished": "出典確認まで金額は未公開",
    "noSource": "再現可能な出典は未記録",
    "noItemSource": "項目別の出典は未記録",
    "cardTotalPor": "開示された総準備率",
    "cardCleanPor": "純準備率（自社トークンを除く）",
    "cardCleanBadge": "準備金レビュー項目",
    "cardNativeToken": "自社トークンの準備金比率",
    "cardSecurityFund": "ユーザー保護基金",
    "assetCoverageTitle": "主要資産の準備金カバレッジ",
    "auditorLabel": "監査人と検証方法",
    "merkleLink": "公式準備金証明を確認 ↗"
  },
  "ko": {
    "activationEyebrow": "제휴 가입 경로",
    "signupTitle": "제휴 가입 경로",
    "signupButton": "제휴 가입 경로 열기 ↗",
    "inviteCodeLabel": "초대 코드",
    "rebatePercentLabel": "사용자 혜택 확인 상태",
    "welcomePackage": "신규 가입 혜택",
    "activateBtn": "공식 절차에서 조건 확인 ↗",
    "pendingReview": "공식 출처 확인 대기",
    "officialDisclosure": "공식 공시를 참조하세요",
    "amountUnpublished": "출처 검토 전까지 금액 미공개",
    "noSource": "재현 가능한 출처가 기록되지 않았습니다",
    "noItemSource": "항목별 출처가 기록되지 않았습니다",
    "cardTotalPor": "공시된 총 준비금 비율",
    "cardCleanPor": "순 준비금 비율(자체 토큰 제외)",
    "cardCleanBadge": "준비금 검토 항목",
    "cardNativeToken": "자체 토큰 준비금 비중",
    "cardSecurityFund": "사용자 보호 기금",
    "assetCoverageTitle": "주요 자산 준비금 커버리지",
    "auditorLabel": "감사자 및 검증 방법",
    "merkleLink": "공식 준비금 증명 확인 ↗"
  },
  "tr": {
    "activationEyebrow": "İş ortağı kayıt yolu",
    "signupTitle": "iş ortağı kayıt yolu",
    "signupButton": "İş ortağı kayıt yolunu aç ↗",
    "inviteCodeLabel": "Davet kodu",
    "rebatePercentLabel": "Kullanıcı avantajlarının durumu",
    "welcomePackage": "Hoş geldin paketi",
    "activateBtn": "Resmî süreçte koşulları doğrula ↗",
    "pendingReview": "Resmî kaynak doğrulaması bekleniyor",
    "officialDisclosure": "Resmî açıklamaya bakın",
    "amountUnpublished": "Kaynak incelemesine kadar tutar açıklanmaz",
    "noSource": "Tekrarlanabilir kaynak kaydedilmedi",
    "noItemSource": "Alan bazında kaynak kaydedilmedi",
    "cardTotalPor": "Açıklanan toplam rezerv oranı",
    "cardCleanPor": "Net rezerv oranı (yerel token hariç)",
    "cardCleanBadge": "Rezerv inceleme alanı",
    "cardNativeToken": "Yerel token rezerv payı",
    "cardSecurityFund": "Kullanıcı koruma fonu",
    "assetCoverageTitle": "Başlıca varlık rezerv kapsamı",
    "auditorLabel": "Denetçi ve doğrulama yöntemi",
    "merkleLink": "Resmî rezerv kanıtını incele ↗"
  },
  "ar": {
    "activationEyebrow": "مسار تسجيل الشريك",
    "signupTitle": "مسار تسجيل الشريك",
    "signupButton": "فتح مسار تسجيل الشريك ↗",
    "inviteCodeLabel": "رمز الدعوة",
    "rebatePercentLabel": "حالة مزايا المستخدم",
    "welcomePackage": "حزمة الترحيب",
    "activateBtn": "تأكيد الشروط في المسار الرسمي ↗",
    "pendingReview": "بانتظار التحقق من المصدر الرسمي",
    "officialDisclosure": "راجع الإفصاح الرسمي",
    "amountUnpublished": "لا يُنشر المبلغ حتى مراجعة المصدر",
    "noSource": "لم يُسجل مصدر قابل لإعادة التحقق",
    "noItemSource": "لم يُسجل مصدر لكل حقل",
    "cardTotalPor": "نسبة الاحتياطي الإجمالية المعلنة",
    "cardCleanPor": "نسبة الاحتياطي الصافية دون رمز المنصة",
    "cardCleanBadge": "حقل مراجعة الاحتياطيات",
    "cardNativeToken": "حصة رمز المنصة في الاحتياطيات",
    "cardSecurityFund": "صندوق حماية المستخدمين",
    "assetCoverageTitle": "تغطية احتياطي الأصول الرئيسية",
    "auditorLabel": "المدقق ومنهجية التحقق",
    "merkleLink": "مراجعة إثبات الاحتياطي الرسمي ↗"
  },
  "es": {
    "activationEyebrow": "Ruta de registro del socio",
    "signupTitle": "ruta de registro del socio",
    "signupButton": "Abrir ruta de registro del socio ↗",
    "inviteCodeLabel": "Código de invitación",
    "rebatePercentLabel": "Estado de ventajas del usuario",
    "welcomePackage": "Paquete de bienvenida",
    "activateBtn": "Confirmar condiciones en el proceso oficial ↗",
    "pendingReview": "Pendiente de verificación de la fuente oficial",
    "officialDisclosure": "Consulte la divulgación oficial",
    "amountUnpublished": "Importe no publicado hasta revisar la fuente",
    "noSource": "No se ha registrado una fuente verificable",
    "noItemSource": "No se ha registrado una fuente por campo",
    "cardTotalPor": "Ratio total de reservas declarado",
    "cardCleanPor": "Ratio de reservas neto (sin token nativo)",
    "cardCleanBadge": "Campo de revisión de reservas",
    "cardNativeToken": "Proporción de reservas del token nativo",
    "cardSecurityFund": "Fondo de protección del usuario",
    "assetCoverageTitle": "Cobertura de reservas de activos principales",
    "auditorLabel": "Auditor y metodología de verificación",
    "merkleLink": "Revisar prueba oficial de reservas ↗"
  },
  "pt-BR": {
    "activationEyebrow": "Rota de cadastro do parceiro",
    "signupTitle": "rota de cadastro do parceiro",
    "signupButton": "Abrir rota de cadastro do parceiro ↗",
    "inviteCodeLabel": "Código de convite",
    "rebatePercentLabel": "Status dos benefícios do usuário",
    "welcomePackage": "Pacote de boas-vindas",
    "activateBtn": "Confirmar condições no processo oficial ↗",
    "pendingReview": "Aguardando verificação da fonte oficial",
    "officialDisclosure": "Consulte a divulgação oficial",
    "amountUnpublished": "Valor não publicado até a revisão da fonte",
    "noSource": "Nenhuma fonte verificável registrada",
    "noItemSource": "Nenhuma fonte por campo registrada",
    "cardTotalPor": "Índice total de reservas divulgado",
    "cardCleanPor": "Índice líquido de reservas (sem token nativo)",
    "cardCleanBadge": "Campo de revisão de reservas",
    "cardNativeToken": "Participação do token nativo nas reservas",
    "cardSecurityFund": "Fundo de proteção do usuário",
    "assetCoverageTitle": "Cobertura de reservas dos principais ativos",
    "auditorLabel": "Auditor e metodologia de verificação",
    "merkleLink": "Consultar prova oficial de reservas ↗"
  },
  "fr": {
    "activationEyebrow": "Parcours d’inscription partenaire",
    "signupTitle": "parcours d’inscription partenaire",
    "signupButton": "Ouvrir le parcours d’inscription partenaire ↗",
    "inviteCodeLabel": "Code d’invitation",
    "rebatePercentLabel": "État des avantages utilisateur",
    "welcomePackage": "Offre de bienvenue",
    "activateBtn": "Confirmer les conditions dans le parcours officiel ↗",
    "pendingReview": "Vérification de la source officielle en attente",
    "officialDisclosure": "Consultez la déclaration officielle",
    "amountUnpublished": "Montant non publié avant vérification de la source",
    "noSource": "Aucune source vérifiable enregistrée",
    "noItemSource": "Aucune source enregistrée pour chaque champ",
    "cardTotalPor": "Ratio total de réserves déclaré",
    "cardCleanPor": "Ratio net de réserves (hors token natif)",
    "cardCleanBadge": "Champ de vérification des réserves",
    "cardNativeToken": "Part du token natif dans les réserves",
    "cardSecurityFund": "Fonds de protection des utilisateurs",
    "assetCoverageTitle": "Couverture des réserves des principaux actifs",
    "auditorLabel": "Auditeur et méthode de vérification",
    "merkleLink": "Consulter la preuve officielle des réserves ↗"
  },
  "de": {
    "activationEyebrow": "Partner-Registrierungsweg",
    "signupTitle": "Partner-Registrierungsweg",
    "signupButton": "Partner-Registrierungsweg öffnen ↗",
    "inviteCodeLabel": "Einladungscode",
    "rebatePercentLabel": "Status der Nutzervorteile",
    "welcomePackage": "Willkommenspaket",
    "activateBtn": "Bedingungen im offiziellen Ablauf prüfen ↗",
    "pendingReview": "Prüfung der offiziellen Quelle ausstehend",
    "officialDisclosure": "Offizielle Offenlegung prüfen",
    "amountUnpublished": "Betrag erst nach Quellenprüfung veröffentlicht",
    "noSource": "Keine überprüfbare Quelle erfasst",
    "noItemSource": "Keine Quelle je Datenfeld erfasst",
    "cardTotalPor": "Offengelegte Gesamtreservequote",
    "cardCleanPor": "Nettoreservequote (ohne eigenen Token)",
    "cardCleanBadge": "Feld zur Reserveprüfung",
    "cardNativeToken": "Anteil des eigenen Tokens an Reserven",
    "cardSecurityFund": "Nutzerschutzfonds",
    "assetCoverageTitle": "Reserveabdeckung wichtiger Vermögenswerte",
    "auditorLabel": "Prüfer und Prüfmethodik",
    "merkleLink": "Offiziellen Reservenachweis prüfen ↗"
  },
  "ru": {
    "activationEyebrow": "Партнёрский путь регистрации",
    "signupTitle": "партнёрский путь регистрации",
    "signupButton": "Открыть партнёрский путь регистрации ↗",
    "inviteCodeLabel": "Код приглашения",
    "rebatePercentLabel": "Статус преимуществ пользователя",
    "welcomePackage": "Приветственный пакет",
    "activateBtn": "Проверить условия в официальном процессе ↗",
    "pendingReview": "Ожидается проверка официального источника",
    "officialDisclosure": "См. официальное раскрытие",
    "amountUnpublished": "Сумма не публикуется до проверки источника",
    "noSource": "Проверяемый источник не зарегистрирован",
    "noItemSource": "Источник для каждого поля не зарегистрирован",
    "cardTotalPor": "Объявленный общий коэффициент резервов",
    "cardCleanPor": "Чистый коэффициент резервов без токена платформы",
    "cardCleanBadge": "Поле проверки резервов",
    "cardNativeToken": "Доля токена платформы в резервах",
    "cardSecurityFund": "Фонд защиты пользователей",
    "assetCoverageTitle": "Покрытие резервами основных активов",
    "auditorLabel": "Аудитор и метод проверки",
    "merkleLink": "Просмотреть официальное подтверждение резервов ↗"
  },
  "id": {
    "activationEyebrow": "Jalur pendaftaran mitra",
    "signupTitle": "jalur pendaftaran mitra",
    "signupButton": "Buka jalur pendaftaran mitra ↗",
    "inviteCodeLabel": "Kode undangan",
    "rebatePercentLabel": "Status manfaat pengguna",
    "welcomePackage": "Paket sambutan",
    "activateBtn": "Konfirmasi ketentuan dalam proses resmi ↗",
    "pendingReview": "Menunggu verifikasi sumber resmi",
    "officialDisclosure": "Lihat pengungkapan resmi",
    "amountUnpublished": "Jumlah tidak dipublikasikan sebelum tinjauan sumber",
    "noSource": "Tidak ada sumber yang dapat diverifikasi tercatat",
    "noItemSource": "Tidak ada sumber per bidang tercatat",
    "cardTotalPor": "Rasio total cadangan yang diumumkan",
    "cardCleanPor": "Rasio cadangan bersih (tanpa token asli)",
    "cardCleanBadge": "Bidang tinjauan cadangan",
    "cardNativeToken": "Porsi token asli dalam cadangan",
    "cardSecurityFund": "Dana perlindungan pengguna",
    "assetCoverageTitle": "Cakupan cadangan aset utama",
    "auditorLabel": "Auditor dan metode verifikasi",
    "merkleLink": "Tinjau bukti cadangan resmi ↗"
  },
  "vi": {
    "activationEyebrow": "Đường dẫn đăng ký đối tác",
    "signupTitle": "đường dẫn đăng ký đối tác",
    "signupButton": "Mở đường dẫn đăng ký đối tác ↗",
    "inviteCodeLabel": "Mã mời",
    "rebatePercentLabel": "Trạng thái quyền lợi người dùng",
    "welcomePackage": "Gói chào mừng",
    "activateBtn": "Xác nhận điều kiện trong quy trình chính thức ↗",
    "pendingReview": "Chờ xác minh nguồn chính thức",
    "officialDisclosure": "Xem công bố chính thức",
    "amountUnpublished": "Chưa công bố số tiền trước khi kiểm tra nguồn",
    "noSource": "Chưa ghi nhận nguồn có thể kiểm chứng",
    "noItemSource": "Chưa ghi nhận nguồn cho từng trường",
    "cardTotalPor": "Tỷ lệ dự trữ tổng được công bố",
    "cardCleanPor": "Tỷ lệ dự trữ ròng (không gồm token nền tảng)",
    "cardCleanBadge": "Trường kiểm tra dự trữ",
    "cardNativeToken": "Tỷ trọng token nền tảng trong dự trữ",
    "cardSecurityFund": "Quỹ bảo vệ người dùng",
    "assetCoverageTitle": "Mức dự trữ bao phủ tài sản chính",
    "auditorLabel": "Đơn vị kiểm tra và phương pháp xác minh",
    "merkleLink": "Xem bằng chứng dự trữ chính thức ↗"
  },
  "it": {
    "activationEyebrow": "Percorso di registrazione partner",
    "signupTitle": "percorso di registrazione partner",
    "signupButton": "Apri il percorso di registrazione partner ↗",
    "inviteCodeLabel": "Codice d’invito",
    "rebatePercentLabel": "Stato dei vantaggi utente",
    "welcomePackage": "Pacchetto di benvenuto",
    "activateBtn": "Conferma le condizioni nel percorso ufficiale ↗",
    "pendingReview": "Verifica della fonte ufficiale in attesa",
    "officialDisclosure": "Consulta la comunicazione ufficiale",
    "amountUnpublished": "Importo non pubblicato prima della verifica della fonte",
    "noSource": "Nessuna fonte verificabile registrata",
    "noItemSource": "Nessuna fonte registrata per ogni campo",
    "cardTotalPor": "Rapporto totale delle riserve dichiarato",
    "cardCleanPor": "Rapporto netto delle riserve (senza token nativo)",
    "cardCleanBadge": "Campo di verifica delle riserve",
    "cardNativeToken": "Quota del token nativo nelle riserve",
    "cardSecurityFund": "Fondo di protezione utenti",
    "assetCoverageTitle": "Copertura delle riserve degli asset principali",
    "auditorLabel": "Revisore e metodo di verifica",
    "merkleLink": "Consulta la prova ufficiale delle riserve ↗"
  }
};

function factbookStateLabels(locale) {
  const key = locale === "zh-CN" ? "zh-Hans" : locale === "zh-TW" ? "zh-Hant" : locale;
  return factbookStateCopy[key] || factbookStateCopy[String(key || "").split("-")[0]] || factbookStateCopy.en;
}

function publicFactbookVenue(raw, locale = "en") {
  const stateCopy = factbookStateLabels(locale);
  const pending = stateCopy.pendingReview;
  const offerVerified = Boolean(raw?.rebate?.benefitVerifiedAt && raw?.rebate?.benefitSourceUrl);
  const feeVerified = Boolean(raw?.feeVerifiedAt && raw?.feeSourceUrl);
  const porVerified = Boolean(raw?.por?.verifiedAt && raw?.por?.sourceUrl);
  const complianceVerified = Boolean(raw?.compliance?.verifiedAt && raw?.compliance?.sourceUrl);
  const vipTiers = (raw?.vipTiers || []).map((row) => {
    if (!feeVerified) {
      return {
        tier: row.tier,
        vol30d: row.vol30d,
        spotM: pending,
        spotT: pending,
        netSpotM: pending,
        netSpotT: pending,
        futM: pending,
        futT: pending,
        netFutM: pending,
        netFutT: pending,
      };
    }
    return offerVerified ? row : ({
      ...row,
      netSpotM: row.spotM,
      netSpotT: row.spotT,
      netFutM: row.futM,
      netFutT: row.futT,
    });
  });
  return {
    ...raw,
    trustScore: null,
    porVerified,
    complianceVerified,
    feeVerified,
    tokenDiscount: {
      token: raw?.tokenDiscount?.token || null,
      spotDiscount: pending,
      futuresDiscount: pending,
      percent: null,
    },
    rebate: raw?.rebate
      ? {
        ...raw.rebate,
        percent: offerVerified ? raw.rebate.percent : 0,
        welcomeBonus: offerVerified ? raw.rebate.welcomeBonus : null,
        benefitVerified: offerVerified,
      }
      : raw?.rebate,
    vipTiers,
    por: porVerified ? raw.por : {
      ...raw.por,
      totalRatio: pending,
      cleanRatio: pending,
      nativeTokenShare: pending,
      securityFund: stateCopy.officialDisclosure,
      fundAmount: stateCopy.amountUnpublished,
      cleanRatioNoteEn: stateCopy.noSource,
      cleanRatioNoteZh: "未记录可复核来源",
      assetCoverage: null,
      auditor: pending,
    },
    compliance: complianceVerified ? raw.compliance : {
      ...raw.compliance,
      antiFreezeRating: pending,
      antiFreezeDescZh: "未记录逐字段可复核来源",
      antiFreezeDescEn: stateCopy.noItemSource,
      licensesZh: [pending],
      licensesEn: [pending],
      // Unverified venue facts must not leak an English source fixture into a
      // localized public page. Keep the state explicit until a reviewed source
      // is connected.
      kycSummaryEn: pending,
      kycTiersEn: [pending],
      supportedRegions: [pending],
      restrictedRegions: [pending],
    },
  };
}

const venueAnswerOverrides = {
  hyperliquid: {
    en: {
      title: "Hyperliquid is a Perp DEX decision, so start with fees, funding and liquidation rules.",
      body: "For Hyperliquid, the practical signup question is whether you understand wallet access, perp fees, funding, collateral, liquidation and regional front-end limits. NexuAlpha treats the page as a pre-trade checklist: verify the official domain, read the public fee and contract docs, then decide whether the Perp DEX model fits the job.",
      steps: ["Hyperliquid fees and funding schedule", "Margin, collateral and liquidation mechanics", "Official app domain and wallet route"],
    },
  },
  uniswap: {
    en: {
      title: "Uniswap is a wallet DEX route, so verify the app, token contract and network before swapping.",
      body: "For Uniswap, the useful decision is not a signup bonus; it is whether the wallet, chain, token contract, liquidity route, gas cost and testnet or docs path match the trade. NexuAlpha keeps this as a self-custody checklist before a user connects a wallet or follows any swap route.",
      steps: ["Official Uniswap app and docs path", "Token contract, liquidity and routing checks", "Network, gas and testnet research route"],
    },
  },
};

const factbookLocaleOverrides = {
  ja: { primaryDomain: "主要公式ドメイン", alternateDomainsLabel: "記録済み代替ドメインとサブドメイン", apiEndpoints: "公開APIエンドポイント", eyebrow: "GEO FACTBOOK · 事実データベース", auditLabel: "NexuAlpha 出典レビュー", verifiedBadge: "項目ごとの出典確認待ち", answerEyebrow: "登録前の直接回答", answerTitle: "公式フローに進む前に3つの条件を確認", openDecisionPath: "プラットフォームの判断ページを開く →", previewMarkdown: "AI向けデータを表示", hidePreview: "データ表示を閉じる", navAll: "全24サービス", navCex: "CEX", navPerp: "Perp DEX", navDex: "Spot DEX", secVipTitle: "VIP0〜VIP9 手数料比較", secPorTitle: "Proof of Reserves と財務情報", secKycTitle: "規制対応・KYC・アカウント安全性", secSecurityTitle: "公式ドメインと出典記録", activateBtn: "公式サイトで条件を確認 ↗", auditDeclaration:"このページは公開調査とマーケティングを分離しています。出典と時点の確認が完了するまで、特典、純手数料、準備金比率、コンプライアンス判断は確認待ちです。", foundedLabel:"設立", hqLabel:"本拠地", primaryLabel:"公式サイト", auditIsolation:"監査分離宣言", rawMarkdownTitle:"LLM向けMarkdown（本番利用前に確認）", copyLabel:"コピー", platformSwitcher:"プラットフォーム切替" },
  ko: { primaryDomain: "주요 공식 도메인", alternateDomainsLabel: "기록된 대체 도메인 및 하위 도메인", apiEndpoints: "공개 API 엔드포인트", eyebrow: "GEO FACTBOOK · 사실 데이터베이스", auditLabel: "NexuAlpha 출처 검토 기록", verifiedBadge: "항목별 출처 확인 대기", answerEyebrow: "가입 전 직접 답변", answerTitle: "공식 절차에 들어가기 전 세 가지 조건 확인", openDecisionPath: "플랫폼 판단 페이지 열기 →", previewMarkdown: "AI용 데이터 보기", hidePreview: "데이터 숨기기", navAll: "전체 24개 플랫폼", navCex: "CEX", navPerp: "Perp DEX", navDex: "Spot DEX", secVipTitle: "VIP0~VIP9 수수료 비교", secPorTitle: "Proof of Reserves 및 재무 정보", secKycTitle: "규제 준수·KYC·계정 보안", secSecurityTitle: "공식 도메인 및 출처 기록", activateBtn: "공식 사이트에서 조건 확인 ↗", auditDeclaration:"이 페이지는 공개 조사와 마케팅을 분리합니다. 출처와 시점이 확인될 때까지 혜택, 순수수료, 준비금 비율 및 규제 판단은 확인 대기 상태입니다.", foundedLabel:"설립", hqLabel:"본사", primaryLabel:"공식 사이트", auditIsolation:"감사 분리 선언", rawMarkdownTitle:"LLM용 Markdown 블록(사용 전 검토)", copyLabel:"복사", platformSwitcher:"플랫폼 전환" },
  tr: { primaryDomain: "Birincil resmi alan adı", alternateDomainsLabel: "Kayıtlı alternatif alan adları ve alt alan adları", apiEndpoints: "Genel API uç noktaları", eyebrow: "GEO FACTBOOK · GERÇEK VERİ TABANI", auditLabel: "NexuAlpha kaynak inceleme kaydı", verifiedBadge: "Alan bazında kaynak doğrulaması bekleniyor", answerEyebrow: "Kayıt öncesi doğrudan yanıt", answerTitle: "Resmi akışa geçmeden önce üç koşulu kontrol edin", openDecisionPath: "Platform karar sayfasını aç →", previewMarkdown: "Yapay zeka verisini görüntüle", hidePreview: "Veri önizlemesini gizle", navAll: "Tüm 24 platform", navCex: "CEX", navPerp: "Perp DEX", navDex: "Spot DEX", secVipTitle: "VIP0-VIP9 ücret karşılaştırması", secPorTitle: "Proof of Reserves ve finansal bilgiler", secKycTitle: "Mevzuat, KYC ve hesap güvenliği", secSecurityTitle: "Resmi alan adları ve kaynak kayıtları", activateBtn: "Resmi sitede koşulları gör ↗", auditDeclaration:"Bu sayfa kamu araştırmasını pazarlamadan ayırır. Kaynak ve zaman doğrulanana kadar avantajlar, net ücretler, rezerv oranları ve uyum kararları doğrulama bekler.", foundedLabel:"Kuruluş", hqLabel:"Merkez", primaryLabel:"Resmî site", auditIsolation:"Denetim ayrıştırma bildirimi", rawMarkdownTitle:"LLM uyumlu Markdown (kullanmadan önce inceleyin)", copyLabel:"Kopyala", platformSwitcher:"Platform değiştir" },
};

Object.assign(factbookLocaleOverrides.ja, { navAll: "ファクトブックの研究記録", researchScopeNote: `ファクトブックは${factbookRecordCount}件の研究記録、比較ディレクトリは${comparisonDirectoryCount}件のプロフィールを収録します。` });
Object.assign(factbookLocaleOverrides.ko, { navAll: "팩트북 연구 기록", researchScopeNote: `팩트북에는 ${factbookRecordCount}개 연구 기록, 비교 디렉터리에는 ${comparisonDirectoryCount}개 플랫폼 프로필이 있습니다.` });
Object.assign(factbookLocaleOverrides.tr, { navAll: "Factbook araştırma kayıtları", researchScopeNote: `Factbook ${factbookRecordCount} araştırma kaydı, karşılaştırma dizini ${comparisonDirectoryCount} platform profili içerir.` });

const factbookDeepLocale = {
  ja: { titleSuffix:"出典レビュー・ファクトブック", trustPending:"信頼スコア：出典確認待ち", secVipSub:"公式のメイカー／テイカー手数料階層とネイティブトークン条件。純手数料の算出にはユーザー特典の出典確認が必要です。", tabSpot:"現物市場", tabFutures:"先物／デリバティブ", thTier:"階層／30日取引量", thMakerBase:"公式メイカー", thMakerNet:"純メイカー料率", thTakerBase:"公式テイカー", thTakerNet:"純テイカー料率", thFormula:"計算式：純手数料＝基本料率×（1−トークン割引）×（1−還元率）", tagDiscount:"トークン割引", secPorSub:"見出しの数字だけでなく、内部トークンを除いた純準備率を確認し、担保の水増しを避けます。", assetCoverageTitle:"主要資産の準備金カバレッジ", auditorLabel:"監査人と検証方法", secKycSub:"アクセス方針、ライセンス登録、凍結リスク係数を確認します。", kycLevelLabel:"KYC要件レベル", antiFreezeLabel:"凍結対策セキュリティスコア", kycStagesLabel:"KYC段階の内訳", supportedLabel:"対応地域", restrictedLabel:"制限地域", licensesLabel:"規制ライセンスと登録", secSecuritySub:"本番REST／WebSocket API、記録済み代替ドメインと公式ページ確認。", docLink:"公式APIドキュメントを確認 ↗", tgVerifyTip:"ヒント：NexuAlpha Telegramボットに /check [domain] を送信してドメインを確認してください。", formulaLabel:"計算式", pendingLabel:"確認待ち", showFewerTiers:"少ない階層を表示", viewFullTiers:"VIP0〜VIP9の全階層を見る", openReserveData:"準備金データをすべて表示", openComplianceData:"コンプライアンスデータをすべて表示", openSecurityData:"セキュリティ端点をすべて表示", verifiedTls:"TLS/SSL 状態確認", restApiLabel:"REST API:", webSocketLabel:"WebSocket:" },
  ko: { titleSuffix:"출처 검토 팩트북", trustPending:"신뢰 점수: 출처 확인 대기", secVipSub:"공식 메이커·테이커 수수료 단계와 네이티브 토큰 조건입니다. 순수수수료 계산 전 사용자 혜택의 출처를 확인해야 합니다.", tabSpot:"현물 시장", tabFutures:"선물 / 파생상품", thTier:"등급 / 30일 거래량", thMakerBase:"공식 메이커", thMakerNet:"순 메이커 수수료", thTakerBase:"공식 테이커", thTakerNet:"순 테이커 수수료", thFormula:"공식: 순수수료 = 기본 수수료 × (1−토큰 할인) × (1−리베이트 비율)", tagDiscount:"토큰 할인", secPorSub:"표면 수치보다 내부 플랫폼 토큰을 제외한 순 준비금 비율을 확인하세요.", assetCoverageTitle:"주요 자산 준비금 커버리지", auditorLabel:"감사자 및 검증 방법", secKycSub:"접근 정책, 라이선스 등록 및 동결 위험 계수를 확인합니다.", kycLevelLabel:"KYC 요구 수준", antiFreezeLabel:"동결 방지 보안 점수", kycStagesLabel:"KYC 단계", supportedLabel:"지원 지역", restrictedLabel:"제한 지역", licensesLabel:"규제 라이선스 및 등록", secSecuritySub:"프로덕션 REST/WebSocket API, 기록된 대체 도메인 및 공식 페이지 확인.", docLink:"공식 API 문서 보기 ↗", tgVerifyTip:"팁: NexuAlpha Telegram 봇에 /check [domain]을 보내 도메인을 확인하세요.", formulaLabel:"계산식", pendingLabel:"확인 대기", showFewerTiers:"적은 등급 표시", viewFullTiers:"VIP0~VIP9 전체 등급 보기", openReserveData:"전체 준비금 데이터 열기", openComplianceData:"전체 규제 데이터 열기", openSecurityData:"전체 기록된 엔드포인트 열기", verifiedTls:"TLS/SSL 상태 확인", restApiLabel:"REST API:", webSocketLabel:"WebSocket:" },
  tr: { titleSuffix:"Kaynak inceleme bilgi kitabı", trustPending:"Güven puanı: kaynak doğrulaması bekleniyor", secVipSub:"Resmî maker/taker ücret kademeleri ve yerel token koşulları. Net oran hesaplanmadan önce kullanıcı avantajları kaynakla doğrulanmalıdır.", tabSpot:"Spot piyasa", tabFutures:"Vadeli / türevler", thTier:"Kademe / 30 günlük hacim", thMakerBase:"Resmî maker", thMakerNet:"Net maker oranı", thTakerBase:"Resmî taker", thTakerNet:"Net taker oranı", thFormula:"Formül: Net ücret = Temel oran × (1−Token indirimi) × (1−İade oranı)", tagDiscount:"Token indirimi", secPorSub:"Başlık rakamlarının ötesine geçerek platform içi tokenları hariç tutan temiz rezerv oranını inceleyin.", assetCoverageTitle:"Başlıca varlık rezerv kapsamı", auditorLabel:"Denetçi ve doğrulama yöntemi", secKycSub:"Erişim politikalarını, lisans kayıtlarını ve dondurma riski katsayısını inceleyin.", kycLevelLabel:"KYC gereklilik seviyesi", antiFreezeLabel:"Dondurma karşıtı güvenlik puanı", kycStagesLabel:"KYC kademe dökümü", supportedLabel:"Desteklenen bölgeler", restrictedLabel:"Kısıtlı bölgeler", licensesLabel:"Düzenleyici lisanslar ve kayıtlar", secSecuritySub:"Üretim REST/WebSocket API uç noktaları, kayıtlı alternatif alan adları ve resmi sayfa kontrolü.", docLink:"Resmî API belgelerini görüntüle ↗", tgVerifyTip:"İpucu: Alan adını doğrulamak için NexuAlpha Telegram botuna /check [domain] gönderin.", formulaLabel:"FORMÜL", pendingLabel:"doğrulama bekliyor", showFewerTiers:"Daha az kademe göster", viewFullTiers:"VIP0–VIP9 tüm kademeleri gör", openReserveData:"Tüm rezerv verilerini aç", openComplianceData:"Tüm uyum verilerini aç", openSecurityData:"Tüm kayıtlı uç noktalarnı aç", verifiedTls:"TLS/SSL durumu kontrol edilmeli", restApiLabel:"REST API:", webSocketLabel:"WebSocket:" }
};
factbookDeepLocale.ar = {
  titleSuffix: "دليل مراجعة المصادر", trustPending: "درجة الثقة: بانتظار التحقق من المصدر",
  secVipSub: "مستويات رسوم Maker وTaker الرسمية وشروط الرمز الأصلي. يجب التحقق من مزايا المستخدم قبل حساب الرسوم الصافية.",
  tabSpot: "السوق الفوري", tabFutures: "العقود الآجلة والمشتقات", thTier: "المستوى / حجم 30 يوماً",
  thMakerBase: "Maker الرسمي", thMakerNet: "Maker الصافي", thTakerBase: "Taker الرسمي", thTakerNet: "Taker الصافي",
  tagDiscount: "خصم الرمز", secPorSub: "راجع نسبة الاحتياطي الصافي بعد استبعاد رمز المنصة، وليس الرقم الإجمالي فقط.",
  assetCoverageTitle: "تغطية احتياطي الأصول الرئيسية", auditorLabel: "المدقق وآلية التحقق",
  secKycSub: "راجع سياسة الوصول وتسجيلات التراخيص ومعامل مخاطر التجميد.", kycLevelLabel: "مستوى متطلبات KYC",
  antiFreezeLabel: "درجة أمان مقاومة التجميد", kycStagesLabel: "مراحل KYC", supportedLabel: "المناطق المدعومة",
  restrictedLabel: "المناطق المحظورة", licensesLabel: "التراخيص والتسجيلات التنظيمية",
  secSecuritySub: "نقاط REST/WebSocket الرسمية وعمليات التحقق من التصيد عبر Telegram.", docLink: "عرض وثائق API الرسمية ↗",
  formulaLabel: "المعادلة", pendingLabel: "بانتظار التحقق", showFewerTiers: "عرض مستويات أقل", viewFullTiers: "عرض المستويات VIP0–VIP9 كاملة",
  openReserveData: "فتح بيانات الاحتياطي كاملة", openComplianceData: "فتح بيانات الامتثال كاملة", openSecurityData: "فتح نقاط الأمان كاملة",
  verifiedTls: "حالة TLS/SSL بحاجة إلى مراجعة", restApiLabel: "REST API:", webSocketLabel: "WebSocket:"
};
factbookDeepLocale["pt-BR"] = {
  titleSuffix: "Factbook de revisão de fontes", trustPending: "Pontuação de confiança: aguardando verificação da fonte",
  secVipSub: "Níveis oficiais de taxas Maker/Taker e condições do token nativo. Os benefícios precisam ser verificados antes do cálculo líquido.",
  tabSpot: "Mercado à vista", tabFutures: "Futuros e derivativos", thTier: "Nível / volume de 30 dias",
  thMakerBase: "Maker oficial", thMakerNet: "Maker líquido", thTakerBase: "Taker oficial", thTakerNet: "Taker líquido",
  tagDiscount: "Desconto do token", secPorSub: "Verifique a reserva líquida excluindo o token da plataforma, além do índice total.",
  assetCoverageTitle: "Cobertura das reservas dos principais ativos", auditorLabel: "Auditor e método de verificação",
  secKycSub: "Consulte a política de acesso, os registros de licença e o fator de risco de congelamento.", kycLevelLabel: "Nível de exigência KYC",
  antiFreezeLabel: "Índice de segurança contra congelamento", kycStagesLabel: "Etapas de KYC", supportedLabel: "Regiões atendidas",
  restrictedLabel: "Regiões restritas", licensesLabel: "Licenças e registros regulatórios",
  secSecuritySub: "Endpoints REST/WebSocket oficiais e verificação antifraude pelo Telegram.", docLink: "Ver documentação oficial da API ↗",
  formulaLabel: "Fórmula", pendingLabel: "Aguardando verificação", showFewerTiers: "Mostrar menos níveis", viewFullTiers: "Ver todos os níveis VIP0–VIP9",
  openReserveData: "Abrir todos os dados de reservas", openComplianceData: "Abrir todos os dados de conformidade", openSecurityData: "Abrir todos os endpoints de segurança",
  verifiedTls: "Status TLS/SSL a confirmar", restApiLabel: "REST API:", webSocketLabel: "WebSocket:"
};
factbookDeepLocale.es = {
  titleSuffix: "Factbook de revisión de fuentes", trustPending: "Puntuación de confianza: verificación pendiente",
  secVipSub: "Niveles oficiales de comisiones Maker/Taker y condiciones del token nativo. Verifica los beneficios antes de calcular la comisión neta.",
  tabSpot: "Mercado spot", tabFutures: "Futuros y derivados", thTier: "Nivel / volumen de 30 días",
  thMakerBase: "Maker oficial", thMakerNet: "Maker neto", thTakerBase: "Taker oficial", thTakerNet: "Taker neto",
  tagDiscount: "Descuento del token", secPorSub: "Revisa la reserva neta excluyendo el token de la plataforma, además del índice total.",
  assetCoverageTitle: "Cobertura de reservas de los activos principales", auditorLabel: "Auditor y método de verificación",
  secKycSub: "Revisa la política de acceso, las licencias y el factor de riesgo de congelación.", kycLevelLabel: "Nivel de requisitos KYC",
  antiFreezeLabel: "Puntuación de seguridad contra congelación", kycStagesLabel: "Etapas de KYC", supportedLabel: "Regiones admitidas",
  restrictedLabel: "Regiones restringidas", licensesLabel: "Licencias y registros regulatorios", secSecuritySub: "Endpoints REST/WebSocket oficiales y verificación antifraude por Telegram.",
  docLink: "Ver documentación oficial de la API ↗", formulaLabel: "Fórmula", pendingLabel: "Pendiente de verificación", showFewerTiers: "Mostrar menos niveles", viewFullTiers: "Ver todos los niveles VIP0–VIP9", openReserveData: "Abrir todos los datos de reservas", openComplianceData: "Abrir todos los datos de cumplimiento", openSecurityData: "Abrir todos los endpoints de seguridad", verifiedTls: "Status TLS/SSL a confirmar", restApiLabel: "REST API:", webSocketLabel: "WebSocket:"
};
factbookDeepLocale.fr = {
  titleSuffix: "Factbook de vérification des sources", trustPending: "Score de confiance : vérification de la source en attente",
  secVipSub: "Paliers officiels de frais Maker/Taker et conditions du token natif. Vérifiez les avantages avant de calculer les frais nets.",
  tabSpot: "Marché spot", tabFutures: "Futures et dérivés", thTier: "Niveau / volume sur 30 jours",
  thMakerBase: "Maker officiel", thMakerNet: "Maker net", thTakerBase: "Taker officiel", thTakerNet: "Taker net",
  tagDiscount: "Remise du token", secPorSub: "Examinez la réserve nette hors token de la plateforme, au-delà du ratio total.",
  assetCoverageTitle: "Couverture des réserves des actifs principaux", auditorLabel: "Auditeur et méthode de vérification",
  secKycSub: "Consultez la politique d’accès, les licences et le facteur de risque de gel.", kycLevelLabel: "Niveau d’exigence KYC",
  antiFreezeLabel: "Score de sécurité anti-gel", kycStagesLabel: "Étapes KYC", supportedLabel: "Régions prises en charge",
  restrictedLabel: "Régions restreintes", licensesLabel: "Licences et enregistrements réglementaires", secSecuritySub: "Endpoints REST/WebSocket officiels et vérification anti-hameçonnage via Telegram.",
  docLink: "Voir la documentation officielle de l’API ↗", formulaLabel: "Formule", pendingLabel: "Vérification en attente", showFewerTiers: "Afficher moins de niveaux", viewFullTiers: "Voir tous les niveaux VIP0–VIP9", openReserveData: "Ouvrir toutes les données de réserve", openComplianceData: "Ouvrir toutes les données de conformité", openSecurityData: "Ouvrir tous les endpoints de sécurité", verifiedTls: "Statut TLS/SSL à confirmer", restApiLabel: "REST API:", webSocketLabel: "WebSocket:"
};
for (const [locale, labels] of Object.entries({
  de: { titleSuffix:"Factbook zur Quellenprüfung", trustPending:"Vertrauensscore: Quellenprüfung ausstehend", tabSpot:"Spotmarkt", tabFutures:"Futures und Derivate", thTier:"Stufe / 30-Tage-Volumen", thMakerBase:"Offizieller Maker", thMakerNet:"Netto-Maker", thTakerBase:"Offizieller Taker", thTakerNet:"Netto-Taker", tagDiscount:"Token-Rabatt", assetCoverageTitle:"Reserveabdeckung der wichtigsten Assets", auditorLabel:"Prüfer und Prüfverfahren", kycLevelLabel:"KYC-Anforderungsstufe", supportedLabel:"Unterstützte Regionen", restrictedLabel:"Eingeschränkte Regionen", licensesLabel:"Regulatorische Lizenzen und Register", docLink:"Offizielle API-Dokumentation öffnen ↗", formulaLabel:"Formel", pendingLabel:"Prüfung ausstehend", showFewerTiers:"Weniger Stufen anzeigen", viewFullTiers:"Alle VIP0–VIP9-Stufen anzeigen", verifiedTls:"TLS/SSL-Status prüfen", restApiLabel:"REST API:", webSocketLabel:"WebSocket:" },
  ru: { titleSuffix:"Фактбук проверки источников", trustPending:"Оценка доверия: проверка источника ожидается", tabSpot:"Спотовый рынок", tabFutures:"Фьючерсы и деривативы", thTier:"Уровень / объём за 30 дней", thMakerBase:"Официальный Maker", thMakerNet:"Чистый Maker", thTakerBase:"Официальный Taker", thTakerNet:"Чистый Taker", tagDiscount:"Скидка токена", assetCoverageTitle:"Покрытие резервами основных активов", auditorLabel:"Аудитор и метод проверки", kycLevelLabel:"Уровень требований KYC", supportedLabel:"Поддерживаемые регионы", restrictedLabel:"Ограниченные регионы", licensesLabel:"Регуляторные лицензии и записи", docLink:"Открыть официальную документацию API ↗", formulaLabel:"Формула", pendingLabel:"Проверка ожидается", showFewerTiers:"Показать меньше уровней", viewFullTiers:"Показать все уровни VIP0–VIP9", verifiedTls:"Статус TLS/SSL требует проверки", restApiLabel:"REST API:", webSocketLabel:"WebSocket:" },
  id: { titleSuffix:"Factbook tinjauan sumber", trustPending:"Skor kepercayaan: menunggu verifikasi sumber", tabSpot:"Pasar spot", tabFutures:"Futures dan derivatif", thTier:"Tingkat / volume 30 hari", thMakerBase:"Maker resmi", thMakerNet:"Maker bersih", thTakerBase:"Taker resmi", thTakerNet:"Taker bersih", tagDiscount:"Diskon token", assetCoverageTitle:"Cakupan cadangan aset utama", auditorLabel:"Auditor dan metode verifikasi", kycLevelLabel:"Tingkat persyaratan KYC", supportedLabel:"Wilayah yang didukung", restrictedLabel:"Wilayah terbatas", licensesLabel:"Lisensi dan pendaftaran regulator", docLink:"Buka dokumentasi API resmi ↗", formulaLabel:"Rumus", pendingLabel:"Menunggu verifikasi", showFewerTiers:"Tampilkan lebih sedikit tingkat", viewFullTiers:"Lihat semua tingkat VIP0–VIP9", verifiedTls:"Status TLS/SSL perlu diperiksa", restApiLabel:"REST API:", webSocketLabel:"WebSocket:" },
  vi: { titleSuffix:"Factbook rà soát nguồn", trustPending:"Điểm tin cậy: đang chờ xác minh nguồn", tabSpot:"Thị trường giao ngay", tabFutures:"Hợp đồng tương lai và phái sinh", thTier:"Cấp / khối lượng 30 ngày", thMakerBase:"Maker chính thức", thMakerNet:"Maker ròng", thTakerBase:"Taker chính thức", thTakerNet:"Taker ròng", tagDiscount:"Giảm giá token", assetCoverageTitle:"Mức bao phủ dự trữ tài sản chính", auditorLabel:"Đơn vị kiểm toán và phương pháp xác minh", kycLevelLabel:"Mức yêu cầu KYC", supportedLabel:"Khu vực hỗ trợ", restrictedLabel:"Khu vực hạn chế", licensesLabel:"Giấy phép và đăng ký quản lý", docLink:"Mở tài liệu API chính thức ↗", formulaLabel:"Công thức", pendingLabel:"Đang chờ xác minh", showFewerTiers:"Hiện ít cấp hơn", viewFullTiers:"Xem đủ cấp VIP0–VIP9", verifiedTls:"Cần kiểm tra trạng thái TLS/SSL", restApiLabel:"REST API:", webSocketLabel:"WebSocket:" },
  it: { titleSuffix:"Factbook di revisione delle fonti", trustPending:"Punteggio di fiducia: verifica della fonte in attesa", tabSpot:"Mercato spot", tabFutures:"Futures e derivati", thTier:"Livello / volume di 30 giorni", thMakerBase:"Maker ufficiale", thMakerNet:"Maker netto", thTakerBase:"Taker ufficiale", thTakerNet:"Taker netto", tagDiscount:"Sconto del token", assetCoverageTitle:"Copertura delle riserve degli asset principali", auditorLabel:"Auditor e metodo di verifica", kycLevelLabel:"Livello dei requisiti KYC", supportedLabel:"Regioni supportate", restrictedLabel:"Regioni soggette a restrizioni", licensesLabel:"Licenze e registri normativi", docLink:"Apri la documentazione API ufficiale ↗", formulaLabel:"Formula", pendingLabel:"Verifica in attesa", showFewerTiers:"Mostra meno livelli", viewFullTiers:"Vedi tutti i livelli VIP0–VIP9", verifiedTls:"Stato TLS/SSL da verificare", restApiLabel:"REST API:", webSocketLabel:"WebSocket:" }
})) factbookDeepLocale[locale] = labels;
for (const [locale, values] of Object.entries(factbookDeepLocale)) factbookLocaleOverrides[locale] = { ...factbookLocaleOverrides[locale], ...values };
// Keep the high-visibility factbook chrome localized even when a venue's
// deeper research fields are still pending source review.
const factbookChromeLocale = {
  ja: { secPorTitle: "準備金証明（PoR）と財務情報", foundedLabel: "設立", hqLabel: "本拠地", primaryLabel: "公式サイト", secPorSub: "公開された準備金情報と財務開示を公式ソースで確認します。", openReserveData: "準備金データをすべて表示" },
  ko: { secPorTitle: "준비금 증명(PoR) 및 재무 정보", foundedLabel: "설립", hqLabel: "본사", primaryLabel: "공식 사이트", secPorSub: "공개된 준비금 정보와 재무 공시를 공식 출처로 확인합니다.", openReserveData: "전체 준비금 데이터 열기" },
  tr: { secPorTitle: "Rezerv kanıtı (PoR) ve finansal bilgiler", foundedLabel: "Kuruluş", hqLabel: "Merkez", primaryLabel: "Resmî site", secPorSub: "Yayımlanan rezerv ve finans açıklamalarını resmî kaynaklarla kontrol edin.", openReserveData: "Tüm rezerv verilerini aç" },
  "pt-BR": { secPorTitle: "Prova de reservas e informações financeiras", foundedLabel: "Fundação", hqLabel: "Sede", primaryLabel: "Site oficial", secPorSub: "Verifique reservas publicadas e divulgações financeiras nas fontes oficiais.", openReserveData: "Abrir todos os dados de reservas" },
  es: { secPorTitle: "Prueba de reservas e información financiera", foundedLabel: "Fundación", hqLabel: "Sede", primaryLabel: "Sitio oficial", secPorSub: "Comprueba las reservas publicadas y la información financiera en fuentes oficiales.", openReserveData: "Abrir todos los datos de reservas" },
  fr: { secPorTitle: "Preuve de réserves et informations financières", foundedLabel: "Fondation", hqLabel: "Siège", primaryLabel: "Site officiel", secPorSub: "Vérifiez les réserves publiées et les informations financières auprès des sources officielles.", openReserveData: "Ouvrir toutes les données de réserve" },
  de: { secPorTitle: "Reserve-Nachweis und Finanzinformationen", foundedLabel: "Gegründet", hqLabel: "Hauptsitz", primaryLabel: "Offizielle Website", secPorSub: "Veröffentlichte Reserve- und Finanzangaben anhand offizieller Quellen prüfen.", openReserveData: "Alle Reservendaten öffnen", openComplianceData: "Alle Compliance-Daten öffnen", openSecurityData: "Alle Sicherheitsendpunkte öffnen" },
  ru: { secPorTitle: "Подтверждение резервов и финансовая информация", foundedLabel: "Основана", hqLabel: "Штаб-квартира", primaryLabel: "Официальный сайт", secPorSub: "Проверьте опубликованные резервы и финансовые раскрытия по официальным источникам.", openReserveData: "Открыть все данные о резервах", openComplianceData: "Открыть все данные о соответствии", openSecurityData: "Открыть все защищённые конечные точки" },
  ar: { secPorTitle: "إثبات الاحتياطيات والمعلومات المالية", foundedLabel: "التأسيس", hqLabel: "المقر", primaryLabel: "الموقع الرسمي", secPorSub: "تحقق من الاحتياطيات المنشورة والإفصاحات المالية عبر المصادر الرسمية.", openReserveData: "فتح بيانات الاحتياطي كاملة" },
  id: { secPorTitle: "Bukti cadangan dan informasi keuangan", foundedLabel: "Didirikan", hqLabel: "Kantor pusat", primaryLabel: "Situs resmi", secPorSub: "Periksa cadangan dan pengungkapan keuangan yang dipublikasikan dari sumber resmi.", openReserveData: "Buka semua data cadangan", openComplianceData: "Buka semua data kepatuhan", openSecurityData: "Buka semua endpoint keamanan" },
  vi: { secPorTitle: "Bằng chứng dự trữ và thông tin tài chính", foundedLabel: "Thành lập", hqLabel: "Trụ sở", primaryLabel: "Trang chính thức", secPorSub: "Kiểm tra dữ liệu dự trữ và công bố tài chính từ nguồn chính thức.", openReserveData: "Mở toàn bộ dữ liệu dự trữ", openComplianceData: "Mở toàn bộ dữ liệu tuân thủ", openSecurityData: "Mở toàn bộ điểm cuối bảo mật" },
  it: { secPorTitle: "Prova delle riserve e informazioni finanziarie", foundedLabel: "Fondazione", hqLabel: "Sede", primaryLabel: "Sito ufficiale", secPorSub: "Verifica riserve pubblicate e dati finanziari tramite fonti ufficiali.", openReserveData: "Apri tutti i dati sulle riserve", openComplianceData: "Apri tutti i dati sulla conformità", openSecurityData: "Apri tutti gli endpoint di sicurezza" },
};
// These fields sit above the long fact tables and must never fall back to the
// English benchmark copy on an otherwise localized page.
Object.assign(factbookChromeLocale.ja, {
  auditIsolation: "監査分離宣言", hashLabel: "記録識別子", copyHash: "ハッシュをコピー",
  copyMarkdownBtn: "AI向けMarkdownデータをコピー", copyMarkdownSub: "LLMプロンプト／RAG向けに整理・各項目を公式ソースで確認",
  answerBody: "このファクトブックは追跡可能な公開調査のみを提供します。手数料、地域資格、本人確認要件はアカウントと時点で変わるため、最終条件は公式ページで確認してください。",
  answerSteps: ["地域と商品が利用可能か", "手数料とアカウント階層の情報源日付", "公式ドメインとKYC要件"],
  switchVenuePrompt: "別のプラットフォームのファクトブックへ切り替え：",
  platformSwitcher: "プラットフォームを切り替え",
  cardTotalPor: "公式申告の総準備金比率", cardCleanPor: "自社トークンを除く純準備金比率", cardCleanBadge: "重要な支払能力指標", cardNativeToken: "自社トークンの準備金比率", cardSecurityFund: "ユーザー保護基金", merkleLink: "公式マークルツリー証明を確認 ↗",
});
Object.assign(factbookChromeLocale.ko, {
  auditIsolation: "감사 분리 선언", hashLabel: "기록 식별자", copyHash: "해시 복사",
  copyMarkdownBtn: "AI용 Markdown 데이터 복사", copyMarkdownSub: "LLM 프롬프트／RAG용으로 구조화 · 각 항목을 공식 출처에서 확인",
  answerBody: "이 팩트북은 추적 가능한 공개 조사만 제공합니다. 수수료, 지역 자격 및 신원 요건은 계정과 시점에 따라 달라지므로 최종 조건은 공식 페이지에서 확인하세요.",
  answerSteps: ["지역과 상품을 이용할 수 있는지", "수수료와 계정 등급의 출처 날짜", "공식 도메인과 KYC 요건"],
  switchVenuePrompt: "다른 플랫폼 팩트북으로 전환:", platformSwitcher: "플랫폼 전환",
  cardTotalPor: "공식 신고 총 준비금 비율", cardCleanPor: "자체 토큰 제외 순 준비금 비율", cardCleanBadge: "핵심 지급능력 지표", cardNativeToken: "자체 토큰 준비금 비중", cardSecurityFund: "사용자 보호 기금", merkleLink: "공식 Merkle Tree 증명 확인 ↗",
});
Object.assign(factbookChromeLocale.tr, {
  auditIsolation: "Denetim ayrıştırma bildirimi", hashLabel: "Kayıt tanımlayıcısı", copyHash: "Özeti kopyala",
  copyMarkdownBtn: "Yapay zekâ uyumlu Markdown verisini kopyala", copyMarkdownSub: "LLM istemleri / RAG için yapılandırıldı · her alanı resmî kaynaktan doğrulayın",
  answerBody: "Bu bilgi kitabı yalnızca izlenebilir kamu araştırması sunar. Ücretler, bölgesel uygunluk ve kimlik gereksinimleri hesaba ve zamana göre değişir; nihai koşulları resmî platform sayfasından doğrulayın.",
  answerSteps: ["Bölge ve ürün kullanılabilir mi", "Ücretler ve hesap kademeleri için kaynak tarihi", "Resmî alan adı ve KYC gereksinimleri"],
  switchVenuePrompt: "Başka bir platform bilgi kitabına geç:", platformSwitcher: "Platform değiştir",
  cardTotalPor: "Resmî beyan edilen toplam rezerv oranı", cardCleanPor: "Yerel token hariç temiz rezerv oranı", cardCleanBadge: "Kritik ödeme gücü göstergesi", cardNativeToken: "Yerel token rezerv payı", cardSecurityFund: "Kullanıcı koruma fonu", merkleLink: "Resmî Merkle Tree kanıtını doğrula ↗",
});
for (const [locale, values] of Object.entries(factbookChromeLocale)) factbookLocaleOverrides[locale] = { ...factbookLocaleOverrides[locale], ...values };

const factbookRecordToolsCopy = {
  "en": {
    "sourceTools": "Source notes and data export",
    "hashLabel": "Record identifier",
    "copyHash": "Copy identifier",
    "auditIsolation": "Source notes",
    "copyMarkdownBtn": "Copy Markdown data",
    "copiedMarkdown": "Data copied",
    "copiedHash": "Identifier copied",
    "previewMarkdown": "View Markdown data",
    "hidePreview": "Hide Markdown data",
    "rawMarkdownTitle": "Markdown source record (check official sources before use)",
    "copyLabel": "Copy",
    "copyMarkdownSub": "Markdown source record (check official sources before use)"
  },
  "zh-Hans": {
    "sourceTools": "来源说明与数据导出",
    "hashLabel": "内容记录标识",
    "copyHash": "复制标识",
    "auditIsolation": "来源说明",
    "copyMarkdownBtn": "复制 Markdown 数据",
    "copiedMarkdown": "数据已复制",
    "copiedHash": "标识已复制",
    "previewMarkdown": "查看 Markdown 数据",
    "hidePreview": "收起 Markdown 数据",
    "rawMarkdownTitle": "Markdown 来源记录（使用前核对官方来源）",
    "copyLabel": "复制",
    "copyMarkdownSub": "Markdown 来源记录（使用前核对官方来源）"
  },
  "zh-Hant": {
    "sourceTools": "來源說明與資料匯出",
    "hashLabel": "內容記錄標識",
    "copyHash": "複製標識",
    "auditIsolation": "來源說明",
    "copyMarkdownBtn": "複製 Markdown 資料",
    "copiedMarkdown": "資料已複製",
    "copiedHash": "標識已複製",
    "previewMarkdown": "查看 Markdown 資料",
    "hidePreview": "收起 Markdown 資料",
    "rawMarkdownTitle": "Markdown 來源記錄（使用前核對官方來源）",
    "copyLabel": "複製",
    "copyMarkdownSub": "Markdown 來源記錄（使用前核對官方來源）"
  },
  "ja": {
    "sourceTools": "出典の説明とデータ出力",
    "hashLabel": "記録識別子",
    "copyHash": "識別子をコピー",
    "auditIsolation": "出典の説明",
    "copyMarkdownBtn": "Markdownデータをコピー",
    "copiedMarkdown": "データをコピーしました",
    "copiedHash": "識別子をコピーしました",
    "previewMarkdown": "Markdownデータを見る",
    "hidePreview": "Markdownデータを閉じる",
    "rawMarkdownTitle": "Markdown出典記録（使用前に公式ソースを確認）",
    "copyLabel": "コピー",
    "copyMarkdownSub": "Markdown出典記録（使用前に公式ソースを確認）"
  },
  "ko": {
    "sourceTools": "출처 설명 및 데이터 내보내기",
    "hashLabel": "기록 식별자",
    "copyHash": "식별자 복사",
    "auditIsolation": "출처 설명",
    "copyMarkdownBtn": "Markdown 데이터 복사",
    "copiedMarkdown": "데이터 복사 완료",
    "copiedHash": "식별자 복사 완료",
    "previewMarkdown": "Markdown 데이터 보기",
    "hidePreview": "Markdown 데이터 숨기기",
    "rawMarkdownTitle": "Markdown 출처 기록(사용 전 공식 출처 확인)",
    "copyLabel": "복사",
    "copyMarkdownSub": "Markdown 출처 기록(사용 전 공식 출처 확인)"
  },
  "tr": {
    "sourceTools": "Kaynak notları ve veri dışa aktarımı",
    "hashLabel": "Kayıt tanımlayıcısı",
    "copyHash": "Tanımlayıcıyı kopyala",
    "auditIsolation": "Kaynak notları",
    "copyMarkdownBtn": "Markdown verisini kopyala",
    "copiedMarkdown": "Veri kopyalandı",
    "copiedHash": "Tanımlayıcı kopyalandı",
    "previewMarkdown": "Markdown verisini görüntüle",
    "hidePreview": "Markdown verisini gizle",
    "rawMarkdownTitle": "Markdown kaynak kaydı (kullanmadan önce resmî kaynakları kontrol edin)",
    "copyLabel": "Kopyala",
    "copyMarkdownSub": "Markdown kaynak kaydı (kullanmadan önce resmî kaynakları kontrol edin)"
  },
  "ar": {
    "sourceTools": "ملاحظات المصادر وتصدير البيانات",
    "hashLabel": "معرّف السجل",
    "copyHash": "نسخ المعرّف",
    "auditIsolation": "ملاحظات المصادر",
    "copyMarkdownBtn": "نسخ بيانات Markdown",
    "copiedMarkdown": "تم نسخ البيانات",
    "copiedHash": "تم نسخ المعرّف",
    "previewMarkdown": "عرض بيانات Markdown",
    "hidePreview": "إخفاء بيانات Markdown",
    "rawMarkdownTitle": "سجل مصادر Markdown (تحقق من المصادر الرسمية قبل الاستخدام)",
    "copyLabel": "نسخ",
    "copyMarkdownSub": "سجل مصادر Markdown (تحقق من المصادر الرسمية قبل الاستخدام)"
  },
  "es": {
    "sourceTools": "Notas de fuentes y exportación de datos",
    "hashLabel": "Identificador del registro",
    "copyHash": "Copiar identificador",
    "auditIsolation": "Notas de fuentes",
    "copyMarkdownBtn": "Copiar datos Markdown",
    "copiedMarkdown": "Datos copiados",
    "copiedHash": "Identificador copiado",
    "previewMarkdown": "Ver datos Markdown",
    "hidePreview": "Ocultar datos Markdown",
    "rawMarkdownTitle": "Registro de fuentes Markdown (verifique las fuentes oficiales antes de usarlo)",
    "copyLabel": "Copiar",
    "copyMarkdownSub": "Registro de fuentes Markdown (verifique las fuentes oficiales antes de usarlo)"
  },
  "pt-BR": {
    "sourceTools": "Notas de fontes e exportação de dados",
    "hashLabel": "Identificador do registro",
    "copyHash": "Copiar identificador",
    "auditIsolation": "Notas de fontes",
    "copyMarkdownBtn": "Copiar dados Markdown",
    "copiedMarkdown": "Dados copiados",
    "copiedHash": "Identificador copiado",
    "previewMarkdown": "Ver dados Markdown",
    "hidePreview": "Ocultar dados Markdown",
    "rawMarkdownTitle": "Registro de fontes Markdown (confirme as fontes oficiais antes de usar)",
    "copyLabel": "Copiar",
    "copyMarkdownSub": "Registro de fontes Markdown (confirme as fontes oficiais antes de usar)"
  },
  "fr": {
    "sourceTools": "Notes sur les sources et export des données",
    "hashLabel": "Identifiant de l’enregistrement",
    "copyHash": "Copier l’identifiant",
    "auditIsolation": "Notes sur les sources",
    "copyMarkdownBtn": "Copier les données Markdown",
    "copiedMarkdown": "Données copiées",
    "copiedHash": "Identifiant copié",
    "previewMarkdown": "Afficher les données Markdown",
    "hidePreview": "Masquer les données Markdown",
    "rawMarkdownTitle": "Enregistrement des sources Markdown (vérifiez les sources officielles avant utilisation)",
    "copyLabel": "Copier",
    "copyMarkdownSub": "Enregistrement des sources Markdown (vérifiez les sources officielles avant utilisation)"
  },
  "de": {
    "sourceTools": "Quellenhinweise und Datenexport",
    "hashLabel": "Datensatzkennung",
    "copyHash": "Kennung kopieren",
    "auditIsolation": "Quellenhinweise",
    "copyMarkdownBtn": "Markdown-Daten kopieren",
    "copiedMarkdown": "Daten kopiert",
    "copiedHash": "Kennung kopiert",
    "previewMarkdown": "Markdown-Daten anzeigen",
    "hidePreview": "Markdown-Daten ausblenden",
    "rawMarkdownTitle": "Markdown-Quellenverzeichnis (vor Verwendung offizielle Quellen prüfen)",
    "copyLabel": "Kopieren",
    "copyMarkdownSub": "Markdown-Quellenverzeichnis (vor Verwendung offizielle Quellen prüfen)"
  },
  "ru": {
    "sourceTools": "Примечания об источниках и экспорт данных",
    "hashLabel": "Идентификатор записи",
    "copyHash": "Копировать идентификатор",
    "auditIsolation": "Примечания об источниках",
    "copyMarkdownBtn": "Копировать данные Markdown",
    "copiedMarkdown": "Данные скопированы",
    "copiedHash": "Идентификатор скопирован",
    "previewMarkdown": "Показать данные Markdown",
    "hidePreview": "Скрыть данные Markdown",
    "rawMarkdownTitle": "Запись источников Markdown (перед использованием проверьте официальные источники)",
    "copyLabel": "Копировать",
    "copyMarkdownSub": "Запись источников Markdown (перед использованием проверьте официальные источники)"
  },
  "id": {
    "sourceTools": "Catatan sumber dan ekspor data",
    "hashLabel": "Pengenal catatan",
    "copyHash": "Salin pengenal",
    "auditIsolation": "Catatan sumber",
    "copyMarkdownBtn": "Salin data Markdown",
    "copiedMarkdown": "Data disalin",
    "copiedHash": "Pengenal disalin",
    "previewMarkdown": "Lihat data Markdown",
    "hidePreview": "Sembunyikan data Markdown",
    "rawMarkdownTitle": "Catatan sumber Markdown (periksa sumber resmi sebelum digunakan)",
    "copyLabel": "Salin",
    "copyMarkdownSub": "Catatan sumber Markdown (periksa sumber resmi sebelum digunakan)"
  },
  "vi": {
    "sourceTools": "Ghi chú nguồn và xuất dữ liệu",
    "hashLabel": "Mã định danh bản ghi",
    "copyHash": "Sao chép mã định danh",
    "auditIsolation": "Ghi chú nguồn",
    "copyMarkdownBtn": "Sao chép dữ liệu Markdown",
    "copiedMarkdown": "Đã sao chép dữ liệu",
    "copiedHash": "Đã sao chép mã định danh",
    "previewMarkdown": "Xem dữ liệu Markdown",
    "hidePreview": "Ẩn dữ liệu Markdown",
    "rawMarkdownTitle": "Bản ghi nguồn Markdown (kiểm tra nguồn chính thức trước khi sử dụng)",
    "copyLabel": "Sao chép",
    "copyMarkdownSub": "Bản ghi nguồn Markdown (kiểm tra nguồn chính thức trước khi sử dụng)"
  },
  "it": {
    "sourceTools": "Note sulle fonti ed esportazione dati",
    "hashLabel": "Identificativo del record",
    "copyHash": "Copia identificativo",
    "auditIsolation": "Note sulle fonti",
    "copyMarkdownBtn": "Copia dati Markdown",
    "copiedMarkdown": "Dati copiati",
    "copiedHash": "Identificativo copiato",
    "previewMarkdown": "Visualizza dati Markdown",
    "hidePreview": "Nascondi dati Markdown",
    "rawMarkdownTitle": "Record delle fonti Markdown (verificare le fonti ufficiali prima dell’uso)",
    "copyLabel": "Copia",
    "copyMarkdownSub": "Record delle fonti Markdown (verificare le fonti ufficiali prima dell’uso)"
  }
};

const factbookFeeStatusTitles = {"en": "Fees and source status", "zh-Hans": "费用与来源状态", "zh-Hant": "費用與來源狀態", "ja": "手数料と出典の確認状況", "ko": "수수료 및 출처 상태", "tr": "Ücretler ve kaynak durumu", "ar": "الرسوم وحالة المصادر", "es": "Comisiones y estado de fuentes", "pt-BR": "Taxas e situação das fontes", "fr": "Frais et état des sources", "de": "Gebühren und Quellenstatus", "ru": "Комиссии и статус источников", "id": "Biaya dan status sumber", "vi": "Phí và trạng thái nguồn", "it": "Commissioni e stato delle fonti"};
const factbookFeeRecordCopy = {
  en: ["Current fees have not completed source review. These records cannot establish your trading cost.", "View recorded fee fields", "Tier and volume labels are unverified research records; confirm current terms with the platform."],
  "zh-Hans": ["现行费率尚未完成来源核验，不能据此计算你的交易成本。", "查看记录中的费用字段", "等级和交易量标签属于待核验研究记录，请向平台确认现行条件。"],
  "zh-Hant": ["現行費率尚未完成來源核驗，不能據此計算你的交易成本。", "查看記錄中的費用欄位", "等級和交易量標籤屬於待核驗研究記錄，請向平台確認現行條件。"],
  ja: ["現在の手数料は出典確認が完了していません。この記録から取引コストは算出できません。", "記録された手数料項目を見る", "ランクと取引量のラベルは未確認の調査記録です。現在の条件は取引所で確認してください。"],
  ko: ["현재 수수료의 출처 검토가 완료되지 않았습니다. 이 기록으로 거래 비용을 계산할 수 없습니다.", "기록된 수수료 항목 보기", "등급과 거래량 표시는 검증되지 않은 조사 기록입니다. 현재 조건은 플랫폼에서 확인하세요."],
  tr: ["Güncel ücretlerin kaynak incelemesi tamamlanmadı. Bu kayıtlar işlem maliyetinizi belirlemez.", "Kayıtlı ücret alanlarını göster", "Seviye ve hacim etiketleri doğrulanmamış araştırma kayıtlarıdır; güncel koşulları platformdan teyit edin."],
  ar: ["لم تكتمل مراجعة مصادر الرسوم الحالية. لا يمكن تحديد تكلفة تداولك من هذه السجلات.", "عرض حقول الرسوم المسجلة", "تسميات المستويات والحجم سجلات بحث غير متحقق منها؛ تأكد من الشروط الحالية لدى المنصة."],
  es: ["La revisión de fuentes de las comisiones actuales no está completa. Estos registros no permiten calcular tu coste de negociación.", "Ver campos de comisiones registrados", "Los niveles y volúmenes son registros de investigación sin verificar; confirma las condiciones actuales en la plataforma."],
  "pt-BR": ["A revisão das fontes das taxas atuais não foi concluída. Estes registros não permitem calcular seu custo de negociação.", "Ver campos de taxas registrados", "Níveis e volumes são registros de pesquisa não verificados; confirme as condições atuais na plataforma."],
  fr: ["La vérification des sources des frais actuels n’est pas terminée. Ces données ne permettent pas de calculer votre coût de transaction.", "Voir les champs de frais enregistrés", "Les niveaux et volumes sont des données de recherche non vérifiées ; confirmez les conditions actuelles auprès de la plateforme."],
  de: ["Die Quellenprüfung der aktuellen Gebühren ist nicht abgeschlossen. Diese Aufzeichnungen bestimmen Ihre Handelskosten nicht.", "Erfasste Gebührenfelder ansehen", "Stufen und Volumenangaben sind ungeprüfte Forschungsdaten; bestätigen Sie aktuelle Bedingungen bei der Plattform."],
  ru: ["Проверка источников текущих комиссий не завершена. По этим записям нельзя рассчитать ваши торговые расходы.", "Посмотреть записанные поля комиссий", "Уровни и объёмы — непроверенные исследовательские записи. Уточняйте текущие условия на платформе."],
  id: ["Peninjauan sumber biaya saat ini belum selesai. Catatan ini tidak dapat menentukan biaya perdagangan Anda.", "Lihat kolom biaya yang tercatat", "Label tingkat dan volume merupakan catatan riset yang belum diverifikasi; pastikan ketentuan terkini di platform."],
  vi: ["Việc kiểm tra nguồn phí hiện tại chưa hoàn tất. Không thể tính chi phí giao dịch từ các bản ghi này.", "Xem các trường phí đã ghi", "Nhãn cấp và khối lượng là dữ liệu nghiên cứu chưa xác minh; hãy kiểm tra điều kiện hiện tại trên nền tảng."],
  it: ["La verifica delle fonti delle commissioni attuali non è completa. Questi dati non permettono di calcolare il costo di negoziazione.", "Vedi i campi delle commissioni registrati", "Livelli e volumi sono dati di ricerca non verificati; conferma le condizioni attuali sulla piattaforma."]
};

// One line in place of a tier table whose every cell is pending. {n} = number of recorded tiers.
const factbookVipPendingCopy = {
  en: "{n} recorded fee tiers: not yet source-reviewed.",
  "zh-Hans": "已记录 {n} 个费率档位：尚未完成来源核验。",
  "zh-Hant": "已記錄 {n} 個費率等級：尚未完成來源核驗。",
  ja: "記録済みの手数料ランク {n} 件：出典確認はまだです。",
  ko: "기록된 수수료 등급 {n}개: 아직 출처 검토 전입니다.",
  tr: "Kayıtlı {n} ücret kademesi: henüz kaynakla incelenmedi.",
  ar: "{n} مستويات رسوم مسجلة: لم تُراجع مصادرها بعد.",
  es: "{n} niveles de comisión registrados: aún sin revisión de fuente.",
  "pt-BR": "{n} níveis de taxa registrados: fonte ainda não revisada.",
  fr: "{n} niveaux de frais enregistrés : pas encore vérifiés à la source.",
  de: "{n} erfasste Gebührenstufen: noch nicht quellengeprüft.",
  ru: "Записано уровней комиссии: {n}. Источник ещё не проверен.",
  id: "{n} tingkat biaya tercatat: sumber belum ditinjau.",
  vi: "{n} bậc phí đã ghi nhận: chưa rà soát nguồn.",
  it: "{n} livelli di commissione registrati: fonte non ancora verificata.",
};
// Shown when exchange-facts.js has checked base (non-VIP) fees for the venue. {date} = that check date.
const factbookBaseFeeCheckedCopy = {
  en: "Base (non-VIP) fees above were checked on the official fee page on {date}. VIP tiers, net rates and discounts below are unverified research records.",
  "zh-Hans": "以上基础（非 VIP）费率已于 {date} 在官方费率页核对。下方 VIP 档位、净费率和折扣仍为待核验研究记录。",
  "zh-Hant": "以上基礎（非 VIP）費率已於 {date} 在官方費率頁核對。下方 VIP 等級、淨費率和折扣仍為待核驗研究記錄。",
  ja: "上記の基本（非VIP）手数料は {date} に公式手数料ページで確認しました。下のVIPランク、実質手数料、割引は未確認の調査記録です。",
  ko: "위 기본(비VIP) 수수료는 {date}에 공식 수수료 페이지에서 확인했습니다. 아래 VIP 등급, 순수수료, 할인은 검증되지 않은 조사 기록입니다.",
  tr: "Yukarıdaki temel (VIP dışı) ücretler {date} tarihinde resmî ücret sayfasında kontrol edildi. Aşağıdaki VIP kademeleri, net oranlar ve indirimler doğrulanmamış araştırma kayıtlarıdır.",
  ar: "تم التحقق من الرسوم الأساسية (غير VIP) أعلاه في صفحة الرسوم الرسمية بتاريخ {date}. مستويات VIP والرسوم الصافية والخصومات أدناه سجلات بحث غير متحقق منها.",
  es: "Las comisiones base (sin VIP) de arriba se verificaron en la página oficial de comisiones el {date}. Los niveles VIP, tarifas netas y descuentos de abajo son registros de investigación sin verificar.",
  "pt-BR": "As taxas base (sem VIP) acima foram verificadas na página oficial de taxas em {date}. Níveis VIP, taxas líquidas e descontos abaixo são registros de pesquisa não verificados.",
  fr: "Les frais de base (hors VIP) ci-dessus ont été vérifiés sur la page officielle des frais le {date}. Les niveaux VIP, frais nets et remises ci-dessous sont des données de recherche non vérifiées.",
  de: "Die Basisgebühren (ohne VIP) oben wurden am {date} auf der offiziellen Gebührenseite geprüft. VIP-Stufen, Nettogebühren und Rabatte unten sind ungeprüfte Forschungsdaten.",
  ru: "Базовые комиссии (без VIP) выше проверены на официальной странице комиссий {date}. Уровни VIP, чистые ставки и скидки ниже — непроверенные исследовательские записи.",
  id: "Biaya dasar (non-VIP) di atas diperiksa di halaman biaya resmi pada {date}. Tingkat VIP, tarif bersih, dan diskon di bawah adalah catatan riset yang belum diverifikasi.",
  vi: "Phí cơ bản (không VIP) ở trên đã được kiểm tra trên trang phí chính thức vào {date}. Bậc VIP, phí ròng và ưu đãi bên dưới là dữ liệu nghiên cứu chưa xác minh.",
  it: "Le commissioni base (non VIP) qui sopra sono state verificate sulla pagina ufficiale delle commissioni il {date}. Livelli VIP, commissioni nette e sconti qui sotto sono dati di ricerca non verificati.",
};

function factbookValueClass(value) {
  const text = String(value ?? "");
  return /^[\s\d.,%$≈~<>+\-–/A-Za-z]{1,14}$/.test(text) && /\d/.test(text) ? "factbook-value factbook-value--figure" : "factbook-value";
}

// Unreviewed fields collapse into one sentence ("5 fields not yet reviewed: a, b, c.") instead of an empty label/value grid.
const PENDING_LINE = {
  en: (n, l) => `${n} fields not yet reviewed: ${l}.`,
  "zh-Hans": (n, l) => `${n} 项尚未复核：${l}。`,
  "zh-Hant": (n, l) => `${n} 項尚未複核：${l}。`,
  ja: (n, l) => `未確認の項目 ${n} 件：${l}。`,
  ko: (n, l) => `아직 검토하지 않은 항목 ${n}개: ${l}.`,
  es: (n, l) => `${n} campos aún sin revisar: ${l}.`,
  "pt-BR": (n, l) => `${n} campos ainda não revisados: ${l}.`,
  fr: (n, l) => `${n} champs pas encore vérifiés : ${l}.`,
  de: (n, l) => `${n} Felder noch nicht geprüft: ${l}.`,
  it: (n, l) => `${n} campi non ancora verificati: ${l}.`,
  ru: (n, l) => `Ещё не проверено полей: ${n} — ${l}.`,
  tr: (n, l) => `Henüz incelenmeyen ${n} alan: ${l}.`,
  id: (n, l) => `${n} kolom belum ditinjau: ${l}.`,
  vi: (n, l) => `${n} mục chưa được rà soát: ${l}.`,
  ar: (n, l) => `${n} حقول لم تُراجع بعد: ${l}.`,
};
const LINKED_NOT_REVIEWED = {
  en: "Official page linked, figures not yet reviewed.",
  "zh-Hans": "已链接官方页面，数字尚未复核。",
  "zh-Hant": "已連結官方頁面，數字尚未複核。",
  ja: "公式ページあり・数値は未確認です。",
  ko: "공식 페이지가 연결되어 있으며 수치는 아직 검토하지 않았습니다.",
  es: "Página oficial enlazada; cifras aún sin revisar.",
  "pt-BR": "Página oficial vinculada; números ainda não revisados.",
  fr: "Page officielle liée ; chiffres pas encore vérifiés.",
  de: "Offizielle Seite verlinkt; Zahlen noch nicht geprüft.",
  it: "Pagina ufficiale collegata; cifre non ancora verificate.",
  ru: "Официальная страница указана; цифры ещё не проверены.",
  tr: "Resmî sayfa bağlantılı; rakamlar henüz incelenmedi.",
  id: "Halaman resmi ditautkan; angka belum ditinjau.",
  vi: "Đã liên kết trang chính thức; số liệu chưa được rà soát.",
  ar: "الصفحة الرسمية مرتبطة؛ لم تُراجع الأرقام بعد.",
};
const pickLocale = (map, locale) => map[locale] || map[String(locale || "").split("-")[0]] || map.en;
const pendingFieldsLine = (locale, labels) => {
  const list = labels.filter(Boolean);
  const zh = String(locale || "").startsWith("zh") || locale === "ja";
  return pickLocale(PENDING_LINE, locale)(list.length, list.join(zh ? "、" : ", "));
};
const linkedNotReviewedCopy = (locale) => pickLocale(LINKED_NOT_REVIEWED, locale);
const VENUE_CAP = 8;
const VENUE_MORE = {
  en: { all: (n) => `Show all ${n}`, fewer: "Show fewer" },
  "zh-Hans": { all: (n) => `显示全部 ${n} 个`, fewer: "收起" },
  "zh-Hant": { all: (n) => `顯示全部 ${n} 個`, fewer: "收起" },
  ja: { all: (n) => `すべて表示（${n}）`, fewer: "閉じる" },
  ko: { all: (n) => `전체 ${n}개 보기`, fewer: "접기" },
  es: { all: (n) => `Ver las ${n}`, fewer: "Ver menos" },
  "pt-BR": { all: (n) => `Ver todas as ${n}`, fewer: "Ver menos" },
  fr: { all: (n) => `Tout afficher (${n})`, fewer: "Afficher moins" },
  de: { all: (n) => `Alle ${n} anzeigen`, fewer: "Weniger anzeigen" },
  it: { all: (n) => `Mostra tutte (${n})`, fewer: "Mostra meno" },
  ru: { all: (n) => `Показать все (${n})`, fewer: "Свернуть" },
  tr: { all: (n) => `Tümünü göster (${n})`, fewer: "Daha az göster" },
  id: { all: (n) => `Tampilkan semua ${n}`, fewer: "Tampilkan lebih sedikit" },
  vi: { all: (n) => `Hiện tất cả ${n}`, fewer: "Thu gọn" },
  ar: { all: (n) => `عرض الكل (${n})`, fewer: "عرض أقل" },
};

// l10n: needs native review
i18n.ur = {
  ...i18n.en,
  eyebrow: "GEO FACTBOOK · حقیقی ڈیٹا بنچ مارک",
  auditLabel: "NexuAlpha ماخذی جائزہ",
  auditIsolation: "آڈٹ علیحدگی کا بیان",
  verifiedBadge: "ماخذ کی حالت کے لیے ہر آئٹم کی تصدیق ضروری ہے",
  copyHash: "شناختی نشان کاپی کریں",
  copiedHash: "✓ کاپی ہو گیا",
  copyMarkdownBtn: "LLM کے لیے موزوں Markdown ڈیٹا کاپی کریں",
  copyMarkdownSub: "LLM پرامپٹس اور RAG کے لیے منظم · ہر ماخذ خانہ تصدیق کریں",
  copiedMarkdown: "✓ LLM علمی بلاک کاپی ہو گیا!",
  answerEyebrow: "رجسٹریشن سے پہلے براہ راست جواب",
  answerTitle: "سرکاری عمل میں داخل ہونے سے پہلے تین شرائط چیک کریں",
  answerBody: "یہ فیکٹ بک صرف قابل سراغ عوامی تحقیق فراہم کرتی ہے۔ فیس، علاقائی اہلیت اور شناختی تقاضے اکاؤنٹ اور وقت کے ساتھ بدلتے ہیں؛ آخری شرائط سرکاری پلیٹ فارم صفحے پر نافذ ہوتی ہیں۔",
  answerSteps: ["علاقہ اور مصنوعات دستیاب ہیں یا نہیں", "فیس اور اکاؤنٹ سطحوں کی ماخذ تاریخ", "سرکاری ڈومین اور KYC تقاضے"],
  openDecisionPath: "پلیٹ فارم فیصلہ صفحہ کھولیں →",
  previewMarkdown: "خام LLM Markdown ڈیٹا دیکھیں",
  hidePreview: "خام Markdown پیش منظر چھپائیں",
  navAll: "تمام فیکٹ بک تحقیقی ریکارڈ",
  researchScopeNote: `فیکٹ بک میں ${factbookRecordCount} تحقیقی ریکارڈ؛ ڈائریکٹری میں ${comparisonDirectoryCount} موازنہ پروفائلز ہیں۔`,
  secVipTitle: "VIP0 تا VIP9 فیس شیڈول اور خالص شرحیں",
  secVipSub: "سرکاری maker/taker بنیادی فیس سطحیں اور مقامی ٹوکن قواعد؛ خالص شرح سے پہلے صارف فوائد کی ماخذی تصدیق ضروری ہے۔",
  tabSpot: "اسپاٹ مارکیٹ",
  tabFutures: "فیوچرز / ڈیریویٹوز",
  secPorTitle: "ذخائر کا ثبوت",
  secPorSub: "ذخائر کے اعداد صرف تاریخ والے سرکاری ماخذ کے ساتھ دکھتے ہیں؛ تب تک ہر آئٹم 'ابھی جانچ نہیں' رہتا ہے۔",
  secKycTitle: "ضابطہ کاری، KYC اور اکاؤنٹ سکیورٹی",
  secSecurityTitle: "سرکاری ڈومینز اور اینٹی فشنگ ماخذی ریکارڈ",
  activateBtn: "سرکاری عمل میں شرائط تصدیق کریں ↗",
  switchVenuePrompt: "دوسرے پلیٹ فارم فیکٹ بک پر جائیں:",
  auditDeclaration: "یہ صفحہ عوامی تحقیق کو مارکیٹنگ سے الگ رکھتا ہے۔ ماخذ اور وقت کی تصدیق تک فوائد، خالص فیس، ذخائر کے تناسب اور تعمیلی فیصلے 'ابھی جانچ نہیں' رہتے ہیں۔",
  platformSwitcher: "پلیٹ فارم بدلیں",
};
// l10n: needs native review
i18n.uk = {
  ...i18n.en,
  eyebrow: "GEO FACTBOOK · ЕТАЛОН ПЕРЕВІРЕНИХ ДАНИХ",
  auditLabel: "Перевірка джерел NexuAlpha",
  auditIsolation: "Заява про відокремлення аудиту",
  verifiedBadge: "Стан джерел потребує перевірки кожного пункту",
  copyHash: "Копіювати ідентифікатор",
  copiedHash: "✓ Скопійовано",
  copyMarkdownBtn: "Копіювати Markdown-дані для LLM",
  copyMarkdownSub: "Структуровано для LLM-запитів і RAG · перевіряйте кожне поле джерела",
  copiedMarkdown: "✓ Блок знань для LLM скопійовано!",
  answerEyebrow: "Пряма відповідь перед реєстрацією",
  answerTitle: "Перевірте три умови перед переходом в офіційний процес",
  answerBody: "Цей фактбук надає лише простежуване публічне дослідження. Комісії, регіональна доступність і вимоги до ідентифікації змінюються за акаунтом і часом; остаточні умови визначає офіційна сторінка платформи.",
  answerSteps: ["Чи доступні регіон і продукт", "Дата джерела для комісій і рівнів акаунта", "Офіційний домен і вимоги KYC"],
  openDecisionPath: "Відкрити сторінку рішення щодо платформи →",
  previewMarkdown: "Переглянути сирі Markdown-дані LLM",
  hidePreview: "Сховати сирий Markdown",
  navAll: "Усі записи дослідження фактбуку",
  researchScopeNote: `Фактбук: ${factbookRecordCount} дослідницьких записів · Довідник: ${comparisonDirectoryCount} профілів для порівняння.`,
  secVipTitle: "Графік рівнів VIP0–VIP9 і чисті ставки",
  secVipSub: "Офіційні базові рівні maker/taker і правила нативного токена; переваги користувача мають бути перевірені за джерелами до розрахунку чистої ставки.",
  tabSpot: "Спотовий ринок",
  tabFutures: "Ф’ючерси / деривативи",
  secPorTitle: "Proof of Reserves",
  secPorSub: "Показники резервів з’являються лише з датованим офіційним джерелом; до того кожен пункт позначений як ще не перевірений.",
  secKycTitle: "Регуляторна відповідність, KYC і безпека акаунта",
  secSecurityTitle: "Офіційні домени й записи проти фішингу",
  activateBtn: "Підтвердити умови в офіційному процесі ↗",
  switchVenuePrompt: "Перейти до фактбуку іншої платформи:",
  auditDeclaration: "Ця сторінка відокремлює публічне дослідження від маркетингу. Переваги, чисті ставки, коефіцієнти резервів і висновки щодо відповідності залишаються 'ще не перевірено' до підтвердження джерела й часу.",
  platformSwitcher: "Перемкнути платформу",
};

// l10n: needs native review
factbookStateCopy.ur = { ...factbookStateCopy.en, signupTitle: "پارٹنر رجسٹریشن راستہ", signupButton: "پارٹنر رجسٹریشن راستہ کھولیں ↗", inviteCodeLabel: "ریفرل کوڈ", rebatePercentLabel: "صارف فائدے کی حالت", welcomePackage: "ویلکم پیکج", pendingReview: "سرکاری ماخذ کی تصدیق زیر انتظار", officialDisclosure: "سرکاری افشا دیکھیں", amountUnpublished: "ماخذی جائزے تک رقم شائع نہیں", noSource: "قابل تکرار ماخذ درج نہیں", noItemSource: "آئٹم سطح کا ماخذ درج نہیں" };
// l10n: needs native review
factbookStateCopy.uk = { ...factbookStateCopy.en, signupTitle: "маршрут партнерської реєстрації", signupButton: "Відкрити маршрут партнерської реєстрації ↗", inviteCodeLabel: "Реферальний код", rebatePercentLabel: "Стан переваги користувача", welcomePackage: "Вітальний пакет", pendingReview: "Очікує перевірки офіційного джерела", officialDisclosure: "Див. офіційне розкриття", amountUnpublished: "Сума не публікується до перевірки джерела", noSource: "Відтворюване джерело не записано", noItemSource: "Джерело на рівні пункту не записано" };
// l10n: needs native review
factbookLocaleOverrides.ur = { titleSuffix: "ماخذی جائزہ فیکٹ بک", trustPending: "اعتماد کی حالت: ماخذی تصدیق زیر انتظار", sourceTools: "ماخذی نوٹس اور ڈیٹا ایکسپورٹ", foundedLabel: "قیام", hqLabel: "مرکز", primaryLabel: "سرکاری سائٹ", rawMarkdownTitle: "Markdown ماخذی ریکارڈ (استعمال سے پہلے سرکاری ماخذ چیک کریں)", copyLabel: "کاپی", platformSwitcher: "پلیٹ فارم بدلیں" };
// l10n: needs native review
factbookLocaleOverrides.uk = { titleSuffix: "Фактбук перевірки джерел", trustPending: "Стан довіри: очікує перевірки джерела", sourceTools: "Нотатки джерел і експорт даних", foundedLabel: "Засновано", hqLabel: "Штаб-квартира", primaryLabel: "Офіційний сайт", rawMarkdownTitle: "Markdown-запис джерел (перевірте офіційні джерела перед використанням)", copyLabel: "Копіювати", platformSwitcher: "Перемкнути платформу" };
// l10n: needs native review
factbookRecordToolsCopy.ur = { sourceTools: "ماخذی نوٹس اور ڈیٹا ایکسپورٹ", hashLabel: "ریکارڈ شناختی نشان", copyHash: "شناختی نشان کاپی کریں", auditIsolation: "ماخذی نوٹس", copyMarkdownBtn: "Markdown ڈیٹا کاپی کریں", copiedMarkdown: "ڈیٹا کاپی ہو گیا", copiedHash: "شناختی نشان کاپی ہو گیا", previewMarkdown: "Markdown ڈیٹا دیکھیں", hidePreview: "Markdown ڈیٹا چھپائیں", rawMarkdownTitle: "Markdown ماخذی ریکارڈ (استعمال سے پہلے سرکاری ماخذ چیک کریں)", copyLabel: "کاپی", copyMarkdownSub: "Markdown ماخذی ریکارڈ (استعمال سے پہلے سرکاری ماخذ چیک کریں)" };
// l10n: needs native review
factbookRecordToolsCopy.uk = { sourceTools: "Нотатки джерел і експорт даних", hashLabel: "Ідентифікатор запису", copyHash: "Копіювати ідентифікатор", auditIsolation: "Нотатки джерел", copyMarkdownBtn: "Копіювати Markdown-дані", copiedMarkdown: "Дані скопійовано", copiedHash: "Ідентифікатор скопійовано", previewMarkdown: "Переглянути Markdown-дані", hidePreview: "Сховати Markdown-дані", rawMarkdownTitle: "Markdown-запис джерел (перевірте офіційні джерела перед використанням)", copyLabel: "Копіювати", copyMarkdownSub: "Markdown-запис джерел (перевірте офіційні джерела перед використанням)" };
factbookFeeStatusTitles.ur = "فیس اور ماخذ کی حالت";
factbookFeeStatusTitles.uk = "Комісії та стан джерел";
// l10n: needs native review
factbookFeeRecordCopy.ur = ["موجودہ فیس کا ماخذی جائزہ مکمل نہیں۔ یہ ریکارڈ آپ کی ٹریڈنگ لاگت ثابت نہیں کرتے۔", "درج فیس خانے دیکھیں", "سطح اور حجم کے لیبل غیر تصدیق شدہ تحقیقی ریکارڈ ہیں؛ موجودہ شرائط پلیٹ فارم سے تصدیق کریں۔"];
// l10n: needs native review
factbookFeeRecordCopy.uk = ["Перевірку джерел поточних комісій не завершено. Ці записи не визначають ваші торгові витрати.", "Переглянути записані поля комісій", "Позначки рівнів і обсягів є неперевіреними дослідницькими записами; підтвердіть поточні умови на платформі."];
factbookVipPendingCopy.ur = "درج فیس سطحیں: {n}؛ ماخذی جائزہ ابھی نہیں ہوا۔";
factbookVipPendingCopy.uk = "Записано рівнів комісій: {n}; джерело ще не перевірено.";
factbookBaseFeeCheckedCopy.ur = "اوپر بنیادی (غیر VIP) فیس {date} کو سرکاری فیس صفحے پر چیک کی گئیں۔ نیچے VIP سطحیں، خالص شرحیں اور رعایتیں غیر تصدیق شدہ تحقیقی ریکارڈ ہیں۔";
factbookBaseFeeCheckedCopy.uk = "Базові (не VIP) комісії вище перевірено на офіційній сторінці комісій {date}. Рівні VIP, чисті ставки й знижки нижче є неперевіреними дослідницькими записами.";
PENDING_LINE.ur = (n, l) => `${n} خانے ابھی جائزہ شدہ نہیں: ${l}۔`;
PENDING_LINE.uk = (n, l) => `Ще не перевірено полів: ${n} — ${l}.`;
LINKED_NOT_REVIEWED.ur = "سرکاری صفحہ منسلک ہے؛ اعداد ابھی جائزہ شدہ نہیں۔";
LINKED_NOT_REVIEWED.uk = "Офіційну сторінку пов’язано; числа ще не перевірено.";
VENUE_MORE.ur = { all: (n) => `تمام ${n} دکھائیں`, fewer: "کم دکھائیں" };
VENUE_MORE.uk = { all: (n) => `Показати всі (${n})`, fewer: "Показати менше" };

const venueMoreCopy = (locale) => VENUE_MORE[locale] || VENUE_MORE[String(locale || "").split("-")[0]] || VENUE_MORE.en;
const sentenceCase = (v) => { const t = String(v || ""); return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : t; };

export function FactbookPage({ slug = "binance", locale = "en", market, product }) {
  const currentLocale = locale.startsWith("zh-Hant") ? "zh-Hant" : locale.startsWith("zh") ? "zh-Hans" : "en";
  const localeBase = String(locale || "").split("-")[0];
  const t = { ...(i18n[currentLocale] || i18n[localeBase] || i18n.en), ...(factbookLocaleOverrides[locale] || factbookLocaleOverrides[localeBase] || {}), ...(factbookRecordToolsCopy[locale] || factbookRecordToolsCopy[localeBase] || factbookRecordToolsCopy.en), ...factbookStateLabels(locale) };
  const feeRecordCopy = factbookFeeRecordCopy[locale] || factbookFeeRecordCopy[localeBase] || factbookFeeRecordCopy.en;
  const baseFeesCheckedOn = venueCheckedOn(slug);
  const factbookUi = {
    ur: { solvency: "ذخائر اور ادائیگی کی صلاحیت", regulation: "ضابطہ کاری اور KYC", endpoints: "اینڈ پوائنٹس اور اجازت فہرست", totalNote: "سرکاری شائع شدہ ڈیٹا کا کل", nativeNote: "مقامی ٹوکن نمائش", expandReserve: "تمام ذخائر ڈیٹا کھولیں", expandCompliance: "تمام تعمیلی ڈیٹا کھولیں", expandSecurity: "تمام درج اینڈ پوائنٹس کھولیں" },
    uk: { solvency: "Резерви й платоспроможність", regulation: "Регулювання та KYC", endpoints: "Ендпоїнти й білий список", totalNote: "Підсумок офіційно опублікованих даних", nativeNote: "Експозиція до нативного токена", expandReserve: "Відкрити всі дані резервів", expandCompliance: "Відкрити всі дані відповідності", expandSecurity: "Відкрити всі записані ендпоїнти" },
    ja: { solvency: "準備金と支払能力", regulation: "規制とKYC", endpoints: "エンドポイントとホワイトリスト", totalNote: "公式公開データの合計", nativeNote: "自社トークンへのエクスポージャー", expandReserve: "準備金データをすべて表示", expandCompliance: "コンプライアンスデータをすべて表示", expandSecurity: "セキュリティ端点をすべて表示" },
    ko: { solvency: "준비금 및 지급능력", regulation: "규제 및 KYC", endpoints: "엔드포인트 및 화이트리스트", totalNote: "공식 공개 데이터 총합", nativeNote: "자체 토큰 노출 위험", expandReserve: "전체 준비금 데이터 열기", expandCompliance: "전체 규제 데이터 열기", expandSecurity: "전체 기록된 엔드포인트 열기" },
    tr: { solvency: "Rezervler ve ödeme gücü", regulation: "Düzenleme ve KYC", endpoints: "Uç noktalar ve beyaz liste", totalNote: "Resmî yayımlanan verilerin toplamı", nativeNote: "Yerel token maruziyeti", expandReserve: "Tüm rezerv verilerini aç", expandCompliance: "Tüm uyum verilerini aç", expandSecurity: "Tüm kayıtlı uç noktalarnı aç" },
  }[localeBase] || {};
  const isHant = currentLocale === "zh-Hant";
  const isZh = currentLocale.startsWith("zh");
  const titleSuffix = {
    ja: "ソース審査ファクトブック", ko: "출처 검토 팩트북", tr: "Kaynak inceleme bilgi kitabı",
    ar: "دليل مراجعة المصادر", "pt-BR": "Factbook de revisão de fontes", es: "Factbook de revisión de fuentes",
    fr: "Factbook de vérification des sources", de: "Quellenprüfungs-Factbook", ru: "Фактбук проверки источников",
    id: "Factbook tinjauan sumber", vi: "Factbook rà soát nguồn", it: "Factbook di revisione delle fonti", ur: "ماخذی جائزہ فیکٹ بک", uk: "Фактбук перевірки джерел",
  }[locale] || (isHant ? "來源審閱事實庫" : isZh ? "来源审阅事实库" : "Source Review Factbook");
  const publicAuditDeclaration = isZh
    ? (isHant ? "本頁面只展示可追溯的公開資料；未完成來源與時間核驗的獎勵、淨費率、儲備率和合規判斷均保持待核驗。" : "本页面只展示可追溯的公开资料；未完成来源与时间核验的奖励、净费率、储备率和合规判断均保持待核验。")
    : (factbookLocaleOverrides[locale]?.auditDeclaration || factbookLocaleOverrides[localeBase]?.auditDeclaration || "This page separates public research from marketing. Rewards, net rates, reserve ratios and compliance judgments are marked “not yet checked” until their source and timestamp are verified.");

  const [feeTab, setFeeTab] = useState("spot");
  const [copiedMd, setCopiedMd] = useState("idle");
  const [copiedHash, setCopiedHash] = useState("idle");
  const [showRawMd, setShowRawMd] = useState(false);
  const factbookCopyMountedRef = useRef(true);
  const mdCopyRequestRef = useRef(0);
  const hashCopyRequestRef = useRef(0);
  const mdCopyTimerRef = useRef(null);
  const hashCopyTimerRef = useRef(null);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [showAllVenues, setShowAllVenues] = useState(false);
  const [expandedFactbookSections, setExpandedFactbookSections] = useState({});
  const [showAllFeeTiers, setShowAllFeeTiers] = useState(false);



  const venue = useMemo(() => {
    return publicFactbookVenue(FACTBOOK_REGISTRY[slug] || FACTBOOK_REGISTRY.binance, locale);
  }, [slug, locale]);
  const activationCta = useMemo(() => publicCtaForVenue(venue.slug, locale), [venue.slug, locale]);
  // Audit NX-02/NX-06: partner benefit status and the record dates come from the shared records, not from this page.
  const partnerBenefit = partnerBenefitParts(venue.slug, locale);
  const recordDates = factbookDates(venue.slug);
  const recordDatesCopy = factbookDatesCopy(locale);
  const hasVenueProfile = useMemo(
    () => !factbookOnlyDecisionSlugs.has(venue.slug) && neutralVenueCatalog.some((candidate) => candidate.slug === venue.slug),
    [venue.slug],
  );
  const decisionHref = hasVenueProfile
    ? localizedHref(`/exchanges/${encodeURIComponent(venue.slug)}#registration-path`, { locale, market, product })
    : localizedHref(`/factbook/${encodeURIComponent(venue.slug)}#security`, { locale, market, product });
  const FeeRecords = venue.feeVerified ? "div" : "details";
  const venueAnswer = locale === "en" ? venueAnswerOverrides[venue.slug]?.en : null;

  const rawMarkdown = useMemo(() => {
    return generateLlmMarkdown(venue);
  }, [venue]);

  useEffect(() => {
    factbookCopyMountedRef.current = true;
    setCopiedMd("idle");
    setCopiedHash("idle");
    setShowRawMd(false);
    return () => {
      factbookCopyMountedRef.current = false;
      mdCopyRequestRef.current += 1;
      hashCopyRequestRef.current += 1;
      if (mdCopyTimerRef.current !== null) {
        clearTimeout(mdCopyTimerRef.current);
        mdCopyTimerRef.current = null;
      }
      if (hashCopyTimerRef.current !== null) {
        clearTimeout(hashCopyTimerRef.current);
        hashCopyTimerRef.current = null;
      }
    };
  }, [venue.slug, venue.auditHash, rawMarkdown, locale]);

  const scheduleFactbookCopyReset = useCallback((timerRef, setStatus, requestRef, request, timeout) => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (factbookCopyMountedRef.current && requestRef.current === request) {
        setStatus("idle");
        timerRef.current = null;
      }
    }, timeout);
  }, []);

  const handleCopyMarkdown = useCallback(() => {
    const request = ++mdCopyRequestRef.current;
    if (mdCopyTimerRef.current !== null) {
      clearTimeout(mdCopyTimerRef.current);
      mdCopyTimerRef.current = null;
    }
    setCopiedMd("idle");
    copyFactbookValue(rawMarkdown, setCopiedMd, {
      revealManual: () => setShowRawMd(true),
      timeout: 2500,
      isActive: () => factbookCopyMountedRef.current && mdCopyRequestRef.current === request,
      scheduleReset: (setStatus, timeout) => scheduleFactbookCopyReset(mdCopyTimerRef, setStatus, mdCopyRequestRef, request, timeout),
    });
  }, [rawMarkdown, scheduleFactbookCopyReset]);

  const handleCopyHash = useCallback(() => {
    const request = ++hashCopyRequestRef.current;
    if (hashCopyTimerRef.current !== null) {
      clearTimeout(hashCopyTimerRef.current);
      hashCopyTimerRef.current = null;
    }
    setCopiedHash("idle");
    copyFactbookValue(venue.auditHash, setCopiedHash, {
      isActive: () => factbookCopyMountedRef.current && hashCopyRequestRef.current === request,
      scheduleReset: (setStatus, timeout) => scheduleFactbookCopyReset(hashCopyTimerRef, setStatus, hashCopyRequestRef, request, timeout),
    });
  }, [venue.auditHash, scheduleFactbookCopyReset]);

  const toggleFactbookSection = useCallback((section) => {
    setExpandedFactbookSections((current) => ({ ...current, [section]: !current[section] }));
  }, []);

  const filteredSlugs = useMemo(() => {
    if (filterCategory === "ALL") return FACTBOOK_SLUGS;
    return FACTBOOK_SLUGS.filter((s) => {
      const v = publicFactbookVenue(FACTBOOK_REGISTRY[s], locale);
      if (filterCategory === "CEX") return v.category === "CEX";
      if (filterCategory === "PERP") return v.category === "Perp DEX";
      if (filterCategory === "DEX") return v.category === "DEX";
      return true;
    });
  }, [filterCategory, locale]);

  return (
    <main className="v6 factbook-page" id="factbook-root" dir={["ar", "ur"].includes(localeBase) ? "rtl" : "ltr"}>
      {/* 极客终端审计头部 */}
      <div className="factbook-hero" role="region" aria-label={isHant ? "事實庫概覽" : isZh ? "事实库概览" : "Factbook overview"}>
        <div className="factbook-hero__container">


          <div className="factbook-hero__main">
            <div className="factbook-venue-identity">
              <div className="factbook-venue-logo-wrap">
                <BrandMark slug={venue.slug} />
              </div>
              <div className="factbook-venue-title-wrap">
                <h1 className="factbook-venue-title">{venue.name} {titleSuffix}</h1>
                <p className="factbook-category-tag">{venue.category} · {venue.trustScore ? `Trust Score ${venue.trustScore}/10` : (isHant ? "信任評分待核驗" : isZh ? "信任评分待核验" : (t.trustPending || "Trust score pending source review"))}</p>
                <dl className="factbook-venue-meta">
                  <div><dt>{t.foundedLabel}</dt><dd>{venue.foundedYear}</dd></div>
                  <div><dt>{t.hqLabel}</dt><dd>{venue.headquarters}</dd></div>
                  <div><dt>{t.primaryLabel}</dt><dd><a href={`https://${venue.officialDomain}`} target="_blank" rel="noopener noreferrer" className="factbook-domain-link" data-cta-kind="research" data-cta-platform={venue.slug} data-cta-placement="factbook-official-domain" data-growth-decision={venue.slug} data-growth-placement="factbook-official-domain">{venue.officialDomain}</a></dd></div>
                </dl>
              </div>
            </div>


          </div>

          <div className="factbook-hero__top-bar">
            <div className="factbook-badge-group">
              <span className="factbook-eyebrow">
                <span className="factbook-pulse" aria-hidden="true" />
                {t.eyebrow}
              </span>
              {/* The record's primary date is the fee check; the source-notes review date is labelled in "Source notes". */}
              <span className={`factbook-audit-stamp factbook-audit-stamp--fees${feesCheckedLabel(venue.slug, locale) ? "" : " factbook-audit-stamp--unchecked"}`}>{feesStatusLabel(venue.slug, locale)}</span>
              <span className="factbook-status-pill">
                ● {t.verifiedBadge}
              </span>
            </div>
            {/* Audit NX-06: three records, three dates — never one date standing in for all of them. */}
            <dl className="factbook-dates">
              <div><dt>{recordDatesCopy.fees}</dt><dd>{recordDates.feesCheckedOn ? <time dateTime={recordDates.feesCheckedOn}>{recordDates.feesCheckedOn}</time> : recordDatesCopy.notYet}</dd></div>
              <div><dt>{recordDatesCopy.benefit}</dt><dd>{recordDates.benefitConfirmedOn ? <time dateTime={recordDates.benefitConfirmedOn}>{recordDates.benefitConfirmedOn}</time> : recordDatesCopy.notYet}</dd></div>
              <div><dt>{recordDatesCopy.dossier}</dt><dd><time dateTime={recordDates.dossierCompiledOn}>{recordDates.dossierCompiledOn}</time></dd></div>
            </dl>

          </div>

          <section className="factbook-answer-card" aria-labelledby="factbook-direct-answer-title">
            <div className="factbook-answer-card__copy">
              <h2 id="factbook-direct-answer-title">{venueAnswer?.title || t.answerTitle}</h2>
              <p>{venueAnswer?.body || t.answerBody}</p>
            </div>
            <ol className="factbook-answer-card__steps" aria-label={t.answerEyebrow}>
              {(venueAnswer?.steps || t.answerSteps).map((step, index) => <li key={step}><i className="factbook-step-node" aria-hidden="true" /><span>{step}</span></li>)}
            </ol>
            <a className="factbook-answer-card__link" href={decisionHref} data-cta-kind="research" data-cta-platform={venue.slug} data-cta-placement="factbook-direct-answer" data-growth-decision={venue.slug} data-growth-placement="factbook-direct-answer" data-growth-market={market} data-growth-product={product}>
              {t.openDecisionPath}
            </a>
          </section>

          <details className="factbook-source-tools">
            <summary>{t.sourceTools}</summary>
            <div className="factbook-source-tools__body">
            {/* 来源说明与原始记录标识 */}
            <div className="factbook-audit-box">
              <div className="factbook-audit-box__header">
                <span className="factbook-audit-tag">{t.auditIsolation}</span>
                <time className="factbook-audit-date" dateTime={AUDIT_DATE}>{recordDatesCopy.dossier}: {AUDIT_DATE}</time>
                <button type="button" onClick={handleCopyHash} className="factbook-hash-copy-btn">
                  {copiedHash === "success" ? t.copiedHash : t.copyHash}
                </button>
              </div>
              <FactbookCopyStatus state={copiedHash} locale={locale} />
              <p className="factbook-audit-box__text">
                {publicAuditDeclaration}
              </p>
              <div className="factbook-audit-box__hash">
                <span className="factbook-hash-label">{t.hashLabel}:</span>
                <code className="factbook-hash-code">{venue.auditHash}</code>
              </div>
              {copiedHash === "error" && (
                <input
                  className="factbook-copy-manual-input"
                  aria-label={t.hashLabel}
                  readOnly
                  value={venue.auditHash}
                  onFocus={(event) => event.currentTarget.select()}
                  dir="ltr"
                  style={{ minHeight: 44, minWidth: 0, maxWidth: "100%", width: "100%" }}
                />
              )}
            </div>
            {/* 一键复制 LLM Markdown 杀手级按钮 */}
            <div className="factbook-llm-copy-action">
              <button
                type="button"
                className={`factbook-copy-btn ${copiedMd === "success" ? "factbook-copy-btn--success" : ""}`}
                onClick={handleCopyMarkdown}
                title={t.copyMarkdownSub}
              >
                <svg className="factbook-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </svg>
                <span>{copiedMd === "success" ? t.copiedMarkdown : t.copyMarkdownBtn}</span>
              </button>
              <FactbookCopyStatus state={copiedMd} locale={locale} />
              {/* the Markdown preview toggle sits in the same row as Copy Markdown */}
            <button
              type="button"
              className="factbook-preview-toggle-btn"
              aria-expanded={showRawMd}
              onClick={() => setShowRawMd(!showRawMd)}
            >
              {showRawMd ? t.hidePreview : t.previewMarkdown}<span aria-hidden="true" className="factbook-preview-toggle-btn__glyph">{showRawMd ? "−" : "＋"}</span>
            </button>
              {copiedMd === "error" && (
                <textarea
                  className="factbook-copy-manual-input factbook-copy-manual-input--markdown"
                  aria-label={t.previewMarkdown}
                  readOnly
                  value={rawMarkdown}
                  onFocus={(event) => event.currentTarget.select()}
                  dir="ltr"
                  style={{ minHeight: 96, minWidth: 0, maxWidth: "100%", width: "100%" }}
                />
              )}
            </div>

          {showRawMd && (
            <div className="factbook-raw-markdown-preview">
              <div className="factbook-raw-markdown-head">
                <span>{t.rawMarkdownTitle}</span>
                <button type="button" onClick={handleCopyMarkdown} className="factbook-raw-copy-btn">
                  {copiedMd === "success" ? t.copiedMarkdown : t.copyLabel}
                </button>
              </div>
              <pre className="factbook-raw-markdown-code" tabIndex={0}>
                <code>{rawMarkdown}</code>
              </pre>
            </div>
          )}
            </div>
          </details>

          <DecisionPathRail locale={locale} market={market} product={product} current="factbook" />


        </div>
      </div>

      {/* 24 平台快速切换黄页索引栏 */}
      <nav className="factbook-nav" aria-label={t.platformSwitcher}>
        <div className="factbook-nav__container">
          <div className="factbook-nav__filter-bar">
            <span className="factbook-nav__label">{t.switchVenuePrompt}</span>
            <div className="factbook-nav__filter-tabs">
              <button
                type="button"
                className={`factbook-filter-pill ${filterCategory === "ALL" ? "active" : ""}`}
                onClick={() => setFilterCategory("ALL")}
              >
                {t.navAll} ({FACTBOOK_SLUGS.length})
              </button>
              <button
                type="button"
                className={`factbook-filter-pill ${filterCategory === "CEX" ? "active" : ""}`}
                onClick={() => setFilterCategory("CEX")}
              >
                {t.navCex} (13)
              </button>
              <button
                type="button"
                className={`factbook-filter-pill ${filterCategory === "DEX" ? "active" : ""}`}
                onClick={() => setFilterCategory("DEX")}
              >
                {t.navDex} (6)
              </button>
              <button
                type="button"
                className={`factbook-filter-pill ${filterCategory === "PERP" ? "active" : ""}`}
                onClick={() => setFilterCategory("PERP")}
              >
                {t.navPerp} (5)
              </button>
            </div>
            <small className="factbook-nav__scope-note">
              {t.researchScopeNote || `Factbook: ${factbookRecordCount} research records · Directory: ${comparisonDirectoryCount} comparison profiles.`}
            </small>
          </div>

          <div className="factbook-nav__venue-list" data-collapsed={!showAllVenues && filteredSlugs.length > VENUE_CAP ? "true" : undefined}>
            {filteredSlugs.map((s, index) => {
                  const v = publicFactbookVenue(FACTBOOK_REGISTRY[s], locale);
              const isActive = s === venue.slug;
              /* the switcher shows the first eight venues (plus the current one); every link stays in the markup */
              const capped = !showAllVenues && index >= VENUE_CAP && !isActive;
              return (
                <a
                  key={s}
                  hidden={capped || undefined}
                  href={localizedHref(`/factbook/${encodeURIComponent(s)}`, { locale, market, product })}
                  aria-current={isActive ? "page" : undefined}
                  className={`factbook-venue-pill ${isActive ? "factbook-venue-pill--active" : ""}`}
                  data-cta-kind="research"
                  data-cta-platform={s}
                  data-cta-placement="factbook-switch"
                  data-growth-decision={s}
                  data-growth-placement="factbook-switch"
                >
                  <BrandMark slug={s} compact />
                  <span className="factbook-venue-pill-name">{v.name}</span>
                  {v.rebate?.percent > 0 && (
                    <span className="factbook-pill-rebate">-{v.rebate.percent}%</span>
                  )}
                </a>
              );
            })}
            {filteredSlugs.length > VENUE_CAP && (
              <button type="button" className="factbook-venue-more" aria-expanded={showAllVenues} onClick={() => setShowAllVenues((open) => !open)}>
                {showAllVenues ? venueMoreCopy(currentLocale).fewer : venueMoreCopy(currentLocale).all(filteredSlugs.length)}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 主数据体：高事实密度模块 */}
      <div className="v6 factbook-body">
        <div className="factbook-body__container">

          {/* Fee source state governs presentation, never a numeric or pending-text guess. */}
          <section className="factbook-section" id="rates">
            <div className="factbook-section__header">
              <div className="factbook-section__title-group">
                <h2 className="factbook-section__title">{venue.feeVerified ? t.secVipTitle : (factbookFeeStatusTitles[locale] || factbookFeeStatusTitles[localeBase] || factbookFeeStatusTitles.en)}</h2>
                {venue.feeVerified && <p className="factbook-section__sub">{t.secVipSub}</p>}
              </div>
            </div>
            <div className="v5-detail factbook-base-fees"><VenueFeeLedger slug={venue.slug} locale={locale} /></div>
            {!venue.feeVerified && <p className="factbook-fee-status">{baseFeesCheckedOn ? (factbookBaseFeeCheckedCopy[locale] || factbookBaseFeeCheckedCopy[localeBase] || factbookBaseFeeCheckedCopy.en).replace("{date}", baseFeesCheckedOn) : feeRecordCopy[0]}</p>}
            {!venue.feeVerified && (venue.vipTiers || []).length > 0 && <p className="factbook-vip-pending">{(factbookVipPendingCopy[locale] || factbookVipPendingCopy[localeBase] || factbookVipPendingCopy.en).replace("{n}", String(venue.vipTiers.length))}</p>}
            {venue.feeVerified && <FeeRecords className={venue.feeVerified ? "factbook-fee-reviewed" : "factbook-fee-records"}>
              {!venue.feeVerified && <><summary>{feeRecordCopy[1]}<span aria-hidden="true">＋</span></summary><p className="factbook-fee-records__note">{feeRecordCopy[2]}</p><p className="factbook-section__sub">{t.secVipSub}</p></>}
              <div className="factbook-fee-tabs">
                <button
                  type="button"
                  className={`factbook-tab-btn ${feeTab === "spot" ? "active" : ""}`}
                  onClick={() => setFeeTab("spot")}
                >
                  {t.tabSpot}
                </button>
                <button
                  type="button"
                  className={`factbook-tab-btn ${feeTab === "futures" ? "active" : ""}`}
                  onClick={() => setFeeTab("futures")}
                >
                  {t.tabFutures}
                </button>
              </div>

            <div className="factbook-formula-bar">
              <span className="factbook-formula-tag">{t.formulaLabel || "FORMULA"}</span>
              <span className="factbook-formula-text">{t.thFormula}</span>
              {venue.tokenDiscount?.token !== "None" && (
                <span className="factbook-token-discount-pill">
        {t.tagDiscount}: {venue.tokenDiscount?.token || (isHant ? "待核驗" : isZh ? "待核验" : "Pending source review")} ({(() => { const pct = discountFact(venue.slug, feeTab === "spot" ? "spot" : "perp"); return pct ? `−${pct}%` : (feeTab === "spot" ? venue.tokenDiscount?.spotDiscount : venue.tokenDiscount?.futuresDiscount); })()})
                </span>
              )}
            </div>

            <div className={`factbook-table-wrapper${showAllFeeTiers || !venue.feeVerified ? " is-expanded" : ""}`} tabIndex={0}>
              <table className="factbook-table">
                <thead>
                  <tr>
                    <th>{t.thTier}</th>
                    <th>{t.thMakerBase}</th>
                    <th className="highlight-col">{t.thMakerNet} ({venue.rebate?.percent > 0 ? `-${venue.rebate.percent}%` : (t.pendingLabel || "pending")})</th>
                    <th>{t.thTakerBase}</th>
                    <th className="highlight-col">{t.thTakerNet} ({venue.rebate?.percent > 0 ? `-${venue.rebate.percent}%` : (t.pendingLabel || "pending")})</th>
                  </tr>
                </thead>
                <tbody>
                  {(venue.vipTiers || []).map((tierRow) => {
                    const isSpot = feeTab === "spot";
                    const makerBase = isSpot ? tierRow.spotM : tierRow.futM;
                    const makerNet = isSpot ? tierRow.netSpotM : tierRow.netFutM;
                    const takerBase = isSpot ? tierRow.spotT : tierRow.futT;
                    const takerNet = isSpot ? tierRow.netSpotT : tierRow.netFutT;
                    const isVip0 = tierRow.tier.includes("0") || tierRow.tier.includes("Retail");

                    return (
                      <tr key={tierRow.tier} className={`${isVip0 ? "factbook-row-highlight " : ""}factbook-fee-tier-row`.trim()}>
                        <td className="factbook-cell-tier">
                          <strong>{tierRow.tier}</strong>
                          <span className="factbook-tier-vol">{tierRow.vol30d}</span>
                        </td>
                        <td className="factbook-cell-base" translate="no">{makerBase}</td>
                        <td className="factbook-cell-net highlight-col" translate="no">
                          <strong>{makerNet}</strong>
                        </td>
                        <td className="factbook-cell-base" translate="no">{takerBase}</td>
                        <td className="factbook-cell-net highlight-col" translate="no">
                          <strong>{takerNet}</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {venue.feeVerified && <button
              type="button"
              className="factbook-fee-tiers-toggle"
              aria-expanded={showAllFeeTiers}
              onClick={() => setShowAllFeeTiers((current) => !current)}
            >
            {showAllFeeTiers ? (isHant ? "收起進階費率" : isZh ? "收起高级费率" : (t.showFewerTiers || "Show fewer fee tiers")) : (isHant ? "查看完整 VIP0–VIP9 矩陣" : isZh ? "查看完整 VIP0–VIP9 矩阵" : (t.viewFullTiers || "View full VIP0–VIP9 matrix"))}
              <span aria-hidden="true">{showAllFeeTiers ? "−" : "+"}</span>
            </button>}
            </FeeRecords>}
          </section>

          {/* 模块 2：储备证明 (PoR) 穿透数据 */}
          <section className={`factbook-section factbook-section-disclosure${expandedFactbookSections.por ? " is-open" : ""}`} id="por">
            <button type="button" className="factbook-section__header factbook-section-disclosure__summary" aria-expanded={Boolean(expandedFactbookSections.por)} aria-controls="factbook-por-body" onClick={() => toggleFactbookSection("por")}>
              <div className="factbook-section__title-group">
                <h2 className="factbook-section__title">{t.secPorTitle}</h2>
                <p className="factbook-section__sub">{t.secPorSub}</p>
              </div>
              <span className="factbook-section-disclosure__hint">{isHant ? "展開完整儲備資料" : isZh ? "展开完整储备数据" : (factbookUi.expandReserve || t.openReserveData || "Open full reserve data")}</span>
            </button>
            <div className="factbook-section-disclosure__body" id="factbook-por-body">

            {venue.porVerified ? (
            <dl className="factbook-evidence factbook-evidence--por">
              <div className="factbook-evidence__row">
                <dt>{t.cardTotalPor}</dt>
                <dd><strong className={factbookValueClass(venue.por?.totalRatio || "100%")}>{venue.por?.totalRatio || "100%"}</strong><small>{factbookUi.totalNote || (isHant ? "官方公開資料總值" : isZh ? "官方公开数据总值" : "Declared total from public data")}</small></dd>
              </div>
              <div className="factbook-evidence__row">
                <dt>{t.cardNativeToken}</dt>
                <dd><strong className={factbookValueClass(venue.por?.nativeTokenShare || "0.0%")}>{venue.por?.nativeTokenShare || "0.0%"}</strong><small>{factbookUi.nativeNote || (isHant ? "自身代幣敞口風險" : isZh ? "自身代币敞口风险" : "Native-token exposure risk")}</small></dd>
              </div>
              <div className="factbook-evidence__row">
                <dt>{t.cardSecurityFund}</dt>
                <dd><strong className={factbookValueClass(venue.por?.securityFund || "N/A")}>{venue.por?.securityFund || "N/A"}</strong><small>{venue.por?.fundAmount || "N/A"}</small></dd>
              </div>
            </dl>
            ) : (
            <p className="factbook-pending-line">{pendingFieldsLine(currentLocale, [t.cardTotalPor, t.cardNativeToken, t.cardSecurityFund])}</p>
            )}

            <div className="factbook-por-details">
              {venue.porVerified && <section className="factbook-evidence-group" aria-labelledby="factbook-coverage-title">
                <h3 className="factbook-subheading" id="factbook-coverage-title">{t.assetCoverageTitle}</h3>
                <dl className="factbook-evidence factbook-evidence--compact">
                  {venue.por?.assetCoverage && Object.keys(venue.por.assetCoverage).length ? Object.entries(venue.por.assetCoverage).map(([coin, ratio]) => (
                    <div key={coin} className="factbook-evidence__row">
                      <dt>{coin.toUpperCase()}</dt>
                      <dd><strong className="factbook-value">{ratio}</strong></dd>
                    </div>
                  )) : (
                    <div className="factbook-evidence__row"><dt>{t.pendingLabel || "Pending"}</dt><dd><small>{t.assetCoverageTitle}</small></dd></div>
                  )}
                </dl>
              </section>}

              <section className="factbook-evidence-group" aria-labelledby="factbook-auditor-title">
                <h3 className="factbook-subheading" id="factbook-auditor-title">{t.auditorLabel}</h3>
                <p className="factbook-auditor-text">{!venue.porVerified && venue.por?.merkleUrl ? linkedNotReviewedCopy(currentLocale) : venue.por?.auditor}</p>
                {venue.por?.merkleUrl && (
                  <a
                    href={venue.por.merkleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="factbook-merkle-link"
                  >
                    {t.merkleLink}
                  </a>
                )}
              </section>
            </div>
            </div>
          </section>

          {/* 模块 3：司法合规与 KYC 阶段 */}
          <section className={`factbook-section factbook-section-disclosure${expandedFactbookSections.compliance ? " is-open" : ""}`} id="compliance">
            <button type="button" className="factbook-section__header factbook-section-disclosure__summary" aria-expanded={Boolean(expandedFactbookSections.compliance)} aria-controls="factbook-compliance-body" onClick={() => toggleFactbookSection("compliance")}>
              <div className="factbook-section__title-group">
                <h2 className="factbook-section__title">{t.secKycTitle}</h2>
              </div>
              <span className="factbook-section-disclosure__hint">{isHant ? "展開完整合規資料" : isZh ? "展开完整合规数据" : (factbookUi.expandCompliance || t.openComplianceData || "Open full compliance data")}</span>
            </button>
            <div className="factbook-section-disclosure__body" id="factbook-compliance-body">

            {venue.complianceVerified ? (
            <dl className="factbook-evidence factbook-evidence--wide">
              <div className="factbook-evidence__row">
                <dt>{t.kycLevelLabel}</dt>
                <dd>
                  <span className={`factbook-tag-kyc factbook-tag-kyc--${venue.compliance?.kycLevel}`}>{sentenceCase(venue.compliance?.kycLevel)}</span>
                  <small>{isZh ? venue.compliance?.kycSummaryZh : venue.compliance?.kycSummaryEn}</small>
                </dd>
              </div>
              <div className="factbook-evidence__row">
                <dt>{t.kycStagesLabel}</dt>
                <dd>
                  <ul className="factbook-stage-list">
                    {((isZh ? venue.compliance?.kycTiersZh : venue.compliance?.kycTiersEn) || []).map((stage, i) => (
                      <li key={i} className="factbook-stage-item"><span>{stage}</span></li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div className="factbook-evidence__row">
                <dt>{t.licensesLabel}</dt>
                <dd>
                  <ul className="factbook-license-pills">
                    {((isZh ? venue.compliance?.licensesZh : venue.compliance?.licensesEn) || []).map((lic, i) => (
                      <li key={i} className="factbook-license-pill">{lic}</li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div className="factbook-evidence__row">
                <dt>{t.supportedLabel}</dt>
                <dd><span className="factbook-geo-text">{(venue.compliance?.supportedRegions || []).join("、")}</span></dd>
              </div>
              <div className="factbook-evidence__row factbook-evidence__row--risk">
                <dt>{t.restrictedLabel}</dt>
                <dd><span className="factbook-geo-text factbook-geo-text--danger">{(venue.compliance?.restrictedRegions || []).join("、")}</span></dd>
              </div>
            </dl>
            ) : (
            /* no KYC level badge and no label/value grid until the compliance record has a source: one line */
            <p className="factbook-pending-line">{pendingFieldsLine(currentLocale, [t.kycLevelLabel, t.kycStagesLabel, t.licensesLabel, t.supportedLabel, t.restrictedLabel])}</p>
            )}
            </div>
          </section>

          {/* 模块 4：官方正规主域与防钓鱼来源记录 */}
          <section className={`factbook-section factbook-section-disclosure${expandedFactbookSections.security ? " is-open" : ""}`} id="security">
            <button type="button" className="factbook-section__header factbook-section-disclosure__summary" aria-expanded={Boolean(expandedFactbookSections.security)} aria-controls="factbook-security-body" onClick={() => toggleFactbookSection("security")}>
              <div className="factbook-section__title-group">
                <h2 className="factbook-section__title">{t.secSecurityTitle}</h2>
                <p className="factbook-section__sub">{t.secSecuritySub}</p>
              </div>
              <span className="factbook-section-disclosure__hint">{isHant ? "展開完整記錄端點" : isZh ? "展开完整记录端点" : (factbookUi.expandSecurity || t.openSecurityData || "Open full recorded endpoints")}</span>
            </button>
            <div className="factbook-section-disclosure__body" id="factbook-security-body">

            <dl className="factbook-evidence factbook-evidence--wide factbook-recorded-domain-card">
              <div className="factbook-evidence__row">
                <dt>{t.primaryDomain}</dt>
                <dd>
                  <code>https://{venue.officialDomain}</code>
                  <small className="factbook-verified-tick">{t.verifiedTls || "TLS/SSL status to confirm"}</small>
                </dd>
              </div>
              <div className="factbook-evidence__row">
                <dt>{t.alternateDomainsLabel}</dt>
                <dd>
                  <ul className="factbook-mirror-list">
                    {(venue.mirrors || []).map((m) => (
                      <li key={m} className="factbook-mirror-pill"><code>{m}</code></li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div className="factbook-evidence__row">
                <dt>{t.apiEndpoints}</dt>
                <dd>
                  <div className="factbook-api-box">
                    <div className="factbook-api-entry">
                      <span className="factbook-api-type">{t.restApiLabel || "REST API:"}</span>
                      <code>{venue.apiEndpoints?.rest || "N/A"}</code>
                    </div>
                    <div className="factbook-api-entry">
                      <span className="factbook-api-type">{t.webSocketLabel || "WebSocket:"}</span>
                      <code>{venue.apiEndpoints?.ws || "N/A"}</code>
                    </div>
                  </div>
                </dd>
              </div>
            </dl>
            <div className="factbook-recorded-domain-footer">
              <a
                href={venue.apiEndpoints?.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="factbook-doc-btn"
              >
                {t.docLink}
              </a>
              <span className="factbook-tg-notice">
                {t.tgVerifyTip}
              </span>
            </div>
            </div>
          </section>

          {/* 模块 5：NexuAlpha 合作入口。入口和邀请码可展示；用户优惠需来源核验后再声明。 */}
          {(activationCta.hasPartnerRoute || activationCta.inviteCode) && (
            <section className="factbook-section factbook-activation-section" id="activation">
              <div className="factbook-activation-card" role="group" aria-label={t.activationEyebrow}>
                <div className="factbook-activation-info">
                  <h3 className="factbook-activation-title">
                    {`${venue.name} × NexuAlpha ${t.signupTitle}`}
                  </h3>
                  <dl className="factbook-activation-badges">
                    {activationCta.inviteCode && (
                      <div className="factbook-act-badge">
                        <dt className="act-lbl">{t.inviteCodeLabel}</dt>
                        <dd><strong className="act-val">{activationCta.inviteCode}</strong></dd>
                      </div>
                    )}
                    {partnerBenefit && !activationCta.benefitVerified ? (
                      <div className="factbook-act-badge factbook-act-badge--partner">
                        <dt className="act-lbl">{partnerBenefit.label}</dt>
                        <dd><strong className="act-val highlight-green">{partnerBenefit.value}</strong> <span className="act-note">— {partnerBenefit.confirmed}; {partnerBenefit.account}</span>{partnerBenefit.settle ? <small className="act-note">{partnerBenefit.settle}</small> : null}<small className="act-note">{partnerBenefit.checks}</small></dd>
                      </div>
                    ) : activationCta.benefitVerified && activationCta.rebatePercent > 0 ? (
                      <div className="factbook-act-badge">
                        <dt className="act-lbl">{t.rebatePercentLabel}</dt>
                        <dd><strong className="act-val highlight-green">{formatPercent(locale, activationCta.rebatePercent)}</strong></dd>
                      </div>
                    ) : (
                      <div className="factbook-act-badge">
                        <dt className="act-lbl">{t.rebatePercentLabel}</dt>
                        <dd><strong className="act-val act-val--text">{t.pendingLabel || "pending"}</strong></dd>
                      </div>
                    )}
                    {activationCta.benefitVerified && activationCta.benefit && (
                      <div className="factbook-act-badge">
                        <dt className="act-lbl">{t.welcomePackage}</dt>
                        <dd><strong className="act-val act-val--text">{activationCta.benefit}</strong></dd>
                      </div>
                    )}
                  </dl>
                </div>
                <div className="factbook-activation-cta">
                  <a
                    href={activationCta.registrationUrl}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    className="factbook-act-button"
                    data-cta-kind="registration"
                    data-cta-platform={venue.slug}
                    data-cta-placement="factbook-activation"
                    data-growth-decision={venue.slug}
                    data-growth-placement="factbook-activation"
                    data-growth-market={market}
                    data-growth-product={product}
                  >
                    {activationCta.benefitVerified ? t.activateBtn : t.signupButton}
                  </a>
                  <CommissionDisclosureLine locale={locale} className="factbook-activation-disclosure" placement="factbook-activation" />
                </div>
              </div>
            </section>
          )}

        </div>
      </div>
    </main>
  );
}
