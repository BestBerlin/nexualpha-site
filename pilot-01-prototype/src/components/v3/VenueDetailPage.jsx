// Venue detail route (/exchanges/<slug>): its own route module and chunk (route-v3-venue) since the venue-graph perf
// lane (2026-10-11). Before, it lived inside V3Pages.jsx, so every venue page downloaded the compare, activity and
// topic-guide graphs (39 chunks, 1.3 MB) after hydration. The stylesheets it relies on keep their "route-v3-pages-"
// chunk names (profile-density, growth-conversion, Hyperliquid scenario) so the Worker links them exactly as before.
import "./profile-density.css";
import { useEffect, useState } from "react";
import { sectionEyebrowAttrs } from "../../data/section-eyebrow.js";
import { TelegramAlertsStrip } from "./TelegramAlertsStrip.jsx";
import { BrandMark } from "../brand/BrandMark";
import { compareSlug, v3Copy, venueProfile } from "../../data/v3-product";
import { OutboundHandoff } from "./OutboundHandoff";
import { ExchangeFactsV5, feesCheckedLabel, feesStatusLabel } from "./ExchangeFactsV5.jsx";
import { VenueFeeLedger, VenueRoute } from "../v6/InnerLedger.jsx";
import { isoDay } from "../../data/exchange-facts.js";
import { HyperliquidFeeScenario } from "./HyperliquidFeeScenario.jsx";
import { priorityVenueAnswerFor } from "../../data/priority-venue-answers.js";
import { decisionForVenue, hasReviewedEditorialDecision } from "../../data/venue-decision-content.js";
import { campaignCopy } from "./activity/campaign-copy";
import { researchForVenue } from "../../data/exchange-research";
import { buildVenueFeeSummary } from "../../data/venue-fee-summary.js";
import { getLocalizedVenueName } from "../../utils/venue-name-helper.js";
import { buildTelegramWebsiteFunnelContext, getTelegramDeepLink } from "../../data/telegram-config.js";
import { directoryContextSearch } from "../../data/directory-context.js";
import { appendDecisionPassportQuery } from "../../data/decision-passport.js";
import { publicCtaForVenue } from "../../data/source-bound-cta.js";
import { sanitizePublicText } from "../../data/public-copy-sanitizer.js";
import { regionalVenueCta } from "../../data/source-bound-cta.js";
import { buildRegistrationDecisionState } from "./registration-decision-state.js";
import { ctaUiCopy, trackCodeCopy } from "../../data/cta-ui-copy.js";
import { VenueReadinessChecklist } from "./VenueReadinessChecklist.jsx";
import { TelegramReturnBanner } from "./TelegramReturnBanner.jsx";
import { footerDisclosureLabel } from "./CleanFooter.jsx";
import { formatPercent } from "../../data/format-percent.js";
import { referralSeoFor } from "../../data/referral-seo.js";
import { showFewerPlatforms, showMorePlatforms } from "../../data/plural-copy.js";
import "./growth-conversion.css";
import { localeKey, textLocaleKey, zhText, localePending, interfaceText, detailCtaLabel, LocalLink, isoDates, publishableFeeRate } from "./v3-pages-shared.jsx";
import { detailUi, dexFeeCompactUi, copyFeedbackLabel, useCopyFeedback, CopyFeedbackStatus, telegramLocaleUi } from "./venue-detail-shared.jsx";
import { VenueFaqSection } from "./VenueFaqSection.jsx";
import { DeferUntilVisible } from "../shared/DeferUntilVisible.jsx";


const invitationSummaryByLocale = {
  en: { label: "Invitation summary", note: "Review invitation details and account conditions." },
  "zh-Hans": { label: "邀请信息摘要", note: "查看邀请信息与账户条件。" },
  "zh-Hant": { label: "邀請資訊摘要", note: "查看邀請資訊與帳戶條件。" },
  es: { label: "Resumen de invitación", note: "Revisa los datos de invitación y las condiciones de la cuenta." },
  "pt-BR": { label: "Resumo do convite", note: "Confira os dados do convite e as condições da conta." },
  fr: { label: "Résumé de l’invitation", note: "Consultez les informations d’invitation et les conditions du compte." },
  de: { label: "Einladungsübersicht", note: "Einladungsdetails und Kontobedingungen prüfen." },
  ja: { label: "紹介情報の概要", note: "招待情報と口座条件を確認できます。" },
  ko: { label: "추천 정보 요약", note: "초대 정보와 계정 조건을 확인하세요." },
  ar: { label: "ملخص الإحالة", note: "راجع تفاصيل الدعوة وشروط الحساب." },
  tr: { label: "Referans özeti", note: "Davet bilgilerini ve hesap koşullarını inceleyin." },
  ru: { label: "Сводка приглашения", note: "Проверьте данные приглашения и условия аккаунта." },
  id: { label: "Ringkasan referral", note: "Periksa informasi undangan dan ketentuan akun." },
  vi: { label: "Tóm tắt giới thiệu", note: "Xem thông tin lời mời và điều kiện tài khoản." },
  it: { label: "Riepilogo invito", note: "Consulta i dettagli dell’invito e le condizioni del conto." },
};

const officialFlowLabelByLocale = {
  en: "Verify in official flow",
  "zh-Hans": "官方流程核验",
  "zh-Hant": "官方流程核驗",
  es: "Verificar en el flujo oficial",
  "pt-BR": "Verificar no fluxo oficial",
  fr: "Vérifier dans le parcours officiel",
  de: "Im offiziellen Ablauf prüfen",
  ja: "公式手続きで確認",
  ko: "공식 절차에서 확인",
  ar: "تحقق داخل المسار الرسمي",
  tr: "Resmî akışta doğrula",
  ru: "Проверить в официальном процессе",
  id: "Verifikasi di alur resmi",
  vi: "Xác minh trong luồng chính thức",
  it: "Verifica nel flusso ufficiale",
};

const officialFlowLabel = (locale) => officialFlowLabelByLocale[textLocaleKey(locale)] || officialFlowLabelByLocale.en;
const detailRuntimeUi = (locale, text, venueName) => ({
  pendingVerification: localePending(locale),
  noSource: text.pendingReview,
  globalVerification: text.verifyBefore,
  productTerms: text.openOfficialSource,
  calculatorOpen: text.comparisonMatrix,
  calculatorTitle: (name = venueName) => `${name} · ${text.comparisonMatrix}`,
  monthlyVolume: `${text.researchScope}: `,
  volumeSlider: text.comparisonMatrix,
  calculatorPending: text.ctaLocked,
  calculatorBenefit: (code) => `${text.partnerState}: ${code}`,
  preRegister: text.registrationPrepCta,
  preRegisterHint: text.detailPreKycFunding,
  similarOpen: text.detailCompare,
  // "Show N more platforms" / "Show fewer" with CLDR plurals in every locale (audit NX-07: French showed "1 plateformes").
  showFewer: showFewerPlatforms(locale),
  showMore: (count) => showMorePlatforms(count, locale),
  stickyQuickAction: text.registrationPrepCta,
  stickyOfficial: text.officialDomain,
  stickyFeeBenefit: text.partnerState,
  stickyDirectRoute: text.conversionPath,
});

const venueDirectAnswerOverrides = {
  en: {
    binance: {
      title: "Binance decision check: verify fees, KYC, fiat route and product scope before registration.",
      body: "Treat Binance as a broad CEX candidate, not as an automatic fit. Before opening the protected registration route, check the published fee table, identity verification status, supported region, fiat funding method and the exact spot or derivatives product you need. Final eligibility and any user benefit must appear in the official account flow.",
      checks: ["Fees: published spot, futures and account-tier schedule", "KYC: identity, residence and account review", "Fiat route: card, bank or local rail varies by market", "Best for: broad CEX product and liquidity comparison", "Not for: users who need guaranteed approval, fiat access or bonus", "Next step: compare Binance vs OKX or continue through the protected CTA"],
      boundary: "This page does not promise Binance account approval, fiat availability, product access, rebate settlement, bonus eligibility or final net trading cost.",
      sources: [
        ["Binance Trading Fees", "https://www.binance.com/en/fee/trading"],
        ["Binance Identity Verification", "https://www.binance.com/en/support/faq/detail/360027287111"],
        ["Binance Supported Regions", "https://www.binance.com/en-GB/support-region-list"],
      ],
      internalLinks: [
        ["Compare Binance vs OKX", "/compare/binance-vs-okx"],
        ["Use the public fee scenario tool", "/rates?product=spot"],
      ],
      registrationSlug: "binance",
    },
    hyperliquid: {
      title: "Hyperliquid fees are a stack: rolling maker/taker tier, referral discount, hourly funding, collateral route, liquidation rule and wallet permission.",
      body: "Before a Hyperliquid perp order, verify the rolling 14-day fee tier, expected hourly funding direction, referral discount or reward boundary, maintenance-margin trigger, account-abstraction collateral mode, native USDC or bridge route, vault context, and whether the action is signed by the master wallet, sub-account or API wallet. A cashback search should be checked against official referral terms; a funded-account search should separate self-funded collateral and vault participation from third-party trader-funding claims.",
      reviewedAt: "2026-09-15",
      reviewedLabel: "Official sources reviewed September 15, 2026",
      costFormulaLabel: "Pre-trade cost model",
      costFormula: "round-trip trading fees ± hourly funding + spread/slippage + collateral transfer and exit cost",
      checks: ["Rolling fee tier, referral discount and hourly funding", "Collateral, margin and liquidation", "Vault, sub-account and API-wallet permissions"],
      boundary: "This page does not promise Hyperliquid cashback, a funded account, third-party capital allocation, account-opening result, discount, vault return or final net trading cost.",
      sources: [
        ["Hyperliquid Fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees"],
        ["Hyperliquid Funding", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/funding"],
        ["Hyperliquid Referrals", "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals"],
        ["Hyperliquid Liquidations", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/liquidations"],
      ],
      internalLinks: [
        ["Compare Hyperliquid vs dYdX", "/compare/hyperliquid-vs-dydx"],
        ["Open the Perp DEX cost-field dictionary", "/topics/derivatives#perp-cost-field-dictionary"],
        ["Read the dated Hyperliquid vs dYdX source explainer", "/news/hyperliquid-vs-dydx"],
        ["Use the fee scenario tool", "/rates?product=perp"],
      ],
    },
    uniswap: {
      title: "Uniswap testnet and mainnet checks start with the official app, docs, token contract, approval and wallet preview.",
      body: "Before connecting a wallet or signing a swap, verify the official app domain and docs, selected network, token contract, pool or route, v4 deployment mapping, Permit2 or approval spender, gas asset, quoted output and final wallet transaction preview. Local hook tests or testnet work do not prove mainnet liquidity, execution quality or token safety.",
      checks: ["Official app and docs", "Testnet vs mainnet route", "Token contract, Permit2, gas and wallet preview"],
    },
  },
  de: {
    uniswap: {
      title: "Uniswap in Deutschland prüfen: Es geht um Wallet, Netzwerk, Tokenvertrag, Gas und Route – nicht um ein Börsenkonto.",
      body: "Für Nutzer in Deutschland ist Uniswap keine klassische CEX-Anmeldung mit Euro-Einzahlung oder verwahrtem Konto. Prüfe zuerst die offizielle App-Domain, das Netzwerk, die Tokenadresse, v4-Deployments, Pool- oder Hook-Gebühren, Gas, Slippage und die Wallet-Freigabe. Eine Testnet- oder Entwicklerroute beweist keine sichere produktive Swap-Route.",
      checks: ["Offizielle App und v4-Deployments", "Wallet-Freigabe, Gas und Slippage", "Keine Verwahrung, keine Euro-Einzahlung, kein Renditeversprechen"],
      boundary: "NexuAlpha bestätigt hier keine deutsche Verfügbarkeit, keine Steuerfolge, keinen Tokenwert und keinen individuellen Kostenvorteil. Die endgültige Aktion wird in der Wallet und auf der offiziellen Uniswap-Oberfläche geprüft.",
      sources: [
        ["Uniswap v4 deployments", "https://developers.uniswap.org/docs/protocols/v4/deployments"],
        ["Uniswap support: token swaps", "https://support.uniswap.org/hc/en-us/articles/8370549680909-How-to-swap-tokens"],
      ],
      internalLinks: [
        ["Uniswap vs Jupiter vergleichen", "/compare/uniswap-vs-jupiter"],
        ["Gebührenrechner öffnen", "/rates?product=swap&market=DE"],
        ["On-chain Liquidität prüfen", "/onchain?market=DE&product=swap"],
      ],
    },
  },
};

const venueDirectAnswerFor = (locale, slug) => {
  const key = localeKey(locale);
  return venueDirectAnswerOverrides[locale]?.[slug]
    || venueDirectAnswerOverrides[key]?.[slug]
    || (key === "en" ? venueDirectAnswerOverrides.en?.[slug] : null);
};


const uniswapShortChecklistCopy = {
  en: {
    summary: "3 checks before signing on Uniswap",
    hint: "Open this short checklist before leaving NexuAlpha: interface, network, final mainnet wallet preview.",
    stages: [
      ["interface", "Interface", "Start from the official Uniswap app and docs; do not connect a wallet from an unverified search result, social link or copied contract."],
      ["network", "Network", "Separate API or testnet practice from the live web route; choose the intended chain and verify token contract, route, approval or Permit2 spender."],
      ["preview", "Final mainnet preview", "Read the wallet's final mainnet transaction preview, gas asset and approval request before signing. Testnet support does not prove mainnet liquidity or token safety."],
    ],
    officialApp: "Open official Uniswap app",
    internalCta: "Compare Uniswap vs Jupiter",
  },
  "zh-Hans": {
    summary: "签名前先做 3 个短核验",
    hint: "离开 NexuAlpha 前先展开短清单核对：界面、网络、最终主网钱包预览。",
    stages: [
      ["interface", "界面", "从官方 Uniswap App 和文档开始；不要从未核验的搜索结果、社交链接或复制合约连接钱包。"],
      ["network", "网络", "把 API 或测试网练习和真实 Web 路径分开；选择目标链，并核对代币合约、路径、approval 或 Permit2 spender。"],
      ["preview", "最终主网预览", "签名前阅读钱包里的最终主网交易预览、gas 资产和授权请求。测试网支持不能证明主网流动性或代币安全。"],
    ],
    officialApp: "打开 Uniswap 官方 App",
    internalCta: "比较 Uniswap vs Jupiter",
  },
  "zh-Hant": {
    summary: "簽名前先做 3 個短核驗",
    hint: "離開 NexuAlpha 前先展開短清單核對：介面、網路、最終主網錢包預覽。",
    stages: [
      ["interface", "介面", "從官方 Uniswap App 和文件開始；不要從未核驗的搜尋結果、社群連結或複製合約連接錢包。"],
      ["network", "網路", "把 API 或測試網練習和真實 Web 路徑分開；選擇目標鏈，並核對代幣合約、路徑、approval 或 Permit2 spender。"],
      ["preview", "最終主網預覽", "簽名前閱讀錢包裡的最終主網交易預覽、gas 資產和授權請求。測試網支援不能證明主網流動性或代幣安全。"],
    ],
    officialApp: "打開 Uniswap 官方 App",
    internalCta: "比較 Uniswap vs Jupiter",
  },
};

const sourceHrefByLabel = (sources = [], matcher, fallback) => {
  const match = sources.find(([label]) => matcher.test(String(label || "")));
  return match?.[1] || fallback;
};

function UniswapShortVerificationChecklist({ locale, priorityAnswer, resolveInternalHref }) {
  const copy = uniswapShortChecklistCopy[locale];
  if (!copy || !priorityAnswer) return null;
  const officialAppHref = sourceHrefByLabel(priorityAnswer.sources, /official app/i, "https://app.uniswap.org/");
  const internalTarget = priorityAnswer.primaryNextAction || priorityAnswer.internalLinks?.[0] || [copy.internalCta, "/compare/uniswap-vs-jupiter"];
  const [internalLabel, internalHref] = internalTarget;

  return (
    <details className="v3-uniswap-short-checklist" data-uniswap-short-checklist="true" lang={locale}>
      <summary>
        <span>{copy.summary}</span>
        <small>{copy.hint}</small>
      </summary>
      <ol className="v3-uniswap-short-checklist__steps" aria-label={copy.summary}>
        {copy.stages.map(([stage, label, body]) => (
          <li key={stage} data-uniswap-check-stage={stage}>
            <b>{label}</b>
            <span>{body}</span>
          </li>
        ))}
      </ol>
      <div className="v3-uniswap-short-checklist__links">
        <a
          href={officialAppHref}
          target="_blank"
          rel="noopener noreferrer"
          data-cta-kind="source"
          data-cta-placement="uniswap-short-checklist-source"
        >
          {copy.officialApp} ↗
        </a>
        <LocalLink
          locale={locale}
          href={resolveInternalHref(internalHref)}
          data-cta-kind="research"
          data-cta-placement="uniswap-short-checklist-internal"
        >
          {internalLabel || copy.internalCta}
        </LocalLink>
      </div>
    </details>
  );
}

const detailRegistrationReviewLabel = (locale, { hasReferral }) => {
  const labels = {
    "zh-Hans": { code: "核对邀请码与注册条件", route: "核对官网与注册条件" },
    "zh-Hant": { code: "核對邀請碼與註冊條件", route: "核對官網與註冊條件" },
    es: { code: "Revisar código y condiciones de registro", route: "Revisar dominio y condiciones de registro" },
    "pt-BR": { code: "Revisar código e condições de cadastro", route: "Revisar domínio e condições de cadastro" },
    fr: { code: "Vérifier le code et les conditions d’inscription", route: "Vérifier le domaine et les conditions d’inscription" },
    de: { code: "Code und Registrierungsbedingungen prüfen", route: "Domain und Registrierungsbedingungen prüfen" },
    ja: { code: "コードと登録条件を確認", route: "公式ドメインと登録条件を確認" },
    ko: { code: "코드와 가입 조건 확인", route: "공식 도메인과 가입 조건 확인" },
    ar: { code: "تحقق من الرمز وشروط التسجيل", route: "تحقق من النطاق وشروط التسجيل" },
    tr: { code: "Kodu ve kayıt koşullarını kontrol et", route: "Resmî alanı ve kayıt koşullarını kontrol et" },
    ru: { code: "Проверить код и условия регистрации", route: "Проверить домен и условия регистрации" },
    id: { code: "Periksa kode dan syarat pendaftaran", route: "Periksa domain dan syarat pendaftaran" },
    vi: { code: "Kiểm tra mã và điều kiện đăng ký", route: "Kiểm tra miền và điều kiện đăng ký" },
    it: { code: "Verifica codice e condizioni di registrazione", route: "Verifica dominio e condizioni di registrazione" },
  };
  const copy = labels[locale] || labels[String(locale).split("-")[0]] || {
    code: "Review code and signup conditions",
    route: "Review domain and signup conditions",
  };
  return hasReferral ? copy.code : copy.route;
};

const textDirectionForLocale = (locale) => locale === "ar" ? "rtl" : "ltr";

function reviewedDecisionConciseFit(decision) {
  return typeof decision?.fit === "string" ? sanitizePublicText(decision.fit).replace(/^Choose\s+[^ ]+\s+when\s+/i, "").replace(/^Avoid\s+/i, "") : "";
}

function reviewedDecisionHeroSummary(name, locale, decision) {
  const key = localeKey(locale);
  const copy = {
    en: `${name}: source-linked account, product and eligibility checks before signup.`,
    "zh-Hans": `${name}：基于来源核对账户、产品和资格，再决定是否开户。`,
    "zh-Hant": `${name}：基於來源核對帳戶、產品和資格，再決定是否開戶。`,
    es: `${name}: verifica cuenta, productos y elegibilidad con fuentes antes del registro.`,
    "pt-BR": `${name}: verifique conta, produtos e elegibilidade com fontes antes do cadastro.`,
    fr: `${name} : vérifiez compte, produits et éligibilité avec les sources avant inscription.`,
    de: `${name}: Konto, Produkte und Eignung vor der Anmeldung anhand von Quellen prüfen.`,
    ja: `${name}：登録前にアカウント、商品、資格を出典付きで確認します。`,
    ko: `${name}: 가입 전 계정, 상품, 자격을 출처 기반으로 확인합니다.`,
    ar: `${name}: افحص الحساب والمنتجات والأهلية بالمصادر قبل التسجيل.`,
    tr: `${name}: kayıttan önce hesap, ürün ve uygunluğu kaynaklarla kontrol et.`,
    ru: `${name}: перед регистрацией проверьте аккаунт, продукты и доступность по источникам.`,
    id: `${name}: periksa akun, produk, dan kelayakan berbasis sumber sebelum mendaftar.`,
    vi: `${name}: kiểm tra tài khoản, sản phẩm và điều kiện bằng nguồn trước khi đăng ký.`,
    it: `${name}: verifica account, prodotti e idoneità con fonti prima dell'iscrizione.`,
  };
  const conciseFit = reviewedDecisionConciseFit(decision);
  if (conciseFit.trim()) return `${name}: ${conciseFit}`;
  return copy[locale] || copy[key] || copy.en;
}

function VenueDecisionStrip({ text, profile, decision, locale }) {
  const reviewed = Boolean(decision?.editorialReviewed);
  const skipFit = true;
  const decisionLocale = decision?.contentLocale ?? locale;
  const items = reviewed ? [
    { label: text.verdictBestFor, value: decision.fit, locale: decisionLocale },
    { label: text.verifyBefore, value: decision.why, locale: decisionLocale },
    { label: text.detailNotFor, value: decision.avoid, locale: decisionLocale },
  ] : [
    { label: text.verdictBestFor, value: profile.useCases?.[0] },
    { label: text.verifyBefore, value: profile.checks?.[0] },
    { label: text.detailNotFor, value: profile.limitations?.[0] },
  ];
  return <div className="v3-venue-decision-strip" role="group" aria-label={text.profileSignal}>
    {items.slice(skipFit ? 1 : 0).filter((item) => item.value).map((item, index) => (
      <article key={item.label}>
        <span>{item.label}</span>
        <strong lang={item.locale ?? undefined} dir={item.locale ? textDirectionForLocale(item.locale) : undefined}>{sanitizePublicText(item.value)}</strong>
      </article>
    ))}
  </div>;
}

function SourceList({ text, profile }) {
  return <div className="v3-source-list">
    <h3>{text.sourceIntake}</h3>
    <div className="v3-source-list__meta">
      <p><span>{text.officialDomain}</span><strong translate="no" lang="en" dir="ltr">{profile.officialDomain || text.pendingReview}</strong></p>
      <p><span>{text.sourceHost}</span><strong translate="no" lang="en" dir="ltr">{profile.sourceHost || text.pendingReview}</strong></p>
    </div>
    {profile.sourceHubs.length ? profile.sourceHubs.map((source) => <a key={source.url} href={source.url} rel="noopener noreferrer" target="_blank"><span translate="no" lang="en" dir="ltr">{source.label}</span><small translate="no" lang="en" dir="ltr">{new URL(source.url).host}</small></a>) : <p>{text.pendingReview}</p>}
  </div>;
}

function ActivityCards({ copy, text, locale, updates }) {
  if (!updates.length) return <div className="v3-empty" role="status"><b>{text.noReviewedActivity}</b><p>{text.activityEmpty}</p></div>;
  return <div className="v3-activity-list">{updates.map((update) => <article key={update.id}>
    <span>{update.platform.name} · {update.kind}</span>
    <h3>{update.title}</h3>
    <dl>
      <div><dt>{copy.decisionWorkbench.discovered}</dt><dd><time dateTime={update.discoveredAt}>{new Date(update.discoveredAt).toLocaleDateString(locale)}</time></dd></div>
      <div><dt>{copy.common.verifiedSource}</dt><dd><time dateTime={update.verifiedAt}>{new Date(update.verifiedAt).toLocaleDateString(locale)}</time></dd></div>
    </dl>
    <div className="v3-activity-actions">
      <LocalLink locale={locale} href={`/activities/${encodeURIComponent(update.id)}`}>{text.openActivityDetail}</LocalLink>
      <a href={update.officialSource.url} target="_blank" rel="noopener noreferrer">{text.openOfficialSource}</a>
    </div>
  </article>)}</div>;
}

// `researchComponent` renders the body of the collapsed "Sources" hub (VenueDetailResearch). App.jsx passes the static
// module on the server and the route-module-cache wrapper in the browser, where its chunk (route-v3-venue-research)
// loads when the reader opens the disclosure; `prefetchResearch` starts that download the moment the gate opens.
// Tests that render the page directly use VenueDetailPageStatic.jsx, which wires the static component.
export function VenueDetailPage({ copy, locale, venue, venues, updates, market, product, accountStage, funding, researchComponent: ResearchHub = null, prefetchResearch }) {
  const codeFeedback = useCopyFeedback(`${venue.slug}:code`);
  const copied = codeFeedback.state === "success";
  const [tradeVolume, setTradeVolume] = useState(50000);
  const [showAllSimilar, setShowAllSimilar] = useState(false);
  const [mobileStickyActive, setMobileStickyActive] = useState(false);
  const shouldShowMobileSticky = (anchorRect, isMobileViewport) => {
    if (!isMobileViewport || !anchorRect) return false;
    const bottom = Number(anchorRect.bottom);
    return Number.isFinite(bottom) && bottom <= 0;
  };

  const text = v3Copy(locale);
  const ui = interfaceText(locale);
  const detailLabels = detailUi(locale);
  const invitationSummary = invitationSummaryByLocale[textLocaleKey(locale)] || invitationSummaryByLocale.en;
  const profile = venueProfile(venue, locale);
  const runtimeUi = detailRuntimeUi(locale, text, profile.name);
  const research = researchForVenue(venue.slug, locale);
  const related = updates.filter((update) => update.platform.slug === venue.slug);
  const suggested = profile.suggestedComparisons?.map((slug) => venues.find((candidate) => candidate.slug === slug)).filter(Boolean) ?? [];
  const similar = (suggested.length ? suggested : venues.filter((candidate) => candidate.slug !== venue.slug && candidate.category === venue.category)).slice(0, 4);

  const isZhLocale = locale && (locale.startsWith("zh") || locale === "zh-Hans" || locale === "zh-Hant" || locale === "zh-CN" || locale === "zh-TW");
  const telegramDetailUi = telegramLocaleUi[locale] || telegramLocaleUi[String(locale || "").split("-")[0]] || {};
  const localeBase = String(locale || "").toLowerCase() === "pt-br" ? "pt-BR" : String(locale || "").split("-")[0];
  const metricText = {
    ja: ["現物基準手数料", "準備金証明 (PoR)", "本人確認要件", "最大レバレッジ", "公開メルクルツリー", "多国の本人確認に対応", "公式商品条件を確認"],
    ko: ["현물 기준 수수료", "준비금 증명(PoR)", "KYC 요건", "최대 레버리지", "공개 Merkle Tree", "다국가 인증 지원", "공식 상품 조건 확인"],
    tr: ["Spot temel ücreti", "Rezerv Kanıtı (PoR)", "KYC gereksinimi", "Maksimum kaldıraç", "Herkese açık Merkle Tree", "Çoklu ülke doğrulaması", "Resmî ürün koşullarını kontrol edin"],
    es: ["Comisión base spot", "Prueba de reservas (PoR)", "Requisito de KYC", "Apalancamiento máximo", "Árbol de Merkle público", "Verificación internacional", "Consulta las condiciones oficiales"],
    fr: ["Frais spot de base", "Preuve de réserves (PoR)", "Exigence KYC", "Effet de levier maximal", "Arbre de Merkle public", "Vérification internationale", "Voir les conditions officielles"],
    de: ["Spot-Basisgebühr", "Proof of Reserves (PoR)", "KYC-Anforderung", "Maximaler Hebel", "Öffentlicher Merkle-Baum", "Internationale Verifizierung", "Offizielle Produktbedingungen prüfen"],
    ru: ["Базовая комиссия спот", "Подтверждение резервов (PoR)", "Требование KYC", "Максимальное плечо", "Публичное дерево Merkle", "Международная проверка", "Проверить официальные условия"],
    "pt-BR": ["Taxa base spot", "Prova de reservas (PoR)", "Requisito de KYC", "Alavancagem máxima", "Árvore Merkle pública", "Verificação internacional", "Confira as condições oficiais"],
    ar: ["رسوم التداول الفوري الأساسية", "إثبات الاحتياطيات (PoR)", "متطلبات KYC", "الرافعة القصوى", "شجرة Merkle العامة", "تحقق دولي", "راجع الشروط الرسمية"],
    id: ["Biaya dasar spot", "Bukti cadangan (PoR)", "Persyaratan KYC", "Leverage maksimum", "Pohon Merkle publik", "Verifikasi internasional", "Periksa ketentuan resmi"],
    vi: ["Phí spot cơ bản", "Bằng chứng dự trữ (PoR)", "Yêu cầu KYC", "Đòn bẩy tối đa", "Cây Merkle công khai", "Xác minh quốc tế", "Xem điều kiện chính thức"],
    it: ["Commissione base spot", "Prova delle riserve (PoR)", "Requisito KYC", "Leva massima", "Albero Merkle pubblico", "Verifica internazionale", "Controlla le condizioni ufficiali"],
  }[localeBase];
  const localizedVenueName = getLocalizedVenueName(venue, locale) || profile.name;
  const detailDecision = decisionForVenue(profile.slug, locale);
  const reviewedDecision = hasReviewedEditorialDecision(profile.slug) ? detailDecision : null;
  const venueHeroSummary = reviewedDecision
    ? reviewedDecisionHeroSummary(localizedVenueName, locale, reviewedDecision)
    : (research?.contentLocale === locale ? research.summary : profile.positioning);
  const venueCta = regionalVenueCta(venue.slug, locale, market, product, { accountStage, funding });
  const { db, partner, officialDomain, inviteCode, hasReferral, rebatePercent, benefitText, commercialClaim } = venueCta;
  // Owner 2026-10-10 (GSC: exchange pages earn impressions, no clicks): the H1 carries the search intent, under the same
  // referral-title policy as the <title> (referral-seo.js: ru, ar and zh-Hant stay neutral; tr only for SPK-listed
  // venues). The invite code is the data-bound one from the CTA, never typed here.
  const referralHeadlineCode = hasReferral && inviteCode && referralSeoFor(venue.slug, locale) ? inviteCode : null;
  const detailTitleStr = referralHeadlineCode
    ? text.detailReferralTitle(localizedVenueName, referralHeadlineCode, new Date().getUTCFullYear())
    : text.detailFeesTitle(localizedVenueName);
  const [titleBefore, titleAfter] = detailTitleStr.includes(localizedVenueName)
    ? detailTitleStr.split(localizedVenueName)
    : [detailTitleStr, ""];
  const titleSuffixGap = /^\s/.test(titleAfter) ? " " : "";
  const routeUi = dexFeeCompactUi(locale, localizedVenueName, false);
  const trustScore = db.trustScore && db.trustScoreSourceReviewedAt ? Number(db.trustScore) : null;
  const trustLabel = trustScore == null ? localePending(locale) : (trustScore >= 9.0 ? `AA+ ${trustScore}` : `AA ${trustScore}`);
  const trustColor = trustScore >= 9.0 ? "#10b981" : "#38bdf8";

  const reviewedSpotRate = publishableFeeRate(buildVenueFeeSummary(db, research || {}), "spot", locale);
  const spotFeeDisplay = reviewedSpotRate?.display || localePending(locale);
  const flowLabel = officialFlowLabel(locale);
  const kycSummary = db.kycCheckedAt
    ? (db.kycSummary?.[locale] || db.kycSummary?.[textLocaleKey(locale)] || flowLabel)
    : flowLabel;
  const porVerified = Boolean(db.porVerifiedAt && db.porAuditUrl);
  const porRatio = porVerified
    ? (db.reserveRatio || (isZhLocale ? "已公示储备覆盖率" : "Published reserve coverage"))
    : localePending(locale);
  const maxLev = db.maxLeverage && db.leverageCheckedAt ? (String(db.maxLeverage).endsWith("x") ? db.maxLeverage : `${db.maxLeverage}x`) : localePending(locale);
  const visibleBenefitText = benefitText || (hasReferral
    ? (isZhLocale ? zhText(locale, `按 ${venue.name} 当前合作条件享用户手续费权益`, `按 ${venue.name} 目前合作條件享用戶手續費權益`) : (detailLabels.benefit || `User fee benefit follows current ${venue.name} partner terms`))
    : routeUi.noCode);

  // Quick calculator calculation
  const takerRate = db.spotFee?.takerRate && db.feeCheckedAt ? db.spotFee.takerRate : null;
  const annualBaseFee = takerRate == null ? null : Math.round(tradeVolume * 12 * takerRate);
  const annualSavings = annualBaseFee == null || commercialClaim.status !== "verified" ? null : Math.round(annualBaseFee * (rebatePercent / 100));
  const contextSearch = directoryContextSearch({ market, product, locale, accountStage, funding });
  const directAnswerLinkContext = { market, product, accountStage, funding };
  const venueDirectAnswerInternalHref = (href) => {
    const target = new URL(String(href || "/"), "https://nexualpha.com");
    return appendDecisionPassportQuery(href, {
      ...directAnswerLinkContext,
      product: target.searchParams.get("product") || product,
      market: target.searchParams.get("market") || market,
    });
  };
  const priorityAnswer = priorityVenueAnswerFor(venue.slug, locale);
  const showUniswapShortChecklist = venue.slug === "uniswap"
    && priorityAnswer
    && Object.hasOwn(uniswapShortChecklistCopy, priorityAnswer.locale);
  const venueDirectAnswer = priorityAnswer || venueDirectAnswerFor(locale, venue.slug);
  const ownerQuestionTitle = priorityAnswer?.ownerQuestion || null;
  const decisionGroups = [venueDirectAnswer?.fit, venueDirectAnswer?.avoid, venueDirectAnswer?.nextSteps].filter((group) => group?.items?.length);
  const venueDirectAnswerDetails = venueDirectAnswer && <>
    {venueDirectAnswer.costFormula && (
      <p className="v3-venue-direct-answer__formula"><b>{venueDirectAnswer.costFormulaLabel}:</b> <code>{venueDirectAnswer.costFormula}</code></p>
    )}
    {venueDirectAnswer.queryOwner && (
      <p className="v3-venue-direct-answer__query-owner">
        <b>{venueDirectAnswer.queryOwner.label}:</b> {venueDirectAnswer.queryOwner.body}
      </p>
    )}
    <ul>{venueDirectAnswer.checks.map((check) => <li key={check}>{check}</li>)}</ul>
    {decisionGroups.length > 0 && (
      <div className="v3-venue-direct-answer__decision-grid">
        {decisionGroups.map((group) => (
          <section key={group.label} className="v3-venue-direct-answer__decision-group">
            <b>{group.label}</b>
            <ol>
              {group.items.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </section>
        ))}
      </div>
    )}
    {venueDirectAnswer.boundary && <small>{venueDirectAnswer.boundary}</small>}
  </>;
  const venueDirectAnswerCta = venueDirectAnswer?.registrationSlug
    ? regionalVenueCta(venueDirectAnswer.registrationSlug, locale, market, product, { accountStage, funding })
    : null;
  const heroTelegramFunnel = buildTelegramWebsiteFunnelContext({ intent: "monitor", venue: venue.slug, market, locale, product, campaign: "venue_hero_monitor" });
  const nonCexResearchActions = String(profile.category || venue.category || "").toUpperCase() === "CEX" ? [] : [
    similar[0] && {
      label: text.viewCompare,
      href: `/compare/${compareSlug([profile.slug, similar[0].slug])}?${contextSearch}`,
      kind: "research",
      placement: "dex-detail-compare",
      decision: compareSlug([profile.slug, similar[0].slug]),
    },
    {
      label: telegramDetailUi.monitor || (isZhLocale ? "在 Telegram 继续研究 ↗" : "Continue research in Telegram ↗"),
      href: getTelegramDeepLink({ action: "verify_domain", venue: venue.slug, market, locale, product }),
      kind: "telegram",
      placement: "dex-detail-telegram",
      decision: `telegram_${venue.slug}`,
      external: true,
    },
  ].filter(Boolean);

  const handleCopyCode = () => codeFeedback.copy(inviteCode || officialDomain);
  const handleStickyCopy = () => { handleCopyCode(); if (inviteCode) trackCodeCopy(venue.slug, "venue-mobile-sticky-code"); };
  // The sticky bar opens the same protected partner route as the registration card's primary button (same decision
  // state, same href). Where the card itself would not open a third-party route, the bar keeps the review link.
  const stickyDecision = buildRegistrationDecisionState({ publicCta: publicCtaForVenue(venue.slug, locale), regionalCta: venueCta });
  const stickyOpensSignup = stickyDecision.canOpenThirdParty && stickyDecision.protectedHref === venueCta.ctaHref;
  const ctaText = ctaUiCopy(locale);
  const profileChapters = profileResearchChapterCopy[textLocaleKey(locale)] || profileResearchChapterCopy.en;

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const anchor = document.querySelector('[data-cta-surface="venue-profile-main-registration"]');
    const mediaQuery = typeof window.matchMedia === "function" ? window.matchMedia("(max-width: 780px)") : null;
    const footer = document.querySelector("footer.nx-ftr, footer");
    const updateMobileSticky = () => {
      // Never sit on top of the footer (disclosure, copyright): the bar steps away once the footer enters the viewport.
      const footerVisible = Boolean(footer) && footer.getBoundingClientRect().top < window.innerHeight;
      const isMobileViewport = (mediaQuery ? mediaQuery.matches : window.innerWidth <= 780) && !footerVisible;
      setMobileStickyActive(shouldShowMobileSticky(anchor?.getBoundingClientRect(), isMobileViewport));
    };
    updateMobileSticky();
    window.addEventListener("scroll", updateMobileSticky, { passive: true });
    window.addEventListener("resize", updateMobileSticky);
    mediaQuery?.addEventListener?.("change", updateMobileSticky);
    return () => {
      window.removeEventListener("scroll", updateMobileSticky);
      window.removeEventListener("resize", updateMobileSticky);
      mediaQuery?.removeEventListener?.("change", updateMobileSticky);
    };
  }, []);

  const mobileStickyIdentityLabel = hasReferral
    ? (locale === "zh-Hant" ? "專屬邀請碼" : isZhLocale ? "专属邀请码" : (detailLabels.codeShort || "Code"))
    : (locale === "zh-Hant" ? "官方主網域" : isZhLocale ? "官方主域名" : runtimeUi.stickyOfficial);
  const mobileStickyIdentityAction = hasReferral
    ? (copyFeedbackLabel(codeFeedback.state, locale, isZhLocale ? zhText(locale, "复制", "複製") : (detailLabels.copy || "Copy")))
    : copyFeedbackLabel(codeFeedback.state, locale, locale === "zh-Hant" ? "核對" : isZhLocale ? "核对" : runtimeUi.globalVerification);
  const registrationReviewLabel = venueCta.direct
    ? detailRegistrationReviewLabel(locale, { hasReferral })
    : (locale === "zh-Hant" ? "先核對地區資格" : isZhLocale ? "先核对地区资格" : detailCtaLabel(locale, { direct: false, hasReferral }));
  const quickRegistration = (
    <div className="v3-venue-quick-registration">
      <div className="v3-venue-quick-registration__body">
        <span className="v3-venue-quick-registration__label">
          {hasReferral
            ? (locale === "zh-Hant" ? "專屬邀請碼" : isZhLocale ? "专属邀请码" : (detailLabels.code || "Referral Code"))
            : (locale === "zh-Hant" ? "官方入口" : isZhLocale ? "官方入口" : runtimeUi.stickyOfficial)}
        </span>
        {inviteCode ? (
          <button
            type="button"
            className="v3-venue-quick-registration__code"
            onClick={handleCopyCode}
            data-copied={copied}
          >
            <strong translate="no">{inviteCode}</strong>
            <span>{copyFeedbackLabel(codeFeedback.state, locale, isZhLocale ? "复制" : (detailLabels.copy || "Copy"))}</span>
          </button>
        ) : (
          <strong className="v3-venue-quick-registration__domain" translate="no">{officialDomain}</strong>
        )}
        <CopyFeedbackStatus state={codeFeedback.state} locale={locale} />
        <small>{visibleBenefitText}</small>
      </div>
      <LocalLink
        locale={locale}
        href={`/exchanges/${profile.slug}?${contextSearch}#registration-path`}
        className="v3-venue-quick-registration__cta"
        data-cta-kind="research"
        data-cta-platform={profile.slug}
        data-cta-placement="venue-hero-quick-registration"
        data-growth-decision="registration_card_review"
        data-growth-placement="venue-hero-quick-registration"
        data-growth-market={market}
        data-growth-product={product}
        data-registration-confirmation-entry="registration-card"
      >
        {registrationReviewLabel}
      </LocalLink>
    </div>
  );

  return <main className="v6 v2-page v3-page v3-profile-page v5 v5-detail" id="top" {...sectionEyebrowAttrs(locale, "exchanges")}>
    <section className="v3-page-hero v2-shell">
      <TelegramReturnBanner
        expectedKind="venue"
        expectedId={profile.slug}
        objectLabel={localizedVenueName}
        locale={locale}
        market={market}
        product={product}
        accountStage={accountStage}
        funding={funding}
        continueHash="#registration-checklist"
      />
      <LocalLink locale={locale} href={`/exchanges?${contextSearch}`} className="v3-back-link">
        ← {isZhLocale ? zhText(locale, "返回交易所黄页目录", "返回交易所黃頁目錄") : text.backToDirectory}
      </LocalLink>

      <div className="v3-venue-hero">
        <div className="v3-venue-identity enter" style={{ "--i": 0 }}>
          <BrandMark slug={profile.slug} priority />
          <div className="v3-venue-identity__info">
            <div className="v3-venue-identity__badges">
              <span className={`v3-category-chip v3-category-chip--${String(profile.category || "").toLowerCase().replace(/\s+/g, "-")}`}>
                {profile.category}
              </span>
              {trustScore == null ? (
                <span className={`v3-trust-metal-badge${feesCheckedLabel(venue.slug, locale) ? " v3-trust-metal-badge--checked" : " v3-trust-metal-badge--unchecked"}`}>
                  {feesStatusLabel(venue.slug, locale)}
                </span>
              ) : (
                <span className="v3-trust-metal-badge" style={{ borderColor: trustColor }}>
                  ★ {trustLabel}
                </span>
              )}
              <span className="v3-domain-pill" translate="no">
                <svg className="d5-lock" aria-hidden="true" focusable="false" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> {officialDomain}
              </span>
            </div>
            <h1 lang={priorityAnswer?.locale || undefined}>
              {ownerQuestionTitle ? (
                ownerQuestionTitle
              ) : (
                <>{titleBefore}{detailTitleStr.includes(localizedVenueName) && <bdi translate="no" lang={isZhLocale ? "zh-Hans" : "en"}>{localizedVenueName}</bdi>}{titleAfter && <>{titleSuffixGap}<span className="v3-venue-title__suffix">{titleAfter.trim()}</span></>}</>
              )}
            </h1>
          </div>
        </div>

        <div className="v3-profile-reading-layout">
        <div className="v3-profile-action-column">
        <div className="v3-profile-main-registration enter" style={{ "--i": 2 }} data-cta-surface="venue-profile-main-registration">
        <article className="v3-detail-grid__handoff">
          <OutboundHandoff compact locale={locale} venueSlug={profile.slug} fallbackDomain={profile.officialDomain} market={market} product={product} accountStage={accountStage} funding={funding} />
        </article>
        <TelegramAlertsStrip locale={locale} placement="venue-telegram-alerts" className="tg-signal-strip--venue" />
        </div>

        </div>
        <div className="v3-profile-reading-overview">
        {!priorityAnswer && !venueDirectAnswer && <div className="v3-venue-context">
          <p className="v3-venue-summary" lang={reviewedDecision?.contentLocale ?? locale} dir={reviewedDecision ? textDirectionForLocale(reviewedDecision.contentLocale) : undefined}>{venueHeroSummary}</p>
        </div>}


        <VenueFeeLedger slug={profile.slug} locale={locale} />
        <VenueRoute domain={officialDomain} code={hasReferral ? inviteCode : null} locale={locale} />

        {venueDirectAnswer && (
          <div className="v3-venue-direct-answer" role="region" aria-label={priorityAnswer?.title || `${profile.name} direct answer`} data-priority-answer={priorityAnswer ? venue.slug : undefined} lang={priorityAnswer?.locale || locale}>
            {!(priorityAnswer && ownerQuestionTitle === venueDirectAnswer.title) && <h2 className="v3-venue-direct-answer__title">{venueDirectAnswer.title}</h2>}
            {venueDirectAnswer.reviewedAt && (
              <time className="v3-venue-direct-answer__reviewed" dateTime={isoDay(venueDirectAnswer.reviewedAt)}>{isoDates(venueDirectAnswer.reviewedLabel)}</time>
            )}
            <p>{venueDirectAnswer.body}</p>
            {priorityAnswer && <details className="v3-venue-direct-answer__sources">
              <summary>{locale === "zh-Hant" ? "費用、使用條件與官方資料" : isZhLocale ? "费用、使用条件与官方资料" : ({"es": "Costes, condiciones y fuentes oficiales", "pt-BR": "Custos, condições e fontes oficiais", "fr": "Frais, conditions et sources officielles", "de": "Kosten, Bedingungen und offizielle Quellen", "ja": "費用・条件・公式ソース", "ko": "비용, 조건, 공식 출처", "tr": "Maliyetler, koşullar ve resmî kaynaklar", "ru": "Расходы, условия и официальные источники", "ar": "التكاليف والشروط والمصادر الرسمية", "id": "Biaya, ketentuan, dan sumber resmi", "vi": "Chi phí, điều kiện và nguồn chính thức", "it": "Costi, condizioni e fonti ufficiali"}[locale] || "Costs, conditions and official sources")}</summary>
              <div className="v3-venue-direct-answer__expanded">
              {venueDirectAnswerDetails}
              <div className="v3-venue-direct-answer__links">
                {priorityAnswer.sources.map(([label, href]) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer" data-cta-kind="source" data-cta-placement="venue-direct-answer-source"><span {...(/^[\x20-\x7e]+$/.test(label) ? { translate: "no", lang: "en" } : {})}>{label}</span> ↗</a>
                ))}
                {priorityAnswer.internalLinks?.slice(1).map(([label, href]) => (
                  <LocalLink key={href} locale={locale} href={venueDirectAnswerInternalHref(href)} data-cta-kind="research" data-cta-placement="venue-direct-answer-internal">{label}</LocalLink>
                ))}
              </div>
              </div>
            </details>}
            {(venueDirectAnswer.sources?.length || venueDirectAnswer.internalLinks?.length) && (
              <div className="v3-venue-direct-answer__links">
                {!priorityAnswer && venueDirectAnswer.sources?.map(([label, href]) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer" data-cta-kind="source" data-cta-placement="venue-direct-answer-source"><span {...(/^[\x20-\x7e]+$/.test(label) ? { translate: "no", lang: "en" } : {})}>{label}</span> ↗</a>
                ))}
                {(priorityAnswer ? venueDirectAnswer.internalLinks?.slice(0, 1) : venueDirectAnswer.internalLinks)?.map(([label, href]) => (
                  <LocalLink key={href} locale={locale} href={venueDirectAnswerInternalHref(href)} data-cta-kind="research" data-cta-placement="venue-direct-answer-internal">{label}</LocalLink>
                ))}
                {venueDirectAnswerCta && (
                  <a
                    href={venueDirectAnswerCta.ctaHref}
                    target={venueDirectAnswerCta.direct ? "_blank" : undefined}
                    rel={venueDirectAnswerCta.direct ? "sponsored noopener noreferrer" : undefined}
                    data-cta-kind={venueDirectAnswerCta.direct ? "registration" : "research"}
                    data-cta-platform={venueDirectAnswer.registrationSlug}
                    data-cta-placement="venue-direct-answer-protected-cta"
                    data-growth-decision={venueDirectAnswer.registrationSlug}
                    data-growth-placement="venue-direct-answer-protected-cta"
                  >
                    {venueDirectAnswerCta.direct ? detailCtaLabel(locale, { direct: true, hasReferral: venueDirectAnswerCta.hasReferral }) : detailCtaLabel(locale, { direct: false, hasReferral: venueDirectAnswerCta.hasReferral })}
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {showUniswapShortChecklist && (
          <UniswapShortVerificationChecklist
            locale={priorityAnswer.locale}
            priorityAnswer={priorityAnswer}
            resolveInternalHref={venueDirectAnswerInternalHref}
          />
        )}

        {venue.slug === "hyperliquid" && ["en", "zh-Hans", "zh-Hant"].includes(locale) && <HyperliquidFeeScenario locale={locale} market={market} />}

        {!priorityAnswer && (
          <section className="v3-profile-decision-context" data-profile-task="context">
            <h2>{ui.profileSignal}</h2>
            <VenueDecisionStrip text={text} profile={profile} decision={reviewedDecision} locale={locale} />
          </section>
        )}


        <VenueReadinessChecklist
          venueSlug={profile.slug}
          locale={locale}
          market={market}
          product={product}
        />

        <div className="v3-profile-primary-actions v3-profile-actions-row" data-profile-task="primary">
          {similar[0] && <LocalLink locale={locale} href={`/compare/${compareSlug([profile.slug, similar[0].slug])}?${contextSearch}`} className="button-quiet">{text.viewCompare}</LocalLink>}
          <LocalLink locale={locale} href={`/exchanges/${profile.slug}?${contextSearch}#registration-checklist`} className="button-quiet v3-profile-registration-review-link">{text.registrationPrepCta}</LocalLink>
        </div>
        <p className="v3-relationship-note">{text.relationship}</p>

        </div>

        </div>
      </div>

    </section>

    <ExchangeFactsV5 slug={profile.slug} locale={locale} profile={profile} />

    {/* One "Sources" disclosure: account and costs, sources and security, and follow-up were three stacked disclosures. */}
    <section className="v2-section v3-profile-research-hub">
      <details className="v3-profile-sources-group">
        <summary className="v3-profile-sources-group__summary">
          <strong>{profileChapters[1]}</strong>
          <span>{profileChapters[0]} · {profileChapters[2]}</span>
          <b aria-hidden="true">＋</b>
        </summary>
        <div className="v3-profile-sources-group__body">
          {ResearchHub && <DeferUntilVisible target=".v3-profile-sources-group" interactionOnly prefetch={prefetchResearch}>
            <ResearchHub annualSavings={annualSavings} codeFeedback={codeFeedback} commercialClaim={commercialClaim} copy={copy} db={db} detailLabels={detailLabels} handleCopyCode={handleCopyCode} heroTelegramFunnel={heroTelegramFunnel} invitationSummary={invitationSummary} inviteCode={inviteCode} isZhLocale={isZhLocale} kycSummary={kycSummary} locale={locale} localizedVenueName={localizedVenueName} market={market} maxLev={maxLev} metricText={metricText} nonCexResearchActions={nonCexResearchActions} officialDomain={officialDomain} partner={partner} porRatio={porRatio} porVerified={porVerified} priorityAnswer={priorityAnswer} product={product} profile={profile} profileChapters={profileChapters} quickRegistration={quickRegistration} rebatePercent={rebatePercent} reviewedSpotRate={reviewedSpotRate} routeUi={routeUi} runtimeUi={runtimeUi} setTradeVolume={setTradeVolume} spotFeeDisplay={spotFeeDisplay} telegramDetailUi={telegramDetailUi} text={text} tradeVolume={tradeVolume} venue={venue} venueCta={venueCta} venueDirectAnswer={venueDirectAnswer} venueDirectAnswerDetails={venueDirectAnswerDetails} visibleBenefitText={visibleBenefitText} />
          </DeferUntilVisible>}
        </div>
      </details>
    </section>

    {/* 针对 SEO 关键词的 FAQ 折叠/展开模块 */}
    <VenueFaqSection venue={venue} profile={profile} locale={locale} db={db} partner={partner} />

    <section className={`v2-section v3-activity-panel${related.length ? "" : " v3-activity-panel--empty"}`}>
      <div className="section-lead"><h2>{text.reviewedActivity}</h2>{related.length > 0 && <span>{text.verifiedOnly}</span>}</div>
      {/* empty state: one line and one link (no disclosure dressed as a button) */}
      {related.length ? <ActivityCards copy={copy} text={text} locale={locale} updates={related} /> : <p className="v3-activity-empty v3-activity-empty--line" role="status">{String(text.activityEmpty || "").split(/(?<=[.。])\s*/)[0]} <LocalLink locale={locale} href={`/activities/research/${profile.slug}`}>{campaignCopy(locale).openResearch}</LocalLink></p>}
      {related.length > 0 && <div className="v3-activity-panel__actions"><LocalLink locale={locale} href="/activities">{text.openActivities}</LocalLink><LocalLink locale={locale} href={`/activities/research/${profile.slug}`}>{campaignCopy(locale).openResearch}</LocalLink><details className="research-references"><summary>{text.openOfficialSource}</summary><SourceList text={text} profile={profile} /></details></div>}
    </section>

    <section className="v2-section v3-similar v3-similar-section" aria-labelledby={`similar-${profile.slug}`}>
      <div className="section-lead v3-similar-section__lead"><h2 id={`similar-${profile.slug}`}>{text.similar}</h2></div>
      <ul className="v3-alternative-list" data-collapsed={!showAllSimilar && similar.length > 2 ? "true" : undefined}>{similar.map((candidate) => {
        const alternative = venueProfile(candidate, locale);
        const candidateResearch = researchForVenue(candidate.slug, locale);
        return <li key={candidate.slug}>
          <LocalLink locale={locale} href={`/exchanges/${candidate.slug}?${contextSearch}`} className="v3-alternative__identity"><BrandMark slug={candidate.slug} compact /><b translate="no" lang="en" dir="ltr">{candidate.name}</b><small translate="no" lang="en" dir="ltr">{candidate.category}</small></LocalLink>
          <p className="v3-alternative__summary">{candidateResearch?.contentLocale === locale ? candidateResearch.summary : alternative.positioning}</p>
          <div className="v3-alternative__actions"><LocalLink locale={locale} href={`/exchanges/${candidate.slug}?${contextSearch}`}>{text.openDetail}</LocalLink><LocalLink locale={locale} href={`/compare/${compareSlug([profile.slug, candidate.slug])}?${contextSearch}`}>{text.viewCompare}</LocalLink></div>
        </li>;
      })}</ul>
      {similar.length > 2 && (
        <button
          type="button"
          className="v3-alternative-list__expand"
          aria-expanded={showAllSimilar}
          onClick={() => setShowAllSimilar((value) => !value)}
        >
          {showAllSimilar
            ? (isZhLocale ? zhText(locale, "收起同类平台", "收起同類平台") : runtimeUi.showFewer)
            : (isZhLocale ? zhText(locale, `展开其余 ${similar.length - 2} 个同类平台`, `展開其餘 ${similar.length - 2} 個同類平台`) : runtimeUi.showMore(similar.length - 2))}
          <span aria-hidden="true">{showAllSimilar ? " ↑" : " ↓"}</span>
        </button>
      )}
    </section>

    {/* 移动端专属吸底快捷操作条 */}
    <aside className={`v3-mobile-sticky-bar${mobileStickyActive ? " is-active" : ""}`} aria-label={isZhLocale ? "快捷操作" : runtimeUi.stickyQuickAction} aria-hidden={!mobileStickyActive} inert={!mobileStickyActive}>
      <div className="v3-mobile-sticky-bar__inner">
        <button type="button" onClick={handleStickyCopy} className="v3-mobile-sticky-bar__code" data-copied={codeFeedback.state === "success" || undefined}>
          <span className="v3-mobile-sticky-bar__label">{mobileStickyIdentityLabel}</span>
          <strong translate="no">{inviteCode || officialDomain}</strong>
          <small>{mobileStickyIdentityAction}</small>
          {codeFeedback.state !== "idle" && <CopyFeedbackStatus state={codeFeedback.state} locale={locale} />}
        </button>
        <div className="v3-mobile-sticky-bar__perk">
          <span className="v3-mobile-sticky-bar__discount">{commercialClaim.status === "verified" ? `-${formatPercent(locale, rebatePercent)}` : runtimeUi.stickyOfficial}</span>
          <span>{hasReferral ? (isZhLocale ? zhText(locale, "手续费权益", "手續費權益") : runtimeUi.stickyFeeBenefit) : (isZhLocale ? zhText(locale, "官方入口", "官方入口") : runtimeUi.stickyDirectRoute)}</span>
        </div>
        {stickyOpensSignup ? (
          <a
            href={venueCta.ctaHref}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="v3-mobile-sticky-bar__btn v3-mobile-sticky-bar__btn--signup"
            tabIndex={mobileStickyActive ? undefined : -1}
            data-cta-kind="registration"
            data-cta-platform={profile.slug}
            data-cta-placement="venue-mobile-sticky"
            data-cta-code={hasReferral && inviteCode ? inviteCode : undefined}
            data-growth-decision={profile.slug}
            data-growth-placement="venue-mobile-sticky"
            data-growth-market={market}
            data-growth-product={product}
          >
            {ctaText.open} <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <LocalLink
            locale={locale}
            href={`/exchanges/${profile.slug}?${contextSearch}#registration-path`}
            className="v3-mobile-sticky-bar__btn"
            data-cta-kind="research"
            data-cta-platform={profile.slug}
            data-cta-placement="venue-mobile-sticky"
            data-registration-confirmation-entry="registration-card"
          >
            {registrationReviewLabel}
          </LocalLink>
        )}
        <LocalLink
          locale={locale}
          href="/methodology#disclosure"
          className="v3-mobile-sticky-bar__disclosure"
          tabIndex={mobileStickyActive ? undefined : -1}
          data-disclosure-placement="venue-mobile-sticky"
        >
          {footerDisclosureLabel(locale)}
        </LocalLink>
      </div>
    </aside>
  </main>;
}

const profileResearchChapterCopy = {
  "en": [
    "Account and costs",
    "Sources and security",
    "Continue following"
  ],
  "zh-Hans": [
    "账户与成本",
    "来源与安全",
    "持续跟进"
  ],
  "zh-Hant": [
    "帳戶與成本",
    "來源與安全",
    "持續跟進"
  ],
  "ja": [
    "アカウントと費用",
    "出典と安全性",
    "継続して確認"
  ],
  "ko": [
    "계정과 비용",
    "출처와 보안",
    "계속 확인"
  ],
  "tr": [
    "Hesap ve maliyetler",
    "Kaynaklar ve güvenlik",
    "Takibe devam"
  ],
  "ar": [
    "الحساب والتكاليف",
    "المصادر والأمان",
    "المتابعة المستمرة"
  ],
  "es": [
    "Cuenta y costes",
    "Fuentes y seguridad",
    "Continuar el seguimiento"
  ],
  "pt-BR": [
    "Conta e custos",
    "Fontes e segurança",
    "Continuar acompanhando"
  ],
  "fr": [
    "Compte et coûts",
    "Sources et sécurité",
    "Poursuivre le suivi"
  ],
  "de": [
    "Konto und Kosten",
    "Quellen und Sicherheit",
    "Weiter verfolgen"
  ],
  "ru": [
    "Аккаунт и расходы",
    "Источники и безопасность",
    "Продолжить наблюдение"
  ],
  "id": [
    "Akun dan biaya",
    "Sumber dan keamanan",
    "Lanjutkan pemantauan"
  ],
  "vi": [
    "Tài khoản và chi phí",
    "Nguồn và bảo mật",
    "Tiếp tục theo dõi"
  ],
  "it": [
    "Account e costi",
    "Fonti e sicurezza",
    "Continuare a seguire"
  ]
};

