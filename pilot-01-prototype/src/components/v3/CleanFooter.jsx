import { CommissionDisclosureLine, SignupEvidence } from "../shared/SignupEvidence.jsx";
import { CLOSE_COPY } from "./LeanHeroCopyV6.js";
import { organizationDescription } from "../../data/brand-definition.js";
import { beginnerPath } from "../../data/beginner-routes.js";
import { BEGINNER_DOORS } from "../../data/beginner-home-copy.js";
import { NexuAlphaWordmark } from "../brand/NexuAlphaWordmark";
import { BrandMark } from "../brand/BrandMark";
import { localeManifest } from "../../content/locale-manifest";
import { localizedHref } from "../../data/locale-routing.js";
import { dataPageCopy } from "../../data/market-data-pages-nav.js";
import { academyShellCopy } from "../../data/academy.js";
import { glossaryNavLabel } from "../../data/glossary-routes.js";
import { DEPOSIT_ROOTS, depositNavLabel } from "../../data/deposit-routes.js";
import { TS_PATH, tokenizedStocksNavLabel } from "../../data/tokenized-stocks-routes.js";
import { PRESS_PATH, pressNavLabel } from "../../data/data-assets-routes.js";
import { brandSlogan } from "../../data/brand-slogan.js";
import { isNeutralCtaLocale } from "../../data/locale-policy.js";
import { homePartnersFor, homePushFor } from "../../data/home-rebate-tiers.js";
import { partnerExchangePageLinks } from "../../data/partner-page-links.js";
import { venueDatabase } from "../../data/venue-database.js";
import { socialLabels, socialLinksFor } from "../../data/brand-social.js";
import { TelegramGlyph, XGlyph, YouTubeGlyph } from "../shared/SocialIcons.jsx";


const footerLabelByLocale = {
  en: {
    navAria: "NexuAlpha footer navigation",
    directory: "Platform directory",
    topics: "Topic guides",
    factbook: "Factbook",
    onchain: "On-chain Data",
    editorial: "Editorial Policy",
    about: "About",
    methodology: "Methodology",
    calculator: "Fee calculator",
    embedGuide: "Embed Widgets",
    disclosure: "Affiliate Disclosure",
    privacy: "Privacy Notice",
    terms: "Terms & Risk Notice",
    contact: "Contact",
    rights: "All rights reserved.",
  },
  "zh-Hans": {
    navAria: "NexuAlpha 页脚导航",
    directory: "交易平台目录",
    topics: "主题指南",
    factbook: "事实库",
    onchain: "链上数据",
    editorial: "编辑政策",
    about: "关于我们",
    methodology: "研究方法",
    calculator: "费率计算器",
    embedGuide: "嵌入组件",
    disclosure: "合作披露",
    privacy: "隐私说明",
    terms: "条款与风险说明",
    contact: "联系方式",
    rights: "保留所有权利。",
  },
  "zh-Hant": {
    navAria: "NexuAlpha 頁尾導覽",
    directory: "交易平台目錄",
    topics: "主題指南",
    factbook: "事實庫",
    onchain: "鏈上資料",
    editorial: "編輯政策",
    about: "關於我們",
    methodology: "研究方法",
    calculator: "費率計算器",
    embedGuide: "嵌入元件",
    disclosure: "合作披露",
    privacy: "隱私說明",
    terms: "條款與風險說明",
    contact: "聯絡方式",
    rights: "保留所有權利。",
  },
  es: {
    navAria: "Navegación de pie de página de NexuAlpha",
    directory: "Directorio de plataformas",
    topics: "Guías temáticas",
    factbook: "Ficha de fuentes",
    onchain: "Datos on-chain",
    editorial: "Política editorial",
    about: "Acerca de",
    methodology: "Metodología",
    calculator: "Calculadora de comisiones",
    embedGuide: "Widgets para insertar",
    disclosure: "Divulgación de afiliados",
    privacy: "Aviso de privacidad",
    terms: "Condiciones y aviso de riesgo",
    contact: "Contacto",
    rights: "Todos los derechos reservados.",
  },
  "pt-BR": {
    navAria: "Navegação do rodapé da NexuAlpha",
    directory: "Diretório de corretoras",
    topics: "Guias temáticos",
    factbook: "Ficha de fontes",
    onchain: "Dados on-chain",
    editorial: "Política editorial",
    about: "Sobre",
    methodology: "Metodologia",
    calculator: "Calculadora de taxas",
    embedGuide: "Widgets incorporáveis",
    disclosure: "Divulgação de afiliados",
    privacy: "Aviso de privacidade",
    terms: "Termos e aviso de risco",
    contact: "Contato",
    rights: "Todos os direitos reservados.",
  },
  fr: {
    navAria: "Navigation de pied de page NexuAlpha",
    directory: "Répertoire des plateformes",
    topics: "Guides thématiques",
    factbook: "Fiche des sources",
    onchain: "Données on-chain",
    editorial: "Politique éditoriale",
    about: "À propos",
    methodology: "Méthodologie",
    calculator: "Calculateur de frais",
    embedGuide: "Widgets intégrables",
    disclosure: "Divulgation d'affiliation",
    privacy: "Avis de confidentialité",
    terms: "Conditions et avis de risque",
    contact: "Contact",
    rights: "Tous droits réservés.",
  },
  de: {
    navAria: "NexuAlpha Footer-Navigation",
    directory: "Plattformverzeichnis",
    topics: "Themen-Guides",
    factbook: "Quellen-Factbook",
    onchain: "On-chain-Daten",
    editorial: "Redaktionelle Richtlinie",
    about: "Über uns",
    methodology: "Methodik",
    calculator: "Gebührenrechner",
    embedGuide: "Einbettbare Widgets",
    disclosure: "Affiliate-Offenlegung",
    privacy: "Datenschutzhinweis",
    terms: "Nutzungs- und Risikohinweis",
    contact: "Kontakt",
    rights: "Alle Rechte vorbehalten.",
  },
  ja: {
    navAria: "NexuAlpha フッターナビゲーション",
    directory: "取引所ディレクトリ",
    topics: "トピックガイド",
    factbook: "出典ファクトブック",
    onchain: "オンチェーンデータ",
    editorial: "編集ポリシー",
    about: "運営者情報",
    methodology: "調査方法",
    calculator: "手数料計算ツール",
    embedGuide: "埋め込みウィジェット",
    disclosure: "アフィリエイト開示",
    privacy: "プライバシー通知",
    terms: "利用条件とリスク通知",
    contact: "お問い合わせ",
    rights: "すべての権利を留保します。",
  },
  ko: {
    navAria: "NexuAlpha 푸터 내비게이션",
    directory: "거래소 디렉터리",
    topics: "주제 가이드",
    factbook: "출처 팩트북",
    onchain: "온체인 데이터",
    editorial: "편집 정책",
    about: "소개",
    methodology: "방법론",
    calculator: "수수료 계산기",
    embedGuide: "임베드 위젯",
    disclosure: "제휴 고지",
    privacy: "개인정보 안내",
    terms: "이용 조건 및 위험 고지",
    contact: "문의",
    rights: "모든 권리 보유.",
  },
  ar: {
    navAria: "تنقل تذييل NexuAlpha",
    directory: "دليل المنصات",
    topics: "أدلة المواضيع",
    factbook: "سجل المصادر",
    onchain: "بيانات السلسلة",
    editorial: "السياسة التحريرية",
    about: "عن الموقع",
    methodology: "المنهجية",
    calculator: "حاسبة الرسوم",
    embedGuide: "أدوات قابلة للتضمين",
    disclosure: "إفصاح الشراكة",
    privacy: "إشعار الخصوصية",
    terms: "الشروط وإشعار المخاطر",
    contact: "اتصال",
    rights: "جميع الحقوق محفوظة.",
  },
  // l10n: needs native review
  ur: {
    navAria: "NexuAlpha فٹر نیویگیشن",
    directory: "پلیٹ فارم ڈائریکٹری",
    topics: "موضوعاتی رہنما",
    factbook: "فیکٹ بک",
    onchain: "آن چین ڈیٹا",
    editorial: "ادارتی پالیسی",
    about: "ہمارے بارے میں",
    methodology: "طریقہ کار",
    calculator: "فیس کیلکولیٹر",
    embedGuide: "ایمبیڈ وجٹس",
    disclosure: "افیلی ایٹ انکشاف",
    privacy: "رازداری نوٹس",
    terms: "شرائط اور خطرے کا نوٹس",
    contact: "رابطہ",
    rights: "جملہ حقوق محفوظ ہیں۔",
  },
  // l10n: needs native review
  uk: {
    navAria: "Навігація футера NexuAlpha",
    directory: "Каталог платформ",
    topics: "Тематичні гайди",
    factbook: "Фактбук",
    onchain: "Ончейн-дані",
    editorial: "Редакційна політика",
    about: "Про нас",
    methodology: "Методологія",
    calculator: "Калькулятор комісій",
    embedGuide: "Вбудовані віджети",
    disclosure: "Розкриття партнерства",
    privacy: "Повідомлення про приватність",
    terms: "Умови та попередження про ризики",
    contact: "Контакт",
    rights: "Усі права захищено.",
  },
  tr: {
    navAria: "NexuAlpha alt bilgi gezinmesi",
    directory: "Platform dizini",
    topics: "Konu Rehberleri",
    factbook: "Kaynak inceleme bilgi kitabı",
    onchain: "Zincir üstü veriler",
    editorial: "Editoryal politika",
    about: "Hakkımızda",
    methodology: "Metodoloji",
    calculator: "Ücret hesaplayıcı",
    embedGuide: "Gömülebilir widget'lar",
    disclosure: "İş ortaklığı açıklaması",
    privacy: "Gizlilik bildirimi",
    terms: "Koşullar ve risk bildirimi",
    contact: "İletişim",
    rights: "Tüm hakları saklıdır.",
  },
  ru: {
    navAria: "Навигация в подвале NexuAlpha",
    directory: "Каталог платформ",
    topics: "Тематические гиды",
    factbook: "Досье источников",
    onchain: "Ончейн-данные",
    editorial: "Редакционная политика",
    about: "О сайте",
    methodology: "Методология",
    calculator: "Калькулятор комиссий",
    embedGuide: "Встраиваемые виджеты",
    disclosure: "Раскрытие партнёрских ссылок",
    privacy: "Уведомление о конфиденциальности",
    terms: "Условия и уведомление о рисках",
    contact: "Контакты",
    rights: "Все права защищены.",
  },
  id: {
    navAria: "Navigasi footer NexuAlpha",
    directory: "Direktori platform",
    topics: "Panduan topik",
    factbook: "Factbook sumber",
    onchain: "Data on-chain",
    editorial: "Kebijakan editorial",
    about: "Tentang",
    methodology: "Metodologi",
    calculator: "Kalkulator biaya",
    embedGuide: "Widget sematan",
    disclosure: "Pengungkapan afiliasi",
    privacy: "Pemberitahuan privasi",
    terms: "Ketentuan dan pemberitahuan risiko",
    contact: "Kontak",
    rights: "Hak cipta dilindungi.",
  },
  vi: {
    navAria: "Điều hướng chân trang NexuAlpha",
    directory: "Danh mục nền tảng",
    topics: "Hướng dẫn chủ đề",
    factbook: "Hồ sơ nguồn",
    onchain: "Dữ liệu on-chain",
    editorial: "Chính sách biên tập",
    about: "Giới thiệu",
    methodology: "Phương pháp",
    calculator: "Công cụ tính phí",
    embedGuide: "Widget nhúng",
    disclosure: "Công bố liên kết đối tác",
    privacy: "Thông báo quyền riêng tư",
    terms: "Điều khoản và thông báo rủi ro",
    contact: "Liên hệ",
    rights: "Bảo lưu mọi quyền.",
  },
  it: {
    navAria: "Navigazione footer NexuAlpha",
    directory: "Directory piattaforme",
    topics: "Guide tematiche",
    factbook: "Factbook delle fonti",
    onchain: "Dati on-chain",
    editorial: "Politica editoriale",
    about: "Chi siamo",
    methodology: "Metodologia",
    calculator: "Calcolatore commissioni",
    embedGuide: "Widget incorporabili",
    disclosure: "Informativa affiliati",
    privacy: "Informativa privacy",
    terms: "Termini e avviso di rischio",
    contact: "Contatto",
    rights: "Tutti i diritti riservati.",
  },
};

const footerColumnLabels = {
  en: { product: "Product", exchanges: "Exchanges", learn: "Learn", about: "About" },
  "zh-Hans": { product: "产品", exchanges: "交易所", learn: "学习", about: "关于" },
  "zh-Hant": { product: "產品", exchanges: "交易所", learn: "學習", about: "關於" },
  ja: { product: "プロダクト", exchanges: "取引所", learn: "学ぶ", about: "運営" },
  ko: { product: "제품", exchanges: "거래소", learn: "학습", about: "소개" },
  tr: { product: "Ürün", exchanges: "Borsalar", learn: "Öğren", about: "Hakkında" },
  es: { product: "Producto", exchanges: "Exchanges", learn: "Aprender", about: "Acerca de" },
  "pt-BR": { product: "Produto", exchanges: "Corretoras", learn: "Aprender", about: "Sobre" },
  fr: { product: "Produit", exchanges: "Plateformes", learn: "Apprendre", about: "À propos" },
  de: { product: "Produkt", exchanges: "Börsen", learn: "Lernen", about: "Über" },
  ru: { product: "Продукт", exchanges: "Биржи", learn: "Обучение", about: "О проекте" },
  ar: { product: "المنتج", exchanges: "المنصات", learn: "التعلم", about: "حول" },
  ur: { product: "پروڈکٹ", exchanges: "ایکسچینجز", learn: "سیکھیں", about: "تعارف" },
  uk: { product: "Продукт", exchanges: "Біржі", learn: "Навчання", about: "Про нас" },
  id: { product: "Produk", exchanges: "Bursa", learn: "Belajar", about: "Tentang" },
  vi: { product: "Sản phẩm", exchanges: "Sàn giao dịch", learn: "Học", about: "Giới thiệu" },
  it: { product: "Prodotto", exchanges: "Exchange", learn: "Impara", about: "Chi siamo" },
};

const activityCenterLabel = {
  en: "Activity center",
  "zh-Hans": "活动中心",
  "zh-Hant": "活動中心",
  tr: "Etkinlik merkezi",
  "pt-BR": "Central de atividades",
  fr: "Centre d’activités",
  es: "Centro de actividades",
  ja: "アクティビティセンター",
  ko: "활동 센터",
  ar: "مركز الأنشطة",
  hi: "गतिविधि केंद्र",
  ru: "Центр активностей",
  vi: "Trung tâm hoạt động",
  de: "Aktivitätszentrum",
  id: "Pusat aktivitas",
  it: "Centro attività",
};

// "Official sites" row (de-AI pass 2026-10-18): partner marks open the exchange's official sign-up page through our
// tracked /go/<slug> route (the server adds our code). Shown only where a partner may be promoted.
const officialEntryLabel = {
  en: "Official sites", "zh-Hans": "官方入口", "zh-Hant": "官方入口", es: "Sitios oficiales", "pt-BR": "Sites oficiais",
  fr: "Sites officiels", de: "Offizielle Seiten", it: "Siti ufficiali", ja: "公式サイト", ko: "공식 사이트", tr: "Resmî siteler",
  id: "Situs resmi", ar: "المواقع الرسمية", ur: "سرکاری سائٹس", uk: "Офіційні сайти", ru: "Официальные сайты", vi: "Trang chính thức",
};

function footerGoHref(slug, locale) {
  const query = new URLSearchParams({ src: "footer" });
  if (locale) query.set("locale", locale);
  return `/go/${encodeURIComponent(slug)}?${query.toString()}`;
}

function getColumnLabels(locale) {
  if (locale === "zh-CN") return footerColumnLabels["zh-Hans"];
  if (locale === "zh-TW") return footerColumnLabels["zh-Hant"];
  return footerColumnLabels[locale] || footerColumnLabels.en;
}

function getFooterLabels(locale) {
  if (locale === "zh-CN") return { ...footerLabelByLocale.en, ...footerLabelByLocale["zh-Hans"] };
  if (locale === "zh-TW") return { ...footerLabelByLocale.en, ...footerLabelByLocale["zh-Hant"] };
  return { ...footerLabelByLocale.en, ...(footerLabelByLocale[locale] || {}) };
}


// Short localized "Affiliate Disclosure" label used by the footer link (/methodology#disclosure).
export function footerDisclosureLabel(locale) {
  return getFooterLabels(locale).disclosure;
}

// Decorative section symbols reuse a single static SVG; no client state or icon dependency.
function FooterSectionIcon({ kind }) {
  const paths = {
    product: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    exchanges: "M3 7h18M17 3l4 4-4 4M21 17H3M7 13l-4 4 4 4",
    learn: "M3 4h6l3 2 3-2h6v15h-6l-3 2-3-2H3zM12 6v15",
    about: "M12 11v6M12 7v1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  };
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>;
}

export function CleanFooter({ locale = "en", market, brazil = false }) {
  const selectedLocale = locale === "zh-CN" ? "zh-Hans" : locale === "zh-TW" ? "zh-Hant" : locale;
  const labels = getFooterLabels(locale);
  const comparisonLabel = (CLOSE_COPY[selectedLocale] || CLOSE_COPY.en).cmp;
  const dataNav = dataPageCopy(locale).nav;
  const href = (target) => localizedHref(target, { locale });
  const partnerProgramLabel = { en: "Partner program", "zh-Hans": "合作伙伴计划", es: "Programa de socios", "pt-BR": "Programa de parceiros", fr: "Programme partenaires", de: "Partnerprogramm", ja: "パートナープログラム", ko: "파트너 프로그램", tr: "İş ortağı programı", id: "Program partner", it: "Programma partner" }[locale] || "Partner program";
  const partnerGroupLabel = officialEntryLabel[locale === "zh-CN" ? "zh-Hans" : locale === "zh-TW" ? "zh-Hant" : locale] || officialEntryLabel.en;
  const columnLabels = getColumnLabels(locale);
  const turkeyRoute = locale === "tr" || market === "TR";
  const neutralLocale = isNeutralCtaLocale(locale);
  // Only partners that may be promoted on this locale/market get a /go link (same gate as the venue pages' sign-up path).
  const promotable = new Set(partnerExchangePageLinks(locale, { market }).filter((link) => link.href.includes("#registration-path")).map((link) => link.slug));
  const partnerSlugs = neutralLocale ? [] : [...new Set([...homePushFor(locale, market), ...homePartnersFor(locale, market)])].filter((slug) => promotable.has(slug)).slice(0, 6);
  const partnerLinks = partnerSlugs.map((slug) => ({
    key: `partner-${slug}`,
    slug,
    name: venueDatabase[slug]?.name || slug,
    href: footerGoHref(slug, locale),
  }));
  // Ordinary editorial links, never sign-up links: keep discovery available in every market.
  const feeVenues = ["bybit", "gate-io", "okx", "hyperliquid", "deribit", "jupiter", "mexc", "backpack"];
  const feeComparisons = ["binance-vs-kraken", "binance-vs-okx", "binance-vs-bybit", "binance-vs-gate-io", "okx-vs-bybit", "gate-io-vs-mexc", "hyperliquid-vs-dydx", "coinbase-vs-gate-io"];
  const primaryColumns = [
    {
      key: "product",
      title: columnLabels.product,
      links: [
        { href: brazil ? "/br/custos" : href("/embed/calculator"), label: labels.calculator },
        { href: href("/funding-rates"), label: dataNav.funding },
        { href: href("/liquidations"), label: dataNav.liquidations },
        { href: href("/onchain"), label: labels.onchain },
        { href: href("/flash"), label: { en: "Flash", "zh-Hans": "快讯", "zh-Hant": "快訊", tr: "Anlık haberler", es: "Flash", "pt-BR": "Flash", fr: "Flash", de: "Flash", ja: "速報", ko: "속보", id: "Flash", vi: "Tin nhanh", it: "Flash" }[locale] || "Flash" },
        // Press kit + open datasets (SEO W43, 2026-10-18); the About column is full (six links max).
        { href: href(PRESS_PATH), label: pressNavLabel(locale) },
      ],
    },
    {
      key: "exchanges",
      title: columnLabels.exchanges,
      links: turkeyRoute
        ? [
          { href: href("/exchanges"), label: labels.directory },
          { href: href("/compare"), label: comparisonLabel },
          { href: href("/activities"), label: activityCenterLabel[locale] || activityCenterLabel.en },
          { href: href(DEPOSIT_ROOTS[0]), label: depositNavLabel(locale) },
          { href: href(TS_PATH), label: tokenizedStocksNavLabel(locale) },
        ]
        : [
          { href: href("/exchanges"), label: labels.directory },
          { href: href("/compare"), label: comparisonLabel },
          { href: href("/activities"), label: activityCenterLabel[locale] || activityCenterLabel.en },
          { href: href(DEPOSIT_ROOTS[0]), label: depositNavLabel(locale) },
          { href: href(TS_PATH), label: tokenizedStocksNavLabel(locale) },
        ],
    },
    {
      key: "learn",
      title: columnLabels.learn,
      links: [
        { href: href(beginnerPath("start", locale)), label: (BEGINNER_DOORS[locale] || BEGINNER_DOORS.en)[0] },
        { href: href("/academy"), label: academyShellCopy(locale).nav },
        { href: href("/glossary"), label: glossaryNavLabel(locale) },
        { href: href("/topics"), label: labels.topics },
        { href: href("/factbook"), label: labels.factbook },
      ],
    },
    {
      key: "about",
      title: columnLabels.about,
      links: [
        { href: href("/about"), label: labels.about },
        { href: href("/editorial-policy"), label: labels.editorial },
        { href: href("/methodology"), label: labels.methodology },
        ...(!isNeutralCtaLocale(locale) ? [{ href: href("/partners"), label: partnerProgramLabel }] : []),
        { href: href("/partners/embed-guide"), label: labels.embedGuide },
        { href: href("/contact"), label: labels.contact },
      ],
    },
  ];
  const legalLinks = [
    { href: href("/privacy"), label: labels.privacy },
    { href: href("/terms"), label: labels.terms },
    { href: href("/methodology#disclosure"), label: labels.disclosure },
  ];

  const social = socialLabels(locale);
  const socialLinks = socialLinksFor(locale);
  const socialItems = [
    ["x", socialLinks.x, "X", XGlyph],
    ["youtube", socialLinks.youtube, "YouTube", YouTubeGlyph],
    ["tg-channel", socialLinks.telegramChannel, social.channel, TelegramGlyph],
    ["tg-group", socialLinks.telegramGroup, social.group, TelegramGlyph],
  ];

  return (
    <footer className="nx-ftr" id="policy">
      <div className="nx-ftr__inner">
        <div className="nx-ftr__brand">
          <NexuAlphaWordmark variant="footer" href={href("/#top")} />
          {/* Brand slogan A (owner 2026-10-11, src/data/brand-slogan.js): one quiet line under the mark on every page. */}
          <p className="nx-ftr__slogan">{brandSlogan(locale)}</p>
          {/* Owner 2026-10-23: the full social matrix with labels (official accounts, locale-appropriate YouTube and channel). */}
          <nav className="nx-ftr__follow" aria-labelledby="nx-ftr-follow" data-footer-social>
            <h2 className="nx-ftr__heading" id="nx-ftr-follow">{social.follow}</h2>
            <ul className="nx-ftr__socials">
              {socialItems.map(([key, href, label, Glyph]) => <li key={key}><a className={`nx-ftr__social nx-ftr__social--${key}`} href={href} target="_blank" rel="noopener" data-cta-kind={key.startsWith("tg") ? "telegram" : "social"} data-cta-placement={`footer-follow-${key}`}><Glyph size={20} /><span>{label}</span></a></li>)}
            </ul>
          </nav>
        </div>

        <nav className="nx-ftr__columns" aria-label={labels.navAria}>
          {primaryColumns.map((column) => <section className="nx-ftr__column" aria-labelledby={`nx-ftr-${column.key}`} key={column.key}>
            <h2 className="nx-ftr__heading" id={`nx-ftr-${column.key}`}><FooterSectionIcon kind={column.key} />{column.title}</h2>
            <ul>
              {column.links.map((link) => <li key={`${column.key}-${link.href}`}><a href={link.href}>{link.label}</a></li>)}
            </ul>
          </section>)}
        </nav>

        {partnerLinks.length ? <nav className="nx-ftr__entry" aria-labelledby="nx-ftr-entry" data-footer-partner-links>
            <h2 className="nx-ftr__heading" id="nx-ftr-entry">{partnerGroupLabel}</h2>
            <ul>
            {partnerLinks.map((link) => <li key={link.key}><span data-signup-cta={link.slug} className="signup-cta-block"><a href={link.href} target="_blank" rel="sponsored noopener noreferrer" data-footer-partner-link={link.slug} data-cta-kind="registration" data-cta-platform={link.slug} data-cta-placement="footer"><BrandMark slug={link.slug} /><span>{link.name}</span></a><SignupEvidence slug={link.slug} locale={locale} market={market} placement="footer" /></span></li>)}
            </ul>
          </nav> : null}

        <nav className="nx-ftr__discovery" aria-label={columnLabels.exchanges} data-footer-fee-links>
          <ul className="nx-ftr__venue-links">
            {feeVenues.map((slug) => <li key={slug}><a href={href(`/exchanges/${slug}`)}>{venueDatabase[slug]?.name || slug}</a></li>)}
          </ul>
          <details className="nx-ftr__pairs">
            <summary>{comparisonLabel}<span aria-hidden="true">＋</span></summary>
            <ul>
              {feeComparisons.map((pair) => <li key={pair}><a href={href(`/compare/${pair}`)}>{pair.split("-vs-").map((slug, i) => <span key={slug}>{i ? <small aria-hidden="true">/</small> : null}<BrandMark slug={slug} compact /><bdi>{venueDatabase[slug]?.name || slug}</bdi></span>)}</a></li>)}
            </ul>
          </details>
        </nav>

        <details className="nx-ftr__languages">
          <summary><span aria-hidden="true">◎</span><span lang={locale}>{localeManifest[selectedLocale]?.language || localeManifest.en.language}</span><span aria-hidden="true">＋</span></summary>
          <nav aria-label={labels.navAria}>
            {Object.entries(localeManifest).map(([code, language]) => <a key={code} href={localizedHref("/", { locale: code })} lang={code} hrefLang={code} dir={language.direction} aria-current={code === selectedLocale ? "true" : undefined}>{language.language}</a>)}
          </nav>
        </details>

        <div className="nx-ftr__legal-row">
          <p className="nx-ftr__copyright"><bdi dir="ltr">© 2026 NexuAlpha</bdi></p>
          <nav aria-label={labels.disclosure}>
            <ul>
              {legalLinks.map((link) => <li key={link.href}><a href={link.href}>{link.label}</a></li>)}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default CleanFooter;
