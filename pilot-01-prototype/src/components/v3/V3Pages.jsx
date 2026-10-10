import { pendingDecisionCopy } from "../../data/pending-decision-copy.js";
import "./profile-density.css";
import { enIfLatin } from "../../utils/fallback-lang.js";
import { useEffect, useRef, useState } from "react";
import { buildDecisionReturnHref } from "../../data/decision-return.js";
import { DecisionReturnLink } from "./DecisionReturnLink.jsx";
import { sectionEyebrowAttrs } from "../../data/section-eyebrow.js";
import { TelegramAlertsStrip } from "./TelegramAlertsStrip.jsx";
import { BrandMark } from "../brand/BrandMark";
import { venueDatabase } from "../../data/venue-database.js";
import { partnerRegistry } from "../../data/partner-registry.js";
import { compareSlug, v3Copy, venueProfile } from "../../data/v3-product";
import { OutboundHandoff } from "./OutboundHandoff";
import { ExchangeFactsV5, feesCheckedLabel, feesStatusLabel } from "./ExchangeFactsV5.jsx";
import { VenueFeeLedger, VenueRoute, CompareFeeLedger } from "../v6/InnerLedger.jsx";
import { feePctOfRate, isoDay } from "../../data/exchange-facts.js";
import { matrixCopy } from "./exchange-matrix-copy.js";
import { ResearchPanel, ResearchComparison } from "./ResearchPanels";
import { VenueDecisionArticles } from "./VenueDecisionArticles";
import { VenueFaqSection } from "./VenueFaqSection.jsx";
import { HyperliquidFeeScenario } from "./HyperliquidFeeScenario.jsx";
import { priorityVenueAnswerFor } from "../../data/priority-venue-answers.js";
import { decisionCopy, decisionForVenue, hasReviewedEditorialDecision } from "../../data/venue-decision-content.js";
import { campaignCopy } from "./activity/campaign-copy";
import { OfficialResearchTeaser } from "./activity/OfficialResearch";
import { researchForVenue } from "../../data/exchange-research";
import { buildVenueFeeSummary, feeSummaryCopy } from "../../data/venue-fee-summary.js";
import { reviewedFeeCopy } from "../../data/reviewed-fee-copy.js";
import { officialCampaignResearchByVenue } from "../../data/official-campaign-research.js";
import { getLocalizedVenueName } from "../../utils/venue-name-helper.js";
import { buildTelegramWebsiteFunnelContext, getTelegramDeepLink, TELEGRAM_CONFIG } from "../../data/telegram-config.js";
import { OnsiteTelegramBotHandoff } from "./OnsiteTelegramBotHandoff.jsx";
import { directoryContextSearch } from "../../data/directory-context.js";
import { appendDecisionPassportQuery } from "../../data/decision-passport.js";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { sanitizePublicText } from "../../data/public-copy-sanitizer.js";
import { regionalVenueCta } from "../../data/source-bound-cta.js";
import { buildRegistrationDecisionState } from "./registration-decision-state.js";
import { ctaUiCopy, fillCta, trackCodeCopy } from "../../data/cta-ui-copy.js";
import { contextualHref } from "../../data/contextual-href.js";
import { localizedHref } from "../../data/locale-routing.js";
import { compareDirectAnswerFor } from "../../data/compare-direct-answers.js";
import { CompareHeroActions, CompareFinalChoiceCard, CompareFinalChoiceEvidence } from "./CompareFinalChoiceCard.jsx";
import { compareFaqBadge, compareFaqEntries, compareFaqText, compareStickyAria } from "../../data/compare-faq-locales.js";
import { interfaceCopyByLocale } from "../../content/v3-interface-copy.js";
import { VenueReadinessChecklist } from "./VenueReadinessChecklist.jsx";
import { TelegramReturnBanner } from "./TelegramReturnBanner.jsx";
import { footerDisclosureLabel } from "./CleanFooter.jsx";
import { CommissionDisclosureLine } from "./CommissionDisclosureLine.jsx";
import { formatPercent } from "../../data/format-percent.js";
import { referralSeoFor } from "../../data/referral-seo.js";
import "./crossroads-compare.css";
import "./growth-conversion.css";

export { ActivityCenterPage, ActivityDetailPage } from "./activity/ActivityPages";
export { VenueFaqSection } from "./VenueFaqSection.jsx";

const sourceStatusLabel = (text, venue) => venue.sourceHubs?.length ? text.openOfficialSource : text.pendingReview;
const localeKey = (locale) => {
  const value = String(locale || "");
  if (value.toLowerCase() === "pt-br") return "pt-BR";
  return value.split("-")[0];
};

const textLocaleKey = (locale) => {
  const value = String(locale || "");
  if (value === "zh-Hant") return "zh-Hant";
  if (value.startsWith("zh")) return "zh-Hans";
  return localeKey(locale);
};

const isTraditionalChinese = (locale) => String(locale || "") === "zh-Hant" || String(locale || "") === "zh-TW";
const zhText = (locale, hans, hant) => (isTraditionalChinese(locale) ? hant : hans);

// An official evidence page is linked but its figures are not reviewed yet: say exactly that instead of "Pending" beside a link.
const linkedNotReviewed = (locale) => {
  const k = String(locale || "en");
  if (k.startsWith("zh")) return k === "zh-Hant" || k === "zh-TW" || k === "zh-HK" ? "已連結官方頁面，數字尚未複核" : "已链接官方页面，数字尚未复核";
  return ({ ja: "公式ページあり・数値は未確認", ko: "공식 페이지 연결됨, 수치 미검토", es: "Página oficial enlazada, cifras sin revisar", "pt-BR": "Página oficial vinculada, números ainda não revisados", pt: "Página oficial vinculada, números ainda não revisados", fr: "Page officielle liée, chiffres non encore vérifiés", de: "Offizielle Seite verlinkt, Zahlen noch nicht geprüft", it: "Pagina ufficiale collegata, cifre non ancora verificate", ru: "Официальная страница указана, цифры ещё не проверены", tr: "Resmî sayfa bağlantılı, rakamlar henüz incelenmedi", id: "Halaman resmi ditautkan, angka belum ditinjau", vi: "Đã liên kết trang chính thức, số liệu chưa được rà soát", ar: "الصفحة الرسمية مرتبطة، والأرقام لم تُراجع بعد" })[k] || "Official page linked, figures not yet reviewed";
};
const localePending = (locale, zh = "待官方来源核验") => String(locale || "").startsWith("zh") ? zhText(locale, zh, "待官方來源核驗") : ({ ja: "公式ソース確認待ち", ko: "공식 출처 확인 대기", tr: "Resmi kaynak doğrulaması bekleniyor", fr: "Vérification de la source en attente", de: "Quellenprüfung ausstehend", ru: "Ожидается проверка источника", ar: "بانتظار التحقق من المصدر", id: "Menunggu verifikasi sumber", vi: "Đang chờ xác minh nguồn", it: "Verifica della fonte in sospeso", es: "Pendiente de verificación de la fuente", "pt-BR": "Aguardando verificação da fonte" }[localeKey(locale)] || "Pending official-source verification");


function publicVenueAccess(slug, locale = "en") {
  const publicCta = publicCtaForVenue(slug, locale);
  return {
    db: publicCta.db,
    partner: publicCta.partner,
    officialDomain: publicCta.officialDomain,
    inviteCode: publicCta.inviteCode,
    hasReferral: publicCta.hasReferral,
    rebatePercent: publicCta.rebatePercent,
    registrationUrl: publicCta.registrationUrl,
    benefitText: publicCta.benefit,
    commercialClaim: publicCta.commercialClaim,
  };
}

function hasReviewedDecisionSource(slug) {
  return Boolean(venueDatabase[slug]?.decisionSourceReviewedAt);
}


function publicCompareDb(raw = {}) {
  // Keep comparison surfaces limited to structured facts. Editorial fit copy is
  // maintained separately and stays closed until a dated source review exists.
  const {
    fit: _fit,
    why: _why,
    avoid: _avoid,
    strengths: _strengths,
    limitations: _limitations,
    bestFit: _bestFit,
    whyChoose: _whyChoose,
    notIdealFor: _notIdealFor,
    ...structured
  } = raw;
  return {
    ...structured,
    // Trust scores in venueDatabase are editorial research fields. Keep them
    // out of public comparison surfaces until an item-level dated review is
    // attached, so a pending source state cannot display a default score.
    trustScore: null,
    rebatePercent: 0,
    rebate: null,
    benefit: null,
    welcomeBonusUsdt: null,
    welcomeRewardBadge: null,
    proofOfReserves: false,
    porCoverageRatio: null,
    reserveRatio: null,
    securityFund: null,
    // Legacy account/product values have no field-level dated source.
    kycLevel: null,
    kycSummary: null,
    maxLeverage: null,
  };
}




const interfaceText = (locale) => interfaceCopyByLocale[locale] ?? interfaceCopyByLocale[localeKey(locale)] ?? interfaceCopyByLocale.en;

const codeLabelByLocale = {
  en: "Code",
  "zh-Hans": "专属码",
  "zh-Hant": "專屬碼",
  es: "Código",
  "pt-BR": "Código",
  fr: "Code",
  de: "Code",
  ja: "コード",
  ko: "코드",
  ar: "رمز",
  tr: "Kod",
  ru: "Код",
  id: "Kode",
  vi: "Mã",
  it: "Codice",
};


const basicKycLabelByLocale = {
  en: "Basic KYC (ID only)",
  "zh-Hans": "基础 KYC（证件）",
  "zh-Hant": "基礎 KYC（證件）",
  es: "KYC básico (solo documento)",
  "pt-BR": "KYC básico (somente documento)",
  fr: "KYC de base (document seul)",
  de: "Basis-KYC (nur Ausweis)",
  ja: "基本KYC（本人確認書類のみ）",
  ko: "기본 KYC (신분증만)",
  ar: "KYC أساسي (هوية فقط)",
  tr: "Temel KYC (yalnızca kimlik)",
  ru: "Базовый KYC (только документ)",
  id: "KYC dasar (ID saja)",
  vi: "KYC cơ bản (chỉ giấy tờ)",
  it: "KYC base (solo documento)",
};

const detailUiCoreByLocale = {
  "zh-Hans": { review: "核对费率、储备金、KYC 与杠杆", benefit: "用户手续费权益以当前平台合作条件为准", code: "合作邀请码", codeShort: "邀请码", copy: "复制", deeper: "打开深度核验资料", verifyRegional: "先核对地区资格" },
  "zh-Hant": { review: "核對費率、儲備金、KYC 與槓桿", benefit: "用戶手續費權益以目前平台合作條件為準", code: "合作邀請碼", codeShort: "邀請碼", copy: "複製", deeper: "打開深度核驗資料", verifyRegional: "先核對地區資格" },
  es: { review: "Revisar comisiones, reservas, KYC y apalancamiento", benefit: "El beneficio de comisión sigue las condiciones actuales del partner", code: "Código de referido", codeShort: "Código", copy: "Copiar", deeper: "Abrir material de verificación", verifyRegional: "Verifica elegibilidad regional primero" },
  "pt-BR": { review: "Ver taxas, reservas, KYC e alavancagem", benefit: "O benefício de taxa segue os termos atuais do parceiro", code: "Código de indicação", codeShort: "Código", copy: "Copiar", deeper: "Abrir material de verificação", verifyRegional: "Verificar elegibilidade regional primeiro" },
  fr: { review: "Vérifier les frais, réserves, KYC et levier", benefit: "L’avantage de frais suit les conditions partenaire en vigueur", code: "Code partenaire", codeShort: "Code", copy: "Copier", deeper: "Ouvrir les éléments de vérification", verifyRegional: "Vérifier d’abord l’éligibilité régionale" },
  de: { review: "Gebühren, Reserven, KYC und Hebel prüfen", benefit: "Der Gebührenvorteil folgt den aktuellen Partnerbedingungen", code: "Partnercode", codeShort: "Code", copy: "Kopieren", deeper: "Weitere Prüfunterlagen öffnen", verifyRegional: "Regionale Eignung zuerst prüfen" },
  ru: { review: "Проверить комиссии, резервы, KYC и плечо", benefit: "Пользовательское преимущество зависит от текущих партнёрских условий", code: "Партнёрский код", codeShort: "Код", copy: "Копировать", deeper: "Открыть материалы проверки", verifyRegional: "Сначала проверьте региональную доступность" },
  ja: { review: "手数料・準備金・KYC・レバレッジを確認", benefit: "ユーザー手数料特典は現在のパートナー条件に従います", code: "紹介コード", codeShort: "コード", copy: "コピー", deeper: "詳細な確認資料を開く", verifyRegional: "地域資格を先に確認" },
  ko: { review: "수수료·준비금·KYC·레버리지 확인", benefit: "사용자 수수료 혜택은 현재 파트너 조건을 따릅니다", code: "추천 코드", codeShort: "코드", copy: "복사", deeper: "상세 검증 자료 열기", verifyRegional: "지역 자격 먼저 확인" },
  ar: { review: "راجع الرسوم والاحتياطيات وKYC والرافعة", benefit: "تخضع ميزة الرسوم لشروط الشريك الحالية", code: "رمز الإحالة", codeShort: "رمز", copy: "نسخ", deeper: "فتح مواد التحقق التفصيلية", verifyRegional: "تحقق من أهلية المنطقة أولاً" },
  tr: { review: "Ücretleri, rezervleri, KYC ve kaldıracı incele", benefit: "Kullanıcı ücret avantajı mevcut partner koşullarına tabidir", code: "Referans kodu", codeShort: "Kod", copy: "Kopyala", deeper: "Derin doğrulama materyalini aç", verifyRegional: "Önce bölgesel uygunluğu doğrula" },
  id: { review: "Tinjau biaya, cadangan, KYC, dan leverage", benefit: "Manfaat biaya pengguna mengikuti ketentuan partner saat ini", code: "Kode referral", codeShort: "Kode", copy: "Salin", deeper: "Buka materi verifikasi mendalam", verifyRegional: "Periksa kelayakan wilayah terlebih dahulu" },
  vi: { review: "Xem phí, dự trữ, KYC và đòn bẩy", benefit: "Ưu đãi phí theo điều kiện đối tác hiện tại", code: "Mã giới thiệu", codeShort: "Mã", copy: "Sao chép", deeper: "Mở tài liệu xác minh sâu", verifyRegional: "Kiểm tra điều kiện khu vực trước" },
  it: { review: "Rivedi commissioni, riserve, KYC e leva", benefit: "Il vantaggio sulle commissioni segue i termini partner attuali", code: "Codice referral", codeShort: "Codice", copy: "Copia", deeper: "Apri materiale di verifica", verifyRegional: "Verifica prima l’idoneità regionale" },
};

const invitationSummaryByLocale = {
  en: { label: "Invitation summary", note: "Review invitation details and account conditions." },
  "zh-Hans": { label: "邀请信息摘要", note: "查看邀请信息与账户条件。" },
  "zh-Hant": { label: "邀請資訊摘要", note: "查看邀請資訊與帳戶條件。" },
  es: { label: "Resumen de invitación", note: "Revisa los datos de invitación y las condiciones de la cuenta." },
  "pt-BR": { label: "Resumo do convite", note: "Confira os dados do convite e as condições da conta." },
  fr: { label: "Résumé de l’invitation", note: "Consultez les informations d’invitation et les conditions du compte." },
  de: { label: "Einladungsübersicht", note: "Einladungsdetails und Kontobedingungen prüfen." },
  ja: { label: "紹介情報の概要", note: "招待情報と口座条件を確認できます。" },
  ko: { label: "추천 정보 요약", note: "초대 정보와 계정 조건을 확인하세요." },
  ar: { label: "ملخص الإحالة", note: "راجع تفاصيل الدعوة وشروط الحساب." },
  tr: { label: "Referans özeti", note: "Davet bilgilerini ve hesap koşullarını inceleyin." },
  ru: { label: "Сводка приглашения", note: "Проверьте данные приглашения и условия аккаунта." },
  id: { label: "Ringkasan referral", note: "Periksa informasi undangan dan ketentuan akun." },
  vi: { label: "Tóm tắt giới thiệu", note: "Xem thông tin lời mời và điều kiện tài khoản." },
  it: { label: "Riepilogo invito", note: "Consulta i dettagli dell’invito e le condizioni del conto." },
};

const compareReviewChoiceByLocale = {
  en: "Review choice", "zh-Hans": "查看选择", "zh-Hant": "查看選擇",
  es: "Revisar opción", "pt-BR": "Revisar escolha", fr: "Examiner le choix",
  de: "Auswahl prüfen", ja: "選択を確認", ko: "선택 확인", ar: "مراجعة الاختيار",
  tr: "Seçimi incele", ru: "Проверить выбор", id: "Tinjau pilihan",
  vi: "Xem lựa chọn", it: "Valuta la scelta",
};

const compareStatDisclosureByLocale = {
  en: "Review fees, reserves and KYC",
  "zh-Hans": "展开费率、储备金与 KYC",
  "zh-Hant": "展開費率、儲備金與 KYC",
  es: "Revisar comisiones, reservas y KYC",
  "pt-BR": "Revisar taxas, reservas e KYC",
  fr: "Vérifier frais, réserves et KYC",
  de: "Gebühren, Reserven und KYC prüfen",
  ja: "手数料・準備金・KYCを確認",
  ko: "수수료·준비금·KYC 확인",
  ar: "مراجعة الرسوم والاحتياطيات وKYC",
  tr: "Ücretleri, rezervleri ve KYC'yi incele",
  ru: "Проверить комиссии, резервы и KYC",
  id: "Tinjau biaya, cadangan, dan KYC",
  vi: "Xem phí, dự trữ và KYC",
  it: "Rivedi commissioni, riserve e KYC",
};

const detailLinksByLocale = {
  en: "Open platform detail links",
  "zh-Hans": "展开平台详情入口",
  "zh-Hant": "展開平台詳情入口",
  es: "Abrir detalles de las plataformas",
  "pt-BR": "Abrir detalhes das plataformas",
  fr: "Ouvrir les détails des plateformes",
  de: "Plattformdetails öffnen",
  ja: "プラットフォーム詳細を開く",
  ko: "플랫폼 상세 페이지 열기",
  ar: "فتح تفاصيل المنصات",
  tr: "Platform ayrıntılarını aç",
  ru: "Открыть детали платформ",
  id: "Buka detail platform",
  vi: "Mở chi tiết nền tảng",
  it: "Apri dettagli delle piattaforme",
};

const officialFlowLabelByLocale = {
  en: "Verify in official flow",
  "zh-Hans": "官方流程核验",
  "zh-Hant": "官方流程核驗",
  es: "Verificar en el flujo oficial",
  "pt-BR": "Verificar no fluxo oficial",
  fr: "Vérifier dans le parcours officiel",
  de: "Im offiziellen Ablauf prüfen",
  ja: "公式手続きで確認",
  ko: "공식 절차에서 확인",
  ar: "تحقق داخل المسار الرسمي",
  tr: "Resmî akışta doğrula",
  ru: "Проверить в официальном процессе",
  id: "Verifikasi di alur resmi",
  vi: "Xác minh trong luồng chính thức",
  it: "Verifica nel flusso ufficiale",
};

const compareDecisionGuideCopyByLocale = {
  en: {
    persona: (name) => `Verify ${name}'s regional eligibility, product scope and official fee schedule first`,
    productSources: (name) => `${name}'s public products, fees and regional conditions should be checked against official sources`,
    feeReference: (spot, futures, sourceBound) => `Published fee reference: Spot ${spot}, Futures ${futures}; ${sourceBound}`,
    feePending: (sourceBound) => `Published fee sources still require review; ${sourceBound}`,
    reserves: "Reserve, solvency and security claims are not yet checked against official sources",
    leverage: "Leverage, margin, liquidation and product limits require current region and account verification",
  },
  "zh-Hans": {
    persona: (name) => `先核对 ${name} 的地区资格、产品范围与官方费率`,
    productSources: (name) => `${name} 的公开产品、费率和地区条件需要按官方来源逐项核对`,
    feeReference: (spot, futures, sourceBound) => `公开费率参考：现货 ${spot}，合约 ${futures}；${sourceBound}`,
    feePending: (sourceBound) => `公开费率来源尚未完成核验；${sourceBound}`,
    reserves: "储备金、偿付能力和安全机制待来源核验",
    leverage: "杠杆、保证金、清算和产品上限需在当前地区与账户内核验",
  },
  "zh-Hant": {
    persona: (name) => `先核對 ${name} 的地區資格、產品範圍與官方費率`,
    productSources: (name) => `${name} 的公開產品、費率和地區條件需要按官方來源逐項核對`,
    feeReference: (spot, futures, sourceBound) => `公開費率參考：現貨 ${spot}，合約 ${futures}；${sourceBound}`,
    feePending: (sourceBound) => `公開費率來源尚未完成核驗；${sourceBound}`,
    reserves: "儲備金、償付能力和安全機制待來源核驗",
    leverage: "槓桿、保證金、清算和產品上限需在目前地區與帳戶內核驗",
  },
  es: {
    persona: (name) => `Verifica primero la elegibilidad regional, el alcance de productos y la tarifa oficial de ${name}`,
    productSources: (name) => `Los productos, comisiones y condiciones regionales públicas de ${name} deben revisarse con fuentes oficiales`,
    feeReference: (spot, futures, sourceBound) => `Referencia de comisiones publicada: spot ${spot}, futuros ${futures}; ${sourceBound}`,
    feePending: (sourceBound) => `Las fuentes de comisiones publicadas siguen pendientes de revisión; ${sourceBound}`,
    reserves: "Reservas, solvencia y seguridad siguen pendientes de verificación de fuente",
    leverage: "Apalancamiento, margen, liquidación y límites de producto deben verificarse por región y cuenta",
  },
  "pt-BR": {
    persona: (name) => `Verifique primeiro a elegibilidade regional, o escopo de produtos e a tabela oficial de taxas da ${name}`,
    productSources: (name) => `Produtos, taxas e condições regionais públicas da ${name} devem ser conferidos em fontes oficiais`,
    feeReference: (spot, futures, sourceBound) => `Referência de taxas publicada: spot ${spot}, futuros ${futures}; ${sourceBound}`,
    feePending: (sourceBound) => `As fontes públicas de taxas ainda precisam de revisão; ${sourceBound}`,
    reserves: "Reservas, solvência e segurança seguem pendentes de verificação por fonte",
    leverage: "Alavancagem, margem, liquidação e limites de produto exigem verificação por região e conta",
  },
  fr: {
    persona: (name) => `Vérifiez d’abord l’éligibilité régionale, le périmètre produit et la grille officielle de ${name}`,
    productSources: (name) => `Les produits, frais et conditions régionales publics de ${name} doivent être vérifiés auprès des sources officielles`,
    feeReference: (spot, futures, sourceBound) => `Référence de frais publiée : spot ${spot}, futures ${futures} ; ${sourceBound}`,
    feePending: (sourceBound) => `Les sources de frais publiées restent à vérifier ; ${sourceBound}`,
    reserves: "Réserves, solvabilité et sécurité restent en attente de vérification sourcée",
    leverage: "Levier, marge, liquidation et limites produit doivent être vérifiés selon la région et le compte",
  },
  de: {
    persona: (name) => `Prüfen Sie zuerst regionale Eignung, Produktumfang und offizielle Gebühren von ${name}`,
    productSources: (name) => `Öffentliche Produkte, Gebühren und regionale Bedingungen von ${name} sind anhand offizieller Quellen zu prüfen`,
    feeReference: (spot, futures, sourceBound) => `Veröffentlichte Gebührenreferenz: Spot ${spot}, Futures ${futures}; ${sourceBound}`,
    feePending: (sourceBound) => `Veröffentlichte Gebührenquellen benötigen noch Prüfung; ${sourceBound}`,
    reserves: "Reserven, Solvenz und Sicherheitsangaben warten auf Quellenprüfung",
    leverage: "Hebel, Margin, Liquidation und Produktlimits sind je Region und Konto zu prüfen",
  },
  ja: {
    persona: (name) => `${name} の地域資格、商品範囲、公式手数料表を先に確認してください`,
    productSources: (name) => `${name} の公開商品、手数料、地域条件は公式ソースで逐項確認します`,
    feeReference: (spot, futures, sourceBound) => `公開手数料の参考：現物 ${spot}、先物 ${futures}；${sourceBound}`,
    feePending: (sourceBound) => `公開手数料ソースはまだ確認が必要です；${sourceBound}`,
    reserves: "準備金、支払能力、セキュリティ主張はソース確認待ちです",
    leverage: "レバレッジ、証拠金、清算、商品上限は現在の地域と口座で確認してください",
  },
  ko: {
    persona: (name) => `${name}의 지역 자격, 상품 범위, 공식 수수료표를 먼저 확인하세요`,
    productSources: (name) => `${name}의 공개 상품, 수수료, 지역 조건은 공식 출처로 항목별 확인이 필요합니다`,
    feeReference: (spot, futures, sourceBound) => `공개 수수료 참고: 현물 ${spot}, 선물 ${futures}; ${sourceBound}`,
    feePending: (sourceBound) => `공개 수수료 출처는 아직 검토가 필요합니다; ${sourceBound}`,
    reserves: "준비금, 지급능력, 보안 주장은 출처 확인 대기 상태입니다",
    leverage: "레버리지, 증거금, 청산, 상품 한도는 현재 지역과 계정에서 확인해야 합니다",
  },
  ar: {
    persona: (name) => `تحقق أولاً من أهلية المنطقة ونطاق المنتجات وجدول الرسوم الرسمي لدى ${name}`,
    productSources: (name) => `يجب مراجعة منتجات ${name} العامة ورسومها وشروطها الإقليمية عبر المصادر الرسمية`,
    feeReference: (spot, futures, sourceBound) => `مرجع الرسوم المنشور: فوري ${spot}، عقود ${futures}؛ ${sourceBound}`,
    feePending: (sourceBound) => `ما زالت مصادر الرسوم المنشورة بحاجة إلى مراجعة؛ ${sourceBound}`,
    reserves: "تبقى الاحتياطيات والملاءة وادعاءات الأمان بانتظار تحقق المصدر",
    leverage: "يجب التحقق من الرافعة والهامش والتصفية وحدود المنتج حسب المنطقة والحساب",
  },
  tr: {
    persona: (name) => `Önce ${name} için bölgesel uygunluğu, ürün kapsamını ve resmî ücret tablosunu kontrol edin`,
    productSources: (name) => `${name} için açık ürünler, ücretler ve bölgesel koşullar resmî kaynaklarla kontrol edilmelidir`,
    feeReference: (spot, futures, sourceBound) => `Yayımlanmış ücret referansı: spot ${spot}, vadeli ${futures}; ${sourceBound}`,
    feePending: (sourceBound) => `Yayımlanmış ücret kaynakları hâlâ inceleme gerektiriyor; ${sourceBound}`,
    reserves: "Rezerv, ödeme gücü ve güvenlik iddiaları kaynak doğrulaması bekliyor",
    leverage: "Kaldıraç, marjin, likidasyon ve ürün limitleri mevcut bölge ve hesapta doğrulanmalıdır",
  },
  ru: {
    persona: (name) => `Сначала проверьте региональную доступность, продукты и официальную сетку комиссий ${name}`,
    productSources: (name) => `Публичные продукты, комиссии и региональные условия ${name} нужно сверять с официальными источниками`,
    feeReference: (spot, futures, sourceBound) => `Публичный ориентир комиссий: спот ${spot}, фьючерсы ${futures}; ${sourceBound}`,
    feePending: (sourceBound) => `Публичные источники комиссий всё ещё требуют проверки; ${sourceBound}`,
    reserves: "Резервы, платёжеспособность и безопасность ожидают проверки источников",
    leverage: "Плечо, маржа, ликвидация и лимиты продуктов проверяются по региону и аккаунту",
  },
  id: {
    persona: (name) => `Periksa dulu kelayakan wilayah, cakupan produk, dan jadwal biaya resmi ${name}`,
    productSources: (name) => `Produk, biaya, dan ketentuan wilayah publik ${name} harus diperiksa dengan sumber resmi`,
    feeReference: (spot, futures, sourceBound) => `Referensi biaya publik: spot ${spot}, futures ${futures}; ${sourceBound}`,
    feePending: (sourceBound) => `Sumber biaya publik masih perlu ditinjau; ${sourceBound}`,
    reserves: "Cadangan, solvabilitas, dan klaim keamanan masih menunggu verifikasi sumber",
    leverage: "Leverage, margin, likuidasi, dan batas produk perlu diverifikasi menurut wilayah dan akun",
  },
  vi: {
    persona: (name) => `Trước tiên hãy kiểm tra điều kiện khu vực, phạm vi sản phẩm và biểu phí chính thức của ${name}`,
    productSources: (name) => `Sản phẩm, phí và điều kiện khu vực công khai của ${name} cần được đối chiếu với nguồn chính thức`,
    feeReference: (spot, futures, sourceBound) => `Tham chiếu phí công khai: spot ${spot}, futures ${futures}; ${sourceBound}`,
    feePending: (sourceBound) => `Nguồn phí công khai vẫn cần được rà soát; ${sourceBound}`,
    reserves: "Dự trữ, khả năng thanh toán và bảo mật vẫn chờ xác minh nguồn",
    leverage: "Đòn bẩy, ký quỹ, thanh lý và giới hạn sản phẩm cần xác minh theo khu vực và tài khoản",
  },
  it: {
    persona: (name) => `Verifica prima idoneità regionale, ambito prodotti e tabella commissioni ufficiale di ${name}`,
    productSources: (name) => `Prodotti, commissioni e condizioni regionali pubbliche di ${name} vanno verificati con fonti ufficiali`,
    feeReference: (spot, futures, sourceBound) => `Riferimento commissioni pubblicato: spot ${spot}, futures ${futures}; ${sourceBound}`,
    feePending: (sourceBound) => `Le fonti pubbliche sulle commissioni richiedono ancora verifica; ${sourceBound}`,
    reserves: "Riserve, solvibilità e sicurezza restano in attesa di verifica delle fonti",
    leverage: "Leva, margine, liquidazione e limiti prodotto vanno verificati per regione e account",
  },
};

const officialFlowLabel = (locale) => officialFlowLabelByLocale[textLocaleKey(locale)] || officialFlowLabelByLocale.en;
const compareDecisionGuideCopy = (locale) => compareDecisionGuideCopyByLocale[textLocaleKey(locale)] || compareDecisionGuideCopyByLocale.en;

const detailUi = (locale) => {
  const key = textLocaleKey(locale);
  const fallback = {
    review: "Review fees, reserves, KYC and leverage", benefit: "User fee benefit follows current partner terms", code: "Referral Code", copy: "Copy", deeper: "Open deeper verification material", verifyRegional: "Verify regional eligibility first",
  };
  const metricUi = {
    es: { review: "Revisar comisiones, reservas, KYC y apalancamiento", code: "Código de referido", copy: "Copiar", deeper: "Abrir material de verificación" },
    "pt-BR": { review: "Ver taxas, reservas, KYC e alavancagem", code: "Código de indicação", copy: "Copiar", deeper: "Abrir material de verificação" },
    fr: { review: "Vérifier les frais, réserves, KYC et levier", code: "Code partenaire", copy: "Copier", deeper: "Ouvrir les éléments de vérification" },
    de: { review: "Gebühren, Reserven, KYC und Hebel prüfen", code: "Partnercode", copy: "Kopieren", deeper: "Weitere Prüfunterlagen öffnen" },
    ru: { review: "Проверить комиссии, резервы, KYC и плечо", code: "Партнёрский код", copy: "Копировать", deeper: "Открыть материалы проверки" },
    ja: { review: "手数料・準備金・KYC・レバレッジを確認", code: "紹介コード", copy: "コピー", deeper: "詳細な確認資料を開く" },
    ko: { review: "수수료·준비금·KYC·레버리지 확인", code: "추천 코드", copy: "복사", deeper: "상세 검증 자료 열기" },
    tr: { review: "Ücretleri, rezervleri, KYC ve kaldıracı incele", code: "Referans kodu", copy: "Kopyala", deeper: "Derin doğrulama materyalini aç" },
  };
  const localized = ({
    ja: { review: "手数料・準備金・KYC・レバレッジを確認", benefit: "ユーザー手数料特典は現在のパートナー条件に従います", code: "紹介コード", codeShort: "コード", copy: "コピー", deeper: "詳細な確認資料を開く", preRegister: "登録前の判断メモを開く", preRegisterHint: "適合性、制限、KYC・入金確認をまとめています", fewer: "候補を少なく表示", more: "残り", moreAlt: "件の候補を表示", rates: "VIP0〜VIP9 段階料率とNexuAlpha純額料率", spot: "現物市場", futures: "先物・パーペチュアル", expand: "VIP0〜VIP9の詳細をすべて開く", collapse: "主要階層だけ表示", stack: "公式VIP取引量階層とAPIキーの優遇を併用できます", lock: "公式サイトで純額料率を確認", feeTag: "段階別手数料表", pending: "ユーザー特典は確認待ち", tier: "階層 / 30日取引量", retailVol: "< $100K（個人）", maker: "メイカー基準", taker: "テイカー基準", makerNet: (percent) => `メイカー純額 (-${percent}%)`, takerNet: (percent) => `テイカー純額 (-${percent}%)`, userNetPending: "ユーザー純額料率（確認待ち）", savings: "推定節約額", save: "節約", verifiedRebate: (code, percent) => `NexuAlpha コード ${code} を適用すると、公式VIP料率に加えて ${percent}% の純額還元を確認できます。`, unverifiedBenefit: "公式ルートと紹介コードは掲載していますが、固定のユーザー特典は各プラットフォーム条件の確認後にのみ表示します。", verifyRegional: "地域資格を先に確認" },
    ko: { review: "수수료·준비금·KYC·레버리지 확인", benefit: "사용자 수수료 혜택은 현재 파트너 조건을 따릅니다", code: "추천 코드", codeShort: "코드", copy: "복사", deeper: "상세 검증 자료 열기", preRegister: "가입 전 판단 메모 열기", preRegisterHint: "적합성, 제한, KYC·입금 확인을 한곳에서 봅니다", fewer: "후보 적게 보기", more: "남은", moreAlt: "개 후보 더 보기", rates: "VIP0~VIP9 등급 요율 및 NexuAlpha 순요율", spot: "현물 시장", futures: "선물·무기한", expand: "VIP0~VIP9 상세 모두 열기", collapse: "핵심 등급만 보기", stack: "공식 VIP 거래량 등급 및 API 키 혜택과 함께 적용됩니다", lock: "공식 사이트에서 순요율 확인", feeTag: "등급별 수수료표", pending: "사용자 혜택 확인 대기", tier: "등급 / 30일 거래량", retailVol: "< $100K (개인)", maker: "메이커 기준", taker: "테이커 기준", makerNet: (percent) => `메이커 순요율 (-${percent}%)`, takerNet: (percent) => `테이커 순요율 (-${percent}%)`, userNetPending: "사용자 순요율(확인 대기)", savings: "예상 절감액", save: "절감", verifiedRebate: (code, percent) => `NexuAlpha 코드 ${code} 적용 시 공식 VIP 요율에 ${percent}% 순혜택을 함께 확인할 수 있습니다.`, unverifiedBenefit: "공식 경로와 추천 코드는 표시하지만, 고정 사용자 혜택은 플랫폼 조건 확인 후에만 게시합니다.", verifyRegional: "지역 자격 먼저 확인" },
    tr: { review: "Ücretleri, rezervleri, KYC ve kaldıracı incele", benefit: "Kullanıcı ücret avantajı mevcut partner koşullarına tabidir", code: "Referans kodu", codeShort: "Kod", copy: "Kopyala", deeper: "Derin doğrulama materyalini aç", preRegister: "Kayıt öncesi karar notlarını aç", preRegisterHint: "Uygunluk, sınırlamalar ve KYC/yatırım kontrolleri burada", fewer: "Daha az aday göster", more: "Kalan", moreAlt: "aday daha göster", rates: "VIP0-VIP9 kademeli oranlar ve NexuAlpha net oranları", spot: "Spot piyasalar", futures: "Vadeli işlemler ve perpetual", expand: "VIP0-VIP9 ayrıntılarının tümünü aç", collapse: "Temel kademelere daralt", stack: "Resmî VIP hacim kademeleri ve yüksek frekanslı API anahtarlarıyla birlikte kullanılabilir", lock: "Resmî sitede net oranları kilitle", feeTag: "Kademeli ücret tablosu", pending: "Kullanıcı avantajı doğrulama bekliyor", tier: "Kademe / 30 günlük hacim", retailVol: "< $100K (bireysel)", maker: "Maker tabanı", taker: "Taker tabanı", makerNet: (percent) => `Maker net (-${percent}%)`, takerNet: (percent) => `Taker net (-${percent}%)`, userNetPending: "Kullanıcı net oranı (beklemede)", savings: "Tahmini tasarruf", save: "Tasarruf", verifiedRebate: (code, percent) => `NexuAlpha kodu ${code} ile resmî VIP oranlarına ek olarak ${percent}% net avantajı kontrol edebilirsiniz.`, unverifiedBenefit: "Resmî rota ve referans kodu listelenir; sabit kullanıcı avantajı yalnızca platform koşulları doğrulandıktan sonra yayımlanır.", verifyRegional: "Önce bölgesel uygunluğu doğrula" },
  }[key] || {});
  return { ...fallback, ...(detailUiCoreByLocale[key] || {}), ...(metricUi[key] || {}), ...localized };
};

const detailRuntimeUi = (locale, text, venueName) => ({
  pendingVerification: localePending(locale),
  noSource: text.pendingReview,
  globalVerification: text.verifyBefore,
  productTerms: text.openOfficialSource,
  calculatorOpen: text.comparisonMatrix,
  calculatorTitle: (name = venueName) => `${name} · ${text.comparisonMatrix}`,
  monthlyVolume: `${text.researchScope}: `,
  volumeSlider: text.comparisonMatrix,
  calculatorPending: text.ctaLocked,
  calculatorBenefit: (code) => `${text.partnerState}: ${code}`,
  preRegister: text.registrationPrepCta,
  preRegisterHint: text.detailPreKycFunding,
  similarOpen: text.detailCompare,
  showFewer: text.cardsView,
  showMore: (count) => (String(locale || "en").startsWith("en") ? `Show ${count} more ${count === 1 ? "platform" : "platforms"}` : text.resultVenues(count)),
  stickyQuickAction: text.registrationPrepCta,
  stickyOfficial: text.officialDomain,
  stickyFeeBenefit: text.partnerState,
  stickyDirectRoute: text.conversionPath,
});

const dexFeeCompactUiByLocale = {
  en: ["DEX mechanism", "Perp DEX mechanism", "uses on-chain checks instead of a CEX VIP table", "Costs come from pool fees, funding, slippage, gas, routing and liquidation; no forced VIP0-VIP9 table.", ["Wallet, chain and approval risk", "Pool fee, route, slippage and gas", "Official app, docs, domain and community"], ["Matching, funding, margin and liquidation", "Oracle, insurance fund and settlement", "Bridge, withdrawal wait and region"], "Verify on the official page and current on-chain state first.", "Referral Code", "No code required or not configured", "Referral state", "Review official source ↗", "Continue official route ↗", "Verify regional eligibility first →", "Official route unavailable"],
  "zh-Hans": ["DEX 机制核验", "Perp DEX 机制核验", "不使用 CEX VIP 费率表，先核验链上机制", "成本来自池子费率、资金费率、滑点、Gas、路由与强平机制；不包装成 VIP0-VIP9。", ["钱包、网络、代币合约与授权风险", "池子费率、路由、滑点与 Gas", "官方 App、文档、域名与社群"], ["撮合、资金费率、保证金与强平", "预言机、保险基金与链上结算", "入金桥、提现等待与地区条件"], "注册或连接钱包前，以官方页面和链上状态核对。", "已配置邀请码", "无需邀请码或待配置", "邀请码状态", "打开官方来源核验 ↗", "继续官方路径 ↗", "先核对地区资格 →", "官方路径不可用"],
  "zh-Hant": ["DEX 機制核驗", "Perp DEX 機制核驗", "不使用 CEX VIP 費率表，先核驗鏈上機制", "成本來自池子費率、資金費率、滑點、Gas、路由與強平機制；不包裝成 VIP0-VIP9。", ["錢包、網路、代幣合約與授權風險", "池子費率、路由、滑點與 Gas", "官方 App、文件、網域與社群"], ["撮合、資金費率、保證金與強平", "預言機、保險基金與鏈上結算", "入金橋、提現等待與地區條件"], "註冊或連接錢包前，以官方頁面和鏈上狀態核對。", "已配置邀請碼", "無需邀請碼或待配置", "邀請碼狀態", "打開官方來源核驗 ↗", "繼續官方路徑 ↗", "先核對地區資格 →", "官方路徑不可用"],
  es: ["Mecanismo DEX", "Mecanismo Perp DEX", "usa verificación on-chain, no tabla VIP de CEX", "Costes por pool, funding, slippage, gas, ruta y liquidación; sin tabla VIP0-VIP9 forzada.", ["Wallet, red, contrato y aprobación", "Pool, ruta, slippage y gas", "App oficial, docs, dominio y comunidad"], ["Matching, funding, margen y liquidación", "Oráculo, seguro y liquidación on-chain", "Bridge, retiro y región"], "Verifica la página oficial y el estado on-chain primero.", "Código de referido", "Sin código requerido o pendiente", "Estado del referido", "Revisar fuente oficial ↗", "Continuar ruta oficial ↗", "Verifica elegibilidad regional →", "Ruta oficial no disponible"],
  "pt-BR": ["Mecanismo DEX", "Mecanismo Perp DEX", "usa verificação on-chain, não tabela VIP de CEX", "Custos vêm de pool, funding, slippage, gas, rota e liquidação; sem tabela VIP0-VIP9 forçada.", ["Carteira, rede, contrato e aprovação", "Pool, rota, slippage e gas", "App oficial, docs, domínio e comunidade"], ["Matching, funding, margem e liquidação", "Oráculo, seguro e liquidação on-chain", "Bridge, saque e região"], "Confira a página oficial e o estado on-chain primeiro.", "Código de indicação", "Sem código exigido ou pendente", "Status do código", "Revisar fonte oficial ↗", "Continuar rota oficial ↗", "Verificar elegibilidade regional →", "Rota oficial indisponível"],
  fr: ["Mécanisme DEX", "Mécanisme Perp DEX", "utilise une vérification on-chain, pas une grille VIP CEX", "Coûts liés au pool, funding, slippage, gas, routage et liquidation; pas de grille VIP0-VIP9 forcée.", ["Wallet, réseau, contrat et autorisation", "Pool, route, slippage et gas", "App officielle, docs, domaine et communauté"], ["Matching, funding, marge et liquidation", "Oracle, assurance et règlement on-chain", "Bridge, retrait et région"], "Vérifiez d'abord la page officielle et l'état on-chain.", "Code partenaire", "Aucun code requis ou non configuré", "État du code", "Vérifier la source officielle ↗", "Continuer la route officielle ↗", "Vérifier l'éligibilité régionale →", "Route officielle indisponible"],
  de: ["DEX-Mechanik", "Perp-DEX-Mechanik", "nutzt On-Chain-Prüfung statt CEX-VIP-Tabelle", "Kosten durch Poolgebühr, Funding, Slippage, Gas, Routing und Liquidation; keine VIP0-VIP9-Tabelle.", ["Wallet, Netzwerk, Vertrag und Freigabe", "Pool, Route, Slippage und Gas", "Offizielle App, Doku, Domain und Community"], ["Matching, Funding, Margin und Liquidation", "Oracle, Versicherung und On-Chain-Abwicklung", "Bridge, Auszahlung und Region"], "Offizielle Seite und On-Chain-Status zuerst prüfen.", "Partnercode", "Kein Code nötig oder nicht konfiguriert", "Code-Status", "Offizielle Quelle prüfen ↗", "Offizielle Route fortsetzen ↗", "Regionale Eignung prüfen →", "Offizielle Route nicht verfügbar"],
  ja: ["DEX 仕組み確認", "Perp DEX 仕組み確認", "は CEX の VIP 表ではなくオンチェーン条件で確認します", "費用はプール手数料、資金調達率、スリッページ、Gas、ルート、清算条件で決まり、VIP0〜VIP9 表にしません。", ["ウォレット、ネットワーク、契約、承認", "プール、ルート、スリッページ、Gas", "公式アプリ、文書、ドメイン、コミュニティ"], ["マッチング、資金調達率、証拠金、清算", "オラクル、保険基金、オンチェーン決済", "ブリッジ、出金待ち、地域条件"], "先に公式ページとオンチェーン状態を確認してください。", "紹介コード", "コード不要または未設定", "紹介状態", "公式ソースを確認 ↗", "公式ルートへ進む ↗", "地域資格を先に確認 →", "公式ルートは利用できません"],
  ko: ["DEX 메커니즘", "Perp DEX 메커니즘", "는 CEX VIP 표가 아니라 온체인 조건으로 확인합니다", "비용은 풀 수수료, 펀딩, 슬리피지, 가스, 라우팅, 청산 조건에서 발생하며 VIP0~VIP9 표로 바꾸지 않습니다.", ["지갑, 네트워크, 계약, 승인", "풀, 경로, 슬리피지, 가스", "공식 앱, 문서, 도메인, 커뮤니티"], ["매칭, 펀딩, 증거금, 청산", "오라클, 보험 기금, 온체인 정산", "브리지, 출금 대기, 지역 자격"], "먼저 공식 페이지와 온체인 상태를 확인하세요.", "추천 코드", "코드 불필요 또는 미설정", "추천 상태", "공식 출처 확인 ↗", "공식 경로 계속 ↗", "지역 자격 먼저 확인 →", "공식 경로 사용 불가"],
  ar: ["آلية DEX", "آلية Perp DEX", "يستخدم فحصا على السلسلة بدلا من جدول VIP مركزي", "التكلفة من رسوم المجمع والتمويل والانزلاق والغاز والتوجيه والتصفية؛ بلا جدول VIP0-VIP9.", ["المحفظة والشبكة والعقد والموافقة", "المجمع والمسار والانزلاق والغاز", "التطبيق والوثائق والنطاق والمجتمع"], ["المطابقة والتمويل والهامش والتصفية", "الأوراكل والتأمين والتسوية", "الجسر والسحب والمنطقة"], "تحقق أولا من الصفحة الرسمية وحالة السلسلة.", "رمز الإحالة", "لا يلزم رمز أو لم يضبط", "حالة الإحالة", "راجع المصدر الرسمي ↗", "تابع المسار الرسمي ↗", "تحقق من أهلية المنطقة أولا →", "المسار الرسمي غير متاح"],
  tr: ["DEX mekanizması", "Perp DEX mekanizması", "CEX VIP tablosu yerine zincir üstü kontrol kullanır", "Maliyet havuz ücreti, funding, slippage, gas, rota ve likidasyondan gelir; VIP0-VIP9 tablosuna zorlanmaz.", ["Cüzdan, ağ, sözleşme ve onay", "Havuz, rota, slippage ve gas", "Resmî uygulama, belge, alan ve topluluk"], ["Eşleşme, funding, marjin, likidasyon", "Oracle, sigorta ve zincir üstü uzlaşma", "Köprü, çekim ve bölge"], "Önce resmî sayfayı ve zincir üstü durumu kontrol edin.", "Referans kodu", "Kod gerekmiyor veya yapılandırılmadı", "Referans durumu", "Resmî kaynağı incele ↗", "Resmî rotaya devam et ↗", "Önce bölgesel uygunluğu doğrula →", "Resmî rota kullanılamıyor"],
  ru: ["Механика DEX", "Механика Perp DEX", "использует ончейн-проверку вместо VIP-таблицы CEX", "Стоимость зависит от пула, funding, проскальзывания, газа, маршрута и ликвидации; без VIP0-VIP9.", ["Кошелек, сеть, контракт и разрешения", "Пул, маршрут, проскальзывание и газ", "Официальное приложение, документы, домен и сообщество"], ["Матчинг, funding, маржа и ликвидация", "Оракул, страховой фонд и расчет", "Мост, вывод и регион"], "Сначала проверьте официальный сайт и ончейн-статус.", "Партнёрский код", "Код не требуется или не настроен", "Статус кода", "Проверить официальный источник ↗", "Продолжить официальный маршрут ↗", "Проверьте региональную доступность →", "Официальный маршрут недоступен"],
  id: ["Mekanisme DEX", "Mekanisme Perp DEX", "memakai pemeriksaan on-chain, bukan tabel VIP CEX", "Biaya berasal dari pool, funding, slippage, gas, routing, dan likuidasi; bukan tabel VIP0-VIP9.", ["Dompet, jaringan, kontrak, approval", "Pool, rute, slippage, gas", "App resmi, dokumen, domain, komunitas"], ["Matching, funding, margin, likuidasi", "Oracle, asuransi, penyelesaian on-chain", "Bridge, penarikan, wilayah"], "Periksa halaman resmi dan status on-chain dulu.", "Kode referral", "Tidak perlu kode atau belum dikonfigurasi", "Status referral", "Tinjau sumber resmi ↗", "Lanjutkan rute resmi ↗", "Periksa kelayakan wilayah →", "Rute resmi tidak tersedia"],
  vi: ["Cơ chế DEX", "Cơ chế Perp DEX", "dùng kiểm tra on-chain thay vì bảng VIP CEX", "Chi phí đến từ pool, funding, trượt giá, gas, định tuyến và thanh lý; không ép vào VIP0-VIP9.", ["Ví, mạng, hợp đồng, cấp quyền", "Pool, tuyến, trượt giá, gas", "Ứng dụng, tài liệu, miền, cộng đồng"], ["Khớp lệnh, funding, ký quỹ, thanh lý", "Oracle, bảo hiểm, thanh toán on-chain", "Bridge, rút tiền, khu vực"], "Kiểm tra trang chính thức và trạng thái on-chain trước.", "Mã giới thiệu", "Không cần mã hoặc chưa cấu hình", "Trạng thái giới thiệu", "Xem nguồn chính thức ↗", "Tiếp tục tuyến chính thức ↗", "Kiểm tra điều kiện khu vực →", "Tuyến chính thức không khả dụng"],
  it: ["Meccanismo DEX", "Meccanismo Perp DEX", "usa controllo on-chain, non tabella VIP CEX", "Costi da pool, funding, slippage, gas, routing e liquidazione; niente tabella VIP0-VIP9 forzata.", ["Wallet, rete, contratto, approvazione", "Pool, percorso, slippage, gas", "App ufficiale, documenti, dominio, community"], ["Matching, funding, margine, liquidazione", "Oracle, assicurazione, regolamento on-chain", "Bridge, prelievo e regione"], "Controlla prima pagina ufficiale e stato on-chain.", "Codice referral", "Codice non richiesto o non configurato", "Stato referral", "Verifica fonte ufficiale ↗", "Continua percorso ufficiale ↗", "Verifica idoneità regionale →", "Percorso ufficiale non disponibile"],
};

const dexFeeCompactUi = (locale, venueName, isPerpDex) => {
  const key = String(locale || "").toLowerCase() === "pt-br" ? "pt-BR" : String(locale || "en").split("-")[0];
  const ui = dexFeeCompactUiByLocale[locale] || dexFeeCompactUiByLocale[key] || dexFeeCompactUiByLocale.en;
  return {
    tag: isPerpDex ? ui[1] : ui[0],
    title: `${venueName} ${ui[2]}`,
    body: ui[3],
    dexItems: ui[4],
    perpItems: ui[5],
    verify: ui[6],
    code: ui[7],
    noCode: ui[8],
    codeState: ui[9],
    source: ui[10],
    route: ui[11],
    blocked: ui[12],
    unavailable: ui[13],
  };
};

const porUi = (locale, venueName) => ({
  ja: {
    badge: "支払能力と PoR",
    sourcePending: "公式ソース確認待ち",
    title: `${venueName} 準備金証明 (PoR) とオンチェーン支払能力`,
    desc: `${venueName} の準備金、監査、支払能力は最新の公式開示と再現可能なソースで確認してください。未確認の数字を保証として表示しません。`,
    total: "総準備金比率",
    pending: "確認待ち",
    snapshot: "公式レポートとスナップショット基準",
    noSource: "再現可能なソース未記録",
    audit: "監査メカニズム",
    merkle: "Merkle Root による暗号学的検証",
    protection: "投資家保護基金",
    disclosure: "公式開示を参照",
    protectionSub: "極端な市場イベントへの保護",
    btc: "BTC 準備金比率",
    eth: "ETH 準備金比率",
    stable: "USDT/USDC 準備金比率",
    btcSub: "負債に対する準備金カバーは公式ソースで確認が必要です",
    ethSub: "アドレスと監査範囲は公式ソースで確認が必要です",
    stableSub: "ステーブルコインのカバー根拠は公式ソースで確認が必要です",
    guide: "3ステップ検証ガイド",
    leaf: "Merkle リーフハッシュを取得",
    leafBody: "公式アカウントであなた専用の暗号学的リーフノードハッシュをエクスポートします。",
    verifier: "オープンソース検証ツールを実行",
    verifierBody: "Merkle Tree に沿って検証し、残高が公開ルートに含まれるか確認します。",
    wallets: "オンチェーンウォレットを照合",
    walletsBody: "公開されたコールドウォレット残高が負債を上回るか確認します。",
    principle: "自己管理セキュリティ原則",
    principleBody: "PoR は特定時点の支払能力を示します。長期保有分はハードウェアウォレットで自己管理してください。",
    auditBtn: "公式 PoR 監査レポートを見る ↗",
  },
  ko: {
    badge: "지급 능력 및 PoR",
    sourcePending: "공식 출처 확인 대기",
    title: `${venueName} 준비금 증명(PoR) 및 온체인 지급 능력`,
    desc: `${venueName}의 준비금, 감사, 지급 능력 정보는 최신 공식 공시와 재현 가능한 출처로 확인해야 합니다. 미확인 수치를 보장처럼 표시하지 않습니다.`,
    total: "총 준비금 비율",
    pending: "확인 대기",
    snapshot: "공식 보고서와 스냅샷 기준",
    noSource: "재현 가능한 출처 미기록",
    audit: "감사 메커니즘",
    merkle: "Merkle Root 암호학 검증",
    protection: "투자자 보호 기금",
    disclosure: "공식 공시 참조",
    protectionSub: "극단적 시장 이벤트 보호",
    btc: "BTC 준비금 비율",
    eth: "ETH 준비금 비율",
    stable: "USDT/USDC 준비금 비율",
    btcSub: "부채 대비 준비금 커버리지는 공식 출처 확인이 필요합니다",
    ethSub: "주소와 감사 범위는 공식 출처 확인이 필요합니다",
    stableSub: "스테이블코인 커버 근거는 공식 출처 확인이 필요합니다",
    guide: "3단계 검증 가이드",
    leaf: "Merkle 리프 해시 내보내기",
    leafBody: "공식 계정에서 본인 전용 암호학 리프 노드 해시를 내보냅니다.",
    verifier: "오픈소스 검증 도구 실행",
    verifierBody: "Merkle Tree 경로를 따라 검증해 잔액이 공개 루트에 포함되는지 확인합니다.",
    wallets: "온체인 지갑 대조",
    walletsBody: "공개된 콜드월렛 총액이 누적 부채보다 큰지 확인합니다.",
    principle: "자기 보관 보안 원칙",
    principleBody: "PoR은 특정 시점의 지급 능력 스냅샷입니다. 장기 보유 자산은 하드웨어 지갑으로 자기 보관하세요.",
    auditBtn: "공식 PoR 감사 보고서 보기 ↗",
  },
  tr: {
    badge: "Ödeme gücü ve PoR",
    sourcePending: "Resmî kaynak incelemesi bekliyor",
    title: `${venueName} Rezerv Kanıtı (PoR) ve zincir üstü ödeme gücü`,
    desc: `${venueName} rezerv, denetim ve ödeme gücü bilgileri en güncel resmî açıklama ve tekrar üretilebilir kaynakla kontrol edilmelidir; doğrulanmamış sayılar garantiye çevrilmez.`,
    total: "Toplam rezerv oranı",
    pending: "Beklemede",
    snapshot: "Resmî rapor ve anlık görüntüye göre",
    noSource: "Tekrar üretilebilir kaynak kayıtlı değil",
    audit: "Denetim mekanizması",
    merkle: "Merkle Root kriptografik doğrulama",
    protection: "Yatırımcı koruma fonu",
    disclosure: "Resmî açıklamaya bakın",
    protectionSub: "Aşırı piyasa olayları koruması",
    btc: "BTC rezerv oranı",
    eth: "ETH rezerv oranı",
    stable: "USDT/USDC rezerv oranı",
    btcSub: "Rezerv-borç kapsamı resmî kaynakla doğrulanmalıdır",
    ethSub: "Adresler ve denetim kapsamı resmî kaynakla doğrulanmalıdır",
    stableSub: "Stablecoin kapsam dayanağı resmî kaynakla doğrulanmalıdır",
    guide: "3 adımlı doğrulama rehberi",
    leaf: "Merkle yaprak hash'ini dışa aktar",
    leafBody: "Resmî hesabınızdan size ait kriptografik yaprak düğüm hash'ini dışa aktarın.",
    verifier: "Açık kaynak doğrulayıcıyı çalıştır",
    verifierBody: "Merkle Tree boyunca doğrulayarak bakiyenizin açık kökte yer aldığını kontrol edin.",
    wallets: "Zincir üstü cüzdanları karşılaştır",
    walletsBody: "Açıklanan soğuk cüzdanların toplam borçlardan fazla olup olmadığını doğrulayın.",
    principle: "Kendi saklama güvenlik ilkesi",
    principleBody: "PoR belirli bir anlık ödeme gücünü gösterir. Uzun vadeli büyük varlıkları donanım cüzdanında kendiniz saklayın.",
    auditBtn: "Resmî PoR denetim raporunu görüntüle ↗",
  },
  es: {
    badge: "Solvencia y PoR",
    sourcePending: "Fuente oficial pendiente de revisión",
    title: `${venueName}: prueba de reservas (PoR) y solvencia on-chain`,
    desc: `Las reservas, auditorías y solvencia de ${venueName} deben comprobarse con la divulgación oficial más reciente y una fuente reproducible; esta página no convierte cifras no verificadas en garantías.`,
    total: "Ratio total de reservas",
    pending: "Pendiente",
    snapshot: "Según el informe oficial y la instantánea",
    noSource: "Sin fuente reproducible registrada",
    audit: "Mecanismo de auditoría",
    merkle: "Verificación criptográfica con Merkle Root",
    protection: "Fondo de protección al inversor",
    disclosure: "Consulta la divulgación oficial",
    protectionSub: "Protección ante eventos extremos de mercado",
    btc: "Ratio de reservas BTC",
    eth: "Ratio de reservas ETH",
    stable: "Ratio de reservas USDT/USDC",
    btcSub: "La cobertura de reservas frente a pasivos requiere verificación con fuente oficial",
    ethSub: "Las direcciones y el alcance de la auditoría requieren verificación con fuente oficial",
    stableSub: "La base de cobertura de stablecoins requiere verificación con fuente oficial",
    guide: "Guía de verificación en 3 pasos",
    leaf: "Obtén el hash de tu hoja Merkle",
    leafBody: "Exporta el hash de tu nodo hoja desde tu cuenta oficial.",
    verifier: "Ejecuta el verificador de código abierto",
    verifierBody: "Recorre el árbol Merkle y comprueba que tu saldo está en la raíz publicada.",
    wallets: "Contrasta las billeteras on-chain",
    walletsBody: "Comprueba que los saldos publicados de las billeteras frías superan los pasivos.",
    principle: "Principio de autocustodia",
    principleBody: "El PoR muestra la solvencia en un momento dado. Guarda los fondos a largo plazo en una billetera de hardware propia.",
    auditBtn: "Ver informe oficial de auditoría PoR ↗",
  },
  "pt-BR": {
    badge: "Solvência e PoR",
    sourcePending: "Fonte oficial aguardando revisão",
    title: `${venueName}: prova de reservas (PoR) e solvência on-chain`,
    desc: `As reservas, auditorias e a solvência da ${venueName} devem ser conferidas na divulgação oficial mais recente e em uma fonte reproduzível; esta página não transforma números não verificados em garantia.`,
    total: "Índice total de reservas",
    pending: "Pendente",
    snapshot: "Com base no relatório oficial e no snapshot",
    noSource: "Nenhuma fonte reproduzível registrada",
    audit: "Mecanismo de auditoria",
    merkle: "Verificação criptográfica por Merkle Root",
    protection: "Fundo de proteção ao investidor",
    disclosure: "Consulte a divulgação oficial",
    protectionSub: "Proteção contra eventos extremos de mercado",
    btc: "Índice de reservas BTC",
    eth: "Índice de reservas ETH",
    stable: "Índice de reservas USDT/USDC",
    btcSub: "A cobertura das reservas frente aos passivos precisa de verificação na fonte oficial",
    ethSub: "Endereços e escopo da auditoria precisam de verificação na fonte oficial",
    stableSub: "A base de cobertura das stablecoins precisa de verificação na fonte oficial",
    guide: "Guia de verificação em 3 passos",
    leaf: "Obtenha o hash da sua folha Merkle",
    leafBody: "Exporte o hash do seu nó folha na conta oficial.",
    verifier: "Rode o verificador de código aberto",
    verifierBody: "Percorra a árvore Merkle e confirme que seu saldo está na raiz publicada.",
    wallets: "Confira as carteiras on-chain",
    walletsBody: "Verifique se os saldos publicados das carteiras frias superam os passivos.",
    principle: "Princípio da autocustódia",
    principleBody: "O PoR mostra a solvência em um momento específico. Guarde fundos de longo prazo em uma carteira de hardware própria.",
    auditBtn: "Ver relatório oficial de auditoria PoR ↗",
  },
  fr: {
    badge: "Solvabilité et PoR",
    sourcePending: "Source officielle en attente de revue",
    title: `${venueName} : preuve de réserves (PoR) et solvabilité on-chain`,
    desc: `Les réserves, audits et la solvabilité de ${venueName} doivent être vérifiés auprès de la dernière publication officielle et d’une source reproductible ; cette page ne présente pas de chiffres non vérifiés comme une garantie.`,
    total: "Ratio total de réserves",
    pending: "En attente",
    snapshot: "Selon le rapport officiel et l’instantané",
    noSource: "Aucune source reproductible enregistrée",
    audit: "Mécanisme d’audit",
    merkle: "Vérification cryptographique par Merkle Root",
    protection: "Fonds de protection des investisseurs",
    disclosure: "Voir la publication officielle",
    protectionSub: "Protection lors d’événements de marché extrêmes",
    btc: "Ratio de réserves BTC",
    eth: "Ratio de réserves ETH",
    stable: "Ratio de réserves USDT/USDC",
    btcSub: "La couverture des passifs par les réserves doit être vérifiée auprès d’une source officielle",
    ethSub: "Les adresses et le périmètre d’audit doivent être vérifiés auprès d’une source officielle",
    stableSub: "La couverture des stablecoins doit être vérifiée auprès d’une source officielle",
    guide: "Guide de vérification en 3 étapes",
    leaf: "Récupérez le hash de votre feuille Merkle",
    leafBody: "Exportez le hash de votre nœud feuille depuis votre compte officiel.",
    verifier: "Lancez le vérificateur open source",
    verifierBody: "Parcourez l’arbre de Merkle et vérifiez que votre solde figure sous la racine publiée.",
    wallets: "Comparez les portefeuilles on-chain",
    walletsBody: "Vérifiez que les soldes publiés des portefeuilles froids dépassent les passifs.",
    principle: "Principe d’auto-conservation",
    principleBody: "La PoR montre la solvabilité à un instant donné. Conservez vos avoirs de long terme dans votre propre portefeuille matériel.",
    auditBtn: "Voir le rapport d’audit PoR officiel ↗",
  },
  de: {
    badge: "Solvenz und PoR",
    sourcePending: "Offizielle Quelle in Prüfung",
    title: `${venueName}: Proof of Reserves (PoR) und On-Chain-Solvenz`,
    desc: `Reserven, Audits und Solvenz von ${venueName} sind anhand der jüngsten offiziellen Veröffentlichung und einer reproduzierbaren Quelle zu prüfen; diese Seite stellt ungeprüfte Zahlen nicht als Garantie dar.`,
    total: "Gesamte Reservequote",
    pending: "Ausstehend",
    snapshot: "Laut offiziellem Bericht und Snapshot",
    noSource: "Keine reproduzierbare Quelle erfasst",
    audit: "Prüfmechanismus",
    merkle: "Kryptografische Prüfung per Merkle Root",
    protection: "Anlegerschutzfonds",
    disclosure: "Siehe offizielle Veröffentlichung",
    protectionSub: "Schutz bei extremen Marktereignissen",
    btc: "BTC-Reservequote",
    eth: "ETH-Reservequote",
    stable: "USDT/USDC-Reservequote",
    btcSub: "Die Deckung der Verbindlichkeiten durch Reserven muss anhand offizieller Quellen geprüft werden",
    ethSub: "Adressen und Prüfumfang müssen anhand offizieller Quellen geprüft werden",
    stableSub: "Die Stablecoin-Deckung muss anhand offizieller Quellen geprüft werden",
    guide: "Prüfung in 3 Schritten",
    leaf: "Merkle-Leaf-Hash abrufen",
    leafBody: "Exportieren Sie den Hash Ihres Blattknotens im offiziellen Konto.",
    verifier: "Open-Source-Prüfer ausführen",
    verifierBody: "Gehen Sie den Merkle-Baum durch und prüfen Sie, ob Ihr Guthaben in der veröffentlichten Wurzel enthalten ist.",
    wallets: "On-Chain-Wallets abgleichen",
    walletsBody: "Prüfen Sie, ob die veröffentlichten Cold-Wallet-Bestände die Verbindlichkeiten übersteigen.",
    principle: "Prinzip der Selbstverwahrung",
    principleBody: "PoR zeigt die Solvenz zu einem Zeitpunkt. Bewahren Sie langfristige Bestände in einer eigenen Hardware-Wallet auf.",
    auditBtn: "Offiziellen PoR-Prüfbericht ansehen ↗",
  },
  ar: {
    badge: "الملاءة وإثبات الاحتياطيات",
    sourcePending: "المصدر الرسمي قيد المراجعة",
    title: `${venueName}: إثبات الاحتياطيات (PoR) والملاءة على السلسلة`,
    desc: `يجب التحقق من احتياطيات ${venueName} وتدقيقها وملاءتها من أحدث إفصاح رسمي ومصدر قابل لإعادة التحقق؛ لا تعرض هذه الصفحة أرقاماً غير متحقق منها كضمان.`,
    total: "نسبة الاحتياطي الإجمالية",
    pending: "قيد الانتظار",
    snapshot: "وفق التقرير الرسمي واللقطة",
    noSource: "لا يوجد مصدر قابل لإعادة التحقق",
    audit: "آلية التدقيق",
    merkle: "تحقق تشفيري عبر Merkle Root",
    protection: "صندوق حماية المستثمرين",
    disclosure: "راجع الإفصاح الرسمي",
    protectionSub: "حماية عند أحداث السوق القصوى",
    btc: "نسبة احتياطي BTC",
    eth: "نسبة احتياطي ETH",
    stable: "نسبة احتياطي USDT/USDC",
    btcSub: "تغطية الاحتياطيات للالتزامات تحتاج إلى تحقق من مصدر رسمي",
    ethSub: "العناوين ونطاق التدقيق تحتاج إلى تحقق من مصدر رسمي",
    stableSub: "أساس تغطية العملات المستقرة يحتاج إلى تحقق من مصدر رسمي",
    guide: "دليل التحقق في 3 خطوات",
    leaf: "احصل على تجزئة ورقة Merkle",
    leafBody: "صدّر تجزئة العقدة الورقية الخاصة بك من حسابك الرسمي.",
    verifier: "شغّل أداة التحقق مفتوحة المصدر",
    verifierBody: "تتبّع شجرة Merkle وتأكد من أن رصيدك ضمن الجذر المنشور.",
    wallets: "طابق المحافظ على السلسلة",
    walletsBody: "تحقق من أن أرصدة المحافظ الباردة المنشورة تتجاوز الالتزامات.",
    principle: "مبدأ الحفظ الذاتي",
    principleBody: "يُظهر PoR الملاءة في لحظة محددة. احتفظ بأموالك طويلة الأجل في محفظة أجهزة خاصة بك.",
    auditBtn: "عرض تقرير تدقيق PoR الرسمي ↗",
  },
  ru: {
    badge: "Платёжеспособность и PoR",
    sourcePending: "Официальный источник на проверке",
    title: `${venueName}: подтверждение резервов (PoR) и платёжеспособность в сети`,
    desc: `Резервы, аудит и платёжеспособность ${venueName} нужно сверять с последним официальным раскрытием и воспроизводимым источником; страница не выдаёт непроверенные цифры за гарантию.`,
    total: "Общий коэффициент резервов",
    pending: "Ожидает проверки",
    snapshot: "По официальному отчёту и снимку",
    noSource: "Воспроизводимый источник не записан",
    audit: "Механизм аудита",
    merkle: "Криптографическая проверка через Merkle Root",
    protection: "Фонд защиты инвесторов",
    disclosure: "См. официальное раскрытие",
    protectionSub: "Защита при экстремальных событиях рынка",
    btc: "Коэффициент резервов BTC",
    eth: "Коэффициент резервов ETH",
    stable: "Коэффициент резервов USDT/USDC",
    btcSub: "Покрытие обязательств резервами требует проверки по официальному источнику",
    ethSub: "Адреса и объём аудита требуют проверки по официальному источнику",
    stableSub: "Основание покрытия стейблкоинов требует проверки по официальному источнику",
    guide: "Проверка в 3 шага",
    leaf: "Получите хеш листа Merkle",
    leafBody: "Экспортируйте хеш своего листового узла в официальном аккаунте.",
    verifier: "Запустите открытый верификатор",
    verifierBody: "Пройдите по дереву Merkle и убедитесь, что ваш баланс входит в опубликованный корень.",
    wallets: "Сверьте кошельки в сети",
    walletsBody: "Проверьте, что опубликованные балансы холодных кошельков превышают обязательства.",
    principle: "Принцип самостоятельного хранения",
    principleBody: "PoR показывает платёжеспособность на определённый момент. Долгосрочные средства храните в собственном аппаратном кошельке.",
    auditBtn: "Открыть официальный отчёт об аудите PoR ↗",
  },
  id: {
    badge: "Solvabilitas & PoR",
    sourcePending: "Sumber resmi menunggu peninjauan",
    title: `${venueName}: bukti cadangan (PoR) dan solvabilitas on-chain`,
    desc: `Cadangan, audit, dan solvabilitas ${venueName} perlu dicek dengan pengungkapan resmi terbaru dan sumber yang dapat direproduksi; halaman ini tidak menjadikan angka yang belum diverifikasi sebagai jaminan.`,
    total: "Rasio cadangan total",
    pending: "Menunggu",
    snapshot: "Berdasarkan laporan resmi dan snapshot",
    noSource: "Belum ada sumber yang dapat direproduksi",
    audit: "Mekanisme audit",
    merkle: "Verifikasi kriptografis Merkle Root",
    protection: "Dana perlindungan investor",
    disclosure: "Lihat pengungkapan resmi",
    protectionSub: "Perlindungan saat kejadian pasar ekstrem",
    btc: "Rasio cadangan BTC",
    eth: "Rasio cadangan ETH",
    stable: "Rasio cadangan USDT/USDC",
    btcSub: "Cakupan cadangan terhadap kewajiban perlu diverifikasi dengan sumber resmi",
    ethSub: "Alamat dan cakupan audit perlu diverifikasi dengan sumber resmi",
    stableSub: "Dasar cakupan stablecoin perlu diverifikasi dengan sumber resmi",
    guide: "Panduan verifikasi 3 langkah",
    leaf: "Ambil hash daun Merkle Anda",
    leafBody: "Ekspor hash node daun Anda dari akun resmi.",
    verifier: "Jalankan verifikator open source",
    verifierBody: "Telusuri pohon Merkle dan pastikan saldo Anda ada di root yang dipublikasikan.",
    wallets: "Cocokkan dompet on-chain",
    walletsBody: "Pastikan saldo dompet dingin yang dipublikasikan melebihi kewajiban.",
    principle: "Prinsip kustodi mandiri",
    principleBody: "PoR menunjukkan solvabilitas pada satu waktu. Simpan dana jangka panjang di dompet hardware milik sendiri.",
    auditBtn: "Lihat laporan audit PoR resmi ↗",
  },
  vi: {
    badge: "Khả năng thanh toán & PoR",
    sourcePending: "Nguồn chính thức đang chờ xem xét",
    title: `${venueName}: bằng chứng dự trữ (PoR) và khả năng thanh toán on-chain`,
    desc: `Dự trữ, kiểm toán và khả năng thanh toán của ${venueName} cần được đối chiếu với công bố chính thức mới nhất và nguồn có thể tái kiểm; trang này không biến số liệu chưa xác minh thành cam kết.`,
    total: "Tỷ lệ dự trữ tổng",
    pending: "Đang chờ",
    snapshot: "Theo báo cáo chính thức và ảnh chụp số dư",
    noSource: "Chưa ghi nhận nguồn có thể tái kiểm",
    audit: "Cơ chế kiểm toán",
    merkle: "Xác minh mật mã bằng Merkle Root",
    protection: "Quỹ bảo vệ nhà đầu tư",
    disclosure: "Xem công bố chính thức",
    protectionSub: "Bảo vệ khi thị trường biến động cực đoan",
    btc: "Tỷ lệ dự trữ BTC",
    eth: "Tỷ lệ dự trữ ETH",
    stable: "Tỷ lệ dự trữ USDT/USDC",
    btcSub: "Mức dự trữ so với nợ phải trả cần xác minh từ nguồn chính thức",
    ethSub: "Địa chỉ và phạm vi kiểm toán cần xác minh từ nguồn chính thức",
    stableSub: "Cơ sở bảo chứng stablecoin cần xác minh từ nguồn chính thức",
    guide: "Hướng dẫn xác minh 3 bước",
    leaf: "Lấy hash lá Merkle",
    leafBody: "Xuất hash nút lá của bạn từ tài khoản chính thức.",
    verifier: "Chạy công cụ xác minh mã nguồn mở",
    verifierBody: "Duyệt cây Merkle và kiểm tra số dư của bạn nằm trong gốc đã công bố.",
    wallets: "Đối chiếu ví on-chain",
    walletsBody: "Kiểm tra số dư ví lạnh đã công bố lớn hơn nợ phải trả.",
    principle: "Nguyên tắc tự lưu ký",
    principleBody: "PoR cho thấy khả năng thanh toán tại một thời điểm. Hãy giữ tài sản dài hạn trong ví cứng của riêng bạn.",
    auditBtn: "Xem báo cáo kiểm toán PoR chính thức ↗",
  },
  it: {
    badge: "Solvibilità e PoR",
    sourcePending: "Fonte ufficiale in revisione",
    title: `${venueName}: prova delle riserve (PoR) e solvibilità on-chain`,
    desc: `Riserve, audit e solvibilità di ${venueName} vanno verificati con l’ultima comunicazione ufficiale e una fonte riproducibile; questa pagina non presenta cifre non verificate come garanzia.`,
    total: "Rapporto totale delle riserve",
    pending: "In attesa",
    snapshot: "In base al report ufficiale e allo snapshot",
    noSource: "Nessuna fonte riproducibile registrata",
    audit: "Meccanismo di audit",
    merkle: "Verifica crittografica tramite Merkle Root",
    protection: "Fondo di protezione degli investitori",
    disclosure: "Vedi la comunicazione ufficiale",
    protectionSub: "Protezione in caso di eventi di mercato estremi",
    btc: "Rapporto riserve BTC",
    eth: "Rapporto riserve ETH",
    stable: "Rapporto riserve USDT/USDC",
    btcSub: "La copertura delle passività con le riserve va verificata con una fonte ufficiale",
    ethSub: "Indirizzi e perimetro dell’audit vanno verificati con una fonte ufficiale",
    stableSub: "La copertura delle stablecoin va verificata con una fonte ufficiale",
    guide: "Guida alla verifica in 3 passi",
    leaf: "Ottieni l’hash della tua foglia Merkle",
    leafBody: "Esporta l’hash del tuo nodo foglia dall’account ufficiale.",
    verifier: "Esegui il verificatore open source",
    verifierBody: "Percorri l’albero Merkle e verifica che il tuo saldo sia nella radice pubblicata.",
    wallets: "Confronta i wallet on-chain",
    walletsBody: "Verifica che i saldi pubblicati dei cold wallet superino le passività.",
    principle: "Principio di autocustodia",
    principleBody: "La PoR mostra la solvibilità in un dato momento. Conserva i fondi di lungo periodo in un tuo hardware wallet.",
    auditBtn: "Vedi il report ufficiale di audit PoR ↗",
  },
}[localeKey(locale)] || {});

const compareUi = (locale) => {
  const labels = ({
  "pt-BR": { curatedOpen:"Abrir rotas de comparação selecionadas", curatedTitle:"Comparações selecionadas de plataformas", curatedHint:"Compare taxas, produtos e condições regionais pela data da fonte", compareBadge:"COMPARAR", jump:"Ir na página", official:"Comparação com fontes oficiais", matrix:"Comparação de taxas, benefícios, reservas e limites", matrixLead:"Comparamos tabelas oficiais de taxas, auditorias de reservas e condições verificadas.", review:"Revisar verificações e limites", sources:"Referências e fontes oficiais", visit:"Visitar site oficial", faq:"FAQ e decisão da comparação", faqLead:"Respostas baseadas em fontes para dúvidas sobre as duas plataformas.", metrics:"Métricas", trust:"Pontuação de confiança", spotFee:"Taxa spot maker / taker", futuresFee:"Taxa de futuros maker / taker", benefitStatus:"Status dos benefícios do usuário", netCost:"Custo líquido efetivo", por:"Prova de reservas (PoR)", kyc:"Requisitos de KYC", leverage:"Alavancagem máxima de futuros", bonus:"Benefícios para novos usuários" },
  es: { curatedOpen:"Abrir rutas de comparación seleccionadas", curatedTitle:"Comparaciones de plataformas seleccionadas", curatedHint:"Compara comisiones, productos y condiciones regionales según la fecha de la fuente", compareBadge:"COMPARAR", jump:"Ir en la página", official:"Comparación con fuentes oficiales", matrix:"Comparación de comisiones, beneficios, reservas y límites", matrixLead:"Comparamos con tablas oficiales de comisiones, auditorías de reservas y condiciones verificadas.", review:"Revisar verificaciones y límites", sources:"Referencias y fuentes oficiales", visit:"Visitar sitio oficial", faq:"Preguntas y decisión de la comparación", faqLead:"Respuestas basadas en fuentes a las preguntas frecuentes sobre ambas plataformas.", metrics:"Métricas", trust:"Puntuación de confianza", spotFee:"Comisión spot maker / taker", futuresFee:"Comisión de futuros maker / taker", benefitStatus:"Estado de beneficios del usuario", netCost:"Coste neto efectivo", por:"Prueba de reservas (PoR)", kyc:"Requisitos de KYC", leverage:"Apalancamiento máximo de futuros", bonus:"Beneficios para nuevos usuarios" },
  ja: { curatedOpen:"厳選比較パスを開く", curatedTitle:"厳選プラットフォーム比較", curatedHint:"出典日を基準に手数料、商品、地域条件を確認", compareBadge:"比較", jump: "ページ内移動", official: "公式ソース比較", matrix: "手数料・特典・準備金・上限の比較", matrixLead: "公式の手数料表、準備金監査、確認済みの条件を基に比較します。", review: "確認内容と制限を見る", sources: "公式参考資料とソース", visit: "公式サイトへ", faq: "比較FAQと判断", faqLead: "両プラットフォームの比較でよくある質問に、出典付きで回答します。", metrics: "指標", trust: "信頼スコア", spotFee: "現物メイカー / テイカー手数料", futuresFee: "先物メイカー / テイカー手数料", benefitStatus: "ユーザー特典の状態", netCost: "実効純コスト", por: "準備金証明 (PoR)", kyc: "KYC要件", leverage: "最大先物レバレッジ", bonus: "新規ユーザー特典" },
  ko: { curatedOpen:"추천 비교 경로 열기", curatedTitle:"추천 플랫폼 비교", curatedHint:"출처 날짜 기준으로 수수료, 상품과 지역 조건을 확인하세요", compareBadge:"비교", jump: "페이지 이동", official: "공식 출처 비교", matrix: "수수료·혜택·준비금·한도 비교", matrixLead: "공식 수수료표, 준비금 감사 및 확인된 조건을 기준으로 비교합니다.", review: "검증 내용과 제한 보기", sources: "공식 참고자료와 출처", visit: "공식 사이트 방문", faq: "비교 FAQ와 판단", faqLead: "두 플랫폼을 비교할 때 자주 묻는 질문에 출처를 바탕으로 답합니다.", metrics: "지표", trust: "신뢰 점수", spotFee: "현물 메이커 / 테이커 수수료", futuresFee: "선물 메이커 / 테이커 수수료", benefitStatus: "사용자 혜택 상태", netCost: "실효 순비용", por: "준비금 증명 (PoR)", kyc: "KYC 요건", leverage: "최대 선물 레버리지", bonus: "신규 사용자 보상" },
  tr: { curatedOpen:"Seçili karşılaştırma yollarını aç", curatedTitle:"Seçili platform karşılaştırmaları", curatedHint:"Ücretleri, ürünleri ve bölgesel koşulları kaynak tarihine göre inceleyin", compareBadge:"KARŞILAŞTIR", jump: "Sayfada geçiş", official: "Resmî kaynak karşılaştırması", matrix: "Ücret, avantaj, rezerv ve limit karşılaştırması", matrixLead: "Resmî ücret tabloları, rezerv denetimleri ve doğrulanmış koşullara göre karşılaştırırız.", review: "Doğrulama ayrıntılarını ve sınırları incele", sources: "Resmî referanslar ve kaynaklar", visit: "Resmî siteyi ziyaret et", faq: "Karşılaştırma SSS ve karar", faqLead: "İki platform arasındaki karşılaştırma sorularını kaynaklara dayanarak yanıtlar.", metrics: "Metrikler", trust: "Güven puanı", spotFee: "Spot Maker / Taker ücreti", futuresFee: "Vadeli Maker / Taker ücreti", benefitStatus: "Kullanıcı avantajı durumu", netCost: "Net etkin maliyet", por: "Rezerv kanıtı (PoR)", kyc: "KYC gereksinimleri", leverage: "Maksimum vadeli kaldıraç", bonus: "Yeni kullanıcı ödülü" },
  }[localeKey(locale)] || {});
  if (Object.keys(labels).length) return labels;
  const fallback = {
    fr: { curatedOpen: "Ouvrir les comparaisons sélectionnées", curatedTitle: "Comparaisons sélectionnées", curatedHint: "Comparez frais, produits et conditions régionales", compareBadge: "COMPARER", jump: "Accéder à la section", official: "Comparaison avec sources officielles", matrix: "Matrice des frais, réserves et limites", matrixLead: "Comparaison fondée sur les sources officielles et les conditions vérifiées.", review: "Vérifier les détails et limites", sources: "Références officielles", visit: "Visiter le site officiel", faq: "FAQ de comparaison", faqLead: "Réponses sourcées pour choisir entre les deux plateformes.", metrics: "Indicateurs", trust: "Score de confiance", spotFee: "Frais spot maker / taker", futuresFee: "Frais futures maker / taker", benefitStatus: "Statut des avantages", netCost: "Coût net effectif", por: "Preuve de réserves (PoR)", kyc: "Exigences KYC", leverage: "Levier futures maximal", bonus: "Avantages nouveaux utilisateurs" },
    de: { curatedOpen: "Ausgewählte Vergleiche öffnen", curatedTitle: "Ausgewählte Plattformvergleiche", curatedHint: "Gebühren, Produkte und regionale Bedingungen vergleichen", compareBadge: "VERGLEICH", jump: "Zum Abschnitt", official: "Vergleich mit offiziellen Quellen", matrix: "Vergleich von Gebühren, Reserven und Limits", matrixLead: "Vergleich anhand offizieller Quellen und geprüfter Bedingungen.", review: "Prüfdetails und Limits ansehen", sources: "Offizielle Quellen", visit: "Offizielle Website besuchen", faq: "Vergleichs-FAQ", faqLead: "Quellenbasierte Antworten für die Wahl zwischen beiden Plattformen.", metrics: "Kennzahlen", trust: "Vertrauensscore", spotFee: "Spot Maker-/Taker-Gebühr", futuresFee: "Futures Maker-/Taker-Gebühr", benefitStatus: "Vorteilsstatus", netCost: "Effektive Nettokosten", por: "Reservenachweis (PoR)", kyc: "KYC-Anforderungen", leverage: "Maximales Futures-Leverage", bonus: "Vorteile für neue Nutzer" },
    ru: { curatedOpen: "Открыть подборку сравнений", curatedTitle: "Подборка сравнений платформ", curatedHint: "Сравните комиссии, продукты и региональные условия", compareBadge: "СРАВНИТЬ", jump: "Перейти к разделу", official: "Сравнение по официальным источникам", matrix: "Сравнение комиссий, резервов и лимитов", matrixLead: "Сравнение по официальным источникам и подтверждённым условиям.", review: "Проверить детали и ограничения", sources: "Официальные источники", visit: "Открыть официальный сайт", faq: "FAQ сравнения", faqLead: "Ответы с источниками для выбора между двумя платформами.", metrics: "Показатели", trust: "Оценка доверия", spotFee: "Комиссия за спот: мейкер / тейкер", futuresFee: "Комиссия за фьючерсы: мейкер / тейкер", benefitStatus: "Статус преимуществ", netCost: "Эффективная чистая стоимость", por: "Подтверждение резервов (PoR)", kyc: "Требования KYC", leverage: "Максимальное плечо по фьючерсам", bonus: "Преимущества новых пользователей" },
    ar: { curatedOpen: "فتح المقارنات المختارة", curatedTitle: "مقارنات المنصات المختارة", curatedHint: "قارن الرسوم والمنتجات والشروط الإقليمية", compareBadge: "مقارنة", jump: "الانتقال إلى القسم", official: "مقارنة بمصادر رسمية", matrix: "مقارنة الرسوم والاحتياطيات والحدود", matrixLead: "مقارنة مبنية على المصادر الرسمية والشروط المسجلة.", review: "مراجعة التفاصيل والحدود", sources: "المصادر الرسمية", visit: "زيارة الموقع الرسمي", faq: "الأسئلة الشائعة للمقارنة", faqLead: "إجابات مسجلة للمفاضلة بين المنصتين.", metrics: "المؤشرات", trust: "درجة الثقة", spotFee: "رسوم السبوت: صانع / آخذ", futuresFee: "رسوم العقود الآجلة: صانع / آخذ", benefitStatus: "حالة مزايا المستخدم", netCost: "التكلفة الصافية الفعلية", por: "إثبات الاحتياطيات (PoR)", kyc: "متطلبات KYC", leverage: "الرافعة القصوى للعقود", bonus: "مزايا المستخدم الجديد" },
    id: { curatedOpen: "Buka perbandingan pilihan", curatedTitle: "Perbandingan platform pilihan", curatedHint: "Bandingkan biaya, produk, dan ketentuan wilayah", compareBadge: "BANDINGKAN", jump: "Ke bagian", official: "Perbandingan dari sumber resmi", matrix: "Perbandingan biaya, cadangan, dan batas", matrixLead: "Perbandingan berdasarkan sumber resmi dan kondisi terverifikasi.", review: "Tinjau detail dan batas", sources: "Sumber resmi", visit: "Kunjungi situs resmi", faq: "FAQ perbandingan", faqLead: "Jawaban berbasis sumber untuk memilih antara dua platform.", metrics: "Metrik", trust: "Skor kepercayaan", spotFee: "Biaya spot maker / taker", futuresFee: "Biaya futures maker / taker", benefitStatus: "Status manfaat pengguna", netCost: "Biaya bersih efektif", por: "Bukti cadangan (PoR)", kyc: "Persyaratan KYC", leverage: "Leverage futures maksimum", bonus: "Manfaat pengguna baru" },
    vi: { curatedOpen: "Mở các so sánh chọn lọc", curatedTitle: "So sánh nền tảng chọn lọc", curatedHint: "So sánh phí, sản phẩm và điều kiện khu vực", compareBadge: "SO SÁNH", jump: "Đến phần", official: "So sánh theo nguồn chính thức", matrix: "So sánh phí, dự trữ và hạn mức", matrixLead: "So sánh dựa trên nguồn chính thức và điều kiện đã xác minh.", review: "Xem chi tiết và giới hạn", sources: "Nguồn chính thức", visit: "Mở trang chính thức", faq: "FAQ so sánh", faqLead: "Câu trả lời có nguồn để chọn giữa hai nền tảng.", metrics: "Chỉ số", trust: "Điểm tin cậy", spotFee: "Phí spot maker / taker", futuresFee: "Phí futures maker / taker", benefitStatus: "Trạng thái ưu đãi", netCost: "Chi phí ròng thực", por: "Bằng chứng dự trữ (PoR)", kyc: "Yêu cầu KYC", leverage: "Đòn bẩy futures tối đa", bonus: "Ưu đãi người dùng mới" },
    it: { curatedOpen: "Apri i confronti selezionati", curatedTitle: "Confronti selezionati", curatedHint: "Confronta commissioni, prodotti e condizioni regionali", compareBadge: "CONFRONTA", jump: "Vai alla sezione", official: "Confronto con fonti ufficiali", matrix: "Confronto di commissioni, riserve e limiti", matrixLead: "Confronto basato su fonti ufficiali e condizioni verificate.", review: "Rivedi dettagli e limiti", sources: "Fonti ufficiali", visit: "Visita il sito ufficiale", faq: "FAQ del confronto", faqLead: "Risposte con fonti per scegliere tra le due piattaforme.", metrics: "Metriche", trust: "Punteggio di fiducia", spotFee: "Commissione spot maker / taker", futuresFee: "Commissione futures maker / taker", benefitStatus: "Stato dei vantaggi", netCost: "Costo netto effettivo", por: "Prova delle riserve (PoR)", kyc: "Requisiti KYC", leverage: "Leva futures massima", bonus: "Vantaggi per nuovi utenti" },
  }[textLocaleKey(locale)] || {};
  // Plain-language name for the side-by-side numbers block (was the untranslated internal word "Metrics").
  const metrics = {
    en: "Side-by-side numbers", "zh-Hans": "数据对比", "zh-Hant": "數據對比", es: "Cifras lado a lado", "pt-BR": "Números lado a lado",
    fr: "Chiffres côte à côte", de: "Zahlen im Vergleich", ja: "数値の比較", ko: "수치 비교", ar: "مقارنة الأرقام",
    tr: "Rakamlar yan yana", ru: "Цифры рядом", id: "Angka berdampingan", vi: "So sánh số liệu", it: "Numeri a confronto",
  }[textLocaleKey(locale)] || "Side-by-side numbers";
  return { ...labels, ...fallback, metrics };
};

const matrixUi = (locale) => {
  const labels = compareUi(locale);
  const hints = {
    en: { hintSpot: "Standard spot trading fees", hintFutures: "Standard perpetual futures fees" },
    "zh-Hans": { hintSpot: "现货交易标准费率", hintFutures: "永续合约标准费率" },
    "zh-Hant": { hintSpot: "現貨交易標準費率", hintFutures: "永續合約標準費率" },
    es: { hintSpot: "Comisiones spot estándar", hintFutures: "Comisiones estándar de futuros perpetuos" },
    "pt-BR": { hintSpot: "Taxas padrão de negociação spot", hintFutures: "Taxas padrão de futuros perpétuos" },
    fr: { hintSpot: "Frais spot standards", hintFutures: "Frais standards des contrats perpétuels" },
    de: { hintSpot: "Standardgebühren für Spot-Handel", hintFutures: "Standardgebühren für Perpetual-Futures" },
    ja: { hintSpot: "現物取引の標準手数料", hintFutures: "パーペチュアル先物の標準手数料" },
    ko: { hintSpot: "현물 거래 표준 수수료", hintFutures: "무기한 선물 표준 수수료" },
    ar: { hintSpot: "رسوم التداول الفوري القياسية", hintFutures: "رسوم العقود الدائمة القياسية" },
    tr: { hintSpot: "Standart spot işlem ücretleri", hintFutures: "Perpetual vadeli işlem ücretleri" },
    ru: { hintSpot: "Стандартные комиссии спот", hintFutures: "Стандартные комиссии бессрочных фьючерсов" },
    id: { hintSpot: "Biaya standar perdagangan spot", hintFutures: "Biaya standar futures perpetual" },
    vi: { hintSpot: "Phí giao dịch spot tiêu chuẩn", hintFutures: "Phí futures vĩnh viễn tiêu chuẩn" },
    it: { hintSpot: "Commissioni spot standard", hintFutures: "Commissioni futures perpetui standard" },
  }[textLocaleKey(locale)] || {};
  return {
    spot: labels.spotFee || "Spot maker / taker fee",
    futures: labels.futuresFee || "Futures maker / taker fee",
    benefit: labels.benefitStatus || "User benefit status",
    net: labels.netCost || "Effective net cost",
    por: labels.por || "Proof of Reserves (PoR)",
    kyc: labels.kyc || "KYC requirements",
    leverage: labels.leverage || "Maximum futures leverage",
    bonus: labels.bonus || "New user benefits",
    metrics: labels.metrics || "Metrics",
    hintSpot: hints.hintSpot || "Standard spot trading fees",
    hintFutures: hints.hintFutures || "Standard perpetual futures fees",
  };
};




const compareLeverageHint = (locale) => ({
  en: "BTC/ETH perpetual contracts",
  "zh-Hans": "主流币永续合约最高杠杆",
  "zh-Hant": "主流幣永續合約最高槓桿",
  es: "Contratos perpetuos BTC/ETH",
  "pt-BR": "Contratos perpétuos BTC/ETH",
  fr: "Contrats perpétuels BTC/ETH",
  de: "BTC/ETH-Perpetual-Kontrakte",
  ja: "BTC/ETH パーペチュアル契約",
  ko: "BTC/ETH 무기한 계약",
  ar: "عقود BTC/ETH الدائمة",
  tr: "BTC/ETH perpetual sözleşmeleri",
  ru: "Бессрочные контракты BTC/ETH",
  id: "Kontrak perpetual BTC/ETH",
  vi: "Hợp đồng vĩnh viễn BTC/ETH",
  it: "Contratti perpetui BTC/ETH",
}[textLocaleKey(locale)] || "BTC/ETH perpetual contracts");

const compareCompactLabel = (locale, key) => {
  const labels = {
    compareFirst: {
      en: "Compare first", "zh-Hans": "先比较", "zh-Hant": "先比較", es: "Comparar primero", "pt-BR": "Comparar primeiro", fr: "Comparer d’abord", de: "Zuerst vergleichen", ja: "まず比較", ko: "먼저 비교", ar: "قارن أولاً", tr: "Önce karşılaştır", ru: "Сначала сравнить", id: "Bandingkan dulu", vi: "So sánh trước", it: "Confronta prima",
    },
    nextStep: {
      en: "Next step", "zh-Hans": "下一步", "zh-Hant": "下一步", es: "Siguiente paso", "pt-BR": "Próximo passo", fr: "Étape suivante", de: "Nächster Schritt", ja: "次のステップ", ko: "다음 단계", ar: "الخطوة التالية", tr: "Sonraki adım", ru: "Следующий шаг", id: "Langkah berikutnya", vi: "Bước tiếp theo", it: "Prossimo passo",
    },
    join: {
      en: "Join", "zh-Hans": "开户", "zh-Hant": "開戶", es: "Registrarse", "pt-BR": "Cadastrar", fr: "S’inscrire", de: "Registrieren", ja: "登録", ko: "가입", ar: "تسجيل", tr: "Katıl", ru: "Регистрация", id: "Daftar", vi: "Đăng ký", it: "Registrati",
    },
    verify: {
      en: "Verify", "zh-Hans": "先核对", "zh-Hant": "先核對", es: "Verificar", "pt-BR": "Verificar", fr: "Vérifier", de: "Prüfen", ja: "確認", ko: "확인", ar: "تحقق", tr: "Doğrula", ru: "Проверить", id: "Periksa", vi: "Kiểm tra", it: "Verifica",
    },
  };
  return labels[key]?.[textLocaleKey(locale)] || labels[key]?.en || "";
};

const compareMatrixAuxCopy = (locale) => ({
  en: {
    scrollHint: "Swipe the matrix sideways to compare all columns.",
    pendingTitle: "Items we have not checked yet",
    pendingSummary: "Show items not checked yet",
    pendingLead: "These rows are grouped because every selected platform still needs official-source verification. Open them to keep the original field names and limits visible.",
    pendingSuffix: "Not shown as a scored difference until at least one selected platform has a source-linked value.",
  },
  "zh-Hans": {
    scrollHint: "可横向滑动矩阵，查看全部平台列。",
    pendingTitle: "尚未核对的项目",
    pendingSummary: "查看尚未核对的项目",
    pendingLead: "这些行在当前所选平台中全部缺少官方来源核验，因此合并展示；展开后仍保留原字段名和限制说明。",
    pendingSuffix: "至少有一个平台出现带来源的数值后，才进入主表参与差异判断。",
  },
  "zh-Hant": {
    scrollHint: "可橫向滑動矩陣，查看全部平台欄。",
    pendingTitle: "尚未核對的項目",
    pendingSummary: "查看尚未核對的項目",
    pendingLead: "這些行在目前所選平台中全部缺少官方來源核驗，因此合併展示；展開後仍保留原欄位名和限制說明。",
    pendingSuffix: "至少有一個平台出現帶來源的數值後，才進入主表參與差異判斷。",
  },
  es: {
    scrollHint: "Desliza la matriz hacia los lados para ver todas las columnas.",
    pendingTitle: "Datos que aún no hemos comprobado",
    pendingSummary: "Ver datos aún sin comprobar",
    pendingLead: "Estas filas se agrupan porque todas las plataformas seleccionadas aún requieren verificación de fuente oficial. Al abrirlas se conservan los nombres y límites originales.",
    pendingSuffix: "No se muestran como diferencia puntuable hasta que al menos una plataforma tenga un valor con fuente.",
  },
  "pt-BR": {
    scrollHint: "Deslize a matriz para os lados para comparar todas as colunas.",
    pendingTitle: "Dados que ainda não conferimos",
    pendingSummary: "Ver dados ainda não conferidos",
    pendingLead: "Essas linhas ficam agrupadas porque todas as plataformas selecionadas ainda exigem verificação em fonte oficial. Ao abrir, os nomes e limites originais continuam visíveis.",
    pendingSuffix: "Não entram como diferença pontuada até que pelo menos uma plataforma tenha valor com fonte.",
  },
  fr: {
    scrollHint: "Faites glisser la matrice horizontalement pour comparer toutes les colonnes.",
    pendingTitle: "Données pas encore vérifiées",
    pendingSummary: "Voir les données pas encore vérifiées",
    pendingLead: "Ces lignes sont regroupées parce que toutes les plateformes sélectionnées nécessitent encore une vérification de source officielle. Les noms et limites d’origine restent visibles à l’ouverture.",
    pendingSuffix: "Elles ne sont pas notées comme différence tant qu’au moins une plateforme n’a pas de valeur sourcée.",
  },
  de: {
    scrollHint: "Wischen Sie die Matrix seitlich, um alle Spalten zu vergleichen.",
    pendingTitle: "Noch nicht geprüfte Angaben",
    pendingSummary: "Noch nicht geprüfte Angaben anzeigen",
    pendingLead: "Diese Zeilen sind gebündelt, weil alle ausgewählten Plattformen noch eine Prüfung offizieller Quellen benötigen. Beim Öffnen bleiben ursprüngliche Feldnamen und Grenzen sichtbar.",
    pendingSuffix: "Sie werden erst als bewertete Differenz angezeigt, wenn mindestens eine Plattform einen belegten Wert hat.",
  },
  ja: {
    scrollHint: "表を横にスワイプすると、すべての列を比較できます。",
    pendingTitle: "まだ確認できていない項目",
    pendingSummary: "未確認の項目を見る",
    pendingLead: "選択中のすべてのプラットフォームで公式ソース確認が必要な行をまとめています。展開すると元の項目名と制限を確認できます。",
    pendingSuffix: "少なくとも1社に出典付きの値が出るまでは、差分評価の主表には表示しません。",
  },
  ko: {
    scrollHint: "표를 좌우로 밀어 모든 열을 비교하세요.",
    pendingTitle: "아직 확인하지 못한 항목",
    pendingSummary: "미확인 항목 보기",
    pendingLead: "선택한 모든 플랫폼에서 공식 출처 확인이 필요한 행을 묶었습니다. 펼치면 원래 필드명과 제한 설명을 그대로 볼 수 있습니다.",
    pendingSuffix: "최소 한 플랫폼에 출처가 연결된 값이 생기기 전까지는 점수 차이로 표시하지 않습니다.",
  },
  ar: {
    scrollHint: "اسحب المصفوفة جانبياً لمقارنة كل الأعمدة.",
    pendingTitle: "بيانات لم نتحقق منها بعد",
    pendingSummary: "عرض البيانات التي لم نتحقق منها",
    pendingLead: "جُمعت هذه الصفوف لأن كل المنصات المختارة ما زالت تحتاج تحققاً من مصدر رسمي. عند الفتح تبقى أسماء الحقول والقيود الأصلية ظاهرة.",
    pendingSuffix: "لا تُعرض كفرق قابل للتقييم حتى تمتلك منصة واحدة على الأقل قيمة مرتبطة بمصدر.",
  },
  tr: {
    scrollHint: "Tüm sütunları karşılaştırmak için matrisi yana kaydırın.",
    pendingTitle: "Henüz kontrol etmediğimiz bilgiler",
    pendingSummary: "Kontrol edilmemiş bilgileri göster",
    pendingLead: "Bu satırlar, seçili tüm platformlarda hâlâ resmî kaynak doğrulaması gerektiği için gruplandı. Açıldığında özgün alan adları ve sınırlar korunur.",
    pendingSuffix: "En az bir platformda kaynaklı değer oluşmadan puanlanan fark olarak gösterilmez.",
  },
  ru: {
    scrollHint: "Проведите матрицу в сторону, чтобы сравнить все столбцы.",
    pendingTitle: "Данные, которые мы ещё не проверили",
    pendingSummary: "Показать непроверенные данные",
    pendingLead: "Эти строки сгруппированы, потому что по всем выбранным платформам ещё нужна проверка официального источника. При раскрытии исходные названия и ограничения сохранены.",
    pendingSuffix: "Они не участвуют в оценке различий, пока хотя бы у одной платформы не появится значение с источником.",
  },
  id: {
    scrollHint: "Geser matriks ke samping untuk membandingkan semua kolom.",
    pendingTitle: "Data yang belum kami periksa",
    pendingSummary: "Lihat data yang belum diperiksa",
    pendingLead: "Baris ini dikelompokkan karena semua platform terpilih masih memerlukan verifikasi sumber resmi. Saat dibuka, nama bidang dan batas aslinya tetap terlihat.",
    pendingSuffix: "Tidak ditampilkan sebagai perbedaan bernilai sampai setidaknya satu platform memiliki nilai bersumber.",
  },
  vi: {
    scrollHint: "Vuốt ma trận sang ngang để so sánh tất cả cột.",
    pendingTitle: "Thông tin chúng tôi chưa kiểm tra",
    pendingSummary: "Xem thông tin chưa kiểm tra",
    pendingLead: "Các hàng này được gộp vì mọi nền tảng đã chọn vẫn cần xác minh từ nguồn chính thức. Khi mở ra, tên trường và giới hạn gốc vẫn được giữ.",
    pendingSuffix: "Chưa hiển thị như khác biệt được chấm điểm cho đến khi ít nhất một nền tảng có giá trị kèm nguồn.",
  },
  it: {
    scrollHint: "Scorri la matrice di lato per confrontare tutte le colonne.",
    pendingTitle: "Dati non ancora verificati",
    pendingSummary: "Mostra dati non ancora verificati",
    pendingLead: "Queste righe sono raggruppate perché tutte le piattaforme selezionate richiedono ancora verifica da fonte ufficiale. Aprendole restano visibili nomi e limiti originali.",
    pendingSuffix: "Non sono mostrate come differenza valutata finché almeno una piattaforma non ha un valore con fonte.",
  },
}[textLocaleKey(locale)] || compareMatrixAuxCopy("en"));

const compareSectionDisclosureCopy = (locale, key) => {
  const copy = {
    research: {
      en: "Open the detailed research comparison",
      "zh-Hans": "展开逐项研究对比",
      "zh-Hant": "展開逐項研究對比",
      es: "Abrir comparación de investigación detallada",
      "pt-BR": "Abrir comparação detalhada de pesquisa",
      fr: "Ouvrir la comparaison de recherche détaillée",
      de: "Detaillierten Research-Vergleich öffnen",
      ja: "詳細な調査比較を開く",
      ko: "상세 리서치 비교 열기",
      ar: "فتح مقارنة البحث التفصيلية",
      tr: "Ayrıntılı araştırma karşılaştırmasını aç",
      ru: "Открыть подробное исследовательское сравнение",
      id: "Buka perbandingan riset terperinci",
      vi: "Mở so sánh nghiên cứu chi tiết",
      it: "Apri il confronto di ricerca dettagliato",
    },
    scenario: {
      en: "Open scenario fit and next steps",
      "zh-Hans": "展开场景选型与下一步行动",
      "zh-Hant": "展開場景選型與下一步行動",
      es: "Abrir selección por escenario y próximos pasos",
      "pt-BR": "Abrir ajuste por cenário e próximos passos",
      fr: "Ouvrir l’adéquation par scénario et les étapes suivantes",
      de: "Szenarioeignung und nächste Schritte öffnen",
      ja: "シナリオ適合と次のステップを開く",
      ko: "시나리오 적합성과 다음 단계 열기",
      ar: "فتح ملاءمة السيناريو والخطوات التالية",
      tr: "Senaryo uyumu ve sonraki adımları aç",
      ru: "Открыть сценарии выбора и следующие шаги",
      id: "Buka kecocokan skenario dan langkah berikutnya",
      vi: "Mở mức phù hợp theo kịch bản và bước tiếp theo",
      it: "Apri idoneità per scenario e prossimi passi",
    },
  };
  return copy[key]?.[textLocaleKey(locale)] || copy[key]?.en || "";
};

const compareFaqAnswerNotice = (locale) => ({
  ja: "この比較の詳細な回答は、各プラットフォームの公式手数料表、準備金資料、地域条件を確認してから表示します。登録・KYC・取引は公式サイトで行い、最新条件を確認してください。",
  ko: "이 비교의 상세 답변은 각 플랫폼의 공식 수수료표, 준비금 자료와 지역 조건을 확인한 뒤 제공합니다. 가입·KYC·거래는 공식 사이트에서 진행하고 최신 조건을 확인하세요.",
  tr: "Bu karşılaştırmanın ayrıntılı yanıtları, her platformun resmî ücret tabloları, rezerv belgeleri ve bölgesel koşulları doğrulandıktan sonra gösterilir. Kayıt, KYC ve işlemleri resmî sitede yapın ve güncel koşulları kontrol edin.",
  es: "Mostramos la respuesta detallada después de revisar las tarifas oficiales, las reservas y las condiciones regionales. El registro, el KYC y las operaciones se realizan en el sitio oficial.",
  "pt-BR": "A resposta detalhada só é exibida após revisar taxas oficiais, reservas e condições regionais. Faça cadastro, KYC e operações no site oficial.",
  fr: "La réponse détaillée est affichée après vérification des tarifs officiels, des réserves et des conditions régionales. Inscription, KYC et opérations se font sur le site officiel.",
  de: "Die ausführliche Antwort wird nach Prüfung offizieller Gebühren, Reserven und regionaler Bedingungen angezeigt. Registrierung, KYC und Handel erfolgen auf der offiziellen Website.",
  ru: "Подробный ответ показывается после проверки официальных комиссий, резервов и региональных условий. Регистрацию, KYC и операции выполняйте на официальном сайте.",
  ar: "يظهر الجواب التفصيلي بعد مراجعة الرسوم الرسمية والاحتياطيات والشروط الإقليمية. أجرِ التسجيل وKYC والتداول على الموقع الرسمي.",
  id: "Jawaban terperinci ditampilkan setelah biaya resmi, cadangan, dan ketentuan wilayah diperiksa. Lakukan pendaftaran, KYC, dan transaksi di situs resmi.",
  vi: "Câu trả lời chi tiết chỉ hiển thị sau khi kiểm tra phí chính thức, dự trữ và điều kiện khu vực. Hãy đăng ký, KYC và giao dịch trên trang chính thức.",
  it: "La risposta dettagliata viene mostrata dopo aver verificato commissioni ufficiali, riserve e condizioni regionali. Registrazione, KYC e operazioni avvengono sul sito ufficiale.",
}[localeKey(locale)] || "");

const venueSecurityUi = (locale, venueName) => ({
  ja: { tag: "フィッシング対策と公式ホワイトリスト", verified: "NexuAlpha記録確認済み", title: `${venueName} 公式ドメインとフィッシング対策`, sub: "検索広告の偽サイトや偽コミュニティを避け、記録済みのドメインと代替ドメインをブックマークしてください。", primary: "主要公式ドメイン", copy: "URLをコピー", copied: "✓ リンクをコピーしました", secure: "記録済みドメインです。公式ページ表示も確認してください", mirrors: "記録済み代替ドメイン", verifiedMirror: "確認済み", tool: "公式チャネル確認ツール", toolBody: "Telegram ID、メール、ドメイン、電話番号を公式確認ページで検証します。", copyRule: "スポンサー広告をクリックしない", copyRuleBody: "公式ドメインを直接入力するか、ブックマークからアクセスしてください。", dmRule: "公式サポートは先にDMしない", dmRuleBody: "シードフレーズを共有したり、個人DMへ資金を送ったりしないでください。", codeRule: "フィッシング対策コードを有効にする", codeRuleBody: "アカウントのセキュリティ設定で対策コードを設定し、メールの真偽を確認します." },
  ko: { tag: "피싱 방지 및 공식 화이트리스트", verified: "NexuAlpha 기록 확인", title: `${venueName} 공식 도메인 및 피싱 방지 허브`, sub: "검색 광고의 가짜 사이트와 사칭 커뮤니티를 피하고 기록된 도메인과 대체 도메인를 북마크하세요.", primary: "주요 공식 도메인", copy: "URL 복사", copied: "✓ 링크를 복사했습니다", secure: "기록된 도메인입니다. 열린 뒤 플랫폼 화면도 확인하세요", mirrors: "기록된 대체 도메인", verifiedMirror: "기록됨", tool: "공식 채널 확인 도구", toolBody: "Telegram ID, 이메일, 도메인과 전화번호를 공식 확인 페이지에서 검증합니다.", copyRule: "스폰서 광고를 클릭하지 않기", copyRuleBody: "공식 도메인을 직접 입력하거나 브라우저 북마크를 사용하세요.", dmRule: "공식 지원팀은 먼저 DM하지 않음", dmRuleBody: "시드 문구를 공유하거나 개인 Telegram DM으로 자금을 보내지 마세요.", codeRule: "피싱 방지 코드를 활성화", codeRuleBody: "계정 보안 설정에서 코드를 만들고 이메일의 진위를 확인하세요." },
  tr: { tag: "Kimlik avına karşı resmî liste", verified: "NexuAlpha kaynak kaydını kontrol etti", title: `${venueName} resmî alan adı ve kimlik avı koruması`, sub: "Arama reklamlarındaki sahte sitelerden ve taklit topluluklardan kaçının; kayıtlı alan adlarını ve alternatif alan adlarını yer imlerine ekleyin.", primary: "Birincil resmî alan adı", copy: "URL.yi kopyala", copied: "✓ Bağlantı kopyalandı", secure: "Kayıtlı alan adı. Açtıktan sonra platform sayfasını da kontrol edin", mirrors: "Kayıtlı alternatif alan adları", verifiedMirror: "Kayıtlı", tool: "Resmî kanal doğrulama aracı", toolBody: "Telegram kimliklerini, e-postaları, alan adlarını ve telefonları resmî doğrulayıcıyla kontrol edin.", copyRule: "Sponsorlu reklamlara tıklamayın", copyRuleBody: "Resmî alan adını kendiniz yazın veya tarayıcı yer iminden açın.", dmRule: "Resmî destek önce DM atmaz", dmRuleBody: "Seed ifadesi paylaşmayın ve özel Telegram mesajlarına para göndermeyin.", codeRule: "Kimlik avı kodunu etkinleştirin", codeRuleBody: "Hesap güvenlik ayarlarında bir kod oluşturup e-postaları doğrulayın." },
  fr: { tag: "Anti-hameçonnage et liste officielle", verified: "Source revue par NexuAlpha", title: `${venueName} : domaine officiel et protection anti-hameçonnage`, sub: "Évitez les faux sites publicitaires et les communautés usurpées. Enregistrez les domaines enregistrés et domaines alternatifs documentés.", primary: "Domaine officiel principal", copy: "Copier l’URL", copied: "✓ Lien copié", secure: "Domaine enregistré. Vérifiez aussi la page de la plateforme après ouverture", mirrors: "Domaines alternatifs enregistrés", verifiedMirror: "Enregistré", tool: "Outil de vérification du canal officiel", toolBody: "Vérifiez identifiants Telegram, e-mails, domaines et numéros via la page officielle.", copyRule: "Ne cliquez pas sur les annonces sponsorisées", copyRuleBody: "Saisissez le domaine officiel ou utilisez un favori du navigateur.", dmRule: "Le support officiel ne contacte pas en premier", dmRuleBody: "Ne partagez jamais votre phrase secrète et n’envoyez pas de fonds par DM.", codeRule: "Activez le code anti-hameçonnage", codeRuleBody: "Définissez-le dans la sécurité du compte pour vérifier les e-mails." },
  de: { tag: "Phishing-Schutz und offizielle Whitelist", verified: "Von NexuAlpha geprüft", title: `${venueName}: offizielle Domain und Phishing-Schutz`, sub: "Meiden Sie gefälschte Werbeseiten und nachgeahmte Communities. Speichern Sie aufgezeichnete Domains und dokumentierte Alternativdomains.", primary: "Primäre offizielle Domain", copy: "URL kopieren", copied: "✓ Link kopiert", secure: "Aufgezeichnete Domain. Nach dem Öffnen auch die Plattformseite prüfen", mirrors: "Aufgezeichnete Alternativdomains", verifiedMirror: "Aufgezeichnet", tool: "Prüfung offizieller Kanäle", toolBody: "Prüfen Sie Telegram-IDs, E-Mails, Domains und Telefonnummern über die offizielle Seite.", copyRule: "Keine gesponserten Anzeigen anklicken", copyRuleBody: "Geben Sie die offizielle Domain direkt ein oder verwenden Sie ein Lesezeichen.", dmRule: "Der offizielle Support schreibt nicht zuerst", dmRuleBody: "Geben Sie keine Seed-Phrase weiter und senden Sie kein Geld per privater Nachricht.", codeRule: "Anti-Phishing-Code aktivieren", codeRuleBody: "Legen Sie ihn in den Kontosicherheitseinstellungen an." },
  es: { tag: "Protección contra phishing y lista oficial", verified: "Registro revisado por NexuAlpha", title: `${venueName}: dominio oficial y protección contra phishing`, sub: "Evita sitios falsos de anuncios y comunidades suplantadas. Guarda los dominios registrados y dominios alternativos documentados.", primary: "Dominio oficial principal", copy: "Copiar URL", copied: "✓ Enlace copiado", secure: "Dominio registrado. Comprueba también la página de la plataforma al abrirlo", mirrors: "Dominios alternativos registrados", verifiedMirror: "Registrado", tool: "Registrador del canal oficial", toolBody: "Comprueba IDs de Telegram, correos, dominios y teléfonos en la página oficial.", copyRule: "No hagas clic en anuncios patrocinados", copyRuleBody: "Escribe el dominio oficial o usa un marcador del navegador.", dmRule: "El soporte oficial no inicia mensajes privados", dmRuleBody: "No compartas tu frase semilla ni envíes fondos por mensajes privados.", codeRule: "Activa el código anti-phishing", codeRuleBody: "Configúralo en la seguridad de la cuenta para validar los correos." },
  "pt-BR": { tag: "Proteção contra phishing e lista oficial", verified: "Registrado pela NexuAlpha", title: `${venueName}: domínio oficial e proteção contra phishing`, sub: "Evite sites falsos de anúncios e comunidades imitadoras. Salve os domínios registrados e domínios alternativos documentados.", primary: "Domínio oficial principal", copy: "Copiar URL", copied: "✓ Link copiado", secure: "Domínio registrado. Confira também a página da plataforma ao abrir", mirrors: "Domínios alternativos registrados", verifiedMirror: "Registrado", tool: "Registrador do canal oficial", toolBody: "Verifique IDs do Telegram, e-mails, domínios e telefones na página oficial.", copyRule: "Não clique em anúncios patrocinados", copyRuleBody: "Digite o domínio oficial ou use um favorito do navegador.", dmRule: "O suporte oficial não envia DM primeiro", dmRuleBody: "Nunca compartilhe sua seed nem envie fundos por mensagem privada.", codeRule: "Ative o código anti-phishing", codeRuleBody: "Configure-o na segurança da conta para validar os e-mails." },
  ru: { tag: "Антифишинг и официальный список", verified: "Запись источника проверена NexuAlpha", title: `${venueName}: официальный домен и защита от фишинга`, sub: "Избегайте поддельных рекламных сайтов и сообществ. Сохраняйте записанные домены и документированные альтернативные домены.", primary: "Основной официальный домен", copy: "Скопировать URL", copied: "✓ Ссылка скопирована", secure: "Записанный домен. После открытия проверьте страницу платформы", mirrors: "Записанные альтернативные домены", verifiedMirror: "Записано", tool: "Проверка официального канала", toolBody: "Проверяйте ID Telegram, почту, домены и телефоны на официальной странице.", copyRule: "Не нажимайте на спонсорскую рекламу", copyRuleBody: "Введите официальный домен вручную или откройте закладку браузера.", dmRule: "Официальная поддержка не пишет первой", dmRuleBody: "Не сообщайте seed-фразу и не отправляйте средства в личных сообщениях.", codeRule: "Включите антифишинговый код", codeRuleBody: "Настройте код в безопасности аккаунта для проверки писем." },
  ar: { tag: "مكافحة التصيد والقائمة الرسمية", verified: "تمت مراجعة سجل المصدر بواسطة NexuAlpha", title: `${venueName}: النطاق الرسمي والحماية من التصيد`, sub: "تجنب المواقع المزيفة والإعلانات والمجتمعات المنتحلة. احفظ النطاقات المسجلة والنطاقات البديلة المسجلة.", primary: "النطاق الرسمي الأساسي", copy: "نسخ الرابط", copied: "✓ تم نسخ الرابط", secure: "نطاق مسجل. تحقق من صفحة المنصة بعد الفتح", mirrors: "نطاقات بديلة مسجلة", verifiedMirror: "مسجل", tool: "أداة التحقق من القناة الرسمية", toolBody: "تحقق من معرّفات Telegram والبريد والنطاقات والأرقام عبر الصفحة الرسمية.", copyRule: "لا تنقر على الإعلانات المدفوعة", copyRuleBody: "اكتب النطاق الرسمي يدوياً أو استخدم إشارة مرجعية آمنة.", dmRule: "الدعم الرسمي لا يرسل رسائل خاصة أولاً", dmRuleBody: "لا تشارك عبارة الاسترداد ولا ترسل أموالاً في رسالة خاصة.", codeRule: "فعّل رمز مكافحة التصيد", codeRuleBody: "اضبطه في أمان الحساب للتحقق من الرسائل." },
  id: { tag: "Perlindungan phishing dan daftar resmi", verified: "Catatan sumber ditinjau NexuAlpha", title: `${venueName}: domain resmi dan perlindungan phishing`, sub: "Hindari situs iklan palsu dan komunitas tiruan. Simpan domain tercatat dan domain alternatif terdokumentasi.", primary: "Domain resmi utama", copy: "Salin URL", copied: "✓ Tautan disalin", secure: "Domain tercatat. Periksa juga halaman platform setelah dibuka", mirrors: "Domain alternatif tercatat", verifiedMirror: "Tercatat", tool: "Alat verifikasi kanal resmi", toolBody: "Verifikasi ID Telegram, email, domain, dan nomor melalui halaman resmi.", copyRule: "Jangan klik iklan bersponsor", copyRuleBody: "Ketik domain resmi atau gunakan bookmark browser.", dmRule: "Dukungan resmi tidak mengirim DM lebih dulu", dmRuleBody: "Jangan bagikan seed phrase atau kirim dana melalui DM pribadi.", codeRule: "Aktifkan kode anti-phishing", codeRuleBody: "Atur di keamanan akun untuk memvalidasi email." },
  vi: { tag: "Chống lừa đảo và danh sách chính thức", verified: "NexuAlpha đã ghi nhận nguồn", title: `${venueName}: tên miền chính thức và bảo vệ chống lừa đảo`, sub: "Tránh trang giả từ quảng cáo và cộng đồng mạo danh. Lưu tên miền đã ghi nhận và tên miền thay thế có tài liệu.", primary: "Tên miền chính thức chính", copy: "Sao chép URL", copied: "✓ Đã sao chép liên kết", secure: "Tên miền đã ghi nhận. Hãy kiểm tra lại trang nền tảng sau khi mở", mirrors: "Tên miền thay thế đã ghi nhận", verifiedMirror: "Đã ghi nhận", tool: "Công cụ xác minh kênh chính thức", toolBody: "Xác minh ID Telegram, email, tên miền và số điện thoại trên trang chính thức.", copyRule: "Không nhấp quảng cáo được tài trợ", copyRuleBody: "Tự nhập tên miền chính thức hoặc dùng dấu trang trình duyệt.", dmRule: "Hỗ trợ chính thức không nhắn riêng trước", dmRuleBody: "Không chia sẻ seed phrase hoặc gửi tiền qua tin nhắn riêng.", codeRule: "Bật mã chống lừa đảo", codeRuleBody: "Thiết lập trong bảo mật tài khoản để kiểm tra email." },
  it: { tag: "Anti-phishing e lista ufficiale", verified: "Fonte registrata da NexuAlpha", title: `${venueName}: dominio ufficiale e protezione anti-phishing`, sub: "Evita siti falsi pubblicizzati e comunità imitate. Salva i domini registrati e domini alternativi documentati.", primary: "Dominio ufficiale principale", copy: "Copia URL", copied: "✓ Link copiato", secure: "Dominio registrato. Controlla anche la pagina della piattaforma dopo l.apertura", mirrors: "Domini alternativi registrati", verifiedMirror: "Registrato", tool: "Strumento di verifica del canale ufficiale", toolBody: "Verifica ID Telegram, email, domini e numeri dalla pagina ufficiale.", copyRule: "Non fare clic sugli annunci sponsorizzati", copyRuleBody: "Digita il dominio ufficiale o usa un preferito del browser.", dmRule: "Il supporto ufficiale non scrive per primo", dmRuleBody: "Non condividere la seed phrase e non inviare fondi in privato.", codeRule: "Attiva il codice anti-phishing", codeRuleBody: "Impostalo nella sicurezza dell’account per verificare le email." },
}[localeKey(locale)] || {});

const compareShortUi = (locale) => {
  const labels = compareUi(locale);
  return {
    jump: labels.jump || "Jump to",
    matrix: labels.matrix || "Quantitative metric matrix",
    trust: labels.trust || "Trust score",
    audit: ({
      en: "View audit report", "zh-Hans": "查看审计报告", "zh-Hant": "查看稽核報告", es: "Ver informe de auditoría", "pt-BR": "Ver relatório de auditoria", fr: "Voir le rapport d’audit", de: "Auditbericht ansehen", ja: "監査レポートを見る", ko: "감사 보고서 보기", ar: "عرض تقرير التدقيق", tr: "Denetim raporunu görüntüle", ru: "Открыть отчёт аудита", id: "Lihat laporan audit", vi: "Xem báo cáo kiểm toán", it: "Vedi rapporto di audit",
    }[textLocaleKey(locale)] || "View audit report"),
    official: labels.official || "Official-source comparison",
    statsDisclosure: compareStatDisclosureByLocale[textLocaleKey(locale)] || compareStatDisclosureByLocale.en,
    detailLinks: detailLinksByLocale[textLocaleKey(locale)] || detailLinksByLocale.en,
    code: codeLabelByLocale[textLocaleKey(locale)] || codeLabelByLocale.en,
  };
};

const compareDetailPhrase = (locale, key, fallback) => {
  const k = textLocaleKey(locale);
  const t = {
    en: { review: "Review verification details and limits", spotNet: "Spot net:", futuresNet: "Futures net:", strictKyc: "Strict KYC (Face + ID)", margin: "Cross and isolated margin", rewards: " User rewards pending verification", claim: "Check the rewards hub after signup", signup: "Sign up on the official site", region: "Region · product · account tier", eligibility: "Verify eligibility before the official flow", accountTerms: "Check official account terms and sources", netHint: "Real cost after user-benefit deduction", reserveHint: "Merkle-tree reserve verification", kycHint: "Verification tier and process friction", rewardHint: "New-user vouchers and reward pack", fewerMetrics: "Show fewer metrics", fullMetrics: "View full quantitative matrix", officialAction: "Official action", antiPhishingPortal: "Anti-phishing official portal" },
    "zh-Hans": { review: "展开核验依据与限制", spotNet: "现货净:", futuresNet: "合约净:", strictKyc: "严格实名（证件 + 人脸）", margin: "全仓与逐仓保证金", rewards: " 用户奖励待官方核验", claim: "专属开户后进入福利中心确认", signup: "在官网注册", region: "地区 · 产品 · 账户等级", eligibility: "先核对地区资格", accountTerms: "以官方账户条件和来源核验为准", netHint: "返佣扣减后的实付到手成本", reserveHint: "默克尔树链上资金透明证明", kycHint: "合规开户认证与出入金门槛", rewardHint: "新手充值与交易任务礼包", fewerMetrics: "收起次要指标", fullMetrics: "查看完整量化指标矩阵", officialAction: "官方直达开户通道", antiPhishingPortal: "带专属防伪邀请码直达开户" },
    "zh-Hant": { review: "展開核驗依據與限制", spotNet: "現貨淨:", futuresNet: "合約淨:", strictKyc: "嚴格實名（證件 + 人臉）", margin: "全倉與逐倉保證金", rewards: " 用戶獎勵待官方核驗", claim: "完成專屬開戶後前往福利中心確認", signup: "在官網註冊", region: "地區 · 產品 · 帳戶等級", eligibility: "先核對地區資格", accountTerms: "以官方帳戶條件和來源核驗為準", netHint: "返傭扣減後的實付到手成本", reserveHint: "默克爾樹鏈上資金透明證明", kycHint: "合規開戶認證與出入金門檻", rewardHint: "新手充值與交易任務禮包", fewerMetrics: "收起次要指標", fullMetrics: "查看完整量化指標矩陣", officialAction: "官方直達開戶通道", antiPhishingPortal: "使用專屬防偽邀請碼直達開戶" },
    es: { review: "Revisar verificaciones y límites", spotNet: "Coste neto spot:", futuresNet: "Coste neto de futuros:", strictKyc: "KYC estricto (rostro + documento)", margin: "Margen cruzado y aislado", rewards: " Beneficios del usuario pendientes de verificación", claim: "Comprueba el centro de beneficios después del registro", signup: "Registrarse en el sitio oficial", region: "Región · producto · nivel de cuenta", eligibility: "Verifica la elegibilidad antes del flujo oficial", accountTerms: "Comprobar condiciones de cuenta y fuentes oficiales", netHint: "Coste real después de descontar beneficios", reserveHint: "Verificación de reservas mediante árbol de Merkle", kycHint: "Nivel de verificación y fricción del proceso", rewardHint: "Cupones y paquete para nuevos usuarios", fewerMetrics: "Mostrar menos métricas", fullMetrics: "Mostrar toda la matriz cuantitativa", officialAction: "Acción oficial", antiPhishingPortal: "Portal oficial contra el phishing" },
    "pt-BR": { review: "Revisar verificações e limites", spotNet: "Spot líquido:", futuresNet: "Futuros líquido:", strictKyc: "KYC rígido (rosto + documento)", margin: "Margem cruzada e isolada", rewards: " Benefícios do usuário aguardam verificação", claim: "Confira a central de benefícios após o cadastro", signup: "Cadastrar no site oficial", region: "Região · produto · nível da conta", eligibility: "Verifique a elegibilidade antes do fluxo oficial", accountTerms: "Confira termos oficiais da conta e fontes", netHint: "Custo real após deduzir benefícios", reserveHint: "Verificação de reservas por árvore Merkle", kycHint: "Nível de verificação e fricção do processo", rewardHint: "Cupons e pacote para novos usuários", fewerMetrics: "Mostrar menos métricas", fullMetrics: "Ver matriz quantitativa completa", officialAction: "Ação oficial", antiPhishingPortal: "Portal oficial anti-phishing" },
    fr: { review: "Vérifier détails et limites", spotNet: "Net spot :", futuresNet: "Net futures :", strictKyc: "KYC strict (visage + document)", margin: "Marge croisée et isolée", rewards: " Avantages utilisateur en attente de vérification", claim: "Vérifiez le centre d’avantages après inscription", signup: "S’inscrire sur le site officiel", region: "Région · produit · niveau de compte", eligibility: "Vérifiez l’éligibilité avant le parcours officiel", accountTerms: "Vérifier conditions de compte et sources officielles", netHint: "Coût réel après déduction de l’avantage", reserveHint: "Vérification des réserves par arbre de Merkle", kycHint: "Niveau de vérification et friction", rewardHint: "Coupons et pack nouveaux utilisateurs", fewerMetrics: "Afficher moins d’indicateurs", fullMetrics: "Voir toute la matrice quantitative", officialAction: "Action officielle", antiPhishingPortal: "Portail officiel anti-hameçonnage" },
    de: { review: "Prüfdetails und Limits ansehen", spotNet: "Spot netto:", futuresNet: "Futures netto:", strictKyc: "Strenges KYC (Gesicht + Ausweis)", margin: "Cross- und Isolated-Margin", rewards: " Nutzervorteile warten auf Prüfung", claim: "Nach Anmeldung im Vorteilsbereich prüfen", signup: "Auf offizieller Website registrieren", region: "Region · Produkt · Kontostufe", eligibility: "Eignung vor dem offiziellen Ablauf prüfen", accountTerms: "Offizielle Kontobedingungen und Quellen prüfen", netHint: "Reale Kosten nach Abzug des Vorteils", reserveHint: "Reserveprüfung per Merkle-Baum", kycHint: "Verifizierungsstufe und Prozessaufwand", rewardHint: "Gutscheine und Paket für neue Nutzer", fewerMetrics: "Weniger Kennzahlen anzeigen", fullMetrics: "Gesamte quantitative Matrix anzeigen", officialAction: "Offizielle Aktion", antiPhishingPortal: "Offizielles Anti-Phishing-Portal" },
    ja: { review: "確認内容と制限を見る", spotNet: "現物純額:", futuresNet: "先物純額:", strictKyc: "厳格なKYC（顔認証・本人確認）", margin: "クロス・分離マージン", rewards: " ユーザー特典は確認待ち", claim: "登録後に特典センターで確認", signup: "公式サイトで登録", region: "地域・商品・アカウント階層", eligibility: "公式手続き前に資格を確認", accountTerms: "公式アカウント条件と出典で確認", netHint: "特典差し引き後の実質コスト", reserveHint: "Merkleツリーによる準備金検証", kycHint: "本人確認レベルと手続き負担", rewardHint: "新規ユーザー向けバウチャーとボックス", fewerMetrics: "指標を折りたたむ", fullMetrics: "量的指標をすべて表示", officialAction: "公式アクション", antiPhishingPortal: "フィッシング対策済み公式入口" },
    ko: { review: "검증 내용과 제한 보기", spotNet: "현물 순비용:", futuresNet: "선물 순비용:", strictKyc: "엄격한 KYC (얼굴·신분증)", margin: "교차·격리 마진", rewards: " 사용자 혜택 확인 대기", claim: "가입 후 보상 센터에서 확인", signup: "공식 사이트에서 가입", region: "지역·상품·계정 등급", eligibility: "공식 절차 전에 자격 확인", accountTerms: "공식 계정 조건과 출처로 확인", netHint: "혜택 차감 후 실제 비용", reserveHint: "Merkle 트리 준비금 검증", kycHint: "인증 단계와 절차 부담", rewardHint: "신규 사용자 바우처 및 보상 상자", fewerMetrics: "지표 접기", fullMetrics: "전체 정량 지표 보기", officialAction: "공식 작업", antiPhishingPortal: "피싱 방지 공식 포털" },
    ar: { review: "مراجعة تفاصيل التحقق والحدود", spotNet: "صافي الفوري:", futuresNet: "صافي العقود:", strictKyc: "KYC صارم (وجه + هوية)", margin: "هامش متقاطع ومعزول", rewards: " مزايا المستخدم بانتظار التحقق", claim: "تحقق من مركز المزايا بعد التسجيل", signup: "التسجيل في الموقع الرسمي", region: "المنطقة · المنتج · مستوى الحساب", eligibility: "تحقق من الأهلية قبل المسار الرسمي", accountTerms: "تحقق من شروط الحساب والمصادر الرسمية", netHint: "التكلفة الفعلية بعد خصم الميزة", reserveHint: "تحقق الاحتياطيات عبر شجرة Merkle", kycHint: "مستوى التحقق وسهولة الإجراء", rewardHint: "قسائم وحزمة للمستخدمين الجدد", fewerMetrics: "عرض مؤشرات أقل", fullMetrics: "عرض المصفوفة الكمية كاملة", officialAction: "إجراء رسمي", antiPhishingPortal: "بوابة رسمية لمكافحة التصيد" },
    tr: { review: "Doğrulama ayrıntılarını ve sınırları incele", spotNet: "Spot net:", futuresNet: "Vadeli net:", strictKyc: "Sıkı KYC (Yüz + Kimlik)", margin: "Çapraz ve izole marjin", rewards: " Kullanıcı avantajı doğrulama bekliyor", claim: "Kayıttan sonra ödül merkezinden kontrol edin", signup: "Resmî sitede kayıt ol", region: "Bölge · ürün · hesap seviyesi", eligibility: "Resmî akıştan önce uygunluğu doğrulayın", accountTerms: "Resmî hesap koşulları ve kaynaklarla doğrulayın", netHint: "Avantaj düşüldükten sonra gerçek maliyet", reserveHint: "Merkle ağacı rezerv doğrulaması", kycHint: "Doğrulama seviyesi ve işlem yükü", rewardHint: "Yeni kullanıcı kuponları ve ödül paketi", fewerMetrics: "Daha az metrik göster", fullMetrics: "Tam nicel matrisi göster", officialAction: "Resmî işlem", antiPhishingPortal: "Kimlik avına karşı resmî portal" },
    ru: { review: "Проверить детали и ограничения", spotNet: "Спот нетто:", futuresNet: "Фьючерсы нетто:", strictKyc: "Строгий KYC (лицо + документ)", margin: "Кросс- и изолированная маржа", rewards: " Преимущества пользователя ожидают проверки", claim: "Проверьте центр преимуществ после регистрации", signup: "Зарегистрироваться на официальном сайте", region: "Регион · продукт · уровень аккаунта", eligibility: "Проверьте доступность до официального процесса", accountTerms: "Проверьте условия аккаунта и официальные источники", netHint: "Реальная стоимость после вычета преимущества", reserveHint: "Проверка резервов через дерево Merkle", kycHint: "Уровень проверки и сложность процесса", rewardHint: "Купоны и пакет для новых пользователей", fewerMetrics: "Показать меньше метрик", fullMetrics: "Показать всю количественную матрицу", officialAction: "Официальное действие", antiPhishingPortal: "Официальный антифишинговый портал" },
    id: { review: "Tinjau detail verifikasi dan batas", spotNet: "Spot net:", futuresNet: "Futures net:", strictKyc: "KYC ketat (wajah + ID)", margin: "Margin cross dan isolated", rewards: " Manfaat pengguna menunggu verifikasi", claim: "Periksa pusat manfaat setelah daftar", signup: "Daftar di situs resmi", region: "Wilayah · produk · level akun", eligibility: "Periksa kelayakan sebelum alur resmi", accountTerms: "Periksa ketentuan akun resmi dan sumber", netHint: "Biaya riil setelah manfaat dikurangi", reserveHint: "Verifikasi cadangan pohon Merkle", kycHint: "Level verifikasi dan friksi proses", rewardHint: "Voucher dan paket pengguna baru", fewerMetrics: "Tampilkan lebih sedikit metrik", fullMetrics: "Lihat matriks kuantitatif lengkap", officialAction: "Aksi resmi", antiPhishingPortal: "Portal resmi anti-phishing" },
    vi: { review: "Xem chi tiết xác minh và giới hạn", spotNet: "Spot ròng:", futuresNet: "Futures ròng:", strictKyc: "KYC nghiêm ngặt (khuôn mặt + ID)", margin: "Ký quỹ chéo và cô lập", rewards: " Ưu đãi người dùng chờ xác minh", claim: "Kiểm tra trung tâm ưu đãi sau khi đăng ký", signup: "Đăng ký trên trang chính thức", region: "Khu vực · sản phẩm · cấp tài khoản", eligibility: "Kiểm tra điều kiện trước luồng chính thức", accountTerms: "Kiểm tra điều kiện tài khoản và nguồn chính thức", netHint: "Chi phí thực sau khi trừ ưu đãi", reserveHint: "Xác minh dự trữ bằng cây Merkle", kycHint: "Cấp xác minh và độ phức tạp", rewardHint: "Phiếu thưởng và gói cho người dùng mới", fewerMetrics: "Hiển thị ít chỉ số hơn", fullMetrics: "Xem toàn bộ ma trận định lượng", officialAction: "Hành động chính thức", antiPhishingPortal: "Cổng chính thức chống lừa đảo" },
    it: { review: "Rivedi dettagli e limiti", spotNet: "Spot netto:", futuresNet: "Futures netto:", strictKyc: "KYC rigoroso (volto + documento)", margin: "Margine cross e isolato", rewards: " Vantaggi utente in attesa di verifica", claim: "Controlla il centro vantaggi dopo l’iscrizione", signup: "Registrati sul sito ufficiale", region: "Regione · prodotto · livello account", eligibility: "Verifica l’idoneità prima del flusso ufficiale", accountTerms: "Controlla termini account e fonti ufficiali", netHint: "Costo reale dopo la deduzione del vantaggio", reserveHint: "Verifica riserve con albero Merkle", kycHint: "Livello di verifica e attrito", rewardHint: "Coupon e pacchetto nuovi utenti", fewerMetrics: "Mostra meno metriche", fullMetrics: "Vedi matrice quantitativa completa", officialAction: "Azione ufficiale", antiPhishingPortal: "Portale ufficiale anti-phishing" },
  }[k] || {};
  return t[key] || fallback;
};

const compareDirectAnswerOverrides = {
  "binance-vs-okx": {
    title: "Binance vs OKX: decide by fee schedule, KYC, fiat route and product fit before opening an account.",
    body: "Use this page as a pre-registration decision check. Compare published spot and derivatives fee schedules, identity verification requirements, fiat or Web3 funding route, product scope and regional eligibility first. Then open Binance or OKX only through the protected CTA path after the official account screen matches your use case.",
    decisionCard: {
      eyebrow: "Final call before signup",
      title: "Choose Binance for broad exchange depth; choose OKX when Web3-style routing and tools matter more.",
      suitedForLabel: "Who it fits",
      verifyLabel: "Verify first",
      matrixLabel: "Full matrix",
      evidenceLabel: "Review sources and decision notes",
      picks: {
        binance: {
          fit: "Users who want the broadest CEX product shelf, large liquidity, fiat/P2P routes and a familiar account flow.",
          verify: "KYC eligibility, local fiat rails, BNB fee rules, product access and the official fee tier shown inside the account.",
        },
        okx: {
          fit: "Users comparing a CEX account with Web3 wallet, DEX-style discovery, bots, Earn and proof-of-reserves checks.",
          verify: "Regional eligibility, KYC level, Web3 route boundaries, product permissions and current OKX fee table.",
        },
      },
    },
    checks: ["Fees: published spot and derivatives schedules", "KYC: identity, residence and account review", "Fiat route: card, bank or local rail must be verified in-account", "Best for: broad CEX product comparison before signup", "Not for: users expecting guaranteed approval, bonus or net fee", "Next step: compare details, then use the protected registration CTA"],
    boundary: "NexuAlpha does not guarantee account approval, fiat availability, product access, rebate settlement, bonus eligibility or final net cost. Public terms are a starting point; the official account flow is the final check.",
    sourceLinks: [
      ["Binance Trading Fees", "https://www.binance.com/en/fee/trading"],
      ["Binance Identity Verification", "https://www.binance.com/en/support/faq/detail/360027287111"],
      ["OKX Fees", "https://www.okx.com/fees"],
      ["OKX Identity Verification", "https://www.okx.com/help/individual-identity-verification-eligibility-review-time-and-supported"],
    ],
    internalLinks: [
      ["Open Binance detail", "/exchanges/binance"],
      ["Open OKX detail", "/exchanges/okx"],
      ["Use the public fee scenario tool", "/rates?product=spot"],
    ],
    registrationSlug: "binance",
  },
  "hyperliquid-vs-dydx": {
    title: "Hyperliquid vs dYdX: compare the perpetual platform mechanics before connecting a wallet.",
    body: "For perpetual-platform searches, the useful comparison is execution model first: collateral, funding, liquidation rules, oracle route, wallet signing, network risk, region limits and official documentation. Treat both pages as research paths before trading; a faster interface or lower published fee does not remove liquidation, bridge or eligibility risk.",
    checks: ["Collateral, funding and liquidation model", "Wallet, network and oracle route", "Region limits and official documentation"],
  },
};

const venueDirectAnswerOverrides = {
  en: {
    binance: {
      title: "Binance decision check: verify fees, KYC, fiat route and product scope before registration.",
      body: "Treat Binance as a broad CEX candidate, not as an automatic fit. Before opening the protected registration route, check the published fee table, identity verification status, supported region, fiat funding method and the exact spot or derivatives product you need. Final eligibility and any user benefit must appear in the official account flow.",
      checks: ["Fees: published spot, futures and account-tier schedule", "KYC: identity, residence and account review", "Fiat route: card, bank or local rail varies by market", "Best for: broad CEX product and liquidity comparison", "Not for: users who need guaranteed approval, fiat access or bonus", "Next step: compare Binance vs OKX or continue through the protected CTA"],
      boundary: "This page does not promise Binance account approval, fiat availability, product access, rebate settlement, bonus eligibility or final net trading cost.",
      sources: [
        ["Binance Trading Fees", "https://www.binance.com/en/fee/trading"],
        ["Binance Identity Verification", "https://www.binance.com/en/support/faq/detail/360027287111"],
        ["Binance Supported Regions", "https://www.binance.com/en-GB/support-region-list"],
      ],
      internalLinks: [
        ["Compare Binance vs OKX", "/compare/binance-vs-okx"],
        ["Use the public fee scenario tool", "/rates?product=spot"],
      ],
      registrationSlug: "binance",
    },
    hyperliquid: {
      title: "Hyperliquid fees are a stack: rolling maker/taker tier, referral discount, hourly funding, collateral route, liquidation rule and wallet permission.",
      body: "Before a Hyperliquid perp order, verify the rolling 14-day fee tier, expected hourly funding direction, referral discount or reward boundary, maintenance-margin trigger, account-abstraction collateral mode, native USDC or bridge route, vault context, and whether the action is signed by the master wallet, sub-account or API wallet. A cashback search should be checked against official referral terms; a funded-account search should separate self-funded collateral and vault participation from third-party trader-funding claims.",
      reviewedAt: "2026-09-15",
      reviewedLabel: "Official sources reviewed September 15, 2026",
      costFormulaLabel: "Pre-trade cost model",
      costFormula: "round-trip trading fees ± hourly funding + spread/slippage + collateral transfer and exit cost",
      checks: ["Rolling fee tier, referral discount and hourly funding", "Collateral, margin and liquidation", "Vault, sub-account and API-wallet permissions"],
      boundary: "This page does not promise Hyperliquid cashback, a funded account, third-party capital allocation, account-opening result, discount, vault return or final net trading cost.",
      sources: [
        ["Hyperliquid Fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees"],
        ["Hyperliquid Funding", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"],
        ["Hyperliquid Referrals", "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals"],
        ["Hyperliquid Liquidations", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations"],
      ],
      internalLinks: [
        ["Compare Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
        ["Open the Perp DEX cost-field dictionary", "/topics/derivatives#perp-cost-field-dictionary"],
        ["Read the dated Hyperliquid vs dYdX source explainer", "/news/hyperliquid-vs-dydx"],
        ["Use the fee scenario tool", "/rates?product=perp"],
      ],
    },
    uniswap: {
      title: "Uniswap testnet and mainnet checks start with the official app, docs, token contract, approval and wallet preview.",
      body: "Before connecting a wallet or signing a swap, verify the official app domain and docs, selected network, token contract, pool or route, v4 deployment mapping, Permit2 or approval spender, gas asset, quoted output and final wallet transaction preview. Local hook tests or testnet work do not prove mainnet liquidity, execution quality or token safety.",
      checks: ["Official app and docs", "Testnet vs mainnet route", "Token contract, Permit2, gas and wallet preview"],
    },
  },
  de: {
    uniswap: {
      title: "Uniswap in Deutschland prüfen: Es geht um Wallet, Netzwerk, Tokenvertrag, Gas und Route – nicht um ein Börsenkonto.",
      body: "Für Nutzer in Deutschland ist Uniswap keine klassische CEX-Anmeldung mit Euro-Einzahlung oder verwahrtem Konto. Prüfe zuerst die offizielle App-Domain, das Netzwerk, die Tokenadresse, v4-Deployments, Pool- oder Hook-Gebühren, Gas, Slippage und die Wallet-Freigabe. Eine Testnet- oder Entwicklerroute beweist keine sichere produktive Swap-Route.",
      checks: ["Offizielle App und v4-Deployments", "Wallet-Freigabe, Gas und Slippage", "Keine Verwahrung, keine Euro-Einzahlung, kein Renditeversprechen"],
      boundary: "NexuAlpha bestätigt hier keine deutsche Verfügbarkeit, keine Steuerfolge, keinen Tokenwert und keinen individuellen Kostenvorteil. Die endgültige Aktion wird in der Wallet und auf der offiziellen Uniswap-Oberfläche geprüft.",
      sources: [
        ["Uniswap v4 deployments", "https://developers.uniswap.org/docs/protocols/v4/deployments"],
        ["Uniswap support: token swaps", "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"],
      ],
      internalLinks: [
        ["Uniswap vs Jupiter vergleichen", "/compare/uniswap-vs-jupiter"],
        ["Gebührenrechner öffnen", "/rates?product=swap&market=DE"],
        ["On-chain Liquidität prüfen", "/onchain?market=DE&product=swap"],
      ],
    },
  },
};

const venueDirectAnswerFor = (locale, slug) => {
  const key = localeKey(locale);
  return venueDirectAnswerOverrides[locale]?.[slug]
    || venueDirectAnswerOverrides[key]?.[slug]
    || (key === "en" ? venueDirectAnswerOverrides.en?.[slug] : null);
};


const uniswapShortChecklistCopy = {
  en: {
    summary: "3 checks before signing on Uniswap",
    hint: "Open this short checklist before leaving NexuAlpha: interface, network, final mainnet wallet preview.",
    stages: [
      ["interface", "Interface", "Start from the official Uniswap app and docs; do not connect a wallet from an unverified search result, social link or copied contract."],
      ["network", "Network", "Separate API or testnet practice from the live web route; choose the intended chain and verify token contract, route, approval or Permit2 spender."],
      ["preview", "Final mainnet preview", "Read the wallet's final mainnet transaction preview, gas asset and approval request before signing. Testnet support does not prove mainnet liquidity or token safety."],
    ],
    officialApp: "Open official Uniswap app",
    internalCta: "Compare Uniswap vs Jupiter",
  },
  "zh-Hans": {
    summary: "签名前先做 3 个短核验",
    hint: "离开 NexuAlpha 前先展开短清单核对：界面、网络、最终主网钱包预览。",
    stages: [
      ["interface", "界面", "从官方 Uniswap App 和文档开始；不要从未核验的搜索结果、社交链接或复制合约连接钱包。"],
      ["network", "网络", "把 API 或测试网练习和真实 Web 路径分开；选择目标链，并核对代币合约、路径、approval 或 Permit2 spender。"],
      ["preview", "最终主网预览", "签名前阅读钱包里的最终主网交易预览、gas 资产和授权请求。测试网支持不能证明主网流动性或代币安全。"],
    ],
    officialApp: "打开 Uniswap 官方 App",
    internalCta: "比较 Uniswap vs Jupiter",
  },
  "zh-Hant": {
    summary: "簽名前先做 3 個短核驗",
    hint: "離開 NexuAlpha 前先展開短清單核對：介面、網路、最終主網錢包預覽。",
    stages: [
      ["interface", "介面", "從官方 Uniswap App 和文件開始；不要從未核驗的搜尋結果、社群連結或複製合約連接錢包。"],
      ["network", "網路", "把 API 或測試網練習和真實 Web 路徑分開；選擇目標鏈，並核對代幣合約、路徑、approval 或 Permit2 spender。"],
      ["preview", "最終主網預覽", "簽名前閱讀錢包裡的最終主網交易預覽、gas 資產和授權請求。測試網支援不能證明主網流動性或代幣安全。"],
    ],
    officialApp: "打開 Uniswap 官方 App",
    internalCta: "比較 Uniswap vs Jupiter",
  },
};

const sourceHrefByLabel = (sources = [], matcher, fallback) => {
  const match = sources.find(([label]) => matcher.test(String(label || "")));
  return match?.[1] || fallback;
};

function UniswapShortVerificationChecklist({ locale, priorityAnswer, resolveInternalHref }) {
  const copy = uniswapShortChecklistCopy[locale];
  if (!copy || !priorityAnswer) return null;
  const officialAppHref = sourceHrefByLabel(priorityAnswer.sources, /official app/i, "https://app.uniswap.org/");
  const internalTarget = priorityAnswer.primaryNextAction || priorityAnswer.internalLinks?.[0] || [copy.internalCta, "/compare/uniswap-vs-jupiter"];
  const [internalLabel, internalHref] = internalTarget;

  return (
    <details className="v3-uniswap-short-checklist" data-uniswap-short-checklist="true" lang={locale}>
      <summary>
        <span>{copy.summary}</span>
        <small>{copy.hint}</small>
      </summary>
      <ol className="v3-uniswap-short-checklist__steps" aria-label={copy.summary}>
        {copy.stages.map(([stage, label, body]) => (
          <li key={stage} data-uniswap-check-stage={stage}>
            <b>{label}</b>
            <span>{body}</span>
          </li>
        ))}
      </ol>
      <div className="v3-uniswap-short-checklist__links">
        <a
          href={officialAppHref}
          target="_blank"
          rel="noopener noreferrer"
          data-cta-kind="source"
          data-cta-placement="uniswap-short-checklist-source"
        >
          {copy.officialApp} ↗
        </a>
        <LocalLink
          locale={locale}
          href={resolveInternalHref(internalHref)}
          data-cta-kind="research"
          data-cta-placement="uniswap-short-checklist-internal"
        >
          {internalLabel || copy.internalCta}
        </LocalLink>
      </div>
    </details>
  );
}

const detailCtaLabel = (locale, { direct, hasReferral }) => {
  const labels = {
    "zh-Hans": { verify: "先核对地区资格", official: "打开官网", register: "在官网注册" },
    "zh-Hant": { verify: "先核對地區資格", official: "打開官網", register: "在官網註冊" },
    es: { verify: "Verificar elegibilidad regional", official: "Abrir sitio oficial", register: "Registrarse en el sitio oficial" },
    "pt-BR": { verify: "Verificar elegibilidade regional", official: "Abrir site oficial", register: "Cadastrar no site oficial" },
    fr: { verify: "Vérifier l’éligibilité régionale", official: "Ouvrir le site officiel", register: "S’inscrire sur le site officiel" },
    de: { verify: "Regionale Berechtigung prüfen", official: "Offizielle Website öffnen", register: "Auf der offiziellen Website registrieren" },
    ja: { verify: "地域の利用条件を確認", official: "公式サイトを開く", register: "公式サイトで登録" },
    ko: { verify: "지역 이용 가능 여부 확인", official: "공식 사이트 열기", register: "공식 사이트에서 가입" },
    ar: { verify: "تحقق من الأهلية الإقليمية", official: "فتح الموقع الرسمي", register: "التسجيل في الموقع الرسمي" },
    tr: { verify: "Bölgesel uygunluğu doğrula", official: "Resmi siteyi aç", register: "Resmi sitede kaydol" },
    ru: { verify: "Проверить доступность в регионе", official: "Открыть официальный сайт", register: "Зарегистрироваться на официальном сайте" },
    id: { verify: "Verifikasi kelayakan wilayah", official: "Buka situs resmi", register: "Daftar di situs resmi" },
    vi: { verify: "Kiểm tra điều kiện khu vực", official: "Mở trang chính thức", register: "Đăng ký trên trang chính thức" },
    it: { verify: "Verifica l’idoneità regionale", official: "Apri il sito ufficiale", register: "Registrati sul sito ufficiale" },
  };
  const copy = labels[locale] || labels[String(locale).split("-")[0]] || {
    verify: "Verify regional eligibility first",
    official: "Open Official Site",
    register: "Register on Official Site",
  };
  if (!direct) return copy.verify;
  return hasReferral ? copy.register : copy.official;
};

const detailRegistrationReviewLabel = (locale, { hasReferral }) => {
  const labels = {
    "zh-Hans": { code: "核对邀请码与注册条件", route: "核对官网与注册条件" },
    "zh-Hant": { code: "核對邀請碼與註冊條件", route: "核對官網與註冊條件" },
    es: { code: "Revisar código y condiciones de registro", route: "Revisar dominio y condiciones de registro" },
    "pt-BR": { code: "Revisar código e condições de cadastro", route: "Revisar domínio e condições de cadastro" },
    fr: { code: "Vérifier le code et les conditions d’inscription", route: "Vérifier le domaine et les conditions d’inscription" },
    de: { code: "Code und Registrierungsbedingungen prüfen", route: "Domain und Registrierungsbedingungen prüfen" },
    ja: { code: "コードと登録条件を確認", route: "公式ドメインと登録条件を確認" },
    ko: { code: "코드와 가입 조건 확인", route: "공식 도메인과 가입 조건 확인" },
    ar: { code: "تحقق من الرمز وشروط التسجيل", route: "تحقق من النطاق وشروط التسجيل" },
    tr: { code: "Kodu ve kayıt koşullarını kontrol et", route: "Resmî alanı ve kayıt koşullarını kontrol et" },
    ru: { code: "Проверить код и условия регистрации", route: "Проверить домен и условия регистрации" },
    id: { code: "Periksa kode dan syarat pendaftaran", route: "Periksa domain dan syarat pendaftaran" },
    vi: { code: "Kiểm tra mã và điều kiện đăng ký", route: "Kiểm tra miền và điều kiện đăng ký" },
    it: { code: "Verifica codice e condizioni di registrazione", route: "Verifica dominio e condizioni di registrazione" },
  };
  const copy = labels[locale] || labels[String(locale).split("-")[0]] || {
    code: "Review code and signup conditions",
    route: "Review domain and signup conditions",
  };
  return hasReferral ? copy.code : copy.route;
};

function LocalLink({ locale, href, children, className, ...props }) {
  return <a className={className} href={localizedHref(href, { locale })} {...props}>{children}</a>;
}

function DecisionBrief({ text, eyebrow, title, body, facts = [] }) {
  return <aside className="v3-decision-brief" aria-label={eyebrow}>
    <span>{eyebrow}</span>
    <h2>{title}</h2>
    <p>{body}</p>
    {facts.length > 0 && <dl>{facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd translate={fact.translate ?? undefined} lang={fact.lang ?? undefined} dir={fact.lang === "en" ? "ltr" : undefined}>{fact.value}</dd></div>)}</dl>}
    <small>{text.ctaLocked}</small>
  </aside>;
}

const textDirectionForLocale = (locale) => locale === "ar" ? "rtl" : "ltr";

function reviewedDecisionConciseFit(decision) {
  return typeof decision?.fit === "string" ? sanitizePublicText(decision.fit).replace(/^Choose\s+[^ ]+\s+when\s+/i, "").replace(/^Avoid\s+/i, "") : "";
}

function reviewedDecisionHeroSummary(name, locale, decision) {
  const key = localeKey(locale);
  const copy = {
    en: `${name}: source-linked account, product and eligibility checks before signup.`,
    "zh-Hans": `${name}：基于来源核对账户、产品和资格，再决定是否开户。`,
    "zh-Hant": `${name}：基於來源核對帳戶、產品和資格，再決定是否開戶。`,
    es: `${name}: verifica cuenta, productos y elegibilidad con fuentes antes del registro.`,
    "pt-BR": `${name}: verifique conta, produtos e elegibilidade com fontes antes do cadastro.`,
    fr: `${name} : vérifiez compte, produits et éligibilité avec les sources avant inscription.`,
    de: `${name}: Konto, Produkte und Eignung vor der Anmeldung anhand von Quellen prüfen.`,
    ja: `${name}：登録前にアカウント、商品、資格を出典付きで確認します。`,
    ko: `${name}: 가입 전 계정, 상품, 자격을 출처 기반으로 확인합니다.`,
    ar: `${name}: افحص الحساب والمنتجات والأهلية بالمصادر قبل التسجيل.`,
    tr: `${name}: kayıttan önce hesap, ürün ve uygunluğu kaynaklarla kontrol et.`,
    ru: `${name}: перед регистрацией проверьте аккаунт, продукты и доступность по источникам.`,
    id: `${name}: periksa akun, produk, dan kelayakan berbasis sumber sebelum mendaftar.`,
    vi: `${name}: kiểm tra tài khoản, sản phẩm và điều kiện bằng nguồn trước khi đăng ký.`,
    it: `${name}: verifica account, prodotti e idoneità con fonti prima dell'iscrizione.`,
  };
  const conciseFit = reviewedDecisionConciseFit(decision);
  if (conciseFit.trim()) return `${name}: ${conciseFit}`;
  return copy[locale] || copy[key] || copy.en;
}

function VenueDecisionStrip({ text, profile, decision, locale }) {
  const reviewed = Boolean(decision?.editorialReviewed);
  const skipFit = true;
  const decisionLocale = decision?.contentLocale ?? locale;
  const items = reviewed ? [
    { label: text.verdictBestFor, value: decision.fit, locale: decisionLocale },
    { label: text.verifyBefore, value: decision.why, locale: decisionLocale },
    { label: text.detailNotFor, value: decision.avoid, locale: decisionLocale },
  ] : [
    { label: text.verdictBestFor, value: profile.useCases?.[0] },
    { label: text.verifyBefore, value: profile.checks?.[0] },
    { label: text.detailNotFor, value: profile.limitations?.[0] },
  ];
  return <div className="v3-venue-decision-strip" role="group" aria-label={text.profileSignal}>
    {items.slice(skipFit ? 1 : 0).filter((item) => item.value).map((item, index) => (
      <article key={item.label}>
        <span>{item.label}</span>
        <strong lang={item.locale ?? undefined} dir={item.locale ? textDirectionForLocale(item.locale) : undefined}>{sanitizePublicText(item.value)}</strong>
      </article>
    ))}
  </div>;
}

function SourceList({ text, profile }) {
  return <div className="v3-source-list">
    <h3>{text.sourceIntake}</h3>
    <div className="v3-source-list__meta">
      <p><span>{text.officialDomain}</span><strong translate="no" lang="en" dir="ltr">{profile.officialDomain || text.pendingReview}</strong></p>
      <p><span>{text.sourceHost}</span><strong translate="no" lang="en" dir="ltr">{profile.sourceHost || text.pendingReview}</strong></p>
    </div>
    {profile.sourceHubs.length ? profile.sourceHubs.map((source) => <a key={source.url} href={source.url} rel="noopener noreferrer" target="_blank"><span translate="no" lang="en" dir="ltr">{source.label}</span><small translate="no" lang="en" dir="ltr">{new URL(source.url).host}</small></a>) : <p>{text.pendingReview}</p>}
  </div>;
}

function ActivityCards({ copy, text, locale, updates }) {
  if (!updates.length) return <div className="v3-empty" role="status"><b>{text.noReviewedActivity}</b><p>{text.activityEmpty}</p></div>;
  return <div className="v3-activity-list">{updates.map((update) => <article key={update.id}>
    <span>{update.platform.name} · {update.kind}</span>
    <h3>{update.title}</h3>
    <dl>
      <div><dt>{copy.decisionWorkbench.discovered}</dt><dd><time dateTime={update.discoveredAt}>{new Date(update.discoveredAt).toLocaleDateString(locale)}</time></dd></div>
      <div><dt>{copy.common.verifiedSource}</dt><dd><time dateTime={update.verifiedAt}>{new Date(update.verifiedAt).toLocaleDateString(locale)}</time></dd></div>
    </dl>
    <div className="v3-activity-actions">
      <LocalLink locale={locale} href={`/activities/${encodeURIComponent(update.id)}`}>{text.openActivityDetail}</LocalLink>
      <a href={update.officialSource.url} target="_blank" rel="noopener noreferrer">{text.openOfficialSource}</a>
    </div>
  </article>)}</div>;
}

function SnapshotStrip({ items }) {
  const visibleItems = items.filter((item) => item && item.value !== null && item.value !== undefined && item.value !== "");
  return <div className="v3-snapshot-strip">{visibleItems.map((item) => <article key={item.label}>
    <span>{item.label}</span>
    <b translate={item.translate ?? "no"} lang={item.lang ?? "en"}>{item.value}</b>
    <p>{item.hint}</p>
  </article>)}</div>;
}

function LockedHandoffCta({ text, profile }) {
  return <div className="v3-locked-handoff">
    <span>{text.detailHandoff}</span>
    <h3>{text.registrationLocked}</h3>
    <p>{text.noOfficial}</p>
    {profile && <small translate="no" lang="en" dir="ltr">{profile.name} · {profile.officialDomain || text.pendingReview}</small>}
    <button type="button" disabled aria-disabled="true">{text.registrationLocked}</button>
    <em>{text.ctaLocked}</em>
  </div>;
}

function RouteReadiness({ ui, profile }) {
  const routes = ui.routeModels[profile.category] ?? ui.routeModels.CEX;
  return <section className="v2-section v3-route-readiness">
    <div className="section-lead"><p>{ui.tradeReadiness}</p><h2>{ui.routeReadiness}</h2><span>{ui.routeReadinessBody}</span></div>
    <div className="v3-route-grid">
      {routes.map(([title, body]) => <article key={title}>
        <span translate="no" lang="en">{profile.name}</span>
        <h3>{title}</h3>
        <p>{body}</p>
      </article>)}
    </div>
  </section>;
}

function EditorialList({ title, items, fallback }) {
  const visible = items?.length ? items : fallback;
  return <article>
    <span>{title}</span>
    <ul className="v3-detail-list">{visible.map((item) => <li key={item}>{item}</li>)}</ul>
  </article>;
}

function CompareVerdictPanel({ text, ui, locale, profiles, market, product, accountStage, funding }) {
  const primaryProfiles = profiles.slice(0, 3);
  const decisionUi = decisionCopy[locale] ?? decisionCopy.en;
  const hasFallback = primaryProfiles.some((profile) => {
    const decision = decisionForVenue(profile.slug, locale);
    return decision && decision.contentLocale !== locale;
  });
  if (!primaryProfiles.length) return null;

  return <section className="v2-section v3-compare-verdict">
    <div className="section-lead">
      <p>{text.compareVerdictEyebrow}</p>
      <h2>{text.compareVerdictTitle}</h2>
      <span>{text.compareVerdictLead}</span>
    </div>
    <p className="research-language-note">{decisionUi[0]}{hasFallback && <> {decisionUi[1]}.</>}</p>
    <div className="v3-compare-verdict__grid">
      {primaryProfiles.map((profile) => {
        const decision = decisionForVenue(profile.slug, locale);
        const safeDecision = hasReviewedEditorialDecision(profile.slug) ? decision : null;
        const alternative = profiles.find((candidate) => candidate.slug !== profile.slug) ?? primaryProfiles.find((candidate) => candidate.slug !== profile.slug);
        const verdictDetails = <dl lang={safeDecision?.contentLocale ?? locale}>
          <div><dt>{text.verdictBestFor}</dt><dd>{sanitizePublicText(safeDecision?.fit) ?? pendingDecisionCopy(locale).fit}</dd></div>
          <div><dt>{text.verdictRegistrationFit}</dt><dd>{sanitizePublicText(safeDecision?.why) ?? pendingDecisionCopy(locale).why}</dd></div>
          <div><dt>{safeDecision?.suitabilityUnresolved ? decisionUi[3] : text.detailNotFor}</dt><dd>{sanitizePublicText(safeDecision?.avoid) ?? pendingDecisionCopy(locale).avoid}</dd></div>
          <div><dt>{text.verdictAlternative}</dt><dd translate="no" lang="en">{alternative?.name ?? text.pendingReview}</dd></div>
        </dl>;
        return <article className={`v3-compare-verdict__card${safeDecision ? "" : " v3-compare-verdict__card--pending"}`} key={profile.slug}>
          <div translate="no" lang="en" dir="ltr"><BrandMark slug={profile.slug} compact /><b>{profile.name}</b><small>{profile.category}</small></div>
          {safeDecision ? verdictDetails : (
            <details className="v3-compare-verdict__pending-details">
              <summary>{locale.startsWith("zh") ? zhText(locale, "展开核验依据与限制", "展開核驗依據與限制") : compareDetailPhrase(locale, "review", "Review verification details and limits")}<span aria-hidden="true">＋</span></summary>
              {verdictDetails}
            </details>
          )}
          <LocalLink
            locale={locale}
            href={`/exchanges/${profile.slug}?${directoryContextSearch({ market, product, locale, accountStage, funding })}`}
            data-cta-kind="research"
            data-cta-platform={profile.slug}
            data-cta-placement="compare-verdict-detail"
            data-growth-decision={profile.slug}
            data-growth-placement="compare-verdict-detail"
            data-growth-market={market}
            data-growth-product={product}
            data-growth-campaign={market ? `${String(market).toLowerCase()}-research-preview` : undefined}
          >{text.openDetail}</LocalLink>
        </article>;
      })}
    </div>
  </section>;
}

function ConversionIntentPanel({ text, profile }) {
  return <section className="v2-section v3-conversion-intent">
    <div>
      <span>{text.verifyBefore}</span>
      <h2>{text.funnelTitle}</h2>
      <p>{text.funnelIntro}</p>
    </div>
    <ol>
      {text.funnelSteps.map((step) => <li key={step.title}><b>{step.title}</b><p>{step.body}</p></li>)}
    </ol>
    <p>{text.ctaLocked}</p>
    {profile && <small translate="no" lang="en">{profile.name} · {profile.officialDomain}</small>}
  </section>;
}

function ActivitySourceTypes({ ui }) {
  return <div className="v3-source-types">
    {ui.sourceTypes.map((item) => <span key={item}>{item}</span>)}
  </div>;
}

function firstTradeReadiness(copy, text, profile) {
  return [
    { label: copy.common.feeSignal, value: profile.category === "DEX" ? profile.limitations[1] : profile.checks.find((item) => /费|fee|comiss|frais|Gebühr|수수료/i.test(item)) || profile.checks[0] },
    { label: copy.common.regionAvailability, value: profile.checks.find((item) => /地区|region|regional|eligib|região|région|地域|지역/i.test(item)) || profile.limitations[0] },
    { label: text.activityState, value: text.noReviewedActivity },
  ];
}

function RegistrationActionMap({ copy, text, ui, locale, profile, related, similar }) {
  const readiness = firstTradeReadiness(copy, text, profile);
  return <section className="v2-section v3-action-map" id="decision-path">
    <div className="section-lead"><p>{text.verifyBefore}</p><h2>{text.funnelTitle}</h2><span>{text.funnelIntro}</span></div>
    <div className="v3-action-map__grid">
      <article>
        <span>01</span>
        <h3>{ui.conversionCards[0]}</h3>
        {profile.useCases.slice(0, 2).map((item) => <p key={item}>{item}</p>)}
        <LocalLink locale={locale} href={similar[0] ? `/compare/${compareSlug([profile.slug, similar[0].slug])}` : "/exchanges"}>{text.viewCompare}</LocalLink>
      </article>
      <article>
        <span>02</span>
        <h3>{text.verifyBefore}</h3>
        <ul>{profile.checks.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ul>
      </article>
      <article className="v3-action-map__handoff">
        <span>03</span>
        <h3>{text.detailHandoff}</h3>
        <dl>{readiness.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
        <LocalLink locale={locale} href={`/exchanges/${profile.slug}#registration-path`}>{text.registrationLocked}</LocalLink>
        <small>{text.ctaLocked}</small>
      </article>
    </div>
    <div className="v3-action-map__footer">
      <span>{related.length ? `${related.length} ${text.reviewedActivity}` : text.noReviewedActivity}</span>
      <LocalLink locale={locale} href="/activities">{text.openActivities}</LocalLink>
      <strong>{text.noOfficial}</strong>
    </div>
  </section>;
}

function CompareProfileCards({ text, ui, locale, profiles }) {
  return <section className="v2-section v3-compare-cards">
    <div className="section-lead"><p>{ui.tradeReadiness}</p><h2>{text.compareTitle}</h2><span>{text.compareIntro}</span></div>
    <div className="v3-compare-cards__grid">
      {profiles.map((profile) => <article key={profile.slug}>
        <div className="v3-compare-card__head" translate="no" lang="en" dir="ltr"><BrandMark slug={profile.slug} compact /><b>{profile.name}</b><small>{profile.category}</small></div>
        <p>{profile.positioning}</p>
        <ul>{profile.strengths.slice(0, 2).map((item) => <li key={item}>{item}</li>)}</ul>
        <LocalLink locale={locale} href={`/exchanges/${profile.slug}`}>{text.openDetail}</LocalLink>
      </article>)}
    </div>
  </section>;
}

export function ConversionFunnel({ locale }) {
  const text = v3Copy(locale);
  return <section className="v2-section v3-funnel" id="conversion-funnel">
    <div className="section-lead"><p>{text.funnelEyebrow}</p><h2>{text.funnelTitle}</h2><span>{text.funnelIntro}</span></div>
    <div className="v3-funnel__steps">
      {text.funnelSteps.map((step, index) => <article key={step.title}>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
      </article>)}
    </div>
  </section>;
}

// --------------------------------------------------------------------------
// Fee sources and reviewed base rates. Never infer an exchange VIP schedule.
// --------------------------------------------------------------------------
function VenueTieredFeeMatrix({ venue, locale, db, rebatePercent, inviteCode, registrationUrl, registrationDirect = true, localizedVenueName, claimsVerified = false, researchActions = [] }) {
  const ui = detailUi(locale);
  const isZh = locale && (locale.startsWith("zh") || locale === "zh-Hans" || locale === "zh-Hant");
  const venueCategory = String(venue.category || db.category || "").toLowerCase();
  const isCexVenue = venueCategory === "cex";

  if (!isCexVenue) {
    const isPerpDex = venueCategory.includes("perp");
    const compactUi = dexFeeCompactUi(locale, localizedVenueName, isPerpDex);
    const sourceUrl = db.officialVerifyUrl || db.registrationUrl || null;
    const safeRegistrationUrl = typeof registrationUrl === "string" && registrationUrl.length ? registrationUrl : null;
    const mechanismItems = isPerpDex
      ? compactUi.perpItems
      : compactUi.dexItems;

    return (
      <section className="v2-section v3-fee-matrix-section" id="fee-schedule">
        <div className="v3-fee-matrix-card v3-dex-fee-compact" data-venue-fee-model={isPerpDex ? "perp-dex" : "dex"}>
          <div className="v3-fee-matrix-head">
            <div>
              <div className="v3-matrix-badge-row">
                <span className="v3-fee-tag">{compactUi.tag}</span>
                <span className="v3-rebate-pill">{localePending(locale)}</span>
              </div>
              <h2 className="v3-fee-matrix-title">
                {compactUi.title}
              </h2>
              <p className="v3-fee-matrix-sub">
                {compactUi.body}
              </p>
            </div>
          </div>

          <div className="v3-dex-fee-compact__grid">
            {mechanismItems.map((item, index) => (
              <article key={item} className="v3-dex-fee-compact__item">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item}</strong>
                <p>{compactUi.verify}</p>
              </article>
            ))}
          </div>

          <div className="v3-dex-fee-compact__actions">
            {inviteCode ? (
              <div className="v3-dex-fee-compact__code">
                <span>{compactUi.code}</span>
                <strong translate="no">{inviteCode}</strong>
              </div>
            ) : (
              <div className="v3-dex-fee-compact__code">
                <span>{compactUi.codeState}</span>
                <strong>{compactUi.noCode}</strong>
              </div>
            )}
            <div className="v3-fee-cta-inline">
              {sourceUrl && (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="v3-expand-tiers-btn">
                  {compactUi.source}
                </a>
              )}
              {safeRegistrationUrl ? (
                <a href={safeRegistrationUrl} target={registrationDirect ? "_blank" : undefined} rel={registrationDirect ? "sponsored noopener noreferrer" : undefined} className="v3-fee-lock-btn">
                  {registrationDirect ? compactUi.route : compactUi.blocked}
                </a>
              ) : (
                <span className="v3-fee-lock-btn v3-fee-lock-btn--disabled" aria-disabled="true">
                  {compactUi.unavailable}
                </span>
              )}
            </div>
          </div>
          {researchActions.length > 0 && (
            <div className="v3-dex-fee-compact__research" role="group" aria-label={`${localizedVenueName} research paths`}>
              {researchActions.map((action) => action.external ? (
                <a
                  key={action.href}
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cta-kind={action.kind}
                  data-cta-platform={venue.slug}
                  data-cta-placement={action.placement}
                  data-growth-decision={action.decision}
                  data-growth-placement={action.placement}
                >
                  {action.label}
                </a>
              ) : (
                <LocalLink
                  key={action.href}
                  locale={locale}
                  href={action.href}
                  data-cta-kind={action.kind}
                  data-cta-platform={venue.slug}
                  data-cta-placement={action.placement}
                  data-growth-decision={action.decision}
                  data-growth-placement={action.placement}
                >
                  {action.label}
                </LocalLink>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  const feeText = feeSummaryCopy(locale);
  const summary = buildVenueFeeSummary(db, researchForVenue(venue.slug, locale) || {});
  const formatRate = feePctOfRate;

  return (
    <section className="v2-section v3-fee-matrix-section" id="fee-schedule">
      <div className="v3-fee-matrix-card" data-venue-fee-model="sourced-base-fees">
        <div className="v3-fee-matrix-head">
          <div>
            <h2 className="v3-fee-matrix-title">{localizedVenueName} · {feeText.title}</h2>
            <p className="v3-fee-matrix-sub">{feeText.body}</p>
          </div>
        </div>
        {summary.rates.length > 0 && (
          <div className="v3-fee-table-wrap" tabIndex={0} role="region" aria-label={feeText.title}>
            <table className="v3-fee-table">
              <thead><tr>
                <th scope="col">{feeText.title}</th>
                <th scope="col">{isZh ? "挂单" : ui.maker || "Maker"}</th>
                <th scope="col">{isZh ? "吃单" : ui.taker || "Taker"}</th>
              </tr></thead>
              <tbody>{summary.rates.map(rate => (
                <tr key={rate.product} data-fee-product={rate.product}>
                  <th scope="row">{reviewedFeeCopy(rate, locale).tier}<span className="v3-fee-scope-label">{reviewedFeeCopy(rate, locale).scope}</span></th>
                  <td>{formatRate(rate.makerRate)}</td>
                  <td>{formatRate(rate.takerRate)}</td>
                </tr>
              ))}</tbody>
            </table>
            {summary.rates.map(rate => <div key={rate.product} className="v3-fee-scope-note" data-fee-scope={rate.scopeKey}>
              <p>{reviewedFeeCopy(rate, locale).conditions}</p>
              <p><a href={rate.sourceUrl} target="_blank" rel="noopener noreferrer">{feeText.source} ↗</a> · {feeText.checked}: <time dateTime={isoDay(rate.checkedAt)}>{isoDay(rate.checkedAt)}</time></p>
            </div>)}
          </div>
        )}
        <div className="v3-fee-matrix-footer">
          <div className="v3-fee-cta-inline">
            {(summary.rates.length ? [] : summary.sources).map((href, index) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="v3-expand-tiers-btn">
                {feeText.source}{summary.sources.length > 1 ? ` ${index + 1}` : ""} ↗
              </a>
            ))}
          </div>
          <div className="v3-fee-cta-inline">
            {inviteCode && <span className="v3-fee-tip">{ui.code}: <strong translate="no">{inviteCode}</strong></span>}
            {registrationUrl && <a href={registrationUrl} target={registrationDirect ? "_blank" : undefined} rel={registrationDirect ? "sponsored noopener noreferrer" : undefined} className="v3-fee-lock-btn" data-cta-kind={registrationDirect ? "registration" : "research"} data-cta-platform={venue.slug} data-cta-placement="fee-summary" data-growth-decision={venue.slug} data-growth-placement="fee-summary">
              {registrationDirect ? feeText.registration : ui.verifyRegional} ↗
            </a>}
          </div>
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------------------------------
// 模块 B：Proof of Reserves (PoR) 深度透视与链上验证指南
// --------------------------------------------------------------------------
function VenueProofOfReserves({ venue, locale, db, officialDomain, localizedVenueName }) {
  const isZh = locale && (locale.startsWith("zh") || locale === "zh-Hans" || locale === "zh-Hant");
  const ui = porUi(locale, localizedVenueName || venue.name);
  const isCex = (venue.category || "CEX").toUpperCase() === "CEX";
  const porUrl = db.porAuditUrl || `https://${officialDomain}`;
  const porRatio = db.porCoverageRatio || db.reserveRatio || (isCex ? "105.4%+" : zhText(locale, "100% 智能合约", "100% 智能合約"));
  const auditFirm = db.auditFirm || (isCex ? (isZh ? zhText(locale, "公开链上默克尔树 (Merkle Tree) 密码学自证", "公開鏈上默克爾樹 (Merkle Tree) 密碼學自證") : "Public Merkle Tree Cryptographic Verification") : (isZh ? zhText(locale, "开源智能合约链上公开可验证", "開源智能合約鏈上公開可驗證") : "Open-Source Smart Contract On-Chain Verifiable"));
  const securityFund = db.securityFund || (isCex
    ? (isZh ? zhText(locale, "平台安全风险储备基金 ($1.0B+ SAFU 架构)", "平台安全風險儲備基金 ($1.0B+ SAFU 架構)") : ({ ja: "$1B+ SAFU / セキュリティ準備金", ko: "$1B+ SAFU / 보안 준비금", tr: "$1B+ SAFU / Güvenlik rezervi", fr: "$1B+ SAFU / réserve de sécurité", de: "$1B+ SAFU / Sicherheitsreserve", es: "$1B+ SAFU / fondo de reserva", "pt-BR": "$1B+ SAFU / reserva de segurança", ru: "$1B+ SAFU / резерв безопасности", ar: "$1B+ SAFU / احتياطي أمان", id: "$1B+ SAFU / dana cadangan keamanan", vi: "$1B+ SAFU / quỹ dự phòng an toàn", it: "$1B+ SAFU / fondo di sicurezza" }[localeKey(locale)] || "$1B+ SAFU / Security Reserve Fund"))
    : (isZh ? zhText(locale, "协议安全审计 & 链上金库", "協議安全稽核 & 鏈上金庫") : ({ ja: "プロトコル監査済みオンチェーン金庫", ko: "프로토콜 감사 온체인 금고", tr: "Denetlenmiş protokol zincir üstü hazine", fr: "Trésorerie on-chain auditée", de: "Aufgezeichnete On-Chain-Protokollreserve", es: "Tesorería on-chain auditada", "pt-BR": "Tesouraria on-chain auditada", ru: "Аудированное ончейн-хранилище протокола", ar: "خزانة بروتوكول مدققة على السلسلة", id: "Perbendaharaan protokol on-chain teraudit", vi: "Kho bạc giao thức on-chain đã kiểm toán", it: "Tesoreria on-chain verificata" }[localeKey(locale)] || "Protocol Audited Treasury")));
  const porVerified = Boolean(db.porVerifiedAt && db.porAuditUrl);

  return (
    <section className="v2-section v3-por-section" id="proof-of-reserves">
      {/* a locale without PoR copy renders this card in English: mark it (the few localized values inside set dir="auto") */}
      <div className="v3-por-card" {...(!isZh && !ui.badge && !ui.title ? enIfLatin("PoR", locale) : undefined)}>
        <div className="v3-por-header">
          <div className="v3-por-badge-row">
            <span className="v3-por-shield-badge" {...enIfLatin(isZh ? zhText(locale, "资产偿付能力审计", "資產償付能力稽核") : (ui.badge || "Solvency & PoR"), locale)}> {isZh ? zhText(locale, "资产偿付能力审计", "資產償付能力稽核") : (ui.badge || "Solvency & PoR")}</span>
            <span className="v3-por-status-pill" dir="auto">{porVerified ? (isZh ? zhText(locale, "官方来源待复核", "官方來源待複核") : (ui.sourcePending || "Official source pending review")) : localePending(locale)}</span>
          </div>
          <h2 className="v3-por-title">
            {isZh ? zhText(locale, `${localizedVenueName} 资产储备证明 (PoR) 深度透视与链上核验`, `${localizedVenueName} 資產儲備證明 (PoR) 深度透視與鏈上核驗`) : (ui.title || `${venue.name} Proof of Reserves (PoR) & On-Chain Solvency`)}
          </h2>
          <p className="v3-por-desc">
            {isZh
              ? zhText(locale, `${localizedVenueName} 的储备金、审计与偿付能力信息应以最新官方披露和可复核来源为准；本页不把未核验数字写成保证。`, `${localizedVenueName} 的儲備金、稽核與償付能力資訊應以最新官方披露和可複核來源為準；本頁不把未核驗數字寫成保證。`)
              : (ui.desc || `${venue.name}'s reserves, audit and solvency information should be checked against the latest official disclosure and a reproducible source; this page does not turn unverified figures into a guarantee.`)}
          </p>
        </div>

        <div className="v3-por-metrics">
          <div className="v3-por-metric-item">
            <span className="v3-por-metric-label" {...enIfLatin(isZh ? zhText(locale, "综合储备总充足率", "綜合儲備總充足率") : (ui.total || "Total Reserve Ratio"), locale)}>{isZh ? zhText(locale, "综合储备总充足率", "綜合儲備總充足率") : (ui.total || "Total Reserve Ratio")}</span>
            <strong className={`v3-por-metric-value${porVerified ? " text-green" : ""}`} translate="no">{porVerified ? porRatio : (isZh ? zhText(locale, "待核验", "待核驗") : (ui.pending || "Pending"))}</strong>
            <span className="v3-por-metric-sub">{porVerified ? (isZh ? zhText(locale, "以官方报告和快照为准", "以官方報告和快照為準") : (ui.snapshot || "Based on official report and snapshot")) : (isZh ? zhText(locale, "未记录可复核来源", "未記錄可複核來源") : (ui.noSource || "No reproducible source recorded"))}</span>
          </div>
          <div className="v3-por-metric-item">
            <span className="v3-por-metric-label" {...enIfLatin(isZh ? zhText(locale, "审计机制与独立机构", "稽核機制與獨立機構") : (ui.audit || "Audit Mechanism"), locale)}>{isZh ? zhText(locale, "审计机制与独立机构", "稽核機制與獨立機構") : (ui.audit || "Audit Mechanism")}</span>
            <strong className="v3-por-metric-value text-blue" dir="auto">{porVerified ? auditFirm : localePending(locale)}</strong>
            <span className="v3-por-metric-sub" {...enIfLatin(isZh ? zhText(locale, "支持用户导出叶子节点验算", "支援用戶匯出葉子節點驗算") : (ui.merkle || "Cryptographic Merkle Root Verification"), locale)}>{isZh ? zhText(locale, "支持用户导出叶子节点验算", "支援用戶匯出葉子節點驗算") : (ui.merkle || "Cryptographic Merkle Root Verification")}</span>
          </div>
          <div className="v3-por-metric-item">
            <span className="v3-por-metric-label" {...enIfLatin(isZh ? zhText(locale, "投资者保障专项基金", "投資者保障專項基金") : (ui.protection || "Investor Protection Fund"), locale)}>{isZh ? zhText(locale, "投资者保障专项基金", "投資者保障專項基金") : (ui.protection || "Investor Protection Fund")}</span>
            <strong className="v3-por-metric-value text-gold" dir="auto">{porVerified ? securityFund : (isZh ? zhText(locale, "以官方披露为准", "以官方披露為準") : (ui.disclosure || "Refer to official disclosure"))}</strong>
            <span className="v3-por-metric-sub" {...enIfLatin(isZh ? zhText(locale, "极端黑天鹅与穿仓赔付保障", "極端黑天鵝與穿倉賠付保障") : (ui.protectionSub || "Extreme Event Protection"), locale)}>{isZh ? zhText(locale, "极端黑天鹅与穿仓赔付保障", "極端黑天鵝與穿倉賠付保障") : (ui.protectionSub || "Extreme Event Protection")}</span>
          </div>
        </div>

        <div className="v3-por-coins-grid">
          <div className="v3-por-coin-card">
            <div className="v3-por-coin-top">
              <strong>{isZh ? zhText(locale, "BTC 储备充足率", "BTC 儲備充足率") : (ui.btc || "BTC Reserve Ratio")}</strong>
              <span className={porVerified ? "text-green" : ""} translate="no">{porVerified ? "106.2%" : (isZh ? zhText(locale, "待核验", "待核驗") : (ui.pending || "Pending"))}</span>
            </div>
            <div className="v3-por-progress-bar">
              <div className="v3-por-progress-fill" style={{ width: porVerified ? "100%" : "0%" }}></div>
            </div>
            <small>{isZh ? zhText(locale, "储备与负债覆盖关系待官方来源核验", "儲備與負債覆蓋關係待官方來源核驗") : (ui.btcSub || "Reserve-to-liability coverage requires official-source verification")}</small>
          </div>
          <div className="v3-por-coin-card">
            <div className="v3-por-coin-top">
              <strong>{isZh ? zhText(locale, "ETH 储备充足率", "ETH 儲備充足率") : (ui.eth || "ETH Reserve Ratio")}</strong>
              <span className={porVerified ? "text-green" : ""} translate="no">{porVerified ? "104.8%" : (isZh ? zhText(locale, "待核验", "待核驗") : (ui.pending || "Pending"))}</span>
            </div>
            <div className="v3-por-progress-bar">
              <div className="v3-por-progress-fill" style={{ width: porVerified ? "100%" : "0%" }}></div>
            </div>
            <small>{isZh ? zhText(locale, "地址与审计范围待官方来源核验", "地址與稽核範圍待官方來源核驗") : (ui.ethSub || "Addresses and audit scope require official-source verification")}</small>
          </div>
          <div className="v3-por-coin-card">
            <div className="v3-por-coin-top">
              <strong>{isZh ? zhText(locale, "USDT/USDC 储备充足率", "USDT/USDC 儲備充足率") : (ui.stable || "USDT/USDC Reserve Ratio")}</strong>
              <span className={porVerified ? "text-green" : ""} translate="no">{porVerified ? "108.5%" : (isZh ? zhText(locale, "待核验", "待核驗") : (ui.pending || "Pending"))}</span>
            </div>
            <div className="v3-por-progress-bar">
              <div className="v3-por-progress-fill" style={{ width: porVerified ? "100%" : "0%" }}></div>
            </div>
            <small>{isZh ? zhText(locale, "稳定币覆盖依据待官方来源核验", "穩定幣覆蓋依據待官方來源核驗") : (ui.stableSub || "Stablecoin coverage basis requires official-source verification")}</small>
          </div>
        </div>

        <div className="v3-por-verify-guide">
          <h4 className="v3-por-guide-title" {...enIfLatin(isZh ? zhText(locale, "交易者三步链上自查指南", "交易者三步鏈上自查指南") : (ui.guide || "3-Step Verification Guide"), locale)}>{isZh ? zhText(locale, "交易者三步链上自查指南", "交易者三步鏈上自查指南") : (ui.guide || "3-Step Verification Guide")}</h4>
          <div className="v3-por-steps">
            <div className="v3-por-step">
              <span className="v3-por-step-num">01</span>
              <div>
                <strong>{isZh ? zhText(locale, "获取专属 Merkle 节点哈希", "取得專屬 Merkle 節點雜湊") : (ui.leaf || "Export Merkle Leaf Hash")}</strong>
                <p>{isZh ? zhText(locale, "登录官方个人中心「资产储备证明」页面，导出您账户当期的专属密码学叶子节点 Hash。", "登入官方個人中心「資產儲備證明」頁面，匯出您帳戶當期的專屬密碼學葉子節點 Hash。") : (ui.leafBody || "Log into your official account to export your unique cryptographic leaf node hash.")}</p>
              </div>
            </div>
            <div className="v3-por-step">
              <span className="v3-por-step-num">02</span>
              <div>
                <strong>{isZh ? zhText(locale, "运行开源密码学校验脚本", "執行開源密碼學校驗腳本") : (ui.verifier || "Run Open Source Verifier")}</strong>
                <p>{isZh ? zhText(locale, "在本地或通过官方开源脚本，将个人节点沿 Merkle Tree 向上哈希计算，比对是否包含在公开的根哈希 (Merkle Root) 中。", "在本地或透過官方開源腳本，將個人節點沿 Merkle Tree 向上雜湊計算，比對是否包含在公開的根雜湊 (Merkle Root) 中。") : (ui.verifierBody || "Verify along the Merkle Tree to confirm your asset balance is accurately counted.")}</p>
              </div>
            </div>
            <div className="v3-por-step">
              <span className="v3-por-step-num">03</span>
              <div>
                <strong>{isZh ? zhText(locale, "比对链上冷钱包总地址余额", "比對鏈上冷錢包總地址餘額") : (ui.wallets || "Cross-Check On-Chain Wallets")}</strong>
                <p>{isZh ? zhText(locale, "在 Nansen、DefiLlama 或区块链浏览器中核对平台公布的冷钱包总额是否大于等于负债总和。", "在 Nansen、DefiLlama 或區塊鏈瀏覽器中核對平台公布的冷錢包總額是否大於等於負債總和。") : (ui.walletsBody || "Verify that disclosed cold wallets hold total reserves exceeding cumulative liabilities.")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="v3-por-footer">
          <div className="v3-por-cold-warning">
            <span className="v3-warning-icon"></span>
            <div>
              <strong>{isZh ? zhText(locale, "自存私钥安全准则", "自存私鑰安全準則") : (ui.principle || "Non-Custodial Security Principle")}</strong>
              <p>
                {isZh
                  ? zhText(locale, "交易所储备金证明仅反映历史审计截面的偿付能力。大额闲置数字资产请务必转移至 Ledger、Trezor 等硬件冷钱包自持私钥，彻底规避平台黑天鹅风险。", "交易所儲備金證明僅反映歷史稽核截面的償付能力。大額閒置數位資產請務必轉移至 Ledger、Trezor 等硬體冷錢包自持私鑰，徹底規避平台黑天鵝風險。")
                  : (ui.principleBody || "Proof of reserves reflects specific snapshot solvency. Transfer long-term substantial holdings to hardware cold wallets (Ledger/Trezor) to retain sovereign ownership.")}
              </p>
            </div>
          </div>
          <a href={porUrl} target="_blank" rel="noopener noreferrer" className="v3-por-audit-btn">
            {isZh ? zhText(locale, "查验官方储备金审计报告 ↗", "查驗官方儲備金稽核報告 ↗") : (ui.auditBtn || "View Official PoR Audit Report ↗")}
          </a>
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------------------------------
// 模块 C：防钓鱼官方域名与社群全景白名单 (Anti-Phishing Hub)
// --------------------------------------------------------------------------
const clipboardFeedbackCopy = Object.freeze({"en": ["Copying…", "Copied", "Copy failed", "Copy the displayed value manually."], "zh-Hans": ["正在复制…", "已复制", "复制失败", "请手动复制页面显示的内容。"], "zh-Hant": ["正在複製…", "已複製", "複製失敗", "請手動複製頁面顯示的內容。"], "ja": ["コピー中…", "コピーしました", "コピーできませんでした", "表示された内容を手動でコピーしてください。"], "ko": ["복사 중…", "복사됨", "복사 실패", "표시된 내용을 직접 복사하세요."], "tr": ["Kopyalanıyor…", "Kopyalandı", "Kopyalanamadı", "Gösterilen değeri elle kopyalayın."], "es": ["Copiando…", "Copiado", "No se pudo copiar", "Copia manualmente el valor mostrado."], "pt-BR": ["Copiando…", "Copiado", "Falha ao copiar", "Copie manualmente o valor exibido."], "fr": ["Copie en cours…", "Copié", "Échec de la copie", "Copiez manuellement la valeur affichée."], "de": ["Wird kopiert…", "Kopiert", "Kopieren fehlgeschlagen", "Kopieren Sie den angezeigten Wert manuell."], "ru": ["Копирование…", "Скопировано", "Не удалось скопировать", "Скопируйте показанное значение вручную."], "ar": ["جارٍ النسخ…", "تم النسخ", "تعذر النسخ", "انسخ القيمة المعروضة يدوياً."], "id": ["Menyalin…", "Disalin", "Gagal menyalin", "Salin nilai yang ditampilkan secara manual."], "vi": ["Đang sao chép…", "Đã sao chép", "Không thể sao chép", "Sao chép giá trị hiển thị theo cách thủ công."], "it": ["Copia in corso…", "Copiato", "Copia non riuscita", "Copia manualmente il valore visualizzato."]});
function clipboardStatusText(state, locale) {
  const messages = clipboardFeedbackCopy[locale] || clipboardFeedbackCopy[String(locale || "").split("-")[0]] || clipboardFeedbackCopy.en;
  return state === "pending" ? messages[0] : state === "success" ? messages[1] : state === "error" ? messages[2] : "";
}
function copyFeedbackLabel(state, locale, idleLabel) {
  return state === "idle" ? idleLabel : clipboardStatusText(state, locale);
}
function useCopyFeedback(scope) {
  const [state, setState] = useState("idle");
  const active = useRef(true);
  const operation = useRef(0);
  const resetTimer = useRef(null);
  useEffect(() => {
    active.current = true;
    setState("idle");
    return () => {
      active.current = false;
      operation.current += 1;
      clearTimeout(resetTimer.current);
      resetTimer.current = null;
    };
  }, [scope]);
  const copy = async (text) => {
    if (!active.current) return;
    const attempt = ++operation.current;
    clearTimeout(resetTimer.current);
    resetTimer.current = null;
    setState("pending");
    try {
      if (typeof navigator === "undefined" || typeof navigator.clipboard?.writeText !== "function") throw new Error("CLIPBOARD_UNAVAILABLE");
      await navigator.clipboard.writeText(text);
      if (!active.current || operation.current !== attempt) return;
      setState("success");
      resetTimer.current = setTimeout(() => {
        resetTimer.current = null;
        if (active.current && operation.current === attempt) setState("idle");
      }, 2000);
    } catch {
      if (active.current && operation.current === attempt) setState("error");
    }
  };
  return { state, copy };
}
function CopyFeedbackStatus({ state, locale }) {
  const messages = clipboardFeedbackCopy[locale] || clipboardFeedbackCopy[String(locale || "").split("-")[0]] || clipboardFeedbackCopy.en;
  return <small className="v3-copy-feedback" role="status" aria-live="polite" aria-atomic="true">{state === "idle" ? "" : `${clipboardStatusText(state, locale)}${state === "error" ? `. ${messages[3]}` : ""}`}</small>;
}

function VenueAntiPhishingSecurity({ venue, locale, db, partner, officialDomain, localizedVenueName }) {
  const isZh = locale && (locale.startsWith("zh") || locale === "zh-Hans" || locale === "zh-Hant");
  const securityUi = venueSecurityUi(locale, localizedVenueName || venue.name);
  const domainFeedback = useCopyFeedback(`${venue.slug}:domain`);
  const recordedAlternateDomains = Array.isArray(db.mirrors) ? db.mirrors.filter(Boolean) : [];
  const officialVerifyUrl = db.officialVerifyUrl || partner.officialDomain || `https://${officialDomain}`;

  const handleCopyDomain = (text) => domainFeedback.copy(text);

  return (
    <section className="v2-section v3-security-section" id="anti-phishing">
      <div className="v3-security-card">
        <div className="v3-security-header">
          <div className="v3-security-badge-row">
            <span className="v3-security-tag"> {isZh ? zhText(locale, "官方域名来源记录与反钓鱼核对", "官方網域來源記錄與反釣魚核對") : (securityUi.tag || "Anti-Phishing & Recorded Domains")}</span>
            <span className="v3-verified-badge">{isZh ? zhText(locale, "NexuAlpha 来源记录已核对", "NexuAlpha 來源記錄已核對") : (securityUi.verified || "NexuAlpha source record checked")}</span>
          </div>
          <h2 className="v3-security-title">
            {isZh ? zhText(locale, `${localizedVenueName} 防钓鱼官方域名与社群全景白名单`, `${localizedVenueName} 防釣魚官方網域與社群全景白名單`) : (securityUi.title || `${venue.name} Recorded Domain Source Check & Anti-Phishing Hub`)}
          </h2>
          <p className="v3-security-sub">
            {isZh
              ? zhText(locale, "加密货币领域常有黑客购买 Google 搜索关键词广告投放高仿钓鱼网站。请认准以下已记录主域名与备用域名，切勿通过不可信搜索广告链接登录。", "加密貨幣領域常有駭客購買 Google 搜尋關鍵字廣告投放高仿釣魚網站。請認準以下已記錄主網域與備用網域，切勿透過不可信搜尋廣告連結登入。")
              : (securityUi.sub || "Defend against Google Ads phishing clones and counterfeit social channels. Bookmark recorded primary domains and documented alternate domains below.")}
          </p>
        </div>

        <div className="v3-domains-grid">
          <div className="v3-domain-box primary">
            <div className="v3-domain-box__header">
              <span className="v3-domain-type">{isZh ? zhText(locale, "已记录主域名", "已記錄主網域") : (securityUi.primary || "Primary Official Domain")}</span>
              <span className="v3-ssl-indicator">● {isZh ? zhText(locale, "来源记录一致", "來源記錄一致") : (securityUi.verifiedMirror || "Source record match")}</span>
            </div>
            <div className="v3-domain-box__content">
              <code translate="no">{officialDomain}</code>
              <button
                type="button"
                onClick={() => handleCopyDomain(`https://${officialDomain}`)}
                className="v3-copy-domain-btn"
              >
                {copyFeedbackLabel(domainFeedback.state, locale, isZh ? zhText(locale, "复制域名地址", "複製網域地址") : (securityUi.copy || "Copy Domain URL"))}
              </button>
            </div>
            <CopyFeedbackStatus state={domainFeedback.state} locale={locale} />
            <small>{isZh ? "该域名来自已审阅记录，打开后仍需核对平台页面提示" : (securityUi.secure || "Recorded domain. Re-check the platform page after opening.")}</small>
          </div>

          <div className="v3-domain-box mirrors">
            <div className="v3-domain-box__header">
              <span className="v3-domain-type">{isZh ? "已记录备用域名" : (securityUi.mirrors || "Recorded alternate domains")}</span>
              <span className="v3-status-dot">● {isZh ? "来源记录" : (securityUi.verifiedMirror || "Recorded")}</span>
            </div>
            <div className="v3-mirrors-list">
              {recordedAlternateDomains.length ? recordedAlternateDomains.map((m) => (
                <div key={m} className="v3-mirror-item">
                  <span className="v3-mirror-lock"></span>
                  <code translate="no">{m}</code>
                  <span className="v3-mirror-badge">{isZh ? "来源记录" : (securityUi.verifiedMirror || "Recorded")}</span>
                </div>
              )) : (
                <div className="v3-mirror-item">
                  <span className="v3-mirror-lock">•</span>
                  <span>{isZh ? "暂无已记录备用域名；请以主域名和平台官方验证页面为准。" : (securityUi.noMirrors || "No alternate domains are recorded; use the primary domain and the platform verification page as the check point.")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="v3-security-tools-bar">
          <div className="v3-tool-left">
            <span className="v3-tool-icon"></span>
            <div>
              <strong>{isZh ? zhText(locale, "官方渠道真伪验证器", "官方渠道真偽驗證器") : (securityUi.tool || "Official Channel Verification Tool")}</strong>
              <p>{isZh ? "收到自称官方客服的 Telegram 私聊、邮件或网址？请使用官方验证工具一键核验对方身份真伪。" : (securityUi.toolBody || "Verify Telegram IDs, emails, domain names or phone numbers directly through official verifier.")}</p>
            </div>
          </div>
          <a
            href={officialVerifyUrl.startsWith("http") ? officialVerifyUrl : `https://${officialVerifyUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="v3-open-verifier-btn"
          >
            {isZh ? "前往官方渠道真伪验证器 ↗" : ({
              ja: "公式検証ツールを開く ↗", ko: "공식 검증 도구 열기 ↗", tr: "Resmî doğrulama aracını aç ↗",
              es: "Abrir verificador oficial ↗", "pt-BR": "Abrir verificador oficial ↗", fr: "Ouvrir le vérificateur officiel ↗",
              de: "Offizielles Prüfwerkzeug öffnen ↗", ar: "فتح أداة التحقق الرسمية ↗", ru: "Открыть официальный проверщик ↗",
              id: "Buka verifikator resmi ↗", vi: "Mở công cụ xác minh chính thức ↗", it: "Apri verificatore ufficiale ↗"
            }[locale] || "Open Official Verifier ↗")}
          </a>
        </div>

        <div className="v3-rules-row">
          <div className="v3-rule-card">
            <span className="v3-rule-badge">{isZh ? "防骗规则 1" : "Rule 01"}</span>
            <strong>{isZh ? "绝不点击 Google 搜索首条赞助广告" : (securityUi.copyRule || "Never Click Sponsored Ads")}</strong>
            <p>{isZh ? "黑客常伪造仿冒顶级域名并在搜索广告中买量，请直接输入官方域名或通过书签访问。" : (securityUi.copyRuleBody || "Search ads frequently direct to counterfeit typo-squatted domains.")}</p>
          </div>
          <div className="v3-rule-card">
            <span className="v3-rule-badge">{isZh ? "防骗规则 2" : "Rule 02"}</span>
            <strong>{isZh ? "官方人员绝不会在 Telegram 主动私聊" : (securityUi.dmRule || "Official Support Never DMs First")}</strong>
            <p>{isZh ? "任何在 Telegram/Discord 私聊要求输入助记词、充值解冻或私下 OTC 的 100% 为诈骗分子。" : (securityUi.dmRuleBody || "Never disclose seed phrases or transfer margin funds to private Telegram DMs.")}</p>
          </div>
          <div className="v3-rule-card">
            <span className="v3-rule-badge">{isZh ? "防骗规则 3" : "Rule 03"}</span>
            <strong>{isZh ? "必须开启账户安全防钓鱼码" : (securityUi.codeRule || "Enable Anti-Phishing Code")}</strong>
            <p>{isZh ? "在个人安全中心设置防钓鱼码 (Anti-Phishing Code)，官方发送的每一封邮件都会印有您的专属安全暗号。" : (securityUi.codeRuleBody || "Configure an anti-phishing code in security settings to validate all incoming emails.")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// --------------------------------------------------------------------------
// 模块 5：Telegram 深度唤醒 CTA (Telegram Intelligence Bot Integration)
// --------------------------------------------------------------------------
const telegramLocaleUi = {
  ja: { intelligence: "Telegramボット 24時間インテリジェンス", review: "Telegramで手数料と公式条件を確認", research: "出典付きの手数料・商品リサーチ", benefit: "公式ルールでユーザー特典を確認", sources: "公式準備金・リスク情報", monitor: "Telegramでこの取引所を監視 ↗", channel: "公式情報チャンネル", community: "トレーダーコミュニティ", desc: "公式 @{b} を通じて、出典付きの手数料リサーチ、公式リンク、アカウント条件を確認できます。最新の条件はプラットフォームで必ずご確認ください。" },
  ko: { intelligence: "Telegram 봇 24시간 정보", review: "Telegram에서 수수료와 공식 조건 확인", research: "출처가 표시된 수수료·상품 리서치", benefit: "공식 규정에 따라 혜택 확인", sources: "공식 준비금·위험 출처", monitor: "Telegram에서 거래소 모니터링 ↗", channel: "공식 정보 채널", community: "트레이더 커뮤니티", desc: "공식 @{b}에서 출처가 표시된 수수료 리서치, 공식 링크, 계정 조건을 확인하세요. 최신 조건은 반드시 플랫폼에서 직접 확인해야 합니다." },
  tr: { intelligence: "Telegram Botu 7/24 bilgi", review: "Ücretleri ve resmî koşulları Telegram'da inceleyin", research: "Kaynaklı ücret ve ürün araştırması", benefit: "Kullanıcı avantajını resmî kurallarla doğrulayın", sources: "Resmî rezerv ve risk kaynakları", monitor: "Borsayı Telegram'da izle ↗", channel: "Resmî bilgi kanalı", community: "Trader topluluğu", desc: "Resmî @{b} üzerinden kaynaklı ücret araştırmasına, resmî bağlantılara ve hesap koşullarına ulaşın; güncel koşulları mutlaka platformda doğrulayın." },
  es: { intelligence: "Inteligencia 24/7 del bot de Telegram", review: "Revisa comisiones y condiciones oficiales en Telegram", research: "Investigación de tarifas y productos con fuentes", benefit: "Verifica el beneficio según las reglas oficiales", sources: "Fuentes oficiales de reservas y riesgos", monitor: "Monitorizar plataforma en Telegram ↗", channel: "Canal oficial de información", community: "Comunidad de traders", desc: "Conéctate con el @{b} oficial para ver investigación de comisiones con fuentes, enlaces oficiales y condiciones de cuenta; verifica las condiciones vigentes en la plataforma." },
  fr: { intelligence: "Veille Telegram 24/7", review: "Vérifiez les frais et conditions officielles sur Telegram", research: "Recherche des frais et produits avec sources", benefit: "Vérifiez l’avantage selon les règles officielles", sources: "Sources officielles sur les réserves et risques", monitor: "Surveiller la plateforme sur Telegram ↗", channel: "Canal officiel d’information", community: "Communauté de traders", desc: "Connectez-vous au @{b} officiel pour consulter une recherche sur les frais avec sources, des liens officiels et les conditions de compte ; vérifiez les conditions en vigueur sur la plateforme." },
  de: { intelligence: "Telegram-Bot mit 24/7-Informationen", review: "Gebühren und offizielle Bedingungen auf Telegram prüfen", research: "Quellenbasierte Gebühren- und Produktrecherche", benefit: "Vorteil nach offiziellen Regeln prüfen", sources: "Offizielle Quellen zu Reserven und Risiken", monitor: "Plattform auf Telegram überwachen ↗", channel: "Offizieller Informationskanal", community: "Trader-Community", desc: "Verbinden Sie sich mit dem offiziellen @{b} für quellenbasierte Gebührenrecherche, offizielle Links und Kontobedingungen; aktuelle Bedingungen bitte direkt bei der Plattform prüfen." },
  ru: { intelligence: "Информация Telegram-бота 24/7", review: "Проверьте комиссии и официальные условия в Telegram", research: "Исследование комиссий и продуктов с источниками", benefit: "Проверьте преимущество по официальным правилам", sources: "Официальные источники резервов и рисков", monitor: "Мониторить платформу в Telegram ↗", channel: "Официальный информационный канал", community: "Сообщество трейдеров", desc: "Подключитесь к официальному @{b}: исследование комиссий с источниками, официальные ссылки и условия аккаунта. Актуальные условия проверяйте на самой платформе." },
  "pt-BR": { intelligence: "Inteligência 24/7 do bot do Telegram", review: "Revise taxas e condições oficiais no Telegram", research: "Pesquisa de taxas e produtos com fontes", benefit: "Verifique o benefício conforme as regras oficiais", sources: "Fontes oficiais de reservas e riscos", monitor: "Monitorar a plataforma no Telegram ↗", channel: "Canal oficial de informações", community: "Comunidade de traders", desc: "Conecte-se ao @{b} oficial para ver pesquisa de taxas com fontes, links oficiais e condições da conta; confirme as condições atuais na plataforma." },
  id: { intelligence: "Intelijen bot Telegram 24/7", review: "Tinjau biaya dan ketentuan resmi di Telegram", research: "Riset biaya dan produk berlabel sumber", benefit: "Verifikasi manfaat sesuai aturan resmi", sources: "Sumber resmi cadangan dan risiko", monitor: "Pantau platform di Telegram ↗", channel: "Kanal informasi resmi", community: "Komunitas trader", desc: "Hubungkan ke @{b} resmi untuk riset biaya berlabel sumber, tautan resmi, dan ketentuan akun; pastikan ketentuan terbaru langsung di platform." },
  vi: { intelligence: "Bot Telegram thông tin 24/7", review: "Xem phí và điều kiện chính thức trên Telegram", research: "Nghiên cứu phí và sản phẩm có ghi nguồn", benefit: "Xác minh ưu đãi theo quy định chính thức", sources: "Nguồn chính thức về dự trữ và rủi ro", monitor: "Theo dõi nền tảng trên Telegram ↗", channel: "Kênh thông tin chính thức", community: "Cộng đồng trader", desc: "Kết nối với @{b} chính thức để xem nghiên cứu phí có ghi nguồn, liên kết chính thức và điều kiện tài khoản; hãy xác minh điều kiện hiện hành trên nền tảng." },
  it: { intelligence: "Bot Telegram con informazioni 24/7", review: "Verifica commissioni e condizioni ufficiali su Telegram", research: "Ricerca su commissioni e prodotti con fonti", benefit: "Verifica il vantaggio secondo le regole ufficiali", sources: "Fonti ufficiali su riserve e rischi", monitor: "Monitora la piattaforma su Telegram ↗", channel: "Canale informativo ufficiale", community: "Community di trader", desc: "Collegati al @{b} ufficiale per ricerche sulle commissioni con fonti, link ufficiali e condizioni dell’account; verifica le condizioni aggiornate sulla piattaforma." },
  ar: { intelligence: "بوت Telegram للمعلومات على مدار الساعة", review: "راجع الرسوم والشروط الرسمية على Telegram", research: "بحث في الرسوم والمنتجات مع المصادر", benefit: "تحقق من الميزة وفق القواعد الرسمية", sources: "مصادر رسمية للاحتياطيات والمخاطر", monitor: "راقب المنصة على Telegram ↗", channel: "قناة المعلومات الرسمية", community: "مجتمع المتداولين", desc: "اتصل بالبوت الرسمي @{b} للاطلاع على أبحاث الرسوم الموثّقة بالمصادر والروابط الرسمية وشروط الحساب، وتحقق من الشروط الحالية لدى المنصة." },
};

const compareTelegramLabels = {
  "zh-Hans": "在 Telegram 继续比较 ↗",
  "zh-Hant": "在 Telegram 繼續比較 ↗",
  ja: "Telegramで比較を続ける ↗",
  ko: "Telegram에서 비교 계속 ↗",
  tr: "Karşılaştırmaya Telegram'da devam et ↗",
  es: "Continuar la comparación en Telegram ↗",
  fr: "Continuer la comparaison sur Telegram ↗",
  de: "Vergleich in Telegram fortsetzen ↗",
  ru: "Продолжить сравнение в Telegram ↗",
  "pt-BR": "Continuar a comparação no Telegram ↗",
  id: "Lanjutkan perbandingan di Telegram ↗",
  vi: "Tiếp tục so sánh trên Telegram ↗",
  it: "Continua il confronto su Telegram ↗",
  ar: "تابع المقارنة في Telegram ↗",
  en: "Continue comparison in Telegram ↗",
};

function compareTelegramLabel(locale = "en") {
  return compareTelegramLabels[locale] || compareTelegramLabels[String(locale || "").split("-")[0]] || compareTelegramLabels.en;
}

function VenueTelegramMonitorSection({ venue, locale, market, product, rebatePercent, localizedVenueName, claimsVerified = false }) {
  const isZh = locale && (locale.startsWith("zh") || locale === "zh-Hans" || locale === "zh-Hant");
  const telegramUi = telegramLocaleUi[locale] || telegramLocaleUi[String(locale || "").split("-")[0]] || {};
  const telegramFunnel = buildTelegramWebsiteFunnelContext({ intent: "monitor", venue: venue.slug, market, locale, product, campaign: "venue_monitor" });

  return (
    <section className="v2-section v3-tg-monitor-section" id="telegram-monitor">
      <div className="v3-tg-monitor-card">
        <div className="v3-tg-monitor-left">
          <div className="v3-tg-badge">
            <span className="v3-tg-icon">✈</span>
            <span>{isZh ? zhText(locale, "Telegram Bot 24/7 情报", "Telegram Bot 24/7 情報") : (telegramUi.intelligence || "Telegram Bot 24/7 Intelligence")}</span>
          </div>
          <h3 className="v3-tg-title">
            {isZh
              ? zhText(locale, `在 Telegram 中继续核对 ${localizedVenueName} 的费率与官方条款`, `在 Telegram 中繼續核對 ${localizedVenueName} 的費率與官方條款`)
              : (telegramUi.review || `Review ${venue.name} fee schedules and official terms on Telegram`)}
          </h3>
          <p className="v3-tg-desc">
            {isZh
              ? zhText(locale, `接入 NexuAlpha 官方 @${TELEGRAM_CONFIG.botUsername}，查看带来源标记的费率研究、官方链接与账户条件；市场数据和用户权益以官方页面为准。`, `接入 NexuAlpha 官方 @${TELEGRAM_CONFIG.botUsername}，查看帶來源標記的費率研究、官方連結與帳戶條件；市場資料和用戶權益以官方頁面為準。`)
              : (telegramUi.desc ? telegramUi.desc.replace("{b}", TELEGRAM_CONFIG.botUsername) : `Connect via official @${TELEGRAM_CONFIG.botUsername} for source-labelled fee research, official links and account conditions; verify live terms with the platform.`)}
          </p>
          <div className="v3-tg-features">
            <span className="v3-tg-feat-item">✓ {isZh ? zhText(locale, "带来源的费率与产品条款研究", "帶來源的費率與產品條款研究") : (telegramUi.research || "Source-labelled fee and product research")}</span>
            <span className="v3-tg-feat-item">✓ {claimsVerified ? (isZh ? zhText(locale, `按官方规则核对 -${formatPercent(locale, rebatePercent)} 用户权益`, `按官方規則核對 -${formatPercent(locale, rebatePercent)} 用戶權益`) : `${telegramUi.benefit || "Verify the user benefit under official rules"}`) : (isZh ? zhText(locale, "官方账户内核验用户权益", "官方帳戶內核驗用戶權益") : (telegramUi.benefit || "Verify user benefits in the official account"))}</span>
            <span className="v3-tg-feat-item">✓ {isZh ? zhText(locale, "官方储备与风险来源链接", "官方儲備與風險來源連結") : (telegramUi.sources || "Official reserve and risk source links")}</span>
          </div>
        </div>
        <div className="v3-tg-monitor-right">
          <a
            href={telegramFunnel.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="v3-tg-launch-btn"
            data-cta-kind="telegram"
            data-cta-placement="venue-telegram-monitor"
            data-growth-decision={`monitor_${venue.slug}`}
            data-growth-placement="venue-telegram"
            data-growth-market={market}
            data-growth-product={product}
            data-telegram-start={telegramFunnel.startPayload}
            data-telegram-return-href={telegramFunnel.returnHref}
          >
            <span className="v3-tg-paperplane">✈</span>
            <span>{isZh ? zhText(locale, "在 Telegram 中监控此交易所费率与返佣 ↗", "在 Telegram 中監控此交易所費率與返傭 ↗") : (telegramUi.monitor || "Monitor Venue on Telegram ↗")}</span>
          </a>
          <div className="v3-tg-links-sub">
            <a href={TELEGRAM_CONFIG.channelUrl} target="_blank" rel="noopener noreferrer" className="v3-tg-sublink" data-cta-kind="telegram" data-cta-placement="venue-telegram-channel" data-growth-decision="telegram_channel" data-growth-placement="venue-telegram">
               {isZh ? zhText(locale, "官方情报频道", "官方情報頻道") : (telegramUi.channel || "Official Channel")}
            </a>
            <span className="v3-tg-dot">·</span>
            <a href={TELEGRAM_CONFIG.groupUrl} target="_blank" rel="noopener noreferrer" className="v3-tg-sublink" data-cta-kind="telegram" data-cta-placement="venue-telegram-group" data-growth-decision="telegram_group" data-growth-placement="venue-telegram">
               {isZh ? zhText(locale, "VIP 交易员交流群", "VIP 交易員交流群") : (telegramUi.community || "VIP Community")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function VenueDetailPage({ copy, locale, venue, venues, updates, market, product, accountStage, funding }) {
  const codeFeedback = useCopyFeedback(`${venue.slug}:code`);
  const copied = codeFeedback.state === "success";
  const [tradeVolume, setTradeVolume] = useState(50000);
  const [showAllSimilar, setShowAllSimilar] = useState(false);
  const [mobileStickyActive, setMobileStickyActive] = useState(false);
  const shouldShowMobileSticky = (anchorRect, isMobileViewport) => {
    if (!isMobileViewport || !anchorRect) return false;
    const bottom = Number(anchorRect.bottom);
    return Number.isFinite(bottom) && bottom <= 0;
  };

  const text = v3Copy(locale);
  const ui = interfaceText(locale);
  const detailLabels = detailUi(locale);
  const invitationSummary = invitationSummaryByLocale[textLocaleKey(locale)] || invitationSummaryByLocale.en;
  const profile = venueProfile(venue, locale);
  const runtimeUi = detailRuntimeUi(locale, text, profile.name);
  const research = researchForVenue(venue.slug, locale);
  const related = updates.filter((update) => update.platform.slug === venue.slug);
  const suggested = profile.suggestedComparisons?.map((slug) => venues.find((candidate) => candidate.slug === slug)).filter(Boolean) ?? [];
  const similar = (suggested.length ? suggested : venues.filter((candidate) => candidate.slug !== venue.slug && candidate.category === venue.category)).slice(0, 4);

  const isZhLocale = locale && (locale.startsWith("zh") || locale === "zh-Hans" || locale === "zh-Hant" || locale === "zh-CN" || locale === "zh-TW");
  const telegramDetailUi = telegramLocaleUi[locale] || telegramLocaleUi[String(locale || "").split("-")[0]] || {};
  const localeBase = String(locale || "").toLowerCase() === "pt-br" ? "pt-BR" : String(locale || "").split("-")[0];
  const metricText = {
    ja: ["現物基準手数料", "準備金証明 (PoR)", "本人確認要件", "最大レバレッジ", "公開メルクルツリー", "多国の本人確認に対応", "公式商品条件を確認"],
    ko: ["현물 기준 수수료", "준비금 증명(PoR)", "KYC 요건", "최대 레버리지", "공개 Merkle Tree", "다국가 인증 지원", "공식 상품 조건 확인"],
    tr: ["Spot temel ücreti", "Rezerv Kanıtı (PoR)", "KYC gereksinimi", "Maksimum kaldıraç", "Herkese açık Merkle Tree", "Çoklu ülke doğrulaması", "Resmî ürün koşullarını kontrol edin"],
    es: ["Comisión base spot", "Prueba de reservas (PoR)", "Requisito de KYC", "Apalancamiento máximo", "Árbol de Merkle público", "Verificación internacional", "Consulta las condiciones oficiales"],
    fr: ["Frais spot de base", "Preuve de réserves (PoR)", "Exigence KYC", "Effet de levier maximal", "Arbre de Merkle public", "Vérification internationale", "Voir les conditions officielles"],
    de: ["Spot-Basisgebühr", "Proof of Reserves (PoR)", "KYC-Anforderung", "Maximaler Hebel", "Öffentlicher Merkle-Baum", "Internationale Verifizierung", "Offizielle Produktbedingungen prüfen"],
    ru: ["Базовая комиссия спот", "Подтверждение резервов (PoR)", "Требование KYC", "Максимальное плечо", "Публичное дерево Merkle", "Международная проверка", "Проверить официальные условия"],
    "pt-BR": ["Taxa base spot", "Prova de reservas (PoR)", "Requisito de KYC", "Alavancagem máxima", "Árvore Merkle pública", "Verificação internacional", "Confira as condições oficiais"],
    ar: ["رسوم التداول الفوري الأساسية", "إثبات الاحتياطيات (PoR)", "متطلبات KYC", "الرافعة القصوى", "شجرة Merkle العامة", "تحقق دولي", "راجع الشروط الرسمية"],
    id: ["Biaya dasar spot", "Bukti cadangan (PoR)", "Persyaratan KYC", "Leverage maksimum", "Pohon Merkle publik", "Verifikasi internasional", "Periksa ketentuan resmi"],
    vi: ["Phí spot cơ bản", "Bằng chứng dự trữ (PoR)", "Yêu cầu KYC", "Đòn bẩy tối đa", "Cây Merkle công khai", "Xác minh quốc tế", "Xem điều kiện chính thức"],
    it: ["Commissione base spot", "Prova delle riserve (PoR)", "Requisito KYC", "Leva massima", "Albero Merkle pubblico", "Verifica internazionale", "Controlla le condizioni ufficiali"],
  }[localeBase];
  const localizedVenueName = getLocalizedVenueName(venue, locale) || profile.name;
  const detailDecision = decisionForVenue(profile.slug, locale);
  const reviewedDecision = hasReviewedEditorialDecision(profile.slug) ? detailDecision : null;
  const venueHeroSummary = reviewedDecision
    ? reviewedDecisionHeroSummary(localizedVenueName, locale, reviewedDecision)
    : (research?.contentLocale === locale ? research.summary : profile.positioning);
  const venueCta = regionalVenueCta(venue.slug, locale, market, product, { accountStage, funding });
  const { db, partner, officialDomain, inviteCode, hasReferral, rebatePercent, benefitText, commercialClaim } = venueCta;
  // Owner 2026-10-10 (GSC: exchange pages earn impressions, no clicks): the H1 carries the search intent, under the same
  // referral-title policy as the <title> (referral-seo.js: ru, ar and zh-Hant stay neutral; tr only for SPK-listed
  // venues). The invite code is the data-bound one from the CTA, never typed here.
  const referralHeadlineCode = hasReferral && inviteCode && referralSeoFor(venue.slug, locale) ? inviteCode : null;
  const detailTitleStr = referralHeadlineCode
    ? text.detailReferralTitle(localizedVenueName, referralHeadlineCode, new Date().getUTCFullYear())
    : text.detailFeesTitle(localizedVenueName);
  const [titleBefore, titleAfter] = detailTitleStr.includes(localizedVenueName)
    ? detailTitleStr.split(localizedVenueName)
    : [detailTitleStr, ""];
  const titleSuffixGap = /^\s/.test(titleAfter) ? " " : "";
  const routeUi = dexFeeCompactUi(locale, localizedVenueName, false);
  const trustScore = db.trustScore && db.trustScoreSourceReviewedAt ? Number(db.trustScore) : null;
  const trustLabel = trustScore == null ? localePending(locale) : (trustScore >= 9.0 ? `AA+ ${trustScore}` : `AA ${trustScore}`);
  const trustColor = trustScore >= 9.0 ? "#10b981" : "#38bdf8";

  const reviewedSpotRate = publishableFeeRate(buildVenueFeeSummary(db, research || {}), "spot", locale);
  const spotFeeDisplay = reviewedSpotRate?.display || localePending(locale);
  const flowLabel = officialFlowLabel(locale);
  const kycSummary = db.kycCheckedAt
    ? (db.kycSummary?.[locale] || db.kycSummary?.[textLocaleKey(locale)] || flowLabel)
    : flowLabel;
  const porVerified = Boolean(db.porVerifiedAt && db.porAuditUrl);
  const porRatio = porVerified
    ? (db.reserveRatio || (isZhLocale ? "已公示储备覆盖率" : "Published reserve coverage"))
    : localePending(locale);
  const maxLev = db.maxLeverage && db.leverageCheckedAt ? (String(db.maxLeverage).endsWith("x") ? db.maxLeverage : `${db.maxLeverage}x`) : localePending(locale);
  const visibleBenefitText = benefitText || (hasReferral
    ? (isZhLocale ? zhText(locale, `按 ${venue.name} 当前合作条件享用户手续费权益`, `按 ${venue.name} 目前合作條件享用戶手續費權益`) : (detailLabels.benefit || `User fee benefit follows current ${venue.name} partner terms`))
    : routeUi.noCode);

  // Quick calculator calculation
  const takerRate = db.spotFee?.takerRate && db.feeCheckedAt ? db.spotFee.takerRate : null;
  const annualBaseFee = takerRate == null ? null : Math.round(tradeVolume * 12 * takerRate);
  const annualSavings = annualBaseFee == null || commercialClaim.status !== "verified" ? null : Math.round(annualBaseFee * (rebatePercent / 100));
  const contextSearch = directoryContextSearch({ market, product, locale, accountStage, funding });
  const directAnswerLinkContext = { market, product, accountStage, funding };
  const venueDirectAnswerInternalHref = (href) => {
    const target = new URL(String(href || "/"), "https://nexualpha.com");
    return appendDecisionPassportQuery(href, {
      ...directAnswerLinkContext,
      product: target.searchParams.get("product") || product,
      market: target.searchParams.get("market") || market,
    });
  };
  const priorityAnswer = priorityVenueAnswerFor(venue.slug, locale);
  const showUniswapShortChecklist = venue.slug === "uniswap"
    && priorityAnswer
    && Object.hasOwn(uniswapShortChecklistCopy, priorityAnswer.locale);
  const venueDirectAnswer = priorityAnswer || venueDirectAnswerFor(locale, venue.slug);
  const ownerQuestionTitle = priorityAnswer?.ownerQuestion || null;
  const decisionGroups = [venueDirectAnswer?.fit, venueDirectAnswer?.avoid, venueDirectAnswer?.nextSteps].filter((group) => group?.items?.length);
  const venueDirectAnswerDetails = venueDirectAnswer && <>
    {venueDirectAnswer.costFormula && (
      <p className="v3-venue-direct-answer__formula"><b>{venueDirectAnswer.costFormulaLabel}:</b> <code>{venueDirectAnswer.costFormula}</code></p>
    )}
    {venueDirectAnswer.queryOwner && (
      <p className="v3-venue-direct-answer__query-owner">
        <b>{venueDirectAnswer.queryOwner.label}:</b> {venueDirectAnswer.queryOwner.body}
      </p>
    )}
    <ul>{venueDirectAnswer.checks.map((check) => <li key={check}>{check}</li>)}</ul>
    {decisionGroups.length > 0 && (
      <div className="v3-venue-direct-answer__decision-grid">
        {decisionGroups.map((group) => (
          <section key={group.label} className="v3-venue-direct-answer__decision-group">
            <b>{group.label}</b>
            <ol>
              {group.items.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </section>
        ))}
      </div>
    )}
    {venueDirectAnswer.boundary && <small>{venueDirectAnswer.boundary}</small>}
  </>;
  const venueDirectAnswerCta = venueDirectAnswer?.registrationSlug
    ? regionalVenueCta(venueDirectAnswer.registrationSlug, locale, market, product, { accountStage, funding })
    : null;
  const heroTelegramFunnel = buildTelegramWebsiteFunnelContext({ intent: "monitor", venue: venue.slug, market, locale, product, campaign: "venue_hero_monitor" });
  const nonCexResearchActions = String(profile.category || venue.category || "").toUpperCase() === "CEX" ? [] : [
    similar[0] && {
      label: text.viewCompare,
      href: `/compare/${compareSlug([profile.slug, similar[0].slug])}?${contextSearch}`,
      kind: "research",
      placement: "dex-detail-compare",
      decision: compareSlug([profile.slug, similar[0].slug]),
    },
    {
      label: telegramDetailUi.monitor || (isZhLocale ? "在 Telegram 继续研究 ↗" : "Continue research in Telegram ↗"),
      href: getTelegramDeepLink({ action: "verify_domain", venue: venue.slug, market, locale, product }),
      kind: "telegram",
      placement: "dex-detail-telegram",
      decision: `telegram_${venue.slug}`,
      external: true,
    },
  ].filter(Boolean);

  const handleCopyCode = () => codeFeedback.copy(inviteCode || officialDomain);
  const handleStickyCopy = () => { handleCopyCode(); if (inviteCode) trackCodeCopy(venue.slug, "venue-mobile-sticky-code"); };
  // The sticky bar opens the same protected partner route as the registration card's primary button (same decision
  // state, same href). Where the card itself would not open a third-party route, the bar keeps the review link.
  const stickyDecision = buildRegistrationDecisionState({ publicCta: publicCtaForVenue(venue.slug, locale), regionalCta: venueCta });
  const stickyOpensSignup = stickyDecision.canOpenThirdParty && stickyDecision.protectedHref === venueCta.ctaHref;
  const ctaText = ctaUiCopy(locale);
  const profileChapters = profileResearchChapterCopy[textLocaleKey(locale)] || profileResearchChapterCopy.en;

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const anchor = document.querySelector('[data-cta-surface="venue-profile-main-registration"]');
    const mediaQuery = typeof window.matchMedia === "function" ? window.matchMedia("(max-width: 780px)") : null;
    const footer = document.querySelector("footer.nx-ftr, footer");
    const updateMobileSticky = () => {
      // Never sit on top of the footer (disclosure, copyright): the bar steps away once the footer enters the viewport.
      const footerVisible = Boolean(footer) && footer.getBoundingClientRect().top < window.innerHeight;
      const isMobileViewport = (mediaQuery ? mediaQuery.matches : window.innerWidth <= 780) && !footerVisible;
      setMobileStickyActive(shouldShowMobileSticky(anchor?.getBoundingClientRect(), isMobileViewport));
    };
    updateMobileSticky();
    window.addEventListener("scroll", updateMobileSticky, { passive: true });
    window.addEventListener("resize", updateMobileSticky);
    mediaQuery?.addEventListener?.("change", updateMobileSticky);
    return () => {
      window.removeEventListener("scroll", updateMobileSticky);
      window.removeEventListener("resize", updateMobileSticky);
      mediaQuery?.removeEventListener?.("change", updateMobileSticky);
    };
  }, []);

  const mobileStickyIdentityLabel = hasReferral
    ? (locale === "zh-Hant" ? "專屬邀請碼" : isZhLocale ? "专属邀请码" : (detailLabels.codeShort || "Code"))
    : (locale === "zh-Hant" ? "官方主網域" : isZhLocale ? "官方主域名" : runtimeUi.stickyOfficial);
  const mobileStickyIdentityAction = hasReferral
    ? (copyFeedbackLabel(codeFeedback.state, locale, isZhLocale ? zhText(locale, "复制", "複製") : (detailLabels.copy || "Copy")))
    : copyFeedbackLabel(codeFeedback.state, locale, locale === "zh-Hant" ? "核對" : isZhLocale ? "核对" : runtimeUi.globalVerification);
  const registrationReviewLabel = venueCta.direct
    ? detailRegistrationReviewLabel(locale, { hasReferral })
    : (locale === "zh-Hant" ? "先核對地區資格" : isZhLocale ? "先核对地区资格" : detailCtaLabel(locale, { direct: false, hasReferral }));
  const quickRegistration = (
    <div className="v3-venue-quick-registration">
      <div className="v3-venue-quick-registration__body">
        <span className="v3-venue-quick-registration__label">
          {hasReferral
            ? (locale === "zh-Hant" ? "專屬邀請碼" : isZhLocale ? "专属邀请码" : (detailLabels.code || "Referral Code"))
            : (locale === "zh-Hant" ? "官方入口" : isZhLocale ? "官方入口" : runtimeUi.stickyOfficial)}
        </span>
        {inviteCode ? (
          <button
            type="button"
            className="v3-venue-quick-registration__code"
            onClick={handleCopyCode}
            data-copied={copied}
          >
            <strong translate="no">{inviteCode}</strong>
            <span>{copyFeedbackLabel(codeFeedback.state, locale, isZhLocale ? "复制" : (detailLabels.copy || "Copy"))}</span>
          </button>
        ) : (
          <strong className="v3-venue-quick-registration__domain" translate="no">{officialDomain}</strong>
        )}
        <CopyFeedbackStatus state={codeFeedback.state} locale={locale} />
        <small>{visibleBenefitText}</small>
      </div>
      <LocalLink
        locale={locale}
        href={`/exchanges/${profile.slug}?${contextSearch}#registration-path`}
        className="v3-venue-quick-registration__cta"
        data-cta-kind="research"
        data-cta-platform={profile.slug}
        data-cta-placement="venue-hero-quick-registration"
        data-growth-decision="registration_card_review"
        data-growth-placement="venue-hero-quick-registration"
        data-growth-market={market}
        data-growth-product={product}
        data-registration-confirmation-entry="registration-card"
      >
        {registrationReviewLabel}
      </LocalLink>
    </div>
  );

  return <main className="v6 v2-page v3-page v3-profile-page v5 v5-detail" id="top" {...sectionEyebrowAttrs(locale, "exchanges")}>
    <section className="v3-page-hero v2-shell">
      <TelegramReturnBanner
        expectedKind="venue"
        expectedId={profile.slug}
        objectLabel={localizedVenueName}
        locale={locale}
        market={market}
        product={product}
        accountStage={accountStage}
        funding={funding}
        continueHash="#registration-checklist"
      />
      <LocalLink locale={locale} href={`/exchanges?${contextSearch}`} className="v3-back-link">
        ← {isZhLocale ? zhText(locale, "返回交易所黄页目录", "返回交易所黃頁目錄") : text.backToDirectory}
      </LocalLink>

      <div className="v3-venue-hero">
        <div className="v3-venue-identity enter" style={{ "--i": 0 }}>
          <BrandMark slug={profile.slug} priority />
          <div className="v3-venue-identity__info">
            <div className="v3-venue-identity__badges">
              <span className={`v3-category-chip v3-category-chip--${String(profile.category || "").toLowerCase().replace(/\s+/g, "-")}`}>
                {profile.category}
              </span>
              {trustScore == null ? (
                <span className={`v3-trust-metal-badge${feesCheckedLabel(venue.slug, locale) ? " v3-trust-metal-badge--checked" : " v3-trust-metal-badge--unchecked"}`}>
                  {feesStatusLabel(venue.slug, locale)}
                </span>
              ) : (
                <span className="v3-trust-metal-badge" style={{ borderColor: trustColor }}>
                  ★ {trustLabel}
                </span>
              )}
              <span className="v3-domain-pill" translate="no">
                <svg className="d5-lock" aria-hidden="true" focusable="false" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> {officialDomain}
              </span>
            </div>
            <h1 lang={priorityAnswer?.locale || undefined}>
              {ownerQuestionTitle ? (
                ownerQuestionTitle
              ) : (
                <>{titleBefore}{detailTitleStr.includes(localizedVenueName) && <bdi translate="no" lang={isZhLocale ? "zh-Hans" : "en"}>{localizedVenueName}</bdi>}{titleAfter && <>{titleSuffixGap}<span className="v3-venue-title__suffix">{titleAfter.trim()}</span></>}</>
              )}
            </h1>
          </div>
        </div>

        <div className="v3-profile-reading-layout">
        <div className="v3-profile-action-column">
        <div className="v3-profile-main-registration enter" style={{ "--i": 2 }} data-cta-surface="venue-profile-main-registration">
        <article className="v3-detail-grid__handoff">
          <OutboundHandoff compact locale={locale} venueSlug={profile.slug} fallbackDomain={profile.officialDomain} market={market} product={product} accountStage={accountStage} funding={funding} />
        </article>
        <TelegramAlertsStrip locale={locale} placement="venue-telegram-alerts" className="tg-signal-strip--venue" />
        </div>

        </div>
        <div className="v3-profile-reading-overview">
        {!priorityAnswer && !venueDirectAnswer && <div className="v3-venue-context">
          <p className="v3-venue-summary" lang={reviewedDecision?.contentLocale ?? locale} dir={reviewedDecision ? textDirectionForLocale(reviewedDecision.contentLocale) : undefined}>{venueHeroSummary}</p>
        </div>}



        <VenueFeeLedger slug={profile.slug} locale={locale} />
        <VenueRoute domain={officialDomain} code={hasReferral ? inviteCode : null} locale={locale} />

        {venueDirectAnswer && (
          <div className="v3-venue-direct-answer" role="region" aria-label={priorityAnswer?.title || `${profile.name} direct answer`} data-priority-answer={priorityAnswer ? venue.slug : undefined} lang={priorityAnswer?.locale || locale}>
            {!(priorityAnswer && ownerQuestionTitle === venueDirectAnswer.title) && <h2 className="v3-venue-direct-answer__title">{venueDirectAnswer.title}</h2>}
            {venueDirectAnswer.reviewedAt && (
              <time className="v3-venue-direct-answer__reviewed" dateTime={isoDay(venueDirectAnswer.reviewedAt)}>{isoDates(venueDirectAnswer.reviewedLabel)}</time>
            )}
            <p>{venueDirectAnswer.body}</p>
            {priorityAnswer && <details className="v3-venue-direct-answer__sources">
              <summary>{locale === "zh-Hant" ? "費用、使用條件與官方資料" : isZhLocale ? "费用、使用条件与官方资料" : ({"es": "Costes, condiciones y fuentes oficiales", "pt-BR": "Custos, condições e fontes oficiais", "fr": "Frais, conditions et sources officielles", "de": "Kosten, Bedingungen und offizielle Quellen", "ja": "費用・条件・公式ソース", "ko": "비용, 조건, 공식 출처", "tr": "Maliyetler, koşullar ve resmî kaynaklar", "ru": "Расходы, условия и официальные источники", "ar": "التكاليف والشروط والمصادر الرسمية", "id": "Biaya, ketentuan, dan sumber resmi", "vi": "Chi phí, điều kiện và nguồn chính thức", "it": "Costi, condizioni e fonti ufficiali"}[locale] || "Costs, conditions and official sources")}</summary>
              <div className="v3-venue-direct-answer__expanded">
              {venueDirectAnswerDetails}
              <div className="v3-venue-direct-answer__links">
                {priorityAnswer.sources.map(([label, href]) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer" data-cta-kind="source" data-cta-placement="venue-direct-answer-source"><span {...(/^[\x20-\x7e]+$/.test(label) ? { translate: "no", lang: "en" } : {})}>{label}</span> ↗</a>
                ))}
                {priorityAnswer.internalLinks?.slice(1).map(([label, href]) => (
                  <LocalLink key={href} locale={locale} href={venueDirectAnswerInternalHref(href)} data-cta-kind="research" data-cta-placement="venue-direct-answer-internal">{label}</LocalLink>
                ))}
              </div>
              </div>
            </details>}
            {(venueDirectAnswer.sources?.length || venueDirectAnswer.internalLinks?.length) && (
              <div className="v3-venue-direct-answer__links">
                {!priorityAnswer && venueDirectAnswer.sources?.map(([label, href]) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer" data-cta-kind="source" data-cta-placement="venue-direct-answer-source"><span {...(/^[\x20-\x7e]+$/.test(label) ? { translate: "no", lang: "en" } : {})}>{label}</span> ↗</a>
                ))}
                {(priorityAnswer ? venueDirectAnswer.internalLinks?.slice(0, 1) : venueDirectAnswer.internalLinks)?.map(([label, href]) => (
                  <LocalLink key={href} locale={locale} href={venueDirectAnswerInternalHref(href)} data-cta-kind="research" data-cta-placement="venue-direct-answer-internal">{label}</LocalLink>
                ))}
                {venueDirectAnswerCta && (
                  <a
                    href={venueDirectAnswerCta.ctaHref}
                    target={venueDirectAnswerCta.direct ? "_blank" : undefined}
                    rel={venueDirectAnswerCta.direct ? "sponsored noopener noreferrer" : undefined}
                    data-cta-kind={venueDirectAnswerCta.direct ? "registration" : "research"}
                    data-cta-platform={venueDirectAnswer.registrationSlug}
                    data-cta-placement="venue-direct-answer-protected-cta"
                    data-growth-decision={venueDirectAnswer.registrationSlug}
                    data-growth-placement="venue-direct-answer-protected-cta"
                  >
                    {venueDirectAnswerCta.direct ? detailCtaLabel(locale, { direct: true, hasReferral: venueDirectAnswerCta.hasReferral }) : detailCtaLabel(locale, { direct: false, hasReferral: venueDirectAnswerCta.hasReferral })}
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {showUniswapShortChecklist && (
          <UniswapShortVerificationChecklist
            locale={priorityAnswer.locale}
            priorityAnswer={priorityAnswer}
            resolveInternalHref={venueDirectAnswerInternalHref}
          />
        )}

        {venue.slug === "hyperliquid" && ["en", "zh-Hans", "zh-Hant"].includes(locale) && <HyperliquidFeeScenario locale={locale} market={market} />}

        {!priorityAnswer && (
          <section className="v3-profile-decision-context" data-profile-task="context">
            <h2>{ui.profileSignal}</h2>
            <VenueDecisionStrip text={text} profile={profile} decision={reviewedDecision} locale={locale} />
          </section>
        )}


        <VenueReadinessChecklist
          venueSlug={profile.slug}
          locale={locale}
          market={market}
          product={product}
        />

        <div className="v3-profile-primary-actions v3-profile-actions-row" data-profile-task="primary">
          {similar[0] && <LocalLink locale={locale} href={`/compare/${compareSlug([profile.slug, similar[0].slug])}?${contextSearch}`} className="button-quiet">{text.viewCompare}</LocalLink>}
          <LocalLink locale={locale} href={`/exchanges/${profile.slug}?${contextSearch}#registration-checklist`} className="button-quiet v3-profile-registration-review-link">{text.registrationPrepCta}</LocalLink>
        </div>
        <p className="v3-relationship-note">{text.relationship}</p>

        </div>

        </div>
      </div>

    </section>

    <ExchangeFactsV5 slug={profile.slug} locale={locale} profile={profile} />

    {/* One "Sources" disclosure: account and costs, sources and security, and follow-up were three stacked disclosures. */}
    <section className="v2-section v3-profile-research-hub">
      <details className="v3-profile-sources-group">
        <summary className="v3-profile-sources-group__summary">
          <strong>{profileChapters[1]}</strong>
          <span>{profileChapters[0]} · {profileChapters[2]}</span>
          <b aria-hidden="true">＋</b>
        </summary>
        <div className="v3-profile-sources-group__body">
      {!priorityAnswer && venueDirectAnswer && (
        <section className="v3-profile-research-chapter v3-profile-answer-conditions" data-profile-task="conditions">
          <h3 className="v3-profile-sources-group__heading">{campaignCopy(locale).conditions || text.verifyBefore}</h3>
          {venueDirectAnswerDetails}
        </section>
      )}
      <section className="v3-profile-research-chapter" data-research-task="account">
        <h3 className="v3-profile-sources-group__heading">{profileChapters[0]}</h3>
        <div className="v3-profile-research-chapter__body">
        <div className="v3-profile-account-block v3-venue-invitation-disclosure">
          <div className="v3-registration-notes__body">
            <h3 className="v3-profile-account-section__heading">{invitationSummary.label}</h3>
            <p className="v3-profile-account-section__hint">{invitationSummary.note}</p>
            {quickRegistration}
            <div className="v3-venue-rebate-card">
              <div className="v3-venue-rebate-card__left">
                <span className="v3-rebate-tag">{detailLabels.review}</span>
                <h2 className="v3-rebate-title">{visibleBenefitText}</h2>
                {inviteCode ? (
                  <div className="v3-rebate-code-row">
                    <span className="v3-rebate-code-label">{locale === "zh-Hant" ? "合作邀請碼" : isZhLocale ? "合作邀请码" : (detailLabels.code || "Referral Code")}:</span>
                    <button type="button" onClick={handleCopyCode} className="v3-rebate-code-btn">
                      <strong translate="no">{inviteCode}</strong>
                      <span className="v3-copy-tip">{copyFeedbackLabel(codeFeedback.state, locale, isZhLocale ? zhText(locale, "点击复制", "點擊複製") : (detailLabels.copy || "Copy"))}</span>
                    </button>
                  </div>
                ) : (
                  <p className="v3-rebate-no-code">{routeUi.noCode}</p>
                )}
              </div>
              <div className="v3-venue-rebate-card__right" aria-label={invitationSummary.label}>
                <div className="v3-rebate-route-summary">
                  <span>{isZhLocale ? zhText(locale, "下一步", "下一步") : runtimeUi.preRegister}</span>
                  <strong>{venueCta.direct ? (isZhLocale ? zhText(locale, "使用上方官方入口继续", "使用上方官方入口繼續") : runtimeUi.stickyDirectRoute) : (isZhLocale ? zhText(locale, "先核对地区资格", "先核對地區資格") : runtimeUi.globalVerification)}</strong>
                </div>
              </div>
            </div>
        <section className="v3-profile-account-section v3-profile-account-cost">
          <header>
            <h3 className="v3-profile-account-section__heading">{isZhLocale ? zhText(locale, "费率、条件与费用测算", "費率、條件與費用測算") : detailLabels.review}</h3>
            <p className="v3-profile-account-section__hint">{isZhLocale ? zhText(locale, "集中查看费率、储备金、KYC、杠杆与年度费用", "集中查看費率、儲備金、KYC、槓桿與年度費用") : runtimeUi.calculatorOpen}</p>
          </header>
          <div className="v3-profile-cost-conditions__body">
            <div className="v3-venue-metrics-grid">
              <div className="v3-metric-tile">
                <span className="v3-metric-tile__label">{isZhLocale ? zhText(locale, "现货基准费率", "現貨基準費率") : (metricText?.[0] || "Spot Base Fee")}</span>
                <strong className="v3-metric-tile__val text-blue" translate="no">{spotFeeDisplay}</strong>
                <span className="v3-metric-tile__sub">{reviewedSpotRate ? reviewedSpotRate.conditions : matrixCopy(locale).maker}</span>
              </div>
              <div className="v3-metric-tile">
                <span className="v3-metric-tile__label">{isZhLocale ? zhText(locale, "资产储备证明 (PoR)", "資產儲備證明 (PoR)") : (metricText?.[1] || "Proof of Reserves")}</span>
                <strong className={`v3-metric-tile__val${porVerified ? " text-green" : ""}`} translate="no">{porVerified ? porRatio : (isZhLocale ? zhText(locale, "待官方核验", "待官方核驗") : runtimeUi.pendingVerification)}</strong>
                <span className="v3-metric-tile__sub">{porVerified ? (db.auditFirm || (isZhLocale ? zhText(locale, "公开链上默克尔树", "公開鏈上默克爾樹") : metricText?.[4] || "Public Merkle Tree")) : (isZhLocale ? zhText(locale, "未记录可复核来源", "未記錄可複核來源") : runtimeUi.noSource)}</span>
              </div>
              <div className="v3-metric-tile">
                <span className="v3-metric-tile__label">{isZhLocale ? zhText(locale, "身份验证要求", "身分驗證要求") : (metricText?.[2] || "KYC Requirement")}</span>
                <strong className="v3-metric-tile__val text-purple">{kycSummary}</strong>
                <span className="v3-metric-tile__sub">{isZhLocale ? zhText(locale, "支持多国认证", "支援多國認證") : runtimeUi.globalVerification}</span>
              </div>
              <div className="v3-metric-tile">
                <span className="v3-metric-tile__label">{isZhLocale ? "最大合约杠杆" : (metricText?.[3] || "Max Leverage")}</span>
                <strong className="v3-metric-tile__val text-gold" translate="no">{maxLev}</strong>
                <span className="v3-metric-tile__sub">{isZhLocale ? "以官方产品条款为准" : runtimeUi.productTerms}</span>
              </div>
            </div>

          {/* In-page Interactive Fee Savings Calculator */}
          <div className="v3-detail-calculator">
            <div className="v3-detail-calc__head">
              <h4>{isZhLocale ? `在 ${localizedVenueName} 交易一年能省多少钱？` : runtimeUi.calculatorTitle(localizedVenueName)}</h4>
              <span className="v3-detail-calc__current-vol" translate="no">
                {isZhLocale ? "预估月交易量: " : runtimeUi.monthlyVolume}<strong>${(tradeVolume / 1000).toFixed(0)}K / mo</strong>
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="500000"
              step="5000"
              value={tradeVolume}
              onChange={(e) => setTradeVolume(Number(e.target.value))}
              className="v3-detail-calc__slider"
              aria-label={isZhLocale ? "月交易量滑块" : runtimeUi.volumeSlider}
            />
            <div className="v3-detail-calc__result">
              <span>{annualSavings != null ? (isZhLocale ? `使用 ${inviteCode} 专属码开户，每年可额外节省约` : runtimeUi.calculatorBenefit(inviteCode)) : (isZhLocale ? "费率或用户权益尚未完成来源核验，最终条件以平台官方账户显示为准" : runtimeUi.calculatorPending)}</span>
              <strong className="text-green" translate="no">{annualSavings == null ? "N/A" : `+${annualSavings} USDT`}</strong>
            </div>
          </div>
          <VenueTieredFeeMatrix
            venue={venue}
            locale={locale}
            db={db}
            rebatePercent={rebatePercent}
            claimsVerified={commercialClaim.status === "verified"}
            inviteCode={inviteCode}
            registrationUrl={venueCta.ctaHref}
            registrationDirect={venueCta.direct}
            localizedVenueName={localizedVenueName}
            researchActions={nonCexResearchActions}
          />
          </div>
        </section>

    <section className="v2-section v3-detail-grid v3-profile-decision" id="registration-checklist">
      <section className="v3-profile-account-section v3-profile-account-decision">
      <header>
          <h3 className="v3-profile-account-section__heading">{isZhLocale ? zhText(locale, "展开完整注册前决策说明", "展開完整註冊前決策說明") : (detailLabels.preRegister || runtimeUi.preRegister)}</h3>
          <p className="v3-profile-account-section__hint">{isZhLocale ? zhText(locale, "适配人群、限制和 KYC / 入金检查集中在这里", "適配人群、限制和 KYC / 入金檢查集中在這裡") : (detailLabels.preRegisterHint || runtimeUi.preRegisterHint)}</p>
        </header>
        <div className="v3-registration-notes__body">
          <VenueDecisionArticles slug={profile.slug} locale={locale} text={text} />
          <EditorialList title={text.detailPreKycFunding} items={profile.checks} fallback={profile.limitations.slice(0, 3)} />
        </div>
      </section>

    </section>

          </div>
        </div>

        </div>
      </section>
      <section className="v3-profile-research-chapter" data-research-task="sources">
        <h3 className="v3-profile-sources-group__heading">{profileChapters[1]}</h3>
        <div className="v3-profile-research-chapter__body">
    <div className="v3-profile-evidence-block">
      <div className="v3-profile-evidence-block__body">
        <VenueProofOfReserves
          venue={venue}
          locale={locale}
          db={db}
          officialDomain={officialDomain}
          localizedVenueName={localizedVenueName}
        />
        <VenueAntiPhishingSecurity
          venue={venue}
          locale={locale}
          db={db}
          partner={partner}
          officialDomain={officialDomain}
          localizedVenueName={localizedVenueName}
        />
        <ResearchPanel slug={profile.slug} locale={locale} />
        <OfficialResearchTeaser locale={locale} venue={venue} market={market} product={product} />
      </div>
    </div>

        </div>
      </section>
      <section className="v3-profile-research-chapter" data-research-task="follow-up">
        <h3 className="v3-profile-sources-group__heading">{profileChapters[2]}</h3>
        <div className="v3-profile-research-chapter__body">
        <div className="v3-profile-secondary-research" data-profile-task="telegram">
          <div className="v3-profile-secondary-research__body">
        <OnsiteTelegramBotHandoff
          canonicalPath={`/exchanges/${profile.slug}`}
          locale={locale}
          market={market}
          product={product}
          placement={`venue-onsite-bot-handoff-${profile.slug}`}
        />
          <a
            href={heroTelegramFunnel.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="v3-hero-tg-btn"
            title={isZhLocale ? zhText(locale, "在 Telegram 中监控此交易所费率与返佣", "在 Telegram 中監控此交易所費率與返傭") : (telegramDetailUi.monitor || "Monitor venue on Telegram")}
            data-cta-kind="telegram"
            data-cta-placement="venue-hero-telegram"
            data-growth-decision={`monitor_${venue.slug}`}
            data-growth-placement="venue-hero"
            data-growth-market={market}
            data-growth-product={product}
            data-telegram-start={heroTelegramFunnel.startPayload}
            data-telegram-return-href={heroTelegramFunnel.returnHref}
          >
            <span className="v3-tg-icon-mini">✈</span>
            <span>{isZhLocale ? zhText(locale, "在 Telegram 监控此交易所 ↗", "在 Telegram 監控此交易所 ↗") : (telegramDetailUi.monitor || "Monitor on Telegram ↗")}</span>
          </a>
        <VenueTelegramMonitorSection
          venue={venue}
          locale={locale}
          market={market}
          product={product}
          rebatePercent={rebatePercent}
          localizedVenueName={localizedVenueName}
          claimsVerified={commercialClaim.status === "verified"}
        />
          </div>
        </div>
        </div>
      </section>
        </div>
      </details>
    </section>

    {/* 针对 SEO 关键词的 FAQ 折叠/展开模块 */}
    <VenueFaqSection venue={venue} profile={profile} locale={locale} db={db} partner={partner} />

    <section className={`v2-section v3-activity-panel${related.length ? "" : " v3-activity-panel--empty"}`}>
      <div className="section-lead"><h2>{text.reviewedActivity}</h2>{related.length > 0 && <span>{text.verifiedOnly}</span>}</div>
      {/* empty state: one line and one link (no disclosure dressed as a button) */}
      {related.length ? <ActivityCards copy={copy} text={text} locale={locale} updates={related} /> : <p className="v3-activity-empty v3-activity-empty--line" role="status">{String(text.activityEmpty || "").split(/(?<=[.。])\s*/)[0]} <LocalLink locale={locale} href={`/activities/research/${profile.slug}`}>{campaignCopy(locale).openResearch}</LocalLink></p>}
      {related.length > 0 && <div className="v3-activity-panel__actions"><LocalLink locale={locale} href="/activities">{text.openActivities}</LocalLink><LocalLink locale={locale} href={`/activities/research/${profile.slug}`}>{campaignCopy(locale).openResearch}</LocalLink><details className="research-references"><summary>{text.openOfficialSource}</summary><SourceList text={text} profile={profile} /></details></div>}
    </section>

    <section className="v2-section v3-similar v3-similar-section" aria-labelledby={`similar-${profile.slug}`}>
      <div className="section-lead v3-similar-section__lead"><h2 id={`similar-${profile.slug}`}>{text.similar}</h2></div>
      <ul className="v3-alternative-list" data-collapsed={!showAllSimilar && similar.length > 2 ? "true" : undefined}>{similar.map((candidate) => {
        const alternative = venueProfile(candidate, locale);
        const candidateResearch = researchForVenue(candidate.slug, locale);
        return <li key={candidate.slug}>
          <LocalLink locale={locale} href={`/exchanges/${candidate.slug}?${contextSearch}`} className="v3-alternative__identity"><BrandMark slug={candidate.slug} compact /><b translate="no" lang="en" dir="ltr">{candidate.name}</b><small translate="no" lang="en" dir="ltr">{candidate.category}</small></LocalLink>
          <p className="v3-alternative__summary">{candidateResearch?.contentLocale === locale ? candidateResearch.summary : alternative.positioning}</p>
          <div className="v3-alternative__actions"><LocalLink locale={locale} href={`/exchanges/${candidate.slug}?${contextSearch}`}>{text.openDetail}</LocalLink><LocalLink locale={locale} href={`/compare/${compareSlug([profile.slug, candidate.slug])}?${contextSearch}`}>{text.viewCompare}</LocalLink></div>
        </li>;
      })}</ul>
      {similar.length > 2 && (
        <button
          type="button"
          className="v3-alternative-list__expand"
          aria-expanded={showAllSimilar}
          onClick={() => setShowAllSimilar((value) => !value)}
        >
          {showAllSimilar
            ? (isZhLocale ? zhText(locale, "收起同类平台", "收起同類平台") : runtimeUi.showFewer)
            : (isZhLocale ? zhText(locale, `展开其余 ${similar.length - 2} 个同类平台`, `展開其餘 ${similar.length - 2} 個同類平台`) : runtimeUi.showMore(similar.length - 2))}
          <span aria-hidden="true">{showAllSimilar ? " ↑" : " ↓"}</span>
        </button>
      )}
    </section>

    {/* 移动端专属吸底快捷操作条 */}
    <aside className={`v3-mobile-sticky-bar${mobileStickyActive ? " is-active" : ""}`} aria-label={isZhLocale ? "快捷操作" : runtimeUi.stickyQuickAction} aria-hidden={!mobileStickyActive} inert={!mobileStickyActive}>
      <div className="v3-mobile-sticky-bar__inner">
        <button type="button" onClick={handleStickyCopy} className="v3-mobile-sticky-bar__code" data-copied={codeFeedback.state === "success" || undefined}>
          <span className="v3-mobile-sticky-bar__label">{mobileStickyIdentityLabel}</span>
          <strong translate="no">{inviteCode || officialDomain}</strong>
          <small>{mobileStickyIdentityAction}</small>
          {codeFeedback.state !== "idle" && <CopyFeedbackStatus state={codeFeedback.state} locale={locale} />}
        </button>
        <div className="v3-mobile-sticky-bar__perk">
          <span className="v3-mobile-sticky-bar__discount">{commercialClaim.status === "verified" ? `-${formatPercent(locale, rebatePercent)}` : runtimeUi.stickyOfficial}</span>
          <span>{hasReferral ? (isZhLocale ? zhText(locale, "手续费权益", "手續費權益") : runtimeUi.stickyFeeBenefit) : (isZhLocale ? zhText(locale, "官方入口", "官方入口") : runtimeUi.stickyDirectRoute)}</span>
        </div>
        {stickyOpensSignup ? (
          <a
            href={venueCta.ctaHref}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="v3-mobile-sticky-bar__btn v3-mobile-sticky-bar__btn--signup"
            tabIndex={mobileStickyActive ? undefined : -1}
            data-cta-kind="registration"
            data-cta-platform={profile.slug}
            data-cta-placement="venue-mobile-sticky"
            data-cta-code={hasReferral && inviteCode ? inviteCode : undefined}
            data-growth-decision={profile.slug}
            data-growth-placement="venue-mobile-sticky"
            data-growth-market={market}
            data-growth-product={product}
          >
            {ctaText.open} <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <LocalLink
            locale={locale}
            href={`/exchanges/${profile.slug}?${contextSearch}#registration-path`}
            className="v3-mobile-sticky-bar__btn"
            data-cta-kind="research"
            data-cta-platform={profile.slug}
            data-cta-placement="venue-mobile-sticky"
            data-registration-confirmation-entry="registration-card"
          >
            {registrationReviewLabel}
          </LocalLink>
        )}
        <LocalLink
          locale={locale}
          href="/methodology#disclosure"
          className="v3-mobile-sticky-bar__disclosure"
          tabIndex={mobileStickyActive ? undefined : -1}
          data-disclosure-placement="venue-mobile-sticky"
        >
          {footerDisclosureLabel(locale)}
        </LocalLink>
      </div>
    </aside>
  </main>;
}

// ============================================================================
// Top 8 黄金交易量对决矩阵元数据 (Top 8 Golden Volume Comparison Duels)
// ============================================================================
export const GOLDEN_COMPARE_PAIRS = [
  {
    slug: "binance-vs-okx",
    left: "binance",
    right: "okx",
    badge: "TOP 1",
    title: { "zh-Hans": "全球双雄", "zh-Hant": "全球雙雄", en: "Global Titans" },
    tagline: { "zh-Hans": "现货流动性霸主 vs Web3钱包链上王者", "zh-Hant": "現貨流動性霸主 vs Web3錢包鏈上王者", en: "Liquidity Giant vs Web3 Ecosystem King" },
  },
  {
    slug: "binance-vs-bybit",
    left: "binance",
    right: "bybit",
    badge: "HOT",
    title: { "zh-Hans": "现货王 vs 合约王", "zh-Hant": "現貨王 vs 合約王", en: "Spot King vs Derivatives Giant" },
    tagline: { "zh-Hans": "全球最深买卖盘 vs 极速撮合高倍永续", "zh-Hant": "全球最深買賣盤 vs 極速撮合高倍永續", en: "Unmatched Order Book vs High-Speed Perp Engine" },
  },
  {
    slug: "okx-vs-bybit",
    left: "okx",
    right: "bybit",
    badge: "TREND",
    title: { "zh-Hans": "Web3钱包生态 vs 衍生品极速", "zh-Hant": "Web3錢包生態 vs 衍生品極速", en: "Web3 Ecosystem vs Fast Derivatives" },
    tagline: { "zh-Hans": "一键跨链DEX交互 vs 资深合约操盘与跟单", "zh-Hant": "一鍵跨鏈DEX交互 vs 資深合約操盤與跟單", en: "Seamless On-chain DeFi vs Pro Trading & Copying" },
  },
  {
    slug: "binance-vs-mexc",
    left: "binance",
    right: "mexc",
    badge: "ALPHA",
    title: { "zh-Hans": "主流流动性 vs 暴涨新币百倍币", "zh-Hant": "主流流動性 vs 暴漲新幣百倍幣", en: "Mainstream Liquidity vs 100x Moonshots" },
    tagline: { "zh-Hans": "主流亿级大单低滑点 vs 首发Meme与早期Alpha", "zh-Hant": "主流億級大單低滑點 vs 首發Meme與早期Alpha", en: "Low Slippage Giants vs Fast Altcoin Launches" },
  },
  {
    slug: "okx-vs-mexc",
    left: "okx",
    right: "mexc",
    badge: "FEES",
    title: { "zh-Hans": "老牌合规 vs 零手续费挂单特权", "zh-Hant": "老牌合規 vs 零手續費掛單特權", en: "Established Compliance vs 0% Maker Fees" },
    tagline: { "zh-Hans": "顶级储备金安全 vs 长期0挂单费极速开户", "zh-Hant": "頂級儲備金安全 vs 長期0掛單費極速開戶", en: "100%+ PoR Solvency vs Zero Fee Maker Advantage" },
  },
  {
    slug: "bybit-vs-bitget",
    left: "bybit",
    right: "bitget",
    badge: "COPY",
    title: { "zh-Hans": "跟单顶流巅峰对决", "zh-Hant": "跟單頂流巔峰對決", en: "Top Copy Trading Showdown" },
    tagline: { "zh-Hans": "专业机构级带单 vs 散户一键跟单与丰厚活动", "zh-Hant": "專業機構級帶單 vs 散戶一鍵跟單與豐厚活動", en: "Institutional Pro Traders vs Retail 1-Click Copy" },
  },
  {
    slug: "binance-vs-kraken",
    left: "binance",
    right: "kraken",
    badge: "SECURITY",
    title: { "zh-Hans": "全球流动性 vs 欧美合规出金安全", "zh-Hant": "全球流動性 vs 歐美合規出金安全", en: "Global Depth vs Western Security & Fiat" },
    tagline: { "zh-Hans": "全币种全生态覆盖 vs 13年零安全事故法币出入金", "zh-Hant": "全幣種全生態覆蓋 vs 13年零安全事故法幣出入金", en: "Full Crypto Suite vs 13-Year Zero Hack Benchmark" },
  },
  {
    slug: "gate-io-vs-mexc",
    left: "gate-io",
    right: "mexc",
    badge: "GEMS",
    title: { "zh-Hans": "全币种交易所双雄", "zh-Hant": "全幣種交易所雙雄", en: "Altcoin Kings Showdown" },
    tagline: { "zh-Hans": "1800+币种Startup打新 vs 极速上币与0挂单费", "zh-Hant": "1800+幣種Startup打新 vs 極速上幣與0掛單費", en: "1800+ Listed Pairs vs Zero Maker Altcoin Haven" },
  },
  // 2026-10-10 market plan: the most-searched pairs that had no indexable page.
  {
    slug: "binance-vs-bitget",
    left: "binance",
    right: "bitget",
    badge: "DEPTH",
    title: { "zh-Hans": "全球深度 vs 一键跟单", "zh-Hant": "全球深度 vs 一鍵跟單", en: "Global Depth vs One-Click Copy" },
    tagline: { "zh-Hans": "最深盘口与法币通道 vs 跟单交易与保护基金", "zh-Hant": "最深盤口與法幣通道 vs 跟單交易與保護基金", en: "Deepest Books & Fiat Rails vs Copy Trading & Protection Fund" },
  },
  {
    slug: "bitget-vs-okx",
    left: "bitget",
    right: "okx",
    badge: "ROUTE",
    title: { "zh-Hans": "跟单为先 vs 交易所加 Web3 钱包", "zh-Hant": "跟單為先 vs 交易所加 Web3 錢包", en: "Copy-First vs Exchange + Web3 Wallet" },
    tagline: { "zh-Hans": "跟单与合约 vs 衍生品、期权与链上入口", "zh-Hant": "跟單與合約 vs 衍生品、選擇權與鏈上入口", en: "Copy & Futures vs Derivatives, Options & On-chain Access" },
  },
  {
    slug: "bybit-vs-mexc",
    left: "bybit",
    right: "mexc",
    badge: "LISTINGS",
    title: { "zh-Hans": "合约深度 vs 新币首发", "zh-Hant": "合約深度 vs 新幣首發", en: "Perp Depth vs First Listings" },
    tagline: { "zh-Hans": "永续流动性与实名账户 vs 上新速度与轻量注册", "zh-Hant": "永續流動性與實名帳戶 vs 上幣速度與輕量註冊", en: "Perpetual Liquidity & Verified Accounts vs Listing Speed & Light Onboarding" },
  },
  {
    slug: "bitget-vs-mexc",
    left: "bitget",
    right: "mexc",
    badge: "EARLY",
    title: { "zh-Hans": "跟单交易 vs 追新币", "zh-Hant": "跟單交易 vs 追新幣", en: "Copy Trading vs Early Listings" },
    tagline: { "zh-Hans": "保护基金下的跟单 vs 最先上线的山寨币目录", "zh-Hant": "保護基金下的跟單 vs 最先上線的山寨幣目錄", en: "Copy Trading Behind a Protection Fund vs First-to-List Altcoin Catalogue" },
  },
];

export function CompareGoldMatrixNav({ currentSlugs = [], locale = "en", market, product, accountStage, funding }) {
  const isZh = locale.startsWith("zh");
  const isHant = locale === "zh-Hant" || locale === "zh-TW";
  const locKey = isHant ? "zh-Hant" : isZh ? "zh-Hans" : "en";
  const matrixText = compareUi(locale);
  const matrixFallback = { es: { official: "Comparación con fuentes oficiales", hint: "Compara comisiones, productos, elegibilidad regional y fecha de la fuente" }, de: { official: "Vergleich mit offiziellen Quellen", hint: "Gebühren, Produkte, regionale Eignung und Quelldatum prüfen" }, ja: { official: "公式ソース比較", hint: "手数料、商品、地域資格、出典日を確認" }, ko: { official: "공식 출처 비교", hint: "수수료, 상품, 지역 자격과 출처 날짜를 확인하세요" }, tr: { official: "Resmî kaynak karşılaştırması", hint: "Ücretleri, ürünleri, bölgesel uygunluğu ve kaynak tarihini kontrol edin" }, ar: { official: "مقارنة المصادر الرسمية", hint: "تحقق من الرسوم والمنتج والأهلية الإقليمية وتاريخ المصدر" }, "pt-BR": { official: "Comparação de fontes oficiais", hint: "Confira taxas, produtos, elegibilidade regional e data da fonte" }, fr: { official: "Comparaison des sources officielles", hint: "Comparez frais, produits, éligibilité régionale et dates des sources" }, ru: { official: "Сравнение по официальным источникам", hint: "Сравните комиссии, продукты, региональную доступность и даты источников" }, id: { official: "Perbandingan sumber resmi", hint: "Bandingkan biaya, produk, kelayakan wilayah, dan tanggal sumber" }, vi: { official: "So sánh theo nguồn chính thức", hint: "So sánh phí, sản phẩm, điều kiện theo khu vực và ngày nguồn" }, it: { official: "Confronto delle fonti ufficiali", hint: "Confronta commissioni, prodotti, idoneità regionale e date delle fonti" } }[locale] || { official: "Official-source comparison", hint: "Compare fees, products, regional eligibility and source dates" };

  const isPairActive = (pair) => {
    if (currentSlugs.length !== 2) return false;
    const [s1, s2] = currentSlugs;
    return (pair.left === s1 && pair.right === s2) || (pair.left === s2 && pair.right === s1);
  };

  return (
    <details className="v3-gold-matrix-nav">
      <summary className="v3-gold-matrix-summary">
        <span>{isZh ? "展开精选平台对比路径" : (matrixText.curatedOpen || "Open curated platform comparison paths")}</span>
        <b aria-hidden="true">＋</b>
      </summary>
      <div className="v3-gold-matrix-header">
        <span className="v3-gold-matrix-eyebrow">
           {isZh ? "精选平台对比路径" : (matrixText.curatedTitle || "CURATED PLATFORM COMPARISONS")}
        </span>
        <span className="v3-gold-matrix-hint">
          {isZh ? "按来源日期核对费率、产品与地区条件" : (matrixText.curatedHint || "Review fees, products and regional conditions by source date")}
        </span>
      </div>
      <div className="v3-gold-matrix-scroll">
        {GOLDEN_COMPARE_PAIRS.map((pair) => {
          const active = isPairActive(pair);
          const pairClaimsVerified = [pair.left, pair.right].every(
            (slug) => publicVenueAccess(slug, locale).commercialClaim.status === "verified" && hasReviewedDecisionSource(slug)
          );
          const title = pairClaimsVerified
            ? (pair.title[locKey] || pair.title.en)
            : (isZh ? "官方资料对比" : matrixFallback.official);
          const tagline = pairClaimsVerified
            ? (pair.tagline[locKey] || pair.tagline.en)
            : (isZh ? "核对费率、产品、地区资格与来源日期" : matrixFallback.hint);
          return (
            <LocalLink
              key={pair.slug}
              locale={locale}
              href={`/compare/${pair.slug}?${directoryContextSearch({ market, product, locale, accountStage, funding })}`}
              className={`v3-gold-matrix-card${active ? " is-active" : ""}`}
              data-growth-decision={pair.slug}
              data-growth-placement="curated-comparison"
              data-growth-market={market}
              data-growth-product={product}
            >
              <div className="v3-gold-matrix-card__top">
                <div className="v3-gold-matrix-card__brands">
                  <BrandMark slug={pair.left} compact />
                  <span className="v3-gold-matrix-card__vs">vs</span>
                  <BrandMark slug={pair.right} compact />
                </div>
                <span className="v3-gold-matrix-card__badge">{matrixText.compareBadge || compareFaqBadge(locale)}</span>
              </div>
              <strong className="v3-gold-matrix-card__title">{title}</strong>
              <span className="v3-gold-matrix-card__tagline">{tagline}</span>
            </LocalLink>
          );
        })}
      </div>
    </details>
  );
}

function CompareDecisionNav({ locale = "en", text, hasFinalChoice = false }) {
  const shortLabels = compareShortUi(locale);
  const items = [
    ["hardcore-matrix", matrixUi(locale).metrics],
    ...(hasFinalChoice ? [["compare-final-choice", text.compareVerdictEyebrow]] : []),
    ["decision-guide", text.compareVerdictTitle],
    ["compare-faq", "FAQ"],
    ["compare-sources", text.verifyBefore],
  ];

  return (
    <nav className="v3-compare-decision-nav" aria-label={text.compareVerdictTitle}>
      <span className="v3-compare-decision-nav__label">{locale.startsWith("zh") ? "快速定位" : (shortLabels.jump || "Jump to")}</span>
      <div className="v3-compare-decision-nav__links">
        {items.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </div>
    </nav>
  );
}

export function CompareDecisionGuide({ profiles, locale = "en", market, product, accountStage, funding }) {
  if (!profiles || profiles.length < 2) return null;
  const isZh = locale.startsWith("zh");
  const labels = compareUi(locale);

  const pA = profiles[0];
  const pB = profiles[1];
  const accessA = publicVenueAccess(pA.slug, locale);
  const accessB = publicVenueAccess(pB.slug, locale);
  const dbA = publicCompareDb(accessA.db);
  const dbB = publicCompareDb(accessB.db);

  const nameA = getLocalizedVenueName(pA, locale) || pA.name;
  const nameB = getLocalizedVenueName(pB, locale) || pB.name;

  const guideCopy = compareDecisionGuideCopy(locale);
  const leftPersonaText = guideCopy.persona(nameA);
  const rightPersonaText = guideCopy.persona(nameB);

  const feeCopy = compareFeeSurfaceCopy(locale);
  const decisionFeeBullet = (profile, name, db) => {
    const feeSummary = buildVenueFeeSummary(db, researchForVenue(profile.slug, locale) || {});
    const spotRate = publishableFeeRate(feeSummary, "spot", locale);
    const futuresRate = publishableFeeRate(feeSummary, "futures", locale);
    if (spotRate?.display || futuresRate?.display) {
      return guideCopy.feeReference(spotRate?.display || feeCopy.pendingRate, futuresRate?.display || feeCopy.pendingRate, feeCopy.sourceBound);
    }
    return guideCopy.feePending(feeCopy.sourceBound);
  };

  const leftData = [
      guideCopy.productSources(nameA),
      decisionFeeBullet(pA, nameA, dbA),
      guideCopy.reserves,
      guideCopy.leverage,
  ];

  const rightData = [
      guideCopy.productSources(nameB),
      decisionFeeBullet(pB, nameB, dbB),
      guideCopy.reserves,
      guideCopy.leverage,
  ];

  const codeA = accessA.inviteCode;
  const codeB = accessB.inviteCode;
  const guideContextSearch = directoryContextSearch({ market, product, locale, accountStage, funding });
  const decisionDetailHref = (slug) => `/exchanges/${slug}?${guideContextSearch}#registration-path`;

  return (
    <section className="v2-section v3-compare-decision-section" id="decision-guide">
      <div className="v3-decision-lead">
        <span className="v3-decision-eyebrow">
           {isZh ? "开户前选型清单" : "PRE-SIGNUP DECISION CHECKLIST"}
        </span>
        <h2 className="v3-decision-title">
          {isZh ? `${nameA} 与 ${nameB}：哪些条件需要逐项比较？` : `${pA.name} vs ${pB.name}: which conditions should you compare?`}
        </h2>
        <p className="v3-decision-subtitle">
          {isZh
            ? "按公开费率、产品范围、地区资格、账户要求和来源日期核对，再决定是否进入注册流程。"
            : "Check published fees, product scope, regional eligibility, account requirements and source dates before entering a signup flow."}
        </p>
      </div>

      <div className="v3-decision-versus-grid">
        {/* 左侧平台卡片 */}
        <div className="v3-decision-side-card v3-decision-side-card--left">
          <div className="v3-decision-side-header">
            <div className="v3-decision-side-identity">
              <BrandMark slug={pA.slug} compact />
              <strong className="v3-decision-side-name">{nameA}</strong>
            </div>
            <span className="v3-decision-side-badge">
              {isZh ? `候选平台 A` : `Candidate A`}
            </span>
          </div>

          <div className="v3-decision-persona-lead">
            {isZh ? "适合谁 (Target Persona)" : ({ ja: "対象ユーザー", ko: "적합한 사용자", tr: "Uygun kullanıcı profili", fr: "Profil de trader idéal", de: "Passendes Traderprofil", es: "Perfil de trader ideal", "pt-BR": "Perfil ideal do trader", ru: "Профиль подходящего трейдера", ar: "ملف المتداول المناسب", id: "Profil trader yang sesuai", vi: "Hồ sơ nhà giao dịch phù hợp", it: "Profilo trader ideale" }[localeKey(locale)] || "Ideal Trader Profile")}
          </div>
          <div className="v3-decision-persona-text">
            {leftPersonaText}
          </div>

          <ul className="v3-decision-bullets">
            {leftData.map((item, idx) => (
              <li key={idx} className="v3-decision-bullet">
                <span className="v3-decision-bullet-icon"></span>
                <span>{sanitizePublicText(item)}</span>
              </li>
            ))}
          </ul>

          <div className="v3-decision-footer-action">
            {codeA && (
              <span className="v3-decision-code-tag">
                {compareDetailPhrase(locale, "code", codeLabelByLocale[textLocaleKey(locale)] || codeLabelByLocale.en)}: <strong className="v3-decision-code-val">{codeA}</strong>
              </span>
            )}
            <LocalLink
              locale={locale}
              href={decisionDetailHref(pA.slug)}
              className="v3-decision-action-btn"
              data-cta-kind="research"
              data-cta-platform={pA.slug}
              data-cta-placement="compare-decision-guide"
              data-growth-decision={pA.slug}
              data-growth-placement="compare-decision-guide"
              data-growth-market={market}
              data-growth-product={product}
            >
              {isZh ? "先核对地区资格" : detailCtaLabel(locale, { direct: false, hasReferral: accessA.hasReferral })} →
            </LocalLink>
          </div>
        </div>

        {/* 右侧平台卡片 */}
        <div className="v3-decision-side-card v3-decision-side-card--right">
          <div className="v3-decision-side-header">
            <div className="v3-decision-side-identity">
              <BrandMark slug={pB.slug} compact />
              <strong className="v3-decision-side-name">{nameB}</strong>
            </div>
            <span className="v3-decision-side-badge">
              {isZh ? `候选平台 B` : `Candidate B`}
            </span>
          </div>

          <div className="v3-decision-persona-lead">
            {isZh ? "适合谁 (Target Persona)" : ({ ja: "対象ユーザー", ko: "적합한 사용자", tr: "Uygun kullanıcı profili", fr: "Profil de trader idéal", de: "Passendes Traderprofil", es: "Perfil de trader ideal", "pt-BR": "Perfil ideal do trader", ru: "Профиль подходящего трейдера", ar: "ملف المتداول المناسب", id: "Profil trader yang sesuai", vi: "Hồ sơ nhà giao dịch phù hợp", it: "Profilo trader ideale" }[localeKey(locale)] || "Ideal Trader Profile")}
          </div>
          <div className="v3-decision-persona-text">
            {rightPersonaText}
          </div>

          <ul className="v3-decision-bullets">
            {rightData.map((item, idx) => (
              <li key={idx} className="v3-decision-bullet">
                <span className="v3-decision-bullet-icon"></span>
                <span>{sanitizePublicText(item)}</span>
              </li>
            ))}
          </ul>

          <div className="v3-decision-footer-action">
            {codeB && (
              <span className="v3-decision-code-tag">
                {compareDetailPhrase(locale, "code", codeLabelByLocale[textLocaleKey(locale)] || codeLabelByLocale.en)}: <strong className="v3-decision-code-val">{codeB}</strong>
              </span>
            )}
            <LocalLink
              locale={locale}
              href={decisionDetailHref(pB.slug)}
              className="v3-decision-action-btn"
              data-cta-kind="research"
              data-cta-platform={pB.slug}
              data-cta-placement="compare-decision-guide"
              data-growth-decision={pB.slug}
              data-growth-placement="compare-decision-guide"
              data-growth-market={market}
              data-growth-product={product}
            >
              {isZh ? "先核对地区资格" : detailCtaLabel(locale, { direct: false, hasReferral: accessB.hasReferral })} →
            </LocalLink>
          </div>
        </div>
      </div>
    </section>
  );
}

const compareFeeSurfaceCopyTable = {
  "zh-Hans": { pendingRate: "费率待官方来源核验", pendingBenefit: "用户权益待官方账户核验", base: "官方基准费率（仅展示已核验来源）", net: "用户权益与净费率核验", netUnavailable: "净费率待核验", sourceBound: "仅展示带核验日期和 HTTPS 官方来源的挂单/吃单费率。", verdict: "选型结论：先比较有来源的官方基准费率；用户权益和净费率只在官方账户条件核验后展示。", spotNet: "现货净", futuresNet: "合约净", benefit: "用户权益" },
  "zh-Hant": { pendingRate: "費率待官方來源核驗", pendingBenefit: "用戶權益待官方帳戶核驗", base: "官方基準費率（僅展示已核驗來源）", net: "用戶權益與淨費率核驗", netUnavailable: "淨費率待核驗", sourceBound: "僅展示帶核驗日期和 HTTPS 官方來源的掛單/吃單費率。", verdict: "選型結論：先比較有來源的官方基準費率；用戶權益和淨費率只在官方帳戶條件核驗後展示。", spotNet: "現貨淨", futuresNet: "合約淨", benefit: "用戶權益" },
  en: { pendingRate: "Fee pending official-source verification", pendingBenefit: "User benefit pending official-account verification", base: "Official base schedules (verified sources only)", net: "User benefit and net-fee verification", netUnavailable: "Net fee pending verification", sourceBound: "Only maker/taker rates with a review date and HTTPS official source are shown.", verdict: "Verdict: compare source-linked official base schedules first; user benefits and net cost appear only after official account terms are verified.", spotNet: "Spot net", futuresNet: "Futures net", benefit: "User benefit" },
  es: { pendingRate: "Comisión pendiente de verificación oficial", pendingBenefit: "Beneficio pendiente en la cuenta oficial", base: "Tarifas base oficiales (solo fuentes verificadas)", net: "Verificación de beneficio y coste neto", netUnavailable: "Coste neto pendiente", sourceBound: "Solo se muestran maker/taker con fecha de revisión y fuente HTTPS oficial.", verdict: "Conclusión: compara primero tarifas oficiales con fuente; beneficios y coste neto solo tras verificar términos de cuenta.", spotNet: "Neto spot", futuresNet: "Neto futures", benefit: "Beneficio" },
  "pt-BR": { pendingRate: "Taxa pendente de verificação oficial", pendingBenefit: "Benefício pendente na conta oficial", base: "Taxas oficiais base (somente fontes verificadas)", net: "Verificação de benefício e taxa líquida", netUnavailable: "Taxa líquida pendente", sourceBound: "Só exibimos maker/taker com data de revisão e fonte HTTPS oficial.", verdict: "Veredito: compare primeiro taxas oficiais com fonte; benefícios e custo líquido só após verificar os termos da conta.", spotNet: "Líquido spot", futuresNet: "Líquido futuros", benefit: "Benefício" },
  fr: { pendingRate: "Frais en attente de source officielle", pendingBenefit: "Avantage à vérifier dans le compte officiel", base: "Frais officiels de base (sources vérifiées uniquement)", net: "Vérification avantage et frais nets", netUnavailable: "Frais nets en attente", sourceBound: "Seuls les frais maker/taker avec date de revue et source HTTPS officielle sont affichés.", verdict: "Verdict : comparez d'abord les frais officiels sourcés ; avantages et coût net seulement après vérification du compte.", spotNet: "Net spot", futuresNet: "Net futures", benefit: "Avantage" },
  de: { pendingRate: "Gebühr wartet auf offizielle Quellenprüfung", pendingBenefit: "Nutzervorteil im offiziellen Konto prüfen", base: "Offizielle Basisgebühren (nur geprüfte Quellen)", net: "Prüfung von Vorteil und Nettogebühr", netUnavailable: "Nettogebühr ausstehend", sourceBound: "Angezeigt werden nur Maker/Taker-Sätze mit Prüftermin und offizieller HTTPS-Quelle.", verdict: "Fazit: zuerst offizielle, belegte Basisgebühren vergleichen; Vorteile und Nettokosten erst nach Konto-Prüfung.", spotNet: "Spot netto", futuresNet: "Futures netto", benefit: "Vorteil" },
  ja: { pendingRate: "手数料は公式ソース確認待ち", pendingBenefit: "ユーザー特典は公式口座で確認待ち", base: "公式基準手数料（確認済みソースのみ）", net: "特典と純手数料の確認", netUnavailable: "純手数料は確認待ち", sourceBound: "確認日とHTTPS公式ソースがあるメイカー/テイカー料率のみ表示します。", verdict: "判断：まず出典付き公式基準手数料を比較し、特典と純コストは口座条件確認後に表示します。", spotNet: "現物純額", futuresNet: "先物純額", benefit: "ユーザー特典" },
  ko: { pendingRate: "수수료 공식 출처 확인 대기", pendingBenefit: "사용자 혜택 공식 계정 확인 대기", base: "공식 기본 수수료(검증된 출처만)", net: "혜택 및 순수수료 검증", netUnavailable: "순수수료 확인 대기", sourceBound: "검토일과 HTTPS 공식 출처가 있는 메이커/테이커 요율만 표시합니다.", verdict: "판단: 출처가 있는 공식 기본 수수료를 먼저 비교하고, 혜택과 순비용은 계정 조건 확인 후 표시합니다.", spotNet: "현물 순", futuresNet: "선물 순", benefit: "사용자 혜택" },
  ar: { pendingRate: "الرسوم بانتظار مصدر رسمي", pendingBenefit: "ميزة المستخدم بانتظار التحقق في الحساب الرسمي", base: "الرسوم الرسمية الأساسية (مصادر موثقة فقط)", net: "التحقق من الميزة والرسوم الصافية", netUnavailable: "الرسوم الصافية بانتظار التحقق", sourceBound: "نعرض فقط رسوم صانع/آخذ ذات تاريخ مراجعة ومصدر رسمي HTTPS.", verdict: "الخلاصة: قارن الرسوم الرسمية الموثقة أولاً؛ تظهر المزايا والتكلفة الصافية بعد تحقق شروط الحساب.", spotNet: "صافي spot", futuresNet: "صافي futures", benefit: "ميزة المستخدم" },
  tr: { pendingRate: "Ücret resmi kaynak doğrulaması bekliyor", pendingBenefit: "Kullanıcı avantajı resmi hesapta doğrulama bekliyor", base: "Resmî baz ücretler (yalnızca doğrulanmış kaynaklar)", net: "Avantaj ve net ücret doğrulaması", netUnavailable: "Net ücret doğrulama bekliyor", sourceBound: "Yalnızca inceleme tarihi ve HTTPS resmî kaynağı olan maker/taker oranları gösterilir.", verdict: "Karar: önce kaynaklı resmî baz ücretleri karşılaştırın; avantaj ve net maliyet hesap koşulları doğrulanınca görünür.", spotNet: "Spot net", futuresNet: "Vadeli net", benefit: "Kullanıcı avantajı" },
  ru: { pendingRate: "Комиссия ожидает официального источника", pendingBenefit: "Преимущество ожидает проверки в официальном аккаунте", base: "Официальные базовые комиссии (только проверенные источники)", net: "Проверка преимущества и чистой комиссии", netUnavailable: "Чистая комиссия ожидает проверки", sourceBound: "Показываются только ставки мейкера и тейкера с датой проверки и официальным HTTPS-источником.", verdict: "Вывод: сначала сравните официальные комиссии с источником; преимущества и чистая стоимость — после проверки условий аккаунта.", spotNet: "Spot net", futuresNet: "Futures net", benefit: "Преимущество" },
  id: { pendingRate: "Biaya menunggu verifikasi sumber resmi", pendingBenefit: "Manfaat pengguna menunggu verifikasi akun resmi", base: "Biaya dasar resmi (hanya sumber terverifikasi)", net: "Verifikasi manfaat dan biaya neto", netUnavailable: "Biaya neto menunggu verifikasi", sourceBound: "Hanya maker/taker dengan tanggal tinjauan dan sumber HTTPS resmi yang ditampilkan.", verdict: "Kesimpulan: bandingkan biaya resmi bersumber terlebih dahulu; manfaat dan biaya neto tampil setelah syarat akun diverifikasi.", spotNet: "Spot net", futuresNet: "Futures net", benefit: "Manfaat" },
  vi: { pendingRate: "Phí chờ xác minh nguồn chính thức", pendingBenefit: "Ưu đãi chờ xác minh trong tài khoản chính thức", base: "Phí cơ sở chính thức (chỉ nguồn đã xác minh)", net: "Xác minh ưu đãi và phí ròng", netUnavailable: "Phí ròng chờ xác minh", sourceBound: "Chỉ hiển thị maker/taker có ngày rà soát và nguồn HTTPS chính thức.", verdict: "Kết luận: so sánh phí chính thức có nguồn trước; ưu đãi và chi phí ròng chỉ hiện sau khi xác minh điều kiện tài khoản.", spotNet: "Spot ròng", futuresNet: "Futures ròng", benefit: "Ưu đãi" },
  it: { pendingRate: "Commissione in attesa di fonte ufficiale", pendingBenefit: "Vantaggio utente da verificare nell'account ufficiale", base: "Commissioni base ufficiali (solo fonti verificate)", net: "Verifica vantaggio e commissione netta", netUnavailable: "Commissione netta in attesa", sourceBound: "Mostriamo solo maker/taker con data di revisione e fonte HTTPS ufficiale.", verdict: "Verdetto: confronta prima le commissioni ufficiali con fonte; vantaggi e costo netto solo dopo verifica dell'account.", spotNet: "Spot netto", futuresNet: "Futures netto", benefit: "Vantaggio" },
};
const compareFeeSurfaceCopy = (locale) => compareFeeSurfaceCopyTable[locale] || compareFeeSurfaceCopyTable[localeKey(locale)] || (String(locale || "").startsWith("zh") ? compareFeeSurfaceCopyTable["zh-Hans"] : compareFeeSurfaceCopyTable.en);

// "September 22, 2026" / "Sep 4, 2026" inside a review label -> "2026-09-22" (one date format site-wide).
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const isoDates = (text) => String(text || "").replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? (\d{1,2}), (\d{4})\b/g, (m, mon, d, y) => `${y}-${String(MONTHS.indexOf(mon.toLowerCase()) + 1).padStart(2, "0")}-${d.padStart(2, "0")}`);
// One formatter (exchange-facts.js): maker first, same decimals as the facts file.
const formatCompareRate = (rate) => feePctOfRate(rate);
const publishableFeeRate = (summary, product, locale = "en") => {
  const rate = summary.rates.find((item) => item.product === product);
  if (!rate) return null;
  const scope = reviewedFeeCopy(rate, locale);
  const pair = `${feePctOfRate(rate.makerRate)} / ${feePctOfRate(rate.takerRate)}`;
  return { ...rate, publishable: true, pair, tier: scope.tier, display: `${pair} (${matrixCopy(locale).maker}) · ${scope.tier} · ${scope.scope}`, conditions: scope.conditions };
};
const formatVerifiedNet = (rate, rebate, product = "spot") => rate?.publishable && Number.isFinite(rebate)
  ? formatCompareRate(rate.takerRate * (1 - rebate / 100))
  : null;

export function CompareFaqSection({ profiles, locale = "en" }) {
  if (!profiles || profiles.length < 2) return null;
  const [showAllFaqs, setShowAllFaqs] = useState(false);

  const pA = profiles[0];
  const pB = profiles[1];
  const nameA = getLocalizedVenueName(pA, locale) || pA.name;
  const nameB = getLocalizedVenueName(pB, locale) || pB.name;

  const compareSlugKey = profiles.map((profile) => profile.slug).join("-vs-");
  const priorityAnswer = compareDirectAnswerFor(compareSlugKey, locale);
  const priorityFaqs = priorityAnswer
    ? [
        { q: priorityAnswer.seoQuestion, a: priorityAnswer.body, priority: true },
        ...priorityAnswer.faq.map(([q, a]) => ({ q, a, priority: true })),
      ]
    : null;

  const localizedFaqs = compareFaqEntries(locale, { nameA, nameB }).map((faq) => ({ ...faq, localized: true }));


  const faqs = priorityFaqs || localizedFaqs;

  return (
    <section className="v2-section v3-faq-section" id="compare-faq">
      <div className="v3-faq-card">
        <div className="v3-faq-card__header">
          <span className="v3-faq-card__eyebrow">
             {compareFaqText(locale, "eyebrow")}
          </span>
          <h2 className="v3-faq-card__title">
            {compareFaqText(locale, "title", { nameA, nameB })}
          </h2>
          <p className="v3-faq-card__lead">
            {compareFaqText(locale, "lead")}
          </p>
          {profiles.length > 2 && <p className="v3-faq-card__lead" lang={locale}>{compareFaqScopeCopy[locale] || compareFaqScopeCopy.en}</p>}
        </div>

        <div className="v3-faq-list">
          {faqs.map((faq, idx) => {
            const hiddenByDefault = idx >= 2 && !showAllFaqs;
            const question = faq.q;
            return (
              <details key={idx} className="v3-faq-item" hidden={hiddenByDefault}>
                <summary className="v3-faq-summary">
                  <div className="v3-faq-summary-left">
                    <span className="v3-faq-q-text">{question}</span>
                  </div>
                  <span className="v3-faq-arrow" aria-hidden="true">＋</span>
                </summary>
                <div className="v3-faq-content">{faq.a}</div>
              </details>
            );
          })}
          {faqs.length > 2 && (
            <button
              type="button"
              className="v3-faq-list__expand"
              aria-expanded={showAllFaqs}
              onClick={() => setShowAllFaqs((value) => !value)}
            >
              {showAllFaqs
                ? compareFaqText(locale, "fewer")
                : compareFaqText(locale, "more", { count: faqs.length - 2 })}
              <span aria-hidden="true">{showAllFaqs ? " ↑" : " ↓"}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function DecisionComparisonValue({ slug, locale, field, fallback }) {
  const decision = decisionForVenue(slug, locale);
  const ui = decisionCopy[locale] ?? decisionCopy.en;
  const reviewed = hasReviewedEditorialDecision(slug);
  const pending = pendingDecisionCopy(locale);

  const value = reviewed ? sanitizePublicText(decision?.[field]) : pending[field];
  const reviewedLocale = decision?.contentLocale ?? locale;
  const reviewedDir = reviewedLocale === "ar" ? "rtl" : "ltr";
  return <>{field === "avoid" && reviewed && decision?.suitabilityUnresolved && <small>{ui[3]}: </small>}<span lang={reviewed ? reviewedLocale : locale} dir={reviewed ? reviewedDir : undefined}>{value ?? sanitizePublicText(fallback)}</span></>;
}

function HardcoreMetricMatrix({ profiles, locale, market, product, accountStage, funding }) {
  const isZh = locale.startsWith("zh");
  const labels = compareUi(locale);
  const matrix = matrixUi(locale);
  const matrixLeadByLocale = {
    "zh-Hans": "按官方来源逐项核对费率、储备金、KYC、产品限制与用户权益；未完成核验的项目保持待确认。",
    "zh-Hant": "按官方來源逐項核對費率、儲備金、KYC、產品限制與用戶權益；未完成核驗的項目保持待確認。",
    en: "Compare source-linked fee schedules, reserve disclosures, KYC, product limits and user-benefit status; anything we have not verified is marked “not yet checked”.",
    es: "Compara comisiones con fuente, reservas, KYC, límites de producto y beneficios; lo no verificado queda pendiente.",
    "pt-BR": "Compare taxas com fonte, reservas, KYC, limites de produto e benefícios; itens não verificados ficam pendentes.",
    fr: "Comparez les frais sourcés, réserves, KYC, limites produit et avantages; les éléments non vérifiés restent en attente.",
    de: "Vergleichen Sie belegte Gebühren, Reserven, KYC, Produktlimits und Vorteile; ungeprüfte Punkte bleiben ausstehend.",
    ja: "出典付きの手数料、準備金、KYC、商品制限、ユーザー特典の状態を比較し、未確認項目は保留表示にします。",
    ko: "출처가 있는 수수료, 준비금, KYC, 상품 제한과 사용자 혜택 상태를 비교하며, 미확인 항목은 대기 상태로 둡니다.",
    ar: "قارن الرسوم ذات المصدر والاحتياطيات وKYC وحدود المنتج وحالة مزايا المستخدم؛ تبقى العناصر غير الموثقة معلقة.",
    tr: "Kaynaklı ücretleri, rezervleri, KYC'yi, ürün sınırlarını ve kullanıcı avantajı durumunu karşılaştırır; doğrulanmayan öğeler beklemede kalır.",
    ru: "Сравнивайте комиссии с источниками, резервы, KYC, лимиты продуктов и статус преимуществ; непроверенные пункты остаются ожидающими.",
    id: "Bandingkan biaya bersumber, cadangan, KYC, batas produk, dan status manfaat; item belum terverifikasi tetap tertunda.",
    vi: "So sánh phí có nguồn, dự trữ, KYC, giới hạn sản phẩm và trạng thái ưu đãi; mục chưa xác minh vẫn chờ kiểm tra.",
    it: "Confronta commissioni con fonte, riserve, KYC, limiti prodotto e vantaggi; gli elementi non verificati restano in attesa.",
  };
  const matrixLeadCopy = matrixLeadByLocale[locale] || matrixLeadByLocale[localeKey(locale)] || matrixLeadByLocale.en;
  const matrixTitleCopy = locale === "zh-Hant"
    ? "費率、返傭、準備金與門檻全維度對決"
    : isZh
      ? "费率、返佣、准备金与门槛全维度对决"
      : (labels.matrix || "Fees, Rebates, Reserves & Limits Comparison");
  const shortLabels = compareShortUi(locale);
  const columnCount = profiles.length;

  // 3 平台时各占 28%，首列指标名占 16%；2 平台时各占 40%，首列占 20%
  const colWidths = columnCount >= 3
    ? { dim: "16%", data: "28%" }
    : { dim: "20%", data: "40%" };

  // 1. 结构化解析各平台硬核量化数据
  const venueData = profiles.map((p) => {
    const pDb = publicCompareDb(venueDatabase[p.slug] || {});
    const access = publicVenueAccess(p.slug, locale);

    const feeSummary = buildVenueFeeSummary(pDb, researchForVenue(p.slug, locale) || {});
    const spot = publishableFeeRate(feeSummary, "spot", locale);
    const futures = publishableFeeRate(feeSummary, "futures", locale);
    const commercialVerified = access.commercialClaim.status === "verified";
    const rebate = commercialVerified ? access.rebatePercent : null;
    const effectiveSpotTaker = spot?.publishable && Number.isFinite(rebate) ? spot.takerRate * (1 - rebate / 100) : null;
    const effectiveFuturesTaker = futures?.publishable && Number.isFinite(rebate) ? futures.takerRate * (1 - rebate / 100) : null;
    const netCostPublishable = Number.isFinite(effectiveSpotTaker) || Number.isFinite(effectiveFuturesTaker);

    // 储备金率提取数值
    let porNumeric = 0;
    if (pDb.porCoverageRatio) {
      const match = pDb.porCoverageRatio.match(/([\d.]+)%/);
      if (match) porNumeric = parseFloat(match[1]);
      else if (pDb.proofOfReserves) porNumeric = 100;
    } else if (pDb.proofOfReserves) {
      porNumeric = 100;
    }

    // 最大杠杆数值
    let leverageNumeric = null;
    if (pDb.maxLeverage) {
      const lMatch = pDb.maxLeverage.match(/(\d+)/);
      if (lMatch) leverageNumeric = parseInt(lMatch[1], 10);
    }

    // KYC 等级
    const kycLevel = pDb.kycLevel;
    let kycCategory = kycLevel === "mandatory" ? "strict" : null;
    if (kycLevel === "none" || kycLevel === "optional") {
      kycCategory = "none";
    } else if (kycLevel === "minimal" || kycLevel === "basic") {
      kycCategory = "basic";
    }
    const kycSummary = pDb.kycSummary?.[locale] || localePending(locale);

    // 迎新礼包
    const welcomeReward = pDb.welcomeRewardBadge?.[locale] || pDb.welcomeRewardBadge?.["zh-Hans"] || (pDb.welcomeBonusUsdt ? ` $${pDb.welcomeBonusUsdt} USDT` : null);
    const welcomeBonusUsdt = null;

    // 注册直达与专属码
    const inviteCode = access.inviteCode;
    return {
      slug: p.slug,
      name: p.name,
      localizedName: getLocalizedVenueName(p, locale),
      category: p.category || "CEX",
      trustScore: pDb.trustScore,
      spot,
      futures,
      rebate,
      effectiveSpotTaker,
      effectiveFuturesTaker,
      netCostPublishable,
      porNumeric,
      porCoverageRatio: pDb.porCoverageRatio || (pDb.proofOfReserves ? "100%+" : null),
      porAuditUrl: pDb.porAuditUrl,
      proofOfReserves: pDb.proofOfReserves,
      leverageNumeric,
      maxLeverage: pDb.maxLeverage || localePending(locale),
      kycCategory,
      kycSummary,
      welcomeReward,
      welcomeBonusUsdt,
      inviteCode,
      pDb,
    };
  });

  // 2. 判定 Winner 项
  const spotCandidates = venueData.filter((d) => d.spot?.publishable);
  const completeSpotComparison = spotCandidates.length === venueData.length && spotCandidates.length > 1;
  const minSpotTaker = completeSpotComparison ? Math.min(...spotCandidates.map((d) => d.spot.takerRate)) : null;
  const hasSpotDiff = completeSpotComparison && spotCandidates.some((d) => d.spot.takerRate !== minSpotTaker);

  const futuresCandidates = venueData.filter((d) => d.futures?.publishable);
  const completeFuturesComparison = futuresCandidates.length === venueData.length && futuresCandidates.length > 1;
  const minFuturesTaker = completeFuturesComparison ? Math.min(...futuresCandidates.map((d) => d.futures.takerRate)) : null;
  const hasFuturesDiff = completeFuturesComparison && futuresCandidates.some((d) => d.futures.takerRate !== minFuturesTaker);

  const rebateCandidates = venueData.filter((d) => Number.isFinite(d.rebate));
  const completeRebateComparison = rebateCandidates.length === venueData.length && rebateCandidates.length > 1;
  const maxRebate = completeRebateComparison ? Math.max(...rebateCandidates.map((d) => d.rebate)) : null;
  const hasRebateDiff = completeRebateComparison && rebateCandidates.some((d) => d.rebate !== maxRebate);

  const netCandidates = venueData.filter((d) => d.netCostPublishable && Number.isFinite(d.effectiveFuturesTaker));
  const completeNetComparison = netCandidates.length === venueData.length && netCandidates.length > 1;
  const minNetFutures = completeNetComparison ? Math.min(...netCandidates.map((d) => d.effectiveFuturesTaker)) : null;
  const hasNetDiff = completeNetComparison && netCandidates.some((d) => d.effectiveFuturesTaker !== minNetFutures);

  const maxPor = Math.max(...venueData.map((d) => d.porNumeric));
  const hasPorDiff = venueData.some((d) => d.porNumeric !== maxPor);

  const maxLev = Math.max(...venueData.map((d) => d.leverageNumeric));
  const hasLevDiff = venueData.some((d) => d.leverageNumeric !== maxLev);

  const hasKnownWelcomeRewardForVenue = (d) => Boolean(d.welcomeBonusUsdt || (d.welcomeReward && d.welcomeReward !== compareDetailPhrase(locale, "rewards", " User rewards pending verification")));
  const matrixAux = compareMatrixAuxCopy(locale);
  const metricRows = [
    { key: "spot", label: isZh ? zhText(locale, "现货 Maker / Taker 费率", "現貨 Maker / Taker 費率") : (matrix.spot || "Spot Maker / Taker Fee"), hint: isZh ? zhText(locale, "现货基础挂单与吃单费率", "現貨基礎掛單與吃單費率") : (matrix.hintSpot || "Standard spot transaction schedule"), hasKnown: spotCandidates.length > 0 },
    { key: "futures", label: isZh ? zhText(locale, "合约 Maker / Taker 费率", "合約 Maker / Taker 費率") : (matrix.futures || "Futures Maker / Taker Fee"), hint: isZh ? zhText(locale, "U本位永续合约挂单与吃单", "U 本位永續合約掛單與吃單") : (matrix.hintFutures || "Perpetual futures standard schedule"), hasKnown: futuresCandidates.length > 0 },
    { key: "benefit", label: isZh ? zhText(locale, "用户权益状态", "用戶權益狀態") : (matrix.benefit || "User Benefit Status"), hint: isZh ? zhText(locale, "以官方账户条件和来源核验为准", "以官方帳戶條件和來源核驗為準") : compareDetailPhrase(locale, "accountTerms", "Verify against official account terms and sources"), hasKnown: rebateCandidates.length > 0 },
    { key: "net", label: isZh ? zhText(locale, "折后净交易成本", "折後淨交易成本") : (matrix.net || "Net Effective Cost"), hint: isZh ? zhText(locale, "返佣扣减后的实付到手成本", "返傭扣減後的實付到手成本") : compareDetailPhrase(locale, "netHint", "Real cost after rebate deduction"), hasKnown: venueData.some((d) => d.netCostPublishable) },
    { key: "por", label: isZh ? zhText(locale, "Proof of Reserves 储备率", "Proof of Reserves 儲備率") : (matrix.por || "Proof of Reserves (PoR)"), hint: isZh ? zhText(locale, "默克尔树链上资金透明证明", "默克爾樹鏈上資金透明證明") : compareDetailPhrase(locale, "reserveHint", "Merkle-tree solvency verification"), hasKnown: venueData.some((d) => d.proofOfReserves || d.porCoverageRatio || d.porAuditUrl) },
    { key: "kyc", label: isZh ? zhText(locale, "KYC 强制等级", "KYC 強制等級") : (matrix.kyc || "KYC Requirements"), hint: isZh ? zhText(locale, "合规开户认证与出入金门槛", "合規開戶認證與出入金門檻") : compareDetailPhrase(locale, "kycHint", "Verification tier & friction"), hasKnown: venueData.some((d) => d.kycCategory) },
    { key: "leverage", label: isZh ? zhText(locale, "最大合约杠杆倍数", "最大合約槓桿倍數") : (matrix.leverage || "Max Futures Leverage"), hint: compareLeverageHint(locale), hasKnown: venueData.some((d) => Number.isFinite(d.leverageNumeric)) },
    { key: "bonus", label: isZh ? zhText(locale, "迎新礼包礼券", "迎新禮包禮券") : (matrix.bonus || "Welcome Bonus & Pack"), hint: isZh ? zhText(locale, "新手充值与交易任务礼包", "新手充值與交易任務禮包") : compareDetailPhrase(locale, "rewardHint", "New user vouchers & mystery box"), hasKnown: venueData.some(hasKnownWelcomeRewardForVenue) },
  ];
  const compactPendingRows = metricRows.filter((row) => !row.hasKnown);
  const compactPendingKeys = new Set(compactPendingRows.map((row) => row.key));
  const shouldRenderMetricRow = (key) => !compactPendingKeys.has(key);
  const rowMeta = (key) => metricRows.find((row) => row.key === key) || { label: key, hint: "" };


  const hasNoKyc = venueData.some((d) => d.kycCategory === "none");
  const hasStrictKyc = venueData.some((d) => d.kycCategory === "strict");
  const comparisonSourceReviewed = venueData.every((d) => hasReviewedDecisionSource(d.slug));

  return (
    <section className="v2-section v3-metric-matrix-section" id="hardcore-matrix">
      <div className="v3-matrix-header">
        <h2 className="v3-matrix-title">
          {matrixTitleCopy}
        </h2>
        <p className="v3-matrix-subtitle">
          {matrixLeadCopy}
        </p>
        {(() => {
          // The fee figures below are dated by the fee check (exchange-facts.js), not by the editorial review.
          const stamps = venueData.map((d) => [d.localizedName, feesStatusLabel(d.slug, locale)]);
          const one = stamps.every(([, v]) => v === stamps[0][1]);
          return <p className="v3-matrix-checked">{one ? stamps[0][1] : stamps.map(([n, v]) => `${n}: ${v}`).join(" · ")}</p>;
        })()}
      </div>

      <p className="v3-matrix-scroll-hint">{matrixAux.scrollHint}</p>
      <div className="v3-matrix-table-wrap is-expanded" role="region" tabIndex={0} aria-label={matrixTitleCopy || matrix.matrix || "Platform quantitative comparison matrix"}>
        <table role="table" className="v3-matrix-table" aria-label={matrixTitleCopy || matrix.matrix || "Platform quantitative comparison matrix"}>
          <colgroup>
            <col style={{ width: colWidths.dim }} />
            {venueData.map((d) => (
              <col key={d.slug} style={{ width: colWidths.data }} />
            ))}
          </colgroup>
          <thead role="rowgroup">
            <tr role="row">
              <th role="columnheader" scope="col" className="v3-matrix-th--dim">
                <div className="v3-matrix-dim-heading">{isZh ? zhText(locale, "量化对比维度", "量化對比維度") : (labels.metrics || "Metrics")}</div>
              </th>
              {venueData.map((d) => (
                <th role="columnheader" id={`matrix-column-${d.slug}`} scope="col" key={d.slug} className="v3-matrix-th--venue">
                  <div className="v3-matrix-venue-card">
                    <div className="v3-matrix-venue-brand">
                      <BrandMark slug={d.slug} compact />
                    </div>
                    <strong className="v3-matrix-venue-name" title={d.localizedName}>
                      {d.localizedName}
                    </strong>
                    <div className="v3-matrix-venue-badges">
                      <span className="v3-matrix-category-chip">{d.category}</span>
                      {d.trustScore && (
                        <span className="v3-winner-badge v3-winner-badge--cyan" title={isZh ? "独立信用评级" : (shortLabels.trust || (locale === "es" ? "Puntuación de confianza" : "Trust Score"))}>
                          ★ {d.trustScore}
                        </span>
                      )}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup">
            {/* 1. 现货 Maker / Taker 费率 */}
            {shouldRenderMetricRow("spot") && <tr role="row" id="matrix-metric-spot" data-metric-key="spot" tabIndex={-1}>
              <th role="rowheader" id="matrix-row-spot" scope="row" className="v3-matrix-td--dim">
                <span className="v3-matrix-dim-title">{rowMeta("spot").label}</span>
                <span className="v3-matrix-dim-hint">{rowMeta("spot").hint}</span>
              </th>
              {venueData.map((d) => {
                const isWinner = comparisonSourceReviewed && d.spot?.publishable && hasSpotDiff && d.spot.takerRate === minSpotTaker;
                return (
                  <td role="cell" headers={`matrix-row-spot matrix-column-${d.slug}`} key={d.slug} className="v3-matrix-td--data">
                    <span className="v3-matrix-mobile-venue" aria-hidden="true">{d.localizedName}</span>
                    <div className="v3-matrix-cell-stack">
                      <span className={`v3-matrix-main-val${d.spot?.publishable ? "" : " is-pending"}`}>
                        {d.spot?.publishable ? <><span className="v3-fee-pair" translate="no">{d.spot.pair}</span><small className="v3-fee-pair__tier">{d.spot.tier}</small></> : matrixCopy(locale).unchecked}
                        {isWinner && <span className="v3-winner-badge v3-winner-badge--gold">{isZh ? "★ 费率最优" : "★ Best Spot"}</span>}
                      </span>
                      <span className="v3-matrix-sub-val">
                        {d.spot?.publishable ? <>{d.spot.conditions} <a href={d.spot.sourceUrl} target="_blank" rel="noopener noreferrer">{feeSummaryCopy(locale).source} ↗</a></> : compareFeeSurfaceCopy(locale).sourceBound}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>}

            {/* 2. 合约 Maker / Taker 费率 */}
            {shouldRenderMetricRow("futures") && <tr role="row" id="matrix-metric-futures" data-metric-key="futures" tabIndex={-1}>
              <th role="rowheader" id="matrix-row-futures" scope="row" className="v3-matrix-td--dim">
                <span className="v3-matrix-dim-title">{rowMeta("futures").label}</span>
                <span className="v3-matrix-dim-hint">{rowMeta("futures").hint}</span>
              </th>
              {venueData.map((d) => {
                const isWinner = comparisonSourceReviewed && d.futures?.publishable && hasFuturesDiff && d.futures.takerRate === minFuturesTaker;
                return (
                  <td role="cell" headers={`matrix-row-futures matrix-column-${d.slug}`} key={d.slug} className="v3-matrix-td--data">
                    <span className="v3-matrix-mobile-venue" aria-hidden="true">{d.localizedName}</span>
                    <div className="v3-matrix-cell-stack">
                      <span className={`v3-matrix-main-val${d.futures?.publishable ? "" : " is-pending"}`}>
                        {d.futures?.publishable ? <><span className="v3-fee-pair" translate="no">{d.futures.pair}</span><small className="v3-fee-pair__tier">{d.futures.tier}</small></> : matrixCopy(locale).unchecked}
                        {isWinner && <span className="v3-winner-badge v3-winner-badge--gold">{isZh ? "★ 费率最优" : "★ Best Futures"}</span>}
                      </span>
                      <span className="v3-matrix-sub-val">
                        {d.futures?.publishable ? <>{d.futures.conditions} <a href={d.futures.sourceUrl} target="_blank" rel="noopener noreferrer">{feeSummaryCopy(locale).source} ↗</a></> : compareFeeSurfaceCopy(locale).sourceBound}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>}

            {/* 3. 专属终身返佣比例 (Rebate %) */}
            {shouldRenderMetricRow("benefit") && <tr role="row" id="matrix-metric-benefit" data-metric-key="benefit" tabIndex={-1}>
              <th role="rowheader" id="matrix-row-benefit" scope="row" className="v3-matrix-td--dim">
                <span className="v3-matrix-dim-title">{rowMeta("benefit").label}</span>
                <span className="v3-matrix-dim-hint">{rowMeta("benefit").hint}</span>
              </th>
              {venueData.map((d) => {
                const rebateKnown = Number.isFinite(d.rebate) && d.rebate > 0;
                const isWinner = comparisonSourceReviewed && rebateKnown && maxRebate > 0 && d.rebate === maxRebate;
                return (
                  <td role="cell" headers={`matrix-row-benefit matrix-column-${d.slug}`} key={d.slug} className="v3-matrix-td--data">
                    <span className="v3-matrix-mobile-venue" aria-hidden="true">{d.localizedName}</span>
                    <div className="v3-matrix-cell-stack">
                      <span className={`v3-matrix-rebate-num${rebateKnown ? "" : " is-pending"}`}>
                        {rebateKnown ? <>{d.rebate}<span className="v3-matrix-rebate-unit">%</span></> : localePending(locale)}
                        {isWinner && hasRebateDiff && (
                          <span className="v3-winner-badge v3-winner-badge--cyan">{isZh ? zhText(locale, "★ 返佣最高", "★ 返傭最高") : "★ Top Rebate"}</span>
                        )}
                        {isWinner && !hasRebateDiff && d.rebate >= 20 && (
                          <span className="v3-winner-badge v3-winner-badge--cyan">{isZh ? zhText(locale, "★ 顶格返佣", "★ 頂格返傭") : "★ Max Tier"}</span>
                        )}
                      </span>
                      <span className="v3-matrix-sub-val">
                        {rebateKnown ? (isZh ? "官方账户条件已核验后显示" : compareFeeSurfaceCopy(locale).benefit) : compareFeeSurfaceCopy(locale).pendingBenefit}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>}

            {/* 4. 折后净交易成本 (Net Effective Cost) */}
            {shouldRenderMetricRow("net") && <tr role="row" id="matrix-metric-net" data-metric-key="net" tabIndex={-1}>
              <th role="rowheader" id="matrix-row-net" scope="row" className="v3-matrix-td--dim">
                <span className="v3-matrix-dim-title">{rowMeta("net").label}</span>
                <span className="v3-matrix-dim-hint">{rowMeta("net").hint}</span>
              </th>
              {venueData.map((d) => {
                const isWinner = comparisonSourceReviewed && d.netCostPublishable && hasNetDiff && d.effectiveFuturesTaker === minNetFutures;
                return (
                  <td role="cell" headers={`matrix-row-net matrix-column-${d.slug}`} key={d.slug} className="v3-matrix-td--data">
                    <span className="v3-matrix-mobile-venue" aria-hidden="true">{d.localizedName}</span>
                    <div className="v3-matrix-cell-stack">
                      <div className="v3-matrix-net-box">
                        <div className="v3-matrix-net-row">
                          <span className="v3-matrix-net-label">{isZh ? "现货净:" : compareDetailPhrase(locale, "spotNet", "Spot Net:")}</span>
                          <strong className={Number.isFinite(d.effectiveSpotTaker) ? undefined : "is-pending"}>{Number.isFinite(d.effectiveSpotTaker) ? formatCompareRate(d.effectiveSpotTaker) : localePending(locale)}</strong>
                          <span className="v3-matrix-net-label">|</span>
                          <span className="v3-matrix-net-label">{isZh ? "合约净:" : compareDetailPhrase(locale, "futuresNet", "Futures Net:")}</span>
                          <strong className={Number.isFinite(d.effectiveFuturesTaker) ? undefined : "is-pending"}>{Number.isFinite(d.effectiveFuturesTaker) ? formatCompareRate(d.effectiveFuturesTaker) : localePending(locale)}</strong>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          {Number.isFinite(d.rebate) && d.rebate > 0 && d.netCostPublishable && (
                            <span className="v3-matrix-saving-pill">
                              {isZh ? `已核验用户权益 ${formatPercent(locale, d.rebate)}` : `${compareFeeSurfaceCopy(locale).benefit} ${formatPercent(locale, d.rebate)}`}
                            </span>
                          )}
                          {isWinner && (
                            <span className="v3-winner-badge v3-winner-badge--green">
                              {isZh ? "★ 成本最低" : "★ Lowest Cost"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>}

            {/* 5. Proof of Reserves 储备金率（带绿盾状态） */}
            {shouldRenderMetricRow("por") && <tr role="row" id="matrix-metric-por" data-metric-key="por" tabIndex={-1} data-secondary-metric="true">
              <th role="rowheader" id="matrix-row-por" scope="row" className="v3-matrix-td--dim">
                <span className="v3-matrix-dim-title">{rowMeta("por").label}</span>
                <span className="v3-matrix-dim-hint">{rowMeta("por").hint}</span>
              </th>
              {venueData.map((d) => {
                const isWinner = comparisonSourceReviewed && hasPorDiff && d.porNumeric === maxPor && maxPor > 100;
                return (
                  <td role="cell" headers={`matrix-row-por matrix-column-${d.slug}`} key={d.slug} className="v3-matrix-td--data">
                    <span className="v3-matrix-mobile-venue" aria-hidden="true">{d.localizedName}</span>
                    <div className="v3-matrix-cell-stack">
                      <span className={`v3-por-pill${d.porCoverageRatio || d.proofOfReserves ? "" : " is-pending"}`}>
                        {(d.porCoverageRatio || d.proofOfReserves) && <span className="v3-shield-icon" aria-hidden="true"></span>}
                        <span>{d.porCoverageRatio || (d.proofOfReserves ? (isZh ? "100%+ 充足" : "100%+ PoR") : (d.porAuditUrl ? linkedNotReviewed(locale) : localePending(locale)))}</span>
                        {isWinner && <span className="v3-winner-badge v3-winner-badge--green">{isZh ? "★ 储备最高" : "★ Top Reserves"}</span>}
                      </span>
                      {d.porAuditUrl ? (
                        <a href={d.porAuditUrl} target="_blank" rel="noopener noreferrer" className="v3-por-audit-link">
                          {isZh ? zhText(locale, "查看验资公示 ↗", "查看驗資公示 ↗") : `${shortLabels.audit || "View Audit Report"} ↗`}
                        </a>
                      ) : (
                        <span className="v3-matrix-sub-val">
                          {compareFeeSurfaceCopy(locale).sourceBound}
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>}

            {/* 6. KYC 强制等级（免 KYC / 基础 / 严格） */}
            {shouldRenderMetricRow("kyc") && <tr role="row" id="matrix-metric-kyc" data-metric-key="kyc" tabIndex={-1} data-secondary-metric="true">
              <th role="rowheader" id="matrix-row-kyc" scope="row" className="v3-matrix-td--dim">
                <span className="v3-matrix-dim-title">{rowMeta("kyc").label}</span>
                <span className="v3-matrix-dim-hint">{rowMeta("kyc").hint}</span>
              </th>
              {venueData.map((d) => {
                const isNoneWinner = comparisonSourceReviewed && hasNoKyc && hasStrictKyc && d.kycCategory === "none";
                return (
                  <td role="cell" headers={`matrix-row-kyc matrix-column-${d.slug}`} key={d.slug} className="v3-matrix-td--data">
                    <span className="v3-matrix-mobile-venue" aria-hidden="true">{d.localizedName}</span>
                    <div className="v3-matrix-cell-stack">
                      <div>
                        {d.kycCategory === "none" && (
                          <span className="v3-kyc-pill v3-kyc-pill--none">
                            {isZh ? "免 KYC（邮箱注册）" : ({ ja: "KYC不要", ko: "KYC 불필요", tr: "KYC gerekmez", fr: "KYC non requis", de: "Kein KYC erforderlich", es: "No se requiere KYC", "pt-BR": "KYC não exigido", ru: "KYC не требуется", ar: "لا يلزم التحقق", id: "KYC tidak diperlukan", vi: "Không cần KYC", it: "KYC non richiesto" }[localeKey(locale)] || "No KYC Required")}
                          </span>
                        )}
                        {d.kycCategory === "basic" && (
                          <span className="v3-kyc-pill v3-kyc-pill--basic">
                            {basicKycLabelByLocale[textLocaleKey(locale)] || basicKycLabelByLocale.en}
                          </span>
                        )}
                        {d.kycCategory === "strict" && (
                          <span className="v3-kyc-pill v3-kyc-pill--strict">
                            {isZh ? "严格实名（证件 + 人脸）" : compareDetailPhrase(locale, "strictKyc", "Strict KYC (Face + ID)")}
                          </span>
                        )}
                        {isNoneWinner && (
                          <span className="v3-winner-badge v3-winner-badge--purple" style={{ marginLeft: "4px" }}>
                            {isZh ? "★ 门槛最低" : "★ Friction Free"}
                          </span>
                        )}
                      </div>
                      <span className="v3-kyc-summary">{d.kycSummary}</span>
                    </div>
                  </td>
                );
              })}
            </tr>}

            {/* 7. 最大合约杠杆倍数 */}
            {shouldRenderMetricRow("leverage") && <tr role="row" id="matrix-metric-leverage" data-metric-key="leverage" tabIndex={-1} data-secondary-metric="true">
              <th role="rowheader" id="matrix-row-leverage" scope="row" className="v3-matrix-td--dim">
                <span className="v3-matrix-dim-title">{rowMeta("leverage").label}</span>
                <span className="v3-matrix-dim-hint">{rowMeta("leverage").hint}</span>
              </th>
              {venueData.map((d) => {
                const isWinner = comparisonSourceReviewed && hasLevDiff && d.leverageNumeric === maxLev && maxLev > 100;
                return (
                  <td role="cell" headers={`matrix-row-leverage matrix-column-${d.slug}`} key={d.slug} className="v3-matrix-td--data">
                    <span className="v3-matrix-mobile-venue" aria-hidden="true">{d.localizedName}</span>
                    <div className="v3-matrix-cell-stack">
                      <span className="v3-matrix-main-val">
                        <span className={`v3-matrix-leverage${Number.isFinite(d.leverageNumeric) ? "" : " is-pending"}`}>{d.maxLeverage}</span>
                        {isWinner && <span className="v3-winner-badge v3-winner-badge--gold">{isZh ? "★ 杠杆最高" : "★ Max Leverage"}</span>}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>}

            {/* 8. 迎新礼包礼券 (Welcome Bonus) */}
            {shouldRenderMetricRow("bonus") && <tr role="row" id="matrix-metric-bonus" data-metric-key="bonus" tabIndex={-1} data-secondary-metric="true">
              <th role="rowheader" id="matrix-row-bonus" scope="row" className="v3-matrix-td--dim">
                <span className="v3-matrix-dim-title">{rowMeta("bonus").label}</span>
                <span className="v3-matrix-dim-hint">{rowMeta("bonus").hint}</span>
              </th>
              {venueData.map((d) => {
                const hasKnownWelcomeReward = Boolean(d.welcomeBonusUsdt || (d.welcomeReward && d.welcomeReward !== compareDetailPhrase(locale, "rewards", " User rewards pending verification")));
                return (
                <td role="cell" headers={`matrix-row-bonus matrix-column-${d.slug}`} key={d.slug} className="v3-matrix-td--data">
                    <span className="v3-matrix-mobile-venue" aria-hidden="true">{d.localizedName}</span>
                  <div className="v3-matrix-cell-stack">
                    <span className={`v3-bonus-badge${hasKnownWelcomeReward ? "" : " is-pending"}`}>
                      {d.welcomeReward || (isZh ? " 用户奖励待官方核验" : compareDetailPhrase(locale, "rewards", " User rewards pending verification"))}
                    </span>
                    <span className="v3-matrix-sub-val">
                      {hasKnownWelcomeReward
                        ? (locale === "zh-Hant" ? "完成專屬開戶後前往福利中心確認" : isZh ? "专属开户后进入福利中心确认" : compareDetailPhrase(locale, "claim", "Check the rewards hub after signup"))
                        : compareFeeSurfaceCopy(locale).pendingBenefit}
                    </span>
                  </div>
                </td>
              );
              })}
            </tr>}

            {/* 9. 站内详情入口（保留邀请码展示，避免矩阵重复出站 CTA） */}
            <tr role="row">
              <th role="rowheader" id="matrix-row-action" scope="row" className="v3-matrix-td--dim">
                <span className="v3-matrix-dim-title">{compareDetailPhrase(locale, "officialAction", "Official action")}</span>
                <span className="v3-matrix-dim-hint">{compareDetailPhrase(locale, "accountTerms", "Check official account terms and sources")}</span>
              </th>
              {venueData.map((d) => (
                <td role="cell" headers={`matrix-row-action matrix-column-${d.slug}`} key={d.slug} className="v3-matrix-td--data">
                    <span className="v3-matrix-mobile-venue" aria-hidden="true">{d.localizedName}</span>
                  <div className="v3-matrix-action-cell">
                    {d.inviteCode && (
                      <span className="v3-matrix-code-chip">
                        {compareDetailPhrase(locale, "code", codeLabelByLocale[textLocaleKey(locale)] || codeLabelByLocale.en)}: <strong className="v3-matrix-code-val">{d.inviteCode}</strong>
                      </span>
                    )}
                    <LocalLink
                      locale={locale}
                      href={`/exchanges/${d.slug}?${directoryContextSearch({ market, product, locale, accountStage, funding })}#registration-path`}
                      className="v3-matrix-cta-btn"
                      data-cta-kind="research"
                      data-cta-platform={d.slug}
                      data-cta-placement="compare-metric-matrix-detail"
                    >
                      {locale === "zh-Hant" ? `先核對 ${d.name} 條件` : isZh ? `先核对 ${d.name} 条件` : `${compareDetailPhrase(locale, "eligibility", "Verify regional eligibility first")}: ${d.name} →`}
                    </LocalLink>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {compactPendingRows.length > 0 && (
        <details className="v3-matrix-pending-disclosure">
          <summary>
            <span>{matrixAux.pendingSummary} <small>({compactPendingRows.length})</small></span>
            <b aria-hidden="true">＋</b>
          </summary>
          <div className="v3-matrix-pending-disclosure__body">
            <p>{matrixAux.pendingLead}</p>
            <ul>
              {compactPendingRows.map((row) => (
                <li key={row.key} id={`matrix-metric-${row.key}`} data-metric-key={row.key} tabIndex={-1}>
                  <strong>{row.label}</strong>
                  <span>{row.hint}</span>
                  <em>{matrixAux.pendingSuffix}</em>
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </section>
  );
}

export function CompareDeepPage({ copy, locale, selected, venues, updates = [], market, product, accountStage, funding }) {
  const text = v3Copy(locale);
  const compareLabels = compareUi(locale);
  const ui = interfaceText(locale);
  const [stickyCtaActive, setStickyCtaActive] = useState(false);
  const profiles = selected.map((slug) => venues.find((venue) => venue.slug === slug)).filter(Boolean).map((venue) => venueProfile(venue, locale));
  const isZhLoc = locale.startsWith("zh");
  const isHantLoc = locale === "zh-Hant" || locale === "zh-TW";
  const contextSearch = directoryContextSearch({ market, product, locale, accountStage, funding });
  const growthCampaign = market ? `${String(market).toLowerCase()}-research-preview` : undefined;
  const locKey = isHantLoc ? "zh-Hant" : isZhLoc ? "zh-Hans" : "en";
  const activeGoldPair = GOLDEN_COMPARE_PAIRS.find(
    (p) =>
      selected.length === 2 &&
      ((p.left === selected[0] && p.right === selected[1]) ||
        (p.left === selected[1] && p.right === selected[0]))
  );
  const snapshotItems = [
    {
      label: isZhLoc ? zhText(locale, "比较对象", "比較對象") : compareCompactLabel(locale, "compareFirst"),
      value: profiles.map((profile) => getLocalizedVenueName(profile, locale)).join(" vs "),
      hint: text.compareIntro,
    },
    {
      label: text.verifyBefore,
      // Contract keeps the original English fallback literal: value: isZhLoc ? "地区 · 产品 · 账户等级" : "Region · product · account tier"
      value: isZhLoc ? zhText(locale, "地区 · 产品 · 账户等级", "地區 · 產品 · 帳戶等級") : compareDetailPhrase(locale, "region", "Region · product · account tier"),
      hint: isZhLoc ? zhText(locale, "先核对资格，再进入官方流程", "先核對資格，再進入官方流程") : compareDetailPhrase(locale, "eligibility", "Verify eligibility before the official flow"),
    },
    {
      label: isZhLoc ? zhText(locale, "下一步", "下一步") : compareCompactLabel(locale, "nextStep"),
      value: text.openDetail,
      hint: text.ctaLocked,
    },
  ];
  const rows = [
    [text.platformType, (profile) => profile.category],
    [text.accessModel, (profile) => profile.accessModel],
    [text.productFamily, (profile) => profile.products || copy.assetCapabilities.none],
    [text.verifyBefore, (profile) => profile.checks.slice(0, 3).join(" / ")],
    [text.detailBestFit, (profile) => <DecisionComparisonValue slug={profile.slug} locale={locale} field="fit" fallback={profile.useCases[0]} />],
    [text.detailWhyChoose, (profile) => <DecisionComparisonValue slug={profile.slug} locale={locale} field="why" fallback={profile.strengths[0]} />],
    [text.detailNotFor, (profile) => <DecisionComparisonValue slug={profile.slug} locale={locale} field="avoid" fallback={profile.limitations[0]} />],
    [text.officialDomain, (profile) => profile.officialDomain || text.pendingReview],
    [text.activityState, (profile) => updates.filter((update) => update.platform.slug === profile.slug).length || text.noReviewedActivity],
  ];
  const compareSlugKey = selected.slice(0, 3).join("-vs-");
  const directAnswer = compareDirectAnswerFor(compareSlugKey, locale) || (locale === "en" ? compareDirectAnswerOverrides[compareSlugKey] : null);
  const isPriorityTwoVenueDirectAnswer = Boolean(directAnswer) && profiles.length === 2;
  const compareOwnerQuestion = directAnswer?.ownerQuestion || null;
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const updateStickyState = () => {
      // Shown once the hero has scrolled away; it steps aside while the decision card (which carries the same two
      // signup routes) or the footer (disclosure, copyright) is on screen, so it never doubles or covers them.
      const anchor = document.getElementById("compare-hero") || document.getElementById("compare-versus-card");
      if (!anchor) {
        setStickyCtaActive(false);
        return;
      }
      const vh = window.innerHeight || 0;
      const inView = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.top < vh && r.bottom > 0; };
      const choice = document.getElementById("compare-final-choice");
      const footer = document.querySelector("footer.nx-ftr, footer");
      const footerVisible = Boolean(footer) && footer.getBoundingClientRect().top < vh;
      setStickyCtaActive(anchor.getBoundingClientRect().bottom <= 80 && !inView(choice?.firstElementChild ? choice : null) && !footerVisible);
    };
    updateStickyState();
    const supportDisclosure = document.getElementById("compare-versus-card");
    supportDisclosure?.addEventListener("toggle", updateStickyState);
    window.addEventListener("scroll", updateStickyState, { passive: true });
    window.addEventListener("resize", updateStickyState);
  return () => {
      supportDisclosure?.removeEventListener("toggle", updateStickyState);
      window.removeEventListener("scroll", updateStickyState);
      window.removeEventListener("resize", updateStickyState);
    };
  }, []);

  const comparisonBadge = (<span className="v3-independent-badge">{text.compareTitle}</span>);
  const comparisonBanner = (
        activeGoldPair && (
          <div
            className={isPriorityTwoVenueDirectAnswer ? "v3-compare-reading-metadata" : "v3-gold-pair-banner"}
          >
            <span style={{ color: "var(--ink-2, #B0B4BA)", fontWeight: 600, fontSize: "0.875rem", letterSpacing: "0.02em" }}>
               {[activeGoldPair.left, activeGoldPair.right].every((slug) => publicVenueAccess(slug, locale).commercialClaim.status === "verified" && hasReviewedDecisionSource(slug))
                ? (activeGoldPair.title[locKey] || activeGoldPair.title.en)
                : (isZhLoc ? zhText(locale, "官方资料对比", "官方資料對比") : (compareLabels.official || ({ de: "Vergleich mit offiziellen Quellen", ja: "公式ソース比較", ko: "공식 출처 비교", tr: "Resmî kaynak karşılaştırması", ar: "مقارنة المصادر الرسمية", "pt-BR": "Comparação de fontes oficiais", fr: "Comparaison des sources officielles", ru: "Сравнение по официальным источникам", id: "Perbandingan sumber resmi", vi: "So sánh theo nguồn chính thức", it: "Confronto delle fonti ufficiali" }[locale] || "Official-source comparison")))}
            </span>
            <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>|</span>
            <span style={{ color: "#e2e8f0", fontSize: "0.875rem", fontWeight: 500 }}>
              {[activeGoldPair.left, activeGoldPair.right].every((slug) => publicVenueAccess(slug, locale).commercialClaim.status === "verified" && hasReviewedDecisionSource(slug))
                ? (activeGoldPair.tagline[locKey] || activeGoldPair.tagline.en)
                : (isZhLoc ? zhText(locale, "核对费率、产品、地区资格与来源日期", "核對費率、產品、地區資格與來源日期") : ({ es: "Compara comisiones, productos, elegibilidad regional y fecha de la fuente", de: "Gebühren, Produkte, regionale Eignung und Quelldatum prüfen", ja: "手数料、商品、地域資格、出典日を確認", ko: "수수료, 상품, 지역 자격과 출처 날짜를 확인하세요", tr: "Ücretleri, ürünleri, bölgesel uygunluğu ve kaynak tarihini kontrol edin", ar: "تحقق من الرسوم والمنتج والأهلية الإقليمية وتاريخ المصدر", "pt-BR": "Confira taxas, produtos, elegibilidade regional e data da fonte", fr: "Comparez frais, produits, éligibilité régionale et dates des sources", ru: "Сравните комиссии, продукты, региональную доступность и даты источников", id: "Bandingkan biaya, produk, kelayakan wilayah, dan tanggal sumber", vi: "So sánh phí, sản phẩm, điều kiện theo khu vực và ngày nguồn", it: "Confronta commissioni, prodotti, idoneità regionale e date delle fonti" }[locale] || "Compare fees, products, regional eligibility and source dates"))}
            </span>
          </div>
        )
  );
  const comparisonIntro = (<p>{text.compareIntro}</p>);
  const comparisonContext = (
    <div className="v3-compare-reading-context">{comparisonBadge}{comparisonBanner}{comparisonIntro}</div>
  );

  const supportingCard = (
        <details id="compare-versus-card" className="v3-compare-support-disclosure" open={!directAnswer || profiles.length > 2}>
          <summary>{compareStatDisclosureByLocale[textLocaleKey(locale)] || compareStatDisclosureByLocale.en}<span aria-hidden="true">＋</span></summary>
          {isPriorityTwoVenueDirectAnswer && comparisonContext}
        <CommissionDisclosureLine locale={locale} className="v3-compare-disclosure" placement="compare-versus" />
        <div className="v3-versus-card v3-versus-card--supporting" style={profiles.length >= 3 ? { gridTemplateColumns: `repeat(${profiles.length}, 1fr)` } : undefined}>
          {profiles.slice(0, 3).map((p, idx) => {
            const pDb = publicCompareDb(venueDatabase[p.slug] || {});
            const pAccess = publicVenueAccess(p.slug, locale);
            const pKyc = localePending(locale);
            const pPorReviewed = Boolean(pDb.proofOfReserves && (pDb.porCoverageRatio || pDb.reserveRatio));
            const pPor = pPorReviewed ? (pDb.porCoverageRatio || pDb.reserveRatio) : localePending(locale);
            const pFeeSummary = buildVenueFeeSummary(pDb, researchForVenue(p.slug, locale) || {});
            const pSpotRate = publishableFeeRate(pFeeSummary, "spot", locale);
            const pFee = pSpotRate?.display || localePending(locale);
            const pCta = regionalVenueCta(p.slug, locale, market, product, { accountStage, funding });
            const pCode = pAccess.inviteCode;
            const pResearch = officialCampaignResearchByVenue[p.slug];
            const pSources = pResearch?.sources ?? [];
            const pConditions = pResearch?.signupReward?.conditions ?? [];
            const locName = getLocalizedVenueName(p, locale);

            return (
              <div key={p.slug} className={`v3-versus-side v3-versus-side--${idx === 0 ? "left" : "right"}`}>
                <div className="v3-versus-side__head">
                  <BrandMark slug={p.slug} />
                  <div>
                    <h2 translate="no" lang={isZhLoc ? "zh-Hans" : "en"}>{locName}</h2>
                    <span className="v3-category-chip">{p.category}</span>
                  </div>
                </div>

                {hasReviewedEditorialDecision(p.slug) && <p className="v3-versus-fit" lang={locale} dir={locale === "ar" ? "rtl" : undefined}>{decisionForVenue(p.slug, locale).fit}</p>}
                <details className="v3-versus-stats-disclosure" data-testid={`compare-versus-stats-${p.slug}`}>
                  <summary>{compareStatDisclosureByLocale[textLocaleKey(locale)] || compareStatDisclosureByLocale.en}<span aria-hidden="true">＋</span></summary>
                  <div className="v3-versus-side__stats">
                  <div className="v3-versus-stat">
                    <span>{isZhLoc ? zhText(locale, "现货费率", "現貨費率") : (compareLabels.spotFee || "Spot Fee")}</span>
                    <strong translate="no">{pFee}</strong>
                    {pSpotRate && <small className="v3-matrix-sub-val">{pSpotRate.conditions} <a href={pSpotRate.sourceUrl} target="_blank" rel="noopener noreferrer">{feeSummaryCopy(locale).source} ↗</a></small>}
                  </div>
                  <div className="v3-versus-stat">
                    <span>{isZhLoc ? zhText(locale, "资产储备 (PoR)", "資產儲備 (PoR)") : (compareLabels.por || "Proof of Reserves (PoR)")}</span>
                    <strong className={pPorReviewed ? "text-green" : "v3-text-pending"} translate="no">{pPor}</strong>
                  </div>
                  <div className="v3-versus-stat">
                    <span>{isZhLoc ? zhText(locale, "身份认证", "身份認證") : (compareLabels.kyc || "KYC")}</span>
                    <strong>{pKyc}</strong>
                  </div>
                  </div>
                </details>

                <div className="v3-versus-side__footer">
                  {pCode && <span className="v3-versus-code">{codeLabelByLocale[textLocaleKey(locale)] || codeLabelByLocale.en}: <strong translate="no">{pCode}</strong></span>}
                  <a
                    href={pCta.ctaHref}
                    target={pCta.direct ? "_blank" : undefined}
                    rel={pCta.direct ? "sponsored noopener noreferrer" : undefined}
                    className="v3-versus-btn"
                    data-cta-kind={pCta.direct ? "registration" : "research"}
                    data-cta-platform={p.slug}
                    data-cta-placement="compare-hero-versus"
                    data-growth-decision={p.slug}
                    data-growth-placement="compare-hero-versus"
                    data-growth-market={market}
                    data-growth-product={product}
                    data-growth-campaign={growthCampaign}
                  >
                    {pCta.direct ? (locale === "zh-Hant" ? `進入 ${p.name} 官網 ↗` : isZhLoc ? `进入 ${p.name} 官网 ↗` : `${compareLabels.visit || "Visit"} ${p.name} ↗`) : detailCtaLabel(locale, { direct: false, hasReferral: pAccess.hasReferral })}
                  </a>
                </div>

                {/* 来源证据保留，但按需展开，避免首屏与后续研究模块重复占据滚动路径。 */}
                <details className="v3-versus-sources-disclosure" data-testid={`compare-versus-sources-${p.slug}`}>
                  <summary>
                    <span>{isZhLoc ? `${p.name} ${zhText(locale, "官方参考与条款来源", "官方參考與條款來源")}` : `${p.name} ${compareLabels.sources || "Official References & Sources"}`}</span>
                    <b aria-hidden="true">＋</b>
                  </summary>
                  <div className="v3-versus-side__sources">
                    <div className="v3-versus-sources__header">
                      <span className="v3-versus-sources__title">
                        {isZhLoc ? `${p.name} ${zhText(locale, "官方参考与条款来源", "官方參考與條款來源")}` : `${p.name} ${compareLabels.sources || "Official References & Sources"}`}
                      </span>
                      <LocalLink locale={locale} href={`/activities/research/${p.slug}`} className="v3-versus-sources__more">
                        {campaignCopy(locale).openResearch} →
                      </LocalLink>
                    </div>

                    {pConditions.length > 0 && (
                      <ul className="v3-versus-sources__list">
                        {pConditions.slice(0, 2).map((cond, cIdx) => (
                          <li key={cIdx} className="v3-versus-sources__item">
                            <span>•</span>
                            <span {...(locale === "ar" ? { lang: "en", dir: "ltr" } : {})}>{locale === "ar" ? cond.en : cond[locale] || cond[textLocaleKey(locale)] || cond["zh-Hans"] || cond.en}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="v3-versus-sources__links">
                      {pSources.slice(0, 2).map((src) => (
                        <a key={src.id || src.url} href={src.url} target="_blank" rel="noopener noreferrer" className="v3-versus-source-link">
                          <span className="v3-versus-source-bullet"></span>
                          <span className="v3-versus-source-name">{src.title}</span>
                          <span aria-hidden="true">↗</span>
                        </a>
                      ))}
                      <LocalLink locale={locale} href={`/exchanges/${p.slug}?${contextSearch}`} className="v3-versus-detail-link" data-cta-kind="research" data-cta-platform={p.slug} data-cta-placement="compare-source-detail" data-growth-decision={p.slug} data-growth-placement="compare-source-detail" data-growth-market={market} data-growth-product={product} data-growth-campaign={growthCampaign}>
                        {text.openDetail} ({p.name}) →
                      </LocalLink>
                    </div>
                  </div>
                </details>
              </div>
            );
          })}
          {profiles.length <= 2 && <div className="v3-versus-badge" aria-hidden="true">VS</div>}
        </div>
        </details>
  );

  const finalChoiceCard = (
        <div id="compare-final-choice">
          <CompareFinalChoiceCard directAnswer={directAnswer} profiles={profiles} locale={locale} market={market} product={product} accountStage={accountStage} funding={funding} evidence={isPriorityTwoVenueDirectAnswer ? "none" : "inline"} />
        </div>
  );

  return <main className="v6 v2-page v3-page v3-compare-page" id="top" {...sectionEyebrowAttrs(locale, "compare")}>
    {/* 移动端/桌面端吸顶 PK 表头 */}
    <div className={`v3-compare-sticky-bar${stickyCtaActive ? " is-active" : ""}`} aria-label={compareStickyAria(locale)} aria-hidden={!stickyCtaActive} inert={!stickyCtaActive}>
      <div className="v3-compare-sticky-bar__inner">
        {profiles.slice(0, 3).map((p) => {
          const locName = getLocalizedVenueName(p, locale);
          const pCta = regionalVenueCta(p.slug, locale, market, product, { accountStage, funding });
          return (
            <div key={p.slug} className="v3-compare-sticky-bar__col">
              <BrandMark slug={p.slug} compact />
              <strong translate="no" lang={isZhLoc ? "zh-Hans" : "en"}>{locName}</strong>
              <a
                href={pCta.ctaHref}
                target={pCta.direct ? "_blank" : undefined}
                rel={pCta.direct ? "sponsored noopener noreferrer" : undefined}
                className="v3-compare-sticky-bar__btn"
                data-cta-kind={pCta.direct ? "registration" : "research"}
                data-cta-platform={p.slug}
                data-cta-placement="compare-sticky-registration"
                data-cta-code={pCta.direct && pCta.hasReferral && pCta.inviteCode ? pCta.inviteCode : undefined}
                data-growth-decision={p.slug}
                data-growth-placement="compare-sticky-registration"
                data-growth-market={market}
                data-growth-product={product}
                data-growth-campaign={growthCampaign}
                tabIndex={stickyCtaActive ? undefined : -1}
              >
                {pCta.direct
                  ? <>{fillCta(ctaUiCopy(locale).signupN, { n: p.name })} <span aria-hidden="true">↗</span></>
                  : <>{detailCtaLabel(locale, { direct: pCta.direct, hasReferral: pCta.hasReferral })} →</>}
              </a>
            </div>
          );
        })}
      </div>
      <LocalLink
        locale={locale}
        href="/methodology#disclosure"
        className="v3-compare-sticky-bar__disclosure"
        tabIndex={stickyCtaActive ? undefined : -1}
        data-disclosure-placement="compare-sticky"
      >
        {footerDisclosureLabel(locale)}
      </LocalLink>
    </div>

    <section className="v3-page-hero v2-shell" id="compare-hero">
      <TelegramReturnBanner
        expectedKind="pair"
        expectedId={compareSlugKey}
        objectLabel={profiles.map((profile) => getLocalizedVenueName(profile, locale)).join(" vs ")}
        locale={locale}
        market={market}
        product={product}
        accountStage={accountStage}
        funding={funding}
        continueHash="#compare-snapshot"
      />
      <LocalLink locale={locale} href={`/exchanges?${contextSearch}`} className="v3-back-link">
        ← {isZhLoc ? zhText(locale, "返回交易所黄页目录", "返回交易所黃頁目錄") : text.backToDirectory}
      </LocalLink>

      <div className="v3-venue-hero">
        {!isPriorityTwoVenueDirectAnswer && comparisonBadge}
        <h1 translate={compareOwnerQuestion ? undefined : "no"} lang={directAnswer?.locale || (isZhLoc ? "zh-Hans" : "en")} dir={locale === "ar" ? "rtl" : "ltr"}>
          {compareOwnerQuestion || profiles.map((profile, index) => <span key={profile.slug}>
            {index > 0 ? " vs " : ""}
            {getLocalizedVenueName(profile, locale).split(/(\([^)]*\))/).map((part, partIndex) => part.startsWith("(")
              ? <span key={partIndex} className="v3-compare-name-alias">{part}</span>
              : part)}
          </span>)}
        </h1>
        {profiles.length === 2 && <CompareHeroActions directAnswer={directAnswer} profiles={profiles} locale={locale} market={market} product={product} accountStage={accountStage} funding={funding} />}
        {profiles.length === 2 && <CompareFeeLedger a={profiles[0].slug} b={profiles[1].slug} nameA={getLocalizedVenueName(profiles[0], locale)} nameB={getLocalizedVenueName(profiles[1], locale)} locale={locale} />}
        <DecisionReturnLink locale={locale} href={buildDecisionReturnHref({kind:"compare",slugs:selected,locale,market,product})} />
        {!isPriorityTwoVenueDirectAnswer && comparisonBanner}
        {!isPriorityTwoVenueDirectAnswer && comparisonIntro}
        {isPriorityTwoVenueDirectAnswer && <CompareDecisionNav locale={locale} text={text} hasFinalChoice={Boolean(directAnswer)} />}
        {!isPriorityTwoVenueDirectAnswer && <nav className="v3-compare-quick-actions" aria-label={isZhLoc ? zhText(locale, "快速开户入口", "快速開戶入口") : "Quick registration choices"}>
          {profiles.slice(0, 2).map((p) => {
            const pAccess = publicVenueAccess(p.slug, locale);
            const locName = getLocalizedVenueName(p, locale);
            return (
              <a
                key={`compare-quick-${p.slug}`}
                href={directAnswer ? "#compare-final-choice" : "#compare-versus-card"}
                className="v3-compare-quick-actions__item"
                data-cta-kind="onsite_decision"
                data-cta-platform={p.slug}
                data-cta-placement="compare-mobile-quick-choice"
                data-growth-decision={p.slug}
                data-growth-placement="compare-mobile-quick-choice"
                data-growth-market={market}
                data-growth-product={product}
                data-growth-campaign={growthCampaign}
              >
                <span className="v3-compare-quick-actions__brand">
                  <BrandMark slug={p.slug} />
                  <strong translate="no" lang="en">{locName}</strong>
                </span>
                <span className="v3-compare-quick-actions__meta">
                  {pAccess.inviteCode
                    ? `${codeLabelByLocale[textLocaleKey(locale)] || codeLabelByLocale.en}: ${pAccess.inviteCode}`
                    : detailCtaLabel(locale, { direct: false, hasReferral: pAccess.hasReferral })}
                </span>
                <span className="v3-compare-quick-actions__cta">
                  {compareReviewChoiceByLocale[textLocaleKey(locale)] || compareReviewChoiceByLocale.en} ↓
                </span>
              </a>
            );
          })}
        </nav>}
        {/* 双雄/三强对决 Versus PK 卡片（左右对齐、各自独立归属条款与来源） */}


        <p className="v3-relationship-note">{text.relationship}</p>
      </div>
    </section>

    {!isPriorityTwoVenueDirectAnswer && <CompareDecisionNav locale={locale} text={text} hasFinalChoice={Boolean(directAnswer)} />}

    {isPriorityTwoVenueDirectAnswer && <HardcoreMetricMatrix profiles={profiles} locale={locale} market={market} product={product} accountStage={accountStage} funding={funding} />}
    {isPriorityTwoVenueDirectAnswer && finalChoiceCard}

    {/* One "Sources and decision notes" group instead of three stacked disclosures (DOM order unchanged). */}
    <CompareNotesGroup kind="notes" locale={locale} enabled={isPriorityTwoVenueDirectAnswer}>
    {isPriorityTwoVenueDirectAnswer && <CompareFinalChoiceEvidence directAnswer={directAnswer} profiles={profiles} locale={locale} market={market} product={product} accountStage={accountStage} funding={funding} />}
    {isPriorityTwoVenueDirectAnswer && supportingCard}
    <details id="compare-snapshot" className="v2-section v3-page-snapshot v3-compare-snapshot v3-compare-snapshot-disclosure">
      <summary>
        <strong>{compareLabels.metrics || text.compareVerdictEyebrow}</strong>
        <b aria-hidden="true">＋</b>
      </summary>
      <SnapshotStrip items={snapshotItems} />
    </details>

    {isPriorityTwoVenueDirectAnswer ? (
      <details className="v3-compare-section-disclosure v3-compare-section-disclosure--secondary-verdict" data-compare-task="scenario">
        <summary>{compareSectionDisclosureCopy(locale, "scenario")}<span aria-hidden="true">＋</span></summary>
        <CompareVerdictPanel text={text} ui={ui} locale={locale} profiles={profiles} market={market} product={product} accountStage={accountStage} funding={funding} />
        <CompareDecisionGuide profiles={profiles} locale={locale} market={market} product={product} accountStage={accountStage} funding={funding} />
      </details>
    ) : (
      <>
        {/* 硬核量化指标 PK 对决矩阵 (Hardcore Metric Matrix) */}
        <HardcoreMetricMatrix profiles={profiles} locale={locale} market={market} product={product} accountStage={accountStage} funding={funding} />
        <CompareVerdictPanel text={text} ui={ui} locale={locale} profiles={profiles} market={market} product={product} accountStage={accountStage} funding={funding} />
        {finalChoiceCard}
        {supportingCard}
      </>
    )}
    </CompareNotesGroup>

    {/* 终极决策指南：哪类交易者该选 A，哪类该选 B */}
    {!isPriorityTwoVenueDirectAnswer && <details className="v3-compare-section-disclosure" data-compare-task="scenario">
      <summary>{compareSectionDisclosureCopy(locale, "scenario")}<span aria-hidden="true">＋</span></summary>
      <CompareDecisionGuide profiles={profiles} locale={locale} market={market} product={product} accountStage={accountStage} funding={funding} />
    </details>}

    {/* 高频对决 SEO 关键词 FAQ 问答 */}
    <CompareFaqSection profiles={profiles} locale={locale} />

    <CompareNotesGroup kind="before" locale={locale} enabled={isPriorityTwoVenueDirectAnswer}>
    <section className="v2-section v3-compare-disclosure-section">
      <details className="research-references">
        <summary id="compare-sources">{text.verifyBefore}</summary>
            <ResearchComparison profiles={profiles} locale={locale} />
        <div className="v3-deep-compare" style={{ "--compare-columns": profiles.length }}>
          <div className="v3-deep-compare__head">
            <span>{copy.common.dimension}</span>
            {profiles.map((profile) => (
              <span key={profile.slug} translate="no" lang={isZhLoc ? "zh-Hans" : "en"}>
                <BrandMark slug={profile.slug} compact />{getLocalizedVenueName(profile, locale)}
              </span>
            ))}
          </div>
          {rows.map(([label, value]) => (
            <div className="v3-deep-compare__row" key={label}>
              <b>{label}</b>
              {profiles.map((profile) => <span key={profile.slug}>{value(profile)}</span>)}
            </div>
          ))}
        </div>
      </details>
    </section>

    <details className="v2-section v3-similar v3-similar-disclosure">
      <summary className="section-lead v3-similar-disclosure__summary"><h2>{compareContinueResearchCopy[locale] || compareContinueResearchCopy.en}</h2><span>{detailLinksByLocale[textLocaleKey(locale)] || detailLinksByLocale.en}</span><b aria-hidden="true">＋</b></summary>
      <div className="v3-similar-grid">
        {profiles.map((profile) => (
          <LocalLink key={profile.slug} locale={locale} href={`/exchanges/${profile.slug}?${contextSearch}`}>
            <BrandMark slug={profile.slug} compact />
            <span translate="no" lang={isZhLoc ? "zh-Hans" : "en"}>{getLocalizedVenueName(profile, locale)}</span>
            <small>{text.openDetail}</small>
          </LocalLink>
        ))}
      </div>
            <CompareGoldMatrixNav currentSlugs={selected} locale={locale} market={market} product={product} accountStage={accountStage} funding={funding} />
            <OnsiteTelegramBotHandoff
              canonicalPath={`/compare/${compareSlugKey}`}
              locale={locale}
              market={market}
              product={product}
              placement={`compare-onsite-bot-handoff-${compareSlugKey}`}
            />
      <p>{text.ctaLocked}</p>
    </details>
    </CompareNotesGroup>
  </main>;
}

const compareNotesGroupCopy = {
  en: ["Sources and decision notes", "Before you register"],
  "zh-Hans": ["来源与判断依据", "注册前核对"],
  "zh-Hant": ["來源與判斷依據", "註冊前核對"],
  es: ["Fuentes y notas de decisión", "Antes de registrarte"],
  "pt-BR": ["Fontes e notas de decisão", "Antes de se cadastrar"],
  fr: ["Sources et notes de décision", "Avant de vous inscrire"],
  de: ["Quellen und Entscheidungsnotizen", "Vor der Registrierung"],
  ja: ["出典と判断メモ", "登録前の確認"],
  ko: ["출처와 판단 메모", "가입 전 확인"],
  tr: ["Kaynaklar ve karar notları", "Kayıt olmadan önce"],
  ru: ["Источники и заметки к решению", "Перед регистрацией"],
  ar: ["المصادر وملاحظات القرار", "قبل التسجيل"],
  id: ["Sumber dan catatan keputusan", "Sebelum mendaftar"],
  vi: ["Nguồn và ghi chú quyết định", "Trước khi đăng ký"],
  it: ["Fonti e note decisionali", "Prima di registrarti"],
};
// Groups consecutive compare disclosures under one row. Off (children rendered as-is) outside the two-venue answer layout.
function CompareNotesGroup({ kind, locale, enabled, children }) {
  if (!enabled) return <>{children}</>;
  const copy = compareNotesGroupCopy[locale] || compareNotesGroupCopy[textLocaleKey(locale)] || compareNotesGroupCopy.en;
  return (
    <details className={`v2-section v3-compare-group v3-compare-group--${kind}`}>
      <summary className="v3-compare-group__summary"><span>{copy[kind === "notes" ? 0 : 1]}</span><b aria-hidden="true">＋</b></summary>
      <div className="v3-compare-group__body">{children}</div>
    </details>
  );
}

const compareContinueResearchCopy = {
  "en": "Continue research",
  "zh-Hans": "继续研究",
  "zh-Hant": "繼續研究",
  "ja": "調査を続ける",
  "ko": "조사 계속하기",
  "tr": "Araştırmaya devam edin",
  "ar": "متابعة البحث",
  "es": "Continuar la investigación",
  "pt-BR": "Continuar a pesquisa",
  "fr": "Poursuivre la recherche",
  "de": "Recherche fortsetzen",
  "ru": "Продолжить исследование",
  "id": "Lanjutkan penelitian",
  "vi": "Tiếp tục nghiên cứu",
  "it": "Continuare la ricerca"
};

const compareFaqScopeCopy = {
 en: "These FAQs cover the first two platforms. Check the comparison table and sources for all selected platforms.",
 "zh-Hans": "这些问答比较前两家平台；全部所选平台请结合对比表与来源核对。",
 "zh-Hant": "這些問答比較前兩家平台；全部所選平台請結合比較表與來源核對。",
 ja: "このFAQは最初の2つのプラットフォームが対象です。選択した全プラットフォームは比較表と出典で確認してください。",
 ko: "이 FAQ는 처음 두 플랫폼을 다룹니다. 선택한 모든 플랫폼은 비교표와 출처에서 확인하세요.",
 tr: "Bu SSS ilk iki platformu kapsar. Seçilen tüm platformlar için karşılaştırma tablosunu ve kaynakları kontrol edin.",
 ar: "تتناول هذه الأسئلة المنصتين الأوليين. راجع جدول المقارنة والمصادر لجميع المنصات المحددة.",
 es: "Estas preguntas cubren las dos primeras plataformas. Consulta la tabla comparativa y las fuentes para todas las plataformas seleccionadas.",
 "pt-BR": "Estas perguntas cobrem as duas primeiras plataformas. Consulte a tabela comparativa e as fontes de todas as plataformas selecionadas.",
 fr: "Ces questions portent sur les deux premières plateformes. Consultez le tableau comparatif et les sources pour toutes les plateformes sélectionnées.",
 de: "Diese FAQ behandeln die ersten beiden Plattformen. Prüfen Sie die Vergleichstabelle und Quellen für alle ausgewählten Plattformen.",
 ru: "Эти вопросы относятся к первым двум платформам. Для всех выбранных платформ проверьте таблицу сравнения и источники.",
 id: "FAQ ini membahas dua platform pertama. Periksa tabel perbandingan dan sumber untuk semua platform yang dipilih.",
 vi: "Các câu hỏi này đề cập đến hai nền tảng đầu tiên. Hãy kiểm tra bảng so sánh và nguồn cho tất cả nền tảng đã chọn.",
 it: "Queste domande riguardano le prime due piattaforme. Consulta la tabella comparativa e le fonti per tutte le piattaforme selezionate."
};

const profileResearchChapterCopy = {
  "en": [
    "Account and costs",
    "Sources and security",
    "Continue following"
  ],
  "zh-Hans": [
    "账户与成本",
    "来源与安全",
    "持续跟进"
  ],
  "zh-Hant": [
    "帳戶與成本",
    "來源與安全",
    "持續跟進"
  ],
  "ja": [
    "アカウントと費用",
    "出典と安全性",
    "継続して確認"
  ],
  "ko": [
    "계정과 비용",
    "출처와 보안",
    "계속 확인"
  ],
  "tr": [
    "Hesap ve maliyetler",
    "Kaynaklar ve güvenlik",
    "Takibe devam"
  ],
  "ar": [
    "الحساب والتكاليف",
    "المصادر والأمان",
    "المتابعة المستمرة"
  ],
  "es": [
    "Cuenta y costes",
    "Fuentes y seguridad",
    "Continuar el seguimiento"
  ],
  "pt-BR": [
    "Conta e custos",
    "Fontes e segurança",
    "Continuar acompanhando"
  ],
  "fr": [
    "Compte et coûts",
    "Sources et sécurité",
    "Poursuivre le suivi"
  ],
  "de": [
    "Konto und Kosten",
    "Quellen und Sicherheit",
    "Weiter verfolgen"
  ],
  "ru": [
    "Аккаунт и расходы",
    "Источники и безопасность",
    "Продолжить наблюдение"
  ],
  "id": [
    "Akun dan biaya",
    "Sumber dan keamanan",
    "Lanjutkan pemantauan"
  ],
  "vi": [
    "Tài khoản và chi phí",
    "Nguồn và bảo mật",
    "Tiếp tục theo dõi"
  ],
  "it": [
    "Account e costi",
    "Fonti e sicurezza",
    "Continuare a seguire"
  ]
};

const profileAccountDisclosureCopy = {
  "en": "Invitation, fees and registration checks",
  "zh-Hans": "邀请、费用与注册检查",
  "zh-Hant": "邀請、費用與註冊檢查",
  "ja": "招待・費用・登録前の確認",
  "ko": "초대·비용·가입 전 확인",
  "tr": "Davet, ücretler ve kayıt kontrolleri",
  "ar": "الدعوة والرسوم وفحوصات التسجيل",
  "es": "Invitación, comisiones y comprobaciones de registro",
  "pt-BR": "Convite, taxas e verificações de cadastro",
  "fr": "Invitation, frais et vérifications d’inscription",
  "de": "Einladung, Gebühren und Registrierungsprüfung",
  "ru": "Приглашение, комиссии и проверки регистрации",
  "id": "Undangan, biaya, dan pemeriksaan pendaftaran",
  "vi": "Lời mời, phí và kiểm tra đăng ký",
  "it": "Invito, commissioni e verifiche di registrazione"
};

export function NotFoundPage({ locale }) {
  const text = v3Copy(locale);
  return <main className="v6 v2-page v3-page v3-page--empty" id="top">
    <section className="v3-page-hero v2-shell">
      <LocalLink locale={locale} href="/" className="v3-back-link">{text.home}</LocalLink>
      <div className="v3-venue-hero">
        <span className="v3-independent-badge">{text.independent}</span>
        <h1>404</h1>
        <p>{text.activityNotFound}</p>
        <p className="v3-relationship-note">{text.relationship}</p>
      </div>
    </section>
  </main>;
}
