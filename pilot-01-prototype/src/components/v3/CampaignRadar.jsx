/**
 * CampaignRadar — 主流交易所实时活动与迎新礼包雷达
 * 替代首页多此一举的反钓鱼核验，直接呈现各大交易所最新官方活动、迎新奖励与空投福利
 */
import React, { useState, useMemo } from "react";
import { BrandMark } from "../brand/BrandMark.jsx";
import { partnerRegistry } from "../../data/partner-registry.js";
import { venueDatabase } from "../../data/venue-database.js";
import { officialCampaignResearchByVenue } from "../../data/official-campaign-research.js";
import { resolveCommercialClaim } from "../../data/commercial-claims.js";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { contextualHref } from "../../data/contextual-href.js";
import { v3Copy } from "../../data/v3-product.js";
import "./campaign-radar.css";

const copy = {
  "zh-Hans": {
    badge: "来源雷达",
    title: "主流交易所活动与迎新礼包雷达",
    subtitle: "来源已审阅的官方活动线索；资格、期限与用户权益仍需在账户页面逐项确认。",
    tabAll: "全部热门",
    tabCex: "中心化大厂 (CEX)",
    tabDex: "链上与衍生品 (DEX)",
    officialSources: "官方公告与活动来源",
    termsNote: "参与条款要点",
    claimBtn: "查看官方条款 ↗",
    verifiedTag: "来源已审阅",
    directHub: "官方活动中心",
  },
  "zh-Hant": {
    badge: "來源雷達",
    title: "主流交易所活動與迎新禮包雷達",
    subtitle: "來源已審閱的官方活動線索；資格、期限與用戶權益仍需在帳戶頁面逐項確認。",
    tabAll: "全部熱門",
    tabCex: "中心化大廠 (CEX)",
    tabDex: "鏈上與衍生品 (DEX)",
    officialSources: "官方公告與活動來源",
    termsNote: "參與條款要點",
    claimBtn: "查看官方條款 ↗",
    verifiedTag: "來源已審閱",
    directHub: "官方活動中心",
  },
  en: {
    badge: "Source Radar",
    title: "Official Exchange Campaigns & Welcome Packs",
    subtitle: "Source-reviewed official activity leads. Eligibility, timing and user benefits still require account-level confirmation.",
    tabAll: "All Top Venues",
    tabCex: "Major CEXs",
    tabDex: "DEX & Perps",
    officialSources: "Official Sources & Hubs",
    termsNote: "Key Participation Terms",
    claimBtn: "Review Official Terms ↗",
    verifiedTag: "Source Reviewed",
    directHub: "Official Activity Hub",
  },
  ja: { badge: "公式情報レーダー", title: "取引所キャンペーンと新規特典", subtitle: "公式情報を確認した活動一覧です。資格・期限・特典はアカウント画面で確認してください。", tabAll: "すべて", tabCex: "主要CEX", tabDex: "DEX・パーペチュアル", officialSources: "公式情報・キャンペーン", termsNote: "参加条件", claimBtn: "公式条件を確認 ↗", verifiedTag: "情報確認済み", directHub: "公式キャンペーン" },
  ko: { badge: "공식 정보 레이더", title: "거래소 캠페인 및 신규 혜택", subtitle: "공식 출처를 검토한 활동입니다. 자격·기간·혜택은 계정 화면에서 확인하세요.", tabAll: "전체", tabCex: "주요 CEX", tabDex: "DEX·퍼펙추얼", officialSources: "공식 출처·캠페인", termsNote: "참여 조건", claimBtn: "공식 조건 확인 ↗", verifiedTag: "출처 검토됨", directHub: "공식 캠페인" },
  tr: { badge: "Resmî bilgi radarı", title: "Borsa kampanyaları ve yeni üye fırsatları", subtitle: "Resmî kaynakları incelenmiş fırsatlar. Uygunluk, süre ve avantajları hesap ekranında doğrulayın.", tabAll: "Tümü", tabCex: "Başlıca CEX", tabDex: "DEX ve Perpetual", officialSources: "Resmî kaynaklar ve kampanyalar", termsNote: "Katılım koşulları", claimBtn: "Resmî koşulları incele ↗", verifiedTag: "Kaynak incelendi", directHub: "Resmî kampanya" },
};

export function CampaignRadar({ locale = "en" }) {
  const isZh = locale.startsWith("zh");
  const isHant = locale === "zh-Hant" || locale === "zh-TW";
  const t = copy[locale] || copy[String(locale || "").split("-")[0]] || (isHant ? copy["zh-Hant"] : isZh ? copy["zh-Hans"] : copy.en);
  const localized = locale !== "en";

  const [activeTab, setActiveTab] = useState("all");

  // 精选主流最具吸引力的 12 家大厂/DEX 活动呈现于首页
  const radarSlugs = useMemo(() => [
    "binance", "okx", "bybit", "bitget", "gate-io", "kucoin", "mexc", "backpack", "deribit", "hyperliquid", "drift", "gmx"
  ], []);

  const campaigns = useMemo(() => {
    return radarSlugs.map((slug) => {
      const research = officialCampaignResearchByVenue[slug];
      const db = venueDatabase[slug] || {};
      const partner = partnerRegistry[slug] || {};
      const commercialClaim = resolveCommercialClaim({ partner, venue: db });
      const publicCta = publicCtaForVenue(slug, locale);

      const isZh = locale.startsWith("zh");
      const summaryText = isZh
        ? (research?.summary?.[locale] || research?.summary?.["zh-Hans"] || "")
        : (research?.summary?.en || research?.summary?.[locale] || "");
      const rewardSummary = isZh
        ? (research?.signupReward?.summary?.[locale] || research?.signupReward?.summary?.["zh-Hans"] || "")
        : (research?.signupReward?.summary?.en || research?.signupReward?.summary?.[locale] || "");
      const conditions = research?.signupReward?.conditions || [];
      const sources = research?.sources || [];
      const perkText = isZh
        ? (db.benefit?.[locale] || db.benefit?.["zh-Hans"] || "")
        : (db.benefit?.en || db.benefit?.[locale] || "");
      const welcomeBadge = isZh
        ? (db.welcomeRewardBadge?.[locale] || db.welcomeRewardBadge?.["zh-Hans"] || "")
        : (db.welcomeRewardBadge?.en || db.welcomeRewardBadge?.[locale] || "");

      return {
        slug,
        name: db.name || partner.name || slug,
        category: db.category || partner.category || "CEX",
        inviteCode: publicCta.hasReferral ? (db.inviteCode || partner.inviteCode) : null,
        registrationUrl: publicCta.registrationUrl,
        hasReferral: publicCta.hasReferral,
        summaryText,
        rewardSummary,
        conditions,
        sources,
        checkedAt: research?.checkedAt || null,
        perkText,
        welcomeBadge: commercialClaim.status === "verified" ? welcomeBadge : "",
        commercialClaim,
      };
    });
  }, [locale, radarSlugs]);

  const filteredCampaigns = useMemo(() => {
    if (activeTab === "cex") return campaigns.filter(c => c.category === "CEX");
    if (activeTab === "dex") return campaigns.filter(c => c.category !== "CEX");
    return campaigns;
  }, [campaigns, activeTab]);

  return (
    <section className="campaign-radar-section v2-shell" id="campaigns">
      <div className="campaign-radar__header">
        <div className="campaign-radar__pill-tag">
          <span className="campaign-radar__pulse"></span>
          {t.badge}
        </div>
        <h2 className="campaign-radar__title">{t.title}</h2>
        <p className="campaign-radar__subtitle">{t.subtitle}</p>

        <div className="campaign-radar__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            className={`campaign-radar__tab ${activeTab === "all" ? "campaign-radar__tab--active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            {t.tabAll}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "cex"}
            className={`campaign-radar__tab ${activeTab === "cex" ? "campaign-radar__tab--active" : ""}`}
            onClick={() => setActiveTab("cex")}
          >
            {t.tabCex}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "dex"}
            className={`campaign-radar__tab ${activeTab === "dex" ? "campaign-radar__tab--active" : ""}`}
            onClick={() => setActiveTab("dex")}
          >
            {t.tabDex}
          </button>
        </div>
      </div>

      <div className="campaign-radar__grid">
        {filteredCampaigns.map((item) => (
          <article key={item.slug} className="campaign-card">
            <div className="campaign-card__header">
              <div className="campaign-card__brand">
                <div className="campaign-card__logo-wrap">
                  <BrandMark slug={item.slug} compact />
                </div>
                <div>
                  <h3 className="campaign-card__name" translate="no" lang="en">{item.name}</h3>
                  <span className="campaign-card__category">{item.category}</span>
                </div>
              </div>
              <span className="campaign-card__badge-verified">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t.verifiedTag}
              </span>
            </div>

            <div className="campaign-card__urgency-bar">
              <span className="campaign-card__timer"> {item.checkedAt ? `${localized ? (locale === "ja" ? "情報確認：" : locale === "ko" ? "출처 검토: " : locale === "tr" ? "Kaynak inceleme: " : isZh ? "来源审阅：" : "Source reviewed: ") : "Source reviewed: "}${item.checkedAt}` : (localized ? (locale === "ja" ? "確認日未設定" : locale === "ko" ? "검토 날짜 없음" : locale === "tr" ? "İnceleme tarihi yok" : isZh ? "来源日期待补充" : "Review date unavailable") : "Review date unavailable")}</span>
              <span className="campaign-card__quota">{localized ? (locale === "ja" ? "資格と期間は公式アカウントを確認" : locale === "ko" ? "자격과 기간은 공식 계정 기준" : locale === "tr" ? "Uygunluk ve süre resmî hesaba bağlıdır" : isZh ? "资格与期限需以官方账户为准" : "Eligibility and timing depend on the official account") : "Eligibility and timing depend on the official account"}</span>
            </div>

            {item.welcomeBadge && (
              <div className="campaign-card__bonus-pill">
                <span>{item.welcomeBadge}</span>
              </div>
            )}

            <div className="campaign-card__perk-hero">
              <div className="campaign-card__perk-tag">
                {localized ? (locale === "ja" ? "ユーザー特典の状態" : locale === "ko" ? "사용자 혜택 상태" : locale === "tr" ? "Kullanıcı avantajı durumu" : isZh ? "用户权益状态" : "User Benefit Status") : "User Benefit Status"}
              </div>
              <p className="campaign-card__perk-text">{item.commercialClaim.status === "verified" ? item.perkText : (localized ? (locale === "ja" ? "特典は公式確認が必要です。情報要約は個人資格や報酬を保証しません。" : locale === "ko" ? "혜택은 공식 확인이 필요합니다. 출처 요약은 개인 자격이나 보상을 보장하지 않습니다." : locale === "tr" ? "Kullanıcı avantajları resmî doğrulama gerektirir; kaynak özeti kişisel uygunluk veya ödül garantisi değildir." : isZh ? "用户权益待官方核验；来源摘要不等于个人资格或保证奖励。" : v3Copy(locale).pendingReview || "User benefits require official verification") : v3Copy(locale).pendingReview || "User benefits require official verification" )}</p>
            </div>

            {item.rewardSummary && (
              <p className="campaign-card__summary">{item.rewardSummary}</p>
            )}

            {item.conditions.length > 0 && (
              <div className="campaign-card__terms-box">
                <div className="campaign-card__terms-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  {t.termsNote}
                </div>
                <ul className="campaign-card__terms-list">
                  {item.conditions.slice(0, 2).map((cond, idx) => {
                    const condText = isZh ? (cond?.[locale] || cond?.["zh-Hans"] || "") : (cond?.[locale] || cond?.en || String(cond));
                    return <li key={idx}>{condText}</li>;
                  })}
                </ul>
              </div>
            )}

            <div className="campaign-card__footer">
              {item.sources.length > 0 && (
                <div className="campaign-card__sources">
                  {item.sources.slice(0, 1).map((src) => (
                    <a
                      key={src.id}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="campaign-card__source-link"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      {src.title || t.directHub}
                    </a>
                  ))}
                </div>
              )}

              <a
                href={item.hasReferral && /^https:\/\//i.test(item.registrationUrl || "")
                  ? item.registrationUrl
                  : contextualHref(`/exchanges/${item.slug}#registration-path`, { locale })}
                target={item.hasReferral && /^https:\/\//i.test(item.registrationUrl || "") ? "_blank" : undefined}
                rel={item.hasReferral && /^https:\/\//i.test(item.registrationUrl || "") ? "sponsored noopener noreferrer" : undefined}
                className="campaign-card__cta"
                data-cta-kind={item.hasReferral && /^https:\/\//i.test(item.registrationUrl || "") ? "registration" : "research"}
                data-cta-platform={item.slug}
                data-cta-placement="campaign-radar"
                data-cta-status={item.commercialClaim.status}
                data-growth-decision={item.slug}
                data-growth-placement="campaign-radar"
              >
                <span>{item.hasReferral && /^https:\/\//i.test(item.registrationUrl || "") ? (localized ? (locale === "ja" ? "公式登録へ進む ↗" : locale === "ko" ? "공식 가입으로 이동 ↗" : locale === "tr" ? "Resmî kayda git ↗" : isZh ? "前往官方注册开户 ↗" : "Open official registration ↗") : "Open official registration ↗") : t.claimBtn}</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default CampaignRadar;
