import { SignupEvidence } from "../shared/SignupEvidence.jsx";
/**
 * KolLandingPage — C3. KOL 专属落地页系统
 * 路由：/ref/:kol
 */
import { withoutTurkeyUnlisted } from "../../data/partner-geo-policy.js";
import React from "react";
import { venueDatabase } from "../../data/venue-database.js";
import { publicCtaForVenue, venueGoHref } from "../../data/source-bound-cta.js";
import { contextualHref } from "../../data/contextual-href.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import "./kol-landing-page.css";

const kolRegistry = {
  "crypto-zhang": {
    name: "老张 Crypto 频道",
    handle: "@zhang_crypto",
    badge: "NexuAlpha 首席战略合作伙伴",
    avatar: "",
    bio: {
      "zh-Hans": "欢迎来到老张的交易平台研究入口。开户前请核对地区资格、费率和官方账户条件。",
      "zh-Hant": "歡迎來到老張的交易平台研究入口。開戶前請核對地區資格、費率和官方帳戶條件。",
      en: "Explore Zhang's platform research routes. Verify regional eligibility, fees, and official account terms before registration.",
    },
    topVenues: ["okx", "binance", "bybit", "bitget"],
  },
  "alpha-king": {
    name: "Alpha King 链上研报",
    handle: "@alpha_king_hub",
    badge: "独立 DeFi & Perp DEX 推荐官",
    avatar: "",
    bio: {
      "zh-Hans": "专注链上衍生品与研究。使用入口前请核对协议、风险和地区可用性。",
      "zh-Hant": "專注鏈上衍生品與研究。使用入口前請核對協議、風險和地區可用性。",
      en: "On-chain perps research and discovery. Verify protocol terms, risks, and regional availability before using a route.",
    },
    topVenues: ["hyperliquid", "drift", "binance", "okx"],
  },
};

const defaultKol = {
  name: "NexuAlpha VIP 合作者通道",
  handle: "@nexualpha_official",
  badge: "官方 VIP 专享通道",
  avatar: "",
  bio: {
    "zh-Hans": "您正在访问 NexuAlpha 平台研究入口。用户权益和地区资格需在官方账户页面核验。",
    "zh-Hant": "您正在訪問 NexuAlpha 平台研究入口。用戶權益和地區資格需在官方帳戶頁面核驗。",
    en: "NexuAlpha platform research hub. Verify user benefits and regional eligibility on the official account page.",
  },
  topVenues: ["binance", "okx", "bybit", "bitget"],
};

export function KolLandingPage({ kolHandle = "crypto-zhang", locale = "en", market, product }) {
  const isZh = locale.startsWith("zh");
  const isHant = locale === "zh-Hant" || locale === "zh-TW";

  const kol = kolRegistry[kolHandle] || defaultKol;
  const bioText = kol.bio[locale] || kol.bio["zh-Hans"] || kol.bio.en;
  const localeKey = String(locale || "en").toLowerCase() === "pt-br" ? "pt-BR" : String(locale || "en").split("-")[0];
  const ctaCopy = {
    ja: ["公式登録を開く ↗", "公式条件を先に確認 ↗"], ko: ["공식 가입 열기 ↗", "공식 조건 먼저 확인 ↗"],
    tr: ["Resmi kaydı aç ↗", "Önce resmi koşulları incele ↗"], es: ["Abrir registro oficial ↗", "Ver primero las condiciones oficiales ↗"],
    "pt-BR": ["Abrir cadastro oficial ↗", "Ver os termos oficiais primeiro ↗"], fr: ["Ouvrir l’inscription officielle ↗", "Voir d’abord les conditions officielles ↗"],
    de: ["Offizielle Registrierung öffnen ↗", "Zuerst offizielle Bedingungen prüfen ↗"], ru: ["Открыть официальную регистрацию ↗", "Сначала проверить официальные условия ↗"],
    ar: ["فتح التسجيل الرسمي ↗", "راجع الشروط الرسمية أولاً ↗"], id: ["Buka pendaftaran resmi ↗", "Tinjau ketentuan resmi dulu ↗"],
    vi: ["Mở đăng ký chính thức ↗", "Xem điều kiện chính thức trước ↗"], it: ["Apri la registrazione ufficiale ↗", "Controlla prima i termini ufficiali ↗"],
    // l10n: needs native review
    ur: ["سرکاری رجسٹریشن کھولیں ↗", "پہلے سرکاری شرائط دیکھیں ↗"],
    // l10n: needs native review
    uk: ["Відкрити офіційну реєстрацію ↗", "Спершу переглянути офіційні умови ↗"],
  }[localeKey] || ["Open official registration ↗", "Review official terms first ↗"];

  return (
    <main className="v6 v2-page v3-page kol-page" id="top">
      <section className="kol-hero v2-shell">
        <div className="kol-hero__header">
          <div className="kol-hero__avatar-wrap">
            <span className="kol-hero__avatar">{kol.avatar}</span>
          </div>
          <div>
            <span className="kol-hero__badge">{kol.badge}</span>
            <h1 className="kol-hero__title">{kol.name}</h1>
            <p className="kol-hero__handle">{kol.handle}</p>
          </div>
        </div>

        <div className="kol-hero__bio-box">
          <p>{bioText}</p>
        </div>
      </section>

      <section className="kol-venues-section v2-shell">
          <h2 className="kol-venues__title">
          {isZh ? "平台官方入口与条件核验" : "Official venue routes and terms to verify"}
        </h2>

        <div className="kol-venues__grid">
          {withoutTurkeyUnlisted(kol.topVenues, { locale, market }).map((slug) => {
            const db = venueDatabase[slug] || {};
            const cta = publicCtaForVenue(slug, locale, market);
            const inviteCode = cta.inviteCode;
            const registrationHref = venueGoHref(slug, "kol-venue-card", locale, market);
            const directRoute = Boolean(registrationHref);
            const routeHref = directRoute
              ? registrationHref
              : contextualHref(`/exchanges/${slug}#registration-path`, { locale, market, product });
            const benefit = cta.benefit;

            return (
              <article key={slug} className="kol-venue-card">
                <div className="kol-venue-card__top">
                  <div className="kol-venue-card__brand">
                    <BrandMark slug={slug} compact />
                    <h3 className="kol-venue-card__name" translate="no" lang="en">{db.name || slug}</h3>
                  </div>
                  <span className="kol-venue-card__tag">{directRoute ? (isZh ? "合作条件已核验" : "Partner terms verified") : (isZh ? "先核验官方条件" : "Verify official terms first")}</span>
                </div>

                {inviteCode && (
                  <div className="kol-venue-card__code-row">
                    <span>{isZh ? "专属邀请码" : "Code"}:</span>
                    <strong className="kol-venue-card__code" translate="no">{inviteCode}</strong>
                  </div>
                )}

                {benefit && <p className="kol-venue-card__benefit">{benefit}</p>}

                <span data-signup-cta={slug} className="signup-cta-block"><a
                  href={routeHref}
                  target={directRoute ? "_blank" : undefined}
                  rel={directRoute ? "sponsored noopener noreferrer" : undefined}
                  className="kol-venue-card__cta"
                  data-cta-kind={directRoute ? "registration" : "research"}
                  data-cta-platform={slug}
                  data-cta-placement="kol-venue-card"
                  data-growth-decision={slug}
                  data-growth-placement="kol-venue-card"
                  data-growth-market={market}
                  data-growth-product={product}
                >
                  {directRoute ? (isZh ? "前往官方注册开户 ↗" : ctaCopy[0]) : (isZh ? "先查看官方条件 ↗" : ctaCopy[1])}
                </a><SignupEvidence slug={slug} locale={locale} market={market} /></span>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default KolLandingPage;
