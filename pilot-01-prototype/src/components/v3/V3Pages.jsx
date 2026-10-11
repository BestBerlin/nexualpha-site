import { pendingDecisionCopy } from "../../data/pending-decision-copy.js";
import "./profile-density.css";
import { enAttrs } from "../../utils/fallback-lang.js";
import { useEffect, useState } from "react";
import { SectionRule } from "../shared/DataRule.jsx";
import { buildDecisionReturnHref } from "../../data/decision-return.js";
import { DecisionReturnLink } from "./DecisionReturnLink.jsx";
import { sectionEyebrowAttrs } from "../../data/section-eyebrow.js";
import { BrandMark } from "../brand/BrandMark";
import { venueDatabase } from "../../data/venue-database.js";
import { compareSlug, v3Copy, venueProfile } from "../../data/v3-product";
import { feesStatusLabel } from "./ExchangeFactsV5.jsx";
import { CompareFeeLedger } from "../v6/InnerLedger.jsx";
import { feePctOfRate } from "../../data/exchange-facts.js";
import { matrixCopy } from "./exchange-matrix-copy.js";
import { ResearchComparison } from "./ResearchPanels";
import { VenueFaqSection } from "./VenueFaqSection.jsx";
import { decisionCopy, decisionForVenue, hasReviewedEditorialDecision } from "../../data/venue-decision-content.js";
import { campaignCopy } from "./activity/campaign-copy";
import { researchForVenue } from "../../data/exchange-research";
import { buildVenueFeeSummary, feeSummaryCopy } from "../../data/venue-fee-summary.js";
import { officialCampaignResearchByVenue } from "../../data/official-campaign-research.js";
import { campaignResearchLocalizedText } from "../../data/official-campaign-localizations.js";
import { getLocalizedVenueName } from "../../utils/venue-name-helper.js";
import { OnsiteTelegramBotHandoff } from "./OnsiteTelegramBotHandoff.jsx";
import { directoryContextSearch } from "../../data/directory-context.js";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { sanitizePublicText } from "../../data/public-copy-sanitizer.js";
import { regionalVenueCta } from "../../data/source-bound-cta.js";
import { ctaUiCopy, fillCta } from "../../data/cta-ui-copy.js";
import { compareDirectAnswerFor } from "../../data/compare-direct-answers.js";
import { CURATED_COMPARISON_SLUGS, canonicalComparePath, compareIndexCopy, curatedPairsSharingVenue, generatedCompareCopy, generatedCompareDataDate, generatedComparePolicy, generatedPairsSharingVenue, indexableGeneratedComparePairs, isCuratedComparison } from "../../data/compare-generated.js";
import { CompareAnyPicker } from "../compare/CompareAnyPicker.jsx";
import { CompareHeroActions, CompareFinalChoiceCard, CompareFinalChoiceEvidence } from "./CompareFinalChoiceCard.jsx";
import { compareFaqBadge, compareFaqEntries, compareFaqText, compareStickyAria } from "../../data/compare-faq-locales.js";
import { TelegramReturnBanner } from "./TelegramReturnBanner.jsx";
import { footerDisclosureLabel } from "./CleanFooter.jsx";
import { CommissionDisclosureLine } from "./CommissionDisclosureLine.jsx";
import { formatPercent } from "../../data/format-percent.js";
import "./crossroads-compare.css";
import "./growth-conversion.css";
import { localeKey, textLocaleKey, zhText, localePending, interfaceText, detailCtaLabel, LocalLink, publishableFeeRate } from "./v3-pages-shared.jsx";

export { ActivityCenterPage, ActivityDetailPage } from "./activity/ActivityPages";
export { VenueFaqSection } from "./VenueFaqSection.jsx";

const sourceStatusLabel = (text, venue) => venue.sourceHubs?.length ? text.openOfficialSource : text.pendingReview;
const linkedNotReviewed = (locale) => {
  const k = String(locale || "en");
  if (k.startsWith("zh")) return k === "zh-Hant" || k === "zh-TW" || k === "zh-HK" ? "已連結官方頁面，數字尚未複核" : "已链接官方页面，数字尚未复核";
  return ({ ja: "公式ページあり・数値は未確認", ko: "공식 페이지 연결됨, 수치 미검토", es: "Página oficial enlazada, cifras sin revisar", "pt-BR": "Página oficial vinculada, números ainda não revisados", pt: "Página oficial vinculada, números ainda não revisados", fr: "Page officielle liée, chiffres non encore vérifiés", de: "Offizielle Seite verlinkt, Zahlen noch nicht geprüft", it: "Pagina ufficiale collegata, cifre non ancora verificate", ru: "Официальная страница указана, цифры ещё не проверены", tr: "Resmî sayfa bağlantılı, rakamlar henüz incelenmedi", id: "Halaman resmi ditautkan, angka belum ditinjau", vi: "Đã liên kết trang chính thức, số liệu chưa được rà soát", ar: "الصفحة الرسمية مرتبطة، والأرقام لم تُراجع بعد",
  // l10n: needs native review
  ur: "سرکاری صفحہ منسلک ہے، اعداد ابھی دوبارہ نہیں دیکھے گئے",
  // l10n: needs native review
  uk: "Офіційну сторінку пов’язано, цифри ще не перевірені" })[k] || "Official page linked, figures not yet reviewed";
};
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
  // l10n: needs native review
  ur: "کوڈ",
  // l10n: needs native review
  uk: "Код",
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
  // l10n: needs native review
  ur: "بنیادی KYC (صرف شناختی دستاویز)",
  // l10n: needs native review
  uk: "Базовий KYC (лише документ)",
};

const compareReviewChoiceByLocale = {
  en: "Review choice", "zh-Hans": "查看选择", "zh-Hant": "查看選擇",
  es: "Revisar opción", "pt-BR": "Revisar escolha", fr: "Examiner le choix",
  de: "Auswahl prüfen", ja: "選択を確認", ko: "선택 확인", ar: "مراجعة الاختيار",
  tr: "Seçimi incele", ru: "Проверить выбор", id: "Tinjau pilihan",
  vi: "Xem lựa chọn", it: "Valuta la scelta",
  // l10n: needs native review
  ur: "انتخاب دیکھیں",
  // l10n: needs native review
  uk: "Переглянути вибір",
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
  // l10n: needs native review
  ur: "فیس، ذخائر اور KYC دیکھیں",
  // l10n: needs native review
  uk: "Переглянути комісії, резерви та KYC",
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
  // l10n: needs native review
  ur: "پلیٹ فارم تفصیلی لنکس کھولیں",
  // l10n: needs native review
  uk: "Відкрити детальні посилання платформ",
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
  // l10n: needs native review
  ur: {
    persona: (name) => `پہلے ${name} کی علاقائی اہلیت، پروڈکٹ دائرہ اور سرکاری فیس شیڈول چیک کریں`,
    productSources: (name) => `${name} کی عوامی مصنوعات، فیس اور علاقائی شرائط سرکاری ماخذ سے چیک ہونی چاہییں`,
    feeReference: (spot, futures, sourceBound) => `شائع شدہ فیس حوالہ: اسپاٹ ${spot}، فیوچرز ${futures}؛ ${sourceBound}`,
    feePending: (sourceBound) => `شائع شدہ فیس ماخذ ابھی جائزے کے منتظر ہیں؛ ${sourceBound}`,
    reserves: "ذخائر، ادائیگی کی صلاحیت اور سکیورٹی دعوے سرکاری ماخذ کی تصدیق کے منتظر ہیں",
    leverage: "لیوریج، مارجن، لیکویڈیشن اور پروڈکٹ حدیں موجودہ علاقہ اور اکاؤنٹ کے مطابق تصدیق طلب ہیں",
  },
  // l10n: needs native review
  uk: {
    persona: (name) => `Спершу перевірте регіональну доступність, охоплення продуктів і офіційний графік комісій ${name}`,
    productSources: (name) => `Публічні продукти, комісії та регіональні умови ${name} слід звіряти з офіційними джерелами`,
    feeReference: (spot, futures, sourceBound) => `Опублікований орієнтир комісій: спот ${spot}, ф’ючерси ${futures}; ${sourceBound}`,
    feePending: (sourceBound) => `Опубліковані джерела комісій ще потребують перегляду; ${sourceBound}`,
    reserves: "Резерви, платоспроможність і безпекові заяви ще не перевірені за офіційними джерелами",
    leverage: "Плече, маржа, ліквідація та продуктові ліміти потребують перевірки для поточного регіону й акаунта",
  },
};

const compareDecisionGuideCopy = (locale) => compareDecisionGuideCopyByLocale[textLocaleKey(locale)] || compareDecisionGuideCopyByLocale.en;

// Lead of the compare decision guide (eyebrow, H2, subtitle) for every UI locale; previously only zh/en existed.
export const compareDecisionLeadCopyByLocale = {
  en: { eyebrow: "PRE-SIGNUP DECISION CHECKLIST", title: (a, b) => `${a} vs ${b}: which conditions should you compare?`, subtitle: "Check published fees, product scope, regional eligibility, account requirements and source dates before entering a signup flow." },
  "zh-Hans": { eyebrow: "开户前选型清单", title: (a, b) => `${a} 与 ${b}：哪些条件需要逐项比较？`, subtitle: "按公开费率、产品范围、地区资格、账户要求和来源日期核对，再决定是否进入注册流程。" },
  "zh-Hant": { eyebrow: "開戶前選型清單", title: (a, b) => `${a} 與 ${b}：哪些條件需要逐項比較？`, subtitle: "按公開費率、產品範圍、地區資格、帳戶要求和來源日期核對，再決定是否進入註冊流程。" },
  // l10n: needs native review
  ja: { eyebrow: "登録前の判断チェックリスト", title: (a, b) => `${a} と ${b}：どの条件を比較すべきか？`, subtitle: "公開手数料、商品範囲、地域の利用資格、口座要件、出典日を確認したうえで、登録手続きに進むか判断してください。" },
  // l10n: needs native review
  ko: { eyebrow: "가입 전 판단 체크리스트", title: (a, b) => `${a} vs ${b}: 어떤 조건을 비교해야 할까요?`, subtitle: "공개 수수료, 상품 범위, 지역별 자격, 계정 요건과 출처 날짜를 확인한 뒤 가입 절차로 넘어가세요." },
  // l10n: needs native review
  tr: { eyebrow: "KAYIT ÖNCESİ KARAR LİSTESİ", title: (a, b) => `${a} ve ${b}: hangi koşulları karşılaştırmalısınız?`, subtitle: "Kayıt akışına girmeden önce yayımlanan ücretleri, ürün kapsamını, bölgesel uygunluğu, hesap gereksinimlerini ve kaynak tarihlerini kontrol edin." },
  es: { eyebrow: "LISTA DE DECISIÓN ANTES DEL REGISTRO", title: (a, b) => `${a} vs ${b}: ¿qué condiciones debería comparar?`, subtitle: "Compruebe comisiones publicadas, alcance de productos, elegibilidad regional, requisitos de cuenta y fechas de las fuentes antes de iniciar un registro." },
  "pt-BR": { eyebrow: "CHECKLIST DE DECISÃO ANTES DO CADASTRO", title: (a, b) => `${a} vs ${b}: quais condições você deve comparar?`, subtitle: "Verifique taxas publicadas, escopo de produtos, elegibilidade regional, requisitos de conta e datas das fontes antes de iniciar um cadastro." },
  fr: { eyebrow: "CHECKLIST DE DÉCISION AVANT INSCRIPTION", title: (a, b) => `${a} vs ${b} : quelles conditions comparer ?`, subtitle: "Vérifiez les frais publiés, le périmètre produit, l’éligibilité régionale, les exigences de compte et les dates des sources avant d’entamer une inscription." },
  de: { eyebrow: "ENTSCHEIDUNGS-CHECKLISTE VOR DER REGISTRIERUNG", title: (a, b) => `${a} vs. ${b}: Welche Bedingungen sollten Sie vergleichen?`, subtitle: "Prüfen Sie veröffentlichte Gebühren, Produktumfang, regionale Berechtigung, Kontoanforderungen und Quellendaten, bevor Sie eine Registrierung beginnen." },
  it: { eyebrow: "CHECKLIST DECISIONALE PRIMA DELLA REGISTRAZIONE", title: (a, b) => `${a} vs ${b}: quali condizioni confrontare?`, subtitle: "Verifica commissioni pubblicate, ambito prodotti, idoneità regionale, requisiti dell’account e date delle fonti prima di avviare una registrazione." },
  // l10n: needs native review
  ru: { eyebrow: "ЧЕК-ЛИСТ ПЕРЕД РЕГИСТРАЦИЕЙ", title: (a, b) => `${a} и ${b}: какие условия стоит сравнить?`, subtitle: "Проверьте опубликованные комиссии, охват продуктов, региональную доступность, требования к аккаунту и даты источников, прежде чем начинать регистрацию." },
  // l10n: needs native review
  id: { eyebrow: "DAFTAR PERIKSA SEBELUM MENDAFTAR", title: (a, b) => `${a} vs ${b}: syarat apa yang perlu dibandingkan?`, subtitle: "Periksa biaya yang dipublikasikan, cakupan produk, kelayakan regional, persyaratan akun, dan tanggal sumber sebelum memulai pendaftaran." },
  // l10n: needs native review
  vi: { eyebrow: "DANH SÁCH KIỂM TRA TRƯỚC KHI ĐĂNG KÝ", title: (a, b) => `${a} và ${b}: nên so sánh những điều kiện nào?`, subtitle: "Kiểm tra phí công bố, phạm vi sản phẩm, điều kiện theo khu vực, yêu cầu tài khoản và ngày của nguồn trước khi bắt đầu đăng ký." },
  // l10n: needs native review
  ar: { eyebrow: "قائمة القرار قبل التسجيل", title: (a, b) => `${a} مقابل ${b}: أي الشروط ينبغي مقارنتها؟`, subtitle: "تحقق من الرسوم المنشورة ونطاق المنتجات والأهلية الإقليمية ومتطلبات الحساب وتواريخ المصادر قبل بدء التسجيل." },
  // l10n: needs native review
  ur: { eyebrow: "رجسٹریشن سے پہلے فیصلہ فہرست", title: (a, b) => `${a} اور ${b}: کن شرائط کا موازنہ کرنا چاہیے؟`, subtitle: "رجسٹریشن شروع کرنے سے پہلے شائع شدہ فیس، مصنوعات کا دائرہ، علاقائی اہلیت، اکاؤنٹ شرائط اور ذریعہ تاریخیں چیک کریں۔" },
  // l10n: needs native review
  uk: { eyebrow: "СПИСОК ПЕРЕВІРКИ ПЕРЕД РЕЄСТРАЦІЄЮ", title: (a, b) => `${a} і ${b}: які умови варто порівняти?`, subtitle: "Перед реєстрацією перевірте опубліковані комісії, охоплення продуктів, регіональну доступність, вимоги до акаунта й дати джерел." },
};
const compareDecisionLeadCopy = (locale) => compareDecisionLeadCopyByLocale[textLocaleKey(locale)] || compareDecisionLeadCopyByLocale.en;


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
    // l10n: needs native review
    ur: { curatedOpen: "منتخب موازنے کھولیں", curatedTitle: "منتخب پلیٹ فارم موازنے", curatedHint: "فیس، مصنوعات اور علاقائی شرائط کا موازنہ کریں", compareBadge: "موازنہ", jump: "حصے پر جائیں", official: "سرکاری ماخذ کے ساتھ موازنہ", matrix: "فیس، ذخائر اور حدوں کا موازنہ", matrixLead: "موازنہ سرکاری ماخذ اور تصدیق شدہ شرائط پر مبنی ہے۔", review: "تفصیلات اور حدیں دیکھیں", sources: "سرکاری ماخذ", visit: "سرکاری سائٹ کھولیں", faq: "موازنے کے سوالات", faqLead: "دو پلیٹ فارمز کے درمیان انتخاب کے لیے ماخذ والی جوابات۔", metrics: "میٹرکس", trust: "اعتماد اسکور", spotFee: "اسپاٹ میکر / ٹیکر فیس", futuresFee: "فیوچرز میکر / ٹیکر فیس", benefitStatus: "فائدہ حالت", netCost: "موثر خالص لاگت", por: "ذخائر کا ثبوت (PoR)", kyc: "KYC تقاضے", leverage: "زیادہ سے زیادہ فیوچرز لیوریج", bonus: "نئے صارف فوائد" },
    // l10n: needs native review
    uk: { curatedOpen: "Відкрити вибрані порівняння", curatedTitle: "Вибрані порівняння платформ", curatedHint: "Порівняйте комісії, продукти та регіональні умови", compareBadge: "ПОРІВНЯТИ", jump: "Перейти до розділу", official: "Порівняння з офіційними джерелами", matrix: "Порівняння комісій, резервів і лімітів", matrixLead: "Порівняння на основі офіційних джерел і перевірених умов.", review: "Переглянути деталі та обмеження", sources: "Офіційні джерела", visit: "Відвідати офіційний сайт", faq: "FAQ порівняння", faqLead: "Відповіді з джерелами для вибору між двома платформами.", metrics: "Показники", trust: "Оцінка довіри", spotFee: "Спотова комісія maker / taker", futuresFee: "Ф’ючерсна комісія maker / taker", benefitStatus: "Статус умов для користувача", netCost: "Ефективна чиста вартість", por: "Підтвердження резервів (PoR)", kyc: "Вимоги KYC", leverage: "Максимальне плече ф’ючерсів", bonus: "Умови для нових користувачів" },
  }[textLocaleKey(locale)] || {};
  // Plain-language name for the side-by-side numbers block (was the untranslated internal word "Metrics").
  const metrics = {
    en: "Side-by-side numbers", "zh-Hans": "数据对比", "zh-Hant": "數據對比", es: "Cifras lado a lado", "pt-BR": "Números lado a lado",
    fr: "Chiffres côte à côte", de: "Zahlen im Vergleich", ja: "数値の比較", ko: "수치 비교", ar: "مقارنة الأرقام",
    tr: "Rakamlar yan yana", ru: "Цифры рядом", id: "Angka berdampingan", vi: "So sánh số liệu", it: "Numeri a confronto",

    // l10n: needs native review
    ur: "اعداد ساتھ ساتھ",
    // l10n: needs native review
    uk: "Числа поруч",
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
    // l10n: needs native review
    ur: { hintSpot: "معیاری اسپاٹ ٹریڈنگ فیس", hintFutures: "معیاری پرپیچوئل فیوچرز فیس" },
    // l10n: needs native review
    uk: { hintSpot: "Стандартні комісії спотової торгівлі", hintFutures: "Стандартні комісії безстрокових ф’ючерсів" },
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
  // l10n: needs native review
  ur: "BTC/ETH پرپیچوئل کنٹریکٹس",
  // l10n: needs native review
  uk: "Безстрокові контракти BTC/ETH",
}[textLocaleKey(locale)] || "BTC/ETH perpetual contracts");

const compareCompactLabel = (locale, key) => {
  const labels = {
    compareFirst: {
      en: "Compare first", "zh-Hans": "先比较", "zh-Hant": "先比較", es: "Comparar primero", "pt-BR": "Comparar primeiro", fr: "Comparer d’abord", de: "Zuerst vergleichen", ja: "まず比較", ko: "먼저 비교", ar: "قارن أولاً", tr: "Önce karşılaştır", ru: "Сначала сравнить", id: "Bandingkan dulu", vi: "So sánh trước", it: "Confronta prima",
      // l10n: needs native review
      ur: "پہلے موازنہ",
      // l10n: needs native review
      uk: "Спершу порівняти",
    },
    nextStep: {
      en: "Next step", "zh-Hans": "下一步", "zh-Hant": "下一步", es: "Siguiente paso", "pt-BR": "Próximo passo", fr: "Étape suivante", de: "Nächster Schritt", ja: "次のステップ", ko: "다음 단계", ar: "الخطوة التالية", tr: "Sonraki adım", ru: "Следующий шаг", id: "Langkah berikutnya", vi: "Bước tiếp theo", it: "Prossimo passo",
      // l10n: needs native review
      ur: "اگلا قدم",
      // l10n: needs native review
      uk: "Наступний крок",
    },
    join: {
      en: "Join", "zh-Hans": "开户", "zh-Hant": "開戶", es: "Registrarse", "pt-BR": "Cadastrar", fr: "S’inscrire", de: "Registrieren", ja: "登録", ko: "가입", ar: "تسجيل", tr: "Katıl", ru: "Регистрация", id: "Daftar", vi: "Đăng ký", it: "Registrati",
      // l10n: needs native review
      ur: "رجسٹر",
      // l10n: needs native review
      uk: "Реєстрація",
    },
    verify: {
      en: "Verify", "zh-Hans": "先核对", "zh-Hant": "先核對", es: "Verificar", "pt-BR": "Verificar", fr: "Vérifier", de: "Prüfen", ja: "確認", ko: "확인", ar: "تحقق", tr: "Doğrula", ru: "Проверить", id: "Periksa", vi: "Kiểm tra", it: "Verifica",
      // l10n: needs native review
      ur: "تصدیق",
      // l10n: needs native review
      uk: "Перевірити",
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
  // l10n: needs native review
  ur: {
    scrollHint: "تمام کالمز کا موازنہ کرنے کے لیے میٹرکس کو ایک طرف سوائپ کریں۔",
    pendingTitle: "وہ آئٹمز جو ابھی چیک نہیں ہوئے",
    pendingSummary: "ابھی غیر چیک شدہ آئٹمز دکھائیں",
    pendingLead: "یہ قطاریں اس لیے اکٹھی کی گئی ہیں کہ منتخب تمام پلیٹ فارمز کو ابھی سرکاری ماخذ کی تصدیق چاہیے۔ کھولنے پر اصل فیلڈ نام اور حدیں نظر رہتی ہیں۔",
    pendingSuffix: "جب تک کم از کم ایک پلیٹ فارم کے پاس ماخذ والی قدر نہ ہو، اسے اسکور شدہ فرق کے طور پر نہیں دکھایا جاتا۔",
  },
  // l10n: needs native review
  uk: {
    scrollHint: "Проведіть матрицю вбік, щоб порівняти всі колонки.",
    pendingTitle: "Пункти, які ми ще не перевірили",
    pendingSummary: "Показати ще не перевірені пункти",
    pendingLead: "Ці рядки згруповано, бо всі вибрані платформи ще потребують перевірки офіційного джерела. Після відкриття зберігаються початкові назви полів і ліміти.",
    pendingSuffix: "Не показується як оцінювана різниця, доки хоча б одна вибрана платформа не матиме значення з джерелом.",
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

      // l10n: needs native review
      ur: "تفصیلی تحقیقی موازنہ کھولیں",

      // l10n: needs native review
      uk: "Відкрити детальне дослідницьке порівняння",
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

      // l10n: needs native review
      ur: "منظرنامے کی موزونیت اور اگلے قدم کھولیں",

      // l10n: needs native review
      uk: "Відкрити відповідність сценарію та наступні кроки",
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
  // l10n: needs native review
  ur: "تفصیلی جواب سرکاری فیس، ذخائر اور علاقائی شرائط کی جانچ کے بعد دکھایا جاتا ہے۔ رجسٹریشن، KYC اور ٹریڈنگ سرکاری سائٹ پر ہوتی ہیں۔",
  // l10n: needs native review
  uk: "Детальна відповідь показується після перевірки офіційних комісій, резервів і регіональних умов. Реєстрація, KYC і торгівля відбуваються на офіційному сайті.",
}[localeKey(locale)] || "");

const compareShortUi = (locale) => {
  const labels = compareUi(locale);
  return {
    jump: labels.jump || "Jump to",
    matrix: labels.matrix || "Quantitative metric matrix",
    trust: labels.trust || "Trust score",
    audit: ({
      en: "View audit report", "zh-Hans": "查看审计报告", "zh-Hant": "查看稽核報告", es: "Ver informe de auditoría", "pt-BR": "Ver relatório de auditoria", fr: "Voir le rapport d’audit", de: "Auditbericht ansehen", ja: "監査レポートを見る", ko: "감사 보고서 보기", ar: "عرض تقرير التدقيق", tr: "Denetim raporunu görüntüle", ru: "Открыть отчёт аудита", id: "Lihat laporan audit", vi: "Xem báo cáo kiểm toán", it: "Vedi rapporto di audit",

      // l10n: needs native review
      ur: "آڈٹ رپورٹ دیکھیں",
      // l10n: needs native review
      uk: "Переглянути аудиторський звіт",
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
    // l10n: needs native review
    ur: { review: "تفصیلات اور حدیں دیکھیں", spotNet: "اسپاٹ خالص:", futuresNet: "فیوچرز خالص:", strictKyc: "سخت KYC (چہرہ + شناختی دستاویز)", margin: "کراس اور آئسولیٹڈ مارجن", rewards: " صارف فوائد تصدیق طلب", claim: "رجسٹریشن کے بعد فوائد مرکز چیک کریں", signup: "سرکاری سائٹ پر رجسٹر کریں", region: "علاقہ · پروڈکٹ · اکاؤنٹ درجہ", eligibility: "سرکاری عمل سے پہلے اہلیت چیک کریں", accountTerms: "سرکاری اکاؤنٹ شرائط اور ماخذ چیک کریں", netHint: "صارف فائدہ منہا کرنے کے بعد حقیقی لاگت", reserveHint: "Merkle-tree ذخائر کی تصدیق", kycHint: "تصدیقی درجہ اور عمل کی رکاوٹ", rewardHint: "نئے صارف کوپن اور انعام پیک", fewerMetrics: "کم میٹرکس دکھائیں", fullMetrics: "مکمل مقداری میٹرکس دیکھیں", officialAction: "سرکاری کارروائی", antiPhishingPortal: "اینٹی فشنگ سرکاری پورٹل" },
    // l10n: needs native review
    uk: { review: "Переглянути деталі та обмеження", spotNet: "Спот нетто:", futuresNet: "Ф’ючерси нетто:", strictKyc: "Суворий KYC (обличчя + документ)", margin: "Крос- та ізольована маржа", rewards: " Умови для користувача очікують перевірки", claim: "Перевірте центр умов після реєстрації", signup: "Зареєструватися на офіційному сайті", region: "Регіон · продукт · рівень акаунта", eligibility: "Перевірте доступність перед офіційним процесом", accountTerms: "Перевірте офіційні умови акаунта та джерела", netHint: "Реальна вартість після відрахування умови для користувача", reserveHint: "Перевірка резервів через дерево Merkle", kycHint: "Рівень перевірки та складність процесу", rewardHint: "Купони й пакет для нових користувачів", fewerMetrics: "Показати менше показників", fullMetrics: "Переглянути повну кількісну матрицю", officialAction: "Офіційна дія", antiPhishingPortal: "Офіційний антифішинговий портал" },
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

function DecisionBrief({ text, eyebrow, title, body, facts = [] }) {
  return <aside className="v3-decision-brief" aria-label={eyebrow}>
    <span>{eyebrow}</span>
    <h2>{title}</h2>
    <p>{body}</p>
    {facts.length > 0 && <dl>{facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd translate={fact.translate ?? undefined} lang={fact.lang ?? undefined} dir={fact.lang === "en" ? "ltr" : undefined}>{fact.value}</dd></div>)}</dl>}
    <small>{text.ctaLocked}</small>
  </aside>;
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
  const matrixFallback = { es: { official: "Comparación con fuentes oficiales", hint: "Compara comisiones, productos, elegibilidad regional y fecha de la fuente" }, de: { official: "Vergleich mit offiziellen Quellen", hint: "Gebühren, Produkte, regionale Eignung und Quelldatum prüfen" }, ja: { official: "公式ソース比較", hint: "手数料、商品、地域資格、出典日を確認" }, ko: { official: "공식 출처 비교", hint: "수수료, 상품, 지역 자격과 출처 날짜를 확인하세요" }, tr: { official: "Resmî kaynak karşılaştırması", hint: "Ücretleri, ürünleri, bölgesel uygunluğu ve kaynak tarihini kontrol edin" }, ar: { official: "مقارنة المصادر الرسمية", hint: "تحقق من الرسوم والمنتج والأهلية الإقليمية وتاريخ المصدر" }, "pt-BR": { official: "Comparação de fontes oficiais", hint: "Confira taxas, produtos, elegibilidade regional e data da fonte" }, fr: { official: "Comparaison des sources officielles", hint: "Comparez frais, produits, éligibilité régionale et dates des sources" }, ru: { official: "Сравнение по официальным источникам", hint: "Сравните комиссии, продукты, региональную доступность и даты источников" }, id: { official: "Perbandingan sumber resmi", hint: "Bandingkan biaya, produk, kelayakan wilayah, dan tanggal sumber" }, vi: { official: "So sánh theo nguồn chính thức", hint: "So sánh phí, sản phẩm, điều kiện theo khu vực và ngày nguồn" }, it: { official: "Confronto delle fonti ufficiali", hint: "Confronta commissioni, prodotti, idoneità regionale e date delle fonti" },
  // l10n: needs native review
  ur: { official: "سرکاری ماخذ کا موازنہ", hint: "فیس، پروڈکٹس، علاقائی اہلیت اور ماخذ تاریخ چیک کریں" },
  // l10n: needs native review
  uk: { official: "Порівняння за офіційними джерелами", hint: "Перевірте комісії, продукти, регіональну доступність і дати джерел" } }[locale] || { official: "Official-source comparison", hint: "Compare fees, products, regional eligibility and source dates" };

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
  const leadCopy = compareDecisionLeadCopy(locale);
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
           {leadCopy.eyebrow}
        </span>
        <h2 className="v3-decision-title">
          {leadCopy.title(isZh ? nameA : pA.name, isZh ? nameB : pB.name)}
        </h2>
        <p className="v3-decision-subtitle">
          {leadCopy.subtitle}
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
            {isZh ? "适合谁 (Target Persona)" : ({ ja: "対象ユーザー", ko: "적합한 사용자", tr: "Uygun kullanıcı profili", fr: "Profil de trader idéal", de: "Passendes Traderprofil", es: "Perfil de trader ideal", "pt-BR": "Perfil ideal do trader", ru: "Профиль подходящего трейдера", ar: "ملف المتداول المناسب", id: "Profil trader yang sesuai", vi: "Hồ sơ nhà giao dịch phù hợp", it: "Profilo trader ideale",
            // l10n: needs native review
            ur: "مناسب ٹریڈر پروفائل",
            // l10n: needs native review
            uk: "Профіль відповідного трейдера" }[localeKey(locale)] || "Ideal Trader Profile")}
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
            {isZh ? "适合谁 (Target Persona)" : ({ ja: "対象ユーザー", ko: "적합한 사용자", tr: "Uygun kullanıcı profili", fr: "Profil de trader idéal", de: "Passendes Traderprofil", es: "Perfil de trader ideal", "pt-BR": "Perfil ideal do trader", ru: "Профиль подходящего трейдера", ar: "ملف المتداول المناسب", id: "Profil trader yang sesuai", vi: "Hồ sơ nhà giao dịch phù hợp", it: "Profilo trader ideale",
            // l10n: needs native review
            ur: "مناسب ٹریڈر پروفائل",
            // l10n: needs native review
            uk: "Профіль відповідного трейдера" }[localeKey(locale)] || "Ideal Trader Profile")}
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
  // l10n: needs native review
  ur: { pendingRate: "فیس سرکاری ماخذ کی تصدیق کے منتظر", pendingBenefit: "صارف فائدہ سرکاری اکاؤنٹ تصدیق کے منتظر", base: "سرکاری بنیادی فیس شیڈولز (صرف تصدیق شدہ ماخذ)", net: "صارف فائدہ اور خالص فیس کی تصدیق", netUnavailable: "خالص فیس تصدیق طلب", sourceBound: "صرف وہ میکر/ٹیکر ریٹس دکھائے جاتے ہیں جن کے ساتھ جائزہ تاریخ اور HTTPS سرکاری ماخذ ہو۔", verdict: "نتیجہ: پہلے ماخذ سے منسلک سرکاری بنیادی فیس شیڈولز کا موازنہ کریں؛ صارف فائدہ اور خالص لاگت صرف سرکاری اکاؤنٹ شرائط کی تصدیق کے بعد دکھتے ہیں۔", spotNet: "اسپاٹ خالص", futuresNet: "فیوچرز خالص", benefit: "صارف فائدہ" },
  // l10n: needs native review
  uk: { pendingRate: "Комісія очікує перевірки офіційного джерела", pendingBenefit: "Умова для користувача очікує перевірки в офіційному акаунті", base: "Офіційні базові графіки комісій (лише перевірені джерела)", net: "Перевірка умови для користувача та чистої комісії", netUnavailable: "Чиста комісія очікує перевірки", sourceBound: "Показуються лише ставки maker/taker з датою перегляду та офіційним HTTPS-джерелом.", verdict: "Висновок: спершу порівнюйте офіційні базові графіки з джерелами; умови для користувача й чиста вартість з’являються лише після перевірки умов офіційного акаунта.", spotNet: "Спот нетто", futuresNet: "Ф’ючерси нетто", benefit: "Умова для користувача" },
};
const compareFeeSurfaceCopy = (locale) => compareFeeSurfaceCopyTable[locale] || compareFeeSurfaceCopyTable[localeKey(locale)] || (String(locale || "").startsWith("zh") ? compareFeeSurfaceCopyTable["zh-Hans"] : compareFeeSurfaceCopyTable.en);

// One formatter (exchange-facts.js): maker first, same decimals as the facts file.
const formatCompareRate = (rate) => feePctOfRate(rate);
const formatVerifiedNet = (rate, rebate, product = "spot") => rate?.publishable && Number.isFinite(rebate)
  ? formatCompareRate(rate.takerRate * (1 - rebate / 100))
  : null;

const compareTupleEntries = (value) => {
  if (Array.isArray(value)) return value.map((entry) => Array.isArray(entry) ? entry : [String(entry), ""]);
  if (value && typeof value === "object") return Object.entries(value);
  return [];
};

export function CompareFaqSection({ profiles, locale = "en" }) {
  if (!profiles || profiles.length < 2) return null;
  const [showAllFaqs, setShowAllFaqs] = useState(false);

  const pA = profiles[0];
  const pB = profiles[1];
  const nameA = getLocalizedVenueName(pA, locale) || pA.name;
  const nameB = getLocalizedVenueName(pB, locale) || pB.name;

  const compareSlugKey = profiles.map((profile) => profile.slug).join("-vs-");
  const priorityAnswer = compareDirectAnswerFor(compareSlugKey, locale);
  const priorityFaqEntries = priorityAnswer
    ? (Array.isArray(priorityAnswer.faq)
      ? priorityAnswer.faq.map((entry) => Array.isArray(entry) ? entry : [entry?.q || entry?.question || "", entry?.a || entry?.answer || ""])
      : compareTupleEntries(priorityAnswer.faq))
    : [];
  const priorityFaqs = priorityAnswer
    ? [
        { q: priorityAnswer.seoQuestion, a: priorityAnswer.body, priority: true },
        ...priorityFaqEntries.map(([q, a]) => ({ q, a, priority: true })),
      ]
    : null;

  const localizedFaqs = compareFaqEntries(locale, { nameA, nameB }).map((faq) => ({ ...faq, localized: true }));


  const faqs = priorityFaqs || localizedFaqs;

  return (
    <section className="v2-section v3-faq-section" id="compare-faq">
      <SectionRule stamp={faqs.length || null} />
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
  const reviewedDir = ["ar", "ur"].includes(reviewedLocale) ? "rtl" : "ltr";
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
    // l10n: needs native review
    ur: "ماخذ والی فیس، ذخائر، KYC، پروڈکٹ حدیں اور صارف فائدہ حالت کا موازنہ کریں؛ غیر تصدیق شدہ چیزیں زیر التوا رہتی ہیں۔",
    // l10n: needs native review
    uk: "Порівнюйте комісії з джерелами, резерви, KYC, продуктові ліміти й статус умов для користувача; неперевірені пункти залишаються очікуваними.",
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
      <SectionRule />
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
                          <strong className={Number.isFinite(d.effectiveSpotTaker) ? undefined : "is-pending"}>{Number.isFinite(d.effectiveSpotTaker) ? feePctOfRate(d.effectiveSpotTaker, locale) : localePending(locale)}</strong>
                          <span className="v3-matrix-net-label">|</span>
                          <span className="v3-matrix-net-label">{isZh ? "合约净:" : compareDetailPhrase(locale, "futuresNet", "Futures Net:")}</span>
                          <strong className={Number.isFinite(d.effectiveFuturesTaker) ? undefined : "is-pending"}>{Number.isFinite(d.effectiveFuturesTaker) ? feePctOfRate(d.effectiveFuturesTaker, locale) : localePending(locale)}</strong>
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
                            {isZh ? "免 KYC（邮箱注册）" : ({ ja: "KYC不要", ko: "KYC 불필요", tr: "KYC gerekmez", fr: "KYC non requis", de: "Kein KYC erforderlich", es: "No se requiere KYC", "pt-BR": "KYC não exigido", ru: "KYC не требуется", ar: "لا يلزم التحقق", id: "KYC tidak diperlukan", vi: "Không cần KYC", it: "KYC non richiesto",
                            // l10n: needs native review
                            ur: "KYC درکار نہیں",
                            // l10n: needs native review
                            uk: "KYC не потрібен" }[localeKey(locale)] || "No KYC Required")}
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
  // Compare-any (2026-10-11): a two-venue pair without a curated page renders from data with templated copy and a
  // visible provenance note, so readers can tell generated pages from hand-written ones.
  const generatedPolicy = profiles.length === 2 && !isCuratedComparison(compareSlugKey) ? generatedComparePolicy(compareSlugKey) : null;
  const generatedCopy = generatedPolicy?.generated
    ? generatedCompareCopy(locale, { nameA: getLocalizedVenueName(profiles[0], locale), nameB: getLocalizedVenueName(profiles[1], locale), date: generatedCompareDataDate(selected) })
    : null;
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
                : (isZhLoc ? zhText(locale, "官方资料对比", "官方資料對比") : (compareLabels.official || ({ de: "Vergleich mit offiziellen Quellen", ja: "公式ソース比較", ko: "공식 출처 비교", tr: "Resmî kaynak karşılaştırması", ar: "مقارنة المصادر الرسمية", "pt-BR": "Comparação de fontes oficiais", fr: "Comparaison des sources officielles", ru: "Сравнение по официальным источникам", id: "Perbandingan sumber resmi", vi: "So sánh theo nguồn chính thức", it: "Confronto delle fonti ufficiali",
                // l10n: needs native review
                ur: "سرکاری ماخذ کا موازنہ",
                // l10n: needs native review
                uk: "Порівняння за офіційними джерелами" }[locale] || "Official-source comparison")))}
            </span>
            <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>|</span>
            <span style={{ color: "#e2e8f0", fontSize: "0.875rem", fontWeight: 500 }}>
              {[activeGoldPair.left, activeGoldPair.right].every((slug) => publicVenueAccess(slug, locale).commercialClaim.status === "verified" && hasReviewedDecisionSource(slug))
                ? (activeGoldPair.tagline[locKey] || activeGoldPair.tagline.en)
                : (isZhLoc ? zhText(locale, "核对费率、产品、地区资格与来源日期", "核對費率、產品、地區資格與來源日期") : ({ es: "Compara comisiones, productos, elegibilidad regional y fecha de la fuente", de: "Gebühren, Produkte, regionale Eignung und Quelldatum prüfen", ja: "手数料、商品、地域資格、出典日を確認", ko: "수수료, 상품, 지역 자격과 출처 날짜를 확인하세요", tr: "Ücretleri, ürünleri, bölgesel uygunluğu ve kaynak tarihini kontrol edin", ar: "تحقق من الرسوم والمنتج والأهلية الإقليمية وتاريخ المصدر", "pt-BR": "Confira taxas, produtos, elegibilidade regional e data da fonte", fr: "Comparez frais, produits, éligibilité régionale et dates des sources", ru: "Сравните комиссии, продукты, региональную доступность и даты источников", id: "Bandingkan biaya, produk, kelayakan wilayah, dan tanggal sumber", vi: "So sánh phí, sản phẩm, điều kiện theo khu vực và ngày nguồn", it: "Confronta commissioni, prodotti, idoneità regionale e date delle fonti",
                // l10n: needs native review
                ur: "فیس، پروڈکٹس، علاقائی اہلیت اور ماخذ تاریخ کا موازنہ کریں",
                // l10n: needs native review
                uk: "Порівняйте комісії, продукти, регіональну доступність і дати джерел" }[locale] || "Compare fees, products, regional eligibility and source dates"))}
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

                {hasReviewedEditorialDecision(p.slug) && <p className="v3-versus-fit" lang={locale} dir={["ar", "ur"].includes(locale) ? "rtl" : undefined}>{decisionForVenue(p.slug, locale).fit}</p>}
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
                            {(() => {
                              // l10n 2026-10-11: read the 15-locale edition; before, non-zh locales fell through to zh-Hans and ar was forced to English.
                              const localizedCond = campaignResearchLocalizedText(p.slug, ["signupReward", "conditions", String(cIdx)], locale) || cond[locale] || cond[textLocaleKey(locale)] || cond.en;
                              return <span {...(localizedCond === cond.en ? enAttrs(locale) : undefined)}>{localizedCond}</span>;
                            })()}
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

  return <main className="v6 v2-page v3-page v3-compare-page" id="top" {...sectionEyebrowAttrs(locale, "compare")} data-compare-generated={generatedCopy ? "true" : undefined} data-compare-index={generatedPolicy ? generatedPolicy.robots : undefined}>
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
        <h1 translate={compareOwnerQuestion || generatedCopy ? undefined : "no"} lang={generatedCopy ? locale : directAnswer?.locale || (isZhLoc ? "zh-Hans" : "en")} dir={["ar", "ur"].includes(locale) ? "rtl" : "ltr"}>
          {compareOwnerQuestion || generatedCopy?.h1 || profiles.map((profile, index) => <span key={profile.slug}>
            {index > 0 ? " vs " : ""}
            {getLocalizedVenueName(profile, locale).split(/(\([^)]*\))/).map((part, partIndex) => part.startsWith("(")
              ? <span key={partIndex} className="v3-compare-name-alias">{part}</span>
              : part)}
          </span>)}
        </h1>
        {generatedCopy && <p className="v3-compare-generated-note" lang={locale} dir={["ar", "ur"].includes(locale) ? "rtl" : undefined} data-compare-generated-note>{generatedCopy.note}</p>}
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
            <CompareRelatedPairs selected={selected} profiles={profiles} locale={locale} generated={Boolean(generatedCopy)} market={market} product={product} accountStage={accountStage} funding={funding} />
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

// Related comparisons (compare-any, 2026-10-11). Generated pages link to the curated pairs sharing a venue; curated
// pages gain "More comparisons with <venue>" (indexable generated pairs, max 6). Both link to the venue profiles.
function pairLabel(pair) {
  return pair.split("-vs-").map((slug) => venueDatabase[slug]?.name || slug).join(" vs ");
}
export function CompareRelatedPairs({ selected = [], profiles = [], locale = "en", generated = false, market, product, accountStage, funding }) {
  if (profiles.length !== 2) return null;
  const copy = generatedCompareCopy(locale, { nameA: "", nameB: "", date: "" });
  const current = selected.join("-vs-");
  const contextSearch = directoryContextSearch({ market, product, locale, accountStage, funding });
  const groups = generated
    ? [{ key: "curated", label: copy.relatedCurated(profiles.map((profile) => getLocalizedVenueName(profile, locale)).join(" / ")), pairs: curatedPairsSharingVenue(selected, current) }]
    : profiles.map((profile) => ({ key: profile.slug, label: copy.moreWith(getLocalizedVenueName(profile, locale)), pairs: generatedPairsSharingVenue(profile.slug, { limit: 3, exclude: current }) }));
  const visible = groups.filter((group) => group.pairs.length);
  const totalCap = generated ? 12 : 6;
  let remaining = totalCap;
  return (
    <nav className="v3-compare-related" aria-label={copy.profiles} data-compare-related={generated ? "generated" : "curated"}>
      {visible.map((group) => {
        const pairs = group.pairs.slice(0, Math.max(0, remaining));
        remaining -= pairs.length;
        if (!pairs.length) return null;
        return (
          <div className="v3-compare-related__group" key={group.key}>
            <strong className="v3-compare-related__label" lang={locale}>{group.label}</strong>
            <ul className="v3-compare-related__list">
              {pairs.map((pair) => (
                <li key={pair}>
                  <LocalLink locale={locale} href={`${canonicalComparePath(pair.split("-vs-"))}?${contextSearch}`} translate="no" lang="en" data-growth-placement={generated ? "generated-related-curated" : "curated-related-generated"}>{pairLabel(pair)}</LocalLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <div className="v3-compare-related__group">
        <strong className="v3-compare-related__label" lang={locale}>{copy.profiles}</strong>
        <ul className="v3-compare-related__list">
          {profiles.map((profile) => (
            <li key={profile.slug}><LocalLink locale={locale} href={`/exchanges/${profile.slug}?${contextSearch}`} translate="no" lang="en">{getLocalizedVenueName(profile, locale)}</LocalLink></li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

// /compare hub (compare-any, 2026-10-11): the picker plus the curated and indexable generated pair lists.
export function CompareHubPage({ locale = "en", venues = [], market, product, accountStage, funding }) {
  const copy = compareIndexCopy(locale);
  const text = v3Copy(locale);
  const contextSearch = directoryContextSearch({ market, product, locale, accountStage, funding });
  const generatedPairs = indexableGeneratedComparePairs();
  return <main className="v6 v2-page v3-page v3-compare-hub" id="top" dir={["ar", "ur"].includes(locale) ? "rtl" : undefined} {...sectionEyebrowAttrs(locale, "compare")}>
    <section className="v3-page-hero v2-shell" id="compare-hub-hero">
      <LocalLink locale={locale} href={`/exchanges?${contextSearch}`} className="v3-back-link">← {text.backToDirectory}</LocalLink>
      <div className="v3-venue-hero">
        <span className="v3-independent-badge">{text.compareTitle}</span>
        <h1 lang={locale}>{copy.h1}</h1>
        <p lang={locale}>{copy.intro}</p>
        <CompareAnyPicker locale={locale} venues={venues} placement="compare-hub" />
      </div>
    </section>
    <section className="v2-section v2-shell v3-compare-hub__section" aria-labelledby="compare-hub-curated">
      <h2 id="compare-hub-curated" lang={locale}>{copy.curated}</h2>
      <ul className="v3-compare-hub__list">
        {CURATED_COMPARISON_SLUGS.map((pair) => (
          <li key={pair}><LocalLink locale={locale} href={`/compare/${pair}?${contextSearch}`} translate="no" lang="en" data-growth-placement="compare-hub-curated">{pairLabel(pair)}</LocalLink></li>
        ))}
      </ul>
    </section>
    <section className="v2-section v2-shell v3-compare-hub__section" aria-labelledby="compare-hub-generated">
      <h2 id="compare-hub-generated" lang={locale}>{copy.generated}</h2>
      <p className="v3-compare-generated-note" lang={locale}>{copy.generatedNote}</p>
      <ul className="v3-compare-hub__list v3-compare-hub__list--dense">
        {generatedPairs.map((pair) => (
          <li key={pair}><LocalLink locale={locale} href={`/compare/${pair}?${contextSearch}`} translate="no" lang="en" data-growth-placement="compare-hub-generated">{pairLabel(pair)}</LocalLink></li>
        ))}
      </ul>
    </section>
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
  // l10n: needs native review
  ur: ["ماخذ اور فیصلے کے نوٹس", "رجسٹریشن سے پہلے"],
  // l10n: needs native review
  uk: ["Джерела та нотатки до рішення", "Перед реєстрацією"],
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
  "it": "Continuare la ricerca",

  // l10n: needs native review
  "ur": "تحقیق جاری رکھیں",

  // l10n: needs native review
  "uk": "Продовжити дослідження"
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
 it: "Queste domande riguardano le prime due piattaforme. Consulta la tabella comparativa e le fonti per tutte le piattaforme selezionate.",
 // l10n: needs native review
 ur: "یہ سوالات پہلے دو پلیٹ فارمز کا احاطہ کرتے ہیں۔ تمام منتخب پلیٹ فارمز کے لیے موازنہ جدول اور ماخذ چیک کریں۔",
 // l10n: needs native review
 uk: "Ці запитання охоплюють перші дві платформи. Для всіх вибраних платформ перевіряйте таблицю порівняння та джерела."
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
  "it": "Invito, commissioni e verifiche di registrazione",

  // l10n: needs native review
  "ur": "دعوت، فیس اور رجسٹریشن چیک",

  // l10n: needs native review
  "uk": "Запрошення, комісії та перевірки реєстрації"
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
