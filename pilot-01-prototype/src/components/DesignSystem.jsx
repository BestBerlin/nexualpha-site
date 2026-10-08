import { useState } from "react";
import { NexuAlphaWordmark } from "./brand/NexuAlphaWordmark";
import { BrandMark } from "./brand/BrandMark";

const samples = [
  ["Primary", "button-primary"],
  ["Secondary", "button-quiet"],
  ["Disabled", "button-quiet", true],
];

export function DesignSystem() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [copied, setCopied] = useState(false);

  return (
    <main className="v2-page design-system" aria-label="Pilot 01 internal design system">
      <header className="v2-header v2-shell">
        <NexuAlphaWordmark href="/" />
        <span>INTERNAL / DEVELOPMENT ONLY — NexuAlpha v4.0 Component Workbench</span>
      </header>
      <section className="v2-section">
        <div className="section-lead">
          <p>COMPONENT STATES</p>
          <h1>Design system</h1>
          <span>This route is compiled only in development and is not part of the production surface.</span>
        </div>

        <div className="design-system__grid">
          {/* 1. 原生行动按钮测试矩阵 */}
          <article>
            <h2>Actions</h2>
            {samples.map(([label, className, disabled]) => (
              <div key={label} style={{ marginBottom: "0.5rem" }}>
                <span>{label}</span>
                <button type="button" className={className} disabled={disabled}>
                  Explore opportunities →
                </button>
              </div>
            ))}
            <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-dim)" }}>
              <span style={{ display: "block", fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                44px Touch Target & Focus State
              </span>
              <button
                type="button"
                className="yellow-card__btn-register"
                style={{ width: "100%", textAlign: "center", minHeight: "44px" }}
              >
                Primary Conversion CTA (44px min-height) ↗
              </button>
            </div>
          </article>

          {/* 2. 状态标签矩阵 */}
          <article>
            <h2>Opportunity states</h2>
            {["Loading", "Verified", "Pending", "Restricted", "Expired", "Stale"].map((state) => (
              <div key={state} style={{ marginBottom: "0.35rem" }}>
                <span>{state}</span>
                <b className={`ds-state ds-state--${state.toLowerCase()}`}>{state}</b>
              </div>
            ))}
          </article>

          {/* 3. Token 色板与间距标尺 */}
          <article>
            <h2>Tokens</h2>
            <div className="ds-swatches">
              <span>Market</span>
              <span>Surface</span>
              <span>Action</span>
              <span>Positive</span>
            </div>
            <div style={{ marginTop: "1rem", display: "grid", gap: "0.5rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span className="nxa-badge nxa-badge--blue">Blue 20% Rebate</span>
                <span className="nxa-badge nxa-badge--green">AA+ Rated</span>
                <span className="nxa-badge nxa-badge--gold">VIP Tier</span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                Four-layer depth: Base (#07080b) → S1 (0.045) → S2 (0.075) → S3 (0.98)
              </div>
            </div>
          </article>

          {/* 4. 真实黄页卡片与复制状态样本 */}
          <article style={{ gridColumn: "1 / -1" }}>
            <h2>Real Component Sample: Yellow Card &amp; Outbound State</h2>
            <div style={{ maxWidth: "420px", marginTop: "1rem" }}>
              <article className="yellow-card yellow-card--cex" style={{ margin: 0 }}>
                <div className="yellow-card__top">
                  <div className="yellow-card__identity">
                    <div className="yellow-card__brand">
                      <BrandMark slug="binance" compact />
                      <span className="yellow-card__name">Binance (币安)</span>
                    </div>
                    <div className="yellow-card__badges">
                      <span className="yellow-card__category">CEX</span>
                      <span className="yellow-card__trust" style={{ color: "var(--positive)" }}>AA+</span>
                    </div>
                  </div>
                  <div className="yellow-card__domain-row">
                    <div className="yellow-card__domain">
                      <span></span>
                      <span>binance.com</span>
                    </div>
                    <span className="yellow-card__por-pill"> 103.4% Merkle</span>
                  </div>
                  <p className="yellow-card__fit">全球流动性基准，适合主流现货与深盘口合约交易。</p>
                </div>
                <div style={{ marginTop: "auto" }}>
                  <div className="yellow-card__perk-row">
                    <div className="yellow-card__perk-code-line">
                      <span style={{ color: "#94a3b8" }}>邀请码:</span>
                      <button
                        type="button"
                        className="yellow-card__code yellow-card__code--btn"
                        onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                      >
                        <strong>NEXUALPHA</strong>
                        <span>{copied ? "✓" : "Copy"}</span>
                      </button>
                    </div>
                    <span className="yellow-card__perk-text">专享 20% 终身手续费自动回血返还</span>
                  </div>
                  <div className="yellow-card__actions">
                    <a href="/exchanges/binance" className="yellow-card__btn-detail">查看维基详情</a>
                    <a href="https://www.binance.com" target="_blank" rel="noopener noreferrer" className="yellow-card__btn-register">
                      官方直达 ↗
                    </a>
                  </div>
                </div>
              </article>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
