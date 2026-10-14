import { SourceLink } from "../shared/SourceLink.jsx";
/**
 * CampaignRadar — 主流交易所实时活动与迎新礼包雷达
 * 替代首页多此一举的反钓鱼核验，直接呈现各大交易所最新官方活动、迎新奖励与空投福利
 *
 * l10n (2026-10-11): every UI string lives in `copy` for all 15 locales; the site-authored research text (summaries,
 * conditions) comes from official-campaign-localizations.js through campaignResearchLocalizedText, and the review
 * stamp is rendered with Intl.DateTimeFormat instead of the raw ISO value. Official source titles stay English (data).
 */
import React, { useState, useMemo } from "react";
import { BrandMark } from "../brand/BrandMark.jsx";
import { partnerRegistry } from "../../data/partner-registry.js";
import { venueDatabase } from "../../data/venue-database.js";
import { officialCampaignResearchByVenue } from "../../data/official-campaign-research.js";
import { campaignResearchLocalizedText } from "../../data/official-campaign-localizations.js";
import { resolveCommercialClaim } from "../../data/commercial-claims.js";
import { publicCtaForVenue, venueGoHref } from "../../data/source-bound-cta.js";
import { isTurkeyGated } from "../../data/partner-geo-policy.js";
import { contextualHref } from "../../data/contextual-href.js";
import { formatDate } from "../../data/format-date.js";
import { enAttrs } from "../../utils/fallback-lang.js";
import "./campaign-radar.css";

export const campaignRadarCopy = {
  "zh-Hans": {
    badge: "来源雷达",
    title: "主流交易所活动与迎新礼包雷达",
    subtitle: "来源已审阅的官方活动线索；资格、期限与用户权益仍需在账户页面逐项确认。",
    tabAll: "全部热门",
    tabCex: "中心化大厂 (CEX)",
    tabDex: "链上与衍生品 (DEX)",
    officialSources: "官方公告与活动来源",
    termsNote: "参与条款要点",
    claimBtn: "查看官方条款 ↗",
    verifiedTag: "来源已审阅",
    directHub: "官方活动中心",
    sourceReviewed: "来源审阅：{date}",
    reviewDateUnavailable: "来源日期待补充",
    eligibilityNote: "资格与期限需以官方账户为准",
    perkTag: "新用户活动状态",
    openRegistration: "前往官方注册开户 ↗",
  },
  "zh-Hant": {
    badge: "來源雷達",
    title: "主流交易所活動與迎新禮包雷達",
    subtitle: "來源已審閱的官方活動線索；資格、期限與用戶權益仍需在帳戶頁面逐項確認。",
    tabAll: "全部熱門",
    tabCex: "中心化大廠 (CEX)",
    tabDex: "鏈上與衍生品 (DEX)",
    officialSources: "官方公告與活動來源",
    termsNote: "參與條款要點",
    claimBtn: "查看官方條款 ↗",
    verifiedTag: "來源已審閱",
    directHub: "官方活動中心",
    sourceReviewed: "來源審閱：{date}",
    reviewDateUnavailable: "來源日期待補充",
    eligibilityNote: "資格與期限需以官方帳戶為準",
    perkTag: "新用戶活動狀態",
    openRegistration: "前往官方註冊開戶 ↗",
  },
  en: {
    badge: "Source Radar",
    title: "Official Exchange Campaigns & Welcome Packs",
    subtitle: "Source-reviewed official activity leads. Eligibility, timing and user benefits still require account-level confirmation.",
    tabAll: "All Top Venues",
    tabCex: "Major CEXs",
    tabDex: "DEX & Perps",
    officialSources: "Official Sources & Hubs",
    termsNote: "Key Participation Terms",
    claimBtn: "Review Official Terms ↗",
    verifiedTag: "Source Reviewed",
    directHub: "Official Activity Hub",
    sourceReviewed: "Source reviewed: {date}",
    reviewDateUnavailable: "Review date unavailable",
    eligibilityNote: "Eligibility and timing depend on the official account",
    perkTag: "Welcome campaign status",
    openRegistration: "Open official registration ↗",
  },
  ja: {
    badge: "公式情報レーダー",
    title: "取引所キャンペーンと新規特典",
    subtitle: "公式情報を確認した活動一覧です。資格・期限・特典はアカウント画面で確認してください。",
    tabAll: "すべて",
    tabCex: "主要CEX",
    tabDex: "DEX・パーペチュアル",
    officialSources: "公式情報・キャンペーン",
    termsNote: "参加条件",
    claimBtn: "公式条件を確認 ↗",
    verifiedTag: "情報確認済み",
    directHub: "公式キャンペーン",
    sourceReviewed: "情報確認：{date}",
    reviewDateUnavailable: "確認日未設定",
    eligibilityNote: "資格と期間は公式アカウントを確認",
    perkTag: "新規ユーザー向けキャンペーンの状態",
    openRegistration: "公式登録へ進む ↗",
  },
  ko: {
    badge: "공식 정보 레이더",
    title: "거래소 캠페인 및 신규 혜택",
    subtitle: "공식 출처를 검토한 활동입니다. 자격·기간·혜택은 계정 화면에서 확인하세요.",
    tabAll: "전체",
    tabCex: "주요 CEX",
    tabDex: "DEX·퍼펙추얼",
    officialSources: "공식 출처·캠페인",
    termsNote: "참여 조건",
    claimBtn: "공식 조건 확인 ↗",
    verifiedTag: "출처 검토됨",
    directHub: "공식 캠페인",
    sourceReviewed: "출처 검토: {date}",
    reviewDateUnavailable: "검토 날짜 없음",
    eligibilityNote: "자격과 기간은 공식 계정 기준",
    perkTag: "신규 사용자 캠페인 상태",
    openRegistration: "공식 가입으로 이동 ↗",
  },
  tr: {
    badge: "Resmî bilgi radarı",
    title: "Borsa kampanyaları ve yeni üye fırsatları",
    subtitle: "Resmî kaynakları incelenmiş fırsatlar. Uygunluk, süre ve avantajları hesap ekranında doğrulayın.",
    tabAll: "Tümü",
    tabCex: "Başlıca CEX",
    tabDex: "DEX ve Perpetual",
    officialSources: "Resmî kaynaklar ve kampanyalar",
    termsNote: "Katılım koşulları",
    claimBtn: "Resmî koşulları incele ↗",
    verifiedTag: "Kaynak incelendi",
    directHub: "Resmî kampanya",
    sourceReviewed: "Kaynak inceleme: {date}",
    reviewDateUnavailable: "İnceleme tarihi yok",
    eligibilityNote: "Uygunluk ve süre resmî hesaba bağlıdır",
    perkTag: "Hoş geldin kampanyası durumu",
    openRegistration: "Resmî kayda git ↗",
  },
  es: {
    badge: "Radar de fuentes",
    title: "Campañas oficiales de exchanges y packs de bienvenida",
    subtitle: "Pistas de actividades oficiales con fuente revisada. La elegibilidad, los plazos y los beneficios siguen requiriendo confirmación en la cuenta.",
    tabAll: "Todas las plataformas",
    tabCex: "Principales CEX",
    tabDex: "DEX y perpetuos",
    officialSources: "Fuentes y centros oficiales",
    termsNote: "Condiciones clave de participación",
    claimBtn: "Revisar condiciones oficiales ↗",
    verifiedTag: "Fuente revisada",
    directHub: "Centro oficial de actividades",
    sourceReviewed: "Fuente revisada: {date}",
    reviewDateUnavailable: "Fecha de revisión no disponible",
    eligibilityNote: "La elegibilidad y los plazos dependen de la cuenta oficial",
    perkTag: "Estado de la campaña de bienvenida",
    openRegistration: "Abrir el registro oficial ↗",
  },
  "pt-BR": {
    badge: "Radar de fontes",
    title: "Campanhas oficiais de exchanges e pacotes de boas-vindas",
    subtitle: "Pistas de atividades oficiais com fonte revisada. Elegibilidade, prazos e benefícios ainda exigem confirmação na conta.",
    tabAll: "Todas as plataformas",
    tabCex: "Principais CEX",
    tabDex: "DEX e perpétuos",
    officialSources: "Fontes e centrais oficiais",
    termsNote: "Condições principais de participação",
    claimBtn: "Ver condições oficiais ↗",
    verifiedTag: "Fonte revisada",
    directHub: "Central oficial de atividades",
    sourceReviewed: "Fonte revisada: {date}",
    reviewDateUnavailable: "Data de revisão indisponível",
    eligibilityNote: "Elegibilidade e prazos dependem da conta oficial",
    perkTag: "Status da campanha de boas-vindas",
    openRegistration: "Abrir cadastro oficial ↗",
  },
  fr: {
    badge: "Radar des sources",
    title: "Campagnes officielles des plateformes et offres de bienvenue",
    subtitle: "Pistes d’activités officielles aux sources vérifiées. L’éligibilité, les délais et les avantages restent à confirmer dans le compte.",
    tabAll: "Toutes les plateformes",
    tabCex: "Principaux CEX",
    tabDex: "DEX et perpétuels",
    officialSources: "Sources et hubs officiels",
    termsNote: "Conditions clés de participation",
    claimBtn: "Consulter les conditions officielles ↗",
    verifiedTag: "Source vérifiée",
    directHub: "Hub officiel des activités",
    sourceReviewed: "Source vérifiée : {date}",
    reviewDateUnavailable: "Date de vérification indisponible",
    eligibilityNote: "L’éligibilité et les délais dépendent du compte officiel",
    perkTag: "Statut de la campagne de bienvenue",
    openRegistration: "Ouvrir l’inscription officielle ↗",
  },
  de: {
    badge: "Quellen-Radar",
    title: "Offizielle Börsenkampagnen und Willkommenspakete",
    subtitle: "Quellengeprüfte Hinweise auf offizielle Aktionen. Berechtigung, Fristen und Nutzervorteile müssen weiterhin im Konto bestätigt werden.",
    tabAll: "Alle Plattformen",
    tabCex: "Große CEX",
    tabDex: "DEX und Perpetuals",
    officialSources: "Offizielle Quellen und Hubs",
    termsNote: "Wichtige Teilnahmebedingungen",
    claimBtn: "Offizielle Bedingungen prüfen ↗",
    verifiedTag: "Quelle geprüft",
    directHub: "Offizieller Aktions-Hub",
    sourceReviewed: "Quelle geprüft: {date}",
    reviewDateUnavailable: "Prüfdatum nicht verfügbar",
    eligibilityNote: "Berechtigung und Fristen richten sich nach dem offiziellen Konto",
    perkTag: "Status der Willkommensaktion",
    openRegistration: "Offizielle Registrierung öffnen ↗",
  },
  it: {
    badge: "Radar delle fonti",
    title: "Campagne ufficiali degli exchange e pacchetti di benvenuto",
    subtitle: "Segnalazioni di attività ufficiali con fonte verificata. Idoneità, tempi e vantaggi richiedono ancora conferma nell’account.",
    tabAll: "Tutte le piattaforme",
    tabCex: "Principali CEX",
    tabDex: "DEX e perpetual",
    officialSources: "Fonti e hub ufficiali",
    termsNote: "Condizioni chiave di partecipazione",
    claimBtn: "Consulta le condizioni ufficiali ↗",
    verifiedTag: "Fonte verificata",
    directHub: "Hub ufficiale delle attività",
    sourceReviewed: "Fonte verificata: {date}",
    reviewDateUnavailable: "Data di verifica non disponibile",
    eligibilityNote: "Idoneità e tempi dipendono dall’account ufficiale",
    perkTag: "Stato della campagna di benvenuto",
    openRegistration: "Apri la registrazione ufficiale ↗",
  },
  // l10n: needs native review
  ru: {
    badge: "Радар источников",
    title: "Официальные кампании бирж и приветственные пакеты",
    subtitle: "Сведения об официальных акциях с проверенными источниками. Право на участие, сроки и бонусы по-прежнему нужно подтверждать в аккаунте.",
    tabAll: "Все платформы",
    tabCex: "Крупные CEX",
    tabDex: "DEX и бессрочные контракты",
    officialSources: "Официальные источники и разделы",
    termsNote: "Основные условия участия",
    claimBtn: "Открыть официальные условия ↗",
    verifiedTag: "Источник проверен",
    directHub: "Официальный раздел акций",
    sourceReviewed: "Источник проверен: {date}",
    reviewDateUnavailable: "Дата проверки недоступна",
    eligibilityNote: "Право на участие и сроки определяются официальным аккаунтом",
    perkTag: "Статус приветственной акции",
    openRegistration: "Открыть официальную регистрацию ↗",
  },
  // l10n: needs native review
  id: {
    badge: "Radar sumber",
    title: "Kampanye resmi exchange dan paket sambutan",
    subtitle: "Petunjuk aktivitas resmi dengan sumber yang telah ditinjau. Kelayakan, waktu, dan manfaat pengguna tetap perlu dikonfirmasi di akun.",
    tabAll: "Semua platform",
    tabCex: "CEX utama",
    tabDex: "DEX dan perpetual",
    officialSources: "Sumber dan pusat resmi",
    termsNote: "Syarat utama partisipasi",
    claimBtn: "Lihat syarat resmi ↗",
    verifiedTag: "Sumber ditinjau",
    directHub: "Pusat aktivitas resmi",
    sourceReviewed: "Sumber ditinjau: {date}",
    reviewDateUnavailable: "Tanggal tinjauan tidak tersedia",
    eligibilityNote: "Kelayakan dan waktu bergantung pada akun resmi",
    perkTag: "Status kampanye sambutan",
    openRegistration: "Buka pendaftaran resmi ↗",
  },
  // l10n: needs native review
  vi: {
    badge: "Radar nguồn",
    title: "Chiến dịch chính thức của sàn và gói chào mừng",
    subtitle: "Gợi ý hoạt động chính thức đã rà soát nguồn. Điều kiện tham gia, thời hạn và quyền lợi vẫn cần xác nhận trong tài khoản.",
    tabAll: "Tất cả nền tảng",
    tabCex: "CEX lớn",
    tabDex: "DEX và hợp đồng vĩnh cửu",
    officialSources: "Nguồn và trung tâm chính thức",
    termsNote: "Điều kiện tham gia chính",
    claimBtn: "Xem điều kiện chính thức ↗",
    verifiedTag: "Đã rà soát nguồn",
    directHub: "Trung tâm hoạt động chính thức",
    sourceReviewed: "Rà soát nguồn: {date}",
    reviewDateUnavailable: "Chưa có ngày rà soát",
    eligibilityNote: "Điều kiện và thời hạn phụ thuộc vào tài khoản chính thức",
    perkTag: "Trạng thái chương trình chào mừng",
    openRegistration: "Mở đăng ký chính thức ↗",
  },
  // l10n: needs native review
  ar: {
    badge: "رادار المصادر",
    title: "حملات المنصات الرسمية وباقات الترحيب",
    subtitle: "إشارات إلى أنشطة رسمية تمت مراجعة مصادرها. لا تزال الأهلية والمواعيد ومزايا المستخدم بحاجة إلى تأكيد داخل الحساب.",
    tabAll: "كل المنصات",
    tabCex: "أبرز المنصات المركزية",
    tabDex: "المنصات اللامركزية والعقود الدائمة",
    officialSources: "المصادر والمراكز الرسمية",
    termsNote: "أهم شروط المشاركة",
    claimBtn: "مراجعة الشروط الرسمية ↗",
    verifiedTag: "تمت مراجعة المصدر",
    directHub: "مركز الأنشطة الرسمي",
    sourceReviewed: "تمت مراجعة المصدر: {date}",
    reviewDateUnavailable: "تاريخ المراجعة غير متاح",
    eligibilityNote: "تعتمد الأهلية والمواعيد على الحساب الرسمي",
    perkTag: "حالة حملة الترحيب",
    openRegistration: "فتح التسجيل الرسمي ↗",
  },
  // l10n: needs native review
  ur: {
    badge: "ذریعہ ریڈار",
    title: "ایکسچینج کی سرکاری مہمات اور خوش آمدید پیک",
    subtitle: "سرکاری سرگرمیوں کے اشارے جن کے ذرائع کا جائزہ لیا گیا ہے۔ اہلیت، وقت اور فائدے اکاؤنٹ میں تصدیق طلب رہتے ہیں۔",
    tabAll: "تمام نمایاں پلیٹ فارم",
    tabCex: "بڑی CEX",
    tabDex: "DEX اور دائمی معاہدے",
    officialSources: "سرکاری ذرائع اور مراکز",
    termsNote: "شرکت کی اہم شرائط",
    claimBtn: "سرکاری شرائط دیکھیں ↗",
    verifiedTag: "ذریعہ جائزہ شدہ",
    directHub: "سرکاری سرگرمی مرکز",
    sourceReviewed: "ذریعہ جائزہ: {date}",
    reviewDateUnavailable: "جائزہ تاریخ دستیاب نہیں",
    eligibilityNote: "اہلیت اور وقت سرکاری اکاؤنٹ پر منحصر ہیں",
    perkTag: "خوش آمدید مہم کی حالت",
    openRegistration: "سرکاری رجسٹریشن کھولیں ↗",
  },
  // l10n: needs native review
  uk: {
    badge: "Радар джерел",
    title: "Офіційні кампанії бірж і вітальні пакети",
    subtitle: "Підказки щодо офіційних активностей із перевіреними джерелами. Право участі, строки й переваги треба підтверджувати в акаунті.",
    tabAll: "Усі провідні платформи",
    tabCex: "Основні CEX",
    tabDex: "DEX і безстрокові контракти",
    officialSources: "Офіційні джерела й центри",
    termsNote: "Ключові умови участі",
    claimBtn: "Переглянути офіційні умови ↗",
    verifiedTag: "Джерело перевірено",
    directHub: "Офіційний центр активностей",
    sourceReviewed: "Джерело перевірено: {date}",
    reviewDateUnavailable: "Дата перевірки недоступна",
    eligibilityNote: "Право участі й строки залежать від офіційного акаунта",
    perkTag: "Стан вітальної кампанії",
    openRegistration: "Відкрити офіційну реєстрацію ↗",
  },
};

const copy = campaignRadarCopy;

export function campaignRadarCopyFor(locale = "en") {
  const normalized = String(locale || "en");
  const base = normalized.split("-")[0];
  if (normalized === "zh-TW" || normalized === "zh-HK") return copy["zh-Hant"];
  if (normalized === "pt" || base === "pt") return copy["pt-BR"];
  return copy[normalized] || copy[base] || (base === "zh" ? copy["zh-Hans"] : copy.en);
}

// Site-authored research text: the localized edition when one exists, otherwise the record's own locale editions.
const researchText = (slug, path, value, locale) => {
  const localized = campaignResearchLocalizedText(slug, path, locale);
  if (localized) return localized;
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const base = String(locale || "").split("-")[0];
  return value[locale] || value[base] || (base === "zh" ? value["zh-Hans"] : "") || value.en || "";
};

const venueText = (value, locale) => {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const base = String(locale || "").split("-")[0];
  return value[locale] || value[base] || (base === "zh" ? value["zh-Hans"] : "") || value.en || "";
};

export function CampaignRadar({ locale = "en" }) {
  const t = campaignRadarCopyFor(locale);

  const [activeTab, setActiveTab] = useState("all");

  // 精选主流最具吸引力的 12 家大厂/DEX 活动呈现于首页
  const radarSlugs = useMemo(() => [
    "binance", "okx", "bybit", "bitget", "gate-io", "kucoin", "mexc", "backpack", "deribit", "hyperliquid", "drift", "gmx"
  ], []);

  const campaigns = useMemo(() => {
    // Türkiye: a partner that may not be promoted there gets no campaign card (owner 2026-10-13, legal).
    return radarSlugs.filter((slug) => !isTurkeyGated(slug, { locale })).map((slug) => {
      const research = officialCampaignResearchByVenue[slug];
      const db = venueDatabase[slug] || {};
      const partner = partnerRegistry[slug] || {};
      const commercialClaim = resolveCommercialClaim({ partner, venue: db });
      const publicCta = publicCtaForVenue(slug, locale);

      const summaryText = researchText(slug, ["summary"], research?.summary, locale);
      const rewardSummary = researchText(slug, ["signupReward", "summary"], research?.signupReward?.summary, locale);
      const conditions = (research?.signupReward?.conditions || []).map((cond, index) =>
        researchText(slug, ["signupReward", "conditions", String(index)], cond, locale));
      const sources = research?.sources || [];
      const perkText = venueText(db.benefit, locale);
      const welcomeBadge = venueText(db.welcomeRewardBadge, locale);

      return {
        slug,
        name: db.name || partner.name || slug,
        category: db.category || partner.category || "CEX",
        inviteCode: publicCta.hasReferral ? publicCta.inviteCode : null,
        registrationUrl: venueGoHref(slug, "campaign-radar", locale),
        hasReferral: publicCta.hasReferral,
        summaryText,
        rewardSummary,
        conditions,
        sources,
        checkedAt: research?.checkedAt || null,
        perkText,
        welcomeBadge: commercialClaim.status === "verified" ? welcomeBadge : "",
        commercialClaim,
      };
    });
  }, [locale, radarSlugs]);

  const filteredCampaigns = useMemo(() => {
    if (activeTab === "cex") return campaigns.filter(c => c.category === "CEX");
    if (activeTab === "dex") return campaigns.filter(c => c.category !== "CEX");
    return campaigns;
  }, [campaigns, activeTab]);

  return (
    <section className="campaign-radar-section v2-shell" id="campaigns">
      <div className="campaign-radar__header">
        <div className="campaign-radar__pill-tag">
          <span className="campaign-radar__pulse"></span>
          {t.badge}
        </div>
        <h2 className="campaign-radar__title">{t.title}</h2>
        <p className="campaign-radar__subtitle">{t.subtitle}</p>

        <div className="campaign-radar__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            className={`campaign-radar__tab ${activeTab === "all" ? "campaign-radar__tab--active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            {t.tabAll}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "cex"}
            className={`campaign-radar__tab ${activeTab === "cex" ? "campaign-radar__tab--active" : ""}`}
            onClick={() => setActiveTab("cex")}
          >
            {t.tabCex}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "dex"}
            className={`campaign-radar__tab ${activeTab === "dex" ? "campaign-radar__tab--active" : ""}`}
            onClick={() => setActiveTab("dex")}
          >
            {t.tabDex}
          </button>
        </div>
      </div>

      <div className="campaign-radar__grid">
        {filteredCampaigns.map((item) => {
          const reviewedOn = item.checkedAt ? formatDate(locale, item.checkedAt, { dateStyle: "medium" }) : "";
          const directRegistration = item.hasReferral && Boolean(item.registrationUrl);
          return (
          <article key={item.slug} className="campaign-card">
            <div className="campaign-card__header">
              <div className="campaign-card__brand">
                <div className="campaign-card__logo-wrap">
                  <BrandMark slug={item.slug} compact />
                </div>
                <div>
                  <h3 className="campaign-card__name" translate="no" lang="en">{item.name}</h3>
                  <span className="campaign-card__category">{item.category}</span>
                </div>
              </div>
              <span className="campaign-card__badge-verified">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t.verifiedTag}
              </span>
            </div>

            <div className="campaign-card__urgency-bar">
              <span className="campaign-card__timer">
                {reviewedOn
                  ? <time dateTime={item.checkedAt}>{t.sourceReviewed.replace("{date}", reviewedOn)}</time>
                  : t.reviewDateUnavailable}
              </span>
              <span className="campaign-card__quota">{t.eligibilityNote}</span>
            </div>

            {item.welcomeBadge && (
              <div className="campaign-card__bonus-pill">
                <span>{item.welcomeBadge}</span>
              </div>
            )}

            {/* A welcome benefit is shown only once it is verified; an unverified one renders nothing (SEO audit 2026-10-11
                #6: twelve cards read "Pending official-source review"). The radar subtitle already says benefits need
                account-level confirmation. */}
            {item.commercialClaim.status === "verified" && item.perkText ? (
              <div className="campaign-card__perk-hero">
                <div className="campaign-card__perk-tag">
                  {t.perkTag}
                </div>
                <p className="campaign-card__perk-text">{item.perkText}</p>
              </div>
            ) : null}

            {item.rewardSummary && (
              <p className="campaign-card__summary">{item.rewardSummary}</p>
            )}

            {item.conditions.length > 0 && (
              <div className="campaign-card__terms-box">
                <div className="campaign-card__terms-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  {t.termsNote}
                </div>
                <ul className="campaign-card__terms-list">
                  {item.conditions.slice(0, 2).map((condText, idx) => (
                    <li key={idx}>{condText}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="campaign-card__footer">
              {item.sources.length > 0 && (
                <div className="campaign-card__sources">
                  {item.sources.slice(0, 1).map((src) => (
                    <SourceLink locale={locale}
                      key={src.id}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="campaign-card__source-link"
                      {...(src.title ? enAttrs(locale) : undefined)}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      {src.title || t.directHub}
                    </SourceLink>
                  ))}
                </div>
              )}

              <a
                href={item.hasReferral && item.registrationUrl
                  ? item.registrationUrl
                  : contextualHref(`/exchanges/${item.slug}#registration-path`, { locale })}
                target={item.hasReferral && item.registrationUrl ? "_blank" : undefined}
                rel={item.hasReferral && item.registrationUrl ? "sponsored noopener noreferrer" : undefined}
                className="campaign-card__cta"
                data-cta-kind={item.hasReferral && item.registrationUrl ? "registration" : "research"}
                data-cta-platform={item.slug}
                data-cta-placement="campaign-radar"
                data-cta-status={item.commercialClaim.status}
                data-growth-decision={item.slug}
                data-growth-placement="campaign-radar"
              >
                <span>{directRegistration ? t.openRegistration : t.claimBtn}</span>
              </a>
            </div>
          </article>
          );
        })}
      </div>
    </section>
  );
}

export default CampaignRadar;
