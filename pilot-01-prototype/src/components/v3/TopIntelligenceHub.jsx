/**
 * TopIntelligenceHub — 首页最上方：活动与上币中心 + 实时新闻与研报双栏并排大板块
 * 完全响应用户需求：在活动与上币中心旁边，增加实时新闻与 SEO 文章模块。
 */
import React, { useState, useMemo } from "react";
import { BrandMark } from "../brand/BrandMark.jsx";
import { partnerRegistry } from "../../data/partner-registry.js";
import { venueDatabase } from "../../data/venue-database.js";
import { officialCampaignResearchByVenue } from "../../data/official-campaign-research.js";
import { resolveCommercialClaim } from "../../data/commercial-claims.js";
import { v3Copy } from "../../data/v3-product.js";
import "./top-intelligence-hub.css";

const hubCopy = {
  "zh-Hans": {
    eyebrow: "LIVE INTEL & CAMPAIGNS",
    title: "活动与上币研究中心",
    subtitle: "把有来源的活动研究、费率口径和合规资料放在同一条决策路径；没有当前来源的内容明确标注待核验。",
    campaignsTab: "活动与上币雷达",
    newsTab: "实时新闻与研报",
    verifiedTag: "来源状态",
    claimBtn: "查看官方条款 ↗",
    readMore: "阅读完整研报",
    newsCategories: {
      all: "全部快讯",
      rates: "费率变动",
      compliance: "合规风向",
      research: "SEO 研报",
    },
  },
  "zh-Hant": {
    eyebrow: "LIVE INTEL & CAMPAIGNS",
    title: "活動與上幣研究中心",
    subtitle: "把有來源的活動研究、費率口徑和合規資料放在同一條決策路徑；沒有當前來源的內容明確標注待核驗。",
    campaignsTab: "活動與上幣雷達",
    newsTab: "實時新聞與研報",
    verifiedTag: "來源狀態",
    claimBtn: "查看官方條款 ↗",
    readMore: "閱讀完整研報",
    newsCategories: {
      all: "全部快訊",
      rates: "費率變動",
      compliance: "合規風向",
      research: "SEO 研報",
    },
  },
  en: {
    eyebrow: "LIVE INTEL & CAMPAIGNS",
    title: "Campaign and research hub",
    subtitle: "Source-reviewed campaign research, fee definitions, and compliance notes in one decision path. Unverified current terms stay labelled.",
    campaignsTab: "Campaign Radar",
    newsTab: "Market News & Research",
    verifiedTag: "Source status",
    claimBtn: "View official terms ↗",
    readMore: "Read Full Report",
    newsCategories: {
      all: "All News",
      rates: "Fee Rates",
      compliance: "Compliance",
      research: "SEO Reports",
    },
  },
  ja: { eyebrow: "LIVE INTEL & CAMPAIGNS", title: "キャンペーン・リサーチハブ", subtitle: "出典を確認したキャンペーン、手数料定義、コンプライアンス情報を一つの判断経路に整理しています。未確認の条件は明示します。", campaignsTab: "キャンペーンレーダー", newsTab: "市場ニュースとリサーチ", verifiedTag: "出典ステータス", claimBtn: "公式条件を確認 ↗", readMore: "レポート全文を読む", newsCategories: { all: "すべてのニュース", rates: "手数料", compliance: "コンプライアンス", research: "SEOレポート" } },
  ko: { eyebrow: "LIVE INTEL & CAMPAIGNS", title: "캠페인 및 리서치 허브", subtitle: "출처를 검토한 캠페인, 수수료 기준과 규제 자료를 하나의 의사결정 경로로 제공합니다. 확인되지 않은 조건은 표시합니다.", campaignsTab: "캠페인 레이더", newsTab: "시장 뉴스 및 리서치", verifiedTag: "출처 상태", claimBtn: "공식 조건 확인 ↗", readMore: "전체 리포트 읽기", newsCategories: { all: "전체 뉴스", rates: "수수료", compliance: "규제", research: "SEO 리포트" } },
  tr: { eyebrow: "LIVE INTEL & CAMPAIGNS", title: "Kampanya ve araştırma merkezi", subtitle: "Kaynakları incelenmiş kampanyaları, ücret tanımlarını ve uyum notlarını tek bir karar yolunda topluyoruz. Doğrulanmamış koşullar açıkça etiketlenir.", campaignsTab: "Kampanya radarı", newsTab: "Piyasa haberleri ve araştırma", verifiedTag: "Kaynak durumu", claimBtn: "Resmî koşulları gör ↗", readMore: "Raporun tamamını oku", newsCategories: { all: "Tüm haberler", rates: "Ücretler", compliance: "Uyum", research: "SEO raporları" } },
  fr: { eyebrow: "LIVE INTEL & CAMPAIGNS", title: "Centre des campagnes et recherches", subtitle: "Campagnes vérifiées par source, définitions des frais et notes de conformité réunies dans un même parcours de décision.", campaignsTab: "Radar des campagnes", newsTab: "Actualités et recherches", verifiedTag: "Statut de la source", claimBtn: "Voir les conditions officielles ↗", readMore: "Lire le rapport complet", newsCategories: { all: "Toutes les actualités", rates: "Frais", compliance: "Conformité", research: "Rapports SEO" } },
  de: { eyebrow: "LIVE INTEL & CAMPAIGNS", title: "Kampagnen- und Research-Hub", subtitle: "Quellengeprüfte Kampagnen, Gebührenbegriffe und Compliance-Hinweise in einem Entscheidungsweg.", campaignsTab: "Kampagnenradar", newsTab: "Marktnews und Research", verifiedTag: "Quellenstatus", claimBtn: "Offizielle Bedingungen ansehen ↗", readMore: "Vollständigen Bericht lesen", newsCategories: { all: "Alle Nachrichten", rates: "Gebühren", compliance: "Compliance", research: "SEO-Berichte" } },
  es: { eyebrow: "LIVE INTEL & CAMPAIGNS", title: "Centro de campañas e investigación", subtitle: "Campañas revisadas, definiciones de comisiones y notas de cumplimiento en un solo recorrido de decisión.", campaignsTab: "Radar de campañas", newsTab: "Noticias y análisis", verifiedTag: "Estado de la fuente", claimBtn: "Ver condiciones oficiales ↗", readMore: "Leer informe completo", newsCategories: { all: "Todas las noticias", rates: "Comisiones", compliance: "Cumplimiento", research: "Informes SEO" } },
  "pt-BR": { eyebrow: "LIVE INTEL & CAMPAIGNS", title: "Hub de campanhas e pesquisa", subtitle: "Campanhas verificadas por fonte, definições de taxas e notas de conformidade em um único caminho de decisão.", campaignsTab: "Radar de campanhas", newsTab: "Notícias e pesquisas", verifiedTag: "Status da fonte", claimBtn: "Ver termos oficiais ↗", readMore: "Ler relatório completo", newsCategories: { all: "Todas as notícias", rates: "Taxas", compliance: "Conformidade", research: "Relatórios SEO" } },
};

const mockNewsList = {
  "zh-Hans": [
    {
      id: "news-1",
      category: "rates",
      categoryName: "费率变动",
      time: "来源日期待补充",
      title: "OKX 调整 VIP3 梯次 Maker/Taker 费率结算机制",
      summary: "费率与活动条款可能按账户、地区和产品变化；请打开来源页面核对当前条件。",
      source: "OKX 官方",
      readTime: "2 min",
    },
    {
      id: "news-2",
      category: "research",
      categoryName: "SEO 研报",
      time: "研究资料待核验",
      title: "2026 CEX vs DEX 衍生品资金费率与清算滑点实测对比",
      summary: "研究页用于解释比较口径、数据来源与限制，不把静态资料当作实时行情或收益承诺。",
      source: "NexuAlpha Lab",
      readTime: "6 min",
    },
    {
      id: "news-3",
      category: "compliance",
      categoryName: "合规风向",
      time: "来源日期待补充",
      title: "Kraken 获得爱尔兰央行 EMI 电子货币机构牌照许可",
      summary: "地区服务、法币通道和资格需要以机构当前公告及用户所在地规则为准。",
      source: "Central Bank",
      readTime: "3 min",
    },
    {
      id: "news-4",
      category: "rates",
      categoryName: "返佣政策",
      time: "官方条款待核验",
      title: "Bitget 2026 年第一季度独家交易员手续费减免计划生效",
      summary: "新户活动、费率和用户权益需要在官方条款中逐项核验，页面不预先承诺具体金额。",
      source: "Bitget Desk",
      readTime: "1 min",
    },
  ],
  "zh-Hant": [
    {
      id: "news-1",
      category: "rates",
      categoryName: "費率變動",
      time: "來源日期待補充",
      title: "OKX 調整 VIP3 梯次 Maker/Taker 費率結算機制",
      summary: "費率與活動條款可能按帳戶、地區和產品變化；請打開來源頁面核對目前條件。",
      source: "OKX 官方",
      readTime: "2 min",
    },
    {
      id: "news-2",
      category: "research",
      categoryName: "SEO 研報",
      time: "研究資料待核驗",
      title: "2026 CEX vs DEX 衍生品資金費率與清算滑點實測對比",
      summary: "研究頁用於解釋比較口徑、資料來源與限制，不把靜態資料當作即時行情或收益承諾。",
      source: "NexuAlpha Lab",
      readTime: "6 min",
    },
    {
      id: "news-3",
      category: "compliance",
      categoryName: "合規風向",
      time: "來源日期待補充",
      title: "Kraken 獲得愛爾蘭央行 EMI 電子貨幣機構牌照許可",
      summary: "地區服務、法幣通道和資格需要以機構目前公告及用戶所在地規則為準。",
      source: "Central Bank",
      readTime: "3 min",
    },
    {
      id: "news-4",
      category: "rates",
      categoryName: "返佣政策",
      time: "官方條款待核驗",
      title: "Bitget 2026 年第一季獨家交易員手續費減免計劃生效",
      summary: "新戶活動、費率和用戶權益需要在官方條款中逐項核驗，頁面不預先承諾具體金額。",
      source: "Bitget Desk",
      readTime: "1 min",
    },
  ],
  en: [
    {
      id: "news-1",
      category: "rates",
      categoryName: "Fees",
      time: "Source date pending",
      title: "OKX Updates VIP3 Maker/Taker Tiered Settlement",
      summary: "Fee and campaign terms can vary by account, region, and product; verify the current official terms.",
      source: "OKX Official",
      readTime: "2 min",
    },
    {
      id: "news-2",
      category: "research",
      categoryName: "SEO Report",
      time: "Research review pending",
      title: "2026 CEX vs DEX Derivatives Slippage & Funding Benchmark",
      summary: "The research page explains comparison scope, sources, and limitations; it is not a live-market or return guarantee.",
      source: "NexuAlpha Lab",
      readTime: "6 min",
    },
    {
      id: "news-3",
      category: "compliance",
      categoryName: "Compliance",
      time: "Source date pending",
      title: "Kraken Secures EMI License from Central Bank of Ireland",
      summary: "Regional service, fiat rails, and eligibility depend on current official notices and the user's location.",
      source: "Central Bank",
      readTime: "3 min",
    },
    {
      id: "news-4",
      category: "rates",
      categoryName: "Rebates",
      time: "Official terms pending",
      title: "Bitget Q1 2026 Trader Fee Rebate Program Live",
      summary: "New-account offers, fee terms, and user benefits must be checked line by line in the official terms.",
      source: "Bitget Desk",
      readTime: "1 min",
    },
  ],
};

export function TopIntelligenceHub({ locale = "en" }) {
  const localeKey = String(locale || "en").toLowerCase() === "pt-br" ? "pt-BR" : String(locale || "en").split("-")[0];
  const isZh = locale.startsWith("zh");
  const isHant = locale === "zh-Hant" || locale === "zh-TW";
  const t = isHant ? hubCopy["zh-Hant"] : isZh ? hubCopy["zh-Hans"] : (hubCopy[locale] || hubCopy[localeKey] || hubCopy.en);
  const newsList = isHant ? mockNewsList["zh-Hant"] : isZh ? mockNewsList["zh-Hans"] : mockNewsList.en;

  const [newsFilter, setNewsFilter] = useState("all");

  const radarSlugs = useMemo(() => ["binance", "okx", "bybit", "bitget"], []);

  const campaigns = useMemo(() => {
    return radarSlugs.map((slug) => {
      const research = officialCampaignResearchByVenue[slug];
      const db = venueDatabase[slug] || {};
      const partner = partnerRegistry[slug] || {};

      const isZh = locale.startsWith("zh");
      const rewardSummary = isZh
        ? (research?.signupReward?.summary?.[locale] || research?.signupReward?.summary?.["zh-Hans"] || "")
        : (research?.signupReward?.summary?.en || research?.signupReward?.summary?.[locale] || "");
      const perkText = isZh
        ? (db.benefit?.[locale] || db.benefit?.["zh-Hans"] || "")
        : (db.benefit?.en || db.benefit?.[locale] || "");
      const commercialClaim = resolveCommercialClaim({ partner, venue: db });

      return {
        slug,
        name: db.name || partner.name || slug,
        category: db.category || partner.category || "CEX",
        inviteCode: db.inviteCode || partner.inviteCode,
        registrationUrl: partner.registrationUrl || db.registrationUrl,
        rewardSummary: commercialClaim.status === "verified" ? rewardSummary : (v3Copy(locale).verifyBefore || "User terms require official account verification"),
        perkText: commercialClaim.status === "verified" ? perkText : (v3Copy(locale).pendingReview || "User benefits require official verification"),
        claimStatus: commercialClaim.status,
        checkedAt: commercialClaim.checkedAt,
      };
    });
  }, [locale, radarSlugs]);

  const filteredNews = newsFilter === "all"
    ? newsList
    : newsList.filter((n) => n.category === newsFilter);

  return (
    <section className="top-hub-section v2-shell" id="campaigns">
      <div className="top-hub__header">
        <div className="top-hub__badge">
          <span className="top-hub__pulse"></span>
          {t.eyebrow}
        </div>
        <h2 className="top-hub__title">{t.title}</h2>
        <p className="top-hub__subtitle">{t.subtitle}</p>
      </div>

      <div className="top-hub__layout">
        {/* 左侧大模块：活动与上币中心 (Campaign & Listing Radar) */}
        <div className="top-hub__column top-hub__column--campaigns">
          <div className="top-hub__col-header">
            <div className="top-hub__col-title">
              <span className="top-hub__icon">🔥</span>
              <h3>{t.campaignsTab}</h3>
            </div>
            <span className="top-hub__col-tag">LIVE PERKS</span>
          </div>

          <div className="top-hub__campaign-grid">
            {campaigns.map((item) => (
              <article key={item.slug} className="hub-campaign-card">
                <div className="hub-campaign-card__header">
                  <div className="hub-campaign-card__brand">
                    <BrandMark slug={item.slug} compact />
                    <span className="hub-campaign-card__name" translate="no" lang="en">{item.name}</span>
                  </div>
                  <span className="hub-campaign-card__badge">{item.claimStatus === "verified" ? t.verifiedTag : (isZh ? "待核验" : ({ ja: "確認待ち", ko: "검토 대기", tr: "İnceleme bekliyor", fr: "Vérification en attente", de: "Prüfung ausstehend", es: "Revisión pendiente", "pt-BR": "Revisão pendente" }[localeKey] || "Pending review"))}</span>
                </div>

                <div className="hub-campaign-card__urgency">
                  <span>◷ {item.checkedAt ? `${isZh ? "来源核验" : v3Copy(locale).sourceIntake || "Source reviewed"}: ${new Date(item.checkedAt).toLocaleDateString(locale)}` : (isZh ? "来源日期待补充" : v3Copy(locale).pendingReview || "Source date pending")}</span>
                  <span>{isZh ? "资格与时效以官方条款为准" : "Eligibility and timing follow official terms"}</span>
                </div>

                <p className="hub-campaign-card__perk">{item.perkText}</p>

                <a
                  href={item.registrationUrl}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  className="hub-campaign-card__cta"
                >
                  {t.claimBtn}
                </a>
              </article>
            ))}
          </div>
        </div>

        {/* 右侧大模块：实时新闻与 SEO 研报板块 (Live News & Research) */}
        <div className="top-hub__column top-hub__column--news">
          <div className="top-hub__col-header">
            <div className="top-hub__col-title">
              <span className="top-hub__icon">⚡</span>
              <h3>{t.newsTab}</h3>
            </div>
            <div className="top-hub__news-filters">
              {Object.entries(t.newsCategories).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`top-hub__filter-btn ${newsFilter === key ? "top-hub__filter-btn--active" : ""}`}
                  onClick={() => setNewsFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="top-hub__news-list">
            {filteredNews.map((news) => (
              <article key={news.id} className="hub-news-card">
                <div className="hub-news-card__meta">
                  <span className={`hub-news-card__tag hub-news-card__tag--${news.category}`}>
                    {news.categoryName}
                  </span>
                  <time className="hub-news-card__time">{news.time}</time>
                </div>
                <h4 className="hub-news-card__headline">
                  <a href="#exchanges" className="hub-news-card__link">
                    {news.title}
                  </a>
                </h4>
                <p className="hub-news-card__summary">{news.summary}</p>
                <div className="hub-news-card__footer">
                  <span className="hub-news-card__source">🌐 {news.source}</span>
                  <span className="hub-news-card__read">⏱ {news.readTime}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TopIntelligenceHub;
