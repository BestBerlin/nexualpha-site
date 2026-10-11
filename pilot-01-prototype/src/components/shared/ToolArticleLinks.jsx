// Tool page -> articles (links-l10n lane 2026-10-11, scorecard D4). The data/tool pages list the newest articles that
// discuss their subject. The list is computed on the server from the live news feed (src/data/topic-clusters.js,
// toolArticleLinks) and handed to the page as `initial` (SSR props + the prerender state the browser hydrates with), so
// crawlers see real <a href> links. After a client-side route change the same list is fetched from
// /api/news/tool-articles. This module carries only its copy; the cluster mapping stays on the server.
import React, { useEffect, useState } from "react";
import { localizedHref } from "../../data/locale-routing.js";

const COPY = {
  en: ["Related research", "The newest articles in the NexuAlpha library on this subject, each with its sources listed.", "All articles"],
  "zh-Hans": ["相关研究文章", "文章库中与本页主题相关的最新文章，每篇都列出来源。", "全部文章"],
  "zh-Hant": ["相關研究文章", "文章庫中與本頁主題相關的最新文章，每篇都列出來源。", "全部文章"],
  es: ["Investigación relacionada", "Los artículos más recientes de la biblioteca de NexuAlpha sobre este tema, cada uno con sus fuentes.", "Todos los artículos"],
  "pt-BR": ["Pesquisa relacionada", "Os artigos mais recentes da biblioteca da NexuAlpha sobre este tema, cada um com suas fontes.", "Todos os artigos"],
  fr: ["Recherches associées", "Les articles les plus récents de la bibliothèque NexuAlpha sur ce sujet, chacun avec ses sources.", "Tous les articles"],
  de: ["Verwandte Recherchen", "Die neuesten Artikel der NexuAlpha-Bibliothek zu diesem Thema, jeweils mit Quellenangaben.", "Alle Artikel"],
  it: ["Ricerche correlate", "Gli articoli più recenti della libreria NexuAlpha su questo tema, ciascuno con le sue fonti.", "Tutti gli articoli"],
  ja: ["関連リサーチ", "このテーマに関する NexuAlpha ライブラリの最新記事です。各記事に出典を掲載しています。", "すべての記事"],
  ko: ["관련 리서치", "이 주제를 다룬 NexuAlpha 라이브러리의 최신 기사입니다. 기사마다 출처를 표시합니다.", "전체 기사"],
  ru: ["Связанные исследования", "Самые новые статьи библиотеки NexuAlpha по этой теме, у каждой указаны источники.", "Все статьи"],
  tr: ["İlgili araştırmalar", "NexuAlpha kütüphanesinde bu konudaki en yeni makaleler; her birinin kaynakları listelenir.", "Tüm makaleler"],
  id: ["Riset terkait", "Artikel terbaru di pustaka NexuAlpha tentang topik ini, masing-masing dengan daftar sumbernya.", "Semua artikel"],
  vi: ["Nghiên cứu liên quan", "Các bài viết mới nhất trong thư viện NexuAlpha về chủ đề này, mỗi bài đều liệt kê nguồn.", "Tất cả bài viết"],
  ar: ["أبحاث ذات صلة", "أحدث مقالات مكتبة NexuAlpha حول هذا الموضوع، مع ذكر مصادر كل مقال.", "كل المقالات"],

 // l10n: needs native review
 ur: ["متعلقہ تحقیق", "اس موضوع پر NexuAlpha کی تازہ ترین تحریریں، ہر تحریر کے ساتھ ماخذ درج ہیں۔", "تمام تحریریں"],
 // l10n: needs native review
 uk: ["Пов’язані дослідження", "Найновіші матеріали бібліотеки NexuAlpha на цю тему з переліком джерел у кожному.", "Усі матеріали"],
};

export function toolArticleCopy(locale = "en") {
  const [title, body, all] = COPY[locale] || COPY.en;
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
  const copy = toolArticleCopy(locale);
  const headingId = `tool-articles-${String(tool).replace(/[^a-z0-9-]/gi, "-")}`;
  return (
    <section className="nx-tool-articles v2-shell" aria-labelledby={headingId} data-tool-articles={tool} dir={["ar", "ur"].includes(locale) ? "rtl" : "ltr"}>
      <div className="nx-tool-articles__intro">
        <h2 id={headingId}>{copy.title}</h2>
        <p>{copy.body}</p>
        <a className="nx-tool-articles__all" href={localizedHref("/news", { locale })}>{copy.all} <span aria-hidden="true">{["ar", "ur"].includes(locale) ? "←" : "→"}</span></a>
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
