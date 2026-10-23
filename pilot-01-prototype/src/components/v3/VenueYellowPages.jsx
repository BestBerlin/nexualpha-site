import { SignupEvidence } from "../shared/SignupEvidence.jsx";
import { compareVenuePriority } from "../../data/venue-priority.js";
import { directoryShortAnswer } from "../../data/answer-first.js";
import { ShortAnswer } from "../shared/ShortAnswer.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrandMark } from "../brand/BrandMark";
import { partnerRegistry } from "../../data/partner-registry";
import { venueDatabase } from "../../data/venue-database.js";
import { feeDisplay, feeFact } from "../../data/exchange-facts.js";
import { resolveCommercialClaim } from "../../data/commercial-claims.js";
import { venueDecisionContent } from "../../data/venue-decision-content";
import { compareSlug, v3Copy } from "../../data/v3-product";
import { comparePathFor } from "../v6/compare-routes.js";
import { CompareAnyPicker } from "../compare/CompareAnyPicker.jsx";
import { getLocalizedVenueName } from "../../utils/venue-name-helper.js";
import { defaultDirectoryCategory, directoryContext, directoryContextSearch, filterDirectoryVenues, regionalCtaState, regionalDirectoryCandidateState, venueMarketStatus } from "../../data/directory-context.js";
import { buildRegionalDecisionSet } from "../../data/regional-decision.js";
import { sanitizePublicText } from "../../data/public-copy-sanitizer.js";
import { regionalResearchReturnHref } from "../../data/regional-directory.js";
import { localizedHref } from "../../data/locale-routing.js";
import { publicCtaForVenue, venueGoHref } from "../../data/source-bound-cta.js";
import { accountStageCopy, decisionCopy, directoryCopy, productPathLabel } from "./venue-yellow-pages-copy.js";
import { appendAccountStageToSearch, emptyYellowPagesFilters, restoreYellowPagesStateFromUrl, writeYellowPagesStateToUrl } from "./venue-yellow-pages-state.js";
import { ExchangeMatrix } from "./ExchangeMatrix.jsx";
import { BrazilDeadlineNotice } from "./BrazilDeadlineNotice.jsx";
import { venueKycLevel } from "../../data/venue-kyc-corrections.js";
import { matrixCopy } from "./exchange-matrix-copy.js";
import "./venue-yellow-pages.css";
// Inner-page pass 2026-10-23: directory (joins the page-compare-mid1 stylesheet, src/styles/v9/directory9.src.css).
import "../../styles/v9/directory9.css";

// Scoped regional UI: research status does not establish account eligibility.
const regionalStatusLabels = {
  "en": [
    "Regional research candidate",
    "Paused for review"
  ],
  "zh-Hans": [
    "地区研究候选",
    "暂停复核"
  ],
  "zh-Hant": [
    "地區研究候選",
    "暫停複核"
  ],
  "ja": [
    "地域別の調査候補",
    "再確認のため停止"
  ],
  "ko": [
    "지역 조사 후보",
    "재검토 대기"
  ],
  "tr": [
    "Bölgesel araştırma adayı",
    "İnceleme için duraklatıldı"
  ],
  "es": [
    "Candidato de investigación regional",
    "En pausa para revisión"
  ],
  "pt-BR": [
    "Candidato à pesquisa regional",
    "Em pausa para revisão"
  ],
  "fr": [
    "Candidat à la recherche régionale",
    "En pause pour vérification"
  ],
  "de": [
    "Regionaler Recherchekandidat",
    "Zur Prüfung pausiert"
  ],
  "ru": [
    "Кандидат для регионального исследования",
    "Приостановлено для проверки"
  ],
  "ar": [
    "مرشح للبحث الإقليمي",
    "متوقف للمراجعة"
  ],
  // l10n: needs native review
  "ur": [
    "علاقائی تحقیق امیدوار",
    "جائزے کے لیے موقوف"
  ],
  // l10n: needs native review
  "uk": [
    "Кандидат для регіонального дослідження",
    "Призупинено для перегляду"
  ],
  "id": [
    "Kandidat riset regional",
    "Dijeda untuk peninjauan"
  ],
  "vi": [
    "Ứng viên nghiên cứu theo khu vực",
    "Tạm dừng để rà soát"
  ],
  "it": [
    "Candidato alla ricerca regionale",
    "In pausa per revisione"
  ]
};
const regionalDecisionLabels = {
  "pt-BR": [
    "Rota principal",
    "Alternativa",
    "Verifique primeiro",
    "Ver perfil e condições",
    "Há apenas informações de cobertura global. Confirme residência e elegibilidade do produto no processo oficial."
  ],
  "fr": [
    "Parcours principal",
    "Autre option",
    "Vérifier d’abord",
    "Voir le profil et les conditions",
    "Seule une couverture mondiale est documentée. Vérifiez la résidence et l’éligibilité au produit dans le parcours officiel."
  ],
  "de": [
    "Primärer Weg",
    "Alternative",
    "Zuerst prüfen",
    "Profil und Bedingungen ansehen",
    "Es sind nur Angaben zur globalen Abdeckung dokumentiert. Prüfen Sie Wohnsitz und Produktberechtigung im offiziellen Verfahren."
  ],
  "ru": [
    "Основной маршрут",
    "Альтернатива",
    "Сначала проверьте",
    "Посмотреть профиль и условия",
    "Зафиксированы только сведения о глобальном охвате. Проверьте место проживания и право доступа к продукту в официальном процессе."
  ],
  "ar": [
    "المسار الأساسي",
    "مسار بديل",
    "تحقق أولاً",
    "عرض الملف والشروط",
    "المسجل هو نطاق التغطية العالمي فقط. تحقق من الإقامة وأهلية المنتج في المسار الرسمي."
  ],
  // l10n: needs native review
  "ur": [
    "بنیادی راستہ",
    "متبادل",
    "پہلے تصدیق کریں",
    "پروفائل اور شرائط دیکھیں",
    "صرف عالمی کوریج درج ہے۔ رہائش اور پروڈکٹ اہلیت کو سرکاری فلو میں چیک کریں۔"
  ],
  // l10n: needs native review
  "uk": [
    "Основний маршрут",
    "Альтернатива",
    "Спершу перевірте",
    "Переглянути профіль і умови",
    "Зафіксовано лише глобальне покриття. Перевірте резидентство й доступність продукту в офіційному процесі."
  ],
  "vi": [
    "Lộ trình chính",
    "Lựa chọn khác",
    "Xác minh trước",
    "Xem hồ sơ và điều kiện",
    "Chỉ có thông tin về phạm vi toàn cầu. Hãy xác minh nơi cư trú và điều kiện sử dụng sản phẩm trong quy trình chính thức."
  ],
  "it": [
    "Percorso principale",
    "Alternativa",
    "Verifica prima",
    "Visualizza profilo e condizioni",
    "È documentata solo la copertura globale. Verifica residenza e idoneità al prodotto nel percorso ufficiale."
  ]
};
function regionalDirectoryUi(locale, dc) {
  const labels = regionalStatusLabels[locale] || regionalStatusLabels.en;
  const extra = regionalDecisionLabels[locale];
  const decision = decisionCopy(locale);
  return {
    matched: locale === "zh-Hant" ? "地區條件已匹配" : locale.startsWith("zh") ? "地区条件已匹配" : (dc.regionalFit || "Regional fit"),
    researchable: labels[0],
    paused: labels[1],
    decision: extra ? { primary: extra[0], alternative: extra[1], verify: extra[2], open: extra[3], verifyBody: extra[4] } : decision,
  };
}

const uiText = {
  "zh-Hans": {
    sectionTitle: "加密货币交易所列表：手续费、KYC 与官方注册入口",
    emptyTitle: "没有符合条件的平台",
    emptyBody: "当前分类与筛选组合没有结果。清空筛选后可继续查看可用平台。",
    resetFilters: "重置筛选",
    sectionLead: "离开 NexuAlpha 前，先比较官方域名、使用场景、账户条件和已审查的合作注册链接。",
    tabAll: "全部平台", tabCex: "中心化交易所 CEX", tabDex: "去中心化 DEX", tabPerp: "永续合约 Perp DEX",
    viewDetail: "查看详情与限制", openSignup: "打开平台开户链接 ↗", openApp: "访问应用 ↗",
    codeLabel: "邀请码", noCode: "链上直连 · 无需邀请码", viewAll: "查看完整平台目录", viewMore: "展开其余平台", viewLess: "收起其余平台",
    searchLabel: "搜索平台", searchPlaceholder: "输入平台名称或类型", clearSearch: "清除搜索", compareSelect: "加入对比", compareRemove: "移出对比", compareNeed: "再选择一家平台", compareOpen: "打开对比", compareClear: "清空选择",
  },
  "zh-Hant": {
    sectionTitle: "加密交易平台目錄",
    emptyTitle: "沒有符合條件的平台",
    emptyBody: "目前分類與篩選組合沒有結果。清空篩選後可繼續查看可用平台。",
    resetFilters: "重置篩選",
    sectionLead: "離開 NexuAlpha 前，先比較官方網域、使用場景、帳戶條件和已審查的合作註冊連結。",
    tabAll: "全部平台", tabCex: "中心化交易所 CEX", tabDex: "去中心化 DEX", tabPerp: "永續合約 Perp DEX",
    viewDetail: "查看詳情與限制", openSignup: "開啟平台开户連結 ↗", openApp: "訪問應用 ↗",
    codeLabel: "邀請碼", noCode: "鏈上直連 · 無需邀請碼", viewAll: "查看完整平台目錄", viewMore: "展開其餘平台", viewLess: "收起其餘平台",
    searchLabel: "搜尋平台", searchPlaceholder: "輸入平台名稱或類型", clearSearch: "清除搜尋", compareSelect: "加入比較", compareRemove: "移出比較", compareNeed: "再選一家平台", compareOpen: "開啟比較", compareClear: "清除選擇",
  },
  en: {
    sectionTitle: "Crypto exchange list: fees, KYC and official sign-up links",
    emptyTitle: "No platforms match these filters",
    emptyBody: "This category and filter combination has no results. Reset filters to keep browsing available venues.",
    resetFilters: "Reset filters",
    sectionLead: "Compare official domains, use cases, account checks, and reviewed partner routes before leaving NexuAlpha.",
    tabAll: "All Platforms", tabCex: "CEX", tabDex: "DEX", tabPerp: "Perp DEX",
    viewDetail: "View Details & Limits", openSignup: "Open Partner Signup ↗", openApp: "Open App ↗", verifyEligibility: "Verify eligibility first",
    codeLabel: "Code", noCode: "On-chain direct · No code", viewAll: "View full platform directory", viewMore: "Show more platforms", viewLess: "Show fewer platforms",
    searchLabel: "Search platforms", searchPlaceholder: "Enter a platform or category", clearSearch: "Clear search", compareSelect: "Add to compare", compareRemove: "Remove from compare", compareNeed: "Choose one more platform", compareOpen: "Open comparison", compareClear: "Clear selection",
  },
  // l10n: needs native review
  ur: {
    sectionTitle: "کرپٹو پلیٹ فارم ڈائریکٹری",
    emptyTitle: "ان فلٹرز سے کوئی پلیٹ فارم نہیں ملتا",
    emptyBody: "اس زمرے اور فلٹر مجموعے کا کوئی نتیجہ نہیں۔ دستیاب پلیٹ فارمز دیکھنے کے لیے فلٹر ری سیٹ کریں۔",
    resetFilters: "فلٹر ری سیٹ کریں",
    sectionLead: "NexuAlpha چھوڑنے سے پہلے سرکاری ڈومینز، استعمال کے کیسز، اکاؤنٹ چیکس اور جائزہ شدہ پارٹنر راستوں کا موازنہ کریں۔",
    tabAll: "تمام پلیٹ فارمز", tabCex: "CEX", tabDex: "DEX", tabPerp: "Perp DEX",
    viewDetail: "تفصیلات اور حدود دیکھیں", openSignup: "پارٹنر سائن اپ کھولیں ↗", openApp: "ایپ کھولیں ↗", verifyEligibility: "پہلے اہلیت چیک کریں",
    codeLabel: "کوڈ", noCode: "آن چین براہ راست · کوڈ نہیں", viewAll: "مکمل پلیٹ فارم ڈائریکٹری دیکھیں", viewMore: "مزید پلیٹ فارمز دکھائیں", viewLess: "کم پلیٹ فارمز دکھائیں",
    searchLabel: "پلیٹ فارم تلاش کریں", searchPlaceholder: "پلیٹ فارم یا زمرہ درج کریں", clearSearch: "تلاش صاف کریں", compareSelect: "موازنے میں شامل کریں", compareRemove: "موازنے سے نکالیں", compareNeed: "ایک اور پلیٹ فارم منتخب کریں", compareOpen: "موازنہ کھولیں", compareClear: "انتخاب صاف کریں",
  },
  // l10n: needs native review
  uk: {
    sectionTitle: "Каталог криптоплатформ",
    emptyTitle: "Жодна платформа не відповідає цим фільтрам",
    emptyBody: "Ця комбінація категорії та фільтрів не має результатів. Скиньте фільтри, щоб переглянути доступні платформи.",
    resetFilters: "Скинути фільтри",
    sectionLead: "Перед виходом із NexuAlpha порівняйте офіційні домени, сценарії використання, перевірки рахунку та переглянуті партнерські маршрути.",
    tabAll: "Усі платформи", tabCex: "CEX", tabDex: "DEX", tabPerp: "Perp DEX",
    viewDetail: "Переглянути деталі й обмеження", openSignup: "Відкрити партнерську реєстрацію ↗", openApp: "Відкрити застосунок ↗", verifyEligibility: "Спершу перевірте доступність",
    codeLabel: "Код", noCode: "Ончейн напряму · без коду", viewAll: "Переглянути повний каталог платформ", viewMore: "Показати більше платформ", viewLess: "Показати менше платформ",
    searchLabel: "Пошук платформ", searchPlaceholder: "Введіть платформу або категорію", clearSearch: "Очистити пошук", compareSelect: "Додати до порівняння", compareRemove: "Прибрати з порівняння", compareNeed: "Оберіть ще одну платформу", compareOpen: "Відкрити порівняння", compareClear: "Очистити вибір",
  },
};

const directoryUiCopy = {
  en: {
    returnToRegion: "Return to market research",
    sectionTitle: "Crypto exchange list: fees, KYC and official sign-up links",
    sectionLead: "Compare official domains, use cases, account checks, and reviewed partner routes before leaving NexuAlpha.",
    openSignup: "Open Partner Signup ↗",
    benefitPending: "User benefits need verification in the official account",
  },
  "zh-Hans": {
    returnToRegion: "返回地区研究",
    sectionTitle: "加密货币交易所列表：手续费、KYC 与官方注册入口",
    sectionLead: "离开 NexuAlpha 前，先比较官方域名、使用场景、账户条件和已审查的合作注册链接。",
    openSignup: "打开平台开户链接 ↗",
    benefitPending: "用户权益需在官方账户内核验",
  },
  "zh-Hant": {
    returnToRegion: "返回地區研究",
    sectionTitle: "加密交易平台目錄",
    sectionLead: "離開 NexuAlpha 前，先比較官方網域、使用場景、帳戶條件和已審查的合作註冊連結。",
    openSignup: "開啟平台开户連結 ↗",
    benefitPending: "用戶權益需在官方帳戶內核驗",
  },
  es: {
    returnToRegion: "Volver al estudio del mercado",
    sectionTitle: "Directorio de plataformas cripto",
    sectionLead: "Compara dominios oficiales, casos de uso, condiciones de cuenta y rutas de socios revisadas antes de salir de NexuAlpha.",
    openSignup: "Abrir registro de socio ↗",
    benefitPending: "Los beneficios deben verificarse en la cuenta oficial",
    emptyTitle: "No hay plataformas con estos filtros",
    emptyBody: "No hay candidatos regionales revisados para esta combinación. Cambia los filtros o vuelve a la investigación del mercado.",
    resetFilters: "Restablecer filtros",
  },
  "pt-BR": {
    returnToRegion: "Voltar à pesquisa do mercado",
    sectionTitle: "Diretório de plataformas cripto",
    sectionLead: "Compare domínios oficiais, usos, condições de conta e rotas parceiras revisadas antes de sair da NexuAlpha.",
    openSignup: "Abrir cadastro parceiro ↗",
    benefitPending: "Os benefícios devem ser verificados na conta oficial",
    emptyTitle: "Nenhuma plataforma corresponde aos filtros",
    emptyBody: "Não há candidatos regionais revisados para esta combinação. Ajuste os filtros ou volte à pesquisa do mercado.",
    resetFilters: "Redefinir filtros",
  },
  fr: {
    returnToRegion: "Revenir à l’étude du marché",
    sectionTitle: "Répertoire des plateformes crypto",
    sectionLead: "Comparez les domaines officiels, les usages, les conditions de compte et les liens partenaires vérifiés avant de quitter NexuAlpha.",
    openSignup: "Ouvrir l’inscription partenaire ↗",
    benefitPending: "Les avantages doivent être vérifiés dans le compte officiel",
    emptyTitle: "Aucune plateforme ne correspond aux filtres",
    emptyBody: "Aucun candidat régional vérifié ne correspond à cette combinaison. Modifiez les filtres ou revenez à l’étude du marché.",
    resetFilters: "Réinitialiser les filtres",
  },
  de: {
    returnToRegion: "Zur Marktrecherche zurückkehren",
    sectionTitle: "Krypto-Plattformverzeichnis",
    sectionLead: "Vergleichen Sie offizielle Domains, Einsatzbereiche, Kontobedingungen und geprüfte Partnerwege, bevor Sie NexuAlpha verlassen.",
    openSignup: "Partner-Registrierung öffnen ↗",
    benefitPending: "Vorteile im offiziellen Konto prüfen",
    emptyTitle: "Keine Plattform passt zu diesen Filtern",
    emptyBody: "Für diese Kombination gibt es keine geprüften regionalen Kandidaten. Passen Sie die Filter an oder kehren Sie zur Marktrecherche zurück.",
    resetFilters: "Filter zurücksetzen",
  },
  ja: {
    returnToRegion: "地域調査に戻る",
    sectionTitle: "暗号資産プラットフォームディレクトリ",
    sectionLead: "NexuAlpha を離れる前に、公式ドメイン、用途、口座条件、審査済みパートナールートを比較します。",
    openSignup: "提携登録リンクを開く ↗",
    benefitPending: "特典条件は公式アカウントで確認してください",
    emptyTitle: "この条件で確認済みの候補はありません",
    emptyBody: "この組み合わせに対応する地域候補はまだ確認されていません。条件を変更するか、地域調査ページに戻ってください。",
    resetFilters: "条件をリセット",
  },
  ko: {
    returnToRegion: "지역 조사로 돌아가기",
    sectionTitle: "암호화폐 플랫폼 디렉터리",
    sectionLead: "NexuAlpha를 떠나기 전에 공식 도메인, 사용 목적, 계정 조건, 검토된 파트너 경로를 비교하세요.",
    openSignup: "파트너 가입 링크 열기 ↗",
    benefitPending: "혜택 조건은 공식 계정에서 확인하세요",
    emptyTitle: "이 조건에 맞는 검토된 플랫폼이 없습니다",
    emptyBody: "이 조합에 대해 검토된 지역 후보가 아직 없습니다. 필터를 바꾸거나 지역 조사 페이지로 돌아가세요.",
    resetFilters: "필터 초기화",
  },
  ar: {
    returnToRegion: "العودة إلى بحث السوق",
    sectionTitle: "دليل منصات العملات الرقمية",
    sectionLead: "قارن النطاقات الرسمية وحالات الاستخدام وشروط الحساب ومسارات الشركاء المراجعة قبل مغادرة NexuAlpha.",
    openSignup: "افتح رابط تسجيل الشريك ↗",
    benefitPending: "يجب التحقق من المزايا داخل الحساب الرسمي",
    emptyTitle: "لا توجد منصة مراجعة تطابق هذه الفلاتر",
    emptyBody: "لا يوجد مرشح إقليمي تمت مراجعته لهذه المجموعة. غيّر الفلاتر أو ارجع إلى صفحة بحث السوق.",
    resetFilters: "إعادة ضبط الفلاتر",
  },
  // l10n: needs native review
  ur: {
    returnToRegion: "مارکیٹ تحقیق پر واپس",
    sectionTitle: "کرپٹو پلیٹ فارم ڈائریکٹری",
    sectionLead: "NexuAlpha چھوڑنے سے پہلے سرکاری ڈومینز، استعمال، اکاؤنٹ شرائط اور جائزہ شدہ پارٹنر راستوں کا موازنہ کریں۔",
    openSignup: "پارٹنر سائن اپ کھولیں ↗",
    benefitPending: "فوائد کی تصدیق سرکاری اکاؤنٹ میں ہونی چاہیے",
    emptyTitle: "ان فلٹرز سے کوئی جائزہ شدہ پلیٹ فارم نہیں ملتا",
    emptyBody: "اس مجموعے کے لیے کوئی جائزہ شدہ علاقائی امیدوار نہیں۔ فلٹر بدلیں یا مارکیٹ تحقیق پر واپس جائیں۔",
    resetFilters: "فلٹر ری سیٹ کریں",
  },
  // l10n: needs native review
  uk: {
    returnToRegion: "Повернутися до дослідження ринку",
    sectionTitle: "Каталог криптоплатформ",
    sectionLead: "Перед виходом із NexuAlpha порівняйте офіційні домени, сценарії використання, умови рахунку та перевірені партнерські маршрути.",
    openSignup: "Відкрити партнерську реєстрацію ↗",
    benefitPending: "Переваги потрібно перевірити в офіційному рахунку",
    emptyTitle: "Немає перевіреної платформи для цих фільтрів",
    emptyBody: "Для цієї комбінації ще немає перевірених регіональних кандидатів. Змініть фільтри або поверніться до дослідження ринку.",
    resetFilters: "Скинути фільтри",
  },
  tr: {
    returnToRegion: "Pazar araştırmasına dön",
    sectionTitle: "Kripto platform dizini",
    sectionLead: "NexuAlpha’dan ayrılmadan önce resmî alan adlarını, kullanım alanlarını, hesap koşullarını ve incelenmiş partner rotalarını karşılaştırın.",
    openSignup: "Partner kayıt bağlantısını aç ↗",
    benefitPending: "Avantajlar resmî hesapta doğrulanmalıdır",
    emptyTitle: "Bu filtrelere uyan incelenmiş platform yok",
    emptyBody: "Bu birleşim için incelenmiş bölgesel aday bulunmuyor. Filtreleri değiştirin veya pazar araştırmasına dönün.",
    resetFilters: "Filtreleri sıfırla",
  },
  ru: {
    returnToRegion: "Вернуться к исследованию рынка",
    sectionTitle: "Каталог криптоплатформ",
    sectionLead: "Перед уходом с NexuAlpha сравните официальные домены, сценарии использования, условия аккаунта и проверенные партнерские маршруты.",
    openSignup: "Открыть партнерскую регистрацию ↗",
    benefitPending: "Преимущества нужно проверить в официальном аккаунте",
    emptyTitle: "Нет проверенных платформ для этих фильтров",
    emptyBody: "Для этой комбинации пока нет проверенных региональных кандидатов. Измените фильтры или вернитесь к исследованию рынка.",
    resetFilters: "Сбросить фильтры",
  },
  id: {
    returnToRegion: "Kembali ke riset pasar",
    sectionTitle: "Direktori platform kripto",
    sectionLead: "Bandingkan domain resmi, kegunaan, syarat akun, dan rute mitra yang telah ditinjau sebelum meninggalkan NexuAlpha.",
    openSignup: "Buka tautan daftar partner ↗",
    benefitPending: "Manfaat perlu diverifikasi di akun resmi",
    emptyTitle: "Tidak ada platform terverifikasi untuk filter ini",
    emptyBody: "Belum ada kandidat regional yang ditinjau untuk kombinasi ini. Ubah filter atau kembali ke riset pasar.",
    resetFilters: "Atur ulang filter",
  },
  vi: {
    returnToRegion: "Quay lại nghiên cứu thị trường",
    sectionTitle: "Danh mục nền tảng crypto",
    sectionLead: "So sánh tên miền chính thức, mục đích sử dụng, điều kiện tài khoản và tuyến đối tác đã được rà soát trước khi rời NexuAlpha.",
    openSignup: "Mở liên kết đăng ký đối tác ↗",
    benefitPending: "Quyền lợi cần được xác minh trong tài khoản chính thức",
    emptyTitle: "Không có nền tảng đã rà soát phù hợp với bộ lọc",
    emptyBody: "Chưa có ứng viên khu vực đã rà soát cho tổ hợp này. Hãy đổi bộ lọc hoặc quay lại trang nghiên cứu thị trường.",
    resetFilters: "Đặt lại bộ lọc",
  },
  it: {
    returnToRegion: "Torna alla ricerca sul mercato",
    sectionTitle: "Directory delle piattaforme crypto",
    sectionLead: "Confronta domini ufficiali, casi d’uso, condizioni dell’account e percorsi partner verificati prima di lasciare NexuAlpha.",
    openSignup: "Apri registrazione partner ↗",
    benefitPending: "I vantaggi devono essere verificati nell’account ufficiale",
    emptyTitle: "Nessuna piattaforma verificata corrisponde ai filtri",
    emptyBody: "Non ci sono ancora candidati regionali verificati per questa combinazione. Modifica i filtri o torna alla ricerca di mercato.",
    resetFilters: "Reimposta filtri",
  },
};

const filterLabels = {
  "zh-Hans": { noKyc: "免 KYC", por: "储备金证明", fiat: "支持法币", highLev: "高杠杆 50x+", sortLabel: "排序", sortDefault: "推荐", sortFee: "已核验费率优先", sortRebate: "已核验用户权益优先" },
  "zh-Hant": { noKyc: "免 KYC", por: "儲備金證明", fiat: "支援法幣", highLev: "高槓桿 50x+", sortLabel: "排序", sortDefault: "推薦", sortFee: "已核驗費率優先", sortRebate: "已核驗用戶權益優先" },
  en: { noKyc: "No KYC", por: "Proof of reserves", fiat: "Fiat support", highLev: "50x+ leverage", sortLabel: "Sort", sortDefault: "Recommended", sortFee: "Verified fee first", sortRebate: "Verified user benefit first" },
  ja: { noKyc: "KYC不要", por: "準備金証明", fiat: "法定通貨対応", highLev: "50倍以上", sortLabel: "並べ替え", sortDefault: "おすすめ", sortFee: "確認済み手数料優先", sortRebate: "確認済み特典優先" },
  ko: { noKyc: "KYC 없음", por: "준비금 증명", fiat: "법정화폐 지원", highLev: "50배 이상", sortLabel: "정렬", sortDefault: "추천", sortFee: "확인된 수수료 우선", sortRebate: "확인된 혜택 우선" },
  tr: { noKyc: "KYC yok", por: "Rezerv kanıtı", fiat: "Fiat desteği", highLev: "50x+ kaldıraç", sortLabel: "Sırala", sortDefault: "Önerilen", sortFee: "Doğrulanmış ücret önce", sortRebate: "Doğrulanmış avantaj önce" },
  ru: { noKyc: "Без KYC", por: "Подтверждение резервов", fiat: "Фиатная поддержка", highLev: "Плечо 50x+", sortLabel: "Сортировка", sortDefault: "Рекомендуемые", sortFee: "Сначала проверенные комиссии", sortRebate: "Сначала проверенные льготы" },
  es: { noKyc: "Sin KYC", por: "Prueba de reservas", fiat: "Soporte fiat", highLev: "Apalancamiento 50x+", sortLabel: "Ordenar", sortDefault: "Recomendados", sortFee: "Tarifa verificada primero", sortRebate: "Beneficio verificado primero" },
  "pt-BR": { noKyc: "Sem KYC", por: "Prova de reservas", fiat: "Suporte fiat", highLev: "Alavancagem 50x+", sortLabel: "Ordenar", sortDefault: "Recomendados", sortFee: "Taxa verificada primeiro", sortRebate: "Benefício verificado primeiro" },
  fr: { noKyc: "Sans KYC", por: "Preuve de réserves", fiat: "Support fiat", highLev: "Effet de levier 50x+", sortLabel: "Trier", sortDefault: "Recommandés", sortFee: "Frais vérifiés d’abord", sortRebate: "Avantage vérifié d’abord" },
  de: { noKyc: "Ohne KYC", por: "Proof of Reserves", fiat: "Fiat-Unterstützung", highLev: "50x+ Hebel", sortLabel: "Sortieren", sortDefault: "Empfohlen", sortFee: "Verifizierte Gebühren zuerst", sortRebate: "Verifizierter Vorteil zuerst" },
  ar: { noKyc: "بدون KYC", por: "إثبات الاحتياطيات", fiat: "دعم العملات الرسمية", highLev: "رافعة 50x+", sortLabel: "ترتيب", sortDefault: "موصى به", sortFee: "الرسوم الموثقة أولاً", sortRebate: "المزايا الموثقة أولاً" },
  // l10n: needs native review
  ur: { noKyc: "بغیر KYC", por: "ریزرو ثبوت", fiat: "Fiat سپورٹ", highLev: "50x+ لیوریج", sortLabel: "ترتیب", sortDefault: "تجویز کردہ", sortFee: "پہلے تصدیق شدہ فیس", sortRebate: "پہلے تصدیق شدہ صارف فائدہ" },
  // l10n: needs native review
  uk: { noKyc: "Без KYC", por: "Підтвердження резервів", fiat: "Підтримка fiat", highLev: "Плече 50x+", sortLabel: "Сортування", sortDefault: "Рекомендовані", sortFee: "Спершу перевірена комісія", sortRebate: "Спершу перевірена перевага" },
  id: { noKyc: "Tanpa KYC", por: "Bukti cadangan", fiat: "Dukungan fiat", highLev: "Leverage 50x+", sortLabel: "Urutkan", sortDefault: "Direkomendasikan", sortFee: "Biaya terverifikasi dulu", sortRebate: "Manfaat terverifikasi dulu" },
  vi: { noKyc: "Không KYC", por: "Bằng chứng dự trữ", fiat: "Hỗ trợ tiền pháp định", highLev: "Đòn bẩy 50x+", sortLabel: "Sắp xếp", sortDefault: "Đề xuất", sortFee: "Phí đã xác minh trước", sortRebate: "Ưu đãi đã xác minh trước" },
  it: { noKyc: "Senza KYC", por: "Prova delle riserve", fiat: "Supporto fiat", highLev: "Leva 50x+", sortLabel: "Ordina", sortDefault: "Consigliati", sortFee: "Commissioni verificate prima", sortRebate: "Vantaggio verificato prima" },
};
const categoryLabels = {
  ja: ["すべてのプラットフォーム", "CEX", "DEX", "Perp DEX"], ko: ["전체 플랫폼", "CEX", "DEX", "Perp DEX"], tr: ["Tüm platformlar", "CEX", "DEX", "Perp DEX"], ru: ["Все платформы", "CEX", "DEX", "Perp DEX"], es: ["Todas las plataformas", "CEX", "DEX", "Perp DEX"], "pt-BR": ["Todas as plataformas", "CEX", "DEX", "Perp DEX"], fr: ["Toutes les plateformes", "CEX", "DEX", "Perp DEX"], de: ["Alle Plattformen", "CEX", "DEX", "Perp DEX"], ar: ["كل المنصات", "CEX", "DEX", "Perp DEX"],
  // l10n: needs native review
  ur: ["تمام پلیٹ فارمز", "CEX", "DEX", "Perp DEX"],
  // l10n: needs native review
  uk: ["Усі платформи", "CEX", "DEX", "Perp DEX"], id: ["Semua platform", "CEX", "DEX", "Perp DEX"], vi: ["Tất cả nền tảng", "CEX", "DEX", "Perp DEX"], it: ["Tutte le piattaforme", "CEX", "DEX", "Perp DEX"],
};

export function sanitizeEditorialText(value, locale) {
  if (!value) return value;
  const replacements = locale.startsWith("zh")
    ? [[/世界第\s*\d+|全球第\s*\d+|首选|第一/g, "来源研究"], [/零滑点|最低费率|超低延迟|最快/g, "产品条款"], [/\d+%\s*返佣/g, "用户权益（待核验）"]]
    : [[/World\s*#?\d+|#1|#2|industry-leading|global leader|premier|preferred|top-tier/gi, "Source-linked research"], [/zero-slippage|ultra-low latency|fastest/gi, "published product terms"], [/\d+%\s*(?:fee )?rebate/gi, "user benefit (pending verification)"]];
  return sanitizePublicText(replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value));
}

const directorySearchCopy = {
  "en": {
    "searchLabel": "Search platforms",
    "searchPlaceholder": "Enter a platform or category",
    "clearSearch": "Clear search"
  },
  "zh-Hans": {
    "searchLabel": "搜索平台",
    "searchPlaceholder": "输入平台名称或类型",
    "clearSearch": "清除搜索"
  },
  "zh-Hant": {
    "searchLabel": "搜尋平台",
    "searchPlaceholder": "輸入平台名稱或類型",
    "clearSearch": "清除搜尋"
  },
  "ja": {
    "searchLabel": "プラットフォームを検索",
    "searchPlaceholder": "プラットフォーム名または種類を入力",
    "clearSearch": "検索をクリア"
  },
  "ko": {
    "searchLabel": "플랫폼 검색",
    "searchPlaceholder": "플랫폼 이름 또는 유형 입력",
    "clearSearch": "검색 지우기"
  },
  "tr": {
    "searchLabel": "Platform ara",
    "searchPlaceholder": "Platform adı veya türü girin",
    "clearSearch": "Aramayı temizle"
  },
  "ar": {
    "searchLabel": "البحث عن منصة",
    "searchPlaceholder": "أدخل اسم المنصة أو نوعها",
    "clearSearch": "مسح البحث"
  },
  // l10n: needs native review
  "ur": {
    "searchLabel": "پلیٹ فارم تلاش کریں",
    "searchPlaceholder": "پلیٹ فارم کا نام یا قسم درج کریں",
    "clearSearch": "تلاش صاف کریں"
  },
  // l10n: needs native review
  "uk": {
    "searchLabel": "Пошук платформ",
    "searchPlaceholder": "Введіть назву або тип платформи",
    "clearSearch": "Очистити пошук"
  },
  "es": {
    "searchLabel": "Buscar plataformas",
    "searchPlaceholder": "Introduce el nombre o tipo de plataforma",
    "clearSearch": "Borrar búsqueda"
  },
  "pt-BR": {
    "searchLabel": "Buscar plataformas",
    "searchPlaceholder": "Digite o nome ou tipo de plataforma",
    "clearSearch": "Limpar busca"
  },
  "fr": {
    "searchLabel": "Rechercher une plateforme",
    "searchPlaceholder": "Saisissez le nom ou le type de plateforme",
    "clearSearch": "Effacer la recherche"
  },
  "de": {
    "searchLabel": "Plattformen suchen",
    "searchPlaceholder": "Plattformnamen oder Typ eingeben",
    "clearSearch": "Suche löschen"
  },
  "ru": {
    "searchLabel": "Поиск платформ",
    "searchPlaceholder": "Введите название или тип платформы",
    "clearSearch": "Очистить поиск"
  },
  "id": {
    "searchLabel": "Cari platform",
    "searchPlaceholder": "Masukkan nama atau jenis platform",
    "clearSearch": "Hapus pencarian"
  },
  "vi": {
    "searchLabel": "Tìm nền tảng",
    "searchPlaceholder": "Nhập tên hoặc loại nền tảng",
    "clearSearch": "Xóa tìm kiếm"
  },
  "it": {
    "searchLabel": "Cerca piattaforme",
    "searchPlaceholder": "Inserisci il nome o il tipo di piattaforma",
    "clearSearch": "Cancella ricerca"
  }
};

const directoryActionCopy = {
  "ja": {
    "compareSelect": "比較に追加",
    "compareRemove": "比較から削除",
    "compareClear": "選択をクリア",
    "viewMore": "他のプラットフォームを表示",
    "viewLess": "表示を減らす"
  },
  "ko": {
    "compareSelect": "비교에 추가",
    "compareRemove": "비교에서 제거",
    "compareClear": "선택 지우기",
    "viewMore": "플랫폼 더 보기",
    "viewLess": "플랫폼 간략히 보기"
  },
  "tr": {
    "compareSelect": "Karşılaştırmaya ekle",
    "compareRemove": "Karşılaştırmadan çıkar",
    "compareClear": "Seçimi temizle",
    "viewMore": "Daha fazla platform göster",
    "viewLess": "Daha az platform göster"
  },
  "ar": {
    "compareSelect": "إضافة إلى المقارنة",
    "compareRemove": "إزالة من المقارنة",
    "compareClear": "مسح الاختيار",
    "viewMore": "عرض المزيد من المنصات",
    "viewLess": "عرض منصات أقل"
  },
  // l10n: needs native review
  "ur": {
    "compareSelect": "موازنے میں شامل کریں",
    "compareRemove": "موازنے سے نکالیں",
    "compareClear": "انتخاب صاف کریں",
    "viewMore": "مزید پلیٹ فارمز دکھائیں",
    "viewLess": "کم پلیٹ فارمز دکھائیں"
  },
  // l10n: needs native review
  "uk": {
    "compareSelect": "Додати до порівняння",
    "compareRemove": "Прибрати з порівняння",
    "compareClear": "Очистити вибір",
    "viewMore": "Показати більше платформ",
    "viewLess": "Показати менше платформ"
  },
  "es": {
    "compareSelect": "Añadir a la comparación",
    "compareRemove": "Quitar de la comparación",
    "compareClear": "Borrar selección",
    "viewMore": "Mostrar más plataformas",
    "viewLess": "Mostrar menos plataformas"
  },
  "pt-BR": {
    "compareSelect": "Adicionar à comparação",
    "compareRemove": "Remover da comparação",
    "compareClear": "Limpar seleção",
    "viewMore": "Mostrar mais plataformas",
    "viewLess": "Mostrar menos plataformas"
  },
  "fr": {
    "compareSelect": "Ajouter à la comparaison",
    "compareRemove": "Retirer de la comparaison",
    "compareClear": "Effacer la sélection",
    "viewMore": "Afficher plus de plateformes",
    "viewLess": "Afficher moins de plateformes"
  },
  "de": {
    "compareSelect": "Zum Vergleich hinzufügen",
    "compareRemove": "Aus dem Vergleich entfernen",
    "compareClear": "Auswahl löschen",
    "viewMore": "Weitere Plattformen anzeigen",
    "viewLess": "Weniger Plattformen anzeigen"
  },
  "ru": {
    "compareSelect": "Добавить к сравнению",
    "compareRemove": "Убрать из сравнения",
    "compareClear": "Очистить выбор",
    "viewMore": "Показать больше платформ",
    "viewLess": "Показать меньше платформ"
  },
  "id": {
    "compareSelect": "Tambahkan ke perbandingan",
    "compareRemove": "Hapus dari perbandingan",
    "compareClear": "Hapus pilihan",
    "viewMore": "Tampilkan lebih banyak platform",
    "viewLess": "Tampilkan lebih sedikit platform"
  },
  "vi": {
    "compareSelect": "Thêm vào so sánh",
    "compareRemove": "Xóa khỏi so sánh",
    "compareClear": "Xóa lựa chọn",
    "viewMore": "Hiển thị thêm nền tảng",
    "viewLess": "Hiển thị ít nền tảng hơn"
  },
  "it": {
    "compareSelect": "Aggiungi al confronto",
    "compareRemove": "Rimuovi dal confronto",
    "compareClear": "Cancella selezione",
    "viewMore": "Mostra più piattaforme",
    "viewLess": "Mostra meno piattaforme"
  },
  "en": {
    "compareSelect": "Add to compare",
    "compareRemove": "Remove from compare",
    "compareClear": "Clear selection",
    "viewMore": "Show more platforms",
    "viewLess": "Show fewer platforms"
  },
  "zh-Hans": {
    "compareSelect": "加入对比",
    "compareRemove": "移出对比",
    "compareClear": "清空选择",
    "viewMore": "展开其余平台",
    "viewLess": "收起其余平台"
  },
  "zh-Hant": {
    "compareSelect": "加入比較",
    "compareRemove": "移出比較",
    "compareClear": "清除選擇",
    "viewMore": "展開其餘平台",
    "viewLess": "收起其餘平台"
  }
};

export function getUi(locale) {
  const normalizedLocale = locale === "zh-CN" ? "zh-Hans"
    : locale === "zh-TW" ? "zh-Hant"
      : String(locale || "en").toLowerCase().startsWith("pt") ? "pt-BR"
        : (directoryUiCopy[locale] ? locale : String(locale || "en").split("-")[0]);
  const directoryCopyForLocale = directoryUiCopy[normalizedLocale] || directoryUiCopy.en;
  const searchCopy = directorySearchCopy[normalizedLocale] || directorySearchCopy.en;
  const actionCopy = directoryActionCopy[normalizedLocale] || directoryActionCopy.en;
  if (locale === "zh-Hans" || locale === "zh-CN") return { ...uiText["zh-Hans"], ...directoryCopyForLocale, ...searchCopy };
  if (locale === "zh-Hant" || locale === "zh-TW") return { ...uiText["zh-Hant"], ...directoryCopyForLocale, ...searchCopy };
  if (locale && locale !== "en") {
    const text = v3Copy(locale);
    return {
      ...uiText.en,
      ...directoryCopyForLocale,
      viewDetail: text.openDetail || uiText.en.viewDetail,
      viewAll: text.backToDirectory || uiText.en.viewAll,
      viewMore: actionCopy.viewMore,
      viewLess: actionCopy.viewLess,
      ...searchCopy,
      compareOpen: text.viewCompare || uiText.en.compareOpen,
      compareNeed: text.compareWith || uiText.en.compareNeed,
      compareSelect: actionCopy.compareSelect,
      compareRemove: actionCopy.compareRemove,
      compareClear: actionCopy.compareClear,
      sourceReviewed: text.sourceIntake || "Source reviewed", sourcePending: text.pendingReview || "Source review pending",
      openApp: text.openOfficialSource || uiText.en.openApp,
      verifyEligibility: text.registrationLocked || uiText.en.verifyEligibility,
      profilePending: text.notConfigured || "Needs review", officialFlow: text.verifyBefore || "Verify in official flow",
      resultSummary: (count) => text.resultVenues?.(count) || ({ ja: `${count}サービス`, ko: `플랫폼 ${count}개`, tr: `${count} platform`, ar: `${count} منصة`, "pt-BR": `${count} plataformas`, es: `${count} plataformas`, fr: `${count} plateformes`, de: `${count} Plattformen` }[locale] || `${count} platforms`),
      ...(categoryLabels[locale] ? { tabAll: categoryLabels[locale][0], tabCex: categoryLabels[locale][1], tabDex: categoryLabels[locale][2], tabPerp: categoryLabels[locale][3] } : {}),
    };
  }
  return { ...uiText.en, ...directoryCopyForLocale, ...searchCopy, sourceReviewed: "Source reviewed", sourcePending: "Source review pending", profilePending: "Needs review", officialFlow: "Verify in official flow", resultSummary: (count) => `${count} platforms` };
}

const copyFeedbackLocales = {
  en: { copying: "Copying invite code…", failed: "Copy failed. Select the code below and copy it manually.", manualLabel: "Manual invite code" },
  "zh-Hans": { copying: "正在复制邀请码…", failed: "复制失败。请选中下面的邀请码手动复制。", manualLabel: "手动复制邀请码" },
  "zh-Hant": { copying: "正在複製邀請碼…", failed: "複製失敗。請選取下面的邀請碼手動複製。", manualLabel: "手動複製邀請碼" },
  ja: { copying: "招待コードをコピー中…", failed: "コピーできませんでした。下のコードを選択して手動でコピーしてください。", manualLabel: "手動コピー用コード" },
  ko: { copying: "초대 코드를 복사하는 중…", failed: "복사하지 못했습니다. 아래 코드를 선택해 수동으로 복사하세요.", manualLabel: "수동 복사 초대 코드" },
  tr: { copying: "Davet kodu kopyalanıyor…", failed: "Kopyalama başarısız. Aşağıdaki kodu seçip elle kopyalayın.", manualLabel: "Elle kopyalanacak davet kodu" },
  es: { copying: "Copiando el código de invitación…", failed: "No se pudo copiar. Selecciona el código de abajo y cópialo manualmente.", manualLabel: "Código de invitación manual" },
  "pt-BR": { copying: "Copiando o código de convite…", failed: "Não foi possível copiar. Selecione o código abaixo e copie manualmente.", manualLabel: "Código de convite para cópia manual" },
  fr: { copying: "Copie du code d’invitation…", failed: "La copie a échoué. Sélectionnez le code ci-dessous et copiez-le manuellement.", manualLabel: "Code d’invitation à copier" },
  de: { copying: "Einladungscode wird kopiert…", failed: "Kopieren fehlgeschlagen. Wählen Sie den Code unten aus und kopieren Sie ihn manuell.", manualLabel: "Einladungscode zum manuellen Kopieren" },
  ru: { copying: "Копируем пригласительный код…", failed: "Не удалось скопировать. Выделите код ниже и скопируйте вручную.", manualLabel: "Код приглашения для ручного копирования" },
  ar: { copying: "جارٍ نسخ رمز الدعوة…", failed: "تعذر النسخ. حدد الرمز أدناه وانسخه يدويًا.", manualLabel: "رمز الدعوة للنسخ اليدوي" },
  // l10n: needs native review
  ur: { copying: "دعوتی کوڈ کاپی ہو رہا ہے…", failed: "کاپی ناکام۔ نیچے کوڈ منتخب کر کے دستی کاپی کریں۔", manualLabel: "دستی دعوتی کوڈ" },
  // l10n: needs native review
  uk: { copying: "Копіюємо код запрошення…", failed: "Не вдалося скопіювати. Виділіть код нижче й скопіюйте вручну.", manualLabel: "Код запрошення для ручного копіювання" },
  id: { copying: "Menyalin kode undangan…", failed: "Gagal menyalin. Pilih kode di bawah ini lalu salin manual.", manualLabel: "Kode undangan untuk disalin manual" },
  vi: { copying: "Đang sao chép mã mời…", failed: "Không thể sao chép. Hãy chọn mã bên dưới và sao chép thủ công.", manualLabel: "Mã mời để sao chép thủ công" },
  it: { copying: "Copia del codice invito…", failed: "Copia non riuscita. Seleziona il codice qui sotto e copialo manualmente.", manualLabel: "Codice invito da copiare manualmente" },
};

export function getCopyFeedbackCopy(locale) {
  return copyFeedbackLocales[locale] || copyFeedbackLocales[String(locale || "").split("-")[0]] || copyFeedbackLocales.en;
}

export function getFilters(locale) {
  if (locale === "zh-Hans" || locale === "zh-CN") return filterLabels["zh-Hans"];
  if (locale === "zh-Hant" || locale === "zh-TW") return filterLabels["zh-Hant"];
  if (locale && locale !== "en") return filterLabels[locale] || filterLabels[String(locale || "").split("-")[0]] || filterLabels.en;
  return filterLabels.en;
}

const CHECKED_LABELS = {
  en: "Checked", "zh-Hans": "核验于", "zh-Hant": "核驗於", ja: "確認日", ko: "확인일", tr: "Kontrol", es: "Revisado", "pt-BR": "Verificado", pt: "Verificado",
  fr: "Vérifié", de: "Geprüft", ru: "Проверено", ar: "تم التحقق",
  // l10n: needs native review
  ur: "تصدیق شدہ",
  // l10n: needs native review
  uk: "Перевірено", id: "Dicek", vi: "Kiểm tra", it: "Verificato",
};

export function VenueYellowPages({ venues = [], locale = "en", market, product, accountStage, funding, headingLevel = 2, compact = false }) {
  const [selectedCategory, setSelectedCategory] = useState(() => defaultDirectoryCategory({ market, product }));
  const [filters, setFilters] = useState(() => emptyYellowPagesFilters());
  const [sortBy, setSortBy] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllVenues, setShowAllVenues] = useState(false);
  const [compareSelection, setCompareSelection] = useState([]);
  const [expandedVenueDetails, setExpandedVenueDetails] = useState(null);
  const [urlAccountStage, setUrlAccountStage] = useState(null);
  const [regionalDecisionOpen, setRegionalDecisionOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState({ status: "idle", code: "", feedbackId: "" });
  const restoredUrlRef = useRef(false);
  const searchInputRef = useRef(null);
  const copyAttemptRef = useRef(0);
  const copyTimerRef = useRef(null);
  const copyMountedRef = useRef(true);
  const ui = getUi(locale);
  const fl = getFilters(locale);
  const dc = directoryCopy(locale);
  const copyUi = getCopyFeedbackCopy(locale);
  const context = directoryContext({ market, product, locale });
  const effectiveAccountStage = urlAccountStage || accountStage;
  const effectiveFunding = funding;
  const regionalReturnHref = regionalResearchReturnHref({ market, locale, product, accountStage: effectiveAccountStage, funding: effectiveFunding });
  const contextSearch = appendAccountStageToSearch(directoryContextSearch({ market, product, locale, funding: effectiveFunding }), effectiveAccountStage);
  const growthCampaign = context.scoped ? `${context.market.toLowerCase()}-research-preview` : undefined;
  const decisions = buildRegionalDecisionSet({ venues, market, product });
  const regionalUi = regionalDirectoryUi(locale, dc);
  const decisionUi = regionalUi.decision;
  const stageCopy = accountStageCopy(locale, effectiveAccountStage);
  const contextualVenues = useMemo(() => filterDirectoryVenues(venues, market, {
    product,
    locale,
    accountStage: effectiveAccountStage,
    funding: effectiveFunding,
  }), [venues, market, product, locale, effectiveAccountStage, effectiveFunding]);
  const venueSlugsKey = useMemo(() => venues.map((venue) => venue.slug).join(","), [venues]);
  const HeadingTag = headingLevel === 1 ? "h1" : "h2";

  const clearCopyFeedbackTimer = () => {
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
  };

  useEffect(() => {
    copyMountedRef.current = true;
    return () => {
      copyMountedRef.current = false;
      clearCopyFeedbackTimer();
      copyAttemptRef.current += 1;
    };
  }, []);

  const scheduleCopyReset = () => {
    clearCopyFeedbackTimer();
    copyTimerRef.current = setTimeout(() => {
      if (!copyMountedRef.current) return;
      setCopiedToast(null);
      setCopyFeedback({ status: "idle", code: "", feedbackId: "" });
      copyTimerRef.current = null;
    }, 2000);
  };


  const applyRestoredUrlState = (restored) => {
    setSelectedCategory(restored.category);
    setFilters(restored.filters);
    setSortBy(restored.sort);
    setSearchQuery(restored.query);
    setCompareSelection(restored.selection);
    setUrlAccountStage(restored.accountStage);
    setShowAllVenues(false);
  };

  useEffect(() => {
    if (typeof window === "undefined" || compact) return undefined;
    const restoreCurrentLocation = () => {
      applyRestoredUrlState(restoreYellowPagesStateFromUrl(window.location.search, { venues, defaultCategory: defaultDirectoryCategory({ market, product }) }));
      restoredUrlRef.current = true;
    };
    restoreCurrentLocation();
    const onPop = () => restoreCurrentLocation();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [compact, market, product, venueSlugsKey]);

  useEffect(() => {
    if (typeof window === "undefined" || compact || !restoredUrlRef.current) return undefined;
    const nextPath = writeYellowPagesStateToUrl(window.location.href, {
      category: selectedCategory,
      filters,
      sort: sortBy,
      query: searchQuery,
      selection: compareSelection,
      accountStage: effectiveAccountStage,
      defaultCategory: defaultDirectoryCategory({ market, product }),
    });
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextPath) {
      window.history.replaceState({ ...(window.history.state || {}), nexuYellowPages: true }, "", nextPath);
    }
    return undefined;
  }, [compact, selectedCategory, filters, sortBy, searchQuery, compareSelection, effectiveAccountStage, market, product]);

  const handleCopyCode = async (code, feedbackId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!code) return;
    const attempt = copyAttemptRef.current + 1;
    copyAttemptRef.current = attempt;
    clearCopyFeedbackTimer();
    setCopiedToast(null);
    setCopyFeedback({ status: "pending", code, feedbackId });

    const writeText = typeof navigator !== "undefined" ? navigator.clipboard?.writeText : null;
    if (typeof writeText !== "function") {
      if (copyMountedRef.current && copyAttemptRef.current === attempt) {
        setCopyFeedback({ status: "failed", code, feedbackId });
      }
      return;
    }

    try {
      await writeText.call(navigator.clipboard, code);
      if (!copyMountedRef.current || copyAttemptRef.current !== attempt) return;
      setCopyFeedback({ status: "idle", code: "", feedbackId: "" });
      setCopiedToast(code);
      scheduleCopyReset();
    } catch {
      if (copyMountedRef.current && copyAttemptRef.current === attempt) {
        setCopyFeedback({ status: "failed", code, feedbackId });
      }
    }
  };

  const renderCopyFeedback = (feedbackId) => {
    if (copyFeedback.feedbackId !== feedbackId || copyFeedback.status === "idle") return null;
    if (copyFeedback.status === "pending") {
      return (
        <span className="yellow-card__copy-feedback yellow-card__copy-feedback--pending" role="status" aria-live="polite">
          {copyUi.copying}
        </span>
      );
    }
    return (
      <span className="yellow-card__copy-feedback yellow-card__copy-feedback--failed" role="status" aria-live="polite">
        <span>{copyUi.failed}</span>
        <input
          className="yellow-card__copy-manual"
          type="text"
          readOnly
          dir="ltr"
          translate="no"
          aria-label={copyUi.manualLabel}
          value={copyFeedback.code}
          onFocus={(event) => event.currentTarget.select()}
        />
      </span>
    );
  };

  const categories = [
    { id: "all", label: `${ui.tabAll} (${contextualVenues.length})` },
    { id: "CEX", label: ui.tabCex },
    { id: "DEX", label: ui.tabDex },
    { id: "Perp DEX", label: ui.tabPerp },
  ];

  const toggleFilter = (key) => setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleCompareSelection = (slug) => setCompareSelection((current) => {
    if (current.includes(slug)) return current.filter((item) => item !== slug);
    if (current.length >= 2) return current;
    return [...current, slug];
  });
  const compareHref = compareSelection.length === 2
    ? localizedHref(`${comparePathFor(compareSelection).path}?${contextSearch}`, { locale })
    : null;
  const compactDirectory = !compact;
  const detailToggleCopy = (expanded) => {
    if (locale === "zh-Hant") return expanded ? "收起條件" : "展開條件";
    if (locale.startsWith("zh")) return expanded ? "收起条件" : "展开条件";
    if (locale === "ja") return expanded ? "条件を閉じる" : "条件を開く";
    if (locale === "ko") return expanded ? "조건 닫기" : "조건 열기";
    if (locale === "tr") return expanded ? "Koşulları kapat" : "Koşulları aç";
    if (locale === "es") return expanded ? "Ocultar condiciones" : "Ver condiciones";
    if (locale === "pt-BR") return expanded ? "Ocultar condições" : "Ver condições";
    if (locale === "fr") return expanded ? "Masquer les conditions" : "Afficher les conditions";
    if (locale === "de") return expanded ? "Bedingungen ausblenden" : "Bedingungen anzeigen";
    if (locale === "ru") return expanded ? "Скрыть условия" : "Показать условия";
    if (locale === "ar") return expanded ? "إخفاء الشروط" : "عرض الشروط";
    if (locale === "id") return expanded ? "Sembunyikan syarat" : "Tampilkan syarat";
    if (locale === "vi") return expanded ? "Ẩn điều kiện" : "Xem điều kiện";
    if (locale === "it") return expanded ? "Nascondi condizioni" : "Mostra condizioni";
    return expanded ? "Hide conditions" : "Show conditions";
  };

  const clearDirectorySearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus?.({ preventScroll: true });
  };

  const filteredVenues = useMemo(() => {
    let list = selectedCategory === "all" ? contextualVenues : contextualVenues.filter((v) => v.category === selectedCategory);
    const query = searchQuery.trim().toLocaleLowerCase();
    if (query) {
      list = list.filter((venue) => {
        const db = venueDatabase[venue.slug] || {};
        const haystack = [
          venue.name,
          getLocalizedVenueName(venue, locale),
          venue.slug,
          venue.category,
          db.officialDomain,
        ].filter(Boolean).join(" ").toLocaleLowerCase();
        return haystack.includes(query);
      });
    }
    list = list.filter((v) => {
      const db = venueDatabase[v.slug] || {};
      const kycLevel = venueKycLevel(v.slug, db);
      if (filters.noKyc && kycLevel !== "optional" && kycLevel !== "none") return false;
      if (filters.por && !(db.proofOfReserves && db.porAuditCheckedAt && db.porAuditUrl)) return false;
      if (filters.fiat && (!db.fiatChannels || db.fiatChannels.length === 0)) return false;
      if (filters.highLev) {
        const lev = parseInt(db.maxLeverage || "0");
        if (lev < 50) return false;
      }
      return true;
    });
    if (effectiveAccountStage === "existing_account" && decisions.primary) {
      list = [...list].sort((a, b) => (a.slug === decisions.primary.venue.slug ? -1 : 0) - (b.slug === decisions.primary.venue.slug ? -1 : 0));
    } else if (effectiveAccountStage === "new_account") {
      list = [...list].sort((a, b) => (a.category === "CEX" ? 0 : 1) - (b.category === "CEX" ? 0 : 1));
    } else if (sortBy === "fee" && list.every((v) => feeFact(v.slug, "spot").state === "checked")) {
      list = [...list].sort((a, b) => {
        const fa = feeFact(a.slug, "spot").taker ?? 9999;
        const fb = feeFact(b.slug, "spot").taker ?? 9999;
        return fa - fb || compareVenuePriority(a, b);
      });
    } else if (sortBy === "rebate" && list.every((v) => resolveCommercialClaim({ partner: partnerRegistry[v.slug] || {}, venue: venueDatabase[v.slug] || {} }).status === "verified")) {
      list = [...list].sort((a, b) => {
        const ra = venueDatabase[a.slug]?.rebatePercent ?? 0;
        const rb = venueDatabase[b.slug]?.rebatePercent ?? 0;
        return rb - ra || compareVenuePriority(a, b);
      });
    }
    return list;
  }, [contextualVenues, selectedCategory, filters, sortBy, searchQuery, locale, effectiveAccountStage, decisions.primary]);

  return (
    <section className={compact ? "yellow-pages v2-shell" : "mx-page v5"} id="exchanges">
      <div className={compact ? "yellow-pages__header" : "mx-page__inner"}>
        <div className={compact ? undefined : "mx-head"}>
        <HeadingTag className={compact ? "yellow-pages__title" : "mx-title"}>{ui.sectionTitle}</HeadingTag>
        {headingLevel === 1 && <ShortAnswer answer={directoryShortAnswer(contextualVenues.length, locale, market)} placement="directory-hero" />}
        <p className={compact ? "yellow-pages__lead" : "mx-lead"}>{ui.sectionLead}</p>
        </div>
        {!compact && <BrazilDeadlineNotice locale={locale} placement="directory" />}
        {context.scoped && (
          <p className="yellow-pages__context" data-directory-context={`${context.market}:${context.product}`}>
            {locale.startsWith("zh") ? `当前研究地区：${context.label} · 产品路径：${context.product === "spot" ? "现货" : "待选择"} · 资格仍需在平台官方流程确认。` : (dc.context?.(context.label, context.product) || `Research context: ${context.label} · Product path: ${context.product === "spot" ? "Spot" : "Choose in platform"}. Verify eligibility in the official flow.`)}
          </p>
        )}
        {stageCopy && <p className="yellow-pages__context yellow-pages__context--stage" data-account-stage={effectiveAccountStage}>{stageCopy[0]} · {stageCopy[1]}</p>}
        {!compact && <CompareAnyPicker locale={locale} venues={venues} initial={compareSelection} placement="exchange-directory" compact />}
        {context.scoped && decisions.primary && (
          <div className="yellow-pages__decision-strip" data-regional-decision={`${context.market}:${decisions.primary.venue.slug}`}>
            <div className="yellow-pages__decision-header">
            <strong>{context.label} · {productPathLabel(locale, product)}</strong>
              <span>{locale.startsWith("zh") ? "以地区证据缩短首轮选择" : (dc.shortlist || "Shortlist built from recorded regional evidence")}</span>
            </div>
            <div className="yellow-pages__decision-grid">
              {[decisions.primary, ...decisions.alternatives].filter(Boolean).map((item, index) => (
                <article className={`yellow-pages__decision-card${index > 0 && !regionalDecisionOpen ? " yellow-pages__decision-card--mobile-collapsed" : ""}`} key={item.venue.slug}>
                  <span className="yellow-pages__decision-label">{index === 0 ? decisionUi.primary : decisionUi.alternative}</span>
                  <strong>{item.venue.name}</strong>
                  <small>{item.venue.category} · {item.evidence.hasReferral ? (locale.startsWith("zh") ? "合作入口已配置" : (dc.partnerRoute || "Partner route active")) : (locale.startsWith("zh") ? "官方入口" : (dc.officialRoute || "Official route"))}</small>
                  <a
                    href={localizedHref(`/exchanges/${item.venue.slug}?${contextSearch}`, { locale })}
                    data-cta-kind="research"
                    data-cta-platform={item.venue.slug}
                    data-cta-placement={index === 0 ? "regional-directory-primary" : "regional-directory-alternative"}
                    data-growth-decision={item.venue.slug}
                    data-growth-placement={index === 0 ? "regional-directory-primary" : "regional-directory-alternative"}
                    data-growth-market={context.market}
                    data-growth-product={context.product}
                    data-growth-campaign={growthCampaign}
                  >{decisionUi.open} →</a>
                </article>
              ))}
              {decisions.verification && <article className={`yellow-pages__decision-card yellow-pages__decision-card--verify${!regionalDecisionOpen ? " yellow-pages__decision-card--mobile-collapsed" : ""}`}>
                <span className="yellow-pages__decision-label">{decisionUi.verify}</span>
                <strong>{decisions.verification.venue.name}</strong>
                <small>{decisionUi.verifyBody}</small>
              </article>}
              {(decisions.alternatives.length > 0 || decisions.verification) && <button type="button" className="yellow-pages__decision-toggle" data-regional-decision-toggle aria-expanded={regionalDecisionOpen} onClick={() => setRegionalDecisionOpen((open) => !open)}>
                {regionalDecisionOpen
                  ? (locale === "zh-Hant" ? "收起其他地區入口" : locale.startsWith("zh") ? "收起其他地区入口" : locale === "es" ? "Ocultar otras rutas" : locale === "id" ? "Sembunyikan rute lain" : (dc.hideMoreRoutes || "Hide other regional routes"))
                  : (locale === "zh-Hant" ? "查看其他地區入口" : locale.startsWith("zh") ? "查看其他地区入口" : locale === "es" ? "Ver otras rutas" : locale === "id" ? "Lihat rute lain" : (dc.showMoreRoutes || "View other regional routes"))}
                <span aria-hidden="true">{regionalDecisionOpen ? " ↑" : " ↓"}</span>
              </button>}
            </div>
          </div>
        )}

        {compact && (<>
        <div className="yellow-pages__tabs" role="group" aria-label={ui.sectionTitle}>
          {categories.map((cat) => (
            <button key={cat.id} type="button"
              aria-pressed={selectedCategory === cat.id}
              className="yellow-pages__tab"
              data-active={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {!compact && (
          <div className="yellow-pages__search" role="search">
            <label htmlFor="yellow-pages-search" className="yellow-pages__search-label">{ui.searchLabel}</label>
            <div className="yellow-pages__search-control">
              <input
                id="yellow-pages-search"
                className="yellow-pages__search-input"
                type="search"
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => { setSearchQuery(event.target.value); setShowAllVenues(false); }}
                placeholder={ui.searchPlaceholder}
                autoComplete="off"
                spellCheck="false"
              />
              {searchQuery && (
                <button type="button" className="yellow-pages__search-clear" onClick={clearDirectorySearch} aria-label={ui.clearSearch}>
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        <div className="yellow-pages__controls">
          <div className="yellow-pages__filter-chips" role="group" aria-label="filters">
            {[
              { key: "noKyc", label: fl.noKyc },
              { key: "por", label: fl.por },
              { key: "fiat", label: fl.fiat },
              { key: "highLev", label: fl.highLev },
            ].map(({ key, label }) => (
              <button key={key} type="button"
                className={`yellow-pages__chip${filters[key] ? " yellow-pages__chip--active" : ""}`}
                aria-pressed={filters[key]}
                onClick={() => toggleFilter(key)}
              >{label}</button>
            ))}
          </div>
          <div className="yellow-pages__sort">
            <label htmlFor="yp-sort" className="yellow-pages__sort-label">{fl.sortLabel}</label>
            <select id="yp-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="yellow-pages__sort-select">
              <option value="default">{fl.sortDefault}</option>
              <option value="fee">{fl.sortFee}</option>
              <option value="rebate">{fl.sortRebate}</option>
            </select>
          </div>
        </div>
        </>)}
      </div>

      {!compact ? (
        <div className="mx-page__inner">
          <ExchangeMatrix
            venues={filteredVenues}
            totalCount={contextualVenues.length}
            locale={locale}
            ui={ui}
            mc={matrixCopy(locale)}
            context={context}
            market={market}
            product={product}
            contextSearch={contextSearch}
            accountStage={effectiveAccountStage}
            funding={effectiveFunding}
            selectedCategory={selectedCategory}
            onCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            onClearSearch={clearDirectorySearch}
            searchInputRef={searchInputRef}
            compareSelection={compareSelection}
            onToggleCompare={toggleCompareSelection}
            onClearCompare={() => setCompareSelection([])}
            compareHref={compareHref}
            onCopyCode={handleCopyCode}
            renderCopyFeedback={renderCopyFeedback}
            copiedToast={copiedToast}
            onReset={() => { setFilters({ noKyc: false, por: false, fiat: false, highLev: false }); setSearchQuery(""); setSelectedCategory("all"); }}
            regionalReturnHref={regionalReturnHref}
          />
        </div>
      ) : filteredVenues.length === 0 ? (
        <div className="yellow-pages__empty" role="status">
          <h2>{ui.emptyTitle}</h2>
          <p>{ui.emptyBody}</p>
          <button type="button" onClick={() => { setFilters({ noKyc: false, por: false, fiat: false, highLev: false }); setSearchQuery(""); requestAnimationFrame(() => searchInputRef.current?.focus?.({ preventScroll: true })); }}>
            {ui.resetFilters}
          </button>
          {regionalReturnHref ? <a className="yellow-pages__region-return" href={regionalReturnHref} data-cta-placement="directory-empty-region-return">{ui.returnToRegion}</a> : null}
        </div>
      ) : (
        <div className={`yellow-pages__grid${compact ? " yellow-pages__grid--compact" : " yellow-pages__grid--directory"}${!compact && !showAllVenues ? " yellow-pages__grid--collapsed" : ""}`}>
          {filteredVenues.map((venue, index) => {
          const db = venueDatabase[venue.slug] || {};
          const marketStatus = venueMarketStatus(venue, market);
          const partner = partnerRegistry[venue.slug] || {
            slug: venue.slug,
            officialDomain: db.officialDomain || venue.officialDomain || `${venue.slug}.com`,
            hasReferral: db.hasReferral || false,
            inviteCode: db.inviteCode || null,
            registrationUrl: db.registrationUrl || `https://${db.officialDomain || venue.officialDomain || `${venue.slug}.com`}`,
          };
          const commercialClaim = resolveCommercialClaim({ partner, venue: db });
          const commercialVerified = commercialClaim.status === "verified";
          const decision = venueDecisionContent[venue.slug];
          const sourceReviewed = Boolean(db.decisionSourceReviewedAt);
          const hasDetailPage = Boolean(decision);
          const isZhLocale = locale.startsWith("zh");
          const fitText = sourceReviewed
            ? sanitizeEditorialText(isZhLocale
              ? (decision?.fit?.[locale] || decision?.fit?.["zh-Hans"] || "")
              : (decision?.fit?.en || decision?.fit?.[locale] || ""), locale)
            : (isZhLocale ? "公开产品、地区资格与官方费率待逐项核对" : (dc.fitPending || "Verify public products, regional eligibility and official fees first"));
          const perkText = isZhLocale
            ? (db.benefit?.[locale] || db.benefit?.["zh-Hans"] || partner.benefit?.[locale] || partner.benefit?.["zh-Hans"] || "")
            : (db.benefit?.en || db.benefit?.[locale] || partner.benefit?.en || partner.benefit?.[locale] || "");
          const spotFee = feeDisplay(venue.slug, "spot", locale);
          const futuresFee = feeDisplay(venue.slug, "perp", locale);
          const porCoverage = db.porCoverageRatio && db.porAuditCheckedAt ? db.porCoverageRatio : null;
          const welcomeBadge = commercialVerified && isZhLocale
            ? (db.welcomeRewardBadge?.[locale] || db.welcomeRewardBadge?.["zh-Hans"] || "")
            : commercialVerified ? (db.welcomeRewardBadge?.en || db.welcomeRewardBadge?.[locale] || "") : "";
          const kycSummary = db.kycCheckedAt
            ? (isZhLocale
              ? (db.kycSummary?.[locale] || db.kycSummary?.["zh-Hans"] || null)
              : (db.kycSummary?.en || db.kycSummary?.[locale] || null))
            : null;
          const trust = null;
          const publicCta = publicCtaForVenue(venue.slug, locale, market);
          const hasReferral = publicCta.hasReferral;
          const inviteCode = publicCta.inviteCode;
          const registrationUrl = venueGoHref(venue.slug, "directory-card", locale, market);
          const officialDomain = partner.officialDomain ?? db.officialDomain;
          const regionalCandidate = regionalDirectoryCandidateState(venue, { market, product, locale, accountStage: effectiveAccountStage, funding: effectiveFunding });
          const displayMarketStatus = regionalCandidate.status !== "unscoped" ? regionalCandidate.status : marketStatus;
          const ctaState = regionalCtaState({ market, status: displayMarketStatus });
          const canOpenRegistration = ctaState !== "blocked" && hasReferral && Boolean(registrationUrl);

          const catClass = String(venue.category || "").toLowerCase().replace(/\s+/g, "-");
          const detailExpanded = compactDirectory && (expandedVenueDetails || []).includes(venue.slug);
          const toggleVenueDetails = () => setExpandedVenueDetails((current) => {
            const seed = [...(current || [])];
            if (seed.includes(venue.slug)) return seed.filter((slug) => slug !== venue.slug);
            return [...seed, venue.slug];
          });

          return (
            <article key={venue.slug} className={`yellow-card yellow-card--${catClass}${compact ? " yellow-card--compact" : " yellow-card--directory"}${detailExpanded ? " is-detail-open" : ""}`}>
              <div className="yellow-card__top">
                <div className="yellow-card__identity">
                  <div className="yellow-card__brand">
                    <BrandMark slug={venue.slug} compact />
                    <span className="yellow-card__name" translate="no">{getLocalizedVenueName(venue, locale)}</span>
                  </div>
                  <div className="yellow-card__badges">
                    <span className="yellow-card__category" translate="no" lang="en">{venue.category}</span>
                    {context.scoped && displayMarketStatus === "matched" && <span className="yellow-card__market-fit">{regionalUi.matched}</span>}
                    {context.scoped && displayMarketStatus === "researchable" && <span className="yellow-card__market-fit yellow-card__market-fit--research">{regionalUi.researchable}</span>}
                    {context.scoped && displayMarketStatus === "paused" && <span className="yellow-card__market-fit yellow-card__market-fit--paused">{regionalUi.paused}</span>}
                    {sourceReviewed && /^\d{4}-\d{2}-\d{2}/.test(String(db.decisionSourceReviewedAt)) && (
                      <span className="yellow-card__trust yellow-card__trust--status">
                        {(CHECKED_LABELS[locale] || CHECKED_LABELS[String(locale).split("-")[0]] || CHECKED_LABELS.en)} {String(db.decisionSourceReviewedAt).slice(0, 10)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="yellow-card__domain-row">
                  <div className="yellow-card__domain">
                    <span aria-hidden="true"></span>
                    <span translate="no" lang="en">{officialDomain}</span>
                  </div>
                  {porCoverage && (
                    <span className="yellow-card__por-pill" title={`Proof of Reserves: ${porCoverage}`}>
                     {porCoverage.split(" ")[0]}
                    </span>
                  )}
                </div>

                {welcomeBadge && (
                  <div className="yellow-card__reward-badge">
                    <span className="yellow-card__reward-text">{welcomeBadge}</span>
                  </div>
                )}

                {fitText && <p className="yellow-card__fit">{fitText}</p>}

                <details className="yellow-card__facts-disclosure">
                  <summary>{isZhLocale ? "查看费率、PoR 与 KYC 状态" : (dc.factsSummary || "View fee, PoR and KYC status")}</summary>
                  <div className="yellow-card__meta-grid">
                  <div className="yellow-card__meta-item">
                    <span className="yellow-card__meta-key">{isZhLocale ? "现货费率" : (dc.spotFee || "Spot Fee")}</span>
                    <span className="yellow-card__meta-val" translate="no">{spotFee || (isZhLocale ? "待来源核验" : ({ es: "Pendiente de verificación de la fuente", pt: "Aguardando verificação da fonte", ja: "出典確認待ち", ko: "출처 확인 대기", tr: "Kaynak doğrulaması bekleniyor", fr: "Vérification de la source en attente", de: "Quellenprüfung ausstehend", ru: "Ожидается проверка источника", ar: "بانتظار التحقق من المصدر", id: "Menunggu verifikasi sumber", vi: "Đang chờ xác minh nguồn", it: "Verifica della fonte in sospeso" }[String(locale || "").split("-")[0]] || "Pending source review"))}</span>
                  </div>
                  <div className="yellow-card__meta-item">
                    <span className="yellow-card__meta-key">{isZhLocale ? "合约 / 池费" : (dc.futuresPool || "Futures / Pool")}</span>
                    <span className="yellow-card__meta-val yellow-card__meta-val--highlight" translate="no">{futuresFee || (isZhLocale ? "待来源核验" : ({ es: "Pendiente de verificación de la fuente", pt: "Aguardando verificação da fonte", ja: "出典確認待ち", ko: "출처 확인 대기", tr: "Kaynak doğrulaması bekleniyor", fr: "Vérification de la source en attente", de: "Quellenprüfung ausstehend", ru: "Ожидается проверка источника", ar: "بانتظار التحقق من المصدر", id: "Menunggu verifikasi sumber", vi: "Đang chờ xác minh nguồn", it: "Verifica della fonte in sospeso" }[String(locale || "").split("-")[0]] || "Pending source review"))}</span>
                  </div>
                  <div className="yellow-card__meta-item">
                    <span className="yellow-card__meta-key">{isZhLocale ? "储备证明 PoR" : (dc.porReserves || "PoR Reserves")}</span>
                    <span className={`yellow-card__meta-val${porCoverage ? " yellow-card__meta-val--success" : ""}`} translate="no">{porCoverage ? (porCoverage.length > 14 ? porCoverage.slice(0, 14) + "…" : porCoverage) : (isZhLocale ? "待来源核验" : ({ es: "Pendiente de verificación de la fuente", pt: "Aguardando verificação da fonte", ja: "出典確認待ち", ko: "출처 확인 대기", tr: "Kaynak doğrulaması bekleniyor", fr: "Vérification de la source en attente", de: "Quellenprüfung ausstehend", ru: "Ожидается проверка источника", ar: "بانتظار التحقق من المصدر", id: "Menunggu verifikasi sumber", vi: "Đang chờ xác minh nguồn", it: "Verifica della fonte in sospeso" }[String(locale || "").split("-")[0]] || "Pending source review"))}</span>
                  </div>
                  <div className="yellow-card__meta-item">
                    <span className="yellow-card__meta-key">KYC</span>
                    <span className="yellow-card__meta-val">{kycSummary || (isZhLocale ? "以官方流程为准" : ui.officialFlow)}</span>
                  </div>
                  </div>
                </details>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <div className="yellow-card__perk-row">
                  {hasReferral && inviteCode ? (
                    <>
                      <div className="yellow-card__perk-code-line">
                        <span style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>{ui.codeLabel}:</span>
                        <button
                          type="button"
                          className="yellow-card__code yellow-card__code--btn"
                          title={locale.startsWith("zh") ? "点击复制专属邀请码" : (dc.copyInviteTitle || "Click to copy invite code")}
                          onClick={(e) => handleCopyCode(inviteCode, `${venue.slug}-compact`, e)}
                        >
                          <strong translate="no" lang="en">{inviteCode}</strong>
                          <span className="yellow-card__code-icon" aria-hidden="true"></span>
                        </button>
                      </div>
                      {renderCopyFeedback(`${venue.slug}-compact`)}
                      <span className="yellow-card__perk-text">{commercialVerified ? perkText : (isZhLocale ? "用户权益待官方核验" : ui.benefitPending)}</span>
                    </>
                  ) : (
                    <span className="yellow-card__perk-text yellow-card__perk-text--neutral">
                      {commercialVerified ? (perkText || ui.noCode) : (isZhLocale ? "用户权益待官方核验" : ui.benefitPending)}
                    </span>
                  )}
                </div>
                <div className="yellow-card__actions">
                  {compactDirectory && (
                    <button
                      type="button"
                      className="yellow-card__btn-toggle"
                      aria-expanded={detailExpanded}
                      aria-controls={`yellow-card-details-${venue.slug}`}
                      onClick={toggleVenueDetails}
                    >
                      {detailToggleCopy(detailExpanded)}
                    </button>
                  )}
                  {!compact && (
                    <button
                      type="button"
                      className={`yellow-card__btn-compare${compareSelection.includes(venue.slug) ? " is-selected" : ""}`}
                      aria-pressed={compareSelection.includes(venue.slug)}
                      disabled={!compareSelection.includes(venue.slug) && compareSelection.length >= 2}
                      data-cta-kind="research"
                      data-cta-platform={venue.slug}
                      data-cta-placement="directory-compare-select"
                      data-growth-decision={venue.slug}
                      data-growth-placement="directory-compare-select"
                      data-growth-market={context.market}
                      data-growth-product={context.product}
                      onClick={() => toggleCompareSelection(venue.slug)}
                    >
                      {compareSelection.includes(venue.slug) ? ui.compareRemove : ui.compareSelect}
                    </button>
                  )}
                  {hasDetailPage ? (
                    <a href={localizedHref(`/exchanges/${venue.slug}?${contextSearch}`, { locale })} className="yellow-card__btn-detail" style={{ color: "#e2e8f0", textDecoration: "none" }} data-cta-kind="research" data-cta-platform={venue.slug} data-cta-placement="directory-card-detail" data-growth-decision={venue.slug} data-growth-placement="directory-card-detail" data-growth-market={context.market} data-growth-product={context.product} data-growth-campaign={growthCampaign}>
                      {ui.viewDetail}
                    </a>
                  ) : (
                    <span className="yellow-card__btn-detail yellow-card__btn-detail--disabled" aria-disabled="true">
                      {isZhLocale ? "详情待补充" : (dc.detailPending || ui.profilePending)}
                    </span>
                  )}
                  {canOpenRegistration ? (
                    <span data-signup-cta={venue.slug} className="signup-cta-block"><a href={registrationUrl} target="_blank" rel="sponsored noopener noreferrer" className="yellow-card__btn-register" data-cta-kind="registration" data-cta-platform={venue.slug} data-cta-placement="directory-card" data-growth-decision={venue.slug} data-growth-placement="directory-card" data-growth-market={context.market} data-growth-product={context.product} data-growth-campaign={growthCampaign}>
                      {hasReferral ? ui.openSignup : ui.openApp}
                    </a><SignupEvidence slug={venue.slug} locale={locale} market={market} /></span>
                  ) : (
                    <a href={localizedHref(`/exchanges/${venue.slug}?${contextSearch}#registration-path`, { locale })} className="yellow-card__btn-register yellow-card__btn-register--verify" data-cta-placement="directory-card-eligibility" data-growth-decision="regional_eligibility" data-growth-placement="directory-card-eligibility" data-growth-market={context.market} data-growth-product={context.product} data-growth-campaign={growthCampaign}>
                      {isZhLocale ? "先核对地区资格" : (dc.verifyEligibility || ui.verifyEligibility)}
                    </a>
                  )}
                </div>
              </div>
              {compactDirectory && (
                <div
                  id={`yellow-card-details-${venue.slug}`}
                  className="yellow-card__directory-details"
                  hidden={!detailExpanded}
                >
                  {fitText && <p className="yellow-card__fit yellow-card__fit--directory">{fitText}</p>}
                  <section className="yellow-card__facts-section yellow-card__facts-section--directory">
                    <h3 className="yellow-card__facts-heading">{isZhLocale ? "查看费率、PoR 与 KYC 状态" : (dc.factsSummary || "View fee, PoR and KYC status")}</h3>
                    <div className="yellow-card__meta-grid">
                      <div className="yellow-card__meta-item">
                        <span className="yellow-card__meta-key">{isZhLocale ? "现货费率" : (dc.spotFee || "Spot Fee")}</span>
                        <span className="yellow-card__meta-val" translate="no">{spotFee || (isZhLocale ? "待来源核验" : ({ es: "Pendiente de verificación de la fuente", pt: "Aguardando verificação da fonte", ja: "出典確認待ち", ko: "출처 확인 대기", tr: "Kaynak doğrulaması bekleniyor", fr: "Vérification de la source en attente", de: "Quellenprüfung ausstehend", ru: "Ожидается проверка источника", ar: "بانتظار التحقق من المصدر", id: "Menunggu verifikasi sumber", vi: "Đang chờ xác minh nguồn", it: "Verifica della fonte in sospeso" }[String(locale || "").split("-")[0]] || "Pending source review"))}</span>
                      </div>
                      <div className="yellow-card__meta-item">
                        <span className="yellow-card__meta-key">{isZhLocale ? "合约 / 池费" : (dc.futuresPool || "Futures / Pool")}</span>
                        <span className="yellow-card__meta-val yellow-card__meta-val--highlight" translate="no">{futuresFee || (isZhLocale ? "待来源核验" : ({ es: "Pendiente de verificación de la fuente", pt: "Aguardando verificação da fonte", ja: "出典確認待ち", ko: "출처 확인 대기", tr: "Kaynak doğrulaması bekleniyor", fr: "Vérification de la source en attente", de: "Quellenprüfung ausstehend", ru: "Ожидается проверка источника", ar: "بانتظار التحقق من المصدر", id: "Menunggu verifikasi sumber", vi: "Đang chờ xác minh nguồn", it: "Verifica della fonte in sospeso" }[String(locale || "").split("-")[0]] || "Pending source review"))}</span>
                      </div>
                      <div className="yellow-card__meta-item">
                        <span className="yellow-card__meta-key">{isZhLocale ? "储备证明 PoR" : (dc.porReserves || "PoR Reserves")}</span>
                        <span className={`yellow-card__meta-val${porCoverage ? " yellow-card__meta-val--success" : ""}`} translate="no">{porCoverage ? (porCoverage.length > 14 ? porCoverage.slice(0, 14) + "…" : porCoverage) : (isZhLocale ? "待来源核验" : ({ es: "Pendiente de verificación de la fuente", pt: "Aguardando verificação da fonte", ja: "出典確認待ち", ko: "출처 확인 대기", tr: "Kaynak doğrulaması bekleniyor", fr: "Vérification de la source en attente", de: "Quellenprüfung ausstehend", ru: "Ожидается проверка источника", ar: "بانتظار التحقق من المصدر", id: "Menunggu verifikasi sumber", vi: "Đang chờ xác minh nguồn", it: "Verifica della fonte in sospeso" }[String(locale || "").split("-")[0]] || "Pending source review"))}</span>
                      </div>
                      <div className="yellow-card__meta-item">
                        <span className="yellow-card__meta-key">KYC</span>
                        <span className="yellow-card__meta-val">{kycSummary || (isZhLocale ? "以官方流程为准" : ui.officialFlow)}</span>
                      </div>
                    </div>
                  </section>
                  <div className="yellow-card__perk-row yellow-card__perk-row--directory">
                    {hasReferral && inviteCode ? (
                      <>
                        <div className="yellow-card__perk-code-line">
                          <span style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>{ui.codeLabel}:</span>
                          <button
                            type="button"
                            className="yellow-card__code yellow-card__code--btn"
                            title={locale.startsWith("zh") ? "点击复制专属邀请码" : (dc.copyInviteTitle || "Click to copy invite code")}
                            onClick={(e) => handleCopyCode(inviteCode, `${venue.slug}-directory`, e)}
                          >
                            <strong translate="no" lang="en">{inviteCode}</strong>
                            <span className="yellow-card__code-icon" aria-hidden="true"></span>
                          </button>
                        </div>
                        {renderCopyFeedback(`${venue.slug}-directory`)}
                        <span className="yellow-card__perk-text">{commercialVerified ? perkText : (isZhLocale ? "用户权益待官方核验" : ui.benefitPending)}</span>
                      </>
                    ) : (
                      <span className="yellow-card__perk-text yellow-card__perk-text--neutral">
                        {commercialVerified ? (perkText || ui.noCode) : (isZhLocale ? "用户权益待官方核验" : ui.benefitPending)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
          })}
        </div>
      )}
      {false && !compact && compareSelection.length > 0 && (
        <div className="yellow-pages__compare-tray" role="status" aria-live="polite">
          <span>{compareSelection.length === 2 ? ui.compareOpen : ui.compareNeed} · {compareSelection.join(" + ")}</span>
          <div>
            {compareHref && <a href={compareHref} className="yellow-pages__compare-open" data-cta-kind="research" data-cta-placement="directory-compare-open" data-growth-decision="directory_compare_open" data-growth-placement="directory-compare-open" data-growth-market={context.market} data-growth-product={context.product}>{ui.compareOpen} →</a>}
            <button type="button" className="yellow-pages__compare-clear" onClick={() => setCompareSelection([])}>{ui.compareClear}</button>
          </div>
        </div>
      )}
      {false && !compact && filteredVenues.length > 6 && (
        <button
          type="button"
          className="yellow-pages__expand"
          aria-expanded={showAllVenues}
          onClick={() => setShowAllVenues((value) => !value)}
        >
          {showAllVenues ? ui.viewLess : (
            <>
              <span className="yellow-pages__expand-count yellow-pages__expand-count--desktop">{ui.viewMore} ({Math.max(filteredVenues.length - 6, 0)})</span>
              <span className="yellow-pages__expand-count yellow-pages__expand-count--mobile">{ui.viewMore} ({Math.max(filteredVenues.length - 3, 0)})</span>
            </>
          )}
          <span aria-hidden="true">{showAllVenues ? " ↑" : " ↓"}</span>
        </button>
      )}
      {compact && filteredVenues.length > 6 && (
        <div className="yellow-pages__compact-more">
          <span className="yellow-pages__expand-count--mobile">{locale.startsWith("zh") ? `首页桌面展示首批 6 个平台，移动端展示 3 个，共 ${filteredVenues.length} 个可查阅。` : (dc.compactSummary?.(filteredVenues.length) || (ui.resultSummary ? ui.resultSummary(filteredVenues.length) : `Showing the first 6 platforms on desktop and 3 on mobile; ${filteredVenues.length} are available in the directory.`))}</span>
          <a href={localizedHref(`/exchanges?${contextSearch}`, { locale })}>{ui.viewAll} <span aria-hidden="true">→</span></a>
        </div>
      )}
      {copiedToast && (
        <div className="yellow-pages__toast" role="status" aria-live="polite">
          <span className="yellow-pages__toast-check">✓</span>
          <span>{locale.startsWith("zh") ? `已复制专属邀请码 [${copiedToast}]` : (dc.copied?.(copiedToast) || `Copied invite code [${copiedToast}]`)}</span>
        </div>
      )}
    </section>
  );
}

export default VenueYellowPages;
