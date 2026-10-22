import { withoutTurkeyUnlisted } from "../../data/partner-geo-policy.js";
import React from "react";

const COPY = {
  en: { latest: "Latest on {name}", tools: "{name} tools", fallback: "Related research updates from the NexuAlpha library." },
  "zh-Hans": { latest: "{name} 最新文章", tools: "{name} 工具", fallback: "NexuAlpha 文章库中的相关研究更新。" },
  "zh-Hant": { latest: "{name} 最新文章", tools: "{name} 工具", fallback: "NexuAlpha 文章庫中的相關研究更新。" },
  es: { latest: "Último sobre {name}", tools: "Herramientas de {name}", fallback: "Actualizaciones de investigación relacionadas de la biblioteca NexuAlpha." },
  "pt-BR": { latest: "Mais recentes sobre {name}", tools: "Ferramentas de {name}", fallback: "Atualizações de pesquisa relacionadas da biblioteca NexuAlpha." },
  fr: { latest: "Dernières recherches sur {name}", tools: "Outils {name}", fallback: "Mises à jour de recherche associées dans la bibliothèque NexuAlpha." },
  de: { latest: "Neueste Inhalte zu {name}", tools: "{name}-Tools", fallback: "Verwandte Research-Updates aus der NexuAlpha-Bibliothek." },
  ja: { latest: "{name} の最新記事", tools: "{name} ツール", fallback: "NexuAlpha ライブラリの関連リサーチ更新です。" },
  ko: { latest: "{name} 최신 기사", tools: "{name} 도구", fallback: "NexuAlpha 라이브러리의 관련 리서치 업데이트입니다." },
  tr: { latest: "{name} hakkında son yazılar", tools: "{name} araçları", fallback: "NexuAlpha kitaplığındaki ilgili araştırma güncellemeleri." },
  vi: { latest: "Bài mới về {name}", tools: "Công cụ {name}", fallback: "Cập nhật nghiên cứu liên quan trong thư viện NexuAlpha." },
  id: { latest: "Terbaru tentang {name}", tools: "Alat {name}", fallback: "Pembaruan riset terkait dari pustaka NexuAlpha." },
  ru: { latest: "Последнее о {name}", tools: "Инструменты {name}", fallback: "Связанные исследования из библиотеки NexuAlpha." },
  ar: { latest: "الأحدث عن {name}", tools: "أدوات {name}", fallback: "تحديثات بحثية ذات صلة من مكتبة NexuAlpha." },
  it: { latest: "Ultime su {name}", tools: "Strumenti {name}", fallback: "Aggiornamenti di ricerca correlati dalla libreria NexuAlpha." },
  ur: { latest: "{name} پر تازہ ترین", tools: "{name} ٹولز", fallback: "NexuAlpha لائبریری سے متعلقہ تحقیقی اپ ڈیٹس۔" },
  uk: { latest: "Останнє про {name}", tools: "Інструменти {name}", fallback: "Пов'язані дослідження з бібліотеки NexuAlpha." },
};

const dirOf = (locale) => (["ar", "ur"].includes(locale) ? "rtl" : "ltr");
const textFor = (locale) => COPY[locale] || (String(locale || "").startsWith("zh") ? COPY["zh-Hans"] : COPY.en);
const fill = (text, vars) => String(text || "").replace(/\{(\w+)\}/g, (_m, key) => vars[key] || "");

export function HubNewsLinks({ locale = "en", name, items: allItems = [], tools = [], className = "v2-section", id }) {
  // Türkiye pages list no article that features an SPK-listed venue (tr-bitget-sweep).
  const items = withoutTurkeyUnlisted(allItems, { locale }, (item) => [item.slug, item.title, item.summary, item.href]);
  if (!items.length && !tools.length) return null;
  const copy = textFor(locale);
  const headingId = id || `hub-news-${String(name || "entity").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return <section className={className} aria-labelledby={items.length ? headingId : undefined} aria-label={items.length ? undefined : fill(copy.tools, { name })} dir={dirOf(locale)} data-hub-news-links={headingId} style={items.length ? { minBlockSize: `${4 + items.length * 5}rem` } : undefined}>
    {items.length ? <>
      <div className="section-lead"><h2 id={headingId}>{fill(copy.latest, { name })}</h2><span>{copy.fallback}</span></div>
      <ol className="v3-alternative-list">
        {items.map((item) => <li key={item.slug}>
          <a href={item.href} data-hub-news-link={item.slug} data-cta-kind="research" data-cta-placement="hub-latest-article">
            <small><time dateTime={item.publishedAt}>{String(item.publishedAt || "").slice(0, 10)}</time></small>
            <b>{item.title}</b>
            {item.summary ? <span>{item.summary}</span> : null}
          </a>
        </li>)}
      </ol>
    </> : null}
    {tools.length ? <nav className="v3-profile-primary-actions v3-profile-actions-row" aria-label={fill(copy.tools, { name })}>
      {tools.map((link) => <a key={link.key} href={link.href} data-hub-tool-link={link.key} data-cta-kind="research" data-cta-placement="hub-info-tool">{link.label}</a>)}
    </nav> : null}
  </section>;
}
