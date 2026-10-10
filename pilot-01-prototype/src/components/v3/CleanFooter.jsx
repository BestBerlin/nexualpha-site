import { NexuAlphaWordmark } from "../brand/NexuAlphaWordmark";
import { v3Copy } from "../../data/v3-product.js";
import { localizedHref } from "../../data/locale-routing.js";
import { dataPageCopy } from "../../data/market-data-pages-nav.js";

const copyDict = {
  "zh-Hans": {
    statement: "NexuAlpha 是独立的加密交易平台黄页与决策导航，不属于任何交易所，不代办开户、不触碰私钥、不托管资产。部分平台包含合作与返佣链接，佣金由平台承担，不会增加您的任何交易成本。所有开户与交易请核对官方主域名。",
    disclaimer: "【风险披露与免责声明】数字资产与衍生品价格波动剧烈，合约与杠杆交易具有极高本金亏损风险。NexuAlpha 仅提供中立平台数据核验、费率比对与入口聚合，不构成任何投资、财务、税务或法律建议。用户须独立评估自身风险承受能力，自负盈亏 (DYOR)。",
  },
  "zh-Hant": {
    statement: "NexuAlpha 是獨立的加密交易平台黃頁與決策導航，不屬於任何交易所，不代辦開戶、不觸碰私鑰、不託管資產。部分平台包含合作與返傭連結，傭金由平台承擔，不會增加您的任何交易成本。所有開戶與交易請核對官方主網域。",
    disclaimer: "【風險披露與免責聲明】數位資產與衍生品價格波動劇烈，合約與槓桿交易具有極高本金虧損風險。NexuAlpha 僅提供中立平台數據核驗、費率比對與入口聚合，不構成任何投資、財務、稅務或法律建議。用戶須獨立評估自身風險承受能力，自負盈虧 (DYOR)。",
  },
  "pt-BR": {
    statement: "NexuAlpha é um diretório independente para comparar plataformas de criptoativos. Não operamos uma corretora nem recebemos ou guardamos seus ativos. Alguns links são de parceiros comerciais. Confira o domínio oficial e as condições de cada plataforma.",
    disclaimer: "Criptoativos podem ter grande volatilidade e risco de perda. As informações desta página ajudam a comparar condições de uso; não constituem recomendação de investimento. Custos, disponibilidade e critérios de cadastro podem mudar.",
  },
  en: {
    statement: "NexuAlpha is an independent crypto platform directory and comparison hub. We do not operate an exchange, take deposits, or custody funds. Some partner links may earn an affiliate commission at no extra cost to you. Always verify official domains.",
    disclaimer: "Risk Disclaimer & Disclosure: Trading digital assets and perpetual contracts carries substantial risk and extreme price volatility. NexuAlpha provides independent directory data, fee comparisons, and reviewed official-domain references for educational and informational purposes only. Nothing herein constitutes financial, investment, or legal advice. Past performance is not indicative of future returns. DYOR.",
  },
};

const footerLabelByLocale = {
  en: {
    navAria: "NexuAlpha footer navigation",
    directory: "Platform directory",
    topics: "Topic guides",
    factbook: "Factbook",
    onchain: "On-chain Data",
    editorial: "Editorial Policy",
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
    calculator: "حاسبة الرسوم",
    embedGuide: "أدوات قابلة للتضمين",
    disclosure: "إفصاح الشراكة",
    privacy: "إشعار الخصوصية",
    terms: "الشروط وإشعار المخاطر",
    contact: "اتصال",
    rights: "جميع الحقوق محفوظة.",
  },
  tr: {
    navAria: "NexuAlpha alt bilgi gezinmesi",
    directory: "Platform dizini",
    topics: "Konu Rehberleri",
    factbook: "Kaynak inceleme bilgi kitabı",
    onchain: "Zincir üstü veriler",
    editorial: "Editoryal politika",
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
    calculator: "Calcolatore commissioni",
    embedGuide: "Widget incorporabili",
    disclosure: "Informativa affiliati",
    privacy: "Informativa privacy",
    terms: "Termini e avviso di rischio",
    contact: "Contatto",
    rights: "Tutti i diritti riservati.",
  },
};

const compactFooterCopy = {
  "en": {
    "brand": "Independent crypto platform research and comparison.",
    "affiliate": "Some links are affiliate links; user benefits follow platform terms.",
    "summary": "Independent crypto platform research; some links are affiliate links and platform terms apply.",
    "policies": "About & policies"
  },
  "zh-Hans": {
    "brand": "独立的加密平台研究与比较。",
    "affiliate": "部分链接为合作推广链接；用户权益以平台条款为准。",
    "summary": "独立加密平台研究；部分链接为合作推广，用户权益以平台条款为准。",
    "policies": "关于我们与政策"
  },
  "zh-Hant": {
    "brand": "獨立的加密平台研究與比較。",
    "affiliate": "部分連結為合作推廣連結；用戶權益以平台條款為準。",
    "summary": "獨立加密平台研究；部分連結為合作推廣，用戶權益以平台條款為準。",
    "policies": "關於我們與政策"
  },
  "ja": {
    "brand": "暗号資産プラットフォームの独立した調査と比較。",
    "affiliate": "一部はアフィリエイトリンクです。特典は各社の規約に従います。",
    "summary": "暗号資産プラットフォームの独立調査です。一部リンクはアフィリエイトで、特典は各社規約に従います。",
    "policies": "サイト情報とポリシー"
  },
  "ko": {
    "brand": "암호화폐 플랫폼의 독립적인 조사와 비교.",
    "affiliate": "일부는 제휴 링크입니다. 사용자 혜택은 플랫폼 약관에 따릅니다.",
    "summary": "독립 암호화폐 플랫폼 리서치이며, 일부 링크는 제휴 링크이고 혜택은 플랫폼 약관을 따릅니다.",
    "policies": "소개 및 정책"
  },
  "tr": {
    "brand": "Kripto platformları için bağımsız araştırma ve karşılaştırma.",
    "affiliate": "Bazı bağlantılar ortaklık bağlantılarıdır; avantajlar platform koşullarına bağlıdır.",
    "summary": "Bağımsız kripto platform araştırması; bazı bağlantılar ortaklık bağlantısıdır ve avantajlar platform koşullarına bağlıdır.",
    "policies": "Hakkımızda ve politikalar"
  },
  "es": {
    "brand": "Investigación y comparación independiente de plataformas cripto.",
    "affiliate": "Algunos enlaces son de afiliados; los beneficios dependen de las condiciones de cada plataforma.",
    "summary": "Investigación cripto independiente; algunos enlaces son de afiliados y los beneficios dependen de cada plataforma.",
    "policies": "Acerca de y políticas"
  },
  "pt-BR": {
    "brand": "Pesquisa e comparação independente de plataformas cripto.",
    "affiliate": "Alguns links são de afiliados; os benefícios seguem os termos da plataforma.",
    "summary": "Pesquisa cripto independente; alguns links são afiliados e os benefícios seguem os termos da plataforma.",
    "policies": "Sobre e políticas"
  },
  "fr": {
    "brand": "Recherche et comparaison indépendantes de plateformes crypto.",
    "affiliate": "Certains liens sont affiliés ; les avantages dépendent des conditions de la plateforme.",
    "summary": "Recherche crypto indépendante ; certains liens sont affiliés et les avantages dépendent des conditions de la plateforme.",
    "policies": "À propos et politiques"
  },
  "de": {
    "brand": "Unabhängige Recherche und Vergleich von Kryptoplattformen.",
    "affiliate": "Einige Links sind Affiliate-Links; Vorteile richten sich nach den Plattformbedingungen.",
    "summary": "Unabhängige Krypto-Recherche; einige Links sind Affiliate-Links und Vorteile folgen den Plattformbedingungen.",
    "policies": "Über uns und Richtlinien"
  },
  "ru": {
    "brand": "Независимое исследование и сравнение криптоплатформ.",
    "affiliate": "Некоторые ссылки партнёрские; преимущества определяются условиями платформы.",
    "summary": "Независимое исследование криптоплатформ; некоторые ссылки партнёрские, а преимущества зависят от условий платформы.",
    "policies": "О сайте и правилах"
  },
  "ar": {
    "brand": "بحث ومقارنة مستقلان لمنصات العملات المشفرة.",
    "affiliate": "بعض الروابط روابط شراكة؛ مزايا المستخدم تخضع لشروط المنصة.",
    "summary": "بحث مستقل في منصات العملات المشفرة؛ بعض الروابط شراكة والمزايا تخضع لشروط المنصة.",
    "policies": "عن الموقع والسياسات"
  },
  "id": {
    "brand": "Riset dan perbandingan independen platform kripto.",
    "affiliate": "Sebagian tautan adalah tautan afiliasi; manfaat pengguna mengikuti ketentuan platform.",
    "summary": "Riset platform kripto independen; sebagian tautan afiliasi dan manfaat mengikuti ketentuan platform.",
    "policies": "Tentang dan kebijakan"
  },
  "vi": {
    "brand": "Nghiên cứu và so sánh độc lập các nền tảng tiền mã hóa.",
    "affiliate": "Một số liên kết là liên kết đối tác; quyền lợi phụ thuộc điều khoản nền tảng.",
    "summary": "Nghiên cứu nền tảng crypto độc lập; một số liên kết là đối tác và quyền lợi theo điều khoản nền tảng.",
    "policies": "Giới thiệu và chính sách"
  },
  "it": {
    "brand": "Ricerca e confronto indipendenti delle piattaforme crypto.",
    "affiliate": "Alcuni link sono affiliati; i vantaggi dipendono dai termini della piattaforma.",
    "summary": "Ricerca crypto indipendente; alcuni link sono affiliati e i vantaggi seguono i termini della piattaforma.",
    "policies": "Informazioni e politiche"
  }
};

function getFooterLabels(locale) {
  if (locale === "zh-CN") return { ...footerLabelByLocale.en, ...footerLabelByLocale["zh-Hans"] };
  if (locale === "zh-TW") return { ...footerLabelByLocale.en, ...footerLabelByLocale["zh-Hant"] };
  return { ...footerLabelByLocale.en, ...(footerLabelByLocale[locale] || {}) };
}

function getCopy(locale) {
  if (locale === "zh-Hans" || locale === "zh-CN") return copyDict["zh-Hans"];
  if (locale === "zh-Hant" || locale === "zh-TW") return copyDict["zh-Hant"];
  if (locale && locale !== "en") {
    const text = v3Copy(locale);
    return {
      ...copyDict.en,
      statement: text.relationship || copyDict.en.statement,
      disclaimer: text.noOfficial || copyDict.en.disclaimer,
    };
  }
  return copyDict.en;
}

// Short localized "Affiliate Disclosure" label used by the footer link (/methodology#disclosure).
export function footerDisclosureLabel(locale) {
  return getFooterLabels(locale).disclosure;
}

const POLICY_ANCHOR = "#nx-ftr-policy-details";
// Privacy / terms links open the folded policy panel in place instead of jumping to another route.
function openPolicy() {
  const panel = typeof document !== "undefined" ? document.getElementById("nx-ftr-policy-details") : null;
  if (panel) panel.open = true;
}

export function CleanFooter({ locale = "en", brazil = false }) {
  const copy = getCopy(locale);
  const labels = getFooterLabels(locale);
  const dataNav = dataPageCopy(locale).nav;
  const compact = compactFooterCopy[locale === "zh-CN" ? "zh-Hans" : locale === "zh-TW" ? "zh-Hant" : locale] || compactFooterCopy.en;
  const href = (target) => localizedHref(target, { locale });

  return (
    <footer className="nx-ftr" id="policy">
      <div className="nx-ftr__inner">
        <div className="nx-ftr__brand">
          <NexuAlphaWordmark variant="footer" href={href("/#top")} />
          <p className="clean-footer__summary">{compact.summary || `${compact.brand} ${compact.affiliate}`}</p>
        </div>

        <nav className="clean-footer__nav clean-footer__nav--primary nx-ftr__list nx-ftr__list--inline" aria-label={labels.navAria}>
          <ul>
            <li><a href={href("/exchanges")}>{labels.directory}</a></li>
            <li><a href={href("/topics")}>{labels.topics}</a></li>
            <li><a href={href("/factbook")}>{labels.factbook}</a></li>
            <li><a href={brazil ? "/br/custos" : href("/embed/calculator")}>{labels.calculator}</a></li>
            <li><a href={href("/onchain")}>{labels.onchain}</a></li>
            <li><a href={href("/liquidations")}>{dataNav.liquidations}</a></li>
            <li><a href={href("/funding-rates")}>{dataNav.funding}</a></li>
            <li><a href={href("/methodology")}>{labels.editorial}</a></li>
            <li><a href={href("/partners")}>{labels.embedGuide}</a></li>
            <li><a href={href("/methodology#disclosure")}>{labels.disclosure}</a></li>
            <li><a href={POLICY_ANCHOR} onClick={openPolicy}>{labels.privacy}</a></li>
            <li><a href={POLICY_ANCHOR} onClick={openPolicy}>{labels.terms}</a></li>
            <li><a href="mailto:contact@nexualpha.com">{labels.contact}</a></li>
          </ul>
        </nav>

        {/* Statement and risk disclaimer stay in the page (SSR, find-in-page, #policy links) but fold to one line. */}
        <details className="clean-footer__policies nx-ftr__policies nx-ftr__fold" id="nx-ftr-policy-details">
          <summary id="nx-ftr-policies" className="nx-ftr__title">{compact.policies}</summary>
          <div className="nx-ftr__legal clean-footer__policy-body">
            <p className="clean-footer__statement">{copy.statement}</p>
            <div className="clean-footer__disclaimer"><p>{copy.disclaimer}</p></div>
          </div>
        </details>

        <p className="clean-footer__copyright">
          <bdi dir="ltr">© 2026 NexuAlpha.</bdi> {labels.rights}
        </p>
      </div>
    </footer>
  );
}

export default CleanFooter;
