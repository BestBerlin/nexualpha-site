import { newsArticleGeoPool, newsMetadataAllowed } from "../../../data/news-geo-policy.js";
import { SourceLink } from "../../shared/SourceLink.jsx";
import { SponsoredSlot } from "../../shared/SponsoredSlot.jsx";
import { sectionEyebrowAttrs } from "../../../data/section-eyebrow.js";
import { EDITORIAL_POLICY_PATH, RESEARCH_DESK_ANCHOR, RESEARCH_DESK_NAME, brandLocale } from "../../../data/brand-entity.js";
import { localizedHref } from "../../../data/locale-routing.js";
import { dropEmptyArticleHeadings } from "../../../data/article-empty-headings.js";
import { estimateReadMinutes, formatReadTime, newsReadTimeFor } from "../../../data/news-read-time.js";
/**
 * NewsDetailPage — 实时新闻与 SEO 文章二级详情页
 * 路由：/news/:slug
 */
import React, { useEffect, useRef, useState } from "react";
import { getNewsArticleBySlug } from "../../../data/news-articles-data.js";
import { OKX_USD_USDC_OWNER_CHECKLIST, isNewsVenueSlug, loadNewsArticleBySlug, localizedNewsSummary, newsHumanReview, localizedNewsTitle, localizedValue, newsArticleUrl, newsVenueMeta, newsVenueName, resolveNewsContentLocale } from "../../../data/news-feed-client.js";
import { compareNewestFirst, isNewsCategory, newsCategoryCopy, newsLibraryCopy, newsReadingNeighbors, newsListingPath } from "../../../data/news-library.js";
import { contextualHref } from "../../../data/contextual-href.js";
import { applyNotFoundSeo, syncRouteSeo } from "../../../data/route-seo-client.js";
import { BrandMark } from "../../brand/BrandMark.jsx";
import { DeferUntilVisible } from "../../shared/DeferUntilVisible.jsx";
import { TopDecisionBox } from "../TopDecisionBox.jsx";
import { nextDecisionBridgeCopy } from "../../../data/next-decision-bridge.js";
import { NextDecisionBridge } from "../NextDecisionBridge.jsx";
import { OnsiteTelegramBotHandoff } from "../OnsiteTelegramBotHandoff.jsx";
import { neutralArticleMarkdown, neutralArticleSources } from "../../../data/neutral-article.js";
import { resolvePromotions } from "../../../data/promotions.js";
import { REFERRAL_PARTNERS } from "../../../data/referral-partners.generated.js";
import { referralTitleAllowed } from "../../../data/referral-seo.js";
import { articleClusterLineLabel, articleClusterLinks } from "../../../data/topic-clusters.js";
import { tokenizeInlineMarkdown } from "../../../data/article-inline-markdown.js";
import { DataRule, utcStamp } from "../../shared/DataRule.jsx";
import { formatSgt } from "../../../data/local-time.js";
import { ArticleMarketContext } from "./ArticleMarketContext.jsx";
import "../../../styles/news-detail-page.css";


function articleSectionTargets(blocks, hasSources, leadCount = 0, sourcesLabel = "Sources") {
  const targets = blocks.flatMap((block, index) => block.startsWith("## ")
    ? [{ id: `article-section-${index}`, label: block.replace(/^## /, ""), deep: index >= leadCount }]
    : []);
  if (hasSources) targets.push({ id: "article-sources", label: sourcesLabel, deep: false });
  return targets;
}

function activateArticleSection(id, disclosure, setOpen, documentRef, windowRef) {
  const target = documentRef.getElementById(id);
  if (!target) return false;
  if (disclosure?.contains(target)) { disclosure.open = true; setOpen(true); }
  windowRef.requestAnimationFrame(() => { target.scrollIntoView({ block: "start", behavior: "instant" }); target.focus({ preventScroll: true }); });
  return true;
}

function splitArticleReadingSections(content = "") {
  const blocks = String(content).split("\n\n").map((block) => block.trim()).filter(Boolean);
  const headings = [];
  let fence = null;
  for (const [index, block] of blocks.entries()) {
    for (const [lineIndex, line] of block.split("\n").entries()) {
      const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
      if (marker) {
        if (!fence) fence = { char: marker[1][0], length: marker[1].length };
        else if (marker[1][0] === fence.char && marker[1].length >= fence.length) fence = null;
        continue;
      }
      if (!fence && lineIndex === 0) {
        const heading = line.match(/^\s{0,3}(#{1,6})\s+\S/);
        if (heading) headings.push({ index, level: heading[1].length });
      }
    }
  }
  const sectionLevel = headings.some((h) => h.level === 2) ? 2 : Math.min(...headings.map((h) => h.level));
  const sections = headings.filter((h) => h.level === sectionLevel);
  let boundary = blocks.length;
  if (!sections.length || (sectionLevel === 1 && sections.length === 1)) {
    boundary = Math.min(1, blocks.length);
    if (blocks[0] && /^\s{0,3}#\s+[^\n]+$/.test(blocks[0]) && blocks.length > 1) boundary = 2;
    let openingFence = null;
    for (let index = 0; index < boundary; index++) {
      for (const line of blocks[index].split("\n")) {
        const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
        if (!marker) continue;
        if (!openingFence) openingFence = { char: marker[1][0], length: marker[1].length };
        else if (marker[1][0] === openingFence.char && marker[1].length >= openingFence.length) openingFence = null;
      }
      if (index === boundary - 1 && openingFence && boundary < blocks.length) boundary++;
    }
    return { leadBlocks: blocks.slice(0, boundary), deepBlocks: blocks.slice(boundary) };
  }
  if (sections.length) {
    if (sections[0].index > 0 && blocks.slice(0, sections[0].index).some((block) => !/^\s{0,3}#{1,6}\s+[^\n]+$/.test(block))) boundary = sections[0].index;
    else boundary = sections[1]?.index ?? blocks.length;
  }
  return { leadBlocks: blocks.slice(0, boundary), deepBlocks: blocks.slice(boundary) };
}

const TELEGRAM_ALERTS_URL = "https://t.me/NexuAlphaAssistantBot?start=alerts";
const ALERT_CARD_LANG = { en: "en", "zh-Hans": "zh", "zh-Hant": "zh", ru: "ru", tr: "tr", vi: "vi", id: "id", es: "es", "pt-BR": "pt" };
const TELEGRAM_ALERTS_COPY = {
  en: ["Get liquidation and sharp-move alerts in Telegram", "Open the bot"],
  "zh-Hans": ["在 Telegram 接收爆仓与急涨急跌告警", "打开机器人"],
  "zh-Hant": ["在 Telegram 接收爆倉與急漲急跌提醒", "打開機器人"],
  es: ["Recibe alertas de liquidaciones y movimientos bruscos en Telegram", "Abrir el bot"],
  "pt-BR": ["Receba alertas de liquidações e movimentos bruscos no Telegram", "Abrir o bot"],
  fr: ["Recevez les alertes de liquidations et de mouvements brusques sur Telegram", "Ouvrir le bot"],
  de: ["Liquidations- und Kurssprung-Alarme in Telegram erhalten", "Bot öffnen"],
  it: ["Ricevi su Telegram gli avvisi di liquidazioni e movimenti bruschi", "Apri il bot"],
  ja: ["清算と急変動のアラートを Telegram で受け取る", "ボットを開く"],
  ko: ["청산·급등락 알림을 텔레그램으로 받기", "봇 열기"],
  ru: ["Получайте уведомления о ликвидациях и резких движениях в Telegram", "Открыть бота"],
  tr: ["Tasfiye ve sert fiyat hareketi uyarılarını Telegram'da alın", "Botu aç"],
  id: ["Dapatkan peringatan likuidasi dan pergerakan tajam di Telegram", "Buka bot"],
  vi: ["Nhận cảnh báo thanh lý và biến động mạnh trên Telegram", "Mở bot"],
  ar: ["احصل على تنبيهات التصفية والتحركات الحادة على تيليجرام", "افتح البوت"],
  ur: ["Telegram میں لیکویڈیشن اور تیز اتار چڑھاؤ کے الرٹس حاصل کریں", "بوٹ کھولیں"],
  uk: ["Отримуйте сповіщення про ліквідації та різкі зміни в Telegram", "Відкрити бота"],
};

function telegramAlertsUrl(locale = "en") {
  const lang = ALERT_CARD_LANG[locale];
  return lang ? `${TELEGRAM_ALERTS_URL}-${lang}` : TELEGRAM_ALERTS_URL;
}

function NewsTelegramAlerts({ locale = "en" }) {
  const [text, action] = TELEGRAM_ALERTS_COPY[locale] || TELEGRAM_ALERTS_COPY.en;
  return (
    <aside className="news-tg-alerts" dir={["ar", "ur"].includes(locale) ? "rtl" : "ltr"}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 4 3 11l6 2m12-9-4 16-8-7m12-9L9 13" /></svg>
      <span>{text}</span>
      <a href={telegramAlertsUrl(locale)} target="_blank" rel="noopener" data-cta-placement="news-telegram-alerts">{action} →</a>
    </aside>
  );
}

const ARTICLE_ASSET_PATTERNS = Object.freeze([
  { symbol: "BTC", pattern: /\bBTC\b|\bbitcoin\b|比特币|比特幣|ビットコイン|비트코인|биткоин|بيتكوين/i },
  { symbol: "ETH", pattern: /\bETH\b|\bethereum\b|\bether\b|以太坊|イーサリアム|이더리움|эфириум|إيثريوم/i },
  { symbol: "SOL", pattern: /\bSOL\b|\bsolana\b|ソラナ|솔라나|солана|سولانا/i },
]);
const countAssetMatches = (text, pattern) => (String(text || "").match(new RegExp(pattern.source, "gi")) || []).length;
function detectArticleAssets({ title = "", summary = "", body = "" } = {}, limit = 2) {
  const head = `${title}\n${summary}`;
  return ARTICLE_ASSET_PATTERNS.map(({ symbol, pattern }, order) => ({ symbol, order, inHead: countAssetMatches(head, pattern), inBody: countAssetMatches(body, pattern) }))
    .filter((asset) => asset.inHead > 0 || asset.inBody >= 2)
    .sort((a, b) => (b.inHead > 0) - (a.inHead > 0) || b.inBody - a.inBody || a.order - b.order)
    .slice(0, limit)
    .map((asset) => asset.symbol);
}


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
// l10n: needs native review
copy.ur = { ...copy.en, back: "← خبروں اور رپورٹس پر واپس", author: "مصنف", published: "شائع ہوا", readTime: "مطالعہ وقت", partnerSectionTitle: "مضمون میں ذکر کردہ پروفائلز", claimBtn: "پروفائل دیکھیں", nextStepTitle: "پلیٹ فارم شرائط کی جانچ جاری رکھیں", nextStepBody: "اکاؤنٹ کھولنے سے پہلے سرکاری ڈومین، علاقائی اہلیت، پروڈکٹ دائرہ اور موجودہ اکاؤنٹ شرائط کا جائزہ لیں۔", compareBtn: "موازنہ کھولیں", verifiedDomain: "سرکاری ڈومین تصدیق شدہ", sourcesTitle: "ذرائع", openFullArticle: "مکمل تجزیہ کھولیں", closeFullArticle: "کم دکھائیں", relatedTitle: "متعلقہ تحقیق", relatedBody: "اگلے فیصلے کے لیے پروفائلز، موازنوں اور طریقہ کار کے ساتھ جاری رکھیں۔", nextDecisionEyebrow: "اگلا فیصلہ", firstDecisionEyebrow: "پہلے پڑھیں", firstDecisionTitle: "اس اپ ڈیٹ پر عمل کرنے سے پہلے", firstDecisionBody: "اس مضمون کو ذریعہ تصدیق شدہ آغاز سمجھیں۔ عمل سے پہلے سرکاری ڈومین، علاقائی اہلیت، پروڈکٹ دائرہ اور اکاؤنٹ شرائط کی تصدیق کریں۔", firstDecisionChecks: ["پہلے سرکاری ذرائع دیکھیں۔", "پلیٹ فارم پروفائل اور موازنہ صفحہ چیک کریں۔", "مارکیٹ تحقیق کو سائن اپ فیصلے سے الگ رکھیں۔"], sourceBodyTitle: "تصدیق شدہ ذریعہ زبان کا مضمون", sourceBodyBody: "مکمل متن انسانی جائزہ شدہ ترجمہ شائع ہونے تک تصدیق شدہ ذریعہ زبان میں رہتا ہے۔", minuteUnit: "منٹ", profileSuffix: "پروفائل", factbookSuffix: "فیکٹ بک", comparePrefix: "موازنہ", topicSuffix: "موضوع", methodologyLabel: "تحقیق کا طریقہ کار", originalLanguageNotice: "مضمون کا متن تصدیق شدہ انگریزی اصل میں دکھایا گیا ہے۔ ذریعہ جائزے کے بعد ترجمہ شامل کیا جائے گا." };
// l10n: needs native review
copy.uk = { ...copy.en, back: "← Назад до новин і звітів", author: "Автор", published: "Опубліковано", readTime: "Час читання", partnerSectionTitle: "Профілі, згадані у статті", claimBtn: "Переглянути профіль", nextStepTitle: "Продовжуйте перевіряти умови платформи", nextStepBody: "Перед відкриттям рахунку перегляньте офіційний домен, регіональну доступність, обсяг продуктів і поточні умови рахунку.", compareBtn: "Відкрити порівняння", verifiedDomain: "Офіційний домен перевірено", sourcesTitle: "Джерела", openFullArticle: "Відкрити повний аналіз", closeFullArticle: "Показати менше", relatedTitle: "Пов’язане дослідження", relatedBody: "Продовжуйте з профілями, порівняннями та методологією, які підтримують наступне рішення.", nextDecisionEyebrow: "Наступне рішення", firstDecisionEyebrow: "Спершу прочитайте", firstDecisionTitle: "Перед дією на основі цього оновлення", firstDecisionBody: "Використовуйте цю статтю як стартову точку з перевіреними джерелами. Перед дією підтвердьте офіційний домен, регіональну доступність, обсяг продукту та умови рахунку.", firstDecisionChecks: ["Спершу перегляньте офіційні джерела.", "Перевірте профіль платформи й сторінку порівняння.", "Відокремлюйте ринкове дослідження від рішення про реєстрацію."], sourceBodyTitle: "Стаття перевіреною мовою джерела", sourceBodyBody: "Повний текст лишається перевіреною мовою джерела до публікації перекладу, переглянутого людиною.", minuteUnit: "хв", profileSuffix: "профіль", factbookSuffix: "фактбук", comparePrefix: "Порівняти", topicSuffix: "тема", methodologyLabel: "Методологія дослідження", originalLanguageNotice: "Текст статті показано у перевіреному англійському оригіналі. Переклад буде додано після перегляду джерел." };
copy.id = { ...copy.en, originalLanguageNotice: "Isi artikel ditampilkan dalam bahasa Inggris asli yang telah diverifikasi. Terjemahan ditambahkan setelah tinjauan sumber." };
copy.vi = { ...copy.en, originalLanguageNotice: "Nội dung bài viết đang hiển thị bằng bản gốc tiếng Anh đã xác minh. Bản dịch sẽ được thêm sau khi rà soát nguồn." };
copy.it = { ...copy.en, originalLanguageNotice: "Il corpo dell'articolo è mostrato nell'originale inglese verificato. La traduzione sarà aggiunta dopo la revisione delle fonti." };

// fr/de/it/ru/id/vi article chrome and the missing not-found/loading strings (2026-10-11, ru/id/vi/ar need native review)

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

  // l10n: needs native review
  "ur": "مضمون کا جدول: افقی اسکرول کریں، یا جدول کے علاقے پر فوکس کر کے تیر والے بٹن استعمال کریں۔",

  // l10n: needs native review
  "uk": "Таблиця статті: прокрутіть горизонтально або сфокусуйте область таблиці й використовуйте клавіші зі стрілками.",
  "id": "Tabel artikel: gulir secara horizontal atau fokuskan area tabel dan gunakan tombol panah.",
  "vi": "Bảng trong bài viết: cuộn ngang hoặc đặt tiêu điểm vào vùng bảng và dùng các phím mũi tên.",
  "it": "Tabella dell’articolo: scorri in orizzontale oppure porta il focus sull’area della tabella e usa i tasti freccia."
};
for (const [locale, tableScrollHint] of Object.entries(tableScrollHints)) {
  copy[locale].tableScrollHint = tableScrollHint;
  copy[locale].tableHintLocale = locale;
}


function localizeReadTime(value, t) {
  const minutes = String(value || "").match(/\d+/)?.[0];
  return minutes ? `${minutes} ${t.minuteUnit}` : value;
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





const ARTICLE_EMBED_LINE = /^::embed[ \t]+([A-Za-z][A-Za-z0-9-]{0,31})(?:[ \t]+([A-Za-z0-9]{1,15}))?[ \t]*$/;
const ANY_EMBED_LINE = /^[ \t]*::embed\b.*$/;
const ARTICLE_EMBED_KINDS = Object.freeze({
  liquidations: Object.freeze({ height: 360, toolPath: "/liquidations", symbolParam: false }),
  "funding-rates": Object.freeze({ height: 400, toolPath: "/funding-rates", symbolParam: true }),
});
const ARTICLE_EMBED_ALIASES = Object.freeze({
  liquidations: "liquidations", liquidation: "liquidations", liqs: "liquidations",
  funding: "funding-rates", "funding-rates": "funding-rates", "funding-rate": "funding-rates", fundingrates: "funding-rates",
});
const ARTICLE_EMBED_COPY = Object.freeze({
  en: { liquidations: "Crypto liquidations today", "funding-rates": "Crypto funding rates: Binance vs OKX", live: "Live NexuAlpha data, refreshed every few minutes.", open: "Open the full page" },
  "zh-Hans": { liquidations: "今日加密货币爆仓", "funding-rates": "加密货币资金费率：Binance vs OKX", live: "NexuAlpha 实时数据，每隔几分钟刷新。", open: "打开完整页面" },
  "zh-Hant": { liquidations: "今日加密貨幣爆倉", "funding-rates": "加密貨幣資金費率：Binance vs OKX", live: "NexuAlpha 即時數據，每隔幾分鐘更新。", open: "開啟完整頁面" },
  es: { liquidations: "Liquidaciones cripto de hoy", "funding-rates": "Tasas de funding cripto: Binance vs OKX", live: "Datos en vivo de NexuAlpha, actualizados cada pocos minutos.", open: "Abrir la página completa" },
  "pt-BR": { liquidations: "Liquidações cripto de hoje", "funding-rates": "Taxas de funding cripto: Binance vs OKX", live: "Dados ao vivo da NexuAlpha, atualizados a cada poucos minutos.", open: "Abrir a página completa" },
  fr: { liquidations: "Liquidations crypto aujourd'hui", "funding-rates": "Taux de funding crypto : Binance vs OKX", live: "Données NexuAlpha en direct, actualisées toutes les quelques minutes.", open: "Ouvrir la page complète" },
  de: { liquidations: "Krypto-Liquidationen heute", "funding-rates": "Krypto-Funding-Raten: Binance vs. OKX", live: "Live-Daten von NexuAlpha, alle paar Minuten aktualisiert.", open: "Ganze Seite öffnen" },
  it: { liquidations: "Liquidazioni crypto di oggi", "funding-rates": "Tassi di funding crypto: Binance vs OKX", live: "Dati NexuAlpha in tempo reale, aggiornati ogni pochi minuti.", open: "Apri la pagina completa" },
  ja: { liquidations: "本日の暗号資産清算", "funding-rates": "暗号資産の資金調達率：Binance vs OKX", live: "NexuAlpha のライブデータ（数分ごとに更新）。", open: "ページ全体を開く" },
  ko: { liquidations: "오늘의 암호화폐 청산", "funding-rates": "암호화폐 펀딩비: 바이낸스 vs OKX", live: "NexuAlpha 실시간 데이터, 몇 분마다 갱신됩니다.", open: "전체 페이지 열기" },
  ru: { liquidations: "Ликвидации криптовалют сегодня", "funding-rates": "Ставки финансирования крипто: Binance и OKX", live: "Живые данные NexuAlpha, обновляются каждые несколько минут.", open: "Открыть полную страницу" },
  tr: { liquidations: "Bugünkü kripto tasfiyeleri", "funding-rates": "Kripto fonlama oranları: Binance vs OKX", live: "Canlı NexuAlpha verisi, birkaç dakikada bir yenilenir.", open: "Sayfanın tamamını aç" },
  id: { liquidations: "Likuidasi kripto hari ini", "funding-rates": "Funding rate kripto: Binance vs OKX", live: "Data langsung NexuAlpha, diperbarui setiap beberapa menit.", open: "Buka halaman lengkap" },
  vi: { liquidations: "Thanh lý crypto hôm nay", "funding-rates": "Funding rate crypto: Binance vs OKX", live: "Dữ liệu trực tiếp của NexuAlpha, cập nhật vài phút một lần.", open: "Mở trang đầy đủ" },
  ar: { liquidations: "تصفيات العملات الرقمية اليوم", "funding-rates": "أسعار التمويل للعملات الرقمية: Binance مقابل OKX", live: "بيانات NexuAlpha المباشرة، تُحدَّث كل بضع دقائق.", open: "افتح الصفحة الكاملة" },
  ur: { liquidations: "آج کی کرپٹو لیکویڈیشنز", "funding-rates": "کرپٹو فنڈنگ شرحیں: Binance مقابل OKX", live: "NexuAlpha کا لائیو ڈیٹا، ہر چند منٹ بعد تازہ ہوتا ہے۔", open: "مکمل صفحہ کھولیں" },
  uk: { liquidations: "Криптоліквідації сьогодні", "funding-rates": "Ставки фінансування криптодеривативів: Binance проти OKX", live: "Живі дані NexuAlpha, оновлюються кожні кілька хвилин.", open: "Відкрити повну сторінку" },
});
const ARTICLE_EMBED_LOCALE_PREFIX = Object.freeze({ en: "", "zh-Hans": "/zh-hans", "zh-Hant": "/zh-hant", es: "/es", "pt-BR": "/pt-br", fr: "/fr", de: "/de", it: "/it", ja: "/ja", ko: "/ko", ru: "/ru", tr: "/tr", id: "/id-id", vi: "/vi", ar: "/ar", ur: "/ur", uk: "/uk-ua" });
const ARTICLE_EMBED_LINK_SEPARATOR = Object.freeze({ "zh-Hans": "：", "zh-Hant": "：", ja: "：", fr: " : " });
function isArticleEmbedLine(line) { return ANY_EMBED_LINE.test(String(line ?? "")); }
function parseArticleEmbed(block) {
  const text = String(block ?? "").trim();
  if (!isArticleEmbedLine(text) || text.includes("\n")) return null;
  const match = text.match(ARTICLE_EMBED_LINE);
  const kind = match ? ARTICLE_EMBED_ALIASES[match[1].toLowerCase()] || null : null;
  if (!kind) return { kind: null, symbol: null };
  const symbol = ARTICLE_EMBED_KINDS[kind].symbolParam && match[2] ? match[2].toUpperCase() : null;
  return { kind, symbol };
}
function articleEmbedModel(directive, locale = "en") {
  const kind = directive?.kind;
  const spec = kind ? ARTICLE_EMBED_KINDS[kind] : null;
  if (!spec) return null;
  const loc = Object.hasOwn(ARTICLE_EMBED_COPY, locale) ? locale : String(locale || "").startsWith("zh") ? "zh-Hans" : "en";
  const copy = ARTICLE_EMBED_COPY[loc];
  const query = new URLSearchParams({ locale: loc, theme: "dark" });
  if (directive.symbol) query.set("symbol", directive.symbol);
  return { kind, symbol: directive.symbol || null, src: `/embed/${kind}?${query.toString()}`, height: spec.height, title: `${copy[kind]} — NexuAlpha`, caption: copy.live, toolHref: `${ARTICLE_EMBED_LOCALE_PREFIX[loc]}${spec.toolPath}`, toolLabel: copy.open, toolName: copy[kind], toolLinkText: `${copy.open}${ARTICLE_EMBED_LINK_SEPARATOR[loc] || ": "}${copy[kind]}` };
}
function stripArticleEmbedDirectives(text) {
  return String(text ?? "").split("\n").filter((line) => !isArticleEmbedLine(line)).join("\n");
}
function isolateArticleEmbedDirectives(markdown) {
  const lines = String(markdown ?? "").split("\n");
  if (!lines.some((line) => isArticleEmbedLine(line))) return String(markdown ?? "");
  const out = [];
  for (const line of lines) {
    if (isArticleEmbedLine(line)) {
      if (out.length && out[out.length - 1].trim() !== "") out.push("");
      out.push(line.trim(), "");
    } else {
      if (line.trim() === "" && out.length && out[out.length - 1] === "") continue;
      out.push(line);
    }
  }
  return out.join("\n");
}

const REGISTRATION_TUTORIAL_SLUG = /^how-to-(?:register|create|open|sign-up|onboard)-([a-z0-9]+(?:-(?:io|exchange|global))?)-(?:account|with-kyc|complete-kyc|referral-code)(?:-|$)/;
const VENUE_SIGNUP_SLUG = /^([a-z0-9]+(?:-io)?)-(?:kyc-level|referral-code)-/;
const VENUE_ALIASES = Object.freeze({ gate: "gateio", "gate-io": "gateio" });
const SIGNUP_BRIDGE_COPY = Object.freeze({
  en: { eyebrow: "Opening an account?", guide: (name) => `${name} profile: fees, products and access` },
  "zh-Hans": { eyebrow: "准备注册？", guide: (name) => `${name} 资料：手续费、产品与可用地区` },
  "zh-Hant": { eyebrow: "準備註冊？", guide: (name) => `${name} 資料：手續費、產品與可用地區` },
  es: { eyebrow: "¿Vas a abrir una cuenta?", guide: (name) => `Perfil de ${name}: comisiones, productos y acceso` },
  "pt-BR": { eyebrow: "Vai abrir conta?", guide: (name) => `Perfil da ${name}: taxas, produtos e acesso` },
  fr: { eyebrow: "Vous ouvrez un compte ?", guide: (name) => `Profil ${name} : frais, produits et accès` },
  de: { eyebrow: "Konto eröffnen?", guide: (name) => `${name} Profil: Gebühren, Produkte und Zugang` },
  it: { eyebrow: "Apri un conto?", guide: (name) => `Profilo ${name}: commissioni, prodotti e accesso` },
  ja: { eyebrow: "口座開設の前に", guide: (name) => `${name} プロフィール：手数料・商品・利用地域` },
  ko: { eyebrow: "계정을 만들 계획인가요?", guide: (name) => `${name} 프로필: 수수료, 상품, 이용 지역` },
  tr: { eyebrow: "Hesap mı açacaksınız?", guide: (name) => `${name} profili: ücretler, ürünler ve erişim` },
  id: { eyebrow: "Mau buka akun?", guide: (name) => `Profil ${name}: biaya, produk, dan akses` },
  ru: { eyebrow: null, guide: (name) => `Профиль ${name}: комиссии, продукты и доступ` },
  ar: { eyebrow: null, guide: (name) => `ملف ${name}: الرسوم والمنتجات والتوفر` },
  vi: { eyebrow: null, guide: (name) => `Hồ sơ ${name}: phí, sản phẩm và khả dụng` },
  ur: { eyebrow: null, guide: (name) => `${name} پروفائل: فیس، مصنوعات اور دستیابی` },
  uk: { eyebrow: null, guide: (name) => `Профіль ${name}: комісії, продукти та доступ` },
});
function newsSignupBridge({ articleSlug, locale = "en", hasVenue, venueName }) {
  const slug = String(articleSlug || "");
  const token = REGISTRATION_TUTORIAL_SLUG.exec(slug)?.[1] || VENUE_SIGNUP_SLUG.exec(slug)?.[1];
  const venue = VENUE_ALIASES[token] || token;
  if (!venue || !hasVenue?.(venue)) return null;
  const name = venueName?.(venue) || venue;
  const copy = SIGNUP_BRIDGE_COPY[locale] || (String(locale || "").startsWith("zh") ? SIGNUP_BRIDGE_COPY["zh-Hans"] : SIGNUP_BRIDGE_COPY.en);
  return { venue, neutral: true, eyebrow: copy.eyebrow, links: [{ kind: "profile", href: `/exchanges/${venue}`, label: copy.guide(name) }] };
}

const NEWS_PARTNER_SLUGS = Object.freeze(["binance", "okx", "bybit", "bitget", "kraken", "coinbase", "hyperliquid", "dydx", "gmx", "drift", "aevo", "uniswap", "pancakeswap", "jupiter", "raydium", "mexc", "kucoin", "gateio", "htx"]);
const CURATED_COMPARE_PAIRS = Object.freeze([
  ["binance", "okx"], ["binance", "bybit"], ["okx", "bybit"], ["binance", "mexc"], ["okx", "mexc"], ["bybit", "bitget"],
  ["hyperliquid", "dydx"], ["uniswap", "jupiter"], ["binance", "kraken"], ["gateio", "mexc"],
  ["binance", "bitget"], ["bitget", "okx"], ["bybit", "mexc"], ["bitget", "mexc"],
]);
const PARTNER_RELATED_COPY = Object.freeze({
  en: { related: "Related", feesRebate: (n) => `${n} fees & rebate`, feesProfile: (n) => `${n} fees & profile`, compare: (a, b) => `Compare ${a} vs ${b}` },
  "zh-Hans": { related: "相关", feesRebate: (n) => `${n} 手续费与返佣`, feesProfile: (n) => `${n} 手续费与平台档案`, compare: (a, b) => `对比 ${a} 与 ${b}` },
  "zh-Hant": { related: "相關", feesRebate: (n) => `${n} 手續費與返傭`, feesProfile: (n) => `${n} 手續費與平台檔案`, compare: (a, b) => `比較 ${a} 與 ${b}` },
  es: { related: "Relacionado", feesRebate: (n) => `Comisiones y reembolso de ${n}`, feesProfile: (n) => `Comisiones y perfil de ${n}`, compare: (a, b) => `Comparar ${a} y ${b}` },
  "pt-BR": { related: "Relacionado", feesRebate: (n) => `Taxas e cashback da ${n}`, feesProfile: (n) => `Taxas e perfil da ${n}`, compare: (a, b) => `Comparar ${a} e ${b}` },
  fr: { related: "À lire aussi", feesRebate: (n) => `Frais et remise ${n}`, feesProfile: (n) => `Frais et profil ${n}`, compare: (a, b) => `Comparer ${a} et ${b}` },
  de: { related: "Verwandt", feesRebate: (n) => `${n} Gebühren und Rabatt`, feesProfile: (n) => `${n} Gebühren und Profil`, compare: (a, b) => `${a} und ${b} vergleichen` },
  it: { related: "Correlati", feesRebate: (n) => `Commissioni e rimborso ${n}`, feesProfile: (n) => `Commissioni e profilo ${n}`, compare: (a, b) => `Confronta ${a} e ${b}` },
  ja: { related: "関連", feesRebate: (n) => `${n} の手数料と還元`, feesProfile: (n) => `${n} の手数料と概要`, compare: (a, b) => `${a} と ${b} を比較` },
  ko: { related: "관련", feesRebate: (n) => `${n} 수수료와 페이백`, feesProfile: (n) => `${n} 수수료와 프로필`, compare: (a, b) => `${a} vs ${b} 비교` },
  ru: { related: "См. также", feesRebate: (n) => `Комиссии и возврат ${n}`, feesProfile: (n) => `Комиссии и профиль ${n}`, compare: (a, b) => `Сравнить ${a} и ${b}` },
  tr: { related: "İlgili", feesRebate: (n) => `${n} ücretleri ve iade`, feesProfile: (n) => `${n} ücretleri ve profil`, compare: (a, b) => `${a} ile ${b} karşılaştırması` },
  id: { related: "Terkait", feesRebate: (n) => `Biaya dan rabat ${n}`, feesProfile: (n) => `Biaya dan profil ${n}`, compare: (a, b) => `Bandingkan ${a} vs ${b}` },
  vi: { related: "Liên quan", feesRebate: (n) => `Phí và hoàn phí ${n}`, feesProfile: (n) => `Phí và hồ sơ ${n}`, compare: (a, b) => `So sánh ${a} và ${b}` },
  ar: { related: "ذات صلة", feesRebate: (n) => `رسوم ${n} والاسترداد`, feesProfile: (n) => `رسوم ${n} وملف المنصة`, compare: (a, b) => `مقارنة ${a} و${b}` },
  ur: { related: "متعلقہ", feesRebate: (n) => `${n} کی فیس اور واپسی`, feesProfile: (n) => `${n} کی فیس اور تعارف`, compare: (a, b) => `${a} اور ${b} کا موازنہ` },
  uk: { related: "Пов’язане", feesRebate: (n) => `Комісії та повернення ${n}`, feesProfile: (n) => `Комісії та профіль ${n}`, compare: (a, b) => `Порівняти ${a} та ${b}` },
});
const escapePartnerPattern = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function createPartnerAutolinker({ locale = "en", createLink }) {
  const targets = NEWS_PARTNER_SLUGS.map((slug) => ({ slug, name: newsVenueName(slug), pattern: new RegExp(`(?<![A-Za-z0-9])${escapePartnerPattern(newsVenueName(slug))}(?![A-Za-z0-9])`, "i") }))
    .sort((a, b) => b.name.length - a.name.length);
  const linked = new Set();
  const mentioned = [];
  const note = (slug) => { if (!mentioned.includes(slug)) mentioned.push(slug); };
  const observe = (text) => { for (const target of targets) if (target.pattern.test(String(text))) note(target.slug); };
  const linkText = (text) => {
    const out = [];
    let rest = String(text);
    while (rest) {
      let best = null;
      for (const target of targets) {
        if (linked.has(target.slug)) { if (target.pattern.test(rest)) note(target.slug); continue; }
        const match = target.pattern.exec(rest);
        if (match && (!best || match.index < best.index)) best = { index: match.index, text: match[0], target };
      }
      if (!best) { out.push(rest); break; }
      if (best.index > 0) out.push(rest.slice(0, best.index));
      linked.add(best.target.slug);
      note(best.target.slug);
      out.push(createLink({ slug: best.target.slug, name: best.target.name, href: localizedHref(`/exchanges/${best.target.slug}`, { locale }), text: best.text }));
      rest = rest.slice(best.index + best.text.length);
    }
    return out;
  };
  return {
    linkSegments: (segments) => (Array.isArray(segments) ? segments : [segments]).flatMap((segment) => (typeof segment === "string" ? linkText(segment) : [segment])),
    observe,
    mentionedSlugs: () => [...mentioned],
    linkedSlugs: () => [...linked],
  };
}
const NEWS_REFERRAL_SLUGS = new Set(REFERRAL_PARTNERS.filter((partner) => partner?.inviteCode).map((partner) => partner.slug));
function relatedPartnerLinks({ locale = "en", slugs = [] }) {
  const t = PARTNER_RELATED_COPY[locale] || (String(locale || "").startsWith("zh") ? PARTNER_RELATED_COPY["zh-Hans"] : PARTNER_RELATED_COPY.en);
  const unique = [...new Set(slugs)].filter(isNewsVenueSlug).slice(0, 3);
  if (unique.length < 2) return null;
  const profiles = unique.map((slug) => {
    const name = newsVenueName(slug);
    const promotional = NEWS_REFERRAL_SLUGS.has(slug) && referralTitleAllowed(slug, locale);
    return { slug, name, href: localizedHref(`/exchanges/${slug}`, { locale }), label: (promotional ? t.feesRebate : t.feesProfile)(name) };
  });
  const pair = CURATED_COMPARE_PAIRS.find(([a, b]) => unique.includes(a) && unique.includes(b));
  const compare = pair ? { slug: `${pair[0]}-vs-${pair[1]}`, href: localizedHref(`/compare/${pair[0]}-vs-${pair[1]}`, { locale }), label: t.compare(newsVenueName(pair[0]), newsVenueName(pair[1])) } : null;
  return { label: t.related, profiles, compare };
}

function validNewsComparison(value) {
  const parts = String(value || "").split("-vs-").filter(Boolean);
  return parts.length >= 2 && parts.every(isNewsVenueSlug);
}

function ArticleDecisionSummary({ article, withContext, locale, t }) {
  const priorityDecision = priorityNewsDecisionSummaries[article.slug];
  const fallbackCopy = copy.en;
  const localizedPriorityDecision = priorityDecision?.locales
    ? priorityDecision.locales[locale]
    : locale === "en" ? priorityDecision : null;
  const relatedVenue = article.relatedVenues?.find((slug) => typeof slug === "string" && isNewsVenueSlug(slug));
  const comparisonTarget = (Array.isArray(article.seo?.internalLinkTargets) ? article.seo.internalLinkTargets : [])
    .find((href) => {
      const match = typeof href === "string" && href.match(/^\/compare\/([a-z0-9-]+(?:-vs-[a-z0-9-]+){1,2})$/);
      return match && validNewsComparison(match[1]);
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
    if (venueMatch) return isNewsVenueSlug(venueMatch[1]) ? href : null;
    const compareMatch = typeof href === "string" && href.match(/^\/compare\/([a-z0-9-]+(?:-vs-[a-z0-9-]+){1,2})$/);
    return compareMatch && validNewsComparison(compareMatch[1]) ? href : null;
  })();
  const originalSource = article.sources?.find((source) => /^https?:\/\//i.test(source?.url || ""));
  const sourceAction = originalSource
    ? { label: originalSource.publisher || t.sourcesTitle || fallbackCopy.sourcesTitle, href: originalSource.url, kind: "source" }
    : null;

  return <TopDecisionBox locale={locale} className="news-detail__first-decision" eyebrow={decision.eyebrow} title={decision.title} answer={decision.body} actions={internalActions} sourceAction={sourceAction} leadingResearchHref={leadingResearchHref || undefined} ctaPlacement="news-detail-first-decision" growthDecision={article.slug} withContext={withContext} />;
}

// Related research: two recent shared-entity/category articles plus 3–5 informational resource links.
// Separate chronological category links keep older research discoverable.
function relatedArticleCategory(item, locale) {
  const own = item.categoryName && typeof item.categoryName === "object" ? item.categoryName[locale] : null;
  return own || newsCategoryCopy(item.category, locale)?.label || localizedValue(item.categoryName, locale) || item.category;
}


function titleCaseSlug(value) {
  return String(value || "").split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function relatedLinkLabel(href, article, locale, t) {
  const path = String(href || "").replace(/^https?:\/\/[^/]+/i, "").split(/[?#]/)[0];
  const venue = path.match(/^\/exchanges\/([a-z0-9-]+)$/)?.[1];
  if (venue) return `${newsVenueName(venue) || titleCaseSlug(venue)} ${t.profileSuffix || "profile"}`.trim();
  const compare = path.match(/^\/compare\/([a-z0-9-]+)-vs-([a-z0-9-]+)$/)?.slice(1);
  if (compare) return `${t.comparePrefix || "Compare"} ${compare.map((slug) => newsVenueName(slug) || titleCaseSlug(slug)).join(" vs ")}`;
  const topic = path.match(/^\/topics\/([a-z0-9-]+)$/)?.[1];
  if (topic) return `${titleCaseSlug(topic)} ${t.topicSuffix || "topic"}`;
  const factbook = path.match(/^\/factbook\/([a-z0-9-]+)$/)?.[1];
  if (factbook) return `${titleCaseSlug(factbook)} ${t.factbookSuffix || "factbook"}`;
  if (path === "/methodology") return t.methodologyLabel || "Research methodology";
  if (path === "/news") return "news";
  if (path === "/exchanges") return article?.relatedVenues?.[0] ? (t.partnerSectionTitle || "Exchange profiles") : "Exchange profiles";
  if (path === "/coins") return "Coins";
  return titleCaseSlug(path.split("/").filter(Boolean).at(-1) || "news");
}

const NEWS_COIN_ENTITIES = Object.freeze([
  ["bitcoin", "Bitcoin", "BTC"],
  ["ethereum", "Ethereum", "ETH"],
  ["solana", "Solana", "SOL"],
  ["xrp", "XRP", "XRP"],
  ["bnb", "BNB", "BNB"],
  ["dogecoin", "Dogecoin", "DOGE"],
  ["usd-coin", "USDC", "USDC"],
  ["tether", "Tether", "USDT"],
]);
const NEWS_UTILITY_LABELS = Object.freeze({
  en: ["Converter", "Calendar", "Licenses"], "zh-Hans": ["兑换工具", "日历", "牌照"], "zh-Hant": ["兌換工具", "日曆", "牌照"],
  es: ["Conversor", "Calendario", "Licencias"], "pt-BR": ["Conversor", "Calendário", "Licenças"], fr: ["Convertisseur", "Calendrier", "Licences"],
  de: ["Umrechner", "Kalender", "Lizenzen"], it: ["Convertitore", "Calendario", "Licenze"], ja: ["換算ツール", "カレンダー", "ライセンス"],
  ko: ["환산 도구", "캘린더", "라이선스"], tr: ["Dönüştürücü", "Takvim", "Lisanslar"], ru: ["Конвертер", "Календарь", "Лицензии"],
  id: ["Konverter", "Kalender", "Lisensi"], vi: ["Quy đổi", "Lịch", "Giấy phép"], ar: ["المحوّل", "التقويم", "التراخيص"],
  ur: ["کنورٹر", "کیلنڈر", "لائسنس"], uk: ["Конвертер", "Календар", "Ліцензії"],
});
const NEWS_ENTITY_CACHE = new WeakMap();
const NEWS_PATTERN_CACHE = new Map();
const newsEntityValue = (value) => typeof value === "string" ? value : (value?.en || value?.["zh-Hans"] || "");
const escapeNewsEntityPattern = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function newsEntityMentions(text, name, sensitive = false) {
  const key = `${sensitive}:${name}`;
  if (!NEWS_PATTERN_CACHE.has(key)) NEWS_PATTERN_CACHE.set(key, new RegExp(`(?<![\p{L}\p{N}])${escapeNewsEntityPattern(name)}(?![\p{L}\p{N}])`, sensitive ? "u" : "iu"));
  return NEWS_PATTERN_CACHE.get(key).test(text);
}
function newsArticleEntities(article) {
  if (article && NEWS_ENTITY_CACHE.has(article)) return NEWS_ENTITY_CACHE.get(article);
  const text = [newsEntityValue(article?.title), newsEntityValue(article?.summary), newsEntityValue(article?.content), article?.seo?.primaryKeyword].join("\n");
  const explicitVenues = Array.isArray(article?.relatedVenues) ? article.relatedVenues : [];
  const venues = NEWS_PARTNER_SLUGS.filter((slug) => explicitVenues.includes(slug) || newsEntityMentions(text, newsVenueName(slug)));
  const coins = NEWS_COIN_ENTITIES.filter(([, name, symbol]) => newsEntityMentions(text, name, true) || (symbol.length >= 3 && newsEntityMentions(text, symbol, true)));
  const result = { text, venues, coins };
  if (article) NEWS_ENTITY_CACHE.set(article, result);
  return result;
}

function articleRelatedLinks(article, locale, t) {
  const { text, venues, coins } = newsArticleEntities(article);
  const utilityLabels = NEWS_UTILITY_LABELS[locale] || NEWS_UTILITY_LABELS.en;
  const links = [];
  const add = (href, label) => {
    if (!href || !String(href).startsWith("/") || links.some((link) => link.href === href)) return;
    links.push({ href, label: label || relatedLinkLabel(href, article, locale, t) });
  };
  const pair = CURATED_COMPARE_PAIRS.find(([a, b]) => venues.includes(a) && venues.includes(b));
  if (venues[0]) add(`/exchanges/${venues[0]}`);
  if (pair) add(`/compare/${pair.join("-vs-")}`);
  if (coins[0]) add(`/coins/${coins[0][0]}`, `${coins[0][1]} (${coins[0][2]})`);
  for (const link of articleClusterLinks(article, locale)) if (links.length < 5) add(link.href, link.label);
  const tools = [
    [/funding|perpetual|资金费率|資金費率/i, "/funding-rates/matrix", t.fundingMatrixLabel || "Funding matrix"],
    [/liquidat|爆仓|清算/i, "/liquidations/heatmap", t.liquidationsLabel || "Liquidations heatmap"],
    [/convert|兑换|兌換/i, coins[0] ? `/convert/${coins[0][2].toLowerCase()}-to-usd` : "/convert/btc-to-usd", utilityLabels[0]],
    [/calendar|macro|fomc|日历|日曆/i, "/calendar", utilityLabels[1]],
    [/licen[sc]|regulat|许可|監管|监管/i, "/licenses", utilityLabels[2]],
  ];
  for (const [pattern, href, label] of tools) if (pattern.test(text) && links.length < 5) add(href, label);
  for (const href of Array.isArray(article?.seo?.internalLinkTargets) ? article.seo.internalLinkTargets : []) if (links.length < 5) add(href);
  for (const slug of venues.slice(1)) if (links.length < 5) add(`/exchanges/${slug}`);
  for (const coin of coins.slice(1)) if (links.length < 5) add(`/coins/${coin[0]}`, `${coin[1]} (${coin[2]})`);
  for (const href of ["/news", "/exchanges", "/coins"]) if (links.length < 3) add(href);
  return links.slice(0, 5);
}

function recentEntityArticles(article, articles, limit = 2) {
  const own = newsArticleEntities(article);
  return (Array.isArray(articles) ? articles : [])
    .filter((candidate) => {
      if (!candidate?.slug || candidate.slug === article?.slug || (candidate.status && candidate.status !== "PUBLISHED")) return false;
      const other = newsArticleEntities(candidate);
      return own.venues.some((venue) => other.venues.includes(venue))
        || own.coins.some(([slug]) => other.coins.some(([otherSlug]) => otherSlug === slug))
        || (article?.category && article.category === candidate.category);
    })
    .sort(compareNewestFirst)
    .slice(0, limit);
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

const sectionNavigationLabels = {"en": "Jump to section", "zh-Hans": "跳转到章节", "zh-Hant": "跳轉至章節", "ja": "セクションへ移動", "ko": "섹션으로 이동", "tr": "Bölüme git", "ar": "الانتقال إلى القسم",
// l10n: needs native review
"ur": "سیکشن پر جائیں",
// l10n: needs native review
"uk": "Перейти до розділу", "es": "Ir a la sección", "pt-BR": "Ir para a seção", "fr": "Aller à la section", "de": "Zum Abschnitt springen", "ru": "Перейти к разделу", "id": "Ke bagian", "vi": "Chuyển đến mục", "it": "Vai alla sezione"};

// Inline markdown in article prose: [label](href) links, **strong**, *em* and `code`, tokenized by
// article-inline-markdown.js (shared with the Worker fallback HTML). External http(s) links open in a new tab; allowed
// internal paths (/news/, /exchanges/, /compare/, /rates, ...) are localized; any other target renders as its label.
function renderInlineTokens(tokens, keyPrefix, linker, locale = "en", market = undefined) {
  return tokens.flatMap((token, index) => {
    const key = `${keyPrefix}-${index}`;
    // Only top-level plain text can carry a partner autolink: links, code, strong and em pass through untouched.
    if (token.type === "text") return linker ? linker.linkSegments([token.text]) : [token.text];
    if (token.type === "code") return [<code key={key}>{token.text}</code>];
    if (token.type === "strong") return [<strong key={key}>{renderInlineTokens(token.children, key, null, locale, market)}</strong>];
    if (token.type === "em") return [<em key={key}>{renderInlineTokens(token.children, key, null, locale, market)}</em>];
    return [token.external
      ? <SourceLink key={key} locale={locale} market={market} href={token.href} target="_blank" rel={token.sponsored ? "nofollow sponsored noopener" : "noopener noreferrer"} src="article">{renderInlineTokens(token.children, key, null, locale, market)}</SourceLink>
      : <a key={key} href={token.href}>{renderInlineTokens(token.children, key, null, locale, market)}</a>];
  });
}

function renderInline(text, linker = null, locale = "en", market = undefined) {
  const parts = renderInlineTokens(tokenizeInlineMarkdown(text, { locale }), "md", linker, locale, market);
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
}

// A cell that is only a figure (price, percent, bps, multiple, signed change) is set in tabular figures, end-aligned.
const NUMERIC_CELL = /^[~≈<>≤≥±+\-−]?\s?[$€£¥]?\s?\d[\d,.\s]*(?:%|bps|x|×|[KMB]\b|\s?(?:USD|USDT|USDC|BTC|ETH|SOL))?(?:\s?(?:\/|–|-|to)\s?[$€£¥]?\d[\d,.]*(?:%|bps|x|×|[KMB])?)?$/i;
export function isNumericCell(cell) {
  const text = String(cell || "").replace(/\*\*|`/g, "").trim();
  return text.length > 0 && text.length <= 32 && NUMERIC_CELL.test(text);
}

// Lead answer (editorial templates 2026-10-11): the article's first H2 section is the direct answer. Its heading text is
// what the publisher wrote ("The short answer", "简短回答", "Kısa cevap", …); this list only marks it as such.
const SHORT_ANSWER_HEADING = /^(?:the\s+)?short\s+answer|^in\s+short|^简短回答|^簡短回答|^核心结论|^一句话|^短い答え|^要点|^짧은\s*답|^핵심\s*답|^kısa\s+cevap|^trả\s+lời\s+ngắn|^câu\s+trả\s+lời\s+ngắn|^краткий\s+ответ|^коротко|^коротка\s+відповідь|^коротко|^respuesta\s+corta|^en\s+resumen|^resposta\s+curta|^em\s+resumo|^réponse\s+courte|^en\s+bref|^kurze\s+antwort|^kurz\s+gesagt|^risposta\s+breve|^in\s+breve|^jawaban\s+singkat|^singkatnya|^الإجابة\s+المختصرة|^الجواب\s+المختصر|^باختصار|^مختصر\s+جواب|^خلاصہ/i;
export function isShortAnswerHeading(text) {
  return SHORT_ANSWER_HEADING.test(String(text || "").replace(/^#+\s*/, "").trim());
}

// `::embed <widget> [SYMBOL]` (D3, src/data/article-embeds.js): a live data widget in a fixed-height box (no layout
// shift), lazy-loaded, titled, with a localized caption linking to the tool page. Unknown widgets render nothing.
function ArticleEmbed({ directive, locale }) {
  const model = articleEmbedModel(directive, locale);
  if (!model) return null;
  return (
    <figure className="news-embed" data-embed-kind={model.kind}>
      <div className="news-embed__frame" style={{ height: `${model.height}px` }}>
        <iframe src={model.src} title={model.title} loading="lazy" width="100%" height={model.height} scrolling="no" referrerPolicy="strict-origin-when-cross-origin" />
      </div>
      <figcaption className="news-embed__caption"><span>{model.caption}</span> <a href={model.toolHref}>{model.toolLinkText}</a></figcaption>
    </figure>
  );
}

function renderMarkdownBlock(block, index, t, linker = null, locale = "en", market = undefined) {
  const embed = parseArticleEmbed(block);
  if (embed) return embed.kind ? <ArticleEmbed key={index} directive={embed} locale={locale} /> : null;
  // Headings count as mentions for the related line but never carry a partner link.
  if (block.startsWith("### ")) { linker?.observe(block); return <h3 key={index}>{renderInline(block.replace(/^### /, ""), null, locale, market)}</h3>; }
  if (block.startsWith("## ")) { linker?.observe(block); return <h2 key={index} id={`article-section-${index}`} tabIndex={-1}>{renderInline(block.replace(/^## /, ""), null, locale, market)}</h2>; }
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length && lines.every((line) => line.startsWith(">"))) {
    return <blockquote key={index}><p>{renderInline(lines.map((line) => line.replace(/^>\s?/, "")).join(" "), linker, locale, market)}</p></blockquote>;
  }
  if (lines.length >= 2 && lines.every((line) => line.startsWith("|"))) {
    const rows = lines
      .filter((line) => !/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line))
      .map((line) => line.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
    const [head = [], ...body] = rows;
    return (
      <div className="news-detail__table-block" key={index}>
        <p className="news-detail__table-hint" id={`news-table-hint-${index}`} lang={t.tableHintLocale} dir={["ar", "ur"].includes(t.tableHintLocale) ? "rtl" : "ltr"}>{t.tableScrollHint}</p>
        <div className="news-detail__table-scroll" role="region" aria-labelledby={`news-table-hint-${index}`} tabIndex={0}>
          <table style={{ "--news-table-columns": head.length }}>
            <thead>
              <tr>{head.map((cell) => <th key={cell} scope="col">{renderInline(cell, null, locale, market)}</th>)}</tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`} className={isNumericCell(cell) ? "is-num" : undefined}>{renderInline(cell, linker, locale, market)}</td>)}</tr>
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
        {leadLines.length > 0 && <p>{renderInline(leadLines.join(" "), linker, locale, market)}</p>}
        {/* a list of short terms flows into columns (a 7-item glossary was a 280px-tall strip beside empty space) */}
        <ul className={items.length >= 4 && items.every((item) => item.trim().length <= 40) ? "news-detail__terms" : undefined}>
          {items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item.trim(), linker, locale, market)}</li>)}
        </ul>
      </React.Fragment>
    );
  }
  return <p key={index}>{renderInline(block, linker, locale, market)}</p>;
}

// Article byline (E-E-A-T): "By NexuAlpha Research Desk · Updated <date> · Editorial policy". "Reviewed <date>" is shown
// only when the feed row carries a real human review record (humanReviewedBy + humanReviewedAt); automated articles
// never claim a review (AUDIT 2026-10-12). The author links to the Research Desk section on /about and the policy link
// to /editorial-policy; a non-desk author is shown without a link.
const BYLINE_COPY = {
  en: { by: "By", updated: "Updated", reviewed: "Reviewed", policy: "Editorial policy" },
  "zh-Hans": { by: "作者", updated: "更新于", reviewed: "复核于", policy: "编辑政策" },
  "zh-Hant": { by: "作者", updated: "更新於", reviewed: "複核於", policy: "編輯政策" },
  es: { by: "Por", updated: "Actualizado", reviewed: "Revisado", policy: "Política editorial" },
  "pt-BR": { by: "Por", updated: "Atualizado em", reviewed: "Revisado em", policy: "Política editorial" },
  fr: { by: "Par", updated: "Mis à jour le", reviewed: "Relu le", policy: "Politique éditoriale" },
  de: { by: "Von", updated: "Aktualisiert am", reviewed: "Geprüft am", policy: "Redaktionelle Richtlinie" },
  it: { by: "Di", updated: "Aggiornato il", reviewed: "Verificato il", policy: "Politica editoriale" },
  ja: { by: "著者", updated: "更新日", reviewed: "確認日", policy: "編集ポリシー" },
  ko: { by: "작성", updated: "업데이트", reviewed: "검토일", policy: "편집 정책" },
  ru: { by: "Автор", updated: "Обновлено", reviewed: "Проверено", policy: "Редакционная политика" },
  tr: { by: "Yazar", updated: "Güncellendi", reviewed: "İncelendi", policy: "Editoryal politika" },
  id: { by: "Oleh", updated: "Diperbarui", reviewed: "Ditinjau", policy: "Kebijakan editorial" },
  vi: { by: "Bởi", updated: "Cập nhật", reviewed: "Rà soát", policy: "Chính sách biên tập" },
  ar: { by: "بقلم", updated: "تم التحديث", reviewed: "تمت المراجعة", policy: "السياسة التحريرية" },
  // l10n: needs native review
  ur: { by: "از طرف", updated: "تازہ کاری", reviewed: "جائزہ", policy: "ادارتی پالیسی" },
  // l10n: needs native review
  uk: { by: "Автор", updated: "Оновлено", reviewed: "Переглянуто", policy: "Редакційна політика" },
};

export function articleBylineDate(article) {
  const review = newsHumanReview(article);
  const value = review ? review.at : article?.updatedAt || article?.publishedAt;
  const date = value && Number.isFinite(Date.parse(value)) ? new Date(value) : null;
  return date ? { kind: review ? "reviewed" : "updated", date, reviewer: review?.by || null } : null;
}

export function ArticleByline({ article, locale = "en" }) {
  const code = brandLocale(locale);
  const copy = BYLINE_COPY[code] || BYLINE_COPY.en;
  const author = String(article?.author || "").trim() || RESEARCH_DESK_NAME;
  const isDesk = author === RESEARCH_DESK_NAME;
  const stamp = articleBylineDate(article);
  return (
    <div className="news-detail__author-bar news-detail__byline" data-testid="article-byline">
      <span className="news-detail__byline-author">
        {copy.by} {isDesk
          ? <a href={localizedHref(RESEARCH_DESK_ANCHOR, { locale: code })} rel="author"><strong>{author}</strong></a>
          : <strong>{author}</strong>}
      </span>
      {stamp ? <>
        <span aria-hidden="true"> · </span>
        <span className={`news-detail__byline-${stamp.kind}`}>{copy[stamp.kind]} <time dateTime={stamp.date.toISOString().slice(0, 10)}>{stamp.date.toLocaleDateString(code, { timeZone: "UTC" })}</time></span>
      </> : null}
      <span aria-hidden="true"> · </span>
      <a className="news-detail__byline-policy" href={localizedHref(EDITORIAL_POLICY_PATH, { locale: code })}>{copy.policy}</a>
    </div>
  );
}

export function NewsDetailPage({ slug, locale = "en", market, product, initialArticles, glossaryLinks = null }) {
  const isZh = locale.startsWith("zh");
  const isHant = locale === "zh-Hant" || locale === "zh-TW";
  const t = copy[locale] || copy[String(locale || "").split("-")[0]] || (isHant ? copy["zh-Hant"] : isZh ? copy["zh-Hans"] : copy.en);
  const withContext = (href) => contextualHref(href, { locale, market, product });
  const [articles, setArticles] = useState(() => initialArticles ?? []);
  const [feedState, setFeedState] = useState(() => initialArticles ? "ready" : "loading");
  // 2026-10-10 (audit finding 11): the full analysis is open by default; readers can still collapse it.
  const [showFullArticle, setShowFullArticle] = useState(true);
  const articleDisclosureRef = useRef(null);
  // Scroll-spy for the desktop section index; null on the server and the first client render (no hydration drift).
  const [activeSection, setActiveSection] = useState(null);
  const articleDisclosureContextRef = useRef(null);
  const visibleArticles = newsArticleGeoPool(articles, { locale, market }, slug);
  const article = getNewsArticleBySlug(slug, visibleArticles);
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
    // The Worker rendered this article's head (title, canonical, hreflang, JSON-LD); keep it on first load and refetch
    // only after a client-side route or locale change (route-seo-client). An article the feed no longer has gets the
    // component-level 404 head (robots noindex) without a round trip.
    if (!article) { applyNotFoundSeo({ locale }); return; }
    syncRouteSeo({ pathname: window.location.pathname, search: window.location.search, locale });
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

  useEffect(() => {
    if (!article || feedState !== "ready" || typeof IntersectionObserver !== "function") return undefined;
    const targets = [...document.querySelectorAll('.news-detail__content [id^="article-section-"], #article-sources')];
    if (!targets.length) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveSection(visible[0].target.id);
    }, { rootMargin: "-88px 0px -66% 0px", threshold: 0 });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
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
  // Neutral locales (locale-policy.js): sign-up sentences, codes and the partner-feed source are removed at render time.
  const localizedSummary = neutralArticleMarkdown(localizedNewsSummary(article, locale), locale);
  const content = neutralArticleMarkdown(localizedValue(article.content, contentLocale), locale);
  const articleSources = neutralArticleSources(article.sources, locale) || [];
  const showsOriginalLanguage = contentLocale !== locale;
  const { leadBlocks, deepBlocks } = splitArticleReadingSections(dropEmptyArticleHeadings(isolateArticleEmbedDirectives(content)));
  const leadBlockCount = leadBlocks.length;
  // Owner 2026-10-10: first plain-text mention of each partner exchange links to its profile; the state lives for one
  // render, so server and client output stay identical.
  const exchangeLinker = createPartnerAutolinker({
    locale,
    createLink: ({ slug, href, text }) => (
      <a key={`partner-${slug}`} href={withContext(href)} className="news-detail__partner-link" data-partner-link={slug} data-cta-kind="research" data-cta-placement="news-detail-partner-mention">{text}</a>
    ),
  });
  const partnerLinker = exchangeLinker;
  // The first H2 section is the lead answer: its heading becomes the section's data rule (same id, same TOC target).
  const leadHeading = leadBlocks[0]?.startsWith("## ") ? leadBlocks[0] : null;
  if (leadHeading) partnerLinker.observe(leadHeading);
  const leadKind = leadHeading ? (isShortAnswerHeading(leadHeading) ? "short-answer" : "lead") : null;
  const leadNodes = leadBlocks.map((paragraph, index) => (index === 0 && leadHeading) ? null : renderMarkdownBlock(paragraph, index, t, partnerLinker, locale, market));
  const publishedStamp = utcStamp(article.publishedAt);
  const publishedDate = formatSgt(article.publishedAt, locale, "date");
  const marketAssets = detectArticleAssets({ title: `${title}\n${localizedNewsTitle(article, "en")}`, summary: `${localizedSummary}\n${localizedNewsSummary(article, "en")}`, body: stripArticleEmbedDirectives(content) });
  const categoryLabel = localizedValue(article.categoryName, locale);
  const categoryHref = isNewsCategory(article.category) ? withContext(newsListingPath({ category: article.category })) : null;
  const promotions = resolvePromotions({ topicTags: [...(article.topicTags || article.tags || []), article.cta?.topic].filter(Boolean), venue: article.cta?.venue || article.relatedVenues, coin: article.cta?.coin, locale, market });
  const inlineIndex = Math.ceil((leadBlocks.length + deepBlocks.length) / 3);
  const inlineSlot = promotions.some(p => p.kind !== "tool") ? <SponsoredSlot promotions={promotions} variant="inline" locale={locale} market={market} /> : null;
  const deepNodes = deepBlocks.map((paragraph, index) => renderMarkdownBlock(paragraph, index + leadBlockCount, t, partnerLinker, locale, market));
  if (inlineSlot) {
    if (inlineIndex <= leadBlockCount) leadNodes.splice(inlineIndex, 0, <React.Fragment key="promotion-inline">{inlineSlot}</React.Fragment>);
    else deepNodes.splice(inlineIndex - leadBlockCount, 0, <React.Fragment key="promotion-inline">{inlineSlot}</React.Fragment>);
  }
  const relatedPartners = relatedPartnerLinks({ locale, slugs: partnerLinker.mentionedSlugs().filter(slug => newsMetadataAllowed(slug, { locale, market })) });
  // Topic hubs & tools (links-l10n lane 2026-10-11, scorecard C5/D4): the main page of every query family this article
  // belongs to and the data tools on its subject, from the mapping in src/data/topic-clusters.js.
  const clusterLinks = articleClusterLinks(article, locale).filter(link => newsMetadataAllowed(link, { locale, market }));
  // CTR pass 2026-10-13: registration tutorials open with the exchange profile (and app page) built for that search
  // intent; an article that splits a query with a stronger article links to the query owner. See news-lead-links.js.
  const signupBridge = newsSignupBridge({ articleSlug: article.slug, locale, hasVenue: isNewsVenueSlug, venueName: newsVenueName });
  const queryOwner = null;
  const sectionLabel = sectionNavigationLabels[locale] || sectionNavigationLabels.en;
  const sectionTargets = articleSectionTargets([...leadBlocks, ...deepBlocks], articleSources.length > 0, leadBlockCount, t.sourcesTitle);
  const jumpToSection = (id) => {
    if (!sectionTargets.some((target) => target.id === id)) return;
    if (activateArticleSection(id, articleDisclosureRef.current, setShowFullArticle, document, window)) {
      if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
    }
  };
  const relatedLinks = articleRelatedLinks(article, locale, t).filter(link => newsMetadataAllowed(link, { locale, market }));
  const newsBotVenue = article.relatedVenues?.find((venueSlug) => typeof venueSlug === "string" && newsVenueName(venueSlug));

  return (
    <main className="v6 v2-page v3-page news-detail-page" id="top" {...sectionEyebrowAttrs(locale, "news")}>
      <article className="news-detail-container v2-shell">
        <nav className="news-detail__nav">
          <a href={withContext("/news")} className="news-detail__back">
            {t.back}
          </a>
        </nav>

        <header className="news-detail__header">
          <p className="news-detail__category">
            {categoryHref
              ? <a className="news-detail__tag" href={categoryHref} data-cta-kind="research" data-cta-placement="news-detail-category">{categoryLabel}</a>
              : <span className="news-detail__tag">{categoryLabel}</span>}
          </p>

          <h1 className="news-detail__title">{title}</h1>

          <div className="news-detail__metaline">
            <ArticleByline article={article} locale={locale} />
            <div className="news-detail__meta">
              <time className="news-detail__date" dateTime={article.publishedAt}>{publishedDate}{publishedStamp ? <span className="news-detail__clock"> {publishedStamp.slice(13)}</span> : null}</time>
              <span className="news-detail__readtime">{localizeReadTime(content ? formatReadTime(estimateReadMinutes(content, contentLocale)) : newsReadTimeFor(article, contentLocale), t)}</span>
            </div>
          </div>
          {showsOriginalLanguage && (
            <p className="news-detail__translation-note" role="note">
              {t.originalLanguageNotice}
            </p>
          )}
        </header>

        {/* 文章正文 */}
        <section className="news-detail__content" lang={contentLocale} dir={["ar", "ur"].includes(contentLocale) ? "rtl" : "ltr"} data-news-content-locale={contentLocale}>
          {(signupBridge || queryOwner) && (
            <nav className={`news-detail__lead-links${signupBridge && !signupBridge.neutral ? " news-detail__lead-links--signup" : ""}`} aria-label={signupBridge?.eyebrow || queryOwner?.label} lang={locale} dir={["ar", "ur"].includes(locale) ? "rtl" : "ltr"} data-news-lead-links="">
              {signupBridge?.links.map((link) => (
                <a key={link.kind} href={withContext(link.href)} data-lead-link={link.kind} data-cta-kind="research" data-cta-platform={signupBridge.venue} data-cta-placement={`news-detail-lead-${link.kind}`}>{link.label} <span aria-hidden="true">→</span></a>
              ))}
              {queryOwner && <a href={withContext(queryOwner.href)} data-lead-link="query-owner" data-cta-kind="research" data-cta-placement="news-detail-lead-query-owner">{queryOwner.label} <span aria-hidden="true">→</span></a>}
            </nav>
          )}
          {showsOriginalLanguage && (
            <aside className="news-detail__local-brief" lang={locale} dir={["ar", "ur"].includes(locale) ? "rtl" : "ltr"}>
              <span className="news-detail__local-brief-eyebrow">{t.sourceBodyTitle}</span>
              <p>{localizedSummary}</p>
              <small>{t.sourceBodyBody}</small>
            </aside>
          )}
          {/* below 1024px the section index is a collapsed disclosure; desktop uses the sticky rail index */}
          {sectionTargets.length >= 2 && <nav className="news-detail__section-nav" aria-label={sectionLabel} lang={locale} dir={["ar", "ur"].includes(locale) ? "rtl" : "ltr"}>
            <details className="news-detail__section-disclosure">
              <summary><span>{sectionLabel}</span><span className="news-detail__section-count">{String(sectionTargets.length).padStart(2, "0")}</span></summary>
              <ol>
                {sectionTargets.map((target) => <li key={target.id}><a href={`#${target.id}`} lang={target.id === "article-sources" ? locale : contentLocale} onClick={(event) => { event.preventDefault(); const disclosure = event.currentTarget.closest("details"); if (disclosure) disclosure.open = false; jumpToSection(target.id); }}>{target.label}</a></li>)}
              </ol>
            </details>
          </nav>}
          <div className={`news-detail__prose news-detail__prose--lead${leadHeading ? " news-detail__answer" : ""}`} data-lead-kind={leadKind || undefined}>
            {leadHeading && <DataRule
              as="h2"
              className="news-detail__answer-rule"
              label={renderInline(leadHeading.replace(/^## /, ""), null, locale)}
              labelId="article-section-0"
              labelProps={{ tabIndex: -1 }}
              stamp={publishedStamp ? <><span className="nx-rule__date">{publishedStamp.slice(0, 13)}</span>{publishedStamp.slice(13)}</> : null}
              dateTime={article.publishedAt}
            />}
            {leadNodes}
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
              {deepNodes}
            </div>
          </details>}
          {relatedPartners && (
            <p className="news-detail__related-partners" lang={locale} dir={["ar", "ur"].includes(locale) ? "rtl" : "ltr"} data-news-related-partners="">
              <span className="news-detail__related-partners-label">{relatedPartners.label}:</span>
              {relatedPartners.profiles.map((profile, index) => (
                <React.Fragment key={profile.slug}>
                  {index > 0 && <span aria-hidden="true"> · </span>}
                  <a href={withContext(profile.href)} data-related-partner={profile.slug} data-cta-kind="research" data-cta-placement="news-detail-related-partners">{profile.label}</a>
                </React.Fragment>
              ))}
              {relatedPartners.compare && (
                <>
                  <span aria-hidden="true"> · </span>
                  <a href={withContext(relatedPartners.compare.href)} data-related-compare={relatedPartners.compare.slug} data-cta-kind="research" data-cta-placement="news-detail-related-partners">{relatedPartners.compare.label}</a>
                </>
              )}
            </p>
          )}
          {clusterLinks.length > 0 && (
            <p className="news-detail__cluster-links" lang={locale} dir={["ar", "ur"].includes(locale) ? "rtl" : "ltr"} data-news-cluster-links="">
              <span className="news-detail__cluster-links-label">{articleClusterLineLabel(locale)}:</span>
              {clusterLinks.map((link, index) => (
                <React.Fragment key={link.id}>
                  {index > 0 && <span aria-hidden="true"> · </span>}
                  <a href={withContext(link.href)} data-cluster-link={link.id} data-cta-kind="research" data-cta-placement="news-detail-cluster-links">{link.label}</a>
                </React.Fragment>
              ))}
            </p>
          )}
          <NewsTelegramAlerts locale={locale} />
          <SponsoredSlot promotions={promotions} locale={locale} market={market} variant="end" />
          {articleSources.length > 0 && (
            <section className="news-detail__prose news-detail__sources news-detail__footnotes" aria-labelledby="article-sources">
              <DataRule
                as="h2"
                label={t.sourcesTitle}
                labelId="article-sources"
                labelProps={{ tabIndex: -1, lang: t.sourcesTitle === copy.en.sourcesTitle ? "en" : locale, dir: ["ar", "ur"].includes(locale) ? "rtl" : "ltr" }}
                stamp={String(articleSources.length).padStart(2, "0")}
              />
              <ol className="news-detail__footnote-list">
                {articleSources.map((source, index) => {
                  const sourceDate = utcStamp(source.publishedAt, { time: false });
                  return (
                    <li key={source.id || source.url} id={`article-source-${index + 1}`}>
                      <span className="news-detail__footnote-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                      <SourceLink locale={locale} href={source.url} target="_blank" rel="noopener noreferrer">
                        <span className="news-detail__source-meta"><span translate="no" lang="en">{source.publisher}</span>{sourceDate ? <time dateTime={sourceDate}>{sourceDate}</time> : null}</span>
                        <span className="news-detail__source-title">{source.title}</span>
                      </SourceLink>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </section>

        {/* Rail after the body in the document (audit 2026-10-11 #5): the article's lead answer ("The short answer") is the
            first content after the H1 and byline for crawlers, answer engines and screen readers. The rail keeps its place
            on screen: desktop pins it to the second grid column, below 1024px CSS order puts it after the lead section. */}
        <div className="news-detail__rail">
          <ArticleDecisionSummary article={article} withContext={withContext} locale={locale} t={t} />
          <div className="news-detail__rail-sticky">
            {sectionTargets.length >= 2 && <nav className="news-detail__toc" aria-label={sectionLabel} lang={locale} dir={["ar", "ur"].includes(locale) ? "rtl" : "ltr"}>
              <p className="news-detail__toc-label">{sectionLabel}</p>
              <ol>
                {sectionTargets.map((target) => <li key={target.id}><button type="button" lang={target.id === "article-sources" ? locale : contentLocale} aria-current={activeSection === target.id ? "true" : undefined} onClick={() => jumpToSection(target.id)}>{target.label}</button></li>)}
              </ol>
            </nav>}
            <SponsoredSlot promotions={promotions} locale={locale} market={market} variant="sidebar" />
            <DeferUntilVisible target=".news-market-context" rootMargin="75% 0px">
              <ArticleMarketContext assets={marketAssets} locale={locale} />
            </DeferUntilVisible>
          </div>
        </div>

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
                const db = newsVenueMeta(vSlug);

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
          <DeferUntilVisible target=".v3-onsite-telegram-handoff" rootMargin="75% 0px">
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
          </DeferUntilVisible>
        )}

        {newsReadingNeighbors(article, visibleArticles).length > 0 && <nav className="news-detail__decision-links" aria-label={newsLibraryCopy(locale).browse} data-news-reading-neighbors="">
          {newsReadingNeighbors(article, visibleArticles).map(item => <a key={item.slug} href={withContext(newsArticleUrl(item.slug, locale, item))}>{localizedNewsTitle(item, locale)}</a>)}
        </nav>}
        <RelatedResearch links={relatedLinks} relatedArticles={recentEntityArticles(article, visibleArticles)} locale={locale} t={t} withContext={withContext} article={article} />



        {article.relatedVenues && article.relatedVenues.length > 0 && (
          <DeferUntilVisible target=".news-detail__next-decision-bridge" rootMargin="75% 0px">
            <NextDecisionBridge
              className="news-detail__next-decision-bridge"
              locale={locale}
              market={market}
              product={product}
              title={t.nextStepTitle}
              body={t.nextStepBody}
              profileSlug={article.relatedVenues[0]}
              profileLabel={newsVenueName(article.relatedVenues[0]) || t.claimBtn}
              compareHref={article.seo?.internalLinkTargets?.find((href) => /^\/compare\/[a-z0-9-]+$/i.test(href))}
              compareSlugs={article.relatedVenues}
              placement="news-detail-next-decision-bridge"
              decision={article.slug}
            />
          </DeferUntilVisible>
        )}
      </article>
    </main>
  );
}

export default NewsDetailPage;
