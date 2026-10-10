import { articleSectionTargets, activateArticleSection } from "./article-section-navigation.js";
import { sectionEyebrowAttrs } from "../../../data/section-eyebrow.js";
import { splitArticleReadingSections } from "./article-reading-sections.js";
/**
 * NewsDetailPage — 实时新闻与 SEO 文章二级详情页
 * 路由：/news/:slug
 */
import React, { useEffect, useRef, useState } from "react";
import { getNewsArticleBySlug } from "../../../data/news-articles-data.js";
import { venueDatabase } from "../../../data/venue-database.js";
import { OKX_USD_USDC_OWNER_CHECKLIST, loadNewsArticleBySlug, localizedNewsSummary, localizedNewsTitle, localizedValue, newsArticleUrl, resolveNewsContentLocale } from "../../../data/news-feed-client.js";
import { newsCategoryCopy, newsLibraryCopy, relatedNewsArticles } from "../../../data/news-library.js";
import { contextualHref } from "../../../data/contextual-href.js";
import { validComparison } from "../../../data/browser-state.js";
import { injectSeoMetadata } from "../../../data/seo-injection.js";
import { BrandMark } from "../../brand/BrandMark.jsx";
import { nextDecisionBridgeCopy } from "../../../data/next-decision-bridge.js";
import { NextDecisionBridge } from "../NextDecisionBridge.jsx";
import { OnsiteTelegramBotHandoff } from "../OnsiteTelegramBotHandoff.jsx";
import { TopDecisionBox } from "../TopDecisionBox.jsx";
import { NewsVenueOffer } from "./NewsVenueOffer.jsx";
import { NewsTelegramAlerts } from "./NewsTelegramAlerts.jsx";
import "./news-detail-page.css";

const copy = {
  "zh-Hans": {
    back: "← 返回新闻与研报列表",
    author: "作者",
    published: "发布时间",
    readTime: "阅读时间",
    minuteUnit: "分钟",
    partnerSectionTitle: "文章提及的站内交易所档案",
    claimBtn: "查看站内档案",
    nextStepTitle: "读完后，继续核对平台条件",
    nextStepBody: "文章解释事实与边界；开户前仍应查看官方域名、地区资格、产品范围和当前账户条件。",
    compareBtn: "打开平台比较",
    verifiedDomain: "官方主域名已核对",
    sourcesTitle: "来源与证据",
    openFullArticle: "展开完整分析",
    closeFullArticle: "收起完整分析",
    profileSuffix: "档案",
    factbookSuffix: "资料册",
    comparePrefix: "比较",
    topicSuffix: "专题",
    methodologyLabel: "研究方法",
    relatedTitle: "相关研究",
    relatedBody: "继续查看下一步决策所需的站内资料、比较页与方法说明。",
    nextDecisionEyebrow: "下一步决策",
    firstDecisionEyebrow: "先读这里",
    firstDecisionTitle: "根据这条市场更新行动前",
    firstDecisionBody: "把本文作为已核对来源的研究起点。行动前先确认官方域名、地区资格、产品范围和账户条款。",
    firstDecisionChecks: ["先核对官方来源。", "查看平台档案和比较页。", "将商业开户注册决定与市场研究分开。"],
    sourceBodyTitle: "已核验来源语言文章",
    sourceBodyBody: "完整正文会保持在已复核的来源语言，直到人工复核译文发布。",
    notFoundTitle: "找不到相关文章",
    notFoundBody: "您请求的分析文章不存在或已下架。",
    loadingTitle: "正在加载文章…",
    loadingBody: "正在读取已核验正文与来源。",
    originalLanguageNotice: "本文正文暂以英文原文展示，翻译版本需完成来源复核后再发布。",
  },
  "zh-Hant": {
    back: "← 返回新聞與研報列表",
    author: "作者",
    published: "發布時間",
    readTime: "閱讀時間",
    minuteUnit: "分鐘",
    partnerSectionTitle: "文章提及的站內交易所檔案",
    claimBtn: "查看站內檔案",
    nextStepTitle: "閱讀後，繼續核對平台條件",
    nextStepBody: "文章解釋事實與邊界；開戶前仍應查看官方網域、地區資格、產品範圍與當前帳戶條件。",
    compareBtn: "打開平台比較",
    verifiedDomain: "官方主網域已核對",
    sourcesTitle: "來源與證據",
    openFullArticle: "展開完整分析",
    closeFullArticle: "收起完整分析",
    profileSuffix: "檔案",
    factbookSuffix: "資料冊",
    comparePrefix: "比較",
    topicSuffix: "專題",
    methodologyLabel: "研究方法",
    relatedTitle: "相關研究",
    relatedBody: "繼續查看下一步決策所需的站內資料、比較頁與方法說明。",
    nextDecisionEyebrow: "下一步決策",
    firstDecisionEyebrow: "先讀這裡",
    firstDecisionTitle: "根據這條市場更新行動前",
    firstDecisionBody: "把本文作為已核對來源的研究起點。行動前先確認官方網域、地區資格、產品範圍與帳戶條款。",
    firstDecisionChecks: ["先核對官方來源。", "查看平台檔案與比較頁。", "將商業開戶註冊決定與市場研究分開。"],
    sourceBodyTitle: "已核驗來源語言文章",
    sourceBodyBody: "完整正文會保持在已複核的來源語言，直到人工複核譯文發布。",
    notFoundTitle: "找不到相關文章",
    notFoundBody: "您請求的分析文章不存在或已下架。",
    loadingTitle: "正在載入文章…",
    loadingBody: "正在讀取已核驗正文與來源。",
    originalLanguageNotice: "本文正文暫以英文原文展示，翻譯版本需完成來源複核後再發布。",
  },
  en: {
    back: "← Back to News & Reports",
    author: "Author",
    published: "Published",
    readTime: "Read Time",
    partnerSectionTitle: "Mentioned Exchange Profiles",
    claimBtn: "View Profile",
    nextStepTitle: "Continue with a venue decision",
    nextStepBody: "This article explains facts and boundaries. Before opening an account, review the official domain, regional eligibility, product scope and current account terms.",
    compareBtn: "Open comparison",
    verifiedDomain: "Verified Domain",
    sourcesTitle: "Sources",
    openFullArticle: "Open full analysis",
    closeFullArticle: "Show less",
    relatedTitle: "Related research",
    relatedBody: "Continue with the internal profiles, comparisons and methodology that support the next decision.",
    nextDecisionEyebrow: "NEXT DECISION",
    firstDecisionEyebrow: "READ THIS FIRST",
    firstDecisionTitle: "Before you act on this market update",
    firstDecisionBody: "Use this article as a source-checked research starting point. Confirm the official domain, regional eligibility, product scope and account terms before acting.",
    firstDecisionChecks: ["Review the official sources first.", "Check the venue profile and comparison page.", "Keep commercial signup decisions separate from market research."],
    sourceBodyTitle: "Verified source-language article",
    sourceBodyBody: "The full article body below stays in the reviewed source language until a human-reviewed translation is published.",
    minuteUnit: "min",
    profileSuffix: "profile",
    factbookSuffix: "factbook",
    comparePrefix: "Compare",
    topicSuffix: "topic",
    methodologyLabel: "Research methodology",
    notFoundTitle: "Article Not Found",
    notFoundBody: "The requested research article does not exist or has been archived.",
    loadingTitle: "Loading Article…",
    loadingBody: "Reading the verified article body and sources.",
    originalLanguageNotice: "This article body is shown in its verified source language while translation is under review.",
  },
};
copy.ja = { ...copy.en, back: "← ニュースとレポートに戻る", author: "著者", published: "公開日", readTime: "読了時間", partnerSectionTitle: "記事で言及したサービス", claimBtn: "プロフィールを見る", nextStepTitle: "読後にサービス条件を確認", nextStepBody: "口座開設前に公式ドメイン、地域、商品範囲、現在の条件を確認してください。", compareBtn: "比較を開く", verifiedDomain: "公式ドメイン確認済み", sourcesTitle: "出典", openFullArticle: "全文を開く", closeFullArticle: "閉じる", notFoundTitle: "記事が見つかりません", loadingTitle: "記事を読み込み中…", originalLanguageNotice: "本文は確認済みの英語原文で表示しています。翻訳版は出典確認後に追加します。" };
Object.assign(copy.ja, { relatedTitle: "関連リサーチ", relatedBody: "次の判断に必要なプロフィール、比較、方法論を続けて確認できます。", nextDecisionEyebrow: "次の判断", firstDecisionEyebrow: "先に確認", firstDecisionTitle: "この市場アップデートで行動する前に", firstDecisionBody: "この記事は出典確認済みリサーチの入口です。行動前に公式ドメイン、地域条件、商品範囲、口座条件を確認してください。", firstDecisionChecks: ["まず公式ソースを確認する。", "サービスプロフィールと比較ページを確認する。", "市場リサーチと登録判断を分けて扱う。"], sourceBodyTitle: "確認済み原文記事", sourceBodyBody: "全文は人手レビュー済み翻訳が公開されるまで、確認済み原文で表示します。", minuteUnit: "分", profileSuffix: "プロフィール", factbookSuffix: "ファクトブック", comparePrefix: "比較", topicSuffix: "トピック", methodologyLabel: "調査方法" });
copy.ko = { ...copy.en, back: "← 뉴스 및 리포트로 돌아가기", author: "작성자", published: "게시일", readTime: "읽는 시간", partnerSectionTitle: "기사에 언급된 플랫폼", claimBtn: "프로필 보기", nextStepTitle: "읽은 후 플랫폼 조건 확인", nextStepBody: "가입 전에 공식 도메인, 지역 자격, 상품 범위와 현재 계정 조건을 확인하세요.", compareBtn: "비교 열기", verifiedDomain: "공식 도메인 확인", sourcesTitle: "출처", openFullArticle: "전체 분석 열기", closeFullArticle: "접기", relatedTitle: "관련 리서치", relatedBody: "다음 판단에 필요한 프로필, 비교 페이지와 방법론을 이어서 확인하세요.", nextDecisionEyebrow: "다음 판단", firstDecisionEyebrow: "먼저 확인", firstDecisionTitle: "이 시장 업데이트로 행동하기 전에", firstDecisionBody: "이 글은 출처 검증 리서치의 시작점입니다. 행동 전에 공식 도메인, 지역 조건, 상품 범위와 계정 조건을 확인하세요.", firstDecisionChecks: ["공식 출처를 먼저 확인합니다.", "플랫폼 프로필과 비교 페이지를 확인합니다.", "시장 리서치와 가입 판단을 분리합니다."], sourceBodyTitle: "검증된 원문 기사", sourceBodyBody: "전체 본문은 사람 검토 번역이 게시될 때까지 검증된 원문으로 표시됩니다.", minuteUnit: "분", profileSuffix: "프로필", factbookSuffix: "팩트북", comparePrefix: "비교", topicSuffix: "토픽", methodologyLabel: "리서치 방법론", notFoundTitle: "기사를 찾을 수 없습니다", loadingTitle: "기사 로드 중…", originalLanguageNotice: "본문은 검증된 영어 원문으로 표시됩니다. 번역본은 출처 검토 후 추가됩니다." };
copy.tr = { ...copy.en, back: "← Haberler ve raporlara dön", author: "Yazar", published: "Yayın tarihi", readTime: "Okuma süresi", partnerSectionTitle: "Makalede bahsedilen platformlar", claimBtn: "Profili gör", nextStepTitle: "Okuma sonrası platform koşullarını kontrol edin", nextStepBody: "Kayıt öncesi resmi alan adını, bölgesel uygunluğu, ürün kapsamını ve güncel hesap koşullarını inceleyin.", compareBtn: "Karşılaştırmayı aç", verifiedDomain: "Resmi alan adı doğrulandı", sourcesTitle: "Kaynaklar", openFullArticle: "Tam analizi aç", closeFullArticle: "Analizi kapat", relatedTitle: "İlgili araştırma", relatedBody: "Sonraki karar için profil, karşılaştırma ve yöntem sayfalarını inceleyin.", nextDecisionEyebrow: "SONRAKI KARAR", firstDecisionEyebrow: "ÖNCE BUNU OKU", firstDecisionTitle: "Bu piyasa güncellemesine göre hareket etmeden önce", firstDecisionBody: "Bu makale kaynak doğrulamalı bir araştırma başlangıcıdır. İşlemden önce resmi alan adını, bölgesel uygunluğu, ürün kapsamını ve hesap koşullarını kontrol edin.", firstDecisionChecks: ["Önce resmi kaynakları inceleyin.", "Platform profili ve karşılaştırma sayfasını kontrol edin.", "Piyasa araştırmasını kayıt kararından ayrı tutun."], sourceBodyTitle: "Doğrulanmış kaynak dilli makale", sourceBodyBody: "Tam metin, insan denetimli çeviri yayımlanana kadar doğrulanmış kaynak dilinde kalır.", minuteUnit: "dk", profileSuffix: "profili", factbookSuffix: "factbook", comparePrefix: "Karşılaştır", topicSuffix: "konusu", methodologyLabel: "Araştırma metodolojisi", notFoundTitle: "Makale bulunamadı", loadingTitle: "Makale yükleniyor…", originalLanguageNotice: "Gövde metni doğrulanmış İngilizce kaynak dilinde gösteriliyor. Çeviri kaynak incelemesinden sonra eklenecek." };
copy["pt-BR"] = { ...copy.en, back: "← Voltar para notícias e relatórios", author: "Autor", published: "Publicado", readTime: "Tempo de leitura", partnerSectionTitle: "Perfis citados no artigo", claimBtn: "Ver perfil", nextStepTitle: "Continue verificando as condições da plataforma", nextStepBody: "Antes de abrir uma conta, revise domínio oficial, elegibilidade regional, escopo de produto e termos atuais da conta.", compareBtn: "Abrir comparação", verifiedDomain: "Domínio oficial verificado", sourcesTitle: "Fontes", openFullArticle: "Abrir análise completa", closeFullArticle: "Recolher análise", relatedTitle: "Pesquisa relacionada", relatedBody: "Continue com perfis, comparações e metodologia que apoiam a próxima decisão.", nextDecisionEyebrow: "PRÓXIMA DECISÃO", firstDecisionEyebrow: "LEIA PRIMEIRO", firstDecisionTitle: "Antes de agir com base nesta atualização", firstDecisionBody: "Use este artigo como ponto de partida verificado por fontes. Confirme domínio oficial, elegibilidade regional, escopo do produto e termos da conta antes de agir.", firstDecisionChecks: ["Revise primeiro as fontes oficiais.", "Confira o perfil da plataforma e a página de comparação.", "Separe pesquisa de mercado da decisão de cadastro."], sourceBodyTitle: "Artigo no idioma fonte verificado", sourceBodyBody: "O texto completo permanece no idioma fonte verificado até a publicação de uma tradução revisada por humanos.", minuteUnit: "min", profileSuffix: "perfil", factbookSuffix: "factbook", comparePrefix: "Comparar", topicSuffix: "tópico", methodologyLabel: "Metodologia de pesquisa", originalLanguageNotice: "O corpo do artigo aparece no original em inglês verificado. A tradução será adicionada após revisão das fontes." };
copy.es = { ...copy.en, back: "← Volver a noticias e informes", author: "Autor", published: "Publicado", readTime: "Tiempo de lectura", partnerSectionTitle: "Perfiles citados en el artículo", claimBtn: "Ver perfil", nextStepTitle: "Sigue revisando las condiciones de la plataforma", nextStepBody: "Antes de abrir una cuenta, revisa dominio oficial, elegibilidad regional, alcance del producto y condiciones actuales.", compareBtn: "Abrir comparación", verifiedDomain: "Dominio oficial verificado", sourcesTitle: "Fuentes", openFullArticle: "Abrir análisis completo", closeFullArticle: "Mostrar menos", relatedTitle: "Investigación relacionada", relatedBody: "Continúa con perfiles, comparativas y metodología para apoyar la siguiente decisión.", nextDecisionEyebrow: "SIGUIENTE DECISIÓN", firstDecisionEyebrow: "LEE ESTO PRIMERO", firstDecisionTitle: "Antes de actuar con esta actualización", firstDecisionBody: "Usa este artículo como punto de partida verificado por fuentes. Confirma dominio oficial, elegibilidad regional, alcance del producto y condiciones de cuenta antes de actuar.", firstDecisionChecks: ["Revisa primero las fuentes oficiales.", "Consulta el perfil y la comparativa de la plataforma.", "Separa la investigación de mercado de la decisión de registro."], sourceBodyTitle: "Artículo en idioma fuente verificado", sourceBodyBody: "El cuerpo completo permanece en el idioma fuente verificado hasta publicar una traducción revisada por humanos.", minuteUnit: "min", profileSuffix: "perfil", factbookSuffix: "ficha", comparePrefix: "Comparar", topicSuffix: "tema", methodologyLabel: "Metodología de investigación", originalLanguageNotice: "El cuerpo del artículo se muestra en el original verificado en inglés. La traducción se añadirá tras revisar las fuentes." };
copy.fr = { ...copy.en, originalLanguageNotice: "Le corps de l'article est affiché dans sa version anglaise vérifiée. La traduction sera ajoutée après revue des sources." };
copy.de = { ...copy.en, originalLanguageNotice: "Der Artikeltext wird im geprüften englischen Original angezeigt. Die Übersetzung folgt nach der Quellenprüfung." };
copy.ru = { ...copy.en, originalLanguageNotice: "Текст статьи показан в проверенном английском оригинале. Перевод будет добавлен после проверки источников." };
copy.ar = { ...copy.en, back: "← العودة إلى الأخبار والتقارير", author: "الكاتب", published: "تاريخ النشر", readTime: "وقت القراءة", partnerSectionTitle: "ملفات المنصات المذكورة", claimBtn: "عرض الملف", nextStepTitle: "تابع فحص شروط المنصة", nextStepBody: "قبل فتح حساب، راجع النطاق الرسمي والأهلية الإقليمية ونطاق المنتج وشروط الحساب الحالية.", compareBtn: "فتح المقارنة", verifiedDomain: "تم التحقق من النطاق الرسمي", sourcesTitle: "المصادر", openFullArticle: "فتح التحليل الكامل", closeFullArticle: "إظهار أقل", relatedTitle: "أبحاث ذات صلة", relatedBody: "تابع الملفات والمقارنات والمنهجية التي تدعم القرار التالي.", nextDecisionEyebrow: "القرار التالي", firstDecisionEyebrow: "اقرأ هذا أولا", firstDecisionTitle: "قبل التصرف بناء على هذا التحديث", firstDecisionBody: "استخدم هذا المقال كنقطة بداية موثقة بالمصادر. تحقق من النطاق الرسمي والأهلية الإقليمية ونطاق المنتج وشروط الحساب قبل التصرف.", firstDecisionChecks: ["راجع المصادر الرسمية أولا.", "افحص ملف المنصة وصفحة المقارنة.", "افصل بحث السوق عن قرار التسجيل."], sourceBodyTitle: "مقال بلغة المصدر الموثقة", sourceBodyBody: "يبقى النص الكامل بلغة المصدر الموثقة إلى أن تنشر ترجمة مراجعة بشريا.", minuteUnit: "دقيقة", profileSuffix: "ملف", factbookSuffix: "سجل حقائق", comparePrefix: "قارن", topicSuffix: "موضوع", methodologyLabel: "منهجية البحث", originalLanguageNotice: "يظهر نص المقال باللغة الإنجليزية الأصلية بعد التحقق. ستُضاف الترجمة بعد مراجعة المصادر." };
copy.id = { ...copy.en, originalLanguageNotice: "Isi artikel ditampilkan dalam bahasa Inggris asli yang telah diverifikasi. Terjemahan ditambahkan setelah tinjauan sumber." };
copy.vi = { ...copy.en, originalLanguageNotice: "Nội dung bài viết đang hiển thị bằng bản gốc tiếng Anh đã xác minh. Bản dịch sẽ được thêm sau khi rà soát nguồn." };
copy.it = { ...copy.en, originalLanguageNotice: "Il corpo dell'articolo è mostrato nell'originale inglese verificato. La traduzione sarà aggiunta dopo la revisione delle fonti." };

const tableScrollHints = {
  "en": "Article table: scroll horizontally, or focus the table area and use the arrow keys.",
  "zh-Hans": "文章表格：可横向滑动，或聚焦表格区域后使用方向键。",
  "zh-Hant": "文章表格：可橫向滑動，或聚焦表格區域後使用方向鍵。",
  "ja": "記事の表：横にスクロールするか、表の領域にフォーカスして矢印キーを使ってください。",
  "ko": "기사 표: 가로로 스크롤하거나 표 영역에 초점을 맞춘 뒤 방향키를 사용하세요.",
  "es": "Tabla del artículo: desplázate horizontalmente o enfoca el área de la tabla y usa las flechas.",
  "pt-BR": "Tabela do artigo: role na horizontal ou selecione a área da tabela e use as teclas de seta.",
  "fr": "Tableau de l’article : faites défiler horizontalement ou placez le focus sur le tableau et utilisez les flèches.",
  "de": "Artikeltabelle: horizontal scrollen oder den Tabellenbereich fokussieren und die Pfeiltasten verwenden.",
  "tr": "Makale tablosu: yatay kaydırın veya tablo alanına odaklanıp ok tuşlarını kullanın.",
  "ru": "Таблица статьи: прокрутите по горизонтали или установите фокус на области таблицы и используйте клавиши со стрелками.",
  "ar": "جدول المقال: مرّر أفقيًا أو انقل التركيز إلى منطقة الجدول واستخدم مفاتيح الأسهم.",
  "id": "Tabel artikel: gulir secara horizontal atau fokuskan area tabel dan gunakan tombol panah.",
  "vi": "Bảng trong bài viết: cuộn ngang hoặc đặt tiêu điểm vào vùng bảng và dùng các phím mũi tên.",
  "it": "Tabella dell’articolo: scorri in orizzontale oppure porta il focus sull’area della tabella e usa i tasti freccia."
};
for (const [locale, tableScrollHint] of Object.entries(tableScrollHints)) {
  copy[locale].tableScrollHint = tableScrollHint;
  copy[locale].tableHintLocale = locale;
}

function humanizePathSegment(value) {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.length <= 4 ? part.toUpperCase() : `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function localizeReadTime(value, t) {
  const minutes = String(value || "").match(/\d+/)?.[0];
  return minutes ? `${minutes} ${t.minuteUnit}` : value;
}

function relatedResearchLinks(article, articles, locale, t) {
  const targets = Array.isArray(article?.seo?.internalLinkTargets) ? article.seo.internalLinkTargets : [];
  const seen = new Set();
  return targets.flatMap((target) => {
    const href = typeof target === "string" ? target.trim() : "";
    if (!href || !href.startsWith("/") || href === `/news/${article.slug}` || seen.has(href)) return [];
    seen.add(href);
    const newsSlug = href.match(/^\/news\/([a-z0-9-]+)$/)?.[1];
    const exchangeSlug = href.match(/^\/exchanges\/([a-z0-9-]+)$/)?.[1];
    const factbookSlug = href.match(/^\/factbook\/([a-z0-9-]+)$/)?.[1];
    const compareSlug = href.match(/^\/compare\/([a-z0-9-]+)$/)?.[1];
    const topicSlug = href.match(/^\/topics\/([a-z0-9-]+)$/)?.[1];
    const linkedArticle = newsSlug ? getNewsArticleBySlug(newsSlug, articles) : null;
    const label = linkedArticle
      ? localizedNewsTitle(linkedArticle, locale)
      : exchangeSlug
        ? `${venueDatabase[exchangeSlug]?.name || humanizePathSegment(exchangeSlug)} ${t.profileSuffix}`
      : factbookSlug
        ? `${venueDatabase[factbookSlug]?.name || humanizePathSegment(factbookSlug)} ${t.factbookSuffix}`
      : compareSlug
        ? `${t.comparePrefix} ${humanizePathSegment(compareSlug).replace(" VS ", " vs ")}`
      : topicSlug
        ? `${humanizePathSegment(topicSlug)} ${t.topicSuffix}`
      : href === "/methodology"
        ? t.methodologyLabel
      : humanizePathSegment(href.replace(/^\//, ""));
    return [{ href, label }];
  }).slice(0, 5);
}

const priorityNewsDecisionSummaries = {
  "bybit-vs-bitget-passkey-withdrawal-control-boundary": {
    "locales": {
      "en": {
        "eyebrow": "SOURCE-BOUND ANSWER",
        "title": "Before relying on a passkey for withdrawals",
        "body": "Bybit documents a 24-hour withdrawal restriction after passkey removal or certain security changes. Bitget documents device-held keys, official-domain binding and Google Authenticator for withdrawals, but retained sources do not establish the same hold. Before changing factors or funding either account, recheck signed-in controls; account-specific reviews and recovery timing remain unknown.",
        "actions": [
          {
            "label": "Compare Bybit vs Bitget",
            "href": "/compare/bybit-vs-bitget",
            "kind": "research"
          },
          {
            "label": "Review Bybit profile",
            "href": "/exchanges/bybit",
            "kind": "research"
          }
        ]
      },
      "zh-Hans": {
        "eyebrow": "来源边界答案",
        "title": "把 Passkey 当作提现控制前",
        "body": "Bybit 说明移除 Passkey 或部分安全变更可能触发 24 小时提现限制；Bitget 资料仅证明设备私钥、官方域名绑定和提现所需的 Google Authenticator，不能据此套用同一冷却期。更改认证因子或入金前，应核对登录后的控制；账户专项审核与恢复时间仍未知。",
        "actions": [
          {
            "label": "查看Bybit 与 Bitget 对比",
            "href": "/compare/bybit-vs-bitget",
            "kind": "research"
          },
          {
            "label": "查看 Bybit 平台档案",
            "href": "/exchanges/bybit",
            "kind": "research"
          }
        ]
      }
    }
  },
  "how-to-compare-crypto-exchange-fee-schedules-without-missing-costs": {
    "locales": {
      "en": {
        "eyebrow": "SOURCE-BOUND ANSWER",
        "title": "Before comparing exchange fee headlines",
        "body": "Official fee pages organize costs differently across products, maker/taker roles, tiers and VIP conditions. Compare the same product and order role, then add your live account tier and withdrawal route. If any input is unknown, the lowest displayed rate is not a total-cost estimate; spreads, promotions and network fees may still change.",
        "actions": [
          {
            "label": "Review OKX profile",
            "href": "/exchanges/okx",
            "kind": "research"
          },
          {
            "label": "Review Kraken profile",
            "href": "/exchanges/kraken",
            "kind": "research"
          }
        ]
      },
      "zh-Hans": {
        "eyebrow": "来源边界答案",
        "title": "比较交易所最低费率前",
        "body": "官方费率页按不同产品、挂单/吃单角色、等级和 VIP 条件组织成本。比较时应统一产品与订单角色，再加入本人实时等级和提现路径；任一输入未知，最低展示费率都不能代表总成本。价差、活动资格和网络费仍需在下单或转账前核对。",
        "actions": [
          {
            "label": "查看 OKX 平台档案",
            "href": "/exchanges/okx",
            "kind": "research"
          },
          {
            "label": "查看 Kraken 平台档案",
            "href": "/exchanges/kraken",
            "kind": "research"
          }
        ]
      }
    }
  },
  "kraken-okx-bybit-regional-availability-decision-map": {
    "locales": {
      "en": {
        "eyebrow": "SOURCE-BOUND ANSWER",
        "title": "Before assuming a venue is available in your region",
        "body": "Kraken publishes licensing or regulatory-location material, OKX publishes governing terms, and Bybit publishes restricted-country guidance. Use them to check residence, serving entity and exact product before onboarding or funding. Public pages do not prove private-account approval; identity, risk and product reviews—and later rule changes—remain account- and time-specific.",
        "actions": [
          {
            "label": "Review Kraken profile",
            "href": "/exchanges/kraken",
            "kind": "research"
          },
          {
            "label": "Review OKX profile",
            "href": "/exchanges/okx",
            "kind": "research"
          }
        ]
      },
      "zh-Hans": {
        "eyebrow": "来源边界答案",
        "title": "假设某平台在本地区可用前",
        "body": "Kraken 提供许可或监管地点资料，OKX 提供服务条款，Bybit 提供受限国家指引。开户或入金前，应核对居住地、服务实体和具体产品；公开页面不能证明私人账户已获批准。身份、风险和产品审核结果，以及后续规则变化，仍取决于账户与核验时间。",
        "actions": [
          {
            "label": "查看 Kraken 平台档案",
            "href": "/exchanges/kraken",
            "kind": "research"
          },
          {
            "label": "查看 OKX 平台档案",
            "href": "/exchanges/okx",
            "kind": "research"
          }
        ]
      }
    }
  },
  "okx-usd-to-usdc-spot-pair-migration": {
    eyebrow: "READ THIS FIRST",
    title: "Before you act on the OKX USD to USDC migration",
    body: "Treat this as an account-operations check, not a reason to move funds blindly. Confirm affected spot pairs, open orders, bots and API symbol handling before changing stablecoin routes.",
    checks: [
      "Check affected balances and spot pairs in the official notice.",
      "Review open orders, bots and API symbol rules before funding.",
      "Compare OKX against a second venue if your next step is a new account.",
    ],
    actions: [
      { label: "Open OKX profile", href: "/exchanges/okx", kind: "research" },
      { label: "Compare Binance vs OKX", href: "/compare/binance-vs-okx", kind: "research" },
      { label: "Jump to sources", href: "#article-sources", kind: "source" },
    ],
  },
  "hyperliquid-vs-dydx": {
    eyebrow: "READ THIS FIRST",
    title: "Before you choose a perpetual venue",
    body: "Separate the venue decision into collateral route, custody model, funding/liquidation mechanics and regional eligibility before connecting a wallet or moving margin.",
    checks: [
      "Compare funding, liquidation and collateral mechanics first.",
      "Review wallet, bridge and eligibility boundaries before trading.",
      "Use the side-by-side comparison before opening a new workflow.",
    ],
    actions: [
      { label: "Open Hyperliquid vs dYdX", href: "/compare/hyperliquid-vs-dydx", kind: "research" },
      { label: "Open derivatives decision guide", href: "/topics/derivatives", kind: "research" },
      { label: "Review Hyperliquid profile", href: "/exchanges/hyperliquid", kind: "research" },
      { label: "Review dYdX profile", href: "/exchanges/dydx", kind: "research" },
      { label: "Jump to sources", href: "#article-sources", kind: "source" },
    ],
  },
  "tokenized-treasuries-structure-access-risks": {
    locales: {
      en: {
        eyebrow: "SOURCE-BOUND ANSWER",
        title: "Before comparing tokenized Treasury yield",
        body: "The reviewed matrix covers five products across four product types. Use the 2026-09-15 historical evidence snapshot as a reading path, not an approval badge. Define the legal claim first: token label, issuer, recordkeeper, custodian, redemption counterparty, eligibility jurisdiction and yield basis are separate checks.",
        checks: [
          "Start with the definition and official source matrix.",
          "Separate onchain transferability from legal ownership and redemption.",
          "Use topic checklists before treating yield as comparable.",
        ],
        actions: [
          { label: "Open tokenized Treasury checklist", href: "/topics/tokenized-treasuries#treasury-evidence-checklist", kind: "research" },
          { label: "Open tokenized assets hub", href: "/topics/tokenized-assets", kind: "research" },
          { label: "Open rights and operations matrix", href: "/research/wave48-tokenized-treasury-rights-ops.json", kind: "source" },
          { label: "Compare Coinbase vs Kraken evidence", href: "/news/coinbase-vs-kraken", kind: "research" },
          { label: "Review methodology boundary", href: "/methodology#disclosure", kind: "source" },
          { label: "Jump to official sources", href: "#article-sources", kind: "source" },
        ],
      },
      "zh-Hans": {
        eyebrow: "源头核验答案",
        title: "比较代币化美债收益前",
        body: "先把 2026-09-15 历史证据快照当作阅读路径，而不是资格、批准或安全徽章。先定义法律权利：token 标签、发行方、登记方、托管方、赎回对手方、合资格地区和收益基础是不同检查项。",
        checks: [
          "先阅读定义与官方来源矩阵。",
          "把链上可转让性、法律所有权和赎回权分开看。",
          "比较收益前，先用专题清单核对证据。",
        ],
        actions: [
          { label: "打开代币化美债核对清单", href: "/topics/tokenized-treasuries#treasury-evidence-checklist", kind: "research" },
          { label: "打开代币化资产专题", href: "/topics/tokenized-assets", kind: "research" },
          { label: "打开权利与操作矩阵", href: "/research/wave48-tokenized-treasury-rights-ops.json", kind: "source" },
          { label: "查看研究方法边界", href: "/methodology#disclosure", kind: "source" },
          { label: "跳转到官方来源", href: "#article-sources", kind: "source" },
        ],
      },
    },
  },
};

function ArticleDecisionSummary({ article, withContext, locale, t }) {
  const priorityDecision = priorityNewsDecisionSummaries[article.slug];
  const fallbackCopy = copy.en;
  const localizedPriorityDecision = priorityDecision?.locales
    ? priorityDecision.locales[locale]
    : locale === "en" ? priorityDecision : null;
  const relatedVenue = article.relatedVenues?.find((slug) => typeof slug === "string" && venueDatabase[slug]?.slug === slug);
  const comparisonTarget = (Array.isArray(article.seo?.internalLinkTargets) ? article.seo.internalLinkTargets : [])
    .find((href) => {
      const match = typeof href === "string" && href.match(/^\/compare\/([a-z0-9-]+(?:-vs-[a-z0-9-]+){1,2})$/);
      return match && validComparison(match[1], Object.values(venueDatabase));
    });
  const decision = localizedPriorityDecision || {
    eyebrow: t.firstDecisionEyebrow || fallbackCopy.firstDecisionEyebrow,
    title: t.firstDecisionTitle || fallbackCopy.firstDecisionTitle,
    body: t.firstDecisionBody || fallbackCopy.firstDecisionBody,
    actions: [
      ...(relatedVenue ? [{ label: t.claimBtn || fallbackCopy.claimBtn, href: `/exchanges/${relatedVenue}`, kind: "research" }] : []),
      ...(comparisonTarget ? [{ label: t.compareBtn || fallbackCopy.compareBtn, href: comparisonTarget, kind: "research" }] : []),
    ],
  };
  if (!decision) return null;
  const internalActions = (Array.isArray(decision.actions) ? decision.actions : [])
    .filter((action) => action?.kind !== "source");
  const firstResearchAction = internalActions[0];
  const leadingResearchHref = firstResearchAction?.kind === "research" && (() => {
    const href = firstResearchAction.href;
    const venueMatch = typeof href === "string" && href.match(/^\/exchanges\/([a-z0-9-]+)$/);
    if (venueMatch) return venueDatabase[venueMatch[1]]?.slug === venueMatch[1] ? href : null;
    const compareMatch = typeof href === "string" && href.match(/^\/compare\/([a-z0-9-]+(?:-vs-[a-z0-9-]+){1,2})$/);
    return compareMatch && validComparison(compareMatch[1], Object.values(venueDatabase)) ? href : null;
  })();
  const originalSource = article.sources?.find((source) => /^https?:\/\//i.test(source?.url || ""));
  const sourceAction = originalSource
    ? { label: originalSource.publisher || t.sourcesTitle || fallbackCopy.sourcesTitle, href: originalSource.url, kind: "source" }
    : null;

  return <TopDecisionBox className="news-detail__first-decision" eyebrow={decision.eyebrow} title={decision.title} answer={decision.body} actions={internalActions} sourceAction={sourceAction} leadingResearchHref={leadingResearchHref || undefined} ctaPlacement="news-detail-first-decision" growthDecision={article.slug} withContext={withContext} />;
}

// Related research (2026-10-10): up to six articles from the same category and shared platforms (server-rendered from
// the article's related summaries), followed by the article's own internal research links.
function relatedArticleCategory(item, locale) {
  const own = item.categoryName && typeof item.categoryName === "object" ? item.categoryName[locale] : null;
  return own || newsCategoryCopy(item.category, locale)?.label || localizedValue(item.categoryName, locale) || item.category;
}

function RelatedResearch({ links, relatedArticles = [], locale, t, withContext, article }) {
  if (!links.length && !relatedArticles.length) return null;
  const title = newsLibraryCopy(locale).related;
  return (
    <aside className="news-detail__decision-box" aria-label={title}>
      <div className="news-detail__decision-copy">
        <span className="news-detail__decision-eyebrow">{t.nextDecisionEyebrow}</span>
        <h2>{title}</h2>
        <p>{t.relatedBody}</p>
      </div>
      {relatedArticles.length > 0 && (
        <ul className="news-detail__related-articles">
          {relatedArticles.map((item) => (
            <li key={item.slug}>
              <a
                className="news-detail__related-card"
                href={withContext(newsArticleUrl(item.slug, locale, item))}
                data-cta-kind="research"
                data-cta-placement="news-detail-related-article"
                data-growth-decision={item.slug}
                data-growth-placement="news-detail-related-article"
              >
                <span className="news-detail__related-meta">{relatedArticleCategory(item, locale)} · <time dateTime={item.publishedAt}>{String(item.publishedAt || "").slice(0, 10)}</time></span>
                <span className="news-detail__related-title">{localizedNewsTitle(item, locale)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {links.length > 0 && <div className="news-detail__decision-links">
        {links.map((link) => (
          <a
            key={link.href}
            href={withContext(link.href)}
            data-cta-kind="research"
            data-cta-placement="news-detail-related-research"
            data-growth-decision={article.slug}
            data-growth-placement="news-detail-related-research"
          >
            <span>{link.label}</span><span aria-hidden="true">→</span>
          </a>
        ))}
      </div>}
    </aside>
  );
}

function OwnerChecklist({ article }) {
  if (article?.slug !== OKX_USD_USDC_OWNER_CHECKLIST.slug) return null;
  const checklist = OKX_USD_USDC_OWNER_CHECKLIST;
  return (
    <aside className="news-detail__owner-checklist" aria-labelledby="okx-owner-checklist-title">
      <div className="news-detail__owner-checklist-copy">
        <span className="news-detail__owner-checklist-eyebrow">{checklist.eyebrow}</span>
        <h2 id="okx-owner-checklist-title">{checklist.title}</h2>
        <p>{checklist.summary}</p>
        <small>Reviewed source boundary: {checklist.reviewedAt}</small>
      </div>
      <ol className="news-detail__owner-checklist-items">
        {checklist.checklist.map((item) => <li key={item}>{item}</li>)}
      </ol>
      <div className="news-detail__owner-checklist-faq" aria-label="OKX migration FAQ">
        {checklist.faq.map((entry) => (
          <details key={entry.id}>
            <summary>{entry.question}</summary>
            <p>{entry.answer}</p>
          </details>
        ))}
      </div>
    </aside>
  );
}

const sectionNavigationLabels = {"en": "Jump to section", "zh-Hans": "跳转到章节", "zh-Hant": "跳轉至章節", "ja": "セクションへ移動", "ko": "섹션으로 이동", "tr": "Bölüme git", "ar": "الانتقال إلى القسم", "es": "Ir a la sección", "pt-BR": "Ir para a seção", "fr": "Aller à la section", "de": "Zum Abschnitt springen", "ru": "Перейти к разделу", "id": "Ke bagian", "vi": "Chuyển đến mục", "it": "Vai alla sezione"};

// Inline markdown in article prose: [label](https://...) links, **strong** and `code`. Only http(s) targets are
// linked; anything else stays plain text.
const INLINE_TOKEN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
function renderInline(text) {
  const value = String(text);
  if (!/\]\(http|\*\*|`/.test(value)) return value;
  const parts = [];
  let last = 0;
  for (const match of value.matchAll(INLINE_TOKEN)) {
    if (match.index > last) parts.push(value.slice(last, match.index));
    if (match[2]) parts.push(<a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer">{match[1]}</a>);
    else if (match[3]) parts.push(<strong key={match.index}>{match[3]}</strong>);
    else parts.push(<code key={match.index}>{match[4]}</code>);
    last = match.index + match[0].length;
  }
  if (last < value.length) parts.push(value.slice(last));
  return parts;
}

function renderMarkdownBlock(block, index, t) {
  if (block.startsWith("### ")) return <h3 key={index}>{block.replace(/^### /, "")}</h3>;
  if (block.startsWith("## ")) return <h2 key={index} id={`article-section-${index}`} tabIndex={-1}>{block.replace(/^## /, "")}</h2>;
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length >= 2 && lines.every((line) => line.startsWith("|"))) {
    const rows = lines
      .filter((line) => !/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line))
      .map((line) => line.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
    const [head = [], ...body] = rows;
    return (
      <div className="news-detail__table-block" key={index}>
        <p className="news-detail__table-hint" id={`news-table-hint-${index}`} lang={t.tableHintLocale} dir={t.tableHintLocale === "ar" ? "rtl" : "ltr"}>{t.tableScrollHint}</p>
        <div className="news-detail__table-scroll" role="region" aria-labelledby={`news-table-hint-${index}`} tabIndex={0}>
          <table style={{ "--news-table-columns": head.length }}>
            <thead>
              <tr>{head.map((cell) => <th key={cell} scope="col">{cell}</th>)}</tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{renderInline(cell)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  if (lines.some((line) => line.startsWith("- "))) {
    const leadLines = lines.filter((line) => !line.startsWith("- "));
    const items = lines.filter((line) => line.startsWith("- ")).map((line) => line.replace(/^- /, ""));
    return (
      <React.Fragment key={index}>
        {leadLines.length > 0 && <p>{renderInline(leadLines.join(" "))}</p>}
        {/* a list of short terms flows into columns (a 7-item glossary was a 280px-tall strip beside empty space) */}
        <ul className={items.length >= 4 && items.every((item) => item.trim().length <= 40) ? "news-detail__terms" : undefined}>
          {items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item.trim())}</li>)}
        </ul>
      </React.Fragment>
    );
  }
  return <p key={index}>{renderInline(block)}</p>;
}

export function NewsDetailPage({ slug, locale = "en", market, product, initialArticles }) {
  const isZh = locale.startsWith("zh");
  const isHant = locale === "zh-Hant" || locale === "zh-TW";
  const t = copy[locale] || copy[String(locale || "").split("-")[0]] || (isHant ? copy["zh-Hant"] : isZh ? copy["zh-Hans"] : copy.en);
  const withContext = (href) => contextualHref(href, { locale, market, product });
  const [articles, setArticles] = useState(() => initialArticles ?? []);
  const [feedState, setFeedState] = useState(() => initialArticles ? "ready" : "loading");
  // 2026-10-10 (audit finding 11): the full analysis is open by default; readers can still collapse it.
  const [showFullArticle, setShowFullArticle] = useState(true);
  const articleDisclosureRef = useRef(null);
  const articleDisclosureContextRef = useRef(null);
  const article = getNewsArticleBySlug(slug, articles);
  const hasRequestedLanguageBody = Boolean(article?.content?.[locale]);

  useEffect(() => {
    // A native summary may already have been opened while modules were loading.
    // Adopt it once. Later articles/languages get their own initial default;
    // viewport changes never override the reader's explicit disclosure choice.
    const context = `${slug}:${locale}:${hasRequestedLanguageBody}`;
    if (articleDisclosureContextRef.current === context) return;
    const retainedOpen = articleDisclosureContextRef.current === null && Boolean(articleDisclosureRef.current?.open);
    articleDisclosureContextRef.current = context;
    setShowFullArticle(retainedOpen || hasRequestedLanguageBody);
  }, [slug, locale, hasRequestedLanguageBody]);

  useEffect(() => {
    // Prerendered article data has already been fingerprint-checked by the
    // Worker. Keep that verified document stable during hydration instead of
    // letting a transient client feed failure rewrite a valid article as 404.
    if (initialArticles) return undefined;
    let alive = true;
    // Localized news lane: ask the Worker for the edition this page displays (plus English) instead of every body.
    loadNewsArticleBySlug(slug, globalThis.fetch, { locale }).then((rows) => {
      if (alive) {
        setArticles(rows);
        setFeedState("ready");
      }
    });
    return () => { alive = false; };
  }, [initialArticles, slug, locale]);

  useEffect(() => {
    if (feedState !== "ready") return;
    injectSeoMetadata(article
      ? { article, locale, force: true }
      : { route: { name: "notFound" }, locale, force: true });
  }, [article, feedState, locale]);

  useEffect(() => {
    if (!article || feedState !== "ready") return undefined;
    const onHash = () => {
      const id = window.location.hash.slice(1);
      if (!/^article-section-\d+$/.test(id) && id !== "article-sources") return;
      const target = document.getElementById(id);
      if (!target) return;
      const disclosure = articleDisclosureRef.current;
      if (disclosure?.contains(target)) { disclosure.open = true; setShowFullArticle(true); }
      // Global hash navigation already reveals and scrolls ancestors; only
      // adopt disclosure state and focus here, avoiding competing scroll work.
      window.requestAnimationFrame(() => target.focus({ preventScroll: true }));
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [article, feedState, locale]);

  if (feedState === "loading") {
    return (
      <main className="v6 v2-page v3-page news-detail-page v3-page--empty" id="top" {...sectionEyebrowAttrs(locale, "news")} aria-live="polite" aria-busy="true">
        <section className="v3-page-hero v2-shell" role="status">
          <div className="v3-venue-hero">
            <h1>{t.loadingTitle}</h1>
            <p>{t.loadingBody}</p>
          </div>
        </section>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="v6 v2-page v3-page news-detail-page v3-page--empty" id="top" {...sectionEyebrowAttrs(locale, "news")}>
        <section className="v3-page-hero v2-shell">
          <a href={withContext("/news")} className="v3-back-link">
            {t.back}
          </a>
          <div className="v3-venue-hero">
            <h1>{t.notFoundTitle}</h1>
            <p>{t.notFoundBody}</p>
          </div>
        </section>
      </main>
    );
  }

  const contentLocale = resolveNewsContentLocale(locale, article);
  const title = localizedNewsTitle(article, locale);
  const localizedSummary = localizedNewsSummary(article, locale);
  const content = localizedValue(article.content, contentLocale);
  const showsOriginalLanguage = contentLocale !== locale;
  const { leadBlocks, deepBlocks } = splitArticleReadingSections(content);
  const leadBlockCount = leadBlocks.length;
  const sectionLabel = sectionNavigationLabels[locale] || sectionNavigationLabels.en;
  const sectionTargets = articleSectionTargets([...leadBlocks, ...deepBlocks], article.sources.length > 0, leadBlockCount, t.sourcesTitle);
  const jumpToSection = (id) => {
    if (!sectionTargets.some((target) => target.id === id)) return;
    if (activateArticleSection(id, articleDisclosureRef.current, setShowFullArticle, document, window)) {
      if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
    }
  };
  const relatedLinks = relatedResearchLinks(article, articles, locale, t);
  const newsBotVenue = article.relatedVenues?.find((venueSlug) =>
    typeof venueSlug === "string" && venueDatabase[venueSlug]?.slug === venueSlug
  );

  return (
    <main className="v6 v2-page v3-page news-detail-page" id="top" {...sectionEyebrowAttrs(locale, "news")}>
      <article className="news-detail-container v2-shell">
        <nav className="news-detail__nav">
          <a href={withContext("/news")} className="news-detail__back">
            {t.back}
          </a>
        </nav>

        <header className="news-detail__header">
          <div className="news-detail__meta">
            <span className="news-detail__tag">{localizedValue(article.categoryName, locale)}</span>
            <time className="news-detail__date" dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString(locale, { timeZone: "UTC" })}</time>
            <span className="news-detail__readtime">{localizeReadTime(article.readTime, t)}</span>
          </div>

          <h1 className="news-detail__title">{title}</h1>

          <div className="news-detail__author-bar">
            <span>{t.author}: <strong>{article.author}</strong></span>
          </div>
          {showsOriginalLanguage && (
            <p className="news-detail__translation-note" role="note">
              {t.originalLanguageNotice}
            </p>
          )}
        </header>

        <div className="news-detail__rail">
          <ArticleDecisionSummary article={article} withContext={withContext} locale={locale} t={t} />
          <NewsVenueOffer venues={article.relatedVenues} locale={locale} articleSlug={article.slug} variant="rail" />
          {sectionTargets.length >= 2 && <nav className="news-detail__toc" aria-label={sectionLabel} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
            <p className="news-detail__toc-label">{sectionLabel}</p>
            <ol>
              {sectionTargets.map((target) => <li key={target.id}><button type="button" lang={target.id === "article-sources" ? locale : contentLocale} onClick={() => jumpToSection(target.id)}>{target.label}</button></li>)}
            </ol>
          </nav>}
        </div>

        {/* 文章正文 */}
        <section className="news-detail__content" lang={contentLocale} dir={contentLocale === "ar" ? "rtl" : "ltr"} data-news-content-locale={contentLocale}>
          {showsOriginalLanguage && (
            <aside className="news-detail__local-brief" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
              <span className="news-detail__local-brief-eyebrow">{t.sourceBodyTitle}</span>
              <p>{localizedSummary}</p>
              <small>{t.sourceBodyBody}</small>
            </aside>
          )}
          {sectionTargets.length >= 2 && <nav className="news-detail__section-nav" aria-label={sectionLabel} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
            <label className="news-detail__section-nav-label" htmlFor="article-section-select">{sectionLabel}</label>
            <select className="news-detail__section-select" id="article-section-select" defaultValue="" onChange={(event) => { jumpToSection(event.currentTarget.value); event.currentTarget.value = ""; }}>
              <option value="" disabled>{sectionLabel}</option>
              {sectionTargets.map((target) => <option key={target.id} value={target.id} lang={target.id === "article-sources" ? locale : contentLocale}>{target.label}</option>)}
            </select>
          </nav>}
          <div className="news-detail__prose news-detail__prose--lead">
            {leadBlocks.map((paragraph, index) => renderMarkdownBlock(paragraph, index, t))}
          </div>
          {deepBlocks.length > 0 && <details
            ref={articleDisclosureRef}
            className="news-detail__article-disclosure"
            open={showFullArticle}
            onToggle={(event) => setShowFullArticle(event.currentTarget.open)}
          >
            <summary>
              <span>{showFullArticle ? t.closeFullArticle : t.openFullArticle}</span>
              <span aria-hidden="true">{showFullArticle ? "−" : "+"}</span>
            </summary>
            <div className="news-detail__prose news-detail__prose--deep">
              {deepBlocks.map((paragraph, index) => renderMarkdownBlock(paragraph, index + leadBlockCount, t))}
            </div>
          </details>}
          <NewsTelegramAlerts locale={locale} />
          <NewsVenueOffer venues={article.relatedVenues} locale={locale} articleSlug={article.slug} variant="inline" />
          {article.sources.length > 0 && (
            <section className="news-detail__prose news-detail__sources" aria-labelledby="article-sources">
              <h2 id="article-sources" tabIndex={-1} lang={t.sourcesTitle === copy.en.sourcesTitle ? "en" : locale} dir={locale === "ar" ? "rtl" : "ltr"}>{t.sourcesTitle}</h2>
              <ul>
                {article.sources.map((source) => (
                  <li key={source.id || source.url}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      <span className="news-detail__source-meta"><span translate="no" lang="en">{source.publisher}</span>: </span><span className="news-detail__source-title">{source.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
    
        </section>
              )}
        </section>

        {(article.slug === OKX_USD_USDC_OWNER_CHECKLIST.slug || article.relatedVenues?.length > 0) && (
        <details className="news-detail__research-disclosure">
          <summary>{nextDecisionBridgeCopy(locale).title}</summary>
        <OwnerChecklist article={article} />

        {/* Mentioned exchanges stay internal; commercial handoff is handled elsewhere. */}
        {article.relatedVenues && article.relatedVenues.length > 0 && (
          <aside className="news-detail__partners-box">
            <h2 className="news-detail__partners-title">{t.partnerSectionTitle}</h2>
            <div className="news-detail__partners-grid">
              {article.relatedVenues.map((vSlug) => {
                const db = venueDatabase[vSlug] || {};

                return (
                  <a
                    key={vSlug}
                    href={withContext(`/exchanges/${encodeURIComponent(vSlug)}#registration-path`)}
                    className="news-partner-card"
                    data-cta-kind="research"
                    data-cta-platform={vSlug}
                    data-cta-placement="news-detail-venue-card"
                    data-growth-decision={vSlug}
                    data-growth-placement="news-detail-venue-card"
                  >
                    <span className="news-partner-card__brand">
                      <BrandMark slug={vSlug} compact />
                      <span className="news-partner-card__identity">
                        <strong className="news-partner-card__name" translate="no">{db.name || vSlug}</strong>
                        <span className="news-partner-card__domain">{db.officialDomain}</span>
                        <span className="news-partner-card__code-box">{t.verifiedDomain}</span>
                      </span>
                    </span>
                    <span className="news-partner-card__cta">{t.claimBtn}</span>
                  </a>
                );
              })}
            </div>
          </aside>
        )}


        </details>
        )}

        {newsBotVenue && (
          <OnsiteTelegramBotHandoff
            canonicalPath={`/news/${article.slug}`}
            intent="monitor"
            venue={newsBotVenue}
            locale={locale}
            market={market}
            product={product}
            returnRoute={`/news/${article.slug}`}
            placement={`news-onsite-bot-handoff-${article.slug}`}
          />
        )}

        <RelatedResearch links={relatedLinks} relatedArticles={relatedNewsArticles(article, articles)} locale={locale} t={t} withContext={withContext} article={article} />

        <NewsVenueOffer venues={article.relatedVenues} locale={locale} articleSlug={article.slug} variant="timed" />

        {article.relatedVenues && article.relatedVenues.length > 0 && (
          <NextDecisionBridge
            className="news-detail__next-decision-bridge"
            locale={locale}
            market={market}
            product={product}
            title={t.nextStepTitle}
            body={t.nextStepBody}
            profileSlug={article.relatedVenues[0]}
            profileLabel={venueDatabase[article.relatedVenues[0]]?.name || t.claimBtn}
            compareHref={article.seo?.internalLinkTargets?.find((href) => /^\/compare\/[a-z0-9-]+$/i.test(href))}
            compareSlugs={article.relatedVenues}
            placement="news-detail-next-decision-bridge"
            decision={article.slug}
          />
        )}
      </article>
    </main>
  );
}

export default NewsDetailPage;
