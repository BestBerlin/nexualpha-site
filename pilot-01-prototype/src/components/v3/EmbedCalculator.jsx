import React from "react";
import { TradingBleedAnalyzer } from "./TradingBleedAnalyzer";
import { localizedHref } from "../../data/locale-routing.js";
import "./embed-calculator.css";

const FOOTER_COPY = {
  en: ["Fee calculator by ", "Explore platform comparisons ↗"],
  "zh-Hans": ["费用计算器提供：", "查看平台比较 ↗"],
  "zh-Hant": ["費用計算器提供：", "查看平台比較 ↗"],
  ja: ["手数料計算ツール提供：", "プラットフォーム比較を見る ↗"],
  ko: ["수수료 계산기 제공: ", "플랫폼 비교 보기 ↗"],
  tr: ["Ücret hesaplayıcısını sunan: ", "Platform karşılaştırmalarını inceleyin ↗"],
  "pt-BR": ["Calculadora de taxas por ", "Ver comparações de plataformas ↗"],
  es: ["Calculadora de comisiones de ", "Ver comparaciones de plataformas ↗"],
  fr: ["Calculateur de frais par ", "Voir les comparaisons de plateformes ↗"],
  de: ["Gebührenrechner von ", "Plattformvergleiche ansehen ↗"],
  ar: ["حاسبة الرسوم من ", "عرض مقارنات المنصات ↗"],
  ru: ["Калькулятор комиссий от ", "Посмотреть сравнения платформ ↗"],
  id: ["Kalkulator biaya oleh ", "Lihat perbandingan platform ↗"],
  vi: ["Công cụ tính phí của ", "Xem so sánh nền tảng ↗"],
  it: ["Calcolatore delle commissioni di ", "Vedi i confronti tra piattaforme ↗"],
};

export function EmbedCalculator({ locale = "en", market, product }) {
  const [attribution, explore] = FOOTER_COPY[locale] || FOOTER_COPY.en;

  return (
    <div className="embed-container embed-container--calculator">
      <div className="embed-content">
        <TradingBleedAnalyzer locale={locale} market={market} product={product} headingLevel={1} />
      </div>
      <footer className="embed-attribution-bar">
        <div className="embed-attribution-left">
          <span className="embed-logo-dot"></span>
          <span className="embed-attribution-text">
            {attribution}
            <strong dir="ltr">NexuAlpha</strong>
          </span>
        </div>
        <a 
          href={`https://nexualpha.com${localizedHref("/", { locale, utm_source: "embed_widget", utm_medium: "calculator" })}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="embed-attribution-link"
        >
          {explore}
        </a>
      </footer>
    </div>
  );
}
