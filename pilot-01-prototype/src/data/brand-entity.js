// One source of truth for the NexuAlpha publisher entity (schema.org Organization), the editorial team
// (NexuAlpha Research Desk, an internal desk, not a named person) and the brand pages /about and /editorial-policy.
// Imported by the Worker, the client router (seo-injection.js), the data pages and the Brazil SEO module, so every
// page emits the same @id for the publisher. Facts only: no people, credentials, addresses or awards are listed.
// To add a public profile (X, GitHub, Medium, LinkedIn), append its URL to BRAND.profiles below; nothing else changes.

import { brandSlogan, sloganSentence } from "./brand-slogan.js";

export const PUBLIC_ORIGIN = "https://nexualpha.com";
export const ORGANIZATION_ID = `${PUBLIC_ORIGIN}/#organization`;
export const WEBSITE_ID = `${PUBLIC_ORIGIN}/#website`;
export const ABOUT_PATH = "/about";
export const EDITORIAL_POLICY_PATH = "/editorial-policy";
export const METHODOLOGY_PATH = "/methodology";
export const RESEARCH_DESK_ANCHOR = `${ABOUT_PATH}#research-desk`;
export const RESEARCH_DESK_ID = `${PUBLIC_ORIGIN}${RESEARCH_DESK_ANCHOR}`;
export const BRAND_PAGE_PATHS = Object.freeze([ABOUT_PATH, EDITORIAL_POLICY_PATH]);
// Date the entity facts and the two brand pages were last reviewed (rendered on both pages and as dateModified).
export const ENTITY_REVIEWED_AT = "2026-10-11";

export const BRAND_LOCALES = Object.freeze(["en", "zh-Hans", "zh-Hant", "es", "pt-BR", "fr", "de", "it", "ja", "ko", "ru", "tr", "id", "vi", "ar", "ur", "uk"]);

export const BRAND = Object.freeze({
  name: "NexuAlpha",
  url: `${PUBLIC_ORIGIN}/`,
  logo: Object.freeze({ url: `${PUBLIC_ORIGIN}/brand/nexualpha/nexualpha-round.svg`, width: 512, height: 512 }),
  image: `${PUBLIC_ORIGIN}/brand/nexualpha/nexualpha-square.png`,
  email: "Bestberlin@nexualpha.com",
  telegram: Object.freeze({
    channelZh: "https://t.me/NexuAlphaClub",
    channelEn: "https://t.me/NexuAlphaGlobal",
    group: "https://t.me/NexuAlphaWorld",
    bot: "https://t.me/NexuAlphaAssistantBot",
    miniApp: "https://app.nexualpha.com/",
  }),
  // Other public profiles. twitter.com/NexuAlpha was already emitted by the Worker's home Organization block;
  // the owner confirms or removes it here. Add X / GitHub / Medium / LinkedIn URLs to this list only.
  profiles: Object.freeze(["https://twitter.com/NexuAlpha"]),
});

export const BRAND_SAME_AS = Object.freeze([
  BRAND.telegram.channelZh,
  BRAND.telegram.channelEn,
  BRAND.telegram.bot,
  BRAND.telegram.miniApp,
  BRAND.telegram.group,
  ...BRAND.profiles,
]);

// Topics the publisher covers (schema.org knowsAbout). Plain English; the same list is used for every locale.
export const BRAND_KNOWS_ABOUT = Object.freeze([
  "Crypto exchange trading fees",
  "Exchange referral codes and fee rebates",
  "Perpetual futures funding rates",
  "Crypto futures liquidations",
  "Proof of reserves disclosures",
  "Regional exchange availability and KYC requirements",
  "Official exchange announcements",
]);

export const RESEARCH_DESK_NAME = "NexuAlpha Research Desk";

const ORGANIZATION_DESCRIPTION = Object.freeze({
  en: "Independent, source-backed crypto platform research: published fees, referral terms, regional conditions and reserve disclosures, each with its official source and review date.",
  "zh-Hans": "独立、以来源为依据的加密交易平台研究：公开费率、邀请条款、地区条件与储备披露，每项都附官方来源与复核日期。",
  "zh-Hant": "獨立、以來源為依據的加密交易平台研究：公開費率、邀請條款、地區條件與儲備披露，每項都附官方來源與複核日期。",
  es: "Investigación independiente y basada en fuentes sobre plataformas cripto: comisiones publicadas, condiciones de referidos, condiciones regionales y reservas, cada una con su fuente oficial y fecha de revisión.",
  "pt-BR": "Pesquisa independente e baseada em fontes sobre plataformas cripto: taxas publicadas, termos de indicação, condições regionais e reservas, cada item com fonte oficial e data de revisão.",
  fr: "Recherche indépendante et sourcée sur les plateformes crypto : frais publiés, conditions de parrainage, conditions régionales et réserves, chaque donnée avec sa source officielle et sa date de révision.",
  de: "Unabhängige, quellenbasierte Recherche zu Kryptoplattformen: veröffentlichte Gebühren, Empfehlungsbedingungen, regionale Bedingungen und Reserven, jeweils mit offizieller Quelle und Prüfdatum.",
  it: "Ricerca indipendente e basata su fonti sulle piattaforme crypto: commissioni pubblicate, condizioni referral, condizioni regionali e riserve, ciascuna con fonte ufficiale e data di verifica.",
  ja: "独立した一次情報ベースの暗号資産取引所リサーチ。公開手数料、紹介条件、地域条件、準備金開示を、公式ソースと確認日とともに整理します。",
  ko: "독립적이고 출처 기반의 암호화폐 플랫폼 리서치. 공개 수수료, 추천 조건, 지역 조건, 준비금 공시를 공식 출처와 검토일과 함께 정리합니다.",
  ru: "Независимое исследование криптоплатформ с опорой на источники: опубликованные комиссии, реферальные условия, региональные требования и раскрытие резервов — каждый пункт с официальным источником и датой проверки.",
  tr: "Kaynağa dayalı bağımsız kripto platform araştırması: yayımlanmış ücretler, referans koşulları, bölgesel koşullar ve rezerv açıklamaları, her biri resmi kaynağı ve inceleme tarihiyle.",
  id: "Riset platform kripto yang independen dan berbasis sumber: biaya resmi, ketentuan referral, kondisi regional dan pengungkapan cadangan, masing-masing dengan sumber resmi dan tanggal tinjauan.",
  vi: "Nghiên cứu nền tảng tiền mã hóa độc lập, dựa trên nguồn: phí công bố, điều khoản giới thiệu, điều kiện khu vực và công bố dự trữ, mỗi mục kèm nguồn chính thức và ngày rà soát.",
  // l10n: needs native review
  ur: "آزاد اور ماخذ پر مبنی کرپٹو ایکسچینج تحقیق: شائع شدہ فیس، ریفرل شرائط، علاقائی شرائط اور ذخائر کے افشا، ہر نکتے کے ساتھ سرکاری ماخذ اور جائزے کی تاریخ۔",
  // l10n: needs native review
  uk: "Незалежні дослідження криптобірж на основі джерел: опубліковані комісії, реферальні та регіональні умови, розкриття резервів — з офіційним джерелом і датою перевірки для кожного пункту.",
  ar: "بحث مستقل قائم على المصادر حول منصات العملات المشفرة: الرسوم المنشورة وشروط الإحالة والشروط الإقليمية وإفصاحات الاحتياطيات، كل بند مع مصدره الرسمي وتاريخ مراجعته.",
});

const RESEARCH_DESK_DESCRIPTION = Object.freeze({
  en: "The internal editorial team of NexuAlpha. It checks fees, referral terms and official announcements against primary sources; articles are researched and written with AI assistance and reviewed before publication. It is not a named individual, adviser, broker or exchange operator.",
  "zh-Hans": "NexuAlpha 的内部编辑团队，依据一手来源核对费率、邀请条款与官方公告；文章在 AI 辅助下研究与撰写，并在发布前复核。它不是具名个人、顾问、经纪商或交易所运营方。",
  "zh-Hant": "NexuAlpha 的內部編輯團隊，依據一手來源核對費率、邀請條款與官方公告；文章在 AI 輔助下研究與撰寫，並在發布前複核。它不是具名個人、顧問、經紀商或交易所營運方。",
  es: "El equipo editorial interno de NexuAlpha. Contrasta comisiones, condiciones de referidos y anuncios oficiales con fuentes primarias; los artículos se investigan y redactan con asistencia de IA y se revisan antes de publicarse. No es una persona identificada, asesor, bróker ni operador de exchange.",
  "pt-BR": "A equipe editorial interna da NexuAlpha. Confere taxas, termos de indicação e anúncios oficiais em fontes primárias; os artigos são pesquisados e escritos com assistência de IA e revisados antes da publicação. Não é uma pessoa identificada, consultor, corretora nem operador de exchange.",
  fr: "L’équipe éditoriale interne de NexuAlpha. Elle vérifie frais, conditions de parrainage et annonces officielles sur les sources primaires ; les articles sont recherchés et rédigés avec l’aide de l’IA puis relus avant publication. Ce n’est ni une personne nommée, ni un conseiller, courtier ou opérateur de plateforme.",
  de: "Das interne Redaktionsteam von NexuAlpha. Es prüft Gebühren, Empfehlungsbedingungen und offizielle Mitteilungen an Primärquellen; Artikel werden mit KI-Unterstützung recherchiert und geschrieben und vor der Veröffentlichung geprüft. Es ist keine namentlich genannte Person, kein Berater, Broker oder Börsenbetreiber.",
  it: "Il team editoriale interno di NexuAlpha. Verifica commissioni, condizioni referral e annunci ufficiali sulle fonti primarie; gli articoli sono ricercati e scritti con l’assistenza dell’IA e rivisti prima della pubblicazione. Non è una persona identificata, un consulente, un broker o un operatore di exchange.",
  ja: "NexuAlpha の社内編集チーム。手数料、紹介条件、公式発表を一次情報と照合します。記事は AI の支援を受けて調査・執筆し、公開前に確認します。特定の個人、アドバイザー、ブローカー、取引所運営者ではありません。",
  ko: "NexuAlpha의 내부 편집팀. 수수료, 추천 조건, 공식 공지를 1차 출처와 대조합니다. 기사는 AI 지원으로 조사·작성되며 게시 전 검토됩니다. 특정 개인, 자문가, 브로커 또는 거래소 운영자가 아닙니다.",
  ru: "Внутренняя редакция NexuAlpha. Сверяет комиссии, реферальные условия и официальные объявления с первичными источниками; статьи исследуются и пишутся с помощью ИИ и проверяются перед публикацией. Это не названное лицо, не консультант, брокер или оператор биржи.",
  tr: "NexuAlpha'nın iç editoryal ekibi. Ücretleri, referans koşullarını ve resmi duyuruları birincil kaynaklarla karşılaştırır; makaleler yapay zekâ desteğiyle araştırılıp yazılır ve yayından önce incelenir. Adı geçen bir kişi, danışman, aracı kurum veya borsa işletmecisi değildir.",
  id: "Tim editorial internal NexuAlpha. Memeriksa biaya, ketentuan referral dan pengumuman resmi terhadap sumber primer; artikel diriset dan ditulis dengan bantuan AI lalu ditinjau sebelum terbit. Bukan individu bernama, penasihat, broker, atau operator bursa.",
  vi: "Đội ngũ biên tập nội bộ của NexuAlpha. Đối chiếu phí, điều khoản giới thiệu và thông báo chính thức với nguồn gốc; bài viết được nghiên cứu và viết với sự hỗ trợ của AI và được rà soát trước khi đăng. Không phải cá nhân có tên, cố vấn, nhà môi giới hay đơn vị vận hành sàn.",
  // l10n: needs native review
  ur: "NexuAlpha کی داخلی ادارتی ٹیم۔ فیس، ریفرل شرائط اور سرکاری اعلانات بنیادی ماخذ سے جانچتی ہے؛ مضامین AI کی مدد سے تیار اور اشاعت سے پہلے جائزہ لیے جاتے ہیں۔ یہ کسی نامزد شخص، مشیر، بروکر یا ایکسچینج آپریٹر کی نمائندگی نہیں کرتی۔",
  // l10n: needs native review
  uk: "Внутрішня редакційна команда NexuAlpha. Перевіряє комісії, реферальні умови й офіційні оголошення за першоджерелами; статті готуються за допомогою ШІ та перевіряються перед публікацією. Це не окрема особа, консультант, брокер чи оператор біржі.",
  ar: "فريق التحرير الداخلي في NexuAlpha. يتحقق من الرسوم وشروط الإحالة والإعلانات الرسمية مقابل المصادر الأولية؛ تُبحث المقالات وتُكتب بمساعدة الذكاء الاصطناعي وتُراجع قبل النشر. ليس شخصًا مُسمّى ولا مستشارًا ولا وسيطًا ولا مشغّل منصة.",
});

export function brandLocale(locale) {
  const raw = String(locale || "en");
  if (BRAND_LOCALES.includes(raw)) return raw;
  if (raw === "zh-CN") return "zh-Hans";
  if (raw === "zh-TW" || raw === "zh-HK") return "zh-Hant";
  const base = raw.split("-")[0];
  if (base === "zh") return "zh-Hans";
  if (base === "pt") return "pt-BR";
  return BRAND_LOCALES.includes(base) ? base : "en";
}

export function localizedBrandPath(pathname, locale) {
  const code = brandLocale(locale);
  const prefix = { "zh-Hans": "zh-hans", "zh-Hant": "zh-hant", es: "es", "pt-BR": "pt-br", fr: "fr", de: "de", ja: "ja", ko: "ko", ar: "ar", tr: "tr", ru: "ru", id: "id-id", vi: "vi", it: "it",
  // l10n: needs native review
  ur: "ur",
  // l10n: needs native review
  uk: "uk-ua" }[code];
  return prefix ? `/${prefix}${pathname}` : pathname;
}

const logoImage = () => ({ "@type": "ImageObject", url: BRAND.logo.url, width: String(BRAND.logo.width), height: String(BRAND.logo.height) });

/** Compact publisher reference reused as `publisher` on every page type. */
export const NEXUALPHA_PUBLISHER = Object.freeze({
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: BRAND.name,
  url: BRAND.url,
  logo: Object.freeze(logoImage()),
});

/** Compact editorial-team reference reused as `author` / `creator` / `reviewedBy`. */
export const RESEARCH_DESK = Object.freeze({
  "@type": "Organization",
  "@id": RESEARCH_DESK_ID,
  name: RESEARCH_DESK_NAME,
  url: RESEARCH_DESK_ID,
  parentOrganization: Object.freeze({ "@type": "Organization", "@id": ORGANIZATION_ID, name: BRAND.name }),
});

export function researchDeskSchema(locale = "en") {
  const code = brandLocale(locale);
  return {
    ...RESEARCH_DESK,
    description: RESEARCH_DESK_DESCRIPTION[code] || RESEARCH_DESK_DESCRIPTION.en,
    publishingPrinciples: `${PUBLIC_ORIGIN}${EDITORIAL_POLICY_PATH}`,
    knowsAbout: [...BRAND_KNOWS_ABOUT],
  };
}

/** Full Organization node (home, /about). Same @id everywhere; `department` is the Research Desk. */
export function organizationSchema(locale = "en") {
  const code = brandLocale(locale);
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: BRAND.name,
    url: BRAND.url,
    logo: logoImage(),
    image: BRAND.image,
    // Owner 2026-10-11: slogan A (src/data/brand-slogan.js) is the Organization slogan and leads its description.
    slogan: brandSlogan(code),
    description: organizationDescription(code),
    email: BRAND.email,
    sameAs: [...BRAND_SAME_AS],
    knowsAbout: [...BRAND_KNOWS_ABOUT],
    contactPoint: [{
      "@type": "ContactPoint",
      contactType: "editorial",
      email: BRAND.email,
      url: BRAND.telegram.bot,
      availableLanguage: ["en", "zh"],
    }],
    publishingPrinciples: `${PUBLIC_ORIGIN}${EDITORIAL_POLICY_PATH}`,
    correctionsPolicy: `${PUBLIC_ORIGIN}${EDITORIAL_POLICY_PATH}#corrections`,
    actionableFeedbackPolicy: `${PUBLIC_ORIGIN}${EDITORIAL_POLICY_PATH}#corrections`,
    ownershipFundingInfo: `${PUBLIC_ORIGIN}${ABOUT_PATH}#funding`,
    department: researchDeskSchema(code),
  };
}

/** Publisher description: slogan A first, then the factual description (Organization, default WebSite description). */
export function organizationDescription(locale = "en") {
  const code = brandLocale(locale);
  return `${sloganSentence(brandSlogan(code), code)}${["zh-Hans", "zh-Hant", "ja"].includes(code) ? "" : " "}${ORGANIZATION_DESCRIPTION[code] || ORGANIZATION_DESCRIPTION.en}`;
}

export function researchDeskDescription(locale = "en") {
  return RESEARCH_DESK_DESCRIPTION[brandLocale(locale)] || RESEARCH_DESK_DESCRIPTION.en;
}

// <title> (≤ 65 chars) and meta description (≤ 160 chars; ≤ 80 for zh/ja/ko) of the two brand pages, per locale.
export const BRAND_PAGE_SEO = Object.freeze({
  [ABOUT_PATH]: Object.freeze({
    en: ["About NexuAlpha: Publisher, Funding and Research Desk", "Who publishes NexuAlpha, how the site earns from partner commissions, how fees and facts are checked, and how to reach the Research Desk on Telegram."],
    "zh-Hans": ["关于 NexuAlpha：发布方、收入来源与研究团队", "NexuAlpha 由谁发布、如何通过合作佣金获得收入、费率与事实如何核验，以及如何在 Telegram 联系研究团队。"],
    "zh-Hant": ["關於 NexuAlpha：發布方、收入來源與研究團隊", "NexuAlpha 由誰發布、如何透過合作傭金獲得收入、費率與事實如何核驗，以及如何在 Telegram 聯絡研究團隊。"],
    es: ["Acerca de NexuAlpha: editor, financiación y Research Desk", "Quién publica NexuAlpha, cómo se financia con comisiones de socios, cómo se verifican comisiones y datos, y cómo contactar al Research Desk en Telegram."],
    "pt-BR": ["Sobre a NexuAlpha: editora, financiamento e equipe de pesquisa", "Quem publica a NexuAlpha, como o site ganha com comissões de parceiros, como taxas e fatos são verificados e como falar com o Research Desk no Telegram."],
    fr: ["À propos de NexuAlpha : éditeur, financement et Research Desk", "Qui publie NexuAlpha, comment le site est financé par des commissions partenaires, comment frais et faits sont vérifiés, et comment joindre le Research Desk."],
    de: ["Über NexuAlpha: Herausgeber, Finanzierung und Research Desk", "Wer NexuAlpha herausgibt, wie die Seite über Partnerprovisionen finanziert wird, wie Gebühren und Fakten geprüft werden und wie Sie den Research Desk erreichen."],
    it: ["Chi siamo: editore, finanziamento e Research Desk di NexuAlpha", "Chi pubblica NexuAlpha, come il sito guadagna con le commissioni dei partner, come vengono verificati commissioni e dati e come contattare il Research Desk."],
    ja: ["NexuAlpha について：発行者・収益・リサーチチーム", "NexuAlpha の発行者、パートナー手数料による収益、手数料と事実の確認方法、Telegram での連絡先を説明します。"],
    ko: ["NexuAlpha 소개: 발행 주체, 수익 구조, 리서치 데스크", "NexuAlpha의 발행 주체, 파트너 수수료 기반 수익 구조, 수수료와 사실 검증 방식, Telegram 연락 방법을 안내합니다."],
    ru: ["О NexuAlpha: издатель, финансирование и Research Desk", "Кто издаёт NexuAlpha, как сайт зарабатывает на партнёрских комиссиях, как проверяются комиссии и факты и как связаться с Research Desk в Telegram."],
    tr: ["NexuAlpha Hakkında: Yayıncı, Finansman ve Research Desk", "NexuAlpha'yı kim yayımlıyor, site ortaklık komisyonlarından nasıl gelir elde ediyor, ücretler ve bilgiler nasıl doğrulanıyor, Research Desk'e nasıl ulaşılır."],
    id: ["Tentang NexuAlpha: Penerbit, Pendanaan dan Research Desk", "Siapa yang menerbitkan NexuAlpha, bagaimana situs memperoleh komisi mitra, bagaimana biaya dan fakta diverifikasi, dan cara menghubungi Research Desk."],
    vi: ["Về NexuAlpha: nhà xuất bản, nguồn thu và Research Desk", "Ai xuất bản NexuAlpha, trang kiếm tiền từ hoa hồng đối tác như thế nào, phí và dữ kiện được kiểm chứng ra sao, và cách liên hệ Research Desk qua Telegram."],
    // l10n: needs native review
    ur: ["NexuAlpha کے بارے میں: ناشر، آمدنی اور تحقیقی ٹیم", "NexuAlpha کا ناشر، پارٹنر کمیشن سے آمدنی، فیس اور حقائق کی جانچ اور Telegram پر تحقیقی ٹیم سے رابطہ۔"],
    // l10n: needs native review
    uk: ["Про NexuAlpha: видавець, фінансування й дослідницька команда", "Хто видає NexuAlpha, як сайт отримує партнерські комісії, як перевіряє комісії та факти і як зв’язатися з командою через Telegram."],
    ar: ["عن NexuAlpha: الناشر والتمويل وفريق البحث", "من ينشر NexuAlpha، وكيف يحقق الموقع دخله من عمولات الشركاء، وكيف تُراجع الرسوم والحقائق، وكيفية التواصل مع فريق البحث عبر Telegram."],
  }),
  [EDITORIAL_POLICY_PATH]: Object.freeze({
    en: ["NexuAlpha Editorial Policy: Sources, Corrections and AI Use", "How NexuAlpha sources every claim, labels lower-bound data, handles corrections and partner links, uses AI assistance and updates pages."],
    "zh-Hans": ["NexuAlpha 编辑政策：来源、更正与 AI 使用", "NexuAlpha 如何为每项结论标注来源、标记下限数据、处理更正与合作链接、使用 AI 辅助以及更新页面。"],
    "zh-Hant": ["NexuAlpha 編輯政策：來源、更正與 AI 使用", "NexuAlpha 如何為每項結論標註來源、標記下限資料、處理更正與合作連結、使用 AI 輔助以及更新頁面。"],
    es: ["Política editorial de NexuAlpha: fuentes, correcciones e IA", "Cómo NexuAlpha documenta cada afirmación, marca datos de límite inferior, gestiona correcciones y enlaces de socios, usa asistencia de IA y actualiza páginas."],
    "pt-BR": ["Política editorial da NexuAlpha: fontes, correções e IA", "Como a NexuAlpha documenta cada afirmação, marca dados de limite inferior, trata correções e links de parceiros, usa assistência de IA e atualiza páginas."],
    fr: ["Politique éditoriale NexuAlpha : sources, corrections et IA", "Comment NexuAlpha source chaque affirmation, signale les données « borne basse », traite corrections et liens partenaires, utilise l’IA et met à jour ses pages."],
    de: ["Redaktionelle Richtlinie von NexuAlpha: Quellen, Korrekturen, KI", "Wie NexuAlpha jede Aussage belegt, Untergrenzen kennzeichnet, Korrekturen und Partnerlinks handhabt, KI-Unterstützung nutzt und Seiten aktualisiert."],
    it: ["Politica editoriale NexuAlpha: fonti, correzioni e uso dell’IA", "Come NexuAlpha documenta ogni affermazione, segnala i dati di limite inferiore, gestisce correzioni e link partner, usa l’assistenza IA e aggiorna le pagine."],
    ja: ["NexuAlpha 編集ポリシー：情報源・訂正・AI の利用", "NexuAlpha が各記述に情報源を付け、下限値を明示し、訂正と提携リンクを扱い、AI 支援を使い、ページを更新する方法。"],
    ko: ["NexuAlpha 편집 정책: 출처, 수정, AI 사용", "NexuAlpha가 모든 주장에 출처를 달고, 하한값을 표시하고, 수정과 파트너 링크를 처리하고, AI 지원을 쓰고, 페이지를 갱신하는 방식."],
    ru: ["Редакционная политика NexuAlpha: источники, правки и ИИ", "Как NexuAlpha подтверждает утверждения источниками, помечает нижние границы, вносит исправления, маркирует партнёрские ссылки и применяет ИИ."],
    tr: ["NexuAlpha Editoryal Politikası: Kaynaklar, Düzeltmeler ve YZ", "NexuAlpha iddiaları nasıl kaynaklar, alt sınır verilerini işaretler, düzeltmeleri ve ortak bağlantılarını yönetir, YZ desteğini nasıl kullanır."],
    id: ["Kebijakan Editorial NexuAlpha: Sumber, Koreksi dan AI", "Cara NexuAlpha memberi sumber setiap klaim, menandai data batas bawah, menangani koreksi dan tautan mitra, memakai bantuan AI, dan memperbarui halaman."],
    vi: ["Chính sách biên tập NexuAlpha: nguồn, đính chính và AI", "Cách NexuAlpha dẫn nguồn mọi nhận định, đánh dấu dữ liệu giới hạn dưới, xử lý đính chính và liên kết đối tác, dùng hỗ trợ AI và cập nhật trang."],
    // l10n: needs native review
    ur: ["NexuAlpha کی ادارتی پالیسی: ماخذ، تصحیحات اور AI", "NexuAlpha دعووں کے ماخذ، کم از کم ڈیٹا، تصحیحات، پارٹنر لنکس، AI کی مدد اور صفحات کی تازہ کاری کو کیسے سنبھالتا ہے۔"],
    // l10n: needs native review
    uk: ["Редакційна політика NexuAlpha: джерела, виправлення й ШІ", "Як NexuAlpha підтверджує твердження джерелами, позначає нижні межі даних, обробляє виправлення й партнерські посилання, використовує ШІ та оновлює сторінки."],
    ar: ["السياسة التحريرية لـ NexuAlpha: المصادر والتصحيحات والـ AI", "كيف توثّق NexuAlpha كل ادعاء بمصدر، وتُعلّم بيانات الحد الأدنى، وتعالج التصحيحات وروابط الشركاء، وتستخدم مساعدة الذكاء الاصطناعي، وتحدّث الصفحات."],
  }),
});

export function isBrandPagePath(pathname) {
  return BRAND_PAGE_PATHS.includes(String(pathname || "").replace(/\/+$/, "") || "/");
}

export function brandPageMeta(pathname, locale = "en") {
  const table = BRAND_PAGE_SEO[pathname];
  if (!table) return null;
  const [title, description] = table[brandLocale(locale)] || table.en;
  return { title, description };
}

/** JSON-LD for /about (AboutPage whose mainEntity is the Organization) and /editorial-policy (WebPage about it). */
export function brandPageSchemas(pathname, locale = "en", { canonical } = {}) {
  const code = brandLocale(locale);
  const meta = brandPageMeta(pathname, code);
  if (!meta) return [];
  const url = canonical || `${PUBLIC_ORIGIN}${localizedBrandPath(pathname, code)}`;
  const base = {
    "@context": "https://schema.org",
    name: meta.title,
    description: meta.description,
    url,
    inLanguage: code,
    dateModified: ENTITY_REVIEWED_AT,
    isPartOf: { "@type": "WebSite", "@id": WEBSITE_ID },
    publisher: NEXUALPHA_PUBLISHER,
    isAccessibleForFree: true,
  };
  if (pathname === ABOUT_PATH) {
    return [{ ...base, "@type": "AboutPage", mainEntity: organizationSchema(code), about: { "@id": ORGANIZATION_ID } }];
  }
  return [{
    ...base,
    "@type": "WebPage",
    about: { "@type": "Organization", "@id": ORGANIZATION_ID, name: BRAND.name },
    author: RESEARCH_DESK,
    reviewedBy: RESEARCH_DESK,
    mainEntity: { "@type": "CreativeWork", name: meta.title, url, publisher: NEXUALPHA_PUBLISHER },
  }];
}

export function websiteSchema(locale = "en", { url = BRAND.url, dateModified = "2026-09-21", description } = {}) {
  const code = brandLocale(locale);
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: BRAND.name,
    url,
    inLanguage: code,
    dateModified,
    description: description || organizationDescription(code),
    publisher: { "@type": "Organization", "@id": ORGANIZATION_ID, name: BRAND.name },
  };
}
