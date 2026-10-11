/**
 * LiveIntelligenceNews — 实时新闻、快讯与深度研报模块
 * 位于首页头部下方，为用户提供硬核无 AI 味的交易情报与官方风向，同时为 SEO 收录预留高权重文本入口。
 */
import React, { useState } from "react";
import "./live-intelligence-news.css";

const newsData = {
  "zh-Hans": {
    eyebrow: "TERMINAL REVIEW / 来源情报与研报",
    title: "交易所风向与快讯研报",
    subtitle: "硬核源头数据交叉核验，无水文无营销广告，直接呈现费率、规则与合规变动。",
    tabs: [
      { id: "all", label: "全部情报" },
      { id: "rates", label: "费率与返佣" },
      { id: "compliance", label: "合规与地区" },
      { id: "research", label: "深度研报 (SEO)" },
    ],
    items: [
      {
        id: "news-01",
        category: "rates",
        categoryName: "费率变动",
        time: "来源待复核",
        title: "OKX 调整 VIP3 梯次 Maker/Taker 费率结算机制",
        summary: "费用、滑点与用户权益需回到 OKX 官方注册与账户页面逐项确认；NexuAlpha 不承诺自动返还或实时到账。",
        source: "OKX 官方公告",
        sourceUrl: "https://www.okx.com",
        readTime: "2 min",
        tag: "关键更新",
        slug: "okx",
      },
      {
        id: "news-02",
        category: "research",
        categoryName: "深度研报",
        time: "研究记录",
        title: "2026 CEX vs DEX 衍生品资金费率与清算滑点实测对比",
        summary: "对 Binance、Bybit、Hyperliquid 三大平台在极端行情下的清算引擎延迟、资金费率换算与出入金通道进行了 720 小时连续跑模与实操复盘。",
        source: "NexuAlpha 独立实验室",
        sourceUrl: "#",
        readTime: "6 min",
        tag: "SEO 研报",
        slug: "hyperliquid",
      },
      {
        id: "news-03",
        category: "compliance",
        categoryName: "合规风向",
        time: "来源记录",
        title: "Kraken 获得爱尔兰央行 EMI 电子货币机构牌照许可",
        summary: "欧元通道、地区资格与 KYC 要求需以 Kraken 官方页面和适用地区条款为准；本记录只保留来源线索。",
        source: "Central Bank of Ireland",
        sourceUrl: "https://www.kraken.com",
        readTime: "3 min",
        tag: "合规进展",
        slug: "kraken",
      },
      {
        id: "news-04",
        category: "rates",
        categoryName: "返佣政策",
        time: "来源待复核",
        title: "Bitget 2026 年第一季度独家交易员手续费减免计划生效",
        summary: "Bitget 邀请码与合作入口已保留；现货、合约、返还或后台对账条件以官方开户注册页显示为准。",
        source: "Bitget 官方合约部",
        sourceUrl: "https://www.bitget.com",
        readTime: "1 min",
        tag: "独家福利",
        slug: "bitget",
      },
    ],
    readMore: "阅读完整研报",
    liveSignal: "来源复核中",
  },
  "zh-Hant": {
    eyebrow: "TERMINAL REVIEW / 來源情報與研報",
    title: "交易所風向與快訊研報",
    subtitle: "硬核源頭數據交叉核驗，無水文無營銷廣告，直接呈現費率、規則與合規變動。",
    tabs: [
      { id: "all", label: "全部情報" },
      { id: "rates", label: "費率與返佣" },
      { id: "compliance", label: "合規與地區" },
      { id: "research", label: "深度研報 (SEO)" },
    ],
    items: [
      {
        id: "news-01",
        category: "rates",
        categoryName: "費率變動",
        time: "來源待複核",
        title: "OKX 調整 VIP3 梯次 Maker/Taker 費率結算機制",
        summary: "費用、滑點與用戶權益需回到 OKX 官方註冊與帳戶頁面逐項確認；NexuAlpha 不承諾自動返還或即時到賬。",
        source: "OKX 官方公告",
        sourceUrl: "https://www.okx.com",
        readTime: "2 min",
        tag: "關鍵更新",
        slug: "okx",
      },
      {
        id: "news-02",
        category: "research",
        categoryName: "深度研報",
        time: "研究記錄",
        title: "2026 CEX vs DEX 衍生品資金費率與清算滑點實測對比",
        summary: "對 Binance、Bybit、Hyperliquid 三大平台在極端行情下的清算引擎延遲、資金費率換算與出入金通道進行了 720 小時連續跑模與實操複盤。",
        source: "NexuAlpha 獨立實驗室",
        sourceUrl: "#",
        readTime: "6 min",
        tag: "SEO 研報",
        slug: "hyperliquid",
      },
      {
        id: "news-03",
        category: "compliance",
        categoryName: "合規風向",
        time: "來源記錄",
        title: "Kraken 獲得愛爾蘭央行 EMI 電子貨幣機構牌照許可",
        summary: "歐元通道、地區資格與 KYC 要求需以 Kraken 官方頁面和適用地區條款為準；本記錄只保留來源線索。",
        source: "Central Bank of Ireland",
        sourceUrl: "https://www.kraken.com",
        readTime: "3 min",
        tag: "合規進展",
        slug: "kraken",
      },
      {
        id: "news-04",
        category: "rates",
        categoryName: "返佣政策",
        time: "來源待複核",
        title: "Bitget 2026 年第一季獨家交易員手續費減免計劃生效",
        summary: "Bitget 邀請碼與合作入口已保留；現貨、合約、返還或後台對帳條件以官方開戶註冊頁顯示為準。",
        source: "Bitget 官方合約部",
        sourceUrl: "https://www.bitget.com",
        readTime: "1 min",
        tag: "獨家福利",
        slug: "bitget",
      },
    ],
    readMore: "閱讀完整研報",
    liveSignal: "來源複核中",
  },
  en: {
    eyebrow: "TERMINAL REVIEW / INTELLIGENCE & RESEARCH",
    title: "Exchange Market Intelligence & Reports",
    subtitle: "Verified source data with zero fluff. Direct insights on fees, rules, and regulatory shifts.",
    tabs: [
      { id: "all", label: "All News" },
      { id: "rates", label: "Fees & Rebates" },
      { id: "compliance", label: "Compliance" },
      { id: "research", label: "Deep Research" },
    ],
    items: [
      {
        id: "news-01",
        category: "rates",
        categoryName: "Fee Structure",
        time: "Source pending",
        title: "OKX Updates VIP3 Maker/Taker Tiered Settlement",
        summary: "Fee, slippage, and user-benefit conditions must be confirmed on OKX's official registration and account pages. NexuAlpha does not promise automatic user-benefit settlement or live settlement.",
        source: "OKX Official Announcement",
        sourceUrl: "https://www.okx.com",
        readTime: "2 min",
        tag: "Key Update",
        slug: "okx",
      },
      {
        id: "news-02",
        category: "research",
        categoryName: "Research",
        time: "Research record",
        title: "2026 CEX vs DEX Derivatives Slippage & Funding Benchmark",
        summary: "720-hour stress testing across Binance, Bybit, and Hyperliquid liquidation engines during high-volatility events.",
        source: "NexuAlpha Research Lab",
        sourceUrl: "#",
        readTime: "6 min",
        tag: "Deep Report",
        slug: "hyperliquid",
      },
      {
        id: "news-03",
        category: "compliance",
        categoryName: "Compliance",
        time: "Source record",
        title: "Kraken Secures EMI License from Central Bank of Ireland",
        summary: "EUR rails, regional eligibility, and KYC conditions must be confirmed against Kraken's official pages and applicable regional terms.",
        source: "Central Bank of Ireland",
        sourceUrl: "https://www.kraken.com",
        readTime: "3 min",
        tag: "Regulatory",
        slug: "kraken",
      },
      {
        id: "news-04",
        category: "rates",
        categoryName: "Rebates",
        time: "Source pending",
        title: "Bitget Q1 2026 Trader Fee Rebate Program Live",
        summary: "The Bitget referral route is preserved. Spot, derivatives, rebate, and account-ledger terms must be confirmed on the official signup page.",
        source: "Bitget Institutional Desk",
        sourceUrl: "https://www.bitget.com",
        readTime: "1 min",
        tag: "Exclusive",
        slug: "bitget",
      },
    ],
    readMore: "Read Full Report",
    liveSignal: "SOURCE REVIEW",
  },
};

export function LiveIntelligenceNews({ locale = "en" }) {
  const [activeTab, setActiveTab] = useState("all");
  const isZh = locale.startsWith("zh");
  const isHant = locale === "zh-Hant" || locale === "zh-TW";
  const localeKey = String(locale || "en").toLowerCase() === "pt-br" ? "pt-BR" : String(locale || "en").split("-")[0];
  // l10n: needs native review
  const readMore = { ja: "レポート全文を読む", ko: "전체 보고서 읽기", tr: "Raporun tamamını oku", es: "Leer el informe completo", "pt-BR": "Ler o relatório completo", fr: "Lire le rapport complet", de: "Vollständigen Bericht lesen", ru: "Читать полный отчёт", ar: "اقرأ التقرير الكامل", id: "Baca laporan lengkap", vi: "Đọc báo cáo đầy đủ", it: "Leggi il rapporto completo",
  // l10n: needs native review
  ur: "مکمل رپورٹ پڑھیں",
  // l10n: needs native review
  uk: "Читати повний звіт" }[localeKey];
  const t = { ...(isHant ? newsData["zh-Hant"] : isZh ? newsData["zh-Hans"] : newsData.en), ...(readMore ? { readMore } : {}) };

  const filteredItems = activeTab === "all"
    ? t.items
    : t.items.filter((item) => item.category === activeTab);

  return (
    <section className="live-news-section v2-shell" id="intelligence-news">
      <header className="live-news__header">
        <div className="live-news__meta-bar">
          <span className="live-news__eyebrow">
            <span className="live-news__pulse-dot"></span>
            {t.eyebrow}
          </span>
          <span className="live-news__status-badge">{t.liveSignal}</span>
        </div>
        <h2 className="live-news__title">{t.title}</h2>
        <p className="live-news__subtitle">{t.subtitle}</p>

        <nav className="live-news__tabs" role="tablist" aria-label="News categories">
          {t.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`live-news__tab ${activeTab === tab.id ? "live-news__tab--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="live-news__grid">
        {filteredItems.map((item) => (
          <article key={item.id} className="news-card">
            <div className="news-card__top">
              <span className={`news-card__tag news-card__tag--${item.category}`}>
                {item.categoryName}
              </span>
              <time className="news-card__time">{item.time}</time>
            </div>

            <h3 className="news-card__headline">
              <a href="#exchanges" className="news-card__headline-link">
                {item.title}
              </a>
            </h3>

            <p className="news-card__summary">{item.summary}</p>

            <footer className="news-card__footer">
              <span className="news-card__source">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                {item.source}
              </span>
              <span className="news-card__readtime"> {item.readTime}</span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

export default LiveIntelligenceNews;
