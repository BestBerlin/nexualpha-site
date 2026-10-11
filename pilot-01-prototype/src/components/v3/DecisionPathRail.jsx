import React, { useState } from "react";
import { localizedHref } from "../../data/locale-routing.js";
import { appendDecisionPassportQuery } from "../../data/decision-passport.js";
import "./decision-path-rail.css";

const copy = {
  "zh-Hans": {
    label: "下一步决策",
    compare: "比较总成本",
    facts: "查看来源档案",
    directory: "按条件选平台",
  },
  "zh-Hant": {
    label: "下一步決策",
    compare: "比較總成本",
    facts: "查看來源檔案",
    directory: "按條件選平台",
  },
  en: {
    label: "NEXT DECISION",
    compare: "Compare total cost",
    facts: "Review source factbook",
    directory: "Choose by conditions",
  },
  es: { label: "SIGUIENTE DECISIÓN", compare: "Comparar coste total", facts: "Ver ficha de fuentes", directory: "Elegir por condiciones" },
  "pt-BR": { label: "PRÓXIMA DECISÃO", compare: "Comparar custo total", facts: "Ver ficha de fontes", directory: "Escolher por condições" },
  fr: { label: "PROCHAINE DÉCISION", compare: "Comparer le coût total", facts: "Voir la fiche des sources", directory: "Choisir selon les conditions" },
  de: { label: "NÄCHSTE ENTSCHEIDUNG", compare: "Gesamtkosten vergleichen", facts: "Quellen-Factbook öffnen", directory: "Nach Bedingungen wählen" },
  ja: { label: "次の判断", compare: "総コストを比較", facts: "出典ファクトブックを見る", directory: "条件から選ぶ" },
  ko: { label: "다음 결정", compare: "총비용 비교", facts: "출처 팩트북 보기", directory: "조건으로 선택" },
  ar: { label: "القرار التالي", compare: "قارن التكلفة الإجمالية", facts: "راجع سجل المصادر", directory: "اختر حسب الشروط" },
  tr: { label: "SONRAKİ KARAR", compare: "Toplam maliyeti karşılaştır", facts: "Kaynak dosyasını incele", directory: "Koşullara göre seç" },
  ru: { label: "СЛЕДУЮЩЕЕ РЕШЕНИЕ", compare: "Сравнить общую стоимость", facts: "Открыть досье источников", directory: "Выбрать по условиям" },
  id: { label: "KEPUTUSAN BERIKUTNYA", compare: "Bandingkan biaya total", facts: "Lihat factbook sumber", directory: "Pilih berdasarkan kondisi" },
  vi: { label: "QUYẾT ĐỊNH TIẾP THEO", compare: "So sánh tổng chi phí", facts: "Xem hồ sơ nguồn", directory: "Chọn theo điều kiện" },
  it: { label: "PROSSIMA DECISIONE", compare: "Confronta il costo totale", facts: "Apri il factbook delle fonti", directory: "Scegli per condizioni" },

 // l10n: needs native review
 ur:{label:"اگلا فیصلہ",compare:"کل لاگت کا موازنہ",facts:"ماخذ کی فیکٹ بک کا جائزہ",directory:"شرائط کے لحاظ سے انتخاب"},
 // l10n: needs native review
 uk:{label:"НАСТУПНЕ РІШЕННЯ",compare:"Порівняти загальні витрати",facts:"Перевірити фактбук джерел",directory:"Вибрати за умовами"},
};

const FALLBACK_PAIR = ["binance", "okx"];

function currentDecisionContext() {
  if (typeof window === "undefined") return {};
  const { pathname, search } = window.location;
  const params = new URLSearchParams(search);
  const queryVenue = params.get("venue") || params.get("platform");
  const factbookMatch = pathname.match(/^\/factbook\/([^/?#]+)/);
  const exchangeMatch = pathname.match(/^\/exchanges\/([^/?#]+)/);
  const compareMatch = pathname.match(/^\/compare\/([^/?#]+)/);
  const shortlist = compareMatch
    ? compareMatch[1].split("-vs-").filter(Boolean)
    : [];
  const venue = queryVenue || factbookMatch?.[1] || exchangeMatch?.[1] || shortlist[0];
  return { venue, shortlist };
}

function compareSlugFor(venue, shortlist = []) {
  const primary = venue || FALLBACK_PAIR[0];
  const secondary = primary === FALLBACK_PAIR[0] ? FALLBACK_PAIR[1] : FALLBACK_PAIR[0];
  const pair = shortlist.length >= 2
    ? shortlist.slice(0, 2)
    : [primary, secondary];
  return pair.join("-vs-");
}

export function DecisionPathRail({ locale = "en", market, product = "spot", accountStage, funding, current = "rates", venue, shortlist }) {
  const localeKey = String(locale || "en").toLowerCase() === "pt-br" ? "pt-BR" : String(locale || "en").split("-")[0];
  const t = copy[locale] || copy[localeKey] || (locale.startsWith("zh") ? copy["zh-Hans"] : copy.en);
  // Resolve the current route during the first client render so the rail does
  // not briefly point every user back to the Binance/OKX default pair.
  const [decisionContext] = useState(() => currentDecisionContext());
  const selectedVenue = venue || decisionContext.venue || FALLBACK_PAIR[0];
  const selectedShortlist = Array.isArray(shortlist) && shortlist.length ? shortlist : decisionContext.shortlist;
  const decisionHref = (href) => appendDecisionPassportQuery(
    localizedHref(href, { locale }),
    { market, product, accountStage, funding },
  );
  const links = [
    { id: "compare", href: decisionHref(`/compare/${compareSlugFor(selectedVenue, selectedShortlist)}`), label: t.compare },
    { id: "facts", href: decisionHref(`/factbook/${selectedVenue}#rates`), label: t.facts },
    { id: "directory", href: decisionHref("/exchanges"), label: t.directory },
  ];

  return (
    <nav className="decision-path-rail" aria-label={t.label} data-decision-current={current}>
      <span className="decision-path-rail__label">{t.label}</span>
      <div className="decision-path-rail__links">
        {links.map((link, index) => (
          <a
            key={link.id}
            href={link.href}
            className={`decision-path-rail__link${index === 0 ? " is-primary" : ""}`}
            data-cta-kind="research"
            data-cta-placement={`decision-rail-${link.id}`}
            data-growth-placement={`decision-rail-${link.id}`}
            data-growth-market={market}
            data-growth-product={product}
            data-growth-account-stage={accountStage}
            data-growth-funding={funding}
            data-growth-decision={selectedVenue}
          >
            {link.label} <b aria-hidden="true">→</b>
          </a>
        ))}
      </div>
    </nav>
  );
}

export default DecisionPathRail;
