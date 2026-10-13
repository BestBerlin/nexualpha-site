/**
 * FeeBenchmarkTerminal — B1. Published fee benchmark
 * 展示带来源状态的基础费率；没有字段级核验时保持待核验。
 */
import React, { useState } from "react";
import { pluralPhrase } from "../../data/plural-copy.js";
import { ctaUiCopy } from "../../data/cta-ui-copy.js";
import { venueDatabase } from "../../data/venue-database.js";
import { partnerRegistry } from "../../data/partner-registry.js";
import { resolveCommercialClaim } from "../../data/commercial-claims.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import { getLocalizedVenueName } from "../../utils/venue-name-helper.js";
import "./fee-benchmark-terminal.css";
import { CostDecision } from "./CostDecision.jsx";
import { regionalVenueCta } from "../../data/source-bound-cta.js";
import { isTurkeyGated } from "../../data/partner-geo-policy.js";
import { DecisionPathRail } from "./DecisionPathRail.jsx";
import { localizedHref } from "../../data/locale-routing.js";
import { formatPercent } from "../../data/format-percent.js";
import { buildVenueFeeSummary, feeSummaryCopy } from "../../data/venue-fee-summary.js";
import { reviewedFeeCopy } from "../../data/reviewed-fee-copy.js";
import { matrixCopy } from "./exchange-matrix-copy.js";
import { directoryContextSearch } from "../../data/directory-context.js";
import { appendDecisionPassportQuery, readDecisionPassport } from "../../data/decision-passport.js";
import { OnsiteTelegramBotHandoff } from "./OnsiteTelegramBotHandoff.jsx";
import { feePctOfRate, isoDay } from "../../data/exchange-facts.js";
import { partnerBenefitStatus } from "../../data/partner-benefit-status.js";
import { costBasisCopy } from "../../data/cost-decision-copy.js";
import { h7Copy } from "../v7/home7-copy.js";

// Scope and conditions are two sentences: the scope gets its own full stop ("…USDC columns. Uses…").
const sentence = (t) => { const v = String(t || "").trim(); return !v || /[.!?。！？:：]$/.test(v) ? v : `${v}.`; };

const MONITOR_SLUGS = Object.keys(venueDatabase);
const MONITOR_VENUE_COUNT = MONITOR_SLUGS.length;


const LOCALE_ALIASES = Object.freeze({
  zh: "zh-Hans",
  "zh-CN": "zh-Hans",
  "zh-SG": "zh-Hans",
  "zh-TW": "zh-Hant",
  "zh-HK": "zh-Hant",
  "zh-MO": "zh-Hant",
  pt: "pt-BR",
});

const stateCopy = Object.freeze({
  en: {
    sourcePending: "Pending source review",
    commercialPending: "Official check pending",
    netPending: "Not calculated",
    trendPending: "No reviewed trend",
    maker: "Maker",
    taker: "Taker",
    checked: "checked",
    conditions: "Conditions",
    source: "Source",
    spot: "Spot",
    futures: "Futures",
  },
  "zh-Hans": {
    sourcePending: "待来源核验",
    commercialPending: "待官方核验",
    netPending: "暂不计算",
    trendPending: "无已核验趋势",
    maker: "Maker",
    taker: "Taker",
    checked: "核验",
    conditions: "条件",
    source: "来源",
    spot: "现货",
    futures: "合约",
  },
  "zh-Hant": {
    sourcePending: "待來源核驗",
    commercialPending: "待官方核驗",
    netPending: "暫不計算",
    trendPending: "無已核驗趨勢",
    maker: "Maker",
    taker: "Taker",
    checked: "核驗",
    conditions: "條件",
    source: "來源",
    spot: "現貨",
    futures: "合約",
  },
  es: {
    sourcePending: "Fuente pendiente de revisión",
    commercialPending: "Verificación oficial pendiente",
    netPending: "Sin calcular",
    trendPending: "Sin tendencia revisada",
    maker: "Maker",
    taker: "Taker",
    checked: "revisado",
    conditions: "Condiciones",
    source: "Fuente",
    spot: "Spot",
    futures: "Futuros",
  },
  "pt-BR": {
    sourcePending: "Fonte pendente de revisão",
    commercialPending: "Verificação oficial pendente",
    netPending: "Não calculada",
    trendPending: "Sem tendência revisada",
    maker: "Maker",
    taker: "Taker",
    checked: "revisado",
    conditions: "Condições",
    source: "Fonte",
    spot: "Spot",
    futures: "Futuros",
  },
  fr: {
    sourcePending: "Source en attente de vérification",
    commercialPending: "Vérification officielle en attente",
    netPending: "Non calculé",
    trendPending: "Aucune tendance vérifiée",
    maker: "Maker",
    taker: "Taker",
    checked: "vérifié",
    conditions: "Conditions",
    source: "Source",
    spot: "Spot",
    futures: "Futures",
  },
  de: {
    sourcePending: "Quellenprüfung ausstehend",
    commercialPending: "Offizielle Prüfung ausstehend",
    netPending: "Nicht berechnet",
    trendPending: "Kein geprüfter Trend",
    maker: "Maker",
    taker: "Taker",
    checked: "geprüft",
    conditions: "Bedingungen",
    source: "Quelle",
    spot: "Spot",
    futures: "Futures",
  },
  ja: {
    sourcePending: "出典確認待ち",
    commercialPending: "公式確認待ち",
    netPending: "未計算",
    trendPending: "確認済み推移なし",
    maker: "Maker",
    taker: "Taker",
    checked: "確認日",
    conditions: "条件",
    source: "出典",
    spot: "現物",
    futures: "先物",
  },
  ko: {
    sourcePending: "출처 확인 대기",
    commercialPending: "공식 확인 대기",
    netPending: "계산 안 됨",
    trendPending: "검토된 추이 없음",
    maker: "Maker",
    taker: "Taker",
    checked: "확인일",
    conditions: "조건",
    source: "출처",
    spot: "현물",
    futures: "선물",
  },
  ar: {
    sourcePending: "بانتظار مراجعة المصدر",
    commercialPending: "بانتظار التحقق الرسمي",
    netPending: "غير محسوب",
    trendPending: "لا اتجاه مُراجع",
    maker: "Maker",
    taker: "Taker",
    checked: "تمت المراجعة",
    conditions: "الشروط",
    source: "المصدر",
    spot: "فوري",
    futures: "عقود",
  },
  tr: {
    sourcePending: "Kaynak incelemesi bekleniyor",
    commercialPending: "Resmi doğrulama bekleniyor",
    netPending: "Hesaplanmadı",
    trendPending: "İncelenmiş trend yok",
    maker: "Maker",
    taker: "Taker",
    checked: "incelendi",
    conditions: "Koşullar",
    source: "Kaynak",
    spot: "Spot",
    futures: "Vadeli",
  },
  ru: {
    sourcePending: "Ожидается проверка источника",
    commercialPending: "Ожидается официальная проверка",
    netPending: "Не рассчитано",
    trendPending: "Нет проверенного тренда",
    maker: "Maker",
    taker: "Taker",
    checked: "проверено",
    conditions: "Условия",
    source: "Источник",
    spot: "Спот",
    futures: "Фьючерсы",
  },
  id: {
    sourcePending: "Menunggu tinjauan sumber",
    commercialPending: "Menunggu verifikasi resmi",
    netPending: "Belum dihitung",
    trendPending: "Tidak ada tren tertinjau",
    maker: "Maker",
    taker: "Taker",
    checked: "ditinjau",
    conditions: "Ketentuan",
    source: "Sumber",
    spot: "Spot",
    futures: "Futures",
  },
  vi: {
    sourcePending: "Đang chờ rà soát nguồn",
    commercialPending: "Đang chờ xác minh chính thức",
    netPending: "Chưa tính",
    trendPending: "Chưa có xu hướng đã rà soát",
    maker: "Maker",
    taker: "Taker",
    checked: "đã rà soát",
    conditions: "Điều kiện",
    source: "Nguồn",
    spot: "Spot",
    futures: "Futures",
  },
  it: {
    sourcePending: "Fonte in attesa di revisione",
    commercialPending: "Verifica ufficiale in sospeso",
    netPending: "Non calcolato",
    trendPending: "Nessun trend verificato",
    maker: "Maker",
    taker: "Taker",
    checked: "verificato",
    conditions: "Condizioni",
    source: "Fonte",
    spot: "Spot",
    futures: "Futures",
  },
  // l10n: needs native review
  ur: { sourcePending: "ماخذ جائزہ زیر التوا", commercialPending: "سرکاری چیک زیر التوا", netPending: "حساب نہیں ہوا", trendPending: "کوئی جائزہ شدہ رجحان نہیں", maker: "Maker", taker: "Taker", checked: "جائزہ شدہ", conditions: "شرائط", source: "ماخذ", spot: "اسپاٹ", futures: "فیوچرز" },
  // l10n: needs native review
  uk: { sourcePending: "Очікує перевірки джерела", commercialPending: "Очікує офіційної перевірки", netPending: "Не розраховано", trendPending: "Немає перевіреного тренду", maker: "Maker", taker: "Taker", checked: "перевірено", conditions: "Умови", source: "Джерело", spot: "Спот", futures: "Ф’ючерси" },
});


// One row replaces the venues with no checked fee, no checked benefit and no reviewed trend.
// CLDR plural forms per locale (audit NX-07): "1 plateforme en attente", "2 платформы ожидают", "5 платформ ожидают".
const pendingGroupForms = Object.freeze({
  en: { one: "{n} venue pending source review", other: "{n} venues pending source review" },
  "zh-Hans": { other: "{n} 家平台待来源核验" },
  "zh-Hant": { other: "{n} 家平台待來源核驗" },
  es: { one: "{n} plataforma pendiente de revisión de fuente", other: "{n} plataformas pendientes de revisión de fuente" },
  "pt-BR": { one: "{n} plataforma com fonte pendente de revisão", other: "{n} plataformas com fonte pendente de revisão" },
  fr: { one: "{n} plateforme en attente de vérification de source", other: "{n} plateformes en attente de vérification de source" },
  de: { one: "{n} Plattform mit ausstehender Quellenprüfung", other: "{n} Plattformen mit ausstehender Quellenprüfung" },
  ja: { other: "{n}件のサービスが出典確認待ち" },
  ko: { other: "{n}개 플랫폼 출처 확인 대기" },
  ar: { one: "منصة واحدة بانتظار مراجعة المصدر", two: "منصتان بانتظار مراجعة المصدر", few: "{n} منصات بانتظار مراجعة المصدر", other: "{n} منصة بانتظار مراجعة المصدر" },
  tr: { other: "{n} platform kaynak incelemesi bekliyor" },
  ru: { one: "{n} платформа ожидает проверки источника", few: "{n} платформы ожидают проверки источника", many: "{n} платформ ожидают проверки источника", other: "{n} платформы ожидают проверки источника" },
  id: { other: "{n} platform menunggu tinjauan sumber" },
  vi: { other: "{n} nền tảng đang chờ rà soát nguồn" },
  it: { one: "{n} piattaforma con fonte in attesa di revisione", other: "{n} piattaforme con fonte in attesa di revisione" },
  // l10n: needs native review
  ur: { one: "{n} پلیٹ فارم ماخذ جائزے کا منتظر", other: "{n} پلیٹ فارم ماخذ جائزے کے منتظر" },
  // l10n: needs native review
  uk: { one: "{n} платформа очікує перевірки джерела", few: "{n} платформи очікують перевірки джерела", many: "{n} платформ очікують перевірки джерела", other: "{n} платформи очікують перевірки джерела" },
});
const pendingGroupCopy = Object.freeze(Object.fromEntries(Object.keys(pendingGroupForms).map((code) => [code, (n) => pluralPhrase(pendingGroupForms, n, code)])));

const nextStepCopy = Object.freeze({
  en: ["Need the full directory?", "Keep the same market and product context when you browse all platforms. Telegram is available after the on-site checks.", "View platform directory →", "Telegram support ↗"],
  "zh-Hans": ["需要完整平台目录？", "浏览全部平台时保留当前地区和产品条件。Telegram 放在站内核对之后。", "查看平台目录 →", "Telegram 辅助 ↗"],
  "zh-Hant": ["需要完整平台目錄？", "瀏覽全部平台時保留目前地區與產品條件。Telegram 放在站內核對之後。", "查看平台目錄 →", "Telegram 輔助 ↗"],
  es: ["¿Necesitas el directorio completo?", "Mantén el mismo mercado y producto al revisar todas las plataformas. Telegram queda como apoyo después de la revisión en el sitio.", "Ver directorio de plataformas →", "Apoyo en Telegram ↗"],
  "pt-BR": ["Precisa do diretório completo?", "Mantenha o mesmo mercado e produto ao revisar todas as plataformas. Telegram fica como apoio depois da checagem no site.", "Ver diretório de plataformas →", "Apoio no Telegram ↗"],
  fr: ["Besoin du répertoire complet ?", "Gardez le même marché et le même produit pour parcourir toutes les plateformes. Telegram reste un soutien après les vérifications sur site.", "Voir le répertoire des plateformes →", "Support Telegram ↗"],
  de: ["Vollständiges Verzeichnis nötig?", "Behalten Sie Markt und Produkt beim Prüfen aller Plattformen bei. Telegram bleibt Unterstützung nach den On-site-Checks.", "Plattformverzeichnis öffnen →", "Telegram-Support ↗"],
  ja: ["全プラットフォームを見る", "同じ市場・商品条件のまま一覧を確認できます。Telegramはサイト内確認後の補助です。", "プラットフォーム一覧 →", "Telegram補助 ↗"],
  ko: ["전체 플랫폼 보기", "같은 시장과 상품 조건으로 모든 플랫폼을 확인하세요. Telegram은 사이트 내 확인 뒤 보조 경로입니다.", "플랫폼 전체 보기 →", "Telegram 보조 ↗"],
  ar: ["هل تحتاج إلى الدليل الكامل؟", "احتفظ بنفس السوق والمنتج عند مراجعة كل المنصات. Telegram مسار دعم بعد فحوصات الموقع.", "عرض دليل المنصات →", "دعم Telegram ↗"],
  tr: ["Tam dizin gerekli mi?", "Tüm platformları incelerken aynı piyasa ve ürün bağlamını koruyun. Telegram site içi kontrollerden sonra destek yoludur.", "Platform dizinini gör →", "Telegram desteği ↗"],
  ru: ["Нужен полный каталог?", "Сохраняйте тот же рынок и продукт при просмотре всех платформ. Telegram остается поддержкой после проверки на сайте.", "Открыть каталог платформ →", "Поддержка Telegram ↗"],
  id: ["Perlu direktori lengkap?", "Pertahankan konteks pasar dan produk yang sama saat meninjau semua platform. Telegram menjadi dukungan setelah cek di situs.", "Lihat direktori platform →", "Dukungan Telegram ↗"],
  vi: ["Cần danh mục đầy đủ?", "Giữ cùng thị trường và sản phẩm khi xem toàn bộ nền tảng. Telegram là kênh hỗ trợ sau khi kiểm tra trên site.", "Xem danh mục nền tảng →", "Hỗ trợ Telegram ↗"],
  it: ["Serve la directory completa?", "Mantieni lo stesso mercato e prodotto mentre rivedi tutte le piattaforme. Telegram resta supporto dopo i controlli sul sito.", "Apri directory piattaforme →", "Supporto Telegram ↗"],
  // l10n: needs native review
  ur: ["مکمل ڈائریکٹری چاہیے؟", "تمام پلیٹ فارم دیکھتے وقت یہی مارکیٹ اور مصنوعاتی سیاق رکھیں۔ Telegram سائٹ کے اندر چیک کے بعد معاون راستہ ہے۔", "پلیٹ فارم ڈائریکٹری دیکھیں →", "Telegram مدد ↗"],
  // l10n: needs native review
  uk: ["Потрібен повний каталог?", "Зберігайте той самий ринок і продукт під час перегляду всіх платформ. Telegram доступний як підтримка після перевірок на сайті.", "Переглянути каталог платформ →", "Підтримка Telegram ↗"],
});

// The two explainer rows answer "can / cannot", so their labels say exactly that.
const answerLabelCopy = Object.freeze({
  en: ["Can answer", "Cannot answer"],
  "zh-Hans": ["能回答", "不能回答"],
  "zh-Hant": ["能回答", "不能回答"],
  es: ["Puede responder", "No puede responder"],
  "pt-BR": ["Pode responder", "Não pode responder"],
  fr: ["Peut répondre", "Ne peut pas répondre"],
  de: ["Kann beantworten", "Kann nicht beantworten"],
  ja: ["答えられること", "答えられないこと"],
  ko: ["답할 수 있는 것", "답할 수 없는 것"],
  ar: ["يمكنه الإجابة", "لا يمكنه الإجابة"],
  tr: ["Yanıtlayabilir", "Yanıtlayamaz"],
  ru: ["Может ответить", "Не может ответить"],
  id: ["Bisa menjawab", "Tidak bisa menjawab"],
  vi: ["Trả lời được", "Không trả lời được"],
  it: ["Può rispondere", "Non può rispondere"],
  // l10n: needs native review
  ur: ["جواب دے سکتا ہے", "جواب نہیں دے سکتا"],
  // l10n: needs native review
  uk: ["Може відповісти", "Не може відповісти"],
});

const answerBlockCopy = Object.freeze({
  en: {
    label: "Answer first",
    title: "What the public fee check can answer",
    can: "It can estimate a scenario from reviewed public maker/taker schedules and show which platform page or comparison to inspect next.",
    cannot: "It cannot prove your final account rate, regional eligibility, deposits, KYC result, bonus receipt, or registration attribution. Those remain official-account checks.",
    compareA: "Compare Binance vs OKX",
    compareB: "Compare Bybit vs Bitget",
    derivatives: "Read derivatives cost fields",
  },
  "zh-Hans": {
    label: "先给答案",
    title: "公开费率检查能回答什么",
    can: "它可以基于已复核的公开 maker/taker 费率估算一个交易场景，并告诉你下一步该看哪个平台页或对比页。",
    cannot: "它不能证明你的最终账户费率、地区资格、入金、KYC 结果、奖励到账或注册归因。这些仍要在官方账户里核对。",
    compareA: "比较 Binance vs OKX",
    compareB: "比较 Bybit vs Bitget",
    derivatives: "阅读衍生品成本字段",
  },
  "zh-Hant": {
    label: "先給答案",
    title: "公開費率檢查能回答什麼",
    can: "它可以基於已複核的公開 maker/taker 費率估算一個交易場景，並告訴你下一步該看哪個平台頁或比較頁。",
    cannot: "它不能證明你的最終帳戶費率、地區資格、入金、KYC 結果、獎勵到帳或註冊歸因。這些仍要在官方帳戶裡核對。",
    compareA: "比較 Binance vs OKX",
    compareB: "比較 Bybit vs Bitget",
    derivatives: "閱讀衍生品成本欄位",
  },
  es: {
    label: "Respuesta primero",
    title: "Qué puede responder la revisión de comisiones públicas",
    can: "Puede estimar un escenario con tablas públicas maker/taker revisadas y mostrar qué página de plataforma o comparación revisar después.",
    cannot: "No puede probar tu comisión final de cuenta, elegibilidad regional, depósitos, resultado KYC, recepción de bonos ni atribución de registro. Eso se verifica en la cuenta oficial.",
    compareA: "Comparar Binance vs OKX",
    compareB: "Comparar Bybit vs Bitget",
    derivatives: "Leer campos de coste de derivados",
  },
  "pt-BR": {
    label: "Resposta primeiro",
    title: "O que a checagem de taxas públicas consegue responder",
    can: "Ela estima um cenário com tabelas públicas maker/taker revisadas e mostra qual página de plataforma ou comparação revisar em seguida.",
    cannot: "Ela não comprova sua taxa final de conta, elegibilidade regional, depósitos, KYC, recebimento de bônus ou atribuição de cadastro. Isso fica para a conta oficial.",
    compareA: "Comparar Binance vs OKX",
    compareB: "Comparar Bybit vs Bitget",
    derivatives: "Ler campos de custo de derivativos",
  },
  fr: {
    label: "Réponse d’abord",
    title: "Ce que la vérification des frais publics peut répondre",
    can: "Elle estime un scénario à partir de barèmes maker/taker publics vérifiés et indique quelle page plateforme ou comparaison consulter ensuite.",
    cannot: "Elle ne prouve pas votre taux final, votre éligibilité régionale, les dépôts, le résultat KYC, le bonus reçu ni l’attribution d’inscription. Ces points se vérifient dans le compte officiel.",
    compareA: "Comparer Binance vs OKX",
    compareB: "Comparer Bybit vs Bitget",
    derivatives: "Lire les champs de coût des dérivés",
  },
  de: {
    label: "Antwort zuerst",
    title: "Was der Check öffentlicher Gebühren beantworten kann",
    can: "Er schätzt ein Szenario aus geprüften öffentlichen Maker/Taker-Tabellen und zeigt, welche Plattform- oder Vergleichsseite als Nächstes sinnvoll ist.",
    cannot: "Er beweist keine endgültige Kontogebühr, regionale Verfügbarkeit, Einzahlung, KYC-Entscheidung, Bonusgutschrift oder Registrierungszuordnung. Das bleibt eine Prüfung im offiziellen Konto.",
    compareA: "Binance vs OKX vergleichen",
    compareB: "Bybit vs Bitget vergleichen",
    derivatives: "Kostenfelder für Derivate lesen",
  },
  ja: {
    label: "先に答え",
    title: "公開手数料チェックで分かること",
    can: "確認済みの公開 maker/taker 料率からシナリオを試算し、次に見るべき取引所ページや比較ページを示します。",
    cannot: "最終的なアカウント料率、地域資格、入金、KYC結果、ボーナス受領、登録帰属は証明できません。公式アカウントでの確認が必要です。",
    compareA: "Binance vs OKXを比較",
    compareB: "Bybit vs Bitgetを比較",
    derivatives: "デリバティブ費用項目を読む",
  },
  ko: {
    label: "답 먼저",
    title: "공개 수수료 확인으로 알 수 있는 것",
    can: "검토된 공개 maker/taker 표로 시나리오를 추정하고 다음에 볼 플랫폼 페이지나 비교 페이지를 안내합니다.",
    cannot: "최종 계정 수수료, 지역 자격, 입금, KYC 결과, 보너스 수령, 등록 귀속은 증명하지 않습니다. 공식 계정에서 확인해야 합니다.",
    compareA: "Binance vs OKX 비교",
    compareB: "Bybit vs Bitget 비교",
    derivatives: "파생상품 비용 필드 읽기",
  },
  ar: {
    label: "الإجابة أولاً",
    title: "ما الذي يمكن لفحص الرسوم العامة الإجابة عنه",
    can: "يمكنه تقدير سيناريو من جداول maker/taker العامة المراجعة وإظهار صفحة المنصة أو المقارنة التالية.",
    cannot: "لا يثبت الرسوم النهائية لحسابك أو الأهلية الإقليمية أو الإيداع أو نتيجة KYC أو وصول المكافأة أو إسناد التسجيل. هذه تُراجع في الحساب الرسمي.",
    compareA: "مقارنة Binance وOKX",
    compareB: "مقارنة Bybit وBitget",
    derivatives: "قراءة حقول تكلفة المشتقات",
  },
  tr: {
    label: "Önce cevap",
    title: "Açık ücret kontrolü neyi yanıtlar",
    can: "İncelenmiş açık maker/taker tablolarından bir senaryo tahmini yapar ve sonraki platform ya da karşılaştırma sayfasını gösterir.",
    cannot: "Nihai hesap ücretinizi, bölgesel uygunluğu, yatırımı, KYC sonucunu, bonus alımını veya kayıt atfını kanıtlamaz. Bunlar resmi hesapta kontrol edilir.",
    compareA: "Binance vs OKX karşılaştır",
    compareB: "Bybit vs Bitget karşılaştır",
    derivatives: "Türev maliyet alanlarını oku",
  },
  ru: {
    label: "Сначала ответ",
    title: "Что может показать проверка публичных комиссий",
    can: "Она оценивает сценарий по проверенным публичным таблицам maker/taker и показывает, какую страницу платформы или сравнения открыть дальше.",
    cannot: "Она не доказывает итоговую комиссию аккаунта, региональную доступность, депозит, результат KYC, получение бонуса или атрибуцию регистрации. Это проверяется в официальном аккаунте.",
    compareA: "Сравнить Binance vs OKX",
    compareB: "Сравнить Bybit vs Bitget",
    derivatives: "Читать поля затрат деривативов",
  },
  id: {
    label: "Jawaban dulu",
    title: "Apa yang bisa dijawab cek biaya publik",
    can: "Cek ini memperkirakan skenario dari tabel maker/taker publik yang ditinjau dan menunjukkan halaman platform atau perbandingan berikutnya.",
    cannot: "Cek ini tidak membuktikan tarif akhir akun, kelayakan wilayah, deposit, hasil KYC, bonus diterima, atau atribusi pendaftaran. Semua itu dicek di akun resmi.",
    compareA: "Bandingkan Binance vs OKX",
    compareB: "Bandingkan Bybit vs Bitget",
    derivatives: "Baca bidang biaya derivatif",
  },
  vi: {
    label: "Trả lời trước",
    title: "Công cụ phí công khai có thể trả lời gì",
    can: "Nó ước tính một kịch bản từ bảng maker/taker công khai đã rà soát và chỉ ra trang nền tảng hoặc so sánh nên xem tiếp.",
    cannot: "Nó không chứng minh mức phí cuối cùng của tài khoản, điều kiện khu vực, nạp tiền, kết quả KYC, nhận thưởng hay quy kết đăng ký. Những điểm đó cần kiểm tra trong tài khoản chính thức.",
    compareA: "So sánh Binance vs OKX",
    compareB: "So sánh Bybit vs Bitget",
    derivatives: "Đọc trường chi phí phái sinh",
  },
  it: {
    label: "Prima la risposta",
    title: "Cosa può rispondere il controllo delle commissioni pubbliche",
    can: "Stima uno scenario da tabelle maker/taker pubbliche verificate e mostra quale pagina piattaforma o confronto consultare dopo.",
    cannot: "Non prova la commissione finale del tuo account, l’idoneità regionale, i depositi, l’esito KYC, il bonus ricevuto o l’attribuzione della registrazione. Questi controlli restano nell’account ufficiale.",
    compareA: "Confronta Binance vs OKX",
    compareB: "Confronta Bybit vs Bitget",
    derivatives: "Leggi i campi costo dei derivati",
  },
  // l10n: needs native review
  ur: { label: "پہلے جواب", title: "عوامی فیس چیک کیا بتا سکتا ہے", can: "یہ جائزہ شدہ عوامی maker/taker جدولوں سے ایک منظرنامہ اندازہ کر سکتا ہے اور اگلا پلیٹ فارم صفحہ یا موازنہ دکھا سکتا ہے۔", cannot: "یہ آپ کی آخری اکاؤنٹ فیس، علاقائی اہلیت، ڈپازٹ، KYC نتیجہ، بونس وصولی یا رجسٹریشن نسبت ثابت نہیں کرتا۔ یہ چیک سرکاری اکاؤنٹ میں رہتے ہیں۔", compareA: "Binance vs OKX موازنہ", compareB: "Bybit vs Bitget موازنہ", derivatives: "ڈیریویٹوز لاگت خانے پڑھیں" },
  // l10n: needs native review
  uk: { label: "Спершу відповідь", title: "Що може пояснити перевірка публічних комісій", can: "Вона може оцінити сценарій за перевіреними публічними таблицями maker/taker і показати, яку сторінку платформи або порівняння переглянути далі.", cannot: "Вона не доводить вашу остаточну комісію акаунта, регіональну доступність, депозити, результат KYC, отримання бонусу чи атрибуцію реєстрації. Це перевіряється в офіційному акаунті.", compareA: "Порівняти Binance vs OKX", compareB: "Порівняти Bybit vs Bitget", derivatives: "Читати поля витрат деривативів" },
});

function normalizeLocale(locale) {
  const value = String(locale || "en");
  if (LOCALE_ALIASES[value]) return LOCALE_ALIASES[value];
  const base = value.split("-")[0];
  return LOCALE_ALIASES[base] || (stateCopy[value] ? value : stateCopy[base] ? base : "en");
}

function rateForProduct(summary, product) {
  return summary.rates.find((rate) => rate.product === product) || null;
}

function buildRateView(rate, locale, labels) {
  if (!rate) return null;
  const copyForRate = reviewedFeeCopy(rate, locale);
  return {
    product: rate.product,
    productLabel: labels[rate.product] || rate.product,
    makerRate: rate.makerRate,
    takerRate: rate.takerRate,
    makerDisplay: feePctOfRate(rate.makerRate, locale),
    takerDisplay: feePctOfRate(rate.takerRate, locale),
    checkedAt: isoDay(rate.checkedAt),
    sourceUrl: rate.sourceUrl,
    tier: copyForRate.tier,
    scope: copyForRate.scope,
    conditions: copyForRate.conditions,
  };
}

function renderRateCell(rate, labels) {
  if (!rate) return <span className="ft-none">{labels.unchecked || labels.sourcePending}</span>;
  return (
    <div className="ft-fee" data-fee-product={rate.product}>
      <span className="ft-pair" aria-label={`${labels.maker} ${rate.makerDisplay}, ${labels.taker} ${rate.takerDisplay}`}><b>{rate.makerDisplay}</b><i aria-hidden="true">/</i><b>{rate.takerDisplay}</b></span>
      <span className="ft-tier">{rate.tier}</span>
    </div>
  );
}

function renderAuxChip(value, pendingLabel) {
  if (!value) return <span className="fee-terminal__unknown-chip">{pendingLabel}</span>;
  return <span className="fee-terminal__rebate-chip fee-terminal__rebate-chip--verified">{value}</span>;
}

const copy = {
  "zh-Hans": {
    eyebrow: "TERMINAL / RATE BENCHMARK",
    title: "CEX vs DEX 公开费率基准台",
    subtitle: "对比各平台公开的现货与永续合约基础费率；用户权益和净费率仅在官方来源核验后展示。",
    filterAll: `全部 ${MONITOR_VENUE_COUNT} 家`,
    filterCex: "中心化 (CEX)",
    filterDex: "链上 (Perp DEX)",
    colVenue: "交易平台",
    colCategory: "类别",
    colSpotTaker: "现货 Taker",
    colFuturesTaker: "合约 Taker",
    colRebate: "专属返佣",
    colNetTaker: "折后净 Taker",
    colTrend: "7日费率趋势",
    colAction: "快捷开户",
    cta: "开户 ↗",
  },
  "zh-Hant": {
    eyebrow: "TERMINAL / RATE BENCHMARK",
    title: "CEX vs DEX 公開費率基準台",
    subtitle: "對比各平台公開的現貨與永續合約基礎費率；用戶權益與淨費率僅在官方來源核驗後展示。",
    filterAll: `全部 ${MONITOR_VENUE_COUNT} 家`,
    filterCex: "中心化 (CEX)",
    filterDex: "鏈上 (Perp DEX)",
    colVenue: "交易平台",
    colCategory: "類別",
    colSpotTaker: "現貨 Taker",
    colFuturesTaker: "合約 Taker",
    colRebate: "專屬返傭",
    colNetTaker: "折後淨 Taker",
    colTrend: "7日費率趨勢",
    colAction: "快捷開戶",
    cta: "查看官方条款 ↗",
  },
  en: {
    eyebrow: "TERMINAL / RATE BENCHMARK",
    title: "Published exchange fee benchmark",
    subtitle: "Compare published spot and futures base rates. User benefits and net rates appear only after official-source verification.",
    filterAll: `All ${MONITOR_VENUE_COUNT} Venues`,
    filterCex: "CEX",
    filterDex: "Perp DEX",
    colVenue: "Exchange",
    colCategory: "Category",
    colSpotTaker: "Spot Taker",
    colFuturesTaker: "Futures Taker",
    colRebate: "Rebate",
    colNetTaker: "Net Rate",
    colTrend: "7D Trend",
    colAction: "Sign Up",
    cta: "Official terms ↗",
  },
};

copy.ja = { ...copy.en, title: "取引プラットフォームの公開手数料比較", subtitle: "各サービスが公開する現物・先物の基準手数料を比較します。ユーザー向け条件と実質手数料は公式情報の確認後に表示します。", filterAll: `全${MONITOR_VENUE_COUNT}サービス`, filterCex: "CEX", filterDex: "Perp DEX", colVenue: "サービス", colCategory: "種類", colSpotTaker: "現物Taker", colFuturesTaker: "先物Taker", colRebate: "還元", colNetTaker: "実質手数料", colTrend: "7日推移", colAction: "登録", cta: "公式条件を確認 ↗" };
copy.ko = { ...copy.en, title: "거래 플랫폼 공개 수수료 비교", subtitle: "각 플랫폼이 공개한 현물·선물 기본 수수료를 비교합니다. 사용자 혜택과 순수수료는 공식 출처 확인 후에만 표시됩니다.", filterAll: `전체 ${MONITOR_VENUE_COUNT}개`, filterCex: "CEX", filterDex: "Perp DEX", colVenue: "플랫폼", colCategory: "유형", colSpotTaker: "현물 Taker", colFuturesTaker: "선물 Taker", colRebate: "리베이트", colNetTaker: "순수수료", colTrend: "7일 추이", colAction: "가입", cta: "공식 조건 확인 ↗" };
copy.tr = { ...copy.en, title: "Borsa platformu yayınlanmış ücret karşılaştırması", subtitle: "Platformların yayınladığı spot ve vadeli işlem temel ücretlerini karşılaştırın. Kullanıcı avantajları ve net oranlar yalnızca resmi kaynak doğrulamasından sonra gösterilir.", filterAll: `${MONITOR_VENUE_COUNT} platformun tümü`, filterCex: "CEX", filterDex: "Perp DEX", colVenue: "Platform", colCategory: "Kategori", colSpotTaker: "Spot Taker", colFuturesTaker: "Vadeli Taker", colRebate: "İade", colNetTaker: "Net oran", colTrend: "7 günlük trend", colAction: "Kayıt", cta: "Resmi koşulları gör ↗" };
copy.es = { ...copy.en, eyebrow: "TERMINAL / REFERENCIA DE COMISIONES", title: "Comparador de comisiones publicadas", subtitle: "Compara las comisiones base publicadas de spot y futuros. Los beneficios de usuario y la tasa neta solo aparecen tras verificación con fuente oficial.", filterAll: `${MONITOR_VENUE_COUNT} plataformas`, filterCex: "CEX", filterDex: "Perp DEX", colVenue: "Plataforma", colCategory: "Categoría", colSpotTaker: "Taker spot", colFuturesTaker: "Taker futuros", colRebate: "Beneficio", colNetTaker: "Tasa neta", colTrend: "Tendencia 7 días", colAction: "Ruta oficial", cta: "Ver condiciones oficiales ↗" };
copy["pt-BR"] = { ...copy.en, eyebrow: "TERMINAL / REFERÊNCIA DE TAXAS", title: "Comparador de taxas publicadas", subtitle: "Compare taxas base publicadas de spot e futuros. Benefícios de usuário e taxa líquida aparecem somente após verificação em fonte oficial.", filterAll: `${MONITOR_VENUE_COUNT} plataformas`, filterCex: "CEX", filterDex: "Perp DEX", colVenue: "Plataforma", colCategory: "Categoria", colSpotTaker: "Taker spot", colFuturesTaker: "Taker futuros", colRebate: "Benefício", colNetTaker: "Taxa líquida", colTrend: "Tendência 7 dias", colAction: "Rota oficial", cta: "Ver condições oficiais ↗" };

copy.fr = { ...copy.en, eyebrow:"TERMINAL / INDICE DES FRAIS", title:"Comparatif des frais publiés", subtitle:"Comparez les taux de base spot et futures publiés. Les avantages apparaissent après vérification officielle.", filterAll:`${MONITOR_VENUE_COUNT} plateformes`, colVenue:"Plateforme", colCategory:"Catégorie", colSpotTaker:"Taker spot", colFuturesTaker:"Taker futures", colRebate:"Avantage", colNetTaker:"Taux net", colTrend:"Tendance 7 j", colAction:"S’inscrire", cta:"Voir les conditions officielles ↗" };
copy.de = { ...copy.en, eyebrow:"TERMINAL / GEBÜHRENVERGLEICH", title:"Vergleich veröffentlichter Gebühren", subtitle:"Vergleichen Sie veröffentlichte Spot- und Futures-Basissätze. Vorteile erscheinen erst nach offizieller Prüfung.", filterAll:`${MONITOR_VENUE_COUNT} Plattformen`, colVenue:"Plattform", colCategory:"Kategorie", colSpotTaker:"Spot-Taker", colFuturesTaker:"Futures-Taker", colRebate:"Vorteil", colNetTaker:"Nettosatz", colTrend:"7-Tage-Trend", colAction:"Registrieren", cta:"Offizielle Bedingungen prüfen ↗" };
copy.ru = { ...copy.en, eyebrow:"ТЕРМИНАЛ / СРАВНЕНИЕ КОМИССИЙ", title:"Сравнение опубликованных комиссий", subtitle:"Сравните базовые ставки spot и futures. Преимущества показываются только после проверки источников.", filterAll:`${MONITOR_VENUE_COUNT} площадки`, colVenue:"Платформа", colCategory:"Категория", colSpotTaker:"Spot taker", colFuturesTaker:"Futures taker", colRebate:"Преимущество", colNetTaker:"Чистая ставка", colTrend:"Тренд за 7 дней", colAction:"Регистрация", cta:"Проверить официальные условия ↗" };
copy.ar = { ...copy.en, eyebrow:"محطة / مقارنة الرسوم", title:"مقارنة الرسوم المنشورة", subtitle:"قارن المعدلات الأساسية المنشورة. لا تظهر المزايا إلا بعد التحقق من المصدر الرسمي.", filterAll:`${MONITOR_VENUE_COUNT} منصة`, colVenue:"المنصة", colCategory:"الفئة", colSpotTaker:"رسوم Spot", colFuturesTaker:"رسوم Futures", colRebate:"ميزة", colNetTaker:"المعدل الصافي", colTrend:"اتجاه 7 أيام", colAction:"تسجيل", cta:"تحقق من الشروط الرسمية ↗" };
copy.id = { ...copy.en, eyebrow:"TERMINAL / BENCHMARK BIAYA", title:"Perbandingan biaya yang dipublikasikan", subtitle:"Bandingkan tarif dasar spot dan futures. Manfaat hanya tampil setelah verifikasi sumber resmi.", filterAll:`${MONITOR_VENUE_COUNT} platform`, colVenue:"Platform", colCategory:"Kategori", colSpotTaker:"Taker spot", colFuturesTaker:"Taker futures", colRebate:"Manfaat", colNetTaker:"Tarif bersih", colTrend:"Tren 7 hari", colAction:"Daftar", cta:"Lihat ketentuan resmi ↗" };
copy.vi = { ...copy.en, eyebrow:"BẢNG / SO SÁNH PHÍ", title:"So sánh phí được công bố", subtitle:"So sánh mức phí cơ bản spot và futures. Ưu đãi chỉ hiển thị sau khi xác minh nguồn chính thức.", filterAll:`${MONITOR_VENUE_COUNT} nền tảng`, colVenue:"Nền tảng", colCategory:"Loại", colSpotTaker:"Taker spot", colFuturesTaker:"Taker futures", colRebate:"Ưu đãi", colNetTaker:"Mức ròng", colTrend:"Xu hướng 7 ngày", colAction:"Đăng ký", cta:"Xem điều kiện chính thức ↗" };
copy.it = { ...copy.en, eyebrow:"TERMINALE / BENCHMARK COMMISSIONI", title:"Confronto delle commissioni pubblicate", subtitle:"Confronta i tassi base spot e futures. I vantaggi compaiono solo dopo la verifica ufficiale.", filterAll:`${MONITOR_VENUE_COUNT} piattaforme`, colVenue:"Piattaforma", colCategory:"Categoria", colSpotTaker:"Taker spot", colFuturesTaker:"Taker futures", colRebate:"Vantaggio", colNetTaker:"Tasso netto", colTrend:"Trend 7 giorni", colAction:"Registrati", cta:"Verifica condizioni ufficiali ↗" };
// l10n: needs native review
copy.ur = { ...copy.en, eyebrow:"ٹرمینل / فیس معیار", title:"شائع شدہ ایکسچینج فیس معیار", subtitle:"شائع شدہ اسپاٹ اور فیوچرز بنیادی شرحوں کا موازنہ کریں۔ صارف فائدے اور خالص شرحیں صرف سرکاری ماخذ کی تصدیق کے بعد دکھتی ہیں۔", filterAll:`تمام ${MONITOR_VENUE_COUNT} پلیٹ فارم`, filterCex:"CEX", filterDex:"Perp DEX", colVenue:"ایکسچینج", colCategory:"زمرہ", colSpotTaker:"اسپاٹ Taker", colFuturesTaker:"فیوچرز Taker", colRebate:"فائدہ", colNetTaker:"خالص شرح", colTrend:"7 دن رجحان", colAction:"سرکاری راستہ", cta:"سرکاری شرائط ↗" };
// l10n: needs native review
copy.uk = { ...copy.en, eyebrow:"ТЕРМІНАЛ / ОРІЄНТИР КОМІСІЙ", title:"Порівняння опублікованих комісій", subtitle:"Порівнюйте опубліковані базові ставки споту й ф’ючерсів. Користувацькі переваги й чисті ставки з’являються лише після перевірки офіційного джерела.", filterAll:`Усі ${MONITOR_VENUE_COUNT} платформ`, filterCex:"CEX", filterDex:"Perp DEX", colVenue:"Біржа", colCategory:"Категорія", colSpotTaker:"Спот Taker", colFuturesTaker:"Ф’ючерси Taker", colRebate:"Перевага", colNetTaker:"Чиста ставка", colTrend:"Тренд 7 днів", colAction:"Офіційний шлях", cta:"Офіційні умови ↗" };

export function FeeBenchmarkTerminal({ locale = "en", market, product: productParam, accountStage, funding }) {
  const product = productParam || "spot";
  const decisionPassport = readDecisionPassport("", { market, product, accountStage, funding });
  const safeAccountStage = decisionPassport.accountStage;
  const safeFunding = decisionPassport.funding;
  const [filter, setFilter] = useState("all");
  const isZh = locale.startsWith("zh");
  const isHant = locale === "zh-Hant" || locale === "zh-TW";
  const localeKey = String(locale || "").split("-")[0];
  const normalizedLocale = normalizeLocale(locale);
  const t = copy[locale] || copy[localeKey] || copy[normalizedLocale] || (isHant ? copy["zh-Hant"] : isZh ? copy["zh-Hans"] : copy.en);
  const labels = { ...(stateCopy[normalizedLocale] || stateCopy.en), unchecked: matrixCopy(locale).unchecked };
  const basisText = costBasisCopy(locale);

  const rows = MONITOR_SLUGS.map((slug) => {
    const db = venueDatabase[slug] || {};
    const partner = partnerRegistry[slug] || {};
    const feeSummary = buildVenueFeeSummary(db, {});
    const spotRate = buildRateView(rateForProduct(feeSummary, "spot"), locale, labels);
    const futuresRate = buildRateView(rateForProduct(feeSummary, "futures"), locale, labels);
    const commercialClaim = resolveCommercialClaim({ partner, venue: db });
    const cta = regionalVenueCta(slug, locale, market, product, { accountStage: safeAccountStage, funding: safeFunding });
    const rebatePercent = commercialClaim.status === "verified" ? commercialClaim.rebatePercent : 0;
    // Partner venues (audit NX-02/NX-03): the share comes from the single partner benefit record and the net figure uses
    // the home calculator's formula (base × (1 − top share)), labelled "after max rebate".
    const partner_ = rebatePercent > 0 || isTurkeyGated(slug, { locale, market }) ? null : partnerBenefitStatus(slug);
    const sharePct = rebatePercent > 0 ? rebatePercent : partner_?.sharePct || 0;
    const rebateDisplay = rebatePercent > 0 ? formatPercent(locale, rebatePercent) : partner_ ? `${h7Copy(locale).upTo} ${formatPercent(locale, partner_.sharePct)}` : null;
    const productRate = product === "futures" || product === "perp" || product === "perpetuals" ? futuresRate : spotRate;
    const netDisplay = sharePct > 0 && Number.isFinite(productRate?.takerRate)
      ? feePctOfRate(productRate.takerRate * (1 - sharePct / 100), locale)
      : null;

    return {
      slug,
      name: db.name || slug,
      category: db.category || "CEX",
      spotRate,
      futuresRate,
      rebateDisplay,
      netDisplay,
      ctaHref: cta.ctaHref,
      ctaDirect: cta.direct,
      inviteCode: cta.hasReferral ? cta.inviteCode : null,
      trend: rebatePercent > 0 ? `↓ -${formatPercent(locale, rebatePercent)}` : null,
    };
  }).filter((r) => {
    if (filter === "cex") return r.category === "CEX";
    if (filter === "dex") return r.category === "DEX";
    if (filter === "perpdex") return r.category === "Perp DEX";
    return true;
  });
  // Venues with nothing checked collapse into one row; their links and actions stay in it.
  const isPending = (r) => !r.spotRate && !r.futuresRate && !r.rebateDisplay && !r.netDisplay && !r.trend;
  const checkedRows = rows.filter((r) => !isPending(r));
  const pendingRows = rows.filter(isPending);
  const pendingGroup = pendingGroupCopy[locale] || pendingGroupCopy[localeKey] || pendingGroupCopy[normalizedLocale] || pendingGroupCopy.en;
  const mx = matrixCopy(locale);
  const checkedLabel = feeSummaryCopy(locale).checked;
  const nextStep = nextStepCopy[locale] || nextStepCopy[localeKey] || nextStepCopy[normalizedLocale] || nextStepCopy.en;
  const answerLabels = answerLabelCopy[locale] || answerLabelCopy[localeKey] || answerLabelCopy[normalizedLocale] || answerLabelCopy.en;
  const answerBlock = answerBlockCopy[locale] || answerBlockCopy[localeKey] || answerBlockCopy[normalizedLocale] || answerBlockCopy.en;
  const contextSearch = directoryContextSearch({ market, product, locale, accountStage: safeAccountStage, funding: safeFunding });
  const answerHref = (href, answerProduct) => appendDecisionPassportQuery(
    localizedHref(href, { locale, market, product: answerProduct }),
    { market, product: answerProduct, accountStage: safeAccountStage, funding: safeFunding },
  );
  const contextHref = (href) => appendDecisionPassportQuery(
    localizedHref(href, { locale }),
    { market, product, accountStage: safeAccountStage, funding: safeFunding },
  );

  const hasTrend = rows.some((r) => r.trend);
  const hasBenefit = rows.some((r) => r.rebateDisplay || r.netDisplay);
  const colCount = 5 + (hasBenefit ? 2 : 0) + (hasTrend ? 1 : 0);
  const venueLink = (row) => <a href={contextHref(`/exchanges/${row.slug}#registration-path`)} data-cta-kind="research" data-cta-placement="rate-benchmark-detail" data-growth-decision={row.slug} data-growth-placement="rate-benchmark-detail" data-growth-market={market} data-growth-product={product} data-growth-account-stage={safeAccountStage} data-growth-funding={safeFunding} translate="no">{getLocalizedVenueName(row, locale)}</a>;
  const ctaLink = (row) => <a
    href={row.ctaHref}
    target={row.ctaDirect ? "_blank" : undefined}
    rel={row.ctaDirect ? "sponsored noopener noreferrer" : undefined}
    className="fee-terminal__cta-btn"
    data-cta-kind={row.ctaDirect ? "registration" : "research"}
    data-cta-platform={row.slug}
    data-cta-placement="rate-benchmark-row"
    data-growth-decision={row.slug}
    data-growth-placement="rate-benchmark-row"
    data-growth-market={market}
    data-growth-product={product}
    data-growth-account-stage={safeAccountStage}
    data-growth-funding={safeFunding}
    data-growth-campaign={market ? `${String(market).toLowerCase()}-research-preview` : undefined}
    data-cta-code={row.ctaDirect && row.inviteCode ? row.inviteCode : undefined}
  >{row.ctaDirect ? `${ctaUiCopy(locale).caption} ↗` : ({ ja: "地域条件を確認", ko: "지역 조건 확인", tr: "Bölgesel uygunluğu doğrula", es: "Verificar elegibilidad", "pt-BR": "Verificar elegibilidade", fr: "Vérifier l’éligibilité régionale", de: "Regionale Eignung prüfen", ru: "Проверить региональную доступность", ar: "تحقق من الأهلية الإقليمية", id: "Verifikasi kelayakan wilayah", vi: "Kiểm tra điều kiện khu vực", it: "Verifica idoneità regionale",
  // l10n: needs native review
  ur: "علاقائی اہلیت چیک کریں",
  // l10n: needs native review
  uk: "Перевірити регіональну доступність" }[locale] || (isZh ? "先核对地区资格" : "Verify eligibility"))}</a>;
  return (
    <section className="fee-terminal-section v2-shell" id="rate-terminal" dir={normalizedLocale === "ar" || normalizedLocale === "ur" ? "rtl" : undefined}>
      <div className="rt-tool rt-panel">
        <div className="fee-terminal__answer-block rt-context" role="group" aria-label={answerBlock.label}>
          <h3>{answerBlock.title}</h3>
          <dl className="fee-terminal__answer-grid">
            <div><dt>{answerLabels[0]}</dt><dd>{answerBlock.can}</dd></div>
            <div><dt>{answerLabels[1]}</dt><dd>{answerBlock.cannot}</dd></div>
          </dl>
          <nav className="fee-terminal__answer-links" aria-label={answerBlock.title}>
            <a href={answerHref("/compare/binance-vs-okx", "spot")}>{answerBlock.compareA}</a>
            <a href={answerHref("/compare/bybit-vs-bitget", "perpetuals")}>{answerBlock.compareB}</a>
            <a href={answerHref("/topics/derivatives", "perpetuals")}>{answerBlock.derivatives}</a>
          </nav>
        </div>
        <div className="rt-handoff">
      <OnsiteTelegramBotHandoff
              canonicalPath="/rates"
              intent="fees"
              venue="all"
              returnRoute="/rates"
              locale={locale}
              market={market || "GLOBAL"}
              product={product || "spot"}
              campaign="r40-rates-owner-telegram-return"
              placement="rates-owner-telegram-handoff"
              queries={locale === "en" ? ["Published fee source check", "Return to this fee benchmark"] : undefined}
            />
        </div>
      <div className="fee-terminal__next-step rt-next" aria-label={nextStep[0]}>
              <div><strong>{nextStep[0]}</strong><span>{nextStep[1]}</span></div>
              <div className="fee-terminal__next-step-actions">
                <a
                  href={contextHref("/exchanges")}
                  className="fee-terminal__next-step-primary"
                  data-cta-kind="internal"
                  data-cta-placement="rates-next-step-directory"
                  data-growth-decision="platform_directory"
                  data-growth-placement="rates-next-step"
                  data-growth-market={market}
                  data-growth-product={product}
                  data-growth-account-stage={safeAccountStage}
                  data-growth-funding={safeFunding}
                  data-growth-campaign="rates_next_step"
                >
                  {nextStep[2]}
                </a>
                {/* Telegram appears once on /rates: the Bot handoff block beside this card */}
              </div>
            </div>
        {/* Owner 2026-10-10: show perpetual fees by default (same as the home calculator); an explicit ?product=spot still wins. */}
        <CostDecision locale={locale} regionMarket={market} product={productParam || "perpetuals"} accountStage={safeAccountStage} funding={safeFunding} />
        <DecisionPathRail locale={locale} market={market} product={product} accountStage={safeAccountStage} funding={safeFunding} current="rates" />
      </div>
      <header className="fee-terminal__header">
        <h2 className="fee-terminal__title">{t.title}</h2>
        <p className="fee-terminal__subtitle">{t.subtitle}</p>

        <nav className="fee-terminal__filters" aria-label={t.eyebrow}>
          {/* the same segment set and labels as /exchanges: All / CEX / DEX / Perp DEX */}
          {[["all", mx.all || "All"], ["cex", "CEX"], ["dex", "DEX"], ["perpdex", "Perp DEX"]].map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              className={`fee-terminal__filter-btn ${filter === key ? "fee-terminal__filter-btn--active" : ""}`}
              onClick={() => setFilter(key)}
            >
              <span translate={key === "all" ? undefined : "no"}>{label}</span>
            </button>
          ))}
        </nav>
      </header>

      <div className="fee-terminal__table-block">
      <div className="fee-terminal__table-wrapper ft" tabIndex={0}>
        <table className="fee-terminal__table ft-table" id="rate-terminal-table" data-cols={colCount}>
          <thead>
            <tr>
              <th scope="col">{t.colVenue}</th>
              <th scope="col">{mx.spot}<span className="ft-th-sub">{mx.maker}</span></th>
              <th scope="col">{mx.perp}<span className="ft-th-sub">{mx.maker}</span></th>
              <th scope="col">{checkedLabel}</th>
              {hasBenefit && <th scope="col">{t.colRebate}</th>}
              {hasBenefit && <th scope="col">{t.colNetTaker}<span className="ft-th-sub">{basisText.rebate} · {(product === "futures" || product === "perp" || product === "perpetuals") ? mx.perp : mx.spot} · {labels.taker}</span></th>}
              {hasTrend && <th scope="col">{t.colTrend}</th>}
              <th scope="col" className="ft-th-action"><span className="rt-sr">{t.colAction}</span></th>
            </tr>
          </thead>
          <tbody>
            {checkedRows.map((row) => {
              const rates = [row.spotRate, row.futuresRate].filter(Boolean);
              const checkedOn = rates.map((r) => r.checkedAt).filter(Boolean).sort().at(-1);
              const sources = [...new Set(rates.map((r) => r.sourceUrl))];
              return (
              <tr key={row.slug}>
                <td className="ft-venue">
                  <div className="fee-terminal__cell-brand">
                    <BrandMark slug={row.slug} compact />
                    <span className="ft-venue__name">{venueLink(row)}<small>{row.category}</small></span>
                  </div>
                </td>
                <td className="ft-cell" data-label={`${mx.spot} · ${mx.maker}`}>{renderRateCell(row.spotRate, labels)}</td>
                <td className="ft-cell" data-label={`${mx.perp} · ${mx.maker}`}>{renderRateCell(row.futuresRate, labels)}</td>
                <td className="ft-cell ft-checked-td" data-label={checkedLabel}><div className="ft-checked">
                  {checkedOn ? <time dateTime={checkedOn}>{checkedOn}</time> : <span className="ft-none">{labels.unchecked}</span>}
                  <span className="ft-src">{sources.map((href, i) => <a key={href} href={href} target="_blank" rel="noopener noreferrer">{labels.source}{sources.length > 1 ? ` ${i + 1}` : ""} ↗</a>)}</span>
                  {rates.length > 0 && <details className="ft-cond">
                    <summary>{labels.conditions}</summary>
                    {rates.map((r) => <p key={r.product}><b>{r.productLabel}</b> {sentence(r.scope)} {r.conditions}</p>)}
                  </details>}
                </div></td>
                {hasBenefit && <td className="ft-cell ft-aux">{renderAuxChip(row.rebateDisplay, labels.commercialPending)}</td>}
                {hasBenefit && <td className="ft-cell ft-aux">{row.netDisplay ? <span className="fee-terminal__net-rate">{row.netDisplay}</span> : <span className="ft-none">{labels.netPending}</span>}</td>}
                {hasTrend && <td className="ft-cell ft-aux"><span className={`fee-terminal__trend-tag ${row.trend ? "" : "fee-terminal__trend-tag--pending"}`}>{row.trend || labels.trendPending}</span></td>}
                <td className="ft-action">{ctaLink(row)}</td>
              </tr>
              );
            })}
            {pendingRows.length > 0 && (
              <tr className="ft-pending">
                <td colSpan={colCount}>
                  <details>
                    <summary><strong className="ft-pending__count">{pendingGroup(pendingRows.length)}</strong><small className="ft-pending__names" aria-hidden="true">{pendingRows.map((r) => r.name).join(" · ")}</small></summary>
                    <ul className="ft-pending__list">
                      {pendingRows.map((row) => (
                        <li key={row.slug}>
                          <span className="fee-terminal__cell-brand"><BrandMark slug={row.slug} compact /><span className="ft-venue__name">{venueLink(row)}<small>{row.category}</small></span></span>
                          {ctaLink(row)}
                        </li>
                      ))}
                    </ul>
                  </details>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </section>
  );
}

export default FeeBenchmarkTerminal;
