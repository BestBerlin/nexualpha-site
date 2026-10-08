import { useRef } from "react";
import { BrandMark } from "../brand/BrandMark";
import { useStaggerReveal } from "../../hooks/useStaggerReveal.js";
import { directoryContext } from "../../data/directory-context.js";
import { localizedHref } from "../../data/locale-routing.js";
import { v3Copy } from "../../data/v3-product.js";
import "./crossroads-compare.css";

const uiText = {
  "zh-Hans": {
    eyebrow: "十字路口 · 平台横向比较",
    title: "清晰对比平台差异，避免先入为主",
    lead: "直接对比 2~3 家平台在准入类型、KYC 门槛、官方主域名和手续费机制上的关键不同，做出理性决定。",
    pairs: [
      { slug: "binance-vs-okx", left: "binance", right: "okx", leftName: "Binance", rightName: "OKX", desc: "全球主流综合 CEX 对比" },
      { slug: "bybit-vs-bitget", left: "bybit", right: "bitget", leftName: "Bybit", rightName: "Bitget", desc: "衍生品与跟单交易 CEX 对比" },
      { slug: "uniswap-vs-jupiter", left: "uniswap", right: "jupiter", leftName: "Uniswap", rightName: "Jupiter", desc: "以太坊与 Solana 生态 DEX 对比" },
      { slug: "hyperliquid-vs-dydx", left: "hyperliquid", right: "dydx", leftName: "Hyperliquid", rightName: "dYdX", desc: "高性能链上永续合约 Perp DEX 对比" },
    ],
  },
  "zh-Hant": {
    eyebrow: "十字路口 · 平台橫向比較",
    title: "清晰對比平台差異，避免先入為主",
    lead: "直接對比 2~3 家平台在准入類型、KYC 門檻、官方主網域和手續費機制上的關鍵不同，做出理性決定。",
    pairs: [
      { slug: "binance-vs-okx", left: "binance", right: "okx", leftName: "Binance", rightName: "OKX", desc: "全球主流綜合 CEX 對比" },
      { slug: "bybit-vs-bitget", left: "bybit", right: "bitget", leftName: "Bybit", rightName: "Bitget", desc: "衍生品與跟單交易 CEX 對比" },
      { slug: "uniswap-vs-jupiter", left: "uniswap", right: "jupiter", leftName: "Uniswap", rightName: "Jupiter", desc: "以太坊與 Solana 生態 DEX 對比" },
      { slug: "hyperliquid-vs-dydx", left: "hyperliquid", right: "dydx", leftName: "Hyperliquid", rightName: "dYdX", desc: "高性能鏈上永續合約 Perp DEX 對比" },
    ],
  },
  en: {
    eyebrow: "Crossroads · Deep Platform Comparison",
    title: "Compare meaningful differences, side by side",
    lead: "Evaluate two or three platforms across access model, KYC requirements, official domains, and cost mechanics before opening an account.",
    pairs: [
      { slug: "binance-vs-okx", left: "binance", right: "okx", leftName: "Binance", rightName: "OKX", desc: "Global flagship CEX comparison" },
      { slug: "bybit-vs-bitget", left: "bybit", right: "bitget", leftName: "Bybit", rightName: "Bitget", desc: "Derivatives & copy trading comparison" },
      { slug: "uniswap-vs-jupiter", left: "uniswap", right: "jupiter", leftName: "Uniswap", rightName: "Jupiter", desc: "Ethereum vs Solana DEX comparison" },
      { slug: "hyperliquid-vs-dydx", left: "hyperliquid", right: "dydx", leftName: "Hyperliquid", rightName: "dYdX", desc: "High-performance Perp DEX comparison" },
    ],
  },
};

const localizedPairDescriptions = {
  es: [
    "Comparación de CEX globales principales",
    "Derivados y copy trading",
    "DEX de Ethereum frente a Solana",
    "Perp DEX de alto rendimiento",
  ],
  "pt-BR": [
    "Comparação de CEX globais líderes",
    "Derivativos e copy trading",
    "DEX Ethereum versus Solana",
    "Perp DEX de alta performance",
  ],
  fr: [
    "Comparaison de CEX mondiaux majeurs",
    "Dérivés et copy trading",
    "DEX Ethereum contre Solana",
    "Perp DEX haute performance",
  ],
  de: [
    "Vergleich führender globaler CEX",
    "Derivate und Copy Trading",
    "Ethereum-DEX gegen Solana-DEX",
    "Leistungsstarke Perp DEX",
  ],
  ja: [
    "主要グローバル CEX の比較",
    "デリバティブとコピートレード比較",
    "Ethereum と Solana の DEX 比較",
    "高性能 Perp DEX 比較",
  ],
  ko: [
    "주요 글로벌 CEX 비교",
    "파생상품과 카피 트레이딩 비교",
    "Ethereum DEX와 Solana DEX 비교",
    "고성능 Perp DEX 비교",
  ],
  ar: [
    "مقارنة منصات CEX العالمية الكبرى",
    "مقارنة المشتقات والتداول بالنسخ",
    "مقارنة DEX على Ethereum و Solana",
    "مقارنة Perp DEX عالية الأداء",
  ],
  tr: [
    "Küresel lider CEX karşılaştırması",
    "Türevler ve copy trading karşılaştırması",
    "Ethereum ve Solana DEX karşılaştırması",
    "Yüksek performanslı Perp DEX karşılaştırması",
  ],
  ru: [
    "Сравнение ведущих глобальных CEX",
    "Деривативы и копитрейдинг",
    "DEX Ethereum против DEX Solana",
    "Высокопроизводительные Perp DEX",
  ],
  id: [
    "Perbandingan CEX global utama",
    "Derivatif dan copy trading",
    "DEX Ethereum versus Solana",
    "Perp DEX berkinerja tinggi",
  ],
  vi: [
    "So sánh CEX toàn cầu chủ lực",
    "Phái sinh và copy trading",
    "DEX Ethereum so với Solana",
    "Perp DEX hiệu năng cao",
  ],
  it: [
    "Confronto tra CEX globali principali",
    "Derivati e copy trading",
    "DEX Ethereum contro Solana",
    "Perp DEX ad alte prestazioni",
  ],
};

export function getUi(locale) {
  if (locale === "zh-Hans" || locale === "zh-CN") return uiText["zh-Hans"];
  if (locale === "zh-Hant" || locale === "zh-TW") return uiText["zh-Hant"];
  if (locale && locale !== "en") {
    const text = v3Copy(locale);
    const pairDescriptions = localizedPairDescriptions[locale] || localizedPairDescriptions[locale?.split("-")[0]];
    return {
      eyebrow: `${text.compareTitle || "Platform comparison"}`,
      title: text.compareVerdictTitle || text.compareTitle || uiText.en.title,
      lead: text.compareIntro || uiText.en.lead,
      pairs: uiText.en.pairs.map((pair, index) => ({ ...pair, desc: pairDescriptions?.[index] || text.deepCompare || pair.desc })),
    };
  }
  return uiText.en;
}

export function CrossroadsCompare({ locale = "en", market, product }) {
  const ui = getUi(locale);
  const gridRef = useRef(null);
  const context = directoryContext({ market, product, locale });
  useStaggerReveal(gridRef, { threshold: 0.08, once: true });

  return (
    <section className="crossroads v2-shell" id="compare">
      <div className="crossroads__header">
        <h2 className="crossroads__title">{ui.title}</h2>
        <p className="crossroads__lead">{ui.lead}</p>
      </div>

      <div className="crossroads__grid nxa-stagger" ref={gridRef}>
        {ui.pairs.map((pair) => (
          <a
            key={pair.slug}
            href={localizedHref(`/compare/${pair.slug}`, {
              locale,
              market: context.market,
              product: context.product,
              ...(context.scoped ? {
                utm_source: "regional_preview",
                utm_campaign: `${context.market.toLowerCase()}-research-preview`,
              } : {}),
            })}
            className="crossroads__card"
            data-decision-path={({ "binance-vs-okx": "cex", "bybit-vs-bitget": "derivatives", "uniswap-vs-jupiter": "onchain", "hyperliquid-vs-dydx": "perp" })[pair.slug]}
            data-growth-decision={pair.slug}
            data-growth-placement="crossroads-compare-card"
            data-growth-product={pair.slug.includes("dydx") ? "perpetuals" : "spot"}
          >
            <span className="crossroads__desc crossroads__decision-label">{pair.desc}</span>
            <div className="crossroads__decision-body">
            <div className="crossroads__pair">
              <BrandMark slug={pair.left} compact />
              <BrandMark slug={pair.right} compact />
              <div className="crossroads__names">
                <span className="crossroads__versus" translate="no" lang="en">
                  {pair.leftName} <small>vs</small> {pair.rightName}
                </span>
              </div>
            </div>
            <span className="crossroads__arrow" aria-hidden="true">→</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export default CrossroadsCompare;
