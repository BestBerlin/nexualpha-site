/**
 * TradingBleedAnalyzer — 杀手级转化工具：交易成本暗亏体检仪
 * 击中人性：损失厌恶（Loss Aversion）与立即可挽回利益，促使用户立即换绑或新开专属账户。
 */
import React, { useState, useMemo, useEffect } from "react";
import { SourceLink } from "../shared/SourceLink.jsx";
import { venueDatabase } from "../../data/venue-database.js";
import { partnerRegistry } from "../../data/partner-registry.js";
import { resolveCommercialClaim } from "../../data/commercial-claims.js";
import { regionalVenueCta } from "../../data/source-bound-cta.js";
import { BrandMark } from "../brand/BrandMark.jsx";
import { getLocalizedVenueName } from "../../utils/venue-name-helper.js";
import { buildTelegramWebsiteFunnelContext } from "../../data/telegram-config.js";
import { buildVenueFeeSummary, feeSummaryCopy } from "../../data/venue-fee-summary.js";
import { reviewedFeeCopy } from "../../data/reviewed-fee-copy.js";
import { tradingBleedCopy } from "../../data/trading-bleed-copy.js";
import { bleedCopyFeedback } from "../../data/trading-bleed-feedback.js";
import { buildDecisionReturnHref, readDecisionReturnState, decisionReturnCopy } from "../../data/decision-return.js";
import { DecisionReturnLink } from "./DecisionReturnLink.jsx";
import { formatPercent } from "../../data/format-percent.js";
import { formatFeeRate } from "../../data/format-fee.js";
import "./trading-bleed-analyzer.css";

export async function copyTextWithFeedback(clipboard, text) {
  if (!clipboard?.writeText) return { status: "failed", value: text };
  try {
    await clipboard.writeText(text);
    return { status: "copied", value: text };
  } catch {
    return { status: "failed", value: text };
  }
}

export function reviewedBleedAnalyzerFee(db = {}, type = "futures") {
  const product = type === "spot" ? "spot" : "futures";
  const rate = buildVenueFeeSummary(db).rates.find((item) => item.product === product);
  return rate && Number.isFinite(rate.takerRate) ? rate : null;
}

export function reviewedBleedAnalyzerRate(db = {}, type = "futures") {
  return reviewedBleedAnalyzerFee(db, type)?.takerRate ?? null;
}

export function visibleCopyResultForValue(result, currentValue) {
  return result?.value === currentValue ? result : null;
}

export function calculateBleedScenario({ db = {}, type = "futures", volume = 0, benefitVerified = false, rebatePercent = 0 } = {}) {
  const rate = reviewedBleedAnalyzerRate(db, type);
  if (!Number.isFinite(rate)) return { rate: null, annualTotalFee: null, annualBleed: null };
  const annualTotalFee = volume * rate * 12;
  const annualBleed = annualTotalFee * (benefitVerified ? rebatePercent / 100 : 0);
  return {
    rate,
    annualTotalFee: Math.round(annualTotalFee),
    annualBleed: Math.round(annualBleed),
  };
}

const SELECTABLE_VENUES = ["binance", "okx", "bybit", "bitget", "gate-io", "kucoin", "mexc"];
const VOL_TIERS = [5000, 20000, 50000, 100000, 300000, 500000, 1000000];

export function restoreBleedAnalyzerState(search = "", hash = "") {
  const state = readDecisionReturnState(search, hash);
  if (!state || state.kind !== "fees") return null;
  const selectedSlug = SELECTABLE_VENUES.includes(state.venue) ? state.venue : null;
  const volIndex = VOL_TIERS.indexOf(state.volume);
  if (!selectedSlug || volIndex < 0) return null;
  return {
    selectedSlug,
    type: state.instrument === "spot" ? "spot" : "futures",
    volIndex,
  };
}

// Animated Number Component using requestAnimationFrame for 60fps smooth count-up
function AnimatedNumber({ value, prefix = "", suffix = "" }) {
  const [displayVal, setDisplayVal] = useState(value);

  React.useEffect(() => {
    const startVal = displayVal;
    const endVal = value;
    if (startVal === endVal) return;

    let active = true;
    let frameId = null;
    let startTime = null;
    const duration = 400; // 400ms smooth count

    const step = (timestamp) => {
      if (!active) return;
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * ease);
      setDisplayVal(current);

      if (progress < 1 && active) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => {
      active = false;
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
    };
  }, [value]);

  return (
    <span>
      {prefix}
      {displayVal.toLocaleString()}
      {suffix}
    </span>
  );
}

// Drawn 16px icons (no emoji): bolt = futures, coin = spot, check, copy.
const ICO = {
  bolt: <path d="M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z" />,
  coin: <><circle cx="8" cy="8" r="6" /><path d="M8 5v6M6 6.6c.3-.6 1-1 2-1s1.8.4 1.8 1.1-.8 1-1.8 1.2-1.8.5-1.8 1.2.8 1.1 1.8 1.1 1.7-.4 2-1" /></>,
  check: <path d="M3 8.5l3.2 3L13 4.8" />,
  copy: <><rect x="5.5" y="5.5" width="8" height="8" rx="1.8" /><path d="M10.5 3.5h-6A1.5 1.5 0 0 0 3 5v6" /></>,
};
const Ico = ({ k }) => <svg className="bleed-ico" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICO[k]}</svg>;

export function TradingBleedAnalyzer({ locale = "en", headingLevel = 2, market, product }) {
  const [selectedSlug, setSelectedSlug] = useState("okx");
  const [type, setType] = useState("futures");
  const [volIndex, setVolIndex] = useState(3); // $100,000
  const [copyResult, setCopyResult] = useState(null);
  const [embedCopyResult, setEmbedCopyResult] = useState(null);

  const isZh = locale.startsWith("zh");
  const ui = tradingBleedCopy(locale);
  const HeadingTag = headingLevel === 1 ? "h1" : "h2";
  const returnCopy = decisionReturnCopy(locale);
  const copyFeedback = bleedCopyFeedback(locale);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const restored = restoreBleedAnalyzerState(window.location.search, window.location.hash);
    if (!restored) return;
    setSelectedSlug(restored.selectedSlug);
    setType(restored.type);
    setVolIndex(restored.volIndex);
  }, [locale]);

  const currentVol = VOL_TIERS[volIndex];
  const db = venueDatabase[selectedSlug] || {};
  const partner = partnerRegistry[selectedSlug] || {};
  const commercialClaim = resolveCommercialClaim({ partner, venue: db });
  const benefitVerified = commercialClaim.status === "verified";
  const regionalCta = regionalVenueCta(selectedSlug, locale, market, product);

  const reviewedBaseFee = useMemo(() => reviewedBleedAnalyzerFee(db, type), [db, type]);
  const feeText = feeSummaryCopy(locale);
  const reviewedBaseFeeCopy = reviewedBaseFee ? reviewedFeeCopy(reviewedBaseFee, locale) : null;
  const formattedRate = reviewedBaseFee ? formatFeeRate(reviewedBaseFee.takerRate, locale) : null;
  const calculations = useMemo(() => calculateBleedScenario({
    db,
    type,
    volume: currentVol,
    benefitVerified,
    rebatePercent: commercialClaim.rebatePercent,
  }), [currentVol, db, type, benefitVerified, commercialClaim.rebatePercent]);
  const hasReviewedBaseFee = Number.isFinite(calculations.annualTotalFee);

  const inviteCode = regionalCta.inviteCode ?? null;
  const directRoute = Boolean(regionalCta.direct && /^https:\/\//i.test(regionalCta.ctaHref || ""));
  const regUrl = regionalCta.ctaHref;

  // 真实 Telegram Deep Link 闭环
  const telegramFunnel = buildTelegramWebsiteFunnelContext({
    intent: "fees",
    venue: selectedSlug,
    instrument: type,
    amount: currentVol,
    market,
    locale,
    product,
    campaign: "bleed_analyzer_fee",
  });
  const decisionReturnHref = buildDecisionReturnHref({
    kind: "fees",
    locale,
    market,
    product,
    venue: selectedSlug,
    instrument: type === "spot" ? "spot" : "futures",
    volume: currentVol,
  });
  const embedCode = `<iframe src="https://nexualpha.com/embed/calculator?locale=${encodeURIComponent(locale)}" width="100%" height="680" frameborder="0"></iframe>`;
  const visibleCopyResult = visibleCopyResultForValue(copyResult, inviteCode);
  const visibleEmbedCopy = visibleCopyResultForValue(embedCopyResult, embedCode);

  const handleCopy = async (e) => {
    e.preventDefault();
    if (!inviteCode) return;
    const result = await copyTextWithFeedback(typeof navigator !== "undefined" ? navigator.clipboard : null, inviteCode);
    setCopyResult(result);
    if (result.status === "copied") setTimeout(() => setCopyResult(null), 2000);
  };

  const handleEmbedCopy = async () => {
    const result = await copyTextWithFeedback(typeof navigator !== "undefined" ? navigator.clipboard : null, embedCode);
    setEmbedCopyResult(result);
    if (result.status === "copied") setTimeout(() => setEmbedCopyResult(null), 2500);
  };

  return (
    <section className="bleed-analyzer-section v2-shell">
      <div className="bleed-analyzer__container">
        <header className="bleed-analyzer__header">
          <HeadingTag className="bleed-analyzer__title">{ui.title}</HeadingTag>
          <p className="bleed-analyzer__subtitle">{ui.subtitle}</p>
        </header>

        <div className="bleed-analyzer__grid">
          {/* 左侧交互控制仪表盘 */}
          <div className="bleed-analyzer__controls">
            <div className="bleed-control-group">
              <label className="bleed-label">{ui.currentVenue}</label>
              <div className="bleed-venue-selector">
                {SELECTABLE_VENUES.map((slug) => {
                  const vDb = venueDatabase[slug] || {};
                  return (
                    <button
                      key={slug}
                      type="button"
                      className={`bleed-venue-btn ${selectedSlug === slug ? "bleed-venue-btn--active" : ""}`}
                      onClick={() => setSelectedSlug(slug)}
                    >
                      <BrandMark slug={slug} compact />
                      <span translate="no">{getLocalizedVenueName(vDb || slug, locale)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bleed-control-group">
              <label className="bleed-label">{ui.tradingType}</label>
              <div className="bleed-type-pills">
                <button
                  type="button"
                  className={`bleed-type-btn ${type === "futures" ? "bleed-type-btn--active" : ""}`}
                  onClick={() => setType("futures")}
                >
                  <Ico k="bolt" />{ui.futures}
                </button>
                <button
                  type="button"
                  className={`bleed-type-btn ${type === "spot" ? "bleed-type-btn--active" : ""}`}
                  onClick={() => setType("spot")}
                >
                  <Ico k="coin" />{ui.spot}
                </button>
              </div>
            </div>

            <div className="bleed-control-group">
              <div className="bleed-slider-header">
                <label className="bleed-label">{ui.monthlyVol}</label>
                <span className="bleed-vol-value font-mono">
                  ${currentVol.toLocaleString()} {ui.unit}
                </span>
              </div>
              <div className="bleed-slider-wrapper">
                <input
                  type="range"
                  min="0"
                  max={VOL_TIERS.length - 1}
                  value={volIndex}
                  onChange={(e) => setVolIndex(Number(e.target.value))}
                  className="bleed-slider"
                  aria-label={ui.monthlyVol}
                />
              </div>
              <div className="bleed-slider-ticks font-mono">
                <span>$5K</span>
                <span>$100K</span>
                <span>$1M+</span>
              </div>
            </div>
          </div>

          {/* 右侧：双轨流光对决与动态诊断卡片 */}
          <div className="bleed-analyzer__verdict-card">
            <div className="bleed-verdict__top">
              <span className="bleed-verdict__venue" translate="no" lang="en">{db.name}</span>
            </div>

            <h3 className="bleed-verdict__heading">{ui.bleedResultTitle}</h3>
            <p className="bleed-verdict__alert">{String(ui.statusHigh).replace(/^[^\p{L}\p{N}]+/u, "")}</p>
            {reviewedBaseFee && reviewedBaseFeeCopy && (
              <details className="bleed-fee-source">
                <summary>{feeText.checked}: {reviewedBaseFee.checkedAt} · {formattedRate} · {reviewedBaseFeeCopy.tier}</summary>
                <p>{reviewedBaseFeeCopy.scope}</p>
                <p>{ui.monthlyVol} {currentVol.toLocaleString()} {ui.unit} × {formattedRate} × 12</p>
                <SourceLink locale={locale} market={market} href={reviewedBaseFee.sourceUrl} target="_blank" rel="noopener noreferrer">{feeText.source} ↗</SourceLink>
              </details>
            )}

            {/* 双轨损耗对比流光矩阵 (Dual-Track Liquidity Comparison) */}
            <div className="bleed-dual-track">
              <div className="bleed-track-item">
                <div className="bleed-track-header">
                  <span className="bleed-track-title bleed-track-title--red">
                    <span className="bleed-track-dot bleed-track-dot--red"></span>
                    {ui.baseline}
                  </span>
                  <span className="bleed-track-val text-red font-mono">
                    {hasReviewedBaseFee ? <AnimatedNumber value={calculations.annualTotalFee} prefix="-$" suffix={ui.perYearSuffix} /> : ui.pending}
                  </span>
                </div>
                <div className="bleed-progress-bar">
                  <div className="bleed-progress-fill bleed-progress-fill--red" style={{ width: "100%" }}></div>
                </div>
              </div>

              <div className="bleed-track-item">
                <div className="bleed-track-header">
                  <span className="bleed-track-title bleed-track-title--green">
                    <span className="bleed-track-dot bleed-track-dot--green"></span>
                    {benefitVerified ? ui.benefitVerified : ui.benefitPending}
                  </span>
                  {benefitVerified && (
                    <span className="bleed-track-val text-green font-mono">
                      {hasReviewedBaseFee ? <AnimatedNumber value={calculations.annualBleed} prefix="+$" suffix={ui.perYearSuffix} /> : ui.pending}
                    </span>
                  )}
                </div>
                <div className="bleed-progress-bar">
                  <div className="bleed-progress-fill bleed-progress-fill--green" style={{ width: benefitVerified ? `${Math.max(1, commercialClaim.rebatePercent)}%` : "0%" }}></div>
                </div>
              </div>
            </div>

            {benefitVerified && (
              <div className="bleed-verdict__numbers">
                <div className="bleed-stat-box bleed-stat-box--bleed">
                  <span className="bleed-stat-label">{ui.annualBleedLabel}</span>
                  <strong className="bleed-stat-val text-red font-mono">
                    {hasReviewedBaseFee ? <AnimatedNumber value={calculations.annualBleed} prefix="-$" suffix={` ${ui.unit}`} /> : ui.pending}
                  </strong>
                </div>

                <div className="bleed-stat-box bleed-stat-box--reclaim">
                  <span className="bleed-stat-label">{ui.reclaimLabel}</span>
                  <strong className="bleed-stat-val text-green font-mono">
                    {hasReviewedBaseFee ? <AnimatedNumber value={calculations.annualBleed} prefix="+$" suffix={` ${ui.unit}`} /> : ui.pending}
                  </strong>
                </div>
              </div>
            )}

            <div className="bleed-solution-box">
              <div className="bleed-solution-header">
                <span className="bleed-solution-title">{ui.solutionTitle}</span>
                {benefitVerified && <span className="bleed-seats-counter"><Ico k="check" />{ui.verified}: {formatPercent(locale, commercialClaim.rebatePercent)}</span>}
              </div>

              {inviteCode && (
                <div className="bleed-code-row">
                  <span>{ui.codeLabel}</span>
                  <button type="button" onClick={handleCopy} className="bleed-copy-code-btn font-mono">
                    {inviteCode} <Ico k={visibleCopyResult?.status === "copied" ? "check" : "copy"} />{visibleCopyResult?.status === "copied" ? copyFeedback.copied : ui.copyBtn}
                  </button>
                  {visibleCopyResult?.status === "failed" && <span className="bleed-copy-status" role="status" aria-live="polite">{copyFeedback.failed}</span>}
                  {visibleCopyResult?.status === "failed" && <input className="bleed-manual-copy" aria-label={copyFeedback.codeLabel} readOnly value={visibleCopyResult.value} onFocus={(event) => event.currentTarget.select()} dir="ltr" />}
                </div>
              )}

              <div className="bleed-action-buttons">
                <a
                  href={regUrl}
                  target={directRoute ? "_blank" : undefined}
                  rel={directRoute ? "sponsored noopener noreferrer" : undefined}
                  className="bleed-cta-btn"
                  data-cta-kind={directRoute ? "registration" : "research"}
                  data-cta-platform={selectedSlug}
                  data-cta-placement="bleed-analyzer"
                  data-cta-status={commercialClaim.status}
                  data-growth-decision={`fee_${selectedSlug}`}
                  data-growth-placement="bleed-analyzer"
                  data-growth-market={market}
                  data-growth-product={product}
                >
                  {directRoute ? ui.ctaReclaim : ui.reviewOfficial}
                </a>

                {/* 核心闭环：一键带参同步至 Telegram 机器人 */}
                <a
                  href={telegramFunnel.deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bleed-tg-sync-btn"
                  title={returnCopy.botFeeOpen}
                  data-cta-kind="telegram"
                  data-cta-placement="bleed-analyzer-telegram"
                  data-growth-decision={`fee_${selectedSlug}`}
                  data-growth-placement="bleed-analyzer"
                  data-growth-market={market}
                  data-growth-product={product}
                  data-telegram-start={telegramFunnel.startPayload}
                  data-telegram-return-href={telegramFunnel.returnHref}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="bleed-tg-icon">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" fill="currentColor"/>
                  </svg>
                  <span>{returnCopy.botFeeOpen}</span>
                </a>
              </div>

              <DecisionReturnLink href={decisionReturnHref} locale={locale} />

              <div className="bleed-embed-row">
                <button
                  type="button"
                  onClick={handleEmbedCopy}
                  className="bleed-embed-btn"
                  title={ui.embedTitle}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                  <span>{visibleEmbedCopy?.status === "copied" ? ui.embedSuccess : ui.embed}</span>
                </button>
                {visibleEmbedCopy?.status === "failed" && <span className="bleed-copy-status" role="status" aria-live="polite">{copyFeedback.failed}</span>}
                {visibleEmbedCopy?.status === "failed" && <textarea className="bleed-manual-copy bleed-manual-copy--embed" aria-label={copyFeedback.embedLabel} readOnly value={visibleEmbedCopy.value} onFocus={(event) => event.currentTarget.select()} dir="ltr" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TradingBleedAnalyzer;
