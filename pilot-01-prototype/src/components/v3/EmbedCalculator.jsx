import React, { useEffect, useMemo, useState } from "react";
import { HomeCalculator } from "../v7/HomeCalculator.jsx";
import { feeFact } from "../../data/exchange-facts.js";
import { readDecisionReturnState } from "../../data/decision-return.js";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { homePartnersFor } from "../../data/home-rebate-tiers.js";
import { partnerRebateShare } from "../../data/partner-benefit-status.js";
import { isNeutralCtaLocale } from "../../data/locale-policy.js";
import { isTurkeyPage, jurisdictionPromotionBan } from "../../data/partner-geo-policy.js";
import { h7Copy, h7TurkeyCopy } from "../v7/home7-copy.js";
import { h7NeutralCopy } from "../v7/home7-neutral-copy.js";
import { nameOf } from "../v7/home7-shared.jsx";
import "../../styles/v7/home7.css";
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
  // l10n: needs native review
  ur: ["فیس کیلکولیٹر از ", "پلیٹ فارم موازنہ دیکھیں ↗"],
  // l10n: needs native review
  uk: ["Калькулятор комісій від ", "Переглянути порівняння платформ ↗"],
};

export function EmbedCalculator({ locale = "en", market, product }) {
  const normalizedLocale = String(locale || "en").split("-")[0];
  const [attribution, explore] = FOOTER_COPY[locale] || FOOTER_COPY[normalizedLocale] || FOOTER_COPY.en;

  const [vol, setVol] = useState(1e7);
  const [mode, setMode] = useState("taker");
  const [instrument, setInstrument] = useState(product === "spot" ? "spot" : "perp");
  // Keep the first client render identical to canonical SSR; restore only validated
  // scenario fields after hydration. Legacy 5K scenarios remain valid typed inputs.
  useEffect(() => {
    const restored = readDecisionReturnState(window.location.search, window.location.hash);
    if (!restored) return;
    setVol(restored.volume);
    setMode(restored.kind === "cost" ? restored.order : "taker");
    setInstrument(restored.instrument === "spot" ? "spot" : "perp");
  }, [locale]);
  const banned = isNeutralCtaLocale(locale) || Boolean(jurisdictionPromotionBan({ locale, market }));
  const baseCopy = banned ? { ...h7Copy(locale), ...h7NeutralCopy(locale) } : h7Copy(locale);
  const t = isTurkeyPage({ locale, market }) ? h7TurkeyCopy(baseCopy, locale) : baseCopy;
  const calc = useMemo(() => {
    const rows = homePartnersFor(locale, market).flatMap((slug) => {
      const f = feeFact(slug, instrument);
      if (f.state !== "checked" || !Number.isFinite(f.maker) || !Number.isFinite(f.taker)) return [];
      const cta = publicCtaForVenue(slug, locale, market);
      const share = banned ? null : partnerRebateShare(slug);
      const gross = vol ? vol * (mode === "maker" ? f.maker : f.taker) / 100 : null;
      const net = gross == null ? null : gross * (1 - (share || 0));
      return [{ slug, name: nameOf(slug), maker: f.maker, taker: f.taker, share,
        code: !banned && cta.hasReferral ? cta.inviteCode : null,
        url: banned ? null : cta.registrationUrl,
        open: !banned && Boolean(cta.hasReferral && /^https:\/\//i.test(cta.registrationUrl || "")),
        gross, net, save: gross == null ? null : gross - net }];
    });
    const priced = rows.filter((r) => r.net != null);
    const best = priced.reduce((a, b) => !a || b.net < a.net ? b : a, null);
    const most = priced.reduce((a, b) => !a || b.save > a.save ? b : a, null);
    return { rows, best, most };
  }, [locale, market, instrument, mode, vol, banned]);

  return (
    <div className="embed-container embed-container--calculator" data-growth-market={market} data-growth-product={instrument === "spot" ? "spot" : "perpetuals"}>
      <div className="embed-content h7" lang={locale} dir={/^(ar|ur)(-|$)/.test(locale) ? "rtl" : "ltr"}>
        <HomeCalculator t={t} locale={locale} headingLevel={1} vol={vol} setVol={setVol} mode={mode} setMode={setMode} product={instrument} setProduct={setInstrument} calc={calc} />
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
