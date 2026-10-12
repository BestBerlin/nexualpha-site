// Tool page -> articles (links-l10n lane 2026-10-11, scorecard D4). The data/tool pages list the newest articles that
// discuss their subject. The list is computed on the server from the live news feed (src/data/topic-clusters.js,
// toolArticleLinks) and handed to the page as `initial` (SSR props + the prerender state the browser hydrates with), so
// crawlers see real <a href> links. After a client-side route change the same list is fetched from
// /api/news/tool-articles. This module carries only its copy; the cluster mapping stays on the server.
import React, { useEffect, useState } from "react";
import { localizedHref } from "../../data/locale-routing.js";

// T10 (2026-10-12): lists are ordered most-read first (Google impressions), then newest.
const COPY = {
  en: ["Related research", "Articles in the NexuAlpha library on this subject, most-read first, each with its sources listed.", "All articles"],
  "zh-Hans": ["相关研究文章", "文章库中与本页主题相关的文章，阅读最多的排在前面，每篇都列出来源。", "全部文章"],
  "zh-Hant": ["相關研究文章", "文章庫中與本頁主題相關的文章，閱讀最多的排在前面，每篇都列出來源。", "全部文章"],
  es: ["Investigación relacionada", "Artículos de la biblioteca de NexuAlpha sobre este tema, los más leídos primero, cada uno con sus fuentes.", "Todos los artículos"],
  "pt-BR": ["Pesquisa relacionada", "Artigos da biblioteca da NexuAlpha sobre este tema, os mais lidos primeiro, cada um com suas fontes.", "Todos os artigos"],
  fr: ["Recherches associées", "Les articles de la bibliothèque NexuAlpha sur ce sujet, les plus lus d’abord, chacun avec ses sources.", "Tous les articles"],
  de: ["Verwandte Recherchen", "Artikel der NexuAlpha-Bibliothek zu diesem Thema, meistgelesene zuerst, jeweils mit Quellenangaben.", "Alle Artikel"],
  it: ["Ricerche correlate", "Gli articoli della libreria NexuAlpha su questo tema, i più letti per primi, ciascuno con le sue fonti.", "Tutti gli articoli"],
  ja: ["関連リサーチ", "このテーマに関する NexuAlpha ライブラリの記事です。よく読まれている順に並べ、各記事に出典を掲載しています。", "すべての記事"],
  ko: ["관련 리서치", "이 주제를 다룬 NexuAlpha 라이브러리 기사입니다. 많이 읽힌 순서로 보여 주며 기사마다 출처를 표시합니다.", "전체 기사"],
  ru: ["Связанные исследования", "Статьи библиотеки NexuAlpha по этой теме, сначала самые читаемые, у каждой указаны источники.", "Все статьи"],
  tr: ["İlgili araştırmalar", "NexuAlpha kütüphanesinde bu konudaki makaleler, en çok okunanlar önce; her birinin kaynakları listelenir.", "Tüm makaleler"],
  id: ["Riset terkait", "Artikel di pustaka NexuAlpha tentang topik ini, yang paling banyak dibaca lebih dulu, masing-masing dengan daftar sumbernya.", "Semua artikel"],
  vi: ["Nghiên cứu liên quan", "Các bài viết trong thư viện NexuAlpha về chủ đề này, bài được đọc nhiều nhất đứng trước, mỗi bài đều liệt kê nguồn.", "Tất cả bài viết"],
  ar: ["أبحاث ذات صلة", "مقالات مكتبة NexuAlpha حول هذا الموضوع، الأكثر قراءة أولًا، مع ذكر مصادر كل مقال.", "كل المقالات"],

 // l10n: needs native review
 ur: ["متعلقہ تحقیق", "اس موضوع پر NexuAlpha کی تحریریں، سب سے زیادہ پڑھی جانے والی پہلے، ہر تحریر کے ساتھ ماخذ درج ہیں۔", "تمام تحریریں"],
 // l10n: needs native review
 uk: ["Пов’язані дослідження", "Матеріали бібліотеки NexuAlpha на цю тему, спершу найпопулярніші, з переліком джерел у кожному.", "Усі матеріали"],
};

// The /news hub block ("news-hub"): the library's most-read articles.
const HUB_COPY = {
  en: ["Most-read research", "The library articles readers reach most often from search, each with its sources listed."],
  "zh-Hans": ["阅读最多的研究", "读者通过搜索最常打开的文章，每篇都列出来源。"],
  "zh-Hant": ["閱讀最多的研究", "讀者透過搜尋最常打開的文章，每篇都列出來源。"],
  es: ["Investigación más leída", "Los artículos de la biblioteca que más visitan los lectores desde los buscadores, cada uno con sus fuentes."],
  "pt-BR": ["Pesquisas mais lidas", "Os artigos da biblioteca que os leitores mais acessam pela busca, cada um com suas fontes."],
  fr: ["Recherches les plus lues", "Les articles de la bibliothèque que les lecteurs consultent le plus depuis la recherche, chacun avec ses sources."],
  de: ["Meistgelesene Recherchen", "Die Bibliotheksartikel, die Leser über die Suche am häufigsten aufrufen, jeweils mit Quellenangaben."],
  it: ["Ricerche più lette", "Gli articoli della libreria che i lettori aprono più spesso dalla ricerca, ciascuno con le sue fonti."],
  ja: ["よく読まれているリサーチ", "検索から最も多く読まれているライブラリ記事です。各記事に出典を掲載しています。"],
  ko: ["많이 읽힌 리서치", "검색으로 독자가 가장 많이 찾은 라이브러리 기사입니다. 기사마다 출처를 표시합니다."],
  ru: ["Самые читаемые исследования", "Статьи библиотеки, которые читатели чаще всего находят через поиск, у каждой указаны источники."],
  tr: ["En çok okunan araştırmalar", "Okuyucuların aramadan en sık ulaştığı kütüphane makaleleri; her birinin kaynakları listelenir."],
  id: ["Riset paling banyak dibaca", "Artikel pustaka yang paling sering dibuka pembaca dari pencarian, masing-masing dengan daftar sumbernya."],
  vi: ["Nghiên cứu được đọc nhiều nhất", "Các bài trong thư viện được độc giả mở nhiều nhất từ tìm kiếm, mỗi bài đều liệt kê nguồn."],
  ar: ["الأبحاث الأكثر قراءة", "مقالات المكتبة التي يصل إليها القراء أكثر من غيرها عبر البحث، مع ذكر مصادر كل مقال."],
  // l10n: needs native review
  ur: ["سب سے زیادہ پڑھی گئی تحقیق", "لائبریری کی وہ تحریریں جن تک قارئین سرچ سے سب سے زیادہ پہنچتے ہیں، ہر تحریر کے ساتھ ماخذ درج ہیں۔"],
  // l10n: needs native review
  uk: ["Найпопулярніші дослідження", "Матеріали бібліотеки, які читачі найчастіше знаходять через пошук, з переліком джерел у кожному."],
};

export function toolArticleCopy(locale = "en", tool = null) {
  const [title, body, all] = COPY[locale] || COPY.en;
  if (tool === "news-hub") {
    const [hubTitle, hubBody] = HUB_COPY[locale] || HUB_COPY.en;
    return { title: hubTitle, body: hubBody, all };
  }
  return { title, body, all };
}

const matches = (data, tool, locale) => Boolean(data && data.tool === tool && data.locale === locale && Array.isArray(data.items) && data.items.length);

export function ToolArticleLinks({ tool, locale = "en", initial = null }) {
  const [data, setData] = useState(() => (matches(initial, tool, locale) ? initial : null));
  useEffect(() => {
    if (!tool || matches(data, tool, locale)) return undefined;
    if (matches(initial, tool, locale)) { setData(initial); return undefined; }
    let active = true;
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    fetch(`/api/news/tool-articles?tool=${encodeURIComponent(tool)}&locale=${encodeURIComponent(locale)}`, { signal: controller?.signal, headers: { accept: "application/json" } })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => { if (active && matches(payload, tool, locale)) setData(payload); })
      .catch(() => {});
    return () => { active = false; controller?.abort(); };
  }, [tool, locale, initial]);
  if (!matches(data, tool, locale)) return null;
  const copy = toolArticleCopy(locale, tool);
  const headingId = `tool-articles-${String(tool).replace(/[^a-z0-9-]/gi, "-")}`;
  return (
    <section className="nx-tool-articles v2-shell" aria-labelledby={headingId} data-tool-articles={tool} dir={["ar", "ur"].includes(locale) ? "rtl" : "ltr"}>
      <div className="nx-tool-articles__intro">
        <h2 id={headingId}>{copy.title}</h2>
        <p>{copy.body}</p>
        {tool === "news-hub" ? null : <a className="nx-tool-articles__all" href={localizedHref("/news", { locale })}>{copy.all} <span aria-hidden="true">{["ar", "ur"].includes(locale) ? "←" : "→"}</span></a>}
      </div>
      <ol className="nx-tool-articles__list">
        {data.items.map((item) => (
          <li key={item.slug}>
            <a href={item.href} data-tool-article={item.slug} data-cta-kind="research" data-cta-placement="tool-related-article">
              <time dateTime={item.publishedAt}>{item.publishedAt}</time>
              <span lang={item.lang && item.lang !== locale ? item.lang : undefined} dir={item.lang && item.lang !== locale ? "ltr" : undefined}>{item.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default ToolArticleLinks;
